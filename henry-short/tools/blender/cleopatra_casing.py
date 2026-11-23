"""The 3D casing shot for cleopatra-pyramid: the stepped core, then the smooth casing wiped on.

Not part of `npm run setup`: Blender's `bpy` wheel needs its own Python (3.13 for bpy 5.3).
  uv venv --python 3.13 /tmp/bl && uv pip install --python /tmp/bl/bin/python bpy
  /tmp/bl/bin/python tools/blender/cleopatra_casing.py --out /tmp/casing --frames 112
  ffmpeg -framerate 30 -i /tmp/casing/%04d.png -c:v libx264 -crf 16 -pix_fmt yuv420p public/3d/cleopatra-casing.mp4

Everything is procedural (no downloaded models or textures), so the frames are own work (D1).
What it may show is set by script/cleopatra-pyramid.txt SOURCES 2 (A6): smooth, polished, fitted
stone; not "white" (the casing is a pale limestone tone); no stated height; a small flat top
(Diodorus 1.63.3). The casing appears as a top-down wipe, a reveal and not a building sequence.
shortcut: 64 courses of jittered blocks stand in for the real ~200; raise COURSES if a close-up
ever needs the true count.
"""
import argparse
import math
import random
import sys

import bpy
from mathutils import Vector, noise

p = argparse.ArgumentParser()
p.add_argument("--out", required=True)
p.add_argument("--frames", type=int, default=112)
p.add_argument("--only", type=int, help="render just this frame (a still for checking)")
p.add_argument("--width", type=int, default=1080)
p.add_argument("--samples", type=int, default=48)
p.add_argument("--sun", type=float, default=-35)
args = p.parse_args(sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else None)

SUN = args.sun
BASE, HEIGHT, TOP, COURSES = 230.0, 146.0, 3.0, 64  # proportions only; nothing on screen states them
WIPE = (14, 78)  # frames over which the casing is revealed

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
random.seed(7)


def material(name, build):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    build(nt, bsdf)
    return m


def noise_colour(nt, bsdf, a, b, scale, bump, rough):
    tex = nt.nodes.new("ShaderNodeTexNoise")
    nt.links.new(nt.nodes.new("ShaderNodeTexCoord").outputs["Object"], tex.inputs["Vector"])  # scale is per scene unit
    tex.inputs["Scale"].default_value = scale
    tex.inputs["Detail"].default_value = 8
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*a, 1)
    ramp.color_ramp.elements[1].color = (*b, 1)
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[1].position = 0.35, 0.65  # noise sits mid-range
    nt.links.new(tex.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bmp = nt.nodes.new("ShaderNodeBump")
    bmp.inputs["Strength"].default_value = bump
    nt.links.new(tex.outputs["Fac"], bmp.inputs["Height"])
    nt.links.new(bmp.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = rough


core_mat = material("core", lambda nt, b: noise_colour(nt, b, (0.36, 0.25, 0.14), (0.62, 0.47, 0.28), 0.3, 0.8, 0.92))
sand_mat = material("sand", lambda nt, b: noise_colour(nt, b, (0.50, 0.34, 0.17), (0.76, 0.58, 0.34), 0.012, 1.0, 0.95))


def casing_nodes(nt, bsdf):
    # Polished, fitted stone: smooth and glossy, with faint joints. A limestone tone, not white.
    # No clear coat: it mirrors the blue sky and turns the stone grey-white.
    noise_colour(nt, bsdf, (0.60, 0.43, 0.22), (0.70, 0.52, 0.29), 0.02, 0.02, 0.32)
    # Faint level joints, so it reads as fitted blocks and not one sheet.
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.bands_direction = "Z"
    wave.inputs["Scale"].default_value = 0.42
    nt.links.new(nt.nodes.new("ShaderNodeTexCoord").outputs["Object"], wave.inputs["Vector"])
    joints = nt.nodes.new("ShaderNodeBump")
    joints.inputs["Strength"].default_value = 0.12
    nt.links.new(wave.outputs["Fac"], joints.inputs["Height"])
    nt.links.new(bsdf.inputs["Normal"].links[0].from_socket, joints.inputs["Normal"])
    nt.links.new(joints.outputs["Normal"], bsdf.inputs["Normal"])


casing_mat = material("casing", casing_nodes)


def box(name, sx, sy, sz, z, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, z + sz / 2))
    o = bpy.context.object
    o.name = name
    o.scale = (sx, sy, sz)
    o.data.materials.append(mat)
    return o


# The stepped core as it stands today: every course a ring of separate blocks, each a little
# different in width, height and set-back, around a plain solid that fills the middle.
def block_mesh(name, boxes, mat):
    verts, faces = [], []
    for x0, y0, z0, x1, y1, z1 in boxes:
        n = len(verts)
        verts += [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
        faces += [(n, n + 1, n + 5, n + 4), (n + 1, n + 2, n + 6, n + 5), (n + 2, n + 3, n + 7, n + 6), (n + 3, n, n + 4, n + 7), (n + 4, n + 5, n + 6, n + 7), (n + 3, n + 2, n + 1, n)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(o)
    mesh.materials.append(mat)
    return o


h = HEIGHT / COURSES
run = (BASE - TOP) / 2 / COURSES  # how far each course steps in
boxes = []
for i in range(COURSES):
    half = (BASE - (BASE - TOP) * (i / COURSES)) / 2
    z0 = i * h
    boxes.append((-half + run * 1.5, -half + run * 1.5, z0, half - run * 1.5, half - run * 1.5, z0 + h * 0.98))  # the fill
    for side in range(4):
        u = -half
        while u < half:
            w = min(h * random.uniform(1.1, 2.3), half - u)
            out = half - random.uniform(0.0, run * 0.45)
            top = z0 + h * random.uniform(0.82, 1.0)
            lo, hi = out - run * 2.2, out
            blk = (u, -hi, z0, u + w - 0.06, -lo, top) if side == 0 else (u, lo, z0, u + w - 0.06, hi, top) if side == 1 else (-hi, u, z0, -lo, u + w - 0.06, top) if side == 2 else (lo, u, z0, hi, u + w - 0.06, top)
            boxes.append(blk)
            u += w
block_mesh("core", boxes, core_mat)


def frustum(name, base, top, height, mat):
    b, t = base / 2, top / 2
    verts = [(-b, -b, 0), (b, -b, 0), (b, b, 0), (-b, b, 0), (-t, -t, height), (t, -t, height), (t, t, height), (-t, t, height)]
    faces = [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7), (3, 2, 1, 0)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(o)
    mesh.materials.append(mat)
    return o


# The casing: one smooth truncated pyramid just outside the core, cut by a block that drops away.
casing = frustum("casing", BASE + 5, TOP + 1.5, HEIGHT + 1.2, casing_mat)
cutter = box("cutter", BASE * 2, BASE * 2, HEIGHT * 2, 0, casing_mat)
cutter.hide_render = True
cutter.display_type = "WIRE"
cut = casing.modifiers.new("reveal", "BOOLEAN")
cut.operation = "INTERSECT"
cut.object = cutter
for frame, z in ((WIPE[0], HEIGHT + 2), (WIPE[1], -1.0)):
    cutter.location.z = z + HEIGHT  # the cutter's base sits at z: the casing shows above it
    cutter.keyframe_insert("location", frame=frame)

# Desert floor with low dunes.
bpy.ops.mesh.primitive_grid_add(x_subdivisions=300, y_subdivisions=300, size=6000)
ground = bpy.context.object
ground.data.materials.append(sand_mat)
# Dunes: flat under the pyramid, rising with distance from it.
def ground_z(co):
    far = max(0.0, min(1.0, (co.length - 190) / 500))
    return far * (70 * noise.noise(co / 260) + 16 * noise.noise(co / 60) - 4)


for v in ground.data.vertices:
    v.co.z = ground_z(v.co)
bpy.ops.object.shade_smooth()

# Sun and sky: a low sun, so the right-hand face is in shade as in the photo it follows.
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
sky.sun_elevation = math.radians(28)
sky.sun_rotation = math.radians(SUN)
world.node_tree.links.new(sky.outputs["Color"], world.node_tree.nodes["Background"].inputs["Color"])
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.05  # the sky model is physical: far too bright at 1

# Camera: near the ground off one corner, pushing in a little and drifting sideways.
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.lens = 26
cam.data.clip_end = 20000
aim = bpy.data.objects.new("aim", None)
scene.collection.objects.link(aim)
aim.location = (0, 0, HEIGHT * 0.42)
track = cam.constraints.new("TRACK_TO")
track.target = aim
for frame, (ang, dist, z) in ((0, (-38, 440, 6)), (args.frames, (-58, 350, 10))):  # ends on the sunlit face
    a = math.radians(ang)
    at = Vector((math.sin(a) * dist, -math.cos(a) * dist, 0))
    cam.location = at + Vector((0, 0, max(0.0, ground_z(at)) + z))  # z above the sand it stands on
    cam.keyframe_insert("location", frame=frame)

scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 4
scene.render.resolution_x = args.width
scene.render.resolution_y = args.width * 16 // 9
scene.render.fps = 30
scene.view_settings.view_transform = "Filmic" if "Filmic" in [v.name for v in bpy.types.ColorManagedViewSettings.bl_rna.properties["view_transform"].enum_items] else "AgX"
try:
    scene.view_settings.look = "AgX - Punchy"  # desert daylight, not a flat grade
except TypeError:
    pass
scene.render.image_settings.file_format = "PNG"

for f in [args.only] if args.only is not None else range(args.frames):
    scene.frame_set(f)
    scene.render.filepath = f"{args.out}/{f:04d}.png"
    bpy.ops.render.render(write_still=True)
