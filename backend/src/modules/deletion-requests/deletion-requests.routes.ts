import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import * as controller from './deletion-requests.controller';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/pending-count', controller.pendingCount);
router.post('/', controller.create);
router.delete('/:id', controller.cancel);
router.patch('/:id/approve', requireRole('ADMIN'), controller.approve);
router.patch('/:id/reject', requireRole('ADMIN'), controller.reject);

export default router;
