import React from "react";
import { Img, staticFile } from "remotion";

// Placeholder set, in stage units. Drawn wider and taller than 16:9 so the vertical crop never runs out.
export const DrawnHall: React.FC = () => (
  <>
    <div style={{ position: "absolute", left: -400, right: -400, top: -500, height: 1320, background: "linear-gradient(#3a2414, #5a3a22 40%, #8a5a32)" }} />
    {[360, 660, 960, 1260, 1560].map((x) => (
      <div key={x} style={{ position: "absolute", left: x - 100, top: 120, width: 200, height: 520, borderRadius: "100px 100px 0 0", background: "linear-gradient(#ffe9a8, #d99a4a)", border: "8px solid #2a1a12" }} />
    ))}
    <div style={{ position: "absolute", left: -400, right: -400, top: 820, height: 800, background: "linear-gradient(#6b4a2e, #2a1a10 60%)" }} />
  </>
);


// Pushed back (soft, dark) so the sharp cut-outs read in front of it.
export const PaintedHall: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, filter: "blur(3px) brightness(0.62) saturate(0.85)" }}>
    <Img src={staticFile("kit/pd/wall.jpg")} style={{ position: "absolute", left: -400, top: -500, width: 2720, height: 1380, filter: "brightness(0.8)" }} />
    <Img src={staticFile("kit/pd/damask.jpg")} style={{ position: "absolute", left: 520, top: -500, width: 880, height: 1360, boxShadow: "0 0 60px rgba(0,0,0,0.6)", borderLeft: "10px solid #3a2410", borderRight: "10px solid #3a2410" }} />
    <Img src={staticFile("kit/pd/carpet.jpg")} style={{ position: "absolute", left: -400, top: 860, width: 2720, height: 900 }} />
    <div style={{ position: "absolute", left: -400, right: -400, top: 860, height: 60, background: "linear-gradient(rgba(0,0,0,0.55), transparent)" }} />
    <div style={{ position: "absolute", left: -400, right: -400, top: -500, height: 2300, background: "radial-gradient(ellipse at 50% 55%, transparent 45%, rgba(0,0,0,0.55) 100%)" }} />
  </div>
);

// Paper cut-outs cast a hard offset shadow, like card on card.
export const PaperCutout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(7px 9px 0 rgba(0,0,0,0.38))" }}>{children}</div>
);
