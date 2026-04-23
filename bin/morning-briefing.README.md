# Morning briefing

`bin/morning-briefing.sh` gera um briefing matutino a partir de `memory/*.md` + `todos/active.md` e posta no Slack via webhook.

## Setup único

1. **Crie o webhook do Slack.** Em https://api.slack.com/apps, escolha o app que vai entregar o briefing → **Incoming Webhooks** → **Add New Webhook to Workspace** → aponte para a DM ou canal desejado. Copie a URL gerada.
2. **Copie o arquivo de exemplo** e preencha o webhook:
   ```bash
   cp .env.example .env
   # edite .env e defina SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```
   `.env` já está em `.gitignore`; nunca commite.
3. **Autentique o Claude Code em modo headless** (só precisa fazer uma vez):
   ```bash
   claude setup-token
   ```

## Validar antes de agendar

Rode manualmente e veja se o texto sai em stdout e chega no Slack:

```bash
./bin/morning-briefing.sh
```

Se o stdout vier vazio, cheque `claude --version` e rode com `--debug` para ver o erro da CLI. Se o Slack retornar não-200, valide a URL do webhook.

## Agendar — opção A: Claude Code Scheduled Task (recomendado)

Dentro de uma sessão do Claude Code interativa, rode:

```
/schedule "daily at 08:00 America/Sao_Paulo" bash bin/morning-briefing.sh
```

Isso registra a rotina nos Scheduled Tasks do Claude Code. Use `/schedule list` para inspecionar e `/schedule remove <id>` para desativar. A rotina roda mesmo com a sessão fechada, na infra local ou em nuvem, dependendo do backend configurado.

## Agendar — opção B: cron de sistema (fallback)

Se preferir não usar os Scheduled Tasks do Claude Code:

```cron
0 8 * * * cd /caminho/absoluto/para/splinter && ./bin/morning-briefing.sh >> /tmp/morning-briefing.log 2>&1
```

Observações:
- Use caminho absoluto. O cron não herda seu `$PATH` normal — adicione `PATH=/usr/local/bin:/usr/bin:/bin` no topo do crontab se `claude` não for encontrado.
- A autenticação do `claude` via `setup-token` persiste entre invocações headless.
- O log em `/tmp/morning-briefing.log` ajuda a diagnosticar falhas silenciosas.

## O que o briefing contém

O prompt enviado ao Claude Code produz (em português):

- **O que estava rolando** — 1–3 frases inferindo de `todos/active.md` (seção "Em andamento") e das entradas recentes em `memory/decisions.md`.
- **Top 3 prioridades hoje** — derivadas do que está em andamento + bloqueios a destravar.
- **Bloqueios / aguardando** — bullets da seção "Aguardando ação externa" de `todos/active.md`.

O limite de ~1500 caracteres garante que cabe numa mensagem do Slack sem truncamento.
