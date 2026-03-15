'use client';

import { useEffect, useRef } from 'react';

/**
 * Lightweight realtime fallback via polling.
 * Keeps dashboards fresh until websocket/SSE transport is added.
 */
export function useRealtimePolling(fn: () => void | Promise<void>, intervalMs = 15000) {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      await fnRef.current();
    };
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);
}

