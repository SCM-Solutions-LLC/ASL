import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  BOARD,
  Board,
  Burst,
  CORAL,
  Count,
  INK,
  PAPER,
  Paper,
  Shot,
  Stroke,
  TEAL,
  Word,
  YELLOW,
  clamp,
  fmt,
  makeCut,
  pop,
  ramp,
  useBoil,
} from "../../deck/kit";
import { makeEdit } from "../../edit";
import { MARKER } from "../../fonts";
import alignment from "../../generated/deepest-hole.alignment.json";
import type { Short } from "../types";

// The deepest-hole short as a deck of collage cards: same voice-over, same script, same sourced
// numbers as src/shorts/deepest-hole, with a new picture track. See src/deck/kit.tsx for the look and
// src/shorts/cleopatra-cutout for the deck this one follows.
//
// The pictures are real public-domain ones: the Soviet Union's own 1987 postage stamp of the Kola
// borehole, a CIA map of the USSR, NASA's Blue Marble, a museum's dinner plate and two drill bits.
// Only the stamp shows the Kola well itself, so only the stamp is labelled as it; the bits are any
// bits and are called no more than that. Where there is no picture to be had — the crust in
// section, a thermometer, the inside of the Earth — the card is cut from coloured paper and drawn
// in marker instead. public/SOURCES.json carries where each picture came from.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["dinner", "plate."],
    ["nineteen", "years."],
    ["twelve", "kilometres"],
    ["crust."],
    ["hundred", "and", "eighty"],
    ["six", "thousand"],
  ],
  breakAfter: ["dug"],
});

// Every card and every beat inside a card hangs off a spoken word.
const F = {
  deepest: edit.at("deepest"),
  humans: edit.at("humans"),
  dug: edit.at("dug"),
  wide: edit.at("wide"),
  as: edit.at("as", 1),
  dinner: edit.at("dinner"),
  sentence2: edit.at("it"),
  took: edit.at("took"),
  soviet: edit.at("soviet"),
  nineteen: edit.at("nineteen"),
  years: edit.at("years."),
  sentence3: edit.at("it", 1),
  goes: edit.at("goes"),
  twelve: edit.at("twelve"),
  kilometres: edit.at("kilometres"),
  sentence4: edit.at("and"),
  never: edit.at("never"),
  through: edit.at("through"),
  crust: edit.at("crust."),
  sentence5: edit.at("at"),
  bottom: edit.at("bottom,"),
  hundred: edit.at("hundred"),
  eighty: edit.at("eighty"),
  too: edit.at("too"),
  keep: edit.at("keep"),
  again: edit.at("twelve", 1),
  downAgain: edit.at("down", 1),
  sentence7: edit.at("the", 5),
  centre: edit.at("centre"),
  six: edit.at("six"),
  more: edit.at("more."),
  end: edit.duration,
};

// The numbers on screen, each from script/deepest-hole.txt.
const DEPTH_M = 12262;
const BORE_CM = 23;
// The plate in the picture is 26 cm across by its museum's record, so the hole can be drawn against
// it to scale: a little smaller, as the script's notes say a dinner plate is.
const PLATE_CM = 26;
const STARTED = 1970;
const REACHED = 1989;
const ROCK_C = 180;
const EXPECTED_C = 100;
const EARTH_KM = 6371;
// The hole stopped about a third of the way through the crust. The script's notes give that
// fraction and flag the crust's thickness in kilometres as unconfirmed, so the drawing is made
// from the fraction and no thickness is written on it.
const THROUGH_CRUST = 1 / 3;
const SHARE = (DEPTH_M / 1000 / EARTH_KM) * 100; // 0.19%, shown as 0.2%
// Where the layers of the Earth change, as fractions of its radius (PREM, from the script's notes).
const OUTER_CORE = 3480 / EARTH_KM;
const INNER_CORE = 1221 / EARTH_KM;

const KRAFT = "#d3ae7d";
const NIGHT = "#22304f";
const CREAM = "#fffdf6";

// The pictures in public/cutout/hole/, with their pixel sizes.
const PICS = {
  stamp: [560, 800],
  plate: [1280, 843],
  map: [1280, 930],
  bit: [960, 1280],
  wornbit: [1280, 1034],
  earth: [1280, 1281],
} as const;
const Cut = makeCut("hole", PICS);

const ellipse = (cx: number, cy: number, rx: number, ry = rx, n = 48) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as const;
  });

// Outlines cut around a subject, in the picture's pixels.
const OUTLINE = {
  // The disc of the Earth, without the black of space around it.
  earth: {
    pic: "earth",
    box: [73, 74, 1132, 1132],
    pts: ellipse(639, 640, 566),
  },
  // The plate is photographed at an angle, so its rim is an ellipse: 358 by 190 pixels.
  plate: {
    pic: "plate",
    box: [262, 232, 728, 392],
    pts: ellipse(626, 428, 358, 190),
  },
  // The three toothed cones of the bit, without the museum case and the gloved hands around it.
  bit: {
    pic: "bit",
    box: [0, 160, 960, 960],
    pts: [
      [120, 205],
      [260, 172],
      [385, 190],
      [455, 268],
      [530, 250],
      [650, 236],
      [790, 250],
      [885, 330],
      [930, 470],
      [918, 610],
      [845, 725],
      [725, 770],
      [705, 860],
      [712, 960],
      [640, 1062],
      [500, 1104],
      [330, 1092],
      [205, 1005],
      [168, 880],
      [186, 770],
      [110, 705],
      [28, 640],
      [8, 520],
      [36, 400],
      [78, 285],
    ],
  },
} as const;

// A word or two in marker: a label on a picture rather than the card's keyword. `tag` puts it on a
// strip of paper, for where it has to sit on top of a photograph.
const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  at: number;
  size?: number;
  colour?: string;
  tilt?: number;
  tag?: string;
}> = ({ x, y, text, at, size = 46, colour = INK, tilt = -2, tag }) => {
  const f = useCurrentFrame();
  const boil = useBoil();
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
        filter: tag ? undefined : boil,
      }}
    >
      <div
        style={{
          position: "absolute",
          translate: "-50% -50%",
          rotate: `${tilt}deg`,
          font: `400 ${size}px ${MARKER}`,
          lineHeight: 1.1,
          color: colour,
          whiteSpace: "nowrap",
          background: tag,
          padding: tag ? `${size * 0.14}px ${size * 0.42}px` : 0,
          boxShadow: tag ? "0 7px 0 rgba(29,18,8,0.18)" : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Marker strokes over a card, boiling like the lettering.
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

// Pieces of coloured paper, pasted flat: a shadow under them and no wobble.
const Pieces: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    style={{
      position: "absolute",
      inset: 0,
      overflow: "visible",
      filter: "drop-shadow(0 8px 0 rgba(29,18,8,0.16))",
    }}
    width={BOARD.w}
    height={BOARD.h}
  >
    {children}
  </svg>
);

// A drilling derrick in five marker strokes, standing on (x, y).
const derrick = (x: number, y: number, h: number) =>
  [
    `M${x - h * 0.3} ${y} L${x} ${y - h} L${x + h * 0.3} ${y}`,
    `M${x - h * 0.2} ${y - h * 0.33} L${x + h * 0.2} ${y - h * 0.33}`,
    `M${x - h * 0.1} ${y - h * 0.66} L${x + h * 0.1} ${y - h * 0.66}`,
    `M${x - h * 0.3} ${y} L${x + h * 0.2} ${y - h * 0.33} L${x - h * 0.1} ${y - h * 0.66}`,
  ].join(" ");

// "As wide as a dinner plate": the mouth of the hole as a disc of black paper with its width marked
// over it, and then a real dinner plate dropped on top, which covers it.
const Hole: React.FC = () => {
  const f = useCurrentFrame();
  const [x, y] = [540, 700];
  const w = 800;
  const k = (w / OUTLINE.plate.box[2]) * (BORE_CM / PLATE_CM);
  const [rx, ry] = [358 * k, 190 * k];
  const lineY = y - ry - 78;
  const covered = f >= F.dinner + 5;
  return (
    <>
      {!covered && (
        <>
          <Pieces>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={INK} />
          </Pieces>
          <Label
            x={x}
            y={y}
            text="THE HOLE"
            at={F.wide + 1}
            size={84}
            colour={PAPER}
            tilt={-3}
          />
        </>
      )}
      <Cut
        {...OUTLINE.plate}
        x={x}
        y={y - 4}
        w={w}
        tilt={0}
        at={F.dinner}
        edge={10}
      />
      <Marks>
        <Stroke
          d={`M${x - rx} ${lineY} C ${x - 120} ${lineY + 9}, ${x + 120} ${lineY - 9}, ${x + rx} ${lineY}`}
          from={F.wide + 2}
          to={F.as}
          colour={YELLOW}
          width={18}
        />
        <Stroke
          d={`M${x - rx} ${lineY - 44} L${x - rx} ${lineY + 44} M${x + rx} ${lineY - 44} L${x + rx} ${lineY + 44}`}
          from={F.as - 3}
          to={F.as + 3}
          colour={YELLOW}
          width={18}
        />
      </Marks>
      <Label
        x={x}
        y={lineY - 118}
        text={`${BORE_CM} CM WIDE`}
        at={F.as}
        size={124}
        colour={PAPER}
        tilt={-3}
      />
      <Burst at={F.dinner} x={x} y={y} r={230} colour={YELLOW} n={14} />
      <Word
        text="DINNER PLATE"
        at={F.dinner + 2}
        size={116}
        swipe="#bfe9e4"
        tilt={3}
      />
    </>
  );
};

// "It goes down twelve kilometres": the ground in section, the stamp's own drawing of the well
// pasted into it, and a marker line measured straight down beside it while the metres count up.
const Down: React.FC = () => {
  const f = useCurrentFrame();
  const [top, bottom] = [240, 1040];
  const landed = F.kilometres + 8;
  const t = ramp(f, F.goes, landed);
  const x = 450;
  return (
    <>
      <Pieces>
        <polygon
          points={`46,${top + 4} 420,${top - 6} 1034,${top + 2} 1030,1086 600,1094 50,1088`}
          fill={KRAFT}
        />
      </Pieces>
      <Cut
        pic="stamp"
        x={255}
        y={(top + bottom) / 2 + 14}
        w={120}
        box={[318, 62, 100, 700]}
        tilt={0}
        edge={8}
      />
      <Marks>
        <Stroke
          d={`M30 ${top} C 300 ${top - 8}, 760 ${top + 8}, 1050 ${top}`}
          from={F.sentence3 - 2}
          to={F.sentence3 + 6}
          colour={INK}
          width={12}
        />
        <Stroke
          d={derrick(x, top - 6, 150)}
          from={F.sentence3}
          to={F.goes}
          colour={INK}
          width={9}
        />
        <Stroke
          d={`M${x} ${top + 14} C ${x + 5} ${top + 300}, ${x - 5} ${bottom - 300}, ${x} ${bottom}`}
          from={F.goes}
          to={landed}
          colour={CORAL}
          width={20}
        />
        <Stroke
          d={`M${x - 38} ${bottom - 44} L${x} ${bottom + 4} L${x + 38} ${bottom - 44}`}
          from={landed - 2}
          to={landed + 3}
          colour={CORAL}
          width={20}
        />
      </Marks>
      <Count
        x={760}
        y={600}
        value={Math.round(DEPTH_M * t)}
        at={F.goes}
        colour={CORAL}
        size={142}
        unit="METRES"
      />
      <Burst at={landed} x={760} y={600} r={170} colour={YELLOW} n={12} />
      <Word text="12 KM DOWN" at={F.twelve} />
    </>
  );
};

// "It never made it through the crust": two bands of paper, crust over mantle, the hole drawn a
// third of the way down the first, and the rest of the way dotted in.
const Crust: React.FC = () => {
  const f = useCurrentFrame();
  const [top, moho, floor] = [250, 830, 1086];
  const x = 300;
  const holeEnd = top + (moho - top) * THROUGH_CRUST;
  const rest = ramp(f, F.through - 4, F.through + 4);
  return (
    <>
      <Pieces>
        <polygon
          points={`50,${moho - 30} 1030,${moho - 30} 1034,${floor} 600,${floor + 8} 46,${floor + 2}`}
          fill={CORAL}
        />
      </Pieces>
      <Pieces>
        <polygon
          points={`46,${top + 4} 420,${top - 6} 1034,${top + 2} 1030,${moho - 6} 760,${moho + 10} 520,${moho - 8} 280,${moho + 8} 50,${moho - 4}`}
          fill={KRAFT}
        />
      </Pieces>
      <Marks>
        <Stroke
          d={`M30 ${top} C 300 ${top - 8}, 760 ${top + 8}, 1050 ${top}`}
          from={F.sentence4 - 2}
          to={F.sentence4 + 6}
          colour={INK}
          width={12}
        />
        <Stroke
          d={derrick(x, top - 6, 130)}
          from={F.sentence4}
          to={F.sentence4 + 8}
          colour={INK}
          width={9}
        />
        <line
          x1={x}
          y1={holeEnd + 34}
          x2={x}
          y2={moho - 14}
          stroke={PAPER}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray="6 34"
          opacity={rest}
        />
        <Stroke
          d={`M${x} ${top + 12} L${x} ${holeEnd}`}
          from={F.never - 2}
          to={F.never + 10}
          colour={INK}
          width={20}
        />
        <Stroke
          d={`M${x - 46} ${holeEnd + 6} L${x + 46} ${holeEnd + 6}`}
          from={F.never + 10}
          to={F.never + 14}
          colour={INK}
          width={20}
        />
      </Marks>
      <Label
        x={760}
        y={650}
        text="CRUST"
        at={F.sentence4 + 4}
        size={120}
        colour="#7a5527"
        tilt={-3}
      />
      <Label
        x={740}
        y={965}
        text="MANTLE"
        at={F.sentence4 + 8}
        size={96}
        colour={PAPER}
        tilt={2}
      />
      <Label
        x={650}
        y={holeEnd - 6}
        text="ABOUT A THIRD OF THE WAY"
        at={F.crust - 2}
        size={40}
        tag={CREAM}
        tilt={-2}
      />
      <Word text="STILL IN THE CRUST" at={F.through} size={84} />
    </>
  );
};

// "A hundred and eighty degrees": a thermometer in marker. The mark at a hundred is what was
// expected at that depth when the well was planned; the mercury goes straight past it.
const Thermometer: React.FC = () => {
  const f = useCurrentFrame();
  const x = 330;
  const yAt = (c: number) => 850 - c * 2.9;
  const bulb = 938;
  const level = yAt(ROCK_C * ramp(f, F.hundred, F.eighty + 2));
  const body = `M${x - 35} ${bulb - 72} L${x - 35} 275 A35 35 0 0 1 ${x + 35} 275 L${x + 35} ${bulb - 72} A80 80 0 1 1 ${x - 35} ${bulb - 72} Z`;
  return (
    <>
      <Cut {...OUTLINE.bit} x={770} y={835} w={390} tilt={9} edge={9} />
      <Pieces>
        <path d={body} fill={CREAM} />
      </Pieces>
      <Marks>
        <circle cx={x} cy={bulb} r={54} fill={CORAL} />
        <line
          x1={x}
          y1={bulb - 30}
          x2={x}
          y2={level}
          stroke={CORAL}
          strokeWidth={34}
          strokeLinecap="round"
        />
        <path
          d={body}
          stroke={INK}
          strokeWidth={13}
          strokeLinejoin="round"
          fill="none"
        />
        {[0, 50, 100, 150, 200].map((c) => (
          <line
            key={c}
            x1={x + 44}
            y1={yAt(c)}
            x2={x + (c % 100 ? 78 : 104)}
            y2={yAt(c)}
            stroke={INK}
            strokeWidth={9}
            strokeLinecap="round"
          />
        ))}
        <Stroke
          d={`M${x + 50} ${yAt(ROCK_C)} L${x + 170} ${yAt(ROCK_C)}`}
          from={F.eighty}
          to={F.eighty + 5}
          colour={CORAL}
          width={16}
        />
      </Marks>
      <Label
        x={x + 330}
        y={yAt(EXPECTED_C)}
        text={`EXPECTED: ${EXPECTED_C} °C`}
        at={F.hundred + 2}
        size={50}
        tilt={-2}
      />
      <Label
        x={x + 410}
        y={yAt(ROCK_C) - 4}
        text="THE ROCK"
        at={F.eighty + 2}
        size={78}
        colour={CORAL}
        tilt={-3}
      />
      <Burst at={F.eighty} x={x} y={yAt(ROCK_C)} r={90} colour={CORAL} n={10} />
      <Word text={`${ROCK_C} °C`} at={F.eighty} size={150} />
    </>
  );
};

// The Earth, and where the hole is on it: nowhere that can be drawn. At this size twelve
// kilometres is a fraction of a pixel, so the hole is pointed at and labelled instead.
const EARTH = { x: 540, y: 650 };

const Planet: React.FC = () => (
  <>
    <Cut {...OUTLINE.earth} x={EARTH.x} y={EARTH.y} w={700} edge={10} />
    <Marks>
      <Stroke
        d={`M${EARTH.x - 4} 218 C ${EARTH.x + 6} 240, ${EARTH.x - 6} 262, ${EARTH.x} 288`}
        from={F.downAgain - 4}
        to={F.downAgain + 2}
        colour={YELLOW}
        width={14}
      />
      <Stroke
        d={`M${EARTH.x - 26} 262 L${EARTH.x} 292 L${EARTH.x + 26} 262`}
        from={F.downAgain}
        to={F.downAgain + 4}
        colour={YELLOW}
        width={14}
      />
    </Marks>
    <Label
      x={EARTH.x}
      y={172}
      text="THE HOLE: TOO SMALL TO DRAW"
      at={F.downAgain - 6}
      size={46}
      tag={CREAM}
      tilt={-2}
    />
    <Word text="12 KM DOWN" at={F.again + 2} swipe="#bfe9e4" tilt={3} />
  </>
);

// The payoff: the same Earth with a quarter cut away to its centre, the layers in paper, and one
// marker line from the surface to the middle. The hole was 0.2% of that line.
const Centre: React.FC = () => {
  const f = useCurrentFrame();
  const { x, y } = EARTH;
  const R = 430;
  const open = pop(f, F.centre - 4, 9);
  const wedge = (k: number) =>
    `M${x} ${y} L${x} ${y - R * k} A${R * k} ${R * k} 0 0 1 ${x + R * k} ${y} Z`;
  return (
    <>
      <Cut {...OUTLINE.earth} x={x} y={y} w={R * 2} edge={10} />
      <svg
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          filter: "drop-shadow(0 8px 0 rgba(29,18,8,0.22))",
          transformOrigin: `${x}px ${y}px`,
          scale: `${open}`,
          opacity: interpolate(open, [0, 0.4], [0, 1], clamp),
        }}
        width={BOARD.w}
        height={BOARD.h}
      >
        {(
          [
            [1, "#e8843c"],
            [OUTER_CORE, YELLOW],
            [INNER_CORE, "#fff3c4"],
          ] as const
        ).map(([k, fill]) => (
          <path
            key={fill}
            d={wedge(k)}
            fill={fill}
            stroke={CREAM}
            strokeWidth={9}
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <Marks>
        <Stroke
          d={`M${x} ${y - R - 6} L${x} ${y}`}
          from={F.centre}
          to={F.six}
          colour={CREAM}
          width={30}
        />
        <Stroke
          d={`M${x} ${y - R - 6} L${x} ${y}`}
          from={F.centre}
          to={F.six}
          colour={INK}
          width={14}
        />
        <circle
          cx={x}
          cy={y}
          r={24 * pop(f, F.six - 2)}
          fill={CORAL}
          stroke={INK}
          strokeWidth={9}
        />
      </Marks>
      <Label
        x={x + R * 0.5}
        y={y - R * 0.6}
        text="MANTLE"
        at={F.centre + 4}
        size={50}
        colour={PAPER}
        tilt={-4}
      />
      <Label
        x={x + R * 0.27}
        y={y - R * 0.24}
        text="CORE"
        at={F.centre + 8}
        size={44}
        tilt={-4}
      />
      <Label
        x={x - 150}
        y={y + 60}
        text="THE CENTRE"
        at={F.centre + 2}
        size={46}
        tag={CREAM}
        tilt={3}
      />
      <Burst at={F.six} x={x} y={y} r={120} colour={YELLOW} n={12} />
      <Label
        x={x}
        y={128}
        text={`THE HOLE: ${SHARE.toFixed(1)}% OF THE WAY`}
        at={F.more + 6}
        size={60}
        tag={YELLOW}
        tilt={-2}
      />
      <Burst at={F.more + 6} x={x} y={128} r={150} colour={CORAL} n={14} />
      <Word text={`${fmt(6000)} KM MORE`} at={F.six} size={104} />
    </>
  );
};

// Eleven cards in twenty-four seconds.
const Deck: React.FC = () => (
  <Board>
    <Shot from={0} to={F.wide - 2} tilt={-1.5} sheet={CORAL}>
      <Cut
        pic="stamp"
        x={540}
        y={600}
        w={590}
        tilt={-2.5}
        punch={F.dug}
        by={1.06}
      />
      <Label
        x={540}
        y={112}
        text="THE KOLA BOREHOLE, USSR"
        at={F.humans}
        size={54}
        tag={CREAM}
        tilt={2}
      />
      <Burst at={F.deepest} x={540} y={1190} r={190} colour={YELLOW} n={14} />
      <Word text="DEEPEST HOLE" at={F.deepest} size={120} />
    </Shot>

    <Shot from={F.wide - 2} to={F.sentence2 - 2} tilt={1.5} sheet={TEAL}>
      <Hole />
    </Shot>

    <Shot from={F.sentence2 - 2} to={F.nineteen - 2} tilt={-1.5} sheet={YELLOW}>
      <Cut
        pic="map"
        x={540}
        y={580}
        w={960}
        box={[8, 8, 1264, 914]}
        tilt={1.5}
      />
      <Marks>
        <Stroke
          d="M282 420 C 286 348, 422 344, 426 416 C 430 488, 292 496, 286 408"
          from={F.took - 2}
          to={F.took + 10}
          colour={CORAL}
          width={14}
        />
      </Marks>
      <Label
        x={640}
        y={318}
        text="KOLA PENINSULA"
        at={F.took + 6}
        size={46}
        tag={CREAM}
        tilt={-3}
      />
      <Word text="SOVIET UNION" at={F.soviet} size={116} />
    </Shot>

    <Shot from={F.nineteen - 2} to={F.sentence3 - 2} tilt={1.5} sheet="#bfe9e4">
      <Cut
        pic="stamp"
        x={540}
        y={450}
        w={580}
        box={[48, 318, 290, 268]}
        tilt={-2}
        tone="contrast(1.15)"
      />
      <Label
        x={770}
        y={196}
        text="THE DRILL TOWER"
        at={F.nineteen + 4}
        size={44}
        tag={CREAM}
        tilt={3}
      />
      <Label
        x={250}
        y={900}
        text={`${STARTED}`}
        at={F.nineteen}
        size={130}
        tilt={-4}
      />
      <Marks>
        <Stroke
          d="M410 905 C 500 895, 580 912, 680 900"
          from={F.nineteen + 3}
          to={F.years}
          colour={CORAL}
          width={18}
        />
        <Stroke
          d="M640 860 L686 900 L642 944"
          from={F.years - 3}
          to={F.years + 2}
          colour={CORAL}
          width={18}
        />
      </Marks>
      <Label
        x={850}
        y={895}
        text={`${REACHED}`}
        at={F.years}
        size={130}
        colour={CORAL}
        tilt={3}
      />
      <Burst at={F.years} x={850} y={895} r={150} colour={YELLOW} n={12} />
      <Word
        text={`${REACHED - STARTED} YEARS`}
        at={F.nineteen}
        swipe="#ffc9c2"
        tilt={3}
      />
    </Shot>

    <Shot from={F.sentence3 - 2} to={F.sentence4 - 2} tilt={-1}>
      <Down />
    </Shot>

    <Shot from={F.sentence4 - 2} to={F.sentence5 - 2} tilt={1}>
      <Crust />
    </Shot>

    <Shot from={F.sentence5 - 2} to={F.hundred - 2} tilt={-1.5} sheet={TEAL}>
      <Cut {...OUTLINE.bit} x={540} y={620} w={760} tilt={-3} />
      <Label
        x={790}
        y={225}
        text="A DRILL BIT"
        at={F.sentence5 + 4}
        size={48}
        tag={CREAM}
        tilt={4}
      />
      <Word text="AT THE BOTTOM" at={F.bottom} size={110} swipe="#bfe9e4" />
    </Shot>

    <Shot from={F.hundred - 2} to={F.too - 2} tilt={1.5} sheet="#ffc9c2">
      <Thermometer />
    </Shot>

    <Shot from={F.too - 2} to={F.again - 2} tilt={-1.5} sheet={YELLOW}>
      <Cut
        pic="wornbit"
        x={540}
        y={590}
        w={900}
        tilt={2}
        punch={F.keep - 1}
        by={1.06}
      />
      <Marks>
        <Stroke
          d="M230 300 C 420 480, 660 700, 850 880"
          from={F.keep - 1}
          to={F.keep + 5}
          colour={CORAL}
          width={30}
        />
        <Stroke
          d="M850 300 C 660 480, 420 700, 230 880"
          from={F.keep + 4}
          to={F.keep + 10}
          colour={CORAL}
          width={30}
        />
      </Marks>
      <Burst at={F.too + 1} x={540} y={1190} r={190} colour={CORAL} n={14} />
      <Word text="TOO HOT" at={F.too + 1} size={150} swipe="#ffc9c2" tilt={3} />
    </Shot>

    <Shot from={F.again - 2} to={F.sentence7 - 2} tilt={1.5} sheet={NIGHT}>
      <Planet />
    </Shot>

    <Shot from={F.sentence7 - 2} to={F.end} tilt={-1.5} sheet={NIGHT}>
      <Centre />
    </Shot>
  </Board>
);

export const deepestHoleCutout: Short = {
  slug: "deepest-hole-cutout",
  title: "The deepest hole ever dug (cutout)",
  edit,
  looks: [{ id: "Cutout", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "geology",
  sfx: [
    { at: 0, name: "pop" },
    { at: F.wide - 2, name: "pop" },
    { at: F.sentence2 - 2, name: "pop" },
    { at: F.nineteen - 2, name: "pop" },
    { at: F.years, name: "thud", volume: 0.4 },
    { at: F.sentence3 - 2, name: "whoosh", volume: 0.35 },
    { at: F.goes, name: "rumble", volume: 0.3 },
    { at: F.kilometres + 8, name: "thud", volume: 0.5 },
    { at: F.sentence4 - 2, name: "pop" },
    { at: F.sentence5 - 2, name: "pop" },
    { at: F.hundred - 2, name: "pop" },
    { at: F.eighty, name: "thud", volume: 0.5 },
    { at: F.too - 2, name: "pop" },
    { at: F.too + 1, name: "thud", volume: 0.6 },
    { at: F.again - 2, name: "whoosh", volume: 0.35 },
    { at: F.sentence7 - 2, name: "pop" },
    { at: F.six, name: "thud", volume: 0.6 },
    { at: F.more + 6, name: "sparkle", volume: 0.4 },
  ],
};
