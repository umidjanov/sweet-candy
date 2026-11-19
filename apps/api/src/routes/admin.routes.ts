import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Strictly protected admin operations
router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.get('/sellers', AdminController.getSellers);
router.patch('/sellers/:id/approval', AdminController.updateSellerApproval);
router.patch('/products/:id/moderation', AdminController.moderateProduct);
router.get('/orders', AdminController.getAllOrders);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;

