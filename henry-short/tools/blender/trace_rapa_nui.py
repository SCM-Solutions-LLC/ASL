"""Trace Rapa Nui's coastline, peaks and Rano Kau's crater lake from NASA GIBS images (public domain):
SRTM_Color_Index (land mask, relative height) and the Landsat WELD 2000 annual true-colour composite.
Both requested for the same EPSG:4326 box, so pixels map to lat/lon directly. Output in the model's
metres: x east, y north, Rano Raraku (LH25's quarry centroid, -27.125175, -109.288170) at (6300, 0).
moai_world.py reads the result, tools/blender/rapa_nui_trace.json, for the map beat.

  B="-27.235,-109.47,-27.025,-109.20"; G="https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&CRS=EPSG:4326&BBOX=$B&WIDTH=1800&HEIGHT=1400&FORMAT=image/png&STYLES="
  curl -o DIR/SRTM_Color_Index.png "$G&LAYERS=SRTM_Color_Index"
  curl -o DIR/Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual.png "$G&LAYERS=Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual&TIME=2000-12-01"
  python3 tools/blender/trace_rapa_nui.py DIR      # needs numpy and Pillow; then copy DIR/trace.json here
"""
import json
import math
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw

D = sys.argv[1]
LAT_TOP, LAT_BOT, LON_L, LON_R = -27.025, -27.235, -109.47, -109.20
W, H = 1800, 1400
LAT0, LON0 = -27.125175, -109.288170
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574


def px_to_model(px, py):
    lon = LON_L + (px + 0.5) / W * (LON_R - LON_L)
    lat = LAT_TOP - (py + 0.5) / H * (LAT_TOP - LAT_BOT)
    return 6300 + (lon - LON0) * KX, (lat - LAT0) * KY


def model_to_px(x, y):
    lon = LON0 + (x - 6300) / KX
    lat = LAT0 + y / KY
    return (lon - LON_L) / (LON_R - LON_L) * W - 0.5, (LAT_TOP - lat) / (LAT_TOP - LAT_BOT) * H - 0.5


srtm = np.asarray(Image.open(f"{D}/SRTM_Color_Index.png").convert("RGBA")).astype(int)
land = (srtm[..., 3] > 0) & (srtm[..., :3].sum(-1) > 30)
elev = srtm[..., 1]  # green rises with height in this colour index

# the island: the land component holding Terevaka (the brightest pixel)
seed = np.unravel_index(np.argmax(np.where(land, elev, -1)), land.shape)
comp = np.zeros_like(land)
q = deque([seed])
comp[seed] = True
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        yy, xx = y + dy, x + dx
        if 0 <= yy < H and 0 <= xx < W and land[yy, xx] and not comp[yy, xx]:
            comp[yy, xx] = True
            q.append((yy, xx))

# Moore-neighbour trace of the component's outer boundary
ys, xs = np.nonzero(comp)
start = (ys[np.argmin(xs)], xs.min())  # leftmost pixel
nb = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
cur, back = start, 6  # came from the west
boundary = [start]
for _ in range(200000):
    for k in range(8):
        d = (back + 1 + k) % 8
        yy, xx = cur[0] + nb[d][0], cur[1] + nb[d][1]
        if 0 <= yy < H and 0 <= xx < W and comp[yy, xx]:
            back = (d + 4) % 8
            cur = (yy, xx)
            break
    if cur == start:
        break
    boundary.append(cur)

pts = np.array([px_to_model(x, y) for y, x in boundary])
# smooth the pixel staircase along the closed boundary (9 px, ~135 m) before simplifying
K = 9
pts = np.stack([np.convolve(np.concatenate([p[-K:], p, p[:K]]), np.ones(K) / K, "same")[K:-K] for p in pts.T], 1)


def dp(p, tol):
    """Douglas-Peucker on a polyline."""
    if len(p) < 3:
        return p
    a, b = p[0], p[-1]
    ab = b - a
    n = np.hypot(*ab) or 1.0
    d = np.abs(ab[0] * (p[:, 1] - a[1]) - ab[1] * (p[:, 0] - a[0])) / n
    i = int(np.argmax(d))
    if d[i] > tol:
        return np.vstack([dp(p[: i + 1], tol)[:-1], dp(p[i:], tol)])
    return np.vstack([a, b])


TOL = 120.0  # metres: finer than anything the map, seen from 40 km, can show
far = int(np.argmax(np.hypot(*(pts - pts[0]).T)))
coast = np.vstack([dp(pts[: far + 1], TOL)[:-1], dp(np.vstack([pts[far:], pts[:1]]), TOL)[:-1]])
area = 0.5 * abs(np.dot(coast[:, 0], np.roll(coast[:, 1], 1)) - np.dot(coast[:, 1], np.roll(coast[:, 0], 1))) / 1e6

# peaks: Terevaka (highest), Poike (highest east of x = 8500)
mx, my = np.meshgrid(np.arange(W), np.arange(H))
MXY = np.array(px_to_model(mx, my))
e = np.where(comp, elev, -1)
ter = np.unravel_index(np.argmax(e), e.shape)
poi = np.unravel_index(np.argmax(np.where(MXY[0] > 8500, e, -1)), e.shape)

# Rano Kau's crater lake: the dark water inside the crater, in the Landsat composite
ls = np.asarray(Image.open(f"{D}/Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual.png").convert("RGB")).astype(int)
dark = comp & (ls.sum(-1) < 160) & (MXY[0] < -6000) & (MXY[1] < -5500)
ky, kx = np.nonzero(dark)
kau = px_to_model(kx.mean(), ky.mean())
kau_r = math.sqrt(dark.sum() / math.pi) * (LON_R - LON_L) / W * KX

out = {
    "source": "NASA GIBS (public domain): SRTM_Color_Index and Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual (2000-12-01), EPSG:4326 box lat -27.235..-27.025, lon -109.47..-109.20, 1800x1400",
    "coast": [[round(x), round(y)] for x, y in coast],
    "area_km2": round(area, 1),
    "peaks": {"terevaka": [round(v) for v in px_to_model(ter[1], ter[0])], "poike": [round(v) for v in px_to_model(poi[1], poi[0])]},
    "lakes": {"rano_kau": [round(kau[0]), round(kau[1]), round(kau_r)]},
}
# islets: the other land components in the mask (Motu Nui and Motu Iti merge at this resolution)
lab = np.zeros(land.shape, int)
comps = []
for y0, x0 in zip(*np.nonzero(land & ~comp)):
    if lab[y0, x0]:
        continue
    lab[y0, x0] = len(comps) + 1
    q, cell = deque([(y0, x0)]), []
    while q:
        y, x = q.popleft()
        cell.append((y, x))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and land[yy, xx] and not comp[yy, xx] and not lab[yy, xx]:
                lab[yy, xx] = lab[y0, x0]
                q.append((yy, xx))
    comps.append(np.array(cell))
px_m = (LON_R - LON_L) / W * KX
out["islets"] = [[round(v) for v in px_to_model(c[:, 1].mean(), c[:, 0].mean())] + [round(math.sqrt(len(c) / math.pi) * px_m)] for c in sorted(comps, key=len, reverse=True)[:5]]
json.dump(out, open(f"{D}/trace.json", "w"), indent=1)
print(len(out["coast"]), "points, area", out["area_km2"], "km2", out["peaks"], out["lakes"])

# overlay to check by eye: traced outline (red), peaks (yellow), lake (cyan), Rano Raraku (magenta)
img = Image.open(f"{D}/Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual.png").convert("RGB")
dr = ImageDraw.Draw(img)
dr.line([model_to_px(x, y) for x, y in out["coast"]] + [model_to_px(*out["coast"][0])], fill=(255, 40, 40), width=3)
for name, (x, y) in out["peaks"].items():
    u, v = model_to_px(x, y)
    dr.ellipse((u - 9, v - 9, u + 9, v + 9), outline=(255, 230, 0), width=3)
u, v = model_to_px(kau[0], kau[1])
rp = kau_r / KX / (LON_R - LON_L) * W
dr.ellipse((u - rp, v - rp, u + rp, v + rp), outline=(0, 255, 255), width=3)
u, v = model_to_px(6300, 0)
dr.ellipse((u - 9, v - 9, u + 9, v + 9), outline=(255, 0, 255), width=3)
img.save(f"{D}/trace_overlay.png")
