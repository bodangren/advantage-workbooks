"""Builds the HTML of the Storytime cover option mockups (track storytime_cover_options_20261106).

Usage: python3 -I -B build.py <hand-off folder>

Writes 15 HTML files to options/mockups/ (3 options x 5 mockups) and two small assets to the
hand-off folder (`assets/line-qr.png`, cut from the approved v3 back, and `approved-text.json`).
All text on a mockup is approved text: the panel fields come from the approved v3 cover PDF, the
Thai contact lines from `BACK_LINES.contact` (dashboard/lib/covers/back-text.ts), and the reader
cover text from the approved week 1 reader cover. The art files come from `selection.json`.
Chrome prints the HTML (render.sh); this script runs no browser.
"""
import hashlib
import html
import json
import os
import re
import subprocess
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
MOCKS = os.path.join(HERE, 'mockups')
FONTS = os.path.join(REPO, 'dashboard', 'assets', 'print-fonts')
LOGO = os.path.join(REPO, 'Teacher guide', 'reading-advantage logo.png')
LINE_ART = os.path.join(REPO, 'content', 'storytime', 'l2', 'print', 'pictures', 'l2-w01-cover-nan-can-nod-line-v1.png')
ICONS = os.path.join(REPO, 'content', 'storytime', 'l2')
APPROVED = os.path.expanduser('~/Desktop/print-ready/storytime/print-v3/l2u1')
BACK_TEXT_TS = os.path.join(REPO, 'dashboard', 'lib', 'covers', 'back-text.ts')

SERIES = 'Storytime Advantage'
LEVEL_LINE = 'Level 2 · Unit 1'
STUDENT = 'Student Book'
TEACHER = 'Teacher Book'
BAND = 'Sprout'
READER = {'title': 'Nan Can Nod', 'band': 'SPROUT', 'week': 'Week 1', 'role': 'Listen and read.', 'icons': ['ear', 'read']}
FIELDS = [('story', 'Story'), ('sounds', 'Sounds'), ('decodable', 'Decodable words'), ('sight', 'Sight words'), ('books', 'Books')]
SIZES = {'a4': (210, 297), 'a3': (420, 297), 'leaf': (198, 148.5)}
BLUE = '#2A77B8'
AMBER = '#FBBF24'


def sha256(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def rel(path):
    return os.path.relpath(path, MOCKS).replace(os.sep, '/')


def esc(text):
    return html.escape(text, quote=True)


# ---------- approved text ----------

def contact_lines():
    """The five Thai contact lines, byte for byte from BACK_LINES.contact."""
    src = open(BACK_TEXT_TS, encoding='utf-8').read()
    body = re.search(r"contact:\s*\[(.*?)\]", src, re.S).group(1)
    lines = re.findall(r"'([^']*)'", body)
    if len(lines) != 5:
        sys.exit(f'BACK_LINES.contact has {len(lines)} lines, not 5')
    return lines


def panel_fields():
    """The five panel fields of the approved v3 back, from the Chrome PDF text (lines joined at spaces)."""
    pdf = os.path.join(APPROVED, 'cover.pdf')
    text = subprocess.run(['pdftotext', '-f', '2', '-l', '2', pdf, '-'], capture_output=True, text=True, check=True).stdout
    lines = [l.strip() for l in text.splitlines()]
    heads = [h for _, h in FIELDS]
    out, current = {}, None
    for line in lines:
        if line in heads:
            current = line
            out[current] = []
        elif line == 'ติดต่อเรา':
            break
        elif current and line:
            out[current].append(line)
    fields = {key: ' '.join(out.get(head, [])) for key, head in FIELDS}
    if not all(fields.values()):
        sys.exit(f'a panel field is empty: {fields}')
    return fields, pdf


def rich(line):
    """`**bold**` as <b>, as `richHtml` in back-text.ts."""
    parts = line.split('**')
    return ''.join(f'<b>{esc(p)}</b>' if i % 2 else esc(p) for i, p in enumerate(parts))


def contact_html(lines):
    return '\n'.join(f'<p{" class=head" if i == 0 else ""}>{rich(l)}</p>' for i, l in enumerate(lines))


# ---------- shared pictures ----------

def cut_qr(out_dir):
    """The LINE QR box of the approved v3 back (44 x 44 mm at 14 mm from the right, 200 mm from the top)."""
    back = Image.open(os.path.join(APPROVED, 'back.png')).convert('RGB')
    px = back.width / 210
    left, top, size = round((210 - 14 - 44) * px), round(200 * px), round(44 * px)
    qr = back.crop((left, top, left + size, top + size))
    os.makedirs(os.path.join(out_dir, 'assets'), exist_ok=True)
    path = os.path.join(out_dir, 'assets', 'line-qr.png')
    qr.save(path)
    return path


def icon_svg(name, stroke):
    svg = open(os.path.join(ICONS, f'step-icon-{name}.svg'), encoding='utf-8').read()
    return svg.replace('stroke="#000"', f'stroke="{stroke}"').replace('fill="#000"', f'fill="{stroke}"')


BAND_PATHS = {
    'seed': '<path d="M12 4 C17.5 8 17.5 16 12 20 C6.5 16 6.5 8 12 4Z"/><path d="M12 7.5 V16.5" fill="none"/>',
    'sprout': '<path d="M12 21 V12" fill="none"/><path d="M12 13 C8 13 4.5 10.5 4.5 6 C9 6 12 9 12 13Z"/><path d="M12 11.5 C12 7 15 4 19.5 4 C19.5 8.5 16.5 11.5 12 11.5Z"/>',
    'leaf': '<path d="M5 19.5 C5 10 11 4 20 4 C20 13.5 14 19.5 5 19.5Z"/><path d="M5 19.5 L14.5 10" fill="none"/>',
    'bud': '<path d="M12 21 V14" fill="none"/><path d="M12 3.5 C16.5 6.5 16.5 12 12 14.5 C7.5 12 7.5 6.5 12 3.5Z"/><path d="M12 18 C9.5 18 7.5 16.5 7 14.5 C9.5 14.5 11.5 16 12 18Z"/>',
    'flower': ''.join(f'<circle cx="{12 + 5.2 * c:.2f}" cy="{12 + 5.2 * s:.2f}" r="3.6"/>' for c, s in [(0, -1), (0.951, -0.309), (0.588, 0.809), (-0.588, 0.809), (-0.951, -0.309)]) + '<circle cx="12" cy="12" r="3" class="mid"/>',
}
BANDS = ['seed', 'sprout', 'leaf', 'bud', 'flower']


def band_icon(name, x, y, size, fill, stroke, mid='#FFFFFF', width=1.4):
    scale = size / 24
    return (f'<g transform="translate({x - size / 2:.2f} {y - size / 2:.2f}) scale({scale:.4f})" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round">'
            + BAND_PATHS[name].replace('class="mid"', f'fill="{mid}"') + '</g>')


# ---------- fonts and page ----------

def font_css():
    faces = [
        ('Andika', 400, 'normal', 'andika-regular.ttf', 'truetype', None),
        ('Andika', 700, 'normal', 'andika-bold.ttf', 'truetype', None),
        ('League Spartan', 700, 'normal', 'league-spartan-latin-700-normal.woff2', 'woff2', None),
        ('Fredoka', 600, 'normal', 'fredoka-latin-600-normal.woff2', 'woff2', None),
        ('Fredoka', 700, 'normal', 'fredoka-latin-700-normal.woff2', 'woff2', None),
        ('Merriweather', 700, 'italic', 'merriweather-latin-700-italic.woff2', 'woff2', None),
        ('Merriweather', 700, 'normal', 'merriweather-latin-700-normal.woff2', 'woff2', None),
        ('Sarabun', 400, 'normal', 'sarabun-thai-400-normal.woff2', 'woff2', 'U+0E00-0E7F'),
        ('Sarabun', 700, 'normal', 'sarabun-thai-700-normal.woff2', 'woff2', 'U+0E00-0E7F'),
    ]
    out = []
    for fam, weight, style, file, fmt, rng in faces:
        r = f' unicode-range: {rng};' if rng else ''
        out.append(f"@font-face {{ font-family: '{fam}'; font-weight: {weight}; font-style: {style}; "
                   f"src: url('{rel(os.path.join(FONTS, file))}') format('{fmt}');{r} }}")
    return '\n'.join(out)


def document(title, size, body, css):
    w, h = SIZES[size]
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{esc(title)}</title><style>
{font_css()}
@page {{ size: {w}mm {h}mm; margin: 0; }}
html, body {{ margin: 0; padding: 0; background: #ffffff; }}
body {{ font-family: 'Andika', 'Sarabun', sans-serif; font-synthesis: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.page {{ position: relative; width: {w}mm; height: {h}mm; overflow: hidden; }}
.page > * {{ position: absolute; }}
.art {{ left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; }}
svg {{ overflow: visible; }}
.c {{ text-align: center; white-space: nowrap; }}
.contact p {{ margin: 0; }}
.contact .head {{ font-weight: 700; }}
.panel h3 {{ margin: 0; }}
.panel p {{ margin: 0 0 2.2mm 0; }}
{css}
</style></head><body><div class="page">
{body}
</div></body></html>
"""


def art(path, view=None):
    """The art layer to the page edges. `view` (from selection.json) can hold `zoom` (1 = the page)
    and `anchor` ([x, y], 0 to 1: the part of the art that stays in view when the zoom crops it)."""
    view = view or {}
    zoom = float(view.get('zoom', 1))
    ax, ay = view.get('anchor', [0.5, 0.5])
    size = f'width:{zoom * 100:.2f}%;height:{zoom * 100:.2f}%;left:{-(zoom - 1) * 100 * ax:.2f}%;top:{-(zoom - 1) * 100 * ay:.2f}%'
    return f'<img class="art" src="{rel(path)}" style="{size}" alt="">'


def role_mark(stroke, size_mm, text_css):
    icons = ''.join(f'<span style="display:inline-block;width:{size_mm}mm;height:{size_mm}mm;vertical-align:middle;margin-right:1mm">{icon_svg(i, stroke)}</span>' for i in READER['icons'])
    return f'{icons}<span style="vertical-align:middle;{text_css}">{esc(READER["role"])}</span>'


def panel_html(fields, head_css, text_css):
    return ''.join(f'<h3 style="{head_css}">{esc(head)}</h3><p style="{text_css}">{esc(fields[key])}</p>' for key, head in FIELDS)


# ---------- option A: the Primary Advantage frame ----------

A = {'navy': '#16264A', 'blue': BLUE, 'deep': '#123E73', 'silver': '#E7EEF7', 'steel': '#8FA3BF'}


def a_hud(x, y, w, h, band_label=False):
    r = h / 2
    slots = ''.join(
        f'<circle cx="{8 + i * 11.5:.1f}" cy="{h / 2}" r="4.6" fill="{"#2E4C80" if b == "sprout" else "#22345A"}" stroke="{AMBER if b == "sprout" else "#4A6290"}" stroke-width="{0.9 if b == "sprout" else 0.4}"/>'
        + band_icon(b, 8 + i * 11.5, h / 2, 6.2, '#8BD14A' if b == 'sprout' else '#5E7397', '#1B2A4A' if b == 'sprout' else '#3B4F78', '#FFE08A' if b == 'sprout' else '#7F92B3', 1.2)
        for i, b in enumerate(BANDS))
    start = 8 + 4 * 11.5 + 8
    end = w - 22
    label = ''
    if band_label:
        label = f'<text x="{start + 2}" y="{h / 2 + 2.1}" font-family="League Spartan" font-weight="700" font-size="6.2" fill="{AMBER}">{READER["band"]}</text>'
        start += 30
    track = (f'<rect x="{start}" y="{h / 2 - 2.6}" width="{end - start}" height="5.2" rx="2.6" fill="#0E1A33" stroke="#4A6290" stroke-width="0.4"/>'
             f'<rect x="{start + 0.6}" y="{h / 2 - 2}" width="{(end - start - 1.2) / 4:.2f}" height="4" rx="2" fill="#8BD14A"/>'
             + ''.join(f'<line x1="{start + (end - start) * k / 4:.2f}" y1="{h / 2 - 2.6}" x2="{start + (end - start) * k / 4:.2f}" y2="{h / 2 + 2.6}" stroke="#4A6290" stroke-width="0.4"/>' for k in (1, 2, 3)))
    book = f'<g transform="translate({w - 22} {h / 2 - 3.2})"><path d="M0 1 C2.5 0 4.5 0 6.5 1.4 C8.5 0 10.5 0 13 1 V7 C10.5 6 8.5 6 6.5 7.4 C4.5 6 2.5 6 0 7Z" fill="#F4EBD3" stroke="#8C6A3C" stroke-width="0.4"/><line x1="6.5" y1="1.4" x2="6.5" y2="7.4" stroke="#8C6A3C" stroke-width="0.4"/></g>'
    star = f'<path transform="translate({w - 4.6} {h / 2}) scale(0.34)" d="M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.2 L6.5 8.5 L0 4 L-6.5 8.5 L-4.3 1.2 L-10 -3.1 L-2.9 -3.1Z" fill="{AMBER}" stroke="#B7791F" stroke-width="1"/>'
    return (f'<svg style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm" viewBox="0 0 {w} {h}">'
            f'<rect x="0" y="0" width="{w}" height="{h}" rx="{r}" fill="{A["silver"]}" stroke="{A["steel"]}" stroke-width="0.5"/>'
            f'<rect x="1.3" y="1.3" width="{w - 2.6}" height="{h - 2.6}" rx="{r - 1.3}" fill="{A["navy"]}" stroke="#5B76A3" stroke-width="0.4"/>'
            f'{slots}{label}{track}{book}{star}</svg>')


def a_plaque(x, y, w, h, fill=BLUE):
    c = 6

    def shape(i):
        return (f'M{i} {c + i} L{c + i} {i} L{w - c - i} {i} L{w - i} {c + i} L{w - i} {h - c - i} '
                f'L{w - c - i} {h - i} L{c + i} {h - i} L{i} {h - c - i}Z')
    # A crystal at each end; the spike points out of the plaque (flip -1 at the left end).
    s = min(9, h / 3)
    crystal = lambda cx, flip: (
        f'<g transform="translate({cx} {h / 2}) scale({flip} 1)">'
        f'<path d="M{s * 0.4:.2f} {-s * 0.45:.2f} L{s * 1.6:.2f} -1 L{s:.2f} 0 L{s * 1.6:.2f} 1 L{s * 0.4:.2f} {s * 0.45:.2f}" fill="#DCE9F8" stroke="#7F9BC0" stroke-width="0.4"/>'
        f'<path d="M-{s} 0 L0 -{s} L{s} 0 L0 {s}Z" fill="#EAF4FF" stroke="#7F9BC0" stroke-width="0.5"/>'
        f'<path d="M-{s} 0 L0 -{s} L0 {s}Z" fill="#C9DDF4"/><path d="M0 -{s} L{s} 0 L0 0Z" fill="#FFFFFF"/></g>')
    return (f'<svg style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm" viewBox="0 0 {w} {h}">'
            f'<path d="{shape(0)}" fill="{A["silver"]}" stroke="{A["steel"]}" stroke-width="0.6"/>'
            f'<path d="{shape(1.8)}" fill="{A["deep"]}"/>'
            f'<path d="{shape(2.8)}" fill="{fill}"/>'
            f'<path d="M{c + 3} 3.6 L{w - c - 3} 3.6" stroke="#5A9AD6" stroke-width="0.6"/>'
            f'{crystal(0, -1)}{crystal(w, 1)}</svg>')


def a_crest(y):
    emblem = (f'<svg style="left:91mm;top:{y}mm;width:28mm;height:28mm" viewBox="0 0 28 28">'
              f'<circle cx="14" cy="14" r="13.4" fill="{A["silver"]}" stroke="{A["steel"]}" stroke-width="0.5"/>'
              f'<circle cx="14" cy="14" r="11.8" fill="{A["navy"]}"/>'
              f'<path d="M4 17.5 C8 15.6 11.5 15.8 14 18 C16.5 15.8 20 15.6 24 17.5 V21.5 C20 19.6 16.5 19.8 14 22 C11.5 19.8 8 19.6 4 21.5Z" fill="#FFFFFF"/>'
              + band_icon('sprout', 14, 10.5, 12, '#8BD14A', '#0E1A33', width=1.1) + '</svg>')
    banner = a_plaque(22, y + 20, 166, 38, fill='#1F5FA8')
    text = (f'<div class="c" style="left:22mm;top:{y + 23.4}mm;width:166mm;color:#fff;font-family:\'League Spartan\';font-weight:700;line-height:1">'
            f'<div style="font-size:36pt">Storytime</div><div style="font-size:22pt;margin-top:0.8mm;letter-spacing:0.5pt">Advantage</div></div>')
    return emblem + banner + text


def a_front(art_path, pos, book_line, band=False):
    body = art(art_path, pos) + a_hud(12, 9, 186, 15) + a_crest(28)
    body += a_plaque(26, 239, 158, 40)
    if band:
        body += (f'<div class="c" style="left:83mm;top:232.5mm;width:44mm;height:9mm;line-height:9mm;border-radius:4.5mm;background:{A["navy"]};'
                 f'border:0.6mm solid {AMBER};color:{AMBER};font-weight:700;font-size:13pt;box-sizing:border-box">{esc(BAND)}</div>')
    body += (f'<div class="c" style="left:26mm;top:{246 if not band else 247}mm;width:158mm;color:#fff;line-height:1">'
             f'<div style="font-family:\'League Spartan\';font-weight:700;font-size:29pt">{esc(LEVEL_LINE)}</div>'
             f'<div style="font-weight:700;font-size:15pt;margin-top:2mm;color:#FFE7A3">{esc(book_line)}</div></div>')
    return body


def a_back(art_path, pos, fields, contact, qr, logo):
    body = art(art_path, pos)
    body += f'<div style="left:10mm;top:9mm;width:34mm;height:34mm;background:#fff;border-radius:3mm;border:0.6mm solid {A["steel"]};box-sizing:border-box"></div>'
    body += f'<img src="{rel(logo)}" style="left:12mm;top:11mm;width:30mm;height:30mm" alt="">'
    body += a_plaque(52, 14, 146, 22, fill='#1F5FA8')
    body += f'<div class="c" style="left:52mm;top:19.5mm;width:146mm;color:#fff;font-family:\'League Spartan\';font-weight:700;font-size:20pt;line-height:1">{SERIES}</div>'
    body += ('<div class="panel" style="left:12mm;top:48mm;width:186mm;height:142mm;background:#F8F1DE;border:0.8mm solid #C8A96A;border-radius:3mm;'
             'box-sizing:border-box;padding:9mm 11mm">' + panel_html(fields, f'font-family:\'League Spartan\';font-weight:700;font-size:14pt;color:#1F5FA8', 'font-size:14pt;line-height:1.32;color:#1a1a1a') + '</div>')
    planks = '<rect x="3" y="3" width="180" height="74" rx="2" fill="#E6BD85"/>' + ''.join(f'<path d="M5 {yy} C60 {yy - 0.9} 120 {yy + 0.9} 181 {yy}" stroke="#D5A86C" stroke-width="0.35" fill="none"/>' for yy in (9, 23, 37, 51, 65))
    nails = ''.join(f'<circle cx="{cx}" cy="{cy}" r="1" fill="#7A4A22"/>' for cx in (4, 182) for cy in (6, 74))
    body += f'<svg style="left:12mm;top:200mm;width:186mm;height:80mm" viewBox="0 0 186 80"><rect x="-1" y="-1" width="188" height="82" rx="3" fill="#6B3F1C"/>{planks}{nails}</svg>'
    body += f'<div class="contact" style="left:20mm;top:208mm;width:112mm;font-size:12pt;line-height:1.6;color:#1E1208">{contact}</div>'
    body += f'<div style="left:141mm;top:205mm;width:50mm;height:50mm;background:#fff;border-radius:2.5mm;border:0.6mm solid #6B3F1C;box-sizing:border-box"></div>'
    body += f'<img src="{rel(qr)}" style="left:144mm;top:208mm;width:44mm;height:44mm" alt="">'
    body += f'<div class="c" style="left:141mm;top:259mm;width:50mm;font-weight:700;font-size:12pt;color:#1E1208">LINE</div>'
    return body


def a_reader(art_path, pos):
    body = art(art_path, pos) + a_hud(14, 12, 150, 15, band_label=True)
    body += a_plaque(274, 12, 132, 20, fill='#1F5FA8')
    body += f'<div class="c" style="left:274mm;top:16.6mm;width:132mm;color:#fff;font-family:\'League Spartan\';font-weight:700;font-size:17pt;line-height:1">{SERIES}</div>'
    body += (f'<div class="c" style="left:322mm;top:35mm;width:36mm;height:10mm;line-height:10mm;border-radius:5mm;background:{A["navy"]};'
             f'border:0.6mm solid {AMBER};color:{AMBER};font-weight:700;font-size:14pt;box-sizing:border-box">{READER["week"]}</div>')
    body += a_plaque(100, 236, 220, 40)
    body += f'<div class="c" style="left:100mm;top:244mm;width:220mm;color:#fff;font-family:\'League Spartan\';font-weight:700;font-size:40pt;line-height:1">{esc(READER["title"])}</div>'
    body += (f'<div class="c" style="left:150mm;top:278mm;width:120mm;height:12mm;line-height:12mm;background:{A["navy"]};border-radius:2mm;border:0.6mm solid {A["steel"]};box-sizing:border-box;color:#fff">'
             + role_mark('#FFFFFF', 7, 'font-weight:700;font-size:15pt') + '</div>')
    return body


# ---------- option B: the Reading Advantage frame ----------

B = {'wood': '#6B4426', 'wood2': '#7C5230', 'gold': '#D9B25A', 'goldd': '#9C7A2E', 'navy': '#1F3A68', 'cream': '#FFF6E3'}


def b_grain(w, h):
    return ''.join(f'<path d="M2 {y:.1f} C{w * 0.3:.1f} {y - 1.2:.1f} {w * 0.6:.1f} {y + 1.2:.1f} {w - 2} {y:.1f}" stroke="#61401F" stroke-width="0.3" fill="none"/>' for y in [h * k / 6 for k in range(1, 6)])


def b_plaque(x, y, w, h):
    gem = lambda cx, flip: (f'<g transform="translate({cx} {h / 2}) scale({flip} 1)"><path d="M0 -5 L14 0 L0 5 L-3 0Z" fill="#2F78C4" stroke="{B["goldd"]}" stroke-width="0.6"/>'
                            f'<path d="M0 -5 L14 0 L0 0Z" fill="#7FB6EE"/></g>')
    return (f'<svg style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm" viewBox="0 0 {w} {h}">'
            f'{gem(-1, -1)}{gem(w + 1, 1)}'
            f'<rect x="0" y="0" width="{w}" height="{h}" rx="3" fill="{B["gold"]}" stroke="{B["goldd"]}" stroke-width="0.6"/>'
            f'<rect x="2" y="2" width="{w - 4}" height="{h - 4}" rx="2" fill="{B["wood"]}"/>{b_grain(w, h)}'
            f'<rect x="3.2" y="3.2" width="{w - 6.4}" height="{h - 6.4}" rx="1.5" fill="none" stroke="{B["gold"]}" stroke-width="0.4"/>'
            f'<path d="M{w / 2 - 6} {h} L{w / 2} {h + 5} L{w / 2 + 6} {h}Z" fill="{B["gold"]}" stroke="{B["goldd"]}" stroke-width="0.4"/>'
            f'<path d="M{w / 2 - 3} {h + 0.4} L{w / 2} {h + 3} L{w / 2 + 3} {h + 0.4}Z" fill="#C0392B"/></svg>')


def b_bar(x, y, w, h, band_label=False):
    slots = ''.join(
        f'<circle cx="{8 + i * 11:.1f}" cy="{h / 2}" r="4.4" fill="{"#8A5A33" if b == "sprout" else "#4E301A"}" stroke="{B["gold"] if b == "sprout" else "#8C6A3C"}" stroke-width="{0.9 if b == "sprout" else 0.4}"/>'
        + band_icon(b, 8 + i * 11, h / 2, 6, '#9BD45A' if b == 'sprout' else '#8C6A3C', '#3A2412', '#FFE08A' if b == 'sprout' else '#A4865A', 1.2)
        for i, b in enumerate(BANDS))
    start, end = 8 + 4 * 11 + 8, w - 10
    label = ''
    if band_label:
        label = f'<text x="{start + 1}" y="{h / 2 + 2.1}" font-family="Fredoka" font-weight="700" font-size="6" fill="{B["gold"]}">{READER["band"]}</text>'
        start += 26
    track = (f'<rect x="{start}" y="{h / 2 - 2.4}" width="{end - start}" height="4.8" rx="1" fill="#2B1A0E" stroke="{B["goldd"]}" stroke-width="0.4"/>'
             f'<rect x="{start + 0.5}" y="{h / 2 - 1.9}" width="{(end - start - 1) / 4:.2f}" height="3.8" rx="0.8" fill="{B["gold"]}"/>')
    return (f'<svg style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm" viewBox="0 0 {w} {h}">'
            f'<rect x="0" y="0" width="{w}" height="{h}" rx="2" fill="{B["gold"]}" stroke="{B["goldd"]}" stroke-width="0.5"/>'
            f'<rect x="1.4" y="1.4" width="{w - 2.8}" height="{h - 2.8}" rx="1.4" fill="#3E2614"/>{slots}{label}{track}</svg>')


def b_label(x, y, w, h, size):
    return (f'<div class="c" style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm;line-height:{h - 1.6}mm;border-radius:{h / 2}mm;background:{B["cream"]};'
            f'border:0.8mm solid {B["gold"]};box-sizing:border-box;color:{B["navy"]};font-family:Fredoka;font-weight:700;font-size:{size}pt">{SERIES}</div>')


def b_ribbon(x, y, w, h, inner):
    return (f'<svg style="left:{x - 8}mm;top:{y}mm;width:{w + 16}mm;height:{h}mm" viewBox="0 0 {w + 16} {h}">'
            f'<path d="M0 0 H10 V{h} H0 L4 {h / 2}Z" fill="#15294B"/><path d="M{w + 16} 0 H{w + 6} V{h} H{w + 16} L{w + 12} {h / 2}Z" fill="#15294B"/>'
            f'<rect x="6" y="0" width="{w + 4}" height="{h}" fill="{B["navy"]}" stroke="{B["gold"]}" stroke-width="0.5"/></svg>'
            f'<div class="c" style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm;line-height:{h}mm;color:{B["cream"]}">{inner}</div>')


def b_front(art_path, pos, book_line, band=False):
    body = art(art_path, pos) + b_label(30, 9, 150, 19, 27) + b_bar(37, 31, 136, 12)
    body += b_plaque(24, 232, 162, 32)
    body += f'<div class="c" style="left:24mm;top:237.5mm;width:162mm;color:#F3D27A;font-family:Merriweather;font-style:italic;font-weight:700;font-size:30pt;line-height:1">{esc(LEVEL_LINE)}</div>'
    body += b_ribbon(52, 268, 106, 13, f'<span style="font-family:Fredoka;font-weight:600;font-size:17pt">{esc(book_line)}</span>')
    if band:
        body += (f'<div class="c" style="left:88mm;top:224mm;width:34mm;height:8.5mm;line-height:7.3mm;border-radius:1.5mm;background:{B["wood"]};'
                 f'border:0.6mm solid {B["gold"]};box-sizing:border-box;color:#F3D27A;font-family:Fredoka;font-weight:700;font-size:12pt">{esc(BAND)}</div>')
    return body


def b_back(art_path, pos, fields, contact, qr, logo):
    body = art(art_path, pos)
    body += f'<div style="left:10mm;top:9mm;width:34mm;height:34mm;background:#fff;border-radius:3mm;border:0.8mm solid {B["gold"]};box-sizing:border-box"></div>'
    body += f'<img src="{rel(logo)}" style="left:12mm;top:11mm;width:30mm;height:30mm" alt="">'
    body += b_label(58, 17, 132, 16, 22)
    rods = (f'<svg style="left:9mm;top:46mm;width:192mm;height:150mm" viewBox="0 0 192 150">'
            f'<rect x="3" y="4" width="186" height="142" fill="#FBF3E0" stroke="{B["gold"]}" stroke-width="0.6"/>'
            + ''.join(f'<rect x="0" y="{yy}" width="192" height="7" rx="3.5" fill="{B["wood"]}" stroke="{B["goldd"]}" stroke-width="0.5"/>'
                      f'<circle cx="2.5" cy="{yy + 3.5}" r="3.4" fill="{B["gold"]}"/><circle cx="189.5" cy="{yy + 3.5}" r="3.4" fill="{B["gold"]}"/>' for yy in (0, 143))
            + '</svg>')
    body += rods
    body += ('<div class="panel" style="left:22mm;top:57mm;width:166mm;height:128mm">'
             + panel_html(fields, f'font-family:Fredoka;font-weight:700;font-size:14pt;color:{B["navy"]}', 'font-size:14pt;line-height:1.32;color:#2B1A0E') + '</div>')
    body += (f'<svg style="left:12mm;top:203mm;width:186mm;height:78mm" viewBox="0 0 186 78"><rect x="0" y="0" width="186" height="78" rx="3" fill="{B["gold"]}" stroke="{B["goldd"]}" stroke-width="0.6"/>'
             f'<rect x="2" y="2" width="182" height="74" rx="2" fill="{B["wood"]}"/>{b_grain(186, 78)}'
             f'<rect x="3.2" y="3.2" width="179.6" height="71.6" rx="1.5" fill="none" stroke="{B["gold"]}" stroke-width="0.4"/></svg>')
    body += f'<div class="contact" style="left:21mm;top:212mm;width:112mm;font-size:12pt;line-height:1.6;color:{B["cream"]}">{contact}</div>'
    body += f'<div style="left:141mm;top:208mm;width:50mm;height:50mm;background:#fff;border-radius:2mm;border:0.8mm solid {B["gold"]};box-sizing:border-box"></div>'
    body += f'<img src="{rel(qr)}" style="left:144mm;top:211mm;width:44mm;height:44mm" alt="">'
    body += f'<div class="c" style="left:141mm;top:262mm;width:50mm;font-family:Fredoka;font-weight:700;font-size:13pt;color:#F3D27A">LINE</div>'
    return body


def b_reader(art_path, pos):
    body = art(art_path, pos) + b_label(14, 12, 124, 16, 22) + b_bar(14, 32, 124, 11, band_label=True)
    body += (f'<div class="c" style="left:368mm;top:12mm;width:38mm;height:12mm;line-height:10.4mm;border-radius:2mm;background:{B["wood"]};'
             f'border:0.8mm solid {B["gold"]};box-sizing:border-box;color:#F3D27A;font-family:Fredoka;font-weight:700;font-size:16pt">{READER["week"]}</div>')
    body += b_plaque(110, 232, 200, 36)
    body += f'<div class="c" style="left:110mm;top:238mm;width:200mm;color:#F3D27A;font-family:Merriweather;font-style:italic;font-weight:700;font-size:38pt;line-height:1">{esc(READER["title"])}</div>'
    body += b_ribbon(150, 274, 120, 13, role_mark(B['cream'], 7, 'font-family:Fredoka;font-weight:600;font-size:16pt'))
    return body


# ---------- option C: the flat game-map frame ----------

C = {'navy': '#1D2B53', 'green': '#5BBF4A', 'amber': AMBER}


def c_bar(x, y, w, h, band_label=False):
    slots = ''.join(
        f'<circle cx="{8 + i * 12:.1f}" cy="{h / 2}" r="{5.4 if b == "sprout" else 4.4}" fill="{"#E9F8E2" if b == "sprout" else "#EEF1F6"}" stroke="{C["navy"]}" stroke-width="{1 if b == "sprout" else 0.6}"/>'
        + band_icon(b, 8 + i * 12, h / 2, 7 if b == 'sprout' else 5.6, C['green'] if b == 'sprout' else '#C3CBD8', C['navy'] if b == 'sprout' else '#9AA6BA', '#FFFFFF', 1.4)
        for i, b in enumerate(BANDS))
    end = 8 + 4 * 12 + 8
    label = ''
    if band_label:
        label = f'<text x="{end}" y="{h / 2 + 2.2}" font-family="Fredoka" font-weight="700" font-size="6.4" fill="{C["navy"]}">{READER["band"]}</text>'
        end += 26
    stars = ''.join(f'<path transform="translate({end + 4 + k * 8} {h / 2}) scale(0.32)" d="M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.2 L6.5 8.5 L0 4 L-6.5 8.5 L-4.3 1.2 L-10 -3.1 L-2.9 -3.1Z" fill="{AMBER if k == 0 else "#E3E7EE"}" stroke="{C["navy"]}" stroke-width="2.4" stroke-linejoin="round"/>' for k in range(4))
    return (f'<svg style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm" viewBox="0 0 {w} {h}">'
            f'<rect x="0" y="0" width="{w}" height="{h}" rx="{h / 2}" fill="#FFFFFF" stroke="{C["navy"]}" stroke-width="1.2"/>{slots}{label}{stars}</svg>')


def c_pill(x, y, w, h, fill, text, size, color='#FFFFFF', font='Fredoka', weight=700, border='#FFFFFF'):
    return (f'<div class="c" style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm;line-height:{h - 3.2}mm;border-radius:{h / 2}mm;background:{fill};'
            f'border:1.6mm solid {border};outline:0.8mm solid {C["navy"]};box-sizing:border-box;color:{color};font-family:{font};font-weight:{weight};font-size:{size}pt">{text}</div>')


def c_title(x, y, w, text, size):
    """White chunky text with a navy outline (SVG text, so the outline sits behind the fill)."""
    mm = size * 0.3528
    h = mm * 1.4
    return (f'<svg style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h:.2f}mm" viewBox="0 0 {w} {h:.2f}">'
            f'<text x="{w / 2}" y="{mm * 1.02:.2f}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="{mm:.2f}" '
            f'fill="#FFFFFF" stroke="{C["navy"]}" stroke-width="{mm * 0.2:.2f}" stroke-linejoin="round" paint-order="stroke">{esc(text)}</text></svg>')


def c_frame(w, h, pad=7, radius=9):
    return (f'<svg style="left:0;top:0;width:{w}mm;height:{h}mm" viewBox="0 0 {w} {h}"><path fill-rule="evenodd" fill="#FFFFFF" '
            f'd="M0 0 H{w} V{h} H0Z M{pad + radius} {pad} H{w - pad - radius} A{radius} {radius} 0 0 1 {w - pad} {pad + radius} V{h - pad - radius} '
            f'A{radius} {radius} 0 0 1 {w - pad - radius} {h - pad} H{pad + radius} A{radius} {radius} 0 0 1 {pad} {h - pad - radius} V{pad + radius} '
            f'A{radius} {radius} 0 0 1 {pad + radius} {pad}Z"/>'
            f'<rect x="{pad}" y="{pad}" width="{w - 2 * pad}" height="{h - 2 * pad}" rx="{radius}" fill="none" stroke="{C["navy"]}" stroke-width="1.2"/></svg>')


def c_front(art_path, pos, book_line, band=False):
    body = art(art_path, pos) + c_frame(210, 297)
    body += c_title(7, 15, 196, SERIES, 31) + c_bar(47, 34, 116, 14)
    body += c_pill(27, 236, 156, 26, BLUE, esc(LEVEL_LINE), 30)
    body += c_pill(62, 262, 86, 15, AMBER, esc(book_line), 16, color=C['navy'])
    if band:
        body += c_pill(80, 224, 50, 13, C['green'], esc(BAND), 14)
    return body


def c_card(x, y, w, h):
    return f'<div style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm;background:#FFFFFF;border:1.2mm solid {C["navy"]};border-radius:6mm;box-sizing:border-box"></div>'


def c_back(art_path, pos, fields, contact, qr, logo):
    body = art(art_path, pos) + c_frame(210, 297)
    body += c_card(13, 13, 34, 34) + f'<img src="{rel(logo)}" style="left:15mm;top:15mm;width:30mm;height:30mm" alt="">'
    body += c_title(50, 23, 150, SERIES, 24)
    body += c_card(13, 52, 184, 142)
    body += ('<div class="panel" style="left:23mm;top:60mm;width:164mm;height:128mm">'
             + panel_html(fields, f'font-family:Fredoka;font-weight:700;font-size:14pt;color:{BLUE}', 'font-size:14pt;line-height:1.32;color:#1a1a1a') + '</div>')
    body += c_card(13, 201, 184, 82)
    body += f'<div class="contact" style="left:23mm;top:211mm;width:112mm;font-size:12pt;line-height:1.6;color:#1a1a1a">{contact}</div>'
    body += f'<img src="{rel(qr)}" style="left:144mm;top:209mm;width:44mm;height:44mm" alt="">'
    body += c_pill(149, 256, 34, 12, BLUE, 'LINE', 13)
    return body


def c_reader(art_path, pos):
    body = art(art_path, pos) + c_frame(420, 297, pad=9, radius=12)
    body += c_bar(18, 17, 110, 14, band_label=True)
    body += c_title(250, 19, 160, SERIES, 24)
    body += c_pill(358, 33, 44, 13, AMBER, READER['week'], 15, color=C['navy'])
    body += c_pill(120, 238, 180, 28, BLUE, esc(READER['title']), 38)
    body += c_pill(150, 266, 120, 15, '#FFFFFF', role_mark(C['navy'], 7, 'font-weight:700;font-size:15pt'), 15, color=C['navy'], font='Andika', border=C['amber'])
    return body


# ---------- the black-and-white reader leaf ----------

def leaf(option, line_art):
    """The tear-out reader leaf cover (198 x 148.5 mm): the approved line art in the frame of the option, black on white."""
    k = '#000000'
    pic = f'<img src="{rel(line_art)}" style="left:12mm;top:10mm;width:174mm;height:98mm;object-fit:cover;object-position:50% 45%" alt="">'
    if option == 'A':
        frame = (f'<svg style="left:8mm;top:7mm;width:182mm;height:104mm" viewBox="0 0 182 104">'
                 f'<rect x="0.5" y="0.5" width="181" height="103" rx="5" fill="none" stroke="{k}" stroke-width="1"/>'
                 f'<rect x="2.3" y="2.3" width="177.4" height="99.4" rx="4" fill="none" stroke="{k}" stroke-width="0.4"/></svg>')
        plaque = (f'<svg style="left:44mm;top:113mm;width:110mm;height:20mm" viewBox="0 0 110 20"><path d="M0 5 L5 0 H105 L110 5 V15 L105 20 H5 L0 15Z" fill="#fff" stroke="{k}" stroke-width="0.8"/>'
                  f'<path d="M1.6 5.6 L5.6 1.6 H104.4 L108.4 5.6 V14.4 L104.4 18.4 H5.6 L1.6 14.4Z" fill="none" stroke="{k}" stroke-width="0.35"/>'
                  f'<path d="M-6 10 L0 4 L6 10 L0 16Z" fill="#fff" stroke="{k}" stroke-width="0.5"/><path d="M104 10 L110 4 L116 10 L110 16Z" fill="#fff" stroke="{k}" stroke-width="0.5"/></svg>')
        title = f"font-family:'League Spartan';font-weight:700;font-size:20pt"
    elif option == 'B':
        frame = (f'<svg style="left:8mm;top:7mm;width:182mm;height:104mm" viewBox="0 0 182 104">'
                 f'<rect x="0.5" y="0.5" width="181" height="103" rx="2" fill="none" stroke="{k}" stroke-width="1.2"/>'
                 f'<rect x="2.6" y="2.6" width="176.8" height="98.8" rx="1.5" fill="none" stroke="{k}" stroke-width="0.35"/></svg>')
        plaque = (f'<svg style="left:44mm;top:113mm;width:110mm;height:20mm" viewBox="0 0 110 20"><rect x="0.5" y="0.5" width="109" height="19" rx="2" fill="#fff" stroke="{k}" stroke-width="0.9"/>'
                  + ''.join(f'<path d="M3 {y} C30 {y - 0.8} 70 {y + 0.8} 107 {y}" stroke="{k}" stroke-width="0.2" fill="none"/>' for y in (4, 16))
                  + '</svg>')
        title = 'font-family:Merriweather;font-style:italic;font-weight:700;font-size:19pt'
    else:
        frame = (f'<svg style="left:8mm;top:7mm;width:182mm;height:104mm" viewBox="0 0 182 104">'
                 f'<rect x="0.8" y="0.8" width="180.4" height="102.4" rx="8" fill="none" stroke="{k}" stroke-width="1.6"/></svg>')
        plaque = f'<div style="left:44mm;top:113mm;width:110mm;height:20mm;border:1.4mm solid {k};border-radius:10mm;box-sizing:border-box;background:#fff"></div>'
        title = 'font-family:Fredoka;font-weight:700;font-size:21pt'
    text = f'<div class="c" style="left:44mm;top:116.5mm;width:110mm;line-height:1;color:{k};{title}">{esc(READER["title"])}</div>'
    band = ''.join(band_icon(b, 3 + i * 7, 3.5, 5.2, k if b == 'sprout' else '#fff', k, '#fff', 1.3) for i, b in enumerate(BANDS))
    meta = (f'<svg style="left:10mm;top:137mm;width:36mm;height:7mm" viewBox="0 0 36 7">{band}</svg>'
            f'<div style="left:47mm;top:137.6mm;font-weight:700;font-size:9pt;letter-spacing:1.2pt;color:{k}">{READER["band"]}</div>'
            f'<div style="left:68mm;top:137.6mm;font-size:9pt;color:{k}">{SERIES}</div>'
            f'<div style="left:104mm;top:137.6mm;font-size:9pt;color:{k}">{READER["week"]}</div>'
            f'<div style="left:122mm;top:136.6mm;font-size:9pt;color:{k}">' + role_mark(k, 4.6, '') + '</div>')
    return pic + frame + plaque + text + meta


# ---------- main ----------

def pick(selection, out_dir, pid):
    choice = selection.get(pid, {})
    file = choice.get('file')
    if not file:
        tries = sorted(f for f in os.listdir(os.path.join(out_dir, 'art')) if f.startswith(pid + '-a') and f.endswith('.jpg'))
        if not tries:
            sys.exit(f'no art file for {pid}')
        file = tries[-1]
    return os.path.join(out_dir, 'art', file), choice


def main(argv):
    if not argv:
        sys.exit(__doc__)
    out_dir = os.path.abspath(argv[0])
    selection = json.load(open(os.path.join(HERE, 'selection.json'), encoding='utf-8'))
    fields, pdf = panel_fields()
    lines = contact_lines()
    qr = cut_qr(out_dir)
    record = {'panelSource': os.path.relpath(pdf, os.path.expanduser('~')), 'panelSourceSha256': sha256(pdf),
              'contactSource': 'dashboard/lib/covers/back-text.ts BACK_LINES.contact', 'contact': lines, 'panel': fields,
              'front': [SERIES, LEVEL_LINE, STUDENT, TEACHER, BAND], 'reader': READER,
              'qrSource': os.path.relpath(os.path.join(APPROVED, 'back.png'), os.path.expanduser('~')), 'qrSha256': sha256(qr)}
    json.dump(record, open(os.path.join(HERE, 'approved-text.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    contact = contact_html(lines)
    os.makedirs(MOCKS, exist_ok=True)
    builders = {'A': (a_front, a_back, a_reader), 'B': (b_front, b_back, b_reader), 'C': (c_front, c_back, c_reader)}
    only = argv[argv.index('--options') + 1] if '--options' in argv else 'ABC'
    for option, (front, back, reader) in builders.items():
        if option not in only:
            continue
        docs = {
            'student-front': ('a4', front(*pick(selection, out_dir, f'{option}-front'), STUDENT)),
            'student-back': ('a4', back(*pick(selection, out_dir, f'{option}-back'), fields, contact, qr, LOGO)),
            'teacher-front': ('a4', front(*pick(selection, out_dir, f'{option}-teacher'), TEACHER, band=True)),
            'reader-a3': ('a3', reader(*pick(selection, out_dir, f'{option}-reader'))),
            'reader-leaf': ('leaf', leaf(option, LINE_ART)),
        }
        for kind, (size, body) in docs.items():
            name = f'option-{option}-{kind}'
            with open(os.path.join(MOCKS, name + '.html'), 'w', encoding='utf-8') as f:
                f.write(document(f'{SERIES} option {option} {kind}', size, body, ''))
            print(name)


if __name__ == '__main__':
    main(sys.argv[1:])
