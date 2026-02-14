// Analytics Service — Phase 3
// Advanced analytics: trends, heatmaps, growth tracking
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';
import { db } from '../config/database';
import {
  members, subscriptions, payments, visitSessions,
  accessLogs, users, equipment, equipmentIssues,
} from '../db/schema';

export class AnalyticsService {
  /** Member growth trend (last N months) */
  static async getMemberGrowthTrend(months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);

    const rows = await db
      .select({
        month: sql<string>`DATE_FORMAT(${members.joinDate}, '%Y-%m')`,
        newMembers: sql<number>`count(*)`,
      })
      .from(members)
      .where(gte(members.joinDate, since))
      .groupBy(sql`DATE_FORMAT(${members.joinDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${members.joinDate}, '%Y-%m')`);

    return rows.map(r => ({ month: r.month, newMembers: Number(r.newMembers) }));
  }

  /** Revenue trend (last N months) */
  static async getRevenueTrend(months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);

    const rows = await db
      .select({
        month: sql<string>`DATE_FORMAT(${payments.paymentDate}, '%Y-%m')`,
        revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        txCount: sql<number>`count(*)`,
      })
      .from(payments)
      .where(and(eq(payments.status, 'completed'), gte(payments.paymentDate, since)))
      .groupBy(sql`DATE_FORMAT(${payments.paymentDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${payments.paymentDate}, '%Y-%m')`);

    return rows.map(r => ({
      month: r.month,
      revenue: parseFloat(String(r.revenue)),
      transactions: Number(r.txCount),
    }));
  }

  /** Attendance heatmap — visits aggregated by day-of-week × hour */
  static async getAttendanceHeatmap(days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await db
      .select({
        dayOfWeek: sql<number>`DAYOFWEEK(${visitSessions.checkInAt})`,
        hour: sql<number>`HOUR(${visitSessions.checkInAt})`,
        visits: sql<number>`count(*)`,
      })
      .from(visitSessions)
      .where(gte(visitSessions.checkInAt, since))
      .groupBy(
        sql`DAYOFWEEK(${visitSessions.checkInAt})`,
        sql`HOUR(${visitSessions.checkInAt})`,
      )
      .orderBy(
        sql`DAYOFWEEK(${visitSessions.checkInAt})`,
        sql`HOUR(${visitSessions.checkInAt})`,
      );

    // Build 7×24 matrix (1=Sun..7=Sat, 5:00-22:00 operating hours)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const matrix: { day: string; hour: number; visits: number }[] = [];
    for (let d = 1; d <= 7; d++) {
      for (let h = 5; h <= 22; h++) {
        const row = rows.find(r => Number(r.dayOfWeek) === d && Number(r.hour) === h);
        matrix.push({ day: dayNames[d - 1], hour: h, visits: row ? Number(row.visits) : 0 });
      }
    }
    return matrix;
  }

  /** Churn analysis — members whose subs expired in each month */
  static async getChurnTrend(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);

    const rows = await db
      .select({
        month: sql<string>`DATE_FORMAT(${subscriptions.endDate}, '%Y-%m')`,
        expired: sql<number>`count(*)`,
      })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.status, 'expired'),
        gte(subscriptions.endDate, since),
      ))
      .groupBy(sql`DATE_FORMAT(${subscriptions.endDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${subscriptions.endDate}, '%Y-%m')`);

    return rows.map(r => ({ month: r.month, expired: Number(r.expired) }));
  }

  /** Real-time occupancy (checked in but not checked out) */
  static async getCurrentOccupancy() {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(visitSessions)
      .where(sql`${visitSessions.checkOutAt} IS NULL`);

    return { currentOccupancy: Number(result.count) };
  }

  /** Daily visit counts for the last N days */
  static async getDailyVisits(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await db
      .select({
        date: sql<string>`DATE(${visitSessions.checkInAt})`,
        visits: sql<number>`count(*)`,
      })
      .from(visitSessions)
      .where(gte(visitSessions.checkInAt, since))
      .groupBy(sql`DATE(${visitSessions.checkInAt})`)
      .orderBy(sql`DATE(${visitSessions.checkInAt})`);

    return rows.map(r => ({ date: r.date, visits: Number(r.visits) }));
  }

  /** Equipment utilization — issues and maintenance frequency */
  static async getEquipmentUtilization() {
    const items = await db
      .select({
        id: equipment.id,
        name: equipment.name,
        status: equipment.status,
        openIssues: sql<number>`(SELECT count(*) FROM equipment_issues WHERE equipment_id = ${equipment.id} AND status != 'resolved')`,
        totalMaintenance: sql<number>`(SELECT count(*) FROM maintenance_logs WHERE equipment_id = ${equipment.id})`,
      })
      .from(equipment)
      .orderBy(equipment.name);

    return items.map(i => ({
      id: i.id,
      name: i.name,
      status: i.status,
      openIssues: Number(i.openIssues),
      totalMaintenance: Number(i.totalMaintenance),
    }));
  }

  /** Subscription distribution — how many members on each plan */
  static async getSubscriptionDistribution() {
    const rows = await db.execute(
      sql`SELECT sp.name AS plan_name, sp.price,
             SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS active_count,
             count(s.id) AS total_count
          FROM subscription_plans sp
          LEFT JOIN subscriptions s ON s.plan_id = sp.id
          WHERE sp.is_active = 1
          GROUP BY sp.id, sp.name, sp.price
          ORDER BY active_count DESC`,
    );

    return (rows as any)[0] || [];
  }

  /** Top members by visit count in the last N days */
  static async getTopMembersByVisits(days = 30, limit = 10) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await db
      .select({
        memberId: visitSessions.userId,
        fullName: users.fullName,
        visits: sql<number>`count(*)`,
      })
      .from(visitSessions)
      .innerJoin(users, eq(visitSessions.userId, users.id))
      .where(gte(visitSessions.checkInAt, since))
      .groupBy(visitSessions.userId, users.fullName)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return rows.map(r => ({
      memberId: r.memberId,
      name: r.fullName,
      visits: Number(r.visits),
    }));
  }
}
