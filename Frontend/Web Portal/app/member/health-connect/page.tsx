'use client';

import { useState, useEffect } from 'react';
import { healthConnectAPI, getErrorMessage } from '@/lib/api';
import {
    Smartphone, Wifi, WifiOff, RefreshCw, Loader2, Heart,
    Activity, Zap, CheckCircle2, XCircle
} from 'lucide-react';

interface SyncResult {
    synced: boolean;
    data: {
        weight: number;
        height: number;
        heartRate: number;
        bloodPressureSystolic: number;
        bloodPressureDiastolic: number;
        bodyFatPercentage: number;
        steps: number;
        caloriesBurned: number;
        sleepHours: number;
        timestamp: string;
    };
    syncedAt: string;
}

export default function HealthConnectPage() {
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await healthConnectAPI.getStatus();
                const data = res.data.data;
                setConnected(data?.connected || false);
                setLastSync(data?.lastSyncAt || null);
            } catch {
                // Not connected
                setConnected(false);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleConnect = async () => {
        setConnecting(true);
        setError('');
        setSuccess('');
        try {
            const res = await healthConnectAPI.connect();
            const data = res.data.data;
            if (data?.authUrl) {
                // In a real app, we'd redirect. For demo, we simulate the callback.
                setSuccess('Connection initiated! Simulating OAuth callback...');
                // Auto-simulate the full connection
                await healthConnectAPI.simulate();
                setConnected(true);
                setSuccess('Successfully connected to Google Health Connect!');
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        setError('');
        setSuccess('');
        try {
            await healthConnectAPI.disconnect();
            setConnected(false);
            setSyncResult(null);
            setLastSync(null);
            setSuccess('Disconnected from Google Health Connect');
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setError('');
        setSuccess('');
        try {
            const res = await healthConnectAPI.sync();
            setSyncResult(res.data.data);
            setLastSync(new Date().toISOString());
            setSuccess('Health data synced successfully!');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
                    <Smartphone className="text-green-400" size={28} /> Health Connect
                </h1>
                <p className="text-gray-400 text-sm mt-1">Sync health data from Google Health Connect</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                    <XCircle size={16} /> {error}
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={16} /> {success}
                </div>
            )}

            {/* Connection Status Card */}
            <div className={`border rounded-2xl p-8 text-center space-y-4 ${connected
                ? 'bg-green-900/10 border-green-800/30'
                : 'bg-zinc-900/50 border-zinc-800'
                }`}>
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${connected
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-zinc-800 text-zinc-500'
                    }`}>
                    {connected ? <Wifi size={32} /> : <WifiOff size={32} />}
                </div>
                <div>
                    <h2 className="text-xl font-semibold">
                        {connected ? 'Connected' : 'Not Connected'}
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        {connected
                            ? `Last synced: ${lastSync ? new Date(lastSync).toLocaleString('en-LK', { timeZone: 'Asia/Colombo' }) : 'Never'}`
                            : 'Connect to automatically sync your health metrics'}
                    </p>
                </div>

                {connected ? (
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={handleSync} disabled={syncing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                            {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                            Sync Now
                        </button>
                        <button onClick={handleDisconnect}
                            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
                            <WifiOff size={16} /> Disconnect
                        </button>
                    </div>
                ) : (
                    <button onClick={handleConnect} disabled={connecting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
                        {connecting ? <Loader2 className="animate-spin" size={16} /> : <Smartphone size={16} />}
                        Connect Google Health
                    </button>
                )}
            </div>

            {/* Synced Data Display */}
            {syncResult?.data && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Last Synced Data</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricCard icon={<Activity className="text-red-400" size={20} />}
                            label="Heart Rate" value={`${syncResult.data.heartRate} bpm`} />
                        <MetricCard icon={<Heart className="text-pink-400" size={20} />}
                            label="Blood Pressure" value={`${syncResult.data.bloodPressureSystolic}/${syncResult.data.bloodPressureDiastolic} mmHg`} />
                        <MetricCard icon={<Zap className="text-yellow-400" size={20} />}
                            label="Weight" value={`${syncResult.data.weight} kg`} />
                        <MetricCard icon={<Activity className="text-blue-400" size={20} />}
                            label="Height" value={`${syncResult.data.height} cm`} />
                        <MetricCard icon={<Zap className="text-green-400" size={20} />}
                            label="Body Fat" value={`${syncResult.data.bodyFatPercentage}%`} />
                        <MetricCard icon={<Activity className="text-purple-400" size={20} />}
                            label="Steps" value={syncResult.data.steps.toLocaleString()} />
                        <MetricCard icon={<Zap className="text-orange-400" size={20} />}
                            label="Calories Burned" value={`${syncResult.data.caloriesBurned} kcal`} />
                        <MetricCard icon={<Heart className="text-indigo-400" size={20} />}
                            label="Sleep" value={`${syncResult.data.sleepHours} hours`} />
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">How it works</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">1.</span>
                        Connect your Google Health Connect account
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">2.</span>
                        Your health metrics (heart rate, weight, body fat, BP) are securely synced
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">3.</span>
                        Data is recorded in your vitals history for trainers and your own tracking
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">4.</span>
                        Conflict resolution ensures only new data overwrites older readings
                    </li>
                </ul>
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <div className="text-xs text-zinc-500">{label}</div>
                <div className="text-lg font-semibold text-white">{value}</div>
            </div>
        </div>
    );
}
