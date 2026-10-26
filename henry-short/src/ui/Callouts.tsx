import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { useLayout } from "../layout";

const INK = "#1d1208";
const GOLD = "#f1c74f";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Pops in with overshoot at `from`, optionally pops out at `to`.
const usePop = (from: number, to = Infinity) => {
  const frame = useCurrentFrame();
  const inn = interpolate(frame, [from, from + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const out = Number.isFinite(to) ? interpolate(frame, [to, to + 6], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) }) : 1;
  return Math.min(inn, out);
};

export const Badge: React.FC<{ from: number; to: number; x: number; y: number; text: string }> = ({ from, to, x, y, text }) => {
  const s = usePop(from, to);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 90,
        top: y - 90,
        width: 180,
        height: 180,
        borderRadius: 90,
        background: GOLD,
        border: `8px solid ${INK}`,
        display: "grid",
        placeItems: "center",
        font: "900 64px 'Arial Black', Arial, sans-serif",
        color: INK,
        scale: `${s}`,
        rotate: "-8deg",
      }}
    >
      {text}
    </div>
  );
};

export const TitleCard: React.FC<{ from: number; to: number; kicker: string; title: string }> = ({ from, to, kicker, title }) => {
  const frame = useCurrentFrame();
  const { ui } = useLayout();
  const y = interpolate(frame, [from, from + 10, to, to + 8], [-420, 0, 0, -420], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <div style={{ position: "absolute", top: ui.top, left: 0, right: 0, display: "flex", justifyContent: "center", translate: `0px ${y}px`, scale: `${ui.scale}`, transformOrigin: "50% 0%" }}>
      <div style={{ background: INK, color: "#fff", padding: "18px 40px 22px", borderRadius: 18, border: `6px solid ${GOLD}`, textAlign: "center" }}>
        <div style={{ font: "800 38px Arial, sans-serif", color: GOLD, letterSpacing: 4 }}>{kicker}</div>
        <div style={{ font: "900 72px 'Arial Black', Arial, sans-serif" }}>{title}</div>
      </div>
    </div>
  );
};

export const Stamp: React.FC<{ from: number; to: number; text: string }> = ({ from, to, text }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [from, from + 5], [2.4, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const o = interpolate(frame, [from, from + 3, to, to + 6], [0, 1, 1, 0], clamp);
  const { stampTop } = useLayout();
  return (
    <div
      style={{
        position: "absolute",
        top: stampTop,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: o,
      }}
    >
      <div
        style={{
          font: "900 150px 'Arial Black', Arial, sans-serif",
          color: "#c4161c",
          border: "14px solid #c4161c",
          borderRadius: 20,
          padding: "0 30px",
          background: "rgba(255,240,220,0.75)",
          rotate: "-12deg",
          scale: `${s}`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// A prize floating over Anne: icon plus the specific name, so the fact lands, not just the picture.
export const Prize: React.FC<{ from: number; x: number; y: number; icon: "palace" | "castle"; label: string }> = ({ from, x, y, icon, label }) => {
  const frame = useCurrentFrame();
  const s = usePop(from);
  const bob = Math.sin((frame - from) / 9) * 6;
  return (
    <div style={{ position: "absolute", left: x - 150, top: y - 130 + bob, width: 300, textAlign: "center", scale: `${s}` }}>
      <svg width={220} height={170} viewBox="0 0 220 170">
        <g stroke={INK} strokeWidth={6} strokeLinejoin="round" fill={GOLD}>
          {icon === "palace" ? (
            <>
              <rect x={20} y={70} width={180} height={90} />
              <path d="M10 70 L110 14 L210 70 Z" />
              <rect x={95} y={110} width={30} height={50} fill={INK} />
            </>
          ) : (
            <>
              <rect x={40} y={60} width={140} height={100} />
              <path d="M30 60 L30 30 L55 30 L55 45 L80 45 L80 30 L105 30 L105 45 L130 45 L130 30 L155 30 L155 45 L190 45 L190 60 Z" />
              <path d="M95 160 L95 120 Q110 100 125 120 L125 160 Z" fill={INK} />
            </>
          )}
        </g>
      </svg>
      <div style={{ font: "900 40px 'Arial Black', Arial, sans-serif", color: "#fff", WebkitTextStroke: `8px ${INK}`, paintOrder: "stroke fill" }}>{label}</div>
    </div>
  );
};

export const Banner: React.FC<{ from: number; text: string }> = ({ from, text }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [from, from + 12], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  const { ui, vertical } = useLayout();
  return (
    <div style={{ position: "absolute", top: vertical ? 110 : ui.top, left: 0, right: 0, display: "flex", justifyContent: "center", scale: `${ui.scale}`, transformOrigin: "50% 0%" }}>
      <div
        style={{
          clipPath: `inset(0 ${(100 - w) / 2}% 0 ${(100 - w) / 2}%)`,
          background: "#f6e7c1",
          border: `7px solid ${INK}`,
          borderRadius: 12,
          padding: "22px 44px",
          font: "900 62px Georgia, 'Times New Roman', serif",
          color: "#7a1420",
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        {text}
      </div>
    </div>
  );
};
