"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Enforces member flow: verify email → onboard → dashboard.
 * Use inside ProtectedRoute for member routes.
 */
export default function MemberGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading || !isAuthenticated || !user || user.role !== 'member') return;

        if (!user.emailVerified) {
            router.replace('/member/verify-email');
            return;
        }
        if (!user.isOnboarded) {
            router.replace('/member/onboard');
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) return null;
    if (user?.role !== 'member') return <>{children}</>;
    if (!user?.emailVerified || !user?.isOnboarded) return null;

    return <>{children}</>;
}
