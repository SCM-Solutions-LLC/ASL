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
  makeCut,
  pop,
  ramp,
  useBoil,
} from "../../deck/kit";
import { makeEdit } from "../../edit";
import { MARKER } from "../../fonts";
import alignment from "../../generated/cleopatra-timeline.alignment.json";
import { YEAR } from "../cleopatra-timeline";
import type { Short } from "../types";

// PILOT of the cutout look: the Cleopatra short as a deck of collage cards.
//
// The earlier cut holds one staged scene for the whole read. This one changes the picture about
// every two and a half seconds and writes one keyword per card. Same voice-over, same script, same
// sourced numbers — only the picture track is new, so the two can be watched side by side.
//
// Every picture is a real public-domain one — nineteenth-century paintings, lithographs and a
// photograph of Egypt, and NASA's own frames from Apollo 11 — cut out like paper and pasted down.
// Nothing is generated, so nothing is invented: the astronaut is Aldrin, not a guess at one.
// public/SOURCES.json carries where each came from.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["closer"],
    ["twenty-five", "sixty", "BC."],
    ["sixty-nine", "BC."],
    ["only", "two", "thousand."],
    ["ancient", "history."],
  ],
  breakAfter: ["landing"],
});

// Every card and every beat inside a card hangs off a spoken word.
const F = {
  moon: edit.at("moon"),
  landing: edit.at("landing"),
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
  eleven: edit.at("eleven"),
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

// The pictures, with their pixel size so a crop or an outline can be given in the picture's own
// pixels — read straight off the file in any viewer.
const PICS = {
  cleopatra: [773, 900],
  second: [1920, 1362],
  aldrin: [1280, 1280],
  bootprint: [1280, 1291],
  flag: [1280, 1292],
  launch: [1280, 1600],
  frith: [1920, 1511],
  geezeh: [960, 675],
  sphinx: [1280, 828],
} as const;

// Outlines cut around a subject, in the picture's pixels.
const OUTLINE = {
  pyramid: {
    pic: "frith",
    box: [60, 100, 1400, 740],
    pts: [
      [880, 128],
      [1425, 640],
      [1345, 805],
      [80, 812],
    ],
  },
  queen: {
    pic: "cleopatra",
    box: [150, 60, 520, 420],
    pts: [
      [236, 170],
      [262, 100],
      [330, 78],
      [420, 92],
      [472, 160],
      [452, 262],
      [545, 345],
      [570, 470],
      [165, 470],
      [200, 380],
      [268, 318],
      [246, 240],
    ],
  },
  astronaut: {
    pic: "aldrin",
    box: [440, 20, 480, 820],
    pts: [
      [520, 110],
      [570, 40],
      [720, 36],
      [775, 120],
      [770, 230],
      [880, 330],
      [850, 460],
      [800, 560],
      [840, 700],
      [890, 790],
      [760, 820],
      [560, 815],
      [540, 700],
      [560, 590],
      [470, 580],
      [455, 480],
      [500, 320],
      [525, 230],
    ],
  },
} as const;

const Cut = makeCut("cleopatra", PICS);

const Year: React.FC<{ x: number; y: number; text: string; at: number }> = ({
  x,
  y,
  text,
  at,
}) => {
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

// The payoff, drawn to scale: three cutouts on one line, placed in proportion to the years, and
// the two spans measured one after the other. It is shown twice, with the launch between: first
// the long span back to the pyramid, counting up as it is drawn; then the short one forward, which
// lands as a single number because "only two thousand" is the punchline.
const Timeline: React.FC<{ second?: boolean }> = ({ second }) => {
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
          <Stroke
            d={`M${x0} 470 Q ${(x0 + xc) / 2} 330 ${xc - 18} 462`}
            from={F.back + 2}
            to={F.later}
            colour={CORAL}
          />
          {second && (
            <Stroke
              d={`M${xc + 18} 462 Q ${mid} 330 ${x1} 470`}
              from={F.only - 1}
              to={F.twoThousand}
              colour={TEAL}
            />
          )}
          {/* The punchline gets circled. */}
          <Stroke
            d={`M${mid - 190} 235 C ${mid - 170} 110, ${mid + 190} 100, ${mid + 195} 230 C ${mid + 200} 350, ${mid - 200} 370, ${mid - 186} 215`}
            from={F.twoThousand + 6}
            to={F.twoThousand + 16}
            colour={YELLOW}
            width={14}
          />
        </svg>
        <Cut
          {...OUTLINE.pyramid}
          x={x0 + 45}
          y={655}
          w={300}
          tilt={-3}
          edge={9}
        />
        <Cut
          {...OUTLINE.queen}
          x={xc}
          y={650}
          w={290}
          tilt={3}
          edge={9}
          at={second ? undefined : F.back + 3}
        />
        {second && (
          <Cut
            {...OUTLINE.astronaut}
            x={x1 - 20}
            y={610}
            w={210}
            tilt={4}
            edge={9}
            at={F.only - 1}
          />
        )}
        <Count
          x={(x0 + xc) / 2}
          y={235}
          value={Math.round(BACK * backDraw)}
          at={F.back + 2}
          colour={CORAL}
          size={112}
          dim={1 - reveal * 0.45}
        />
        <Count
          x={mid}
          y={235}
          value={FORWARD}
          at={F.twoThousand}
          colour={TEAL}
          size={128}
        />
        <Year x={x0 + 10} y={lineY + 26} text="2560 BC" at={F.back + 4} />
        <Year x={xc} y={lineY + 26} text="69 BC" at={F.back + 8} />
        {second && (
          <Year x={x1 - 20} y={lineY + 26} text="AD 1969" at={F.only} />
        )}
        <Burst
          at={F.twoThousand}
          x={mid}
          y={235}
          r={150}
          colour={YELLOW}
          n={12}
        />
      </div>
      <Word
        text={`${fmt(BACK - FORWARD)} YEARS CLOSER`}
        at={F.twoThousand + 12}
        y={1225}
        size={92}
        swipe={YELLOW}
      />
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

// Ten cards in twenty-four seconds. No picture is the main picture of two cards.
const Deck: React.FC = () => (
  <Board>
    <Shot from={0} to={F.moon - 2} tilt={-1.5} sheet={CORAL}>
      <Cut pic="cleopatra" x={540} y={585} w={820} tilt={-2} />
      <Burst at={2} x={540} y={1190} r={190} colour={YELLOW} n={14} />
      <Word text="CLEOPATRA" at={3} />
    </Shot>

    <Shot from={F.moon - 2} to={F.building - 2} tilt={1.5} sheet={TEAL}>
      <Cut pic="aldrin" x={500} y={560} w={860} tilt={2} />
      <Cut
        pic="bootprint"
        x={850}
        y={900}
        w={330}
        box={[560, 480, 700, 700]}
        tilt={-7}
        at={F.landing}
        edge={10}
      />
      <Word
        text="MOON LANDING"
        at={F.moon}
        size={112}
        swipe="#bfe9e4"
        tilt={3}
      />
    </Shot>

    <Shot from={F.building - 2} to={F.sentence2 - 2} tilt={-1.5} sheet={YELLOW}>
      <Cut
        pic="geezeh"
        x={540}
        y={600}
        w={940}
        box={[25, 30, 910, 560]}
        tilt={-1.5}
      />
      <Word text="GREAT PYRAMID" at={F.building + 6} size={108} />
    </Shot>

    <Shot
      from={F.sentence2 - 2}
      to={F.sentence3 - 2}
      tilt={1.5}
      sheet="#bfe9e4"
    >
      <Cut
        {...OUTLINE.pyramid}
        x={540}
        y={600}
        w={900}
        tilt={1}
        punch={F.built - 1}
        by={1.1}
      />
      <Word
        text="FINISHED!"
        at={F.finished}
        until={F.built - 1}
        swipe="#bfe9e4"
        tilt={3}
      />
      <Burst at={F.built - 1} x={540} y={1190} r={170} colour={CORAL} n={12} />
      <Word text="c. 2560 BC" at={F.built - 1} size={136} />
    </Shot>

    <Shot from={F.sentence3 - 2} to={F.back - 2} tilt={-1.5} sheet={CORAL}>
      <Cut
        pic="second"
        x={540}
        y={590}
        w={860}
        box={[900, 300, 820, 900]}
        tilt={-2}
        punch={F.bornYear - 1}
        by={1.12}
      />
      <Word
        text="BORN"
        at={F.born}
        until={F.bornYear - 1}
        swipe="#ffc9c2"
        tilt={3}
      />
      <Burst
        at={F.bornYear - 1}
        x={540}
        y={1190}
        r={170}
        colour={TEAL}
        n={12}
      />
      <Word text="69 BC" at={F.bornYear - 1} size={150} />
    </Shot>

    <Shot from={F.back - 2} to={F.from - 2}>
      <Timeline />
    </Shot>

    <Shot from={F.from - 2} to={F.only - 2} tilt={1.5} sheet={TEAL}>
      <Cut
        pic="launch"
        x={430}
        y={600}
        w={700}
        box={[0, 60, 1280, 1500]}
        tilt={-3}
      />
      <Cut
        pic="flag"
        x={790}
        y={840}
        w={430}
        box={[330, 200, 950, 950]}
        tilt={6}
        at={F.eleven}
        edge={10}
      />
      <Word text="APOLLO 11" at={F.apollo} swipe="#bfe9e4" tilt={3} />
    </Shot>

    <Shot from={F.only - 2} to={F.toHer - 2}>
      <Timeline second />
    </Shot>

    <Shot from={F.toHer - 2} to={F.ancient - 2} tilt={1.5} sheet={YELLOW}>
      <Cut
        pic="sphinx"
        x={545}
        y={540}
        w={890}
        box={[30, 30, 1220, 760]}
        tilt={2}
      />
      <Cut
        {...OUTLINE.queen}
        x={270}
        y={900}
        w={470}
        tilt={-5}
        at={F.toHer + 4}
      />
      <Word
        text="THE PYRAMIDS?"
        at={F.pyramids}
        size={110}
        swipe="#bfe9e4"
        tilt={3}
      />
    </Shot>

    <Shot from={F.ancient - 2} to={F.end} tilt={-1.5} sheet="#d8c9a8">
      <Cut
        pic="frith"
        x={540}
        y={600}
        w={960}
        box={[250, 60, 1620, 1400]}
        tilt={-1.5}
        tone="sepia(0.7) contrast(1.05)"
      />
      <Cobweb at={F.ancient + 2} />
      <Burst at={F.ancient} x={540} y={1190} r={190} colour={CORAL} n={12} />
      <Word text="ANCIENT HISTORY" at={F.ancient} size={92} />
    </Shot>
  </Board>
);

export const cleopatraCutout: Short = {
  slug: "cleopatra-cutout",
  title: "Cleopatra and the Moon landing (cutout pilot)",
  edit,
  looks: [{ id: "Cutout", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "egypt",
  sfx: [
    { at: 0, name: "pop" },
    { at: F.moon - 2, name: "pop" },
    { at: F.building - 2, name: "pop" },
    { at: F.sentence2 - 2, name: "pop" },
    { at: F.built - 1, name: "thud", volume: 0.4 },
    { at: F.sentence3 - 2, name: "pop" },
    { at: F.bornYear - 1, name: "thud", volume: 0.4 },
    { at: F.back - 2, name: "whoosh", volume: 0.35 },
    { at: F.from - 2, name: "pop" },
    { at: F.only - 2, name: "whoosh", volume: 0.35 },
    { at: F.twoThousand, name: "thud", volume: 0.6 },
    { at: F.toHer - 2, name: "pop" },
    { at: F.ancient - 2, name: "sparkle", volume: 0.4 },
  ],
};
