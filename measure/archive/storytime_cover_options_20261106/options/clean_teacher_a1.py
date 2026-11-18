"""Local fix of Q-teacher-a1.jpg (track storytime_cover_options_20261106, task 2.8, FR-8.5).

Usage: python3 -I clean_teacher_a1.py

FR-8.5 allows a local fix only for made-up letters. The image model drew made-up marks in two
places of the best attempt. The script writes a cleaned copy `Q-teacher-a1-clean2.jpg` and leaves
the source file unchanged.

- Box A: the made-up white marks on the boy's chest between his two white stripes. The stripes
  are horizontal, so each pixel row of the box takes a linear blend between the pixel of the same
  row just left of the box (x = left - 2) and just right of the box (x = right + 2). That carries
  both stripes straight through the box and keeps the red shading. Before the fill, the script
  checks that the stripe rows outside the box agree on both sides; a row that is white on one
  side and red on the other stops the script.
- Box B: the letter-like marks on the book spine. Each dark mark pixel is filled with the colour
  of the nearest page pixel.

The script compares the edited pixels with the pixels of the source at load time and counts the
changed pixels inside and outside the two boxes. The count outside the boxes must be 0.
"""
import os
import sys
from collections import deque

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.expanduser('~/Desktop/print-ready/storytime/covers-quest-art-v1')
SOURCE = os.path.join(ART, 'Q-teacher-a1.jpg')
TARGET = os.path.join(ART, 'Q-teacher-a1-clean2.jpg')

BOX_A = (930, 1555, 995, 1635)   # left, top, right, bottom: the boy's chest
BOX_B = (688, 1106, 712, 1245)   # the book spine strip
CHECK_TOP = 1550
CHECK_BOTTOM = 1645


def light_pixel(colour):
    return min(colour) >= 150 and max(colour) - min(colour) < 70


def dark_pixel(colour):
    return sum(colour) / 3 < 150


def stripe_rows_agree(px, box):
    """True when every row of the box is white on both sides or red on both sides."""
    left, top, right, bottom = box
    for y in range(CHECK_TOP, CHECK_BOTTOM):
        if light_pixel(px[left - 2, y]) != light_pixel(px[right + 2, y]):
            return False, y
    return True, None


def row_blend(im, box):
    """Fill each row of the box with a linear blend of the pixels just outside its two sides."""
    px = im.load()
    left, top, right, bottom = box
    for y in range(top, bottom):
        a = px[left - 2, y]
        b = px[right + 2, y]
        span = (right + 2) - (left - 2)
        for x in range(left, right):
            t = (x - (left - 2)) / span
            px[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))


def dark_mask(px, box):
    left, top, right, bottom = box
    return {(x, y) for x in range(left, right) for y in range(top, bottom)
            if dark_pixel(px[x, y])}


def nearest_fill(im, box, mask, grow=1, blur=0.0):
    """Fill the mask from the nearest pixel outside it, in a breadth-first search."""
    px = im.load()
    left, top, right, bottom = box
    inside = lambda x, y: left <= x < right and top <= y < bottom
    grown = set(mask)
    for x, y in mask:
        grown.update((x + dx, y + dy) for dx in range(-grow, grow + 1)
                     for dy in range(-grow, grow + 1) if inside(x + dx, y + dy))
    colour, queue = {}, deque()
    for x, y in grown:
        for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if q not in grown and inside(*q) and q not in colour:
                colour[q] = px[q]
                queue.append(q)
    while queue:
        x, y = queue.popleft()
        for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if q in grown and q not in colour:
                colour[q] = colour[(x, y)]
                queue.append(q)
    for q in grown:
        px[q] = colour.get(q, px[q])
    if blur:
        from PIL import ImageFilter
        patch = im.crop(box).filter(ImageFilter.GaussianBlur(blur))
        keep = Image.new('L', (right - left, bottom - top), 0)
        keep_px = keep.load()
        for (x, y) in grown:
            keep_px[x - left, y - top] = 255
        im.paste(patch, (left, top), keep)
    return grown


def inside(box, x, y):
    left, top, right, bottom = box
    return left <= x < right and top <= y < bottom


def main():
    if os.path.exists(TARGET):
        sys.exit(f'the output exists, and this script never overwrites: {TARGET}')
    im = Image.open(SOURCE).convert('RGB')
    raw = im.copy()
    px = im.load()

    agree, bad_row = stripe_rows_agree(px, BOX_A)
    if not agree:
        sys.exit(f'box A {BOX_A}: row {bad_row} is white on one side and red on the other; '
                 'widen the box until both sides match')

    row_blend(im, BOX_A)
    mask_b = dark_mask(px, BOX_B)
    filled_b = nearest_fill(im, BOX_B, mask_b, grow=1, blur=0.8)

    after = im.load()
    before = raw.load()
    changed_a = changed_b = changed_out = 0
    for y in range(im.height):
        for x in range(im.width):
            if after[x, y] == before[x, y]:
                continue
            if inside(BOX_A, x, y):
                changed_a += 1
            elif inside(BOX_B, x, y):
                changed_b += 1
            else:
                changed_out += 1
    im.save(TARGET, quality=95)
    print(f'source {SOURCE}')
    print(f'target {TARGET}')
    print(f'box A {BOX_A}: the stripe rows agree on both sides; the row blend changed '
          f'{changed_a} pixels')
    print(f'box B {BOX_B}: mask {len(mask_b)} pixels, filled {len(filled_b)} pixels, '
          f'changed {changed_b} pixels')
    print(f'changed pixels outside the two boxes: {changed_out}')
    if changed_out:
        sys.exit(1)


if __name__ == '__main__':
    main()
