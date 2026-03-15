import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ops from '../controllers/ops.controller.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard/:role', ops.getDashboard);

router.get('/subscriptions/plans', ops.listPlans);
router.post('/subscriptions/plans', authorize('admin', 'manager'), ops.createPlan);
router.patch('/subscriptions/plans/:id', authorize('admin', 'manager'), ops.updatePlan);
router.get('/subscriptions/me', authorize('member'), ops.getMySubscriptions);
router.post('/subscriptions/purchase', authorize('member'), ops.purchaseSubscription);
router.post('/subscriptions/freeze', authorize('member'), ops.requestFreeze);
router.get('/payments/me', authorize('member'), ops.getMyPayments);

router.post('/visits/check-in', ops.checkIn);
router.post('/visits/check-out', ops.checkOut);
router.get('/visits/me', ops.listMyVisits);
router.get('/visits', authorize('admin', 'manager', 'trainer'), ops.listVisits);

router.get('/pt-sessions/me', authorize('member'), ops.listMyPtSessions);
router.get('/pt-sessions/trainer', authorize('trainer'), ops.listTrainerPtSessions);
router.post('/pt-sessions', authorize('member', 'trainer', 'manager', 'admin'), ops.createPtSession);

router.get('/workouts/plans/me', authorize('member'), ops.listMyWorkoutPlans);
router.post('/workouts/plans/assign', authorize('trainer', 'manager', 'admin'), ops.assignWorkoutPlan);
router.get('/workouts/logs/me', authorize('member'), ops.listMyWorkoutLogs);
router.post('/workouts/logs', authorize('member', 'trainer'), ops.addWorkoutLog);
router.get('/metrics/me', authorize('member'), ops.getMyMetrics);
router.post('/metrics/me', authorize('member', 'trainer'), ops.addMetric);
router.post('/metrics/member/:memberId', authorize('trainer', 'manager', 'admin'), ops.addMetricForMember);

router.get('/equipment', ops.listEquipment);
router.patch('/equipment/:id', authorize('manager', 'admin', 'trainer'), ops.updateEquipmentStatus);
router.get('/equipment-events', ops.listEquipmentEvents);
router.post('/equipment-events', authorize('manager', 'admin', 'trainer'), ops.addEquipmentEvent);

router.get('/inventory/items', ops.listInventoryItems);
router.post('/inventory/transactions', authorize('manager', 'admin', 'trainer'), ops.addInventoryTransaction);

router.get('/messages', ops.listMessages);
router.patch('/messages/:id/read', ops.markMessageRead);

router.get('/reports/summary', authorize('manager', 'admin'), ops.getReportSummary);
router.get('/reports/recent', authorize('manager', 'admin'), ops.getRecentReports);

router.get('/config', authorize('admin', 'manager'), ops.listConfig);
router.patch('/config', authorize('admin'), ops.updateConfig);

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
router.post('/simulate/workout', authorize('admin', 'manager', 'trainer'), ops.simulateWorkout);
router.post('/simulate/trainer-shift', authorize('admin', 'manager'), ops.simulateTrainerShift);
router.post('/simulate/appointment', authorize('admin', 'manager', 'trainer'), ops.simulateAppointment);
router.get('/simulate/state', authorize('admin', 'manager', 'trainer'), ops.getSimulationState);

export default router;

