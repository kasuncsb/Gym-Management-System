'use client';

import { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader, Card, Modal, Select, Input, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

type Item = { id: string; name: string; category: string; qty: number; threshold: number };
type TxType = 'restock' | 'sale' | 'adjustment' | 'waste';

const TX_OPTIONS = [
    { value: 'restock', label: 'Restock' },
    { value: 'sale', label: 'Sale' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'waste', label: 'Waste' },
];

export default function ManagerInventoryPage() {
    const toast = useToast();
    const [txOpen, setTxOpen] = useState(false);
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [txHistory, setTxHistory] = useState<any[]>([]);
    const [form, setForm] = useState({ item: '', txnType: 'restock' as TxType, qty: '', notes: '' });
    const [newItem, setNewItem] = useState({ name: '', category: '', qty: '0', threshold: '5' });

    const loadData = async () => {
        const [data, history] = await Promise.all([opsAPI.inventoryItems(), opsAPI.inventoryTransactions()]);
        setItems((data ?? []).map((i: any) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            qty: Number(i.qtyInStock ?? 0),
            threshold: Number(i.reorderThreshold ?? 0),
        })));
        setTxHistory((history ?? []).slice(0, 30));
    };

    useEffect(() => {
        loadData().catch((err) => toast.error('Failed to load inventory', getErrorMessage(err)));
    }, []);

    const lowStock = useMemo(() => items.filter((i) => i.qty < i.threshold), [items]);
    const ITEM_OPTIONS = items.map((i) => ({ value: i.id, label: `${i.name} (${i.qty})` }));

    const handleTransaction = async () => {
        const qty = Number(form.qty);
        if (!form.item || !form.qty || Number.isNaN(qty) || qty <= 0) {
            toast.error('Validation Error', 'Select item and enter quantity');
            return;
        }
        setLoading(true);
        try {
            const sign = form.txnType === 'restock' ? 1 : -1;
            await opsAPI.addInventoryTxn({
                itemId: form.item,
                txnType: form.txnType,
                qtyChange: sign * qty,
                reference: form.notes || undefined,
            });
            await loadData();
            toast.success('Recorded', `${form.txnType} of ${form.qty} units recorded`);
            setTxOpen(false);
            setForm({ item: '', txnType: 'restock', qty: '', notes: '' });
        } catch (err) {
            toast.error('Error', getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.name.trim() || !newItem.category.trim()) {
            toast.error('Validation Error', 'Name and category are required');
            return;
        }
        setLoading(true);
        try {
            await opsAPI.createInventoryItem({
                name: newItem.name.trim(),
                category: newItem.category.trim(),
                qtyInStock: Number(newItem.qty) || 0,
                reorderThreshold: Number(newItem.threshold) || 5,
            });
            await loadData();
            toast.success('Item Added', `${newItem.name} added to inventory`);
            setAddItemOpen(false);
            setNewItem({ name: '', category: '', qty: '0', threshold: '5' });
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
                    <div className="flex gap-2">
                        <LoadingButton icon={Plus} variant="secondary" onClick={() => setAddItemOpen(true)} size="md">
                            Add Item
                        </LoadingButton>
                        <LoadingButton icon={Package} onClick={() => setTxOpen(true)} size="md">
                            Record Transaction
                        </LoadingButton>
                    </div>
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
                    {txHistory.length === 0 && <div className="text-zinc-500 text-sm">No transactions yet.</div>}
                    {txHistory.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between bg-zinc-800/30 rounded-xl p-3">
                            <div>
                                <p className="text-white text-sm font-semibold">{t.itemName ?? t.itemId}</p>
                                <p className="text-zinc-500 text-xs">{t.txnType} · by {t.recorderName ?? 'staff'}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-semibold ${t.qtyChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {t.qtyChange > 0 ? '+' : ''}{t.qtyChange}
                                </p>
                                <p className="text-zinc-600 text-xs">{String(t.createdAt).slice(0, 10)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Record Transaction Modal */}
            <Modal isOpen={txOpen} onClose={() => setTxOpen(false)} title="Record Transaction" size="md">
                <div className="space-y-4">
                    <Select id="mgr-inventory-item" label="Item" options={ITEM_OPTIONS} value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} placeholder="Select item" />
                    <Select id="mgr-inventory-type" label="Type" options={TX_OPTIONS} value={form.txnType} onChange={e => setForm(f => ({ ...f, txnType: e.target.value as TxType }))} />
                    <Input id="mgr-inventory-qty" label="Quantity" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
                    <Input id="mgr-inventory-notes" label="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reference" />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setTxOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleTransaction}>Record</LoadingButton>
                    </div>
                </div>
            </Modal>

            {/* Add Item Modal */}
            <Modal isOpen={addItemOpen} onClose={() => setAddItemOpen(false)} title="Add New Item" size="md">
                <div className="space-y-4">
                    <Input id="mgr-item-name" label="Item Name" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} placeholder="e.g. Resistance Bands" />
                    <Input id="mgr-item-category" label="Category" value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))} placeholder="e.g. accessories" />
                    <Input id="mgr-item-qty" label="Initial Qty" type="number" value={newItem.qty} onChange={e => setNewItem(n => ({ ...n, qty: e.target.value }))} />
                    <Input id="mgr-item-threshold" label="Reorder Threshold" type="number" value={newItem.threshold} onChange={e => setNewItem(n => ({ ...n, threshold: e.target.value }))} />
                    <div className="flex justify-end gap-3 pt-2">
                        <LoadingButton variant="secondary" onClick={() => setAddItemOpen(false)}>Cancel</LoadingButton>
                        <LoadingButton loading={loading} onClick={handleAddItem}>Add Item</LoadingButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
