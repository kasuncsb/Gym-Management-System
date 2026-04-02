"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { BrokenMachineIcon } from "./BrokenMachineIcon";

export function PwaErrorMask() {
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-app px-6 text-center text-white">
      <div className="flex flex-col items-center gap-4">
        <BrokenMachineIcon />
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-bold">Can&apos;t reach the page</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            You&apos;re currently offline or something went wrong.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          router.refresh();
          window.setTimeout(() => window.location.reload(), 1500);
        }}
        className="mt-2 rounded-full bg-gradient-to-r from-red-700 to-red-900 px-8 py-3 font-bold text-white hover:from-red-600 hover:to-red-800 transition-colors flex items-center justify-center gap-2 mx-auto"
      >
        <RefreshCw size={16} />
        Retry
      </button>
    </div>
  );
}
