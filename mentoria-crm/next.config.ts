import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the workspace root warning when building in a monorepo subdirectory.
  // Vercel only installs node_modules inside rootDirectory, so tracing must be
  // scoped to this package rather than the repo root.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
