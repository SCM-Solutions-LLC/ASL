import React from "react";
import { useCurrentFrame } from "remotion";
import { SANS } from "../fonts";
import { makeStars } from "./space";

// Scene pieces for shorts about the ground under us. Like the space pieces, everything is drawn:
// a cross-section is a diagram, so there is nothing to photograph and no provenance to get wrong.

const FIELD = { x: -500, y: -700, w: 2920, h: 2600 };
const STARS = makeStars(160, FIELD.w, FIELD.h, 31);

/** The set: a night sky that the ground is drawn over. Stars only twinkle — the ground is still. */
export const NightSky: React.FC = () => {
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
        background: "radial-gradient(ellipse at 50% 40%, #16203a 0%, #090d1a 55%, #04050a 100%)",
      }}
    >
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: s.r,
            height: s.r,
            borderRadius: "50%",
            background: "#fff",
            opacity: s.a * (0.7 + 0.3 * Math.sin(f * 0.07 + s.phase)),
          }}
        />
      ))}
    </div>
  );
};

// The Earth by fraction of its mean radius (6,371 km): inner core to 1,221 km, outer core to
// 3,480 km, mantle above that. The crust is not in this list because at any radius the disc can be
// drawn at it is a hairline, and it is drawn as one.
export const EARTH_KM = 6371;
export const INNER_CORE = 1221 / EARTH_KM;
export const OUTER_CORE = 3480 / EARTH_KM;

const ring = (r: number): React.CSSProperties => ({
  position: "absolute",
  left: -r,
  top: -r,
  width: r * 2,
  height: r * 2,
  borderRadius: "50%",
});

/** The Earth cut through its centre, to scale. `labels` fades the layer names in, 0–1. */
export const EarthSection: React.FC<{ x: number; y: number; r: number; opacity?: number; labels?: number }> = ({
  x,
  y,
  r,
  opacity = 1,
  labels = 0,
}) => {
  const name = (at: number, text: string, color: string): React.ReactNode => (
    <div
      style={{
        position: "absolute",
        left: -200,
        width: 400,
        top: r * at - 15,
        textAlign: "center",
        font: `700 26px ${SANS}`,
        letterSpacing: 3,
        color,
        opacity: labels,
      }}
    >
      {text}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity }}>
      <div style={{ ...ring(r * 1.04), background: "radial-gradient(circle, rgba(120,170,255,0.3) 93%, transparent 100%)" }} />
      {/* Mantle, with the crust as its outline: 35 km on a 6,371 km radius is half a percent. */}
      <div
        style={{
          ...ring(r),
          background: "radial-gradient(circle, #c9571c 0%, #a23a15 55%, #6e2410 100%)",
          boxShadow: "inset 0 0 0 2px #cdbb9a",
        }}
      />
      <div style={{ ...ring(r * OUTER_CORE), background: "radial-gradient(circle, #ffc94f 0%, #f09a2a 100%)" }} />
      <div
        style={{
          ...ring(r * INNER_CORE),
          background: "radial-gradient(circle, #fffbe6 0%, #ffe9a0 100%)",
          boxShadow: "0 0 30px 6px rgba(255,240,180,0.55)",
        }}
      />
      {labels > 0 ? (
        <>
          {name(0.78, "MANTLE", "#ffd9b8")}
          {name(0.37, "OUTER CORE", "#4a2206")}
        </>
      ) : null}
    </div>
  );
};
