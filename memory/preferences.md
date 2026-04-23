# Preferences

Preferências de trabalho do usuário: estilo de código, convenções, ferramentas favoritas, formato de resposta desejado. O assistente deve respeitar essas preferências em todas as sessões.

## Código
<!-- Linguagens, formatadores, padrões de nomenclatura, testes preferidos. -->

- **Testes E2E em volume.** Estratégia principal de teste é bateria grande de end-to-end. Prefiro cobertura de regressão real a mar de unit tests com mocks.

## Comunicação
<!-- Idioma, tom, nível de detalhe, uso de emojis, formato de resumos. -->

## Fluxo de trabalho
<!-- Git workflow, política de commits, uso de branches, PRs. -->

### Tamanho de tarefa

- **Toda tarefa é pequena.** Se parece grande, ainda não foi decomposta o suficiente. "Spec-driven é bom pra tarefas grandes" não é argumento — a resposta é quebrar até ficarem pequenas.

### Briefing do agente

- **Contexto vai no card, não em spec separado.** O card da task deve carregar os *entrypoints* que o agente executor precisa (arquivos, funções, guardrails). Evito spec-driven development em favor de **contexto no card + guidelines**.
- **Guidelines > CLAUDE.md.** Prefiro guidelines (aplicadas on-demand, opcionais) a instruções em `CLAUDE.md` (sempre carregadas). Guidelines pesam menos no contexto e só entram em cena quando relevantes.

### Review loop

- **AI revisa PRs com guidelines** (remoto — serviço tipo ultrareview/cloud review).
- **Auto-review + auto-fix.** No loop de PR a IA não só aponta problemas; já sugere/aplica o patch.

### Automação do repetitivo

- **Commands para qualquer coisa repetitiva.** Padroniza execução e economiza tempo. Regra prática: se vou fazer duas vezes, viro command.

## Ferramentas
<!-- Editores, shells, CLIs, serviços preferidos. -->

### MCP servers

- **Stack atual:** GitHub, Linear, no máximo Slack.
- **Teto é real.** Exagerar em MCPs estoura contexto — "se exagerar vai falir". Adicionar MCP novo é decisão deliberada (pesa custo), não reflexo.

### Skills vs Commands

- **Prefiro Commands a Skills soltas** (ou a Skills + Commands). Commands são manuais e controlados — executo quando quero, com o contexto que quero. Skills que auto-ativam perdem esse controle.
