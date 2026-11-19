import { prisma } from '../config/database';

export class SellerService {
  static async getApprovedSellers(params?: { city?: string; search?: string }) {
    const where: any = {
      approvalStatus: 'APPROVED',
      user: { status: 'ACTIVE' },
    };

    if (params?.city) {
      where.city = params.city;
    }

    if (params?.search) {
      where.OR = [
        { storeName: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { serviceArea: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const sellers = await prisma.sellerProfile.findMany({
      where,
      select: {
        id: true,
        storeName: true,
        slug: true,
        description: true,
        city: true,
        serviceArea: true,
        publicPhone: true,
        showPublicPhone: true,
        logoUrl: true,
        coverImageUrl: true,
        ratingAverage: true,
        ratingCount: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { ratingAverage: 'desc' },
    });

    return sellers.map((s) => ({
      ...s,
      publicPhone: s.showPublicPhone ? s.publicPhone : null,
    }));
  }

  static async getPublicStore(slugOrId: string) {
    const seller = await prisma.sellerProfile.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
        approvalStatus: 'APPROVED',
      },
      include: {
        products: {
          where: { isHiddenByAdmin: false, availabilityStatus: { not: 'UNAVAILABLE' } },
          include: {
            images: { orderBy: { displayOrder: 'asc' } },
            category: true,
          },
        },
        availabilities: { orderBy: { dayOfWeek: 'asc' } },
        _count: { select: { orders: true, products: true } },
      },
    });

    if (!seller) {
      throw new Error('Seller store not found');
    }

    return {
      ...seller,
      publicPhone: seller.showPublicPhone ? seller.publicPhone : null,
    };
  }

  static async getSellerProfile(sellerId: string) {
    return prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      include: {
        availabilities: { orderBy: { dayOfWeek: 'asc' } },
        user: { select: { firstName: true, lastName: true, phone: true, email: true } },
      },
    });
  }

  static async updateSellerProfile(sellerId: string, data: any) {
    return prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        ...(data.storeName && { storeName: data.storeName }),
        ...(data.description && { description: data.description }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.serviceArea && { serviceArea: data.serviceArea }),
        ...(data.publicPhone !== undefined && { publicPhone: data.publicPhone }),
        ...(data.showPublicPhone !== undefined && { showPublicPhone: data.showPublicPhone }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
        ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl || null }),
      },
    });
  }

  static async setAvailability(sellerId: string, schedule: { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }[]) {
    await prisma.sellerAvailability.deleteMany({ where: { sellerId } });

    return prisma.sellerAvailability.createMany({
      data: schedule.map((item) => ({
        sellerId,
        dayOfWeek: item.dayOfWeek,
        isOpen: item.isOpen,
        openTime: item.openTime,
        closeTime: item.closeTime,
      })),
    });
  }

  static async getSellerAnalytics(sellerId: string) {
    const [orders, products] = await Promise.all([
      prisma.order.findMany({
        where: { sellerId },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        where: { sellerId },
        select: {
          id: true,
          name: true,
          viewsCount: true,
          availabilityStatus: true,
          _count: { select: { orderItems: true } },
        },
      }),
    ]);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const acceptedOrders = orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'PREPARING').length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED').length;

    const totalSales = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.total), 0);

    const activeProducts = products.filter((p) => p.availabilityStatus === 'AVAILABLE').length;
    const totalViews = products.reduce((sum, p) => sum + p.viewsCount, 0);

    // Monthly orders data for Recharts
    const monthlyDataMap: Record<string, { month: string; orders: number; revenue: number }> = {};
    for (const ord of orders) {
      const monthKey = new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { month: monthKey, orders: 0, revenue: 0 };
      }
      monthlyDataMap[monthKey].orders += 1;
      if (ord.status === 'COMPLETED') {
        monthlyDataMap[monthKey].revenue += Number(ord.total);
      }
    }

    const topSellingProducts = [...products]
      .sort((a, b) => b._count.orderItems - a._count.orderItems)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        ordersCount: p._count.orderItems,
        views: p.viewsCount,
      }));

    return {
      metrics: {
        totalOrders,
        pendingOrders,
        acceptedOrders,
        completedOrders,
        cancelledOrders,
        totalSales,
        activeProducts,
        totalViews,
      },
      chartData: Object.values(monthlyDataMap),
      topProducts: topSellingProducts,
    };
  }
}

