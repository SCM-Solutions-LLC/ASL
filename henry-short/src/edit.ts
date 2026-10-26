// One short's cut of one VO. Everything here is derived from the generated alignment for that VO,
// so regenerating the audio re-resolves the cut instead of breaking it — see tools/align.py.

export type AlignedWord = { text: string; start: number; end: number };
export type Alignment = { audio: string; sha256: string; words: AlignedWord[] };

// A slice of the VO, named by what is spoken rather than by source frame. `tail` is the beat of
// room held after the last word, which is an editorial choice per slice.
export type Cut = { from: string; to: string; tail: number };

export type CutWord = { text: string; start: number; end: number; key: boolean; page: number };

export type Segment = { from: number; to: number; at: number };

export type Edit = {
  fps: number;
  audio: string; // path under public/, ready for staticFile()
  segments: Segment[];
  voEnd: number;
  duration: number;
  words: CutWord[];
  /** Output frame where the nth occurrence of a word starts, so animation stays locked to the VO. */
  at: (word: string, nth?: number) => number;
};

export const clean = (t: string) => t.toLowerCase().replace(/[^a-z0-9']/g, "");

export type EditSpec = {
  alignment: Alignment;
  cut: Cut[];
  fps?: number;
  /** Seconds of room left before the first word of a slice, so a cut never clips an onset. */
  lead?: number;
  /** Frames held after the last word, for the outro. */
  outro?: number;
  /** Words the viewer should walk away with; highlighted in the captions. */
  keyPhrases?: string[][];
  /** Caption pages break after these words, in addition to sentence ends. */
  breakAfter?: string[];
};

export const makeEdit = ({
  alignment,
  cut,
  fps = 30,
  lead = 0.13,
  outro = 24,
  keyPhrases = [],
  breakAfter = [],
}: EditSpec): Edit => {
  const spoken = alignment.words.map((w) => clean(w.text));

  // Each anchor must name exactly one place in the VO, or the slice it describes is ambiguous.
  const anchor = (phrase: string) => {
    const want = phrase.split(/\s+/).map(clean).filter(Boolean);
    const hits = [];
    for (let i = 0; i <= spoken.length - want.length; i++) if (want.every((t, j) => spoken[i + j] === t)) hits.push(i);
    if (hits.length !== 1) throw new Error(`Anchor "${phrase}" matches ${hits.length} places in ${alignment.audio}; make it unique`);
    return { first: hits[0], last: hits[0] + want.length - 1 };
  };

  const segments: Segment[] = cut
    .map((s) => ({
      from: Math.max(0, Math.round((alignment.words[anchor(s.from).first].start - lead) * fps)),
      to: Math.round((alignment.words[anchor(s.to).last].end + s.tail) * fps),
    }))
    .map((s, i, all) => ({ ...s, at: all.slice(0, i).reduce((n, p) => n + p.to - p.from, 0) }));

  const last = segments[segments.length - 1];
  const voEnd = last.at + last.to - last.from;

  const kept = alignment.words.flatMap((w) => {
    const s = segments.find((g) => w.start * fps >= g.from && w.end * fps <= g.to + 1);
    if (!s) return [];
    const map = (t: number) => Math.round(s.at + t * fps - s.from);
    return [{ text: w.text, start: map(w.start), end: map(w.end) }];
  });

  const breaks = new Set(breakAfter.map(clean));
  const keys = new Set<number>();
  for (const phrase of keyPhrases)
    for (let i = 0; i <= kept.length - phrase.length; i++)
      if (phrase.every((p, j) => clean(kept[i + j].text) === clean(p))) phrase.forEach((_, j) => keys.add(i + j));

  let page = 0;
  const words: CutWord[] = kept.map((w, i) => {
    const out = { ...w, key: keys.has(i), page };
    if (/[.:]$/.test(w.text) || breaks.has(clean(w.text))) page++;
    return out;
  });

  const at = (word: string, nth = 0): number => {
    const hits = words.filter((w) => clean(w.text) === clean(word));
    if (!hits[nth]) throw new Error(`Word "${word}" #${nth} is not in this cut`);
    return hits[nth].start;
  };

  // The alignment records the VO's real path so its hash can be checked; staticFile wants it
  // relative to public/.
  return { fps, audio: alignment.audio.replace(/^public\//, ""), segments, voEnd, duration: voEnd + outro, words, at };
};
