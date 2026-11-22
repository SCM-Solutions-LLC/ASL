import React from "react";
import { Img, staticFile } from "remotion";
import { SANS, SERIF } from "../../fonts";
import { clamp01, ease } from "../altar-stone/shots";

// Flat 2D pieces for cleopatra-pyramid. Each is a literal picture of one spoken phrase. What each
// one is allowed to show is set by script/cleopatra-pyramid.txt SOURCES; the A6 notes sit beside it.

export const INK = "#f4ecd8";
export const DIM = "#b9a987";
export const GOLD = "#f1c74f";
export const RED = "#e2553b";
export const DARK = "#1d1208";
export const SHADOW = "0 3px 14px rgba(0,0,0,0.95)";

const svgBox: React.CSSProperties = { position: "absolute", left: 0, top: 0, overflow: "visible" };

// A label on screen: title in caps, optional italic sub. Every one of these is a claim (A6).
export const Label: React.FC<{ x: number; y: number; o: number; title: string; sub?: string; size?: number; color?: string; align?: "left" | "center" | "right" }> = ({
  x,
  y,
  o,
  title,
  sub,
  size = 40,
  color = INK,
  align = "center",
}) =>
  o <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: align === "center" ? "-50% 0" : align === "right" ? "-100% 0" : undefined,
        textAlign: align,
        whiteSpace: "pre",
        opacity: o,
        textShadow: SHADOW,
      }}
    >
      <div style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: size, color }}>{title}</div>
      {sub ? <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size * 0.72, color: DIM, marginTop: 4 }}>{sub}</div> : null}
    </div>
  );

// The big number of the moment. One counter on screen at a time.
export const Counter: React.FC<{ x: number; y: number; o: number; value: string; unit?: string; size?: number; color?: string }> = ({ x, y, o, value, unit, size = 120, color = GOLD }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", textAlign: "center", opacity: o, whiteSpace: "pre", textShadow: "0 4px 18px rgba(0,0,0,0.9)" }}>
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: size, lineHeight: 1, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {unit ? <div style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: size * 0.32, color: INK, marginTop: 6 }}>{unit}</div> : null}
    </div>
  );

// Small print that keeps a drawing honest: "illustration", "not to scale", a photo credit.
export const Fine: React.FC<{ x: number; y: number; o: number; text: string; align?: "left" | "right" | "center" }> = ({ x, y, o, text, align = "left" }) =>
  o <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: align === "right" ? "-100% 0" : align === "center" ? "-50% 0" : undefined,
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: 26,
        color: INK,
        opacity: 0.85 * o,
        whiteSpace: "pre",
        textShadow: SHADOW,
      }}
    >
      {text}
    </div>
  );

// The Great Pyramid, front-on with its right face in shade. `casing` 0..1 covers the stepped core
// from the base up with smooth stone; `sheen` sweeps a highlight across it. The top is a small flat
// platform, not a point: Diodorus 1.63.3 gives the top as six cubits a side in his day. No height,
// no colour claim: the casing is drawn as smoothed stone in the core's own tone (SOURCES 3 does not
// say "white").
export const Pyramid: React.FC<{ x: number; base: number; w: number; casing: number; sheen?: number; o?: number }> = ({ x, base, w, casing, sheen = 0, o = 1 }) => {
  if (o <= 0) return null;
  const h = w * 0.62;
  const top = base - h;
  const flat = w * 0.014;
  const apexL = x - flat / 2;
  const apexR = x + flat / 2;
  const L = x - w / 2;
  const R = x + w / 2;
  const split = x + w * 0.16; // where the lit face meets the shaded one, at the base
  const courses = 22;
  const cut = base - h * ease(clamp01(casing));
  const id = `cp-${Math.round(x)}-${Math.round(base)}`;
  const steps: string[] = [];
  for (let i = 1; i < courses; i++) {
    const y = base - (h * i) / courses;
    const t = (base - y) / h;
    const l = L + (apexL - L) * t;
    const r = R + (apexR - R) * t;
    steps.push(`M${l} ${y} L${r} ${y}`);
  }
  // The core edge is stepped: a sawtooth along both outer edges.
  const saw = (fromX: number, toX: number) => {
    let d = `M${fromX} ${base}`;
    for (let i = 0; i < courses; i++) {
      const t0 = i / courses;
      const t1 = (i + 1) / courses;
      const xa = fromX + (toX - fromX) * t0;
      const xb = fromX + (toX - fromX) * t1;
      const yb = base - h * t1;
      d += ` L${xa} ${yb} L${xb} ${yb}`;
    }
    return d;
  };
  return (
    <svg width={1920} height={1080} style={{ ...svgBox, opacity: o }}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x={L - 40} y={cut} width={w + 80} height={h + 40} />
        </clipPath>
        <linearGradient id={`${id}-sheen`} x1="0" x2="1" y1="0" y2="0">
          <stop offset={Math.max(0, sheen - 0.12)} stopColor="rgba(255,255,255,0)" />
          <stop offset={sheen} stopColor="rgba(255,250,235,0.55)" />
          <stop offset={Math.min(1, sheen + 0.12)} stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* Core: two faces and the courses, with a stepped outline. */}
      <path d={`M${apexL} ${top} L${apexR} ${top} L${split} ${base} L${L} ${base} Z`} fill="#c9a26a" />
      <path d={`M${apexR} ${top} L${R} ${base} L${split} ${base} Z`} fill="#8e6a3e" />
      <path d={steps.join(" ")} stroke="#6f5130" strokeWidth={3} opacity={0.7} />
      <path d={saw(L, apexL)} fill="none" stroke="#6f5130" strokeWidth={3} opacity={0.8} />
      {/* Casing: smooth faces laid over the core, rising from the base. */}
      {casing > 0 ? (
        <g clipPath={`url(#${id}-clip)`}>
          <path d={`M${apexL} ${top} L${apexR} ${top} L${split} ${base} L${L - 6} ${base} Z`} fill="#dcc398" />
          <path d={`M${apexR} ${top} L${R + 6} ${base} L${split} ${base} Z`} fill="#a88a5c" />
          <path d={`M${apexL} ${top} L${apexR} ${top} L${R + 6} ${base} L${L - 6} ${base} Z`} fill={`url(#${id}-sheen)`} />
        </g>
      ) : null}
      <rect x={L - 80} y={base} width={w + 160} height={14} rx={7} fill="#7a5a33" opacity={0.6} />
    </svg>
  );
};

// A photograph, cropped to cover a box, with its credit underneath (CC BY needs it on screen).
export const PhotoCard: React.FC<{ src: string; x: number; y: number; w: number; h: number; o: number; zoom?: number; fx?: number; fy?: number }> = ({ src, x, y, w, h, o, zoom = 1, fx = 0.5, fy = 0.5 }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", opacity: o, borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fx * 100}% ${fy * 100}%`, scale: `${zoom}`, transformOrigin: `${fx * 100}% ${fy * 100}%` }} />
    </div>
  );

// A tiny person, for the workforce chart.
export const Person: React.FC<{ x: number; y: number; s: number; color: string }> = ({ x, y, s, color }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={-11} r={5} fill={color} />
    <path d="M-7 8 Q-7 -4 0 -4 Q7 -4 7 8 Z" fill={color} />
  </g>
);

// A sheet of papyrus with lines of ink. The strokes are invented squiggles, not real script: the
// card that shows it says "illustration".
export const Papyrus: React.FC<{ x: number; y: number; w: number; h: number; o: number; ink?: number; grid?: boolean; rot?: number; torn?: boolean }> = ({
  x,
  y,
  w,
  h,
  o,
  ink = 1,
  grid = false,
  rot = 0,
  torn = true,
}) => {
  if (o <= 0) return null;
  const rows = Math.max(3, Math.round(h / 46));
  const cols = grid ? 4 : 1;
  const strokes: React.ReactNode[] = [];
  let seed = Math.round(x * 7 + y * 13 + w);
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let c = 0; c < cols; c++) {
    const cx0 = x + 26 + (c * (w - 52)) / cols;
    const cw = (w - 52) / cols - (grid ? 18 : 0);
    for (let r = 0; r < rows; r++) {
      const yy = y + 40 + r * ((h - 70) / rows);
      if ((c * rows + r) / (cols * rows) > ink) continue;
      let d = `M${cx0} ${yy}`;
      let xx = cx0;
      while (xx < cx0 + cw - 10) {
        const step = 8 + rnd() * 16;
        d += ` q${step / 2} ${(rnd() - 0.5) * 18} ${step} ${(rnd() - 0.5) * 6}`;
        xx += step;
        if (rnd() < 0.15) {
          xx += 10;
          d += ` m10 0`;
        }
      }
      strokes.push(<path key={`${c}-${r}`} d={d} stroke="#2b1a0e" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.85} />);
    }
  }
  const edge = torn
    ? `M${x} ${y + 6} L${x + w * 0.3} ${y} L${x + w * 0.55} ${y + 8} L${x + w} ${y + 2} L${x + w - 6} ${y + h * 0.5} L${x + w} ${y + h} L${x + w * 0.6} ${y + h - 8} L${x + w * 0.25} ${y + h} L${x} ${y + h - 4} L${x + 6} ${y + h * 0.45} Z`
    : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  return (
    <svg width={1920} height={1080} style={{ ...svgBox, opacity: o }}>
      <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
        <path d={edge} fill="#d9bd85" stroke="#9c7a45" strokeWidth={3} />
        {[0.2, 0.45, 0.7].map((t) => (
          <line key={t} x1={x + 8} y1={y + h * t} x2={x + w - 8} y2={y + h * t} stroke="#c3a46c" strokeWidth={2} opacity={0.6} />
        ))}
        {grid
          ? Array.from({ length: cols - 1 }, (_, i) => (
              <line key={i} x1={x + 26 + ((i + 1) * (w - 52)) / cols - 9} y1={y + 18} x2={x + 26 + ((i + 1) * (w - 52)) / cols - 9} y2={y + h - 18} stroke="#2b1a0e" strokeWidth={3} opacity={0.6} />
            ))
          : null}
        {strokes}
      </g>
    </svg>
  );
};

// Onion, radish, leek as generic "vegetables": Diodorus 1.64.3 names none, so no label names a kind
// (A7 pass 2). The picture adds no number.
export const Vegetables: React.FC<{ x: number; y: number; o: number; pop: number[] }> = ({ x, y, o, pop }) =>
  o <= 0 ? null : (
    <svg width={1920} height={1080} style={{ ...svgBox, opacity: o }}>
      <g transform={`translate(${x - 170} ${y}) scale(${ease(clamp01(pop[0]))})`}>
        <ellipse cx={0} cy={0} rx={62} ry={58} fill="#b7798f" />
        <path d="M-30 -40 Q0 -60 30 -40" stroke="#e9cfd6" strokeWidth={5} fill="none" />
        <path d="M0 -56 Q-6 -100 8 -130" stroke="#5f8f3a" strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M-20 58 l-6 16 M0 58 l0 18 M20 58 l6 16" stroke="#e8dcc0" strokeWidth={4} />
      </g>
      <g transform={`translate(${x} ${y + 10}) scale(${ease(clamp01(pop[1]))})`}>
        <ellipse cx={0} cy={0} rx={44} ry={50} fill="#d24b4b" />
        <path d="M0 48 Q4 90 0 120" stroke="#e8dcc0" strokeWidth={4} fill="none" />
        <path d="M-6 -48 Q-40 -110 -20 -140 M6 -48 Q40 -110 24 -140" stroke="#4f8a34" strokeWidth={12} fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(${x + 170} ${y - 20}) scale(${ease(clamp01(pop[2]))}) rotate(14)`}>
        <rect x={-18} y={-20} width={36} height={110} rx={14} fill="#eee6cf" />
        <path d="M-14 -16 Q-40 -110 -30 -170 M0 -20 Q4 -120 10 -180 M14 -16 Q44 -100 40 -160" stroke="#3f7d32" strokeWidth={14} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );

// A clay jar: the laxatives.
export const Jar: React.FC<{ x: number; y: number; o: number; s: number }> = ({ x, y, o, s }) =>
  o <= 0 ? null : (
    <svg width={1920} height={1080} style={{ ...svgBox, opacity: o }}>
      <g transform={`translate(${x} ${y}) scale(${ease(clamp01(s))})`}>
        <path d="M-30 -70 h60 v14 q40 20 40 80 q0 60 -70 60 q-70 0 -70 -60 q0 -60 40 -80 z" fill="#b8643a" stroke="#6e3517" strokeWidth={5} />
        <rect x={-34} y={-84} width={68} height={18} rx={6} fill="#8a4422" />
        <path d="M-50 20 h100" stroke="#e8c49a" strokeWidth={5} opacity={0.6} />
      </g>
    </svg>
  );

// A balance: the talents (a talent was a unit of weight; the script names no metal).
export const Balance: React.FC<{ x: number; y: number; o: number; tilt: number }> = ({ x, y, o, tilt }) =>
  o <= 0 ? null : (
    <svg width={1920} height={1080} style={{ ...svgBox, opacity: o }}>
      <g transform={`translate(${x} ${y})`}>
        <rect x={-8} y={-160} width={16} height={190} fill="#c9a64a" />
        <rect x={-70} y={24} width={140} height={20} rx={8} fill="#c9a64a" />
        <g transform={`rotate(${tilt})`}>
          <rect x={-190} y={-170} width={380} height={12} rx={6} fill="#e2c46a" />
          {[-170, 170].map((px) => (
            <g key={px}>
              <path d={`M${px} -164 L${px - 50} -70 M${px} -164 L${px + 50} -70`} stroke="#c9a64a" strokeWidth={4} />
              <path d={`M${px - 64} -70 Q${px} -30 ${px + 64} -70 Z`} fill="#e2c46a" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );

// An ancient river boat with one block of stone on deck and a crew at the oars.
export const Boat: React.FC<{ x: number; y: number; o: number; s?: number; bob: number; dir?: 1 | -1 }> = ({ x, y, o, s = 1, bob, dir = 1 }) =>
  o <= 0 ? null : (
    <svg width={1920} height={1080} style={{ ...svgBox, opacity: o }}>
      <g transform={`translate(${x} ${y + Math.sin(bob) * 4}) scale(${s * dir} ${s})`}>
        <path d="M-190 -10 Q-210 -50 -230 -60 L-200 -10 Q0 40 200 -10 L230 -60 Q210 -50 190 -10 Z" fill="#8a5a2f" stroke="#4c2f15" strokeWidth={5} />
        <rect x={-70} y={-86} width={140} height={78} rx={4} fill="#e0cfa8" stroke="#8b7a56" strokeWidth={4} />
        {[-150, -110, 110, 150].map((px, i) => (
          <g key={px}>
            <circle cx={px} cy={-44} r={9} fill="#2b1a0e" />
            <rect x={px - 7} y={-36} width={14} height={24} rx={5} fill="#2b1a0e" />
            <line x1={px} y1={-24} x2={px + (i < 2 ? -40 : 40) + Math.sin(bob * 2) * 10} y2={30} stroke="#5b3a1c" strokeWidth={5} />
          </g>
        ))}
      </g>
    </svg>
  );

export const Waves: React.FC<{ x0: number; x1: number; y: number; h: number; o: number; t: number; color?: string }> = ({ x0, x1, y, h, o, t, color = "#2f6f9a" }) => {
  if (o <= 0) return null;
  const rows = [0.15, 0.45, 0.75];
  return (
    <svg width={1920} height={1080} style={{ ...svgBox, opacity: o }}>
      <rect x={x0} y={y} width={x1 - x0} height={h} fill={color} />
      {rows.map((r, i) => {
        let d = "";
        for (let xx = x0 - 60 + ((t * 2 + i * 30) % 60); xx < x1; xx += 60) d += `M${xx} ${y + h * r} q15 -10 30 0 q15 10 30 0 `;
        return <path key={r} d={d} stroke="rgba(255,255,255,0.35)" strokeWidth={4} fill="none" />;
      })}
    </svg>
  );
};

// Everyday things we leave behind, for the closing layer.
export const Phone: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-26} y={-48} width={52} height={96} rx={10} fill="#222a33" stroke="#9aa6b2" strokeWidth={4} />
    <rect x={-20} y={-38} width={40} height={72} rx={4} fill="#4d7ea8" />
  </g>
);
export const Disc: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={40} fill="#c7ced6" stroke="#8b96a3" strokeWidth={3} />
    <circle r={10} fill="#5b4a3a" />
  </g>
);
export const Book: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-40} y={-30} width={80} height={60} rx={4} fill="#6e2f2f" />
    <rect x={-34} y={-24} width={68} height={48} fill="#efe3c8" />
    <line x1={0} y1={-24} x2={0} y2={24} stroke="#6e2f2f" strokeWidth={4} />
  </g>
);
