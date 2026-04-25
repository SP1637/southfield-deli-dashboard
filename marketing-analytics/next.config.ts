import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the tracing root to this package so Next.js doesn't get confused
  // by multiple package-lock.json files in the parent monorepo.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
