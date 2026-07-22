import { createClient } from '@supabase/supabase-js'

// Fallbacks prevent createClient from throwing during Next.js build-time SSR
// when NEXT_PUBLIC_ vars haven't been embedded yet. Real values are required
// at runtime for any Supabase call to succeed.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
