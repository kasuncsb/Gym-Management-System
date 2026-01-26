'use client';

import { AuthProvider } from '@/contexts/AuthContext';

export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthProvider>{children}</AuthProvider>;
}
