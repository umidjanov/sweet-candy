import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { sendSuccess, sendError } from '../utils/response';

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      const order = await OrderService.createOrder({
        customerId: req.user.userId,
        ...req.body,
      });

      return sendSuccess(res, order, 'Order placed successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'ORDER_CREATION_FAILED');
    }
  }

  static async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const orders = await OrderService.getCustomerOrders(req.user.userId);
      return sendSuccess(res, orders);
    } catch (err) {
      next(err);
    }
  }

  static async getSellerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      const { status } = req.query;
      const orders = await OrderService.getSellerOrders(req.user.sellerId, status as any);
      return sendSuccess(res, orders);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const order = await OrderService.getOrderById(
        req.params.id,
        req.user.userId,
        req.user.role,
        req.user.sellerId
      );
      return sendSuccess(res, order);
    } catch (err: any) {
      return sendError(res, err.message, 404, 'NOT_FOUND');
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const isAdmin = req.user.role === 'ADMIN';
      const sellerId = req.user.sellerId;

      const updated = await OrderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.user.userId,
        sellerId,
        isAdmin,
        {
          rejectionReason: req.body.rejectionReason,
          sellerNotes: req.body.sellerNotes,
          trackingUrl: req.body.trackingUrl,
        }
      );

      return sendSuccess(res, updated, `Order status updated to ${req.body.status}`);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'STATUS_UPDATE_FAILED');
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const cancelled = await OrderService.cancelOrder(
        req.params.id,
        req.user.userId,
        req.body.reason
      );
      return sendSuccess(res, cancelled, 'Order cancelled successfully');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'CANCELLATION_FAILED');
    }
  }
}

