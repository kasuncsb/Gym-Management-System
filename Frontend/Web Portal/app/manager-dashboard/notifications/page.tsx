'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Bell, Loader2, CheckCircle2, Check, CheckCheck,
    Mail, AlertCircle, Info, MessageSquare, RefreshCw
} from 'lucide-react';
import { notificationAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
    alert: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    message: { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    reminder: { icon: Bell, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

export default function ManagerNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [notifsRes, countRes] = await Promise.all([
                notificationAPI.getAll(100, filter === 'unread'),
                notificationAPI.getUnreadCount(),
            ]);
            setNotifications(notifsRes.data.data || []);
            setUnreadCount(countRes.data.data?.unreadCount || 0);
        } catch (e) {
            console.error('Failed to load notifications:', e);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleMarkRead = async (id: string) => {
        try {
            await notificationAPI.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error('Failed to mark notification as read:', e);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error('Failed to mark all as read:', e);
        }
    };

    const formatRelativeTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Notifications</h2>
                    <p className="text-zinc-400 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition font-medium"
                        >
                            <CheckCheck size={18} /> Mark All Read
                        </button>
                    )}
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition font-medium"
                    >
                        <RefreshCw size={18} /> Refresh
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800 w-fit">
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        filter === 'all' ? 'bg-red-700 text-white' : 'text-zinc-400 hover:text-white'
                    )}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        filter === 'unread' ? 'bg-red-700 text-white' : 'text-zinc-400 hover:text-white'
                    )}
                >
                    Unread ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-16 text-center">
                    <Bell className="mx-auto mb-4 text-zinc-600" size={40} />
                    <h3 className="text-xl font-semibold text-zinc-300">
                        {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
                    </h3>
                    <p className="text-zinc-500 mt-2">
                        {filter === 'unread' ? 'You\'re all caught up!' : 'Notifications will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map(notification => {
                        const typeStyle = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
                        const Icon = typeStyle.icon;
                        return (
                            <div
                                key={notification.id}
                                className={cn(
                                    'rounded-2xl border p-5 transition-all group',
                                    notification.isRead
                                        ? 'border-zinc-800/50 bg-black/20'
                                        : 'border-zinc-800 bg-black/40 hover:border-zinc-700'
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn('p-2.5 rounded-xl shrink-0', typeStyle.bg)}>
                                        <Icon size={18} className={typeStyle.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h4 className={cn(
                                                    'font-semibold',
                                                    notification.isRead ? 'text-zinc-400' : 'text-white'
                                                )}>
                                                    {notification.title}
                                                </h4>
                                                <p className={cn(
                                                    'text-sm mt-1',
                                                    notification.isRead ? 'text-zinc-600' : 'text-zinc-400'
                                                )}>
                                                    {notification.message}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-zinc-600">
                                                    {formatRelativeTime(notification.createdAt)}
                                                </span>
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => handleMarkRead(notification.id)}
                                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition opacity-0 group-hover:opacity-100"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
