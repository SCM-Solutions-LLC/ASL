# Guardrails

The rules every short is held to before it is shown for approval. Claude writes the shorts, so these
are written for Claude first: when a rule cannot be met, **stop and ask**; do not soften the rule or
the claim to get past it. Rule IDs are stable so the fact-check pass and the review package can cite
them ("A3 fails: …").

Audience: curious teens and adults (13+). History, STEM and space. The promise of the channel is that
every short teaches one true thing a viewer did not know, and survives a pedant in the comments.

## A. Accuracy

- **A1 — Every factual claim is sourced.** Each spoken claim — number, date, name, quantity,
  causal statement — has a numbered entry in the `---` SOURCES block of `script/<vo>.txt`: the line
  quoted, the figure behind it, and where it comes from. `age-of-sunlight.txt` is the model.
- **A2 — Sources are citable.** Peer-reviewed papers (DOI or bibcode), standard references and
  textbooks (with edition), agency data (NASA, NIST, IAU, CODATA…), primary historical documents, or
  academic histories. Wikipedia, blogs, listicles and other YouTube videos may point at a source;
  they are never the source. If only secondary reports of a paper were read, say so (as
  `age-of-sunlight` does for Stix).
- **A3 — The script says what the source says.** Rounding may simplify but not change the claim
  ("about a hundred thousand" for 1.7×10⁵ is the outer limit). If sources disagree, the script makes
  the narrower claim the best source supports, and the SOURCES entry records the disagreement and why
  this reading was chosen.
- **A4 — The hook is true as stated.** Many viral facts are false in their popular form. If the
  popular version is wrong, the short either carries the correction or is not made. A hook that only
  becomes true three sentences later still fails if a viewer who swipes at second two leaves believing
  something false.
- **A5 — History separates record from story.** Attested fact is stated plainly; legend, later
  accounts and contested readings are marked as such ("reportedly", "a later chronicler claims").
  Quotations only if the wording is verified against a primary or scholarly source; no misattributed
  quotes, no invented dialogue presented as real.
- **A6 — Visuals are claims too.** On-screen numbers, labels, maps, scales and diagrams obey A1–A3.
  A deliberately non-to-scale visual says so on screen, or the script does.
- **A7 — Fact-checking is a separate pass.** The script's author does not sign off its own facts.
  A separate pass, with only the script and its SOURCES block, tries to break every claim; any claim
  it cannot confirm from the cited source blocks approval until fixed or cut.

## B. Uniqueness

- **B1 — One core claim per short, not repeated.** Before choosing a topic, read every
  `script/*.txt`. A new short may share a subject (the Sun) but not its core claim. A follow-up that
  deepens a claim must add a new fact, not restate one.
- **B2 — Not the top-result version.** If the first page of search results already tells the fact
  the same way, the short needs a new angle, a correction (A4) or a different topic.
- **B3 — Not templated.** YouTube's monetisation policy excludes mass-produced, repetitive
  ("inauthentic") content. Each short gets its own script structure, visual idea and choreography;
  swapping the noun in a previous short is not a new short. This is the biggest platform risk of an
  automated pipeline.

## C. Content limits

- **C1** — No graphic violence or gore. Executions, battles and disasters are shown symbolically or
  off-screen; PG-13 at most in narration.
- **C2** — No medical, legal or financial advice; no "try this at home" with real hazard.
- **C3** — No partisan politics or current-events persuasion. Historical politics is fine, framed as
  history.
- **C4** — No depiction of living private individuals. Living public figures only with care, never
  saying or doing anything they did not.
- **C5** — No sexual content beyond what a history lesson needs, stated plainly.
- **C6** — Contested identity, religious or national topics: present the scholarly consensus and
  name the disagreement; never mock a group.

## D. Assets and licences

- **D1** — Every file under `public/` is declared in `public/SOURCES.json`; `npm run publishable`
  must pass. Only own work, public domain, CC0/CC-BY (credited) or permissive-licence tools.
- **D2** — Licences are checked **before** generating anything with a tool (see
  `docs/vo-licensing.md`): no free-tier or non-commercial generators.
- **D3** — VO is Kokoro from the pinned environment (`npm run setup`). No cloned or imitated real
  voices.

## E. Platform and metadata

- **E1** — Not made for kids (`selfDeclaredMadeForKids: false`): the audience is 13+.
- **E2** — Title, description, thumbnail and hashtags describe what the short actually shows and
  claims. No bait the short does not pay off; no "comment X" engagement bait.
- **E3** — Altered/synthetic disclosure: required when content is realistic enough to be mistaken
  for a real person, place or event. Illustrated animation with a stock synthetic narrator is not
  that, but re-check YouTube's current rule at upload time and disclose when in doubt.
- **E4** — Description carries a short source list (the SOURCES block, condensed).
- **E5** — Format: 9:16, burned-in captions, at most 3 min (the platform's Shorts limit; the
  60 s target was dropped by the owner on 2026-11-24), and the hook lands in the first sentence.

## F. Approval and publishing

- **F1** — Nothing is uploaded without the owner's explicit approval of that specific render,
  identified by the SHA-256 of the MP4 and its metadata. Any change after approval voids it.
- **F2** — Upload with the visibility and schedule the owner approved; never public by default.
- **F3** — Credentials (OAuth tokens, API keys) live outside the repo and are never committed or
  printed.
- **F4** — Stop and ask instead of proceeding when: a claim cannot be sourced to A2's standard,
  sources conflict beyond what A3 can carry, a topic touches C1–C6, or a licence is unclear.
