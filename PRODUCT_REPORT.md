# Product Report: Mentoria Carreira & Decisão
**Análise de Produto · Abril 2026**

---

## 1. Visão Geral do Produto

O produto é composto por três camadas integradas:

| Camada | Propósito | Stack |
|--------|-----------|-------|
| **Landing Site** | Conversão de visitantes em leads | Next.js + Tailwind |
| **Portal do Mentorado** | Experiência pós-venda do cliente | Next.js + Supabase RLS |
| **CRM Interno** | Operação do negócio pelo mentor | Next.js + Supabase |

**Proposta de valor central:** A metodologia Decision Canvas — um framework de 7 dimensões que ajuda profissionais qualificados a sair da paralisia decisória em transições de carreira.

---

## 2. Pontos Fortes

- **Metodologia diferenciada:** O Decision Canvas é o ativo central do produto. Bem articulado, com nomenclatura consistente em toda a jornada.
- **RLS bem implementado:** Cada mentorado acessa apenas seus próprios dados. Segurança sólida por padrão.
- **CRM + Portal integrados:** A criação do mentorado no CRM pode ser vinculada ao acesso no portal — arquitetura coerente.
- **Check-ins assíncronos:** Solução inteligente para manter continuidade entre sessões sem demandar tempo do mentor.
- **Histórico de canvas versionado:** Permite ao mentorado e mentor comparar evolução do pensamento.

---

## 3. Preocupações e Riscos

### 3.1 Produto

| # | Preocupação | Severidade |
|---|-------------|-----------|
| P | Não há onboarding guiado: o mentorado chega no portal sem saber por onde começar | Alta |
| P | O canvas não tem orientação contextual por dimensão (só placeholder de texto) — risco de qualidade baixa nos preenchimentos | Alta |
| P | Sem notificações: o mentorado não recebe alertas de tarefa vencida, novo material ou sessão próxima | Alta |
| P | Métricas de "Clareza" e "Confiança" no check-in não são explicadas ao mentorado — o que significa um 7 vs 8? | Média |
| P | A avaliação de competências tem 10 competências fixas, mas nenhuma é adaptada ao perfil do mentorado | Média |
| P | O portal não tem página de perfil: o mentorado não sabe qual produto comprou, quantas sessões tem, ou até quando vai | Alta |
| P | Nenhuma forma de o mentorado solicitar suporte, reagendar sessão ou mandar mensagem ao mentor | Alta |

### 3.2 UX / Interface

| # | Problema | Impacto |
|---|----------|---------|
| UX | Login-only com email+senha — sem "esqueci minha senha" implementado no portal | Bloqueante |
| UX | Mobile: a bottom nav tem 5 ícones sem label — difícil distinguir sem familiaridade | Alto |
| UX | Dashboard vazio no primeiro acesso (sem dados) — estado "zero state" não tratado | Alto |
| UX | Canvas: textarea livre para 7 dimensões complexas — não há exemplo, dica expandida ou referência | Alto |
| UX | Check-in enviado com sucesso mas volta ao formulário em branco — falta contexto do último envio ao abrir | Médio |
| UX | Materiais: layout 2-col com cards iguais — sem filtro por tipo, sem busca | Médio |
| UX | Marcos (milestones) no dashboard não são editáveis pelo mentor via CRM — criados na migration como dados fixos | Alto |
| UX | Sem feedback visual de carregamento em ações (salvar canvas, enviar check-in) | Médio |
| UX | Avaliação de competências: não há gráfico radar ou linha do tempo visual para ver evolução | Médio |

### 3.3 Técnico / Operacional

| # | Risco | Severidade |
|---|-------|-----------|
| T | O mentor cria usuários manualmente no Supabase Auth — processo não automatizado, propenso a erro | Alta |
| T | Nenhum email transacional configurado (boas-vindas, reset de senha, sessão confirmada) | Alta |
| T | `proxy.ts` redireciona para `/portal/login` mas não preserva corretamente o `?next=` em todos os fluxos | Média |
| T | O CRM e o portal usam o mesmo Supabase project — um bug de permissão em RLS pode expor dados cruzados | Alta |
| T | Sem ambiente de staging documentado — migrações vão direto para produção | Alta |
| T | `src/proxy.ts` usa `supabase-server.ts` mas o client é recriado a cada request sem cache | Média |

### 3.4 Negócio

| # | Risco | Impacto |
|---|-------|---------|
| N | O portal não reflete qual produto o mentorado comprou (Check-up vs. Travessia vs. Grupo) — mesma experiência para todos | Alto |
| N | Sem mecanismo de renovação: quando o ciclo Travessia termina, não há oferta de continuidade no produto | Alto |
| N | Grupo ("Decisões em Contexto") não tem área dedicada no portal — clientes do grupo não têm where to go | Alto |
| N | Sem NPS ou mecanismo de feedback estruturado do mentorado ao mentor | Médio |

---

## 4. Roadmap Proposto

### Critérios de Priorização
- **P0 — Bloqueante:** Impede uso básico ou gera risco de segurança/operação
- **P1 — Core Value:** Entrega a proposta de valor prometida ao mentorado
- **P2 — Growth:** Diferenciação, retenção e expansão do negócio

---

## SPRINT P0 — Fundação Operacional
**Objetivo:** Tornar o produto usável sem atrito para os primeiros mentorados reais.
**Prazo sugerido:** 2 semanas

---

### US-001 · Recuperação de senha no portal
**Como** mentorado que esqueceu minha senha,
**Quero** clicar em "Esqueci minha senha" e receber um email de reset,
**Para que** eu não precise pedir ajuda ao mentor para acessar o portal.

**Critérios de aceite:**
- [ ] Link "Esqueci minha senha" visível na tela de login
- [ ] Supabase Auth envia email de reset com link válido por 1h
- [ ] Após reset, usuário é redirecionado para o portal logado

---

### US-002 · Onboarding guiado no primeiro acesso
**Como** mentorado que acabou de receber meu acesso,
**Quero** ser guiado pelos primeiros passos do portal,
**Para que** eu entenda o que fazer sem precisar perguntar ao mentor.

**Critérios de aceite:**
- [ ] Se `checkins.count = 0` e `canvas.count = 0`, exibir banner/modal de boas-vindas
- [ ] Sequência: (1) Preencher Canvas → (2) Fazer primeiro check-in → (3) Ver materiais
- [ ] Cada passo marcado como completo após ação
- [ ] Pode ser dispensado ("já entendi")

---

### US-003 · Página de perfil do mentorado
**Como** mentorado,
**Quero** ver meu produto, número de sessões contratadas e datas do ciclo,
**Para que** eu saiba exatamente o que incluí na minha mentoria.

**Critérios de aceite:**
- [ ] Nova página `/portal/perfil` ou modal acessível pelo header
- [ ] Exibe: Nome, email, produto contratado, sessões realizadas / total, data de início, status (ativo/concluído)
- [ ] Dados vindos da tabela `mentorados`

---

### US-004 · Zero state no dashboard
**Como** mentorado no primeiro acesso,
**Quero** ver uma dashboard que me orienta mesmo sem dados,
**Para que** eu não me sinta perdido diante de uma tela vazia.

**Critérios de aceite:**
- [ ] Card "Próximas Tarefas" sem dados exibe CTA para o mentor criar a primeira tarefa (com WhatsApp link)
- [ ] Card "Última Sessão" sem dados exibe mensagem "Sua primeira sessão aparecerá aqui"
- [ ] Clareza/Confiança sem check-ins exibem "—" ao invés de "0"
- [ ] Canvas sem dados exibe CTA "Criar meu primeiro canvas"

---

### US-005 · Automação de criação de acesso do mentorado (CRM → Portal)
**Como** mentor que fechou um novo cliente,
**Quero** clicar em "Criar acesso no portal" dentro do perfil do mentorado no CRM,
**Para que** o mentorado receba automaticamente um email de boas-vindas com seu acesso.

**Critérios de aceite:**
- [ ] Botão "Criar acesso portal" no detalhe do mentorado no CRM
- [ ] Cria usuário no Supabase Auth com email do mentorado
- [ ] Envia email com link de "definir senha" (magic link ou invite)
- [ ] Status do mentorado atualizado para "acesso criado"
- [ ] Mentor vê confirmação de que email foi enviado

---

### US-006 · Email de boas-vindas ao mentorado
**Como** mentorado que acabou de ter meu acesso criado,
**Quero** receber um email de boas-vindas com meu link de acesso e o que esperar,
**Para que** eu me sinta acolhido e saiba como começar.

**Critérios de aceite:**
- [ ] Email enviado automaticamente quando acesso é criado
- [ ] Conteúdo: Saudação personalizada, link para o portal, próximo passo (criar canvas)
- [ ] Tom alinhado à voz do mentor (direto, sem floreio)

---

## SPRINT P1 — Entrega da Proposta de Valor
**Objetivo:** Fazer o mentorado sentir que o portal vale o investimento.
**Prazo sugerido:** 4 semanas

---

### US-007 · Canvas com orientação contextual por dimensão
**Como** mentorado preenchendo meu Decision Canvas,
**Quero** ver exemplos e perguntas-guia para cada uma das 7 dimensões,
**Para que** eu preencha com qualidade e não em branco.

**Critérios de aceite:**
- [ ] Cada dimensão tem ícone de "?" que expande um painel lateral
- [ ] Painel contém: definição da dimensão, 2-3 perguntas ativadoras, exemplo real anonimizado
- [ ] Painel fecha sem perder texto já digitado
- [ ] Conteúdo definido pelo mentor (configurável via CRM ou hardcoded inicialmente)

---

### US-008 · Notificações in-app e por email
**Como** mentorado,
**Quero** ser notificado quando uma nova tarefa for criada, um material for liberado ou uma sessão for agendada,
**Para que** eu não precise entrar no portal todo dia para verificar.

**Critérios de aceite:**
- [ ] Email enviado quando: nova tarefa criada, material liberado, sessão registrada
- [ ] Notificação in-app: badge no ícone da nav com contagem de itens novos
- [ ] Mentorado pode marcar como "lido" in-app
- [ ] Configuração básica de preferência: email sim/não

---

### US-009 · Linha do tempo de evolução na avaliação de competências
**Como** mentorado que fez múltiplas avaliações,
**Quero** ver um gráfico mostrando como minhas competências evoluíram ao longo do tempo,
**Para que** eu perceba meu progresso e me sinta motivado a continuar.

**Critérios de aceite:**
- [ ] Gráfico de linhas mostrando score de cada competência por data de avaliação
- [ ] Alternativa: gráfico radar comparando primeira vs. última avaliação
- [ ] Visível na página `/avaliacao` após 2+ avaliações
- [ ] Mentor também vê esse gráfico no detalhe do mentorado no CRM

---

### US-010 · Marcos personalizáveis pelo mentor
**Como** mentor,
**Quero** criar e editar marcos personalizados para cada mentorado no CRM,
**Para que** a jornada de cada um reflita seu ciclo específico (não marcos genéricos).

**Critérios de aceite:**
- [ ] No detalhe do mentorado no CRM: seção "Marcos" com botão "Adicionar marco"
- [ ] Campos: título, descrição, ordem
- [ ] Mentor pode marcar marco como "atingido" com data
- [ ] Portal exibe marcos atualizados em tempo real
- [ ] Marcos padrão removidos do seed/migration

---

### US-011 · Canal de comunicação mentorado → mentor
**Como** mentorado com uma dúvida entre sessões,
**Quero** enviar uma mensagem rápida ao mentor pelo portal,
**Para que** eu não precise caçar o WhatsApp dele ou esperar a próxima sessão.

**Critérios de aceite:**
- [ ] Botão "Falar com mentor" visível no dashboard e no layout
- [ ] Opção 1 (MVP): Abre WhatsApp com mensagem pré-formatada (nome + contexto)
- [ ] Opção 2 (ideal): Campo de texto que gera email para o mentor
- [ ] Mentor recebe email com: nome do mentorado, mensagem, link para o perfil no CRM

---

### US-012 · Diferenciação de experiência por produto
**Como** mentorado do Check-up (sessão única),
**Quero** uma experiência no portal adequada ao que comprei,
**Para que** eu não veja seções de "4 sessões" quando comprei apenas 1.

**Critérios de aceite:**
- [ ] Dashboard adapta texto/barra de progresso baseado em `product_tier` do mentorado
- [ ] Check-up: foco em Canvas + Avaliação inicial, sem seção de tarefas recorrentes
- [ ] Travessia: experiência completa atual
- [ ] Grupo: exibir aviso "Seu portal de grupo está em breve" com link de WhatsApp

---

### US-013 · Busca e filtro na biblioteca de materiais
**Como** mentorado com muitos materiais liberados,
**Quero** filtrar por tipo (PDF, vídeo, template) e buscar por nome,
**Para que** eu encontre rapidamente o que preciso sem rolar a página toda.

**Critérios de aceite:**
- [ ] Campo de busca por título/descrição (client-side, sem nova query)
- [ ] Filtro por tipo: Todos / PDF / Vídeo / Template / Link
- [ ] Badge "Novo" some após o material ser aberto (marca como `seen_at`)
- [ ] Estado vazio com mensagem clara quando filtro não retorna resultados

---

### US-014 · Resumo de sessão notificado ao mentorado
**Como** mentorado após uma sessão,
**Quero** receber o resumo da sessão por email logo após ela ser registrada pelo mentor,
**Para que** eu tenha um registro claro do que decidimos e o que farei a seguir.

**Critérios de aceite:**
- [ ] Quando mentor registra sessão no CRM, dispara email para mentorado
- [ ] Conteúdo: Data, resumo, decisões tomadas, próximos passos
- [ ] Email tem link direto para `/portal/dashboard`
- [ ] Dados vêm da tabela `sessoes`

---

## SPRINT P2 — Crescimento e Retenção
**Objetivo:** Transformar clientes em embaixadores e abrir novos vetores de receita.
**Prazo sugerido:** 6 semanas

---

### US-015 · Portal para programa em grupo ("Decisões em Contexto")
**Como** participante do programa em grupo,
**Quero** acessar uma área dedicada no portal com os materiais, gravações e tarefas do meu grupo,
**Para que** eu tenha um espaço centralizado além do WhatsApp.

**Critérios de aceite:**
- [ ] Nova seção `/portal/grupo` visível apenas para mentorados com `product_tier = 'grupo'`
- [ ] Conteúdo: próximas datas de encontro, materiais do grupo, gravações (link externo)
- [ ] Gestor do grupo pode postar avisos (via CRM)
- [ ] Lista de participantes com fotos (opt-in)

---

### US-016 · NPS e depoimento ao final do ciclo
**Como** mentor,
**Quero** coletar automaticamente o NPS do mentorado quando seu ciclo é concluído,
**Para que** eu tenha dados de satisfação e depoimentos para o site.

**Critérios de aceite:**
- [ ] Quando status do mentorado muda para `completed` no CRM, envia email com NPS (1-10)
- [ ] Após resposta, pergunta: "Gostaria de compartilhar seu depoimento?"
- [ ] Depoimentos aprovados pelo mentor aparecem em `/admin/depoimentos` com opção de publicar
- [ ] Publicados atualizam a seção `Testimonials` do site (via CMS simples ou JSON)

---

### US-017 · Oferta de continuidade ao fim do ciclo Travessia
**Como** mentorado encerrando meu ciclo de 4 sessões,
**Quero** ver uma oferta personalizada de continuidade,
**Para que** eu possa manter o progresso sem precisar recomeçar do zero.

**Critérios de aceite:**
- [ ] Na última semana do ciclo: banner no dashboard "Sua Travessia está chegando ao fim"
- [ ] CTA: "Conversar sobre continuidade" → WhatsApp com contexto pré-formatado
- [ ] Mentor recebe alerta no CRM quando mentorado chega à última sessão
- [ ] Opções apresentadas: novo ciclo Travessia com desconto, entrada no grupo mensal

---

### US-018 · Relatório de progresso exportável (PDF)
**Como** mentorado concluindo minha mentoria,
**Quero** exportar um PDF com meu Decision Canvas, avaliações e marcos atingidos,
**Para que** eu tenha um documento do meu progresso para guardar e compartilhar.

**Critérios de aceite:**
- [ ] Botão "Exportar relatório" no dashboard
- [ ] PDF inclui: Canvas ativo, primeira vs. última avaliação de competências, marcos, resumo das sessões
- [ ] Formatado com identidade visual da mentoria
- [ ] Gerado server-side (ex: Puppeteer ou react-pdf)

---

### US-019 · Dashboard de métricas do mentor (CRM)
**Como** mentor,
**Quero** ver um painel com métricas de engajamento dos meus mentorados,
**Para que** eu identifique quem está em risco de abandono antes que piore.

**Critérios de aceite:**
- [ ] Novo card no CRM: "Saúde dos mentorados"
- [ ] Métricas por mentorado: último check-in, dias sem acessar o portal, tarefas em atraso
- [ ] Alerta visual (vermelho) para mentorados sem atividade há +7 dias
- [ ] Drill-down: clicar leva ao perfil do mentorado

---

### US-020 · Programa de indicação estruturado
**Como** mentorado satisfeito,
**Quero** indicar amigos e colegas e saber que minha indicação foi reconhecida,
**Para que** eu me sinta valorizado por ajudar o mentor a crescer.

**Critérios de aceite:**
- [ ] Página `/portal/indicar` com link personalizado de indicação
- [ ] Link rastreado via Supabase (source = 'referral' + mentorado_id)
- [ ] Quando indicado fecha negócio: mentor é notificado no CRM
- [ ] Benefício ao indicador: definido pelo mentor (sessão extra, desconto, agradecimento público)

---

## 5. Resumo Executivo do Roadmap

```
P0 — FUNDAÇÃO (2 semanas)
├── US-001  Recuperação de senha
├── US-002  Onboarding guiado
├── US-003  Página de perfil do mentorado
├── US-004  Zero state no dashboard
├── US-005  Automação de criação de acesso (CRM → Portal)
└── US-006  Email de boas-vindas

P1 — CORE VALUE (4 semanas)
├── US-007  Canvas com orientação contextual
├── US-008  Notificações in-app e email
├── US-009  Evolução visual nas competências
├── US-010  Marcos personalizáveis pelo mentor
├── US-011  Canal de comunicação mentorado → mentor
├── US-012  Experiência adaptada por produto
├── US-013  Busca e filtro nos materiais
└── US-014  Resumo de sessão enviado ao mentorado

P2 — CRESCIMENTO (6 semanas)
├── US-015  Portal para programa em grupo
├── US-016  NPS e depoimentos automáticos
├── US-017  Oferta de continuidade ao fim do ciclo
├── US-018  Relatório de progresso exportável (PDF)
├── US-019  Dashboard de saúde dos mentorados (CRM)
└── US-020  Programa de indicação estruturado
```

---

## 6. Recomendações Imediatas (antes do P0)

1. **Configurar email transacional agora** — Resend ou SendGrid + domínio verificado. Sem isso, US-001, US-005 e US-006 não funcionam.
2. **Testar fluxo de login com um mentorado real** — O proxy de auth tem edge cases não cobertos.
3. **Documentar processo manual atual** — Antes de automatizar (US-005), mapear o que o mentor faz hoje para não quebrar nada.
4. **Definir as 10 competências da avaliação** — Atualmente são fixas na migration. Devem ser revisadas com o mentor antes de qualquer mentorado preencher.
5. **Criar ambiente de staging** — Migrações indo direto para produção é o maior risco técnico atual.

---

*Relatório gerado por análise de código · Splinter · Abril 2026*
