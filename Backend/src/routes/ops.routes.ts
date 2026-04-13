import { Router } from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';
import * as ops from '../controllers/ops.controller.js';

const router = Router();

// Public simulation endpoints (independent from auth/session)
router.get('/simulate/public/bootstrap', ops.publicSimulationBootstrap);
router.post('/simulate/public/door/otp', ops.publicSimulateGenerateDoorOtp);
router.post('/simulate/public/door/scan', ops.publicSimulateDoorScan);
router.post('/simulate/public/payment', ops.publicSimulatePayment);
router.post('/simulate/public/payment/card', ops.publicSimulateCardPayment);
router.post('/simulate/public/trainer-shift', ops.publicSimulateTrainerShift);
router.post('/simulate/public/appointment', ops.publicSimulateAppointment);
router.post('/simulate/public/vitals', ops.publicSimulateVitals);
router.get('/simulate/public/state', ops.publicGetSimulationState);
router.get('/branch/capacity', ops.getBranchCapacity);
router.get('/system/status', ops.getPublicSystemStatus);
router.get('/public/subscription-plans', ops.listPublicSubscriptionPlans);

// Workout library & plan detail: no login required for library templates; optional cookie for member plans
router.get('/workouts/library', optionalAuthenticate, ops.listWorkoutLibrary);
// Literal paths MUST be registered before `/workouts/plans/:planId` or Express treats `me` / `member` as IDs
router.get('/workouts/plans/me', authenticate, authorize('member'), ops.listMyWorkoutPlans);
router.get('/workouts/plans/member/:memberId', authenticate, authorize('trainer', 'manager', 'admin'), ops.getMemberWorkoutPlans);
router.get('/workouts/plans/:planId', optionalAuthenticate, ops.getWorkoutPlanDetail);

router.use(authenticate);

router.post('/push/register-token', authorize('member', 'trainer', 'manager', 'admin'), ops.registerPushToken);
router.post('/push/unregister-token', authorize('member', 'trainer', 'manager', 'admin'), ops.unregisterPushToken);
router.post('/push/test-send', authorize('admin', 'manager', 'trainer'), ops.sendPushTest);

router.get('/dashboard/:role', ops.getDashboard);
router.get('/dashboard/:role/analytics', ops.getDashboardAnalytics);

// Subscription plans
router.get('/subscriptions/plans', ops.listPlans);
router.post('/subscriptions/plans', authorize('admin', 'manager'), ops.createPlan);
router.patch('/subscriptions/plans/:id', authorize('admin', 'manager'), ops.updatePlan);

// Member subscriptions
router.get('/subscriptions/me', authorize('member'), ops.getMySubscriptions);
router.get('/subscriptions', authorize('admin', 'manager'), ops.listAllSubscriptions);
router.post('/subscriptions/purchase', authorize('member'), ops.purchaseSubscription);

// Payments
router.get('/payments/me', authorize('member'), ops.getMyPayments);
router.get('/payments/:paymentId/invoice', authorize('member'), ops.getMyPaymentInvoice);
router.get('/payments', authorize('admin', 'manager'), ops.listAllPayments);

// Visits / check-in
router.post('/visits/check-in', ops.checkIn);
router.post('/visits/check-out', ops.checkOut);
router.post('/visits/door-scan', ops.doorScanAccess);
router.get('/visits/me', ops.listMyVisits);
router.get('/visits/stats', ops.getVisitStats);
router.get('/visits', authorize('admin', 'manager', 'trainer'), ops.listVisits);

// PT sessions
router.get('/pt-sessions/me', authorize('member'), ops.listMyPtSessions);
router.get('/pt-sessions/trainer', authorize('trainer'), ops.listTrainerPtSessions);
router.get(
  '/pt-sessions/availability',
  authorize('member', 'trainer', 'manager', 'admin'),
  ops.getTrainerPtAvailability,
);
router.get(
  '/pt-sessions/booking-rules',
  authorize('member', 'trainer', 'manager', 'admin'),
  ops.getPtBookingRules,
);
router.get('/pt-sessions', authorize('admin', 'manager', 'trainer'), ops.listAllPtSessions);
router.post('/pt-sessions', authorize('member', 'trainer', 'manager', 'admin'), ops.createPtSession);
router.patch('/pt-sessions/:id', authorize('member', 'trainer', 'manager', 'admin'), ops.updatePtSession);

// Workouts (GET /workouts/plans/me and .../member/:id are above — before :planId)
router.delete('/workouts/plans/me/:planId', authorize('member'), ops.removeMyWorkoutPlan);
router.post('/workouts/plans/assign', authorize('trainer', 'manager', 'admin'), ops.assignWorkoutPlan);
router.post('/workouts/plans/generate', authorize('member', 'trainer', 'manager', 'admin'), ops.generateAiWorkoutPlan);
router.patch('/workouts/plans/:planId', authorize('trainer', 'manager', 'admin'), ops.patchWorkoutPlan);
router.get('/workouts/logs/me', authorize('member'), ops.listMyWorkoutLogs);
router.post('/workouts/logs', authorize('member', 'trainer'), ops.addWorkoutLog);
router.get('/workouts/sessions/active', authorize('member'), ops.getActiveWorkoutSession);
router.post('/workouts/sessions/start', authorize('member'), ops.startWorkoutSession);
router.post('/workouts/sessions/:sessionId/events', authorize('member', 'trainer', 'manager', 'admin'), ops.addWorkoutSessionEvent);
router.post('/workouts/sessions/:sessionId/stop', authorize('member', 'trainer', 'manager', 'admin'), ops.stopWorkoutSession);

// Metrics
router.get('/metrics/me', authorize('member'), ops.getMyMetrics);
router.post('/metrics/me', authorize('member', 'trainer'), ops.addMetric);
router.get('/metrics/member/:memberId', authorize('trainer', 'manager', 'admin'), ops.getMemberMetrics);
router.post('/metrics/member/:memberId', authorize('trainer', 'manager', 'admin'), ops.addMetricForMember);

// Equipment
router.get('/equipment', ops.listEquipment);
router.post('/equipment', authorize('manager', 'admin'), ops.createEquipment);
router.patch('/equipment/:id', authorize('manager', 'admin', 'trainer'), ops.updateEquipmentStatus);
router.get('/equipment-events', ops.listEquipmentEvents);
router.post('/equipment-events', authorize('manager', 'admin', 'trainer'), ops.addEquipmentEvent);
router.patch('/equipment-events/:id/resolve', authorize('trainer', 'manager', 'admin'), ops.resolveEquipmentEvent);

// Inventory
router.get('/inventory/items', ops.listInventoryItems);
router.post('/inventory/items', authorize('manager', 'admin'), ops.createInventoryItem);
router.patch('/inventory/items/:id', authorize('manager', 'admin'), ops.updateInventoryItem);
router.get('/inventory/transactions', authorize('manager', 'admin', 'trainer'), ops.listInventoryTransactions);
router.post('/inventory/transactions', authorize('manager', 'admin', 'trainer'), ops.addInventoryTransaction);

// Messages / notifications
router.post('/staff-broadcast', authorize('admin', 'manager', 'trainer'), ops.staffBroadcast);

router.get('/trainers', ops.listTrainers);

// Promotions
router.get('/promotions', authorize('admin', 'manager'), ops.listPromotions);
router.post('/promotions', authorize('admin', 'manager'), ops.createPromotion);
router.patch('/promotions/:id', authorize('admin', 'manager'), ops.updatePromotion);
router.delete('/promotions/:id', authorize('admin', 'manager'), ops.deactivatePromotion);

// Shifts
router.get('/shifts/me', authorize('trainer'), ops.getMyShifts);
router.get('/shifts', authorize('manager', 'admin'), ops.listShifts);
router.post('/shifts', authorize('manager', 'admin'), ops.createShift);
router.patch('/shifts/:id', authorize('manager', 'admin', 'trainer'), ops.updateShiftStatus);

router.get('/reports/summary', authorize('manager', 'admin'), ops.getReportSummary);
router.get('/reports/pdf', authorize('manager', 'admin'), ops.getReportPdf);
router.get('/reports/recent', authorize('manager', 'admin'), ops.getRecentReports);

router.get('/config', authorize('admin', 'manager'), ops.listConfig);
router.patch('/config', authorize('admin'), ops.updateConfig);

router.get('/audit-logs', authorize('admin'), ops.listAuditLogs);

router.get('/users', authorize('admin', 'manager'), ops.listUsers);
router.post('/users', authorize('admin'), ops.createUser);
router.patch('/users/:id', authorize('admin', 'manager'), ops.updateUser);
router.get('/members', authorize('admin', 'manager', 'trainer'), ops.listMembers);

router.get('/closures', authorize('admin', 'manager'), ops.listClosures);
router.post('/closures', authorize('admin', 'manager'), ops.createClosure);
router.delete('/closures/:id', authorize('admin', 'manager'), ops.deleteClosure);

router.post('/simulate/door/otp', authorize('admin', 'manager', 'trainer'), ops.simulateGenerateDoorOtp);
router.post('/simulate/door/scan', authorize('admin', 'manager', 'trainer', 'member'), ops.simulateDoorScan);
router.post('/simulate/payment', authorize('admin', 'manager'), ops.simulatePayment);
router.post('/simulate/trainer-shift', authorize('admin', 'manager'), ops.simulateTrainerShift);
router.post('/simulate/appointment', authorize('admin', 'manager', 'trainer'), ops.simulateAppointment);
router.post('/simulate/vitals', authorize('admin', 'manager', 'trainer'), ops.simulateVitals);
router.get('/simulate/state', authorize('admin', 'manager', 'trainer'), ops.getSimulationState);

export default router;
