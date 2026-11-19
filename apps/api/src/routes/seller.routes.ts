import { Router } from 'express';
import { SellerController } from '../controllers/seller.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', SellerController.listSellers);
router.get('/profile/:idOrSlug', SellerController.getPublicStore);

// Seller dashboard routes
router.get('/me/profile', authenticate, requireRole('SELLER'), SellerController.getMyProfile);
router.put('/me/profile', authenticate, requireRole('SELLER'), SellerController.updateMyProfile);
router.put('/me/availability', authenticate, requireRole('SELLER'), SellerController.setAvailability);
router.get('/me/analytics', authenticate, requireRole('SELLER'), SellerController.getMyAnalytics);

export default router;

