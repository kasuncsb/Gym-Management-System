'use client';

import { useState } from 'react';
import { Package, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';

const MOCK_ITEMS = [
    { id: 1, name: 'Protein Shake', category: 'Supplements', qty: 45, threshold: 20 },
    { id: 2, name: 'Towels', category: 'Amenities', qty: 12, threshold: 30 },
    { id: 3, name: 'Water Bottles', category: 'Retail', qty: 8, threshold: 15 },
];

export default function ManagerInventoryPage() {
    const toast = useToast();
    const [restockOpen, setRestockOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ item: '', qty: '', notes: '' });

    const lowStock = MOCK_ITEMS.filter(i => i.qty < i.threshold);
    const ITEM_OPTIONS = MOCK_ITEMS.map(i => ({ value: i.name, label: `${i.name} (${i.qty})` }));

    const handleRestock = async () => {
        if (!form.item || !form.qty || isNaN(Number(form.qty))) {
            toast.error('Validation Error', 'Select item and enter quantity');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            toast.success('Restocked', `${form.qty} units recorded for ${form.item}`);
            setRestockOpen(false);
            setForm({ item: '', qty: '', notes: '' });
        } catch {
            toast.error('Error', 'Failed to record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Inventory"
                subtitle="Stock levels and transactions"
                action={
                    <LoadingButton icon={Plus} onClick={() => setRestockOpen(true)} size="md">
                        Restock / Adjust
                    </LoadingButton>
                }
            />

            {lowStock.length > 0 && (
                <Card padding="md" className="border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-amber-400" />
                        <p className="text-white font-semibold">Low stock: {lowStock.map(i => i.name).join(', ')}</p>
                    </div>
                </Card>
            )}

            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-700">
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Item</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Category</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Qty</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase px-6 py-4">Reorder</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_ITEMS.map(i => (
                                <tr key={i.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="px-6 py-4 text-white font-medium">{i.name}</td>
                                    <td className="px-6 py-4 text-zinc-400">{i.category}</td>
                                    <td className="px-6 py-4">
                                        <span className={i.qty < i.threshold ? 'text-amber-400 font-semibold' : 'text-white'}>{i.qty}</span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">{i.threshold}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card padding="lg">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
                <div className="text-zinc-500 text-sm">Transaction history will appear here when backend is connected.</div>
            </Card>

            <Modal isOpen={restockOpen} onClose={() => setRestockOpen(false)} title="Restock / Adjustment" size="md">
                <div className="space-y-4">
                    <Select label="Item" options={ITEM_OPTIONS} value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} placeholder="Select item" />
                    <Input label="Quantity" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
                    <Input label="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reference" />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setRestockOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleRestock}>Record</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
