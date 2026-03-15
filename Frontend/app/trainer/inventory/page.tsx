'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type TxType = 'restock' | 'sale' | 'adjustment' | 'waste';

type Item = { id: string; name: string; category: string; qty: number; threshold: number; lowStock: boolean };

const TX_OPTIONS = [
    { value: 'restock', label: 'Restock' },
    { value: 'sale', label: 'Sale' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'waste', label: 'Waste' },
];

export default function TrainerInventoryPage() {
    const toast = useToast();
    const [txOpen, setTxOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [form, setForm] = useState({ item: '', type: 'restock' as TxType, qty: '', notes: '' });

    const loadItems = async () => {
        const rows = await opsAPI.inventoryItems();
        setItems((rows ?? []).map((i: any) => {
            const qty = Number(i.qtyInStock ?? 0);
            const threshold = Number(i.reorderThreshold ?? 0);
            return {
                id: i.id,
                name: i.name,
                category: i.category,
                qty,
                threshold,
                lowStock: qty < threshold,
            };
        }));
    };

    useEffect(() => {
        loadItems().catch((err) => toast.error('Failed to load inventory', getErrorMessage(err)));
    }, []);

    const lowStockItems = useMemo(() => items.filter((i) => i.lowStock), [items]);
    const ITEM_OPTIONS = items.map((i) => ({ value: i.id, label: `${i.name} (${i.qty})` }));

    const handleRecord = async () => {
        const qty = Number(form.qty);
        if (!form.item || !form.qty || Number.isNaN(qty) || qty <= 0) {
            toast.error('Validation Error', 'Please select item and enter quantity');
            return;
        }
        setLoading(true);
        try {
            const sign = form.type === 'restock' ? 1 : -1;
            await opsAPI.addInventoryTxn({
                itemId: form.item,
                txnType: form.type,
                qtyChange: sign * qty,
                reference: form.notes || undefined,
            });
            await loadItems();
            toast.success('Transaction Recorded', `${form.type} of ${form.qty} recorded`);
            setTxOpen(false);
            setForm({ item: '', type: 'restock', qty: '', notes: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
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
                            {items.map(i => (
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
