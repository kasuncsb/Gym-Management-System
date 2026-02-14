// Subscription Service — Phase 2 (Drizzle ORM)
import { eq, and, isNull, gte, lte, lt, desc, asc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { members, subscriptions, subscriptionPlans, subscriptionFreezes, users } from '../db/schema';
import { randomUUID } from 'crypto';
import { NotFoundError, ValidationError } from '../utils/error-types';
import { AuditService, AuditAction } from './audit.service';

export interface ValidationResult {
  valid: boolean;
  subscription?: any;
  entitlements?: { accessHours?: string; facilities?: any };
  expiryDate?: Date | string;
  reason?: string;
}

export class SubscriptionService {
  /** Validate a member's subscription (used by door-access) */
  static async validateSubscription(memberId: string): Promise<ValidationResult> {
    const [result] = await db
      .select({ member: members, user: users })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.id, memberId))
      .limit(1);

    if (!result || result.member.deletedAt) {
      return { valid: false, reason: 'Member not found' };
    }
    if (result.member.status !== 'active') {
      return { valid: false, reason: 'Member account is not active' };
    }

    const today = new Date();

    const activeSubs = await db
      .select()
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(subscriptions.memberId, memberId),
        eq(subscriptions.status, 'active'),
        isNull(subscriptions.deletedAt),
        gte(subscriptions.endDate, today),
      ))
      .orderBy(desc(subscriptions.endDate));

    if (activeSubs.length === 0) {
      // Check grace period
      const [grace] = await db
        .select()
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(subscriptions.memberId, memberId),
          eq(subscriptions.status, 'grace_period'),
          isNull(subscriptions.deletedAt),
        ))
        .limit(1);

      if (grace) {
        return {
          valid: true,
          subscription: { ...grace.subscriptions, plan: grace.subscription_plans },
          entitlements: { accessHours: '05:00-22:00', facilities: grace.subscription_plans?.features ?? {} },
          expiryDate: grace.subscriptions.endDate,
          reason: 'Subscription in grace period',
        };
      }

      return { valid: false, reason: 'No active subscription found' };
    }

    const activeSub = activeSubs[0];

    return {
      valid: true,
      subscription: { ...activeSub.subscriptions, plan: activeSub.subscription_plans },
      entitlements: {
        accessHours: '05:00-22:00',
        facilities: activeSub.subscription_plans?.features ?? {},
      },
      expiryDate: activeSub.subscriptions.endDate,
    };
  }

  /** Get all subscriptions for a member */
  static async getMemberSubscriptions(memberId: string) {
    const subs = await db
      .select()
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(eq(subscriptions.memberId, memberId), isNull(subscriptions.deletedAt)))
      .orderBy(desc(subscriptions.startDate));

    return subs.map((s) => ({ ...s.subscriptions, plan: s.subscription_plans }));
  }

  /** Get active subscription for a member */
  static async getActiveSubscription(memberId: string) {
    const today = new Date();
    const [sub] = await db
      .select()
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(subscriptions.memberId, memberId),
        eq(subscriptions.status, 'active'),
        isNull(subscriptions.deletedAt),
        gte(subscriptions.endDate, today),
      ))
      .limit(1);

    if (!sub) return null;
    return { ...sub.subscriptions, plan: sub.subscription_plans };
  }

  /** Get all active plans */
  static async getAllPlans() {
    return db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.isActive, true), isNull(subscriptionPlans.deletedAt)))
      .orderBy(asc(subscriptionPlans.sortOrder), asc(subscriptionPlans.price));
  }

  /** Get plan by ID */
  static async getPlanById(planId: string) {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
    if (!plan || plan.deletedAt) throw new NotFoundError('Subscription plan');

    const activeCount = await db
      .select({ memberId: subscriptions.memberId })
      .from(subscriptions)
      .where(and(eq(subscriptions.planId, planId), eq(subscriptions.status, 'active')));

    return { ...plan, activeSubscriptions: activeCount.length };
  }

  /** Upcoming renewals */
  static async checkUpcomingRenewals(daysBeforeExpiry = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);
    const today = new Date();

    const subs = await db
      .select({ subscription: subscriptions, member: members, user: users, plan: subscriptionPlans })
      .from(subscriptions)
      .leftJoin(members, eq(subscriptions.memberId, members.id))
      .leftJoin(users, eq(members.userId, users.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(subscriptions.status, 'active'),
        eq(subscriptions.autoRenew, true),
        lte(subscriptions.endDate, futureDate),
        gte(subscriptions.endDate, today),
      ));

    return subs.map((s) => ({
      ...s.subscription,
      member: s.member ? { memberId: s.member.id, name: s.user?.fullName, email: s.user?.email } : null,
      plan: s.plan,
    }));
  }

  /** Mark expired subscriptions (cron job) */
  static async markExpiredSubscriptions() {
    const today = new Date();
    const result = await db
      .update(subscriptions)
      .set({ status: 'expired' })
      .where(and(eq(subscriptions.status, 'active'), lt(subscriptions.endDate, today)));

    const affected = (result[0] as any).affectedRows ?? 0;
    if (affected > 0) {
      await AuditService.log(AuditAction.UPDATE, 'subscriptions', 'batch', undefined, {
        action: 'expire_subscriptions', count: affected,
      });
    }
    return affected;
  }

  // ── Phase 2: Admin Plan CRUD ──────────────────────────

  /** Create a new subscription plan (Admin) */
  static async createPlan(data: {
    name: string;
    description?: string;
    price: number;
    durationDays: number;
    features?: string[];
    includedPtSessions?: number;
    maxMembers?: number;
    requiresDocument?: string;
    sortOrder?: number;
  }) {
    const id = randomUUID();
    await db.insert(subscriptionPlans).values({
      id,
      name: data.name,
      description: data.description ?? null,
      price: data.price.toString(),
      durationDays: data.durationDays,
      features: data.features ?? null,
      includedPtSessions: data.includedPtSessions ?? 0,
      maxMembers: data.maxMembers ?? 1,
      requiresDocument: data.requiresDocument ?? null,
      isActive: true,
      sortOrder: data.sortOrder ?? 0,
    });
    return { id, ...data };
  }

  /** Update a subscription plan (Admin) */
  static async updatePlan(planId: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    durationDays: number;
    features: string[];
    includedPtSessions: number;
    maxMembers: number;
    requiresDocument: string;
    isActive: boolean;
    sortOrder: number;
  }>) {
    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.price !== undefined) updates.price = data.price.toString();
    if (data.durationDays !== undefined) updates.durationDays = data.durationDays;
    if (data.features !== undefined) updates.features = data.features;
    if (data.includedPtSessions !== undefined) updates.includedPtSessions = data.includedPtSessions;
    if (data.maxMembers !== undefined) updates.maxMembers = data.maxMembers;
    if (data.requiresDocument !== undefined) updates.requiresDocument = data.requiresDocument;
    if (data.isActive !== undefined) updates.isActive = data.isActive;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    await db.update(subscriptionPlans).set(updates).where(eq(subscriptionPlans.id, planId));
  }

  /** Soft-delete a plan */
  static async deletePlan(planId: string) {
    await db.update(subscriptionPlans).set({ deletedAt: new Date(), isActive: false }).where(eq(subscriptionPlans.id, planId));
  }

  // ── Phase 2: Purchase Flow ────────────────────────────

  /** Create a subscription for a member (purchase flow) */
  static async purchaseSubscription(data: {
    memberId: string;
    planId: string;
    startDate?: string;
    notes?: string;
  }) {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.id, data.planId), eq(subscriptionPlans.isActive, true)))
      .limit(1);
    if (!plan) throw new NotFoundError('Subscription plan');

    const start = data.startDate ? new Date(data.startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.durationDays);

    const id = randomUUID();
    await db.insert(subscriptions).values({
      id,
      memberId: data.memberId,
      planId: data.planId,
      startDate: start,
      endDate: end,
      status: 'pending_payment',
      pricePaid: plan.price,
      ptSessionsRemaining: plan.includedPtSessions,
      notes: data.notes ?? null,
    });

    return { id, startDate: start, endDate: end, price: plan.price, status: 'pending_payment' };
  }

  // ── Phase 2: Freeze / Unfreeze ────────────────────────

  /** Freeze a subscription */
  static async freezeSubscription(subscriptionId: string, data: {
    freezeStart: string;
    freezeEnd: string;
    reason?: string;
    requestedBy: string;
  }) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);
    if (!sub) throw new NotFoundError('Subscription');
    if (sub.status !== 'active') throw new ValidationError('Only active subscriptions can be frozen');

    // Calculate freeze duration and extend end date
    const fStart = new Date(data.freezeStart);
    const fEnd = new Date(data.freezeEnd);
    const freezeDays = Math.ceil((fEnd.getTime() - fStart.getTime()) / 86400000);
    if (freezeDays < 7) throw new ValidationError('Minimum freeze period is 7 days');
    if (freezeDays > 30) throw new ValidationError('Maximum freeze period is 30 days');

    const newEndDate = new Date(sub.endDate);
    newEndDate.setDate(newEndDate.getDate() + freezeDays);

    // Create freeze record
    const freezeId = randomUUID();
    await db.insert(subscriptionFreezes).values({
      id: freezeId,
      subscriptionId,
      freezeStart: fStart,
      freezeEnd: fEnd,
      reason: data.reason ?? null,
      requestedBy: data.requestedBy,
    });

    // Update subscription
    await db
      .update(subscriptions)
      .set({ status: 'frozen', endDate: newEndDate })
      .where(eq(subscriptions.id, subscriptionId));

    return { freezeId, newEndDate, freezeDays };
  }

  /** Unfreeze a subscription */
  static async unfreezeSubscription(subscriptionId: string) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);
    if (!sub) throw new NotFoundError('Subscription');
    if (sub.status !== 'frozen') throw new ValidationError('Subscription is not frozen');

    // Update freeze record with actual unfreeze date
    const freezes = await db
      .select()
      .from(subscriptionFreezes)
      .where(and(eq(subscriptionFreezes.subscriptionId, subscriptionId), isNull(subscriptionFreezes.actualUnfreezeDate)))
      .orderBy(desc(subscriptionFreezes.createdAt))
      .limit(1);

    if (freezes.length) {
      await db
        .update(subscriptionFreezes)
        .set({ actualUnfreezeDate: new Date() })
        .where(eq(subscriptionFreezes.id, freezes[0].id));
    }

    await db
      .update(subscriptions)
      .set({ status: 'active' })
      .where(eq(subscriptions.id, subscriptionId));

    return { unfrozen: true };
  }
}
