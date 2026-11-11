// @vitest-environment jsdom
/**
 * Red of the reader chrome in the logo colors (track storytime_cover_options_20261106, Phase 2, the
 * Task (Red, readers r2b) pair of 2026-11-11).
 *
 * The finding (the PM look with the cover checklist, 2026-11-11): the A3 reader logo tile passes.
 * The A3 readers fail 3 checklist points: (a) the chrome is not in the logo colors, (b) the blue
 * plaque with the crystal diamond ends is game UI, and (c) the title text fills about 35 to 40 % of
 * the plaque height and the role bar text uses about 40 % of its width. The leaf fails the
 * checklist point "product logo on the cover". The PM accepted the leaf series box of 68 to 103 mm
 * at 9 pt on one line.
 *
 * The owner order (the PM order of 2026-11-11, word for word): "PM look with the cover checklist,
 * and decisions (all PM; no question for Daniel before the fix): LOOK RESULT, A3 readers (14): logo
 * tile PASS (centered, logo colors, no band word, no series banner). FAIL on 3 checklist points:
 * (a) Chrome in the logo colors: the title plaque is blue, the week pill and the role bar are navy.
 * The r2 book covers that Daniel picked use amber #fcd34d fill with brown #92400e border and text.
 * My earlier "only the top chrome changes" default was wrong against his checklist; I withdraw it.
 * (b) No game UI: the blue plaque with the crystal diamond ends is the game banner style. Use a
 * plain plaque like the r2 student-book bottom plaque. (c) Text fills about 80 % and is centered:
 * the title text uses about 35-40 % of the plaque height. Size it to about 80 % of the plaque
 * height, centered; the plaque width follows the title (with a min and a max, and long titles wrap
 * to 2 lines before they shrink). The role bar fits its text with even padding (now the text uses
 * about 40 % of the bar width). LOOK RESULT, leaf (14): FAIL "product logo on the cover": add a
 * K-only logo tile (the STA logo + wordmark in K tints only) at the top center, at the place and
 * scale of the A3 tile. Your series-box default (35 mm, 68-103 mm, one line at 9 pt) is ACCEPTED."
 *
 * The design (the orchestrator pins of 2026-11-11, made exact here):
 *   D1: With the top style `hlogo`, the A3 title plaque is drawn in the r2 book plaque style: the
 *       same call as the book plaque, `plaqueSvg(width, height, LOGO_AMBER, true,
 *       PLAQUE_AMBER_PALETTE)`. The plaque holds the colors of `PLAQUE_AMBER_PALETTE`: the outer
 *       fill and stroke `#92400E`, the ring `#FEF3C7`, the band `#FCD34D`, the ornament fills
 *       `#FEF3C7` and `#FFFFFF`, and the diamond fills `#fcd34d` and `#FFFFFF`. The plaque holds
 *       exactly 2 crystal groups, `<g transform="translate(`, and their centers lie inside the
 *       plaque box. The plaque holds none of the colors of `PLAQUE_BLUE_PALETTE`. The
 *       `data-plaque-colour` value is `#FCD34D`. The title text is `#92400E` with no text stroke.
 *   D2: With `hlogo`, the A3 week pill and role bar take the fill `#FCD34D`, a 0.6 mm border
 *       `#92400E`, and the text `#92400E`. The role mark icon stroke is `#92400E`.
 *   D3: With `hlogo`, the title text box fills 80 % ± 5 % of the plaque band height (the plaque
 *       height minus 5.6 mm), and its center lies at the band center within 1 mm on both axes. The
 *       title text box lies clear of each crystal group box by at least 2 mm. The plaque width is
 *       the title width plus 2 x 27 mm, at least 120 mm and at most 340 mm. The plaque is centered
 *       on the 420 mm page within 0.5 mm. The plaque bottom stays at 276 mm. A title wider than the
 *       maximum wraps to 2 lines at the same font size, and the plaque grows upward.
 *   D4: With `hlogo`, the week pill text box fills 80 % ± 5 % of the pill inner height (the box
 *       height minus 1.2 mm) and is centered in the pill within 0.5 mm. The role bar label text box
 *       fills 80 % ± 5 % of the bar inner height. The bar width is its content (the icon and the
 *       label) plus 2 paddings that differ by at most 0.5 mm. The bar is centered on the page
 *       within 0.5 mm. Its top 278 mm and its height 12 mm stay.
 *   D5: With `hlogo`, the leaf cover holds one `logo-tile` part in the new box
 *       `reader-leaf:logo-tile` = `{ kind: 'reader-leaf', leftMm: 59.6, topMm: 5.7, widthMm: 78.8,
 *       heightMm: 25.5 }`. The tile fill and border are grays (r = g = b). Its one image is the new
 *       file `content/storytime/covers/logos/storytime-advantage-horizontal-k.svg`. Every color of
 *       that file is a gray, its viewBox equals the viewBox of `storytime-advantage-horizontal.svg`,
 *       and it holds the same count of `path` elements. The leaf default render holds no logo tile.
 *   D6: In both styles, the leaf series box is `reader-leaf:series` = `{ kind: 'reader-leaf',
 *       leftMm: 68, topMm: 137, widthMm: 35, heightMm: 6 }`, and in Chrome the series text has 1
 *       line box with its right edge at or before 103 mm, on 14 of 14 rows.
 *   D7: The default (banner) A3 render stays byte-equal to the pins of
 *       `quest-cover-readers-r2.test.ts` R4, and P6 of `quest-cover-plaque-fit.test.ts` stays
 *       valid. The default leaf render changes only in its series part. With `hlogo`, the leaf
 *       parts other than the new tile keep the HTML of the default leaf render.
 *   D8: The 4 book kinds (student and teacher, front and back) keep their bytes in both styles.
 *
 * The contract of this file:
 *   B1: D1 on 14 rows: the plaque colors, `data-plaque-colour`, the 2 crystal groups, and no color
 *       of the blue palette. The title text color and the text stroke.
 *   B2: D2 on 14 rows: the week pill and role bar fill, border width, border color, and text color,
 *       and the role mark icon stroke.
 *   B3: D3 on 14 rows: the title text box fill share, the centring on the band, 1 line box, and
 *       the clearance from each crystal group box.
 *   B4: D3 on 14 rows: the plaque width rule, the page centring, and the plaque bottom.
 *   B5: D3 on 1 synthetic row: a title of 40 characters wraps to 2 line boxes at the same font size
 *       as the 1-line titles, the plaque width stays at or below 340 mm, and the plaque bottom
 *       stays at 276 mm.
 *   B6: D4 on 14 rows: the week pill text fill share and its centring.
 *   B7: D4 on 14 rows: the role bar label fill share, the even paddings, the bar fits its text, the
 *       page centring, and the top and the height.
 *   B8: D5: the box `reader-leaf:logo-tile`, the logo tile of the 14 hlogo leaf renders, and no
 *       logo tile in the 14 default leaf renders.
 *   B9: D5: the K logo file holds only grays, the same viewBox, and the same `path` count as the
 *       color logo.
 *   B10: D6 on 14 rows and both styles: the series box values, 1 line box, and the right edge.
 *   B11: D7: with `hlogo`, the leaf parts other than the logo tile equal the default leaf render
 *       parts.
 *   B12: D8: the 8 pins of the 4 book kinds, in the default style and in the `hlogo` style.
 *
 * The method notes:
 *   - The text box measure is the method of `quest-cover-plaque-fit.test.ts`: a range over the
 *     text node gives its box. The band is the path whose fill equals `data-plaque-colour`.
 *   - The plaque box is the union of the plaque part box and the plaque SVG box, so the rule holds
 *     for a plaque of a fixed size and for a plaque of a fitted size.
 *   - The crystal group box is the browser box of the `<g>` element, so the clearance is the
 *     horizontal gap between the title text box and the group box.
 *   - The border width is read from the inline style, because the browser rounds a computed border
 *     width to whole pixels.
 *   - The rule "the bar width is its content plus 2 even paddings" needs a bound on the padding.
 *     The PM rule "the role bar fits its text" gives the bound: the content fills at least 60 % of
 *     the bar width. At the role base the content fills 48.8 % of the bar width.
 *   - The synthetic title of B5 has 40 characters. It wraps to 2 line boxes at every font size
 *     from 55 pt to 110 pt in a 286 mm box, so the rule of D3 holds for any font size of the
 *     plaque band.
 *   - The pins of B12 are the SHA-256 values of the renders at the role base `916d3d33`. The book
 *     row and the fixed art are the ones of `quest-cover-hlogo.test.ts`.
 *   - The file reads no week file and prints no page. The 14 rows hold English titles only. The
 *     book backs hold Thai contact lines; the file prints their hashes only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from '@playwright/test';
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

/** The amber of the logo tile and of the plaque band. */
const AMBER = '#FCD34D';

/** The brown of the logo edge and of the plaque frame. */
const BROWN = '#92400E';

/** The cream of the plaque ring. */
const CREAM = '#FEF3C7';

/** The white of the plaque ornaments. */
const WHITE = '#FFFFFF';

/** The colors of `PLAQUE_BLUE_PALETTE` that the hlogo plaque must not hold. */
const BLUE_PALETTE_COLOURS = [
    '#E7EEF7',
    '#8FA3BF',
    '#123E73',
    '#5A9AD6',
    '#DCE9F8',
    '#EAF4FF',
    '#7F9BC0',
    '#C9DDF4',
];

/** The least fill share of a text box, 80 % minus 5 %. */
const MIN_FILL_SHARE = 0.75;

/** The most fill share of a text box, 80 % plus 5 %. */
const MAX_FILL_SHARE = 0.85;

/** The tolerance of the centring of a text box in its band, in millimetres. */
const BAND_CENTRE_TOLERANCE_MM = 1;

/** The tolerance of the centring of a part on the page, in millimetres. */
const PAGE_CENTRE_TOLERANCE_MM = 0.5;

/** The tolerance of the even paddings of the role bar, in millimetres. */
const PADDING_TOLERANCE_MM = 0.5;

/** The tolerance of the width rule of the plaque, in millimetres. */
const WIDTH_TOLERANCE_MM = 0.5;

/** The clearance of the title text box from each crystal group box, in millimetres. */
const ORNAMENT_CLEARANCE_MM = 2;

/** The least share of the role bar width that the content fills. */
const MIN_BAR_CONTENT_SHARE = 0.6;

/** The padding of the plaque on each side of the title, in millimetres. */
const PLAQUE_PADDING_MM = 27;

/** The least width of the plaque, in millimetres. */
const MIN_PLAQUE_WIDTH_MM = 120;

/** The most width of the plaque, in millimetres. */
const MAX_PLAQUE_WIDTH_MM = 340;

/** The bottom of the plaque, in millimetres. */
const PLAQUE_BOTTOM_MM = 276;

/** The top of the role bar, in millimetres. */
const ROLE_BAR_TOP_MM = 278;

/** The height of the role bar, in millimetres. */
const ROLE_BAR_HEIGHT_MM = 12;

/** The inner size of the week pill and of the role bar: the box size minus 1.2 mm. */
const INNER_SIZE_MM = 1.2;

/** The border width of the week pill and of the role bar, in millimetres. */
const BORDER_WIDTH_MM = 0.6;

/** The right edge of the leaf series text, in millimetres. */
const SERIES_RIGHT_MM = 103;

/** The title of the synthetic row of B5: 40 characters. */
const LONG_TITLE = "Antidisestablishmentarian's Unbelievable";

/** The repo root. */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The URL of the gray horizontal Storytime Advantage logo, the K logo. */
const K_LOGO_URL = pathToFileURL(
    path.join(repoRoot, 'content', 'storytime', 'covers', 'logos', 'storytime-advantage-horizontal-k.svg'),
).href;

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

/** The pins of the 4 book kinds, in the default style and in the hlogo style, at the role base. */
const BOOK_PINS: Record<string, string> = {
    'student-front:default': '5ae17617643524865a9dbbc63cc73754b0170fbe5063bc71d35399288d3265b6',
    'student-front:hlogo': '76168718378d7f8fe37205d298cbf1bca6154b830c56fa642f654a6d3ea5ac31',
    'teacher-front:default': 'b526e81e4f6aa9e9c94d8354f334e4d044b9ca22f8e7f5b344b28fe515895daf',
    'teacher-front:hlogo': 'c764a1642611a89425c15d18a5b302383c5badc657603a8d155c86eecdf1d432',
    'student-back:default': '8bdd615af444553c3aecca920c809beb5d52bc7ec7cc819763b837b76d4df2b0',
    'student-back:hlogo': '863df9afc2cbe441a0b0a35b89a516edd2bbfe83c64b8558e8d7fa5819d31ac2',
    'teacher-back:default': '5e086f4fcc6b2ba6d799f9c9d16212338ff5cf4d0c055cd5319fbd5ad486be79',
    'teacher-back:hlogo': 'f7666628f955c41d946ce50df11b1ffa366693e2542f7e962ccec165a1f43fab',
};

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

/** The measure of the text of one part. */
interface TextMeasure {
    /** The line boxes of the text. */
    rects: RawBox[];
    /** The font size of the text, in pixels. */
    fontPx: number;
    /** The computed color of the text. */
    colour: string;
    /** The computed text stroke width of the text. */
    stroke: string;
}

/** The measurement of the A3 reader cover of one row. */
interface A3Measure {
    /** The row id. */
    id: string;
    /** The box of the page. */
    page: RawBox | null;
    /** The `data-plaque-colour` value of the title plaque. */
    plaqueColour: string;
    /** The fill and stroke values of the paths and the groups of the title plaque. */
    plaqueColours: string[];
    /** The fill and stroke values inside the crystal groups. */
    groupColours: string[];
    /** The number of the crystal groups. */
    groupCount: number;
    /** The boxes of the crystal groups. */
    groupBoxes: RawBox[];
    /** The box of the title plaque. */
    plaque: RawBox | null;
    /** The box of the band, the path whose fill equals `data-plaque-colour`. */
    band: RawBox | null;
    /** The measure of the title text. */
    title: TextMeasure;
    /** The week pill. */
    pill: {
        /** The box of the pill. */
        box: RawBox | null;
        /** The computed background color. */
        background: string;
        /** The computed border color. */
        borderColour: string;
        /** The computed text color. */
        colour: string;
        /** The inline style of the pill. */
        inline: string;
        /** The measure of the pill text. */
        text: TextMeasure;
    };
    /** The role bar. */
    bar: {
        /** The box of the bar. */
        box: RawBox | null;
        /** The computed background color. */
        background: string;
        /** The computed border color. */
        borderColour: string;
        /** The computed text color. */
        colour: string;
        /** The inline style of the bar. */
        inline: string;
        /** The stroke of the role mark icon. */
        iconStroke: string;
        /** The box of the role mark icon. */
        iconBox: RawBox | null;
        /** The box of the role bar label. */
        labelBox: RawBox | null;
        /** The measure of the role bar label. */
        text: TextMeasure;
    };
}

/** The measurement of the leaf reader cover of one row. */
interface LeafMeasure {
    /** The row id. */
    id: string;
    /** The top style of the render. */
    style: string;
    /** The box of the series part. */
    seriesBox: RawBox | null;
    /** The line boxes of the series text. */
    seriesRects: RawBox[];
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of the layout checks. */
let browser: Browser | undefined;

/** The measurements of the 14 A3 reader rows. */
const a3Measures: A3Measure[] = [];

/** The measurements of the 28 leaf reader renders. */
const leafMeasures: LeafMeasure[] = [];

/** The measurement of the synthetic row of B5. */
let syntheticMeasure: A3Measure | null = null;

/** The render options of the default style. */
const DEFAULT_OPTIONS: QuestRenderOptions = { bleedMm: 0 };

/** The render options of the r2 style: the horizontal logo on its tile. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

/**
 * Reads the SHA-256 of one text.
 * @param text The text.
 * @returns The hash.
 */
function hashOfText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
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
 * Reads the red, green, and blue parts of one color.
 * @param value The color, as a hex or an rgb value.
 * @returns The parts, or null when the value holds no color.
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
 * Tells when one color is a gray.
 * @param value The color.
 * @returns True when the red, green, and blue parts are equal.
 */
function isGrey(value: string): boolean {
    const rgb = rgbOf(value);
    if (!rgb) return false;
    return rgb.r === rgb.g && rgb.g === rgb.b;
}

/**
 * Reads the border width of one inline style, in millimetres.
 * @param style The inline style.
 * @returns The width in millimetres, or null when the style holds no border width.
 */
function borderWidthMm(style: string): number | null {
    const longhand = /border-width\s*:\s*([^;]+)/i.exec(style);
    const shorthand = /border\s*:\s*([^;]+)/i.exec(style);
    const value = longhand ? longhand[1] : shorthand ? shorthand[1] : '';
    const match = /(-?[\d.]+)\s*(mm|px|pt|em)/.exec(value);
    if (!match) return null;
    const number = Number.parseFloat(match[1]);
    if (!Number.isFinite(number)) return null;
    if (match[2] === 'mm') return number;
    if (match[2] === 'px') return number * (25.4 / 96);
    if (match[2] === 'pt') return number * (25.4 / 72);
    return null;
}

/**
 * Reads the color of one inline style property.
 * @param style The inline style.
 * @param property The name of the property.
 * @returns The color value, or an empty text when the style holds no color.
 */
function inlineColour(style: string, property: string): string {
    const match = new RegExp(`${property}\\s*:\\s*([^;]+)`, 'i').exec(style);
    if (!match) return '';
    const colour = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/i.exec(match[1]);
    return colour ? colour[1] : '';
}

/**
 * Reads the 14 reader rows of the shipped Level 2 weeks.
 * @returns The rows.
 */
function readerRows(): QuestReaderRow[] {
    const rows = questReaders();
    expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
    return rows;
}

/**
 * Renders the A3 reader cover of one row.
 * @param row The reader row.
 * @param opts The render options.
 * @returns The rendered document.
 */
function a3Html(row: QuestReaderRow, opts: QuestRenderOptions): string {
    return renderQuestCover('reader-a3', row, { art: ART }, opts);
}

/**
 * Renders the leaf reader cover of one row.
 * @param row The reader row.
 * @param opts The render options.
 * @returns The rendered document.
 */
function leafHtml(row: QuestReaderRow, opts: QuestRenderOptions): string {
    return renderQuestCover('reader-leaf', row, { art: ART }, opts);
}

/**
 * Writes one rendered document into a file and opens it in the browser.
 * @param page The browser page.
 * @param name The name of the file.
 * @param html The rendered document.
 * @returns Nothing.
 */
async function openInBrowser(page: Page, name: string, html: string): Promise<void> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-readers-r2b-'));
    scratch.push(folder);
    const file = path.join(folder, `${name}.html`);
    fs.writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
}

/**
 * Measures the A3 reader cover of one row in Chrome.
 * @param page The browser page.
 * @param id The row id.
 * @param html The rendered document.
 * @returns The measurement.
 */
async function measureA3(page: Page, id: string, html: string): Promise<A3Measure> {
    await openInBrowser(page, id, html);
    const raw = await page.evaluate((): Omit<A3Measure, 'id'> => {
        const mm = 25.4 / 96;
        const boxOf = (element: Element | null): RawBox | null => {
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return { left: rect.left * mm, top: rect.top * mm, right: rect.right * mm, bottom: rect.bottom * mm };
        };
        const union = (first: RawBox | null, second: RawBox | null): RawBox | null => {
            if (!first) return second;
            if (!second) return first;
            return {
                left: Math.min(first.left, second.left),
                top: Math.min(first.top, second.top),
                right: Math.max(first.right, second.right),
                bottom: Math.max(first.bottom, second.bottom),
            };
        };
        const textOf = (root: Element): TextMeasure => {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            const rects: RawBox[] = [];
            let fontPx = 0;
            let colour = '';
            let stroke = '';
            while (walker.nextNode()) {
                const node = walker.currentNode as Text;
                if (!(node.nodeValue ?? '').trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                for (const rect of Array.from(range.getClientRects())) {
                    rects.push({
                        left: rect.left * mm,
                        top: rect.top * mm,
                        right: rect.right * mm,
                        bottom: rect.bottom * mm,
                    });
                }
                const parent = node.parentElement;
                if (parent) {
                    const style = window.getComputedStyle(parent);
                    fontPx = Number.parseFloat(style.fontSize);
                    colour = style.color;
                    const width = (style as unknown as Record<string, string>).webkitTextStrokeWidth;
                    stroke = typeof width === 'string' ? width : '';
                }
            }
            return { rects, fontPx, colour, stroke };
        };
        const plaque = document.querySelector('[data-part="title-plaque"]');
        const plaqueColour = plaque?.getAttribute('data-plaque-colour') ?? '';
        const paths = Array.from(plaque?.querySelectorAll('path') ?? []);
        const groups = Array.from(plaque?.querySelectorAll('g') ?? []);
        const crystalGroups = groups.filter((group) =>
            (group.getAttribute('transform') ?? '').startsWith('translate('),
        );
        const plaqueColours: string[] = [];
        for (const element of [...paths, ...groups]) {
            for (const name of ['fill', 'stroke']) {
                const value = element.getAttribute(name);
                if (value) plaqueColours.push(value);
            }
        }
        const groupColours: string[] = [];
        for (const group of crystalGroups) {
            for (const element of Array.from(group.querySelectorAll('path'))) {
                for (const name of ['fill', 'stroke']) {
                    const value = element.getAttribute(name);
                    if (value) groupColours.push(value);
                }
            }
        }
        const band = paths.find(
            (path) => (path.getAttribute('fill') ?? '').toLowerCase() === plaqueColour.toLowerCase(),
        );
        const pill = document.querySelector('[data-part="week-pill"]');
        const pillStyle = pill ? window.getComputedStyle(pill) : null;
        const bar = document.querySelector('[data-part="role-bar"]');
        const barStyle = bar ? window.getComputedStyle(bar) : null;
        const spans = bar ? Array.from(bar.querySelectorAll('span')) : [];
        const icon = spans.length > 0 ? spans[0] : null;
        const label = spans.length > 1 ? spans[spans.length - 1] : null;
        const iconGroup = bar?.querySelector('svg g') ?? null;
        return {
            page: boxOf(document.querySelector('.quest-page')),
            plaqueColour,
            plaqueColours,
            groupColours,
            groupCount: crystalGroups.length,
            groupBoxes: crystalGroups.map((group) => boxOf(group) as RawBox),
            plaque: union(boxOf(plaque), boxOf(plaque?.querySelector('svg') ?? null)),
            band: boxOf(band ?? null),
            title: plaque ? textOf(plaque) : { rects: [], fontPx: 0, colour: '', stroke: '' },
            pill: {
                box: boxOf(pill),
                background: pillStyle?.backgroundColor ?? '',
                borderColour: pillStyle?.borderTopColor ?? '',
                colour: pillStyle?.color ?? '',
                inline: pill?.getAttribute('style') ?? '',
                text: pill ? textOf(pill) : { rects: [], fontPx: 0, colour: '', stroke: '' },
            },
            bar: {
                box: boxOf(bar),
                background: barStyle?.backgroundColor ?? '',
                borderColour: barStyle?.borderTopColor ?? '',
                colour: barStyle?.color ?? '',
                inline: bar?.getAttribute('style') ?? '',
                iconStroke: iconGroup?.getAttribute('stroke') ?? '',
                iconBox: boxOf(icon),
                labelBox: boxOf(label),
                text: label ? textOf(label) : { rects: [], fontPx: 0, colour: '', stroke: '' },
            },
        };
    });
    return { id, ...raw };
}

/**
 * Measures the leaf reader cover of one row in Chrome.
 * @param page The browser page.
 * @param id The row id.
 * @param style The name of the top style.
 * @param html The rendered document.
 * @returns The measurement.
 */
async function measureLeaf(page: Page, id: string, style: string, html: string): Promise<LeafMeasure> {
    await openInBrowser(page, `${id}-${style}`, html);
    const raw = await page.evaluate((): Omit<LeafMeasure, 'id' | 'style'> => {
        const mm = 25.4 / 96;
        const series = document.querySelector('[data-part="series"]');
        const rects: RawBox[] = [];
        if (series) {
            const walker = document.createTreeWalker(series, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const node = walker.currentNode as Text;
                if (!(node.nodeValue ?? '').trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                for (const rect of Array.from(range.getClientRects())) {
                    rects.push({
                        left: rect.left * mm,
                        top: rect.top * mm,
                        right: rect.right * mm,
                        bottom: rect.bottom * mm,
                    });
                }
            }
        }
        const box = series?.getBoundingClientRect();
        return {
            seriesBox: box
                ? { left: box.left * mm, top: box.top * mm, right: box.right * mm, bottom: box.bottom * mm }
                : null,
            seriesRects: rects,
        };
    });
    return { id, style, ...raw };
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
    if (!graph) return [];
    const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
    return storytimeCoverPanelValues(book!, { weeks, graph });
}

/**
 * Renders one book kind and reads its hash.
 * @param kind The cover kind.
 * @param top The top style.
 * @returns The SHA-256 of the render.
 */
function bookHash(
    kind: 'student-front' | 'teacher-front' | 'student-back' | 'teacher-back',
    top?: 'hlogo',
): string {
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    const book: QuestBookRow = data.books[0];
    const assets = kind === 'student-back' ? { art: ART, panelValues: panelValues() } : { art: ART };
    return hashOfText(renderQuestCover(kind, book, assets, top ? { bleedMm: 0, top } : { bleedMm: 0 }));
}

/**
 * Reads the colors of one SVG file.
 * @param doc The parsed file.
 * @returns The color values.
 */
function coloursOf(doc: XMLDocument): string[] {
    const found: string[] = [];
    for (const element of Array.from(doc.getElementsByTagName('*'))) {
        for (const name of ['fill', 'stroke', 'stop-color', 'color', 'flood-color']) {
            const value = element.getAttribute(name);
            if (value) found.push(value.trim());
        }
        const style = element.getAttribute('style');
        if (style) {
            for (const match of style.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/g) ?? []) found.push(match);
        }
    }
    return found;
}

beforeAll(async () => {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
    const active = browser;
    if (!active) throw new Error('the browser of the layout checks did not start');
    const context = await active.newContext({ viewport: { width: 1700, height: 1200 } });
    const page = await context.newPage();
    try {
        const rows = readerRows();
        for (const [index, row] of rows.entries()) {
            a3Measures.push(await measureA3(page, ROW_IDS[index], a3Html(row, HLOGO_OPTIONS)));
            leafMeasures.push(await measureLeaf(page, ROW_IDS[index], 'default', leafHtml(row, DEFAULT_OPTIONS)));
            leafMeasures.push(await measureLeaf(page, ROW_IDS[index], 'hlogo', leafHtml(row, HLOGO_OPTIONS)));
        }
        const synthetic: QuestReaderRow = { ...rows[0], title: LONG_TITLE };
        syntheticMeasure = await measureA3(page, 'synthetic', a3Html(synthetic, HLOGO_OPTIONS));
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

describe('quest-cover-readers-r2b: B1 to B12 (Red, the r2 reader chrome and the leaf logo)', () => {
    it('B1: the hlogo A3 plaque holds the r2 book plaque colors and the crystal groups', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.plaqueColour, `the plaque colour of the row ${id}.`).toBe(AMBER);
            const colours = measure.plaqueColours.map((value) => value.toLowerCase());
            for (const blue of BLUE_PALETTE_COLOURS) {
                expect(
                    colours.includes(blue.toLowerCase()),
                    `the hlogo plaque of the row ${id} holds no color of the blue palette: ${blue}.`,
                ).toBe(false);
            }
            expect(colours.includes(BROWN.toLowerCase()), `the plaque of the row ${id} holds the brown.`).toBe(true);
            expect(colours.includes(CREAM.toLowerCase()), `the plaque of the row ${id} holds the cream.`).toBe(true);
            expect(colours.includes(AMBER.toLowerCase()), `the plaque of the row ${id} holds the amber.`).toBe(true);
            expect(colours.includes(WHITE.toLowerCase()), `the plaque of the row ${id} holds the white.`).toBe(true);
            expect(
                measure.groupCount,
                `the hlogo plaque of the row ${id} holds exactly 2 crystal groups.`,
            ).toBe(2);
            const groupColours = measure.groupColours.map((value) => value.toLowerCase());
            expect(
                groupColours.includes(CREAM.toLowerCase()),
                `the crystal groups of the row ${id} hold the cream ornament.`,
            ).toBe(true);
            expect(
                groupColours.includes(WHITE.toLowerCase()),
                `the crystal groups of the row ${id} hold the white ornament.`,
            ).toBe(true);
            expect(
                groupColours.includes(AMBER.toLowerCase()),
                `the crystal groups of the row ${id} hold the amber diamond.`,
            ).toBe(true);
            expect(measure.plaque, `the hlogo A3 reader cover ${id} holds a title plaque.`).not.toBeNull();
            for (const group of measure.groupBoxes) {
                const centreX = (group.left + group.right) / 2;
                const centreY = (group.top + group.bottom) / 2;
                expect(
                    centreX >= measure.plaque!.left && centreX <= measure.plaque!.right,
                    `the center of a crystal group of the row ${id} lies inside the plaque box.`,
                ).toBe(true);
                expect(
                    centreY >= measure.plaque!.top && centreY <= measure.plaque!.bottom,
                    `the center of a crystal group of the row ${id} lies inside the plaque box.`,
                ).toBe(true);
            }
            expect(toHex(measure.title.colour), `the title text color of the row ${id}.`).toBe(BROWN.toLowerCase());
            expect(measure.title.stroke, `the title text stroke of the row ${id}.`).toBe('0px');
        }
    });

    it('B2: the hlogo week pill and role bar take the logo amber and brown', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(toHex(measure.pill.background), `the week pill fill of the row ${id}.`).toBe(AMBER.toLowerCase());
            expect(toHex(measure.pill.borderColour), `the week pill border of the row ${id}.`).toBe(BROWN.toLowerCase());
            expect(toHex(measure.pill.colour), `the week pill text of the row ${id}.`).toBe(BROWN.toLowerCase());
            expect(borderWidthMm(measure.pill.inline), `the week pill border width of the row ${id}.`).toBeCloseTo(
                BORDER_WIDTH_MM,
                2,
            );
            expect(toHex(measure.bar.background), `the role bar fill of the row ${id}.`).toBe(AMBER.toLowerCase());
            expect(toHex(measure.bar.borderColour), `the role bar border of the row ${id}.`).toBe(BROWN.toLowerCase());
            expect(toHex(measure.bar.colour), `the role bar text of the row ${id}.`).toBe(BROWN.toLowerCase());
            expect(borderWidthMm(measure.bar.inline), `the role bar border width of the row ${id}.`).toBeCloseTo(
                BORDER_WIDTH_MM,
                2,
            );
            expect(
                measure.bar.iconStroke.toLowerCase(),
                `the role mark icon stroke of the row ${id}.`,
            ).toBe(BROWN.toLowerCase());
        }
    });

    it('B3: the hlogo title text box fills the plaque band and is clear of the ornaments', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.title.rects.length, `the title text of the row ${id} has 1 line box.`).toBe(1);
            expect(measure.band, `the plaque of the row ${id} holds a band.`).not.toBeNull();
            const band = measure.band!;
            const title = measure.title.rects[0];
            const bandHeight = band.bottom - band.top;
            const share = (title.bottom - title.top) / bandHeight;
            expect(
                share,
                `the title text box of the row ${id} fills 80 % of the plaque band: ` +
                    `the text box is ${(title.bottom - title.top).toFixed(2)} mm, ` +
                    `the band is ${bandHeight.toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(MIN_FILL_SHARE);
            expect(
                share,
                `the title text box of the row ${id} fills 80 % of the plaque band: ` +
                    `the text box is ${(title.bottom - title.top).toFixed(2)} mm, ` +
                    `the band is ${bandHeight.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(MAX_FILL_SHARE);
            expect(
                Math.abs((title.top + title.bottom) / 2 - (band.top + band.bottom) / 2),
                `the title text box of the row ${id} sits at the center of the band.`,
            ).toBeLessThanOrEqual(BAND_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs((title.left + title.right) / 2 - (band.left + band.right) / 2),
                `the title text box of the row ${id} sits at the center of the band.`,
            ).toBeLessThanOrEqual(BAND_CENTRE_TOLERANCE_MM);
            for (const group of measure.groupBoxes) {
                const gap =
                    group.left > title.right
                        ? group.left - title.right
                        : title.left > group.right
                          ? title.left - group.right
                          : 0;
                expect(
                    gap,
                    `the title text box of the row ${id} lies clear of a crystal group box: ` +
                        `the gap is ${gap.toFixed(2)} mm.`,
                ).toBeGreaterThanOrEqual(ORNAMENT_CLEARANCE_MM);
            }
        }
    });

    it('B4: the hlogo plaque width follows the title and the plaque sits on the page', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.title.rects.length, `the title text of the row ${id} has 1 line box.`).toBe(1);
            expect(measure.plaque, `the hlogo A3 reader cover ${id} holds a title plaque.`).not.toBeNull();
            const plaque = measure.plaque!;
            const title = measure.title.rects[0];
            const titleWidth = title.right - title.left;
            const wanted = Math.min(
                MAX_PLAQUE_WIDTH_MM,
                Math.max(MIN_PLAQUE_WIDTH_MM, titleWidth + 2 * PLAQUE_PADDING_MM),
            );
            expect(
                Math.abs((plaque.right - plaque.left) - wanted),
                `the plaque width of the row ${id} follows the title: the title is ${titleWidth.toFixed(2)} mm, ` +
                    `the plaque is ${(plaque.right - plaque.left).toFixed(2)} mm, the rule gives ${wanted.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(WIDTH_TOLERANCE_MM);
            expect(
                plaque.right - plaque.left,
                `the plaque width of the row ${id} stays between ${MIN_PLAQUE_WIDTH_MM} mm and ${MAX_PLAQUE_WIDTH_MM} mm.`,
            ).toBeGreaterThanOrEqual(MIN_PLAQUE_WIDTH_MM);
            expect(
                plaque.right - plaque.left,
                `the plaque width of the row ${id} stays between ${MIN_PLAQUE_WIDTH_MM} mm and ${MAX_PLAQUE_WIDTH_MM} mm.`,
            ).toBeLessThanOrEqual(MAX_PLAQUE_WIDTH_MM);
            expect(measure.page, `the A3 reader cover ${id} holds a page.`).not.toBeNull();
            const page = measure.page!;
            expect(
                Math.abs((plaque.left + plaque.right) / 2 - (page.left + page.right) / 2),
                `the plaque of the row ${id} is centered on the page.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(plaque.bottom - PLAQUE_BOTTOM_MM),
                `the plaque bottom of the row ${id} is ${PLAQUE_BOTTOM_MM} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
        }
    });

    it('B5: a title of 40 characters wraps to 2 lines and the plaque grows upward', () => {
        expect(syntheticMeasure, 'the browser measures the synthetic row.').not.toBeNull();
        const measure = syntheticMeasure!;
        expect(LONG_TITLE.length, 'the synthetic title has 40 characters.').toBe(40);
        expect(measure.title.rects.length, 'the synthetic title has 2 line boxes.').toBe(2);
        const first = a3Measures[0];
        expect(first, 'the browser measures the first A3 row.').toBeDefined();
        expect(
            Math.abs(measure.title.fontPx - first.title.fontPx),
            `the synthetic title keeps the font size of the 1-line titles: ` +
                `${measure.title.fontPx.toFixed(2)} px and ${first.title.fontPx.toFixed(2)} px.`,
        ).toBeLessThanOrEqual(0.05);
        expect(measure.plaque, 'the synthetic cover holds a title plaque.').not.toBeNull();
        const plaque = measure.plaque!;
        expect(
            plaque.right - plaque.left,
            `the plaque width of the synthetic row stays at or below ${MAX_PLAQUE_WIDTH_MM} mm.`,
        ).toBeLessThanOrEqual(MAX_PLAQUE_WIDTH_MM);
        expect(
            Math.abs(plaque.bottom - PLAQUE_BOTTOM_MM),
            `the plaque bottom of the synthetic row is ${PLAQUE_BOTTOM_MM} mm.`,
        ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
    });

    it('B6: the hlogo week pill text fills the pill and sits at its center', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.pill.box, `the hlogo A3 reader cover ${id} holds a week pill.`).not.toBeNull();
            expect(measure.pill.text.rects.length, `the week pill text of the row ${id} has 1 line box.`).toBe(1);
            const pill = measure.pill.box!;
            const text = measure.pill.text.rects[0];
            const innerHeight = pill.bottom - pill.top - INNER_SIZE_MM;
            const share = (text.bottom - text.top) / innerHeight;
            expect(
                share,
                `the week pill text of the row ${id} fills 80 % of the pill inner height: ` +
                    `the text box is ${(text.bottom - text.top).toFixed(2)} mm, ` +
                    `the inner height is ${innerHeight.toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(MIN_FILL_SHARE);
            expect(
                share,
                `the week pill text of the row ${id} fills 80 % of the pill inner height: ` +
                    `the text box is ${(text.bottom - text.top).toFixed(2)} mm, ` +
                    `the inner height is ${innerHeight.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(MAX_FILL_SHARE);
            expect(
                Math.abs((text.top + text.bottom) / 2 - (pill.top + pill.bottom) / 2),
                `the week pill text of the row ${id} sits at the center of the pill.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs((text.left + text.right) / 2 - (pill.left + pill.right) / 2),
                `the week pill text of the row ${id} sits at the center of the pill.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
        }
    });

    it('B7: the hlogo role bar fits its text with even padding', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.bar.box, `the hlogo A3 reader cover ${id} holds a role bar.`).not.toBeNull();
            expect(measure.bar.iconBox, `the role bar of the row ${id} holds a role mark icon.`).not.toBeNull();
            expect(measure.bar.labelBox, `the role bar of the row ${id} holds a label.`).not.toBeNull();
            expect(measure.bar.text.rects.length, `the role bar label of the row ${id} has 1 line box.`).toBe(1);
            const bar = measure.bar.box!;
            const icon = measure.bar.iconBox!;
            const label = measure.bar.labelBox!;
            const text = measure.bar.text.rects[0];
            const innerHeight = bar.bottom - bar.top - INNER_SIZE_MM;
            const share = (text.bottom - text.top) / innerHeight;
            expect(
                share,
                `the role bar label of the row ${id} fills 80 % of the bar inner height: ` +
                    `the text box is ${(text.bottom - text.top).toFixed(2)} mm, ` +
                    `the inner height is ${innerHeight.toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(MIN_FILL_SHARE);
            expect(
                share,
                `the role bar label of the row ${id} fills 80 % of the bar inner height: ` +
                    `the text box is ${(text.bottom - text.top).toFixed(2)} mm, ` +
                    `the inner height is ${innerHeight.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(MAX_FILL_SHARE);
            const leftPadding = icon.left - bar.left;
            const rightPadding = bar.right - label.right;
            expect(
                Math.abs(leftPadding - rightPadding),
                `the role bar of the row ${id} has even paddings: the left is ${leftPadding.toFixed(2)} mm, ` +
                    `the right is ${rightPadding.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PADDING_TOLERANCE_MM);
            const contentWidth = label.right - icon.left;
            const innerWidth = bar.right - bar.left - INNER_SIZE_MM;
            expect(
                contentWidth / innerWidth,
                `the role bar of the row ${id} fits its text: the content fills ` +
                    `${((contentWidth / innerWidth) * 100).toFixed(1)} % of the bar width.`,
            ).toBeGreaterThanOrEqual(MIN_BAR_CONTENT_SHARE);
            expect(measure.page, `the A3 reader cover ${id} holds a page.`).not.toBeNull();
            const page = measure.page!;
            expect(
                Math.abs((bar.left + bar.right) / 2 - (page.left + page.right) / 2),
                `the role bar of the row ${id} is centered on the page.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(bar.top - ROLE_BAR_TOP_MM),
                `the role bar top of the row ${id} is ${ROLE_BAR_TOP_MM} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(bar.bottom - bar.top - ROLE_BAR_HEIGHT_MM),
                `the role bar height of the row ${id} is ${ROLE_BAR_HEIGHT_MM} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
        }
    });

    it('B8: the hlogo leaf cover holds one gray logo tile and the default leaf holds none', () => {
        const tile = QUEST_BOXES['reader-leaf:logo-tile'];
        expect(tile, 'the box table holds the key reader-leaf:logo-tile.').toBeDefined();
        expect(tile!.kind, 'the kind of the leaf logo tile.').toBe('reader-leaf');
        expect(tile!.leftMm, 'the left of the leaf logo tile is 59.6 mm.').toBe(59.6);
        expect(tile!.topMm, 'the top of the leaf logo tile is 5.7 mm.').toBe(5.7);
        expect(tile!.widthMm, 'the width of the leaf logo tile is 78.8 mm.').toBe(78.8);
        expect(tile!.heightMm, 'the height of the leaf logo tile is 25.5 mm.').toBe(25.5);
        const rows = readerRows();
        for (const [index, row] of rows.entries()) {
            const id = ROW_IDS[index];
            const plain = parseHtml(leafHtml(row, DEFAULT_OPTIONS));
            expect(
                plain.querySelectorAll('[data-part="logo-tile"]').length,
                `the default leaf reader cover ${id} holds no logo tile.`,
            ).toBe(0);
            const alt = parseHtml(leafHtml(row, HLOGO_OPTIONS));
            const tiles = alt.querySelectorAll('[data-part="logo-tile"]');
            expect(tiles.length, `the hlogo leaf reader cover ${id} holds one logo tile.`).toBe(1);
            const images = Array.from(tiles[0].querySelectorAll('img'));
            expect(images.length, `the logo tile of the hlogo leaf reader cover ${id} holds one image.`).toBe(1);
            expect(
                images[0].getAttribute('src') ?? '',
                `the logo tile of the hlogo leaf reader cover ${id} holds the K logo.`,
            ).toBe(K_LOGO_URL);
            const style = tiles[0].getAttribute('style') ?? '';
            expect(
                isGrey(inlineColour(style, 'background(?:-color)?')),
                `the logo tile fill of the leaf reader cover ${id} is a gray.`,
            ).toBe(true);
            expect(
                isGrey(inlineColour(style, 'border(?:-color)?')),
                `the logo tile border of the leaf reader cover ${id} is a gray.`,
            ).toBe(true);
        }
    });

    it('B9: the K logo file holds only grays and the same shape as the color logo', () => {
        const logoDir = path.join(repoRoot, 'content', 'storytime', 'covers', 'logos');
        const kFile = path.join(logoDir, 'storytime-advantage-horizontal-k.svg');
        const colourFile = path.join(logoDir, 'storytime-advantage-horizontal.svg');
        expect(fs.existsSync(kFile), 'the K logo file sits in content/storytime/covers/logos/.').toBe(true);
        const kDoc = new DOMParser().parseFromString(fs.readFileSync(kFile, 'utf8'), 'text/xml');
        const colourDoc = new DOMParser().parseFromString(fs.readFileSync(colourFile, 'utf8'), 'text/xml');
        expect(kDoc.querySelector('parsererror'), 'the K logo file parses.').toBeNull();
        const colours = coloursOf(kDoc);
        expect(colours.length, 'the K logo file holds colors.').toBeGreaterThan(0);
        for (const colour of colours) {
            expect(isGrey(colour), `every color of the K logo file is a gray: ${colour}.`).toBe(true);
        }
        expect(
            kDoc.documentElement.getAttribute('viewBox'),
            'the K logo holds the viewBox of the color logo.',
        ).toBe(colourDoc.documentElement.getAttribute('viewBox'));
        expect(
            kDoc.getElementsByTagName('path').length,
            'the K logo holds the same count of path elements as the color logo.',
        ).toBe(colourDoc.getElementsByTagName('path').length);
    });

    it('B10: the leaf series line stays on one line inside the 35 mm box', () => {
        const box = QUEST_BOXES['reader-leaf:series'];
        expect(box, 'the box table holds the key reader-leaf:series.').toBeDefined();
        expect(box!.kind, 'the kind of the leaf series box.').toBe('reader-leaf');
        expect(box!.leftMm, 'the left of the leaf series box is 68 mm.').toBe(68);
        expect(box!.topMm, 'the top of the leaf series box is 137 mm.').toBe(137);
        expect(box!.widthMm, 'the width of the leaf series box is 35 mm.').toBe(35);
        expect(box!.heightMm, 'the height of the leaf series box is 6 mm.').toBe(6);
        expect(leafMeasures.length, 'the browser measures 28 leaf renders.').toBe(28);
        for (const measure of leafMeasures) {
            const id = `${measure.id} (${measure.style})`;
            expect(measure.seriesBox, `the leaf reader cover ${id} holds a series part.`).not.toBeNull();
            expect(measure.seriesRects.length, `the series text of the leaf reader cover ${id} has 1 line box.`).toBe(1);
            const text = measure.seriesRects[0];
            expect(
                text.right,
                `the series text of the leaf reader cover ${id} ends at or before ${SERIES_RIGHT_MM} mm: ` +
                    `the right edge is ${text.right.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(SERIES_RIGHT_MM);
        }
    });

    it('B11: the hlogo leaf parts keep the HTML of the default leaf render', () => {
        const rows = readerRows();
        for (const [index, row] of rows.entries()) {
            const id = ROW_IDS[index];
            const plain = parseHtml(leafHtml(row, DEFAULT_OPTIONS));
            const alt = parseHtml(leafHtml(row, HLOGO_OPTIONS));
            const tiles = alt.querySelectorAll('[data-part="logo-tile"]');
            expect(tiles.length, `the hlogo leaf reader cover ${id} holds one logo tile.`).toBe(1);
            for (const part of Array.from(alt.querySelectorAll('[data-part]'))) {
                const name = part.getAttribute('data-part') ?? '';
                if (name === 'logo-tile') continue;
                const one = plain.querySelector(`[data-part="${name}"]`);
                expect(one, `the default leaf reader cover ${id} holds the part ${name}.`).not.toBeNull();
                expect(
                    part.outerHTML,
                    `the part ${name} of the hlogo leaf reader cover ${id} keeps the HTML of the default render.`,
                ).toBe(one!.outerHTML);
            }
        }
    });

    it('B12: the 4 book kinds keep their bytes in both styles', () => {
        const kinds = ['student-front', 'teacher-front', 'student-back', 'teacher-back'] as const;
        for (const kind of kinds) {
            expect(bookHash(kind), `the SHA-256 of the default render of the ${kind}.`).toBe(
                BOOK_PINS[`${kind}:default`],
            );
            expect(bookHash(kind, 'hlogo'), `the SHA-256 of the hlogo render of the ${kind}.`).toBe(
                BOOK_PINS[`${kind}:hlogo`],
            );
        }
    });
});
