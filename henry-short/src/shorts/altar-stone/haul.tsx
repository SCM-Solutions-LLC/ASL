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
  return Array.from({ length: r.count }, () => ({
    rate: 0.8 + next() * 0.4,
    phase: next() * Math.PI * 2,
    lean: 22 + next() * 12,
    jitter: next() * 10 - 5,
    // Bodies differ: build and height, hair, beard, how long the tunic is, and whether a cloak hangs.
    build: 0.85 + next() * 0.4,
    tall: 0.92 + next() * 0.16,
    hair: Math.floor(next() * 3), // 0 cropped, 1 long and loose, 2 tied back
    beard: next() < 0.55,
    hem: 0.7 + next() * 0.6,
    cloak: next() < 0.3,
  }));
});

type Look = (typeof GAIT)[number][number];
const pts = (p: [number, number][]) => p.map((q) => q.map((n) => n.toFixed(1)).join(",")).join(" ");
// A hauler in silhouette: shaped limbs, hands and feet, a belted tunic with an uneven hem, a head with
// hair and sometimes a beard or a cloak. Facing left, the way the team pulls.
const Hauler: React.FC<{ x: number; y: number; s: number; f: number; g: Look; hand: [number, number]; color: string }> = ({ x, y, s: s0, f, g, hand, color }) => {
  const s = s0 * g.tall;
  const b = g.build;
  const th = (f * g.rate * Math.PI * 2) / 44 + g.phase;
  const swing = Math.sin(th);
  const bob = -Math.abs(Math.cos(th)) * 2.4 * s;
  // Each heave dips the body: lean deepens on the push-off of every stride.
  const a = ((g.lean + Math.sin(th * 2) * 3 + Math.max(0, swing) * 3) * Math.PI) / 180;
  const hip: [number, number] = [x, y - 62 * s + bob];
  const along = (p: [number, number], d: number): [number, number] => [p[0] - Math.sin(a) * d * s, p[1] - Math.cos(a) * d * s];
  const sh = along(hip, 50);
  const neck = along(hip, 56);
  const head = along(hip, 66);
  const foot = (k: number): [number, number] => [x + (-6 + 22 * k * swing) * s, y];
  const knee = (ft: [number, number]): [number, number] => [(hip[0] + ft[0]) / 2 - 9 * s, (hip[1] + ft[1]) / 2 + 1 * s];
  // A limb as a tapered quad pair, thick at the top, so it reads as flesh rather than a line.
  const limb = (p0: [number, number], p1: [number, number], p2: [number, number], w0: number, w1: number, w2: number) => {
    const n = (u: [number, number], v: [number, number]) => {
      const dx = v[0] - u[0], dy = v[1] - u[1], l = Math.hypot(dx, dy) || 1;
      return [-dy / l, dx / l];
    };
    const [ax, ay] = n(p0, p1), [bx, by] = n(p1, p2);
    const L: [number, number][] = [
      [p0[0] + ax * w0, p0[1] + ay * w0], [p1[0] + (ax + bx) * 0.5 * w1, p1[1] + (ay + by) * 0.5 * w1], [p2[0] + bx * w2, p2[1] + by * w2],
      [p2[0] - bx * w2, p2[1] - by * w2], [p1[0] - (ax + bx) * 0.5 * w1, p1[1] - (ay + by) * 0.5 * w1], [p0[0] - ax * w0, p0[1] - ay * w0],
    ];
    return <polygon points={pts(L)} />;
  };
  const leg = (k: number) => {
    const ft = foot(k);
    const kn = knee(ft);
    return (
      <g key={k}>
        {limb(hip, kn, [ft[0], ft[1] - 3 * s], 7 * s * b, 5 * s * b, 3.2 * s)}
        {/* Foot, toes forward (left). */}
        <path d={`M${ft[0] + 4 * s},${y} Q${ft[0] + 3 * s},${y - 6 * s} ${ft[0] - 2 * s},${y - 5 * s} L${ft[0] - 11 * s},${y - 1.5 * s} Q${ft[0] - 12 * s},${y} ${ft[0] - 9 * s},${y} Z`} />
      </g>
    );
  };
  const elbow: [number, number] = [(sh[0] + hand[0]) / 2 + 3 * s, (sh[1] + hand[1]) / 2 + 7 * s];
  // Torso: a curved back and chest, wider with build, then a tunic skirt with a ragged hem.
  const back = along(hip, 30);
  const torso: [number, number][] = [
    [sh[0] - 7 * s * b, sh[1] + 4 * s],
    [back[0] - 9 * s * b, back[1] + 2 * s],
    [hip[0] - 9 * s * b, hip[1] + 4 * s],
    [hip[0] + 8 * s * b, hip[1] + 2 * s],
    [back[0] + 9 * s * b, back[1] - 3 * s],
    [sh[0] + 9 * s * b, sh[1] - 3 * s],
  ];
  const hemY = hip[1] + (14 + 10 * g.hem) * s;
  const sway = swing * 4 * s;
  const skirt: [number, number][] = [
    [hip[0] - 10 * s * b, hip[1] + 2 * s],
    [hip[0] + 9 * s * b, hip[1]],
    [hip[0] + 13 * s * b + sway, hemY - 2 * s],
    [hip[0] + 4 * s + sway, hemY + 2 * s],
    [hip[0] - 4 * s + sway, hemY - 1 * s],
    [hip[0] - 13 * s * b + sway, hemY + 1 * s],
  ];
  const tail = (k: number): [number, number] => [head[0] + (10 + k * 4) * s + Math.sin(th + k) * 1.5 * s, head[1] + (2 + k * 9) * s];
  return (
    <g fill={color} stroke={color} strokeLinejoin="round" strokeLinecap="round" strokeWidth={1.2 * s}>
      {g.cloak ? <path d={`M${sh[0] + 6 * s},${sh[1]} Q${hip[0] + 26 * s + sway * 2},${hip[1] - 10 * s} ${hip[0] + 22 * s + sway * 3},${hip[1] + 16 * s} L${hip[0] + 6 * s},${hip[1] + 4 * s} Z`} opacity={0.92} /> : null}
      {leg(-1)}
      {leg(1)}
      <polygon points={pts(torso)} />
      <polygon points={pts(skirt)} />
      {/* Belt. */}
      <line x1={hip[0] - 9 * s * b} y1={hip[1] + 3 * s} x2={hip[0] + 8 * s * b} y2={hip[1] + 1 * s} strokeWidth={2.5 * s} stroke="#000" strokeOpacity={0.25} />
      {limb(sh, elbow, hand, 4.4 * s * b, 3.4 * s, 2.6 * s)}
      <ellipse cx={hand[0]} cy={hand[1]} rx={3.6 * s} ry={3 * s} />
      {limb(neck, neck, head, 3.6 * s, 3.6 * s, 3.4 * s)}
      {/* Head, chin down into the effort; slightly longer front to back than a ball. */}
      <ellipse cx={head[0]} cy={head[1]} rx={8.6 * s} ry={9.8 * s} transform={`rotate(${(-a * 180) / Math.PI} ${head[0]} ${head[1]})`} />
      <path d={`M${head[0] - 8 * s},${head[1] + 1 * s} L${head[0] - 11 * s},${head[1] + 3 * s} L${head[0] - 8 * s},${head[1] + 5 * s} Z`} />
      {g.beard ? <path d={`M${head[0] - 8 * s},${head[1] + 4 * s} Q${head[0] - 9 * s},${head[1] + 13 * s} ${head[0] - 2 * s},${head[1] + 12 * s} Q${head[0] + 2 * s},${head[1] + 8 * s} ${head[0]},${head[1] + 5 * s} Z`} /> : null}
      {g.hair === 1 ? <path d={`M${head[0] - 2 * s},${head[1] - 9 * s} Q${head[0] + 12 * s},${head[1] - 8 * s} ${tail(1)[0]},${tail(1)[1]} L${tail(2)[0] - 3 * s},${tail(2)[1]} Q${head[0] + 4 * s},${head[1] + 6 * s} ${head[0] + 3 * s},${head[1]} Z`} /> : null}
      {g.hair === 2 ? <ellipse cx={tail(0)[0]} cy={tail(0)[1] - 2 * s} rx={4 * s} ry={3.5 * s} /> : null}
      {g.hair !== 0 ? <path d={`M${head[0] - 7 * s},${head[1] - 6 * s} Q${head[0]},${head[1] - 13 * s} ${head[0] + 8 * s},${head[1] - 5 * s}`} fill="none" strokeWidth={3 * s} /> : null}
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
        return <Hauler key={i} x={x} y={row.ground} s={s} f={f} g={g} hand={ropeAt(x - 30 * s)} color={row.color} />;
      })}
    </>
  );
};
