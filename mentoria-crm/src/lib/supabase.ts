import { createClient } from '@supabase/supabase-js'

// During build, env vars may be absent; placeholder prevents createClient from throwing.
// Actual requests will fail gracefully at runtime without valid credentials.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
)
