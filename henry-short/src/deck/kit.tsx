import React from "react";
import {
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MARKER } from "../fonts";

// The card-deck look: a short told as a stack of collage cards. The picture changes about every two
// and a half seconds, every picture is a real one cut out like paper and pasted down, and each card
// carries one keyword written in marker. A short supplies its pictures and its cards; everything a
// card is made of lives here.

// Cards are drawn on a 1080×1380 board. 9:16 shows it at full size above the captions; 16:9
// shows the same board scaled to the height it has.
export const BOARD = { w: 1080, h: 1380 };
export const PAPER = "#fbf6ea";
export const INK = "#1d1208";
export const YELLOW = "#ffd23f";
export const CORAL = "#f26b5b";
export const TEAL = "#17a398";

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export const ramp = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
export const pop = (f: number, at: number, over = 7) =>
  interpolate(f, [at, at + over], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(2.2)),
  });
export const fmt = (n: number) => n.toLocaleString("en-US");

// Marker strokes redrawn by hand never line up twice. Displacing them by a noise field that changes
// a few times a second makes the lettering "boil" while a card holds.
const BOIL = 3;
export const Boil: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    {Array.from({ length: BOIL }, (_, i) => (
      <filter
        key={i}
        id={`boil${i}`}
        x="-5%"
        y="-5%"
        width="110%"
        height="110%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency={0.012}
          numOctaves={2}
          seed={i * 7 + 3}
        />
        <feDisplacementMap in="SourceGraphic" scale={9} />
      </filter>
    ))}
  </svg>
);
export const useBoil = () =>
  `url(#boil${Math.floor(useCurrentFrame() / 5) % BOIL})`;

// Paper pieces are moved by hand between exposures, so nothing sits perfectly still: every piece
// is nudged a hair on a new pose a few times a second, the way stop-motion cutouts are.
export const useJitter = (seed: string, amount = 1) => {
  const step = Math.floor(useCurrentFrame() / 6);
  const r = (k: string) => random(`${seed}-${k}-${step}`) - 0.5;
  return {
    dx: r("x") * 5 * amount,
    dy: r("y") * 5 * amount,
    rot: r("r") * 1.1 * amount,
  };
};

// One card. It pops in slightly rotated, drifts while it holds, and is gone when the next arrives.
// Behind the pictures lies a sheet of coloured paper, torn a little off square.
export const Shot: React.FC<{
  from: number;
  to: number;
  tilt?: number;
  sheet?: string;
  children: React.ReactNode;
}> = ({ from, to, tilt = 0, sheet, children }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const e = pop(f, from);
  const drift = interpolate(f, [from, to], [1, 1.05]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: PAPER,
        scale: `${(0.8 + 0.2 * e) * drift}`,
        rotate: `${tilt * (3 - 2 * e)}deg`,
        opacity: interpolate(f, [from, from + 2], [0, 1], clamp),
      }}
    >
      {sheet && (
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 150,
            width: 1000,
            height: 900,
            background: sheet,
            rotate: `${-tilt * 2.5}deg`,
            clipPath:
              "polygon(1% 3%, 34% 0%, 71% 2%, 99% 1%, 100% 46%, 98% 98%, 62% 100%, 27% 98%, 0% 100%, 2% 52%)",
          }}
        />
      )}
      {children}
    </div>
  );
};

// A piece of a picture, cut out and pasted down: a white paper edge all round, a shadow under it,
// and a hand's worth of wobble. `box` is the part of the picture to keep; `pts` cuts closer, around
// a subject. `punch` cuts in closer on a beat, which reads as a new shot without one.
export type Pics = Record<string, readonly [w: number, h: number]>;
export type Box = readonly [x: number, y: number, w: number, h: number];

// Each short keeps its pictures in public/cutout/<dir>/ and lists their pixel sizes; this binds a
// Cut to that folder, so a card names a picture and nothing else.
export const makeCut = <P extends Pics>(dir: string, PICS: P) => {
  const Cut: React.FC<{
    pic: keyof P & string;
    x: number;
    y: number;
    w: number;
    box?: Box;
    pts?: readonly (readonly [number, number])[];
    tilt?: number;
    at?: number;
    punch?: number;
    by?: number;
    flip?: boolean;
    tone?: string;
    edge?: number;
  }> = ({
    pic,
    x,
    y,
    w,
    box,
    pts,
    tilt = 0,
    at,
    punch,
    by = 1.15,
    flip,
    tone,
    edge = 14,
  }) => {
    const f = useCurrentFrame();
    const j = useJitter(`${pic}${x}${y}`);
    const [pw, ph] = PICS[pic];
    const [bx, by0, bw, bh] = box ?? [0, 0, pw, ph];
    const k = w / bw;
    const h = bh * k;
    // A straight cut is never quite straight: the default outline is a rectangle a little off true.
    const shape: [number, number][] = pts
      ? pts.map(([px, py]) => [(px - bx) * k, (py - by0) * k])
      : [
          [w * 0.012, h * 0.008],
          [w * 0.55, 0],
          [w, h * 0.014],
          [w * 0.992, h * 0.6],
          [w * 0.985, h],
          [w * 0.4, h * 0.99],
          [0, h * 0.985],
          [w * 0.006, h * 0.4],
        ];
    const p =
      punch === undefined
        ? 0
        : interpolate(f, [punch, punch + 4], [0, 1], {
            ...clamp,
            easing: Easing.out(Easing.cubic),
          });
    const s = (1 + (by - 1) * p) * (at === undefined ? 1 : pop(f, at));
    if (s <= 0) return null;
    const poly = shape
      .map(([a, b]) => `${a.toFixed(1)}px ${b.toFixed(1)}px`)
      .join(", ");
    return (
      <div
        style={{
          position: "absolute",
          left: x - w / 2 + j.dx,
          top: y - h / 2 + j.dy,
          width: w,
          height: h,
          rotate: `${tilt + j.rot}deg`,
          scale: `${flip ? -s : s} ${s}`,
          filter:
            "drop-shadow(0 10px 0 rgba(29,18,8,0.16)) drop-shadow(0 18px 22px rgba(29,18,8,0.28))",
        }}
      >
        <svg
          width={w}
          height={h}
          style={{ position: "absolute", overflow: "visible" }}
        >
          <polygon
            points={shape.map((q) => q.join(",")).join(" ")}
            fill="#fffdf6"
            stroke="#fffdf6"
            strokeWidth={edge * 2}
            strokeLinejoin="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `polygon(${poly})`,
          }}
        >
          <Img
            src={staticFile(`cutout/${dir}/${pic}.jpg`)}
            style={{
              position: "absolute",
              left: -bx * k,
              top: -by0 * k,
              width: pw * k,
              height: ph * k,
              maxWidth: "none",
              filter: tone,
            }}
          />
        </div>
      </div>
    );
  };
  return Cut;
};

// The card's one word, written in marker over a highlighter swipe.
export const Word: React.FC<{
  text: string;
  at: number;
  until?: number;
  y?: number;
  size?: number;
  ink?: string;
  swipe?: string;
  tilt?: number;
}> = ({
  text,
  at,
  until = Infinity,
  y = 1205,
  size = 128,
  ink = INK,
  swipe = YELLOW,
  tilt = -3,
}) => {
  const f = useCurrentFrame();
  const boil = useBoil();
  if (f < at || f >= until) return null;
  const e = pop(f, at, 6);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        height: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        filter: boil,
      }}
    >
      <div
        style={{
          position: "relative",
          rotate: `${tilt}deg`,
          scale: `${1.5 - 0.5 * e}`,
          opacity: Math.min(1, e * 2),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -26,
            top: "18%",
            bottom: "6%",
            width: `calc(${ramp(f, at + 1, at + 8) * 100}% + ${ramp(f, at + 1, at + 8) * 52}px)`,
            background: swipe,
            borderRadius: 18,
            rotate: "1.2deg",
          }}
        />
        <div
          style={{
            position: "relative",
            font: `400 ${size}px ${MARKER}`,
            lineHeight: 1.1,
            color: ink,
            whiteSpace: "nowrap",
            letterSpacing: 1,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// Short marker strokes thrown out from a point as a card lands.
export const Burst: React.FC<{
  at: number;
  x: number;
  y: number;
  r?: number;
  colour?: string;
  n?: number;
}> = ({ at, x, y, r = 90, colour = CORAL, n = 9 }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, at + 9);
  if (t <= 0 || f > at + 16) return null;
  return (
    <svg
      style={{
        position: "absolute",
        left: x - r * 2,
        top: y - r * 2,
        overflow: "visible",
        opacity: interpolate(f, [at + 9, at + 16], [1, 0], clamp),
      }}
      width={r * 4}
      height={r * 4}
    >
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.3;
        const [r0, r1] = [r * (0.5 + 0.5 * t), r * (0.7 + 1.1 * t)];
        return (
          <line
            key={i}
            x1={r * 2 + Math.cos(a) * r0}
            y1={r * 2 + Math.sin(a) * r0}
            x2={r * 2 + Math.cos(a) * r1}
            y2={r * 2 + Math.sin(a) * r1}
            stroke={colour}
            strokeWidth={12}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

// A marker stroke that draws itself between two beats.
export const Stroke: React.FC<{
  d: string;
  from: number;
  to: number;
  colour: string;
  width?: number;
}> = ({ d, from, to, colour, width = 16 }) => {
  const f = useCurrentFrame();
  const t = ramp(f, from, to);
  if (t <= 0) return null;
  return (
    <path
      d={d}
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - t}
      stroke={colour}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
};

// A number written in marker, with its unit under it.
export const Count: React.FC<{
  x: number;
  y: number;
  value: number;
  at: number;
  colour: string;
  size: number;
  dim?: number;
  unit?: string;
}> = ({ x, y, value, at, colour, size, dim = 1, unit = "YEARS" }) => {
  const f = useCurrentFrame();
  const e = pop(f, at);
  if (e <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        scale: `${e}`,
        opacity: dim,
      }}
    >
      <div
        style={{
          position: "absolute",
          translate: "-50% -50%",
          textAlign: "center",
          whiteSpace: "nowrap",
          rotate: "-3deg",
        }}
      >
        <div
          style={{
            font: `400 ${size}px ${MARKER}`,
            lineHeight: 1,
            color: colour,
          }}
        >
          {fmt(value)}
        </div>
        <div
          style={{
            font: `400 ${size * 0.38}px ${MARKER}`,
            lineHeight: 1.1,
            color: INK,
            letterSpacing: 4,
          }}
        >
          {unit}
        </div>
      </div>
    </div>
  );
};

// The board every card is drawn on, placed in the frame: full size above the captions in 9:16, the
// same board scaled to the height it has in 16:9.
export const Board: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const k = vertical ? 1 : 0.66;
  return (
    <div
      style={{
        position: "absolute",
        left: (width - BOARD.w * k) / 2,
        top: vertical ? 70 : 8,
        width: BOARD.w,
        height: BOARD.h,
        scale: `${k}`,
        transformOrigin: "0 0",
      }}
    >
      <Boil />
      {children}
    </div>
  );
};

// The whole frame is paper; the set is drawn far past the stage so no crop finds its edge.
export const Paper: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: -2000,
      top: -2000,
      width: 6000,
      height: 6000,
      background: PAPER,
    }}
  />
);
