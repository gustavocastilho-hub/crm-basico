import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { ownershipFilter } from '../../middleware/ownership';
import * as dashboardController from './dashboard.controller';

const router = Router();

router.use(authenticate, ownershipFilter);

router.get('/summary', dashboardController.summary);
router.get('/sales-by-month', dashboardController.salesByMonth);
router.get('/conversion-funnel', dashboardController.conversionFunnel);
router.get('/recent-activities', dashboardController.recentActivities);

export default router;
