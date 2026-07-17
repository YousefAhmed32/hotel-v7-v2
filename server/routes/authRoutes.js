import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.post('/register',   authController.register);
router.post('/login',      authController.login);
router.post('/refresh',    authController.refresh);
router.post('/logout',     authenticate, authController.logout);
router.get('/me',          authenticate, authController.getMe);
router.patch('/me',        authenticate, authController.updateProfile);
router.patch('/me/password', authenticate, authController.changePassword);
router.post('/reissue',    authenticate, authController.reissueTokens);

export default router;
