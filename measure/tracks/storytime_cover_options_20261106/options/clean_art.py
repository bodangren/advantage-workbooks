"""Removes made-up text marks from two mockup pictures (track storytime_cover_options_20261106).

Usage: python3 -I -B clean_art.py <hand-off folder>

The image model drew made-up text into two pictures whose 3 attempts are all used. The script
writes a cleaned copy of each (`<name>-clean.jpg`); the source files stay unchanged.

- A-reader-a2.jpg: the words "TRAIN DGGY GK" in the sky at the top right. The box is filled column
  by column with a straight blend from the sky row above the box to the sky row below it, and only
  the box is blurred. The signature at the bottom right is out of view in the mockup (zoom 1.07
  from the top left, selection.json).
- A-front-a1.jpg: white made-up letters on Nan's orange T-shirt. Each light pixel of the box is
  filled with the colour of the nearest shirt pixel, and the small white star of the cast sheet is
  drawn on the chest.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter


def sky_blend(im, box):
    px = im.load()
    left, top, right, bottom = box
    for x in range(left, right):
        a, b = px[x, top - 1], px[x, bottom]
        for y in range(top, bottom):
            t = (y - top + 1) / (bottom - top + 1)
            px[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))
    patch = im.crop((left - 8, top - 8, right, bottom + 8)).filter(ImageFilter.GaussianBlur(4))
    im.paste(patch.crop((8, 8, patch.width, patch.height - 8)), (left, top))


def nearest_fill(im, box, grow=2):
    """Fills each light letter pixel of the box (and `grow` pixels around it) with the colour of the
    nearest shirt pixel (a breadth-first search from the shirt pixels). The shirt has two flat tones,
    so the nearest colour keeps both tones crisp, where an average makes a smudge."""
    from collections import deque
    px = im.load()
    left, top, right, bottom = box
    inside = lambda x, y: left <= x < right and top <= y < bottom
    light = {(x, y) for x in range(left, right) for y in range(top, bottom)
             if px[x, y][1] > 150 and px[x, y][2] > 110 and abs(px[x, y][0] - px[x, y][1]) < 60}
    mask = set(light)
    for x, y in light:
        mask.update((x + dx, y + dy) for dx in range(-grow, grow + 1) for dy in range(-grow, grow + 1) if inside(x + dx, y + dy))
    colour, queue = {}, deque()
    for x, y in mask:
        for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if q not in mask and inside(*q) and q not in colour:
                colour[q] = px[q]
                queue.append(q)
    while queue:
        x, y = queue.popleft()
        for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if q in mask and q not in colour:
                colour[q] = colour[(x, y)]
                queue.append(q)
    for q in mask:
        px[q] = colour.get(q, px[q])
    patch = im.crop((left - 2, top - 2, right + 2, bottom + 2)).filter(ImageFilter.GaussianBlur(1.2))
    im.paste(patch.crop((2, 2, patch.width - 2, patch.height - 2)), (left, top))


def star(im, cx, cy, r):
    scale = 4
    size = int(r * 2.4 * scale)
    layer = Image.new('L', (size, size), 0)
    import math
    pts = []
    for k in range(10):
        rad = r * scale if k % 2 == 0 else r * scale * 0.45
        ang = -math.pi / 2 + k * math.pi / 5
        pts.append((size / 2 + rad * math.cos(ang), size / 2 + rad * math.sin(ang)))
    ImageDraw.Draw(layer).polygon(pts, fill=255)
    layer = layer.resize((size // scale, size // scale), Image.LANCZOS)
    white = Image.new('RGB', layer.size, (250, 250, 245))
    im.paste(white, (int(cx - layer.width / 2), int(cy - layer.height / 2)), layer)


JOBS = [
    ('A-reader-a2.jpg', lambda im: sky_blend(im, (1660, 20, 2048, 100))),
    ('A-front-a1.jpg', lambda im: (nearest_fill(im, (668, 1150, 778, 1300)), star(im, 640, 1185, 30))),
]


def main(argv):
    art = os.path.join(os.path.abspath(argv[0]), 'art')
    for source, job in JOBS:
        im = Image.open(os.path.join(art, source)).convert('RGB')
        job(im)
        target = os.path.join(art, source.replace('.jpg', '-clean.jpg'))
        im.save(target, quality=95)
        print(target)


if __name__ == '__main__':
    main(sys.argv[1:])
