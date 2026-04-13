import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as authController from './auth.controller';

const router = Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
