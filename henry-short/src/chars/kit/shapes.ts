import type { Drawing, Shape, ShapeCtx, Slot } from "./types";

// The channel's shape vocabulary: what a figure is made of, with no opinion on how it is drawn.
// Styles render these; they never redefine them. That is what makes a style a one-file addition
// instead of a redraw of the whole cast.
//
// Paths are written in fractions of the part's box — X0.5 is the middle, Y1 the bottom — so the
// same silhouette serves a 76px sleeve on a gown and a 120px sleeve on a doublet.
const at = (w: number, h: number, spec: string) =>
  spec
    .replace(/X(-?[\d.]+)/g, (_, v) => (Number(v) * w).toFixed(1))
    .replace(/Y(-?[\d.]+)/g, (_, v) => (Number(v) * h).toFixed(1));

// Hose and shoe are period facts rather than per-figure choices, so they are not palette entries.
const HOSE = "#efe8dc";
// Gable lappets and a Tudor flat cap are black velvet whoever is wearing them, so they are not a
// palette choice — using the figure's drape here turned Jane's hood into an empty outline.
const VELVET = "#262430";
const LEATHER = "#241c17";
const WHITE = "#fdfbf6";

// A narrower skull and a real jaw. A head as wide as the shoulders, which is what this was, is the
// single strongest cue that a figure is meant for children.
const face = (p: ShapeCtx["kit"]["palette"], w: number, h: number): Shape[] => [
  {
    d: at(w, h, "M X0.5 Y0.07 Q X0.9 Y0.07 X0.9 Y0.48 Q X0.89 Y0.73 X0.74 Y0.89 Q X0.61 Y0.99 X0.5 Y0.99 Q X0.39 Y0.99 X0.26 Y0.89 Q X0.11 Y0.73 X0.1 Y0.48 Q X0.1 Y0.07 X0.5 Y0.07 Z"),
    fill: p.skin,
  },
  // Nose and the shadow under the brow: two strokes, but they are what stop a face reading as a toy.
  { d: at(w, h, "M X0.51 Y0.52 Q X0.57 Y0.68 X0.46 Y0.71"), width: 0.5 },
];

// Hair frames the face from behind the hairline, so it reads at thumbnail size without detail.
const hair = (k: ShapeCtx["kit"], w: number, h: number): Shape[] => {
  const fill = k.palette.hair;
  const cap = at(w, h, "M X0.04 Y0.53 Q X0.04 Y0.08 X0.5 Y0.08 Q X0.96 Y0.08 X0.96 Y0.53 Q X0.88 Y0.3 X0.5 Y0.3 Q X0.12 Y0.3 X0.04 Y0.53 Z");
  if (k.hair === "cropped") return [{ d: cap, fill }];
  const parted = [{ d: cap, fill }, { d: at(w, h, "M X0.5 Y0.09 L X0.5 Y0.29"), width: 0.5 }];
  if (k.hair === "parted") return parted;
  // Loose adds a fall of hair down each side of the jaw.
  return [
    ...parted,
    { d: at(w, h, "M X0.05 Y0.4 Q X-0.01 Y0.72 X0.08 Y0.88 Q X0.18 Y0.8 X0.16 Y0.46 Z"), fill },
    { d: at(w, h, "M X0.95 Y0.4 Q X1.01 Y0.72 X0.92 Y0.88 Q X0.82 Y0.8 X0.84 Y0.46 Z"), fill },
  ];
};

const collar = (k: ShapeCtx["kit"], w: number, h: number): Shape[] => {
  const { trim, drape } = k.palette;
  switch (k.collar) {
    case "square":
      return [{ d: at(w, h, "M X0.26 Y0.08 L X0.74 Y0.08 L X0.74 Y0.15 Q X0.5 Y0.22 X0.26 Y0.15 Z"), fill: trim }];
    case "fur":
      return [{ d: at(w, h, "M X0.1 Y0.13 Q X0.5 Y0.02 X0.9 Y0.13 L X0.85 Y0.29 Q X0.5 Y0.17 X0.15 Y0.29 Z"), fill: drape ?? WHITE }];
    case "high":
      return [{ d: at(w, h, "M X0.38 Y0.03 L X0.62 Y0.03 L X0.64 Y0.17 L X0.36 Y0.17 Z"), fill: trim }];
    default:
      return [];
  }
};

// Each headwear is a different outline at thumbnail size — that silhouette, not the face, is how a
// viewer tells one figure from another while scrolling.
const headwear = (k: ShapeCtx["kit"], w: number, h: number): Shape[] => {
  const { trim, metal } = k.palette;
  switch (k.headwear) {
    case "gable":
      return [
        { d: at(w, h, "M X0.5 Y0.06 L X0.95 Y0.7 L X0.95 Y0.93 L X0.05 Y0.93 L X0.05 Y0.7 Z"), fill: trim },
        { d: at(w, h, "M X0.5 Y0.24 L X0.79 Y0.7 L X0.21 Y0.7 Z"), fill: VELVET },
        { d: at(w, h, "M X0.05 Y0.78 L X0.95 Y0.78"), width: 0.7 },
      ];
    case "french":
      return [
        { d: at(w, h, "M X0.09 Y0.93 Q X0.1 Y0.27 X0.5 Y0.21 Q X0.9 Y0.27 X0.91 Y0.93 L X0.78 Y0.93 Q X0.77 Y0.47 X0.5 Y0.41 Q X0.23 Y0.47 X0.22 Y0.93 Z"), fill: trim },
      ];
    case "hood":
      return [{ d: at(w, h, "M X0.03 Y0.93 Q X0.09 Y0.2 X0.5 Y0.14 Q X0.91 Y0.2 X0.97 Y0.93 Z"), fill: trim }];
    case "coronet":
      return [
        { d: at(w, h, "M X0.17 Y0.93 L X0.17 Y0.56 L X0.29 Y0.73 L X0.38 Y0.44 L X0.5 Y0.7 L X0.62 Y0.44 L X0.71 Y0.73 L X0.83 Y0.56 L X0.83 Y0.93 Z"), fill: metal, flat: true },
        { d: at(w, h, "M X0.17 Y0.82 L X0.83 Y0.82"), width: 0.7 },
      ];
    case "bonnet":
      return [{ d: at(w, h, "M X0.11 Y0.88 Q X0.5 Y0.31 X0.89 Y0.88 Q X0.5 Y1 X0.11 Y0.88 Z"), fill: trim }];
    case "flatcap":
      return [
        { d: at(w, h, "M X0.07 Y0.6 Q X0.5 Y0.04 X0.93 Y0.6 Q X0.5 Y0.94 X0.07 Y0.6 Z"), fill: VELVET },
        { d: at(w, h, "M X0.1 Y0.5 Q X0.22 Y-0.05 X0.46 Y0.26"), fill: WHITE, width: 0.6 },
        { d: at(w, h, "M X0.36 Y0.58 L X0.37 Y0.58"), stroke: metal, width: 2.2 },
        { d: at(w, h, "M X0.62 Y0.58 L X0.63 Y0.58"), stroke: metal, width: 2.2 },
      ];
    default:
      return [];
  }
};

const sleeve = (k: ShapeCtx["kit"], w: number, h: number): Shape[] => {
  const { cloth, trim } = k.palette;
  const body =
    k.sleeve === "puff"
      ? "M X0.5 Y0.01 Q X0.98 Y0.04 X0.95 Y0.28 Q X0.93 Y0.42 X0.78 Y0.46 L X0.8 Y0.96 Q X0.5 Y1.02 X0.2 Y0.96 L X0.22 Y0.46 Q X0.07 Y0.42 X0.05 Y0.28 Q X0.02 Y0.04 X0.5 Y0.01 Z"
      : k.sleeve === "bell"
        ? "M X0.5 Y0.02 Q X0.82 Y0.06 X0.79 Y0.26 L X0.92 Y0.94 Q X0.5 Y1.02 X0.08 Y0.94 L X0.21 Y0.26 Q X0.18 Y0.06 X0.5 Y0.02 Z"
        : "M X0.5 Y0.02 Q X0.87 Y0.06 X0.84 Y0.32 L X0.79 Y0.96 Q X0.5 Y1.02 X0.21 Y0.96 L X0.16 Y0.32 Q X0.13 Y0.06 X0.5 Y0.02 Z";
  const slash =
    k.sleeve === "puff"
      ? [{ d: at(w, h, "M X0.3 Y0.12 Q X0.5 Y0.2 X0.7 Y0.12"), fill: trim, width: 0.6 }]
      : [];
  return [{ d: at(w, h, body), fill: cloth }, ...slash];
};

const forearm = (k: ShapeCtx["kit"], w: number, h: number): Shape[] => {
  const { cloth, trim } = k.palette;
  // A bell sleeve hangs well past the wrist; the others end in a turned-back cuff.
  if (k.sleeve === "bell") {
    return [
      { d: at(w, h, "M X0.2 Y0.02 Q X0.5 Y-0.03 X0.8 Y0.02 L X0.92 Y0.6 L X0.96 Y0.84 Q X0.5 Y0.93 X0.04 Y0.84 L X0.08 Y0.6 Z"), fill: cloth },
      { d: at(w, h, "M X0.08 Y0.6 L X0.92 Y0.6 L X0.96 Y0.84 Q X0.5 Y0.93 X0.04 Y0.84 Z"), fill: trim },
    ];
  }
  return [
    { d: at(w, h, "M X0.2 Y0.02 Q X0.5 Y-0.03 X0.8 Y0.02 L X0.86 Y0.89 Q X0.5 Y0.98 X0.14 Y0.89 Z"), fill: cloth },
    { d: at(w, h, "M X0.155 Y0.71 Q X0.5 Y0.79 X0.845 Y0.71 L X0.86 Y0.89 Q X0.5 Y0.98 X0.14 Y0.89 Z"), fill: trim },
  ];
};

// Face parts are drawn into a box centred on the part's pivot, so a head turn carries them along.
const eyeSet = (p: ShapeCtx["kit"]["palette"], w: number, h: number): Record<string, Drawing> => {
  const cy = h / 2;
  const gap = w * 0.48;
  const l = w / 2 - gap / 2;
  const r = w / 2 + gap / 2;
  const rx = w * 0.105;
  const ry = h * 0.27;
  const almond = (cx: number, s: number) =>
    `M ${cx - rx * s} ${cy} Q ${cx} ${cy - ry * s * 1.3} ${cx + rx * s} ${cy} Q ${cx} ${cy + ry * s} ${cx - rx * s} ${cy} Z`;
  const open = (dx: number, s = 1): Drawing => [
    { d: almond(l, s), fill: WHITE, flat: true, width: 0.5 },
    { d: almond(r, s), fill: WHITE, flat: true, width: 0.5 },
    { d: dot(l + dx, cy, w * 0.036 * s), fill: p.hair, width: 0, flat: true },
    { d: dot(r + dx, cy, w * 0.036 * s), fill: p.hair, width: 0, flat: true },
    // Upper lid, drawn over the eye — the line that gives an adult face its weight.
    { d: `M ${l - rx * s} ${cy} Q ${l} ${cy - ry * s * 1.35} ${l + rx * s} ${cy}`, width: 0.65 },
    { d: `M ${r - rx * s} ${cy} Q ${r} ${cy - ry * s * 1.35} ${r + rx * s} ${cy}`, width: 0.65 },
  ];
  const shut = (cx: number): Shape => ({ d: `M ${cx - rx} ${cy} Q ${cx} ${cy + ry * 0.6} ${cx + rx} ${cy}` });
  return {
    default: open(0),
    side: open(w * 0.05),
    wide: open(0, 1.22),
    closed: [shut(l), shut(r)],
    wink: [open(w * 0.03)[0], open(w * 0.03)[2], open(w * 0.03)[4], shut(r)],
  };
};

const dot = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

const browSet = (p: ShapeCtx["kit"]["palette"], w: number, h: number): Record<string, Drawing> => {
  const cy = h / 2;
  const gap = w * 0.46;
  const l = w / 2 - gap / 2;
  const r = w / 2 + gap / 2;
  const e = w * 0.14;
  const line = (cx: number, lift: number, tilt: number): Shape => ({
    d: `M ${cx - e} ${cy + lift + tilt} Q ${cx} ${cy + lift - h * 0.3} ${cx + e} ${cy + lift - tilt}`,
    stroke: p.hair,
    width: 1.05,
  });
  return {
    default: [line(l, 0, 0), line(r, 0, 0)],
    angry: [line(l, 0, -h * 0.28), line(r, 0, h * 0.28)],
    raised: [line(l, -h * 0.25, 0), line(r, -h * 0.25, 0)],
    smug: [line(l, h * 0.1, 0), line(r, -h * 0.3, h * 0.1)],
  };
};

const mouthSet = (w: number, h: number): Record<string, Drawing> => {
  const cy = h / 2;
  return {
    default: [{ d: at(w, h, "M X0.2 Y0.5 Q X0.5 Y0.58 X0.8 Y0.5") }],
    frown: [{ d: at(w, h, "M X0.2 Y0.72 Q X0.5 Y0.26 X0.8 Y0.72") }],
    smirk: [{ d: at(w, h, "M X0.18 Y0.58 Q X0.55 Y0.68 X0.86 Y0.26") }],
    smile: [{ d: at(w, h, "M X0.15 Y0.38 Q X0.5 Y0.96 X0.85 Y0.38") }],
    open: [{ d: `M ${w * 0.26} ${cy} Q ${w * 0.5} ${cy - h * 0.46} ${w * 0.74} ${cy} Q ${w * 0.5} ${cy + h * 0.5} ${w * 0.26} ${cy} Z`, fill: "#5a1a1a" }],
  };
};

// ---------------------------------------------------------------- the two builds

const gown = (slot: Slot, { kit: k, w, h }: ShapeCtx): Record<string, Drawing> => {
  const p = k.palette;
  switch (slot) {
    case "torso":
      return {
        default: [
          { d: at(w, h, "M X0.13 Y0.14 Q X0.5 Y0.03 X0.87 Y0.14 L X0.8 Y1 L X0.2 Y1 Z"), fill: p.cloth },
          { d: at(w, h, "M X0.27 Y0.1 L X0.73 Y0.1 L X0.72 Y0.23 Q X0.5 Y0.3 X0.28 Y0.23 Z"), fill: p.skin },
          { d: at(w, h, "M X0.34 Y0.24 Q X0.5 Y0.3 X0.66 Y0.24 L X0.61 Y1 L X0.39 Y1 Z"), fill: p.trim },
          ...collar(k, w, h),
        ],
      };
    case "skirt":
      return {
        default: [
          { d: at(w, h, "M X0.33 Y0 Q X0.5 Y-0.015 X0.67 Y0 L X0.98 Y0.965 Q X0.5 Y1.02 X0.02 Y0.965 Z"), fill: p.cloth },
          { d: at(w, h, "M X0.43 Y0.004 Q X0.5 Y-0.008 X0.57 Y0.004 L X0.72 Y0.983 Q X0.5 Y1.005 X0.28 Y0.983 Z"), fill: p.trim },
          { d: at(w, h, "M X0.36 Y0.06 Q X0.3 Y0.55 X0.14 Y0.95"), width: 0.45 },
          { d: at(w, h, "M X0.64 Y0.06 Q X0.7 Y0.55 X0.86 Y0.95"), width: 0.45 },
        ],
      };
    case "upper":
      return { default: sleeve(k, w, h) };
    case "fore":
      return { default: forearm(k, w, h) };
    case "hand":
      return {
        default: [{ d: at(w, h, "M X0.22 Y0.13 Q X0.5 Y0.01 X0.78 Y0.13 L X0.85 Y0.7 Q X0.5 Y0.93 X0.15 Y0.7 Z"), fill: p.skin }],
        point: [
          { d: at(w, h, "M X0.26 Y0.33 Q X0.5 Y0.22 X0.74 Y0.33 L X0.81 Y0.78 Q X0.5 Y0.97 X0.19 Y0.78 Z"), fill: p.skin },
          { d: at(w, h, "M X0.37 Y0.35 L X0.37 Y0.06 Q X0.5 Y-0.03 X0.63 Y0.06 L X0.63 Y0.35 Z"), fill: p.skin },
        ],
      };
    case "head":
      return { default: [...face(p, w, h), ...hair(k, w, h)] };
    case "veil":
      return { default: [{ d: at(w, h, "M X0.14 Y0.03 Q X0.5 Y-0.03 X0.86 Y0.03 L X0.98 Y0.96 Q X0.5 Y1.03 X0.02 Y0.96 Z"), fill: p.drape ?? p.trim }] };
    case "headwear":
      return { default: headwear(k, w, h) };
    case "eyes":
      return eyeSet(p, w, h);
    case "brows":
      return browSet(p, w, h);
    case "mouth":
      return mouthSet(w, h);
    default:
      return { default: [] };
  }
};

const doublet = (slot: Slot, { kit: k, w, h }: ShapeCtx): Record<string, Drawing> => {
  const p = k.palette;
  switch (slot) {
    case "torso":
      return {
        default: [
          // The base — the stiff skirt of the doublet — sits behind the body so the belt reads over it.
          { d: at(w, h, "M X0.07 Y0.73 L X0.93 Y0.73 L X0.985 Y0.99 L X0.015 Y0.99 Z"), fill: p.cloth },
          { d: at(w, h, "M X0.14 Y0.1 Q X0.5 Y0 X0.86 Y0.1 L X0.935 Y0.76 Q X0.5 Y0.84 X0.065 Y0.76 Z"), fill: p.cloth },
          { d: at(w, h, "M X0.41 Y0.11 L X0.59 Y0.11 L X0.605 Y0.77 L X0.395 Y0.77 Z"), fill: p.trim },
          { d: at(w, h, "M X0.245 Y0.065 L X0.395 Y0.77 L X0.29 Y0.77 L X0.135 Y0.112 Z"), fill: p.drape ?? WHITE },
          { d: at(w, h, "M X0.755 Y0.065 L X0.605 Y0.77 L X0.71 Y0.77 L X0.865 Y0.112 Z"), fill: p.drape ?? WHITE },
          { d: at(w, h, "M X0.065 Y0.7 Q X0.5 Y0.78 X0.935 Y0.7 L X0.935 Y0.75 Q X0.5 Y0.83 X0.065 Y0.75 Z"), fill: p.metal, flat: true },
          ...collar(k, w, h),
        ],
      };
    case "leg":
      return {
        default: [
          { d: at(w, h, "M X0.12 Y0 L X0.88 Y0 Q X0.96 Y0.46 X0.84 Y0.91 L X0.16 Y0.91 Q X0.04 Y0.46 X0.12 Y0 Z"), fill: HOSE },
          { d: at(w, h, "M X0.03 Y0.9 Q X0.5 Y0.875 X0.97 Y0.9 L X0.97 Y0.965 Q X0.5 Y0.995 X0.03 Y0.965 Z"), fill: LEATHER },
        ],
      };
    case "upper":
      return { default: sleeve(k, w, h) };
    case "fore":
      return { default: forearm(k, w, h) };
    case "hand":
      return {
        default: [{ d: at(w, h, "M X0.22 Y0.11 Q X0.5 Y0.01 X0.78 Y0.11 L X0.85 Y0.72 Q X0.5 Y0.94 X0.15 Y0.72 Z"), fill: p.skin }],
        point: [
          { d: at(w, h, "M X0.26 Y0.3 Q X0.5 Y0.2 X0.74 Y0.3 L X0.81 Y0.8 Q X0.5 Y0.97 X0.19 Y0.8 Z"), fill: p.skin },
          { d: at(w, h, "M X0.37 Y0.32 L X0.37 Y0.05 Q X0.5 Y-0.03 X0.63 Y0.05 L X0.63 Y0.32 Z"), fill: p.skin },
        ],
      };
    case "head":
      return { default: [...face(p, w, h), ...hair(k, w, h)] };
    case "jaw": {
      const beard =
        k.beard === "full"
          ? "M X0.03 Y0.08 Q X0.5 Y-0.06 X0.97 Y0.08 Q X0.95 Y0.82 X0.5 Y0.97 Q X0.05 Y0.82 X0.03 Y0.08 Z"
          : k.beard === "trim"
            ? "M X0.11 Y0.1 Q X0.5 Y-0.01 X0.89 Y0.1 Q X0.87 Y0.65 X0.5 Y0.78 Q X0.13 Y0.65 X0.11 Y0.1 Z"
            : "M X0.07 Y0.06 Q X0.5 Y-0.04 X0.93 Y0.06 Q X0.91 Y0.63 X0.5 Y0.76 Q X0.09 Y0.63 X0.07 Y0.06 Z";
      return { default: [{ d: at(w, h, beard), fill: k.beard === "none" ? p.skin : p.hair }] };
    }
    case "headwear":
      return { default: headwear(k, w, h) };
    case "eyes":
      return eyeSet(p, w, h);
    case "brows":
      return browSet(p, w, h);
    case "mouth":
      return mouthSet(w, h);
    default:
      return { default: [] };
  }
};

export const shapes = (slot: Slot, ctx: ShapeCtx): Record<string, Drawing> =>
  ctx.kit.build === "gown" ? gown(slot, ctx) : doublet(slot, ctx);
