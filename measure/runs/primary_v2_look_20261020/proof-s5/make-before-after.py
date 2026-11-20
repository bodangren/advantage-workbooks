"""The S5 before/after page crops (track primary_v2_look_20261020, Phase S5, round 9).

It rasterizes one page of a proof PDF at 120 dpi and writes the crop as a PNG. The
crop is a millimetre box of the page: `--box x0,y0,x1,y1` from the top-left corner.
The script prints the file name and the pixel size only. It prints no page text and
it does not open the page image.

Usage: python3 -I -B make-before-after.py --pdf <file.pdf> --page <n> --box <x0,y0,x1,y1>
         --out <file.png>
"""

import argparse
import os
import subprocess
import sys

from PIL import Image

DPI = 120
MM = DPI / 25.4


def main(argv):
    """Writes one page crop."""
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', required=True)
    parser.add_argument('--page', required=True)
    parser.add_argument('--box', default='')
    parser.add_argument('--out', required=True)
    args = parser.parse_args(argv)
    prefix = '/tmp/opencode/before-after-page'
    subprocess.run(
        ['pdftoppm', '-r', str(DPI), '-f', args.page, '-l', args.page, '-png', '-singlefile', args.pdf, prefix],
        check=True,
    )
    image = Image.open(prefix + '.png').convert('RGB')
    if args.box:
        x0, y0, x1, y1 = (float(value) for value in args.box.split(','))
        image = image.crop((int(x0 * MM), int(y0 * MM), int(x1 * MM), int(y1 * MM)))
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    image.save(args.out, optimize=True)
    os.remove(prefix + '.png')
    print(f'crop {os.path.basename(args.out)} page {args.page} box {args.box or "full"} pixels {image.width}x{image.height}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
