import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { sendSuccess, sendError } from '../utils/response';

export class ProductController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.searchProducts(req.query as any);
      return sendSuccess(res, result.products, undefined, 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  static async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getFeaturedProducts();
      return sendSuccess(res, products);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      return sendSuccess(res, product);
    } catch (err: any) {
      return sendError(res, err.message, 404, 'NOT_FOUND');
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) {
        return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      }

      const product = await ProductService.createProduct(req.user.sellerId, req.body);
      return sendSuccess(res, product, 'Product created successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'CREATION_FAILED');
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) {
        return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      }

      const product = await ProductService.updateProduct(req.params.id, req.user.sellerId, req.body);
      return sendSuccess(res, product, 'Product updated successfully');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'UPDATE_FAILED');
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.sellerId) {
        return sendError(res, 'Seller account required', 403, 'FORBIDDEN');
      }

      const { status } = req.body;
      const product = await ProductService.setAvailabilityStatus(req.params.id, req.user.sellerId, status);
      return sendSuccess(res, product, 'Product status updated');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'STATUS_UPDATE_FAILED');
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const sellerId = req.user?.sellerId;
      await ProductService.deleteProduct(req.params.id, sellerId, isAdmin);
      return sendSuccess(res, null, 'Product removed successfully');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'DELETE_FAILED');
    }
  }
}

