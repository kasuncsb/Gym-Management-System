"use client";

import { useEffect } from "react";

type SerwistWindow = Window & { serwist?: { register: () => void } };

/** Registers the Serwist service worker in production (next.config has `register: false`). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const w = window as SerwistWindow;
    w.serwist?.register();
  }, []);

  return null;
}
