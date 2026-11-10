import React from "react";
import { random, useCurrentFrame } from "remotion";
import {
  BOARD,
  Board,
  Burst,
  CORAL,
  Count,
  INK,
  Paper,
  Shot,
  Stroke,
  TEAL,
  Word,
  YELLOW,
  makeCut,
  pop,
  ramp,
  useBoil,
  useJitter,
} from "../../deck/kit";
import { makeEdit } from "../../edit";
import { MARKER } from "../../fonts";
import alignment from "../../generated/cell-count.alignment.json";
import type { Short } from "../types";

// The cell-count short as a deck of collage cards: same voice-over, same script, same sourced
// numbers as src/shorts/cell-count, with a new picture track. See src/deck/kit.tsx for the look and
// src/shorts/cleopatra-cutout for the deck this one follows.
//
// Every number on a card is one of the script's own (script/cell-count.txt carries the paper behind
// them): 30 trillion human cells, 38 trillion bacteria, about 200 g, 84% red blood cells BY COUNT,
// The first card splits its figure at 30 of 68 and puts no percentage on it: the paper's error
// margin does not carry one. Every picture is a real public-domain or CC0 one and is
// labelled as what its Commons page says it is; public/SOURCES.json carries where each came from.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["less", "than", "half"],
    ["thirty", "trillion"],
    ["Thirty-eight", "trillion"],
    ["two", "hundred", "grams."],
    ["Eighty-four", "percent"],
    ["mostly", "blood."],
    ["outnumbered"],
  ],
  breakAfter: ["scale,"],
});

// Every card and every beat inside a card hangs off a spoken word.
const F = {
  cell: edit.at("cell"),
  less: edit.at("less"),
  half: edit.at("half"),
  human: edit.at("human."),
  sentence2: edit.at("about"),
  thirty: edit.at("thirty"),
  yours: edit.at("yours."),
  thirtyEight: edit.at("thirty-eight"),
  bacteria: edit.at("bacteria."),
  sentence4: edit.at("but"),
  them: edit.at("them"),
  on: edit.at("on"),
  those: edit.at("those"),
  thoseBacteria: edit.at("bacteria", 1),
  two: edit.at("two"),
  grams: edit.at("grams."),
  sentence5: edit.at("and", 1),
  own: edit.at("own"),
  not: edit.at("not"),
  what: edit.at("what"),
  eightyFour: edit.at("eighty-four"),
  percent: edit.at("percent"),
  red: edit.at("red"),
  sentence6: edit.at("by", 1),
  byCount: edit.at("count,", 1),
  mostly: edit.at("mostly"),
  sentence7: edit.at("and", 2),
  they: edit.at("they"),
  outnumbered: edit.at("outnumbered"),
  their: edit.at("their"),
  passengers: edit.at("passengers."),
  end: edit.duration,
};

// The script's numbers, in trillions of cells. RED is the paper's 2.5e13 red blood cells, which is
// 25 dots of the 30; the label carries the paper's own 84%.
const HUMAN = 30;
const BACTERIA = 38;
const RED = 25;
const SHARE = HUMAN / (HUMAN + BACTERIA); // 0.44

// The pictures in public/cutout/cells/, with their pixel sizes.
const PICS = {
  vitruvian: [1280, 1774],
  cheek: [1280, 960],
  ecoli: [1280, 931],
  balance: [1280, 960],
  kitchen: [1280, 1707],
  diagram: [1280, 1038],
  sem: [1280, 1592],
} as const;
export const Cut = makeCut("cells", PICS);

const ring = (cx: number, cy: number, r: number, from: number, to: number) =>
  Array.from({ length: 37 }, (_, i) => {
    const a = ((from + ((to - from) * i) / 36) * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });

// Outlines cut around a subject, in the picture's pixels.
const OUTLINE = {
  // Leonardo's circle, and the two bottom corners of his square that stand outside it.
  man: {
    pic: "vitruvian",
    box: [60, 155, 1165, 1170],
    pts: [...ring(642, 738, 572, 137, 403), [1118, 1312], [168, 1312]],
  },
  // The bright disc of the microscope's field, with the one cheek cell in the middle of it.
  field: {
    pic: "cheek",
    box: [300, 146, 738, 738],
    pts: ring(669, 515, 366, 0, 360),
  },
  // The cluster of E. coli, without the surface it stands on or the scale bar.
  cluster: {
    pic: "ecoli",
    box: [195, 105, 730, 705],
    pts: [
      [205, 385],
      [320, 245],
      [510, 190],
      [600, 125],
      [690, 132],
      [770, 115],
      [860, 160],
      [872, 235],
      [912, 290],
      [905, 410],
      [895, 530],
      [880, 640],
      [868, 745],
      [790, 800],
      [650, 800],
      [490, 735],
      [440, 600],
      [545, 450],
      [430, 480],
      [290, 472],
    ],
  },
} as const;

// A scrap of paper with a few words on it, pasted over a picture: the card's second label, where
// the keyword alone would leave a number without its unit or a claim without its qualifier.
const Scrap: React.FC<{
  text: string;
  at: number;
  until?: number;
  x: number;
  y: number;
  size?: number;
  tilt?: number;
  paper?: string;
  ink?: string;
}> = ({
  text,
  at,
  until = Infinity,
  x,
  y,
  size = 64,
  tilt = -4,
  paper = "#fffdf6",
  ink = INK,
}) => {
  const f = useCurrentFrame();
  const boil = useBoil();
  const j = useJitter(`scrap-${text}`);
  if (f <= at || f >= until) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x + j.dx,
        top: y + j.dy,
        width: 0,
        height: 0,
        rotate: `${tilt + j.rot}deg`,
        scale: `${pop(f, at, 6)}`,
        filter:
          "drop-shadow(0 6px 0 rgba(29,18,8,0.16)) drop-shadow(0 10px 14px rgba(29,18,8,0.28))",
      }}
    >
      <div
        style={{
          position: "absolute",
          translate: "-50% -50%",
          background: paper,
          padding: `${size * 0.14}px ${size * 0.45}px ${size * 0.2}px`,
          clipPath:
            "polygon(1% 7%, 38% 0%, 99% 5%, 100% 52%, 98% 96%, 57% 100%, 2% 94%, 0% 48%)",
        }}
      >
        <div
          style={{
            font: `400 ${size}px ${MARKER}`,
            lineHeight: 1.05,
            color: ink,
            whiteSpace: "pre",
            textAlign: "center",
            filter: boil,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// Marker drawn straight onto a card, over the pictures.
const Marker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

// A sheet of coloured tissue laid over part of a picture: it tints what is under it and hides
// nothing. It is pulled across from its left edge, and trimmed to `within`, an outline on the board.
const Tissue: React.FC<{
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  colour: string;
  within: readonly (readonly [number, number])[];
}> = ({ at, x, y, w, h, colour, within }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, at + 7);
  if (t <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        mixBlendMode: "multiply",
        clipPath: `polygon(${within.map(([a, b]) => `${a.toFixed(1)}px ${b.toFixed(1)}px`).join(", ")})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w * t,
          height: h,
          background: colour,
          opacity: 0.62,
        }}
      />
    </div>
  );
};

// A tally in marker: one dot per trillion cells, stacked up from a line in rows of five, so the
// taller stack is the bigger count.
const TALLY = { pitch: 76, r: 30, cols: 5 };
const Tally: React.FC<{
  x: number;
  base: number;
  n: number;
  from: number;
  over: number;
  colour: (i: number) => string;
}> = ({ x, base, n, from, over, colour }) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const e = pop(f, from + (i * over) / n, 5);
        if (e <= 0) return null;
        const [col, row] = [i % TALLY.cols, Math.floor(i / TALLY.cols)];
        const wobble = (k: string) =>
          (random(`tally-${x}-${i}-${k}`) - 0.5) * 9;
        return (
          <circle
            key={i}
            cx={x + (col - (TALLY.cols - 1) / 2) * TALLY.pitch + wobble("x")}
            cy={base - TALLY.pitch / 2 - row * TALLY.pitch + wobble("y")}
            r={TALLY.r * e}
            fill={colour(i)}
            stroke={INK}
            strokeWidth={5}
          />
        );
      })}
    </>
  );
};

// The payoff as a count: the two populations side by side, a dot for every trillion. The human
// stack keeps its red blood cells red, because that is who "they" are in the line being spoken.
const Outnumbered: React.FC = () => {
  const [left, right, base] = [285, 795, 1040];
  return (
    <>
      <Marker>
        <Stroke
          d={`M70 ${base + 8} C 300 ${base}, 760 ${base + 14}, 1010 ${base + 4}`}
          from={F.sentence7 - 2}
          to={F.sentence7 + 8}
          colour={INK}
          width={10}
        />
        <Tally
          x={left}
          base={base - 6}
          n={HUMAN}
          from={F.sentence7}
          over={F.they - F.sentence7}
          colour={(i) => (i < RED ? CORAL : YELLOW)}
        />
        <Tally
          x={right}
          base={base - 6}
          n={BACTERIA}
          from={F.they + 3}
          over={F.outnumbered - F.they - 3}
          colour={() => TEAL}
        />
      </Marker>
      <Scrap
        text="YOUR CELLS"
        at={F.sentence7}
        x={left}
        y={82}
        size={50}
        tilt={-3}
      />
      <Scrap
        text="BACTERIA"
        at={F.they + 3}
        x={right}
        y={82}
        size={50}
        tilt={3}
      />
      <Count
        x={left}
        y={255}
        value={HUMAN}
        at={F.they}
        colour={CORAL}
        size={150}
        unit="TRILLION"
      />
      <Count
        x={right}
        y={255}
        value={BACTERIA}
        at={F.outnumbered}
        colour={TEAL}
        size={170}
        unit="TRILLION"
      />
      <Burst
        at={F.outnumbered}
        x={right}
        y={255}
        r={150}
        colour={YELLOW}
        n={12}
      />
      <Word text="OUTNUMBERED" at={F.outnumbered + 3} size={112} />
    </>
  );
};

// Where the kitchen scale sits on its card, and where a point of the photograph lands on the board,
// so marker can be drawn onto its dial.
const SCALE = { x: 540, y: 625, w: 760, box: [80, 230, 1130, 1230] } as const;
const onScale = (px: number, py: number) => {
  const k = SCALE.w / SCALE.box[2];
  return [
    SCALE.x - SCALE.w / 2 + (px - SCALE.box[0]) * k,
    SCALE.y - (SCALE.box[3] * k) / 2 + (py - SCALE.box[1]) * k,
  ] as const;
};
// The dial reads clockwise to 2 kg, so 200 g is a tenth of the way round from the top (about 40° as photographed). The photograph
// shows the scale empty, its needle at zero; marker rings the 200 g mark and draws no second needle.
const TICK = onScale(628 + Math.sin(0.7) * 258, 955 - Math.cos(0.7) * 258);
const RING = 58;

// Where the figure sits on the first card, and its outline there, so the tissue over the part of
// him that is not human can be trimmed to the paper he is cut from.
const MAN = { x: 540, y: 592, w: 850 };
const MAN_LEFT = MAN.x - MAN.w / 2;
const MAN_ON_BOARD = OUTLINE.man.pts.map(([px, py]) => {
  const [bx, by, bw, bh] = OUTLINE.man.box;
  const k = MAN.w / bw;
  return [
    MAN_LEFT + (px - bx) * k,
    MAN.y - (bh * k) / 2 + (py - by) * k,
  ] as const;
});
const SPLIT = MAN_LEFT + MAN.w * SHARE;

// The passengers pasted round the figure on the last card: where, how big, which way up.
const RIDERS = [
  [175, 300, 250, -14],
  [905, 330, 270, 12],
  [150, 830, 230, 9],
  [915, 850, 250, -8],
  [560, 165, 200, 5],
  [760, 960, 190, 16],
] as const;

// Ten cards in twenty-six seconds.
const Deck: React.FC = () => (
  <Board>
    {/* 1. By cell count, you are less than half human. */}
    <Shot from={0} to={F.sentence2 - 2} tilt={-1.5} sheet={YELLOW}>
      <Cut {...OUTLINE.man} {...MAN} />
      {/* The figure is split where the count splits it: 30 of 68 is the left 44%. */}
      <Tissue
        at={F.half}
        x={SPLIT}
        y={100}
        w={MAN.w}
        h={1000}
        colour={TEAL}
        within={MAN_ON_BOARD}
      />
      <Marker>
        <Stroke
          d={`M${SPLIT + 6} 120 C ${SPLIT - 22} 400, ${SPLIT + 24} 720, ${SPLIT - 4} 1065`}
          from={F.less}
          to={F.half + 2}
          colour={CORAL}
          width={18}
        />
      </Marker>
      <Word
        text="BY CELL COUNT"
        at={F.cell - 4}
        until={F.less - 1}
        size={104}
      />
      <Word text="LESS THAN HALF" at={F.less - 1} size={108} tilt={3} />
    </Shot>

    {/* 2. About thirty trillion of your cells are yours. */}
    <Shot from={F.sentence2 - 2} to={F.thirtyEight - 2} tilt={1.5} sheet={TEAL}>
      <Cut
        {...OUTLINE.field}
        x={540}
        y={585}
        w={810}
        tilt={3}
        punch={F.yours}
        by={1.08}
      />
      <Word text={`${HUMAN} TRILLION`} at={F.thirty} swipe="#bfe9e4" tilt={3} />
      <Scrap
        text="YOURS"
        at={F.yours}
        x={790}
        y={905}
        size={92}
        tilt={-7}
        paper={YELLOW}
      />
    </Shot>

    {/* 3. Thirty-eight trillion are bacteria. */}
    <Shot
      from={F.thirtyEight - 2}
      to={F.sentence4 - 2}
      tilt={-1.5}
      sheet={CORAL}
    >
      <Cut
        pic="ecoli"
        x={540}
        y={585}
        w={860}
        box={[130, 70, 860, 760]}
        tilt={-2}
        punch={F.bacteria}
        by={1.08}
      />
      <Word text={`${BACTERIA} TRILLION`} at={F.thirtyEight} swipe="#ffc9c2" />
      <Scrap
        text="BACTERIA"
        at={F.bacteria}
        x={300}
        y={905}
        size={84}
        tilt={6}
        paper="#bfe9e4"
      />
    </Shot>

    {/* 4. But put them all on a scale, */}
    <Shot from={F.sentence4 - 2} to={F.those - 2} tilt={1.5} sheet="#bfe9e4">
      <Cut
        pic="balance"
        x={540}
        y={590}
        w={900}
        box={[165, 60, 950, 850]}
        tilt={1.5}
      />
      <Cut
        {...OUTLINE.cluster}
        x={322}
        y={770}
        w={290}
        tilt={-8}
        at={F.them}
        edge={8}
      />
      <Word text="ON A SCALE" at={F.on} swipe="#bfe9e4" tilt={3} />
    </Shot>

    {/* 5. and those bacteria weigh about two hundred grams. */}
    <Shot from={F.those - 2} to={F.sentence5 - 2} tilt={-1.5} sheet={YELLOW}>
      <Cut pic="kitchen" x={SCALE.x} y={SCALE.y} w={SCALE.w} box={SCALE.box} />
      <Cut {...OUTLINE.cluster} x={400} y={205} w={215} tilt={9} edge={8} />
      <Scrap
        text={`ALL ${BACTERIA} TRILLION`}
        at={F.thoseBacteria}
        x={775}
        y={150}
        size={54}
        tilt={4}
        paper="#bfe9e4"
      />
      <Marker>
        <Stroke
          d={`M${TICK[0] - RING} ${TICK[1]} a${RING} ${RING} 0 1 1 ${RING * 2} 0 a${RING} ${RING} 0 1 1 ${-RING * 2} 0`}
          from={F.two - 3}
          to={F.two + 5}
          colour={TEAL}
          width={16}
        />
      </Marker>
      <Burst at={F.two} x={540} y={1190} r={125} colour={CORAL} n={12} />
      <Word text="200 GRAMS" at={F.two} size={140} />
    </Shot>

    {/* 6. And your own cells are not what you picture. */}
    <Shot from={F.sentence5 - 2} to={F.eightyFour - 2} tilt={1.5} sheet={TEAL}>
      <Cut pic="diagram" x={540} y={590} w={900} tilt={2} />
      <Word
        text="YOUR OWN CELLS"
        at={F.own}
        until={F.not - 1}
        size={100}
        swipe="#bfe9e4"
        tilt={3}
      />
      <Marker>
        <Stroke
          d="M150 230 C 400 470, 700 720, 945 960"
          from={F.not - 1}
          to={F.not + 6}
          colour={CORAL}
          width={30}
        />
        <Stroke
          d="M930 215 C 690 480, 400 730, 135 975"
          from={F.what - 1}
          to={F.what + 6}
          colour={CORAL}
          width={30}
        />
      </Marker>
      <Word text="NOT WHAT YOU PICTURE" at={F.not - 1} size={80} />
    </Shot>

    {/* 7. Eighty-four percent are red blood cells. */}
    <Shot
      from={F.eightyFour - 2}
      to={F.sentence6 - 2}
      tilt={-1.5}
      sheet={CORAL}
    >
      <Cut
        pic="sem"
        x={540}
        y={590}
        w={830}
        box={[455, 0, 825, 850]}
        tilt={-2}
        punch={F.red}
        by={1.08}
      />
      <Scrap
        text="84%"
        at={F.eightyFour}
        x={275}
        y={300}
        size={170}
        tilt={-7}
        paper={YELLOW}
      />
      <Scrap
        text="BY COUNT"
        at={F.percent}
        x={300}
        y={455}
        size={52}
        tilt={-4}
      />
      <Burst at={F.red} x={540} y={1190} r={125} colour={YELLOW} n={12} />
      <Word
        text="RED BLOOD CELLS"
        at={F.red}
        size={98}
        swipe="#ffc9c2"
        tilt={3}
      />
    </Shot>

    {/* 8. By count, your cells are mostly blood. The claim as the count it is: a dot for each of
        the 30 trillion, the 25 that are red blood cells in red. Card 9 sets the bacteria beside it. */}
    <Shot from={F.sentence6 - 2} to={F.sentence7 - 2}>
      <Marker>
        <g transform="translate(540 1050) scale(1.85) translate(-540 -1050)">
          <Tally
            x={540}
            base={1050}
            n={HUMAN}
            from={F.sentence6}
            over={F.mostly - F.sentence6}
            colour={(i) => (i < RED ? CORAL : YELLOW)}
          />
        </g>
      </Marker>
      <Scrap
        text="BY COUNT"
        at={F.byCount - 4}
        x={300}
        y={150}
        size={96}
        tilt={-6}
      />
      <Burst at={F.mostly} x={540} y={1190} r={125} colour={CORAL} n={12} />
      <Word text="MOSTLY BLOOD" at={F.mostly} size={116} swipe="#ffc9c2" />
    </Shot>

    {/* 9. And they are outnumbered */}
    <Shot from={F.sentence7 - 2} to={F.their - 2}>
      <Outnumbered />
    </Shot>

    {/* 10. by their passengers. */}
    <Shot from={F.their - 2} to={F.end} tilt={-1.5} sheet={TEAL}>
      <Cut {...OUTLINE.man} x={540} y={585} w={640} tilt={2} />
      {RIDERS.map(([x, y, w, tilt], i) => (
        <Cut
          key={x}
          {...OUTLINE.cluster}
          x={x}
          y={y}
          w={w}
          tilt={tilt}
          flip={i % 2 === 1}
          at={F.their + i * 3}
          edge={8}
        />
      ))}
      <Burst
        at={F.passengers}
        x={540}
        y={1190}
        r={125}
        colour={YELLOW}
        n={14}
      />
      <Word text="PASSENGERS" at={F.passengers} swipe="#bfe9e4" tilt={3} />
    </Shot>
  </Board>
);

export const cellCountCutout: Short = {
  slug: "cell-count-cutout",
  title: "By cell count, you are less than half human (cutout)",
  edit,
  looks: [{ id: "Cutout", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "science",
  sfx: [
    { at: 0, name: "pop" },
    { at: F.half, name: "whoosh", volume: 0.3 },
    { at: F.sentence2 - 2, name: "flick" },
    { at: F.thirtyEight - 2, name: "tap" },
    { at: F.sentence4 - 2, name: "pop" },
    { at: F.those - 2, name: "flick" },
    { at: F.two, name: "thud", volume: 0.6 },
    { at: F.sentence5 - 2, name: "tap" },
    { at: F.not - 1, name: "whoosh", volume: 0.35 },
    { at: F.eightyFour - 2, name: "pop" },
    { at: F.red, name: "thud", volume: 0.4 },
    { at: F.sentence6 - 2, name: "flick" },
    { at: F.mostly, name: "thud", volume: 0.4 },
    { at: F.sentence7 - 2, name: "whoosh", volume: 0.35 },
    { at: F.outnumbered, name: "thud", volume: 0.6 },
    { at: F.their - 2, name: "tap" },
    { at: F.passengers, name: "sparkle", volume: 0.4 },
  ],
};
