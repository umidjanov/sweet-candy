import { Router } from 'express';
import { TelegramController } from '../controllers/telegram.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Seller Telegram configuration
router.post('/connect-token', authenticate, requireRole('SELLER'), TelegramController.getConnectToken);
router.get('/status', authenticate, requireRole('SELLER'), TelegramController.getStatus);
router.post('/disconnect', authenticate, requireRole('SELLER'), TelegramController.disconnect);

// Public webhook called by Telegram servers or simulation testing
router.post('/webhook', TelegramController.handleWebhook);

export default router;

