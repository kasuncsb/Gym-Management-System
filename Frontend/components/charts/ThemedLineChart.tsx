'use client';

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
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const w = 1000;
  const h = 260;
  const xCount = labels.length;
  const xStep = xCount > 1 ? w / (xCount - 1) : w;

  return (
    <div className={className}>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
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
            />
          ))}
          {series.map((s) =>
            s.values.map((v, i) => {
              const x = i * xStep;
              const y = h - (max > 0 ? (v / max) * h : 0);
              return <circle key={`${s.name}-${i}`} cx={x} cy={y} r="4" fill={s.color} opacity="0.95" />;
            }),
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

