import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { ownershipFilter } from '../../middleware/ownership';
import { requireRole } from '../../middleware/role';
import * as clientsController from './clients.controller';

const router = Router();

router.use(authenticate, ownershipFilter);

router.get('/', clientsController.list);
router.get('/:id', clientsController.get);
router.post('/', clientsController.create);
router.post('/bulk-delete', clientsController.bulkRemove);
router.patch('/:id', clientsController.update);
router.delete('/:id', clientsController.remove);
router.get('/:id/activities', clientsController.getActivities);
router.post('/:id/activities', clientsController.addActivity);

router.post('/:id/form-token', requireRole('ADMIN'), clientsController.generateFormToken);
router.delete('/:id/form-token', requireRole('ADMIN'), clientsController.revokeFormToken);
router.get('/:id/contract-submissions', requireRole('ADMIN'), clientsController.listContractSubmissions);

export default router;
