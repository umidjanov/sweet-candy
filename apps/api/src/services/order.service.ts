import { prisma } from '../config/database';
import { generateOrderNumber } from '../utils/order-number';
import { TelegramService } from '../integrations/telegram/telegram.service';
import { DeliveryType, OrderStatus, Prisma } from '@prisma/client';

export class OrderService {
  /**
   * Places an order for a specific seller
   * Validates product availability, seller status, computes exact pricing on backend,
   * freezes snapshots, writes status history, and dispatches Telegram notification.
   */
  static async createOrder(data: {
    customerId: string;
    sellerId: string;
    items: { productId: string; quantity: number }[];
    requestedDate: string;
    requestedTime: string;
    deliveryType: DeliveryType;
    deliveryAddress?: string;
    customerName: string;
    customerPhone: string;
    customerMessage?: string;
  }) {
    // 1. Verify seller
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: data.sellerId },
      include: { user: true },
    });

    if (!seller || seller.approvalStatus !== 'APPROVED' || seller.user.status !== 'ACTIVE') {
      throw new Error('This bakery is currently unavailable to accept orders.');
    }

    // 2. Fetch and validate all products
    const productIds = data.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        sellerId: data.sellerId,
        isHiddenByAdmin: false,
      },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (dbProducts.length !== productIds.length) {
      throw new Error('One or more selected products are invalid or do not belong to this seller.');
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 3. Compute price snapshots
    let subtotal = new Prisma.Decimal(0);
    const orderItemsData: any[] = [];

    let isPreOrder = false;

    for (const item of data.items) {
      const prod = productMap.get(item.productId);
      if (!prod) continue;

      if (prod.availabilityStatus === 'UNAVAILABLE') {
        throw new Error(`Product "${prod.name}" is currently unavailable.`);
      }

      if (prod.availabilityStatus === 'PRE_ORDER_ONLY' || prod.availabilityStatus === 'OUT_OF_STOCK') {
        isPreOrder = true;
      }

      if (item.quantity < prod.minimumQuantity) {
        throw new Error(`Minimum order quantity for "${prod.name}" is ${prod.minimumQuantity}.`);
      }

      const unitPrice = new Prisma.Decimal(prod.price);
      const lineTotal = unitPrice.mul(item.quantity);
      subtotal = subtotal.add(lineTotal);

      const coverImage = prod.images[0]?.url || null;

      orderItemsData.push({
        productId: prod.id,
        productNameSnapshot: prod.name,
        productImageSnapshot: coverImage,
        unitPriceSnapshot: unitPrice,
        quantity: item.quantity,
        lineTotal: lineTotal,
      });
    }

    // Delivery fee logic
    const deliveryFee = data.deliveryType === 'DELIVERY' ? new Prisma.Decimal(25000) : new Prisma.Decimal(0); // 25,000 UZS standard delivery fee
    const total = subtotal.add(deliveryFee);
    const orderNumber = generateOrderNumber();

    // 4. ACID Transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          sellerId: data.sellerId,
          status: 'PENDING',
          subtotal,
          deliveryFee,
          total,
          currency: 'UZS',
          requestedDate: new Date(data.requestedDate),
          requestedTime: data.requestedTime,
          deliveryType: data.deliveryType,
          deliveryAddress: data.deliveryAddress || null,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerMessage: data.customerMessage || null,
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: {
              toStatus: 'PENDING',
              changedByUserId: data.customerId,
              note: isPreOrder ? 'Pre-order placed by customer' : 'Order placed by customer',
            },
          },
        },
        include: {
          items: true,
          seller: true,
        },
      });

      // In-app notification for seller
      await tx.notification.create({
        data: {
          userId: seller.userId,
          type: 'ORDER_CREATED',
          title: 'New Order Received',
          message: `Order #${order.orderNumber} for ${Number(total).toLocaleString()} UZS has arrived.`,
          linkUrl: `/seller/orders/${order.id}`,
        },
      });

      // In-app notification for customer
      await tx.notification.create({
        data: {
          userId: data.customerId,
          type: 'ORDER_CREATED',
          title: 'Order Confirmed',
          message: `Your order #${order.orderNumber} has been received by ${seller.storeName}.`,
          linkUrl: `/account/orders/${order.id}`,
        },
      });

      return order;
    });

    // 5. Asynchronous Telegram dispatch (non-blocking so Telegram errors don't roll back the DB transaction)
    TelegramService.sendOrderNotification(newOrder.id).catch((err) => {
      console.error(`Telegram notification error for order ${newOrder.id}:`, err);
    });

    return newOrder;
  }

  static async getCustomerOrders(customerId: string) {
    return prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        seller: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            publicPhone: true,
            showPublicPhone: true,
            logoUrl: true,
          },
        },
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getSellerOrders(sellerId: string, status?: OrderStatus) {
    const where: any = { sellerId };
    if (status) {
      where.status = status;
    }

    return prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getOrderById(orderId: string, userId: string, role: string, sellerId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        seller: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            changedByUser: {
              select: { firstName: true, lastName: true, role: true },
            },
          },
        },
        reviews: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Role boundary checks
    if (role === 'CUSTOMER' && order.customerId !== userId) {
      throw new Error('Unauthorized to view this order');
    }

    if (role === 'SELLER' && order.sellerId !== sellerId) {
      throw new Error('Unauthorized to view this order');
    }

    return order;
  }

  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    sellerId?: string,
    isAdmin = false,
    options?: { rejectionReason?: string; sellerNotes?: string }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!isAdmin && order.sellerId !== sellerId) {
      throw new Error('Unauthorized to modify this order');
    }

    const previousStatus = order.status;

    // Transition validation
    const terminalStatuses: OrderStatus[] = ['COMPLETED', 'REJECTED', 'CANCELLED'];
    if (terminalStatuses.includes(previousStatus)) {
      throw new Error(`Order is in terminal status "${previousStatus}" and cannot be modified.`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(options?.rejectionReason && { rejectionReason: options.rejectionReason }),
          ...(options?.sellerNotes && { sellerNotes: options.sellerNotes }),
          statusHistory: {
            create: {
              fromStatus: previousStatus,
              toStatus: newStatus,
              changedByUserId: userId,
              note: options?.sellerNotes || (newStatus === 'REJECTED' ? options?.rejectionReason : `Status updated to ${newStatus}`),
            },
          },
        },
      });

      // In-app notification to customer
      const statusTitleMap: Record<string, string> = {
        ACCEPTED: 'Order Accepted!',
        PREPARING: 'Baking in Progress!',
        READY: 'Order Ready!',
        OUT_FOR_DELIVERY: 'Sweet Delivery on the Way!',
        COMPLETED: 'Order Delivered!',
        REJECTED: 'Order Update: Declined',
      };

      const title = statusTitleMap[newStatus] || `Order Status: ${newStatus}`;
      const message =
        newStatus === 'REJECTED'
          ? `Your order #${ord.orderNumber} was declined by the seller: ${options?.rejectionReason || 'Bakery unavailable'}`
          : `Your order #${ord.orderNumber} status changed to ${newStatus}.`;

      await tx.notification.create({
        data: {
          userId: ord.customerId,
          type: 'ORDER_READY',
          title,
          message,
          linkUrl: `/account/orders/${ord.id}`,
        },
      });

      return ord;
    });

    return updated;
  }

  static async cancelOrder(orderId: string, customerId: string, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: true },
    });

    if (!order) throw new Error('Order not found');
    if (order.customerId !== customerId) throw new Error('Unauthorized');

    // Only allow customer to cancel if status is PENDING or ACCEPTED (before PREPARING)
    if (order.status !== 'PENDING' && order.status !== 'ACCEPTED') {
      throw new Error('Order preparation has already started and cannot be cancelled online. Please contact the seller directly.');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason || 'Cancelled by customer',
          statusHistory: {
            create: {
              fromStatus: order.status,
              toStatus: 'CANCELLED',
              changedByUserId: customerId,
              note: reason || 'Cancelled by customer',
            },
          },
        },
      });

      // Notify seller
      await tx.notification.create({
        data: {
          userId: order.seller.userId,
          type: 'ORDER_CANCELLED',
          title: 'Order Cancelled by Customer',
          message: `Order #${order.orderNumber} was cancelled.`,
          linkUrl: `/seller/orders/${order.id}`,
        },
      });

      return updated;
    });
  }
}

