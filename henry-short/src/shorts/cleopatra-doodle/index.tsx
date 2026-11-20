import React from "react";
import { useCurrentFrame } from "remotion";
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
  fmt,
  ramp,
  useBoil,
} from "../../deck/kit";
import { circle } from "../../deck/calm";
import { makeEdit } from "../../edit";
import alignment from "../../generated/cleopatra-timeline.alignment.json";
import { Year } from "../cleopatra-cutout";
import { YEAR } from "../cleopatra-timeline";
import type { Short } from "../types";

// The Cleopatra short as a doodle deck: eight cards, a new picture about every two and a half
// seconds, one marker keyword each. Where cleopatra-cutout pastes down photographs on torn coloured
// sheets, this one has no pictures at all: every card is an ink drawing made here in code, which
// draws itself line by line as the card lands, gets its colour a beat later and then boils while it
// holds. The timeline is one card that runs straight through instead of two with the launch
// between. Same voice-over, script and sourced numbers as cleopatra-timeline.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["closer"],
    ["twenty-six", "hundred", "BC."],
    ["sixty-nine", "BC."],
    ["only", "two", "thousand."],
    ["ancient", "history."],
  ],
  breakAfter: ["landing"],
});

const F = {
  moon: edit.at("moon"),
  landing: edit.at("landing"),
  building: edit.at("building"),
  great: edit.at("great"),
  sentence2: edit.at("the", 3),
  finished: edit.at("finished"),
  built: edit.at("twenty-six"),
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
const BACK = YEAR.cleopatra - YEAR.pyramid; // 2,531
const FORWARD = YEAR.apollo - YEAR.cleopatra; // 2,037
const SHARE = BACK / (YEAR.apollo - YEAR.pyramid);
// script/cleopatra-timeline.txt item 5: the 494-year gap inherits the pyramid's c., so it is shown
// rounded, as "about 500".
const CLOSER = Math.round((BACK - FORWARD) / 100) * 100;

const SAND = "#e8bd72";
const SHADE = "#b98143";
const SKIN = "#d9a066";
const HAIR = "#6b4226";
const GOLD = "#e8b33a";
const MOONDUST = "#d8d4c6";
const CREAM = "#fffdf6";

// A drawing in a 600×600 box: flat colour under ink lines, each line [path, colour, width].
type Art = {
  fills: readonly (readonly [d: string, colour: string])[];
  lines: readonly (readonly [d: string, colour?: string, width?: number])[];
  dashed?: readonly string[];
};
const join = (...arts: Art[]): Art => ({
  fills: arts.flatMap((a) => a.fills),
  lines: arts.flatMap((a) => a.lines),
  dashed: arts.flatMap((a) => a.dashed ?? []),
});
const oval = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A${rx} ${ry} 0 1 1 ${cx - rx} ${cy} Z`;
const spark = (x: number, y: number, r = 16) =>
  `M${x - r} ${y} L${x + r} ${y} M${x} ${y - r} L${x} ${y + r}`;

// The Great Pyramid: a lit face, a shaded face, three courses.
const PYRAMID: Art = {
  fills: [
    ["M300 110 L40 470 L360 470 Z", SAND],
    ["M300 110 L360 470 L560 470 Z", SHADE],
  ],
  lines: [
    ["M300 110 L40 470 L560 470 Z"],
    ["M300 110 L360 470", INK, 8],
    ["M235 200 L315 200 M170 290 L330 290 M105 380 L345 380", INK, 5],
    ["M315 200 L365 200 M330 290 L430 290 M345 380 L495 380", INK, 5],
  ],
};
const SUN: Art = {
  fills: [[circle(490, 120, 44), YELLOW]],
  lines: [
    [circle(490, 120, 44), INK, 8],
    [
      [0, 45, 90, 135, 180, 225, 270, 315]
        .map((deg) => {
          const a = (deg * Math.PI) / 180;
          const [c, s] = [Math.cos(a), Math.sin(a)];
          return `M${490 + c * 62} ${120 + s * 62} L${490 + c * 86} ${120 + s * 86}`;
        })
        .join(" "),
      INK,
      7,
    ],
  ],
};
const DUNES: Art = {
  fills: [],
  lines: [["M0 520 Q150 495 300 520 Q450 545 600 515", INK, 6]],
};

// Half built, the rest of it dashed in, and a block hauled on a sledge. Sledges are attested; how
// the blocks went up the sides is still argued about, so no ramp is drawn (A6).
const BUILDING: Art = {
  fills: [
    ["M170 290 L40 470 L360 470 L330 290 Z", SAND],
    ["M330 290 L360 470 L560 470 L430 290 Z", SHADE],
    ["M392 500 L478 500 L478 556 L392 556 Z", SAND],
  ],
  lines: [
    ["M170 290 L40 470 L560 470 L430 290 Z"],
    ["M330 290 L360 470", INK, 8],
    ["M105 380 L345 380 M345 380 L495 380", INK, 5],
    ["M392 500 L478 500 L478 556 L392 556 Z", INK, 8],
    ["M375 566 L500 566 Q518 566 522 550", INK, 9],
    ["M522 550 L566 510", SHADE, 6],
    [circle(582, 456, 14), INK, 7],
    ["M580 470 L572 512 M572 512 L560 548 M572 512 L590 546 M577 484 L564 510", INK, 7],
  ],
  dashed: ["M170 290 L300 110 L430 290 M300 110 L330 290"],
};

// Cleopatra in profile, hair drawn back into a bun under a royal diadem: a cartoon, not a likeness.
const QUEEN: Art = {
  fills: [
    ["M150 540 C160 460 220 430 262 430 L330 430 C390 432 440 470 452 540 Z", TEAL],
    [
      "M300 140 C345 145 368 180 368 215 L392 262 Q396 272 384 274 L366 276 Q372 288 366 294 Q360 298 366 304 Q370 314 360 320 Q362 340 344 350 Q325 360 305 356 L306 434 L226 434 Q238 380 236 330 C200 300 185 200 300 140 Z",
      SKIN,
    ],
    ["M305 142 C240 118 175 170 180 240 C183 290 205 320 240 332 C255 300 262 270 270 250 C285 215 300 185 305 142 Z", HAIR],
    [circle(184, 300, 42), HAIR],
  ],
  lines: [
    [
      "M300 140 C345 145 368 180 368 215 L392 262 Q396 272 384 274 L366 276 Q372 288 366 294 Q360 298 366 304 Q370 314 360 320 Q362 340 344 350 Q325 360 305 356 L306 434",
    ],
    ["M236 330 Q238 380 226 434", INK, 10],
    ["M305 142 C240 118 175 170 180 240 C183 290 205 320 240 332 C255 300 262 270 270 250 C285 215 300 185 305 142", INK, 9],
    [circle(184, 300, 42), INK, 9],
    ["M298 178 Q240 196 206 270 M288 208 Q244 228 222 296 M278 238 Q250 260 236 314", INK, 5],
    ["M306 158 C262 150 218 178 196 220", GOLD, 18],
    ["M322 214 Q335 205 348 213 Q336 221 322 214 Z M348 213 L364 205", INK, 6],
    ["M322 197 Q338 191 353 198", INK, 6],
    [oval(282, 286, 11, 16), INK, 6],
    [circle(280, 316, 9), GOLD, 8],
    ["M222 436 Q300 506 340 436", GOLD, 22],
    ["M150 540 C160 460 220 430 262 430 M330 430 C390 432 440 470 452 540", INK, 9],
  ],
};

// Apollo 11: the lander, the flag with its crossbar, footprints, the Earth in the sky.
const MOON: Art = {
  fills: [
    ["M0 420 Q300 360 600 420 L600 560 L0 560 Z", MOONDUST],
    [circle(480, 110, 50), TEAL],
    ["M330 162 L468 162 L468 250 L330 250 Z", CORAL],
    ["M330 162 L392 162 L392 210 L330 210 Z", "#2f5d9e"],
    ["M90 300 L220 300 L220 370 L90 370 Z", GOLD],
    ["M110 300 L120 240 L190 240 L205 300 Z", "#cfcfc4"],
  ],
  lines: [
    ["M0 420 Q300 360 600 420", INK, 10],
    [`${oval(130, 476, 50, 14)} ${oval(430, 500, 70, 18)} ${oval(300, 446, 30, 9)}`, INK, 6],
    [circle(480, 110, 50), INK, 8],
    ["M455 92 Q478 80 490 102 Q470 120 486 140", INK, 5],
    ["M330 400 L330 150", INK, 10],
    ["M330 162 L470 162", INK, 7],
    ["M392 184 L466 184 M392 206 L466 206 M332 228 L466 228", CREAM, 8],
    ["M330 162 L468 162 L468 250 L330 250", INK, 7],
    ["M90 300 L220 300 L220 370 L90 370 Z M110 300 L120 240 L190 240 L205 300", INK, 9],
    ["M140 256 L166 256 L166 276 L140 276 Z", INK, 6],
    ["M95 370 L55 440 M215 370 L255 440 M38 440 L72 440 M238 440 L272 440", INK, 8],
    [`${oval(378, 428, 9, 5)} ${oval(402, 442, 9, 5)} ${oval(428, 432, 9, 5)}`, INK, 5],
    [`${spark(60, 90)} ${spark(250, 70)} ${spark(370, 60, 12)} ${spark(570, 250, 12)}`, INK, 5],
  ],
};

// A baby in a basket, a royal band on her head: born a queen-to-be.
const BABY: Art = {
  fills: [
    ["M90 360 Q300 560 510 360 Z", "#c98d4b"],
    ["M150 362 C150 270 460 250 470 362 Z", CREAM],
    [circle(215, 300, 62), SKIN],
    [`${circle(193, 326, 11)} ${circle(246, 326, 11)}`, "#f4a99a"],
  ],
  lines: [
    ["M150 362 C150 270 460 250 470 362", INK, 9],
    ["M300 300 Q340 330 330 362", INK, 6],
    [circle(215, 300, 62), INK, 9],
    ["M158 278 Q215 244 272 278", GOLD, 14],
    ["M188 304 Q199 314 210 304 M226 304 Q237 314 248 304", INK, 6],
    ["M206 334 Q220 346 236 334", INK, 6],
    ["M90 360 Q300 560 510 360", INK, 10],
    ["M80 360 L520 360", INK, 12],
    ["M180 372 Q186 400 190 428 M246 372 Q252 410 255 450 M320 372 Q320 414 320 455 M392 372 Q390 406 385 440 M452 372 Q448 392 440 412", INK, 5],
    ["M140 400 Q300 462 466 396", INK, 5],
    [`${spark(480, 200, 18)} ${spark(110, 210, 14)} ${spark(410, 150, 12)}`, CORAL, 7],
  ],
};

// A museum piece: a glass dome on a plinth, for the pyramid to sit under.
const DOME: Art = {
  fills: [
    ["M150 450 L150 250 Q150 80 300 80 Q450 80 450 250 L450 450 Z", "rgba(23,163,152,0.10)"],
    ["M120 450 L480 450 L480 478 L120 478 Z", "#c9b79a"],
    ["M150 478 L450 478 L430 566 L170 566 Z", "#ddd0b6"],
    ["M246 500 L354 500 L354 540 L246 540 Z", CREAM],
  ],
  lines: [
    ["M120 450 L480 450 L480 478 L120 478 Z M150 478 L170 566 L430 566 L450 478", INK, 8],
    ["M246 500 L354 500 L354 540 L246 540 Z M262 520 L338 520", INK, 5],
    ["M150 450 L150 250 Q150 80 300 80 Q450 80 450 250 L450 450", INK, 8],
    ["M188 270 Q188 160 252 120", CREAM, 12],
    [circle(300, 64, 16), INK, 7],
  ],
};

// One drawing, centred at x,y and `size` px across. Its lines write themselves on from `at`, the
// colour floods in under them, and the whole drawing boils while the card holds. `punch` cuts in
// closer on a beat.
const Draw: React.FC<{
  art: Art;
  x: number;
  y: number;
  size: number;
  at: number;
  weight?: number;
  punch?: number;
  by?: number;
  tone?: string;
}> = ({ art, x, y, size, at, weight = 1, punch, by = 1.14, tone }) => {
  const f = useCurrentFrame();
  const boil = useBoil();
  if (f < at) return null;
  const p = punch === undefined ? 0 : ramp(f, punch, punch + 4);
  const k = (size / 600) * (1 + (by - 1) * p);
  const step = Math.min(1.5, 16 / art.lines.length);
  const flood = ramp(f, at + 8, at + 16);
  return (
    <svg
      width={BOARD.w}
      height={BOARD.h}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        filter: tone ? `${tone} ${boil}` : boil,
      }}
    >
      <g transform={`translate(${x} ${y}) scale(${k}) translate(-300 -300)`}>
        {art.fills.map(([d, colour]) => (
          <path key={d} d={d} fill={colour} opacity={flood} />
        ))}
        {(art.dashed ?? []).map((d) => (
          <path
            key={d}
            d={d}
            stroke={INK}
            strokeWidth={6 * weight}
            strokeDasharray="14 16"
            strokeLinecap="round"
            fill="none"
            opacity={flood}
          />
        ))}
        {art.lines.map(([d, colour = INK, w = 10], i) => (
          <Stroke
            key={d}
            d={d}
            from={at + i * step}
            to={at + i * step + 7}
            colour={colour}
            width={w * weight}
          />
        ))}
      </g>
    </svg>
  );
};

// The payoff, drawn to scale and on one card: the three drawings stand on one line at their years.
// The long span back is drawn first and counts up; the short span forward is drawn from "from" and
// lands as one number on "two thousand", which is then circled and the gap written under it.
const Timeline: React.FC = () => {
  const f = useCurrentFrame();
  const boil = useBoil();
  const [x0, x1] = [160, 890];
  const xc = x0 + (x1 - x0) * SHARE;
  const lineY = 800;
  const reveal = ramp(f, F.twoThousand, F.twoThousand + 6);
  const backDraw = ramp(f, F.back + 2, F.later);
  const mid = (xc + x1) / 2;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, translate: "0 215px" }}>
        <Draw art={PYRAMID} x={x0 + 10} y={680} size={330} at={F.back} weight={1.7} />
        <Draw art={QUEEN} x={xc + 10} y={650} size={340} at={F.back + 3} weight={1.7} />
        <Draw art={MOON} x={x1 - 10} y={650} size={330} at={F.from} weight={1.7} />
        <svg
          style={{ position: "absolute", inset: 0, overflow: "visible", filter: boil }}
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
          <Stroke
            d={`M${x0} 470 Q ${(x0 + xc) / 2} 330 ${xc - 18} 462`}
            from={F.back + 2}
            to={F.later}
            colour={CORAL}
          />
          <Stroke
            d={`M${xc + 18} 462 Q ${mid} 330 ${x1} 470`}
            from={F.from + 2}
            to={F.twoThousand}
            colour={TEAL}
          />
          <Stroke
            d={`M${mid - 190} 235 C ${mid - 170} 110, ${mid + 190} 100, ${mid + 195} 230 C ${mid + 200} 350, ${mid - 200} 370, ${mid - 186} 215`}
            from={F.twoThousand + 6}
            to={F.twoThousand + 16}
            colour={YELLOW}
            width={14}
          />
        </svg>
        <Count
          x={(x0 + xc) / 2 - 40}
          y={235}
          value={Math.round(BACK * backDraw)}
          unit="YEARS, ROUGHLY"
          at={F.back + 2}
          colour={CORAL}
          size={96}
          dim={1 - reveal * 0.45}
        />
        <Count x={mid} y={235} value={FORWARD} at={F.twoThousand} colour={TEAL} size={128} />
        <Year x={x0 + 10} y={lineY + 26} text="c. 2600 BC" at={F.back + 4} />
        <Year x={xc} y={lineY + 26} text="69 BC" at={F.back + 8} />
        <Year x={x1 - 20} y={lineY + 26} text="AD 1969" at={F.apollo} />
        <Burst at={F.twoThousand} x={mid} y={235} r={150} colour={YELLOW} n={12} />
      </div>
      <Word
        text={`ABOUT ${fmt(CLOSER)} YEARS CLOSER`}
        at={F.twoThousand + 12}
        y={1225}
        size={70}
      />
    </>
  );
};

// Eight cards in twenty-four seconds.
const Deck: React.FC = () => (
  <Board>
    <Shot from={0} to={F.moon - 2}>
      <Draw art={QUEEN} x={560} y={600} size={980} at={-12} />
      <Word text="CLEOPATRA" at={3} />
    </Shot>

    <Shot from={F.moon - 2} to={F.building - 2}>
      <Draw art={MOON} x={540} y={600} size={960} at={F.moon - 2} />
      <Word text="MOON LANDING" at={F.moon} size={112} swipe="#bfe9e4" tilt={3} />
    </Shot>

    <Shot from={F.building - 2} to={F.sentence2 - 2}>
      <Draw art={BUILDING} x={520} y={600} size={940} at={F.building - 2} />
      <Word text="GREAT PYRAMID" at={F.great} size={108} />
    </Shot>

    <Shot from={F.sentence2 - 2} to={F.sentence3 - 2}>
      <Draw
        art={join(PYRAMID, SUN, DUNES)}
        x={540}
        y={600}
        size={940}
        at={F.sentence2 - 2}
        punch={F.built - 1}
      />
      <Word text="FINISHED!" at={F.finished} until={F.built - 1} swipe="#bfe9e4" tilt={3} />
      <Burst at={F.built - 1} x={540} y={1190} r={170} colour={CORAL} n={12} />
      <Word text="c. 2600 BC" at={F.built - 1} size={136} />
    </Shot>

    <Shot from={F.sentence3 - 2} to={F.back - 2}>
      <Draw
        art={BABY}
        x={540}
        y={580}
        size={940}
        at={F.sentence3 - 2}
        punch={F.bornYear - 1}
      />
      <Word text="BORN" at={F.born} until={F.bornYear - 1} swipe="#ffc9c2" tilt={3} />
      <Burst at={F.bornYear - 1} x={540} y={1190} r={170} colour={TEAL} n={12} />
      <Word text="69 BC" at={F.bornYear - 1} size={150} />
    </Shot>

    <Shot from={F.back - 2} to={F.toHer - 2}>
      <Timeline />
    </Shot>

    <Shot from={F.toHer - 2} to={F.ancient - 2}>
      <Draw art={join(PYRAMID, DUNES)} x={800} y={720} size={420} at={F.toHer} weight={1.4} />
      <Draw art={QUEEN} x={330} y={600} size={720} at={F.toHer - 2} />
      <Word text="THE PYRAMIDS" at={F.pyramids} size={110} swipe="#bfe9e4" tilt={3} />
    </Shot>

    <Shot from={F.ancient - 2} to={F.end}>
      <Draw art={DOME} x={540} y={600} size={900} at={F.ancient - 2} />
      <Draw
        art={PYRAMID}
        x={540}
        y={650}
        size={420}
        at={F.ancient + 4}
        weight={1.3}
        tone="sepia(0.6)"
      />
      <Burst at={F.ancient} x={540} y={1190} r={190} colour={CORAL} n={12} />
      <Word text="ANCIENT HISTORY" at={F.ancient} size={92} />
    </Shot>
  </Board>
);

export const cleopatraDoodle: Short = {
  slug: "cleopatra-doodle",
  title: "Cleopatra and the Moon landing (doodle deck)",
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
    { at: F.from, name: "tap" },
    { at: F.twoThousand, name: "thud", volume: 0.6 },
    { at: F.toHer - 2, name: "pop" },
    { at: F.ancient - 2, name: "sparkle", volume: 0.4 },
  ],
};
