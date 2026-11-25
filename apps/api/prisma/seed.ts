import { PrismaClient } from '@prisma/client';
import { seedCategoriesAndSettings } from '../src/utils/seed-defaults';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SweetMarket initial taxonomy and settings...');
  await seedCategoriesAndSettings(prisma);
  console.log('✅ Seed completed successfully: Categories and Settings initialized.');
  console.log('⚠️ Per specifications, no fake customers, no fake sellers, and no fake orders have been created.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
