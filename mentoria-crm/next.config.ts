import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import path from "path";

const __configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: __configDir,
  },
};

export default nextConfig;
