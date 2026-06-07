import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from using the monorepo root's lockfile as workspace
    // root, which causes module resolution failures when Vercel only installs
    // this sub-project's node_modules.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
