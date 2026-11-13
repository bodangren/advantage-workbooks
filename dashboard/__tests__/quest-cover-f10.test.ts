// @vitest-environment jsdom
/**
 * Red of the fix round F10: the r6 book covers (track storytime_cover_options_20261106, Phase 2, the
 * Task (Red, F10) pair of 2026-11-13).
 *
 * The owner words (Daniel, the look note on the r5 book covers, Google Tasks Z21qUjZET3VNUjQxNzVfdA,
 * 2026-11-13, relayed by the PM, word for word): "Logo is on the back, but we still need a title on
 * the fucking front. Jesus."
 *
 * The PM order of 2026-11-13 (word for word): "the front carries the TITLE 'Storytime Advantage' as
 * text (a title plate in the logo colors, as on the first front.png, large, centered, text fill about
 * 80 % of the plate, in the calm top area over the tree canopy; no STA logo mark on the front), and
 * keeps the level plate at the bottom. The back stays as r5 (logo tile, centered text). Rules as
 * before: nothing over a face, a head, or the dog; a real frame or none; no game UI. Add a test: each
 * book front holds the title text 'Storytime Advantage' (and each reader front holds its book title),
 * so a front with no title can never pass again. Layout only, no paid generation."
 *
 * The contract of this file (D-F10-9):
 *   T1: each of the 2 shipped fronts holds exactly 1 part "front-title", and its text with the white
 *       space joined reads "Storytime Advantage". The text sits in the body, outside "style",
 *       "script", and "title", and no image holds it.
 *   T2: each of the 28 reader fronts (14 A3 and 14 leaf, the rows of questReaders()) holds its own
 *       title in its part "title-plaque", with the white space joined.
 *   T3: the plate colours: the band path and the "data-plaque-colour" are "#FCD34D", the text colour
 *       is "#92400E", and every colour of the part is in the token table of M-F10-8.
 *   T4: in Chrome (the method of quest-cover-plaque-fit.test.ts, League Spartan loaded): the plate is
 *       centred on the page within 1 mm, the ink block fills 75 % to 85 % of the band, the ink block is
 *       centred in the plate within 1 mm, the 2 lines stay inside the band, and the plate and the level
 *       plate stand 1 mm apart or more.
 *   T5: the painted box of "front-title", grown by 1 mm, meets no key box of the front art (the boxes
 *       of pictures-heads.json), and it lies 5 mm inside the trim.
 *   T6: the level plate stays: its text, its box of M-F10-4, and the SHA-256 of its part HTML at the
 *       role base 84d0ab78.
 *   T7: the 2 backs keep the r5 layout: the SHA-256 of each back HTML at the role base 84d0ab78,
 *       exactly 1 "logo-tile" with the horizontal logo by file hash, and 0 "front-title".
 *   T8: the default style (top "banner") holds 0 "front-title" on both fronts.
 *   T9: each front holds none of the parts "logo-tile", "series-logo", "crest", "logo-box",
 *       "series-banner", "band-pill", "band-word", "band-icon", "game-bar", and "unit-bar", and its
 *       only image is the art.
 *
 * The method notes:
 *   - Every test holds a positive control: a changed copy of the HTML that must fail the same check.
 *     The control of T1, T3, T4, and T5 is a synthetic plate with one fault; the control of T2 and
 *     T6 changes the text of the part; the control of T7 changes one byte of the HTML; the control of
 *     T8 and T9 adds a forbidden part.
 *   - The ink block of T4 is the ink top of the first line to the ink bottom of the last line. The
 *     ink comes from the League Spartan metrics (ascent 0.7, descent 0.22, cap 0.6719 of the font
 *     size), the same metrics that the cover code uses.
 *   - The 2 backs render the contact lines, which hold Thai. The file prints no text of a back: it
 *     prints hashes, counts, millimetres, colours, and part names only.
 *   - The Red role reads no week file and prints no Thai. It pins digests only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser } from '@playwright/test';
import {
    QUEST_BOXES,
    loadQuestCovers,
    questReaders,
    renderQuestCover,
    type QuestBookRow,
    type QuestPanelValue,
    type QuestReaderRow,
    type QuestRenderOptions,
} from '../lib/storytime/print/cover-quest';
import { loadStorytimeCoverBooks, storytimeCoverPanelValues } from '../lib/storytime/print/covers';
import { STORYTIME_ROOT, readLevelWeeks, readPhonicsGraph } from '../lib/storytime/files';

/** The art string of the renders. The test reads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The millimetres of one CSS pixel. */
const MM_PER_PX = 25.4 / 96;

/** The 2 book front kinds. */
const KINDS_FRONT = ['student-front', 'teacher-front'] as const;

/** The 2 book back kinds. */
const KINDS_BACK = ['student-back', 'teacher-back'] as const;

/** The front kind type. */
type FrontKind = (typeof KINDS_FRONT)[number];

/** The back kind type. */
type BackKind = (typeof KINDS_BACK)[number];

/** The render options of the shipped style: the horizontal logo style, and the bleed 0. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

/** The render options of the default style. */
const BANNER_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'banner' };

/** The SHA-256 of the horizontal Storytime Advantage logo. */
const SHA_HORIZONTAL_LOGO = '3b9f8f4334ae316d9f0061b7b2707b07433b0eecd8ac0adddba0a68d9a3bb9cc';

/** The token table of the standing rules (M-F10-8). */
const TOKENS = ['#fcd34d', '#92400e', '#fef3c7', '#fffbeb', '#ffffff'];

/** The amber of the plate band. */
const AMBER = '#fcd34d';

/** The brown of the plate text. */
const BROWN = '#92400e';

/** The least share of the band that the ink block fills. */
const MIN_INK_SHARE = 0.75;

/** The most share of the band that the ink block fills. */
const MAX_INK_SHARE = 0.85;

/** The tolerance of the centring checks, in millimetres. */
const CENTRE_TOLERANCE_MM = 1;

/** The clearance between the plate and a key box, in millimetres. */
const CLEARANCE_MM = 1;

/** The least distance of the plate from the trim, in millimetres. */
const TRIM_MARGIN_MM = 5;

/** The page of a book front, in millimetres. */
const PAGE_WIDTH_MM = 210;

/** The page of a book front, in millimetres. */
const PAGE_HEIGHT_MM = 297;

/** The tolerance of the inside checks, in millimetres. */
const INSIDE_TOLERANCE_MM = 0.1;

/** The ascent of League Spartan 700, as a share of the font size. */
const FONT_ASCENT = 0.7;

/** The descent of League Spartan 700, as a share of the font size. */
const FONT_DESCENT = 0.22;

/** The cap height of League Spartan 700, as a share of the font size. */
const FONT_CAP = 0.6719;

/** The parts that a front must not hold (D-F10-7). */
const BANNED_PARTS = [
    'logo-tile',
    'series-logo',
    'crest',
    'logo-box',
    'series-banner',
    'band-pill',
    'band-word',
    'band-icon',
    'game-bar',
    'unit-bar',
];

/** The level plate box of the 2 fronts (M-F10-4). */
const LEVEL_BOX = { leftMm: 26, topMm: 278, widthMm: 158, heightMm: 14 };

/** The level plate text of each front (M-F10-4). */
const LEVEL_TEXT: Record<FrontKind, string> = {
    'student-front': 'Level 2 · Unit 1 · Student Book',
    'teacher-front': 'Level 2 · Unit 1 · Teacher Book',
};

/** The SHA-256 of the level plate part of each front at the role base 84d0ab78 (T6). */
const LEVEL_SHA: Record<FrontKind, string> = {
    'student-front': '0c2f7da0a65895b8dd0836dd063d3d1b0c80db947566e4f66220e36bbba0aca7',
    'teacher-front': 'fbcb64561e04b5d4871eb278936243636cf4dcea79925689b2b9b00d5bab4005',
};

/** The SHA-256 of each back render at the role base 84d0ab78 (T7). */
const BACK_SHA: Record<BackKind, string> = {
    'student-back': '5a17085f221416481873bb0dea129711727bf4e399ddf26c8f5e31fe92093fbc',
    'teacher-back': 'f7666628f955c41d946ce50df11b1ffa366693e2542f7e962ccec165a1f43fab',
};

/** The key box file of the art. */
const KEYS_FILE = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures-heads.json');

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of the Chrome checks. */
let browser: Browser | undefined;

/** The measures of the real fronts, by kind. */
const measures = new Map<string, FrontMeasure>();

/** One box as the browser gives it, in pixels. */
interface RawBox {
    /** The left edge. */
    left: number;
    /** The top edge. */
    top: number;
    /** The right edge. */
    right: number;
    /** The bottom edge. */
    bottom: number;
}

/** One line box of text, in pixels. */
interface RawLine {
    /** The left edge. */
    left: number;
    /** The top edge. */
    top: number;
    /** The right edge. */
    right: number;
    /** The bottom edge. */
    bottom: number;
    /** The height of the line box. */
    height: number;
    /** The font size of the line, in pixels. */
    fontPx: number;
}

/** One box in millimetres. */
interface MmBox {
    /** The left edge. */
    left: number;
    /** The top edge. */
    top: number;
    /** The right edge. */
    right: number;
    /** The bottom edge. */
    bottom: number;
}

/** The measurement of one front in Chrome. */
interface FrontMeasure {
    /** The box of the page. */
    page: MmBox;
    /** The box of the art layer, or null when the page holds none. */
    art: MmBox | null;
    /** The computed object-position of the art. */
    objectPosition: string;
    /** The box of the front title plate, or null when the page holds none. */
    plate: MmBox | null;
    /** The box of the band path of the plate, or null when the page holds none. */
    band: MmBox | null;
    /** The data-plaque-colour value of the plate. */
    colour: string;
    /** The line boxes of the plate text. */
    lines: MmBox[];
    /** The font size of each line, in millimetres. */
    lineFonts: number[];
    /** The box of the level plate, or null when the page holds none. */
    level: MmBox | null;
    /** The colours of the plate, as the browser and the source give them. */
    colours: string[];
    /** The computed colours of the plate text. */
    textColours: string[];
}

/** One key box of the art file, in pixels. */
interface KeyEntry {
    /** The width of the art file, in pixels. */
    widthPx: number;
    /** The height of the art file, in pixels. */
    heightPx: number;
    /** The key boxes of the art file, in pixels. */
    boxes: { label: string; kind: string; box: [number, number, number, number] }[];
}

/** The options of a synthetic plate, for the controls. */
interface PlateOptions {
    /** The fill of the band path. */
    fill: string;
    /** The text of the first line. */
    first: string;
    /** The font size of the first line. */
    firstSize: string;
    /** The text of the second line. */
    second: string;
    /** The font size of the second line. */
    secondSize: string;
    /** The left of the plate. */
    left: string;
    /** The top of the plate. */
    top: string;
    /** The width of the plate. */
    width: string;
    /** The height of the plate. */
    height: string;
}

/** The base plate of the controls: the size and the place of D-F10-2. */
const BASE_PLATE: PlateOptions = {
    fill: '#FCD34D',
    first: 'Storytime',
    firstSize: '17.5mm',
    second: 'Advantage',
    secondSize: '10.5mm',
    left: '22mm',
    top: '48mm',
    width: '166mm',
    height: '38mm',
};

/**
 * Reads the SHA-256 of a text.
 * @param text The text.
 * @returns The hash.
 */
function sha256(text: string): string {
    return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Parses one rendered document.
 * @param html The rendered HTML.
 * @returns The document.
 */
function parseHtml(html: string): Document {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('parsererror'), 'the rendered HTML parses.').toBeNull();
    return doc;
}

/**
 * Reads a text with its white space joined.
 * @param element The element.
 * @returns The text.
 */
function joinedText(element: Element | null): string {
    if (!element) return '';
    return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Reads the text nodes of one element.
 * @param element The element.
 * @returns The text nodes.
 */
function textNodes(element: Element): Text[] {
    const found: Text[] = [];
    const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if ((node.nodeValue ?? '').trim()) found.push(node);
    }
    return found;
}

/**
 * Reads the panel values of the shipped Level 2 Unit 1 row.
 * @returns The values.
 */
function panelValues(): QuestPanelValue[] {
    const data = loadStorytimeCoverBooks();
    const book = data.books.find((row) => row.level === 2 && row.unit === 1);
    expect(book, 'books.json holds the Level 2 Unit 1 row.').toBeTruthy();
    const graph = readPhonicsGraph();
    if (!graph) return [{ field: 'story', value: book!.panel?.story?.text ?? '', items: [] }];
    const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
    return storytimeCoverPanelValues(book!, { weeks, graph });
}

/**
 * Reads the book row of quest.json.
 * @returns The row.
 */
function bookRow(): QuestBookRow {
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    return data.books[0];
}

/**
 * Renders one front in the given style.
 * @param kind The front kind.
 * @param opts The render options.
 * @returns The HTML.
 */
function renderFront(kind: FrontKind, opts: QuestRenderOptions): string {
    return renderQuestCover(kind, bookRow(), { art: ART }, opts);
}

/**
 * Renders one back in the shipped style.
 * @param kind The back kind.
 * @returns The HTML.
 */
function renderBack(kind: BackKind): string {
    const assets = kind === 'student-back' ? { art: ART, panelValues: panelValues() } : { art: ART };
    return renderQuestCover(kind, bookRow(), assets, HLOGO_OPTIONS);
}

/**
 * Replaces the part of one document with a synthetic element.
 * @param html The rendered HTML.
 * @param part The part mark of the element to replace.
 * @param replacement The HTML of the replacement element, or an empty string to cut the part out.
 * @returns The changed HTML.
 */
function replacePart(html: string, part: string, replacement: string): string {
    const doc = parseHtml(html);
    for (const element of Array.from(doc.querySelectorAll(`[data-part="${part}"]`))) element.remove();
    if (replacement) {
        const page = doc.querySelector('.quest-page');
        const holder = doc.createElement('div');
        holder.innerHTML = replacement;
        const element = holder.firstElementChild;
        if (element && page) page.appendChild(element);
    }
    return doc.documentElement.outerHTML;
}

/**
 * Replaces the text of one part of a document.
 * @param html The rendered HTML.
 * @param part The part mark.
 * @param text The new text.
 * @returns The changed HTML.
 */
function replacePartText(html: string, part: string, text: string): string {
    const doc = parseHtml(html);
    const element = doc.querySelector(`[data-part="${part}"]`);
    if (!element) return html;
    const target = element.querySelector('.quest-c') ?? element;
    target.textContent = text;
    return doc.documentElement.outerHTML;
}

/**
 * Builds a synthetic plate, for the controls.
 * @param options The options of the plate.
 * @returns The HTML.
 */
function plateHtml(options: PlateOptions): string {
    return (
        `<div data-part="front-title" data-plaque-colour="#FCD34D" style="position:absolute;left:${options.left};` +
        `top:${options.top};width:${options.width};height:${options.height}">` +
        `<svg viewBox="0 0 166 38" style="position:absolute;left:0;top:0;width:${options.width};height:${options.height}">` +
        `<path d="M0 0 L166 0 L166 38 L0 38Z" fill="${options.fill}"/></svg>` +
        `<div style="position:absolute;left:0;top:0;width:${options.width};height:${options.height};display:flex;` +
        `flex-direction:column;align-items:center;justify-content:center;font-family:'League Spartan';font-weight:700;` +
        `line-height:1">` +
        `<div style="font-size:${options.firstSize};color:#92400E">${options.first}</div>` +
        `<div style="font-size:${options.secondSize};color:#92400E">${options.second}</div>` +
        `</div></div>`
    );
}

/**
 * Reads the SHA-256 of the bytes of one image source.
 * @param src The source.
 * @returns The hash.
 */
function hashOfSrc(src: string): string | null {
    let bytes: Uint8Array | null = null;
    if (src.startsWith('data:')) {
        const comma = src.indexOf(',');
        if (comma < 0) return null;
        const head = src.slice(5, comma);
        const payload = src.slice(comma + 1);
        if (!head.endsWith(';base64')) return null;
        let binary: string;
        try {
            binary = atob(payload);
        } catch {
            return null;
        }
        bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    } else if (src.startsWith('file://')) {
        try {
            bytes = new Uint8Array(fs.readFileSync(fileURLToPath(src)));
        } catch {
            return null;
        }
    }
    if (!bytes) return null;
    return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Converts one colour to a lower case hex value.
 * @param value The colour: a hex value or an rgb value.
 * @returns The hex value, or an empty string when the colour holds no red, green, and blue.
 */
function toHex(value: string): string {
    const text = value.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(text)) return text;
    if (/^#[0-9a-f]{3}$/.test(text)) {
        return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`;
    }
    const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(text);
    if (!match) return '';
    const hex = [match[1], match[2], match[3]]
        .map((part) => Number.parseInt(part, 10).toString(16).padStart(2, '0'))
        .join('');
    return `#${hex}`;
}

/**
 * Grows one box by a margin on every side.
 * @param box The box.
 * @param by The margin, in millimetres.
 * @returns The grown box.
 */
function grow(box: MmBox, by: number): MmBox {
    return { left: box.left - by, top: box.top - by, right: box.right + by, bottom: box.bottom + by };
}

/**
 * Tells whether two boxes meet.
 * @param first The first box.
 * @param second The second box.
 * @returns True when the boxes meet.
 */
function overlap(first: MmBox, second: MmBox): boolean {
    const x = Math.min(first.right, second.right) - Math.max(first.left, second.left);
    const y = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
    return x > INSIDE_TOLERANCE_MM && y > INSIDE_TOLERANCE_MM;
}

/**
 * Tells whether one box lies inside another box.
 * @param inner The inner box.
 * @param outer The outer box.
 * @param tolerance The tolerance, in millimetres.
 * @returns True when the inner box lies inside the outer box.
 */
function liesInside(inner: MmBox, outer: MmBox, tolerance: number): boolean {
    return (
        inner.left >= outer.left - tolerance &&
        inner.top >= outer.top - tolerance &&
        inner.right <= outer.right + tolerance &&
        inner.bottom <= outer.bottom + tolerance
    );
}

/**
 * Reads the key box file of the art.
 * @returns The key boxes, by art file name.
 */
function readKeys(): Record<string, KeyEntry> {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')) as Record<string, KeyEntry>;
}

/**
 * Reads one token of a computed object-position.
 * @param token The token: a percentage or a length in pixels.
 * @param freeMm The free space of the axis, in millimetres.
 * @returns The offset in millimetres.
 */
function positionOffset(token: string | undefined, freeMm: number): number {
    if (!token) return 0;
    if (token.endsWith('%')) return (freeMm * Number.parseFloat(token)) / 100;
    if (token.endsWith('px')) return Number.parseFloat(token) * MM_PER_PX;
    return 0;
}

/**
 * Maps the key boxes of one art file to page millimetres.
 * @param entry The entry of the art file.
 * @param art The box of the art element, in millimetres.
 * @param position The computed object-position.
 * @returns The key boxes, in page millimetres.
 */
function keyBoxesMm(entry: KeyEntry, art: MmBox, position: string): { label: string; kind: string; box: MmBox }[] {
    const widthMm = art.right - art.left;
    const heightMm = art.bottom - art.top;
    const scale = Math.max(widthMm / entry.widthPx, heightMm / entry.heightPx);
    const tokens = position.trim().split(/\s+/);
    const offsetX = art.left + positionOffset(tokens[0], widthMm - entry.widthPx * scale);
    const offsetY = art.top + positionOffset(tokens[1] ?? tokens[0], heightMm - entry.heightPx * scale);
    return entry.boxes.map((key) => ({
        label: key.label,
        kind: key.kind,
        box: {
            left: offsetX + key.box[0] * scale,
            top: offsetY + key.box[1] * scale,
            right: offsetX + key.box[2] * scale,
            bottom: offsetY + key.box[3] * scale,
        },
    }));
}

/**
 * Opens one rendered page in Chrome and measures the plate.
 * @param html The rendered HTML.
 * @returns The measurement.
 */
async function measureFront(html: string): Promise<FrontMeasure> {
    const active = browser;
    if (!active) throw new Error('the browser of the F10 check did not start');
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-f10-'));
    scratch.push(folder);
    const file = path.join(folder, 'front.html');
    fs.writeFileSync(file, html);
    const context = await active.newContext({ viewport: { width: 900, height: 1300 } });
    const page = await context.newPage();
    try {
        await page.goto(pathToFileURL(file).href);
        await page.evaluate(() => document.fonts.ready);
        const raw = await page.evaluate((): {
            page: RawBox;
            art: RawBox | null;
            objectPosition: string;
            plate: RawBox | null;
            band: RawBox | null;
            colour: string;
            lines: RawLine[];
            level: RawBox | null;
            colours: string[];
            textColours: string[];
        } => {
            const box = (element: Element | null): RawBox | null => {
                if (!element) return null;
                const rect = element.getBoundingClientRect();
                return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
            };
            const page = document.querySelector('.quest-page');
            const art = document.querySelector('[data-part="art"]');
            const plate = document.querySelector('[data-part="front-title"]');
            const level = document.querySelector('[data-part="title-plaque"]');
            const colour = plate ? (plate.getAttribute('data-plaque-colour') ?? '') : '';
            let band: Element | null = null;
            if (plate) {
                const candidates = Array.from(plate.querySelectorAll('path')).filter((one) => {
                    const parent = one.parentElement;
                    const inGroup = parent ? parent.tagName.toLowerCase() === 'g' : false;
                    return !inGroup && (one.getAttribute('fill') ?? '').toLowerCase() === colour.toLowerCase();
                });
                band = candidates.length === 1 ? (candidates[0] ?? null) : null;
            }
            const lines: RawLine[] = [];
            const textColours: string[] = [];
            if (plate) {
                const walker = document.createTreeWalker(plate, NodeFilter.SHOW_TEXT);
                while (walker.nextNode()) {
                    const node = walker.currentNode as Text;
                    if (!(node.nodeValue ?? '').trim()) continue;
                    const parent = node.parentElement;
                    const fontPx = parent ? Number.parseFloat(window.getComputedStyle(parent).fontSize) : 0;
                    if (parent) textColours.push(window.getComputedStyle(parent).color);
                    const range = document.createRange();
                    range.selectNodeContents(node);
                    for (const rect of Array.from(range.getClientRects())) {
                        lines.push({
                            left: rect.left,
                            top: rect.top,
                            right: rect.right,
                            bottom: rect.bottom,
                            height: rect.height,
                            fontPx,
                        });
                    }
                }
            }
            const colours: string[] = [];
            if (plate) {
                for (const element of Array.from(plate.querySelectorAll('*'))) {
                    const fill = element.getAttribute('fill');
                    if (fill && fill.toLowerCase() !== 'none') colours.push(fill);
                    const stroke = element.getAttribute('stroke');
                    if (stroke && stroke.toLowerCase() !== 'none') colours.push(stroke);
                    const style = window.getComputedStyle(element);
                    const background = style.backgroundColor;
                    if (background && !/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/.test(background)) {
                        colours.push(background);
                    }
                }
            }
            return {
                page: box(page) ?? { left: 0, top: 0, right: 0, bottom: 0 },
                art: box(art),
                objectPosition: art ? window.getComputedStyle(art).objectPosition : '50% 50%',
                plate: box(plate),
                band: box(band),
                colour,
                lines,
                level: box(level),
                colours,
                textColours,
            };
        });
        const toMm = (value: RawBox): MmBox => ({
            left: value.left * MM_PER_PX,
            top: value.top * MM_PER_PX,
            right: value.right * MM_PER_PX,
            bottom: value.bottom * MM_PER_PX,
        });
        return {
            page: toMm(raw.page),
            art: raw.art ? toMm(raw.art) : null,
            objectPosition: raw.objectPosition,
            plate: raw.plate ? toMm(raw.plate) : null,
            band: raw.band ? toMm(raw.band) : null,
            colour: raw.colour,
            lines: raw.lines.map(toMm),
            lineFonts: raw.lines.map((line) => line.fontPx * MM_PER_PX),
            level: raw.level ? toMm(raw.level) : null,
            colours: raw.colours,
            textColours: raw.textColours,
        };
    } finally {
        await context.close();
    }
}

/**
 * Measures one real front in Chrome, once per kind.
 * @param kind The front kind.
 * @returns The measurement.
 */
async function measureRealFront(kind: FrontKind): Promise<FrontMeasure> {
    const held = measures.get(kind);
    if (held) return held;
    const measure = await measureFront(renderFront(kind, HLOGO_OPTIONS));
    measures.set(kind, measure);
    return measure;
}

/**
 * Reads the ink block of the plate text.
 * @param measure The measurement.
 * @returns The ink block, or null when the plate holds no text.
 */
function inkBlock(measure: FrontMeasure): MmBox | null {
    if (measure.lines.length === 0) return null;
    let top = Number.POSITIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;
    let left = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    for (const [index, line] of measure.lines.entries()) {
        const fontMm = measure.lineFonts[index] ?? 0;
        const halfLeading = (line.bottom - line.top - (FONT_ASCENT + FONT_DESCENT) * fontMm) / 2;
        const inkTop = line.top + halfLeading + (FONT_ASCENT - FONT_CAP) * fontMm;
        const inkBottom = line.top + halfLeading + (FONT_ASCENT + FONT_DESCENT) * fontMm;
        top = Math.min(top, inkTop);
        bottom = Math.max(bottom, inkBottom);
        left = Math.min(left, line.left);
        right = Math.max(right, line.right);
    }
    if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
    // changed 2026-11-13 (F10): the ink box spans the widest line (Red retry R1)
    return { left, top, right, bottom };
}

/**
 * Checks the colours of the plate.
 * @param measure The measurement.
 * @returns The problems.
 */
function colourProblems(measure: FrontMeasure): string[] {
    const problems: string[] = [];
    if (!measure.plate) {
        problems.push('the page holds no front-title part.');
        return problems;
    }
    const colour = toHex(measure.colour);
    if (colour !== AMBER) problems.push(`the data-plaque-colour is "${measure.colour}" (the pin is "#FCD34D").`);
    if (!measure.band) problems.push('the plate holds no band path in the data-plaque-colour value.');
    for (const value of measure.textColours) {
        const hex = toHex(value);
        if (hex !== BROWN) problems.push(`the text colour is "${hex}" (the pin is "#92400E").`);
    }
    for (const value of [...measure.colours, ...measure.textColours]) {
        const hex = toHex(value);
        if (!hex) continue;
        if (!TOKENS.includes(hex)) problems.push(`the plate holds the colour "${hex}" (the token table holds ${TOKENS.join(', ')}).`);
    }
    return problems;
}

/**
 * Checks the geometry of the plate in Chrome.
 * @param measure The measurement.
 * @returns The problems.
 */
function geometryProblems(measure: FrontMeasure): string[] {
    const problems: string[] = [];
    if (!measure.plate) {
        problems.push('the page holds no front-title part.');
        return problems;
    }
    if (!measure.band) {
        problems.push('the plate holds no band path in the data-plaque-colour value.');
        return problems;
    }
    const plate = measure.plate;
    const band = measure.band;
    const pageCentre = (measure.page.left + measure.page.right) / 2;
    const plateCentre = (plate.left + plate.right) / 2;
    const drift = Math.abs(plateCentre - pageCentre);
    if (drift > CENTRE_TOLERANCE_MM) {
        problems.push(`the plate centre is ${plateCentre.toFixed(2)} mm and the page centre is ${pageCentre.toFixed(2)} mm.`);
    }
    const ink = inkBlock(measure);
    if (!ink) {
        problems.push('the plate holds no text.');
        return problems;
    }
    const bandHeight = band.bottom - band.top;
    const inkHeight = ink.bottom - ink.top;
    const share = bandHeight > 0 ? inkHeight / bandHeight : 0;
    if (share < MIN_INK_SHARE || share > MAX_INK_SHARE) {
        problems.push(`the ink block fills ${(share * 100).toFixed(1)} % of the band (the pin is 75 % to 85 %).`);
    }
    const inkCentreX = (ink.left + ink.right) / 2;
    const inkCentreY = (ink.top + ink.bottom) / 2;
    const plateCentreY = (plate.top + plate.bottom) / 2;
    if (Math.abs(inkCentreX - plateCentre) > CENTRE_TOLERANCE_MM) {
        problems.push(`the ink centre is ${inkCentreX.toFixed(2)} mm and the plate centre is ${plateCentre.toFixed(2)} mm.`);
    }
    if (Math.abs(inkCentreY - plateCentreY) > CENTRE_TOLERANCE_MM) {
        problems.push(`the ink centre is ${inkCentreY.toFixed(2)} mm and the plate centre is ${plateCentreY.toFixed(2)} mm.`);
    }
    for (const [index, line] of measure.lines.entries()) {
        if (!liesInside(line, band, INSIDE_TOLERANCE_MM)) {
            problems.push(`the line ${index + 1} leaves the band.`);
        }
    }
    if (measure.level) {
        const gap = measure.level.top - plate.bottom;
        if (gap < 1) problems.push(`the plate and the level plate stand ${gap.toFixed(2)} mm apart (the pin is 1 mm or more).`);
    } else {
        problems.push('the page holds no level plate.');
    }
    return problems;
}

/**
 * Checks the place of the plate against the key boxes of the art and the trim.
 * @param measure The measurement.
 * @param kind The front kind.
 * @returns The problems.
 */
function placeProblems(measure: FrontMeasure, kind: FrontKind): string[] {
    const problems: string[] = [];
    if (!measure.plate) {
        problems.push('the page holds no front-title part.');
        return problems;
    }
    if (!measure.art) {
        problems.push('the page holds no art layer.');
        return problems;
    }
    const plate = measure.plate;
    if (
        plate.left < TRIM_MARGIN_MM ||
        plate.top < TRIM_MARGIN_MM ||
        plate.right > PAGE_WIDTH_MM - TRIM_MARGIN_MM ||
        plate.bottom > PAGE_HEIGHT_MM - TRIM_MARGIN_MM
    ) {
        problems.push(
            `the plate lies at ${plate.left.toFixed(2)} to ${plate.right.toFixed(2)} mm by ${plate.top.toFixed(2)} to ` +
                `${plate.bottom.toFixed(2)} mm (the pin is 5 mm inside the trim).`,
        );
    }
    const keys = readKeys();
    const artFile = kind === 'student-front' ? bookRow().art.studentFront : bookRow().art.teacherFront;
    const entry = keys[artFile];
    if (!entry) {
        problems.push(`the key box file holds no entry for ${artFile}.`);
        return problems;
    }
    const grown = grow(plate, CLEARANCE_MM);
    for (const key of keyBoxesMm(entry, measure.art, measure.objectPosition)) {
        if (overlap(grown, key.box)) {
            problems.push(
                `the plate meets the key box "${key.label}" (${key.kind}) at ${key.box.left.toFixed(2)} to ` +
                    `${key.box.right.toFixed(2)} mm by ${key.box.top.toFixed(2)} to ${key.box.bottom.toFixed(2)} mm.`,
            );
        }
    }
    return problems;
}

/**
 * Checks that a front holds the series name in one plate part.
 * @param doc The parsed document.
 * @returns The problems.
 */
function frontTitleProblems(doc: Document): string[] {
    const problems: string[] = [];
    const parts = Array.from(doc.querySelectorAll('[data-part="front-title"]'));
    if (parts.length !== 1) {
        problems.push(`the page holds ${parts.length} front-title parts (the pin is 1).`);
        return problems;
    }
    const part = parts[0];
    const text = joinedText(part);
    if (text !== 'Storytime Advantage') {
        problems.push(`the part text is "${text}" (the pin is "Storytime Advantage").`);
    }
    const body = doc.body;
    if (!body || !body.contains(part)) problems.push('the part sits outside the body.');
    for (const node of textNodes(part)) {
        const parent = node.parentElement;
        if (!parent) continue;
        if (parent.closest('style, script, title')) problems.push('a text node of the part sits in a style, a script, or a title.');
    }
    if (part.querySelector('img')) problems.push('the part holds an image.');
    for (const image of Array.from(doc.querySelectorAll('img'))) {
        const alt = image.getAttribute('alt') ?? '';
        if (/\b(?:Storytime|Advantage)\b/.test(alt)) problems.push('an image holds the series name in its alt text.');
    }
    return problems;
}

beforeAll(async () => {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
}, 120_000);

afterAll(async () => {
    try {
        if (browser) await browser.close();
    } finally {
        for (const folder of scratch) fs.rmSync(folder, { recursive: true, force: true });
    }
});

describe('quest-cover-f10: T1 to T9 (Red, the r6 book covers with a title on the front)', () => {
    it('T1: each of the 2 book fronts holds one front-title part with the text "Storytime Advantage"', () => {
        for (const kind of KINDS_FRONT) {
            const html = renderFront(kind, HLOGO_OPTIONS);
            const problems = frontTitleProblems(parseHtml(html));
            expect(problems, `the ${kind} front: ${problems.join('; ')}`).toEqual([]);
            const control = replacePart(html, 'front-title', plateHtml({ ...BASE_PLATE, second: '' }));
            const controlProblems = frontTitleProblems(parseHtml(control));
            expect(controlProblems.length, 'the control of T1 fails the check.').toBeGreaterThan(0);
        }
    });

    it('T2: each of the 28 reader fronts holds its own title in its title-plaque part', () => {
        const rows: QuestReaderRow[] = questReaders();
        expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
        let checked = 0;
        for (const row of rows) {
            for (const kind of ['reader-a3', 'reader-leaf'] as const) {
                const html = renderQuestCover(kind, row, { art: ART }, HLOGO_OPTIONS);
                const doc = parseHtml(html);
                const part = doc.querySelector('[data-part="title-plaque"]');
                expect(part, `the ${kind} cover of the row holds a title-plaque part.`).not.toBeNull();
                const wanted = joinedText(part);
                const found = (row.title ?? '').replace(/\s+/g, ' ').trim();
                expect(wanted, `the ${kind} cover holds the title of its row.`).toBe(found);
                checked += 1;
                const control = replacePartText(html, 'title-plaque', 'Another Book Title');
                const controlPart = parseHtml(control).querySelector('[data-part="title-plaque"]');
                expect(joinedText(controlPart), 'the control of T2 fails the check.').not.toBe(found);
            }
        }
        expect(checked, 'the check reads 28 reader covers.').toBe(28);
    });

    it('T3: the plate takes the logo colours, and every colour of the part is in the token table', async () => {
        for (const kind of KINDS_FRONT) {
            const measure = await measureRealFront(kind);
            const problems = colourProblems(measure);
            expect(problems, `the ${kind} plate: ${problems.join('; ')}`).toEqual([]);
            const control = replacePart(
                renderFront(kind, HLOGO_OPTIONS),
                'front-title',
                plateHtml({ ...BASE_PLATE, fill: '#00FF00' }),
            );
            const controlProblems = colourProblems(await measureFront(control));
            expect(controlProblems.length, 'the control of T3 fails the check.').toBeGreaterThan(0);
        }
    }, 120_000);

    it('T4: the plate is centred, the ink fills 75 % to 85 % of the band, and the lines stay inside', async () => {
        for (const kind of KINDS_FRONT) {
            const measure = await measureRealFront(kind);
            const problems = geometryProblems(measure);
            expect(problems, `the ${kind} plate: ${problems.join('; ')}`).toEqual([]);
            const control = replacePart(
                renderFront(kind, HLOGO_OPTIONS),
                'front-title',
                plateHtml({ ...BASE_PLATE, firstSize: '6mm', secondSize: '4mm' }),
            );
            const controlProblems = geometryProblems(await measureFront(control));
            expect(controlProblems.length, 'the control of T4 fails the check.').toBeGreaterThan(0);
        }
    }, 120_000);

    it('T5: the painted plate meets no key box of the art and lies 5 mm inside the trim', async () => {
        for (const kind of KINDS_FRONT) {
            const measure = await measureRealFront(kind);
            const problems = placeProblems(measure, kind);
            expect(problems, `the ${kind} plate: ${problems.join('; ')}`).toEqual([]);
            const control = replacePart(
                renderFront(kind, HLOGO_OPTIONS),
                'front-title',
                plateHtml({ ...BASE_PLATE, left: '0mm', top: '0mm', width: '40mm', height: '20mm' }),
            );
            const controlProblems = placeProblems(await measureFront(control), kind);
            expect(controlProblems.length, 'the control of T5 fails the check.').toBeGreaterThan(0);
        }
    }, 120_000);

    it('T6: the level plate keeps its text, its box, and its bytes of the role base', () => {
        for (const kind of KINDS_FRONT) {
            const doc = parseHtml(renderFront(kind, HLOGO_OPTIONS));
            const part = doc.querySelector('[data-part="title-plaque"]');
            expect(part, `the ${kind} front holds a level plate.`).not.toBeNull();
            expect(joinedText(part), `the ${kind} level plate holds the level line.`).toBe(LEVEL_TEXT[kind]);
            const box = QUEST_BOXES[`${kind}:title-plaque`];
            expect(box, `the box table holds ${kind}:title-plaque.`).toBeDefined();
            expect(box!.leftMm, `the left of ${kind}:title-plaque.`).toBe(LEVEL_BOX.leftMm);
            expect(box!.topMm, `the top of ${kind}:title-plaque.`).toBe(LEVEL_BOX.topMm);
            expect(box!.widthMm, `the width of ${kind}:title-plaque.`).toBe(LEVEL_BOX.widthMm);
            expect(box!.heightMm, `the height of ${kind}:title-plaque.`).toBe(LEVEL_BOX.heightMm);
            const hash = sha256(part!.outerHTML);
            expect(hash, `the SHA-256 of the ${kind} level plate.`).toBe(LEVEL_SHA[kind]);
            const control = replacePartText(renderFront(kind, HLOGO_OPTIONS), 'title-plaque', 'Level 2 · Unit 1 · Wrong Book');
            const controlPart = parseHtml(control).querySelector('[data-part="title-plaque"]');
            expect(joinedText(controlPart), 'the control of T6 fails the check.').not.toBe(LEVEL_TEXT[kind]);
        }
    });

    it('T7: the 2 backs keep the r5 bytes, one logo tile, and no front title', () => {
        for (const kind of KINDS_BACK) {
            const html = renderBack(kind);
            const hash = sha256(html);
            console.log(`T7 ${kind}: sha256 ${hash}`);
            expect(hash, `the SHA-256 of the ${kind} back.`).toBe(BACK_SHA[kind]);
            const doc = parseHtml(html);
            const tiles = Array.from(doc.querySelectorAll('[data-part="logo-tile"]'));
            expect(tiles.length, `the ${kind} back holds one logo tile.`).toBe(1);
            const images = Array.from(tiles[0]!.querySelectorAll('img'));
            expect(images.length, `the ${kind} logo tile holds one image.`).toBe(1);
            const hashOfLogo = hashOfSrc(images[0]!.getAttribute('src') ?? '');
            expect(hashOfLogo, `the logo tile of the ${kind} holds the horizontal logo bytes.`).toBe(SHA_HORIZONTAL_LOGO);
            expect(
                doc.querySelectorAll('[data-part="front-title"]').length,
                `the ${kind} back holds no front-title part.`,
            ).toBe(0);
            const control = html.replace('<body>', '<body> ');
            expect(sha256(control), 'the control of T7 fails the check.').not.toBe(BACK_SHA[kind]);
        }
    });

    it('T8: the default style holds no front title on the 2 fronts', () => {
        for (const kind of KINDS_FRONT) {
            const html = renderFront(kind, BANNER_OPTIONS);
            const doc = parseHtml(html);
            expect(
                doc.querySelectorAll('[data-part="front-title"]').length,
                `the ${kind} front of the default style holds no front-title part.`,
            ).toBe(0);
            const control = replacePart(html, 'front-title', plateHtml(BASE_PLATE));
            expect(
                parseHtml(control).querySelectorAll('[data-part="front-title"]').length,
                'the control of T8 fails the check.',
            ).toBe(1);
        }
    });

    it('T9: each front holds no logo mark and no game bar, and its only image is the art', () => {
        for (const kind of KINDS_FRONT) {
            const doc = parseHtml(renderFront(kind, HLOGO_OPTIONS));
            for (const part of BANNED_PARTS) {
                expect(
                    doc.querySelectorAll(`[data-part="${part}"]`).length,
                    `the ${kind} front holds no ${part} part.`,
                ).toBe(0);
            }
            const images = Array.from(doc.querySelectorAll('img'));
            expect(images.length, `the ${kind} front holds one image.`).toBe(1);
            expect(images[0]!.getAttribute('data-part'), `the only image of the ${kind} front is the art.`).toBe('art');
            const control = replacePart(
                renderFront(kind, HLOGO_OPTIONS),
                'logo-tile',
                '<div data-part="logo-tile" style="position:absolute;left:21.4mm;top:12mm;width:167.2mm;height:54mm"></div>',
            );
            const controlDoc = parseHtml(control);
            expect(
                controlDoc.querySelectorAll('[data-part="logo-tile"]').length,
                'the control of T9 fails the check.',
            ).toBe(1);
        }
    });
});
