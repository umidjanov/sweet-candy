import { prisma } from '../config/database';

export class FavoriteService {
  static async getUserFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => f.product);
  }

  static async toggleFavorite(userId: string, productId: string) {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { isFavorite: false };
    }

    await prisma.favorite.create({
      data: {
        userId,
        productId,
      },
    });

    return { isFavorite: true };
  }
}

