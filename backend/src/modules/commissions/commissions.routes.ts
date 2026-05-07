import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import * as commissionsController from './commissions.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido'));
  },
});

const router = Router();

router.use(authenticate);

router.get('/', commissionsController.list);
router.get('/eligible-deals', requireRole('ADMIN'), commissionsController.eligibleDeals);
router.get('/estimate', commissionsController.estimate);
router.post('/batch', requireRole('ADMIN'), commissionsController.createBatch);

router.get('/payments-by-month', commissionsController.listPaymentsByMonth);
router.get('/payment-batches', requireRole('ADMIN'), commissionsController.listPaymentBatches);
router.get('/payment-batches/:batchId', requireRole('ADMIN'), commissionsController.getPaymentBatch);
router.delete('/payment-batches/:batchId', requireRole('ADMIN'), commissionsController.removePaymentBatch);

router.get('/:id/payments', requireRole('ADMIN'), commissionsController.listPayments);
router.post(
  '/:id/payments',
  requireRole('ADMIN'),
  upload.single('receipt'),
  commissionsController.addPayment,
);
router.delete(
  '/:id/payments/:pid',
  requireRole('ADMIN'),
  commissionsController.removePayment,
);

router.patch('/:id/pay', requireRole('ADMIN'), commissionsController.pay);
router.patch('/:id/unpay', requireRole('ADMIN'), commissionsController.unpay);
router.patch('/:id', requireRole('ADMIN'), commissionsController.update);
router.delete('/:id', requireRole('ADMIN'), commissionsController.remove);

export default router;
