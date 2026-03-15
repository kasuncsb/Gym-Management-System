'use client';

import { useState } from 'react';
import { Package, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';

type TxType = 'restock' | 'sale' | 'adjustment' | 'waste';

const MOCK_ITEMS = [
    { id: 1, name: 'Protein Shake', category: 'Supplements', qty: 45, threshold: 20, lowStock: false },
    { id: 2, name: 'Towels', category: 'Amenities', qty: 12, threshold: 30, lowStock: true },
    { id: 3, name: 'Water Bottles', category: 'Retail', qty: 8, threshold: 15, lowStock: true },
];

const TX_OPTIONS = [
    { value: 'restock', label: 'Restock' },
    { value: 'sale', label: 'Sale' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'waste', label: 'Waste' },
];

const ITEM_OPTIONS = MOCK_ITEMS.map(i => ({ value: i.name, label: `${i.name} (${i.qty})` }));

export default function TrainerInventoryPage() {
    const toast = useToast();
    const [txOpen, setTxOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ item: '', type: 'restock' as TxType, qty: '', notes: '' });

    const lowStockItems = MOCK_ITEMS.filter(i => i.lowStock);

    const handleRecord = async () => {
        if (!form.item || !form.qty || isNaN(Number(form.qty))) {
            toast.error('Validation Error', 'Please select item and enter quantity');
            return;
        }
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            toast.success('Transaction Recorded', `${form.type} of ${form.qty} recorded`);
            setTxOpen(false);
            setForm({ item: '', type: 'restock', qty: '', notes: '' });
        } catch {
            toast.error('Error', 'Failed to record transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Inventory"
                subtitle="Track stock levels and record transactions"
                action={
                    <LoadingButton icon={Plus} onClick={() => setTxOpen(true)} size="md">
                        Record Transaction
                    </LoadingButton>
                }
            />

            {lowStockItems.length > 0 && (
                <Card padding="md" className="border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-amber-400" />
                        <div>
                            <p className="text-white font-semibold">Low Stock Alert</p>
                            <p className="text-zinc-400 text-sm">{lowStockItems.map(i => i.name).join(', ')}</p>
                        </div>
                    </div>
                </Card>
            )}

            <Card padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-700">
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">Item</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">Category</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">Qty</th>
                                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-4">Reorder</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_ITEMS.map(i => (
                                <tr key={i.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="px-6 py-4 text-sm text-white">{i.name}</td>
                                    <td className="px-6 py-4 text-sm text-zinc-400">{i.category}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-semibold ${i.lowStock ? 'text-amber-400' : 'text-white'}`}>{i.qty}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-400">{i.threshold}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={txOpen} onClose={() => setTxOpen(false)} title="Record Transaction" size="md">
                <div className="space-y-4">
                    <Select id="trainer-inventory-item" label="Item" options={ITEM_OPTIONS} value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} placeholder="Select item" />
                    <Select id="trainer-inventory-type" label="Type" options={TX_OPTIONS} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TxType }))} />
                    <Input id="trainer-inventory-qty" label="Quantity" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
                    <Input id="trainer-inventory-notes" label="Reference / Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setTxOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleRecord}>Record</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
