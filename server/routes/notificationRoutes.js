import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { getNotifications, markRead } from '../controllers/notificationController.js';
const router = Router();
router.use(authenticate);
router.get('/', getNotifications);
router.patch('/read', markRead);
export default router;
