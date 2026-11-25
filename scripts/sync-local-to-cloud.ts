import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { seedCategoriesAndSettings } from '../apps/api/src/utils/seed-defaults';

const localUrl =
  process.env.LOCAL_DATABASE_URL ||
  'postgresql://sweetmarket:sweetmarket_pass@127.0.0.1:5432/sweetmarket_db?schema=public&pgbouncer=true&connection_limit=1';

const cloudUrl = process.env.CLOUD_DATABASE_URL || process.argv[2];

async function sync() {
  if (!cloudUrl || !cloudUrl.startsWith('postgres')) {
    console.error('Usage: CLOUD_DATABASE_URL="postgresql://..." npm run db:sync-cloud');
    process.exit(1);
  }

  console.log('🔧 Pushing Prisma schema to cloud DB...');
  const schemaPath = path.resolve(__dirname, '../apps/api/prisma/schema.prisma');
  execSync(`npx prisma db push --schema="${schemaPath}" --skip-generate`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: cloudUrl },
  });

  const local = new PrismaClient({ datasources: { db: { url: localUrl } } });
  const cloud = new PrismaClient({ datasources: { db: { url: cloudUrl } } });

  try {
    console.log('🌱 Syncing base categories & settings to cloud DB...');
    await seedCategoriesAndSettings(cloud);

    const cloudCats = await cloud.category.findMany();
    const catBySlug = new Map(cloudCats.map((c) => [c.slug, c.id]));

    const users = await local.user.findMany({
      include: { customerProfile: true, sellerProfile: { include: { availabilities: true } } },
    });

    const sellerIdMap = new Map<string, string>();
    const userIdMap = new Map<string, string>();

    for (const u of users) {
      const existing = await cloud.user.findUnique({ where: { phone: u.phone } });
      const targetUser =
        existing ||
        (await cloud.user.create({
          data: {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone,
            email: u.email,
            passwordHash: u.passwordHash,
            role: u.role,
            status: u.status,
            mustChangePassword: u.mustChangePassword,
          },
        }));
      userIdMap.set(u.id, targetUser.id);

      if (u.customerProfile) {
        const existingCp = await cloud.customerProfile.findUnique({ where: { userId: targetUser.id } });
        if (!existingCp) {
          await cloud.customerProfile.create({
            data: { userId: targetUser.id, preferredAddress: u.customerProfile.preferredAddress },
          });
        }
      }

      if (u.sellerProfile) {
        const sp = u.sellerProfile;
        const existingSp = await cloud.sellerProfile.findUnique({ where: { userId: targetUser.id } });
        const targetSp =
          existingSp ||
          (await cloud.sellerProfile.create({
            data: {
              id: sp.id,
              userId: targetUser.id,
              storeName: sp.storeName,
              slug: sp.slug,
              description: sp.description,
              publicPhone: sp.publicPhone,
              showPublicPhone: sp.showPublicPhone,
              address: sp.address,
              city: sp.city,
              district: sp.district,
              serviceArea: sp.serviceArea,
              logoUrl: sp.logoUrl,
              coverImageUrl: sp.coverImageUrl,
              approvalStatus: sp.approvalStatus,
              telegramConnected: sp.telegramConnected,
              telegramChatId: sp.telegramChatId,
            },
          }));
        sellerIdMap.set(sp.id, targetSp.id);
      }
    }

    const products = await local.product.findMany({
      include: { category: true, images: true, ingredients: true },
    });

    const productIdMap = new Map<string, string>();
    for (const p of products) {
      const targetSellerId = sellerIdMap.get(p.sellerId);
      const targetCategoryId = catBySlug.get(p.category.slug) || p.categoryId;
      if (!targetSellerId) continue;

      const existingProd = await cloud.product.findUnique({ where: { id: p.id } });
      if (!existingProd) {
        await cloud.product.create({
          data: {
            id: p.id,
            sellerId: targetSellerId,
            categoryId: targetCategoryId,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: p.price,
            currency: p.currency,
            preparationTimeHours: p.preparationTimeHours,
            portionSize: p.portionSize,
            weightGrams: p.weightGrams,
            minimumQuantity: p.minimumQuantity,
            availabilityStatus: p.availabilityStatus,
            isHiddenByAdmin: p.isHiddenByAdmin,
            images: {
              create: p.images.map((img) => ({
                url: img.url,
                isCover: img.isCover,
                displayOrder: img.displayOrder,
              })),
            },
            ingredients: {
              create: p.ingredients.map((ing) => ({
                name: ing.name,
                isAllergen: ing.isAllergen,
              })),
            },
          },
        });
      }
      productIdMap.set(p.id, p.id);
    }

    const orders = await local.order.findMany({
      include: { items: true, statusHistory: true },
    });
    for (const o of orders) {
      const targetCustomerId = userIdMap.get(o.customerId);
      const targetSellerId = sellerIdMap.get(o.sellerId);
      if (!targetCustomerId || !targetSellerId) continue;

      const existingOrd = await cloud.order.findUnique({ where: { orderNumber: o.orderNumber } });
      if (!existingOrd) {
        const validItems = o.items.filter((it) => productIdMap.has(it.productId));
        if (validItems.length === 0) continue;

        await cloud.order.create({
          data: {
            id: o.id,
            orderNumber: o.orderNumber,
            customerId: targetCustomerId,
            sellerId: targetSellerId,
            status: o.status,
            subtotal: o.subtotal,
            deliveryFee: o.deliveryFee,
            total: o.total,
            currency: o.currency,
            requestedDate: o.requestedDate,
            requestedTime: o.requestedTime,
            deliveryType: o.deliveryType,
            deliveryAddress: o.deliveryAddress,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerMessage: o.customerMessage,
            sellerNotes: o.sellerNotes,
            items: {
              create: validItems.map((it) => ({
                productId: productIdMap.get(it.productId)!,
                productNameSnapshot: it.productNameSnapshot,
                productImageSnapshot: it.productImageSnapshot,
                unitPriceSnapshot: it.unitPriceSnapshot,
                quantity: it.quantity,
                lineTotal: it.lineTotal,
              })),
            },
            statusHistory: {
              create: o.statusHistory.map((h) => ({
                fromStatus: h.fromStatus,
                toStatus: h.toStatus,
                note: h.note,
              })),
            },
          },
        });
      }
    }

    // Upload any local disk images into UploadedFile table
    const uploadDir = path.resolve(__dirname, '../apps/api/uploads');
    if (fs.existsSync(uploadDir)) {
      for (const filename of fs.readdirSync(uploadDir)) {
        const fullPath = path.join(uploadDir, filename);
        if (!fs.statSync(fullPath).isFile()) continue;
        const buf = fs.readFileSync(fullPath);
        await cloud.uploadedFile.upsert({
          where: { filename },
          update: {},
          create: {
            filename,
            mimeType: filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
            data: buf,
            size: buf.length,
          },
        });
      }
    }

    console.log(`✅ Cloud DB sync complete! Synced ${users.length} users, ${products.length} products, ${orders.length} orders.`);
  } finally {
    await local.$disconnect();
    await cloud.$disconnect();
  }
}

sync().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
