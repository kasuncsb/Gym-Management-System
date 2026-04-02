"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { bottomNavPrimaryItems } from "@/lib/nav/roleNav";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { toggleMobileSidebar } = useSidebar();
  const role = user?.role ?? "member";
  const primary = bottomNavPrimaryItems(role);

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-[45] border-t border-zinc-800/80 bg-[#1e1e1e]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-7xl items-stretch justify-around gap-1 px-2 pt-1">
        {primary.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-[10px] font-medium sm:text-xs",
                isActive ? "text-red-400" : "text-zinc-400 active:text-white",
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.25 : 2} className={cn("shrink-0", isActive && "text-red-400")} />
              <span className="truncate px-0.5 text-center leading-tight">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => toggleMobileSidebar()}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-[10px] font-medium text-zinc-400 active:text-white sm:text-xs"
          aria-label="Open menu for more navigation"
        >
          <Menu size={22} className="shrink-0" />
          <span className="leading-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
