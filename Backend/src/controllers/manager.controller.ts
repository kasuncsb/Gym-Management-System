// Manager Controller — Phase 1 (business-focused endpoints)
import { Response } from 'express';
import { asyncHandler } from '../middleware/error-handler.middleware';
import { successResponse, paginatedResponse } from '../utils/response-formatter';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { members, subscriptions, payments, accessLogs, staff, users } from '../db/schema';
import { eq, count, sql, and, gte, lte, isNull, between } from 'drizzle-orm';

export class ManagerController {
  /** Business metrics */
  static getMetrics = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [currentMonthRevenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(and(gte(payments.paymentDate, startOfMonth), eq(payments.status, 'completed')));

    const [lastMonthRevenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(and(
        between(payments.paymentDate, startOfLastMonth, endOfLastMonth),
        eq(payments.status, 'completed'),
      ));

    const [activeMembers] = await db.select({ count: count() }).from(members).where(eq(members.status, 'active'));
    const [newMembersThisMonth] = await db.select({ count: count() }).from(members).where(gte(members.joinDate, startOfMonth));

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [todayAttendance] = await db
      .select({ count: count() })
      .from(accessLogs)
      .where(and(gte(accessLogs.scannedAt, todayStart), eq(accessLogs.direction, 'in'), eq(accessLogs.isAuthorized, true)));

    const [activeSubscriptions] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(and(eq(subscriptions.status, 'active'), gte(subscriptions.endDate, today)));

    const [staffCount] = await db.select({ count: count() }).from(staff).where(eq(staff.status, 'active'));

    const currentRev = Number(currentMonthRevenue?.total) || 0;
    const lastRev = Number(lastMonthRevenue?.total) || 1;
    const revenueGrowth = ((currentRev - lastRev) / lastRev * 100).toFixed(1);

    res.json(successResponse({
      revenue: { currentMonth: currentRev, lastMonth: Number(lastMonthRevenue?.total) || 0, growth: `${revenueGrowth}%` },
      members: { active: activeMembers?.count || 0, newThisMonth: newMembersThisMonth?.count || 0 },
      attendance: { today: todayAttendance?.count || 0 },
      subscriptions: { active: activeSubscriptions?.count || 0 },
      staff: { onDuty: staffCount?.count || 0 },
    }, 'Manager metrics retrieved'));
  });

  /** Branch members */
  static getBranchMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const membersList = await db
      .select({
        id: members.id, memberCode: members.memberCode, name: users.fullName,
        email: users.email, phone: users.phone, status: members.status, joinDate: members.joinDate,
      })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(isNull(members.deletedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({ count: count() }).from(members).where(isNull(members.deletedAt));
    res.json(paginatedResponse(membersList, page, limit, countResult?.count || 0));
  });

  /** Staff list */
  static getStaffList = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const staffList = await db
      .select({
        id: staff.id, employeeCode: staff.employeeCode, name: users.fullName,
        email: users.email, designation: staff.designation, status: staff.status, hireDate: staff.hireDate,
      })
      .from(staff)
      .innerJoin(users, eq(users.id, staff.userId))
      .where(isNull(staff.deletedAt));

    res.json(successResponse(staffList, 'Staff list retrieved'));
  });
}
