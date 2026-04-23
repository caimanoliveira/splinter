@AGENTS.md

# Persistent memory

At the start of every session, read all files in the `memory/` directory before doing anything else. They capture durable context that outlives a single conversation:

- @memory/user.md — stable facts about the primary user.
- @memory/preferences.md — coding style, workflow, and communication preferences to honor.
- @memory/people.md — people involved in the project and how to interact with them.
- @memory/decisions.md — technical and product decisions already made; do not relitigate without reason.

When the session produces new durable information in any of those categories (a new decision, a preference the user stated, a person introduced, a stable fact about the user), update the corresponding file before ending the turn. The Stop hook will remind you once per turn if you forget.
