import React from "react";
import { useCurrentFrame } from "remotion";

// The set for a biology short: the view down a microscope, in stage units. Drawn wider and taller
// than 16:9 so the vertical crop never runs out of it. Drawn, not photographed, for the same two
// reasons the space set is: flat shapes cut through on a phone, and there is no provenance to check.

// Deterministic, so a speck is in the same place on every render and every re-render.
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const FIELD = { x: -500, y: -700, w: 2920, h: 2600 };
const SPECKS = (() => {
  const next = rng(11);
  return Array.from({ length: 90 }, () => ({
    x: next() * FIELD.w,
    y: next() * FIELD.h,
    r: 6 + next() * 22,
    a: 0.03 + next() * 0.05,
    phase: next() * Math.PI * 2,
    speed: 0.004 + next() * 0.008,
  }));
})();

// The field of view sits on the middle of the art rather than the middle of the stage.
const VIEW = { x: 960, y: 440 };

export const Slide: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: FIELD.x,
        top: FIELD.y,
        width: FIELD.w,
        height: FIELD.h,
        overflow: "hidden",
        background: `radial-gradient(circle at ${VIEW.x - FIELD.x}px ${VIEW.y - FIELD.y}px, #153a39 0%, #0c2326 34%, #061214 62%, #030809 100%)`,
      }}
    >
      {/* Out-of-focus debris drifting on the slide: slow enough to read as depth, not as content. */}
      {SPECKS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x + Math.sin(f * s.speed + s.phase) * 26 - s.r,
            top: s.y + Math.cos(f * s.speed * 0.8 + s.phase) * 20 - s.r,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: "50%",
            background: `rgba(170,230,215,${s.a})`,
            filter: "blur(3px)",
          }}
        />
      ))}
      {/* The edge of the field of view, twice, as a lens has. */}
      {[700, 736].map((r, i) => (
        <div
          key={r}
          style={{
            position: "absolute",
            left: VIEW.x - FIELD.x - r,
            top: VIEW.y - FIELD.y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            border: `${i ? 2 : 5}px solid rgba(150,220,205,${i ? 0.1 : 0.16})`,
          }}
        />
      ))}
    </div>
  );
};
