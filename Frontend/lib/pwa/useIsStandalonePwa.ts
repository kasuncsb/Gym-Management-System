"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the app is running in "standalone" display mode (PWA).
 * Uses modern `display-mode: standalone` and iOS `navigator.standalone`.
 */
export function useIsStandalonePwa() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.("(display-mode: standalone)");
    const iosStandalone = (window.navigator as any)?.standalone === true;

    const compute = () => {
      const mediaStandalone = mql ? mql.matches : false;
      setIsStandalone(Boolean(mediaStandalone || iosStandalone));
    };

    compute();

    if (!mql) return;

    // Support both modern and older MediaQueryList APIs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyMql = mql as any;
    const onChange = () => compute();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    if (typeof anyMql.addListener === "function") {
      anyMql.addListener(onChange);
      return () => anyMql.removeListener(onChange);
    }
  }, []);

  return isStandalone;
}

