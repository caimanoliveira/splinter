import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevents Turbopack from picking up the parent repo's lockfile
    // when this project is built as a monorepo subdirectory on Vercel.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
