import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevents Turbopack from traversing up and finding the monorepo root's
    // package-lock.json, which would confuse workspace root detection when
    // Vercel builds this sub-project.
    root: __dirname,
  },
};

export default nextConfig;
