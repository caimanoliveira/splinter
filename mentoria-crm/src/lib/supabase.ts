import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _instance: SupabaseClient | undefined

function getInstance(): SupabaseClient {
  return (_instance ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))
}

// Lazy proxy: defers createClient until first property access so the module
// can be imported at build time without NEXT_PUBLIC_SUPABASE_* env vars.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const instance = getInstance()
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value
  },
})
