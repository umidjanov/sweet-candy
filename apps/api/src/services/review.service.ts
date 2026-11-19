import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class ReviewService {
  static async createReview(data: {
    customerId: string;
    orderId: string;
    productId: string;
    rating: number;
    comment: string;
    imageUrl?: string;
  }) {
    // 1. Verify that order exists, belongs to this customer, and status is COMPLETED
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
        seller: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.customerId !== data.customerId) {
      throw new Error('Unauthorized to review an order placed by another user');
    }

    if (order.status !== 'COMPLETED') {
      throw new Error('Reviews can only be submitted after the order has been completed and delivered.');
    }

    // 2. Verify that the product was actually part of this order
    const hasProduct = order.items.some((i) => i.productId === data.productId);
    if (!hasProduct) {
      throw new Error('This product was not part of the specified order.');
    }

    // 3. Prevent duplicate reviews
    const existing = await prisma.review.findUnique({
      where: {
        orderId_productId: {
          orderId: data.orderId,
          productId: data.productId,
        },
      },
    });

    if (existing) {
      throw new Error('You have already submitted a review for this product in this order.');
    }

    // 4. Create review and recalculate ratings in transaction
    const review = await prisma.$transaction(async (tx) => {
      const rev = await tx.review.create({
        data: {
          customerId: data.customerId,
          orderId: data.orderId,
          productId: data.productId,
          rating: data.rating,
          comment: data.comment,
          imageUrl: data.imageUrl,
        },
      });

      // Recalculate product rating
      const productReviews = await tx.review.findMany({
        where: { productId: data.productId, isHidden: false },
        select: { rating: true },
      });

      const prodAvg =
        productReviews.reduce((sum, r) => sum + r.rating, 0) / (productReviews.length || 1);

      await tx.product.update({
        where: { id: data.productId },
        data: {
          ratingAverage: new Prisma.Decimal(prodAvg.toFixed(2)),
          ratingCount: productReviews.length,
        },
      });

      // Recalculate seller rating across all seller's products
      const sellerProducts = await tx.product.findMany({
        where: { sellerId: order.sellerId },
        select: { id: true },
      });
      const sellerProdIds = sellerProducts.map((p) => p.id);

      const allSellerReviews = await tx.review.findMany({
        where: { productId: { in: sellerProdIds }, isHidden: false },
        select: { rating: true },
      });

      const sellerAvg =
        allSellerReviews.reduce((sum, r) => sum + r.rating, 0) / (allSellerReviews.length || 1);

      await tx.sellerProfile.update({
        where: { id: order.sellerId },
        data: {
          ratingAverage: new Prisma.Decimal(sellerAvg.toFixed(2)),
          ratingCount: allSellerReviews.length,
        },
      });

      // In-app notification to seller
      await tx.notification.create({
        data: {
          userId: order.seller.userId,
          type: 'NEW_REVIEW',
          title: 'New Sweet Review Received',
          message: `A customer left a ${data.rating}-star review on your dessert!`,
          linkUrl: `/seller/reviews`,
        },
      });

      return rev;
    });

    return review;
  }

  static async getProductReviews(productId: string) {
    return prisma.review.findMany({
      where: { productId, isHidden: false },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getSellerReviews(sellerId: string) {
    return prisma.review.findMany({
      where: {
        product: { sellerId },
        isHidden: false,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        product: { select: { id: true, name: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

