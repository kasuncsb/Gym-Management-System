/** Broken gym dumbbell — clearly “equipment out of order”, not abstract gears. */
export function BrokenMachineIcon({ className }: { className?: string }) {
  return (
    <svg
      width="88"
      height="56"
      viewBox="0 0 88 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? "mx-auto text-zinc-400"}
      aria-hidden
    >
      {/* Left bell */}
      <circle cx="18" cy="28" r="12" stroke="currentColor" strokeWidth="2" />
      {/* Right bell */}
      <circle cx="70" cy="28" r="12" stroke="currentColor" strokeWidth="2" />
      {/* Handle — broken gap in the middle */}
      <path
        d="M30 28h10M48 28h10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Jagged break + stress mark */}
      <path
        d="M38 22 L42 28 L38 34 M42 22 L46 28 L42 34"
        stroke="#ef4444"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="28" r="2.5" fill="#ef4444" opacity="0.85" />
    </svg>
  );
}
