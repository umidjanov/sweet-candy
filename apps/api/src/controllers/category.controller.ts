import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { sendSuccess, sendError } from '../utils/response';

export class CategoryController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getAllCategories();
      return sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.getCategoryBySlug(req.params.slug);
      return sendSuccess(res, category);
    } catch (err: any) {
      return sendError(res, err.message, 404, 'NOT_FOUND');
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.createCategory(req.body);
      return sendSuccess(res, category, 'Category created', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400, 'CREATION_FAILED');
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body);
      return sendSuccess(res, category, 'Category updated');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'UPDATE_FAILED');
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      return sendSuccess(res, null, 'Category deleted');
    } catch (err: any) {
      return sendError(res, err.message, 400, 'DELETE_FAILED');
    }
  }
}

