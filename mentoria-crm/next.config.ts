import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevents Turbopack from climbing to the repo root's package-lock.json
    // and expecting node_modules there (fails on Vercel where only this
    // subdirectory's node_modules is installed).
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
