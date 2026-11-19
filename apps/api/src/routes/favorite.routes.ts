import { Router } from 'express';
import { FavoriteController } from '../controllers/favorite.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireRole('CUSTOMER'));
router.get('/', FavoriteController.getFavorites);
router.post('/:productId', FavoriteController.toggle);

export default router;

