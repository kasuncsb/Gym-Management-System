import { createHash } from 'node:crypto';
import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import {
  config,
  users,
  memberProfiles,
  subscriptionPlans,
  promotions,
  subscriptions,
  subscriptionFreezes,
  payments,
  paymentSessions,
  visits,
  ptSessions,
  workoutPlans,
  workoutLogs,
  workoutSessions,
  workoutSessionEvents,
  memberMetrics,
  equipment,
  equipmentEvents,
  inventoryItems,
  inventoryTransactions,
  messages,
  branchClosures,
  exercises,
  workoutPlanExercises,
  shifts,
  trainerCertifications,
  invoiceRecords,
} from '../db/schema.js';
import { ids } from '../utils/id.js';
import { errors } from '../utils/errors.js';
import { hashPassword } from '../utils/password.js';
import { assertMemberCanPurchaseSubscription } from './auth.service.js';
import * as audit from './audit.service.js';
import { getConfigValue } from './config.service.js';
import { generateInvoiceEmailHTML, sendEmail } from '../utils/email.js';

type Role = 'admin' | 'manager' | 'trainer' | 'member';

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

export function hashPaymentInstrument(pan: string): { fullHash: string; lastFour: string | null } {
  const digits = pan.replace(/\D/g, '');
  const lastFour = digits.length >= 4 ? digits.slice(-4) : null;
  const fullHash = createHash('sha256').update(digits, 'utf8').digest('hex');
  return { fullHash, lastFour };
}

async function issueInvoiceRecord(input: {
  paymentId: string;
  memberId: string;
  memberName: string;
  memberEmail: string | null;
  planName: string;
  amount: number;
  paymentDate: Date;
  receiptNumber: string;
  referenceNumber: string;
}) {
  const [existing] = await db.select().from(invoiceRecords).where(eq(invoiceRecords.paymentId, input.paymentId)).limit(1);
  if (existing) return existing;
  const invoiceId = ids.uuid();
  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
  const html = generateInvoiceEmailHTML({
    invoiceNumber,
    memberName: input.memberName,
    planName: input.planName,
    amount: input.amount,
    paymentDate: dateOnlyIso(input.paymentDate),
    receiptNumber: input.receiptNumber,
    referenceNumber: input.referenceNumber,
  });
  await db.insert(invoiceRecords).values({
    id: invoiceId,
    paymentId: input.paymentId,
    memberId: input.memberId,
    invoiceNumber,
    status: 'issued',
    emailTo: input.memberEmail,
    htmlContent: html,
  });
  if (input.memberEmail) {
    try {
      await sendEmail(input.memberEmail, `Invoice ${invoiceNumber}`, html);
      await db.update(invoiceRecords).set({ status: 'emailed' }).where(eq(invoiceRecords.id, invoiceId));
    } catch {
      // keep issued status when email fails
    }
  }
  await audit.appendAudit({
    actorId: input.memberId,
    action: 'invoice_issued',
    category: 'payment',
    entityType: 'payment',
    entityId: input.paymentId,
    detail: invoiceNumber,
  });
  const [invoice] = await db.select().from(invoiceRecords).where(eq(invoiceRecords.id, invoiceId)).limit(1);
  return invoice!;
}

async function settleSubscriptionPurchase(
  userId: string,
  input: {
    planId: string;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online';
    promotionCode?: string;
    cardPan?: string;
    sessionId?: string;
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
    const [promo] = await db.select().from(promotions).where(and(eq(promotions.code, input.promotionCode.trim()), eq(promotions.isActive, true)));
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
    startDate,
    endDate,
    status: 'active',
    pricePaid: String(pricePaid),
    discountAmount: String(discountAmount),
    promotionId,
    ptSessionsLeft: plan.includedPtSessions ?? 0,
  });

  const instrumentHash = input.cardPan?.trim() ? hashPaymentInstrument(input.cardPan).fullHash : null;
  const paymentId = ids.uuid();
  const receiptNumber = `RCPT-${Date.now()}`;
  const referenceNumber = `REF-${Math.floor(Math.random() * 1_000_000)}`;
  await db.insert(payments).values({
    id: paymentId,
    subscriptionId,
    amount: String(pricePaid),
    paymentMethod: input.paymentMethod,
    paymentDate: startDate,
    status: 'completed',
    receiptNumber,
    referenceNumber,
    instrumentHash,
    promotionId,
    discountAmount: String(discountAmount),
    recordedBy: userId,
  });

  await db.update(users).set({
    memberStatus: 'active',
    joinDate: sql`coalesce(${users.joinDate}, curdate())`,
  }).where(eq(users.id, userId));

  if (input.sessionId) {
    await db.update(paymentSessions).set({
      status: 'approved',
      approvedSubscriptionId: subscriptionId,
      approvedPaymentId: paymentId,
      decisionPayload: JSON.stringify({ approvedAt: new Date().toISOString() }),
    }).where(eq(paymentSessions.id, input.sessionId));
  }

  const [u] = await db.select({ fullName: users.fullName, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  await audit.appendAudit({
    actorId: userId,
    actorLabel: u?.fullName ?? u?.email ?? null,
    action: input.sessionId ? 'session_approved' : 'subscription_purchased',
    category: 'payment',
    entityType: input.sessionId ? 'payment_session' : 'subscription',
    entityId: input.sessionId ?? subscriptionId,
    detail: `plan=${plan.id} method=${input.paymentMethod}`,
  });
  const invoice = await issueInvoiceRecord({
    paymentId,
    memberId: userId,
    memberName: u?.fullName ?? 'Member',
    memberEmail: u?.email ?? null,
    planName: plan.name,
    amount: pricePaid,
    paymentDate: startDate,
    receiptNumber,
    referenceNumber,
  });
  const [created] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId));
  return { subscription: created!, paymentId, invoice };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

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
    const [upcomingSessions] = await db.select({ count: sql<number>`count(*)` }).from(ptSessions).where(and(eq(ptSessions.trainerId, userId), sql`${ptSessions.sessionDate} >= curdate()`, sql`${ptSessions.status} in ('booked','confirmed')`));
    const [assignedMembers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.role, 'member'), eq(users.assignedTrainerId, userId), isNull(users.deletedAt)));
    const [pendingIssues] = await db.select({ count: sql<number>`count(*)` }).from(equipmentEvents).where(and(eq(equipmentEvents.loggedBy, userId), eq(equipmentEvents.status, 'open')));
    return {
      ...base,
      sessionsToday: Number(sessionsToday?.count ?? 0),
      upcomingSessions: Number(upcomingSessions?.count ?? 0),
      assignedMembersCount: Number(assignedMembers?.count ?? 0),
      pendingEquipmentIssues: Number(pendingIssues?.count ?? 0),
    };
  }

  if (role === 'manager') {
    const [trainersOnShift] = await db.select({ count: sql<number>`count(*)` }).from(visits).leftJoin(users, eq(users.id, visits.personId)).where(and(eq(visits.status, 'active'), eq(users.role, 'trainer')));
    const [frozenSubs] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'frozen'));
    const [pendingId] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.idVerificationStatus, 'pending'), isNull(users.deletedAt)));
    return {
      ...base,
      trainersOnShift: Number(trainersOnShift?.count ?? 0),
      frozenSubscriptions: Number(frozenSubs?.count ?? 0),
      pendingIdVerifications: Number(pendingId?.count ?? 0),
    };
  }

  if (role === 'admin') {
    const [pendingId] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.idVerificationStatus, 'pending'), isNull(users.deletedAt)));
    const [frozenSubs] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'frozen'));
    const [systemAlerts] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.status, 'sent'), sql`${messages.priority} in ('high','critical')`));
    return {
      ...base,
      pendingIdVerifications: Number(pendingId?.count ?? 0),
      frozenSubscriptions: Number(frozenSubs?.count ?? 0),
      systemAlertCount: Number(systemAlerts?.count ?? 0),
    };
  }

  return base;
}

// ── Subscription Plans ────────────────────────────────────────────────────────

export async function listPlans(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false;
  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(includeInactive
      ? isNull(subscriptionPlans.deletedAt)
      : and(eq(subscriptionPlans.isActive, true), isNull(subscriptionPlans.deletedAt)))
    .orderBy(subscriptionPlans.sortOrder, subscriptionPlans.createdAt);

  // Attach active subscriber count per plan
  const counts = await db
    .select({ planId: subscriptions.planId, count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'))
    .groupBy(subscriptions.planId);

  const countMap = Object.fromEntries(counts.map(c => [c.planId, Number(c.count)]));
  return plans.map(p => ({ ...p, activeSubscribers: countMap[p.id] ?? 0 }));
}

// ── Promotions ─────────────────────────────────────────────────────────────────

export async function listPromotions() {
  return db.select().from(promotions).orderBy(desc(promotions.createdAt));
}

export async function createPromotion(input: {
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: string;
  validUntil?: string;
  isActive?: boolean;
}) {
  const id = ids.uuid();
  await db.insert(promotions).values({
    id,
    code: input.code.toUpperCase().trim(),
    name: input.name,
    discountType: input.discountType,
    discountValue: String(input.discountValue),
    validFrom: safeDate(input.validFrom),
    validUntil: input.validUntil ? safeDate(input.validUntil) : null,
    isActive: input.isActive ?? true,
    usedCount: 0,
  });
  const [promo] = await db.select().from(promotions).where(eq(promotions.id, id));
  return promo;
}

export async function updatePromotion(
  promoId: string,
  input: Partial<{
    name: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
  }>,
) {
  await db.update(promotions).set({
    name: input.name,
    discountType: input.discountType,
    discountValue: input.discountValue != null ? String(input.discountValue) : undefined,
    validFrom: input.validFrom ? safeDate(input.validFrom) : undefined,
    validUntil: input.validUntil ? safeDate(input.validUntil) : undefined,
    isActive: input.isActive,
  }).where(eq(promotions.id, promoId));
  const [promo] = await db.select().from(promotions).where(eq(promotions.id, promoId));
  if (!promo) throw errors.notFound('Promotion');
  return promo;
}

export async function deactivatePromotion(promoId: string) {
  await db.update(promotions).set({ isActive: false }).where(eq(promotions.id, promoId));
  return { id: promoId, deactivated: true };
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

// ── Subscriptions & Payments ──────────────────────────────────────────────────

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
      invoiceId: invoiceRecords.id,
      invoiceNumber: invoiceRecords.invoiceNumber,
    })
    .from(payments)
    .leftJoin(subscriptions, eq(subscriptions.id, payments.subscriptionId))
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
    .leftJoin(invoiceRecords, eq(invoiceRecords.paymentId, payments.id))
    .where(eq(subscriptions.memberId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function listAllSubscriptions() {
  return db
    .select({
      id: subscriptions.id,
      memberId: subscriptions.memberId,
      memberName: users.fullName,
      memberCode: users.memberCode,
      planId: subscriptions.planId,
      planName: subscriptionPlans.name,
      planType: subscriptionPlans.planType,
      status: subscriptions.status,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      pricePaid: subscriptions.pricePaid,
      ptSessionsLeft: subscriptions.ptSessionsLeft,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .leftJoin(users, eq(users.id, subscriptions.memberId))
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
    .orderBy(desc(subscriptions.createdAt));
}

export async function listAllPayments() {
  return db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      paymentDate: payments.paymentDate,
      status: payments.status,
      receiptNumber: payments.receiptNumber,
      referenceNumber: payments.referenceNumber,
      discountAmount: payments.discountAmount,
      memberId: subscriptions.memberId,
      memberName: users.fullName,
      planName: subscriptionPlans.name,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .leftJoin(subscriptions, eq(subscriptions.id, payments.subscriptionId))
    .leftJoin(users, eq(users.id, subscriptions.memberId))
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
    .orderBy(desc(payments.createdAt));
}

export async function purchaseSubscription(
  userId: string,
  input: {
    planId: string;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'online';
    promotionCode?: string;
    /** Digits only or spaced card number — hashed server-side; never stored raw */
    cardPan?: string;
  },
) {
  const result = await settleSubscriptionPurchase(userId, input);
  return result.subscription;
}

export async function expireStaleSessions() {
  await db.update(paymentSessions).set({ status: 'expired' }).where(
    and(eq(paymentSessions.status, 'pending'), lt(paymentSessions.expiresAt, new Date())),
  );
}

export async function createPaymentSession(
  memberId: string,
  input: { planId: string; promotionCode?: string; paymentMethod?: 'card' | 'online' | 'bank_transfer' | 'cash'; cardPan?: string; cardHolder?: string; ttlSec?: number },
) {
  await expireStaleSessions();
  const [existing] = await db.select().from(paymentSessions).where(and(eq(paymentSessions.memberId, memberId), eq(paymentSessions.planId, input.planId), eq(paymentSessions.status, 'pending'))).orderBy(desc(paymentSessions.createdAt)).limit(1);
  if (existing) return existing;
  const [plan] = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.id, input.planId), eq(subscriptionPlans.isActive, true), isNull(subscriptionPlans.deletedAt))).limit(1);
  if (!plan) throw errors.notFound('Subscription plan');
  const amount = Number(plan.price);
  const ttlSec = Math.max(30, Math.min(600, Number(input.ttlSec ?? 180)));
  const id = ids.uuid();
  const expiresAt = new Date(Date.now() + ttlSec * 1000);
  const requestPayload = JSON.stringify({
    paymentMethod: input.paymentMethod ?? 'card',
    cardHolder: input.cardHolder ?? null,
    cardPanMasked: input.cardPan ? `**** **** **** ${input.cardPan.replace(/\D/g, '').slice(-4)}` : null,
  });
  await db.insert(paymentSessions).values({
    id,
    memberId,
    planId: input.planId,
    promotionCode: input.promotionCode ?? null,
    amount: String(amount),
    status: 'pending',
    providerRef: `SIM-PROC-${Date.now()}`,
    requestPayload,
    expiresAt,
  });
  await audit.appendAudit({
    actorId: memberId,
    action: 'session_created',
    category: 'payment',
    entityType: 'payment_session',
    entityId: id,
    detail: `plan=${input.planId}`,
  });
  const [session] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, id)).limit(1);
  return session!;
}

export async function listPendingPaymentSessions() {
  await expireStaleSessions();
  return db.select({
    id: paymentSessions.id,
    memberId: paymentSessions.memberId,
    memberName: users.fullName,
    planId: paymentSessions.planId,
    planName: subscriptionPlans.name,
    amount: paymentSessions.amount,
    status: paymentSessions.status,
    providerRef: paymentSessions.providerRef,
    expiresAt: paymentSessions.expiresAt,
    createdAt: paymentSessions.createdAt,
  })
    .from(paymentSessions)
    .leftJoin(users, eq(users.id, paymentSessions.memberId))
    .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, paymentSessions.planId))
    .where(eq(paymentSessions.status, 'pending'))
    .orderBy(paymentSessions.createdAt);
}

export async function getPaymentSessionById(sessionId: string, memberId?: string) {
  await expireStaleSessions();
  const conditions = memberId ? and(eq(paymentSessions.id, sessionId), eq(paymentSessions.memberId, memberId)) : eq(paymentSessions.id, sessionId);
  const [session] = await db.select().from(paymentSessions).where(conditions).limit(1);
  if (!session) throw errors.notFound('Payment session');
  return session;
}

export async function setPaymentSessionProcessing(sessionId: string) {
  const [session] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, sessionId)).limit(1);
  if (!session) throw errors.notFound('Payment session');
  if (session.status !== 'pending') return session;
  await db.update(paymentSessions).set({ status: 'processing' }).where(eq(paymentSessions.id, sessionId));
  await audit.appendAudit({ actorId: session.memberId, action: 'session_processing', category: 'payment', entityType: 'payment_session', entityId: session.id });
  const [updated] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, sessionId)).limit(1);
  return updated!;
}

export async function approvePaymentSession(sessionId: string) {
  const [session] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, sessionId)).limit(1);
  if (!session) throw errors.notFound('Payment session');
  if (session.status === 'approved' && session.approvedSubscriptionId) {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, session.approvedSubscriptionId)).limit(1);
    return { subscription: sub ?? null, reused: true };
  }
  if (session.status === 'declined' || session.status === 'expired') throw errors.conflict(`Session is ${session.status}`);
  await setPaymentSessionProcessing(sessionId);
  const payload = session.requestPayload ? (JSON.parse(session.requestPayload) as any) : {};
  const result = await settleSubscriptionPurchase(session.memberId, {
    planId: session.planId,
    promotionCode: session.promotionCode ?? undefined,
    paymentMethod: (payload.paymentMethod ?? 'card') as any,
    cardPan: undefined,
    sessionId: session.id,
  });
  return { subscription: result.subscription, invoice: result.invoice, reused: false };
}

export async function declinePaymentSession(sessionId: string, reason?: string) {
  const [session] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, sessionId)).limit(1);
  if (!session) throw errors.notFound('Payment session');
  if (session.status === 'approved') throw errors.conflict('Approved session cannot be declined');
  await db.update(paymentSessions).set({
    status: 'declined',
    decisionPayload: JSON.stringify({ reason: reason ?? 'declined by processor', declinedAt: new Date().toISOString() }),
  }).where(eq(paymentSessions.id, sessionId));
  await audit.appendAudit({
    actorId: session.memberId,
    action: 'session_declined',
    category: 'payment',
    entityType: 'payment_session',
    entityId: session.id,
    detail: reason ?? 'declined',
  });
  const [updated] = await db.select().from(paymentSessions).where(eq(paymentSessions.id, sessionId)).limit(1);
  return updated!;
}

export async function getPaymentInvoiceHtml(paymentId: string, memberId: string) {
  const [invoice] = await db.select().from(invoiceRecords).where(and(eq(invoiceRecords.paymentId, paymentId), eq(invoiceRecords.memberId, memberId))).limit(1);
  if (!invoice) throw errors.notFound('Invoice');
  return invoice;
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

export async function unfreezeSubscription(subscriptionId: string) {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  if (!sub) throw errors.notFound('Subscription');
  if (sub.status !== 'frozen') throw errors.badRequest('Subscription is not frozen');

  // Find the latest freeze record and extend endDate by the number of frozen days
  const [freeze] = await db
    .select()
    .from(subscriptionFreezes)
    .where(eq(subscriptionFreezes.subscriptionId, subscriptionId))
    .orderBy(desc(subscriptionFreezes.createdAt))
    .limit(1);

  let newEndDate: Date | undefined;
  if (freeze) {
    const freezeStart = new Date(freeze.freezeStart);
    const freezeEnd = new Date(freeze.freezeEnd);
    const frozenDays = Math.ceil((freezeEnd.getTime() - freezeStart.getTime()) / 86_400_000);
    const currentEnd = new Date(sub.endDate);
    newEndDate = addDays(currentEnd, frozenDays);
  }

  await db.update(subscriptions).set({
    status: 'active',
    notes: 'Unfrozen by admin/manager',
    ...(newEndDate && { endDate: newEndDate }),
  }).where(eq(subscriptions.id, subscriptionId));

  const [updated] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId));
  return updated;
}

// ── Check-in / Check-out ──────────────────────────────────────────────────────

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
      const [u] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, userId)).limit(1);
      await audit.appendAudit({
        actorId: userId,
        actorLabel: u?.fullName ?? null,
        action: 'check_in_denied',
        category: 'access',
        entityType: 'visit',
        entityId: deniedId,
        detail: 'Subscription is not active',
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
  const [u] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, userId)).limit(1);
  await audit.appendAudit({
    actorId: userId,
    actorLabel: u?.fullName ?? null,
    action: 'check_in',
    category: 'access',
    entityType: 'visit',
    entityId: id,
    detail: `role=${person.role}`,
  });
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
  const [u] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, userId)).limit(1);
  await audit.appendAudit({
    actorId: userId,
    actorLabel: u?.fullName ?? null,
    action: 'check_out',
    category: 'access',
    entityType: 'visit',
    entityId: current.id,
    detail: `${durationMinutes} min`,
  });
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

export async function getPublicSystemStatus() {
  const m = await getConfigValue('maintenance_mode', 'false');
  return { maintenanceMode: m === 'true' };
}

export async function getBranchCapacity() {
  const v = await getConfigValue('branch_capacity', '120');
  return { capacity: Math.max(1, Number(v) || 120) };
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

// ── PT Sessions ───────────────────────────────────────────────────────────────

export async function listMyPtSessions(userId: string) {
  return db
    .select({
      id: ptSessions.id,
      memberId: ptSessions.memberId,
      trainerId: ptSessions.trainerId,
      sessionDate: ptSessions.sessionDate,
      startTime: ptSessions.startTime,
      endTime: ptSessions.endTime,
      status: ptSessions.status,
      cancelReason: ptSessions.cancelReason,
      reviewRating: ptSessions.reviewRating,
      createdAt: ptSessions.createdAt,
      trainerName: users.fullName,
    })
    .from(ptSessions)
    .leftJoin(users, eq(users.id, ptSessions.trainerId))
    .where(eq(ptSessions.memberId, userId))
    .orderBy(desc(ptSessions.sessionDate));
}

export async function listTrainerPtSessions(userId: string) {
  const memberAlias = users;
  return db
    .select({
      id: ptSessions.id,
      memberId: ptSessions.memberId,
      trainerId: ptSessions.trainerId,
      sessionDate: ptSessions.sessionDate,
      startTime: ptSessions.startTime,
      endTime: ptSessions.endTime,
      status: ptSessions.status,
      cancelReason: ptSessions.cancelReason,
      reviewRating: ptSessions.reviewRating,
      createdAt: ptSessions.createdAt,
      memberName: memberAlias.fullName,
    })
    .from(ptSessions)
    .leftJoin(memberAlias, eq(memberAlias.id, ptSessions.memberId))
    .where(eq(ptSessions.trainerId, userId))
    .orderBy(desc(ptSessions.sessionDate));
}

export async function listAllPtSessions() {
  const members = db.$with('members').as(db.select({ id: users.id, fullName: users.fullName }).from(users));
  const trainers = db.$with('trainers').as(db.select({ id: users.id, fullName: users.fullName }).from(users));

  return db
    .select({
      id: ptSessions.id,
      memberId: ptSessions.memberId,
      trainerId: ptSessions.trainerId,
      sessionDate: ptSessions.sessionDate,
      startTime: ptSessions.startTime,
      endTime: ptSessions.endTime,
      status: ptSessions.status,
      cancelReason: ptSessions.cancelReason,
      reviewRating: ptSessions.reviewRating,
      createdAt: ptSessions.createdAt,
      memberName: sql<string>`(SELECT full_name FROM users WHERE id = ${ptSessions.memberId})`,
      trainerName: sql<string>`(SELECT full_name FROM users WHERE id = ${ptSessions.trainerId})`,
    })
    .from(ptSessions)
    .orderBy(desc(ptSessions.sessionDate));
}

export async function createPtSession(
  input: { memberId: string; trainerId: string; sessionDate: string; startTime: string; endTime: string },
) {
  const sessionDateObj = safeDate(input.sessionDate);

  // Trainer overlap check
  const trainerConflict = await db.select({ id: ptSessions.id }).from(ptSessions).where(and(
    eq(ptSessions.trainerId, input.trainerId),
    sql`date(${ptSessions.sessionDate}) = ${dateOnlyIso(sessionDateObj)}`,
    sql`${ptSessions.status} IN ('booked','confirmed')`,
    sql`${ptSessions.startTime} < ${input.endTime} AND ${ptSessions.endTime} > ${input.startTime}`,
  )).limit(1);
  if (trainerConflict.length) throw errors.conflict('Trainer already has a session at this time');

  // Member double-booking check
  const memberConflict = await db.select({ id: ptSessions.id }).from(ptSessions).where(and(
    eq(ptSessions.memberId, input.memberId),
    sql`date(${ptSessions.sessionDate}) = ${dateOnlyIso(sessionDateObj)}`,
    sql`${ptSessions.status} IN ('booked','confirmed')`,
    sql`${ptSessions.startTime} < ${input.endTime} AND ${ptSessions.endTime} > ${input.startTime}`,
  )).limit(1);
  if (memberConflict.length) throw errors.conflict('Member already has a session at this time');

  const id = ids.uuid();
  await db.insert(ptSessions).values({
    id,
    memberId: input.memberId,
    trainerId: input.trainerId,
    sessionDate: sessionDateObj,
    startTime: input.startTime,
    endTime: input.endTime,
    status: 'booked',
  });

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

export async function updatePtSession(
  sessionId: string,
  actorId: string,
  actorRole: Role,
  input: { status: 'confirmed' | 'completed' | 'cancelled' | 'no_show'; cancelReason?: string },
) {
  const [session] = await db.select().from(ptSessions).where(eq(ptSessions.id, sessionId)).limit(1);
  if (!session) throw errors.notFound('PT session');

  // Access control: members can only cancel their own sessions; trainers can confirm/complete/no-show their sessions
  if (actorRole === 'member') {
    if (session.memberId !== actorId) throw errors.forbidden('You can only manage your own sessions');
    if (input.status !== 'cancelled') throw errors.forbidden('Members can only cancel sessions');
  } else if (actorRole === 'trainer') {
    if (session.trainerId !== actorId) throw errors.forbidden('You can only manage sessions assigned to you');
    if (input.status === 'cancelled' && !input.cancelReason) throw errors.badRequest('Cancel reason is required');
  }

  await db.update(ptSessions).set({
    status: input.status,
    cancelReason: input.cancelReason ?? null,
  }).where(eq(ptSessions.id, sessionId));

  const when = `${String(session.sessionDate).slice(0, 10)} ${session.startTime} - ${session.endTime}`;

  // Cross-role notification on status change
  const notifyMap: Record<string, { toId: string; subject: string; body: string; priority: 'normal' | 'high' }> = {
    confirmed: {
      toId: session.memberId,
      subject: 'PT session confirmed',
      body: `Your PT session on ${when} has been confirmed by your trainer.`,
      priority: 'normal',
    },
    completed: {
      toId: session.memberId,
      subject: 'PT session completed',
      body: `Your PT session on ${when} has been marked as completed. Great work!`,
      priority: 'normal',
    },
    no_show: {
      toId: session.memberId,
      subject: 'PT session no-show recorded',
      body: `You were marked as no-show for your PT session on ${when}. Contact a trainer to reschedule.`,
      priority: 'high',
    },
    cancelled: {
      toId: actorRole === 'member' ? session.trainerId : session.memberId,
      subject: 'PT session cancelled',
      body: actorRole === 'member'
        ? `Your PT session scheduled for ${when} was cancelled by the member.`
        : `Your PT session on ${when} was cancelled. Reason: ${input.cancelReason ?? 'Not specified'}.`,
      priority: 'high',
    },
  };

  const n = notifyMap[input.status];
  if (n) {
    await db.insert(messages).values({
      id: ids.uuid(),
      type: 'notification',
      channel: 'in_app',
      toPersonId: n.toId,
      subject: n.subject,
      body: n.body,
      priority: n.priority,
      status: 'sent',
    });
  }

  const [updated] = await db.select().from(ptSessions).where(eq(ptSessions.id, sessionId));
  return updated;
}

// ── Workout Plans & Logs ──────────────────────────────────────────────────────

export async function listMyWorkoutPlans(userId: string) {
  return db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.memberId, userId), eq(workoutPlans.isActive, true)))
    .orderBy(desc(workoutPlans.createdAt));
}

export async function getMemberWorkoutPlans(memberId: string) {
  const [member] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, memberId)).limit(1);
  if (!member || member.role !== 'member') throw errors.notFound('Member');

  return db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.memberId, memberId), eq(workoutPlans.isActive, true)))
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

export async function getActiveWorkoutSession(userId: string) {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.personId, userId), eq(workoutSessions.status, 'active')))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);
  return session ?? null;
}

export async function startWorkoutSession(userId: string, input: { planId?: string; notes?: string }) {
  const active = await getActiveWorkoutSession(userId);
  if (active) return active;
  const id = ids.uuid();
  await db.insert(workoutSessions).values({
    id,
    personId: userId,
    planId: input.planId ?? null,
    status: 'active',
    startedAt: new Date(),
    notes: input.notes ?? null,
  });
  await db.insert(workoutSessionEvents).values({
    id: ids.uuid(),
    sessionId: id,
    personId: userId,
    eventType: 'started',
    payloadJson: input.planId ? JSON.stringify({ planId: input.planId }) : null,
  });
  const [row] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).limit(1);
  return row!;
}

export async function addWorkoutSessionEvent(userId: string, sessionId: string, input: {
  eventType: 'paused' | 'resumed' | 'exercise_started' | 'set_completed' | 'exercise_completed' | 'simulated';
  payload?: Record<string, unknown>;
}) {
  const [session] = await db.select().from(workoutSessions).where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.personId, userId))).limit(1);
  if (!session) throw errors.notFound('Workout session');
  await db.insert(workoutSessionEvents).values({
    id: ids.uuid(),
    sessionId,
    personId: userId,
    eventType: input.eventType,
    payloadJson: input.payload ? JSON.stringify(input.payload) : null,
  });
  if (input.eventType === 'paused') {
    await db.update(workoutSessions).set({ status: 'paused' }).where(eq(workoutSessions.id, sessionId));
  } else if (input.eventType === 'resumed') {
    await db.update(workoutSessions).set({ status: 'active' }).where(eq(workoutSessions.id, sessionId));
  }
  const [updated] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId)).limit(1);
  return updated!;
}

export async function stopWorkoutSession(
  userId: string,
  sessionId: string,
  input: { complete?: boolean; durationMin?: number; caloriesBurned?: number; mood?: 'great' | 'good' | 'okay' | 'tired' | 'poor'; notes?: string },
) {
  const [session] = await db.select().from(workoutSessions).where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.personId, userId))).limit(1);
  if (!session) throw errors.notFound('Workout session');
  if (session.status === 'completed' || session.status === 'stopped') return session;
  const endedAt = new Date();
  const durationMin = input.durationMin != null
    ? Math.max(1, Math.round(input.durationMin))
    : Math.max(1, Math.round((endedAt.getTime() - new Date(session.startedAt).getTime()) / 60_000));
  const status = input.complete ? 'completed' : 'stopped';
  await db.update(workoutSessions).set({
    status,
    endedAt,
    durationMin,
    caloriesBurned: input.caloriesBurned ?? null,
    mood: input.mood ?? null,
    notes: input.notes ?? session.notes ?? null,
  }).where(eq(workoutSessions.id, sessionId));
  await db.insert(workoutSessionEvents).values({
    id: ids.uuid(),
    sessionId,
    personId: userId,
    eventType: input.complete ? 'completed' : 'stopped',
    payloadJson: JSON.stringify({ durationMin }),
  });
  const logId = ids.uuid();
  await db.insert(workoutLogs).values({
    id: logId,
    personId: userId,
    planId: session.planId ?? null,
    workoutDate: endedAt,
    durationMin,
    mood: input.mood ?? null,
    caloriesBurned: input.caloriesBurned ?? null,
    notes: input.notes ?? 'Recorded from workout session',
  });
  const [updated] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId)).limit(1);
  return updated!;
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

type AiExercise = { day: number; name: string; muscleGroup?: string; sets?: number; reps?: number; durationSec?: number; restSec?: number; instructions?: string; sortOrder?: number };

function getFallbackExercisesFromTemplates(goals: string, level: string): AiExercise[] {
  const gl = goals.toLowerCase();
  const isMuscleGain = gl.includes('muscle') || gl.includes('strength') || gl.includes('gain');
  const isFatLoss = gl.includes('fat') || gl.includes('weight') || gl.includes('loss') || gl.includes('cardio');

  if (isMuscleGain) {
    return [
      { day: 1, name: 'Goblet Squat', muscleGroup: 'legs', sets: 3, reps: 10, restSec: 90, instructions: 'Hold dumbbell at chest, squat to parallel', sortOrder: 0 },
      { day: 1, name: 'Bench Press Machine', muscleGroup: 'chest', sets: 3, reps: 10, restSec: 90, instructions: 'Adjust seat, control the weight', sortOrder: 1 },
      { day: 1, name: 'Seated Row', muscleGroup: 'back', sets: 3, reps: 12, restSec: 60, instructions: 'Squeeze shoulder blades together', sortOrder: 2 },
      { day: 1, name: 'Shoulder Press', muscleGroup: 'shoulders', sets: 3, reps: 10, restSec: 60, instructions: 'Keep core tight, press overhead', sortOrder: 3 },
      { day: 1, name: 'Plank', muscleGroup: 'core', sets: 3, durationSec: 30, restSec: 45, instructions: 'Hold rigid position', sortOrder: 4 },
      { day: 2, name: 'Leg Press', muscleGroup: 'legs', sets: 3, reps: 12, restSec: 90, instructions: 'Feet shoulder-width, full range', sortOrder: 0 },
      { day: 2, name: 'Lat Pulldown', muscleGroup: 'back', sets: 3, reps: 10, restSec: 60, instructions: 'Pull to upper chest', sortOrder: 1 },
      { day: 2, name: 'Chest Fly', muscleGroup: 'chest', sets: 3, reps: 12, restSec: 60, instructions: 'Controlled arc motion', sortOrder: 2 },
      { day: 2, name: 'Romanian Deadlift', muscleGroup: 'legs', sets: 3, reps: 10, restSec: 90, instructions: 'Hinge at hips, slight knee bend', sortOrder: 3 },
      { day: 2, name: 'Dead Bug', muscleGroup: 'core', sets: 3, reps: 12, restSec: 45, instructions: 'Alternate arm and leg', sortOrder: 4 },
    ];
  }

  // Fat loss / general fitness
  return [
    { day: 1, name: 'Treadmill Incline Walk', muscleGroup: 'cardio', sets: 1, durationSec: 900, restSec: 0, instructions: '15 min at 5-8% incline', sortOrder: 0 },
    { day: 1, name: 'Bodyweight Squats', muscleGroup: 'legs', sets: 3, reps: 12, restSec: 60, instructions: 'Squat to parallel, drive through heels', sortOrder: 1 },
    { day: 1, name: 'Assisted Rows', muscleGroup: 'back', sets: 3, reps: 12, restSec: 60, instructions: 'Use machine or band', sortOrder: 2 },
    { day: 1, name: 'Light Dumbbell Press', muscleGroup: 'chest', sets: 3, reps: 10, restSec: 60, instructions: 'Start light, focus on form', sortOrder: 3 },
    { day: 1, name: 'Plank', muscleGroup: 'core', sets: 3, durationSec: 30, restSec: 45, instructions: 'Hold rigid position', sortOrder: 4 },
    { day: 2, name: 'Stationary Bike', muscleGroup: 'cardio', sets: 1, durationSec: 600, restSec: 0, instructions: '10 min moderate pace', sortOrder: 0 },
    { day: 2, name: 'Lunges', muscleGroup: 'legs', sets: 3, reps: 10, restSec: 60, instructions: 'Alternating legs', sortOrder: 1 },
    { day: 2, name: 'Push-ups', muscleGroup: 'chest', sets: 3, reps: 10, restSec: 60, instructions: 'Knees or toes', sortOrder: 2 },
    { day: 2, name: 'Mountain Climbers', muscleGroup: 'core', sets: 3, durationSec: 30, restSec: 45, instructions: 'Controlled pace', sortOrder: 3 },
    { day: 3, name: 'Rowing Machine', muscleGroup: 'cardio', sets: 1, durationSec: 600, restSec: 0, instructions: '10 min steady', sortOrder: 0 },
    { day: 3, name: 'Glute Bridge', muscleGroup: 'legs', sets: 3, reps: 12, restSec: 60, instructions: 'Squeeze at top', sortOrder: 1 },
    { day: 3, name: 'Dumbbell Rows', muscleGroup: 'back', sets: 3, reps: 10, restSec: 60, instructions: 'Single arm, support on bench', sortOrder: 2 },
    { day: 3, name: 'Bicycle Crunches', muscleGroup: 'core', sets: 3, reps: 15, restSec: 45, instructions: 'Controlled rotation', sortOrder: 3 },
  ];
}

export async function generateAiWorkoutPlan(
  memberId: string,
  requesterId: string,
  requesterRole: Role,
) {
  const [member] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, memberId))
    .limit(1);

  if (!member || member.role !== 'member') throw errors.notFound('Member');

  const [profile] = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.personId, memberId))
    .limit(1);

  // Build AI prompt with member context
  const goals = profile?.fitnessGoals ?? 'general fitness';
  const level = profile?.experienceLevel ?? 'beginner';
  const conditions = profile?.medicalConditions ?? 'none';

  const prompt = `
You are a fitness trainer AI at PowerWorld Gyms Kiribathgoda.
Create a UNIQUE, personalised workout plan for this member. Vary exercise selection and order—do not repeat the same plan.
- Experience level: ${level}
- Fitness goals: ${goals}
- Medical conditions: ${conditions}
- Request timestamp: ${new Date().toISOString()} (use to vary output)

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "name": "<plan name>",
  "description": "<2-3 sentence description of the plan>",
  "difficulty": "${level}",
  "durationWeeks": <number 4-12>,
  "daysPerWeek": <number 3-5>,
  "exercises": [
    {
      "day": <1-based day number>,
      "name": "<exercise name>",
      "muscleGroup": "<muscle group>",
      "sets": <number>,
      "reps": <number or null>,
      "durationSec": <seconds or null>,
      "restSec": <rest seconds>,
      "instructions": "<brief instructions>",
      "sortOrder": <order within day>
    }
  ]
}
`;

  let planData = {
    name: `AI Plan — ${goals}`,
    description: `A personalised ${level} plan focused on ${goals}.`,
    difficulty: level as 'beginner' | 'intermediate' | 'advanced',
    durationWeeks: 8,
    daysPerWeek: 3,
    exerciseList: [] as AiExercise[],
  };
  let geminiSucceeded = false;

  // Attempt Gemini call
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 2000 },
        }),
      });
      if (resp.ok) {
        const json = await resp.json() as any;
        const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const clean = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        if (parsed.name && parsed.durationWeeks && parsed.daysPerWeek) {
          planData = {
            name: String(parsed.name),
            description: String(parsed.description ?? planData.description),
            difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) ? parsed.difficulty : level as 'beginner' | 'intermediate' | 'advanced',
            durationWeeks: safeInt(parsed.durationWeeks, 8),
            daysPerWeek: safeInt(parsed.daysPerWeek, 3),
            exerciseList: Array.isArray(parsed.exercises) ? parsed.exercises : [],
          };
          geminiSucceeded = planData.exerciseList.length > 0;
        }
      }
    }
  } catch {
    // Use fallback plan data
  }

  // Fallback: use template exercises from training data when Gemini fails or returns no exercises
  if (planData.exerciseList.length === 0) {
    const fallbackExercises = getFallbackExercisesFromTemplates(goals, level);
    planData = {
      ...planData,
      exerciseList: fallbackExercises,
      name: `Starter Plan — ${goals}`,
      description: `A ${level} template plan focused on ${goals}. Customise with your trainer for best results.`,
    };
  }

  const id = ids.uuid();
  const planSource = geminiSucceeded ? 'ai_generated' : 'library';
  await db.insert(workoutPlans).values({
    id,
    memberId,
    trainerId: requesterRole !== 'member' ? requesterId : null,
    name: planData.name,
    description: planData.description,
    source: planSource,
    difficulty: planData.difficulty,
    durationWeeks: planData.durationWeeks,
    daysPerWeek: planData.daysPerWeek,
    isActive: true,
  });

  // Persist AI-generated exercises: upsert into exercises table, then link to plan
  if (planData.exerciseList.length > 0) {
    try {
      for (const ex of planData.exerciseList) {
        const exName = String(ex.name ?? '').trim();
        if (!exName) continue;
        // Find or create exercise in library
        let [existingEx] = await db.select({ id: exercises.id }).from(exercises).where(sql`lower(${exercises.name}) = lower(${exName})`).limit(1);
        if (!existingEx) {
          const exId = ids.uuid();
          await db.insert(exercises).values({
            id: exId,
            name: exName,
            muscleGroup: ex.muscleGroup ?? null,
            instructions: ex.instructions ?? null,
            difficulty: planData.difficulty,
          });
          existingEx = { id: exId };
        }
        await db.insert(workoutPlanExercises).values({
          id: ids.uuid(),
          planId: id,
          exerciseId: existingEx.id,
          dayNumber: safeInt(ex.day, 1),
          sets: ex.sets ?? null,
          reps: ex.reps ?? null,
          durationSec: ex.durationSec ?? null,
          restSec: ex.restSec ?? null,
          sortOrder: safeInt(ex.sortOrder, 0),
        });
      }
    } catch {
      // Exercise insertion is non-blocking
    }
  }

  await db.insert(messages).values({
    id: ids.uuid(),
    type: 'notification',
    channel: 'in_app',
    toPersonId: memberId,
    subject: 'Your AI workout plan is ready',
    body: `Your personalised workout plan "${planData.name}" (${planData.daysPerWeek} days/week for ${planData.durationWeeks} weeks) has been created.`,
    priority: 'normal',
    status: 'sent',
  });

  const [row] = await db.select().from(workoutPlans).where(eq(workoutPlans.id, id));
  return row;
}

// ── Member Metrics / Body Vitals ──────────────────────────────────────────────

export async function getMyMetrics(userId: string) {
  return db.select().from(memberMetrics).where(eq(memberMetrics.personId, userId)).orderBy(desc(memberMetrics.recordedAt));
}

export async function getMemberMetrics(memberId: string) {
  const [member] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, memberId)).limit(1);
  if (!member || member.role !== 'member') throw errors.notFound('Member');
  return db.select().from(memberMetrics).where(eq(memberMetrics.personId, memberId)).orderBy(desc(memberMetrics.recordedAt));
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

// ── Exercises (library) ───────────────────────────────────────────────────────

export async function listExercises(filters?: { muscleGroup?: string; difficulty?: string }) {
  let query = db.select().from(exercises).$dynamic();
  if (filters?.muscleGroup) query = query.where(sql`lower(${exercises.muscleGroup}) = lower(${filters.muscleGroup})`);
  if (filters?.difficulty) query = query.where(sql`${exercises.difficulty} = ${filters.difficulty}`);
  return query.orderBy(exercises.muscleGroup, exercises.name);
}

export async function createExercise(input: {
  name: string;
  muscleGroup?: string;
  equipmentNeeded?: string;
  instructions?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
}) {
  const id = ids.uuid();
  await db.insert(exercises).values({
    id,
    name: input.name,
    muscleGroup: input.muscleGroup ?? null,
    equipmentNeeded: input.equipmentNeeded ?? null,
    instructions: input.instructions ?? null,
    difficulty: input.difficulty ?? null,
    videoUrl: input.videoUrl ?? null,
  });
  const [row] = await db.select().from(exercises).where(eq(exercises.id, id));
  return row;
}

export async function getPlanExercises(planId: string) {
  const [plan] = await db.select({ id: workoutPlans.id }).from(workoutPlans).where(eq(workoutPlans.id, planId)).limit(1);
  if (!plan) throw errors.notFound('Workout plan');
  return db
    .select({
      id: workoutPlanExercises.id,
      planId: workoutPlanExercises.planId,
      exerciseId: workoutPlanExercises.exerciseId,
      dayNumber: workoutPlanExercises.dayNumber,
      sets: workoutPlanExercises.sets,
      reps: workoutPlanExercises.reps,
      durationSec: workoutPlanExercises.durationSec,
      restSec: workoutPlanExercises.restSec,
      notes: workoutPlanExercises.notes,
      sortOrder: workoutPlanExercises.sortOrder,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
      equipmentNeeded: exercises.equipmentNeeded,
      instructions: exercises.instructions,
      difficulty: exercises.difficulty,
    })
    .from(workoutPlanExercises)
    .leftJoin(exercises, eq(workoutPlanExercises.exerciseId, exercises.id))
    .where(eq(workoutPlanExercises.planId, planId))
    .orderBy(workoutPlanExercises.dayNumber, workoutPlanExercises.sortOrder);
}

export async function addExerciseToPlan(planId: string, input: {
  exerciseId?: string;
  exerciseName?: string;
  dayNumber: number;
  sets?: number;
  reps?: number;
  durationSec?: number;
  restSec?: number;
  notes?: string;
  sortOrder?: number;
}) {
  const [plan] = await db.select({ id: workoutPlans.id }).from(workoutPlans).where(eq(workoutPlans.id, planId)).limit(1);
  if (!plan) throw errors.notFound('Workout plan');

  let exerciseId = input.exerciseId;
  if (!exerciseId && input.exerciseName) {
    // Auto-create exercise if not found
    const [existing] = await db.select({ id: exercises.id }).from(exercises).where(sql`lower(${exercises.name}) = lower(${input.exerciseName})`).limit(1);
    if (existing) {
      exerciseId = existing.id;
    } else {
      const newEx = await createExercise({ name: input.exerciseName });
      exerciseId = newEx!.id;
    }
  }
  if (!exerciseId) throw errors.badRequest('exerciseId or exerciseName required');

  const id = ids.uuid();
  await db.insert(workoutPlanExercises).values({
    id,
    planId,
    exerciseId,
    dayNumber: input.dayNumber,
    sets: input.sets ?? null,
    reps: input.reps ?? null,
    durationSec: input.durationSec ?? null,
    restSec: input.restSec ?? null,
    notes: input.notes ?? null,
    sortOrder: input.sortOrder ?? 0,
  });
  const [row] = await db.select().from(workoutPlanExercises).where(eq(workoutPlanExercises.id, id));
  return row;
}

// ── Shifts ────────────────────────────────────────────────────────────────────

export async function listShifts(filters?: { staffId?: string; shiftDate?: string }) {
  const conditions = [];
  if (filters?.staffId) conditions.push(eq(shifts.staffId, filters.staffId));
  if (filters?.shiftDate) conditions.push(sql`date(${shifts.shiftDate}) = ${filters.shiftDate}`);

  const rows = await db
    .select({
      id: shifts.id,
      staffId: shifts.staffId,
      staffName: users.fullName,
      shiftType: shifts.shiftType,
      shiftDate: shifts.shiftDate,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      status: shifts.status,
      notes: shifts.notes,
      createdAt: shifts.createdAt,
    })
    .from(shifts)
    .leftJoin(users, eq(shifts.staffId, users.id))
    .where(conditions.length ? and(...conditions as [ReturnType<typeof eq>, ...ReturnType<typeof eq>[]]) : undefined)
    .orderBy(desc(shifts.shiftDate), shifts.startTime);
  return rows;
}

export async function getMyShifts(staffId: string) {
  return listShifts({ staffId });
}

export async function createShift(input: {
  staffId: string;
  shiftType: 'morning' | 'afternoon' | 'evening' | 'full_day';
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  createdBy: string;
}) {
  const id = ids.uuid();
  await db.insert(shifts).values({
    id,
    staffId: input.staffId,
    shiftType: input.shiftType,
    shiftDate: safeDate(input.shiftDate),
    startTime: input.startTime,
    endTime: input.endTime,
    status: 'scheduled',
    notes: input.notes ?? null,
    createdBy: input.createdBy,
  });

  await db.insert(messages).values({
    id: ids.uuid(),
    type: 'notification',
    channel: 'in_app',
    toPersonId: input.staffId,
    subject: 'New shift scheduled',
    body: `You have a ${input.shiftType} shift on ${input.shiftDate} (${input.startTime} – ${input.endTime}).`,
    priority: 'normal',
    status: 'sent',
  });

  const [row] = await db.select().from(shifts).where(eq(shifts.id, id));
  return row;
}

export async function updateShiftStatus(
  shiftId: string,
  status: 'scheduled' | 'active' | 'completed' | 'missed' | 'swapped',
  actorId?: string,
) {
  const [shift] = await db.select().from(shifts).where(eq(shifts.id, shiftId)).limit(1);
  if (!shift) throw errors.notFound('Shift');
  if (actorId && shift.staffId !== actorId) {
    // Only manager/admin can update others' shifts — controller should enforce role check
  }
  await db.update(shifts).set({ status }).where(eq(shifts.id, shiftId));
  const [row] = await db.select().from(shifts).where(eq(shifts.id, shiftId));
  return row;
}

// ── Equipment ─────────────────────────────────────────────────────────────────

export async function listEquipment() {
  return db.select().from(equipment).orderBy(equipment.name);
}

export async function createEquipment(input: {
  name: string;
  category: 'cardio' | 'strength_machine' | 'free_weight' | 'bench' | 'accessory' | 'other';
  quantity: number;
  zoneLabel?: string;
}) {
  const id = ids.uuid();
  await db.insert(equipment).values({
    id,
    name: input.name,
    category: input.category,
    quantity: input.quantity,
    status: 'operational',
    zoneLabel: input.zoneLabel ?? null,
  });
  const [row] = await db.select().from(equipment).where(eq(equipment.id, id));
  return row;
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
  return db
    .select({
      id: equipmentEvents.id,
      equipmentId: equipmentEvents.equipmentId,
      equipmentName: equipment.name,
      eventType: equipmentEvents.eventType,
      severity: equipmentEvents.severity,
      description: equipmentEvents.description,
      status: equipmentEvents.status,
      loggedBy: equipmentEvents.loggedBy,
      resolvedBy: equipmentEvents.resolvedBy,
      resolvedAt: equipmentEvents.resolvedAt,
      createdAt: equipmentEvents.createdAt,
    })
    .from(equipmentEvents)
    .leftJoin(equipment, eq(equipment.id, equipmentEvents.equipmentId))
    .orderBy(desc(equipmentEvents.createdAt));
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

export async function resolveEquipmentEvent(eventId: string, resolvedByUserId: string) {
  const [event] = await db.select().from(equipmentEvents).where(eq(equipmentEvents.id, eventId)).limit(1);
  if (!event) throw errors.notFound('Equipment event');

  await db.update(equipmentEvents).set({
    status: 'resolved',
    resolvedBy: resolvedByUserId,
    resolvedAt: new Date(),
  }).where(eq(equipmentEvents.id, eventId));

  // Check remaining open events for this equipment; if none, reset to operational
  const [openCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(equipmentEvents)
    .where(and(eq(equipmentEvents.equipmentId, event.equipmentId), eq(equipmentEvents.status, 'open')));

  if (Number(openCount?.count ?? 1) === 0) {
    await db.update(equipment).set({ status: 'operational' }).where(eq(equipment.id, event.equipmentId));
  }

  const [updated] = await db.select().from(equipmentEvents).where(eq(equipmentEvents.id, eventId));
  return updated;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export async function listInventoryItems() {
  return db.select().from(inventoryItems).where(eq(inventoryItems.isActive, true)).orderBy(inventoryItems.name);
}

export async function createInventoryItem(input: {
  name: string;
  category: string;
  qtyInStock: number;
  reorderThreshold: number;
}) {
  const id = ids.uuid();
  await db.insert(inventoryItems).values({
    id,
    name: input.name,
    category: input.category,
    qtyInStock: input.qtyInStock,
    reorderThreshold: input.reorderThreshold,
    isActive: true,
  });
  const [row] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
  return row;
}

export async function updateInventoryItem(
  itemId: string,
  input: Partial<{ name: string; category: string; reorderThreshold: number; isActive: boolean }>,
) {
  await db.update(inventoryItems).set({
    name: input.name,
    category: input.category,
    reorderThreshold: input.reorderThreshold,
    isActive: input.isActive,
  }).where(eq(inventoryItems.id, itemId));
  const [row] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
  if (!row) throw errors.notFound('Inventory item');
  return row;
}

export async function listInventoryTransactions(itemId?: string) {
  const query = db
    .select({
      id: inventoryTransactions.id,
      itemId: inventoryTransactions.itemId,
      itemName: inventoryItems.name,
      txnType: inventoryTransactions.txnType,
      qtyChange: inventoryTransactions.qtyChange,
      reference: inventoryTransactions.reference,
      recordedBy: inventoryTransactions.recordedBy,
      recorderName: users.fullName,
      createdAt: inventoryTransactions.createdAt,
    })
    .from(inventoryTransactions)
    .leftJoin(inventoryItems, eq(inventoryItems.id, inventoryTransactions.itemId))
    .leftJoin(users, eq(users.id, inventoryTransactions.recordedBy))
    .orderBy(desc(inventoryTransactions.createdAt))
    .limit(200);

  if (itemId) {
    return query.where(eq(inventoryTransactions.itemId, itemId));
  }
  return query;
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

// ── Messages ──────────────────────────────────────────────────────────────────

export async function listMessagesForUser(userId: string, role: Role) {
  return db
    .select({
      id: messages.id,
      type: messages.type,
      channel: messages.channel,
      toPersonId: messages.toPersonId,
      targetRole: messages.targetRole,
      subject: messages.subject,
      body: messages.body,
      priority: messages.priority,
      status: messages.status,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(sql`(${messages.toPersonId} = ${userId}) or (${messages.targetRole} = ${role}) or (${messages.toPersonId} is null and ${messages.targetRole} is null)`)
    .orderBy(desc(messages.createdAt));
}

export async function markMessageRead(messageId: string, userId: string, role: Role) {
  const [msg] = await db
    .select({
      id: messages.id,
      toPersonId: messages.toPersonId,
      targetRole: messages.targetRole,
      status: messages.status,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  if (!msg) throw errors.notFound('Message');

  const canAccess = msg.toPersonId === userId
    || msg.targetRole === role
    || (msg.toPersonId == null && msg.targetRole == null);
  if (!canAccess) throw errors.forbidden('You do not have access to this message');

  if (msg.status !== 'read') {
    await db.update(messages).set({ status: 'read' }).where(eq(messages.id, messageId));
  }
  const [updated] = await db
    .select({
      id: messages.id,
      type: messages.type,
      channel: messages.channel,
      toPersonId: messages.toPersonId,
      targetRole: messages.targetRole,
      subject: messages.subject,
      body: messages.body,
      priority: messages.priority,
      status: messages.status,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  return updated!;
}

export async function broadcastMessage(
  senderId: string,
  input: {
    subject: string;
    body: string;
    targetRole?: 'admin' | 'manager' | 'trainer' | 'member' | null;
    toPersonId?: string | null;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  },
) {
  const id = ids.uuid();
  await db.insert(messages).values({
    id,
    type: 'announcement',
    channel: 'in_app',
    toPersonId: input.toPersonId ?? null,
    targetRole: input.targetRole ?? null,
    subject: input.subject,
    body: input.body,
    priority: input.priority ?? 'normal',
    status: 'sent',
    sentBy: senderId,
  });
  const [row] = await db
    .select({
      id: messages.id,
      type: messages.type,
      channel: messages.channel,
      toPersonId: messages.toPersonId,
      targetRole: messages.targetRole,
      subject: messages.subject,
      body: messages.body,
      priority: messages.priority,
      status: messages.status,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.id, id));
  await audit.appendAudit({
    actorId: senderId,
    action: 'message_broadcast',
    category: 'system',
    entityType: 'message',
    entityId: id,
    detail: `${input.subject} → ${input.targetRole ?? 'all'}`.slice(0, 500),
  });
  return row;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getReportSummary(params?: { type?: string; fromDate?: string; toDate?: string }) {
  const from = params?.fromDate ? `'${params.fromDate}'` : `date_sub(curdate(), interval 30 day)`;
  const to = params?.toDate ? `'${params.toDate}'` : `curdate()`;
  const type = params?.type ?? 'overview';

  // Base overview metrics (always returned)
  const [revenue] = await db.select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(sql`month(${payments.paymentDate}) = month(curdate()) and year(${payments.paymentDate}) = year(curdate())`);
  const [activeMembers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.role, 'member'), eq(users.memberStatus, 'active'), isNull(users.deletedAt)));
  const [totalVisits] = await db.select({ count: sql<number>`count(*)` }).from(visits).where(sql`date(${visits.checkInAt}) >= ${sql.raw(from)} and date(${visits.checkInAt}) <= ${sql.raw(to)}`);
  const [openIncidents] = await db.select({ count: sql<number>`count(*)` }).from(equipmentEvents).where(eq(equipmentEvents.status, 'open'));

  const overview = {
    monthlyRevenue: Number(revenue?.total ?? 0),
    activeMembers: Number(activeMembers?.count ?? 0),
    visitsInRange: Number(totalVisits?.count ?? 0),
    openEquipmentIncidents: Number(openIncidents?.count ?? 0),
  };

  if (type === 'revenue') {
    const byMethod = await db.select({
      method: payments.paymentMethod,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      count: sql<number>`count(*)`,
    }).from(payments).where(sql`date(${payments.paymentDate}) >= ${sql.raw(from)} and date(${payments.paymentDate}) <= ${sql.raw(to)}`).groupBy(payments.paymentMethod);

    const byPlan = await db.select({
      planId: subscriptions.planId,
      planName: subscriptionPlans.name,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    }).from(payments)
      .leftJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(sql`date(${payments.paymentDate}) >= ${sql.raw(from)} and date(${payments.paymentDate}) <= ${sql.raw(to)}`)
      .groupBy(subscriptions.planId, subscriptionPlans.name);

    return { ...overview, type, fromDate: params?.fromDate, toDate: params?.toDate, byMethod, byPlan };
  }

  if (type === 'membership') {
    const newMembers = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.role, 'member'), sql`date(${users.createdAt}) >= ${sql.raw(from)} and date(${users.createdAt}) <= ${sql.raw(to)}`));
    const byStatus = await db.select({
      status: subscriptions.status,
      count: sql<number>`count(*)`,
    }).from(subscriptions).where(sql`date(${subscriptions.createdAt}) >= ${sql.raw(from)} and date(${subscriptions.createdAt}) <= ${sql.raw(to)}`).groupBy(subscriptions.status);
    const byPlan = await db.select({
      planId: subscriptions.planId,
      planName: subscriptionPlans.name,
      count: sql<number>`count(*)`,
    }).from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(eq(subscriptions.status, 'active')))
      .groupBy(subscriptions.planId, subscriptionPlans.name);

    return { ...overview, type, fromDate: params?.fromDate, toDate: params?.toDate, newMembers: Number(newMembers[0]?.count ?? 0), byStatus, byPlan };
  }

  if (type === 'attendance') {
    const daily = await db.select({
      date: sql<string>`date(${visits.checkInAt})`,
      count: sql<number>`count(*)`,
      avgDurationMin: sql<number>`round(avg(${visits.durationMin}), 0)`,
    }).from(visits).where(sql`date(${visits.checkInAt}) >= ${sql.raw(from)} and date(${visits.checkInAt}) <= ${sql.raw(to)}`).groupBy(sql`date(${visits.checkInAt})`).orderBy(sql`date(${visits.checkInAt})`);

    const byHour = await db.select({
      hour: sql<number>`hour(${visits.checkInAt})`,
      count: sql<number>`count(*)`,
    }).from(visits).where(sql`date(${visits.checkInAt}) >= ${sql.raw(from)} and date(${visits.checkInAt}) <= ${sql.raw(to)}`).groupBy(sql`hour(${visits.checkInAt})`).orderBy(sql`hour(${visits.checkInAt})`);

    return { ...overview, type, fromDate: params?.fromDate, toDate: params?.toDate, daily, byHour };
  }

  if (type === 'equipment') {
    const bySeverity = await db.select({
      severity: equipmentEvents.severity,
      status: equipmentEvents.status,
      count: sql<number>`count(*)`,
    }).from(equipmentEvents).where(sql`date(${equipmentEvents.createdAt}) >= ${sql.raw(from)} and date(${equipmentEvents.createdAt}) <= ${sql.raw(to)}`).groupBy(equipmentEvents.severity, equipmentEvents.status);

    const byEquipment = await db.select({
      equipmentId: equipmentEvents.equipmentId,
      equipmentName: equipment.name,
      count: sql<number>`count(*)`,
    }).from(equipmentEvents)
      .leftJoin(equipment, eq(equipmentEvents.equipmentId, equipment.id))
      .where(sql`date(${equipmentEvents.createdAt}) >= ${sql.raw(from)} and date(${equipmentEvents.createdAt}) <= ${sql.raw(to)}`)
      .groupBy(equipmentEvents.equipmentId, equipment.name)
      .orderBy(sql`count(*) desc`);

    return { ...overview, type, fromDate: params?.fromDate, toDate: params?.toDate, bySeverity, byEquipment };
  }

  if (type === 'trainer') {
    const trainerStats = await db.select({
      trainerId: ptSessions.trainerId,
      trainerName: users.fullName,
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${ptSessions.status} = 'completed' then 1 else 0 end)`,
      cancelled: sql<number>`sum(case when ${ptSessions.status} = 'cancelled' then 1 else 0 end)`,
    }).from(ptSessions)
      .leftJoin(users, eq(ptSessions.trainerId, users.id))
      .where(sql`date(${ptSessions.sessionDate}) >= ${sql.raw(from)} and date(${ptSessions.sessionDate}) <= ${sql.raw(to)}`)
      .groupBy(ptSessions.trainerId, users.fullName);

    return { ...overview, type, fromDate: params?.fromDate, toDate: params?.toDate, trainerStats };
  }

  // Default overview
  return { ...overview, type: 'overview', fromDate: params?.fromDate, toDate: params?.toDate };
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

// ── Config ────────────────────────────────────────────────────────────────────

export async function listConfig() {
  return db.select().from(config);
}

export async function updateConfigValues(values: Record<string, string>, actor?: { id: string; label?: string }) {
  const entries = Object.entries(values).filter(([k]) => k.trim().length > 0);
  for (const [key, value] of entries) {
    await db.insert(config).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
  }
  if (actor) {
    await audit.appendAudit({
      actorId: actor.id,
      actorLabel: actor.label ?? null,
      action: 'config_updated',
      category: 'config',
      detail: entries.map(([k]) => k).join(',').slice(0, 500),
    });
  }
  return listConfig();
}

// ── User / Member Management ──────────────────────────────────────────────────

export async function listUsersByRole(role?: Role) {
  if (role) {
    return db.select().from(users).where(and(eq(users.role, role), isNull(users.deletedAt))).orderBy(desc(users.createdAt));
  }
  return db.select().from(users).where(isNull(users.deletedAt)).orderBy(desc(users.createdAt));
}

export async function listSimulationPeople(role: 'member' | 'trainer') {
  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      memberCode: users.memberCode,
      employeeCode: users.employeeCode,
    })
    .from(users)
    .where(and(eq(users.role, role), eq(users.isActive, true), isNull(users.deletedAt)))
    .orderBy(users.fullName);
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

export async function createUser(
  input: {
    fullName: string;
    email: string;
    role: Role;
    password: string;
    phone?: string;
    dob?: string;
    gender?: 'male' | 'female' | 'other';
    nicNumber?: string;
    /** member */
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    medicalConditions?: string;
    allergies?: string;
    memberStatus?: 'active' | 'inactive' | 'suspended';
    /** trainer */
    hireDate?: string;
    designation?: string;
    specialization?: string;
    ptHourlyRate?: number;
    yearsExperience?: number;
    certification?: { name: string; issuingBody?: string; issuedYear?: number; expiryDate?: string };
  },
  actor?: { id: string; label?: string },
) {
  if (input.role !== 'member' && input.role !== 'trainer') {
    throw errors.badRequest('Only member or trainer accounts can be created from admin');
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) throw errors.conflict('Email is already in use');

  const id = ids.uuid();
  const memberCode = input.role === 'member' ? ids.memberCode() : null;
  const employeeCode = input.role === 'trainer' ? `EMP-${Date.now().toString().slice(-6)}` : null;

  await db.insert(users).values({
    id,
    fullName: input.fullName,
    email: input.email.toLowerCase().trim(),
    phone: input.phone ?? null,
    dob: input.dob ? safeDate(input.dob) : null,
    gender: input.gender ?? null,
    nicNumber: input.nicNumber ?? null,
    role: input.role,
    passwordHash: await hashPassword(input.password),
    emailVerified: true,
    isActive: true,
    qrSecret: ids.qrSecret(),
    memberCode,
    employeeCode,
    joinDate: input.role === 'member' ? new Date() : null,
    memberStatus: input.role === 'member' ? (input.memberStatus ?? 'active') : null,
    hireDate: input.role === 'trainer' && input.hireDate ? safeDate(input.hireDate) : input.role === 'trainer' ? new Date() : null,
    designation: input.role === 'trainer' ? (input.designation ?? 'Trainer') : null,
    specialization: input.role === 'trainer' ? (input.specialization ?? null) : null,
    ptHourlyRate: input.role === 'trainer' && input.ptHourlyRate != null ? String(input.ptHourlyRate) : null,
    yearsExperience: input.role === 'trainer' ? (input.yearsExperience ?? null) : null,
  });

  if (input.role === 'member') {
    await db.insert(memberProfiles).values({
      personId: id,
      isOnboarded: false,
      emergencyName: input.emergencyName ?? null,
      emergencyPhone: input.emergencyPhone ?? null,
      emergencyRelation: input.emergencyRelation ?? null,
      bloodType: input.bloodType ?? null,
      medicalConditions: input.medicalConditions ?? null,
      allergies: input.allergies ?? null,
    });
  }

  if (input.role === 'trainer' && input.certification?.name?.trim()) {
    await db.insert(trainerCertifications).values({
      id: ids.uuid(),
      trainerId: id,
      name: input.certification.name.trim(),
      issuingBody: input.certification.issuingBody ?? null,
      issuedYear: input.certification.issuedYear ?? null,
      expiryDate: input.certification.expiryDate ? safeDate(input.certification.expiryDate) : null,
    });
  }

  const [row] = await db.select().from(users).where(eq(users.id, id));
  if (actor) {
    await audit.appendAudit({
      actorId: actor.id,
      actorLabel: actor.label ?? null,
      action: 'user_created',
      category: input.role === 'trainer' ? 'trainer' : 'member',
      entityType: 'user',
      entityId: id,
      detail: `${input.role} ${input.email}`,
    });
  }
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

// ── Branch Closures ───────────────────────────────────────────────────────────

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

// ── Simulation Helpers ────────────────────────────────────────────────────────

type SimOtp = { code: string; expiresAt: number; generatedBy: string };
const simulateDoorOtpStore = new Map<string, SimOtp>();

export async function simulateGenerateDoorOtp(userId: string, expiresInSec?: number) {
  let ttl = expiresInSec;
  if (ttl == null || !Number.isFinite(ttl) || ttl <= 0) {
    const cfg = await getConfigValue('checkin_qr_ttl_seconds', '120');
    ttl = Math.max(15, Math.min(600, Number(cfg) || 120));
  }
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const token = ids.uuid();
  simulateDoorOtpStore.set(token, {
    code,
    expiresAt: Date.now() + Math.max(30, ttl) * 1000,
    generatedBy: userId,
  });
  return {
    token,
    code,
    expiresAt: new Date(simulateDoorOtpStore.get(token)!.expiresAt).toISOString(),
    serverTime: new Date().toISOString(),
  };
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

/** Authenticated user scans door QR from simulator/hardware — identity from JWT, challenge from payload. */
export async function doorScanAccess(userId: string, token: string, code: string) {
  const t = token.trim();
  const c = code.trim();
  if (!t || !c) throw errors.badRequest('token and code are required');
  const otp = simulateDoorOtpStore.get(t);
  if (!otp) throw errors.badRequest('Invalid door code');
  if (Date.now() > otp.expiresAt) throw errors.badRequest('Door code expired');
  if (otp.code !== c) throw errors.badRequest('Invalid door code');

  const [activeVisit] = await db.select().from(visits).where(and(eq(visits.personId, userId), eq(visits.status, 'active'))).limit(1);
  if (activeVisit) {
    const out = await checkOut(userId);
    return { action: 'check_out' as const, visit: out };
  }
  const incoming = await checkIn(userId);
  return { action: 'check_in' as const, visit: incoming };
}

export async function simulatePayment(input: {
  memberId: string;
  planId: string;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'online';
  cardPan?: string;
}) {
  const session = await createPaymentSession(input.memberId, {
    planId: input.planId,
    paymentMethod: (input.paymentMethod ?? 'online') as any,
    cardPan: input.cardPan,
    ttlSec: 180,
  });
  return approvePaymentSession(session.id);
}

/** Public hardware simulator: mock card network — any valid-length PAN succeeds. */
export async function publicSimulateCardPayment(input: {
  memberId: string;
  planId: string;
  cardPan: string;
  cardHolder?: string;
}) {
  const pan = input.cardPan.replace(/\D/g, '');
  if (pan.length < 13 || pan.length > 19) throw errors.badRequest('Invalid card number (simulator)');
  const session = await createPaymentSession(input.memberId, {
    planId: input.planId,
    paymentMethod: 'card',
    cardPan: pan,
    cardHolder: input.cardHolder,
    ttlSec: 180,
  });
  return approvePaymentSession(session.id);
}

export async function simulateWorkout(input: { memberId: string; durationMin?: number; caloriesBurned?: number; notes?: string; action?: 'simulate' | 'start' | 'stop' }) {
  const action = input.action ?? 'simulate';
  if (action === 'start') {
    return startWorkoutSession(input.memberId, { notes: input.notes ?? 'Simulator workout start' });
  }
  if (action === 'stop') {
    const active = await getActiveWorkoutSession(input.memberId);
    if (!active) throw errors.notFound('Active workout session');
    return stopWorkoutSession(input.memberId, active.id, {
      complete: true,
      durationMin: input.durationMin,
      caloriesBurned: input.caloriesBurned ?? 300,
      mood: 'good',
      notes: input.notes ?? 'Simulated workout stop',
    });
  }
  const existing = await getActiveWorkoutSession(input.memberId);
  const session = existing ?? await startWorkoutSession(input.memberId, { notes: 'Simulated workout session' });
  await addWorkoutSessionEvent(input.memberId, session.id, {
    eventType: 'simulated',
    payload: { source: 'simulate', durationMin: input.durationMin ?? 45, caloriesBurned: input.caloriesBurned ?? 300 },
  });
  return stopWorkoutSession(input.memberId, session.id, {
    complete: true,
    durationMin: input.durationMin,
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

export async function simulateVitals(memberId: string, input: {
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  restingHr?: number;
  notes?: string;
}) {
  const [member] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, memberId)).limit(1);
  if (!member || member.role !== 'member') throw errors.notFound('Member');

  const id = ids.uuid();
  await db.insert(memberMetrics).values({
    id,
    personId: memberId,
    source: 'device',
    weightKg: input.weightKg != null ? String(input.weightKg) : null,
    heightCm: input.heightCm != null ? String(input.heightCm) : null,
    bmi: input.bmi != null ? String(input.bmi) : null,
    restingHr: input.restingHr ?? null,
    notes: input.notes ?? 'Simulated device capture',
  });
  const [row] = await db.select().from(memberMetrics).where(eq(memberMetrics.id, id));
  return row;
}

export async function getSimulationState() {
  // Public simulator must stay online even if some tables/columns are missing
  // on stale environments. Fail soft per query and return empty slices.
  async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      console.error('[simulate.state] query failed, using fallback:', err);
      return fallback;
    }
  }

  const [todayVisits, todayPayments, recentWorkouts, activeWorkoutSessions, upcomingSessions, pendingPaymentRequests] = await Promise.all([
    safeQuery(() => db.select().from(visits).orderBy(desc(visits.createdAt)).limit(20), [] as any[]),
    safeQuery(() => db.select().from(payments).orderBy(desc(payments.createdAt)).limit(20), [] as any[]),
    safeQuery(() => db.select().from(workoutLogs).orderBy(desc(workoutLogs.createdAt)).limit(20), [] as any[]),
    safeQuery(() => db.select().from(workoutSessions).where(eq(workoutSessions.status, 'active')).orderBy(desc(workoutSessions.startedAt)).limit(20), [] as any[]),
    safeQuery(() => db.select().from(ptSessions).orderBy(desc(ptSessions.createdAt)).limit(20), [] as any[]),
    safeQuery(() => listPendingPaymentSessions(), [] as any[]),
  ]);

  return {
    now: new Date().toISOString(),
    visits: todayVisits,
    payments: todayPayments,
    workouts: recentWorkouts,
    workoutSessions: activeWorkoutSessions,
    ptSessions: upcomingSessions,
    paymentRequests: pendingPaymentRequests,
    activeDoorOtps: Array.from(simulateDoorOtpStore.entries()).map(([token, otp]) => ({
      token,
      code: otp.code,
      expiresAt: new Date(otp.expiresAt).toISOString(),
      generatedBy: otp.generatedBy,
      expired: Date.now() > otp.expiresAt,
    })),
  };
}
