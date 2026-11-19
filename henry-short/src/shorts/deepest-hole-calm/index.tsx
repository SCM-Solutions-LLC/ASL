import React from "react";
import { useCurrentFrame } from "remotion";
import {
  BOARD,
  Board,
  CORAL,
  INK,
  PAPER,
  Paper,
  Stroke,
  TEAL,
  YELLOW,
  makeCut,
  ramp,
} from "../../deck/kit";
import { makeEdit } from "../../edit";
import { Card, Marks, Pieces, circle } from "../../deck/calm";
import alignment from "../../generated/deepest-hole.alignment.json";
import type { Short } from "../types";

// The deepest-hole short in the calm look: the cutout's paper, colours and photos
// (src/shorts/deepest-hole-cutout), at one card per sentence. Each card drifts slowly and carries
// one keyword, every keyword the same size in the same place. No bursts, punch-ins or pop-ins;
// marker is drawn only where it carries a fact. Every on-screen word and number is one the cutout
// already showed, from script/deepest-hole.txt.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["dinner", "plate."],
    ["twenty", "years."],
    ["twelve", "kilometres"],
    ["crust."],
    ["two", "hundred", "degrees."],
    ["six", "thousand"],
  ],
  breakAfter: ["dug"],
});

const F = {
  deepest: edit.at("deepest"),
  was: edit.at("was"),
  bit: edit.at("bit"),
  dinner: edit.at("dinner"),
  s2: edit.at("it"),
  twenty: edit.at("twenty"),
  s3: edit.at("it", 1),
  goes: edit.at("goes"),
  twelve: edit.at("twelve"),
  kilometres: edit.at("kilometres"),
  s4: edit.at("and"),
  never: edit.at("never"),
  through: edit.at("through"),
  s5: edit.at("at"),
  hundred: edit.at("hundred"),
  degrees: edit.at("degrees."),
  s6: edit.at("drilling"),
  nineteen: edit.at("nineteen"),
  s7: edit.at("twelve", 1),
  s8: edit.at("the", 5),
  centre: edit.at("centre"),
  six: edit.at("six"),
  end: edit.duration,
};

// The numbers on screen, each from script/deepest-hole.txt (see deepest-hole-cutout for the notes).
const BORE_CM = 21;
const PLATE_CM = 25.6; // the photographed plate, by its museum's record
const ROCK_C = 212;
const THROUGH_CRUST = 1 / 3;

const KRAFT = "#d3ae7d";
const NIGHT = "#22304f";
const CREAM = "#fffdf6";

const Cut = makeCut("hole", {
  stamp: [560, 800],
  plate: [960, 896],
  map: [1280, 930],
  bit: [960, 1280],
  wornbit: [1280, 1034],
  earth: [1280, 1281],
} as const);

const ellipse = (cx: number, cy: number, r: number, n = 48) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });
const PLATE_R = 398;
const EARTH = {
  pic: "earth",
  box: [73, 74, 1132, 1132],
  pts: ellipse(639, 640, 566),
} as const;
const PLATE = {
  pic: "plate",
  box: [83, 60, 804, 804],
  pts: ellipse(485, 462, PLATE_R),
} as const;

// The plate, with the 21 cm bit drawn on it to scale (the plate is 25.6 cm across).
const Plate: React.FC = () => {
  const [x, y, w] = [540, 620, 760];
  const r = PLATE_R * (w / PLATE.box[2]) * (BORE_CM / PLATE_CM);
  return (
    <>
      <Cut {...PLATE} x={x} y={y} w={w} edge={10} jitter={0} />
      <Marks>
        <Stroke
          d={circle(x, y, r)}
          from={F.bit}
          to={F.dinner + 6}
          colour={CORAL}
          width={14}
        />
      </Marks>
    </>
  );
};

// The stamp's own drawing of the well in section, uncovered from the top down as the line says
// how deep it goes. A separate card from the crust below, so no depth scale is implied here.
const Down: React.FC = () => {
  const f = useCurrentFrame();
  const [y, w] = [600, 135];
  const box = [312, 40, 112, 724] as const;
  const h = (box[3] * w) / box[2];
  const shown =
    y -
    h / 2 -
    40 +
    (h + 80) * (0.12 + 0.88 * ramp(f, F.goes, F.kilometres + 8));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        clipPath: `inset(0 0 ${BOARD.h - shown}px 0)`,
      }}
    >
      <Cut pic="stamp" x={540} y={y} w={w} box={box} edge={8} jitter={0} />
    </div>
  );
};

// Crust over mantle, the hole drawn a third of the way down the crust and the rest dotted in.
const Crust: React.FC = () => {
  const f = useCurrentFrame();
  const [top, moho, floor, x] = [250, 830, 1086, 300];
  const holeEnd = top + (moho - top) * THROUGH_CRUST;
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
        <line
          x1={x}
          y1={holeEnd + 34}
          x2={x}
          y2={moho - 14}
          stroke={PAPER}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray="6 34"
          opacity={ramp(f, F.through - 4, F.through + 8)}
        />
        <Stroke
          d={`M${x} ${top + 12} L${x} ${holeEnd}`}
          from={F.never - 2}
          to={F.never + 14}
          colour={INK}
          width={20}
        />
        <Stroke
          d={`M${x - 46} ${holeEnd + 6} L${x + 46} ${holeEnd + 6}`}
          from={F.never + 14}
          to={F.never + 20}
          colour={INK}
          width={20}
        />
      </Marks>
    </>
  );
};

// A thermometer whose mercury rises to 212 °C.
const Thermometer: React.FC = () => {
  const f = useCurrentFrame();
  const x = 500;
  const yAt = (c: number) => 850 - c * 2.9;
  const bulb = 938;
  const level = yAt(ROCK_C * ramp(f, F.hundred, F.degrees + 8));
  const body = `M${x - 35} ${bulb - 72} L${x - 35} 275 A35 35 0 0 1 ${x + 35} 275 L${x + 35} ${bulb - 72} A80 80 0 1 1 ${x - 35} ${bulb - 72} Z`;
  return (
    <>
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
      </Marks>
    </>
  );
};

// The Earth, cut open by a line from the surface to the centre.
const Centre: React.FC = () => {
  const f = useCurrentFrame();
  const [x, y, R] = [540, 650, 430];
  return (
    <>
      <Cut {...EARTH} x={x} y={y} w={R * 2} edge={10} jitter={0} />
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
          r={24}
          fill={CORAL}
          stroke={INK}
          strokeWidth={9}
          opacity={ramp(f, F.six - 2, F.six + 4)}
        />
      </Marks>
    </>
  );
};

// Nine cards, one per sentence; the long opening sentence is split in two.
const Deck: React.FC = () => (
  <Board>
    <Card
      from={0}
      to={F.was - 2}
      word="DEEPEST HOLE"
      at={F.deepest}
      sheet={CORAL}
      tilt={-1.5}
    >
      <Cut pic="stamp" x={540} y={600} w={590} tilt={-2.5} jitter={0} />
    </Card>
    <Card
      from={F.was - 2}
      to={F.s2 - 2}
      word={`${BORE_CM} CM BIT`}
      at={F.bit}
      sheet={TEAL}
      tilt={1.5}
    >
      <Plate />
    </Card>
    <Card
      from={F.s2 - 2}
      to={F.s3 - 2}
      word="ABOUT 20 YEARS"
      at={F.twenty}
      sheet={YELLOW}
      tilt={-1.5}
    >
      <Cut
        pic="map"
        x={540}
        y={580}
        w={960}
        box={[8, 8, 1264, 914]}
        tilt={1.5}
        jitter={0}
      />
    </Card>
    <Card
      from={F.s3 - 2}
      to={F.s4 - 2}
      word="12 KM DOWN"
      at={F.twelve}
      sheet="#bfe9e4"
      tilt={1}
    >
      <Down />
    </Card>
    <Card
      from={F.s4 - 2}
      to={F.s5 - 2}
      word="STILL IN THE CRUST"
      at={F.through}
    >
      <Crust />
    </Card>
    <Card
      from={F.s5 - 2}
      to={F.s6 - 2}
      word={`${ROCK_C} °C`}
      at={F.hundred}
      sheet="#ffc9c2"
      tilt={1.5}
    >
      <Thermometer />
    </Card>
    <Card
      from={F.s6 - 2}
      to={F.s7 - 2}
      word="1992"
      at={F.nineteen}
      sheet={YELLOW}
      tilt={-1.5}
    >
      <Cut pic="wornbit" x={540} y={590} w={900} tilt={2} jitter={0} />
    </Card>
    <Card
      from={F.s7 - 2}
      to={F.s8 - 2}
      word="12 KM DOWN"
      at={F.s7}
      sheet={NIGHT}
      tilt={1.5}
    >
      <Cut {...EARTH} x={540} y={650} w={700} edge={10} jitter={0} />
    </Card>
    <Card
      from={F.s8 - 2}
      to={F.end}
      word="6,000+ KM MORE"
      at={F.six}
      sheet={NIGHT}
      tilt={-1.5}
    >
      <Centre />
    </Card>
  </Board>
);

export const deepestHoleCalm: Short = {
  slug: "deepest-hole-calm",
  title: "The deepest hole ever dug (calm)",
  edit,
  looks: [{ id: "Calm", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "geology",
};
