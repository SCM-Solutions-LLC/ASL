import React from "react";
import { useCurrentFrame } from "remotion";
import { makeEdit } from "../../edit";
import { SANS } from "../../fonts";
import type { Layout } from "../../layout";
import alignment from "../../generated/cleopatra-pyramid.alignment.json";
import { clamp01, ease, ramp } from "../altar-stone/shots";
import { YEAR } from "../cleopatra-timeline";
import type { Short } from "../types";
import { Balance, Boat, Book, Counter, DARK, DIM, Disc, Fine, GOLD, INK, Jar, Label, Papyrus, Person, Phone, PhotoCard, Pyramid, RED, SHADOW, Vegetables, Waves } from "./draw";

// Format B: one cutaway that grows across the story (a shaft dug down through time, depth = years
// ago), counters, a real-photo reveal ("Not this": the pyramid today, stepped core showing), and a
// twist that turns the shaft upward into the future.
//
// The voice-over is Kokoro (`npm run tts -- cleopatra-pyramid`) from script/cleopatra-pyramid.txt,
// fact-checked in factcheck/cleopatra-pyramid.json. Every label and number on screen is a claim
// (A6): each one below names the SOURCES item it rests on.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["Great", "Pyramid"], ["Not", "this."], ["closer"], ["Moon"], ["polished"], ["Diodorus,"], ["girl."], ["still", "in", "place."],
    ["three", "hundred", "and", "sixty", "thousand"], ["twenty", "years"], ["inscription"], ["laxatives"], ["sixteen", "hundred", "talents."],
    ["2013,"], ["Red", "Sea,"], ["found", "papyri"], ["Khufu."], ["oldest"], ["logbook"], ["Merer's"], ["limestone"], ["seventeen", "kilometres"],
    ["buried"], ["four", "and", "a", "half", "thousand", "years."], ["ancient", "history."], ["work", "log"], ["you", "leave", "behind"], ["four", "thousand", "years"],
  ],
  // Short pages, one highlighted keyword each. "?" does not end a page on its own.
  breakAfter: ["closer", "landing", "building", "pyramid", "day?", "smooth,", "Diodorus,", "Egypt", "stones", "told", "men", "inscription", "workers'", "2013,", "harbour", "Sea,", "papyri", "king,", "logbook", "crew,", "limestone", "quarry", "away", "buried", "read", "log", "behind"],
  tail: 1.6,
});

const F = {
  not: edit.at("not"),
  cleo0: edit.at("cleopatra", 0), // "Cleopatra's" in line 1 cleans to a different word
  moon: edit.at("moon"),
  building: edit.at("building"),
  it: edit.at("it"),
  still: edit.at("still"),
  smooth: edit.at("smooth,"),
  polished: edit.at("polished"),
  casing: edit.at("casing."),
  greek: edit.at("greek"),
  diodorus: edit.at("diodorus,"),
  visited: edit.at("visited"),
  girl: edit.at("girl."),
  he0: edit.at("he", 0),
  stones: edit.at("stones"),
  place: edit.at("place."),
  he1: edit.at("he", 1),
  three: edit.at("three"),
  men: edit.at("men"),
  twenty: edit.at("twenty"),
  he2: edit.at("he", 2),
  inscription: edit.at("inscription"),
  vegetables: edit.at("vegetables"),
  laxatives: edit.at("laxatives"),
  sixteen: edit.at("sixteen"),
  then: edit.at("then,"),
  y2013: edit.at("2013,"),
  harbour: edit.at("harbour"),
  red: edit.at("red"),
  archaeologists: edit.at("archaeologists"),
  reign: edit.at("reign"),
  khufu: edit.at("khufu."),
  oldest: edit.at("oldest"),
  among: edit.at("among"),
  logbook: edit.at("logbook"),
  boat: edit.at("boat"),
  hauling: edit.at("hauling"),
  limestone: edit.at("limestone"),
  quarry: edit.at("quarry"),
  seventeen: edit.at("seventeen"),
  away: edit.at("away"),
  pyramid2: edit.at("pyramid", 1),
  they: edit.at("they"),
  buried: edit.at("buried"),
  four: edit.at("four"),
  years2: edit.at("years", 1), // at() ignores punctuation: #0 is "twenty years"
  cleo2: edit.at("cleopatra", 2),
  ancient2: edit.at("ancient", 1),
  we: edit.at("we"),
  read: edit.at("read"),
  build: edit.at("build"),
  so2: edit.at("what", 2), // the closing question starts
  leaving: edit.at("leave"),
  four2: edit.at("four", 1),
  now: edit.at("now?"),
  end: edit.duration,
};

const at = <T,>(L: Layout, v: T, w: T) => (L.vertical ? v : w);
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
// Astronomical year to a label: 1969, 69 BC.
const yearLabel = (y: number) => (y > 0 ? `${Math.round(y)}` : `${fmt(1 - y)} BC`);

// Shot windows, each fading over 8 frames at both ends.
const SHOTS = {
  // The hook opens on the real photo: it is on screen from the first frame.
  photo: [-10, F.it - 2],
  casing: [F.it - 6, F.cleo0 - 2],
  shaftA: [F.cleo0 - 6, F.greek - 2],
  diodorus: [F.greek - 6, F.he0 - 2],
  stones: [F.he0 - 6, F.he1 - 2],
  men: [F.he1 - 6, F.he2 - 2],
  inscription: [F.he2 - 6, F.then - 2],
  dig: [F.then - 6, F.harbour - 4],
  harbour: [F.harbour - 8, F.oldest - 2],
  oldest: [F.oldest - 6, F.among - 2],
  logbook: [F.among - 6, F.hauling - 4],
  boat: [F.hauling - 8, F.they - 2],
  shaftB: [F.they - 6, F.end + 10],
} as const;
type ShotId = keyof typeof SHOTS;
const vis = (f: number, id: ShotId) => {
  const [a, b] = SHOTS[id];
  return Math.min(clamp01((f - a) / 8), clamp01((b - f) / 8));
};

// The cutaway. Depth is years before today, drawn to one linear scale per format; the screen says
// "depth = time" so nobody reads it as a burial depth (A6).
const NOW = 2026;
type Shaft = { x0: number; x1: number; top: number; k: number; tag: number };
const shaftGeo = (L: Layout): Shaft => at(L, { x0: 700, x1: 930, top: 20, k: 860 / 4800, tag: 950 }, { x0: 760, x1: 990, top: 110, k: 780 / 4800, tag: 1010 });
const depth = (S: Shaft, astro: number) => S.top + (NOW - astro) * S.k;

const LAYERS = ["#5b4430", "#664c35", "#55402d", "#6a5038", "#5e4732", "#4f3c2a"];

const ShaftView: React.FC<{ L: Layout; f: number; o: number }> = ({ L, f, o }) => {
  if (o <= 0) return null;
  const S = shaftGeo(L);
  // Late story: the shaft slides down to make room for 4,000 years above today.
  const future = ease(ramp(f, F.so2, F.leaving + 12));
  const shift = future * 4000 * S.k;
  const y = (astro: number) => depth(S, astro) + shift;
  const bottom = S.top + 4800 * S.k + shift;
  const showA = f >= SHOTS.shaftA[0] - 10 && f < SHOTS.shaftA[1] + 10;
  const B = f >= SHOTS.shaftB[0];

  // Markers, each popping in on its spoken word. Dates: cleopatra-timeline SOURCES 1-5 (hook).
  const cleoY = y(YEAR.cleopatra);
  const moonY = y(YEAR.apollo);
  const pyrY = y(YEAR.pyramid);
  const markA = (w: number) => (showA ? ramp(f, w, w + 8) : 1);
  const mark = (yy: number, title: string, sub: string, t: number, hot = false, color = INK) =>
    t <= 0 ? null : (
      <>
        <div style={{ position: "absolute", left: S.x0 - 6, top: yy - 3, width: S.x1 - S.x0 + 12 + (S.tag - S.x1) - 10, height: 6, background: hot ? GOLD : INK, opacity: 0.85 * t, borderRadius: 3 }} />
        <Label x={S.tag} y={yy - (sub ? 34 : 22)} o={t} title={title} sub={sub} size={34} align="left" color={hot ? GOLD : color} />
      </>
    );

  // Brackets inside the shaft: Cleopatra to the Moon landing, Cleopatra to the pyramid.
  const bracket = (a: number, b: number, t: number, text: string, xOff: number, at = 0.5) => {
    if (t <= 0) return null;
    const x = S.x0 + xOff;
    const yb = a + (b - a) * ease(t);
    return (
      <>
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={x} y1={a} x2={x} y2={yb} stroke={GOLD} strokeWidth={6} strokeLinecap="round" />
          <line x1={x - 16} y1={a} x2={x + 16} y2={a} stroke={GOLD} strokeWidth={6} />
          {t >= 1 ? <line x1={x - 16} y1={b} x2={x + 16} y2={b} stroke={GOLD} strokeWidth={6} /> : null}
        </svg>
        <div style={{ position: "absolute", left: x + 22, top: a + (b - a) * at - 22, fontFamily: SANS, fontWeight: 900, fontSize: 36, color: GOLD, opacity: ramp(t, 0.6, 1), textShadow: SHADOW, whiteSpace: "pre" }}>{text}</div>
      </>
    );
  };

  // B: buried, ancient history, read today, then the future.
  const sand = ramp(f, F.buried - 4, F.years2 + 6);
  const ancient = ramp(f, F.cleo2 - 4, F.cleo2 + 8) * (1 - ramp(f, F.we - 6, F.we + 4));
  const rise = ease(ramp(f, F.read - 6, F.build + 6));
  const papY = pyrY - 40 - rise * (pyrY - 40 - (y(NOW) - 70));
  const papO = B ? ramp(f, SHOTS.shaftB[0], SHOTS.shaftB[0] + 8) : ramp(f, F.y2013 + 6, F.y2013 + 14);
  const dig = !B ? ease(ramp(f, F.then, F.y2013 + 10)) : 0;
  const todayY = y(NOW);

  // Ticks every thousand years, on the left wall.
  const ticks = [1000, 2000, 3000, 4000];

  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* Future layers above today, drawn only once the shaft slides down. */}
        {future > 0 ? <rect x={S.x0} y={todayY - shift} width={S.x1 - S.x0} height={shift} fill="#2c2433" opacity={future} /> : null}
        {LAYERS.map((c, i) => {
          const h = (4800 * S.k) / LAYERS.length;
          return <rect key={c + i} x={S.x0} y={todayY + i * h} width={S.x1 - S.x0} height={h + 1} fill={c} />;
        })}
        <rect x={S.x0} y={todayY} width={S.x1 - S.x0} height={bottom - todayY} fill="none" stroke="#2a1d12" strokeWidth={6} />
        {/* Sand settling over the papyri while "buried" is spoken. */}
        {sand > 0 ? <rect x={S.x0 + 3} y={pyrY - 60 * sand} width={S.x1 - S.x0 - 6} height={60 * sand} fill="#a88a5c" opacity={0.55 * (1 - rise)} /> : null}
        {/* The 2013 dig: a trench down from the surface. */}
        {dig > 0 ? <line x1={(S.x0 + S.x1) / 2} y1={todayY} x2={(S.x0 + S.x1) / 2} y2={todayY + (pyrY - 40 - todayY) * dig} stroke={GOLD} strokeWidth={8} strokeDasharray="16 10" /> : null}
        {/* Surface. */}
        <rect x={S.x0 - 120} y={todayY - 8} width={S.x1 - S.x0 + 240} height={10} rx={5} fill="#c9a26a" />
        {future > 0 ? <rect x={S.x0 - 120} y={todayY - shift - 8} width={S.x1 - S.x0 + 240} height={10} rx={5} fill="#c9a26a" opacity={future} /> : null}
        {ticks.map((t) => (
          <line key={t} x1={S.x0 - 14} y1={todayY + t * S.k} x2={S.x0} y2={todayY + t * S.k} stroke={DIM} strokeWidth={4} />
        ))}
      </svg>
      {ticks.map((t) => (
        <div key={t} style={{ position: "absolute", left: S.x0 - 22, top: todayY + t * S.k - 16, translate: "-100% 0", fontFamily: SANS, fontWeight: 700, fontSize: 26, color: DIM, whiteSpace: "pre", textShadow: SHADOW }}>
          {`${fmt(t)} yrs`}
        </div>
      ))}
      <Label x={S.x0 - 22} y={todayY - 70} o={1 - future} title="Today" size={30} align="right" color={INK} />
      <Fine x={S.x0 - 22} y={todayY + 4800 * S.k - 40} o={1} text={"depth = time\nyears ago"} align="right" />

      {/* A: the hook. Three dates on one scale; the brackets carry the two spans. */}
      {showA ? mark(moonY, "1969", "Moon landing", markA(F.moon), false) : null}
      {mark(cleoY, "69 BC", "Cleopatra born", markA(F.cleo0 - 6), showA || ancient > 0)}
      {mark(pyrY, "c. 2600 BC", B ? "pyramid built · Merer's papyri" : "Great Pyramid built", markA(F.building), false)}
      {showA ? bracket(cleoY, moonY, ramp(f, F.moon, F.moon + 14), "2,037 yrs", 60) : null}
      {showA ? bracket(cleoY, pyrY, ramp(f, F.building - 4, F.building + 16), "2,531 yrs", 60) : null}

      {/* The dig and the papyri at the bottom. SOURCES 6 and 8. */}
      {!B && dig > 0 ? <Label x={S.tag} y={todayY + 18} o={ramp(f, F.y2013, F.y2013 + 8)} title="2013 · dig" size={30} align="left" color={GOLD} /> : null}
      <Papyrus x={(S.x0 + S.x1) / 2 - 70} y={papY - 40} w={140} h={80} o={papO} rot={-6} />
      {B ? bracket(todayY, pyrY - 40, sand * (1 - ancient) * (1 - rise), "~4,500 yrs\nburied", 30, 0.75) : null}
      {B && ancient > 0 ? bracket(cleoY, pyrY, ancient, "2,531 yrs", 60) : null}
      {B ? <Label x={S.tag} y={cleoY + 70} o={ancient} title="To her:" sub="already ancient history" size={30} align="left" color={GOLD} /> : null}
      {B ? <Label x={S.tag} y={todayY + 18} o={ramp(f, F.read, F.read + 8) * (1 - ramp(f, F.so2 - 8, F.so2))} title="We can read it" sub="the crew's work log" size={30} align="left" color={GOLD} /> : null}

      {/* The twist: today becomes a layer, 4,000 years down from someone else's surface. */}
      {future > 0 ? (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: ramp(f, F.leaving, F.leaving + 10) }}>
            <Phone x={S.x0 + 50} y={todayY + 34} s={0.6} rot={-20} />
            <Disc x={S.x0 + 120} y={todayY + 38} s={0.55} />
            <Book x={S.x0 + 185} y={todayY + 36} s={0.6} rot={12} />
          </svg>
          <Label x={S.tag} y={todayY - 30} o={future} title="Us · today" sub="what would you leave?" size={30} align="left" color={GOLD} />
          {bracket(todayY - shift, todayY, ramp(f, F.four2, F.now + 8), "?", 60)}
        </>
      ) : null}
      {/* The year playhead during the hook. */}
      {showA ? (
        <div style={{ position: "absolute", left: S.x0 - 30, top: hookPlayhead(f, S) - 3, width: S.x1 - S.x0 + 60, height: 6, background: GOLD, opacity: 0.9, boxShadow: "0 0 14px rgba(241,199,79,0.8)" }} />
      ) : null}
    </div>
  );
};

// During the hook the playhead visits each date as it is spoken: Cleopatra, the Moon, the pyramid.
const hookYear = (f: number) => {
  const keys: [number, number][] = [
    [F.cleo0, YEAR.cleopatra],
    [F.moon - 4, YEAR.cleopatra],
    [F.moon + 10, YEAR.apollo],
    [F.building - 6, YEAR.apollo],
    [F.building + 12, YEAR.pyramid],
  ];
  const i = keys.findIndex(([k]) => k > f);
  if (i === 0) return keys[0][1];
  if (i < 0) return keys[keys.length - 1][1];
  const [a, ya] = keys[i - 1];
  const [b, yb] = keys[i];
  return ya + (yb - ya) * ease(clamp01((f - a) / (b - a)));
};
const hookPlayhead = (f: number, S: Shaft) => depth(S, hookYear(f));

// Counters: one big number per beat, each the number being spoken (A6: on screen while it is said).
const counterAt = (f: number): { value: string; unit?: string; o: number } | null => {
  const win = (a: number, b: number) => Math.min(clamp01((f - a) / 6), clamp01((b - f) / 6));
  if (f >= SHOTS.shaftA[0] && f < SHOTS.shaftA[1]) {
    // Only the date being spoken, never a year the playhead is passing through.
    const label = f >= F.building - 2 ? "c. 2600 BC" : f >= F.moon - 4 ? yearLabel(YEAR.apollo) : yearLabel(YEAR.cleopatra);
    return { value: label, o: win(SHOTS.shaftA[0], SHOTS.shaftA[1]) };
  }
  if (f >= SHOTS.diodorus[0] && f < SHOTS.diodorus[1]) return { value: "60–56 BC", unit: "Diodorus in Egypt", o: win(SHOTS.diodorus[0], SHOTS.diodorus[1]) };
  if (f >= F.three && f < F.twenty - 2) {
    return { value: "360,000", unit: "men · as he was told", o: win(F.three, F.twenty - 2) };
  }
  if (f >= F.twenty && f < SHOTS.men[1]) return { value: "20", unit: "years", o: win(F.twenty, SHOTS.men[1]) };
  if (f >= F.sixteen && f < SHOTS.inscription[1]) {
    return { value: "1,600+", unit: "talents", o: win(F.sixteen, SHOTS.inscription[1]) };
  }
  if (f >= F.y2013 && f < SHOTS.harbour[1]) return { value: "2013", o: win(F.y2013, SHOTS.harbour[1]) };
  if (f >= F.seventeen && f < SHOTS.boat[1]) return { value: "17 km", unit: "Tura quarry → Giza", o: win(F.seventeen, SHOTS.boat[1]) };
  if (f >= F.four && f < F.cleo2 - 2) return { value: "~4,500", unit: "years buried", o: win(F.four, F.cleo2 - 2) };
  if (f >= F.four2) return { value: "+4,000", unit: "years from now", o: win(F.four2, F.end + 30) };
  return null;
};

const Stamp: React.FC<{ x: number; y: number; t: number; text: string }> = ({ x, y, t, text }) =>
  t <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: "-50% -50%",
        rotate: "-8deg",
        scale: `${1.6 - 0.6 * ease(t)}`,
        opacity: clamp01(t * 2),
        border: `10px solid ${RED}`,
        borderRadius: 18,
        padding: "6px 30px 10px",
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: 110,
        letterSpacing: "0.06em",
        color: RED,
        background: "rgba(20,10,6,0.35)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );

const Scene: React.FC<{ L: Layout }> = ({ L }) => {
  const f = useCurrentFrame();
  const v = L.vertical;
  const o = (id: ShotId) => vis(f, id);
  const cx = 960;
  const hud = at(L, { x: 960, y: -190 }, { x: 330, y: 110 });
  const c = counterAt(f);
  const shaftO = Math.max(o("shaftA"), o("dig"), o("shaftB"));

  // Shared stage for the drawn pyramid shots.
  const pyr = at(L, { x: cx, base: 820, w: 760 }, { x: cx, base: 880, w: 900 });

  return (
    <>
      <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: "radial-gradient(ellipse at 50% 40%, #3a2a3e 0%, #1e1624 55%, #120d16 100%)" }} />

      <ShaftView L={L} f={f} o={shaftO} />

      {/* "Not this." The real photo: the pyramid today, casing gone, stepped core showing. */}
      {o("photo") > 0 ? (
        <>
          <PhotoCard src="img/kheops-pyramid.jpg" {...at(L, { x: 505, y: -215, w: 910, h: 1225 }, { x: -10, y: -10, w: 1940, h: 1100 })} o={o("photo")} zoom={1 + 0.08 * ramp(f, 0, F.it)} fx={0.5} fy={0.45} />
          <Label x={cx} y={at(L, -140, 60)} o={1 - ramp(f, F.not - 4, F.not + 2)} title="In Cleopatra's day?" size={v ? 64 : 56} color={GOLD} />
          <Stamp x={cx} y={at(L, 120, 170)} t={ramp(f, F.not, F.not + 8)} text="NOT THIS" />
          <Label x={cx} y={at(L, 860, 900)} o={o("photo") * ramp(f, F.not + 6, F.not + 14)} title="Today" sub="stepped core showing" size={44} />
          {/* CC BY 2.5 needs the credit on screen while the photo is; kept clear of the captions. */}
          <Fine x={at(L, 532, 20)} y={at(L, -200, 14)} o={o("photo")} text="Photo: Nina, Wikimedia Commons, CC BY 2.5" />
        </>
      ) : null}

      {/* "It still wore its smooth, polished outer casing." */}
      {o("casing") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o("casing") }}>
          <Pyramid x={pyr.x} base={pyr.base} w={pyr.w} casing={ramp(f, F.still, F.casing + 6)} sheen={-0.2 + 1.4 * ramp(f, F.polished, F.casing + 16)} />
          <Label x={cx} y={at(L, 40, 50)} o={ramp(f, F.smooth - 4, F.smooth + 6)} title="Outer casing" sub="smooth, polished stone" size={46} />
          <Label x={pyr.x} y={pyr.base - pyr.w * 0.62 - 64} o={1 - ramp(f, F.still, F.still + 10)} title="Stepped core" size={30} color={DIM} />
          <Fine x={cx} y={pyr.base + 30} o={1} text="illustration · in antiquity" align="center" />
        </div>
      ) : null}

      {/* "A Greek historian, Diodorus, visited Egypt when Cleopatra was a girl." SOURCES 4. */}
      {o("diodorus") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o("diodorus") }}>
          <DiodorusCard L={L} f={f} />
        </div>
      ) : null}

      {/* "He wrote that its stones were still in place." SOURCES 3-4 (Diodorus 1.63.5). */}
      {o("stones") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o("stones") }}>
          <Pyramid x={pyr.x} base={pyr.base} w={pyr.w} casing={1} sheen={-0.2 + 1.4 * ramp(f, F.place - 6, F.place + 20)} />
          <Label x={cx} y={at(L, 40, 50)} o={ramp(f, F.stones - 4, F.stones + 6)} title="Diodorus:" sub="its stones still in place" size={46} />
          <div style={{ position: "absolute", left: pyr.x, top: pyr.base - pyr.w * 0.3, translate: "-50% -50%", fontSize: 160, color: "#7fd18b", fontFamily: SANS, fontWeight: 900, scale: `${ease(ramp(f, F.place - 4, F.place + 6))}`, textShadow: SHADOW }}>✓</div>
          <Fine x={cx} y={pyr.base + 30} o={1} text="illustration" align="center" />
        </div>
      ) : null}

      {/* "He was told three hundred and sixty thousand men spent twenty years building it." SOURCES 5. */}
      {o("men") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o("men") }}>
          <Workforce L={L} f={f} />
        </div>
      ) : null}

      {/* The inscription, the vegetables and laxatives, the 1,600 talents. SOURCES 5 (Diodorus 1.64.3). */}
      {o("inscription") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o("inscription") }}>
          <Inscription L={L} f={f} />
        </div>
      ) : null}

      {/* The 2013 harbour on the Red Sea. SOURCES 6. */}
      {o("harbour") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o("harbour") }}>
          <Harbour L={L} f={f} />
        </div>
      ) : null}

      {/* "The oldest papyri with writing ever found in Egypt." SOURCES 6. */}
      {o("oldest") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o("oldest") }}>
          <Papyrus x={cx - 300} y={at(L, 250, 260)} w={600} h={420} o={1} ink={ramp(f, F.oldest - 6, F.oldest + 30)} rot={-3} />
          <div style={{ position: "absolute", left: cx, top: at(L, 120, 140), translate: "-50% 0", padding: "8px 34px 12px", background: GOLD, borderRadius: 16, fontFamily: SANS, fontWeight: 900, fontSize: 80, letterSpacing: "0.06em", color: DARK, scale: `${ease(ramp(f, F.oldest, F.oldest + 8))}` }}>OLDEST</div>
          <Label x={cx} y={at(L, 720, 720)} o={ramp(f, F.oldest + 4, F.oldest + 14)} title="Papyri with writing" sub="ever found in Egypt (as of 2014)" size={42} />
          <Fine x={cx} y={at(L, 870, 860)} o={1} text="illustration" align="center" />
        </div>
      ) : null}

      {/* "Among them was the logbook of Merer's boat crew" SOURCES 7. */}
      {o("logbook") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o("logbook") }}>
          <Papyrus x={cx - 330} y={at(L, 230, 240)} w={660} h={440} o={1} grid ink={ramp(f, F.logbook - 8, F.boat + 10)} torn={false} />
          <Label x={cx} y={at(L, 40, 60)} o={ramp(f, F.logbook - 4, F.logbook + 6)} title="Merer's logbook" sub="his boat crew's daily work" size={46} />
          <Boat x={cx} y={at(L, 800, 780)} o={ramp(f, F.boat - 4, F.boat + 6)} s={0.6} bob={f / 8} dir={-1} />
          <Fine x={cx} y={at(L, 880, 870)} o={1} text="illustration" align="center" />
        </div>
      ) : null}

      {/* "hauling limestone from a quarry seventeen kilometres away to the pyramid." SOURCES 7. */}
      {o("boat") > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: o("boat") }}>
          <River L={L} f={f} />
        </div>
      ) : null}

      {/* The one number of the moment. */}
      {c ? <Counter x={hud.x} y={hud.y} o={c.o} value={c.value} unit={c.unit} size={v ? 120 : 110} /> : null}
    </>
  );
};

// Cleopatra born 69 BC; Diodorus in Egypt in the 180th Olympiad, 60/59-57/56 BC; she is about 9 to 13.
const DiodorusCard: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const v = L.vertical;
  const x0 = v ? 600 : 780;
  const x1 = v ? 1320 : 1480;
  const yr = (bc: number) => x0 + ((70 - bc) / 20) * (x1 - x0); // a ruler from 70 BC to 50 BC
  const y = v ? 520 : 520;
  const t1 = ramp(f, F.greek - 4, F.greek + 8);
  const t2 = ramp(f, F.visited - 4, F.visited + 8);
  const t3 = ramp(f, F.girl - 8, F.girl + 4);
  return (
    <>
      <Label x={960} y={v ? 60 : 60} o={t1} title="Diodorus" sub="Greek historian" size={50} />
      {/* A scroll for the historian. */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: t1 }}>
        <g transform={`translate(960 ${v ? 290 : 280}) scale(${0.8 + 0.2 * ease(t1)})`}>
          <rect x={-120} y={-60} width={240} height={120} fill="#e8d6aa" stroke="#9c7a45" strokeWidth={4} />
          <rect x={-150} y={-72} width={34} height={144} rx={16} fill="#b98e4f" />
          <rect x={116} y={-72} width={34} height={144} rx={16} fill="#b98e4f" />
          {[-30, 0, 30].map((yy) => (
            <path key={yy} d={`M-90 ${yy} q20 -8 40 0 t40 0 t40 0 t40 0`} stroke="#2b1a0e" strokeWidth={4} fill="none" opacity={0.7} />
          ))}
        </g>
      </svg>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: t2 }}>
        <line x1={x0} y1={y} x2={x1} y2={y} stroke={DIM} strokeWidth={6} strokeLinecap="round" />
        {[70, 65, 60, 55, 50].map((bc) => (
          <g key={bc}>
            <line x1={yr(bc)} y1={y - 12} x2={yr(bc)} y2={y + 12} stroke={DIM} strokeWidth={4} />
            <text x={yr(bc)} y={y + 50} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={28} fill={DIM}>{`${bc} BC`}</text>
          </g>
        ))}
        <rect x={yr(60)} y={y - 30} width={yr(56) - yr(60)} height={60} rx={10} fill="rgba(241,199,79,0.35)" stroke={GOLD} strokeWidth={4} />
        <circle cx={yr(69)} cy={y} r={16} fill={INK} />
      </svg>
      <Label x={yr(69)} y={y - 120} o={t2} title="69 BC" sub="Cleopatra born" size={30} align="left" />
      <Label x={yr(58)} y={y + 80} o={t2} title="In Egypt" sub="60–56 BC" size={30} />
      <Label x={960} y={v ? 760 : 780} o={t3} title="Cleopatra: age 9–13" size={44} color={GOLD} />
    </>
  );
};

// 360 figures, one per thousand men, filling as the number is spoken; then twenty years.
const Workforce: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const v = L.vertical;
  const cols = v ? 20 : 24;
  const rows = 360 / cols;
  const cell = v ? 38 : 30;
  const gx = v ? 960 : 1060; // 16:9: clear of the counter on the left
  const x0 = gx - (cols * cell) / 2 + cell / 2;
  const y0 = v ? 140 : 150;
  const fill = ease(ramp(f, F.three, F.men + 6));
  const n = Math.round(360 * fill);
  const yrs = Math.round(20 * ease(ramp(f, F.twenty, F.twenty + 12)));
  const yRow = y0 + rows * cell + 50;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {Array.from({ length: 360 }, (_, i) => (
          <Person key={i} x={x0 + (i % cols) * cell} y={y0 + Math.floor(i / cols) * cell} s={cell / 32} color={i < n ? "#e8c27a" : "rgba(244,236,216,0.12)"} />
        ))}
        {/* Twenty years: one mark per year. */}
        {Array.from({ length: 20 }, (_, i) => {
          const w = (v ? 760 : 900) / 20;
          const x = 960 - (20 * w) / 2 + i * w;
          return <rect key={i} x={x + 3} y={yRow} width={w - 6} height={40} rx={6} fill={i < yrs ? GOLD : "rgba(244,236,216,0.12)"} />;
        })}
      </svg>
      <Fine x={gx} y={y0 - 70} o={1} text="each figure = 1,000 men · as Diodorus was told" align="center" />
      <Label x={960} y={yRow + 56} o={ramp(f, F.twenty - 2, F.twenty + 8)} title="20 years" sub="one bar per year" size={34} />
    </>
  );
};

// An inscription (as Diodorus reported it), then what it listed, then the total.
const Inscription: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const v = L.vertical;
  const slab = ramp(f, F.he2 - 2, F.he2 + 8);
  const vegO = ramp(f, F.vegetables - 6, F.vegetables);
  const pops = [0, 1, 2].map((i) => ramp(f, F.vegetables + i * 4, F.vegetables + i * 4 + 8));
  const jar = ramp(f, F.laxatives - 2, F.laxatives + 8);
  const bal = ramp(f, F.sixteen - 6, F.sixteen + 4);
  const sy = v ? 60 : 40;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: slab }}>
        <rect x={960 - 260} y={sy} width={520} height={230} rx={10} fill="#bfa070" stroke="#6f5130" strokeWidth={6} />
        {[0, 1, 2, 3].map((r) => (
          <g key={r}>
            {Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={960 - 220 + i * 50} y={sy + 30 + r * 48} width={30 + ((i * 7 + r * 3) % 3) * 4} height={30} rx={r % 2 ? 15 : 4} fill="none" stroke="#5a3f22" strokeWidth={4} />
            ))}
          </g>
        ))}
      </svg>
      <Label x={960} y={sy + 240} o={slab} title="An inscription" sub="as Diodorus reported it" size={36} />
      <Vegetables x={v ? 900 : 860} y={v ? 560 : 560} o={vegO} pop={pops} />
      <Jar x={v ? 1250 : 1190} y={v ? 560 : 560} o={jar} s={jar} />
      <Label x={v ? 900 : 860} y={v ? 670 : 660} o={vegO} title="Vegetables" size={30} />
      <Label x={v ? 1250 : 1190} y={v ? 670 : 660} o={jar} title="Laxatives" size={30} />
      <Fine x={960} y={v ? 940 : 1030} o={slab} text="illustration" align="center" />
      <Balance x={v ? 960 : 1560} y={v ? 880 : 560} o={bal} tilt={-6 + 6 * ease(ramp(f, F.sixteen, F.sixteen + 18))} />
    </>
  );
};

// Wadi al-Jarf: the harbour, the sea, the papyri coming out of the sand.
const Harbour: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const v = L.vertical;
  const sea = ramp(f, F.red - 6, F.red + 4);
  const dig = ramp(f, F.archaeologists - 4, F.archaeologists + 20);
  const sandTop = v ? 520 : 500;
  const brushX = 960 - 150 + 300 * ((Math.sin(f / 4) + 1) / 2);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <rect x={-600} y={sandTop} width={3120} height={900} fill="#c9a26a" />
        {/* Stone jetty out into the water. */}
        <rect x={v ? 1080 : 1180} y={sandTop - 30} width={v ? 330 : 500} height={44} rx={6} fill="#8b7d6b" stroke="#5b4f42" strokeWidth={4} />
      </svg>
      <Waves x0={v ? 1060 : 1160} x1={2520} y={sandTop + 14} h={v ? 200 : 220} o={1} t={f} />
      <Label x={v ? 1240 : 1500} y={sandTop + 240} o={sea} title="Red Sea" size={40} color="#9fd3f2" />
      <Label x={960} y={v ? 60 : 50} o={ramp(f, F.harbour - 6, F.harbour + 4)} title="An ancient harbour" sub="Wadi al-Jarf" size={46} />
      {/* The papyri in the sand, swept clear. */}
      <Papyrus x={820} y={sandTop + 120} w={150} h={100} o={dig} rot={-8} ink={dig} />
      <Papyrus x={990} y={sandTop + 150} w={120} h={90} o={dig} rot={10} ink={dig} />
      <Papyrus x={890} y={sandTop + 250} w={170} h={90} o={dig} rot={3} ink={dig} />
      {dig > 0 && dig < 1 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`translate(${brushX} ${sandTop + 110}) rotate(-30)`}>
            <rect x={-8} y={-110} width={16} height={100} rx={6} fill="#7a4f2a" />
            <rect x={-24} y={-14} width={48} height={34} rx={6} fill="#3b2a1a" />
          </g>
        </svg>
      ) : null}
      <Label x={960} y={sandTop + 360} o={ramp(f, F.archaeologists + 6, F.archaeologists + 16)} title="Papyri" size={36} />
      {/* Khufu, in a cartouche-shaped frame with his name in our letters. */}
      <div style={{ position: "absolute", left: 960, top: v ? 300 : 260, translate: "-50% 0", padding: "10px 44px 14px", border: `6px solid ${GOLD}`, borderRadius: 60, background: "rgba(20,12,8,0.55)", opacity: ramp(f, F.reign - 4, F.reign + 6), scale: `${0.8 + 0.2 * ease(ramp(f, F.khufu - 4, F.khufu + 6))}`, textAlign: "center", textShadow: SHADOW }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 64, color: GOLD, letterSpacing: "0.08em" }}>KHUFU</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, color: INK, letterSpacing: "0.06em", textTransform: "uppercase" }}>from his reign</div>
      </div>
      <Fine x={960} y={v ? 900 : 1030} o={1} text="illustration" align="center" />
    </>
  );
};

// The river run: Tura quarry on the east bank (right), Giza on the west (left). Not to scale.
const River: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const v = L.vertical;
  const xW = v ? 700 : 560; // Giza
  const xE = v ? 1180 : 1560; // Tura
  const ry = v ? 560 : 520;
  const t = ease(ramp(f, F.hauling, F.pyramid2 + 6));
  const bx = xE - 120 - t * (xE - xW - 240);
  return (
    <>
      <Waves x0={-600} x1={2520} y={ry - 70} h={160} o={1} t={f} color="#3a6f8f" />
      {/* Tura: a cliff with blocks cut out of it. */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: ramp(f, F.quarry - 6, F.quarry + 4) }}>
        <path d={`M${xE - 60} ${ry - 80} L${xE - 20} ${ry - 260} L${xE + 200} ${ry - 300} L${xE + 200} ${ry - 80} Z`} fill="#d8c8a0" stroke="#8b7a56" strokeWidth={4} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={xE - 4 + i * 54} y={ry - 210 + (i % 2) * 40} width={44} height={36} fill="#b7a67f" stroke="#8b7a56" strokeWidth={3} />
        ))}
      </svg>
      <Label x={xE + 40} y={ry - 380} o={ramp(f, F.quarry - 4, F.quarry + 6)} title="Tura quarry" size={34} align="right" />
      {/* Giza: the pyramid going up. */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: ramp(f, F.hauling - 6, F.hauling + 4) }}>
        <path d={`M${xW - 140} ${ry - 80} L${xW} ${ry - 260} L${xW + 140} ${ry - 80} Z`} fill="#c9a26a" stroke="#6f5130" strokeWidth={4} />
      </svg>
      {/* 16:9: under the bank, clear of the counter in the top-left corner. */}
      <Label x={v ? xW - 40 : xW} y={v ? ry - 380 : ry + 100} o={ramp(f, F.pyramid2 - 6, F.pyramid2 + 4)} title="Giza" sub="the Great Pyramid" size={34} align={v ? "left" : "center"} />
      <Boat x={bx} y={ry + 20} o={1} s={0.75} bob={f / 7} dir={-1} />
      <Label x={bx} y={ry - 170} o={ramp(f, F.limestone - 4, F.limestone + 6) * (1 - ramp(f, F.pyramid2, F.pyramid2 + 8))} title="Limestone" size={30} color={GOLD} />
      <Fine x={960} y={ry + 140} o={1} text={"Nile and canals · not to scale\nillustration"} align="center" />
    </>
  );
};

export const cleopatraPyramid: Short = {
  slug: "cleopatra-pyramid",
  title: "What the Great Pyramid looked like in Cleopatra's day",
  edit,
  looks: [{ id: "Illustrated", Set: () => null, cast: () => [] }],
  props: (L) => <Scene L={L} />,
  music: "egypt",
  sfx: [
    { at: F.not, name: "thud", volume: 0.35 },
    { at: F.polished, name: "sparkle", volume: 0.3 },
    { at: F.three, name: "whoosh", volume: 0.2 },
    { at: F.sixteen, name: "pop", volume: 0.3 },
    { at: F.then, name: "dirt", volume: 0.3 },
    { at: F.oldest, name: "pop", volume: 0.3 },
    { at: F.hauling, name: "whoosh", volume: 0.2 },
    { at: F.buried, name: "dirt", volume: 0.3 },
    { at: F.so2, name: "rumble", volume: 0.3 },
  ],
};
