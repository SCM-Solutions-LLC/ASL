import React from "react";
import { SANS, SERIF } from "../../fonts";

// Overlay type for cleopatra-pyramid: labels, counters and small print drawn over the 3D world. What
// each may say is set by script/cleopatra-pyramid.txt SOURCES; the A6 notes sit beside it.

export const INK = "#f4ecd8";
export const DIM = "#b9a987";
export const GOLD = "#f1c74f";
export const RED = "#e2553b";
export const DARK = "#1d1208";
export const SHADOW = "0 3px 14px rgba(0,0,0,0.95)";

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
      {sub ? <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: size * 0.72, color: INK, opacity: 0.92, marginTop: 4 }}>{sub}</div> : null}
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
export const Fine: React.FC<{ x: number; y: number; o: number; text: string; align?: "left" | "right" | "center"; size?: number }> = ({ x, y, o, text, align = "left", size = 26 }) =>
  o <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: align === "right" ? "-100% 0" : align === "center" ? "-50% 0" : undefined,
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: size,
        color: INK,
        opacity: 0.85 * o,
        whiteSpace: "pre",
        textShadow: SHADOW,
      }}
    >
      {text}
    </div>
  );
