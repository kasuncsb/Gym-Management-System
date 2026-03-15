'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, User, LogOut, Home, LayoutDashboard } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth, dashboardPathForRole } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";

/** Routes where the shared navbar is hidden (standalone / intermediate auth pages). */
const NAVBAR_EXCLUDED_PATHS = [
  '/login',
  '/member/register',
  '/member/forgot-password',
  '/member/verify-email',
  '/member/reset-password',
  '/member/onboard',
];

function profileHrefForRole(role: string): string {
  switch (role) {
    case 'member': return '/member/profile';
    case 'trainer': return '/trainer/profile';
    case 'manager': return '/manager/profile';
    case 'admin': return '/admin/profile';
    default: return '/member/profile';
  }
}

function ProfileAvatar({ initials }: { initials: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = authAPI.profileAvatarUrl();
  if (imgFailed) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm shrink-0">
        {initials}
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
      <img src={url} alt="" className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const excluded = NAVBAR_EXCLUDED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isHome = pathname === '/';
  const showNavLinks = isHome; // Features, Classes, Pricing only on home
  const role = user?.role ?? 'member';
  const initials = user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  if (excluded) return null;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/#features" },
    { name: "Classes", href: "/#classes" },
    { name: "Pricing", href: "/#pricing" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 border-b",
        !mounted ? "bg-transparent border-transparent" : scrolled
          ? "bg-[#1e1e1e]/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-red-900/5"
          : "bg-[#1e1e1e]/80 backdrop-blur-xl border-white/10"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center group relative shrink-0">
          <div className="relative h-7 md:h-12 w-auto group-hover:scale-105 transition-all duration-300">
            <Image src="/logo.svg" alt="PowerWorld" width={162} height={50} className="h-7 md:h-12 w-auto object-contain" priority />
          </div>
        </Link>

        {/* Desktop center: home links only on home */}
        <div className="hidden md:flex items-center gap-10">
          {showNavLinks && navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative text-sm font-semibold uppercase tracking-wide text-zinc-400 hover:text-white transition-colors py-2 group overflow-hidden"
            >
              <span className="relative z-10">{link.name}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-red-800 group-hover:w-full transition-all duration-300 ease-out" />
            </Link>
          ))}
        </div>

        {/* Desktop right: auth or profile dropdown only */}
        <div className="hidden md:flex items-center gap-4">
          {!mounted || authLoading ? (
            <div className="w-10 h-10" />
          ) : isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-red-500/50"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <ProfileAvatar initials={initials} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 py-1 rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl z-50">
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Home size={16} />
                    Home
                  </Link>
                  <Link
                    href={dashboardPathForRole(role)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <Link
                    href={profileHrefForRole(role)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700/50 hover:text-red-400 transition-colors"
                    onClick={() => { setMenuOpen(false); logout(); }}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold text-zinc-300 hover:text-white transition-colors relative group">
                Login
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/member/register"
                className="relative px-8 py-3 bg-gradient-to-r from-red-700 to-red-900 text-white font-bold rounded-full hover:from-red-600 hover:to-red-800 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] overflow-hidden group"
              >
                <span className="relative z-10">JOIN NOW</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-white/20 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-zinc-400 hover:text-white transition-all duration-300 active:scale-95"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            <Menu size={28} className={cn("absolute transition-all duration-300", isOpen ? "opacity-0 scale-50" : "opacity-100 scale-100")} />
            <X size={28} className={cn("absolute transition-all duration-300", isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
          </div>
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={cn(
          "md:hidden relative w-full px-6 flex flex-col items-center gap-5 transition-all duration-500 ease-out overflow-hidden border-t",
          isOpen ? "max-h-[28rem] py-6 border-white/10 opacity-100" : "max-h-0 py-0 border-transparent opacity-0"
        )}
      >
        {showNavLinks && navLinks.map((link, i) => (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "relative text-sm font-semibold uppercase tracking-[0.2em] hover:text-white py-1 transition-all duration-500 ease-out text-zinc-400",
              isOpen ? "translate-y-0 opacity-100" : "text-transparent -translate-y-4 opacity-0"
            )}
            style={{ transitionDelay: isOpen ? `${i * 75}ms` : '0ms' }}
            onClick={() => setIsOpen(false)}
          >
            {link.name}
          </Link>
        ))}

        {isAuthenticated && user && (
          <>
            <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium" onClick={() => setIsOpen(false)}>
              <Home size={18} />
              Home
            </Link>
            <Link href={dashboardPathForRole(role)} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium" onClick={() => setIsOpen(false)}>
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link href={profileHrefForRole(role)} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium" onClick={() => setIsOpen(false)}>
              <User size={18} />
              Profile
            </Link>
            <button
              type="button"
              className="flex items-center gap-2 text-zinc-400 hover:text-red-400 text-sm font-medium"
              onClick={() => { setIsOpen(false); logout(); }}
            >
              <LogOut size={18} />
              Sign out
            </button>
          </>
        )}

        {!authLoading && !isAuthenticated && (
          <div className="flex flex-col items-center gap-4 w-full">
            <Link href="/login" className="text-sm font-bold text-zinc-300 hover:text-white" onClick={() => setIsOpen(false)}>
              Login
            </Link>
            <Link
              href="/member/register"
              className="px-6 py-2 bg-gradient-to-r from-red-700 to-red-900 text-white font-bold rounded-full hover:from-red-600 hover:to-red-800 text-sm"
              onClick={() => setIsOpen(false)}
            >
              JOIN NOW
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
