// Dashboard Controller — Phase 1
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { members, users, subscriptions, subscriptionPlans, payments, visitSessions } from '../db/schema';
import { eq, desc, count, sql, gte, and } from 'drizzle-orm';
import { successResponse, errorResponse } from '../utils/response-formatter';
import { asyncHandler } from '../middleware/error-handler.middleware';

export class DashboardController {
  /** Overview stats (staff/manager/admin) */
  static getStats = asyncHandler(async (_req: Request, res: Response) => {
    const [memberCount] = await db.select({ count: count() }).from(members).where(eq(members.status, 'active'));

    const [activeSubCount] = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'active'));

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [revenueResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(and(eq(payments.status, 'completed'), gte(payments.paymentDate, startOfMonth)));

    const [totalMemberCount] = await db.select({ count: count() }).from(members);
    const conversionRate = totalMemberCount.count > 0
      ? Math.round((memberCount.count / totalMemberCount.count) * 100)
      : 0;

    res.json(successResponse({
      totalMembers: memberCount.count,
      activeNow: activeSubCount.count,
      monthlyRevenue: parseFloat(String(revenueResult.total)) || 0,
      conversionRate,
    }, 'Dashboard stats retrieved'));
  });

  /** Recent signups (staff/manager/admin) */
  static getRecentSignups = asyncHandler(async (_req: Request, res: Response) => {
    const recentMembers = await db
      .select({
        id: members.id,
        name: users.fullName,
        avatarUrl: users.avatarUrl,
        planName: subscriptionPlans.name,
        joinDate: members.joinDate,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .leftJoin(subscriptions, eq(subscriptions.memberId, members.id))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .orderBy(desc(members.joinDate))
      .limit(5);

    const now = new Date();
    const formatted = recentMembers.map((m) => {
      const joinDate = m.joinDate ? new Date(m.joinDate) : now;
      const diffMs = now.getTime() - joinDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const timeAgo = diffMins < 60 ? `${diffMins}m ago` : diffHours < 24 ? `${diffHours}h ago` : `${diffDays}d ago`;

      const parts = (m.name || 'User').split(' ');
      const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : (m.name || 'U').substring(0, 2).toUpperCase();

      return {
        id: m.id,
        name: m.name || 'Unknown',
        initials,
        avatarUrl: m.avatarUrl,
        planName: m.planName || 'No Plan',
        timeAgo,
      };
    });

    res.json(successResponse(formatted, 'Recent signups retrieved'));
  });

  /** Member portal stats */
  static getMemberStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return void res.status(401).json(errorResponse('UNAUTHORIZED', 'User not authenticated'));

    const [member] = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
    if (!member) return void res.status(404).json(errorResponse('NOT_FOUND', 'Member not found'));

    const [activeSub] = await db
      .select({ planName: subscriptionPlans.name, endDate: subscriptions.endDate, status: subscriptions.status })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(and(eq(subscriptions.memberId, member.id), eq(subscriptions.status, 'active')))
      .limit(1);

    let daysRemaining = 0;
    if (activeSub?.endDate) {
      const end = new Date(activeSub.endDate);
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
    }

    // Count visit sessions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [visits] = await db
      .select({ count: count() })
      .from(visitSessions)
      .where(and(eq(visitSessions.userId, userId), gte(visitSessions.checkInAt, startOfMonth)));

    res.json(successResponse({
      membershipStatus: activeSub?.status || 'inactive',
      planName: activeSub?.planName || 'No Active Plan',
      daysRemaining,
      checkInsThisMonth: visits?.count ?? 0,
    }, 'Member stats retrieved'));
  });
}
