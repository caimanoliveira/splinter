import { createClient } from '@supabase/supabase-js'

// Fallback prevents build-time crash when env vars are absent (e.g. preview
// deployments on Vercel before env vars are configured). At runtime the client
// will simply return auth/fetch errors, which is the expected behaviour.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
)
