"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardPathForRole, useAuth } from "@/context/AuthContext";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";
import { PwaErrorMask } from "@/components/pwa/PwaErrorMask";

export default function PwaBootPage() {
  const router = useRouter();
  const isStandalone = useIsStandalonePwa();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const sync = () => setIsOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // In a normal browser window, keep the generic web experience.
    if (isStandalone === undefined) return;
    if (!isStandalone) {
      router.replace("/");
      return;
    }

    // First check: network presence. When offline, do not redirect into onboarding.
    if (!isOnline) return;

    // In standalone PWA mode:
    // - authenticated users go to their role dashboard
    // - guests go to the onboarding flow
    if (isAuthenticated && user) {
      router.replace(dashboardPathForRole(user.role));
      return;
    }

    router.replace("/pwa/onboarding");
  }, [isLoading, isStandalone, isAuthenticated, user, router, isOnline]);

  if (isStandalone === true && !isOnline) {
    return <PwaErrorMask />;
  }

  return (
    <div className="min-h-svh bg-app text-white flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-zinc-500 text-sm mt-3">Loading…</div>
      </div>
    </div>
  );
}

