import React from "react";
import type { Layout } from "../../layout";
import coast from "./coast.json";

// Real coastlines (Natural Earth, public domain; cut by tools/coast.mjs), so the distance line and
// the places on it are where they are (A6). Equirectangular with longitude shrunk by cos(54.5°):
// across Britain that keeps shapes and distances within a few percent, which a label like "700+ km"
// does not need more than.
const K = Math.cos((54.5 * Math.PI) / 180);

export type View = { lon: number; lat: number; z: number };
export type Project = (lon: number, lat: number) => [number, number];

// Where the map sits on the stage in each crop: under the 9:16 captions (stage y ~1000), and above
// the 16:9 caption line (y ~950).
const frameFor = (L: Layout) => (L.vertical ? { cx: 960, cy: 420, s: 112 } : { cx: 960, cy: 470, s: 84 });

export const projector = (L: Layout, v: View): Project => {
  const { cx, cy, s } = frameFor(L);
  const k = s * v.z;
  return (lon, lat) => [cx + (lon - v.lon) * k * K, cy - (lat - v.lat) * k];
};

// Places the script names, by the coordinates their sources give.
export const PLACES = {
  stonehenge: [-1.826, 51.179] as [number, number],
  // The Orcadian Basin's onshore heart: Caithness, Orkney and the Moray Firth shore. A marker, not
  // a boundary: the on-screen label says "approx.".
  northeast: [-3.4, 58.3] as [number, number],
  // Dogger Bank, Marine Regions gazetteer MRGID 2395 (54.833 N, 2.333 E). The bank is far larger
  // than a pin; the label says "approx.".
  dogger: [2.333, 54.833] as [number, number],
};

export const VIEWS = {
  uk: { lon: -2.6, lat: 54.6, z: 1 },
  ne: { lon: -3.4, lat: 58.1, z: 3.1 },
};

const RINGS = coast as [number, number][][];

export const Coast: React.FC<{ P: Project; z: number }> = ({ P, z }) => {
  const d = RINGS.map((r) => "M" + r.map(([lon, lat]) => P(lon, lat).map((n) => n.toFixed(1)).join(" ")).join("L") + "Z").join("");
  return (
    <svg style={{ position: "absolute", left: -1000, top: -1000, overflow: "visible" }} width={1} height={1}>
      <g transform="translate(1000 1000)">
        <path d={d} fill="#3a3024" stroke="#cdb68a" strokeWidth={2.2 / Math.sqrt(z)} strokeLinejoin="round" />
      </g>
    </svg>
  );
};

// Sea, wide enough to fill either crop at any zoom.
export const Sea: React.FC = () => (
  <div style={{ position: "absolute", left: -600, top: -700, width: 3120, height: 2600, background: "radial-gradient(ellipse at 50% 40%, #16303a 0%, #0b1a21 55%, #060d11 100%)" }} />
);

// One SVG layer for lines and shapes drawn in map coordinates, in the same stage space as the coast.
export const Ink: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg style={{ position: "absolute", left: -1000, top: -1000, overflow: "visible" }} width={1} height={1}>
    <g transform="translate(1000 1000)">{children}</g>
  </svg>
);

// A polyline through map points, drawn on from 0 to t (0–1) by its own length.
export const Route: React.FC<{ P: Project; pts: [number, number][]; t: number; color: string; width: number; dash?: string; opacity?: number }> = ({
  P,
  pts,
  t,
  color,
  width,
  dash,
  opacity = 1,
}) => {
  if (t <= 0) return null;
  const xy = pts.map(([lon, lat]) => P(lon, lat));
  const segs = xy.slice(1).map((p, i) => Math.hypot(p[0] - xy[i][0], p[1] - xy[i][1]));
  let left = segs.reduce((a, b) => a + b, 0) * Math.min(1, t);
  const out: [number, number][] = [xy[0]];
  for (let i = 0; i < segs.length && left > 0; i++) {
    const k = Math.min(1, left / segs[i]);
    out.push([xy[i][0] + (xy[i + 1][0] - xy[i][0]) * k, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * k]);
    left -= segs[i];
  }
  return (
    <polyline
      points={out.map((p) => p.join(",")).join(" ")}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dash}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
};
