'use client';

import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { ArrowRight, Check, Zap, Users, Trophy } from "lucide-react";

const PLANS = [
  {
    name: "Monthly",
    price: "Rs. 3,500",
    period: "mo",
    popular: false,
    features: ["Full Gym Access", "Locker Usage", "Free Wi-Fi"],
  },
  {
    name: "Quarterly",
    price: "Rs. 9,000",
    period: "3 mo",
    popular: true,
    features: ["Full Gym Access", "Locker Usage", "Free Wi-Fi", "1 PT Session"],
  },
  {
    name: "Annual",
    price: "Rs. 30,000",
    period: "yr",
    popular: false,
    features: ["Full Gym Access", "Locker Usage", "Free Wi-Fi", "4 PT Sessions", "Guest Pass"],
  },
];

const STATS = [
  { label: "Active Members", value: "500+" },
  { label: "Kiribathgoda Branch", value: "1" },
  { label: "Expert Trainers", value: "8" },
  { label: "Years Running", value: "5+" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-700/30 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[128px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808024_1px,transparent_1px),linear-gradient(to_bottom,#80808024_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 px-6 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-sm font-medium text-zinc-300">
              Now Open in Kiribathgoda
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Forging <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 to-red-500">Elite</span>
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
              Start Your Journey <ArrowRight size={20} />
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
            {STATS.map((stat, i) => (
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
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for <span className="text-red-600">Performance</span></h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Everything you need to crush your fitness goals, all in one premium ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Premium Equipment", icon: Zap, desc: "Top-of-the-line gym machines maintained to the highest standards." },
              { title: "Expert Coaching", icon: Users, desc: "Certified personal trainers to guide your fitness journey." },
              { title: "Smart Tracking", icon: Trophy, desc: "Track workouts, progress, and attendance in real time." },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-red-600/50 hover:bg-zinc-900 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="text-red-500" size={28} />
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
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent <span className="text-red-600">Pricing</span></h2>
            <p className="text-zinc-400">No joining fees. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-3xl border flex flex-col ${plan.popular
                  ? "bg-zinc-900/80 border-red-600 shadow-2xl shadow-red-600/10 scale-105 z-10"
                  : "bg-black border-zinc-800 hover:border-zinc-700"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-700 text-white text-xs font-bold uppercase tracking-wide rounded-full">
                    Best Value
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-medium text-zinc-300 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white tracking-tight">{plan.price}</span>
                    <span className="text-zinc-500">/{plan.period}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {plan.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-red-500" />
                      </div>
                      <span className="text-zinc-300 text-sm">{feat}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register"
                  className={`w-full py-4 rounded-xl font-bold transition-all text-center ${plan.popular
                    ? "bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-600/25"
                    : "bg-zinc-100 hover:bg-white text-black"
                    }`}
                >
                  Select {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 bg-black">
        <div className="container px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-500 text-sm">&copy; 2026 PowerWorld Gyms. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Terms of Service</Link>
            <Link href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
