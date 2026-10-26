# VO and SFX licensing — can this channel publish on ElevenLabs free-plan audio?

Status: **confirmed against ElevenLabs' own terms, decision pending Saawan.** Verified 2026-10-26.

## Short answer

No. The audio currently in `public/` cannot ship on a monetised channel, and upgrading
later does not fix the files that already exist — they have to be regenerated on a paid
plan. Budget impact is small ($6/month); the schedule impact is the part worth planning
for, because regenerating the VO invalidates the word timings this edit is built on.

## Source

Read directly from ElevenLabs' help centre and pricing page on 2026-10-26, after the
environment's network policy was updated to allow their domains. The governing article is
[Can I publish the content I generate on the platform?](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform).
No part of this doc now rests on secondary sources.

## Findings

Verbatim, from that article:

> The free plan does not include a commercial license and cannot be used for any
> commercial purpose. If you publish content generated using our Services on a free plan
> or without being signed-in to your account, you must attribute it to ElevenLabs by
> including "elevenlabs.io" or "11.ai" in the title […]

> All paid plans include a commercial license, provided you're not using Beta Services.

> Content generated during a paid subscription can be used commercially, and indefinitely
> […] Content created outside of a paid subscription (before or after) cannot be used
> commercially and always requires attribution when shared non-commercially.

> Under our Beta Services Addendum, content generated using Beta Services cannot be used
> for any commercial purpose or in any production environment.

What that settles:

- **No retroactive licence, explicitly.** "Before or after" is their wording. The audio in
  `public/` was generated on the free plan and can never be used commercially, however
  long the account is paid afterwards. It has to be regenerated during a paid subscription.
- **Rights survive cancellation.** Anything generated *while* paid stays commercially
  usable "indefinitely". Paying continuously is not required to keep using audio already
  made — only to make more.
- **Attribution is a condition of the non-commercial grant, not an alternative to a
  licence.** Crediting `elevenlabs.io` does not make free-plan audio publishable on a
  monetised channel. It is also required for free-plan audio shared *non*-commercially,
  which covers publicly posting a style test.
- **Beta Services are carved out of the commercial licence entirely.** This is the trap
  worth knowing about: a paid plan does *not* grant commercial rights to anything made
  with a beta or alpha model or feature, and the exclusion covers "any production
  environment", not just monetisation. Chasing the newest-sounding voice model is exactly
  how you would walk into this. Confirm the model and voice used for VO are generally
  available, not beta, and re-confirm whenever you switch models.
- **Per-product terms may add conditions.** The article defers to the Service-Specific
  Terms, so sound effects and music are not automatically covered on the same footing as
  TTS. Check those before relying on generated SFX commercially. Eleven Music additionally
  carries its own free-plan attribution string ("Eleven Music") rather than `elevenlabs.io`.
- **Pricing, from elevenlabs.io/pricing:** Free is $0. Starter is **$6/month**, currently
  advertised with a first month at 83% off ($1) under a promo marked "Until Nov 1".
  Every paid tier carries the commercial licence, so Starter is sufficient.

Unrelated worry, checked and cleared: ElevenLabs watermarks their generated audio, but per
[their own article](https://elevenlabs.io/docs/help-center/legal/audio-detector/will-watermarks-cause-my-content-to-be-flagged-downranked-or-demonetized-on-you-tube-or-other-platforms)
no other platform can currently detect those watermarks, and they are not tied to any
platform's monetisation or content policy. The watermark is not a demonetisation risk.

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

1. Take the Starter tier, $6/month. It is the cheapest thing that makes the problem go
   away, it is well inside budget, and the alternatives cost more than they save —
   recording your own voice costs you time on every one of 3–5 shorts a week, and a
   self-hosted open-source TTS model costs setup plus quality for a licence that costs
   about one coffee a month. The first-month promo expires Nov 1 if that matters.
2. Regenerate `vo.wav` and the SFX on the paid plan before anything is published, using
   a generally-available model and voice — not a beta one, or the commercial licence does
   not attach. Do not publish on the current files, with or without attribution.
3. Make alignment a build step in the same pass, so regenerating the VO is cheap. Until
   then, treat the current `words.json` as valid only for the existing `vo.wav`.
4. Keep the current audio for style tests, but do not post them publicly. Free-plan
   audio needs the `elevenlabs.io` title credit even when shared non-commercially. Private
   style tests are unaffected, which is all these files are used for today.
5. Delete `public/henry_vo_v3.mp3` unless it is needed. Nothing in `src/` references it,
   and it is a non-commercially-licensed file sitting in the repo.

## Note for future sessions

`elevenlabs.io`, `help.elevenlabs.io` and `api.elevenlabs.io` are now on the environment's
Allowed domains, so these terms can be re-checked directly from a cloud session. Worth
re-reading before any pricing or licensing decision, since both move.
