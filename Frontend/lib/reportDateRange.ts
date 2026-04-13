/** Keep in sync with Backend/src/utils/report-dates.ts */
export const MAX_REPORT_RANGE_DAYS = 366;
export const REPORT_HISTORY_YEARS = 10;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidYmd(s: string): boolean {
  const m = s.match(DATE_RE);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function todayLocalYmd(): string {
  const n = new Date();
  const y = n.getFullYear();
  const mo = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

export function reportDateInputMin(): string {
  const n = new Date();
  n.setFullYear(n.getFullYear() - REPORT_HISTORY_YEARS);
  const y = n.getFullYear();
  const mo = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function daysBetweenInclusive(fromYmd: string, toYmd: string): number {
  const m0 = fromYmd.match(DATE_RE);
  const m1 = toYmd.match(DATE_RE);
  if (!m0 || !m1) return 0;
  const a = new Date(Number(m0[1]), Number(m0[2]) - 1, Number(m0[3])).getTime();
  const b = new Date(Number(m1[1]), Number(m1[2]) - 1, Number(m1[3])).getTime();
  return Math.floor((b - a) / 86_400_000) + 1;
}

export function validateReportDateRange(from: string, to: string): { ok: true } | { ok: false; message: string } {
  const today = todayLocalYmd();
  const minYmd = reportDateInputMin();

  if (from && !isValidYmd(from)) {
    return { ok: false, message: 'From date must be a valid date (YYYY-MM-DD).' };
  }
  if (to && !isValidYmd(to)) {
    return { ok: false, message: 'To date must be a valid date (YYYY-MM-DD).' };
  }
  if (from) {
    if (from > today) return { ok: false, message: 'From date cannot be in the future.' };
    if (from < minYmd) return { ok: false, message: `From date cannot be more than ${REPORT_HISTORY_YEARS} years ago.` };
  }
  if (to) {
    if (to > today) return { ok: false, message: 'To date cannot be in the future.' };
    if (to < minYmd) return { ok: false, message: `To date cannot be more than ${REPORT_HISTORY_YEARS} years ago.` };
  }
  if (from && to) {
    if (from > to) return { ok: false, message: 'From date must be on or before to date.' };
    const span = daysBetweenInclusive(from, to);
    if (span > MAX_REPORT_RANGE_DAYS) {
      return { ok: false, message: `Date range cannot exceed ${MAX_REPORT_RANGE_DAYS} days.` };
    }
  }
  return { ok: true };
}
