import type { Trilha, TrilhaSlug } from '@/types/portal';
import { PERGUNTAS_ENTREVISTA } from './perguntas';

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
  etapas: [
    {
      slug: 'mapeamento-intro',
      titulo: 'Como mapear um processo seletivo',
      descricao: 'Antes de treinar respostas, entenda o processo e o papel',
      tipo: 'conteudo',
      config: {
        markdown: `## Antes de treinar respostas, entenda o alvo

Entrar numa entrevista sem pesquisar é como entrar num prova sem saber a matéria. Dedique 45-60 minutos a:

### 1. Empresa
- Missão, produto principal, fase (early/growth/mature).
- Número de funcionários, modelo de negócio (B2B/B2C/marketplace/SaaS).
- Sinais recentes: funding, layoffs, lançamentos, releases.

### 2. Papel
- Releia a vaga. Quais as 3 responsabilidades principais?
- Quem é o stakeholder mais próximo desse papel?
- Qual o escopo (produto, feature, time, área)?

### 3. Processo
- Quantas fases? O que acontece em cada uma?
- Quem entrevista em cada fase? Procure no LinkedIn.
- Tem case? Pair? Apresentação final?

### 4. Entrevistadores
- Pesquisar background de cada um.
- Procurar talks, artigos, tweets: revela o que valorizam.
- Anotar 2-3 perguntas específicas para cada (curiosidade sobre o trabalho deles).

Na próxima etapa tem um checklist para você atacar isso de forma estruturada.`,
      },
    },
    {
      slug: 'mapeamento-checklist',
      titulo: 'Checklist de mapeamento',
      descricao: 'Execute a pesquisa antes de continuar',
      tipo: 'checklist',
      config: {
        itens: [
          { id: 'empresa', label: 'Pesquisei a empresa (missão, produto, fase, sinais recentes)' },
          { id: 'vaga', label: 'Li a JD duas vezes e anotei as 3 responsabilidades principais' },
          { id: 'processo', label: 'Mapeei as fases do processo e quem entrevista em cada uma' },
          { id: 'entrevistadores', label: 'Pesquisei o background dos entrevistadores no LinkedIn' },
          { id: 'perguntas-entrevistador', label: 'Escrevi 3 perguntas que vou fazer ao entrevistador' },
        ],
      },
    },
    {
      slug: 'banco-perguntas',
      titulo: 'Banco de perguntas',
      descricao: 'Filtre por categoria e senioridade. Favorite as que quer treinar.',
      tipo: 'banco_perguntas',
      config: {
        perguntas: PERGUNTAS_ENTREVISTA,
        min_favoritas: 5,
      },
    },
    {
      slug: 'star-builder',
      titulo: 'Construtor STAR',
      descricao: 'Escreva Situação/Tarefa/Ação/Resultado para cada pergunta favorita',
      tipo: 'star_builder',
      config: {
        min_completos: 5,
        fonte_favoritas_etapa_slug: 'banco-perguntas',
      },
    },
    {
      slug: 'treino',
      titulo: 'Treino com cronômetro',
      descricao: 'Responda 5 perguntas em voz alta, cronometre 2 min cada',
      tipo: 'checklist',
      config: {
        itens: [
          { id: 'treino-1', label: 'Treinei pergunta 1 (em voz alta, 2 min)', com_input: true },
          { id: 'treino-2', label: 'Treinei pergunta 2 (em voz alta, 2 min)', com_input: true },
          { id: 'treino-3', label: 'Treinei pergunta 3 (em voz alta, 2 min)', com_input: true },
          { id: 'treino-4', label: 'Treinei pergunta 4 (em voz alta, 2 min)', com_input: true },
          { id: 'treino-5', label: 'Treinei pergunta 5 (em voz alta, 2 min)', com_input: true },
        ],
        permitir_concluir_parcial: true,
      },
    },
    {
      slug: 'checklist-final',
      titulo: 'Checklist pré-entrevista',
      descricao: 'No dia, rode por esta lista antes de entrar',
      tipo: 'checklist',
      config: {
        itens: [
          { id: 'dormir', label: 'Dormi bem na noite anterior' },
          { id: 'revisar-stars', label: 'Revisei meus STARs favoritos (5-10 min)' },
          { id: 'camera', label: 'Testei câmera, áudio e luz no ambiente da chamada' },
          { id: 'internet', label: 'Verifiquei estabilidade da internet / tenho backup (4G)' },
          { id: 'documentos', label: 'Abri research doc da empresa e do entrevistador numa aba' },
          { id: 'agua', label: 'Tenho água à mão' },
          { id: 'perguntas-preparadas', label: 'Tenho as 3 perguntas para o entrevistador anotadas' },
          { id: 'chegada', label: 'Estou 5 minutos antes pronto para entrar' },
          { id: 'celular', label: 'Silenciei notificações do celular e do computador' },
          { id: 'bloco', label: 'Tenho bloco de anotações ao lado' },
          { id: 'respiracao', label: 'Fiz 3 respirações profundas antes de abrir a chamada' },
        ],
      },
    },
  ],
};

const trilhas: Record<TrilhaSlug, Trilha> = {
  'mapa-competencias': trilhaMapaCompetencias,
  'preparacao-entrevistas': trilhaPreparacaoEntrevistas,
};

export function getTrilha(slug: TrilhaSlug): Trilha {
  const t = trilhas[slug];
  if (!t) throw new Error(`trilha_not_found: ${slug}`);
  return t;
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
