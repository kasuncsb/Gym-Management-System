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

    // Ensure updated SW takes control quickly; avoids "stuck" cached behavior.
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (!reg) return;
        reg.update().catch(() => {});

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              // New SW installed; reload once it takes control.
            }
          });
        });
      })
      .catch(() => {});

    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
