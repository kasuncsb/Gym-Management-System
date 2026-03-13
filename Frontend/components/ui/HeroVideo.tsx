'use client';

import { useEffect, useRef, useState } from 'react';

const SOURCES = [
  { src: 'https://assets.kasunc.uk/videos/gms/hero-section.webm', type: 'video/webm' },
  { src: 'https://assets.kasunc.uk/videos/gms/hero-section.mp4',  type: 'video/mp4'  },
];

const MAX_RETRIES   = 4;
const STALL_TIMEOUT = 8_000;
const RETRY_BASE_MS = 2_000;

export function HeroVideo({ className, poster }: { className?: string; poster?: string }) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const retryCount = useRef(0);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Video starts invisible; it fades in only once actually playing.
  const [videoOpacity, setVideoOpacity] = useState(0);

  const clearStallTimer = () => {
    if (stallTimer.current) { clearTimeout(stallTimer.current); stallTimer.current = null; }
  };

  const reload = () => {
    clearStallTimer();
    retryCount.current += 1;
    if (retryCount.current > MAX_RETRIES) return; // give up; poster remains visible

    const delay = RETRY_BASE_MS * 2 ** (retryCount.current - 1);
    setTimeout(() => {
      if (!videoRef.current) return;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
      armStallTimer();
    }, delay);
  };

  const armStallTimer = () => {
    clearStallTimer();
    stallTimer.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video || !video.paused) { clearStallTimer(); return; }
      reload();
    }, STALL_TIMEOUT);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay  = () => video.play().catch(() => {});
    const onPlaying  = () => {
      clearStallTimer();
      retryCount.current = 0;
      setVideoOpacity(1); // fade the video in now that it's actually running
    };
    const onStalled  = () => { setVideoOpacity(0); reload(); };
    const onError    = () => { setVideoOpacity(0); reload(); };
    const onWaiting  = () => armStallTimer();
    const onSuspend  = () => { if (video.paused && video.readyState < 3) armStallTimer(); };

    video.addEventListener('canplay',  onCanPlay);
    video.addEventListener('playing',  onPlaying);
    video.addEventListener('stalled',  onStalled);
    video.addEventListener('error',    onError);
    video.addEventListener('waiting',  onWaiting);
    video.addEventListener('suspend',  onSuspend);

    armStallTimer();
    video.load();
    video.play().catch(() => {});

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

  return (
    <div className={className}>
      {/* Poster — always visible; acts as the permanent fallback */}
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      )}

      {/* Video — fades in only once playback is confirmed */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{ opacity: videoOpacity, transition: 'opacity 0.6s ease' }}
        className="absolute inset-0 w-full h-full object-cover object-center"
      >
        {SOURCES.map((s) => (
          <source key={s.type} src={s.src} type={s.type} />
        ))}
      </video>
    </div>
  );
}
