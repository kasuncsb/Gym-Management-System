/** Bad face icon — clear “something is broken” indicator for offline/global errors. */
export function BrokenMachineIcon({ className }: { className?: string }) {
  return (
    <svg
      width="72"
      height="56"
      viewBox="0 0 72 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? "mx-auto text-zinc-400"}
      aria-hidden
    >
      {/* Head */}
      <path
        d="M36 8c-14 0-24 10-24 24s10 22 24 22 24-8 24-22S50 8 36 8Z"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Eyes */}
      <circle cx="25" cy="30" r="3.5" fill="currentColor" />
      <circle cx="47" cy="30" r="3.5" fill="currentColor" opacity="0.75" />

      {/* Broken/frown mouth */}
      <path
        d="M27 39c2.5-3 5.5-4.5 9-4.5s6.5 1.5 9 4.5"
        stroke="#ef4444"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M29 41c2-1 4.5-1.8 7-1.8s5 .8 7 1.8"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Crack line accent */}
      <path
        d="M41 14L34 24"
        stroke="#ef4444"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="33" cy="25.5" r="1.7" fill="#ef4444" opacity="0.9" />
    </svg>
  );
}

