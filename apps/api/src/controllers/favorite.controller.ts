import { Request, Response, NextFunction } from 'express';
import { FavoriteService } from '../services/favorite.service';
import { sendSuccess, sendError } from '../utils/response';

export class FavoriteController {
  static async getFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const favorites = await FavoriteService.getUserFavorites(req.user.userId);
      return sendSuccess(res, favorites);
    } catch (err) {
      next(err);
    }
  }

  static async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const result = await FavoriteService.toggleFavorite(req.user.userId, req.params.productId);
      return sendSuccess(res, result);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'FAVORITE_ERROR');
    }
  }
}

