import React from "react";
import type { Art } from "../../rig/types";
import type { Shape, Style } from "./types";

// Three renderings of the same vocabulary. A style never knows what it is drawing — it is handed
// paths and colours and decides how ink and fill behave — so every figure gains a new style free.

const hex = (c: string): [number, number, number] => {
  const v = c.replace("#", "");
  const n = v.length === 3 ? v.split("").map((d) => d + d).join("") : v;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number];
};

const rgb = ([r, g, b]: [number, number, number]) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;

const shift = (c: string, k: number) => {
  const [r, g, b] = hex(c);
  return k >= 0 ? rgb([r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k]) : rgb([r * (1 + k), g * (1 + k), b * (1 + k)]);
};

/** 0 = black, 1 = white. Drives how hard the woodcut hatches a colour. */
const luma = (c: string) => {
  const [r, g, b] = hex(c);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

const wrap = (w: number, h: number, defs: React.ReactNode, body: React.ReactNode, base: Record<string, string | number>): Art => ({
  node: (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      {defs ? <defs>{defs}</defs> : null}
      <g strokeLinejoin="round" strokeLinecap="round" fill="none" {...base}>
        {body}
      </g>
    </svg>
  ),
});

const draw = (s: Shape, i: number, extra: Record<string, string | number | undefined> = {}) => (
  <path key={i} d={s.d} {...extra} />
);

// ---------------------------------------------------------------- flat

const WEIGHT = 3.4;

const flat: Style = {
  id: "flat",
  label: "Flat cut-paper",
  ink: "#2a1a12",
  paper: "#efe3cf",
  render: (drawing, w, h) =>
    wrap(w, h, null, drawing.map((s, i) =>
      draw(s, i, {
        fill: s.fill ?? "none",
        stroke: s.width === 0 ? undefined : (s.stroke ?? "#2a1a12"),
        strokeWidth: s.width === 0 ? undefined : WEIGHT * (s.width ?? 1),
      }),
    ), { }),
};

// ---------------------------------------------------------------- soft

// Shading comes from the fill itself — a vertical gradient plus an outline a few shades darker
// than what it encloses — so nothing needs a second colour choice per figure.
const soft: Style = {
  id: "soft",
  label: "Soft illustrated",
  ink: "#3b2a20",
  paper: "#f4ece0",
  render: (drawing, w, h, key) => {
    const fills = [...new Set(drawing.filter((s) => s.fill && !s.flat).map((s) => s.fill as string))];
    const defs = fills.map((c) => (
      <linearGradient key={c} id={`g-${key}-${c.slice(1)}`} x1="0" y1="0" x2="0.25" y2="1">
        <stop offset="0%" stopColor={shift(c, 0.1)} />
        <stop offset="60%" stopColor={c} />
        <stop offset="100%" stopColor={shift(c, -0.16)} />
      </linearGradient>
    ));
    return wrap(w, h, defs, drawing.map((s, i) =>
      draw(s, i, {
        fill: s.fill ? (s.flat ? s.fill : `url(#g-${key}-${s.fill.slice(1)})`) : "none",
        stroke: s.width === 0 ? undefined : (s.stroke ?? "#3b2a20"),
        strokeWidth: s.width === 0 ? undefined : WEIGHT * 0.72 * (s.width ?? 1),
      }),
    ), {});
  },
};

// ---------------------------------------------------------------- woodcut

// Tone is carried by hatch density rather than colour, the way a period block print carries it:
// a dark cloth gets tight heavy lines, a pale one almost none. Colour survives only as a tint, so
// this look trades the palette — which is how figures are told apart — for period texture.
const PAPER = "#efe4cc";

const woodcut: Style = {
  id: "woodcut",
  label: "Woodcut",
  ink: "#1d1711",
  paper: "#e4d7bb",
  render: (drawing, w, h, key) => {
    const fills = [...new Set(drawing.filter((s) => s.fill).map((s) => s.fill as string))];
    const defs = fills.map((c) => {
      const t = 1 - luma(c); // 0 pale, 1 dark
      const step = 14 - 9 * t;
      const weight = 0.8 + 3.4 * t;
      return (
        <pattern key={c} id={`h-${key}-${c.slice(1)}`} width={step} height={step} patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
          <rect width={step} height={step} fill={shift(c, 0.62)} />
          <line x1={0} y1={0} x2={0} y2={step} stroke={shift(c, -0.45)} strokeWidth={weight} />
        </pattern>
      );
    });
    return wrap(w, h, defs, drawing.map((s, i) =>
      draw(s, i, {
        fill: s.fill ? (s.flat ? shift(s.fill, 0.3) : `url(#h-${key}-${s.fill.slice(1)})`) : "none",
        stroke: s.width === 0 ? undefined : (s.stroke ?? "#1d1711"),
        strokeWidth: s.width === 0 ? undefined : WEIGHT * 1.35 * (s.width ?? 1),
      }),
    ), {});
  },
};

export const STYLES: Style[] = [flat, soft, woodcut];
export const styleById = (id: string): Style => STYLES.find((s) => s.id === id) ?? flat;
export { PAPER };
