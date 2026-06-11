import { createClient } from '@supabase/supabase-js'

// NEXT_PUBLIC_* vars are embedded at build time. In preview/CI builds where
// env vars may be absent, use placeholders so the module doesn't crash.
// All Supabase calls are in client-side useEffect hooks — they never run
// during static page generation.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
