import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as sdrController from './sdr.controller';

const router = Router();

router.use(authenticate);

router.get('/', sdrController.list);
router.post('/', sdrController.create);
router.patch('/:id', sdrController.update);
router.delete('/:id', sdrController.remove);

export default router;
