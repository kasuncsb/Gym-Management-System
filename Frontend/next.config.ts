import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  register: true,
  additionalPrecacheEntries: [
    { url: "/pwa", revision },
    { url: "/pwa/onboarding", revision },
    { url: "/~offline", revision },
    // Ensure the PWA splash art is available offline.
    { url: "/icons/member.png", revision },
  ],
});

if (!process.env.BACKEND_URL) {
  throw new Error("BACKEND_URL is not set in the Frontend .env file.");
}

const nextConfig: NextConfig = {
  // Trace production deps into `.next/standalone` — small image vs copying full `node_modules`
  // (avoids BuildKit "parent snapshot does not exist" failures on constrained VPS disks).
  output: "standalone",
  experimental: {
    // Match nginx's client_max_body_size 20M (used for file uploads in production).
    // Without this, Next.js's default ~1 MB limit would reject large uploads in dev.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  // NOTE: "Unable to add filesystem: <illegal path>" in the browser console is a
  // known cosmetic warning when running Next.js 15/16 inside Docker on Windows.
  // It comes from the "Open in Editor" overlay feature trying to mount /app/...
  // via the browser File System Access API — harmless, no config toggle exists yet.
  // To hide it: DevTools → Console filter → type  -filesystem
  async rewrites() {
    // In production, nginx handles /api/* proxying — no rewrites needed here.
    // In development (docker-compose.dev.yml), there is no nginx, so Next.js
    // proxies /api/* to the backend container directly.
    if (process.env.NODE_ENV === "production") return [];

    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default withSerwist(nextConfig);
