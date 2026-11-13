import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BACK_LINES, richHtml } from '../../covers/back-text';
import {
    STORYTIME_LEVEL_COLOURS,
    STORYTIME_LINE_ADDRESS,
    STORYTIME_SERIES,
    checkStorytimeCoverCopy,
    checkStorytimeCoverQr,
    checkStorytimeCoverThai,
    storytimeCoverFileUrl,
    storytimeCoverFontCss,
    storytimeCoverQrGrid,
    storytimeCoverQrSvg,
} from './covers';

/**
 * The option A cover template of the Storytime Advantage covers (track
 * storytime_cover_options_20261106, spec D-A1, D-A2, FR-6, FR-7, FR-9, FR-10).
 *
 * The frame is the Primary Advantage quest frame of `options/build.py` (`a_hud`, `a_plaque`,
 * `a_crest`, `a_front`, `a_back`, `a_reader`, `leaf`), ported to TypeScript with the same colours
 * and the same geometry. The module renders one full HTML document for one cover side, or the
 * body and the CSS of one reader cover page. It reads the five approved Thai contact lines, the
 * level colours, and the LINE QR code from the shared modules of D-A2 and changes none of them.
 *
 * The module is pure at render time: no network call, no write, no date. `questReaders` reads the
 * seven shipped week files and `pictures.json`; every other function reads nothing, or only the
 * data file that its caller names.
 */

/** The 6 cover sides of the template (pin P1). */
export type QuestCoverKind =
    | 'student-front'
    | 'student-back'
    | 'teacher-front'
    | 'teacher-back'
    | 'reader-a3'
    | 'reader-leaf';

/** The five bands of the game bar, in the order of the bar (spec FR-6.4, pin P11). */
export const QUEST_BANDS = ['seed', 'sprout', 'leaf', 'bud', 'flower'] as const;

/** The role label of a reader cover (spec FR-9.3, the rule of `print/readers.ts`). */
export const QUEST_ROLE_LABELS = {
    listen: 'Listen and read.',
    sound: 'Sound it out.',
    firstSound: 'Say the first sound.',
} as const;

/** One text or face box of the frame, in millimetres at bleed 0. */
export interface QuestBox {
    /** The cover kind of the box. */
    kind: QuestCoverKind;
    /** The left edge, from the trim edge. */
    leftMm: number;
    /** The top edge, from the trim edge. */
    topMm: number;
    /** The width of the box. */
    widthMm: number;
    /** The height of the box. */
    heightMm: number;
}

/** The tile amber of the Storytime Advantage logo (round 5 of 2026-11-10). */
const LOGO_AMBER = '#FCD34D';

/** The mark brown of the Storytime Advantage logo. */
const LOGO_BROWN = '#92400E';

/** The light cream of the logo, the middle ring of an amber plaque. */
const LOGO_CREAM = '#FEF3C7';

/** The paper tone of the logo, the panel fill of the student back. */
const LOGO_PAPER = '#FFFBEB';

/** The white of the logo, the "Advantage" text of an amber banner. */
const LOGO_WHITE = '#FFFFFF';

/**
 * The top of the contact line block of both backs, in millimetres at bleed 0 (round 5 of
 * 2026-11-10). The block of the 5 lines and the publisher mark stands centered in the board of the
 * contact sign (203 mm to 277 mm).
 */
const CONTACT_LINES_TOP_MM = 215.0;

/**
 * The top of the publisher mark of both backs, in millimetres at bleed 0. The mark stands under
 * the contact lines with a 2.80 mm gap, at the centre 78 mm of the board minus 7 mm.
 */
const PUBLISHER_MARK_TOP_MM = 251.5;

/** The bottom of the A3 reader title plaque, in millimetres at bleed 0 (round of 2026-11-11). */
const READER_PLAQUE_BOTTOM_MM = 276;

/** The height of the A3 reader title plaque with the top style hlogo, in millimetres. */
const READER_PLAQUE_HEIGHT_MM = 40;

/** The inset of the plaque band from the plaque edge, in millimetres: the band is the height minus 5.6. */
const READER_PLAQUE_BAND_INSET_MM = 5.6;

/**
 * The ink ascents of the League Spartan 700 face, in em units, for the 95 ASCII characters 32 to
 * 126, in code point order (round of 2026-11-11, readers r2c). The table comes from the committed
 * script `measure/runs/storytime_cover_options_20261106/league-spartan-extents-r2c.mjs`, which
 * reads `actualBoundingBoxAscent` of each character at a 1000 px size with kerning off.
 */
const LEAGUE_SPARTAN_700_ASCENT: number[] = [
    0, 0.7031, 0.6875, 0.6719, 0.7813, 0.6875, 0.6875, 0.6875, 0.7031, 0.7031, 0.7031, 0.5469, 0.1719, 0.2969,
    0.1719, 0.7031, 0.6875, 0.6719, 0.6875, 0.6875, 0.6719, 0.6719, 0.6719, 0.6719, 0.6875, 0.6875, 0.4688,
    0.4688, 0.5781, 0.5, 0.5781, 0.6875, 0.6875, 0.6719, 0.6719, 0.6875, 0.6719, 0.6719, 0.6719, 0.6875, 0.6719,
    0.6719, 0.6719, 0.6719, 0.6719, 0.6719, 0.6719, 0.6875, 0.6719, 0.6875, 0.6719, 0.6875, 0.6719, 0.6719,
    0.6719, 0.6719, 0.6719, 0.6719, 0.6719, 0.7031, 0.7031, 0.7031, 0.6875, 0, 0.6719, 0.4375, 0.7031, 0.4375,
    0.7031, 0.4375, 0.7031, 0.4375, 0.7031, 0.6719, 0.6719, 0.7031, 0.7031, 0.4375, 0.4375, 0.4375, 0.4375,
    0.4375, 0.4375, 0.4375, 0.5938, 0.4219, 0.4219, 0.4219, 0.4219, 0.4219, 0.4219, 0.7031, 0.7188, 0.7031,
    0.4219,
];

/**
 * The ink descents of the League Spartan 700 face, in em units, for the 95 ASCII characters 32 to
 * 126, in code point order (round of 2026-11-11, readers r2c). The table comes from the committed
 * script `measure/runs/storytime_cover_options_20261106/league-spartan-extents-r2c.mjs`, which
 * reads `actualBoundingBoxDescent` of each character at a 1000 px size with kerning off. A negative
 * value is ink that stops above the baseline, as the quotes do.
 */
const LEAGUE_SPARTAN_700_DESCENT: number[] = [
    0, 0.0156, -0.375, 0, 0.1094, 0.0156, 0.0156, -0.375, 0.2188, 0.2188, -0.4063, -0.125, 0.1563, -0.1563,
    0.0156, 0.1094, 0.0156, 0, 0, 0.0156, 0, 0.0156, 0.0156, 0, 0.0156, 0, 0.0156, 0.1563, -0.0781, -0.1719,
    -0.0781, 0.0156, 0.0156, 0, 0, 0.0156, 0, 0, 0, 0.0156, 0, 0, 0.0156, 0, 0, 0, 0, 0.0156, 0, 0.1719, 0,
    0.0156, 0, 0.0156, 0, 0, 0, 0, 0, 0.2188, 0, 0.2188, -0.4688, 0.1094, -0.4688, 0.0156, 0.0156, 0.0156,
    0.0156, 0.0156, 0, 0.2344, 0, 0, 0.2344, 0, 0, 0, 0, 0.0156, 0.2188, 0.2188, 0, 0.0156, 0.0156, 0.0156,
    0, 0, 0, 0.2188, 0, 0.2188, 0.1406, 0.2188, -0.2344,
];

/**
 * The cap height of the League Spartan 700 face, in em units: `measureText('H').actualBoundingBoxAscent`
 * of the script `measure/runs/storytime_cover_options_20261106/league-spartan-extents-r2c.mjs`.
 */
const LEAGUE_SPARTAN_700_CAP = 0.6719;

/**
 * The font ascent of the League Spartan 700 face, in em units:
 * `measureText('H').fontBoundingBoxAscent` of the script
 * `measure/runs/storytime_cover_options_20261106/league-spartan-extents-r2c.mjs`. It places the
 * baseline inside a line box of `line-height: 1`.
 */
const LEAGUE_SPARTAN_700_FONT_ASCENT = 0.7;

/**
 * The font descent of the League Spartan 700 face, in em units:
 * `measureText('H').fontBoundingBoxDescent` of the script
 * `measure/runs/storytime_cover_options_20261106/league-spartan-extents-r2c.mjs`.
 */
const LEAGUE_SPARTAN_700_FONT_DESCENT = 0.22;

/**
 * The cap height of the League Spartan 700 face as a share of the font size. The standing rules of
 * 2026-11-11 read the cap height, not the line box, so the 3 title sizes of the hlogo renders use it
 * (S3).
 */
const LEAGUE_SPARTAN_CAP_EM = LEAGUE_SPARTAN_700_CAP;

/** The share of its band that the cap height of a title fills: about 80 % (S3, the rule is 75 % to 85 %). */
const TITLE_CAP_SHARE = 0.8;

/**
 * Reads the font size that gives a cap height of `TITLE_CAP_SHARE` of one band.
 * @param bandMm The band height in millimetres.
 * @returns The font size in millimetres.
 */
function titleCapFontMm(bandMm: number): number {
    return (TITLE_CAP_SHARE * bandMm) / LEAGUE_SPARTAN_CAP_EM;
}

/** The edge of the band of a title plaque inside the plaque, in millimetres: half the band inset. */
const PLAQUE_BAND_EDGE_MM = READER_PLAQUE_BAND_INSET_MM / 2;

/** The font size of the A3 reader title with the top style hlogo, in millimetres (S3, readers r2c). */
const READER_TITLE_FONT_MM = titleCapFontMm(READER_PLAQUE_HEIGHT_MM - READER_PLAQUE_BAND_INSET_MM);

/** The font size of a front title plaque row with the top style hlogo, in millimetres (S3, standing rules). */
const FRONT_TITLE_FONT_MM = titleCapFontMm(14 - READER_PLAQUE_BAND_INSET_MM);

/** The padding of a front title plaque with the top style hlogo on each side of its row, in millimetres. */
const FRONT_TITLE_PADDING_MM = 16;

/** The least width of a front title plaque with the top style hlogo, in millimetres: the box width. */
const FRONT_TITLE_MIN_WIDTH_MM = 158;

/** The side margin of the separator dot of the front title plaque row, in millimetres. */
const FRONT_SEPARATOR_MARGIN_MM = 1.6;

/**
 * Reads the ink box of one title text on the League Spartan 700 face, in em units (round of
 * 2026-11-11, readers r2c): the ink top is the larger of the cap height and the largest ascent of
 * the characters, and the ink bottom is the largest descent. A character outside the table counts
 * as the cap height and no descent.
 * @param text The text.
 * @returns The ink top above the baseline and the ink bottom below it, in em units.
 */
function titleInkEm(text: string): { ascent: number; descent: number } {
    let ascent = LEAGUE_SPARTAN_CAP_EM;
    let descent = 0;
    for (const char of text) {
        const index = (char.codePointAt(0) ?? 0) - 32;
        const known = index >= 0 && index < LEAGUE_SPARTAN_700_ASCENT.length;
        ascent = Math.max(ascent, known ? LEAGUE_SPARTAN_700_ASCENT[index] : LEAGUE_SPARTAN_CAP_EM);
        descent = Math.max(descent, known ? LEAGUE_SPARTAN_700_DESCENT[index] : 0);
    }
    return { ascent, descent };
}

/**
 * Reads the top of the line box of one title block, in millimetres inside the title part, so that
 * the ink box of the block stands at the centre of its band (S4, round of 2026-11-11, readers r2c).
 * The line box takes `line-height: 1`, so the baseline lies `(1 - A - D) / 2 + A` em below the top,
 * with the font ascent A and the font descent D of the face.
 * @param text The text of the block.
 * @param fontMm The font size in millimetres.
 * @param bandTopMm The top edge of the band inside the part, in millimetres.
 * @param bandMm The height of the band, in millimetres.
 * @param lines The line count of the block.
 * @returns The top of the line box, in millimetres.
 */
function titleLineTopMm(text: string, fontMm: number, bandTopMm: number, bandMm: number, lines = 1): number {
    const ink = titleInkEm(text);
    const baselineEm =
        (1 - LEAGUE_SPARTAN_700_FONT_ASCENT - LEAGUE_SPARTAN_700_FONT_DESCENT) / 2 +
        LEAGUE_SPARTAN_700_FONT_ASCENT;
    const centreEm = baselineEm + (lines - 1) / 2 - (ink.ascent - ink.descent) / 2;
    return bandTopMm + bandMm / 2 - centreEm * fontMm;
}

/** The padding of the A3 reader plaque on each side of the title, in millimetres (D3). */
const READER_TITLE_PADDING_MM = 27;

/** The font size of the A3 week pill text at the role base of the readers r2c round, in millimetres (D4). */
const READER_PILL_FONT_MM = 4.379;

/**
 * The cap height of the A3 week pill text at `READER_PILL_FONT_MM`, in millimetres (readers r2c): the
 * C1 measure of the first r2c Green run gives 0.7086 x 4.379.
 */
const READER_PILL_CAP_MM = 3.103;

/** The share of the inner height that the week pill and the role bar letters fill (E1, E3). */
const READER_LETTER_FILL_SHARE = 0.8;

/** The inner height of the A3 week pill with the top style hlogo, in millimetres: 10 mm minus 1.2 mm (E1). */
const READER_PILL_INNER_MM = 8.8;

/** The inner height of the A3 role bar with the top style hlogo, in millimetres: 12 mm minus 1.2 mm (E3). */
const READER_BAR_INNER_MM = 10.8;

/**
 * The font size of the A3 week pill text with the top style hlogo, in millimetres (readers r2c, E1). The
 * cap height grows with the font size, so the cap share of the role base scales the font to 80 % of the
 * pill inner height: 4.379 x (0.80 x 8.80 / 3.44) = 8.96 mm.
 */
const READER_PILL_CAP_FONT_MM =
    (READER_PILL_FONT_MM * READER_LETTER_FILL_SHARE * READER_PILL_INNER_MM) / READER_PILL_CAP_MM;

/** The side padding of the A3 week pill with the top style hlogo, in millimetres (readers r2c, E2). */
const READER_PILL_PADDING_MM = 4.65;

/** The centre of the A3 week pill across the page with the top style hlogo, in millimetres (E2). */
const READER_PILL_CENTRE_MM = 340;

/**
 * The vertical shift of the A3 week pill text with the top style hlogo, in millimetres, so that the
 * middle of its cap band sits at the pill centre (E1).
 */
const READER_PILL_TEXT_SHIFT_MM = -0.82;

/** The font size of the A3 role bar label at the role base of the readers r2c round, in millimetres: 15 pt. */
const READER_BAR_LABEL_FONT_MM = (15 * 25.4) / 72;

/** The cap height of the A3 role bar label at `READER_BAR_LABEL_FONT_MM`, in millimetres (readers r2c). */
const READER_BAR_LABEL_CAP_MM = 3.7;

/**
 * The font size of the A3 role bar label with the top style hlogo, in millimetres (readers r2c, E3): 15 pt
 * x (0.80 x 10.80 / 3.70) = 12.36 mm.
 */
const READER_BAR_LETTER_FONT_MM =
    (READER_BAR_LABEL_FONT_MM * READER_LETTER_FILL_SHARE * READER_BAR_INNER_MM) / READER_BAR_LABEL_CAP_MM;

/**
 * The vertical shift of the A3 role bar label with the top style hlogo, in millimetres, so that the
 * middle of its cap band sits at the bar centre (E3).
 */
const READER_BAR_TEXT_SHIFT_MM = -1.02;

/**
 * The vertical shift of the role mark icon of the A3 role bar with the top style hlogo, in
 * millimetres, so that the icon box lies inside the bar inner box (E3).
 */
const READER_BAR_ICON_SHIFT_MM = 0;

/** The side padding of the A3 role bar with the top style hlogo, in millimetres (D4). */
const READER_BAR_PADDING_MM = 6;

/** The height of the leaf title plaque, in millimetres: the top 113 mm and the height 20 mm stay (E4). */
const LEAF_PLAQUE_HEIGHT_MM = 20;

/** The top of the leaf title plaque, in millimetres (E4). */
const LEAF_PLAQUE_TOP_MM = 113;

/** The padding of the leaf title plaque on each side of the title, in millimetres (E4, readers r2c retry). */
const LEAF_PLAQUE_PADDING_MM = 21;

/** The least width of the leaf title plaque, in millimetres (E4). */
const LEAF_PLAQUE_MIN_WIDTH_MM = 110;

/** The most width of the leaf title plaque, in millimetres: the width of the double line frame (E4). */
const LEAF_PLAQUE_MAX_WIDTH_MM = 182;

/** The font size of the leaf title with the top style hlogo, in millimetres (S3, readers r2c). */
const LEAF_TITLE_FONT_MM = titleCapFontMm(LEAF_PLAQUE_HEIGHT_MM - READER_PLAQUE_BAND_INSET_MM);

/** The top of the leaf footer with the top style hlogo, in millimetres (readers r2c, E9). */
const LEAF_FOOTER_TOP_MM = 137;

/** The height of the leaf footer with the top style hlogo, in millimetres (E9). */
const LEAF_FOOTER_HEIGHT_MM = 6;

/** The least width of the A3 reader plaque with the top style hlogo, in millimetres (D3). */
const READER_TITLE_MIN_WIDTH_MM = 120;

/** The most width of the A3 reader plaque with the top style hlogo, in millimetres (D3). */
const READER_TITLE_MAX_WIDTH_MM = 340;

/**
 * The width that a clamped plaque gives back, in millimetres. Chrome measures a 120 mm box a
 * fraction short of 120 mm, so a clamped plaque takes the inner side of its bound.
 */
const READER_PLAQUE_SLOP_MM = 0.4;

/**
 * Every text or face part of every kind, keyed `<kind>:<part>` (pin P3, spec D-A5). The art part is
 * exempt: it covers the page. Every box lies 5 mm inside the trim at bleed 0, and the render moves
 * it by the bleed value (T09). Round 3 of 2026-11-10: the student front and the teacher front hold
 * no game bar, so they hold no game bar box. The reader A3 cover keeps its game bar box. The title
 * plaque of both fronts is 14 mm high and stands at 278 mm to 292 mm from the top edge, clear of
 * the dog of the student front art. Round 5 of 2026-11-10: the Storytime Advantage logo replaces
 * the crest of both fronts, so the 2 crest keys are gone. The publisher mark of both backs stands
 * in the contact sign, left of the QR and under the contact lines. The alternate A2 of 2026-11-10
 * adds one `logo-tile` box to the 2 fronts and the 2 backs: the horizontal logo on its amber tile,
 * the only top chrome of that opt-in style. The A2 r2 change of 2026-11-11 (PM look check) makes
 * the tile narrower, so that the logo fills 80 % of the inner tile both ways: the A2 box of the 2
 * fronts is 167.2 mm by 54 mm at 21.4 mm and 12 mm; the A2 box of the 2 backs is 110.6 mm by 36 mm
 * at 49.7 mm and 7 mm. The round of 2026-11-11 (readers r2b) adds the leaf logo tile of the hlogo
 * leaf cover and widens the leaf series box to 35 mm, so that the series line stays on one line.
 */
export const QUEST_BOXES: Record<string, QuestBox> = {
    'student-front:series-logo': { kind: 'student-front', leftMm: 90, topMm: 14, widthMm: 30, heightMm: 30 },
    'student-front:series-banner': { kind: 'student-front', leftMm: 22, topMm: 48, widthMm: 166, heightMm: 38 },
    'student-front:logo-tile': { kind: 'student-front', leftMm: 21.4, topMm: 12, widthMm: 167.2, heightMm: 54 },
    'student-front:title-plaque': { kind: 'student-front', leftMm: 26, topMm: 278, widthMm: 158, heightMm: 14 },
    'teacher-front:series-logo': { kind: 'teacher-front', leftMm: 90, topMm: 14, widthMm: 30, heightMm: 30 },
    'teacher-front:series-banner': { kind: 'teacher-front', leftMm: 22, topMm: 48, widthMm: 166, heightMm: 38 },
    'teacher-front:logo-tile': { kind: 'teacher-front', leftMm: 21.4, topMm: 12, widthMm: 167.2, heightMm: 54 },
    'teacher-front:title-plaque': { kind: 'teacher-front', leftMm: 26, topMm: 278, widthMm: 158, heightMm: 14 },
    'teacher-front:band-pill': { kind: 'teacher-front', leftMm: 83, topMm: 271.5, widthMm: 44, heightMm: 9 },
    'student-back:logo-box': { kind: 'student-back', leftMm: 10, topMm: 9, widthMm: 34, heightMm: 34 },
    'student-back:series-banner': { kind: 'student-back', leftMm: 52, topMm: 14, widthMm: 146, heightMm: 22 },
    'student-back:logo-tile': { kind: 'student-back', leftMm: 49.7, topMm: 7, widthMm: 110.6, heightMm: 36 },
    'student-back:panel': { kind: 'student-back', leftMm: 12, topMm: 48, widthMm: 186, heightMm: 142 },
    'student-back:contact-sign': { kind: 'student-back', leftMm: 12, topMm: 200, widthMm: 186, heightMm: 80 },
    'student-back:qr': { kind: 'student-back', leftMm: 141, topMm: 205, widthMm: 50, heightMm: 50 },
    'student-back:line-label': { kind: 'student-back', leftMm: 141, topMm: 259, widthMm: 50, heightMm: 8 },
    'student-back:publisher-mark': {
        kind: 'student-back',
        leftMm: 71,
        topMm: PUBLISHER_MARK_TOP_MM,
        widthMm: 14,
        heightMm: 14,
    },
    'teacher-back:logo-box': { kind: 'teacher-back', leftMm: 10, topMm: 9, widthMm: 34, heightMm: 34 },
    'teacher-back:series-banner': { kind: 'teacher-back', leftMm: 52, topMm: 14, widthMm: 146, heightMm: 22 },
    'teacher-back:logo-tile': { kind: 'teacher-back', leftMm: 49.7, topMm: 7, widthMm: 110.6, heightMm: 36 },
    'teacher-back:contact-sign': { kind: 'teacher-back', leftMm: 12, topMm: 200, widthMm: 186, heightMm: 80 },
    'teacher-back:qr': { kind: 'teacher-back', leftMm: 141, topMm: 205, widthMm: 50, heightMm: 50 },
    'teacher-back:line-label': { kind: 'teacher-back', leftMm: 141, topMm: 259, widthMm: 50, heightMm: 8 },
    'teacher-back:publisher-mark': {
        kind: 'teacher-back',
        leftMm: 71,
        topMm: PUBLISHER_MARK_TOP_MM,
        widthMm: 14,
        heightMm: 14,
    },
    'reader-a3:game-bar': { kind: 'reader-a3', leftMm: 14, topMm: 12, widthMm: 150, heightMm: 15 },
    'reader-a3:band-word': { kind: 'reader-a3', leftMm: 78, topMm: 14, widthMm: 30, heightMm: 11 },
    'reader-a3:series-banner': { kind: 'reader-a3', leftMm: 274, topMm: 12, widthMm: 132, heightMm: 20 },
    'reader-a3:week-pill': { kind: 'reader-a3', leftMm: 322, topMm: 35, widthMm: 36, heightMm: 10 },
    'reader-a3:title-plaque': { kind: 'reader-a3', leftMm: 100, topMm: 236, widthMm: 220, heightMm: 40 },
    'reader-a3:role-bar': { kind: 'reader-a3', leftMm: 150, topMm: 278, widthMm: 120, heightMm: 12 },
    'reader-a3:logo-tile': { kind: 'reader-a3', leftMm: 126.4, topMm: 12, widthMm: 167.2, heightMm: 54 },
    'reader-leaf:double-line-frame': { kind: 'reader-leaf', leftMm: 8, topMm: 7, widthMm: 182, heightMm: 104 },
    'reader-leaf:logo-tile': { kind: 'reader-leaf', leftMm: 59.6, topMm: 5.7, widthMm: 78.8, heightMm: 25.5 },
    'reader-leaf:title-plaque': { kind: 'reader-leaf', leftMm: 44, topMm: 113, widthMm: 110, heightMm: 20 },
    'reader-leaf:band-word': { kind: 'reader-leaf', leftMm: 47, topMm: 137, widthMm: 20, heightMm: 6 },
    'reader-leaf:series': { kind: 'reader-leaf', leftMm: 68, topMm: 137, widthMm: 35, heightMm: 6 },
    'reader-leaf:week': { kind: 'reader-leaf', leftMm: 104, topMm: 137, widthMm: 18, heightMm: 6 },
    'reader-leaf:role-mark': { kind: 'reader-leaf', leftMm: 122, topMm: 136, widthMm: 52, heightMm: 7 },
};

/** The art file names of one book row of `quest.json`. */
export interface QuestArtNames {
    /** The student front art. */
    studentFront: string;
    /** The back art. */
    back: string;
    /** The teacher front art. */
    teacherFront: string;
}

/** The cast of one book row of `quest.json` (spec D-A7). */
export interface QuestCast {
    /** The student front cast: at most 2 children and 1 animal. */
    studentFront: string[];
    /** The teacher front cast: at most 2 children, plus the teacher. */
    teacherFront: string[];
}

/** One book row of `quest.json`. */
export interface QuestBookRow {
    /** The level, 1 to 4. */
    level: number;
    /** The unit, 1 to 4. */
    unit: number;
    /** The lit band, lower case (pin P11). */
    litBand: string;
    /** The art file names (spec D-A8). */
    art: QuestArtNames;
    /** The cast of the fronts. */
    cast: QuestCast;
}

/** The data file `content/storytime/covers/quest.json` (spec D-A1). */
export interface QuestData {
    /** The series name. */
    series: string;
    /** The name kinds of the cast roster. */
    roster: Record<string, string>;
    /** The book rows. */
    books: QuestBookRow[];
}

/** One reader row of `questReaders()` (spec FR-9.3). */
export interface QuestReaderRow {
    /** The title of the week book. */
    title: string;
    /** The kind of the week book. */
    kind: string;
    /** The week number. */
    week: number;
    /** `Week <n>`. */
    weekText: string;
    /** The band of the week, lower case. */
    litBand: string;
    /** The role label of the cover. */
    roleLabel: string;
    /** The level of the week. */
    level: number;
    /** The picture slug, for example `nan-can-nod`. */
    slug: string;
    /** The cover picture rows of `pictures.json`. */
    picture: { fileName: string; lineArtFileName: string };
}

/** One panel value of the back (the shape of `storytimeCoverPanelValues`). */
export interface QuestPanelValue {
    /** The field key. */
    field: string;
    /** The rendered value. */
    value: string;
    /** The items behind the value. */
    items: string[];
}

/** The assets of one render. */
export interface QuestRenderAssets {
    /** The URL of the art, `file://` or `data:`. */
    art?: string;
    /**
     * The URL of the company logo. Round 5 of 2026-11-10: the backs no longer show this field, and
     * the Storytime Advantage logo of `seriesLogo` takes its place. The field stays for the caller
     * of the older covers of `covers.ts`; a value is escaped and never printed.
     */
    logo?: string;
    /**
     * The URL of the Storytime Advantage logo of the 2 fronts and of the 2 back logo boxes. The
     * default is `content/storytime/covers/logos/storytime-advantage.svg`.
     */
    seriesLogo?: string;
    /**
     * The URL of the Reading Advantage logo, the publisher mark of the contact sign of both backs.
     * The default is `content/storytime/covers/logos/reading-advantage.svg`.
     */
    publisherLogo?: string;
    /** The five panel values of a student back. */
    panelValues?: QuestPanelValue[];
}

/**
 * The top chrome style of the 2 fronts and the 2 backs (the alternate A2 of 2026-11-10).
 * `banner` is the r5 style and the default: the Storytime Advantage logo in its square tile and the
 * series banner with the name. `hlogo` is the alternate A2: the horizontal logo on its amber tile
 * is the only top chrome, and no part repeats the series name. The round of 2026-11-11 (readers
 * r2b): the 2 readers take the option too, and with `hlogo` their chrome takes the logo colors and
 * the leaf holds the K logo tile.
 */
export type QuestTopStyle = 'banner' | 'hlogo';

/** The options of one render. */
export interface QuestRenderOptions {
    /**
     * The leaf mark text of a reader leaf page 1 (the Q5 decision of 2026-11-12): the text
     * `<reader title> \u00b7 leaf <n> of <m>`. When it is set, the quest leaf body draws one
     * `[data-part="leaf-mark"]` inside its white footer strip, and the strip grows to hold the mark
     * ink with 1 mm around it. When it is absent, the body is unchanged.
     */
    leafMark?: string;
    /** The bleed in millimetres: 0 or 3 (spec D-A5). */
    bleedMm: number;
    /** The top chrome style: `banner` (the default, r5) or `hlogo` (the alternate A2 of 2026-11-10). */
    top?: QuestTopStyle;
}

/** A trim in millimetres. */
export interface QuestTrim {
    /** The width. */
    widthMm: number;
    /** The height. */
    heightMm: number;
}

/** The result of a QR check. */
export interface QuestQrCheck {
    /** The module count of the code. */
    modules: number;
    /** The dark module count. */
    dark: number;
    /** The modules that differ from the encoder grid. */
    different: number;
    /** The errors. */
    errors: string[];
}

/** The result of an art ppi check. */
export interface QuestArtCheck {
    /** The measured ppi (from the width). */
    ppi: number;
    /** The minimum ppi of the kind. */
    minPpi: number;
    /** The errors. */
    errors: string[];
}

/** The module folder. */
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

/** The repository root. */
const REPO_ROOT = path.resolve(MODULE_DIR, '..', '..', '..', '..');

/** The folder of the 2 approved logo files (round 5 of 2026-11-10). */
const LOGO_DIR = path.join(REPO_ROOT, 'content', 'storytime', 'covers', 'logos');

/** The file of the Storytime Advantage logo. */
const SERIES_LOGO_FILE = path.join(LOGO_DIR, 'storytime-advantage.svg');

/** The file of the Reading Advantage logo, the publisher mark of the backs. */
const PUBLISHER_LOGO_FILE = path.join(LOGO_DIR, 'reading-advantage.svg');

/** The URL of the Storytime Advantage logo, the default `seriesLogo` of every render. */
const SERIES_LOGO_URL = storytimeCoverFileUrl(SERIES_LOGO_FILE);

/** The URL of the Reading Advantage logo, the default `publisherLogo` of every render. */
const PUBLISHER_LOGO_URL = storytimeCoverFileUrl(PUBLISHER_LOGO_FILE);

/**
 * The file of the horizontal Storytime Advantage logo (the alternate A2 of 2026-11-10). The file is
 * a byte copy of `advantage-pr/assets/logos/vector/horizontal/storytime-advantage.svg`, SHA-256
 * 3b9f8f4334ae316d9f0061b7b2707b07433b0eecd8ac0adddba0a68d9a3bb9cc.
 */
const HORIZONTAL_LOGO_FILE = path.join(LOGO_DIR, 'storytime-advantage-horizontal.svg');

/**
 * The URL of the horizontal Storytime Advantage logo, the colour logo of the book backs and of the
 * page 12 of the reader A3 pages (round of 2026-11-11, F2).
 */
export const HORIZONTAL_LOGO_URL = storytimeCoverFileUrl(HORIZONTAL_LOGO_FILE);

/**
 * The file of the gray horizontal logo, the K logo of the leaf cover (round of 2026-11-11, readers
 * r2b). The committed script `make-k-logo-r2b.py` writes it from the color logo: every color
 * becomes the gray of the same luminance.
 */
const K_LOGO_FILE = path.join(LOGO_DIR, 'storytime-advantage-horizontal-k.svg');

/**
 * The URL of the gray horizontal logo, the K logo of the workbook leaves and of the page 12 of the
 * workbook (round of 2026-11-11, F2).
 */
export const K_LOGO_URL = storytimeCoverFileUrl(K_LOGO_FILE);

/** The aspect of the horizontal logo: the viewBox of 1461.6 mm by 464.88 mm (A6). */
export const HORIZONTAL_LOGO_ASPECT = 1461.6 / 464.88;

/** The share of the inner tile height that the horizontal logo fills (A6). */
const LOGO_TILE_FILL_SHARE = 0.8;

/** The border width of the logo tile, in millimetres (A6). */
const LOGO_TILE_BORDER_MM = 0.6;

/** The print font folder. */
const PRINT_FONT_DIR = path.resolve(MODULE_DIR, '..', '..', '..', 'assets', 'print-fonts');

/** The data file of the template. */
const QUEST_COVERS_FILE = path.join(REPO_ROOT, 'content', 'storytime', 'covers', 'quest.json');

/** The Storytime content folder. */
const STORYTIME_CONTENT_DIR = path.join(REPO_ROOT, 'content', 'storytime');

/** The approved amber of the option A frame (`options/build.py`, AMBER). */
const AMBER = '#FBBF24';

/** The five frame colours of the option A frame (`options/build.py`, A). */
const A = {
    navy: '#16264A',
    blue: '#2A77B8',
    deep: '#123E73',
    silver: '#E7EEF7',
    steel: '#8FA3BF',
};

/** The two plaque blues of the option A frame (`options/build.py`). */
const PLAQUE_BLUE = '#1F5FA8';

/** The trims of the six kinds (spec FR-9.2). */
const TRIMS: Record<QuestCoverKind, QuestTrim> = {
    'student-front': { widthMm: 210, heightMm: 297 },
    'student-back': { widthMm: 210, heightMm: 297 },
    'teacher-front': { widthMm: 210, heightMm: 297 },
    'teacher-back': { widthMm: 210, heightMm: 297 },
    'reader-a3': { widthMm: 420, heightMm: 297 },
    'reader-leaf': { widthMm: 198, heightMm: 148.5 },
};

/** The panel fields of the back, in their order (spec FR-4.1). */
const PANEL_FIELDS = ['story', 'sounds', 'decodable', 'sight', 'books'] as const;

/** The heading of each panel field, in the panel order. */
const PANEL_HEADINGS: Record<string, string> = {
    story: 'Story',
    sounds: 'Sounds',
    decodable: 'Decodable words',
    sight: 'Sight words',
    books: 'Books',
};

/** The three art fields of a book row, with their side token (spec D-A8). */
const ART_SIDES: Array<[keyof QuestArtNames, string]> = [
    ['studentFront', 'student-front'],
    ['back', 'back'],
    ['teacherFront', 'teacher-front'],
];

/** The allowed keys of the data file, of a row, of the art, and of the cast (strict, T22). */
const TOP_KEYS = new Set(['series', 'roster', 'books']);
const ROW_KEYS = new Set(['level', 'unit', 'litBand', 'art', 'cast']);
const ART_KEYS = new Set<string>(ART_SIDES.map(([key]) => key));
const CAST_KEYS = new Set(['studentFront', 'teacherFront']);
const NAME_KINDS = new Set(['child', 'animal', 'adult']);

/** The exact file name of a reader cover picture: `l2-wNN-cover-<slug>-v1.png`, slug of a to z, 0 to 9, and dash (F2). */
const READER_COVER_NAME = /^l2-w(\d{2})-cover-([a-z0-9-]+)-v1\.png$/;

/** The exact file name of a reader line art picture: `l2-wNN-cover-<slug>-line-v1.png` (F2). */
const READER_LINE_NAME = /^l2-w(\d{2})-cover-([a-z0-9-]+)-line-v1\.png$/;

/** The largest cast list that the data check reads; a longer list is a hostile input (F7). */
const MAX_CAST_NAMES = 8;

/** The zero-width characters of the Thai check: a back page may not hide a Thai letter with them (F9, F10). */
const ZERO_WIDTH = /[\u200b\u200c\u200d\u2060\ufeff]/g;

/** The characters that print as nothing: every Unicode default-ignorable code point and U+00AD (F14). */
const INVISIBLE = /[\u00ad\p{Default_Ignorable_Code_Point}]/gu;

/** The banned CSS fragments of a PDF/X build (spec FR-6.8, test-strategy F11 and F16). */
const CSS_BANNED = [
    'rgba(',
    'hsla(',
    'opacity',
    'box-shadow',
    'text-shadow',
    'drop-shadow',
    'filter',
    'backdrop',
    'mix-blend',
    'gradient(',
    'blur(',
];

/** The font families that the PDF/X build allows. */
const FONT_FAMILIES = new Set(['andika', 'sarabun', 'league spartan']);

/** The generic families that the PDF/X build allows. */
const GENERIC_FAMILIES = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);

/** The glyph paths of the five bands (`options/build.py`, BAND_PATHS). */
const BAND_PATHS: Record<string, string> = {
    seed: '<path d="M12 4 C17.5 8 17.5 16 12 20 C6.5 16 6.5 8 12 4Z"/><path d="M12 7.5 V16.5" fill="none"/>',
    sprout:
        '<path d="M12 21 V12" fill="none"/><path d="M12 13 C8 13 4.5 10.5 4.5 6 C9 6 12 9 12 13Z"/><path d="M12 11.5 C12 7 15 4 19.5 4 C19.5 8.5 16.5 11.5 12 11.5Z"/>',
    leaf: '<path d="M5 19.5 C5 10 11 4 20 4 C20 13.5 14 19.5 5 19.5Z"/><path d="M5 19.5 L14.5 10" fill="none"/>',
    bud: '<path d="M12 21 V14" fill="none"/><path d="M12 3.5 C16.5 6.5 16.5 12 12 14.5 C7.5 12 7.5 6.5 12 3.5Z"/><path d="M12 18 C9.5 18 7.5 16.5 7 14.5 C9.5 14.5 11.5 16 12 18Z"/>',
    flower:
        '<circle cx="12" cy="6.8" r="3.6"/><circle cx="16.95" cy="10.39" r="3.6"/><circle cx="15.06" cy="16.21" r="3.6"/><circle cx="8.94" cy="16.21" r="3.6"/><circle cx="7.05" cy="10.39" r="3.6"/><circle cx="12" cy="12" r="3" class="mid"/>',
};

/** The step icons of the role mark, as drawn in `content/storytime/l2/step-icon-<name>.svg`. */
const STEP_ICONS: Record<string, string> = {
    ear: '<path d="M9.5 19.5 C7 18.5 6 15.5 6 12 C6 7.5 8.5 4.5 12 4.5 C15.5 4.5 18 7 18 10.5 C18 13.5 15.5 14.5 14.5 16.5 C13.6 18.3 12.5 20 10.8 20 C10.3 20 9.9 19.8 9.5 19.5 Z"/><path d="M9.5 11 C9.5 9.2 10.6 8 12 8 C13.4 8 14.5 9.1 14.5 10.5 C14.5 12 13 12.4 12.4 13.6"/>',
    read: '<path d="M3 8 C5.5 4.2 9 3 12 3 C15 3 18.5 4.2 21 8 C18.5 11.8 15 13 12 13 C9 13 5.5 11.8 3 8 Z"/><circle class="quest-icon-dot" cx="12" cy="8" r="2.2"/><path d="M4 18.5 H20"/><path d="M12.6 22.5 V17.2 C12.6 15.9 14.8 15.9 14.8 17.2 V22.5"/>',
    mouth:
        '<path d="M3.5 12 C6 8 9 8.2 12 9.8 C15 8.2 18 8 20.5 12 C18 16.8 15 17.8 12 17.8 C9 17.8 6 16.8 3.5 12 Z"/><path d="M3.5 12 C8 13.4 16 13.4 20.5 12"/>',
};

/** The icons of each role label. */
const ROLE_ICONS: Record<string, string[]> = {
    listen: ['ear', 'read'],
    sound: ['read', 'mouth'],
    firstSound: ['ear', 'mouth'],
};

/** One raw week file, read without the schema. */
interface RawWeekFile {
    meta: { level: number; week: number; band: string };
    books: Array<{ title: string; kind: string; soundBook?: boolean }>;
}

/** One raw cover picture row of `pictures.json`. */
interface RawPictureRow {
    week: number;
    text: string;
    use: string;
    fileName: string;
    lineArtFileName: string;
}

/**
 * Formats a number with at most two decimals, without trailing zeros.
 * @param value The number.
 * @returns The text.
 */
function f2(value: number): string {
    return String(Number(value.toFixed(2)));
}

/**
 * Formats a millimetre value.
 * @param value The number of millimetres.
 * @returns The CSS length.
 */
function mm(value: number): string {
    return `${String(Number(value.toFixed(4)))}mm`;
}

/**
 * Escapes one text for the HTML, once: `&`, `<`, `>`, `"`, and `'`.
 * @param text The text.
 * @returns The escaped text.
 */
function esc(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Tells when a value is a plain object.
 * @param value The value.
 * @returns True for an object that is not an array and not null.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads the boxes of one kind.
 * @param kind The cover kind.
 * @returns The box of the part.
 */
function boxOf(kind: QuestCoverKind, part: string): QuestBox {
    return QUEST_BOXES[`${kind}:${part}`];
}

/**
 * The inline position of one box at the bleed value. The left and top values move by the bleed
 * (pin P2, T09).
 * @param box The box.
 * @param bleedMm The bleed.
 * @returns The inline style.
 */
function boxStyle(box: QuestBox, bleedMm: number): string {
    return `position:absolute;left:${mm(box.leftMm + bleedMm)};top:${mm(box.topMm + bleedMm)};width:${mm(box.widthMm)};height:${mm(box.heightMm)}`;
}

/**
 * The size of one page: the trim plus two bleeds (spec FR-9.2, pin P10).
 * @param kind The cover kind.
 * @param bleedMm The bleed: 0 or 3.
 * @returns The page size.
 * @throws Error When the bleed is not 0 or 3.
 */
export function questPageSize(kind: QuestCoverKind, bleedMm: number): QuestTrim {
    if (bleedMm !== 0 && bleedMm !== 3) {
        throw new Error(`the bleed ${bleedMm} mm is not 0 mm or 3 mm`);
    }
    const trim = TRIMS[kind];
    if (!trim) throw new Error(`unknown cover kind "${String(kind)}"`);
    return { widthMm: trim.widthMm + 2 * bleedMm, heightMm: trim.heightMm + 2 * bleedMm };
}

/**
 * Loads the template data file.
 * @param file The data file; the shipped `content/storytime/covers/quest.json` by default.
 * @returns The data.
 */
export function loadQuestCovers(file: string = QUEST_COVERS_FILE): QuestData {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as QuestData;
}

/**
 * Checks one art file name against the pattern of its side (spec D-A8, T22). The name holds no
 * path: no parent folder, no absolute path, no NUL byte, and the `.png` extension.
 * @param name The name.
 * @param unit The unit.
 * @param side The side token.
 * @returns The errors.
 */
function checkArtName(name: unknown, unit: number, side: string): string[] {
    const expected = `l2-u${unit}-cover-quest-${side}-v1-300ppi.png`;
    if (typeof name !== 'string' || !name) return [`the art name is missing (expected "${expected}")`];
    if (name.includes('\u0000')) return [`the art name holds a NUL byte`];
    if (name.includes('..') || name.includes('/') || name.includes('\\') || path.isAbsolute(name)) {
        return [`the art name "${name}" holds a path (expected "${expected}")`];
    }
    if (!name.endsWith('.png')) return [`the art name "${name}" is not a .png file (expected "${expected}")`];
    if (name !== expected) return [`the art name "${name}" is not the name of the ${side} side (expected "${expected}")`];
    return [];
}

/**
 * Checks the cast of one front: the names sit in the roster, the student front holds at most 2
 * children, 1 animal, and no adult, and the teacher front holds at most 2 children and exactly 1
 * adult (spec D-A7, T22, review C F2, F7). A list above the bound is refused before the loop.
 * @param list The cast list.
 * @param roster The roster: name to kind.
 * @param teachers True for the teacher front.
 * @returns The errors.
 */
function checkCastList(list: unknown, roster: Map<string, string>, teachers: boolean): string[] {
    if (!Array.isArray(list)) return ['the cast is not an array'];
    const errors: string[] = [];
    if (list.length > MAX_CAST_NAMES) {
        return [`the cast holds ${list.length} names (at most ${MAX_CAST_NAMES})`];
    }
    const counts: Record<string, number> = { child: 0, animal: 0, adult: 0 };
    for (const name of list) {
        const kind = typeof name === 'string' ? roster.get(name) : undefined;
        if (!kind) {
            errors.push(`the cast name "${String(name)}" is not in the roster`);
            continue;
        }
        counts[kind] = (counts[kind] ?? 0) + 1;
    }
    if (counts.child > 2) errors.push(`the cast holds ${counts.child} children (at most 2)`);
    if (!teachers && counts.animal > 1) errors.push(`the cast holds ${counts.animal} animals (at most 1)`);
    if (teachers) {
        if (counts.adult !== 1) errors.push(`the teacher front holds ${counts.adult} adults (exactly 1)`);
    } else if (counts.adult > 0) {
        errors.push(`the student front holds ${counts.adult} adults (none)`);
    }
    return errors;
}

/**
 * Checks the template data (spec D-A1, T22). The check is strict: an unknown key, a level or a unit
 * outside 1 to 4, a repeated row, a band that is not lower case, an art name that is not the name of
 * its side, a cast above its limits, and a cast name outside the roster are errors. Every error
 * names its field.
 * @param data The data.
 * @returns The errors (empty when the data is good).
 */
export function checkQuestCoverData(data: unknown): string[] {
    const errors: string[] = [];
    if (!isPlainObject(data)) return ['quest.json: the data is not an object'];
    for (const key of Object.keys(data)) {
        if (!TOP_KEYS.has(key)) errors.push(`quest.json holds an unknown key "${key}"`);
    }
    if (typeof data.series !== 'string' || !data.series.trim()) errors.push('quest.json.series is missing or empty');
    const roster = new Map<string, string>();
    if (!isPlainObject(data.roster)) {
        errors.push('quest.json.roster is not an object');
    } else {
        for (const [name, kind] of Object.entries(data.roster)) {
            if (typeof kind !== 'string' || !NAME_KINDS.has(kind)) {
                errors.push(`quest.json.roster["${name}"] is not child, animal, or adult`);
                continue;
            }
            roster.set(name, kind);
        }
    }
    if (!Array.isArray(data.books)) {
        errors.push('quest.json.books is not an array');
        return errors;
    }
    if (!data.books.length) {
        errors.push('quest.json.books is empty');
        return errors;
    }
    const rows = new Set<string>();
    data.books.forEach((row, index) => {
        const at = `quest.json.books[${index}]`;
        if (!isPlainObject(row)) {
            errors.push(`${at} is not an object`);
            return;
        }
        for (const key of Object.keys(row)) {
            if (!ROW_KEYS.has(key)) errors.push(`${at} holds an unknown key "${key}"`);
        }
        const level = row.level;
        const unit = row.unit;
        const levelOk = typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= 4;
        const unitOk = typeof unit === 'number' && Number.isInteger(unit) && unit >= 1 && unit <= 4;
        if (!levelOk) errors.push(`${at}.level "${String(level)}" is not an integer from 1 to 4`);
        if (!unitOk) errors.push(`${at}.unit "${String(unit)}" is not an integer from 1 to 4`);
        if (levelOk && unitOk) {
            const key = `${String(level)}/${String(unit)}`;
            if (rows.has(key)) errors.push(`${at}: the level ${String(level)} unit ${String(unit)} row appears twice`);
            rows.add(key);
        }
        const band = row.litBand;
        if (typeof band !== 'string' || !(QUEST_BANDS as readonly string[]).includes(band)) {
            errors.push(`${at}.litBand "${String(band)}" is not one of the five bands in lower case`);
        }
        if (!isPlainObject(row.art)) {
            errors.push(`${at}.art is not an object`);
        } else {
            for (const key of Object.keys(row.art)) {
                if (!ART_KEYS.has(key)) errors.push(`${at}.art holds an unknown key "${key}"`);
            }
            for (const [key, side] of ART_SIDES) {
                const problems = checkArtName(row.art[key], unitOk ? (unit as number) : 0, side);
                for (const problem of problems) errors.push(`${at}.art.${key}: ${problem}`);
            }
        }
        if (!isPlainObject(row.cast)) {
            errors.push(`${at}.cast is not an object`);
        } else {
            for (const key of Object.keys(row.cast)) {
                if (!CAST_KEYS.has(key)) errors.push(`${at}.cast holds an unknown key "${key}"`);
            }
            for (const key of ['studentFront', 'teacherFront'] as const) {
                const problems = checkCastList(row.cast[key], roster, key === 'teacherFront');
                for (const problem of problems) errors.push(`${at}.cast.${key}: ${problem}`);
            }
        }
    });
    return errors;
}

/**
 * The role label of one week book, by the rule of `print/readers.ts` (spec FR-9.3): a decodable
 * sound book is a listen-and-read book, another sound book says "Say the first sound.", a
 * decodable book says "Sound it out.", and the rest say "Listen and read.".
 * @param book The week book.
 * @returns The role key.
 */
function roleKeyOf(book: { kind: string; soundBook?: boolean }): 'listen' | 'sound' | 'firstSound' {
    const decodable = book.kind === 'decodable';
    if (book.soundBook && decodable) return 'listen';
    if (book.soundBook) return 'firstSound';
    if (decodable) return 'sound';
    return 'listen';
}

/**
 * The file of one shipped week.
 * @param week The week number.
 * @returns The file path.
 */
function weekFileOf(week: number): string {
    return path.join(STORYTIME_CONTENT_DIR, 'l2', `w${String(week).padStart(2, '0')}.json`);
}

/**
 * Reads the cover picture rows of `pictures.json`.
 * @returns The rows with the use `cover`.
 */
function readCoverPictures(): RawPictureRow[] {
    const file = path.join(STORYTIME_CONTENT_DIR, 'l2', 'print', 'pictures.json');
    const rows = JSON.parse(fs.readFileSync(file, 'utf8')) as RawPictureRow[];
    return rows.filter((row) => row.use === 'cover');
}

/**
 * The 14 reader covers of Level 2, weeks 1 to 7, two per week (spec FR-9.3, T15). The cover name
 * and the line art name of `pictures.json` must be the exact names of the week and a slug of
 * lower case letters, digits, and dashes (F2). A name with a path, or any other name, is an error.
 * @returns The reader rows.
 * @throws Error When a week book has no cover picture row, or a name is not the exact name.
 */
export function questReaders(): QuestReaderRow[] {
    const pictures = readCoverPictures();
    const rows: QuestReaderRow[] = [];
    for (let week = 1; week <= 7; week++) {
        const raw = JSON.parse(fs.readFileSync(weekFileOf(week), 'utf8')) as RawWeekFile;
        const weekCode = String(week).padStart(2, '0');
        for (const book of raw.books) {
            const cover = pictures.find((row) => row.week === week && row.text === book.title);
            if (!cover) throw new Error(`pictures.json has no cover row for week ${week} "${book.title}"`);
            const name = READER_COVER_NAME.exec(String(cover.fileName));
            if (!name || name[1] !== weekCode) {
                throw new Error(
                    `pictures.json week ${week} "${book.title}": the cover file name "${String(cover.fileName)}" ` +
                        `is not "l2-w${weekCode}-cover-<slug>-v1.png"`,
                );
            }
            const slug = name[2];
            const line = READER_LINE_NAME.exec(String(cover.lineArtFileName));
            if (!line || line[1] !== weekCode || line[2] !== slug) {
                throw new Error(
                    `pictures.json week ${week} "${book.title}": the line art file name "${String(cover.lineArtFileName)}" ` +
                        `is not "l2-w${weekCode}-cover-${slug}-line-v1.png"`,
                );
            }
            rows.push({
                title: book.title,
                kind: book.kind,
                week,
                weekText: `Week ${week}`,
                litBand: raw.meta.band.toLowerCase(),
                roleLabel: QUEST_ROLE_LABELS[roleKeyOf(book)],
                level: raw.meta.level,
                slug,
                picture: { fileName: cover.fileName, lineArtFileName: cover.lineArtFileName },
            });
        }
    }
    return rows;
}

/**
 * The copy check of one page (spec FR-4, FR-10.1, FR-10.3): the series name, no forbidden word,
 * and no year. It shares the rule of the approved covers. The check reads the page twice: once as
 * it stands, and once with a case boundary as a space, because a `<wbr>` or a soft-hyphen break can
 * join two words with no space (F8). The characters that print as nothing come out before both
 * reads (F9, F14), and the reads use the NFKC form, so a compatibility spelling of a forbidden word
 * is caught too (F15). The NFKC form is for the check only: this function returns errors and never
 * text, so no Thai page text passes through NFKC on its way to the page.
 * @param pageText The text of the page.
 * @returns The errors.
 */
export function checkQuestCopy(pageText: string): string[] {
    // A `<wbr>` or a soft-hyphen break splits a word on the page, and the DOM text of the page can
    // then join the two parts with no space ("AdvantageChibi"). The change of case is the word
    // boundary that the page shows, so the check reads that form too (T11).
    const plain = pageText.replace(INVISIBLE, '');
    const text = plain.normalize('NFKC').replace(INVISIBLE, '');
    const spaced = text.replace(/([a-z])([A-Z])/g, '$1 $2');
    return [...new Set([...checkStorytimeCoverCopy(text), ...checkStorytimeCoverCopy(spaced)])];
}

/**
 * The Thai check of one page (spec FR-10.2): the two backs hold the Thai of `BACK_LINES.contact`
 * byte for byte, and the fronts and the reader covers hold no Thai. A back page that holds a
 * zero-width character is an error, because the shared check reads the Thai letters only (F10).
 * @param pageText The text of the page.
 * @param kind The cover kind.
 * @returns The errors.
 */
export function checkQuestThai(pageText: string, kind: QuestCoverKind): string[] {
    const back = kind === 'student-back' || kind === 'teacher-back';
    const errors = checkStorytimeCoverThai(pageText, back ? 'back' : 'front');
    if (back) {
        const marks = pageText.match(ZERO_WIDTH);
        if (marks) errors.push(`the back page holds ${marks.length} zero-width characters`);
    }
    return errors;
}

/**
 * The QR check of one back (spec FR-6.5, FR-9.4, T13): the printed grid is a QR grid of at least
 * 21 modules, it holds dark modules, and it equals the grid of the LINE encoder.
 * @param qrSvg The SVG of the printed code.
 * @returns The counts and the errors.
 */
export function checkQuestQr(qrSvg: string): QuestQrCheck {
    const grid = storytimeCoverQrGrid(qrSvg);
    const expected = storytimeCoverQrGrid(storytimeCoverQrSvg());
    const different = checkStorytimeCoverQr(grid.cells, expected.cells);
    const errors: string[] = [];
    if (grid.modules < 21) errors.push(`the QR grid holds ${grid.modules} modules (at least 21)`);
    if (grid.dark === 0) errors.push('the QR grid holds no dark module');
    if (different > 0) errors.push(`the QR grid differs from the LINE code in ${different} modules`);
    return { modules: grid.modules, dark: grid.dark, different, errors };
}

/**
 * The art ppi check of one page (spec FR-8.3, FR-9.4, pin P10): the ppi of the art is
 * `widthPx / ((trimMm + 2 * bleedMm) / 25.4)`. The A4 fronts, the backs, and the leaf need 299
 * ppi; the A3 reader art needs 240.
 * @param input The kind, the pixel size of the art, and the bleed.
 * @returns The measured ppi, the minimum, and the errors.
 */
export function checkQuestArt(input: {
    kind: QuestCoverKind;
    widthPx: number;
    heightPx: number;
    bleedMm: number;
}): QuestArtCheck {
    const trim = TRIMS[input.kind] ?? TRIMS['student-front'];
    const bleed = input.bleedMm === 3 ? 3 : 0;
    const minPpi = input.kind === 'reader-a3' ? 240 : 299;
    const widthInches = (trim.widthMm + 2 * bleed) / 25.4;
    const heightInches = (trim.heightMm + 2 * bleed) / 25.4;
    const ppi = input.widthPx / widthInches;
    const heightPpi = input.heightPx / heightInches;
    const errors: string[] = [];
    if (ppi < minPpi) {
        errors.push(`the art is ${ppi.toFixed(1)} ppi wide at bleed ${bleed} mm (at least ${minPpi})`);
    }
    if (heightPpi < minPpi) {
        errors.push(`the art is ${heightPpi.toFixed(1)} ppi high at bleed ${bleed} mm (at least ${minPpi})`);
    }
    return { ppi, minPpi, errors };
}

/**
 * The lit band check of one page (spec FR-6.4, T04): exactly one band icon carries
 * `data-lit="true"`, and it is the band of the book. Round 3 of 2026-11-10: the student front and
 * the teacher front hold no game bar, so they hold no band icon. A page with no game bar passes
 * this check: it has no band icon to light, and the teacher front shows its band on the band pill.
 * A page with a game bar is checked as before, so a reader A3 cover with no lit icon still fails.
 * @param html The rendered page.
 * @param band The band of the book.
 * @returns The errors.
 */
export function checkQuestLitBand(html: string, band: string): string[] {
    if (!html.includes('data-part="game-bar"')) return [];
    const tags = html.match(/<[^>]*data-part="band-icon"[^>]*>/g) ?? [];
    const lit = tags.filter((tag) => /data-lit="true"/.test(tag));
    if (lit.length !== 1) return [`the page lights ${lit.length} band icons (exactly one)`];
    const found = /data-band="([^"]+)"/.exec(lit[0])?.[1] ?? '';
    if (found !== band) return [`the page lights the band "${found}", not "${band}"`];
    return [];
}

/**
 * The page size check of one page (spec FR-9.2, T08). It never throws.
 * @param html The rendered page.
 * @param kind The cover kind.
 * @param bleedMm The bleed: 0 or 3.
 * @returns The errors.
 */
export function checkQuestPageSize(html: string, kind: QuestCoverKind, bleedMm: number): string[] {
    const errors: string[] = [];
    if (bleedMm !== 0 && bleedMm !== 3) errors.push(`the bleed ${bleedMm} mm is not 0 mm or 3 mm`);
    const trim = TRIMS[kind] ?? TRIMS['student-front'];
    const width = trim.widthMm + 2 * bleedMm;
    const height = trim.heightMm + 2 * bleedMm;
    const rule = /@page[^{]*\{([^}]*)\}/.exec(html);
    if (!rule) {
        errors.push('the page holds no @page rule');
        return errors;
    }
    const size = /size:\s*([0-9.]+)mm\s+([0-9.]+)mm/.exec(rule[1]);
    if (!size) {
        errors.push('the @page rule holds no size in millimetres');
        return errors;
    }
    if (Math.abs(Number(size[1]) - width) > 0.01) {
        errors.push(`the page width is ${size[1]} mm, not ${f2(width)} mm`);
    }
    if (Math.abs(Number(size[2]) - height) > 0.01) {
        errors.push(`the page height is ${size[2]} mm, not ${f2(height)} mm`);
    }
    return errors;
}

/**
 * The PDF/X safety check of one CSS text (spec FR-6.8, test-strategy F11 and F16): no
 * transparency, no shadow, no filter, no gradient, no variation font, and only the three approved
 * families. It never throws. The check compares in lower case and reads the alpha forms of the
 * colours, so a spelling with upper case letters or a slash alpha is an error too (F12).
 * @param css The CSS.
 * @returns The errors.
 */
export function questCssSafetyErrors(css: string): string[] {
    const errors: string[] = [];
    const text = css.toLowerCase();
    for (const banned of CSS_BANNED) {
        if (text.includes(banned)) errors.push(`the CSS holds "${banned}"`);
    }
    if (/(?:rgb|hsl)\([^)]*\//.test(text)) errors.push('the CSS holds a slash alpha colour');
    if (/#[0-9a-f]{8}\b/.test(text)) errors.push('the CSS holds an 8 digit hex colour');
    if (/#[0-9a-f]{4}\b/.test(text)) errors.push('the CSS holds a 4 digit hex colour');
    if (/font-weight:\s*\d+\s+\d+/.test(text)) errors.push('the CSS holds a font weight range');
    if (text.includes('font-variation-settings')) errors.push('the CSS holds font-variation-settings');
    for (const rule of css.matchAll(/font-family:\s*([^;}]+)/gi)) {
        for (const raw of rule[1].split(',')) {
            const family = raw.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
            if (!family) continue;
            if (!FONT_FAMILIES.has(family) && !GENERIC_FAMILIES.has(family)) {
                errors.push(`the CSS uses the family "${family}"`);
            }
        }
    }
    return errors;
}

/**
 * Draws one band glyph at a point, at a size in millimetres (`options/build.py`, `band_icon`).
 * @param band The band.
 * @param x The centre x.
 * @param y The centre y.
 * @param size The size.
 * @param fill The glyph fill.
 * @param stroke The glyph stroke.
 * @param mid The middle fill of the flower.
 * @param width The stroke width.
 * @returns The SVG group.
 */
function bandGlyph(band: string, x: number, y: number, size: number, fill: string, stroke: string, mid: string, width: number): string {
    const scale = size / 24;
    const paths = BAND_PATHS[band].replaceAll('class="mid"', `fill="${mid}"`);
    return (
        `<g transform="translate(${f2(x - size / 2)} ${f2(y - size / 2)}) scale(${scale.toFixed(4)})" fill="${fill}" stroke="${stroke}" ` +
        `stroke-width="${String(width)}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`
    );
}

/** The colours of one plaque drawing (round 5 of 2026-11-10). */
interface QuestPlaquePalette {
    /** The fill of the outer shape. */
    outerFill: string;
    /** The stroke of the outer shape. */
    outerStroke: string;
    /** The fill of the middle ring. */
    ringFill: string;
    /** The stroke of the highlight line. */
    highlightStroke: string;
    /** The fill attribute of the highlight line: `fill="none" `, or empty for no attribute. */
    highlightFill: string;
    /** The 2 fills of the upper ornament paths. */
    ornamentFill: [string, string];
    /** The stroke of the 2 upper ornament paths. */
    ornamentStroke: string;
    /** The 2 fills of the diamond halves. */
    diamondFill: [string, string];
}

/**
 * The palette of the reader plaques and of the reader series banner: the present blue frame of the
 * option A plaque, byte for byte, so the reader A3 plaque keeps its pinned bytes (P6).
 */
const PLAQUE_BLUE_PALETTE: QuestPlaquePalette = {
    outerFill: A.silver,
    outerStroke: A.steel,
    ringFill: A.deep,
    highlightStroke: '#5A9AD6',
    highlightFill: '',
    ornamentFill: ['#DCE9F8', '#EAF4FF'],
    ornamentStroke: '#7F9BC0',
    diamondFill: ['#C9DDF4', '#FFFFFF'],
};

/**
 * The palette of the amber plaque of the 2 fronts and of the 2 back series banners (round 5 of
 * 2026-11-10): the tile amber, the mark brown, the cream, and the white of the Storytime Advantage
 * logo. The highlight line is stroke only, so it takes `fill="none"` (a path with no fill
 * attribute gets the black default fill, and C1 refuses it).
 */
const PLAQUE_AMBER_PALETTE: QuestPlaquePalette = {
    outerFill: LOGO_BROWN,
    outerStroke: LOGO_BROWN,
    ringFill: LOGO_CREAM,
    highlightStroke: LOGO_WHITE,
    highlightFill: 'fill="none" ',
    ornamentFill: [LOGO_CREAM, LOGO_WHITE],
    ornamentStroke: LOGO_BROWN,
    // The same amber as the band, in lower case: the band is the only path whose fill attribute
    // equals the `data-plaque-colour` value, the rule that P1 of the plaque fit test reads.
    diamondFill: ['#fcd34d', LOGO_WHITE],
};

/**
 * The palette of the leaf title plaque with the top style hlogo (readers r2c, E5): the K grays of the
 * leaf logo tile. The band is the only path whose fill attribute equals the `data-plaque-colour` value,
 * the rule that P1 of the plaque fit test reads, so the diamond halves take the lower case band gray.
 * The highlight line is stroke only, so it takes `fill="none"`.
 */
const PLAQUE_K_PALETTE: QuestPlaquePalette = {
    outerFill: '#4E4E4E',
    outerStroke: '#4E4E4E',
    ringFill: '#F2F2F2',
    highlightStroke: '#FFFFFF',
    highlightFill: 'fill="none" ',
    ornamentFill: ['#F2F2F2', '#FFFFFF'],
    ornamentStroke: '#4E4E4E',
    diamondFill: ['#d2d2d2', '#FFFFFF'],
};

/** The band fill of the leaf title plaque with the top style hlogo (E5). */
const LEAF_PLAQUE_BAND = '#D2D2D2';

/**
 * Draws the crystal-edged plaque of the option A frame (`options/build.py`, `a_plaque`).
 * @param width The width.
 * @param height The height.
 * @param fill The centre fill.
 * @param compact When true, scales the corner bevel with the height and sets the diamond end
 * ornaments inside the box, for the thin 14 mm plaque of the fronts (round 3 of 2026-11-10).
 * @param palette The colours of the plaque; the blue reader palette by default (round 5 of
 * 2026-11-10). The default gives the present bytes of the reader A3 plaque.
 * @returns The SVG.
 */
function plaqueSvg(
    width: number,
    height: number,
    fill: string,
    compact = false,
    palette: QuestPlaquePalette = PLAQUE_BLUE_PALETTE,
    renderScale = 1,
    crystalInsetMm = 0,
    crystalScale = 1,
): string {
    const c = compact ? Math.min(6, height * 0.15) : 6;
    const shape = (i: number): string =>
        `M${f2(i)} ${f2(c + i)} L${f2(c + i)} ${f2(i)} L${f2(width - c - i)} ${f2(i)} L${f2(width - i)} ${f2(c + i)} ` +
        `L${f2(width - i)} ${f2(height - c - i)} L${f2(width - c - i)} ${f2(height - i)} L${f2(c + i)} ${f2(height - i)} ` +
        `L${f2(i)} ${f2(height - c - i)}Z`;
    const s = Math.min(9, height / 3) * crystalScale;
    const inset = (compact ? s * 1.6 + 1.2 : 0) + crystalInsetMm;
    const crystal = (cx: number, flip: number): string =>
        `<g transform="translate(${f2(cx)} ${f2(height / 2)}) scale(${String(flip)} 1)">` +
        `<path d="M${f2(s * 0.4)} ${f2(-s * 0.45)} L${f2(s * 1.6)} -1 L${f2(s)} 0 L${f2(s * 1.6)} 1 L${f2(s * 0.4)} ${f2(s * 0.45)}" fill="${palette.ornamentFill[0]}" stroke="${palette.ornamentStroke}" stroke-width="0.4"/>` +
        `<path d="M-${f2(s)} 0 L0 -${f2(s)} L${f2(s)} 0 L0 ${f2(s)}Z" fill="${palette.ornamentFill[1]}" stroke="${palette.ornamentStroke}" stroke-width="0.5"/>` +
        `<path d="M-${f2(s)} 0 L0 -${f2(s)} L0 ${f2(s)}Z" fill="${palette.diamondFill[0]}"/><path d="M0 -${f2(s)} L${f2(s)} 0 L0 0Z" fill="${palette.diamondFill[1]}"/></g>`;
    return (
        `<svg viewBox="0 0 ${f2(width)} ${f2(height)}" style="position:absolute;left:0;top:0;width:${mm(width * renderScale)};height:${mm(height * renderScale)}">` +
        `<path d="${shape(0)}" fill="${palette.outerFill}" stroke="${palette.outerStroke}" stroke-width="0.6"/>` +
        `<path d="${shape(1.8)}" fill="${palette.ringFill}"/>` +
        `<path d="${shape(2.8)}" fill="${fill}"/>` +
        `<path d="M${f2(c + 3)} 3.6 L${f2(width - c - 3)} 3.6" ${palette.highlightFill}stroke="${palette.highlightStroke}" stroke-width="0.6"/>` +
        `${crystal(inset, -1)}${crystal(width - inset, 1)}</svg>`
    );
}

/**
 * The advance widths of the League Spartan 700 face, in em units, for the 95 ASCII characters 32 to
 * 126, in code point order (round of 2026-11-11, readers r2b). The table comes from the committed
 * script `measure/runs/storytime_cover_options_20261106/league-spartan-widths-r2b.mjs`, which reads
 * `measureText` of each character at a 1000 px size with kerning off. A title with
 * `font-kerning:none` renders as the sum of its table widths times the font size.
 */
const LEAGUE_SPARTAN_700_ADVANCE: number[] = [
    0.265, 0.3035, 0.4095, 0.665, 0.5595, 0.799, 0.697, 0.242, 0.327, 0.327, 0.415, 0.531, 0.29, 0.378, 0.3035,
    0.496, 0.593, 0.3275, 0.5695, 0.538, 0.526, 0.54, 0.5625, 0.545, 0.561, 0.5625, 0.284, 0.287, 0.545, 0.52,
    0.545, 0.483, 0.7615, 0.6755, 0.559, 0.6445, 0.6005, 0.5345, 0.48, 0.735, 0.6385, 0.2705, 0.4105, 0.579, 0.49,
    0.822, 0.723, 0.742, 0.553, 0.73, 0.5915, 0.5595, 0.51, 0.6365, 0.6745, 0.915, 0.706, 0.6005, 0.63, 0.3605,
    0.496, 0.3605, 0.4215, 0.422, 0.335, 0.5645, 0.5585, 0.426, 0.5585, 0.498, 0.353, 0.5655, 0.554, 0.262, 0.269,
    0.5125, 0.25, 0.811, 0.549, 0.5165, 0.566, 0.566, 0.3965, 0.43, 0.3635, 0.548, 0.547, 0.73, 0.5435, 0.5145,
    0.4495, 0.366, 0.221, 0.3815, 0.5795,
];

/** The advance width of a character outside the ASCII table, in em units (the table average). */
const LEAGUE_SPARTAN_700_FALLBACK = 0.5117;

/**
 * Reads the width of one text in the League Spartan 700 face, from the advance table.
 * @param text The text.
 * @param fontMm The font size in millimetres.
 * @returns The width in millimetres.
 */
function leagueSpartanWidthMm(text: string, fontMm: number): number {
    let total = 0;
    for (const char of text) {
        const index = (char.codePointAt(0) ?? 0) - 32;
        total +=
            index >= 0 && index < LEAGUE_SPARTAN_700_ADVANCE.length
                ? LEAGUE_SPARTAN_700_ADVANCE[index]
                : LEAGUE_SPARTAN_700_FALLBACK;
    }
    return total * fontMm;
}

/**
 * Reads the line count of one title inside one width, by a greedy word wrap on the advance table.
 * @param text The title.
 * @param fontMm The font size in millimetres.
 * @param contentMm The width of the text box in millimetres.
 * @returns The line count, at least 1.
 */
function readerTitleLineCount(text: string, fontMm: number, contentMm: number): number {
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) return 1;
    const spaceMm = leagueSpartanWidthMm(' ', fontMm);
    let lines = 1;
    let widthMm = 0;
    for (const word of words) {
        const wordMm = leagueSpartanWidthMm(word, fontMm);
        if (widthMm === 0) {
            widthMm = wordMm;
        } else if (widthMm + spaceMm + wordMm <= contentMm) {
            widthMm += spaceMm + wordMm;
        } else {
            lines += 1;
            widthMm = wordMm;
        }
    }
    return lines;
}

/**
 * Draws the A3 reader title plaque of the top style hlogo in the r2 book plaque style (round of
 * 2026-11-11, readers r2b): the width follows the title plus 2 x 27 mm between 120 mm and 340 mm,
 * and a title wider than 286 mm wraps at the same font size while the plaque grows upward. The
 * bottom stays at 276 mm and the plaque is centered on the page. The round of 2026-11-11 (readers
 * r2c and the standing rules): the font takes a cap height of 80 % of the band, and the title text
 * box spans the band with one vertical shift so that its ink box stands at the band centre (S3, S4).
 * @param title The title of the reader.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function readerTitlePlaque(title: string, bleedMm: number, placement: QuestChromePlacement | null = null): string {
    const page = questPageSize('reader-a3', bleedMm);
    const scale = placement?.scale ?? 1;
    const crystalInset = scale === 1 ? 0 : -4 * (1 - scale);
    const dxMm = placement?.plaqueDxMm ?? 0;
    const dyMm = placement?.plaqueDyMm ?? 0;
    const fontMm = READER_TITLE_FONT_MM * scale;
    const geometry = readerPlaqueGeometry(title);
    const widthMm = geometry.widthMm * scale;
    const contentMm = geometry.contentMm * scale;
    const paddingMm = READER_TITLE_PADDING_MM * scale;
    const linesMm = geometry.lines;
    const bandMm = geometry.bandMm * scale;
    const heightMm = geometry.heightMm * scale;
    const leftMm = (page.widthMm - widthMm) / 2 + dxMm;
    const topMm = READER_PLAQUE_BOTTOM_MM + dyMm - heightMm;
    const lineTopMm = titleLineTopMm(title, fontMm, PLAQUE_BAND_EDGE_MM * scale, bandMm * linesMm, linesMm);
    return (
        `<div data-part="title-plaque" data-plaque-colour="${LOGO_AMBER}" style="position:absolute;` +
        `left:${mm(leftMm + bleedMm)};top:${mm(topMm + bleedMm)};width:${mm(widthMm)};height:${mm(heightMm)}">` +
        plaqueSvg(geometry.widthMm, geometry.heightMm, LOGO_AMBER, true, PLAQUE_AMBER_PALETTE, scale, crystalInset) +
        `<div class="quest-c" style="position:absolute;left:${mm(paddingMm)};` +
        `top:${mm(lineTopMm)};width:${mm(contentMm)};height:${mm(fontMm * linesMm)};` +
        `white-space:normal;color:${LOGO_BROWN};font-family:'League Spartan';font-weight:700;` +
        `font-size:${mm(fontMm)};line-height:${mm(fontMm)};font-kerning:none">${esc(title)}</div></div>`
    );
}

/**
 * Draws the game bar of the option A frame (`options/build.py`, `a_hud`): the 5 band slots, the
 * unit track, the book mark, and the star. The unit bar of a book side holds 4 parts with
 * `data-filled`; a reader side holds no unit bar. Round 3 of 2026-11-10: the reader A3 cover alone
 * calls this function, so `unit` is null and no unit bar renders. The 2 fronts hold no game bar.
 * @param kind The cover kind.
 * @param litBand The band of the book.
 * @param unit The unit of the book, or null for a reader side.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function gameBar(kind: QuestCoverKind, litBand: string, unit: number | null, bleedMm: number): string {
    const box = boxOf(kind, 'game-bar');
    const width = box.widthMm;
    const height = box.heightMm;
    const middle = height / 2;
    const labelled = unit === null;
    const slots = QUEST_BANDS.map((band, index) => {
        const x = 8 + index * 11.5;
        const lit = band === litBand;
        const ring = lit
            ? { fill: '#2E4C80', stroke: AMBER, width: '0.9', glyph: '#8BD14A', line: '#1B2A4A', mid: '#FFE08A' }
            : { fill: '#22345A', stroke: '#4A6290', width: '0.4', glyph: '#5E7397', line: '#3B4F78', mid: '#7F92B3' };
        return (
            `<g data-part="band-icon" data-band="${band}" data-lit="${lit ? 'true' : 'false'}">` +
            `<circle cx="${f2(x)}" cy="${f2(middle)}" r="4.6" fill="${ring.fill}" stroke="${ring.stroke}" stroke-width="${ring.width}"/>` +
            bandGlyph(band, x, middle, 6.2, ring.glyph, ring.line, ring.mid, 1.2) +
            `</g>`
        );
    }).join('');
    const start = labelled ? 92 : 62;
    const end = width - 22;
    const segment = (end - start) / 4;
    const track =
        `<rect x="${f2(start)}" y="${f2(middle - 2.6)}" width="${f2(end - start)}" height="5.2" rx="2.6" fill="#0E1A33" stroke="#4A6290" stroke-width="0.4"/>`;
    const fill =
        unit === null
            ? `<rect x="${f2(start + 0.6)}" y="${f2(middle - 2)}" width="${f2(segment - 1.2)}" height="4" rx="2" fill="#8BD14A"/>`
            : `<g data-part="unit-bar">` +
              [0, 1, 2, 3].map(
                  (index) =>
                      `<g data-unit-part="${String(index + 1)}" data-filled="${index < unit ? 'true' : 'false'}">` +
                      `<rect class="quest-unit-slot" x="${f2(start + index * segment + 0.6)}" y="${f2(middle - 2)}" width="${f2(segment - 1.2)}" height="4" rx="2"/></g>`,
              ).join('') +
              `</g>`;
    const dividers = [1, 2, 3]
        .map(
            (k) =>
                `<line x1="${f2(start + ((end - start) * k) / 4)}" y1="${f2(middle - 2.6)}" x2="${f2(start + ((end - start) * k) / 4)}" y2="${f2(middle + 2.6)}" stroke="#4A6290" stroke-width="0.4"/>`,
        )
        .join('');
    const book =
        `<g transform="translate(${f2(width - 22)} ${f2(middle - 3.2)})"><path d="M0 1 C2.5 0 4.5 0 6.5 1.4 C8.5 0 10.5 0 13 1 V7 C10.5 6 8.5 6 6.5 7.4 C4.5 6 2.5 6 0 7Z" fill="#F4EBD3" stroke="#8C6A3C" stroke-width="0.4"/><line x1="6.5" y1="1.4" x2="6.5" y2="7.4" stroke="#8C6A3C" stroke-width="0.4"/></g>`;
    const star =
        `<path transform="translate(${f2(width - 4.6)} ${f2(middle)}) scale(0.34)" d="M0 -10 L2.9 -3.1 L10 -3.1 L4.3 1.2 L6.5 8.5 L0 4 L-6.5 8.5 L-4.3 1.2 L-10 -3.1 L-2.9 -3.1Z" fill="${AMBER}" stroke="#B7791F" stroke-width="1"/>`;
    const shell =
        `<rect x="0" y="0" width="${f2(width)}" height="${f2(height)}" rx="${f2(middle)}" fill="${A.silver}" stroke="${A.steel}" stroke-width="0.5"/>` +
        `<rect x="1.3" y="1.3" width="${f2(width - 2.6)}" height="${f2(height - 2.6)}" rx="${f2(middle - 1.3)}" fill="${A.navy}" stroke="#5B76A3" stroke-width="0.4"/>`;
    return (
        `<div data-part="game-bar" style="${boxStyle(box, bleedMm)}">` +
        `<svg viewBox="0 0 ${f2(width)} ${f2(height)}" style="position:absolute;left:0;top:0;width:${mm(width)};height:${mm(height)}">` +
        `${shell}${slots}${track}${fill}${dividers}${book}${star}</svg></div>`
    );
}

/**
 * Draws the Storytime Advantage logo of a front (round 5 of 2026-11-10): the amber tile with the
 * brown border and the logo image, in the box 4 mm above the series banner of both fronts.
 * @param kind The cover kind.
 * @param assets The assets.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function seriesLogo(kind: QuestCoverKind, assets: QuestRenderAssets, bleedMm: number): string {
    const box = boxOf(kind, 'series-logo');
    const src = assets.seriesLogo ?? SERIES_LOGO_URL;
    return (
        `<div data-part="series-logo" style="${boxStyle(box, bleedMm)};box-sizing:border-box;` +
        `background-color:${LOGO_AMBER};border:0.6mm solid ${LOGO_BROWN};border-radius:3mm;overflow:hidden">` +
        `<img src="${esc(src)}" alt="" style="position:absolute;left:0;top:0;width:100%;height:100%"></div>`
    );
}

/**
 * Draws the series banner of the option A frame (`options/build.py`, `a_crest` and `a_back`): the
 * plaque with the series name. Round 5 of 2026-11-10: the 2 front and back banners take the amber
 * palette of the Storytime Advantage logo, and the series name sits on 2 lines, "Storytime" in the
 * mark brown at the larger size and "Advantage" in the mark brown, centered in the band. The front
 * block is about 27.0 mm of the 32.4 mm band and the back block about 13.8 mm of the 16.4 mm band.
 * The second round of round 5 (PM decision of 2026-11-10 13:40) sets "Advantage" in the logo brown
 * with no text edge: Chrome prints a stroked glyph run as a Type 3 font, and the print rule of
 * `lib/print/pdfx.ts` refuses a Type 3 font. The reader A3 banner keeps its present single line and
 * its blue palette, byte for byte.
 * @param kind The cover kind.
 * @param size 'front' for the 38 mm banner, 'back' for the 22 mm banner, 'reader' for the 20 mm.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function seriesBanner(kind: QuestCoverKind, size: 'front' | 'back' | 'reader', bleedMm: number): string {
    const box = boxOf(kind, 'series-banner');
    if (size === 'reader') {
        const inner =
            `<div class="quest-c" style="position:absolute;left:0;top:${mm(4.6)};width:${mm(box.widthMm)};` +
            `color:#fff;font-family:'League Spartan';font-weight:700;font-size:17pt;line-height:1">${esc(STORYTIME_SERIES)}</div>`;
        return (
            `<div data-part="series-banner" style="${boxStyle(box, bleedMm)}">` +
            `${plaqueSvg(box.widthMm, box.heightMm, PLAQUE_BLUE)}${inner}</div>`
        );
    }
    const mainMm = size === 'front' ? 17.5 : 9;
    const subMm = size === 'front' ? 10.5 : 5.4;
    const inner =
        `<div style="position:absolute;left:0;top:0;width:${mm(box.widthMm)};height:${mm(box.heightMm)};` +
        `display:flex;flex-direction:column;align-items:center;justify-content:center;` +
        `font-family:'League Spartan';font-weight:700;line-height:1;white-space:nowrap">` +
        `<div style="font-size:${mm(mainMm)};color:${LOGO_BROWN}">Storytime</div>\n` +
        `<div style="font-size:${mm(subMm)};color:${LOGO_BROWN}">Advantage</div>` +
        `</div>`;
    return (
        `<div data-part="series-banner" style="${boxStyle(box, bleedMm)}">` +
        `${plaqueSvg(box.widthMm, box.heightMm, LOGO_AMBER, false, PLAQUE_AMBER_PALETTE)}${inner}</div>`
    );
}

/**
 * Draws the title plate of a front with the top style hlogo (fix round F10 of 2026-11-13, Daniel's
 * look: "we still need a title on the fucking front"). The plate takes the place and the look of
 * the series banner of the first front: the box of `series-banner` (22, 48, 166, 38 mm), the amber
 * plaque with the diamond ends, and the series name as text on 2 centred lines in the logo brown,
 * "Storytime" at 17.5 mm and "Advantage" at 10.5 mm. The ink block fills about 81 % of the 32.4 mm
 * band (S3). The band fill and the `data-plaque-colour` value are the same string. The 2 lines hold
 * no part mark, so the text of the part reads "Storytime Advantage".
 * @param kind The cover kind.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function frontTitlePlate(kind: QuestCoverKind, bleedMm: number): string {
    const box = boxOf(kind, 'series-banner');
    const inner =
        `<div style="position:absolute;left:0;top:0;width:${mm(box.widthMm)};height:${mm(box.heightMm)};` +
        `display:flex;flex-direction:column;align-items:center;justify-content:center;` +
        `font-family:'League Spartan';font-weight:700;line-height:1;white-space:nowrap">` +
        `<div style="font-size:${mm(17.5)};color:${LOGO_BROWN}">Storytime</div>\n` +
        `<div style="font-size:${mm(10.5)};color:${LOGO_BROWN}">Advantage</div>` +
        `</div>`;
    return (
        `<div data-part="front-title" data-plaque-colour="${LOGO_AMBER}" style="${boxStyle(box, bleedMm)}">` +
        `${plaqueSvg(box.widthMm, box.heightMm, LOGO_AMBER, false, PLAQUE_AMBER_PALETTE)}${inner}</div>`
    );
}

/**
 * Draws the unit bar pill of the teacher front (`options/build.py`, `a_front`). Round 4 of
 * 2026-11-10: the pill keeps its box, its border, and a 13 pt size, and adds the League Spartan
 * family and a line height of 5.9 mm. With border-box sizing the line box spans 272.1 mm to
 * 278.0 mm, and the text box about 272.9 mm to 277.2 mm. The text then sits above the top of the
 * plaque at 278 mm, so the plaque no longer hides the bottom of the Sprout tab text. Round 5 of
 * 2026-11-10: the fill and the text take the mark brown and the border takes the tile amber.
 * @param litBand The band of the book.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function bandPill(litBand: string, bleedMm: number): string {
    const box = boxOf('teacher-front', 'band-pill');
    const label = litBand ? litBand.charAt(0).toUpperCase() + litBand.slice(1) : '';
    return (
        `<div data-part="band-pill" style="${boxStyle(box, bleedMm)};box-sizing:border-box;border-radius:4.5mm;` +
        `background-color:${LOGO_BROWN};border:0.6mm solid ${LOGO_AMBER};color:${LOGO_AMBER};font-family:'League Spartan';` +
        `font-weight:700;font-size:13pt;line-height:5.9mm;text-align:center">${esc(label)}</div>`
    );
}

/**
 * Draws the title plaque of a front side (`options/build.py`, `a_front`): the plaque in the logo
 * amber, and one row that holds the level line, a separator dot, and the book line. Round 4 of
 * 2026-11-10: the band spans 280.8 mm to 289.2 mm, an 8.4 mm band, and the row is set on one line
 * inside it. Round 5 of 2026-11-10: the row takes 7.4 mm, so its text box of about 6.88 mm fills
 * 82 % of the band. The band fill and the `data-plaque-colour` value are the same string,
 * "#FCD34D" (P1 of the plaque fit test finds the band by that equality), on every level. The level
 * line, the separator, and the book line take the mark brown; the second round of round 5 (PM
 * decision of 2026-11-10 13:40) gives the book line no text edge, because Chrome prints a stroked
 * glyph run as a Type 3 font. The reader plaques keep their bytes (P6). The round of 2026-11-11
 * (the standing rules): with the top style `hlogo`, the cap height of the row fills 80 % of the
 * band, the plaque width follows the row, the plaque is centered on the page, and the row takes one
 * vertical shift so that its ink box stands at the band centre (S3, S4). The box table and the
 * default render stay.
 * @param kind The cover kind.
 * @param book The book row.
 * @param bleedMm The bleed.
 * @param top The top chrome style.
 * @returns The HTML.
 */
function titlePlaqueFront(kind: QuestCoverKind, book: QuestBookRow, bleedMm: number, top: QuestTopStyle): string {
    const box = boxOf(kind, 'title-plaque');
    const bookLine = kind === 'teacher-front' ? 'Teacher Book' : 'Student Book';
    const levelLine = `Level ${String(book.level)} · Unit ${String(book.unit)}`;
    if (top === 'hlogo') {
        const page = questPageSize(kind, bleedMm);
        const fontMm = FRONT_TITLE_FONT_MM;
        const separator = '·';
        const rowMm =
            leagueSpartanWidthMm(levelLine, fontMm) +
            leagueSpartanWidthMm(separator, fontMm) +
            leagueSpartanWidthMm(bookLine, fontMm) +
            2 * FRONT_SEPARATOR_MARGIN_MM;
        const widthMm = Math.max(FRONT_TITLE_MIN_WIDTH_MM, rowMm + 2 * FRONT_TITLE_PADDING_MM);
        const leftMm = (page.widthMm - widthMm) / 2;
        const bandMm = box.heightMm - READER_PLAQUE_BAND_INSET_MM;
        const lineTopMm = titleLineTopMm(levelLine + separator + bookLine, fontMm, PLAQUE_BAND_EDGE_MM, bandMm);
        return (
            `<div data-part="title-plaque" data-plaque-colour="${LOGO_AMBER}" style="position:absolute;` +
            `left:${mm(leftMm + bleedMm)};top:${mm(box.topMm + bleedMm)};width:${mm(widthMm)};` +
            `height:${mm(box.heightMm)}">` +
            plaqueSvg(widthMm, box.heightMm, LOGO_AMBER, true, PLAQUE_AMBER_PALETTE) +
            `<div class="quest-c" style="position:absolute;left:0;top:${mm(lineTopMm)};` +
            `width:${mm(widthMm)};height:${mm(fontMm)};` +
            `color:#fff;display:flex;flex-direction:row;align-items:center;justify-content:center;white-space:nowrap;` +
            `font-family:'League Spartan';font-weight:700;font-size:${mm(fontMm)};line-height:${mm(fontMm)};font-kerning:none">` +
            `<span data-part="level-line" style="color:${LOGO_BROWN}">${esc(levelLine)}</span>\n` +
            `<span data-part="plaque-sep" style="color:${LOGO_BROWN};margin:0 ${mm(FRONT_SEPARATOR_MARGIN_MM)}">·</span>\n` +
            `<span data-part="book-line" style="color:${LOGO_BROWN}">${esc(bookLine)}</span>` +
            `</div></div>`
        );
    }
    return (
        `<div data-part="title-plaque" data-plaque-colour="${LOGO_AMBER}" style="${boxStyle(box, bleedMm)}">` +
        plaqueSvg(box.widthMm, box.heightMm, LOGO_AMBER, true, PLAQUE_AMBER_PALETTE) +
        `<div class="quest-c" style="position:absolute;left:0;top:0;width:${mm(box.widthMm)};height:${mm(box.heightMm)};` +
        `color:#fff;display:flex;flex-direction:row;align-items:center;justify-content:center;white-space:nowrap;` +
        `font-family:'League Spartan';font-weight:700;font-size:7.4mm;line-height:1">` +
        `<span data-part="level-line" style="color:${LOGO_BROWN}">Level ${String(book.level)} · Unit ${String(book.unit)}</span>\n` +
        `<span data-part="plaque-sep" style="color:${LOGO_BROWN};margin:0 1.6mm">·</span>\n` +
        `<span data-part="book-line" style="color:${LOGO_BROWN}">${esc(bookLine)}</span>` +
        `</div></div>`
    );
}

/**
 * Draws the logo box of a back side (`options/build.py`, `a_back`). Round 5 of 2026-11-10: the box
 * shows the Storytime Advantage logo in the amber tile with the brown border. The company logo of
 * `assets.logo` no longer shows.
 * @param kind The cover kind.
 * @param assets The assets.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function logoBox(kind: QuestCoverKind, assets: QuestRenderAssets, bleedMm: number): string {
    const box = boxOf(kind, 'logo-box');
    const src = assets.seriesLogo ?? SERIES_LOGO_URL;
    return (
        `<div data-part="logo-box" style="${boxStyle(box, bleedMm)};box-sizing:border-box;` +
        `background-color:${LOGO_AMBER};border-radius:3mm;border:0.6mm solid ${LOGO_BROWN};overflow:hidden">` +
        `<img src="${esc(src)}" alt="" style="position:absolute;left:0;top:0;width:100%;height:100%"></div>`
    );
}

/**
 * Draws the horizontal Storytime Advantage logo on its amber tile (the alternate A2 of 2026-11-10,
 * Daniel's look note of Tasks NXlkaVBtUW9hZWRuU1J6UA): the top chrome of the 2 backs. The tile
 * takes the amber fill, the brown border, the 3 mm radius, and the hidden overflow. One image of
 * the horizontal logo stands inside the border, centered on both axes. The image height is 80 % of
 * the inner height (the box height minus 2 borders), and its width follows the viewBox aspect
 * 1461.6 by 464.88. The values come from the box, not from fixed numbers. The round of 2026-11-11
 * (readers r2b) adds the optional colours, so the leaf cover drew the same tile in the K grays
 * with the gray logo. The round of 2026-11-11 (F2, Daniel's look) moves the logo off the 4 front
 * kinds: the 2 backs keep this tile, and page 12 of the readers holds its own tile.
 * @param kind The cover kind.
 * @param bleedMm The bleed.
 * @param colours The tile fill, the tile border, and the logo file; the amber, the brown, and the
 * horizontal logo by default.
 * @returns The HTML.
 */
function logoTile(
    kind: QuestCoverKind,
    bleedMm: number,
    colours: { fill: string; border: string; src: string } = {
        fill: LOGO_AMBER,
        border: LOGO_BROWN,
        src: HORIZONTAL_LOGO_URL,
    },
): string {
    const box = boxOf(kind, 'logo-tile');
    const innerWidthMm = box.widthMm - 2 * LOGO_TILE_BORDER_MM;
    const innerHeightMm = box.heightMm - 2 * LOGO_TILE_BORDER_MM;
    const imageHeightMm = innerHeightMm * LOGO_TILE_FILL_SHARE;
    const imageWidthMm = imageHeightMm * HORIZONTAL_LOGO_ASPECT;
    const leftMm = (innerWidthMm - imageWidthMm) / 2;
    const topMm = (innerHeightMm - imageHeightMm) / 2;
    return (
        `<div data-part="logo-tile" style="${boxStyle(box, bleedMm)};box-sizing:border-box;` +
        `background-color:${colours.fill};border:${mm(LOGO_TILE_BORDER_MM)} solid ${colours.border};` +
        `border-radius:3mm;overflow:hidden">` +
        `<img src="${esc(colours.src)}" alt="" ` +
        `style="position:absolute;left:${mm(leftMm)};top:${mm(topMm)};` +
        `width:${mm(imageWidthMm)};height:${mm(imageHeightMm)}"></div>`
    );
}

/**
 * The vertical padding of the back panel, in millimetres (round 5 of 2026-11-10). The padding is
 * 1.75 mm smaller at the top, because the ink box of the last panel value overflows its line box
 * of 1.32 on the Andika face by about 0.87 mm at each side, and the block of headings and values
 * then stands centered in the panel (V2).
 */
const PANEL_PAD_TOP_MM = 7.25;

/** The bottom padding of the back panel and the side padding, in millimetres. */
const PANEL_PAD_MM = 9;

/** The side padding of the back panel, in millimetres. */
const PANEL_PAD_SIDE_MM = 11;

/**
 * Draws the back panel with the five fields (`options/build.py`, `a_back`). Round 5 of 2026-11-10:
 * the paper fill and the brown border take the logo tone, the headings take the mark brown, and
 * the block of headings and values stands centered in the panel: a 15 pt size at a line height of
 * 1.32, a 2.4 mm gap after fields 1 to 4, and no gap after field 5. The block is under 120 mm, so
 * the 15 pt size stays. The round of 2026-11-11 (the standing rules): with the top style `hlogo`,
 * the headings and the values are centered, so that the panel text block stands at the panel centre
 * across (S4); the panel box, its padding, and its font sizes stay.
 * @param bleedMm The bleed.
 * @param values The panel values, in the panel order.
 * @param top The top chrome style.
 * @returns The HTML.
 */
function panel(bleedMm: number, values: QuestPanelValue[], top: QuestTopStyle): string {
    const box = boxOf('student-back', 'panel');
    const align = top === 'hlogo' ? ';text-align:center' : '';
    const fields = PANEL_FIELDS.map((field, index) => {
        const value = values.find((entry) => entry.field === field)?.value ?? '';
        const gap = index < PANEL_FIELDS.length - 1 ? '2.4mm' : '0';
        return (
            `<div data-part="panel-field" data-field="${field}" style="margin:0 0 ${gap} 0">` +
            `<h3 data-part="panel-heading" style="margin:0;font-family:'League Spartan';font-weight:700;font-size:15pt;line-height:1.32;color:${LOGO_BROWN}${align}">${esc(PANEL_HEADINGS[field])}</h3>\n` +
            `<p data-part="panel-value" style="margin:0;font-size:15pt;line-height:1.32;color:#1a1a1a${align}">${esc(value)}</p>` +
            `</div>`
        );
    }).join('\n');
    return (
        `<div data-part="panel" style="${boxStyle(box, bleedMm)};box-sizing:border-box;background-color:${LOGO_PAPER};` +
        `border:0.8mm solid ${LOGO_BROWN};border-radius:3mm;padding:${mm(PANEL_PAD_TOP_MM)} ${mm(PANEL_PAD_SIDE_MM)} ${mm(PANEL_PAD_MM)} ${mm(PANEL_PAD_SIDE_MM)};` +
        `display:flex;flex-direction:column;justify-content:center">${fields}</div>`
    );
}

/**
 * Draws the wooden contact sign of a back side (`options/build.py`, `a_back`). Round 5 of
 * 2026-11-10: the outer rect and the nails take the mark brown, the board takes the cream, and the
 * plank lines take the tile amber as stroke only paths.
 * @param kind The cover kind.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function contactSign(kind: QuestCoverKind, bleedMm: number): string {
    const box = boxOf(kind, 'contact-sign');
    const planks = [9, 23, 37, 51, 65]
        .map(
            (y) =>
                `<path d="M5 ${f2(y)} C60 ${f2(y - 0.9)} 120 ${f2(y + 0.9)} 181 ${f2(y)}" stroke="${LOGO_AMBER}" stroke-width="0.35" fill="none"/>`,
        )
        .join('');
    const nails = [4, 182]
        .flatMap((x) => [6, 74].map((y) => `<circle cx="${String(x)}" cy="${String(y)}" r="1" fill="${LOGO_BROWN}"/>`))
        .join('');
    return (
        `<div data-part="contact-sign" style="${boxStyle(box, bleedMm)}">` +
        `<svg viewBox="0 0 186 80" style="position:absolute;left:0;top:0;width:186mm;height:80mm">` +
        `<rect x="-1" y="-1" width="188" height="82" rx="3" fill="${LOGO_BROWN}"/>` +
        `<rect x="3" y="3" width="180" height="74" rx="2" fill="${LOGO_CREAM}"/>${planks}${nails}</svg></div>`
    );
}

/**
 * Draws the five contact lines of a back side (`options/build.py`, `contact_html`). The `**bold**`
 * markers become `<b>`, and the output holds no marker. Round 5 of 2026-11-10: the 5 lines sit in
 * one wrapper of the board width 126 mm (15 mm to 141 mm, the board left edge to the QR left edge)
 * and in an inner div of the widest line, so the block stands centered between the 2 edges.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function contactLines(bleedMm: number): string {
    const lines = BACK_LINES.contact
        .map(
            (line, index) =>
                `<div data-part="contact-line" class="quest-contact-line${index === 0 ? ' quest-contact-head' : ''}" style="font-size:12pt;line-height:1.6;color:#1E1208">${richHtml(line)}</div>`,
        )
        .join('\n');
    return (
        `<div style="position:absolute;left:${mm(15 + bleedMm)};top:${mm(CONTACT_LINES_TOP_MM + bleedMm)};` +
        `width:126mm;display:flex;justify-content:center"><div style="width:max-content">${lines}</div></div>`
    );
}

/**
 * Draws the Reading Advantage logo of the contact sign of a back side (round 5 of 2026-11-10): the
 * small publisher mark under the contact lines, at the centre 78 mm of the board minus 7 mm.
 * @param kind The cover kind.
 * @param assets The assets.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function publisherMark(kind: QuestCoverKind, assets: QuestRenderAssets, bleedMm: number): string {
    const box = boxOf(kind, 'publisher-mark');
    const src = assets.publisherLogo ?? PUBLISHER_LOGO_URL;
    return (
        `<div data-part="publisher-mark" style="${boxStyle(box, bleedMm)};overflow:hidden">` +
        `<img src="${esc(src)}" alt="" style="position:absolute;left:0;top:0;width:100%;height:100%"></div>`
    );
}

/**
 * Draws the LINE QR box of a back side (`options/build.py`, `a_back`, `cut_qr`). Round 5 of
 * 2026-11-10: the border takes the mark brown; the white fill and the QR SVG stay.
 * @param kind The cover kind.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function qrBox(kind: QuestCoverKind, bleedMm: number): string {
    const box = boxOf(kind, 'qr');
    return (
        `<div data-part="qr" class="quest-qr" data-qr-input="${esc(STORYTIME_LINE_ADDRESS)}" style="${boxStyle(box, bleedMm)};` +
        `box-sizing:border-box;background-color:#fff;border-radius:2.5mm;border:0.6mm solid ${LOGO_BROWN}">` +
        `<div style="position:absolute;left:3mm;top:3mm;width:44mm;height:44mm">${storytimeCoverQrSvg()}</div></div>`
    );
}

/**
 * Draws the LINE label of a back side (`options/build.py`, `a_back`).
 * @param kind The cover kind.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function lineLabel(kind: QuestCoverKind, bleedMm: number): string {
    const box = boxOf(kind, 'line-label');
    return (
        `<div data-part="line-label" class="quest-c" style="${boxStyle(box, bleedMm)};font-weight:700;` +
        `font-size:12pt;line-height:${mm(box.heightMm)};color:#1E1208">LINE</div>`
    );
}

/**
 * Draws the role mark of a reader cover: the two step icons and the role label
 * (`options/build.py`, `role_mark`).
 * @param roleKey The role key.
 * @param label The role label.
 * @param stroke The icon stroke.
 * @param sizeMm The icon size.
 * @param textCss The inline style of the label.
 * @param iconCss The inline style of each icon box; empty by default, so the default renders keep their
 * bytes (readers r2c, E3).
 * @returns The HTML.
 */
function roleMark(
    roleKey: string,
    label: string,
    stroke: string,
    sizeMm: number,
    textCss: string,
    iconCss = '',
): string {
    const icons = (ROLE_ICONS[roleKey] ?? ROLE_ICONS.listen)
        .map(
            (name) =>
                `<span style="display:inline-block;width:${mm(sizeMm)};height:${mm(sizeMm)};vertical-align:middle;margin-right:1mm${iconCss}">` +
                `<svg viewBox="0 0 24 24" style="width:100%;height:100%"><g fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">` +
                `${STEP_ICONS[name].replace('class="quest-icon-dot"', `fill="${stroke}"`)}</g></svg></span>`,
        )
        .join('');
    return `${icons}<span style="vertical-align:middle;${textCss}">${esc(label)}</span>`;
}

/** A box in page millimetres: the left, top, right, and bottom edges (D2, D3, the round of 2026-11-12). */
interface QuestMmBox {
    /** The left edge. */
    left: number;
    /** The top edge. */
    top: number;
    /** The right edge. */
    right: number;
    /** The bottom edge. */
    bottom: number;
}

/** One box of the key box file, in art pixels (D1, the PM order of 2026-11-11). */
interface QuestKeyFileBox {
    /** The name of the key object. */
    label: string;
    /** The box in pixels of the art file: x0, y0, x1, y1. */
    box: [number, number, number, number];
    /** The kind: `head`, `dog-body`, or `title-object`. */
    kind: string;
}

/** One entry of the key box file (D1). */
interface QuestKeyFileEntry {
    /** The width of the art file in pixels. */
    widthPx: number;
    /** The height of the art file in pixels. */
    heightPx: number;
    /** The key boxes of the art file. */
    boxes: QuestKeyFileBox[];
}

/** One key box in page millimetres (D2). */
interface QuestKeyMmBox {
    /** The name of the key object. */
    label: string;
    /** The kind. */
    kind: string;
    /** The box in page millimetres. */
    box: QuestMmBox;
}

/** The placement of the chrome of one cover by the rule D3 (the round of 2026-11-12, F3). */
export interface QuestChromePlacement {
    /** The plaque size share: 1 for the default size, 0.5 on an exception cover (D3). */
    scale: number;
    /** The horizontal move of the plaque from its default place, in millimetres. */
    plaqueDxMm: number;
    /** The vertical move of the plaque from its default place, in millimetres. */
    plaqueDyMm: number;
    /** The horizontal move of the sub-part (the A3 role bar or the leaf footer), in millimetres. */
    subDxMm: number;
    /** The vertical move of the sub-part, in millimetres. */
    subDyMm: number;
    /** The horizontal move of the A3 week pill, in millimetres (D3). */
    pillDxMm: number;
    /** The vertical move of the A3 week pill, in millimetres (D3). */
    pillDyMm: number;
    /** The computed object-position of the art, or null for the default `50% 50%` (Q1). */
    artPosition: string | null;
}

/** The clearance between a chrome part and a key box, in millimetres (D2). */
const KEY_CLEARANCE_MM = 1;

/** The least distance of a moved chrome group from the trim edge, in millimetres (D3, D4). */
const KEY_TRIM_MARGIN_MM = 5;

/** The key box file of the art of Level 2 (D1). */
const KEY_BOX_FILE = path.join(STORYTIME_CONTENT_DIR, 'l2', 'print', 'pictures-heads.json');

/** The art positions that the placement rule tries, in order (Q1, D2): centred, then the bottom edge. */
const KEY_ART_POSITIONS = ['50% 50%', '50% 100%'] as const;

/** The most distance of a head box above the top edge on the cover of Q1, in millimetres (Q1). */
const KEY_HEAD_ABOVE_TOP_MM = 12;

/** The tolerance of the trim and cover check of the key boxes, in millimetres (D2). */
const KEY_TRIM_TOLERANCE_MM = 0.05;

/** The safety that the horizontal slide of an exception cover adds, in millimetres (D3, D4). */
const KEY_SLIDE_SAFETY_MM = 0.5;

/**
 * The painted width of the A3 hlogo role bar of each role label, in millimetres (the Chrome measure
 * of the role base of 2026-11-12). A label outside the table takes the widest measure, so that the
 * placement never reads a part smaller than it paints.
 */
const READER_BAR_PAINT_WIDTH_MM: Record<string, number> = {
    'Listen and read.': 127.05,
    'Sound it out.': 106.15,
};

/** The widest painted width of the A3 hlogo role bar, in millimetres. */
const READER_BAR_PAINT_WIDTH_MAX_MM = 127.05;

/**
 * The painted box of the A3 hlogo role bar above its box top, in millimetres: the box of the icon
 * spans and of the text line, which stands above the 12 mm bar box (the Chrome measure of the role
 * base of 2026-11-12).
 */
const READER_BAR_PAINT_ABOVE_MM = 4.58;

/** The painted box of the A3 hlogo role bar below its box bottom, in millimetres. */
const READER_BAR_PAINT_BELOW_MM = 3.26;

/**
 * The painted width of the leaf footer of each role label, in millimetres (the Chrome measure of the
 * role base of 2026-11-12: `57.78` to `140.22` mm and `60.21` to `137.79` mm around the page centre).
 */
const LEAF_FOOTER_PAINT_WIDTH_MM: Record<string, number> = {
    'Listen and read.': 82.44,
    'Sound it out.': 77.58,
};

/** The widest painted width of the leaf footer, in millimetres. */
const LEAF_FOOTER_PAINT_WIDTH_MAX_MM = 82.44;

/** The painted top of the leaf footer inside its 6 mm box, in millimetres (the role base measure). */
const LEAF_FOOTER_PAINT_TOP_MM = 137.26;

/** The painted height of the leaf footer, in millimetres (the role base measure). */
const LEAF_FOOTER_PAINT_HEIGHT_MM = 5.72;

/** The painted box of the A3 hlogo week pill above its box top, in millimetres (the role base measure). */
const READER_PILL_PAINT_ABOVE_MM = 3.99;

/** The painted box of the A3 hlogo week pill below its box bottom, in millimetres. */
const READER_PILL_PAINT_BELOW_MM = 2.15;

/** The painted width of the A3 hlogo week pill of one week digit, in millimetres. */
const READER_PILL_PAINT_WIDTH_MM = 45.66;

/** The key box file, read once (D1). */
let keyBoxCache: Record<string, QuestKeyFileEntry> | null = null;

/**
 * Reads the key box file of the art of Level 2 (D1). A missing or broken file gives no box, so a
 * build still renders its cover.
 * @returns The entries by art file name.
 */
function questKeyBoxes(): Record<string, QuestKeyFileEntry> {
    if (keyBoxCache) return keyBoxCache;
    try {
        keyBoxCache = JSON.parse(fs.readFileSync(KEY_BOX_FILE, 'utf8')) as Record<string, QuestKeyFileEntry>;
    } catch {
        keyBoxCache = {};
    }
    return keyBoxCache;
}

/**
 * Tells whether 2 boxes overlap with a positive area (D2).
 * @param one The first box.
 * @param two The second box.
 * @returns True when the boxes share an area.
 */
function questOverlap(one: QuestMmBox, two: QuestMmBox): boolean {
    return Math.min(one.right, two.right) - Math.max(one.left, two.left) > 0 && Math.min(one.bottom, two.bottom) - Math.max(one.top, two.top) > 0;
}

/**
 * Grows a box on each side (D2).
 * @param box The box.
 * @param by The growth in millimetres.
 * @returns The grown box.
 */
function questGrow(box: QuestMmBox, by: number): QuestMmBox {
    return { left: box.left - by, top: box.top - by, right: box.right + by, bottom: box.bottom + by };
}

/**
 * Tells whether a box lies 5 mm inside the trim within the tolerance (D3, D4).
 * @param box The box in page millimetres.
 * @param page The page size.
 * @returns True when the box lies inside the trim margin.
 */
function questInsideTrim(box: QuestMmBox, page: QuestTrim): boolean {
    return (
        box.left >= KEY_TRIM_MARGIN_MM - KEY_TRIM_TOLERANCE_MM &&
        box.top >= KEY_TRIM_MARGIN_MM - KEY_TRIM_TOLERANCE_MM &&
        box.right <= page.widthMm - KEY_TRIM_MARGIN_MM + KEY_TRIM_TOLERANCE_MM &&
        box.bottom <= page.heightMm - KEY_TRIM_MARGIN_MM + KEY_TRIM_TOLERANCE_MM
    );
}

/**
 * Tells whether a box meets no grown key box (D2).
 * @param box The box in page millimetres.
 * @param keys The key boxes in page millimetres.
 * @param clearanceMm The clearance in millimetres.
 * @returns True when the box meets no key box.
 */
function questClearOfKeys(box: QuestMmBox, keys: QuestKeyMmBox[], clearanceMm = KEY_CLEARANCE_MM): boolean {
    return keys.every((key) => !questOverlap(box, questGrow(key.box, clearanceMm)));
}

/**
 * Reads the millimetres of one token of a computed object-position.
 * @param token The token: a percentage or a length in px.
 * @param freeMm The free space of the axis in millimetres.
 * @returns The offset in millimetres, or 0 for an unknown token.
 */
function questPositionOffset(token: string | undefined, freeMm: number): number {
    if (!token) return 0;
    if (token.endsWith('%')) return (freeMm * Number.parseFloat(token)) / 100;
    if (token.endsWith('px')) return (Number.parseFloat(token) * 25.4) / 96;
    return 0;
}

/**
 * Maps the key boxes of one art file to page millimetres through the `object-fit: cover` transform
 * of the art layer and its object-position (D2).
 * @param entry The entry of the art file.
 * @param page The page size.
 * @param position The object-position.
 * @returns The key boxes in page millimetres, and the image box.
 */
function questKeyBoxesMm(entry: QuestKeyFileEntry, page: QuestTrim, position: string): { keys: QuestKeyMmBox[]; image: QuestMmBox } {
    const scale = Math.max(page.widthMm / entry.widthPx, page.heightMm / entry.heightPx);
    const tokens = position.trim().split(/\s+/);
    const offsetX = questPositionOffset(tokens[0], page.widthMm - entry.widthPx * scale);
    const offsetY = questPositionOffset(tokens[1] ?? tokens[0], page.heightMm - entry.heightPx * scale);
    return {
        image: {
            left: offsetX,
            top: offsetY,
            right: offsetX + entry.widthPx * scale,
            bottom: offsetY + entry.heightPx * scale,
        },
        keys: entry.boxes.map((key) => ({
            label: key.label,
            kind: key.kind,
            box: {
                left: offsetX + key.box[0] * scale,
                top: offsetY + key.box[1] * scale,
                right: offsetX + key.box[2] * scale,
                bottom: offsetY + key.box[3] * scale,
            },
        })),
    };
}

/**
 * Reads the art object-position that keeps every key box inside the trim (Q1, D2): the centred
 * position, and then the bottom edge. A head box may lie up to 12 mm above the top edge on the cover
 * where no position shows the head and the dog together (Q1). The first position of the list gives
 * null, so that the default render keeps its bytes.
 * @param entry The entry of the art file.
 * @param page The page size.
 * @returns The object-position, or null for the default `50% 50%`.
 */
function questArtPosition(entry: QuestKeyFileEntry, page: QuestTrim): string | null {
    for (const [index, position] of KEY_ART_POSITIONS.entries()) {
        const mapped = questKeyBoxesMm(entry, page, position);
        if (
            mapped.image.left > KEY_TRIM_TOLERANCE_MM ||
            mapped.image.top > KEY_TRIM_TOLERANCE_MM ||
            mapped.image.right < page.widthMm - KEY_TRIM_TOLERANCE_MM ||
            mapped.image.bottom < page.heightMm - KEY_TRIM_TOLERANCE_MM
        ) {
            continue;
        }
        const fits = mapped.keys.every((key) => {
            const out = {
                left: -key.box.left,
                top: -key.box.top,
                right: key.box.right - page.widthMm,
                bottom: key.box.bottom - page.heightMm,
            };
            const allowedTop = key.kind === 'head' ? KEY_HEAD_ABOVE_TOP_MM : KEY_TRIM_TOLERANCE_MM;
            return out.left <= KEY_TRIM_TOLERANCE_MM && out.right <= KEY_TRIM_TOLERANCE_MM && out.bottom <= KEY_TRIM_TOLERANCE_MM && out.top <= allowedTop;
        });
        if (fits) return index === 0 ? null : position;
    }
    return null;
}

/** The geometry of the A3 reader title plaque (D3, readers r2b and r2c). */
interface QuestPlaqueGeometry {
    /** The width of the plaque, in millimetres. */
    widthMm: number;
    /** The height of the plaque, in millimetres. */
    heightMm: number;
    /** The line count of the title. */
    lines: number;
    /** The width of the title text box, in millimetres. */
    contentMm: number;
    /** The height of one title band, in millimetres. */
    bandMm: number;
}

/**
 * Reads the geometry of the A3 reader title plaque of the top style hlogo (readers r2b, E4): the
 * width follows the title plus 2 x 27 mm between 120 mm and 340 mm, a title wider than 286 mm wraps,
 * and the height follows the line count.
 * @param title The title of the reader.
 * @returns The geometry.
 */
function readerPlaqueGeometry(title: string): QuestPlaqueGeometry {
    const fontMm = READER_TITLE_FONT_MM;
    const titleMm = leagueSpartanWidthMm(title, fontMm);
    const naturalMm = titleMm + 2 * READER_TITLE_PADDING_MM;
    const widthMm =
        naturalMm > READER_TITLE_MAX_WIDTH_MM
            ? READER_TITLE_MAX_WIDTH_MM - READER_PLAQUE_SLOP_MM
            : naturalMm < READER_TITLE_MIN_WIDTH_MM
              ? READER_TITLE_MIN_WIDTH_MM + READER_PLAQUE_SLOP_MM
              : naturalMm;
    const contentMm = widthMm - 2 * READER_TITLE_PADDING_MM;
    const lines = naturalMm > READER_TITLE_MAX_WIDTH_MM ? readerTitleLineCount(title, fontMm, contentMm) : 1;
    const bandMm = READER_PLAQUE_HEIGHT_MM - READER_PLAQUE_BAND_INSET_MM;
    return { widthMm, heightMm: bandMm * Math.max(1, lines) + READER_PLAQUE_BAND_INSET_MM, lines: Math.max(1, lines), contentMm, bandMm };
}

/** The geometry of the leaf reader title plaque of the top style hlogo (readers r2c, E4). */
interface QuestLeafPlaqueGeometry {
    /** The width of the plaque, in millimetres. */
    widthMm: number;
    /** The left edge of the plaque, in millimetres. */
    leftMm: number;
    /** The top of the title line box inside the plaque, in millimetres. */
    lineTopMm: number;
}

/**
 * Reads the geometry of the leaf reader title plaque of the top style hlogo (readers r2c, E4): the
 * width follows the title plus 2 x 21 mm between 110 mm and 182 mm, centred on the 198 mm page.
 * @param title The title of the reader.
 * @returns The geometry.
 */
function leafPlaqueGeometry(title: string): QuestLeafPlaqueGeometry {
    const fontMm = LEAF_TITLE_FONT_MM;
    const titleMm = leagueSpartanWidthMm(title, fontMm);
    const widthMm = Math.min(LEAF_PLAQUE_MAX_WIDTH_MM, Math.max(LEAF_PLAQUE_MIN_WIDTH_MM, titleMm + 2 * LEAF_PLAQUE_PADDING_MM));
    const bandMm = LEAF_PLAQUE_HEIGHT_MM - READER_PLAQUE_BAND_INSET_MM;
    return { widthMm, leftMm: (questPageSize('reader-leaf', 0).widthMm - widthMm) / 2, lineTopMm: titleLineTopMm(title, fontMm, PLAQUE_BAND_EDGE_MM, bandMm) };
}

/** The width that the leaf mark box of a page 1 side reserves, in millimetres (Q5). */
const LEAF_MARK_BOX_WIDTH_MM = 34;

/** The height of the leaf mark box of a page 1 side, in millimetres (Q5). */
const LEAF_MARK_BOX_HEIGHT_MM = 2.5;

/** The top of the leaf mark box of a page 1 side, in millimetres from the side top (Q5: 0.5 to 10). */
const LEAF_MARK_TOP_MM = 2;

/** The size factor of the crystal groups of the leaf plaque (C6 of 2026-11-12: the gap of 2 mm at s = 0.5). */
const LEAF_CRYSTAL_SCALE = 0.6;

/** The least left edge of the leaf mark of a page 1 side, in millimetres: 3 mm right of the 12 mm perforation (FR-5.1). */
const LEAF_MARK_MIN_LEFT_MM = 15;

/**
 * Reads the free place of the leaf mark of a page 1 quest cover (Q5 rule a, the PM decision of
 * 2026-11-12). The leaf side turns page 1 by 180 degrees in the imposition, so the mark is placed in
 * the side coordinates of the top margin and mapped back to the page. The mark box with 1 mm around
 * it stays clear of every chrome part and every key box of the page, at least 3 mm from the
 * perforation (x 12 mm) and inside the torn leaf. The white footer strip grows to hold the mark.
 * @param artFile The line art file of the reader cover.
 * @param title The title of the reader.
 * @param roleLabel The role label of the reader.
 * @returns The mark box in page millimetres.
 */
function leafMarkPlace(artFile: string, title: string, roleLabel: string): QuestMmBox {
    const page = questPageSize('reader-leaf', 0);
    const mirror = (box: QuestMmBox): QuestMmBox => ({
        left: page.widthMm - box.right,
        top: page.heightMm - box.bottom,
        right: page.widthMm - box.left,
        bottom: page.heightMm - box.top,
    });
    const all = questPageOneClearBoxes('reader-leaf', artFile, title, roleLabel);
    // the mark stands inside the footer strip, so the sub-part box (the footer) is not a blocker
    const boxes = all.slice(0, Math.max(0, all.length - 1)).map((box) => questGrow(mirror(box), KEY_CLEARANCE_MM));
    const widthMm = LEAF_MARK_BOX_WIDTH_MM;
    const heightMm = LEAF_MARK_BOX_HEIGHT_MM;
    const top = LEAF_MARK_TOP_MM;
    for (let left = LEAF_MARK_MIN_LEFT_MM; left <= page.widthMm - KEY_TRIM_MARGIN_MM - widthMm; left += 1) {
        const side = { left, top, right: left + widthMm, bottom: top + heightMm };
        if (boxes.some((box) => questOverlap(box, side))) continue;
        return mirror(side);
    }
    return mirror({ left: LEAF_MARK_MIN_LEFT_MM, top, right: LEAF_MARK_MIN_LEFT_MM + widthMm, bottom: top + heightMm });
}

/**
 * Reads the painted default group of one reader cover (D3, D4): the plaque box and the sub-part box,
 * in the page millimetres of the bleed 0. The painted box of a text part holds the boxes of its
 * lines and of its icons, so the group takes the measured paint offsets of the role bar and of the
 * leaf footer, which the Chrome measure of the role base of 2026-11-12 pins.
 * @param kind The cover kind: `reader-a3` or `reader-leaf`.
 * @param title The title of the reader.
 * @param roleLabel The role label of the reader.
 * @param page The page size.
 * @returns The group in page millimetres.
 */
function questReaderGroup(
    kind: QuestCoverKind,
    title: string,
    roleLabel: string,
    page: QuestTrim,
): { plaque: QuestMmBox; sub: QuestMmBox; overflowTopMm: number; overflowBottomMm: number } {
    const centre = page.widthMm / 2;
    if (kind === 'reader-a3') {
        const geometry = readerPlaqueGeometry(title);
        const bandMm = geometry.bandMm * geometry.lines;
        const lineTopMm = titleLineTopMm(title, READER_TITLE_FONT_MM, PLAQUE_BAND_EDGE_MM, bandMm, geometry.lines);
        const leftMm = (page.widthMm - geometry.widthMm) / 2;
        const topMm = READER_PLAQUE_BOTTOM_MM - geometry.heightMm;
        const bar = boxOf('reader-a3', 'role-bar');
        const barWidthMm = READER_BAR_PAINT_WIDTH_MM[roleLabel] ?? READER_BAR_PAINT_WIDTH_MAX_MM;
        return {
            plaque: {
                left: leftMm,
                top: topMm,
                right: leftMm + geometry.widthMm,
                bottom: topMm + geometry.heightMm,
            },
            overflowTopMm: Math.max(0, -lineTopMm),
            overflowBottomMm: Math.max(0, lineTopMm + READER_TITLE_FONT_MM * geometry.lines - geometry.heightMm),
            sub: {
                left: centre - barWidthMm / 2,
                top: bar.topMm - READER_BAR_PAINT_ABOVE_MM,
                right: centre + barWidthMm / 2,
                bottom: bar.topMm + bar.heightMm + READER_BAR_PAINT_BELOW_MM,
            },
        };
    }
    const geometry = leafPlaqueGeometry(title);
    const footerWidthMm = LEAF_FOOTER_PAINT_WIDTH_MM[roleLabel] ?? LEAF_FOOTER_PAINT_WIDTH_MAX_MM;
    return {
        plaque: {
            left: geometry.leftMm,
            top: LEAF_PLAQUE_TOP_MM,
            right: geometry.leftMm + geometry.widthMm,
            bottom: LEAF_PLAQUE_TOP_MM + LEAF_PLAQUE_HEIGHT_MM,
        },
        overflowTopMm: Math.max(0, -geometry.lineTopMm),
        overflowBottomMm: Math.max(0, geometry.lineTopMm + LEAF_TITLE_FONT_MM - LEAF_PLAQUE_HEIGHT_MM),
        sub: questGrow(
            {
                left: centre - footerWidthMm / 2,
                top: LEAF_FOOTER_PAINT_TOP_MM,
                right: centre + footerWidthMm / 2,
                bottom: LEAF_FOOTER_PAINT_TOP_MM + LEAF_FOOTER_PAINT_HEIGHT_MM,
            },
            KEY_CLEARANCE_MM,
        ),
    };
}

/**
 * Finds the lowest centred free place of one chrome group (D3): the group moves up from its default
 * bottom in 1 mm steps, at the plaque size share, and the plaque top stays 5 mm inside the trim.
 * @param page The page size.
 * @param group The default group.
 * @param scale The plaque size share.
 * @param keys The key boxes in page millimetres.
 * @returns The step count in millimetres, or null when no centred place is free.
 */
function questCentredPlace(
    page: QuestTrim,
    group: { plaque: QuestMmBox; sub: QuestMmBox; overflowTopMm: number; overflowBottomMm: number },
    scale: number,
    keys: QuestKeyMmBox[],
): number | null {
    const centre = page.widthMm / 2;
    const plaqueWidthMm = (group.plaque.right - group.plaque.left) * scale;
    const plaqueHeightMm = (group.plaque.bottom - group.plaque.top) * scale;
    const gapMm = group.sub.top - group.plaque.bottom;
    const subWidthMm = group.sub.right - group.sub.left;
    const subHeightMm = group.sub.bottom - group.sub.top;
    for (let step = 0; step < 400; step += 1) {
        const bottom = group.sub.bottom - step;
        const sub = { left: centre - subWidthMm / 2, top: bottom - subHeightMm, right: centre + subWidthMm / 2, bottom };
        const plaqueBottom = bottom - subHeightMm - gapMm;
        const plaque = { left: centre - plaqueWidthMm / 2, top: plaqueBottom - plaqueHeightMm, right: centre + plaqueWidthMm / 2, bottom: plaqueBottom };
        const paint = {
            left: plaque.left,
            top: plaque.top - group.overflowTopMm * scale,
            right: plaque.right,
            bottom: plaque.bottom + group.overflowBottomMm * scale,
        };
        if (paint.top < KEY_TRIM_MARGIN_MM) return null;
        if (questClearOfKeys(plaque, keys) && questClearOfKeys(paint, keys) && questClearOfKeys(sub, keys)) return step;
    }
    return null;
}

/**
 * Scales one box to the size share of D3 around the page centre, with its bottom edge kept (the 50 %
 * step of an exception cover). The plaque takes the smaller size in its own layout, so that no
 * transform lands on the page: Chrome turns a page with a scaled layer into one image (R31).
 * @param box The box.
 * @param scale The size share.
 * @param centreMm The horizontal centre of the page, in millimetres.
 * @returns The scaled box.
 */
function questScalePlaque(box: QuestMmBox, scale: number, centreMm: number): QuestMmBox {
    const halfWidth = ((box.right - box.left) * scale) / 2;
    return { left: centreMm - halfWidth, top: box.bottom - (box.bottom - box.top) * scale, right: centreMm + halfWidth, bottom: box.bottom };
}

/**
 * Finds the lowest free place of an exception cover group (D3, D4): the plaque takes the 50 % size
 * and the group slides horizontally, because no centred place is free. The group moves up in 1 mm
 * steps, and the slide tries the page centre and then both sides step by step.
 * @param page The page size.
 * @param plaque The scaled plaque box.
 * @param sub The sub-part box.
 * @param keys The key boxes in page millimetres.
 * @returns The slide in millimetres, or null when no place is free.
 */
function questSlidePlace(
    page: QuestTrim,
    plaque: QuestMmBox,
    sub: QuestMmBox,
    keys: QuestKeyMmBox[],
    paint: QuestMmBox,
): { dxMm: number; dyMm: number } | null {
    const widthMm = page.widthMm / 2;
    const group = { left: Math.min(plaque.left, sub.left), top: plaque.top, right: Math.max(plaque.right, sub.right), bottom: sub.bottom };
    const safety = keys.map((key) => ({ ...key, box: questGrow(key.box, KEY_SLIDE_SAFETY_MM) }));
    for (let dy = 0; dy < page.heightMm; dy += 1) {
        for (let offset = 0; offset <= widthMm; offset += 1) {
            for (const dx of offset === 0 ? [0] : [-offset, offset]) {
                const moved = { left: group.left + dx, top: group.top - dy, right: group.right + dx, bottom: group.bottom - dy };
                if (!questInsideTrim(moved, page)) continue;
                if (!questClearOfKeys({ left: plaque.left + dx, top: plaque.top - dy, right: plaque.right + dx, bottom: plaque.bottom - dy }, safety)) continue;
                if (!questClearOfKeys({ left: paint.left + dx, top: paint.top - dy, right: paint.right + dx, bottom: paint.bottom - dy }, safety)) continue;
                if (!questClearOfKeys({ left: sub.left + dx, top: sub.top - dy, right: sub.right + dx, bottom: sub.bottom - dy }, safety)) continue;
                return { dxMm: dx, dyMm: -dy };
            }
        }
    }
    return null;
}

/**
 * Reads the move of the A3 hlogo week pill (D3): the pill keeps its top right box when that box is
 * free, else it takes the mirrored top left box, else it steps down in that column. The painted box
 * of the pill takes the measured paint offsets of the role base of 2026-11-12.
 * @param page The page size.
 * @param keys The key boxes in page millimetres.
 * @returns The move of the pill in millimetres.
 */
function questPillMove(page: QuestTrim, keys: QuestKeyMmBox[]): { dxMm: number; dyMm: number } {
    const box = boxOf('reader-a3', 'week-pill');
    const base: QuestMmBox = {
        left: READER_PILL_CENTRE_MM - READER_PILL_PAINT_WIDTH_MM / 2,
        top: box.topMm - READER_PILL_PAINT_ABOVE_MM,
        right: READER_PILL_CENTRE_MM + READER_PILL_PAINT_WIDTH_MM / 2,
        bottom: box.topMm + box.heightMm + READER_PILL_PAINT_BELOW_MM,
    };
    if (questClearOfKeys(base, keys)) return { dxMm: 0, dyMm: 0 };
    const mirrorDxMm = page.widthMm - base.right - base.left;
    const mirrored = { ...base, left: base.left + mirrorDxMm, right: base.right + mirrorDxMm };
    if (questClearOfKeys(mirrored, keys)) return { dxMm: mirrorDxMm, dyMm: 0 };
    for (let step = 1; step < 200; step += 1) {
        const lower = { ...mirrored, top: mirrored.top + step, bottom: mirrored.bottom + step };
        if (questClearOfKeys(lower, keys)) return { dxMm: mirrorDxMm, dyMm: step };
    }
    return { dxMm: 0, dyMm: 0 };
}

/**
 * Places the chrome of one reader cover by the rule D3 (the round of 2026-11-12, F3 and F4): the
 * default place; then the group up in 1 mm steps; then, on an exception cover, the plaque at 50 %
 * and the group on a horizontal slide. The step reads the key boxes of the art file from
 * `pictures-heads.json` and maps them to page millimetres through the `object-fit: cover` transform
 * of the art layer, with a 1 mm clearance. The D4 exception list is w01-2 reader-a3 and
 * w01-2 reader-leaf; the step computes that list from the key boxes, so no cover name is in the code.
 * @param kind The cover kind.
 * @param artFile The art file name of the key box file.
 * @param title The title of the reader.
 * @param roleLabel The role label of the reader.
 * @returns The placement of the chrome.
 */
export function questChromePlacement(kind: QuestCoverKind, artFile: string, title: string, roleLabel: string): QuestChromePlacement {
    const none: QuestChromePlacement = { scale: 1, plaqueDxMm: 0, plaqueDyMm: 0, subDxMm: 0, subDyMm: 0, pillDxMm: 0, pillDyMm: 0, artPosition: null };
    const page = questPageSize(kind, 0);
    const entry = questKeyBoxes()[artFile];
    if (!entry) return none;
    const artPosition = questArtPosition(entry, page);
    const keys = questKeyBoxesMm(entry, page, artPosition ?? KEY_ART_POSITIONS[0]).keys;
    const group = questReaderGroup(kind, title, roleLabel, page);
    const step = questCentredPlace(page, group, 1, keys);
    const pill = kind === 'reader-a3' ? questPillMove(page, keys) : { dxMm: 0, dyMm: 0 };
    if (step === 0) return { ...none, artPosition, pillDxMm: pill.dxMm, pillDyMm: pill.dyMm };
    if (step !== null) {
        return { ...none, artPosition, plaqueDyMm: -step, subDyMm: -step, pillDxMm: pill.dxMm, pillDyMm: pill.dyMm };
    }
    // the D3 ladder: the plaque at 95 %, 90 %, ... 50 %, each size with its own place
    for (let percent = 95; percent >= 50; percent -= 5) {
        const sizeScale = percent / 100;
        const sizeStep = questCentredPlace(page, group, sizeScale, keys);
        if (sizeStep === null) continue;
        return { ...none, scale: sizeScale, artPosition, plaqueDyMm: -sizeStep, subDyMm: -sizeStep, pillDxMm: pill.dxMm, pillDyMm: pill.dyMm };
    }
    const scaledPlaque = questScalePlaque(group.plaque, 0.5, questPageSize(kind, 0).widthMm / 2);
    const scaledPaint = {
        left: scaledPlaque.left,
        top: scaledPlaque.top - group.overflowTopMm * 0.5,
        right: scaledPlaque.right,
        bottom: scaledPlaque.bottom + group.overflowBottomMm * 0.5,
    };
    const slide = questSlidePlace(page, scaledPlaque, group.sub, keys, scaledPaint);
    if (!slide) return { ...none, artPosition };
    return {
        scale: 0.5,
        plaqueDxMm: slide.dxMm,
        plaqueDyMm: slide.dyMm,
        subDxMm: slide.dxMm,
        subDyMm: slide.dyMm,
        pillDxMm: 0,
        pillDyMm: 0,
        artPosition,
    };
}

/**
 * Reads the boxes that the leaf mark of a page 1 quest cover must clear, in page millimetres (Q5 of
 * the PM answer of 2026-11-12): the key boxes of the art, the placed title plaque box, and the
 * placed sub-part box.
 * @param kind The cover kind.
 * @param artFile The art file name of the key box file.
 * @param title The title of the reader.
 * @param roleLabel The role label of the reader.
 * @returns The boxes, or an empty list when the key box file holds no entry.
 */
export function questPageOneClearBoxes(kind: QuestCoverKind, artFile: string, title: string, roleLabel: string): QuestMmBox[] {
    const page = questPageSize(kind, 0);
    const entry = questKeyBoxes()[artFile];
    if (!entry) return [];
    const position = questArtPosition(entry, page) ?? KEY_ART_POSITIONS[0];
    const keys = questKeyBoxesMm(entry, page, position).keys.map((key) => key.box);
    const placement = questChromePlacement(kind, artFile, title, roleLabel);
    const group = questReaderGroup(kind, title, roleLabel, page);
    const scale = placement.scale;
    const plaqueWidthMm = (group.plaque.right - group.plaque.left) * scale;
    const plaqueHeightMm = (group.plaque.bottom - group.plaque.top) * scale;
    const centreMm = page.widthMm / 2 + placement.plaqueDxMm;
    const bottom = group.plaque.bottom + placement.plaqueDyMm;
    return [
        ...keys,
        { left: centreMm - plaqueWidthMm / 2, top: bottom - plaqueHeightMm, right: centreMm + plaqueWidthMm / 2, bottom },
        {
            left: centreMm - (group.sub.right - group.sub.left) / 2,
            top: group.sub.top + placement.subDyMm,
            right: centreMm + (group.sub.right - group.sub.left) / 2,
            bottom: group.sub.bottom + placement.subDyMm,
        },
    ];
}


/**
 * Draws the art layer: the first element of the page, to the page edges (spec FR-9.1, T26). The
 * round of 2026-11-12 (F3, Q1): the object-position follows the placement step, and it stays absent
 * for the default centred position, so that the default render keeps its bytes.
 * @param kind The cover kind.
 * @param assets The assets.
 * @param bleedMm The bleed.
 * @param artPosition The object-position, or null for the default `50% 50%` (Q1).
 * @returns The HTML.
 */
function artLayer(kind: QuestCoverKind, assets: QuestRenderAssets, bleedMm: number, artPosition: string | null = null): string {
    const page = questPageSize(kind, bleedMm);
    const position = artPosition === null ? '' : `;object-position:${artPosition}`;
    const box = `position:absolute;left:0mm;top:0mm;width:${mm(page.widthMm)};height:${mm(page.heightMm)}`;
    const art = assets.art ?? '';
    if (!art) {
        return (
            `<div data-part="art" class="quest-art" style="${box};display:flex;align-items:center;` +
            `justify-content:center;background:#EFEFEF"><span class="quest-missing">PICTURE MISSING</span></div>`
        );
    }
    return `<img data-part="art" class="quest-art" src="${esc(art)}" alt="" style="${box};object-fit:cover${position}">`;
}

/**
 * Builds the body of a front side (`options/build.py`, `a_front`). The fronts hold no game bar
 * (round 3 of 2026-11-10). Round 5 of 2026-11-10: the Storytime Advantage logo replaces the crest
 * above the series banner, and the logo, the series banner, the teacher band pill, and the title
 * plaque are the only frame parts. The alternate A2 of 2026-11-10: with the top style `hlogo`, the
 * horizontal logo on its amber tile stands in place of the logo and the series banner, the band
 * pill and the title plaque stay, and no part repeats the series name. The round of 2026-11-11 (the
 * standing rules): with `hlogo`, the teacher front holds no band pill, because the standing rule 5
 * forbids a band word and a game bar on every cover; the default render keeps the pill and its box.
 * The round of 2026-11-11 (F2, Daniel's look): with `hlogo`, the front holds no logo tile and no
 * other part takes its place, because the horizontal logo covered the head of almost every cover
 * picture; the default render and the box table keep the tile entry.
 * @param kind The cover kind.
 * @param book The book row.
 * @param assets The assets.
 * @param bleedMm The bleed.
 * @param top The top chrome style.
 * @returns The HTML fragment.
 */
function frontBody(
    kind: QuestCoverKind,
    book: QuestBookRow,
    assets: QuestRenderAssets,
    bleedMm: number,
    top: QuestTopStyle,
): string {
    const parts = [artLayer(kind, assets, bleedMm)];
    if (top !== 'hlogo') {
        parts.push(seriesLogo(kind, assets, bleedMm), seriesBanner(kind, 'front', bleedMm));
    } else {
        parts.push(frontTitlePlate(kind, bleedMm));
    }
    if (kind === 'teacher-front' && top !== 'hlogo') parts.push(bandPill(book.litBand, bleedMm));
    parts.push(titlePlaqueFront(kind, book, bleedMm, top));
    return parts.join('\n');
}

/**
 * Builds the body of a back side (`options/build.py`, `a_back`). The student back holds the panel;
 * the teacher back holds none. Round 5 of 2026-11-10: the Storytime Advantage logo, the centered
 * contact lines, and the Reading Advantage publisher mark of the contact sign. The alternate A2 of
 * 2026-11-10: with the top style `hlogo`, the horizontal logo on its amber tile stands in place of
 * the logo box and the series banner, and every other part stays.
 * @param kind The cover kind.
 * @param assets The assets.
 * @param bleedMm The bleed.
 * @param top The top chrome style.
 * @returns The HTML fragment.
 */
function backBody(kind: QuestCoverKind, assets: QuestRenderAssets, bleedMm: number, top: QuestTopStyle): string {
    const parts = [artLayer(kind, assets, bleedMm)];
    if (top === 'hlogo') {
        parts.push(logoTile(kind, bleedMm));
    } else {
        parts.push(logoBox(kind, assets, bleedMm), seriesBanner(kind, 'back', bleedMm));
    }
    if (kind === 'student-back') parts.push(panel(bleedMm, assets.panelValues ?? [], top));
    parts.push(
        contactSign(kind, bleedMm),
        contactLines(bleedMm),
        publisherMark(kind, assets, bleedMm),
        qrBox(kind, bleedMm),
        lineLabel(kind, bleedMm),
    );
    return parts.join('\n');
}

/**
 * Builds the body of the A3 reader cover (`options/build.py`, `a_reader`). The default top style is
 * the game bar with the band word, the series banner, the week pill, the title plaque, and the role
 * bar. The round of 2026-11-11: with the top style `hlogo`, the horizontal logo on its amber tile
 * is the only top chrome. The round of 2026-11-11 (readers r2b): with `hlogo`, the title plaque
 * takes the amber book plaque style, the week pill and the role bar take the logo amber and brown,
 * and the role bar fits its text with even padding. The round of 2026-11-11 (readers r2c): with
 * `hlogo`, the week pill and the role bar letters take 80 % of the inner height, the pill hugs its
 * text with an even padding, and both stay centred on the page. The round of 2026-11-11 (F2,
 * Daniel's look): with `hlogo`, the page holds no logo tile; the pill, the plaque, and the bar stay.
 * @param reader The reader row.
 * @param assets The assets.
 * @param bleedMm The bleed.
 * @param top The top chrome style.
 * @returns The HTML fragment.
 */
function readerA3Body(
    reader: QuestReaderRow,
    assets: QuestRenderAssets,
    bleedMm: number,
    top: QuestTopStyle,
): string {
    const kind: QuestCoverKind = 'reader-a3';
    const bandWord = boxOf(kind, 'band-word');
    const weekPill = boxOf(kind, 'week-pill');
    const plaque = boxOf(kind, 'title-plaque');
    const roleBar = boxOf(kind, 'role-bar');
    const colour = STORYTIME_LEVEL_COLOURS[reader.level] ?? A.blue;
    const placement = top === 'hlogo' ? questChromePlacement(kind, reader.picture.fileName, reader.title, reader.roleLabel) : null;
    const page = questPageSize(kind, 0);
    const pillLeftCss = `left:${mm(READER_PILL_CENTRE_MM + (placement?.pillDxMm ?? 0) + bleedMm)}`;
    const pillShiftCss = 'transform:translateX(-50%);';
    const pillTopMm = weekPill.topMm + (placement?.pillDyMm ?? 0);
    const barLeftCss = placement && placement.subDxMm !== 0 ? `left:${mm(page.widthMm / 2 + placement.subDxMm + bleedMm)}` : 'left:50%';
    const barShiftCss = 'transform:translateX(-50%);';
    const barTopMm = roleBar.topMm + (placement?.subDyMm ?? 0);
    const weekPillHtml =
        top === 'hlogo'
            ? `<div data-part="week-pill" class="quest-c" style="position:absolute;${pillLeftCss};` +
              `top:${mm(pillTopMm + bleedMm)};${pillShiftCss}width:max-content;box-sizing:border-box;` +
              `height:${mm(weekPill.heightMm)};padding:0 ${mm(READER_PILL_PADDING_MM)};border-radius:5mm;` +
              `background-color:${LOGO_AMBER};border:0.6mm solid ${LOGO_BROWN};color:${LOGO_BROWN};font-weight:700;` +
              `font-size:${mm(READER_PILL_CAP_FONT_MM)};line-height:${mm(weekPill.heightMm - 1.2)}">` +
              `<span style="position:relative;top:${mm(READER_PILL_TEXT_SHIFT_MM)}">${esc(reader.weekText)}</span></div>`
            : `<div data-part="week-pill" class="quest-c" style="${boxStyle(weekPill, bleedMm)};box-sizing:border-box;border-radius:5mm;` +
              `background-color:${A.navy};border:0.6mm solid ${AMBER};color:${AMBER};font-weight:700;font-size:14pt;` +
              `line-height:${mm(weekPill.heightMm - 1.2)}">${esc(reader.weekText)}</div>`;
    const plaqueHtml =
        top === 'hlogo'
            ? readerTitlePlaque(reader.title, bleedMm, placement)
            : `<div data-part="title-plaque" data-plaque-colour="${colour}" style="${boxStyle(plaque, bleedMm)}">` +
              plaqueSvg(plaque.widthMm, plaque.heightMm, colour) +
              `<div class="quest-c" style="position:absolute;left:0;top:8mm;width:${mm(plaque.widthMm)};color:#fff;` +
              `font-family:'League Spartan';font-weight:700;font-size:40pt;line-height:1">${esc(reader.title)}</div></div>`;
    const roleBarHtml =
        top === 'hlogo'
            ? `<div data-part="role-bar" class="quest-c" style="position:absolute;${barLeftCss};top:${mm(barTopMm + bleedMm)};` +
              `${barShiftCss}width:max-content;height:${mm(roleBar.heightMm)};box-sizing:border-box;` +
              `padding:0 ${mm(READER_BAR_PADDING_MM)};background-color:${LOGO_AMBER};border-radius:2mm;` +
              `border:0.6mm solid ${LOGO_BROWN};color:${LOGO_BROWN};line-height:${mm(roleBar.heightMm - 1.2)}">` +
              `${roleMark(roleKeyOfLabel(reader.roleLabel), reader.roleLabel, LOGO_BROWN, 7, `font-weight:700;font-size:${mm(READER_BAR_LETTER_FONT_MM)};position:relative;top:${mm(READER_BAR_TEXT_SHIFT_MM)}`, `;position:relative;top:${mm(READER_BAR_ICON_SHIFT_MM)}`)}</div>`
            : `<div data-part="role-bar" class="quest-c" style="${boxStyle(roleBar, bleedMm)};box-sizing:border-box;` +
              `background-color:${A.navy};border-radius:2mm;border:0.6mm solid ${A.steel};color:#fff;` +
              `line-height:${mm(roleBar.heightMm - 1.2)}">${roleMark(roleKeyOfLabel(reader.roleLabel), reader.roleLabel, '#FFFFFF', 7, 'font-weight:700;font-size:15pt')}</div>`;
    if (top === 'hlogo') {
        return [artLayer(kind, assets, bleedMm, placement?.artPosition ?? null), weekPillHtml, plaqueHtml, roleBarHtml].join('\n');
    }
    return [
        artLayer(kind, assets, bleedMm),
        gameBar(kind, reader.litBand, null, bleedMm),
        `<div data-part="band-word" style="${boxStyle(bandWord, bleedMm)};font-family:'League Spartan';font-weight:700;` +
            `font-size:6.2mm;line-height:${mm(bandWord.heightMm)};color:${AMBER}">${esc(reader.litBand.toUpperCase())}</div>`,
        seriesBanner(kind, 'reader', bleedMm),
        weekPillHtml,
        plaqueHtml,
        roleBarHtml,
    ].join('\n');
}

/**
 * The role key of a role label.
 * @param label The label.
 * @returns The role key.
 */
function roleKeyOfLabel(label: string): string {
    for (const key of ['listen', 'sound', 'firstSound'] as const) {
        if (QUEST_ROLE_LABELS[key] === label) return key;
    }
    return 'listen';
}

/**
 * Builds the body of the black-and-white reader leaf (`options/build.py`, `leaf`): the double-line
 * frame, the plaque with the title, and the meta row. Only black, white, and grey appear. The round
 * of 2026-11-11 (readers r2b) adds the K logo tile at the top with the top style hlogo; the default
 * leaf holds no tile. The round of 2026-11-11 (readers r2c): with `hlogo`, the plaque takes the r2
 * book plaque drawing in the K grays, the title fills 80 % of the band, the band word and the band
 * icons go, and the series, the week, and the role line move into one centred footer. The round of
 * 2026-11-11 (F1 and F2, Daniel's look): with `hlogo`, the art fills the page with no double-line
 * frame and no logo tile; the default leaf keeps the frame, its bytes, and its box table entry.
 * @param reader The reader row.
 * @param assets The assets.
 * @param bleedMm The bleed.
 * @param top The top chrome style.
 * @returns The HTML fragment.
 */
function leafBody(
    reader: QuestReaderRow,
    assets: QuestRenderAssets,
    bleedMm: number,
    top: QuestTopStyle,
    leafMark = '',
): string {
    const kind: QuestCoverKind = 'reader-leaf';
    const black = '#000000';
    const white = '#ffffff';
    const frame = boxOf(kind, 'double-line-frame');
    const plaque = boxOf(kind, 'title-plaque');
    const bandWord = boxOf(kind, 'band-word');
    const series = boxOf(kind, 'series');
    const week = boxOf(kind, 'week');
    const role = boxOf(kind, 'role-mark');
    const frameHtml =
        `<div data-part="double-line-frame" style="${boxStyle(frame, bleedMm)}">` +
        `<svg viewBox="0 0 182 104" style="position:absolute;left:0;top:0;width:182mm;height:104mm">` +
        `<rect x="0.5" y="0.5" width="181" height="103" rx="5" fill="none" stroke="${black}" stroke-width="1"/>` +
        `<rect x="2.3" y="2.3" width="177.4" height="99.4" rx="4" fill="none" stroke="${black}" stroke-width="0.4"/></svg></div>`;
    if (top === 'hlogo') {
        const placement = questChromePlacement(kind, reader.picture.lineArtFileName, reader.title, reader.roleLabel);
        return [
            artLayer(kind, assets, bleedMm, placement.artPosition),
            leafFooterStrip(reader, bleedMm, placement, leafMark),
            leafTitlePlaque(reader.title, bleedMm, placement),
            leafFooter(reader, bleedMm, placement),
        ].join('\n');
    }
    const glyphs = QUEST_BANDS.map((band, index) =>
        bandGlyph(band, 3 + index * 7, 3.5, 5.2, band === 'sprout' ? black : white, black, white, 1.3),
    ).join('');
    return [
        artLayer(kind, assets, bleedMm),
        frameHtml,
        `<div data-part="title-plaque" style="${boxStyle(plaque, bleedMm)}">` +
            `<svg viewBox="0 0 110 20" style="position:absolute;left:0;top:0;width:110mm;height:20mm">` +
            `<path d="M0 5 L5 0 H105 L110 5 V15 L105 20 H5 L0 15Z" fill="${white}" stroke="${black}" stroke-width="0.8"/>` +
            `<path d="M1.6 5.6 L5.6 1.6 H104.4 L108.4 5.6 V14.4 L104.4 18.4 H5.6 L1.6 14.4Z" fill="none" stroke="${black}" stroke-width="0.35"/>` +
            `<path d="M-6 10 L0 4 L6 10 L0 16Z" fill="${white}" stroke="${black}" stroke-width="0.5"/>` +
            `<path d="M104 10 L110 4 L116 10 L110 16Z" fill="${white}" stroke="${black}" stroke-width="0.5"/></svg>` +
            `<div class="quest-c" style="position:absolute;left:0;top:3.5mm;width:110mm;color:${black};` +
            `font-family:'League Spartan';font-weight:700;font-size:20pt;line-height:1">${esc(reader.title)}</div></div>`,
        `<div data-part="band-word" style="${boxStyle(bandWord, bleedMm)};font-weight:700;font-size:9pt;` +
            `letter-spacing:1.2pt;line-height:${mm(bandWord.heightMm)};color:${black}">${esc(reader.litBand.toUpperCase())}</div>`,
        `<svg viewBox="0 0 36 7" style="position:absolute;left:${mm(10 + bleedMm)};top:${mm(137 + bleedMm)};width:36mm;height:7mm">${glyphs}</svg>`,
        `<div data-part="series" style="${boxStyle(series, bleedMm)};font-size:9pt;line-height:${mm(series.heightMm)};color:${black}">${esc(STORYTIME_SERIES)}</div>`,
        `<div data-part="week" style="${boxStyle(week, bleedMm)};font-size:9pt;line-height:${mm(week.heightMm)};color:${black}">${esc(reader.weekText)}</div>`,
        `<div data-part="role-mark" style="${boxStyle(role, bleedMm)};font-size:9pt;line-height:${mm(role.heightMm)};color:${black}">` +
            `${roleMark(roleKeyOfLabel(reader.roleLabel), reader.roleLabel, black, 4.6, '')}</div>`,
    ].join('\n');
}

/**
 * Draws the title plaque of the leaf reader cover with the top style hlogo (readers r2c, E4 and E6;
 * the round of 2026-11-11, standing rules): the r2 book plaque drawing in the K grays at the width
 * of the title plus 2 x 21 mm between 110 mm and 182 mm, centered on the 198 mm page, and the title
 * in League Spartan 700 with a cap height of 80 % of the band, centered in the band between the
 * crystal groups, with one vertical shift so that its ink box stands at the band centre (S3, S4).
 * @param title The title of the reader.
 * @param bleedMm The bleed.
 * @returns The HTML.
 */
function leafTitlePlaque(title: string, bleedMm: number, placement: QuestChromePlacement | null = null): string {
    const page = questPageSize('reader-leaf', bleedMm);
    const scale = placement?.scale ?? 1;
    const crystalInset = 0;
    const fontMm = LEAF_TITLE_FONT_MM * scale;
    const geometry = leafPlaqueGeometry(title);
    const widthMm = geometry.widthMm * scale;
    const bandMm = (LEAF_PLAQUE_HEIGHT_MM - READER_PLAQUE_BAND_INSET_MM) * scale;
    const heightMm = LEAF_PLAQUE_HEIGHT_MM * scale;
    const leftMm = (page.widthMm - widthMm) / 2 + (placement?.plaqueDxMm ?? 0);
    const topMm = LEAF_PLAQUE_TOP_MM + LEAF_PLAQUE_HEIGHT_MM + (placement?.plaqueDyMm ?? 0) - heightMm;
    const lineTopMm = titleLineTopMm(title, fontMm, PLAQUE_BAND_EDGE_MM * scale, bandMm);
    return (
        `<div data-part="title-plaque" data-plaque-colour="${LEAF_PLAQUE_BAND}" style="position:absolute;` +
        `left:${mm(leftMm + bleedMm)};top:${mm(topMm + bleedMm)};width:${mm(widthMm)};` +
        `height:${mm(heightMm)}">` +
        plaqueSvg(geometry.widthMm, LEAF_PLAQUE_HEIGHT_MM, LEAF_PLAQUE_BAND, true, PLAQUE_K_PALETTE, scale, crystalInset, LEAF_CRYSTAL_SCALE) +
        `<div class="quest-c" style="position:absolute;left:0;top:${mm(lineTopMm)};` +
        `width:${mm(widthMm)};height:${mm(fontMm)};` +
        `color:#000000;font-family:'League Spartan';font-weight:700;` +
        `font-size:${mm(fontMm)};line-height:${mm(fontMm)};font-kerning:none">${esc(title)}</div></div>`
    );
}

/**
 * Draws the footer content of the leaf reader cover with the top style hlogo: the series, the week,
 * and the role line, with the role icons (readers r2c, E8). The round of 2026-11-12 (F4) draws the
 * same content twice: once in the footer, and once hidden inside the white strip, so that the strip
 * fits the footer text.
 * @param reader The reader row.
 * @param stroke The stroke colour of the role icons.
 * @param parts When true, the text spans carry the `data-part` marks of the footer.
 * @returns The HTML.
 */
function leafFooterContent(reader: QuestReaderRow, stroke: string, parts: boolean): string {
    const mark = parts ? ' data-part="series"' : '';
    const weekMark = parts ? ' data-part="week"' : '';
    const role = parts ? '<span data-part="role-mark">' : '<span>';
    return (
        `<span${mark}>${esc(STORYTIME_SERIES)}</span> \u00b7 ` +
        `<span${weekMark}>${esc(reader.weekText)}</span> \u00b7 ` +
        `${role}${roleMark(roleKeyOfLabel(reader.roleLabel), reader.roleLabel, stroke, 4.6, '')}</span>`
    );
}

/**
 * Draws the footer of the leaf reader cover with the top style hlogo (readers r2c, E8 and E9): the
 * series, the week, and the role line in one centered line at 9 pt, with no bar. The round of
 * 2026-11-12 (F4) moves it by the placement step, and keeps its 9 pt size.
 * @param reader The reader row.
 * @param bleedMm The bleed.
 * @param placement The placement of the chrome (D3).
 * @returns The HTML.
 */
function leafFooter(reader: QuestReaderRow, bleedMm: number, placement: QuestChromePlacement | null = null): string {
    const page = questPageSize('reader-leaf', bleedMm);
    const topMm = LEAF_FOOTER_TOP_MM + (placement?.subDyMm ?? 0);
    const shift = placement && placement.subDxMm !== 0 ? `transform:translateX(${mm(placement.subDxMm)});` : '';
    return (
        `<div data-part="footer" class="quest-c" style="position:absolute;left:${mm(bleedMm)};` +
        `top:${mm(topMm + bleedMm)};width:${mm(page.widthMm - 2 * bleedMm)};` +
        `height:${mm(LEAF_FOOTER_HEIGHT_MM)};font-size:9pt;line-height:${mm(LEAF_FOOTER_HEIGHT_MM)};color:#000000;${shift}">` +
        `${leafFooterContent(reader, '#000000', true)}</div>`
    );
}

/**
 * Draws the white strip of the leaf reader footer (the PM look of 2026-11-11, F4; D5): one top-level
 * part `footer-strip`, `#FFFFFF`, opaque, with no border, at least 1 mm around the footer ink. It
 * stands behind the footer, and its width follows the footer text, so that no line art crosses a
 * letter. The 1 mm ring comes from the measured painted footer box of the role base of 2026-11-12
 * (`137.26` mm to `142.98` mm high).
 * @param reader The reader row.
 * @param bleedMm The bleed.
 * @param placement The placement of the chrome (D3).
 * @returns The HTML.
 */
function leafFooterStrip(reader: QuestReaderRow, bleedMm: number, placement: QuestChromePlacement | null = null, leafMark = ''): string {
    const page = questPageSize('reader-leaf', bleedMm);
    const topMm = LEAF_FOOTER_PAINT_TOP_MM - KEY_CLEARANCE_MM + (placement?.subDyMm ?? 0);
    const heightMm = LEAF_FOOTER_PAINT_HEIGHT_MM + 2 * KEY_CLEARANCE_MM;
    const centreMm = page.widthMm / 2 + (placement?.subDxMm ?? 0);
    const widthMm = LEAF_FOOTER_PAINT_WIDTH_MM[reader.roleLabel] ?? LEAF_FOOTER_PAINT_WIDTH_MAX_MM;
    const box: QuestMmBox = {
        left: centreMm - widthMm / 2 - KEY_CLEARANCE_MM,
        top: topMm,
        right: centreMm + widthMm / 2 + KEY_CLEARANCE_MM,
        bottom: topMm + heightMm,
    };
    let markHtml = '';
    let markBoxHtml = '';
    if (leafMark) {
        const place = leafMarkPlace(reader.picture.lineArtFileName, reader.title, reader.roleLabel);
        const ring = questGrow(place, 2 * KEY_CLEARANCE_MM);
        // D-P9-R1: a ring in the footer band joins the footer box (one box, as before; the band is
        // the vertical range of the box, because weeks 1 to 6 keep a gap beside the footer text and
        // their bytes). A ring far above or below the band gets its own white box, so the strip
        // never grows over the art.
        const joined = Math.min(ring.bottom, box.bottom) - Math.max(ring.top, box.top) > 0;
        const holder: QuestMmBox = joined
            ? {
                  left: Math.min(box.left, ring.left),
                  top: Math.min(box.top, ring.top),
                  right: Math.max(box.right, ring.right),
                  bottom: Math.max(box.bottom, ring.bottom),
              }
            : ring;
        const markSpan =
            `<span data-part="leaf-mark" style="position:absolute;left:${mm(place.left - holder.left)};` +
            `top:${mm(place.top - holder.top)};width:${mm(place.right - place.left)};` +
            `height:${mm(place.bottom - place.top)};font-size:5pt;line-height:${mm(place.bottom - place.top)};` +
            `white-space:nowrap;color:#000000;text-align:left">${esc(leafMark)}</span>`;
        if (joined) {
            box.left = holder.left;
            box.top = holder.top;
            box.right = holder.right;
            box.bottom = holder.bottom;
            markHtml = markSpan;
        } else {
            markBoxHtml =
                `<div data-part="leaf-mark-box" style="position:absolute;left:${mm(ring.left + bleedMm)};` +
                `top:${mm(ring.top + bleedMm)};width:${mm(ring.right - ring.left)};height:${mm(ring.bottom - ring.top)};` +
                `background-color:#FFFFFF">${markSpan}</div>`;
        }
    }
    return (
        `<div data-part="footer-strip" style="position:absolute;left:${mm(box.left + bleedMm)};` +
        `top:${mm(box.top + bleedMm)};width:${mm(box.right - box.left)};height:${mm(box.bottom - box.top)};` +
        `background-color:#FFFFFF;font-size:9pt;line-height:${mm(LEAF_FOOTER_HEIGHT_MM)};color:#000000">` +
        `${markHtml}</div>${markBoxHtml}`
    );
}

/**
 * The `@font-face` rules of the template: the shared faces of the approved covers plus the League
 * Spartan face of the banner and the level line.
 * @returns The CSS.
 */
export function questFontFaces(): string {
    const league =
        `@font-face { font-family: 'League Spartan'; font-weight: 700; font-style: normal; ` +
        `src: url('file://${PRINT_FONT_DIR}/league-spartan-latin-700-normal.woff2') format('woff2'); }`;
    return `${storytimeCoverFontCss()}\n${league}`;
}

/**
 * The CSS of one rendered document (spec FR-6.8, FR-9.1). The leaf holds black, white, and grey
 * only.
 * @param kind The cover kind.
 * @param bleedMm The bleed.
 * @returns The CSS.
 */
function documentCss(kind: QuestCoverKind, bleedMm: number): string {
    const page = questPageSize(kind, bleedMm);
    const leaf = kind === 'reader-leaf';
    const rules = [
        questFontFaces(),
        `@page { size: ${mm(page.widthMm)} ${mm(page.heightMm)}; margin: 0; }`,
        `html, body { margin: 0; padding: 0; background: #ffffff; }`,
        `body { font-synthesis: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`,
        `.quest-page { position: relative; overflow: hidden; background: #ffffff; color: #1a1a1a; width: ${mm(page.widthMm)}; height: ${mm(page.heightMm)}; font-family: 'Andika', 'Sarabun', sans-serif; }`,
        `.quest-c { text-align: center; white-space: nowrap; }`,
        `svg { overflow: visible; }`,
    ];
    if (!leaf) {
        rules.push(`.quest-unit-slot { fill: #0E1A33; }`);
        rules.push(`[data-filled="true"] .quest-unit-slot { fill: #8BD14A; }`);
        rules.push(`.quest-qr svg { display: block; width: 100%; height: 100%; }`);
        rules.push(`.quest-contact-line { margin: 0; }`);
        rules.push(`.quest-contact-head { font-weight: 700; }`);
    }
    return rules.join('\n');
}

/**
 * Wraps one body into a full HTML document with one `@page` rule (pin P2).
 * @param kind The cover kind.
 * @param bleedMm The bleed.
 * @param body The body.
 * @returns The document.
 */
function documentOf(kind: QuestCoverKind, bleedMm: number, body: string): string {
    return (
        `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>${esc(STORYTIME_SERIES)}</title>\n` +
        `<style>\n${documentCss(kind, bleedMm)}\n</style>\n</head>\n<body>\n` +
        `<div class="quest-page" data-quest-kind="${kind}">\n${body}\n</div>\n</body>\n</html>`
    );
}

/**
 * Renders one cover side into one full HTML document (pin P2). The 2 readers take the top style
 * too: with `hlogo`, the logo tile is the A3 top chrome, the A3 chrome takes the logo colors, and
 * the leaf cover holds the K logo tile (round of 2026-11-11, readers r2b).
 * @param kind The cover kind.
 * @param subject The book row or the reader row.
 * @param assets The assets of the render.
 * @param opts The options: the bleed, and the top chrome style (the alternate A2 of 2026-11-10).
 * @returns The document.
 * @throws Error When the bleed is not 0 or 3, or the kind is a reader side without a reader row.
 */
export function renderQuestCover(
    kind: QuestCoverKind,
    subject: QuestBookRow | QuestReaderRow,
    assets: QuestRenderAssets,
    opts: QuestRenderOptions,
): string {
    const bleedMm = opts?.bleedMm ?? 0;
    const top = opts?.top ?? 'banner';
    questPageSize(kind, bleedMm);
    if (kind === 'reader-a3' || kind === 'reader-leaf') {
        const reader = subject as QuestReaderRow;
        const body = kind === 'reader-a3' ? readerA3Body(reader, assets, bleedMm, top) : leafBody(reader, assets, bleedMm, top);
        return documentOf(kind, bleedMm, body);
    }
    const book = subject as QuestBookRow;
    const body =
        kind === 'student-back' || kind === 'teacher-back'
            ? backBody(kind, assets, bleedMm, top)
            : frontBody(kind, book, assets, bleedMm, top);
    return documentOf(kind, bleedMm, body);
}

/**
 * The CSS of one reader cover page for the print track (spec FR-9.5, D-A4, T17): every selector
 * starts with `.quest-`, the text holds no `@page` rule, and the print track owns the page rule.
 * @param trim The trim of the page.
 * @returns The CSS.
 */
export function questReaderPageCss(trim: QuestTrim): string {
    return [
        `.quest-reader-page { position: relative; overflow: hidden; background: #ffffff; color: #1a1a1a; width: ${mm(trim.widthMm)}; height: ${mm(trim.heightMm)}; font-family: 'Andika', 'Sarabun', sans-serif; font-synthesis: none; }`,
        `.quest-reader-page .quest-c { text-align: center; white-space: nowrap; }`,
        `.quest-reader-page svg { overflow: visible; }`,
        `.quest-reader-page .quest-art { position: absolute; }`,
    ].join('\n');
}

/**
 * Renders one reader cover page as a body and a CSS text, for the print track (spec FR-9.5, D-A4).
 * The body holds no document tag, and the CSS holds no `@page` rule. The A3 page takes the top
 * style: with `hlogo`, the chrome takes the logo colors. The leaf page takes it too: with `hlogo`,
 * it holds the K logo tile (round of 2026-11-11, readers r2b).
 * @param reader The reader row.
 * @param trim The trim of the page.
 * @param assets The assets.
 * @param opts The options: the bleed, and the top chrome style.
 * @returns The body and the CSS.
 */
export function questReaderCoverPage(
    reader: QuestReaderRow,
    trim: QuestTrim,
    assets: QuestRenderAssets,
    opts: QuestRenderOptions,
): { body: string; css: string } {
    const bleedMm = opts?.bleedMm ?? 0;
    const top = opts?.top ?? 'banner';
    questPageSize(trim.widthMm >= 300 ? 'reader-a3' : 'reader-leaf', bleedMm);
    const body =
        trim.widthMm >= 300 ? readerA3Body(reader, assets, bleedMm, top) : leafBody(reader, assets, bleedMm, top, opts?.leafMark ?? '');
    return { body: `<div class="quest-reader-page">\n${body}\n</div>`, css: questReaderPageCss(trim) };
}
