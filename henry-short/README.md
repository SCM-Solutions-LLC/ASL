# Henry VIII "six wives" short — style test

Remotion project for the history/STEM shorts channel. One VO, one edit, rendered in two looks and two formats.

| Composition | Look | Format |
|---|---|---|
| `AnneHolbein` / `AnneHolbeinWide` | $0: Holbein's public-domain portraits as cut-outs | 9:16 / 16:9 |
| `AnneCutout` / `AnneCutoutWide` | Placeholder shapes for an illustrated kit (style B route) | 9:16 / 16:9 |

The cut is the hook ("The fourth wife beat them all") plus the Anne of Cleves beat, 14.5s.

## Run

```bash
npm i
npx remotion studio            # preview
npx remotion render AnneHolbein out/anne_holbein_9x16.mp4
python3 tools/cut.py           # re-cut the portraits in kit_src/ into public/kit/pd/ (needs opencv-python-headless)
```

## Layout

- `src/rig/` — cut-out rig engine: parts with pivots, keyframed poses, idle breathing/blinks.
- `src/edit.ts` — which slices of `public/vo.wav` are used; word timings (`src/words.json`) remapped to the cut. Every animation beat is keyed to a spoken word via `at("word")`.
- `src/layout.ts` — scenes are staged once on a wide set; 9:16 and 16:9 are camera framings plus their own caption/title placement.
- `src/chars/pd.tsx` + `src/kit_pd.json` — Holbein rigs built from the parts `tools/cut.py` produces.
- `src/chars/henry.tsx`, `anne.tsx` — placeholder rigs (neutral A-pose part spec for an illustrated kit).
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
