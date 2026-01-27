'use client';

import { useState, useEffect } from 'react';
import { staffAPI } from '@/lib/api';
import { Wrench, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Equipment {
    id: string;
    name: string;
    type: string;
    status: string; // active, maintenance
    lastMaintained: string | null;
}

export default function StaffEquipmentPage() {
    const router = useRouter();
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const response = await staffAPI.getEquipmentStatus();
            if (response.data.success) {
                setEquipmentList(response.data.data);
            } else {
                setError('Failed to load equipment');
            }
        } catch (err: any) {
            setError(err.message || 'Error loading equipment');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    const handleReportIssue = async (id: string, name: string) => {
        if (!confirm(`Report issue for ${name}? This will mark it as needing maintenance.`)) return;

        try {
            setProcessingId(id);
            await staffAPI.reportEquipmentIssue(id);
            // Refresh list
            fetchEquipment();
        } catch (err: any) {
            alert(err.message || 'Failed to report issue');
        } finally {
            setProcessingId(null);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'cardio': return <Activity size={18} />;
            case 'strength': return <Wrench size={18} />;
            default: return <Wrench size={18} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Equipment Status
                </h1>
                <button
                    onClick={fetchEquipment}
                    className="p-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 animate-pulse h-40"></div>
                    ))}
                </div>
            ) : equipmentList.length === 0 ? (
                <div className="text-center py-12 bg-neutral-900/50 rounded-2xl border border-white/5">
                    <Wrench className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">No equipment found</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {equipmentList.map((eq) => (
                        <div key={eq.id} className={`
                            bg-neutral-900/50 backdrop-blur-xl border rounded-2xl p-6 transition-colors
                            ${eq.status === 'maintenance' ? 'border-red-500/50' : 'border-white/5 hover:border-white/10'}
                        `}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-white text-lg">{eq.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                        {getTypeIcon(eq.type)}
                                        <span className="capitalize">{eq.type}</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border
                                    ${eq.status === 'active'
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                    {eq.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="text-sm text-gray-500">
                                    Last Maintained: {eq.lastMaintained ? new Date(eq.lastMaintained).toLocaleDateString() : 'Never'}
                                </div>

                                {eq.status === 'active' && (
                                    <button
                                        onClick={() => handleReportIssue(eq.id, eq.name)}
                                        disabled={processingId === eq.id}
                                        className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-medium"
                                    >
                                        <AlertTriangle size={16} />
                                        Report Issue
                                    </button>
                                )}
                                {eq.status === 'maintenance' && (
                                    <div className="w-full py-2 px-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center gap-2 text-sm font-medium cursor-not-allowed opacity-75">
                                        <Wrench size={16} />
                                        Under Maintenance
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
