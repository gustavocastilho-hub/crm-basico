import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { ownershipFilter } from '../../middleware/ownership';
import * as tasksController from './tasks.controller';

const router = Router();

router.use(authenticate, ownershipFilter);

router.get('/', tasksController.list);
router.get('/upcoming', tasksController.upcoming);
router.get('/:id', tasksController.get);
router.post('/', tasksController.create);
router.patch('/:id', tasksController.update);
router.delete('/:id', tasksController.remove);

export default router;
