# Decisions

Registro cronológico de decisões técnicas, arquiteturais e de produto tomadas durante as sessões. Cada entrada deve incluir a data, o contexto e a justificativa.

## Formato

```
## YYYY-MM-DD — Título curto da decisão
**Contexto:** o que estava em jogo.
**Decisão:** o que foi escolhido.
**Motivo:** por que essa opção (e não as alternativas).
**Consequências:** impactos previstos, trade-offs, itens a revisitar.
```

## Histórico

<!-- Novas decisões são adicionadas abaixo, em ordem cronológica inversa (mais recente primeiro). -->

## 2026-04-23 — Dashboard de tarefas de agentes em `/agents`
**Contexto:** Necessidade de monitorar em tempo real o estado de tarefas atribuídas a agentes, sem reload da página, com estética escura/minimalista. A app raiz já tinha Next.js 16 + `@supabase/ssr` wirados; o `mentoria-crm` é um CRM separado com visual claro e outra responsabilidade.
**Decisão:** Criado (a) migration `supabase/migrations/20260423180000_todos.sql` — nova tabela `todos(id, title, status, priority, assigned_agent, created_at, updated_at)` com trigger de `updated_at`, publicada em `supabase_realtime`, RLS ligado com policy SELECT permissiva; (b) rota `/agents` no app raiz em arquitetura Server + Client: `page.tsx` (Server Component) faz o fetch inicial com `createClient()` server-side; `TodosDashboard.tsx` (`'use client'`) recebe o estado inicial por props e assina `postgres_changes` na tabela via `supabase.channel(...).on('postgres_changes', ...)`; (c) tipos em `src/types/todo.ts`.
**Motivo:** Hidratação SSR elimina flash de "carregando" e paga o primeiro render com dados reais; subscription de websocket em cliente mantém a UI viva a partir daí. Manter o dashboard no app raiz (e não no `mentoria-crm`) preserva a separação de responsabilidades — CRM é negócio, `/agents` é infra interna. RLS + policy só de SELECT permite que o painel consuma pela anon key sem expor mutations (que ficam para o service_role usado pelos agentes).
**Consequências:** O deploy precisa aplicar a migration via `supabase db push` (não faz sozinho). A policy atual é permissiva para leitura — se o dashboard passar a ter dados sensíveis, trocar por uma policy baseada em `auth.uid()` ou mover o fetch inicial para um API route autenticado. Não há (ainda) UI para mutations: agentes atualizam via service_role no backend, como o prompt especifica.

## 2026-04-23 — Briefing matutino via Claude Code headless + Slack webhook
**Contexto:** Necessidade de receber, toda manhã às 8h, um resumo do que estava em andamento e as 3 prioridades do dia, derivado de `memory/*.md` + `todos/active.md`.
**Decisão:** Criado `todos/active.md` (template em português com seções "Em andamento", "Aguardando ação externa", "Anotações rápidas do dia"), `bin/morning-briefing.sh` que carrega `.env`, chama `claude -p "…" --permission-mode acceptEdits --output-format text` com prompt contratualizado e posta o texto resultante no Slack via `SLACK_WEBHOOK_URL`. Documentação em `bin/morning-briefing.README.md` cobre dois caminhos de agendamento: `/schedule "daily at 08:00 America/Sao_Paulo"` (preferido) ou cron de sistema como fallback. `.env.example` adicionado; `.env` já estava em `.gitignore`.
**Motivo:** Separar geração (Claude headless, que lê arquivos e pensa) de entrega (curl simples) deixa cada parte substituível — trocar Slack por outro transporte é mexer em poucas linhas. Guardar o prompt no script (não em config) permite versionar e revisar o contrato do briefing como código. Cron como fallback garante que o briefing funciona mesmo se os Scheduled Tasks do Claude Code mudarem de API.
**Consequências:** Depende de `claude setup-token` estar feito para rodar sem TTY; sem isso, o script trava pedindo login. O agendamento em si não é criado pelo script — o usuário precisa rodar `/schedule ...` ou adicionar o crontab manualmente (tentei documentar ambos). O log default do cron vai para `/tmp/morning-briefing.log` — se a conta do cron não tiver permissão lá, ajustar.

## 2026-04-23 — Personalidade derivada de padrões em `memory/`
**Contexto:** Sem um arquivo dedicado, minha voz, cadência e critérios de decisão ficavam implícitos e variavam entre sessões. O usuário pediu uma personalidade baseada unicamente nos padrões observáveis em `memory/` e nos arquivos de instrução do projeto.
**Decisão:** Criado `memory/personality.md` descrevendo como penso, comunico e decido. `CLAUDE.md` passa a listá-lo primeiro entre os arquivos de memória, com a nota de que `preferences.md` tem precedência em caso de conflito. `.claude/hooks/load-memory.sh` injeta `personality.md` no `additionalContext` do `SessionStart` antes dos demais.
**Motivo:** Personalidade estável precisa ser documento versionado, não apenas hábito do assistente — garante consistência entre sessões e permite revisão humana. Separá-la de `preferences.md` distingue inferências de padrões (personality) de preferências explicitadas pelo usuário (preferences), com precedência clara para as últimas.
**Consequências:** Toda sessão agora carrega tokens adicionais de `personality.md` no boot; se padrões do projeto mudarem sem atualizar este arquivo, ele se torna fonte de ruído — por isso o próprio `personality.md` instrui a atualizar quando contradito por uma decisão nova.

## 2026-04-23 — Sistema de memória persistente com hooks
**Contexto:** Assistentes Claude Code perdiam contexto durável entre sessões (preferências, decisões, pessoas, fatos sobre o usuário).
**Decisão:** Criado diretório `memory/` com `user.md`, `preferences.md`, `people.md`, `decisions.md`; `CLAUDE.md` instrui a lê-los no início de cada sessão; `.claude/settings.json` registra um hook `SessionStart` (`load-memory.sh` injeta os arquivos como `additionalContext`) e um hook `Stop` (`update-memory.sh` bloqueia uma vez por turno com `decision: block` lembrando de atualizar a memória, respeitando `stop_hook_active` para evitar loops).
**Motivo:** Fluxo declarativo (arquivos versionados) + reforço automático via hooks é mais confiável que depender só de instruções textuais; separar por categoria evita um único arquivo monolítico e permite edições atômicas.
**Consequências:** Cada sessão paga o custo de tokens dos `memory/*.md` no startup; o Stop hook pode adicionar um turno extra quando não há nada durável a registrar (Claude precisa reconhecer explicitamente e parar de novo); arquivos `memory/` estão versionados no git, então informações sensíveis sobre o usuário não devem ser colocadas lá sem ponderar.
