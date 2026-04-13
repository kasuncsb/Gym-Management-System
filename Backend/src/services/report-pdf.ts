import PDFDocument from 'pdfkit';

const THEME = {
  pageBg: '#0f0f12',
  headerBg: '#18181b',
  panelBg: '#16161b',
  panelBorder: '#2a2a31',
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
    const type = String(data.type ?? 'report');
    const narrative = (data.reportNarrative as Record<string, unknown> | undefined) ?? {};

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
      doc.fillColor(THEME.accent).font('Helvetica-Bold').fontSize(17).text('PowerWorld · Business Report', MARGIN, 26, { width: CONTENT_W });
      doc.fillColor(THEME.text).font('Helvetica-Bold').fontSize(11).text(`Type: ${type}`, MARGIN, 48, { width: CONTENT_W });
      const period =
        data.fromDate || data.toDate ? `Period: ${data.fromDate ?? 'Start'} → ${data.toDate ?? 'End'}` : 'Period: Last 30 days';
      doc.fillColor(THEME.muted).font('Helvetica').fontSize(8).text(period, MARGIN, 64, { width: CONTENT_W });
      doc.restore();
      y = 96;
    };

    const heading = (t: string, size = 12) => {
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

    const bullets = (items: string[]) => {
      for (const item of items.filter(Boolean)) {
        ensure(18);
        doc.fillColor(THEME.text).font('Helvetica').fontSize(9).text(`• ${item}`, MARGIN + 8, y, { width: CONTENT_W - 8 });
        y = doc.y + 4;
      }
    };

    const sectionPanel = (title: string, body: () => void) => {
      ensure(56);
      heading(title, 12);
      const startY = y - 2;
      doc.save();
      doc.roundedRect(MARGIN - 6, startY - 4, CONTENT_W + 12, 6).fill(THEME.panelBg);
      doc.restore();
      body();
      y += 6;
    };

    const drawKpiGrid = (rows: Array<{ label: string; value: string }>) => {
      const cols = 2;
      const cardW = (CONTENT_W - 12) / cols;
      const cardH = 48;
      rows.forEach((row, idx) => {
        const col = idx % cols;
        if (col === 0) ensure(cardH + 8);
        const rowIdx = Math.floor(idx / cols);
        const x = MARGIN + col * (cardW + 12);
        const cy = y + rowIdx * (cardH + 8);
        doc.save();
        doc.roundedRect(x, cy, cardW, cardH, 4).fillAndStroke(THEME.panelBg, THEME.panelBorder);
        doc.restore();
        doc.fillColor(THEME.muted).font('Helvetica').fontSize(8).text(row.label, x + 8, cy + 8, { width: cardW - 16 });
        doc.fillColor(THEME.text).font('Helvetica-Bold').fontSize(12).text(row.value, x + 8, cy + 22, { width: cardW - 16 });
      });
      y += Math.ceil(rows.length / cols) * (cardH + 8) + 4;
    };

    const drawBarChart = (title: string, series: Array<{ label: string; value: number }>, valueSuffix = '') => {
      if (!series.length) return;
      sectionPanel(title, () => {
        const max = Math.max(...series.map((s) => s.value), 1);
        const chartX = MARGIN + 6;
        const chartW = CONTENT_W - 12;
        const barH = 12;
        for (const item of series.slice(0, 8)) {
          ensure(22);
          doc.fillColor(THEME.muted).font('Helvetica').fontSize(8).text(item.label, chartX, y + 2, { width: 180 });
          const bw = Math.max(2, (item.value / max) * (chartW - 220));
          doc.save();
          doc.rect(chartX + 190, y + 3, chartW - 220, 8).fill('#1f1f25');
          doc.rect(chartX + 190, y + 3, bw, 8).fill(THEME.accent);
          doc.restore();
          doc.fillColor(THEME.text).font('Helvetica-Bold').fontSize(8).text(`${Math.round(item.value)}${valueSuffix}`, chartX + chartW - 30, y + 2, { width: 40, align: 'right' });
          y += barH + 6;
        }
      });
    };

    const tableBlock = (title: string, headers: string[], rows: string[][]) => {
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
        doc.text(headers[i] ?? '', hx, y + 3, { width: colW - 6, align: i === 0 ? 'left' : 'right' });
        hx += colW;
      }
      doc.restore();
      y += headerH;
      doc.font('Helvetica').fontSize(7);
      let ri = 0;
      for (const row of rows.slice(0, 24)) {
        ensure(rowH + 6);
        if (ri % 2 === 1) {
          doc.save();
          doc.rect(MARGIN, y - 1, CONTENT_W, rowH).fill('#1c1c20');
          doc.restore();
        }
        doc.fillColor(THEME.text);
        let rx = MARGIN + 3;
        for (let i = 0; i < colCount; i++) {
          doc.text(row[i] ?? '', rx, y + 2, { width: colW - 6, align: i === 0 ? 'left' : 'right', lineBreak: true });
          rx += colW;
        }
        y += rowH;
        ri++;
      }
      y += 10;
    };

    const objectRows = (arr: unknown[], pick: string[]): string[][] => {
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => {
        const o = item as Record<string, unknown>;
        return pick.map((k) => cell(o[k]));
      });
    };

    paintPageBackground();
    drawHero();

    para(`Generated (UTC): ${(data.meta as { generatedAt?: string } | undefined)?.generatedAt ?? new Date().toISOString()}`, true);
    sectionPanel('Executive Summary', () => {
      para(String(narrative.executiveSummary ?? 'This report summarizes business performance for the selected time frame.'));
      const high = (Array.isArray(narrative.highlights) ? narrative.highlights : []) as string[];
      bullets(high);
    });

    heading('KPI Snapshot');
    drawKpiGrid([
      { label: 'Monthly revenue', value: `Rs. ${Math.round(Number(data.monthlyRevenue ?? 0)).toLocaleString()}` },
      { label: 'Active members', value: Math.round(Number(data.activeMembers ?? 0)).toLocaleString() },
      { label: 'Visits in period', value: Math.round(Number(data.visitsInRange ?? 0)).toLocaleString() },
      { label: 'Open incidents', value: Math.round(Number(data.openEquipmentIncidents ?? 0)).toLocaleString() },
    ]);

    sectionPanel(String(narrative.sectionTitle ?? 'Section Analysis'), () => {
      para(String(narrative.sectionSummary ?? 'Performance details are shown below with trends and supporting evidence.'));
      const sectionParagraphs = (Array.isArray(narrative.sectionParagraphs) ? narrative.sectionParagraphs : []) as string[];
      for (const p of sectionParagraphs.slice(0, 4)) {
        para(p, true);
      }
      heading('What this means', 10);
      bullets(((Array.isArray(narrative.whatThisMeans) ? narrative.whatThisMeans : []) as string[]).slice(0, 4));
      heading('Recommended actions', 10);
      bullets(((Array.isArray(narrative.recommendedActions) ? narrative.recommendedActions : []) as string[]).slice(0, 4));
    });

    const additionalMetrics = (Array.isArray(narrative.additionalMetrics) ? narrative.additionalMetrics : []) as Array<Record<string, unknown>>;
    if (additionalMetrics.length) {
      heading('Additional Metrics', 11);
      const metricRows = additionalMetrics.map((m) => ({
        label: String(m.label ?? 'Metric'),
        value: String(Math.round(Number(m.value ?? 0)).toLocaleString()),
      }));
      drawKpiGrid(metricRows);
    }

    const chartSeries = (Array.isArray(narrative.chartSeries) ? narrative.chartSeries : []) as Array<Record<string, unknown>>;
    drawBarChart(
      String(narrative.chartTitle ?? 'Performance chart'),
      chartSeries.map((s) => ({ label: String(s.label ?? 'Item'), value: Number(s.value ?? 0) })),
      type === 'trainer' ? '%' : '',
    );

    if (Array.isArray(data.byMethod)) {
      para('The following table provides a detailed revenue split by payment channel for the selected timeframe.', true);
      tableBlock('Revenue by payment method', ['Method', 'Count', 'Total', '%'], objectRows(data.byMethod, ['method', 'count', 'total', 'pctOfTotalRevenue']));
    }
    if (Array.isArray(data.byPlan) && type === 'revenue') {
      para('Plan-level revenue distribution helps identify where recurring value is concentrated.', true);
      tableBlock('Revenue by plan', ['Plan', 'Total'], objectRows(data.byPlan, ['planName', 'total']));
    }
    if (Array.isArray(data.byPlan) && type === 'membership') {
      para('Active subscriptions by plan show demand preference and retention strength by product type.', true);
      tableBlock('Active subscriptions by plan', ['Plan', 'Count'], objectRows(data.byPlan, ['planName', 'count']));
    }
    if (Array.isArray(data.byStatus)) {
      para('Status distribution indicates how many subscriptions are active, pending, or at risk in this period.', true);
      tableBlock(
        'Subscriptions by status (created in range)',
        ['Status', 'Count', '%'],
        objectRows(data.byStatus, ['status', 'count', 'pctOfCreated']),
      );
    }
    if (Array.isArray(data.daily)) {
      para('Daily visit trend helps evaluate consistency of member engagement across the period.', true);
      tableBlock('Daily visits', ['Date', 'Visits', 'Avg duration (min)'], objectRows(data.daily, ['date', 'count', 'avgDurationMin']));
    }
    if (Array.isArray(data.byHour)) {
      para('Hourly distribution highlights peak load windows that affect staffing and floor capacity.', true);
      tableBlock('Visits by hour', ['Hour', 'Count'], objectRows(data.byHour, ['hour', 'count']));
    }
    if (Array.isArray(data.bySeverity)) {
      para('Severity/status split indicates current maintenance risk and incident handling effectiveness.', true);
      tableBlock('Equipment events by severity/status', ['Severity', 'Status', 'Count'], objectRows(data.bySeverity, ['severity', 'status', 'count']));
    }
    if (Array.isArray(data.byEquipment)) {
      para('Equipment-level counts show which assets create the highest operational overhead.', true);
      tableBlock('Equipment by incident count', ['Equipment', 'Count'], objectRows(data.byEquipment, ['equipmentName', 'count']));
    }
    if (Array.isArray(data.trainerStats)) {
      para('Trainer delivery metrics compare session volume, completion quality, and cancellations.', true);
      tableBlock(
        'Trainer session stats',
        ['Trainer', 'Total', 'Completed', 'Cancelled', 'Completion %'],
        objectRows(data.trainerStats, ['trainerName', 'total', 'completed', 'cancelled', 'completionRatePct']),
      );
    }
    if (Array.isArray(data.byCategory)) {
      para('Category split provides a top-level view of where inventory volume and low-stock exposure are concentrated.', true);
      tableBlock(
        'Inventory by category',
        ['Category', 'Items', 'Total stock', 'Low-stock items'],
        objectRows(data.byCategory, ['category', 'itemCount', 'totalStock', 'lowStockCount']),
      );
    }
    if (Array.isArray(data.txnByType)) {
      para('Transaction mix shows how stock changed through restocks, sales, adjustments, and waste.', true);
      tableBlock(
        'Inventory transactions by type',
        ['Type', 'Transactions', 'Units moved', 'Net change'],
        objectRows(data.txnByType, ['txnType', 'txnCount', 'qtyMoved', 'netQtyChange']),
      );
    }
    if (Array.isArray(data.lowStockItems)) {
      para('Low-stock list identifies items closest to stock-out against their reorder levels.', true);
      tableBlock(
        'Low-stock items',
        ['Item', 'Category', 'In stock', 'Reorder at'],
        objectRows(data.lowStockItems, ['name', 'category', 'qtyInStock', 'reorderThreshold']),
      );
    }
    if (Array.isArray(data.topMovementItems)) {
      para('High-movement items indicate where procurement planning has the highest impact.', true);
      tableBlock(
        'Top movement items',
        ['Item', 'Category', 'Transactions', 'Units moved'],
        objectRows(data.topMovementItems, ['itemName', 'category', 'transactionCount', 'qtyMoved']),
      );
    }

    heading('Glossary', 11);
    const glossary = (Array.isArray(narrative.glossary) ? narrative.glossary : []) as Array<Record<string, unknown>>;
    for (const item of glossary.slice(0, 6)) {
      para(`${String(item.term ?? '')}: ${String(item.meaning ?? '')}`, true);
    }

    doc.end();
  });
}
