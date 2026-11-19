import React from "react";
import { useCurrentFrame } from "remotion";
import { makeEdit } from "../../edit";
import { SANS, SERIF } from "../../fonts";
import type { Layout } from "../../layout";
import alignment from "../../generated/great-red-spot.alignment.json";
import { Starfield } from "../../scenes/space";
import { GRS, Planet, type Spot } from "./planet";
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
const INK = "#f4ecd8";
const DIM = "#a99f8a";
const GOLD = "#f1c74f";

const at = <T,>(L: Layout, v: T, w: T) => (L.vertical ? v : w);

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

const D = Math.PI / 180;
const glide = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// How far the camera has pushed in on the spot's latitude: 0 = whole disc, 1 = close.
const pushAt = (f: number) =>
  glide(ramp(f, 0, F.probably)) * (1 - glide(ramp(f, F.kept, F.kept + 40))) +
  0.85 * glide(ramp(f, F.drawings - 10, F.drawings + 40)) * (1 - glide(ramp(f, F.third - 24, F.third + 6))) +
  0.12 * glide(ramp(f, F.record, F.end));

const TITLE: React.CSSProperties = { fontFamily: SANS, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: INK };
const SUB: React.CSSProperties = { fontFamily: SERIF, fontStyle: "italic", color: DIM };
const SHADOW = "0 2px 10px rgba(0,0,0,0.95), 0 0 24px rgba(0,0,0,0.7)";

// A ring around something on the planet, with its label hung underneath: labels sit on what they name.
const Callout: React.FC<{ x: number; y: number; rx: number; ry: number; ring: number; o: number; title: string; sub?: string; subColor?: string; size?: number }> = ({ x, y, rx, ry, ring, o, title, sub, subColor = DIM, size = 34 }) =>
  o <= 0 ? null : (
    <>
      {ring > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: ring }}>
          <ellipse cx={x} cy={y} rx={rx + 16} ry={ry + 14} fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray="14 10" />
          <line x1={x} y1={y + ry + 14} x2={x} y2={y + ry + 44} stroke={GOLD} strokeWidth={4} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: x, top: y + ry + 50, translate: "-50% 0", textAlign: "center", whiteSpace: "pre", opacity: o, textShadow: SHADOW }}>
        <div style={{ ...TITLE, fontSize: size }}>{title}</div>
        {sub ? <div style={{ ...SUB, fontSize: size * 0.85, color: subColor, marginTop: 4 }}>{sub}</div> : null}
      </div>
    </>
  );

const Scene: React.FC<{ L: Layout }> = ({ L }) => {
  const f = useCurrentFrame();
  const v = L.vertical;
  const R: Rule = at(L, { x0: 560, x1: 1360, y: 910 }, { x0: 140, x1: 1780, y: 845 }); // 16:9: year labels clear of two-line captions
  const year = yearAt(f);

  // The planet and the camera on it.
  const base = at(L, { cx: 960, cy: 320, r: 350 }, { cx: 1260, cy: 410, r: 350 });
  const aim = at(L, { x: 960, y: 300 }, { x: 1260, y: 400 });
  const push = pushAt(f);
  const r = base.r * (1 + 0.6 * push);
  const cx = lerp(base.cx, aim.x, push);
  const cy = lerp(base.cy, aim.y + Math.sin(GRS.lat * D) * r, push);
  const lon0 = GRS.lon - 6 + f * 0.008;
  const onDisc = (lon: number, lat: number, len: number, h: number) => {
    const a = (lon - lon0) * D;
    const b = lat * D;
    return { x: cx + r * Math.cos(b) * Math.sin(a), y: cy - r * Math.sin(b), rx: r * Math.cos(b) * Math.cos(a) * Math.sin((len / 2) * D), ry: r * Math.cos(b) * Math.sin((h / 2) * D) };
  };

  // Beats.
  const blink = SIGHTINGS.some((s) => Math.abs(year - s) <= 1) ? 1 : 0.45;
  const ps = ramp(f, 4, 12) * (1 - ramp(f, F.then, F.then + 12)) * (f < F.kept ? 1 : blink);
  const hollow = ramp(f, F.drawings, F.drawings + 12) * (1 - ramp(f, F.third - 20, F.third));
  const compare = ramp(f, F.third - 10, F.third + 6) * (1 - ramp(f, F.record - 10, F.record));
  const grow = glide(ramp(f, F.growing - 4, F.unseen + 10));
  const cross = ramp(f, F.grow - 4, F.grow + 6) * (1 - ramp(f, F.record - 10, F.record));
  const today = ramp(f, F.record - 6, F.record + 14);
  const out = (a: number, b: number) => ramp(f, a, a + 8) * (1 - ramp(f, b - 8, b));

  const CASSINI = { lon: GRS.lon, lat: GRS.lat, len: 13, h: 7.5 };
  const HOLLOW = { lon: GRS.lon, lat: GRS.lat + 0.5, len: 24, h: 10 };
  const spots: Spot[] = [
    { ...CASSINI, rgb: [62, 44, 36], rim: [32, 22, 18], o: ps },
    // 1831: the Hollow only, a light bay in the belt's edge. Not red (A6).
    { ...HOLLOW, rgb: [236, 226, 208], rim: [150, 112, 78], o: hollow },
  ];
  const cs = onDisc(CASSINI.lon, CASSINI.lat, CASSINI.len, CASSINI.h);
  const hs = onDisc(HOLLOW.lon, HOLLOW.lat, HOLLOW.len, HOLLOW.h);
  const gs = onDisc(GRS.lon, GRS.lat, 19, 12);

  // The lengths panel: the two spots, to scale with each other only.
  const P = at(L, { x: 560, y: 30, w: 800 }, { x: 900, y: 70, w: 800 });
  const GL = 0.9 * P.w;
  const x0 = P.x + (P.w - GL) / 2;
  const row1 = P.y + 150;
  const row2 = P.y + 500;
  const cassL = GL * (0.42 + 0.58 * grow);
  const label = (o: number, x: number, y: number, title: string, sub?: string, color = INK, right = false) =>
    o <= 0 ? null : (
      <div style={{ position: "absolute", left: x, top: y, opacity: o, textShadow: SHADOW, whiteSpace: "pre", translate: right ? "-100% 0" : undefined, textAlign: right ? "right" : "left" }}>
        <div style={{ ...TITLE, fontSize: 30, color }}>{title}</div>
        {sub ? <div style={{ ...SUB, fontSize: 28, marginTop: 2 }}>{sub}</div> : null}
      </div>
    );

  const gapX = (yx(R, 1713) + yx(R, 1831)) / 2;
  const gapO = ramp(f, F.hundred, F.hundred + 10) * (1 - ramp(f, F.third - 10, F.third));

  return (
    <>
      <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: "#04050b" }} />
      <Starfield drift={0.05} />
      <Planet cx={cx} cy={cy} r={r} res={L.zoom * 1.05} lon={lon0} today={today} spots={spots} dim={0.72 * compare} />
      <div style={{ position: "absolute", ...(v ? { left: 1395, top: -196 } : { left: 1900, top: 16 }), translate: "-100% 0", fontFamily: SERIF, fontStyle: "italic", fontSize: 22, color: DIM, opacity: 0.75, whiteSpace: "pre" }}>
        Illustration · clouds from NASA/JPL/SSI Cassini map
      </div>
      <Timeline R={R} f={f} year={year} />

      {/* The year the playhead is on: the one number to track. */}
      <div style={{ position: "absolute", ...(v ? { left: 1360, top: 650, translate: "-100% 0" } : { left: 140, top: 560 }), fontFamily: SANS, fontWeight: 800, fontSize: v ? 120 : 140, color: GOLD, opacity: 1 - ramp(f, F.record - 8, F.record + 6), textShadow: "0 4px 18px rgba(0,0,0,0.9)", fontVariantNumeric: "tabular-nums" }}>
        {year}
      </div>

      {/* 1. Hook, then the sightings: one label on the oval, rewritten as the story moves. */}
      <Callout {...cs} ring={ps > 0 ? out(4, F.then) : 0} o={out(4, F.kept)} title="1665 · Cassini" sub={f < F.probably ? "a dark oval at this latitude" : "probably not the Great Red Spot"} subColor={f < F.probably ? DIM : GOLD} />
      <Callout {...cs} ring={0} o={out(F.kept, F.then + 4)} title="Reported until 1713" sub="Cassini, Maraldi and others" />
      {/* 2. The gap, named where it is on the timeline. */}
      {gapO > 0 ? (
        <div style={{ position: "absolute", left: gapX, top: R.y - 150, translate: "-50% 0", textAlign: "center", opacity: gapO, textShadow: SHADOW }}>
          <div style={{ ...TITLE, fontSize: 32, color: "#ff9b84" }}>118 years</div>
          <div style={{ ...SUB, fontSize: 26 }}>no reports</div>
        </div>
      ) : null}
      {/* 3. The Hollow. */}
      <Callout {...hs} ring={out(F.drawings + 6, F.third - 12)} o={out(F.drawings + 6, F.third - 12)} title="1831 · The Hollow" sub={"first drawings of today's storm\nnot yet red: that came ~1872–76"} size={30} />

      {/* 4. Lengths, then the growth nobody saw. */}
      {compare > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: compare }}>
          <defs>
            <radialGradient id="ps" cx="45%" cy="40%" r="65%">
              <stop offset="0" stopColor="#5a4234" />
              <stop offset="1" stopColor="#24180f" />
            </radialGradient>
            <radialGradient id="grs" cx="45%" cy="40%" r="65%">
              <stop offset="0" stopColor="#e07a58" />
              <stop offset="1" stopColor="#8f3522" />
            </radialGradient>
            <filter id="soft">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>
          <rect x={P.x - 20} y={P.y} width={P.w + 40} height={640} rx={24} fill="rgba(6,8,18,0.6)" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
          {[x0, x0 + GL].map((x) => (
            <line key={x} x1={x} y1={row1 - 70} x2={x} y2={row2 + 70} stroke={DIM} strokeWidth={2} strokeDasharray="6 8" opacity={0.7} />
          ))}
          <ellipse cx={x0 + cassL / 2} cy={row1} rx={cassL / 2} ry={48} fill="url(#ps)" filter="url(#soft)" />
          {grow > 0 ? <ellipse cx={x0 + (GL * 0.42) / 2} cy={row1} rx={(GL * 0.42) / 2} ry={48} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="10 8" opacity={0.8} /> : null}
          {/* The paper's range, a third to a half; the drawn oval sits inside it. */}
          <g opacity={1 - ramp(f, F.growing - 14, F.growing - 4)}>
            <line x1={x0 + GL / 3} y1={row1 + 72} x2={x0 + GL / 2} y2={row1 + 72} stroke={GOLD} strokeWidth={8} strokeLinecap="round" />
          </g>
          <ellipse cx={x0 + GL / 2} cy={row2} rx={GL / 2} ry={70} fill="url(#grs)" filter="url(#soft)" />
          {cross > 0 ? (
            <g stroke={RED} strokeWidth={18} strokeLinecap="round" opacity={cross} transform={`translate(${x0 + cassL * 0.7} ${row1}) scale(${0.8 + 0.2 * ease(cross)})`}>
              <line x1={-90} y1={-90} x2={90} y2={90} />
              <line x1={90} y1={-90} x2={-90} y2={90} />
            </g>
          ) : null}
        </svg>
      ) : null}
      {label(compare, x0, row1 - 112, "1665 · Cassini's spot")}
      {label(compare * (1 - ramp(f, F.growing - 14, F.growing - 4)), x0 + GL / 3, row1 + 86, "⅓ to ½ the length", undefined, GOLD)}
      {label(compare * ramp(f, F.growing - 2, F.growing + 8) * (1 - cross), x0, row1 + 86, "+160 km a year?", "for 166 years, 1713–1879, unseen")}
      {label(compare * cross, x0, row1 + 86, "Never seen", "in any storm on Jupiter", "#ff9b84")}
      {label(compare, x0, row2 - 120, "1879 · Great Red Spot", undefined, "#ff9b84")}
      {label(compare, x0 + GL, row2 + 84, "", "lengths to scale with each other", INK, true)}

      {/* 5. The two records. */}
      <Callout {...gs} ring={out(F.record + 6, F.end + 20)} o={out(F.record + 6, F.end + 20)} title="The Great Red Spot" />
      <Note {...at(L, { x: yx(R, 1665) - 6, y: R.y - 132 }, { x: yx(R, 1665), y: R.y - 132 })} text={f >= F.gone ? "Cassini's spot · gone" : "Cassini's spot"} o={ramp(f, F.record, F.record + 10)} size={30} color={DIM} />
      <Note {...at(L, { x: yx(R, 1831), y: R.y - 132 }, { x: yx(R, 1831), y: R.y - 132 })} text="Great Red Spot · 1831–today" o={ramp(f, F.record, F.record + 10)} size={30} color="#ff9b84" />
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
