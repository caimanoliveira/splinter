import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack workspace root to this directory so it doesn't walk up to
  // the parent splinter/ lockfile and break module resolution on Vercel.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
