import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import cartRoutes from './cart.routes';
import categoryRoutes from './category.routes';
import sellerRoutes from './seller.routes';
import telegramRoutes from './telegram.routes';
import reviewRoutes from './review.routes';
import favoriteRoutes from './favorite.routes';
import adminRoutes from './admin.routes';
import notificationRoutes from './notification.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/categories', categoryRoutes);
router.use('/sellers', sellerRoutes);
router.use('/telegram', telegramRoutes);
router.use('/reviews', reviewRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);

export default router;

