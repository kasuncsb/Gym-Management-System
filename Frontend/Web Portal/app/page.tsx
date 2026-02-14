'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { ArrowRight, Check, Zap, Users, Trophy } from "lucide-react";
import { publicService, Plan, Branch, Stats, Trainer } from "@/lib/api/public.service";

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, branchesData, statsData] = await Promise.all([
          publicService.getSubscriptionPlans(),
          publicService.getBranches(),
          publicService.getStats()
        ]);

        // Parse features JSON if it's a string
        const parsedPlans = plansData.map((plan: Plan) => ({
          ...plan,
          features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
        }));

        setPlans(parsedPlans);
        setBranches(branchesData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch public data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(Number(amount)).replace('LKR', 'Rs.');
  };

  // Helper to get benefits list from plan features
  const getPlanBenefits = (plan: Plan) => {
    const benefits = [];
    if (plan.features?.gym) benefits.push("Full Gym Access");
    if (plan.features?.pool) benefits.push("Swimming Pool Access");
    if (plan.features?.classes) benefits.push("Group Classes Included");
    if (plan.features?.personal_training) benefits.push("Personal Training Sessions");
    if (plan.features?.guest_passes > 0) benefits.push(`${plan.features.guest_passes} Guest Passes`);
    if (plan.features?.ladies_only) benefits.push("Ladies Only Section Access");
    return benefits;
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-700/30 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[128px]" />
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808024_1px,transparent_1px),linear-gradient(to_bottom,#80808024_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 px-6 mx-auto text-center">
          {branches.length > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-sm font-medium text-zinc-300">
                New Location Open in {branches[branches.length - 1].name.replace('Power World ', '')}
              </span>
            </div>
          )}

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
            {[
              { label: "Active Members", value: stats?.activeMembers ? `${(stats.activeMembers / 1000).toFixed(1)}k+` : "25k+" },
              { label: "Locations", value: stats?.locations || "24+" },
              { label: "Expert Trainers", value: stats?.expertTrainers || "150+" },
              { label: "Total Staff", value: stats?.totalStaff || "50+" },
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
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for <span className="text-red-600">Performance</span></h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Everything you need to crush your fitness goals, all in one premium ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Premium Equipment", icon: Zap, desc: "Latest TechnoGym & LifeFitness machines maintained daily." },
              { title: "Expert Coaching", icon: Users, desc: "Certified personal trainers to guide your transformation." },
              { title: "Smart Tracking", icon: Trophy, desc: "Track workouts and progress with our dedicated mobile app." },
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

          {loading ? (
            <div className="flex justify-center text-zinc-500">Loading plans...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, i) => {
                const isPopular = plan.name.includes("Annual") || plan.name.includes("Gold");
                return (
                  <div
                    key={i}
                    className={`relative p-8 rounded-3xl border flex flex-col ${isPopular
                      ? "bg-zinc-900/80 border-red-600 shadow-2xl shadow-red-600/10 scale-105 z-10"
                      : "bg-black border-zinc-800 hover:border-zinc-700"
                      }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-700 text-white text-xs font-bold uppercase tracking-wide rounded-full">
                        Best Value
                      </div>
                    )}
                    <div className="mb-8">
                      <h3 className="text-xl font-medium text-zinc-300 mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-white tracking-tight">{formatCurrency(plan.price).replace('.00', '')}</span>
                        <span className="text-zinc-500">/{plan.durationDays > 30 ? 'yr' : 'mo'}</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 mb-8">
                      {getPlanBenefits(plan).map((feat, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
                            <Check size={12} className="text-red-500" />
                          </div>
                          <span className="text-zinc-300 text-sm">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <button className={`w-full py-4 rounded-xl font-bold transition-all ${isPopular
                      ? "bg-red-700 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
                      : "bg-zinc-100 hover:bg-white text-black"
                      }`}>
                      Select {plan.name}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 bg-black">
        <div className="container px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} PowerWorld Gyms. All rights reserved.</p>
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
