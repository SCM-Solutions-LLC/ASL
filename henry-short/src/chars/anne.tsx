import type { PartDef, Pose } from "../rig/types";
import { brows, eyes, mouths, svg } from "./placeholder";

const RED = "#8e1b2a";
const GOLD = "#d8a93b";
const SKIN = "#f3d2b3";
const HAIR = "#6b4226";

const arm = (side: "L" | "R", x: number): PartDef => ({
  id: `upper${side}`,
  w: 76,
  h: 170,
  pivot: [38, 20],
  at: [x, 40],
  z: 1,
  art: { default: svg(76, 170, <rect x={6} y={4} width={64} height={160} rx={30} fill={RED} />) },
  children: [
    {
      id: `fore${side}`,
      w: 70,
      h: 170,
      pivot: [35, 10],
      at: [38, 158],
      art: {
        default: svg(70, 170, (
          <>
            <path d="M14 4 L56 4 L68 164 L2 164 Z" fill={RED} />
            <path d="M8 120 L62 120 L68 164 L2 164 Z" fill={GOLD} />
          </>
        )),
      },
      children: [
        {
          id: `hand${side}`,
          w: 54,
          h: 60,
          pivot: [27, 6],
          at: [35, 160],
          z: -1,
          art: { default: svg(54, 60, <rect x={6} y={4} width={42} height={52} rx={18} fill={SKIN} />) },
        },
      ],
    },
  ],
});

// Neutral pose. The German headdress (Haube) is its own part so it can bounce on head turns.
export const anne: PartDef = {
  id: "torso",
  w: 190,
  h: 250,
  pivot: [95, 250],
  at: [0, 0],
  art: {
    default: svg(190, 250, (
      <>
        <path d="M18 18 L172 18 L150 250 L40 250 Z" fill={RED} />
        <path d="M44 18 L146 18 L140 58 L50 58 Z" fill={SKIN} />
        <path d="M70 58 L120 58 L95 250 Z" fill={GOLD} />
      </>
    )),
  },
  children: [
    {
      id: "skirt",
      w: 460,
      h: 580,
      pivot: [230, 0],
      at: [95, 232],
      z: -1,
      art: {
        default: svg(460, 580, (
          <>
            <path d="M150 0 L310 0 L455 575 L5 575 Z" fill={RED} />
            <path d="M200 6 L260 6 L330 575 L130 575 Z" fill={GOLD} />
          </>
        )),
      },
    },
    {
      id: "head",
      w: 140,
      h: 175,
      pivot: [70, 168],
      at: [95, 24],
      z: 1,
      art: {
        default: svg(140, 175, (
          <>
            <ellipse cx={70} cy={96} rx={62} ry={76} fill={SKIN} />
            <path d="M10 70 Q14 30 40 26 L40 110 Z M130 70 Q126 30 100 26 L100 110 Z" fill={HAIR} />
          </>
        )),
      },
      children: [
        {
          id: "veil",
          w: 200,
          h: 230,
          pivot: [100, 30],
          at: [70, 40],
          z: -1,
          art: { default: svg(200, 230, <path d="M30 10 L170 10 L196 226 L4 226 Z" fill="#2b2b3a" />) },
        },
        { id: "eyes", w: 96, h: 30, pivot: [48, 15], at: [70, 98], art: eyes(96, 30, 46) },
        { id: "brows", w: 100, h: 22, pivot: [50, 11], at: [70, 74], art: brows(100, 22, 46, HAIR) },
        { id: "mouth", w: 50, h: 26, pivot: [25, 13], at: [70, 138], art: mouths(50, 26) },
        {
          id: "haube",
          w: 250,
          h: 160,
          pivot: [125, 150],
          at: [70, 50],
          z: 1,
          art: {
            default: svg(250, 160, (
              <>
                <path d="M6 150 Q20 40 125 30 Q230 40 244 150 Z" fill={GOLD} />
                <path d="M30 150 Q125 110 220 150" fill="none" stroke="#7a4f12" strokeWidth={10} />
              </>
            )),
          },
          children: [
            {
              id: "crown",
              w: 90,
              h: 52,
              pivot: [45, 50],
              at: [125, 36],
              art: { default: svg(90, 52, <path d="M6 48 L10 10 L28 30 L45 4 L62 30 L80 10 L84 48 Z" fill="#f1c74f" />) },
            },
          ],
        },
      ],
    },
    arm("L", 26),
    arm("R", 164),
  ],
};

export const anneRest: Pose = {
  upperL: { r: 8 },
  upperR: { r: -8 },
  mouth: { v: "smirk" },
};

export const anneHipsHands: Pose = {
  upperL: { r: 48 },
  foreL: { r: -95 },
  upperR: { r: -48 },
  foreR: { r: 95 },
};
