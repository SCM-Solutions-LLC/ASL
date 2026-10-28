import React from "react";
import { useCurrentFrame } from "remotion";
import { SERIF } from "../fonts";

// Scene pieces for space shorts. Nothing here is a figure: the subject is the object and its
// scale, so the short composes bodies and a starfield instead of staging a cast.
//
// Everything is drawn rather than photographed. That is partly a look — flat gradients cut
// through on a phone where a dim telescope frame does not — and partly licensing: a drawn planet
// has no provenance to get wrong.

// Deterministic, so a star is in the same place on every render and every re-render.
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

export type Star = { x: number; y: number; r: number; a: number; phase: number };

export const makeStars = (n: number, w: number, h: number, seed = 7): Star[] => {
  const next = rng(seed);
  return Array.from({ length: n }, () => {
    const t = next();
    return {
      x: next() * w,
      y: next() * h,
      // Most stars are faint specks; a handful carry the frame.
      r: 0.8 + t * t * t * 5.2,
      a: 0.25 + next() * 0.6,
      phase: next() * Math.PI * 2,
    };
  });
};

const FIELD = { x: -500, y: -700, w: 2920, h: 2600 };
const STARS = makeStars(340, FIELD.w, FIELD.h);

/** The set for a space short: drifting stars over a cold gradient. */
export const Starfield: React.FC<{ drift?: number }> = ({ drift = 0.06 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: FIELD.x, top: FIELD.y, width: FIELD.w, height: FIELD.h, overflow: "hidden", background: "radial-gradient(ellipse at 50% 38%, #141c33 0%, #080b16 55%, #04050a 100%)" }}>
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x - f * drift * (0.4 + s.r / 6),
            top: s.y,
            width: s.r,
            height: s.r,
            borderRadius: "50%",
            background: "#fff",
            opacity: s.a * (0.72 + 0.28 * Math.sin(f * 0.07 + s.phase)),
          }}
        />
      ))}
    </div>
  );
};

export type BodyLook = {
  lit: string;
  dark: string;
  /** Horizontal cloud banding, as Jupiter and Saturn have. */
  bands?: string[];
  /** A glow outside the disc, for anything that emits its own light. */
  glow?: string;
  ring?: string;
  spot?: string;
};

/** One celestial body, in stage units, lit from the upper left like everything else on the set. */
export const Body: React.FC<{ x: number; y: number; r: number; look: BodyLook; opacity?: number }> = ({
  x,
  y,
  r,
  look,
  opacity = 1,
}) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, opacity }}>
    {look.glow ? (
      <div
        style={{
          position: "absolute",
          left: -r * 0.55,
          top: -r * 0.55,
          width: r * 3.1,
          height: r * 3.1,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${look.glow} 0%, transparent 62%)`,
        }}
      />
    ) : null}
    {look.ring ? (
      <div
        style={{
          position: "absolute",
          left: -r * 0.62,
          top: r * 0.78,
          width: r * 3.24,
          height: r * 0.82,
          borderRadius: "50%",
          border: `${Math.max(2, r * 0.1)}px solid ${look.ring}`,
          rotate: "-14deg",
        }}
      />
    ) : null}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        overflow: "hidden",
        background: `radial-gradient(circle at 33% 28%, ${look.lit} 0%, ${look.dark} 62%, #05060b 100%)`,
        boxShadow: look.glow ? undefined : `inset ${-r * 0.1}px 0 ${r * 0.3}px rgba(0,0,0,0.45)`,
      }}
    >
      {(look.bands ?? []).map((c, i, all) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${8 + (i * 84) / all.length}%`,
            height: `${42 / all.length}%`,
            background: c,
            opacity: 0.5,
          }}
        />
      ))}
      {look.spot ? (
        <div style={{ position: "absolute", left: "52%", top: "58%", width: `${r * 0.5}px`, height: `${r * 0.3}px`, borderRadius: "50%", background: look.spot, opacity: 0.85 }} />
      ) : null}
    </div>
  </div>
);

// A small, consistent palette so bodies across different shorts look like the same solar system.
export const LOOKS: Record<string, BodyLook> = {
  sun: { lit: "#fff3c4", dark: "#ef8c1c", glow: "rgba(255,170,60,0.55)" },
  jupiter: { lit: "#e8cba6", dark: "#9a6f45", bands: ["#c89a6a", "#8d6239", "#d3ab7e", "#7d5531"], spot: "#a8422c" },
  saturn: { lit: "#e7d6ad", dark: "#a98f5f", bands: ["#cdb98a", "#b49a67"], ring: "rgba(226,208,168,0.75)" },
  rocky: { lit: "#b9a898", dark: "#6b5c50" },
  earth: { lit: "#9ec8e8", dark: "#2d5d86" },
  dwarf: { lit: "#ffb27a", dark: "#b8471f", glow: "rgba(255,120,60,0.35)" },
};

/** A label tied to a body, with a leader line down to it. */
export const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  sub?: string;
  from: number;
  /** Frame the label leaves on. Without one it stays for the rest of the short. */
  to?: number;
  align?: "left" | "right";
}> = ({ x, y, text, sub, from, to, align = "left" }) => {
  const f = useCurrentFrame();
  const inT = Math.max(0, Math.min(1, (f - from) / 10));
  const outT = to === undefined ? 1 : Math.max(0, Math.min(1, (to - f) / 10));
  const t = Math.min(inT, outT);
  if (t <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: t, translate: `0 ${(1 - t) * 14}px`, textAlign: align, transform: align === "right" ? "translateX(-100%)" : undefined }}>
      <div style={{ fontFamily: SERIF, fontSize: 44, letterSpacing: 3, whiteSpace: "pre-line", color: "#f4ecd8", textShadow: "0 3px 14px rgba(0,0,0,0.9)" }}>{text}</div>
      {sub ? <div style={{ fontFamily: SERIF, fontSize: 28, color: "#c3b48f", marginTop: 4, textShadow: "0 3px 14px rgba(0,0,0,0.9)" }}>{sub}</div> : null}
    </div>
  );
};
