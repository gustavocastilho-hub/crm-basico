import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as plansController from './plans.controller';

const router = Router();

router.use(authenticate);

router.get('/', plansController.list);
router.post('/', plansController.create);
router.delete('/:id', plansController.remove);

export default router;
