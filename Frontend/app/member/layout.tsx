'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar } from "@/components/ui/Sidebar";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MemberGuard from "@/components/auth/MemberGuard";
import { MemberChatbot } from '@/components/ai/MemberChatbot';

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
    const showMobileNav = useIsStandalonePwa();
    const bypass = BYPASS_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));

    if (bypass) return <>{children}</>;

    /**
     * Workout plans historically used an internal scroll grid.
     * For standalone PWA/mobile we want the content pane to scroll like other pages.
     */
    const workoutsScrollInsideBase =
        pathname === '/member/workouts' || pathname.startsWith('/member/workouts/');
    const workoutsScrollInside = workoutsScrollInsideBase && !showMobileNav;

    return (
        <ProtectedRoute allowedRoles={['member']}>
            <MemberGuard>
            <div className="flex h-svh min-h-0 w-full overflow-hidden bg-app text-white">
                <Sidebar />
                <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-24">
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_80%_20%,black_20%,transparent_70%)]" />
                    <div
                        className={cn(
                            'relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10 max-md:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]',
                            workoutsScrollInside ? 'overflow-hidden' : 'overflow-y-auto',
                        )}
                    >
                        {children}
                    </div>
                    <MemberChatbot />
                    {showMobileNav && <MobileBottomNav />}
                </main>
            </div>
            </MemberGuard>
        </ProtectedRoute>
    );
}
