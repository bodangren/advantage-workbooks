// @vitest-environment jsdom
/**
 * Red of the standing cover rules of the PM standing order of 2026-11-11 (track
 * storytime_cover_options_20261106, Phase 2, the Task (Red, standing rules) pair of 2026-11-11).
 *
 * The owner order (the PM standing order of 2026-11-11, word for word): "PM → Workbooks: STANDING
 * ORDER (PM, 2026-11-11, from the freshness pass; it applies to every cover, poster, and print-chrome
 * task from now). The reader covers took 3 Red + Green + rebuild rounds today (r2, r2b, r2c) because
 * the PM look and the Red pins checked the rules one element at a time. From now, the Red of any
 * cover or chrome change pins Daniel's 5 cover rules on EVERY cover kind (book front/back, A3, leaf,
 * teacher) and EVERY chrome element (logo tile, plaque, pill, bar, footer):
 * 1. the product logo is present (by file hash);
 * 2. the chrome colors come from the logo token table (Storytime: #fcd34d / #92400e; K-only pages: K
 * tints);
 * 3. the visible letters (cap height, not the line box) fill about 80 % (75 % or more) of their band;
 * 4. each text block is centered within 1 mm, front and back;
 * 5. 0 band words, 0 band icons, 0 XP or game bars.
 * The sheet you send carries one full-size page per cover kind. Put this in your plan's standing
 * rules. No reply needed beyond your receipt."
 *
 * The pages (32): the 4 book kinds (student front, teacher front, student back, teacher back) with
 * the book row and the fixed art of `quest-cover-hlogo.test.ts`, and the 14 reader-a3 pages and the
 * 14 reader-leaf pages of `questReaders()`. Every page renders in the shipped style, the top style
 * `hlogo`, with the bleed 0. The default style is not shipped and keeps its pins.
 *
 * The rules of this file (one test per rule, over the 32 pages):
 *   S1: the logo by file hash: every page holds 1 `logo-tile` part with 1 image, the image source
 *       is a file URL, its SHA-256 equals the pin of the horizontal logo (the 18 colour pages) or of
 *       the K logo (the 14 leaf pages), and the image box stands at the tile box centre within 1 mm.
 *   S2: the token colours: every colour value of the chrome parts comes from the logo token table
 *       on a colour page, and every value is a gray on a leaf page.
 *   S3: the cap height: the cap height of each band text is 75 % to 85 % of its band height.
 *   S4: the centring: each band text stands at its band centre within 1 mm and its ink box lies
 *       inside its part box, the leaf footer stands at the page centre, the back contact lines stand
 *       between the board edge and the QR, and the student back panel block stands at the panel
 *       centre. S4 changed 2026-11-11 (standing rules fix): the role bar text block is the role mark,
 *       the 2 icons and the label.
 *   S5: the game UI: no band word, no band icon, no XP bar, and no game bar on any page.
 *
 * The change of 2026-11-11 (F1 F2, Daniel's look of 2026-11-11 and the PM order of the same day):
 *   S1 changed 2026-11-11 (F1 F2): the logo by file hash is on the 2 book backs only. The 4 front
 *       kinds (the student front, the teacher front, the 14 reader-a3 pages, and the 14 reader-leaf
 *       pages) hold 0 logo tiles. The page 12 tile of the readers has its hash pin in G5 of
 *       `quest-cover-f1f2.test.ts`.
 *   S2 changed 2026-11-11 (F1 F2): the scope adds the page 12 logo tile of the 14 readers in the 2
 *       reader outputs: the computed colours of the tile are token colours on `a3-color` and grays
 *       on `workbook`.
 *   S4 changed 2026-11-11 (F1 F2): the scope adds the page 12 logo tile: the tile centre stands at
 *       the reader page centre across within 1 mm, and the logo centre stands at the tile centre
 *       within 1 mm, at reader page scale.
 *   S5 changed 2026-11-11 (F1 F2): the scope adds page 12 of the 14 readers in the 2 outputs.
 *   The page 12 pages (28) come from `compileStorytimeReaders` in proof mode, one document for
 *   each week and output.
 *
 * The method notes:
 *   - The cap height method is the method of C1 of `quest-cover-readers-r2c.test.ts`: the computed
 *     font of the parent of the text sets on a canvas 2d context, and the `actualBoundingBoxAscent`
 *     of `H` is the cap height. Every page waits for `document.fonts.ready` first.
 *   - The band of a plaque is the first path whose fill equals the `data-plaque-colour` value of the
 *     part. The band of a pill or a bar is its box minus 2 times the border width of its inline
 *     style.
 *   - The ink box of a band text runs from the baseline minus the larger of the cap height and the
 *     ascent of its own text to the baseline plus the descent of its own text. The baseline is the
 *     range rect top plus the font ascent of `H`. The text box of the part must hold the ink box
 *     within 0.5 mm.
 *   - The file reads no week file and prints no page text. The 2 book backs hold Thai contact lines;
 *     the file prints their millimetres and their counts only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from '@playwright/test';
import {
    QUEST_BANDS,
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
import { compileStorytimeReaders, type StorytimeReaderOutput } from '../lib/storytime/print/readers';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';

/** The art string of the renders. The test reads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The 4 book kinds of this file. */
const BOOK_KINDS = ['student-front', 'teacher-front', 'student-back', 'teacher-back'] as const;

/** The 4 front kinds of S1 (F1 F2): they hold 0 logo tiles. */
const FRONT_KINDS = ['student-front', 'teacher-front', 'reader-a3', 'reader-leaf'] as const;

/** The 2 reader outputs of the page 12 scope (F1 F2). */
const PAGE12_OUTPUTS: StorytimeReaderOutput[] = ['workbook', 'a3-color'];

/** The reader page width at reader page scale, in millimetres. */
const READER_PAGE_WIDTH_MM = STORYTIME_PRINT_PROFILE.readerPage.widthMm;

/** The chrome parts that S2 and S3 read. */
const CHROME_PARTS = [
    'logo-tile',
    'title-plaque',
    'week-pill',
    'role-bar',
    'footer',
    'panel',
    'contact-sign',
    'qr',
    'band-pill',
] as const;

/** The parts whose body text colour S2 does not read. */
const TEXT_EXEMPT_PARTS = ['panel-value', 'contact-line', 'line-label'] as const;

/** The parts that S5 forbids on every page. */
const FORBIDDEN_PARTS = ['band-word', 'band-pill', 'band-icon', 'game-bar', 'unit-bar'] as const;

/** The parts that hold a band text for S3 and S4. */
const BAND_PARTS = ['title-plaque', 'week-pill', 'role-bar', 'band-pill'] as const;

/** The exception pages of D4: the group slides sideways on these 2 pages. */
const EXCEPTION_PAGE_IDS = ['w01-2 reader-a3', 'w01-2 reader-leaf'];

/** The token colours of the logo table, in lower case. */
const TOKEN_COLOURS = ['#fcd34d', '#92400e', '#fef3c7', '#fffbeb', '#ffffff'];

/** The colour values that a chrome part may hold. */
const ALLOWED_COLOURS = ['none', 'transparent'];

/** The least cap height share of a band: 75 %. */
const MIN_CAP_SHARE = 0.75;

/** The most cap height share of a band: 85 %. */
const MAX_CAP_SHARE = 0.85;

/** The tolerance of the centring checks of S4, in millimetres. */
const CENTRE_TOLERANCE_MM = 1;

/** The tolerance of the ink box inside its part box, in millimetres. */
const INSIDE_TOLERANCE_MM = 0.5;

/** The left edge of the back contact lines, in millimetres. */
const CONTACT_LEFT_MM = 15;

/** The left edge of the back QR box, in millimetres. */
const CONTACT_RIGHT_MM = 141;

/** The SHA-256 of the horizontal Storytime Advantage logo at the role base 0d3800f9. */
const SHA_COLOUR_LOGO = '3b9f8f4334ae316d9f0061b7b2707b07433b0eecd8ac0adddba0a68d9a3bb9cc';

/** The SHA-256 of the gray horizontal Storytime Advantage logo at the role base 0d3800f9. */
const SHA_K_LOGO = '93e1eef8aaa890f61f16564a09c9c9bf6b6f330da63a0cfaffed2fe0c9922489';

/** The render options of the shipped style: the horizontal logo on its tile, and the bleed 0. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

/** The row ids of the 14 reader rows, in the order of `questReaders()`. */
const ROW_IDS = [
    'w01-1',
    'w01-2',
    'w02-1',
    'w02-2',
    'w03-1',
    'w03-2',
    'w04-1',
    'w04-2',
    'w05-1',
    'w05-2',
    'w06-1',
    'w06-2',
    'w07-1',
    'w07-2',
] as const;

/** One box in millimetres. */
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

/** One colour value of a chrome part. */
interface RawColour {
    /** The value, as the page holds it. */
    value: string;
    /** The place of the value. */
    source: string;
}

/** The measure of one text node. */
interface RawText {
    /** The line boxes of the text. */
    rects: RawBox[];
    /** The cap height of the font, in millimetres. */
    capMm: number;
    /** The font ascent of `H`, in millimetres. */
    ascentMm: number;
    /** The baseline of the text, in millimetres. */
    baselineMm: number;
    /** The ascent of the own text, in millimetres. */
    textAscentMm: number;
    /** The descent of the own text, in millimetres. */
    textDescentMm: number;
    /** The computed colour of the parent of the text. */
    colour: string;
    /** The computed font size, in pixels. */
    fontPx: number;
    /** True when the font sets on the canvas. */
    fontSet: boolean;
    /** True when the body text colour of the text is exempt from S2. */
    exempt: boolean;
}

/** The measure of one chrome part. */
interface RawPart {
    /** The name of the part. */
    name: string;
    /** The box of the part. */
    box: RawBox | null;
    /** The colour values of the part. */
    colours: RawColour[];
    /** The text nodes of the part. */
    texts: RawText[];
    /** The box of the band of the part. */
    bandBox: RawBox | null;
    /** The place of the band. */
    bandSource: string;
    /** The boxes of the role icon spans of the part. */
    iconBoxes: RawBox[];
}

/** The measure of one page in Chrome. */
interface RawPage {
    /** The box of the page. */
    pageBox: RawBox | null;
    /** The box of the footer strip. */
    stripBox: RawBox | null;
    /** The box of the logo tile. */
    tileBox: RawBox | null;
    /** The box of the logo image. */
    imgBox: RawBox | null;
    /** The chrome parts of the page. */
    parts: RawPart[];
    /** The content box of the footer: its text boxes and its role icon boxes. */
    footerBox: RawBox | null;
    /** The union of the contact line text boxes. */
    contactBox: RawBox | null;
    /** The box of the QR part. */
    qrBox: RawBox | null;
    /** The union of the line label text boxes. */
    labelBox: RawBox | null;
    /** The box of the panel part. */
    panelBox: RawBox | null;
    /** The union of the panel heading and panel value text boxes. */
    panelBlockBox: RawBox | null;
}

/** One page of the 32 pages. */
interface PageSpec {
    /** The name of the page in the failure messages. */
    id: string;
    /** The group of the page: a book kind, `reader-a3`, or `reader-leaf`. */
    group: string;
    /** True for the leaf pages. */
    leaf: boolean;
    /** The rendered HTML. */
    html: string;
}

/** The game UI facts of one page. */
interface DomFacts {
    /** The forbidden parts of the page. */
    forbidden: { name: string; count: number }[];
    /** The count of the text nodes whose trimmed text equals a band name. */
    bandWordTexts: number;
    /** The count of the XP or sprout matches outside the exempt parts. */
    gameMatches: number;
}

/** One band text block of one page: the one-line texts of one band part. */
interface BandBlock {
    /** The name of the part. */
    part: string;
    /** The one-line texts of the part. */
    texts: RawText[];
    /** The box of the band. */
    band: RawBox | null;
    /** The place of the band. */
    bandSource: string;
    /** The box of the part. */
    partBox: RawBox | null;
    /** The boxes of the role icon spans of the part. */
    iconBoxes: RawBox[];
}

/** The result of one rule over the 32 pages. */
interface RuleOutcome {
    /** The problems of the rule. */
    problems: string[];
    /** The ids of the pages that fail. */
    failing: string[];
    /** The count of the checks of the rule. */
    checked: number;
    /** The number of the pages that the rule reads. */
    scope: number;
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of the standing rules checks. */
let browser: Browser | undefined;

/** The 32 pages of this file. */
let pages: PageSpec[] = [];

/** The Chrome measures of the 32 pages. */
const measures = new Map<string, RawPage>();

/** The Chrome measure of one page 12 of a reader (F1 F2). */
interface Page12Raw {
    /** The index of the reader in its document. */
    reader: number;
    /** The box of the reader page. */
    pageBox: RawBox;
    /** The count of the logo tiles of the page. */
    tiles: number;
    /** The box of the first tile. */
    tileBox: RawBox | null;
    /** The box of the first image of the first tile. */
    imgBox: RawBox | null;
    /** The computed colours of the tile and its descendants: the backgrounds and the drawn borders. */
    colours: RawColour[];
    /** The HTML of the reader page, for S5. */
    html: string;
}

/** One page 12 of the page 12 scope (F1 F2). */
interface Page12Spec {
    /** The name of the page in the failure messages. */
    id: string;
    /** The reader output. */
    output: StorytimeReaderOutput;
    /** The Chrome measure. */
    raw: Page12Raw;
}

/** The 28 page 12 pages of the page 12 scope (F1 F2). */
const page12: Page12Spec[] = [];

/**
 * Converts a computed colour to a lower case hex value.
 * @param value The computed colour.
 * @returns The hex value.
 */
function toHex(value: string): string {
    const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
    if (!match) {
        const text = value.trim().toLowerCase();
        const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(text);
        if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
        return text;
    }
    const hex = [match[1], match[2], match[3]]
        .map((part) => Number.parseInt(part, 10).toString(16).padStart(2, '0'))
        .join('');
    return `#${hex}`;
}

/**
 * Reads the red, green, and blue parts of one colour.
 * @param value The colour, as a hex or an rgb value.
 * @returns The parts, or null when the value holds no colour.
 */
function rgbOf(value: string): { r: number; g: number; b: number } | null {
    const text = value.trim().toLowerCase();
    const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(text);
    if (short) {
        return {
            r: Number.parseInt(`${short[1]}${short[1]}`, 16),
            g: Number.parseInt(`${short[2]}${short[2]}`, 16),
            b: Number.parseInt(`${short[3]}${short[3]}`, 16),
        };
    }
    const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(text);
    if (long) {
        return {
            r: Number.parseInt(long[1], 16),
            g: Number.parseInt(long[2], 16),
            b: Number.parseInt(long[3], 16),
        };
    }
    const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(text);
    if (rgb) {
        return { r: Number.parseInt(rgb[1], 10), g: Number.parseInt(rgb[2], 10), b: Number.parseInt(rgb[3], 10) };
    }
    return null;
}

/**
 * Tells when one colour is a gray.
 * @param value The colour.
 * @returns True when the red, green, and blue parts are equal.
 */
function isGrey(value: string): boolean {
    const rgb = rgbOf(value);
    if (!rgb) return false;
    return rgb.r === rgb.g && rgb.g === rgb.b;
}

/**
 * Reads the SHA-256 of one file.
 * @param file The file.
 * @returns The hash, or an empty text when the file does not exist.
 */
function hashOfFile(file: string): string {
    if (!fs.existsSync(file)) return '';
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * Parses one rendered document.
 * @param html The rendered HTML.
 * @returns The document.
 */
function parseHtml(html: string): Document {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('parsererror'), 'The rendered HTML parses.').toBeNull();
    return doc;
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
 * Builds the 32 pages of this file.
 * @returns The pages.
 */
function buildPages(): PageSpec[] {
    const built: PageSpec[] = [];
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    const book: QuestBookRow = data.books[0];
    for (const kind of BOOK_KINDS) {
        const assets = kind === 'student-back' ? { art: ART, panelValues: panelValues() } : { art: ART };
        built.push({
            id: kind,
            group: kind,
            leaf: false,
            html: renderQuestCover(kind, book, assets, HLOGO_OPTIONS),
        });
    }
    const rows: QuestReaderRow[] = questReaders();
    expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
    for (const [index, row] of rows.entries()) {
        built.push({
            id: `${ROW_IDS[index]} reader-a3`,
            group: 'reader-a3',
            leaf: false,
            html: renderQuestCover('reader-a3', row, { art: ART }, HLOGO_OPTIONS),
        });
        built.push({
            id: `${ROW_IDS[index]} reader-leaf`,
            group: 'reader-leaf',
            leaf: true,
            html: renderQuestCover('reader-leaf', row, { art: ART }, HLOGO_OPTIONS),
        });
    }
    return built;
}

/**
 * Reads the game UI facts of one page.
 * @param html The rendered HTML.
 * @returns The facts.
 */
function domFacts(html: string): DomFacts {
    const doc = parseHtml(html);
    const body = doc.body;
    const forbidden: { name: string; count: number }[] = [];
    for (const name of FORBIDDEN_PARTS) {
        const count = doc.querySelectorAll(`[data-part="${name}"]`).length;
        if (count > 0) forbidden.push({ name, count });
    }
    let bandWordTexts = 0;
    if (body) {
        const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode as Text;
            const text = (node.nodeValue ?? '').trim().toLowerCase();
            if (!text) continue;
            if ((QUEST_BANDS as readonly string[]).includes(text)) bandWordTexts += 1;
        }
    }
    let gameMatches = 0;
    if (body) {
        const clone = body.cloneNode(true) as HTMLElement;
        for (const part of Array.from(clone.querySelectorAll('[data-part="panel-value"],[data-part="contact-line"]'))) {
            part.remove();
        }
        gameMatches = ((clone.textContent ?? '').match(/\b(xp|sprout)\b/gi) ?? []).length;
    }
    return { forbidden, bandWordTexts, gameMatches };
}

/**
 * Opens one rendered page in Chrome and measures it.
 * @param page The browser page.
 * @param html The rendered HTML.
 * @returns The measure.
 */
async function measurePage(page: Page, html: string): Promise<RawPage> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-standing-'));
    scratch.push(folder);
    const file = path.join(folder, 'page.html');
    fs.writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    return page.evaluate(
        (config: { chrome: string[]; exempt: string[] }): RawPage => {
            const mm = 25.4 / 96;
            const CHROME = config.chrome;
            const EXEMPT = config.exempt;
            const COLOUR_TOKEN = /#[0-9a-fA-F]{3,8}|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+\s*)?\)/g;

            const boxOf = (element: Element | null): RawBox | null => {
                if (!element) return null;
                const rect = element.getBoundingClientRect();
                return { left: rect.left * mm, top: rect.top * mm, right: rect.right * mm, bottom: rect.bottom * mm };
            };
            const unionOf = (boxes: RawBox[]): RawBox | null => {
                if (boxes.length === 0) return null;
                return {
                    left: Math.min(...boxes.map((one) => one.left)),
                    top: Math.min(...boxes.map((one) => one.top)),
                    right: Math.max(...boxes.map((one) => one.right)),
                    bottom: Math.max(...boxes.map((one) => one.bottom)),
                };
            };
            const borderWidthMm = (style: string): number => {
                const longhand = /border-width\s*:\s*([^;]+)/i.exec(style);
                const shorthand = /(^|;)\s*border\s*:\s*([^;]+)/i.exec(style);
                const value = longhand ? longhand[1] : shorthand ? shorthand[2] : '';
                const match = /(-?[\d.]+)\s*(mm|px|pt|em)/.exec(value);
                if (!match) return 0;
                const number = Number.parseFloat(match[1]);
                if (!Number.isFinite(number)) return 0;
                if (match[2] === 'mm') return number;
                if (match[2] === 'px') return number * (25.4 / 96);
                if (match[2] === 'pt') return number * (25.4 / 72);
                return 0;
            };
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const partOf = (node: Node): string => {
                const parent = (node as Text).parentElement;
                if (!parent) return '';
                const found = parent.closest('[data-part]');
                return found ? (found.getAttribute('data-part') ?? '') : '';
            };
            const textOf = (node: Text): RawText => {
                const range = document.createRange();
                range.selectNodeContents(node);
                const clientRects = Array.from(range.getClientRects());
                const rects = clientRects.map((rect) => ({
                    left: rect.left * mm,
                    top: rect.top * mm,
                    right: rect.right * mm,
                    bottom: rect.bottom * mm,
                }));
                const parent = node.parentElement;
                const style = parent ? window.getComputedStyle(parent) : null;
                if (!style || !context) {
                    return {
                        rects,
                        capMm: 0,
                        ascentMm: 0,
                        baselineMm: 0,
                        textAscentMm: 0,
                        textDescentMm: 0,
                        colour: '',
                        fontPx: 0,
                        fontSet: false,
                        exempt: EXEMPT.includes(partOf(node)),
                    };
                }
                context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                const fontSet = context.font.includes(style.fontSize);
                const capMetrics = context.measureText('H');
                const ownMetrics = context.measureText(node.nodeValue ?? '');
                const first = clientRects[0];
                const ascentPx = capMetrics.fontBoundingBoxAscent;
                const baselinePx = first ? first.top + ascentPx : 0;
                return {
                    rects,
                    capMm: capMetrics.actualBoundingBoxAscent * mm,
                    ascentMm: ascentPx * mm,
                    baselineMm: baselinePx * mm,
                    textAscentMm: ownMetrics.actualBoundingBoxAscent * mm,
                    textDescentMm: ownMetrics.actualBoundingBoxDescent * mm,
                    colour: style.color,
                    fontPx: Number.parseFloat(style.fontSize),
                    fontSet,
                    exempt: EXEMPT.includes(partOf(node)),
                };
            };
            const textsOf = (element: Element): RawText[] => {
                const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
                const found: RawText[] = [];
                while (walker.nextNode()) {
                    const node = walker.currentNode as Text;
                    if (!(node.nodeValue ?? '').trim()) continue;
                    found.push(textOf(node));
                }
                return found;
            };
            const colourValues = (element: Element, deep: boolean): RawColour[] => {
                const found: RawColour[] = [];
                const elements = deep ? [element, ...Array.from(element.querySelectorAll('*'))] : [element];
                for (const one of elements) {
                    for (const name of ['fill', 'stroke']) {
                        const value = one.getAttribute(name);
                        if (value) found.push({ value: value.trim(), source: `the ${name} attribute` });
                    }
                    const style = one.getAttribute('style') ?? '';
                    const matches = style.matchAll(/(?:^|;)\s*(background|background-color|border|border-color)\s*:\s*([^;]+)/gi);
                    for (const match of matches) {
                        for (const token of match[2].matchAll(COLOUR_TOKEN)) {
                            found.push({ value: token[0], source: `the inline ${match[1].toLowerCase()}` });
                        }
                    }
                }
                return found;
            };
            const iconBoxesOf = (element: Element): RawBox[] =>
                Array.from(element.querySelectorAll('span'))
                    .filter((one) => one.querySelector('svg'))
                    .map((one) => boxOf(one))
                    .filter((one): one is RawBox => one !== null);
            const bandOf = (part: Element, name: string): { box: RawBox | null; source: string } => {
                if (name === 'title-plaque') {
                    const colour = (part.getAttribute('data-plaque-colour') ?? '').toLowerCase();
                    const paths = Array.from(part.querySelectorAll('path'));
                    const band = paths.find((one) => (one.getAttribute('fill') ?? '').toLowerCase() === colour);
                    return {
                        box: boxOf(band ?? null),
                        source: band ? 'the band path of the plaque' : 'no band path in the plaque',
                    };
                }
                const box = boxOf(part);
                if (!box) return { box: null, source: 'no box of the part' };
                const border = borderWidthMm(part.getAttribute('style') ?? '');
                return {
                    box: {
                        left: box.left + border,
                        top: box.top + border,
                        right: box.right - border,
                        bottom: box.bottom - border,
                    },
                    source: `the inner box of the part, the border is ${border.toFixed(2)} mm`,
                };
            };

            const tile = document.querySelector('[data-part="logo-tile"]');
            const image = tile ? tile.querySelector('img') : null;
            const parts: RawPart[] = [];
            for (const name of CHROME) {
                const element = document.querySelector(`[data-part="${name}"]`);
                if (!element) continue;
                const band = bandOf(element, name);
                parts.push({
                    name,
                    box: boxOf(element),
                    colours: colourValues(element, name !== 'qr'),
                    texts: textsOf(element),
                    bandBox: band.box,
                    bandSource: band.source,
                    iconBoxes: name === 'role-bar' ? iconBoxesOf(element) : [],
                });
            }
            const footer = document.querySelector('[data-part="footer"]');
            const footerIcons = footer
                ? Array.from(footer.querySelectorAll('span'))
                      .filter((one) => one.querySelector('svg'))
                      .map((one) => boxOf(one))
                      .filter((one): one is RawBox => one !== null)
                : [];
            const footerTextBoxes = footer
                ? textsOf(footer).flatMap((text) => text.rects)
                : [];
            const strip = document.querySelector('[data-part="footer-strip"]');
            const contactParts = Array.from(document.querySelectorAll('[data-part="contact-line"]'));
            const contactBoxes = contactParts.flatMap((one) => textsOf(one).flatMap((text) => text.rects));
            const qr = document.querySelector('[data-part="qr"]');
            const label = document.querySelector('[data-part="line-label"]');
            const labelBoxes = label ? textsOf(label).flatMap((text) => text.rects) : [];
            const panel = document.querySelector('[data-part="panel"]');
            const panelBoxes = panel
                ? Array.from(panel.querySelectorAll('[data-part="panel-heading"],[data-part="panel-value"]')).flatMap((one) =>
                      textsOf(one).flatMap((text) => text.rects),
                  )
                : [];
            return {
                pageBox: boxOf(document.querySelector('.quest-page')),
                stripBox: boxOf(strip),
                tileBox: boxOf(tile),
                imgBox: boxOf(image),
                parts,
                footerBox: unionOf([...footerTextBoxes, ...footerIcons]),
                contactBox: unionOf(contactBoxes),
                qrBox: boxOf(qr),
                labelBox: unionOf(labelBoxes),
                panelBox: boxOf(panel),
                panelBlockBox: unionOf(panelBoxes),
            };
        },
        { chrome: [...CHROME_PARTS], exempt: [...TEXT_EXEMPT_PARTS] },
    );
}

/**
 * Opens one reader document in Chrome and measures the page 12 of each reader (F1 F2).
 * @param page The browser page.
 * @param html The reader document.
 * @returns The measure of each page 12.
 */
async function measurePage12(page: Page, html: string): Promise<Page12Raw[]> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-standing-p12-'));
    scratch.push(folder);
    const file = path.join(folder, 'readers.html');
    fs.writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    return page.evaluate((): Page12Raw[] => {
        const mm = 25.4 / 96;
        const boxOf = (element: Element | null): RawBox | null => {
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return { left: rect.left * mm, top: rect.top * mm, right: rect.right * mm, bottom: rect.bottom * mm };
        };
        const titles = [
            ...new Set(
                Array.from(document.querySelectorAll('.reader-leaf[data-reader-title], .reader-book[data-reader-title]'), (element) =>
                    element.getAttribute('data-reader-title') ?? '',
                ),
            ),
        ];
        const found: Page12Raw[] = [];
        for (const readerPage of Array.from(document.querySelectorAll('.reader-page[data-page-number="12"]'))) {
            const holder = readerPage.closest('[data-reader-title]');
            const tiles = Array.from(readerPage.querySelectorAll('[data-part="logo-tile"]'));
            const tile = tiles[0] ?? null;
            const colours: RawColour[] = [];
            if (tile) {
                for (const element of [tile, ...Array.from(tile.querySelectorAll('*'))]) {
                    const style = window.getComputedStyle(element);
                    const background = style.backgroundColor.replace(/\s+/g, '');
                    if (background !== 'transparent' && background !== 'rgba(0,0,0,0)') {
                        colours.push({ value: style.backgroundColor, source: 'computed background' });
                    }
                    for (const side of ['top', 'right', 'bottom', 'left']) {
                        const width = Number.parseFloat(style.getPropertyValue(`border-${side}-width`));
                        if (width > 0 && style.getPropertyValue(`border-${side}-style`) !== 'none') {
                            colours.push({ value: style.getPropertyValue(`border-${side}-color`), source: `computed border ${side}` });
                        }
                    }
                }
            }
            found.push({
                reader: titles.indexOf(holder ? (holder.getAttribute('data-reader-title') ?? '') : ''),
                pageBox: boxOf(readerPage)!,
                tiles: tiles.length,
                tileBox: boxOf(tile),
                imgBox: boxOf(tile ? tile.querySelector('img') : null),
                colours,
                html: `<!doctype html><html><body>${readerPage.outerHTML}</body></html>`,
            });
        }
        return found;
    });
}

/**
 * Reads the band text blocks of one measured page. The front title plaque holds one row of 3 texts,
 * so the block of a part is the union of its one-line texts.
 * @param raw The measure of the page.
 * @returns The band text blocks.
 */
function bandBlocksOf(raw: RawPage): BandBlock[] {
    const found: BandBlock[] = [];
    for (const part of raw.parts) {
        if (!(BAND_PARTS as readonly string[]).includes(part.name)) continue;
        const texts = part.texts.filter((text) => text.rects.length === 1);
        if (texts.length === 0) continue;
        found.push({
            part: part.name,
            texts,
            band: part.bandBox,
            bandSource: part.bandSource,
            partBox: part.box,
            iconBoxes: part.iconBoxes,
        });
    }
    return found;
}

/**
 * Reads the groups of the pages, with the ids of each group.
 * @returns The groups.
 */
function pageGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const page of pages) {
        const list = groups.get(page.group) ?? [];
        list.push(page.id);
        groups.set(page.group, list);
    }
    return groups;
}

/**
 * Prints the summary line of one rule.
 * @param rule The name of the rule.
 * @param outcome The result of the rule.
 * @returns Nothing.
 */
function printSummary(rule: string, outcome: RuleOutcome): void {
    const groups = pageGroups();
    const parts: string[] = [];
    for (const [group, ids] of groups) {
        const failed = ids.filter((id) => outcome.failing.includes(id)).length;
        parts.push(`${group} ${failed}/${ids.length}`);
    }
    console.log(
        `STANDING-RULES ${rule}: checks ${outcome.checked}, pages in scope ${outcome.scope}, ` +
            `pages failing ${outcome.failing.length}. By group: ${parts.join(', ')}.`,
    );
}

/**
 * Fails one rule with its problems.
 * @param rule The name of the rule.
 * @param outcome The result of the rule.
 * @returns Nothing.
 */
function expectRule(rule: string, outcome: RuleOutcome): void {
    printSummary(rule, outcome);
    expect(
        outcome.problems.length,
        `${rule} fails on ${outcome.failing.length} of ${outcome.scope} pages.\n${outcome.problems.join('\n')}`,
    ).toBe(0);
}

beforeAll(async () => {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
    const active = browser;
    if (!active) throw new Error('the browser of the standing rules check did not start');
    pages = buildPages();
    expect(pages.length, 'the file holds 32 pages.').toBe(32);
    const context = await active.newContext({ viewport: { width: 1700, height: 1300 } });
    const page = await context.newPage();
    try {
        for (const spec of pages) {
            measures.set(spec.id, await measurePage(page, spec.html));
        }
        // S2, S4, and S5 changed 2026-11-11 (F1 F2): the page 12 scope, one document for each week and output.
        const weeks = readLevelWeeks(STORYTIME_ROOT, 2)
            .flatMap((entry) => (entry.week ? [entry.week] : []))
            .filter((week) => week.meta.week >= 1 && week.meta.week <= 7);
        expect(weeks.length, 'Level 2 holds the weeks 1 to 7.').toBe(7);
        for (const week of weeks) {
            for (const output of PAGE12_OUTPUTS) {
                const { html } = compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output });
                for (const raw of await measurePage12(page, html)) {
                    const code = String(week.meta.week).padStart(2, '0');
                    page12.push({ id: `w${code}-${raw.reader + 1} page12 ${output}`, output, raw });
                }
            }
        }
        expect(page12.length, 'the page 12 scope holds 28 pages.').toBe(28);
    } finally {
        await context.close();
    }
}, 600_000);

afterAll(async () => {
    try {
        if (browser) await browser.close();
    } finally {
        for (const folder of scratch) fs.rmSync(folder, { recursive: true, force: true });
    }
});

describe('quest-cover-standing-rules: S1 to S5 (Red, the 5 standing cover rules on the 32 shipped pages)', () => {
    it('S1: the 2 book backs hold the product logo, by file hash, centred in its tile, and the 4 front kinds hold no logo tile', () => {
        const problems: string[] = [];
        const failing: string[] = [];
        for (const page of pages) {
            const before = problems.length;
            const doc = parseHtml(page.html);
            const tiles = doc.querySelectorAll('[data-part="logo-tile"]');
            // S1 changed 2026-11-11 (F1 F2): the 4 front kinds hold 0 logo tiles; the logo moves to page 12 of the readers.
            if ((FRONT_KINDS as readonly string[]).includes(page.group)) {
                if (tiles.length !== 0) {
                    problems.push(`${page.id} logo-tile: the front holds ${tiles.length} logo tiles (the rule is 0).`);
                    failing.push(page.id);
                }
                continue;
            }
            if (tiles.length !== 1) {
                problems.push(`${page.id} logo-tile: the page holds ${tiles.length} logo tiles (the rule is 1).`);
            } else {
                const images = Array.from(tiles[0].querySelectorAll('img'));
                if (images.length !== 1) {
                    problems.push(`${page.id} logo-tile: the tile holds ${images.length} images (the rule is 1).`);
                } else {
                    const src = images[0].getAttribute('src') ?? '';
                    if (!src.startsWith('file://')) {
                        problems.push(`${page.id} logo-tile: the image source is not a file URL (the rule is a file URL).`);
                    } else {
                        const hash = hashOfFile(fileURLToPath(src));
                        const wanted = page.leaf ? SHA_K_LOGO : SHA_COLOUR_LOGO;
                        if (hash !== wanted) {
                            problems.push(
                                `${page.id} logo-tile: the SHA-256 of the logo file is ${hash} ` +
                                    `(the pin is ${wanted}).`,
                            );
                        }
                    }
                }
            }
            const raw = measures.get(page.id);
            if (!raw) {
                problems.push(`${page.id} logo-tile: the browser holds no measure of the page.`);
            } else if (!raw.tileBox || !raw.imgBox) {
                problems.push(`${page.id} logo-tile: the tile box or the image box is missing.`);
            } else {
                const across = Math.abs(
                    (raw.imgBox.left + raw.imgBox.right) / 2 - (raw.tileBox.left + raw.tileBox.right) / 2,
                );
                const down = Math.abs(
                    (raw.imgBox.top + raw.imgBox.bottom) / 2 - (raw.tileBox.top + raw.tileBox.bottom) / 2,
                );
                if (across > CENTRE_TOLERANCE_MM) {
                    problems.push(
                        `${page.id} logo-tile: the image centre is ${across.toFixed(2)} mm from the tile centre ` +
                            `across (the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm).`,
                    );
                }
                if (down > CENTRE_TOLERANCE_MM) {
                    problems.push(
                        `${page.id} logo-tile: the image centre is ${down.toFixed(2)} mm from the tile centre ` +
                            `down (the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm).`,
                    );
                }
            }
            if (problems.length > before) failing.push(page.id);
        }
        expectRule('S1', { problems, failing, checked: pages.length, scope: pages.length });
    });

    it('S2: every chrome colour comes from the logo token table, and every leaf colour is a gray', () => {
        const problems: string[] = [];
        const failing: string[] = [];
        for (const page of pages) {
            const before = problems.length;
            const raw = measures.get(page.id);
            if (!raw) {
                problems.push(`${page.id} chrome: the browser holds no measure of the page.`);
                failing.push(page.id);
                continue;
            }
            const check = (part: string, source: string, value: string): void => {
                const hex = toHex(value);
                if (ALLOWED_COLOURS.includes(hex)) return;
                if (page.leaf) {
                    if (!isGrey(hex)) {
                        problems.push(
                            `${page.id} ${part}: the ${source} holds ${hex} and every value of a leaf page ` +
                                `must be a gray.`,
                        );
                    }
                    return;
                }
                if (!TOKEN_COLOURS.includes(hex)) {
                    problems.push(
                        `${page.id} ${part}: the ${source} holds ${hex} and the token table holds ` +
                            `${TOKEN_COLOURS.join(', ')}.`,
                    );
                }
            };
            for (const part of raw.parts) {
                for (const colour of part.colours) {
                    check(part.name, colour.source, colour.value);
                }
                for (const text of part.texts) {
                    if (text.exempt) continue;
                    check(part.name, 'text colour', text.colour);
                }
            }
            if (problems.length > before) failing.push(page.id);
        }
        // S2 changed 2026-11-11 (F1 F2): the page 12 logo tile takes the token colours on a3-color and grays on workbook.
        for (const entry of page12) {
            const before = problems.length;
            if (entry.raw.tiles !== 1) {
                problems.push(`${entry.id} logo-tile: the page holds ${entry.raw.tiles} logo tiles, so no tile colour can be read (the rule is 1).`);
            }
            for (const colour of entry.raw.colours) {
                const hex = toHex(colour.value);
                if (entry.output === 'workbook' ? !isGrey(hex) : !TOKEN_COLOURS.includes(hex)) {
                    problems.push(
                        `${entry.id} logo-tile: the ${colour.source} holds ${hex} and the rule is ` +
                            `${entry.output === 'workbook' ? 'a gray' : `one of ${TOKEN_COLOURS.join(', ')}`}.`,
                    );
                }
            }
            if (problems.length > before) failing.push(entry.id);
        }
        expectRule('S2', { problems, failing, checked: pages.length + page12.length, scope: pages.length + page12.length });
    });

    it('S3: the cap height of every band text is 75 % to 85 % of its band', () => {
        const problems: string[] = [];
        const failing: string[] = [];
        let checked = 0;
        let scope = 0;
        for (const page of pages) {
            const before = problems.length;
            const raw = measures.get(page.id);
            if (!raw) {
                problems.push(`${page.id} band: the browser holds no measure of the page.`);
                failing.push(page.id);
                continue;
            }
            const blocks = bandBlocksOf(raw);
            if (blocks.length === 0) continue;
            scope += 1;
            for (const block of blocks) {
                const height = block.band ? block.band.bottom - block.band.top : 0;
                const low: { share: number; capMm: number }[] = [];
                for (const text of block.texts) {
                    checked += 1;
                    if (!text.fontSet) {
                        problems.push(
                            `${page.id} ${block.part}: the computed font of ${text.fontPx.toFixed(2)} px does not ` +
                                `set on the canvas, so the cap height cannot be read.`,
                        );
                        continue;
                    }
                    const share = height > 0 ? text.capMm / height : 0;
                    if (share < MIN_CAP_SHARE || share > MAX_CAP_SHARE) low.push({ share, capMm: text.capMm });
                }
                if (low.length > 0) {
                    const worst = low.reduce((one, two) => (two.share < one.share ? two : one));
                    problems.push(
                        `${page.id} ${block.part}: the cap height is ${worst.capMm.toFixed(2)} mm and the band is ` +
                            `${height.toFixed(2)} mm (${block.bandSource}), the share is ` +
                            `${(worst.share * 100).toFixed(1)} % for ${low.length} of ${block.texts.length} texts ` +
                            `(the rule is 75 % to 85 %).`,
                    );
                }
            }
            if (problems.length > before) failing.push(page.id);
        }
        if (checked === 0) problems.push('no page holds a band text, so the rule reads nothing.');
        expectRule('S3', { problems, failing, checked, scope });
    });

    // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-gateA.txt at e95fa275): S4, the footer of the 2 exception pages centres on the footer strip, and the strip lies inside the trim.
    it('S4: every text block stands centred within 1 mm, front and back', () => {
        const problems: string[] = [];
        const failing: string[] = [];
        let checked = 0;
        let scope = 0;
        for (const page of pages) {
            const before = problems.length;
            const raw = measures.get(page.id);
            if (!raw) {
                problems.push(`${page.id} centring: the browser holds no measure of the page.`);
                failing.push(page.id);
                continue;
            }
            scope += 1;
            for (const block of bandBlocksOf(raw)) {
                checked += 1;
                const inkLeft = Math.min(
                    ...block.texts.map((text) => Math.min(...text.rects.map((rect) => rect.left))),
                );
                const inkRight = Math.max(
                    ...block.texts.map((text) => Math.max(...text.rects.map((rect) => rect.right))),
                );
                const inkTop = Math.min(
                    ...block.texts.map((text) => text.baselineMm - Math.max(text.capMm, text.textAscentMm)),
                );
                const inkBottom = Math.max(
                    ...block.texts.map((text) => text.baselineMm + text.textDescentMm),
                );
                if (!block.band) {
                    problems.push(
                        `${page.id} ${block.part}: the band is missing (${block.bandSource}), so the ink box centre ` +
                            `cannot stand at the band centre.`,
                    );
                    continue;
                }
                // The role bar text block is the role mark: the 2 icons and the label.
                let boxLeft = inkLeft;
                let boxRight = inkRight;
                let boxTop = inkTop;
                let boxBottom = inkBottom;
                for (const icon of block.iconBoxes) {
                    boxLeft = Math.min(boxLeft, icon.left);
                    boxRight = Math.max(boxRight, icon.right);
                    boxTop = Math.min(boxTop, icon.top);
                    boxBottom = Math.max(boxBottom, icon.bottom);
                }
                const across = Math.abs(
                    (boxLeft + boxRight) / 2 - (block.band.left + block.band.right) / 2,
                );
                const down = Math.abs((boxTop + boxBottom) / 2 - (block.band.top + block.band.bottom) / 2);
                if (across > CENTRE_TOLERANCE_MM) {
                    problems.push(
                        `${page.id} ${block.part}: the ink box centre is ${across.toFixed(2)} mm from the band centre ` +
                            `across (the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm).`,
                    );
                }
                if (down > CENTRE_TOLERANCE_MM) {
                    problems.push(
                        `${page.id} ${block.part}: the ink box centre is ${down.toFixed(2)} mm from the band centre ` +
                            `down (the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm).`,
                    );
                }
                if (!block.partBox) {
                    problems.push(`${page.id} ${block.part}: the part holds no box, so the ink box cannot lie inside it.`);
                    continue;
                }
                const inside =
                    boxLeft >= block.partBox.left - INSIDE_TOLERANCE_MM &&
                    boxRight <= block.partBox.right + INSIDE_TOLERANCE_MM &&
                    boxTop >= block.partBox.top - INSIDE_TOLERANCE_MM &&
                    boxBottom <= block.partBox.bottom + INSIDE_TOLERANCE_MM;
                if (!inside) {
                    problems.push(
                        `${page.id} ${block.part}: the ink box is ${boxLeft.toFixed(2)} to ${boxRight.toFixed(2)} mm ` +
                            `by ${boxTop.toFixed(2)} to ${boxBottom.toFixed(2)} mm, and the part box is ` +
                            `${block.partBox.left.toFixed(2)} to ${block.partBox.right.toFixed(2)} mm by ` +
                            `${block.partBox.top.toFixed(2)} to ${block.partBox.bottom.toFixed(2)} mm (the ink box ` +
                            `must lie inside the part box).`,
                    );
                }
            }
            if (page.leaf) {
                checked += 1;
                if (!raw.footerBox) {
                    problems.push(`${page.id} footer: the page holds no footer content, so the rule reads nothing.`);
                } else if (!raw.pageBox) {
                    problems.push(`${page.id} footer: the page holds no page box.`);
                } else if (!raw.stripBox) {
                    problems.push(`${page.id} footer: the page holds no footer strip, so the rule reads nothing.`);
                } else {
                    const strip = raw.stripBox;
                    const inside =
                        strip.left >= raw.pageBox.left - 0.05 &&
                        strip.right <= raw.pageBox.right + 0.05 &&
                        strip.top >= raw.pageBox.top - 0.05 &&
                        strip.bottom <= raw.pageBox.bottom + 0.05;
                    if (!inside) {
                        problems.push(
                            `${page.id} footer: the footer strip is ${strip.left.toFixed(2)} to ` +
                                `${strip.right.toFixed(2)} mm by ${strip.top.toFixed(2)} to ` +
                                `${strip.bottom.toFixed(2)} mm, and it must lie inside the trim.`,
                        );
                    }
                    const exception = EXCEPTION_PAGE_IDS.includes(page.id);
                    const wanted = exception
                        ? (strip.left + strip.right) / 2
                        : (raw.pageBox.left + raw.pageBox.right) / 2;
                    const across = Math.abs((raw.footerBox.left + raw.footerBox.right) / 2 - wanted);
                    if (across > CENTRE_TOLERANCE_MM) {
                        problems.push(
                            `${page.id} footer: the footer content centre is ${across.toFixed(2)} mm from the ` +
                                `${exception ? 'footer strip' : 'page'} centre across ` +
                                `(the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm).`,
                        );
                    }
                }
            }
            if (page.id === 'student-back' || page.id === 'teacher-back') {
                checked += 1;
                if (!raw.contactBox) {
                    problems.push(`${page.id} contact-line: the page holds no contact line text.`);
                } else {
                    const wanted = (CONTACT_LEFT_MM + CONTACT_RIGHT_MM) / 2;
                    const across = Math.abs((raw.contactBox.left + raw.contactBox.right) / 2 - wanted);
                    if (across > CENTRE_TOLERANCE_MM) {
                        problems.push(
                            `${page.id} contact-line: the contact lines stand at ` +
                                `${((raw.contactBox.left + raw.contactBox.right) / 2).toFixed(2)} mm and the rule is ` +
                                `the centre of ${CONTACT_LEFT_MM.toFixed(2)} mm and ${CONTACT_RIGHT_MM.toFixed(2)} mm, ` +
                                `${wanted.toFixed(2)} mm (the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm).`,
                        );
                    }
                }
                if (!raw.qrBox || !raw.labelBox) {
                    problems.push(`${page.id} line-label: the QR box or the line label text is missing.`);
                } else {
                    const across = Math.abs(
                        (raw.labelBox.left + raw.labelBox.right) / 2 - (raw.qrBox.left + raw.qrBox.right) / 2,
                    );
                    if (across > CENTRE_TOLERANCE_MM) {
                        problems.push(
                            `${page.id} line-label: the line label centre is ${across.toFixed(2)} mm from the QR ` +
                                `box centre (the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm).`,
                        );
                    }
                }
            }
            if (page.id === 'student-back') {
                checked += 1;
                if (!raw.panelBox || !raw.panelBlockBox) {
                    problems.push(`${page.id} panel: the panel box or the panel text block is missing.`);
                } else {
                    const across = Math.abs(
                        (raw.panelBlockBox.left + raw.panelBlockBox.right) / 2 -
                            (raw.panelBox.left + raw.panelBox.right) / 2,
                    );
                    const down = Math.abs(
                        (raw.panelBlockBox.top + raw.panelBlockBox.bottom) / 2 -
                            (raw.panelBox.top + raw.panelBox.bottom) / 2,
                    );
                    if (across > CENTRE_TOLERANCE_MM) {
                        problems.push(
                            `${page.id} panel: the panel text block centre is ${across.toFixed(2)} mm from the panel ` +
                                `centre across (the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm).`,
                        );
                    }
                    if (down > CENTRE_TOLERANCE_MM) {
                        problems.push(
                            `${page.id} panel: the panel text block centre is ${down.toFixed(2)} mm from the panel ` +
                                `centre down (the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm).`,
                        );
                    }
                }
            }
            if (problems.length > before) failing.push(page.id);
        }
        // S4 changed 2026-11-11 (F1 F2): the page 12 logo tile stands centred on the reader page.
        for (const entry of page12) {
            const before = problems.length;
            const scale = (entry.raw.pageBox.right - entry.raw.pageBox.left) / READER_PAGE_WIDTH_MM;
            checked += 1;
            if (entry.raw.tiles !== 1) {
                problems.push(
                    `${entry.id} logo-tile: the page holds ${entry.raw.tiles} logo tiles, so no tile centre can stand ` +
                        'at the page centre.',
                );
            } else {
                const tile = entry.raw.tileBox!;
                const pageCentre = (entry.raw.pageBox.left + entry.raw.pageBox.right) / 2;
                const across = Math.abs((tile.left + tile.right) / 2 - pageCentre) / scale;
                if (across > CENTRE_TOLERANCE_MM) {
                    problems.push(
                        `${entry.id} logo-tile: the tile centre is ${across.toFixed(2)} mm from the page centre across ` +
                            `(the rule is ${CENTRE_TOLERANCE_MM.toFixed(2)} mm at reader page scale).`,
                    );
                }
                if (!entry.raw.imgBox) {
                    problems.push(`${entry.id} logo-tile: the tile holds no logo image.`);
                } else {
                    const image = entry.raw.imgBox;
                    const imageAcross = Math.abs((image.left + image.right) / 2 - (tile.left + tile.right) / 2) / scale;
                    const imageDown = Math.abs((image.top + image.bottom) / 2 - (tile.top + tile.bottom) / 2) / scale;
                    if (imageAcross > CENTRE_TOLERANCE_MM || imageDown > CENTRE_TOLERANCE_MM) {
                        problems.push(
                            `${entry.id} logo-tile: the logo centre is ${imageAcross.toFixed(2)} mm across and ` +
                                `${imageDown.toFixed(2)} mm down from the tile centre (the rule is ` +
                                `${CENTRE_TOLERANCE_MM.toFixed(2)} mm at reader page scale).`,
                        );
                    }
                }
            }
            if (problems.length > before) failing.push(entry.id);
        }
        expectRule('S4', { problems, failing, checked, scope: scope + page12.length });
    });

    it('S5: no page holds a band word, a band icon, an XP bar, or a game bar', () => {
        const problems: string[] = [];
        const failing: string[] = [];
        for (const page of pages) {
            const before = problems.length;
            const facts = domFacts(page.html);
            for (const part of facts.forbidden) {
                problems.push(
                    `${page.id} ${part.name}: the page holds ${part.count} parts of the forbidden list ` +
                        `(the rule is 0).`,
                );
            }
            if (facts.bandWordTexts > 0) {
                problems.push(
                    `${page.id} band-word: the page holds ${facts.bandWordTexts} text nodes that equal a band ` +
                        `name (the rule is 0).`,
                );
            }
            if (facts.gameMatches > 0) {
                problems.push(
                    `${page.id} body: the page holds ${facts.gameMatches} XP or sprout matches outside the panel ` +
                        `value and the contact lines (the rule is 0).`,
                );
            }
            if (problems.length > before) failing.push(page.id);
        }
        // S5 changed 2026-11-11 (F1 F2): the page 12 pages hold no band word, no band icon, no XP bar, and no game bar.
        for (const entry of page12) {
            const before = problems.length;
            const facts = domFacts(entry.raw.html);
            for (const part of facts.forbidden) {
                problems.push(
                    `${entry.id} ${part.name}: the page holds ${part.count} parts of the forbidden list (the rule is 0).`,
                );
            }
            if (facts.bandWordTexts > 0) {
                problems.push(
                    `${entry.id} band-word: the page holds ${facts.bandWordTexts} text nodes that equal a band name ` +
                        '(the rule is 0).',
                );
            }
            if (facts.gameMatches > 0) {
                problems.push(
                    `${entry.id} body: the page holds ${facts.gameMatches} XP or sprout matches outside the panel value ` +
                        'and the contact lines (the rule is 0).',
                );
            }
            if (problems.length > before) failing.push(entry.id);
        }
        expectRule('S5', { problems, failing, checked: pages.length + page12.length, scope: pages.length + page12.length });
    });
});
