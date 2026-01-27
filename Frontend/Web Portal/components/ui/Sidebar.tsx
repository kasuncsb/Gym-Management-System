"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Dumbbell,
    CalendarDays,
    Settings,
    LogOut,
    CreditCard,
    Menu,
    X,
    QrCode
} from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { useAuth } from "@/context/AuthContext";



export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);
    const { user, logout } = useAuth();

    // Navigation items based on role
    const getNavItems = () => {
        // Role specific items
        const adminItems = [
            { name: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
            { name: "Members", href: "/admin-dashboard/members", icon: Users },
            { name: "Billing", href: "/admin-dashboard/billing", icon: CreditCard },
            { name: "Settings", href: "/admin-dashboard/settings", icon: Settings },
        ];

        const staffItems = [
            { name: "Dashboard", href: "/staff-dashboard", icon: LayoutDashboard },
            { name: "Members", href: "/admin-dashboard/members", icon: Users }, // Accessing member management
            { name: "Check-in", href: "/staff-dashboard/check-in", icon: Dumbbell },
        ];

        const memberItems = [
            { name: "Dashboard", href: "/member", icon: LayoutDashboard },
            { name: "My Plan", href: "/member/subscription", icon: CreditCard },
            { name: "Access Pass", href: "/member/qr-code", icon: QrCode },
            { name: "Classes", href: "/member/classes", icon: CalendarDays },
            { name: "Workouts", href: "/member/workouts", icon: Dumbbell },
            { name: "Profile", href: "/member/profile", icon: Settings },
        ];

        switch (user?.role) {
            case 'admin': return adminItems;
            case 'manager': return staffItems; // Managers use staff dashboard + extra permissions
            case 'staff': return staffItems;
            case 'trainer': return staffItems; // Trainers share staff dashboard for now
            case 'member': return memberItems;
            default: return [{ name: "Dashboard", href: "/member", icon: LayoutDashboard }];
        }
    };

    const navItems = getNavItems();

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-900 text-white md:hidden border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out bg-black/90 backdrop-blur-xl border-r border-zinc-800",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    "md:translate-x-0" // Always visible on desktop
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <Link href="/" className="h-20 flex items-center px-6 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-red-600 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                            <Dumbbell className="text-white" size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-red-100 transition-colors">
                            Power<span className="text-red-500">World</span>
                        </h1>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        <div className="mb-4 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            Menu
                        </div>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? "bg-red-700/10 text-red-500 border border-red-600/20"
                                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 h-full w-1 bg-red-600 rounded-r-full" />
                                    )}
                                    <item.icon
                                        size={20}
                                        className={cn(
                                            "transition-transform duration-200 group-hover:scale-110",
                                            isActive ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-300"
                                        )}
                                    />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section / Logout */}
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
                        {user && (
                            <div className="mb-4 flex items-center gap-3 px-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-700 to-red-600 flex items-center justify-center border border-red-600/30">
                                    <span className="text-sm font-bold text-white uppercase">{user.name?.charAt(0) || 'U'}</span>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                    <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
