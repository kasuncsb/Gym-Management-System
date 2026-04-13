/**
 * Redact PII in report payloads returned to clients and embedded in PDFs.
 */

function repeat(ch: string, n: number): string {
  if (n <= 0) return '';
  return new Array(n).fill(ch).join('');
}

function maskKeepEnds(raw: string, keepStart: number, keepEnd: number, maskChar = '*'): string {
  const s = String(raw).trim();
  if (!s) return '—';
  const total = s.length;
  const start = Math.max(0, Math.min(keepStart, total));
  const end = Math.max(0, Math.min(keepEnd, total - start));
  const maskedCount = Math.max(0, total - start - end);
  if (maskedCount === 0) return s;
  return `${s.slice(0, start)}${repeat(maskChar, maskedCount)}${s.slice(total - end)}`;
}

function maskEmail(raw: string): string {
  const s = String(raw).trim();
  const at = s.indexOf('@');
  if (at <= 0) return '***';
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (!domain) return '***';
  const keepEnd = local.length >= 3 ? 1 : 0;
  const maskedLocal = maskKeepEnds(local, 1, keepEnd, '*');
  return `${maskedLocal}@${domain}`;
}

function maskIdLike(raw: string): string {
  const s = String(raw).trim();
  if (!s) return '—';
  if (s.length <= 4) return repeat('*', Math.max(4, s.length));
  const last4 = s.slice(-4);
  return `${repeat('*', 8)}${last4}`;
}

function maskReference(raw: string): string {
  const s = String(raw).trim();
  if (!s) return '—';
  if (s.length <= 4) return repeat('*', Math.max(4, s.length));
  const last4 = s.slice(-4);
  return `${repeat('*', 6)}${last4}`;
}

function maskScalar(key: string, val: unknown): unknown {
  if (val == null) return val;
  if (typeof val !== 'string') return val;

  switch (key) {
    case 'memberEmail':
    case 'email':
      return maskEmail(val);
    case 'memberId':
    case 'userId':
    case 'personId':
    case 'subscriptionId':
    case 'id':
      return maskIdLike(val);
    case 'referenceNumber':
    case 'invoiceNumber':
    case 'receiptNumber':
    case 'memberCode':
      return maskReference(val);
    default:
      return val;
  }
}

function maskRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = maskScalar(k, v);
  }
  return out;
}

function maskDirect(direct: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [section, val] of Object.entries(direct)) {
    if (Array.isArray(val)) {
      out[section] = val.map((item) =>
        item && typeof item === 'object' && !Array.isArray(item) ? maskRow(item as Record<string, unknown>) : item,
      );
    } else {
      out[section] = val;
    }
  }
  return out;
}

function maskTrainerStats(rows: unknown): unknown {
  if (!Array.isArray(rows)) return rows;
  return rows.map((r) => (r && typeof r === 'object' ? maskRow(r as Record<string, unknown>) : r));
}

/**
 * Apply masking to API/PDF-safe report objects (mutates copies only).
 */
export function maskReportForExport(data: Record<string, unknown>): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...data };

  if (copy.direct && typeof copy.direct === 'object' && !Array.isArray(copy.direct)) {
    copy.direct = maskDirect(copy.direct as Record<string, unknown>);
  }
  if (Array.isArray(copy.trainerStats)) {
    copy.trainerStats = maskTrainerStats(copy.trainerStats);
  }

  const prevMeta = (copy.meta && typeof copy.meta === 'object' ? copy.meta : {}) as Record<string, unknown>;
  copy.meta = { ...prevMeta, piiMasked: true };

  return copy;
}
