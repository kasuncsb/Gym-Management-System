"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, dashboardPathForRole, type Role } from "@/context/AuthContext";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";
import { Card, LoadingButton, Select } from "@/components/ui/SharedComponents";
import { CheckCircle2, Download, ShieldCheck, Zap } from "lucide-react";

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

export default function PwaOnboardingPage() {
  const router = useRouter();
  const isStandalone = useIsStandalonePwa();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("member");

  const stepTitle = useMemo(() => {
    if (step === 0) return "Welcome to GymSphere";
    if (step === 1) return "Offline-ready by design";
    if (step === 2) return "Your progress, everywhere";
    return "Choose your role";
  }, [step]);

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

  if (isStandalone === undefined || isLoading) {
    return (
      <div className="min-h-svh bg-app text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">GymSphere</div>
          <div className="text-zinc-500 text-sm mt-2">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-app text-white px-4 py-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/40 border border-zinc-800 text-zinc-300">
          <Zap size={16} className="text-red-400" />
          PWA Onboarding
        </div>
        <h1 className="text-3xl font-bold mt-4">{stepTitle}</h1>
        <p className="text-zinc-400 text-sm mt-2">
          {step === 0 &&
            "A native-like Gym experience with quick access, smooth navigation, and role-based dashboards."}
          {step === 1 && "Designed to keep key screens usable even with flaky networks."}
          {step === 2 && "Check-ins, workouts, and profiles—organized for every role."}
          {step === 3 && "Pick the area you want to start with. You can change later from Profile."}
        </p>
      </div>

      <div className="flex gap-2 justify-center mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-2 w-10 rounded-full ${i === step ? "bg-red-500" : "bg-zinc-800/70"}`}
          />
        ))}
      </div>

      {step === 0 && (
        <Card padding="lg" className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 size={18} className="text-red-400" />
                <div className="font-semibold">Role-based navigation</div>
              </div>
              <div className="text-zinc-400 text-sm">Member, trainer, manager, and admin have their own workflows.</div>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={18} className="text-red-400" />
                <div className="font-semibold">Secure by default</div>
              </div>
              <div className="text-zinc-400 text-sm">Protected routes and role checks throughout the app.</div>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Download size={18} className="text-red-400" />
                <div className="font-semibold">Fast, PWA-like feel</div>
              </div>
              <div className="text-zinc-400 text-sm">Caching and a consistent mobile shell.</div>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap size={18} className="text-red-400" />
                <div className="font-semibold">Smooth interaction</div>
              </div>
              <div className="text-zinc-400 text-sm">Less friction, more clarity on small screens.</div>
            </div>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card padding="lg" className="mb-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Offline-ready key screens</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              GymSphere uses Serwist caching so navigation and core UI pages can still render when you lose connection.
              When a page can’t load, the app shows a GymSphere offline mask.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="text-white font-medium mb-1">Cached boot flow</div>
                <div className="text-zinc-400 text-sm">So you don’t hit the generic website homepage.</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="text-white font-medium mb-1">Offline fallback</div>
                <div className="text-zinc-400 text-sm">Shows the branded GymSphere screen.</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card padding="lg" className="mb-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Built for real gym workflows</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              From equipment issues to member workouts and trainer assistance, each role gets its own optimized navigation and page layouts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="text-white font-medium mb-1">Action buttons stay usable</div>
                <div className="text-zinc-400 text-sm">Mobile-first layout prevents clipped/hidden controls.</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="text-white font-medium mb-1">Profiles are consistent</div>
                <div className="text-zinc-400 text-sm">Edit profile + logout is always available.</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card padding="lg" className="mb-6">
          <div className="space-y-4">
            <Select
              label="Which role are you?"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              options={ROLE_OPTIONS}
              className="w-full"
            />
            <div className="text-zinc-400 text-sm">
              You’ll be redirected to the appropriate login flow for this role. (You can switch later.)
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          {step > 0 ? (
            <LoadingButton variant="secondary" size="sm" onClick={goBack}>
              Back
            </LoadingButton>
          ) : (
            <div className="text-zinc-500 text-sm"> </div>
          )}
        </div>
        <div className="ml-auto">
          {step < 3 ? (
            <LoadingButton variant="primary" size="sm" onClick={goNext}>
              Continue
            </LoadingButton>
          ) : (
            <LoadingButton variant="primary" size="sm" onClick={continueFromRole}>
              Continue to Login
            </LoadingButton>
          )}
        </div>
      </div>
    </div>
  );
}

