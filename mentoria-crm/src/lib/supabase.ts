import { createClient } from '@supabase/supabase-js'

// Fallbacks prevent build-time throw when env vars aren't set in CI/Vercel.
// At runtime the real values must be present; all data calls will fail otherwise.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
