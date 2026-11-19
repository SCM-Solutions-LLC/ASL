import React from "react";
import { useCurrentFrame } from "remotion";
import { makeEdit } from "../../edit";
import { MARKER, SANS, SERIF } from "../../fonts";
import type { Layout } from "../../layout";
import alignment from "../../generated/pompeii-casts.alignment.json";
import { Tag } from "../../scenes/space";
import { Stamp } from "../../ui/Callouts";
import type { Short } from "../types";
import { clamp01, ease, ramp } from "../altar-stone/shots";

// GUARDRAILS C1: these are real victims. Nothing here draws a body or a cast close up: people are
// the numbered markers of an excavation plan (the paper's own individual numbers), and the short is
// about the labels, which is what the DNA overturned. The voice-over is Kokoro
// (`npm run tts -- pompeii-casts`) from script/pompeii-casts.txt, fact-checked in
// factcheck/pompeii-casts.json; every label below says only what that SOURCES block supports (A6).
const edit = makeEdit({
  alignment,
  keyPhrases: [["a", "mother."], ["a", "man,"], ["no", "sign"], ["sisters,"], ["genetically", "male."], ["possibly"], ["were", "guesses."]],
  breakAfter: ["bracelet,", "man,", "together,", "1863", "years,"],
});

const F = {
  gold: edit.at("gold"),
  child: edit.at("child"),
  mother2: edit.at("mother", 1),
  dna: edit.at("dna"),
  man: edit.at("man"),
  sign: edit.at("sign"),
  two: edit.at("two"),
  embrace: edit.at("embrace"),
  sisters: edit.at("sisters"),
  daughter: edit.at("daughter"),
  male: edit.at("male"),
  casts: edit.at("casts"),
  made: edit.at("made"),
  pouring: edit.at("pouring"),
  hollows: edit.at("hollows"),
  over: edit.at("over"),
  reworked: edit.at("reworked"),
  possibly: edit.at("possibly"),
  story: edit.at("story"),
  dna2: edit.at("dna", 1),
  who: edit.at("who"),
  old: edit.at("old"),
  guesses: edit.at("guesses"),
  end: edit.duration,
};

// Shot windows; each fades over 10 frames at both ends. The first starts before frame 0 so the hook
// opens on the label, not on a fade from black.
const SHOTS = {
  plan1: [-10, F.two],
  plan2: [F.two - 8, F.casts],
  pour: [F.casts - 8, F.end + 10],
  labels: [F.dna2 - 8, F.end + 10],
} as const;
const vis = (f: number, [a, b]: readonly [number, number]) => Math.min(clamp01((f - a) / 10), clamp01((b - f) / 10));

const WALL = "#16130f";
const INK = "#d9cfb8";
const GOLD = "#e7b93e";
const RED = "#d8392b";
const TEAL = "#5fc7c0";
const CARD = "#efe4c8";

// 9:16 shows only stage x 517–1403, so the label sits above the plan there; 16:9 puts it to the left.
const at = (L: Layout, v: [number, number], w: [number, number]) => (L.vertical ? { x: v[0], y: v[1] } : { x: w[0], y: w[1] });

const Layer: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) =>
  o <= 0 ? null : <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>{children}</div>;

const Note: React.FC<{ x: number; y: number; text: string; o: number; size?: number; color?: string }> = ({ x, y, text, o, size = 30, color = "#b9ad92" }) =>
  o <= 0 ? null : <div style={{ position: "absolute", left: x, top: y, fontFamily: SERIF, fontSize: size, color, opacity: o, whiteSpace: "pre" }}>{text}</div>;

// The museum label: the old reading, struck through when the DNA comes in, with the correction
// written over it by hand.
const Placard: React.FC<{ x: number; y: number; w: number; title: string; sub: string; strike: number; fix?: string; fixT?: number; scale?: number }> = ({ x, y, w, title, sub, strike, fix, fixT = 0, scale = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, scale: `${scale}`, transformOrigin: "0 0", background: CARD, borderRadius: 6, padding: "22px 30px", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
    <div style={{ position: "relative", display: "inline-block", fontFamily: SERIF, fontWeight: 700, fontSize: 62, color: "#231a10", letterSpacing: 2 }}>
      {title}
      <div style={{ position: "absolute", left: -8, right: -8, top: "52%", height: 9, background: RED, borderRadius: 4, transformOrigin: "0 50%", scale: `${strike} 1` }} />
    </div>
    <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 28, color: "#5a4a35", marginTop: 6, whiteSpace: "pre-line" }}>{sub}</div>
    {fix && fixT > 0 ? (
      <div style={{ position: "absolute", right: 24, bottom: -34, fontFamily: MARKER, fontSize: 64, color: RED, rotate: "-7deg", opacity: fixT, scale: `${1.25 - 0.25 * fixT}` }}>{fix}</div>
    ) : null}
  </div>
);

// A numbered marker on the plan: one person, nothing more.
const Mark: React.FC<{ x: number; y: number; n: number; r?: number; o: number }> = ({ x, y, n, r = 36, o }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <circle cx={x} cy={y} r={r} fill="#2b251d" stroke={INK} strokeWidth={4} />
      <text x={x} y={y + r * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={r * 0.95} fill={INK}>
        {n}
      </text>
    </g>
  );

// The sex result, as the paper gives it: genetically male, or not determined.
const Chip: React.FC<{ x: number; y: number; text: string; o: number; color?: string }> = ({ x, y, text, o, color = TEAL }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", opacity: o, scale: `${0.7 + 0.3 * o}`, padding: "6px 18px", borderRadius: 30, border: `4px solid ${color}`, background: "rgba(10,9,7,0.85)", fontFamily: SANS, fontWeight: 700, fontSize: 34, color, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );

// The plan: a room outline, drawn the way an excavation plan is, centred on the 9:16 slice.
const Room: React.FC<{ door: "left" | "right" }> = ({ door }) => {
  const [x0, y0, x1, y1] = [600, 230, 1320, 820];
  const gap = door === "left" ? `M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} L${x0},620 M${x0},470 L${x0},${y0}` : `M${x0},${y0} L${x1},${y0} L${x1},380 M${x1},540 L${x1},${y1} L${x0},${y1} L${x0},${y0}`;
  return (
    <g>
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={600 + (i + 1) * 90} y1={230} x2={600 + (i + 1) * 90} y2={820} stroke={INK} strokeOpacity={0.07} strokeWidth={2} />
      ))}
      <path d={gap} fill="none" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
    </g>
  );
};

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

const Plan1: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const P52 = { x: 860, y: 560 };
  const P51 = { x: 1030, y: 620 };
  const P50 = { x: 1180, y: 720 };
  const verdict = ramp(f, F.man - 2, F.man + 8);
  const unlink = ease(ramp(f, F.sign, F.sign + 14));
  // The kinship line: drawn on "related", then it breaks apart on "no sign".
  const mid = { x: (P52.x + P51.x) / 2, y: (P52.y + P51.y) / 2 };
  const pull = 22 * unlink;
  const dx = (P51.x - P52.x) / 130;
  const dy = (P51.y - P52.y) / 130;
  const drawn = ramp(f, F.dna + 6, F.dna + 22);
  return (
    <>
      <Svg>
        <Room door="left" />
        {drawn > 0 ? (
          <g stroke={unlink > 0 ? RED : INK} strokeWidth={5} strokeDasharray="10 9" opacity={drawn}>
            <line x1={P52.x + dx * 40} y1={P52.y + dy * 40} x2={mid.x - dx * pull} y2={mid.y - dy * pull} />
            <line x1={mid.x + dx * pull} y1={mid.y + dy * pull} x2={P51.x - dx * 28} y2={P51.y - dy * 28} />
          </g>
        ) : null}
        <Mark x={P50.x} y={P50.y} n={50} o={1} />
        <Mark x={P52.x} y={P52.y} n={52} o={1} />
        <Mark x={P51.x} y={P51.y} n={51} r={24} o={ramp(f, F.child - 6, F.child + 4)} />
        {/* The bracelet on 52's arm, which gave the house its name. */}
        <circle cx={P52.x - 46} cy={P52.y + 34} r={16} fill="none" stroke={GOLD} strokeWidth={7} opacity={ramp(f, F.gold - 4, F.gold + 6)} />
      </Svg>
      <Note x={P52.x - 210} y={P52.y + 64} text={"gold bracelet\n6.1 g"} o={ramp(f, F.gold, F.gold + 10) * (1 - verdict)} size={28} color={GOLD} />
      <Chip x={P52.x} y={P52.y - 100} text="XY · male" o={verdict} />
      <Note x={mid.x - 60} y={mid.y + 46} text={"no sign of kinship\n(up to 3rd degree)"} o={unlink} size={28} color="#f0a39a" />
      <Note x={612} y={176} text="House of the Golden Bracelet · found 1974" o={1} size={30} />
      <Note x={612} y={836} text="plan illustrative · numbers are the study's" o={1} size={26} color="#8a8070" />
      <Placard {...at(L, [560, -190], [40, 150])} w={L.vertical ? 740 : 470} title="MOTHER" sub={"and child: the reading\nsince 1974"} strike={ease(ramp(f, F.man - 4, F.man + 6))} fix="A MAN" fixT={ramp(f, F.man + 2, F.man + 10)} />
      <Tag {...at(L, [950, 250], [1370, 200])} text="ANCIENT DNA" sub={"Pilli et al. 2024\nCurrent Biology"} from={F.dna} to={SHOTS.plan1[1]} subSize={30} />
    </>
  );
};

const Plan2: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const P21 = { x: 900, y: 560 };
  const P22 = { x: 1000, y: 540 };
  const male = ramp(f, F.male - 2, F.male + 8);
  const arc = ramp(f, F.embrace - 4, F.embrace + 12);
  return (
    <>
      <Svg>
        <Room door="right" />
        {arc > 0 ? <path d={`M${P21.x},${P21.y - 46} Q${(P21.x + P22.x) / 2},${P21.y - 150} ${P22.x},${P22.y - 46}`} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="10 9" opacity={arc * (1 - 0.6 * male)} pathLength={1} /> : null}
        <Mark x={P21.x} y={P21.y} n={21} o={ramp(f, F.two, F.two + 8)} />
        <Mark x={P22.x} y={P22.y} n={22} o={ramp(f, F.two + 3, F.two + 11)} />
      </Svg>
      <Note x={P21.x - 40} y={P21.y - 200} text="an embrace?" o={arc * (1 - male)} size={32} color={INK} />
      <Chip x={P22.x + 40} y={P22.y + 60} text="XY · male" o={male} />
      <Chip x={P21.x - 70} y={P21.y + 60} text="sex not found" o={ramp(f, F.male + 6, F.male + 14)} color="#8a8070" />
      <Note x={612} y={176} text="House of the Cryptoporticus · excavated 1914" o={1} size={30} />
      <Note x={612} y={836} text="plan illustrative · numbers are the study's" o={1} size={26} color="#8a8070" />
      <Placard
        {...at(L, [560, -190], [40, 150])}
        w={L.vertical ? 740 : 470}
        title="SISTERS?"
        sub={ramp(f, F.mother2, F.mother2 + 1) > 0 ? "or mother and daughter?\nthe 1914 reading" : "the 1914 reading"}
        strike={ease(ramp(f, F.male - 4, F.male + 6))}
        fix="ONE IS MALE"
        fixT={ramp(f, F.male + 2, F.male + 10)}
      />
    </>
  );
};

// Fiorelli's method as a section through the ash: a void, plaster poured in, then lifted out and
// reworked. The void is a plain shape on purpose (C1), and the label says it is a diagram.
const blob = (cx: number, cy: number, k: number) => {
  const A = [1, 0.82, 0.95, 0.7, 0.9, 1.05, 0.8, 0.92, 0.75, 1];
  const B = [0.9, 1, 0.78, 0.95, 0.72, 0.9, 1.05, 0.7, 0.98, 0.9];
  const pts = A.map((a, i) => {
    const t = (i / A.length) * Math.PI * 2;
    const r = a + (B[i] - a) * k;
    return [cx + Math.cos(t) * 230 * r, cy + Math.sin(t) * 95 * r];
  });
  const mids = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  });
  return `M${mids[mids.length - 1].join(",")} ` + pts.map((p, i) => `Q${p.join(",")} ${mids[i].join(",")}`).join(" ") + " Z";
};

const Pour: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const fill = ease(ramp(f, F.pouring + 4, F.hollows + 24));
  const stream = ramp(f, F.pouring - 2, F.pouring + 6) * (1 - ramp(f, F.hollows + 20, F.hollows + 28));
  const lift = ease(ramp(f, F.over - 6, F.over + 14));
  const rework = ease(ramp(f, F.reworked, F.reworked + 24));
  const out = ramp(f, F.dna2 - 8, F.dna2 + 4);
  const cy = 560 - 260 * lift;
  const bands = ["#5b5148", "#6a5f52", "#574d43", "#665a4c", "#4e453c"];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - out }}>
      <Svg>
        <defs>
          <clipPath id="void">
            <path d={blob(960, cy, rework)} />
          </clipPath>
        </defs>
        <g opacity={1 - 0.85 * lift}>
          {bands.map((c, i) => (
            <rect key={i} x={560} y={300 + i * 110} width={800} height={110} fill={c} />
          ))}
        </g>
        <path d={blob(960, 560, 0)} fill="#1a1612" opacity={1 - lift} />
        {/* The plaster, rising from the bottom of the void. */}
        <rect x={700} y={cy + 100 - 200 * fill} width={520} height={200 * fill + 4} fill="#f2ede2" clipPath="url(#void)" />
        {lift > 0 ? <path d={blob(960, cy, 0)} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="8 8" opacity={rework * 0.8} /> : null}
        {stream > 0 ? <rect x={952} y={150} width={16} height={cy - 150} fill="#f2ede2" opacity={stream} /> : null}
        {lift > 0 ? <rect x={720} y={cy + 100} width={480} height={36} rx={4} fill="#3a332b" opacity={lift} /> : null}
      </Svg>
      <Tag {...at(L, [560, -170], [120, 160])} text="1863" sub={"Fiorelli: plaster poured\ninto voids in the ash"} from={F.made} to={F.over} subSize={32} />
      <Tag {...at(L, [560, -170], [120, 160])} text="SOME CASTS REWORKED" sub={"by restorers over the years"} from={F.reworked} to={F.dna2} subSize={32} />
      <Tag {...at(L, [560, 760], [1370, 600])} text="TO TELL A STORY?" sub={"possibly\nPilli et al. 2024"} from={F.possibly} to={F.dna2} subSize={32} />
      <Note {...at(L, [560, 880], [560, 880])} text="diagram, not to scale" o={ramp(f, F.casts, F.casts + 10)} size={28} color="#8a8070" />
    </div>
  );
};

// The close: both old labels, struck through, and what the DNA can and cannot say.
const Labels: React.FC<{ L: Layout; f: number }> = ({ L, f }) => {
  const a = ease(ramp(f, F.dna2 - 4, F.dna2 + 10));
  const b = ease(ramp(f, F.dna2 + 4, F.dna2 + 18));
  return (
    <>
      <div style={{ translate: `0 ${(1 - a) * 40}px`, opacity: a }}>
        <Placard {...at(L, [580, 0], [300, 230])} w={L.vertical ? 560 : 560} title="MOTHER" sub="1974" strike={1} scale={0.95} />
      </div>
      <div style={{ translate: `0 ${(1 - b) * 40}px`, opacity: b }}>
        <Placard {...at(L, [700, 300], [1060, 230])} w={L.vertical ? 600 : 560} title="SISTERS?" sub="1914" strike={1} scale={0.95} />
      </div>
      <Tag {...at(L, [600, 620], [700, 600])} text="WHO WERE THEY?" sub={"DNA can't say"} from={F.who} subSize={34} />
    </>
  );
};

const PompeiiScene: React.FC<{ L: Layout }> = ({ L }) => {
  const f = useCurrentFrame();
  return (
    <>
      <Layer o={vis(f, SHOTS.plan1)}>
        <Plan1 L={L} f={f} />
      </Layer>
      <Layer o={vis(f, SHOTS.plan2)}>
        <Plan2 L={L} f={f} />
      </Layer>
      <Layer o={vis(f, SHOTS.pour)}>
        <Pour L={L} f={f} />
      </Layer>
      <Layer o={vis(f, SHOTS.labels)}>
        <Labels L={L} f={f} />
      </Layer>
    </>
  );
};

const Backdrop: React.FC = () => <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: WALL }} />;

export const pompeiiCasts: Short = {
  slug: "pompeii-casts",
  title: "DNA says Pompeii's 'mother' was a man",
  edit,
  looks: [{ id: "Illustrated", Set: Backdrop, cast: () => [] }],
  props: (L) => <PompeiiScene L={L} />,
  ui: () => <Stamp at={F.guesses + 6} to={F.end + 10} text="GUESSES" />,
  music: "history",
  sfx: [
    { at: F.man, name: "thud", volume: 0.25 },
    { at: F.male, name: "thud", volume: 0.25 },
    { at: F.guesses + 6, name: "thud", volume: 0.3 },
  ],
};
