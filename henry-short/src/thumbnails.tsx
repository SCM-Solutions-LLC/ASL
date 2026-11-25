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
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 55%, #3a2616 0%, #0b0705 70%)",
      }}
    >
      <Img
        src={staticFile("cutout/hole/plate.jpg")}
        style={{
          position: "absolute",
          left: cx - PLATE.cx * k,
          top: cy - PLATE.cy * k,
          width: 960 * k,
          height: 896 * k,
          clipPath: `circle(${PLATE.r * k}px at ${PLATE.cx * k}px ${PLATE.cy * k}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cx - bit,
          top: cy - bit,
          width: 2 * bit,
          height: 2 * bit,
          borderRadius: "50%",
          border: `14px solid ${GOLD}`,
          boxSizing: "border-box",
          background: "rgba(10,6,4,0.55)",
          boxShadow: "0 0 40px rgba(0,0,0,0.8)",
        }}
      />
      <div style={{ ...word(170, GOLD), top: cy - 110 }}>21 CM</div>
      <div style={{ ...word(80), top: cy + 75 }}>BIT</div>
      <div style={{ ...word(140, GOLD), top: 400, whiteSpace: "nowrap" }}>
        12 KM DOWN
      </div>
      <div
        style={{ ...word(56, "#d9cbb5"), top: 1575, letterSpacing: "0.08em" }}
      >
        ON A DINNER PLATE, TO SCALE
      </div>
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
      <Img
        src={staticFile("cutout/sunlight/sun304.jpg")}
        style={{
          position: "absolute",
          left: cx - SUN.cx * k,
          top: cy - SUN.cy * k,
          width: 1280 * k,
          height: 1222 * k,
        }}
      />
      <div
        style={{ ...word(64, "#ffd9a0"), top: 300, letterSpacing: "0.12em" }}
      >
        SUNLIGHT
      </div>
      <div style={{ ...word(112, "#ffb347"), top: 385, whiteSpace: "nowrap" }}>
        40,000+ YEARS
      </div>
      <div
        style={{ ...word(64, "#aee9ff"), top: 560, letterSpacing: "0.12em" }}
      >
        NEUTRINOS
      </div>
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
      <Planet
        cx={cx}
        cy={cy}
        r={r}
        res={2}
        lon={GRS.lon}
        today={1}
        spots={[]}
      />
      <div
        style={{
          position: "absolute",
          left: cx - 120,
          top: gy - 70,
          width: 240,
          height: 140,
          borderRadius: "50%",
          border: `10px solid ${GOLD}`,
          boxSizing: "border-box",
          boxShadow: "0 0 24px rgba(0,0,0,0.9)",
        }}
      />
      <div style={{ ...word(110), top: 300 }}>SEEN SINCE</div>
      <div style={{ ...word(230, GOLD), top: 420 }}>1665?</div>
      <div style={{ ...word(70), top: 1520 }}>RECORD STARTS 1831</div>
    </AbsoluteFill>
  );
};

// Stonehenge: the open question (source and route) over the CC BY photo the short uses, credited as the licence asks.
const AltarStone: React.FC = () => {
  const k = 1.6;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Img
        src={staticFile("img/stonehenge-red-sky.jpg")}
        style={{
          position: "absolute",
          left: 540 - 1000 * k,
          top: 1400 - 1170 * k,
          width: 1920 * k,
          height: 1440 * k,
        }}
      />
      <div style={{ ...word(190), top: 330 }}>6 TONNES</div>
      <div style={{ ...word(190, GOLD), top: 560 }}>700+ KM?</div>
      <div
        style={{
          ...word(26, "#bbb"),
          top: 1860,
          textTransform: "none",
          fontWeight: 400,
        }}
      >
        Photo: Stonehenge Stone Circle (Flickr), CC BY 2.0
      </div>
    </AbsoluteFill>
  );
};

// Great Pyramid: one face seen straight on, split down the apex. Left, the stepped core as it stands
// today; right, the same face cased, as in the short, with Cleopatra's portrait (the Berlin marble
// head the short shows, public domain). Both halves are our own 3D renders from one camera
// (tools/blender/cleopatra_world.py), so the split lines up. Title it as a pair: the title names
// "Cleopatra's day"; the picture shows which pyramid that was.
const CleopatraPyramid: React.FC = () => {
  const split = 540; // the apex: the camera faces the south face square on
  const half = (clip: string): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: 1080,
    height: 1920,
    clipPath: clip,
  });
  const chip = (
    bg: string,
    color: string,
    size: number,
  ): React.CSSProperties => ({
    ...word(size, color),
    position: "absolute",
    width: "auto",
    padding: "14px 28px 18px",
    borderRadius: 18,
    background: bg,
    textShadow: "none",
    whiteSpace: "nowrap",
    translate: "-50% 0",
  });
  const d = 280; // the portrait's diameter
  const [mx, my] = [810, 1215];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Img
        src={staticFile("img/cleopatra-thumb-core.jpg")}
        style={half(`inset(0 ${1080 - split}px 0 0)`)}
      />
      <Img
        src={staticFile("img/cleopatra-thumb-cased.jpg")}
        style={half(`inset(0 0 0 ${split}px)`)}
      />
      <div
        style={{
          position: "absolute",
          left: split - 5,
          top: 560,
          width: 10,
          height: 770,
          background: GOLD,
          boxShadow: "0 0 18px rgba(0,0,0,0.8)",
        }}
      />
      {/* The script's opening question. "In" her day, not "to" her: no source says she saw it. */}
      <div style={{ ...word(78), top: 300, whiteSpace: "nowrap" }}>
        WHAT DID IT LOOK LIKE
      </div>
      <div style={{ ...word(90, GOLD), top: 395, whiteSpace: "nowrap" }}>
        IN CLEOPATRA&apos;S DAY?
      </div>
      <div
        style={{
          ...chip("rgba(15,12,10,0.82)", "#fff", 84),
          left: 270,
          top: 1360,
        }}
      >
        TODAY
      </div>
      <div
        style={{
          position: "absolute",
          left: mx - d / 2,
          top: my,
          width: d,
          height: d,
          borderRadius: "50%",
          overflow: "hidden",
          border: `12px solid ${GOLD}`,
          boxSizing: "border-box",
          boxShadow: "0 10px 40px rgba(0,0,0,0.75)",
          background: "#a8afb1",
        }}
      >
        {/* The whole head, centred: hair to chin, bun to nose. */}
        <Img
          src={staticFile("img/cleopatra-berlin.jpg")}
          style={{
            position: "absolute",
            width: d * 1.15,
            left: -d * 0.098,
            top: -d * 0.098,
          }}
        />
      </div>
      <div style={{ ...chip(GOLD, "#1d1208", 60), left: mx, top: my + d + 8 }}>
        CLEOPATRA
      </div>
    </AbsoluteFill>
  );
};

// Moai: the hook's statue mid-rock on its ropes, islanders pulling (tools/blender/moai_world.py --cover).
// Built for attention as researched: people and a strong diagonal that read at feed size, one subject,
// one short headline over open sky, nothing important in the bottom 20 % (the Shorts shelf overlay),
// everything inside the 3:4 grid crop. A question, not a claim: walking is Lipo & Hunt's reading.
const MoaiReshaped: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Img src={staticFile("img/moai-thumb-rope.jpg")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
    <div style={{ ...word(112), top: 262, whiteSpace: "nowrap" }}>THEY WALKED</div>
    <div style={{ ...word(150, GOLD), top: 372, whiteSpace: "nowrap" }}>THIS?</div>
  </AbsoluteFill>
);

export const THUMBS = [
  { id: "thumb-altar-stone", component: AltarStone },
  { id: "thumb-deepest-hole-long", component: DeepestHole },
  { id: "thumb-age-of-sunlight-long", component: NeutrinosSun },
  { id: "thumb-great-red-spot", component: GreatRedSpot },
  { id: "thumb-cleopatra-pyramid", component: CleopatraPyramid },
  { id: "thumb-moai-reshaped", component: MoaiReshaped },
];
