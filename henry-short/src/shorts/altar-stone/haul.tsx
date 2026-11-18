import React from "react";

// The overland idea from Parker Pearson 2024: a robust wooden sledge sliding on timber rails, hauled
// for months. It is a picture of a hypothesis, and the crew size is not known, which the on-screen
// label says (A6). Scale: a figure ~1.7 m stands 120 units, so 1 m = 70 units, and the slab is drawn
// at its measured 4.9 m long and 0.5 m thick (Clarke 2024), lying flat.
const M = 70;
const SLAB = { len: 4.9 * M, thick: 0.5 * M };

// Deterministic, so every render is the same render.
const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

type Row = { ground: number; scale: number; color: string; blur: number; count: number; gap: number };
// Front row darkest and sharpest; the rows behind are smaller, paler and softer, which is the haze.
const ROWS: Row[] = [
  { ground: 662, scale: 0.6, color: "#6d4038", blur: 1.6, count: 18, gap: 46 },
  { ground: 684, scale: 0.78, color: "#45261f", blur: 0.8, count: 15, gap: 56 },
  { ground: 724, scale: 1, color: "#170c08", blur: 0, count: 13, gap: 70 },
];

// Each hauler gets its own stride rate and phase: hauling in step is a picture of a drill, and the
// first version of this scene read as one figure copied down a line.
const GAIT = ROWS.map((r, ri) => {
  const next = rng(91 + ri * 17);
  return Array.from({ length: r.count }, () => ({ rate: 0.8 + next() * 0.4, phase: next() * Math.PI * 2, lean: 22 + next() * 12, jitter: next() * 10 - 5 }));
});

const Hauler: React.FC<{ x: number; y: number; s: number; f: number; rate: number; phase: number; lean: number; hand: [number, number]; color: string }> = ({
  x,
  y,
  s,
  f,
  rate,
  phase,
  lean,
  hand,
  color,
}) => {
  const th = (f * rate * Math.PI * 2) / 44 + phase;
  const swing = Math.sin(th);
  const bob = -Math.abs(Math.cos(th)) * 2.4 * s;
  const hip: [number, number] = [x, y - 62 * s + bob];
  const a = ((lean + Math.sin(th * 2) * 2) * Math.PI) / 180;
  const sh: [number, number] = [hip[0] - Math.sin(a) * 50 * s, hip[1] - Math.cos(a) * 50 * s];
  const head: [number, number] = [sh[0] - Math.sin(a) * 15 * s, sh[1] - Math.cos(a) * 15 * s];
  const foot = (k: number): [number, number] => [x + (-6 + 20 * k * swing) * s, y];
  const knee = (ft: [number, number]): [number, number] => [(hip[0] + ft[0]) / 2 - 7 * s, (hip[1] + ft[1]) / 2];
  const leg = (ft: [number, number]) => [hip, knee(ft), ft].map((p) => p.join(",")).join(" ");
  const elbow: [number, number] = [(sh[0] + hand[0]) / 2 + 4 * s, (sh[1] + hand[1]) / 2 + 6 * s];
  return (
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <polyline points={leg(foot(1))} strokeWidth={10 * s} />
      <polyline points={leg(foot(-1))} strokeWidth={10 * s} />
      {/* A belted tunic: a tapered torso and a short skirt read as a person, a single line as a stick. */}
      <polygon
        points={[
          [sh[0] - 9 * s, sh[1] + 2 * s],
          [sh[0] + 8 * s, sh[1] - 2 * s],
          [hip[0] + 8 * s, hip[1] + 12 * s],
          [hip[0] - 9 * s, hip[1] + 13 * s],
        ].map((p) => p.join(",")).join(" ")}
        fill={color}
        strokeWidth={5 * s}
      />
      <polyline points={[sh, elbow, hand].map((p) => p.join(",")).join(" ")} strokeWidth={7.5 * s} />
      <circle cx={head[0]} cy={head[1]} r={10 * s} fill={color} stroke="none" />
    </g>
  );
};

const Bird: React.FC<{ x: number; y: number; f: number; k: number }> = ({ x, y, f, k }) => {
  const w = Math.sin(f * 0.35 + k) * 6;
  return <path d={`M${x - 11},${y + w} Q${x - 5},${y - 3} ${x},${y} Q${x + 5},${y - 3} ${x + 11},${y + w}`} stroke="#2a1410" strokeWidth={2.4} fill="none" />;
};

const DUST = Array.from({ length: 40 }, (_, i) => {
  const next = rng(300 + i);
  return { x: next(), life: 36 + next() * 30, off: next() * 60, dx: 0.3 + next() * 0.6, size: 6 + next() * 12 };
});

export const Haul: React.FC<{ f: number }> = ({ f }) => {
  // The team inches left across the shot: a crawl, because the estimate is months, not minutes.
  const drift = -f * 0.45;
  const sledge = { x: 990 + drift, ground: 704 };
  const tow: [number, number] = [sledge.x - 6, sledge.ground - 26];

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080 }}>
      {/* Dusk sky, wider and taller than either crop. */}
      <div style={{ position: "absolute", left: -500, top: -700, width: 2920, height: 1360, background: "linear-gradient(#21122a 0%, #5e2733 38%, #b8502f 70%, #f19a4a 94%, #ffc77a 100%)" }} />
      <div style={{ position: "absolute", left: 1180, top: 380, width: 600, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,214,140,0.85) 0%, rgba(255,160,80,0.35) 35%, transparent 70%)" }} />
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1920} height={1080}>
        {/* Two hill lines for depth. */}
        <path d="M-500,640 C-200,600 100,612 400,598 C700,584 900,620 1200,604 C1500,588 1800,612 2420,600 L2420,700 L-500,700 Z" fill="#7a3b33" opacity={0.55} />
        <path d="M-500,660 C-100,640 300,652 700,636 C1000,626 1400,656 2420,640 L2420,720 L-500,720 Z" fill="#4a2522" opacity={0.75} />
        <rect x={-500} y={652} width={2920} height={900} fill="#24130d" />
        <rect x={-500} y={652} width={2920} height={60} fill="url(#hazeband)" />
        <defs>
          <linearGradient id="hazeband" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#c86a3e" stopOpacity={0.5} />
            <stop offset="1" stopColor="#c86a3e" stopOpacity={0} />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => (
          <Bird key={i} x={((f * (1.1 + i * 0.2) + i * 380) % 2400) - 300} y={140 + i * 46 + Math.sin(f / 30 + i) * 12} f={f} k={i * 1.7} />
        ))}

        {/* Back rows first, each with its own rope to the sledge. */}
        {ROWS.slice(0, 2).map((r, ri) => (
          <g key={ri} style={{ filter: r.blur ? `blur(${r.blur}px)` : undefined }}>
            <Team row={r} gait={GAIT[ri]} tow={tow} lead={sledge.x - 80} f={f} />
          </g>
        ))}

        {/* Timber rails ahead of and under the sledge, fixed to the ground as the team moves over them. */}
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={-300 + i * 230} y={sledge.ground + 2} width={214} height={9} rx={4} fill="#3b2316" />
        ))}

        {/* Sledge and slab, rim-lit by the low sun behind. */}
        <rect x={sledge.x - 10} y={sledge.ground - 22} width={SLAB.len + 30} height={18} rx={5} fill="#2c180e" />
        <rect x={sledge.x} y={sledge.ground - 22 - SLAB.thick} width={SLAB.len} height={SLAB.thick} rx={3} fill="#1b0f0a" />
        <rect x={sledge.x + 4} y={sledge.ground - 22 - SLAB.thick} width={SLAB.len - 8} height={3} rx={1.5} fill="#ffb066" opacity={0.75} />

        <Team row={ROWS[2]} gait={GAIT[2]} tow={tow} lead={sledge.x - 70} f={f} />

        {/* Dust kicked up along the front row. */}
        {DUST.map((d, i) => {
          const t = ((f + d.off) % d.life) / d.life;
          const x = sledge.x - 60 - d.x * 900 + t * d.dx * 60;
          return (
            <circle key={i} cx={x} cy={ROWS[2].ground - t * 46} r={d.size * (0.5 + t)} fill="#c9875a" opacity={0.22 * Math.sin(Math.PI * t)} />
          );
        })}
      </svg>
    </div>
  );
};

// One row: haulers strung out ahead of the sledge, each gripping the rope where it passes them.
const Team: React.FC<{ row: Row; gait: (typeof GAIT)[number]; tow: [number, number]; lead: number; f: number }> = ({ row, gait, tow, lead, f }) => {
  const s = row.scale;
  const handY = row.ground - 82 * s;
  const far = lead - row.gap * (row.count + 1);
  // The rope runs from the sledge's tow point out past the last hauler at hand height.
  const ropeAt = (x: number): [number, number] => {
    const k = (tow[0] - x) / (tow[0] - far);
    return [x, tow[1] + (handY - tow[1]) * Math.min(1, k * 3.5)];
  };
  return (
    <>
      <polyline points={[tow, ropeAt(lead - row.gap * 0.5), [far, handY]].map((p) => p.join(",")).join(" ")} stroke={row.color} strokeWidth={3.2 * s} fill="none" opacity={0.9} />
      {gait.map((g, i) => {
        const x = lead - i * row.gap + g.jitter;
        return <Hauler key={i} x={x} y={row.ground} s={s} f={f} rate={g.rate} phase={g.phase} lean={g.lean} hand={ropeAt(x - 30 * s)} color={row.color} />;
      })}
    </>
  );
};
