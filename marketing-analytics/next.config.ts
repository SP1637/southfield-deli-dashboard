import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Enable React strict mode for better dev-time checks
  reactStrictMode: true,
};

export default nextConfig;
