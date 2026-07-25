import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — defers createClient() until first property access so the
// module can be imported safely during SSR/build without NEXT_PUBLIC_* vars.
let _client: SupabaseClient | undefined

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_client) {
      _client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (_client as any)[prop]
    return typeof val === 'function' ? (val as Function).bind(_client) : val
  },
})
