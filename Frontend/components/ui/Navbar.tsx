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
            !mounted ? "bg-transparent border-transparent" : scrolled ? "bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl shadow-red-900/5" : "bg-black/60 backdrop-blur-xl border-white/10"
        )}>
            <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                {/* Logo - Just the SVG image */}
                <Link href="/" className="flex items-center group relative">
                    <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full group-hover:bg-red-600/40 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                    <div className="relative h-8 md:h-14 w-auto group-hover:scale-105 transition-all duration-300">
                        <Image
                            src="/logo.svg"
                            alt="PowerWorld"
                            width={180}
                            height={56}
                            className="h-8 md:h-14 w-auto object-contain"
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
                    className="md:hidden p-2 text-zinc-400 hover:text-white transition-all duration-300 active:scale-95"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="relative w-7 h-7 flex items-center justify-center">
                        <Menu size={28} className={cn("absolute transition-all duration-300", isOpen ? "opacity-0 scale-50" : "opacity-100 scale-100")} />
                        <X size={28} className={cn("absolute transition-all duration-300", isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                    </div>
                </button>
            </div>

            {/* Mobile Nav (in-flow extension) */}
            <div
                className={cn(
                    "md:hidden relative w-full px-6 flex flex-col items-center gap-5 transition-all duration-500 ease-in-out overflow-hidden border-t",
                    isOpen ? "max-h-96 py-6 border-white/10 opacity-100" : "max-h-0 py-0 border-transparent opacity-0"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/5 to-transparent pointer-events-none" />
                
                {navLinks.map((link, i) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={cn(
                            "relative text-sm font-semibold uppercase tracking-[0.2em] hover:text-white py-1 transition-all duration-500 ease-out group",
                            isOpen ? "text-zinc-400 translate-y-0 opacity-100" : "text-transparent -translate-y-4 opacity-0"
                        )}
                        style={{ transitionDelay: isOpen ? `${i * 75}ms` : '0ms' }}
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="relative z-10 group-hover:text-red-50 transition-colors duration-300">{link.name}</span>
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent group-hover:w-full transition-all duration-300 ease-out" />
                    </Link>
                ))}
                
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1" />
                
                <div 
                    className={cn(
                        "flex flex-col items-center gap-5 w-full transition-all duration-500 ease-out",
                        isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
                    )}
                    style={{ transitionDelay: isOpen ? '300ms' : '0ms' }}
                >
                    <Link
                        href="/login"
                        className="text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white transition-all duration-300 relative group"
                        onClick={() => setIsOpen(false)}
                    >
                        Login
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
                    </Link>
                    
                    <Link
                        href="/register"
                        className="relative px-6 py-2 bg-gradient-to-r from-red-700 to-red-900 text-white font-bold rounded-full hover:from-red-600 hover:to-red-800 transition-all duration-300 active:scale-95 overflow-hidden group border border-red-500/30"
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="relative z-10 uppercase tracking-widest text-xs">JOIN NOW</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-white/20 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                    </Link>
                </div>
            </div>
        </nav>
    );
}
