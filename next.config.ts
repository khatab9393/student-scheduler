import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Allow production builds to succeed even if ESLint errors are present
    ignoreDuringBuilds: true,
  },
  /* other config options here */
};

export default nextConfig;
