import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const TRILHAS_VALIDAS = new Set(['preparacao-entrevistas', 'mapa-competencias'])

export async function POST(request: NextRequest) {
  const { mentorado_id, trilha_slug, assigned_by } = await request.json()

  if (!mentorado_id || !trilha_slug) {
    return NextResponse.json({ error: 'mentorado_id e trilha_slug são obrigatórios' }, { status: 400 })
  }

  if (!TRILHAS_VALIDAS.has(trilha_slug)) {
    return NextResponse.json({ error: 'trilha_slug inválido' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin
    .from('mentorado_trilhas')
    .insert({
      mentorado_id,
      trilha_slug,
      assigned_by: assigned_by ?? null,
    })
    .select('id, trilha_slug, assigned_at, started_at, completed_at')
    .single()

  if (error) {
    const status = error.code === '23505' ? 409 : 500
    return NextResponse.json({ error: error.message, code: error.code }, { status })
  }

  return NextResponse.json(data)
}
