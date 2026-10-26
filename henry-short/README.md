# History/STEM shorts — pipeline

Remotion project for the shorts channel. A script and a VO go in; a short comes out in every look
it defines, at 9:16 and 16:9.

A **short** is one module under `src/shorts/`. Listing it in `src/shorts/index.ts` registers its
compositions automatically, named `<slug>-<Look>` and `<slug>-<Look>Wide`.

| Short | Looks | Cut from |
|---|---|---|
| `anne-of-cleves` | `Illustrated`, `Holbein` | the hook plus the Anne of Cleves beat, 14.5s |
| `catherine-of-aragon` | `Illustrated` | wife one, 7.4s — built on `src/moves` as a pipeline test |

Both are cut from the same `six-wives` VO: one recording can carry several shorts.

## Run

```bash
npm i
npx remotion studio                       # preview every short in every look
npx remotion render anne-of-cleves-Holbein out/anne_holbein_9x16.mp4
npm run new-short -- <slug>               # scaffold a new short
npm run lint                              # typecheck, and refuse a cut built on stale word timings
npm run align -- <vo-slug>                # regenerate word timings after a new VO (needs ELEVENLABS_API_KEY, requests)
python3 tools/cut.py                      # re-cut the portraits in kit_src/ into public/kit/pd/ (needs opencv-python-headless)
```

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
- `src/chars/actors.ts` — who can appear, and what their joints and faces are called. Short-agnostic.
- `src/chars/pd.tsx` + `src/kit_pd.json` — Holbein rigs built from the parts `tools/cut.py` produces.
- `src/chars/henry.tsx`, `anne.tsx` — the hand-built illustrated rigs the first short was cut on.
- `src/ui/` — captions with key-word highlights, title card, stamp, prizes, banner.

## Sources and licences

- Henry VIII, full length, after Hans Holbein the Younger (Walker Art Gallery) — public domain, Wikimedia Commons.
- Anne of Cleves, Hans Holbein the Younger (Louvre) — public domain, Wikimedia Commons.
- VO and SFX were generated with ElevenLabs on the free plan, which grants no commercial
  licence. **Do not publish on the current audio** — see [docs/vo-licensing.md](docs/vo-licensing.md)
  for the finding, what has to be regenerated, and why that moves every word-synced beat.

## Known issues

- Henry's robe shows inpainting smudges where his forearms were when he raises them.
- Anne's portrait ends at the waist; her lower gown is stretched from the bottom rows of the painting.
- A thin sliver of carpet remains beside Henry's right leg.
