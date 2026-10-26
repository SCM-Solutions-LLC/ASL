# VO and SFX licensing — can this channel publish on ElevenLabs free-plan audio?

Status: **blocker identified, decision pending Saawan.** Last checked 2026-10-26.

## Short answer

No. The audio currently in `public/` cannot ship on a monetised channel, and upgrading
later does not fix the files that already exist — they have to be regenerated on a paid
plan. Budget impact is small (~$5–6/month); the schedule impact is the part worth planning
for, because regenerating the VO invalidates the word timings this edit is built on.

## What was verified, and what was not

The environment's network policy denied `elevenlabs.io`, `help.elevenlabs.io` and
`api.elevenlabs.io`, so **the primary terms were not read.** Everything below is the
consensus of several independent secondary sources (2026 pricing and licensing guides),
which agreed with each other on every point that matters here. Treat it as a strong
prior, not as a citation.

Two primary checks are left for Saawan — about two minutes, inside the account:

1. `elevenlabs.io/pricing` — confirm the cheapest tier granting a commercial licence, and its price.
2. The help-centre article on publishing generated content — confirm (a) that the free plan
   grants no commercial rights, (b) the exact attribution string, and (c) whether a
   commercial licence applies retroactively to files generated while on the free plan.

Point 2c is the one that decides whether the existing audio can be kept. If
ElevenLabs' own wording is ambiguous, assume it does not apply retroactively.

## Findings

- **The free plan carries no commercial licence.** Monetised YouTube plus Instagram,
  Facebook and TikTok posting is commercial use, whether or not a given video has earned
  anything yet.
- **The free plan also requires attribution** — `elevenlabs.io` (or `11.ai`) in the video
  *title*, not the description. Attribution does not convert free output into
  commercially licensed output; it is a condition of the non-commercial grant, not a
  substitute for a licence.
- **The licence attaches to the file at generation time, not to the account.** Sources
  agree that audio generated on the free plan stays non-commercial after an upgrade, and
  all of them recommend regenerating the final audio while a paid plan is active. No
  source found any language granting a retroactive licence.
- **Every paid tier grants a full commercial licence.** The entry tier (Starter) was
  listed at $6/month, or $5/month billed annually — inside the channel's $50/month ceiling
  with room to spare.

## What this means for this repo

Assets generated on the free plan, all of which are affected:

| Asset | Used by |
|---|---|
| `public/vo.wav` | `AnneHolbein`, `AnneCutout` (the whole cut) |
| `public/henry_vo_v3.mp3` | not currently referenced in `src/` |
| `public/sfx/*.wav` (7 files) | `AnneCutout` beat hits |

The non-obvious cost is in the edit, not the audio. `src/words.json` holds absolute
timings measured against one specific render of `vo.wav`, and `SEGMENTS` in `src/edit.ts`
hardcodes source frame ranges into that same render. A regenerated VO — even from an
identical script and voice — will not land on the same frames, so **every `at("word")`
beat in the edit moves.**

That is worth treating as a design finding rather than a one-off chore: the pipeline
couples the edit to a single audio artefact that is going to be regenerated repeatedly,
for licensing now and for every script revision later. Word alignment should be a
regenerable build step keyed to the current VO file, not a hand-committed `words.json`.
This should be folded into the pipeline templating work rather than fixed by re-measuring
the timings by hand.

## Recommendation

1. Take the Starter tier. It is the cheapest thing that makes the problem go away, it is
   well inside budget, and the alternatives cost more than they save — recording your own
   voice costs you time on every one of 3–5 shorts a week, and a self-hosted open-source
   TTS model costs setup plus quality for a licence you can buy for the price of a coffee.
2. Regenerate `vo.wav` and the SFX on the paid plan before anything is published. Do not
   publish on the current files, with or without attribution.
3. Make alignment a build step in the same pass, so regenerating the VO is cheap. Until
   then, treat the current `words.json` as valid only for the existing `vo.wav`.
4. Keep the current audio for style tests. The style tests are not publication, so the
   existing files are fine for deciding looks and timing — which is all they are being
   used for today.
5. Delete `public/henry_vo_v3.mp3` unless it is needed. Nothing in `src/` references it,
   and it is a non-commercially-licensed file sitting in the repo.

## Note for future sessions

Verifying this from a cloud session requires `elevenlabs.io` under the environment's
Allowed domains (cloud environment menu → Edit → Network access, leaving *Allow package
managers* ticked). Without it, licensing questions can only be answered from secondary
sources. https://code.claude.com/docs/en/cloud-environments#network-access
