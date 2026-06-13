import { createClient } from '@supabase/supabase-js'

// Use placeholder values at build time so createClient never throws when env
// vars are absent. The proxy defers actual client creation to first access.
const make = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )

type Client = ReturnType<typeof make>
let _client: Client | undefined

export const supabase: Client = new Proxy({} as Client, {
  get(_t, prop: string | symbol) {
    _client ??= make()
    const v = _client[prop as keyof Client]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof v === 'function' ? (v as (...a: any[]) => any).bind(_client) : v
  },
})
