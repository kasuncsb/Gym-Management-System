// Dashboard Controller - Provides stats and recent activity for dashboard pages
import { Request, Response } from 'express';
import { db } from '../config/database';
import { members, users, subscriptions, subscriptionPlans, payments, branches } from '../db/schema';
import { eq, desc, count, sql, gte, and } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response-formatter';
import { asyncHandler } from '../middleware/error-handler.middleware';

export class DashboardController {
    // Get dashboard stats (protected - staff/admin only)
    static getStats = asyncHandler(async (req: Request, res: Response) => {
        // Total active members
        const [memberCount] = await db.select({ count: count() })
            .from(members)
            .where(eq(members.status, 'active'));

        // Active subscriptions count (as "active now" proxy)
        const [activeSubCount] = await db.select({ count: count() })
            .from(subscriptions)
            .where(eq(subscriptions.status, 'active'));

        // Monthly revenue (sum of payments this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [revenueResult] = await db.select({
            total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`
        })
            .from(payments)
            .where(
                and(
                    eq(payments.status, 'success'),
                    gte(payments.paymentDate, startOfMonth)
                )
            );

        // Simple conversion rate: active members / total members
        const [totalMemberCount] = await db.select({ count: count() }).from(members);
        const conversionRate = totalMemberCount.count > 0
            ? Math.round((memberCount.count / totalMemberCount.count) * 100)
            : 0;

        const stats = {
            totalMembers: memberCount.count,
            activeNow: activeSubCount.count,
            monthlyRevenue: parseFloat(String(revenueResult.total)) || 0,
            conversionRate: conversionRate
        };

        res.json(successResponse(stats, 'Dashboard stats retrieved'));
    });

    // Get recent signups (protected - staff/admin only)
    static getRecentSignups = asyncHandler(async (req: Request, res: Response) => {
        const recentMembers = await db.select({
            id: members.id,
            name: users.fullName,
            avatarUrl: users.avatarUrl,
            planName: subscriptionPlans.name,
            joinDate: members.joinDate
        })
            .from(members)
            .innerJoin(users, eq(members.userId, users.id))
            .leftJoin(subscriptions, eq(subscriptions.memberId, members.id))
            .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
            .orderBy(desc(members.joinDate))
            .limit(5);

        // Calculate relative time
        const now = new Date();
        const formattedMembers = recentMembers.map((m: typeof recentMembers[0]) => {
            const joinDate = m.joinDate ? new Date(m.joinDate) : now;
            const diffMs = now.getTime() - joinDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            let timeAgo: string;
            if (diffMins < 60) {
                timeAgo = `${diffMins}m ago`;
            } else if (diffHours < 24) {
                timeAgo = `${diffHours}h ago`;
            } else {
                timeAgo = `${diffDays}d ago`;
            }

            // Generate initials from name
            const nameParts = (m.name || 'User').split(' ');
            const initials = nameParts.length >= 2
                ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
                : (m.name || 'U').substring(0, 2).toUpperCase();

            return {
                id: m.id,
                name: m.name || 'Unknown',
                initials,
                avatarUrl: m.avatarUrl,
                planName: m.planName || 'No Plan',
                timeAgo
            };
        });

        res.json(successResponse(formattedMembers, 'Recent signups retrieved'));
    });

    // Get member-specific dashboard stats (for member portal)
    static getMemberStats = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user?.userId;

        if (!userId) {
            res.status(401).json(errorResponse('UNAUTHORIZED', 'User not authenticated'));
            return;
        }

        // Find member by userId
        const [member] = await db.select().from(members).where(eq(members.userId, userId)).limit(1);

        if (!member) {
            res.status(404).json(errorResponse('NOT_FOUND', 'Member not found'));
            return;
        }

        // Get active subscription
        const [activeSub] = await db.select({
            planName: subscriptionPlans.name,
            endDate: subscriptions.endDate,
            status: subscriptions.status
        })
            .from(subscriptions)
            .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
            .where(
                and(
                    eq(subscriptions.memberId, member.id),
                    eq(subscriptions.status, 'active')
                )
            )
            .limit(1);

        // Calculate days remaining
        let daysRemaining = 0;
        if (activeSub?.endDate) {
            const endDate = new Date(activeSub.endDate);
            const now = new Date();
            daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));
        }

        const memberStats = {
            membershipStatus: activeSub?.status || 'inactive',
            planName: activeSub?.planName || 'No Active Plan',
            daysRemaining,
            checkInsThisMonth: 0  // Placeholder - would need access logs
        };

        res.json(successResponse(memberStats, 'Member stats retrieved'));
    });
}
