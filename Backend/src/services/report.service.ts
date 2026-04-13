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

function toNum(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function titleCase(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type NarrativeMap = Record<string, unknown>;

function parseJsonLoose(text: string): NarrativeMap | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : trimmed;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as NarrativeMap) : null;
  } catch {
    return null;
  }
}

function pickAiNarrativeFields(ai: NarrativeMap, base: NarrativeMap): NarrativeMap {
  const out: NarrativeMap = { ...base };
  const scalarKeys = ['executiveSummary', 'sectionTitle', 'sectionSummary', 'chartTitle', 'chartInterpretation'] as const;
  for (const k of scalarKeys) {
    const v = ai[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim();
  }
  const listKeys = ['sectionParagraphs', 'highlights', 'whatThisMeans', 'recommendedActions'] as const;
  for (const k of listKeys) {
    const v = ai[k];
    if (Array.isArray(v)) {
      out[k] = v
        .map((x) => (typeof x === 'string' ? x.trim() : ''))
        .filter(Boolean)
        .slice(0, 6);
    }
  }
  return out;
}

function normalizeNarrativeText(raw: string): string {
  let s = raw.trim();
  if (!s) return s;
  // Enforce local currency conventions and remove foreign currency mentions.
  s = s.replace(/\$\s*/g, 'Rs. ');
  s = s.replace(/\bUSD\b/gi, 'LKR');
  s = s.replace(/\bUS dollars?\b/gi, 'LKR');
  s = s.replace(/€/g, 'Rs. ');
  s = s.replace(/£/g, 'Rs. ');
  // Keep output as plain text paragraphs.
  s = s.replace(/[*_`#]/g, '');
  s = s.replace(/\s{2,}/g, ' ');
  return s;
}

function sanitizeNarrativeMap(input: NarrativeMap): NarrativeMap {
  const out: NarrativeMap = { ...input };
  const scalarKeys = ['executiveSummary', 'sectionTitle', 'sectionSummary', 'chartTitle', 'chartInterpretation'] as const;
  for (const k of scalarKeys) {
    const v = out[k];
    if (typeof v === 'string') out[k] = normalizeNarrativeText(v);
  }
  const listKeys = ['sectionParagraphs', 'highlights', 'whatThisMeans', 'recommendedActions'] as const;
  for (const k of listKeys) {
    const v = out[k];
    if (Array.isArray(v)) {
      out[k] = v
        .map((x) => (typeof x === 'string' ? normalizeNarrativeText(x) : ''))
        .filter(Boolean)
        .slice(0, 6);
    }
  }
  return out;
}

async function maybeEnhanceNarrativeWithAi(
  baseNarrative: NarrativeMap,
  payload: Record<string, unknown>,
  reportType: string,
  fromDate?: string | null,
  toDate?: string | null,
): Promise<NarrativeMap> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return baseNarrative;
  if (process.env.REPORT_AI_NARRATIVE_ENABLED === 'false') return baseNarrative;

  try {
    const model = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const metricsDigest = {
      type: reportType,
      period: { fromDate: fromDate ?? null, toDate: toDate ?? null },
      headline: {
        monthlyRevenue: payload.monthlyRevenue ?? 0,
        activeMembers: payload.activeMembers ?? 0,
        visitsInRange: payload.visitsInRange ?? 0,
        openEquipmentIncidents: payload.openEquipmentIncidents ?? 0,
      },
      kpis: {
        totalRevenueInRange: payload.totalRevenueInRange ?? 0,
        paymentCountInRange: payload.paymentCountInRange ?? 0,
        newMembers: payload.newMembers ?? 0,
        subscriptionsCreatedInRange: payload.subscriptionsCreatedInRange ?? 0,
        incidentsInRange: payload.incidentsInRange ?? 0,
        ptSessionsInRange: payload.ptSessionsInRange ?? 0,
        activeItemCount: payload.activeItemCount ?? 0,
        lowStockItemCount: payload.lowStockItemCount ?? 0,
        totalTransactionsInRange: payload.totalTransactionsInRange ?? 0,
      },
      seriesPreview: {
        byMethod: Array.isArray(payload.byMethod) ? (payload.byMethod as unknown[]).slice(0, 6) : [],
        byPlan: Array.isArray(payload.byPlan) ? (payload.byPlan as unknown[]).slice(0, 6) : [],
        byStatus: Array.isArray(payload.byStatus) ? (payload.byStatus as unknown[]).slice(0, 6) : [],
        byHour: Array.isArray(payload.byHour) ? (payload.byHour as unknown[]).slice(0, 6) : [],
        bySeverity: Array.isArray(payload.bySeverity) ? (payload.bySeverity as unknown[]).slice(0, 6) : [],
        byCategory: Array.isArray(payload.byCategory) ? (payload.byCategory as unknown[]).slice(0, 6) : [],
      },
    };

    const prompt = `You are a business reporting writer for a gym branch manager.
Rewrite this report narrative to be clearer, richer, and action-oriented for non-technical stakeholders.
Rules:
- Use plain business language, not developer jargon.
- Keep facts strictly grounded in the provided metrics.
- Do not invent numbers.
- Use Sri Lankan currency format only (Rs. / LKR). NEVER use $, USD, EUR, or GBP.
- Keep text plain (no markdown bullets, no code formatting).
- Return ONLY JSON (no markdown, no prose outside JSON) with keys:
  executiveSummary (string),
  sectionTitle (string),
  sectionSummary (string),
  sectionParagraphs (string[] max 4),
  highlights (string[] max 4),
  whatThisMeans (string[] max 4),
  recommendedActions (string[] max 4),
  chartTitle (string),
  chartInterpretation (string).

Current narrative JSON:
${JSON.stringify(baseNarrative)}

Metrics digest JSON:
${JSON.stringify(metricsDigest)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3, topP: 0.9, maxOutputTokens: 1200 },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) return baseNarrative;
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('\n').trim() ?? '';
    const parsed = parseJsonLoose(text);
    if (!parsed) return baseNarrative;
    return sanitizeNarrativeMap(pickAiNarrativeFields(parsed, baseNarrative));
  } catch {
    return baseNarrative;
  }
}

function buildReportNarrative(
  payload: Record<string, unknown>,
  reportType: string,
  fromDate?: string | null,
  toDate?: string | null,
): Record<string, unknown> {
  const periodLabel = fromDate || toDate ? `${fromDate ?? 'Start'} to ${toDate ?? 'End'}` : 'Last 30 days';
  const baseExecutive = `This report covers ${periodLabel} and summarizes business performance in plain language for leadership review.`;

  const glossary = [
    { term: 'Active member', meaning: 'A member with an active membership status.' },
    { term: 'Completion rate', meaning: 'Completed sessions as a percentage of all scheduled sessions.' },
    { term: 'Open incident', meaning: 'An equipment issue that is still unresolved.' },
  ];

  if (reportType === 'revenue') {
    const total = toNum(payload.totalRevenueInRange);
    const count = toNum(payload.paymentCountInRange);
    const avg = toNum(payload.averagePaymentInRange);
    const byMethod = (Array.isArray(payload.byMethod) ? payload.byMethod : []) as Array<Record<string, unknown>>;
    const successful = toNum(payload.successfulPayments);
    const failed = toNum(payload.failedPayments);
    const pending = toNum(payload.pendingPayments);
    const uniquePayers = toNum(payload.uniquePayingMembers);
    const topMethod = byMethod
      .map((r) => ({ method: titleCase(String(r.method ?? 'Unknown')), total: toNum(r.total) }))
      .sort((a, b) => b.total - a.total)[0];
    const concentrationPct = topMethod && total > 0 ? Math.round((topMethod.total / total) * 1000) / 10 : 0;
    const concentrationRisk =
      concentrationPct >= 65 ? 'high concentration risk' : concentrationPct >= 45 ? 'moderate concentration risk' : 'low concentration risk';
    const revenueInterpretation = topMethod
      ? `Trend direction: revenue is led by ${topMethod.method} (${concentrationPct}% share), while overall throughput remains steady at ${count.toLocaleString()} payments. Risk callout: this indicates ${concentrationRisk} if one channel underperforms. Action: run a channel-balance campaign to lift the second-best method and reduce dependency.`
      : 'Trend direction: channel split is currently unavailable. Risk callout: without channel visibility, revenue dependency risk cannot be measured accurately. Action: verify payment method capture in operational reporting before the next review.';
    return {
      executiveSummary: `${baseExecutive} Revenue in period is Rs. ${Math.round(total).toLocaleString()} from ${count.toLocaleString()} payments.`,
      sectionTitle: 'Revenue Performance',
      sectionSummary: `Average payment value is Rs. ${Math.round(avg).toLocaleString()}. ${successful.toLocaleString()} payments were successfully completed with ${uniquePayers.toLocaleString()} unique paying members.`,
      sectionParagraphs: [
        'This section explains where money came from during the selected period and how stable the collection flow looks.',
        'A higher number of unique paying members typically means healthier demand distribution rather than dependence on a few customers.',
        `Payment outcome split: ${successful.toLocaleString()} successful, ${pending.toLocaleString()} pending, ${failed.toLocaleString()} failed.`,
      ],
      highlights: [
        topMethod ? `Top payment method: ${topMethod.method} (Rs. ${Math.round(topMethod.total).toLocaleString()}).` : 'Payment method mix is unavailable.',
        count > 0 ? `Transaction volume indicates steady customer purchase activity.` : 'No payments were recorded in the selected period.',
      ],
      whatThisMeans: [
        'Higher concentration in one method can increase dependency risk.',
        'Average payment value indicates customer spending quality.',
      ],
      recommendedActions: ['Promote underused payment channels.', 'Review plan pricing if average payment value declines.'],
      additionalMetrics: [
        { label: 'Successful payments', value: successful },
        { label: 'Pending payments', value: pending },
        { label: 'Failed payments', value: failed },
        { label: 'Unique paying members', value: uniquePayers },
      ],
      chartTitle: 'Revenue by Payment Method',
      chartSeries: byMethod.map((r) => ({ label: titleCase(String(r.method ?? 'Unknown')), value: toNum(r.total) })),
      chartInterpretation: revenueInterpretation,
      glossary,
    };
  }

  if (reportType === 'membership') {
    const newMembers = toNum(payload.newMembers);
    const created = toNum(payload.subscriptionsCreatedInRange);
    const active = toNum(payload.activeSubscriptionsTotal);
    const cancelled = toNum(payload.cancelledInRange);
    const trial = toNum(payload.trialInRange);
    const expiringSoon = toNum(payload.expiringSoon);
    const byPlan = (Array.isArray(payload.byPlan) ? payload.byPlan : []) as Array<Record<string, unknown>>;
    const createdBase = Math.max(1, created);
    const churnPct = Math.round((cancelled / createdBase) * 1000) / 10;
    const membershipInterpretation = `Trend direction: active membership is growing with ${newMembers.toLocaleString()} new members and ${active.toLocaleString()} active subscriptions. Risk callout: cancellation pressure is ${churnPct}% of created subscriptions and ${expiringSoon.toLocaleString()} plans are approaching renewal. Action: trigger a 30-day renewal outreach for expiring members and a save-offer workflow for cancellation-prone segments.`;
    return {
      executiveSummary: `${baseExecutive} Membership growth added ${newMembers.toLocaleString()} new members, with ${created.toLocaleString()} subscriptions created.`,
      sectionTitle: 'Membership Health',
      sectionSummary: `There are ${active.toLocaleString()} active subscriptions across all plans. ${expiringSoon.toLocaleString()} subscriptions are due to expire in the next 30 days.`,
      sectionParagraphs: [
        'This section describes the strength of the member base and early signs of future retention risk.',
        `Status movement in this period includes ${cancelled.toLocaleString()} cancellations and ${trial.toLocaleString()} trial subscriptions.`,
        'Expiring subscriptions provide a practical target list for renewal campaigns.',
      ],
      highlights: [
        byPlan.length > 0 ? `Most subscribed plan: ${String(byPlan.sort((a, b) => toNum(b.count) - toNum(a.count))[0]?.planName ?? 'Unknown')}.` : 'Plan split is unavailable.',
        'Subscription status mix shows retention and conversion quality.',
      ],
      whatThisMeans: ['New members track acquisition performance.', 'Active subscriptions indicate recurring revenue stability.'],
      recommendedActions: ['Strengthen onboarding for new members.', 'Target at-risk statuses with retention outreach.'],
      additionalMetrics: [
        { label: 'Cancellations in period', value: cancelled },
        { label: 'Trials started', value: trial },
        { label: 'Expiring in 30 days', value: expiringSoon },
      ],
      chartTitle: 'Active Subscriptions by Plan',
      chartSeries: byPlan.map((r) => ({ label: String(r.planName ?? 'Unknown'), value: toNum(r.count) })),
      chartInterpretation: membershipInterpretation,
      glossary,
    };
  }

  if (reportType === 'attendance') {
    const visits = toNum(payload.visitsInRange);
    const avgPerDay = toNum(payload.avgVisitsPerDayInRange);
    const uniqueVisitors = toNum(payload.uniqueVisitorsInRange);
    const avgVisitDuration = toNum(payload.avgVisitDurationInRange);
    const byHour = (Array.isArray(payload.byHour) ? payload.byHour : []) as Array<Record<string, unknown>>;
    const peak = byHour
      .map((r) => ({ hour: toNum(r.hour), count: toNum(r.count) }))
      .sort((a, b) => b.count - a.count)[0];
    const attendanceInterpretation = peak
      ? `Trend direction: attendance clusters around ${peak.hour}h with a peak of ${peak.count.toLocaleString()} visits, while the daily average remains ${avgPerDay.toLocaleString()}. Risk callout: concentrated peak windows can create queueing and reduced service quality. Action: align staffing and equipment availability around the top 2 hourly peaks and shift non-critical tasks to off-peak hours.`
      : 'Trend direction: hourly attendance detail is unavailable for this period. Risk callout: peak load cannot be forecast reliably without hour-level data. Action: ensure check-in timestamps are consistently captured and retry the report.';
    return {
      executiveSummary: `${baseExecutive} The gym logged ${visits.toLocaleString()} visits in total, averaging ${avgPerDay.toLocaleString()} visits per day.`,
      sectionTitle: 'Attendance Patterns',
      sectionSummary: `The hourly distribution highlights peak and low-demand operating windows. ${uniqueVisitors.toLocaleString()} unique visitors checked in, with average visit duration of ${avgVisitDuration.toLocaleString()} minutes.`,
      sectionParagraphs: [
        'This section explains traffic behaviour across the day so operations can align staffing and floor readiness.',
        'Daily and hourly patterns are used to anticipate crowding and customer waiting risk.',
        'Visit duration helps estimate equipment occupancy and turnover pressure.',
      ],
      highlights: ['Peak-hour concentration helps optimize staffing and equipment readiness.', 'Daily trend shows usage consistency across the period.'],
      whatThisMeans: ['Stable daily traffic supports predictable operations.', 'Large hourly spikes can indicate service bottlenecks.'],
      recommendedActions: ['Align trainer and front-desk shifts to peak times.', 'Schedule maintenance in low-traffic windows.'],
      additionalMetrics: [
        { label: 'Unique visitors', value: uniqueVisitors },
        { label: 'Average visit duration (min)', value: avgVisitDuration },
      ],
      chartTitle: 'Visits by Hour',
      chartSeries: byHour.map((r) => ({ label: `${toNum(r.hour)}h`, value: toNum(r.count) })),
      chartInterpretation: attendanceInterpretation,
      glossary,
    };
  }

  if (reportType === 'equipment') {
    const incidents = toNum(payload.incidentsInRange);
    const highOpen = toNum(payload.highSeverityOpenInRange);
    const resolved = toNum(payload.resolvedIncidentsInRange);
    const bySeverity = (Array.isArray(payload.bySeverity) ? payload.bySeverity : []) as Array<Record<string, unknown>>;
    const equipmentInterpretation = `Trend direction: incident volume is ${incidents.toLocaleString()} in the period, with ${resolved.toLocaleString()} resolved items. Risk callout: ${highOpen.toLocaleString()} high-severity open incidents represent immediate availability and safety exposure. Action: prioritize closure of high-severity open incidents before lower-priority maintenance tasks.`;
    return {
      executiveSummary: `${baseExecutive} There were ${incidents.toLocaleString()} equipment incidents reported in this period.`,
      sectionTitle: 'Equipment Reliability',
      sectionSummary: `Severity and status distribution show current maintenance risk levels. ${highOpen.toLocaleString()} high-severity issues remain open, while ${resolved.toLocaleString()} incidents were resolved during the same period.`,
      sectionParagraphs: [
        'This section shows reliability risk from both safety severity and resolution speed perspectives.',
        'Open high-severity incidents are the top operational priority because they can reduce safe capacity.',
        'Resolved incident count indicates maintenance throughput in the selected timeframe.',
      ],
      highlights: ['Open incidents should be prioritized by severity.', 'Recurring incidents may indicate replacement needs.'],
      whatThisMeans: ['High severe-incident share increases operational and safety risk.', 'Open tickets represent unresolved service impact.'],
      recommendedActions: ['Resolve high-severity open incidents first.', 'Create preventive checks for repeatedly failing equipment.'],
      additionalMetrics: [
        { label: 'High-severity open incidents', value: highOpen },
        { label: 'Incidents resolved in period', value: resolved },
      ],
      chartTitle: 'Incidents by Severity/Status',
      chartSeries: bySeverity.map((r) => ({ label: `${titleCase(String(r.severity ?? 'Unknown'))}/${titleCase(String(r.status ?? 'Unknown'))}`, value: toNum(r.count) })),
      chartInterpretation: equipmentInterpretation,
      glossary,
    };
  }

  if (reportType === 'inventory') {
    const activeItemCount = toNum(payload.activeItemCount);
    const totalStockUnits = toNum(payload.totalStockUnits);
    const lowStockItemCount = toNum(payload.lowStockItemCount);
    const txnCount = toNum(payload.totalTransactionsInRange);
    const moved = toNum(payload.totalQtyMovedInRange);
    const net = toNum(payload.netStockChangeInRange);
    const byCategory = (Array.isArray(payload.byCategory) ? payload.byCategory : []) as Array<Record<string, unknown>>;
    const topCategory = byCategory
      .map((r) => ({ category: String(r.category ?? 'Unknown'), count: toNum(r.itemCount) }))
      .sort((a, b) => b.count - a.count)[0];
    const inventoryInterpretation = `Trend direction: inventory is ${
      net >= 0 ? 'expanding' : 'contracting'
    } with a net change of ${net.toLocaleString()} units across ${txnCount.toLocaleString()} transactions. Risk callout: ${lowStockItemCount.toLocaleString()} low-stock items may cause fulfillment gaps. Action: prioritize restocking for threshold-breaching items, starting with ${
      topCategory ? `${topCategory.category} category` : 'the highest-demand category'
    }.`;
    return {
      executiveSummary: `${baseExecutive} Inventory currently tracks ${activeItemCount.toLocaleString()} active items with ${totalStockUnits.toLocaleString()} units in stock.`,
      sectionTitle: 'Inventory Position and Movement',
      sectionSummary: `${txnCount.toLocaleString()} inventory transactions moved ${moved.toLocaleString()} units in the selected period. Net stock change is ${net.toLocaleString()} units.`,
      sectionParagraphs: [
        'This section explains inventory health from both current stock position and movement activity perspective.',
        `${lowStockItemCount.toLocaleString()} items are currently at or below their reorder thresholds and may require restocking decisions.`,
        'Category-level and transaction-type views help separate demand-driven movement from operational adjustments or waste.',
      ],
      highlights: [
        byCategory.length > 0 ? `Largest inventory category: ${String(byCategory.sort((a, b) => toNum(b.itemCount) - toNum(a.itemCount))[0]?.category ?? 'Unknown')}.` : 'Category split is unavailable.',
        lowStockItemCount > 0 ? 'Low-stock exposure is present and should be tracked weekly.' : 'No immediate low-stock pressure detected.',
      ],
      whatThisMeans: [
        'Low-stock counts indicate near-term procurement risk.',
        'Net stock change helps identify whether inventory is accumulating or being depleted.',
      ],
      recommendedActions: [
        'Prioritize replenishment for items below threshold.',
        'Review high-movement items for forecast-based purchasing.',
      ],
      additionalMetrics: [
        { label: 'Active inventory items', value: activeItemCount },
        { label: 'Total stock units', value: totalStockUnits },
        { label: 'Low-stock items', value: lowStockItemCount },
        { label: 'Transactions in period', value: txnCount },
        { label: 'Total units moved', value: moved },
        { label: 'Net stock change', value: net },
      ],
      chartTitle: 'Inventory Items by Category',
      chartSeries: byCategory.map((r) => ({ label: String(r.category ?? 'Unknown'), value: toNum(r.itemCount) })),
      chartInterpretation: inventoryInterpretation,
      glossary,
    };
  }

  const totalSessions = toNum(payload.ptSessionsInRange);
  const activeTrainers = toNum(payload.activeTrainersInRange);
  const avgSessionsPerTrainer = toNum(payload.avgSessionsPerTrainer);
  const trainerStats = (Array.isArray(payload.trainerStats) ? payload.trainerStats : []) as Array<Record<string, unknown>>;
  const lowestCompletion = trainerStats
    .map((r) => ({ name: String(r.trainerName ?? 'Unknown'), rate: toNum(r.completionRatePct) }))
    .sort((a, b) => a.rate - b.rate)[0];
  const trainerInterpretation = `Trend direction: trainer delivery remains strong with ${totalSessions.toLocaleString()} sessions and ${avgSessionsPerTrainer.toLocaleString()} sessions per active trainer. Risk callout: ${
    lowestCompletion ? `${lowestCompletion.name} has the lowest completion rate (${lowestCompletion.rate.toLocaleString()}%).` : 'completion variance data is limited.'
  } Action: perform targeted schedule and coaching review for the lowest-completion cohort while preserving top-performer practices.`;
  return {
    executiveSummary: `${baseExecutive} Trainers handled ${totalSessions.toLocaleString()} sessions in the selected period.`,
    sectionTitle: 'Trainer Performance',
    sectionSummary: `Completion and cancellation outcomes indicate service delivery quality. ${activeTrainers.toLocaleString()} active trainers delivered an average of ${avgSessionsPerTrainer.toLocaleString()} sessions each.`,
    sectionParagraphs: [
      'This section explains trainer delivery consistency, not just total volume.',
      'Completion rates and cancellation levels directly influence member trust and retention.',
      'Average load per trainer helps identify workload imbalance and scheduling pressure.',
    ],
    highlights: ['Completion rate reflects schedule reliability and member satisfaction.', 'Cancellation trends help detect planning issues.'],
    whatThisMeans: ['Low completion rates may signal operational friction.', 'Balanced trainer load improves service consistency.'],
    recommendedActions: ['Coach low-performing schedules.', 'Adjust session allocation based on demand and completion trends.'],
    additionalMetrics: [
      { label: 'Active trainers in period', value: activeTrainers },
      { label: 'Avg sessions per trainer', value: avgSessionsPerTrainer },
    ],
    chartTitle: 'Trainer Completion Rate',
    chartSeries: trainerStats.map((r) => ({ label: String(r.trainerName ?? 'Unknown'), value: toNum(r.completionRatePct) })),
    chartInterpretation: trainerInterpretation,
    glossary,
  };
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

  const baseNarrative = buildReportNarrative(payload, reportType, params?.fromDate, params?.toDate);
  const reportNarrative = sanitizeNarrativeMap(
    await maybeEnhanceNarrativeWithAi(baseNarrative, payload, reportType, params?.fromDate, params?.toDate),
  );
  return maskReportForExport({ ...payload, meta, direct, reportNarrative });
}
