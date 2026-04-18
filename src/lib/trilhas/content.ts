import type { Trilha, TrilhaSlug } from '@/types/portal';

const trilhaMapaCompetencias: Trilha = {
  slug: 'mapa-competencias',
  titulo: 'Mapa de Competências',
  descricao:
    'Escolha uma matriz, auto-avalie seu nível e construa um plano de desenvolvimento focado nos maiores gaps.',
  etapas: [
    {
      slug: 'contexto',
      titulo: 'Contexto',
      descricao: 'O que é uma matriz de competências e como usá-la entre sessões',
      tipo: 'conteudo',
      config: {
        markdown: `## O que é uma matriz de competências

Uma matriz mapeia o que se espera de você em diferentes níveis. Cada **competência** tem descritores por **nível** — de júnior a senior. O objetivo não é virar "máximo" em tudo, mas identificar onde você está hoje e onde precisa chegar.

## Como usar esta trilha

- Escolha entre **PM Career Ladder** ou **Liderança** na próxima etapa.
- Para cada competência, marque seu nível atual (**azul**) e o nível alvo (**laranja**).
- Veja seus gaps ordenados.
- Escreva 3 ações concretas para atacar os maiores gaps. Elas viram tarefas automaticamente.

Não responda pensando "onde eu gostaria de estar". Responda com evidência real — que coisas você entregou no último trimestre que demonstram esse nível.`,
      },
    },
    {
      slug: 'autoavaliacao',
      titulo: 'Auto-avaliação',
      descricao: 'Escolha a matriz e marque seus níveis atuais e alvos',
      tipo: 'matriz',
      config: {
        matriz_ref: 'selectable',
        opcoes: ['pm-ladder', 'lideranca'],
        modo: 'avaliacao',
      },
    },
    {
      slug: 'gap',
      titulo: 'Seus gaps',
      descricao: 'Visualize a distância entre atual e alvo, ordenada por maior gap',
      tipo: 'matriz',
      config: {
        matriz_ref: 'selectable',
        modo: 'gap',
        fonte_avaliacao_etapa_slug: 'autoavaliacao',
      },
    },
    {
      slug: 'plano-acao',
      titulo: 'Plano de ação',
      descricao: 'Escreva 3 ações concretas. Elas viram tarefas em /portal/tarefas.',
      tipo: 'plano_acao',
      config: {
        fonte_avaliacao_etapa_slug: 'autoavaliacao',
        n_acoes: 3,
      },
    },
  ],
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
