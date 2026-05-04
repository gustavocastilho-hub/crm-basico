import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import * as commissionsController from './commissions.controller';

const router = Router();

router.use(authenticate);

router.get('/', commissionsController.list);
router.get('/eligible-deals', requireRole('ADMIN'), commissionsController.eligibleDeals);
router.get('/estimate', commissionsController.estimate);
router.post('/batch', requireRole('ADMIN'), commissionsController.createBatch);
router.patch('/:id/pay', requireRole('ADMIN'), commissionsController.pay);
router.patch('/:id/unpay', requireRole('ADMIN'), commissionsController.unpay);
router.patch('/:id', requireRole('ADMIN'), commissionsController.update);
router.delete('/:id', requireRole('ADMIN'), commissionsController.remove);

export default router;
