'use client';

import { useState, useEffect } from 'react';
import { managerAPI } from '@/lib/api';
import { Download, TrendingUp, Users, DollarSign, Calendar, Loader2 } from 'lucide-react';

interface ReportData {
    period: string;
    generatedAt: string;
    revenue: number;
    newMembers: number;
    totalAttendance: number;
    activeSubscriptions: number;
}

export default function ManagerReportsPage() {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<ReportData | null>(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        // Fetch data to populate report
        const fetchData = async () => {
            try {
                const response = await managerAPI.getMetrics();
                if (response.data.success) {
                    const data = response.data.data;
                    setReport({
                        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                        generatedAt: new Date().toISOString(),
                        revenue: data.revenue.currentMonth,
                        newMembers: data.members.newThisMonth,
                        totalAttendance: data.attendance.today * 30, // Estimate for demo
                        activeSubscriptions: data.subscriptions.active
                    });
                }
            } catch (err) {
                console.error('Failed to load report data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDownload = () => {
        setGenerating(true);
        // Simulate PDF generation
        setTimeout(() => {
            alert('Report downloaded successfully (Simulation)');
            setGenerating(false);
        }, 1500);
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Business Reports
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Monthly performance analysis</p>
                </div>
                <button
                    onClick={handleDownload}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    {generating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                    Export PDF
                </button>
            </div>

            {/* Report Preview */}
            <div className="bg-white text-black rounded-lg shadow-xl overflow-hidden max-w-3xl mx-auto">
                <div className="p-8 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">PowerWorld Gyms</h2>
                            <p className="text-gray-500">Branch Performance Report</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">Period</div>
                            <div className="text-gray-500">{report?.period}</div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
                            <div className="text-3xl font-bold text-gray-900">
                                Rs. {new Intl.NumberFormat('en-LK').format(report?.revenue || 0)}
                            </div>
                            <div className="flex items-center text-green-600 text-sm mt-1">
                                <TrendingUp size={14} className="mr-1" />
                                +12.5% vs last month
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">New Memberships</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {report?.newMembers}
                            </div>
                            <div className="flex items-center text-green-600 text-sm mt-1">
                                <Users size={14} className="mr-1" />
                                +5 this month
                            </div>
                        </div>
                    </div>

                    {/* Detailed Stats */}
                    <div className="border rounded-lg border-gray-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Metric Category</th>
                                    <th className="px-6 py-3">Value</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4">Active Subscriptions</td>
                                    <td className="px-6 py-4 font-medium">{report?.activeSubscriptions}</td>
                                    <td className="px-6 py-4 text-green-600">Healthy</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Est. Total Monthly Visits</td>
                                    <td className="px-6 py-4 font-medium">{report?.totalAttendance}</td>
                                    <td className="px-6 py-4 text-gray-600">Normal</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Staff Utilization</td>
                                    <td className="px-6 py-4 font-medium">85%</td>
                                    <td className="px-6 py-4 text-yellow-600">High</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 text-center">
                        Generated on {new Date(report?.generatedAt || '').toLocaleString()} • PowerWorld Management System
                    </div>
                </div>
            </div>
        </div>
    );
}
