import React from "react";

// Giza at dusk, in stage units: a sky going from indigo to ember, a low sun, dunes, and sand under
// the floor line. Drawn wider and taller than 16:9 so the vertical crop never runs out of set.
export const DesertDusk: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        left: -400,
        right: -400,
        top: -700,
        height: 1560,
        background: "linear-gradient(#141231 0%, #2b1f4d 34%, #6d3554 58%, #c8643c 80%, #f0a657 100%)",
      }}
    />
    {/* The sun, already half down behind the dunes. */}
    <div
      style={{
        position: "absolute",
        left: 960 - 260,
        top: 560,
        width: 520,
        height: 520,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,226,160,0.95) 0%, rgba(255,170,90,0.5) 38%, transparent 68%)",
      }}
    />
    {[
      { x: -300, w: 1300, h: 150, c: "#8d4a35" },
      { x: 700, w: 1500, h: 190, c: "#7c3f31" },
      { x: 200, w: 1100, h: 110, c: "#a3583a" },
    ].map((d) => (
      <div
        key={d.x}
        style={{
          position: "absolute",
          left: d.x,
          top: 860 - d.h,
          width: d.w,
          height: d.h * 2,
          borderRadius: "50%",
          background: d.c,
        }}
      />
    ))}
    <div
      style={{
        position: "absolute",
        left: -400,
        right: -400,
        top: 840,
        height: 800,
        background: "linear-gradient(#b8713f, #6b3a22 30%, #2a160d 70%)",
      }}
    />
  </>
);
