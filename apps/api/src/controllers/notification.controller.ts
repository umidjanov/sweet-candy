import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response';

export class NotificationController {
  static async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const data = await NotificationService.getUserNotifications(req.user.userId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      await NotificationService.markAsRead(req.params.id, req.user.userId);
      return sendSuccess(res, null, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      await NotificationService.markAllAsRead(req.user.userId);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}

