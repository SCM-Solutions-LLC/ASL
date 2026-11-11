import React from "react";
import { useCurrentFrame } from "remotion";
import {
  BOARD,
  Board,
  Burst,
  CORAL,
  INK,
  Paper,
  Shot,
  Stroke,
  TEAL,
  Word,
  YELLOW,
  makeCut,
  pop,
  useBoil,
  useJitter,
} from "../../deck/kit";
import { makeEdit } from "../../edit";
import { MARKER } from "../../fonts";
import alignment from "../../generated/age-of-sunlight.alignment.json";
import type { Short } from "../types";

// The age-of-sunlight short as a deck of collage cards: same voice-over, same script, same sourced
// numbers as src/shorts/age-of-sunlight, with a new picture track. See src/deck/kit.tsx for the look and
// src/shorts/cleopatra-cutout for the deck this one follows.
//
// Every picture is a real one, public domain or CC0, cut out like paper and pasted down: NASA's own
// frames of the Sun from the Solar Dynamics Observatory, STEREO and Skylab, the Earth from Apollo 17,
// a sunrise from the Space Station, and two CC0 photographs for the sunbeams and the hand. What
// cannot be photographed — the inside of the Sun, a photon's path — is drawn over them in marker,
// so a drawing is never passed off as a picture. public/SOURCES.json carries where each came from;
// script/age-of-sunlight.txt carries the numbers.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["hundred", "thousand"],
    ["eight", "minutes"],
    ["photon"],
    ["ancient"],
  ],
});

// Every card and every beat inside a card hangs off a spoken word.
const F = {
  skin: edit.at("skin"),
  hundred: edit.at("hundred"),
  old: edit.at("old."),
  eight: edit.at("eight"),
  minutes: edit.at("minutes"),
  trip: edit.at("trip"),
  sun: edit.at("sun."),
  sentence3: edit.at("the", 3),
  rest: edit.at("rest"),
  getting: edit.at("getting"),
  out: edit.at("out."),
  but: edit.at("but"),
  not: edit.at("not"),
  same: edit.at("same"),
  no: edit.at("no"),
  photon: edit.at("photon"),
  survives: edit.at("survives"),
  climb: edit.at("climb."),
  sentence6: edit.at("the", 6),
  energy: edit.at("energy"),
  ancient: edit.at("ancient."),
  sentence7: edit.at("the", 7),
  light: edit.at("light", 1),
  eightAgain: edit.at("eight", 1),
  oldAgain: edit.at("old.", 1),
  end: edit.duration,
};

// The pictures in public/cutout/sunlight/, with their pixel sizes, so a crop or an outline can be
// given in the picture's own pixels.
const PICS = {
  rays: [1280, 960],
  hand: [1280, 1920],
  sun304: [1280, 1222],
  stereo: [1280, 1280],
  earth: [1280, 1281],
  disc: [960, 960],
  wheel: [1280, 1280],
  prominence: [1280, 720],
  skylab: [1280, 1007],
  sunrise: [1280, 852],
} as const;
const Cut = makeCut("sunlight", PICS);

// A disc cut out with scissors: a many-sided outline, never quite round.
const disc = (cx: number, cy: number, r: number, n = 30) => ({
  box: [cx - r, cy - r, r * 2, r * 2] as const,
  pts: Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = r * (i % 2 ? 0.994 : 1);
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k] as const;
  }),
});

// Outlines cut around a subject, in the picture's pixels: where each disc sits in its frame, and
// the hand traced finger by finger.
const OUTLINE = {
  sun304: { pic: "sun304", ...disc(641, 620, 545) },
  stereo: { pic: "stereo", ...disc(604, 636, 450) },
  earth: { pic: "earth", ...disc(637, 638, 562) },
  disc: { pic: "disc", ...disc(480, 480, 436) },
  hand: {
    pic: "hand",
    box: [440, 390, 845, 880],
    pts: [
      [455, 1215],
      [468, 1170],
      [565, 1132],
      [646, 1084],
      [682, 1010],
      [686, 900],
      [652, 850],
      [600, 760],
      [563, 662],
      [556, 604],
      [582, 574],
      [628, 590],
      [662, 660],
      [730, 774],
      [786, 800],
      [812, 700],
      [832, 560],
      [848, 440],
      [890, 402],
      [942, 430],
      [938, 520],
      [908, 660],
      [902, 772],
      [950, 700],
      [1000, 600],
      [1030, 545],
      [1075, 528],
      [1102, 560],
      [1092, 620],
      [1042, 720],
      [1008, 800],
      [1012, 848],
      [1060, 876],
      [1150, 848],
      [1235, 822],
      [1272, 845],
      [1266, 882],
      [1200, 932],
      [1110, 968],
      [1072, 980],
      [1066, 1040],
      [1030, 1110],
      [1005, 1140],
      [900, 1178],
      [760, 1192],
      [620, 1218],
      [560, 1248],
      [480, 1258],
    ],
  },
} as const;

// Marker drawn over the pasted pictures, in board pixels.
const Marks: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const boil = useBoil();
  return (
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
      {children}
    </svg>
  );
};

// A marker line over a photograph needs ground under it to read, so each is drawn twice: a wider
// pass in paper white, then the colour on top — a strip of paper with a line down it.
const Line: React.FC<{
  d: string;
  from: number;
  to: number;
  colour: string;
  width?: number;
}> = ({ d, from, to, colour, width = 14 }) => (
  <>
    <Stroke d={d} from={from} to={to} colour="#fffdf6" width={width + 14} />
    <Stroke d={d} from={from} to={to} colour={colour} width={width} />
  </>
);

// A label written on a scrap of paper and stuck on: for the one number a card needs besides its
// keyword.
const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  at: number;
  size?: number;
  tilt?: number;
  ink?: string;
}> = ({ x, y, text, at, size = 62, tilt = -4, ink = INK }) => {
  const f = useCurrentFrame();
  const j = useJitter(`tag${text}${x}`);
  const e = pop(f, at);
  if (e <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x + j.dx,
        top: y + j.dy,
        width: 0,
        height: 0,
        scale: `${e}`,
        rotate: `${tilt + j.rot}deg`,
      }}
    >
      <div
        style={{
          position: "absolute",
          translate: "-50% -50%",
          padding: `${size * 0.08}px ${size * 0.4}px ${size * 0.02}px`,
          background: "#fffdf6",
          font: `400 ${size}px ${MARKER}`,
          lineHeight: 1.25,
          color: ink,
          whiteSpace: "nowrap",
          clipPath: "polygon(1% 4%, 99% 0%, 100% 95%, 0% 100%)",
          filter: "drop-shadow(0 8px 0 rgba(29,18,8,0.2))",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Deterministic, so the walk is in the same place on every render.
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// The Sun's interior by fraction of its radius: energy diffuses out through the radiative zone to
// about 0.7, and the convective zone above that carries it the rest of the way in weeks (script
// sources 3 and 6). So the path is a random walk as far as 0.7 and one straight leg after it.
const RADIATIVE = 0.7;
const EXIT_ANGLE = -0.72;

// A path out of the core as what it is: a step in a random direction, then another, until it is
// seven steps from the centre. A marker line that crosses itself reads as a scribble rather than a
// path, so a step that would land back on the line is thrown again — the one liberty taken with the
// walk. A real photon's is beyond drawing either way, so the honest picture is its shape; the
// number stays in the tag where it can be checked.
const walk = (cx: number, cy: number, r: number) => {
  const next = rng(8);
  const pts: [number, number][] = [[0, 0]];
  let [x, y] = [0, 0];
  while (Math.hypot(x, y) < 7 && pts.length < 400) {
    let [nx, ny] = [x, y];
    for (let tries = 0; tries < 30; tries++) {
      const a = next() * Math.PI * 2;
      const th = pts.length === 1 ? a : Math.atan2(y, x) + (a - Math.PI) * 0.97;
      [nx, ny] = [x + Math.cos(th), y + Math.sin(th)];
      const clear = pts
        .slice(0, -1)
        .every(([px, py]) => Math.hypot(nx - px, ny - py) >= 0.95);
      if (clear) break;
    }
    [x, y] = [nx, ny];
    pts.push([x, y]);
  }
  // Scaled by the furthest excursion, so no leg strays past the radiative zone, and turned so the
  // walk ends pointing at the exit.
  const far = Math.max(...pts.map(([px, py]) => Math.hypot(px, py)));
  const k = (RADIATIVE * r) / far;
  const [lx, ly] = pts[pts.length - 1];
  const turn = EXIT_ANGLE - Math.atan2(ly, lx);
  const [c, s] = [Math.cos(turn), Math.sin(turn)];
  const at = ([px, py]: [number, number]) =>
    `${(cx + (px * c - py * s) * k).toFixed(1)} ${(cy + (px * s + py * c) * k).toFixed(1)}`;
  const edge = (m: number) =>
    `${(cx + Math.cos(EXIT_ANGLE) * r * m).toFixed(1)} ${(cy + Math.sin(EXIT_ANGLE) * r * m).toFixed(1)}`;
  return {
    grind: `M${pts.map(at).join(" L")}`,
    out: `M${edge(RADIATIVE)} L${edge(1.13)}`,
  };
};

// A wave drawn along a straight run: the usual sign for light.
const wave = (
  [x0, y0]: readonly [number, number],
  [x1, y1]: readonly [number, number],
  cycles: number,
  amp: number,
) => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const [ux, uy] = [(x1 - x0) / len, (y1 - y0) / len];
  const n = Math.round(cycles * 12);
  return `M${Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const w = Math.sin(t * cycles * Math.PI * 2) * amp;
    return `${(x0 + ux * len * t - uy * w).toFixed(1)} ${(y0 + uy * len * t + ux * w).toFixed(1)}`;
  }).join(" L")}`;
};

// Where the pasted Suns sit on their cards, in board pixels, so the marker drawn over one is placed
// from the same numbers as the picture under it.
const INSIDE = { x: 540, y: 590, r: 420 };
const TRIP = {
  sun: { x: 330, y: 410, r: 215 },
  earth: { x: 800, y: 840, r: 120 },
};
const WALK = walk(INSIDE.x, INSIDE.y, INSIDE.r);

// Sun to Earth: one stroke from limb to limb, with an arrowhead where it lands.
const CROSSING = (() => {
  const { sun, earth } = TRIP;
  const a = Math.atan2(earth.y - sun.y, earth.x - sun.x);
  const from = [
    sun.x + Math.cos(a) * (sun.r + 34),
    sun.y + Math.sin(a) * (sun.r + 34),
  ];
  const to = [
    earth.x - Math.cos(a) * (earth.r + 44),
    earth.y - Math.sin(a) * (earth.r + 44),
  ];
  const head = (turn: number) =>
    `${(to[0] - Math.cos(a + turn) * 62).toFixed(1)} ${(to[1] - Math.sin(a + turn) * 62).toFixed(1)}`;
  return {
    line: `M${from[0].toFixed(1)} ${from[1].toFixed(1)} Q ${(from[0] + to[0]) / 2 + 60} ${(from[1] + to[1]) / 2 - 60} ${to[0].toFixed(1)} ${to[1].toFixed(1)}`,
    head: `M${head(0.75)} L${to[0].toFixed(1)} ${to[1].toFixed(1)} L${head(-0.35)}`,
  };
})();

// The photon that does not make it: a wave climbing toward the edge, and the point it is absorbed.
const CLIMB = { from: [215, 905], to: [560, 560] } as const;
const CROSS = 105;
const FAN = [-1.5, -1.05, -0.6, -0.15, 0.3].map((a) => {
  const [x, y] = CLIMB.to;
  const p = (m: number) =>
    `${(x + Math.cos(a) * m).toFixed(1)} ${(y + Math.sin(a) * m).toFixed(1)}`;
  return `M${p(150)} L${p(290)}`;
});

// A cobweb in the corner of the card: old.
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
        left: 30,
        top: 40,
        overflow: "visible",
        filter: boil,
      }}
      width={340}
      height={340}
    >
      {spokes.map((d, i) => (
        <Stroke
          key={d}
          d={d}
          from={at + i}
          to={at + 8 + i}
          colour={INK}
          width={6}
        />
      ))}
      {rings.map((d, i) => (
        <Stroke
          key={d}
          d={d}
          from={at + 6 + i * 3}
          to={at + 14 + i * 3}
          colour={INK}
          width={5}
        />
      ))}
    </svg>
  );
};

// Eight cards in nineteen seconds. No picture is the main picture of two cards.
const Deck: React.FC = () => (
  <Board>
    <Shot from={0} to={F.hundred - 2} tilt={-1.5} sheet={YELLOW}>
      <Cut
        pic="rays"
        x={540}
        y={560}
        w={900}
        box={[90, 10, 1120, 730]}
        tilt={-2}
      />
      <Cut
        {...OUTLINE.hand}
        x={770}
        y={850}
        w={430}
        tilt={8}
        at={F.skin}
        edge={10}
      />
      <Burst at={2} x={540} y={1190} r={115} colour={CORAL} n={14} />
      <Word text="SUNLIGHT" at={3} />
    </Shot>

    <Shot from={F.hundred - 2} to={F.eight - 2} tilt={1.5} sheet={TEAL}>
      <Cut
        {...OUTLINE.sun304}
        x={540}
        y={585}
        w={840}
        tilt={2}
        punch={F.old}
        by={1.08}
      />
      <Burst at={F.hundred} x={540} y={1190} r={115} colour={YELLOW} n={14} />
      <Word text="100,000 YEARS OLD" at={F.hundred} size={84} />
    </Shot>

    <Shot from={F.eight - 2} to={F.sentence3 - 2} tilt={-1.5} sheet="#22304f">
      <Cut
        {...OUTLINE.stereo}
        x={TRIP.sun.x}
        y={TRIP.sun.y}
        w={TRIP.sun.r * 2}
        tilt={-3}
        edge={10}
      />
      <Cut
        {...OUTLINE.earth}
        x={TRIP.earth.x}
        y={TRIP.earth.y}
        w={TRIP.earth.r * 2}
        tilt={4}
        edge={10}
        at={F.minutes + 3}
        punch={F.sun + 3}
        by={1.22}
      />
      <Marks>
        <Stroke
          d={CROSSING.line}
          from={F.trip}
          to={F.sun + 2}
          colour={YELLOW}
          width={20}
        />
        <Stroke
          d={CROSSING.head}
          from={F.sun}
          to={F.sun + 6}
          colour={YELLOW}
          width={20}
        />
      </Marks>
      <Word text="8 MINUTES" at={F.eight} swipe="#bfe9e4" tilt={3} />
    </Shot>

    <Shot from={F.sentence3 - 2} to={F.but - 2} tilt={1.5} sheet="#bfe9e4">
      <Cut
        {...OUTLINE.disc}
        x={INSIDE.x}
        y={INSIDE.y}
        w={INSIDE.r * 2}
        tilt={0}
      />
      <Marks>
        <Line
          d={WALK.grind}
          from={F.rest - 2}
          to={F.out + 4}
          colour={INK}
          width={10}
        />
        <Line
          d={WALK.out}
          from={F.out + 4}
          to={F.out + 9}
          colour={CORAL}
          width={14}
        />
        {/* Where it starts: the core. */}
        <circle cx={INSIDE.x} cy={INSIDE.y} r={26} fill="#fffdf6" />
        <circle cx={INSIDE.x} cy={INSIDE.y} r={17} fill={INK} />
      </Marks>
      <Tag
        x={735}
        y={200}
        text="100,000 YEARS"
        at={F.out + 2}
        size={58}
        ink={CORAL}
        tilt={4}
      />
      <Word text="GETTING OUT" at={F.getting} size={118} />
    </Shot>

    <Shot from={F.but - 2} to={F.no - 2} tilt={-1.5} sheet={CORAL}>
      <Cut
        pic="wheel"
        x={540}
        y={590}
        w={790}
        tilt={-2}
        punch={F.same}
        by={1.1}
      />
      <Word
        text="NOT THE SAME LIGHT"
        at={F.not}
        size={76}
        swipe="#ffc9c2"
        tilt={3}
      />
    </Shot>

    <Shot from={F.no - 2} to={F.sentence6 - 2} tilt={1.5} sheet={TEAL}>
      <Cut
        pic="prominence"
        x={540}
        y={585}
        w={900}
        box={[200, 0, 1080, 720]}
        tilt={2}
      />
      <Marks>
        <Line
          d={wave(CLIMB.from, CLIMB.to, 5, 34)}
          from={F.no}
          to={F.survives}
          colour={YELLOW}
          width={14}
        />
        <Line
          d={`M${CLIMB.to[0] - CROSS} ${CLIMB.to[1] - CROSS} L${CLIMB.to[0] + CROSS} ${CLIMB.to[1] + CROSS}`}
          from={F.survives}
          to={F.survives + 4}
          colour={CORAL}
          width={26}
        />
        <Line
          d={`M${CLIMB.to[0] + CROSS} ${CLIMB.to[1] - CROSS} L${CLIMB.to[0] - CROSS} ${CLIMB.to[1] + CROSS}`}
          from={F.survives + 3}
          to={F.survives + 7}
          colour={CORAL}
          width={26}
        />
        {FAN.map((d, i) => (
          <Line
            key={d}
            d={d}
            from={F.climb + i}
            to={F.climb + 7 + i}
            colour={TEAL}
            width={12}
          />
        ))}
      </Marks>
      <Word text="NO PHOTON SURVIVES" at={F.photon} size={78} />
    </Shot>

    <Shot
      from={F.sentence6 - 2}
      to={F.sentence7 - 2}
      tilt={-1.5}
      sheet="#d8c9a8"
    >
      <Cut
        pic="skylab"
        x={540}
        y={590}
        w={900}
        tilt={-1.5}
        tone="sepia(0.7) contrast(1.05)"
        punch={F.ancient - 1}
        by={1.08}
      />
      <Cobweb at={F.ancient + 2} />
      <Word
        text="ENERGY"
        at={F.energy}
        until={F.ancient - 1}
        swipe="#bfe9e4"
        tilt={3}
      />
      <Burst
        at={F.ancient - 1}
        x={540}
        y={1190}
        r={115}
        colour={CORAL}
        n={12}
      />
      <Word text="ANCIENT ENERGY" at={F.ancient - 1} size={98} />
    </Shot>

    <Shot from={F.sentence7 - 2} to={F.end} tilt={1.5} sheet={YELLOW}>
      <Cut
        pic="sunrise"
        x={540}
        y={570}
        w={880}
        tilt={2}
        punch={F.eightAgain - 1}
        by={1.06}
      />
      <Cut
        {...OUTLINE.hand}
        x={300}
        y={860}
        w={420}
        tilt={-8}
        flip
        at={F.oldAgain}
        edge={10}
      />
      <Word
        text="THE LIGHT"
        at={F.light}
        until={F.eightAgain - 1}
        swipe="#bfe9e4"
        tilt={3}
      />
      <Burst
        at={F.eightAgain - 1}
        x={540}
        y={1190}
        r={115}
        colour={CORAL}
        n={14}
      />
      <Word text="8 MINUTES OLD" at={F.eightAgain - 1} size={104} />
    </Shot>
  </Board>
);

export const ageOfSunlightCutout: Short = {
  slug: "age-of-sunlight-cutout",
  title: "Sunlight is older than the light (cutout)",
  edit,
  looks: [{ id: "Cutout", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "sun",
  sfx: [
    { at: 0, name: "pop" },
    { at: F.hundred - 2, name: "thud", volume: 0.5 },
    { at: F.eight - 2, name: "flick" },
    { at: F.trip, name: "whoosh", volume: 0.35 },
    { at: F.sentence3 - 2, name: "tap" },
    { at: F.out + 2, name: "thud", volume: 0.4 },
    { at: F.but - 2, name: "pop" },
    { at: F.no - 2, name: "flick" },
    { at: F.survives, name: "thud", volume: 0.6 },
    { at: F.sentence6 - 2, name: "tap" },
    { at: F.ancient - 1, name: "thud", volume: 0.4 },
    { at: F.sentence7 - 2, name: "pop" },
    { at: F.eightAgain - 1, name: "sparkle", volume: 0.4 },
  ],
};
