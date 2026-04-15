import { Router } from 'express';
import * as controller from './contract-forms.controller';

const router = Router();

router.get('/:token', controller.getByToken);
router.post('/:token/submit', controller.submit);

export default router;
