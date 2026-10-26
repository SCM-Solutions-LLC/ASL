import type { Kit } from "./types";

// The channel's cast as configuration. A new person is an entry here — no new rig, no new art,
// and they arrive in whatever style the channel is running.
//
// Headwear is chosen for silhouette first and accuracy second where the two disagree: Catherine
// and Jane both wore the English gable, so the rest of their kit has to carry the difference.
//
// Palettes are separated on value and on the second colour rather than on hue. Tudor court dress
// really was mostly crimson, black and gold, so giving each wife her own rainbow would be a lie;
// crimson-and-pearl, rose-and-cream, copper-and-gold and plum-and-silver all read apart at
// thumbnail size without leaving the dyes of the period.

export const KITS: Kit[] = [
  {
    id: "henry",
    build: "doublet",
    palette: { cloth: "#7e2b2e", trim: "#b8933f", skin: "#dcb294", hair: "#8a4a2c", metal: "#c9a84c", drape: "#f2ede4" },
    headwear: "flatcap",
    collar: "fur",
    sleeve: "puff",
    hair: "cropped",
    beard: "full",
  },
  {
    id: "catherine-of-aragon",
    build: "gown",
    palette: { cloth: "#7a1f2b", trim: "#d8cdb5", skin: "#dfbb9c", hair: "#4e3322", metal: "#c9a84c", drape: "#2b2b3a" },
    headwear: "gable",
    collar: "square",
    sleeve: "bell",
    hair: "parted",
    beard: "none",
  },
  {
    id: "anne-boleyn",
    build: "gown",
    palette: { cloth: "#232e28", trim: "#9c8540", skin: "#d9b393", hair: "#2a1d15", metal: "#bfae87", drape: "#131815" },
    headwear: "french",
    collar: "square",
    sleeve: "bell",
    hair: "parted",
    beard: "none",
  },
  {
    id: "jane-seymour",
    build: "gown",
    palette: { cloth: "#9d6a58", trim: "#f0e6d2", skin: "#e3c3a4", hair: "#a98f5f", metal: "#c9a84c", drape: "#efe8dc" },
    headwear: "gable",
    collar: "square",
    sleeve: "fitted",
    hair: "parted",
    beard: "none",
  },
  {
    id: "anne-of-cleves",
    build: "gown",
    palette: { cloth: "#a85f2e", trim: "#c9a84c", skin: "#dfbb9c", hair: "#4e3322", metal: "#c9a84c", drape: "#efe3cf" },
    headwear: "bonnet",
    collar: "high",
    sleeve: "puff",
    hair: "parted",
    beard: "none",
  },
  {
    id: "katherine-howard",
    build: "gown",
    palette: { cloth: "#8a5c69", trim: "#c4bba9", skin: "#e2c4a8", hair: "#6d4a2e", metal: "#bfae87", drape: "#3a2f3d" },
    headwear: "french",
    collar: "square",
    sleeve: "bell",
    hair: "loose",
    beard: "none",
  },
  {
    id: "katherine-parr",
    build: "gown",
    palette: { cloth: "#2f2535", trim: "#aab0bd", skin: "#dcb797", hair: "#775235", metal: "#c9a84c", drape: "#2a2a33" },
    headwear: "coronet",
    collar: "high",
    sleeve: "fitted",
    hair: "parted",
    beard: "none",
  },
];

export const kitById = (id: string): Kit => {
  const k = KITS.find((x) => x.id === id);
  if (!k) throw new Error(`no kit "${id}"`);
  return k;
};
