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

// Key words and caption pages, shared by a cut of a real VO and a draft with no audio yet.
const paginate = (
  kept: { text: string; start: number; end: number }[],
  keyPhrases: string[][],
  breakAfter: string[],
): CutWord[] => {
  const breaks = new Set(breakAfter.map(clean));
  const keys = new Set<number>();
  for (const phrase of keyPhrases)
    for (let i = 0; i <= kept.length - phrase.length; i++)
      if (phrase.every((p, j) => clean(kept[i + j].text) === clean(p))) phrase.forEach((_, j) => keys.add(i + j));

  let page = 0;
  return kept.map((w, i) => {
    const out = { ...w, key: keys.has(i), page };
    if (/[.:]$/.test(w.text) || breaks.has(clean(w.text))) page++;
    return out;
  });
};

const wordClock = (words: CutWord[]): Edit["at"] => (word, nth = 0) => {
  const hits = words.filter((w) => clean(w.text) === clean(word));
  if (!hits[nth]) throw new Error(`Word "${word}" #${nth} is not in this cut`);
  return hits[nth].start;
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

  const words = paginate(kept, keyPhrases, breakAfter);
  const at = wordClock(words);

  // The alignment records the VO's real path so its hash can be checked; staticFile wants it
  // relative to public/.
  return { fps, audio: alignment.audio.replace(/^public\//, ""), segments, voEnd, duration: voEnd + outro, words, at };
};

// ---------------------------------------------------------------- drafting without a VO

export type DraftSpec = {
  /** The script as it will be spoken. */
  script: string;
  fps?: number;
  /** Narration pace. 165 is an unhurried read; shorts are often cut nearer 185. */
  wpm?: number;
  outro?: number;
  keyPhrases?: string[][];
  breakAfter?: string[];
};

// A short before its voice-over exists. Word timings are estimated from the script at a chosen
// pace, so beats can be written and the whole thing previewed; recording the VO later means
// swapping makeDraftEdit for makeEdit and nothing else, because every beat hangs off a spoken
// word rather than a frame number.
//
// `audio` is empty, which is how Scene knows there is nothing to play yet.
export const makeDraftEdit = ({
  script,
  fps = 30,
  wpm = 170,
  outro = 24,
  keyPhrases = [],
  breakAfter = [],
}: DraftSpec): Edit => {
  const spoken = script.split(/\s+/).filter(Boolean);
  const perWord = 60 / wpm;

  let t = 0;
  const kept = spoken.map((text) => {
    // Longer words take longer to say, and punctuation buys a beat of room after them.
    const dur = perWord * (0.62 + 0.38 * Math.min(2.2, text.replace(/[^A-Za-z0-9']/g, "").length / 4.5));
    const pause = /[.!?]$/.test(text) ? 0.34 : /[,;:—]$/.test(text) ? 0.17 : 0;
    const start = Math.round(t * fps);
    t += dur;
    const end = Math.round(t * fps);
    t += pause;
    return { text, start, end };
  });

  const words = paginate(kept, keyPhrases, breakAfter);
  const voEnd = words.length ? words[words.length - 1].end : 0;
  return { fps, audio: "", segments: [], voEnd, duration: voEnd + outro, words, at: wordClock(words) };
};
