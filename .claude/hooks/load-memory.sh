#!/usr/bin/env bash
# SessionStart hook: injects the contents of memory/*.md into the session
# context so Claude begins every session aware of durable state.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MEMORY_DIR="$PROJECT_DIR/memory"

if [[ ! -d "$MEMORY_DIR" ]]; then
  exit 0
fi

context=""
for file in user.md preferences.md people.md decisions.md; do
  path="$MEMORY_DIR/$file"
  if [[ -f "$path" ]]; then
    context+="=== memory/$file ==="$'\n'
    context+="$(cat "$path")"$'\n\n'
  fi
done

if [[ -z "$context" ]]; then
  exit 0
fi

python3 -c '
import json, sys
ctx = sys.stdin.read()
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": "Persistent memory loaded from memory/ directory:\n\n" + ctx,
    }
}))
' <<<"$context"
