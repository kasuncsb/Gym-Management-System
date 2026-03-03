'use client';

import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import { Dumbbell, Users, Calendar, BarChart3, Shield, Clock, ArrowRight } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Member Management',
        description: 'Complete member lifecycle tracking from registration to renewal.',
    },
    {
        icon: Calendar,
        title: 'Class Scheduling',
        description: 'Smart scheduling system for classes, trainers, and equipment.',
    },
    {
        icon: BarChart3,
        title: 'Analytics Dashboard',
        description: 'Real-time insights into attendance, revenue, and growth metrics.',
    },
    {
        icon: Shield,
        title: 'Secure Access',
        description: 'QR code-based check-in with role-based access control.',
    },
    {
        icon: Clock,
        title: 'Staff Management',
        description: 'Shift scheduling, attendance tracking, and performance monitoring.',
    },
    {
        icon: Dumbbell,
        title: 'Equipment Tracking',
        description: 'Maintain equipment inventory and schedule preventive maintenance.',
    },
];

const stats = [
    { value: '5K+', label: 'Active Members' },
    { value: '50+', label: 'Expert Trainers' },
    { value: '15', label: 'Locations Island-wide' },
    { value: '99.9%', label: 'System Uptime' },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-700/30 rounded-full blur-[128px] animate-pulse-glow" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[128px]" />
                    <div className="absolute inset-0 bg-grid opacity-30" />
                </div>

                <div className="max-w-7xl mx-auto px-6 py-20 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full mb-8">
                        <Dumbbell size={16} className="text-red-500" />
                        <span className="text-sm text-red-400">Sri Lanka's Leading Gym Network</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        Transform Your Body,
                        <br />
                        <span className="text-red-600">Elevate Your Life</span>
                    </h1>

                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
                        Join PowerWorld Gyms and access state-of-the-art facilities, expert trainers,
                        and a community dedicated to helping you achieve your fitness goals.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="px-8 py-4 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                        >
                            Start Your Journey <ArrowRight size={20} />
                        </Link>
                        <Link
                            href="/login"
                            className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all flex items-center justify-center"
                        >
                            Member Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 border-y border-zinc-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-4xl md:text-5xl font-bold text-red-600 mb-2">{stat.value}</p>
                                <p className="text-zinc-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 relative">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-700/10 rounded-full blur-[200px]" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            Everything you need to manage a modern gym, all in one integrated platform.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-6 hover:border-red-600/30 transition-all group"
                            >
                                <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600/20 transition-colors">
                                    <feature.icon className="text-red-500" size={24} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                                <p className="text-zinc-400 text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-red-700/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />
                </div>

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Ready to Transform Your Life?
                    </h2>
                    <p className="text-xl text-zinc-400 mb-10">
                        Join thousands of members who have already started their fitness journey with PowerWorld.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-10 py-4 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/30"
                    >
                        Get Started Today <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-800 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                                <Dumbbell className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-bold">
                                Power<span className="text-red-600">World</span>
                            </span>
                        </div>

                        <div className="flex gap-8 text-sm text-zinc-400">
                            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
                            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
                            <Link href="/#about" className="hover:text-white transition-colors">About</Link>
                            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
                        </div>

                        <p className="text-sm text-zinc-500">
                            &copy; {new Date().getFullYear()} PowerWorld Gyms. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
