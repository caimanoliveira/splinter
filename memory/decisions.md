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
