import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import * as usersController from './users.controller';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/', usersController.list);
router.post('/', usersController.create);
router.patch('/:id', usersController.update);
router.delete('/:id', usersController.remove);

export default router;
