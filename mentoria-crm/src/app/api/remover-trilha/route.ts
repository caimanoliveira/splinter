import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(request: NextRequest) {
  const { mentorado_trilha_id } = await request.json()

  if (!mentorado_trilha_id) {
    return NextResponse.json({ error: 'mentorado_trilha_id é obrigatório' }, { status: 400 })
  }

  if (!UUID_RE.test(mentorado_trilha_id)) {
    return NextResponse.json({ error: 'mentorado_trilha_id inválido' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Only allow deleting trilhas that haven't been started yet
  const { data: mt, error: fetchError } = await supabaseAdmin
    .from('mentorado_trilhas')
    .select('id, started_at')
    .eq('id', mentorado_trilha_id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!mt) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (mt.started_at) return NextResponse.json({ error: 'trilha_ja_iniciada' }, { status: 409 })

  const { error } = await supabaseAdmin
    .from('mentorado_trilhas')
    .delete()
    .eq('id', mentorado_trilha_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
