"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Dumbbell,
    Calendar,
    TrendingUp,
    QrCode,
    Users,
    Wrench,
    ClipboardList,
    HelpCircle,
    BarChart3,
    UserCheck,
    Settings,
    Activity,
    CreditCard,
    ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/context/AuthContext";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type NavItem = { label: string; href: string; icon: React.ElementType };

function navForRole(role: string): NavItem[] {
    switch (role) {
        case 'member':
            return [
                { label: 'Dashboard',     href: '/member/dashboard',     icon: LayoutDashboard },
                { label: 'Workouts',      href: '/member/workouts',      icon: Dumbbell },
                { label: 'Appointments',  href: '/member/appointments',  icon: Calendar },
                { label: 'Progress',      href: '/member/progress',      icon: TrendingUp },
                { label: 'Check-in',      href: '/member/checkin',       icon: QrCode },
            ];
        case 'trainer':
            return [
                { label: 'Dashboard',  href: '/trainer/dashboard',  icon: LayoutDashboard },
                { label: 'Check-in',   href: '/trainer/checkin',    icon: QrCode },
                { label: 'Equipment',  href: '/trainer/equipment',  icon: Wrench },
                { label: 'Tasks',      href: '/trainer/tasks',      icon: ClipboardList },
                { label: 'Assistance', href: '/trainer/assistance', icon: HelpCircle },
            ];
        case 'manager':
            return [
                { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
                { label: 'Insights',  href: '/manager/insights',  icon: BarChart3 },
                { label: 'Members',   href: '/manager/members',   icon: Users },
                { label: 'Staff',     href: '/manager/staff',     icon: UserCheck },
                { label: 'Reports',   href: '/manager/reports',   icon: TrendingUp },
                { label: 'Check-in',  href: '/manager/checkin',   icon: QrCode },
            ];
        case 'admin':
            return [
                { label: 'Dashboard',  href: '/admin/dashboard',   icon: LayoutDashboard },
                { label: 'Users',      href: '/admin/users',        icon: Users },
                { label: 'Plans',      href: '/admin/plans',        icon: CreditCard },
                { label: 'Activities', href: '/admin/activities',   icon: Activity },
                { label: 'Reports',    href: '/admin/reports',      icon: BarChart3 },
                { label: 'Settings',   href: '/admin/settings',     icon: Settings },
                { label: 'Check-in',   href: '/admin/checkin',      icon: ShieldCheck },
            ];
        default:
            return [{ label: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard }];
    }
}

const ROLE_LABELS: Record<string, string> = {
    admin:   'Administrator',
    manager: 'Manager',
    trainer: 'Trainer',
    member:  'Member',
};

const ROLE_BADGE: Record<string, string> = {
    admin:   'bg-purple-500/20 text-purple-400',
    manager: 'bg-blue-500/20 text-blue-400',
    trainer: 'bg-amber-500/20 text-amber-400',
    member:  'bg-emerald-500/20 text-emerald-400',
};

export function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const role = user?.role ?? 'member';
    const navItems = navForRole(role);

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-zinc-800/50">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative h-10 w-auto group-hover:scale-105 transition-transform">
                        <Image
                            src="/logo.svg"
                            alt="PowerWorld"
                            width={140}
                            height={40}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>
                </Link>
            </div>

            {/* User Info */}
            {mounted && user && (
                <div className="px-4 py-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm">
                            {user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", ROLE_BADGE[role] ?? 'bg-zinc-500/20 text-zinc-400')}>
                                {ROLE_LABELS[role] ?? role}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map(({ label, href, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-red-600/15 text-red-400 shadow-sm"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            )}
                        >
                            <Icon size={18} className={isActive ? "text-red-400" : ""} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-zinc-800/50">
                <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="PowerWorld" width={120} height={32} className="h-8 w-auto" />
                </Link>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-16 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800/50 shadow-2xl">
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-zinc-950/50 border-r border-zinc-800/30 min-h-screen sticky top-0">
                <SidebarContent />
            </aside>
        </>
    );
}
