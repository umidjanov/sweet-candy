import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  customerRegisterSchema,
  sellerRegisterSchema,
  loginSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.get('/check-email', AuthController.checkEmail);
router.post('/register/customer', validate({ body: customerRegisterSchema }), AuthController.registerCustomer);
router.post('/register/seller', validate({ body: sellerRegisterSchema }), AuthController.registerSeller);
router.post('/login', validate({ body: loginSchema }), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), AuthController.changePassword);

export default router;

