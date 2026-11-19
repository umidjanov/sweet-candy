import { prisma } from '../config/database';
import { ProductAvailability } from '@prisma/client';

export class ProductService {
  static async searchProducts(params: {
    q?: string;
    categoryId?: string;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    city?: string;
    sort?: 'newest' | 'lowest_price' | 'highest_price' | 'popular' | 'rating';
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const skip = (page - 1) * limit;

    const where: any = {
      isHiddenByAdmin: false,
      seller: {
        approvalStatus: 'APPROVED',
        user: { status: 'ACTIVE' },
      },
    };

    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        {
          ingredients: {
            some: { name: { contains: params.q, mode: 'insensitive' } },
          },
        },
        {
          seller: {
            storeName: { contains: params.q, mode: 'insensitive' },
          },
        },
      ];
    }

    if (params.categoryId) {
      where.OR = [
        { categoryId: params.categoryId },
        { category: { parentId: params.categoryId } },
      ];
    }

    if (params.sellerId) {
      where.sellerId = params.sellerId;
    }

    if (params.city) {
      where.seller = { ...where.seller, city: params.city };
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) where.price.gte = params.minPrice;
      if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
    }

    if (params.rating !== undefined) {
      where.ratingAverage = { gte: params.rating };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (params.sort === 'lowest_price') orderBy = { price: 'asc' };
    if (params.sort === 'highest_price') orderBy = { price: 'desc' };
    if (params.sort === 'popular') orderBy = { viewsCount: 'desc' };
    if (params.sort === 'rating') orderBy = { ratingAverage: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { displayOrder: 'asc' } },
          category: true,
          seller: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              city: true,
              ratingAverage: true,
              ratingCount: true,
              publicPhone: true,
              showPublicPhone: true,
              logoUrl: true,
            },
          },
          ingredients: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => ({
        ...p,
        seller: {
          ...p.seller,
          publicPhone: p.seller.showPublicPhone ? p.seller.publicPhone : null,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getFeaturedProducts(limit = 8) {
    const products = await prisma.product.findMany({
      where: {
        isHiddenByAdmin: false,
        availabilityStatus: { not: 'UNAVAILABLE' },
        seller: {
          approvalStatus: 'APPROVED',
          user: { status: 'ACTIVE' },
        },
      },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
        seller: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            city: true,
            ratingAverage: true,
            logoUrl: true,
          },
        },
      },
      orderBy: [{ ratingAverage: 'desc' }, { viewsCount: 'desc' }],
      take: limit,
    });

    return products;
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
        ingredients: true,
        seller: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            availabilities: { orderBy: { dayOfWeek: 'asc' } },
          },
        },
        reviews: {
          where: { isHidden: false },
          include: {
            customer: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product || product.isHiddenByAdmin) {
      throw new Error('Product not found or unavailable');
    }

    // Increment views asynchronously
    prisma.product
      .update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => {});

    return {
      ...product,
      seller: {
        ...product.seller,
        publicPhone: product.seller.showPublicPhone ? product.seller.publicPhone : null,
      },
    };
  }

  static async createProduct(sellerId: string, data: any) {
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new Error('Seller profile not found');
    }

    if (seller.approvalStatus !== 'APPROVED') {
      throw new Error('Your seller account is pending admin approval before publishing products.');
    }

    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const slug = `${baseSlug}-${randomSuffix}`;

    const product = await prisma.product.create({
      data: {
        sellerId,
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        currency: data.currency || 'UZS',
        preparationTimeHours: data.preparationTimeHours || 4,
        portionSize: data.portionSize,
        weightGrams: data.weightGrams,
        minimumQuantity: data.minimumQuantity || 1,
        availabilityStatus: data.availabilityStatus || 'AVAILABLE',
        images: {
          create: (data.imageUrls || []).map((url: string, index: number) => ({
            url,
            isCover: index === 0,
            displayOrder: index,
          })),
        },
        ingredients: {
          create: (data.ingredients || []).map((ing: { name: string; isAllergen: boolean }) => ({
            name: ing.name,
            isAllergen: ing.isAllergen,
          })),
        },
      },
      include: {
        images: true,
        ingredients: true,
        category: true,
      },
    });

    return product;
  }

  static async updateProduct(productId: string, sellerId: string, data: any) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new Error('Unauthorized to modify this product');
    }

    const updatePayload: any = {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.price && { price: data.price }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.preparationTimeHours !== undefined && { preparationTimeHours: data.preparationTimeHours }),
      ...(data.portionSize !== undefined && { portionSize: data.portionSize }),
      ...(data.weightGrams !== undefined && { weightGrams: data.weightGrams }),
      ...(data.minimumQuantity !== undefined && { minimumQuantity: data.minimumQuantity }),
      ...(data.availabilityStatus && { availabilityStatus: data.availabilityStatus }),
    };

    if (data.ingredients) {
      await prisma.productIngredient.deleteMany({ where: { productId } });
      updatePayload.ingredients = {
        create: data.ingredients.map((ing: { name: string; isAllergen: boolean }) => ({
          name: ing.name,
          isAllergen: ing.isAllergen,
        })),
      };
    }

    if (data.imageUrls) {
      await prisma.productImage.deleteMany({ where: { productId } });
      updatePayload.images = {
        create: data.imageUrls.map((url: string, index: number) => ({
          url,
          isCover: index === 0,
          displayOrder: index,
        })),
      };
    }

    return prisma.product.update({
      where: { id: productId },
      data: updatePayload,
      include: {
        images: true,
        ingredients: true,
        category: true,
      },
    });
  }

  static async setAvailabilityStatus(productId: string, sellerId: string, status: ProductAvailability) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');
    if (product.sellerId !== sellerId) throw new Error('Unauthorized');

    return prisma.product.update({
      where: { id: productId },
      data: { availabilityStatus: status },
    });
  }

  static async deleteProduct(productId: string, sellerId?: string, isAdmin = false) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    if (!isAdmin && product.sellerId !== sellerId) {
      throw new Error('Unauthorized');
    }

    return prisma.product.delete({ where: { id: productId } });
  }
}

