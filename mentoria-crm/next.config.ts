import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from selecting the monorepo root (which has no
    // node_modules on Vercel) as the workspace root when it detects the
    // parent package-lock.json alongside this app's own lockfile.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
