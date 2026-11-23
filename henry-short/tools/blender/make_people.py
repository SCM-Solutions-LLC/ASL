"""The people in the cleopatra-pyramid world: MakeHuman bodies, posed and dressed, baked to plain
meshes in tools/blender/assets/people.blend (which cleopatra_world.py appends; it needs no add-on).

Needs, once:
  blender --online-mode --command extension install mpfb        # MPFB 2.0.18, GPL (the program)
  tools/blender/fetch_assets.sh                                   # also fetches the MakeHuman system assets, CC0
Run:
  blender -b --factory-startup --python tools/blender/make_people.py [-- --sheet /tmp/people.png]

The bodies, skins, eyes and hair are MakeHuman assets (CC0, credited in public/SOURCES.json); the
clothes are modelled here and hung on each posed body by Blender's cloth solver, one layer each
(a second layer over the first tangles: cloth does not collide reliably with cloth here). Nobody is a portrait: body shapes are
MakeHuman's sliders, and the one named figure (Diodorus) is only ever seen from behind (A5).
Skin is tinted to a range of browns; it is a generic choice for an illustration, not a claim (C6).
"""
import argparse
import math
import random
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Vector

p = argparse.ArgumentParser()
p.add_argument("--sheet", help="also render a contact sheet of every figure to this PNG")
p.add_argument("--only", nargs="*", help="rebuild only these figures; the others are kept from the existing people.blend")
args = p.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else [])

HERE = Path(__file__).resolve().parent
MH = HERE / "assets" / "makehuman" / "data"
OUT = HERE / "assets" / "people.blend"
TAU = math.tau

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.preferences.addon_enable(module="bl_ext.blender_org.mpfb")
from bl_ext.blender_org.mpfb.services.humanservice import HumanService  # noqa: E402
from bl_ext.blender_org.mpfb.services.targetservice import TargetService  # noqa: E402

scene = bpy.context.scene
ARM_BONES = ("upperarm", "lowerarm", "wrist", "finger", "metacarpal")  # not the shoulders: a tunic hangs from those


# ---------------------------------------------------------------- posing: aim bones at world directions
def aim(rig, name, direction):
    """Swing a pose bone so it points along `direction` (armature space), keeping its roll."""
    pb = rig.pose.bones[name]
    cur = (pb.tail - pb.head).normalized()
    q = cur.rotation_difference(Vector(direction).normalized())
    rot = q.to_matrix().to_4x4() @ pb.matrix.to_3x3().to_4x4()
    pb.matrix = Matrix.Translation(pb.head) @ rot
    bpy.context.view_layer.update()


def turn(rig, name, axis, angle):
    """Rotate a pose bone about an armature-space axis through its head."""
    pb = rig.pose.bones[name]
    rot = Matrix.Rotation(angle, 4, Vector(axis)) @ pb.matrix.to_3x3().to_4x4()
    pb.matrix = Matrix.Translation(pb.head) @ rot
    bpy.context.view_layer.update()


# Poses: bone -> direction as (out to the figure's own side, forward, up). Left and right are given
# separately so no pose is a mirror image.
POSES = {
    "stand": {"upperarm01.L": (0.16, 0.04, -1), "lowerarm01.L": (0.1, 0.22, -1), "upperarm01.R": (0.14, -0.02, -1), "lowerarm01.R": (0.07, 0.18, -1), "upperleg01.L": (0.06, 0.03, -1), "upperleg01.R": (0.05, -0.02, -1)},
    "hips": {"upperarm01.L": (0.55, -0.12, -1), "lowerarm01.L": (-0.55, 0.3, -0.25), "upperarm01.R": (0.5, -0.1, -1), "lowerarm01.R": (-0.5, 0.32, -0.2), "upperleg01.L": (0.1, 0.0, -1), "upperleg01.R": (0.08, 0.0, -1)},
    "shade": {"upperarm01.L": (0.15, 0.03, -1), "lowerarm01.L": (0.08, 0.2, -1), "upperarm01.R": (0.45, 0.55, 0.25), "lowerarm01.R": (-0.75, 0.35, 0.55), "upperleg01.L": (0.07, 0.0, -1), "upperleg01.R": (0.05, 0.02, -1), "head": 0.3},
    "carry": {"upperarm01.L": (0.12, 0.2, -1), "lowerarm01.L": (-0.1, 1, -0.05), "upperarm01.R": (0.12, 0.18, -1), "lowerarm01.R": (-0.12, 1, 0.0), "upperleg01.L": (0.05, 0.05, -1), "upperleg01.R": (0.05, -0.04, -1)},
    "walk": {"upperarm01.L": (0.12, -0.3, -1), "lowerarm01.L": (0.06, 0.05, -1), "upperarm01.R": (0.12, 0.3, -1), "lowerarm01.R": (0.02, 0.55, -1), "upperleg01.L": (0.03, 0.36, -1), "lowerleg01.L": (0.0, 0.2, -1), "upperleg01.R": (0.03, -0.26, -1), "lowerleg01.R": (0.0, -0.62, -1)},
    "haul": {"upperarm01.L": (0.1, 0.75, -0.75), "lowerarm01.L": (-0.2, 1, -0.3), "upperarm01.R": (0.1, 0.7, -0.8), "lowerarm01.R": (-0.2, 1, -0.35), "upperleg01.L": (0.04, 0.42, -1), "lowerleg01.L": (0, 0.1, -1), "upperleg01.R": (0.04, -0.35, -1), "lowerleg01.R": (0, -0.5, -1), "lean": 0.3},
    "talk": {"upperarm01.L": (0.2, 0.15, -1), "lowerarm01.L": (0.15, 0.9, 0.1), "upperarm01.R": (0.14, 0.0, -1), "lowerarm01.R": (0.06, 0.2, -1), "upperleg01.L": (0.08, 0.02, -1), "upperleg01.R": (0.04, -0.02, -1), "head": -0.35},
    "lookup": {"upperarm01.L": (0.15, 0.02, -1), "lowerarm01.L": (0.08, 0.2, -1), "upperarm01.R": (0.14, -0.02, -1), "lowerarm01.R": (0.06, 0.18, -1), "upperleg01.L": (0.07, 0.02, -1), "upperleg01.R": (0.05, -0.02, -1), "nod": -0.42},
    "staff": {"upperarm01.L": (0.12, -0.25, -1), "lowerarm01.L": (0.05, 0.05, -1), "upperarm01.R": (0.16, 0.35, -1), "lowerarm01.R": (0.05, 1, 0.25), "upperleg01.L": (0.03, 0.34, -1), "lowerleg01.L": (0.0, 0.18, -1), "upperleg01.R": (0.03, -0.24, -1), "lowerleg01.R": (0.0, -0.58, -1)},
    "write": {"upperarm01.L": (0.16, 0.5, -1), "lowerarm01.L": (-0.35, 1, -0.28), "upperarm01.R": (0.14, 0.55, -1), "lowerarm01.R": (-0.5, 1, -0.3), "upperleg01.L": (0.14, 1, -0.04), "lowerleg01.L": (0.0, 0.1, -1), "upperleg01.R": (0.14, 1, -0.04), "lowerleg01.R": (0.0, 0.1, -1), "lean": 0.16, "nod": 0.3, "curl": {"R": (0.5, 0.8, 0.95, 1.0), "L": 0.14}, "flat": "L", "pinch": "R"},  # a pen grip: forefinger and thumb meet, the rest tucked under
    "row": {"upperarm01.L": (0.1, 0.9, -0.5), "lowerarm01.L": (-0.15, 1, 0.05), "upperarm01.R": (0.1, 0.9, -0.5), "lowerarm01.R": (-0.15, 1, 0.05), "upperleg01.L": (0.12, 1, -0.12), "lowerleg01.L": (0.0, 0.35, -1), "upperleg01.R": (0.12, 1, -0.12), "lowerleg01.R": (0.0, 0.35, -1), "lean": 0.22},
}


def pose(rig, name, fwd):
    """Apply a pose. `fwd` is +1 or -1: which way along y the figure faces in armature space."""
    spec = POSES[name]
    for part in ("upperleg01", "lowerleg01", "upperarm01", "lowerarm01"):
        for side, sx in ((".L", 1), (".R", -1)):
            d = spec.get(part + side)
            if d is None and part == "lowerleg01":
                d = (0.0, 0.0, -1.0)  # shins hang straight unless the pose says otherwise
            if d is not None:
                aim(rig, part + side, (d[0] * sx, d[1] * fwd, d[2]))
    if "lean" in spec:  # lean the whole trunk forward from the hips
        turn(rig, "spine05", (1, 0, 0), -spec["lean"] * fwd)
        turn(rig, "head", (1, 0, 0), spec["lean"] * 0.6 * fwd)
    if "head" in spec:
        turn(rig, "neck01", (0, 0, 1), spec["head"])
    if "nod" in spec:
        turn(rig, "neck01", (1, 0, 0), -spec["nod"] * 0.5 * fwd)
        turn(rig, "head", (1, 0, 0), -spec["nod"] * 0.5 * fwd)
    for side, angle in spec.get("curl", {}).items():
        curl(rig, side, angle)
    if "flat" in spec:
        flat(rig, spec["flat"])
    if "pinch" in spec:
        dip(rig, spec["pinch"], 0.03)
        pinch(rig, spec["pinch"])
        pinch(rig, spec["pinch"])


def flat(rig, side):
    """Roll the hand about its own length until it lies palm down: knuckles level, little finger on the outside."""
    pb = rig.pose.bones
    other = "R" if side == "L" else "L"
    out = pb[f"wrist.{side}"].head - pb[f"wrist.{other}"].head
    out.z = 0
    out.normalize()

    def score():
        across = pb[f"finger5-1.{side}"].head - pb[f"finger2-1.{side}"].head
        return across.dot(out) - abs(across.z)

    wrist = pb[f"wrist.{side}"]
    axis = (wrist.tail - wrist.head).normalized()
    start = wrist.matrix.copy()
    best = (score(), 0.0)
    for k in range(1, 32):
        wrist.matrix = start
        bpy.context.view_layer.update()
        turn(rig, f"wrist.{side}", axis, k * TAU / 32)
        best = max(best, (score(), k * TAU / 32))
    wrist.matrix = start
    bpy.context.view_layer.update()
    turn(rig, f"wrist.{side}", axis, best[1])


def dip(rig, side, gap):
    """Bend the wrist down until the forefinger's tip is `gap` above the lowest knuckle: a hand lying on its side to write."""
    pb = rig.pose.bones
    for _ in range(14):
        low = min(min(pb[f"finger{f}-{j}.{side}"].head.z, pb[f"finger{f}-{j}.{side}"].tail.z) for f in (3, 4, 5) for j in (1, 2, 3)) - 0.009
        if pb[f"finger2-3.{side}"].tail.z - low <= gap:
            break
        wrist = pb[f"wrist.{side}"]
        axis = (wrist.tail - wrist.head).cross(Vector((0, 0, -1)))
        turn(rig, f"wrist.{side}", axis.normalized(), 0.07)


def pinch(rig, side):
    """Close the thumb onto the forefinger, as on a pen."""
    pb = rig.pose.bones
    for j, most in ((1, 0.3), (2, 0.4), (3, 0.3)):
        thumb = pb[f"finger1-{j}.{side}"]
        along = (thumb.tail - thumb.head).normalized()
        to = pb[f"finger2-3.{side}"].tail - thumb.tail
        axis = along.cross(to)
        if axis.length > 1e-6:
            turn(rig, f"finger1-{j}.{side}", axis.normalized(), min(most, along.angle(to)))


def curl(rig, side, angle):
    """Close the four fingers of one hand by `angle` radians at each joint (one angle, or one per finger)."""
    pb = rig.pose.bones
    axis = (pb[f"finger5-1.{side}"].head - pb[f"finger2-1.{side}"].head).normalized()  # along the knuckles
    thumb = pb[f"finger1-3.{side}"]
    tip = pb[f"finger3-3.{side}"]
    before = (tip.tail - thumb.tail).length
    saved = pb[f"finger3-1.{side}"].matrix_basis.copy()
    turn(rig, f"finger3-1.{side}", axis, 0.4)
    sign = 1.0 if (tip.tail - thumb.tail).length < before else -1.0  # fingers close toward the thumb
    pb[f"finger3-1.{side}"].matrix_basis = saved
    bpy.context.view_layer.update()
    each = angle if isinstance(angle, tuple) else (angle,) * 4  # forefinger to little finger
    for f, a in zip((2, 3, 4, 5), each):
        for j in (1, 2, 3):
            turn(rig, f"finger{f}-{j}.{side}", axis, sign * a * (0.8 if j == 1 else 1.0))


# ---------------------------------------------------------------- materials
def scan(nt, name, tile, asset="rough_linen"):
    img = bpy.data.images.load(str(HERE / "assets" / asset / f"{asset}_{name}_2k.jpg"), check_existing=True)
    if name != "diff":
        img.colorspace_settings.name = "Non-Color"
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.projection = "BOX"
    tex.projection_blend = 0.25
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / tile,) * 3
    nt.links.new(nt.nodes.new("ShaderNodeTexCoord").outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs[0], tex.inputs["Vector"])
    return tex


def cloth(name, lo, hi):
    """Woven cloth: a linen scan for the weave, a tone that varies from one figure to the next."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    oi = nt.nodes.new("ShaderNodeObjectInfo")
    tone = nt.nodes.new("ShaderNodeMix")
    tone.data_type = "RGBA"
    tone.inputs[6].default_value, tone.inputs[7].default_value = (*lo, 1), (*hi, 1)
    nt.links.new(oi.outputs["Random"], tone.inputs["Factor"])
    weave = scan(nt, "diff", 0.27)
    mul = nt.nodes.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs["Factor"].default_value = 0.55
    nt.links.new(tone.outputs[2], mul.inputs[6])
    nt.links.new(weave.outputs["Color"], mul.inputs[7])
    nt.links.new(mul.outputs[2], bsdf.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.5
    bump.inputs["Distance"].default_value = 0.004
    nt.links.new(scan(nt, "disp", 0.27).outputs["Color"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.86
    m.use_fake_user = True  # MPFB purges unused materials while it builds a human
    return m


def plain(name, col, rough=0.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Roughness"].default_value = rough
    m.use_fake_user = True
    return m


LINEN = cloth("linen", (0.74, 0.69, 0.56), (0.93, 0.9, 0.8))
WOOL = cloth("wool", (0.4, 0.27, 0.16), (0.56, 0.4, 0.25))
STRAW = cloth("straw", (0.62, 0.5, 0.28), (0.7, 0.58, 0.34))
HAIR = plain("cropped_hair", (0.022, 0.018, 0.015), 0.55)
WOODM = plain("staff_wood", (0.3, 0.19, 0.1), 0.7)
LEATHER = plain("leather", (0.06, 0.035, 0.02), 0.6)
REED = plain("reed_pen", (0.42, 0.3, 0.14), 0.5)
INK = plain("ink", (0.02, 0.017, 0.014), 0.45)
PAPYRUS_SLOT = plain("papyrus_slot", (0.72, 0.58, 0.34), 0.8)  # the world script swaps in its papyrus material


def stone_mat():
    """A limestone seat: a rock scan toned pale."""
    m = bpy.data.materials.new("seat_stone")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    col = scan(nt, "diff", 1.6, asset="rock_face_03")
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    nt.links.new(col.outputs["Color"], bw.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = 0.2, (0.45, 0.37, 0.26, 1)
    ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = 0.82, (0.88, 0.81, 0.66, 1)
    nt.links.new(bw.outputs[0], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.7
    bump.inputs["Distance"].default_value = 0.04
    nt.links.new(scan(nt, "disp", 1.6, asset="rock_face_03").outputs["Color"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.85
    m.use_fake_user = True
    return m


STONE = stone_mat()


def box(name, lo, hi, mat):
    me = bpy.data.meshes.new(name)
    x0, y0, z0 = lo
    x1, y1, z1 = hi
    me.from_pydata([(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], [], [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7), (3, 2, 1, 0)])
    me.update()
    me.materials.append(mat)
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return o


def tint_skin(mat, tone):
    """Multiply the skin texture toward `tone`, and vary it a little from one figure to the next."""
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    src = bsdf.inputs["Base Color"].links[0].from_socket if bsdf.inputs["Base Color"].links else None
    oi = nt.nodes.new("ShaderNodeObjectInfo")
    vary = nt.nodes.new("ShaderNodeMix")
    vary.data_type = "RGBA"
    vary.inputs[6].default_value = (*[c * 0.8 for c in tone], 1)
    vary.inputs[7].default_value = (*[min(1, c * 1.12) for c in tone], 1)
    nt.links.new(oi.outputs["Random"], vary.inputs["Factor"])
    mul = nt.nodes.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs["Factor"].default_value = 1.0
    if src is not None:
        nt.links.new(src, mul.inputs[6])
    else:
        mul.inputs[6].default_value = (0.8, 0.8, 0.8, 1)
    nt.links.new(vary.outputs[2], mul.inputs[7])
    mid = nt.nodes.new("ShaderNodeMix")
    mid.data_type = "RGBA"
    mid.inputs["Factor"].default_value = 0.32
    mid.inputs[7].default_value = (0.36, 0.22, 0.14, 1)
    nt.links.new(mul.outputs[2], mid.inputs[6])
    nt.links.new(mid.outputs[2], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.68
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.25
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.0  # figures stay 8 m or more away; plain diffuse is enough


# ---------------------------------------------------------------- clothes, fitted to the posed body
def sections(co, mask, z0, z1, n):
    """Elliptical cross-sections (z, rx, ry, cx, cy) of the masked vertices between two heights."""
    out = []
    for z in np.linspace(z0, z1, n):
        sl = co[mask & (np.abs(co[:, 2] - z) < 0.035)]
        if len(sl) < 4:
            sl = co[mask & (np.abs(co[:, 2] - z) < 0.09)]
        lo, hi = sl[:, :2].min(0), sl[:, :2].max(0)
        out.append((z, (hi[0] - lo[0]) / 2, (hi[1] - lo[1]) / 2, (hi[0] + lo[0]) / 2, (hi[1] + lo[1]) / 2))
    return out


def densify(secs, step=0.028):
    """Sections resampled every `step` metres of height, bottom to top."""
    a = np.array(secs)
    zs = np.arange(a[0, 0], a[-1, 0] + 1e-6, step)
    return [tuple([float(z)] + [float(np.interp(z, a[:, 0], a[:, c])) for c in range(1, 5)]) for z in zs]


def cloth_mesh(name, rings, mat, segs=64, span=None, pin=()):
    """A tube (or, with `span`, an open sheet) through elliptical rings (z, rx, ry, cx, cy), bottom to
    top. Rings listed in `pin` are held in place; the rest is free to hang."""
    a0, a1 = span or (0.0, TAU)
    n = segs if span is None else segs + 1
    verts, faces = [], []
    for z, rx, ry, cx, cy in rings:
        for k in range(n):
            a = a0 + (a1 - a0) * k / segs
            verts.append((cx + rx * math.cos(a), cy + ry * math.sin(a), z))
    for i in range(len(rings) - 1):
        for k in range(segs):
            k1 = (k + 1) % n if span is None else k + 1
            faces.append((i * n + k, i * n + k1, (i + 1) * n + k1, (i + 1) * n + k))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    me.materials.append(mat)
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    o.vertex_groups.new(name="pin").add([(i % len(rings)) * n + k for i in pin for k in range(n)], 1.0, "REPLACE")
    return o


def drape(garment, colliders, frames=36, bend=0.6, mass=0.3, gap=0.007):
    """Let a garment hang: Blender's cloth solver, with the posed body (and any clothes already on
    it) as obstacles. Returns the garment as a plain mesh in its settled shape."""
    cols = []
    for c in colliders:
        cols.append((c, c.modifiers.new("col", "COLLISION")))
        c.collision.thickness_outer = gap
        c.collision.thickness_inner = 0.03
        c.collision.cloth_friction = 12
    m = garment.modifiers.new("cloth", "CLOTH")
    m.settings.quality = 7
    m.settings.mass = mass
    m.settings.tension_stiffness = m.settings.compression_stiffness = 15
    m.settings.shear_stiffness = 5
    m.settings.bending_stiffness = bend
    m.settings.vertex_group_mass = "pin"
    m.collision_settings.distance_min = gap
    m.collision_settings.use_self_collision = False
    m.point_cache.frame_start, m.point_cache.frame_end = 1, frames
    scene.frame_start, scene.frame_end = 1, frames
    for f in range(1, frames + 1):
        scene.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    settled = bpy.data.meshes.new_from_object(garment.evaluated_get(dg))
    garment.modifiers.clear()
    garment.vertex_groups.clear()
    garment.data = settled
    for c, mod in cols:
        c.modifiers.remove(mod)
    scene.frame_set(1)
    thick = garment.modifiers.new("thick", "SOLIDIFY")  # cloth has an edge
    thick.thickness = 0.006
    thick.offset = 1.0  # outward: never into the body or the layer beneath
    for poly in garment.data.polygons:
        poly.use_smooth = True
    return garment


def lathe(name, profile, centre, mat, segs=28, squash=1.0):
    """A turned shape from (radius, z) pairs around a vertical axis: hat, belt."""
    verts, faces = [], []
    n = len(profile)
    for k in range(segs):
        a = k / segs * TAU
        for r, z in profile:
            verts.append((centre[0] + r * math.cos(a), centre[1] + r * squash * math.sin(a), z))
    for k in range(segs):
        for q in range(n - 1):
            a0, a1 = k * n + q, ((k + 1) % segs) * n + q
            faces.append((a0, a1, a1 + 1, a0 + 1))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    me.materials.append(mat)
    for poly in me.polygons:
        poly.use_smooth = True
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return o


def stick(name, p0, p1, r, mat, segs=10):
    me = bpy.data.meshes.new(name)
    p0, p1 = Vector(p0), Vector(p1)
    ax = (p1 - p0).normalized()
    u = ax.cross(Vector((0.3, 1, 0.2))).normalized()
    w = ax.cross(u)
    verts = [tuple(pt + (u * math.cos(k / segs * TAU) + w * math.sin(k / segs * TAU)) * r) for pt in (p0, p1) for k in range(segs)]
    faces = [(k, (k + 1) % segs, segs + (k + 1) % segs, segs + k) for k in range(segs)] + [tuple(range(segs, 2 * segs))]
    me.from_pydata(verts, [], faces)
    me.update()
    me.materials.append(mat)
    o = bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    return o


def band(z, rx, ry, cx, cy, h, out, mat):
    """A flat band round the body at one height: a waistband, a belt."""
    return cloth_mesh("band", [(z - h / 2, rx + out, ry + out, cx, cy), (z, rx + out * 1.5, ry + out * 1.5, cx, cy), (z + h / 2, rx + out, ry + out, cx, cy)], mat, segs=40)


def sandals(body, foot_flag):
    """Sandals cut from the feet themselves, so they fit in any pose: the faces under each foot,
    thickened into a sole, and two bands of the foot's own skin thickened into straps."""
    me = body.data
    out = []
    for side in (1.0, 2.0):
        mine = np.abs(foot_flag - side) < 0.1
        idx = np.nonzero(mine)[0]
        pts = np.array([me.vertices[i].co for i in idx])
        heel_toe = pts - pts.mean(0)
        axis = np.linalg.svd(heel_toe[:, :2], full_matrices=False)[2][0]  # the foot's long axis on the ground
        along = heel_toe[:, :2] @ axis
        lo, hi = along.min(), along.max()
        pos = dict(zip(idx.tolist(), ((along - lo) / (hi - lo)).tolist()))
        sole, straps = [], []
        for poly in me.polygons:
            if not all(v in pos for v in poly.vertices):
                continue
            t = sum(pos[v] for v in poly.vertices) / len(poly.vertices)
            if poly.normal.z < -0.45:
                sole.append(poly.vertices[:])
            elif 0.18 < t < 0.27 or 0.5 < t < 0.6 or 0.73 < t < 0.8:
                straps.append(poly.vertices[:])
        for name, faces, thick in (("sole", sole, 0.014), ("straps", straps, 0.005)):
            used = sorted({v for f in faces for v in f})
            remap = {v: i for i, v in enumerate(used)}
            m = bpy.data.meshes.new(name)
            m.from_pydata([tuple(me.vertices[v].co) for v in used], [], [tuple(remap[v] for v in f) for f in faces])
            m.update()
            m.materials.append(LEATHER)
            o = bpy.data.objects.new(name, m)
            scene.collection.objects.link(o)
            sol = o.modifiers.new("thick", "SOLIDIFY")
            sol.thickness = thick
            sol.offset = 1.0
            out.append(o)
    return out


def dress(kind, body, co, trunk, everything, J, fwd):
    """Clothes for one posed body, hung on it by the cloth solver. Returns the garment objects."""
    hip, knee, ankle, neck, top = J["hip"], J["knee"], J["ankle"], J["neck"], J["top"]
    waist = hip + 0.085
    out = []
    if kind in ("kilt", "rower"):  # a linen kilt wrapped at the waist, to just above the knee
        hem = knee + 0.07 if kind == "kilt" else hip - 0.2
        rings = []
        for z, rx, ry, cx, cy in densify(sections(co, trunk, hem, waist, 7)):
            d = (waist - z) / (waist - hem)  # 0 at the waist, 1 at the hem
            rings.append((z, rx * (1.0 + 0.07 * d) + 0.008 + 0.03 * d, ry * (1.0 + 0.1 * d) + 0.008 + 0.04 * d, cx, cy))
        kilt = drape(cloth_mesh("kilt", rings, LINEN, pin=(-1, -2)), [body], frames=30, bend=1.2)
        z, rx, ry, cx, cy = rings[-1]
        out += [kilt, band(z, rx, ry, cx, cy, 0.05, 0.006, LINEN)]
    if kind == "writer":  # Diodorus seated, writing: a belted wool tunic, a short cape over the shoulders, a hat, a scroll on a board
        seat_top = hip - 0.085
        seat = box("seat", (-0.34, -0.46 if fwd < 0 else -0.02, 0.0), (0.34, 0.02 if fwd < 0 else 0.46, seat_top), STONE)
        f_co = co[:, 1] * fwd  # how far forward each vertex is
        # Upper body: a tube from the waist to the armpits, held at both ends.
        armpit = neck - 0.17
        rings = [(z, rx * 1.03 + 0.016, ry * 1.05 + 0.02, cx, cy) for z, rx, ry, cx, cy in densify(sections(co, trunk, waist, armpit, 6))]
        top = drape(cloth_mesh("tunic_top", rings, WOOL, pin=(0, 1, -1, -2)), [body], frames=20, bend=0.5)
        # Hips: a short tube from the seat to the waist.
        rings = [(z, rx * 1.04 + 0.018, ry * 1.04 + 0.02, cx, cy) for z, rx, ry, cx, cy in densify(sections(co, trunk & (f_co < 0.16), seat_top + 0.015, waist, 4))]
        hips = drape(cloth_mesh("tunic_hips", rings, WOOL, pin=(0, -1)), [body, seat], frames=12, bend=0.5)
        # Lap: a tube round both thighs, running forward from the hips to just short of the knees, free to settle on them.
        lap_rings = []
        for t in np.arange(0.1, J["knee_fwd"] - 0.03, 0.028):
            sl = co[trunk & (np.abs(f_co - t) < 0.035) & (co[:, 2] > seat_top - 0.03) & (co[:, 2] < hip + 0.16)]
            if len(sl) < 6:
                continue
            lo, hi = sl[:, [0, 2]].min(0), sl[:, [0, 2]].max(0)
            lap_rings.append((float(t), (hi[0] - lo[0]) / 2 * 1.04 + 0.02, (hi[1] - lo[1]) / 2 * 1.05 + 0.02, (hi[0] + lo[0]) / 2, (hi[1] + lo[1]) / 2))
        lap_o = cloth_mesh("tunic_lap", lap_rings, WOOL, pin=(0, 1))
        lap_o.data.transform(Matrix(((1, 0, 0, 0), (0, 0, fwd, 0), (0, 1, 0, 0), (0, 0, 0, 1))))  # rings were laid out along the thighs
        lap = drape(lap_o, [body, seat], frames=30, bend=0.5)
        # Shoulders: a short wool cape, dropped on from above and held at the neck.
        nz, nrx, nry, ncx, ncy = sections(co, trunk, neck + 0.015, neck + 0.015, 1)[0]
        sz, srx, sry, scx, scy = sections(co, everything, neck - 0.06, neck - 0.06, 1)[0]
        cape_rings = []
        for q in np.linspace(1.0, 0.0, 11):  # from the outer edge in to the neck
            cape_rings.append((nz + 0.035 * q, nrx * 1.12 + 0.012 + (srx + 0.07 - nrx) * q, nry * 1.12 + 0.012 + (sry + 0.1 - nry) * q, ncx + (scx - ncx) * q, ncy + (scy - ncy) * q))
        cape = drape(cloth_mesh("cape", cape_rings, WOOL, segs=72, pin=(-1,)), [body, top], frames=40, bend=0.25, mass=0.4, gap=0.012)
        z, rx, ry, cx, cy = sections(co, trunk, waist, waist, 1)[0]
        hx, hy = J["head_top_xy"]
        topz = J["top"] - 0.05  # down over the crown of the head
        hat = lathe("hat", [(0.2, topz - 0.05), (0.19, topz - 0.038), (0.14, topz - 0.016), (0.1, topz - 0.006), (0.092, topz + 0.03), (0.06, topz + 0.06), (0.001, topz + 0.068)], (hx, hy), STRAW)
        pivot = Vector((hx, hy, topz - 0.08))
        hat.data.transform(Matrix.Translation(pivot) @ Matrix.Rotation(-0.36 * fwd, 4, "X") @ Matrix.Translation(-pivot))  # tipped forward with his bowed head
        # The scroll lies on a board across his knees, under the pen.
        tip = Vector(J["pen_tip"])
        bz = tip.z - 0.002  # the page is 2 mm above the board; the nib stands on it
        tilt = Matrix.Translation(tip) @ Matrix.Rotation(-math.atan(J["page"][2]), 4, "Y") @ Matrix.Translation(-tip)  # the board follows his hands
        board = box("board", (tip.x - 0.3, tip.y - 0.17, bz - 0.02), (tip.x + 0.28, tip.y + 0.16, bz), WOODM)
        sh = bpy.data.meshes.new("scroll")
        x0, x1, y0, y1 = tip.x - 0.24, tip.x + 0.22, tip.y - 0.13, tip.y + 0.12
        if fwd > 0:  # lines of writing run across him, left to right as he sees them
            quad = [(x0, y0, bz + 0.002), (x1, y0, bz + 0.002), (x1, y1, bz + 0.002), (x0, y1, bz + 0.002)]
        else:
            quad = [(x1, y1, bz + 0.002), (x0, y1, bz + 0.002), (x0, y0, bz + 0.002), (x1, y0, bz + 0.002)]
        sh.from_pydata(quad, [], [(0, 1, 2, 3)])
        sh.update()
        lay = sh.uv_layers.new(name=body.data.uv_layers[0].name if body.data.uv_layers else "UVMap")
        for li, t in enumerate([(0.07, 0.07), (0.93, 0.07), (0.93, 0.93), (0.07, 0.93)]):  # inside the material's torn border
            lay.data[li].uv = t
        sh.materials.append(PAPYRUS_SLOT)
        scroll = bpy.data.objects.new("scroll", sh)
        scene.collection.objects.link(scroll)
        rolls = [stick(f"roll{k}", (xr, y0 - 0.01, bz + 0.02), (xr, y1 + 0.01, bz + 0.02), 0.02, WOODM, segs=14) for k, xr in enumerate((x0 - 0.015, x1 + 0.015))]
        grip = Vector(J["pen_grip"])
        along = (grip - tip).normalized()
        for o in [board, scroll] + rolls:
            o.data.transform(tilt)
        pen = stick("pen", tuple(tip + along * 0.012), tuple(tip + along * 0.17), 0.003, REED, segs=10)  # a reed pen, about 6 mm thick
        nib = stick("pen_nib", tuple(tip), tuple(tip + along * 0.013), 0.0022, INK, segs=8)  # the cut end, dark with ink
        out += [top, hips, lap, cape, band(z, rx, ry, cx, cy, 0.035, 0.016, LEATHER), hat, seat, board, scroll, pen, nib] + rolls
    if kind in ("robe", "tunic"):  # a sleeveless linen tunic hung from the shoulders: to the ankle, or to the knee and belted
        hem = ankle + 0.08 if kind == "robe" else knee - 0.03
        shoulder = neck - 0.045
        rings = []
        for z, rx, ry, cx, cy in densify(sections(co, trunk, hem, shoulder, 12)):
            d = max(0.0, (hip - z) / (hip - hem))  # the skirt flares below the hips
            rings.append((z, rx * 1.03 + 0.016 + 0.05 * d, ry * 1.05 + 0.02 + 0.06 * d, cx, cy))
        for i in (-1, -2):  # the shoulder edge sits just inside the shoulder joints
            z, rx, ry, cx, cy = rings[i]
            rings[i] = (z, rx * 0.93, ry, cx, cy)
        pins = [-1, -2]
        if kind == "tunic":  # held at the waist by a belt
            wi = min(range(len(rings)), key=lambda i: abs(rings[i][0] - waist))
            z, rx, ry, cx, cy = sections(co, trunk, waist, waist, 1)[0]
            rings[wi] = (rings[wi][0], rx + 0.01, ry + 0.012, cx, cy)
            pins.append(wi)
        tunic = drape(cloth_mesh("tunic", rings, LINEN if kind == "robe" else WOOL, pin=pins), [body], frames=36, bend=0.5)
        out.append(tunic)
    if kind == "tunic":  # Diodorus: a belt, a traveller's broad hat, a staff
        z, rx, ry, cx, cy = sections(co, trunk, waist, waist, 1)[0]
        out.append(band(z, rx, ry, cx, cy, 0.035, 0.016, LEATHER))
        hx, hy = J["head_xy"]
        hat = lathe("hat", [(0.2, top - 0.05), (0.19, top - 0.038), (0.14, top - 0.016), (0.1, top - 0.006), (0.092, top + 0.03), (0.06, top + 0.06), (0.001, top + 0.068)], (hx, hy), STRAW)
        hand = J["hand.R"]
        out += [hat, stick("staff", (hand[0], hand[1], 0.0), (hand[0], hand[1] - 0.02 * fwd, top + 0.1), 0.015, WOODM)]
    return out


# ---------------------------------------------------------------- one figure
SKINS = ["young_asian_male", "middleage_asian_male", "young_caucasian_male", "middleage_caucasian_male", "young_african_male", "middleage_african_male"]
TONES = [(0.62, 0.45, 0.34), (0.62, 0.45, 0.34), (0.58, 0.41, 0.3), (0.58, 0.41, 0.3), (1.0, 0.98, 0.95), (1.0, 0.98, 0.95)]  # light skins pulled to mid brown; dark ones left


def figure(name, kind, pose_name, seed, decimate=None):
    r = random.Random(seed)
    md = TargetService.get_default_macro_info_dict()
    md.update(gender=1.0, age=r.uniform(0.42, 0.62), muscle=r.uniform(0.5, 0.82), weight=r.uniform(0.3, 0.5), height=r.uniform(0.35, 0.6), proportions=r.uniform(0.4, 0.6))
    w = [r.uniform(0.2, 1), r.uniform(0.2, 1), r.uniform(0.2, 1)]
    md["race"] = dict(zip(("asian", "caucasian", "african"), [x / sum(w) for x in w]))
    bm = HumanService.create_human(scale=0.1, macro_detail_dict=md)
    si = seed % len(SKINS)
    HumanService.set_character_skin(str(MH / "skins" / SKINS[si] / f"{SKINS[si]}.mhmat"), bm, skin_type="GAMEENGINE", material_instances=False)
    rig = HumanService.add_builtin_rig(bm, "default")
    HumanService.add_mhclo_asset(str(MH / "eyes" / "low-poly" / "low-poly.mhclo"), bm, asset_type="Eyes", subdiv_levels=0)  # after the rig, so the eyes follow the head
    bpy.context.view_layer.update()
    # Flag arm and scalp vertices as mesh attributes: vertex groups do not survive the bake below.
    arm_groups = {g.index for g in bm.vertex_groups if g.name.startswith(ARM_BONES)}
    scalp_group = bm.vertex_groups["scalp"].index
    arm_flag, scalp_flag = np.zeros(len(bm.data.vertices), np.float32), np.zeros(len(bm.data.vertices), np.float32)
    bone_groups = {g.index for g in bm.vertex_groups if g.name in rig.data.bones}  # not "Left", "body" and the like
    for v in bm.data.vertices:
        best = max((g for g in v.groups if g.group in bone_groups), key=lambda g: g.weight, default=None)
        arm_flag[v.index] = 1.0 if best is not None and best.group in arm_groups else 0.0
        scalp_flag[v.index] = 1.0 if any(g.group == scalp_group and g.weight > 0.5 for g in v.groups) else 0.0
    foot_groups = {g.index: (1.0 if g.name.endswith(".L") else 2.0) for g in bm.vertex_groups if g.name.startswith(("foot", "toe"))}
    foot_flag = np.zeros(len(bm.data.vertices), np.float32)  # 1 = left foot, 2 = right foot
    for v in bm.data.vertices:
        best = max((g for g in v.groups if g.group in bone_groups), key=lambda g: g.weight, default=None)
        if best is not None and best.group in foot_groups:
            foot_flag[v.index] = foot_groups[best.group]
    hand_groups = {g.index for g in bm.vertex_groups if g.name.startswith(("wrist", "finger", "metacarpal"))}
    hand_flag = np.zeros(len(bm.data.vertices), np.float32)
    for v in bm.data.vertices:
        best = max((g for g in v.groups if g.group in bone_groups), key=lambda g: g.weight, default=None)
        hand_flag[v.index] = 1.0 if best is not None and best.group in hand_groups else 0.0
    bm.data.attributes.new("is_hand", "FLOAT", "POINT").data.foreach_set("value", hand_flag)
    bm.data.attributes.new("is_foot", "FLOAT", "POINT").data.foreach_set("value", foot_flag)
    bm.data.attributes.new("is_arm", "FLOAT", "POINT").data.foreach_set("value", arm_flag)
    bm.data.attributes.new("is_scalp", "FLOAT", "POINT").data.foreach_set("value", scalp_flag)
    foot = rig.pose.bones["foot.L"]
    fwd = 1.0 if (foot.tail - foot.head).y > 0 else -1.0
    pose(rig, pose_name, fwd)

    # Bake every part (body, eyes, hair) to a plain mesh in its posed shape.
    parts = [bm] + [o for o in bpy.data.objects if o.type == "MESH" and o is not bm and (o.parent is rig or o.parent is bm)]
    dg = bpy.context.evaluated_depsgraph_get()
    baked = []
    for o in parts:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        me.transform(o.matrix_world)
        b = bpy.data.objects.new(o.name + "_baked", me)
        scene.collection.objects.link(b)
        baked.append(b)
    body = baked[0]
    if decimate is None:  # figures seen close get a finer body: smoother skin, a cleaner hairline
        body.modifiers.new("fine", "SUBSURF").levels = 1
        dg = bpy.context.evaluated_depsgraph_get()
        fine = bpy.data.meshes.new_from_object(body.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        body.modifiers.clear()
        body.data = fine
    co = np.empty(len(body.data.vertices) * 3, np.float32)
    body.data.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    # Which vertices are arms: clothes are fitted to the legs and trunk, not to hands hanging beside the hips.
    flag = np.empty(len(co), np.float32)
    body.data.attributes["is_arm"].data.foreach_get("value", flag)
    is_arm = flag > 0.5
    body.data.attributes["is_scalp"].data.foreach_get("value", flag)
    scalp = set(np.nonzero(flag > 0.5)[0].tolist())
    mw = rig.matrix_world

    def head_of(bone):
        return mw @ rig.pose.bones[bone].head

    J = {"hip": head_of("upperleg01.L").z, "knee": min(head_of("lowerleg01.L").z, head_of("lowerleg01.R").z), "ankle": max(head_of("foot.L").z, head_of("foot.R").z), "neck": head_of("neck01").z, "top": float(co[:, 2].max()), "head_xy": tuple((mw @ rig.pose.bones["head"].tail)[:2]), "hand.R": tuple(mw @ rig.pose.bones["wrist.R"].tail)}
    if pose_name == "write":  # where the pen meets the page, and the way it leans
        # The page lies just under his hands, tilted from side to side to meet both: they rest on it
        # and never sink in.
        body.data.attributes["is_hand"].data.foreach_get("value", flag)
        hands = co[flag > 0.5]
        wr, wl = (np.array(mw @ rig.pose.bones[f"wrist.{sd}"].head) for sd in "RL")
        right = np.linalg.norm(hands - wr, axis=1) < np.linalg.norm(hands - wl, axis=1)
        lo_r, lo_l = hands[right][hands[right][:, 2].argmin()], hands[~right][hands[~right][:, 2].argmin()]
        slope = float(np.clip((lo_l[2] - lo_r[2]) / (lo_l[0] - lo_r[0]), -0.25, 0.25))
        level = float((hands[:, 2] - slope * (hands[:, 0] - lo_r[0])).min()) - 0.002  # the page's height at x = lo_r[0]
        J["page"] = (float(lo_r[0]), level, slope)
        # The pen: pinched between thumb and forefinger, its shaft lying back over the forefinger's knuckle.
        thumb, index = mw @ rig.pose.bones["finger1-3.R"].tail, mw @ rig.pose.bones["finger2-3.R"].tail
        pinch_at = index + (thumb - index).normalized() * 0.009
        back = (mw @ rig.pose.bones["finger2-1.R"].head + Vector((0, 0, 0.022)) - pinch_at).normalized()
        if back.z < 0.5:  # never flatter than a pen can write at
            back = Vector((back.x, back.y, 0.0)).normalized() * math.sqrt(0.75) + Vector((0, 0, 0.5))
        reach = (pinch_at.z - (level + slope * (pinch_at.x - lo_r[0]))) / (back.z - slope * back.x)
        print("DIAG pinch", tuple(round(c, 3) for c in pinch_at), "thumb gap", round((thumb - index).length, 3), "back", tuple(round(c, 2) for c in back), "level", round(level, 3), "slope", round(slope, 3), "reach", round(reach, 3), "low R/L", lo_r.round(3), lo_l.round(3))
        J["pen_tip"] = tuple(pinch_at - back * reach)
        J["pen_grip"] = tuple(pinch_at + back * 0.1)
        J["knee_fwd"] = float(min((mw @ rig.pose.bones[f"lowerleg01.{sd}"].head).y * fwd for sd in "LR"))
        hi = int(np.argmax(co[:, 2]))
        J["head_top_xy"] = (float(co[hi, 0]), float(co[hi, 1]))
    if pose_name == "row":  # seated: the kilt covers the lap
        J["knee"] = J["hip"] - 0.16
    garments = dress(kind, body, co, ~is_arm, np.ones(len(co), bool), J, fwd)
    if kind in ("tunic", "writer"):  # a traveller on the road wears sandals
        body.data.attributes["is_foot"].data.foreach_get("value", flag)
        garments += sandals(body, flag.copy())
    # Cropped dark hair for figures without a hair mesh: the scalp takes a hair material.
    for m in body.data.materials:
        if m:
            tint_skin(m, TONES[si])
    if True:  # cropped dark hair: the scalp takes a hair material
        body.data.materials.append(HAIR)
        for poly in body.data.polygons:
            if all(v in scalp for v in poly.vertices):
                poly.material_index = len(body.data.materials) - 1
    # One object, feet on the ground at the origin, facing +y.
    dg = bpy.context.evaluated_depsgraph_get()
    final = []
    for g in garments:  # apply each garment's thickness
        gm = bpy.data.meshes.new_from_object(g.evaluated_get(dg))
        gob = bpy.data.objects.new("g", gm)
        scene.collection.objects.link(gob)
        final.append(gob)
    bpy.ops.object.select_all(action="DESELECT")
    for o in baked + final:
        o.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    body.name = body.data.name = name
    body.vertex_groups.clear()
    zmin = min(v.co.z for v in body.data.vertices)
    cx = sum(head_of(b).x for b in ("upperleg01.L", "upperleg01.R")) / 2
    cy = sum(head_of(b).y for b in ("upperleg01.L", "upperleg01.R")) / 2
    turnround = Matrix.Rotation(math.pi, 4, "Z") if fwd < 0 else Matrix.Identity(4)
    body.data.transform(turnround @ Matrix.Translation((-cx, -cy, -zmin)))
    for poly in body.data.polygons:
        poly.use_smooth = True
    if decimate:
        d = body.modifiers.new("lite", "DECIMATE")
        d.ratio = decimate
        bpy.context.view_layer.objects.active = body
        bpy.ops.object.modifier_apply(modifier="lite")
    for o in list(bpy.data.objects):  # drop the rig and the unbaked parts
        if o is not body and o.name not in KEEP:
            bpy.data.objects.remove(o, do_unlink=True)
    KEEP.add(body.name)
    print(f"PERSON {name}: {len(body.data.polygons)} faces, {body.dimensions.z:.2f} m, pose {pose_name}")
    return body


KEEP = set()
WORKER_POSES = ["stand", "hips", "shade", "carry", "walk", "haul", "talk", "stand"]
SPECS = [(f"worker{i}", "kilt", WORKER_POSES[i], 10 + i, 0.22) for i in range(8)]
SPECS.append(("rower", "rower", "row", 30, 0.3))
SPECS.append(("scale_person", "kilt", "lookup", 41, None))  # a man in a kilt, like the workers: a lone robed figure read as Cleopatra
SPECS.append(("traveller", "tunic", "staff", 52, None))
SPECS.append(("writer", "writer", "write", 52, None))  # the same man, seated and writing: for the close shot
kept = {}
if args.only:
    with bpy.data.libraries.load(str(OUT)) as (src, dst):
        dst.objects = [n for n in src.objects if n not in args.only]
    for o in dst.objects:
        scene.collection.objects.link(o)
        KEEP.add(o.name)
        kept[o.name] = o
people = [kept[n] if n in kept else figure(n, kind, pose_name, seed, decimate=dec) for n, kind, pose_name, seed, dec in SPECS]

coll = bpy.data.collections.new("people")
scene.collection.children.link(coll)
for i, o in enumerate(people):
    scene.collection.objects.unlink(o)
    coll.objects.link(o)
    o.location = (i * 1.1, 0, 0)
bpy.ops.file.pack_all()
bpy.ops.outliner.orphans_purge(do_recursive=True)
if args.only:  # the file is open as a library: write beside it, then swap
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT.with_suffix(".new.blend")))
    OUT.with_suffix(".new.blend").replace(OUT)
else:
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT))
print("SAVED", OUT)

if args.sheet:  # every figure, front and back, in daylight
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    scene.world = world
    sky = world.node_tree.nodes.new("ShaderNodeTexSky")
    for kind in ("MULTIPLE_SCATTERING", "SINGLE_SCATTERING", "NISHITA"):
        try:
            sky.sky_type = kind
            break
        except TypeError:
            continue
    sky.sun_elevation = math.radians(35)
    sky.sun_rotation = math.radians(200)
    world.node_tree.links.new(sky.outputs["Color"], world.node_tree.nodes["Background"].inputs["Color"])
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.05
    bpy.ops.mesh.primitive_plane_add(size=60, location=(5, 0, 0))
    bpy.context.object.data.materials.append(plain("floor", (0.6, 0.47, 0.3), 0.9))
    for o in list(people):  # a second row seen from behind
        b = o.copy()
        coll.objects.link(b)
        b.location = (o.location.x, 3.2, 0)
        b.rotation_euler.z = math.pi
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.data.lens = 50
    cam.location = (5.5, -17.0, 3.0)
    cam.rotation_euler = (math.radians(84), 0, 0)
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.refresh_devices()
    for d in prefs.devices:
        d.use = d.type == "METAL"
    scene.cycles.device = "GPU"
    scene.cycles.samples = 48
    scene.cycles.transparent_max_bounces = 16
    scene.render.resolution_x, scene.render.resolution_y = 2600, 900
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Punchy"
    except TypeError:
        pass
    scene.render.filepath = args.sheet
    bpy.ops.render.render(write_still=True)
