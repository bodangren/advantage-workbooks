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
 *   B3: D3 on 14 rows: the title text box is centred across the plaque band, 1 line box, and the
 *       clearance from each crystal group box. The change of 2026-11-11 (standing rules): the cap
 *       height rule of S3 and the centring rule of S4 replace the 2 fill share checks and the
 *       vertical centre check of the line box.
 *   B4: D3 on 14 rows: the plaque width rule, the page centring, and the plaque bottom.
 *   B5: D3 on 1 synthetic row: a title of 40 characters wraps to 2 line boxes at the same font size
 *       as the 1-line titles, the plaque width stays at or below 340 mm, and the plaque bottom
 *       stays at 276 mm.
 *       Changed 2026-11-12 (PM rule 1, Green proof green-f3f6-b5-trace.txt at e2dc9327): on the row
 *       w01-1 the 2-line group has no free place at 100 %, so the D3 ladder gives a smaller size at
 *       the shift 0. B5 pins the ladder result, and B5 keys computes the ladder again from the key
 *       boxes and the measured plaque geometry. The measured 2-line plaque is 339.6 mm wide at 100 %
 *       (the width limit), not the 148.3 mm of the trace model, so the ladder result is 0.75.
 *       B5-full keeps the old rule on the row w03-1, where the 2-line group at 100 % is free.
 *   B6: the week pill text of 14 rows has 1 line box and is centred across the pill. The change of
 *       2026-11-11 (readers r2c): the cap height rule of E1 replaces the fill share and the
 *       vertical centre of the line box.
 *   B7: the role bar of 14 rows has even paddings, fits its text, sits at the page centre, and keeps
 *       its top and its height. The change of 2026-11-11 (readers r2c): the cap height rule of E3
 *       replaces the fill share of the label line box.
 *   B8: D5: the box `reader-leaf:logo-tile`, the logo tile of the 14 hlogo leaf renders, and no
 *       logo tile in the 14 default leaf renders.
 *   B9: D5: the K logo file holds only grays, the same viewBox, and the same `path` count as the
 *       color logo.
 *   B10: the series box values, 1 line box, and the right edge of the default style. The change of
 *       2026-11-11 (readers r2c): the hlogo leaf holds the series part in the footer, so the right
 *       edge check runs for the default style only.
 *   B11: with `hlogo`, the leaf parts that the hlogo leaf keeps equal the default leaf render parts.
 *       The change of 2026-11-11 (readers r2c): the skip list holds the logo tile, the title plaque,
 *       the footer, the series, the week, and the role mark.
 *   B12: D8: the default pins of the 4 book kinds, and the `hlogo` pin of every kind that the
 *       standing rules do not change. The change of 2026-11-11 (standing rules): the `hlogo` pin of
 *       the student front, the teacher front, and the student back is removed, because S3, S4, or S5
 *       fails on those kinds and the Green changes their `hlogo` render.
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

/** The exception rows of D4: the row w01-2 has no centred free place at the 50 % plaque size. */
const EXCEPTION_ROW_IDS = ['w01-2'];

/** The pinned shift of the A3 group of each row, in millimetres. */
const A3_GROUP_DY_MM: Record<string, number> = {
    'w01-2': -2,
    'w07-1': -178,
    'w07-2': -211,
};

/** The scale of the plaque on the exception rows: half of the full size. */
const EXCEPTION_SCALE = 0.5;

/** The tolerance of the scale of the plaque, in units of 1. */
const SCALE_TOLERANCE = 0.01;

/** The tolerance of the shift of the group, in millimetres. */
const GROUP_DY_TOLERANCE_MM = 0.5;

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

/** The leaf parts that the hlogo leaf changes, and that B11 skips. */
const SKIPPED_LEAF_PARTS = ['logo-tile', 'title-plaque', 'footer', 'series', 'week', 'role-mark', 'footer-strip'];

/** The title of the synthetic row of B5: 40 characters. */
const LONG_TITLE = "Antidisestablishmentarian's Unbelievable";

// changed 2026-11-12 (PM rule 1, Green proof green-f3f6-b5-trace.txt at e2dc9327): the D3 ladder result of the synthetic row on w01-1, from the measured plaque geometry.
/** The plaque size share that the D3 ladder gives the synthetic title on the row w01-1, at the shift 0. */
const SYNTHETIC_SCALE = 0.75;

/** The step of the D3 size ladder, in units of 1. */
const LADDER_STEP = 0.05;

/** The least plaque size share of the D3 ladder. */
const LADDER_MIN_SCALE = 0.5;

/** The least distance of a moved group from the trim, in millimetres. */
const TRIM_MARGIN_MM = 5;

/** The tolerance of the font size of the synthetic title, in pixels. */
const FONT_TOLERANCE_PX = 0.05;

/** The least distance between a chrome box and a key box, in millimetres (D2 of the F3 to F6 contract). */
const CLEARANCE_MM = 1;

/** The A3 reader trim, in millimetres. */
const A3_WIDTH_MM = 420;

/** The A3 reader trim height, in millimetres. */
const A3_HEIGHT_MM = 297;

/** The key box file of the Level 2 pictures. */
const KEYS_FILE = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures-heads.json');

/** The row of B5-full: the 2-line group at 100 % lies at least 1 mm clear of every key box of its picture. */
const FULL_ROW_ID = 'w03-1';

/** The row index of FULL_ROW_ID in `questReaders()`. */
const FULL_ROW_INDEX = 4;

/** The repo root. */
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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
    'teacher-front:default': 'b526e81e4f6aa9e9c94d8354f334e4d044b9ca22f8e7f5b344b28fe515895daf',
    'student-back:default': '8bdd615af444553c3aecca920c809beb5d52bc7ec7cc819763b837b76d4df2b0',
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

/** One key box of the key box file. */
interface KeyFileBox {
    /** The name of the key object. */
    label: string;
    /** The box in pixels of the art file: x0, y0, x1, y1. */
    box: [number, number, number, number];
    /** The kind: head, dog-body, or title-object. */
    kind: string;
}

/** One entry of the key box file. */
interface KeyFileEntry {
    /** The width of the art file in pixels. */
    widthPx: number;
    /** The height of the art file in pixels. */
    heightPx: number;
    /** The key boxes. */
    boxes: KeyFileBox[];
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

/** The measurement of the synthetic row of B5-full: the row w03-1 with the 40-character title. */
let syntheticFullMeasure: A3Measure | null = null;

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
 * Maps the key boxes of one A3 reader picture to page millimetres. The art fills the trim with
 * `object-fit: cover` at the position 50% 50%, so the scale is the larger of the two axis ratios.
 * @param fileName The name of the art file.
 * @returns The key boxes in millimetres.
 */
function a3KeyBoxesMm(fileName: string): { label: string; box: RawBox }[] {
    const keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8')) as Record<string, KeyFileEntry>;
    const entry = keys[fileName];
    expect(entry, `the key box file holds the picture ${fileName}.`).toBeDefined();
    const scale = Math.max(A3_WIDTH_MM / entry.widthPx, A3_HEIGHT_MM / entry.heightPx);
    const offsetX = (A3_WIDTH_MM - entry.widthPx * scale) / 2;
    const offsetY = (A3_HEIGHT_MM - entry.heightPx * scale) / 2;
    return entry.boxes.map((key) => ({
        label: key.label,
        box: {
            left: offsetX + key.box[0] * scale,
            top: offsetY + key.box[1] * scale,
            right: offsetX + key.box[2] * scale,
            bottom: offsetY + key.box[3] * scale,
        },
    }));
}

/**
 * Lists the key boxes that one chrome box meets. A key box grown by the clearance that has a
 * positive overlap area with the chrome box counts as met.
 * @param box The chrome box in millimetres.
 * @param keys The key boxes in millimetres.
 * @returns The labels of the key boxes that the chrome box meets, with the overlap sizes.
 */
function keysMetBy(box: RawBox, keys: { label: string; box: RawBox }[]): string[] {
    const met: string[] = [];
    for (const key of keys) {
        const width =
            Math.min(box.right, key.box.right + CLEARANCE_MM) - Math.max(box.left, key.box.left - CLEARANCE_MM);
        const height =
            Math.min(box.bottom, key.box.bottom + CLEARANCE_MM) - Math.max(box.top, key.box.top - CLEARANCE_MM);
        if (width > 0 && height > 0) met.push(`${key.label} (${width.toFixed(2)} x ${height.toFixed(2)} mm)`);
    }
    return met;
}

/**
 * Scales one box about a fixed point.
 * @param box The box in millimetres.
 * @param factor The scale factor.
 * @param anchorX The x of the fixed point.
 * @param anchorY The y of the fixed point.
 * @returns The scaled box.
 */
function scaleAbout(box: RawBox, factor: number, anchorX: number, anchorY: number): RawBox {
    return {
        left: anchorX + (box.left - anchorX) * factor,
        top: anchorY + (box.top - anchorY) * factor,
        right: anchorX + (box.right - anchorX) * factor,
        bottom: anchorY + (box.bottom - anchorY) * factor,
    };
}

/**
 * Runs the D3 size ladder on the default group of one row: the default place, then the places up
 * in 1 mm steps, at each size from 100 % down to 50 % in steps of 5 %. The first size with a free
 * place wins. A place is free when the plaque and the role bar lie at least the clearance from every
 * key box and the plaque stays inside the trim margin. The sideways slide of the exception covers
 * is not part of this function.
 * @param plaque The plaque box at 100 % in its default place, in millimetres.
 * @param bar The role bar box in its default place, in millimetres.
 * @param keys The key boxes in millimetres.
 * @returns The size share and the shift up in millimetres, or null when no place is free.
 */
function ladderResult(
    plaque: RawBox,
    bar: RawBox,
    keys: { label: string; box: RawBox }[],
): { scale: number; step: number } | null {
    const anchorX = (plaque.left + plaque.right) / 2;
    const stepCount = Math.round((1 - LADDER_MIN_SCALE) / LADDER_STEP);
    for (let index = 0; index <= stepCount; index++) {
        const scale = 1 - index * LADDER_STEP;
        const scaled = scaleAbout(plaque, scale, anchorX, plaque.bottom);
        for (let step = 0; step < 400; step++) {
            if (scaled.top - step < TRIM_MARGIN_MM) break;
            const movedPlaque = { ...scaled, top: scaled.top - step, bottom: scaled.bottom - step };
            const movedBar = { ...bar, top: bar.top - step, bottom: bar.bottom - step };
            if (keysMetBy(movedPlaque, keys).length === 0 && keysMetBy(movedBar, keys).length === 0) {
                return { scale, step };
            }
        }
    }
    return null;
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
        const syntheticFull: QuestReaderRow = { ...rows[FULL_ROW_INDEX], title: LONG_TITLE };
        syntheticFullMeasure = await measureA3(page, 'synthetic-full', a3Html(syntheticFull, HLOGO_OPTIONS));
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

    // B3 changed 2026-11-11 (standing rules): the cap height rule of S3 and the centring rule of S4 replace the fill share checks and the vertical centre check of the line box.
    it('B3: the hlogo title text box is centred across the plaque band and is clear of the ornaments', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.title.rects.length, `the title text of the row ${id} has 1 line box.`).toBe(1);
            expect(measure.band, `the plaque of the row ${id} holds a band.`).not.toBeNull();
            const band = measure.band!;
            const title = measure.title.rects[0];
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

    // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-gateA.txt at e95fa275): B4 and the group transform of D3, the shift and the scale of the group set the plaque width, the fixed sizes, and the fixed places.
    it('B4: the hlogo plaque width follows the title and the plaque sits on the page', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        const reference = a3Measures[0];
        expect(reference, 'the browser measures the first A3 row.').toBeDefined();
        expect(reference.plaque, 'the first A3 row holds a title plaque.').not.toBeNull();
        const fullHeight = reference.plaque!.bottom - reference.plaque!.top;
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.title.rects.length, `the title text of the row ${id} has 1 line box.`).toBe(1);
            expect(measure.plaque, `the hlogo A3 reader cover ${id} holds a title plaque.`).not.toBeNull();
            const plaque = measure.plaque!;
            const title = measure.title.rects[0];
            const titleWidth = title.right - title.left;
            const dy = plaque.bottom - PLAQUE_BOTTOM_MM;
            const s = measure.title.fontPx / reference.title.fontPx;
            const pinnedDy = A3_GROUP_DY_MM[id] ?? 0;
            const pinnedScale = EXCEPTION_ROW_IDS.includes(id) ? EXCEPTION_SCALE : 1;
            expect(
                Math.abs(dy - pinnedDy),
                `the group shift of the row ${id} is ${pinnedDy.toFixed(2)} mm: the shift is ${dy.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(GROUP_DY_TOLERANCE_MM);
            expect(
                Math.abs(s - pinnedScale),
                `the plaque scale of the row ${id} is ${pinnedScale.toFixed(2)}: the scale is ${s.toFixed(4)}.`,
            ).toBeLessThanOrEqual(SCALE_TOLERANCE);
            expect(
                Math.abs(plaque.bottom - (PLAQUE_BOTTOM_MM + pinnedDy)),
                `the plaque bottom of the row ${id} is ${(PLAQUE_BOTTOM_MM + pinnedDy).toFixed(2)} mm: ` +
                    `the bottom is ${plaque.bottom.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(GROUP_DY_TOLERANCE_MM);
            expect(
                Math.abs(plaque.top - (PLAQUE_BOTTOM_MM + pinnedDy - fullHeight * s)),
                `the plaque top of the row ${id} is ${(PLAQUE_BOTTOM_MM + pinnedDy - fullHeight * s).toFixed(2)} mm: ` +
                    `the top is ${plaque.top.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(GROUP_DY_TOLERANCE_MM);
            const wanted = Math.min(
                MAX_PLAQUE_WIDTH_MM * s,
                Math.max(MIN_PLAQUE_WIDTH_MM * s, titleWidth + 2 * PLAQUE_PADDING_MM * s),
            );
            expect(
                Math.abs((plaque.right - plaque.left) - wanted),
                `the plaque width of the row ${id} follows the title: the title is ${titleWidth.toFixed(2)} mm, ` +
                    `the plaque is ${(plaque.right - plaque.left).toFixed(2)} mm, the rule gives ${wanted.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(WIDTH_TOLERANCE_MM);
            expect(
                plaque.right - plaque.left,
                `the plaque width of the row ${id} stays between ${(MIN_PLAQUE_WIDTH_MM * s).toFixed(2)} mm and ` +
                    `${(MAX_PLAQUE_WIDTH_MM * s).toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(MIN_PLAQUE_WIDTH_MM * s);
            expect(
                plaque.right - plaque.left,
                `the plaque width of the row ${id} stays between ${(MIN_PLAQUE_WIDTH_MM * s).toFixed(2)} mm and ` +
                    `${(MAX_PLAQUE_WIDTH_MM * s).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(MAX_PLAQUE_WIDTH_MM * s);
            expect(measure.page, `the A3 reader cover ${id} holds a page.`).not.toBeNull();
            const page = measure.page!;
            expect(measure.bar.box, `the hlogo A3 reader cover ${id} holds a role bar.`).not.toBeNull();
            const bar = measure.bar.box!;
            if (EXCEPTION_ROW_IDS.includes(id)) {
                expect(
                    Math.abs((plaque.left + plaque.right) / 2 - (bar.left + bar.right) / 2),
                    `the plaque of the row ${id} is centered on the role bar.`,
                ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            } else {
                expect(
                    Math.abs((plaque.left + plaque.right) / 2 - (page.left + page.right) / 2),
                    `the plaque of the row ${id} is centered on the page.`,
                ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            }
        }
    });

    // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-b5-trace.txt at e2dc9327): B5 on w01-1, the 2-line group has no free place at 100 % (child 2 head at the default place, child 3 head above), so the D3 ladder gives a smaller size at the shift 0.
    it('B5: a title of 40 characters wraps to 2 lines and the D3 ladder gives the size 0.75 on w01-1', () => {
        expect(syntheticMeasure, 'the browser measures the synthetic row.').not.toBeNull();
        const measure = syntheticMeasure!;
        expect(LONG_TITLE.length, 'the synthetic title has 40 characters.').toBe(40);
        expect(measure.title.rects.length, 'the synthetic title has 2 line boxes.').toBe(2);
        const first = a3Measures[0];
        expect(first, 'the browser measures the first A3 row.').toBeDefined();
        // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-b5-trace.txt at e2dc9327): the font size is the 1-line font size times the ladder size.
        expect(
            Math.abs(measure.title.fontPx - first.title.fontPx * SYNTHETIC_SCALE),
            `the synthetic title has the 1-line font size times ${SYNTHETIC_SCALE.toFixed(2)}: ` +
                `${measure.title.fontPx.toFixed(2)} px, the 1-line font size is ${first.title.fontPx.toFixed(2)} px.`,
        ).toBeLessThanOrEqual(FONT_TOLERANCE_PX);
        expect(measure.plaque, 'the synthetic cover holds a title plaque.').not.toBeNull();
        const plaque = measure.plaque!;
        // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-b5-trace.txt at e2dc9327): the width limit scales with the ladder size.
        expect(
            plaque.right - plaque.left,
            `the plaque width of the synthetic row stays at or below ${(MAX_PLAQUE_WIDTH_MM * SYNTHETIC_SCALE).toFixed(2)} mm.`,
        ).toBeLessThanOrEqual(MAX_PLAQUE_WIDTH_MM * SYNTHETIC_SCALE);
        // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-b5-trace.txt at e2dc9327): the ladder keeps the plaque bottom at the default (the shift is 0).
        expect(
            Math.abs(plaque.bottom - PLAQUE_BOTTOM_MM),
            `the plaque bottom of the synthetic row is ${PLAQUE_BOTTOM_MM} mm: the bottom is ${plaque.bottom.toFixed(2)} mm.`,
        ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
    });

    // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-b5-trace.txt at e2dc9327): the independent check of the ladder result from the key boxes and the measured plaque geometry.
    it('B5 keys: the ladder result on w01-1 is 0.75 at the shift 0, the measured group is 1 mm clear, and the next step is not', () => {
        expect(syntheticMeasure, 'the browser measures the synthetic row.').not.toBeNull();
        const measure = syntheticMeasure!;
        const first = a3Measures[0];
        const keys = a3KeyBoxesMm(readerRows()[0].picture.fileName);
        expect(keys.length, 'the picture of the row w01-1 holds key boxes.').toBeGreaterThan(0);
        expect(measure.plaque, 'the synthetic cover holds a title plaque.').not.toBeNull();
        expect(measure.bar.box, 'the synthetic cover holds a role bar.').not.toBeNull();
        const plaque = measure.plaque!;
        const bar = measure.bar.box!;
        const measuredScale = measure.title.fontPx / first.title.fontPx;
        // The plaque at 100 % in its default place: scale the measured plaque about its bottom centre, then move it to the default bottom.
        const anchorX = (plaque.left + plaque.right) / 2;
        const scaledUp = scaleAbout(plaque, 1 / measuredScale, anchorX, plaque.bottom);
        const shiftToDefault = PLAQUE_BOTTOM_MM - plaque.bottom;
        const fullPlaque: RawBox = {
            left: scaledUp.left,
            top: scaledUp.top + shiftToDefault,
            right: scaledUp.right,
            bottom: scaledUp.bottom + shiftToDefault,
        };
        const defaultBar: RawBox = {
            left: bar.left,
            top: ROLE_BAR_TOP_MM,
            right: bar.right,
            bottom: ROLE_BAR_TOP_MM + ROLE_BAR_HEIGHT_MM,
        };
        const result = ladderResult(fullPlaque, defaultBar, keys);
        expect(
            result,
            `the ladder on the 2-line plaque at 100 % (${fullPlaque.left.toFixed(2)} to ${fullPlaque.right.toFixed(2)} mm by ` +
                `${fullPlaque.top.toFixed(2)} to ${fullPlaque.bottom.toFixed(2)} mm) gives the size ${SYNTHETIC_SCALE.toFixed(2)} at the shift 0.`,
        ).toEqual({ scale: SYNTHETIC_SCALE, step: 0 });
        // (a) the measured group lies at least 1 mm clear of every key box.
        expect(
            keysMetBy(plaque, keys),
            `(a) the plaque of the synthetic row (${plaque.left.toFixed(2)} to ${plaque.right.toFixed(2)} mm by ` +
                `${plaque.top.toFixed(2)} to ${plaque.bottom.toFixed(2)} mm) lies ${CLEARANCE_MM} mm clear of every key box.`,
        ).toEqual([]);
        expect(
            keysMetBy(bar, keys),
            `(a) the role bar of the synthetic row (${bar.left.toFixed(2)} to ${bar.right.toFixed(2)} mm by ` +
                `${bar.top.toFixed(2)} to ${bar.bottom.toFixed(2)} mm) lies ${CLEARANCE_MM} mm clear of every key box.`,
        ).toEqual([]);
        // (b) the group one 5 % step larger, anchored at the plaque bottom centre, meets a key box with the 1 mm clearance.
        const next = scaleAbout(plaque, (measuredScale + LADDER_STEP) / measuredScale, anchorX, plaque.bottom);
        const nextMet = [...keysMetBy(next, keys), ...keysMetBy(bar, keys)];
        expect(
            nextMet.length,
            `(b) the group at ${(measuredScale + LADDER_STEP).toFixed(2)} (plaque ${next.left.toFixed(2)} to ${next.right.toFixed(2)} mm by ` +
                `${next.top.toFixed(2)} to ${next.bottom.toFixed(2)} mm) meets a key box with the ${CLEARANCE_MM} mm clearance.`,
        ).toBeGreaterThan(0);
    });

    // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-b5-trace.txt at e2dc9327): B5-full keeps the old B5 rule on a row where the 2-line group at 100 % is free.
    it('B5-full: on w03-1 the 40-character title keeps the 1-line font size and the plaque bottom', () => {
        expect(ROW_IDS[FULL_ROW_INDEX], 'the index of the B5-full row.').toBe(FULL_ROW_ID);
        expect(syntheticFullMeasure, 'the browser measures the synthetic row of w03-1.').not.toBeNull();
        const measure = syntheticFullMeasure!;
        const keys = a3KeyBoxesMm(readerRows()[FULL_ROW_INDEX].picture.fileName);
        const oneLine = a3Measures[FULL_ROW_INDEX];
        expect(measure.title.rects.length, 'the synthetic title on w03-1 has 2 line boxes.').toBe(2);
        expect(
            Math.abs(measure.title.fontPx - oneLine.title.fontPx),
            `the synthetic title on w03-1 keeps the font size of the 1-line titles: ` +
                `${measure.title.fontPx.toFixed(2)} px and ${oneLine.title.fontPx.toFixed(2)} px.`,
        ).toBeLessThanOrEqual(FONT_TOLERANCE_PX);
        expect(measure.plaque, 'the synthetic cover of w03-1 holds a title plaque.').not.toBeNull();
        expect(measure.bar.box, 'the synthetic cover of w03-1 holds a role bar.').not.toBeNull();
        const plaque = measure.plaque!;
        const bar = measure.bar.box!;
        expect(
            Math.abs(plaque.bottom - PLAQUE_BOTTOM_MM),
            `the plaque bottom of the synthetic row on w03-1 is ${PLAQUE_BOTTOM_MM} mm: the bottom is ${plaque.bottom.toFixed(2)} mm.`,
        ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
        expect(
            plaque.right - plaque.left,
            `the plaque width of the synthetic row on w03-1 stays at or below ${MAX_PLAQUE_WIDTH_MM} mm.`,
        ).toBeLessThanOrEqual(MAX_PLAQUE_WIDTH_MM);
        // The row is free at 100 %: the measured 2-line group lies 1 mm clear of every key box of the picture, so the ladder keeps the full size.
        expect(
            keysMetBy(plaque, keys),
            `the 2-line plaque at 100 % on the row ${FULL_ROW_ID} lies ${CLEARANCE_MM} mm clear of every key box.`,
        ).toEqual([]);
        expect(
            keysMetBy(bar, keys),
            `the role bar of the 2-line cover on the row ${FULL_ROW_ID} lies ${CLEARANCE_MM} mm clear of every key box.`,
        ).toEqual([]);
        const fullBar: RawBox = {
            left: bar.left,
            top: ROLE_BAR_TOP_MM,
            right: bar.right,
            bottom: ROLE_BAR_TOP_MM + ROLE_BAR_HEIGHT_MM,
        };
        expect(
            ladderResult(plaque, fullBar, keys),
            `the ladder on the row ${FULL_ROW_ID} keeps the full size at the shift 0.`,
        ).toEqual({ scale: 1, step: 0 });
    });

    // B6 changed 2026-11-11 (readers r2c): the cap height rule of E1 replaces the fill share and the vertical centre of the line box.
    it('B6: the hlogo week pill text has 1 line box and is centred across the pill', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.pill.box, `the hlogo A3 reader cover ${id} holds a week pill.`).not.toBeNull();
            expect(measure.pill.text.rects.length, `the week pill text of the row ${id} has 1 line box.`).toBe(1);
            const pill = measure.pill.box!;
            const text = measure.pill.text.rects[0];
            expect(
                Math.abs((text.left + text.right) / 2 - (pill.left + pill.right) / 2),
                `the week pill text of the row ${id} is centred across the pill.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
        }
    });

    // B7 changed 2026-11-11 (readers r2c): the cap height rule of E3 replaces the fill share of the label line box.
    // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-gateA.txt at e95fa275): B7, the role bar keeps the gap of the group and its centre rule, and the gap does not scale.
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
            expect(measure.plaque, `the hlogo A3 reader cover ${id} holds a title plaque.`).not.toBeNull();
            const plaque = measure.plaque!;
            const dy = plaque.bottom - PLAQUE_BOTTOM_MM;
            if (EXCEPTION_ROW_IDS.includes(id)) {
                expect(
                    Math.abs((bar.left + bar.right) / 2 - (plaque.left + plaque.right) / 2),
                    `the role bar of the row ${id} is centered on the plaque.`,
                ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            } else {
                expect(
                    Math.abs((bar.left + bar.right) / 2 - (page.left + page.right) / 2),
                    `the role bar of the row ${id} is centered on the page.`,
                ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            }
            expect(
                Math.abs(bar.top - (ROLE_BAR_TOP_MM + dy)),
                `the role bar top of the row ${id} is ${(ROLE_BAR_TOP_MM + dy).toFixed(2)} mm: ` +
                    `the top is ${bar.top.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs((bar.top - plaque.bottom) - (ROLE_BAR_TOP_MM - PLAQUE_BOTTOM_MM)),
                `the gap of the role bar of the row ${id} is ${(ROLE_BAR_TOP_MM - PLAQUE_BOTTOM_MM).toFixed(2)} mm: ` +
                    `the gap is ${(bar.top - plaque.bottom).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(bar.bottom - bar.top - ROLE_BAR_HEIGHT_MM),
                `the role bar height of the row ${id} is ${ROLE_BAR_HEIGHT_MM} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
        }
    });

    // B8 changed 2026-11-11 (F1 F2, Daniel's look): the leaf cover holds no logo tile, the gray logo moves to page 12.
    it('B8: the box table keeps the leaf logo tile, and no leaf cover holds a logo tile', () => {
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
            expect(
                alt.querySelectorAll('[data-part="logo-tile"]').length,
                `the hlogo leaf reader cover ${id} holds no logo tile.`,
            ).toBe(0);
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

    // B10 changed 2026-11-11 (readers r2c): the hlogo leaf holds the series part in the footer, so the right edge check runs for the default style only.
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
            if (measure.style !== 'default') continue;
            const text = measure.seriesRects[0];
            expect(
                text.right,
                `the series text of the leaf reader cover ${id} ends at or before ${SERIES_RIGHT_MM} mm: ` +
                    `the right edge is ${text.right.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(SERIES_RIGHT_MM);
        }
    });

    // B11 changed 2026-11-11 (F1 F2, Daniel's look): the hlogo leaf cover holds no logo tile.
    // changed 2026-11-12 (PM rule 1, Green proof green-f3f6-gateA.txt at e95fa275): B11, the hlogo leaf holds one footer strip and the banner leaf holds none, so the strip joins the skip list.
    it('B11: the hlogo leaf parts keep the HTML of the default leaf render', () => {
        const rows = readerRows();
        for (const [index, row] of rows.entries()) {
            const id = ROW_IDS[index];
            const plain = parseHtml(leafHtml(row, DEFAULT_OPTIONS));
            const alt = parseHtml(leafHtml(row, HLOGO_OPTIONS));
            const tiles = alt.querySelectorAll('[data-part="logo-tile"]');
            expect(tiles.length, `the hlogo leaf reader cover ${id} holds no logo tile.`).toBe(0);
            const strips = alt.querySelectorAll('[data-part="footer-strip"]');
            expect(strips.length, `the hlogo leaf reader cover ${id} holds exactly 1 footer strip.`).toBe(1);
            const plainStrips = plain.querySelectorAll('[data-part="footer-strip"]');
            expect(plainStrips.length, `the default leaf reader cover ${id} holds no footer strip.`).toBe(0);
            for (const part of Array.from(alt.querySelectorAll('[data-part]'))) {
                const name = part.getAttribute('data-part') ?? '';
                if (SKIPPED_LEAF_PARTS.includes(name)) continue;
                const one = plain.querySelector(`[data-part="${name}"]`);
                expect(one, `the default leaf reader cover ${id} holds the part ${name}.`).not.toBeNull();
                expect(
                    part.outerHTML,
                    `the part ${name} of the hlogo leaf reader cover ${id} keeps the HTML of the default render.`,
                ).toBe(one!.outerHTML);
            }
        }
    });

    // B12 changed 2026-11-11 (standing rules): the hlogo pin of every book kind that fails S3, S4, or S5 is removed, because the Green changes the hlogo render of that kind. The default pin of every kind stays.
    it('B12: the 4 book kinds keep their bytes in the default style', () => {
        const kinds = ['student-front', 'teacher-front', 'student-back', 'teacher-back'] as const;
        for (const kind of kinds) {
            expect(bookHash(kind), `the SHA-256 of the default render of the ${kind}.`).toBe(
                BOOK_PINS[`${kind}:default`],
            );
            const pin = BOOK_PINS[`${kind}:hlogo`];
            if (!pin) continue;
            expect(bookHash(kind, 'hlogo'), `the SHA-256 of the hlogo render of the ${kind}.`).toBe(pin);
        }
    });
});
