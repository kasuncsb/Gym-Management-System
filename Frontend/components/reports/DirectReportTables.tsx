'use client';

import { Card } from '@/components/ui/SharedComponents';

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

export function ReportMetaBar({ data }: { data: { meta?: { generatedAt?: string; directRowCap?: number } } }) {
    const m = data.meta;
    if (!m?.generatedAt) return null;
    return (
        <p className="text-zinc-500 text-xs">
            Generated {new Date(m.generatedAt).toLocaleString()} · direct row cap {m.directRowCap ?? '—'} per section
        </p>
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
        <Card padding="lg" className="border-zinc-700/80">
            <h3 className="text-white font-semibold mb-1">Direct data (row-level)</h3>
            <p className="text-zinc-500 text-xs mb-4">Source rows from the database for the selected period.</p>

            {d.payments?.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-zinc-300 text-sm font-medium mb-2">Payments</h4>
                    {truncNote('payments', meta)}
                    <div className="max-h-72 overflow-auto overflow-x-auto">
                        <table className="w-full text-sm min-w-[640px]">
                            <thead>
                                <tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                    <th className="text-left py-2 pr-2">Date</th>
                                    <th className="text-right py-2">Amount</th>
                                    <th className="text-left py-2 px-2">Method</th>
                                    <th className="text-left py-2">Member</th>
                                    <th className="text-left py-2">Plan</th>
                                    <th className="text-left py-2">Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.payments.map((r: any, i: number) => (
                                    <tr key={i} className="border-b border-zinc-800/50">
                                        <td className="py-2 text-zinc-300 whitespace-nowrap">{r.paymentDate}</td>
                                        <td className="py-2 text-right text-white">Rs. {Number(r.amount).toLocaleString()}</td>
                                        <td className="py-2 text-zinc-400 capitalize px-2">{String(r.paymentMethod ?? '').replace('_', ' ')}</td>
                                        <td className="py-2 text-zinc-300">{r.memberName ?? '—'}</td>
                                        <td className="py-2 text-zinc-400">{r.planName ?? '—'}</td>
                                        <td className="py-2 text-zinc-500 text-xs">{r.receiptNumber ?? '—'}</td>
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
                                <tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                    <th className="text-left py-2">Check-in</th>
                                    <th className="text-left py-2">Member</th>
                                    <th className="text-right py-2">Duration</th>
                                    <th className="text-left py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.visits.map((r: any, i: number) => (
                                    <tr key={i} className="border-b border-zinc-800/50">
                                        <td className="py-2 text-zinc-300 whitespace-nowrap">{fmtDt(r.checkInAt)}</td>
                                        <td className="py-2 text-zinc-300">{r.memberName ?? '—'}</td>
                                        <td className="py-2 text-right text-zinc-400">{r.durationMin != null ? `${r.durationMin} min` : '—'}</td>
                                        <td className="py-2 text-zinc-400 capitalize">{r.status}</td>
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
                                <tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                    <th className="text-left py-2">Registered</th>
                                    <th className="text-left py-2">Name</th>
                                    <th className="text-left py-2">Email</th>
                                    <th className="text-left py-2">Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.newMemberRegistrations.map((r: any, i: number) => (
                                    <tr key={i} className="border-b border-zinc-800/50">
                                        <td className="py-2 text-zinc-300 whitespace-nowrap">{fmtDt(r.registeredAt)}</td>
                                        <td className="py-2 text-zinc-300">{r.fullName}</td>
                                        <td className="py-2 text-zinc-400 text-xs">{r.email}</td>
                                        <td className="py-2 text-zinc-500">{r.memberCode ?? '—'}</td>
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
                                <tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                    <th className="text-left py-2">Created</th>
                                    <th className="text-left py-2">Member</th>
                                    <th className="text-left py-2">Plan</th>
                                    <th className="text-left py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.subscriptionsCreated.map((r: any, i: number) => (
                                    <tr key={i} className="border-b border-zinc-800/50">
                                        <td className="py-2 text-zinc-300 whitespace-nowrap">{fmtDt(r.createdAt)}</td>
                                        <td className="py-2 text-zinc-300">{r.memberName ?? '—'}</td>
                                        <td className="py-2 text-zinc-400">{r.planName ?? '—'}</td>
                                        <td className="py-2 text-zinc-400 capitalize">{String(r.status ?? '').replace('_', ' ')}</td>
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
                                <tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                    <th className="text-left py-2">At</th>
                                    <th className="text-left py-2">Equipment</th>
                                    <th className="text-left py-2">Type</th>
                                    <th className="text-left py-2">Severity</th>
                                    <th className="text-left py-2">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.equipmentEvents.map((r: any, i: number) => (
                                    <tr key={i} className="border-b border-zinc-800/50 align-top">
                                        <td className="py-2 text-zinc-300 whitespace-nowrap">{fmtDt(r.createdAt)}</td>
                                        <td className="py-2 text-zinc-300">{r.equipmentName ?? '—'}</td>
                                        <td className="py-2 text-zinc-400 capitalize">{String(r.eventType ?? '').replace('_', ' ')}</td>
                                        <td className="py-2 text-zinc-400 capitalize">{r.severity ?? '—'}</td>
                                        <td className="py-2 text-zinc-500 text-xs max-w-xs">{r.description}</td>
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
                                <tr className="text-zinc-400 text-xs border-b border-zinc-700">
                                    <th className="text-left py-2">Date</th>
                                    <th className="text-left py-2">Time</th>
                                    <th className="text-left py-2">Trainer</th>
                                    <th className="text-left py-2">Member</th>
                                    <th className="text-left py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {d.ptSessions.map((r: any, i: number) => (
                                    <tr key={i} className="border-b border-zinc-800/50">
                                        <td className="py-2 text-zinc-300">{r.sessionDate}</td>
                                        <td className="py-2 text-zinc-400">{r.startTime}</td>
                                        <td className="py-2 text-zinc-300">{r.trainerName ?? '—'}</td>
                                        <td className="py-2 text-zinc-300">{r.memberName ?? '—'}</td>
                                        <td className="py-2 text-zinc-400 capitalize">{r.status}</td>
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
