#!/usr/bin/env bash
# Stop hook: reminds Claude once per turn to review the conversation and
# update memory/*.md with any new durable information (decisions, people,
# preferences, user facts) before ending the turn.
#
# Uses stop_hook_active from stdin to avoid infinite loops: if Claude is
# already continuing because this hook blocked, we exit 0 and let it stop.

set -euo pipefail

payload="$(cat)"

stop_hook_active="$(python3 -c '
import json, sys
try:
    data = json.loads(sys.stdin.read() or "{}")
except Exception:
    data = {}
print("true" if data.get("stop_hook_active") else "false")
' <<<"$payload")"

if [[ "$stop_hook_active" == "true" ]]; then
  exit 0
fi

python3 -c '
import json
print(json.dumps({
    "decision": "block",
    "reason": (
        "Before ending this turn, review the conversation for durable "
        "information that should persist across sessions and update the "
        "corresponding file in memory/: new decisions -> decisions.md, "
        "new people -> people.md, stated preferences -> preferences.md, "
        "stable facts about the user -> user.md. If nothing durable "
        "surfaced this turn, acknowledge that and stop again."
    ),
}))
'
