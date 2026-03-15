"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
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
    Package,
    Tag,
    AlertTriangle,
    CalendarOff,
    Cpu,
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
                { label: 'Dashboard',       href: '/member/dashboard',     icon: LayoutDashboard },
                { label: 'My Subscription', href: '/member/subscription',  icon: CreditCard },
                { label: 'Workouts',        href: '/member/workouts',      icon: Dumbbell },
                { label: 'Appointments',    href: '/member/appointments',  icon: Calendar },
                { label: 'Progress & Stats', href: '/member/progress',      icon: TrendingUp },
                { label: 'Check-in',        href: '/member/checkin',       icon: QrCode },
            ];
        case 'trainer':
            return [
                { label: 'Dashboard',   href: '/trainer/dashboard',   icon: LayoutDashboard },
                { label: 'Check-in',    href: '/trainer/checkin',    icon: QrCode },
                { label: 'My Schedule', href: '/trainer/schedule',    icon: Calendar },
                { label: 'Members',     href: '/trainer/members',    icon: Users },
                { label: 'Equipment',   href: '/trainer/equipment',   icon: Wrench },
                { label: 'Inventory',   href: '/trainer/inventory',   icon: Package },
                { label: 'Assistance',  href: '/trainer/assistance', icon: HelpCircle },
                { label: 'Tasks',       href: '/trainer/tasks',      icon: ClipboardList },
                { label: 'Simulate',    href: '/simulate',            icon: Cpu },
            ];
        case 'manager':
            return [
                { label: 'Dashboard',     href: '/manager/dashboard',     icon: LayoutDashboard },
                { label: 'Insights',     href: '/manager/insights',      icon: BarChart3 },
                { label: 'Members',       href: '/manager/members',       icon: Users },
                { label: 'Staff',         href: '/manager/staff',         icon: UserCheck },
                { label: 'Subscriptions', href: '/manager/subscriptions', icon: CreditCard },
                { label: 'Equipment',     href: '/manager/equipment',     icon: Wrench },
                { label: 'Inventory',     href: '/manager/inventory',     icon: Package },
                { label: 'Reports',       href: '/manager/reports',       icon: TrendingUp },
                { label: 'Check-in',      href: '/manager/checkin',       icon: QrCode },
                { label: 'Closures',      href: '/manager/closures',      icon: CalendarOff },
                { label: 'Simulate',      href: '/simulate',              icon: Cpu },
            ];
        case 'admin':
            return [
                { label: 'Dashboard',       href: '/admin/dashboard',       icon: LayoutDashboard },
                { label: 'Users',           href: '/admin/users',          icon: Users },
                { label: 'ID Verification', href: '/admin/id-verification', icon: ShieldCheck },
                { label: 'Plans',            href: '/admin/plans',          icon: CreditCard },
                { label: 'Promotions',      href: '/admin/promotions',     icon: Tag },
                { label: 'Activities',      href: '/admin/activities',     icon: Activity },
                { label: 'Reports',         href: '/admin/reports',       icon: BarChart3 },
                { label: 'Settings',        href: '/admin/settings',       icon: Settings },
                { label: 'Check-in',        href: '/admin/checkin',        icon: QrCode },
                { label: 'System Alerts',   href: '/admin/alerts',         icon: AlertTriangle },
                { label: 'Simulate',        href: '/simulate',              icon: Cpu },
            ];
        default:
            return [{ label: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard }];
    }
}

export function Sidebar() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const role = user?.role ?? 'member';
    const navItems = navForRole(role);

    const SidebarContent = () => (
        <div className="flex flex-col h-full min-h-0">
            {/* Navigation only — profile and sign out are in the shared navbar */}
            <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
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
        </div>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-[#252526]/95 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-4">
                <span className="text-sm font-semibold text-white">PowerWorld</span>
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
                    <div className="absolute left-0 top-16 bottom-0 w-72 bg-[#252526] border-r border-zinc-800/50 shadow-2xl">
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar — full viewport height, no logo */}
            <aside className="hidden md:flex flex-col w-56 bg-[#252526] border-r border-zinc-800/50 h-screen sticky top-0 shrink-0 overflow-hidden">
                <SidebarContent />
            </aside>
        </>
    );
}
