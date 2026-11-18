import React from "react";
import { Img, staticFile } from "remotion";
import { SERIF } from "../../fonts";
import type { Layout } from "../../layout";

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
export const ease = (t: number) => t * t * (3 - 2 * t);

// The opening photo. One geometry serves both crops: the stones sit at stage x 960, y 720, and the
// frame is wide and tall enough to cover the 9:16 slice and the full 16:9 set.
const PHOTO = { w: 2133, h: 1600, left: 960 - 0.485 * 2133, top: 720 - 0.82 * 1600 };

export const Photo: React.FC<{ t: number; glow: number }> = ({ t, glow }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "960px 720px", scale: `${1 + 0.12 * t}` }}>
    <div style={{ position: "absolute", left: -600, top: 900, width: 3120, height: 900, background: "#0a0605" }} />
    <Img src={staticFile("img/stonehenge-red-sky.jpg")} style={{ position: "absolute", left: PHOTO.left, top: PHOTO.top, width: PHOTO.w, height: PHOTO.h }} />
    {/* Warm bloom where the sun is about to clear the horizon (photo x 0.2, y 0.82). */}
    <div
      style={{
        position: "absolute",
        left: PHOTO.left + 0.2 * PHOTO.w - 700,
        top: 720 - 520,
        width: 1400,
        height: 1040,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,214,120,0.55) 0%, rgba(255,140,60,0.18) 40%, transparent 70%)",
        mixBlendMode: "screen",
        opacity: glow,
      }}
    />
  </div>
);

// CC BY 2.0 needs the credit on screen while the photo is (public/SOURCES.json).
export const Credit: React.FC<{ L: Layout; opacity: number }> = ({ L, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: L.vertical ? 532 : 20,
      top: L.vertical ? -196 : 14,
      fontFamily: SERIF,
      fontSize: L.vertical ? 22 : 24,
      color: "#f4ecd8",
      opacity: 0.8 * opacity,
      textShadow: "0 2px 8px rgba(0,0,0,0.9)",
    }}
  >
    Photo: Stonehenge Stone Circle (Flickr), CC BY 2.0
  </div>
);

// The real thing: Clarke 2024, Fig. 2 (Nature, CC BY 4.0), the Altar Stone's two thin sections with
// dated zircon, apatite and rutile grains. Cropped above the legend; credited on screen. The camera
// starts on both sections and closes on the 1,092 Ma zircon as the line says "tiny".
const FIG = { w: 692, h: 482, zx: 345 / 692, zy: 385 / 482 };
export const Grains: React.FC<{ L: Layout; t: number; zoom: number }> = ({ L, t, zoom }) => {
  const w = L.vertical ? 860 : 980;
  const h = (w * FIG.h) / FIG.w;
  // 16:9: right of centre, so the tag on the left clears the figure's MS3 label and scale bar.
  const left = L.vertical ? 960 - w / 2 : 700;
  const top = L.vertical ? 80 : 60;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
      <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: "#1b1b1b" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${left + FIG.zx * w}px ${top + FIG.zy * h}px`, scale: `${1 + 0.04 * t + 1.3 * zoom}` }}>
        <Img src={staticFile("img/altar-stone-thin-sections.jpg")} style={{ position: "absolute", left, top, width: w, height: h }} />
      </div>
    </div>
  );
};

// The sea leg: a boat that has not been found, drawn as a dashed outline with the slab aboard.
export const Boat: React.FC<{ f: number; ghost: number }> = ({ f, ghost }) => {
  const bob = Math.sin(f / 14) * 6;
  const tilt = Math.sin(f / 19) * 1.6;
  const waves = Array.from({ length: 9 }, (_, i) => {
    const y = 640 + i * 46;
    const pts = Array.from({ length: 50 }, (_, k) => {
      const x = -400 + k * 60;
      return `${x},${y + Math.sin(k * 0.7 + f / (10 + i) + i) * (5 + i * 1.5)}`;
    }).join(" ");
    return <polyline key={i} points={pts} fill="none" stroke="#7fa3b0" strokeWidth={2 + i * 0.3} opacity={0.12 + i * 0.03} />;
  });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
      <div style={{ position: "absolute", left: -500, top: -700, width: 2920, height: 1340, background: "linear-gradient(#0d1822 0%, #24394a 60%, #6d6a6a 100%)" }} />
      <div style={{ position: "absolute", left: -500, top: 640, width: 2920, height: 1200, background: "linear-gradient(#1c3542, #08141b)" }} />
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1920} height={1080}>
        {waves}
        <g transform={`translate(960 ${652 + bob}) rotate(${tilt})`} opacity={ghost}>
          {/* A sewn-plank hull shape, outline only: no such boat is known from the period. */}
          <path d="M-300,-30 C-250,40 250,40 300,-30" fill="none" stroke="#e8dcc0" strokeWidth={5} strokeDasharray="18 14" />
          <path d="M-300,-30 L300,-30" fill="none" stroke="#e8dcc0" strokeWidth={3} strokeDasharray="10 12" opacity={0.6} />
          <rect x={-171} y={-65} width={343} height={35} rx={3} fill="none" stroke="#f1c74f" strokeWidth={4} strokeDasharray="12 10" />
          <text x={0} y={-110} textAnchor="middle" fontFamily={SERIF} fontSize={120} fill="#e8dcc0" opacity={0.85}>
            ?
          </text>
        </g>
      </svg>
    </div>
  );
};

// The later study: a paper card with a lens moving over its text. Text bars, not text: the only words
// on the card are the journal and year, which are the source's own. No figure: the paper is not
// openly licensed, and a drawn stand-in would pass for its data (A6).
// Body text bars: two paragraphs, the last line of each short.
const BODY = [570, 540, 560, 500, 555, 530, 565, 310, 560, 545, 520, 565, 535, 380];
export const Study: React.FC<{ t: number; lens: number; L: Layout }> = ({ t, lens, L }) => {
  const cy = L.vertical ? 400 : 440;
  const lx = 960 - 120 + 240 * ease(lens);
  const ly = cy + 90 - 40 * ease(lens);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
      <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: "radial-gradient(circle at 50% 35%, #2a2119 0%, #0b0806 70%)" }} />
      <div
        style={{
          position: "absolute",
          left: 960 - 330,
          top: cy - 420,
          width: 660,
          height: 840,
          background: "#efe6d2",
          borderRadius: 8,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          rotate: `${-3 + t * 2}deg`,
          translate: `0 ${(1 - ease(Math.min(1, t * 3))) * 60}px`,
        }}
      >
        <div style={{ position: "absolute", left: 44, top: 40, fontFamily: SERIF, fontSize: 30, color: "#5a3a22", letterSpacing: 1 }}>Journal of the Geological Society</div>
        <div style={{ position: "absolute", left: 44, top: 82, fontFamily: SERIF, fontSize: 26, color: "#8a6a4a" }}>2026</div>
        {[150, 190, 230].map((y, i) => (
          <div key={y} style={{ position: "absolute", left: 44, top: y, width: [560, 520, 330][i], height: 20, borderRadius: 4, background: "#3d2b1e", opacity: 0.85 }} />
        ))}
        {BODY.map((w, i) => (
          <div key={i} style={{ position: "absolute", left: 44, top: 300 + i * 30 + (i > 7 ? 30 : 0), width: w, height: 10, borderRadius: 3, background: "#b8a88e" }} />
        ))}
      </div>
      {/* The lens: the same text bars, enlarged under the glass. */}
      <div style={{ position: "absolute", left: lx - 120, top: ly - 120, width: 240, height: 240, borderRadius: "50%", overflow: "hidden", border: "10px solid #1d1410", boxShadow: "0 12px 40px rgba(0,0,0,0.6)", opacity: clamp01(lens * 4) }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 240, height: 240, background: "#efe6d2" }}>
          {[22, 97, 172].map((y, i) => (
            <div key={y} style={{ position: "absolute", left: -40 - 60 * lens, top: y - 30 * lens, width: [420, 380, 400][i], height: 25, borderRadius: 7, background: "#b8a88e" }} />
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: lx + 70, top: ly + 70, width: 22, height: 120, background: "#1d1410", borderRadius: 8, rotate: "-45deg", transformOrigin: "top", opacity: clamp01(lens * 4) }} />
    </div>
  );
};

// A warm wash that sweeps across a cut, as film flares on a reel change.
export const LightLeak: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const t = (f - (at - 12)) / 26;
  if (t <= 0 || t >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: -600 + t * 2400 - 900,
        top: -700,
        width: 1800,
        height: 2600,
        background: "radial-gradient(ellipse at 50% 50%, rgba(255,200,120,0.95) 0%, rgba(255,120,60,0.55) 35%, transparent 70%)",
        mixBlendMode: "screen",
        opacity: Math.sin(Math.PI * t),
      }}
    />
  );
};

// Film grain for the illustrated shots: noise reseeded every other frame.
export const FilmGrain: React.FC<{ f: number; opacity: number }> = ({ f, opacity }) => (
  <svg style={{ position: "absolute", left: -500, top: -700, mixBlendMode: "overlay", opacity, pointerEvents: "none" }} width={2920} height={2600}>
    <filter id={`grain-${Math.floor(f / 2) % 12}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(f / 2) % 12} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#grain-${Math.floor(f / 2) % 12})`} />
  </svg>
);
