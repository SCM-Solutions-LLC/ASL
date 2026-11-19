import React from "react";
import { useCurrentFrame } from "remotion";
import { Card, Marks, Pieces, circle } from "../../deck/calm";
import {
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
import { clean, makeEdit } from "../../edit";
import { MARKER } from "../../fonts";
import alignment from "../../generated/deepest-hole-long.alignment.json";
import type { Short } from "../types";

// The long deepest-hole short in the calm look: script/deepest-hole-long.txt, one card per
// sentence. Where the read walks through the drilling year by year, the cards share one chart of
// depth against year that gains a point a sentence. Every number drawn is in that script's SOURCES.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["dinner", "plate."],
    ["seventy-two", "centimetres"],
    ["twenty-one", "centimetres"],
    ["american", "record."],
    ["drill", "string", "broke,"],
    ["twelve", "thousand,", "two", "hundred", "and", "sixty-two", "metres."],
    ["hundred", "and", "twenty", "degrees."],
    ["hundred", "and", "eighty."],
    ["funding", "was", "cut."],
    ["crust:"],
    ["six", "thousand"],
  ],
  breakAfter: [
    "dug",
    "seventy,",
    "last,",
    "seventy-nine,",
    "broke,",
    "reached",
    "expected",
    "ninety-two,",
    "oval,",
    "walls",
    "beat",
  ],
});

// Where each sentence starts, and the first time a word is spoken from sentence `s` on.
const S = edit.words
  .filter((w, i) => i === 0 || /\.$/.test(edit.words[i - 1].text))
  .map((w) => w.start);
if (S.length !== 19)
  throw new Error(`expected 19 sentences, found ${S.length}`);
const at = (s: number, word: string) => {
  const hit = edit.words.find(
    (w) => w.start >= S[s] && clean(w.text) === clean(word),
  );
  if (!hit)
    throw new Error(`"${word}" is not spoken in or after sentence ${s}`);
  return hit.start;
};
const cut = (s: number) => (s >= S.length ? edit.duration : S[s] - 2);

// The numbers on screen, each from script/deepest-hole-long.txt.
const PLATE_CM = 25.6; // the photographed plate, by its museum's record
const BIT_CM = 21; // 214 mm bit
const TOP_CM = 72; // 720 mm to 40 m
const THROUGH_CRUST = 1 / 3; // 12.262 of about 40 km

const KRAFT = "#d3ae7d";
const NIGHT = "#22304f";
const CREAM = "#fffdf6";
const MINT = "#bfe9e4";
const PINK = "#ffc9c2";

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

// Small marker text for a scale: axis numbers, never a keyword.
const Tick: React.FC<{
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
}> = ({ x, y, text, anchor = "middle" }) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    dominantBaseline="middle"
    style={{ font: `400 34px ${MARKER}`, fill: INK }}
  >
    {text}
  </text>
);

// A plate photo with circles drawn around it to scale: `rings` in cm, each drawn from its beat.
const Plate: React.FC<{
  pxPerCm: number;
  rings: { cm: number; from: number; to: number }[];
}> = ({ pxPerCm, rings }) => {
  const [x, y] = [540, 610];
  const w = (PLATE.box[2] / (2 * PLATE_R)) * PLATE_CM * pxPerCm;
  return (
    <>
      <Cut
        {...PLATE}
        x={x}
        y={y}
        w={w}
        edge={pxPerCm > 20 ? 10 : 6}
        jitter={0}
      />
      <Marks>
        {rings.map((r) => (
          <Stroke
            key={r.cm}
            d={circle(x, y, (r.cm / 2) * pxPerCm)}
            from={r.from}
            to={r.to}
            colour={CORAL}
            width={14}
          />
        ))}
      </Marks>
    </>
  );
};

// Depth against year, from the script's SOURCES (Lobanov 2021). Dots are dated readings; the
// dashed lines between them only join them up, since the depth between readings is not shown.
const X = (yr: number) => 240 + ((yr - 1970) / 23) * 640;
const KM_PER_MI = 1.609344;
const Y = (km: number) => 250 + (km / 13) * 760;
const PTS = {
  start: [1970.39, 0],
  y1975: [1975.37, 7.263],
  y1979: [1979.45, 9.584],
  y1983: [1983.99, 12.0],
  y1984: [1984.74, 12.066], // 27 September 1984
  branch: [1984.74, 7.01],
  restart: [1985.33, 7.01], // drilling resumed from 7 km seven months after the break
} as const;
const US_RECORD_KM = 9.583;
const FINAL_KM = 12.262;
const PLAN_KM = 13;

const Chart: React.FC<{ stage: number; from: number }> = ({ stage, from }) => {
  const f = useCurrentFrame();
  const t = (s: number) => (s < stage ? 1 : ramp(f, from, from + 40));
  const seg = (
    a: readonly number[],
    b: readonly number[],
    s: number,
    colour = INK,
  ) =>
    stage >= s && (
      <line
        x1={X(a[0])}
        y1={Y(a[1])}
        x2={X(a[0]) + (X(b[0]) - X(a[0])) * t(s)}
        y2={Y(a[1]) + (Y(b[1]) - Y(a[1])) * t(s)}
        stroke={colour}
        strokeWidth={8}
        strokeDasharray="4 18"
        strokeLinecap="round"
      />
    );
  const dot = (p: readonly number[], s: number, colour = CORAL) =>
    stage >= s && (
      <circle
        cx={X(p[0])}
        cy={Y(p[1])}
        r={18 * (s < stage ? 1 : ramp(f, from + 34, from + 40))}
        fill={colour}
        stroke={INK}
        strokeWidth={6}
      />
    );
  const level = (km: number, s: number, colour: string) =>
    stage >= s && (
      <line
        x1={X(1970)}
        y1={Y(km)}
        x2={X(1970) + (X(1993) - X(1970)) * t(s)}
        y2={Y(km)}
        stroke={colour}
        strokeWidth={8}
        strokeDasharray="22 14"
      />
    );
  return (
    <Marks>
      <line
        x1={X(1970)}
        y1={Y(0)}
        x2={X(1993)}
        y2={Y(0)}
        stroke={INK}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <line
        x1={X(1970)}
        y1={Y(0)}
        x2={X(1970)}
        y2={Y(13)}
        stroke={INK}
        strokeWidth={10}
        strokeLinecap="round"
      />
      {[0, 5, 10].map((km) => (
        <React.Fragment key={km}>
          <line
            x1={X(1970) - 18}
            y1={Y(km)}
            x2={X(1970)}
            y2={Y(km)}
            stroke={INK}
            strokeWidth={8}
          />
          <Tick x={X(1970) - 30} y={Y(km)} text={`${km} KM`} anchor="end" />
        </React.Fragment>
      ))}
      {[1970, 1980, 1990].map((yr) => (
        <React.Fragment key={yr}>
          <line
            x1={X(yr)}
            y1={Y(0) - 18}
            x2={X(yr)}
            y2={Y(0)}
            stroke={INK}
            strokeWidth={8}
          />
          <Tick x={X(yr)} y={Y(0) - 46} text={`${yr}`} />
        </React.Fragment>
      ))}
      <line
        x1={X(1993)}
        y1={Y(0)}
        x2={X(1993)}
        y2={Y(13)}
        stroke={INK}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {[2, 4, 6, 8].map((mi) => (
        <React.Fragment key={mi}>
          <line
            x1={X(1993)}
            y1={Y(mi * KM_PER_MI)}
            x2={X(1993) + 18}
            y2={Y(mi * KM_PER_MI)}
            stroke={INK}
            strokeWidth={8}
          />
          <Tick
            x={X(1993) + 28}
            y={Y(mi * KM_PER_MI)}
            text={`${mi} MI`}
            anchor="start"
          />
        </React.Fragment>
      ))}
      {level(US_RECORD_KM, 1, TEAL)}
      {level(PLAN_KM, 5, CORAL)}
      {stage >= 1 && (
        <Tick
          x={X(1970) + 16}
          y={Y(US_RECORD_KM) + 34}
          text="US RECORD"
          anchor="start"
        />
      )}
      {stage >= 5 && (
        <Tick x={X(1970) + 16} y={Y(PLAN_KM) - 28} text="PLAN" anchor="start" />
      )}
      {dot(PTS.start, 0, INK)}
      {seg(PTS.start, PTS.y1975, 0)}
      {dot(PTS.y1975, 0)}
      {seg(PTS.y1975, PTS.y1979, 1)}
      {dot(PTS.y1979, 1)}
      {seg(PTS.y1979, PTS.y1983, 2)}
      {dot(PTS.y1983, 2)}
      {seg(PTS.y1983, PTS.y1984, 3)}
      {stage >= 3 && (
        <Stroke
          d={`M${X(PTS.y1984[0])} ${Y(PTS.y1984[1])} L${X(PTS.branch[0])} ${Y(PTS.branch[1])}`}
          from={stage > 3 ? 0 : from + 30}
          to={stage > 3 ? 1 : from + 50}
          colour={CORAL}
          width={14}
        />
      )}
      {seg(PTS.branch, PTS.restart, 4)}
      {seg(PTS.restart, [1991, FINAL_KM], 4)}
      {stage >= 4 && (
        <Stroke
          d={`M${X(1991)} ${Y(FINAL_KM)} L${X(1991.33)} ${Y(FINAL_KM)}`}
          from={stage > 4 ? 0 : from + 36}
          to={stage > 4 ? 1 : from + 44}
          colour={CORAL}
          width={30}
        />
      )}
    </Marks>
  );
};

// A thermometer with a scale in °C, the expected temperature dashed in at 120 and the mercury
// rising from `from` to `to` degrees between two beats.
const yAt = (c: number) => 880 - c * 2.6;
const Thermometer: React.FC<{
  from: number;
  to: number;
  a: number;
  b: number;
}> = ({ from, to, a, b }) => {
  const f = useCurrentFrame();
  const x = 560;
  const bulb = 968;
  const level = yAt(from + (to - from) * ramp(f, a, b));
  const body = `M${x - 35} ${bulb - 72} L${x - 35} 290 A35 35 0 0 1 ${x + 35} 290 L${x + 35} ${bulb - 72} A80 80 0 1 1 ${x - 35} ${bulb - 72} Z`;
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
          <React.Fragment key={c}>
            <line
              x1={x - 44}
              y1={yAt(c)}
              x2={x - 90}
              y2={yAt(c)}
              stroke={INK}
              strokeWidth={9}
              strokeLinecap="round"
            />
            <Tick
              x={x - 104}
              y={yAt(c)}
              text={c === 200 ? "200 °C" : `${c}`}
              anchor="end"
            />
          </React.Fragment>
        ))}
        {[0, 50, 100, 150, 200].map((c) => (
          <React.Fragment key={c}>
            <line
              x1={x + 44}
              y1={yAt(c)}
              x2={x + 90}
              y2={yAt(c)}
              stroke={INK}
              strokeWidth={9}
              strokeLinecap="round"
            />
            <Tick
              x={x + 104}
              y={yAt(c)}
              text={c === 200 ? "392 °F" : `${(c * 9) / 5 + 32}`}
              anchor="start"
            />
          </React.Fragment>
        ))}
        <line
          x1={x + 44}
          y1={yAt(120)}
          x2={x + 220}
          y2={yAt(120)}
          stroke={TEAL}
          strokeWidth={10}
          strokeDasharray="22 14"
        />
      </Marks>
    </>
  );
};

// Below 7 km the walls kept caving in and the bore went oval with caverns: the hole in section,
// its walls breaking outward in pockets as the line is spoken. Schematic, not to scale.
const Caving: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const f = useCurrentFrame();
  const k = ramp(f, a, b);
  const [top, bottom, half] = [220, 1040, 70];
  const pockets = [
    [380, 70, 1],
    [540, 110, -1],
    [700, 90, 1],
    [860, 120, -1],
    [930, 60, 1],
  ];
  const wall = (side: number) => {
    const pts: string[] = [];
    for (let y = top; y <= bottom; y += 10) {
      const out = pockets.reduce(
        (n, [py, depth, sd]) =>
          n + (sd === side ? depth * k * Math.exp(-(((y - py) / 45) ** 2)) : 0),
        0,
      );
      pts.push(`${540 + side * (half + out)},${y}`);
    }
    return `M${540 + side * 520},${top} L${pts.join(" L")} L${540 + side * 520},${bottom} Z`;
  };
  return (
    <>
      <Pieces>
        <path d={wall(-1)} fill={KRAFT} />
        <path d={wall(1)} fill={KRAFT} />
      </Pieces>
      <Marks>
        <Tick x={1000} y={1005} text="NOT TO SCALE" anchor="end" />
      </Marks>
    </>
  );
};

// Crust over mantle, the hole drawn a third of the way down the crust and the rest dotted in.
const Crust: React.FC<{ a: number; b: number }> = ({ a, b }) => {
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
          opacity={ramp(f, b - 4, b + 8)}
        />
        <Stroke
          d={`M${x} ${top + 12} L${x} ${holeEnd}`}
          from={a}
          to={a + 16}
          colour={INK}
          width={20}
        />
        <Stroke
          d={`M${x - 46} ${holeEnd + 6} L${x + 46} ${holeEnd + 6}`}
          from={a + 16}
          to={a + 22}
          colour={INK}
          width={20}
        />
      </Marks>
    </>
  );
};

// The Earth, cut open by a line from the surface to the centre.
const Centre: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const f = useCurrentFrame();
  const [x, y, R] = [540, 650, 430];
  return (
    <>
      <Cut {...EARTH} x={x} y={y} w={R * 2} edge={10} jitter={0} />
      <Marks>
        <Stroke
          d={`M${x} ${y - R - 6} L${x} ${y}`}
          from={a}
          to={b}
          colour={CREAM}
          width={30}
        />
        <Stroke
          d={`M${x} ${y - R - 6} L${x} ${y}`}
          from={a}
          to={b}
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
          opacity={ramp(f, b - 2, b + 4)}
        />
      </Marks>
    </>
  );
};

const WAS = edit.at("was"); // the opening sentence splits here: the hole, then the plate
const BIG = 12.2; // px per cm when the 72 cm mouth has to fit on the card
const NEAR = 760 / (PLATE.box[2] / (2 * PLATE_R)) / PLATE_CM; // the plate 760 px wide

// Twenty cards for nineteen sentences; the opening one is split in two.
const Deck: React.FC = () => (
  <Board>
    <Card
      from={0}
      to={WAS - 2}
      word="DEEPEST HOLE"
      at={at(0, "deepest")}
      sheet={CORAL}
      tilt={-1.5}
    >
      <Cut pic="stamp" x={540} y={600} w={590} tilt={-2.5} jitter={0} />
    </Card>
    <Card
      from={WAS - 2}
      to={cut(1)}
      word={`${BIT_CM} CM BIT`}
      sub="8 IN"
      at={at(0, "bit")}
      sheet={TEAL}
      tilt={1.5}
    >
      <Plate
        pxPerCm={NEAR}
        rings={[{ cm: BIT_CM, from: at(0, "bit"), to: at(0, "dinner") + 6 }]}
      />
    </Card>
    <Card
      from={cut(1)}
      to={cut(2)}
      word="MAY 1970"
      at={at(1, "may")}
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
      <Marks>
        <Stroke
          d="M282 420 C 286 348, 422 344, 426 416 C 430 488, 292 496, 286 408"
          from={at(1, "kola") - 2}
          to={at(1, "kola") + 14}
          colour={CORAL}
          width={14}
        />
      </Marks>
    </Card>
    <Card
      from={cut(2)}
      to={cut(3)}
      word={`${TOP_CM} CM AT THE TOP`}
      sub="28 IN"
      at={at(2, "seventy-two")}
      sheet={MINT}
      tilt={1}
    >
      <Plate
        pxPerCm={BIG}
        rings={[
          { cm: TOP_CM, from: at(2, "seventy-two"), to: at(2, "wide.") + 6 },
        ]}
      />
    </Card>
    <Card
      from={cut(3)}
      to={cut(4)}
      word={`DOWN TO ${BIT_CM} CM`}
      sub="8 IN"
      at={at(3, "twenty-one")}
      sheet={MINT}
      tilt={1}
    >
      <Plate
        pxPerCm={BIG}
        rings={[
          { cm: TOP_CM, from: 0, to: 1 },
          { cm: BIT_CM, from: at(3, "twenty-one"), to: at(3, "across.") + 6 },
        ]}
      />
    </Card>
    <Card
      from={cut(4)}
      to={cut(5)}
      word="OVER 7 KM"
      sub="OVER 4.3 MI"
      at={at(4, "seven")}
      sheet={CREAM}
    >
      <Chart stage={0} from={S[4]} />
    </Card>
    <Card
      from={cut(5)}
      to={cut(6)}
      word="AMERICAN RECORD"
      at={at(5, "american")}
      sheet={CREAM}
    >
      <Chart stage={1} from={S[5]} />
    </Card>
    <Card
      from={cut(6)}
      to={cut(7)}
      word="12 KM"
      sub="7.5 MI"
      at={at(6, "twelve")}
      sheet={CREAM}
    >
      <Chart stage={2} from={S[6]} />
    </Card>
    <Card
      from={cut(7)}
      to={cut(8)}
      word="BACK TO 7 KM"
      sub="4.3 MI"
      at={at(7, "start")}
      sheet={CREAM}
    >
      <Chart stage={3} from={S[7]} />
    </Card>
    <Card
      from={cut(8)}
      to={cut(9)}
      word="12,262 M"
      sub="40,230 FT"
      at={at(8, "twelve")}
      sheet={CREAM}
    >
      <Chart stage={4} from={S[8]} />
    </Card>
    <Card
      from={cut(9)}
      to={cut(10)}
      word="STILL THE DEEPEST"
      at={at(9, "deeper")}
      sheet={MINT}
      tilt={1.5}
    >
      <Cut
        pic="stamp"
        x={540}
        y={600}
        w={760}
        box={[48, 318, 290, 268]}
        tilt={-2}
        jitter={0}
        tone="contrast(1.15)"
      />
    </Card>
    <Card
      from={cut(10)}
      to={cut(11)}
      word="EXPECTED: 120 °C"
      sub="248 °F"
      at={at(10, "expected")}
      sheet={PINK}
      tilt={1.5}
    >
      <Thermometer from={0} to={0} a={0} b={1} />
    </Card>
    <Card
      from={cut(11)}
      to={cut(12)}
      word="180 °C AT 10 KM"
      sub="356 °F AT 6.2 MI"
      at={at(11, "hundred")}
      sheet={PINK}
      tilt={1.5}
    >
      <Thermometer
        from={0}
        to={180}
        a={at(11, "already")}
        b={at(11, "eighty.") + 8}
      />
    </Card>
    <Card
      from={cut(12)}
      to={cut(13)}
      word="212 °C"
      sub="414 °F"
      at={at(12, "two")}
      sheet={PINK}
      tilt={1.5}
    >
      <Thermometer
        from={180}
        to={212}
        a={at(12, "two")}
        b={at(12, "hundred.") + 8}
      />
    </Card>
    <Card
      from={cut(13)}
      to={cut(14)}
      word="WALLS CAVING IN"
      at={at(13, "caving")}
      sheet={PINK}
      tilt={-1}
    >
      <Caving a={at(13, "walls")} b={at(13, "caverns.") + 8} />
    </Card>
    <Card
      from={cut(14)}
      to={cut(15)}
      word="1992: FUNDING CUT"
      at={at(14, "nineteen")}
      sheet={YELLOW}
      tilt={-1.5}
    >
      <Cut pic="wornbit" x={540} y={590} w={900} tilt={2} jitter={0} />
    </Card>
    <Card
      from={cut(15)}
      to={cut(16)}
      word="PLAN: 13 KM"
      sub="8.1 MI"
      at={at(15, "thirteen")}
      sheet={CREAM}
    >
      <Chart stage={5} from={S[15]} />
    </Card>
    <Card
      from={cut(16)}
      to={cut(17)}
      word="STILL IN THE CRUST"
      at={at(16, "through")}
    >
      <Crust a={at(16, "never")} b={at(16, "third")} />
    </Card>
    <Card
      from={cut(17)}
      to={cut(18)}
      word="12 KM DOWN"
      sub="7.5 MI"
      at={S[17]}
      sheet={NIGHT}
      tilt={1.5}
    >
      <Cut {...EARTH} x={540} y={650} w={700} edge={10} jitter={0} />
    </Card>
    <Card
      from={cut(18)}
      to={cut(19)}
      word="6,000+ KM MORE"
      sub="3,700+ MI"
      at={at(18, "six")}
      sheet={NIGHT}
      tilt={-1.5}
    >
      <Centre a={at(18, "centre")} b={at(18, "six")} />
    </Card>
    <Card
      from={cut(19)}
      to={edit.duration}
      word="HOW DEEP NEXT?"
      at={S[19]}
      sheet={NIGHT}
      tilt={1}
    >
      <Centre a={at(18, "centre")} b={at(18, "six")} />
    </Card>
  </Board>
);

export const deepestHoleLong: Short = {
  slug: "deepest-hole-long",
  title: "The deepest hole ever dug (long)",
  edit,
  looks: [{ id: "Calm", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "discovery",
};
