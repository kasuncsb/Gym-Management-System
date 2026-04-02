'use client';

import { Sidebar } from "@/components/ui/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { MemberChatbot } from '@/components/ai/MemberChatbot';
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
    const showMobileNav = useIsStandalonePwa();
    return (
        <ProtectedRoute allowedRoles={['manager']}>
            <div className="flex min-h-screen bg-app text-white">
                <Sidebar />
                <main className="flex-1 min-w-0 relative overflow-auto pt-24">
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#3c3c3c35_1px,transparent_1px),linear-gradient(to_bottom,#3c3c3c35_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_80%_20%,black_20%,transparent_70%)] pointer-events-none" />
                    <div className="relative z-10 w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
                        {children}
                    </div>
                    <MemberChatbot role="manager" />
                    {showMobileNav && <MobileBottomNav />}
                </main>
            </div>
        </ProtectedRoute>
    );
}
