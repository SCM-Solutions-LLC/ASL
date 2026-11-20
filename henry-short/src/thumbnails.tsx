import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { CAPTION } from "./fonts";
import { GRS, Planet } from "./shorts/great-red-spot/planet";

// Custom 9:16 thumbnails for the uploaded shorts, rendered with `npx remotion still thumb-<slug> --scale=2`
// (2160x3840, YouTube's recommended Shorts size). Every picture is one the short already ships and
// declares in public/SOURCES.json. Words and positions stay inside the middle 4:5 band (y 285-1635), the
// part every feed shows; the Shorts shelf lays the title over the bottom of the card.

const GOLD = "#f1c74f";
const SHADOW = "0 6px 24px rgba(0,0,0,0.95), 0 0 48px rgba(0,0,0,0.8)";
const word = (size: number, color = "#fff"): React.CSSProperties => ({
  fontFamily: CAPTION,
  fontWeight: 900,
  fontSize: size,
  lineHeight: 1,
  color,
  textTransform: "uppercase",
  textShadow: SHADOW,
  textAlign: "center",
  width: "100%",
  position: "absolute",
});

// Kola: the museum's 25.6 cm dinner plate with the 21 cm bit drawn on it to scale, as the short does.
const PLATE_CM = 25.6;
const BIT_CM = 21;
const PLATE = { cx: 485, cy: 462, r: 398 }; // the plate's rim in plate.jpg pixels (deepest-hole-cutout)
const DeepestHole: React.FC = () => {
  const r = 450;
  const [cx, cy] = [540, 1090];
  const k = r / PLATE.r;
  const bit = (r * BIT_CM) / PLATE_CM;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 55%, #3a2616 0%, #0b0705 70%)" }}>
      <Img src={staticFile("cutout/hole/plate.jpg")} style={{ position: "absolute", left: cx - PLATE.cx * k, top: cy - PLATE.cy * k, width: 960 * k, height: 896 * k, clipPath: `circle(${PLATE.r * k}px at ${PLATE.cx * k}px ${PLATE.cy * k}px)` }} />
      <div style={{ position: "absolute", left: cx - bit, top: cy - bit, width: 2 * bit, height: 2 * bit, borderRadius: "50%", border: `14px solid ${GOLD}`, boxSizing: "border-box", background: "rgba(10,6,4,0.55)", boxShadow: "0 0 40px rgba(0,0,0,0.8)" }} />
      <div style={{ ...word(170, GOLD), top: cy - 110 }}>21 CM</div>
      <div style={{ ...word(80), top: cy + 75 }}>BIT</div>
      <div style={{ ...word(140, GOLD), top: 400, whiteSpace: "nowrap" }}>12 KM DOWN</div>
      <div style={{ ...word(56, "#d9cbb5"), top: 1575, letterSpacing: "0.08em" }}>ON A DINNER PLATE, TO SCALE</div>
    </AbsoluteFill>
  );
};

// Sun: two messages from the core, by how long ago they left it (the long cut's core claim).
const SUN = { cx: 640, cy: 620, r: 505 }; // the disc in sun304.jpg pixels
const NeutrinosSun: React.FC = () => {
  const k = 640 / SUN.r;
  const [cx, cy] = [540, 1330];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Img src={staticFile("cutout/sunlight/sun304.jpg")} style={{ position: "absolute", left: cx - SUN.cx * k, top: cy - SUN.cy * k, width: 1280 * k, height: 1222 * k }} />
      <div style={{ ...word(64, "#ffd9a0"), top: 300, letterSpacing: "0.12em" }}>SUNLIGHT</div>
      <div style={{ ...word(112, "#ffb347"), top: 385, whiteSpace: "nowrap" }}>40,000+ YEARS</div>
      <div style={{ ...word(64, "#aee9ff"), top: 560, letterSpacing: "0.12em" }}>NEUTRINOS</div>
      <div style={{ ...word(170, "#5fd4ff"), top: 640 }}>8 MINUTES</div>
    </AbsoluteFill>
  );
};

// Jupiter: the real Great Red Spot (NASA Cassini map, unaltered) asked about, never Cassini's 1665 oval.
const GreatRedSpot: React.FC = () => {
  const [cx, cy, r] = [540, 1000, 480];
  const gy = cy - r * Math.sin(GRS.lat * (Math.PI / 180));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Planet cx={cx} cy={cy} r={r} res={2} lon={GRS.lon} today={1} spots={[]} />
      <div style={{ position: "absolute", left: cx - 120, top: gy - 70, width: 240, height: 140, borderRadius: "50%", border: `10px solid ${GOLD}`, boxSizing: "border-box", boxShadow: "0 0 24px rgba(0,0,0,0.9)" }} />
      <div style={{ ...word(110), top: 300 }}>SEEN SINCE</div>
      <div style={{ ...word(230, GOLD), top: 420 }}>1665?</div>
      <div style={{ ...word(70), top: 1520 }}>RECORD STARTS 1831</div>
    </AbsoluteFill>
  );
};

export const THUMBS = [
  { id: "thumb-deepest-hole-long", component: DeepestHole },
  { id: "thumb-age-of-sunlight-long", component: NeutrinosSun },
  { id: "thumb-great-red-spot", component: GreatRedSpot },
];
