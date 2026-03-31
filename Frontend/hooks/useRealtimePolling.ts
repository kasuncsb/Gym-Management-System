'use client';

import { useEffect, useRef } from 'react';

/**
 * Lightweight realtime fallback via polling.
 * Keeps dashboards fresh until websocket/SSE transport is added.
 */
export function useRealtimePolling(fn: () => void | Promise<void>, intervalMs = 15000) {
  const fnRef = useRef(fn);
  const inFlightRef = useRef(false);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await fnRef.current();
      } catch {
        // Best-effort polling — avoid unhandled rejections (4xx/5xx/429); pages attach their own error UX on refresh.
      } finally {
        inFlightRef.current = false;
      }
    };
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);
}

