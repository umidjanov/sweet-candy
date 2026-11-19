import { prisma } from '../config/database';

export class CartService {
  static async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { displayOrder: 'asc' } },
                seller: {
                  select: {
                    id: true,
                    storeName: true,
                    slug: true,
                    city: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                  seller: true,
                },
              },
            },
          },
        },
      });
    }

    // Group items by seller for multi-vendor checkout clarity
    const groupedBySeller: Record<string, { seller: any; items: any[]; subtotal: number }> = {};

    let totalAmount = 0;
    for (const item of cart.items) {
      const sellerId = item.product.seller.id;
      if (!groupedBySeller[sellerId]) {
        groupedBySeller[sellerId] = {
          seller: item.product.seller,
          items: [],
          subtotal: 0,
        };
      }
      const lineTotal = Number(item.product.price) * item.quantity;
      groupedBySeller[sellerId].items.push({
        ...item,
        lineTotal,
      });
      groupedBySeller[sellerId].subtotal += lineTotal;
      totalAmount += lineTotal;
    }

    return {
      cartId: cart.id,
      items: cart.items,
      groupedBySeller: Object.values(groupedBySeller),
      totalAmount,
    };
  }

  static async addItem(userId: string, productId: string, quantity = 1) {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.isHiddenByAdmin || product.availabilityStatus === 'UNAVAILABLE') {
      throw new Error('Product is unavailable');
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existing) {
      return prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  static async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(userId, cartItemId);
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new Error('Cart item not found');
    }

    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  static async removeItem(userId: string, cartItemId: string) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new Error('Cart item not found');
    }

    return prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  static async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
}

