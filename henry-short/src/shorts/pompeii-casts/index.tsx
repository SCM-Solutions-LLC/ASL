import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { makeEdit } from "../../edit";
import { MARKER, SANS, SERIF } from "../../fonts";
import type { Layout } from "../../layout";
import alignment from "../../generated/pompeii-casts.alignment.json";
import { Tag as BaseTag } from "../../scenes/space";
import { Stamp } from "../../ui/Callouts";
import type { Short } from "../types";
import { clamp01, ease, FilmGrain, LightLeak, ramp } from "../altar-stone/shots";

// GUARDRAILS C1: these are real victims. No body and no cast is ever drawn or shown: people are the
// paper's numbered individuals, the cast is a plain plaster shape, and the short is about the labels,
// which is what the DNA overturned. The voice-over is Kokoro (`npm run tts -- pompeii-casts`) from
// script/pompeii-casts.txt, fact-checked in factcheck/pompeii-casts.json; every label below says only
// what that SOURCES block supports (A6). The photos are 1850s public-domain views of Pompeii (The Met,
// CC0), captioned as such, not pictures of the houses named.
const edit = makeEdit({
  alignment,
  keyPhrases: [["a", "mother."], ["a", "man,"], ["no", "sign"], ["sisters,"], ["genetically", "male."], ["possibly"], ["were", "guesses."]],
  breakAfter: ["bracelet,", "man,", "together,", "1863", "years,"],
});

const F = {
  gold: edit.at("gold"),
  child: edit.at("child"),
  long: edit.at("long"),
  dna: edit.at("dna"),
  man: edit.at("man"),
  sign: edit.at("sign"),
  two: edit.at("two"),
  embrace: edit.at("embrace"),
  sisters: edit.at("sisters"),
  mother2: edit.at("mother", 1),
  male: edit.at("male"),
  casts: edit.at("casts"),
  made: edit.at("made"),
  pouring: edit.at("pouring"),
  hollows: edit.at("hollows"),
  over: edit.at("over"),
  reworked: edit.at("reworked"),
  possibly: edit.at("possibly"),
  dna2: edit.at("dna", 1),
  who: edit.at("who"),
  guesses: edit.at("guesses"),
  end: edit.duration,
};

// Shot windows; each fades over 10 frames at both ends. The first starts before frame 0 so the hook
// opens on the photo and the label, not on a fade from black.
const SHOTS = {
  street: [-10, F.gold - 2],
  bracelet: [F.gold - 8, F.dna],
  dna: [F.dna - 8, F.two],
  corridor: [F.two - 8, F.casts],
  temple: [F.casts - 8, F.pouring],
  pour: [F.pouring - 8, F.over],
  rework: [F.over - 8, F.dna2],
  close: [F.dna2 - 8, F.end + 10],
} as const;
const vis = (f: number, [a, b]: readonly [number, number]) => Math.min(clamp01((f - a) / 10), clamp01((b - f) / 10));

const RED = "#d8392b";
const TEAL = "#5fe0d4";
const GOLD = "#f0c14b";
const CARD = "#efe4c8";
const INK = "#efe6d0";

const at = (L: Layout, v: [number, number], w: [number, number]) => (L.vertical ? { x: v[0], y: v[1] } : { x: w[0], y: w[1] });
const Tag: typeof BaseTag = (p) => <BaseTag subSize={36} {...p} />;

const Layer: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) =>
  o <= 0 ? null : <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>{children}</div>;

// Covers the whole set for both crops: x 0–1920 and the 9:16 slice's y −210 to 1364.
const Bg: React.FC<{ c: string }> = ({ c }) => <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: c }} />;

const Note: React.FC<{ x: number; y: number; text: string; o: number; size?: number; color?: string }> = ({ x, y, text, o, size = 32, color = "#d8ccb0" }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: SERIF, fontSize: size, color, opacity: o, whiteSpace: "pre", textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}>{text}</div>
  );

// A photo that covers the set, pushed in slowly about (ox, oy).
const Photo: React.FC<{ src: string; w: number; left: number; top: number; s: number; ox: number; oy: number; dim?: number }> = ({ src, w, left, top, s, ox, oy, dim = 0 }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${ox}px ${oy}px`, scale: `${s}` }}>
    <Img src={staticFile(src)} style={{ position: "absolute", left, top, width: w }} />
    <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: `radial-gradient(ellipse at ${ox}px ${oy}px, rgba(0,0,0,${0.15 + dim}) 30%, rgba(0,0,0,${0.7 + dim * 0.3}) 80%)` }} />
  </div>
);

// The museum label: the old reading, slammed in, struck through when the DNA comes in, with the
// correction written over it by hand.
const Placard: React.FC<{ x: number; y: number; w: number; title: string; sub: string; inT: number; strike: number; fix?: string; fixT?: number; size?: number }> = ({ x, y, w, title, sub, inT, strike, fix, fixT = 0, size = 92 }) =>
  inT <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: Math.min(1, inT * 3), scale: `${1.5 - 0.5 * ease(inT)}`, rotate: `${-2 + 2 * ease(inT)}deg`, background: CARD, borderRadius: 8, padding: "26px 34px", boxShadow: "0 18px 50px rgba(0,0,0,0.7)", border: "3px solid #b9a77c" }}>
      <div style={{ position: "relative", display: "inline-block", fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1, color: "#231a10", letterSpacing: 2 }}>
        {title}
        <div style={{ position: "absolute", left: -10, right: -10, top: "48%", height: 12, background: RED, borderRadius: 6, transformOrigin: "0 50%", scale: `${strike} 1` }} />
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 36, color: "#5a4a35", marginTop: 10, whiteSpace: "pre-line" }}>{sub}</div>
      {fix && fixT > 0 ? (
        <div style={{ position: "absolute", right: 20, bottom: -54, fontFamily: MARKER, fontSize: fix && fix.length > 6 ? 70 : 96, color: RED, rotate: "-7deg", opacity: fixT, scale: `${1.4 - 0.4 * fixT}`, textShadow: "0 3px 0 rgba(0,0,0,0.35)" }}>{fix}</div>
      ) : null}
    </div>
  );

// The paper's result for one individual: genetically male, or not determined.
const Chip: React.FC<{ x: number; y: number; text: string; o: number; color?: string; size?: number }> = ({ x, y, text, o, color = TEAL, size = 52 }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", opacity: o, scale: `${0.6 + 0.4 * ease(o)}`, padding: "8px 26px", borderRadius: 40, border: `5px solid ${color}`, background: "rgba(8,12,12,0.88)", fontFamily: SANS, fontWeight: 700, fontSize: size, color, whiteSpace: "nowrap", boxShadow: `0 0 30px ${color}55` }}>
      {text}
    </div>
  );

// A numbered disc: one person, nothing more.
const Mark: React.FC<{ x: number; y: number; n: number; r: number; o: number; glow?: string }> = ({ x, y, n, r, o, glow }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      {glow ? <circle cx={x} cy={y} r={r + 14} fill="none" stroke={glow} strokeWidth={6} opacity={0.8} /> : null}
      <circle cx={x} cy={y} r={r} fill="#2b241b" stroke={INK} strokeWidth={6} />
      <text x={x} y={y + r * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={r} fill={INK}>
        {n}
      </text>
    </g>
  );

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

// A gold band, turning slowly, with a glint that crosses it. Drawn generic on purpose: the source
// gives the bracelet's existence, not its design, so the label says it is an illustration.
const Bracelet: React.FC<{ f: number; s: number }> = ({ f, s }) => {
  const tilt = 0.32 + 0.06 * Math.sin(f / 18);
  const glint = ((f - SHOTS.bracelet[0]) % 50) / 50;
  return (
    <Svg>
      <defs>
        <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff2b8" />
          <stop offset="0.35" stopColor={GOLD} />
          <stop offset="0.7" stopColor="#9a6b16" />
          <stop offset="1" stopColor="#f5d06a" />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stopColor="rgba(255,210,110,0.55)" />
          <stop offset="1" stopColor="rgba(255,210,110,0)" />
        </radialGradient>
      </defs>
      <g transform={`translate(960 500) scale(${s})`}>
        <ellipse cx={0} cy={0} rx={520} ry={420} fill="url(#glow)" />
        <ellipse cx={0} cy={0} rx={300} ry={300 * tilt} fill="none" stroke="#5c3f0c" strokeWidth={70} />
        <ellipse cx={0} cy={-6} rx={300} ry={300 * tilt} fill="none" stroke="url(#gold)" strokeWidth={56} />
        <ellipse cx={0} cy={-18} rx={300} ry={300 * tilt} fill="none" stroke="#fff6d0" strokeWidth={6} opacity={0.7} />
        {/* Beading round the band. */}
        {Array.from({ length: 28 }, (_, i) => {
          const t = (i / 28) * Math.PI * 2 + f / 60;
          const front = Math.sin(t) > 0;
          return <circle key={i} cx={300 * Math.cos(t)} cy={300 * tilt * Math.sin(t) - 6} r={9} fill={front ? "#fff0b0" : "#8a5f14"} opacity={front ? 0.95 : 0.5} />;
        })}
        <ellipse cx={-300 + 600 * glint} cy={-6 + 120 * tilt * Math.sin(glint * Math.PI)} rx={46} ry={16} fill="#ffffff" opacity={0.75 * Math.sin(glint * Math.PI)} />
      </g>
    </Svg>
  );
};

// A double helix scrolling down the frame, drawn as two strands and their rungs.
const Helix: React.FC<{ f: number; cx: number; o: number }> = ({ f, cx, o }) => {
  const N = 34;
  const ph = f / 9;
  const pts = Array.from({ length: N }, (_, i) => {
    const y = -220 + i * 46;
    const a = ph + i * 0.42;
    return { y, x1: cx + 170 * Math.sin(a), x2: cx - 170 * Math.sin(a), d: Math.cos(a) };
  });
  return (
    <Svg>
      <g opacity={o}>
        {pts.map((p, i) => (
          <line key={`r${i}`} x1={p.x1} y1={p.y} x2={p.x2} y2={p.y} stroke={i % 2 ? GOLD : TEAL} strokeWidth={8} opacity={0.35 + 0.25 * Math.abs(p.d)} />
        ))}
        {pts.map((p, i) => (
          <React.Fragment key={`s${i}`}>
            <circle cx={p.x1} cy={p.y} r={13 + 5 * p.d} fill={TEAL} opacity={0.55 + 0.45 * p.d} />
            <circle cx={p.x2} cy={p.y} r={13 - 5 * p.d} fill={TEAL} opacity={0.55 - 0.45 * p.d} />
          </React.Fragment>
        ))}
      </g>
    </Svg>
  );
};

// A vaulted corridor in one-point perspective: the cryptoporticus, as an illustration.
const Corridor: React.FC<{ f: number }> = ({ f }) => {
  const vp = { x: 960, y: 470 };
  const drift = (f - SHOTS.corridor[0]) * 0.004;
  const arches = Array.from({ length: 8 }, (_, k) => Math.pow(0.72, k - drift)).filter((s) => s < 1.6);
  const arch = (s: number) => {
    const w = 760 * s;
    const h = 1100 * s;
    const x0 = vp.x - w / 2;
    const yb = vp.y + h * 0.42;
    const yt = yb - h + w / 2;
    return `M${x0},${yb} L${x0},${yt} A${w / 2},${w / 2} 0 0 1 ${x0 + w},${yt} L${x0 + w},${yb}`;
  };
  return (
    <Svg>
      <defs>
        <radialGradient id="lamp" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#7a5a34" />
          <stop offset="0.5" stopColor="#3a2a1a" />
          <stop offset="1" stopColor="#120d08" />
        </radialGradient>
      </defs>
      <rect x={-600} y={-700} width={3120} height={2600} fill="url(#lamp)" />
      {[-1, 1].map((d) => (
        <line key={d} x1={vp.x + d * 40} y1={vp.y + 60} x2={vp.x + d * 1400} y2={1400} stroke="#c8a878" strokeOpacity={0.25} strokeWidth={4} />
      ))}
      {arches.map((s, i) => (
        <path key={i} d={arch(s)} fill="none" stroke="#e2c99a" strokeWidth={Math.max(3, 26 * s)} opacity={0.15 + 0.6 * Math.min(1, s)} />
      ))}
    </Svg>
  );
};

// Fiorelli's method as a section through hardened ash. The void is a plain shape on purpose (C1).
const blob = (cx: number, cy: number, k: number, sx = 300, sy = 120) => {
  const A = [1, 0.82, 0.95, 0.7, 0.9, 1.05, 0.8, 0.92, 0.75, 1];
  const B = [0.86, 1.02, 0.74, 0.97, 0.7, 0.92, 1.06, 0.68, 0.98, 0.88];
  const pts = A.map((a, i) => {
    const t = (i / A.length) * Math.PI * 2;
    const r = a + (B[i] - a) * k;
    return [cx + Math.cos(t) * sx * r, cy + Math.sin(t) * sy * r];
  });
  const mids = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  });
  return `M${mids[mids.length - 1].join(",")} ` + pts.map((p, i) => `Q${p.join(",")} ${mids[i].join(",")}`).join(" ") + " Z";
};

const Section: React.FC<{ f: number }> = ({ f }) => {
  const fill = ease(ramp(f, F.pouring + 4, F.hollows + 26));
  const stream = ramp(f, F.pouring - 2, F.pouring + 6) * (1 - ramp(f, F.hollows + 22, F.hollows + 30));
  const bands = ["#6e6156", "#5d5248", "#776a5c", "#584d43", "#6a5d50", "#4f453c", "#625649"];
  return (
    <Svg>
      <defs>
        <filter id="ash">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.12" numOctaves={4} seed={3} />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id="void">
          <path d={blob(960, 600, 0)} />
        </clipPath>
      </defs>
      <rect x={-600} y={-700} width={3120} height={760} fill="#20180f" />
      {bands.map((c, i) => (
        <g key={i}>
          <rect x={-600} y={60 + i * 190} width={3120} height={190} fill={c} />
          <rect x={-600} y={60 + i * 190} width={3120} height={190} fill="#000" filter="url(#ash)" />
        </g>
      ))}
      <path d={blob(960, 600, 0)} fill="#120e0a" stroke="#2c241c" strokeWidth={10} />
      <rect x={600} y={600 + 140 - 280 * fill} width={720} height={280 * fill + 4} fill="#f4efe4" clipPath="url(#void)" />
      {stream > 0 ? (
        <>
          <rect x={948} y={-260} width={24} height={600 - 120 + 260} fill="#f4efe4" opacity={stream} />
          <path d="M890,-260 L1030,-260 L990,-180 L930,-180 Z" fill="#8a7a66" opacity={stream} />
        </>
      ) : null}
    </Svg>
  );
};

// The cast lifted out and reworked: the shape shifts under a restorer's tool, the old outline kept.
const Rework: React.FC<{ f: number }> = ({ f }) => {
  const k = ease(ramp(f, F.reworked, F.possibly + 20));
  const tap = Math.abs(Math.sin((f - F.reworked) / 3.2)) * ramp(f, F.reworked - 4, F.reworked) * (1 - ramp(f, F.possibly + 20, F.possibly + 26));
  const tx = 960 + 200 * Math.sin((f - F.reworked) / 22);
  return (
    <Svg>
      <defs>
        <radialGradient id="studio" cx="50%" cy="40%" r="65%">
          <stop offset="0" stopColor="#4a3d2e" />
          <stop offset="1" stopColor="#0f0b07" />
        </radialGradient>
      </defs>
      <rect x={-600} y={-700} width={3120} height={2600} fill="url(#studio)" />
      <rect x={600} y={640} width={720} height={60} rx={6} fill="#2a2119" />
      <rect x={640} y={700} width={640} height={420} fill="#1e1812" />
      <path d={blob(960, 520, k)} fill="#f2ede2" stroke="#c9bfae" strokeWidth={4} />
      <path d={blob(960, 520, 0)} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="12 10" opacity={0.85 * k} />
      {/* The restorer's tool: a plain spatula, tapping. */}
      <g transform={`translate(${tx} ${330 - 26 * tap}) rotate(-28)`} opacity={ramp(f, F.reworked - 6, F.reworked)}>
        <rect x={-10} y={-200} width={20} height={150} rx={8} fill="#7a5530" />
        <rect x={-7} y={-52} width={14} height={60} fill="#b8bec4" />
      </g>
    </Svg>
  );
};

const Credit: React.FC<{ L: Layout; text: string; o: number }> = ({ L, text, o }) => <Note {...at(L, [540, -196], [24, 14])} text={text} o={0.85 * o} size={L.vertical ? 24 : 26} />;

const PompeiiScene: React.FC<{ L: Layout }> = ({ L }) => {
  const f = useCurrentFrame();
  const v = L.vertical;
  return (
    <>
      {/* 1. The hook: Pompeii, and the old label. */}
      <Layer o={vis(f, SHOTS.street)}>
        <Photo src="img/pompeii-street-1853.jpg" w={2200} left={-140} top={-210} s={1 + 0.14 * ease(ramp(f, 0, SHOTS.street[1]))} ox={960} oy={560} />
        <Credit L={L} text={"Pompeii, c. 1853 · F.-E. Le Dien\nThe Met, public domain"} o={1} />
        <Placard {...at(L, [560, 120], [560, 300])} w={v ? 800 : 800} title="MOTHER" sub={"and child: the old reading"} inT={ramp(f, -6, 6)} strike={0} />
      </Layer>

      {/* 2. The bracelet that gave the house its name. */}
      <Layer o={vis(f, SHOTS.bracelet)}>
        <Bg c="#120d08" />
        <Bracelet f={f} s={v ? 0.95 + 0.08 * ease(ramp(f, F.gold, F.dna)) : 0.8 + 0.06 * ease(ramp(f, F.gold, F.dna))} />
        <Tag {...at(L, [560, -170], [110, 120])} text="A GOLD BRACELET" sub={"House of the Golden Bracelet\nfound 1974"} from={F.gold} to={F.dna} />
        <Svg>
          <Mark x={v ? 860 : 860} y={790} n={52} r={64} o={ramp(f, F.gold + 6, F.gold + 14)} />
          <Mark x={v ? 1110 : 1110} y={820} n={51} r={44} o={ramp(f, F.child - 6, F.child + 4)} />
        </Svg>
        <Note {...at(L, [560, 900], [1360, 760])} text={"illustration · numbers\nare the study's"} o={ramp(f, F.gold + 6, F.gold + 16)} size={30} color="#a89a7c" />
        <Placard {...at(L, [560, 120], [90, 300])} w={v ? 800 : 560} title="MOTHER" sub={"and child: the old reading"} inT={ramp(f, F.long, F.long + 10)} strike={0} size={74} />
      </Layer>

      {/* 3. The DNA. */}
      <Layer o={vis(f, SHOTS.dna)}>
        <Bg c="#071413" />
        <Helix f={f} cx={v ? 1240 : 1500} o={0.9} />
        <Tag {...at(L, [560, -170], [110, 120])} text="ANCIENT DNA" sub={"Pilli et al. 2024\nCurrent Biology"} from={F.dna} to={SHOTS.dna[1]} />
        <Placard {...at(L, [560, 120], [110, 330])} w={v ? 600 : 640} title="MOTHER" sub="the old reading" inT={1} strike={ease(ramp(f, F.man - 4, F.man + 6))} fix="A MAN" fixT={ramp(f, F.man + 2, F.man + 10)} size={80} />
        <Chip {...at(L, [860, 470], [430, 640])} text="52 · XY · male" o={ramp(f, F.man - 2, F.man + 8)} />
        <Svg>
          {(() => {
            const o = ramp(f, F.man + 10, F.man + 20);
            const snap = ease(ramp(f, F.sign, F.sign + 12));
            const [ax, bx, y] = v ? [700, 1020, 720] : [270, 590, 840];
            const m = (ax + bx) / 2;
            return o <= 0 ? null : (
              <g opacity={o}>
                <line x1={ax + 60} y1={y} x2={m - 40 * snap} y2={y + 30 * snap} stroke={snap > 0 ? RED : INK} strokeWidth={8} strokeDasharray="16 12" />
                <line x1={m + 40 * snap} y1={y - 30 * snap} x2={bx - 44} y2={y} stroke={snap > 0 ? RED : INK} strokeWidth={8} strokeDasharray="16 12" />
                <Mark x={ax} y={y} n={52} r={58} o={1} />
                <Mark x={bx} y={y} n={51} r={42} o={1} />
              </g>
            );
          })()}
        </Svg>
        <Note {...at(L, [600, 800], [170, 910])} text={"no sign of kinship\n(up to 3rd degree)"} o={ramp(f, F.sign, F.sign + 10)} size={40} color="#ff9e92" />
      </Layer>

      {/* 4. The second pair, in a vaulted corridor. */}
      <Layer o={vis(f, SHOTS.corridor)}>
        <Corridor f={f} />
        <Svg>
          {arcOf(f)}
          <Mark x={890} y={760} n={21} r={58} o={ramp(f, F.two, F.two + 8)} glow={f > F.male + 6 ? "#9a9080" : undefined} />
          <Mark x={1030} y={740} n={22} r={58} o={ramp(f, F.two + 3, F.two + 11)} glow={f > F.male ? TEAL : undefined} />
        </Svg>
        <Note {...at(L, [880, 560], [880, 560])} text="an embrace?" o={ramp(f, F.embrace, F.embrace + 10) * (1 - ramp(f, F.male, F.male + 8))} size={40} color={INK} />
        <Chip x={1090} y={850} text="22 · XY · male" o={ramp(f, F.male - 2, F.male + 8)} size={40} />
        <Chip x={v ? 760 : 760} y={850} text="21 · sex not found" o={ramp(f, F.male + 6, F.male + 14)} color="#b0a690" size={34} />
        <Tag {...at(L, [560, -170], [110, 120])} text="HOUSE OF THE CRYPTOPORTICUS" sub={"excavated 1914 · illustration"} from={F.two} to={F.sisters} />
        <Placard
          {...at(L, [560, 120], [110, 330])}
          w={v ? 800 : 620}
          title="SISTERS?"
          sub={f >= F.mother2 ? "or mother and daughter?\nthe 1914 reading" : "the 1914 reading"}
          inT={ramp(f, F.sisters - 6, F.sisters + 6)}
          strike={ease(ramp(f, F.male - 4, F.male + 6))}
          fix="ONE IS MALE"
          fixT={ramp(f, F.male + 2, F.male + 10)}
          size={80}
        />
      </Layer>

      {/* 5. 1863: how the casts were made. */}
      <Layer o={vis(f, SHOTS.temple)}>
        <Photo src="img/pompeii-jupiter-1851.jpg" w={2300} left={v ? 330 - 230 * ease(ramp(f, SHOTS.temple[0], SHOTS.temple[1])) : -190} top={-210} s={1.04} ox={960} oy={540} dim={0.45} />
        <Credit L={L} text={"Pompeii, Temple of Jupiter and Vesuvius, 1851\nA.-N. Normand · The Met, public domain"} o={1} />
        <Tag {...at(L, [560, 140], [110, 160])} text="1863" sub={"Fiorelli's method"} from={F.made - 4} to={SHOTS.temple[1]} />
      </Layer>
      <Layer o={vis(f, SHOTS.pour)}>
        <Section f={f} />
        <Tag {...at(L, [560, -170], [110, 120])} text="PLASTER, POURED" sub={"into the voids left in the ash"} from={F.pouring} to={SHOTS.pour[1]} />
        <Note {...at(L, [560, 900], [1360, 860])} text="diagram, not to scale" o={ramp(f, F.pouring, F.pouring + 10)} size={32} color="#e6dcc6" />
      </Layer>

      {/* 6. Reworked, possibly to tell a story. */}
      <Layer o={vis(f, SHOTS.rework)}>
        <Rework f={f} />
        <Tag {...at(L, [560, -170], [110, 120])} text="SOME CASTS REWORKED" sub={"by restorers over the years"} from={F.reworked} to={SHOTS.rework[1]} />
        <Tag {...at(L, [560, 800], [1360, 300])} text="TO TELL A STORY?" sub={"possibly · Pilli et al. 2024"} from={F.possibly} to={SHOTS.rework[1]} />
        <Note {...at(L, [560, 960], [1360, 860])} text="illustration" o={ramp(f, F.over, F.over + 10)} size={30} color="#a89a7c" />
      </Layer>

      {/* 7. The close: both old labels, struck through. */}
      <Layer o={vis(f, SHOTS.close)}>
        <Photo src="img/pompeii-street-1853.jpg" w={2200} left={-140} top={-210} s={1.14 + 0.06 * ease(ramp(f, SHOTS.close[0], F.end))} ox={960} oy={560} dim={0.35} />
        <Placard {...at(L, [560, -120], [160, 160])} w={v ? 620 : 640} title="MOTHER" sub="1974 reading" inT={ramp(f, F.dna2 - 4, F.dna2 + 8)} strike={1} size={76} />
        <Placard {...at(L, [640, 200], [1060, 260])} w={v ? 680 : 680} title="SISTERS?" sub="1914 reading" inT={ramp(f, F.dna2 + 4, F.dna2 + 16)} strike={1} size={76} />
        <Tag {...at(L, [600, 740], [700, 700])} text="WHO WERE THEY?" sub={"the DNA can't say"} from={F.who} />
      </Layer>

      <FilmGrain f={f} opacity={0.14} />
      <LightLeak f={f} at={SHOTS.street[1] - 4} />
      <LightLeak f={f} at={SHOTS.temple[0] + 4} />
      <LightLeak f={f} at={SHOTS.close[0] + 4} />
    </>
  );
};

// The arc read as an embrace, between 21 and 22; it fades once the DNA reading is in.
const arcOf = (f: number) => {
  const o = ramp(f, F.embrace - 4, F.embrace + 12) * (1 - 0.7 * ramp(f, F.male, F.male + 8));
  return o <= 0 ? null : <path d="M890,690 Q960,580 1030,670" fill="none" stroke={INK} strokeWidth={6} strokeDasharray="12 10" opacity={o} />;
};

export const pompeiiCasts: Short = {
  slug: "pompeii-casts",
  title: "DNA says Pompeii's 'mother' was a man",
  edit,
  looks: [{ id: "Illustrated", Set: () => <Bg c="#0d0a07" />, cast: () => [] }],
  props: (L) => <PompeiiScene L={L} />,
  ui: () => <Stamp at={F.guesses + 6} to={F.end + 10} text="GUESSES" />,
  music: "history",
  sfx: [
    { at: 2, name: "thud", volume: 0.3 },
    { at: SHOTS.street[1] - 10, name: "whoosh", volume: 0.25 },
    { at: F.man, name: "thud", volume: 0.25 },
    { at: F.male, name: "thud", volume: 0.25 },
    { at: SHOTS.temple[0], name: "whoosh", volume: 0.25 },
    { at: F.guesses + 6, name: "thud", volume: 0.3 },
  ],
};
