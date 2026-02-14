'use client';

import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI, getErrorMessage } from '@/lib/api';
import {
    Package, Plus, Search, AlertTriangle, DollarSign,
    ArrowUpDown, Loader2, X, Minus, PlusCircle
} from 'lucide-react';

interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unitCost: string;
    retailPrice: string;
    reorderThreshold: number;
    supplier: string | null;
    status: string;
}

interface CategorySummary {
    category: string;
    itemCount: number;
    totalQuantity: number;
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [inventoryValue, setInventoryValue] = useState<{ totalCostValue: number; totalRetailValue: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState<{ item: InventoryItem; type: 'sale' | 'restock' } | null>(null);
    const [stockQty, setStockQty] = useState(1);
    const [formData, setFormData] = useState({
        name: '', category: 'supplements', quantity: 0,
        unitCost: '', retailPrice: '', reorderThreshold: 5, supplier: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [itemsRes, lowRes, catRes, valRes] = await Promise.all([
                inventoryAPI.list(1, 100, selectedCategory || undefined),
                inventoryAPI.getLowStock(),
                inventoryAPI.getCategories(),
                inventoryAPI.getValue(),
            ]);
            setItems(itemsRes.data.data?.items || itemsRes.data.data || []);
            setLowStock(lowRes.data.data || []);
            setCategories(catRes.data.data || []);
            setInventoryValue(valRes.data.data || null);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAddItem = async () => {
        setSubmitting(true);
        setError('');
        try {
            await inventoryAPI.addItem({
                ...formData,
                unitCost: parseFloat(formData.unitCost),
                retailPrice: parseFloat(formData.retailPrice),
            });
            setShowAddModal(false);
            setFormData({ name: '', category: 'supplements', quantity: 0, unitCost: '', retailPrice: '', reorderThreshold: 5, supplier: '' });
            fetchData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleStock = async () => {
        if (!showStockModal) return;
        setSubmitting(true);
        try {
            if (showStockModal.type === 'sale') {
                await inventoryAPI.recordSale(showStockModal.item.id, { quantity: stockQty });
            } else {
                await inventoryAPI.restock(showStockModal.item.id, { quantity: stockQty });
            }
            setShowStockModal(null);
            setStockQty(1);
            fetchData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = items.filter(
        (i) => i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.category.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400">
                        Inventory Management
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Track stock, sales and restocking</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={16} /> Add Item
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="text-blue-400" size={20} />
                        <span className="text-sm text-zinc-400">Total Items</span>
                    </div>
                    <div className="text-2xl font-bold">{items.length}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="text-yellow-400" size={20} />
                        <span className="text-sm text-zinc-400">Low Stock</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{lowStock.length}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="text-green-400" size={20} />
                        <span className="text-sm text-zinc-400">Stock Value (Cost)</span>
                    </div>
                    <div className="text-2xl font-bold">
                        Rs. {new Intl.NumberFormat('en-LK').format(inventoryValue?.totalCostValue || 0)}
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="text-emerald-400" size={20} />
                        <span className="text-sm text-zinc-400">Retail Value</span>
                    </div>
                    <div className="text-2xl font-bold">
                        Rs. {new Intl.NumberFormat('en-LK').format(inventoryValue?.totalRetailValue || 0)}
                    </div>
                </div>
            </div>

            {/* Low Stock Alerts */}
            {lowStock.length > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                    <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} /> Low Stock Alerts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {lowStock.map((item) => (
                            <span key={item.id} className="bg-yellow-500/10 text-yellow-300 px-3 py-1 rounded-full text-sm">
                                {item.name} — {item.quantity} left
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex gap-4 flex-col sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white outline-none"
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c.category} value={c.category}>{c.category}</option>
                    ))}
                </select>
            </div>

            {/* Items Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left">Item</th>
                                <th className="px-6 py-3 text-left">Category</th>
                                <th className="px-6 py-3 text-right">Qty</th>
                                <th className="px-6 py-3 text-right">Unit Cost</th>
                                <th className="px-6 py-3 text-right">Retail</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                                    <td className="px-6 py-4 text-zinc-400 capitalize">{item.category}</td>
                                    <td className={`px-6 py-4 text-right font-mono ${item.quantity <= item.reorderThreshold ? 'text-yellow-400' : 'text-white'}`}>
                                        {item.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-right text-zinc-400">
                                        Rs. {Number(item.unitCost).toLocaleString('en-LK')}
                                    </td>
                                    <td className="px-6 py-4 text-right text-zinc-400">
                                        Rs. {Number(item.retailPrice).toLocaleString('en-LK')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'active'
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-zinc-500/10 text-zinc-400'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setShowStockModal({ item, type: 'sale' }); setStockQty(1); }}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                                title="Record sale"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <button
                                                onClick={() => { setShowStockModal({ item, type: 'restock' }); setStockQty(1); }}
                                                className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors"
                                                title="Restock"
                                            >
                                                <PlusCircle size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                        No items found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Add Inventory Item</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            <input placeholder="Item name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-500" />
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none">
                                <option value="supplements">Supplements</option>
                                <option value="merchandise">Merchandise</option>
                                <option value="equipment">Equipment</option>
                                <option value="cleaning">Cleaning</option>
                                <option value="beverages">Beverages</option>
                                <option value="other">Other</option>
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" placeholder="Quantity" value={formData.quantity || ''} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-500" />
                                <input type="number" placeholder="Reorder threshold" value={formData.reorderThreshold || ''} onChange={(e) => setFormData({ ...formData, reorderThreshold: Number(e.target.value) })}
                                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" step="0.01" placeholder="Unit cost (Rs)" value={formData.unitCost} onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-500" />
                                <input type="number" step="0.01" placeholder="Retail price (Rs)" value={formData.retailPrice} onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-500" />
                            </div>
                            <input placeholder="Supplier (optional)" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                        <button onClick={handleAddItem} disabled={submitting || !formData.name}
                            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            Add Item
                        </button>
                    </div>
                </div>
            )}

            {/* Sale/Restock Modal */}
            {showStockModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowStockModal(null)}>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold">
                            {showStockModal.type === 'sale' ? 'Record Sale' : 'Restock'} — {showStockModal.item.name}
                        </h3>
                        <p className="text-sm text-zinc-400">Current stock: <span className="text-white font-mono">{showStockModal.item.quantity}</span></p>
                        <input type="number" min={1} value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-red-500" />
                        <button onClick={handleStock} disabled={submitting || stockQty < 1}
                            className={`w-full py-2 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${showStockModal.type === 'sale' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                            {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                            {showStockModal.type === 'sale' ? 'Record Sale' : 'Restock'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
