import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack workspace root to this directory. Without this, Turbopack
  // walks up and selects the parent splinter/ lockfile as root — which has no
  // node_modules on Vercel (only mentoria-crm/node_modules is installed),
  // causing all module resolution to fail at build time.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
