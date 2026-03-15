'use client';

import { useEffect, useState } from 'react';
import { CalendarOff, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type Closure = { id: string; date: string; reason: string; emergency: boolean };

export default function ManagerClosuresPage() {
    const toast = useToast();
    const [addOpen, setAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [closures, setClosures] = useState<Closure[]>([]);
    const [form, setForm] = useState({ date: '', reason: '', emergency: false });

    const loadClosures = async () => {
        const rows = await opsAPI.closures();
        setClosures((rows ?? []).map((c: any) => ({
            id: c.id,
            date: String(c.closureDate).slice(0, 10),
            reason: c.reason ?? '—',
            emergency: !!c.isEmergency,
        })));
    };

    useEffect(() => {
        loadClosures().catch((err) => toast.error('Failed to load closures', getErrorMessage(err)));
    }, []);

    const handleAdd = async () => {
        if (!form.date || !form.reason.trim()) {
            toast.error('Validation Error', 'Date and reason are required');
            return;
        }
        setLoading(true);
        try {
            await opsAPI.createClosure({
                closureDate: form.date,
                reason: form.reason.trim(),
                isEmergency: form.emergency,
            });
            await loadClosures();
            toast.success('Closure Added', `${form.date} — ${form.reason}`);
            setAddOpen(false);
            setForm({ date: '', reason: '', emergency: false });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Branch Closures"
                subtitle="Manage closure dates (holidays, emergencies)"
                action={
                    <LoadingButton icon={Plus} onClick={() => setAddOpen(true)} size="md">
                        Add Closure
                    </LoadingButton>
                }
            />

            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-700">
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Date</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Reason</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Type</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {closures.map(c => (
                                <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="px-6 py-4 text-white font-medium">{c.date}</td>
                                    <td className="px-6 py-4 text-zinc-400">{c.reason}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.emergency ? 'bg-red-500/20 text-red-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                            {c.emergency ? 'Emergency' : 'Scheduled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => {
                                                opsAPI.deleteClosure(c.id)
                                                    .then(() => loadClosures())
                                                    .catch((err) => toast.error('Error', getErrorMessage(err)));
                                            }}
                                            className="text-red-400 hover:text-red-300 text-xs"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Closure" size="md">
                <div className="space-y-4">
                    <Input id="closures-date" label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                    <Input id="closures-reason" label="Reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. National Holiday" required />
                    <label htmlFor="closures-emergency" className="flex items-center gap-2 cursor-pointer">
                        <input id="closures-emergency" type="checkbox" checked={form.emergency} onChange={e => setForm(f => ({ ...f, emergency: e.target.checked }))} className="rounded border-zinc-600" />
                        <span className="text-sm text-zinc-300">Emergency closure</span>
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAddOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAdd}>Add Closure</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
