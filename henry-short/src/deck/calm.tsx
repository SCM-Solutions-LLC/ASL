import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { MARKER } from "../fonts";
import { BOARD, INK, PAPER, YELLOW, clamp } from "./kit";

// The calm look: the deck's paper, colours and photos at one card per sentence. Each card cuts in,
// drifts slowly closer, and carries one keyword, every keyword the same size in the same place.
const KEY = { y: 1205, size: 92, tilt: -2 };

// One card per sentence: a hard cut in, then everything but the keyword drifts slowly closer.
export const Card: React.FC<{
  from: number;
  to: number;
  word: string;
  /** The keyword's figure in imperial units, on a smaller line under it. */
  sub?: string;
  at: number;
  sheet?: string;
  tilt?: number;
  children: React.ReactNode;
}> = ({ from, to, word, sub, at, sheet, tilt = 0, children }) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          scale: `${interpolate(f, [from, to], [1, 1.06])}`,
          transformOrigin: "50% 45%",
        }}
      >
        {sheet && (
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 150,
              width: 1000,
              height: 900,
              background: sheet,
              rotate: `${-tilt * 2.5}deg`,
              clipPath:
                "polygon(1% 3%, 34% 0%, 71% 2%, 99% 1%, 100% 46%, 98% 98%, 62% 100%, 27% 98%, 0% 100%, 2% 52%)",
            }}
          />
        )}
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: KEY.y,
          display: "flex",
          justifyContent: "center",
          translate: "0 -50%",
          opacity: interpolate(f, [at, at + 6], [0, 1], clamp),
        }}
      >
        <div
          style={{
            rotate: `${KEY.tilt}deg`,
            font: `400 ${KEY.size}px ${MARKER}`,
            lineHeight: 1.1,
            color: INK,
            whiteSpace: "nowrap",
            letterSpacing: 1,
            padding: "0 26px",
            background: `linear-gradient(transparent 18%, ${YELLOW} 18%, ${YELLOW} 94%, transparent 94%)`,
            borderRadius: 18,
          }}
        >
          {word}
        </div>
      </div>
      {sub && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: KEY.y + 76,
            textAlign: "center",
            translate: "0 -50%",
            rotate: `${KEY.tilt}deg`,
            font: `400 ${KEY.size * 0.55}px ${MARKER}`,
            color: INK,
            whiteSpace: "nowrap",
            letterSpacing: 1,
            opacity: interpolate(f, [at, at + 6], [0, 1], clamp),
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};

export const Marks: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <svg
    style={{ position: "absolute", inset: 0, overflow: "visible" }}
    width={BOARD.w}
    height={BOARD.h}
  >
    {children}
  </svg>
);

export const Pieces: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <svg
    style={{
      position: "absolute",
      inset: 0,
      overflow: "visible",
      filter: "drop-shadow(0 8px 0 rgba(29,18,8,0.16))",
    }}
    width={BOARD.w}
    height={BOARD.h}
  >
    {children}
  </svg>
);

export const circle = (x: number, y: number, r: number) =>
  `M${x - r} ${y} A${r} ${r} 0 1 1 ${x + r} ${y} A${r} ${r} 0 1 1 ${x - r} ${y}`;
