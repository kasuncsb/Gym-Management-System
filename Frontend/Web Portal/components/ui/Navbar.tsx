'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dumbbell, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        setMobileMenuOpen(false);
    };

    return (
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                scrolled
                    ? 'bg-black/80 backdrop-blur-xl border-b border-zinc-800/50 py-3'
                    : 'bg-transparent py-5'
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 group-hover:rotate-3">
                        <Dumbbell className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-bold text-white">
                        Power<span className="text-red-600">World</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/#features" className="text-zinc-400 hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="/#pricing" className="text-zinc-400 hover:text-white transition-colors">
                        Pricing
                    </Link>
                    <Link href="/#about" className="text-zinc-400 hover:text-white transition-colors">
                        About
                    </Link>
                </div>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <User size={18} />
                                {user?.fullName || 'Dashboard'}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-600/25"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-zinc-800">
                    <div className="px-6 py-6 space-y-4">
                        <Link
                            href="/#features"
                            className="block text-zinc-400 hover:text-white py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Features
                        </Link>
                        <Link
                            href="/#pricing"
                            className="block text-zinc-400 hover:text-white py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Pricing
                        </Link>
                        <Link
                            href="/#about"
                            className="block text-zinc-400 hover:text-white py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            About
                        </Link>
                        <hr className="border-zinc-800" />
                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="block text-zinc-400 hover:text-white py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left text-zinc-400 hover:text-white py-2"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="block text-zinc-400 hover:text-white py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="block w-full text-center py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
