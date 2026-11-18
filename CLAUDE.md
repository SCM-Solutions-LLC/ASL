# ASL

Shorts pipeline lives in `henry-short/` (see its README).

- Before writing or changing any script, topic or metadata, read `henry-short/GUARDRAILS.md` and follow it. When a rule cannot be met, stop and ask.
- Environment: `cd henry-short && npm run setup` (pinned Python 3.12 venv + `npm ci`). Run Python tools through `npm run tts` / `npm run sfx`, never a system `python3`.
