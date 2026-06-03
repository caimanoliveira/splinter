import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Resolve config file's own directory — works in both CJS (__dirname) and ESM (import.meta)
// and is unaffected by whatever process.cwd() Vercel sets before entering rootDirectory.
const configDir: string =
  typeof __dirname !== "undefined"
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: configDir,
  },
};

export default nextConfig;
