import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, mentorado_id, name } = await request.json()

  if (!email || !mentorado_id) {
    return NextResponse.json({ error: 'Email e mentorado_id são obrigatórios' }, { status: 400 })
  }

  // Use service role key for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Invite user by email (sends welcome email with set-password link)
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: process.env.NEXT_PUBLIC_PORTAL_URL + '/portal/login/nova-senha',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Update mentorado with the new user_id
  const { error: updateError } = await supabaseAdmin
    .from('mentorados')
    .update({ user_id: data.user.id })
    .eq('id', mentorado_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, user_id: data.user.id })
}
