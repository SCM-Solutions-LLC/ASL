import React from "react";
import { useCurrentFrame } from "remotion";
import { Card, Marks } from "../../deck/calm";
import { Board, CORAL, INK, Paper, TEAL, YELLOW, ramp } from "../../deck/kit";
import { clean, makeEdit } from "../../edit";
import { MARKER } from "../../fonts";
import alignment from "../../generated/cell-count-long.alignment.json";
import type { Short } from "../types";

// The long cell-count short in the calm look: script/cell-count-long.txt, one card per sentence.
// Its own picture is one log-scale ruler of cell mass that every card builds on: the size classes,
// a falling staircase of counts, then level bars of weight with the dip between fat and muscle.
// The bars are a schematic of the trend, and say so; only the axis marks are the paper's values.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["roughly", "the", "same."],
    ["million", "times", "heavier."],
    ["half", "as", "many"],
    ["cancel", "out."],
    ["one", "in", "fifty", "thousand"],
    ["about", "half"],
    ["forty-five", "kilograms."],
    ["not", "cells", "at", "all."],
    ["nobody", "knows", "why."],
  ],
  breakAfter: [
    "size,",
    "body,",
    "type,",
    "class,",
    "doubles,",
    "numbers,",
    "size,",
    "exception:",
    "smaller,",
    "fibres",
    "together",
    "seventy",
    "water,",
    "size,",
    "cells,",
  ],
});

const S = edit.words
  .filter((w, i) => i === 0 || /\.$/.test(edit.words[i - 1].text))
  .map((w) => w.start);
if (S.length !== 20) throw new Error(`expected 20 sentences, found ${S.length}`);
const at = (s: number, word: string) => {
  const hit = edit.words.find((w) => w.start >= S[s] && clean(w.text) === clean(word));
  if (!hit) throw new Error(`"${word}" is not spoken in or after sentence ${s}`);
  return hit.start;
};
const cut = (s: number) => (s >= S.length ? edit.duration : S[s] - 2);
const end = (s: number) => (s + 1 >= S.length ? edit.duration : S[s + 1]);

// Values from script/cell-count-long.txt (Hatton et al., PNAS 2023), in grams.
const RBC = 4e-11; // the lower bound of red blood cells, where the binned distribution starts
const FAT = 1e-6; // adipocyte biomass peak
const MUSCLE = 1e-4; // myocyte biomass peak
const BINS = 23; // octaves from 4e-11 g: 4e-11 * 2^23 = 3.4e-4 g, the largest muscle fibres

const CREAM = "#fffdf6";
const MINT = "#bfe9e4";
const PINK = "#ffc9c2";
const SEA = "#cfe3f5";

// The ruler, in board pixels: 10^-11 g at the left, 10^-3 g at the right.
const LO = -11;
const HI = -3;
const X0 = 120;
const X1 = 990;
const AXIS = 880;
const xOf = (g: number) => X0 + ((Math.log10(g) - LO) / (HI - LO)) * (X1 - X0);
const edge = (k: number) => xOf(RBC * 2 ** k);
const mid = (k: number) => RBC * 2 ** (k + 0.5);
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const pow = (e: number) => `10⁻${String(-e).split("").map((d) => SUP[+d]).join("")}`;

const T: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  op?: number;
}> = ({ x, y, text, size = 32, anchor = "middle", fill = INK, op = 1 }) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    dominantBaseline="middle"
    opacity={op}
    style={{ font: `400 ${size}px ${MARKER}`, fill }}
  >
    {text}
  </text>
);

// Deterministic wobble, so the schematic bars are the same on every render.
const wob = (k: number) => Math.sin(k * 12.9898) * 0.5 + Math.sin(k * 4.1414) * 0.5;

type Span = readonly [number, number];
const grow = (f: number, s: Span | "full" | undefined, k: number) =>
  s === "full" ? 1 : s ? ramp(f, s[0] + k * 1.2, s[0] + k * 1.2 + 10) : 0;

// The one picture of this short. Each prop switches on a layer; a Span draws it over those frames.
const Ruler: React.FC<{
  axis?: Span | "full";
  bins?: Span | "full";
  counts?: Span | "full";
  weights?: Span | "full";
  /** How deep the dip between fat and muscle is: 1 for the reference man, less for woman and child. */
  dip?: number;
  marks?: ("rbc" | "fat" | "muscle")[];
  dimCounts?: boolean;
  title?: string;
  /** The ocean card relabels the same picture. */
  ocean?: boolean;
}> = ({ axis = "full", bins, counts, weights, dip = 1, marks = [], dimCounts, title, ocean }) => {
  const f = useCurrentFrame();
  const a = axis === "full" ? 1 : ramp(f, axis[0], axis[1]);
  const top = 300;
  const level = 520;
  return (
    <Marks>
      <line x1={X0} y1={AXIS} x2={X0 + (X1 - X0) * a} y2={AXIS} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      {!ocean &&
        Array.from({ length: HI - LO + 1 }, (_, i) => LO + i).map((e) => (
          <g key={e} opacity={a}>
            <line x1={xOf(10 ** e)} y1={AXIS} x2={xOf(10 ** e)} y2={AXIS + 18} stroke={INK} strokeWidth={5} />
            {(e - LO) % 2 === 0 && <T x={xOf(10 ** e)} y={AXIS + 48} text={pow(e)} size={30} />}
          </g>
        ))}
      <T
        x={540}
        y={AXIS + 100}
        text={ocean ? "SIZE OF SEA LIFE, BACTERIA TO WHALES · LOG SCALE" : "CELL MASS IN GRAMS · LOG SCALE"}
        size={30}
        op={a}
      />
      {title && <T x={540} y={235} text={title} size={34} />}
      {bins &&
        Array.from({ length: BINS + 1 }, (_, k) => (
          <line
            key={k}
            x1={edge(k)}
            y1={AXIS - 14}
            x2={edge(k)}
            y2={AXIS + 14}
            stroke={TEAL}
            strokeWidth={4}
            opacity={grow(f, bins, k)}
          />
        ))}
      {counts &&
        Array.from({ length: BINS }, (_, k) => {
          // Log count falls in a straight line as log size rises: a slope of about -1.
          const h = (AXIS - top) * (1 - (0.92 * k) / BINS);
          const g = grow(f, counts, k);
          return (
            <rect
              key={k}
              x={edge(k) + 3}
              y={AXIS - h * g}
              width={edge(k + 1) - edge(k) - 6}
              height={h * g}
              fill={TEAL}
              opacity={dimCounts ? 0.25 : 0.85}
            />
          );
        })}
      {weights &&
        Array.from({ length: BINS }, (_, k) => {
          const m = mid(k);
          const inDip = m > FAT * 1.5 && m < MUSCLE / 1.5;
          let h = AXIS - level + wob(k) * 40 - (inDip ? 190 * dip : 0);
          if (ocean) h = AXIS - level + wob(k) * 25 + (k < 2 ? 120 : 0) - (k > BINS - 3 ? 150 : 0);
          const g = grow(f, weights, k);
          return (
            <rect
              key={k}
              x={edge(k) + 3}
              y={AXIS - h * g}
              width={edge(k + 1) - edge(k) - 6}
              height={h * g}
              fill={ocean ? TEAL : CORAL}
            />
          );
        })}
      {(counts || weights) && (
        <T
          x={X0}
          y={275}
          anchor="start"
          size={28}
          text={
            weights
              ? "WEIGHT IN EACH CLASS · LOG SCALE · SCHEMATIC"
              : "NUMBER OF CELLS · LOG SCALE · SCHEMATIC"
          }
          op={title ? 0 : 1}
        />
      )}
      {marks.map((m) => {
        const g = m === "rbc" ? RBC : m === "fat" ? FAT : MUSCLE;
        const label =
          m === "rbc" ? "RED BLOOD CELLS" : m === "fat" ? "FAT CELLS" : "MUSCLE FIBRES";
        const sub = m === "rbc" ? `FROM 4 × ${pow(-11)} g` : m === "fat" ? `~${pow(-6)} g` : `~${pow(-4)} g`;
        const x = xOf(g);
        const anchor = m === "rbc" ? "start" : m === "muscle" ? "end" : "middle";
        const lx = m === "rbc" ? x - 10 : m === "muscle" ? x + 40 : x;
        return (
          <g key={m}>
            <line x1={x} y1={AXIS - 330} x2={x} y2={AXIS} stroke={INK} strokeWidth={5} strokeDasharray="14 12" />
            <T x={lx} y={AXIS - 390} text={label} size={36} anchor={anchor} />
            <T x={lx} y={AXIS - 350} text={sub} size={28} anchor={anchor} />
          </g>
        );
      })}
    </Marks>
  );
};

// Three rulers stacked: the dip in the man, the woman and the ten-year-old.
const Three: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const rows = [
    ["MAN", 1],
    ["WOMAN", 0.55],
    ["CHILD, 10", 0.25],
  ] as const;
  return (
    <Marks>
      <T x={540} y={235} text="WEIGHT IN EACH CLASS · SCHEMATIC" size={30} />
      {rows.map(([name, dip], r) => {
        const base = 470 + r * 230;
        const o = ramp(f, from + r * 10, from + r * 10 + 8);
        return (
          <g key={name} opacity={o}>
            <T x={X0} y={base - 150} text={name} size={34} anchor="start" />
            <line x1={X0} y1={base} x2={X1} y2={base} stroke={INK} strokeWidth={6} />
            {Array.from({ length: BINS }, (_, k) => {
              const m = mid(k);
              const inDip = m > FAT * 1.5 && m < MUSCLE / 1.5;
              const h = 110 + wob(k) * 14 - (inDip ? 80 * dip : 0);
              return (
                <rect
                  key={k}
                  x={edge(k) + 3}
                  y={base - h}
                  width={edge(k + 1) - edge(k) - 6}
                  height={h}
                  fill={CORAL}
                />
              );
            })}
          </g>
        );
      })}
    </Marks>
  );
};

// 50,000 dots, 250 by 200, one of them a muscle fibre.
const Crowd: React.FC<{ ring: number }> = ({ ring }) => {
  const f = useCurrentFrame();
  const step = 3.6;
  const w = 250 * step;
  const h = 200 * step;
  const x = 540 - w / 2;
  const y = 230;
  const r = ramp(f, ring, ring + 10);
  const cx = x + 187 * step + step / 2;
  const cy = y + 61 * step + step / 2;
  return (
    <Marks>
      <defs>
        <pattern id="crowd" width={step} height={step} patternUnits="userSpaceOnUse" x={x} y={y}>
          <circle cx={step / 2} cy={step / 2} r={1.1} fill={INK} opacity={0.55} />
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill="url(#crowd)" />
      <circle cx={cx} cy={cy} r={4} fill={CORAL} />
      <circle cx={cx} cy={cy} r={20 + 50 * (1 - r)} stroke={CORAL} strokeWidth={6} fill="none" opacity={r} />
      <T x={540} y={y + h + 50} text="50,000 CELLS WITH A NUCLEUS · 1 MUSCLE FIBRE" size={30} />
    </Marks>
  );
};

// A 70 kg man as one bar: his cells (muscle fibres about half of them) and what lies between them.
const Body: React.FC<{ from: number; show: "muscle" | "cells" | "all" }> = ({ from, show }) => {
  const f = useCurrentFrame();
  const x = 120;
  const w = 840;
  const y = 420;
  const h = 200;
  const kg = w / 70;
  const g = ramp(f, from, from + 14);
  return (
    <Marks>
      <rect x={x} y={y} width={45 * kg} height={h} fill={CREAM} stroke={INK} strokeWidth={6} />
      {show !== "cells" && (
        <rect x={x} y={y} width={22.5 * kg * (show === "muscle" ? g : 1)} height={h} fill={CORAL} />
      )}
      {show === "muscle" && <T x={x + 11 * kg} y={y + h + 50} text="MUSCLE FIBRES ≈ HALF" size={32} op={g} />}
      <T x={x + 22.5 * kg} y={y - 50} text="ALL HIS CELLS · 45 KG" size={34} />
      {show === "all" && (
        <g opacity={g}>
          <rect x={x + 45 * kg} y={y} width={25 * kg} height={h} fill={MINT} stroke={INK} strokeWidth={6} />
          <T x={x + 57.5 * kg} y={y - 50} text="NOT CELLS · 25 KG" size={34} />
          <T x={540} y={y + h + 60} text="70 KG MAN" size={36} />
        </g>
      )}
    </Marks>
  );
};

const Deck: React.FC = () => (
  <Board>
    <Card from={0} to={cut(1)} word="ROUGHLY THE SAME" at={at(0, "roughly")} sheet={CREAM}>
      <Ruler weights={[S[0] + 6, end(0)]} />
    </Card>
    <Card from={cut(1)} to={cut(2)} word="2023 CELL COUNT" at={at(1, "twenty")} sheet={MINT}>
      <Ruler axis={[S[1] + 4, at(1, "sorted")]} />
    </Card>
    <Card from={cut(2)} to={cut(3)} word="RED BLOOD CELLS" at={at(2, "red")} sheet={PINK}>
      <Ruler marks={["rbc"]} />
    </Card>
    <Card from={cut(3)} to={cut(4)} word="1,000,000× HEAVIER" at={at(3, "million")} sheet={PINK}>
      <Ruler marks={["rbc", "muscle"]} />
    </Card>
    <Card from={cut(4)} to={cut(5)} word="×2 EACH CLASS" at={at(4, "twice")} sheet={CREAM}>
      <Ruler bins={[S[4] + 4, end(4)]} />
    </Card>
    <Card from={cut(5)} to={cut(6)} word="HALF AS MANY" at={at(5, "half")} sheet={MINT}>
      <Ruler bins="full" counts={[S[5] + 4, end(5)]} />
    </Card>
    <Card from={cut(6)} to={cut(7)} word="THEY CANCEL OUT" at={at(6, "cancel")} sheet={MINT}>
      <Ruler bins="full" counts="full" dimCounts weights={[at(6, "cancel"), end(6)]} />
    </Card>
    <Card from={cut(7)} to={cut(8)} word="SAME WEIGHT, EACH CLASS" at={at(7, "same")} sheet={CREAM}>
      <Ruler bins="full" weights="full" />
    </Card>
    <Card from={cut(8)} to={cut(9)} word="ONE DIP" at={at(8, "dip,")} sheet={PINK}>
      <Ruler weights="full" marks={["fat", "muscle"]} />
    </Card>
    <Card from={cut(9)} to={cut(10)} word="SMALLER IN WOMEN" at={at(9, "smaller,")} sheet={PINK}>
      <Three from={S[9]} />
    </Card>
    <Card from={cut(10)} to={cut(11)} word="A TYPICAL MAN" sub="70 KG (154 LB)" at={at(10, "typical")} sheet={CREAM}>
      <Body from={S[10]} show="cells" />
    </Card>
    <Card from={cut(11)} to={cut(12)} word="1 IN 50,000" at={at(11, "fifty")} sheet={CREAM}>
      <Crowd ring={at(11, "one")} />
    </Card>
    <Card from={cut(12)} to={cut(13)} word="ABOUT HALF THE WEIGHT" at={at(12, "half")} sheet={PINK}>
      <Body from={at(12, "half")} show="muscle" />
    </Card>
    <Card from={cut(13)} to={cut(14)} word="45 KG" sub="99 LB" at={at(13, "forty-five")} sheet={CREAM}>
      <Body from={S[13]} show="cells" />
    </Card>
    <Card from={cut(14)} to={cut(15)} word="NOT CELLS" sub="25 KG (55 LB)" at={at(14, "not")} sheet={MINT}>
      <Body from={at(14, "twenty-five")} show="all" />
    </Card>
    <Card from={cut(15)} to={cut(16)} word="BETWEEN THE CELLS" at={at(15, "between")} sheet={MINT}>
      <Body from={0} show="all" />
      <Marks>
        <T x={540} y={830} text="WATER · PROTEIN · MINERALS" size={40} />
      </Marks>
    </Card>
    <Card from={cut(16)} to={cut(17)} word="THE OCEAN TOO" at={at(16, "ocean")} sheet={SEA}>
      <Ruler ocean weights={[at(16, "ocean"), end(16)]} title="MOST SIZE CLASSES · SCHEMATIC" />
    </Card>
    <Card from={cut(17)} to={cut(18)} word="NOBODY KNOWS WHY" at={at(17, "nobody")} sheet={YELLOW} tilt={1.5}>
      <Ruler weights="full" />
    </Card>
    <Card from={cut(18)} to={cut(19)} word="NO KNOWN PROCESS" at={at(18, "process")} sheet={CREAM}>
      <Ruler weights="full" />
    </Card>
    <Card from={cut(19)} to={edit.duration} word="ROUGHLY THE SAME" at={at(19, "roughly")} sheet={YELLOW} tilt={-1}>
      <Ruler bins="full" counts="full" dimCounts weights="full" marks={["rbc", "fat", "muscle"]} />
    </Card>
  </Board>
);

export const cellCountLong: Short = {
  slug: "cell-count-long",
  title: "Every size weighs the same (long)",
  edit,
  looks: [{ id: "Calm", Set: Paper, cast: () => [] }],
  ui: () => <Deck />,
  scrim: false,
  music: "cells",
};
