import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as stagesController from './stages.controller';

const router = Router();

router.use(authenticate);

router.get('/', stagesController.list);
router.post('/', stagesController.create);
router.patch('/reorder', stagesController.reorder);
router.patch('/:id', stagesController.update);
router.delete('/:id', stagesController.remove);

export default router;
