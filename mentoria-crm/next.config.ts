import path from "path"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Vercel clones the full repo but only installs node_modules in the
    // rootDirectory (mentoria-crm). Without this, Turbopack walks up to the
    // repo root (finding /splinter/package-lock.json) and tries to resolve
    // modules from /splinter/node_modules which does not exist in CI.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
