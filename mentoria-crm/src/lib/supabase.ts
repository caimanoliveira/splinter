import { createClient } from '@supabase/supabase-js'

// Deferred so the client is only created on first access, not at module eval
// time. This prevents "supabaseUrl is required" errors when env vars are
// absent during Next.js build / static-analysis.
function make() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

type Client = ReturnType<typeof make>

let _client: Client | undefined

function getClient(): Client {
  return (_client ??= make())
}

export const supabase: Client = new Proxy({} as Client, {
  get(_t, prop: string | symbol) {
    const c = getClient()
    const v = c[prop as keyof Client]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof v === 'function' ? (v as (...a: any[]) => any).bind(c) : v
  },
})
