// @vitest-environment jsdom
/**
 * Red 1 of the option A cover template (track storytime_cover_options_20261106, Task 2.4).
 * Test list T01 to T30 of test-strategy.md section 4.4. Pins P1 to P12 of section 4.3.
 *
 * The module under test is dashboard/lib/storytime/print/cover-quest.ts with the data file
 * content/storytime/covers/quest.json (spec D-A1). Neither file exists at Red 1, so every test
 * fails on the missing module or the missing file. Expected values below are hand written. No
 * value comes from the code under test.
 *
 * API (pin P1):
 *   type QuestCoverKind = 'student-front' | 'student-back' | 'teacher-front' | 'teacher-back'
 *                       | 'reader-a3' | 'reader-leaf'
 *   QUEST_BANDS = ['seed', 'sprout', 'leaf', 'bud', 'flower']
 *   QUEST_ROLE_LABELS = { listen: 'Listen and read.', sound: 'Sound it out.',
 *                         firstSound: 'Say the first sound.' }
 *   QUEST_BOXES: every text or face part of every kind, keyed '<kind>:<part>',
 *     value { kind, leftMm, topMm, widthMm, heightMm }. No key holds ':art' (art is exempt).
 *   loadQuestCovers(file?) reads quest.json.
 *   checkQuestCoverData(data) returns the data errors. It never reads a file.
 *   questPageSize(kind, bleedMm) returns { widthMm, heightMm } of trim + 2 * bleed. It throws
 *     when bleedMm is not 0 or 3.
 *   renderQuestCover(kind, subject, assets, opts) returns one full HTML document string.
 *   questReaderCoverPage(reader, trim, assets, opts) returns { body, css }.
 *   questReaders() returns the 14 reader rows.
 *   checkQuestCopy(pageText) returns the copy errors.
 *   checkQuestThai(pageText, kind) returns the Thai errors.
 *   checkQuestQr(qrSvg) returns { modules, dark, different, errors }.
 *   checkQuestArt({ kind, widthPx, heightPx, bleedMm }) returns { ppi, minPpi, errors }.
 *   checkQuestLitBand(html, band) returns the lit band errors.
 *   checkQuestPageSize(html, kind, bleedMm) returns the page size errors. It never throws.
 *   questCssSafetyErrors(css) returns the PDF/X unsafe CSS errors. It never throws.
 *
 * Data file content/storytime/covers/quest.json (T22, T23):
 *   { series: 'Storytime Advantage',
 *     roster: { <name>: 'child' | 'animal' | 'adult' },
 *     books: [ { level, unit, litBand (lower case),
 *                art: { studentFront, back, teacherFront },
 *                cast: { studentFront: [names], teacherFront: [names] } } ] }
 *   The check rejects an unknown key, a '__proto__' key, a level outside 1 to 4 (integer),
 *   a unit outside 1 to 4, a level+unit repeat, a litBand outside QUEST_BANDS (upper case or
 *   unknown), an art name that is not 'l2-u<unit>-cover-quest-<side>-v1-300ppi.png' for the
 *   side token of its field, a student cast above 2 children or above 1 animal, a teacher cast
 *   above 2 children, a name outside the roster, and books that are empty or not an array.
 *   Every error names its field.
 *
 * Rows: a book row is the row of quest.json. A reader row of questReaders() is
 *   { title, kind, week, weekText ('Week <n>'), litBand, roleLabel, level, slug,
 *     picture: { fileName, lineArtFileName } }.
 *
 * Render rules (P2, P3, T02 to T10, T14, T17, T26, T30):
 *   opts = { bleedMm: 0 | 3 }. assets = { art?, logo?, panelValues? }. assets.art is the src of
 *   [data-part="art"]. The module reads no art file.
 *   Data marks: data-part on every frame part. Band icons carry data-part="band-icon",
 *   data-band, data-lit, and wrap the ring and the glyph that change with the lit band. The
 *   unit bar holds 4 children with data-unit-part="1" to "4" and data-filled="true" or
 *   "false". The title plaque carries data-plaque-colour on the A4 fronts and the A3 cover.
 *   The leaf plaque carries no level colour. The QR box carries data-qr-input.
 *   Geometry: every frame part carries left, top, width, and height inline in millimetres.
 *   At bleed 3 the left and top values are the QUEST_BOXES value plus 3. The level colour
 *   appears only in the title plaque element (T07).
 *   Art: an img with data-part="art", alt="", object-fit: cover, no opacity, src equal to
 *   assets.art, inline position absolute, left and top 0mm, and width and height equal to the
 *   page size. The art is the first element child of its parent, and that parent is the first
 *   element child of the body (or the body itself).
 *   Page: one @page rule with size = trim + 2 * bleed in millimetres.
 *   Text: one HTML escape per text. The texts of T14 appear exactly once. The level line is
 *   'Level 2 · Unit 1' (U+00B7). The reader band word is litBand.toUpperCase() ('SPROUT').
 *   The teacher band pill is Capital(litBand) ('Sprout'). The back shows the five contact
 *   lines of BACK_LINES.contact with no '**' in the output.
 *   questReaderCoverPage: body has no document tag, css has no @page, every css selector
 *   starts with '.quest-'.
 *   No side effect: render and import call fetch and fs.writeFileSync 0 times. The source
 *   holds no 'writeFileSync'.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { BACK_LINES } from '../lib/covers/back-text';
import type { QuestCoverKind } from '../lib/storytime/print/cover-quest';
import {
    STORYTIME_LEVEL_COLOURS,
    STORYTIME_LINE_ADDRESS,
    checkStorytimeCoverQr,
    loadStorytimeCoverBooks,
    storytimeCoverPanelValues,
    storytimeCoverQrGrid,
    storytimeCoverQrSvg,
} from '../lib/storytime/print/covers';
import { STORYTIME_ROOT, readLevelWeeks, readPhonicsGraph } from '../lib/storytime/files';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { compileStorytimeReaders } from '../lib/storytime/print/readers';

/** The bleed values of the template (pin: 0 mm or 3 mm, spec D-A5). */
type Bleed = 0 | 3;

/** One book row of quest.json, as the tests build it. */
interface BookRow {
    level: number;
    unit: number;
    litBand: string;
    art: { studentFront: string; back: string; teacherFront: string };
    cast: { studentFront: string[]; teacherFront: string[] };
}

/** One reader row of questReaders(). */
interface ReaderRow {
    title: string;
    kind: string;
    week: number;
    weekText: string;
    litBand: string;
    roleLabel: string;
    level: number;
    slug: string;
    picture: { fileName: string; lineArtFileName: string };
}

/** The quest data file. */
interface QuestData {
    series: string;
    roster: Record<string, string>;
    books: BookRow[];
}

/** The asset object of a render. */
interface RenderAssets {
    art?: string;
    logo?: string;
    panelValues?: Array<{ field: string; value: string; items: string[] }>;
}

/** One safe zone box of QUEST_BOXES. */
interface QuestBox {
    kind: QuestCoverKind;
    leftMm: number;
    topMm: number;
    widthMm: number;
    heightMm: number;
}

/** The module API, typed here so the test has no type link to the new module. */
interface QuestApi {
    loadQuestCovers(file?: string): QuestData;
    checkQuestCoverData(data: unknown): string[];
    questPageSize(kind: QuestCoverKind, bleedMm: number): { widthMm: number; heightMm: number };
    renderQuestCover(
        kind: QuestCoverKind,
        subject: BookRow | ReaderRow,
        assets: RenderAssets,
        opts: { bleedMm: Bleed },
    ): string;
    questReaderCoverPage(
        reader: ReaderRow,
        trim: { widthMm: number; heightMm: number },
        assets: RenderAssets,
        opts: { bleedMm: Bleed },
    ): { body: string; css: string };
    questReaders(): ReaderRow[];
    checkQuestCopy(pageText: string): string[];
    checkQuestThai(pageText: string, kind: QuestCoverKind): string[];
    checkQuestQr(qrSvg: string): { modules: number; dark: number; different: number; errors: string[] };
    checkQuestArt(input: { kind: QuestCoverKind; widthPx: number; heightPx: number; bleedMm: number }): {
        ppi: number;
        minPpi: number;
        errors: string[];
    };
    checkQuestLitBand(html: string, band: string): string[];
    checkQuestPageSize(html: string, kind: QuestCoverKind, bleedMm: number): string[];
    questCssSafetyErrors(css: string): string[];
    QUEST_BANDS: readonly string[];
    QUEST_BOXES: Record<string, QuestBox>;
    QUEST_ROLE_LABELS: { listen: string; sound: string; firstSound: string };
}

const repoRoot = path.resolve(STORYTIME_ROOT, '..', '..');
const dashboardRoot = path.join(repoRoot, 'dashboard');
const coverQuestFile = path.join(dashboardRoot, 'lib', 'storytime', 'print', 'cover-quest.ts');
const questDataFile = path.join(repoRoot, 'content', 'storytime', 'covers', 'quest.json');
const picturesFile = path.join(repoRoot, 'content', 'storytime', 'l2', 'print', 'pictures.json');
const weekFileOf = (week: number): string =>
    path.join(repoRoot, 'content', 'storytime', 'l2', `w${String(week).padStart(2, '0')}.json`);

/** The approved text of the frame (spec FR-4.1). */
const SERIES = 'Storytime Advantage';
const LEVEL_LINE = 'Level 2 \u00b7 Unit 1';
const STUDENT_LINE = 'Student Book';
const TEACHER_LINE = 'Teacher Book';
const LISTEN_ROLE = 'Listen and read.';
const SOUND_ROLE = 'Sound it out.';
const FIRST_SOUND_ROLE = 'Say the first sound.';

/** The art, logo, and line art strings of the tests. They need no file (pin P8). */
const ART_A = 'data:image/png;base64,iVBORw0KGgo=';
const ART_B = 'data:image/png;base64,SU1HMg==';
const LINE_ART = 'file:///tmp/opencode/quest-line-art.png';
const LOGO = 'file:///tmp/opencode/quest-logo.png';

/** The trims of the six kinds (spec FR-9.2), hand written. */
const TRIMS: Record<QuestCoverKind, { widthMm: number; heightMm: number }> = {
    'student-front': { widthMm: 210, heightMm: 297 },
    'student-back': { widthMm: 210, heightMm: 297 },
    'teacher-front': { widthMm: 210, heightMm: 297 },
    'teacher-back': { widthMm: 210, heightMm: 297 },
    'reader-a3': { widthMm: 420, heightMm: 297 },
    'reader-leaf': { widthMm: 198, heightMm: 148.5 },
};

const KINDS: QuestCoverKind[] = [
    'student-front',
    'student-back',
    'teacher-front',
    'teacher-back',
    'reader-a3',
    'reader-leaf',
];
const BANDS = ['seed', 'sprout', 'leaf', 'bud', 'flower'];
const LEVEL_COLOURS: Record<number, string> = { 1: '#E06A1F', 2: '#2A77B8', 3: '#3C9B57', 4: '#8151B8' };

/** The level colours of covers.ts (pin: the tests hand write them and compare). */
const ESCAPE_IN = 'A & B <i>"x"';
const ESCAPE_OUT = 'A &amp; B &lt;i&gt;&quot;x&quot;';

/** The words of the forbidden list of spec FR-4.3, plus the year case (T11). */
const FORBIDDEN_CASES: Array<[string, string]> = [
    ['CEFR', 'word'],
    ['A1', 'word'],
    ['A2', 'word'],
    ['B1', 'word'],
    ['B2', 'word'],
    ['C1', 'word'],
    ['C2', 'word'],
    ['Starters', 'word'],
    ['Primary Advantage', 'word'],
    ['GSE', 'word'],
    ['YLE', 'word'],
    ['Reading A-Z', 'word'],
    ['RAZ', 'word'],
    ['Pre-A1', 'word'],
    ['Pre A1', 'word'],
    ['Chibi', 'word'],
    ['Mitr', 'word'],
    ['2026', 'year'],
];

/**
 * Loads the module under test inside one test. A missing file stays an assertion, so the Red
 * log names the module instead of a transform error.
 * @returns The module API.
 */
async function api(): Promise<QuestApi> {
    expect(fs.existsSync(coverQuestFile), `Missing module: dashboard/lib/storytime/print/cover-quest.ts (Red 1).`).toBe(true);
    const loaded = await import(coverQuestFile) as unknown as QuestApi;
    return loaded;
}

/**
 * Parses one rendered document.
 * @param html The rendered HTML.
 * @returns The document.
 */
function parseHtml(html: string): Document {
    expect(html, 'A render returns a string.').toBeTypeOf('string');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('parsererror'), 'The rendered HTML parses.').toBeNull();
    return doc;
}

/**
 * The text of the body of a document.
 * @param doc The document.
 * @returns The text, with the entities decoded once.
 */
function pageText(doc: Document): string {
    return doc.body.textContent ?? '';
}

/**
 * The text of the body with one space between the words (T10). The print text of a page has
 * one space per line break, so the copy check reads the same form.
 * @param doc The document.
 * @returns The normalised text.
 */
function normalisedText(doc: Document): string {
    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * The outer HTML of the first match of a selector.
 * @param doc The document.
 * @param selector The selector.
 * @returns The raw HTML of the element.
 */
function partHtml(doc: Document, selector: string): string {
    const el = doc.querySelector(selector);
    expect(el, `The part ${selector} exists.`).not.toBeNull();
    return el!.outerHTML;
}

/**
 * Counts one literal string inside another.
 * @param raw The text.
 * @param needle The literal string.
 * @returns The count.
 */
function countOf(raw: string, needle: string): number {
    return raw.split(needle).length - 1;
}

/**
 * The lower case words of a text.
 * @param value The text.
 * @returns The words.
 */
function wordsOf(value: string): string[] {
    return value.toLowerCase().match(/[a-z]+/g) ?? [];
}

/**
 * Reads a millimetre value of an inline style.
 * @param styleValue The style value, for example '26mm'.
 * @returns The number, or NaN when the value is not millimetres.
 */
function mmOf(styleValue: string): number {
    const match = /^(-?[0-9]+(?:\.[0-9]+)?)mm$/.exec(styleValue.trim());
    return match ? Number(match[1]) : Number.NaN;
}

/**
 * The inline style of a rendered element, an img, a div, or an svg (T08, T09, T26).
 * @param element The element.
 * @returns The style declaration.
 */
function styleOf(element: Element): CSSStyleDeclaration {
    return (element as unknown as { style: CSSStyleDeclaration }).style;
}

/**
 * The style text of the document.
 * @param doc The document.
 * @returns The CSS of the style element.
 */
function styleText(doc: Document): string {
    return doc.querySelector('style')?.textContent ?? '';
}

/** One raw week file, read without the schema. */
interface RawWeek {
    meta: { week: number; level: number; band: string };
    books: Array<{ title: string; kind: string; soundBook?: boolean }>;
}

/**
 * Reads one shipped week file.
 * @param week The week number.
 * @returns The raw week.
 */
function rawWeek(week: number): RawWeek {
    return JSON.parse(fs.readFileSync(weekFileOf(week), 'utf8')) as RawWeek;
}

/**
 * The cover picture rows of pictures.json with the use 'cover'.
 * @returns The rows.
 */
function coverPictureRows(): Array<{ week: number; text: string; fileName: string; lineArtFileName: string; use: string }> {
    const rows = JSON.parse(fs.readFileSync(picturesFile, 'utf8')) as Array<{ week: number; text: string; fileName: string; lineArtFileName: string; use: string }>;
    return rows.filter((row) => row.use === 'cover');
}

/**
 * The role label of a reader by the rule of test-strategy F7 (shared readers.ts rule).
 * @param book The week book row.
 * @returns The label.
 */
function expectedRole(book: { kind: string; soundBook?: boolean }): string {
    if (book.soundBook && book.kind === 'decodable') return LISTEN_ROLE;
    if (book.soundBook) return FIRST_SOUND_ROLE;
    if (book.kind === 'decodable') return SOUND_ROLE;
    return LISTEN_ROLE;
}

/**
 * The slug of a cover picture file name, for example 'nan-can-nod'.
 * @param fileName The file name.
 * @returns The slug.
 */
function slugOf(fileName: string): string {
    const match = /^l2-w\d{2}-cover-(.+)-v1\.png$/.exec(fileName);
    return match ? match[1] : '';
}

/**
 * Reads the eight shipped Level 2 weeks through the shared reader.
 * @returns The weeks.
 */
function level2Weeks() {
    return readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
}

/** The panel values of the approved Level 2 weeks (T03, T10). */
function panelValues(): Array<{ field: string; value: string; items: string[] }> {
    const data = loadStorytimeCoverBooks();
    const book = data.books.find((row) => row.level === 2 && row.unit === 1);
    expect(book, 'books.json holds the Level 2 Unit 1 row.').toBeTruthy();
    const weeks = level2Weeks();
    expect(weeks.length, 'The eight approved Level 2 weeks.').toBe(8);
    const graph = readPhonicsGraph();
    expect(graph, 'The phonics graph reads.').toBeTruthy();
    return storytimeCoverPanelValues(book!, { weeks, graph: graph! });
}

/**
 * The shipped book row of quest.json.
 * @returns The row.
 */
async function shippedBook(): Promise<BookRow> {
    const quest = await api();
    const data = quest.loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row (T23).').toBe(1);
    return data.books[0];
}

/**
 * The shipped reader rows of questReaders().
 * @returns The rows.
 */
async function shippedReaders(): Promise<ReaderRow[]> {
    const quest = await api();
    return quest.questReaders();
}

/**
 * The first shipped reader row.
 * @returns The row.
 */
async function shippedReader(): Promise<ReaderRow> {
    const rows = await shippedReaders();
    expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
    return rows[0];
}

/**
 * Renders one cover side with the module under test.
 * @param kind The cover kind.
 * @param subject The book row or the reader row.
 * @param assets The asset URLs.
 * @param bleedMm The bleed value.
 * @returns The HTML document.
 */
async function renderQuest(
    kind: QuestCoverKind,
    subject: BookRow | ReaderRow,
    assets: RenderAssets,
    bleedMm: Bleed,
): Promise<string> {
    const quest = await api();
    return quest.renderQuestCover(kind, subject, assets, { bleedMm });
}

/**
 * The asset object of one kind for the shipped data.
 * @param kind The cover kind.
 * @returns The assets.
 */
async function standardAssets(kind: QuestCoverKind): Promise<RenderAssets> {
    if (kind === 'reader-leaf') return { art: LINE_ART };
    if (kind === 'reader-a3') return { art: ART_A };
    if (kind === 'student-back') return { art: ART_A, logo: LOGO, panelValues: panelValues() };
    if (kind === 'teacher-back') return { art: ART_A, logo: LOGO };
    return { art: ART_A };
}

/**
 * The subject of one kind for the shipped data.
 * @param kind The cover kind.
 * @returns The row.
 */
async function standardSubject(kind: QuestCoverKind): Promise<BookRow | ReaderRow> {
    if (kind === 'reader-leaf' || kind === 'reader-a3') return shippedReader();
    return shippedBook();
}

/**
 * Renders one kind of the shipped data.
 * @param kind The cover kind.
 * @param bleedMm The bleed value.
 * @returns The HTML document.
 */
async function standardRender(kind: QuestCoverKind, bleedMm: Bleed): Promise<string> {
    return renderQuest(kind, await standardSubject(kind), await standardAssets(kind), bleedMm);
}

/** The export lists of pin P1. The tests read them in T01 and T27. */
const P1_FUNCTIONS = [
    'loadQuestCovers',
    'checkQuestCoverData',
    'questPageSize',
    'renderQuestCover',
    'questReaderCoverPage',
    'questReaders',
    'checkQuestCopy',
    'checkQuestThai',
    'checkQuestQr',
    'checkQuestArt',
    'checkQuestLitBand',
    'checkQuestPageSize',
    'questCssSafetyErrors',
];
const P1_CONSTANTS = ['QUEST_BANDS', 'QUEST_BOXES', 'QUEST_ROLE_LABELS'];

/**
 * Tells when an export has a JSDoc block above it (T27, spec FR-9.5).
 * @param source The module source text.
 * @param kind 'function' or 'const'.
 * @param name The export name.
 * @returns True when a JSDoc block sits directly above the export.
 */
function hasJsDoc(source: string, kind: 'function' | 'const', name: string): boolean {
    const match = new RegExp(`^\\s*export\\s+(?:async\\s+)?${kind}\\s+${name}\\b`, 'm').exec(source);
    if (!match) return false;
    const before = source.slice(0, match.index).split('\n');
    let index = before.length - 1;
    while (index >= 0 && !before[index].trim()) index--;
    if (index < 0 || !before[index].trim().endsWith('*/')) return false;
    for (let scan = index; scan >= 0; scan--) {
        const trimmed = before[scan].trim();
        if (trimmed.startsWith('/**')) return true;
        if (trimmed.startsWith('/*')) return false;
        if (!trimmed.startsWith('*')) return false;
    }
    return false;
}

/** The named colour words of the colour token scan (T18). */
const NAMED_COLOUR_WORDS = /\b(blue|red|green|amber|navy|silver|gold|orange|purple|pink|teal|cyan|magenta|brown|beige|cream|ivory|white|black|grey|gray)\b/gi;

/**
 * Collects every colour token of a document or a CSS text (T18).
 * @param source The HTML or CSS text.
 * @returns The tokens.
 */
function colourTokens(source: string): string[] {
    const tokens: string[] = [];
    for (const match of source.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? []) tokens.push(match);
    for (const match of source.match(/rgba?\([^)]*\)|hsla?\([^)]*\)/gi) ?? []) tokens.push(match);
    for (const match of source.matchAll(/\b(?:fill|stroke)\s*[:=]\s*"?([^";})\s]+)/gi)) tokens.push(match[1]);
    for (const match of source.matchAll(NAMED_COLOUR_WORDS)) tokens.push(match[1]);
    return tokens;
}

/**
 * Tells when a colour token is black, white, or grey (T18).
 * @param token The token.
 * @returns True when the token has no colour.
 */
function isAchromatic(token: string): boolean {
    const value = token.trim().toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(value)) {
        const [r, g, b] = [...value.slice(1)].map((c) => parseInt(c + c, 16));
        return r === g && g === b;
    }
    if (/^#[0-9a-f]{6}$/.test(value)) {
        const r = parseInt(value.slice(1, 3), 16);
        const g = parseInt(value.slice(3, 5), 16);
        const b = parseInt(value.slice(5, 7), 16);
        return r === g && g === b;
    }
    const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
    if (rgb) return Number(rgb[1]) === Number(rgb[2]) && Number(rgb[2]) === Number(rgb[3]);
    const hsl = /^hsla?\(\s*[0-9.]+(?:deg)?\s*,\s*([0-9.]+)%/.exec(value);
    if (hsl) return Number(hsl[1]) === 0;
    return ['white', 'black', 'grey', 'gray', 'lightgrey', 'lightgray', 'darkgrey', 'darkgray'].includes(value);
}

/**
 * Replaces every hex colour inside one element (T07).
 * @param root The element.
 */
function scrubHex(root: Element): void {
    for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
        for (const attribute of Array.from(element.attributes)) {
            attribute.value = attribute.value.replace(/#[0-9a-fA-F]{3,8}\b/g, '#COLOUR');
        }
    }
}

/**
 * Replaces the per book values of a rendered front, so two books can be compared (T07).
 * The level line, the art URL, the lit flags, the filled flags, the band glyphs, and the plaque
 * colour are per book values. The crest banner keeps its fixed colour.
 * @param html The rendered HTML.
 * @param artUrls The art URLs of this render.
 * @returns The normalised HTML.
 */
function normalizedFrame(html: string, artUrls: string[]): string {
    const doc = parseHtml(html);
    for (const element of Array.from(doc.querySelectorAll('[src]'))) {
        if (artUrls.includes(element.getAttribute('src') ?? '')) element.setAttribute('src', 'ART');
    }
    for (const element of Array.from(doc.querySelectorAll('[data-part="level-line"]'))) element.textContent = 'LEVEL_LINE';
    for (const element of Array.from(doc.querySelectorAll('[data-lit]'))) element.setAttribute('data-lit', 'LIT');
    for (const element of Array.from(doc.querySelectorAll('[data-filled]'))) element.setAttribute('data-filled', 'FILLED');
    for (const element of Array.from(doc.querySelectorAll('[data-band]'))) {
        while (element.firstChild) element.removeChild(element.firstChild);
        element.setAttribute('data-band', 'BAND');
    }
    for (const element of Array.from(doc.querySelectorAll('[data-plaque-colour]'))) element.setAttribute('data-plaque-colour', 'COLOUR');
    const plaque = doc.querySelector('[data-part="title-plaque"]');
    if (plaque) scrubHex(plaque);
    return doc.documentElement.outerHTML;
}

/** The Thai characters of a text (T12). */
function thaiOf(value: string): string {
    return [...value].filter((char) => /[\u0E00-\u0E7F]/.test(char)).join('');
}

/** The hash of one file (T15). */
function hashFile(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/** The source files that questReaders() must not change (T15). */
const READER_SOURCES = [...Array.from({ length: 7 }, (_unused, index) => weekFileOf(index + 1)), picturesFile];
const INITIAL_HASHES = READER_SOURCES.map((file) => hashFile(file));

/** The data of T22, hand written. The roster gives the kinds of the cast names. */
const BASE_DATA: QuestData = {
    series: 'Storytime Advantage',
    roster: { Ava: 'child', Bo: 'child', Cy: 'child', Pip: 'animal', Fen: 'animal', Teo: 'adult' },
    books: [
        {
            level: 2,
            unit: 1,
            litBand: 'sprout',
            art: {
                studentFront: 'l2-u1-cover-quest-student-front-v1-300ppi.png',
                back: 'l2-u1-cover-quest-back-v1-300ppi.png',
                teacherFront: 'l2-u1-cover-quest-teacher-front-v1-300ppi.png',
            },
            cast: { studentFront: ['Ava', 'Bo', 'Pip'], teacherFront: ['Teo', 'Ava', 'Bo'] },
        },
    ],
};

/** A fresh copy of the T22 data. */
function freshData(): QuestData {
    return JSON.parse(JSON.stringify(BASE_DATA)) as QuestData;
}

/**
 * A copy of the T22 data with one patch on its row.
 * @param patch The patch.
 * @returns The data.
 */
function withBook(patch: Partial<BookRow>): QuestData {
    const data = freshData();
    Object.assign(data.books[0], patch);
    return data;
}

describe('quest-cover-template: T01 to T30 (Red 1, storytime_cover_options_20261106)', () => {
    it('T01: the module exports every name of pin P1', async () => {
        const quest = await api();
        const names = quest as unknown as Record<string, unknown>;
        expect(P1_FUNCTIONS.length, 'the P1 function list holds 13 names').toBe(13);
        expect(P1_CONSTANTS.length, 'the P1 constant list holds 3 names').toBe(3);
        for (const name of P1_FUNCTIONS) expect(typeof names[name], `P1 export ${name}.`).toBe('function');
        for (const name of P1_CONSTANTS) expect(names[name], `P1 export ${name}.`).toBeDefined();
        const source = fs.readFileSync(coverQuestFile, 'utf8');
        expect(/export\s+type\s+QuestCoverKind\b/.test(source), 'the type export QuestCoverKind of P1.').toBe(true);
    });

    /** Every frame part of every kind, with its exact count (T02, spec FR-6.9). */
    const PART_COUNTS: Array<[QuestCoverKind, string, number]> = [
        ['student-front', '[data-part="art"]', 1],
        ['student-front', '[data-part="game-bar"]', 1],
        ['student-front', '[data-part="band-icon"]', 5],
        ['student-front', '[data-part="unit-bar"]', 1],
        ['student-front', '[data-unit-part]', 4],
        ['student-front', '[data-part="crest"]', 1],
        ['student-front', '[data-part="series-banner"]', 1],
        ['student-front', '[data-part="title-plaque"]', 1],
        ['student-front', '[data-part="level-line"]', 1],
        ['student-front', '[data-part="book-line"]', 1],
        ['teacher-front', '[data-part="art"]', 1],
        ['teacher-front', '[data-part="game-bar"]', 1],
        ['teacher-front', '[data-part="band-icon"]', 5],
        ['teacher-front', '[data-part="unit-bar"]', 1],
        ['teacher-front', '[data-unit-part]', 4],
        ['teacher-front', '[data-part="crest"]', 1],
        ['teacher-front', '[data-part="series-banner"]', 1],
        ['teacher-front', '[data-part="title-plaque"]', 1],
        ['teacher-front', '[data-part="level-line"]', 1],
        ['teacher-front', '[data-part="book-line"]', 1],
        ['teacher-front', '[data-part="band-pill"]', 1],
        ['student-back', '[data-part="art"]', 1],
        ['student-back', '[data-part="logo-box"]', 1],
        ['student-back', '[data-part="series-banner"]', 1],
        ['student-back', '[data-part="panel"]', 1],
        ['student-back', '[data-part="panel-field"]', 5],
        ['student-back', '[data-part="contact-sign"]', 1],
        ['student-back', '[data-part="contact-line"]', 5],
        ['student-back', '[data-part="qr"]', 1],
        ['student-back', '[data-part="line-label"]', 1],
        ['teacher-back', '[data-part="art"]', 1],
        ['teacher-back', '[data-part="logo-box"]', 1],
        ['teacher-back', '[data-part="series-banner"]', 1],
        ['teacher-back', '[data-part="panel"]', 0],
        ['teacher-back', '[data-part="panel-field"]', 0],
        ['teacher-back', '[data-part="contact-sign"]', 1],
        ['teacher-back', '[data-part="contact-line"]', 5],
        ['teacher-back', '[data-part="qr"]', 1],
        ['teacher-back', '[data-part="line-label"]', 1],
        ['reader-a3', '[data-part="art"]', 1],
        ['reader-a3', '[data-part="game-bar"]', 1],
        ['reader-a3', '[data-part="band-word"]', 1],
        ['reader-a3', '[data-part="series-banner"]', 1],
        ['reader-a3', '[data-part="week-pill"]', 1],
        ['reader-a3', '[data-part="title-plaque"]', 1],
        ['reader-a3', '[data-part="role-bar"]', 1],
        ['reader-leaf', '[data-part="art"]', 1],
        ['reader-leaf', '[data-part="double-line-frame"]', 1],
        ['reader-leaf', '[data-part="title-plaque"]', 1],
        ['reader-leaf', '[data-part="band-word"]', 1],
        ['reader-leaf', '[data-part="series"]', 1],
        ['reader-leaf', '[data-part="week"]', 1],
        ['reader-leaf', '[data-part="role-mark"]', 1],
    ];

    it('T02: the part table holds 53 rows', () => {
        expect(PART_COUNTS.length).toBe(53);
    });

    it.each(PART_COUNTS)('T02: %s holds %s exactly %i times', async (kind, selector, expected) => {
        const doc = parseHtml(await standardRender(kind, 0));
        expect(doc.querySelectorAll(selector).length, `${kind}: ${selector}`).toBe(expected);
    });

    it('T03: the student back shows the five fields in order with their headings and shared values, and the teacher back has no panel', async () => {
        const expected = panelValues();
        expect(expected.map((value) => value.field), 'the panel order').toEqual(['story', 'sounds', 'decodable', 'sight', 'books']);
        const doc = parseHtml(await standardRender('student-back', 0));
        const fields = Array.from(doc.querySelectorAll('[data-part="panel-field"]'));
        expect(fields.map((field) => field.getAttribute('data-field')), 'the field marks').toEqual(['story', 'sounds', 'decodable', 'sight', 'books']);
        expect(
            fields.map((field) => field.querySelector('[data-part="panel-heading"]')?.textContent ?? ''),
            'the headings',
        ).toEqual(['Story', 'Sounds', 'Decodable words', 'Sight words', 'Books']);
        expect(
            fields.map((field) => field.querySelector('[data-part="panel-value"]')?.textContent ?? ''),
            'the values equal storytimeCoverPanelValues',
        ).toEqual(expected.map((value) => value.value));
        const teacherBack = parseHtml(await standardRender('teacher-back', 0));
        expect(teacherBack.querySelectorAll('[data-part="panel"]').length, 'the teacher back has no panel').toBe(0);
        expect(teacherBack.querySelectorAll('[data-part="panel-field"]').length, 'the teacher back has no field').toBe(0);
    });

    /** The kinds with a game bar, and the five bands (T04). */
    const T04_KINDS: QuestCoverKind[] = ['student-front', 'teacher-front', 'reader-a3'];
    const T04_CASES: Array<[QuestCoverKind, string]> = T04_KINDS.flatMap((kind) => BANDS.map((band): [QuestCoverKind, string] => [kind, band]));

    it('T04: the lit band table holds 15 rows', () => {
        expect(T04_CASES.length).toBe(15);
    });

    it.each(T04_CASES)('T04: %s lights %s once in the game bar', async (kind, band) => {
        const quest = await api();
        const base = kind === 'reader-a3' ? await shippedReader() : await shippedBook();
        const subject = { ...base, litBand: band };
        const html = await renderQuest(kind, subject, await standardAssets(kind), 0);
        const doc = parseHtml(html);
        const gameBar = doc.querySelector('[data-part="game-bar"]');
        expect(gameBar, `${kind} holds a game bar`).not.toBeNull();
        const lit = Array.from(gameBar!.querySelectorAll('[data-lit="true"]'));
        expect(lit.length, `${kind} lights exactly one icon for ${band}`).toBe(1);
        expect(lit[0].getAttribute('data-band'), `${kind} lights the band of the book`).toBe(band);
        const icons = Array.from(gameBar!.querySelectorAll('[data-part="band-icon"]'));
        expect(icons.length, `${kind} holds 5 band icons`).toBe(5);
        expect(icons.map((icon) => icon.getAttribute('data-band')), 'the icon order').toEqual(BANDS);
        expect(quest.checkQuestLitBand(html, band), `checkQuestLitBand for ${band}`).toEqual([]);
    });

    const T05_UNITS = [1, 2, 3, 4];

    it('T05: the unit bar table holds 4 rows', () => {
        expect(T05_UNITS.length).toBe(4);
    });

    it.each(T05_UNITS)('T05: unit %i fills exactly that many of the 4 unit parts', async (unit) => {
        const subject = { ...(await shippedBook()), unit };
        const doc = parseHtml(await renderQuest('student-front', subject, { art: ART_A }, 0));
        const parts = Array.from(doc.querySelectorAll('[data-unit-part]'));
        expect(parts.length, 'the unit bar holds 4 parts').toBe(4);
        expect(parts.map((part) => part.getAttribute('data-unit-part')), 'the part indices').toEqual(['1', '2', '3', '4']);
        expect(
            parts.filter((part) => part.getAttribute('data-filled') === 'true').length,
            `unit ${unit} fills ${unit} parts`,
        ).toBe(unit);
    });

    const T06_LEVELS = [1, 2, 3, 4];

    it('T06: the level table holds 4 rows', () => {
        expect(T06_LEVELS.length).toBe(4);
    });

    it.each(T06_LEVELS)('T06: level %i uses the level colour on the title plaque', async (level) => {
        const subject = { ...(await shippedBook()), level };
        const doc = parseHtml(await renderQuest('student-front', subject, { art: ART_A }, 0));
        const plaque = doc.querySelector('[data-part="title-plaque"]');
        expect(plaque, 'the title plaque exists').not.toBeNull();
        expect(plaque!.getAttribute('data-plaque-colour'), `level ${level} plaque colour`).toBe(LEVEL_COLOURS[level]);
    });

    it('T06: the colours match covers.ts and the teacher front and A3 plaque use the level 2 colour', async () => {
        expect(LEVEL_COLOURS[2], 'the level 2 colour').toBe('#2A77B8');
        expect(Object.keys(LEVEL_COLOURS).length, 'four level colours').toBe(4);
        for (const [level, colour] of Object.entries(STORYTIME_LEVEL_COLOURS)) {
            expect(LEVEL_COLOURS[Number(level)], `the hand written colour of level ${level}`).toBe(colour);
        }
        const teacher = parseHtml(await standardRender('teacher-front', 0));
        expect(teacher.querySelector('[data-part="title-plaque"]')?.getAttribute('data-plaque-colour'), 'the teacher plaque').toBe('#2A77B8');
        const reader = parseHtml(await standardRender('reader-a3', 0));
        expect(reader.querySelector('[data-part="title-plaque"]')?.getAttribute('data-plaque-colour'), 'the A3 plaque').toBe('#2A77B8');
    });

    it('T07: the frame of two books differs only in the per book values', async () => {
        const book = await shippedBook();
        const other: BookRow = {
            ...book,
            level: 3,
            unit: 2,
            litBand: 'leaf',
            art: { ...book.art, studentFront: 'l2-u2-cover-quest-student-front-v1-300ppi.png' },
        };
        const first = await renderQuest('student-front', book, { art: ART_A }, 0);
        const second = await renderQuest('student-front', other, { art: ART_B }, 0);
        expect(normalizedFrame(second, [ART_B]), 'the two frames are equal').toBe(normalizedFrame(first, [ART_A]));
    });

    const T08_CASES: Array<[QuestCoverKind, Bleed]> = KINDS.flatMap((kind) => ([0, 3] as Bleed[]).map((bleed): [QuestCoverKind, Bleed] => [kind, bleed]));

    it('T08: the page size table holds 12 rows', () => {
        expect(T08_CASES.length).toBe(12);
    });

    it.each(T08_CASES)('T08: %s at bleed %i has the page size of its trim', async (kind, bleed) => {
        const quest = await api();
        const trim = TRIMS[kind];
        const width = trim.widthMm + 2 * bleed;
        const height = trim.heightMm + 2 * bleed;
        const size = quest.questPageSize(kind, bleed);
        expect(size.widthMm, `${kind} page width`).toBe(width);
        expect(size.heightMm, `${kind} page height`).toBe(height);
        const html = await standardRender(kind, bleed);
        const rule = /@page[^{]*\{([^}]*)\}/.exec(html);
        expect(rule, `${kind} has an @page rule`).not.toBeNull();
        const sizeMatch = /size:\s*([0-9.]+)mm\s+([0-9.]+)mm/.exec(rule![1]);
        expect(sizeMatch, `${kind} @page has a size`).not.toBeNull();
        expect(Number(sizeMatch![1]), `${kind} @page width`).toBe(width);
        expect(Number(sizeMatch![2]), `${kind} @page height`).toBe(height);
        expect(quest.checkQuestPageSize(html, kind, bleed), `${kind} page size check`).toEqual([]);
        const art = parseHtml(html).querySelector('[data-part="art"]');
        expect(art, `${kind} art exists`).not.toBeNull();
        expect(mmOf(styleOf(art!).width), `${kind} art covers the page width`).toBeCloseTo(width, 2);
        expect(mmOf(styleOf(art!).height), `${kind} art covers the page height`).toBeCloseTo(height, 2);
    });

    it('T08: a bleed of 2 is an error', async () => {
        const quest = await api();
        expect(() => quest.questPageSize('student-front', 2), 'questPageSize throws for bleed 2').toThrow();
        const html = await standardRender('student-front', 0);
        expect(quest.checkQuestPageSize(html, 'student-front', 2).length, 'checkQuestPageSize reports bleed 2').toBeGreaterThan(0);
        expect(quest.checkQuestPageSize(html, 'student-front', 3).length, 'a wrong bleed is reported').toBeGreaterThan(0);
        expect(quest.checkQuestPageSize(html, 'student-front', 0), 'the right bleed passes').toEqual([]);
    });

    /** The text and face parts of every kind (T09, spec D-A5 safe zone). */
    const REQUIRED_BOXES: Array<[QuestCoverKind, string]> = [
        ['student-front', 'game-bar'],
        ['student-front', 'crest'],
        ['student-front', 'series-banner'],
        ['student-front', 'title-plaque'],
        ['teacher-front', 'game-bar'],
        ['teacher-front', 'crest'],
        ['teacher-front', 'series-banner'],
        ['teacher-front', 'title-plaque'],
        ['teacher-front', 'band-pill'],
        ['student-back', 'logo-box'],
        ['student-back', 'series-banner'],
        ['student-back', 'panel'],
        ['student-back', 'contact-sign'],
        ['student-back', 'qr'],
        ['student-back', 'line-label'],
        ['teacher-back', 'logo-box'],
        ['teacher-back', 'series-banner'],
        ['teacher-back', 'contact-sign'],
        ['teacher-back', 'qr'],
        ['teacher-back', 'line-label'],
        ['reader-a3', 'game-bar'],
        ['reader-a3', 'series-banner'],
        ['reader-a3', 'week-pill'],
        ['reader-a3', 'title-plaque'],
        ['reader-a3', 'role-bar'],
        ['reader-leaf', 'double-line-frame'],
        ['reader-leaf', 'title-plaque'],
        ['reader-leaf', 'band-word'],
        ['reader-leaf', 'series'],
        ['reader-leaf', 'week'],
        ['reader-leaf', 'role-mark'],
    ];

    it('T09: the box table holds 31 rows', () => {
        expect(REQUIRED_BOXES.length).toBe(31);
    });

    it('T09: every box of QUEST_BOXES lies 5 mm inside the trim at bleed 0 and bleed 3', async () => {
        const quest = await api();
        const entries = Object.entries(quest.QUEST_BOXES);
        expect(entries.length, 'QUEST_BOXES holds at least the required boxes').toBeGreaterThanOrEqual(31);
        expect(Object.keys(quest.QUEST_BOXES).some((key) => key.endsWith(':art')), 'the art is exempt').toBe(false);
        for (const [kind, part] of REQUIRED_BOXES) {
            expect(quest.QUEST_BOXES[`${kind}:${part}`], `QUEST_BOXES holds ${kind}:${part}`).toBeDefined();
        }
        for (const [key, box] of entries) {
            const colon = key.indexOf(':');
            const kind = key.slice(0, colon) as QuestCoverKind;
            const trim = TRIMS[kind];
            expect(trim, `${key} names one of the six kinds`).toBeTruthy();
            expect(box.kind, `${key} kind field`).toBe(kind);
            expect(box.widthMm > 0 && box.heightMm > 0, `${key} has a size`).toBe(true);
            for (const bleed of [0, 3] as Bleed[]) {
                const pageWidth = trim.widthMm + 2 * bleed;
                const pageHeight = trim.heightMm + 2 * bleed;
                const safe = 5 + bleed;
                expect(box.leftMm + bleed, `${key} left at bleed ${bleed}`).toBeGreaterThanOrEqual(safe);
                expect(box.topMm + bleed, `${key} top at bleed ${bleed}`).toBeGreaterThanOrEqual(safe);
                expect(box.leftMm + box.widthMm + bleed, `${key} right at bleed ${bleed}`).toBeLessThanOrEqual(pageWidth - safe);
                expect(box.topMm + box.heightMm + bleed, `${key} bottom at bleed ${bleed}`).toBeLessThanOrEqual(pageHeight - safe);
            }
        }
    });

    it.each([0, 3] as Bleed[])('T09: at bleed %i every part sits at its box plus the bleed', async (bleed) => {
        const quest = await api();
        for (const [kind, part] of REQUIRED_BOXES) {
            const box = quest.QUEST_BOXES[`${kind}:${part}`];
            expect(box, `QUEST_BOXES holds ${kind}:${part}`).toBeDefined();
            const doc = parseHtml(await standardRender(kind, bleed));
            const element = doc.querySelector(`[data-part="${part}"]`);
            expect(element, `${kind} renders ${part}`).not.toBeNull();
            expect(mmOf(styleOf(element!).left), `${kind}:${part} left`).toBeCloseTo(box.leftMm + bleed, 2);
            expect(mmOf(styleOf(element!).top), `${kind}:${part} top`).toBeCloseTo(box.topMm + bleed, 2);
            expect(mmOf(styleOf(element!).width), `${kind}:${part} width`).toBeCloseTo(box.widthMm, 2);
            expect(mmOf(styleOf(element!).height), `${kind}:${part} height`).toBeCloseTo(box.heightMm, 2);
        }
    }, 120000);

    /** The approved texts of each kind (T10, spec FR-4.1). */
    async function approvedTextsOf(kind: QuestCoverKind): Promise<string[]> {
        if (kind === 'student-front') return [SERIES, LEVEL_LINE, STUDENT_LINE];
        if (kind === 'teacher-front') return [SERIES, LEVEL_LINE, TEACHER_LINE, 'Sprout'];
        if (kind === 'student-back') return [SERIES, 'LINE', 'Story', 'Sounds', 'Decodable words', 'Sight words', 'Books', ...panelValues().map((value) => value.value)];
        if (kind === 'teacher-back') return [SERIES, 'LINE'];
        const reader = await shippedReader();
        return [SERIES, 'SPROUT', reader.weekText, reader.title, reader.roleLabel];
    }

    /** The allowed words of the page text of one kind (T10). */
    async function approvedWordsOf(kind: QuestCoverKind): Promise<Set<string>> {
        const words = new Set<string>();
        const add = (value: string): void => {
            for (const word of wordsOf(value)) words.add(word);
        };
        add(SERIES);
        add('LINE');
        if (kind === 'student-front' || kind === 'teacher-front') {
            add(LEVEL_LINE);
            if (kind === 'student-front') add(STUDENT_LINE);
            else {
                add(TEACHER_LINE);
                add('Sprout');
            }
        } else if (kind === 'student-back') {
            for (const heading of ['Story', 'Sounds', 'Decodable words', 'Sight words', 'Books']) add(heading);
            for (const value of panelValues()) add(value.value);
            for (const line of BACK_LINES.contact) add(line);
        } else if (kind === 'teacher-back') {
            for (const line of BACK_LINES.contact) add(line);
        } else {
            const reader = await shippedReader();
            add('SPROUT');
            add(reader.weekText);
            add(reader.title);
            add(reader.roleLabel);
        }
        return words;
    }

    it('T10: the copy passes, the approved texts show, and no new word appears in the six kinds', async () => {
        const quest = await api();
        for (const kind of KINDS) {
            const doc = parseHtml(await standardRender(kind, 0));
            const text = normalisedText(doc);
            expect(quest.checkQuestCopy(text), `checkQuestCopy of ${kind}`).toEqual([]);
            for (const approved of await approvedTextsOf(kind)) {
                expect(text, `${kind} shows "${approved}"`).toContain(approved);
            }
            const allowed = await approvedWordsOf(kind);
            const newWords = [...new Set(wordsOf(text))].filter((word) => !allowed.has(word));
            expect(newWords, `${kind} holds no new word`).toEqual([]);
        }
    }, 120000);

    it('T10: SPROUT is literal on the reader kinds and Sprout is literal on the teacher front', async () => {
        for (const kind of ['reader-a3', 'reader-leaf'] as const) {
            const text = normalisedText(parseHtml(await standardRender(kind, 0)));
            expect(text, `${kind} shows SPROUT`).toContain('SPROUT');
            expect(text, `${kind} shows no Sprout`).not.toContain('Sprout');
        }
        const teacher = normalisedText(parseHtml(await standardRender('teacher-front', 0)));
        expect(teacher, 'the teacher front shows Sprout').toContain('Sprout');
    });

    it('T11: the forbidden word table holds 18 rows', () => {
        expect(FORBIDDEN_CASES.length).toBe(18);
    });

    it.each(FORBIDDEN_CASES)('T11: %s in a title gives an error that names it', async (token, mode) => {
        const quest = await api();
        const errors = quest.checkQuestCopy(`${SERIES}\n${LEVEL_LINE}\n${token}`);
        expect(errors.length, `checkQuestCopy reports ${token}`).toBeGreaterThan(0);
        const joined = errors.join(' | ');
        if (mode === 'year') {
            expect(/year|2026/i.test(joined), `the year error names 2026: ${joined}`).toBe(true);
        } else {
            expect(joined.toLowerCase().includes(token.toLowerCase()), `the error names ${token}: ${joined}`).toBe(true);
        }
    });

    it('T11: the clean titles give no error', async () => {
        const quest = await api();
        for (const title of ['Is It a Ball?', 'Tap, Tap!', 'Never do not']) {
            expect(quest.checkQuestCopy(`${SERIES}\n${title}`), `the clean title "${title}" passes`).toEqual([]);
        }
    });

    it('T11: a forbidden word on a line that holds never and do not is still caught', async () => {
        const quest = await api();
        const errors = quest.checkQuestCopy(`${SERIES}\nNever do not mention Chibi here`);
        expect(
            errors.some((error) => error.toLowerCase().includes('chibi')),
            `the line is not filtered away: ${errors.join(' | ')}`,
        ).toBe(true);
    });

    it('T11: a word split by a soft hyphen or by wbr is still caught', async () => {
        const quest = await api();
        const soft = quest.checkQuestCopy(`${SERIES}\nChi\u00ADbi`);
        expect(
            soft.some((error) => error.toLowerCase().includes('chibi')),
            `the soft hyphen form is caught: ${soft.join(' | ')}`,
        ).toBe(true);
        const doc = new DOMParser().parseFromString(`${SERIES}<br>Chi<wbr>bi`, 'text/html');
        const split = quest.checkQuestCopy(doc.body.textContent ?? '');
        expect(
            split.some((error) => error.toLowerCase().includes('chibi')),
            `the wbr form is caught: ${split.join(' | ')}`,
        ).toBe(true);
    });

    it('T12: each back holds the Thai of BACK_LINES.contact byte for byte, with no markers', async () => {
        const quest = await api();
        const expected = Buffer.from(thaiOf(BACK_LINES.contact.join('\n')), 'utf8');
        expect(expected.length, 'the approved Thai holds bytes').toBeGreaterThan(0);
        for (const kind of ['student-back', 'teacher-back'] as const) {
            const text = pageText(parseHtml(await standardRender(kind, 0)));
            const found = Buffer.from(thaiOf(text), 'utf8');
            expect(found.equals(expected), `${kind} Thai bytes equal the approved bytes`).toBe(true);
            expect(quest.checkQuestThai(text, kind), `${kind} Thai check`).toEqual([]);
            expect(text, `${kind} holds no ** marker`).not.toContain('**');
        }
    });

    it('T12: the fronts and the reader covers hold no Thai', async () => {
        const quest = await api();
        for (const kind of ['student-front', 'teacher-front', 'reader-a3', 'reader-leaf'] as const) {
            const text = pageText(parseHtml(await standardRender(kind, 0)));
            expect(thaiOf(text).length, `${kind} holds no Thai character`).toBe(0);
            expect(quest.checkQuestThai(text, kind), `${kind} Thai check`).toEqual([]);
        }
    });

    it('T12: a changed byte, a removed tone mark, a decomposed sara am, and Thai on a front are errors', async () => {
        const quest = await api();
        const thai = thaiOf(BACK_LINES.contact.join('\n'));
        const changed = `${thai.slice(0, -1)}\u0E01`;
        expect(quest.checkQuestThai(changed, 'student-back').length, 'one changed Thai character fails').toBeGreaterThan(0);
        const withoutTone = thai.replace('\u0E4C', '');
        expect(withoutTone.length, 'the approved Thai holds a tone mark').toBeLessThan(thai.length);
        expect(quest.checkQuestThai(withoutTone, 'student-back').length, 'one removed tone mark fails').toBeGreaterThan(0);
        const decomposed = `${thai.slice(0, 1)}\u0E4D\u0E32${thai.slice(1)}`;
        expect(quest.checkQuestThai(decomposed, 'student-back').length, 'the decomposed sara am form fails').toBeGreaterThan(0);
        expect(quest.checkQuestThai(`${SERIES}\u0E01`, 'student-front').length, 'one Thai letter on a front fails').toBeGreaterThan(0);
        expect(quest.checkQuestThai(thai, 'student-back'), 'the exact Thai passes').toEqual([]);
    });

    it('T13: both backs show the LINE QR with 0 different modules', async () => {
        const quest = await api();
        const expected = storytimeCoverQrGrid(storytimeCoverQrSvg());
        expect(expected.modules, 'the encoder grid modules').toBeGreaterThanOrEqual(21);
        expect(expected.dark, 'the encoder grid dark count').toBeGreaterThan(0);
        for (const kind of ['student-back', 'teacher-back'] as const) {
            const doc = parseHtml(await standardRender(kind, 0));
            const box = doc.querySelector('[data-part="qr"]');
            expect(box, `${kind} holds a QR box`).not.toBeNull();
            const input = doc.querySelector('[data-qr-input]');
            expect(input?.getAttribute('data-qr-input'), `${kind} QR input`).toBe(STORYTIME_LINE_ADDRESS);
            const svg = box!.querySelector('svg');
            expect(svg, `${kind} holds the QR svg`).not.toBeNull();
            const grid = storytimeCoverQrGrid(svg!.outerHTML);
            expect(grid.modules, `${kind} QR modules`).toBeGreaterThanOrEqual(21);
            expect(grid.dark, `${kind} QR dark count`).toBeGreaterThan(0);
            expect(checkStorytimeCoverQr(grid.cells, expected.cells), `${kind} different modules`).toBe(0);
            const result = quest.checkQuestQr(svg!.outerHTML);
            expect(result.modules, `${kind} checkQuestQr modules`).toBe(grid.modules);
            expect(result.dark, `${kind} checkQuestQr dark count`).toBe(grid.dark);
            expect(result.different, `${kind} checkQuestQr difference`).toBe(0);
            expect(result.errors, `${kind} checkQuestQr errors`).toEqual([]);
        }
    });

    it('T13: one flipped module counts as one difference', async () => {
        const quest = await api();
        const source = storytimeCoverQrSvg();
        const grid = storytimeCoverQrGrid(source);
        expect(grid.dark, 'the encoder grid holds a dark module').toBeGreaterThan(0);
        let darkRect: string | null = null;
        for (const match of source.matchAll(/<rect\b[^>]*\/?>/g)) {
            const attrs = match[0];
            if (/fill="#000000"/i.test(attrs) && /\bwidth="10"/.test(attrs)) {
                darkRect = attrs;
                break;
            }
        }
        expect(darkRect, 'the encoder svg holds a dark module rect').not.toBeNull();
        const flippedSvg = source.replace(darkRect!, darkRect!.replace(/fill="#000000"/i, 'fill="#FFFFFF"'));
        const flipped = storytimeCoverQrGrid(flippedSvg);
        expect(flipped.dark, 'the flipped grid has one dark module less').toBe(grid.dark - 1);
        expect(checkStorytimeCoverQr(flipped.cells, grid.cells), 'the shared check counts one difference').toBe(1);
        expect(quest.checkQuestQr(flippedSvg).different, 'checkQuestQr counts one difference').toBe(1);
    });

    it('T13: the fronts and the reader covers hold no QR', async () => {
        for (const kind of ['student-front', 'teacher-front', 'reader-a3', 'reader-leaf'] as const) {
            const doc = parseHtml(await standardRender(kind, 0));
            expect(doc.querySelectorAll('[data-part="qr"]').length, `${kind} QR part`).toBe(0);
            expect(doc.querySelectorAll('[data-qr-input]').length, `${kind} QR input`).toBe(0);
        }
    });

    /** The five text slots of T14. Injected slots take a synthetic string. */
    const T14_SLOTS: Array<[string, string, 'inject' | 'static']> = [
        ['level-line', '[data-part="level-line"]', 'static'],
        ['band-pill', '[data-part="band-pill"]', 'static'],
        ['week-pill', '[data-part="week-pill"]', 'inject'],
        ['title', '[data-part="title-plaque"]', 'inject'],
        ['role-label', '[data-part="role-bar"]', 'inject'],
    ];

    it('T14: the escape table holds 5 rows', () => {
        expect(T14_SLOTS.length).toBe(5);
    });

    it.each(T14_SLOTS)('T14: the %s text is escaped exactly once', async (slot, selector, mode) => {
        let doc: Document;
        let expectedText: string;
        if (mode === 'inject') {
            const reader = await shippedReader();
            const subject: ReaderRow = { ...reader, title: ESCAPE_IN, weekText: ESCAPE_IN, roleLabel: ESCAPE_IN };
            doc = parseHtml(await renderQuest('reader-a3', subject, { art: ART_A }, 0));
            expectedText = ESCAPE_OUT;
        } else {
            doc = parseHtml(await standardRender(slot === 'level-line' ? 'student-front' : 'teacher-front', 0));
            expectedText = slot === 'level-line' ? LEVEL_LINE : 'Sprout';
        }
        const raw = partHtml(doc, selector);
        const element = doc.querySelector(selector)!;
        expect(raw, `${slot} has no double escape`).not.toMatch(/&amp;(?:amp|lt|gt|quot);/);
        if (mode === 'inject') {
            expect(countOf(raw, expectedText), `${slot} holds its escaped text once`).toBe(1);
            expect(element.textContent ?? '', `${slot} decodes once`).toContain(ESCAPE_IN);
            const whole = doc.documentElement.outerHTML;
            expect(whole, 'no raw tag of the synthetic text').not.toContain('<i>');
            expect(whole, 'no double escape in the document').not.toMatch(/&amp;(?:amp|lt|gt|quot);/);
        } else {
            expect((element.textContent ?? '').trim(), `${slot} decodes to its approved text`).toBe(expectedText);
        }
    });

    it('T15: questReaders gives the 14 shipped rows and changes no source file', async () => {
        const rows = await shippedReaders();
        expect(rows.length, 'the reader count').toBe(14);
        expect(
            READER_SOURCES.map((file) => hashFile(file)),
            'the week files and pictures.json are unchanged',
        ).toEqual(INITIAL_HASHES);
        const weeks = [...new Set(rows.map((row) => row.week))].sort((a, b) => a - b);
        expect(weeks, 'the reader weeks').toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(rows.filter((row) => row.week === 8).length, 'week 8 gives no row').toBe(0);
        for (let week = 1; week <= 7; week++) {
            expect(rows.filter((row) => row.week === week).length, `week ${week} holds 2 rows`).toBe(2);
        }
        const covers = coverPictureRows();
        expect(covers.length, 'the cover rows of pictures.json').toBe(14);
        const slugs = new Set<string>();
        let listen = 0;
        let sound = 0;
        let first = 0;
        for (const row of rows) {
            const raw = rawWeek(row.week);
            const book = raw.books.find((entry) => entry.title === row.title);
            expect(book, `"${row.title}" is a reader of week ${row.week}`).toBeTruthy();
            expect(row.kind, `${row.title} kind`).toBe(book!.kind);
            expect(row.roleLabel, `${row.title} role label`).toBe(expectedRole(book!));
            if (row.roleLabel === LISTEN_ROLE) listen++;
            else if (row.roleLabel === SOUND_ROLE) sound++;
            else first++;
            expect(row.weekText, `${row.title} week text`).toBe(`Week ${row.week}`);
            expect(row.litBand, `${row.title} band`).toBe(raw.meta.band.toLowerCase());
            expect(row.level, `${row.title} level`).toBe(raw.meta.level);
            const cover = covers.find((entry) => entry.week === row.week && entry.text === row.title);
            expect(cover, `pictures.json holds the cover row of "${row.title}"`).toBeTruthy();
            expect(row.picture.fileName, `${row.title} picture file`).toBe(cover!.fileName);
            expect(row.picture.lineArtFileName, `${row.title} line art file`).toBe(cover!.lineArtFileName);
            const pad = String(row.week).padStart(2, '0');
            expect(row.picture.fileName, `${row.title} picture name`).toMatch(
                new RegExp(`^l2-w${pad}-cover-[a-z0-9]+(?:-[a-z0-9]+)*-v1\\.png$`),
            );
            expect(row.picture.fileName, `${row.title} picture file of its slug`).toBe(`l2-w${pad}-cover-${row.slug}-v1.png`);
            expect(row.picture.lineArtFileName, `${row.title} line art of its slug`).toBe(`l2-w${pad}-cover-${row.slug}-line-v1.png`);
            expect(row.slug, `${row.title} slug`).toBe(slugOf(cover!.fileName));
            expect(slugs.has(row.slug), `the slug ${row.slug} is unique`).toBe(false);
            slugs.add(row.slug);
        }
        expect(listen, 'the Listen and read. readers').toBe(8);
        expect(sound, 'the Sound it out. readers').toBe(6);
        expect(first, 'no reader uses the first sound label').toBe(0);
        expect(listen + sound + first, 'every row holds a known label').toBe(14);
        const quest = await api();
        expect(quest.QUEST_ROLE_LABELS, 'the role labels of pin P1').toEqual({
            listen: LISTEN_ROLE,
            sound: SOUND_ROLE,
            firstSound: FIRST_SOUND_ROLE,
        });
    }, 120000);

    it('T16: the role label, the title, and the week text equal the shared reader cover page', async () => {
        const rows = await shippedReaders();
        expect(rows.length, 'the reader count').toBe(14);
        const weeks = level2Weeks();
        for (const row of rows) {
            const week = weeks.find((entry) => entry.meta.week === row.week);
            expect(week, `week ${row.week} reads`).toBeTruthy();
            const compiled = compileStorytimeReaders([week!], {
                profile: STORYTIME_PRINT_PROFILE,
                mode: 'proof',
                output: 'a3-color',
                bookTitle: row.title,
            }).html;
            const doc = parseHtml(compiled);
            const role = doc.querySelector('[data-part="reader-role"]');
            expect(role, `${row.title} reader-role part`).not.toBeNull();
            const roleText = (role!.querySelector('span')?.textContent ?? role!.textContent ?? '').trim();
            expect(row.roleLabel, `${row.title} role parity`).toBe(roleText);
            const title = doc.querySelector('[data-part="reader-cover-title"]');
            expect(title, `${row.title} reader-cover-title part`).not.toBeNull();
            expect(row.title, `${row.title} title parity`).toBe((title!.textContent ?? '').trim());
            const weekText = (doc.querySelector('.reader-week')?.textContent ?? '').trim();
            expect(row.weekText, `${row.title} week text parity`).toBe(weekText);
            expect(weekText, `the week text of week ${row.week}`).toBe(`Week ${row.week}`);
        }
    }, 120000);

    it('T17: the reader cover page gives body and css with a quest only scope', async () => {
        const quest = await api();
        const reader = await shippedReader();
        const cssTexts: string[] = [];
        for (const trim of [{ widthMm: 420, heightMm: 297 }, { widthMm: 198, heightMm: 148.5 }]) {
            const page = quest.questReaderCoverPage(reader, trim, { art: ART_A }, { bleedMm: 0 });
            expect(page.body, 'the body is a string').toBeTypeOf('string');
            expect(page.css, 'the css is a string').toBeTypeOf('string');
            expect(page.body.toLowerCase(), 'the body has no document tag').not.toMatch(/<(html|head|body)[\s>]/);
            expect(page.body, 'the body holds a part mark').toContain('data-part=');
            expect(page.css, 'the css has no @page').not.toMatch(/@page/);
            const selectors = (page.css.match(/([^{}]+)\{/g) ?? [])
                .map((rule) => rule.slice(0, -1).trim())
                .filter((rule) => rule && !rule.startsWith('@'));
            expect(selectors.length, 'the css holds selectors').toBeGreaterThan(0);
            for (const selector of selectors) {
                expect(selector.startsWith('.quest-'), `the selector "${selector}" starts with .quest-`).toBe(true);
            }
            cssTexts.push(page.css);
        }
        expect(cssTexts[0] === cssTexts[1], 'the two trims give different css').toBe(false);
    });

    it('T18: the leaf holds only black, white, and grey colour tokens', async () => {
        const leaf = await standardRender('reader-leaf', 0);
        const tokens = [...new Set(colourTokens(leaf))]
            .map((token) => token.trim())
            .filter((token) => !/^(?:none|transparent|currentcolor|inherit|initial|unset)$/i.test(token));
        expect(tokens.length, 'the leaf holds colour tokens').toBeGreaterThanOrEqual(1);
        expect(
            tokens.filter((token) => !isAchromatic(token)),
            'every leaf colour is black, white, or grey',
        ).toEqual([]);
    });

    it('T18: the A3 reader cover holds a colour that is not grey (not vacuous)', async () => {
        const reader = await standardRender('reader-a3', 0);
        const tokens = [...new Set(colourTokens(reader))]
            .map((token) => token.trim())
            .filter((token) => !/^(?:none|transparent|currentcolor|inherit|initial|unset)$/i.test(token));
        expect(
            tokens.some((token) => !isAchromatic(token)),
            'the A3 cover holds a colour token',
        ).toBe(true);
    });

    /** The banned CSS fragments of T19 (test-strategy F11 and F16). */
    const CSS_BANNED = ['rgba(', 'hsla(', 'opacity', 'box-shadow', 'text-shadow', 'drop-shadow', 'filter', 'backdrop', 'mix-blend', 'gradient(', 'blur('];
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
    const FONT_FAMILIES = ['andika', 'sarabun', 'league spartan'];
    const GENERIC_FAMILIES = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'inherit', 'initial', 'unset'];

    it('T19: the CSS of the six kinds and the reader page is PDF/X safe', async () => {
        const quest = await api();
        const reader = await shippedReader();
        const styles = new Map<string, string>();
        for (const kind of KINDS) styles.set(kind, styleText(parseHtml(await standardRender(kind, 0))));
        styles.set('reader-page', quest.questReaderCoverPage(reader, { widthMm: 420, heightMm: 297 }, { art: ART_A }, { bleedMm: 0 }).css);
        expect(styles.size, 'six kinds plus the reader page').toBe(7);
        for (const [name, css] of styles) {
            for (const banned of CSS_BANNED) {
                expect(css.includes(banned), `${name} CSS holds no "${banned}"`).toBe(false);
            }
            expect(EMOJI.test(css), `${name} CSS holds no emoji`).toBe(false);
            expect(/font-synthesis:\s*none/.test(css), `${name} sets font-synthesis none`).toBe(true);
            expect(/font-weight:\s*\d+\s+\d+/.test(css), `${name} has no weight range`).toBe(false);
            expect(css.includes('font-variation-settings'), `${name} has no variation settings`).toBe(false);
            for (const rule of css.matchAll(/font-family:\s*([^;}]+)/gi)) {
                for (const raw of rule[1].split(',')) {
                    const family = raw.trim().replace(/^['"]|['"]$/g, '');
                    if (!family) continue;
                    const ok =
                        FONT_FAMILIES.includes(family.toLowerCase()) || GENERIC_FAMILIES.includes(family.toLowerCase());
                    expect(ok, `${name} uses the family "${family}"`).toBe(true);
                }
            }
            expect(quest.questCssSafetyErrors(css), `questCssSafetyErrors of ${name}`).toEqual([]);
        }
        for (const kind of KINDS) {
            expect(EMOJI.test(await standardRender(kind, 0)), `${kind} holds no emoji`).toBe(false);
        }
    }, 120000);

    it('T19: questCssSafetyErrors reports unsafe css', async () => {
        const quest = await api();
        expect(quest.questCssSafetyErrors('.quest-x { box-shadow: 0 0 2px #000000; }').length, 'box-shadow is reported').toBeGreaterThan(0);
        expect(quest.questCssSafetyErrors('.quest-x { opacity: 0.9; }').length, 'opacity is reported').toBeGreaterThan(0);
        expect(quest.questCssSafetyErrors('.quest-a { font-weight: 100 900; }').length, 'a weight range is reported').toBeGreaterThan(0);
    });

    it('T20: every file font url names an existing file', async () => {
        let checked = 0;
        for (const kind of KINDS) {
            const css = styleText(parseHtml(await standardRender(kind, 0)));
            for (const match of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
                const url = match[1];
                expect(url.startsWith('file://'), `the font url ${url} is a file url`).toBe(true);
                const file = decodeURIComponent(url.replace(/^file:\/\//, ''));
                expect(fs.existsSync(file), `the font file ${file} exists`).toBe(true);
                checked++;
            }
        }
        expect(checked, 'the CSS holds font urls').toBeGreaterThanOrEqual(1);
    });

    it('T21: every src, href, and url is file or data, and no @import appears', async () => {
        const quest = await api();
        const urls: string[] = [];
        for (const kind of KINDS) {
            const doc = parseHtml(await standardRender(kind, 0));
            for (const element of Array.from(doc.querySelectorAll('[src]'))) urls.push(element.getAttribute('src') ?? '');
            for (const element of Array.from(doc.querySelectorAll('[href]'))) urls.push(element.getAttribute('href') ?? '');
            const css = styleText(doc);
            expect(css, `${kind} has no @import`).not.toMatch(/@import/);
            for (const match of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) urls.push(match[1]);
        }
        const reader = await shippedReader();
        const page = quest.questReaderCoverPage(reader, { widthMm: 420, heightMm: 297 }, { art: ART_A }, { bleedMm: 0 });
        expect(page.css, 'the reader css has no @import').not.toMatch(/@import/);
        for (const match of page.css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) urls.push(match[1]);
        expect(urls.length, 'the documents hold urls').toBeGreaterThanOrEqual(6);
        for (const url of urls) {
            expect(/^(?:file:\/\/|data:)/.test(url), `the url "${url}" is file:// or data:`).toBe(true);
        }
    }, 120000);

    /** The rejections of T22, with the field words that the errors must name. */
    const T22_CASES: Array<[string, () => unknown, string[]]> = [
        ['level 0', () => withBook({ level: 0 }), ['level']],
        ['level 5', () => withBook({ level: 5 }), ['level']],
        ['level 1.5', () => withBook({ level: 1.5 }), ['level']],
        ['unit 5', () => withBook({ unit: 5 }), ['unit']],
        [
            'a level and unit repeat',
            () => {
                const data = freshData();
                data.books.push(JSON.parse(JSON.stringify(data.books[0])) as BookRow);
                return data;
            },
            ['row', 'duplicate', 'repeat', 'twice', 'level'],
        ],
        ['litBand Sprout', () => withBook({ litBand: 'Sprout' }), ['litband', 'band']],
        ['litBand tree', () => withBook({ litBand: 'tree' }), ['litband', 'band']],
        [
            'a missing litBand',
            () => {
                const data = freshData();
                delete (data.books[0] as Partial<BookRow>).litBand;
                return data;
            },
            ['litband', 'band'],
        ],
        [
            'an art name with path traversal',
            () => withBook({ art: { ...BASE_DATA.books[0].art, studentFront: '../l2-u1-cover-quest-student-front-v1-300ppi.png' } }),
            ['art', 'path', 'name'],
        ],
        [
            'an art name with an absolute path',
            () => withBook({ art: { ...BASE_DATA.books[0].art, studentFront: '/etc/passwd.png' } }),
            ['art', 'path', 'name'],
        ],
        [
            'an art name with a NUL byte',
            () => withBook({ art: { ...BASE_DATA.books[0].art, studentFront: 'l2\u0000-u1-cover-quest-student-front-v1-300ppi.png' } }),
            ['art', 'name'],
        ],
        [
            'an art name with a wrong extension',
            () => withBook({ art: { ...BASE_DATA.books[0].art, studentFront: 'l2-u1-cover-quest-student-front-v1.jpg' } }),
            ['art', 'name'],
        ],
        [
            'an art name with a wrong side token',
            () => withBook({ art: { ...BASE_DATA.books[0].art, studentFront: 'l2-u1-cover-quest-teacher-front-v1-300ppi.png' } }),
            ['art', 'side', 'name'],
        ],
        [
            'a student cast of 3 children',
            () => withBook({ cast: { ...BASE_DATA.books[0].cast, studentFront: ['Ava', 'Bo', 'Cy', 'Pip'] } }),
            ['cast', 'child'],
        ],
        [
            'a student cast of 2 animals',
            () => withBook({ cast: { ...BASE_DATA.books[0].cast, studentFront: ['Ava', 'Bo', 'Pip', 'Fen'] } }),
            ['cast', 'animal'],
        ],
        [
            'a teacher cast of 3 children',
            () => withBook({ cast: { ...BASE_DATA.books[0].cast, teacherFront: ['Ava', 'Bo', 'Cy'] } }),
            ['cast', 'child'],
        ],
        [
            'a cast name outside the roster',
            () => withBook({ cast: { ...BASE_DATA.books[0].cast, studentFront: ['Ava', 'Bo', 'Zoe'] } }),
            ['cast', 'roster', 'name'],
        ],
        [
            'an unknown key in a row',
            () => {
                const data = freshData();
                (data.books[0] as unknown as Record<string, unknown>).colour = '#fff';
                return data;
            },
            ['colour', 'key', 'unknown'],
        ],
        [
            'a __proto__ key',
            () => JSON.parse(`${JSON.stringify(BASE_DATA).slice(0, -1)},"__proto__":{"polluted":true}}`) as QuestData,
            ['__proto__', 'key', 'unknown'],
        ],
        [
            'empty books',
            () => {
                const data = freshData();
                data.books = [];
                return data;
            },
            ['books'],
        ],
        [
            'books that are not an array',
            () => {
                const data = freshData() as unknown as Record<string, unknown>;
                data.books = {};
                return data;
            },
            ['books'],
        ],
    ];

    it('T22: the rejection table holds 21 rows', () => {
        expect(T22_CASES.length).toBe(21);
    });

    it.each(T22_CASES)('T22: %s is rejected with an error that names the field', async (name, build, keywords) => {
        const quest = await api();
        const errors = quest.checkQuestCoverData(build());
        expect(errors.length, `${name} is rejected`).toBeGreaterThan(0);
        const joined = errors.join(' | ').toLowerCase();
        expect(
            keywords.some((keyword) => joined.includes(keyword)),
            `${name}: the error names the field (${keywords.join(', ')}): ${joined}`,
        ).toBe(true);
    });

    it('T22: the valid L2U1 row is accepted', async () => {
        const quest = await api();
        expect(quest.checkQuestCoverData(freshData()), 'the valid row passes').toEqual([]);
    });

    it('T23: the shipped quest.json passes with the L2U1 row, the sprout band, and the fixed cast', async () => {
        expect(fs.existsSync(questDataFile), 'Missing file: content/storytime/covers/quest.json (Red 1).').toBe(true);
        const quest = await api();
        const data = quest.loadQuestCovers();
        expect(quest.checkQuestCoverData(data), 'the shipped data passes').toEqual([]);
        expect(data.series, 'the series').toBe('Storytime Advantage');
        expect(data.books.length, 'the row count is 1').toBe(1);
        const row = data.books[0];
        expect(row.level, 'the level').toBe(2);
        expect(row.unit, 'the unit').toBe(1);
        expect(row.litBand, 'the lit band is lower case').toBe('sprout');
        const bands = Array.from({ length: 7 }, (_unused, index) => rawWeek(index + 1).meta.band);
        expect(bands.length, 'the seven shipped reader weeks').toBe(7);
        for (const band of bands) expect(band.toLowerCase(), 'every week band is the lit band').toBe(row.litBand);
        expect([...row.cast.studentFront].sort(), 'the student cast').toEqual(['Nan', 'Pip', 'Sam']);
        expect([...row.cast.teacherFront].sort(), 'the teacher cast').toEqual(['Nan', 'Sam', 'Teacher Kim']);
        expect(Object.keys(data.roster), 'the roster holds the cast names').toEqual(
            expect.arrayContaining(['Nan', 'Sam', 'Pip', 'Teacher Kim']),
        );
        expect(row.art.studentFront, 'the student front art name').toMatch(
            /^l2-u1-cover-quest-student-front-v1-300ppi\.png$/,
        );
        expect(row.art.back, 'the back art name').toMatch(/^l2-u1-cover-quest-back-v1-300ppi\.png$/);
        expect(row.art.teacherFront, 'the teacher front art name').toMatch(
            /^l2-u1-cover-quest-teacher-front-v1-300ppi\.png$/,
        );
        expect(quest.checkQuestCoverData(JSON.parse(fs.readFileSync(questDataFile, 'utf8'))), 'the file passes without art files').toEqual([]);
    });

    /** The art ppi cases of pin P10 (T24), hand written. */
    const T24_CASES: Array<{
        name: string;
        kind: QuestCoverKind;
        widthPx: number;
        heightPx: number;
        bleedMm: Bleed;
        pass: boolean;
        ppi?: number;
        minPpi?: number;
    }> = [
        { name: '2480x3508 passes at bleed 0 with 299.96 ppi', kind: 'student-front', widthPx: 2480, heightPx: 3508, bleedMm: 0, pass: true, ppi: 299.96, minPpi: 299 },
        { name: '1448x2048 fails', kind: 'student-front', widthPx: 1448, heightPx: 2048, bleedMm: 0, pass: false },
        { name: '1447x2048 fails', kind: 'student-front', widthPx: 1447, heightPx: 2048, bleedMm: 0, pass: false },
        { name: '2400x3400 fails', kind: 'student-front', widthPx: 2400, heightPx: 3400, bleedMm: 0, pass: false },
        { name: '2480x3508 fails at bleed 3 with 291.6 ppi', kind: 'student-front', widthPx: 2480, heightPx: 3508, bleedMm: 3, pass: false, ppi: 291.6 },
        { name: '2551x3579 passes at bleed 3', kind: 'student-front', widthPx: 2551, heightPx: 3579, bleedMm: 3, pass: true },
        { name: 'the A3 reader art passes at 240 with 241.9 ppi', kind: 'reader-a3', widthPx: 4000, heightPx: 3000, bleedMm: 0, pass: true, ppi: 241.9, minPpi: 240 },
    ];

    it('T24: the art table holds 7 rows', () => {
        expect(T24_CASES.length).toBe(7);
    });

    it.each(T24_CASES)('T24: $name', async (artCase) => {
        const quest = await api();
        const result = quest.checkQuestArt({
            kind: artCase.kind,
            widthPx: artCase.widthPx,
            heightPx: artCase.heightPx,
            bleedMm: artCase.bleedMm,
        });
        if (artCase.pass) {
            expect(result.errors, `${artCase.name} passes`).toEqual([]);
        } else {
            expect(result.errors.length, `${artCase.name} fails`).toBeGreaterThan(0);
        }
        if (artCase.ppi !== undefined) expect(result.ppi, `${artCase.name} measured ppi`).toBeCloseTo(artCase.ppi, 1);
        if (artCase.minPpi !== undefined) expect(result.minPpi, `${artCase.name} minimum ppi`).toBe(artCase.minPpi);
    });

    it('T25: the same input gives byte-identical HTML twice', async () => {
        const book = await shippedBook();
        const reader = await shippedReader();
        const assets = { art: ART_A };
        expect(await renderQuest('student-front', book, assets, 0), 'the student front is stable').toBe(
            await renderQuest('student-front', book, assets, 0),
        );
        expect(await renderQuest('teacher-back', book, { ...assets, logo: LOGO }, 3), 'the teacher back is stable').toBe(
            await renderQuest('teacher-back', book, { ...assets, logo: LOGO }, 3),
        );
        const quest = await api();
        const trim = { widthMm: 420, heightMm: 297 };
        expect(
            quest.questReaderCoverPage(reader, trim, assets, { bleedMm: 0 }),
            'the reader page is stable',
        ).toEqual(quest.questReaderCoverPage(reader, trim, assets, { bleedMm: 0 }));
    });

    it('T26: the art layer is first, alt empty, covered, without opacity, and at trim plus bleed', async () => {
        for (const kind of KINDS) {
            const doc = parseHtml(await standardRender(kind, 0));
            const art = doc.querySelector('[data-part="art"]');
            expect(art, `${kind} holds an art part`).not.toBeNull();
            expect(art!.getAttribute('alt'), `${kind} art alt`).toBe('');
            const parent = art!.parentElement!;
            expect(Array.from(parent.children)[0], `${kind} art is the first element child`).toBe(art);
            const bodyIndex = Array.from(doc.body.children).indexOf(parent);
            expect(bodyIndex === -1 || bodyIndex === 0, `${kind} art parent is first in the body`).toBe(true);
            const style = (art!.getAttribute('style') ?? '').toLowerCase();
            const css = styleText(doc).toLowerCase();
            expect(style.includes('opacity'), `${kind} art holds no opacity`).toBe(false);
            expect(/position:\s*absolute/.test(style) || /position:\s*absolute/.test(css), `${kind} art is positioned absolute`).toBe(true);
            expect(/object-fit:\s*cover/.test(style) || /object-fit:\s*cover/.test(css), `${kind} art uses object-fit cover`).toBe(true);
            expect(mmOf(styleOf(art!).width), `${kind} art width equals the page`).toBeCloseTo(TRIMS[kind].widthMm, 2);
            expect(mmOf(styleOf(art!).height), `${kind} art height equals the page`).toBeCloseTo(TRIMS[kind].heightMm, 2);
            expect(mmOf(styleOf(art!).left), `${kind} art left`).toBeCloseTo(0, 2);
            expect(mmOf(styleOf(art!).top), `${kind} art top`).toBeCloseTo(0, 2);
        }
    }, 120000);

    it('T27: every exported function and constant has a JSDoc block', async () => {
        await api();
        const source = fs.readFileSync(coverQuestFile, 'utf8');
        expect(P1_FUNCTIONS.length + P1_CONSTANTS.length, 'the export lists hold 16 names').toBe(16);
        for (const name of P1_FUNCTIONS) expect(hasJsDoc(source, 'function', name), `JSDoc for the function ${name}`).toBe(true);
        for (const name of P1_CONSTANTS) expect(hasJsDoc(source, 'const', name), `JSDoc for the constant ${name}`).toBe(true);
    });

    it('T28: the imports of cover-quest.ts are inside the allowed set', async () => {
        await api();
        const source = fs.readFileSync(coverQuestFile, 'utf8');
        const specifiers: string[] = [];
        for (const match of source.matchAll(/^\s*import\s+[^'"]*?from\s*'([^']+)'/gm)) specifiers.push(match[1]);
        for (const match of source.matchAll(/^\s*import\s+'([^']+)'/gm)) specifiers.push(match[1]);
        for (const match of source.matchAll(/import\(\s*'([^']+)'\s*\)/g)) specifiers.push(match[1]);
        expect(specifiers.length, 'the module holds at least one import').toBeGreaterThanOrEqual(1);
        const allowedFiles = new Set([
            path.join(dashboardRoot, 'lib', 'storytime', 'print', 'covers.ts'),
            path.join(dashboardRoot, 'lib', 'storytime', 'print', 'teacher-book-cover.ts'),
            path.join(dashboardRoot, 'lib', 'storytime', 'print', 'cover-picture.ts'),
            path.join(dashboardRoot, 'lib', 'covers', 'back-text.ts'),
        ]);
        const allowedNode = new Set(['fs', 'path', 'url', 'sharp', 'node:fs', 'node:path', 'node:url', 'node:sharp']);
        const banned = ['child_process', 'postgres', '@aws-sdk', '@supabase', 'drizzle'];
        for (const specifier of specifiers) {
            for (const bad of banned) expect(specifier.includes(bad), `no ${bad} import (got "${specifier}")`).toBe(false);
            expect(!/^(?:next|@\/|apps\/)/.test(specifier), `no next, alias, or apps import (got "${specifier}")`).toBe(true);
            expect(!/^(?:node:)?https?:/.test(specifier), `no http import (got "${specifier}")`).toBe(true);
            if (specifier.startsWith('.')) {
                const resolved = path.resolve(path.dirname(coverQuestFile), specifier);
                const candidates = [resolved, `${resolved}.ts`, path.join(resolved, 'index.ts')];
                expect(
                    candidates.some((file) => allowedFiles.has(file)),
                    `the relative import "${specifier}" is a shared D-A2 module`,
                ).toBe(true);
            } else {
                expect(allowedNode.has(specifier), `the import "${specifier}" is an allowed package`).toBe(true);
            }
        }
    });

    it('T29: import and six renders call fetch 0 times and fs.writeFileSync 0 times', async () => {
        const quest = await api();
        const source = fs.readFileSync(coverQuestFile, 'utf8');
        const code = source
            .split('\n')
            .filter((line) => {
                const trimmed = line.trim();
                return !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
            })
            .join('\n');
        expect(code, 'the module holds no writeFileSync call').not.toContain('writeFileSync');
        expect(code, 'the module holds no fetch call').not.toMatch(/\bfetch\s*\(/);
        const originalFetch = globalThis.fetch;
        const globalObject = globalThis as unknown as { fetch: typeof fetch };
        let fetchCalls = 0;
        globalObject.fetch = (() => {
            fetchCalls++;
            throw new Error('fetch was called during a render');
        }) as unknown as typeof fetch;
        const write = vi.spyOn(fs, 'writeFileSync');
        try {
            for (const kind of KINDS) {
                await renderQuest(kind, await standardSubject(kind), await standardAssets(kind), 0);
            }
            expect(fetchCalls, 'the fetch call count').toBe(0);
            expect(write, 'the fs.writeFileSync call count').not.toHaveBeenCalled();
        } finally {
            globalObject.fetch = originalFetch;
            write.mockRestore();
        }
    }, 120000);

    it('T30: the level line uses the middle dot and the book lines sit in the right kinds only', async () => {
        const student = parseHtml(await standardRender('student-front', 0));
        const levelLine = student.querySelector('[data-part="level-line"]');
        expect(levelLine, 'the level line exists').not.toBeNull();
        expect((levelLine!.textContent ?? '').trim(), 'the level line text').toBe(LEVEL_LINE);
        expect((levelLine!.textContent ?? '').includes('\u00b7'), 'the middle dot U+00B7').toBe(true);
        const studentText = pageText(student);
        expect(studentText, 'the student front shows Student Book').toContain(STUDENT_LINE);
        expect(studentText, 'the student front hides Teacher Book').not.toContain(TEACHER_LINE);
        const teacher = parseHtml(await standardRender('teacher-front', 0));
        const teacherText = pageText(teacher);
        expect(teacherText, 'the teacher front shows Teacher Book').toContain(TEACHER_LINE);
        expect(teacherText, 'the teacher front hides Student Book').not.toContain(STUDENT_LINE);
        for (const kind of ['student-back', 'teacher-back', 'reader-a3', 'reader-leaf'] as const) {
            const text = pageText(parseHtml(await standardRender(kind, 0)));
            expect(text, `${kind} hides Student Book`).not.toContain(STUDENT_LINE);
            expect(text, `${kind} hides Teacher Book`).not.toContain(TEACHER_LINE);
        }
    }, 120000);
});



