import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Card, Marks, Pieces, circle } from "../../deck/calm";
import {
  Board,
  CORAL,
  INK,
  Paper,
  Stroke,
  TEAL,
  YELLOW,
  fmt,
  makeCut,
  ramp,
} from "../../deck/kit";
import { clean, makeEdit } from "../../edit";
import { MARKER } from "../../fonts";
import alignment from "../../generated/age-of-sunlight-long.alignment.json";
import type { Short } from "../types";

// The long age-of-sunlight short in the calm look: script/age-of-sunlight-long.txt, one card per
// sentence. Its own picture is two lanes out of one drawn core: a straight teal line for the
// neutrinos and a tangled coral one for the energy that leaves as sunlight, each with its own clock.
// Every number drawn is in that script's SOURCES.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["eight", "minutes"],
    ["tens", "of", "thousands"],
    ["four", "million", "tonnes"],
    ["two", "neutrinos"],
    ["two", "seconds."],
    ["tens", "of", "billions"],
    ["hundred", "and", "forty"],
    ["slow", "road."],
    ["ten", "percent."],
    ["old", "news."],
    ["fresh."],
  ],
  breakAfter: [
    "other",
    "turns",
    "nucleus,",
    "rest",
    "later,",
    "centimetre",
    "borexino",
    "liquid,",
    "again,",
    "later,",
    "doing",
    "count",
    "hard",
  ],
});

const S = edit.words
  .filter((w, i) => i === 0 || /\.$/.test(edit.words[i - 1].text))
  .map((w) => w.start);
if (S.length !== 23)
  throw new Error(`expected 23 sentences, found ${S.length}`);
const at = (s: number, word: string) => {
  const hit = edit.words.find(
    (w) => w.start >= S[s] && clean(w.text) === clean(word),
  );
  if (!hit)
    throw new Error(`"${word}" is not spoken in or after sentence ${s}`);
  return hit.start;
};
const cut = (s: number) => (s >= S.length ? edit.duration : S[s] - 2);
const end = (s: number) => (s + 1 >= S.length ? edit.duration : S[s + 1]);

// The numbers on screen, each from script/age-of-sunlight-long.txt.
const TONNES_PER_S = 4.26e6; // NASA Sun fact sheet, mass conversion rate
const EXIT_S = 2.32; // the Sun's radius / c
const PER_DAY = 144; // Borexino pp rate, counts per day per 100 t
const PREDICTED = 131; // the rate the SSM predicts, counts per day per 100 t
const PER_DAY_ERR = 13;
const CORE = 0.25; // fractions of the Sun's radius (NASA MSFC)
const RADIATIVE = 0.7;

const CREAM = "#fffdf6";
const NIGHT = "#22304f";
const MINT = "#bfe9e4";
const PINK = "#ffc9c2";
const SUNFILL = "#ffe7a6";

const Cut = makeCut("sunlight", {
  hand: [1280, 1920],
  sun304: [1280, 1222],
  stereo: [1280, 1280],
} as const);

// A disc cut out with scissors, in the picture's pixels.
const disc = (cx: number, cy: number, r: number, n = 30) => ({
  box: [cx - r, cy - r, r * 2, r * 2] as const,
  pts: Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = r * (i % 2 ? 0.994 : 1);
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k] as const;
  }),
});
const SUN304 = { pic: "sun304", ...disc(641, 620, 545) } as const;
const STEREO = { pic: "stereo", ...disc(604, 636, 450) } as const;
// The hand, cropped to the open palm, as the cutout deck does.
const HAND = { pic: "hand", box: [440, 390, 845, 880] } as const;

const Tick: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
}> = ({ x, y, text, size = 34, anchor = "middle", fill = INK }) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    dominantBaseline="middle"
    style={{ font: `400 ${size}px ${MARKER}`, fill }}
  >
    {text}
  </text>
);

// Deterministic, so the walk is in the same place on every render.
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// The lanes' geometry, in board pixels: the Sun at the top, you at the bottom.
const SUN = { x: 540, y: 420, r: 300 };
const YOU = { x: 540, y: 990 };
const TEAL_OUT = { x: SUN.x - 150, y: YOU.y - 30 };
const CORAL_OUT = { x: SUN.x + 150, y: YOU.y - 30 };
const dir = (to: { x: number; y: number }) => {
  const d = Math.hypot(to.x - SUN.x, to.y - SUN.y);
  return [(to.x - SUN.x) / d, (to.y - SUN.y) / d] as const;
};

// The neutrinos: one straight line, core to surface to you.
const TD = dir(TEAL_OUT);
const TEAL_SURFACE = [SUN.x + TD[0] * SUN.r, SUN.y + TD[1] * SUN.r];
const TEAL_IN = `M${SUN.x} ${SUN.y} L${TEAL_SURFACE[0]} ${TEAL_SURFACE[1]}`;
const TEAL_TRIP = `M${TEAL_SURFACE[0]} ${TEAL_SURFACE[1]} L${TEAL_OUT.x} ${TEAL_OUT.y}`;

// The energy: a step in a near-random direction, leaning outward toward its exit, until it reaches
// the edge of the radiative zone; then a few rising and sinking loops through the convection zone;
// then a straight trip to you. Schematic, and labelled so: the real step is a fraction of a
// millimetre (script claim 14).
const CD = dir(CORAL_OUT);
const WALK = (() => {
  const next = rng(29);
  const pts: [number, number][] = [[0, 0]];
  let [x, y] = [0, 0];
  for (let i = 0; i < 400 && Math.hypot(x, y) < RADIATIVE; i++) {
    const th = next() * Math.PI * 2;
    const lean = 0.35;
    const dx = Math.cos(th) * (1 - lean) + CD[0] * lean;
    const dy = Math.sin(th) * (1 - lean) + CD[1] * lean;
    const n = Math.hypot(dx, dy);
    x += (dx / n) * 0.045;
    y += (dy / n) * 0.045;
    pts.push([x, y]);
  }
  return pts;
})();
const LAST = WALK[WALK.length - 1];
const CORAL_IN =
  "M" +
  WALK.map(
    ([x, y]) =>
      `${(SUN.x + x * SUN.r).toFixed(1)} ${(SUN.y + y * SUN.r).toFixed(1)}`,
  ).join(" L");
// Convection: loops along the exit direction from where the walk ended to the surface.
const CONVECT = (() => {
  const [px, py] = [-CD[1], CD[0]];
  const a = [SUN.x + LAST[0] * SUN.r, SUN.y + LAST[1] * SUN.r];
  const b = [SUN.x + CD[0] * SUN.r, SUN.y + CD[1] * SUN.r];
  const n = 3;
  let d = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}`;
  for (let i = 1; i <= n * 8; i++) {
    const t = i / (n * 8);
    const wob = Math.sin(t * n * Math.PI * 2) * 22 * (1 - t * 0.5);
    const bx = a[0] + (b[0] - a[0]) * t;
    const by = a[1] + (b[1] - a[1]) * t;
    d += ` L${(bx + px * wob).toFixed(1)} ${(by + py * wob).toFixed(1)}`;
  }
  return { d, b };
})();
const CORAL_TRIP = `M${CONVECT.b[0].toFixed(1)} ${CONVECT.b[1].toFixed(1)} L${CORAL_OUT.x} ${CORAL_OUT.y}`;

type Seg = [from: number, to: number] | "full" | null;
const draw = (seg: Seg) =>
  seg === "full" ? ([-2, -1] as const) : seg ? seg : null;

// A strip of paper with a line down it: the paper pass keeps a line legible over a drawing.
const Line: React.FC<{
  d: string;
  seg: Seg;
  colour: string;
  width?: number;
}> = ({ d, seg, colour, width = 12 }) => {
  const s = draw(seg);
  if (!s) return null;
  return (
    <>
      <Stroke d={d} from={s[0]} to={s[1]} colour={CREAM} width={width + 12} />
      <Stroke d={d} from={s[0]} to={s[1]} colour={colour} width={width} />
    </>
  );
};

// A label on a scrap of paper.
const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  from?: number;
  size?: number;
  tilt?: number;
  ink?: string;
}> = ({ x, y, text, from = -1, size = 58, tilt = -3, ink = INK }) => {
  const f = useCurrentFrame();
  const o = ramp(f, from, from + 8);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        opacity: o,
        rotate: `${tilt}deg`,
      }}
    >
      <div
        style={{
          position: "absolute",
          translate: "-50% -50%",
          padding: `${size * 0.08}px ${size * 0.35}px ${size * 0.02}px`,
          background: CREAM,
          font: `400 ${size}px ${MARKER}`,
          lineHeight: 1.25,
          color: ink,
          whiteSpace: "nowrap",
          clipPath: "polygon(1% 4%, 99% 0%, 100% 95%, 0% 100%)",
          filter: "drop-shadow(0 6px 0 rgba(29,18,8,0.18))",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const NotToScale: React.FC<{ y?: number; text?: string }> = ({
  y = 100,
  text = "NOT TO SCALE",
}) => <Tag x={540} y={y} text={text} size={30} tilt={0} />;

// The Sun cut open: core, radiative zone and convection zone at NASA MSFC's radii.
const SunZones: React.FC<{ s?: typeof SUN; labels?: boolean }> = ({
  s = SUN,
  labels = false,
}) => (
  <>
    <Pieces>
      <path d={circle(s.x, s.y, s.r)} fill={SUNFILL} />
    </Pieces>
    <Marks>
      <path d={circle(s.x, s.y, s.r * RADIATIVE)} fill="#ffd77a" />
      <path d={circle(s.x, s.y, s.r * CORE)} fill="#ffb84d" />
      <path
        d={circle(s.x, s.y, s.r)}
        stroke={INK}
        strokeWidth={10}
        fill="none"
      />
      <path
        d={circle(s.x, s.y, s.r * RADIATIVE)}
        stroke={INK}
        strokeWidth={5}
        strokeDasharray="10 14"
        fill="none"
      />
      <path
        d={circle(s.x, s.y, s.r * CORE)}
        stroke={INK}
        strokeWidth={5}
        strokeDasharray="10 14"
        fill="none"
      />
      {labels && (
        <Tick x={s.x} y={s.y - s.r * CORE - 26} text="CORE" size={30} />
      )}
    </Marks>
  </>
);

// You, at the foot of both lanes: the open palm from the cutout deck.
const You: React.FC = () => (
  <Cut {...HAND} x={YOU.x} y={YOU.y + 20} w={230} edge={8} jitter={0} />
);

// The two lanes. Each segment is drawn between two frames, shown whole, or left out; `dim` greys a
// lane back so the other reads as the subject.
const Lanes: React.FC<{
  tealIn?: Seg;
  tealTrip?: Seg;
  coralIn?: Seg;
  convect?: Seg;
  coralTrip?: Seg;
  dimTeal?: boolean;
  dimCoral?: boolean;
  tealClock?: React.ReactNode;
  coralClock?: React.ReactNode;
}> = ({
  tealIn = "full",
  tealTrip = "full",
  coralIn = "full",
  convect = "full",
  coralTrip = "full",
  dimTeal,
  dimCoral,
  tealClock,
  coralClock,
}) => (
  <>
    <SunZones labels />
    <You />
    <div
      style={{ position: "absolute", inset: 0, opacity: dimCoral ? 0.25 : 1 }}
    >
      <Marks>
        <Line d={CORAL_IN} seg={coralIn} colour={CORAL} width={6} />
        <Line d={CONVECT.d} seg={convect} colour={CORAL} width={8} />
        <Line d={CORAL_TRIP} seg={coralTrip} colour={CORAL} />
      </Marks>
      {coralClock}
    </div>
    <div
      style={{ position: "absolute", inset: 0, opacity: dimTeal ? 0.25 : 1 }}
    >
      <Marks>
        <Line d={TEAL_IN} seg={tealIn} colour={TEAL} />
        <Line d={TEAL_TRIP} seg={tealTrip} colour={TEAL} />
      </Marks>
      {tealClock}
    </div>
    <Marks>
      <circle
        cx={SUN.x}
        cy={SUN.y}
        r={16}
        fill={YELLOW}
        stroke={INK}
        strokeWidth={6}
      />
    </Marks>
    <NotToScale />
  </>
);

const TealClock: React.FC<{ text: string; from?: number }> = ({
  text,
  from,
}) => <Tag x={220} y={860} text={text} from={from} ink={TEAL} tilt={-4} />;
const CoralClock: React.FC<{ text: string; from?: number }> = ({
  text,
  from,
}) => <Tag x={790} y={860} text={text} from={from} ink={CORAL} tilt={3} />;

// A clock that runs between two frames from 0 to `to`, written with `digits` decimals.
const Running: React.FC<{
  a: number;
  b: number;
  to: number;
  unit: string;
  digits?: number;
  x: number;
  y: number;
  ink: string;
  plus?: boolean;
}> = ({ a, b, to, unit, digits = 0, x, y, ink, plus }) => {
  const f = useCurrentFrame();
  const t = Math.min(1, Math.max(0, (f - a) / (b - a)));
  const v = to * t;
  const text =
    (digits ? v.toFixed(digits) : fmt(Math.round(v))) +
    (plus && t >= 1 ? "+" : "") +
    " " +
    unit;
  return <Tag x={x} y={y} text={text} ink={ink} from={a - 8} />;
};

// Four hydrogen nuclei close in and become one helium nucleus; two neutrinos leave.
const Fusion: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const f = useCurrentFrame();
  const t = ramp(f, a, b);
  const out = ramp(f, b, b + 24);
  const c = { x: 540, y: 560 };
  const corners = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  const spread = 280 * (1 - t);
  return (
    <Marks>
      {t < 1 &&
        corners.map(([dx, dy], i) => (
          <g key={i}>
            <circle
              cx={c.x + dx * (spread + 40)}
              cy={c.y + dy * (spread + 40)}
              r={46}
              fill={CORAL}
              stroke={INK}
              strokeWidth={7}
            />
            <Tick
              x={c.x + dx * (spread + 40)}
              y={c.y + dy * (spread + 40) + 4}
              text="H"
              size={44}
              fill={CREAM}
            />
          </g>
        ))}
      {t >= 1 && (
        <>
          <circle
            cx={c.x}
            cy={c.y}
            r={90}
            fill={YELLOW}
            stroke={INK}
            strokeWidth={8}
          />
          <Tick x={c.x} y={c.y + 6} text="He" size={70} />
          {[-1, 1].map((s) => {
            const x2 = c.x + s * (120 + 300 * out);
            return (
              <g key={s}>
                <line
                  x1={c.x + s * 110}
                  y1={c.y}
                  x2={x2}
                  y2={c.y}
                  stroke={TEAL}
                  strokeWidth={12}
                  strokeLinecap="round"
                />
                {out > 0.2 && (
                  <Tick
                    x={x2 + s * 34}
                    y={c.y - 4}
                    text="ν"
                    size={70}
                    fill={TEAL}
                  />
                )}
              </g>
            );
          })}
        </>
      )}
      <Tick x={540} y={930} text="4 H  →  1 He  +  2 ν" size={52} />
    </Marks>
  );
};

// Straight teal lines through a picture: neutrinos passing through without stopping.
const Through: React.FC<{
  a: number;
  lines: [number, number, number, number][];
}> = ({ a, lines }) => (
  <Marks>
    {lines.map(([x1, y1, x2, y2], i) => (
      <Line
        key={i}
        d={`M${x1} ${y1} L${x2} ${y2}`}
        seg={[a + i * 4, a + i * 4 + 22]}
        colour={TEAL}
        width={9}
      />
    ))}
  </Marks>
);

// A square centimetre, drawn large, with neutrinos streaming through it. Schematic.
const Square: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [x, y, w] = [290, 230, 500];
  const next = rng(7);
  const dots = Array.from({ length: 60 }, () => [next(), next()] as const);
  return (
    <Marks>
      <rect
        x={x}
        y={y}
        width={w}
        height={w}
        fill={CREAM}
        stroke={INK}
        strokeWidth={10}
      />
      {dots.map(([u, v], i) => {
        const p = (u + (f / fps) * 0.9) % 1;
        return (
          <circle
            key={i}
            cx={x + 20 + v * (w - 40)}
            cy={y - 40 + p * (w + 80)}
            r={7}
            fill={TEAL}
            opacity={p < 0.08 || p > 0.92 ? 0.3 : 1}
          />
        );
      })}
      <Tick x={x + w / 2} y={y + w + 50} text="1 cm² (ENLARGED)" size={36} />
    </Marks>
  );
};

// Borexino drawn as a sphere of liquid inside a tank. Schematic, not its real proportions.
const Detector: React.FC<{ tally?: [number, number] }> = ({ tally }) => {
  const f = useCurrentFrame();
  const c = { x: 540, y: 560 };
  const n = tally ? Math.round(PER_DAY * ramp(f, tally[0], tally[1])) : 0;
  return (
    <>
      <Pieces>
        <rect x={150} y={180} width={780} height={760} rx={60} fill="#dfe8ee" />
      </Pieces>
      <Marks>
        <rect
          x={150}
          y={180}
          width={780}
          height={760}
          rx={60}
          stroke={INK}
          strokeWidth={10}
          fill="none"
        />
        <path
          d={circle(c.x, c.y, 300)}
          fill={MINT}
          stroke={INK}
          strokeWidth={10}
        />
        {Array.from({ length: n }, (_, i) => {
          const group = Math.floor(i / 5);
          const k = i % 5;
          const gx = 325 + (group % 8) * 56;
          const gy = 390 + Math.floor(group / 8) * 96;
          return k < 4 ? (
            <line
              key={i}
              x1={gx + k * 11}
              y1={gy}
              x2={gx + k * 11}
              y2={gy + 56}
              stroke={INK}
              strokeWidth={6}
              strokeLinecap="round"
            />
          ) : (
            <line
              key={i}
              x1={gx - 8}
              y1={gy + 46}
              x2={gx + 42}
              y2={gy + 10}
              stroke={CORAL}
              strokeWidth={6}
              strokeLinecap="round"
            />
          );
        })}
        {tally && <Tick x={540} y={990} text={`${n} IN ONE DAY`} size={40} />}
      </Marks>
      <NotToScale y={1060} text="SCHEMATIC" />
    </>
  );
};

// The 2014 count against the prediction, per day per 100 tonnes, with the count's error bar.
const Match: React.FC<{ a: number }> = ({ a }) => {
  const f = useCurrentFrame();
  const t = ramp(f, a, a + 30);
  const base = 900;
  const k = 3.6; // px per count
  const bar = (
    x: number,
    v: number,
    colour: string,
    label: string,
    t0: number,
  ) => {
    const h = v * k * ramp(f, t0, t0 + 24);
    return (
      <>
        <rect
          x={x - 90}
          y={base - h}
          width={180}
          height={h}
          fill={colour}
          stroke={INK}
          strokeWidth={8}
        />
        <Tick x={x} y={base + 50} text={label} size={36} />
      </>
    );
  };
  const err = ramp(f, a + 40, a + 56);
  return (
    <Marks>
      <line
        x1={180}
        y1={base}
        x2={900}
        y2={base}
        stroke={INK}
        strokeWidth={10}
        strokeLinecap="round"
      />
      {bar(300, PREDICTED, CORAL, "SUNLIGHT PREDICTS", a)}
      {bar(780, PER_DAY, TEAL, "BOREXINO COUNTED", a + 16)}
      {t > 0 && (
        <Tick
          x={300}
          y={base - PREDICTED * k - 40}
          text={`${PREDICTED}`}
          size={44}
        />
      )}
      {err > 0 && (
        <>
          <line
            x1={780}
            y1={base - (PER_DAY - PER_DAY_ERR) * k}
            x2={780}
            y2={base - (PER_DAY - PER_DAY_ERR + 2 * PER_DAY_ERR * err) * k}
            stroke={INK}
            strokeWidth={8}
          />
          {[-1, 1].map((s) => (
            <line
              key={s}
              x1={760}
              x2={800}
              y1={base - (PER_DAY + s * PER_DAY_ERR) * k}
              y2={base - (PER_DAY + s * PER_DAY_ERR) * k}
              stroke={INK}
              strokeWidth={8}
              opacity={err}
            />
          ))}
          <Tick
            x={780}
            y={base - (PER_DAY + PER_DAY_ERR) * k - 40}
            text={`${PER_DAY} ± ${PER_DAY_ERR}`}
            size={44}
          />
        </>
      )}
      <Tick x={540} y={base + 110} text="PER DAY, PER 100 TONNES" size={34} />
    </Marks>
  );
};

// Tonnes of the Sun turned into energy since this card began, at the fact sheet's rate.
const Tonnes: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, ((f - from) / fps) * TONNES_PER_S);
  return (
    <Tag
      x={540}
      y={1000}
      text={`${fmt(Math.round(n / 1000) * 1000)} TONNES SO FAR`}
      size={44}
      tilt={-2}
      from={from}
    />
  );
};

const Deck: React.FC = () => (
  <Board>
    <Card from={0} to={cut(1)} word="2 THINGS, 1 CORE" at={at(0, "two")}>
      <Lanes
        tealIn={[4, 34]}
        tealTrip={[34, 60]}
        coralIn={[4, 60]}
        convect={[60, 76]}
        coralTrip={[76, 96]}
      />
    </Card>
    <Card from={cut(1)} to={cut(2)} word="8 MINUTES AGO" at={at(1, "eight")}>
      <Lanes
        dimCoral
        tealClock={<TealClock text="8 MIN" from={at(1, "eight")} />}
      />
    </Card>
    <Card from={cut(2)} to={cut(3)} word="40,000+ YEARS AGO" at={at(2, "tens")}>
      <Lanes
        dimTeal
        coralClock={<CoralClock text="40,000+ YEARS" from={at(2, "tens")} />}
      />
    </Card>
    <Card
      from={cut(3)}
      to={cut(4)}
      word="HYDROGEN → HELIUM"
      at={at(3, "hydrogen")}
      sheet={NIGHT}
    >
      <Cut {...SUN304} x={540} y={590} w={780} edge={10} jitter={0} />
      <Marks>
        <Stroke
          d={circle(540, 590, 390 * CORE)}
          from={at(3, "where")}
          to={at(3, "where") + 18}
          colour={CREAM}
          width={10}
        />
      </Marks>
      <Tag
        x={540}
        y={590 - 390 * CORE - 50}
        text="CORE"
        from={at(3, "where") + 10}
        size={40}
      />
      <NotToScale y={1040} text="CORE DRAWN AT 1/4 OF THE RADIUS" />
    </Card>
    <Card
      from={cut(4)}
      to={cut(5)}
      word="4 MILLION+ TONNES"
      sub="A SECOND · 4.6 MILLION+ US TONS"
      at={at(4, "four")}
      sheet={NIGHT}
      tilt={1.5}
    >
      <Cut {...STEREO} x={540} y={560} w={720} edge={10} jitter={0} />
      <Tonnes from={S[4]} />
    </Card>
    <Card
      from={cut(5)}
      to={cut(6)}
      word="2 NEUTRINOS"
      at={at(5, "neutrinos")}
      sheet={CREAM}
    >
      <Fusion a={at(5, "four")} b={at(5, "become") + 14} />
    </Card>
    <Card
      from={cut(6)}
      to={cut(7)}
      word="BARELY INTERACT"
      at={at(6, "barely")}
      sheet={NIGHT}
      tilt={-1.5}
    >
      <Cut {...SUN304} x={540} y={590} w={720} edge={10} jitter={0} />
      <Through
        a={S[6]}
        lines={[
          [540, 590, 80, 260],
          [540, 590, 1000, 230],
          [540, 590, 120, 1000],
          [540, 590, 980, 960],
          [540, 590, 540, 140],
        ]}
      />
    </Card>
    <Card
      from={cut(7)}
      to={cut(8)}
      word="ABOUT 2 SECONDS"
      at={at(7, "two")}
      sheet={CREAM}
    >
      <Lanes
        tealIn={[S[7] + 4, at(7, "seconds.") + 6]}
        tealTrip={null}
        coralIn={null}
        convect={null}
        coralTrip={null}
        tealClock={
          <Running
            a={S[7] + 4}
            b={at(7, "seconds.") + 6}
            to={EXIT_S}
            digits={1}
            unit="S"
            x={220}
            y={860}
            ink={TEAL}
          />
        }
      />
    </Card>
    <Card
      from={cut(8)}
      to={cut(9)}
      word="8 MINUTES LATER"
      at={at(8, "eight")}
      sheet={MINT}
    >
      <Cut {...HAND} x={540} y={600} w={560} edge={10} jitter={0} />
      <Through
        a={at(8, "pass")}
        lines={[
          [300, 140, 420, 1060],
          [520, 140, 600, 1060],
          [720, 140, 780, 1060],
        ]}
      />
    </Card>
    <Card
      from={cut(9)}
      to={cut(10)}
      word="TENS OF BILLIONS"
      sub="PER CM² (0.16 SQ IN), PER SECOND"
      at={at(9, "tens")}
      sheet={CREAM}
    >
      <Square />
      <NotToScale y={1060} text="SCHEMATIC" />
    </Card>
    <Card
      from={cut(10)}
      to={cut(11)}
      word="BOREXINO, ITALY"
      at={at(10, "borexino")}
      sheet={CREAM}
    >
      <Detector />
    </Card>
    <Card
      from={cut(11)}
      to={cut(12)}
      word="ABOUT 140 A DAY"
      sub="PER 100 TONNES (110 US TONS)"
      at={at(11, "hundred")}
      sheet={CREAM}
    >
      <Detector tally={[S[11] + 4, end(11) - 6]} />
    </Card>
    <Card
      from={cut(12)}
      to={cut(13)}
      word="THE SLOW ROAD"
      at={at(12, "slow")}
      sheet={PINK}
    >
      <Lanes
        dimTeal
        coralIn={[S[12] + 4, end(12)]}
        convect={null}
        coralTrip={null}
      />
    </Card>
    <Card
      from={cut(13)}
      to={cut(14)}
      word="OVER AND OVER"
      at={at(13, "over")}
      sheet={PINK}
    >
      <Lanes
        dimTeal
        coralIn="full"
        convect={[at(13, "carried"), at(13, "gas.") + 10]}
        coralTrip={null}
      />
    </Card>
    <Card
      from={cut(14)}
      to={cut(15)}
      word="40,000+ YEARS"
      at={at(14, "tens")}
      sheet={PINK}
    >
      <Lanes
        dimTeal
        coralTrip={null}
        coralClock={
          <Running
            a={S[14]}
            b={at(14, "leaves")}
            to={40000}
            unit="YEARS"
            plus
            x={790}
            y={860}
            ink={CORAL}
          />
        }
      />
    </Card>
    <Card
      from={cut(15)}
      to={cut(16)}
      word="8 MINUTES LATER"
      at={at(15, "eight")}
      sheet={PINK}
    >
      <Lanes
        dimTeal
        coralTrip={[S[15] + 4, at(15, "skin.")]}
        coralClock={<CoralClock text="+ 8 MIN" from={S[15]} />}
      />
    </Card>
    <Card
      from={cut(16)}
      to={cut(17)}
      word="SUNLIGHT: THEN"
      at={at(16, "sunlight")}
      sheet={CREAM}
    >
      <Lanes
        dimTeal
        coralClock={
          <CoralClock text="40,000+ YEARS AGO" from={at(16, "set")} />
        }
      />
    </Card>
    <Card
      from={cut(17)}
      to={cut(18)}
      word="8 MINUTES AGO"
      at={at(17, "eight")}
      sheet={CREAM}
    >
      <Lanes
        dimCoral
        tealClock={<TealClock text="NEUTRINOS" from={at(17, "neutrinos")} />}
      />
    </Card>
    <Card
      from={cut(18)}
      to={cut(19)}
      word="WITHIN ABOUT 10%"
      at={at(18, "ten")}
      sheet={MINT}
    >
      <Match a={at(18, "count")} />
    </Card>
    <Card
      from={cut(19)}
      to={cut(20)}
      word="ABOUT THE SAME"
      at={at(19, "about")}
      sheet={NIGHT}
      tilt={1.5}
    >
      <Cut {...SUN304} x={540} y={590} w={760} edge={10} jitter={0} />
    </Card>
    <Card
      from={cut(20)}
      to={cut(21)}
      word="OLD NEWS"
      at={at(20, "old")}
      sheet={PINK}
    >
      <Lanes dimTeal />
    </Card>
    <Card
      from={cut(21)}
      to={cut(22)}
      word="FRESH"
      at={at(21, "fresh.")}
      sheet={MINT}
    >
      <Lanes dimCoral />
    </Card>
    <Card
      from={cut(22)}
      to={edit.duration}
      word="THEY AGREE"
      at={at(22, "agree.")}
      sheet={YELLOW}
      tilt={-1}
    >
      <Lanes />
    </Card>
  </Board>
);

export const ageOfSunlightLong: Short = {
  slug: "age-of-sunlight-long",
  title: "Two messengers from the Sun (long)",
  edit,
  looks: [{ id: "Calm", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "sun",
};
