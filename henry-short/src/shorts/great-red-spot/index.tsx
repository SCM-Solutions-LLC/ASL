import React from "react";
import { useCurrentFrame } from "remotion";
import { makeEdit } from "../../edit";
import { SANS, SERIF } from "../../fonts";
import type { Layout } from "../../layout";
import alignment from "../../generated/great-red-spot.alignment.json";
import { Starfield, Tag as BaseTag } from "../../scenes/space";
import type { Short } from "../types";
import { clamp01, ease, ramp } from "../altar-stone/shots";

// One look, two things on screen: Jupiter, showing only what was on record in the year the playhead
// is at, and the observing timeline under it. Every beat changes one of the two.
//
// The voice-over is Kokoro (`npm run tts -- great-red-spot`) from script/great-red-spot.txt,
// fact-checked in factcheck/great-red-spot.json (Sánchez-Lavega et al. 2024, GRL). Visual rules from
// that SOURCES block (A6): the 1831 sign is the Hollow and is not drawn red (the oval turned reddish
// only in ~1872–76); no label calls Cassini's oval the Great Red Spot.
const edit = makeEdit({
  alignment,
  keyPhrases: [["probably", "not"], ["until", "1713."], ["a", "hundred", "and", "eighteen", "years,"], ["1831."], ["a", "third", "to", "a", "half"], ["unseen."], ["nearly", "two", "hundred", "years."], ["long", "gone."]],
  breakAfter: ["Jupiter.", "years,", "Spot", "long", "storm,", "Jupiter", "record", "storm,"],
});

const F = {
  cassini: edit.at("cassini"),
  oval: edit.at("oval"),
  probably: edit.at("probably"),
  kept: edit.at("kept"),
  y1713: edit.at("1713"),
  then: edit.at("then"),
  hundred: edit.at("hundred"),
  nobody: edit.at("nobody"),
  storm: edit.at("storm"),
  drawings: edit.at("drawings"),
  y1831: edit.at("1831"),
  third: edit.at("third"),
  y1879: edit.at("1879"),
  same: edit.at("same"),
  growing: edit.at("growing"),
  unseen: edit.at("unseen"),
  grow: edit.at("grow"),
  record: edit.at("record"),
  nearly: edit.at("nearly"),
  different: edit.at("different"),
  gone: edit.at("gone"),
  end: edit.duration,
};

// Every sighting of Cassini's spot the paper lists, 1665–1713 (1685–87 and 1690–91 are ranges).
const SIGHTINGS = [1665, 1667, 1672, 1677, 1685, 1686, 1687, 1690, 1691, 1694, 1708, 1713];
const NOW = 2026;

const RED = "#d8432c";
const SPOT = "#3b2a22";
const INK = "#f4ecd8";
const DIM = "#a99f8a";
const GOLD = "#f1c74f";

const at = <T,>(L: Layout, v: T, w: T) => (L.vertical ? v : w);
const Tag: typeof BaseTag = (p) => <BaseTag subSize={36} {...p} />;

// The year the playhead is on, beat by beat: it walks the sightings, sweeps the gap, and finishes on today.
const yearAt = (f: number) => {
  const keys: [number, number][] = [
    [F.cassini - 6, 1665],
    [F.kept, 1665],
    [F.y1713, 1713],
    [F.then, 1713],
    [F.nobody + 30, 1831],
    [F.third - 6, 1831],
    [F.y1879, 1879],
    [F.record - 6, 1879],
    [F.nearly + 20, NOW],
  ];
  const i = keys.findIndex(([k]) => k > f);
  if (i === 0) return keys[0][1];
  if (i < 0) return NOW;
  const [a, ya] = keys[i - 1];
  const [b, yb] = keys[i];
  return Math.round(ya + (yb - ya) * ease(clamp01((f - a) / (b - a))));
};

// Jupiter, drawn once. Features sit on the GRS latitude band; `x` is their offset from the centre
// meridian in units of the radius, so they slide slowly with the planet's turn.
type Feature = { x: number; len: number; h: number; fill: string; rim?: string; o: number; hollow?: boolean };

const BANDS: [number, number, string][] = [
  [-0.95, 0.3, "#c7a27a"],
  [-0.62, 0.12, "#8d6239"],
  [-0.48, 0.2, "#e2c6a0"],
  [-0.26, 0.22, "#a8774a"],
  [-0.02, 0.18, "#ead6b6"],
  [0.16, 0.2, "#93653b"], // South Equatorial Belt: the Hollow is cut into its southern edge.
  [0.36, 0.22, "#e8d2ae"], // the GRS latitude
  [0.58, 0.14, "#9a6d43"],
  [0.72, 0.4, "#c9a57d"],
];
const SPOT_Y = 0.47;

const Jupiter: React.FC<{ cx: number; cy: number; r: number; f: number; features: Feature[] }> = ({ cx, cy, r, f, features }) => {
  const turn = (f * 0.0016) % 2;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <clipPath id="disc">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id="shade" cx="38%" cy="32%" r="75%">
          <stop offset="0.55" stopColor="rgba(0,0,0,0)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.75)" />
        </radialGradient>
        <filter id="swirl">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.03" numOctaves={3} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={9} />
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={r + 26} fill="rgba(240,200,140,0.10)" />
      <g clipPath="url(#disc)">
        <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} fill="#d9b88f" />
        <g filter="url(#swirl)" transform={`translate(${-turn * 40} 0)`}>
          {BANDS.map(([y, h, c], i) => (
            <rect key={i} x={cx - r - 60} y={cy + y * r} width={2 * r + 260} height={h * r} fill={c} />
          ))}
        </g>
        {features.map((s, i) => {
          if (s.o <= 0) return null;
          const lon = s.x - turn * 0.05;
          const fx = cx + r * Math.sin(lon);
          const squash = Math.cos(lon);
          return (
            <g key={i} opacity={s.o}>
              {s.hollow ? <ellipse cx={fx} cy={cy + (SPOT_Y - 0.12) * r} rx={(s.len * r * squash) / 2 + 14} ry={s.h * r * 0.9} fill="#ead6b6" /> : null}
              <ellipse cx={fx} cy={cy + SPOT_Y * r} rx={(s.len * r * squash) / 2} ry={(s.h * r) / 2} fill={s.fill} stroke={s.rim ?? "none"} strokeWidth={s.rim ? 6 : 0} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={r} fill="url(#shade)" />
      </g>
    </svg>
  );
};

// The observing timeline. Years map linearly onto the ruler.
type Rule = { x0: number; x1: number; y: number };
const yx = (R: Rule, year: number) => R.x0 + ((year - 1650) / (NOW + 4 - 1650)) * (R.x1 - R.x0);

const Timeline: React.FC<{ R: Rule; f: number; year: number }> = ({ R, f, year }) => {
  const gap = ramp(f, F.then, F.then + 10) * (1 - ramp(f, F.record - 10, F.record));
  const gapW = ease(ramp(f, F.then, F.nobody + 30));
  const bars = ramp(f, F.record - 8, F.record + 6);
  const gone = ramp(f, F.gone - 4, F.gone + 8);
  const px = yx(R, year);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <line x1={R.x0} y1={R.y} x2={R.x1} y2={R.y} stroke={DIM} strokeWidth={5} />
      {[1700, 1800, 1900, 2000].map((y) => (
        <g key={y}>
          <line x1={yx(R, y)} y1={R.y - 14} x2={yx(R, y)} y2={R.y + 14} stroke={DIM} strokeWidth={4} />
          <text x={yx(R, y)} y={R.y + 58} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill={DIM}>
            {y}
          </text>
        </g>
      ))}
      {/* Each sighting pops in as the playhead reaches it. */}
      {SIGHTINGS.map((s) => {
        const o = year >= s && f >= F.cassini - 6 ? 1 : 0;
        return o ? <rect key={s} x={yx(R, s) - 4} y={R.y - 46} width={8} height={46} rx={3} fill={INK} opacity={1 - 0.6 * bars} /> : null;
      })}
      {gap > 0 ? (
        <g opacity={gap}>
          <rect x={yx(R, 1713)} y={R.y - 70} width={(yx(R, 1831) - yx(R, 1713)) * gapW} height={60} fill="rgba(216,67,44,0.18)" stroke={RED} strokeWidth={3} strokeDasharray="10 8" />
        </g>
      ) : null}
      {year >= 1831 && f < F.record ? <rect x={yx(R, 1831) - 5} y={R.y - 60} width={10} height={60} rx={3} fill={GOLD} /> : null}
      {year >= 1879 && f < F.record ? <rect x={yx(R, 1879) - 5} y={R.y - 60} width={10} height={60} rx={3} fill={RED} /> : null}
      {/* The close: two records, one that stops and one that has not. */}
      {bars > 0 ? (
        <g opacity={bars}>
          <rect x={yx(R, 1665)} y={R.y - 58} width={yx(R, 1713) - yx(R, 1665)} height={40} rx={8} fill={gone > 0 ? "#6b5d50" : "#8b7a66"} />
          <rect x={yx(R, 1831)} y={R.y - 58} width={(yx(R, NOW) - yx(R, 1831)) * ease(ramp(f, F.record, F.nearly + 20))} height={40} rx={8} fill={RED} />
        </g>
      ) : null}
      {/* Playhead. */}
      <line x1={px} y1={R.y - 96} x2={px} y2={R.y + 16} stroke={GOLD} strokeWidth={5} opacity={f >= F.cassini - 6 ? 1 - bars : 0} />
    </svg>
  );
};

const Note: React.FC<{ x: number; y: number; text: string; o: number; size?: number; color?: string; align?: "left" | "center" }> = ({ x, y, text, o, size = 34, color = INK, align = "left" }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, translate: align === "center" ? "-50% 0" : undefined, textAlign: align, fontFamily: SERIF, fontSize: size, color, opacity: o, whiteSpace: "pre", textShadow: "0 3px 12px rgba(0,0,0,0.95)" }}>{text}</div>
  );

const Scene: React.FC<{ L: Layout }> = ({ L }) => {
  const f = useCurrentFrame();
  const v = L.vertical;
  const J = at(L, { cx: 960, cy: 330, r: 330 }, { cx: 1260, cy: 420, r: 330 });
  const R: Rule = at(L, { x0: 560, x1: 1360, y: 880 }, { x0: 140, x1: 1780, y: 845 }); // 16:9: year labels clear of two-line captions
  const year = yearAt(f);

  // Cassini's spot: on while he and others kept reporting it, gone in the gap.
  const blink = SIGHTINGS.some((s) => Math.abs(year - s) <= 1) ? 1 : 0.55;
  // On from the first frames: the hook is the oval.
  const ps = ramp(f, 4, 14) * (1 - ramp(f, F.then, F.then + 12)) * (f < F.kept ? 1 : blink);
  // The size comparison and the growth that would have been needed.
  const compare = ramp(f, F.third - 6, F.third + 6) * (1 - ramp(f, F.record - 8, F.record));
  const grow = ease(ramp(f, F.growing - 4, F.unseen + 10));
  const hollow = ramp(f, F.drawings, F.drawings + 10) * (1 - compare);
  const today = ramp(f, F.record - 6, F.record + 6);
  const PSF = { len: 0.3, h: 0.11, fill: SPOT, rim: "#1a120d" };

  const features: Feature[] = [
    { x: -0.05, ...PSF, o: ps },
    // 1831: the Hollow only, the light bay in the belt's edge. Not red.
    { x: 0.05, len: 0.62, h: 0.16, fill: "#ead6b6", rim: "#8d6239", o: hollow, hollow: true },
    { x: 0.05, len: 0.62, h: 0.2, fill: "#c4553a", rim: "#7a2a1a", o: today, hollow: true },
  ];

  const lx = (fr: number) => J.cx + J.r * Math.sin(fr);
  const P = v ? { x: 600, y: 140, w: 720 } : { x: 900, y: 190, w: 720 };
  const cassW = P.w * (0.42 + 0.58 * grow);
  const bigYear = year;
  const cross = ramp(f, F.grow - 4, F.grow + 6) * (1 - ramp(f, F.record - 10, F.record));

  return (
    <>
      <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: "#04050b" }} />
      <Starfield drift={0.05} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - 0.8 * compare }}>
        <Jupiter cx={J.cx} cy={J.cy} r={J.r} f={f} features={features} />
      </div>
      <Timeline R={R} f={f} year={year} />

      {/* The year the playhead is on, large: the one number the viewer should track. */}
      {bigYear ? (
        <div style={{ position: "absolute", ...(v ? { left: 560, top: 690 } : { left: 140, top: 560 }), fontFamily: SANS, fontWeight: 700, fontSize: v ? 120 : 140, color: GOLD, opacity: 1 - ramp(f, F.record - 8, F.record + 6), textShadow: "0 4px 18px rgba(0,0,0,0.9)" }}>
          {bigYear}
        </div>
      ) : null}

      {/* 1. Hook. */}
      <Tag {...at(L, { x: 560, y: -180 }, { x: 140, y: 140 })} text="1665 · CASSINI" sub={"a dark oval at this latitude"} from={4} to={v ? F.probably : F.kept} />
      <Note x={lx(-0.05)} y={J.cy + SPOT_Y * J.r - (v ? 240 : 210)} text="?" o={ramp(f, F.probably, F.probably + 6) * (1 - ramp(f, F.kept, F.kept + 8))} size={200} color={GOLD} align="center" />
      {/* 9:16 has no room for two tags above the planet, so this one replaces the hook tag. */}
      <Tag {...at(L, { x: 560, y: -180 }, { x: 140, y: 280 })} text="PROBABLY NOT" sub={"the Great Red Spot"} from={F.probably} to={F.kept} />
      {/* 2–3. Sightings, then the gap. */}
      <Tag {...at(L, { x: 560, y: -180 }, { x: 140, y: 140 })} text="REPORTED UNTIL 1713" sub={"Cassini, Maraldi and others"} from={F.kept} to={F.then} />
      <Tag {...at(L, { x: 560, y: -180 }, { x: 140, y: 140 })} text="118 YEARS" sub={"no report of it\nin the surviving observations"} from={F.hundred} to={F.storm} />
      {/* 4. The Hollow. */}
      <Tag {...at(L, { x: 560, y: -180 }, { x: 140, y: 140 })} text="1831 · THE HOLLOW" sub={"first drawings of today's storm\n(not yet red: that came ~1872–76)"} from={F.drawings} to={F.third - 6} />
      {/* 5. Lengths. */}
      {compare > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g opacity={compare}>
            {[P.x, P.x + P.w].map((x) => (
              <line key={x} x1={x} y1={P.y - 70} x2={x} y2={P.y + 320} stroke={DIM} strokeWidth={3} strokeDasharray="8 8" />
            ))}
            <ellipse cx={P.x + cassW / 2} cy={P.y} rx={cassW / 2} ry={52} fill={SPOT} stroke="#000" strokeWidth={4} />
            {grow > 0 ? <ellipse cx={P.x + (P.w * 0.42) / 2} cy={P.y} rx={(P.w * 0.42) / 2} ry={52} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="10 8" /> : null}
            {/* The paper's range, a third to a half; the drawn oval sits inside it. */}
            <rect x={P.x + P.w / 3} y={P.y + 66} width={P.w / 6} height={12} rx={6} fill={GOLD} opacity={1 - grow} />
            <ellipse cx={P.x + P.w / 2} cy={P.y + 240} rx={P.w / 2} ry={74} fill="#c4553a" stroke="#7a2a1a" strokeWidth={6} />
          </g>
        </svg>
      ) : null}
      <Note x={P.x} y={P.y - 118} text="Cassini's spot, 1665" o={compare} size={40} />
      <Note x={P.x + P.w / 3} y={P.y + 84} text="⅓ to ½" o={compare * (1 - grow)} size={32} color={GOLD} />
      <Note x={P.x} y={P.y + 330} text="Great Red Spot, 1879" o={compare} size={40} color="#ff9b84" />
      <Tag {...at(L, { x: 560, y: -180 }, { x: 140, y: 140 })} text="⅓ TO ½ AS LONG" sub={"lengths to scale with each other\nSánchez-Lavega et al. 2024"} from={F.third} to={F.growing - 4} />
      {/* 6. The growth nobody saw. */}
      <Tag {...at(L, { x: 560, y: -180 }, { x: 140, y: 140 })} text="+160 KM A YEAR?" sub={"for 166 years, 1713–1879,\nwith no one seeing it"} from={F.growing} to={F.record - 6} />
      {/* The X sits on the grown part of the oval, clear of its label. */}
      {cross > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g stroke={RED} strokeWidth={22} strokeLinecap="round" opacity={cross} transform={`translate(${P.x + cassW * 0.7} ${P.y}) scale(${0.8 + 0.2 * ease(cross)})`}>
            <line x1={-120} y1={-120} x2={120} y2={120} />
            <line x1={120} y1={-120} x2={-120} y2={120} />
          </g>
        </svg>
      ) : null}
      <Tag {...at(L, { x: 560, y: 520 }, { x: 140, y: 330 })} text="NEVER SEEN" sub={"in any storm on Jupiter"} from={F.grow} to={F.record - 6} />
      {/* 7. The two records. */}
      <Note {...at(L, { x: yx(R, 1665) - 6, y: R.y - 132 }, { x: yx(R, 1665), y: R.y - 132 })} text={f >= F.gone ? "Cassini's spot · gone" : "Cassini's spot"} o={ramp(f, F.record, F.record + 10)} size={34} color={DIM} />
      <Note {...at(L, { x: yx(R, 1831), y: R.y - 132 }, { x: yx(R, 1831), y: R.y - 132 })} text="Great Red Spot" o={ramp(f, F.record, F.record + 10)} size={34} color="#ff9b84" />
      <Tag {...at(L, { x: 560, y: -180 }, { x: 140, y: 140 })} text="ON RECORD SINCE 1831" sub={"nearly 200 years"} from={F.nearly} />
    </>
  );
};

export const greatRedSpot: Short = {
  slug: "great-red-spot",
  title: "Cassini's 1665 spot probably wasn't the Great Red Spot",
  edit,
  looks: [{ id: "Space", Set: () => null, cast: () => [] }],
  props: (L) => <Scene L={L} />,
  music: "space",
  sfx: [
    { at: F.probably, name: "thud", volume: 0.25 },
    { at: F.then, name: "whoosh", volume: 0.2 },
    { at: F.drawings, name: "pop", volume: 0.3 },
    { at: F.grow, name: "thud", volume: 0.25 },
  ],
};
