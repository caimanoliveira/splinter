import { createClient } from '@supabase/supabase-js'

// Fallbacks prevent createClient() from throwing during Next.js build when
// env vars are not injected (all actual calls happen inside useEffect, never at SSR time).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
