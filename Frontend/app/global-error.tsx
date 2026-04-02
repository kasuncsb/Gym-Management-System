"use client";

import { useEffect } from "react";
import { PwaErrorMask } from "@/components/pwa/PwaErrorMask";
import { useIsStandalonePwa } from "@/lib/pwa/useIsStandalonePwa";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isStandalone = useIsStandalonePwa();

  useEffect(() => {
    // Keep a breadcrumb for debugging while still showing a friendly mask.
    // eslint-disable-next-line no-console
    console.error("Global error:", error);
  }, [error]);

  if (isStandalone === true) {
    return <PwaErrorMask />;
  }

  return (
    <html lang="en">
      <body className="min-h-svh bg-app text-white flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <div className="text-2xl font-bold">Something went wrong</div>
          <div className="text-zinc-400 text-sm mt-2">
            Please try again.
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-full bg-gradient-to-r from-red-700 to-red-900 px-6 py-3 font-bold text-white hover:from-red-600 hover:to-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}

