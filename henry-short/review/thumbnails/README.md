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

## cleopatra-pyramid (Gcf568QHAhA, private)

Uploaded on 2026-11-23 as "What the Great Pyramid looked like in Cleopatra's day" (53 characters). The
packaging below is for the owner to set in YouTube Studio; the render and `review/cleopatra-pyramid.json`
are unchanged.

| | Recommended | Alternatives |
|---|---|---|
| Title | The Great Pyramid in Cleopatra's day (36) | The Great Pyramid, 2,000 years ago (34) · Cleopatra's Great Pyramid was still smooth (42) |
| Thumbnail | `cleopatra-pyramid.jpg`: "WHAT DID IT LOOK LIKE IN CLEOPATRA'S DAY?" over one face seen straight on, split down the apex; stepped half tagged "TODAY", smooth half under her portrait and name | |

The owner asked for four changes (2026-11-23): make today and then unmistakable, include Cleopatra,
drop the small print, and make the topic clear. After "The Great Pyramid was smooth", the owner asked
for a question in the style of "how did the pyramids look to Cleopatra"; the headline is the script's
own opening question instead, because "to Cleopatra" says she saw it and no source read does. So the camera faces one side square
on, the two halves sit on the same triangle, and contrast is lifted on the stepped stone only, so
its courses still read at feed size. The portrait is the Berlin marble head the short shows (public
domain; no credit required).

To re-render: `npx remotion still thumb-cleopatra-pyramid review/thumbnails/cleopatra-pyramid.jpg --scale=2 --image-format=jpeg --jpeg-quality=90`.
Both halves are our own 3D renders from one camera (`public/img/cleopatra-thumb-core.jpg`,
`cleopatra-thumb-cased.jpg`), declared in `public/SOURCES.json`.

Description for Studio (the first two lines carry the search words; the first three hashtags show
above the title):

```text
The Great Pyramid of Giza did not look like this in Cleopatra's day: it still wore its smooth, polished casing stones. Among the oldest papyri with writing ever found in Egypt (as of 2014) is the logbook of an inspector named Merer, whose crew hauled limestone to build it.

Cleopatra, born in 69 BC, lived closer to the Moon landing than to the pyramid's building. The Greek historian Diodorus, who visited Egypt when she was a girl, wrote that its stones were still in place, and was told that 360,000 men had spent twenty years building it. Then, in 2013, at Wadi al-Jarf, an ancient harbour on the Red Sea, archaeologists found papyrus documents from the reign of Khufu, the pyramid's own king: the oldest papyri with writing found in Egypt as of 2014. Among them was Merer's logbook: his boat crew hauled limestone from the Tura quarries, about 17 km away, to the pyramid. They had lain buried for about four and a half thousand years.

Sources:
- Diodorus Siculus, Library of History 1.44 and 1.63, tr. C. H. Oldfather, Loeb Classical Library 279 (1933).
- Herodotus, Histories 2.124, tr. A. D. Godley, Loeb Classical Library 117 (1920).
- Tallet & Marouard 2014, "The Harbor of Khufu on the Red Sea Coast at Wadi al-Jarf, Egypt", Near Eastern Archaeology 77(1), 4-14. doi:10.5615/neareastarch.77.1.0004
- Tallet & Marouard 2016, "The Harbor Facilities of King Khufu on the Red Sea Shore", Journal of the American Research Center in Egypt 52.
- Sheisha et al. 2022, PNAS 119(37), e2202530119. doi:10.1073/pnas.2202530119
- Erdil et al. 2025, PLOS ONE. doi:10.1371/journal.pone.0314612
- Rosso 2021, Toxicology Reports. doi:10.1016/j.toxrep.2021.03.004
- NASA Image and Video Library, Apollo 11 (AS11-40-5903).

Images: Great Pyramid photo by Nina Aldin Thune, Wikimedia Commons, CC BY 2.5 (https://creativecommons.org/licenses/by/2.5/), cropped: https://commons.wikimedia.org/wiki/File:Kheops-Pyramid.jpg. Marble portrait of Cleopatra VII, 1st century BC, Antikensammlung Berlin (inv. 1976.10): photo by Louis le Grand, Wikimedia Commons, public domain. 3D surfaces: Poly Haven (CC0). Figures: MakeHuman (CC0). Music: "Desert Mystic 2" by PolygonDan (CC0).

Narration: Kokoro-82M synthetic voice. The 3D scenes are an illustration, not footage: the casing's colour is an estimate, the landscape is not to scale, and the people, the boat and the papyri are drawn.

#ancientegypt #pyramids #history #shorts
```

### Why these (research, Nov 2026)

- Title: the uploaded title is 53 characters, and the Shorts feed cuts off near 40 (vidIQ, above). The
  recommended one is 36 and starts with the search term; "Cleopatra" is a second one. A study of
  18,436 videos found titles of 21-40 characters led in pooled views, an association and not proof
  ([outlierkit](https://outlierkit.com/resources/youtube-title-length/)); trending Shorts averaged 51
  ([TunePocket](https://www.tunepocket.com/youtube-shorts-video-titles/)).
- Thumbnail: few bold elements, short text, and words that add to the title without repeating it
  ([vidIQ thumbnail tips](https://vidiq.com/blog/post/youtube-thumbnail-tips/),
  [vidIQ CTR designs](https://vidiq.com/blog/post/youtube-custom-thumbnails-ctr/)). A before/after of
  one object says the whole claim at a glance. Faces lift clicks in general, but the only face we may
  show is a marble head, and the owner found it clashed with the 3D (2026-11-23), so it is not used.
- Studio's Test & Compare takes up to three thumbnails
  ([vidIQ Shorts thumbnails](https://vidiq.com/blog/post/youtube-shorts-custom-thumbnails/)); judge by
  watch time share, not clicks alone.
- Description: Shorts are found mostly in the feed, but search reads the description, so the search
  words lead it; 3-5 hashtags are enough and the first three show above the title
  ([Search Engine Land](https://searchengineland.com/guide/youtube-hashtags),
  [metadatareactor](https://metadatareactor.com/blog/youtube-shorts-seo-guide/)). These are
  third-party guides, not YouTube documentation.

### Guardrail check (E2, A4, A6)

- "In Cleopatra's day", never "Cleopatra saw": no source read says she saw it.
- The casing's colour has no source for that date. The thumbnail no longer says so (owner's decision,
  2026-11-23: no small print on it); the short says "colour is an estimate" on every casing shot, and
  the description says the 3D scenes are an illustration.
- The headline is script line 1 ("What did the Great Pyramid look like in Cleopatra's day?"), a
  question, never a claim that she saw it. "It" is the Great Pyramid, shown; not "the pyramids".
- "2,000 years ago" (alternative title) rounds 2,085 years (60 BC to 2026).
- The description's new opening repeats the script's claims 2, 6 and 7 and adds none. It was not part
  of fact-check pass 12.

### Posted (2026-11-23)

- **YouTube:** public; the owner kept the uploaded title. Thumbnail and description changes, if any,
  were made by the owner in Studio and are not recorded here.
- **TikTok** ([@huhnestly](https://www.tiktok.com/@huhnestly/video/7711564853638434062)): uploaded by
  the owner from the approved MP4, because the Higgsfield publish form does not show in the Claude
  desktop app. The 150-character caption in `publish/cleopatra-pyramid.json` is the API one; the
  owner posted this longer one instead (claims from the script only):

```text
What did the Great Pyramid look like in Cleopatra's day? Not like today. It still wore its smooth, polished outer casing.

Cleopatra was born in 69 BC, closer in time to the Moon landing than to the pyramid's building. The Greek historian Diodorus, who visited Egypt when she was a girl, wrote that its stones were still in place.

In 2013, at an ancient harbour on the Red Sea, archaeologists found papyrus documents from the reign of Khufu, the pyramid's own king: the oldest papyri with writing found in Egypt (as of 2014). Among them is the logbook of an inspector named Merer, whose boat crew hauled limestone from a quarry about 17 km away to the pyramid.

What would you leave behind for someone to read 4,000 years from now?

Sources: Diodorus, Library of History 1.44 and 1.63; Herodotus 2.124; Tallet & Marouard 2014 and 2016; Sheisha et al. 2022 (PNAS); Erdil et al. 2025 (PLOS ONE); Rosso 2021; NASA (Apollo 11).
3D illustration: the casing's colour is an estimate. Pyramid photo: Nina Aldin Thune, Wikimedia Commons, CC BY 2.5. Synthetic voice.

#history #ancientegypt #pyramids #cleopatra #learnontiktok
```

