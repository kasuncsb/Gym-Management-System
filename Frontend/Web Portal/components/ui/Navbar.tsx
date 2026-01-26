'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { Dumbbell, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
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
            scrolled ? "bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl shadow-indigo-500/5" : "bg-transparent border-transparent"
        )}>
            <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-indigo-500/20">
                        <Dumbbell className="text-white drop-shadow-md" size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-white tracking-tighter leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 transition-all duration-300 gap-0">
                            POWER<span className="text-indigo-500 group-hover:text-indigo-400">WORLD</span>
                        </span>
                        <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase group-hover:text-indigo-400/70 transition-colors delay-75">
                            Elite Fitness
                        </span>
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
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 group-hover:w-full transition-all duration-300 ease-out" />
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
                        className="relative px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] overflow-hidden group"
                    >
                        <span className="relative z-10">JOIN NOW</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 via-indigo-400/30 to-indigo-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
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
                        className="px-6 py-4 bg-indigo-600 text-white text-center font-bold rounded-xl text-lg hover:bg-indigo-700"
                        onClick={() => setIsOpen(false)}
                    >
                        Start Free Trial
                    </Link>
                </div>
            )}
        </nav>
    );
}
