'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
            "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
            scrolled ? "bg-black/80 backdrop-blur-md border-zinc-800" : "bg-transparent"
        )}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <Dumbbell className="text-white" size={24} />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">
                        Power<span className="text-indigo-400">World</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-white hover:text-indigo-400 transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="px-5 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                        Join Now
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-black border-b border-zinc-800 p-6 flex flex-col gap-4 shadow-2xl">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-lg font-medium text-zinc-400 hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="h-px bg-zinc-800 my-2" />
                    <Link
                        href="/login"
                        className="text-lg font-medium text-zinc-400 hover:text-white"
                        onClick={() => setIsOpen(false)}
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="text-lg font-medium text-indigo-400 hover:text-indigo-300"
                        onClick={() => setIsOpen(false)}
                    >
                        Join Now
                    </Link>
                </div>
            )}
        </nav>
    );
}
