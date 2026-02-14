// Subscription Service — Phase 1 (Drizzle ORM)
import { eq, and, isNull, gte, lte, lt, desc, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { members, subscriptions, subscriptionPlans, users } from '../db/schema';
import { NotFoundError } from '../utils/error-types';
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
}
