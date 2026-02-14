// Analytics Routes — Phase 3
import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireRole('manager', 'admin'));

router.get('/member-growth', AnalyticsController.getMemberGrowth);
router.get('/revenue-trend', AnalyticsController.getRevenueTrend);
router.get('/attendance-heatmap', AnalyticsController.getAttendanceHeatmap);
router.get('/churn-trend', AnalyticsController.getChurnTrend);
router.get('/occupancy', AnalyticsController.getCurrentOccupancy);
router.get('/daily-visits', AnalyticsController.getDailyVisits);
router.get('/equipment-utilization', AnalyticsController.getEquipmentUtilization);
router.get('/subscription-distribution', AnalyticsController.getSubscriptionDistribution);
router.get('/top-members', AnalyticsController.getTopMembers);

export default router;
