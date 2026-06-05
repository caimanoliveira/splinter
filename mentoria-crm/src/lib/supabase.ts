import { createClient, SupabaseClient } from '@supabase/supabase-js'

function makeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

let _client: SupabaseClient | null | undefined

function getClient() {
  if (_client === undefined) _client = makeClient()
  return _client
}

// Lazy proxy — defers createClient() to first property access so the module
// can be evaluated at build time even when env vars are absent.
// Typed as SupabaseClient (not ReturnType<typeof createClient>) to avoid
// TypeScript resolving generic constraints as `never` for insert/update ops.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, any, any> = new Proxy({} as SupabaseClient<any, any, any>, {
  get(_, prop) {
    const client = getClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return client ? (client as any)[prop] : undefined
  },
})
