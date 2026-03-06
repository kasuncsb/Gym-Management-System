'use client';

import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['member']}>
            {children}
        </ProtectedRoute>
    );
}
