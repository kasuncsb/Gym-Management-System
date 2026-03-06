"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, Role, dashboardPathForRole } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

/**
 * Wraps dashboard pages to enforce authentication and role checks.
 * - Not logged in → redirect to /login
 * - Wrong role → redirect to correct dashboard
 * - Loading → show spinner
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            router.replace(dashboardPathForRole(user.role));
        }
    }, [isLoading, isAuthenticated, user, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

    return <>{children}</>;
}
