/** Minimal white line-art “bad face” for offline / error screens (~30vw wide). */
export function BrokenMachineIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={
        className ??
        "mx-auto block h-auto w-[30vw] min-w-[140px] max-w-[400px] text-white"
      }
      aria-hidden
    >
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="38" cy="46" r="3.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="62" cy="46" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M 32 64 Q 50 78 68 64"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
