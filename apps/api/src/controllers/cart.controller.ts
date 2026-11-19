import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import { sendSuccess, sendError } from '../utils/response';

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const cart = await CartService.getCart(req.user.userId);
      return sendSuccess(res, cart);
    } catch (err) {
      next(err);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const { productId, quantity } = req.body;
      const item = await CartService.addItem(req.user.userId, productId, quantity || 1);
      return sendSuccess(res, item, 'Item added to cart', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'CART_ERROR');
    }
  }

  static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      const { quantity } = req.body;
      const item = await CartService.updateQuantity(req.user.userId, req.params.id, quantity);
      return sendSuccess(res, item, 'Cart updated');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'CART_ERROR');
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      await CartService.removeItem(req.user.userId, req.params.id);
      return sendSuccess(res, null, 'Item removed from cart');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'CART_ERROR');
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      await CartService.clearCart(req.user.userId);
      return sendSuccess(res, null, 'Cart cleared');
    } catch (err) {
      next(err);
    }
  }
}

