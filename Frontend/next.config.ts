import type { NextConfig } from "next";

if (!process.env.BACKEND_URL) {
  throw new Error('❌  BACKEND_URL is not set in the Frontend .env file.');
}

const nextConfig: NextConfig = {
  experimental: {
    // Match nginx's client_max_body_size 20M (used for file uploads in production).
    // Without this, Next.js's default ~1 MB limit would reject large uploads in dev.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
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
};

export default nextConfig;
