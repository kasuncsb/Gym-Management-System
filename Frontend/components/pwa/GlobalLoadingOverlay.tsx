"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";

function gymsphereFlashStyle() {
  // Avoid adding global CSS files; inline keyframes keeps it self-contained.
  return `
    @keyframes gymsphereFlash {
      0%, 100% { opacity: 0.25; transform: scale(0.98); }
      50% { opacity: 1; transform: scale(1); }
    }
  `;
}

export function GlobalLoadingOverlay() {
  const pathname = usePathname();
  const isStandalone = useIsStandalonePwa();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone !== true) return;

    // Simple route-change masking: show overlay briefly after pathname changes.
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 650);
    return () => window.clearTimeout(t);
  }, [pathname, isStandalone]);

  if (isStandalone !== true) return null;

  return (
    <>
      <style>{gymsphereFlashStyle()}</style>
      <div
        aria-hidden
        className={[
          "fixed inset-0 z-[200] flex items-center justify-center bg-app/60 backdrop-blur-sm transition-opacity duration-150 pointer-events-none",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <div className="flex flex-col items-center gap-3">
          <img
            src="/icons/member.png"
            alt="GymSphere"
            className="w-20 h-20 object-contain"
            style={{ animation: "gymsphereFlash 0.65s ease-in-out infinite" }}
          />
          <div className="text-zinc-200 text-sm font-medium">GymSphere</div>
        </div>
      </div>
    </>
  );
}

