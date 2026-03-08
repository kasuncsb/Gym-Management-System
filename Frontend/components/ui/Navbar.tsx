'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    // Hydration fix: suppress scroll-dependent classes until the client has
    // mounted. Without this, SSR renders 'bg-transparent' but the client
    // immediately applies 'bg-black/60' if the page is already scrolled,
    // causing a React #418 hydration mismatch.
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        // Set initial scroll position after mount
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Features", href: "/#features" },
        { name: "Classes", href: "/#classes" },
        { name: "Pricing", href: "/#pricing" },
    ];

    return (
        <nav className={cn(
            "fixed top-0 w-full z-50 transition-all duration-500 border-b",
            scrolled ? "bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl shadow-red-900/5" : "bg-transparent border-transparent"
        )}>
            <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                {/* Logo - Just the SVG image */}
                <Link href="/" className="flex items-center group relative">
                    <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full group-hover:bg-red-600/40 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                    <div className="relative h-14 w-auto group-hover:scale-105 transition-all duration-300">
                        <Image
                            src="/logo.svg"
                            alt="PowerWorld"
                            width={180}
                            height={56}
                            className="h-14 w-auto object-contain"
                            priority
                        />
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10">
                    {navLinks.map((link) => (
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

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-6">
                    <Link
                        href="/login"
                        className="text-sm font-bold text-zinc-300 hover:text-white transition-colors relative group"
                    >
                        Login
                        <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
                    </Link>
                    <Link
                        href="/register"
                        className="relative px-8 py-3 bg-gradient-to-r from-red-700 to-red-900 text-white font-bold rounded-full hover:from-red-600 hover:to-red-800 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] overflow-hidden group"
                    >
                        <span className="relative z-10">JOIN NOW</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-white/20 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden absolute top-24 left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-top-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-2xl font-bold text-zinc-400 hover:text-white tracking-tight"
                            onClick={() => setIsOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="h-px bg-white/10 my-2" />
                    <Link
                        href="/login"
                        className="text-2xl font-bold text-zinc-400 hover:text-white"
                        onClick={() => setIsOpen(false)}
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="px-6 py-4 bg-gradient-to-r from-red-700 to-red-900 text-white text-center font-bold rounded-xl text-lg hover:from-red-600 hover:to-red-800"
                        onClick={() => setIsOpen(false)}
                    >
                        Create Account
                    </Link>
                </div>
            )}
        </nav>
    );
}
