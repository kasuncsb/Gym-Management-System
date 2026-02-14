// Reporting Routes — Phase 3
import { Router } from 'express';
import { ReportingController } from '../controllers/reporting.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireRole('manager', 'admin'));

router.get('/revenue', ReportingController.getRevenueReport);
router.get('/retention', ReportingController.getRetentionReport);
router.get('/attendance', ReportingController.getAttendanceReport);
router.get('/equipment-costs', ReportingController.getEquipmentCostReport);
router.get('/plan-popularity', ReportingController.getPlanPopularity);
router.get('/summary', ReportingController.getMonthlySummary);

export default router;
