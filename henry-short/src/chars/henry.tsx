import type { PartDef, Pose } from "../rig/types";
import { brows, eyes, mouths, SKIN, svg } from "./placeholder";

const CRIMSON = "#9b1d2a";
const GOLD = "#d8a93b";
const FUR = "#f2ede4";
const BEARD = "#b5562b";

const arm = (side: "L" | "R", x: number): PartDef => ({
  id: `upper${side}`,
  w: 120,
  h: 190,
  pivot: [60, 30],
  at: [x, 70],
  z: 1,
  art: {
    default: svg(120, 190, (
      <>
        <rect x={6} y={6} width={108} height={178} rx={52} fill={CRIMSON} />
        <path d="M40 30 L40 160 M80 30 L80 160" stroke={GOLD} strokeWidth={9} />
      </>
    )),
  },
  children: [
    {
      id: `fore${side}`,
      w: 80,
      h: 170,
      pivot: [40, 12],
      at: [60, 172],
      art: { default: svg(80, 170, <rect x={6} y={4} width={68} height={160} rx={24} fill={GOLD} />) },
      children: [
        {
          id: `hand${side}`,
          w: 64,
          h: 74,
          pivot: [32, 8],
          at: [40, 160],
          art: {
            default: svg(64, 74, <rect x={6} y={4} width={52} height={64} rx={22} fill={SKIN} />),
            point: svg(64, 74, (
              <>
                <rect x={6} y={4} width={52} height={50} rx={20} fill={SKIN} />
                <rect x={22} y={40} width={16} height={34} rx={8} fill={SKIN} />
              </>
            )),
          },
        },
      ],
    },
  ],
});

// Neutral A-pose. The real kit must be drawn in this pose, one PNG per part, same boxes and pivots.
export const henry: PartDef = {
  id: "torso",
  w: 400,
  h: 430,
  pivot: [200, 430],
  at: [0, 0],
  art: {
    default: svg(400, 430, (
      <>
        <path d="M30 318 L370 318 L392 426 L8 426 Z" fill="#7a1420" />
        <path d="M60 40 Q200 0 340 40 L372 330 Q200 360 28 330 Z" fill={CRIMSON} />
        <rect x={165} y={40} width={70} height={290} fill={GOLD} />
        <path d="M100 30 L160 330 L118 330 L58 48 Z" fill={FUR} />
        <path d="M300 30 L240 330 L282 330 L342 48 Z" fill={FUR} />
      </>
    )),
  },
  children: [
    ...(["L", "R"] as const).map((s, i): PartDef => ({
      id: `leg${s}`,
      w: 84,
      h: 300,
      pivot: [42, 10],
      at: [i === 0 ? 150 : 250, 405],
      z: -1,
      art: {
        default: svg(84, 300, (
          <>
            <rect x={10} y={0} width={64} height={268} rx={18} fill={FUR} />
            <rect x={2} y={258} width={80} height={38} rx={16} fill="#1b1b1b" />
          </>
        )),
      },
    })),
    {
      id: "head",
      w: 170,
      h: 200,
      pivot: [85, 190],
      at: [200, 44],
      z: 1,
      art: { default: svg(170, 200, <ellipse cx={85} cy={110} rx={74} ry={86} fill={SKIN} />) },
      children: [
        {
          id: "jaw",
          w: 150,
          h: 95,
          pivot: [75, 10],
          at: [85, 132],
          art: { default: svg(150, 95, <path d="M5 10 Q75 -4 145 10 Q140 80 75 92 Q10 80 5 10 Z" fill={BEARD} />) },
          children: [{ id: "mouth", w: 60, h: 34, pivot: [30, 17], at: [75, 30], art: mouths(60, 34) }],
        },
        { id: "eyes", w: 110, h: 34, pivot: [55, 17], at: [85, 96], art: eyes(110, 34, 52) },
        { id: "brows", w: 120, h: 26, pivot: [60, 13], at: [85, 68], art: brows(120, 26, 54, BEARD) },
        {
          id: "cap",
          w: 230,
          h: 90,
          pivot: [115, 70],
          at: [85, 36],
          art: {
            default: svg(230, 90, (
              <>
                <path d="M10 40 Q30 -10 70 30" fill={FUR} />
                <ellipse cx={115} cy={52} rx={108} ry={30} fill="#141414" />
                <circle cx={80} cy={52} r={6} fill={GOLD} />
                <circle cx={150} cy={52} r={6} fill={GOLD} />
              </>
            )),
          },
        },
      ],
    },
    arm("L", 36),
    arm("R", 364),
  ],
};

export const henryRest: Pose = {
  upperL: { r: 10 },
  upperR: { r: -10 },
  foreL: { r: -4 },
  foreR: { r: 4 },
};
