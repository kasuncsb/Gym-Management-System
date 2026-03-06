'use client';

import { Sidebar } from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-black text-white">
                <Sidebar />
                <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-auto">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
