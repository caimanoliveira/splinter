import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | undefined

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    if (!_client) {
      _client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    return Reflect.get(_client, prop)
  },
})
