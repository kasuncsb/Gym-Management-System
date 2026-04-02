/** Small simple broken-machine icon — shared by error/offline UIs. */
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
      <rect x="12" y="28" width="48" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="26" cy="22" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M26 15v4M26 25v4M19 22h4M29 22h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="46" cy="22" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
      <path
        d="M46 15v4M46 25v4M39 22h4M51 22h3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M38 8 L34 20 L38 24 L32 36"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <circle cx="35" cy="38" r="2" fill="#ef4444" opacity="0.7" />
    </svg>
  );
}
