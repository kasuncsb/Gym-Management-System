'use client';

import { Sidebar } from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="flex min-h-screen bg-black text-white">
                <Sidebar />
                <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-auto pt-20 md:pt-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
