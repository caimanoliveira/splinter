import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function checkInternalSecret(request: NextRequest): boolean {
  const secret = process.env.CRM_API_SECRET
  if (!secret) return true // secret not configured — allow (dev/self-hosted)
  const auth = request.headers.get('x-crm-secret')
  return auth === secret
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>')
}

export async function POST(request: NextRequest) {
  if (!checkInternalSecret(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { mentorado_id, date, summary, decisions, next_steps } = await request.json()

  if (!mentorado_id) {
    return NextResponse.json({ error: 'mentorado_id obrigatório' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: mentorado } = await supabaseAdmin
    .from('mentorados')
    .select('name, email')
    .eq('id', mentorado_id)
    .single()

  if (!mentorado?.email) {
    return NextResponse.json({ error: 'Mentorado não encontrado' }, { status: 404 })
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('[enviar-resumo-sessao] RESEND_API_KEY não configurado — email não enviado')
    return NextResponse.json({ success: true, skipped: true })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const nome = mentorado.name?.split(' ')[0] ?? 'Mentorado'
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://mentoria.caimanoliveira.com.br'

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#0f172a;padding:24px;">
      <div style="margin-bottom:24px;">
        <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;">
          <span style="font-weight:900;font-size:16px;">Mentoria Carreira &amp; Decisão</span>
        </div>
        <h1 style="font-size:22px;font-weight:900;margin:0 0 4px;">Resumo da sua sessão</h1>
        <p style="color:#64748b;margin:0;font-size:14px;">${dateFormatted}</p>
      </div>

      <p style="font-size:15px;margin-bottom:24px;">Olá, ${nome}! Aqui está o registro da sua sessão de hoje.</p>

      ${summary ? `
      <div style="margin-bottom:20px;">
        <p style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Resumo</p>
        <p style="font-size:14px;line-height:1.6;color:#0f172a;margin:0;">${escapeHtml(summary)}</p>
      </div>` : ''}

      ${decisions ? `
      <div style="margin-bottom:20px;">
        <p style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Decisões tomadas</p>
        <p style="font-size:14px;line-height:1.6;color:#0f172a;margin:0;">${escapeHtml(decisions)}</p>
      </div>` : ''}

      ${next_steps ? `
      <div style="margin-bottom:28px;">
        <p style="font-size:11px;font-weight:700;color:#F97316;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Próximos passos</p>
        <p style="font-size:14px;line-height:1.6;color:#0f172a;margin:0;">${escapeHtml(next_steps)}</p>
      </div>` : ''}

      <a href="${portalUrl}/portal/dashboard"
        style="display:inline-block;background:#1E88E5;color:white;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:700;font-size:14px;">
        Acessar meu portal →
      </a>

      <p style="color:#94a3b8;font-size:12px;margin-top:32px;">Mentoria Carreira &amp; Decisão</p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: 'Mentoria Carreira & Decisão <noreply@caimanoliveira.com.br>',
    to: mentorado.email,
    subject: `Resumo da sessão — ${dateFormatted}`,
    html,
  })

  if (error) {
    console.error('[enviar-resumo-sessao] Resend error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
