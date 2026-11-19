import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/', authenticate, upload.single('image'), UploadController.uploadImage);
router.post('/multiple', authenticate, upload.array('images', 10), UploadController.uploadMultipleImages);

export default router;
