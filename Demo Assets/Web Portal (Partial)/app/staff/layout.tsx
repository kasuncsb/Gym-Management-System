'use client';

import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['staff', 'trainer']}>
            {children}
        </ProtectedRoute>
    );
}
