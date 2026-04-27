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
  async redirects() {
    return [
      // Root → Overview dashboard
      { source: "/", destination: "/overview", permanent: false },
    ];
  },
};

export default nextConfig;
