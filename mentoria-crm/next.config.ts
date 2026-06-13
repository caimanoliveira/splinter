import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin root to this directory so Turbopack doesn't walk up to the
    // monorepo root's package-lock.json and use the wrong node_modules.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
