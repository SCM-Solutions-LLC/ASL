import data from "./words.json";

export const FPS = 30;

// Pieces of public/vo.wav used in this cut, as source frames at 30 fps.
export const SEGMENTS = [
  { from: 0, to: 65 }, // "The fourth wife beat them all."
  { from: 842, to: 1188 }, // "Wife four, Anne of Cleves ... the King's beloved sister."
].map((s, i, all) => ({ ...s, at: all.slice(0, i).reduce((n, p) => n + p.to - p.from, 0) }));

const last = SEGMENTS[SEGMENTS.length - 1];
export const VO_END = last.at + last.to - last.from;
export const DURATION = VO_END + 24;

// Words the viewer should walk away with get highlighted on screen.
const KEY_PHRASES = [["fourth"], ["anne", "of", "cleves"], ["annulled"], ["palace"], ["castle"], ["king's", "beloved", "sister"]];
// Caption pages break after these, in addition to sentence ends.
const BREAK_AFTER = new Set(["annulled", "palace"]);

const clean = (t: string) => t.toLowerCase().replace(/[^a-z0-9']/g, "");

export type CutWord = { text: string; start: number; end: number; key: boolean; page: number };

const cut = data.words
  .filter((w) => w.type === "word")
  .flatMap((w) => {
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
