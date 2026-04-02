"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { navForRole } from "@/lib/nav/roleNav";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { mobileSidebarOpen, closeMobileSidebar } = useSidebar();

  // Keep this in sync with the navbar height (h-24 in Navbar.tsx → 6rem → 96px)
  const NAVBAR_HEIGHT = 96;

  const role = user?.role ?? "member";
  const navItems = navForRole(role);

  const SidebarContent = () => (
    <div className="flex flex-col h-full min-h-0">
      {/* Navigation only — profile and sign out are in the shared navbar */}
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={closeMobileSidebar}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-red-600/15 text-red-400 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
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
