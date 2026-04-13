import PDFDocument from 'pdfkit';

function cell(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 120);
  return String(v).replace(/\s+/g, ' ').slice(0, 200);
}

/** PDFKit default page inner height ~745 for A4 margin 48 */
const PAGE_TOP = 48;
const PAGE_BOTTOM = 780;
const MARGIN = 48;
const CONTENT_W = 515;

export function buildReportPdf(data: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, info: { Title: `Gym report — ${data.type}` } });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = PAGE_TOP;

    const newPage = () => {
      doc.addPage();
      y = PAGE_TOP;
    };

    const ensure = (h: number) => {
      if (y + h > PAGE_BOTTOM) newPage();
    };

    const heading = (t: string, size = 14) => {
      ensure(24);
      doc.font('Helvetica-Bold').fontSize(size).text(t, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 10;
      doc.font('Helvetica').fontSize(9);
    };

    const para = (t: string) => {
      ensure(20);
      doc.font('Helvetica').fontSize(9).text(t, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 6;
    };

    const type = String(data.type ?? 'report');
    heading(`Operations report: ${type}`, 16);
    para(`Generated (UTC): ${(data.meta as { generatedAt?: string } | undefined)?.generatedAt ?? new Date().toISOString()}`);
    if (data.fromDate || data.toDate) {
      para(`Period: ${data.fromDate ?? '…'} → ${data.toDate ?? '…'}`);
    }
    const cap = (data.meta as { directRowCap?: number } | undefined)?.directRowCap;
    if (cap != null) para(`Direct row cap per section: ${cap} (see meta.directTruncated if truncated).`);

    y += 6;
    heading('Summary KPIs', 11);
    const kpiKeys = ['monthlyRevenue', 'activeMembers', 'visitsInRange', 'openEquipmentIncidents'] as const;
    for (const k of kpiKeys) {
      if (k in data) para(`${k}: ${cell(data[k])}`);
    }
    const extraNumeric = [
      'totalRevenueInRange',
      'paymentCountInRange',
      'averagePaymentInRange',
      'newMembers',
      'subscriptionsCreatedInRange',
      'activeSubscriptionsTotal',
      'avgVisitsPerDayInRange',
      'incidentsInRange',
      'ptSessionsInRange',
    ] as const;
    for (const k of extraNumeric) {
      if (k in data) para(`${k}: ${cell(data[k])}`);
    }

    y += 4;

    function tableBlock(title: string, headers: string[], rows: string[][]) {
      if (rows.length === 0) return;
      heading(title, 11);
      const colCount = headers.length;
      const colW = CONTENT_W / colCount;
      const rowH = 11;
      const headerH = 14;

      ensure(headerH + 8);
      doc.font('Helvetica-Bold').fontSize(7);
      let hx = MARGIN;
      for (let i = 0; i < colCount; i++) {
        doc.text(headers[i] ?? '', hx, y, { width: colW - 4 });
        hx += colW;
      }
      y += headerH;
      doc.font('Helvetica').fontSize(7);

      for (const row of rows) {
        ensure(rowH + 4);
        let rx = MARGIN;
        for (let i = 0; i < colCount; i++) {
          doc.text(row[i] ?? '', rx, y, { width: colW - 4, lineBreak: true });
          rx += colW;
        }
        y += rowH;
      }
      y += 8;
    }

    function objectRows(arr: unknown[], pick: string[]): string[][] {
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => {
        const o = item as Record<string, unknown>;
        return pick.map((k) => cell(o[k]));
      });
    }

    if (Array.isArray(data.byMethod)) {
      tableBlock(
        'Revenue by payment method',
        ['Method', 'Count', 'Total', '% revenue'],
        objectRows(data.byMethod, ['method', 'count', 'total', 'pctOfTotalRevenue']),
      );
    }
    if (Array.isArray(data.byPlan) && type === 'revenue') {
      tableBlock('Revenue by plan', ['Plan', 'Total'], objectRows(data.byPlan, ['planName', 'total']));
    }
    if (Array.isArray(data.byPlan) && type === 'membership') {
      tableBlock('Active subscriptions by plan', ['Plan', 'Count'], objectRows(data.byPlan, ['planName', 'count']));
    }
    if (Array.isArray(data.byStatus)) {
      tableBlock(
        'Subscriptions by status (created in range)',
        ['Status', 'Count', '%'],
        objectRows(data.byStatus, ['status', 'count', 'pctOfCreated']),
      );
    }
    if (Array.isArray(data.daily)) {
      tableBlock('Daily visits', ['Date', 'Visits', 'Avg duration (min)'], objectRows(data.daily, ['date', 'count', 'avgDurationMin']));
    }
    if (Array.isArray(data.byHour)) {
      tableBlock('Visits by hour', ['Hour', 'Count'], objectRows(data.byHour, ['hour', 'count']));
    }
    if (Array.isArray(data.bySeverity)) {
      tableBlock('Equipment events by severity/status', ['Severity', 'Status', 'Count'], objectRows(data.bySeverity, ['severity', 'status', 'count']));
    }
    if (Array.isArray(data.byEquipment)) {
      tableBlock('Equipment by incident count', ['Equipment', 'Count'], objectRows(data.byEquipment, ['equipmentName', 'count']));
    }
    if (Array.isArray(data.trainerStats)) {
      tableBlock(
        'Trainer session stats',
        ['Trainer', 'Total', 'Completed', 'Cancelled', 'Completion %'],
        objectRows(data.trainerStats, ['trainerName', 'total', 'completed', 'cancelled', 'completionRatePct']),
      );
    }

    const direct = data.direct as Record<string, unknown> | undefined;
    if (direct && typeof direct === 'object') {
      heading('Direct data (row-level)', 12);
      const trunc = (data.meta as { directTruncated?: Record<string, boolean> } | undefined)?.directTruncated ?? {};
      if (Array.isArray(direct.payments)) {
        if (trunc.payments) para('Payments list: truncated to cap.');
        tableBlock(
          'Payment lines',
          ['Date', 'Amount', 'Method', 'Member', 'Plan', 'Receipt', 'Status'],
          objectRows(direct.payments, [
            'paymentDate',
            'amount',
            'paymentMethod',
            'memberName',
            'planName',
            'receiptNumber',
            'status',
          ]),
        );
      }
      if (Array.isArray(direct.visits)) {
        if (trunc.visits) para('Visits list: truncated to cap.');
        tableBlock(
          'Visit lines',
          ['Check-in', 'Member', 'Duration', 'Status'],
          objectRows(direct.visits, ['checkInAt', 'memberName', 'durationMin', 'status']),
        );
      }
      if (Array.isArray(direct.newMemberRegistrations)) {
        if (trunc.newMemberRegistrations) para('New member registrations: truncated to cap.');
        tableBlock(
          'New member registrations',
          ['Registered', 'Name', 'Email', 'Code'],
          objectRows(direct.newMemberRegistrations, ['registeredAt', 'fullName', 'email', 'memberCode']),
        );
      }
      if (Array.isArray(direct.subscriptionsCreated)) {
        if (trunc.subscriptionsCreated) para('Subscriptions created: truncated to cap.');
        tableBlock(
          'Subscriptions created',
          ['Created', 'Member', 'Plan', 'Status', 'Start', 'End'],
          objectRows(direct.subscriptionsCreated, ['createdAt', 'memberName', 'planName', 'status', 'startDate', 'endDate']),
        );
      }
      if (Array.isArray(direct.equipmentEvents)) {
        if (trunc.equipmentEvents) para('Equipment events: truncated to cap.');
        tableBlock(
          'Equipment event lines',
          ['At', 'Equipment', 'Type', 'Severity', 'Status', 'Description'],
          objectRows(direct.equipmentEvents, ['createdAt', 'equipmentName', 'eventType', 'severity', 'status', 'description']),
        );
      }
      if (Array.isArray(direct.ptSessions)) {
        if (trunc.ptSessions) para('PT sessions: truncated to cap.');
        tableBlock(
          'PT session lines',
          ['Date', 'Time', 'Trainer', 'Member', 'Status'],
          objectRows(direct.ptSessions, ['sessionDate', 'startTime', 'trainerName', 'memberName', 'status']),
        );
      }
    }

    doc.end();
  });
}
