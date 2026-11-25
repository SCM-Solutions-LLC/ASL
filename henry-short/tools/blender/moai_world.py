"""The moai-reshaped short as one 3D world: Rano Raraku and its roads, the statues lying along them,
a statue walked by ropes, the concrete test replica and its crew, and a platform (ahu) on the coast.

Not part of `npm run setup`: run it with an installed Blender 5.3.
  tools/blender/fetch_assets.sh                      # once: the CC0 texture scans
  blender -b --factory-startup --python tools/blender/moai_world.py -- --out /tmp/moai --width 540
  ffmpeg -framerate 30 -i /tmp/moai/%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p public/3d/moai-world.mp4
  # cross-dissolves: the incoming shot around each cut (black elsewhere), as for cleopatra_world.py
  blender -b --factory-startup --python tools/blender/moai_world.py -- --out /tmp/moai-b --width 540 --cut-shift -7 --around-cuts 7 --no-anchors
It also writes src/generated/moai-world.anchors.json: where each labelled point lands on screen, frame
by frame, so the Remotion overlays (width bars, lean lines, pins) stick to the 3D statues.

Shapes are procedural (own work); surfaces use CC0 scans from Poly Haven, credited in
public/SOURCES.json (D1). Every beat hangs off a spoken word in
src/generated/moai-reshaped.alignment.json. What the world may show is set by
script/moai-reshaped.txt SOURCES and review/moai-reshaped.a6.md (A6):
- The statues are generic moai, not portraits of any one statue (C6). Proportions follow LH25
  qualitatively: road statues have a base about as wide as the shoulders and lean forward; platform
  statues stand upright with a base narrower than the shoulders. The exact ratios are NOT drawn to
  the corrected Zenodo means (not verified by A7).
- Eye sockets: on platform statues only, never on road statues (LH25 1.1).
- Walking: rocked side to side on ropes, each rock a step forward (LH25 1.1, Fig. 1). The ancient
  walk has islanders on two side ropes and a rear rope, 22 for a 6 m statue: inside LH25 1.5's
  model (20-35 people to start a 4-6 m statue, 5-10 on the rear); "crew size illustrative".
- The test: a concrete replica, 4 people on each side rope and 10 on the rear rope (LH25 1.4). LH25
  does not give its size; it is sized from its mass (4.35 t) at an assumed concrete density.
- The island is compressed and the statues on the roads are spaced for legibility: not to scale.
- "Some think many road statues were set up there on purpose": gold ghosts standing where the
  fallen ones lie, a reading, not a reconstruction. Gold ghosts are never stone.
"""
import argparse
import json
import math
import random
import sys
from pathlib import Path

import zlib

import bmesh
import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

p = argparse.ArgumentParser()
p.add_argument("--out", required=True)
p.add_argument("--width", type=int, default=540)
p.add_argument("--samples", type=int, default=24)
p.add_argument("--start", type=int)
p.add_argument("--end", type=int)
p.add_argument("--only", type=int, nargs="*", help="render just these frames (stills for checking)")
p.add_argument("--cpu", action="store_true")
p.add_argument("--no-anchors", action="store_true")
p.add_argument("--save", help="also save the .blend here")
p.add_argument("--cut-shift", type=int, default=0, help="move every cut this many frames (cross-dissolves: render the frames around each cut again at -H)")
p.add_argument("--around-cuts", type=int, default=0, help="render only the frames within this many frames of a cut")
p.add_argument("--build-only", action="store_true")
args = p.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else None)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ASSETS = HERE / "assets"
FPS = 30
WORDS = json.load(open(ROOT / "src/generated/moai-reshaped.alignment.json"))["words"]
TAU = math.tau
SHIFT = args.cut_shift  # every cut, and what switches with it, moves together


def T(word, n=0):
    """Frame at which the n-th occurrence of a spoken word starts (punctuation ignored)."""
    word = word.lower().strip(".,?:;!")
    hits = [w["start"] for w in WORDS if w["text"].lower().strip(".,?:;!") == word]
    return round(hits[n] * FPS)


END = round(WORDS[-1]["end"] * FPS) + round(1.6 * FPS)  # the edit's 1.6 s tail
OUTRO = 24  # the edit's outro after that: the picture holds on the last shot
random.seed(11)
rng = np.random.default_rng(11)

# ---------------------------------------------------------------- helpers
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS


def V3(*c):
    return Vector(c)


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


def visible(o, *windows):
    """Show an object only inside these (first, last) frame windows."""
    o.hide_render = True
    o.keyframe_insert("hide_render", frame=0)
    for a, b in windows:
        o.hide_render = False
        o.keyframe_insert("hide_render", frame=a)
        o.hide_render = True
        o.keyframe_insert("hide_render", frame=b)


def linear_keys(idblock):
    for layer in idblock.animation_data.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = "LINEAR"


def smooth(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


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
        """A Poly Haven scan, box-projected; `tile` is its repeat in metres."""
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
        cd = self.new("ShaderNodeCameraData")
        return self.math("SUBTRACT", 1, self.math("DIVIDE", cd.outputs["View Distance"], dist), clamp=True)


HAZE = (0.62, 0.70, 0.80)
MAP_WIN = (T("the") + SHIFT, T("apparently") + SHIFT)  # "The clues are in the statues that never arrived. Dozens lie along the old roads from the quarry,"


def make_mat(name, build, haze=True):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    g = N(nt)
    bsdf = nt.nodes["Principled BSDF"]
    out = nt.nodes["Material Output"]
    build(g, bsdf)
    if haze:  # aerial perspective: distant land fades toward the sky colour (off for the map, seen from 40 km)
        cd = g.new("ShaderNodeCameraData")
        hz = g.new("ShaderNodeValue")
        for frame, v in ((0, 9000.0), (MAP_WIN[0], 1e9), (MAP_WIN[1], 9000.0)):
            hz.outputs[0].default_value = v
            hz.outputs[0].keyframe_insert("default_value", frame=frame)
        for fc in nt.animation_data.action.layers[0].strips[0].channelbags[0].fcurves:
            if f'nodes["{hz.name}"]' in fc.data_path:  # only the haze switch; the water's clock stays linear
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"
        d = g.math("DIVIDE", cd.outputs["View Distance"], g.math("MULTIPLY", hz.outputs[0], -1))
        f = g.math("SUBTRACT", 1, g.math("EXPONENT", d), clamp=True)
        em = g.new("ShaderNodeEmission", Color=(*HAZE, 1), Strength=0.6)
        mx = g.new("ShaderNodeMixShader")
        g.link(f, mx.inputs["Fac"])
        g.link(bsdf.outputs[0], mx.inputs[1])
        g.link(em.outputs[0], mx.inputs[2])
        g.link(mx.outputs[0], out.inputs["Surface"])
    return m


GRASS = [(0.15, (0.07, 0.17, 0.03)), (0.45, (0.17, 0.33, 0.06)), (0.7, (0.30, 0.45, 0.10)), (0.9, (0.45, 0.52, 0.20))]  # lush island grass
SOIL = [(0.2, (0.22, 0.09, 0.05)), (0.55, (0.40, 0.19, 0.10)), (0.85, (0.55, 0.32, 0.20))]  # reddish volcanic soil
TUFF = [(0.15, (0.28, 0.20, 0.12)), (0.5, (0.55, 0.43, 0.29)), (0.85, (0.76, 0.64, 0.46))]  # golden-brown volcanic tuff
BASALT = [(0.15, (0.08, 0.08, 0.08)), (0.5, (0.20, 0.19, 0.18)), (0.85, (0.36, 0.34, 0.31))]
CONCRETE = [(0.2, (0.36, 0.36, 0.35)), (0.5, (0.55, 0.55, 0.53)), (0.85, (0.70, 0.70, 0.68))]


def ground_build(g, bsdf):
    """Grassland: scanned grass up close, an aerial grass scan at range, bare tuff on steep ground and
    on the quarried flank; tone from a ramp so both scans read as the same dry grass."""
    co = g.coord()
    near = g.near(90)
    big = g.new("ShaderNodeTexNoise", Scale=0.003, Detail=6.0, Roughness=0.6)
    g.link(co, big.inputs["Vector"])
    far = g.mix(big.outputs["Fac"], g.scan("aerial_grass_rock", "diff", 37), g.scan("aerial_grass_rock", "diff", 61))
    fine = g.scan("grass_ground", "diff", 2.2)
    lum = g.lum(g.mix(near, far, fine))
    mid = g.new("ShaderNodeTexNoise", Scale=0.03, Detail=4.0)
    g.link(co, mid.inputs["Vector"])
    lum = g.math("ADD", lum, g.math("MULTIPLY", g.math("SUBTRACT", big.outputs["Fac"], 0.5), 0.7))
    lum = g.math("ADD", lum, g.math("MULTIPLY", g.math("SUBTRACT", mid.outputs["Fac"], 0.5), 0.35))
    huge = g.new("ShaderNodeTexNoise", Scale=0.00025, Detail=4.0)  # kilometre-scale patches, so the island reads from the air
    g.link(co, huge.inputs["Vector"])
    lum = g.math("ADD", lum, g.math("MULTIPLY", g.math("SUBTRACT", huge.outputs["Fac"], 0.5), 0.8))
    tone = g.ramp(lum, GRASS)
    rock = g.mix(big.outputs["Fac"], g.scan("rock_boulder_dry", "diff", 23.0), g.scan("rock_boulder_dry", "diff", 41.0))  # large tiles, swapped by noise: no visible repeat from the air
    tone = g.mix(g.attr("rock"), tone, g.ramp(g.lum(rock), TUFF))
    g.link(tone, bsdf.inputs["Base Color"])
    n1 = g.bump(g.scan("aerial_grass_rock", "disp", 37), 0.4, 0.5)
    n2 = g.bump(g.math("MULTIPLY", g.lum(g.scan("grass_ground", "disp", 2.2)), near), 0.7, 0.04, n1)
    n3 = g.bump(g.math("MULTIPLY", g.lum(g.scan("rock_boulder_dry", "disp", 23.0)), g.attr("rock")), 0.8, 0.6, n2)
    g.link(n3, bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.95


def stone_build(asset, tile, palette, bump, rough, dist=0.06):
    def build(g, bsdf):
        c = g.scan(asset, "diff", tile)
        n = g.new("ShaderNodeTexNoise", Scale=0.4, Detail=4.0)
        g.link(g.coord(), n.inputs["Vector"])
        l_ = g.math("ADD", g.lum(c), g.math("MULTIPLY", g.math("SUBTRACT", n.outputs["Fac"], 0.5), 0.35))
        g.link(g.ramp(l_, palette), bsdf.inputs["Base Color"])
        g.link(g.bump(g.lum(g.scan(asset, "disp", tile)), bump, dist), bsdf.inputs["Normal"])
        bsdf.inputs["Roughness"].default_value = rough

    return build


def tuff_build(g, bsdf):
    """Rano Raraku tuff as weathered statue stone: the scanned rock for grain, dark lapilli specks,
    rain streaks down the faces, pale and dark lichen in patches, and darker crevices (ambient
    occlusion), so the carved features read at a distance."""
    co = g.coord()
    c = g.scan("rock_boulder_dry", "diff", 1.6)
    big = g.new("ShaderNodeTexNoise", Scale=0.35, Detail=5.0, Roughness=0.6)
    g.link(co, big.inputs["Vector"])
    streak_v = g.new("ShaderNodeMapping")
    streak_v.inputs["Scale"].default_value = (5.0, 5.0, 0.35)  # stretched up the statue: rain streaks
    g.link(co, streak_v.inputs["Vector"])
    streak = g.new("ShaderNodeTexNoise", Scale=1.6, Detail=3.0)
    g.link(streak_v.outputs[0], streak.inputs["Vector"])
    l_ = g.math("ADD", g.lum(c), g.math("MULTIPLY", g.math("SUBTRACT", big.outputs["Fac"], 0.5), 0.45))
    l_ = g.math("SUBTRACT", l_, g.math("MULTIPLY", g.math("MAXIMUM", g.math("SUBTRACT", streak.outputs["Fac"], 0.55), 0.0), 1.2))
    tone = g.ramp(l_, TUFF)
    specks = g.new("ShaderNodeTexVoronoi", Scale=22.0)  # lapilli: small dark inclusions in the tuff
    g.link(co, specks.inputs["Vector"])
    speck = g.math("LESS_THAN", specks.outputs["Distance"], 0.12)
    tone = g.mix(g.math("MULTIPLY", speck, 0.7), tone, (0.10, 0.09, 0.08))
    lich = g.new("ShaderNodeTexNoise", Scale=2.2, Detail=6.0, Roughness=0.7)
    g.link(co, lich.inputs["Vector"])
    pale = g.math("MULTIPLY", g.math("MAXIMUM", g.math("SUBTRACT", lich.outputs["Fac"], 0.58), 0.0), 6.0, clamp=True)
    tone = g.mix(pale, tone, (0.62, 0.60, 0.52))
    dark = g.math("MULTIPLY", g.math("MAXIMUM", g.math("SUBTRACT", 0.40, lich.outputs["Fac"]), 0.0), 5.0, clamp=True)
    tone = g.mix(g.math("MULTIPLY", dark, 0.8), tone, (0.14, 0.13, 0.11))
    ao = g.new("ShaderNodeAmbientOcclusion", Distance=0.35)
    shade = g.math("ADD", 0.45, g.math("MULTIPLY", ao.outputs["AO"], 0.55))
    col = g.new("ShaderNodeMix")
    col.data_type = "RGBA"
    col.blend_type = "MULTIPLY"
    col.inputs["Factor"].default_value = 1.0
    g.link(tone, col.inputs[6])
    sh = g.new("ShaderNodeCombineColor")
    for k_ in ("Red", "Green", "Blue"):
        g.link(shade, sh.inputs[k_])
    g.link(sh.outputs[0], col.inputs[7])
    g.link(col.outputs[2], bsdf.inputs["Base Color"])
    pits = g.new("ShaderNodeTexVoronoi", Scale=9.0)  # vesicles and pitting
    g.link(co, pits.inputs["Vector"])
    n1 = g.bump(g.lum(g.scan("rock_boulder_dry", "disp", 1.6)), 0.9, 0.06)
    n2 = g.bump(pits.outputs["Distance"], 0.35, 0.02, n1)
    n3 = g.bump(big.outputs["Fac"], 0.25, 0.15, n2)
    g.link(n3, bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.93


def road_build(g, bsdf):
    """Packed reddish soil, faded out at both edges (UV x runs 0..1 across the road)."""
    c = g.scan("dry_ground_01", "diff", 3.0)
    g.link(g.ramp(g.lum(c), SOIL), bsdf.inputs["Base Color"])
    g.link(g.bump(g.lum(g.scan("dry_ground_01", "disp", 3.0)), 0.6, 0.05), bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.95
    uv = g.new("ShaderNodeSeparateXYZ")
    g.link(g.coord("UV"), uv.inputs[0])
    edge = g.math("MULTIPLY", g.math("SUBTRACT", 0.5, g.math("ABSOLUTE", g.math("SUBTRACT", uv.outputs["X"], 0.5))), 4.0)
    n = g.new("ShaderNodeTexNoise", Scale=0.8, Detail=3.0)
    g.link(g.coord(), n.inputs["Vector"])
    g.link(g.math("MULTIPLY", g.math("MINIMUM", edge, 1.0), g.math("ADD", 0.05, g.math("MULTIPLY", n.outputs["Fac"], 0.55))), bsdf.inputs["Alpha"])


def plain(col, rough=0.8):
    def build(g, bsdf):
        bsdf.inputs["Base Color"].default_value = (*col, 1)
        bsdf.inputs["Roughness"].default_value = rough

    return build


def water_build(g, bsdf):
    w = g.new("ShaderNodeValue")
    n = g.new("ShaderNodeTexNoise", Scale=0.02, Detail=5.0, Roughness=0.55)
    n.noise_dimensions = "4D"
    g.link(g.coord(), n.inputs["Vector"])
    g.link(w.outputs[0], n.inputs["W"])
    n2 = g.new("ShaderNodeTexNoise", Scale=0.2, Detail=3.0)
    n2.noise_dimensions = "4D"
    g.link(g.coord(), n2.inputs["Vector"])
    g.link(w.outputs[0], n2.inputs["W"])
    bsdf.inputs["Base Color"].default_value = (0.02, 0.07, 0.12, 1)
    bsdf.inputs["Roughness"].default_value = 0.06
    g.link(g.bump(n2.outputs["Fac"], 0.12, 0.1, g.bump(n.outputs["Fac"], 0.25, 0.6)), bsdf.inputs["Normal"])
    for frame, v in ((0, 0.0), (END, END / FPS * 0.25)):
        w.outputs[0].default_value = v
        w.outputs[0].keyframe_insert("default_value", frame=frame)


def ghost_mat(name, windows, keys=None):
    """Gold, see-through, unlit: a 'before' or a reading, never stone. Fades in and out over each
    (first, last) window, or follows explicit (frame, strength) keys."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes["Principled BSDF"])
    g = N(nt)
    em = g.new("ShaderNodeEmission", Color=(1.0, 0.72, 0.22, 1), Strength=2.2)
    tr = g.new("ShaderNodeBsdfTransparent")
    lw = g.new("ShaderNodeLayerWeight", Blend=0.35)
    fac = g.new("ShaderNodeValue")
    rim = g.math("POWER", lw.outputs["Facing"], 3.0)  # an outline: bright at the silhouette, clear in the middle
    a = g.math("MULTIPLY", g.math("ADD", 0.03, g.math("MULTIPLY", rim, 0.9)), fac.outputs[0])
    mx = g.new("ShaderNodeMixShader")
    g.link(a, mx.inputs["Fac"])
    g.link(tr.outputs[0], mx.inputs[1])
    g.link(em.outputs[0], mx.inputs[2])
    g.link(mx.outputs[0], nt.nodes["Material Output"].inputs["Surface"])
    if keys is None:
        keys = [(0, 0.0)]
        for f0, f1 in windows:
            keys += [(f0, 0.0), (f0 + 10, 1.0), (f1 - 10, 1.0), (f1, 0.0)]
    for frame, v in keys:
        fac.outputs[0].default_value = v
        fac.outputs[0].keyframe_insert("default_value", frame=frame)
    return m


M = {
    "ground": make_mat("ground", ground_build),
    "road": make_mat("road", road_build),
    "tuff": make_mat("tuff", tuff_build),
    "ahu": make_mat("ahu", stone_build("stacked_stone_wall", 3.0, BASALT, 0.8, 0.85, 0.08)),
    "concrete": make_mat("concrete", stone_build("concrete", 1.6, CONCRETE, 0.25, 0.8, 0.02)),
    "sea": make_mat("sea", water_build),
    "lawn": make_mat("lawn", ground_build),
    "rope": make_mat("rope", plain((0.42, 0.33, 0.20), 0.9), haze=False),
    "stake": make_mat("stake", plain((0.85, 0.82, 0.75), 0.6), haze=False),
}

# ---------------------------------------------------------------- the moai
# A generic moai lofted from rounded-box sections up its height. Unit S is half the shoulder width;
# LH25's road moai 12-220-01 is 7.35 m tall and 2.83 m wide, so S = 0.1925 H.
ROWS_T = np.concatenate([np.linspace(0, 0.5, 34, endpoint=False), np.linspace(0.5, 0.93, 86, endpoint=False), np.linspace(0.93, 1.0, 10)])
SHOULDER_T = 0.40
ROAD_BASE, PLAT_BASE, LEAN = 0.99, 0.88, 9.0  # LH25: road ratio ~1.0, lean 6-15 deg; platform base narrower (illustrative, not a measured ratio)


def gauss(x, mu, sig):
    return np.exp(-(((x - mu) / sig) ** 2))


def band(x, a, b, soft):
    return np.clip((x - a) / soft + 0.5, 0, 1) * np.clip((b - x) / soft + 0.5, 0, 1)


def moai_verts(H, cols, base, lean_deg, sockets, platform):
    """Vertex positions (rows x cols, then the top and bottom centres) for one shape of the statue.
    Front is -y; base centre at the origin."""
    S = 0.1925 * H
    t = ROWS_T[:, None]
    phi = np.linspace(0, TAU, cols, endpoint=False)[None, :]
    s, c = np.sin(phi), np.cos(phi)
    e = 2.8  # superellipse: rounded box sections
    sx = np.sign(s) * np.abs(s) ** (2 / e)
    cy = np.sign(c) * np.abs(c) ** (2 / e)
    # half width: base, out to the shoulders, in at the neck, the long head, a rounded top
    low = base + (1.0 - base) * np.clip(t / SHOULDER_T, 0, 1) ** 1.6
    hw = np.where(t < SHOULDER_T, low, np.interp(t, [SHOULDER_T, 0.47, 0.53, 0.60, 0.86, 0.95, 0.99, 1.0], [1.0, 0.95, 0.78, 0.82, 0.80, 0.74, 0.58, 0.05]))
    hw = hw + 0.07 * band(t, 0.64, 0.90, 0.03) * np.clip(np.abs(s) * 1.4 - 0.6, 0, 1) * (c < 0.2)  # long ears
    df = 1.35 * np.interp(t, [0.0, 0.25, 0.40, 0.50, 0.54, 0.60, 0.90, 0.97, 1.0], [0.50, 0.55, 0.48, 0.40, 0.46, 0.46, 0.48, 0.34, 0.05])
    db = 1.35 * np.interp(t, [0.0, 0.45, 0.52, 0.60, 0.92, 0.98, 1.0], [0.42, 0.45, 0.38, 0.50, 0.50, 0.30, 0.05])
    if platform:  # LH25 1.1: "Carvers removed material from the front of the base"
        df = df * (1 - 0.16 * np.clip(1 - t / 0.22, 0, 1))
    u = sx  # lateral position across the front, -1..1
    face = np.zeros_like(t * u)
    face += 0.17 * gauss(t, 0.858, 0.017) * band(u, -0.78, 0.78, 0.15)  # the brow
    k = np.clip((0.845 - t) / 0.18, 0, 1)  # the long nose
    nose_w = 0.09 + 0.13 * k**2
    face += (0.05 + 0.30 * k**1.3) * np.exp(-((u / nose_w) ** 4)) * band(t, 0.655, 0.86, 0.012)
    face += 0.12 * gauss(t, 0.636, 0.010) * band(u, -0.30, 0.30, 0.10)  # pouting lips
    face += 0.09 * gauss(t, 0.614, 0.010) * band(u, -0.26, 0.26, 0.10)
    face -= 0.05 * gauss(t, 0.625, 0.004) * band(u, -0.30, 0.30, 0.06)
    face += 0.09 * gauss(t, 0.573, 0.020) * band(u, -0.45, 0.45, 0.15)  # the chin
    fingers = 0.75 + 0.25 * np.cos(u * 46)
    face += 0.05 * gauss(t, 0.165, 0.030) * (band(u, 0.18, 0.86, 0.08) + band(u, -0.86, -0.18, 0.08)) * fingers  # hands on the belly
    face += 0.035 * band(t, 0.18, 0.40, 0.04) * (band(u, 0.80, 1.05, 0.06) + band(u, -1.05, -0.80, 0.06))  # arms down the sides
    if sockets:  # carved only once a statue stood on its platform (LH25 1.1)
        face -= 0.34 * gauss(t, 0.806, 0.026) * (gauss(u, 0.37, 0.15) + gauss(u, -0.37, 0.15))  # deep enough to read in a wide shot
    front = np.clip((c - 0.15) / 0.6, 0, 1)
    x = hw * sx * S
    y = np.where(c > 0, -df * cy * S - face * front * S, -db * cy * S)
    z = t * H + 0 * phi
    y = y - z * math.tan(math.radians(lean_deg))  # the forward lean
    v = np.stack([x, y, z], -1).reshape(-1, 3)
    top = [0.0, -H * math.tan(math.radians(lean_deg)), H]
    return np.concatenate([v, [top, [0.0, 0.0, 0.0]]])


def moai_faces(cols):
    n = len(ROWS_T)
    f = []
    for i in range(n - 1):
        for j in range(cols):
            a, b = i * cols + j, i * cols + (j + 1) % cols
            f.append((a, b, b + cols, a + cols))
    top, bot = n * cols, n * cols + 1
    f += [((n - 1) * cols + j, (n - 1) * cols + (j + 1) % cols, top) for j in range(cols)]
    f += [((j + 1) % cols, j, bot) for j in range(cols)]
    return f


def moai(name, H, mat, cols=96, kind="road", keys=False):
    """kind 'road': wide base, forward lean, no eye sockets; 'platform': narrow base, upright,
    sockets. keys=True: a road-shaped basis with shape keys 'platform' and 'sockets'."""
    plat = kind == "platform"
    basis = moai_verts(H, cols, PLAT_BASE if plat else ROAD_BASE, 0 if plat else LEAN, plat, plat)
    o = mesh_obj(name, basis, moai_faces(cols), mat)
    o.data.shade_smooth()
    if keys:
        o.shape_key_add(name="Basis")
        for kname, v in (
            ("platform", moai_verts(H, cols, PLAT_BASE, 0, False, True)),
            ("trim", moai_verts(H, cols, PLAT_BASE, LEAN, False, True)),  # base cut back, still leaning
            ("sockets", moai_verts(H, cols, ROAD_BASE, LEAN, True, False)),
        ):
            kb = o.shape_key_add(name=kname, from_mix=False)
            kb.data.foreach_set("co", v.astype(np.float32).ravel())
    return o


def shape_key(o, name, pairs):
    kb = o.data.shape_keys.key_blocks[name]
    for frame, v in pairs:
        kb.value = v
        kb.keyframe_insert("value", frame=frame)


def edge_pt(H, t, u, base=ROAD_BASE, lean=LEAN):
    """The statue's side edge at height fraction t (u = +1 or -1), in its own frame."""
    S = 0.1925 * H
    hw = base + (1 - base) * min(t / SHOULDER_T, 1) ** 1.6 if t < SHOULDER_T else 1.0
    return V3(u * hw * S, -t * H * math.tan(math.radians(lean)), t * H)


def pin(name, parent, co):
    """A named point for the overlays, carried by `parent` if given."""
    # A clash makes Blender rename the pin, and the anchor bake then tracks the other object (A7 pass 5).
    assert name not in bpy.data.objects, f"pin name {name!r} is already an object"
    e = link(bpy.data.objects.new(name, None))
    e.parent = parent
    e.location = co
    return e


# ---------------------------------------------------------------- the island: Rapa Nui, simplified
# A triangle about 24 km across: Rano Kau at the south-west tip, Terevaka in the north, Poike at the
# east tip, and Rano Raraku, the quarry, just inland of the south-east coast (UCLA newsroom: "the Rano
# Raraku quarry on the eastern side"; A7 pass 1). The coast is drawn freehand, simplified: the map
# says so on screen.
X0, X1, Y0, Y1 = -14000.0, 14000.0, -10000.0, 10000.0
COAST = np.array([(-10200, -4400), (-9000, -5200), (-3000, -3600), (3000, -2000), (7800, -900), (10600, 400), (11400, 2000), (9500, 3400), (3500, 4900), (-1000, 5600), (-3800, 6200), (-6500, 3500), (-8800, 0), (-9600, -2600)], float)
Q = V3(6300.0, 0.0, 0.0)  # Rano Raraku, the quarry
AHU = V3(7550.0, -800.0, 0.0)  # a platform near the south-east coast; its statues face inland (+y)
ROADS = {  # old roads radiating from the quarry (LH25 1.1: roads "radiate from Rano Raraku"), as control points
    "w": [(5900, 250), (4800, 700), (2500, 1300), (0, 1200), (-3000, 300), (-6000, -1200)],
    "s": [(6000, -350), (4500, -1100), (2000, -1750), (-1500, -2500), (-5000, -3200), (-8000, -3700)],
    "n": [(6400, 350), (5800, 1800), (4800, 3000), (3800, 4300)],
}
VOLCANOES = [  # (x, y, height, radius, crater radius, crater depth)
    (-4000, 3300, 470, 4200, 0, 0),  # Terevaka
    (-8900, -4500, 300, 1700, 800, 210),  # Rano Kau, with its crater lake
    (10300, 1900, 330, 1900, 0, 0),  # Poike
]


def road_path(pts, step=3.0):
    pts = np.array(pts, float)
    seg = np.hypot(*np.diff(pts, axis=0).T)
    s_ = np.concatenate([[0], np.cumsum(seg)])
    ss = np.arange(0, s_[-1], step)
    x = np.interp(ss, s_, pts[:, 0])
    y = np.interp(ss, s_, pts[:, 1])
    k = 60  # soften the corners
    x = np.convolve(np.pad(x, k, mode="edge"), np.ones(2 * k + 1) / (2 * k + 1), "valid")
    y = np.convolve(np.pad(y, k, mode="edge"), np.ones(2 * k + 1) / (2 * k + 1), "valid")
    return np.stack([x, y], 1)


PATHS = {k: road_path(v) for k, v in ROADS.items()}


def frac_xy(name, frac, dm=0.0):
    path = PATHS[name]
    i = int(min(max(frac * (len(path) - 1) + dm / 3.0, 0), len(path) - 2))
    return path[i], path[i + 1] - path[i]


FLAT = [((AHU.x, AHU.y), 300)] + [((frac_xy(r, f)[0][0], frac_xy(r, f)[0][1]), 260) for r, f in (("w", 0.12), ("w", 0.16), ("w", 0.22), ("w", 0.30), ("s", 0.10))]


def keep_flat(x, y):
    w = np.ones_like(x)
    for (px, py), r in FLAT:
        w = np.minimum(w, np.clip((np.hypot(x - px, y - py) - r * 0.4) / r, 0, 1))
    return w


def coast_distance(x, y, coast=COAST):
    """Signed distance to the coast: positive inland."""
    d = np.full(x.shape, np.inf)
    inside = np.zeros(x.shape, bool)
    for (ax, ay), (bx, by) in zip(coast, np.roll(coast, -1, axis=0)):
        ex, ey = bx - ax, by - ay
        t = np.clip(((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey), 0, 1)
        d = np.minimum(d, np.hypot(x - ax - t * ex, y - ay - t * ey))
        inside ^= ((ay > y) != (by > y)) & (x < (bx - ax) * (y - ay) / (by - ay + 1e-9) + ax)
    return np.where(inside, d, -d)


def smoothstep(e0, e1, v):
    t = np.clip((v - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def height(x, y, coast=COAST, volcanoes=VOLCANOES):
    dc = coast_distance(x, y, coast)
    near_ahu = np.clip(1 - np.hypot(x - AHU.x, y - AHU.y) / 1100, 0, 1)
    land = smoothstep(0, 260, dc)  # coastal cliffs...
    shore = smoothstep(-40, 160, dc)  # ...except a low shore behind the platform
    base = (34 * land) * (1 - near_ahu) + (6 * shore) * near_ahu
    hills = 12 * np.sin(x / 700 + 0.4) * np.cos(y / 900) + 7 * np.sin((x + y) / 330)
    z = base + hills * keep_flat(x, y) * land * (1 - near_ahu)
    for vx, vy, vh, vr, cr, cd in volcanoes:
        r = np.hypot(x - vx, y - vy)
        z = z + vh * smoothstep(vr, 0, r) ** 1.3 - (cd * smoothstep(cr, cr * 0.6, r) if cr else 0)
    # Rano Raraku: a cone with a crater, its south-west flank quarried into a cliff
    r = np.hypot(x - Q.x, y - Q.y)
    ang = np.arctan2(y - Q.y, x - Q.x)
    sector = np.clip(1 - np.abs(ang + 2.2) / 0.5, 0, 1)
    gentle = smoothstep(780, 300, r)
    cliff = smoothstep(560, 430, r)
    z = z + 155 * (gentle * (1 - sector) + cliff * sector) - 85 * smoothstep(300, 180, r)
    return np.where(dc > -400, z, -40.0) * smoothstep(-400, 0, dc) - 40 * (1 - smoothstep(-400, 0, dc))


STEP = 20.0
xs = np.linspace(X0, X1, int((X1 - X0) / STEP) + 1)
ys = np.linspace(Y0, Y1, int((Y1 - Y0) / STEP) + 1)
NXG = len(xs)
GX, GY = np.meshgrid(xs, ys)
GZ = height(GX, GY)
slope = np.hypot(*np.gradient(GZ, STEP, STEP))
rq = np.hypot(GX - Q.x, GY - Q.y)
quarry_face = band(np.arctan2(GY - Q.y, GX - Q.x), -2.6, -1.8, 0.15) * band(rq, 400, 580, 40)  # the quarried cliff
rock = np.clip(np.clip((slope - 0.55) * 2.5, 0, 1) + quarry_face, 0, 1)
ii, jj = np.meshgrid(np.arange(NXG - 1), np.arange(len(ys) - 1))
a = (jj * NXG + ii).ravel()
QD = np.stack([a, a + 1, a + 1 + NXG, a + NXG], 1)
me = bpy.data.meshes.new("ground")
me.vertices.add(GX.size)
me.vertices.foreach_set("co", np.stack([GX.ravel(), GY.ravel(), GZ.ravel()], 1).astype(np.float32).ravel())
me.loops.add(QD.size)
me.loops.foreach_set("vertex_index", QD.astype(np.int32).ravel())
me.polygons.add(len(QD))
me.polygons.foreach_set("loop_start", (np.arange(len(QD)) * 4).astype(np.int32))
me.update()
me.validate()
me.attributes.new("rock", "FLOAT", "POINT").data.foreach_set("value", rock.ravel().astype(np.float32))
me.materials.append(M["ground"])
me.shade_smooth()
ground = link(bpy.data.objects.new("ground", me))
sea = boxes_mesh("sea", [(X0 - 40000, Y0 - 40000, -60, X1 + 40000, Y1 + 40000, 0.0)], M["sea"])
bpy.context.view_layer.update()
BVH = BVHTree.FromObject(ground, bpy.context.evaluated_depsgraph_get())


def gz(x, y):
    """Height of the ground mesh itself (not the formula): exact under its triangles."""
    hit = BVH.ray_cast(V3(x, y, 2000), V3(0, 0, -1))
    return hit[0].z if hit[0] else float(height(np.array(x), np.array(y)))


# ---------------------------------------------------------------- roads: ribbons laid on the ground mesh
for name, path in PATHS.items():
    d = np.gradient(path, axis=0)
    nrm = np.stack([-d[:, 1], d[:, 0]], 1) / np.hypot(d[:, 0], d[:, 1])[:, None]
    verts = []
    for (x, y), (nx, ny) in zip(path, nrm):
        for k_ in (-2.25, -1.125, 0.0, 1.125, 2.25):  # LH25 1.3: about 4.5 m wide, concave in section
            px, py = x + nx * k_, y + ny * k_
            verts.append((px, py, gz(px, py) + 0.06 + 0.14 * (k_ / 2.25) ** 2))
    faces = [(i * 5 + j, i * 5 + j + 1, (i + 1) * 5 + j + 1, (i + 1) * 5 + j) for i in range(len(path) - 1) for j in range(4)]
    o = mesh_obj("road_" + name, verts, faces, M["road"])
    visible(o, (0, MAP_WIN[0]), (MAP_WIN[1], END + 1))  # it showed through the map island as a thin line
    uv = o.data.uv_layers.new(name="UVMap")
    for poly in o.data.polygons:
        for li in poly.loop_indices:
            vi = o.data.loops[li].vertex_index
            uv.data[li].uv = ((vi % 5) / 4, vi // 5 * 0.01)
    o.data.shade_smooth()


def along(name, frac, side=0.0, dm=0.0):
    """A point on the ground a fraction along a road, plus `dm` metres further, offset `side`
    metres to its left; and the direction of travel there (away from the quarry)."""
    (px, py), d = frac_xy(name, frac, dm)
    yaw = math.atan2(d[1], d[0])
    x, y = px - math.sin(yaw) * side, py + math.cos(yaw) * side
    return V3(x, y, gz(x, y)), yaw


# ---------------------------------------------------------------- statues lying along the roads: "dozens"
def lying(name, H, at, yaw, face_up, cols=48):
    """A statue that was facing outward (away from the quarry, LH25 2.5) and fell: forward onto its
    face, head outward, or back onto its back, head toward the quarry. Settled a little into the
    ground; the tilt also takes out the forward lean, so the statue lies flat. (A7 pass 1: the
    first version had both the wrong way round.)"""
    o = moai(name, H, M["tuff"], cols=cols)
    S = 0.1925 * H
    tilt = -(90 + LEAN) if face_up else 90 - LEAN
    o.matrix_world = Matrix.Translation(at + V3(0, 0, 0.45 * S - 0.25)) @ Matrix.Rotation(yaw + math.pi / 2, 4, "Z") @ Matrix.Rotation(math.radians(tilt), 4, "X")
    return o


FALLEN = []
for name, n in (("w", 18), ("s", 20), ("n", 10)):
    for i in range(n):
        f = (i + 0.5 + rng.uniform(-0.3, 0.3)) / n * 0.9 + 0.05
        at, yaw = along(name, f, float(rng.uniform(-2, 2)))
        if name == "w" and (0.09 < f < 0.19 or 0.20 < f < 0.24 or 0.28 < f < 0.33):  # the close-shot sites
            continue
        if name == "s" and 0.08 < f < 0.12:
            continue
        FALLEN.append(lying(f"fallen_{name}{i}", float(rng.uniform(4.0, 8.5)), at, yaw + float(rng.uniform(-0.5, 0.5)), bool(rng.uniform() < 0.4)))
# A run of them close together on the west road, for the last shot.
RUN = []
for i, (dm, side) in enumerate(((0, 3.5), (6, -4.0), (13, 2.5), (20, -3.0), (28, 4.0))):
    at, yaw = along("w", 0.30, side, dm)
    H_ = float(rng.uniform(5.0, 7.0))
    o = lying(f"fallen_run{i}", H_, at, yaw + float(rng.uniform(-0.4, 0.4)), i % 2 == 0, cols=80)
    FALLEN.append(o)
    RUN.append((at, yaw, H_))
# The one the camera finds for "none of the road statues have them": face up, beside the south road.
FU_AT, FU_YAW = along("s", 0.10, 4.5)
FU_H = 6.4
fu = lying("fallen_faceup", FU_H, FU_AT, FU_YAW, True, cols=112)
FALLEN.append(fu)
fu_face = pin("fu_face", fu, V3(0, -(0.62 * 0.1925 * FU_H + 0.80 * FU_H * math.tan(math.radians(LEAN))), 0.80 * FU_H))

# ---------------------------------------------------------------- the platform (ahu) and its statues
AHU_L, AHU_D, AHU_H = 34.0, 4.6, 1.7
AHU.z = gz(AHU.x, AHU.y)
blocks = []
x = AHU.x - AHU_L / 2
while x < AHU.x + AHU_L / 2 - 0.3:  # the inland face: fitted slabs of uneven width (generic; no particular ahu)
    w_ = min(float(rng.uniform(0.9, 2.2)), AHU.x + AHU_L / 2 - x)
    z = AHU.z - 0.3
    while z < AHU.z + AHU_H - 0.05:
        h_ = min(float(rng.uniform(0.5, 0.95)), AHU.z + AHU_H - z)
        blocks.append((x + 0.02, AHU.y + AHU_D / 2 - 0.05, z + 0.02, x + w_ - 0.02, AHU.y + AHU_D / 2 + 0.06, z + h_ - 0.02))
        z += h_
    x += w_
blocks.append((AHU.x - AHU_L / 2, AHU.y - AHU_D / 2, AHU.z - 0.3, AHU.x + AHU_L / 2, AHU.y + AHU_D / 2, AHU.z + AHU_H))
boxes_mesh("ahu", blocks, M["ahu"])
TOP = AHU.z + AHU_H
AH = 5.6  # platform statue height (generic)
PLAT = []
for i, dx in enumerate((-12.0, -6.0, 0.0, 6.0, 12.0)):
    hero_ = dx == 0
    o = moai(f"ahu_{i}", AH * float(rng.uniform(0.92, 1.06)) if abs(dx) == 6 else AH, M["tuff"], cols=160 if hero_ else 112 if abs(dx) != 6 else 80, kind="road" if hero_ else "platform", keys=hero_)
    o.location = V3(AHU.x + dx, AHU.y, TOP)
    o.rotation_euler = (0, 0, math.pi)  # facing inland (+y)
    PLAT.append(o)
hero = PLAT[2]  # A: platform shape throughout; its eye sockets are carved on "carved" (line 7)
CARVE = (T("carved") + 4, T("there") + 6)  # "carved only once they stood there."
shape_key(hero, "platform", [(0, 1.0)])
shape_key(hero, "sockets", [(0, 0.0), (CARVE[0], 0.0), (CARVE[1], 1.0)])
pin("a_top", hero, V3(0, 0, AH))
EYE_Y = -0.62 * 0.1925 * AH  # just in front of the face plane, under the brow
pin("a_eye", hero, V3(0.37 * 0.8 * 0.1925 * AH, EYE_Y, 0.806 * AH))
pin("a_eye_r", hero, V3(-0.37 * 0.8 * 0.1925 * AH, EYE_Y, 0.806 * AH))
M["fresh"] = make_mat("fresh", plain((0.72, 0.64, 0.50), 0.9), haze=False)  # freshly cut tuff: paler than the weathered face
for i in range(36):  # tuff chips out of the sockets as they are cut (the statue faces +y)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=float(rng.uniform(0.012, 0.035)))
    c_ = bpy.context.object
    c_.data.materials.append(M["fresh"])
    c_.name = f"eyechip{i}"
    t0 = CARVE[0] + int(rng.uniform(0, CARVE[1] - CARVE[0] - 6))
    side = 1 if i % 2 else -1
    start = hero.location + V3(side * 0.37 * 0.8 * 0.1925 * AH + float(rng.uniform(-0.12, 0.12)), 0.5 * 0.1925 * AH, 0.806 * AH + float(rng.uniform(-0.06, 0.06)))
    vel = V3(float(rng.uniform(-0.5, 0.5)), float(rng.uniform(0.5, 1.4)), float(rng.uniform(0.0, 0.9)))
    for k_ in range(0, 46, 2):
        tt = k_ / FPS
        pos = start + vel * tt + V3(0, 0, -4.9 * tt * tt)
        pos.z = max(pos.z, TOP + 0.02 if pos.y < AHU.y + AHU_D / 2 else gz(pos.x, pos.y) + 0.02)
        c_.location = pos
        c_.keyframe_insert("location", frame=t0 + k_)
    visible(c_, (t0, T("none") + SHIFT))
END_E = PLAT[4]  # E: the east end of the row, clear to the side, for "stand straight" and the widths
for nm, t_, u_ in (("e_sh_l", SHOULDER_T, 1), ("e_sh_r", SHOULDER_T, -1), ("e_base_l", 0.02, 1), ("e_base_r", 0.02, -1)):
    pin(nm, END_E, edge_pt(AH, t_, u_, PLAT_BASE, 0))
pin("e_top", END_E, V3(0, 0, AH))
pin("e_bot", END_E, V3(0, 0, 0))
# The hook: the road-shaped statue A was, as a gold ghost over it (LH25: reshaped after arrival).
GHOST_A = (T("reshaped") - 6, T("the") + 4)
ghost_a = moai("ghost_a", AH, ghost_mat("ghost_a", [GHOST_A]), cols=96)
ghost_a.location = hero.location + V3(0, 0, 0.002)
ghost_a.rotation_euler = hero.rotation_euler
ghost_a.scale = (1.004, 1.004, 1.0)
visible(ghost_a, GHOST_A)

# B: arrives road-shaped; then the front of its base is carved away and the lean goes. Seen only in
# its own shot, in place of the west end statue.
B_AT = PLAT[0].location.copy()
B_WIN = (T("so,") + SHIFT, T("not") + SHIFT)
visible(PLAT[0], (0, B_WIN[0]), (B_WIN[1], END + 1))
hero_b = moai("ahu_b", AH, M["tuff"], cols=112, keys=True)
hero_b.location = B_AT
hero_b.rotation_euler = (0, 0, math.pi)
visible(hero_b, B_WIN)
# First the base is cut back inside the gold road shape; the gold goes; then the statue is set
# upright. Straightening moves the head back past the old outline, so the outline must be gone by
# then: carving cannot add stone (A7 pass 1).
TRIM = (T("carved", 1), T("end"))
UPRIGHT = (T("end") + 4, T("journey.") + 2)
shape_key(hero_b, "trim", [(0, 0.0), (TRIM[0], 0.0), (TRIM[1], 1.0), (UPRIGHT[0], 1.0), (UPRIGHT[1], 0.0)])
shape_key(hero_b, "platform", [(0, 0.0), (UPRIGHT[0], 0.0), (UPRIGHT[1], 1.0)])
ghost_b = moai("ghost_b", AH, ghost_mat("ghost_b", [(TRIM[0] - 2, UPRIGHT[0])]), cols=96)
ghost_b.location = B_AT + V3(0, 0, 0.002)
ghost_b.rotation_euler = hero_b.rotation_euler
ghost_b.scale = (1.003, 1.003, 1.0)
visible(ghost_b, (TRIM[0] - 2 + SHIFT, UPRIGHT[0] + SHIFT))
pin("b_trim", hero_b, V3(0, -0.55 * 0.1925 * AH, 0.08 * AH))
pin("b_top", hero_b, V3(0, -AH * math.tan(math.radians(LEAN)), AH))
pin("b_bot", hero_b, V3(0, 0, 0))
for i in range(40):  # chips of tuff falling from the front of the base (+y on the platform)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=float(rng.uniform(0.03, 0.09)))
    c_ = bpy.context.object
    c_.data.materials.append(M["tuff"])
    c_.name = f"chip{i}"
    t0 = TRIM[0] + int(rng.uniform(0, TRIM[1] - TRIM[0] - 4))
    start = B_AT + V3(float(rng.uniform(-0.9, 0.9)), 0.6 + float(rng.uniform(0, 0.3)), float(rng.uniform(0.05, 0.9)))
    vel = V3(float(rng.uniform(-0.6, 0.6)), float(rng.uniform(0.6, 1.6)), float(rng.uniform(0.2, 1.2)))
    for k_ in range(0, 40, 2):
        tt = k_ / FPS
        pos = start + vel * tt + V3(0, 0, -4.9 * tt * tt)
        floor = TOP if pos.y < AHU.y + AHU_D / 2 else gz(pos.x, pos.y)
        pos.z = max(pos.z, floor + 0.03)
        c_.location = pos
        c_.keyframe_insert("location", frame=t0 + k_)
    visible(c_, (t0, B_WIN[1]))


# ---------------------------------------------------------------- walking: rocked side to side, a step each rock
def walk_matrix(frame, f0, start, heading, hb, period=60, roll=6.0, yaw=9.0):
    """LH25 Fig. 1: it tips onto one edge of its base, swings the other edge forward around it, comes
    down; then the other side. `heading` turns its front (-y) to face the way it walks."""
    psi = heading - math.radians(yaw) / 2
    if frame <= f0:
        return Matrix.Translation(start) @ Matrix.Rotation(psi, 4, "Z")
    half = period / 2
    k_ = int((frame - f0) // half)
    u = ((frame - f0) % half) / half
    pos = Vector(start)
    for i in range(k_ + 1):
        s = 1 if i % 2 == 0 else -1
        piv = pos + Matrix.Rotation(psi, 4, "Z") @ V3(s * hb, 0, 0)
        uu = 1.0 if i < k_ else u
        ph = s * math.radians(yaw) * smooth(uu)
        ro = s * math.radians(roll) * math.sin(math.pi * uu)
        m = Matrix.Translation(piv) @ Matrix.Rotation(psi + ph, 4, "Z") @ Matrix.Rotation(ro, 4, "Y") @ Matrix.Translation(V3(-s * hb, 0, 0))
        if i < k_:
            pos = m @ V3(0, 0, 0)
            pos.z = start.z
            psi = psi + ph
    return m


def key_matrix(o, frames, fn):
    for f in frames:
        o.matrix_world = fn(f)
        o.keyframe_insert("location", frame=f)
        o.keyframe_insert("rotation_euler", frame=f)


def rope(name, fn, f0, f1, r=0.03):
    """A straight rope between two moving points fn(frame) -> (a, b), re-keyed each frame."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=r, depth=1.0)
    o = bpy.context.object
    o.name = name
    o.data.transform(Matrix.Translation(V3(0, 0, 0.5)))
    o.data.materials.append(M["rope"])
    for f in range(f0, f1 + 1):
        a_, b_ = fn(f)
        d = b_ - a_
        o.location = a_
        o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        o.scale = (1, 1, d.length)
        for path in ("location", "rotation_euler", "scale"):
            o.keyframe_insert(path, frame=f)
    visible(o, (f0, f1))
    return o


def head_pt(H, side):
    """Where a rope is tied round the head: at the side (side = +-1) or the back (0)."""
    S = 0.1925 * H
    return V3(side * 0.62 * S, (0.4 if side == 0 else 0.0) * S - 0.76 * H * math.tan(math.radians(LEAN)), 0.76 * H)


WH = 6.0
walker = moai("walker", WH, M["tuff"], cols=112)
WS = 0.1925 * WH
W0, W_YAW = along("w", 0.16)
W_HEAD = W_YAW + math.pi / 2  # its front faces down the road, away from the quarry
WALK_F0 = T("rock") + 6
key_matrix(walker, range(0, END + 1), lambda f: walk_matrix(f, WALK_F0, W0, W_HEAD, ROAD_BASE * WS))
for nm, t_, u_ in (("w_sh_l", SHOULDER_T, 1), ("w_sh_r", SHOULDER_T, -1), ("w_base_l", 0.02, 1), ("w_base_r", 0.02, -1)):
    pin(nm, walker, edge_pt(WH, t_, u_))
pin("w_top", walker, V3(0, -WH * math.tan(math.radians(LEAN)), WH))
pin("w_bot", walker, V3(0, 0, 0))
pin("w_up", walker, V3(0, 0, WH))  # straight above the base: the vertical the lean is measured from
ROPE_WIN = (T("rock") - 2 + SHIFT, T("in", 1) + SHIFT)
WF = Matrix.Rotation(W_HEAD, 4, "Z")

# The hook, "Easter Island's statues may have walked to their platforms": another road statue, already rocking forward on its
# ropes when the short opens. Seen only in the first shot.
HOOK_WIN = (0, T("and") + SHIFT)
H0, H_YAW = along("w", 0.12)
H_HEAD = H_YAW + math.pi / 2
HF = Matrix.Rotation(H_HEAD, 4, "Z")
walker_h = moai("walker_hook", WH, M["tuff"], cols=112)
HOOK_F0 = -34  # mid-rock on frame 0


def hook_at(f):
    return walk_matrix(f, HOOK_F0, H0, H_HEAD, ROAD_BASE * WS, period=44, roll=7.0, yaw=10.0)


key_matrix(walker_h, range(0, T("and") + 12), hook_at)
visible(walker_h, HOOK_WIN)

# ---------------------------------------------------------------- the test: a concrete replica and its crew of 18
TEST = V3(40000.0, 0.0, 0.0)  # a field of its own; the place is not shown
TEST_WIN = (T("in", 1) + SHIFT, T("the", 6) + SHIFT)  # "In a test ... forty minutes."
lawn = boxes_mesh("lawn", [(TEST.x - 3000, TEST.y - 3000, -2, TEST.x + 3000, TEST.y + 3000, 0.0)], M["lawn"])
visible(lawn, TEST_WIN)
visible(sea, (0, TEST_WIN[0]), (TEST_WIN[1], END + 1))
visible(ground, (0, MAP_WIN[0]), (MAP_WIN[1], TEST_WIN[0]), (TEST_WIN[1], END + 1))  # the map has its own island
# LH25 1.4: 4.35 t. Its size is not given: scaled from this statue shape at an assumed 2.3 t/m3.
_tmp = moai("tmp", 1.0, None, cols=48)
_bm = bmesh.new()
_bm.from_mesh(_tmp.data)
RH = (4.35 / 2.3 / _bm.calc_volume()) ** (1 / 3)
print(f"replica height {RH:.2f} m")
_bm.free()
bpy.data.objects.remove(_tmp)
replica = moai("replica", RH, M["concrete"], cols=96)
RS = 0.1925 * RH
R_HEAD = math.pi / 2  # its front faces +x, down the marked track
TEST_F0 = T("in", 1) + 4


def replica_at(f):
    return walk_matrix(f, TEST_F0, TEST, R_HEAD, ROAD_BASE * RS, period=50, roll=7.0, yaw=10.0)


FR = range(TEST_WIN[0] - 2, TEST_WIN[1] + 2)
key_matrix(replica, FR, replica_at)
visible(replica, TEST_WIN)
pin("replica_pin", replica, V3(0, -RH * math.tan(math.radians(LEAN)), RH * 1.06))
# 100 m marked out: a stake every 10 m and a white tape between them, so the distance reads from afar
stakes = boxes_mesh("stakes", [(TEST.x + 10 * i - 0.08, -3.28, 0, TEST.x + 10 * i + 0.08, -3.12, 1.4 if i % 5 == 0 else 0.9) for i in range(11)] + [(TEST.x, -3.24, 0.0, TEST.x + 100, -3.16, 0.05)], M["stake"])
visible(stakes, TEST_WIN)
pin("t_start", None, TEST + V3(0, -3.2, 0.05))
pin("t_end", None, TEST + V3(100, -3.2, 0.05))

# People: plain mannequins in work clothes, no faces; generic, not anyone.
SKIN = [(0.36, 0.22, 0.14), (0.52, 0.34, 0.22), (0.24, 0.15, 0.10), (0.62, 0.45, 0.32)]
SHIRT = [(0.12, 0.20, 0.32), (0.55, 0.12, 0.10), (0.75, 0.72, 0.65), (0.20, 0.32, 0.18), (0.80, 0.55, 0.18), (0.30, 0.30, 0.34)]
PANTS = [(0.10, 0.10, 0.12), (0.22, 0.20, 0.17), (0.12, 0.16, 0.24)]
MATS = {}


def pmat(col):
    if col not in MATS:
        MATS[col] = make_mat(f"cloth{len(MATS)}", plain(col, 0.85), haze=False)
    return MATS[col]


def limb(vf, a_, b_, r):
    """A tapered tube from a_ to b_, appended to vf = (verts, faces)."""
    verts, faces = vf
    q = (b_ - a_).to_track_quat("Z", "Y")
    n0 = len(verts)
    for p_, rr in ((a_, r), (b_, r * 0.85)):
        for j in range(8):
            ang = TAU * j / 8
            verts.append(p_ + q @ V3(math.cos(ang) * rr, math.sin(ang) * rr, 0))
    faces += [(n0 + j, n0 + (j + 1) % 8, n0 + 8 + (j + 1) % 8, n0 + 8 + j) for j in range(8)]
    faces += [tuple(n0 + j for j in range(8))[::-1], tuple(n0 + 8 + j for j in range(8))]


TAPA = [(0.78, 0.68, 0.50), (0.70, 0.58, 0.40), (0.82, 0.74, 0.58)]  # bark cloth, undyed


def person(name, seed, lean_back, islander=False):
    """A figure facing +y, hands out to a rope ahead, leaning back; feet at the origin. Returns the
    object and where its hands are, in its own frame. `islander`: bare-chested, a plain bark-cloth
    wrap at the waist; generic, no faces, no tattoos or ornaments (C6: nothing is claimed about
    dress)."""
    r = random.Random(seed)
    h = r.uniform(1.62, 1.86)
    parts = {"skin": ([], []), "shirt": ([], []), "pants": ([], [])}
    rot = Matrix.Rotation(lean_back, 3, "X")  # tips the top toward -y: leaning back from the rope

    def P(x, y, z):
        return rot @ V3(x, y, z)

    hip, sh = 0.53 * h, 0.82 * h
    hands = P(0, 0.42, sh - 0.22)
    for sx in (-1, 1):
        limb(parts["skin" if islander else "pants"], V3(sx * 0.10, 0.12, 0.04), P(sx * 0.10, 0, hip), 0.07)  # feet braced ahead
        limb(parts["skin"], P(sx * 0.19, 0, sh - 0.02), P(sx * 0.05, 0.42, sh - 0.22), 0.045)
    limb(parts["pants"], P(0, 0, hip - 0.03), P(0, 0, hip + 0.10), 0.16)
    limb(parts["shirt"], P(0, 0, hip + 0.05), P(0, 0, sh + 0.02), 0.17)
    limb(parts["shirt"], P(-0.2, 0, sh - 0.02), P(0.2, 0, sh - 0.02), 0.07)
    limb(parts["skin"], P(0, 0, sh + 0.02), P(0, 0, sh + 0.08), 0.05)
    hv, hf = parts["skin"]
    head_c = P(0, 0.01, 0.93 * h)
    n0 = len(hv)
    for i in range(7):
        for j in range(10):
            th, ph = math.pi * (i + 0.5) / 7, TAU * j / 10
            hv.append(head_c + V3(math.sin(th) * math.cos(ph) * 0.1, math.sin(th) * math.sin(ph) * 0.11, math.cos(th) * 0.12))
    hf += [(n0 + i * 10 + j, n0 + i * 10 + (j + 1) % 10, n0 + (i + 1) * 10 + (j + 1) % 10, n0 + (i + 1) * 10 + j) for i in range(6) for j in range(10)]
    cols_ = {"skin": SKIN[r.randrange(len(SKIN))], "shirt": SHIRT[r.randrange(len(SHIRT))], "pants": PANTS[r.randrange(len(PANTS))]}
    if islander:
        cols_["shirt"] = cols_["skin"]
        cols_["pants"] = TAPA[r.randrange(len(TAPA))]
    verts, faces, mi = [], [], []
    me_ = bpy.data.meshes.new(name)
    for k_, (kname, (v, f)) in enumerate(parts.items()):
        n0 = len(verts)
        verts += v
        faces += [tuple(i + n0 for i in ff) for ff in f]
        mi += [k_] * len(f)
        me_.materials.append(pmat(cols_[kname]))
    me_.from_pydata([tuple(v) for v in verts], [], faces)
    me_.polygons.foreach_set("material_index", mi)
    me_.update()
    me_.shade_smooth()
    return link(bpy.data.objects.new(name, me_)), hands


def crew(prefix, origin, heading, statue_fn, H, f0, half, frames, win, teams, islander=False, scale=1.0, pins=()):
    """People on the ropes of a walking statue: teams ahead and to each side, and behind it, each
    holding a rope that runs from the statue's head through their hands. The side teams pull in
    turn, in time with the rocking; everyone drifts forward with the statue. `teams`: {name:
    (side, count)}, side = +1 / -1 / 0 (rear)."""
    Rz = Matrix.Rotation(heading, 4, "Z")
    fwd, lat = (Rz @ V3(0, -1, 0)).normalized(), (Rz @ V3(1, 0, 0)).normalized()
    hands_of = {}

    def place(team, i, f):
        side, _ = teams[team]
        out = (fwd * 0.45 + lat * side).normalized() if side else -fwd
        at0 = origin + ((fwd * 4.0 + lat * side * 8.0) if side else -fwd * 8.0) * scale + out * (1.1 * i)
        if not side:
            at0 += lat * (0.35 if i % 2 else -0.35)
        m = statue_fn(f)
        drift = fwd * (m @ V3(0, 0, 0) - origin).dot(fwd)
        pull = 0.0
        if side and f > f0:
            k_ = int((f - f0) // half)
            u = ((f - f0) % half) / half
            pull = 0.35 * math.sin(math.pi * u) * (1 if (1 if k_ % 2 == 0 else -1) == side else 0)
        face = -out
        return Matrix.Translation(at0 + drift + out * pull) @ Matrix.Rotation(math.atan2(face.y, face.x) - math.pi / 2, 4, "Z")

    for team, (side, n) in teams.items():
        for i in range(n):
            o, hands = person(f"{prefix}_{team}{i}", zlib.crc32(f"{prefix}{team}{i}".encode()) % 9973, 0.3 if side else 0.2, islander)
            key_matrix(o, frames, lambda f, team=team, i=i: place(team, i, f))
            visible(o, win)
            hands_of[(team, i)] = hands
        rope(f"{prefix}_rope_{team}_a", lambda f, team=team, side=side: (statue_fn(f) @ head_pt(H, side), place(team, 0, f) @ hands_of[(team, 0)]), *win)
        rope(f"{prefix}_rope_{team}_b", lambda f, team=team, n=n: (place(team, 0, f) @ hands_of[(team, 0)], place(team, n - 1, f) @ (hands_of[(team, n - 1)] + V3(0, -0.6, 0))), *win)
    for name, team, i in pins:
        e = pin(name, None, V3(0, 0, 0))
        key_matrix(e, frames, lambda f, team=team, i=i: Matrix.Translation(place(team, i, f) @ V3(0, 0, 2.0)))


# LH25 1.4: "four on each lateral rope and ten on the rear rope"
crew("crew", TEST, R_HEAD, replica_at, RH, TEST_F0, 25, FR, TEST_WIN, {"left": (1, 4), "right": (-1, 4), "rear": (0, 10)}, pins=(("crew_rear", "rear", 5), ("crew_left", "left", 2), ("crew_right", "right", 2)))
# The ancient walk, as Lipo & Hunt describe it: islanders on side ropes and a rear rope. How many
# pulled is not known; these crews are illustrative and the small print says so.
ISLE_TEAMS = {"left": (1, 7), "right": (-1, 7), "rear": (0, 8)}
crew("isle_w", W0, W_HEAD, lambda f: walk_matrix(f, WALK_F0, W0, W_HEAD, ROAD_BASE * WS), WH, WALK_F0, 30, range(ROPE_WIN[0] - 2, ROPE_WIN[1] + 2), ROPE_WIN, ISLE_TEAMS, islander=True, scale=0.8)
crew("isle_h", H0, H_HEAD, hook_at, WH, HOOK_F0, 22, range(0, HOOK_WIN[1] + 2), HOOK_WIN, ISLE_TEAMS, islander=True, scale=0.6)

# ---------------------------------------------------------------- "set up there on purpose": gold ghosts, standing
GHOST_WIN = (T("set") - 4 + SHIFT, END + 1)
# The closing question: "abandoned on the way" (ghosts go, the fallen statues alone), "or meant to be
# there all along" (ghosts back), "What do you think?" (both stay).
D1, S1 = T("abandoned"), T("meant")
gm = ghost_mat("ghost_up", [], keys=[(0, 0.0), (T("set") - 4, 0.0), (T("set") + 6, 1.0), (D1 - 2, 1.0), (D1 + 8, 0.0), (S1 - 2, 0.0), (S1 + 8, 1.0), (T("what") - 2, 1.0), (T("what") + 10, 0.4), (END + 40, 0.4)])  # both readings on screen for the question
for i, (at, yaw, H_) in enumerate(RUN):
    g_ = moai(f"upright_{i}", H_, gm, cols=64)
    g_.location = at
    g_.rotation_euler = (0, 0, yaw + math.pi / 2 + float(rng.uniform(-0.4, 0.4)))
    visible(g_, GHOST_WIN)
    if i == 2:
        pin("upright", g_, V3(0, 0, H_ + 0.4))
_at, _yaw = along("w", 0.22, 2.0)
DROP_O = lying("fallen_drop", 6.8, _at, _yaw + 0.25, False, cols=96)  # face down: fell forward
FALLEN.append(DROP_O)
DROP = DROP_O.location.copy()
pin("fallen_w", DROP_O, V3(0, 0, 0))
_qx, _qy = Q.x - 300, Q.y - 400  # on the quarried cliff
pin("quarry", None, V3(_qx, _qy, gz(_qx, _qy) + 30))

# Rano Raraku's crater holds a lake (USGS / PLoS ONE 2021, cited in the A6 file).
LAKE_Z = gz(Q.x, Q.y) + 2.5
bpy.ops.mesh.primitive_circle_add(vertices=64, radius=215, fill_type="NGON", location=(Q.x, Q.y, LAKE_Z))
bpy.context.object.name = "crater_lake"
bpy.context.object.data.materials.append(M["sea"])
visible(bpy.context.object, (0, MAP_WIN[0]), (MAP_WIN[1], END + 1))


# ---------------------------------------------------------------- the map: its own island, traced closer to the real one
# The ground-level world is drawn on a simplified outline; the map beat, seen from 40 km, shows this
# one instead, traced from public-domain NASA imagery by tools/blender/trace_rapa_nui.py (GIBS: the
# SRTM land mask and the Landsat WELD 2000 composite) into rapa_nui_trace.json: the coastline (108
# points, 120 m tolerance), Terevaka and Poike at the SRTM highs, Rano Kau's crater lake from the
# Landsat image, and the islets. Visible only during the map; the main island is hidden then.
TRACE = json.load(open(HERE / "rapa_nui_trace.json"))
MAP_COAST = np.array(TRACE["coast"], float)
_tk, _po, _kl = TRACE["peaks"]["terevaka"], TRACE["peaks"]["poike"], TRACE["lakes"]["rano_kau"]
MAP_VOLC = [(_tk[0], _tk[1], 470, 4200, 0, 0), (_kl[0], _kl[1], 300, 1700, 800, 210), (_po[0], _po[1], 330, 1900, 0, 0)]  # Terevaka, Rano Kau (crater lake), Poike
MAP_ROADS = {  # the south-coast road kept near the coast; the north road to the coast (A7 pass 4)
    "w": ROADS["w"],
    "s": [(6000, -350), (4500, -898), (3000, -1181), (1500, -2024), (0, -3880), (-1500, -4205), (-3000, -4008), (-4500, -4431), (-6200, -4300)],  # ~650 m inside the traced south coast
    "n": ROADS["n"][:-1] + [(3500, 5200)],
}
MAP_PATHS = {k: road_path(v) for k, v in MAP_ROADS.items()}
for _k, _p in MAP_PATHS.items():  # every map road stays on land
    assert coast_distance(_p[:, 0], _p[:, 1], MAP_COAST).min() > 150, f"map road {_k} runs into the sea"


def hm(x, y):
    return float(height(np.array([x]), np.array([y]), MAP_COAST, MAP_VOLC)[0])


MSTEP = 30.0
mx_ = np.arange(-11500, 13500, MSTEP)
my_ = np.arange(-9800, 8800, MSTEP)
MX, MY = np.meshgrid(mx_, my_)
MZ = height(MX, MY, MAP_COAST, MAP_VOLC)
_n = len(mx_)
_ii, _jj = np.meshgrid(np.arange(_n - 1), np.arange(len(my_) - 1))
_a = (_jj * _n + _ii).ravel()
_q = np.stack([_a, _a + 1, _a + 1 + _n, _a + _n], 1)
mme = bpy.data.meshes.new("map_ground")
mme.vertices.add(MX.size)
mme.vertices.foreach_set("co", np.stack([MX.ravel(), MY.ravel(), MZ.ravel()], 1).astype(np.float32).ravel())
mme.loops.add(_q.size)
mme.loops.foreach_set("vertex_index", _q.astype(np.int32).ravel())
mme.polygons.add(len(_q))
mme.polygons.foreach_set("loop_start", (np.arange(len(_q)) * 4).astype(np.int32))
mme.update()
mme.validate()
mme.materials.append(M["ground"])
mme.shade_smooth()
visible(link(bpy.data.objects.new("map_ground", mme)), MAP_WIN)
_rk = MAP_VOLC[1]
# Rano Kau's lake: the dark water the trace found measures ~350 m in radius; the reed-covered lake is
# wider, so it is drawn at 480 m, inside the 800 m crater.
_lakes = {"map_lake_raraku": (Q.x, Q.y, 215, hm(Q.x, Q.y) + 2.5), "map_lake_kau": (_rk[0], _rk[1], 480, hm(_rk[0], _rk[1]) + 4)}
_lakes.update({f"islet{i}": (x, y, r, 8) for i, (x, y, r) in enumerate(TRACE["islets"])})
for nm, (cx_, cy_, r_, z_) in _lakes.items():
    bpy.ops.mesh.primitive_circle_add(vertices=48, radius=r_, fill_type="NGON", location=(cx_, cy_, z_))
    bpy.context.object.name = nm
    bpy.context.object.data.materials.append(M["sea"] if nm.startswith("map_lake") else M["ground"])
    visible(bpy.context.object, MAP_WIN)


def map_along(name, frac, side=0.0):
    path = MAP_PATHS[name]
    i = int(min(max(frac * (len(path) - 1), 0), len(path) - 2))
    dx_, dy_ = path[i + 1] - path[i]
    yaw = math.atan2(dy_, dx_)
    x, y = path[i][0] - math.sin(yaw) * side, path[i][1] + math.cos(yaw) * side
    return V3(x, y, hm(x, y))


def glow(name, col, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes["Principled BSDF"])
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*col, 1)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs[0], nt.nodes["Material Output"].inputs["Surface"])
    return m


M["map_road"] = glow("map_road", (1.0, 0.55, 0.12), 3.0)
M["map_icon"] = glow("map_icon", (1.0, 1.0, 1.0), 2.5)
for name, pts in MAP_PATHS.items():  # the old roads, drawn wide enough to read from 40 km
    pts = pts[::40]
    d = np.gradient(pts, axis=0)
    nrm = np.stack([-d[:, 1], d[:, 0]], 1) / np.hypot(d[:, 0], d[:, 1])[:, None]
    verts = [(x + nx * k_, y + ny * k_, hm(x, y) + 30) for (x, y), (nx, ny) in zip(pts, nrm) for k_ in (-45, 45)]
    faces = [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(len(pts) - 1)]
    mr = mesh_obj("map_road_" + name, verts, faces, M["map_road"])
    mr.visible_shadow = False  # map graphics, not objects in the sun
    visible(mr, (T("roads", 1) + SHIFT, MAP_WIN[1]))
pin("map_road_pin", None, map_along("w", 0.45) + V3(0, 0, 30))  # on the drawn road, which floats 30 m up
# The road statues as icons, placed by distance from the quarry as LH25 Fig. 12 has them: "65.5 %
# within 2 km and 42.9 % within just 1 km", 2.5: "79.8 % ... within 3.5 km", and only 8.7 % beyond
# 4.5 km (A7 passes 3 and 4: evenly spaced icons drew the critics' pattern, not the data). 62 icons,
# LH25's count. Their own random stream, so the rest of the world (grass, stones) is unchanged.
_irng = np.random.default_rng(62)
_lens = {k: len(v) * 3.0 for k, v in MAP_PATHS.items()}
for i in range(62):
    u = _irng.uniform()
    d = _irng.uniform(80, 1000) if u < 0.43 else _irng.uniform(1000, 2000) if u < 0.65 else _irng.uniform(2000, 3000) if u < 0.80 else _irng.uniform(3500, 4500) if u < 0.91 else _irng.uniform(4500, 9000)
    road = _irng.choice(["w", "s", "n"], p=[0.45, 0.47, 0.08])
    while d > _lens[road] - 100:
        road = _irng.choice(["w", "s"])
    at = map_along(road, d / _lens[road], float(_irng.uniform(-40, 40)))
    ic = moai(f"map_icon{i}", 260, M["map_icon"], cols=24, kind="platform")
    ic.location = at
    ic.rotation_euler = (0, 0, math.pi)
    ic.visible_shadow = False
    visible(ic, (T("dozens") + SHIFT, MAP_WIN[1]))


# ---------------------------------------------------------------- grass and stones where the camera comes close
def instance_on_points(name, pts, protos, scale=(1.0, 1.0), tilt=0.0):
    """Random members of `protos` on points, random yaw and scale (geometry nodes)."""
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
    G.link(iop.outputs["Instances"], go.inputs[0])
    host.modifiers.new(name, "NODES").node_group = ng
    return host


def blade_build(g, bsdf):
    """Dry island grass: each tuft its own mix of green and straw."""
    r = g.new("ShaderNodeObjectInfo").outputs["Random"]
    uv = g.new("ShaderNodeSeparateXYZ")
    g.link(g.coord("Generated"), uv.inputs[0])
    col = g.ramp(r, [(0.0, (0.08, 0.20, 0.03)), (0.45, (0.16, 0.34, 0.05)), (0.8, (0.30, 0.44, 0.10)), (1.0, (0.55, 0.52, 0.24))])
    tip = g.math("MULTIPLY", uv.outputs["Z"], 0.5)  # paler toward the tips
    g.link(g.mix(tip, col, (0.50, 0.56, 0.26)), bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.7


M["blade"] = make_mat("blade", blade_build)


def tuft(i):
    r = random.Random(100 + i)
    verts, faces = [], []
    for b in range(r.randint(9, 16)):
        a = r.uniform(0, TAU)
        h = r.uniform(0.14, 0.42)
        lean = r.uniform(0.05, 0.35)
        d = V3(math.cos(a), math.sin(a), 0)
        side = V3(-d.y, d.x, 0) * r.uniform(0.006, 0.012)
        base = d * r.uniform(0, 0.05)
        n0 = len(verts)
        for k_, t in enumerate((0.0, 0.5, 1.0)):
            c = base + d * (lean * h * t * t) + V3(0, 0, h * t)
            w = 1 - 0.85 * t
            verts += [c - side * w, c + side * w]
        faces += [(n0, n0 + 1, n0 + 3, n0 + 2), (n0 + 2, n0 + 3, n0 + 5, n0 + 4)]
    o = mesh_obj(f"tuft{i}", verts, faces, M["blade"], linked=False)
    return o


def pebble(i):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
    o = bpy.context.object
    r = random.Random(200 + i)
    for v in o.data.vertices:
        v.co *= r.uniform(0.75, 1.15)
    o.data.transform(Matrix.Diagonal((1.0, r.uniform(0.6, 0.9), r.uniform(0.4, 0.6), 1)))
    o.data.materials.append(M["ahu"] if i % 2 else M["tuff"])
    bpy.ops.object.shade_flat()
    scene.collection.objects.unlink(o)
    return o


ROAD_KD = __import__("mathutils").kdtree.KDTree(sum(len(p_) for p_ in PATHS.values()))
for path in PATHS.values():
    for x, y in path:
        ROAD_KD.insert(V3(x, y, 0), 0)
ROAD_KD.balance()


def disc(cx, cy, r0, dense, r1, sparse):
    """Points: dense within r0, sparse out to r1; none on the roads or on the platform."""
    n0, n1 = int(math.pi * r0 * r0 * dense), int(math.pi * (r1 * r1 - r0 * r0) * sparse)
    rr = np.concatenate([r0 * np.sqrt(rng.uniform(0, 1, n0)), np.sqrt(rng.uniform(r0 * r0, r1 * r1, n1))])
    th = rng.uniform(0, TAU, len(rr))
    out = []
    for x, y in zip(cx + rr * np.cos(th), cy + rr * np.sin(th)):
        if ROAD_KD.find(V3(x, y, 0))[2] < 2.6:
            continue
        if abs(x - AHU.x) < AHU_L / 2 + 0.3 and abs(y - AHU.y) < AHU_D / 2 + 0.3:
            continue
        out.append((x, y, gz(x, y)))
    return out


SITES = [(H0, 20, 60), (W0, 22, 70), (V3(AHU.x, AHU.y + 14, 0), 26, 60), (FU_AT, 18, 45), (DROP, 18, 50), (along("w", 0.30, 0, 14)[0], 30, 70)]
grass_pts, stone_pts = [], []
for c, r0, r1 in SITES:
    grass_pts += disc(c.x, c.y, r0, 26.0, r1, 5.0)  # many small tufts, so it reads as a sward, not planted clumps
    stone_pts += disc(c.x, c.y, r0, 0.25, r1, 0.06)
grass = instance_on_points("grass", grass_pts, [tuft(i) for i in range(10)], scale=(0.35, 0.95), tilt=0.35)
stones = instance_on_points("stones", stone_pts, [pebble(i) for i in range(4)], scale=(0.04, 0.22), tilt=0.4)
test_grass = instance_on_points("test_grass", [(TEST.x + x, TEST.y + y, 0.0) for x, y in rng.uniform(-60, 60, (260000, 2)) if abs(y + 3.2) > 0.4 or not 0 <= x <= 100], [tuft(10 + i) for i in range(10)], scale=(0.3, 0.8), tilt=0.35)
for o in (grass, stones):
    visible(o, (0, TEST_WIN[0]), (TEST_WIN[1], END + 1))
visible(test_grass, TEST_WIN)

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
sky.sun_rotation = math.radians(60)  # the north-west: the statues on the platform face inland, lit
# Per shot, cut in and out so it can jump: a low raking sun while the eye sockets are carved, so they
# fill with shadow; a high sun over the face-up road statue, whose brow otherwise threw shadows that
# read as eye sockets under "no eye sockets" (A7 pass 1).
for frame, deg in ((0, 40), (T("eye") - 1 + SHIFT, 40), (T("eye") + SHIFT, 18), (T("none") - 1 + SHIFT, 18), (T("none") + SHIFT, 72), (T("so,") - 1 + SHIFT, 72), (T("so,") + SHIFT, 40)):
    sky.sun_elevation = math.radians(deg)
    sky.keyframe_insert("sun_elevation", frame=frame)
# The hook looks at a statue walking toward us, into the sun: swing the sun round behind the camera
# for that one shot, so the face is lit.
for frame, deg in ((0, 240), (T("and") - 1 + SHIFT, 240), (T("and") + SHIFT, 60)):
    sky.sun_rotation = math.radians(deg)
    sky.keyframe_insert("sun_rotation", frame=frame)
for fc in world.node_tree.animation_data.action.layers[0].strips[0].channelbags[0].fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "CONSTANT"
W = N(world.node_tree)
wdir = W.new("ShaderNodeSeparateXYZ")
W.link(W.new("ShaderNodeTexCoord").outputs["Generated"], wdir.inputs[0])
under = W.math("MINIMUM", W.math("MAXIMUM", W.math("DIVIDE", wdir.outputs["Z"], -0.01), 0.0), 1.0)
# Fair-weather clouds: noise on a flat cloud deck (direction / height), thinning toward the horizon,
# their brightness taken from the sky itself so they match it at every sun height.
zc = W.math("MAXIMUM", wdir.outputs["Z"], 0.03)
deck = W.new("ShaderNodeCombineXYZ")
W.link(W.math("DIVIDE", wdir.outputs["X"], zc), deck.inputs["X"])
W.link(W.math("DIVIDE", wdir.outputs["Y"], zc), deck.inputs["Y"])
cl = W.new("ShaderNodeTexNoise", Scale=0.45, Detail=8.0, Roughness=0.66)  # big fair-weather cumulus
W.link(deck.outputs[0], cl.inputs["Vector"])
mask = W.math("MULTIPLY", W.math("MULTIPLY", W.math("SUBTRACT", cl.outputs["Fac"], 0.50), 4.5, clamp=True), W.math("MULTIPLY", W.math("SUBTRACT", wdir.outputs["Z"], 0.02), 6.0, clamp=True))
grey = W.math("MULTIPLY", W.lum(sky.outputs["Color"]), 1.9)
cloud = W.new("ShaderNodeCombineColor")
for k_ in ("Red", "Green", "Blue"):
    W.link(grey, cloud.inputs[k_])
sky_c = W.mix(mask, sky.outputs["Color"], cloud.outputs[0])
W.link(W.mix(under, sky_c, (2.0, 3.0, 4.5)), world.node_tree.nodes["Background"].inputs["Color"])
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.05  # the sky model is physical: far too bright at 1

# ---------------------------------------------------------------- camera: shots keyed to words
cam = link(bpy.data.objects.new("cam", bpy.data.cameras.new("cam")))
scene.camera = cam
cam.data.clip_start = 0.05
cam.data.clip_end = 60000
aim = link(bpy.data.objects.new("aim", None))
cam.constraints.new("TRACK_TO").target = aim
bpy.context.view_layer.update()

HA = hero.location.copy()  # A, mid-platform, facing +y
HE = END_E.location.copy()  # E, the east end
FU_FACE = fu_face.matrix_world.translation.copy()
w_front = WF @ V3(0, -1, 0)
w_side = WF @ V3(1, 0, 0)
WM = W0 + V3(0, 0, WH * 0.48)
R_LOOK, R_YAW = along("w", 0.30, 0, -9)
r_dir = V3(math.cos(R_YAW), math.sin(R_YAW), 0)
r_left = V3(-r_dir.y, r_dir.x, 0)
HM = H0 + V3(0, 0, WH * 0.5)
MAP_C, MAP_Q = V3(800, -400, 0), V3(3000, -200, 0)  # the island's middle; the quarry and its roads
h_front, h_side = HF @ V3(0, -1, 0), HF @ V3(1, 0, 0)
SHOTS = [
    # frame, camera, aim, lens
    (0, HM + h_front * 25 + h_side * 1.0 + V3(0, 0, -0.9), HM + V3(0, 0, -0.4), 32),  # the hook: a statue rocking toward us, islanders on its ropes
    (T("and") - 1, HM + h_front * 28 + h_side * 1.4 + V3(0, 0, -0.7), HM + V3(0, 0, -0.4), 32),
    (T("and"), HA + V3(-8, 27, 1.6), HA + V3(0, 0, AH * 0.62), 30),  # cut, on "And when they arrived": the platform from inland, the sea behind
    (T("the") - 1, HA + V3(-2, 13, 2.3), HA + V3(0, 0, AH * 0.62), 30),
    (T("the"), MAP_C + V3(0, -15500, 39500), MAP_C, 30),  # cut: the whole island from high above; icons on "dozens", roads on "roads"
    (T("roads", 1), MAP_C + V3(0, -14800, 37800), MAP_C, 30),
    (T("apparently") - 1, MAP_Q + V3(0, -8000, 21000), MAP_Q, 30),  # then in toward the quarry
    (T("apparently"), DROP + V3(-9, -7, 3.2), DROP + V3(0, 0, 0.6), 30),  # cut: low over a statue on the west road
    (T("on", 2) - 1, DROP + V3(-6.5, -8.5, 2.8), DROP + V3(0, 0, 0.6), 30),
    (T("on", 2), WM + w_front * 20 + w_side * 3 + V3(0, 0, 0.4), WM, 32),  # cut: a road statue, front on
    (T("they", 2) - 1, WM + w_front * 18 + w_side * 2.5 + V3(0, 0, 0.4), WM, 32),
    (T("they", 2), WM + w_side * 21 + w_front * 1.5 + V3(0, 0, 0.3), WM, 32),  # cut: side on, the lean
    (T("rock") - 1, WM + w_side * 19.5 + w_front * 1.5 + V3(0, 0, 0.3), WM, 32),
    (T("rock"), WM + w_front * 24 - w_side * 7 + V3(0, 0, 5.0), WM + V3(0, 0, -1.0), 22),  # cut: rocked on ropes, the crews in frame
    (T("in", 1) - 1, WM + w_front * 20 - w_side * 5 + V3(0, 0, 4.2), WM + w_front * 1.0 + V3(0, 0, -1.0), 22),
    (T("in", 1), TEST + V3(15, -17, 11), TEST + V3(-3, 1, 0.5), 22),  # cut: the test: replica and all 18 of the crew
    (T("hundred") - 1, TEST + V3(16, -16, 10.5), TEST + V3(-2, 1, 0.5), 22),
    (T("hundred"), TEST + V3(-16, -26, 18), TEST + V3(48, 0, 0), 22),  # higher, behind them: the taped 100 m
    (T("the", 6) - 1, TEST + V3(-14, -25, 17), TEST + V3(50, 0, 0), 22),
    (T("the", 6), HE + V3(15.5, 0.6, 2.6), HE + V3(0, 0, AH * 0.48), 34),  # cut: the end statue side on: straight
    (T("on", 4) - 1, HE + V3(14.5, 0.6, 2.6), HE + V3(0, 0, AH * 0.48), 34),
    (T("on", 4), HE + V3(0, 16.5, 2.6), HE + V3(0, 0, AH * 0.48), 34),  # cut: front on: shoulders and base
    (T("eye") - 1, HE + V3(0, 15.5, 2.6), HE + V3(0, 0, AH * 0.48), 34),
    (T("eye"), HA + V3(2.4, 4.6, AH * 0.84 + 0.3), HA + V3(0, 0, AH * 0.79), 45),  # cut: A's face, three-quarter, as the sockets are cut
    (T("none") - 1, HA + V3(1.8, 3.8, AH * 0.82 + 0.25), HA + V3(0, 0, AH * 0.79), 45),
    (T("none"), FU_FACE + V3(0.9, -1.4, 4.4), FU_FACE, 36),  # cut: a road statue's face, from above so brow and nose read: no sockets
    (T("so,") - 1, FU_FACE + V3(0.7, -1.1, 4.0), FU_FACE, 36),
    (T("so,"), B_AT + V3(-15.5, 1.5, 2.6), B_AT + V3(0, 0.5, AH * 0.45), 34),  # cut: B side on, as it is trimmed
    (T("not") - 1, B_AT + V3(-14.5, 1.5, 2.6), B_AT + V3(0, 0.5, AH * 0.45), 34),
    (T("not"), R_LOOK + V3(0, 0, 2.2) + r_left * 5, R_LOOK + r_dir * 70 + V3(0, 0, 1.6), 26),  # cut: down the west road, the run of fallen statues
    (END, R_LOOK + V3(0, 0, 2.6) + r_left * 5 + r_dir * 5, R_LOOK + r_dir * 70 + V3(0, 0, 1.8), 26),
]
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
SHOT_OF = {  # empty: (first frame, last frame) it is tracked over
    "a_top": (0, T("the")),
    "quarry": (T("the"), T("apparently")),
    "map_road_pin": (T("the"), T("apparently")),
    "fallen_w": (T("apparently"), T("on", 2)),
    **{k: (T("on", 2), T("in", 1)) for k in ("w_sh_l", "w_sh_r", "w_base_l", "w_base_r", "w_top", "w_bot", "w_up")},
    **{k: (T("in", 1), T("the", 6)) for k in ("replica_pin", "t_start", "t_end", "crew_rear", "crew_left", "crew_right")},
    **{k: (T("the", 6), T("eye")) for k in ("e_sh_l", "e_sh_r", "e_base_l", "e_base_r", "e_top", "e_bot")},
    "a_eye": (T("eye"), T("none")),
    "a_eye_r": (T("eye"), T("none")),
    "fu_face": (T("none"), T("so,")),
    **{k: (T("so,"), T("not")) for k in ("b_trim", "b_top", "b_bot")},
    "upright": (T("not"), END),
}
scene.render.resolution_x = args.width
scene.render.resolution_y = args.width * 16 // 9
if not args.no_anchors:
    span = {k: (max(a - 8, 0), min(b + 8, END)) for k, (a, b) in SHOT_OF.items()}
    out = {"fps": FPS, "start": 0, "end": END, "cuts": CUTS, "anchors": {k: {"f0": v[0], "pts": []} for k, v in span.items()}}
    for f in range(0, END + 1):
        scene.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        for name, (f0, f1) in span.items():
            if f0 <= f <= f1:
                w = bpy.data.objects[name].evaluated_get(dg).matrix_world.translation
                c = world_to_camera_view(scene, cam.evaluated_get(dg), w)
                out["anchors"][name]["pts"].append([round(c.x, 4), round(1 - c.y, 4), 1 if c.z > 0 else 0])
    (ROOT / "src/generated/moai-world.anchors.json").write_text(json.dumps(out, separators=(",", ":")))

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
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.03  # stop early on sky and flat grass; the denoiser does the rest
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 3
scene.cycles.transparent_max_bounces = 12  # ghosts, and the road's faded edges
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
    scene.frame_start = args.start or 0
    scene.frame_end = args.end or END + OUTRO
    scene.render.filepath = f"{args.out}/"
    bpy.ops.render.render(animation=True)
