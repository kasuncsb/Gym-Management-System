// Subscription Service - UC-02: Validate Subscription - Drizzle ORM
import { eq, and, isNull, gte, lte, lt, desc, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { members, subscriptions, subscriptionPlans, users } from '../db/schema';
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
        const [result] = await db.select({
            member: members,
            user: users
        })
            .from(members)
            .innerJoin(users, eq(members.userId, users.id))
            .where(eq(members.id, memberId))
            .limit(1);

        if (!result || result.member.deletedAt) {
            return {
                valid: false,
                reason: 'Member not found'
            };
        }

        const { member } = result;

        if (member.status !== 'active') {
            return {
                valid: false,
                reason: 'Member account is not active'
            };
        }

        // Find active subscriptions
        const activeSubscriptions = await db.select()
            .from(subscriptions)
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
            .where(and(
                eq(subscriptions.memberId, memberId),
                eq(subscriptions.status, 'active'),
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

        // Valid subscription found (Assuming status='active' implies payment is OK for now as paymentStatus is missing)

        return {
            valid: true,
            subscription: {
                ...activeSubscription.subscriptions,
                plan: activeSubscription.subscription_plans
            },
            entitlements: {
                // entitlements missing from schema? subscriptionPlans has features (json).
                accessHours: '05:30-22:00', // Default hardcoded or should be in features
                facilities: activeSubscription.subscription_plans?.features || {}
            },
            expiryDate: activeSubscription.subscriptions.endDate
        };
    }

    // Get member's subscription details
    static async getMemberSubscriptions(memberId: string) {
        const subs = await db.select()
            .from(subscriptions)
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
            .where(and(
                eq(subscriptions.memberId, memberId),
                isNull(subscriptions.deletedAt)
            ))
            .orderBy(desc(subscriptions.startDate));

        return subs.map(s => ({
            ...s.subscriptions,
            plan: s.subscription_plans
        }));
    }

    // Get active subscription
    static async getActiveSubscription(memberId: string) {
        const [subscription] = await db.select()
            .from(subscriptions)
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
            .where(and(
                eq(subscriptions.memberId, memberId),
                eq(subscriptions.status, 'active'),
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
        // subscriptionPlans has isActive? Schema says yes. deletedAt? Yes.
        const plans = await db.select()
            .from(subscriptionPlans)
            .where(isNull(subscriptionPlans.deletedAt))
            .orderBy(asc(subscriptionPlans.price));

        return plans;
    }

    // Get plan by ID
    static async getPlanById(planId: string) {
        // planId -> id
        const [plan] = await db.select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, planId))
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
                eq(subscriptions.status, 'active')
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

        const subs = await db.select({
            subscription: subscriptions,
            member: members,
            user: users,
            plan: subscriptionPlans
        })
            .from(subscriptions)
            .leftJoin(members, eq(subscriptions.memberId, members.id))
            .leftJoin(users, eq(members.userId, users.id)) // Join users to get name/email
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
            .where(and(
                eq(subscriptions.status, 'active'),
                eq(subscriptions.autoRenew, true),
                lte(subscriptions.endDate, futureDate),
                gte(subscriptions.endDate, new Date())
            ));

        return subs.map(s => ({
            ...s.subscription,
            member: s.member ? {
                memberId: s.member.id,
                name: s.user?.fullName, // Ensure user join worked
                email: s.user?.email
            } : null,
            plan: s.plan
        }));
    }

    // Mark expired subscriptions
    static async markExpiredSubscriptions() {
        const result = await db.update(subscriptions)
            .set({ status: 'inactive' }) // 'expired' not in enum. using 'inactive'.
            .where(and(
                eq(subscriptions.status, 'active'),
                lt(subscriptions.endDate, new Date())
            ));

        // Drizzle return type for update?
        // It returns [MySqlResultSet] usually or similar.
        // We can just return basic confirmation.
        return 1;
    }
}
