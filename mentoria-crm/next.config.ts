import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from walking up to the parent repo's package-lock.json
    // and picking it as workspace root. On Vercel only mentoria-crm/node_modules
    // is installed, so resolving against the repo root breaks the build.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
