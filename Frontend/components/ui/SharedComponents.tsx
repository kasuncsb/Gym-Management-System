"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, X } from "lucide-react";

/* ── Label ──────────────────────────────────────────── */

interface LabelProps {
    children: React.ReactNode;
    htmlFor?: string;
    required?: boolean;
    className?: string;
}

export function Label({ children, htmlFor, required, className }: LabelProps) {
    return (
        <label
            htmlFor={htmlFor}
            className={cn(
                "block text-sm font-medium text-zinc-300 mb-1.5",
                required && "after:content-['*'] after:ml-0.5 after:text-red-500",
                className
            )}
        >
            {children}
        </label>
    );
}

/* ── Input ───────────────────────────────────────────── */

const inputBaseClass = "w-full bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
    label?: string;
    error?: string;
    id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, id, className, ...props }, ref) => {
        const fallbackId = useId();
        const inputId = id ?? props.name ?? fallbackId;
        return (
            <div className="space-y-1.5">
                {label && <Label htmlFor={inputId}>{label}</Label>}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(inputBaseClass, error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500", className)}
                    {...props}
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";

/* ── Textarea ────────────────────────────────────────── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    id?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, id, className, ...props }, ref) => {
        const fallbackId = useId();
        const textareaId = id ?? props.name ?? fallbackId;
        return (
            <div className="space-y-1.5">
                {label && <Label htmlFor={textareaId}>{label}</Label>}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(inputBaseClass, "min-h-[100px] resize-y", error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500", className)}
                    {...props}
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
        );
    }
);
Textarea.displayName = "Textarea";

/* ── Select ─────────────────────────────────────────── */

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
    label?: string;
    error?: string;
    options: SelectOption[] | readonly { value: string; label: string }[];
    placeholder?: string;
    id?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, id, className, ...props }, ref) => {
        const fallbackId = useId();
        const selectId = id ?? props.name ?? fallbackId;
        return (
            <div className="space-y-1.5">
                {label && <Label htmlFor={selectId}>{label}</Label>}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(inputBaseClass, "appearance-none cursor-pointer", error && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500", className)}
                    {...props}
                >
                    {placeholder && (
                        <option value="">{placeholder}</option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
        );
    }
);
Select.displayName = "Select";

/* ── PageHeader ─────────────────────────────────────── */

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    action?: React.ReactNode;
    badge?: string;
    badgeColor?: "red" | "green" | "blue" | "amber" | "purple" | "zinc";
    children?: React.ReactNode;
}

const badgeColorMap: Record<string, string> = {
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    zinc: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export function PageHeader({ title, subtitle, actions, action, badge, badgeColor = "red", children }: PageHeaderProps) {
    const actionContent = actions || action || children;
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
                    {badge && (
                        <span className={cn("text-xs px-2.5 py-1 rounded-full border font-medium", badgeColorMap[badgeColor])}>
                            {badge}
                        </span>
                    )}
                </div>
                {subtitle && <p className="text-zinc-400 mt-1 text-sm sm:text-base">{subtitle}</p>}
            </div>
            {actionContent && (
                <div className="flex items-center gap-3 min-w-0 sm:shrink-0">
                    {actionContent}
                </div>
            )}
        </div>
    );
}

/* ── EmptyState ─────────────────────────────────────── */

interface EmptyStateProps {
    icon: LucideIcon | React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, action, actionLabel, onAction }: EmptyStateProps) {
    const isLucideIcon = typeof Icon === 'function';
    return (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4">
                {isLucideIcon ? <Icon className="text-zinc-500" size={28} /> : Icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            {description && <p className="text-sm text-zinc-400 max-w-sm mb-4">{description}</p>}
            {action}
            {actionLabel && onAction && (
                <button onClick={onAction} className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

/* ── ErrorAlert ─────────────────────────────────────── */

interface ErrorAlertProps {
    message: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorAlert({ message, onRetry, className }: ErrorAlertProps) {
    return (
        <div className={cn("p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-4", className)}>
            <p className="text-red-400 text-sm">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="shrink-0 text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                >
                    Retry
                </button>
            )}
        </div>
    );
}

/* ── Badge ──────────────────────────────────────────── */

interface BadgeProps {
    children: React.ReactNode;
    variant?: "success" | "error" | "warning" | "info" | "default" | "outline";
    size?: "sm" | "md";
    className?: string;
}

const badgeVariantMap: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    default: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    outline: "bg-transparent text-zinc-400 border-zinc-700",
};

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center font-medium border rounded-full",
                badgeVariantMap[variant],
                size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
                className
            )}
        >
            {children}
        </span>
    );
}

/* ── Modal / Dialog ─────────────────────────────────── */

interface ModalProps {
    isOpen?: boolean;
    open?: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    showCloseButton?: boolean;
}

const sizeMap: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

export function Modal({ isOpen, open, onClose, title, description, children, size = "md", showCloseButton = true }: ModalProps) {
    if (!(isOpen ?? open)) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />
            {/* Panel */}
            <div
                className={cn(
                    "relative w-full bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300",
                    "hover:border-zinc-700/50 transition-colors",
                    sizeMap[size]
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="flex items-start justify-between gap-4 p-6 border-b border-zinc-800">
                    <div>
                        <h3 id="modal-title" className="text-lg font-bold text-white">{title}</h3>
                        {description && <p className="text-sm text-zinc-400 mt-1">{description}</p>}
                    </div>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="shrink-0 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

/* ── Confirmation Dialog ────────────────────────────── */

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message?: string;
    description?: string;
    confirmText?: string;
    confirmLabel?: string;
    variant?: "danger" | "warning" | "default";
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    description,
    confirmText,
    confirmLabel,
    variant = "default",
    loading = false,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const displayMessage = message || description || '';
    const displayConfirmText = confirmText || confirmLabel || 'Confirm';

    const btnClass =
        variant === "danger"
            ? "bg-red-700 hover:bg-red-600"
            : variant === "warning"
                ? "bg-amber-700 hover:bg-amber-600"
                : "bg-red-700 hover:bg-red-600";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-zinc-400 text-sm mb-6">{displayMessage}</p>
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg border border-zinc-700 hover:border-zinc-600"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={cn(
                        "px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium flex items-center gap-2",
                        btnClass,
                        loading && "opacity-60 cursor-not-allowed"
                    )}
                >
                    {loading && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {displayConfirmText}
                </button>
            </div>
        </Modal>
    );
}

/* ── LoadingButton ──────────────────────────────────── */

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    icon?: LucideIcon;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
}

const btnVariantMap: Record<string, string> = {
    primary: "bg-red-700 text-white hover:bg-red-800 border-transparent",
    secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700",
    danger: "bg-red-900/50 text-red-400 hover:bg-red-900/70 border-red-800/50",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800 border-transparent",
};

const btnSizeMap: Record<string, string> = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3",
};

export function LoadingButton({
    loading,
    icon: Icon,
    variant = "primary",
    size = "md",
    children,
    disabled,
    className,
    ...props
}: LoadingButtonProps) {
    return (
        <button
            disabled={loading || disabled}
            className={cn(
                "inline-flex items-center justify-center gap-2 font-medium rounded-xl border transition-all duration-200",
                btnVariantMap[variant],
                btnSizeMap[size],
                (loading || disabled) && "opacity-60 cursor-not-allowed",
                className
            )}
            {...props}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : Icon ? (
                <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
            ) : null}
            {children}
        </button>
    );
}

/* ── SearchInput ────────────────────────────────────── */

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
    "aria-label"?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search...", className, id, "aria-label": ariaLabel }: SearchInputProps) {
    const fallbackId = useId();
    const inputId = id ?? fallbackId;
    return (
        <div className={cn("relative", className)}>
            <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
            >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
                id={inputId}
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all"
                aria-label={ariaLabel ?? placeholder}
            />
        </div>
    );
}

/* ── Tabs ────────────────────────────────────────────── */

interface Tab {
    key?: string;
    id?: string;
    label: string;
    count?: number;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className="flex gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-x-auto">
            {tabs.map((tab) => {
                const tabKey = tab.key || tab.id || tab.label;
                return (
                    <button
                        key={tabKey}
                        onClick={() => onChange(tabKey)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                            activeTab === tabKey
                                ? "bg-red-700/25 text-red-400 border border-red-600/40"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        )}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded-full",
                                activeTab === tabKey ? "bg-red-600/30 text-red-400" : "bg-zinc-800 text-zinc-500"
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/* ── Card ────────────────────────────────────────────── */

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap: Record<string, string> = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};

export function Card({ children, className, padding = "md" }: CardProps) {
    return (
        <div className={cn(
            "bg-zinc-800/60 border border-zinc-700 rounded-2xl",
            paddingMap[padding],
            className
        )}>
            {children}
        </div>
    );
}
