'use client';

import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';
import { opsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface MaintenanceGateProps {
    children: React.ReactNode;
}

export default function MaintenanceGate({ children }: MaintenanceGateProps) {
    const { user } = useAuth();
    const [maintenance, setMaintenance] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        opsAPI.systemStatus().then((s) => {
            setMaintenance(!!s?.maintenanceMode);
        }).catch(() => {
            // If config fetch fails, allow access
        }).finally(() => setChecked(true));
    }, []);

    // While checking, render children (avoids flash)
    if (!checked) return <>{children}</>;

    // Admin bypasses maintenance mode
    if (!maintenance || user?.role === 'admin') return <>{children}</>;

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                    <Wrench size={40} className="text-yellow-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Under Maintenance</h1>
                    <p className="text-zinc-400 mt-2">
                        GymSphere is currently undergoing scheduled maintenance.
                        Please check back shortly.
                    </p>
                </div>
                <p className="text-zinc-600 text-sm">
                    For urgent assistance, contact the gym on{' '}
                    <span className="text-zinc-400">+10000000000</span>
                </p>
            </div>
        </div>
    );
}
