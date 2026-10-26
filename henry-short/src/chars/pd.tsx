import kit from "../kit_pd.json";
import type { Art, PartDef } from "../rig/types";

// Rigs built from public-domain Holbein portraits, cut by tools/cut.py.
// Boxes and pivots come from the manifest in source-painting pixels.
type Entry = { box: number[]; pivot: number[] };
const K = kit as unknown as Record<string, Record<string, Entry>> & { anne_skirt_top: number[] };

const img = (char: string, file: string): Art => ({ src: `kit/pd/${char}/${file}.png` });

const part = (char: string, id: string, parent: string | null, extra: Partial<PartDef> = {}): PartDef => {
  const p = K[char][id];
  const [x0, y0, w, h] = p.box;
  const at: [number, number] = parent
    ? [p.pivot[0] - K[char][parent].box[0], p.pivot[1] - K[char][parent].box[1]]
    : [0, 0];
  return { id, w, h, pivot: [p.pivot[0] - x0, p.pivot[1] - y0], at, art: { default: img(char, id) }, ...extra };
};

// Henry: the body pivots at his feet so leans and double takes rock the whole figure.
export const pdHenry: PartDef = part("henry", "body", null, {
  children: [
    part("henry", "foreL", "body", { z: 1 }),
    part("henry", "foreR", "body", { z: 1 }),
    part("henry", "head", "body", {
      z: 1,
      art: { default: img("henry", "head"), closed: img("henry", "head_closed") },
      children: [part("henry", "jaw", "head", { z: 1 })],
    }),
  ],
});

// Anne: the portrait ends at the waist, so the root is a gown extended from her own dress, pivoting at the hem.
const skirtBox = K.anne.skirt.box;
export const pdAnne: PartDef = part("anne", "skirt", null, {
  children: [
    {
      ...part("anne", "body", null),
      at: [K.anne_skirt_top[0] - skirtBox[0], K.anne_skirt_top[1] - skirtBox[1] + 8],
      z: 1,
      children: [
        part("anne", "head", "body", {
          z: 1,
          art: { default: img("anne", "head"), closed: img("anne", "head_closed"), wink: img("anne", "head_wink") },
        }),
      ],
    },
  ],
});

// Source pixels → stage units, chosen so the two paintings' faces come out the same size.
export const PD_SCALE = { henry: 0.65, anne: 0.325 };
