import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '../validators/review.validator';

const router = Router();

router.get('/product/:productId', ReviewController.getProductReviews);
router.post('/', authenticate, requireRole('CUSTOMER'), validate({ body: createReviewSchema }), ReviewController.create);
router.get('/seller/my', authenticate, requireRole('SELLER'), ReviewController.getSellerReviews);

export default router;

