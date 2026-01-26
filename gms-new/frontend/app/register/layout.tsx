'use client';

import { AuthProvider } from '@/contexts/AuthContext';

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthProvider>{children}</AuthProvider>;
}
