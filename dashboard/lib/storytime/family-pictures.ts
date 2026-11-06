import { fontFaceCss } from './print/print-fonts';
import { STORYTIME_CARD_COLOR_PATCH, STORYTIME_CARD_NUMBER_DOTS } from './print/card-kit';

/**
 * The family-word pictures of the Storytime app (Phase 10, spec FR 1): the source mapping of a
 * family word (decision H3), the app dot table with the card of ten (decision H4), the picture
 * markup and the page of a color patch or a number card (decision H5), the source name of the
 * provenance file (decision H7), and the package path of one picture (decision H2).
 *
 * The module is pure: it reads no file and starts no browser. The script
 * `scripts/storytime/set-family-pictures.ts` renders and writes its output.
 */

/** The most dots of one row of a number card (the rule of the print card kit). */
const DOT_ROW_MAX = 5;

/** The radius of one dot of a number card, in the units of the view box. */
const DOT_RADIUS = 7;

/** The gap between two dots of one row, in the units of the view box. */
const DOT_GAP = 4;

/** The height of one dot row, in the units of the view box. */
const DOT_ROW_HEIGHT = 22;

/** The top offset of the first dot row, in the units of the view box. */
const DOT_TOP = 4;

/** The width of the view box of the dot group. */
const DOT_VIEW_WIDTH = 100;

/** The corner radius of a color patch, in millimeters (the value of the print card kit). */
const PATCH_RADIUS_MM = 6;

/** The safe margin of the page, in millimeters (the safe margin of a card). */
const PAGE_MARGIN_MM = 4;

/** The width and the height of the page, in CSS pixels (decision H5). */
const PAGE_SIZE_PX = 400;

/** The family word form of a package path: lower-case letters only (decision H2). */
const FAMILY_WORD = /^[a-z]+$/;

/**
 * The dot count of each number word card of the app: the nine counts of the print card kit and
 * the card of ten (decision H4). The app card of ten shows the numeral 10 and ten dots in two rows
 * of five. The print card kit does not change.
 */
export const STORYTIME_APP_NUMBER_DOTS: Readonly<Record<string, number>> = {
    ...STORYTIME_CARD_NUMBER_DOTS,
    ten: 10,
};

/**
 * The source of one family-word picture (decision H3). A `patch` is a color word of the print card
 * kit, a `dots` is a number word, a `card` is a picture of the card folder, and a `forge` is a
 * picture of the Forge folder. A Forge word with no color file has `fileName: undefined`.
 */
export type StorytimeFamilyPictureSource =
    | { kind: 'patch'; word: string; hex: string }
    | { kind: 'dots'; word: string; count: number }
    | { kind: 'card'; word: string; fileName: string }
    | { kind: 'forge'; word: string; fileName: string | undefined };

/** The part of a source that the card markup, the page, and the render take. */
export type StorytimeFamilyCardSource = Extract<
    StorytimeFamilyPictureSource,
    { kind: 'patch' } | { kind: 'dots' }
>;

/**
 * The HTML escape of a card word, with the rules of the print card kit.
 * @param text The text.
 * @returns The text with `&`, `<`, `>`, and `"` escaped.
 */
const esc = (text: string): string =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The millimeters of an SVG value, with at most three decimals (the rule of the print card kit).
 * @param value The value.
 * @returns The value as text.
 */
const mm = (value: number): string => String(Number(value.toFixed(3)));

/**
 * The six-digit hex value of a patch, in upper case.
 * @param hex The value of the source, with or without the `#`.
 * @returns The value with one `#` and six upper-case digits.
 */
function patchHex(hex: string): string {
    return `#${hex.replace(/^#/, '').toUpperCase()}`;
}

/**
 * The text with the regular-expression syntax escaped, so that a file stem matches as written.
 * @param text The text.
 * @returns The text for a regular expression.
 */
const regexpLiteral = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The two-digit week of a package path.
 * @param week The week.
 * @returns The week with a leading zero when it is below 10.
 */
function weekDigits(week: number): string {
    return String(week).padStart(2, '0');
}

/**
 * The picture area of a number word card: the numeral and its dots, in one or two rows of at most
 * five dots. The markup equals the one that the print card kit writes for the same count.
 * @param count The dot count.
 * @returns The HTML of the picture area.
 */
function numberDotsHtml(count: number): string {
    const rows = Math.ceil(count / DOT_ROW_MAX);
    const dots: string[] = [];
    for (let row = 0; row < rows; row += 1) {
        const inRow = Math.min(DOT_ROW_MAX, count - row * DOT_ROW_MAX);
        const rowWidth = inRow * 2 * DOT_RADIUS + (inRow - 1) * DOT_GAP;
        for (let index = 0; index < inRow; index += 1) {
            const cx = (DOT_VIEW_WIDTH - rowWidth) / 2 + DOT_RADIUS + index * (2 * DOT_RADIUS + DOT_GAP);
            const cy = DOT_RADIUS + DOT_TOP + row * DOT_ROW_HEIGHT;
            dots.push(`<circle data-number-dot="1" data-row="${row}" cx="${mm(cx)}" cy="${mm(cy)}" r="${DOT_RADIUS}"/>`);
        }
    }
    return `<div class="card-picture card-number-picture"><div class="card-number" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3mm"><div class="card-numeral" data-card-numeral style="font-size:60pt;line-height:1;font-weight:700">${count}</div><svg class="card-number-dots" viewBox="0 0 ${DOT_VIEW_WIDTH} ${rows * DOT_ROW_HEIGHT}" style="width:100%;height:auto;max-height:50%" aria-hidden="true">${dots.join('')}</svg></div></div>`;
}

/**
 * The picture markup of one family-word card (decision H5). A color word gives the rounded
 * rectangle of its hex value. A number word gives the numeral and its dots. The app shows the
 * picture area only, so the markup holds no label.
 * @param source The color patch or the number card.
 * @returns The HTML of the picture area.
 */
export function familyCardPictureHtml(source: StorytimeFamilyCardSource): string {
    if (source.kind === 'patch') {
        const hex = patchHex(source.hex);
        return `<div class="card-picture card-patch-picture"><div class="card-color-patch" data-card-patch="${esc(source.word)}" data-shape="rounded-rectangle" data-color="${hex}" style="background-color:${hex};width:100%;height:100%;align-self:stretch;border-radius:${PATCH_RADIUS_MM}mm"></div></div>`;
    }
    return numberDotsHtml(source.count);
}

/**
 * The page of one family-word card (decision H5). The page is one HTML document of 400 x 400 CSS
 * pixels with a white background, the print faces, the card safe margin, and the picture area. The
 * rules of the picture area repeat the rules of the card sheet, because the sheet CSS is private.
 * @param source The color patch or the number card.
 * @returns The HTML document.
 */
export function familyCardPageHtml(source: StorytimeFamilyCardSource): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Storytime family picture: ${esc(source.word)}</title>
<style>
${fontFaceCss()}
@page { size: ${PAGE_SIZE_PX}px ${PAGE_SIZE_PX}px; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #FFFFFF; }
body { width: ${PAGE_SIZE_PX}px; height: ${PAGE_SIZE_PX}px; padding: ${PAGE_MARGIN_MM}mm; display: flex; flex-direction: column; overflow: hidden; font-family: 'Andika', sans-serif; font-weight: 400; color: #000; }
.card-picture { flex: 1; width: 100%; min-height: 0; display: flex; align-items: center; justify-content: center; }
</style>
</head>
<body>
${familyCardPictureHtml(source)}
</body>
</html>
`;
}

/**
 * The source name of one family-word card for the provenance file (decision H7).
 * @param source The color patch or the number card.
 * @returns `card-kit-patch-<word>-<HEX>` or `card-kit-dots-<word>-<count>`.
 */
export function familyCardSourceName(source: StorytimeFamilyCardSource): string {
    if (source.kind === 'patch') return `card-kit-patch-${source.word}-${patchHex(source.hex).slice(1)}`;
    return `card-kit-dots-${source.word}-${source.count}`;
}

/**
 * The package path of one family-word picture (decision H2).
 * @param level The level.
 * @param week The week, from 1 to 99.
 * @param word The family word: lower-case letters only.
 * @returns The path relative to the content folder, for example `l2/media/w01/family/hello.jpg`.
 * @throws Error When the word is not lower-case letters, or the week is outside 1 to 99.
 */
export function storytimeFamilyPicturePath(level: number, week: number, word: string): string {
    if (!FAMILY_WORD.test(word)) throw new Error(`family picture: not a family word: ${word}`);
    if (!Number.isInteger(week) || week < 1 || week > 99) {
        throw new Error(`family picture: week outside 1 to 99: ${week}`);
    }
    return `l${level}/media/w${weekDigits(week)}/family/${word}.jpg`;
}

/**
 * The source of one family word, by the priority of decision H3: a color patch, a number card, a
 * picture of the card folder, or a picture of the Forge folder.
 * @param input The level, the week, the word, the card rows, and the file names of both folders.
 * @returns The source of the word.
 * @throws Error When two Forge color files name the same word. The message starts with
 * `family picture:`.
 */
export function storytimeFamilyPictureSource(input: {
    level: number;
    week: number;
    word: string;
    cardEntries: readonly { word: string; week: number }[];
    cardFiles: ReadonlySet<string>;
    forgeFiles: ReadonlySet<string>;
}): StorytimeFamilyPictureSource {
    const { word } = input;
    if (Object.prototype.hasOwnProperty.call(STORYTIME_CARD_COLOR_PATCH, word)) {
        return { kind: 'patch', word, hex: STORYTIME_CARD_COLOR_PATCH[word] };
    }
    if (Object.prototype.hasOwnProperty.call(STORYTIME_APP_NUMBER_DOTS, word)) {
        return { kind: 'dots', word, count: STORYTIME_APP_NUMBER_DOTS[word] };
    }
    const stem = `l${input.level}-w${weekDigits(input.week)}-card-${word}`;
    const cardName = `${stem}-v1.png`;
    const row = input.cardEntries.some((entry) => entry.word === word && entry.week === input.week);
    if (row && input.cardFiles.has(cardName)) return { kind: 'card', word, fileName: cardName };
    const forgeName = new RegExp(`^${regexpLiteral(stem)}-v([1-9][0-9]*)\\.png$`);
    const found = [...input.forgeFiles].filter((name) => forgeName.test(name)).sort();
    if (found.length > 1) {
        throw new Error(`family picture: ${word} has ${found.length} color files: ${found.join(', ')}`);
    }
    return { kind: 'forge', word, fileName: found[0] };
}
