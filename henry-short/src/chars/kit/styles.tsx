import React from "react";
import type { Art } from "../../rig/types";
import type { Shape, Style } from "./types";

// How the shape vocabulary is drawn. A style never knows what it is drawing — it is handed paths
// and colours and decides how ink and fill behave — so every figure gains a new style for free.

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

// Outline weight at a part's own scale. 5 was a storybook line; this is an editorial one.
const WEIGHT = 3.4;

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

// One style ships. The split between shapes and renderers is still what makes that cheap to
// change: another look is one object in this file, and the whole cast gains it.
export const STYLES: Style[] = [soft];
export const styleById = (id: string): Style => STYLES.find((s) => s.id === id) ?? soft;
