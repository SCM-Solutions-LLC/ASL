import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
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
  clamp,
  fmt,
  makeCut,
  ramp,
} from "../../deck/kit";
import { makeEdit } from "../../edit";
import { MARKER } from "../../fonts";
import alignment from "../../generated/deepest-hole.alignment.json";
import type { Short } from "../types";

// The deepest-hole short in a calmer deck: the cutout's paper, colours and real photographs
// (src/shorts/deepest-hole-cutout), but one picture per sentence, one keyword per card in one size
// and one place, and no bursts, punch-ins or bounces. Each card drifts in slowly and crossfades to
// the next. Marker is drawn only where it carries the claim: the bit to scale on the plate, the
// depth line, the hole a third of the way through the crust, the line to the centre.
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

// Every card hangs off a spoken word: a card starts two frames before the first word of its
// sentence. "the" is counted from 0: #5 is "The centre", the first word of the last sentence.
const F = {
  deepest: edit.at("deepest"),
  was: edit.at("was"),
  bit: edit.at("bit"),
  sentence2: edit.at("it"),
  soviet: edit.at("soviet"),
  about: edit.at("about"),
  sentence3: edit.at("it", 1),
  kilometres: edit.at("kilometres"),
  sentence4: edit.at("and"),
  never: edit.at("never"),
  through: edit.at("through"),
  sentence5: edit.at("at"),
  rock: edit.at("rock"),
  two: edit.at("two"),
  degrees: edit.at("degrees."),
  sentence6: edit.at("drilling"),
  nineteen: edit.at("nineteen"),
  again: edit.at("twelve", 1),
  sentence7: edit.at("the", 5),
  centre: edit.at("centre"),
  six: edit.at("six"),
  more: edit.at("more."),
  end: edit.duration,
};

// The numbers on screen, each from script/deepest-hole.txt (and the same as the cutout's).
const DEPTH_M = 12262;
const BORE_CM = 21; // 214 mm bit (Lobanov 2021)
const PLATE_CM = 25.6; // the plate's diameter by its museum's record
const ROCK_C = 212; // at about 12 km (Lobanov 2021; Zhu & Huang 2026)
const EARTH_KM = 6371;
const THROUGH_CRUST = 1 / 3; // 12.262 of about 40 km (script source 5)
const SHARE = (DEPTH_M / 1000 / EARTH_KM) * 100; // 0.19%, shown as 0.2%
const OUTER_CORE = 3485 / EARTH_KM; // NSSDC

const KRAFT = "#d3ae7d";
const NIGHT = "#22304f";
const CREAM = "#fffdf6";

const PICS = {
  stamp: [560, 800],
  plate: [960, 896],
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

// Outlines copied from the cutout, in the picture's pixels.
const PLATE_R = 398;
const OUTLINE = {
  earth: { pic: "earth", box: [73, 74, 1132, 1132], pts: ellipse(639, 640, 566) },
  plate: { pic: "plate", box: [83, 60, 804, 804], pts: ellipse(485, 462, PLATE_R) },
  bit: {
    pic: "bit",
    box: [0, 160, 960, 960],
    pts: [
      [120, 205], [260, 172], [385, 190], [455, 268], [530, 250], [650, 236], [790, 250],
      [885, 330], [930, 470], [918, 610], [845, 725], [725, 770], [705, 860], [712, 960],
      [640, 1062], [500, 1104], [330, 1092], [205, 1005], [168, 880], [186, 770], [110, 705],
      [28, 640], [8, 520], [36, 400], [78, 285],
    ],
  },
} as const;

// The one keyword: same size, same place, same style on every card. It fades in and a yellow
// highlighter swipe draws under it; nothing scales, tilts or wobbles.
const KEY_Y = 1205;
const KEY_SIZE = 88;
const Key: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const swipe = ramp(f, at + 1, at + 10);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: KEY_Y,
        height: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity: ramp(f, at, at + 6),
      }}
    >
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: -22,
            top: "20%",
            bottom: "8%",
            width: `calc(${swipe * 100}% + ${swipe * 44}px)`,
            background: YELLOW,
            borderRadius: 16,
          }}
        />
        <div
          style={{
            position: "relative",
            font: `400 ${KEY_SIZE}px ${MARKER}`,
            lineHeight: 1.1,
            color: INK,
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

// A small note, only where accuracy needs one: one size, one place (top centre), cream tag.
const Note: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 86,
        display: "flex",
        justifyContent: "center",
        opacity: ramp(f, at, at + 8),
      }}
    >
      <div
        style={{
          font: `400 40px ${MARKER}`,
          lineHeight: 1.1,
          color: INK,
          background: CREAM,
          padding: "6px 18px",
          boxShadow: "0 6px 0 rgba(29,18,8,0.16)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// One card, one sentence. It fades in over the last card, then zooms and drifts slowly the whole
// time it holds, so the screen is never still. The keyword sits outside the zoom, so it never moves.
const FADE = 8;
const Card: React.FC<{
  from: number;
  to: number;
  tilt: number;
  sheet?: string;
  keyword: string | ((f: number) => string);
  keyAt: number;
  note?: { text: string; at: number };
  children: React.ReactNode;
}> = ({ from, to, tilt, sheet, keyword, keyAt, note, children }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to + FADE) return null;
  const t = interpolate(f, [from, to + FADE], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: PAPER,
        opacity: from === 0 ? 1 : ramp(f, from, from + FADE),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "540px 600px",
          scale: `${1 + 0.06 * t}`,
          translate: `${Math.sign(tilt) * 16 * t}px ${-10 * t}px`,
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
              rotate: `${-tilt}deg`,
              clipPath:
                "polygon(1% 3%, 34% 0%, 71% 2%, 99% 1%, 100% 46%, 98% 98%, 62% 100%, 27% 98%, 0% 100%, 2% 52%)",
            }}
          />
        )}
        {children}
      </div>
      {note && <Note {...note} />}
      <Key text={typeof keyword === "string" ? keyword : keyword(f)} at={keyAt} />
    </div>
  );
};

// Marker lines over a card. Unlike the cutout's, they do not boil.
const Ink: React.FC<{ children: React.ReactNode; shadow?: boolean }> = ({
  children,
  shadow,
}) => (
  <svg
    style={{
      position: "absolute",
      inset: 0,
      overflow: "visible",
      filter: shadow ? "drop-shadow(0 8px 0 rgba(29,18,8,0.16))" : undefined,
    }}
    width={BOARD.w}
    height={BOARD.h}
  >
    {children}
  </svg>
);

// "...with a bit narrower than a dinner plate": the real plate, and the 21 cm bit laid on it as a
// disc of black paper, to scale against the plate's 25.6 cm.
const Plate: React.FC = () => {
  const f = useCurrentFrame();
  const [x, y, w] = [540, 600, 820];
  const r = PLATE_R * (w / OUTLINE.plate.box[2]) * (BORE_CM / PLATE_CM);
  return (
    <>
      <Cut {...OUTLINE.plate} x={x} y={y} w={w} edge={10} />
      <Ink shadow>
        <circle cx={x} cy={y + 2} r={r} fill={INK} opacity={ramp(f, F.bit, F.bit + 10)} />
      </Ink>
    </>
  );
};

// "It goes down twelve kilometres": the ground in section, the stamp's own drawing of the well
// beside it, and one line drawn straight down while the keyword counts the metres.
const DOWN = { top: 240, bottom: 1040, x: 470 };
const depth = (f: number) => ramp(f, F.sentence3, F.kilometres);
const Down: React.FC = () => {
  const { top, bottom, x } = DOWN;
  return (
    <>
      <Ink shadow>
        <polygon
          points={`46,${top + 4} 420,${top - 6} 1034,${top + 2} 1030,1086 600,1094 50,1088`}
          fill={KRAFT}
        />
      </Ink>
      <Cut pic="stamp" x={255} y={(top + bottom) / 2 + 14} w={120} box={[318, 62, 100, 700]} edge={8} />
      <Ink>
        <path
          d={`M30 ${top} C 300 ${top - 8}, 760 ${top + 8}, 1050 ${top}`}
          stroke={INK}
          strokeWidth={12}
          strokeLinecap="round"
          fill="none"
        />
        <Stroke
          d={`M${x} ${top + 14} C ${x + 5} ${top + 300}, ${x - 5} ${bottom - 300}, ${x} ${bottom}`}
          from={F.sentence3}
          to={F.kilometres}
          colour={CORAL}
          width={20}
        />
        <Stroke
          d={`M${x - 38} ${bottom - 44} L${x} ${bottom + 4} L${x + 38} ${bottom - 44}`}
          from={F.kilometres - 2}
          to={F.kilometres + 4}
          colour={CORAL}
          width={20}
        />
      </Ink>
    </>
  );
};

// "And it never made it through the crust": crust over mantle in paper, the hole drawn a third of
// the way down the crust and the rest of the way dotted in.
const Crust: React.FC = () => {
  const f = useCurrentFrame();
  const [top, moho, floor] = [250, 830, 1086];
  const x = 380;
  const holeEnd = top + (moho - top) * THROUGH_CRUST;
  return (
    <>
      <Ink shadow>
        <polygon
          points={`50,${moho - 30} 1030,${moho - 30} 1034,${floor} 600,${floor + 8} 46,${floor + 2}`}
          fill={CORAL}
        />
      </Ink>
      <Ink shadow>
        <polygon
          points={`46,${top + 4} 420,${top - 6} 1034,${top + 2} 1030,${moho - 6} 760,${moho + 10} 520,${moho - 8} 280,${moho + 8} 50,${moho - 4}`}
          fill={KRAFT}
        />
      </Ink>
      <Ink>
        <path
          d={`M30 ${top} C 300 ${top - 8}, 760 ${top + 8}, 1050 ${top}`}
          stroke={INK}
          strokeWidth={12}
          strokeLinecap="round"
          fill="none"
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
          opacity={ramp(f, F.through - 4, F.through + 8)}
        />
        <Stroke d={`M${x} ${top + 12} L${x} ${holeEnd}`} from={F.sentence4} to={F.never + 10} colour={INK} width={20} />
        <Stroke
          d={`M${x - 46} ${holeEnd + 6} L${x + 46} ${holeEnd + 6}`}
          from={F.never + 10}
          to={F.never + 15}
          colour={INK}
          width={20}
        />
      </Ink>
    </>
  );
};

// "At the bottom, the rock was over two hundred degrees": a drill bit (any bit, not Kola's) and a
// marker thermometer whose mercury rises past the 200 mark as the line is spoken.
const Thermometer: React.FC = () => {
  const f = useCurrentFrame();
  const x = 330;
  const yAt = (c: number) => 850 - c * 2.9;
  const bulb = 938;
  const level = yAt(ROCK_C * ramp(f, F.rock, F.degrees + 4));
  const body = `M${x - 35} ${bulb - 72} L${x - 35} 275 A35 35 0 0 1 ${x + 35} 275 L${x + 35} ${bulb - 72} A80 80 0 1 1 ${x - 35} ${bulb - 72} Z`;
  return (
    <>
      <Cut {...OUTLINE.bit} x={740} y={620} w={460} tilt={4} edge={9} />
      <Ink shadow>
        <path d={body} fill={CREAM} />
      </Ink>
      <Ink>
        <circle cx={x} cy={bulb} r={54} fill={CORAL} />
        <line x1={x} y1={bulb - 30} x2={x} y2={level} stroke={CORAL} strokeWidth={34} strokeLinecap="round" />
        <path d={body} stroke={INK} strokeWidth={13} strokeLinejoin="round" fill="none" />
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
      </Ink>
    </>
  );
};

// The Earth. At this size twelve kilometres is a fraction of a pixel and Kola is not on this
// photo's visible face, so the hole is named in a note, never pointed at.
const EARTH = { x: 540, y: 650 };

// The payoff: the same Earth with a quarter cut away to its centre, and one line from the surface
// to the middle. The card's note says what share of that line the hole was.
const Centre: React.FC = () => {
  const f = useCurrentFrame();
  const { x, y } = EARTH;
  const R = 430;
  const open = ramp(f, F.sentence7, F.centre + 8);
  const wedge = (k: number) => `M${x} ${y} L${x} ${y - R * k} A${R * k} ${R * k} 0 0 1 ${x + R * k} ${y} Z`;
  return (
    <>
      <Cut {...OUTLINE.earth} x={x} y={y} w={R * 2} edge={10} />
      <svg
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          filter: "drop-shadow(0 8px 0 rgba(29,18,8,0.22))",
          opacity: open,
        }}
        width={BOARD.w}
        height={BOARD.h}
      >
        {(
          [
            [1, "#e8843c"],
            [OUTER_CORE, YELLOW],
          ] as const
        ).map(([k, fill]) => (
          <path key={fill} d={wedge(k)} fill={fill} stroke={CREAM} strokeWidth={9} strokeLinejoin="round" />
        ))}
      </svg>
      <Ink>
        <Stroke d={`M${x} ${y - R - 6} L${x} ${y}`} from={F.centre} to={F.six} colour={CREAM} width={30} />
        <Stroke d={`M${x} ${y - R - 6} L${x} ${y}`} from={F.centre} to={F.six} colour={INK} width={14} />
        <circle cx={x} cy={y} r={24} fill={CORAL} stroke={INK} strokeWidth={9} opacity={ramp(f, F.six - 2, F.six + 4)} />
      </Ink>
    </>
  );
};

// Nine cards in twenty-eight seconds: one per sentence, the first sentence split at "was finished".
const Deck: React.FC = () => (
  <Board>
    <Card from={0} to={F.was - 2} tilt={-1.5} sheet={CORAL} keyword="DEEPEST HOLE" keyAt={F.deepest}>
      <Cut pic="stamp" x={540} y={600} w={590} tilt={-2.5} />
    </Card>

    <Card from={F.was - 2} to={F.sentence2 - 2} tilt={1.5} sheet={TEAL} keyword={`${BORE_CM} CM BIT`} keyAt={F.bit}>
      <Plate />
    </Card>

    <Card from={F.sentence2 - 2} to={F.sentence3 - 2} tilt={-1.5} sheet={YELLOW} keyword="ABOUT 20 YEARS" keyAt={F.about}>
      <Cut pic="map" x={540} y={580} w={960} box={[8, 8, 1264, 914]} tilt={1.5} />
      <Ink>
        <Stroke
          d="M282 420 C 286 348, 422 344, 426 416 C 430 488, 292 496, 286 408"
          from={F.soviet - 4}
          to={F.soviet + 14}
          colour={CORAL}
          width={14}
        />
      </Ink>
    </Card>

    <Card
      from={F.sentence3 - 2}
      to={F.sentence4 - 2}
      tilt={1}
      keyword={(f) => `${fmt(Math.round(DEPTH_M * depth(f)))} METRES`}
      keyAt={F.sentence3}
    >
      <Down />
    </Card>

    <Card from={F.sentence4 - 2} to={F.sentence5 - 2} tilt={-1} keyword="STILL IN THE CRUST" keyAt={F.never}>
      <Crust />
    </Card>

    <Card from={F.sentence5 - 2} to={F.sentence6 - 2} tilt={1.5} sheet="#ffc9c2" keyword={`${ROCK_C} °C`} keyAt={F.two}>
      <Thermometer />
    </Card>

    <Card from={F.sentence6 - 2} to={F.again - 2} tilt={-1.5} sheet={YELLOW} keyword="1992: FUNDING CUT" keyAt={F.nineteen}>
      <Cut pic="wornbit" x={540} y={600} w={900} tilt={2} />
    </Card>

    <Card from={F.again - 2} to={F.sentence7 - 2} tilt={1.5} sheet={NIGHT} keyword="12 KM DOWN"
      keyAt={F.again}
      note={{ text: "THE HOLE: TOO SMALL TO SEE HERE", at: F.again }}
    >
      <Cut {...OUTLINE.earth} x={EARTH.x} y={EARTH.y} w={700} edge={10} />
    </Card>

    <Card from={F.sentence7 - 2} to={F.end} tilt={-1.5} sheet={NIGHT} keyword={`${fmt(6000)}+ KM MORE`}
      keyAt={F.six}
      note={{ text: `THE HOLE: ${SHARE.toFixed(1)}% OF THE WAY`, at: F.more }}
    >
      <Centre />
    </Card>
  </Board>
);

// One quiet sound per card change, none on the beats inside a card.
const CHANGES = [F.was, F.sentence2, F.sentence3, F.sentence4, F.sentence5, F.sentence6, F.again, F.sentence7];

export const deepestHoleCalm: Short = {
  slug: "deepest-hole-calm",
  title: "The deepest hole ever dug (calm)",
  edit,
  looks: [{ id: "Calm", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "geology",
  sfx: CHANGES.map((at) => ({ at: at - 2, name: "flick", volume: 0.2 })),
};
