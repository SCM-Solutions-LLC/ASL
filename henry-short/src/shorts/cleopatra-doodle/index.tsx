import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { makeEdit } from "../../edit";
import { MARKER } from "../../fonts";
import alignment from "../../generated/cleopatra-timeline.alignment.json";
import { YEAR } from "../cleopatra-timeline";
import type { Short } from "../types";

// PILOT of the doodle look: the Cleopatra short re-storyboarded as a deck of cards.
//
// The earlier cut holds one staged scene for the whole read. This one changes the picture about
// every two and a half seconds and writes one keyword per card, which is what the reference the
// look was chosen from actually does. Same voice-over, same script, same sourced numbers — only
// the picture track is new, so the two can be watched side by side.
//
// The artwork in public/doodle/cleopatra/ is marked `ship: false` in SOURCES.json: it was made on
// a free plan to test the look and is not cleared for posting. `npm run publishable` says so.
const edit = makeEdit({
  alignment,
  keyPhrases: [["closer"], ["twenty-five", "sixty", "BC."], ["sixty-nine", "BC."], ["only", "two", "thousand."], ["ancient", "history."]],
  breakAfter: ["landing"],
});

// Every card and every beat inside a card hangs off a spoken word.
const F = {
  moon: edit.at("moon"),
  building: edit.at("building"),
  sentence2: edit.at("the", 3),
  finished: edit.at("finished"),
  built: edit.at("twenty-five"),
  sentence3: edit.at("cleopatra", 1),
  born: edit.at("born"),
  bornYear: edit.at("sixty-nine"),
  back: edit.at("two"),
  later: edit.at("later."),
  from: edit.at("from"),
  apollo: edit.at("apollo"),
  only: edit.at("only"),
  twoThousand: edit.at("two", 1),
  toHer: edit.at("to", 3),
  pyramids: edit.at("pyramids"),
  ancient: edit.at("ancient"),
  end: edit.duration,
};

// The numbers come from the same three dates the original cut computes from.
const BACK = YEAR.cleopatra - YEAR.pyramid; // 2,491
const FORWARD = YEAR.apollo - YEAR.cleopatra; // 2,037
const SHARE = BACK / (YEAR.apollo - YEAR.pyramid);

// Cards are drawn on a 1080×1380 board. 9:16 shows it at full size above the captions; 16:9
// shows the same board scaled to the height it has.
const BOARD = { w: 1080, h: 1380 };
const PAPER = "#fbf6ea";
const INK = "#1d1208";
const YELLOW = "#ffd23f";
const CORAL = "#f26b5b";
const TEAL = "#17a398";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
const pop = (f: number, at: number, over = 7) =>
  interpolate(f, [at, at + over], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(2.2)),
  });
const fmt = (n: number) => n.toLocaleString("en-US");

// Drawings redrawn by hand never line up twice. Displacing each one by a noise field that changes
// a few times a second gives a still picture that "boil", which is most of what makes a doodle
// explainer feel alive between cuts.
const BOIL = 3;
const Boil: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    {Array.from({ length: BOIL }, (_, i) => (
      <filter key={i} id={`boil${i}`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency={0.012} numOctaves={2} seed={i * 7 + 3} />
        <feDisplacementMap in="SourceGraphic" scale={9} />
      </filter>
    ))}
  </svg>
);
const useBoil = () => `url(#boil${Math.floor(useCurrentFrame() / 5) % BOIL})`;

// One card. It pops in slightly rotated, drifts while it holds, and is gone when the next arrives.
// The paper is painted here so the pictures can multiply onto it: their white becomes paper.
const Shot: React.FC<{
  from: number;
  to: number;
  tilt?: number;
  children: React.ReactNode;
}> = ({ from, to, tilt = 0, children }) => {
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
      {children}
    </div>
  );
};

// A generated picture. `punch` cuts in closer on a beat, which reads as a new shot without one.
const Pic: React.FC<{
  name: string;
  x: number;
  y: number;
  size: number;
  punch?: number;
  by?: number;
  flip?: boolean;
  at?: number;
  tone?: string;
}> = ({ name, x, y, size, punch, by = 1.2, flip, at, tone }) => {
  const f = useCurrentFrame();
  const boil = useBoil();
  const p =
    punch === undefined
      ? 0
      : interpolate(f, [punch, punch + 4], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
  const s = (1 + (by - 1) * p) * (at === undefined ? 1 : pop(f, at));
  if (s <= 0) return null;
  return (
    <Img
      src={staticFile(`doodle/cleopatra/${name}.jpg`)}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        mixBlendMode: "multiply",
        scale: `${flip ? -s : s} ${s}`,
        filter: tone ? `${tone} ${boil}` : boil,
      }}
    />
  );
};

// The card's one word, written in marker over a highlighter swipe.
const Word: React.FC<{
  text: string;
  at: number;
  until?: number;
  y?: number;
  size?: number;
  ink?: string;
  swipe?: string;
  tilt?: number;
}> = ({ text, at, until = Infinity, y = 1205, size = 128, ink = INK, swipe = YELLOW, tilt = -3 }) => {
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
const Burst: React.FC<{
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
const Stroke: React.FC<{
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
const Count: React.FC<{
  x: number;
  y: number;
  value: number;
  at: number;
  colour: string;
  size: number;
  dim?: number;
}> = ({ x, y, value, at, colour, size, dim = 1 }) => {
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
          YEARS
        </div>
      </div>
    </div>
  );
};

const Year: React.FC<{ x: number; y: number; text: string; at: number }> = ({ x, y, text, at }) => {
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
      }}
    >
      <div
        style={{
          position: "absolute",
          translate: "-50% 0",
          font: `400 46px ${MARKER}`,
          color: INK,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// The payoff, drawn to scale: three pictures on one line, placed in proportion to the years, and
// the two spans measured one after the other. The first span counts up as it is drawn; the second
// lands as a single number, because "only two thousand" is the punchline.
const Timeline: React.FC = () => {
  const f = useCurrentFrame();
  const boil = useBoil();
  const [x0, x1] = [150, 930];
  const xc = x0 + (x1 - x0) * SHARE;
  const lineY = 800;
  const reveal = ramp(f, F.twoThousand, F.twoThousand + 6);
  const backDraw = ramp(f, F.back + 2, F.later);
  return (
    <>
      {/* Drawn at a comfortable working size, then enlarged to fill the card. The wrapper carries
          its own paper so the pictures still multiply onto it. */}
      <div style={{ position: "absolute", inset: 0, background: PAPER, scale: "1.03", translate: "0 150px", transformOrigin: "540px 500px" }}>
        <Pic name="pyramid" x={x0 + 10} y={660} size={300} />
        <Pic name="cleopatra" x={xc} y={640} size={330} at={F.back + 3} />
        <Pic name="moon" x={x1 - 10} y={655} size={300} at={F.apollo - 2} />
        <svg
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            filter: boil,
          }}
          width={BOARD.w}
          height={BOARD.h}
        >
          <Stroke
            d={`M${x0 - 70} ${lineY} C ${x0 + 200} ${lineY - 8}, ${x1 - 200} ${lineY + 8}, ${x1 + 70} ${lineY}`}
            from={F.back - 2}
            to={F.back + 10}
            colour={INK}
            width={12}
          />
          <Stroke d={`M${x0} 470 Q ${(x0 + xc) / 2} 330 ${xc - 18} 462`} from={F.back + 2} to={F.later} colour={CORAL} />
          <Stroke d={`M${xc + 18} 462 Q ${(xc + x1) / 2} 330 ${x1} 470`} from={F.from + 2} to={F.only + 4} colour={TEAL} />
          {/* The punchline gets circled. */}
          <Stroke
            d={`M${(xc + x1) / 2 - 190} 235 C ${(xc + x1) / 2 - 170} 110, ${(xc + x1) / 2 + 190} 100, ${(xc + x1) / 2 + 195} 230 C ${(xc + x1) / 2 + 200} 350, ${(xc + x1) / 2 - 200} 370, ${(xc + x1) / 2 - 186} 215`}
            from={F.twoThousand + 6}
            to={F.twoThousand + 16}
            colour={YELLOW}
            width={14}
          />
        </svg>
        <Count x={(x0 + xc) / 2} y={235} value={Math.round(BACK * backDraw)} at={F.back + 2} colour={CORAL} size={112} dim={1 - reveal * 0.45} />
        <Count x={(xc + x1) / 2} y={235} value={FORWARD} at={F.twoThousand} colour={TEAL} size={128} />
        <Year x={x0 + 10} y={lineY + 26} text="2560 BC" at={F.back + 4} />
        <Year x={xc} y={lineY + 26} text="69 BC" at={F.back + 8} />
        <Year x={x1 - 20} y={lineY + 26} text="AD 1969" at={F.apollo} />
        <Burst at={F.twoThousand} x={(xc + x1) / 2} y={235} r={150} colour={YELLOW} n={12} />
      </div>
      <Word text={`${fmt(BACK - FORWARD)} YEARS CLOSER`} at={F.twoThousand + 12} y={1225} size={92} swipe={YELLOW} />
    </>
  );
};

// A cobweb in the corner of the last card: old, to her.
const Cobweb: React.FC<{ at: number }> = ({ at }) => {
  const boil = useBoil();
  const spokes = [0, 22, 45, 68, 90].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return `M0 0 L${Math.cos(a) * 330} ${Math.sin(a) * 330}`;
  });
  const rings = [110, 200, 290].map((r) =>
    [0, 22, 45, 68]
      .map((deg, i) => {
        const [a, b] = [(deg * Math.PI) / 180, ((deg + 22) * Math.PI) / 180];
        const m = (a + b) / 2;
        return `${i ? "" : `M${Math.cos(a) * r} ${Math.sin(a) * r}`} Q ${Math.cos(m) * r * 0.8} ${Math.sin(m) * r * 0.8} ${Math.cos(b) * r} ${Math.sin(b) * r}`;
      })
      .join(" "),
  );
  return (
    <svg
      style={{
        position: "absolute",
        left: 60,
        top: 70,
        overflow: "visible",
        filter: boil,
      }}
      width={340}
      height={340}
    >
      {spokes.map((d, i) => (
        <Stroke key={d} d={d} from={at + i} to={at + 8 + i} colour={INK} width={6} />
      ))}
      {rings.map((d, i) => (
        <Stroke key={d} d={d} from={at + 6 + i * 3} to={at + 14 + i * 3} colour={INK} width={5} />
      ))}
    </svg>
  );
};

const Deck: React.FC = () => {
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

      <Shot from={0} to={F.moon - 2} tilt={-1.5}>
        <Pic name="cleopatra" x={540} y={590} size={960} />
        <Burst at={2} x={540} y={600} r={250} colour={YELLOW} n={14} />
        <Word text="CLEOPATRA" at={3} />
      </Shot>

      <Shot from={F.moon - 2} to={F.building - 2} tilt={1.5}>
        <Pic name="moon" x={540} y={590} size={960} />
        <Burst at={F.moon} x={540} y={600} r={250} colour={TEAL} n={14} />
        <Word text="MOON LANDING" at={F.moon} size={112} swipe="#bfe9e4" tilt={3} />
      </Shot>

      <Shot from={F.building - 2} to={F.sentence2 - 2} tilt={-1.5}>
        <Pic name="building" x={540} y={590} size={960} />
        <Burst at={F.building} x={540} y={600} r={250} colour={CORAL} n={14} />
        <Word text="GREAT PYRAMID" at={F.building + 6} size={108} />
      </Shot>

      <Shot from={F.sentence2 - 2} to={F.sentence3 - 2} tilt={1.5}>
        <Pic name="pyramid" x={540} y={590} size={960} punch={F.built - 1} by={1.16} />
        <Word text="FINISHED!" at={F.finished} until={F.built - 1} swipe="#bfe9e4" tilt={3} />
        <Burst at={F.built - 1} x={540} y={1190} r={170} colour={CORAL} n={12} />
        <Word text="c. 2560 BC" at={F.built - 1} size={136} />
      </Shot>

      <Shot from={F.sentence3 - 2} to={F.back - 2} tilt={-1.5}>
        <Pic name="baby" x={540} y={590} size={960} punch={F.bornYear - 1} by={1.16} />
        <Word text="BORN" at={F.born} until={F.bornYear - 1} swipe="#ffc9c2" tilt={3} />
        <Burst at={F.bornYear - 1} x={540} y={1190} r={170} colour={TEAL} n={12} />
        <Word text="69 BC" at={F.bornYear - 1} size={150} />
      </Shot>

      <Shot from={F.back - 2} to={F.toHer - 2}>
        <Timeline />
      </Shot>

      <Shot from={F.toHer - 2} to={F.ancient - 2} tilt={1.5}>
        <Pic name="pyramid" x={730} y={520} size={700} />
        <Pic name="cleopatra" x={300} y={700} size={720} flip />
        <Word text="THE PYRAMIDS?" at={F.pyramids} size={110} swipe="#bfe9e4" tilt={3} />
      </Shot>

      <Shot from={F.ancient - 2} to={F.end} tilt={-1.5}>
        <Pic name="pyramid" x={540} y={600} size={960} tone="grayscale(0.9)" />
        <Cobweb at={F.ancient + 2} />
        <Burst at={F.ancient} x={540} y={1190} r={190} colour={CORAL} n={12} />
        <Word text="ANCIENT HISTORY" at={F.ancient} size={92} />
      </Shot>
    </div>
  );
};

// The whole frame is paper; the set is drawn far past the stage so no crop finds its edge.
const Paper: React.FC = () => (
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

export const cleopatraDoodle: Short = {
  slug: "cleopatra-doodle",
  title: "Cleopatra and the Moon landing (doodle pilot)",
  edit,
  looks: [{ id: "Doodle", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "playful",
  sfx: [
    { at: 0, name: "pop" },
    { at: F.moon - 2, name: "pop" },
    { at: F.building - 2, name: "pop" },
    { at: F.sentence2 - 2, name: "pop" },
    { at: F.built - 1, name: "thud", volume: 0.4 },
    { at: F.sentence3 - 2, name: "pop" },
    { at: F.bornYear - 1, name: "thud", volume: 0.4 },
    { at: F.back - 2, name: "whoosh", volume: 0.35 },
    { at: F.apollo - 2, name: "pop" },
    { at: F.twoThousand, name: "thud", volume: 0.6 },
    { at: F.toHer - 2, name: "pop" },
    { at: F.ancient - 2, name: "sparkle", volume: 0.4 },
  ],
};
