import PDFDocument from 'pdfkit';

/** Aligns with app dark theme (zinc + red accent). */
const THEME = {
  pageBg: '#0f0f12',
  headerBg: '#18181b',
  accent: '#ef4444',
  text: '#fafafa',
  muted: '#a1a1aa',
  rowAlt: '#27272a',
};

function cell(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 120);
  return String(v).replace(/\s+/g, ' ').slice(0, 200);
}

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

    const paintPageBackground = () => {
      doc.save();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(THEME.pageBg);
      doc.restore();
      doc.fillColor(THEME.text);
    };

    const newPage = () => {
      doc.addPage();
      paintPageBackground();
      y = PAGE_TOP;
      doc.save();
      doc.strokeColor(THEME.accent).opacity(0.85).lineWidth(2).moveTo(MARGIN, y).lineTo(doc.page.width - MARGIN, y).stroke();
      doc.opacity(1);
      doc.restore();
      y += 10;
    };

    const ensure = (h: number) => {
      if (y + h > PAGE_BOTTOM) newPage();
    };

    const drawHero = () => {
      doc.save();
      doc.rect(0, 0, doc.page.width, 82).fill(THEME.headerBg);
      doc.fillColor(THEME.accent).font('Helvetica-Bold').fontSize(17).text('PowerWorld · Operations report', MARGIN, 26, { width: CONTENT_W });
      const type = String(data.type ?? 'report');
      doc.fillColor(THEME.text).font('Helvetica-Bold').fontSize(11).text(`Type: ${type}`, MARGIN, 48, { width: CONTENT_W });
      const period =
        data.fromDate || data.toDate ? `Period: ${data.fromDate ?? '…'} → ${data.toDate ?? '…'}` : 'Period: default (last30 days where applicable)';
      doc.fillColor(THEME.muted).font('Helvetica').fontSize(8).text(period, MARGIN, 64, { width: CONTENT_W });
      doc.fillColor(THEME.muted).font('Helvetica').fontSize(7).text('Member emails are partially masked for privacy.', MARGIN, 74, { width: CONTENT_W });
      doc.restore();
      y = 96;
    };

    const heading = (t: string, size = 11) => {
      ensure(22);
      doc.fillColor(THEME.accent).font('Helvetica-Bold').fontSize(size).text(t, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 8;
      doc.fillColor(THEME.text).font('Helvetica').fontSize(9);
    };

    const para = (t: string, muted = false) => {
      ensure(18);
      doc.fillColor(muted ? THEME.muted : THEME.text).font('Helvetica').fontSize(9).text(t, MARGIN, y, { width: CONTENT_W });
      y = doc.y + 5;
      doc.fillColor(THEME.text);
    };

    paintPageBackground();
    drawHero();

    para(
      `Generated (UTC): ${(data.meta as { generatedAt?: string } | undefined)?.generatedAt ?? new Date().toISOString()}`,
      true,
    );
    const cap = (data.meta as { directRowCap?: number } | undefined)?.directRowCap;
    if (cap != null) para(`Detailed section cap: ${cap} records per table.`, true);

    y += 4;
    heading('Business Summary', 12);
    const kpiRows: Array<{ key: string; label: string }> = [
      { key: 'monthlyRevenue', label: 'Monthly revenue' },
      { key: 'activeMembers', label: 'Active members' },
      { key: 'visitsInRange', label: 'Visits in selected period' },
      { key: 'openEquipmentIncidents', label: 'Open equipment incidents' },
    ];
    for (const kpi of kpiRows) {
      if (kpi.key in data) para(`${kpi.label}: ${cell(data[kpi.key])}`);
    }
    const extraRows: Array<{ key: string; label: string }> = [
      { key: 'totalRevenueInRange', label: 'Revenue in selected period' },
      { key: 'paymentCountInRange', label: 'Payment count' },
      { key: 'averagePaymentInRange', label: 'Average payment value' },
      { key: 'newMembers', label: 'New members in period' },
      { key: 'subscriptionsCreatedInRange', label: 'Subscriptions created in period' },
      { key: 'activeSubscriptionsTotal', label: 'Total active subscriptions' },
      { key: 'avgVisitsPerDayInRange', label: 'Average daily visits' },
      { key: 'incidentsInRange', label: 'Equipment incidents in period' },
      { key: 'ptSessionsInRange', label: 'PT sessions in period' },
    ];
    for (const extra of extraRows) {
      if (extra.key in data) para(`${extra.label}: ${cell(data[extra.key])}`);
    }

    y += 4;

    function tableBlock(title: string, headers: string[], rows: string[][]) {
      if (rows.length === 0) return;
      heading(title, 11);
      const colCount = headers.length;
      const colW = CONTENT_W / colCount;
      const rowH = 12;
      const headerH = 16;

      ensure(headerH + 10);
      doc.save();
      doc.rect(MARGIN, y - 2, CONTENT_W, headerH).fill(THEME.rowAlt);
      doc.fillColor(THEME.text).font('Helvetica-Bold').fontSize(7);
      let hx = MARGIN + 3;
      for (let i = 0; i < colCount; i++) {
        doc.text(headers[i] ?? '', hx, y + 3, { width: colW - 6 });
        hx += colW;
      }
      doc.restore();
      y += headerH;
      doc.font('Helvetica').fontSize(7);

      let ri = 0;
      for (const row of rows) {
        ensure(rowH + 6);
        if (ri % 2 === 1) {
          doc.save();
          doc.rect(MARGIN, y - 1, CONTENT_W, rowH).fill('#1c1c20');
          doc.restore();
        }
        doc.fillColor(THEME.text);
        let rx = MARGIN + 3;
        for (let i = 0; i < colCount; i++) {
          doc.text(row[i] ?? '', rx, y + 2, { width: colW - 6, lineBreak: true });
          rx += colW;
        }
        y += rowH;
        ri++;
      }
      y += 10;
    }

    function objectRows(arr: unknown[], pick: string[]): string[][] {
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => {
        const o = item as Record<string, unknown>;
        return pick.map((k) => cell(o[k]));
      });
    }

    const type = String(data.type ?? 'report');

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
      heading('Detailed Business Breakdown', 12);
      const trunc = (data.meta as { directTruncated?: Record<string, boolean> } | undefined)?.directTruncated ?? {};
      if (Array.isArray(direct.payments)) {
        if (trunc.payments) para('Payments: list truncated to cap.', true);
        tableBlock(
          'Payment lines',
          ['Date', 'Amount', 'Method', 'Member', 'Plan', 'Receipt', 'Status'],
          objectRows(direct.payments, ['paymentDate', 'amount', 'paymentMethod', 'memberName', 'planName', 'receiptNumber', 'status']),
        );
      }
      if (Array.isArray(direct.visits)) {
        if (trunc.visits) para('Visits: list truncated to cap.', true);
        tableBlock('Visit lines', ['Check-in', 'Member', 'Duration', 'Status'], objectRows(direct.visits, ['checkInAt', 'memberName', 'durationMin', 'status']));
      }
      if (Array.isArray(direct.newMemberRegistrations)) {
        if (trunc.newMemberRegistrations) para('New registrations: truncated to cap.', true);
        tableBlock(
          'New member registrations',
          ['Registered', 'Name', 'Email', 'Code'],
          objectRows(direct.newMemberRegistrations, ['registeredAt', 'fullName', 'email', 'memberCode']),
        );
      }
      if (Array.isArray(direct.subscriptionsCreated)) {
        if (trunc.subscriptionsCreated) para('Subscriptions created: truncated to cap.', true);
        tableBlock(
          'Subscriptions created',
          ['Created', 'Member', 'Plan', 'Status', 'Start', 'End'],
          objectRows(direct.subscriptionsCreated, ['createdAt', 'memberName', 'planName', 'status', 'startDate', 'endDate']),
        );
      }
      if (Array.isArray(direct.equipmentEvents)) {
        if (trunc.equipmentEvents) para('Equipment events: truncated to cap.', true);
        tableBlock(
          'Equipment event lines',
          ['At', 'Equipment', 'Type', 'Severity', 'Status', 'Description'],
          objectRows(direct.equipmentEvents, ['createdAt', 'equipmentName', 'eventType', 'severity', 'status', 'description']),
        );
      }
      if (Array.isArray(direct.ptSessions)) {
        if (trunc.ptSessions) para('PT sessions: truncated to cap.', true);
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
