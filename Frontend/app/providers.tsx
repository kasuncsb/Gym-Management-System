"use client";

import { AuthProvider } from "../context/AuthContext";
import { SidebarProvider } from "../context/SidebarContext";
import { ToastProvider } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { GlobalLoadingOverlay } from "@/components/pwa/GlobalLoadingOverlay";
import { PwaErrorMask } from "@/components/pwa/PwaErrorMask";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";

export function Providers({ children }: { children: React.ReactNode }) {
    const isStandalone = useIsStandalonePwa();
    return (
        <ErrorBoundary fallback={isStandalone === true ? <PwaErrorMask /> : undefined}>
            <AuthProvider>
                <SidebarProvider>
                    <ToastProvider>
                        <GlobalLoadingOverlay />
                        {children}
                    </ToastProvider>
                </SidebarProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}
