import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Without this, Turbopack selects the monorepo root (which Vercel does not
    // install node_modules for) as the workspace root when it sees both the
    // repo-root package-lock.json and our own lockfile. process.cwd() resolves
    // to the app directory at build time and is more robust than __dirname
    // across different module-loading strategies.
    root: process.cwd(),
  },
};

export default nextConfig;
