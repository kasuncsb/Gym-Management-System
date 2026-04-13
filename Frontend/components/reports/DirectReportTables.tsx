'use client';

import { Card } from '@/components/ui/SharedComponents';
import { cn } from '@/lib/utils';
import { reportSectionCard, reportTableBodyRow, reportTableCell, reportTableCellHead, reportTableHeadRow } from '@/components/reports/reportTheme';

type Trunc = Record<string, boolean | undefined>;

function truncNote(key: string, meta?: { directTruncated?: Trunc; directRowCap?: number }) {
    if (!meta?.directTruncated?.[key]) return null;
    return (
        <p className="text-amber-400/90 text-xs mb-2">
            List truncated — showing up to {meta.directRowCap ?? '…'} rows. Download PDF for the same cap.
        </p>
    );
}

function fmtDt(v: unknown) {
    if (v == null) return '—';
    const s = String(v);
    if (s.includes('T')) return s.slice(0, 19).replace('T', ' ');
    return s;
}

export function ReportMetaBar({ data }: { data: { meta?: { generatedAt?: string; directRowCap?: number; piiMasked?: boolean } } }) {
    const m = data.meta;
    if (!m?.generatedAt) return null;
    return (
        <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/50 px-4 py-3 space-y-1">
            <p className="text-zinc-400 text-xs">
                Generated {new Date(m.generatedAt).toLocaleString()}
            </p>
        </div>
    );
}

export function DirectReportTables({ data }: { data: any }) {
    const d = data.direct ?? {};
    const meta = data.meta;

    const hasAny =
        (d.payments?.length ?? 0) > 0 ||
        (d.visits?.length ?? 0) > 0 ||
        (d.newMemberRegistrations?.length ?? 0) > 0 ||
        (d.subscriptionsCreated?.length ?? 0) > 0 ||
        (d.equipmentEvents?.length ?? 0) > 0 ||
        (d.ptSessions?.length ?? 0) > 0;

    if (!hasAny) return null;

    return (
        <Card padding="lg" className={cn(reportSectionCard, 'border-red-500/15')}>
            <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500/80" aria-hidden />
                Detailed business records
            </h3>
            <p className="text-zinc-500 text-xs mb-4">Detailed records for operational review in the selected period.</p>

            {d.payments?.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-zinc-300 text-sm font-medium mb-2">Payments</h4>
                    {truncNote('payments', meta)}
                    <div className="max-h-72 overflow-auto overflow-x-auto">
                        <table className="w-full text-sm min-w-[640px]">
                            <thead>
                                <tr className={reportTableHeadRow}>
                                    <th className={cn(reportTableCellHead, 'pr-2')}>Date</th>
                                    <th className={cn(reportTableCellHead, 'text-right')}>Amount</th>
                                    <th className={cn(reportTableCellHead, 'px-2')}>Method</th>
                                    <th className={reportTableCellHead}>Member</th>
                                    <th className={reportTableCellHead}>Plan</th>
                                    <th className={reportTableCellHead}>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.payments.map((r: any, i: number) => (
                                    <tr key={i} className={reportTableBodyRow}>
                                        <td className={cn(reportTableCell, 'text-zinc-300 whitespace-nowrap')}>{r.paymentDate}</td>
                                        <td className={cn(reportTableCell, 'text-right text-white')}>Rs. {Number(r.amount).toLocaleString()}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400 capitalize px-2')}>{String(r.paymentMethod ?? '').replace('_', ' ')}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-300')}>{r.memberName ?? '—'}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400')}>{r.planName ?? '—'}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-500 text-xs')}>{r.receiptNumber ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {d.visits?.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-zinc-300 text-sm font-medium mb-2">Visits</h4>
                    {truncNote('visits', meta)}
                    <div className="max-h-72 overflow-auto overflow-x-auto">
                        <table className="w-full text-sm min-w-[520px]">
                            <thead>
                                <tr className={reportTableHeadRow}>
                                    <th className={reportTableCellHead}>Check-in</th>
                                    <th className={reportTableCellHead}>Member</th>
                                    <th className={cn(reportTableCellHead, 'text-right')}>Duration</th>
                                    <th className={reportTableCellHead}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.visits.map((r: any, i: number) => (
                                    <tr key={i} className={reportTableBodyRow}>
                                        <td className={cn(reportTableCell, 'text-zinc-300 whitespace-nowrap')}>{fmtDt(r.checkInAt)}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-300')}>{r.memberName ?? '—'}</td>
                                        <td className={cn(reportTableCell, 'text-right text-zinc-400')}>{r.durationMin != null ? `${r.durationMin} min` : '—'}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400 capitalize')}>{r.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {d.newMemberRegistrations?.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-zinc-300 text-sm font-medium mb-2">New member registrations</h4>
                    {truncNote('newMemberRegistrations', meta)}
                    <div className="max-h-72 overflow-auto overflow-x-auto">
                        <table className="w-full text-sm min-w-[480px]">
                            <thead>
                                <tr className={reportTableHeadRow}>
                                    <th className={reportTableCellHead}>Registered</th>
                                    <th className={reportTableCellHead}>Name</th>
                                    <th className={reportTableCellHead}>Email</th>
                                    <th className={reportTableCellHead}>Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.newMemberRegistrations.map((r: any, i: number) => (
                                    <tr key={i} className={reportTableBodyRow}>
                                        <td className={cn(reportTableCell, 'text-zinc-300 whitespace-nowrap')}>{fmtDt(r.registeredAt)}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-300')}>{r.fullName}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400 text-xs')}>{r.email}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-500')}>{r.memberCode ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {d.subscriptionsCreated?.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-zinc-300 text-sm font-medium mb-2">Subscriptions created</h4>
                    {truncNote('subscriptionsCreated', meta)}
                    <div className="max-h-72 overflow-auto overflow-x-auto">
                        <table className="w-full text-sm min-w-[560px]">
                            <thead>
                                <tr className={reportTableHeadRow}>
                                    <th className={reportTableCellHead}>Created</th>
                                    <th className={reportTableCellHead}>Member</th>
                                    <th className={reportTableCellHead}>Plan</th>
                                    <th className={reportTableCellHead}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.subscriptionsCreated.map((r: any, i: number) => (
                                    <tr key={i} className={reportTableBodyRow}>
                                        <td className={cn(reportTableCell, 'text-zinc-300 whitespace-nowrap')}>{fmtDt(r.createdAt)}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-300')}>{r.memberName ?? '—'}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400')}>{r.planName ?? '—'}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400 capitalize')}>{String(r.status ?? '').replace('_', ' ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {d.equipmentEvents?.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-zinc-300 text-sm font-medium mb-2">Equipment events</h4>
                    {truncNote('equipmentEvents', meta)}
                    <div className="max-h-72 overflow-auto overflow-x-auto">
                        <table className="w-full text-sm min-w-[560px]">
                            <thead>
                                <tr className={reportTableHeadRow}>
                                    <th className={reportTableCellHead}>At</th>
                                    <th className={reportTableCellHead}>Equipment</th>
                                    <th className={reportTableCellHead}>Type</th>
                                    <th className={reportTableCellHead}>Severity</th>
                                    <th className={reportTableCellHead}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.equipmentEvents.map((r: any, i: number) => (
                                    <tr key={i} className={cn(reportTableBodyRow, 'align-top')}>
                                        <td className={cn(reportTableCell, 'text-zinc-300 whitespace-nowrap')}>{fmtDt(r.createdAt)}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-300')}>{r.equipmentName ?? '—'}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400 capitalize')}>{String(r.eventType ?? '').replace('_', ' ')}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400 capitalize')}>{r.severity ?? '—'}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-500 text-xs max-w-xs')}>{r.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {d.ptSessions?.length > 0 && (
                <div className="mb-2">
                    <h4 className="text-zinc-300 text-sm font-medium mb-2">PT sessions</h4>
                    {truncNote('ptSessions', meta)}
                    <div className="max-h-72 overflow-auto overflow-x-auto">
                        <table className="w-full text-sm min-w-[480px]">
                            <thead>
                                <tr className={reportTableHeadRow}>
                                    <th className={reportTableCellHead}>Date</th>
                                    <th className={reportTableCellHead}>Time</th>
                                    <th className={reportTableCellHead}>Trainer</th>
                                    <th className={reportTableCellHead}>Member</th>
                                    <th className={reportTableCellHead}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.ptSessions.map((r: any, i: number) => (
                                    <tr key={i} className={reportTableBodyRow}>
                                        <td className={cn(reportTableCell, 'text-zinc-300')}>{r.sessionDate}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400')}>{r.startTime}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-300')}>{r.trainerName ?? '—'}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-300')}>{r.memberName ?? '—'}</td>
                                        <td className={cn(reportTableCell, 'text-zinc-400 capitalize')}>{r.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Card>
    );
}
