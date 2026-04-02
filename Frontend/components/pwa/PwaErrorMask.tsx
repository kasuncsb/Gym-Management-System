"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

function offlineStyle() {
  return `
    @keyframes offlinePulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  `;
}

export function PwaErrorMask() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Small breathing room so the mask doesn't feel "instant" when an error happens.
    const t = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <style>{offlineStyle()}</style>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-app px-6 text-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 rounded-full border-2 border-zinc-300/70 border-t-transparent"
            style={{
              animation: visible ? "offlinePulse 0.9s ease-in-out infinite" : undefined,
            }}
          />
          <div className="text-zinc-200 text-sm font-medium">Offline</div>
        </div>

        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-bold">Can&apos;t reach the page</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            You&apos;re currently offline or something went wrong.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
          <Link
            href="/pwa"
            className="rounded-full bg-gradient-to-r from-red-700 to-red-900 px-6 py-3 font-bold text-white hover:from-red-600 hover:to-red-800 transition-colors"
          >
            Back
          </Link>

          <button
            type="button"
            onClick={() => {
              // Hard reload to retry service worker + network.
              router.refresh();
              // As a fallback, full reload covers cases where refresh doesn&apos;t re-run fetches.
              window.setTimeout(() => window.location.reload(), 1500);
            }}
            className="rounded-full border border-zinc-700 px-6 py-3 font-bold text-white hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    </>
  );
}

