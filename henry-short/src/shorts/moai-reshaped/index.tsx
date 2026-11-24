import React from "react";
import {
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { makeEdit } from "../../edit";
import type { Layout } from "../../layout";
import alignment from "../../generated/moai-reshaped.alignment.json";
import world from "../../generated/moai-world.anchors.json";
import { clamp01 } from "../altar-stone/shots";
import {
  Counter,
  Fine,
  GOLD,
  INK,
  Label,
} from "../cleopatra-pyramid/draw";
import type { Short } from "../types";

// One 3D world (tools/blender/moai_world.py → public/3d/moai-world.mp4): a platform on the coast,
// Rano Raraku and its roads, a statue walked on ropes, the concrete test replica and its crew. Width
// bars, lean lines and pins are overlays that follow the statues through
// src/generated/moai-world.anchors.json, which Blender writes from the same camera.
//
// The voice-over is Kokoro (`npm run tts -- moai-reshaped`) from script/moai-reshaped.txt,
// fact-checked in factcheck/moai-reshaped.json. Every label and number on screen is a claim (A6):
// review/moai-reshaped.a6.md names the SOURCES item each rests on. No shoulder/base ratio is ever
// shown: the corrected figures are unverified (A7).
const edit = makeEdit({
  alignment,
  keyPhrases: [
    ["reshaped"],
    ["Dozens"],
    ["lean", "forward."],
    ["steps", "forward."],
    ["eighteen"],
    ["four", "tonnes"],
    ["hundred", "meters"],
    ["forty", "minutes."],
    ["stand", "straight,"],
    ["narrower"],
    ["Eye", "sockets"],
    ["None"],
    ["carved", "away"],
    ["reject"],
    ["on", "purpose."],
  ],
  breakAfter: [
    "reshaped",
    "roads",
    "wide",
    "ropes,",
    "test,",
    "copy",
    "tonnes",
    "straight,",
    "carved",
    "platform.",
    "argue,",
    "walking",
    "think",
    "there",
  ],
  tail: 1.6,
});

const F = {
  reshaped: edit.at("reshaped"),
  dozens: edit.at("dozens"),
  apparently: edit.at("apparently"),
  onAvg: edit.at("on", 1),
  shoulders: edit.at("shoulders", 0),
  they1: edit.at("they", 1),
  rocked: edit.at("rocked"),
  steps: edit.at("steps"),
  test: edit.at("in", 0),
  eighteen: edit.at("eighteen"),
  scaled: edit.at("scaled-down"),
  four: edit.at("four"),
  hundred: edit.at("hundred"),
  forty: edit.at("forty"),
  the3: edit.at("the", 3),
  straight: edit.at("straight"),
  onAvg2: edit.at("on", 3),
  narrower: edit.at("narrower"),
  eye: edit.at("eye"),
  carved: edit.at("carved", 0),
  none: edit.at("none"),
  so: edit.at("so"),
  carved2: edit.at("carved", 1),
  other: edit.at("other"),
  some: edit.at("some"),
  end: edit.duration,
};

const win = (f: number, a: number, b: number, fade = 6) =>
  Math.min(clamp01((f - a) / fade), clamp01((b - f) / fade));

// Where the 3D render sits in each format: full frame at 9:16; pillarboxed at 16:9 (the world is
// framed for the vertical short only). `s` scales overlay type with it.
type Box = { x: number; y: number; w: number; h: number; s: number };
const box = (L: Layout): Box =>
  L.vertical
    ? { x: 0, y: 0, w: 1080, h: 1920, s: 1 }
    : { x: 656, y: 0, w: 608, h: 1080, s: 608 / 1080 };

// A named 3D point on screen at frame f, or null when it is behind the camera or off the frame.
type Anchor = { f0: number; pts: number[][] };
const ANCHORS = world.anchors as Record<string, Anchor>;
type P = { x: number; y: number };
const pt = (B: Box, name: string, f: number): P | null => {
  const a = ANCHORS[name];
  const p =
    a.pts[Math.max(0, Math.min(a.pts.length - 1, Math.round(f) - a.f0))];
  const on =
    p[2] === 1 && p[0] > -0.05 && p[0] < 1.05 && p[1] > -0.05 && p[1] < 1.05;
  return on ? { x: B.x + p[0] * B.w, y: B.y + p[1] * B.h } : null;
};

const FILL: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: (1080 - (1920 * 16) / 9) / 2,
  width: 1920,
  height: (1920 * 16) / 9,
};
// Each cut is softened into a dissolve this many frames either side of it: the "-b" clip holds the
// incoming shot around each cut (tools/blender/moai_world.py --cut-shift).
const DISSOLVE = 7;
const CUTS = world.cuts;

const Svg: React.FC<{ o: number; children: React.ReactNode }> = ({
  o,
  children,
}) => (
  <svg
    width={1920}
    height={1920}
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      overflow: "visible",
      opacity: o,
    }}
  >
    {children}
  </svg>
);

// A label pinned to a 3D point, drawn above it with a short leader line (below it when lift < 0).
const Pin: React.FC<{
  B: Box;
  f: number;
  name: string;
  o: number;
  title: string;
  sub?: string;
  color?: string;
  lift?: number;
  dx?: number;
}> = ({ B, f, name, o, title, sub, color, lift = 90, dx = 0 }) => {
  const p = pt(B, name, f);
  if (!p || o <= 0) return null;
  const h = lift * B.s;
  const labelY = h >= 0 ? p.y - h - 50 * B.s * (sub ? 1.7 : 1) : p.y - h;
  return (
    <>
      <Svg o={o}>
        <line
          x1={p.x}
          y1={p.y}
          x2={p.x + dx * B.s}
          y2={p.y - h + (h >= 0 ? 8 : -6) * B.s}
          stroke={INK}
          strokeWidth={3 * B.s}
        />
        <circle
          cx={p.x}
          cy={p.y}
          r={7 * B.s}
          fill={GOLD}
          stroke="#1d1208"
          strokeWidth={2 * B.s}
        />
      </Svg>
      <Label
        x={p.x + dx * B.s}
        y={labelY}
        o={o}
        title={title}
        sub={sub}
        size={40 * B.s}
        color={color}
      />
    </>
  );
};

// A width bar across the statue between its two side edges at one height, with end ticks.
const Width: React.FC<{
  B: Box;
  f: number;
  a: string;
  b: string;
  o: number;
  text: string;
  color?: string;
  below?: boolean;
}> = ({ B, f, a, b, o, text, color = GOLD, below }) => {
  const p = pt(B, a, f);
  const q = pt(B, b, f);
  if (!p || !q || o <= 0) return null;
  const t = 18 * B.s;
  const [l, r] = p.x < q.x ? [p, q] : [q, p];
  return (
    <>
      <Svg o={o}>
        <line
          x1={l.x}
          y1={l.y}
          x2={r.x}
          y2={r.y}
          stroke={color}
          strokeWidth={6 * B.s}
          strokeLinecap="round"
        />
        <line
          x1={l.x}
          y1={l.y - t}
          x2={l.x}
          y2={l.y + t}
          stroke={color}
          strokeWidth={6 * B.s}
        />
        <line
          x1={r.x}
          y1={r.y - t}
          x2={r.x}
          y2={r.y + t}
          stroke={color}
          strokeWidth={6 * B.s}
        />
      </Svg>
      <Label
        x={r.x + 24 * B.s}
        y={(l.y + r.y) / 2 - (below ? -8 : 26) * B.s}
        o={o}
        title={text}
        size={38 * B.s}
        color={color}
        align="left"
      />
    </>
  );
};

// The statue's axis (base to top of head) against a true vertical from the same base point.
const Lean: React.FC<{
  B: Box;
  f: number;
  bot: string;
  top: string;
  up: string;
  o: number;
  text: string;
  sub?: string;
}> = ({ B, f, bot, top, up, o, text, sub }) => {
  const a = pt(B, bot, f);
  const b = pt(B, top, f);
  const c = pt(B, up, f);
  if (!a || !b || !c || o <= 0) return null;
  return (
    <>
      <Svg o={o}>
        <line
          x1={a.x}
          y1={a.y}
          x2={c.x + (c.x - a.x) * 0.12}
          y2={c.y + (c.y - a.y) * 0.12}
          stroke={INK}
          strokeWidth={4 * B.s}
          strokeDasharray={`${14 * B.s} ${10 * B.s}`}
        />
        <line
          x1={a.x}
          y1={a.y}
          x2={b.x + (b.x - a.x) * 0.12}
          y2={b.y + (b.y - a.y) * 0.12}
          stroke={GOLD}
          strokeWidth={6 * B.s}
          strokeLinecap="round"
        />
      </Svg>
      <Label
        x={(b.x + c.x) / 2}
        y={Math.min(b.y, c.y) - 160 * B.s}
        o={o}
        title={text}
        sub={sub}
        size={44 * B.s}
        color={GOLD}
      />
    </>
  );
};

// A line along the ground between two points: the 100 m track.
const Span: React.FC<{
  B: Box;
  f: number;
  a: string;
  b: string;
  o: number;
  text: string;
}> = ({ B, f, a, b, o, text }) => {
  const p = pt(B, a, f);
  const q = pt(B, b, f);
  if (!p || !q || o <= 0) return null;
  return (
    <>
      <Svg o={o}>
        <line
          x1={p.x}
          y1={p.y}
          x2={q.x}
          y2={q.y}
          stroke={GOLD}
          strokeWidth={6 * B.s}
          strokeLinecap="round"
        />
        <circle cx={p.x} cy={p.y} r={9 * B.s} fill={GOLD} />
        <circle cx={q.x} cy={q.y} r={9 * B.s} fill={GOLD} />
      </Svg>
      <Label
        x={(p.x + q.x) / 2}
        y={(p.y + q.y) / 2 + 24 * B.s}
        o={o}
        title={text}
        size={44 * B.s}
        color={GOLD}
      />
    </>
  );
};

// Counters: one big number per beat, each the number being spoken (A6: on screen while it is said).
const counterAt = (
  f: number,
): { value: string; unit?: string; o: number } | null => {
  if (f >= F.eighteen && f < F.four - 2)
    return { value: "18", unit: "people", o: win(f, F.eighteen, F.four - 2) };
  if (f >= F.four && f < F.hundred - 2)
    return {
      value: "4.35 t",
      unit: "the replica",
      o: win(f, F.four, F.hundred - 2),
    };
  if (f >= F.hundred && f < F.forty - 2)
    return { value: "100 m", o: win(f, F.hundred, F.forty - 2) };
  if (f >= F.forty && f < F.the3 - 2)
    return { value: "40 min", o: win(f, F.forty, F.the3 - 2) };
  return null;
};

const Overlay: React.FC<{ L: Layout }> = ({ L }) => {
  const f = useCurrentFrame();
  const B = box(L);
  const s = B.s;
  const cx = B.x + B.w / 2;
  const top = B.y + (L.vertical ? 150 : 40);
  const fine = B.y + B.h * (L.vertical ? 0.735 : 0.86); // small print sits just above the captions
  const c = counterAt(f);
  const between = (a: number, b: number) => f >= a && f < b;
  const cut = CUTS.find((k) => f >= k - DISSOLVE && f < k + DISSOLVE); // the "-b" clip is black outside these frames
  const mix =
    cut === undefined ? 0 : clamp01((f - (cut - DISSOLVE)) / (2 * DISSOLVE));

  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "#0d1520" }} />
      {/* 16:9 only: the sides of the vertical picture are filled with a blurred, darkened copy of it. */}
      {L.vertical ? null : (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{ ...FILL, filter: "blur(36px) brightness(0.5)" }}>
            <OffthreadVideo
              muted
              src={staticFile("3d/moai-world.mp4")}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      )}
      <OffthreadVideo
        muted
        src={staticFile("3d/moai-world.mp4")}
        style={{
          position: "absolute",
          left: B.x,
          top: B.y,
          width: B.w,
          height: B.h,
        }}
      />
      {mix > 0 ? (
        <Sequence layout="none">
          <OffthreadVideo
            muted
            src={staticFile("3d/moai-world-b.mp4")}
            style={{
              position: "absolute",
              left: B.x,
              top: B.y,
              width: B.w,
              height: B.h,
              opacity: mix,
            }}
          />
        </Sequence>
      ) : null}

      {/* Hook: a platform statue, and the road shape it arrived in as a gold ghost (their reading). */}
      {between(0, F.dozens) ? (
        <>
          <Label
            x={cx}
            y={top}
            o={win(f, 0, F.dozens - 2, 4)}
            title="Lipo & Hunt · 2025"
            sub="two archaeologists"
            size={50 * s}
          />
          <Pin
            B={B}
            f={f}
            name="a_top"
            o={win(f, F.reshaped + 4, F.dozens - 2)}
            title="As it arrived?"
            sub="their reading"
            color={GOLD}
            lift={70}
          />
          <Fine
            x={cx}
            y={fine}
            o={win(f, 0, F.dozens)}
            size={26 * s}
            text="illustration · gold: the shape before, as they argue"
            align="center"
          />
        </>
      ) : null}

      {/* Rano Raraku, the roads, and a statue lying on one. */}
      {between(F.dozens - 4, F.onAvg) ? (
        <>
          <Pin
            B={B}
            f={f}
            name="quarry"
            o={win(f, F.dozens + 4, F.apparently - 2)}
            title="Rano Raraku"
            sub="the quarry"
            lift={80}
          />
          <Pin
            B={B}
            f={f}
            name="road_s"
            o={win(f, F.dozens + 10, F.apparently - 2)}
            title="An old road"
            lift={70}
          />
          <Pin
            B={B}
            f={f}
            name="fallen_w"
            o={win(f, F.apparently + 2, F.onAvg - 2)}
            title="A road statue"
            sub="apparently dropped on the way"
            lift={150}
          />
          <Fine
            x={cx}
            y={fine}
            o={win(f, F.dozens, F.onAvg)}
            size={26 * s}
            text="illustration · island simplified, not to scale"
            align="center"
          />
        </>
      ) : null}

      {/* A road statue: base about as wide as the shoulders; then side on: the forward lean. */}
      {between(F.onAvg - 4, F.rocked) ? (
        <>
          <Width
            B={B}
            f={f}
            a="w_sh_l"
            b="w_sh_r"
            o={win(f, F.shoulders - 8, F.they1 - 2)}
            text="Shoulders"
          />
          <Width
            B={B}
            f={f}
            a="w_base_l"
            b="w_base_r"
            o={win(f, F.onAvg + 10, F.they1 - 2)}
            text="Base"
            below
          />
          <Label
            x={cx}
            y={top}
            o={win(f, F.shoulders, F.they1 - 2)}
            title="Base ≈ shoulders"
            sub="road statues, on average"
            size={50 * s}
          />
          <Lean
            B={B}
            f={f}
            bot="w_bot"
            top="w_top"
            up="w_up"
            o={win(f, F.they1 + 2, F.rocked - 1)}
            text="Leans forward"
            sub="road statues"
          />
          <Fine
            x={cx}
            y={fine}
            o={win(f, F.onAvg, F.rocked)}
            size={26 * s}
            text="illustration · proportions not to a measured ratio"
            align="center"
          />
        </>
      ) : null}

      {/* Rocked on ropes: each rock a step. */}
      {between(F.rocked, F.test) ? (
        <>
          <Label
            x={cx}
            y={top}
            o={win(f, F.rocked + 2, F.test - 2)}
            title="Rocked side to side"
            sub="ropes at each side and behind"
            size={50 * s}
          />
          <Label
            x={cx}
            y={top + 150 * s}
            o={win(f, F.steps, F.test - 2)}
            title="→ a step forward"
            size={50 * s}
            color={GOLD}
          />
          <Fine
            x={cx}
            y={fine}
            o={win(f, F.rocked, F.test)}
            size={26 * s}
            text="illustration · as Lipo & Hunt describe it"
            align="center"
          />
        </>
      ) : null}

      {/* The test (LH25 1.4): the concrete replica, 4 + 4 on the side ropes, 10 on the rear rope. */}
      {between(F.test, F.the3) ? (
        <>
          <Label
            x={cx}
            y={top + 190 * s}
            o={win(f, F.test + 2, F.eighteen - 2)}
            title="A test"
            sub="a scaled-down concrete copy"
            size={50 * s}
          />
          <Pin
            B={B}
            f={f}
            name="replica"
            o={win(f, F.scaled, F.hundred - 2)}
            title="Replica"
            sub="concrete"
            lift={70}
          />
          <Pin
            B={B}
            f={f}
            name="crew_rear"
            o={win(f, F.eighteen + 4, F.hundred - 2)}
            title="10"
            sub="rear rope"
            lift={60}
          />
          <Pin
            B={B}
            f={f}
            name="crew_left"
            o={win(f, F.eighteen + 4, F.hundred - 2)}
            title="4"
            sub="side rope"
            lift={60}
          />
          <Pin
            B={B}
            f={f}
            name="crew_right"
            o={win(f, F.eighteen + 4, F.hundred - 2)}
            title="4"
            sub="side rope"
            lift={60}
            dx={-180}
          />
          <Span
            B={B}
            f={f}
            a="t_start"
            b="t_end"
            o={win(f, F.hundred + 2, F.the3 - 2)}
            text="100 m"
          />
          <Fine
            x={cx}
            y={fine}
            o={win(f, F.test, F.the3)}
            size={26 * s}
            text="illustration · replica's size estimated from its weight"
            align="center"
          />
        </>
      ) : null}

      {/* A platform statue: upright; then front on: base narrower than the shoulders. */}
      {between(F.the3, F.eye) ? (
        <>
          <Lean
            B={B}
            f={f}
            bot="e_bot"
            top="e_top"
            up="e_top"
            o={win(f, F.straight - 6, F.onAvg2 - 2)}
            text="Stands straight"
            sub="platform statues"
          />
          <Width
            B={B}
            f={f}
            a="e_sh_l"
            b="e_sh_r"
            o={win(f, F.onAvg2 + 4, F.eye - 2)}
            text="Shoulders"
          />
          <Width
            B={B}
            f={f}
            a="e_base_l"
            b="e_base_r"
            o={win(f, F.narrower - 6, F.eye - 2)}
            text="Base"
            below
          />
          <Label
            x={cx}
            y={top}
            o={win(f, F.narrower, F.eye - 2)}
            title="Base < shoulders"
            sub="platform statues, on average"
            size={50 * s}
          />
          <Fine
            x={cx}
            y={fine}
            o={win(f, F.the3, F.eye)}
            size={26 * s}
            text="illustration · proportions not to a measured ratio"
            align="center"
          />
        </>
      ) : null}

      {/* Eye sockets: carved on the platform; none on the road statues. */}
      {between(F.eye, F.so) ? (
        <>
          <Pin
            B={B}
            f={f}
            name="a_eye"
            o={win(f, F.carved + 6, F.none - 2)}
            title="Eye sockets"
            sub="carved once it stood here"
            lift={-260}
            dx={120}
          />
          <Pin
            B={B}
            f={f}
            name="fu_face"
            o={win(f, F.none + 2, F.so - 2)}
            title="Road statue"
            sub="no eye sockets"
            lift={200}
          />
          <Fine
            x={cx}
            y={fine}
            o={win(f, F.eye, F.so)}
            size={26 * s}
            text="illustration"
            align="center"
          />
        </>
      ) : null}

      {/* Their conclusion: the walking shape carved away on arrival. Gold = the road shape. */}
      {between(F.so, F.other) ? (
        <>
          <Label
            x={cx}
            y={top}
            o={win(f, F.so + 2, F.other - 2)}
            title="They argue"
            sub="the walking shape, carved away on arrival"
            size={50 * s}
          />
          <Pin
            B={B}
            f={f}
            name="b_trim"
            o={win(f, F.carved2 + 4, F.other - 2)}
            title="Carved away"
            sub="front of the base"
            color={GOLD}
            lift={240}
            dx={-200}
          />
          <Fine
            x={cx}
            y={fine}
            o={win(f, F.so, F.other)}
            size={26 * s}
            text="illustration · gold: the road shape"
            align="center"
          />
        </>
      ) : null}

      {/* The disagreement: statues set up along the roads on purpose, as gold ghosts over the fallen ones. */}
      {f >= F.other ? (
        <>
          <Label
            x={cx}
            y={top}
            o={win(f, F.other + 2, F.some - 2)}
            title="Other archaeologists"
            sub="reject this"
            size={50 * s}
          />
          <Label
            x={cx}
            y={top}
            o={win(f, F.some + 2, F.end + 30)}
            title="Another reading"
            sub="road statues set up there on purpose"
            size={50 * s}
            color={GOLD}
          />
          <Fine
            x={cx}
            y={fine}
            o={win(f, F.other, F.end + 30)}
            size={26 * s}
            text="illustration · gold: a reading, not a reconstruction"
            align="center"
          />
        </>
      ) : null}

      {c ? (
        <Counter
          x={cx}
          y={L.vertical ? top + (c.unit ? -40 : -20) : top}
          o={c.o}
          value={c.value}
          unit={c.unit}
          size={120 * s}
        />
      ) : null}
    </>
  );
};

export const moaiReshaped: Short = {
  slug: "moai-reshaped",
  title:
    "Easter Island's platform statues were reshaped, two archaeologists say",
  edit,
  looks: [{ id: "Illustrated", Set: () => null, cast: () => [] }],
  ui: (L) => <Overlay L={L} />,
  music: "history",
  sfx: [
    { at: F.reshaped, name: "sparkle", volume: 0.25 },
    { at: F.dozens, name: "whoosh", volume: 0.2 },
    { at: F.test, name: "whoosh", volume: 0.2 },
    { at: F.carved2, name: "thud", volume: 0.3 },
    { at: F.some, name: "sparkle", volume: 0.25 },
  ],
};
