"use client";

import { useState, useEffect } from "react";
import { healthConnectAPI, getErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader, Card, ErrorAlert, LoadingButton, Badge } from "@/components/ui/SharedComponents";
import {
    Smartphone, Wifi, WifiOff, RefreshCw, Heart,
    Activity, Zap, Moon, Footprints, Scale,
} from "lucide-react";

interface SyncData {
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
}

export default function HealthConnectPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [syncData, setSyncData] = useState<SyncData | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await healthConnectAPI.getStatus();
                const data = res.data.data;
                setConnected(data?.connected || false);
                setLastSync(data?.lastSyncAt || null);
            } catch {
                setConnected(false);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleConnect = async () => {
        setConnecting(true);
        setError("");
        try {
            const res = await healthConnectAPI.connect();
            if (res.data.data?.authUrl) {
                await healthConnectAPI.simulate();
                setConnected(true);
                toast.success("Connected!", "Successfully connected to Google Health Connect.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
            toast.error("Connection failed", getErrorMessage(err));
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await healthConnectAPI.disconnect();
            setConnected(false);
            setSyncData(null);
            setLastSync(null);
            toast.info("Disconnected", "Google Health Connect has been disconnected.");
        } catch (err) {
            toast.error("Failed", getErrorMessage(err));
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await healthConnectAPI.sync();
            setSyncData(res.data.data?.data || null);
            setLastSync(new Date().toISOString());
            toast.success("Synced!", "Health data has been synced to your vitals.");
        } catch (err) {
            toast.error("Sync failed", getErrorMessage(err));
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 page-enter">
                <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72" /></div>
                <Skeleton className="h-48 w-full rounded-2xl" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    const metrics = syncData ? [
        { icon: Activity, color: "red", label: "Heart Rate", value: `${syncData.heartRate}`, unit: "bpm" },
        { icon: Heart, color: "pink", label: "Blood Pressure", value: `${syncData.bloodPressureSystolic}/${syncData.bloodPressureDiastolic}`, unit: "mmHg" },
        { icon: Scale, color: "blue", label: "Weight", value: `${syncData.weight}`, unit: "kg" },
        { icon: Zap, color: "amber", label: "Body Fat", value: `${syncData.bodyFatPercentage}`, unit: "%" },
        { icon: Footprints, color: "green", label: "Steps", value: syncData.steps.toLocaleString(), unit: "" },
        { icon: Zap, color: "orange", label: "Calories", value: `${syncData.caloriesBurned}`, unit: "kcal" },
        { icon: Moon, color: "indigo", label: "Sleep", value: `${syncData.sleepHours}`, unit: "hours" },
    ] : [];

    return (
        <div className="space-y-8 page-enter">
            <PageHeader
                title="Health Connect"
                subtitle="Sync health data from Google Health Connect"
                badge={connected ? "Connected" : "Not Connected"}
                badgeColor={connected ? "green" : "zinc"}
            />

            {error && <ErrorAlert message={error} />}

            {/* Connection Status */}
            <Card className={`text-center relative overflow-hidden ${connected ? "border-emerald-800/30" : ""}`}>
                {connected && <div className="absolute inset-0 bg-linear-to-b from-emerald-600/5 to-transparent pointer-events-none" />}
                <div className="relative space-y-4">
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                        connected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}>
                        {connected ? <Wifi size={32} /> : <WifiOff size={32} />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {connected ? "Connected to Health Connect" : "Not Connected"}
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">
                            {connected
                                ? `Last synced: ${lastSync ? new Date(lastSync).toLocaleString("en-LK", { timeZone: "Asia/Colombo" }) : "Never"}`
                                : "Connect to automatically sync your health metrics from your wearable devices"
                            }
                        </p>
                    </div>

                    {connected ? (
                        <div className="flex items-center justify-center gap-3">
                            <LoadingButton
                                loading={syncing}
                                icon={RefreshCw}
                                onClick={handleSync}
                                variant="primary"
                            >
                                Sync Now
                            </LoadingButton>
                            <LoadingButton
                                icon={WifiOff}
                                onClick={handleDisconnect}
                                variant="ghost"
                            >
                                Disconnect
                            </LoadingButton>
                        </div>
                    ) : (
                        <LoadingButton
                            loading={connecting}
                            icon={Smartphone}
                            onClick={handleConnect}
                        >
                            Connect Google Health
                        </LoadingButton>
                    )}
                </div>
            </Card>

            {/* Synced Metrics */}
            {metrics.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Last Synced Data</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-in">
                        {metrics.map(({ icon: Icon, color, label, value, unit }, i) => (
                            <Card key={i} className="relative overflow-hidden">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center shrink-0`}>
                                        <Icon size={20} className={`text-${color}-400`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-zinc-500 truncate">{label}</p>
                                        <p className="text-lg font-bold text-white leading-tight">
                                            {value} {unit && <span className="text-xs text-zinc-500 font-normal">{unit}</span>}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* How it works */}
            <Card>
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">How it works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { num: "1", text: "Connect your Google Health Connect account safely" },
                        { num: "2", text: "Health metrics (heart rate, weight, BP, body fat) are securely synced" },
                        { num: "3", text: "Data is recorded in your vitals history for tracking" },
                        { num: "4", text: "Smart conflict resolution ensures data accuracy" },
                    ].map((item) => (
                        <div key={item.num} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/20">
                            <span className="w-6 h-6 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold flex items-center justify-center shrink-0">{item.num}</span>
                            <p className="text-sm text-zinc-400 leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
