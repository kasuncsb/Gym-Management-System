'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// These paths render their own full-page layouts and handle auth internally.
// Bypass the shared ProtectedRoute + Sidebar wrapper for them.
const BYPASS_PREFIXES = [
    '/member/register',
    '/member/forgot-password',
    '/member/verify-email',
    '/member/reset-password',
    '/member/onboard',
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const bypass = BYPASS_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));

    if (bypass) return <>{children}</>;

    return (
        <ProtectedRoute allowedRoles={['member']}>
            <div className="flex min-h-screen bg-black text-white">
                <Sidebar />
                <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-auto pt-20 md:pt-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
