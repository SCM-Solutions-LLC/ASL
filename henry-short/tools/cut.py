"""Cut public-domain portraits into cut-out rig parts.

All coordinates are source-image pixels. Each part is saved as a PNG with a soft (anti-aliased) edge;
a manifest records each part's box, pivot and attachment point for the Remotion rig.
Run: python3 -I tools/cut.py   (from the project root)
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

SRC = Path("kit_src")
OUT = Path("public/kit/pd")
FEATHER = 1.1  # px of edge softening, inward only, so no background colour fringes


def poly_mask(shape, pts):
    m = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
    return np.array(m) > 0


def grow(mask, px):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * px + 1, 2 * px + 1))
    return cv2.dilate(mask.astype(np.uint8), k) > 0


def shrink(mask, px):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * px + 1, 2 * px + 1))
    return cv2.erode(mask.astype(np.uint8), k) > 0


def inpaint(rgb, hole):
    return cv2.inpaint(rgb, hole.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)


def not_dark_bg(rgb):
    """Anne's background is near-black; keep everything brighter or more saturated."""
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    keep = (rgb.max(axis=2) > 48) | (hsv[..., 1] > 110)
    keep = cv2.morphologyEx(keep.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    return keep > 0


def largest(mask):
    """Keep the biggest blob and fill its holes, dropping background speckle."""
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    if n <= 1:
        return mask
    blob = (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    cnts, _ = cv2.findContours(blob, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(blob)
    cv2.drawContours(filled, cnts, -1, 1, thickness=-1)
    return filled > 0


def refine(rgb, rough, band=10):
    """Snap a hand-drawn outline to the painted edge with GrabCut, searching only near the outline."""
    gc = np.full(rough.shape, cv2.GC_BGD, np.uint8)
    gc[grow(rough, band)] = cv2.GC_PR_BGD
    gc[rough] = cv2.GC_PR_FGD
    gc[shrink(rough, band)] = cv2.GC_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    out = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
    out = cv2.morphologyEx(out, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    out = cv2.morphologyEx(out, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    # Edges may tighten freely but grow at most 2px past the hand-drawn outline (no background creep).
    return largest((out > 0) & grow(rough, 2))


def save_part(rgb, mask, path):
    """Crop the part to its box with a soft edge. Returns the box origin and size."""
    alpha = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), FEATHER) * mask
    img = np.zeros((*rgb.shape[:2], 4), np.uint8)
    img[..., :3] = rgb
    img[..., 3] = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    ys, xs = np.where(mask)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    Image.fromarray(img[y0:y1, x0:x1]).save(path)
    return int(x0), int(y0), int(x1 - x0), int(y1 - y0)


def lids(rgb, eyes, skin_at, size):
    """Paint closed eyelids (skin colour + lash line) over the given eye centres."""
    out = Image.fromarray(rgb.copy())
    d = ImageDraw.Draw(out)
    sx, sy = skin_at
    skin = tuple(int(c) for c in rgb[sy - 3:sy + 3, sx - 3:sx + 3].reshape(-1, 3).mean(axis=0))
    w, h = size
    for cx, cy in eyes:
        d.ellipse([cx - w, cy - h, cx + w, cy + h], fill=skin)
        d.arc([cx - w, cy - h, cx + w, cy + h + 2], 20, 160, fill=(60, 35, 25), width=2)
    return np.array(out)


manifest = {}

# ---------------- Henry VIII (full length, after Holbein, Walker Art Gallery) ----------------
rgb = np.array(Image.open(SRC / "henry.jpg").convert("RGB"))
H = rgb.shape[:2]
silhouette = poly_mask(H, [
    (300, 82), (345, 85), (380, 98), (398, 118), (398, 140), (380, 160), (372, 190), (365, 215), (362, 230),
    (430, 240), (480, 262), (522, 290), (536, 330), (538, 420), (528, 470), (530, 560), (535, 595), (558, 612),
    (532, 630), (528, 700), (532, 725), (470, 738), (428, 745), (420, 800), (418, 860), (430, 920), (480, 950),
    (530, 985), (528, 1000), (470, 998), (425, 990), (400, 975), (395, 930), (380, 870), (365, 810), (348, 778),
    (300, 770), (258, 778), (250, 820), (240, 880), (228, 940), (225, 975), (220, 1005), (185, 1010), (155, 1000),
    (160, 985), (178, 960), (185, 900), (190, 840), (195, 790), (190, 755), (85, 745), (80, 700), (78, 640),
    (74, 560), (70, 470), (68, 400), (70, 320), (72, 272), (120, 252), (170, 240), (225, 233), (258, 230),
    (252, 215), (240, 195), (224, 188), (220, 160), (228, 135), (250, 110), (272, 92),
])
silhouette = refine(rgb, silhouette)
head = silhouette & poly_mask(H, [
    (300, 82), (345, 85), (380, 98), (398, 118), (398, 140), (380, 160), (372, 190), (365, 215), (358, 238),
    (330, 248), (290, 248), (262, 238), (252, 215), (240, 195), (224, 188), (220, 160), (228, 135), (250, 110), (272, 92),
])
jaw = poly_mask(H, [(275, 200), (345, 200), (352, 215), (348, 232), (315, 246), (285, 240), (270, 220)])
fore_l = poly_mask(H, [
    (108, 405), (165, 392), (205, 430), (245, 465), (270, 480), (295, 500), (298, 525), (285, 540), (255, 545),
    (245, 560), (228, 558), (232, 530), (215, 510), (175, 480), (135, 455), (105, 435),
]) & silhouette
fore_r = poly_mask(H, [
    (468, 382), (520, 390), (522, 440), (508, 490), (492, 540), (478, 575), (470, 595), (445, 598), (432, 585),
    (440, 560), (455, 520), (462, 470), (462, 420),
]) & silhouette

neck_y = 236
body = silhouette.copy()
body[:neck_y] &= ~head[:neck_y]
# Fill what moving parts uncover, staying 3px inside each part so its soft edge still sits on original paint.
below_neck = ~poly_mask(H, [(0, 0), (610, 0), (610, neck_y), (0, neck_y)])
body_rgb = inpaint(rgb, (shrink(head, 3) & below_neck | shrink(fore_l | fore_r, 3)) & body)

head_rgb = rgb.copy()
head_rgb[shrink(jaw, 3)] = (43, 13, 10)  # the dark mouth revealed when the jaw drops
head_closed = lids(head_rgb, [(293, 169), (334, 169)], (300, 183), (9, 5))

OUT.joinpath("henry").mkdir(parents=True, exist_ok=True)
parts = {}
pivots = {"body": (300, 1003), "head": (310, 240), "jaw": (310, 202), "foreL": (130, 415), "foreR": (492, 400)}
for pid, (img, m) in {
    "body": (body_rgb, body), "head": (head_rgb, head), "jaw": (rgb, jaw),
    "foreL": (rgb, fore_l), "foreR": (rgb, fore_r),
}.items():
    parts[pid] = {"box": save_part(img, m, OUT / "henry" / f"{pid}.png")}
save_part(head_closed, head, OUT / "henry" / "head_closed.png")
for pid, p in parts.items():
    p["pivot"] = pivots[pid]
manifest["henry"] = parts

# ---------------- Anne of Cleves (Holbein, Louvre) ----------------
rgb = np.array(Image.open(SRC / "anne.jpg").convert("RGB"))
H = rgb.shape[:2]
# Only the upper corners show background; below the shoulders the shadowed sleeves are as dark as it is.
fg = not_dark_bg(rgb)
fg[560:] = True
silhouette = poly_mask(H, [
    (410, 38), (470, 45), (530, 75), (565, 115), (578, 170), (578, 240), (570, 262), (612, 318), (600, 332),
    (540, 328), (505, 333), (505, 380), (560, 400), (650, 410), (740, 440), (800, 480), (829, 520), (829, 1106),
    (0, 1106), (0, 520), (30, 470), (110, 430), (200, 405), (265, 385), (325, 375), (330, 335), (270, 332),
    (213, 332), (220, 305), (248, 262), (240, 230), (232, 170), (240, 120), (275, 75), (340, 48),
]) & fg
head = poly_mask(H, [
    (410, 38), (470, 45), (530, 75), (565, 115), (578, 170), (578, 240), (570, 262), (612, 318), (600, 332),
    (540, 328), (500, 332), (480, 348), (420, 360), (370, 352), (335, 338), (310, 332), (270, 332), (213, 332),
    (220, 305), (248, 262), (240, 230), (232, 170), (240, 120), (275, 75), (340, 48),
]) & fg
neck_y = 335
body = largest(silhouette.copy())
body[:neck_y] = False
head = largest(head)
body_rgb = inpaint(rgb, shrink(head, 3) & body)
head_closed = lids(rgb, [(357, 191), (451, 191)], (400, 222), (21, 9))
head_wink = lids(rgb, [(451, 191)], (400, 222), (21, 9))

OUT.joinpath("anne").mkdir(parents=True, exist_ok=True)
parts = {
    "body": {"box": save_part(body_rgb, body, OUT / "anne" / "body.png"), "pivot": (414, 1106)},
    "head": {"box": save_part(rgb, head, OUT / "anne" / "head.png"), "pivot": (415, 345)},
}
save_part(head_closed, head, OUT / "anne" / "head_closed.png")
save_part(head_wink, head, OUT / "anne" / "head_wink.png")

# Her portrait stops at the waist: extend the gown downward from its last rows, flaring at the hem.
strip = rgb[1066:1106]
skirt_h, top_w, hem_w = 700, 829, 1000
tall = cv2.resize(strip, (top_w, skirt_h), interpolation=cv2.INTER_CUBIC)
src_q = np.float32([[0, 0], [top_w, 0], [top_w, skirt_h], [0, skirt_h]])
dst_q = np.float32([[(hem_w - top_w) / 2, 0], [(hem_w + top_w) / 2, 0], [hem_w, skirt_h], [0, skirt_h]])
warp = cv2.warpPerspective(tall, cv2.getPerspectiveTransform(src_q, dst_q), (hem_w, skirt_h))
shade = np.linspace(1.0, 0.85, skirt_h)[:, None, None]
warp = (warp * shade).astype(np.uint8)
skirt_mask = poly_mask(warp.shape[:2], dst_q.astype(int).tolist())
parts["skirt"] = {"box": save_part(warp, skirt_mask, OUT / "anne" / "skirt.png"), "pivot": (hem_w // 2, skirt_h)}
manifest["anne"] = parts
manifest["anne_skirt_top"] = [hem_w // 2, 0]  # skirt-space point where the body's waist pivot sits

# ---------------- Set pieces cut from the Henry painting's own background ----------------
# Remotion only waits for <Img> loads, so textures are pre-tiled to their on-stage size (stage units).
bg = np.array(Image.open(SRC / "henry.jpg").convert("RGB"))


def tile(crop, tile_wh, out_wh, name):
    t = Image.fromarray(crop).resize(tile_wh, Image.LANCZOS)
    out = Image.new("RGB", out_wh)
    for x in range(0, out_wh[0], tile_wh[0]):
        for y in range(0, out_wh[1], tile_wh[1]):
            out.paste(t, (x, y))
    out.save(OUT / name, quality=88)


tile(bg[1012:1089, :], (610, 154), (2720, 900), "carpet.jpg")
tile(bg[20:740, 8:58], (100, 1440), (2720, 1380), "wall.jpg")
tile(bg[0:900, 552:606], (108, 1800), (880, 1360), "damask.jpg")

Path("src/kit_pd.json").write_text(json.dumps(manifest, indent=1))
print(json.dumps({k: {p: v["box"] for p, v in d.items()} for k, d in manifest.items() if isinstance(d, dict)}, indent=0))
