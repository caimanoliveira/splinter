# P3 — Trilhas Guiadas + Reorganização (Design)

**Data:** 2026-04-18
**Autor:** brainstorm colaborativo (imwra + Claude)
**Sprint:** P3
**Status:** em revisão

## Visão geral

P3 reorganizado. O P3 original (conversion/growth) tinha 5 US; duas já foram entregues em sprints anteriores (área de grupo em P2, perfil em P0). Este sprint mantém 3 US herdadas de conversion e adiciona 3 US novas de **metodologia self-service** via um novo conceito no portal: **Trilhas Guiadas** — jornadas estruturadas que o mentorado executa entre sessões.

**Objetivo:** garantir que o mentorado tenha acesso à metodologia, acompanhe progresso e execute tarefas diretamente do portal, com apoio contínuo de materiais e ferramentas.

**Não-objetivos:**
- Editor de trilhas autoria-pelo-mentor no CRM (P4+)
- Integração com IA/LLM (decisão explícita: manter estático/curado neste sprint)
- Cronômetro custom, gravação de áudio ou vídeo (fora de escopo)
- Suíte de testes automatizada ampla (fora do escopo operacional atual)

## Escopo

### US herdadas (reorganizadas do P3 original)

| US | Feature | Complexidade |
|---|---|---|
| US-021 | Depoimentos: coleta pós-NPS + aprovação no CRM + publicação | Média |
| US-022 | Alerta CRM "mentorado na última sessão" + log de indicações | Baixa |
| US-024 | Tracking de indicações via `?ref=` registrado no Supabase | Média |

US-023 (área de grupo) e US-025 (perfil) descartadas — já existem no portal.

### US novas — Trilhas Guiadas

| US | Feature | Complexidade |
|---|---|---|
| US-026 | **Estrutura de Trilhas** — schema Supabase, atribuição via CRM, rotas de portal (`/portal/trilhas`, `/portal/trilhas/[slug]`, `/portal/trilhas/[slug]/[etapa_slug]`), widget no dashboard | Alta |
| US-027 | **Conteúdo: Trilha "Preparação para Entrevistas"** — 5 etapas (mapeamento, banco de perguntas, STAR, treino, checklist) | Média |
| US-028 | **Conteúdo: Trilha "Mapa de Competências"** — 4 etapas (contexto, auto-avaliação, gap, plano de ação com geração automática de tarefas) | Média |

## Decisões de arquitetura

### Conteúdo em código, progresso no DB

Conteúdo das trilhas (etapas, perguntas curadas, matrizes, textos markdown) vive em `src/lib/trilhas/content.ts` — tipado, versionado no git. Isso elimina a necessidade de um editor de trilhas no CRM neste sprint (a feature mais cara de US-026), e não compromete o futuro: quando P4+ precisar de trilhas autoria-pelo-mentor, migra-se o conteúdo para DB e o schema de progresso já suporta.

Banco guarda **apenas atribuição e progresso**, não conteúdo.

### Sem IA/LLM

Decisão explícita tomada na fase de brainstorm. Vantagens: baixa complexidade, zero custo variável, zero dependência externa nova, sem necessidade de guardrails. Desvantagem: sem feedback personalizado automático (mentorado recebe apenas rubricas e perguntas curadas, o feedback humano vem via mentor nas sessões). Aceitável para o objetivo do sprint.

### Padrões do repo

- Next.js 16.2 App Router (server components + server actions)
- Supabase + RLS por `mentorado_id`
- SVG custom para visualizações (padrão existente em `/portal/avaliacao`)
- `lucide-react` para ícones, Tailwind para estilização
- `@react-pdf/renderer` já presente (usado para export do STAR)

## Modelo de dados

### Tipos do conteúdo (`src/lib/trilhas/content.ts`)

```ts
type EtapaTipo =
  | 'conteudo'          // bloco de markdown estático
  | 'banco_perguntas'   // widget: filtrar + favoritar perguntas
  | 'star_builder'      // widget: preencher S/T/A/R para perguntas favoritas
  | 'checklist'         // widget: marcar itens (opcional com input livre)
  | 'matriz'            // widget: autoavaliar nível por competência + gap view
  | 'plano_acao'        // widget: escolher 3 gaps → gera tarefas

type Etapa = {
  slug: string
  titulo: string
  descricao: string
  tipo: EtapaTipo
  config: unknown // validado com zod no server; ver schemas por tipo abaixo
}

type Trilha = {
  slug: 'preparacao-entrevistas' | 'mapa-competencias'
  titulo: string
  descricao: string
  etapas: Etapa[]
}
```

### Schemas de `config` por tipo (resumo)

| Tipo | Shape do `config` |
|---|---|
| `conteudo` | `{ markdown: string }` |
| `banco_perguntas` | `{ perguntas: Array<{ id, texto, categoria, senioridade }>, min_favoritas: number }` |
| `star_builder` | `{ min_completos: number, fonte_favoritas_etapa_slug: string }` (referencia `resposta.favoritas` da etapa citada) |
| `checklist` | `{ itens: Array<{ id, label, com_input?: boolean }>, permitir_concluir_parcial?: boolean }` |
| `matriz` | `{ matriz_ref: 'pm-ladder' \| 'lideranca' \| 'selectable', opcoes?: string[], modo: 'avaliacao' \| 'gap', fonte_avaliacao_etapa_slug?: string }` (se `modo='gap'`, lê níveis da etapa citada) |
| `plano_acao` | `{ fonte_avaliacao_etapa_slug: string, n_acoes: number }` (lê gap da etapa citada) |

### Schemas de `resposta` por tipo (resumo)

| Tipo | Shape da `resposta` (jsonb) |
|---|---|
| `conteudo` | `{ lido_em: string }` |
| `banco_perguntas` | `{ favoritas: string[] }` |
| `star_builder` | `{ stars: Record<pergunta_id, { s, t, a, r }> }` |
| `checklist` | `{ marcados: string[], inputs?: Record<item_id, string> }` |
| `matriz` (avaliação) | `{ matriz_slug: string, niveis_atuais: Record<comp_id, number>, niveis_alvo: Record<comp_id, number> }` (quando `matriz_ref='selectable'`, `matriz_slug` é a escolha do mentorado) |
| `matriz` (gap) | `{ confirmado_em: string }` |
| `plano_acao` | `{ acoes: Array<{ competencia_id, descricao, prazo }>, tarefas_criadas: string[] }` |

### Tabelas Supabase (migração)

```sql
create table mentorado_trilhas (
  id uuid primary key default gen_random_uuid(),
  mentorado_id uuid not null references mentorados(id) on delete cascade,
  trilha_slug text not null,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  unique (mentorado_id, trilha_slug)
);

create index on mentorado_trilhas (mentorado_id);

create table etapa_respostas (
  id uuid primary key default gen_random_uuid(),
  mentorado_trilha_id uuid not null references mentorado_trilhas(id) on delete cascade,
  etapa_slug text not null,
  status text not null check (status in ('pending','in_progress','done')) default 'pending',
  resposta jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (mentorado_trilha_id, etapa_slug)
);

create index on etapa_respostas (mentorado_trilha_id);

-- adicionar coluna `origem` em tarefas para rastrear tarefas geradas por trilha
alter table tarefas add column origem text;
create index on tarefas (origem);
```

### RLS

Políticas por tabela:

- `mentorado_trilhas` SELECT: `mentorado_id` pertence ao `auth.uid()` (via `mentorados.user_id`)
- `mentorado_trilhas` INSERT/UPDATE/DELETE: apenas service role (operado via CRM)
- `etapa_respostas` SELECT/UPDATE/INSERT: mesmo critério (mentorado dono via join)
- `tarefas.origem`: sem impacto em RLS existente

## Arquitetura e componentes

### Rotas novas (portal)

| Rota | Tipo | Papel |
|---|---|---|
| `/portal/trilhas` | Server component | Lista trilhas atribuídas, agrupadas por estado (em andamento, concluídas, não iniciadas) |
| `/portal/trilhas/[slug]` | Server component | Overview da trilha: descrição + lista de etapas com status e CTA "continuar" |
| `/portal/trilhas/[slug]/[etapa_slug]` | Server component com client widget | Player da etapa; breadcrumb + navegação prev/next |

### Rotas novas (CRM)

Na página do mentorado (existente):

- Seção **"Trilhas"** listando trilhas atribuídas com progresso %
- Botão **"Atribuir trilha"** → modal com dropdown das trilhas disponíveis (duas opções no P3) → server action insere linha em `mentorado_trilhas`
- Botão **"Remover"** por trilha, **habilitado apenas se `started_at IS NULL`** (protege histórico)

### Componentes (estrutura de pastas)

```
src/lib/trilhas/
  content.ts              # conteúdo das 2 trilhas (typed, imutável)
  widgets-registry.ts     # map tipo → componente widget
  actions.ts              # server actions: start, save_resposta, complete_etapa, assign, unassign
  schemas.ts              # zod schemas por tipo de etapa (config + resposta)

src/components/trilhas/
  TrilhaCard.tsx          # cartão reutilizado na lista e no dashboard
  EtapaList.tsx           # lista de etapas com status
  EtapaPlayer.tsx         # container que roteia para o widget certo pelo tipo
  widgets/
    ConteudoWidget.tsx
    BancoPerguntasWidget.tsx
    StarBuilderWidget.tsx
    ChecklistWidget.tsx
    MatrizWidget.tsx
    PlanoAcaoWidget.tsx
```

### Dashboard

Widget **"Trilha em andamento"** em `/portal/dashboard`:

- Visível quando `mentorado_trilhas` tem linha com `started_at IS NOT NULL AND completed_at IS NULL`
- Mostra título, % concluído (etapas done / total), próxima etapa pendente, CTA "Continuar trilha" → link direto para `/portal/trilhas/[slug]/[proxima_etapa]`
- Posição: abaixo do card de sessões, acima de tarefas

## Conteúdo das trilhas

### Trilha 1 — "Preparação para Entrevistas" (6 etapas)

| # | Etapa (slug) | Tipo | Conteúdo |
|---|---|---|---|
| 1 | Introdução ao mapeamento (`mapeamento-intro`) | `conteudo` | Markdown: como pesquisar empresa/vaga/entrevistadores, modelo de research doc |
| 2 | Checklist de mapeamento (`mapeamento-checklist`) | `checklist` | Itens: pesquisei a empresa, li a JD, mapeei as fases, identifiquei entrevistadores, escrevi perguntas para fazer ao entrevistador |
| 3 | Banco de perguntas (`banco-perguntas`) | `banco_perguntas` | 60–80 perguntas curadas em 4 categorias (Behavioral, Produto, Case, Liderança) + filtro por senioridade. `min_favoritas: 5` |
| 4 | Construtor STAR (`star-builder`) | `star_builder` | Lê `resposta.favoritas` de `banco-perguntas`. Para cada favorita: 4 textareas (S/T/A/R), autosave debounced (1.5s). `min_completos: 5`. Export PDF via `@react-pdf/renderer` |
| 5 | Treino (`treino`) | `checklist` com inputs livres | 5 itens ("Treinei pergunta X — notas: ___"). Markdown de contexto orienta cronometrar no celular (sem timer custom) |
| 6 | Checklist pré-entrevista (`checklist-final`) | `checklist` | 10–12 itens (revisei STARs, testei áudio/vídeo, dormi bem, levei perguntas preparadas, chegada com antecedência, etc.) |

*Decisão:* o "mapeamento" foi dividido em duas etapas (intro + checklist) em vez de uma etapa composta. Mantém o registro de widgets simples e não exige suporte a checklist embutido em `conteudo`.

### Trilha 2 — "Mapa de Competências" (4 etapas)

| # | Etapa (slug) | Tipo | Conteúdo |
|---|---|---|---|
| 1 | Contexto (`contexto`) | `conteudo` | Markdown: o que é uma matriz de competências, como usá-la, por que é útil entre sessões |
| 2 | Auto-avaliação (`autoavaliacao`) | `matriz` (modo `avaliacao`, `matriz_ref: 'selectable'`) | Primeiro passo: mentorado escolhe entre **PM Career Ladder** (APM/PM/Sr/Staff) e **Liderança** (IC/Líder/Gestor/Diretor). Salva `resposta.matriz_slug`. Em seguida: grid competência × nível (6–8 × 4). Mentorado marca nível atual e alvo por competência |
| 3 | Visualizar gap (`gap`) | `matriz` (modo `gap`, `fonte_avaliacao_etapa_slug: 'autoavaliacao'`) | Lê níveis da etapa anterior. SVG bar chart dos deltas (alvo − atual), ordenado por maior gap. Botão "Entendi, próximo passo" |
| 4 | Plano de ação (`plano-acao`) | `plano_acao` (`fonte_avaliacao_etapa_slug: 'autoavaliacao'`, `n_acoes: 3`) | Pré-popula os 3 maiores gaps. Mentorado confirma/substitui, escreve uma ação + prazo por gap. Submit cria 3 linhas em `tarefas` atomicamente com `origem = 'trilha:mapa-competencias:plano-acao'` |

*Decisão:* a escolha da matriz acontece como primeiro passo dentro do widget da etapa 2 (quando `matriz_ref: 'selectable'`), não como etapa separada. Evita criar um tipo `escolha` novo só para esse uso.

### Matrizes pré-definidas (conteúdo a produzir)

- **PM Career Ladder**: competências candidatas (6–8): Discovery, Delivery, Estratégia, Stakeholder mgmt, Métricas & análise, Liderança de produto, Comunicação, Mentoria
- **Liderança**: competências candidatas: Visão & direção, Coaching, Decisão sob incerteza, Gestão de performance, Comunicação executiva, Construção de time, Gestão de stakeholders, Accountability

Descritores por célula (competência × nível) são conteúdo a produzir pela mentora.

### Dependências de conteúdo (produzido pela mentora, não pela eng)

- Banco de 60–80 perguntas curadas, categorizadas e com tag de senioridade
- Conteúdo das 2 matrizes (descritores por célula competência × nível)
- Textos markdown das etapas de introdução, contexto e treino
- Lista final de itens dos dois checklists (mapeamento + pré-entrevista)

Engenharia e produção de conteúdo podem correr em paralelo. Seed no merge de US-027 / US-028.

## Fluxos críticos

### Atribuição de trilha

1. Mentor no CRM → página do mentorado → "Atribuir trilha" → modal com dropdown
2. Server action (service role) insere linha em `mentorado_trilhas` com `assigned_by = auth.uid()`
3. Unique constraint bloqueia dupla atribuição
4. Mentorado vê trilha nova em `/portal/trilhas` na próxima visita

### Início e progresso

1. Mentorado clica em trilha → `/portal/trilhas/[slug]`
2. Ao abrir primeira etapa: se `started_at IS NULL`, server action seta `started_at = now()`
3. Em cada interação de widget: server action faz upsert em `etapa_respostas`, status vira `in_progress`
4. Ao completar critério do tipo: widget chama `complete_etapa`, status vira `done`, `completed_at = now()`
5. Quando todas as etapas têm status `done`: cron/trigger ou lazy check no read seta `mentorado_trilhas.completed_at`

**Decisão: lazy check** no read da trilha (mais simples que trigger) — comparar `etapas.length` com `respostas.filter(done).length`, se igual e `completed_at` null, atualizar em server action. Sem job agendado.

### Geração de tarefas (etapa `plano_acao`)

1. Mentorado submete 3 ações com prazos
2. Server action valida (zod) e executa em transação:
   - Insert em `tarefas` (3 linhas) com `origem = 'trilha:mapa-competencias:plano-acao'`, `mentorado_id`, título = descrição da ação, `due_date = prazo`, `status = 'pending'`
   - Upsert em `etapa_respostas` com `resposta = { acoes, tarefas_criadas: [ids] }` e status `done`
3. Se etapa já tem status `done`: server action rejeita com erro claro ("plano já submetido; nova submissão não é permitida")
4. Tarefas aparecem em `/portal/tarefas` imediatamente

## Critério de "done" por tipo

| Tipo | Critério |
|---|---|
| `conteudo` | Botão "Marcar como lido" |
| `banco_perguntas` | ≥ `min_favoritas` favoritadas + botão "Avançar" |
| `star_builder` | ≥ `min_completos` STARs com os 4 campos preenchidos; ou botão manual "concluir mesmo assim" |
| `checklist` | Todos os itens marcados; ou botão "Concluir mesmo assim" com confirm (se `permitir_concluir_parcial: true`) |
| `matriz` (avaliação) | Nível atual + alvo preenchidos para todas as competências |
| `matriz` (gap) | Botão "Entendi, próximo passo" |
| `plano_acao` | 3 ações com prazo submetidas; tarefas criadas atomicamente |

## Edge cases e tratamento de erros

- **Atribuição duplicada** — bloqueada pelo unique constraint `(mentorado_id, trilha_slug)`. UI exibe mensagem amigável.
- **Desatribuição após início** — bloqueada no CRM (`started_at IS NULL` required).
- **Navegação fora de ordem** — permitida (mentorado pode pular para ver), mas botão "Próxima" respeita ordem sequencial.
- **Conteúdo muda no código após mentorado responder** — `resposta` já salva permanece válida; widgets degradam graciosamente (skip itens removidos, mensagem informativa se detectar mismatch).
- **`plano_acao` re-submissão** — bloqueada após done. Botão some na UI; server action rejeita com erro tipado se chamada.
- **Transação falha no `plano_acao`** — tudo ou nada: se insert em tarefas falhar, rollback do update em `etapa_respostas`. Implementar via RPC no Supabase (função PL/pgSQL) ou pgx transaction no server action.
- **Autosave do STAR em erro de rede** — debounce 1.5s, indicador visual "salvo há X s", fallback mantém draft em estado local até sucesso.
- **Validação** — zod schema por tipo de etapa no server action, rejeita payloads malformados com erro claro.

## Testing

Repo não tem suíte automatizada ampla hoje (sem vitest/playwright setup visível). Proposta mínima:

- **Smoke checklist manual** antes do merge de cada US: atribuir → iniciar → completar todas as etapas → verificar tarefas geradas → verificar dashboard
- **Teste de RLS** (manual no Supabase Studio ou script SQL): mentorado A não lê dados de mentorado B
- **Idempotência do `plano_acao`** — submit 2x, verificar rejeição e não duplicação

Se a mentora / imwra quiser cobertura automatizada, adicionar **US-029: setup de vitest + testes de server actions críticos** (fora do escopo default deste sprint).

## Sequenciamento

1. **US-026** (estrutura Trilhas) — bloqueia todas as novas. ~3–5 dias.
2. **US-028** (Mapa de Competências) — widgets mais "quadrados". ~3 dias.
3. **US-027** (Preparação Entrevistas) — STAR builder é o widget mais complexo. ~3–4 dias.
4. **US-022** (alerta CRM) — isolada, baixa complexidade. ~1 dia.
5. **US-021 / US-024** (depoimentos + tracking ref) — paralelizáveis, nada toca trilhas. ~2 dias cada.

**Conteúdo em paralelo** — a mentora produz banco de perguntas, matrizes e markdowns enquanto a eng entrega US-026.

**Estimativa total:** ~12–15 dias de eng (1 dev) + conteúdo em paralelo.

## Métricas de sucesso

- ≥70% dos mentorados atribuídos a uma trilha a iniciam em 7 dias
- ≥50% dos mentorados que iniciam uma trilha a concluem em 30 dias
- Etapa `plano_acao` gera tarefas que são efetivamente concluídas (≥40% de taxa de conclusão em 14 dias)
- Queda no número de sessões cujo "motivo: mentorado travado entre sessões" aparece no check-in (qualitativo; medir via notas do mentor)

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Conteúdo (perguntas + matrizes) não fica pronto a tempo | Começar conteúdo imediatamente em paralelo à eng; first-pass curado pela Claude (opcional) para acelerar primeira revisão |
| Widget `matriz` tem UX complexa (grid × níveis) e escapa do padrão do repo | Prototipar cedo em US-026 com dados mock; revisar com mentora antes de US-028 |
| Tarefas geradas por trilha "poluem" a lista de tarefas manuais | Filtro visual em `/portal/tarefas` (tag/badge "da trilha X") — já possível via coluna `origem` |
| RLS mal configurada vaza dados | Teste manual obrigatório antes do merge de US-026; revisar policies em PR |
| Mentorado não sabe que foi atribuído a uma trilha | Disparar email (via Resend, já presente) no `assign` — opcional em US-026, pode ir pra US-029 |

## Aberto para P4+

- Editor de trilhas autoria-pelo-mentor no CRM (migra conteúdo para DB)
- Mais trilhas: Negociação Salarial, Transição de Carreira, Liderança sem Autoridade
- Integração opcional de IA (feedback em STAR, sumário narrativo do gap)
- Notificações push / email de lembrete de trilha parada
- Analytics agregada de uso de trilhas no CRM
