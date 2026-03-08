import type { NextConfig } from "next";

if (!process.env.BACKEND_URL) {
  throw new Error('❌  BACKEND_URL is not set in the Frontend .env file.');
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
