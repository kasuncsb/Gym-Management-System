'use client';

import { useEffect, useMemo, useState } from 'react';

type Series = {
  name: string;
  color: string;
  values: number[];
};

type Props = {
  labels: string[];
  series: Series[];
  height?: number;
  className?: string;
};

function toPoints(values: number[], width: number, height: number, max: number) {
  if (values.length <= 1) return '';
  const stepX = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (max > 0 ? (v / max) * height : 0);
      return `${x},${y}`;
    })
    .join(' ');
}

export function ThemedLineChart({ labels, series, height = 220, className }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [drawReady, setDrawReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDrawReady(true), 30);
    return () => window.clearTimeout(t);
  }, [labels.length, series.length]);

  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const w = 1000;
  const h = 260;
  const xCount = labels.length;
  const xStep = xCount > 1 ? w / (xCount - 1) : w;
  const activeSummary = useMemo(() => {
    if (activeIdx == null || activeIdx < 0 || activeIdx >= labels.length) return null;
    return {
      label: labels[activeIdx],
      items: series.map((s) => ({ name: s.name, color: s.color, value: Number(s.values[activeIdx] ?? 0) })),
    };
  }, [activeIdx, labels, series]);

  return (
    <div className={className}>
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        {activeSummary && (
          <div className="absolute right-4 top-4 z-10 rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200 shadow-lg">
            <p className="text-[11px] font-semibold text-white mb-1">{activeSummary.label}</p>
            <div className="space-y-1">
              {activeSummary.items.map((it) => (
                <p key={it.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: it.color }} />
                  <span className="text-zinc-300">{it.name}:</span>
                  <span className="font-semibold text-white">{it.value}</span>
                </p>
              ))}
            </div>
          </div>
        )}
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
          <defs>
            <linearGradient id="pwGrid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#27272a" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((m) => (
            <line key={m} x1="0" y1={h * m} x2={w} y2={h * m} stroke="url(#pwGrid)" strokeWidth="1" />
          ))}
          {series.map((s) => (
            <polyline
              key={s.name}
              fill="none"
              stroke={s.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={toPoints(s.values, w, h, max)}
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: drawReady ? 0 : 1,
                transition: 'stroke-dashoffset 850ms ease-out',
              }}
            />
          ))}
          {series.map((s) =>
            s.values.map((v, i) => {
              const x = i * xStep;
              const y = h - (max > 0 ? (v / max) * h : 0);
              const active = activeIdx === i;
              return (
                <circle
                  key={`${s.name}-${i}`}
                  cx={x}
                  cy={y}
                  r={active ? 6 : 4}
                  fill={s.color}
                  opacity={active ? 1 : 0.95}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => setActiveIdx(i)}
                />
              );
            }),
          )}
          {activeIdx != null && activeIdx >= 0 && activeIdx < labels.length && (
            <line
              x1={activeIdx * xStep}
              y1={0}
              x2={activeIdx * xStep}
              y2={h}
              stroke="#71717a"
              strokeWidth="1"
              strokeDasharray="5 5"
              opacity="0.8"
            />
          )}
        </svg>
        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
        {labels.map((label, i) => (
          <span key={`${label}-${i}`} className="text-[10px] text-zinc-500 text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

