import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// Jupiter from NASA's Cassini cylindrical map (PIA07782), projected onto a lit sphere pixel by pixel
// on a canvas: real cloud texture, rotation and foreshortening without a 3D dependency.
// shortcut: CPU projection costs ~50 ms a frame at 9:16 sizes; move to WebGL if a short needs 4K.

type Tex = { w: number; h: number; px: Uint8ClampedArray };
const cache = new Map<string, Promise<Tex>>();
const load = (src: string) => {
  let p = cache.get(src);
  if (!p) {
    p = new Promise<Tex>((ok, no) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const g = c.getContext("2d")!;
        g.drawImage(img, 0, 0);
        ok({ w: img.width, h: img.height, px: g.getImageData(0, 0, img.width, img.height).data });
      };
      img.onerror = () => no(new Error(`could not load ${src}`));
      img.src = staticFile(src);
    });
    cache.set(src, p);
  }
  return p;
};

export const MAP = "jupiter/cassini-2000.jpg";
export const MAP_NO_GRS = "jupiter/cassini-2000-no-grs.jpg";
// Where the Great Red Spot sits on that map, in map degrees (east-positive longitude, latitude).
export const GRS = { lon: 131, lat: -19.5 };

/** An oval painted onto the cloud tops, in map degrees, so it turns and foreshortens with the planet. */
export type Spot = { lon: number; lat: number; len: number; h: number; rgb: [number, number, number]; o: number; rim?: [number, number, number] };

type Props = {
  cx: number;
  cy: number;
  r: number;
  res: number; // canvas px per stage unit
  lon: number; // map longitude at the centre of the disc, degrees
  today: number; // 0 = map with the GRS cloned out, 1 = the map as Cassini saw it in 2000
  spots: Spot[];
  dim?: number;
};

const D = Math.PI / 180;

const sample = (t: Tex, u: number, v: number, out: number[], k: number) => {
  // Bilinear, wrapping in longitude.
  const x = u - 0.5;
  const y = Math.min(t.h - 1.001, Math.max(0, v - 0.5));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const xa = ((x0 % t.w) + t.w) % t.w;
  const xb = (xa + 1) % t.w;
  const i00 = (y0 * t.w + xa) * 4;
  const i10 = (y0 * t.w + xb) * 4;
  const i01 = ((y0 + 1) * t.w + xa) * 4;
  const i11 = ((y0 + 1) * t.w + xb) * 4;
  for (let c = 0; c < 3; c++) {
    const a = t.px[i00 + c] + (t.px[i10 + c] - t.px[i00 + c]) * fx;
    const b = t.px[i01 + c] + (t.px[i11 + c] - t.px[i01 + c]) * fx;
    out[c] += k * (a + (b - a) * fy);
  }
};

export const Planet: React.FC<Props> = ({ cx, cy, r, res, lon, today, spots, dim = 0 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tex, setTex] = useState<[Tex, Tex] | null>(null);
  const [handle] = useState(() => delayRender("Jupiter maps"));
  const done = useRef(false);
  useEffect(() => {
    Promise.all([load(MAP_NO_GRS), load(MAP)]).then(setTex, cancelRender);
  }, []);

  const size = Math.ceil(2 * r * res);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!tex || !cv) return;
    const [base, now] = tex;
    const g = cv.getContext("2d")!;
    const img = g.createImageData(size, size);
    const o = img.data;
    const half = size / 2;
    const lx = -0.42, ly = -0.32, lz = 0.85; // light from upper left, slightly behind the camera
    const px = [0, 0, 0];
    const live = spots.filter((s) => s.o > 0);
    for (let y = 0; y < size; y++) {
      const ny = (y + 0.5 - half) / half;
      for (let x = 0; x < size; x++) {
        const nx = (x + 0.5 - half) / half;
        const d2 = nx * nx + ny * ny;
        if (d2 >= 1) continue;
        const nz = Math.sqrt(1 - d2);
        const lat = Math.asin(-ny) / D;
        const ln = lon + Math.atan2(nx, nz) / D;
        const u = ((((ln / 360) % 1) + 1) % 1) * base.w;
        const v = (0.5 - lat / 180) * base.h;
        px[0] = px[1] = px[2] = 0;
        if (today < 1) sample(base, u, v, px, 1 - today);
        if (today > 0) sample(now, u, v, px, today);
        for (const s of live) {
          let dl = ln - s.lon;
          dl -= 360 * Math.round(dl / 360);
          const e = (dl / (s.len / 2)) ** 2 + ((lat - s.lat) / (s.h / 2)) ** 2;
          if (e > 1.25) continue;
          // Soft-edged body, darker toward the middle, with an optional thin rim.
          const body = Math.min(1, Math.max(0, (1 - e) / 0.35)) * s.o;
          for (let c = 0; c < 3; c++) px[c] += (s.rgb[c] * (1.08 - 0.16 * (1 - e)) - px[c]) * body;
          if (s.rim) {
            const ring = Math.max(0, 1 - Math.abs(e - 1) / 0.12) * s.o * 0.8;
            for (let c = 0; c < 3; c++) px[c] += (s.rim[c] - px[c]) * ring;
          }
        }
        const lambert = Math.max(0, nx * lx + ny * ly + nz * lz);
        const limb = 0.3 + 0.7 * Math.pow(nz, 0.5);
        const shade = (0.12 + 0.95 * limb * (0.35 + 0.65 * lambert)) * (1 - dim);
        const edge = Math.min(1, (1 - Math.sqrt(d2)) * half * 1.5);
        const i = (y * size + x) * 4;
        o[i] = px[0] * shade;
        o[i + 1] = px[1] * shade;
        o[i + 2] = px[2] * shade;
        o[i + 3] = 255 * edge;
      }
    }
    g.putImageData(img, 0, 0);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  });

  return (
    <>
      {/* Thin atmosphere glow just outside the limb. */}
      <div style={{ position: "absolute", left: cx - r * 1.12, top: cy - r * 1.12, width: r * 2.24, height: r * 2.24, borderRadius: "50%", background: `radial-gradient(circle closest-side, rgba(230,200,160,${0.22 * (1 - dim)}) 86%, rgba(230,200,160,0) 100%)` }} />
      <canvas ref={ref} width={size} height={size} style={{ position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r }} />
    </>
  );
};
