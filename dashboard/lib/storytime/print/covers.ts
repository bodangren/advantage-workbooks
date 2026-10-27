import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { BACK_LINES, richHtml } from '../../covers/back-text';
import { THAI } from '../../document-wrapper/print-fonts';
import { REPO_ROOT } from '../../lesson-package/files';
import { generateQRCode } from '../../qr-generator';
import type { StorytimeWeek } from '../schema';

/**
 * The cover module of the Storytime Advantage student books (track storytime_covers_20261027):
 * the data of the 16 books, the HTML of the front and the back, and the checks of the built
 * files (spec FR-1 to FR-6).
 *
 * The copy of a cover follows the assignment A-18 (a): the Storytime look, the full product
 * name, no CEFR text, no level badge, no date, and the five approved Thai contact lines on the
 * back. The picture of every book is the Forge 3D cast, cut out on white (D4).
 */

/** The name of the series, on every cover (assignment A-18 (a), rule 2). */
export const STORYTIME_SERIES = 'Storytime Advantage';

/** The LINE Official address of the back cover (assignment A-18 (a), rule 7). */
export const STORYTIME_LINE_ADDRESS = 'https://line.me/ti/p/Pf7_EF98Pv';

/** The level colours of the covers (assignment A-18 (a), rule 9; spec FR-1.5). */
export const STORYTIME_LEVEL_COLOURS: Record<number, string> = {
    1: '#E06A1F',
    2: '#2A77B8',
    3: '#3C9B57',
    4: '#8151B8',
};

/** The weeks of a unit: unit 1 holds weeks 1 to 8, unit 4 holds weeks 25 to 32 (spec FR-1.3). */
export const STORYTIME_UNIT_WEEKS: Record<number, [number, number]> = {
    1: [1, 8],
    2: [9, 16],
    3: [17, 24],
    4: [25, 32],
};

/** The trim of a cover: A4 portrait, no bleed, no spine (spec FR-2.1). */
export const STORYTIME_COVER_TRIM = { widthMm: 210, heightMm: 297 };

/** The geometry of the cover sides, in millimetres (spec FR-2 and FR-3). */
export const STORYTIME_COVER_BOX = {
    seriesName: { top: 14 },
    pictureArea: { left: 12, top: 31, width: 186, height: 180 },
    levelCard: { left: 12, top: 217, width: 186, height: 65, radiusMm: 5 },
    logo: { left: 12, top: 12, width: 30, height: 30 },
    panel: { left: 12, top: 48, width: 186, height: 138, radiusMm: 3 },
    contact: { left: 15, top: 200, width: 118 },
    qr: { right: 14, top: 200, width: 44, height: 44 },
    lineLabel: { right: 14, top: 246, width: 44 },
};

/** The data file of the 16 books (spec FR-1). */
export const STORYTIME_COVER_BOOKS_FILE = path.join(REPO_ROOT, 'content', 'storytime', 'covers', 'books.json');

/** The company logo of the back cover (assignment A-18 (a), rule 7). */
export const STORYTIME_COVER_LOGO_FILE = path.join(REPO_ROOT, 'Teacher guide', 'reading-advantage logo.png');

/** The corner radius of the level card and of the unit summary panel, in millimetres. */
export const STORYTIME_COVER_RADIUS_MM = { levelCard: 5, panel: 3 };

/** The corner mode of the build: the radius is flattened into the opaque picture layer. */
export const STORYTIME_COVER_CORNER_MODE = 'radius in the picture layer';

/** One row of the data file: one student book. */
export interface StorytimeCoverBook {
    level: number;
    unit: number;
    firstWeek: number;
    lastWeek: number;
    title: string;
    levelColour: string;
    pictureRecipe: string[];
    summary: null | { text: string; week: number };
}

/** The data file of the 16 books. */
export interface StorytimeCoverData {
    series: string;
    trim: { widthMm: number; heightMm: number };
    levelColours: Record<string, string>;
    lineAddress: string;
    books: StorytimeCoverBook[];
}

/** The QR module grid of a code. */
export interface StorytimeCoverQrGrid {
    modules: number;
    dark: number;
    cells: boolean[][];
}

/** The files of one build: the composed cover picture and the blocks of the cover. */
export interface StorytimeCoverAssets {
    /** The URL of the composed cover picture. */
    picture: string;
    /** The URL of the level card block, with its corner radius. */
    card: string;
    /** The URL of the unit summary panel block, with its corner radius. */
    panel: string;
    /** The URL of the company logo. */
    logo: string;
}

/** The forbidden words of a cover (spec FR-4.2 and FR-4.3). */
const FORBIDDEN_TOKENS = [
    'cefr',
    'starters',
    'primary advantage',
    'gse',
    'yle',
    'reading a-z',
    'raz',
    'chibi',
    'mitr',
    'pre-a1',
    'pre a1',
    'a1',
    'a2',
    'b1',
    'b2',
    'c1',
    'c2',
];

/** The font folder of the print faces (Andika for English, Sarabun for Thai). */
const PRINT_FONT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'assets', 'print-fonts');

/**
 * Converts millimetres to pixels of the 300 ppi cover (the one shared conversion, test strategy
 * 4.3).
 * @param mm The size in millimetres.
 * @returns The size in pixels.
 */
export function storytimeCoverMmToPx(mm: number): number {
    return Math.round((mm / 25.4) * 300);
}

/**
 * Reads the data file of the 16 books.
 * @param file The data file (the shipped one by default).
 * @returns The data.
 */
export function loadStorytimeCoverBooks(file: string = STORYTIME_COVER_BOOKS_FILE): StorytimeCoverData {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimeCoverData;
}

/**
 * Tells a picture recipe from an empty one: an empty recipe is no picture (spec FR-1.6).
 * @param recipe The recipe of a book.
 * @returns True when the book has a picture.
 */
export function storytimeCoverHasPicture(recipe: readonly string[]): boolean {
    return recipe.length > 0;
}

/**
 * The title of a book (spec FR-1.4).
 * @param level The level of the book.
 * @param unit The unit of the book.
 * @returns The title.
 */
export function storytimeCoverTitle(level: number, unit: number): string {
    return `${STORYTIME_SERIES}, Level ${level}, Unit ${unit}, Student Book`;
}

/**
 * Checks the data of the 16 books: the series, the trim, the colours, the LINE address, the
 * rows, the titles, the weeks, the picture files, and the unit summaries.
 * @param data The data.
 * @returns The errors (empty when the data is good).
 */
export function checkStorytimeCoverData(data: StorytimeCoverData): string[] {
    const errors: string[] = [];
    if (data.series !== STORYTIME_SERIES) errors.push(`The series is "${data.series}", not "${STORYTIME_SERIES}".`);
    if (data.trim?.widthMm !== 210 || data.trim?.heightMm !== 297) {
        errors.push(`The trim is ${data.trim?.widthMm} x ${data.trim?.heightMm} mm, not 210 x 297 mm.`);
    }
    if (data.lineAddress !== STORYTIME_LINE_ADDRESS) errors.push(`The LINE address is not ${STORYTIME_LINE_ADDRESS}.`);
    for (const [level, colour] of Object.entries(STORYTIME_LEVEL_COLOURS)) {
        if (data.levelColours?.[level] !== colour) {
            errors.push(`The level colour of Level ${level} is ${data.levelColours?.[level]}, not ${colour}.`);
        }
    }
    const books = Array.isArray(data.books) ? data.books : [];
    if (books.length !== 16) errors.push(`The data holds ${books.length} books, not 16.`);
    const seen = new Set<string>();
    for (const book of books) {
        const title = book.title ?? `${STORYTIME_SERIES}, Level ${book.level}, Unit ${book.unit}, Student Book`;
        const key = `${book.level}-${book.unit}`;
        if (seen.has(key)) errors.push(`${title}: the row ${key} is in the data twice.`);
        seen.add(key);
        if (book.title !== storytimeCoverTitle(book.level, book.unit)) {
            errors.push(`${title}: the title is not "${storytimeCoverTitle(book.level, book.unit)}".`);
        }
        const colour = STORYTIME_LEVEL_COLOURS[book.level];
        if (!colour) errors.push(`${title}: the level ${book.level} is not a level of the series.`);
        else if (book.levelColour !== colour) errors.push(`${title}: the level colour is ${book.levelColour}, not ${colour}.`);
        const weeks = STORYTIME_UNIT_WEEKS[book.unit];
        if (!weeks) errors.push(`${title}: the unit ${book.unit} is not a unit of the series.`);
        else if (book.firstWeek !== weeks[0] || book.lastWeek !== weeks[1]) {
            errors.push(`${title}: the weeks are ${book.firstWeek} to ${book.lastWeek}, not ${weeks[0]} to ${weeks[1]}.`);
        }
        if (!Array.isArray(book.pictureRecipe)) errors.push(`${title}: the picture recipe is not a list.`);
        else {
            for (const file of book.pictureRecipe) {
                const abs = path.isAbsolute(file) ? file : path.join(REPO_ROOT, file);
                if (!fs.existsSync(abs)) errors.push(`${title}: the picture file is missing: ${file}`);
            }
        }
        if (book.summary !== null) {
            if (!book.summary || typeof book.summary.text !== 'string' || !book.summary.text.trim()) {
                errors.push(`${title}: the unit summary is empty.`);
            } else if (book.summary.week < book.firstWeek || book.summary.week > book.lastWeek) {
                errors.push(`${title}: the unit summary comes from week ${book.summary.week}, outside the unit.`);
            }
        }
    }
    return errors;
}

/**
 * The words of the student text of a week: the book titles, the page texts, the back words, the
 * check items, and the words of the home card. The approval words are not student text.
 * @param week The week.
 * @returns The words, in lower case.
 */
export function storytimeCoverStudentWords(week: StorytimeWeek): Set<string> {
    const words = new Set<string>();
    const add = (value: string) => {
        for (const word of value.toLowerCase().match(/[a-z]+/g) ?? []) words.add(word);
    };
    for (const book of week.books) {
        add(book.title);
        for (const page of book.pages) add(page.text);
        for (const word of book.backWords) add(word);
    }
    for (const item of week.check.items) {
        if ('pictures' in item) for (const picture of item.pictures) add(picture);
        if ('answer' in item) add(item.answer);
        if ('word' in item) add(item.word);
        if ('letter' in item) add(item.letter);
        if ('words' in item) for (const word of item.words) add(word);
        if ('groups' in item) for (const group of item.groups) for (const picture of group.pictures) add(picture);
    }
    for (const word of week.home?.words ?? []) add(word);
    return words;
}

/**
 * Checks the unit summary of a book: the week must be approved, the summary must be short, and
 * every word of it must be a word of the student text of that week (D1, open point P1).
 * @param summary The summary text.
 * @param week The week of the summary.
 * @returns The errors (empty when the summary is good).
 */
export function checkStorytimeCoverSummary(summary: string, week: StorytimeWeek): string[] {
    const errors: string[] = [];
    if (week.approval.text.status !== 'approved') {
        errors.push(`Week ${week.meta.week} is not approved for print, so it holds no unit summary.`);
    }
    const words = summary.trim().split(/\s+/).filter(Boolean);
    if (!words.length) errors.push('The unit summary is empty.');
    if (words.length > 25) errors.push(`The unit summary has ${words.length} words, 25 at most.`);
    const allowed = storytimeCoverStudentWords(week);
    for (const word of words) {
        const token = word.toLowerCase().replace(/[^a-z]/g, '');
        if (!token) continue;
        if (!allowed.has(token)) errors.push(`The word "${token}" is not in the student text of week ${week.meta.week}.`);
    }
    if (/\b(19|20)\d{2}\b/.test(summary)) errors.push('The unit summary holds a year.');
    return errors;
}

/**
 * Normalises the text of a page before the copy check: one case, one space, one dash.
 * @param text The text of a page.
 * @returns The normalised text.
 */
function normaliseCoverText(text: string): string {
    return text
        .replace(/\u00a0/g, ' ')
        .replace(/[\u2010\u2011\u2013]/g, '-')
        .replace(/[\u00ad\u200b]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

/**
 * The copy check of a cover side (spec FR-4): the series name, no forbidden word, no year. The
 * check reads the text of the built page, never the source.
 * @param pageText The text of one side of the built PDF.
 * @returns The errors (empty when the copy is good).
 */
export function checkStorytimeCoverCopy(pageText: string): string[] {
    const errors: string[] = [];
    const text = normaliseCoverText(pageText);
    if (!text.includes(STORYTIME_SERIES.toLowerCase())) errors.push(`The page does not show "${STORYTIME_SERIES}".`);
    const patterns = new Set<string>();
    for (const token of FORBIDDEN_TOKENS) {
        patterns.add(token);
        if (token.includes('-')) patterns.add(token.replace(/-/g, ''));
    }
    for (const token of patterns) {
        const body = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        if (new RegExp(`\\b${body}\\b`).test(text)) errors.push(`The page shows the forbidden word "${token}".`);
    }
    if (/\b(19|20)\d{2}\b/.test(text)) errors.push('The page shows a year.');
    return errors;
}

/**
 * The Thai characters of a text, in order.
 * @param text The text.
 * @returns The Thai characters.
 */
function thaiChars(text: string): string {
    return [...text].filter((char) => /[\u0E00-\u0E7F]/.test(char)).join('');
}

/**
 * The Thai check of a cover side (spec FR-6.1): the Thai of the back page is the Thai of the
 * five approved contact lines, and the front page holds no Thai at all.
 * @param pageText The text of one side of the built PDF.
 * @param side The side of the cover.
 * @returns The errors (empty when the Thai is good).
 */
export function checkStorytimeCoverThai(pageText: string, side: 'front' | 'back'): string[] {
    const thai = thaiChars(pageText);
    if (side === 'front') {
        return thai ? [`The front page holds ${thai.length} Thai characters.`] : [];
    }
    const expected = thaiChars(BACK_LINES.contact.join('\n'));
    if (thai === expected) return [];
    return [`The Thai of the back page is not the Thai of the five approved contact lines (${thai.length} characters, ${expected.length} at most).`];
}

/**
 * The module grid of a QR code, read from the SVG of the encoder (the quiet zone is not data).
 * @param svg The SVG of `generateQRCode`.
 * @returns The grid: the number of modules, the number of dark cells, and the cells.
 */
export function storytimeCoverQrGrid(svg: string): StorytimeCoverQrGrid {
    const viewBox = Number(svg.match(/viewBox="0 0 (\d+) \1"/)?.[1]);
    const modules = Number.isFinite(viewBox) ? viewBox / 10 - 8 : 0;
    const cells: boolean[][] = Array.from({ length: modules }, () => Array.from({ length: modules }, () => false));
    let dark = 0;
    for (const match of svg.matchAll(/<rect\b([^>]*)\/?>/g)) {
        const attrs = match[1];
        if (!/fill="#000000"/i.test(attrs)) continue;
        if (Number(attrs.match(/\bwidth="(\d+)"/)?.[1]) !== 10) continue;
        const col = Number(attrs.match(/\bx="(\d+)"/)?.[1]) / 10;
        const row = Number(attrs.match(/\by="(\d+)"/)?.[1]) / 10;
        if (!Number.isInteger(col) || !Number.isInteger(row)) continue;
        cells[row][col] = true;
        dark++;
    }
    return { modules, dark, cells };
}

/**
 * Counts the modules of a printed QR code that differ from the encoder output.
 * @param printed The printed grid.
 * @param expected The grid of the encoder.
 * @returns The number of different modules.
 */
export function checkStorytimeCoverQr(printed: boolean[][], expected: boolean[][]): number {
    let different = 0;
    for (let row = 0; row < expected.length; row++) {
        for (let col = 0; col < expected[row].length; col++) {
            if (Boolean(printed[row]?.[col]) !== Boolean(expected[row][col])) different++;
        }
    }
    return different;
}

/**
 * The corner mode of the build: the corner radius of the level card and of the unit summary
 * panel is flattened into the opaque picture layer, so the page text stays text.
 * @returns The corner mode.
 */
export function storytimeCoverCornerMode(): string {
    return STORYTIME_COVER_CORNER_MODE;
}

/**
 * The `@font-face` rules of the cover: Andika for English, Sarabun for Thai, one static face
 * for each weight, so that Chrome embeds no synthesised face (lessons-learned, 2026-10-02).
 * @returns The CSS.
 */
export function storytimeCoverFontCss(): string {
    const faces = [
        { family: 'Andika', weight: 400, file: 'andika-regular.ttf', format: 'truetype' },
        { family: 'Andika', weight: 700, file: 'andika-bold.ttf', format: 'truetype' },
        { family: 'Sarabun', weight: 400, file: 'sarabun-thai-400-normal.woff2', format: 'woff2', range: THAI },
        { family: 'Sarabun', weight: 700, file: 'sarabun-thai-700-normal.woff2', format: 'woff2', range: THAI },
    ];
    return faces
        .map((face) => {
            const range = face.range ? ` unicode-range: ${face.range};` : '';
            return `@font-face { font-family: '${face.family}'; font-weight: ${face.weight}; font-style: normal; src: url('file://${PRINT_FONT_DIR}/${face.file}') format('${face.format}');${range} }`;
        })
        .join('\n');
}

/**
 * The QR code of the back cover, as the SVG of the encoder.
 * @returns The SVG.
 */
export function storytimeCoverQrSvg(): string {
    return generateQRCode(STORYTIME_LINE_ADDRESS) ?? '';
}

/**
 * The URL of a picture file of the repo.
 * @param file The absolute path of the file.
 * @returns The URL.
 */
export function storytimeCoverFileUrl(file: string): string {
    return pathToFileURL(file).href;
}

/** The document CSS of a cover side. */
const COVER_CSS = `
@page { size: 210mm 297mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body { font-family: 'Andika', 'Sarabun', sans-serif; font-synthesis: none; color: #1a1a1a; }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #ffffff; }
.page + .page { break-before: page; }
.wordmark { position: absolute; top: 13mm; left: 0; width: 210mm; text-align: center; font-weight: 700; font-size: 30pt; white-space: nowrap; }
.back-wordmark { position: absolute; top: 14.5mm; left: 0; width: 210mm; padding-left: 46mm; text-align: center; font-weight: 700; font-size: 22pt; white-space: nowrap; }
.picture-area { position: absolute; }
.picture-area img { display: block; width: 100%; height: 100%; }
.level-card { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3.5mm; }
.level-card img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.level-line { position: relative; font-weight: 700; font-size: 32pt; line-height: 1; color: #ffffff; }
.book-line { position: relative; font-weight: 400; font-size: 17pt; line-height: 1; color: #ffffff; }
.logo { position: absolute; }
.logo img { display: block; width: 100%; height: 100%; }
.panel { position: absolute; }
.panel img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.panel-text { position: absolute; left: 12mm; top: 12mm; width: 162mm; font-size: 14pt; line-height: 1.5; }
.contact { position: absolute; font-size: 11.5pt; line-height: 1.62; color: #1a1a1a; }
.contact p { margin: 0; }
.contact .head { font-weight: 700; }
.ph { white-space: nowrap; }
.qr-box { position: absolute; }
.qr-box svg { display: block; width: 100%; height: 100%; }
.line-label { position: absolute; text-align: center; font-weight: 700; font-size: 11.5pt; }
`;

/**
 * The HTML of one cover side.
 * @param side The side of the cover.
 * @param title The title of the book.
 * @param body The body of the side.
 * @returns The HTML document.
 */
function coverDocument(side: 'front' | 'back', title: string, body: string): string {
    return `<!doctype html><html><head><meta charset="utf-8"><style>${storytimeCoverFontCss()}${COVER_CSS}</style></head>
<body><div class="page" data-side="${side}" data-title="${escapeCoverText(title)}">
${body}
</div></body></html>`;
}

/**
 * Escapes the text of a cover (the titles, the unit summary).
 * @param text The text.
 * @returns The escaped text.
 */
function escapeCoverText(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The HTML of the front and the back of one cover.
 * @param book The book of the cover.
 * @param assets The files of the build: the composed cover picture, the blocks, and the logo.
 * @returns The front HTML and the back HTML.
 */
export function renderStorytimeCover(
    book: StorytimeCoverBook,
    assets: Partial<StorytimeCoverAssets> = {},
): { frontHtml: string; backHtml: string } {
    const box = STORYTIME_COVER_BOX;
    const picture = assets.picture ?? '';
    const card = assets.card ?? '';
    const panelImage = assets.panel ?? '';
    const logo = assets.logo ?? storytimeCoverFileUrl(STORYTIME_COVER_LOGO_FILE);
    const front = `<div class="wordmark" data-part="series-name" style="color:${book.levelColour}">${STORYTIME_SERIES}</div>
<div class="picture-area" data-part="picture-area" style="left: ${box.pictureArea.left}mm; top: ${box.pictureArea.top}mm; width: ${box.pictureArea.width}mm; height: ${box.pictureArea.height}mm;"><img src="${picture}" alt=""></div>
<div class="level-card" data-part="level-card" style="left: ${box.levelCard.left}mm; top: ${box.levelCard.top}mm; width: ${box.levelCard.width}mm; height: ${box.levelCard.height}mm;"><img src="${card}" alt="">
<div class="level-line">Level ${book.level} &middot; Unit ${book.unit}</div>
<div class="book-line">Student Book</div>
</div>`;
    const panel = book.summary
        ? `<div class="panel" data-part="panel" style="left: ${box.panel.left}mm; top: ${box.panel.top}mm; width: ${box.panel.width}mm; height: ${box.panel.height}mm;"><img src="${panelImage}" alt="">
<div class="panel-text">${escapeCoverText(book.summary.text)}</div>
</div>`
        : '';
    const contact = BACK_LINES.contact
        .map((line, index) => `<p${index === 0 ? ' class="head"' : ''}>${richHtml(line, true)}</p>`)
        .join('\n');
    const back = `<div class="back-wordmark" data-part="series-name" style="color:${book.levelColour}">${STORYTIME_SERIES}</div>
<div class="logo" data-part="logo" style="left: ${box.logo.left}mm; top: ${box.logo.top}mm; width: ${box.logo.width}mm; height: ${box.logo.height}mm;"><img src="${logo}" alt=""></div>
${panel}
<div class="contact" data-part="contact" style="left: ${box.contact.left}mm; top: ${box.contact.top}mm; width: ${box.contact.width}mm;">
${contact}
</div>
<div class="qr-box" data-part="qr" style="right: ${box.qr.right}mm; top: ${box.qr.top}mm; width: ${box.qr.width}mm; height: ${box.qr.height}mm;">${storytimeCoverQrSvg()}</div>
<div class="line-label" data-part="line-label" style="right: ${box.lineLabel.right}mm; top: ${box.lineLabel.top}mm; width: ${box.lineLabel.width}mm; color:${book.levelColour}">LINE</div>`;
    return {
        frontHtml: coverDocument('front', book.title, front),
        backHtml: coverDocument('back', book.title, back),
    };
}
