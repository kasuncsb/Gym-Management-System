'use client';

import { useEffect, useRef, useState } from 'react';

const MIN_BUFFER_SECONDS = 5;

export function HeroVideo({
  webmSrc,
  mp4Src,
  poster,
}: {
  webmSrc: string;
  mp4Src: string;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let bufferInterval: ReturnType<typeof setInterval> | null = null;

    const startVideoLoad = () => {
      // Dynamically inject sources AFTER page load
      // so the browser doesn't compete with critical resources on initial paint.
      const s1 = document.createElement('source');
      s1.src  = webmSrc;
      s1.type = 'video/webm';

      const s2 = document.createElement('source');
      s2.src  = mp4Src;
      s2.type = 'video/mp4';

      video.appendChild(s1);
      video.appendChild(s2);
      video.load();

      // Poll buffered range every 500 ms.
      // Start playback only once MIN_BUFFER_SECONDS is available.
      bufferInterval = setInterval(() => {
        if (video.buffered.length > 0 && video.buffered.end(0) >= MIN_BUFFER_SECONDS) {
          clearInterval(bufferInterval!);
          bufferInterval = null;
          video.play()
            .then(() => setPlaying(true))
            .catch(() => {}); // autoplay policy — silent
        }
      }, 500);
    };

    // Wait for the full page load before touching the video.
    if (document.readyState === 'complete') {
      startVideoLoad();
    } else {
      window.addEventListener('load', startVideoLoad, { once: true });
    }

    return () => {
      if (bufferInterval) clearInterval(bufferInterval);
      window.removeEventListener('load', startVideoLoad);
      // Remove dynamically added sources on unmount.
      video.querySelectorAll('source').forEach((s) => s.remove());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // Self-contained layer: fills whatever positioned parent it is placed in.
    <div className="absolute inset-0 overflow-hidden">
      {/* Rule 1: Poster — always rendered, always visible. Pure img tag, no JS dependency. */}
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-30"
          fetchPriority="high"
        />
      )}

      {/* Rule 2: Video — invisible until buffered ≥ 5s then fades in over the poster. */}
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center grayscale"
        style={{
          opacity: playing ? 0.3 : 0,
          transition: 'opacity 1s ease',
        }}
      />
    </div>
  );
}
