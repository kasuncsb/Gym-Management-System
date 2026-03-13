'use client';

import { useEffect, useRef, useState } from 'react';

const SOURCES = [
  { src: 'https://assets.kasunc.uk/videos/gms/hero-section.webm', type: 'video/webm' },
  { src: 'https://assets.kasunc.uk/videos/gms/hero-section.mp4',  type: 'video/mp4'  },
];

const MAX_RETRIES     = 4;
const STALL_TIMEOUT   = 8_000;  // ms — if no playback after 8s, retry
const RETRY_BASE_MS   = 2_000;  // exponential backoff base

export function HeroVideo({ className }: { className?: string }) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const retryCount  = useRef(0);
  const stallTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(true);

  const clearStallTimer = () => {
    if (stallTimer.current) {
      clearTimeout(stallTimer.current);
      stallTimer.current = null;
    }
  };

  /** Reload the video element completely and restart playback. */
  const reload = () => {
    const video = videoRef.current;
    if (!video) return;

    clearStallTimer();
    retryCount.current += 1;

    if (retryCount.current > MAX_RETRIES) {
      // Give up — the black background still looks fine.
      setVisible(false);
      return;
    }

    const delay = RETRY_BASE_MS * 2 ** (retryCount.current - 1);  // 2s, 4s, 8s, 16s

    setTimeout(() => {
      if (!videoRef.current) return;
      // Re-trigger source loading without touching the DOM source nodes.
      videoRef.current.load();
      videoRef.current.play().catch(() => { /* autoplay policy — silent */ });
      armStallTimer();
    }, delay);
  };

  /** Start a watchdog: if the video hasn't started playing within STALL_TIMEOUT, retry. */
  const armStallTimer = () => {
    clearStallTimer();
    stallTimer.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video || !video.paused) {
        // Already playing — all good.
        clearStallTimer();
        return;
      }
      reload();
    }, STALL_TIMEOUT);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => {
      // Start playback as soon as any data is ready, not waiting for full buffer.
      video.play().catch(() => { /* autoplay policy — silent */ });
    };

    const onPlaying = () => {
      // Playback confirmed — disarm the watchdog and reset retry counter.
      clearStallTimer();
      retryCount.current = 0;
    };

    const onStalled  = () => reload();
    const onError    = () => reload();
    const onWaiting  = () => armStallTimer();   // buffering mid-stream — give it a chance
    const onSuspend  = () => {
      // Browser suspended loading (no data requested). Nudge it.
      if (video.paused && video.readyState < 3) armStallTimer();
    };

    video.addEventListener('canplay',  onCanPlay);
    video.addEventListener('playing',  onPlaying);
    video.addEventListener('stalled',  onStalled);
    video.addEventListener('error',    onError);
    video.addEventListener('waiting',  onWaiting);
    video.addEventListener('suspend',  onSuspend);

    // Kick off the initial stall watchdog.
    armStallTimer();
    video.load();
    video.play().catch(() => { /* autoplay policy — silent */ });

    return () => {
      clearStallTimer();
      video.removeEventListener('canplay',  onCanPlay);
      video.removeEventListener('playing',  onPlaying);
      video.removeEventListener('stalled',  onStalled);
      video.removeEventListener('error',    onError);
      video.removeEventListener('waiting',  onWaiting);
      video.removeEventListener('suspend',  onSuspend);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className={className}
    >
      {SOURCES.map((s) => (
        <source key={s.type} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
