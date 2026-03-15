"use client";

import { AuthProvider } from "../context/AuthContext";
import { SidebarProvider } from "../context/SidebarContext";
import { ToastProvider } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <SidebarProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </SidebarProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}
