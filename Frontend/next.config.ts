import type { NextConfig } from "next";

if (!process.env.BACKEND_URL) {
  throw new Error('❌  BACKEND_URL is not set in the Frontend .env file.');
}

const nextConfig: NextConfig = {
  // Rewrites handled by dedicated Nginx proxy in Docker Compose
};

export default nextConfig;
