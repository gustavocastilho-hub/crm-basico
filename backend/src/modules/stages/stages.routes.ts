import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import * as stagesController from './stages.controller';

const router = Router();

// Leitura autenticada (qualquer usuário)
router.get('/', authenticate, stagesController.list);

// Mutações apenas ADMIN
router.use(authenticate, requireRole('ADMIN'));

router.post('/', stagesController.create);
router.patch('/reorder', stagesController.reorder);
router.patch('/:id', stagesController.update);
router.delete('/:id', stagesController.remove);

export default router;
