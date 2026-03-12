"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-xl bg-zinc-800/60",
                className
            )}
            style={style}
        />
    );
}

/* ── Pre-built skeleton patterns ────────────────────── */

export function SkeletonCard() {
    return (
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-full" />
        </div>
    );
}

export function SkeletonStatCard() {
    return (
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid gap-4 p-4 border-b border-zinc-800" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={`h-${i}`} className="h-4 w-full" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div
                    key={`r-${r}`}
                    className="grid gap-4 p-4 border-b border-zinc-800/50 last:border-0"
                    style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                >
                    {Array.from({ length: cols }).map((_, c) => (
                        <Skeleton key={`${r}-${c}`} className="h-4 w-full" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-end gap-2 h-48">
                {/* Deterministic heights — Math.random() causes hydration mismatch */}
                {[65, 40, 85, 30, 70, 50, 90, 35, 75, 55, 45, 80].map((h, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t-md"
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function SkeletonPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonStatCard key={i} />
                ))}
            </div>
            {/* Content */}
            <SkeletonTable rows={6} cols={5} />
        </div>
    );
}
