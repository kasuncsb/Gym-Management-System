"use client";

/**
 * Renders the current year client-side only.
 * This avoids the SSR/client clock mismatch that causes React hydration
 * error #418 when new Date().getFullYear() is evaluated in server components.
 */
export function CurrentYear() {
  return <>{new Date().getFullYear()}</>;
}
