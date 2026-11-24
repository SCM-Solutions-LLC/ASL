"""The whole cleopatra-pyramid short as one 3D world: Giza, the Nile, Tura, the Red Sea harbour, and
a timeline laid out on the desert floor (a paved line of markers west of the pyramid; distance
along the ground = years, one linear scale, so nothing reads as buried).

Not part of `npm run setup`: run it with an installed Blender 5.3 (or the `bpy` wheel on Python 3.13).
  tools/blender/fetch_assets.sh                      # once: the CC0 texture scans and MakeHuman assets
  blender -b --factory-startup --python tools/blender/make_people.py   # once: the people (needs the MPFB add-on)
  blender -b --factory-startup --python tools/blender/cleopatra_world.py -- --out /tmp/world --width 540
  ffmpeg -framerate 30 -start_number 150 -i /tmp/world/%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p public/3d/cleopatra-world.mp4
It also writes src/generated/cleopatra-world.anchors.json: where each labelled thing lands on screen,
frame by frame, so the Remotion overlays (labels, counters, brackets) stick to the 3D objects.

Shapes are procedural; surfaces use CC0 scans from Poly Haven and the people are MakeHuman bodies
(CC0), all credited in public/SOURCES.json (D1).
Every beat hangs off a spoken word from src/generated/cleopatra-pyramid.alignment.json, like the
Remotion cut. What the world may show is set by script/cleopatra-pyramid.txt SOURCES and
review/cleopatra-pyramid.a6.md (A6):
- Casing: fine white limestone (Petrie 1883 sec. 107, ch. 18), drawn weathered to an off-white since
  no source says how white it still was in Cleopatra's day; small flat top; revealed by a
  top-down wipe, not built.
  Base 230.35 m and joints visible but fine: Petrie 1883 sec. 25-26 (cited in the A6 notes). The
  height is only a proportion; nothing on screen states it. The stepped core sits wholly inside
  the casing, so the cased pyramid is smooth to the top.
- The timeline is seen from straight above when two spans are compared, so both are to one scale.
- The landscape is compressed and says so ("not to scale"): Giza, the Nile, Tura on the opposite
  (east) bank, then the desert to the Red Sea. Papyri lie at rock-cut storage galleries inland,
  never on the beach.
- Diodorus is a generic traveller seen from behind, on the timeline at his own years and NOT at the
  pyramid: no source read puts him there (A5). Vegetables are generic. No silver, no coins.
- The timeline's road and markers are hidden whenever the picture shows the ancient site (the
  cased pyramid, the workforce, the inscription), so they cannot be read as part of it.
- The crowd is the true count Diodorus was told: 360,000 figures, all in frame in the widest shot.
"""
import argparse
import json
import math
import random
import sys
from pathlib import Path

import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Euler, Matrix, Vector

p = argparse.ArgumentParser()
p.add_argument("--out", required=True)
p.add_argument("--width", type=int, default=540)
p.add_argument("--samples", type=int, default=24)
p.add_argument("--start", type=int, help="first frame to render (default: the clip's first frame)")
p.add_argument("--end", type=int)
p.add_argument("--only", type=int, nargs="*", help="render just these frames (stills for checking)")
p.add_argument("--cpu", action="store_true")
p.add_argument("--no-anchors", action="store_true")
p.add_argument("--save", help="also save the .blend here")
p.add_argument("--cut-shift", type=int, default=0, help="move every cut this many frames (for cross-dissolves: render once at +H, and the frames around each cut again at -H)")
p.add_argument("--around-cuts", type=int, default=0, help="render only the frames within this many frames of a cut")
p.add_argument("--build-only", action="store_true", help="build the scene and stop (for probes)")
args = p.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else None)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ASSETS = HERE / "assets"
FPS = 30
CLIP_START = 150  # the clip's first frame in the edit; the photo covers the 5 s before it
WORDS = json.load(open(ROOT / "src/generated/cleopatra-pyramid.alignment.json"))["words"]
TAU = math.tau


def T(word, n=0):
    """Frame at which the n-th occurrence of a spoken word starts."""
    word = word.lower().strip(".,?:;!")
    hits = [w["start"] for w in WORDS if w["text"].lower().strip(".,?:;!") == word]
    return round(hits[n] * FPS)


END = round(WORDS[-1]["end"] * FPS) + round(1.6 * FPS)  # the edit's 1.6 s tail
random.seed(7)
rng = np.random.default_rng(7)

# ---------------------------------------------------------------- world constants (metres)
BASE, HEIGHT, TOP = 230.35, 146.6, 4.0  # Petrie's mean base; the height is a proportion only
# Masonry courses, shared by the stepped core and the casing joints (Petrie 1883 sec. 32: "the casing
# courses were on the same levels as the present core courses"). The base course is about 1.5 m
# (sec. 26); the rest are drawn at one even height under 1 m, about 200 of them. A person stands
# beside them for scale, so their size is a claim (A7 pass 4).
BASE_COURSE, NCOURSE = 1.5, 200
COURSE_H = (HEIGHT - BASE_COURSE) / NCOURSE
SLANT_F = math.hypot(HEIGHT, (BASE - TOP) / 2) / HEIGHT  # metres up the face per metre of height
X0, X1, Y0, Y1 = -2900.0, 5200.0, -2700.0, 4400.0
GAL_X, GAL_Y = 4050.0, 200.0  # rock-cut storage galleries: a cliff facing south
NILE = (1040.0, 1310.0)
TURA_X = 1660.0  # quarry cliff on the east bank, facing the river
SEA_X = 4540.0

# The timeline: a paved line running west from the pyramid's foot. Distance = years.
K = 0.25  # metres per year
BUILT, CLEO, MOON, FOUND, NOW_Y, FUTURE = -2599, -68, 1969, 2013, 2026, 6026  # astronomical years
TL0 = -BASE / 2 - 14.0  # x of "c. 2600 BC"


def tl(year):
    return Vector((TL0 - (year - BUILT) * K, 0.0, 0.0))


# ---------------------------------------------------------------- terrain height (vectorised)
PX = [X0, -650, 430, 650, 1000, 1040, 1065, 1285, 1310, 1600, 1650, 1700, 2300, 3200, 3650, 3770, 3795, 4100, 4450, 4500, 4560, X1]
PZ = [0, 0, 0, -38, -40, -42, -50, -50, -42, -40, -38, 16, 55, 80, 30, -22, -48, -50, -56, -62, -75, -80]
WAVES = [(rng.uniform(0, TAU), rng.uniform(140, 900), rng.uniform(0, TAU)) for _ in range(9)]


def dunes(x, y):
    z = np.zeros_like(x)
    for ang, wl, ph in WAVES:
        d = (x * math.cos(ang) + y * math.sin(ang)) / wl * TAU + ph
        z += (1 - np.abs(np.sin(d))) * wl / 900 * 14  # ridged: sharp crests, broad troughs
    return z - 7


def flat_weight(x, y):
    """1 on the flat Giza plateau and along the timeline corridor, 0 out in the dunes."""
    r = np.hypot(x, y)
    giza = 1 - np.clip((r - 520) / 450, 0, 1)
    lane = np.where(x < 0, 1 - np.clip((np.abs(y) - 110) / 260, 0, 1), 0)
    return np.maximum(giza, lane)


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def plateau(x, y):
    """High ground north of the galleries: its ragged southern edge is the cliff they are cut into."""
    edge = GAL_Y + 46 + 20 * np.sin(x / 47) + 12 * np.sin(x / 19 + 1.3)
    across = smooth((x - (GAL_X - 190)) / 120) * (1 - smooth((x - (GAL_X + 330)) / 150))
    return smooth((y - edge) / 14) * across * (52 + 6 * np.sin(x / 31) * np.sin(y / 43) + 3 * np.sin(x / 9 + y / 13))


def amp(x, y):
    west = np.clip((420 - x) / 300, 0, 1) * (1 - flat_weight(x, y))
    hills = np.clip((x - 1750) / 300, 0, 1) * np.clip((3700 - x) / 200, 0, 1) * 1.6
    return west + hills  # the coastal plain stays flat


def height(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    return np.interp(x, PX, PZ) + amp(x, y) * dunes(x, y) + plateau(x, y)


def h1(x, y):
    return float(height(np.array([x]), np.array([y]))[0])


# ---------------------------------------------------------------- helpers
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS


def link(o):
    scene.collection.objects.link(o)
    return o


def mesh_obj(name, verts, faces, mat=None, linked=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.update()
    o = bpy.data.objects.new(name, me)
    if linked:
        link(o)
    if mat:
        me.materials.append(mat)
    return o


def box_geo(x0, y0, z0, x1, y1, z1, n=0):
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    f = [(n, n + 1, n + 5, n + 4), (n + 1, n + 2, n + 6, n + 5), (n + 2, n + 3, n + 7, n + 6), (n + 3, n, n + 4, n + 7), (n + 4, n + 5, n + 6, n + 7), (n + 3, n + 2, n + 1, n)]
    return v, f


def boxes_mesh(name, boxes, mat):
    verts, faces = [], []
    for b in boxes:
        v, f = box_geo(*b, n=len(verts))
        verts += v
        faces += f
    return mesh_obj(name, verts, faces, mat)


def cube(name, loc, size, mat, rot=(0, 0, 0)):
    """A box with its size baked into the mesh, so children and modifiers see unit scale."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.data.transform(Matrix.Diagonal((*size, 1)))
    o.data.materials.append(mat)
    return o


def visible(o, *windows):
    """Show an object only inside these (first, last) frame windows."""
    o.hide_render = True
    o.keyframe_insert("hide_render", frame=0)
    for a, b in windows:
        o.hide_render = False
        o.keyframe_insert("hide_render", frame=a)
        o.hide_render = True
        o.keyframe_insert("hide_render", frame=b)


def key(o, path, pairs):
    for frame, v in pairs:
        setattr(o, path, v)
        o.keyframe_insert(path, frame=frame)


def linear_keys(idblock):
    for layer in idblock.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = "LINEAR"


# ---------------------------------------------------------------- materials
class N:
    """A tiny node-graph builder: N(tree).new("ShaderNodeTexNoise", Scale=3)."""

    def __init__(self, tree):
        self.t = tree

    def new(self, kind, **inputs):
        n = self.t.nodes.new(kind)
        for k, v in inputs.items():
            if hasattr(n, k) and not k[0].isupper():
                setattr(n, k, v)
            else:
                n.inputs[k.replace("_", " ")].default_value = v
        return n

    def link(self, a, b):
        self.t.links.new(a, b)

    def math(self, op, a, b=None, clamp=False):
        n = self.t.nodes.new("ShaderNodeMath")
        n.operation = op
        n.use_clamp = clamp
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                self.link(v, n.inputs[i])
        return n.outputs[0]

    def ramp(self, fac, stops):
        r = self.t.nodes.new("ShaderNodeValToRGB")
        els = r.color_ramp.elements
        (p0, c0), (p1, c1) = stops[0], stops[-1]
        els[0].position, els[0].color = p0, (*c0, 1)
        els[1].position, els[1].color = p1, (*c1, 1)
        for pos, col in stops[1:-1]:
            els.new(pos).color = (*col, 1)
        self.link(fac, r.inputs["Fac"])
        return r.outputs["Color"]

    def mix(self, fac, a, b):
        m = self.t.nodes.new("ShaderNodeMix")
        m.data_type = "RGBA"
        if isinstance(fac, (int, float)):
            m.inputs["Factor"].default_value = fac
        else:
            self.link(fac, m.inputs["Factor"])
        for sock, v in ((m.inputs[6], a), (m.inputs[7], b)):
            if isinstance(v, tuple):
                sock.default_value = (*v, 1)
            else:
                self.link(v, sock)
        return m.outputs[2]

    def bump(self, height, strength, dist=0.1, normal=None):
        b = self.new("ShaderNodeBump", Strength=strength, Distance=dist)
        self.link(height, b.inputs["Height"])
        if normal is not None:
            self.link(normal, b.inputs["Normal"])
        return b.outputs["Normal"]

    def coord(self, kind="Object"):
        return self.new("ShaderNodeTexCoord").outputs[kind]

    def scan(self, asset, kind, tile, vector=None, blend=0.25):
        """A Poly Haven scan, box-projected in object space; `tile` is its repeat in metres."""
        path = ASSETS / asset / f"{asset}_{kind}_2k.jpg"
        img = bpy.data.images.load(str(path), check_existing=True)
        if kind != "diff":
            img.colorspace_settings.name = "Non-Color"
        tex = self.t.nodes.new("ShaderNodeTexImage")
        tex.image = img
        tex.projection = "BOX"
        tex.projection_blend = blend
        mp = self.t.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (1 / tile,) * 3
        self.link(vector if vector is not None else self.coord(), mp.inputs["Vector"])
        self.link(mp.outputs[0], tex.inputs["Vector"])
        return tex.outputs["Color"]

    def lum(self, color):
        n = self.t.nodes.new("ShaderNodeRGBToBW")
        self.link(color, n.inputs[0])
        return n.outputs[0]

    def attr(self, name):
        return self.new("ShaderNodeAttribute", attribute_name=name).outputs["Fac"]

    def near(self, dist):
        """1 at the camera, 0 beyond `dist` metres."""
        cam = self.new("ShaderNodeCameraData")
        return self.math("SUBTRACT", 1, self.math("DIVIDE", cam.outputs["View Distance"], dist), clamp=True)


HAZE = (0.66, 0.64, 0.62)


def make_mat(name, build, haze=True):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    g = N(nt)
    bsdf = nt.nodes["Principled BSDF"]
    out = nt.nodes["Material Output"]
    build(g, bsdf)
    if haze:  # aerial perspective: distant ground fades toward the sky colour
        cam = g.new("ShaderNodeCameraData")
        d = g.math("DIVIDE", cam.outputs["View Distance"], -12000)
        f = g.math("SUBTRACT", 1, g.math("EXPONENT", d), clamp=True)
        em = g.new("ShaderNodeEmission", Color=(*HAZE, 1), Strength=0.55)
        mx = g.new("ShaderNodeMixShader")
        g.link(f, mx.inputs["Fac"])
        g.link(bsdf.outputs[0], mx.inputs[1])
        g.link(em.outputs[0], mx.inputs[2])
        g.link(mx.outputs[0], out.inputs["Surface"])
    return m


SAND = [(0.25, (0.50, 0.35, 0.19)), (0.5, (0.72, 0.55, 0.33)), (0.8, (0.86, 0.71, 0.48))]
GRAVEL = [(0.2, (0.42, 0.33, 0.22)), (0.5, (0.66, 0.54, 0.37)), (0.8, (0.82, 0.72, 0.55))]
LIME = [(0.2, (0.45, 0.37, 0.26)), (0.5, (0.70, 0.61, 0.45)), (0.82, (0.88, 0.81, 0.66))]
CORE_TONES = [(0.2, (0.33, 0.24, 0.14)), (0.5, (0.60, 0.46, 0.28)), (0.82, (0.78, 0.63, 0.42))]


def ground_build(g, bsdf):
    """The desert: scanned sand grain up close, scanned wind ripples at range, gravel on the plateau,
    bare limestone in the hills, fields on the floodplain. Scans carry texture; colour comes from
    a ramp, so beach sand reads as desert sand."""
    co = g.coord()
    near = g.near(70)
    big = g.new("ShaderNodeTexNoise", Scale=0.004, Detail=6.0, Roughness=0.6)
    mid = g.new("ShaderNodeTexNoise", Scale=0.06, Detail=4.0)
    g.link(co, big.inputs["Vector"])
    g.link(co, mid.inputs["Vector"])
    # Two ripple samples at different sizes, swapped by large-scale noise, so the tiling never shows.
    rip = g.mix(big.outputs["Fac"], g.scan("aerial_beach_01", "diff", 31), g.scan("aerial_beach_01", "diff", 53))
    rip_h = g.mix(big.outputs["Fac"], g.scan("aerial_beach_01", "disp", 31), g.scan("aerial_beach_01", "disp", 53))
    fine = g.scan("dense_sand", "diff", 1.8)
    fine_h = g.scan("dense_sand", "disp", 1.8)
    grav = g.scan("sandy_gravel_02", "diff", 2.53)
    grav_h = g.scan("sandy_gravel_02", "disp", 2.53)
    rock = g.scan("rock_face_03", "diff", 9.0)
    rock_h = g.scan("rock_face_03", "disp", 9.0)
    sand_l = g.math("ADD", g.math("MULTIPLY", g.lum(rip), 0.7), g.math("MULTIPLY", g.math("SUBTRACT", g.lum(fine), 0.5), g.math("MULTIPLY", near, 0.9)))
    sand_l = g.math("ADD", sand_l, g.math("MULTIPLY", g.math("SUBTRACT", big.outputs["Fac"], 0.5), 0.5))
    sand_l = g.math("ADD", sand_l, g.math("MULTIPLY", g.math("SUBTRACT", mid.outputs["Fac"], 0.5), 0.18))
    tone = g.ramp(sand_l, SAND)
    grav_l = g.math("ADD", g.lum(grav), g.math("MULTIPLY", g.math("SUBTRACT", big.outputs["Fac"], 0.5), 0.3))
    plat = g.attr("plat")
    tone = g.mix(g.math("MULTIPLY", plat, 0.75), tone, g.ramp(grav_l, GRAVEL))
    tone = g.mix(g.attr("rock"), tone, g.ramp(g.lum(rock), LIME))
    fields = g.new("ShaderNodeTexVoronoi", Scale=0.02)
    g.link(co, fields.inputs["Vector"])
    crop = g.new("ShaderNodeTexNoise", Scale=1.2, Detail=3.0)
    g.link(co, crop.inputs["Vector"])
    green = g.mix(crop.outputs["Fac"], g.ramp(g.lum(fields.outputs["Color"]), [(0.0, (0.08, 0.15, 0.04)), (0.5, (0.17, 0.25, 0.07)), (1.0, (0.30, 0.27, 0.12))]), (0.10, 0.16, 0.05))
    tone = g.mix(g.attr("fert"), tone, green)
    g.link(tone, bsdf.inputs["Base Color"])
    # Relief: scanned ripples everywhere, grain and pebbles only near the camera.
    n1 = g.bump(rip_h, 0.55, 0.6)
    n2 = g.bump(g.math("MULTIPLY", fine_h, near), 0.5, 0.03, n1)
    n3 = g.bump(g.math("MULTIPLY", grav_h, g.math("MULTIPLY", plat, near)), 0.8, 0.05, n2)
    n4 = g.bump(g.math("MULTIPLY", rock_h, g.attr("rock")), 0.9, 1.2, n3)
    g.link(n4, bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.93


def stone_build(asset, tile, palette, bump, rough, dist=0.15, tile2=None):
    def build(g, bsdf):
        v = g.new("ShaderNodeTexNoise", Scale=0.15, Detail=5.0)
        g.link(g.coord(), v.inputs["Vector"])
        col, hgt = g.scan(asset, "diff", tile), g.scan(asset, "disp", tile)
        if tile2:  # a second size of the same scan, swapped in by noise, hides the repeat
            sw = g.new("ShaderNodeTexNoise", Scale=1 / (tile * 3), Detail=3.0)
            g.link(g.coord(), sw.inputs["Vector"])
            col = g.mix(sw.outputs["Fac"], col, g.scan(asset, "diff", tile2))
            hgt = g.mix(sw.outputs["Fac"], hgt, g.scan(asset, "disp", tile2))
        lum = g.math("ADD", g.lum(col), g.math("MULTIPLY", g.math("SUBTRACT", v.outputs["Fac"], 0.5), 0.35))
        g.link(g.ramp(lum, palette), bsdf.inputs["Base Color"])
        g.link(g.bump(hgt, bump, dist), bsdf.inputs["Normal"])
        bsdf.inputs["Roughness"].default_value = rough

    return build


def casing_build(g, bsdf):
    """Polished, fitted white limestone, a little weathered: fine joints between blocks, fading out
    with distance so they never shimmer when the pyramid is small on screen."""
    uv = g.coord("UV")
    # Rows follow the course table: one tall base course, then even courses above it.
    uvs = g.new("ShaderNodeSeparateXYZ")
    g.link(uv, uvs.inputs[0])
    base_s, row_s = BASE_COURSE * SLANT_F, COURSE_H * SLANT_F
    in_base = g.math("LESS_THAN", uvs.outputs["Y"], base_s)
    v_base = g.math("MULTIPLY", g.math("SUBTRACT", g.math("DIVIDE", uvs.outputs["Y"], base_s), 1.0), row_s)  # the base course fills exactly one row
    v_up = g.math("SUBTRACT", uvs.outputs["Y"], base_s)
    rows = g.new("ShaderNodeCombineXYZ")
    g.link(uvs.outputs["X"], rows.inputs["X"])
    g.link(g.math("ADD", g.math("MULTIPLY", v_base, in_base), g.math("MULTIPLY", v_up, g.math("SUBTRACT", 1.0, in_base))), rows.inputs["Y"])
    brick = g.new("ShaderNodeTexBrick", Scale=1.0, Mortar_Size=0.012, Mortar_Smooth=0.2, Bias=0.0, Brick_Width=1.6, Row_Height=row_s)
    brick.offset = 0.5
    brick.squash = 1.0
    brick.inputs["Color1"].default_value = (0.70, 0.65, 0.54, 1)
    brick.inputs["Color2"].default_value = (0.79, 0.74, 0.62, 1)
    g.link(rows.outputs[0], brick.inputs["Vector"])
    n = g.new("ShaderNodeTexNoise", Scale=0.08, Detail=6.0)
    g.link(g.coord(), n.inputs["Vector"])
    stain = g.new("ShaderNodeTexNoise", Scale=0.02, Detail=8.0, Roughness=0.7)  # weather streaks down the face
    mp = g.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1.0, 0.08, 1.0)
    g.link(uv, mp.inputs["Vector"])
    g.link(mp.outputs[0], stain.inputs["Vector"])
    joint = g.math("MULTIPLY", brick.outputs["Fac"], g.near(260))
    grain = g.lum(g.scan("rock_face_03", "diff", 14.0))
    tone = g.mix(0.5, brick.outputs["Color"], g.ramp(n.outputs["Fac"], [(0.35, (0.66, 0.6, 0.48)), (0.65, (0.81, 0.76, 0.64))]))
    tone = g.mix(g.math("MULTIPLY", g.math("SUBTRACT", 0.62, grain, clamp=True), 0.5), tone, (0.56, 0.48, 0.36))
    tone = g.mix(g.math("MULTIPLY", g.math("SUBTRACT", stain.outputs["Fac"], 0.42, clamp=True), 1.3, clamp=True), tone, (0.5, 0.41, 0.29))
    tone = g.mix(g.math("MULTIPLY", joint, 0.75), tone, (0.42, 0.35, 0.26))
    g.link(tone, bsdf.inputs["Base Color"])
    g.link(g.bump(g.math("SUBTRACT", 1, joint), 0.35, 0.02), bsdf.inputs["Normal"])
    g.link(g.math("ADD", 0.26, g.math("MULTIPLY", stain.outputs["Fac"], 0.14)), bsdf.inputs["Roughness"])


def plain(col, rough=0.8):
    def build(g, bsdf):
        bsdf.inputs["Base Color"].default_value = (*col, 1)
        bsdf.inputs["Roughness"].default_value = rough

    return build


def water_build(col, scale):
    def build(g, bsdf):
        w = g.new("ShaderNodeValue")
        w.name = "time"
        n = g.new("ShaderNodeTexNoise", Scale=scale, Detail=5.0, Roughness=0.55)
        n.noise_dimensions = "4D"
        g.link(g.coord(), n.inputs["Vector"])
        g.link(w.outputs[0], n.inputs["W"])
        n2 = g.new("ShaderNodeTexNoise", Scale=scale * 7, Detail=3.0)
        n2.noise_dimensions = "4D"
        g.link(g.coord(), n2.inputs["Vector"])
        g.link(w.outputs[0], n2.inputs["W"])
        bsdf.inputs["Base Color"].default_value = (*col, 1)
        bsdf.inputs["Roughness"].default_value = 0.05
        g.link(g.bump(n2.outputs["Fac"], 0.08, 0.1, g.bump(n.outputs["Fac"], 0.22, 0.5)), bsdf.inputs["Normal"])
        for frame, v in ((0, 0.0), (END, END / FPS * 0.35)):
            w.outputs[0].default_value = v
            w.outputs[0].keyframe_insert("default_value", frame=frame)

    return build


def papyrus_build(grid=False):
    """Papyrus: two crossed layers of pith strips, age stains, torn edges, and rows of brush strokes
    (not real script). The logbook adds its ruled columns."""

    def build(g, bsdf):
        uv = g.coord("UV")
        sep = g.new("ShaderNodeSeparateXYZ")
        g.link(uv, sep.inputs[0])
        u, v = sep.outputs["X"], sep.outputs["Y"]
        hz = g.new("ShaderNodeTexWave", Scale=34.0, Distortion=1.5, Detail=2.0)
        hz.bands_direction = "Y"
        vt = g.new("ShaderNodeTexWave", Scale=22.0, Distortion=1.5, Detail=2.0)
        vt.bands_direction = "X"
        g.link(uv, hz.inputs["Vector"])
        g.link(uv, vt.inputs["Vector"])
        fibre = g.math("ADD", g.math("MULTIPLY", hz.outputs["Fac"], 0.6), g.math("MULTIPLY", vt.outputs["Fac"], 0.4))
        age = g.new("ShaderNodeTexNoise", Scale=3.0, Detail=6.0, Roughness=0.7)
        g.link(uv, age.inputs["Vector"])
        tone = g.ramp(fibre, [(0.2, (0.50, 0.36, 0.17)), (0.6, (0.69, 0.54, 0.29)), (0.9, (0.78, 0.64, 0.38))])
        tone = g.mix(g.math("MULTIPLY", g.math("SUBTRACT", age.outputs["Fac"], 0.4, clamp=True), 1.1), tone, (0.36, 0.24, 0.11))
        # Ink: thin connected strokes inside ruled rows.
        rows = g.math("LESS_THAN", g.math("FRACT", g.math("MULTIPLY", v, 9)), 0.55)
        cells = g.new("ShaderNodeTexVoronoi", Scale=36.0)
        cells.feature = "DISTANCE_TO_EDGE"
        mp = g.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (1.0, 0.55, 1.0)
        g.link(uv, mp.inputs["Vector"])
        g.link(mp.outputs[0], cells.inputs["Vector"])
        pick = g.new("ShaderNodeTexNoise", Scale=22.0, Detail=1.0)
        g.link(uv, pick.inputs["Vector"])
        ink = g.math("MULTIPLY", rows, g.math("MULTIPLY", g.math("LESS_THAN", cells.outputs["Distance"], 0.09), g.math("GREATER_THAN", pick.outputs["Fac"], 0.46)))
        if grid:  # the logbook's ruled columns, one per day
            cols = g.math("LESS_THAN", g.math("FRACT", g.math("MULTIPLY", u, 8)), 0.025)
            ink = g.math("MAXIMUM", ink, cols)
        margin = g.math("MULTIPLY", g.math("GREATER_THAN", u, 0.05), g.math("LESS_THAN", u, 0.95))
        fade = g.math("ADD", 0.55, g.math("MULTIPLY", age.outputs["Fac"], 0.45))  # ink worn where the sheet is
        ink = g.math("MULTIPLY", g.math("MULTIPLY", ink, margin), fade)
        g.link(g.mix(ink, tone, (0.06, 0.045, 0.04)), bsdf.inputs["Base Color"])
        # Torn edges: the sheet ends where a noisy border runs out.
        tear = g.new("ShaderNodeTexNoise", Scale=9.0, Detail=5.0, Roughness=0.7)
        g.link(uv, tear.inputs["Vector"])
        edge = g.math("MINIMUM", g.math("MINIMUM", u, g.math("SUBTRACT", 1, u)), g.math("MINIMUM", v, g.math("SUBTRACT", 1, v)))
        g.link(g.math("GREATER_THAN", g.math("ADD", edge, g.math("MULTIPLY", g.math("SUBTRACT", tear.outputs["Fac"], 0.5), 0.16)), 0.035), bsdf.inputs["Alpha"])
        g.link(g.bump(fibre, 0.35, 0.002), bsdf.inputs["Normal"])
        bsdf.inputs["Roughness"].default_value = 0.8

    return build


def wood_build(g, bsdf):
    w = g.new("ShaderNodeTexWave", Scale=3.0, Distortion=8.0, Detail=3.0)
    g.link(g.coord(), w.inputs["Vector"])
    g.link(g.ramp(w.outputs["Fac"], [(0.2, (0.16, 0.09, 0.045)), (0.8, (0.36, 0.22, 0.11))]), bsdf.inputs["Base Color"])
    g.link(g.bump(w.outputs["Fac"], 0.3, 0.02), bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.7


def frond_build(g, bsdf):
    uv = g.coord("UV")
    sep = g.new("ShaderNodeSeparateXYZ")
    g.link(uv, sep.inputs[0])
    leaf = g.math("GREATER_THAN", g.math("FRACT", g.math("MULTIPLY", sep.outputs["X"], 18)), 0.35)
    rib = g.math("LESS_THAN", g.math("ABSOLUTE", g.math("SUBTRACT", sep.outputs["Y"], 0.5)), 0.04)
    g.link(g.math("MAXIMUM", leaf, rib), bsdf.inputs["Alpha"])
    bsdf.inputs["Base Color"].default_value = (0.09, 0.17, 0.045, 1)
    bsdf.inputs["Roughness"].default_value = 0.6


M = {
    "ground": make_mat("ground", ground_build),
    "core": make_mat("core", stone_build("sandstone_blocks_05", 3.0, CORE_TONES, 0.7, 0.92, 0.15)),
    "casing": make_mat("casing", casing_build),
    "rock": make_mat("rock", stone_build("rock_face_03", 13.0, LIME, 1.0, 0.9, 1.2, tile2=37.0)),
    "basalt": make_mat("basalt", stone_build("rock_face_03", 4.0, [(0.2, (0.035, 0.035, 0.04)), (0.5, (0.1, 0.1, 0.105)), (0.85, (0.2, 0.19, 0.185))], 0.5, 0.7, 0.1)),
    "block": make_mat("block", stone_build("rock_face_03", 3.0, LIME, 0.6, 0.85, 0.1)),
    "slab": make_mat("slab", stone_build("dense_sand", 1.4, LIME, 0.25, 0.7, 0.01)),
    "dark": make_mat("dark", plain((0.02, 0.016, 0.012), 1.0)),
    "groove": make_mat("groove", plain((0.3, 0.23, 0.15), 0.9), haze=False),
    "nile": make_mat("nile", water_build((0.035, 0.085, 0.07), 0.12)),
    "sea": make_mat("sea", water_build((0.008, 0.07, 0.11), 0.05)),
    "papyrus": make_mat("papyrus", papyrus_build(), haze=False),
    "logbook": make_mat("logbook", papyrus_build(grid=True), haze=False),
    "wood": make_mat("wood", wood_build),
    "frond": make_mat("frond", frond_build),
    "jar": make_mat("jar", stone_build("dense_sand", 0.6, [(0.2, (0.42, 0.22, 0.12)), (0.5, (0.62, 0.36, 0.2)), (0.85, (0.74, 0.47, 0.28))], 0.2, 0.6, 0.004), haze=False),
}
for name, col, rough in (("phone", (0.03, 0.03, 0.035), 0.25), ("screen", (0.06, 0.16, 0.3), 0.08), ("disc", (0.8, 0.8, 0.85), 0.12), ("book", (0.36, 0.06, 0.05), 0.6), ("pages", (0.86, 0.82, 0.72), 0.8), ("veg_bulb", (0.5, 0.52, 0.24), 0.45), ("veg_leaf", (0.16, 0.34, 0.1), 0.5), ("veg_root", (0.66, 0.5, 0.3), 0.6), ("veg_white", (0.7, 0.66, 0.38), 0.45), ("bronze", (0.5, 0.33, 0.14), 0.35)):
    M[name] = make_mat(name, plain(col, rough), haze=False)
for name in ("disc", "bronze"):
    M[name].node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 1.0
M["screen"].node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.1, 0.3, 0.6, 1)
M["screen"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.6

# ---------------------------------------------------------------- terrain
STEP = 7.0
xs = np.linspace(X0, X1, int((X1 - X0) / STEP) + 1)
ys = np.linspace(Y0, Y1, int((Y1 - Y0) / STEP) + 1)
NXG, NYG = len(xs), len(ys)
GX, GY = np.meshgrid(xs, ys)
GZ = height(GX, GY)
fert = np.clip(1 - np.abs(np.abs(GX - 1175) - 280) / 250, 0, 1) * (GX > 640) * (GX < 1660)
fert = np.clip(fert * 1.6, 0, 1) * (np.abs(GX - 1175) > 140)
fert *= np.clip((np.hypot(GX - 1024.0, GY + 330.0) - 16) / 14, 0, 1)  # a bare sandy bank where Diodorus sits
slope = np.hypot(*np.gradient(GZ, ys[1] - ys[0], xs[1] - xs[0]))
rock = np.clip(np.clip(slope * 1.5, 0, 1) + np.clip((GX - 1700) / 400, 0, 0.5) * (GX < 3800), 0, 1)
plat = flat_weight(GX, GY) * (GX < 640) + np.clip(1 - np.abs(GX - 4230) / 420, 0, 1) * 0.7  # Giza plateau; the coastal plain
ii, jj = np.meshgrid(np.arange(NXG - 1), np.arange(NYG - 1))
a = (jj * NXG + ii).ravel()
Q = np.stack([a, a + 1, a + 1 + NXG, a + NXG], 1)
me = bpy.data.meshes.new("ground")
me.vertices.add(GX.size)
me.vertices.foreach_set("co", np.stack([GX.ravel(), GY.ravel(), GZ.ravel()], 1).astype(np.float32).ravel())
me.loops.add(Q.size)
me.loops.foreach_set("vertex_index", Q.astype(np.int32).ravel())
me.polygons.add(len(Q))
me.polygons.foreach_set("loop_start", (np.arange(len(Q)) * 4).astype(np.int32))
me.update()
me.validate()
for name, arr in (("fert", fert), ("rock", rock), ("plat", plat)):
    me.attributes.new(name, "FLOAT", "POINT").data.foreach_set("value", arr.ravel().astype(np.float32))
me.materials.append(M["ground"])
me.shade_smooth()
ground = link(bpy.data.objects.new("ground", me))
boxes_mesh("nile", [(NILE[0], Y0, -58, NILE[1], Y1, -44.5)], M["nile"])
boxes_mesh("sea", [(SEA_X - 70, Y0, -95, X1 + 9000, Y1, -60.5)], M["sea"])


# ---------------------------------------------------------------- scatter: stones on the ground, palms, crowds
def instance_on_points(name, pts, protos, scale=(1.0, 1.0), tilt=0.0, radius_key=None):
    """Instance random members of `protos` on points; yaw is random. `radius_key` adds a value node
    named so: points further than it from the origin are left out (the crowd spreading out)."""
    coll = bpy.data.collections.new(name + "_protos")
    for o in protos:
        coll.objects.link(o)
    cm = bpy.data.meshes.new(name + "_pts")
    cm.vertices.add(len(pts))
    cm.vertices.foreach_set("co", np.asarray(pts, np.float32).ravel())
    cm.update()
    host = link(bpy.data.objects.new(name, cm))
    ng = bpy.data.node_groups.new(name, "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    G = N(ng)
    gi, go = ng.nodes.new("NodeGroupInput"), ng.nodes.new("NodeGroupOutput")
    iop = ng.nodes.new("GeometryNodeInstanceOnPoints")
    ci = ng.nodes.new("GeometryNodeCollectionInfo")
    ci.inputs["Collection"].default_value = coll
    ci.inputs["Separate Children"].default_value = True
    ci.inputs["Reset Children"].default_value = True
    iop.inputs["Pick Instance"].default_value = True
    rot = ng.nodes.new("FunctionNodeRandomValue")
    rot.data_type = "FLOAT_VECTOR"
    rot.inputs["Min"].default_value = (-tilt, -tilt, 0)
    rot.inputs["Max"].default_value = (tilt, tilt, TAU)
    sc = ng.nodes.new("FunctionNodeRandomValue")
    sc.data_type = "FLOAT"
    [s for s in sc.inputs if s.enabled and s.name == "Min"][0].default_value = scale[0]
    [s for s in sc.inputs if s.enabled and s.name == "Max"][0].default_value = scale[1]
    G.link(gi.outputs[0], iop.inputs["Points"])
    G.link(ci.outputs[0], iop.inputs["Instance"])
    G.link([o for o in rot.outputs if o.enabled][0], iop.inputs["Rotation"])
    G.link([o for o in sc.outputs if o.enabled][0], iop.inputs["Scale"])
    value = None
    if radius_key:
        pos = ng.nodes.new("GeometryNodeInputPosition")
        ln = ng.nodes.new("ShaderNodeVectorMath")
        ln.operation = "LENGTH"
        G.link(pos.outputs[0], ln.inputs[0])
        value = ng.nodes.new("ShaderNodeValue")
        value.name = radius_key
        G.link(G.math("LESS_THAN", ln.outputs["Value"], value.outputs[0]), iop.inputs["Selection"])
    G.link(iop.outputs["Instances"], go.inputs[0])
    mod = host.modifiers.new(name, "NODES")
    mod.node_group = ng
    return host, mod, value


def rock_proto(i):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
    o = bpy.context.object
    r = random.Random(i)
    for v in o.data.vertices:
        v.co *= r.uniform(0.7, 1.15)
    o.data.transform(Matrix.Diagonal((1.0, r.uniform(0.6, 0.9), r.uniform(0.35, 0.6), 1)))
    o.data.materials.append(M["block"])
    bpy.ops.object.shade_flat()
    scene.collection.objects.unlink(o)
    return o


ROCKS = [rock_proto(i) for i in range(4)]
STONE_SPOTS = []  # (centre, radius, count) filled in as the sets are placed
CLEAR = []  # (x, y, radius) kept free of stones: props, plazas


def scatter_stones():
    pts = []
    for (cx, cy), rad, n in STONE_SPOTS:
        r_ = rad * np.sqrt(rng.uniform(0, 1, n))
        th = rng.uniform(0, TAU, n)
        x_, y_ = cx + r_ * np.cos(th), cy + r_ * np.sin(th)
        keep = ~((x_ < TL0 + 8) & (np.abs(y_) < 15))  # not on the timeline's paving
        for ex, ey, er in CLEAR:
            keep &= np.hypot(x_ - ex, y_ - ey) > er
        pts.append(np.stack([x_[keep], y_[keep], height(x_[keep], y_[keep]) + 0.01], 1))
    instance_on_points("stones", np.concatenate(pts), ROCKS, scale=(0.02, 0.13), tilt=0.4)


# ---------------------------------------------------------------- the pyramid
random.seed(7)
levels = [0.0, BASE_COURSE] + [BASE_COURSE + COURSE_H * k for k in range(1, NCOURSE + 1)]
bx = []
for z0, z1 in zip(levels, levels[1:]):
    hc = z1 - z0
    # Every course's outer corner sits 2 m inside the casing surface, so no step can pierce it.
    half = BASE / 2 - 2.0 - (BASE - TOP) / 2 * (z1 / HEIGHT)
    if half < 3:
        break
    run = (BASE - TOP) / 2 * (hc / HEIGHT)  # how far this course steps in
    bx.append((-half + 3.2, -half + 3.2, z0, half - 3.2, half - 3.2, z0 + hc * 0.98))
    for side in range(4):
        u = -half
        while u < half:
            w = min(random.uniform(0.9, 2.2), half - u)
            out = half - random.uniform(0.0, run * 0.45)
            top = z0 + hc * random.uniform(0.85, 1.0)
            lo, hi = out - 3.4, out
            bx.append((u, -hi, z0, u + w - 0.05, -lo, top) if side == 0 else (u, lo, z0, u + w - 0.05, hi, top) if side == 1 else (-hi, u, z0, -lo, u + w - 0.05, top) if side == 2 else (lo, u, z0, hi, u + w - 0.05, top))
            u += w
core = boxes_mesh("core", bx, M["core"])
b, t = BASE / 2, TOP / 2
slant = math.hypot(HEIGHT, b - t)
cv = [(-b, -b, 0), (b, -b, 0), (b, b, 0), (-b, b, 0), (-t, -t, HEIGHT), (t, -t, HEIGHT), (t, t, HEIGHT), (-t, t, HEIGHT)]
casing = mesh_obj("casing", cv, [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7)], M["casing"])
uvl = casing.data.uv_layers.new(name="UVMap")
side_uv = [(0, 0), (BASE, 0), (b + t, slant), (b - t, slant)]
for poly in casing.data.polygons:
    for k, li in enumerate(poly.loop_indices):
        uvl.data[li].uv = side_uv[k] if poly.index < 4 else (0, 0)
cutter = cube("cutter", (0, 0, HEIGHT * 3), (BASE * 2, BASE * 2, HEIGHT * 2), M["casing"])
cutter.hide_render = True
cutter.display_type = "WIRE"
mod = casing.modifiers.new("reveal", "BOOLEAN")
mod.operation = "INTERSECT"
mod.object = cutter
key(cutter, "location", [(T("it") - 2, Vector((0, 0, HEIGHT * 2 + 1))), (T("polished") + 2, Vector((0, 0, HEIGHT - 1.0)))])
STONE_SPOTS += [((0.0, 0.0), 330.0, 26000), ((-62.0, -135.0), 30.0, 2500)]


# ---------------------------------------------------------------- people (generic; nobody is a portrait)
class Parts:
    """Accumulates tubes into one mesh with a material index per face (palm trunks)."""

    def __init__(self):
        self.v, self.f, self.m = [], [], []

    def loft(self, rings, mat, segs=18, folds=0, phase=0.0):
        """A tube through elliptical rings (z, rx, ry, cx, cy, fold)."""
        n0 = len(self.v)
        for z, rx, ry, cx, cy, fa in rings:
            for k in range(segs):
                a_ = k / segs * TAU
                f_ = 1 + fa * math.sin(folds * a_ + phase + z * 1.7)
                self.v.append((cx + rx * f_ * math.cos(a_), cy + ry * f_ * math.sin(a_), z))
        for i in range(len(rings) - 1):
            for k in range(segs):
                a0, a1 = n0 + i * segs + k, n0 + i * segs + (k + 1) % segs
                self.f.append((a0, a1, a1 + segs, a0 + segs))
                self.m.append(mat)
        self.f.append(tuple(n0 + k for k in reversed(range(segs))))
        self.f.append(tuple(n0 + (len(rings) - 1) * segs + k for k in range(segs)))
        self.m += [mat, mat]

    def build(self, name, mats, linked=True):
        o = mesh_obj(name, self.v, self.f, linked=linked)
        for m_ in mats:
            o.data.materials.append(m_)
        o.data.polygons.foreach_set("material_index", self.m)
        o.data.polygons.foreach_set("use_smooth", [True] * len(self.f))
        o.data.update()
        return o


# MakeHuman bodies, posed and dressed by tools/blender/make_people.py. Each stands 1.6-1.8 m tall
# with its feet at its origin, facing +y.
PEOPLE_NAMES = [f"worker{i}" for i in range(8)] + ["rower", "scale_person", "writer"]
with bpy.data.libraries.load(str(ASSETS / "people.blend")) as (src, dst):
    dst.objects = [n for n in PEOPLE_NAMES if n in src.objects]
PEOPLE = {o.name: o for o in dst.objects}
assert len(PEOPLE) == len(PEOPLE_NAMES), "run tools/blender/make_people.py first"
for o in PEOPLE.values():
    o.location = (0, 0, 0)
    for slot in o.material_slots:  # the scroll takes this script's papyrus material
        if slot.material and slot.material.name.startswith("papyrus_slot"):
            slot.material = M["papyrus"]


def person(kind, name):
    """A new instance of one of the figures, in the scene."""
    o = PEOPLE[kind].copy()
    o.name = name
    return link(o)


SCALE_AT = Vector((-62.0, -BASE / 2 - 5.0, 0))
scale_fig = person("scale_person", "scale_fig")
scale_fig.location = SCALE_AT
scale_fig.rotation_euler.z = math.radians(-20)  # facing the pyramid, a little turned
visible(scale_fig, (T("it"), T("cleopatra", 0) - 5))  # gone before "Cleopatra" is said: it must not be read as her (A5)

# Diodorus sits writing on the west bank of the Nile, in Egypt but nowhere near the pyramid: no source
# read puts him at Giza (A5). He is only ever seen from behind, close, over his shoulder.
WRITE_AT = Vector((1024.0, -330.0, h1(1024.0, -330.0)))
diod = person("writer", "diodorus")
diod.location = WRITE_AT
DIOD_ROT = math.radians(150)  # facing south-south-west, toward the sun, so his own shadow is off the page; the river on his left
diod.rotation_euler.z = DIOD_ROT
visible(diod, (T("greek") - 30, T("stones") + 30))
STONE_SPOTS += [((WRITE_AT.x - 2, WRITE_AT.y), 14.0, 700)]
CLEAR += [(WRITE_AT.x, WRITE_AT.y, 1.6)]
bpy.context.view_layer.update()
_pap = [i for i, sl in enumerate(diod.material_slots) if sl.material is M["papyrus"]]
_pts = [diod.matrix_world @ diod.data.vertices[v].co for poly in diod.data.polygons if poly.material_index in _pap and len(poly.vertices) == 4 and poly.area > 0.05 for v in poly.vertices]
SCROLL_AT = sum(_pts, Vector()) / len(_pts)  # the middle of the page he is writing on
focus = link(bpy.data.objects.new("focus", None))  # what the close shot keeps sharp
_nib = [diod.matrix_world @ poly.center for poly in diod.data.polygons if diod.material_slots[poly.material_index].material.name.startswith("ink")]
NIB_AT = sum(_nib, Vector()) / len(_nib) if _nib else SCROLL_AT  # the nib of his pen
focus.location = NIB_AT


def by_scroll(right, ahead, up):
    """A point beside the page, in the writer's own directions."""
    fwd = Vector((-math.sin(DIOD_ROT), math.cos(DIOD_ROT), 0))
    return SCROLL_AT + Vector((fwd.y, -fwd.x, 0)) * right + fwd * ahead + Vector((0, 0, up))

# 360,000 figures, the number Diodorus was told, around the pyramid on the flat plateau.
NMEN = 360_000
r_in = BASE / 2 * math.sqrt(2) + 12
r_out = math.sqrt(r_in**2 + NMEN * 1.18 / math.pi)
rr = np.sqrt(rng.uniform(r_in**2, r_out**2, NMEN))
th = rng.uniform(0, TAU, NMEN)
men = np.stack([rr * np.cos(th), rr * np.sin(th), np.zeros(NMEN)], 1)
assert len(men) == NMEN
crowd, crowd_mod, radius = instance_on_points("crowd", men, [PEOPLE[f"worker{i}"] for i in range(8)], scale=(0.95, 1.05), radius_key="radius")
for frame, r_ in ((T("three") - 4, r_in), (T("men") + 6, r_out + 2)):
    radius.outputs[0].default_value = r_
    radius.outputs[0].keyframe_insert("default_value", frame=frame)
visible(crowd, (T("three") - 6, T("then,") + 20))

# ---------------------------------------------------------------- the timeline on the desert floor
tl_objs = []
slabs, posts = [], []
x_ = TL0 + 6
while x_ > tl(NOW_Y).x - 4:  # paved from the pyramid to today
    ln = random.uniform(4.2, 5.6)
    y_ = -10.0
    for w_ in (5.0, 5.0, 5.0, 5.0):
        slabs.append((x_ - ln + 0.07, y_ + 0.07, -0.2, x_, y_ + w_ - 0.07, random.uniform(0.3, 0.4)))
        y_ += w_
    x_ -= ln
tl_objs.append(boxes_mesh("tl_paving", slabs, M["block"]))
for yr in range(BUILT + 99, FUTURE + 1, 100):  # a pair of posts every 100 years, taller every 500
    big = (yr - BUILT - 99) % 500 == 400
    s_, h_ = (2.2, 6.0) if big else (1.2, 2.6)  # the future beyond today is only staked out, unpaved
    for side in (-1, 1):
        cx_, cy_ = tl(yr).x, side * 13.0
        posts.append((cx_ - s_ / 2, cy_ - s_ / 2, -0.3, cx_ + s_ / 2, cy_ + s_ / 2, h_))
tl_objs.append(boxes_mesh("tl_posts", posts, M["block"]))


def obelisk(name, at, h=30.0, w=8.0):
    """A marker for one date: a stepped base and a tapering shaft with a pointed cap."""
    v, f = [], []
    for geo in (box_geo(-w * 1.5, -w * 1.5, -0.3, w * 1.5, w * 1.5, 0.9), box_geo(-w * 1.05, -w * 1.05, 0.9, w * 1.05, w * 1.05, 1.8)):
        f += [tuple(i + len(v) for i in q) for q in geo[1]]
        v += geo[0]
    n = len(v)
    a_, b_ = w / 2, w * 0.33
    v += [(-a_, -a_, 1.8), (a_, -a_, 1.8), (a_, a_, 1.8), (-a_, a_, 1.8), (-b_, -b_, h), (b_, -b_, h), (b_, b_, h), (-b_, b_, h), (0, 0, h + w * 0.7)]
    f += [(n, n + 1, n + 5, n + 4), (n + 1, n + 2, n + 6, n + 5), (n + 2, n + 3, n + 7, n + 6), (n + 3, n, n + 4, n + 7), (n + 4, n + 5, n + 8), (n + 5, n + 6, n + 8), (n + 6, n + 7, n + 8), (n + 7, n + 4, n + 8)]
    o = mesh_obj(name, v, f, M["slab"])
    o.location = at
    return o


MARK_Y = 34.0  # the date markers stand beside the paving


def plaza(name, at, r_):
    """A round paved floor at a date, so the date can be found from straight above."""
    bpy.ops.mesh.primitive_cylinder_add(radius=r_, depth=0.75, vertices=72, location=at + Vector((0, 0, 0.075)))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(M["block"])
    CLEAR.append((at.x, at.y, r_ + 1))
    return o


for name, yr in (("built", BUILT), ("cleo", CLEO), ("moon", MOON)):
    at = tl(yr) + Vector((0, MARK_Y, 0))
    tl_objs.append(obelisk("ob_" + name, at))
    tl_objs.append(plaza("plaza_" + name, at, 22))
for yr in range(NOW_Y + 1000, FUTURE + 1, 1000):  # empty floors where future markers would stand
    tl_objs.append(plaza(f"plaza{yr}", tl(yr) + Vector((0, MARK_Y, 0)), 14))
SHIFT = args.cut_shift  # every cut, and what switches with it, moves together
TL_SEEN = ((T("cleopatra", 0) + 2 + SHIFT, T("greek") + SHIFT), (T("they") + SHIFT, END + 1))  # the straight-down views and the close
for o in tl_objs:  # never at ground level beside the cased pyramid, the workforce, Diodorus or the Nile map
    visible(o, *TL_SEEN)
STONE_SPOTS += [((tl(NOW_Y).x, 0.0), 45.0, 4000)]

# The inscription beat (Diodorus 1.64.3: vegetables, purgatives, talents) was cut from the script on
# 2026-11-23. Its carved marks drew on the shared random stream; the same numbers are drawn here so
# that everything placed after it stays where it was.
for _ in range(10):
    lx = -1.6
    while lx < 1.5:
        w_ = random.uniform(0.04, 0.22)
        random.uniform(0.035, 0.07)
        lx += w_ + random.uniform(0.03, 0.09)

# ---------------------------------------------------------------- the Nile: Tura quarry, palms, the boat
tura = boxes_mesh("tura", [(TURA_X, Y0, -40, TURA_X + 90, 1500, 20)], M["rock"])
for k in range(9):  # stepped quarry cuts in the cliff face
    yq = -520 + k * 150 + random.uniform(-20, 20)
    cut = cube(f"qcut{k}", (TURA_X, yq, -18 + random.uniform(0, 14)), (40, random.uniform(40, 80), 26), M["rock"])
    cut.hide_render = True
    cut.display_type = "WIRE"
    m_ = tura.modifiers.new(f"q{k}", "BOOLEAN")
    m_.operation = "DIFFERENCE"
    m_.object = cut


def palm_proto(i):
    r = random.Random(i)
    P = Parts()
    hgt = r.uniform(9, 14)
    bend = r.uniform(-1.2, 1.2)
    P.loft([(z_, 0.26 - 0.08 * z_ / hgt, 0.26 - 0.08 * z_ / hgt, bend * (z_ / hgt) ** 2, 0, 0.0) for z_ in np.linspace(0, hgt, 7)], 0, 8)
    trunk = P.build(f"palm{i}", [M["wood"]], linked=False)
    v, f, uv = [], [], []
    for k in range(13):  # fronds: arched strips, cut into leaflets by the material
        a_ = k / 13 * TAU + r.uniform(-0.2, 0.2)
        droop = r.uniform(0.5, 1.1)
        n = len(v)
        steps = 6
        for q in range(steps + 1):
            u = q / steps
            rad, z_ = 4.6 * u, hgt + 1.6 * u - droop * 4.0 * u * u
            c = Vector((bend + rad * math.cos(a_), rad * math.sin(a_), z_))
            side = Vector((-math.sin(a_), math.cos(a_), 0)) * (0.9 * (1 - 0.6 * u))
            v += [tuple(c - side + Vector((0, 0, -0.25))), tuple(c + side + Vector((0, 0, -0.25)))]
            uv += [(u, 0), (u, 1)]
        for q in range(steps):
            f.append((n + 2 * q, n + 2 * q + 1, n + 2 * q + 3, n + 2 * q + 2))
    fr = mesh_obj(f"fronds{i}", v, f, M["frond"], linked=False)
    lay = fr.data.uv_layers.new(name="UVMap")
    for poly in fr.data.polygons:
        for li, vi in zip(poly.loop_indices, poly.vertices):
            lay.data[li].uv = uv[vi]
    fr.parent = trunk
    coll = bpy.data.collections.new(f"palm{i}")
    coll.objects.link(trunk)
    coll.objects.link(fr)
    inst = bpy.data.objects.new(f"palm_inst{i}", None)
    inst.instance_type = "COLLECTION"
    inst.instance_collection = coll
    return inst


palm_pts = []
for x_lo, x_hi, n in ((900, 1030, 260), (1320, 1560, 420)):
    px = rng.uniform(x_lo, x_hi, n)
    py = rng.uniform(-1500, 2600, n)
    palm_pts.append(np.stack([px, py, height(px, py) - 0.2], 1))
instance_on_points("palms", np.concatenate(palm_pts), [palm_proto(i) for i in range(4)], scale=(0.8, 1.25))


def boat():
    """A plank-built Nile cargo boat with limestone blocks on deck and a crew at the oars."""
    L_, W_ = 30.0, 7.0
    ring = [(-1, 0.0), (-0.55, -0.9), (0.55, -0.9), (1, 0.0)]
    verts, faces = [], []
    stations = 11
    for k in range(stations):
        u = k / (stations - 1)
        w_ = W_ / 2 * math.sin(math.pi * (0.06 + 0.88 * u)) ** 0.7
        rise = 2.2 * (2 * u - 1) ** 4
        for sy, sz in ring:
            verts.append(((u - 0.5) * L_, sy * w_, sz * 1.6 + 1.6 + rise))
    for k in range(stations - 1):
        for q in range(len(ring) - 1):
            a0 = k * len(ring) + q
            faces.append((a0, a0 + len(ring), a0 + len(ring) + 1, a0 + 1))
    hull = mesh_obj("boat", verts, faces, M["wood"])
    hull.data.shade_smooth()
    hull.modifiers.new("thick", "SOLIDIFY").thickness = 0.18
    deck = cube("deck", (0, 0, 1.45), (L_ * 0.8, W_ * 0.78, 0.12), M["wood"])
    deck.parent = hull
    for k in range(4):
        cube(f"bblock{k}", (-6.5 + k * 4.4, random.uniform(-0.3, 0.3), 2.25), (3.3, 2.5, 1.5), M["block"]).parent = hull
    cube("mast", (2.5, 0, 6.5), (0.3, 0.3, 10), M["wood"]).parent = hull
    for k in range(6):
        for side in (-1, 1):
            o = cube(f"oar{k}{side}", (-10 + k * 3.6, side * 4.6, 1.2), (0.16, 5.4, 0.16), M["wood"], rot=(side * math.radians(24), 0, 0))
            o.parent = hull
            m_ = person("rower", f"rower{k}{side}")
            m_.parent = hull
            m_.location = (-10 + k * 3.6 + 0.55, side * 2.3, 1.5)
            m_.rotation_euler.z = math.radians(90)  # facing the stern, as rowers do
            m_.scale = (1.5, 1.5, 1.5)  # the boat is drawn large to be legible; its crew matches
        cube(f"thwart{k}", (-10 + k * 3.6, 0, 1.95), (0.7, W_ * 0.74, 0.12), M["wood"]).parent = hull
    return hull


hull = boat()
B0, B1 = Vector((NILE[1] - 25, -170, -45.5)), Vector((NILE[0] + 30, 10, -45.5))
hull.rotation_euler.z = math.atan2(B1.y - B0.y, B1.x - B0.x)
key(hull, "location", [(T("his"), B0), (T("pyramid", 1) + 10, B1)])
linear_keys(hull)  # linear, so boat_at() below matches the animation


def boat_at(frame):
    u = min(1, max(0, (frame - T("his")) / (T("pyramid", 1) + 10 - T("his"))))
    return B0.lerp(B1, u)


# ---------------------------------------------------------------- the harbour and the storage galleries
NGAL = 7
FACADE = boxes_mesh("galleries", [(GAL_X, GAL_Y, -56, GAL_X + 30 * NGAL + 30, GAL_Y + 90, -33)], M["rock"])  # the worked face at the foot of the plateau
rough = FACADE.modifiers.new("cells", "SUBSURF")  # enough vertices for the weathering below
rough.subdivision_type = "SIMPLE"
rough.levels = rough.render_levels = 6
weather = bpy.data.textures.new("weather", "CLOUDS")
weather.noise_scale = 22.0
weather.noise_depth = 4
dm = FACADE.modifiers.new("weather", "DISPLACE")
dm.texture = weather
dm.strength = 6.0
for k in range(NGAL):
    gx = GAL_X + 30 + k * 30
    g0 = h1(gx, GAL_Y - 3)
    cut = cube(f"gal{k}", (gx, GAL_Y - 4, g0 + 1.4), (3.2, 34, 3.0), M["dark"])
    cut.hide_render = True
    cut.display_type = "WIRE"
    m_ = FACADE.modifiers.new(f"g{k}", "BOOLEAN")
    m_.operation = "DIFFERENCE"
    m_.object = cut
    # The big blocks that sealed each gallery, a little askew.
    cube(f"gseal{k}a", (gx + random.uniform(-0.15, 0.15), GAL_Y - 5.6, g0 + 0.72), (2.9, 1.3, 1.5), M["block"], rot=(0, 0, random.uniform(-0.06, 0.06)))
    cube(f"gseal{k}b", (gx + random.uniform(-0.3, 0.3), GAL_Y - 5.3, g0 + 2.1), (2.7, 1.2, 1.25), M["block"], rot=(random.uniform(-0.05, 0.12), 0, random.uniform(-0.1, 0.1)))
gz = h1(GAL_X + 90, GAL_Y - 12)
STONE_SPOTS += [((GAL_X + 105, GAL_Y - 14), 95.0, 9000), ((GAL_X + 92, GAL_Y - 9), 9.0, 500)]
CLEAR += [(GAL_X + 92, GAL_Y - 9, 2.4), (GAL_X + 95.6, GAL_Y - 11.6, 1.3)]
# The jetty: an L of rough stones running out into the sea, then turning.
stones = []
JET_Y = GAL_Y - 330
for k in range(150):
    if k < 95:
        cx_, cy_ = SEA_X - 80 + k * 1.9, JET_Y + random.uniform(-0.5, 0.5)
    else:
        cx_, cy_ = SEA_X - 80 + 95 * 1.9 + random.uniform(-0.5, 0.5), JET_Y + (k - 95) * 1.9
    for row in (-1, 0, 1):
        s_ = random.uniform(1.4, 2.3)
        ox, oy = (0, row * 3.2) if k < 95 else (row * 3.2, 0)
        stones.append((cx_ + ox - s_, cy_ + oy - s_, -67, cx_ + ox + s_, cy_ + oy + s_, -59.3 + random.uniform(-0.3, 0.6)))
boxes_mesh("jetty", stones, M["block"])
STONE_SPOTS += [((SEA_X - 90, JET_Y), 50.0, 5000)]


def sheet(name, w, l, mat, nx=8, ny=10, curl=0.004, seed=0):
    """A sheet of papyrus: a fine grid with a little buckle, so it never lies dead flat."""
    r = random.Random(seed)
    ph = [r.uniform(0, TAU) for _ in range(4)]
    v, f, uv = [], [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            u, t_ = i / nx, j / ny
            z = curl * (math.sin(u * 5 + ph[0]) + math.sin(t_ * 4 + ph[1]) + 0.6 * math.sin((u + t_) * 7 + ph[2])) + curl * 2.2
            v.append(((u - 0.5) * w, (t_ - 0.5) * l, z))
            uv.append((u, t_))
    for j in range(ny):
        for i in range(nx):
            a_ = j * (nx + 1) + i
            f.append((a_, a_ + 1, a_ + nx + 2, a_ + nx + 1))
    o = mesh_obj(name, v, f, mat)
    lay = o.data.uv_layers.new(name="UVMap")
    for poly in o.data.polygons:
        for li, vi in zip(poly.loop_indices, poly.vertices):
            lay.data[li].uv = uv[vi]
    o.data.shade_smooth()
    return o


# Papyri in front of a gallery mouth, under a skin of sand that drops away when they are found.
PAP_AT = Vector((GAL_X + 92, GAL_Y - 9, gz + 0.004))
for k in range(11):
    o = sheet(f"pap{k}", random.uniform(0.25, 0.6), random.uniform(0.3, 0.75), M["papyrus"], seed=k)
    o.location = PAP_AT + Vector((random.uniform(-1.6, 1.6), random.uniform(-1.0, 1.0), 0.0015 * k))
    o.rotation_euler.z = random.uniform(0, TAU)
cover = cube("cover", PAP_AT + Vector((0, 0, 0.1)), (4.6, 3.4, 0.2), M["ground"])
key(cover, "location", [(T("found"), cover.location.copy()), (T("found") + 18, cover.location + Vector((0, 0, -0.35)))])

# Merer's logbook, unrolled on a flat stone: ruled columns, strokes for writing.
LOG_AT = PAP_AT + Vector((3.2, -2.6, 0))
cube("logstone", LOG_AT + Vector((0.4, 0, 0.15)), (1.7, 0.85, 0.3), M["block"])
logsheet = sheet("logbook", 1.2, 0.44, M["logbook"], nx=14, ny=6, curl=0.002, seed=31)
logsheet.data.transform(Matrix.Translation((0.6, 0, 0)))  # unrolls from its left edge
logsheet.location = LOG_AT + Vector((-0.2, 0, 0.305))
bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.46, location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
roll = bpy.context.object
roll.data.materials.append(M["wood"])
key(logsheet, "scale", [(T("logbook") - 4, Vector((0.02, 1, 1))), (T("inspector") + 4, Vector((1, 1, 1)))])
roll.hide_render = True  # no roll: the logbook was found as fragments, not as a scroll (T&M 2014 p. 9; A7 pass 10)

# ---------------------------------------------------------------- today, on the timeline: what we can read, what we leave
NOW_AT = tl(NOW_Y) + Vector((-3.0, 0, 0.45))
cube("plinth", NOW_AT + Vector((0, 0, 0.45)), (1.3, 2.6, 0.9), M["slab"])
PL = NOW_AT + Vector((0, 0, 0.9))
readable = sheet("readable", 1.2, 0.5, M["logbook"], nx=14, ny=6, curl=0.002, seed=77)
readable.location = PL + Vector((0, -0.55, 0.003))
readable.rotation_euler.z = math.radians(90)
phone = cube("phone", PL + Vector((-0.1, 0.45, 0.006)), (0.075, 0.155, 0.009), M["phone"], rot=(0, 0, 0.3))
screen = cube("screen", PL + Vector((-0.1, 0.45, 0.011)), (0.066, 0.142, 0.001), M["screen"], rot=(0, 0, 0.3))
bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.0015, vertices=48, location=PL + Vector((0.22, 0.7, 0.002)))
disc = bpy.context.object
disc.name = "disc"
disc.data.materials.append(M["disc"])
book = cube("book", PL + Vector((0.05, 1.0, 0.02)), (0.15, 0.21, 0.035), M["book"], rot=(0, 0, -0.25))
pages = cube("pages", PL + Vector((0.05, 1.0, 0.02)), (0.14, 0.2, 0.029), M["pages"], rot=(0, 0, -0.25))
for k, o in enumerate((phone, screen, disc, book, pages)):
    key(o, "scale", [(T("you") - 2 + 3 * min(k, 3), Vector((0.001,) * 3)), (T("you") + 5 + 3 * min(k, 3), Vector((1, 1, 1)))])

# Where the paving stops: slabs stacked and waiting, a few already set out ahead.
waiting = []
for k, (dx, dy, n) in enumerate(((-9, -15, 4), (-15, 14, 3), (-24, -16, 2))):
    for q in range(n):
        ox, oy = random.uniform(-0.25, 0.25), random.uniform(-0.25, 0.25)
        waiting.append((NOW_AT.x + dx - 2.6 + ox, dy - 2.4 + oy, 0.02 + q * 0.42, NOW_AT.x + dx + 2.6 + ox, dy + 2.4 + oy, 0.4 + q * 0.42))
for dx, dy in ((-11, -5.0), (-12, 0.4), (-18, 5.2), (-30, 6.0)):
    waiting.append((NOW_AT.x + dx - 2.5, dy - 2.4, -0.2, NOW_AT.x + dx + 2.5, dy + 2.4, 0.33))
tl_objs.append(boxes_mesh("tl_waiting", waiting, M["block"]))
visible(tl_objs[-1], *TL_SEEN)
CLEAR += [(NOW_AT.x - 16, 0, 14)]

scatter_stones()

# ---------------------------------------------------------------- sky
world = bpy.data.worlds.new("sky")
world.use_nodes = True
scene.world = world
sky = world.node_tree.nodes.new("ShaderNodeTexSky")
for kind in ("MULTIPLE_SCATTERING", "SINGLE_SCATTERING", "NISHITA"):
    try:
        sky.sky_type = kind
        break
    except TypeError:
        continue
sky.sun_rotation = math.radians(240)  # from the south-south-west
for frame, deg in ((0, 30), (T("we"), 30), (T("four", 1), 8), (END, 6.5)):  # the day runs down over the close
    sky.sun_elevation = math.radians(deg)
    sky.keyframe_insert("sun_elevation", frame=frame)
W = N(world.node_tree)
wdir = W.new("ShaderNodeSeparateXYZ")
W.link(W.new("ShaderNodeTexCoord").outputs["Generated"], wdir.inputs[0])
under = W.math("MINIMUM", W.math("MAXIMUM", W.math("DIVIDE", wdir.outputs["Z"], -0.01), 0.0), 1.0)
deep = W.math("MINIMUM", W.math("MAXIMUM", W.math("DIVIDE", wdir.outputs["Z"], -0.45), 0.0), 1.0)
backdrop = W.mix(deep, (15.0, 14.0, 13.0), (9.0, 7.0, 5.0))
W.link(W.mix(under, sky.outputs["Color"], backdrop), world.node_tree.nodes["Background"].inputs["Color"])
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.05  # the sky model is physical: far too bright at 1

# ---------------------------------------------------------------- camera: one move, keyed to words
cam = link(bpy.data.objects.new("cam", bpy.data.cameras.new("cam")))
scene.camera = cam
cam.data.clip_start = 0.05
cam.data.clip_end = 100000
aim = link(bpy.data.objects.new("aim", None))
track = cam.constraints.new("TRACK_TO")
track.target = aim


def V3(*c):
    return Vector(c)


gal = V3(PAP_AT.x, PAP_AT.y + 1, gz)
# Straight down on the timeline (4 degrees off vertical, so the top of the frame is west): the
# pyramid at the bottom, today at the top, both spans at one scale.
MAP_AIM = V3(-430, 0, 0)
MAP_CAM = MAP_AIM + V3(250, 0, 3685)
# Each place gets its own shot with a slow drift; places are joined by cuts (two keys one frame
# apart), never by a fast flight: the words leave no time to travel slowly (owner, 2026-11-23).
SHOTS = [
    # frame, camera, aim, lens
    (T("it") - 12, V3(-268, -345, 8), V3(0, 0, 58), 26),  # matches the photo: the stepped core today; the casing wipes down
    (T("polished") + 2, V3(-234, -302, 7.2), V3(-5, -15, 54), 26),
    (T("polished") + 3, SCALE_AT + V3(-8.2, -12.2, 2.1), SCALE_AT + V3(1.5, 3.0, 3.2), 32),  # cut: joints, one person for scale
    (T("cleopatra", 0) + 1, SCALE_AT + V3(-9.0, -13.2, 2.2), SCALE_AT + V3(1.5, 3.0, 3.3), 32),
    (T("cleopatra", 0) + 2, MAP_CAM, MAP_AIM, 50),  # cut, under her portrait: the timeline from straight above
    (T("greek") - 1, MAP_CAM + V3(0, 0, -160), MAP_AIM, 50),
    # Cut. His hand, the pen, the page: no face. One slow push in to the nib.
    (T("greek"), NIB_AT + by_scroll(0.22, 0.35, 0.14) - SCROLL_AT, NIB_AT + by_scroll(0.04, 0, 0.018) - SCROLL_AT, 50),
    (T("stones") - 3, NIB_AT + by_scroll(0.16, 0.25, 0.1) - SCROLL_AT, NIB_AT + by_scroll(0.03, 0, 0.012) - SCROLL_AT, 50),
    (T("stones") - 2, V3(-345, -36, 4), V3(0, 0, 80), 22),  # cut: still in place, top to bottom
    (T("three") + 3, V3(-300, -26, 5), V3(0, 0, 70), 22),
    (T("three") + 4, V3(-r_in - 44, -30, 3.3), V3(-r_in + 5, -12, 5.5), 30),  # cut: among the men
    (T("twenty") - 1, V3(-r_in - 62, -40, 9), V3(-r_in + 20, -8, 7), 30),
    (T("twenty"), V3(-600, -90, 850), V3(-280, -42, 0), 20),  # cut: all 360,000 of them in frame
    (T("then,") - 1, V3(-620, -120, 850), V3(-280, -54, 0), 20),
    (T("then,"), V3(4770, JET_Y - 145, -40), V3(4170, GAL_Y, -32), 38),  # cut: the Red Sea coast, the jetty, the galleries
    (T("found") - 3, V3(4700, JET_Y - 95, -44), V3(4170, GAL_Y, -32), 38),
    (T("found") - 2, gal + V3(7, -26, 8.5), gal + V3(0, 2, 0.5), 30),  # cut: a gallery mouth
    (T("khufu."), gal + V3(3.5, -13, 4.5), gal + V3(0, 1, 0), 30),
    (T("oldest") - 1, gal + V3(3.2, -12, 4.2), gal + V3(0, 1, 0), 30),
    (T("oldest"), PAP_AT + V3(1.9, -3.2, 1.7), PAP_AT + V3(0, 0, 0), 30),  # cut: the oldest papyri
    (T("among") - 10, PAP_AT + V3(1.4, -2.4, 1.3), PAP_AT + V3(0, 0, 0), 30),
    (T("logbook") - 4, LOG_AT + V3(0.4, -2.3, 1.9), LOG_AT + V3(0.4, 0, 0.3), 34),  # across to the logbook, 3 m away
    (T("his") - 1, LOG_AT + V3(0.45, -2.1, 1.8), LOG_AT + V3(0.45, 0, 0.3), 34),
    (T("his"), boat_at(T("his")) + V3(-60, -40, 14), boat_at(T("his")) + V3(0, 0, 3), 28),  # cut: the boat, Tura behind
    (T("away") + 7, boat_at(T("away") + 7) + V3(-55, -38, 13), boat_at(T("away") + 7) + V3(0, 0, 3), 28),
    (T("away") + 8, V3(720, -2450, 820), V3(720, 0, -40), 20),  # cut: Tura and Giza, opposite banks
    (T("they") - 1, V3(700, -2450, 820), V3(700, 0, -40), 20),
    (T("they"), MAP_CAM, MAP_AIM, 50),  # cut: the timeline again: written, then found
    (T("we") - 1, MAP_CAM + V3(0, 0, -120), MAP_AIM, 50),
    (T("we"), PL + V3(1.65, -0.6, 1.75), PL + V3(0, -0.55, 0.0), 32),  # cut: today: the log, readable
    (T("what", 1) - 4, PL + V3(1.45, -0.5, 1.55), PL + V3(0, -0.5, 0.0), 32),
    (T("leave"), PL + V3(1.05, 0.72, 1.2), PL + V3(0, 0.72, 0.0), 32),  # ...and what we might leave, beside it
    (T("four", 1) - 1, PL + V3(1.0, 0.72, 1.15), PL + V3(0, 0.72, 0.0), 32),
    (T("four", 1), NOW_AT + V3(-6, 0, 3.0), NOW_AT + V3(-400, 0, 2.5), 24),  # cut: 4,000 years still to pave
    (END, NOW_AT + V3(-14, 0, 3.6), NOW_AT + V3(-400, 0, 2.5), 24),
]
cam.data.dof.use_dof = True
cam.data.dof.focus_object = focus
for frame, fstop in ((0, 64.0), (T("greek") - 1 + SHIFT, 64.0), (T("greek") + SHIFT, 2.0), (T("stones") - 3 + SHIFT, 2.8), (T("stones") - 2 + SHIFT, 64.0), (END, 64.0)):
    cam.data.dof.aperture_fstop = fstop  # wide open only over his shoulder; everything else stays sharp
    cam.data.dof.keyframe_insert("aperture_fstop", frame=frame)
# A cut is two keys one frame apart. CUTS lists the first frame of each new shot, as written.
CUTS = [SHOTS[i + 1][0] for i in range(len(SHOTS) - 1) if SHOTS[i + 1][0] - SHOTS[i][0] == 1]
SHOTS = [(f + SHIFT if (f in CUTS or f + 1 in CUTS) else f, c, a_, lens) for f, c, a_, lens in SHOTS]
for frame, c, a_, lens in SHOTS:
    cam.location = c
    aim.location = a_
    cam.data.lens = lens
    cam.keyframe_insert("location", frame=frame)
    aim.keyframe_insert("location", frame=frame)
    cam.data.keyframe_insert("lens", frame=frame)
for block in (cam, aim, cam.data):  # steady drifts, and cuts that do not ease into each other
    linear_keys(block)

# ---------------------------------------------------------------- anchors for the overlays
ANCHORS = {
    # name: (point or object, first frame, last frame)
    "person": (SCALE_AT + V3(0, 0, 1.85), T("smooth,"), T("closer")),
    "casing": (V3(-40, -BASE / 2 + 18, 30), T("it"), T("cleopatra", 0)),
    "tl_built": (tl(BUILT), T("cleopatra", 0), END),
    "tl_cleo": (tl(CLEO), T("cleopatra", 0), END),
    "tl_moon": (tl(MOON), T("cleopatra", 0), END),
    "tl_found": (tl(FOUND), T("cleopatra", 0), END),
    "diodorus": (SCROLL_AT + V3(0, 0.1, 0.1), T("greek"), T("he", 1)),
    "scroll": (SCROLL_AT, T("greek"), T("he", 1)),
    "sea": (V3(SEA_X + 60, JET_Y - 60, -60.5), T("then"), T("oldest")),
    "galleries": (V3(GAL_X + 120, GAL_Y, 2), T("then"), T("oldest")),
    "papyri": (PAP_AT + V3(0, 0, 0.2), T("then"), T("among")),
    "logbook": (LOG_AT + V3(0.4, 0, 0.5), T("among"), T("his")),
    "boat": (hull, T("his"), T("they")),
    "tura": (V3(TURA_X + 40, -100, 25), T("his"), T("they")),
    "giza": (V3(0, 0, HEIGHT + 10), T("his"), T("they")),
    "readable": (PL + V3(0, -0.55, 0.05), T("we"), END),
    "objects": (PL + V3(0.05, 0.75, 0.05), T("we"), END),
    "future": (tl(FUTURE) + V3(0, 0, 2), T("what", 1), END),
}
scene.render.resolution_x = args.width
scene.render.resolution_y = args.width * 16 // 9
if not args.no_anchors:
    crowd_mod.show_viewport = False  # the crowd moves no anchor; skip evaluating it
    out = {"fps": FPS, "start": CLIP_START, "cuts": CUTS, "anchors": {}}  # the clip's start, whatever range this run renders
    for name, (pt, f0, f1) in ANCHORS.items():
        out["anchors"][name] = {"f0": f0, "pts": []}
    for f in range(min(a_[1] for a_ in ANCHORS.values()), max(a_[2] for a_ in ANCHORS.values()) + 1):
        scene.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        for name, (pt, f0, f1) in ANCHORS.items():
            if f0 <= f <= f1:
                w = pt.evaluated_get(dg).matrix_world.translation if hasattr(pt, "matrix_world") else pt
                c = world_to_camera_view(scene, cam.evaluated_get(dg), w)
                out["anchors"][name]["pts"].append([round(c.x, 4), round(1 - c.y, 4), 1 if c.z > 0 else 0])
    crowd_mod.show_viewport = True
    (ROOT / "src/generated/cleopatra-world.anchors.json").write_text(json.dumps(out, separators=(",", ":")))

# ---------------------------------------------------------------- render
scene.render.engine = "CYCLES"
if not args.cpu:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.refresh_devices()
    for d in prefs.devices:
        d.use = d.type == "METAL"
    scene.cycles.device = "GPU"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 4
scene.cycles.transparent_max_bounces = 12  # palm fronds and torn papyrus edges are cut out by alpha
scene.cycles.use_auto_tile = False
scene.render.use_persistent_data = True
try:
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Punchy"
except TypeError:
    pass
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
if args.save:
    bpy.ops.wm.save_as_mainfile(filepath=args.save)
only = args.only
if args.around_cuts:  # the second half of each cross-dissolve
    only = sorted({f for c in CUTS for f in range(c - args.around_cuts, c + args.around_cuts) if (args.start or 0) <= f <= (args.end or END)})
if args.build_only:
    pass
elif only:
    for f in only:
        scene.frame_set(f)
        scene.render.filepath = f"{args.out}/{f:04d}.png"
        bpy.ops.render.render(write_still=True)
else:
    scene.frame_start = args.start or CLIP_START
    scene.frame_end = args.end or END
    scene.render.filepath = f"{args.out}/"
    bpy.ops.render.render(animation=True)
