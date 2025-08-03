import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all upload routes
router.use(authenticateToken);

// Upload single file
router.post('/single', UploadController.uploadSingle);

// Upload multiple files
router.post('/multiple', UploadController.uploadMultiple);

export default router;
