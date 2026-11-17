"""Render a short end to end and tile one frame per second into a contact sheet to review.

Run (from the project root):
  npm run sheet -- age-of-sunlight           # every look and format of that short
  npm run sheet -- age-of-sunlight --every 0.5

Writes out/review/<composition>.jpg, one per composition whose id starts with "<slug>-". Rendering
every frame (at quarter scale) is deliberate: it is also the cheapest proof that no frame throws.

Review each sheet against GUARDRAILS.md A6 and this list, and fix before showing it for approval:
  - no text clipped by the frame edge, in 9:16 and 16:9 alike
  - no label, tag or number overlapping another, the subject, or the caption block
  - every on-screen number appears while the line that says it is spoken, and matches it
  - the last tile is a deliberate closing frame, not a cut mid-motion
shortcut: sampled at a fixed interval, so a glitch shorter than --every can slip between tiles;
render stills at the exact beat frames if that ever bites.
"""
import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

SCALE = 0.25
OUT = Path("out/review")


def compositions(slug):
    """(id, fps, frames) for each composition of this short, from `remotion compositions`."""
    listing = subprocess.run(["npx", "remotion", "compositions"], capture_output=True, text=True, check=True).stdout
    rows = re.findall(r"^(\S+)\s+(\d+)\s+\d+x\d+\s+(\d+)", listing, re.M)
    return [(c, int(fps), int(n)) for c, fps, n in rows if c.startswith(f"{slug}-")]


def tile(frames, labels, cols):
    w, h = frames[0].size
    pad = 4
    rows = -(-len(frames) // cols)
    sheet = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + pad) + pad), "white")
    draw = ImageDraw.Draw(sheet)
    for i, (im, label) in enumerate(zip(frames, labels)):
        x, y = pad + (i % cols) * (w + pad), pad + (i // cols) * (h + pad)
        sheet.paste(im, (x, y))
        draw.rectangle([x, y, x + 34, y + 14], fill="black")
        draw.text((x + 3, y + 2), label, fill="white")
    return sheet


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("slug")
    p.add_argument("--every", type=float, default=1.0, help="seconds between tiles (default 1)")
    args = p.parse_args()

    comps = compositions(args.slug)
    if not comps:
        sys.exit(f"No composition starts with {args.slug}-. Is the short listed in src/shorts/index.ts?")

    OUT.mkdir(parents=True, exist_ok=True)
    for comp, fps, n in comps:
        tmp = OUT / f"{comp}_frames"  # Remotion refuses a sequence directory whose name has a dot
        shutil.rmtree(tmp, ignore_errors=True)
        subprocess.run(
            ["npx", "remotion", "render", comp, str(tmp), "--sequence", "--image-format=jpeg",
             f"--scale={SCALE}", "--log=error"],
            check=True,
        )
        files = sorted(tmp.glob("element-*.jpeg"))  # zero-padded to the width of the frame count
        if len(files) != n:
            sys.exit(f"{comp}: render produced {len(files)} frames, expected {n} (in {tmp}).")
        step = max(1, round(fps * args.every))
        picks = sorted({*range(0, n, step), n - 1})
        frames = [Image.open(files[f]) for f in picks]
        portrait = frames[0].size[1] > frames[0].size[0]
        sheet = tile(frames, [f"{f / fps:.1f}s" for f in picks], cols=10 if portrait else 5)
        sheet.save(OUT / f"{comp}.jpg", quality=88)
        shutil.rmtree(tmp)
        print(f"{OUT / comp}.jpg: {len(picks)} tiles, {n} frames rendered")


if __name__ == "__main__":
    main()
