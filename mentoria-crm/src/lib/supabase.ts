import { createClient } from '@supabase/supabase-js'

// Fallback values keep createClient from throwing at module-eval time when
// NEXT_PUBLIC_ vars are absent during Vercel PR preview builds. Actual
// requests only happen in the browser after hydration, where real values exist.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
)
