import { createClient } from '@supabase/supabase-js'

// Fallback values prevent module-level initialization from throwing during
// Next.js build-time evaluation. Real values are embedded by Vercel at build
// via NEXT_PUBLIC_* env vars and used at runtime.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
)
