// Cut the coastlines the altar-stone map draws out of Natural Earth (public domain).
// Run: node tools/coast.mjs <path to ne_10m_admin_0_countries.geojson>
// Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson
// Writes src/shorts/altar-stone/coast.json: rings of [lon, lat], simplified, rounded to 0.001°.
import { readFileSync, writeFileSync } from "node:fs";

const KEEP = new Set(["GBR", "IRL", "IMN", "FRA", "BEL", "NLD", "LUX", "DEU", "DNK", "NOR"]);
// shortcut: points are clamped to this box rather than clipped, so the box edge draws as a straight
// line; it lies outside both crops of the map. Clip properly if the map is ever framed wider.
const BOX = { w: -25, e: 20, s: 45, n: 63 };
const TOL = 0.012; // degrees, in a frame with longitude shrunk by cos(54.5°)
const MIN_AREA = 0.004; // square degrees: drops islets nobody can see at this scale
const K = Math.cos((54.5 * Math.PI) / 180);

const clamp = ([x, y]) => [Math.min(BOX.e, Math.max(BOX.w, x)), Math.min(BOX.n, Math.max(BOX.s, y))];

const simplify = (pts) => {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = [pts[a][0] * K, pts[a][1]];
    const [bx, by] = [pts[b][0] * K, pts[b][1]];
    const len = Math.hypot(bx - ax, by - ay);
    let far = -1;
    let at = -1;
    for (let i = a + 1; i < b; i++) {
      // A closed ring starts and ends on one point, so there the distance is to that point.
      const d = len < 1e-9
        ? Math.hypot(pts[i][0] * K - ax, pts[i][1] - ay)
        : Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0] * K) * (by - ay)) / len;
      if (d > far) [far, at] = [d, i];
    }
    if (far > TOL) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};

const area = (r) => Math.abs(r.reduce((s, [x, y], i) => {
  const [x2, y2] = r[(i + 1) % r.length];
  return s + x * y2 - x2 * y;
}, 0)) / 2;

const geo = JSON.parse(readFileSync(process.argv[2], "utf8"));
const rings = [];
for (const f of geo.features) {
  if (!KEEP.has(f.properties.ADM0_A3)) continue;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const [outer] of polys) {
    if (!outer.some(([x, y]) => x > BOX.w && x < BOX.e && y > BOX.s && y < BOX.n)) continue;
    if (area(outer) < MIN_AREA) continue;
    const r = simplify(outer.map(clamp)).map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
    if (r.length >= 4) rings.push(r);
  }
}
console.assert(rings.length > 10, "expected the British Isles and the near continent");
writeFileSync("src/shorts/altar-stone/coast.json", JSON.stringify(rings));
console.log(`coast.json: ${rings.length} rings, ${rings.reduce((n, r) => n + r.length, 0)} points`);
