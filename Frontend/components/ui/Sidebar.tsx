"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Dumbbell,
    Calendar,
    TrendingUp,
    QrCode,
    Users,
    Wrench,
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
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type NavItem = { label: string; href: string; icon: React.ElementType };

function navForRole(role: string): NavItem[] {
    switch (role) {
        case 'member':
            return [
                { label: 'Dashboard',        href: '/member/dashboard',     icon: LayoutDashboard },
                { label: 'Check-in',         href: '/member/checkin',       icon: QrCode },
                { label: 'My Subscription', href: '/member/subscription',  icon: CreditCard },
                { label: 'Workouts',         href: '/member/workouts',      icon: Dumbbell },
                { label: 'Appointments',     href: '/member/appointments',  icon: Calendar },
                { label: 'Progress & Stats', href: '/member/progress',      icon: TrendingUp },
            ];
        case 'trainer':
            return [
                { label: 'Dashboard',    href: '/trainer/dashboard',   icon: LayoutDashboard },
                { label: 'Check-in',     href: '/trainer/checkin',     icon: QrCode },
                { label: 'My Schedule',  href: '/trainer/schedule',    icon: Calendar },
                { label: 'Members',      href: '/trainer/members',     icon: Users },
                { label: 'Equipment',    href: '/trainer/equipment',   icon: Wrench },
                { label: 'Inventory',    href: '/trainer/inventory',   icon: Package },
            ];
        case 'manager':
            return [
                { label: 'Dashboard',      href: '/manager/dashboard',      icon: LayoutDashboard },
                { label: 'Check-in',       href: '/manager/checkin',        icon: QrCode },
                { label: 'Insights',       href: '/manager/insights',       icon: BarChart3 },
                { label: 'Members',        href: '/manager/members',        icon: Users },
                { label: 'Team',           href: '/manager/staff',          icon: UserCheck },
                { label: 'Subscriptions',  href: '/manager/subscriptions',  icon: CreditCard },
                { label: 'Promotions',     href: '/manager/promotions',     icon: Tag },
                { label: 'Equipment',      href: '/manager/equipment',      icon: Wrench },
                { label: 'Inventory',      href: '/manager/inventory',      icon: Package },
                { label: 'Closures',       href: '/manager/closures',       icon: CalendarOff },
            ];
        case 'admin':
            return [
                { label: 'Dashboard',       href: '/admin/dashboard',       icon: LayoutDashboard },
                { label: 'Check-in',        href: '/admin/checkin',         icon: QrCode },
                { label: 'Users',           href: '/admin/users',           icon: Users },
                { label: 'ID Verification', href: '/admin/id-verification', icon: ShieldCheck },
                { label: 'Activities',      href: '/admin/activities',      icon: Activity },
                { label: 'System Alerts',   href: '/admin/alerts',          icon: AlertTriangle },
                { label: 'Settings',        href: '/admin/settings',      icon: Settings },
            ];
        default:
            return [{ label: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard }];
    }
}

export function Sidebar() {
    const { user } = useAuth();
    const pathname = usePathname();
    const { mobileSidebarOpen, closeMobileSidebar } = useSidebar();

    // Keep this in sync with the navbar height (h-24 in Navbar.tsx → 6rem → 96px)
    const NAVBAR_HEIGHT = 96;

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
                            onClick={closeMobileSidebar}
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
            {/* Mobile Sidebar Overlay — starts directly under the existing navbar */}
            {mobileSidebarOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    {/* Clickable dim behind the drawer, but do NOT cover the navbar (top padding matches navbar height) */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        style={{ paddingTop: NAVBAR_HEIGHT }}
                        onClick={closeMobileSidebar}
                    />
                    <div
                        className="absolute left-0 bottom-0 w-72 bg-[#252526] border-r border-zinc-800/50 shadow-2xl"
                        style={{ top: NAVBAR_HEIGHT }}
                    >
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar — starts below navbar and can grow with page height */}
            <aside
                className="hidden md:flex flex-col w-56 bg-[#252526] border-r border-zinc-800/50 shrink-0 sticky self-start h-[calc(100vh-96px)] overflow-hidden"
                style={{ top: NAVBAR_HEIGHT }}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
