import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from traversing up to the monorepo root and using
    // the wrong node_modules. This sub-app has its own lockfile and deps.
    root: process.cwd(),
  },
};

export default nextConfig;
