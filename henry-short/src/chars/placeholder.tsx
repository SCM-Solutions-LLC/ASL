import React from "react";
import type { Art } from "../rig/types";

// Stand-in art so the rig and timing can be judged before the real kit exists.
export const INK = "#2a1a12";
export const SKIN = "#f0c9a0";

export const svg = (w: number, h: number, children: React.ReactNode): Art => ({
  node: (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <g stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
        {children}
      </g>
    </svg>
  ),
});

// Shared face pieces, drawn into a w×h box centred on the part's pivot.
export const eyes = (w: number, h: number, gap: number) => {
  const cy = h / 2;
  const l = w / 2 - gap / 2;
  const r = w / 2 + gap / 2;
  const open = (dx: number, size = 1) =>
    svg(w, h, [l, r].map((cx) => (
      <g key={cx}>
        <ellipse cx={cx} cy={cy} rx={11 * size} ry={13 * size} fill="#fff" />
        <circle cx={cx + dx} cy={cy + 1} r={5.5 * size} fill={INK} stroke="none" />
      </g>
    )));
  const shut = (cx: number) => (
    <path key={cx} d={`M${cx - 11} ${cy} Q${cx} ${cy + 7} ${cx + 11} ${cy}`} fill="none" />
  );
  return {
    default: open(0),
    side: open(5),
    wide: open(0, 1.25),
    closed: svg(w, h, [shut(l), shut(r)]),
    wink: svg(w, h, [
      <g key="o">
        <ellipse cx={l} cy={cy} rx={11} ry={13} fill="#fff" />
        <circle cx={l + 3} cy={cy + 1} r={5.5} fill={INK} stroke="none" />
      </g>,
      shut(r),
    ]),
  };
};

export const brows = (w: number, h: number, gap: number, color: string) => {
  const cy = h / 2;
  const l = w / 2 - gap / 2;
  const r = w / 2 + gap / 2;
  const line = (x1: number, y1: number, x2: number, y2: number, k: string) => (
    <path key={k} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={color} strokeWidth={8} />
  );
  return {
    default: svg(w, h, [line(l - 14, cy, l + 14, cy, "l"), line(r - 14, cy, r + 14, cy, "r")]),
    angry: svg(w, h, [line(l - 14, cy - 6, l + 14, cy + 6, "l"), line(r - 14, cy + 6, r + 14, cy - 6, "r")]),
    raised: svg(w, h, [line(l - 14, cy - 4, l + 14, cy - 8, "l"), line(r - 14, cy - 8, r + 14, cy - 4, "r")]),
    smug: svg(w, h, [line(l - 14, cy + 2, l + 14, cy + 2, "l"), line(r - 14, cy - 4, r + 14, cy - 10, "r")]),
  };
};

export const mouths = (w: number, h: number) => {
  const cy = h / 2;
  return {
    default: svg(w, h, <path d={`M${w * 0.2} ${cy} L${w * 0.8} ${cy}`} fill="none" />),
    frown: svg(w, h, <path d={`M${w * 0.2} ${cy + 6} Q${w / 2} ${cy - 8} ${w * 0.8} ${cy + 6}`} fill="none" />),
    smirk: svg(w, h, <path d={`M${w * 0.2} ${cy + 2} Q${w * 0.55} ${cy + 6} ${w * 0.85} ${cy - 7}`} fill="none" />),
    smile: svg(w, h, <path d={`M${w * 0.15} ${cy - 4} Q${w / 2} ${cy + 12} ${w * 0.85} ${cy - 4}`} fill="none" />),
    open: svg(w, h, <ellipse cx={w / 2} cy={cy} rx={w * 0.28} ry={h * 0.42} fill="#5a1a1a" />),
  };
};
