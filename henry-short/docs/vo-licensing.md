# VO and SFX licensing — why this channel does not use ElevenLabs

Status: **resolved, nothing outstanding.** ElevenLabs terms verified 2026-10-26. The audio those
terms applied to has since been replaced. Kept as the reference behind that decision, and as the
terms to re-read if anyone reconsiders ElevenLabs.

## Short answer

Nothing under `public/` is licence-blocked. `npm run publishable` passes — 23 files declared, all
clear. The free-plan ElevenLabs audio this doc was written about is gone: the voice-over is now
Kokoro-82M (Apache-2.0, run locally) and the seven SFX are synthesised from numpy, both declared
`ship: true` in `public/SOURCES.json`.

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

- **No retroactive licence, explicitly.** "Before or after" is their wording. The audio that was in
  `public/` had been generated on the free plan, so it could never be used commercially however long
  the account was paid afterwards — regenerating it was the only route, and that is the finding this
  whole decision turned on.
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
- **Pricing, as of 2026-10-26:** Free is $0. Starter was **$6/month**, advertised with a first
  month at 83% off ($1) under a promo marked "Until Nov 1". Every paid tier carries the commercial
  licence, so Starter would have been enough. Both the prices and the tiers move — re-read the
  pricing page rather than this bullet.

Unrelated worry, checked and cleared: ElevenLabs watermarks their generated audio, but per
[their own article](https://elevenlabs.io/docs/help-center/legal/audio-detector/will-watermarks-cause-my-content-to-be-flagged-downranked-or-demonetized-on-you-tube-or-other-platforms)
no other platform can currently detect those watermarks, and they are not tied to any
platform's monetisation or content policy. The watermark is not a demonetisation risk.

## What was affected, and what replaced it

| Asset | Was | Is now |
|---|---|---|
| `public/vo/six-wives.wav` | free-plan ElevenLabs read | Kokoro-82M, `npm run tts -- six-wives` |
| `public/sfx/*.wav` (7 files) | free-plan ElevenLabs renders | numpy synthesis, `npm run sfx` |

`six-wives.wav` is the read for every `anne-of-cleves-*` and `catherine-of-aragon-*` composition;
the SFX carry the beat hits in both. `public/vo/scale-of-the-sun.wav` was never an ElevenLabs file
— Kokoro from the start.

The non-obvious cost was in the edit, not the audio. `src/words.json` held absolute timings measured
against one specific render of the VO, and the cut hardcoded source frame ranges into that same
render. A regenerated VO — even from an identical script and voice — would not land on the same
frames, so **every `at("word")` beat in the edit moved.**

That is structural now, not a committed measurement:

- `script/<slug>.txt` is the spoken script, the input to both the VO and its timings.
- `tools/tts.py` speaks it with Kokoro and writes `public/vo/<slug>.wav` and
  `src/generated/<slug>.alignment.json` in one pass, stamped with the WAV's SHA-256. Seeded, so the
  same script, voice, speed and seed reproduce the same audio.
- `tools/align.py` stays for audio recorded elsewhere — a human read — where the timings have to be
  measured rather than generated alongside the audio.
- A short's `cut` names its slices by what is spoken rather than by frame:
  `{ from: "Wife four", to: "beloved sister." }` in `src/shorts/anne-of-cleves/index.ts`. A new read
  re-resolves the same cut at new frames. Verified: against a simulated re-render (1.4s later, 3%
  slower) the segments relocate from 0–65 and 842–1188 to 38–109 and 909–1266 with the same 39
  words and every beat intact.
- `npm run lint` hashes the audio each `alignment.json` names and fails if the WAV has moved on
  without its timings, so stale timings cannot reach a render silently.

So regenerating a VO costs one `npm run tts -- <slug>` and a look at the beats, not a re-measured edit.

## What was decided

Kokoro-82M, self-hosted, over the $6/month ElevenLabs Starter tier.

This doc originally recommended the opposite — take Starter, since it costs "about one coffee a
month" against a self-hosted model that "costs setup plus quality." Worth recording why that was
wrong, because the mistake is easy to repeat: it priced the licence and ignored the exposure. A
hosted terms page can change under a video that is already published, and the Beta Services
carve-out above means a paid tier is not even a blanket grant — every model switch has to be
re-checked for GA status. An Apache-2.0 model on our own machine has no per-character cost, no terms
page, and nothing to re-check. The quality gap turned out to be acceptable for a narrated history
short.

What is still true and worth keeping:

- **Free-plan ElevenLabs audio is never publishable**, with or without attribution. The commercial
  licence is not retroactive — "before or after" is their wording — so nothing generated on the
  free plan becomes usable by paying later. This is what cost the project its first voice-over.
- **If ElevenLabs is ever reconsidered**, confirm the model and voice are generally available, not
  beta, and re-confirm on every model switch. The Beta carve-out covers "any production
  environment", not just monetisation.
- **`tools/align.py` still calls `api.elevenlabs.io`** for forced alignment and needs
  `ELEVENLABS_API_KEY`. It is the last ElevenLabs dependency in the repo, unused by the Kokoro path
  since `tools/tts.py` writes its own timings. It returns word timings rather than audio, but check
  the Service-Specific Terms before leaning on it for anything publishable.

## Note for future sessions

`elevenlabs.io`, `help.elevenlabs.io` and `api.elevenlabs.io` are now on the environment's
Allowed domains, so these terms can be re-checked directly from a cloud session. Worth
re-reading before any pricing or licensing decision, since both move.
