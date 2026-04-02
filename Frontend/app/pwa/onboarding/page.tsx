"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, dashboardPathForRole, type Role } from "@/context/AuthContext";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";
import { LoadingButton, Select } from "@/components/ui/SharedComponents";

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
        <path
          d="M210 72c-32 0-58 26-58 58 0 27 18 50 42 56"
          stroke={muted}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="210" cy="130" r="62" stroke="rgba(239,68,68,0.45)" strokeWidth="3" />
        <circle cx="210" cy="130" r="10" fill="rgba(239,68,68,0.16)" stroke="rgba(239,68,68,0.55)" />

        <rect x="62" y="168" width="92" height="66" rx="16" stroke={muted} />
        <rect x="164" y="168" width="92" height="66" rx="16" stroke="rgba(239,68,68,0.55)" fill="rgba(239,68,68,0.10)" />
        <rect x="266" y="168" width="92" height="66" rx="16" stroke={muted} />
        <path d="M102 201h12M96 209h24" stroke={muted} strokeWidth="3" strokeLinecap="round" />
        <path d="M204 198v18M195 207h18" stroke="rgba(239,68,68,0.75)" strokeWidth="3" strokeLinecap="round" />
        <path d="M298 198h28" stroke={muted} strokeWidth="3" strokeLinecap="round" />
        <path d="M298 210h18" stroke={muted} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (step === 2) {
    // Every role: 2x2 role cards + hub
    return (
      <svg {...common} aria-hidden>
        <circle cx="210" cy="86" r="9" fill="rgba(239,68,68,0.18)" stroke="rgba(239,68,68,0.6)" />
        <path d="M210 95v24" stroke="rgba(239,68,68,0.6)" strokeWidth="3" strokeLinecap="round" />
        <path d="M210 119H124M210 119h86" stroke={muted} strokeWidth="3" strokeLinecap="round" />

        <rect x="70" y="126" width="132" height="88" rx="20" stroke={muted} />
        <rect x="218" y="126" width="132" height="88" rx="20" stroke={muted} />
        <rect x="70" y="26" width="132" height="88" rx="20" stroke={muted} opacity="0.6" />
        <rect x="218" y="26" width="132" height="88" rx="20" stroke={muted} opacity="0.6" />

        <circle cx="122" cy="168" r="14" stroke={muted} />
        <path d="M108 192c10-12 26-12 36 0" stroke={muted} strokeWidth="3" strokeLinecap="round" />

        <path d="M272 170h24" stroke={muted} strokeWidth="4" strokeLinecap="round" />
        <path d="M260 186h48" stroke={muted} strokeWidth="4" strokeLinecap="round" />

        <path d="M110 70h52" stroke={muted} strokeWidth="4" strokeLinecap="round" opacity="0.65" />
        <path d="M260 70h52" stroke={muted} strokeWidth="4" strokeLinecap="round" opacity="0.65" />
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
    <div className="min-h-svh bg-app text-white px-6">
      <div className="max-w-2xl mx-auto min-h-svh flex flex-col py-16 sm:py-20">
        <div className="flex-1 flex flex-col">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{content.hero}</h1>
            <p className="mt-5 text-zinc-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              {content.sub}
            </p>
          </div>

          <div className="mt-16 sm:mt-20">
            <OnboardingArt step={step} />
          </div>

          {step === 3 && (
            <div className="mt-14 sm:mt-16 max-w-md mx-auto w-full">
              <Select
                label="Select a role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                options={ROLE_OPTIONS}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className="mt-16 sm:mt-20">
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

