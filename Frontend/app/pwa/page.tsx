"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboardPathForRole, useAuth } from "@/context/AuthContext";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";

export default function PwaBootPage() {
  const router = useRouter();
  const isStandalone = useIsStandalonePwa();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // In a normal browser window, keep the generic web experience.
    if (isStandalone === undefined) return;
    if (!isStandalone) {
      router.replace("/");
      return;
    }

    // In standalone PWA mode:
    // - authenticated users go to their role dashboard
    // - guests go to the onboarding flow
    if (isAuthenticated && user) {
      router.replace(dashboardPathForRole(user.role));
      return;
    }

    router.replace("/pwa/onboarding");
  }, [isLoading, isStandalone, isAuthenticated, user, router]);

  return (
    <div className="min-h-svh bg-app text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg font-semibold text-white">GymSphere</div>
        <div className="text-zinc-500 text-sm mt-2">Loading…</div>
      </div>
    </div>
  );
}

