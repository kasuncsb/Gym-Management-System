"use client";

import { useEffect } from "react";

type SerwistWindow = Window & { serwist?: { register: () => void } };

/** Registers the Serwist service worker in production. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const w = window as SerwistWindow;

    w.serwist?.register();

    const onControllerChange = () => {
      // Avoid reload loops: only hard-reload once per tab session when a new SW takes control.
      try {
        const key = "sw_controller_reload_once";
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");
      } catch {
        // If storage is unavailable, do not risk reload loops.
        return;
      }
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
