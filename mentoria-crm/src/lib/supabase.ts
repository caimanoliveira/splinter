import { createClient } from '@supabase/supabase-js'

// Vercel sets NEXT_PUBLIC_SUPABASE_URL to whitespace when the project env var
// is not yet configured. Turbopack constant-folds `" " || fallback` → `" "`
// (whitespace is truthy), so we trim first so the || sees an empty string.
const _url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const _key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

export const supabase = createClient(
  _url || 'https://placeholder.supabase.co',
  _key || 'placeholder-anon-key'
)
