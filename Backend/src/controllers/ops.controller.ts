import { Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import * as response from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import * as opsService from '../services/ops.service.js';
import { errors } from '../utils/errors.js';

type Role = 'admin' | 'manager' | 'staff' | 'trainer' | 'member';

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

export const listPlans = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const includeInactive = String(req.query.includeInactive ?? '').toLowerCase();
  const allowInactive = (includeInactive === '1' || includeInactive === 'true')
    && (user.role === 'admin' || user.role === 'manager');
  res.json(response.success(await opsService.listPlans({ includeInactive: allowInactive })));
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
export const purchaseSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.purchaseSubscription(user.id, req.body), 'Subscription purchased'));
});
export const requestFreeze = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.requestFreeze(user.id, req.body), 'Freeze requested'));
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

export const listMyPtSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.listMyPtSessions(user.id)));
});
export const listTrainerPtSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.listTrainerPtSessions(user.id)));
});
export const createPtSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const payload = { ...req.body } as { memberId?: string; trainerId: string; sessionDate: string; startTime: string; endTime: string };
  if (user.role === 'member') payload.memberId = user.id;
  if (!payload.memberId) throw errors.badRequest('memberId is required');
  res.json(response.success(await opsService.createPtSession(payload as { memberId: string; trainerId: string; sessionDate: string; startTime: string; endTime: string }), 'PT session created'));
});

export const listMyWorkoutPlans = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.listMyWorkoutPlans(user.id)));
});
export const listMyWorkoutLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.listMyWorkoutLogs(user.id)));
});
export const addWorkoutLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.addWorkoutLog(user.id, req.body), 'Workout logged'));
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

export const assignWorkoutPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const payload = req.body as {
    memberId: string;
    name: string;
    description?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    durationWeeks: number;
    daysPerWeek: number;
  };
  if (!payload?.memberId || !payload?.name) throw errors.badRequest('memberId and name are required');
  res.json(response.success(await opsService.assignWorkoutPlanToMember(user.id, payload), 'Workout plan assigned'));
});

export const listEquipment = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listEquipment()));
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

export const listInventoryItems = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listInventoryItems()));
});
export const addInventoryTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.addInventoryTransaction(user.id, req.body), 'Inventory transaction recorded'));
});

export const listMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.listMessagesForUser(user.id, user.role)));
});
export const markMessageRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  res.json(response.success(await opsService.markMessageRead(req.params.id, user.id, user.role), 'Message marked as read'));
});

export const getReportSummary = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.getReportSummary()));
});
export const getRecentReports = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.getRecentReportItems()));
});

export const listConfig = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.listConfig()));
});
export const updateConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.updateConfigValues(req.body), 'Config updated'));
});

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.query.role as Role | undefined;
  res.json(response.success(await opsService.listUsersByRole(role)));
});
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.createUser(req.body), 'User created'));
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
  await opsService.deleteClosure(req.params.id);
  res.json(response.success(null, 'Closure deleted'));
});

export const simulateGenerateDoorOtp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const raw = Number(req.body?.expiresInSec ?? 120);
  const expiresInSec = Number.isFinite(raw) && raw > 0 ? raw : 120;
  res.json(response.success(await opsService.simulateGenerateDoorOtp(user.id, expiresInSec), 'Simulation OTP generated'));
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

export const simulateWorkout = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(response.success(await opsService.simulateWorkout(req.body), 'Workout simulation processed'));
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

