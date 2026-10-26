import type { Kit } from "./types";

// The channel's cast as configuration. A new person is an entry here — no new rig, no new art,
// and they arrive in whatever style the channel is running.
//
// Headwear is chosen for silhouette first and accuracy second where the two disagree: Catherine
// and Jane both wore the English gable, so the rest of their kit has to carry the difference.

export const KITS: Kit[] = [
  {
    id: "henry",
    build: "doublet",
    palette: { cloth: "#9b1d2a", trim: "#d8a93b", skin: "#f0c9a0", hair: "#b5562b", metal: "#f1c74f", drape: "#f2ede4" },
    headwear: "flatcap",
    collar: "fur",
    sleeve: "puff",
    hair: "cropped",
    beard: "full",
  },
  {
    id: "catherine-of-aragon",
    build: "gown",
    palette: { cloth: "#8e1b2a", trim: "#d8a93b", skin: "#f3d2b3", hair: "#6b4226", metal: "#f1c74f", drape: "#2b2b3a" },
    headwear: "gable",
    collar: "square",
    sleeve: "bell",
    hair: "parted",
    beard: "none",
  },
  {
    id: "anne-boleyn",
    build: "gown",
    palette: { cloth: "#1f2a24", trim: "#c9a227", skin: "#eccba8", hair: "#2e1d14", metal: "#e8d7a0", drape: "#131815" },
    headwear: "french",
    collar: "square",
    sleeve: "bell",
    hair: "parted",
    beard: "none",
  },
  {
    id: "jane-seymour",
    build: "gown",
    palette: { cloth: "#7d1f1a", trim: "#e0bb6c", skin: "#f6dcc0", hair: "#c9a86a", metal: "#f1c74f", drape: "#efe8dc" },
    headwear: "gable",
    collar: "square",
    sleeve: "fitted",
    hair: "parted",
    beard: "none",
  },
  {
    id: "anne-of-cleves",
    build: "gown",
    palette: { cloth: "#8c2f3a", trim: "#d9a441", skin: "#f3d2b3", hair: "#6b4226", metal: "#f1c74f", drape: "#efe3cf" },
    headwear: "bonnet",
    collar: "high",
    sleeve: "puff",
    hair: "parted",
    beard: "none",
  },
  {
    id: "katherine-howard",
    build: "gown",
    palette: { cloth: "#9d5f73", trim: "#dcd3c2", skin: "#f7dcc4", hair: "#8a5a32", metal: "#e8d7a0", drape: "#3a2f3d" },
    headwear: "french",
    collar: "square",
    sleeve: "bell",
    hair: "loose",
    beard: "none",
  },
  {
    id: "katherine-parr",
    build: "gown",
    palette: { cloth: "#6d2436", trim: "#c08a3e", skin: "#f2d0b0", hair: "#9a6a3a", metal: "#f1c74f", drape: "#2a2a33" },
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
