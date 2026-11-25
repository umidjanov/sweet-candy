import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireRole('CUSTOMER', 'SELLER', 'ADMIN'));
router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.patch('/items/:id', CartController.updateItem);
router.delete('/items/:id', CartController.removeItem);
router.delete('/', CartController.clearCart);

export default router;

