import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { makeDraftEdit } from "../../edit";
import { Body, LOOKS, Starfield, Tag } from "../../scenes/space";
import type { Short } from "../types";

// A short with no cast. The subject is how long energy takes to get out of the Sun, so the frame
// holds the Sun's interior and one path through it; the figure machinery is not involved.
//
// Drafted with makeDraftEdit: the word timings are estimated from SCRIPT at a narration pace and
// there is nothing to play yet. Recording it means `npm run tts -- age-of-sunlight` and then
// swapping makeDraftEdit for makeEdit against the generated alignment. No beat below moves when
// that happens, because every one of them hangs off a spoken word rather than a frame number.
//
// `npm run lint` checks SCRIPT against script/age-of-sunlight.txt: the voice is spoken from the
// file and the beats are keyed to this copy, so a drift between the two is a silent desync.
const SCRIPT = `The sunlight on your skin is a hundred thousand years old.
Eight minutes of that was the trip from the Sun.
The rest was getting out.
But it is not the same light.
No photon survives the climb.
The energy is ancient. The light is eight minutes old.`;

const edit = makeDraftEdit({
  script: SCRIPT,
  keyPhrases: [["hundred", "thousand"], ["eight", "minutes"], ["photon"], ["ancient"]],
  // No breakAfter: the longest page is the opening sentence at 11 words, which sets three lines in
  // the 9:16 caption block against the four it has room for. Both occurrences of "eight minutes"
  // light up on purpose — the closing line is the hook's own number handed back.
});

// Every beat hangs off a spoken word, so a re-read of the script re-resolves the cut.
const F = {
  eight: edit.at("eight"),
  minutes: edit.at("minutes"),
  sun: edit.at("sun"),
  rest: edit.at("rest"),
  out: edit.at("out"),
  photon: edit.at("photon"),
  climb: edit.at("climb"),
  ancient: edit.at("ancient"),
  close: edit.at("eight", 1),
  voEnd: edit.voEnd,
};

const ramp = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Shot A: the Sun and the Earth with the gap between them to cross. Both crops have to hold it and
// the 9:16 window is only 885 stage units wide (x 517–1403), so the Sun sits left of centre at 700
// rather than centred, which leaves the gap its full width instead of running it off the frame.
const A = { sun: { x: 700, y: 390, r: 110 }, earth: { x: 1300, y: 390, r: 24 } };
const TRAVEL = { from: A.sun.x + A.sun.r, to: A.earth.x - A.earth.r };

// Shot B: the same Sun pushed in and centred, big enough to hold a legible path through it. 320 at
// y 470 is what both crops allow — the limb stays inside the 9:16 window (885 units), the disc
// stays above the 16:9 caption line at y 850, and the top of the frame is left clear, because the
// label has nowhere else to go once the disc is this wide. Pushing in by growing the Sun rather
// than zooming the camera keeps the starfield still and the labels at the size they were measured at.
const B = { x: 960, y: 470, r: 320 };

// The interior by fraction of the Sun's radius: fusing core to 0.25, radiative zone to 0.7, and
// the convective zone above that. The hundred thousand years is spent in the radiative zone, which
// is why the walk lives there and the break-out above 0.7 is quick.
const CORE = 0.25;
const RADIATIVE = 0.7;

// Deterministic, so the path is in the same place on every render and every re-render.
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// Up and to the right: the one direction with room for the break-out and its fan in both crops.
// The walk is turned to leave this way rather than reseeded until it happens to, so the shape of
// the path and where it exits are independent choices.
const EXIT_ANGLE = -0.62;
const EXIT = { ux: Math.cos(EXIT_ANGLE), uy: Math.sin(EXIT_ANGLE) };

// A path out of the core, drawn as what it is: a step in a near-random direction, leaning outward
// as the plasma thins, scaled so it ends on the radiative boundary. A real photon's walk is some
// 10^20 steps, which is not a thing that can be drawn — so the honest picture is its shape, and
// the number stays in the label where it can be checked.
const WALK = (() => {
  const next = rng(23);
  const steps = 240;
  const pts: [number, number][] = [[0, 0]];
  let x = 0;
  let y = 0;
  for (let i = 0; i < steps; i++) {
    const a = next() * Math.PI * 2;
    // A constant, weak outward lean rather than one that ramps up. Ramping it put all the wander
    // near the core and marched the rest of the way out in a straight corridor, which is a picture
    // of a journey rather than of a walk; holding it at 0.1 keeps the net drift small against the
    // wander, so the path sprawls across the zone and still arrives.
    const bias = 0.1;
    const th = Math.hypot(x, y) < 1e-6 ? a : Math.atan2(y, x) + (a - Math.PI) * (1 - bias);
    x += Math.cos(th) * 0.05;
    y += Math.sin(th) * 0.05;
    pts.push([x, y]);
  }
  // Scaled by the furthest excursion rather than the last point, so no leg strays above 0.7 and
  // crosses into the convective zone before the break-out beat says it does.
  const far = Math.max(...pts.map(([px, py]) => Math.hypot(px, py)));
  const k = RADIATIVE / far;
  const [lx, ly] = pts[pts.length - 1];
  const turn = EXIT_ANGLE - Math.atan2(ly, lx);
  const c = Math.cos(turn);
  const sn = Math.sin(turn);
  const out = pts.map(([px, py]) => [(px * c - py * sn) * k, (px * sn + py * c) * k] as [number, number]);
  // The grind ends on the radiative boundary, so the break-out above it starts where it stopped.
  out.push([EXIT.ux * RADIATIVE, EXIT.uy * RADIATIVE]);
  return out;
})();

// Every leg ends in an absorption and a re-emission, so the path sheds light sideways the whole way
// out. Twelve of them read as "constantly" without drawing one per leg.
const STUBS = Array.from({ length: 12 }, (_, i) => {
  const at = Math.floor(((i + 1) / 13) * (WALK.length - 1));
  const th = rng(101 + i * 7)() * Math.PI * 2;
  return { at, x: WALK[at][0], y: WALK[at][1], dx: Math.cos(th) * 0.085, dy: Math.sin(th) * 0.085 };
});

// Gamma out of the core, visible light by the surface. The path is tinted by how far out each leg
// is, because the energy is degraded on the way rather than carried intact — which is the whole
// reason the script says it is not the same light.
const GAMMA = [214, 198, 255];
const VISIBLE = [255, 233, 168];
const tint = (r: number) => {
  const t = Math.min(1, Math.max(0, r / RADIATIVE));
  const v = GAMMA.map((a, i) => Math.round(a + (VISIBLE[i] - a) * t));
  return `rgb(${v[0]},${v[1]},${v[2]})`;
};

// One leg of the path, as a rotated bar in stage units.
const Leg: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
  color: string;
  opacity?: number;
}> = ({ x1, y1, x2, y2, w, color, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x1,
      top: y1 - w / 2,
      width: Math.hypot(x2 - x1, y2 - y1),
      height: w,
      borderRadius: w,
      background: color,
      opacity,
      transformOrigin: "0 50%",
      rotate: `${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI}deg`,
    }}
  />
);

// The crossing, as a single bright point leaving the limb. Parked at either end it reads as a stray
// dot, so it is drawn only while it is actually in flight.
const Pulse: React.FC<{ t: number }> = ({ t }) =>
  t <= 0 || t >= 1 ? null : (
    <div
      style={{
        position: "absolute",
        left: TRAVEL.from + (TRAVEL.to - TRAVEL.from) * t - 9,
        top: A.sun.y - 9,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff6d8",
        boxShadow: "0 0 26px 10px rgba(255,220,130,0.75)",
      }}
    />
  );

const SunScene: React.FC = () => {
  const f = useCurrentFrame();

  // Shot A → Shot B → Shot A. The push in lands on "the rest was getting out", the line where the
  // short stops being about distance and starts being about the inside of the Sun.
  const inside = ramp(f, F.rest, F.out + 20) - ramp(f, F.ancient + 14, F.ancient + 48);
  const sx = A.sun.x + (B.x - A.sun.x) * inside;
  const sy = A.sun.y + (B.y - A.sun.y) * inside;
  const sr = A.sun.r + (B.r - A.sun.r) * inside;
  const earth = Math.max(0, 1 - inside * 2);
  const cross = Math.min(1, Math.max(0, inside * 1.4));

  const walk = ramp(f, F.out, F.climb);
  const stubs = ramp(f, F.photon, F.photon + 34);
  const burst = ramp(f, F.climb, F.climb + 16);
  const fan = ramp(f, F.climb + 10, F.climb + 34);

  const shown = Math.floor(walk * (WALK.length - 1));
  const leg = Math.max(2, sr * 0.018);

  return (
    <>
      <Body x={sx} y={sy} r={sr} look={LOOKS.sun} />
      {earth > 0 ? <Body x={A.earth.x} y={A.earth.y} r={A.earth.r} look={LOOKS.earth} opacity={earth} /> : null}

      {/* Three crossings: one to establish the gap under the hook, one on the line that measures
          it, and one on the closing line that hands the number back. */}
      <Pulse t={ramp(f, 6, 106)} />
      <Pulse t={ramp(f, F.eight - 6, F.sun + 9)} />
      <Pulse t={ramp(f, F.close - 4, F.voEnd + 16)} />

      {cross > 0.02 ? (
        <div style={{ position: "absolute", left: sx, top: sy, opacity: cross }}>
          {/* A cutaway, not a lit disc. The first version tinted the interior and left it bright,
              and a path drawn on it was invisible — so the inside is darkened to near-black and the
              zones are rings rather than fills. Everything the beat is about is then the only lit
              thing in the circle. */}
          <div
            style={{
              position: "absolute",
              left: -sr,
              top: -sr,
              width: sr * 2,
              height: sr * 2,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(26,13,4,0.93) 0%, rgba(42,19,5,0.90) 66%, rgba(78,36,9,0.66) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -sr * RADIATIVE,
              top: -sr * RADIATIVE,
              width: sr * RADIATIVE * 2,
              height: sr * RADIATIVE * 2,
              borderRadius: "50%",
              border: "2px solid rgba(255,196,110,0.45)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -sr * CORE,
              top: -sr * CORE,
              width: sr * CORE * 2,
              height: sr * CORE * 2,
              borderRadius: "50%",
              border: "2px solid rgba(255,228,160,0.42)",
              background:
                "radial-gradient(circle, rgba(255,243,205,0.42) 0%, rgba(255,196,96,0.13) 62%, transparent 100%)",
            }}
          />

          {/* The grind: one leg at a time, tinted by how far out it is. */}
          {Array.from({ length: shown }, (_, i) => (
            <Leg
              key={i}
              x1={WALK[i][0] * sr}
              y1={WALK[i][1] * sr}
              x2={WALK[i + 1][0] * sr}
              y2={WALK[i + 1][1] * sr}
              w={leg}
              color={tint(Math.hypot(WALK[i + 1][0], WALK[i + 1][1]))}
            />
          ))}
          {/* The head of the path, so the eye has something to follow through 140 legs. */}
          {walk > 0 && walk < 1 ? (
            <div
              style={{
                position: "absolute",
                left: WALK[shown][0] * sr - leg * 2,
                top: WALK[shown][1] * sr - leg * 2,
                width: leg * 4,
                height: leg * 4,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: `0 0 ${leg * 6}px ${leg * 2}px rgba(220,205,255,0.7)`,
              }}
            />
          ) : null}

          {/* Re-emission sideways at interactions the path has already passed. */}
          {stubs > 0
            ? STUBS.filter((s) => s.at <= shown).map((s, i) => (
                <Leg
                  key={`stub-${i}`}
                  x1={s.x * sr}
                  y1={s.y * sr}
                  x2={(s.x + s.dx * stubs) * sr}
                  y2={(s.y + s.dy * stubs) * sr}
                  w={leg * 0.7}
                  color={tint(Math.hypot(s.x, s.y))}
                  opacity={0.5 * stubs}
                />
              ))
            : null}

          {/* Above 0.7 the plasma convects and the energy is carried out in weeks, not millennia,
              so the last stretch is one straight leg rather than another walk. */}
          {burst > 0 ? (
            <Leg
              x1={EXIT.ux * RADIATIVE * sr}
              y1={EXIT.uy * RADIATIVE * sr}
              x2={EXIT.ux * (RADIATIVE + (1 - RADIATIVE) * burst) * sr}
              y2={EXIT.uy * (RADIATIVE + (1 - RADIATIVE) * burst) * sr}
              w={leg * 1.3}
              color="#fff3c4"
            />
          ) : null}

          {/* What leaves is not what set out: one path in, a spray of ordinary light out. */}
          {fan > 0
            ? [-0.42, -0.21, 0, 0.21, 0.42].map((a, i) => {
                const th = Math.atan2(EXIT.uy, EXIT.ux) + a;
                return (
                  <Leg
                    key={`fan-${i}`}
                    x1={EXIT.ux * sr}
                    y1={EXIT.uy * sr}
                    x2={(EXIT.ux + Math.cos(th) * 0.22 * fan) * sr}
                    y2={(EXIT.uy + Math.sin(th) * 0.22 * fan) * sr}
                    w={leg}
                    color="#ffe9a8"
                    opacity={0.75 * fan}
                  />
                );
              })
            : null}
        </div>
      ) : null}

      {/* Over the gap rather than beside the Sun: at 885 units wide the 9:16 crop has no "beside"
          once the Sun and the Earth are both in it. */}
      <Tag x={850} y={150} text="8 MINUTES" sub="surface to your skin" from={F.minutes + 8} to={F.rest + 6} />
      {/* Above the disc, not on it: at 320 units of radius there is no clear ground beside it in
          the 9:16 crop, and the first pass had the sub-line unreadable against the limb. */}
      <Tag x={600} y={30} text="≈100,000 YEARS" sub="core to surface" from={F.out + 12} to={F.ancient + 30} />
      {/* The two answers side by side on the last line, stacked rather than abreast because the
          vertical crop has the height to spare and not the width. */}
      <Tag x={600} y={110} text="THE ENERGY" sub="≈100,000 years getting out" from={F.close - 2} />
      <Tag x={600} y={640} text="THE LIGHT" sub="8 minutes old" from={F.close + 10} />
    </>
  );
};

export const ageOfSunlight: Short = {
  slug: "age-of-sunlight",
  title: "Sunlight is older than the light",
  edit,
  looks: [{ id: "Space", Set: Starfield, cast: () => [] }],
  props: () => <SunScene />,
};
