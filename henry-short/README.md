# History/STEM shorts — pipeline

Remotion project for the shorts channel. A script and a VO go in; a short comes out in every look
it defines, at 9:16 and 16:9.

A **short** is one module under `src/shorts/`. Listing it in `src/shorts/index.ts` registers its
compositions automatically, named `<slug>-<Look>` and `<slug>-<Look>Wide`.

| Short | Looks | Cut from |
|---|---|---|
| `anne-of-cleves` | `Illustrated`, `Holbein` | the hook plus the Anne of Cleves beat, 14.5s |
| `catherine-of-aragon` | `Illustrated` | wife one, 7.4s — built on `src/moves` as a pipeline test |
| `scale-of-the-sun` | `Space` | 40.7s, no cast at all — drafted against an estimated read, no VO yet |

The two Tudor shorts are cut from the same `six-wives` VO: one recording can carry several shorts.
`scale-of-the-sun` has no VO — see **Drafting before a voice-over exists** below.

## Run

```bash
npm i
npx remotion studio                       # preview every short in every look
npx remotion render anne-of-cleves-Holbein out/anne_holbein_9x16.mp4
npm run new-short -- <slug>               # scaffold a new short
npm run lint                              # typecheck, licences, and refuse a cut built on stale word timings
npm run publishable                       # refuse to call the project shippable while an asset has no licence
npm run tts -- <slug>                     # speak a script with Kokoro and write its word timings
npm run tts -- --self-test                # check the timing/WAV code with no model downloaded
npm run align -- <vo-slug>                # word timings for a VO recorded elsewhere
python3 tools/cut.py                      # re-cut the portraits in kit_src/ into public/kit/pd/ (needs opencv-python-headless)
```

## Drafting before a voice-over exists

`makeDraftEdit` builds the same `Edit` from a script and a words-per-minute pace, with estimated
timings and no audio, so a short can be written, choreographed and previewed before anything is
recorded. `Scene` plays nothing when `edit.audio` is empty.

Recording later means swapping `makeDraftEdit` for `makeEdit` and running `npm run align`. No beat
moves, because every beat hangs off a spoken word rather than a frame number.

## Voice-over

Scripts live in `script/<slug>.txt` — one file per voice-over, named after the VO rather than the
short, since one recording can carry several shorts. A drafted short also holds its script inline,
where `makeDraftEdit` estimates timings from it; `npm run lint` fails if the two drift apart,
because the voice would then say one thing while every beat was keyed to another.

`npm run tts -- <slug>` reads `script/<slug>.txt`, speaks it with
[Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), and writes both `public/vo/<slug>.wav` and
the word timings in one pass. Kokoro is **Apache-2.0** and runs locally, which is the whole reason
it is here: no per-character cost, and no terms page that can change under a published video.

    pip install kokoro soundfile     # once; Kokoro also wants espeak-ng on the system

Kokoro samples, so the generator is seeded (`--seed`, default 0): the same script, voice, speed and
seed give the same audio every time. Without that the hash recorded in the alignment would describe
one lucky render rather than the script, and re-running the tool would silently invalidate a
committed voice-over. Found by running it twice and getting two different hashes.

Each sentence is synthesised separately, so every sentence boundary is a *measured* time. Within a
sentence, words are spread across the voiced audio by the same length weighting `makeDraftEdit`
uses, so error never accumulates past one sentence. That is the accuracy a word-anchored beat
needs, without a forced aligner and the model weights one brings with it.

`tools/align.py` stays for audio recorded elsewhere — a human read, say — where the timings have to
be recovered from the audio rather than generated with it.

## Cadence, and why

Monetisation has two separate ladders, and they do not combine:

- 1,000 subscribers **+ 4,000 long-form watch hours** in 12 months, or
- 1,000 subscribers **+ 10 million Shorts views** in 90 days.

Shorts views do not count toward the watch-hours threshold. Ten million views in ninety days is
roughly 111,000 a day, which a new niche channel will not reach; 4,000 watch hours is about 60,000
views of a ten-minute video watched halfway, which it can. So **long-form is the monetisation path
and the shorts are the funnel that feeds it** — roughly one 8–12 minute piece a week, and about two
shorts, rather than the other way round. Eight minutes is also the floor for mid-roll ads.

Length does not affect eligibility: padding a 40-second short to 60 buys nothing. What matters is
that anything over three minutes stops being a Short and starts banking watch hours.

(Checked October 2026 against secondary guides, not YouTube's own page — confirm in YouTube Studio
before betting on it. Several report a tightening to 8,000 hours / 20M views for new applicants
from February 2027.)

## Making a short

1. `npm run new-short -- <slug>` scaffolds `src/shorts/<slug>/`.
2. Name the slices of the VO by what is **spoken**, never by source frame.
3. Hang every beat off a spoken word with `edit.at("word")`.
4. Write the choreography out of `src/moves`, dropping to raw keyframes where a beat needs it.
5. List the short in `src/shorts/index.ts`.

## Layout

### Pipeline
- `script/<vo>.txt` — the spoken script: the input to both the VO and the alignment.
- `tools/align.py` → `src/generated/<vo>.alignment.json` — word timings for `public/vo/<vo>.wav`, stamped with its SHA-256. Generated, never hand-edited; `npm run lint` fails if the VO has moved on without them.
- `src/edit.ts` — `makeEdit` turns an alignment plus a list of spoken anchors into frames, captions and `at("word")`. One VO can feed several shorts.
- `src/Scene.tsx` — renders any short in any look. `src/Root.tsx` registers short × look × format.
- `src/layout.ts` — scenes are staged once on a wide set; 9:16 and 16:9 are camera framings plus their own caption/title placement.

### Figures
- `src/rig/` — cut-out rig engine: parts with pivots, keyframed poses, idle breathing/blinks.
- `src/rig/cast.ts` — **roles and expressions**. Figures rigged different ways do not share joints, so moves are written against roles (`root`, `head`, `armL`…) and each figure maps what it has. A move that reaches for a joint a figure lacks performs the part of itself that it can.
- `src/moves/` — named gestures (`doubleTake`, `point`, `bob`, `cheer`, `hop`, `twirl`…) that any figure can perform. The point of the role layer.
- `src/chars/figure.tsx` — a gowned figure from a palette and a silhouette, so a new person is a few colours rather than a new rig.
- `src/chars/kit/` — the illustrated cast as configuration: `shapes.ts` is the silhouette vocabulary, `styles.tsx` renders it, `build.tsx` holds the geometry, `roster.ts` is the cast. `kit-soft` renders the whole cast as a sheet.
- `src/scenes/` — scene pieces for shorts with no cast at all, e.g. the starfield and bodies behind `scale-of-the-sun`.
- `src/chars/actors.ts` — who can appear, and what their joints and faces are called. Short-agnostic.
- `src/chars/pd.tsx` + `src/kit_pd.json` — Holbein rigs built from the parts `tools/cut.py` produces.
- `src/chars/henry.tsx`, `anne.tsx` — the hand-built illustrated rigs the first short was cut on.
- `src/ui/` — captions with key-word highlights, title card, stamp, prizes, banner.

## Sources and licences

Every file under `public/` is declared in [`public/SOURCES.json`](public/SOURCES.json) with its
source, its licence, and whether it may be published. `npm run lint` fails on any file that is not
declared; `npm run publishable` fails while anything undeclared or unpublishable is still there.

This exists because the project lost a complete voice-over to a licence nobody checked before
generating it, which is not fixable after the fact.

Nothing is currently blocked. The VO and SFX were originally generated with ElevenLabs on the free
plan, which grants no commercial licence and never grants one retroactively; both were replaced with
locally-generated audio — Kokoro-82M for the read, numpy synthesis for the SFX. See
[docs/vo-licensing.md](docs/vo-licensing.md) for the terms behind that and why regenerating a VO
moves every word-synced beat.

## Known issues

- Henry's robe shows inpainting smudges where his forearms were when he raises them.
- Anne's portrait ends at the waist; her lower gown is stretched from the bottom rows of the painting.
- A thin sliver of carpet remains beside Henry's right leg.
