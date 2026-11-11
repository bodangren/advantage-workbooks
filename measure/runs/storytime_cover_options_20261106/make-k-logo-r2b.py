#!/usr/bin/env python3
"""Writes the gray copy of the horizontal Storytime Advantage logo (readers r2b round, 2026-11-11).

The script reads `content/storytime/covers/logos/storytime-advantage-horizontal.svg` and writes
`content/storytime/covers/logos/storytime-advantage-horizontal-k.svg`. Every color of the fill,
stroke, stop-color, color, and flood-color attributes, and every color token of a style value,
becomes the gray of the same luminance: Y = 0.2126 R + 0.7152 G + 0.0722 B, rounded to the nearest
integer. Every other byte stays. The file is create-only: the script refuses an existing target.

It prints the count of changed colors and the 2 SHA-256 values.

Usage: python3 -I -B make-k-logo-r2b.py
"""

import hashlib
import re
import sys

LOGOS = '/home/daniebo/Desktop/Workbooks/content/storytime/covers/logos'
SOURCE = f'{LOGOS}/storytime-advantage-horizontal.svg'
TARGET = f'{LOGOS}/storytime-advantage-horizontal-k.svg'

ATTRIBUTES = ('fill', 'stroke', 'stop-color', 'color', 'flood-color', 'style')
ATTRIBUTE = re.compile(r'\b(' + '|'.join(ATTRIBUTES) + r')="([^"]*)"')
HEX6 = re.compile(r'#([0-9a-fA-F]{6})\b')
HEX3 = re.compile(r'#([0-9a-fA-F]{3})\b')
RGB = re.compile(r'rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)', re.I)
NAME = re.compile(
    r'\b(black|white|silver|gray|grey|red|maroon|yellow|olive|lime|green|teal|aqua|blue|navy|'
    r'fuchsia|purple|orange)\b',
    re.I,
)
NAMES = {
    'black': (0, 0, 0),
    'white': (255, 255, 255),
    'silver': (192, 192, 192),
    'gray': (128, 128, 128),
    'grey': (128, 128, 128),
    'red': (255, 0, 0),
    'maroon': (128, 0, 0),
    'yellow': (255, 255, 0),
    'olive': (128, 128, 0),
    'lime': (0, 255, 0),
    'green': (0, 128, 0),
    'teal': (0, 128, 128),
    'aqua': (0, 255, 255),
    'blue': (0, 0, 255),
    'navy': (0, 0, 128),
    'fuchsia': (255, 0, 255),
    'purple': (128, 0, 128),
    'orange': (255, 165, 0),
}


class Counter:
    """Counts the changed colors."""

    def __init__(self):
        """Starts the count at zero."""
        self.count = 0

    def gray(self, red, green, blue):
        """Returns the gray hex of one color and raises the count."""
        luminance = round(0.2126 * red + 0.7152 * green + 0.0722 * blue)
        luminance = max(0, min(255, luminance))
        self.count += 1
        return f'#{luminance:02x}{luminance:02x}{luminance:02x}'


def rewrite_value(value, counter):
    """Rewrites every color token of one attribute value."""
    text = HEX3.sub(
        lambda m: counter.gray(
            int(m.group(1)[0] * 2, 16), int(m.group(1)[1] * 2, 16), int(m.group(1)[2] * 2, 16)
        ),
        value,
    )
    text = HEX6.sub(
        lambda m: counter.gray(int(m.group(1)[0:2], 16), int(m.group(1)[2:4], 16), int(m.group(1)[4:6], 16)),
        text,
    )
    text = RGB.sub(
        lambda m: counter.gray(int(m.group(1)), int(m.group(2)), int(m.group(3))),
        text,
    )

    def name(match):
        word = match.group(1).lower()
        if word not in NAMES:
            return match.group(0)
        red, green, blue = NAMES[word]
        return counter.gray(red, green, blue)

    return NAME.sub(name, text)


def main():
    """Writes the gray logo and prints its facts."""
    with open(SOURCE, encoding='utf-8') as handle:
        source = handle.read()
    counter = Counter()
    target = ATTRIBUTE.sub(lambda m: f'{m.group(1)}="{rewrite_value(m.group(2), counter)}"', source)
    try:
        with open(TARGET, 'x', encoding='utf-8') as handle:
            handle.write(target)
    except FileExistsError:
        print(f'TARGET_EXISTS {TARGET}')
        return 1
    source_sha = hashlib.sha256(source.encode('utf-8')).hexdigest()
    target_sha = hashlib.sha256(target.encode('utf-8')).hexdigest()
    print(f'COLORS_CHANGED={counter.count}')
    print(f'SOURCE_SHA256={source_sha}')
    print(f'TARGET_SHA256={target_sha}')
    print(f'BYTES_SOURCE={len(source.encode("utf-8"))} BYTES_TARGET={len(target.encode("utf-8"))}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
