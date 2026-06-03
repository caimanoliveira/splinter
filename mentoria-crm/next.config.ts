import type { NextConfig } from "next";

// __dirname resolves to the mentoria-crm/ directory via SWC's requireFromString,
// pinning Turbopack's workspace root here so it doesn't scan up to the repo root
// (which has no node_modules/ on Vercel when rootDirectory is set).
declare const __dirname: string;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
