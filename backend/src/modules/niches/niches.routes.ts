import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as nichesController from './niches.controller';

const router = Router();

router.use(authenticate);

router.get('/', nichesController.list);
router.post('/', nichesController.create);
router.delete('/:id', nichesController.remove);

export default router;
