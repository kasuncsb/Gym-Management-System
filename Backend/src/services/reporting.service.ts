// Reporting Service — Phase 3
// Generates structured reports: revenue, retention, attendance, equipment costs
import { eq, and, desc, gte, lte, sql, count, between } from 'drizzle-orm';
import { db } from '../config/database';
import {
  payments, members, subscriptions, subscriptionPlans,
  visitSessions, accessLogs, equipment, maintenanceLogs,
  inventoryItems, inventoryTransactions, users,
} from '../db/schema';

export class ReportingService {
  /** Monthly revenue report */
  static async getRevenueReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Total revenue
    const [totalResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(and(
        eq(payments.status, 'completed'),
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate),
      ));

    // Revenue by payment method
    const byMethod = await db
      .select({
        method: payments.paymentMethod,
        total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'completed'),
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate),
      ))
      .groupBy(payments.paymentMethod);

    // Daily breakdown
    const daily = await db
      .select({
        day: sql<string>`DATE(${payments.paymentDate})`,
        total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(payments)
      .where(and(
        eq(payments.status, 'completed'),
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate),
      ))
      .groupBy(sql`DATE(${payments.paymentDate})`)
      .orderBy(sql`DATE(${payments.paymentDate})`);

    // Previous month comparison
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59);
    const [prevResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(and(
        eq(payments.status, 'completed'),
        gte(payments.paymentDate, prevStart),
        lte(payments.paymentDate, prevEnd),
      ));

    const currentTotal = parseFloat(String(totalResult.total)) || 0;
    const prevTotal = parseFloat(String(prevResult.total)) || 0;
    const growthPercent = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

    return {
      period: { year, month },
      totalRevenue: currentTotal,
      previousMonthRevenue: prevTotal,
      growthPercent: Math.round(growthPercent * 10) / 10,
      byMethod: byMethod.map(r => ({ method: r.method, total: parseFloat(String(r.total)), count: Number(r.count) })),
      daily: daily.map(d => ({ date: d.day, total: parseFloat(String(d.total)), count: Number(d.count) })),
    };
  }

  /** Member retention report */
  static async getRetentionReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Subscriptions that expired during this period
    const expiredSubs = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(and(
        gte(subscriptions.endDate, startDate),
        lte(subscriptions.endDate, endDate),
        eq(subscriptions.status, 'expired'),
      ));

    // Renewed within 30 days of expiry
    const renewedSubs = await db
      .select({ count: sql<number>`count(DISTINCT ${subscriptions.memberId})` })
      .from(subscriptions)
      .where(and(
        gte(subscriptions.startDate, startDate),
        lte(subscriptions.startDate, endDate),
        eq(subscriptions.status, 'active'),
      ));

    // New members this month
    const [newMembers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(and(
        gte(members.joinDate, startDate),
        lte(members.joinDate, endDate),
      ));

    // Total active members
    const [activeMembers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(members)
      .where(eq(members.status, 'active'));

    // Churned (expired and not renewed)
    const totalExpired = Number(expiredSubs[0]?.count) || 0;
    const totalRenewed = Number(renewedSubs[0]?.count) || 0;
    const churned = Math.max(0, totalExpired - totalRenewed);
    const retentionRate = totalExpired > 0 ? ((totalRenewed / totalExpired) * 100) : 100;

    return {
      period: { year, month },
      totalActiveMembers: Number(activeMembers.count),
      newMembers: Number(newMembers.count),
      expiredSubscriptions: totalExpired,
      renewedSubscriptions: totalRenewed,
      churnedMembers: churned,
      retentionRate: Math.round(retentionRate * 10) / 10,
    };
  }

  /** Attendance report — visits by day/hour */
  static async getAttendanceReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Daily visit counts
    const daily = await db
      .select({
        day: sql<string>`DATE(${visitSessions.checkInAt})`,
        visits: sql<number>`count(*)`,
      })
      .from(visitSessions)
      .where(and(
        gte(visitSessions.checkInAt, startDate),
        lte(visitSessions.checkInAt, endDate),
      ))
      .groupBy(sql`DATE(${visitSessions.checkInAt})`)
      .orderBy(sql`DATE(${visitSessions.checkInAt})`);

    // Hourly distribution (heatmap data)
    const hourly = await db
      .select({
        dayOfWeek: sql<number>`DAYOFWEEK(${visitSessions.checkInAt})`,
        hour: sql<number>`HOUR(${visitSessions.checkInAt})`,
        visits: sql<number>`count(*)`,
      })
      .from(visitSessions)
      .where(and(
        gte(visitSessions.checkInAt, startDate),
        lte(visitSessions.checkInAt, endDate),
      ))
      .groupBy(sql`DAYOFWEEK(${visitSessions.checkInAt})`, sql`HOUR(${visitSessions.checkInAt})`)
      .orderBy(sql`DAYOFWEEK(${visitSessions.checkInAt})`, sql`HOUR(${visitSessions.checkInAt})`);

    // Total visits and average
    const totalVisits = daily.reduce((sum, d) => sum + Number(d.visits), 0);
    const avgDailyVisits = daily.length > 0 ? Math.round(totalVisits / daily.length) : 0;

    // Peak hour
    let peakHour = 0;
    let peakCount = 0;
    const hourAgg = new Map<number, number>();
    for (const h of hourly) {
      const existing = hourAgg.get(Number(h.hour)) || 0;
      hourAgg.set(Number(h.hour), existing + Number(h.visits));
    }
    for (const [hr, cnt] of hourAgg) {
      if (cnt > peakCount) { peakHour = hr; peakCount = cnt; }
    }

    return {
      period: { year, month },
      totalVisits,
      averageDailyVisits: avgDailyVisits,
      peakHour: `${peakHour.toString().padStart(2, '0')}:00`,
      daily: daily.map(d => ({ date: d.day, visits: Number(d.visits) })),
      hourly: hourly.map(h => ({ dayOfWeek: Number(h.dayOfWeek), hour: Number(h.hour), visits: Number(h.visits) })),
    };
  }

  /** Equipment cost report */
  static async getEquipmentCostReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Maintenance costs this month
    const maintenanceCosts = await db
      .select({
        equipmentId: maintenanceLogs.equipmentId,
        equipmentName: equipment.name,
        totalCost: sql<number>`COALESCE(SUM(${maintenanceLogs.cost}), 0)`,
        sessions: sql<number>`count(*)`,
      })
      .from(maintenanceLogs)
      .innerJoin(equipment, eq(maintenanceLogs.equipmentId, equipment.id))
      .where(and(
        gte(maintenanceLogs.performedAt, startDate),
        lte(maintenanceLogs.performedAt, endDate),
      ))
      .groupBy(maintenanceLogs.equipmentId, equipment.name);

    // Total equipment count & status
    const equipmentStats = await db
      .select({
        status: equipment.status,
        count: sql<number>`count(*)`,
      })
      .from(equipment)
      .groupBy(equipment.status);

    const totalMaintenanceCost = maintenanceCosts.reduce(
      (sum, r) => sum + (parseFloat(String(r.totalCost)) || 0),
      0,
    );

    return {
      period: { year, month },
      totalMaintenanceCost,
      byEquipment: maintenanceCosts.map(r => ({
        equipmentId: r.equipmentId,
        name: r.equipmentName,
        cost: parseFloat(String(r.totalCost)),
        sessions: Number(r.sessions),
      })),
      equipmentStatusSummary: equipmentStats.map(s => ({
        status: s.status,
        count: Number(s.count),
      })),
    };
  }

  /** Subscription plan popularity */
  static async getPlanPopularityReport() {
    const planStats = await db
      .select({
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        price: subscriptionPlans.price,
        activeCount: sql<number>`COALESCE(SUM(CASE WHEN ${subscriptions.status} = 'active' THEN 1 ELSE 0 END), 0)`,
        totalCount: sql<number>`count(${subscriptions.id})`,
      })
      .from(subscriptionPlans)
      .leftJoin(subscriptions, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptionPlans.isActive, true))
      .groupBy(subscriptionPlans.id, subscriptionPlans.name, subscriptionPlans.price);

    return planStats.map(p => ({
      planId: p.planId,
      planName: p.planName,
      price: parseFloat(String(p.price)),
      activeSubscriptions: Number(p.activeCount),
      totalSubscriptions: Number(p.totalCount),
    }));
  }

  /** Summary dashboard data for a given month */
  static async getMonthlySummary(year: number, month: number) {
    const [revenue, retention, attendance, equipmentCosts] = await Promise.all([
      this.getRevenueReport(year, month),
      this.getRetentionReport(year, month),
      this.getAttendanceReport(year, month),
      this.getEquipmentCostReport(year, month),
    ]);

    return {
      period: { year, month },
      revenue: {
        total: revenue.totalRevenue,
        growth: revenue.growthPercent,
      },
      members: {
        total: retention.totalActiveMembers,
        new: retention.newMembers,
        churned: retention.churnedMembers,
        retentionRate: retention.retentionRate,
      },
      attendance: {
        totalVisits: attendance.totalVisits,
        avgDaily: attendance.averageDailyVisits,
        peakHour: attendance.peakHour,
      },
      equipment: {
        maintenanceCost: equipmentCosts.totalMaintenanceCost,
      },
    };
  }
}
