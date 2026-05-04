import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import * as controller from './settings.controller';

const router = Router();

router.use(authenticate);

router.get('/commissions', controller.getCommissions);
router.put('/commissions', requireRole('ADMIN'), controller.updateCommissions);

export default router;
