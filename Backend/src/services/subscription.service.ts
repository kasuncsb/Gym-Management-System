// Subscription Service - UC-02: Validate Subscription - Drizzle ORM
import { eq, and, isNull, gte, lte, lt, desc, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { members, subscriptions, subscriptionPlans } from '../db/schema';
import { NotFoundError, ValidationError } from '../utils/error-types';

export interface ValidationResult {
    valid: boolean;
    subscription?: any;
    entitlements?: {
        accessHours?: string;
        facilities?: any;
    };
    expiryDate?: Date;
    reason?: string;
}

export class SubscriptionService {
    // UC-02: Validate subscription for a member
    static async validateSubscription(memberId: string): Promise<ValidationResult> {
        const [member] = await db.select({
            memberId: members.memberId,
            status: members.status,
            deletedAt: members.deletedAt
        })
            .from(members)
            .where(eq(members.memberId, memberId))
            .limit(1);

        if (!member || member.deletedAt) {
            return {
                valid: false,
                reason: 'Member not found'
            };
        }

        if (member.status !== 'ACTIVE') {
            return {
                valid: false,
                reason: 'Member account is not active'
            };
        }

        // Find active subscriptions
        const activeSubscriptions = await db.select()
            .from(subscriptions)
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.planId))
            .where(and(
                eq(subscriptions.memberId, memberId),
                eq(subscriptions.status, 'ACTIVE'),
                isNull(subscriptions.deletedAt),
                gte(subscriptions.endDate, new Date())
            ))
            .orderBy(desc(subscriptions.endDate));

        if (activeSubscriptions.length === 0) {
            return {
                valid: false,
                reason: 'No active subscription found'
            };
        }

        // If multiple subscriptions, use the one with latest expiry (priority)
        const activeSubscription = activeSubscriptions[0];

        // Check payment status
        if (activeSubscription.subscriptions.paymentStatus !== 'PAID') {
            return {
                valid: false,
                reason: 'Subscription payment pending'
            };
        }

        return {
            valid: true,
            subscription: {
                ...activeSubscription.subscriptions,
                plan: activeSubscription.subscription_plans
            },
            entitlements: {
                accessHours: activeSubscription.subscription_plans?.accessHours || '05:30-22:00',
                facilities: activeSubscription.subscription_plans?.facilities || {}
            },
            expiryDate: activeSubscription.subscriptions.endDate
        };
    }

    // Get member's subscription details
    static async getMemberSubscriptions(memberId: string) {
        const subs = await db.select()
            .from(subscriptions)
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.planId))
            .where(and(
                eq(subscriptions.memberId, memberId),
                isNull(subscriptions.deletedAt)
            ))
            .orderBy(desc(subscriptions.createdAt));

        return subs.map(s => ({
            ...s.subscriptions,
            plan: s.subscription_plans
        }));
    }

    // Get active subscription
    static async getActiveSubscription(memberId: string) {
        const [subscription] = await db.select()
            .from(subscriptions)
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.planId))
            .where(and(
                eq(subscriptions.memberId, memberId),
                eq(subscriptions.status, 'ACTIVE'),
                isNull(subscriptions.deletedAt),
                gte(subscriptions.endDate, new Date())
            ))
            .limit(1);

        if (!subscription) return null;

        return {
            ...subscription.subscriptions,
            plan: subscription.subscription_plans
        };
    }

    // Get all subscription plans
    static async getAllPlans() {
        const plans = await db.select()
            .from(subscriptionPlans)
            .where(isNull(subscriptionPlans.deletedAt))
            .orderBy(asc(subscriptionPlans.price));

        return plans;
    }

    // Get plan by ID
    static async getPlanById(planId: string) {
        const [plan] = await db.select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.planId, planId))
            .limit(1);

        if (!plan || plan.deletedAt) {
            throw new NotFoundError('Subscription plan');
        }

        // Get active subscriptions for this plan
        const activeSubscriptions = await db.select({
            memberId: subscriptions.memberId
        })
            .from(subscriptions)
            .where(and(
                eq(subscriptions.planId, planId),
                eq(subscriptions.status, 'ACTIVE')
            ));

        return {
            ...plan,
            subscriptions: activeSubscriptions
        };
    }

    // Check upcoming renewals
    static async checkUpcomingRenewals(daysBeforeExpiry: number = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

        const subs = await db.select()
            .from(subscriptions)
            .leftJoin(members, eq(subscriptions.memberId, members.memberId))
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.planId))
            .where(and(
                eq(subscriptions.status, 'ACTIVE'),
                eq(subscriptions.autoRenew, true),
                lte(subscriptions.endDate, futureDate),
                gte(subscriptions.endDate, new Date())
            ));

        return subs.map(s => ({
            ...s.subscriptions,
            member: s.members ? {
                memberId: s.members.memberId,
                name: s.members.name,
                email: s.members.email
            } : null,
            plan: s.subscription_plans
        }));
    }

    // Mark expired subscriptions
    static async markExpiredSubscriptions() {
        const result = await db.update(subscriptions)
            .set({ status: 'EXPIRED' })
            .where(and(
                eq(subscriptions.status, 'ACTIVE'),
                lt(subscriptions.endDate, new Date())
            ));

        // Drizzle returns an array for batch updates
        return Array.isArray(result) ? result.length : 0;
    }
}
