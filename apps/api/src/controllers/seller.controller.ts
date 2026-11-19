import { Request, Response, NextFunction } from 'express';
import { SellerService } from '../services/seller.service';
import { sendSuccess, sendError } from '../utils/response';

export class SellerController {
  static async listSellers(req: Request, res: Response, next: NextFunction) {
    try {
      const sellers = await SellerService.getApprovedSellers({
        city: req.query.city as string,
        search: req.query.search as string,
      });
      return sendSuccess(res, sellers);
    } catch (err) {
      next(err);
    }
  }

  static async getPublicStore(req: Request, res: Response, next: NextFunction) {
    try {
      const store = await SellerService.getPublicStore(req.params.idOrSlug);
      return sendSuccess(res, store);
    } catch (err: any) {
      return sendError(res, err.message, 404, 'NOT_FOUND');
    }
  }

  static async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      const profile = await SellerService.getSellerProfile(req.user.sellerId);
      return sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  }

  static async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      const updated = await SellerService.updateSellerProfile(req.user.sellerId, req.body);
      return sendSuccess(res, updated, 'Store settings updated');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'UPDATE_FAILED');
    }
  }

  static async setAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      const { schedule } = req.body;
      await SellerService.setAvailability(req.user.sellerId, schedule);
      return sendSuccess(res, null, 'Store availability schedule saved');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'AVAILABILITY_ERROR');
    }
  }

  static async getMyAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      const analytics = await SellerService.getSellerAnalytics(req.user.sellerId);
      return sendSuccess(res, analytics);
    } catch (err) {
      next(err);
    }
  }
}

