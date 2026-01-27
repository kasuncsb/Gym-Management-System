'use client';

import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { ArrowRight, Check, Zap, Users, Trophy } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="container relative z-10 px-6 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-medium text-zinc-300">New Location Open in Colombo 7</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Forging <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">Elite</span>
            <br />
            Fitness in Sri Lanka
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Experience the next evolution of fitness. State-of-the-art equipment, world-class trainers,
            and a community that pushes you to exceed your limits.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Create Account <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 border border-zinc-800 transition-all flex items-center justify-center"
            >
              Member Login
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-zinc-900 bg-zinc-950/50">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: "Active Members", value: "25k+" },
              { label: "Locations", value: "24" },
              { label: "Expert Trainers", value: "150+" },
              { label: "Classes Weekly", value: "500+" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</h3>
                <p className="text-zinc-500 font-medium uppercase tracking-wider text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="container px-6 mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for <span className="text-indigo-500">Performance</span></h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Everything you need to crush your fitness goals, all in one premium ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Premium Equipment", icon: Zap, desc: "Latest TechnoGym & LifeFitness machines maintained daily." },
              { title: "Expert Coaching", icon: Users, desc: "Certified personal trainers to guide your transformation." },
              { title: "Smart Tracking", icon: Trophy, desc: "Track workouts and progress with our dedicated mobile app." },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="text-indigo-400" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-zinc-900/20 border-t border-zinc-900">
        <div className="container px-6 mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent <span className="text-indigo-500">Pricing</span></h2>
            <p className="text-zinc-400">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Monthly", price: "5,500", period: "/mo", features: ["Access to home club", "Basic fitness app", "1 Intro session"] },
              { name: "Annual Gold", price: "48,000", period: "/yr", popular: true, features: ["Access to ALL locations", "Advanced tracking", "Unlimited classes", "Guest passes"] },
              { name: "Quarterly", price: "14,500", period: "/3mo", features: ["Access to home club", "Group classes included", "Nutritional guide"] },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-3xl border flex flex-col ${plan.popular
                  ? "bg-zinc-900/80 border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-105 z-10"
                  : "bg-black border-zinc-800 hover:border-zinc-700"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-medium text-zinc-300 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-zinc-500">LKR</span>
                    <span className="text-5xl font-bold text-white tracking-tight">{plan.price}</span>
                    <span className="text-zinc-500">{plan.period}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {plan.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-indigo-400" />
                      </div>
                      <span className="text-zinc-300 text-sm">{feat}</span>
                    </div>
                  ))}
                </div>

                <button className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-zinc-100 hover:bg-white text-black"
                  }`}>
                  Choose Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 bg-black">
        <div className="container px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-500 text-sm">© 2025 PowerWorld Gyms. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Privacy</Link>
            <Link href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Terms</Link>
            <Link href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
