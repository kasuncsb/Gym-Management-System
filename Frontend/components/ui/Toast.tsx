"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────── */

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toast: (opts: Omit<Toast, "id">) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

/* ── Provider ───────────────────────────────────────── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counterRef = useRef(0);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (opts: Omit<Toast, "id">) => {
            const id = `toast-${++counterRef.current}`;
            const toast: Toast = { ...opts, id, duration: opts.duration ?? 4000 };
            setToasts((prev) => [...prev, toast]);

            if ((toast.duration ?? 0) > 0) {
                setTimeout(() => dismiss(id), toast.duration);
            }
        },
        [dismiss]
    );

    const contextValue: ToastContextType = {
        toast: addToast,
        success: (title, message) => addToast({ type: "success", title, message }),
        error: (title, message) => addToast({ type: "error", title, message, duration: 6000 }),
        info: (title, message) => addToast({ type: "info", title, message }),
        warning: (title, message) => addToast({ type: "warning", title, message, duration: 5000 }),
        dismiss,
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/* ── Single Toast ───────────────────────────────────── */

const iconMap: Record<ToastType, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const colorMap: Record<ToastType, string> = {
    success: "border-emerald-500/30 bg-emerald-950/80",
    error: "border-red-500/30 bg-red-950/80",
    info: "border-blue-500/30 bg-blue-950/80",
    warning: "border-amber-500/30 bg-amber-950/80",
};

const iconColorMap: Record<ToastType, string> = {
    success: "text-emerald-400",
    error: "text-red-400",
    info: "text-blue-400",
    warning: "text-amber-400",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const [isExiting, setIsExiting] = useState(false);
    const Icon = iconMap[toast.type];

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 200);
    }, [onDismiss, toast.id]);

    return (
        <div
            className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-lg shadow-2xl transition-all duration-300",
                colorMap[toast.type],
                isExiting
                    ? "opacity-0 translate-x-4 scale-95"
                    : "opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-5 fade-in duration-300"
            )}
        >
            <Icon className={cn("mt-0.5 shrink-0", iconColorMap[toast.type])} size={18} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{toast.message}</p>
                )}
            </div>
            <button
                onClick={handleDismiss}
                className="shrink-0 text-zinc-500 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
}
