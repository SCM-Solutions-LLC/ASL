import sys
from PIL import Image, ImageDraw
src, out, step = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert("RGB"); d = ImageDraw.Draw(im)
for x in range(0, im.width, step):
    d.line([(x, 0), (x, im.height)], fill=(0, 255, 255) if x % (step*2) == 0 else (255, 0, 255), width=1)
    d.text((x + 2, 2), str(x), fill=(255, 255, 0))
for y in range(0, im.height, step):
    d.line([(0, y), (im.width, y)], fill=(0, 255, 255) if y % (step*2) == 0 else (255, 0, 255), width=1)
    d.text((2, y + 2), str(y), fill=(255, 255, 0))
im.save(out)
print(src, im.size)
