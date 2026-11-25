import { prisma } from '../config/database';
import { SellerApprovalStatus, UserRole, UserStatus } from '@prisma/client';
import { hashPassword } from '../utils/password';

export class AdminService {
  static async logAction(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    metadata?: any;
    ipAddress?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
      },
    });
  }

  static async getPlatformStats() {
    const [
      totalUsers,
      totalCustomers,
      totalSellers,
      pendingSellers,
      approvedSellers,
      suspendedSellers,
      totalProducts,
      activeProducts,
      orders,
      recentUsers,
      recentOrders,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.sellerProfile.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.sellerProfile.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.sellerProfile.count({ where: { approvalStatus: 'SUSPENDED' } }),
      prisma.product.count(),
      prisma.product.count({ where: { availabilityStatus: 'AVAILABLE', isHiddenByAdmin: false } }),
      prisma.order.findMany({ select: { status: true, total: true } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, phone: true, role: true, createdAt: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { storeName: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED').length;
    const totalRevenue = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.total), 0);

    return {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        sellers: totalSellers,
      },
      sellers: {
        pending: pendingSellers,
        approved: approvedSellers,
        suspended: suspendedSellers,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        totalRevenue,
      },
      recent: {
        users: recentUsers,
        orders: recentOrders,
        auditLogs: recentAuditLogs,
      },
    };
  }

  static async getUsers(params: { search?: string; role?: UserRole; status?: UserStatus; page?: number | string; limit?: number | string }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 100));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          mustChangePassword: true,
          createdAt: true,
          sellerProfile: { select: { id: true, storeName: true, approvalStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async updateUserStatus(adminUserId: string, targetUserId: string, status: UserStatus, ip?: string) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new Error('User not found');
    if (user.role === 'ADMIN') throw new Error('Cannot change administrator account status');

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status },
    });

    await this.logAction({
      userId: adminUserId,
      action: `USER_STATUS_${status}`,
      entity: 'USER',
      entityId: targetUserId,
      metadata: { previousStatus: user.status, newStatus: status },
      ipAddress: ip,
    });

    return updated;
  }

  static async resetUserPassword(adminUserId: string, targetUserId: string, newPassword: string, ip?: string) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new Error('User not found');
    if (user.role === 'ADMIN' && user.id !== adminUserId) {
      throw new Error('Cannot reset another administrator password');
    }

    const passwordHash = await hashPassword(newPassword);

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        mustChangePassword: true,
      },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: targetUserId },
      data: { revoked: true },
    });

    await this.logAction({
      userId: adminUserId,
      action: 'USER_PASSWORD_RESET',
      entity: 'USER',
      entityId: targetUserId,
      metadata: {
        targetPhone: user.phone,
        targetEmail: user.email,
        role: user.role,
      },
      ipAddress: ip,
    });

    return updated;
  }

  static async getSellers(params: { status?: SellerApprovalStatus; search?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.approvalStatus = params.status;
    if (params.search) {
      where.OR = [
        { storeName: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { serviceArea: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [sellers, total] = await Promise.all([
      prisma.sellerProfile.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, status: true } },
          _count: { select: { products: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sellerProfile.count({ where }),
    ]);

    return { sellers, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async updateSellerApproval(adminUserId: string, sellerId: string, approvalStatus: SellerApprovalStatus, ip?: string) {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!seller) throw new Error('Seller not found');

    const updated = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: { approvalStatus },
    });

    // Notify seller user
    await prisma.notification.create({
      data: {
        userId: seller.userId,
        type: 'SELLER_APPLICATION',
        title: `Seller Account ${approvalStatus}`,
        message: `Your store verification status has been updated to: ${approvalStatus}.`,
        linkUrl: `/seller/dashboard`,
      },
    });

    await this.logAction({
      userId: adminUserId,
      action: `SELLER_APPROVAL_${approvalStatus}`,
      entity: 'SELLER_PROFILE',
      entityId: sellerId,
      metadata: { previousStatus: seller.approvalStatus, newStatus: approvalStatus },
      ipAddress: ip,
    });

    return updated;
  }

  static async moderateProduct(adminUserId: string, productId: string, isHidden: boolean, ip?: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isHiddenByAdmin: isHidden },
    });

    await this.logAction({
      userId: adminUserId,
      action: isHidden ? 'PRODUCT_HIDDEN' : 'PRODUCT_RESTORED',
      entity: 'PRODUCT',
      entityId: productId,
      ipAddress: ip,
    });

    return updated;
  }

  static async getAllOrders(params: { status?: any; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          seller: { select: { id: true, storeName: true } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);

    return { logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

