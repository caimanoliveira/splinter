#!/usr/bin/env bash
# Morning briefing: generates a daily stand-up from memory/*.md and
# todos/active.md via Claude Code (non-interactive), then posts it to
# Slack via the incoming webhook stored in .env as SLACK_WEBHOOK_URL.
#
# Intended to be invoked by a scheduled task (see docs/morning-briefing.md).
# Safe to run ad-hoc; prints the briefing to stdout whether or not Slack
# delivery succeeds.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$PROJECT_DIR"

# Load .env if present. Lines starting with # or blank are ignored.
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
  echo "error: SLACK_WEBHOOK_URL not set (check .env)" >&2
  exit 1
fi

PROMPT=$(cat <<'EOF'
You are producing my daily morning briefing. Follow this contract exactly.

Inputs to read (ignore any that are missing, do not invent content):
- All files under memory/ (personality.md, user.md, preferences.md, people.md, decisions.md)
- todos/active.md

Produce a Slack-friendly message in Portuguese with this structure:

*Bom dia — briefing de <DATA_ISO>*

*O que estava rolando*
<1-3 frases resumindo em que o usuário estava trabalhando, inferindo de todos/active.md (seção "Em andamento") e das entradas mais recentes em memory/decisions.md>

*Top 3 prioridades hoje*
1. <prioridade>
2. <prioridade>
3. <prioridade>

*Bloqueios / aguardando*
<bullets curtos da seção "Aguardando ação externa" de todos/active.md, ou "nenhum" se vazia>

Regras:
- Use <DATA_ISO> = data de hoje no formato YYYY-MM-DD (fuso America/Sao_Paulo).
- Priorize com base no que está "Em andamento" + consequências pendentes em decisions.md recentes + itens aguardando ação externa que destravariam trabalho.
- No máximo ~1500 caracteres no total. Nada de preâmbulo ou "aqui está o briefing"; imprima só a mensagem.
- Emita o texto puro em stdout. Não escreva em arquivos. Não rode git. Não peça confirmação.
EOF
)

BRIEFING=$(claude \
  -p "$PROMPT" \
  --permission-mode acceptEdits \
  --output-format text 2>/dev/null)

if [[ -z "$BRIEFING" ]]; then
  echo "error: empty briefing from claude" >&2
  exit 1
fi

echo "$BRIEFING"
echo ""
echo "--- posting to Slack ---" >&2

payload=$(python3 -c '
import json, sys
print(json.dumps({"text": sys.stdin.read()}))
' <<<"$BRIEFING")

http_status=$(curl -sS -o /tmp/morning-briefing-slack.out -w "%{http_code}" \
  -X POST -H "Content-Type: application/json" \
  --data "$payload" \
  "$SLACK_WEBHOOK_URL")

if [[ "$http_status" != "200" ]]; then
  echo "error: slack returned $http_status: $(cat /tmp/morning-briefing-slack.out)" >&2
  exit 1
fi

echo "delivered to Slack" >&2
