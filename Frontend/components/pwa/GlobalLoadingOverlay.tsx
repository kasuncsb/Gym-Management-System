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
    @keyframes gymsphereBubbles {
      0% { transform: translateY(0); opacity: 0.45; }
      50% { transform: translateY(-6px); opacity: 1; }
      100% { transform: translateY(0); opacity: 0.45; }
    }
  `;
}

export function GlobalLoadingOverlay() {
  const pathname = usePathname();
  const isStandalone = useIsStandalonePwa();
  const [visible, setVisible] = useState(false);
  const [hasShownInitial, setHasShownInitial] = useState(false);
  const [showSplashArt, setShowSplashArt] = useState(false);

  useEffect(() => {
    if (isStandalone !== true) return;

    // Show once immediately at PWA startup.
    if (!hasShownInitial) {
      setShowSplashArt(true);
      setVisible(true);
      setHasShownInitial(true);
      const t0 = window.setTimeout(() => {
        setVisible(false);
        setShowSplashArt(false);
      }, 900);
      return () => window.clearTimeout(t0);
    }

    // Simple route-change masking: show overlay briefly after pathname changes.
    setShowSplashArt(false);
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 650);
    return () => window.clearTimeout(t);
  }, [pathname, isStandalone, hasShownInitial]);

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
          {showSplashArt ? (
            <img
              src="/icons/member.png"
              alt=""
              className="w-40 h-40 object-contain"
              style={{ animation: "gymsphereFlash 0.65s ease-in-out infinite" }}
            />
          ) : (
            <div className="flex items-center gap-2" aria-label="Loading">
              {[0, 1, 2].map((i) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className="h-2 w-2 rounded-full bg-zinc-200/90"
                  style={{
                    animation: "gymsphereBubbles 0.8s ease-in-out infinite",
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
            </div>
          )}
          <div className="text-zinc-200 text-sm font-medium">Please wait...</div>
        </div>
      </div>
    </>
  );
}

