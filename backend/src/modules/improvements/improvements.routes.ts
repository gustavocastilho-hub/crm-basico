import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import * as controller from './improvements.controller';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.post('/', controller.create);
router.post('/bulk', controller.bulk);
router.patch('/:id/implemented', requireRole('ADMIN'), controller.setImplemented);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
