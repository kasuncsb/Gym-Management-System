/** Minimal white line-art sad face for offline / error screens (~15vw wide). */
export function BrokenMachineIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={
        className ??
        "mx-auto block h-auto w-[15vw] min-w-[72px] max-w-[200px] text-white"
      }
      aria-hidden
    >
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="38" cy="46" r="3.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="62" cy="46" r="3.5" stroke="currentColor" strokeWidth="2" />
      {/* Sad mouth: smooth arc — 20% shorter width than before, still symmetric about x=50. */}
      <path
        d="M 32.4 70 Q 50 56 67.6 70"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
