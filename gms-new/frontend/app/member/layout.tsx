'use client';

import { AuthProvider } from '@/contexts/AuthContext';

export default function MemberLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthProvider>{children}</AuthProvider>;
}
