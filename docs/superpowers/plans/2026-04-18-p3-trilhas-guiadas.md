# P3 — Trilhas Guiadas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver US-026 (Trilhas infra), US-027 (trilha "Preparação para Entrevistas"), US-028 (trilha "Mapa de Competências"). Mentorado recebe jornadas guiadas atribuíveis pelo CRM e as executa no portal.

**Architecture:** Conteúdo das trilhas vive em código TypeScript tipado (`src/lib/trilhas/content.ts`); progresso vive em duas tabelas novas no Supabase (`mentorado_trilhas`, `etapa_respostas`). Portal ganha 3 rotas (`/portal/trilhas`, `/portal/trilhas/[slug]`, `/portal/trilhas/[slug]/[etapa_slug]`) com widget dispatcher por tipo de etapa. CRM ganha seção "Trilhas" na página do mentorado para atribuição/remoção. Plano de ação da trilha 2 gera tarefas automaticamente via transação atômica.

**Tech Stack:** Next.js 16.2 (App Router, server components, server actions), Supabase SSR (`@supabase/ssr`), PostgreSQL + RLS (`get_mentorado_id()` helper), `@react-pdf/renderer` (já presente), `zod` (a adicionar), Tailwind v4, `lucide-react`.

**Repo layout:**
- Portal: `/Users/willaraujo/conductor/workspaces/splinter/san-diego-v2/` (Next app)
- CRM: `/Users/willaraujo/conductor/workspaces/splinter/san-diego-v2/mentoria-crm/` (Next app separado, mesmo Supabase)
- Spec de referência: `docs/superpowers/specs/2026-04-18-p3-trilhas-guiadas-design.md`

**Nota sobre testes:** repo não tem suíte automatizada (sem vitest/playwright). Este plano usa **smoke verification manual** como "test step" para UI/integração, e pequenos testes node (via `npx tsx`) ou scripts SQL para lógica pura (idempotência, RLS). Cada task descreve exatamente como verificar.

**Convenção de commits:** cada task termina em commit. Prefixo: `feat(P3):`, `fix(P3):`, `chore(P3):`. Branch: `imwra/p3-portal-brainstorm` (já criada).

---

## Sequência de execução

1. **Foundation** (Tasks 1–6): schema, tipos, actions, content scaffold. Base para tudo.
2. **Portal generic** (Tasks 7–11): rotas, widgets genéricos, dashboard. Entrega US-026 como trilhas com conteúdo placeholder.
3. **CRM atribuição** (Task 12): fecha US-026.
4. **Trilha 2 primeiro** (Tasks 13–16): widgets `matriz` e `plano_acao` + conteúdo. Entrega US-028 (mais "quadrada", valida fluxo de geração de tarefas).
5. **Trilha 1** (Tasks 17–20): widgets `banco_perguntas` e `star_builder` + conteúdo. Entrega US-027.
6. **Smoke final + RLS audit** (Task 21): verificação de ponta a ponta + policies.

---

## Task 1: Migration do Supabase

**Files:**
- Create: `mentoria-crm/supabase/migrations/20260418000000_trilhas.sql`

- [ ] **Step 1: Criar o arquivo de migração**

```sql
-- =============================================
-- P3: Trilhas Guiadas
-- =============================================

-- Atribuição de trilha ao mentorado (conteúdo vive em código, slug referencia)
CREATE TABLE mentorado_trilhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  trilha_slug TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (mentorado_id, trilha_slug)
);

CREATE INDEX idx_mentorado_trilhas_mentorado ON mentorado_trilhas(mentorado_id);

-- Estado/resposta do mentorado por etapa (uma linha por etapa iniciada)
CREATE TABLE etapa_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_trilha_id UUID NOT NULL REFERENCES mentorado_trilhas(id) ON DELETE CASCADE,
  etapa_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done')),
  resposta JSONB,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mentorado_trilha_id, etapa_slug)
);

CREATE INDEX idx_etapa_respostas_mt ON etapa_respostas(mentorado_trilha_id);

CREATE OR REPLACE FUNCTION update_etapa_respostas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER etapa_respostas_updated_at
  BEFORE UPDATE ON etapa_respostas
  FOR EACH ROW EXECUTE FUNCTION update_etapa_respostas_updated_at();

-- Coluna para rastrear tarefas geradas por trilha
ALTER TABLE tarefas ADD COLUMN origem TEXT;
CREATE INDEX idx_tarefas_origem ON tarefas(origem);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE mentorado_trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE etapa_respostas ENABLE ROW LEVEL SECURITY;

-- mentorado_trilhas: mentorado lê as suas próprias; mutações via service role (CRM)
CREATE POLICY mentorado_trilhas_select ON mentorado_trilhas
  FOR SELECT USING (mentorado_id = get_mentorado_id());

CREATE POLICY mentorado_trilhas_update_started ON mentorado_trilhas
  FOR UPDATE USING (mentorado_id = get_mentorado_id());

-- etapa_respostas: mentorado lê/escreve as suas (via join com mentorado_trilhas)
CREATE POLICY etapa_respostas_select ON etapa_respostas
  FOR SELECT USING (
    mentorado_trilha_id IN (
      SELECT id FROM mentorado_trilhas WHERE mentorado_id = get_mentorado_id()
    )
  );

CREATE POLICY etapa_respostas_insert ON etapa_respostas
  FOR INSERT WITH CHECK (
    mentorado_trilha_id IN (
      SELECT id FROM mentorado_trilhas WHERE mentorado_id = get_mentorado_id()
    )
  );

CREATE POLICY etapa_respostas_update ON etapa_respostas
  FOR UPDATE USING (
    mentorado_trilha_id IN (
      SELECT id FROM mentorado_trilhas WHERE mentorado_id = get_mentorado_id()
    )
  );

-- =============================================
-- RPC: submissão atômica do plano de ação (insert tarefas + upsert resposta)
-- =============================================

CREATE OR REPLACE FUNCTION submit_plano_acao(
  p_mentorado_trilha_id UUID,
  p_etapa_slug TEXT,
  p_origem TEXT,
  p_acoes JSONB -- [{competencia_id, descricao, prazo}]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_mentorado_id UUID;
  v_acao JSONB;
  v_tarefa_ids UUID[] := ARRAY[]::UUID[];
  v_new_id UUID;
  v_existing_status TEXT;
BEGIN
  SELECT mt.mentorado_id INTO v_mentorado_id
    FROM mentorado_trilhas mt
    WHERE mt.id = p_mentorado_trilha_id
      AND mt.mentorado_id = get_mentorado_id();

  IF v_mentorado_id IS NULL THEN
    RAISE EXCEPTION 'mentorado_trilha_not_found_or_unauthorized';
  END IF;

  SELECT status INTO v_existing_status
    FROM etapa_respostas
    WHERE mentorado_trilha_id = p_mentorado_trilha_id
      AND etapa_slug = p_etapa_slug;

  IF v_existing_status = 'done' THEN
    RAISE EXCEPTION 'plano_acao_ja_submetido';
  END IF;

  FOR v_acao IN SELECT * FROM jsonb_array_elements(p_acoes) LOOP
    INSERT INTO tarefas (mentorado_id, title, description, due_date, status, created_by_mentor, origem)
    VALUES (
      v_mentorado_id,
      v_acao->>'descricao',
      'Ação do plano de desenvolvimento',
      (v_acao->>'prazo')::DATE,
      'pending',
      FALSE,
      p_origem
    )
    RETURNING id INTO v_new_id;
    v_tarefa_ids := array_append(v_tarefa_ids, v_new_id);
  END LOOP;

  INSERT INTO etapa_respostas (mentorado_trilha_id, etapa_slug, status, resposta, completed_at)
  VALUES (
    p_mentorado_trilha_id,
    p_etapa_slug,
    'done',
    jsonb_build_object('acoes', p_acoes, 'tarefas_criadas', to_jsonb(v_tarefa_ids)),
    NOW()
  )
  ON CONFLICT (mentorado_trilha_id, etapa_slug)
    DO UPDATE SET
      status = 'done',
      resposta = EXCLUDED.resposta,
      completed_at = NOW();

  RETURN jsonb_build_object('tarefas_criadas', to_jsonb(v_tarefa_ids));
END;
$$;

GRANT EXECUTE ON FUNCTION submit_plano_acao(UUID, TEXT, TEXT, JSONB) TO authenticated;
```

- [ ] **Step 2: Aplicar a migration no Supabase**

Opção A (recomendada, se Supabase CLI estiver linkado): no diretório `mentoria-crm/`, rodar:

```bash
cd mentoria-crm && npx supabase db push
```

Opção B: copiar conteúdo do `.sql` e colar no SQL editor do Supabase Dashboard, executar.

- [ ] **Step 3: Verificar criação**

No SQL editor, rodar:

```sql
SELECT table_name FROM information_schema.tables WHERE table_name IN ('mentorado_trilhas', 'etapa_respostas');
SELECT column_name FROM information_schema.columns WHERE table_name = 'tarefas' AND column_name = 'origem';
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'submit_plano_acao';
```

Expected: 2 linhas da primeira query, 1 linha de cada das outras duas.

- [ ] **Step 4: Commit**

```bash
git add mentoria-crm/supabase/migrations/20260418000000_trilhas.sql
git commit -m "feat(P3): migration for trilhas guiadas (tables + rls + rpc)"
```

---

## Task 2: Adicionar `zod` e tipos de trilhas

**Files:**
- Modify: `package.json` (adicionar `zod`)
- Modify: `src/types/portal.ts`

- [ ] **Step 1: Instalar `zod`**

```bash
npm install zod@^3.23.8
```

- [ ] **Step 2: Adicionar tipos em `src/types/portal.ts`**

Append ao final do arquivo:

```ts
// ============ Trilhas ============

export type EtapaTipo =
  | 'conteudo'
  | 'banco_perguntas'
  | 'star_builder'
  | 'checklist'
  | 'matriz'
  | 'plano_acao';

export type EtapaStatus = 'pending' | 'in_progress' | 'done';

export type TrilhaSlug = 'preparacao-entrevistas' | 'mapa-competencias';

export interface Etapa {
  slug: string;
  titulo: string;
  descricao: string;
  tipo: EtapaTipo;
  config: Record<string, unknown>;
}

export interface Trilha {
  slug: TrilhaSlug;
  titulo: string;
  descricao: string;
  etapas: Etapa[];
}

export interface MentoradoTrilha {
  id: string;
  mentorado_id: string;
  trilha_slug: TrilhaSlug;
  assigned_at: string;
  assigned_by: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface EtapaResposta {
  id: string;
  mentorado_trilha_id: string;
  etapa_slug: string;
  status: EtapaStatus;
  resposta: Record<string, unknown> | null;
  completed_at: string | null;
  updated_at: string;
}
```

- [ ] **Step 3: Verificar typecheck**

```bash
npx tsc --noEmit
```

Expected: sem erros (ou apenas os pré-existentes se houver).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/types/portal.ts
git commit -m "feat(P3): add zod dep and trilhas types"
```

---

## Task 3: Zod schemas para etapa config e resposta

**Files:**
- Create: `src/lib/trilhas/schemas.ts`

- [ ] **Step 1: Criar o arquivo**

```ts
import { z } from 'zod';

// ============ config schemas ============

export const conteudoConfigSchema = z.object({
  markdown: z.string(),
});

export const bancoPerguntasConfigSchema = z.object({
  perguntas: z.array(
    z.object({
      id: z.string(),
      texto: z.string(),
      categoria: z.enum(['behavioral', 'produto', 'case', 'lideranca']),
      senioridade: z.array(z.enum(['jr', 'pleno', 'sr'])),
    })
  ),
  min_favoritas: z.number().int().min(1),
});

export const starBuilderConfigSchema = z.object({
  min_completos: z.number().int().min(1),
  fonte_favoritas_etapa_slug: z.string(),
});

export const checklistConfigSchema = z.object({
  itens: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      com_input: z.boolean().optional(),
    })
  ),
  permitir_concluir_parcial: z.boolean().optional(),
});

export const matrizConfigSchema = z.object({
  matriz_ref: z.union([z.enum(['pm-ladder', 'lideranca']), z.literal('selectable')]),
  opcoes: z.array(z.enum(['pm-ladder', 'lideranca'])).optional(),
  modo: z.enum(['avaliacao', 'gap']),
  fonte_avaliacao_etapa_slug: z.string().optional(),
});

export const planoAcaoConfigSchema = z.object({
  fonte_avaliacao_etapa_slug: z.string(),
  n_acoes: z.number().int().min(1).max(5),
});

// ============ resposta schemas ============

export const conteudoRespostaSchema = z.object({
  lido_em: z.string().datetime(),
});

export const bancoPerguntasRespostaSchema = z.object({
  favoritas: z.array(z.string()),
});

export const starBuilderRespostaSchema = z.object({
  stars: z.record(
    z.string(), // pergunta_id
    z.object({
      s: z.string(),
      t: z.string(),
      a: z.string(),
      r: z.string(),
    })
  ),
});

export const checklistRespostaSchema = z.object({
  marcados: z.array(z.string()),
  inputs: z.record(z.string(), z.string()).optional(),
});

export const matrizAvaliacaoRespostaSchema = z.object({
  matriz_slug: z.enum(['pm-ladder', 'lideranca']),
  niveis_atuais: z.record(z.string(), z.number().int().min(1).max(4)),
  niveis_alvo: z.record(z.string(), z.number().int().min(1).max(4)),
});

export const matrizGapRespostaSchema = z.object({
  confirmado_em: z.string().datetime(),
});

export const planoAcaoRespostaSchema = z.object({
  acoes: z.array(
    z.object({
      competencia_id: z.string(),
      descricao: z.string().min(1),
      prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data YYYY-MM-DD'),
    })
  ).length(3),
});

// helper
export function respostaSchemaFor(tipo: string, modo?: string) {
  switch (tipo) {
    case 'conteudo': return conteudoRespostaSchema;
    case 'banco_perguntas': return bancoPerguntasRespostaSchema;
    case 'star_builder': return starBuilderRespostaSchema;
    case 'checklist': return checklistRespostaSchema;
    case 'matriz': return modo === 'gap' ? matrizGapRespostaSchema : matrizAvaliacaoRespostaSchema;
    case 'plano_acao': return planoAcaoRespostaSchema;
    default: throw new Error(`unknown tipo: ${tipo}`);
  }
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/trilhas/schemas.ts
git commit -m "feat(P3): zod schemas for etapa config and resposta"
```

---

## Task 4: Content scaffold (trilhas vazias com tipos)

**Files:**
- Create: `src/lib/trilhas/content.ts`

Nota: essa task cria a estrutura; o conteúdo real de cada trilha é preenchido em Tasks 16 e 20.

- [ ] **Step 1: Criar o arquivo**

```ts
import type { Trilha, TrilhaSlug } from '@/types/portal';

// Conteúdo das trilhas vive aqui. Ao adicionar novas trilhas no futuro,
// estender TrilhaSlug em src/types/portal.ts e adicionar objeto aqui.

const trilhaMapaCompetencias: Trilha = {
  slug: 'mapa-competencias',
  titulo: 'Mapa de Competências',
  descricao: 'Escolha uma matriz, auto-avalie seu nível e construa um plano de desenvolvimento focado nos maiores gaps.',
  etapas: [
    // preenchido em Task 16
  ],
};

const trilhaPreparacaoEntrevistas: Trilha = {
  slug: 'preparacao-entrevistas',
  titulo: 'Preparação para Entrevistas',
  descricao: 'Mapeie o processo seletivo, monte respostas STAR para perguntas-chave e chegue à entrevista sem surpresas.',
  etapas: [
    // preenchido em Task 20
  ],
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/trilhas/content.ts
git commit -m "feat(P3): trilhas content scaffold"
```

---

## Task 5: Server actions

**Files:**
- Create: `src/lib/trilhas/actions.ts`

- [ ] **Step 1: Criar o arquivo**

```ts
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

// --- iniciar trilha (primeiro acesso ao player) ---
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
    await supabase.from('mentorado_trilhas').update({ started_at: new Date().toISOString() }).eq('id', mt.id);
  }
  return mt.id as string;
}

// --- salvar resposta parcial (draft) ---
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
  const parsed = schema.partial().parse(resposta); // draft parcial

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

// --- completar etapa (marcar done) ---
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
  const parsed = schema.parse(resposta); // completo

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

  // lazy check: se todas as etapas estão done, marca trilha completed
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

// --- submeter plano de ação (chama RPC atômico) ---
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
  if (error) throw new Error(error.message);

  // lazy check: após submissão, todas as etapas podem estar done → marcar trilha
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
```

- [ ] **Step 2: Verificar typecheck**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/trilhas/actions.ts
git commit -m "feat(P3): server actions for trilhas (start, save, complete, plano_acao)"
```

---

## Task 6: Queries utilitárias (read-side)

**Files:**
- Create: `src/lib/trilhas/queries.ts`

- [ ] **Step 1: Criar o arquivo**

```ts
import { createClient } from '@/lib/supabase-server';
import { listTrilhas, getTrilha, getTrilhaSafe } from './content';
import type { MentoradoTrilha, EtapaResposta, Trilha, TrilhaSlug } from '@/types/portal';

export interface TrilhaComProgresso {
  trilha: Trilha;
  mentorado_trilha: MentoradoTrilha | null;
  etapas_done: number;
  etapas_total: number;
  proxima_etapa_slug: string | null;
}

export async function getTrilhasAtribuidas(): Promise<TrilhaComProgresso[]> {
  const supabase = await createClient();
  const { data: mtRows } = await supabase
    .from('mentorado_trilhas')
    .select('*, etapa_respostas(etapa_slug, status)');

  const rows = (mtRows ?? []) as Array<MentoradoTrilha & { etapa_respostas: { etapa_slug: string; status: string }[] }>;

  const out: TrilhaComProgresso[] = [];
  for (const r of rows) {
    const trilha = getTrilhaSafe(r.trilha_slug);
    if (!trilha) continue;
    const doneSlugs = new Set(r.etapa_respostas.filter((e) => e.status === 'done').map((e) => e.etapa_slug));
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

export async function getTrilhaComProgresso(trilhaSlug: string): Promise<TrilhaComProgresso | null> {
  const trilha = getTrilhaSafe(trilhaSlug);
  if (!trilha) return null;
  const supabase = await createClient();
  const { data: mt } = await supabase
    .from('mentorado_trilhas')
    .select('*, etapa_respostas(etapa_slug, status)')
    .eq('trilha_slug', trilhaSlug)
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
  const doneSlugs = new Set(respostas.filter((e) => e.status === 'done').map((e) => e.etapa_slug));
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

export async function getEtapaResposta(mentoradoTrilhaId: string, etapaSlug: string): Promise<EtapaResposta | null> {
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
  return todas.find((t) => t.mentorado_trilha?.started_at && !t.mentorado_trilha?.completed_at) ?? null;
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/trilhas/queries.ts
git commit -m "feat(P3): trilhas queries helpers"
```

---

## Task 7: Rota `/portal/trilhas` (lista)

**Files:**
- Create: `src/app/portal/(authenticated)/trilhas/page.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getTrilhasAtribuidas } from '@/lib/trilhas/queries';

export default async function TrilhasPage() {
  const trilhas = await getTrilhasAtribuidas();

  const emAndamento = trilhas.filter((t) => t.mentorado_trilha?.started_at && !t.mentorado_trilha?.completed_at);
  const naoIniciadas = trilhas.filter((t) => !t.mentorado_trilha?.started_at);
  const concluidas = trilhas.filter((t) => t.mentorado_trilha?.completed_at);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">Metodologia</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Trilhas</h1>
        <p className="text-[#64748b] text-sm mt-1">
          Jornadas guiadas que você executa entre sessões com o mentor.
        </p>
      </div>

      {trilhas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
          <p className="text-[#64748b] text-sm">O mentor ainda não atribuiu trilhas a você.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {emAndamento.length > 0 && (
            <Section title="Em andamento" items={emAndamento} />
          )}
          {naoIniciadas.length > 0 && (
            <Section title="Não iniciadas" items={naoIniciadas} />
          )}
          {concluidas.length > 0 && (
            <Section title="Concluídas" items={concluidas} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: Awaited<ReturnType<typeof getTrilhasAtribuidas>> }) {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-widest uppercase text-[#64748b] mb-3">{title}</h2>
      <div className="flex flex-col gap-3">
        {items.map((t) => (
          <Link
            key={t.trilha.slug}
            href={`/portal/trilhas/${t.trilha.slug}`}
            className="group bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 hover:border-[#1E88E5]/40 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-sm text-[#0f172a]">{t.trilha.titulo}</p>
                <p className="text-[#64748b] text-xs mt-1 leading-relaxed">{t.trilha.descricao}</p>
                <p className="text-[#94a3b8] text-xs mt-2">
                  {t.etapas_done} de {t.etapas_total} etapas concluídas
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#94a3b8] group-hover:text-[#1E88E5] transition shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Adicionar link no menu lateral do portal**

Abrir `src/app/portal/(authenticated)/layout.tsx` e localizar o bloco de nav links. Adicionar:

```tsx
{ href: '/portal/trilhas', label: 'Trilhas', icon: BookOpen }
```

(`BookOpen` vem de `lucide-react`; seguir o padrão já usado nos outros itens — ler primeiro o arquivo para match de padrão exato antes de editar.)

- [ ] **Step 3: Smoke test manual**

Rodar `npm run dev`. Logar como mentorado. Ir para `/portal/trilhas`. Esperado: página renderiza com "O mentor ainda não atribuiu trilhas a você." (nenhuma trilha atribuída ainda).

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/\(authenticated\)/trilhas/page.tsx src/app/portal/\(authenticated\)/layout.tsx
git commit -m "feat(P3): /portal/trilhas list page"
```

---

## Task 8: Rota `/portal/trilhas/[slug]` (overview)

**Files:**
- Create: `src/app/portal/(authenticated)/trilhas/[slug]/page.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react';
import { getTrilhaComProgresso } from '@/lib/trilhas/queries';
import type { EtapaStatus } from '@/types/portal';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TrilhaOverviewPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getTrilhaComProgresso(slug);
  if (!data || !data.mentorado_trilha) notFound();
  const { trilha, proxima_etapa_slug, etapas_done, etapas_total, mentorado_trilha } = data;

  const supabase = await (await import('@/lib/supabase-server')).createClient();
  const { data: respostas } = await supabase
    .from('etapa_respostas')
    .select('etapa_slug, status')
    .eq('mentorado_trilha_id', mentorado_trilha.id);
  const byEtapa = new Map<string, EtapaStatus>();
  (respostas ?? []).forEach((r) => byEtapa.set(r.etapa_slug, r.status as EtapaStatus));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/portal/trilhas" className="text-[#64748b] text-xs hover:text-[#1E88E5]">
          ← Trilhas
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-2">{trilha.titulo}</h1>
        <p className="text-[#64748b] text-sm mt-2 leading-relaxed">{trilha.descricao}</p>
        <p className="text-[#94a3b8] text-xs mt-3">
          {etapas_done} de {etapas_total} etapas concluídas
        </p>
      </div>

      {proxima_etapa_slug && (
        <Link
          href={`/portal/trilhas/${trilha.slug}/${proxima_etapa_slug}`}
          className="flex items-center gap-2 bg-[#1E88E5] text-white font-semibold text-sm px-5 py-3 rounded-full hover:bg-[#1976D2] transition mb-8 w-fit"
        >
          <PlayCircle className="w-4 h-4" />
          {mentorado_trilha.started_at ? 'Continuar' : 'Iniciar trilha'}
        </Link>
      )}

      <ol className="flex flex-col gap-2">
        {trilha.etapas.map((etapa, i) => {
          const status = byEtapa.get(etapa.slug) ?? 'pending';
          return (
            <li key={etapa.slug}>
              <Link
                href={`/portal/trilhas/${trilha.slug}/${etapa.slug}`}
                className="flex items-start gap-3 bg-white rounded-xl border border-[#e2e8f0] p-4 hover:border-[#1E88E5]/40 transition"
              >
                {status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-[#94a3b8] shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#94a3b8] font-semibold">Etapa {i + 1}</p>
                  <p className="font-semibold text-sm text-[#0f172a]">{etapa.titulo}</p>
                  <p className="text-[#64748b] text-xs mt-1 leading-relaxed">{etapa.descricao}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

Esse fluxo precisa de uma trilha atribuída. Por enquanto, não dá pra testar até a CRM task. Marcar uma trilha manualmente no Supabase Dashboard (insert em `mentorado_trilhas`) e verificar que a página renderiza (ainda sem etapas, que só aparecem após Tasks 16 e 20).

- [ ] **Step 3: Commit**

```bash
git add src/app/portal/\(authenticated\)/trilhas/\[slug\]/page.tsx
git commit -m "feat(P3): /portal/trilhas/[slug] overview page"
```

---

## Task 9: Widget registry e rota `/portal/trilhas/[slug]/[etapa_slug]` (player)

**Files:**
- Create: `src/lib/trilhas/widgets-registry.ts`
- Create: `src/app/portal/(authenticated)/trilhas/[slug]/[etapa_slug]/page.tsx`

- [ ] **Step 1: Criar o registry**

```ts
import type { ComponentType } from 'react';
import type { Etapa, EtapaResposta, TrilhaSlug } from '@/types/portal';

export interface WidgetProps {
  trilhaSlug: TrilhaSlug;
  etapa: Etapa;
  resposta: EtapaResposta | null;
  contextoTrilhaRespostas: EtapaResposta[]; // para widgets que leem de outras etapas (star_builder, matriz gap, plano_acao)
}

// preenchido progressivamente conforme os widgets são implementados
export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {};
```

- [ ] **Step 2: Criar a rota player**

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTrilhaComProgresso, getEtapaResposta } from '@/lib/trilhas/queries';
import { startTrilhaIfNeeded } from '@/lib/trilhas/actions';
import { widgetRegistry } from '@/lib/trilhas/widgets-registry';
import { createClient } from '@/lib/supabase-server';
import type { EtapaResposta, TrilhaSlug } from '@/types/portal';

interface PageProps {
  params: Promise<{ slug: string; etapa_slug: string }>;
}

export default async function EtapaPlayerPage({ params }: PageProps) {
  const { slug, etapa_slug } = await params;
  const data = await getTrilhaComProgresso(slug);
  if (!data || !data.mentorado_trilha) notFound();

  const { trilha, mentorado_trilha } = data;
  const etapaIdx = trilha.etapas.findIndex((e) => e.slug === etapa_slug);
  if (etapaIdx === -1) notFound();
  const etapa = trilha.etapas[etapaIdx];

  await startTrilhaIfNeeded(trilha.slug as TrilhaSlug);
  const resposta = await getEtapaResposta(mentorado_trilha.id, etapa.slug);

  const supabase = await createClient();
  const { data: todasRespostas } = await supabase
    .from('etapa_respostas')
    .select('*')
    .eq('mentorado_trilha_id', mentorado_trilha.id);
  const contextoTrilhaRespostas = (todasRespostas ?? []) as EtapaResposta[];

  const Widget = widgetRegistry[etapa.tipo];

  const prev = etapaIdx > 0 ? trilha.etapas[etapaIdx - 1] : null;
  const next = etapaIdx < trilha.etapas.length - 1 ? trilha.etapas[etapaIdx + 1] : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/portal/trilhas/${trilha.slug}`} className="text-[#64748b] text-xs hover:text-[#1E88E5]">
          ← {trilha.titulo}
        </Link>
        <p className="text-xs text-[#94a3b8] font-semibold mt-3">
          Etapa {etapaIdx + 1} de {trilha.etapas.length}
        </p>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a]">{etapa.titulo}</h1>
        <p className="text-[#64748b] text-sm mt-2 leading-relaxed">{etapa.descricao}</p>
      </div>

      {Widget ? (
        <Widget
          trilhaSlug={trilha.slug as TrilhaSlug}
          etapa={etapa}
          resposta={resposta}
          contextoTrilhaRespostas={contextoTrilhaRespostas}
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center">
          <p className="text-[#94a3b8] text-sm">Widget "{etapa.tipo}" ainda não implementado.</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#e2e8f0]">
        {prev ? (
          <Link
            href={`/portal/trilhas/${trilha.slug}/${prev.slug}`}
            className="flex items-center gap-1 text-[#64748b] text-sm hover:text-[#1E88E5]"
          >
            <ChevronLeft className="w-4 h-4" /> {prev.titulo}
          </Link>
        ) : <div />}
        {next ? (
          <Link
            href={`/portal/trilhas/${trilha.slug}/${next.slug}`}
            className="flex items-center gap-1 text-[#64748b] text-sm hover:text-[#1E88E5] ml-auto"
          >
            {next.titulo} <ChevronRight className="w-4 h-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/trilhas/widgets-registry.ts src/app/portal/\(authenticated\)/trilhas/\[slug\]/\[etapa_slug\]/page.tsx
git commit -m "feat(P3): widget registry + etapa player page"
```

---

## Task 10: Widget `ConteudoWidget` (markdown renderer)

**Files:**
- Create: `src/components/trilhas/widgets/ConteudoWidget.tsx`
- Modify: `src/lib/trilhas/widgets-registry.ts`

Decisão: **não adicionar react-markdown**. O conteúdo das trilhas é controlado (autoria no repo), então usamos um renderer mínimo que cobre os casos: parágrafos, listas `-`, negrito `**`, itálico `*`, títulos `##`. Se crescer, migra-se depois.

- [ ] **Step 1: Criar o widget**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { completeEtapa } from '@/lib/trilhas/actions';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

export default function ConteudoWidget({ trilhaSlug, etapa, resposta }: WidgetProps) {
  const [pending, start] = useTransition();
  const done = resposta?.status === 'done';
  const [error, setError] = useState<string | null>(null);

  const markdown = (etapa.config as { markdown: string }).markdown;

  function marcar() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({
          trilhaSlug,
          etapaSlug: etapa.slug,
          resposta: { lido_em: new Date().toISOString() },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <MarkdownMinimal content={markdown} />
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Lido
          </div>
        ) : (
          <button
            onClick={marcar}
            disabled={pending}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Marcar como lido'}
          </button>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}

// Renderer minimal: linha-a-linha, # / ## / ### para headings, - para bullets, **bold**, *italic*
function MarkdownMinimal({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flush = () => {
    if (bulletBuffer.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc ml-5 mb-3 text-[#64748b] text-sm leading-relaxed">
          {bulletBuffer.map((b, i) => <li key={i}>{renderInline(b)}</li>)}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('### ')) { flush(); elements.push(<h3 key={elements.length} className="font-semibold text-sm text-[#0f172a] mt-4 mb-2">{renderInline(line.slice(4))}</h3>); continue; }
    if (line.startsWith('## ')) { flush(); elements.push(<h2 key={elements.length} className="font-bold text-base text-[#0f172a] mt-5 mb-2">{renderInline(line.slice(3))}</h2>); continue; }
    if (line.startsWith('# ')) { flush(); elements.push(<h1 key={elements.length} className="font-extrabold text-lg text-[#0f172a] mt-6 mb-3">{renderInline(line.slice(2))}</h1>); continue; }
    if (line.startsWith('- ')) { bulletBuffer.push(line.slice(2)); continue; }
    flush();
    elements.push(<p key={elements.length} className="text-[#64748b] text-sm leading-relaxed mb-3">{renderInline(line)}</p>);
  }
  flush();
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // muito simples: **bold** e *italic*; ordem importa (bold antes de italic)
  const parts: React.ReactNode[] = [];
  let idx = 0;
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > idx) parts.push(text.slice(idx, match.index));
    const token = match[0];
    if (token.startsWith('**')) parts.push(<strong key={i++}>{token.slice(2, -2)}</strong>);
    else parts.push(<em key={i++}>{token.slice(1, -1)}</em>);
    idx = match.index + token.length;
  }
  if (idx < text.length) parts.push(text.slice(idx));
  return parts;
}
```

- [ ] **Step 2: Registrar widget**

Editar `src/lib/trilhas/widgets-registry.ts`:

```ts
import type { ComponentType } from 'react';
import type { Etapa, EtapaResposta, TrilhaSlug } from '@/types/portal';
import ConteudoWidget from '@/components/trilhas/widgets/ConteudoWidget';

export interface WidgetProps {
  trilhaSlug: TrilhaSlug;
  etapa: Etapa;
  resposta: EtapaResposta | null;
  contextoTrilhaRespostas: EtapaResposta[];
}

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  conteudo: ConteudoWidget,
};
```

- [ ] **Step 3: Smoke**

Ainda sem conteúdo real nas trilhas. Impossível testar até Task 16/20. Tipecheck serve:

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/trilhas/widgets/ConteudoWidget.tsx src/lib/trilhas/widgets-registry.ts
git commit -m "feat(P3): ConteudoWidget + minimal markdown renderer"
```

---

## Task 11: Widget `ChecklistWidget`

**Files:**
- Create: `src/components/trilhas/widgets/ChecklistWidget.tsx`
- Modify: `src/lib/trilhas/widgets-registry.ts`

- [ ] **Step 1: Criar o widget**

```tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { completeEtapa, saveResposta } from '@/lib/trilhas/actions';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

interface Config {
  itens: Array<{ id: string; label: string; com_input?: boolean }>;
  permitir_concluir_parcial?: boolean;
}

export default function ChecklistWidget({ trilhaSlug, etapa, resposta }: WidgetProps) {
  const cfg = etapa.config as Config;
  const initial = (resposta?.resposta ?? {}) as { marcados?: string[]; inputs?: Record<string, string> };
  const [marcados, setMarcados] = useState<string[]>(initial.marcados ?? []);
  const [inputs, setInputs] = useState<Record<string, string>>(initial.inputs ?? {});
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = resposta?.status === 'done';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (done) return;
      if (marcados.length === 0 && Object.keys(inputs).length === 0) return;
      void saveResposta({
        trilhaSlug,
        etapaSlug: etapa.slug,
        resposta: { marcados, inputs },
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [marcados, inputs, trilhaSlug, etapa.slug, done]);

  const toggle = (id: string) => {
    setMarcados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const todosMarcados = cfg.itens.every((i) => marcados.includes(i.id));
  const canComplete = todosMarcados || (cfg.permitir_concluir_parcial && marcados.length > 0);

  function concluir() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({
          trilhaSlug,
          etapaSlug: etapa.slug,
          resposta: { marcados, inputs },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 flex flex-col gap-3">
        {cfg.itens.map((item) => {
          const checked = marcados.includes(item.id);
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => !done && toggle(item.id)}
                disabled={done}
                className="flex items-start gap-3 text-left w-full hover:bg-[#F7F8FC] rounded-lg p-2 -mx-2 disabled:cursor-default"
              >
                {checked ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-[#94a3b8] shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${checked ? 'text-[#0f172a] font-medium' : 'text-[#64748b]'}`}>
                  {item.label}
                </span>
              </button>
              {item.com_input && checked && (
                <textarea
                  value={inputs[item.id] ?? ''}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  disabled={done}
                  placeholder="Notas…"
                  className="ml-8 mt-1 w-[calc(100%-2rem)] text-sm text-[#0f172a] border border-[#e2e8f0] rounded-lg p-2 focus:border-[#1E88E5] outline-none disabled:opacity-60"
                  rows={2}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Concluído
          </div>
        ) : (
          <button
            onClick={concluir}
            disabled={pending || !canComplete}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Concluir etapa'}
          </button>
        )}
        {!done && !canComplete && (
          <p className="text-[#94a3b8] text-xs mt-2">
            {cfg.permitir_concluir_parcial ? 'Marque ao menos 1 item para concluir.' : 'Marque todos os itens para concluir.'}
          </p>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Registrar**

Editar `src/lib/trilhas/widgets-registry.ts`, adicionar:

```ts
import ChecklistWidget from '@/components/trilhas/widgets/ChecklistWidget';
// ...
export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  conteudo: ConteudoWidget,
  checklist: ChecklistWidget,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/trilhas/widgets/ChecklistWidget.tsx src/lib/trilhas/widgets-registry.ts
git commit -m "feat(P3): ChecklistWidget"
```

---

## Task 12: Dashboard widget "Trilha em andamento"

**Files:**
- Modify: `src/app/portal/(authenticated)/dashboard/page.tsx`
- Create: `src/components/trilhas/DashboardTrilhaCard.tsx`

- [ ] **Step 1: Criar o card**

```tsx
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import type { TrilhaComProgresso } from '@/lib/trilhas/queries';

export function DashboardTrilhaCard({ data }: { data: TrilhaComProgresso }) {
  const pct = data.etapas_total === 0 ? 0 : Math.round((data.etapas_done / data.etapas_total) * 100);
  const href = data.proxima_etapa_slug
    ? `/portal/trilhas/${data.trilha.slug}/${data.proxima_etapa_slug}`
    : `/portal/trilhas/${data.trilha.slug}`;
  return (
    <Link href={href} className="block bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 hover:border-[#1E88E5]/40 transition">
      <p className="text-[#1E88E5] text-xs font-semibold tracking-widest uppercase mb-1">Trilha em andamento</p>
      <p className="font-semibold text-sm text-[#0f172a]">{data.trilha.titulo}</p>
      <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full mt-3">
        <div className="h-full bg-[#1E88E5] rounded-full transition" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[#64748b] text-xs mt-2">
        {data.etapas_done}/{data.etapas_total} etapas · {pct}%
      </p>
      <div className="flex items-center gap-1 text-[#1E88E5] text-sm font-semibold mt-3">
        <PlayCircle className="w-4 h-4" /> Continuar
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Integrar no dashboard**

Abrir `src/app/portal/(authenticated)/dashboard/page.tsx`. Importar:

```tsx
import { getTrilhaEmAndamento } from '@/lib/trilhas/queries';
import { DashboardTrilhaCard } from '@/components/trilhas/DashboardTrilhaCard';
```

Na função do componente principal, adicionar:

```tsx
const trilhaEmAndamento = await getTrilhaEmAndamento();
```

Posicionar no JSX **abaixo do card de sessões e acima do card de tarefas** (ler o JSX existente para localizar o ponto exato):

```tsx
{trilhaEmAndamento && <DashboardTrilhaCard data={trilhaEmAndamento} />}
```

- [ ] **Step 3: Smoke manual**

Rodar `npm run dev`. Sem trilha atribuída: dashboard renderiza como antes (card não aparece). Com trilha atribuída e iniciada (inserida manualmente no DB), card aparece.

- [ ] **Step 4: Commit**

```bash
git add src/components/trilhas/DashboardTrilhaCard.tsx src/app/portal/\(authenticated\)/dashboard/page.tsx
git commit -m "feat(P3): dashboard card for trilha em andamento"
```

---

## Task 13: CRM — seção "Trilhas" no mentorado

**Files:**
- Modify: `mentoria-crm/src/app/mentorados/[id]/page.tsx`
- Create: `mentoria-crm/src/app/mentorados/[id]/trilhas-actions.ts`

**Nota:** o CRM é um app Next 16 separado. Ler primeiro o arquivo `page.tsx` existente para entender o padrão (client supabase server, componentes, forms) antes de editar.

- [ ] **Step 1: Ler o arquivo atual para referência**

```bash
cat mentoria-crm/src/app/mentorados/\[id\]/page.tsx | head -100
```

Identificar onde ficam as outras seções (tarefas, sessões, marcos) — seguir o mesmo padrão visual.

- [ ] **Step 2: Criar actions file**

`mentoria-crm/src/app/mentorados/[id]/trilhas-actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server'; // padrão do CRM; ajustar import se o alias for diferente

export async function atribuirTrilha(formData: FormData) {
  const mentoradoId = formData.get('mentorado_id') as string;
  const trilhaSlug = formData.get('trilha_slug') as string;
  if (!mentoradoId || !trilhaSlug) throw new Error('missing_params');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('mentorado_trilhas').insert({
    mentorado_id: mentoradoId,
    trilha_slug: trilhaSlug,
    assigned_by: user?.id ?? null,
  });
  if (error) {
    if (error.code === '23505') throw new Error('trilha_ja_atribuida');
    throw new Error(error.message);
  }
  revalidatePath(`/mentorados/${mentoradoId}`);
}

export async function removerTrilha(formData: FormData) {
  const id = formData.get('id') as string;
  const mentoradoId = formData.get('mentorado_id') as string;
  if (!id) throw new Error('missing_id');

  const supabase = await createClient();
  // só remover se ainda não iniciada
  const { data } = await supabase
    .from('mentorado_trilhas')
    .select('started_at')
    .eq('id', id)
    .single();
  if (data?.started_at) throw new Error('trilha_ja_iniciada');

  await supabase.from('mentorado_trilhas').delete().eq('id', id);
  revalidatePath(`/mentorados/${mentoradoId}`);
}
```

- [ ] **Step 3: Adicionar a seção no page.tsx**

Adicionar imports:

```tsx
import { atribuirTrilha, removerTrilha } from './trilhas-actions';
```

Adicionar a query de trilhas junto com as outras queries existentes:

```tsx
const { data: trilhasAtribuidas } = await supabase
  .from('mentorado_trilhas')
  .select('id, trilha_slug, assigned_at, started_at, completed_at, etapa_respostas(etapa_slug, status)')
  .eq('mentorado_id', id);

const TRILHAS_DISPONIVEIS: Array<{ slug: string; titulo: string }> = [
  { slug: 'preparacao-entrevistas', titulo: 'Preparação para Entrevistas' },
  { slug: 'mapa-competencias', titulo: 'Mapa de Competências' },
];

const slugsAtribuidas = new Set((trilhasAtribuidas ?? []).map((t) => t.trilha_slug));
const trilhasDisponiveis = TRILHAS_DISPONIVEIS.filter((t) => !slugsAtribuidas.has(t.slug));
```

Adicionar o JSX (posicionar próximo à seção de marcos ou tarefas — seguir padrão visual):

```tsx
<section className="bg-white rounded-2xl border border-slate-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-slate-900">Trilhas</h2>
  </div>

  {(trilhasAtribuidas ?? []).length === 0 ? (
    <p className="text-slate-500 text-sm">Nenhuma trilha atribuída.</p>
  ) : (
    <ul className="flex flex-col gap-2 mb-4">
      {(trilhasAtribuidas ?? []).map((mt) => {
        const titulo = TRILHAS_DISPONIVEIS.find((t) => t.slug === mt.trilha_slug)?.titulo ?? mt.trilha_slug;
        const done = (mt.etapa_respostas ?? []).filter((e: { status: string }) => e.status === 'done').length;
        const total = (mt.etapa_respostas ?? []).length;
        const iniciada = !!mt.started_at;
        return (
          <li key={mt.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
            <div>
              <p className="font-medium text-sm text-slate-900">{titulo}</p>
              <p className="text-xs text-slate-500">
                {mt.completed_at ? 'Concluída' : iniciada ? `Em andamento · ${done} etapa(s) concluída(s)` : 'Não iniciada'}
              </p>
            </div>
            {!iniciada && (
              <form action={removerTrilha}>
                <input type="hidden" name="id" value={mt.id} />
                <input type="hidden" name="mentorado_id" value={id} />
                <button className="text-xs text-red-600 hover:underline">Remover</button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  )}

  {trilhasDisponiveis.length > 0 && (
    <form action={atribuirTrilha} className="flex gap-2">
      <input type="hidden" name="mentorado_id" value={id} />
      <select name="trilha_slug" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm">
        {trilhasDisponiveis.map((t) => (
          <option key={t.slug} value={t.slug}>{t.titulo}</option>
        ))}
      </select>
      <button className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-800">
        Atribuir
      </button>
    </form>
  )}
</section>
```

- [ ] **Step 4: Smoke manual (end-to-end de US-026)**

1. `cd mentoria-crm && npm run dev` em um terminal, `cd .. && npm run dev` em outro (porta diferente).
2. No CRM, abrir um mentorado. Atribuir "Mapa de Competências". Ver aparecer na lista como "Não iniciada". Tentar atribuir de novo → erro amigável (`trilha_ja_atribuida`).
3. Remover — volta pro dropdown.
4. Atribuir de novo.
5. No portal, logar como esse mentorado. `/portal/trilhas` lista a trilha em "Não iniciadas".
6. Clicar na trilha — abre overview (sem etapas por enquanto). Clicar em "Iniciar trilha" → abre página player (sem widget ainda, trilha vazia).
7. Voltar ao CRM, tentar remover — erro `trilha_ja_iniciada`.

- [ ] **Step 5: Commit**

```bash
git add mentoria-crm/src/app/mentorados/\[id\]/page.tsx mentoria-crm/src/app/mentorados/\[id\]/trilhas-actions.ts
git commit -m "feat(P3): CRM — seção trilhas no mentorado (atribuir/remover)"
```

---

## Task 14: Widget `MatrizWidget` (modos avaliação + gap)

**Files:**
- Create: `src/lib/trilhas/matrizes.ts`
- Create: `src/components/trilhas/widgets/MatrizWidget.tsx`
- Modify: `src/lib/trilhas/widgets-registry.ts`

- [ ] **Step 1: Criar tipo e dados das matrizes (stubs — preenchidos em Task 16)**

`src/lib/trilhas/matrizes.ts`:

```ts
export interface Matriz {
  slug: 'pm-ladder' | 'lideranca';
  titulo: string;
  niveis: Array<{ id: number; nome: string }>; // ex: [{id:1, nome:'APM'}, {id:2, nome:'PM'}, ...]
  competencias: Array<{
    id: string;
    nome: string;
    descricao: string;
    descritores: Record<number, string>; // nivel_id -> descrição
  }>;
}

const pmLadder: Matriz = {
  slug: 'pm-ladder',
  titulo: 'PM Career Ladder',
  niveis: [
    { id: 1, nome: 'APM' },
    { id: 2, nome: 'PM' },
    { id: 3, nome: 'Sr PM' },
    { id: 4, nome: 'Staff PM' },
  ],
  competencias: [
    // preenchido em Task 16
  ],
};

const lideranca: Matriz = {
  slug: 'lideranca',
  titulo: 'Liderança',
  niveis: [
    { id: 1, nome: 'IC' },
    { id: 2, nome: 'Líder de time' },
    { id: 3, nome: 'Gestor' },
    { id: 4, nome: 'Diretor' },
  ],
  competencias: [
    // preenchido em Task 16
  ],
};

export const matrizes: Record<string, Matriz> = {
  'pm-ladder': pmLadder,
  lideranca,
};

export function getMatriz(slug: 'pm-ladder' | 'lideranca'): Matriz {
  return matrizes[slug];
}
```

- [ ] **Step 2: Criar o widget**

`src/components/trilhas/widgets/MatrizWidget.tsx`:

```tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { completeEtapa, saveResposta } from '@/lib/trilhas/actions';
import { getMatriz } from '@/lib/trilhas/matrizes';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

interface Config {
  matriz_ref: 'pm-ladder' | 'lideranca' | 'selectable';
  opcoes?: Array<'pm-ladder' | 'lideranca'>;
  modo: 'avaliacao' | 'gap';
  fonte_avaliacao_etapa_slug?: string;
}

type Resposta = {
  matriz_slug?: 'pm-ladder' | 'lideranca';
  niveis_atuais?: Record<string, number>;
  niveis_alvo?: Record<string, number>;
};

export default function MatrizWidget(props: WidgetProps) {
  const cfg = props.etapa.config as Config;
  if (cfg.modo === 'gap') return <GapView {...props} />;
  return <AvaliacaoView {...props} />;
}

function AvaliacaoView({ trilhaSlug, etapa, resposta }: WidgetProps) {
  const cfg = etapa.config as Config;
  const initial = (resposta?.resposta ?? {}) as Resposta;
  const [matrizSlug, setMatrizSlug] = useState<'pm-ladder' | 'lideranca' | undefined>(
    initial.matriz_slug ?? (cfg.matriz_ref !== 'selectable' ? cfg.matriz_ref : undefined)
  );
  const [niveisAtuais, setNiveisAtuais] = useState<Record<string, number>>(initial.niveis_atuais ?? {});
  const [niveisAlvo, setNiveisAlvo] = useState<Record<string, number>>(initial.niveis_alvo ?? {});
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = resposta?.status === 'done';

  useEffect(() => {
    if (done || !matrizSlug) return;
    const timer = setTimeout(() => {
      void saveResposta({
        trilhaSlug,
        etapaSlug: etapa.slug,
        resposta: { matriz_slug: matrizSlug, niveis_atuais: niveisAtuais, niveis_alvo: niveisAlvo },
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [matrizSlug, niveisAtuais, niveisAlvo, done, trilhaSlug, etapa.slug]);

  if (cfg.matriz_ref === 'selectable' && !matrizSlug) {
    const opcoes = cfg.opcoes ?? ['pm-ladder', 'lideranca'];
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <p className="font-semibold text-sm text-[#0f172a] mb-3">Escolha a matriz de competências:</p>
        <div className="flex flex-col gap-2">
          {opcoes.map((slug) => {
            const m = getMatriz(slug);
            return (
              <button
                key={slug}
                onClick={() => setMatrizSlug(slug)}
                className="flex items-start gap-3 text-left border border-[#e2e8f0] rounded-lg p-3 hover:border-[#1E88E5]/40 transition"
              >
                <div>
                  <p className="font-semibold text-sm text-[#0f172a]">{m.titulo}</p>
                  <p className="text-[#64748b] text-xs mt-1">
                    Níveis: {m.niveis.map((n) => n.nome).join(' → ')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!matrizSlug) return null;
  const matriz = getMatriz(matrizSlug);
  const todasPreenchidas = matriz.competencias.every(
    (c) => niveisAtuais[c.id] !== undefined && niveisAlvo[c.id] !== undefined
  );

  function concluir() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({
          trilhaSlug,
          etapaSlug: etapa.slug,
          resposta: { matriz_slug: matrizSlug, niveis_atuais: niveisAtuais, niveis_alvo: niveisAlvo },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <p className="text-xs font-semibold text-[#64748b] tracking-widest uppercase mb-2">{matriz.titulo}</p>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-semibold text-[#0f172a] pb-3 pr-3">Competência</th>
              {matriz.niveis.map((n) => (
                <th key={n.id} className="text-center font-semibold text-[#64748b] px-2 pb-3 text-xs">
                  {n.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matriz.competencias.map((c) => (
              <tr key={c.id} className="border-t border-[#e2e8f0]">
                <td className="py-3 pr-3">
                  <p className="font-medium text-[#0f172a]">{c.nome}</p>
                  <p className="text-[#94a3b8] text-xs">{c.descricao}</p>
                </td>
                {matriz.niveis.map((n) => {
                  const atual = niveisAtuais[c.id] === n.id;
                  const alvo = niveisAlvo[c.id] === n.id;
                  return (
                    <td key={n.id} className="text-center px-1 py-3">
                      <div className="flex flex-col gap-1 items-center">
                        <button
                          onClick={() => !done && setNiveisAtuais((p) => ({ ...p, [c.id]: n.id }))}
                          disabled={done}
                          className={`w-6 h-6 rounded-full border-2 transition ${atual ? 'bg-[#1E88E5] border-[#1E88E5]' : 'border-[#e2e8f0] hover:border-[#1E88E5]/40'}`}
                          title="Nível atual"
                        />
                        <button
                          onClick={() => !done && setNiveisAlvo((p) => ({ ...p, [c.id]: n.id }))}
                          disabled={done}
                          className={`w-6 h-6 rounded border-2 transition ${alvo ? 'bg-orange-500 border-orange-500' : 'border-[#e2e8f0] hover:border-orange-300'}`}
                          title="Nível alvo"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-4 mt-4 text-xs text-[#64748b]">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1E88E5]" /> Nível atual
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-orange-500" /> Nível alvo
          </span>
        </div>
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Concluído
          </div>
        ) : (
          <button
            onClick={concluir}
            disabled={pending || !todasPreenchidas}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Concluir auto-avaliação'}
          </button>
        )}
        {!done && !todasPreenchidas && (
          <p className="text-[#94a3b8] text-xs mt-2">Marque nível atual e alvo de todas as competências.</p>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}

function GapView({ trilhaSlug, etapa, resposta, contextoTrilhaRespostas }: WidgetProps) {
  const cfg = etapa.config as Config;
  const fonte = contextoTrilhaRespostas.find((r) => r.etapa_slug === cfg.fonte_avaliacao_etapa_slug);
  const fonteResposta = (fonte?.resposta ?? null) as Resposta | null;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = resposta?.status === 'done';

  if (!fonteResposta?.matriz_slug) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center">
        <p className="text-[#94a3b8] text-sm">Complete a etapa de auto-avaliação primeiro.</p>
      </div>
    );
  }

  const matriz = getMatriz(fonteResposta.matriz_slug);
  const gaps = matriz.competencias
    .map((c) => {
      const atual = fonteResposta.niveis_atuais?.[c.id] ?? 0;
      const alvo = fonteResposta.niveis_alvo?.[c.id] ?? 0;
      return { competencia: c, atual, alvo, gap: Math.max(0, alvo - atual) };
    })
    .sort((a, b) => b.gap - a.gap);
  const maxGap = Math.max(1, ...gaps.map((g) => g.gap));

  function confirmar() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({
          trilhaSlug,
          etapaSlug: etapa.slug,
          resposta: { confirmado_em: new Date().toISOString() },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <p className="text-xs font-semibold text-[#64748b] tracking-widest uppercase mb-3">Seus gaps, ordenados</p>
        <div className="flex flex-col gap-3">
          {gaps.map((g) => (
            <div key={g.competencia.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#0f172a]">{g.competencia.nome}</span>
                <span className="text-[#94a3b8]">{g.atual} → {g.alvo} (gap {g.gap})</span>
              </div>
              <div className="w-full h-2 bg-[#F7F8FC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition"
                  style={{ width: `${(g.gap / maxGap) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Concluído
          </div>
        ) : (
          <button
            onClick={confirmar}
            disabled={pending}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Entendi, próximo passo'}
          </button>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Registrar**

Em `src/lib/trilhas/widgets-registry.ts`:

```ts
import MatrizWidget from '@/components/trilhas/widgets/MatrizWidget';
// ...
export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  conteudo: ConteudoWidget,
  checklist: ChecklistWidget,
  matriz: MatrizWidget,
};
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/trilhas/matrizes.ts src/components/trilhas/widgets/MatrizWidget.tsx src/lib/trilhas/widgets-registry.ts
git commit -m "feat(P3): MatrizWidget (avaliacao + gap modes)"
```

---

## Task 15: Widget `PlanoAcaoWidget`

**Files:**
- Create: `src/components/trilhas/widgets/PlanoAcaoWidget.tsx`
- Modify: `src/lib/trilhas/widgets-registry.ts`

- [ ] **Step 1: Criar o widget**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { submitPlanoAcao } from '@/lib/trilhas/actions';
import { getMatriz } from '@/lib/trilhas/matrizes';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

interface Config {
  fonte_avaliacao_etapa_slug: string;
  n_acoes: number;
}

interface Acao {
  competencia_id: string;
  descricao: string;
  prazo: string;
}

export default function PlanoAcaoWidget({ trilhaSlug, etapa, resposta, contextoTrilhaRespostas }: WidgetProps) {
  const cfg = etapa.config as Config;
  const done = resposta?.status === 'done';

  const fonte = contextoTrilhaRespostas.find((r) => r.etapa_slug === cfg.fonte_avaliacao_etapa_slug);
  const fonteResposta = (fonte?.resposta ?? null) as {
    matriz_slug?: 'pm-ladder' | 'lideranca';
    niveis_atuais?: Record<string, number>;
    niveis_alvo?: Record<string, number>;
  } | null;

  const topGaps = fonteResposta?.matriz_slug
    ? getMatriz(fonteResposta.matriz_slug).competencias
        .map((c) => ({
          competencia: c,
          gap: (fonteResposta.niveis_alvo?.[c.id] ?? 0) - (fonteResposta.niveis_atuais?.[c.id] ?? 0),
        }))
        .filter((x) => x.gap > 0)
        .sort((a, b) => b.gap - a.gap)
        .slice(0, cfg.n_acoes)
    : [];

  const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const initialAcoes: Acao[] = done && resposta?.resposta
    ? (resposta.resposta as { acoes: Acao[] }).acoes
    : topGaps.map((g) => ({ competencia_id: g.competencia.id, descricao: '', prazo: inTwoWeeks }));

  const [acoes, setAcoes] = useState<Acao[]>(initialAcoes);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!fonteResposta?.matriz_slug) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center">
        <p className="text-[#94a3b8] text-sm">Complete a etapa de auto-avaliação primeiro.</p>
      </div>
    );
  }

  const matriz = getMatriz(fonteResposta.matriz_slug);

  const podeSubmeter = acoes.length === cfg.n_acoes && acoes.every((a) => a.descricao.trim().length > 0 && a.prazo);

  function submeter() {
    setError(null);
    start(async () => {
      try {
        await submitPlanoAcao({ trilhaSlug, etapaSlug: etapa.slug, acoes });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <p className="text-[#64748b] text-sm mb-4">
          Com base nos seus gaps, escreva {cfg.n_acoes} ações concretas. Cada uma virará uma tarefa em "Tarefas".
        </p>
        <div className="flex flex-col gap-4">
          {acoes.map((acao, i) => {
            const comp = matriz.competencias.find((c) => c.id === acao.competencia_id);
            return (
              <div key={i} className="border border-[#e2e8f0] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#94a3b8] tracking-widest uppercase">Ação {i + 1}</p>
                  {!done && (
                    <select
                      value={acao.competencia_id}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAcoes((prev) => prev.map((a, idx) => idx === i ? { ...a, competencia_id: v } : a));
                      }}
                      className="text-xs border border-[#e2e8f0] rounded px-2 py-1"
                    >
                      {matriz.competencias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  )}
                  {done && comp && (
                    <span className="text-xs font-medium text-[#0f172a]">{comp.nome}</span>
                  )}
                </div>
                <textarea
                  value={acao.descricao}
                  onChange={(e) => setAcoes((prev) => prev.map((a, idx) => idx === i ? { ...a, descricao: e.target.value } : a))}
                  disabled={done}
                  placeholder="O que você vai fazer?"
                  rows={2}
                  className="w-full text-sm text-[#0f172a] border border-[#e2e8f0] rounded p-2 focus:border-[#1E88E5] outline-none disabled:opacity-60"
                />
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-[#64748b]">Prazo:</label>
                  <input
                    type="date"
                    value={acao.prazo}
                    onChange={(e) => setAcoes((prev) => prev.map((a, idx) => idx === i ? { ...a, prazo: e.target.value } : a))}
                    disabled={done}
                    className="text-sm border border-[#e2e8f0] rounded px-2 py-1 disabled:opacity-60"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Plano submetido · tarefas criadas em <a href="/portal/tarefas" className="underline">/portal/tarefas</a>
          </div>
        ) : (
          <button
            onClick={submeter}
            disabled={pending || !podeSubmeter}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Gerando tarefas…' : 'Submeter plano'}
          </button>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Registrar**

Em `src/lib/trilhas/widgets-registry.ts`, adicionar:

```ts
import PlanoAcaoWidget from '@/components/trilhas/widgets/PlanoAcaoWidget';
// ...
export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  conteudo: ConteudoWidget,
  checklist: ChecklistWidget,
  matriz: MatrizWidget,
  plano_acao: PlanoAcaoWidget,
};
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/trilhas/widgets/PlanoAcaoWidget.tsx src/lib/trilhas/widgets-registry.ts
git commit -m "feat(P3): PlanoAcaoWidget (generates tarefas via RPC)"
```

---

## Task 16: Conteúdo da Trilha "Mapa de Competências" (US-028)

**Files:**
- Modify: `src/lib/trilhas/matrizes.ts` (preencher competencias)
- Modify: `src/lib/trilhas/content.ts` (preencher etapas)

**Nota:** os descritores aqui são uma **primeira versão para destravar engenharia**. A mentora deve revisar e editar. Flagger no commit/PR.

- [ ] **Step 1: Preencher competências em `matrizes.ts`**

Substituir o array `competencias` de `pmLadder`:

```ts
competencias: [
  {
    id: 'discovery',
    nome: 'Discovery',
    descricao: 'Pesquisa, entrevistas e geração de insights de produto',
    descritores: {
      1: 'Participa de entrevistas conduzidas por outros; resume achados.',
      2: 'Conduz entrevistas de descoberta com apoio; formula hipóteses simples.',
      3: 'Estrutura agendas de discovery independente; triangula sinais qualitativos e quantitativos.',
      4: 'Define frameworks de discovery para o time; mentora PMs na técnica.',
    },
  },
  {
    id: 'delivery',
    nome: 'Delivery',
    descricao: 'Planejamento, priorização e entrega contínua',
    descritores: {
      1: 'Escreve histórias claras; acompanha execução de uma iniciativa.',
      2: 'Conduz ritos do time; mantém backlog priorizado; desbloqueia entregas.',
      3: 'Planeja roadmap trimestral com trade-offs; reduz risco de entrega com marcos intermediários.',
      4: 'Define padrões de delivery cross-time; eleva qualidade e previsibilidade do portfólio.',
    },
  },
  {
    id: 'estrategia',
    nome: 'Estratégia',
    descricao: 'Visão de produto e alinhamento com estratégia da empresa',
    descritores: {
      1: 'Entende a estratégia do time e conecta suas entregas.',
      2: 'Formula objetivos trimestrais alinhados à estratégia da área.',
      3: 'Propõe apostas estratégicas com evidência; influencia o plano da área.',
      4: 'Define a estratégia da área em conjunto com liderança; justifica com narrativa e dados.',
    },
  },
  {
    id: 'stakeholders',
    nome: 'Stakeholder management',
    descricao: 'Alinhamento com áreas adjacentes e executivos',
    descritores: {
      1: 'Comunica progresso para stakeholders diretos.',
      2: 'Negocia escopo e prazos com áreas adjacentes.',
      3: 'Influencia executivos de outras áreas com dados e narrativa.',
      4: 'Resolve conflitos estratégicos inter-áreas; ganha patrocínio executivo.',
    },
  },
  {
    id: 'metricas',
    nome: 'Métricas & análise',
    descricao: 'Definição de métricas, leitura de dados, experimentação',
    descritores: {
      1: 'Lê dashboards; interpreta métricas chave do produto.',
      2: 'Define métricas para iniciativas; analisa resultados de experimentos.',
      3: 'Propõe árvores de métricas completas; instrumenta experimentos sofisticados.',
      4: 'Estabelece framework de medição da área; mentora o time em análise causal.',
    },
  },
  {
    id: 'comunicacao',
    nome: 'Comunicação',
    descricao: 'Narrativa, escrita e apresentação',
    descritores: {
      1: 'Escreve docs claros do dia a dia (histórias, updates).',
      2: 'Escreve PRFAQs, one-pagers e apresentações estruturadas.',
      3: 'Conduz narrativas de médio/longo prazo para o time e stakeholders.',
      4: 'Comunica com executivos e externamente; eleva padrão de escrita do time.',
    },
  },
  {
    id: 'lideranca',
    nome: 'Liderança de produto',
    descricao: 'Condução do time e formação de cultura',
    descritores: {
      1: 'Colabora bem; traz problemas em vez de soluções apenas.',
      2: 'Facilita discussões técnicas e de produto dentro do time.',
      3: 'Mentora PMs juniors; lidera iniciativas multidisciplinares.',
      4: 'Desenvolve líderes; eleva a maturidade do craft de produto no time.',
    },
  },
],
```

Substituir o array `competencias` de `lideranca`:

```ts
competencias: [
  {
    id: 'visao',
    nome: 'Visão & direção',
    descricao: 'Definir e comunicar para onde o time vai',
    descritores: {
      1: 'Entende e executa a direção dada por outros.',
      2: 'Traduz direção em prioridades claras para o time imediato.',
      3: 'Define direção de médio prazo com o time; ajusta conforme aprendizado.',
      4: 'Define direção de longo prazo; alinha múltiplos times em torno dela.',
    },
  },
  {
    id: 'coaching',
    nome: 'Coaching',
    descricao: 'Desenvolvimento de pessoas através de conversas regulares',
    descritores: {
      1: 'Dá feedback pontual quando solicitado.',
      2: 'Mantém 1:1s consistentes; ajuda pessoas a resolver problemas táticos.',
      3: 'Orienta crescimento de carreira; desbloqueia pessoas via perguntas certas.',
      4: 'Desenvolve líderes que desenvolvem outros.',
    },
  },
  {
    id: 'decisao',
    nome: 'Decisão sob incerteza',
    descricao: 'Escolher com informação incompleta e reversibilidade em mente',
    descritores: {
      1: 'Escolhe bem dentro de opções dadas.',
      2: 'Avalia trade-offs visíveis e decide em prazos curtos.',
      3: 'Distingue decisões reversíveis de irreversíveis; protege o time da pressão.',
      4: 'Estabelece rituais de decisão; eleva qualidade das decisões cross-time.',
    },
  },
  {
    id: 'performance',
    nome: 'Gestão de performance',
    descricao: 'Expectativas claras, feedback contínuo e avaliação justa',
    descritores: {
      1: 'Dá feedback informal no dia a dia.',
      2: 'Conduz conversas de feedback estruturadas; reconhece alto desempenho.',
      3: 'Gerencia baixo desempenho com clareza e empatia; promove quem merece.',
      4: 'Calibra performance no nível da organização; eleva barra do time.',
    },
  },
  {
    id: 'executivo',
    nome: 'Comunicação executiva',
    descricao: 'Comunicar com C-level e board',
    descritores: {
      1: 'Apresenta updates operacionais com apoio.',
      2: 'Prepara narrativas para stakeholders seniores com coaching.',
      3: 'Comunica diretamente com executivos; antecipa perguntas difíceis.',
      4: 'Influencia decisão no C-level/board.',
    },
  },
  {
    id: 'time',
    nome: 'Construção de time',
    descricao: 'Contratar, integrar e formar times',
    descritores: {
      1: 'Participa de entrevistas como referência técnica.',
      2: 'Conduz entrevistas completas; define critérios para um papel.',
      3: 'Estrutura pipeline de contratação; integra novos times.',
      4: 'Define modelo organizacional; patrocina diversidade e inclusão.',
    },
  },
  {
    id: 'accountability',
    nome: 'Accountability',
    descricao: 'Assumir resultados e aprender com falhas',
    descritores: {
      1: 'Reconhece erros individuais.',
      2: 'Assume responsabilidade por entregas do time.',
      3: 'Conduz post-mortems construtivos; reduz recorrência.',
      4: 'Cultiva cultura de ownership em toda a organização.',
    },
  },
],
```

- [ ] **Step 2: Preencher etapas em `content.ts`**

Substituir o array `etapas` de `trilhaMapaCompetencias`:

```ts
etapas: [
  {
    slug: 'contexto',
    titulo: 'Contexto',
    descricao: 'O que é uma matriz de competências e como usá-la entre sessões',
    tipo: 'conteudo',
    config: {
      markdown: `
## O que é uma matriz de competências

Uma matriz mapeia o que se espera de você em diferentes níveis. Cada **competência** tem descritores por **nível** — de júnior a senior. O objetivo não é virar "máximo" em tudo, mas identificar onde você está hoje e onde precisa chegar.

## Como usar esta trilha

1. Escolha entre **PM Career Ladder** ou **Liderança** na próxima etapa.
2. Para cada competência, marque seu nível atual (**azul**) e o nível alvo (**laranja**).
3. Veja seus gaps ordenados.
4. Escreva 3 ações concretas para atacar os maiores gaps. Elas viram tarefas automaticamente.

Não responda pensando "onde eu gostaria de estar". Responda com evidência real — que coisas você entregou no último trimestre que demonstram esse nível.
`.trim(),
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
```

- [ ] **Step 3: Smoke end-to-end (US-028)**

1. Assumir que há uma trilha "Mapa de Competências" atribuída a um mentorado de teste.
2. Logar como esse mentorado. Abrir `/portal/trilhas/mapa-competencias`.
3. Completar etapa "Contexto" (marcar como lido).
4. Em "Auto-avaliação": escolher "PM Career Ladder". Preencher nível atual e alvo de todas competências. Concluir.
5. Em "Seus gaps": verificar se aparece bar chart ordenado pelo maior gap. Confirmar.
6. Em "Plano de ação": verificar que as 3 maiores competências (por gap) aparecem pré-selecionadas. Escrever descrição em cada ação. Submeter.
7. Abrir `/portal/tarefas`. **Verificar que 3 tarefas foram criadas** com as descrições do plano e `origem='trilha:mapa-competencias:plano-acao'` (verificar via SQL query no Supabase).
8. Voltar à trilha. Verificar que está marcada como concluída no `/portal/trilhas`.
9. **Teste de idempotência:** tentar re-submeter o plano (hack pelo DevTools: chamar o server action de novo). Esperado: RPC rejeita com `plano_acao_ja_submetido`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/trilhas/matrizes.ts src/lib/trilhas/content.ts
git commit -m "feat(P3): content for trilha mapa-competencias (US-028)

Fills competencies and descriptors for PM Career Ladder + Liderança.
First-pass descriptors — mentor should review and edit."
```

---

## Task 17: Widget `BancoPerguntasWidget`

**Files:**
- Create: `src/lib/trilhas/perguntas.ts` (seed)
- Create: `src/components/trilhas/widgets/BancoPerguntasWidget.tsx`
- Modify: `src/lib/trilhas/widgets-registry.ts`

- [ ] **Step 1: Criar seed de perguntas (scaffolding)**

`src/lib/trilhas/perguntas.ts`:

```ts
export interface Pergunta {
  id: string;
  texto: string;
  categoria: 'behavioral' | 'produto' | 'case' | 'lideranca';
  senioridade: Array<'jr' | 'pleno' | 'sr'>;
}

// Primeira versão curada. Mentora deve revisar/expandir. Target: 60-80 perguntas.
export const PERGUNTAS_ENTREVISTA: Pergunta[] = [
  // Behavioral
  { id: 'beh-01', texto: 'Conte sobre um conflito difícil com um colega. Como você resolveu?', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-02', texto: 'Descreva uma vez em que você falhou em algo importante. O que aprendeu?', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-03', texto: 'Fale de uma decisão sua que você mudaria hoje se pudesse.', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-04', texto: 'Conte sobre um feedback difícil que você recebeu.', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-05', texto: 'Descreva uma situação em que você teve que liderar sem autoridade formal.', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-06', texto: 'Fale sobre uma vez em que você discordou publicamente de sua liderança.', categoria: 'behavioral', senioridade: ['sr'] },
  { id: 'beh-07', texto: 'Conte sobre um projeto que teve que ser cancelado. Como você comunicou?', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-08', texto: 'Descreva uma vez em que você mudou de opinião com base em dados.', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-09', texto: 'Conte sobre seu maior erro profissional.', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-10', texto: 'Fale de uma conquista sua da qual você tem mais orgulho. Por quê?', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'beh-11', texto: 'Como você lida com prazos impossíveis?', categoria: 'behavioral', senioridade: ['jr', 'pleno'] },
  { id: 'beh-12', texto: 'Descreva uma vez em que você teve que negociar com stakeholders difíceis.', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-13', texto: 'Conte sobre uma vez em que você estava claramente errado. Como reagiu?', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-14', texto: 'Fale de uma vez que você teve que tomar uma decisão sem dados suficientes.', categoria: 'behavioral', senioridade: ['pleno', 'sr'] },
  { id: 'beh-15', texto: 'Descreva sua filosofia de trabalho em 3 frases.', categoria: 'behavioral', senioridade: ['jr', 'pleno', 'sr'] },

  // Produto
  { id: 'prod-01', texto: 'Qual produto você admira mais e por quê?', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'prod-02', texto: 'Se você fosse o PM do WhatsApp, o que melhoraria nos próximos 3 meses?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-03', texto: 'Como você priorizaria 10 features que o time propôs?', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'prod-04', texto: 'Descreva uma métrica-Norte para um app de delivery. Justifique.', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-05', texto: 'Como você saberia se um novo feature "foi um sucesso"?', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'prod-06', texto: 'Um experimento A/B deu resultado positivo mas o VP odeia a ideia. O que você faz?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-07', texto: 'Descreva um produto que você "matou" e explique por quê.', categoria: 'produto', senioridade: ['sr'] },
  { id: 'prod-08', texto: 'Como você estruturaria descoberta para um mercado que ainda não existe?', categoria: 'produto', senioridade: ['sr'] },
  { id: 'prod-09', texto: 'Seu time entregou a feature; ninguém usa. Quais as hipóteses? Como testaria?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-10', texto: 'Engenharia diz que a feature vai demorar 3x mais que o estimado. O que fazer?', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'prod-11', texto: 'Qual a diferença entre uma métrica de output e uma métrica de outcome?', categoria: 'produto', senioridade: ['jr', 'pleno'] },
  { id: 'prod-12', texto: 'Como você decide entre otimizar um funil existente vs construir algo novo?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-13', texto: 'Qual o papel de um PM em uma empresa com CEO engenheiro?', categoria: 'produto', senioridade: ['pleno', 'sr'] },
  { id: 'prod-14', texto: 'Você tem que cortar 30% do roadmap. Como explica para o time?', categoria: 'produto', senioridade: ['sr'] },
  { id: 'prod-15', texto: 'Como PM você deveria escrever código? Justifique sua posição.', categoria: 'produto', senioridade: ['jr', 'pleno', 'sr'] },

  // Case
  { id: 'case-01', texto: 'Quantas pizzas são vendidas no Brasil por ano? Estime.', categoria: 'case', senioridade: ['jr', 'pleno', 'sr'] },
  { id: 'case-02', texto: 'Desenhe um produto novo para estudantes universitários.', categoria: 'case', senioridade: ['jr', 'pleno'] },
  { id: 'case-03', texto: 'A retenção caiu 15% mês a mês. O que você investiga?', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-04', texto: 'Como você melhoraria a experiência de checkout de um e-commerce?', categoria: 'case', senioridade: ['jr', 'pleno'] },
  { id: 'case-05', texto: 'Proponha uma estratégia de crescimento para um app B2C nos próximos 12 meses.', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-06', texto: 'Conversões caíram 5% esta semana, mas só em iOS. Diagnóstico.', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-07', texto: 'Modele um produto para o mercado 50+.', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-08', texto: 'Desenhe a monetização de um app que hoje é gratuito.', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-09', texto: 'Como você estruturaria o go-to-market de uma feature B2B?', categoria: 'case', senioridade: ['pleno', 'sr'] },
  { id: 'case-10', texto: 'Um concorrente lançou uma feature que seu produto não tem. Qual sua resposta?', categoria: 'case', senioridade: ['pleno', 'sr'] },

  // Liderança
  { id: 'lid-01', texto: 'Como você dá feedback difícil para alguém sênior do time?', categoria: 'lideranca', senioridade: ['pleno', 'sr'] },
  { id: 'lid-02', texto: 'Um engenheiro do seu time está consistentemente abaixo da expectativa. O que fazer?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-03', texto: 'Como você constrói consenso sem diluir a decisão?', categoria: 'lideranca', senioridade: ['pleno', 'sr'] },
  { id: 'lid-04', texto: 'Descreva seu estilo de 1:1.', categoria: 'lideranca', senioridade: ['pleno', 'sr'] },
  { id: 'lid-05', texto: 'Como você contrata para um papel que nunca fez?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-06', texto: 'Seu time está desengajado. Qual seu primeiro passo?', categoria: 'lideranca', senioridade: ['pleno', 'sr'] },
  { id: 'lid-07', texto: 'Você discorda da direção que seu CPO está tomando. O que faz?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-08', texto: 'Como você calibra expectativas entre pessoas sêniores e júniores no mesmo time?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-09', texto: 'Um member do time quer ser promovido mas ainda não está pronto. Como comunica?', categoria: 'lideranca', senioridade: ['sr'] },
  { id: 'lid-10', texto: 'Você herdou um time em crise. Plano dos primeiros 30 dias?', categoria: 'lideranca', senioridade: ['sr'] },
];
```

- [ ] **Step 2: Criar o widget**

```tsx
'use client';

import { useState, useTransition, useMemo } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { completeEtapa, saveResposta } from '@/lib/trilhas/actions';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';
import type { Pergunta } from '@/lib/trilhas/perguntas';

interface Config {
  perguntas: Pergunta[];
  min_favoritas: number;
}

export default function BancoPerguntasWidget({ trilhaSlug, etapa, resposta }: WidgetProps) {
  const cfg = etapa.config as Config;
  const initial = (resposta?.resposta ?? {}) as { favoritas?: string[] };
  const [favoritas, setFavoritas] = useState<string[]>(initial.favoritas ?? []);
  const [cat, setCat] = useState<Pergunta['categoria'] | 'todas'>('todas');
  const [sen, setSen] = useState<'todas' | 'jr' | 'pleno' | 'sr'>('todas');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = resposta?.status === 'done';

  const filtradas = useMemo(() => {
    return cfg.perguntas.filter((p) => {
      if (cat !== 'todas' && p.categoria !== cat) return false;
      if (sen !== 'todas' && !p.senioridade.includes(sen)) return false;
      return true;
    });
  }, [cfg.perguntas, cat, sen]);

  const toggle = (id: string) => {
    const novo = favoritas.includes(id) ? favoritas.filter((x) => x !== id) : [...favoritas, id];
    setFavoritas(novo);
    if (!done) {
      void saveResposta({ trilhaSlug, etapaSlug: etapa.slug, resposta: { favoritas: novo } }).catch(() => {});
    }
  };

  const canComplete = favoritas.length >= cfg.min_favoritas;

  function concluir() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({ trilhaSlug, etapaSlug: etapa.slug, resposta: { favoritas } });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip active={cat === 'todas'} onClick={() => setCat('todas')}>Todas</Chip>
          <Chip active={cat === 'behavioral'} onClick={() => setCat('behavioral')}>Behavioral</Chip>
          <Chip active={cat === 'produto'} onClick={() => setCat('produto')}>Produto</Chip>
          <Chip active={cat === 'case'} onClick={() => setCat('case')}>Case</Chip>
          <Chip active={cat === 'lideranca'} onClick={() => setCat('lideranca')}>Liderança</Chip>
          <span className="w-px bg-[#e2e8f0] mx-1" />
          <Chip active={sen === 'todas'} onClick={() => setSen('todas')}>Qualquer</Chip>
          <Chip active={sen === 'jr'} onClick={() => setSen('jr')}>Jr</Chip>
          <Chip active={sen === 'pleno'} onClick={() => setSen('pleno')}>Pleno</Chip>
          <Chip active={sen === 'sr'} onClick={() => setSen('sr')}>Sr</Chip>
        </div>
        <p className="text-[#64748b] text-xs mb-3">
          {favoritas.length} favoritada(s) · mínimo {cfg.min_favoritas}
        </p>
        <ul className="flex flex-col gap-2">
          {filtradas.map((p) => {
            const fav = favoritas.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => !done && toggle(p.id)}
                  disabled={done}
                  className="flex items-start gap-3 text-left w-full border border-[#e2e8f0] rounded-lg p-3 hover:border-[#1E88E5]/40 transition disabled:cursor-default"
                >
                  <Star className={`w-4 h-4 shrink-0 mt-0.5 ${fav ? 'fill-orange-500 text-orange-500' : 'text-[#94a3b8]'}`} />
                  <div>
                    <p className="text-sm text-[#0f172a]">{p.texto}</p>
                    <p className="text-[#94a3b8] text-xs mt-1">
                      {p.categoria} · {p.senioridade.join(', ')}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-6">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Concluído
          </div>
        ) : (
          <button
            onClick={concluir}
            disabled={pending || !canComplete}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Concluir etapa'}
          </button>
        )}
        {!done && !canComplete && (
          <p className="text-[#94a3b8] text-xs mt-2">Favorite pelo menos {cfg.min_favoritas} perguntas para avançar.</p>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${active ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#1E88E5]/40'}`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Registrar**

```ts
import BancoPerguntasWidget from '@/components/trilhas/widgets/BancoPerguntasWidget';
// ...
export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  conteudo: ConteudoWidget,
  checklist: ChecklistWidget,
  matriz: MatrizWidget,
  plano_acao: PlanoAcaoWidget,
  banco_perguntas: BancoPerguntasWidget,
};
```

- [ ] **Step 4: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/trilhas/perguntas.ts src/components/trilhas/widgets/BancoPerguntasWidget.tsx src/lib/trilhas/widgets-registry.ts
git commit -m "feat(P3): BancoPerguntasWidget + seed of 50+ curated questions"
```

---

## Task 18: Widget `StarBuilderWidget` + export PDF

**Files:**
- Create: `src/components/trilhas/widgets/StarBuilderWidget.tsx`
- Create: `src/app/api/exportar-star/route.ts`
- Modify: `src/lib/trilhas/widgets-registry.ts`

- [ ] **Step 1: Criar rota de export PDF**

`src/app/api/exportar-star/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase-server';
import { getTrilha } from '@/lib/trilhas/content';
import { PERGUNTAS_ENTREVISTA } from '@/lib/trilhas/perguntas';
import type { TrilhaSlug } from '@/types/portal';
import React from 'react';

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

  const { data: mt } = await supabase
    .from('mentorado_trilhas')
    .select('id, mentorado:mentorados(name)')
    .eq('trilha_slug', trilhaSlug)
    .single();
  if (!mt) return new Response('not_found', { status: 404 });

  const { data: resp } = await supabase
    .from('etapa_respostas')
    .select('resposta')
    .eq('mentorado_trilha_id', mt.id)
    .eq('etapa_slug', etapaSlug)
    .single();

  const stars = (resp?.resposta as { stars?: Record<string, { s: string; t: string; a: string; r: string }> } | null)?.stars ?? {};
  const trilha = getTrilha(trilhaSlug as TrilhaSlug);
  const perguntas = PERGUNTAS_ENTREVISTA;

  const blocks = Object.entries(stars)
    .map(([pid, star]) => ({ pergunta: perguntas.find((p) => p.id === pid), star }))
    .filter((x) => x.pergunta);

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.h1 }, `${trilha.titulo} — STARs`),
      ...blocks.map((b, i) => React.createElement(
        View,
        { key: i, style: styles.qBlock },
        React.createElement(Text, { style: styles.qText }, b.pergunta!.texto),
        React.createElement(Text, { style: styles.label }, 'Situação'),
        React.createElement(Text, { style: styles.body }, b.star.s || '—'),
        React.createElement(Text, { style: styles.label }, 'Tarefa'),
        React.createElement(Text, { style: styles.body }, b.star.t || '—'),
        React.createElement(Text, { style: styles.label }, 'Ação'),
        React.createElement(Text, { style: styles.body }, b.star.a || '—'),
        React.createElement(Text, { style: styles.label }, 'Resultado'),
        React.createElement(Text, { style: styles.body }, b.star.r || '—'),
      ))
    )
  );

  const buf = await renderToBuffer(doc);
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="stars-${trilhaSlug}.pdf"`,
    },
  });
}
```

- [ ] **Step 2: Criar o widget**

`src/components/trilhas/widgets/StarBuilderWidget.tsx`:

```tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { completeEtapa, saveResposta } from '@/lib/trilhas/actions';
import { PERGUNTAS_ENTREVISTA } from '@/lib/trilhas/perguntas';
import type { WidgetProps } from '@/lib/trilhas/widgets-registry';

interface Config {
  min_completos: number;
  fonte_favoritas_etapa_slug: string;
}

interface Star { s: string; t: string; a: string; r: string; }

export default function StarBuilderWidget({ trilhaSlug, etapa, resposta, contextoTrilhaRespostas }: WidgetProps) {
  const cfg = etapa.config as Config;
  const done = resposta?.status === 'done';

  const fonte = contextoTrilhaRespostas.find((r) => r.etapa_slug === cfg.fonte_favoritas_etapa_slug);
  const favoritas = ((fonte?.resposta ?? {}) as { favoritas?: string[] }).favoritas ?? [];

  const initial = (resposta?.resposta ?? {}) as { stars?: Record<string, Star> };
  const [stars, setStars] = useState<Record<string, Star>>(initial.stars ?? {});
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => {
      void saveResposta({ trilhaSlug, etapaSlug: etapa.slug, resposta: { stars } }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [stars, done, trilhaSlug, etapa.slug]);

  if (favoritas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center">
        <p className="text-[#94a3b8] text-sm">Favorite perguntas na etapa anterior primeiro.</p>
      </div>
    );
  }

  const completos = Object.values(stars).filter((s) => s.s && s.t && s.a && s.r).length;
  const canComplete = completos >= cfg.min_completos;

  function updateStar(pid: string, field: keyof Star, value: string) {
    setStars((prev) => ({ ...prev, [pid]: { ...(prev[pid] ?? { s: '', t: '', a: '', r: '' }), [field]: value } }));
  }

  function concluir() {
    setError(null);
    start(async () => {
      try {
        await completeEtapa({ trilhaSlug, etapaSlug: etapa.slug, resposta: { stars } });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'erro');
      }
    });
  }

  return (
    <div>
      <p className="text-[#64748b] text-xs mb-3">
        {completos} completos · mínimo {cfg.min_completos} (todos 4 campos preenchidos)
      </p>
      <div className="flex flex-col gap-4">
        {favoritas.map((pid) => {
          const pergunta = PERGUNTAS_ENTREVISTA.find((p) => p.id === pid);
          if (!pergunta) return null;
          const star = stars[pid] ?? { s: '', t: '', a: '', r: '' };
          return (
            <div key={pid} className="bg-white rounded-xl border border-[#e2e8f0] p-5">
              <p className="font-semibold text-sm text-[#0f172a] mb-3">{pergunta.texto}</p>
              {(['s', 't', 'a', 'r'] as const).map((f) => (
                <div key={f} className="mb-2">
                  <label className="text-xs font-semibold text-[#64748b] tracking-widest uppercase">
                    {f === 's' ? 'Situação' : f === 't' ? 'Tarefa' : f === 'a' ? 'Ação' : 'Resultado'}
                  </label>
                  <textarea
                    value={star[f]}
                    onChange={(e) => updateStar(pid, f, e.target.value)}
                    disabled={done}
                    rows={f === 'a' ? 4 : 2}
                    className="w-full text-sm text-[#0f172a] border border-[#e2e8f0] rounded p-2 mt-1 focus:border-[#1E88E5] outline-none disabled:opacity-60"
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-3 flex-wrap">
        {done ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Concluído
          </div>
        ) : (
          <button
            onClick={concluir}
            disabled={pending || !canComplete}
            className="bg-[#1E88E5] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#1976D2] disabled:opacity-50 transition"
          >
            {pending ? 'Salvando…' : 'Concluir etapa'}
          </button>
        )}
        {completos > 0 && (
          <a
            href={`/api/exportar-star?trilha=${trilhaSlug}&etapa=${etapa.slug}`}
            className="flex items-center gap-1 text-[#1E88E5] text-sm font-semibold border border-[#1E88E5]/30 hover:bg-blue-50 px-4 py-2 rounded-full"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </a>
        )}
      </div>
      {!done && !canComplete && (
        <p className="text-[#94a3b8] text-xs mt-2">Preencha os 4 campos em pelo menos {cfg.min_completos} perguntas.</p>
      )}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Registrar**

```ts
import StarBuilderWidget from '@/components/trilhas/widgets/StarBuilderWidget';
// ...
export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {
  conteudo: ConteudoWidget,
  checklist: ChecklistWidget,
  matriz: MatrizWidget,
  plano_acao: PlanoAcaoWidget,
  banco_perguntas: BancoPerguntasWidget,
  star_builder: StarBuilderWidget,
};
```

- [ ] **Step 4: Commit**

```bash
npx tsc --noEmit
git add src/components/trilhas/widgets/StarBuilderWidget.tsx src/app/api/exportar-star/route.ts src/lib/trilhas/widgets-registry.ts
git commit -m "feat(P3): StarBuilderWidget + PDF export endpoint"
```

---

## Task 19: Conteúdo da Trilha "Preparação para Entrevistas" (US-027)

**Files:**
- Modify: `src/lib/trilhas/content.ts`

- [ ] **Step 1: Preencher etapas de `trilhaPreparacaoEntrevistas`**

```ts
etapas: [
  {
    slug: 'mapeamento-intro',
    titulo: 'Como mapear um processo seletivo',
    descricao: 'Antes de treinar respostas, entenda o processo e o papel',
    tipo: 'conteudo',
    config: {
      markdown: `
## Antes de treinar respostas, entenda o alvo

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

Na próxima etapa tem um checklist para você atacar isso de forma estruturada.
`.trim(),
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
      perguntas: '$PERGUNTAS_PLACEHOLDER$', // substituído logo abaixo
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
```

- [ ] **Step 2: Substituir placeholder de perguntas**

No topo de `src/lib/trilhas/content.ts`, adicionar import:

```ts
import { PERGUNTAS_ENTREVISTA } from './perguntas';
```

E na etapa `banco-perguntas`, substituir `perguntas: '$PERGUNTAS_PLACEHOLDER$'` por:

```ts
perguntas: PERGUNTAS_ENTREVISTA,
```

- [ ] **Step 3: Smoke end-to-end (US-027)**

1. CRM: atribuir "Preparação para Entrevistas" a um mentorado.
2. Portal: abrir a trilha. Completar cada etapa:
   - Mapeamento intro: marcar como lido.
   - Checklist mapeamento: marcar todos.
   - Banco de perguntas: favoritar 5+ perguntas. Concluir.
   - STAR builder: preencher os 4 campos em 5 perguntas. Baixar PDF e verificar conteúdo.
   - Treino: marcar 5 itens, com notas em cada.
   - Checklist final: marcar todos.
3. Verificar trilha aparecer como "Concluída" em `/portal/trilhas`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/trilhas/content.ts
git commit -m "feat(P3): content for trilha preparacao-entrevistas (US-027)"
```

---

## Task 20: Auditoria final (RLS + idempotência + ordem) e polimento

**Files:** nenhum (só verificações)

- [ ] **Step 1: Teste RLS manual**

No Supabase SQL Editor, criar 2 mentorados de teste (M_A e M_B) com trilhas atribuídas a cada. Logar como M_A no portal e tentar consultar trilha/resposta de M_B via JS no console:

```js
const { createClient } = supabase; // usa o client SSR do portal, loggado como M_A
// tentar ler trilha de M_B
const { data, error } = await supabase.from('mentorado_trilhas').select('*').eq('mentorado_id', 'UUID_DO_M_B');
// expected: data vazio, error null (RLS filtra, não estoura)
```

Alternativa mais simples: no SQL Editor, fazer um `SELECT` com `set_config('role', 'authenticated')` e `set_config('request.jwt.claims', ...)` simulando M_A. Confirmar que `mentorado_trilhas` e `etapa_respostas` só retornam linhas de M_A.

- [ ] **Step 2: Idempotência do plano de ação**

1. Completar o fluxo do plano de ação na trilha "Mapa de Competências".
2. Verificar `SELECT count(*) FROM tarefas WHERE origem LIKE 'trilha:%'` — deve ser 3.
3. Tentar chamar novamente o RPC via SQL Editor:

```sql
SELECT submit_plano_acao(
  (SELECT id FROM mentorado_trilhas WHERE trilha_slug='mapa-competencias' LIMIT 1),
  'plano-acao',
  'trilha:mapa-competencias:plano-acao',
  '[{"competencia_id":"discovery","descricao":"teste","prazo":"2026-05-01"}]'::jsonb
);
```

Expected: erro `plano_acao_ja_submetido`.

Verificar novamente: `SELECT count(*) FROM tarefas WHERE origem LIKE 'trilha:%'` — ainda 3 (não duplicou).

- [ ] **Step 3: Verificar completed_at da trilha**

Após todas etapas `done`, verificar em SQL:

```sql
SELECT trilha_slug, started_at, completed_at FROM mentorado_trilhas;
```

Expected: linha da trilha mostrada com `completed_at` não nulo. Na UI, `/portal/trilhas` mostra na seção "Concluídas".

- [ ] **Step 4: Ordem visual no dashboard**

Logar no portal com trilha em andamento. Verificar `/portal/dashboard`:
- Card "Trilha em andamento" aparece.
- Posição: abaixo do card de sessões, acima do card de tarefas. Ajustar no JSX se necessário.

- [ ] **Step 5: Teste de desatribuição**

CRM: para um mentorado com trilha **não iniciada**, remover → sucesso.
Para um com trilha **iniciada**, tentar remover → erro `trilha_ja_iniciada`.

- [ ] **Step 6: Typecheck + lint final**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero erros novos.

- [ ] **Step 7: Commit final de polimento (se houver ajustes)**

Se tiver feito ajustes nas verificações:

```bash
git add -A
git commit -m "fix(P3): small polish after full smoke"
```

Caso contrário, pular o commit.

- [ ] **Step 8: Push da branch**

```bash
git push -u origin imwra/p3-portal-brainstorm
```

---

## Checklist de spec coverage (self-review)

Mapeamento das seções do spec → tasks:

| Spec | Tasks |
|---|---|
| Modelo de dados (tables + RLS + RPC) | Task 1 |
| Tipos TypeScript | Task 2 |
| Zod schemas por tipo | Task 3 |
| Content em código (scaffold) | Task 4 |
| Server actions (assign, start, save, complete, plano_acao) | Task 5 (+ Task 13 para CRM assign) |
| Queries read-side | Task 6 |
| `/portal/trilhas` | Task 7 |
| `/portal/trilhas/[slug]` | Task 8 |
| `/portal/trilhas/[slug]/[etapa_slug]` + registry | Task 9 |
| Widget `conteudo` (+ markdown renderer) | Task 10 |
| Widget `checklist` | Task 11 |
| Dashboard widget | Task 12 |
| CRM "Atribuir trilha" | Task 13 |
| Widget `matriz` (avaliacao + gap) | Task 14 |
| Widget `plano_acao` (+ RPC call) | Task 15 |
| Conteúdo "Mapa de Competências" + matrizes | Task 16 |
| Widget `banco_perguntas` + seed | Task 17 |
| Widget `star_builder` + PDF | Task 18 |
| Conteúdo "Preparação para Entrevistas" | Task 19 |
| RLS audit, idempotência, ordem, desatribuição, push | Task 20 |

Todas as seções do spec têm pelo menos uma task.

**Escopo coberto:** US-026, US-027, US-028. US-021, US-022, US-024 ficam para um plano separado.

**Observação sobre conteúdo:** os descritores das matrizes (Task 16) e o banco de perguntas (Task 17) são primeiras versões curadas para destravar engenharia. A mentora deve revisar e editar depois. Flagar no PR.
