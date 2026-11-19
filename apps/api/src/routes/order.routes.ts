import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator';

const router = Router();

router.post('/', authenticate, requireRole('CUSTOMER'), validate({ body: createOrderSchema }), OrderController.create);
router.get('/my', authenticate, requireRole('CUSTOMER'), OrderController.getMyOrders);
router.get('/seller', authenticate, requireRole('SELLER'), OrderController.getSellerOrders);
router.get('/:id', authenticate, OrderController.getById);
router.patch('/:id/status', authenticate, validate({ body: updateOrderStatusSchema }), OrderController.updateStatus);
router.post('/:id/cancel', authenticate, OrderController.cancel);

export default router;

