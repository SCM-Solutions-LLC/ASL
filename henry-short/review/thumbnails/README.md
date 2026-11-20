# Titles and thumbnails for the three uploaded shorts

Repackaging for the private uploads in `review/*.upload.json`. The render and the approved metadata
records are unchanged. A new title is set in YouTube Studio by the owner. After that, add a line to
that short's `.upload.json` `notes`, as `altar-stone` does.

Thumbnails are 2160×3840 JPEGs (YouTube's recommended Shorts size). To re-render one:
`npx remotion still thumb-<slug> review/thumbnails/<slug>.jpg --scale=2 --image-format=jpeg --jpeg-quality=90`
(source: `src/thumbnails.tsx`). Every picture used is already declared in `public/SOURCES.json`.

| Short (video ID) | New title | Chars | Thumbnail |
|---|---|---|---|
| `deepest-hole-long` (ibNjmPjsMYE) | Earth's deepest hole was finished with a bit this small | 55 | `deepest-hole-long.jpg`: "12 KM DOWN", the 21 cm bit drawn to scale on the 25.6 cm museum plate |
| `age-of-sunlight-long` (S9wlyq-m-lQ) | Sunlight is old news. Neutrinos aren't. | 39 | `age-of-sunlight-long.jpg`: SDO Sun, "SUNLIGHT 40,000+ YEARS" vs "NEUTRINOS 8 MINUTES" |
| `great-red-spot` (xFyCvJBFMbc) | Was the Great Red Spot really seen in 1665? | 43 | `great-red-spot.jpg`: Cassini-map Jupiter, today's GRS ringed, "SEEN SINCE 1665?", "RECORD STARTS 1831" |
| `altar-stone` (eY8_wJqBbJ8, public) | How did a 6-tonne stone reach Stonehenge? | 41 | `altar-stone.jpg`: the CC BY Stonehenge sunrise photo, "6 TONNES", "700+ KM?", credit line at the foot |

## Why these (research, Nov 2026)

- The mobile Shorts feed cuts titles off at about 40 characters. The old titles ran 54–92, so each
  one's hook was hidden. Put the search keyword first (deepest hole, sunlight/neutrinos, Great Red
  Spot) and the curiosity in what is left ([vidIQ, Jun 2026](https://vidiq.com/blog/post/youtube-shorts-titles/)).
- Make the title and thumbnail work as a pair, without repeating each other. Be accurate, limit caps,
  and keep the most important words early ([YouTube Help: thumbnail & title tips](https://support.google.com/youtube/answer/12340300)).
- Custom Shorts thumbnails are uploaded in Studio on desktop at 9:16. They opened to Partner Program
  channels on 24 Jul 2026 ([YouTube blog](https://blog.youtube/news-and-events/youtube-studio-custom-thumbnail-updates/),
  [Help](https://support.google.com/youtube/answer/72431)). Words sit in the middle 4:5 band, clear
  of the title overlay.
- Judge them on CTR from Home and Suggested in the first 24 h, against the channel's average
  (YouTube Help, above).

## Guardrail check (E2, A4, A6)

- **Deepest hole:** "finished with" rather than "dug with". The hole began 72 cm wide; only the
  last stage used the 21 cm bit (script lines 1, 3–4). The ring on the plate is to scale and says so.
- **Sun:** the title is the script's own closing line. Both numbers measure from leaving the core:
  40,000+ is the lowest cited figure, the same one shown on screen in the short (SOURCES claim 3);
  about 8 minutes for the neutrinos (claims 2, 8–9).
- **Great Red Spot:** asked as a question, because the short's answer is "probably not". The ring
  marks today's GRS on the unaltered NASA map. Cassini's 1665 oval is neither shown nor labelled,
  as `factcheck/great-red-spot.json` claim 2 requires. "Record starts 1831" is the script's
  "first shows up in drawings in 1831".
- **Altar Stone:** a question, because the short's answer is that nobody knows yet. The source and
  route are both unsettled (Pirrie et al. 2026). "700+ KM?" carries the script's "if so … more than
  seven hundred kilometres" as a question. The photo is CC BY 2.0, and its credit is on the thumbnail
  as well as in the description. This short is already public with a title the owner chose in
  Studio. Swapping titles on a live video resets nothing, but compare CTR before and after.
