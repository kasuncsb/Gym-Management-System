'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MemberGuard from "@/components/auth/MemberGuard";

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
            <MemberGuard>
            <div className="flex min-h-screen bg-app text-white">
                <Sidebar />
                <main className="flex-1 min-w-0 relative overflow-auto pt-24">
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_80%_20%,black_20%,transparent_70%)] pointer-events-none" />
                    <div className="relative z-10 w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
                        {children}
                    </div>
                </main>
            </div>
            </MemberGuard>
        </ProtectedRoute>
    );
}
