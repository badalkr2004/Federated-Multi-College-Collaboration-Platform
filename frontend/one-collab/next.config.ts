import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix: Turbopack was picking up E:\Hackathons\Cimage\backend\package-lock.json
  // as the workspace root. Pinning to __dirname stops the OOM crash on compilation.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
