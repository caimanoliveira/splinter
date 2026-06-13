import { createClient } from '@supabase/supabase-js'

// Use || (not ??) so empty-string env vars also fall back to the placeholder.
// The placeholder is a valid URL that lets createClient succeed at build time;
// real requests only happen in the browser where the env vars are set.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
)
