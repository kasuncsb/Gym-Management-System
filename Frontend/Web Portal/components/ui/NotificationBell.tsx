"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, X, Check, CheckCheck, Loader2 } from "lucide-react";
import { notificationAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export function NotificationBell() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const fetchCount = async () => {
        try {
            const res = await notificationAPI.getUnreadCount();
            setUnreadCount(res.data.data?.count || 0);
        } catch { /* silent */ }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationAPI.getAll(20);
            setNotifications(res.data.data || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!user) return;
        fetchCount();
        const interval = setInterval(fetchCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = async (id: string) => {
        try {
            await notificationAPI.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const typeColors: Record<string, string> = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
        payment: 'bg-green-500',
        subscription: 'bg-purple-500',
        session: 'bg-blue-500',
        system: 'bg-zinc-500',
    };

    if (!user) return null;

    return (
        <div ref={ref} className="relative">
            <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-112 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                        <span className="text-sm font-semibold text-white">Notifications</span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition">
                                    <CheckCheck size={14} /> Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition"><X size={16} /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-500" size={20} /></div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={cn('px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition cursor-pointer', !n.isRead && 'bg-zinc-800/30')}
                                    onClick={() => !n.isRead && markRead(n.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', n.isRead ? 'bg-transparent' : (typeColors[n.type] || 'bg-blue-500'))} />
                                        <div className="min-w-0 flex-1">
                                            <p className={cn('text-sm', n.isRead ? 'text-zinc-400' : 'text-white font-medium')}>{n.title}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-zinc-600 mt-1">{new Date(n.createdAt).toLocaleString('en-LK')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
