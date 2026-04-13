import { and, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '../config/database.js';
import {
  equipment,
  equipmentEvents,
  members,
  payments,
  ptSessions,
  reportRuns,
  subscriptionPlans,
  subscriptions,
  users,
  visits,
} from '../db/schema.js';
import { eeLc, payLc, ptLc, subLc, userLc, visitLc } from '../db/lifecycleAliases.js';
import { ids } from '../utils/id.js';
import { maskReportForExport } from '../utils/report-mask.js';

export const REPORT_DIRECT_ROW_CAP = 500;

export type ReportChannel = 'summary' | 'pdf';

function daysInclusive(fromDate?: string | null, toDate?: string | null): number {
  const end = toDate ? new Date(`${toDate}T12:00:00Z`) : new Date();
  let start: Date;
  if (fromDate) {
    start = new Date(`${fromDate}T12:00:00Z`);
  } else {
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 30);
  }
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(ms / 86_400_000) + 1);
}

function approxDirectRowCount(direct: Record<string, unknown>): number {
  let n = 0;
  for (const v of Object.values(direct)) {
    if (Array.isArray(v)) n += v.length;
  }
  return Math.min(n, 32_767);
}

export async function insertReportRun(input: {
  actorId: string;
  reportType: string;
  fromDate?: string | null;
  toDate?: string | null;
  channel: ReportChannel;
  direct: Record<string, unknown>;
}) {
  try {
    await db.insert(reportRuns).values({
      id: ids.uuid(),
      actorId: input.actorId,
      reportType: input.reportType,
      fromDate: input.fromDate ?? null,
      toDate: input.toDate ?? null,
      channel: input.channel,
      directRowsApprox: approxDirectRowCount(input.direct),
    });
  } catch (e) {
    console.error('report_runs insert failed', e);
  }
}

async function fetchDirectPayments(fromFrag: string, toFrag: string, cap: number) {
  const memberUser = alias(users, 'report_pay_member');
  const rows = await db
    .select({
      paymentDate: payments.paymentDate,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      status: payments.status,
      receiptNumber: payments.receiptNumber,
      referenceNumber: payments.referenceNumber,
      invoiceNumber: payments.invoiceNumber,
      memberName: memberUser.fullName,
      memberEmail: memberUser.email,
      planName: subscriptionPlans.name,
    })
    .from(payments)
    .innerJoin(payLc, eq(payments.lifecycleId, payLc.id))
    .innerJoin(subscriptions, eq(payments.subscriptionId, subscriptions.id))
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .leftJoin(memberUser, eq(subscriptions.memberId, memberUser.id))
    .where(
      and(sql`date(${payments.paymentDate}) >= ${sql.raw(fromFrag)}`, sql`date(${payments.paymentDate}) <= ${sql.raw(toFrag)}`),
    )
    .orderBy(desc(payments.paymentDate), desc(payments.id))
    .limit(cap + 1);

  const truncated = rows.length > cap;
  return {
    rows: rows.slice(0, cap).map((r) => ({
      ...r,
      amount: Number(r.amount ?? 0),
    })),
    truncated,
  };
}

async function fetchDirectNewMembers(fromFrag: string, toFrag: string, cap: number) {
  const rows = await db
    .select({
      fullName: users.fullName,
      email: users.email,
      memberCode: members.memberCode,
      registeredAt: userLc.createdAt,
    })
    .from(users)
    .innerJoin(userLc, eq(users.lifecycleId, userLc.id))
    .innerJoin(members, eq(members.userId, users.id))
    .where(
      and(
        eq(users.role, 'member'),
        sql`date(${userLc.createdAt}) >= ${sql.raw(fromFrag)}`,
        sql`date(${userLc.createdAt}) <= ${sql.raw(toFrag)}`,
      ),
    )
    .orderBy(desc(userLc.createdAt))
    .limit(cap + 1);

  const truncated = rows.length > cap;
  return { rows: rows.slice(0, cap), truncated };
}

async function fetchDirectSubscriptionsCreated(fromFrag: string, toFrag: string, cap: number) {
  const rows = await db
    .select({
      status: subscriptions.status,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      planName: subscriptionPlans.name,
      memberName: users.fullName,
      createdAt: subLc.createdAt,
    })
    .from(subscriptions)
    .innerJoin(subLc, eq(subscriptions.lifecycleId, subLc.id))
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .leftJoin(users, eq(subscriptions.memberId, users.id))
    .where(and(sql`date(${subLc.createdAt}) >= ${sql.raw(fromFrag)}`, sql`date(${subLc.createdAt}) <= ${sql.raw(toFrag)}`))
    .orderBy(desc(subLc.createdAt))
    .limit(cap + 1);

  const truncated = rows.length > cap;
  return { rows: rows.slice(0, cap), truncated };
}

async function fetchDirectVisits(fromFrag: string, toFrag: string, cap: number) {
  const visitMember = alias(users, 'report_visit_member');
  const rows = await db
    .select({
      memberName: visitMember.fullName,
      memberEmail: visitMember.email,
      checkInAt: visits.checkInAt,
      checkOutAt: visits.checkOutAt,
      durationMin: visits.durationMin,
      status: visits.status,
    })
    .from(visits)
    .innerJoin(visitLc, eq(visits.lifecycleId, visitLc.id))
    .leftJoin(visitMember, eq(visits.personId, visitMember.id))
    .where(and(sql`date(${visits.checkInAt}) >= ${sql.raw(fromFrag)}`, sql`date(${visits.checkInAt}) <= ${sql.raw(toFrag)}`))
    .orderBy(desc(visits.checkInAt))
    .limit(cap + 1);

  const truncated = rows.length > cap;
  return { rows: rows.slice(0, cap), truncated };
}

async function fetchDirectEquipmentEvents(fromFrag: string, toFrag: string, cap: number) {
  const rows = await db
    .select({
      createdAt: eeLc.createdAt,
      equipmentName: equipment.name,
      eventType: equipmentEvents.eventType,
      severity: equipmentEvents.severity,
      status: equipmentEvents.status,
      description: equipmentEvents.description,
    })
    .from(equipmentEvents)
    .innerJoin(eeLc, eq(equipmentEvents.lifecycleId, eeLc.id))
    .leftJoin(equipment, eq(equipmentEvents.equipmentId, equipment.id))
    .where(and(sql`date(${eeLc.createdAt}) >= ${sql.raw(fromFrag)}`, sql`date(${eeLc.createdAt}) <= ${sql.raw(toFrag)}`))
    .orderBy(desc(eeLc.createdAt))
    .limit(cap + 1);

  const truncated = rows.length > cap;
  return {
    rows: rows.slice(0, cap).map((r) => ({
      ...r,
      description: (r.description ?? '').slice(0, 500),
    })),
    truncated,
  };
}

async function fetchDirectPtSessions(fromFrag: string, toFrag: string, cap: number) {
  const trainerUser = alias(users, 'report_pt_trainer');
  const memberUser = alias(users, 'report_pt_member');
  const rows = await db
    .select({
      sessionDate: ptSessions.sessionDate,
      startTime: ptSessions.startTime,
      endTime: ptSessions.endTime,
      status: ptSessions.status,
      trainerName: trainerUser.fullName,
      memberName: memberUser.fullName,
    })
    .from(ptSessions)
    .innerJoin(ptLc, eq(ptSessions.lifecycleId, ptLc.id))
    .leftJoin(trainerUser, eq(ptSessions.trainerId, trainerUser.id))
    .leftJoin(memberUser, eq(ptSessions.memberId, memberUser.id))
    .where(
      and(sql`date(${ptSessions.sessionDate}) >= ${sql.raw(fromFrag)}`, sql`date(${ptSessions.sessionDate}) <= ${sql.raw(toFrag)}`),
    )
    .orderBy(desc(ptSessions.sessionDate), desc(ptSessions.startTime))
    .limit(cap + 1);

  const truncated = rows.length > cap;
  return { rows: rows.slice(0, cap), truncated };
}

function enrichAnalytical(payload: Record<string, unknown>, reportType: string, fromDate?: string | null, toDate?: string | null) {
  const d = daysInclusive(fromDate, toDate);

  if (reportType === 'revenue' && Array.isArray(payload.byMethod)) {
    const byMethod = payload.byMethod as { method: string; total: string | number; count: number }[];
    const totalRev = byMethod.reduce((s, r) => s + Number(r.total ?? 0), 0);
    const totalCnt = byMethod.reduce((s, r) => s + Number(r.count ?? 0), 0);
    payload.totalRevenueInRange = totalRev;
    payload.paymentCountInRange = totalCnt;
    payload.averagePaymentInRange = totalCnt > 0 ? Math.round((totalRev / totalCnt) * 100) / 100 : 0;
    payload.byMethod = byMethod.map((r) => {
      const t = Number(r.total ?? 0);
      return {
        ...r,
        pctOfTotalRevenue: totalRev > 0 ? Math.round((t / totalRev) * 10_000) / 100 : 0,
      };
    });
  }

  if (reportType === 'membership' && Array.isArray(payload.byStatus)) {
    const byStatus = payload.byStatus as { status: string; count: number }[];
    const totalSubs = byStatus.reduce((s, r) => s + Number(r.count ?? 0), 0);
    payload.subscriptionsCreatedInRange = totalSubs;
    payload.byStatus = byStatus.map((r) => {
      const c = Number(r.count ?? 0);
      return {
        ...r,
        pctOfCreated: totalSubs > 0 ? Math.round((c / totalSubs) * 10_000) / 100 : 0,
      };
    });
    if (Array.isArray(payload.byPlan)) {
      const byPlan = payload.byPlan as { count: number }[];
      payload.activeSubscriptionsTotal = byPlan.reduce((s, r) => s + Number(r.count ?? 0), 0);
    }
  }

  if (reportType === 'attendance') {
    const visitsInRange = Number(payload.visitsInRange ?? 0);
    payload.avgVisitsPerDayInRange = Math.round((visitsInRange / d) * 100) / 100;
  }

  if (reportType === 'equipment' && Array.isArray(payload.bySeverity)) {
    const bySev = payload.bySeverity as { count: number }[];
    payload.incidentsInRange = bySev.reduce((s, r) => s + Number(r.count ?? 0), 0);
  }

  if (reportType === 'trainer' && Array.isArray(payload.trainerStats)) {
    const stats = payload.trainerStats as { total: number; completed: number; cancelled: number }[];
    payload.ptSessionsInRange = stats.reduce((s, r) => s + Number(r.total ?? 0), 0);
    payload.trainerStats = stats.map((r) => {
      const t = Number(r.total ?? 0);
      const c = Number(r.completed ?? 0);
      return {
        ...r,
        completionRatePct: t > 0 ? Math.round((c / t) * 10_000) / 100 : 0,
      };
    });
  }
}

/**
 * Adds meta, analytical enrichments, and capped direct (row-level) sections for PDF/UI.
 */
export async function finalizeReportPayload(
  payload: Record<string, unknown>,
  reportType: string,
  fromFrag: string,
  toFrag: string,
  params?: { fromDate?: string; toDate?: string },
) {
  const cap = REPORT_DIRECT_ROW_CAP;
  const meta = {
    generatedAt: new Date().toISOString(),
    directRowCap: cap,
    directTruncated: {} as Record<string, boolean>,
  };
  const direct: Record<string, unknown> = {};

  enrichAnalytical(payload, reportType, params?.fromDate, params?.toDate);

  const loadPayments = async () => {
    const { rows, truncated } = await fetchDirectPayments(fromFrag, toFrag, cap);
    direct.payments = rows;
    meta.directTruncated.payments = truncated;
  };
  const loadVisits = async () => {
    const { rows, truncated } = await fetchDirectVisits(fromFrag, toFrag, cap);
    direct.visits = rows;
    meta.directTruncated.visits = truncated;
  };

  if (reportType === 'revenue' || reportType === 'overview') {
    await loadPayments();
  }
  if (reportType === 'overview') {
    await loadVisits();
  }

  if (reportType === 'membership') {
    const nm = await fetchDirectNewMembers(fromFrag, toFrag, cap);
    direct.newMemberRegistrations = nm.rows;
    meta.directTruncated.newMemberRegistrations = nm.truncated;
    const sc = await fetchDirectSubscriptionsCreated(fromFrag, toFrag, cap);
    direct.subscriptionsCreated = sc.rows;
    meta.directTruncated.subscriptionsCreated = sc.truncated;
  }

  if (reportType === 'attendance') {
    await loadVisits();
  }

  if (reportType === 'equipment') {
    const ev = await fetchDirectEquipmentEvents(fromFrag, toFrag, cap);
    direct.equipmentEvents = ev.rows;
    meta.directTruncated.equipmentEvents = ev.truncated;
  }

  if (reportType === 'trainer') {
    const pt = await fetchDirectPtSessions(fromFrag, toFrag, cap);
    direct.ptSessions = pt.rows;
    meta.directTruncated.ptSessions = pt.truncated;
  }

  return maskReportForExport({ ...payload, meta, direct });
}
