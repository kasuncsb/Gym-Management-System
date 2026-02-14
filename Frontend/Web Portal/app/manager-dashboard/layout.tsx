'use client';

import { Sidebar } from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['manager']}>
            <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-red-600/30">
                <Sidebar />
                <main className="transition-all duration-300 md:ml-64 min-h-screen">
                    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
