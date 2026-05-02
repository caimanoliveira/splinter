import { createClient } from '@/lib/supabase-server';
import { getTrilhaSafe } from './content';
import type { MentoradoTrilha, EtapaResposta, Trilha, TrilhaSlug } from '@/types/portal';

export interface TrilhaComProgresso {
  trilha: Trilha;
  mentorado_trilha: MentoradoTrilha | null;
  etapas_done: number;
  etapas_total: number;
  proxima_etapa_slug: string | null;
}

async function getMentoradoCtx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('mentorados').select('id').eq('user_id', user.id).maybeSingle();
  if (!data) return null;
  return { supabase, mentoradoId: data.id as string };
}

export async function getTrilhasAtribuidas(): Promise<TrilhaComProgresso[]> {
  const ctx = await getMentoradoCtx();
  if (!ctx) return [];
  const { supabase, mentoradoId } = ctx;
  const { data: mtRows } = await supabase
    .from('mentorado_trilhas')
    .select('*, etapa_respostas(etapa_slug, status)')
    .eq('mentorado_id', mentoradoId);

  const rows = (mtRows ?? []) as Array<
    MentoradoTrilha & { etapa_respostas: { etapa_slug: string; status: string }[] }
  >;

  const out: TrilhaComProgresso[] = [];
  for (const r of rows) {
    const trilha = getTrilhaSafe(r.trilha_slug);
    if (!trilha) continue;
    const doneSlugs = new Set(
      r.etapa_respostas.filter((e) => e.status === 'done').map((e) => e.etapa_slug)
    );
    const etapasDone = trilha.etapas.filter((e) => doneSlugs.has(e.slug)).length;
    const proxima = trilha.etapas.find((e) => !doneSlugs.has(e.slug))?.slug ?? null;
    out.push({
      trilha,
      mentorado_trilha: {
        id: r.id,
        mentorado_id: r.mentorado_id,
        trilha_slug: r.trilha_slug as TrilhaSlug,
        assigned_at: r.assigned_at,
        assigned_by: r.assigned_by,
        started_at: r.started_at,
        completed_at: r.completed_at,
      },
      etapas_done: etapasDone,
      etapas_total: trilha.etapas.length,
      proxima_etapa_slug: proxima,
    });
  }
  return out;
}

export async function getTrilhaComProgresso(
  trilhaSlug: string
): Promise<TrilhaComProgresso | null> {
  const trilha = getTrilhaSafe(trilhaSlug);
  if (!trilha) return null;
  const ctx = await getMentoradoCtx();
  if (!ctx) return null;
  const { supabase, mentoradoId } = ctx;
  const { data: mt } = await supabase
    .from('mentorado_trilhas')
    .select('*, etapa_respostas(etapa_slug, status)')
    .eq('trilha_slug', trilhaSlug)
    .eq('mentorado_id', mentoradoId)
    .maybeSingle();
  if (!mt) {
    return {
      trilha,
      mentorado_trilha: null,
      etapas_done: 0,
      etapas_total: trilha.etapas.length,
      proxima_etapa_slug: trilha.etapas[0]?.slug ?? null,
    };
  }
  const respostas = (mt.etapa_respostas ?? []) as { etapa_slug: string; status: string }[];
  const doneSlugs = new Set(
    respostas.filter((e) => e.status === 'done').map((e) => e.etapa_slug)
  );
  const etapasDone = trilha.etapas.filter((e) => doneSlugs.has(e.slug)).length;
  const proxima = trilha.etapas.find((e) => !doneSlugs.has(e.slug))?.slug ?? null;
  return {
    trilha,
    mentorado_trilha: {
      id: mt.id,
      mentorado_id: mt.mentorado_id,
      trilha_slug: mt.trilha_slug as TrilhaSlug,
      assigned_at: mt.assigned_at,
      assigned_by: mt.assigned_by,
      started_at: mt.started_at,
      completed_at: mt.completed_at,
    },
    etapas_done: etapasDone,
    etapas_total: trilha.etapas.length,
    proxima_etapa_slug: proxima,
  };
}

export async function getEtapaResposta(
  mentoradoTrilhaId: string,
  etapaSlug: string
): Promise<EtapaResposta | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('etapa_respostas')
    .select('*')
    .eq('mentorado_trilha_id', mentoradoTrilhaId)
    .eq('etapa_slug', etapaSlug)
    .maybeSingle();
  return (data as EtapaResposta) ?? null;
}

export async function getTrilhaEmAndamento(): Promise<TrilhaComProgresso | null> {
  const todas = await getTrilhasAtribuidas();
  return (
    todas.find(
      (t) => t.mentorado_trilha?.started_at && !t.mentorado_trilha?.completed_at
    ) ?? null
  );
}
