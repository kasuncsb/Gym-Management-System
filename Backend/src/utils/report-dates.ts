import { errors } from './errors.js';

/** Inclusive range cap (matches typical annual reporting). */
export const MAX_REPORT_RANGE_DAYS = 366;

/** Earliest selectable report start (rolling window). */
export const REPORT_HISTORY_YEARS = 10;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Calendar YYYY-MM-DD; rejects invalid calendar dates. */
export function parseIsoDateOnly(s: string): { y: number; m: number; d: number } | null {
  const m = s.match(DATE_RE);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return { y, m: mo, d };
}

/** Local calendar today as YYYY-MM-DD (aligns with gym operators picking dates in the UI). */
export function todayLocalYmd(): string {
  const n = new Date();
  const y = n.getFullYear();
  const mo = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function minAllowedYmd(): string {
  const n = new Date();
  n.setFullYear(n.getFullYear() - REPORT_HISTORY_YEARS);
  const y = n.getFullYear();
  const mo = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function daysBetweenInclusive(fromYmd: string, toYmd: string): number {
  const a = parseIsoDateOnly(fromYmd);
  const b = parseIsoDateOnly(toYmd);
  if (!a || !b) return 0;
  const t0 = new Date(a.y, a.m - 1, a.d).getTime();
  const t1 = new Date(b.y, b.m - 1, b.d).getTime();
  return Math.floor((t1 - t0) / 86_400_000) + 1;
}

/**
 * Throws badRequest if fromDate / toDate are invalid, out of bounds, or range too wide.
 * Empty strings are treated as unset (defaults apply in SQL).
 */
export function assertValidReportDates(params: { fromDate?: string; toDate?: string }): void {
  const today = todayLocalYmd();
  const minYmd = minAllowedYmd();

  const from = params.fromDate?.trim() || undefined;
  const to = params.toDate?.trim() || undefined;

  if (from) {
    if (!parseIsoDateOnly(from)) throw errors.badRequest('fromDate must be a valid date (YYYY-MM-DD)');
    if (from > today) throw errors.badRequest('fromDate cannot be in the future');
    if (from < minYmd) throw errors.badRequest(`fromDate cannot be more than ${REPORT_HISTORY_YEARS} years ago`);
  }
  if (to) {
    if (!parseIsoDateOnly(to)) throw errors.badRequest('toDate must be a valid date (YYYY-MM-DD)');
    if (to > today) throw errors.badRequest('toDate cannot be in the future');
    if (to < minYmd) throw errors.badRequest(`toDate cannot be more than ${REPORT_HISTORY_YEARS} years ago`);
  }
  if (from && to) {
    if (from > to) throw errors.badRequest('fromDate must be on or before toDate');
    const span = daysBetweenInclusive(from, to);
    if (span > MAX_REPORT_RANGE_DAYS) {
      throw errors.badRequest(`Date range cannot exceed ${MAX_REPORT_RANGE_DAYS} days`);
    }
  }
}
