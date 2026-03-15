import {
  mysqlTable,
  varchar,
  text,
  tinyint,
  decimal,
  date,
  timestamp,
  mysqlEnum,
  smallint,
  boolean,
} from 'drizzle-orm/mysql-core';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { config, users } from '../db/schema.js';
import { ids } from '../utils/id.js';
import { errors } from '../utils/errors.js';
import { hashPassword } from '../utils/password.js';
import { assertMemberCanPurchaseSubscription } from './auth.service.js';

const subscriptionPlans = mysqlTable('subscription_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  planCode: varchar('plan_code', { length: 30 }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  planType: mysqlEnum('plan_type', ['individual', 'couple', 'student', 'corporate', 'daily_pass']).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  durationDays: smallint('duration_days').notNull(),
  includedPtSessions: tinyint('included_pt_sessions').notNull(),
  isActive: boolean('is_active').notNull(),
  sortOrder: tinyint('sort_order').notNull(),
  createdAt: timestamp('created_at'),
  deletedAt: timestamp('deleted_at'),
});

const promotions = mysqlTable('promotions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  discountType: mysqlEnum('discount_type', ['percentage', 'fixed']).notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  validFrom: date('valid_from').notNull(),
  validUntil: date('valid_until'),
  isActive: boolean('is_active').notNull(),
  usedCount: smallint('used_count').notNull(),
  createdAt: timestamp('created_at'),
});

const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull(),
  planId: varchar('plan_id', { length: 36 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: mysqlEnum('status', ['pending_payment', 'active', 'frozen', 'grace_period', 'expired', 'cancelled']).notNull(),
  pricePaid: decimal('price_paid', { precision: 10, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  promotionId: varchar('promotion_id', { length: 36 }),
  ptSessionsLeft: tinyint('pt_sessions_left').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
});

const subscriptionFreezes = mysqlTable('subscription_freezes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  subscriptionId: varchar('subscription_id', { length: 36 }).notNull(),
  freezeStart: date('freeze_start').notNull(),
  freezeEnd: date('freeze_end').notNull(),
  reason: varchar('reason', { length: 255 }),
  requestedBy: varchar('requested_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

const payments = mysqlTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  subscriptionId: varchar('subscription_id', { length: 36 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum('payment_method', ['cash', 'card', 'bank_transfer', 'online']).notNull(),
  paymentDate: date('payment_date').notNull(),
  status: mysqlEnum('status', ['completed', 'partially_refunded', 'refunded', 'disputed']).notNull(),
  receiptNumber: varchar('receipt_number', { length: 50 }),
  referenceNumber: varchar('reference_number', { length: 100 }),
  promotionId: varchar('promotion_id', { length: 36 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  recordedBy: varchar('recorded_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

const visits = mysqlTable('visits', {
  id: varchar('id', { length: 36 }).primaryKey(),
  personId: varchar('person_id', { length: 36 }).notNull(),
  checkInAt: timestamp('check_in_at').notNull(),
  checkOutAt: timestamp('check_out_at'),
  durationMin: smallint('duration_min'),
  status: mysqlEnum('status', ['active', 'completed', 'auto_closed', 'denied']).notNull(),
  denyReason: varchar('deny_reason', { length: 100 }),
  createdAt: timestamp('created_at'),
});

const ptSessions = mysqlTable('pt_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }).notNull(),
  trainerId: varchar('trainer_id', { length: 36 }).notNull(),
  sessionDate: date('session_date').notNull(),
  startTime: varchar('start_time', { length: 8 }).notNull(),
  endTime: varchar('end_time', { length: 8 }).notNull(),
  status: mysqlEnum('status', ['booked', 'confirmed', 'completed', 'cancelled', 'no_show']).notNull(),
  cancelReason: varchar('cancel_reason', { length: 255 }),
  reviewRating: tinyint('review_rating'),
  reviewComment: text('review_comment'),
  createdAt: timestamp('created_at'),
});

const workoutPlans = mysqlTable('workout_plans', {
  id: varchar('id', { length: 36 }).primaryKey(),
  memberId: varchar('member_id', { length: 36 }),
  trainerId: varchar('trainer_id', { length: 36 }),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  source: mysqlEnum('source', ['trainer_created', 'ai_generated', 'library']).notNull(),
  difficulty: mysqlEnum('difficulty', ['beginner', 'intermediate', 'advanced']),
  durationWeeks: tinyint('duration_weeks').notNull(),
  daysPerWeek: tinyint('days_per_week').notNull(),
  isActive: boolean('is_active').notNull(),
  createdAt: timestamp('created_at'),
});

const workoutLogs = mysqlTable('workout_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  personId: varchar('person_id', { length: 36 }).notNull(),
  planId: varchar('plan_id', { length: 36 }),
  workoutDate: date('workout_date').notNull(),
  durationMin: smallint('duration_min'),
  mood: mysqlEnum('mood', ['great', 'good', 'okay', 'tired', 'poor']),
  caloriesBurned: smallint('calories_burned'),
  notes: text('notes'),
  createdAt: timestamp('created_at'),
});

const memberMetrics = mysqlTable('member_metrics', {
  id: varchar('id', { length: 36 }).primaryKey(),
  personId: varchar('person_id', { length: 36 }).notNull(),
  recordedAt: timestamp('recorded_at'),
  source: mysqlEnum('source', ['manual', 'trainer', 'device']).notNull(),
  weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
  heightCm: decimal('height_cm', { precision: 5, scale: 2 }),
  bmi: decimal('bmi', { precision: 4, scale: 1 }),
  restingHr: tinyint('resting_hr'),
  notes: text('notes'),
});

const equipment = mysqlTable('equipment', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: mysqlEnum('category', ['cardio', 'strength_machine', 'free_weight', 'bench', 'accessory', 'other']).notNull(),
  quantity: tinyint('quantity').notNull(),
  status: mysqlEnum('status', ['operational', 'needs_maintenance', 'under_maintenance', 'retired']).notNull(),
  zoneLabel: varchar('zone_label', { length: 50 }),
  createdAt: timestamp('created_at'),
});

const equipmentEvents = mysqlTable('equipment_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull(),
  eventType: mysqlEnum('event_type', ['issue_reported', 'maintenance_done']).notNull(),
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical']),
  description: text('description').notNull(),
  status: mysqlEnum('status', ['open', 'in_progress', 'resolved']),
  loggedBy: varchar('logged_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

const inventoryItems = mysqlTable('inventory_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  qtyInStock: smallint('qty_in_stock').notNull(),
  reorderThreshold: smallint('reorder_threshold').notNull(),
  isActive: boolean('is_active').notNull(),
  createdAt: timestamp('created_at'),
});

const inventoryTransactions = mysqlTable('inventory_transactions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  itemId: varchar('item_id', { length: 36 }).notNull(),
  txnType: mysqlEnum('txn_type', ['restock', 'sale', 'adjustment', 'waste']).notNull(),
  qtyChange: smallint('qty_change').notNull(),
  reference: varchar('reference', { length: 100 }),
  recordedBy: varchar('recorded_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

const messages = mysqlTable('messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  type: mysqlEnum('type', ['notification', 'announcement', 'email']).notNull(),
  channel: mysqlEnum('channel', ['in_app', 'email', 'sms']).notNull(),
  toPersonId: varchar('to_person_id', { length: 36 }),
  targetRole: mysqlEnum('target_role', ['admin', 'manager', 'staff', 'trainer', 'member']),
  subject: varchar('subject', { length: 255 }),
  body: text('body').notNull(),
  priority: mysqlEnum('priority', ['low', 'normal', 'high', 'critical']).notNull(),
  status: mysqlEnum('status', ['pending', 'sent', 'read', 'failed']).notNull(),
  createdAt: timestamp('created_at'),
});

const branchClosures = mysqlTable('branch_closures', {
  id: varchar('id', { length: 36 }).primaryKey(),
  closureDate: date('closure_date').notNull(),
  reason: varchar('reason', { length: 255 }),
  isEmergency: boolean('is_emergency').notNull(),
  closedBy: varchar('closed_by', { length: 36 }),
  createdAt: timestamp('created_at'),
});

type Role = 'admin' | 'manager' | 'staff' | 'trainer' | 'member';

function addDays(base: Date, days: number | string): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + Number(days));
  return d;
}

function dateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function safeInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function safeDate(v: unknown): Date {
  const d = new Date(v as string);
  if (isNaN(d.getTime())) throw errors.badRequest(`Invalid date: ${String(v)}`);
  return d;
}

export async function getDashboard(role: Role, userId: string) {
  const [activeMembersRow] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.role, 'member'), isNull(users.deletedAt), eq(users.memberStatus, 'active')));
  const [todayVisitsRow] = await db.select({ count: sql<number>`count(*)` }).from(visits).where(sql`date(${visits.checkInAt}) = curdate()`);
  const [openIssuesRow] = await db.select({ count: sql<number>`count(*)` }).from(equipmentEvents).where(eq(equipmentEvents.status, 'open'));
  const [revenueRow] = await db.select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(sql`month(${payments.paymentDate}) = month(curdate()) and year(${payments.paymentDate}) = year(curdate())`);

  const base = {
    activeMembers: Number(activeMembersRow?.count ?? 0),
    todayVisits: Number(todayVisitsRow?.count ?? 0),
    openIssues: Number(openIssuesRow?.count ?? 0),
    monthlyRevenue: Number(revenueRow?.total ?? 0),
  };

  if (role === 'member') {
    const [myVisitCount] = await db.select({ count: sql<number>`count(*)` }).from(visits).where(eq(visits.personId, userId));
    const [myWorkouts] = await db.select({ count: sql<number>`count(*)` }).from(workoutLogs).where(eq(workoutLogs.personId, userId));
    return { ...base, myVisits: Number(myVisitCount?.count ?? 0), myWorkouts: Number(myWorkouts?.count ?? 0) };
  }

  if (role === 'trainer') {
    const [sessionsToday] = await db.select({ count: sql<number>`count(*)` }).from(ptSessions).where(and(eq(ptSessions.trainerId, userId), sql`${ptSessions.sessionDate} = curdate()`));
    return { ...base, sessionsToday: Number(sessionsToday?.count ?? 0) };
  }

  return base;
}

export async function listPlans(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false;
  return db
    .select()
    .from(subscriptionPlans)
    .where(includeInactive
      ? isNull(subscriptionPlans.deletedAt)
      : and(eq(subscriptionPlans.isActive, true), isNull(subscriptionPlans.deletedAt)))
    .orderBy(subscriptionPlans.sortOrder, subscriptionPlans.createdAt);
}

export async function createPlan(input: {
  name: string;
  description?: string;
  planType: 'individual' | 'couple' | 'student' | 'corporate' | 'daily_pass';
  price: number;
  durationDays: number;
  includedPtSessions?: number;
}) {
  const id = ids.uuid();
  await db.insert(subscriptionPlans).values({
    id,
    planCode: `PLAN-${Date.now()}`,
    name: input.name,
    description: input.description ?? null,
    planType: input.planType,
    price: String(input.price),
    durationDays: input.durationDays,
    includedPtSessions: input.includedPtSessions ?? 0,
    isActive: true,
    sortOrder: 0,
  });
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  return plan;
}

export async function updatePlan(
  planId: string,
  input: Partial<{ name: string; description: string; price: number; durationDays: number; isActive: boolean }>,
) {
  await db.update(subscriptionPlans).set({
    name: input.name,
    description: input.description,
    price: input.price != null ? String(input.price) : undefined,
    durationDays: input.durationDays,
    isActive: input.isActive,
  }).where(eq(subscriptionPlans.id, planId));
  const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
  if (!plan) throw errors.notFound('Subscription plan');
  return plan;
}

export async function getMySubscriptions(userId: string) {
  return db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      pricePaid: subscriptions.pricePaid,
      ptSessionsLeft: subscriptions.ptSessionsLeft,
      planId: subscriptions.planId,
      planName: subscriptionPlans.name,
      planType: subscriptionPlans.planType,
    })
    .from(subscriptions)
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
    .where(eq(subscriptions.memberId, userId))
    .orderBy(desc(subscriptions.createdAt));
}

export async function getMyPayments(userId: string) {
  return db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      paymentDate: payments.paymentDate,
      status: payments.status,
      receiptNumber: payments.receiptNumber,
      planName: subscriptionPlans.name,
    })
    .from(payments)
    .leftJoin(subscriptions, eq(subscriptions.id, payments.subscriptionId))
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
    .where(eq(subscriptions.memberId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function purchaseSubscription(
  userId: string,
  input: {
    planId: string;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online';
    promotionCode?: string;
  },
) {
  await assertMemberCanPurchaseSubscription(userId);

  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.id, input.planId), eq(subscriptionPlans.isActive, true), isNull(subscriptionPlans.deletedAt)));
  if (!plan) throw errors.notFound('Subscription plan');

  let discountAmount = 0;
  let promotionId: string | null = null;
  if (input.promotionCode?.trim()) {
    const [promo] = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.code, input.promotionCode.trim()), eq(promotions.isActive, true)));
    if (promo) {
      promotionId = promo.id;
      const planPrice = Number(plan.price);
      discountAmount = promo.discountType === 'percentage'
        ? Math.round((planPrice * Number(promo.discountValue)) / 100)
        : Number(promo.discountValue);
      if (discountAmount > planPrice) discountAmount = planPrice;
      await db.update(promotions).set({ usedCount: (promo.usedCount ?? 0) + 1 }).where(eq(promotions.id, promo.id));
    }
  }

  const startDate = new Date();
  const endDate = addDays(startDate, plan.durationDays);
  const subscriptionId = ids.uuid();
  const pricePaid = Math.max(0, Number(plan.price) - discountAmount);

  await db.insert(subscriptions).values({
    id: subscriptionId,
    memberId: userId,
    planId: plan.id,
    startDate: startDate,
    endDate: endDate,
    status: 'active',
    pricePaid: String(pricePaid),
    discountAmount: String(discountAmount),
    promotionId,
    ptSessionsLeft: plan.includedPtSessions ?? 0,
  });

  await db.insert(payments).values({
    id: ids.uuid(),
    subscriptionId,
    amount: String(pricePaid),
    paymentMethod: input.paymentMethod,
    paymentDate: startDate,
    status: 'completed',
    receiptNumber: `RCPT-${Date.now()}`,
    referenceNumber: `REF-${Math.floor(Math.random() * 1_000_000)}`,
    promotionId,
    discountAmount: String(discountAmount),
    recordedBy: userId,
  });

  await db.update(users).set({
    memberStatus: 'active',
    joinDate: sql`coalesce(${users.joinDate}, curdate())`,
  }).where(eq(users.id, userId));

  const [created] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId));
  return created;
}

export async function requestFreeze(
  userId: string,
  input: { subscriptionId?: string; freezeStart: string; freezeEnd: string; reason?: string },
) {
  const [activeSub] = input.subscriptionId
    ? await db.select().from(subscriptions).where(and(eq(subscriptions.id, input.subscriptionId), eq(subscriptions.memberId, userId)))
    : await db.select().from(subscriptions).where(and(eq(subscriptions.memberId, userId), eq(subscriptions.status, 'active'))).orderBy(desc(subscriptions.createdAt)).limit(1);

  if (!activeSub) throw errors.notFound('Active subscription');

  const freezeId = ids.uuid();
  await db.insert(subscriptionFreezes).values({
    id: freezeId,
    subscriptionId: activeSub.id,
    freezeStart: safeDate(input.freezeStart),
    freezeEnd: safeDate(input.freezeEnd),
    reason: input.reason ?? null,
    requestedBy: userId,
  });

  await db.update(subscriptions).set({
    status: 'frozen',
    notes: input.reason ?? 'Frozen by member request',
  }).where(eq(subscriptions.id, activeSub.id));

  const [freeze] = await db.select().from(subscriptionFreezes).where(eq(subscriptionFreezes.id, freezeId));
  return freeze;
}

export async function checkIn(userId: string) {
  const [current] = await db.select().from(visits).where(and(eq(visits.personId, userId), eq(visits.status, 'active'))).limit(1);
  if (current) throw errors.conflict('Already checked in');

  const [person] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!person) throw errors.notFound('User');

  if (person.role === 'member') {
    const [sub] = await db
      .select({ status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.memberId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    if (!sub || !['active', 'grace_period'].includes(sub.status)) {
      const deniedId = ids.uuid();
      await db.insert(visits).values({
        id: deniedId,
        personId: userId,
        checkInAt: new Date(),
        status: 'denied',
        denyReason: 'Subscription is not active',
      });
      throw errors.forbidden('Active subscription required to enter the facility');
    }
  }

  const id = ids.uuid();
  await db.insert(visits).values({
    id,
    personId: userId,
    checkInAt: new Date(),
    status: 'active',
  });
  const [visit] = await db.select().from(visits).where(eq(visits.id, id));
  return visit;
}

export async function checkOut(userId: string) {
  const [current] = await db.select().from(visits).where(and(eq(visits.personId, userId), eq(visits.status, 'active'))).orderBy(desc(visits.checkInAt)).limit(1);
  if (!current) throw errors.notFound('Active visit');
  const now = new Date();
  const durationMinutes = Math.max(1, Math.round((now.getTime() - new Date(current.checkInAt).getTime()) / 60_000));
  await db.update(visits).set({
    checkOutAt: now,
    durationMin: durationMinutes,
    status: 'completed',
  }).where(eq(visits.id, current.id));
  const [visit] = await db.select().from(visits).where(eq(visits.id, current.id));
  return visit;
}

export async function listMyVisits(userId: string, limit = 20) {
  return db.select().from(visits).where(eq(visits.personId, userId)).orderBy(desc(visits.checkInAt)).limit(limit);
}

export async function listVisits(limit = 100) {
  return db
    .select({
      id: visits.id,
      personId: visits.personId,
      checkInAt: visits.checkInAt,
      checkOutAt: visits.checkOutAt,
      durationMin: visits.durationMin,
      status: visits.status,
      denyReason: visits.denyReason,
      fullName: users.fullName,
      role: users.role,
    })
    .from(visits)
    .leftJoin(users, eq(users.id, visits.personId))
    .orderBy(desc(visits.checkInAt))
    .limit(limit);
}

export async function getVisitStats() {
  const [activeNow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(visits)
    .where(eq(visits.status, 'active'));

  const [todayTotal] = await db
    .select({ count: sql<number>`count(*)` })
    .from(visits)
    .where(sql`date(${visits.checkInAt}) = curdate()`);

  return {
    activeNow: Number(activeNow?.count ?? 0),
    todayTotal: Number(todayTotal?.count ?? 0),
  };
}

export async function listMyPtSessions(userId: string) {
  return db
    .select()
    .from(ptSessions)
    .where(eq(ptSessions.memberId, userId))
    .orderBy(desc(ptSessions.sessionDate));
}

export async function listTrainerPtSessions(userId: string) {
  return db
    .select()
    .from(ptSessions)
    .where(eq(ptSessions.trainerId, userId))
    .orderBy(desc(ptSessions.sessionDate));
}

export async function createPtSession(
  input: { memberId: string; trainerId: string; sessionDate: string; startTime: string; endTime: string },
) {
  const id = ids.uuid();
  await db.insert(ptSessions).values({
    id,
    memberId: input.memberId,
    trainerId: input.trainerId,
    sessionDate: safeDate(input.sessionDate),
    startTime: input.startTime,
    endTime: input.endTime,
    status: 'booked',
  });

  // Notify trainer + member so session scheduling is actionable in-app.
  const when = `${input.sessionDate} ${input.startTime} - ${input.endTime}`;
  await db.insert(messages).values([
    {
      id: ids.uuid(),
      type: 'notification',
      channel: 'in_app',
      toPersonId: input.trainerId,
      subject: 'New PT session booked',
      body: `A new PT session has been scheduled for ${when}.`,
      priority: 'high',
      status: 'sent',
    },
    {
      id: ids.uuid(),
      type: 'notification',
      channel: 'in_app',
      toPersonId: input.memberId,
      subject: 'PT session confirmed',
      body: `Your PT session is booked for ${when}.`,
      priority: 'normal',
      status: 'sent',
    },
  ]);

  const [session] = await db.select().from(ptSessions).where(eq(ptSessions.id, id));
  return session;
}

export async function listMyWorkoutPlans(userId: string) {
  return db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.memberId, userId), eq(workoutPlans.isActive, true)))
    .orderBy(desc(workoutPlans.createdAt));
}

export async function listMyWorkoutLogs(userId: string) {
  return db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.personId, userId))
    .orderBy(desc(workoutLogs.workoutDate), desc(workoutLogs.createdAt));
}

export async function addWorkoutLog(
  userId: string,
  input: { planId?: string; workoutDate: string; durationMin?: number; mood?: 'great' | 'good' | 'okay' | 'tired' | 'poor'; caloriesBurned?: number; notes?: string },
) {
  const id = ids.uuid();
  await db.insert(workoutLogs).values({
    id,
    personId: userId,
    planId: input.planId ?? null,
    workoutDate: safeDate(input.workoutDate),
    durationMin: input.durationMin ?? null,
    mood: input.mood ?? null,
    caloriesBurned: input.caloriesBurned ?? null,
    notes: input.notes ?? null,
  });
  const [row] = await db.select().from(workoutLogs).where(eq(workoutLogs.id, id));
  return row;
}

export async function getMyMetrics(userId: string) {
  return db.select().from(memberMetrics).where(eq(memberMetrics.personId, userId)).orderBy(desc(memberMetrics.recordedAt));
}

export async function addMetric(
  userId: string,
  input: { weightKg?: number; heightCm?: number; bmi?: number; restingHr?: number; notes?: string },
) {
  const id = ids.uuid();
  await db.insert(memberMetrics).values({
    id,
    personId: userId,
    source: 'manual',
    weightKg: input.weightKg != null ? String(input.weightKg) : null,
    heightCm: input.heightCm != null ? String(input.heightCm) : null,
    bmi: input.bmi != null ? String(input.bmi) : null,
    restingHr: input.restingHr ?? null,
    notes: input.notes ?? null,
  });
  const [row] = await db.select().from(memberMetrics).where(eq(memberMetrics.id, id));
  return row;
}

export async function addMetricForMember(
  trainerId: string,
  memberId: string,
  input: { weightKg?: number; heightCm?: number; bmi?: number; restingHr?: number; notes?: string },
) {
  const [member] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, memberId)).limit(1);
  if (!member || member.role !== 'member') throw errors.notFound('Member');

  const id = ids.uuid();
  await db.insert(memberMetrics).values({
    id,
    personId: memberId,
    source: 'trainer',
    weightKg: input.weightKg != null ? String(input.weightKg) : null,
    heightCm: input.heightCm != null ? String(input.heightCm) : null,
    bmi: input.bmi != null ? String(input.bmi) : null,
    restingHr: input.restingHr ?? null,
    notes: input.notes ?? null,
  });

  await db.insert(messages).values({
    id: ids.uuid(),
    type: 'notification',
    channel: 'in_app',
    toPersonId: memberId,
    subject: 'New body metrics recorded',
    body: `A trainer updated your metrics. ${input.notes ? `Note: ${input.notes}` : ''}`.trim(),
    priority: 'normal',
    status: 'sent',
  });

  const [row] = await db.select().from(memberMetrics).where(eq(memberMetrics.id, id));
  return row;
}

export async function assignWorkoutPlanToMember(
  trainerId: string,
  input: {
    memberId: string;
    name: string;
    description?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    durationWeeks: number;
    daysPerWeek: number;
  },
) {
  const [member] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, input.memberId)).limit(1);
  if (!member || member.role !== 'member') throw errors.notFound('Member');

  const id = ids.uuid();
  await db.insert(workoutPlans).values({
    id,
    memberId: input.memberId,
    trainerId,
    name: input.name,
    description: input.description ?? null,
    source: 'trainer_created',
    difficulty: input.difficulty ?? 'beginner',
    durationWeeks: safeInt(input.durationWeeks, 4),
    daysPerWeek: safeInt(input.daysPerWeek, 3),
    isActive: true,
  });

  await db.insert(messages).values({
    id: ids.uuid(),
    type: 'notification',
    channel: 'in_app',
    toPersonId: input.memberId,
    subject: 'New workout plan assigned',
    body: `Your trainer assigned "${input.name}" (${input.daysPerWeek} days/week for ${input.durationWeeks} weeks).`,
    priority: 'normal',
    status: 'sent',
  });

  const [row] = await db.select().from(workoutPlans).where(eq(workoutPlans.id, id));
  return row;
}

export async function listEquipment() {
  return db.select().from(equipment).orderBy(equipment.name);
}

export async function updateEquipmentStatus(
  equipmentId: string,
  input: { status: 'operational' | 'needs_maintenance' | 'under_maintenance' | 'retired'; zoneLabel?: string },
) {
  await db.update(equipment).set({
    status: input.status,
    zoneLabel: input.zoneLabel,
  }).where(eq(equipment.id, equipmentId));
  const [row] = await db.select().from(equipment).where(eq(equipment.id, equipmentId));
  if (!row) throw errors.notFound('Equipment');
  return row;
}

export async function listEquipmentEvents() {
  return db.select().from(equipmentEvents).orderBy(desc(equipmentEvents.createdAt));
}

export async function addEquipmentEvent(
  userId: string,
  input: { equipmentId: string; eventType: 'issue_reported' | 'maintenance_done'; severity?: 'low' | 'medium' | 'high' | 'critical'; description: string; status?: 'open' | 'in_progress' | 'resolved' },
) {
  const id = ids.uuid();
  await db.insert(equipmentEvents).values({
    id,
    equipmentId: input.equipmentId,
    eventType: input.eventType,
    severity: input.severity ?? null,
    description: input.description,
    status: input.status ?? (input.eventType === 'issue_reported' ? 'open' : 'resolved'),
    loggedBy: userId,
  });
  const [row] = await db.select().from(equipmentEvents).where(eq(equipmentEvents.id, id));
  return row;
}

export async function listInventoryItems() {
  return db.select().from(inventoryItems).where(eq(inventoryItems.isActive, true)).orderBy(inventoryItems.name);
}

export async function addInventoryTransaction(
  userId: string,
  input: { itemId: string; txnType: 'restock' | 'sale' | 'adjustment' | 'waste'; qtyChange: number; reference?: string },
) {
  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, input.itemId));
  if (!item) throw errors.notFound('Inventory item');

  const id = ids.uuid();
  await db.insert(inventoryTransactions).values({
    id,
    itemId: input.itemId,
    txnType: input.txnType,
    qtyChange: input.qtyChange,
    reference: input.reference ?? null,
    recordedBy: userId,
  });

  const qty = safeInt(input.qtyChange, 0);
  const nextQty = Math.max(0, item.qtyInStock + qty);
  await db.update(inventoryItems).set({ qtyInStock: nextQty }).where(eq(inventoryItems.id, input.itemId));

  const [txn] = await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.id, id));
  return txn;
}

export async function listMessagesForUser(userId: string, role: Role) {
  return db
    .select()
    .from(messages)
    .where(sql`(${messages.toPersonId} = ${userId}) or (${messages.targetRole} = ${role}) or (${messages.toPersonId} is null and ${messages.targetRole} is null)`)
    .orderBy(desc(messages.createdAt));
}

export async function markMessageRead(messageId: string, userId: string, role: Role) {
  const [msg] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!msg) throw errors.notFound('Message');

  const canAccess = msg.toPersonId === userId
    || msg.targetRole === role
    || (msg.toPersonId == null && msg.targetRole == null);
  if (!canAccess) throw errors.forbidden('You do not have access to this message');

  if (msg.status !== 'read') {
    await db.update(messages).set({ status: 'read' }).where(eq(messages.id, messageId));
  }
  const [updated] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  return updated!;
}

export async function getReportSummary() {
  const [revenue] = await db.select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(sql`month(${payments.paymentDate}) = month(curdate()) and year(${payments.paymentDate}) = year(curdate())`);
  const [activeMembers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.role, 'member'), eq(users.memberStatus, 'active'), isNull(users.deletedAt)));
  const [totalVisits] = await db.select({ count: sql<number>`count(*)` }).from(visits).where(sql`date(${visits.checkInAt}) >= date_sub(curdate(), interval 30 day)`);
  const [openIncidents] = await db.select({ count: sql<number>`count(*)` }).from(equipmentEvents).where(eq(equipmentEvents.status, 'open'));

  return {
    monthlyRevenue: Number(revenue?.total ?? 0),
    activeMembers: Number(activeMembers?.count ?? 0),
    visitsLast30Days: Number(totalVisits?.count ?? 0),
    openEquipmentIncidents: Number(openIncidents?.count ?? 0),
  };
}

export async function getRecentReportItems() {
  const recentPayments = await db
    .select({
      id: payments.id,
      createdAt: payments.createdAt,
      kind: sql<string>`'payment'`,
      title: sql<string>`concat('Payment ', ${payments.receiptNumber})`,
    })
    .from(payments)
    .orderBy(desc(payments.createdAt))
    .limit(5);

  const recentIncidents = await db
    .select({
      id: equipmentEvents.id,
      createdAt: equipmentEvents.createdAt,
      kind: sql<string>`'equipment_event'`,
      title: equipmentEvents.description,
    })
    .from(equipmentEvents)
    .orderBy(desc(equipmentEvents.createdAt))
    .limit(5);

  return [...recentPayments, ...recentIncidents]
    .sort((a, b) => (new Date(String(b.createdAt ?? 0)).getTime() || 0) - (new Date(String(a.createdAt ?? 0)).getTime() || 0))
    .slice(0, 8);
}

export async function listConfig() {
  return db.select().from(config);
}

export async function updateConfigValues(values: Record<string, string>) {
  const entries = Object.entries(values).filter(([k]) => k.trim().length > 0);
  for (const [key, value] of entries) {
    await db.insert(config).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
  }
  return listConfig();
}

export async function listUsersByRole(role?: Role) {
  if (role) {
    return db.select().from(users).where(and(eq(users.role, role), isNull(users.deletedAt))).orderBy(desc(users.createdAt));
  }
  return db.select().from(users).where(isNull(users.deletedAt)).orderBy(desc(users.createdAt));
}

export async function listTrainers() {
  return db
    .select({
      id: users.id,
      fullName: users.fullName,
    })
    .from(users)
    .where(and(eq(users.role, 'trainer'), eq(users.isActive, true), isNull(users.deletedAt)))
    .orderBy(users.fullName);
}

export async function createUser(input: {
  fullName: string;
  email: string;
  role: Role;
  password: string;
  phone?: string;
}) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) throw errors.conflict('Email is already in use');

  const id = ids.uuid();
  await db.insert(users).values({
    id,
    fullName: input.fullName,
    email: input.email.toLowerCase().trim(),
    phone: input.phone ?? null,
    role: input.role,
    passwordHash: await hashPassword(input.password),
    emailVerified: true,
    isActive: true,
    employeeCode: input.role === 'trainer' || input.role === 'staff' || input.role === 'manager'
      ? `EMP-${Date.now().toString().slice(-6)}`
      : null,
  });

  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row;
}

export async function updateUser(
  userId: string,
  input: Partial<{ fullName: string; phone: string; isActive: boolean; role: Role; memberStatus: 'active' | 'inactive' | 'suspended' }>,
) {
  await db.update(users).set({
    fullName: input.fullName,
    phone: input.phone,
    isActive: input.isActive,
    role: input.role,
    memberStatus: input.memberStatus,
  }).where(eq(users.id, userId));
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  if (!row) throw errors.notFound('User');
  return row;
}

export async function listMembers() {
  return db.select().from(users).where(and(eq(users.role, 'member'), isNull(users.deletedAt))).orderBy(desc(users.createdAt));
}

export async function listClosures() {
  return db.select().from(branchClosures).orderBy(desc(branchClosures.closureDate));
}

export async function createClosure(
  userId: string,
  input: { closureDate: string; reason?: string; isEmergency?: boolean },
) {
  const id = ids.uuid();
  await db.insert(branchClosures).values({
    id,
    closureDate: safeDate(input.closureDate),
    reason: input.reason ?? null,
    isEmergency: input.isEmergency ?? false,
    closedBy: userId,
  });
  const [row] = await db.select().from(branchClosures).where(eq(branchClosures.id, id));
  return row;
}

export async function deleteClosure(id: string) {
  await db.delete(branchClosures).where(eq(branchClosures.id, id));
}

type SimOtp = { code: string; expiresAt: number; generatedBy: string };
const simulateDoorOtpStore = new Map<string, SimOtp>();

export async function simulateGenerateDoorOtp(userId: string, expiresInSec = 120) {
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const token = ids.uuid();
  simulateDoorOtpStore.set(token, {
    code,
    expiresAt: Date.now() + Math.max(30, expiresInSec) * 1000,
    generatedBy: userId,
  });
  return { token, code, expiresAt: new Date(simulateDoorOtpStore.get(token)!.expiresAt).toISOString() };
}

export async function simulateDoorScan(input: { token: string; code: string; personId: string }) {
  const otp = simulateDoorOtpStore.get(input.token);
  if (!otp) throw errors.badRequest('Invalid simulation token');
  if (Date.now() > otp.expiresAt) throw errors.badRequest('OTP expired');
  if (otp.code !== input.code) throw errors.badRequest('Invalid OTP code');

  const [activeVisit] = await db.select().from(visits).where(and(eq(visits.personId, input.personId), eq(visits.status, 'active'))).limit(1);
  if (activeVisit) {
    const out = await checkOut(input.personId);
    return { action: 'check_out', visit: out };
  }
  const incoming = await checkIn(input.personId);
  return { action: 'check_in', visit: incoming };
}

export async function simulatePayment(input: { memberId: string; planId: string; paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'online' }) {
  return purchaseSubscription(input.memberId, {
    planId: input.planId,
    paymentMethod: input.paymentMethod ?? 'online',
  });
}

export async function simulateWorkout(input: { memberId: string; durationMin?: number; caloriesBurned?: number; notes?: string }) {
  return addWorkoutLog(input.memberId, {
    workoutDate: dateOnlyIso(new Date()),
    durationMin: input.durationMin ?? 45,
    caloriesBurned: input.caloriesBurned ?? 300,
    mood: 'good',
    notes: input.notes ?? 'Simulated workout log',
  });
}

export async function simulateTrainerShift(input: { trainerId: string; action?: 'in' | 'out' }) {
  if (input.action === 'out') {
    const out = await checkOut(input.trainerId);
    return { action: 'out', visit: out };
  }
  if (input.action === 'in') {
    const inside = await checkIn(input.trainerId);
    return { action: 'in', visit: inside };
  }
  const [activeVisit] = await db.select().from(visits).where(and(eq(visits.personId, input.trainerId), eq(visits.status, 'active'))).limit(1);
  if (activeVisit) {
    const out = await checkOut(input.trainerId);
    return { action: 'out', visit: out };
  }
  const inside = await checkIn(input.trainerId);
  return { action: 'in', visit: inside };
}

export async function simulateAppointment(input: { memberId: string; trainerId: string; sessionDate: string; startTime: string; endTime: string }) {
  return createPtSession(input);
}

export async function getSimulationState() {
  const [todayVisits, todayPayments, recentWorkouts, upcomingSessions] = await Promise.all([
    db.select().from(visits).orderBy(desc(visits.createdAt)).limit(20),
    db.select().from(payments).orderBy(desc(payments.createdAt)).limit(20),
    db.select().from(workoutLogs).orderBy(desc(workoutLogs.createdAt)).limit(20),
    db.select().from(ptSessions).orderBy(desc(ptSessions.createdAt)).limit(20),
  ]);

  return {
    now: new Date().toISOString(),
    visits: todayVisits,
    payments: todayPayments,
    workouts: recentWorkouts,
    ptSessions: upcomingSessions,
    activeDoorOtps: Array.from(simulateDoorOtpStore.entries()).map(([token, otp]) => ({
      token,
      code: otp.code,
      expiresAt: new Date(otp.expiresAt).toISOString(),
      generatedBy: otp.generatedBy,
      expired: Date.now() > otp.expiresAt,
    })),
  };
}

