---
name: fact-check
description: Run the independent fact-check pass (GUARDRAILS A7) on a voice-over script in henry-short/ and write factcheck/<vo>.json. Use after writing or changing any script/<vo>.txt or on-screen label, and before a short is shown for approval.
---

# Fact-check a voice-over

GUARDRAILS A7: the script's author does not sign off its own facts. So the checking is done by a
**fresh agent that has never seen the script being written**. You orchestrate; it judges.

Run from `henry-short/`. Argument: the VO slug (`script/<vo>.txt`).

## 1. Gather the inputs, nothing else

- `sha256sum script/<vo>.txt`: the report is stamped with this.
- The on-screen text of every short cut from this VO (A6: visuals are claims too). Find the shorts with
  `grep -l "<vo>.alignment.json" src/shorts/*/index.tsx`, then pull every `text=`/`sub=` string and any
  other number or label drawn on screen from those files.

## 2. Spawn the checker

Use the Agent tool (general-purpose). The prompt contains **only**: the path to `script/<vo>.txt`, the
list of on-screen strings, the path to `GUARDRAILS.md` (section A), the sha256, and the report schema
below. Do **not** pass the authoring conversation, which claims you think are weak, or how you would
rule. Anything you add anchors it, and an anchored checker confirms what it is handed.

Tell it:

- List every factual claim, spoken or on screen: numbers, dates, names, causal statements, and what
  the hook implies to a viewer who swipes away at second two (A4).
- For each, open the **cited source itself** (DOI, ADS bibcode, NASA/NIST/IAU page, primary document)
  and check the figure, and that the script's wording says what the source says (A3). A Wikipedia
  page, a blog or a secondary report of a paper does not confirm anything (A2).
- Verdicts: `confirmed` (read the source, it supports the wording as spoken), `fix` (the source
  contradicts, or the wording overstates it; say what to change), `unverified` (could not reach a
  source that meets A2). Only `confirmed` passes; when in doubt, it is not `confirmed`.
- Write `factcheck/<vo>.json`:

```json
{
  "script": "script/<vo>.txt",
  "sha256": "<sha256 of the script file>",
  "checked": "<YYYY-MM-DD>",
  "claims": [
    { "n": 1, "claim": "<as spoken or shown>", "where": "spoken | on-screen: <label>",
      "verdict": "confirmed | fix | unverified",
      "source_checked": "<what was actually opened: URL, DOI, bibcode>",
      "note": "<why; for fix, the change needed>" }
  ]
}
```

## 3. Gate, and fix

- `node tools/check-factcheck.mjs <vo>` must pass; `npm run publishable` runs it for every VO.
- A `fix` or `unverified` is fixed in the script, its SOURCES block or the on-screen label, never by
  editing the report. Fixing the script changes its hash, so the whole pass runs again with a fresh
  agent. Re-recording the VO afterwards (`npm run tts`) moves word timings; re-check the beats with
  `npm run sheet`.
- If a claim cannot be sourced to A2's standard, stop and ask the owner (F4).
