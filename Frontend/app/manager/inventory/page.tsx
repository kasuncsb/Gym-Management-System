'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type Item = { id: string; name: string; category: string; qty: number; threshold: number };

export default function ManagerInventoryPage() {
    const toast = useToast();
    const [restockOpen, setRestockOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [lastTxn, setLastTxn] = useState<Array<{ itemId: string; txnType: string; qtyChange: number; createdAt: string }>>([]);
    const [form, setForm] = useState({ item: '', qty: '', notes: '' });

    const loadItems = async () => {
        const data = await opsAPI.inventoryItems();
        setItems((data ?? []).map((i: any) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            qty: Number(i.qtyInStock ?? 0),
            threshold: Number(i.reorderThreshold ?? 0),
        })));
    };

    useEffect(() => {
        loadItems().catch((err) => toast.error('Failed to load inventory', getErrorMessage(err)));
    }, []);

    const lowStock = useMemo(() => items.filter((i) => i.qty < i.threshold), [items]);
    const ITEM_OPTIONS = items.map((i) => ({ value: i.id, label: `${i.name} (${i.qty})` }));

    const handleRestock = async () => {
        const qty = Number(form.qty);
        if (!form.item || !form.qty || Number.isNaN(qty) || qty <= 0) {
            toast.error('Validation Error', 'Select item and enter quantity');
            return;
        }
        setLoading(true);
        try {
            const txn = await opsAPI.addInventoryTxn({
                itemId: form.item,
                txnType: 'restock',
                qtyChange: qty,
                reference: form.notes || undefined,
            });
            setLastTxn((prev) => [{ itemId: txn.itemId, txnType: txn.txnType, qtyChange: Number(txn.qtyChange), createdAt: String(txn.createdAt ?? new Date().toISOString()) }, ...prev].slice(0, 8));
            await loadItems();
            toast.success('Restocked', `${form.qty} units recorded`);
            setRestockOpen(false);
            setForm({ item: '', qty: '', notes: '' });
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
                            {items.map(i => (
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
                <div className="space-y-2">
                    {lastTxn.length === 0 && <div className="text-zinc-500 text-sm">No transactions recorded in this session yet.</div>}
                    {lastTxn.map((t, idx) => (
                        <div key={`${t.itemId}-${idx}`} className="text-sm text-zinc-400 bg-zinc-800/30 rounded-lg px-3 py-2">
                            {items.find((i) => i.id === t.itemId)?.name ?? 'Item'} · {t.txnType} · {t.qtyChange} · {new Date(t.createdAt).toLocaleString()}
                        </div>
                    ))}
                </div>
            </Card>

            <Modal isOpen={restockOpen} onClose={() => setRestockOpen(false)} title="Restock / Adjustment" size="md">
                <div className="space-y-4">
                    <Select id="inventory-item" label="Item" options={ITEM_OPTIONS} value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} placeholder="Select item" />
                    <Input id="inventory-qty" label="Quantity" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
                    <Input id="inventory-notes" label="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reference" />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setRestockOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleRestock}>Record</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
