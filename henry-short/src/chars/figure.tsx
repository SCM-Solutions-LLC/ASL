import type { PartDef, Pose } from "../rig/types";
import { brows, eyes, mouths, svg } from "./placeholder";

// A gowned figure, built from a palette so each person in the channel gets their own kit without
// a new part spec. Proportions and part ids match the hand-built rigs in anne.tsx and henry.tsx,
// so the same choreography and the same moves work on all of them.
//
// Headwear is the silhouette that distinguishes one figure from another at thumbnail size: the
// shape, not the face, is what a viewer recognises while scrolling.
export type Palette = {
  gown: string;
  trim: string;
  skin: string;
  hair: string;
  /** Behind the head: a veil, a hood, a cap. Drawn as a simple block of colour. */
  drape?: string;
  headwear: "gable" | "hood" | "coronet" | "none";
};

const arm = (p: Palette, side: "L" | "R", x: number): PartDef => ({
  id: `upper${side}`,
  w: 76,
  h: 170,
  pivot: [38, 20],
  at: [x, 40],
  z: 1,
  art: { default: svg(76, 170, <rect x={6} y={4} width={64} height={160} rx={30} fill={p.gown} />) },
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
            <path d="M14 4 L56 4 L68 164 L2 164 Z" fill={p.gown} />
            <path d="M8 120 L62 120 L68 164 L2 164 Z" fill={p.trim} />
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
          art: {
            default: svg(54, 60, <rect x={6} y={4} width={42} height={52} rx={18} fill={p.skin} />),
            point: svg(54, 60, (
              <>
                <rect x={6} y={14} width={42} height={42} rx={16} fill={p.skin} />
                <rect x={20} y={0} width={16} height={26} rx={8} fill={p.skin} />
              </>
            )),
          },
        },
      ],
    },
  ],
});

const hat = (p: Palette): PartDef[] => {
  if (p.headwear === "none") return [];
  const art =
    p.headwear === "gable"
      ? svg(250, 160, (
          <>
            <path d="M125 14 L240 120 L240 152 L10 152 L10 120 Z" fill={p.trim} />
            <path d="M125 40 L200 118 L50 118 Z" fill="#2b2b3a" />
          </>
        ))
      : p.headwear === "hood"
        ? svg(250, 160, <path d="M8 152 Q22 34 125 24 Q228 34 242 152 Z" fill={p.trim} />)
        : svg(250, 160, (
            <>
              <path d="M40 152 L40 96 L70 120 L95 76 L125 118 L155 76 L180 120 L210 96 L210 152 Z" fill={p.trim} />
              <rect x={40} y={134} width={170} height={18} fill="#b8860b" />
            </>
          ));
  return [{ id: "haube", w: 250, h: 160, pivot: [125, 150], at: [70, 50], z: 1, art: { default: art } }];
};

export const figure = (p: Palette): PartDef => ({
  id: "torso",
  w: 190,
  h: 250,
  pivot: [95, 250],
  at: [0, 0],
  art: {
    default: svg(190, 250, (
      <>
        <path d="M18 18 L172 18 L150 250 L40 250 Z" fill={p.gown} />
        <path d="M44 18 L146 18 L140 58 L50 58 Z" fill={p.skin} />
        <path d="M70 58 L120 58 L95 250 Z" fill={p.trim} />
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
            <path d="M150 0 L310 0 L455 575 L5 575 Z" fill={p.gown} />
            <path d="M200 6 L260 6 L330 575 L130 575 Z" fill={p.trim} />
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
            <ellipse cx={70} cy={96} rx={62} ry={76} fill={p.skin} />
            <path d="M10 70 Q14 30 40 26 L40 110 Z M130 70 Q126 30 100 26 L100 110 Z" fill={p.hair} />
          </>
        )),
      },
      children: [
        ...(p.drape
          ? [
              {
                id: "veil",
                w: 200,
                h: 230,
                pivot: [100, 30] as [number, number],
                at: [70, 40] as [number, number],
                z: -1,
                art: { default: svg(200, 230, <path d="M30 10 L170 10 L196 226 L4 226 Z" fill={p.drape} />) },
              },
            ]
          : []),
        { id: "eyes", w: 96, h: 30, pivot: [48, 15], at: [70, 98], art: eyes(96, 30, 46) },
        { id: "brows", w: 100, h: 22, pivot: [50, 11], at: [70, 74], art: brows(100, 22, 46, p.hair) },
        { id: "mouth", w: 50, h: 26, pivot: [25, 13], at: [70, 138], art: mouths(50, 26) },
        ...hat(p),
      ],
    },
    arm(p, "L", 26),
    arm(p, "R", 164),
  ],
});

// Arms down, hands clasped — the default stance everything else departs from.
export const figureRest: Pose = { upperL: { r: 8 }, upperR: { r: -8 } };
