import alignment from "./generated/alignment.json";

export const FPS = 30;

// Seconds of room left before the first word of a segment, so a cut never clips an onset.
const LEAD = 0.13;

// Pieces of public/vo.wav used in this cut, named by what is spoken rather than by source frame.
// Regenerating the VO moves every frame but none of these words, so the cut survives it;
// `tail` is the beat of room held after the last word, which is an editorial choice per segment.
// Timings come from src/generated/alignment.json — see tools/align.py, never hand-edited.
const SOURCE = [
  { from: "The fourth wife", to: "beat them all.", tail: 0.21 },
  { from: "Wife four", to: "beloved sister.", tail: 0.08 },
];

const clean = (t: string) => t.toLowerCase().replace(/[^a-z0-9']/g, "");

const SPOKEN = alignment.words.map((w) => clean(w.text));

// Each anchor must name exactly one place in the VO, or the cut it describes is ambiguous.
const anchor = (phrase: string) => {
  const want = phrase.split(/\s+/).map(clean).filter(Boolean);
  const hits = [];
  for (let i = 0; i <= SPOKEN.length - want.length; i++) if (want.every((t, j) => SPOKEN[i + j] === t)) hits.push(i);
  if (hits.length !== 1) throw new Error(`Anchor "${phrase}" matches ${hits.length} places in the VO; make it unique`);
  return { first: hits[0], last: hits[0] + want.length - 1 };
};

export const SEGMENTS = SOURCE.map((s) => ({
  from: Math.max(0, Math.round((alignment.words[anchor(s.from).first].start - LEAD) * FPS)),
  to: Math.round((alignment.words[anchor(s.to).last].end + s.tail) * FPS),
})).map((s, i, all) => ({ ...s, at: all.slice(0, i).reduce((n, p) => n + p.to - p.from, 0) }));

const last = SEGMENTS[SEGMENTS.length - 1];
export const VO_END = last.at + last.to - last.from;
export const DURATION = VO_END + 24;

// Words the viewer should walk away with get highlighted on screen.
const KEY_PHRASES = [["fourth"], ["anne", "of", "cleves"], ["annulled"], ["palace"], ["castle"], ["king's", "beloved", "sister"]];
// Caption pages break after these, in addition to sentence ends.
const BREAK_AFTER = new Set(["annulled", "palace"]);

export type CutWord = { text: string; start: number; end: number; key: boolean; page: number };

const cut = alignment.words.flatMap((w) => {
  const s = SEGMENTS.find((g) => w.start * FPS >= g.from && w.end * FPS <= g.to + 1);
  if (!s) return [];
  const map = (t: number) => Math.round(s.at + t * FPS - s.from);
  return [{ text: w.text, start: map(w.start), end: map(w.end) }];
});

export const WORDS: CutWord[] = (() => {
  const keys = new Set<number>();
  for (const phrase of KEY_PHRASES)
    for (let i = 0; i <= cut.length - phrase.length; i++)
      if (phrase.every((p, j) => clean(cut[i + j].text) === p)) phrase.forEach((_, j) => keys.add(i + j));
  let page = 0;
  return cut.map((w, i) => {
    const out = { ...w, key: keys.has(i), page };
    if (/[.:]$/.test(w.text) || BREAK_AFTER.has(clean(w.text))) page++;
    return out;
  });
})();

// Output frame where the nth occurrence of a word starts, so animation stays locked to the VO.
export const at = (word: string, nth = 0): number => {
  const hits = WORDS.filter((w) => clean(w.text) === clean(word));
  if (!hits[nth]) throw new Error(`Word "${word}" #${nth} is not in this cut`);
  return hits[nth].start;
};
