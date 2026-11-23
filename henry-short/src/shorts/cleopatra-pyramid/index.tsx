import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { makeEdit } from "../../edit";
import { SANS } from "../../fonts";
import type { Layout } from "../../layout";
import alignment from "../../generated/cleopatra-pyramid.alignment.json";
import world from "../../generated/cleopatra-world.anchors.json";
import { clamp01, ease, ramp } from "../altar-stone/shots";
import { YEAR } from "../cleopatra-timeline";
import type { Short } from "../types";
import { Counter, DIM, Fine, GOLD, INK, Label, RED, SHADOW } from "./draw";

// One continuous 3D world (tools/blender/cleopatra_world.py → public/3d/cleopatra-world.mp4): the
// real photo for the hook, then a single camera move through Giza, the Nile, Tura and the Red Sea
// harbour, and along a timeline paved on the desert floor (distance = years, seen from straight
// above when two spans are compared). Labels, counters and brackets are overlays that follow the
// 3D objects through src/generated/cleopatra-world.anchors.json, which Blender writes from the
// same camera.
//
// The voice-over is Kokoro (`npm run tts -- cleopatra-pyramid`) from script/cleopatra-pyramid.txt,
// fact-checked in factcheck/cleopatra-pyramid.json. Every label and number on screen is a claim
// (A6): review/cleopatra-pyramid.a6.md names the SOURCES item each rests on.
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["Great", "Pyramid"], ["Not", "this."], ["closer"], ["Moon"], ["polished"], ["Diodorus,"], ["girl."], ["still", "in", "place."],
    ["three", "hundred", "and", "sixty", "thousand"], ["twenty", "years"],
    ["2013,"], ["Red", "Sea,"], ["papyrus", "documents"], ["Khufu."], ["oldest"], ["logbook"], ["Merer."], ["limestone"], ["seventeen", "kilometres"],
    ["buried"], ["four", "and", "a", "half", "thousand", "years."], ["ancient", "history."], ["work", "log"], ["you", "leave", "behind"], ["four", "thousand", "years"],
  ],
  // Short pages, one highlighted keyword each. "?" does not end a page on its own.
  breakAfter: ["closer", "landing", "building", "pyramid", "day?", "smooth,", "Diodorus,", "Egypt", "stones", "told", "men", "2013,", "harbour", "Sea,", "documents", "papyri", "king,", "logbook", "Merer.", "limestone", "quarry", "away", "buried", "read", "log", "behind"],
  tail: 1.6,
});

const F = {
  not: edit.at("not"),
  cleo0: edit.at("cleopatra", 0), // "Cleopatra's" in line 1 cleans to a different word
  closer: edit.at("closer"),
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
  then: edit.at("then,"),
  y2013: edit.at("2013,"),
  harbour: edit.at("harbour"),
  red: edit.at("red"),
  archaeologists: edit.at("archaeologists"),
  found: edit.at("found"),
  reign: edit.at("reign"),
  khufu: edit.at("khufu."),
  oldest: edit.at("oldest"),
  among: edit.at("among"),
  logbook: edit.at("logbook"),
  boat: edit.at("boat"),
  his: edit.at("his"), // "His boat crew hauled limestone": the river shot starts here
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
  so2: edit.at("what", 1), // the closing question starts
  leaving: edit.at("leave"),
  four2: edit.at("four", 1),
  now: edit.at("now?"),
  end: edit.duration,
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
// Astronomical year to a label: 1969, 69 BC.
const yearLabel = (y: number) => (y > 0 ? `${Math.round(y)}` : `${fmt(1 - y)} BC`);
const win = (f: number, a: number, b: number, fade = 6) => Math.min(clamp01((f - a) / fade), clamp01((b - f) / fade));

// Where the 3D render sits in each format: full frame at 9:16; pillarboxed at 16:9 (the world is
// framed for the vertical short only). `s` scales overlay type with it.
type Box = { x: number; y: number; w: number; h: number; s: number };
const box = (L: Layout): Box => (L.vertical ? { x: 0, y: 0, w: 1080, h: 1920, s: 1 } : { x: 656, y: 0, w: 608, h: 1080, s: 608 / 1080 });

// A named 3D point on screen at frame f, or null when it is behind the camera or off the frame.
type Anchor = { f0: number; pts: number[][] };
const ANCHORS = world.anchors as Record<string, Anchor>;
const pt = (B: Box, name: string, f: number) => {
  const a = ANCHORS[name];
  const p = a.pts[Math.max(0, Math.min(a.pts.length - 1, Math.round(f) - a.f0))];
  const on = p[2] === 1 && p[0] > -0.05 && p[0] < 1.05 && p[1] > -0.05 && p[1] < 1.05;
  return on ? { x: B.x + p[0] * B.w, y: B.y + p[1] * B.h } : null;
};

// 16:9 fill: the 9:16 picture scaled to cover a 1920x1080 frame, centred.
const FILL: React.CSSProperties = { position: "absolute", left: 0, top: (1080 - (1920 * 16) / 9) / 2, width: 1920, height: (1920 * 16) / 9 };

// The photo covers the start; the render begins underneath it (frame `world.start`).
// Each cut in the 3D clip is softened into a dissolve this many frames either side of it. The
// main clip cuts DISSOLVE frames late, the "-b" clip DISSOLVE frames early (tools/blender/cleopatra_world.py).
const DISSOLVE = 7;
const CUTS = (world as { cuts?: number[] }).cuts ?? [];
const PHOTO_END = F.it - 2;

// No source read says how white the casing still was in Cleopatra's day (script SOURCES 2).
const ESTIMATE = "illustration · colour is an estimate";
// Her portrait holds from her name to just before "Moon landing", about 1.5 s.
const PORTRAIT_END = F.moon - 8;

// A label pinned to a 3D point, drawn above it with a short leader line.
const Pin: React.FC<{ B: Box; f: number; name: string; o: number; title: string; sub?: string; color?: string; lift?: number; dx?: number }> = ({ B, f, name, o, title, sub, color, lift = 90, dx = 0 }) => {
  const p = pt(B, name, f);
  if (!p || o <= 0) return null;
  const h = lift * B.s; // negative: the label hangs below the point
  const labelY = h >= 0 ? p.y - h - 50 * B.s * (sub ? 1.7 : 1) : p.y - h;
  return (
    <>
      <svg width={1920} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o }}>
        <line x1={p.x} y1={p.y} x2={p.x + dx * B.s} y2={p.y - h + (h >= 0 ? 8 : -6) * B.s} stroke={INK} strokeWidth={3 * B.s} />
        <circle cx={p.x} cy={p.y} r={7 * B.s} fill={GOLD} stroke="#1d1208" strokeWidth={2 * B.s} />
      </svg>
      <Label x={p.x + dx * B.s} y={labelY} o={o} title={title} sub={sub} size={40 * B.s} color={color} />
    </>
  );
};

// A bracket between two pinned points on the cut face, with its span written beside it.
const Bracket: React.FC<{ B: Box; f: number; a: string; b: string; o: number; text: string; sub?: string; side?: 1 | -1 }> = ({ B, f, a, b, o, text, sub, side = -1 }) => {
  const p = pt(B, a, f);
  const q = pt(B, b, f);
  if (!p || !q || o <= 0) return null;
  const x = Math.min(p.x, q.x) + side * 40 * B.s;
  const tick = 22 * B.s * -side;
  return (
    <>
      <svg width={1920} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o }}>
        <path d={`M${x + tick} ${p.y} H${x} V${q.y} H${x + tick}`} fill="none" stroke={GOLD} strokeWidth={5 * B.s} />
      </svg>
      <Label x={x + side * 16 * B.s} y={(p.y + q.y) / 2 - 30 * B.s} o={o} title={text} sub={sub} size={44 * B.s} color={GOLD} align={side < 0 ? "right" : "left"} />
    </>
  );
};

// The paved line is pale stone on pale sand: a drawn line over it keeps the scale readable.
const Track: React.FC<{ B: Box; f: number; a: string; b: string; o: number }> = ({ B, f, a, b, o }) => {
  const p = pt(B, a, f);
  const q = pt(B, b, f);
  if (!p || !q || o <= 0) return null;
  return (
    <svg width={1920} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o * 0.85 }}>
      <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={GOLD} strokeWidth={5 * B.s} strokeLinecap="round" />
    </svg>
  );
};

// The Berlin marble portrait of Cleopatra VII, a real photo (public/SOURCES.json). The whole head
// is shown, uncropped, over a blurred copy of itself: close enough to meet her, not so close that
// the frame is all face (owner, 2026-11-23).
const Portrait: React.FC<{ B: Box; o: number; zoom: number }> = ({ B, o, zoom }) => {
  if (o <= 0) return null;
  const w = B.w * 0.76;
  return (
    <div style={{ position: "absolute", left: B.x, top: B.y, width: B.w, height: B.h, overflow: "hidden", opacity: o, background: "#120d16" }}>
      <Img src={staticFile("img/cleopatra-berlin.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(36px) brightness(0.5)", scale: "1.15" }} />
      <Img
        src={staticFile("img/cleopatra-berlin.jpg")}
        style={{ position: "absolute", left: (B.w - w) / 2, top: B.h * 0.145, width: w, height: (w * 1523) / 1149, borderRadius: w * 0.02, boxShadow: "0 18px 60px rgba(0,0,0,0.6)", scale: `${1 + 0.03 * zoom}` }}
      />
    </div>
  );
};

const Stamp: React.FC<{ x: number; y: number; t: number; s: number; text: string }> = ({ x, y, t, s, text }) =>
  t <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: "-50% -50%",
        rotate: "-8deg",
        scale: `${(1.6 - 0.6 * ease(t)) * s}`,
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

// Counters: one big number per beat, each the number being spoken (A6: on screen while it is said).
const counterAt = (f: number): { value: string; unit?: string; o: number } | null => {
  if (f >= PORTRAIT_END && f < F.greek - 4) {
    // Only the date being spoken, never a year in between. It waits for the timeline: "69 BC" over
    // the figure at the casing would label that figure as Cleopatra (A5).
    const label = f >= F.building - 2 ? "c. 2600 BC" : f >= F.moon - 4 ? yearLabel(YEAR.apollo) : yearLabel(YEAR.cleopatra);
    return { value: label, o: win(f, PORTRAIT_END, F.greek - 4) };
  }
  if (f >= F.visited && f < F.he0 - 2) return { value: "60–56 BC", unit: "visited Egypt · sometime in these years", o: win(f, F.visited, F.he0 - 2) };
  if (f >= F.three && f < F.twenty - 2) return { value: "360,000", unit: "men · as he was told", o: win(f, F.three, F.twenty - 2) };
  if (f >= F.twenty && f < F.then - 2) return { value: "20", unit: "years", o: win(f, F.twenty, F.then - 2) };
  if (f >= F.y2013 && f < F.harbour + 20) return { value: "2013", o: win(f, F.y2013, F.harbour + 20) };
  if (f >= F.seventeen && f < F.they - 2) return { value: "~17 km", unit: "Tura quarry → Giza", o: win(f, F.seventeen, F.they - 2) };
  if (f >= F.four && f < F.cleo2 - 2) return { value: "~4,500", unit: "years buried", o: win(f, F.four, F.cleo2 - 2) };
  if (f >= F.four2) return { value: "+4,000", unit: "years from now", o: win(f, F.four2, F.end + 30) };
  return null;
};

const Overlay: React.FC<{ L: Layout }> = ({ L }) => {
  const f = useCurrentFrame();
  const B = box(L);
  const s = B.s;
  const cx = B.x + B.w / 2;
  const top = B.y + (L.vertical ? 150 : 40);
  const fine = B.y + B.h * (L.vertical ? 0.735 : 0.86); // small print sits just above the captions
  const photo = 1 - ramp(f, PHOTO_END - 8, PHOTO_END);
  const c = counterAt(f);
  const between = (a: number, b: number) => f >= a && f < b;
  const cut = CUTS.find((c) => Math.abs(f - c) <= DISSOLVE);
  const mix = cut === undefined ? 0 : clamp01((f - (cut - DISSOLVE)) / (2 * DISSOLVE));

  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "#120d16" }} />
      {/* 16:9 only: the sides of the vertical picture are filled with a blurred, darkened copy of it. */}
      {L.vertical ? null : (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{ ...FILL, filter: "blur(36px) brightness(0.5)" }}>
            <Sequence from={world.start} layout="none">
              <OffthreadVideo muted src={staticFile("3d/cleopatra-world.mp4")} style={{ width: "100%", height: "100%" }} />
            </Sequence>
            {photo > 0 ? <Img src={staticFile("img/kheops-pyramid.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 45%", opacity: photo }} /> : null}
          </div>
        </div>
      )}
      <Sequence from={world.start} layout="none">
        <OffthreadVideo muted src={staticFile("3d/cleopatra-world.mp4")} style={{ position: "absolute", left: B.x, top: B.y, width: B.w, height: B.h }} />
      </Sequence>
      {/* Cross-dissolves: around each cut a second clip holds the incoming shot, faded in over the
          outgoing one. Hard cuts read as choppy; flights between places as rushed (owner, 2026-11-23). */}
      {mix > 0 ? (
        <Sequence from={world.start} layout="none">
          <OffthreadVideo muted src={staticFile("3d/cleopatra-world-b.mp4")} style={{ position: "absolute", left: B.x, top: B.y, width: B.w, height: B.h, opacity: mix }} />
        </Sequence>
      ) : null}

      {/* "Not this." The real photo: the pyramid today, casing gone, stepped core showing. */}
      {photo > 0 ? (
        <div style={{ position: "absolute", left: B.x, top: B.y, width: B.w, height: B.h, overflow: "hidden", opacity: photo }}>
          <Img src={staticFile("img/kheops-pyramid.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 45%", scale: `${1 + 0.08 * ramp(f, 0, F.it)}` }} />
          <Label x={B.w / 2} y={L.vertical ? 170 : 60} o={1 - ramp(f, F.not - 4, F.not + 2)} title="In Cleopatra's day?" size={64 * s} color={GOLD} />
          <Stamp x={B.w / 2} y={B.h * 0.3} t={ramp(f, F.not, F.not + 8)} s={s} text="NOT THIS" />
          <Label x={B.w / 2} y={B.h * 0.62} o={ramp(f, F.not + 6, F.not + 14)} title="Today" sub="stepped core showing" size={44 * s} />
          {/* CC BY 2.5 needs the credit on screen while the photo is; kept clear of the captions. */}
          <Fine x={24 * s} y={B.h * 0.7} o={1} size={26 * s} text="Photo: Nina Aldin Thune, Wikimedia Commons, CC BY 2.5" />
        </div>
      ) : null}

      {/* Casing: wiped on top-down over the stepped core; one person at its foot for scale. */}
      {between(F.it - 8, F.cleo0) ? (
        <>
          <Label x={cx} y={top} o={win(f, F.smooth - 4, F.cleo0, 8)} title="Outer casing" sub="smooth, polished stone" size={50 * s} />
          <Pin B={B} f={f} name="casing" o={win(f, F.it - 4, F.still + 10)} title="Stepped core" color={DIM} />
          <Pin B={B} f={f} name="person" o={win(f, F.polished + 2, F.cleo0 - 5, 5)} title="One person" sub="for scale" lift={70} />
          <Fine x={cx} y={fine} o={win(f, F.it, F.cleo0)} size={26 * s} text="illustration · in antiquity · colour is an estimate" align="center" />
        </>
      ) : null}

      {/* The timeline from straight above: distance = years, one scale. Dates: cleopatra-timeline SOURCES 1-5. */}
      {between(F.cleo0 - 3, F.greek) ? (
        <>
          <Track B={B} f={f} a="tl_built" b="tl_found" o={win(f, F.closer, F.greek - 2)} />
          <Pin B={B} f={f} name="tl_cleo" o={win(f, F.closer, F.greek - 2)} title="69 BC" sub="Cleopatra born" lift={30} dx={-180} />
          <Pin B={B} f={f} name="tl_moon" o={win(f, F.moon, F.greek - 2)} title="1969" sub="Moon landing" lift={-24} dx={-180} />
          <Pin B={B} f={f} name="tl_built" o={win(f, F.building, F.greek - 2)} title="c. 2600 BC" sub="Great Pyramid built" lift={30} dx={-200} />
          <Bracket B={B} f={f} a="tl_moon" b="tl_cleo" o={win(f, F.moon + 8, F.greek - 2)} text="2,037 yrs" side={1} />
          <Bracket B={B} f={f} a="tl_cleo" b="tl_built" o={win(f, F.building + 8, F.greek - 2)} text="~2,500 yrs" side={1} />
          {/* Her portrait fills the frame while she is named; then the timeline. */}
          <Portrait B={B} o={win(f, F.cleo0 - 3, PORTRAIT_END + 4, 8)} zoom={ramp(f, F.cleo0 - 3, PORTRAIT_END)} />
          <Label x={cx} y={B.y + B.h * 0.05} o={win(f, F.cleo0, PORTRAIT_END, 8)} title="Cleopatra VII" sub="marble portrait, 1st century BC · Berlin" size={50 * s} />
          <Fine x={cx} y={fine} o={win(f, F.cleo0 - 3, PORTRAIT_END, 4)} size={26 * s} text="Photo: Louis le Grand, Wikimedia Commons, public domain" align="center" />
          <Fine x={cx} y={fine} o={win(f, PORTRAIT_END, F.greek)} size={26 * s} text="distance = time · one scale · colours are estimates · illustration" align="center" />
        </>
      ) : null}

      {/* Diodorus: only his hands, his pen and the page, by the Nile; no face (A5), and not at the
          pyramid (no source read puts him there). Then a cut to the casing, top to bottom. */}
      {between(F.greek, F.he1) ? (
        <>
          <Label x={cx} y={top + 190 * s} o={win(f, F.diodorus - 4, F.stones - 4)} title="Diodorus" sub="Greek historian" size={50 * s} />
          <Label x={cx} y={top + 340 * s} o={win(f, F.girl - 4, F.he0 - 2)} title="Cleopatra: about 9–13" size={44 * s} color={GOLD} />
          <Label x={cx} y={top + 230 * s} o={win(f, F.stones - 2, F.he1)} title="✓ Its stones still in place" sub="as Diodorus wrote" size={46 * s} color={GOLD} />
          <Fine x={cx} y={fine} o={win(f, F.greek, F.stones - 2, 3)} size={26 * s} text="illustration" align="center" />
          <Fine x={cx} y={fine} o={win(f, F.stones - 2, F.he1 + 3, 3)} size={26 * s} text={ESTIMATE} align="center" />
        </>
      ) : null}

      {/* The workforce Diodorus was told of: every one of the 360,000 figures is drawn. */}
      {between(F.he1, F.then) ? (
        <>
          <Fine x={cx} y={fine} o={win(f, F.he1, F.three + 4, 3)} size={26 * s} text={ESTIMATE} align="center" />
          <Fine x={cx} y={fine} o={win(f, F.three + 4, F.twenty, 3)} size={26 * s} text={"360,000 figures modelled · colour is an estimate · illustration"} align="center" />
          {/* From above the farmland, the river and the quarry cliff are in frame, far closer than they are. */}
          <Fine x={cx} y={fine} o={win(f, F.twenty, F.then + 2, 2)} size={26 * s} text={"360,000 figures modelled · colour is an estimate · landscape not to scale"} align="center" />
        </>
      ) : null}

      {/* The harbour and the papyri: Tallet & Marouard 2014. */}
      {between(F.then, F.among) ? (
        <>
          <Label x={cx} y={top + 160 * s} o={win(f, F.harbour - 2, F.found)} title="An ancient harbour" sub="Wadi al-Jarf" size={46 * s} />
          {/* Fixed on screen over the water: the camera flies on too fast for a pin to hold. */}
          <Label x={cx} y={B.y + B.h * 0.6} o={win(f, F.red - 2, F.found - 14, 8)} title="Red Sea" size={44 * s} />
          <Pin B={B} f={f} name="papyri" o={win(f, F.archaeologists + 6, F.oldest - 2)} title="Papyri" lift={80} />
          {/* Khufu, in a cartouche-shaped frame with his name in our letters. */}
          <div style={{ position: "absolute", left: cx, top: top + 120 * s, translate: "-50% 0", padding: `${10 * s}px ${44 * s}px ${14 * s}px`, border: `${6 * s}px solid ${GOLD}`, borderRadius: 60 * s, background: "rgba(20,12,8,0.55)", opacity: win(f, F.reign - 4, F.oldest - 2), scale: `${0.8 + 0.2 * ease(ramp(f, F.khufu - 4, F.khufu + 6))}`, textAlign: "center", textShadow: SHADOW }}>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 64 * s, color: GOLD, letterSpacing: "0.08em" }}>KHUFU</div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24 * s, color: INK, letterSpacing: "0.06em", textTransform: "uppercase" }}>from his reign</div>
          </div>
          <Label x={cx} y={top + 120 * s} o={win(f, F.oldest, F.among)} title="OLDEST" sub={"papyri with writing ever found in Egypt\n(as of 2014)"} size={70 * s} color={GOLD} />
          <Fine x={cx} y={fine} o={win(f, F.then, F.among)} size={26 * s} text="illustration · not to scale" align="center" />
        </>
      ) : null}

      {/* Merer's logbook (T&M 2014 pp. 8-10): ruled columns, squiggles for writing. */}
      {between(F.among - 8, F.his) ? (
        <>
          <Pin B={B} f={f} name="logbook" o={win(f, F.logbook - 2, F.his - 2)} title="Merer's logbook" sub={"his boat crew's daily work\nfound in fragments"} lift={90} />
          <Fine x={cx} y={fine} o={win(f, F.among, F.his)} size={26 * s} text="illustration" align="center" />
        </>
      ) : null}

      {/* The river run: Tura on the far (east) bank, Giza on the near one; ~17 km (Sheisha 2022). */}
      {between(F.his - 8, F.they) ? (
        <>
          <Pin B={B} f={f} name="boat" o={win(f, F.limestone - 4, F.seventeen)} title="Limestone" lift={80} color={GOLD} />
          <Pin B={B} f={f} name="tura" o={win(f, F.quarry, F.they - 2)} title="Tura quarry" lift={70} dx={-110} />
          <Pin B={B} f={f} name="giza" o={win(f, F.seventeen, F.they - 2)} title="Giza" sub="the Great Pyramid" lift={70} />
          <Fine x={cx} y={fine} o={win(f, F.his, F.they + 2, 2)} size={26 * s} text={"Nile and canals · not to scale · colours are estimates · illustration"} align="center" />
        </>
      ) : null}

      {/* The timeline again: written c. 2600 BC, found 2013; then how old it already was to her. */}
      {between(F.they - 8, F.we) ? (
        <>
          <Track B={B} f={f} a="tl_built" b="tl_found" o={win(f, F.they, F.we - 6)} />
          <Pin B={B} f={f} name="tl_built" o={win(f, F.buried + 6, F.we - 6)} title="c. 2600 BC" sub="Merer's papyri written" lift={30} dx={-200} />
          <Pin B={B} f={f} name="tl_found" o={win(f, F.four - 4, F.cleo2 - 2)} title="2013" sub="found" lift={-24} dx={-170} />
          <Bracket B={B} f={f} a="tl_found" b="tl_built" o={win(f, F.four, F.cleo2 - 2)} text="~4,500 yrs" side={1} />
          <Pin B={B} f={f} name="tl_cleo" o={win(f, F.cleo2 - 2, F.we - 6)} title="69 BC" sub="Cleopatra" lift={30} dx={-170} />
          <Bracket B={B} f={f} a="tl_cleo" b="tl_built" o={win(f, F.cleo2 + 4, F.we - 6)} text="~2,500 yrs" sub={"to her: already\nancient history"} side={1} />
          <Fine x={cx} y={fine} o={win(f, F.they, F.we, 3)} size={26 * s} text="distance = time · one scale · colours are estimates · illustration" align="center" />
        </>
      ) : null}

      {/* Today, at the end of the paving: the log we can read, then what we might leave. */}
      {f >= F.we ? (
        <>
          <Label x={cx} y={top + 150 * s} o={win(f, F.read + 2, F.so2 - 2, 8)} title="We can read it" sub="the crew's work log" size={50 * s} />
          <Label x={cx} y={top + 150 * s} o={win(f, F.so2 + 2, F.four2 - 2, 8)} title="Us · today" sub="what would you leave?" size={50 * s} />
          <Fine x={cx} y={fine} o={win(f, F.we, F.four2, 3)} size={26 * s} text="illustration" align="center" />
          <Fine x={cx} y={fine} o={win(f, F.four2, F.end + 30)} size={26 * s} text="distance = time · illustration" align="center" />
        </>
      ) : null}

      {c ? <Counter x={cx} y={L.vertical ? top + (c.unit ? -40 : -20) : top} o={c.o} value={c.value} unit={c.unit} size={120 * s} /> : null}
    </>
  );
};

export const cleopatraPyramid: Short = {
  slug: "cleopatra-pyramid",
  title: "What the Great Pyramid looked like in Cleopatra's day",
  edit,
  looks: [{ id: "Illustrated", Set: () => null, cast: () => [] }],
  ui: (L) => <Overlay L={L} />,
  music: "egypt",
  sfx: [
    { at: F.not, name: "thud", volume: 0.35 },
    { at: F.polished, name: "sparkle", volume: 0.3 },
    { at: F.three, name: "whoosh", volume: 0.2 },
    { at: F.then, name: "whoosh", volume: 0.2 },
    { at: F.oldest, name: "pop", volume: 0.3 },
    { at: F.his, name: "whoosh", volume: 0.2 },
    { at: F.buried, name: "whoosh", volume: 0.2 },
    { at: F.so2 + 14, name: "pop", volume: 0.3 },
  ],
};
