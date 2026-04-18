import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const { mentorado_id, email, name } = await request.json()

  if (!mentorado_id || !email) {
    return NextResponse.json({ error: 'mentorado_id e email obrigatórios' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error: updateError } = await supabaseAdmin
    .from('mentorados')
    .update({ status: 'completed' })
    .eq('id', mentorado_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('[concluir-mentoria] RESEND_API_KEY não configurado — email não enviado')
    return NextResponse.json({ success: true, skipped: true })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const nome = name?.split(' ')[0] ?? 'Mentorado'
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://splinter-yhcm.vercel.app'
  const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#0f172a;padding:24px;">
      <h1 style="font-size:22px;font-weight:900;margin:0 0 8px;">Sua Travessia chegou ao fim 🎯</h1>
      <p style="color:#64748b;margin:0 0 24px;font-size:15px;">Olá, ${nome}! Foi uma honra acompanhar sua jornada de decisão de carreira.</p>

      <p style="margin:0 0 12px;font-size:15px;font-weight:600;">Em uma escala de 1 a 10, o quanto você recomendaria essa mentoria para um amigo?</p>
      <p style="color:#94a3b8;font-size:12px;margin:0 0 16px;">1 = definitivamente não recomendaria · 10 = recomendaria com certeza</p>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:28px;">
        ${scores.map(s => `
          <a href="${portalUrl}/portal/nps?score=${s}&id=${mentorado_id}"
            style="display:inline-block;width:38px;height:38px;line-height:38px;text-align:center;border-radius:50%;background:${s >= 9 ? '#1E88E5' : s >= 7 ? '#475569' : '#e2e8f0'};color:${s >= 7 ? 'white' : '#475569'};font-weight:700;text-decoration:none;font-size:14px;">
            ${s}
          </a>`).join('')}
      </div>

      <p style="color:#94a3b8;font-size:12px;margin-top:32px;">Mentoria Carreira &amp; Decisão · <a href="${portalUrl}/portal/dashboard" style="color:#1E88E5;">Acessar portal</a></p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: 'Mentoria Carreira & Decisão <noreply@caimanoliveira.com.br>',
    to: email,
    subject: 'Como foi sua Travessia? 🎯',
    html,
  })

  if (error) {
    console.error('[concluir-mentoria] Resend error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
