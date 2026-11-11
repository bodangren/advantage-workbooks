// @vitest-environment jsdom
/**
 * Red of the reader chrome of the PM look of 2026-11-11 (track storytime_cover_options_20261106,
 * Phase 2, the Task (Red, readers r2c) pair).
 *
 * The finding (the PM look with the cover checklist, 2026-11-11): the A3 readers pass the logo tile,
 * the plaque style, the plaque colours, the title fill, and the plaque centring. The A3 week pill
 * and the A3 role bar letters use about 35 % of their inner height. The leaf fails 3 checklist
 * points: (1) the title plaque is the old crystal banner shape and its title uses about 35 % of the
 * band, (2) the bottom row shows the band word and the 5 band icons, and (3) the leaf week and role
 * text stay as footer text.
 *
 * The owner order (the PM look and order of 2026-11-11, word for word): "PM → Workbooks: received.
 * MANIFEST 6cf6c806… (PM check: 85 of 85 OK by the 3-column read), e34e231c, checks 15/0. PM look
 * with the cover checklist (sheets + one A3 and one leaf page at full size):
 *
 * A3 (14): PASS on logo tile, plaque style (r2 book plaque, amber, brown, ornaments), title fill
 * and centering, colors of the pill and the bar. Your note: YES, fix it. Daniel's rule is about the
 * letters he sees ("text should also fill the Chrome instead of maybe 50%"), so the week pill and
 * role bar letters (cap height) go to about 80 % of the bar height (±5 %), centered, even padding.
 *
 * LEAF (14): FAIL on 3 points that my first look missed (my fault):
 * (1) The title plaque on the leaf is still the old crystal banner shape (diamond tips outside the
 * ends) with the title at about 35 % of the band. Use the r2 book plaque shape (ornaments inside its
 * ends) drawn in K, and the A3 title rule (80 % +/- 5 % of the band, centered within 1 mm).
 * (2) The bottom row shows the band word "SPROUT" and 5 band icons: game UI (Daniel: no XP bar, no
 * band icons). Remove both. Keep "Storytime Advantage · Week N · <role line>" as the footer,
 * centered.
 * (3) The leaf week and role text stays as footer text (no bar), at its present size.
 * Leaf logo tile (gray, top center): PASS.
 *
 * ORDER: one more small Red + Green pair for A3 (pill and bar letters) and leaf (1)(2)(3); Red pins:
 * pill/bar cap height 80 % +/- 5 % of the bar; leaf plaque = the r2 book plaque path in K tints;
 * leaf title box 80 % +/- 5 % of the band; 0 "SPROUT" and 0 band icon on the 14 leaf pages; footer
 * centered within 1 mm. Then one rebuild, the planned replacement with old SHA-256 checked against
 * 6cf6c806, and the sheets to me. Book lines stay byte-equal."
 *
 * The design (the orchestrator pins of 2026-11-11, made exact here). Every rule applies with the top
 * style `hlogo` only. The default style renders do not change.
 *   E1: The cap height of the A3 week pill text is 80 % ± 5 % of the pill inner height (the box
 *       height minus 1.2 mm). The middle of the cap band lies at the pill centre within 0.5 mm. The
 *       text is centred across within 0.5 mm. The text has 1 line box.
 *   E2: The A3 week pill fits its text: the left padding and the right padding differ by at most
 *       0.5 mm, and each is the 5 mm corner radius (5 mm to 5.5 mm). The pill centre across stays
 *       at 340 mm within 0.5 mm. Its top stays 35 mm and its height 10 mm. Its colours stay (B2).
 *   E3: The cap height of the A3 role label is 80 % ± 5 % of the bar inner height (12 mm minus
 *       1.2 mm). The middle of the cap band lies at the bar centre within 0.5 mm. The role mark
 *       icon box lies inside the bar inner box. The even paddings, the 60 % content share, the page
 *       centring, the top 278 mm, and the height 12 mm stay (B7).
 *   E4: The hlogo leaf `title-plaque` part keeps its top 113 mm and its height 20 mm. Its width is
 *       the title text width plus 2 x 21 mm, at least 110 mm and at most 182 mm. It is centred on the
 *       198 mm page within 0.5 mm. Its SVG is the r2 book plaque drawing: the same path count and
 *       the same command letter sequence as the hlogo A3 title plaque of the same row. It holds
 *       exactly 2 crystal groups. Every path box and every group box lies inside the plaque part box
 *       within 0.1 mm.
 *   E5: The leaf plaque takes the K palette: the outer fill and stroke `#4E4E4E`, the ring fill
 *       `#F2F2F2`, the band fill `#D2D2D2`, the highlight stroke `#FFFFFF` with `fill="none"`, the
 *       ornament fills `#F2F2F2` and `#FFFFFF`, the ornament stroke `#4E4E4E`, and the diamond fills
 *       `#d2d2d2` and `#FFFFFF`. The `data-plaque-colour` value is `#D2D2D2`. Every fill and stroke
 *       value is one of these values or `none`.
 *   E6: The leaf title text box fills 80 % ± 5 % of the band height (20 − 5.6 = 14.4 mm). Its
 *       centre lies at the band centre within 1 mm on both axes. The text has 1 line box. It lies
 *       at least 2 mm clear of each crystal group box. The text colour is `rgb(0, 0, 0)` with no
 *       text stroke, in League Spartan 700.
 *   E7: The hlogo leaf holds 0 `band-word` parts, 0 `band-icon` parts, 0 matches of `/sprout/i` in
 *       its body text, and 0 `<svg>` elements outside the parts `double-line-frame`,
 *       `title-plaque`, and `role-mark`.
 *   E8: The hlogo leaf holds exactly one `footer` part. It holds exactly one `series`, one `week`,
 *       and one `role-mark` part. Its text is `Storytime Advantage · Week N · <role line>`. The
 *       footer and its 3 parts hold no background colour and no border.
 *   E9: The series text, the week text, and the role label text have the computed font size 12 px.
 *       All text line boxes of the footer lie on one line. The footer content box is centred on the
 *       198 mm page within 1 mm (centre 99 mm). Its vertical centre is 140 mm within 1 mm. It lies
 *       inside 5 mm to 193 mm across.
 *   E10: The build script exports `questBandCheck(html, kind, band)`. A `reader-leaf` page with a
 *       `logo-tile` part passes when it holds no `band-word` part and no band word in upper case. A
 *       `reader-leaf` page with no `logo-tile` part needs the `band-word` part and the band word.
 *   E11: The full default leaf render of each of the 14 rows keeps its SHA-256 of the role base
 *       `0b3000fa`. The default A3 pins (R4), the 8 book pins (B12), and P6 stay.
 *
 * The contract of this file:
 *   C1: E1 on 14 rows: the week pill cap height share, the cap band centre, and the centre across.
 *   C2: E2 on 14 rows: the pill paddings, the pill centre, the pill top, the pill height, and the
 *       pill colours.
 *   C3: E3 on 14 rows: the role label cap height share, the cap band centre, the icon box, the
 *       even paddings, the content share, the page centring, the top, and the height.
 *   C4: E4 on 14 rows: the plaque top and height, the plaque width rule, the page centring, the path
 *       count, the path letters, the crystal groups, and the path and group boxes inside the plaque
 *       part box.
 *   C5: E5 on 14 rows: the plaque palette values and the `data-plaque-colour` value.
 *   C6: E6 on 14 rows: the leaf title fill share, the band centres, the line box count, the
 *       ornament clearance, and the text colour and face.
 *   C7: E7 on 14 rows: no band word part, no band icon part, no band word text, and no loose SVG.
 *   C8: E8 on 14 rows: the footer part, its 3 parts, its text, and its inline styles.
 *   C9: E9 on 14 rows: the footer font sizes, the one line, the page centre, the vertical centre,
 *       and the page edges.
 *   C10: E10: the band check passes the 14 hlogo leaf renders and the 14 default leaf renders, and
 *       fails the 2 mutants.
 *   C11: E11: the 14 default leaf renders keep their SHA-256 of the role base `0b3000fa`.
 *
 * The method notes:
 *   - The text box measure is the method of `quest-cover-plaque-fit.test.ts`: a range over the text
 *     node gives its box. The band is the path whose fill equals `data-plaque-colour`.
 *   - The cap height method: the computed font of the parent element of the text node sets on a
 *     canvas 2d context. The `actualBoundingBoxAscent` of `H` is the cap height. The
 *     `fontBoundingBoxAscent` of `H` is the ascent. The range rect top plus the ascent is the
 *     baseline. The baseline minus half the cap height is the middle of the cap band.
 *   - The leaf plaque part box is the box of the `title-plaque` div. The path boxes and the group
 *     boxes are the browser boxes of the SVG elements.
 *   - E4 changed 2026-11-11 (readers r2c retry): the leaf plaque width follows the title, title + 2
 *     x 21 mm, 110 mm to 182 mm, because a fixed 110 mm plaque cannot hold the 2 widest titles with
 *     the 80 % font and the 2 mm clearance. The title width is the range box of the title text.
 *   - The command letters of one path are the letters of its `d` attribute, with the numbers
 *     removed.
 *   - The pins of C11 are the SHA-256 values of the 14 default leaf renders at the role base
 *     `0b3000fa`. The probe that computed them prints hashes only.
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
    questReaders,
    renderQuestCover,
    type QuestReaderRow,
    type QuestRenderOptions,
} from '../lib/storytime/print/cover-quest';

/** The art string of the renders. The test reads no art file. */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The amber of the logo tile and of the plaque band. */
const AMBER = '#FCD34D';

/** The brown of the logo edge and of the plaque frame. */
const BROWN = '#92400E';

/** The outer fill and stroke of the leaf plaque. */
const K_OUTER = '#4E4E4E';

/** The ring fill of the leaf plaque. */
const K_RING = '#F2F2F2';

/** The band fill of the leaf plaque. */
const K_BAND = '#D2D2D2';

/** The white of the leaf plaque. */
const WHITE = '#FFFFFF';

/** The lower case band fill of the diamond halves of the leaf plaque. */
const K_DIAMOND = '#d2d2d2';

/** The fill and stroke values that the leaf plaque may hold. */
const K_PALETTE_VALUES = [K_OUTER, K_RING, K_BAND, WHITE, K_DIAMOND, 'none'];

/** The least fill share of a text box, 80 % minus 5 %. */
const MIN_FILL_SHARE = 0.75;

/** The most fill share of a text box, 80 % plus 5 %. */
const MAX_FILL_SHARE = 0.85;

/** The tolerance of the cap band centre, in millimetres. */
const CAP_CENTRE_TOLERANCE_MM = 0.5;

/** The tolerance of the centre of a part on the page, in millimetres. */
const PAGE_CENTRE_TOLERANCE_MM = 0.5;

/** The tolerance of the even paddings of the week pill, in millimetres. */
const PADDING_TOLERANCE_MM = 0.5;

/** The inner size of the week pill and of the role bar: the box size minus 1.2 mm. */
const INNER_SIZE_MM = 1.2;

/** The border width of the week pill and of the role bar, in millimetres. */
const BORDER_WIDTH_MM = 0.6;

/** The corner radius of the week pill, and its padding, in millimetres. */
const PILL_PADDING_MM = 5;

/** The centre of the week pill across the A3 page, in millimetres. */
const PILL_CENTRE_MM = 340;

/** The top of the week pill, in millimetres. */
const PILL_TOP_MM = 35;

/** The height of the week pill, in millimetres. */
const PILL_HEIGHT_MM = 10;

/** The top of the role bar, in millimetres. */
const ROLE_BAR_TOP_MM = 278;

/** The height of the role bar, in millimetres. */
const ROLE_BAR_HEIGHT_MM = 12;

/** The least share of the role bar width that the content fills. */
const MIN_BAR_CONTENT_SHARE = 0.6;

/** The height of the leaf plaque band: 20 mm minus the 5.6 mm inset, in millimetres. */
const BAND_HEIGHT_MM = 14.4;

/** The tolerance of the band height, in millimetres. */
const BAND_HEIGHT_TOLERANCE_MM = 0.1;

/** The tolerance of a path box or a group box inside the plaque part box, in millimetres. */
const PLAQUE_BOX_TOLERANCE_MM = 0.1;

/** The clearance of the title text box from each crystal group box, in millimetres. */
const ORNAMENT_CLEARANCE_MM = 2;

/** The tolerance of the band centre, in millimetres. */
const BAND_CENTRE_TOLERANCE_MM = 1;

/** The width of the leaf page, in millimetres. */
const LEAF_PAGE_WIDTH_MM = 198;

/** The height of the leaf page, in millimetres. */
const LEAF_PAGE_HEIGHT_MM = 148.5;

/** The centre of the footer across the leaf page, in millimetres. */
const FOOTER_CENTRE_MM = 99;

/** The vertical centre of the footer, in millimetres. */
const FOOTER_VERTICAL_CENTRE_MM = 140;

/** The left edge of the footer content, in millimetres. */
const FOOTER_LEFT_MM = 5;

/** The right edge of the footer content, in millimetres. */
const FOOTER_RIGHT_MM = 193;

/** The tolerance of the footer centre, in millimetres. */
const FOOTER_TOLERANCE_MM = 1;

/** The computed font size of the footer text, in pixels: 9 pt. */
const FOOTER_FONT_PX = 12;

/** The middle dot of the footer text, U+00B7. */
const MIDDLE_DOT = '\u00b7';

/** The padding of the leaf plaque on each side of the title, in millimetres. */
const LEAF_PLAQUE_PADDING_MM = 21;

/** The least width of the leaf plaque, in millimetres. */
const LEAF_PLAQUE_MIN_WIDTH_MM = 110;

/** The most width of the leaf plaque, in millimetres: the width of the double line frame. */
const LEAF_PLAQUE_MAX_WIDTH_MM = 182;

/** The top of the leaf plaque, in millimetres. */
const LEAF_PLAQUE_TOP_MM = 113;

/** The height of the leaf plaque, in millimetres. */
const LEAF_PLAQUE_HEIGHT_MM = 20;

/** The tolerance of the width rule of the leaf plaque, in millimetres. */
const WIDTH_TOLERANCE_MM = 0.5;

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

/** The SHA-256 values of the 14 default leaf renders at the role base `0b3000fa`. */
const LEAF_PINS: Record<string, string> = {
    'w01-1': 'e0385f97b6567f6e6eace8c28d005547a33bbb8c561e753af7dc45d0f94cd90e',
    'w01-2': '1ff960ed3a394b79ef0a710b2c29c3d06e40c94f5c06aa6944dc87de1828456a',
    'w02-1': '90a7900d5703b54f7c7840ed9cf068d89d587a029ae11a55fb36352906414b66',
    'w02-2': 'adf5fb301742daf131c9de24700827ba52a2648bfde1b495b20cff2e2d38649c',
    'w03-1': '422ceb07591469ea3168f4e0fbecb45483c11ea738f82305acbcfa9ba758fd88',
    'w03-2': 'a264e5460fe91a3599b5183eaa4d48ed82f3cbfeb4473db8880bc4f1f7ba6aba',
    'w04-1': 'f3e4e723801e6441ce9b5efb4928d9f704ab52c2abd781217bfc9a0773cea52b',
    'w04-2': 'cfcd3394dc0cbab1ecdc99a6659c5a3db0014a130d88ca62d987176c0fa1f944',
    'w05-1': 'e084c3b4b799663b02f95d9cdc637b905d48fd12aa41ec0de327b9adef51613b',
    'w05-2': 'd4132c6514500298d62e99127bcd937611393ed8bb16d431863f9c739683a1af',
    'w06-1': '3a43ddc49971f925b0944787c04d64818bcfcd672410479b44d9080237560f24',
    'w06-2': '1084a5bbea57dc66ae87d1e770bd9704e0b9e3a76f331aa49f8a2f1b3b6e4632',
    'w07-1': '47198cc13bd033cb258aab9a451bb7455180070c583b2566450ad9d69d27c37b',
    'w07-2': 'f62606373859bd28467c28f3c37bd5d9d3c47185e5568877b39f98f90391cb7a',
};

/** The dashboard folder. */
const DASHBOARD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The build script under test. */
const SCRIPT_FILE = path.join(DASHBOARD, 'scripts', 'storytime', 'make-storytime-quest-covers.ts');

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

/** The measure of one text in Chrome. */
interface TextMeasure {
    /** The line boxes of the text. */
    rects: RawBox[];
    /** The cap height of the text, in millimetres. */
    capMm: number;
    /** The ascent of the text, in millimetres. */
    ascentMm: number;
    /** The baseline of the text, in millimetres. */
    baselineMm: number;
    /** The middle of the cap band, in millimetres. */
    capMiddleMm: number;
    /** The computed font size, in pixels. */
    fontPx: number;
    /** The computed font family. */
    family: string;
    /** The computed font weight. */
    weight: string;
    /** The computed colour. */
    colour: string;
    /** The computed text stroke width. */
    stroke: string;
    /** True when the font sets on the canvas. */
    fontSet: boolean;
}

/** The measurement of the A3 reader cover of one row. */
interface A3Measure {
    /** The row id. */
    id: string;
    /** The box of the page. */
    page: RawBox | null;
    /** The week pill. */
    pill: {
        /** The box of the pill. */
        box: RawBox | null;
        /** The computed background colour. */
        background: string;
        /** The computed border colour. */
        borderColour: string;
        /** The computed text colour. */
        colour: string;
        /** The measure of the pill text. */
        text: TextMeasure;
    };
    /** The role bar. */
    bar: {
        /** The box of the bar. */
        box: RawBox | null;
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
    /** The box of the page. */
    page: RawBox | null;
    /** The box of the title plaque part. */
    plaqueBox: RawBox | null;
    /** The boxes of the paths of the plaque. */
    pathBoxes: RawBox[];
    /** The boxes of the crystal groups of the plaque. */
    groupBoxes: RawBox[];
    /** The box of the band of the plaque. */
    bandBox: RawBox | null;
    /** The measure of the title text. */
    title: TextMeasure;
    /** The measure of the footer. */
    footer: {
        /** The measure of the series text. */
        series: TextMeasure;
        /** The measure of the week text. */
        week: TextMeasure;
        /** The measure of the role label text. */
        role: TextMeasure;
        /** The boxes of the role mark icons. */
        iconBoxes: RawBox[];
    };
}

/** The structure of one leaf document. */
interface LeafDom {
    /** The number of the parts of each name. */
    partCounts: Record<string, number>;
    /** The number of the band word matches in the body text. */
    sproutMatches: number;
    /** The number of the SVG elements outside the 3 allowed parts. */
    svgOutside: number;
    /** The number of the footer parts. */
    footerCount: number;
    /** The text of the footer, with the white space runs made one space. */
    footerText: string;
    /** The inline style of the footer. */
    footerInline: string;
    /** The number of the series parts inside the footer. */
    seriesCount: number;
    /** The number of the week parts inside the footer. */
    weekCount: number;
    /** The number of the role mark parts inside the footer. */
    roleCount: number;
    /** The inline style of the series part. */
    seriesInline: string;
    /** The inline style of the week part. */
    weekInline: string;
    /** The inline style of the role mark part. */
    roleInline: string;
    /** The `data-plaque-colour` value of the title plaque. */
    plaqueColour: string;
    /** The paths of the title plaque, in document order. */
    paths: { letters: string; fill: string; stroke: string }[];
    /** The crystal groups of the title plaque, in document order. */
    crystals: { fill: string; stroke: string }[][];
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of the layout checks. */
let browser: Browser | undefined;

/** The measurements of the 14 A3 reader rows. */
const a3Measures: A3Measure[] = [];

/** The measurements of the 14 hlogo leaf reader rows. */
const leafMeasures: LeafMeasure[] = [];

/** The structures of the 14 hlogo leaf reader rows. */
const leafDoms: LeafDom[] = [];

/** The command letters of the paths of the hlogo A3 title plaques. */
const a3PlaqueLetters: string[][] = [];

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
 * Converts one computed colour to a lower case hex value.
 * @param value The computed colour.
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

/** The render options of the default style. */
const DEFAULT_OPTIONS: QuestRenderOptions = { bleedMm: 0 };

/** The render options of the r2 style: the horizontal logo on its tile. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

/**
 * Reads the command letters of one path command list.
 * @param d The `d` attribute.
 * @returns The letters.
 */
function commandLetters(d: string): string {
    return (d.match(/[A-Za-z]/g) ?? []).join('');
}

/**
 * Reads the structure of one leaf document.
 * @param html The rendered HTML.
 * @returns The structure.
 */
function leafDom(html: string): LeafDom {
    const doc = parseHtml(html);
    const plaque = doc.querySelector('[data-part="title-plaque"]');
    const paths = Array.from(plaque?.querySelectorAll('path') ?? []);
    const groups = Array.from(plaque?.querySelectorAll('g') ?? []).filter((group) =>
        (group.getAttribute('transform') ?? '').startsWith('translate('),
    );
    const footer = doc.querySelector('[data-part="footer"]');
    const series = footer?.querySelector('[data-part="series"]') ?? null;
    const week = footer?.querySelector('[data-part="week"]') ?? null;
    const role = footer?.querySelector('[data-part="role-mark"]') ?? null;
    const partCounts: Record<string, number> = {};
    for (const part of Array.from(doc.querySelectorAll('[data-part]'))) {
        const name = part.getAttribute('data-part') ?? '';
        partCounts[name] = (partCounts[name] ?? 0) + 1;
    }
    const allowed = '[data-part="double-line-frame"],[data-part="title-plaque"],[data-part="role-mark"]';
    const loose = Array.from(doc.querySelectorAll('svg')).filter((svg) => !svg.closest(allowed));
    const bodyText = doc.body.textContent ?? '';
    return {
        partCounts,
        sproutMatches: (bodyText.match(/sprout/gi) ?? []).length,
        svgOutside: loose.length,
        footerCount: partCounts.footer ?? 0,
        footerText: (footer?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        footerInline: footer?.getAttribute('style') ?? '',
        seriesCount: series ? 1 : 0,
        weekCount: week ? 1 : 0,
        roleCount: role ? 1 : 0,
        seriesInline: series?.getAttribute('style') ?? '',
        weekInline: week?.getAttribute('style') ?? '',
        roleInline: role?.getAttribute('style') ?? '',
        plaqueColour: plaque?.getAttribute('data-plaque-colour') ?? '',
        paths: paths.map((element) => ({
            letters: commandLetters(element.getAttribute('d') ?? ''),
            fill: element.getAttribute('fill') ?? '',
            stroke: element.getAttribute('stroke') ?? '',
        })),
        crystals: groups.map((group) =>
            Array.from(group.querySelectorAll('path')).map((element) => ({
                fill: element.getAttribute('fill') ?? '',
                stroke: element.getAttribute('stroke') ?? '',
            })),
        ),
    };
}

/**
 * Writes one rendered document into a file and opens it in the browser.
 * @param page The browser page.
 * @param name The name of the file.
 * @param html The rendered document.
 * @returns Nothing.
 */
async function openInBrowser(page: Page, name: string, html: string): Promise<void> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-readers-r2c-'));
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
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const textOf = (root: Element | null): TextMeasure => {
            const empty: TextMeasure = {
                rects: [],
                capMm: 0,
                ascentMm: 0,
                baselineMm: 0,
                capMiddleMm: 0,
                fontPx: 0,
                family: '',
                weight: '',
                colour: '',
                stroke: '',
                fontSet: false,
            };
            if (!root || !context) return empty;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            const rects: RawBox[] = [];
            let first = true;
            while (walker.nextNode()) {
                const node = walker.currentNode as Text;
                if (!(node.nodeValue ?? '').trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                const clientRects = Array.from(range.getClientRects());
                for (const rect of clientRects) {
                    rects.push({
                        left: rect.left * mm,
                        top: rect.top * mm,
                        right: rect.right * mm,
                        bottom: rect.bottom * mm,
                    });
                }
                if (!first) continue;
                first = false;
                const parent = node.parentElement;
                if (!parent) continue;
                const style = window.getComputedStyle(parent);
                const wanted = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                context.font = wanted;
                const fontSet = context.font.includes(style.fontSize);
                const metrics = context.measureText('H');
                const capPx = metrics.actualBoundingBoxAscent;
                const ascentPx = metrics.fontBoundingBoxAscent;
                const rect = clientRects[0];
                const baselineMm = rect ? (rect.top + ascentPx) * mm : 0;
                const capMm = capPx * mm;
                const width = (style as unknown as Record<string, string>).webkitTextStrokeWidth;
                return {
                    rects,
                    capMm,
                    ascentMm: ascentPx * mm,
                    baselineMm,
                    capMiddleMm: baselineMm - capMm / 2,
                    fontPx: Number.parseFloat(style.fontSize),
                    family: style.fontFamily,
                    weight: style.fontWeight,
                    colour: style.color,
                    stroke: typeof width === 'string' ? width : '',
                    fontSet,
                };
            }
            return empty;
        };
        const pill = document.querySelector('[data-part="week-pill"]');
        const pillStyle = pill ? window.getComputedStyle(pill) : null;
        const bar = document.querySelector('[data-part="role-bar"]');
        const spans = bar ? Array.from(bar.querySelectorAll('span')) : [];
        const icon = spans.length > 0 ? spans[0] : null;
        const label = spans.length > 1 ? spans[spans.length - 1] : null;
        return {
            page: boxOf(document.querySelector('.quest-page')),
            pill: {
                box: boxOf(pill),
                background: pillStyle?.backgroundColor ?? '',
                borderColour: pillStyle?.borderTopColor ?? '',
                colour: pillStyle?.color ?? '',
                text: textOf(pill),
            },
            bar: {
                box: boxOf(bar),
                iconBox: boxOf(icon),
                labelBox: boxOf(label),
                text: textOf(label),
            },
        };
    });
    return { id, ...raw };
}

/**
 * Measures the leaf reader cover of one row in Chrome.
 * @param page The browser page.
 * @param id The row id.
 * @param html The rendered document.
 * @returns The measurement.
 */
async function measureLeaf(page: Page, id: string, html: string): Promise<LeafMeasure> {
    await openInBrowser(page, id, html);
    const raw = await page.evaluate((): Omit<LeafMeasure, 'id'> => {
        const mm = 25.4 / 96;
        const boxOf = (element: Element | null): RawBox | null => {
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return { left: rect.left * mm, top: rect.top * mm, right: rect.right * mm, bottom: rect.bottom * mm };
        };
        const context = document.createElement('canvas').getContext('2d');
        const textOf = (root: Element | null): TextMeasure => {
            const empty: TextMeasure = {
                rects: [],
                capMm: 0,
                ascentMm: 0,
                baselineMm: 0,
                capMiddleMm: 0,
                fontPx: 0,
                family: '',
                weight: '',
                colour: '',
                stroke: '',
                fontSet: false,
            };
            if (!root || !context) return empty;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            const rects: RawBox[] = [];
            let first = true;
            while (walker.nextNode()) {
                const node = walker.currentNode as Text;
                if (!(node.nodeValue ?? '').trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                const clientRects = Array.from(range.getClientRects());
                for (const rect of clientRects) {
                    rects.push({
                        left: rect.left * mm,
                        top: rect.top * mm,
                        right: rect.right * mm,
                        bottom: rect.bottom * mm,
                    });
                }
                if (!first) continue;
                first = false;
                const parent = node.parentElement;
                if (!parent) continue;
                const style = window.getComputedStyle(parent);
                context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                const fontSet = context.font.includes(style.fontSize);
                const metrics = context.measureText('H');
                const capPx = metrics.actualBoundingBoxAscent;
                const ascentPx = metrics.fontBoundingBoxAscent;
                const rect = clientRects[0];
                const baselineMm = rect ? (rect.top + ascentPx) * mm : 0;
                const capMm = capPx * mm;
                const width = (style as unknown as Record<string, string>).webkitTextStrokeWidth;
                return {
                    rects,
                    capMm,
                    ascentMm: ascentPx * mm,
                    baselineMm,
                    capMiddleMm: baselineMm - capMm / 2,
                    fontPx: Number.parseFloat(style.fontSize),
                    family: style.fontFamily,
                    weight: style.fontWeight,
                    colour: style.color,
                    stroke: typeof width === 'string' ? width : '',
                    fontSet,
                };
            }
            return empty;
        };
        const plaque = document.querySelector('[data-part="title-plaque"]');
        const plaqueColour = plaque?.getAttribute('data-plaque-colour') ?? '';
        const paths = Array.from(plaque?.querySelectorAll('path') ?? []);
        const groups = Array.from(plaque?.querySelectorAll('g') ?? []).filter((group) =>
            (group.getAttribute('transform') ?? '').startsWith('translate('),
        );
        const band =
            paths.find((element) => (element.getAttribute('fill') ?? '').toLowerCase() === plaqueColour.toLowerCase()) ??
            null;
        const footer = document.querySelector('[data-part="footer"]');
        const series = footer?.querySelector('[data-part="series"]') ?? null;
        const week = footer?.querySelector('[data-part="week"]') ?? null;
        const role = footer?.querySelector('[data-part="role-mark"]') ?? null;
        const icons = role ? Array.from(role.querySelectorAll('span')).filter((span) => span.querySelector('svg')) : [];
        return {
            page: boxOf(document.querySelector('.quest-page')),
            plaqueBox: boxOf(plaque),
            pathBoxes: paths.map((element) => boxOf(element) as RawBox),
            groupBoxes: groups.map((element) => boxOf(element) as RawBox),
            bandBox: boxOf(band),
            title: textOf(plaque),
            footer: {
                series: textOf(series),
                week: textOf(week),
                role: textOf(role),
                iconBoxes: icons.map((element) => boxOf(element) as RawBox),
            },
        };
    });
    return { id, ...raw };
}

/**
 * Loads the band check of the build script.
 * @returns The check function.
 */
async function bandCheckFn(): Promise<(html: string, kind: string, band: string) => string> {
    const mod = (await import(SCRIPT_FILE)) as unknown as {
        questBandCheck?: (html: string, kind: string, band: string) => string;
    };
    expect(typeof mod.questBandCheck, 'The build script exports questBandCheck.').toBe('function');
    return mod.questBandCheck as (html: string, kind: string, band: string) => string;
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
            const id = ROW_IDS[index];
            a3Measures.push(await measureA3(page, id, a3Html(row, HLOGO_OPTIONS)));
            leafMeasures.push(await measureLeaf(page, id, leafHtml(row, HLOGO_OPTIONS)));
            leafDoms.push(leafDom(leafHtml(row, HLOGO_OPTIONS)));
            const a3Doc = parseHtml(a3Html(row, HLOGO_OPTIONS));
            a3PlaqueLetters.push(
                Array.from(a3Doc.querySelectorAll('[data-part="title-plaque"] path')).map((element) =>
                    commandLetters(element.getAttribute('d') ?? ''),
                ),
            );
        }
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

describe('quest-cover-readers-r2c: C1 to C11 (Red, the A3 pill and bar letters and the leaf plaque and footer)', () => {
    it('C1: the hlogo week pill letters fill 80 % of the pill inner height', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.pill.box, `the hlogo A3 reader cover ${id} holds a week pill.`).not.toBeNull();
            expect(measure.pill.text.rects.length, `the week pill text of the row ${id} has 1 line box.`).toBe(1);
            expect(measure.pill.text.fontSet, `the week pill font of the row ${id} sets on the canvas.`).toBe(true);
            const pill = measure.pill.box!;
            const innerHeight = pill.bottom - pill.top - INNER_SIZE_MM;
            const cap = measure.pill.text.capMm;
            const share = cap / innerHeight;
            expect(
                share,
                `the week pill cap height of the row ${id} is 80 % of the pill inner height: ` +
                    `the cap height is ${cap.toFixed(2)} mm, the inner height is ${innerHeight.toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(MIN_FILL_SHARE);
            expect(
                share,
                `the week pill cap height of the row ${id} is 80 % of the pill inner height: ` +
                    `the cap height is ${cap.toFixed(2)} mm, the inner height is ${innerHeight.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(MAX_FILL_SHARE);
            expect(
                Math.abs(measure.pill.text.capMiddleMm - (pill.top + pill.bottom) / 2),
                `the cap band middle of the week pill of the row ${id} sits at the pill centre: ` +
                    `the cap band middle is ${measure.pill.text.capMiddleMm.toFixed(2)} mm, ` +
                    `the pill centre is ${((pill.top + pill.bottom) / 2).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(CAP_CENTRE_TOLERANCE_MM);
            const text = measure.pill.text.rects[0];
            expect(
                Math.abs((text.left + text.right) / 2 - (pill.left + pill.right) / 2),
                `the week pill text of the row ${id} is centred across the pill: ` +
                    `the text centre is ${((text.left + text.right) / 2).toFixed(2)} mm, ` +
                    `the pill centre is ${((pill.left + pill.right) / 2).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
        }
    });

    it('C2: the hlogo week pill fits its text and keeps its place on the page', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.pill.box, `the hlogo A3 reader cover ${id} holds a week pill.`).not.toBeNull();
            expect(measure.pill.text.rects.length, `the week pill text of the row ${id} has 1 line box.`).toBe(1);
            const pill = measure.pill.box!;
            const text = measure.pill.text.rects[0];
            const leftPadding = text.left - pill.left;
            const rightPadding = pill.right - text.right;
            expect(
                Math.abs(leftPadding - rightPadding),
                `the week pill of the row ${id} has even paddings: the left is ${leftPadding.toFixed(2)} mm, ` +
                    `the right is ${rightPadding.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PADDING_TOLERANCE_MM);
            expect(
                leftPadding,
                `the week pill of the row ${id} hugs its text: the left padding is ${leftPadding.toFixed(2)} mm, ` +
                    `the corner radius is ${PILL_PADDING_MM} mm.`,
            ).toBeGreaterThanOrEqual(PILL_PADDING_MM);
            expect(
                leftPadding,
                `the week pill of the row ${id} hugs its text: the left padding is ${leftPadding.toFixed(2)} mm, ` +
                    `the corner radius is ${PILL_PADDING_MM} mm.`,
            ).toBeLessThanOrEqual(PILL_PADDING_MM + PADDING_TOLERANCE_MM);
            expect(
                rightPadding,
                `the week pill of the row ${id} hugs its text: the right padding is ${rightPadding.toFixed(2)} mm, ` +
                    `the corner radius is ${PILL_PADDING_MM} mm.`,
            ).toBeGreaterThanOrEqual(PILL_PADDING_MM);
            expect(
                rightPadding,
                `the week pill of the row ${id} hugs its text: the right padding is ${rightPadding.toFixed(2)} mm, ` +
                    `the corner radius is ${PILL_PADDING_MM} mm.`,
            ).toBeLessThanOrEqual(PILL_PADDING_MM + PADDING_TOLERANCE_MM);
            expect(
                Math.abs((pill.left + pill.right) / 2 - PILL_CENTRE_MM),
                `the week pill centre of the row ${id} is ${PILL_CENTRE_MM} mm: ` +
                    `the pill centre is ${((pill.left + pill.right) / 2).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(pill.top - PILL_TOP_MM),
                `the week pill top of the row ${id} is ${PILL_TOP_MM} mm: the top is ${pill.top.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(pill.bottom - pill.top - PILL_HEIGHT_MM),
                `the week pill height of the row ${id} is ${PILL_HEIGHT_MM} mm: ` +
                    `the height is ${(pill.bottom - pill.top).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(toHex(measure.pill.background), `the week pill fill of the row ${id}.`).toBe(AMBER.toLowerCase());
            expect(toHex(measure.pill.borderColour), `the week pill border of the row ${id}.`).toBe(BROWN.toLowerCase());
            expect(toHex(measure.pill.colour), `the week pill text colour of the row ${id}.`).toBe(BROWN.toLowerCase());
        }
    });

    it('C3: the hlogo role bar letters fill 80 % of the bar inner height', () => {
        expect(a3Measures.length, 'the browser measures 14 A3 rows.').toBe(14);
        for (const measure of a3Measures) {
            const id = measure.id;
            expect(measure.bar.box, `the hlogo A3 reader cover ${id} holds a role bar.`).not.toBeNull();
            expect(measure.bar.iconBox, `the role bar of the row ${id} holds a role mark icon.`).not.toBeNull();
            expect(measure.bar.labelBox, `the role bar of the row ${id} holds a label.`).not.toBeNull();
            expect(measure.bar.text.rects.length, `the role bar label of the row ${id} has 1 line box.`).toBe(1);
            expect(measure.bar.text.fontSet, `the role bar font of the row ${id} sets on the canvas.`).toBe(true);
            const bar = measure.bar.box!;
            const icon = measure.bar.iconBox!;
            const label = measure.bar.labelBox!;
            const innerHeight = bar.bottom - bar.top - INNER_SIZE_MM;
            const cap = measure.bar.text.capMm;
            const share = cap / innerHeight;
            expect(
                share,
                `the role bar cap height of the row ${id} is 80 % of the bar inner height: ` +
                    `the cap height is ${cap.toFixed(2)} mm, the inner height is ${innerHeight.toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(MIN_FILL_SHARE);
            expect(
                share,
                `the role bar cap height of the row ${id} is 80 % of the bar inner height: ` +
                    `the cap height is ${cap.toFixed(2)} mm, the inner height is ${innerHeight.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(MAX_FILL_SHARE);
            expect(
                Math.abs(measure.bar.text.capMiddleMm - (bar.top + bar.bottom) / 2),
                `the cap band middle of the role bar of the row ${id} sits at the bar centre: ` +
                    `the cap band middle is ${measure.bar.text.capMiddleMm.toFixed(2)} mm, ` +
                    `the bar centre is ${((bar.top + bar.bottom) / 2).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(CAP_CENTRE_TOLERANCE_MM);
            expect(
                icon.top,
                `the role mark icon box of the row ${id} lies inside the bar inner box: ` +
                    `the icon top is ${icon.top.toFixed(2)} mm, the inner top is ${(bar.top + BORDER_WIDTH_MM).toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(bar.top + BORDER_WIDTH_MM - PAGE_CENTRE_TOLERANCE_MM);
            expect(
                icon.bottom,
                `the role mark icon box of the row ${id} lies inside the bar inner box: ` +
                    `the icon bottom is ${icon.bottom.toFixed(2)} mm, ` +
                    `the inner bottom is ${(bar.bottom - BORDER_WIDTH_MM).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(bar.bottom - BORDER_WIDTH_MM + PAGE_CENTRE_TOLERANCE_MM);
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
                `the role bar of the row ${id} is centred on the page.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(bar.top - ROLE_BAR_TOP_MM),
                `the role bar top of the row ${id} is ${ROLE_BAR_TOP_MM} mm: the top is ${bar.top.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(bar.bottom - bar.top - ROLE_BAR_HEIGHT_MM),
                `the role bar height of the row ${id} is ${ROLE_BAR_HEIGHT_MM} mm: ` +
                    `the height is ${(bar.bottom - bar.top).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
        }
    });

    it('C4: the hlogo leaf plaque is the r2 book plaque drawing and its width follows the title', () => {
        expect(leafMeasures.length, 'the browser measures 14 leaf rows.').toBe(14);
        for (const [index, measure] of leafMeasures.entries()) {
            const id = ROW_IDS[index];
            const dom = leafDoms[index];
            const a3Letters = a3PlaqueLetters[index];
            expect(measure.plaqueBox, `the hlogo leaf reader cover ${id} holds a title plaque.`).not.toBeNull();
            expect(measure.title.rects.length, `the leaf title of the row ${id} has 1 line box.`).toBe(1);
            const plaque = measure.plaqueBox!;
            expect(
                Math.abs(plaque.top - LEAF_PLAQUE_TOP_MM),
                `the leaf title plaque of the row ${id} starts at ${LEAF_PLAQUE_TOP_MM} mm: ` +
                    `the top is ${plaque.top.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs(plaque.bottom - plaque.top - LEAF_PLAQUE_HEIGHT_MM),
                `the leaf title plaque of the row ${id} is ${LEAF_PLAQUE_HEIGHT_MM} mm high: ` +
                    `the height is ${(plaque.bottom - plaque.top).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            const text = measure.title.rects[0];
            const titleWidth = text.right - text.left;
            const wanted = Math.min(
                LEAF_PLAQUE_MAX_WIDTH_MM,
                Math.max(LEAF_PLAQUE_MIN_WIDTH_MM, titleWidth + 2 * LEAF_PLAQUE_PADDING_MM),
            );
            expect(
                Math.abs(plaque.right - plaque.left - wanted),
                `the leaf title plaque of the row ${id} follows its title: the title is ${titleWidth.toFixed(2)} mm, ` +
                    `the plaque is ${(plaque.right - plaque.left).toFixed(2)} mm, the rule gives ${wanted.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(WIDTH_TOLERANCE_MM);
            expect(
                plaque.right - plaque.left,
                `the leaf title plaque of the row ${id} stays between ${LEAF_PLAQUE_MIN_WIDTH_MM} mm and ` +
                    `${LEAF_PLAQUE_MAX_WIDTH_MM} mm: the width is ${(plaque.right - plaque.left).toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(LEAF_PLAQUE_MIN_WIDTH_MM - WIDTH_TOLERANCE_MM);
            expect(
                plaque.right - plaque.left,
                `the leaf title plaque of the row ${id} stays between ${LEAF_PLAQUE_MIN_WIDTH_MM} mm and ` +
                    `${LEAF_PLAQUE_MAX_WIDTH_MM} mm: the width is ${(plaque.right - plaque.left).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(LEAF_PLAQUE_MAX_WIDTH_MM + WIDTH_TOLERANCE_MM);
            expect(measure.page, `the leaf reader cover ${id} holds a page.`).not.toBeNull();
            const page = measure.page!;
            expect(
                Math.abs((plaque.left + plaque.right) / 2 - (page.left + page.right) / 2),
                `the leaf title plaque of the row ${id} is centred on the page: ` +
                    `the plaque centre is ${((plaque.left + plaque.right) / 2).toFixed(2)} mm, ` +
                    `the page centre is ${((page.left + page.right) / 2).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(
                dom.paths.length,
                `the leaf plaque of the row ${id} holds the same path count as the A3 plaque: ` +
                    `the leaf holds ${dom.paths.length} paths, the A3 holds ${a3Letters.length} paths.`,
            ).toBe(a3Letters.length);
            for (const [pathIndex, element] of dom.paths.entries()) {
                expect(
                    element.letters,
                    `the path ${pathIndex} of the leaf plaque of the row ${id} has the same command letters ` +
                        `as the path ${pathIndex} of the A3 plaque: the leaf holds "${element.letters}", ` +
                        `the A3 holds "${a3Letters[pathIndex] ?? ''}".`,
                ).toBe(a3Letters[pathIndex]);
            }
            expect(
                dom.crystals.length,
                `the leaf plaque of the row ${id} holds exactly 2 crystal groups: ` +
                    `it holds ${dom.crystals.length}.`,
            ).toBe(2);
            for (const [pathIndex, pathBox] of measure.pathBoxes.entries()) {
                expect(
                    pathBox.left >= plaque.left - PLAQUE_BOX_TOLERANCE_MM &&
                        pathBox.right <= plaque.right + PLAQUE_BOX_TOLERANCE_MM &&
                        pathBox.top >= plaque.top - PLAQUE_BOX_TOLERANCE_MM &&
                        pathBox.bottom <= plaque.bottom + PLAQUE_BOX_TOLERANCE_MM,
                    `the path ${pathIndex} of the leaf plaque of the row ${id} lies inside the plaque part box: ` +
                        `the path box is ${pathBox.left.toFixed(2)} to ${pathBox.right.toFixed(2)} mm, ` +
                        `the part box is ${plaque.left.toFixed(2)} to ${plaque.right.toFixed(2)} mm.`,
                ).toBe(true);
            }
            for (const [groupIndex, groupBox] of measure.groupBoxes.entries()) {
                expect(
                    groupBox.left >= plaque.left - PLAQUE_BOX_TOLERANCE_MM &&
                        groupBox.right <= plaque.right + PLAQUE_BOX_TOLERANCE_MM &&
                        groupBox.top >= plaque.top - PLAQUE_BOX_TOLERANCE_MM &&
                        groupBox.bottom <= plaque.bottom + PLAQUE_BOX_TOLERANCE_MM,
                    `the crystal group ${groupIndex} of the leaf plaque of the row ${id} lies inside the ` +
                        `plaque part box: the group box is ${groupBox.left.toFixed(2)} to ` +
                        `${groupBox.right.toFixed(2)} mm, the part box is ${plaque.left.toFixed(2)} to ` +
                        `${plaque.right.toFixed(2)} mm.`,
                ).toBe(true);
            }
        }
    });

    it('C5: the hlogo leaf plaque takes the K gray palette', () => {
        expect(leafDoms.length, 'the file reads 14 leaf documents.').toBe(14);
        for (const [index, dom] of leafDoms.entries()) {
            const id = ROW_IDS[index];
            expect(
                dom.plaqueColour,
                `the data-plaque-colour value of the leaf plaque of the row ${id}: it holds "${dom.plaqueColour}".`,
            ).toBe(K_BAND);
            expect(
                dom.paths.length,
                `the leaf plaque of the row ${id} holds 12 paths: it holds ${dom.paths.length}.`,
            ).toBe(12);
            expect(dom.paths[0]?.fill, `the outer fill of the leaf plaque of the row ${id}.`).toBe(K_OUTER);
            expect(dom.paths[0]?.stroke, `the outer stroke of the leaf plaque of the row ${id}.`).toBe(K_OUTER);
            expect(dom.paths[1]?.fill, `the ring fill of the leaf plaque of the row ${id}.`).toBe(K_RING);
            expect(dom.paths[2]?.fill, `the band fill of the leaf plaque of the row ${id}.`).toBe(K_BAND);
            expect(dom.paths[3]?.fill, `the highlight fill of the leaf plaque of the row ${id}.`).toBe('none');
            expect(dom.paths[3]?.stroke, `the highlight stroke of the leaf plaque of the row ${id}.`).toBe(WHITE);
            expect(dom.crystals.length, `the leaf plaque of the row ${id} holds 2 crystal groups.`).toBe(2);
            for (const [groupIndex, group] of dom.crystals.entries()) {
                expect(group[0]?.fill, `the ornament fill of the crystal group ${groupIndex} of the row ${id}.`).toBe(
                    K_RING,
                );
                expect(group[0]?.stroke, `the ornament stroke of the crystal group ${groupIndex} of the row ${id}.`).toBe(
                    K_OUTER,
                );
                expect(group[1]?.fill, `the second ornament fill of the crystal group ${groupIndex} of the row ${id}.`).toBe(
                    WHITE,
                );
                expect(group[1]?.stroke, `the second ornament stroke of the crystal group ${groupIndex} of the row ${id}.`).toBe(
                    K_OUTER,
                );
                expect(group[2]?.fill, `the first diamond fill of the crystal group ${groupIndex} of the row ${id}.`).toBe(
                    K_DIAMOND,
                );
                expect(group[3]?.fill, `the second diamond fill of the crystal group ${groupIndex} of the row ${id}.`).toBe(
                    WHITE,
                );
            }
            const values: string[] = [];
            for (const element of dom.paths) {
                if (element.fill) values.push(element.fill);
                if (element.stroke) values.push(element.stroke);
            }
            for (const group of dom.crystals) {
                for (const element of group) {
                    if (element.fill) values.push(element.fill);
                    if (element.stroke) values.push(element.stroke);
                }
            }
            for (const value of values) {
                expect(
                    K_PALETTE_VALUES.map((entry) => entry.toLowerCase()).includes(value.toLowerCase()),
                    `the leaf plaque of the row ${id} holds only the K palette values: it holds "${value}".`,
                ).toBe(true);
            }
        }
    });

    it('C6: the hlogo leaf title fills 80 % of the plaque band', () => {
        expect(leafMeasures.length, 'the browser measures 14 leaf rows.').toBe(14);
        for (const measure of leafMeasures) {
            const id = measure.id;
            expect(measure.title.rects.length, `the leaf title of the row ${id} has 1 line box.`).toBe(1);
            const text = measure.title.rects[0];
            const textHeight = text.bottom - text.top;
            const share = textHeight / BAND_HEIGHT_MM;
            expect(
                share,
                `the leaf title text box of the row ${id} fills 80 % of the band: ` +
                    `the text box is ${textHeight.toFixed(2)} mm, the band is ${BAND_HEIGHT_MM.toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(MIN_FILL_SHARE);
            expect(
                share,
                `the leaf title text box of the row ${id} fills 80 % of the band: ` +
                    `the text box is ${textHeight.toFixed(2)} mm, the band is ${BAND_HEIGHT_MM.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(MAX_FILL_SHARE);
            expect(
                measure.bandBox,
                `the leaf plaque of the row ${id} holds a band path: the title text box is ` +
                    `${textHeight.toFixed(2)} mm and the band must be ${BAND_HEIGHT_MM.toFixed(2)} mm.`,
            ).not.toBeNull();
            const band = measure.bandBox!;
            expect(
                Math.abs(band.bottom - band.top - BAND_HEIGHT_MM),
                `the band of the leaf plaque of the row ${id} is ${BAND_HEIGHT_MM.toFixed(2)} mm high: ` +
                    `the band is ${(band.bottom - band.top).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(BAND_HEIGHT_TOLERANCE_MM);
            expect(
                Math.abs((text.top + text.bottom) / 2 - (band.top + band.bottom) / 2),
                `the leaf title text box of the row ${id} sits at the band centre: ` +
                    `the text centre is ${((text.top + text.bottom) / 2).toFixed(2)} mm, ` +
                    `the band centre is ${((band.top + band.bottom) / 2).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(BAND_CENTRE_TOLERANCE_MM);
            expect(
                Math.abs((text.left + text.right) / 2 - (band.left + band.right) / 2),
                `the leaf title text box of the row ${id} sits at the band centre: ` +
                    `the text centre is ${((text.left + text.right) / 2).toFixed(2)} mm, ` +
                    `the band centre is ${((band.left + band.right) / 2).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(BAND_CENTRE_TOLERANCE_MM);
            for (const group of measure.groupBoxes) {
                const gap =
                    group.left > text.right
                        ? group.left - text.right
                        : text.left > group.right
                          ? text.left - group.right
                          : 0;
                expect(
                    gap,
                    `the leaf title text box of the row ${id} lies clear of a crystal group box: ` +
                        `the gap is ${gap.toFixed(2)} mm.`,
                ).toBeGreaterThanOrEqual(ORNAMENT_CLEARANCE_MM);
            }
            expect(measure.title.colour, `the leaf title text colour of the row ${id}.`).toBe('rgb(0, 0, 0)');
            expect(measure.title.stroke, `the leaf title text stroke of the row ${id}.`).toBe('0px');
            expect(measure.title.family, `the leaf title font family of the row ${id}.`).toContain('League Spartan');
            expect(measure.title.weight, `the leaf title font weight of the row ${id}.`).toBe('700');
        }
    });

    it('C7: the hlogo leaf holds no band word and no band icon', () => {
        expect(leafDoms.length, 'the file reads 14 leaf documents.').toBe(14);
        for (const [index, dom] of leafDoms.entries()) {
            const id = ROW_IDS[index];
            expect(
                dom.partCounts['band-word'] ?? 0,
                `the hlogo leaf reader cover ${id} holds no band word part: ` +
                    `it holds ${dom.partCounts['band-word'] ?? 0}.`,
            ).toBe(0);
            expect(
                dom.partCounts['band-icon'] ?? 0,
                `the hlogo leaf reader cover ${id} holds no band icon part: ` +
                    `it holds ${dom.partCounts['band-icon'] ?? 0}.`,
            ).toBe(0);
            expect(
                dom.sproutMatches,
                `the hlogo leaf reader cover ${id} holds no band word in its text: ` +
                    `it holds ${dom.sproutMatches} matches.`,
            ).toBe(0);
            expect(
                dom.svgOutside,
                `the hlogo leaf reader cover ${id} holds no SVG outside the frame, the plaque, and the role mark: ` +
                    `it holds ${dom.svgOutside}.`,
            ).toBe(0);
        }
    });

    it('C8: the hlogo leaf holds one footer with the series, the week, and the role line', () => {
        expect(leafDoms.length, 'the file reads 14 leaf documents.').toBe(14);
        const rows = readerRows();
        for (const [index, dom] of leafDoms.entries()) {
            const id = ROW_IDS[index];
            const row = rows[index];
            expect(dom.footerCount, `the hlogo leaf reader cover ${id} holds one footer part: it holds ${dom.footerCount}.`).toBe(1);
            expect(dom.seriesCount, `the footer of the leaf reader cover ${id} holds one series part.`).toBe(1);
            expect(dom.weekCount, `the footer of the leaf reader cover ${id} holds one week part.`).toBe(1);
            expect(dom.roleCount, `the footer of the leaf reader cover ${id} holds one role mark part.`).toBe(1);
            expect(
                dom.footerText,
                `the footer text of the leaf reader cover ${id}: it holds "${dom.footerText}".`,
            ).toBe(`Storytime Advantage ${MIDDLE_DOT} Week ${row.week} ${MIDDLE_DOT} ${row.roleLabel}`);
            expect(
                /background/i.test(dom.footerInline),
                `the footer of the leaf reader cover ${id} holds no background colour.`,
            ).toBe(false);
            expect(/border/i.test(dom.footerInline), `the footer of the leaf reader cover ${id} holds no border.`).toBe(
                false,
            );
            expect(
                /background/i.test(dom.seriesInline),
                `the series part of the leaf reader cover ${id} holds no background colour.`,
            ).toBe(false);
            expect(/border/i.test(dom.seriesInline), `the series part of the leaf reader cover ${id} holds no border.`).toBe(
                false,
            );
            expect(
                /background/i.test(dom.weekInline),
                `the week part of the leaf reader cover ${id} holds no background colour.`,
            ).toBe(false);
            expect(/border/i.test(dom.weekInline), `the week part of the leaf reader cover ${id} holds no border.`).toBe(false);
            expect(
                /background/i.test(dom.roleInline),
                `the role mark part of the leaf reader cover ${id} holds no background colour.`,
            ).toBe(false);
            expect(
                /border/i.test(dom.roleInline),
                `the role mark part of the leaf reader cover ${id} holds no border.`,
            ).toBe(false);
        }
    });

    it('C9: the hlogo leaf footer sits on one line at the centre of the page', () => {
        expect(leafMeasures.length, 'the browser measures 14 leaf rows.').toBe(14);
        for (const measure of leafMeasures) {
            const id = measure.id;
            expect(measure.page, `the leaf reader cover ${id} holds a page.`).not.toBeNull();
            const page = measure.page!;
            expect(
                Math.abs(page.right - page.left - LEAF_PAGE_WIDTH_MM),
                `the leaf page of the row ${id} is ${LEAF_PAGE_WIDTH_MM} mm wide: ` +
                    `the page is ${(page.right - page.left).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(PAGE_CENTRE_TOLERANCE_MM);
            expect(measure.footer.series.rects.length, `the series text of the leaf reader cover ${id} has 1 line box.`).toBe(
                1,
            );
            expect(measure.footer.week.rects.length, `the week text of the leaf reader cover ${id} has 1 line box.`).toBe(1);
            expect(measure.footer.role.rects.length, `the role label of the leaf reader cover ${id} has 1 line box.`).toBe(
                1,
            );
            expect(
                measure.footer.series.fontPx,
                `the computed font size of the series text of the leaf reader cover ${id}: ` +
                    `it is ${measure.footer.series.fontPx.toFixed(2)} px.`,
            ).toBe(FOOTER_FONT_PX);
            expect(
                measure.footer.week.fontPx,
                `the computed font size of the week text of the leaf reader cover ${id}: ` +
                    `it is ${measure.footer.week.fontPx.toFixed(2)} px.`,
            ).toBe(FOOTER_FONT_PX);
            expect(
                measure.footer.role.fontPx,
                `the computed font size of the role label of the leaf reader cover ${id}: ` +
                    `it is ${measure.footer.role.fontPx.toFixed(2)} px.`,
            ).toBe(FOOTER_FONT_PX);
            expect(
                measure.footer.iconBoxes.length,
                `the role mark part of the leaf reader cover ${id} holds 2 icon boxes: ` +
                    `it holds ${measure.footer.iconBoxes.length}.`,
            ).toBe(2);
            const series = measure.footer.series.rects[0];
            const week = measure.footer.week.rects[0];
            const role = measure.footer.role.rects[0];
            const centres = [
                (series.top + series.bottom) / 2,
                (week.top + week.bottom) / 2,
                (role.top + role.bottom) / 2,
            ];
            for (const [index, centre] of centres.entries()) {
                expect(
                    Math.abs(centre - centres[0]),
                    `the footer text of the leaf reader cover ${id} lies on one line: ` +
                        `the text ${index} centre is ${centre.toFixed(2)} mm, ` +
                        `the first text centre is ${centres[0].toFixed(2)} mm.`,
                ).toBeLessThanOrEqual(FOOTER_TOLERANCE_MM);
            }
            const boxes = [series, week, role, ...measure.footer.iconBoxes];
            const left = Math.min(...boxes.map((box) => box.left));
            const right = Math.max(...boxes.map((box) => box.right));
            const top = Math.min(...boxes.map((box) => box.top));
            const bottom = Math.max(...boxes.map((box) => box.bottom));
            expect(
                Math.abs((left + right) / 2 - FOOTER_CENTRE_MM),
                `the footer content of the leaf reader cover ${id} is centred on the page: ` +
                    `the content centre is ${((left + right) / 2).toFixed(2)} mm, ` +
                    `the page centre is ${FOOTER_CENTRE_MM} mm.`,
            ).toBeLessThanOrEqual(FOOTER_TOLERANCE_MM);
            expect(
                Math.abs((top + bottom) / 2 - FOOTER_VERTICAL_CENTRE_MM),
                `the footer content of the leaf reader cover ${id} sits at ${FOOTER_VERTICAL_CENTRE_MM} mm: ` +
                    `the content centre is ${((top + bottom) / 2).toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(FOOTER_TOLERANCE_MM);
            expect(
                left,
                `the footer content of the leaf reader cover ${id} starts at or after ${FOOTER_LEFT_MM} mm: ` +
                    `it starts at ${left.toFixed(2)} mm.`,
            ).toBeGreaterThanOrEqual(FOOTER_LEFT_MM);
            expect(
                right,
                `the footer content of the leaf reader cover ${id} ends at or before ${FOOTER_RIGHT_MM} mm: ` +
                    `it ends at ${right.toFixed(2)} mm.`,
            ).toBeLessThanOrEqual(FOOTER_RIGHT_MM);
        }
    });

    it('C10: the build band check passes the hlogo leaf and the default leaf', async () => {
        const check = await bandCheckFn();
        const rows = readerRows();
        for (const [index, row] of rows.entries()) {
            const id = ROW_IDS[index];
            expect(
                check(leafHtml(row, HLOGO_OPTIONS), 'reader-leaf', row.litBand),
                `the band check of the hlogo leaf reader cover ${id}.`,
            ).toBe('pass');
            expect(
                check(leafHtml(row, DEFAULT_OPTIONS), 'reader-leaf', row.litBand),
                `the band check of the default leaf reader cover ${id}.`,
            ).toBe('pass');
        }
        const row = rows[0];
        const withBandWord = leafHtml(row, HLOGO_OPTIONS).replace(
            '</body>',
            '<div data-part="band-word">SPROUT</div></body>',
        );
        expect(
            check(withBandWord, 'reader-leaf', row.litBand),
            'the band check of an hlogo leaf with a band word part.',
        ).toBe('fail');
        const withoutBandWord = leafHtml(row, DEFAULT_OPTIONS).replace(
            /<div data-part="band-word"[\s\S]*?<\/div>/,
            '',
        );
        expect(
            check(withoutBandWord, 'reader-leaf', row.litBand),
            'the band check of a default leaf without its band word part.',
        ).toBe('fail');
    }, 120_000);

    it('C11: the default leaf render of each row keeps its bytes of the role base 0b3000fa', () => {
        const rows = readerRows();
        for (const [index, row] of rows.entries()) {
            const id = ROW_IDS[index];
            expect(
                hashOfText(leafHtml(row, DEFAULT_OPTIONS)),
                `the SHA-256 of the default leaf render of the row ${id}.`,
            ).toBe(LEAF_PINS[id]);
        }
    });
});
