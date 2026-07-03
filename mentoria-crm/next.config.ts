import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: both mentoria-crm/ and the repo root have package-lock.json.
  // Without this, Turbopack selects the parent lockfile as root and warns
  // (or fails on Vercel). process.cwd() is used instead of __dirname because
  // next.config.ts may be compiled to a temp location before evaluation.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
