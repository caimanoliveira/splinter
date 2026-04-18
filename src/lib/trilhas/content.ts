import type { Trilha, TrilhaSlug } from '@/types/portal';

const trilhaMapaCompetencias: Trilha = {
  slug: 'mapa-competencias',
  titulo: 'Mapa de Competências',
  descricao:
    'Escolha uma matriz, auto-avalie seu nível e construa um plano de desenvolvimento focado nos maiores gaps.',
  etapas: [],
};

const trilhaPreparacaoEntrevistas: Trilha = {
  slug: 'preparacao-entrevistas',
  titulo: 'Preparação para Entrevistas',
  descricao:
    'Mapeie o processo seletivo, monte respostas STAR para perguntas-chave e chegue à entrevista sem surpresas.',
  etapas: [],
};

const trilhas: Record<TrilhaSlug, Trilha> = {
  'mapa-competencias': trilhaMapaCompetencias,
  'preparacao-entrevistas': trilhaPreparacaoEntrevistas,
};

export function getTrilha(slug: TrilhaSlug): Trilha {
  return trilhas[slug];
}

export function getTrilhaSafe(slug: string): Trilha | null {
  if (slug in trilhas) return trilhas[slug as TrilhaSlug];
  return null;
}

export function getEtapa(trilhaSlug: TrilhaSlug, etapaSlug: string) {
  const trilha = trilhas[trilhaSlug];
  const etapa = trilha.etapas.find((e) => e.slug === etapaSlug);
  if (!etapa) return null;
  return { trilha, etapa };
}

export function listTrilhas(): Trilha[] {
  return Object.values(trilhas);
}
