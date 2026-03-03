'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dumbbell, AlertTriangle, Wrench, Plus, X,
    CheckCircle2, Clock, Search, Filter, ChevronDown
} from 'lucide-react';
import { equipmentAPI, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';

interface Equipment {
    id: string;
    name: string;
    category: string;
    branchId: string;
    status: string;
    purchaseDate?: string;
    warrantyExpiry?: string;
    lastMaintenanceDate?: string;
    notes?: string;
}

interface EquipmentIssue {
    id: string;
    equipmentId: string;
    equipmentName?: string;
    description: string;
    severity: string;
    status: string;
    reportedBy: string;
    createdAt: string;
}

type Tab = 'inventory' | 'issues';

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    operational: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    maintenance: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    out_of_order: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    retired: { color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function ManagerEquipmentPage() {
    const toast = useToast();
    const [tab, setTab] = useState<Tab>('inventory');
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [issues, setIssues] = useState<EquipmentIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Add Equipment form
    const [showAddForm, setShowAddForm] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', category: 'cardio', status: 'operational', notes: '' });
    const [submitting, setSubmitting] = useState(false);

    // Report Issue form
    const [showIssueForm, setShowIssueForm] = useState<string | null>(null);
    const [issueForm, setIssueForm] = useState({ description: '', severity: 'medium' });

    // Maintenance form
    const [showMaintenanceForm, setShowMaintenanceForm] = useState<string | null>(null);
    const [maintenanceForm, setMaintenanceForm] = useState({ maintenanceType: 'routine', description: '', cost: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [equipRes, issuesRes] = await Promise.all([
                equipmentAPI.list(),
                equipmentAPI.getOpenIssues(),
            ]);
            setEquipment(equipRes.data.data || []);
            setIssues(issuesRes.data.data || []);
        } catch (e) {
            toast.error('Failed to load equipment data', getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAddEquipment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await equipmentAPI.create(addForm);
            toast.success('Equipment added successfully');
            setShowAddForm(false);
            setAddForm({ name: '', category: 'cardio', status: 'operational', notes: '' });
            fetchData();
        } catch (e) {
            toast.error('Failed to add equipment', getErrorMessage(e));
        } finally {
            setSubmitting(false);
        }
    };

    const handleReportIssue = async (equipmentId: string) => {
        setSubmitting(true);
        try {
            await equipmentAPI.reportIssue(equipmentId, issueForm);
            toast.success('Issue reported successfully');
            setShowIssueForm(null);
            setIssueForm({ description: '', severity: 'medium' });
            fetchData();
        } catch (e) {
            toast.error('Failed to report issue', getErrorMessage(e));
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogMaintenance = async (equipmentId: string) => {
        setSubmitting(true);
        try {
            await equipmentAPI.logMaintenance(equipmentId, {
                ...maintenanceForm,
                cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : undefined,
            });
            toast.success('Maintenance logged successfully');
            setShowMaintenanceForm(null);
            setMaintenanceForm({ maintenanceType: 'routine', description: '', cost: '' });
            fetchData();
        } catch (e) {
            toast.error('Failed to log maintenance', getErrorMessage(e));
        } finally {
            setSubmitting(false);
        }
    };

    // Filtered equipment
    const filteredEquipment = equipment.filter(e => {
        const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.category.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || e.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // Stats
    const stats = {
        total: equipment.length,
        operational: equipment.filter(e => e.status === 'operational').length,
        maintenance: equipment.filter(e => e.status === 'maintenance').length,
        outOfOrder: equipment.filter(e => e.status === 'out_of_order').length,
        openIssues: issues.length,
    };

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="flex justify-between items-center"><Skeleton className="h-8 w-40" /><Skeleton className="h-10 w-36 rounded-xl" /></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Equipment</h2>
                    <p className="text-zinc-400 mt-1">Monitor and manage gym equipment</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium"
                >
                    {showAddForm ? <X size={18} /> : <Plus size={18} />}
                    {showAddForm ? 'Cancel' : 'Add Equipment'}
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl border border-zinc-800 bg-black/40">
                    <div className="text-sm text-zinc-400">Total</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                    <div className="text-sm text-emerald-400">Operational</div>
                    <div className="text-2xl font-bold text-emerald-400">{stats.operational}</div>
                </div>
                <div className="p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
                    <div className="text-sm text-yellow-400">Maintenance</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.maintenance}</div>
                </div>
                <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5">
                    <div className="text-sm text-red-400">Out of Order</div>
                    <div className="text-2xl font-bold text-red-400">{stats.outOfOrder}</div>
                </div>
                <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5">
                    <div className="text-sm text-orange-400">Open Issues</div>
                    <div className="text-2xl font-bold text-orange-400">{stats.openIssues}</div>
                </div>
            </div>

            {/* Add Equipment Form */}
            {showAddForm && (
                <form onSubmit={handleAddEquipment} className="rounded-2xl border border-zinc-800 bg-black/40 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white">New Equipment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                            <input
                                required
                                value={addForm.name}
                                onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none"
                                placeholder="e.g. Treadmill Pro X200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Category *</label>
                            <select
                                value={addForm.category}
                                onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none"
                            >
                                <option value="cardio">Cardio</option>
                                <option value="strength">Strength</option>
                                <option value="free_weights">Free Weights</option>
                                <option value="machines">Machines</option>
                                <option value="flexibility">Flexibility</option>
                                <option value="accessories">Accessories</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Status</label>
                            <select
                                value={addForm.status}
                                onChange={e => setAddForm({ ...addForm, status: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none"
                            >
                                <option value="operational">Operational</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="out_of_order">Out of Order</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                            <input
                                value={addForm.notes}
                                onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-red-600 focus:outline-none"
                                placeholder="Optional notes"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-red-700 text-white rounded-xl hover:bg-red-600 transition font-medium disabled:opacity-50"
                    >
                        {submitting ? 'Adding...' : 'Add Equipment'}
                    </button>
                </form>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800 w-fit">
                <button
                    onClick={() => setTab('inventory')}
                    className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        tab === 'inventory' ? 'bg-red-700 text-white' : 'text-zinc-400 hover:text-white'
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Dumbbell size={16} /> Inventory ({equipment.length})
                    </div>
                </button>
                <button
                    onClick={() => setTab('issues')}
                    className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        tab === 'issues' ? 'bg-red-700 text-white' : 'text-zinc-400 hover:text-white'
                    )}
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} /> Open Issues ({issues.length})
                    </div>
                </button>
            </div>

            {/* Inventory Tab */}
            {tab === 'inventory' && (
                <>
                    {/* Search & Filter */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search equipment..."
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:border-red-600 focus:outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:border-red-600 focus:outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="operational">Operational</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="out_of_order">Out of Order</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>

                    {/* Equipment Grid */}
                    {filteredEquipment.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                            <Dumbbell className="mx-auto mb-4 text-zinc-600" size={40} />
                            <h3 className="text-xl font-semibold text-zinc-300">No Equipment Found</h3>
                            <p className="text-zinc-500 mt-2">
                                {search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add equipment to get started.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredEquipment.map(item => {
                                const statusStyle = STATUS_CONFIG[item.status] || STATUS_CONFIG.operational;
                                return (
                                    <div key={item.id} className="rounded-2xl border border-zinc-800 bg-black/40 p-5 hover:border-zinc-700 transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300">
                                                    <Dumbbell size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-white">{item.name}</h4>
                                                    <span className="text-xs text-zinc-500 capitalize">{item.category.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', statusStyle.color, statusStyle.bg, statusStyle.border)}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {item.lastMaintenanceDate && (
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                                                <Wrench size={12} />
                                                Last maintenance: {new Date(item.lastMaintenanceDate).toLocaleDateString()}
                                            </div>
                                        )}

                                        {item.notes && (
                                            <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{item.notes}</p>
                                        )}

                                        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800">
                                            <button
                                                onClick={() => { setShowIssueForm(item.id); setShowMaintenanceForm(null); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-500/20 text-orange-400 hover:bg-orange-500/10 transition"
                                            >
                                                <AlertTriangle size={12} /> Report Issue
                                            </button>
                                            <button
                                                onClick={() => { setShowMaintenanceForm(item.id); setShowIssueForm(null); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-500/20 text-blue-400 hover:bg-blue-500/10 transition"
                                            >
                                                <Wrench size={12} /> Maintenance
                                            </button>
                                        </div>

                                        {/* Inline Report Issue Form */}
                                        {showIssueForm === item.id && (
                                            <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
                                                <textarea
                                                    value={issueForm.description}
                                                    onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
                                                    placeholder="Describe the issue..."
                                                    rows={2}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-red-600 focus:outline-none resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <select
                                                        value={issueForm.severity}
                                                        onChange={e => setIssueForm({ ...issueForm, severity: e.target.value })}
                                                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white focus:border-red-600 focus:outline-none"
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                        <option value="critical">Critical</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleReportIssue(item.id)}
                                                        disabled={submitting || !issueForm.description}
                                                        className="flex-1 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 transition"
                                                    >
                                                        {submitting ? 'Reporting...' : 'Submit'}
                                                    </button>
                                                    <button onClick={() => setShowIssueForm(null)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Inline Maintenance Form */}
                                        {showMaintenanceForm === item.id && (
                                            <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
                                                <select
                                                    value={maintenanceForm.maintenanceType}
                                                    onChange={e => setMaintenanceForm({ ...maintenanceForm, maintenanceType: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-red-600 focus:outline-none"
                                                >
                                                    <option value="routine">Routine</option>
                                                    <option value="repair">Repair</option>
                                                    <option value="inspection">Inspection</option>
                                                    <option value="replacement">Parts Replacement</option>
                                                </select>
                                                <textarea
                                                    value={maintenanceForm.description}
                                                    onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                                                    placeholder="Maintenance details..."
                                                    rows={2}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-red-600 focus:outline-none resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={maintenanceForm.cost}
                                                        onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                                                        placeholder="Cost (Rs.)"
                                                        className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:border-red-600 focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={() => handleLogMaintenance(item.id)}
                                                        disabled={submitting || !maintenanceForm.description}
                                                        className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition"
                                                    >
                                                        {submitting ? 'Logging...' : 'Log Maintenance'}
                                                    </button>
                                                    <button onClick={() => setShowMaintenanceForm(null)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Issues Tab */}
            {tab === 'issues' && (
                <>
                    {issues.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                            <CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={40} />
                            <h3 className="text-xl font-semibold text-zinc-300">No Open Issues</h3>
                            <p className="text-zinc-500 mt-2">All equipment is in good condition.</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-zinc-800 bg-black/40 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Equipment</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Severity</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Reported</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {issues.map(issue => {
                                            const sevStyle = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.medium;
                                            return (
                                                <tr key={issue.id} className="hover:bg-zinc-900/30">
                                                    <td className="px-6 py-3 text-white font-medium">{issue.equipmentName || issue.equipmentId.slice(0, 8)}</td>
                                                    <td className="px-6 py-3 text-zinc-300 max-w-xs truncate">{issue.description}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', sevStyle.color, sevStyle.bg, sevStyle.border)}>
                                                            {issue.severity}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium border text-yellow-400 bg-yellow-500/10 border-yellow-500/20">
                                                            {issue.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-zinc-500 text-xs">{new Date(issue.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
