import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WORDS } from "../edit";
import { useLayout } from "../layout";

const GOLD = "#f1c74f";

// Phrase-at-a-time captions in the lower quarter; key words get a gold pill as they are spoken.
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const { captions: c } = useLayout();
  const pages = [...new Set(WORDS.map((w) => w.page))];
  const current = pages.filter((p) => WORDS.find((w) => w.page === p)!.start - 3 <= frame).pop();
  if (current === undefined) return null;
  const words = WORDS.filter((w) => w.page === current);

  return (
    <div
      style={{
        position: "absolute",
        left: (width - c.maxWidth) / 2,
        right: (width - c.maxWidth) / 2,
        top: c.top,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px 18px",
        fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
        fontWeight: 900,
        fontSize: c.fontSize,
        lineHeight: 1.15,
        textTransform: "uppercase",
      }}
    >
      {words.map((w, i) => {
        const on = frame >= w.start;
        const lit = w.key && on;
        return (
          <span
            key={i}
            style={{
              color: lit ? "#1d1208" : "#fff",
              background: lit ? GOLD : "transparent",
              borderRadius: 14,
              padding: "0 10px",
              opacity: on ? 1 : 0.35,
              WebkitTextStroke: lit ? "0px" : "10px #1d1208",
              paintOrder: "stroke fill",
              scale: interpolate(frame, [w.start, w.start + 4, w.start + 9], [1, lit ? 1.18 : 1.06, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              }),
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
