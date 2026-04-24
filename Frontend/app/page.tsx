'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroVideo } from "@/components/ui/HeroVideo";
import { ArrowRight, Check, Zap, Users, Trophy } from "lucide-react";
import { opsAPI } from "@/lib/api";

type HomePlanCard = { name: string; price: string; period: string; popular: boolean; features: string[] };

function formatUsd(price: string | number) {
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(n)) return "$ —";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function periodLabel(durationDays: number) {
  const d = Number(durationDays);
  if (!Number.isFinite(d) || d <= 0) return "term";
  if (d <= 1) return "day";
  if (d < 30) return `${d} days`;
  if (d <= 35) return "mo";
  if (d >= 300) return "yr";
  if (d < 120) return `${Math.max(1, Math.round(d / 30))} mo`;
  return `${d} days`;
}

const DEFAULT_FEATURES = ["Full gym access", "Locker usage", "Any GymSphere branch"];

const FALLBACK_PLANS: HomePlanCard[] = [
  { name: "Monthly Individual", price: "$49", period: "mo", popular: false, features: DEFAULT_FEATURES },
  { name: "3-Month Commitment", price: "$129", period: "3 mo", popular: true, features: [...DEFAULT_FEATURES, "Better per-month value"] },
  { name: "Annual Individual", price: "$449", period: "yr", popular: false, features: [...DEFAULT_FEATURES, "Best long-term value"] },
];

const STATS = [
  { label: "Active Members", value: "500+" },
  { label: "GymSphere Branch", value: "1" },
  { label: "Expert Trainers", value: "8" },
  { label: "Years Running", value: "5+" },
];

export default function Home() {
  const [planCards, setPlanCards] = useState<HomePlanCard[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const showDemoDialog = () => {
    window.alert("This is a demo project. Please treat all content, policies, and support references as demonstration-only.");
  };

  useEffect(() => {
    opsAPI
      .publicSubscriptionPlans()
      .then((raw: unknown[]) => {
        const list = (raw ?? []) as Array<{
          name?: string;
          price?: string;
          durationDays?: number;
          description?: string | null;
        }>;
        const sorted = [...list].sort((a, b) => Number(a.price) - Number(b.price));
        const picked = sorted.filter((p) => p.name).slice(0, 6);
        const mapped: HomePlanCard[] = picked.map((p) => {
          const days = Number(p.durationDays ?? 30);
          const desc = p.description ? String(p.description) : "";
          const fromDesc = desc
            .split(/[.\n]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 3);
          const features = fromDesc.length ? fromDesc.slice(0, 4) : DEFAULT_FEATURES;
          const popular = days >= 85 && days <= 100;
          return {
            name: String(p.name),
            price: formatUsd(p.price ?? 0),
            period: periodLabel(days),
            popular,
            features,
          };
        });
        setPlanCards(mapped.length >= 3 ? mapped.slice(0, 6) : []);
      })
      .catch(() => setPlanCards([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const displayPlans = planCards.length >= 3 ? planCards : FALLBACK_PLANS;

  return (
    <div className="min-h-screen bg-app text-white selection:bg-red-600/30">
      {/* Home / Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        <div className="absolute inset-0 z-0">
          <HeroVideo className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover grayscale opacity-30" />
          
          {/* Vignette Effect (Reduced by 10% -> opacity from ~0.65 to ~0.55) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.75)_100%)] z-10 pointer-events-none" />

          {/* Corner Red Glows */}
          <div className="absolute -top-20 md:-top-32 -left-20 md:-left-32 w-64 md:w-96 h-64 md:h-96 bg-red-700/10 md:bg-red-700/30 rounded-full blur-[80px] md:blur-[128px] z-0" />
          <div className="absolute -top-20 md:-top-32 -right-20 md:-right-32 w-64 md:w-96 h-64 md:h-96 bg-red-800/10 md:bg-red-800/30 rounded-full blur-[80px] md:blur-[128px] z-0" />
          <div className="absolute -bottom-20 md:-bottom-32 -left-20 md:-left-32 w-64 md:w-96 h-64 md:h-96 bg-red-800/10 md:bg-red-800/30 rounded-full blur-[80px] md:blur-[128px] z-0" />
          <div className="absolute -bottom-20 md:-bottom-32 -right-20 md:-right-32 w-64 md:w-96 h-64 md:h-96 bg-red-700/10 md:bg-red-700/30 rounded-full blur-[80px] md:blur-[128px] z-0" />
          
          {/* Faded Grid Pattern in Corners Using Masks */}
          <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808024_1px,transparent_1px),linear-gradient(to_bottom,#80808024_1px,transparent_1px)] bg-size-[24px_24px] [mask-image:radial-gradient(ellipse_at_center,transparent_56%,black_100%)] md:[mask-image:radial-gradient(ellipse_at_center,transparent_24%,black_100%)] pointer-events-none" />
        </div>

        <div className="container relative z-10 px-6 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-sm font-medium text-zinc-300">
              Now Open at Demo Branch
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Forging <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 to-red-500">Elite</span>
            <br />
            Fitness Management
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Train with professional coaching, premium equipment, and a member-first digital experience
            designed for real progress at every fitness level.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Link
              href="/member/register"
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Start Your Journey <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 text-white font-bold rounded-xl bg-zinc-900/40 backdrop-blur-md border border-white/10 hover:bg-zinc-800/60 hover:border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center"
            >
              Member Login
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-zinc-800 bg-zinc-900/30">
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

      {/* Facilities Section */}
      <section id="facilities" className="py-32 relative">
        <div className="container px-6 mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for <span className="text-red-600">Results</span></h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Our GymSphere facility combines training zones, expert support, and smart member tools in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Training Zones",
                icon: Zap,
                desc: "Dedicated cardio, strength, and functional training areas with regularly maintained machines.",
              },
              {
                title: "Personal Coaching",
                icon: Users,
                desc: "Certified trainers provide PT sessions, guided programming, and accountability for members.",
              },
              {
                title: "Progress Intelligence",
                icon: Trophy,
                desc: "Track workouts, attendance, body metrics, and improvement trends through your member dashboard.",
              },
            ].map((facility, i) => (
              <div key={i} className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-red-600/50 hover:bg-zinc-900 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <facility.icon className="text-red-500" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{facility.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{facility.desc}</p>
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
            <p className="text-zinc-400">Pricing reflects live plans for the GymSphere branch demo. Join online to get started.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {(plansLoading
              ? ([0, 1, 2] as const)
              : displayPlans
            ).map((plan, i) => (
              <div
                key={plansLoading ? `sk-${i}` : `plan-${(plan as HomePlanCard).name}-${i}`}
                className={`relative p-8 rounded-3xl border flex flex-col ${!plansLoading && (plan as HomePlanCard).popular
                  ? "bg-zinc-900/80 border-red-600 shadow-2xl shadow-red-600/10 scale-105 z-10"
                  : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                  }`}
              >
                {!plansLoading && (plan as HomePlanCard).popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-700 text-white text-xs font-bold uppercase tracking-wide rounded-full">
                    Best Value
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-medium text-zinc-300 mb-2">
                    {plansLoading ? <span className="inline-block h-6 w-40 bg-zinc-800 rounded animate-pulse" /> : (plan as HomePlanCard).name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white tracking-tight">
                      {plansLoading ? <span className="inline-block h-12 w-36 bg-zinc-800 rounded animate-pulse" /> : (plan as HomePlanCard).price}
                    </span>
                    {!plansLoading && (
                      <span className="text-zinc-500">/{(plan as HomePlanCard).period}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {plansLoading
                    ? [1, 2, 3].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-zinc-800 shrink-0 animate-pulse" />
                          <span className="h-4 flex-1 bg-zinc-800 rounded animate-pulse" />
                        </div>
                      ))
                    : (plan as HomePlanCard).features.map((feat, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
                            <Check size={12} className="text-red-500" />
                          </div>
                          <span className="text-zinc-300 text-sm">{feat}</span>
                        </div>
                      ))}
                </div>

                <Link
                  href="/member/register"
                  className={`w-full py-4 rounded-xl font-bold transition-all text-center ${!plansLoading && (plan as HomePlanCard).popular
                    ? "bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-600/25"
                    : "bg-zinc-100 hover:bg-white text-black"
                    }`}
                >
                  {plansLoading ? "…" : `Select ${(plan as HomePlanCard).name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-28 border-t border-zinc-900 bg-zinc-900/40">
        <div className="container px-6 mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                About <span className="text-red-600">Gym Management Suite</span>
              </h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                GymSphere is presented as a modern fitness management suite with premium facilities,
                expert support, and scalable operations.
              </p>
              <p className="text-zinc-400 leading-relaxed mb-4">
                The platform highlights certified trainers, personalized fitness plans, top-tier equipment, and flexible memberships
                for both beginners and advanced members.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                Its coverage is designed for multi-branch operations, supported by configurable dashboards
                and member engagement tools.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7">
              <h3 className="text-xl font-semibold mb-5">What GymSphere highlights</h3>
              <ul className="space-y-3 text-zinc-300">
                <li className="flex gap-3"><Check size={16} className="text-red-500 mt-1 shrink-0" /> Multi-branch readiness with configurable operations.</li>
                <li className="flex gap-3"><Check size={16} className="text-red-500 mt-1 shrink-0" /> Unified workflows for members, trainers, managers, and admins.</li>
                <li className="flex gap-3"><Check size={16} className="text-red-500 mt-1 shrink-0" /> Built-in analytics, subscriptions, attendance, and reporting.</li>
                <li className="flex gap-3"><Check size={16} className="text-red-500 mt-1 shrink-0" /> Certified trainers, comprehensive facilities, and affordable access.</li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-zinc-500">
            This is only for demonstration purposes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800 bg-zinc-900/50">
        <div className="container px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-500 text-sm">&copy; 2026 GymSphere. All rights reserved.</p>
          <div className="flex gap-8">
            <button type="button" onClick={showDemoDialog} className="text-zinc-500 hover:text-white text-sm transition-colors">Privacy Policy</button>
            <button type="button" onClick={showDemoDialog} className="text-zinc-500 hover:text-white text-sm transition-colors">Terms of Service</button>
            <button type="button" onClick={showDemoDialog} className="text-zinc-500 hover:text-white text-sm transition-colors">Contact Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
