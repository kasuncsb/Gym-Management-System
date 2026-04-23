import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as response from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import * as opsService from '../services/ops.service.js';
import { insertReportRun } from '../services/report.service.js';
import { buildReportPdf } from '../services/report-pdf.js';
import * as auditService from '../services/audit.service.js';
import * as pushService from '../services/push.service.js';
import { errors } from '../utils/errors.js';
import type { WorkoutProgramJson } from '../validators/workoutProgram.js';
import { parseWorkoutPlanPreferences } from '../validators/aiWorkoutPlanPreferences.js';

type Role = 'admin' | 'manager' | 'trainer' | 'member';
type RoleOrGuest = Role | 'guest';

function requireUser(req: AuthRequest) {
  if (!req.user) throw errors.unauthorized();
  return req.user;
}

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const role = (req.params.role as Role) || user.role;
  if (role !== user.role) throw errors.forbidden('Dashboard role mismatch');
  const data = await opsService.getDashboard(role, user.id);
  res.json(response.success(data));
});

export const getDashboardAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const role = (req.params.role as Role) || user.role;
  if (role !== user.role) throw errors.forbidden('Dashboard role mismatch');
  const data = await opsService.getDashboardAnalytics(role, user.id);
  res.json(response.success(data));
});

export const listPlans = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const includeInactive = String(req.query.includeInactive ?? '').toLowerCase();
  const allowInactive = (includeInactive === '1' || includeInactive === 'true')
    && (user.role === 'admin' || user.role === 'manager');
  res.json(response.success(await opsService.listPlans({ includeInactive: allowInactive })));
});

export const listPromotions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listPromotions()));
});
export const createPromotion = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.createPromotion(req.body), 'Promotion created'));
});
export const updatePromotion = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.updatePromotion(req.params.id, req.body), 'Promotion updated'));
});
export const deactivatePromotion = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.deactivatePromotion(req.params.id), 'Promotion deactivated'));
});
export const createPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.createPlan(req.body), 'Plan created'));
});
export const updatePlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.updatePlan(req.params.id, req.body), 'Plan updated'));
});

export const getMySubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.getMySubscriptions(user.id)));
});
export const getMyPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.getMyPayments(user.id)));
});
export const listAllSubscriptions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listAllSubscriptions()));
});
export const listAllPayments = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listAllPayments()));
});
export const purchaseSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.purchaseSubscription(user.id, req.body), 'Subscription purchased'));
});
export const getMyPaymentInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const invoice = await opsService.getPaymentInvoiceHtml(req.params.paymentId, user.id);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.html"`);
  res.status(200).send(invoice.htmlContent);
});

export const listPublicSubscriptionPlans = asyncHandler(async (_req: Request, res: Response) => {
  res.json(response.success(await opsService.listPublicSubscriptionPlans()));
});

export const checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.checkIn(user.id), 'Checked in'));
});
export const checkOut = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.checkOut(user.id), 'Checked out'));
});
export const listMyVisits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const raw = Number(req.query.limit);
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(Math.round(raw), 1000) : 20;
  res.json(response.success(await opsService.listMyVisits(user.id, limit)));
});
export const listVisits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const raw = Number(req.query.limit);
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(Math.round(raw), 1000) : 100;
  res.json(response.success(await opsService.listVisits(limit)));
});
export const getVisitStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.getVisitStats()));
});

export const getBranchCapacity = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.getBranchCapacity()));
});

export const getPublicSystemStatus = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.getPublicSystemStatus()));
});

export const registerPushToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const token = String(req.body?.token ?? '').trim();
  if (!token) throw errors.badRequest('token is required');
  res.json(response.success(await pushService.registerPushToken(user.id, user.role as Role, token), 'Push token registered'));
});

export const unregisterPushToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const token = String(req.body?.token ?? '').trim();
  if (!token) throw errors.badRequest('token is required');
  res.json(response.success(await pushService.unregisterPushToken(user.id, token), 'Push token removed'));
});

export const sendPushTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const mode = String(req.body?.mode ?? 'self').trim();
  const title = String(req.body?.title ?? 'GymSphere Notification');
  const body = String(req.body?.body ?? 'Test notification from GMS backend');
  const data = (req.body?.data ?? {}) as Record<string, string>;

  let result: unknown;
  if (mode === 'role') {
    const role = String(req.body?.role ?? '').trim() as Role;
    if (!role) throw errors.badRequest('role is required for role mode');
    result = await pushService.sendToRole(role, title, body, data);
  } else if (mode === 'user') {
    const targetUserId = String(req.body?.userId ?? '').trim();
    if (!targetUserId) throw errors.badRequest('userId is required for user mode');
    result = await pushService.sendToUser(targetUserId, title, body, data);
  } else {
    result = await pushService.sendToUser(user.id, title, body, data);
  }
  res.json(response.success(result, 'Push test dispatched'));
});

export const listMyPtSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.listMyPtSessions(user.id)));
});
export const listTrainerPtSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.listTrainerPtSessions(user.id)));
});
export const listAllPtSessions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listAllPtSessions()));
});

export const getTrainerPtAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const trainerId = String(req.query.trainerId ?? '').trim();
  const date = String(req.query.date ?? '').trim();
  if (!trainerId || !date) throw errors.badRequest('trainerId and date query parameters are required');
  res.json(
    response.success(await opsService.getTrainerPtAvailability(trainerId, date, user.id, user.role as Role)),
  );
});

export const getPtBookingRules = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.getPtBookingRules()));
});

export const createPtSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const payload = { ...req.body } as {
    memberId?: string;
    trainerId: string;
    sessionDate: string;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
  };
  if (user.role === 'member') payload.memberId = user.id;
  if (!payload.memberId) throw errors.badRequest('memberId is required');
  res.json(response.success(await opsService.createPtSession(payload as Parameters<typeof opsService.createPtSession>[0]), 'PT session created'));
});
export const updatePtSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const sessionId = req.params.id;
  if (!sessionId) throw errors.badRequest('Session ID is required');
  res.json(response.success(await opsService.updatePtSession(sessionId, user.id, user.role as Role, req.body), 'PT session updated'));
});

export const listMyWorkoutPlans = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.listMyWorkoutPlans(user.id)));
});
export const getMemberWorkoutPlans = asyncHandler(async (req: AuthRequest, res: Response) => {
  const memberId = String(req.params.memberId ?? '').trim();
  if (!memberId) throw errors.badRequest('memberId is required');
  res.json(response.success(await opsService.getMemberWorkoutPlans(memberId)));
});
export const removeMyWorkoutPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const planId = String(req.params.planId ?? '').trim();
  if (!planId) throw errors.badRequest('planId is required');
  res.json(response.success(await opsService.removeMyWorkoutPlan(user.id, planId), 'Workout plan removed'));
});
export const listMyWorkoutLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.listMyWorkoutLogs(user.id)));
});
export const addWorkoutLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.addWorkoutLog(user.id, req.body), 'Workout logged'));
});
export const getActiveWorkoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.getActiveWorkoutSession(user.id)));
});
export const startWorkoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.startWorkoutSession(user.id, req.body), 'Workout session started'));
});
export const addWorkoutSessionEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const sessionId = String(req.params.sessionId ?? '').trim();
  if (!sessionId) throw errors.badRequest('sessionId is required');
  res.json(response.success(await opsService.addWorkoutSessionEvent(user.id, sessionId, req.body, user.role as Role), 'Workout event recorded'));
});
export const stopWorkoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const sessionId = String(req.params.sessionId ?? '').trim();
  if (!sessionId) throw errors.badRequest('sessionId is required');
  res.json(response.success(await opsService.stopWorkoutSession(user.id, sessionId, req.body, user.role as Role), 'Workout session finalized'));
});
export const generateAiWorkoutPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const memberId = user.role === 'member' ? user.id : String(req.body?.memberId ?? '').trim();
  if (!memberId) throw errors.badRequest('memberId is required');
  const preferences = parseWorkoutPlanPreferences(req.body?.preferences);
  res.json(response.success(await opsService.generateAiWorkoutPlan(memberId, user.id, user.role as Role, preferences), 'AI workout plan generated'));
});

export const getMyMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.getMyMetrics(user.id)));
});
export const addMetric = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.addMetric(user.id, req.body), 'Metric recorded'));
});

export const addMetricForMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const memberId = String(req.params.memberId ?? '').trim();
  if (!memberId) throw errors.badRequest('memberId is required');
  res.json(response.success(await opsService.addMetricForMember(user.id, memberId, req.body), 'Member metric recorded'));
});

export const getMemberMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const memberId = String(req.params.memberId ?? '').trim();
  if (!memberId) throw errors.badRequest('memberId is required');
  res.json(response.success(await opsService.getMemberMetrics(memberId)));
});

export const assignWorkoutPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const payload = req.body as {
    memberId: string;
    name: string;
    description?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    durationWeeks: number;
    daysPerWeek: number;
    libraryPlanId?: string;
  };
  if (!payload?.memberId || !payload?.name) throw errors.badRequest('memberId and name are required');
  res.json(response.success(await opsService.assignWorkoutPlanToMember(user.id, payload), 'Workout plan assigned'));
});

export const listEquipment = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listEquipment()));
});
export const createEquipment = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.createEquipment(req.body), 'Equipment created'));
});
export const updateEquipmentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.updateEquipmentStatus(req.params.id, req.body), 'Equipment updated'));
});
export const listEquipmentEvents = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listEquipmentEvents()));
});
export const addEquipmentEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.addEquipmentEvent(user.id, req.body), 'Equipment event logged'));
});
export const resolveEquipmentEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.resolveEquipmentEvent(req.params.id, user.id), 'Equipment event resolved'));
});

export const listInventoryItems = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listInventoryItems()));
});
export const createInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.createInventoryItem(req.body), 'Inventory item created'));
});
export const updateInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.updateInventoryItem(req.params.id, req.body), 'Inventory item updated'));
});
export const listInventoryTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const itemId = req.query.itemId as string | undefined;
  res.json(response.success(await opsService.listInventoryTransactions(itemId)));
});
export const addInventoryTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.addInventoryTransaction(user.id, req.body), 'Inventory transaction recorded'));
});

/** Audit-only replacement for legacy in-app broadcast (managers/admins). */
export const staffBroadcast = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.logStaffBroadcast(user.id, req.body), 'Broadcast logged'));
});

export const getRecentReports = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.getRecentReportItems()));
});

export const listConfig = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listConfig()));
});
export const updateConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(
    await opsService.updateConfigValues(req.body, { id: user.id, label: user.fullName }),
    'Config updated',
  ));
});

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.query.role as Role | undefined;
  res.json(response.success(await opsService.listUsersByRole(role)));
});
export const listTrainers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listTrainers()));
});
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const admin = requireUser(req);
  res.json(response.success(
    await opsService.createUser(req.body, { id: admin.id, label: admin.fullName }),
    'User created',
  ));
});

export const listAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const raw = Number(req.query.limit);
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(Math.round(raw), 2000) : 500;
  res.json(response.success(await auditService.listAuditLogs(limit)));
});

export const doorScanAccess = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const token = String(req.body?.token ?? '').trim();
  const code = String(req.body?.code ?? '').trim();
  res.json(response.success(await opsService.doorScanAccess(user.id, token, code), 'Door access processed'));
});
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.updateUser(req.params.id, req.body), 'User updated'));
});

export const listMembers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listMembers()));
});

export const listClosures = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listClosures()));
});
export const createClosure = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.createClosure(user.id, req.body), 'Closure created'));
});
export const deleteClosure = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  await opsService.deleteClosure(String(req.params.id ?? ''), user.id);
  res.json(response.success(null, 'Closure deleted'));
});

export const simulateGenerateDoorOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const raw = Number(req.body?.expiresInSec ?? 120);
  const expiresInSec = Number.isFinite(raw) && raw > 0 ? raw : 120;
  res.json(response.success(await opsService.simulateGenerateDoorOtp(user.id, expiresInSec), 'Simulation OTP generated'));
});

// ── Public Simulation (no auth required) ──────────────────────────────────────

export const publicSimulationBootstrap = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [membersR, trainersR, plansR, stateR] = await Promise.allSettled([
    opsService.listSimulationPeople('member'),
    opsService.listSimulationPeople('trainer'),
    opsService.listPlans({ includeInactive: false }),
    opsService.getSimulationState(),
  ]);
  const members = membersR.status === 'fulfilled' ? membersR.value : [];
  const trainers = trainersR.status === 'fulfilled' ? trainersR.value : [];
  const plans = plansR.status === 'fulfilled' ? plansR.value : [];
  const state = stateR.status === 'fulfilled'
    ? stateR.value
    : { now: new Date().toISOString(), visits: [], payments: [], workouts: [], ptSessions: [], activeDoorOtps: [] };
  res.json(response.success({ members, trainers, plans, state }));
});

export const publicSimulateGenerateDoorOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const raw = Number(req.body?.expiresInSec ?? 120);
  const expiresInSec = Number.isFinite(raw) && raw > 0 ? raw : 120;
  res.json(response.success(await opsService.simulateGenerateDoorOtp('public-simulate', expiresInSec), 'Simulation OTP generated'));
});

export const publicSimulateDoorScan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payload = req.body as { token?: string; code?: string; personId?: string };
  const personId = String(payload.personId ?? '').trim();
  const token = String(payload.token ?? '').trim();
  const code = String(payload.code ?? '').trim();
  if (!personId || !token || !code) throw errors.badRequest('token, code and personId are required');
  res.json(response.success(await opsService.simulateDoorScan({ token, code, personId }), 'Door simulation processed'));
});

export const publicSimulatePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.simulatePayment(req.body), 'Payment simulation processed'));
});

export const publicSimulateCardPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.publicSimulateCardPayment(req.body), 'Card payment approved (simulator)'));
});

export const publicSimulateTrainerShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.simulateTrainerShift(req.body), 'Trainer shift simulation processed'));
});

export const publicSimulateAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.simulateAppointment(req.body), 'Appointment simulation processed'));
});

export const publicSimulateVitals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const memberId = String(req.body?.memberId ?? '').trim();
  if (!memberId) throw errors.badRequest('memberId is required');
  res.json(response.success(await opsService.simulateVitals(memberId, req.body), 'Vitals simulation recorded'));
});

export const publicGetSimulationState = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.getSimulationState()));
});

export const simulateDoorScan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const payload = req.body as { token: string; code: string; personId?: string };
  const personId = user.role === 'member'
    ? user.id
    : (payload.personId?.trim() || user.id);
  res.json(response.success(await opsService.simulateDoorScan({ token: payload.token, code: payload.code, personId }), 'Door simulation processed'));
});

export const simulatePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.simulatePayment(req.body), 'Payment simulation processed'));
});

export const simulateTrainerShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.simulateTrainerShift(req.body), 'Trainer shift simulation processed'));
});

export const simulateAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.simulateAppointment(req.body), 'Appointment simulation processed'));
});

export const getSimulationState = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.getSimulationState()));
});

export const simulateVitals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const memberId = String(req.body?.memberId ?? '').trim();
  if (!memberId) throw errors.badRequest('memberId is required');
  res.json(response.success(await opsService.simulateVitals(memberId, req.body), 'Vitals simulation recorded'));
});

// ── Workout programs (JSON) ───────────────────────────────────────────────────

export const listWorkoutLibrary = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listWorkoutLibrary()));
});

export const getWorkoutPlanDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const planId = String(req.params.planId ?? '').trim();
  if (!planId) throw errors.badRequest('planId is required');
  const user = req.user;
  const userId = user?.id ?? null;
  const role: RoleOrGuest = user ? (user.role as Role) : 'guest';
  res.json(response.success(await opsService.getWorkoutPlanDetail(planId, userId, role)));
});

export const patchWorkoutPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const planId = String(req.params.planId ?? '').trim();
  if (!planId) throw errors.badRequest('planId is required');
  const program = (req.body as { program?: unknown })?.program;
  if (!program || typeof program !== 'object') throw errors.badRequest('program is required');
  res.json(response.success(
    await opsService.updateWorkoutPlanProgram(planId, user.id, user.role as Role, { program: program as WorkoutProgramJson }),
    'Workout plan updated',
  ));
});

// ── Shifts ────────────────────────────────────────────────────────────────────

export const listShifts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = {
    staffId: req.query.staffId as string | undefined,
    shiftDate: req.query.shiftDate as string | undefined,
  };
  res.json(response.success(await opsService.listShifts(filters)));
});

export const getMyShifts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.getMyShifts(user.id)));
});

export const createShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.createShift({ ...req.body, createdBy: user.id }), 'Shift created'));
});

export const updateShiftStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const { status } = req.body as { status: 'scheduled' | 'active' | 'completed' | 'missed' | 'swapped' };
  if (!status) throw errors.badRequest('status is required');
  res.json(response.success(await opsService.updateShiftStatus(req.params.id, status, user.id), 'Shift updated'));
});

// ── Reports (parameterised) ────────────────────────────────────────────────────

export const getReportSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const params = {
    type: req.query.type as string | undefined,
    fromDate: req.query.fromDate as string | undefined,
    toDate: req.query.toDate as string | undefined,
  };
  const data = await opsService.getReportSummary(params);
  if (req.query.recordRun === 'true') {
    const direct = (data as { direct?: Record<string, unknown> }).direct ?? {};
    await insertReportRun({
      actorId: user.id,
      reportType: params.type ?? 'overview',
      fromDate: params.fromDate,
      toDate: params.toDate,
      channel: 'summary',
      direct,
    });
  }
  const businessData = { ...((data as Record<string, unknown>) ?? {}) };
  delete businessData.direct;
  if (businessData.meta && typeof businessData.meta === 'object' && !Array.isArray(businessData.meta)) {
    const meta = { ...(businessData.meta as Record<string, unknown>) };
    delete meta.directRowCap;
    delete meta.directTruncated;
    businessData.meta = meta;
  }
  res.json(response.success(businessData));
});

export const getReportPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const params = {
    type: req.query.type as string | undefined,
    fromDate: req.query.fromDate as string | undefined,
    toDate: req.query.toDate as string | undefined,
  };
  const data = (await opsService.getReportSummary(params)) as Record<string, unknown>;
  const direct = (data.direct as Record<string, unknown>) ?? {};
  await insertReportRun({
    actorId: user.id,
    reportType: params.type ?? 'overview',
    fromDate: params.fromDate,
    toDate: params.toDate,
    channel: 'pdf',
    direct,
  });
  const businessData = { ...data };
  delete businessData.direct;
  if (businessData.meta && typeof businessData.meta === 'object' && !Array.isArray(businessData.meta)) {
    const meta = { ...(businessData.meta as Record<string, unknown>) };
    delete meta.directRowCap;
    delete meta.directTruncated;
    businessData.meta = meta;
  }
  const buf = await buildReportPdf(businessData);
  const safeName = `report-${params.type ?? 'overview'}-${params.fromDate ?? 'all'}-to-${params.toDate ?? 'now'}.pdf`.replace(
    /[^a-zA-Z0-9._-]+/g,
    '_',
  );
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.send(buf);
});
