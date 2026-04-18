import { createClient } from '@supabase/supabase-js'

// Fallbacks keep `createClient` from throwing during static prerender when
// NEXT_PUBLIC_SUPABASE_* env vars are missing at build time. Real values are
// inlined by Next.js for browser runtime when configured on Vercel.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'build-placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
