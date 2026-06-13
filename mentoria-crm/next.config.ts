import type { NextConfig } from "next";

// Provide build-time fallbacks so createClient never receives an empty URL
// when NEXT_PUBLIC_SUPABASE_* vars are absent from the build environment.
// Vercel's actual env vars take precedence over these defaults at build time.
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim() || "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim() || "placeholder-anon-key",
  },
};

export default nextConfig;
