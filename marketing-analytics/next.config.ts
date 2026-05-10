import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  reactStrictMode: true,
  // Root routing is handled by src/middleware.ts
  // New clients → /connect (onboarding), returning clients → /overview
};

export default nextConfig;
