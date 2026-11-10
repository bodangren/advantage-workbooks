// @vitest-environment jsdom
/**
 * Red of the logo and the tone of the r5 covers (track storytime_cover_options_20261106, Phase 2,
 * the Task (Red, logo and tone r5) pair of 2026-11-10).
 *
 * The owner words (Daniel, the look note on the r4 covers, Google Tasks U0ZLNVU2bHdsMGhYTmtJcQ,
 * 2026-11-10 12:24, relayed by the PM, word for word): "story Time logo not present the name of
 * story time is not centered vertically and the Chrome should match the tone of the logo text
 * should also fill the Chrome instead of maybe 50%. Back cover text also not centered in chrome".
 *
 * The PM spec of 2026-11-10:
 *   (1) The Storytime Advantage logo replaces the sprout crest above the front title banner, and
 *       replaces the RA badge in the back logo box. The logo file is
 *       content/storytime/covers/logos/storytime-advantage.svg, SHA-256
 *       66175fba578501796664f8a0d2d95db5fc2a1bcc3b818bec19481f847d052fb8. The RA logo is the
 *       small publisher mark of the contact panel. Its file is
 *       content/storytime/covers/logos/reading-advantage.svg, SHA-256
 *       6606fec623b7d3efa9404531ca2b9d0e94b51adcdff473d9ead7e431bc7a8b52.
 *   (2) Every banner, plaque, and frame takes the logo colors: the tile amber #fcd34d and the
 *       mark brown #92400e. The "Storytime" text is brown #92400e. The "Advantage" text is white
 *       with a brown edge. No blue chrome stays.
 *   (3) The title text block fills 80 % or more of the inner band of the front title banner, the
 *       front plaque, and the back title banner.
 *   (4) Every text block is centered in its chrome, and the gap difference is 1 mm or less. The
 *       back panel block and the contact text next to the QR stand in the same rule.
 *   (5) The reader covers do not change in this run. The front plaque takes the amber on every
 *       level. The reader A3 keeps its level colour.
 *
 * The contract of this file:
 *   L1: The 2 logo files sit in content/storytime/covers/logos/ with the approved SHA-256 values.
 *   L2: Each front holds no crest and holds one series logo with the Storytime logo bytes. The
 *       box table holds no crest key and holds a series logo box that is square, 26 mm to 34 mm,
 *       centred at 105 mm, and clear of the series banner.
 *   L3: Each back holds the Storytime logo in the logo box, and the RA logo as the publisher
 *       mark. The publisher mark box is square, 16 mm or less, inside the contact sign, and clear
 *       of the QR and of the line label. The logo box keeps its box.
 *   C1: Every color of every chrome part is in the logo palette. No shadow and no opacity under 1
 *       sits on a chrome part.
 *   C2: The band of every series banner and of every front plaque is amber. The 2 front plaques
 *       carry data-plaque-colour "#FCD34D".
 *   C3: The series name takes the logo colors in every series banner, the front plaque takes the
 *       brown, and the panel headings of the student back take the brown.
 *   F1: The title text fills 80 % or more of its band, lies inside the band, and touches no
 *       ornament.
 *   V1: Every title text block is centered in its band, vertically and horizontally.
 *   V2: The panel block of the student back is centered in the panel.
 *   V3: The contact block of both backs is centered in the sign, and stands left of the QR.
 *
 * The template takes the 2 logo files from content/storytime/covers/logos/, so the test renders
 * with no logo asset. The test reads no art file. The 2 backs render the 5 contact lines, which
 * hold Thai. The file prints no text of a back: it prints millimetre values, counts, colors, and
 * part names only.
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
    renderQuestCover,
    type QuestBookRow,
    type QuestPanelValue,
} from '../lib/storytime/print/cover-quest';
import { loadStorytimeCoverBooks, storytimeCoverPanelValues } from '../lib/storytime/print/covers';
import { STORYTIME_ROOT, readLevelWeeks, readPhonicsGraph } from '../lib/storytime/files';

/** The art string of the renders. The test reads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The millimetres of one pixel: 96 px is 25.4 mm. */
const MM_PER_PX = 25.4 / 96;

/** The 2 front kinds of this file. */
const KINDS_FRONT = ['student-front', 'teacher-front'] as const;

/** The 2 back kinds of this file. */
const KINDS_BACK = ['student-back', 'teacher-back'] as const;

/** The 4 kinds of this file. */
const KINDS = [...KINDS_FRONT, ...KINDS_BACK] as const;

/** The 4 kinds of this file, as a plain array of strings. */
type Kind = (typeof KINDS)[number];

/** The logo palette of the r5 covers: the tile amber, the mark brown, and 3 light tones. */
const PALETTE = ['#fcd34d', '#92400e', '#ffffff', '#fef3c7', '#fffbeb'];

/** The amber of the logo tile. */
const AMBER = '#fcd34d';

/** The brown of the logo mark. */
const BROWN = '#92400e';

/** The white of the logo text. */
const WHITE = '#ffffff';

/** The SHA-256 of the Storytime Advantage logo. */
const SHA_STORYTIME_LOGO = '66175fba578501796664f8a0d2d95db5fc2a1bcc3b818bec19481f847d052fb8';

/** The SHA-256 of the Reading Advantage logo. */
const SHA_READING_LOGO = '6606fec623b7d3efa9404531ca2b9d0e94b51adcdff473d9ead7e431bc7a8b52';

/** The repo root. */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The folder of the 2 logo files. */
const logoDir = path.join(repoRoot, 'content', 'storytime', 'covers', 'logos');

/** The file of the Storytime Advantage logo. */
const storytimeLogoFile = path.join(logoDir, 'storytime-advantage.svg');

/** The file of the Reading Advantage logo. */
const readingLogoFile = path.join(logoDir, 'reading-advantage.svg');

/** The tolerance of the fit checks, in millimetres. */
const TOLERANCE_MM = 0.1;

/** The largest gap difference of a centered block, in millimetres. */
const CENTRE_TOLERANCE_MM = 1;

/** The least share of the band that a title text fills. */
const MIN_FILL_SHARE = 0.8;

/** The centre of a front, in millimetres. */
const FRONT_CENTRE_MM = 105;

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

/** One box in millimetres. */
interface Box {
    /** The left edge. */
    leftMm: number;
    /** The top edge. */
    topMm: number;
    /** The right edge. */
    rightMm: number;
    /** The bottom edge. */
    bottomMm: number;
}

/** One color of one element. */
interface RawColour {
    /** The name of the element. */
    who: string;
    /** The name of the property. */
    what: string;
    /** The value of the property. */
    value: string;
}

/** One shape of one chrome part. */
interface RawShape {
    /** The tag of the shape. */
    tag: string;
    /** The computed fill. */
    fill: string;
    /** The computed stroke. */
    stroke: string;
    /** The box of the shape. */
    rect: RawBox;
}

/** The text styles of one element. */
interface RawTextStyle {
    /** The computed text color. */
    color: string;
    /** The computed webkit text stroke width. */
    strokeWidth: string;
    /** The computed webkit text stroke color. */
    strokeColor: string;
}

/** One word of the series name, with its text styles. */
interface RawWord {
    /** The word. */
    word: string;
    /** The styles of the element, or null when the page holds no such element. */
    style: RawTextStyle | null;
}

/** One marked element of the frame, with its text styles. */
interface RawMark {
    /** The part mark of the element. */
    part: string;
    /** The text styles of the element. */
    style: RawTextStyle;
}

/** The measurement of one chrome part. */
interface RawPart {
    /** The part mark. */
    part: string;
    /** The box of the part. */
    rect: RawBox;
    /** The inner band of the part, or null when the part holds no band. */
    band: RawBox | null;
    /** The computed fill of the band. */
    bandFill: string | null;
    /** The shapes of the part. */
    shapes: RawShape[];
    /** The boxes of the ornament groups of the part. */
    groups: RawBox[];
    /** The boxes of the text nodes of the part. */
    texts: RawBox[];
    /** The background and border colors of the part and of its div and span descendants. */
    colours: RawColour[];
    /** The text shadows of the part and of its descendants. */
    shadows: RawColour[];
    /** The opacities under 1 of the part and of its descendants. */
    opacities: RawColour[];
    /** The data-plaque-colour of the part, or null when the part holds none. */
    plaqueColour: string | null;
}

/** The measurement of the back panel. */
interface RawPanel {
    /** The box of the panel. */
    rect: RawBox;
    /** The computed border widths of the panel, in pixels. */
    borders: { top: number; right: number; bottom: number; left: number };
}

/** The measurement of one kind. */
interface RawKind {
    /** The chrome parts of the page. */
    parts: RawPart[];
    /** The boxes of the extra parts, by part mark. */
    rects: Record<string, RawBox>;
    /** The back panel, or null when the page holds none. */
    panel: RawPanel | null;
    /** The boxes of the panel fields. */
    fields: RawBox[];
    /** The boxes of the text nodes of the contact lines. */
    contactTexts: RawBox[];
    /** The words of the series name. */
    words: RawWord[];
    /** The marked elements of the frame. */
    marks: RawMark[];
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of the tone checks. */
let browser: Browser | undefined;

/** The measurements of the kinds, by kind. */
const measurements = new Map<Kind, RawKind>();

/**
 * Converts one box of the browser to millimetres.
 * @param box The box, in pixels.
 * @returns The box, in millimetres.
 */
function toMm(box: RawBox): Box {
    return {
        leftMm: box.left * MM_PER_PX,
        topMm: box.top * MM_PER_PX,
        rightMm: box.right * MM_PER_PX,
        bottomMm: box.bottom * MM_PER_PX,
    };
}

/**
 * Takes the union of a list of boxes.
 * @param boxes The boxes, in pixels.
 * @returns The union, or null when no box has an area.
 */
function unionOf(boxes: RawBox[]): RawBox | null {
    const usable = boxes.filter((box) => box.right > box.left && box.bottom > box.top);
    if (usable.length === 0) return null;
    return {
        left: Math.min(...usable.map((box) => box.left)),
        top: Math.min(...usable.map((box) => box.top)),
        right: Math.max(...usable.map((box) => box.right)),
        bottom: Math.max(...usable.map((box) => box.bottom)),
    };
}

/**
 * Converts one computed color to a lower case hex value.
 * @param value The computed color.
 * @returns The hex value.
 */
function toHex(value: string): string {
    const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
    if (!match) return value.trim().toLowerCase();
    const hex = [match[1], match[2], match[3]]
        .map((part) => Number.parseInt(part, 10).toString(16).padStart(2, '0'))
        .join('');
    return `#${hex}`;
}

/**
 * Tells when one box lies inside another box, with a tolerance.
 * @param text The first box.
 * @param band The second box.
 * @returns True when the first box lies inside the second box.
 */
function liesInside(text: Box, band: Box): boolean {
    return (
        text.leftMm >= band.leftMm - TOLERANCE_MM &&
        text.rightMm <= band.rightMm + TOLERANCE_MM &&
        text.topMm >= band.topMm - TOLERANCE_MM &&
        text.bottomMm <= band.bottomMm + TOLERANCE_MM
    );
}

/**
 * Tells when two boxes share an area, with a tolerance.
 * @param first The first box.
 * @param second The second box.
 * @returns True when the boxes share an area.
 */
function overlaps(first: Box, second: Box): boolean {
    const overlapX = Math.min(first.rightMm, second.rightMm) - Math.max(first.leftMm, second.leftMm);
    const overlapY = Math.min(first.bottomMm, second.bottomMm) - Math.max(first.topMm, second.topMm);
    return overlapX > TOLERANCE_MM && overlapY > TOLERANCE_MM;
}

/**
 * Tells when two boxes of the box table share an area.
 * @param first The first box, in millimetres.
 * @param second The second box, in millimetres.
 * @returns True when the boxes share an area.
 */
function boxesIntersect(
    first: { leftMm: number; topMm: number; widthMm: number; heightMm: number },
    second: { leftMm: number; topMm: number; widthMm: number; heightMm: number },
): boolean {
    const overlapX =
        Math.min(first.leftMm + first.widthMm, second.leftMm + second.widthMm) - Math.max(first.leftMm, second.leftMm);
    const overlapY =
        Math.min(first.topMm + first.heightMm, second.topMm + second.heightMm) - Math.max(first.topMm, second.topMm);
    return overlapX > 0 && overlapY > 0;
}

/**
 * Writes the measured values of one box in a readable form.
 * @param box The box.
 * @returns The text.
 */
function showBox(box: Box): string {
    return (
        `left ${box.leftMm.toFixed(2)} mm, top ${box.topMm.toFixed(2)} mm, ` +
        `right ${box.rightMm.toFixed(2)} mm, bottom ${box.bottomMm.toFixed(2)} mm`
    );
}

/**
 * Shortens a list of problems for a failure message.
 * @param problems The problems.
 * @returns The text.
 */
function summarise(problems: string[]): string {
    const head = problems.slice(0, 10).join('; ');
    return problems.length > 10 ? `${problems.length} problems: ${head}` : head;
}

/**
 * Reads the bytes of one file.
 * @param file The file.
 * @returns The bytes, or null when the file does not exist.
 */
function bytesOfFile(file: string): Uint8Array | null {
    if (!fs.existsSync(file)) return null;
    return new Uint8Array(fs.readFileSync(file));
}

/**
 * Reads the bytes of one source of an image.
 * @param src The source: a file URL or a data URL.
 * @returns The bytes, or null when the source holds no readable bytes.
 */
function bytesOfSrc(src: string): Uint8Array | null {
    if (src.startsWith('data:')) {
        const comma = src.indexOf(',');
        if (comma < 0) return null;
        const head = src.slice(5, comma);
        const payload = src.slice(comma + 1);
        if (!head.endsWith(';base64')) return new TextEncoder().encode(decodeURIComponent(payload));
        let binary: string;
        try {
            binary = atob(payload);
        } catch {
            return null;
        }
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return bytes;
    }
    if (src.startsWith('file://')) {
        try {
            return bytesOfFile(fileURLToPath(src));
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Reads the SHA-256 of one file.
 * @param file The file.
 * @returns The hash.
 */
function hashOfFile(file: string): string {
    const bytes = bytesOfFile(file);
    expect(bytes, `the file ${path.basename(file)} holds bytes.`).not.toBeNull();
    return createHash('sha256').update(bytes!).digest('hex');
}

/**
 * Reads the SHA-256 of the bytes of one image source.
 * @param src The source.
 * @param who The name of the element, for the failure message.
 * @returns The hash.
 */
function hashOfSrc(src: string, who: string): string {
    const bytes = bytesOfSrc(src);
    expect(bytes, `the image source of the ${who} holds bytes.`).not.toBeNull();
    return createHash('sha256').update(bytes!).digest('hex');
}

/**
 * Parses one rendered document.
 * @param html The rendered HTML.
 * @returns The document.
 */
function parseHtml(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Renders one front of the shipped Level 2 Unit 1 row.
 * @param kind The front kind.
 * @returns The page document.
 */
function frontHtml(kind: 'student-front' | 'teacher-front'): string {
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    const book: QuestBookRow = data.books[0];
    return renderQuestCover(kind, book, { art: ART }, { bleedMm: 0 });
}

/**
 * The panel values of the shipped Level 2 Unit 1 row.
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
 * Renders one back of the shipped Level 2 Unit 1 row.
 * @param kind The back kind.
 * @returns The page document.
 */
function backHtml(kind: 'student-back' | 'teacher-back'): string {
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    const book: QuestBookRow = data.books[0];
    const assets = kind === 'student-back' ? { art: ART, panelValues: panelValues() } : { art: ART };
    return renderQuestCover(kind, book, assets, { bleedMm: 0 });
}

/**
 * Measures one kind in Chrome.
 * @param kind The cover kind.
 * @returns The measurement.
 */
async function measureKind(kind: Kind): Promise<RawKind> {
    const cached = measurements.get(kind);
    if (cached) return cached;
    const active = browser;
    if (!active) throw new Error('the browser of the tone check did not start');
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-tone-'));
    scratch.push(folder);
    const file = path.join(folder, `${kind}.html`);
    const html = kind === 'student-front' || kind === 'teacher-front' ? frontHtml(kind) : backHtml(kind);
    fs.writeFileSync(file, html);
    const context = await active.newContext({ viewport: { width: 900, height: 1300 } });
    const page = await context.newPage();
    try {
        await page.goto(pathToFileURL(file).href);
        await page.evaluate(() => document.fonts.ready);
        expect(
            await page.evaluate(() => document.fonts.check('16px "League Spartan"')),
            'the League Spartan font loads in the browser',
        ).toBe(true);
        const raw = await page.evaluate((): RawKind => {
            /** The chrome parts of the tone check. */
            const CHROME_PARTS = [
                'series-banner',
                'title-plaque',
                'band-pill',
                'logo-box',
                'series-logo',
                'panel',
                'contact-sign',
                'qr',
            ];
            /** The extra parts of the geometry check. */
            const EXTRA_PARTS = ['publisher-mark', 'line-label'];
            /** The marked elements of the color check. */
            const MARK_PARTS = ['level-line', 'book-line', 'panel-heading'];
            /** The words of the series name. */
            const WORDS = ['Storytime', 'Advantage'];

            /**
             * Reads the box of one element.
             * @param element The element.
             * @returns The box, in pixels.
             */
            const boxOf = (element: Element): RawBox => {
                const rect = element.getBoundingClientRect();
                return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
            };
            /**
             * Reads the boxes of the text nodes of one element.
             * @param root The element.
             * @returns The boxes, in pixels.
             */
            const textBoxes = (root: Element): RawBox[] => {
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
                const boxes: RawBox[] = [];
                while (walker.nextNode()) {
                    const node = walker.currentNode as Text;
                    if (!(node.nodeValue ?? '').trim()) continue;
                    const range = document.createRange();
                    range.selectNodeContents(node);
                    const rect = range.getBoundingClientRect();
                    if (rect.right <= rect.left || rect.bottom <= rect.top) continue;
                    boxes.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
                }
                return boxes;
            };
            /**
             * Tells when one computed color is fully transparent.
             * @param value The computed color.
             * @returns True when the color is transparent.
             */
            const transparent = (value: string): boolean => {
                const match = /^rgba?\(([^)]+)\)$/.exec(value);
                if (!match) return false;
                const parts = match[1].split(',').map((one) => Number.parseFloat(one.trim()));
                return parts.length > 3 && parts[3] === 0;
            };
            /**
             * Reads the text styles of one element.
             * @param element The element.
             * @returns The styles.
             */
            const styleOf = (element: Element): RawTextStyle => {
                const style = window.getComputedStyle(element);
                return {
                    color: style.color,
                    strokeWidth: style.webkitTextStrokeWidth,
                    strokeColor: style.webkitTextStrokeColor,
                };
            };
            /**
             * Finds the element that holds one word alone.
             * @param root The element.
             * @param word The word.
             * @returns The element, or null when the page holds none.
             */
            const wordElement = (root: Element, word: string): Element | null => {
                const found = Array.from(root.querySelectorAll('*')).filter(
                    (element) => (element.textContent ?? '').trim() === word && element.children.length === 0,
                );
                return found.length > 0 ? found[0] : null;
            };

            const parts: RawPart[] = [];
            const rects: Record<string, RawBox> = {};
            for (const name of [...CHROME_PARTS, ...EXTRA_PARTS]) {
                const element = document.querySelector(`[data-part="${name}"]`);
                if (!element) continue;
                const rect = boxOf(element);
                rects[name] = rect;
                if (!CHROME_PARTS.includes(name)) continue;
                const partArea = (rect.right - rect.left) * (rect.bottom - rect.top);
                const candidates = Array.from(element.querySelectorAll('path, rect')).filter((shape) => {
                    const shapeRect = shape.getBoundingClientRect();
                    return (shapeRect.right - shapeRect.left) * (shapeRect.bottom - shapeRect.top) >= 0.5 * partArea;
                });
                let band: RawBox | null = null;
                let bandFill: string | null = null;
                if (candidates.length > 0) {
                    const sorted = candidates.slice().sort((one, two) => {
                        const first = one.getBoundingClientRect();
                        const second = two.getBoundingClientRect();
                        return (
                            (first.right - first.left) * (first.bottom - first.top) -
                            (second.right - second.left) * (second.bottom - second.top)
                        );
                    });
                    const best = sorted[0];
                    band = boxOf(best);
                    bandFill = window.getComputedStyle(best).fill;
                }
                const shapes: RawShape[] = [];
                for (const shape of Array.from(element.querySelectorAll('path, rect, circle, line, polygon, ellipse'))) {
                    if (shape.closest('[data-part="qr"]')) continue;
                    const style = window.getComputedStyle(shape);
                    shapes.push({
                        tag: shape.tagName.toLowerCase(),
                        fill: style.fill,
                        stroke: style.stroke,
                        rect: boxOf(shape),
                    });
                }
                const groups: RawBox[] = [];
                const svg = element.querySelector('svg');
                if (svg) {
                    for (const group of Array.from(svg.querySelectorAll('g'))) groups.push(boxOf(group));
                }
                const colours: RawColour[] = [];
                const shadows: RawColour[] = [];
                const opacities: RawColour[] = [];
                const describe = (target: Element, who: string): void => {
                    const style = window.getComputedStyle(target);
                    const background = style.backgroundColor;
                    if (background && !transparent(background)) {
                        colours.push({ who, what: 'background-color', value: background });
                    }
                    const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
                    for (const side of sides) {
                        const width = Number.parseFloat(style[`border${side}Width`]);
                        if (Number.isFinite(width) && width > 0) {
                            colours.push({
                                who,
                                what: `border-${side.toLowerCase()}-color`,
                                value: style[`border${side}Color`],
                            });
                        }
                    }
                };
                describe(element, name);
                for (const child of Array.from(element.querySelectorAll('div, span'))) {
                    if (child.closest('[data-part="qr"]')) continue;
                    const mark = child.getAttribute('data-part');
                    describe(child, mark ? `${name} > ${mark}` : `${name} > ${child.tagName.toLowerCase()}`);
                }
                for (const target of [element, ...Array.from(element.querySelectorAll('*'))]) {
                    const style = window.getComputedStyle(target);
                    const who = target.getAttribute('data-part') ?? target.tagName.toLowerCase();
                    if (style.textShadow && style.textShadow !== 'none') {
                        shadows.push({ who, what: 'text-shadow', value: style.textShadow });
                    }
                    const opacity = Number.parseFloat(style.opacity);
                    if (Number.isFinite(opacity) && opacity < 1) {
                        opacities.push({ who, what: 'opacity', value: String(opacity) });
                    }
                }
                parts.push({
                    part: name,
                    rect,
                    band,
                    bandFill,
                    shapes,
                    groups,
                    texts: textBoxes(element),
                    colours,
                    shadows,
                    opacities,
                    plaqueColour: element.getAttribute('data-plaque-colour'),
                });
            }

            const panelElement = document.querySelector('[data-part="panel"]');
            let panel: RawPanel | null = null;
            if (panelElement) {
                const style = window.getComputedStyle(panelElement);
                panel = {
                    rect: boxOf(panelElement),
                    borders: {
                        top: Number.parseFloat(style.borderTopWidth),
                        right: Number.parseFloat(style.borderRightWidth),
                        bottom: Number.parseFloat(style.borderBottomWidth),
                        left: Number.parseFloat(style.borderLeftWidth),
                    },
                };
            }
            const fields: RawBox[] = Array.from(document.querySelectorAll('[data-part="panel-field"]')).map((element) =>
                boxOf(element),
            );
            const contactTexts: RawBox[] = [];
            for (const line of Array.from(document.querySelectorAll('[data-part="contact-line"]'))) {
                contactTexts.push(...textBoxes(line));
            }
            const words: RawWord[] = [];
            for (const banner of Array.from(document.querySelectorAll('[data-part="series-banner"]'))) {
                for (const word of WORDS) {
                    const element = wordElement(banner, word);
                    words.push({ word, style: element ? styleOf(element) : null });
                }
            }
            const marks: RawMark[] = [];
            for (const part of MARK_PARTS) {
                for (const element of Array.from(document.querySelectorAll(`[data-part="${part}"]`))) {
                    marks.push({ part, style: styleOf(element) });
                }
            }
            return { parts, rects, panel, fields, contactTexts, words, marks };
        });
        measurements.set(kind, raw);
        return raw;
    } finally {
        await context.close();
    }
}

/**
 * Finds one chrome part of one measurement.
 * @param raw The measurement.
 * @param part The part mark.
 * @returns The part.
 */
function partOf(raw: RawKind, part: string): RawPart {
    const found = raw.parts.find((one) => one.part === part);
    expect(found, `the page holds the part ${part}.`).toBeDefined();
    return found!;
}

/**
 * Reads the union of the text of one part, in millimetres.
 * @param part The part.
 * @returns The box of the text.
 */
function textBoxOf(part: RawPart): Box {
    const union = unionOf(part.texts);
    expect(union, `the part ${part.part} holds a text.`).not.toBeNull();
    return toMm(union!);
}

/**
 * Reads the inner band of one part, in millimetres.
 * @param part The part.
 * @returns The box of the band.
 */
function bandBoxOf(part: RawPart): Box {
    expect(part.band, `the part ${part.part} holds an inner band.`).not.toBeNull();
    return toMm(part.band!);
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

describe('quest-cover-logo-tone: L1 to L3, C1 to C3, F1, V1 to V3 (Red, logo and tone r5)', () => {
    it('L1: the 2 logo files sit in the logo folder with the approved hashes', () => {
        for (const [file, hash] of [
            [storytimeLogoFile, SHA_STORYTIME_LOGO],
            [readingLogoFile, SHA_READING_LOGO],
        ] as const) {
            expect(
                fs.existsSync(file),
                `the logo file ${path.basename(file)} sits in content/storytime/covers/logos/.`,
            ).toBe(true);
            expect(hashOfFile(file), `the SHA-256 of ${path.basename(file)}.`).toBe(hash);
        }
    });

    it('L2: each front holds the Storytime logo and no crest', () => {
        for (const kind of KINDS_FRONT) {
            const doc = parseHtml(frontHtml(kind));
            expect(doc.querySelectorAll('[data-part="crest"]').length, `${kind} holds no crest.`).toBe(0);
            const logos = doc.querySelectorAll('[data-part="series-logo"]');
            expect(logos.length, `${kind} holds one series logo.`).toBe(1);
            const part = logos[0];
            const images =
                part.tagName.toLowerCase() === 'img' ? [part] : Array.from(part.querySelectorAll('img'));
            expect(images.length, `${kind} series logo holds one image.`).toBe(1);
            const src = images[0].getAttribute('src') ?? '';
            expect(hashOfSrc(src, `${kind} series logo`), `the series logo of ${kind} holds the Storytime bytes.`).toBe(
                SHA_STORYTIME_LOGO,
            );
            expect(QUEST_BOXES[`${kind}:crest`], `the box table holds no ${kind}:crest key.`).toBeUndefined();
            const logo = QUEST_BOXES[`${kind}:series-logo`];
            expect(logo, `the box table holds ${kind}:series-logo.`).toBeDefined();
            expect(logo.widthMm, `${kind} series logo width equals its height.`).toBeCloseTo(logo.heightMm, 6);
            expect(logo.widthMm, `${kind} series logo width is 26 mm to 34 mm.`).toBeGreaterThanOrEqual(26);
            expect(logo.widthMm, `${kind} series logo width is 26 mm to 34 mm.`).toBeLessThanOrEqual(34);
            expect(
                Math.abs(logo.leftMm + logo.widthMm / 2 - FRONT_CENTRE_MM),
                `${kind} series logo centre is 105 mm.`,
            ).toBeLessThanOrEqual(0.5);
            expect(logo.topMm, `${kind} series logo top is 5 mm or more.`).toBeGreaterThanOrEqual(5);
            const banner = QUEST_BOXES[`${kind}:series-banner`];
            expect(banner, `the box table holds ${kind}:series-banner.`).toBeDefined();
            expect(
                logo.topMm + logo.heightMm,
                `${kind} series logo bottom is 1 mm above the top of the series banner.`,
            ).toBeLessThanOrEqual(banner.topMm - 1);
        }
    });

    it('L3: each back holds the Storytime logo in the logo box and the RA logo as the publisher mark', () => {
        for (const kind of KINDS_BACK) {
            const doc = parseHtml(backHtml(kind));
            const logoBox = doc.querySelector('[data-part="logo-box"]');
            expect(logoBox, `${kind} holds a logo box.`).not.toBeNull();
            const boxImages = Array.from(logoBox!.querySelectorAll('img'));
            expect(boxImages.length, `${kind} logo box holds one image.`).toBe(1);
            expect(
                hashOfSrc(boxImages[0].getAttribute('src') ?? '', `${kind} logo box`),
                `the logo box of ${kind} holds the Storytime bytes.`,
            ).toBe(SHA_STORYTIME_LOGO);
            const marks = doc.querySelectorAll('[data-part="publisher-mark"]');
            expect(marks.length, `${kind} holds one publisher mark.`).toBe(1);
            const markElement = marks[0];
            const markImages =
                markElement.tagName.toLowerCase() === 'img'
                    ? [markElement]
                    : Array.from(markElement.querySelectorAll('img'));
            expect(markImages.length, `${kind} publisher mark holds one image.`).toBe(1);
            expect(
                hashOfSrc(markImages[0].getAttribute('src') ?? '', `${kind} publisher mark`),
                `the publisher mark of ${kind} holds the RA bytes.`,
            ).toBe(SHA_READING_LOGO);
            const mark = QUEST_BOXES[`${kind}:publisher-mark`];
            expect(mark, `the box table holds ${kind}:publisher-mark.`).toBeDefined();
            expect(mark.widthMm, `${kind} publisher mark width equals its height.`).toBeCloseTo(mark.heightMm, 6);
            expect(mark.widthMm, `${kind} publisher mark is 16 mm or less.`).toBeLessThanOrEqual(16);
            const sign = QUEST_BOXES[`${kind}:contact-sign`];
            expect(sign, `the box table holds ${kind}:contact-sign.`).toBeDefined();
            expect(mark.leftMm, `${kind} publisher mark left is 3 mm inside the contact sign.`).toBeGreaterThanOrEqual(
                sign.leftMm + 3,
            );
            expect(mark.topMm, `${kind} publisher mark top is 3 mm inside the contact sign.`).toBeGreaterThanOrEqual(
                sign.topMm + 3,
            );
            expect(
                mark.leftMm + mark.widthMm,
                `${kind} publisher mark right is 3 mm inside the contact sign.`,
            ).toBeLessThanOrEqual(sign.leftMm + sign.widthMm - 3);
            expect(
                mark.topMm + mark.heightMm,
                `${kind} publisher mark bottom is 3 mm inside the contact sign.`,
            ).toBeLessThanOrEqual(sign.topMm + sign.heightMm - 3);
            const qr = QUEST_BOXES[`${kind}:qr`];
            expect(qr, `the box table holds ${kind}:qr.`).toBeDefined();
            expect(boxesIntersect(mark, qr), `${kind} publisher mark is clear of the QR.`).toBe(false);
            const label = QUEST_BOXES[`${kind}:line-label`];
            expect(label, `the box table holds ${kind}:line-label.`).toBeDefined();
            expect(boxesIntersect(mark, label), `${kind} publisher mark is clear of the line label.`).toBe(false);
            const logo = QUEST_BOXES[`${kind}:logo-box`];
            expect(logo.leftMm, `${kind} logo box left.`).toBe(10);
            expect(logo.topMm, `${kind} logo box top.`).toBe(9);
            expect(logo.widthMm, `${kind} logo box width.`).toBe(34);
            expect(logo.heightMm, `${kind} logo box height.`).toBe(34);
        }
    });

    it('C1: every color of every chrome part is in the logo palette', async () => {
        for (const kind of KINDS) {
            const raw = await measureKind(kind);
            const problems: string[] = [];
            for (const part of raw.parts) {
                for (const shape of part.shapes) {
                    if (shape.fill && shape.fill !== 'none' && !PALETTE.includes(toHex(shape.fill))) {
                        problems.push(`${part.part} ${shape.tag} fill ${toHex(shape.fill)}`);
                    }
                    if (shape.stroke && shape.stroke !== 'none' && !PALETTE.includes(toHex(shape.stroke))) {
                        problems.push(`${part.part} ${shape.tag} stroke ${toHex(shape.stroke)}`);
                    }
                }
                for (const colour of part.colours) {
                    if (!PALETTE.includes(toHex(colour.value))) {
                        problems.push(`${part.part} ${colour.who} ${colour.what} ${toHex(colour.value)}`);
                    }
                }
                for (const shadow of part.shadows) {
                    problems.push(`${part.part} ${shadow.who} text-shadow ${shadow.value}`);
                }
                for (const opacity of part.opacities) {
                    problems.push(`${part.part} ${opacity.who} opacity ${opacity.value}`);
                }
            }
            expect(
                problems.length,
                `every color of every chrome part of the ${kind} is in the logo palette: ${summarise(problems)}`,
            ).toBe(0);
        }
    }, 300_000);

    it('C2: every series banner and every front plaque takes the amber band', async () => {
        for (const kind of KINDS) {
            const raw = await measureKind(kind);
            const banner = partOf(raw, 'series-banner');
            expect(banner.band, `the series banner of the ${kind} holds an inner band.`).not.toBeNull();
            expect(toHex(banner.bandFill ?? ''), `the series banner band fill of the ${kind}.`).toBe(AMBER);
        }
        for (const kind of KINDS_FRONT) {
            const raw = await measureKind(kind);
            const plaque = partOf(raw, 'title-plaque');
            expect(plaque.band, `the title plaque of the ${kind} holds an inner band.`).not.toBeNull();
            expect(toHex(plaque.bandFill ?? ''), `the title plaque band fill of the ${kind}.`).toBe(AMBER);
            expect(
                (plaque.plaqueColour ?? '').toLowerCase(),
                `the data-plaque-colour of the ${kind} front plaque.`,
            ).toBe(AMBER);
        }
    }, 300_000);

    it('C3: the series name, the front plaque, and the panel headings take the logo colors', async () => {
        for (const kind of KINDS) {
            const raw = await measureKind(kind);
            const storytime = raw.words.find((entry) => entry.word === 'Storytime');
            expect(storytime?.style, `the series banner of the ${kind} holds the word Storytime.`).not.toBeNull();
            expect(toHex(storytime!.style!.color), `the Storytime color of the ${kind}.`).toBe(BROWN);
            const advantage = raw.words.find((entry) => entry.word === 'Advantage');
            expect(advantage?.style, `the series banner of the ${kind} holds the word Advantage.`).not.toBeNull();
            expect(toHex(advantage!.style!.color), `the Advantage color of the ${kind}.`).toBe(WHITE);
            expect(
                Number.parseFloat(advantage!.style!.strokeWidth),
                `the Advantage text stroke width of the ${kind} is over 0 px.`,
            ).toBeGreaterThan(0);
            expect(toHex(advantage!.style!.strokeColor), `the Advantage text stroke color of the ${kind}.`).toBe(BROWN);
        }
        for (const kind of KINDS_FRONT) {
            const raw = await measureKind(kind);
            const level = raw.marks.find((mark) => mark.part === 'level-line');
            expect(level, `the front plaque of the ${kind} holds the level line.`).toBeDefined();
            expect(toHex(level!.style.color), `the level line color of the ${kind}.`).toBe(BROWN);
            const book = raw.marks.find((mark) => mark.part === 'book-line');
            expect(book, `the front plaque of the ${kind} holds the book line.`).toBeDefined();
            const color = toHex(book!.style.color);
            const stroke = toHex(book!.style.strokeColor);
            expect(
                color === BROWN || (color === WHITE && stroke === BROWN),
                `the book line color of the ${kind} is ${color} with the stroke ${stroke}.`,
            ).toBe(true);
        }
        const student = await measureKind('student-back');
        const headings = student.marks.filter((mark) => mark.part === 'panel-heading');
        expect(headings.length, 'the student back holds 5 panel headings.').toBe(5);
        for (const heading of headings) {
            expect(toHex(heading.style.color), 'the panel heading color of the student back.').toBe(BROWN);
        }
    }, 300_000);

    it('F1: the title text fills 80 % or more of its band and stays inside it', async () => {
        const cases: Array<[Kind, string]> = [
            ['student-front', 'series-banner'],
            ['teacher-front', 'series-banner'],
            ['student-front', 'title-plaque'],
            ['teacher-front', 'title-plaque'],
            ['student-back', 'series-banner'],
            ['teacher-back', 'series-banner'],
        ];
        for (const [kind, name] of cases) {
            const raw = await measureKind(kind);
            const part = partOf(raw, name);
            const band = bandBoxOf(part);
            const text = textBoxOf(part);
            const share = (text.bottomMm - text.topMm) / (band.bottomMm - band.topMm);
            expect(
                share,
                `the ${kind} ${name} text fills its band: the text is ` +
                    `${(text.bottomMm - text.topMm).toFixed(2)} mm, the band is ` +
                    `${(band.bottomMm - band.topMm).toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(MIN_FILL_SHARE);
            expect(
                liesInside(text, band),
                `the ${kind} ${name} text lies inside its band within 0.1 mm: the text is ` +
                    `${showBox(text)}, the band is ${showBox(band)}.`,
            ).toBe(true);
            for (const group of part.groups) {
                const ornament = toMm(group);
                expect(
                    overlaps(text, ornament),
                    `the ${kind} ${name} text touches an ornament (${showBox(ornament)}).`,
                ).toBe(false);
            }
        }
    }, 300_000);

    it('V1: every title text block is centered in its band', async () => {
        const cases: Array<[Kind, string]> = [
            ['student-front', 'series-banner'],
            ['teacher-front', 'series-banner'],
            ['student-front', 'title-plaque'],
            ['teacher-front', 'title-plaque'],
            ['student-back', 'series-banner'],
            ['teacher-back', 'series-banner'],
        ];
        for (const [kind, name] of cases) {
            const raw = await measureKind(kind);
            const part = partOf(raw, name);
            const band = bandBoxOf(part);
            const text = textBoxOf(part);
            const topGap = text.topMm - band.topMm;
            const bottomGap = band.bottomMm - text.bottomMm;
            expect(
                Math.abs(topGap - bottomGap),
                `the ${kind} ${name} text is centered vertically: the top gap is ${topGap.toFixed(2)} mm, ` +
                    `the bottom gap is ${bottomGap.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(CENTRE_TOLERANCE_MM);
            const leftGap = text.leftMm - band.leftMm;
            const rightGap = band.rightMm - text.rightMm;
            expect(
                Math.abs(leftGap - rightGap),
                `the ${kind} ${name} text is centered horizontally: the left gap is ${leftGap.toFixed(2)} mm, ` +
                    `the right gap is ${rightGap.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(CENTRE_TOLERANCE_MM);
        }
    }, 300_000);

    it('V2: the panel block of the student back is centered in the panel', async () => {
        const raw = await measureKind('student-back');
        expect(raw.panel, 'the student back holds a panel.').not.toBeNull();
        const panel = toMm(raw.panel!.rect);
        const borders = raw.panel!.borders;
        const inner: Box = {
            leftMm: panel.leftMm + borders.left * MM_PER_PX,
            topMm: panel.topMm + borders.top * MM_PER_PX,
            rightMm: panel.rightMm - borders.right * MM_PER_PX,
            bottomMm: panel.bottomMm - borders.bottom * MM_PER_PX,
        };
        const part = partOf(raw, 'panel');
        const text = textBoxOf(part);
        const topGap = text.topMm - inner.topMm;
        const bottomGap = inner.bottomMm - text.bottomMm;
        expect(
            Math.abs(topGap - bottomGap),
            `the student back panel text is centered vertically: the top gap is ${topGap.toFixed(2)} mm, ` +
                `the bottom gap is ${bottomGap.toFixed(2)} mm.`,
        ).toBeLessThanOrEqual(CENTRE_TOLERANCE_MM);
        const fields = unionOf(raw.fields);
        expect(fields, 'the student back holds panel fields.').not.toBeNull();
        const fieldBox = toMm(fields!);
        const leftGap = fieldBox.leftMm - inner.leftMm;
        const rightGap = inner.rightMm - fieldBox.rightMm;
        expect(
            Math.abs(leftGap - rightGap),
            `the student back panel fields are centered horizontally: the left gap is ` +
                `${leftGap.toFixed(2)} mm, the right gap is ${rightGap.toFixed(2)} mm.`,
        ).toBeLessThanOrEqual(CENTRE_TOLERANCE_MM);
        expect(text.leftMm - inner.leftMm, 'the student back panel text is 3 mm or more inside the panel.').toBeGreaterThanOrEqual(3);
        expect(inner.rightMm - text.rightMm, 'the student back panel text is 3 mm or more inside the panel.').toBeGreaterThanOrEqual(3);
        expect(text.topMm - inner.topMm, 'the student back panel text is 3 mm or more inside the panel.').toBeGreaterThanOrEqual(3);
        expect(inner.bottomMm - text.bottomMm, 'the student back panel text is 3 mm or more inside the panel.').toBeGreaterThanOrEqual(3);
    }, 300_000);

    it('V3: the contact block of both backs is centered in the sign and stands left of the QR', async () => {
        for (const kind of KINDS_BACK) {
            const raw = await measureKind(kind);
            const sign = partOf(raw, 'contact-sign');
            expect(sign.band, `the contact sign of the ${kind} holds an inner board.`).not.toBeNull();
            const board = bandBoxOf(sign);
            const mark = raw.rects['publisher-mark'];
            expect(mark, `the ${kind} holds a publisher mark.`).toBeDefined();
            const block = toMm(unionOf([...raw.contactTexts, mark!])!);
            const topGap = block.topMm - board.topMm;
            const bottomGap = board.bottomMm - block.bottomMm;
            expect(
                Math.abs(topGap - bottomGap),
                `the ${kind} contact block is centered vertically: the top gap is ${topGap.toFixed(2)} mm, ` +
                    `the bottom gap is ${bottomGap.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(CENTRE_TOLERANCE_MM);
            const qr = raw.rects['qr'];
            expect(qr, `the ${kind} holds a QR box.`).toBeDefined();
            const qrBox = toMm(qr!);
            const leftGap = block.leftMm - board.leftMm;
            const rightGap = qrBox.leftMm - block.rightMm;
            expect(
                Math.abs(leftGap - rightGap),
                `the ${kind} contact block is centered horizontally: the left gap is ${leftGap.toFixed(2)} mm, ` +
                    `the right gap is ${rightGap.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(CENTRE_TOLERANCE_MM);
            expect(overlaps(block, qrBox), `the ${kind} contact block is clear of the QR.`).toBe(false);
            const label = raw.rects['line-label'];
            expect(label, `the ${kind} holds a line label.`).toBeDefined();
            expect(overlaps(block, toMm(label!)), `the ${kind} contact block is clear of the line label.`).toBe(false);
        }
    }, 300_000);
});
