'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getTrilha, getEtapa } from './content';
import { respostaSchemaFor } from './schemas';
import type { TrilhaSlug } from '@/types/portal';

async function requireMentoradoId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('unauthenticated');
  const { data } = await supabase.from('mentorados').select('id').eq('user_id', user.id).single();
  if (!data) throw new Error('mentorado_not_found');
  return { supabase, mentoradoId: data.id as string, userId: user.id };
}

export async function startTrilhaIfNeeded(trilhaSlug: TrilhaSlug) {
  const { supabase, mentoradoId } = await requireMentoradoId();
  const { data: mt } = await supabase
    .from('mentorado_trilhas')
    .select('id, started_at')
    .eq('mentorado_id', mentoradoId)
    .eq('trilha_slug', trilhaSlug)
    .maybeSingle();
  if (!mt) throw new Error('trilha_not_assigned');
  if (!mt.started_at) {
    await supabase
      .from('mentorado_trilhas')
      .update({ started_at: new Date().toISOString() })
      .eq('id', mt.id);
  }
  return mt.id as string;
}

const saveRespostaInput = z.object({
  trilhaSlug: z.string(),
  etapaSlug: z.string(),
  resposta: z.unknown(),
});

export async function saveResposta(input: z.infer<typeof saveRespostaInput>) {
  const { trilhaSlug, etapaSlug, resposta } = saveRespostaInput.parse(input);
  const { supabase, mentoradoId } = await requireMentoradoId();

  const ctx = getEtapa(trilhaSlug as TrilhaSlug, etapaSlug);
  if (!ctx) throw new Error('etapa_not_found');
  const modo = (ctx.etapa.config as Record<string, unknown>).modo as string | undefined;
  const schema = respostaSchemaFor(ctx.etapa.tipo, modo);
  const parsed = schema.partial().parse(resposta);

  const { data: mt } = await supabase
    .from('mentorado_trilhas')
    .select('id')
    .eq('mentorado_id', mentoradoId)
    .eq('trilha_slug', trilhaSlug)
    .single();
  if (!mt) throw new Error('trilha_not_assigned');

  await supabase.from('etapa_respostas').upsert(
    {
      mentorado_trilha_id: mt.id,
      etapa_slug: etapaSlug,
      status: 'in_progress',
      resposta: parsed,
    },
    { onConflict: 'mentorado_trilha_id,etapa_slug' }
  );

  revalidatePath(`/portal/trilhas/${trilhaSlug}`);
  revalidatePath(`/portal/trilhas/${trilhaSlug}/${etapaSlug}`);
}

const completeEtapaInput = z.object({
  trilhaSlug: z.string(),
  etapaSlug: z.string(),
  resposta: z.unknown(),
});

export async function completeEtapa(input: z.infer<typeof completeEtapaInput>) {
  const { trilhaSlug, etapaSlug, resposta } = completeEtapaInput.parse(input);
  const { supabase, mentoradoId } = await requireMentoradoId();

  const ctx = getEtapa(trilhaSlug as TrilhaSlug, etapaSlug);
  if (!ctx) throw new Error('etapa_not_found');
  const modo = (ctx.etapa.config as Record<string, unknown>).modo as string | undefined;
  const schema = respostaSchemaFor(ctx.etapa.tipo, modo);
  const parsed = schema.parse(resposta);

  const { data: mt } = await supabase
    .from('mentorado_trilhas')
    .select('id')
    .eq('mentorado_id', mentoradoId)
    .eq('trilha_slug', trilhaSlug)
    .single();
  if (!mt) throw new Error('trilha_not_assigned');

  await supabase.from('etapa_respostas').upsert(
    {
      mentorado_trilha_id: mt.id,
      etapa_slug: etapaSlug,
      status: 'done',
      resposta: parsed,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'mentorado_trilha_id,etapa_slug' }
  );

  const trilha = getTrilha(trilhaSlug as TrilhaSlug);
  const { data: respostas } = await supabase
    .from('etapa_respostas')
    .select('etapa_slug, status')
    .eq('mentorado_trilha_id', mt.id);
  const doneSlugs = (respostas ?? []).filter((r) => r.status === 'done').map((r) => r.etapa_slug);
  const allDone = trilha.etapas.every((e) => doneSlugs.includes(e.slug));
  if (allDone) {
    await supabase
      .from('mentorado_trilhas')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', mt.id)
      .is('completed_at', null);
  }

  revalidatePath(`/portal/trilhas`);
  revalidatePath(`/portal/trilhas/${trilhaSlug}`);
  revalidatePath(`/portal/dashboard`);
}

const submitPlanoAcaoInput = z.object({
  trilhaSlug: z.string(),
  etapaSlug: z.string(),
  acoes: z.array(
    z.object({
      competencia_id: z.string(),
      descricao: z.string().min(1),
      prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
  ).length(3),
});

export async function submitPlanoAcao(input: z.infer<typeof submitPlanoAcaoInput>) {
  const { trilhaSlug, etapaSlug, acoes } = submitPlanoAcaoInput.parse(input);
  const { supabase, mentoradoId } = await requireMentoradoId();

  const { data: mt } = await supabase
    .from('mentorado_trilhas')
    .select('id')
    .eq('mentorado_id', mentoradoId)
    .eq('trilha_slug', trilhaSlug)
    .single();
  if (!mt) throw new Error('trilha_not_assigned');

  const origem = `trilha:${trilhaSlug}:${etapaSlug}`;

  const { error } = await supabase.rpc('submit_plano_acao', {
    p_mentorado_trilha_id: mt.id,
    p_etapa_slug: etapaSlug,
    p_origem: origem,
    p_acoes: acoes,
  });
  if (error) {
    if (error.message.includes('plano_acao_ja_submetido')) throw new Error('Plano de ação já foi submetido.');
    if (error.message.includes('mentorado_trilha_not_found_or_unauthorized')) throw new Error('Trilha não encontrada ou acesso negado.');
    throw new Error('Erro ao submeter plano de ação.');
  }

  const trilha = getTrilha(trilhaSlug as TrilhaSlug);
  const { data: respostas } = await supabase
    .from('etapa_respostas')
    .select('etapa_slug, status')
    .eq('mentorado_trilha_id', mt.id);
  const doneSlugs = (respostas ?? []).filter((r) => r.status === 'done').map((r) => r.etapa_slug);
  const allDone = trilha.etapas.every((e) => doneSlugs.includes(e.slug));
  if (allDone) {
    await supabase
      .from('mentorado_trilhas')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', mt.id)
      .is('completed_at', null);
  }

  revalidatePath(`/portal/trilhas`);
  revalidatePath(`/portal/trilhas/${trilhaSlug}`);
  revalidatePath('/portal/tarefas');
  revalidatePath(`/portal/dashboard`);
}
