import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevents Turbopack from selecting the monorepo root as workspace root.
    // Without this, Vercel builds fail because the parent node_modules doesn't exist there.
    root: __dirname,
  },
};

export default nextConfig;
