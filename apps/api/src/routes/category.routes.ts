import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();

router.get('/', CategoryController.getAll);
router.get('/:slug', CategoryController.getBySlug);
router.post('/', authenticate, requireRole('ADMIN'), validate({ body: createCategorySchema }), CategoryController.create);
router.put('/:id', authenticate, requireRole('ADMIN'), validate({ body: updateCategorySchema }), CategoryController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), CategoryController.delete);

export default router;

