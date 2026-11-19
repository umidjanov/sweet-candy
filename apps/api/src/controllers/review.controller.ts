import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { sendSuccess, sendError } from '../utils/response';

export class ReviewController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const review = await ReviewService.createReview({
        customerId: req.user.userId,
        ...req.body,
      });
      return sendSuccess(res, review, 'Review posted successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'REVIEW_FAILED');
    }
  }

  static async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await ReviewService.getProductReviews(req.params.productId);
      return sendSuccess(res, reviews);
    } catch (err) {
      next(err);
    }
  }

  static async getSellerReviews(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      const reviews = await ReviewService.getSellerReviews(req.user.sellerId);
      return sendSuccess(res, reviews);
    } catch (err) {
      next(err);
    }
  }
}

