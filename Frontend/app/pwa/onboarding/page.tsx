"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, dashboardPathForRole, type Role } from "@/context/AuthContext";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";
import { LoadingButton } from "@/components/ui/SharedComponents";
import { ChevronDown } from "lucide-react";

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: "member", label: "Member" },
  { value: "trainer", label: "Trainer" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

function setUserRoleCookie(role: Role) {
  // A lightweight hint for role-specific login UI. AuthProvider remains source of truth after login.
  document.cookie = `user_role=${role}; path=/; samesite=lax`;
}

function OnboardingArt({ step }: { step: number }) {
  const common = {
    width: 420,
    height: 260,
    viewBox: "0 0 420 260",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className:
      "w-[min(420px,100%)] h-auto mx-auto drop-shadow-[0_40px_80px_rgba(220,38,38,0.08)]",
  } as const;

  const stroke = "rgba(244,244,245,0.78)";
  const muted = "rgba(244,244,245,0.28)";
  const accent = "#ef4444";

  if (step === 0) {
    // Digitalisation: paper → screen
    return (
      <svg {...common} aria-hidden>
        <rect x="62" y="54" width="128" height="152" rx="18" stroke={muted} strokeWidth="2" />
        <path d="M94 92h64M94 120h74M94 148h56" stroke={muted} strokeWidth="3" strokeLinecap="round" />
        <path d="M198 132c28 0 44-8 62-24 18-16 40-24 72-24" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        <rect x="236" y="70" width="144" height="164" rx="24" stroke={stroke} strokeWidth="2.5" />
        <rect x="258" y="96" width="48" height="36" rx="10" fill="rgba(239,68,68,0.14)" stroke="rgba(239,68,68,0.55)" />
        <rect x="316" y="96" width="44" height="36" rx="10" stroke={muted} />
        <rect x="258" y="144" width="102" height="10" rx="5" fill="rgba(244,244,245,0.12)" />
        <rect x="258" y="166" width="84" height="10" rx="5" fill="rgba(244,244,245,0.10)" />
        <circle cx="236" cy="70" r="3" fill={accent} />
      </svg>
    );
  }

  if (step === 1) {
    // Convenience: tap + shortcuts
    return (
      <svg {...common} aria-hidden>
        <rect x="86" y="46" width="248" height="156" rx="24" stroke={stroke} strokeWidth="2.5" />
        <rect x="110" y="72" width="200" height="74" rx="14" stroke={muted} />
        <rect x="110" y="158" width="60" height="28" rx="10" stroke={muted} />
        <rect x="180" y="158" width="60" height="28" rx="10" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.55)" />
        <rect x="250" y="158" width="60" height="28" rx="10" stroke={muted} />
        <circle cx="210" cy="109" r="20" fill="rgba(239,68,68,0.14)" stroke="rgba(239,68,68,0.6)" />
        <path d="M210 97v24M198 109h24" stroke="rgba(239,68,68,0.75)" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M58 206h304" stroke={muted} strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }

  if (step === 2) {
    // Every role: 2x2 role cards + hub
    return (
      <svg {...common} aria-hidden>
        <circle cx="210" cy="124" r="12" fill="rgba(239,68,68,0.18)" stroke="rgba(239,68,68,0.7)" />
        <path d="M210 112v-26M210 136v26M198 124h-26M222 124h26" stroke="rgba(239,68,68,0.65)" strokeWidth="3" strokeLinecap="round" />

        <rect x="54" y="38" width="140" height="72" rx="18" stroke={muted} />
        <rect x="226" y="38" width="140" height="72" rx="18" stroke={muted} />
        <rect x="54" y="146" width="140" height="72" rx="18" stroke={muted} />
        <rect x="226" y="146" width="140" height="72" rx="18" stroke={muted} />

        <path d="M194 74h12M226 74h-12M124 110v12M124 146v-12M296 110v12M296 146v-12" stroke={muted} strokeWidth="2.5" strokeLinecap="round" />

        <circle cx="102" cy="72" r="11" stroke={muted} />
        <path d="M90 90c8-9 16-9 24 0" stroke={muted} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M282 70h28M282 80h28" stroke={muted} strokeWidth="3" strokeLinecap="round" />
        <path d="M98 180h52" stroke={muted} strokeWidth="3" strokeLinecap="round" />
        <path d="M270 176h28M264 188h40" stroke={muted} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  // Begin journey: path → flag + selector stops
  return (
    <svg {...common} aria-hidden>
      <path
        d="M74 192c40-72 90-94 136-84 44 10 62 48 104 44 40-4 66-32 96-80"
        stroke="rgba(239,68,68,0.55)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="74" cy="192" r="6" fill={accent} />
      <circle cx="210" cy="130" r="6" fill="rgba(244,244,245,0.35)" />
      <circle cx="318" cy="120" r="6" fill="rgba(244,244,245,0.35)" />
      <path d="M360 54v64" stroke={muted} strokeWidth="3" strokeLinecap="round" />
      <path d="M360 58c18 6 28 0 44-6v28c-16 6-26 12-44 6" fill="rgba(239,68,68,0.16)" stroke="rgba(239,68,68,0.6)" />

      <path d="M96 226h228" stroke={muted} strokeWidth="3" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={96 + i * 76}
          cy="226"
          r="7"
          fill={i === 3 ? "rgba(239,68,68,0.16)" : "rgba(244,244,245,0.12)"}
          stroke={i === 3 ? "rgba(239,68,68,0.7)" : muted}
        />
      ))}
    </svg>
  );
}

export default function PwaOnboardingPage() {
  const router = useRouter();
  const isStandalone = useIsStandalonePwa();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("member");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const content = useMemo(() => {
    if (step === 0) {
      return {
        hero: "Digitalise your gym experience",
        sub: "Manage memberships, schedules, check-ins, and progress with one connected system.",
      };
    }
    if (step === 1) {
      return {
        hero: "Everything in one place",
        sub: "Simple flows, fewer steps, and quick access to what you need—right when you need it.",
      };
    }
    if (step === 2) {
      return {
        hero: "Built for every role",
        sub: "Members, trainers, managers, admins—each gets a focused workspace and clear actions.",
      };
    }
    return {
      hero: "Begin your journey",
      sub: "Choose how you want to enter.",
    };
  }, [step]);

  useEffect(() => {
    const compute = () => setIsOnline(navigator.onLine);
    compute();
    window.addEventListener("online", compute);
    window.addEventListener("offline", compute);
    return () => {
      window.removeEventListener("online", compute);
      window.removeEventListener("offline", compute);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isStandalone === undefined) return;

    if (!isStandalone) {
      // In normal browser mode keep the generic web homepage experience.
      router.replace("/");
      return;
    }

    if (isAuthenticated && user) {
      router.replace(dashboardPathForRole(user.role));
      return;
    }

    // Not logged in → stay on onboarding.
    setStep(0);
  }, [isLoading, isStandalone, isAuthenticated, user, router]);

  const goNext = () => setStep((s) => Math.min(3, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const continueFromRole = () => {
    setUserRoleCookie(role);
    router.replace(`/login?role=${encodeURIComponent(role)}`);
  };

  useEffect(() => {
    if (!roleMenuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [roleMenuOpen]);

  if (!isOnline) {
    // Don’t show onboarding while offline.
    return (
      <div className="min-h-svh bg-app text-white flex items-center justify-center px-6 text-center">
        <div>
          <div className="h-10 w-10 border-2 border-zinc-300/70 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="mt-3 text-lg font-semibold">Offline</div>
          <div className="text-zinc-500 text-sm mt-2">Connect to the internet to continue.</div>
        </div>
      </div>
    );
  }

  if (isStandalone === undefined || isLoading) {
    return (
      <div className="min-h-svh bg-app text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-zinc-500 text-sm mt-3">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-app text-white px-8 sm:px-10">
      <div className="max-w-2xl mx-auto min-h-svh flex flex-col py-24 sm:py-28">
        <div className="flex-1 flex flex-col">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{content.hero}</h1>
            <p className="mt-5 text-zinc-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              {content.sub}
            </p>
          </div>

          <div className="mt-20 sm:mt-24">
            <OnboardingArt step={step} />
          </div>

          {step === 3 && (
            <div className="mt-16 sm:mt-20 max-w-md mx-auto w-full">
              <label className="block text-sm font-medium text-zinc-300 mb-2">Select a role</label>
              <div ref={roleMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen((v) => !v)}
                  className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-4 py-3 text-left text-white flex items-center justify-between hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  aria-expanded={roleMenuOpen}
                >
                  <span>{ROLE_OPTIONS.find((r) => r.value === role)?.label ?? "Member"}</span>
                  <ChevronDown
                    size={16}
                    className={[
                      "text-zinc-400 transition-transform",
                      roleMenuOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>
                {roleMenuOpen && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900/95 shadow-2xl overflow-hidden">
                    {ROLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setRole(option.value);
                          setRoleMenuOpen(false);
                        }}
                        className={[
                          "w-full px-4 py-3 text-left text-sm transition-colors",
                          option.value === role
                            ? "bg-red-600/20 text-red-300"
                            : "text-zinc-200 hover:bg-zinc-800",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-20 sm:mt-24">
          <div className="flex justify-center gap-2 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={[
                  "h-1.5 w-12 rounded-full transition-colors",
                  i === step ? "bg-red-500" : "bg-zinc-800/70",
                ].join(" ")}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            {step > 0 && (
              <LoadingButton variant="secondary" size="md" onClick={goBack}>
                Back
              </LoadingButton>
            )}
            {step < 3 ? (
              <LoadingButton variant="primary" size="md" onClick={goNext}>
                Next
              </LoadingButton>
            ) : (
              <LoadingButton variant="primary" size="md" onClick={continueFromRole}>
                Start journey
              </LoadingButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

