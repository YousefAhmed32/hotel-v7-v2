import { Router } from 'express';
import { uploadFile, streamFile, deleteFile, uploadMiddleware } from '../controllers/mediaController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
const router = Router();
router.get('/:fileId', streamFile);
router.post('/upload', authenticate, authorize('owner','manager','receptionist','superadmin'), uploadMiddleware, uploadFile);
router.delete('/:fileId', authenticate, authorize('owner','manager','superadmin'), deleteFile);
export default router;
