import { NextRequest } from 'next/server';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase-server';
import { getTrilhaSafe } from '@/lib/trilhas/content';
import { PERGUNTAS_ENTREVISTA } from '@/lib/trilhas/perguntas';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#0f172a' },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  qBlock: { marginBottom: 20, borderLeftWidth: 2, borderLeftColor: '#1E88E5', paddingLeft: 10 },
  qText: { fontSize: 11, fontWeight: 700, marginBottom: 8 },
  label: { fontSize: 9, fontWeight: 700, color: '#64748b', marginTop: 6, textTransform: 'uppercase' },
  body: { fontSize: 10, marginTop: 2, lineHeight: 1.4 },
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const trilhaSlug = url.searchParams.get('trilha');
  const etapaSlug = url.searchParams.get('etapa');
  if (!trilhaSlug || !etapaSlug) return new Response('missing_params', { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const trilha = getTrilhaSafe(trilhaSlug);
  if (!trilha) return new Response('not_found', { status: 404 });
  if (!trilha.etapas.some((e) => e.slug === etapaSlug)) return new Response('not_found', { status: 404 });

  const { data: mt } = await supabase
    .from('mentorado_trilhas')
    .select('id')
    .eq('trilha_slug', trilhaSlug)
    .maybeSingle();
  if (!mt) return new Response('not_found', { status: 404 });

  const { data: resp } = await supabase
    .from('etapa_respostas')
    .select('resposta')
    .eq('mentorado_trilha_id', mt.id)
    .eq('etapa_slug', etapaSlug)
    .maybeSingle();

  const stars = (resp?.resposta as { stars?: Record<string, { s: string; t: string; a: string; r: string }> } | null)?.stars ?? {};

  const blocks = Object.entries(stars)
    .map(([pid, star]) => ({ pergunta: PERGUNTAS_ENTREVISTA.find((p) => p.id === pid), star }))
    .filter((x): x is { pergunta: typeof PERGUNTAS_ENTREVISTA[number]; star: { s: string; t: string; a: string; r: string } } => !!x.pergunta);

  const doc = createElement(
    Document,
    null,
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.h1 }, `${trilha.titulo} — STARs`),
      ...blocks.map((b, i) =>
        createElement(
          View,
          { key: i, style: styles.qBlock },
          createElement(Text, { style: styles.qText }, b.pergunta.texto),
          createElement(Text, { style: styles.label }, 'Situação'),
          createElement(Text, { style: styles.body }, b.star.s || '—'),
          createElement(Text, { style: styles.label }, 'Tarefa'),
          createElement(Text, { style: styles.body }, b.star.t || '—'),
          createElement(Text, { style: styles.label }, 'Ação'),
          createElement(Text, { style: styles.body }, b.star.a || '—'),
          createElement(Text, { style: styles.label }, 'Resultado'),
          createElement(Text, { style: styles.body }, b.star.r || '—'),
        )
      )
    )
  );

  const buf = await renderToBuffer(doc);
  return new Response(buf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="stars-${trilhaSlug}.pdf"`,
    },
  });
}
