import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess, sendError } from '../utils/response';

export class AdminController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getPlatformStats();
      return sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getUsers(req.query as any);
      return sendSuccess(res, result.users, undefined, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const { status } = req.body;
      const updated = await AdminService.updateUserStatus(adminId, req.params.id, status, req.ip);
      return sendSuccess(res, updated, 'User status updated');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'UPDATE_FAILED');
    }
  }

  static async resetUserPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const { password } = req.body;
      const updated = await AdminService.resetUserPassword(adminId, req.params.id, password, req.ip);
      return sendSuccess(res, updated, 'Temporary password set successfully');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'PASSWORD_RESET_FAILED');
    }
  }

  static async getSellers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getSellers(req.query as any);
      return sendSuccess(res, result.sellers, undefined, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  static async updateSellerApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const { status } = req.body;
      const updated = await AdminService.updateSellerApproval(adminId, req.params.id, status, req.ip);
      return sendSuccess(res, updated, `Seller application marked as ${status}`);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'APPROVAL_FAILED');
    }
  }

  static async moderateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const { isHidden } = req.body;
      const updated = await AdminService.moderateProduct(adminId, req.params.id, isHidden, req.ip);
      return sendSuccess(res, updated, isHidden ? 'Product hidden' : 'Product visible');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'MODERATION_FAILED');
    }
  }

  static async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getAllOrders(req.query as any);
      return sendSuccess(res, result.orders, undefined, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await AdminService.getAuditLogs(page, limit);
      return sendSuccess(res, result.logs, undefined, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }
}

