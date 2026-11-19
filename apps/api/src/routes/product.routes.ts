import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '../validators/product.validator';

const router = Router();

router.get('/', validate({ query: productQuerySchema }), ProductController.search);
router.get('/featured', ProductController.getFeatured);
router.get('/:id', ProductController.getById);

router.post('/', authenticate, requireRole('SELLER'), validate({ body: createProductSchema }), ProductController.create);
router.put('/:id', authenticate, requireRole('SELLER'), validate({ body: updateProductSchema }), ProductController.update);
router.patch('/:id/status', authenticate, requireRole('SELLER'), ProductController.updateStatus);
router.delete('/:id', authenticate, requireRole('SELLER', 'ADMIN'), ProductController.delete);

export default router;

