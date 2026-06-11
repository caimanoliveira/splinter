import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from walking up to the monorepo root's package-lock.json
    // and treating the parent directory as the workspace root. In Vercel, only
    // this subdirectory's node_modules is installed.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
