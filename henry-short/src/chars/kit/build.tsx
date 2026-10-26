import { shapes } from "./shapes";
import type { Kit, Slot, Style } from "./types";
import type { PartDef, Pose } from "../../rig/types";

// Geometry — boxes, pivots, attachment points — belongs to the build, not the style. Two figures
// in different styles have identical joints, so the same choreography and the same moves drive
// both, and switching the channel's look never touches a short.

const art = (slot: Slot, kit: Kit, style: Style, w: number, h: number, key: string) =>
  Object.fromEntries(
    Object.entries(shapes(slot, { kit, w, h })).map(([v, drawing]) => [
      v,
      // Gradient and hatch ids live in the document, so each part+variant needs its own.
      style.render(drawing, w, h, `${kit.id}-${style.id}-${key}-${v}`),
    ]),
  );

type Limb = { upper: [number, number]; fore: [number, number]; hand: [number, number]; handZ: number };

const arm = (kit: Kit, style: Style, side: "L" | "R", x: number, g: Limb): PartDef => ({
  id: `upper${side}`,
  w: g.upper[0],
  h: g.upper[1],
  pivot: [g.upper[0] / 2, g.upper[1] * 0.16],
  at: [x, g.upper[1] * 0.37],
  z: 1,
  art: art("upper", kit, style, ...g.upper, `upper${side}`),
  children: [
    {
      id: `fore${side}`,
      w: g.fore[0],
      h: g.fore[1],
      pivot: [g.fore[0] / 2, g.fore[1] * 0.07],
      at: [g.upper[0] / 2, g.upper[1] * 0.93],
      art: art("fore", kit, style, ...g.fore, `fore${side}`),
      children: [
        {
          id: `hand${side}`,
          w: g.hand[0],
          h: g.hand[1],
          pivot: [g.hand[0] / 2, g.hand[1] * 0.1],
          at: [g.fore[0] / 2, g.fore[1] * 0.94],
          z: g.handZ,
          art: art("hand", kit, style, ...g.hand, `hand${side}`),
        },
      ],
    },
  ],
});

type FacePart = { slot: "eyes" | "brows" | "mouth"; box: [number, number]; at: [number, number] };

// A gown's mouth hangs off the head; a doublet's hangs off the jaw so it drops when he speaks.
const faceParts = (kit: Kit, style: Style, parts: FacePart[]): PartDef[] =>
  parts.map(({ slot, box, at: pos }) => ({
    id: slot,
    w: box[0],
    h: box[1],
    pivot: [box[0] / 2, box[1] / 2],
    at: pos,
    art: art(slot, kit, style, ...box, slot),
  }));

// ---------------------------------------------------------------- gown

const GOWN_ARM: Limb = { upper: [76, 170], fore: [70, 170], hand: [54, 60], handZ: 0 };

const gown = (kit: Kit, style: Style): PartDef => ({
  id: "torso",
  w: 190,
  h: 250,
  pivot: [95, 250],
  at: [0, 0],
  art: art("torso", kit, style, 190, 250, "torso"),
  children: [
    { id: "skirt", w: 460, h: 580, pivot: [230, 0], at: [95, 232], z: -1, art: art("skirt", kit, style, 460, 580, "skirt") },
    {
      id: "head",
      w: 112,
      h: 140,
      pivot: [56, 134],
      at: [95, 24],
      z: 1,
      art: art("head", kit, style, 112, 140, "head"),
      children: [
        ...(kit.palette.drape
          ? [{ id: "veil", w: 160, h: 184, pivot: [80, 24] as [number, number], at: [56, 32] as [number, number], z: -1, art: art("veil", kit, style, 160, 184, "veil") }]
          : []),
        ...faceParts(kit, style, [
          { slot: "eyes", box: [77, 24], at: [56, 78] },
          { slot: "brows", box: [80, 18], at: [56, 59] },
          { slot: "mouth", box: [40, 21], at: [56, 110] },
        ]),
        ...(kit.headwear === "none"
          ? []
          : [{ id: "haube", w: 200, h: 128, pivot: [100, 120] as [number, number], at: [56, 40] as [number, number], z: 1, art: art("headwear", kit, style, 200, 128, "headwear") }]),
      ],
    },
    arm(kit, style, "L", 26, GOWN_ARM),
    arm(kit, style, "R", 164, GOWN_ARM),
  ],
});

// ---------------------------------------------------------------- doublet

const DOUBLET_ARM: Limb = { upper: [120, 190], fore: [80, 170], hand: [64, 74], handZ: 0 };

const doublet = (kit: Kit, style: Style): PartDef => ({
  id: "torso",
  w: 400,
  h: 430,
  pivot: [200, 430],
  at: [0, 0],
  art: art("torso", kit, style, 400, 430, "torso"),
  children: [
    ...([148, 252] as const).map((x, i): PartDef => ({
      id: `leg${i === 0 ? "L" : "R"}`,
      w: 88,
      h: 400,
      pivot: [44, 10],
      at: [x, 405],
      z: -1,
      art: art("leg", kit, style, 88, 400, `leg${i}`),
    })),
    {
      id: "head",
      w: 136,
      h: 160,
      pivot: [68, 152],
      at: [200, 44],
      z: 1,
      art: art("head", kit, style, 136, 160, "head"),
      children: [
        {
          id: "jaw",
          w: 120,
          h: 76,
          pivot: [60, 8],
          at: [68, 106],
          art: art("jaw", kit, style, 120, 76, "jaw"),
          children: [{ id: "mouth", w: 48, h: 27, pivot: [24, 14], at: [60, 24], art: art("mouth", kit, style, 48, 27, "mouth") }],
        },
        ...faceParts(kit, style, [
          { slot: "eyes", box: [88, 27], at: [68, 77] },
          { slot: "brows", box: [96, 21], at: [68, 54] },
        ]),
        ...(kit.headwear === "none"
          ? []
          : [{ id: "haube", w: 184, h: 72, pivot: [92, 56] as [number, number], at: [68, 29] as [number, number], art: art("headwear", kit, style, 184, 72, "headwear") }]),
      ],
    },
    arm(kit, style, "L", 36, DOUBLET_ARM),
    arm(kit, style, "R", 364, DOUBLET_ARM),
  ],
});

// Arms down, a touch away from the body — the stance every move departs from.
const REST: Record<Kit["build"], Pose> = {
  gown: { upperL: { r: 8 }, upperR: { r: -8 } },
  doublet: { upperL: { r: 10 }, upperR: { r: -10 }, foreL: { r: -4 }, foreR: { r: 4 } },
};

// How far below the root pivot the figure meets the floor, in part units: a gown's hem, a man's feet.
export const DROP: Record<Kit["build"], number> = { gown: 562, doublet: 365 };

export const buildFigure = (kit: Kit, style: Style): { def: PartDef; rest: Pose; drop: number } => ({
  def: kit.build === "gown" ? gown(kit, style) : doublet(kit, style),
  rest: REST[kit.build],
  drop: DROP[kit.build],
});
