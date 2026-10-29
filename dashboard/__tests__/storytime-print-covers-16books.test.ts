// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { BACK_LINES } from '../lib/covers/back-text';
import { PAGE_RATIO, composeSide } from '../lib/covers/compose';
import { coverBook } from '../lib/covers/catalogue';
import { pageImages, parsePdffonts, parsePdfimages, parsePdfinfo } from '../lib/print/pdfx';
import { generateQRCode } from '../lib/qr-generator';
import { STORYTIME_ROOT, readLevelWeeks, readPhonicsGraph, storytimeWeekFile } from '../lib/storytime/files';
import { programWeek, wordNeed, type PhonicsGraph } from '../lib/storytime/phonics';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Phase 1 contract. New modules load inside each test, so a missing file stays an assertion.
 * covers.ts exports the names below. cover-picture.ts exports composeStorytimeCoverPicture
 * and checkStorytimeCoverPicture. The script is make-storytime-book-cover.ts.
 *
 * Data file content/storytime/covers/books.json (D11):
 * series, trim { widthMm, heightMm }, levelColours, lineAddress, books[].
 * A book row has level, unit, firstWeek, lastWeek, title, levelColour, pictureRecipe, panel.
 * pictureRecipe is an array. An empty recipe is [].
 * panel holds five entries in this key order: story, sounds, decodable, sight, books.
 * panel.story is { text, weeks }. The other four entries are { weeks }. The old summary object is dropped.
 *
 * The panel names of covers.ts (D11):
 * STORYTIME_COVER_PANEL_FIELDS = ['story','sounds','decodable','sight','books'].
 * STORYTIME_COVER_PANEL_SCALE_PT = [14,13,12,11,10]. STORYTIME_COVER_PANEL_INSET_MM = { widthMm: 162, heightMm: 114 }.
 * STORYTIME_COVER_PANEL_MISSING_LINE = 'comes with the week text'.
 * storytimeCoverPanelValues(book, ctx) -> the five field values, in order, each { field, value, items }.
 * storytimeCoverPanelReadableWeeks(book, ctx) -> the four derived fields and the weeks the module can read.
 * checkStorytimeCoverPanelFields(fields) -> order errors. checkStorytimeCoverPanelRow(book, ctx) -> row errors.
 * storytimeCoverPanelChosenPt(values, inset) -> the chosen size in pt. storytimeCoverPanelOverflows(values, pt, inset) -> true when the text does not fit.
 * storytimeCoverDefaultOutDir(version, printReadyRoot) -> the output folder of one version.
 * The context ctx is { weeks: StorytimeWeek[], graph: PhonicsGraph }.
 *
 * HTML hooks: [data-side="front"|"back"][data-title], [data-part] for series-name, picture-area,
 * level-card, logo, panel, panel-field, panel-heading, panel-value, panel-inset, panel-missing,
 * contact, qr, line-label. Each panel field carries data-field. Geometry is CSS millimetres on those parts.
 * The QR SVG from generateQRCode fills the 44 mm box, quiet zone included.
 *
 * Script: --level <n> --unit <m> [--out <dir>] [--print] [--data <books.json>] [--version <n>]
 * --out receives front.png, back.png, cover.pdf, corner-mode.txt, and build-report.json.
 * With --print it also receives Storytime-Advantage-L<n>-U<m>-Student-Book-Cover-v<n>_PDFX-1a.pdf.
 * With --version 3 and no --out the default folder is <print-ready>/storytime/proof-v3.
 */
interface StorytimeCoverPanelEntry {
    text?: string;
    weeks: number[];
}

interface StorytimeCoverBookPanel {
    story: { text: string; weeks: number[] };
    sounds: StorytimeCoverPanelEntry;
    decodable: StorytimeCoverPanelEntry;
    sight: StorytimeCoverPanelEntry;
    books: StorytimeCoverPanelEntry;
}

interface StorytimeCoverBook {
    level: number;
    unit: number;
    firstWeek: number;
    lastWeek: number;
    title: string;
    levelColour: string;
    pictureRecipe: Array<{ kind: 'child' | 'animal'; name: string; file: string }>;
    panel: StorytimeCoverBookPanel;
}

interface StorytimeCoverData {
    series: string;
    trim: { widthMm: number; heightMm: number };
    levelColours: Record<string, string>;
    lineAddress: string;
    books: StorytimeCoverBook[];
}

interface StorytimeCoverPanelValue {
    field: 'story' | 'sounds' | 'decodable' | 'sight' | 'books';
    value: string;
    items: string[];
}

interface StorytimeCoverPanelCtx {
    weeks: StorytimeWeek[];
    graph: PhonicsGraph;
}

interface StorytimeCoverAssets {
    picture?: string;
    card?: string;
    panel?: string;
    logo?: string;
    panelValues?: StorytimeCoverPanelValue[];
    panelMock?: boolean;
}

interface QrGrid {
    modules: number;
    dark: number;
    cells: boolean[][];
}

interface CoverModule {
    loadStorytimeCoverBooks: (file?: string) => StorytimeCoverData;
    checkStorytimeCoverData: (data: StorytimeCoverData) => string[];
    storytimeCoverHasPicture: (recipe: readonly { kind: 'child' | 'animal'; name: string; file: string }[]) => boolean;
    storytimeCoverMmToPx: (mm: number) => number;
    storytimeCoverStudentWords: (week: StorytimeWeek) => Set<string>;
    renderStorytimeCover: (book: StorytimeCoverBook, assets?: StorytimeCoverAssets) => { frontHtml: string; backHtml: string };
    checkStorytimeCoverCopy: (pageText: string) => string[];
    checkStorytimeCoverThai: (pageText: string, side: 'front' | 'back') => string[];
    storytimeCoverQrGrid: (svg: string) => QrGrid;
    checkStorytimeCoverQr: (printed: boolean[][], expected: boolean[][]) => number;
    storytimeCoverCornerMode: () => string;
    STORYTIME_COVER_BOX?: { panel: { left: number; top: number; width: number; height: number } };
    STORYTIME_COVER_PANEL_FIELDS?: readonly string[];
    STORYTIME_COVER_PANEL_SCALE_PT?: readonly number[];
    STORYTIME_COVER_PANEL_INSET_MM?: { widthMm: number; heightMm: number };
    STORYTIME_COVER_PANEL_MISSING_LINE?: string;
    storytimeCoverPanelValues?: (book: StorytimeCoverBook, ctx: StorytimeCoverPanelCtx) => StorytimeCoverPanelValue[];
    storytimeCoverPanelReadableWeeks?: (book: StorytimeCoverBook, ctx: StorytimeCoverPanelCtx) => Record<string, number[]>;
    checkStorytimeCoverPanelFields?: (fields: readonly string[]) => string[];
    checkStorytimeCoverPanelRow?: (book: StorytimeCoverBook, ctx: StorytimeCoverPanelCtx) => string[];
    storytimeCoverPanelChosenPt?: (values: StorytimeCoverPanelValue[], inset: { widthMm: number; heightMm: number }) => number;
    storytimeCoverPanelOverflows?: (values: StorytimeCoverPanelValue[], pt: number, inset: { widthMm: number; heightMm: number }) => boolean;
    storytimeCoverDefaultOutDir?: (version: number, printReadyRoot: string) => string;
}

interface PictureModule {
    composeStorytimeCoverPicture: (
        files: string[],
        sizePx: { width: number; height: number },
        groundTint: string,
        bookTitle?: string,
    ) => Promise<Buffer>;
    checkStorytimeCoverPicture: (png: Buffer, groundTint?: string, minimumFillShare?: number) => string[];
    storytimeCoverFigureLayout: (files: string[], sizePx: { width: number; height: number }) => Promise<FigureBox[]>;
    checkStorytimeCoverFigureLayout: (boxes: FigureBox[], sizePx: { width: number; height: number }, headBandHeightPx: number, sideBandWidthPx?: number) => string[];
    checkStorytimeCoverFigureAspect: (boxes: FigureBox[], files: string[], tolerance: number) => string[];
}

interface FigureBox {
    name: string;
    left: number;
    top: number;
    width: number;
    height: number;
}

const LINE = 'https://line.me/ti/p/Pf7_EF98Pv';
const COLOURS: Record<number, string> = { 1: '#E06A1F', 2: '#2A77B8', 3: '#3C9B57', 4: '#8151B8' };
const WEEK_RANGES: Record<number, [number, number]> = { 1: [1, 8], 2: [9, 16], 3: [17, 24], 4: [25, 32] };
const CAST = ['pat', 'may', 'sam', 'mia', 'ben', 'nan', 'pip'];
const repoRoot = path.resolve(STORYTIME_ROOT, '..', '..');
const dashboardRoot = path.join(repoRoot, 'dashboard');
const booksFile = path.join(STORYTIME_ROOT, 'covers', 'books.json');
const coversModule = path.join(dashboardRoot, 'lib/storytime/print/covers.ts');
const pictureModule = path.join(dashboardRoot, 'lib/storytime/print/cover-picture.ts');
const scriptFile = path.join(dashboardRoot, 'scripts/storytime/make-storytime-book-cover.ts');
const temporaryFolders: string[] = [];
const built = new Map<string, string>();

function temporaryFolder(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const folder = fs.mkdtempSync('/tmp/opencode/storytime-covers-');
    temporaryFolders.push(folder);
    return folder;
}

function mmToPx(mm: number): number {
    return Math.round(mm / 25.4 * 300);
}

function castPath(name: string): string {
    return `content/storytime/l2/media/w01/forge/cast/sprout-${name}/front.png`;
}

function recipeFiles(book: StorytimeCoverBook): string[] {
    return (book.pictureRecipe as unknown as Array<string | { file: string }>).map((figure) => typeof figure === 'string' ? figure : figure.file);
}

function readBooksFile(): StorytimeCoverData {
    expect(fs.existsSync(booksFile), 'Missing data file: content/storytime/covers/books.json').toBe(true);
    return JSON.parse(fs.readFileSync(booksFile, 'utf8')) as StorytimeCoverData;
}

function weekFile(level: number, week: number): StorytimeWeek {
    const file = storytimeWeekFile(STORYTIME_ROOT, level, week);
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function bookOf(data: StorytimeCoverData, level: number, unit: number): StorytimeCoverBook {
    const book = data.books.find((row) => row.level === level && row.unit === unit);
    expect(book, `Row Level ${level} Unit ${unit}`).toBeDefined();
    return book!;
}

async function covers(...names: (keyof CoverModule)[]): Promise<CoverModule> {
    const loaded = await coverModule();
    for (const name of names) expect(loaded[name], `Export ${name}.`).toBeTypeOf('function');
    return loaded;
}

/**
 * Loads the cover module. A missing file stays an assertion, and a missing named export
 * (a constant or a function) is asserted at the call site.
 * @returns The module.
 */
async function coverModule(): Promise<CoverModule> {
    expect(fs.existsSync(coversModule), 'Missing module: lib/storytime/print/covers.ts.').toBe(true);
    return await import(coversModule) as CoverModule;
}

async function pictures(...names: (keyof PictureModule)[]): Promise<PictureModule> {
    expect(fs.existsSync(pictureModule), `Missing module: lib/storytime/print/cover-picture.ts. Required export: ${names.join(', ')}.`).toBe(true);
    const loaded = await import(pictureModule) as PictureModule;
    for (const name of names) expect(loaded[name], `Export ${name}.`).toBeTypeOf('function');
    return loaded;
}

function requireScript(): void {
    expect(fs.existsSync(scriptFile), 'Missing script: scripts/storytime/make-storytime-book-cover.ts').toBe(true);
}

function requireHeavyWrapper(): void {
    let pid = process.pid;
    let found = false;
    for (let hop = 0; pid > 1 && hop < 64; hop++) {
        const command = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0');
        if (command.some((arg) => arg.endsWith('/heavy-run.sh'))) found = true;
        const parent = fs.readFileSync(`/proc/${pid}/status`, 'utf8').match(/^PPid:\s+(\d+)/m);
        pid = Number(parent?.[1] ?? 0);
    }
    expect(found, 'Run Chrome and Ghostscript only through heavy-run.sh.').toBe(true);
}

function pdfxCheck(file: string): number {
    requireHeavyWrapper();
    try {
        execFileSync(process.execPath, ['--import', 'tsx', path.join(dashboardRoot, 'scripts/print/make-pdfx.ts'), file, '--check'], {
            cwd: dashboardRoot, encoding: 'utf8', timeout: 60000,
        });
        return 0;
    } catch (error) {
        return (error as { status?: number }).status ?? 1;
    }
}

function runScript(args: string[]): { status: number; output: string } {
    requireScript();
    requireHeavyWrapper();
    try {
        const output = execFileSync(process.execPath, ['--import', 'tsx', scriptFile, ...args], {
            cwd: dashboardRoot, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024,
        });
        return { status: 0, output };
    } catch (error) {
        const failed = error as { status?: number; stdout?: string | Buffer; stderr?: string | Buffer };
        return { status: failed.status ?? 1, output: `${failed.stdout ?? ''}\n${failed.stderr ?? ''}` };
    }
}

function buildCover(level: number, unit: number, print = false, version = 1): string {
    const key = `${level}-${unit}-${print}-${version}`;
    const cached = built.get(key);
    if (cached) return cached;
    const out = temporaryFolder();
    const args = ['--level', String(level), '--unit', String(unit), '--out', out];
    if (print) args.push('--print');
    if (version !== 1) args.push('--version', String(version));
    const result = runScript(args);
    expect(result.status, `Build Level ${level} Unit ${unit} exit`).toBe(0);
    expect(result.output, 'The build must not report a placeholder.').not.toMatch(/placeholder/i);
    built.set(key, out);
    return out;
}

function pdfxName(level: number, unit: number, version = 1): string {
    return `Storytime-Advantage-L${level}-U${unit}-Student-Book-Cover-v${version}_PDFX-1a.pdf`;
}

function parseHtml(html: string): Document {
    expect(html, 'Cover HTML is a string.').toBeTypeOf('string');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('parsererror'), 'The cover HTML must parse.').toBeNull();
    return doc;
}

function side(doc: Document, name: 'front' | 'back'): Element {
    const found = doc.querySelector(`[data-side="${name}"]`);
    expect(found, `The ${name} page must exist.`).not.toBeNull();
    return found!;
}

function part(root: ParentNode, name: string): Element {
    const found = root.querySelectorAll(`[data-part="${name}"]`);
    expect(found.length, `Exactly one ${name} must print.`).toBe(1);
    return found[0];
}

function text(element: Element): string {
    return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function mmBox(element: Element): Record<string, number> {
    const style = element.getAttribute('style') ?? '';
    const box: Record<string, number> = {};
    for (const name of ['left', 'top', 'right', 'width', 'height']) {
        const match = style.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([\\d.]+)mm`, 'i'));
        if (match) box[name] = Number(match[1]);
    }
    return box;
}

function expectBox(element: Element, expected: Record<string, number>): void {
    const box = mmBox(element);
    const label = element.getAttribute('data-part') ?? element.tagName;
    for (const [name, value] of Object.entries(expected)) {
        expect(box[name], `${label} ${name} mm`).toBe(value);
    }
}

function expectColour(element: Element, colour: string): void {
    const style = (element.getAttribute('style') ?? '').toLowerCase();
    expect(style, 'The text uses the level colour.').toContain(colour.toLowerCase());
}

function studentWords(week: StorytimeWeek): Set<string> {
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

function thaiChars(value: string): string {
    return [...value].filter((char) => /[\u0E00-\u0E7F]/.test(char)).join('');
}

function gridFromSvg(svg: string): QrGrid {
    const viewBox = Number(svg.match(/viewBox="0 0 (\d+) \1"/)?.[1]);
    expect(viewBox, 'QR viewBox').toBeGreaterThan(0);
    const modules = viewBox / 10 - 8;
    expect(Number.isInteger(modules), 'QR module count is an integer.').toBe(true);
    const cells = Array.from({ length: modules }, () => Array.from({ length: modules }, () => false));
    let dark = 0;
    for (const match of svg.matchAll(/<rect\b([^>]*)\/?>/g)) {
        const attrs = match[1];
        if (!/fill="#000000"/i.test(attrs)) continue;
        if (Number(attrs.match(/\bwidth="(\d+)"/)?.[1]) !== 10) continue;
        const col = Number(attrs.match(/\bx="(\d+)"/)?.[1]) / 10;
        const row = Number(attrs.match(/\by="(\d+)"/)?.[1]) / 10;
        cells[row][col] = true;
        dark++;
    }
    return { modules, dark, cells };
}

function writeCopy(name: string, value: unknown): string {
    const file = path.join(temporaryFolder(), name);
    fs.writeFileSync(file, JSON.stringify(value));
    return file;
}

function htmlCopy(html: string, change: (copy: Document) => void): Document {
    const file = path.join(temporaryFolder(), 'copy.html');
    fs.writeFileSync(file, html);
    const copy = new DOMParser().parseFromString(fs.readFileSync(file, 'utf8'), 'text/html');
    change(copy);
    fs.writeFileSync(file, copy.documentElement.outerHTML);
    return new DOMParser().parseFromString(fs.readFileSync(file, 'utf8'), 'text/html');
}

function panelElement(root: ParentNode): Element {
    const found = root.querySelector('[data-part="panel"]');
    expect(found, 'Every back must hold the panel element (D11.1).').not.toBeNull();
    return found!;
}

function panelFieldNames(root: ParentNode): string[] {
    return [...root.querySelectorAll('[data-part="panel-field"]')].map((element) => element.getAttribute('data-field') ?? '');
}

function missingLineTexts(root: ParentNode): string[] {
    return [...root.querySelectorAll('[data-part="panel-missing"]')].map((element) => text(element));
}

/**
 * Builds the panel context of a level: the shipped week files of that level and the shipped
 * phonics graph (rule 11.3, test-strategy 4.14.2). Level 1 and Level 4 have no week files.
 * @param level The Storytime level.
 * @returns The context.
 */
function panelCtx(level: number): StorytimeCoverPanelCtx {
    const weeks = readLevelWeeks(STORYTIME_ROOT, level).flatMap((entry) => (entry.week ? [entry.week] : []));
    const graph = readPhonicsGraph();
    expect(graph, 'The shipped phonics graph must be readable (rule 11.3).').toBeDefined();
    return { weeks, graph: graph! };
}

function unitWeeks(book: StorytimeCoverBook, ctx: StorytimeCoverPanelCtx): StorytimeWeek[] {
    return ctx.weeks
        .filter((week) => week.meta.week >= book.firstWeek && week.meta.week <= book.lastWeek)
        .sort((a, b) => a.meta.week - b.meta.week);
}

/**
 * The candidate words of a week for the decodable field (FR-1a.3): the family words, the home
 * words, the back words of the student books, and the page text of the student books.
 * @param week The week.
 * @returns The words, in lower case.
 */
function candidateWords(week: StorytimeWeek): string[] {
    const out: string[] = [];
    for (const entry of week.focus.family.words) out.push(entry.word);
    for (const word of week.home?.words ?? []) out.push(word);
    for (const book of week.books) for (const word of book.backWords) out.push(word);
    for (const book of week.books) for (const page of book.pages) for (const word of page.text.match(/[a-z]+/gi) ?? []) out.push(word);
    return out.map((word) => word.toLowerCase());
}

function candidateWordOccurrences(week: StorytimeWeek): string[] {
    const words: string[] = [];
    for (const entry of week.focus.family.words) words.push(entry.word);
    for (const word of week.home?.words ?? []) words.push(word);
    for (const book of week.books) for (const word of book.backWords) words.push(word);
    for (const book of week.books) for (const page of book.pages) words.push(...(page.text.match(/[a-z]+/gi) ?? []));
    for (const word of week.focus.trickyWords) words.push(word);
    return words;
}

interface ExpectedPanel {
    sounds: string[];
    decodable: string[];
    sight: string[];
    books: string[];
    readable: Record<string, number[]>;
}

/**
 * Derives the four fields and their readable weeks from the shipped week files and the graph,
 * by the rules of FR-1a and D11. Independent of the module, so the two can disagree.
 * @param book The book row.
 * @param ctx The context.
 * @returns The expected values and weeks.
 */
function expectedPanel(book: StorytimeCoverBook, ctx: StorytimeCoverPanelCtx): ExpectedPanel {
    const sounds: string[] = [];
    const decodable: string[] = [];
    const sight: string[] = [];
    const books: string[] = [];
    const readable: Record<string, number[]> = { sounds: [], decodable: [], sight: [], books: [] };
    for (const week of unitWeeks(book, ctx)) {
        const number = week.meta.week;
        const pw = programWeek(book.level, number);
        const element = week.focus.element;
        if (element && element.id.startsWith('english.phonics.')) {
            readable.sounds.push(number);
            const sound = `${element.graphemes.join('')} ${element.sound}`;
            if (!sounds.includes(sound)) sounds.push(sound);
        }
        const words = candidateWords(week);
        if (words.length) readable.decodable.push(number);
        for (const word of words) {
            const need = wordNeed(word, ctx.graph, pw);
            if (need.week !== null && need.week <= pw && !decodable.includes(word)) decodable.push(word);
        }
        if (week.focus.trickyWords.length) readable.sight.push(number);
        for (const tricky of week.focus.trickyWords) {
            const word = tricky.toLowerCase();
            const need = wordNeed(word, ctx.graph, pw);
            if ((need.week === null || need.week > pw) && !sight.includes(word)) sight.push(word);
        }
        const readers = week.books.filter((row) => row.kind === 'readalong' || row.kind === 'decodable');
        if (readers.length) readable.books.push(number);
        for (const reader of readers) if (!books.includes(reader.title)) books.push(reader.title);
    }
    return { sounds, decodable, sight, books, readable };
}

function panelValue(values: StorytimeCoverPanelValue[], field: StorytimeCoverPanelValue['field']): StorytimeCoverPanelValue {
    const found = values.find((entry) => entry.field === field);
    expect(found, `The panel values must hold the field ${field}.`).toBeDefined();
    return found!;
}

/**
 * The panel API of the cover module (D11). Every name is asserted, so a missing export is a
 * plain assertion failure, not a crash.
 * @param mod The cover module.
 * @returns The panel names.
 */
function panelApi(mod: CoverModule) {
    const pick = <K extends keyof CoverModule>(name: K): NonNullable<CoverModule[K]> => {
        expect(mod[name], `Export ${String(name)}.`).toBeDefined();
        return mod[name]!;
    };
    return {
        fields: pick('STORYTIME_COVER_PANEL_FIELDS'),
        scale: pick('STORYTIME_COVER_PANEL_SCALE_PT'),
        inset: pick('STORYTIME_COVER_PANEL_INSET_MM'),
        missingLine: pick('STORYTIME_COVER_PANEL_MISSING_LINE'),
        values: pick('storytimeCoverPanelValues'),
        readableWeeks: pick('storytimeCoverPanelReadableWeeks'),
        checkFields: pick('checkStorytimeCoverPanelFields'),
        checkRow: pick('checkStorytimeCoverPanelRow'),
        chosenPt: pick('storytimeCoverPanelChosenPt'),
        overflows: pick('storytimeCoverPanelOverflows'),
        outDir: pick('storytimeCoverDefaultOutDir'),
    };
}

/** The ground tint of each level (spec FR-2.4, the terms of the spec). */
const GROUND_TINTS: Record<number, string> = { 1: '#F9E1D2', 2: '#D4E4F1', 3: '#D8EBDD', 4: '#E6DCF1' };

/** The tolerance of a figure pixel against the ground tint, per RGB channel (spec FR-2.7). */
const FIGURE_TOLERANCE = 24;

/** The clear band at each side of the picture area, in millimetres (Check finding C2). */
const SIDE_BAND_MM = 3;

/** The rows of a picture that the rounded corners do not reach, in millimetres. */
const CORNER_ROWS_MM = 6;

/** The raw pixels of a picture. */
interface RawPixels {
    data: Buffer;
    info: { width: number; height: number; channels: 1 | 2 | 3 | 4 };
}

/**
 * Composes the cover picture of one shipped book on the ground tint of its level.
 * @param mod The picture module.
 * @param data The shipped data of the 16 books.
 * @param level The level of the book.
 * @param unit The unit of the book.
 * @param size The size of the picture area, in pixels.
 * @returns The picture, its raw pixels, and the tint of the level.
 */
async function composeBookPicture(
    mod: PictureModule,
    data: StorytimeCoverData,
    level: number,
    unit: number,
    size: { width: number; height: number },
): Promise<{ png: Buffer; raw: RawPixels; tint: string }> {
    const book = bookOf(data, level, unit);
    const tint = GROUND_TINTS[level];
    const files = recipeFiles(book).map((file) => path.isAbsolute(file) ? file : path.join(repoRoot, file));
    const png = await mod.composeStorytimeCoverPicture(files, size, tint, book.title);
    const { default: sharp } = await import('sharp');
    const raw: RawPixels = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    return { png, raw, tint };
}

/**
 * Counts the figure pixels of one box of a picture. A pixel is a figure pixel when it differs
 * from the ground tint by more than the tolerance in one RGB channel.
 * @param raw The raw pixels of the picture.
 * @param tint The ground tint of the level.
 * @param box The box, in pixels.
 * @returns The count of the figure pixels.
 */
function figurePixels(raw: RawPixels, tint: string, box: { left: number; top: number; width: number; height: number }): number {
    const ground = [0, 1, 2].map((channel) => Number.parseInt(tint.slice(channel * 2 + 1, channel * 2 + 3), 16));
    let count = 0;
    for (let y = box.top; y < box.top + box.height; y++) {
        for (let x = box.left; x < box.left + box.width; x++) {
            const index = (y * raw.info.width + x) * raw.info.channels;
            if ([0, 1, 2].some((channel) => Math.abs(raw.data[index + channel] - ground[channel]) > FIGURE_TOLERANCE)) count++;
        }
    }
    return count;
}

afterEach(() => {
    const keep = new Set(built.values());
    for (const folder of temporaryFolders.splice(0)) {
        if (!keep.has(folder)) fs.rmSync(folder, { recursive: true, force: true });
    }
});

afterAll(() => {
    for (const folder of built.values()) fs.rmSync(folder, { recursive: true, force: true });
    built.clear();
});

describe('Storytime 16-book covers', () => {
    it('R1: the shipped file holds 16 books, and a short or wrong-colour copy fails', async () => {
        const raw = readBooksFile();
        const mod = await covers('loadStorytimeCoverBooks', 'checkStorytimeCoverData');
        const loaded = mod.loadStorytimeCoverBooks();
        expect(loaded.series).toBe('Storytime Advantage');
        expect(loaded.lineAddress).toBe(LINE);
        expect(loaded.trim).toEqual({ widthMm: 210, heightMm: 297 });
        expect(loaded.levelColours).toEqual({ 1: COLOURS[1], 2: COLOURS[2], 3: COLOURS[3], 4: COLOURS[4] });
        expect(raw.books, 'Cover book count').toHaveLength(16);
        expect(loaded.books.map((book) => book.title)).toEqual(raw.books.map((book) => book.title));
        expect(mod.checkStorytimeCoverData(loaded), 'Shipped data errors').toEqual([]);
        const keys = loaded.books.map((book) => `${book.level}-${book.unit}`).sort();
        expect(keys).toEqual([1, 2, 3, 4].flatMap((level) => [1, 2, 3, 4].map((unit) => `${level}-${unit}`)).sort());
        for (const book of loaded.books) {
            expect(book.title).toBe(`Storytime Advantage, Level ${book.level}, Unit ${book.unit}, Student Book`);
            expect(book.levelColour).toBe(COLOURS[book.level]);
            expect([book.firstWeek, book.lastWeek]).toEqual(WEEK_RANGES[book.unit]);
        }
        const short = structuredClone(loaded);
        short.books = short.books.slice(0, 15);
        const shortFile = writeCopy('short.json', short);
        expect(mod.checkStorytimeCoverData(mod.loadStorytimeCoverBooks(shortFile)).length, 'A 15-row copy must fail.').toBeGreaterThan(0);
        const wrong = structuredClone(loaded);
        wrong.books[0].levelColour = '#000000';
        wrong.levelColours['1'] = '#000000';
        const wrongFile = writeCopy('colour.json', wrong);
        expect(mod.checkStorytimeCoverData(mod.loadStorytimeCoverBooks(wrongFile)).length, 'A wrong level colour must fail.').toBeGreaterThan(0);
    });

    it('R2: three recipes name real files, and an empty recipe is not a picture', async () => {
        expect(fs.existsSync(booksFile), 'Missing picture recipes in content/storytime/covers/books.json').toBe(true);
        const mod = await covers('loadStorytimeCoverBooks', 'storytimeCoverHasPicture');
        const data = mod.loadStorytimeCoverBooks();
        const present = data.books.filter((book) => book.pictureRecipe.length > 0);
        expect(present.map((book) => `${book.level}-${book.unit}`).sort(), 'Recipe row count').toEqual(['1-1', '2-1', '4-4']);
        expect(data.books.filter((book) => book.pictureRecipe.length === 0), 'Empty recipe count').toHaveLength(13);
        expect(mod.storytimeCoverHasPicture([]), 'An empty array is not a picture.').toBe(false);
        for (const book of data.books) {
            expect(Array.isArray(book.pictureRecipe), 'pictureRecipe is an array.').toBe(true);
            expect(book.pictureRecipe.every((figure) => figure !== null && typeof figure === 'object' && typeof figure.file === 'string' && typeof figure.name === 'string' && typeof figure.kind === 'string'), `${book.title} recipe entries state kind, name, and file.`).toBe(true);
            expect(mod.storytimeCoverHasPicture(book.pictureRecipe)).toBe(book.pictureRecipe.length > 0);
            expect(book.pictureRecipe.some((figure) => figure.file.includes('class-waves.png')), 'No recipe names class-waves.png.').toBe(false);
            for (const figure of book.pictureRecipe) {
                expect(['child', 'animal']).toContain(figure.kind);
                expect(CAST).toContain(figure.name);
                const abs = path.isAbsolute(figure.file) ? figure.file : path.join(repoRoot, figure.file);
                expect(fs.existsSync(abs), `Recipe file exists: ${figure.file}`).toBe(true);
            }
        }
        const level2 = bookOf(data, 2, 1);
        expect(level2.pictureRecipe.map((figure) => figure.name)).toEqual(['nan', 'sam']);
        expect(level2.pictureRecipe.every((figure) => figure.kind === 'child')).toBe(true);
        const level1 = bookOf(data, 1, 1);
        expect(level1.pictureRecipe.filter((figure) => figure.kind === 'child').map((figure) => figure.name).sort()).toEqual(['nan', 'pat']);
        expect(level1.pictureRecipe.filter((figure) => figure.kind === 'animal').map((figure) => figure.name)).toEqual(['pip']);
    });

    it('R2 v2: recipes enforce figure limits, distinct groups, required casts, and reject copied mutations', async () => {
        const mod = await covers('loadStorytimeCoverBooks', 'checkStorytimeCoverData');
        const data = mod.loadStorytimeCoverBooks();
        const group = (level: number, unit: number) => bookOf(data, level, unit).pictureRecipe.map((figure) => figure.name).sort();
        expect(group(1, 1)).toEqual(['nan', 'pat', 'pip']);
        expect(group(2, 1)).toEqual(['nan', 'sam']);
        expect(group(4, 4)).toEqual(['ben', 'mia']);
        const signatures = data.books.filter((book) => book.pictureRecipe.length).map((book) => book.pictureRecipe.map((figure) => figure.name).sort().join(','));
        expect(new Set(signatures).size, 'Non-empty recipes have unique figure sets.').toBe(signatures.length);
        for (const book of data.books) {
            expect(book.pictureRecipe.filter((figure) => figure.kind === 'child').length, `${book.title} child limit`).toBeLessThanOrEqual(2);
            expect(book.pictureRecipe.filter((figure) => figure.kind === 'animal').length, `${book.title} animal limit`).toBeLessThanOrEqual(1);
        }
        const tooManyChildren = structuredClone(data);
        const l1 = tooManyChildren.books.find((book) => book.level === 1 && book.unit === 1)!;
        l1.pictureRecipe.push({ kind: 'child', name: 'sam', file: castPath('sam') });
        const tooManyChildrenFile = writeCopy('too-many-children.json', tooManyChildren);
        expect(mod.checkStorytimeCoverData(mod.loadStorytimeCoverBooks(tooManyChildrenFile)).length, 'A copied recipe with three children fails.').toBeGreaterThan(0);
        const tooManyAnimals = structuredClone(data);
        const l1Animals = tooManyAnimals.books.find((book) => book.level === 1 && book.unit === 1)!;
        l1Animals.pictureRecipe.push({ kind: 'animal', name: 'pip', file: castPath('pip') });
        const tooManyAnimalsFile = writeCopy('too-many-animals.json', tooManyAnimals);
        expect(mod.checkStorytimeCoverData(mod.loadStorytimeCoverBooks(tooManyAnimalsFile)).length, 'A copied recipe with two animals fails.').toBeGreaterThan(0);
        const duplicateGroup = structuredClone(data);
        const l4 = duplicateGroup.books.find((book) => book.level === 4 && book.unit === 4)!;
        l4.pictureRecipe = structuredClone(l1.pictureRecipe);
        const duplicateFile = writeCopy('duplicate-group.json', duplicateGroup);
        expect(mod.checkStorytimeCoverData(mod.loadStorytimeCoverBooks(duplicateFile)).length, 'A copied repeated figure set fails.').toBeGreaterThan(0);
    });

    it('R20.2: the story words come from the student text of its source weeks, with no year and no word limit (D11, M17, replaces R3)', async () => {
        expect(fs.existsSync(booksFile), 'Missing the panel fields in content/storytime/covers/books.json').toBe(true);
        const mod = await coverModule();
        const api = panelApi(mod);
        const data = mod.loadStorytimeCoverBooks();
        const book = bookOf(data, 2, 1);
        expect(book.panel, 'Level 2 Unit 1 must hold the five panel fields (D11, FR-1.7).').toBeDefined();
        expect(book.panel.story.weeks, 'The Level 2 Unit 1 story source weeks').toEqual([1]);
        const text = book.panel.story.text;
        expect(typeof text, 'The story text is a string.').toBe('string');
        expect(text.trim().length, 'The story is not empty.').toBeGreaterThan(0);
        expect(/\b(19|20)\d{2}\b/.test(text), 'The story holds no year (FR-1.9).').toBe(false);
        const ctx = panelCtx(2);
        const sources = unitWeeks(book, ctx).filter((week) => book.panel.story.weeks.includes(week.meta.week));
        expect(sources.map((week) => week.meta.week), 'The story source weeks are readable weeks of the unit.').toEqual(book.panel.story.weeks);
        const allowed = new Set<string>(studentWords(sources[0] ?? weekFile(2, 1)));
        for (const week of sources) {
            for (const word of studentWords(week)) allowed.add(word);
            for (const word of mod.storytimeCoverStudentWords(week)) allowed.add(word);
        }
        for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
            expect(allowed.has(word), `The story word "${word}" is in the student text of a source week (FR-1.9).`).toBe(true);
        }
        expect(api.checkRow(book, ctx), 'The shipped story passes the row check.').toEqual([]);
        const zebra = structuredClone(data);
        bookOf(zebra, 2, 1).panel.story.text = 'zebra';
        const zebraFile = writeCopy('r20-zebra.json', zebra);
        expect(api.checkRow(bookOf(JSON.parse(fs.readFileSync(zebraFile, 'utf8')) as StorytimeCoverData, 2, 1), panelCtx(2)).length, 'The word zebra must fail (M17, R26.4).').toBeGreaterThan(0);
        const approvalOnly = structuredClone(data);
        bookOf(approvalOnly, 2, 1).panel.story.text = 'publish';
        const approvalFile = writeCopy('r20-approval-only.json', approvalOnly);
        expect(api.checkRow(bookOf(JSON.parse(fs.readFileSync(approvalFile, 'utf8')) as StorytimeCoverData, 2, 1), panelCtx(2)).length, 'An approval-only word must fail (M17).').toBeGreaterThan(0);
        const long = structuredClone(data);
        const longBook = bookOf(long, 2, 1);
        const firstWord = (longBook.panel.story.text.toLowerCase().match(/[a-z]+/g) ?? ['nan'])[0];
        longBook.panel.story.text = Array.from({ length: 40 }, () => firstWord).join(' ');
        const longFile = writeCopy('r20-long.json', long);
        expect(api.checkRow(bookOf(JSON.parse(fs.readFileSync(longFile, 'utf8')) as StorytimeCoverData, 2, 1), panelCtx(2)), 'D11 drops the 25-word limit of D1.').toEqual([]);
    });

    it('R20.1 and R20.3 to R20.6: the five fields follow their shipped week and phonics sources', async () => {
        const mod = await coverModule();
        const api = panelApi(mod);
        const data = readBooksFile();
        const book = bookOf(data, 2, 1);
        const ctx = panelCtx(2);
        expect(Object.keys(book.panel), 'The data field keys keep the D11 order.').toEqual(['story', 'sounds', 'decodable', 'sight', 'books']);
        const derived = expectedPanel(book, ctx);
        const actual = api.values(book, ctx);
        expect(actual.map((entry) => entry.field), 'The panel values keep the D11 order.').toEqual(['story', 'sounds', 'decodable', 'sight', 'books']);
        expect(panelFieldNames(parseHtml(mod.renderStorytimeCover(book, { panelValues: actual }).backHtml)), 'The back HTML field order.').toEqual(['story', 'sounds', 'decodable', 'sight', 'books']);
        expect(panelValue(actual, 'sounds').items, 'The sounds come from the week focus elements.').toEqual(derived.sounds);
        expect(panelValue(actual, 'decodable').items.map((word) => word.toLowerCase()), 'The decodable words come from wordNeed at the week program.')
            .toEqual(derived.decodable.map((word) => word.toLowerCase()));
        expect(panelValue(actual, 'sight').items.map((word) => word.toLowerCase()), 'The sight words come from the tricky words not yet decodable.')
            .toEqual(derived.sight.map((word) => word.toLowerCase()));
        expect(panelValue(actual, 'books').items, 'The books come from reader titles.').toEqual(derived.books);
        expect(panelValue(actual, 'sounds').value, 'The sounds render grapheme and phoneme text.').toContain('/');
        for (const field of ['sounds', 'decodable', 'sight', 'books'] as const) {
            expect(new Set(panelValue(actual, field).items).size, `${field} has no repeated value.`).toBe(panelValue(actual, field).items.length);
        }
        const badOrder = structuredClone(data);
        const badBook = bookOf(badOrder, 2, 1);
        badBook.panel = Object.fromEntries(Object.entries(badBook.panel).sort(([a], [b]) => a === 'sight' && b === 'decodable' ? -1 : a === 'decodable' && b === 'sight' ? 1 : 0)) as StorytimeCoverBookPanel;
        expect(api.checkRow(badBook, ctx).length, 'Sight before decodable fails the row check (M20).').toBeGreaterThan(0);
    });

    it('R21: data week lists match the readable source weeks and stay inside each unit', async () => {
        const mod = await coverModule();
        const api = panelApi(mod);
        const data = readBooksFile();
        for (const [level, unit, expected] of [[2, 1, { story: [1], sounds: [1, 2, 3, 4, 5, 6, 7], decodable: [1, 2, 3, 4, 5, 6, 7], sight: [1, 2, 3, 4, 5, 6, 7], books: [1, 2, 3, 4, 5, 6, 7] }], [1, 1, { story: [], sounds: [], decodable: [], sight: [], books: [] }], [4, 4, { story: [], sounds: [], decodable: [], sight: [], books: [] }]] as const) {
            const book = bookOf(data, level, unit);
            const ctx = panelCtx(level);
            const readable = api.readableWeeks(book, ctx);
            for (const field of ['story', 'sounds', 'decodable', 'sight', 'books'] as const) {
                expect(book.panel[field].weeks, `${book.title} ${field} source weeks`).toEqual(expected[field]);
                expect(book.panel[field].weeks.every((week) => week >= book.firstWeek && week <= book.lastWeek), `${field} weeks are in the unit.`).toBe(true);
                if (field !== 'story') expect(book.panel[field].weeks, `${field} matches readable weeks`).toEqual(readable[field]);
            }
            expect(api.checkRow(book, ctx), `${book.title} panel row errors`).toEqual([]);
        }
        const copied = structuredClone(data);
        bookOf(copied, 2, 1).panel.books.weeks = [1, 2, 3, 4, 5, 6, 7, 8];
        const file = writeCopy('r21-week8.json', copied);
        expect(api.checkRow(bookOf(JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimeCoverData, 2, 1), panelCtx(2)).length, 'Week 8 is not readable for the books field (M18).').toBeGreaterThan(0);
    });

    it('R22: mock reports draft sources; print rejects draft-only field values and preserves v1 and v2 outputs', async () => {
        requireScript();
        const data = readBooksFile();
        const out = temporaryFolder();
        const mock = runScript(['--level', '2', '--unit', '1', '--version', '3', '--out', out, '--data', booksFile]);
        expect(mock.status, 'The v3 mock build exits successfully.').toBe(0);
        const reportFile = path.join(out, 'build-report.json');
        expect(fs.existsSync(reportFile), 'The v3 build report exists.').toBe(true);
        const report = fs.readFileSync(reportFile, 'utf8');
        expect(report, 'The build report identifies draft source weeks.').toMatch(/draft/i);
        const printOut = temporaryFolder();
        const print = runScript(['--level', '2', '--unit', '1', '--version', '3', '--out', printOut, '--print', '--data', booksFile]);
        expect(print.status, 'The print build rejects draft-only field data.').not.toBe(0);
        expect(print.output, 'The print error names the book and field.').toMatch(/Level 2 Unit 1.*(sounds|decodable|sight|books)|(sounds|decodable|sight|books).*Level 2 Unit 1/i);
        expect(fs.readdirSync(printOut), 'The rejected print build writes no deliverable.').toEqual([]);
        expect(data.books.length, 'The shipped data remains readable.').toBe(16);
    }, 360000);

    it('R23: all backs show five fields; empty fields show mock-only missing copy and no Thai', async () => {
        const mod = await coverModule();
        const api = panelApi(mod);
        const data = readBooksFile();
        for (const [level, unit] of [[2, 1], [1, 1], [4, 4]]) {
            const book = bookOf(data, level, unit);
            const ctx = panelCtx(level);
            const values = api.values(book, ctx);
            const back = side(parseHtml(mod.renderStorytimeCover(book, { panelValues: values, panelMock: true }).backHtml), 'back');
            expect(panelElement(back), `${book.title} has a panel.`).toBeDefined();
            expect(panelFieldNames(back), `${book.title} field headings keep order.`).toEqual(['story', 'sounds', 'decodable', 'sight', 'books']);
            const empties = values.filter((entry) => !entry.value.trim());
            expect(missingLineTexts(back), `${book.title} mock missing field lines`).toEqual(empties.map(() => api.missingLine));
            for (const entry of values) expect(entry.value, `${entry.field} has no Thai.`).not.toMatch(/[\u0E00-\u0E7F]/);
            const printBack = side(parseHtml(mod.renderStorytimeCover(book, { panelValues: values, panelMock: false }).backHtml), 'back');
            expect(missingLineTexts(printBack), 'The print HTML omits the mock-only line.').toHaveLength(0);
        }
        expect(BACK_LINES.contact, 'The approved contact lines remain unchanged.').toHaveLength(5);
    });

    it('R27: panel word case follows every source occurrence, without changing order or repeats (M23)', async () => {
        const mod = await covers('loadStorytimeCoverBooks', 'storytimeCoverPanelValues');
        const book = bookOf(readBooksFile(), 2, 1);
        const ctx = panelCtx(2);
        const values = mod.storytimeCoverPanelValues!(book, ctx);
        const unit = unitWeeks(book, ctx);
        const occurrences = unit.flatMap(candidateWordOccurrences);
        const expectedCase = (item: string): string => {
            const matches = occurrences.filter((word) => word.toLowerCase() === item.toLowerCase());
            expect(matches.length, `${item} has source occurrences in the shipped weeks.`).toBeGreaterThan(0);
            const allCapital = matches.every((word) => /^[A-Z]/.test(word));
            const lower = item.toLowerCase();
            return allCapital ? `${lower[0].toUpperCase()}${lower.slice(1)}` : lower;
        };
        const decodable = panelValue(values, 'decodable').items;
        const sight = panelValue(values, 'sight').items;
        for (const item of [...decodable, ...sight]) {
            expect(item, `D11.5 case for ${item} is derived from every source occurrence.`).toBe(expectedCase(item));
        }
        for (const item of ['Nan', 'Pam', 'Pat', 'Sam', 'Tom']) {
            expect(decodable, `Decodable display includes ${item}.`).toContain(item);
            expect(decodable, `Decodable display excludes lower-case ${item}.`).not.toContain(item.toLowerCase());
        }
        expect(sight, 'Sight display includes I.').toContain('I');
        expect(sight, 'Sight display excludes lower-case i.').not.toContain('i');
        for (const item of ['a', 'can', 'pan', 'tap', 'mom']) {
            expect([...decodable, ...sight], `A lower-case source occurrence displays ${item} in lower case.`).toContain(item);
            expect([...decodable, ...sight], `The display excludes the capitalized form of ${item}.`).not.toContain(`${item[0].toUpperCase()}${item.slice(1)}`);
        }
        for (const field of ['decodable', 'sight'] as const) {
            const items = panelValue(values, field).items;
            expect(items.map((item) => item.toLowerCase()), `${field} keeps the independently derived first positions.`)
                .toEqual(expectedPanel(book, ctx)[field].map((item) => item.toLowerCase()));
            expect(new Set(items.map((item) => item.toLowerCase())).size, `${field} repeats remain case-insensitive.`)
                .toBe(items.length);
        }
    });

    it('R28: the shipped books field uses the semicolon separator and preserves item 12 (M24)', async () => {
        const mod = await covers('loadStorytimeCoverBooks', 'storytimeCoverPanelValues');
        const book = bookOf(readBooksFile(), 2, 1);
        const ctx = panelCtx(2);
        const shipped = mod.storytimeCoverPanelValues!(book, ctx);
        const books = panelValue(shipped, 'books');
        expect(books.items, 'The shipped books field has 14 titles.').toHaveLength(14);
        expect(books.value, 'The books field joins titles with semicolon and space.')
            .toBe(books.items.join('; '));
        expect(books.value.split('; '), 'The joined books field splits into 14 titles.').toHaveLength(14);
        expect(books.items[11], 'Item 12 keeps its internal comma.').toBe('Tap, Tap!');
    });

    it('R28 mutation: a copied Level 2 week title with a semicolon stops panel values and names its book and title', async () => {
        const mod = await covers('loadStorytimeCoverBooks', 'storytimeCoverPanelValues');
        const book = bookOf(readBooksFile(), 2, 1);
        const ctx = panelCtx(2);
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-covers-r28-'));
        temporaryFolders.push(tempRoot);
        const levelDir = path.join(tempRoot, 'l2');
        fs.mkdirSync(levelDir, { recursive: true });
        for (let week = 1; week <= 8; week++) {
            const source = storytimeWeekFile(STORYTIME_ROOT, 2, week);
            fs.copyFileSync(source, path.join(levelDir, path.basename(source)));
        }
        const mutatedFile = path.join(levelDir, 'w01.json');
        const mutated = JSON.parse(fs.readFileSync(mutatedFile, 'utf8')) as StorytimeWeek;
        const reader = mutated.books.find((row) => row.kind === 'readalong' || row.kind === 'decodable');
        expect(reader, 'Week 1 has a reader title to mutate.').toBeDefined();
        reader!.title = 'Tap; Mutated title';
        fs.writeFileSync(mutatedFile, JSON.stringify(mutated));
        const copiedWeeks = readLevelWeeks(tempRoot, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
        expect(() => mod.storytimeCoverPanelValues!(book, { weeks: copiedWeeks, graph: ctx.graph }))
            .toThrow(/Level 2 Unit 1.*Tap; Mutated title/);
    });

    it('R4: the front holds the series name, the picture area, and the level card, and no badge', async () => {
        const mod = await covers('loadStorytimeCoverBooks', 'renderStorytimeCover', 'storytimeCoverMmToPx');
        expect(mod.storytimeCoverMmToPx(210)).toBe(mmToPx(210));
        expect(mod.storytimeCoverMmToPx(297)).toBe(mmToPx(297));
        expect(mod.storytimeCoverMmToPx(12)).toBe(mmToPx(12));
        const book = bookOf(mod.loadStorytimeCoverBooks(), 2, 1);
        const { frontHtml } = mod.renderStorytimeCover(book);
        expect(frontHtml).not.toContain("format('ttf')");
        expect(frontHtml).not.toContain('format("ttf")');
        const doc = parseHtml(frontHtml);
        const front = side(doc, 'front');
        expect(front.getAttribute('data-title')).toBe(book.title);
        const series = part(front, 'series-name');
        expect(text(series)).toBe('Storytime Advantage');
        expectColour(series, book.levelColour);
        expectBox(part(front, 'picture-area'), { left: 12, top: 31, width: 186, height: 180 });
        const card = part(front, 'level-card');
        expectBox(card, { left: 12, top: 217, width: 186, height: 65 });
        expect(text(card)).toContain(`Level ${book.level} · Unit ${book.unit}`);
        expect(text(card)).toContain('Student Book');
        expect(front.querySelector('[data-part="badge"]'), 'The front has no badge element.').toBeNull();
        expect(text(front)).not.toMatch(/(^|[^A-Za-z0-9])A[12]([^A-Za-z0-9]|$)/);
    });

    it('R24: the panel box is 186 x 138 mm at 12 mm and 48 mm, the inset is 162 x 114 mm, and the label is LINE (D11.3, replaces R5)', async () => {
        const mod = await coverModule();
        const api = panelApi(mod);
        expect(mod.loadStorytimeCoverBooks, 'Export loadStorytimeCoverBooks.').toBeTypeOf('function');
        expect(mod.renderStorytimeCover, 'Export renderStorytimeCover.').toBeTypeOf('function');
        expect(api.inset, 'The panel inset').toEqual({ widthMm: 162, heightMm: 114 });
        const data = mod.loadStorytimeCoverBooks();
        const level2 = bookOf(data, 2, 1);
        const values = api.values(level2, panelCtx(2));
        const back = side(parseHtml(mod.renderStorytimeCover(level2, { panelValues: values }).backHtml), 'back');
        expect(back.getAttribute('data-title')).toBe(level2.title);
        expect(text(part(back, 'series-name'))).toBe('Storytime Advantage');
        expectColour(part(back, 'series-name'), level2.levelColour);
        expectBox(part(back, 'logo'), { left: 12, top: 12, width: 30, height: 30 });
        const panel = panelElement(back);
        expectBox(panel, { left: 12, top: 48, width: 186, height: 138 });
        const style = (panel.getAttribute('style') ?? '').toLowerCase();
        expect(style, 'The panel fill.').toContain('#f7f5f0');
        expect(style, 'The panel border colour.').toContain('#e1ddd3');
        expect(style, 'The panel border width.').toMatch(/border:\s*0\.4mm/);
        expect(style, 'The panel radius.').toMatch(/border-radius:\s*3mm/);
        const inset = back.querySelector('[data-part="panel-inset"]');
        expect(inset, 'The panel inset element.').not.toBeNull();
        expectBox(inset!, { width: 162, height: 114 });
        expectBox(part(back, 'contact'), { left: 15, top: 200 });
        expectBox(part(back, 'qr'), { width: 44, height: 44, right: 14, top: 200 });
        const label = part(back, 'line-label');
        expect(text(label)).toBe('LINE');
        expect(label.textContent ?? '').not.toMatch(/[\u0E00-\u0E7F]/);
        expect(mod.STORYTIME_COVER_BOX, 'Export STORYTIME_COVER_BOX.').toBeDefined();
        expect(mod.STORYTIME_COVER_BOX!.panel.top, 'The module panel top in millimetres.').toBe(48);
    });

    it('R25: the chosen panel size fits, is at least 10 pt, and is the largest fitting scale value', async () => {
        const mod = await coverModule();
        const api = panelApi(mod);
        const book = bookOf(readBooksFile(), 2, 1);
        const values = api.values(book, panelCtx(2));
        expect(api.scale, 'The panel font scale.').toEqual([14, 13, 12, 11, 10]);
        const chosen = api.chosenPt(values, api.inset);
        expect(api.scale, 'The chosen size belongs to the scale.').toContain(chosen);
        expect(chosen, 'The chosen size is not below 10 pt.').toBeGreaterThanOrEqual(10);
        expect(api.overflows(values, chosen, api.inset), 'The chosen size fits the panel inset.').toBe(false);
        for (const larger of api.scale.filter((size) => size > chosen)) {
            expect(api.overflows(values, larger, api.inset), `${larger} pt above the chosen size overflows.`).toBe(true);
        }
        const rendered = side(parseHtml(mod.renderStorytimeCover(book, { panelValues: values }).backHtml), 'back');
        const fields = [...rendered.querySelectorAll('[data-part="panel-field"]')];
        expect(fields.length, 'The rendered panel field count.').toBe(5);
        for (const field of fields) expect(field.getAttribute('style') ?? '', 'Each field reports the chosen font size.').toContain(`${chosen}pt`);
    });

    it('R22 M21 and M22: print source and version output path remain bounded', async () => {
        requireScript();
        const mod = await coverModule();
        const api = panelApi(mod);
        const root = path.join('/tmp/opencode', 'print-ready');
        const v1 = api.outDir(1, root);
        const v2 = api.outDir(2, root);
        const v3 = api.outDir(3, root);
        expect(v3, 'The v3 build uses its new proof folder (M22).').toBe(path.join(root, 'storytime', 'proof-v3'));
        expect(v3, 'The v3 folder differs from the v1 folder.').not.toBe(v1);
        expect(v3, 'The v3 folder differs from the v2 folder.').not.toBe(v2);
        const out = temporaryFolder();
        const result = runScript(['--level', '2', '--unit', '1', '--version', '3', '--out', out, '--print', '--data', booksFile]);
        expect(result.status, 'A print build cannot use draft-week values (M21).').not.toBe(0);
        expect(result.output, 'The print build names a rejected draft source.').toMatch(/draft|approved/i);
        expect(fs.readdirSync(out), 'A rejected print build writes no files.').toEqual([]);
    }, 360000);

    it('R6: the copy check reads page text and fails a bypass, including a line with never', async () => {
        const mod = await covers('checkStorytimeCoverCopy');
        const pass = (pageText: string) => expect(mod.checkStorytimeCoverCopy(pageText), `Copy check must pass: ${JSON.stringify(pageText)}`).toEqual([]);
        const fail = (pageText: string) => expect(mod.checkStorytimeCoverCopy(pageText).length, `Copy check must fail: ${JSON.stringify(pageText)}`).toBeGreaterThan(0);
        pass('Storytime Advantage');
        pass('Storytime Advantage. Do not skip this line.');
        pass('Storytime Advantage never hides the series name.');
        pass('Storytime Advantage A10');
        pass('Storytime Advantage RAZOR');
        fail('Hello');
        fail('Storytime Advantage cefr');
        fail('Storytime Advantage Pre\u2011A1');
        fail('Storytime Advantage Pre\u00adA1');
        fail('Storytime Advantage Primary\u00a0Advantage');
        fail('Storytime Advantage CE\u200bFR');
        fail('Storytime Advantage. Do not print CEFR.');
        fail('Storytime Advantage never shows GSE.');
        fail('Storytime Advantage A1');
        fail('Storytime Advantage Starters');
        fail('Storytime Advantage YLE');
        fail('Storytime Advantage Reading A-Z');
        fail('Storytime Advantage Chibi');
        fail('Storytime Advantage Mitr');
        fail('Storytime Advantage Pre A1');
        fail('Storytime Advantage B2');
        fail('Storytime Advantage 2026');
        fail('Storytime Advantage 1999');
    });

    it('R6: the copy check passes the Chrome PDF text of a built cover', async () => {
        const mod = await covers('checkStorytimeCoverCopy');
        const out = buildCover(2, 1);
        const file = path.join(out, 'cover.pdf');
        expect(fs.existsSync(file), 'The copy check reads the Chrome PDF.').toBe(true);
        for (const page of [1, 2]) {
            const pageText = execFileSync('pdftotext', ['-layout', '-f', String(page), '-l', String(page), file, '-'], { encoding: 'utf8', timeout: 15000 });
            expect(mod.checkStorytimeCoverCopy(pageText), `Chrome PDF page ${page} copy errors`).toEqual([]);
        }
    }, 230000);

    it('R7: the Thai check matches the five contact lines and fails a changed tone mark', async () => {
        expect(BACK_LINES.contact, 'Contact line count').toHaveLength(5);
        const expected = thaiChars(BACK_LINES.contact.join('\n'));
        expect(expected.length, 'Approved Thai character count').toBeGreaterThan(0);
        const mod = await covers('checkStorytimeCoverThai');
        expect(mod.checkStorytimeCoverThai(BACK_LINES.contact.join('\n'), 'back'), 'Approved contact Thai').toEqual([]);
        expect(mod.checkStorytimeCoverThai('Storytime Advantage', 'front'), 'Front text has no Thai.').toEqual([]);
        const dropped = [...BACK_LINES.contact];
        dropped.shift();
        const dropFile = path.join(temporaryFolder(), 'drop.txt');
        fs.writeFileSync(dropFile, dropped.join('\n'));
        expect(mod.checkStorytimeCoverThai(fs.readFileSync(dropFile, 'utf8'), 'back').length, 'A dropped contact line must fail.').toBeGreaterThan(0);
        const tones = ['\u0E48', '\u0E49', '\u0E4A', '\u0E4B'];
        const chars = [...BACK_LINES.contact.join('\n')];
        const index = chars.findIndex((char) => tones.includes(char));
        expect(index, 'The approved lines hold a Thai tone mark.').toBeGreaterThanOrEqual(0);
        chars[index] = tones[(tones.indexOf(chars[index]) + 1) % tones.length];
        const toneFile = path.join(temporaryFolder(), 'tone.txt');
        fs.writeFileSync(toneFile, chars.join(''));
        expect(mod.checkStorytimeCoverThai(fs.readFileSync(toneFile, 'utf8'), 'back').length, 'A changed tone mark must fail.').toBeGreaterThan(0);
        expect(mod.checkStorytimeCoverThai(`${BACK_LINES.contact.join('\n')}\nก`, 'back').length, 'Extra Thai must fail.').toBeGreaterThan(0);
    });

    it('R7: the Thai check reads the Chrome PDF, not a PDF/X extract', async () => {
        const mod = await covers('checkStorytimeCoverThai');
        const out = buildCover(2, 1);
        const file = path.join(out, 'cover.pdf');
        expect(fs.existsSync(file), 'The Thai check reads the Chrome PDF.').toBe(true);
        const front = execFileSync('pdftotext', ['-layout', '-f', '1', '-l', '1', file, '-'], { encoding: 'utf8', timeout: 15000 });
        const back = execFileSync('pdftotext', ['-layout', '-f', '2', '-l', '2', file, '-'], { encoding: 'utf8', timeout: 15000 });
        expect(mod.checkStorytimeCoverThai(front, 'front'), 'Front Thai errors').toEqual([]);
        expect(mod.checkStorytimeCoverThai(back, 'back'), 'Back Thai errors').toEqual([]);
    }, 230000);

    it('R8: the expected QR grid comes from generateQRCode, and one swapped module fails', async () => {
        const svg = generateQRCode(LINE);
        expect(svg, 'generateQRCode returns the LINE SVG.').toEqual(expect.any(String));
        const expected = gridFromSvg(svg!);
        expect(expected.modules, 'QR module count').toBe(29);
        expect(expected.dark, 'QR dark cell count').toBe(434);
        expect(expected.cells, 'QR grid side').toHaveLength(29);
        const mod = await covers('storytimeCoverQrGrid', 'checkStorytimeCoverQr');
        expect(mod.storytimeCoverQrGrid(svg!)).toEqual(expected);
        expect(mod.checkStorytimeCoverQr(expected.cells, expected.cells), 'QR module difference count').toBe(0);
        const swappedSvg = svg!.replace(/<rect\b[^>]*fill="#000000"[^>]*\/>/, '');
        const swapFile = path.join(temporaryFolder(), 'swap.svg');
        fs.writeFileSync(swapFile, swappedSvg);
        const swapped = mod.storytimeCoverQrGrid(fs.readFileSync(swapFile, 'utf8'));
        expect(swapped).not.toEqual(expected);
        expect(mod.checkStorytimeCoverQr(swapped.cells, expected.cells), 'QR module difference count').not.toBe(0);
    });

    it('R8: the printed back-page QR matches the encoder grid, and the quiet zone is not data', async () => {
        const svg = generateQRCode(LINE);
        const expected = gridFromSvg(svg!);
        const mod = await covers('storytimeCoverMmToPx', 'checkStorytimeCoverQr');
        const out = buildCover(2, 1);
        requireHeavyWrapper();
        const prefix = path.join(temporaryFolder(), 'back');
        execFileSync('pdftoppm', ['-f', '2', '-l', '2', '-singlefile', '-r', '300', '-png', path.join(out, 'cover.pdf'), prefix], { encoding: 'utf8', timeout: 60000 });
        const { default: sharp } = await import('sharp');
        const raster = await sharp(`${prefix}.png`).raw().toBuffer({ resolveWithObject: true });
        const channels = raster.info.channels;
        const width = raster.info.width;
        const box = mod.storytimeCoverMmToPx(44);
        const left = width - mod.storytimeCoverMmToPx(14) - box;
        const top = mod.storytimeCoverMmToPx(200);
        const pitch = box / (expected.modules + 8);
        const printed = Array.from({ length: expected.modules }, (_, row) => Array.from({ length: expected.modules }, (_, col) => {
            const x = Math.floor(left + (col + 4 + 0.5) * pitch);
            const y = Math.floor(top + (row + 4 + 0.5) * pitch);
            expect(x, 'QR sample x').toBeGreaterThanOrEqual(0);
            expect(y, 'QR sample y').toBeGreaterThanOrEqual(0);
            return raster.data[(y * width + x) * channels] < 128;
        }));
        expect(printed, 'QR data module count').toHaveLength(29);
        expect(mod.checkStorytimeCoverQr(printed, expected.cells), 'QR module difference count').toBe(0);
    }, 230000);

    it('R9: each built PNG is 2480 x 3508 px, 8-bit RGB, with no alpha', async () => {
        const mod = await covers('storytimeCoverMmToPx');
        const out = buildCover(2, 1);
        const { default: sharp } = await import('sharp');
        for (const name of ['front.png', 'back.png']) {
            const file = path.join(out, name);
            expect(fs.existsSync(file), `Missing ${name}.`).toBe(true);
            const meta = await sharp(file).metadata();
            expect(meta.width, 'PNG width px').toBe(2480);
            expect(meta.height, 'PNG height px').toBe(3508);
            expect(meta.width).toBe(mod.storytimeCoverMmToPx(210));
            expect(meta.height).toBe(mod.storytimeCoverMmToPx(297));
            expect(meta.hasAlpha, 'PNG alpha').toBe(false);
            expect(meta.channels, 'PNG channels').toBe(3);
            expect(meta.depth, 'PNG depth').toBe('uchar');
        }
    }, 230000);

    it('R10: pdffonts on the Chrome PDF shows embedded Andika and Sarabun, and no Type 3 face', async () => {
        const out = buildCover(2, 1);
        const file = path.join(out, 'cover.pdf');
        expect(fs.existsSync(file), 'Missing Chrome PDF.').toBe(true);
        const info = parsePdfinfo(execFileSync('pdfinfo', ['-box', file], { encoding: 'utf8', timeout: 15000 }));
        expect(info.pages, 'Chrome PDF page count').toBe(2);
        expect(Math.abs(info.width - 595.28), 'Page width pt').toBeLessThanOrEqual(2);
        expect(Math.abs(info.height - 841.89), 'Page height pt').toBeLessThanOrEqual(2);
        const output = execFileSync('pdffonts', [file], { encoding: 'utf8', timeout: 15000 });
        const fonts = parsePdffonts(output);
        expect(fonts.length, 'Embedded font count').toBeGreaterThan(0);
        for (const font of fonts) {
            expect(font.embedded, `${font.name} is embedded.`).toBe(true);
            expect(font.type, `${font.name} is not Type 3.`).not.toBe('Type 3');
            const name = font.name.toLowerCase();
            expect(name).not.toContain('liberation');
            expect(name).not.toContain('helvetica');
            expect(name).not.toContain('arial');
            expect(name).not.toContain('mitr');
        }
        expect(fonts.some((font) => /andika/i.test(font.name)), 'An Andika face is embedded.').toBe(true);
        expect(fonts.some((font) => /sarabun/i.test(font.name)), 'A Sarabun face is embedded.').toBe(true);
    }, 230000);

    it('R11: a missing picture stops the build, names the book, and writes no deliverable', () => {
        requireScript();
        const out = temporaryFolder();
        const data = writeCopy('missing.json', {
            series: 'Storytime Advantage',
            trim: { widthMm: 210, heightMm: 297 },
            levelColours: { 1: COLOURS[1], 2: COLOURS[2], 3: COLOURS[3], 4: COLOURS[4] },
            lineAddress: LINE,
            books: [1, 2, 3, 4].flatMap((level) => [1, 2, 3, 4].map((unit) => ({
                level, unit, firstWeek: WEEK_RANGES[unit][0], lastWeek: WEEK_RANGES[unit][1],
                title: `Storytime Advantage, Level ${level}, Unit ${unit}, Student Book`,
                levelColour: COLOURS[level],
                pictureRecipe: level === 2 && unit === 1 ? [{ kind: 'child', name: 'nan', file: 'content/storytime/covers/missing-cast.png' }] : [],
                summary: null,
            }))),
        });
        const result = runScript(['--level', '2', '--unit', '1', '--out', out, '--data', data]);
        expect(result.status, 'Missing picture exit').not.toBe(0);
        expect(result.output).toContain('Storytime Advantage, Level 2, Unit 1, Student Book');
        const names = fs.readdirSync(out);
        expect(names.some((name) => /\.(png|pdf)$/i.test(name)), 'No deliverable after the missing-file error.').toBe(false);
    }, 230000);

    it('R12: cut-out corners match the level ground tint, the center has figures, and a white corner fails', async () => {
        const coversMod = await covers('storytimeCoverMmToPx');
        const mod = await pictures('composeStorytimeCoverPicture', 'checkStorytimeCoverPicture');
        const size = { width: coversMod.storytimeCoverMmToPx(186), height: coversMod.storytimeCoverMmToPx(180) };
        const tint = '#D4E4F1';
        const buffer = await mod.composeStorytimeCoverPicture(CAST.map((name) => path.join(repoRoot, castPath(name))), size, tint, 'Storytime Advantage, Level 2, Unit 1, Student Book');
        expect(mod.checkStorytimeCoverPicture(buffer, tint), 'Cast picture errors').toEqual([]);
        const { default: sharp } = await import('sharp');
        const raw = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
        expect((await sharp(buffer).metadata()).hasAlpha, 'Composed picture alpha').toBe(false);
        expect(raw.info.channels, 'Composed picture channels').toBe(3);
        const pixel = (x: number, y: number) => {
            const index = (y * raw.info.width + x) * raw.info.channels;
            return [raw.data[index], raw.data[index + 1], raw.data[index + 2]];
        };
        const inset = mmToPx(8);
        for (const [x, y] of [[inset, inset], [raw.info.width - 1 - inset, inset], [inset, raw.info.height - 1 - inset], [raw.info.width - 1 - inset, raw.info.height - 1 - inset]]) {
            const sample = pixel(x, y);
            const expected = [0, 2, 4].map((index) => Number.parseInt(tint.slice(index + 1, index + 3), 16));
            expect(sample.every((channel, index) => Math.abs(channel - expected[index]) <= 6), `Ground tint sample ${x},${y}`).toBe(true);
        }
        const whiteCornerCopy = Buffer.from(raw.data);
        for (const [x, y] of [[inset, inset], [raw.info.width - 1 - inset, inset], [inset, raw.info.height - 1 - inset], [raw.info.width - 1 - inset, raw.info.height - 1 - inset]]) {
            const index = (y * raw.info.width + x) * raw.info.channels;
            whiteCornerCopy[index] = 255;
            whiteCornerCopy[index + 1] = 255;
            whiteCornerCopy[index + 2] = 255;
        }
        const whiteCornerFile = path.join(temporaryFolder(), 'white-corner-mutant.png');
        await sharp(whiteCornerCopy, { raw: { width: raw.info.width, height: raw.info.height, channels: raw.info.channels } }).png().toFile(whiteCornerFile);
        expect(mod.checkStorytimeCoverPicture(fs.readFileSync(whiteCornerFile), tint).length, 'A copied white-corner mutant fails.').toBeGreaterThan(0);
        const cx = Math.floor(raw.info.width / 2) - 20;
        const cy = Math.floor(raw.info.height / 2) - 20;
        let ink = false;
        for (let y = cy; y < cy + 40; y++) for (let x = cx; x < cx + 40; x++) {
            if (pixel(x, y).some((channel, index) => Math.abs(channel - Number.parseInt(tint.slice(index * 2 + 1, index * 2 + 3), 16)) > 24)) ink = true;
        }
        expect(ink, 'The picture center must not be all white.').toBe(true);
        const white = await sharp({ create: { width: size.width, height: size.height, channels: 3, background: tint } }).png().toBuffer();
        expect(mod.checkStorytimeCoverPicture(white, tint).length, 'An empty ground-tint picture must fail.').toBeGreaterThan(0);
        const badFile = path.join(temporaryFolder(), 'class-waves.png');
        await sharp({ create: { width: size.width, height: size.height, channels: 3, background: '#8B5A2B' } }).png().toFile(badFile);
        let passed = false;
        try {
            const bad = await mod.composeStorytimeCoverPicture([badFile], size, '#D4E4F1', 'Storytime Advantage, Level 4, Unit 4, Student Book');
            const badRaw = await sharp(bad).raw().toBuffer({ resolveWithObject: true });
            const corner = (x: number, y: number) => {
                const index = (y * badRaw.info.width + x) * badRaw.info.channels;
                return [badRaw.data[index], badRaw.data[index + 1], badRaw.data[index + 2]].every((channel, i) => Math.abs(channel - Number.parseInt('#D4E4F1'.slice(i * 2 + 1, i * 2 + 3), 16)) <= 6);
            };
            const inset = mmToPx(8);
            passed = corner(inset, inset) && corner(badRaw.info.width - 1 - inset, inset) && corner(inset, badRaw.info.height - 1 - inset) && corner(badRaw.info.width - 1 - inset, badRaw.info.height - 1 - inset);
        } catch (error) {
            expect(String(error)).toMatch(/class-waves|Level 4 Unit 4/);
        }
        expect(passed, 'A picture with white corners must not pass the tinted-corner check.').toBe(false);
    }, 60000);

    it('R12 v2: all three shipped compositions meet the fill threshold on their tinted ground', async () => {
        const dataModule = await covers('loadStorytimeCoverBooks');
        const mod = await pictures('composeStorytimeCoverPicture', 'checkStorytimeCoverPicture');
        const { default: sharp } = await import('sharp');
        const threshold = 0.55;
        const tints: Record<number, string> = { 1: '#F9E1D2', 2: '#D4E4F1', 3: '#D8EBDD', 4: '#E6DCF1' };
        const size = { width: mmToPx(186), height: mmToPx(180) };
        const data = dataModule.loadStorytimeCoverBooks();
        for (const [level, unit] of [[1, 1], [2, 1], [4, 4]] as const) {
            const book = bookOf(data, level, unit);
            const tint = tints[level];
            const files = recipeFiles(book).map((file) => path.isAbsolute(file) ? file : path.join(repoRoot, file));
            const png = await mod.composeStorytimeCoverPicture(files, size, tint, book.title);
            expect(mod.checkStorytimeCoverPicture(png, tint, threshold), `${book.title} picture check`).toEqual([]);
            const raw = await sharp(png).raw().toBuffer({ resolveWithObject: true });
            const ground = [0, 1, 2].map((channel) => Number.parseInt(tint.slice(channel * 2 + 1, channel * 2 + 3), 16));
            const inset = mmToPx(8);
            for (const [x, y] of [[inset, inset], [raw.info.width - 1 - inset, inset], [inset, raw.info.height - 1 - inset], [raw.info.width - 1 - inset, raw.info.height - 1 - inset]]) {
                const index = (y * raw.info.width + x) * raw.info.channels;
                expect([0, 1, 2].every((channel) => Math.abs(raw.data[index + channel] - ground[channel]) <= 6), `${book.title} ground tint at ${x},${y}`).toBe(true);
            }
            let figurePixels = 0;
            for (let i = 0; i < raw.data.length; i += raw.info.channels) {
                if ([0, 1, 2].some((channel) => Math.abs(raw.data[i + channel] - ground[channel]) > 24)) figurePixels++;
            }
            const fillShare = figurePixels / (raw.info.width * raw.info.height);
            expect(fillShare, `${book.title} v2 fill share`).toBeGreaterThanOrEqual(threshold);
        }
    }, 120000);

    it('R12 v2 mutation: a centred 75 percent L4U4 image passes corners and fails by fill', async () => {
        const dataModule = await covers('loadStorytimeCoverBooks');
        const mod = await pictures('composeStorytimeCoverPicture', 'checkStorytimeCoverPicture');
        const { default: sharp } = await import('sharp');
        const book = bookOf(dataModule.loadStorytimeCoverBooks(), 4, 4);
        const size = { width: mmToPx(186), height: mmToPx(180) };
        const tint = '#E6DCF1';
        const files = recipeFiles(book).map((file) => path.isAbsolute(file) ? file : path.join(repoRoot, file));
        const original = await mod.composeStorytimeCoverPicture(files, size, tint, book.title);
        const reduced = await sharp(original).resize(Math.round(size.width * 0.75), Math.round(size.height * 0.75)).png().toBuffer();
        const mutant = await sharp({ create: { width: size.width, height: size.height, channels: 3, background: tint } })
            .composite([{ input: reduced, left: Math.floor(size.width * 0.125), top: Math.floor(size.height * 0.125) }]).png().toBuffer();
        const copied = path.join(temporaryFolder(), 'l4u4-fill-mutant.png');
        fs.writeFileSync(copied, mutant);
        const mutantRaw = await sharp(fs.readFileSync(copied)).raw().toBuffer({ resolveWithObject: true });
        const ground = [0, 1, 2].map((channel) => Number.parseInt(tint.slice(channel * 2 + 1, channel * 2 + 3), 16));
        const inset = mmToPx(8);
        for (const [x, y] of [[inset, inset], [size.width - 1 - inset, inset], [inset, size.height - 1 - inset], [size.width - 1 - inset, size.height - 1 - inset]]) {
            const index = (y * mutantRaw.info.width + x) * mutantRaw.info.channels;
            expect([0, 1, 2].every((channel) => Math.abs(mutantRaw.data[index + channel] - ground[channel]) <= 6), `Mutant corner ${x},${y} retains tint`).toBe(true);
        }
        const errors = mod.checkStorytimeCoverPicture(fs.readFileSync(copied), tint, 0.55);
        expect(errors.some((error) => /fill/i.test(error)), 'The copied mutant fails by fill, not by corner tint.').toBe(true);
    }, 120000);

    it('R19 v2: each shipped figure box keeps its trimmed cut-out ratio, including a copied 6 percent stretch mutant', async () => {
        const dataModule = await covers('loadStorytimeCoverBooks');
        const mod = await pictures('storytimeCoverFigureLayout');
        const { default: sharp } = await import('sharp');
        const data = dataModule.loadStorytimeCoverBooks();
        const size = { width: mmToPx(186), height: mmToPx(180) };
        const tolerance = 0.02;

        const alphaRatio = async (file: string): Promise<number> => {
            const raw = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
            let minX = raw.info.width;
            let minY = raw.info.height;
            let maxX = -1;
            let maxY = -1;
            for (let y = 0; y < raw.info.height; y++) {
                for (let x = 0; x < raw.info.width; x++) {
                    if (raw.data[(y * raw.info.width + x) * raw.info.channels + 3] <= 0) continue;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
            expect(maxX, `${file} has visible alpha pixels`).toBeGreaterThanOrEqual(minX);
            return (maxX - minX + 1) / (maxY - minY + 1);
        };

        for (const [level, unit] of [[1, 1], [2, 1], [4, 4]] as const) {
            const book = bookOf(data, level, unit);
            const files = recipeFiles(book).map((file) => path.isAbsolute(file) ? file : path.join(repoRoot, file));
            const boxes = await mod.storytimeCoverFigureLayout(files, size);
            for (let index = 0; index < boxes.length; index++) {
                const sourceRatio = await alphaRatio(files[index]);
                const boxRatio = boxes[index].width / boxes[index].height;
                expect(Math.abs(boxRatio - sourceRatio), `${book.title}, figure ${boxes[index].name}, cut-out ratio`).toBeLessThanOrEqual(tolerance);
            }
            if (typeof mod.checkStorytimeCoverFigureAspect !== 'function') {
                expect(mod.checkStorytimeCoverFigureAspect, `${book.title}, figure ${boxes[0]?.name}, required aspect checker export`).toBeTypeOf('function');
                return;
            }
            expect(mod.checkStorytimeCoverFigureAspect(boxes, files, tolerance), `${book.title} aspect errors`).toEqual([]);

            const mutant = structuredClone(boxes);
            mutant[0].height = Math.round(mutant[0].height * 1.06);
            const copied = path.join(temporaryFolder(), `l${level}u${unit}-aspect-mutant.json`);
            fs.writeFileSync(copied, JSON.stringify(mutant));
            const copiedBoxes = JSON.parse(fs.readFileSync(copied, 'utf8')) as FigureBox[];
            const errors = mod.checkStorytimeCoverFigureAspect(copiedBoxes, files, tolerance);
            expect(errors.length, `${book.title}, figure ${copiedBoxes[0].name}, 6 percent stretch mutant`).toBeGreaterThan(0);
            expect(errors.join(' '), `${book.title}, figure ${copiedBoxes[0].name}, named aspect error`).toContain(copiedBoxes[0].name);
        }
    }, 120000);

    it('R12 v2 layout: the three shipped groups allow bottom crop, keep an 8 mm head band clear, and do not overlap in x', async () => {
        const dataModule = await covers('loadStorytimeCoverBooks');
        const mod = await pictures('storytimeCoverFigureLayout', 'checkStorytimeCoverFigureLayout');
        const data = dataModule.loadStorytimeCoverBooks();
        const size = { width: mmToPx(186), height: mmToPx(180) };
        const headBandHeight = mmToPx(8);
        for (const [level, unit] of [[1, 1], [2, 1], [4, 4]] as const) {
            const book = bookOf(data, level, unit);
            const files = recipeFiles(book).map((file) => path.isAbsolute(file) ? file : path.join(repoRoot, file));
            const boxes = await mod.storytimeCoverFigureLayout(files, size);
            expect(boxes.length, `${book.title} figure box count`).toBe(book.pictureRecipe.length);
            expect(mod.checkStorytimeCoverFigureLayout(boxes, size, headBandHeight), `${book.title} figure layout`).toEqual([]);

            const bottom = structuredClone(boxes);
            const last = bottom.reduce((best, box, index) => box.top + box.height > bottom[best].top + bottom[best].height ? index : best, 0);
            bottom[last].top = size.height - bottom[last].height + 1;
            const bottomFile = path.join(temporaryFolder(), `l${level}u${unit}-bottom.json`);
            fs.writeFileSync(bottomFile, JSON.stringify(bottom));
            expect(mod.checkStorytimeCoverFigureLayout(JSON.parse(fs.readFileSync(bottomFile, 'utf8')) as FigureBox[], size, headBandHeight), 'A copied bottom-edge crop is allowed.').toEqual([]);

            const head = structuredClone(boxes);
            head[0].top = 0;
            const headFile = path.join(temporaryFolder(), `l${level}u${unit}-head.json`);
            fs.writeFileSync(headFile, JSON.stringify(head));
            expect(mod.checkStorytimeCoverFigureLayout(JSON.parse(fs.readFileSync(headFile, 'utf8')) as FigureBox[], size, headBandHeight).join(' '), 'A copied top-edge mutant fails.').toMatch(/head|top/i);

            const overlap = structuredClone(boxes);
            overlap[1].left = overlap[0].left;
            const overlapFile = path.join(temporaryFolder(), `l${level}u${unit}-overlap.json`);
            fs.writeFileSync(overlapFile, JSON.stringify(overlap));
            expect(mod.checkStorytimeCoverFigureLayout(JSON.parse(fs.readFileSync(overlapFile, 'utf8')) as FigureBox[], size, headBandHeight).join(' '), 'A copied x-overlap mutant fails.').toMatch(/row|overlap/i);
        }
    }, 120000);

    it('R13: the picture layer has no alpha, composeSide stays JPEG, and the page is not one image', async () => {
        const mod = await pictures('composeStorytimeCoverPicture');
        const { default: sharp } = await import('sharp');
        const buffer = await mod.composeStorytimeCoverPicture(CAST.map((name) => path.join(repoRoot, castPath(name))), { width: 32, height: 32 }, '#D4E4F1');
        const meta = await sharp(buffer).metadata();
        expect(meta.hasAlpha, 'Composed picture alpha').toBe(false);
        expect(meta.channels, 'Composed picture channels').toBe(3);
        const art = await sharp({ create: { width: 20, height: 20, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } }).png().toBuffer();
        const jpeg = await composeSide(art, []);
        expect(jpeg[0], 'composeSide stays a JPEG.').toBe(0xff);
        expect(jpeg[1]).toBe(0xd8);
        const out = buildCover(2, 1);
        const file = path.join(out, 'cover.pdf');
        const info = parsePdfinfo(execFileSync('pdfinfo', ['-box', file], { encoding: 'utf8', timeout: 15000 }));
        const images = parsePdfimages(execFileSync('pdfimages', ['-list', file], { encoding: 'utf8', timeout: 15000 }));
        const fonts = parsePdffonts(execFileSync('pdffonts', [file], { encoding: 'utf8', timeout: 15000 }));
        expect(fonts.length, 'Embedded font count').toBeGreaterThan(0);
        expect(pageImages(images, info), 'The page is not one image.').toEqual([]);
    }, 230000);

    it('R14: --print writes a PDF/X file, checkPdfx passes, and the fonts remain', async () => {
        requireScript();
        const mod = await covers('storytimeCoverCornerMode');
        const mode = mod.storytimeCoverCornerMode();
        expect(['radius in the picture layer', 'square corners']).toContain(mode);
        const out = buildCover(2, 1, true, 2);
        const recorded = fs.readFileSync(path.join(out, 'corner-mode.txt'), 'utf8').trim();
        expect(recorded).toBe(mode);
        const pdfx = path.join(out, pdfxName(2, 1, 2));
        const chrome = path.join(out, 'cover.pdf');
        expect(fs.existsSync(pdfx), 'Missing v2 PDF/X file.').toBe(true);
        expect(path.basename(pdfx)).toContain('v2');
        expect(fs.existsSync(chrome), 'Missing Chrome PDF.').toBe(true);
        expect(pdfxCheck(chrome), 'A Chrome PDF is not a PDF/X pass.').not.toBe(0);
        expect(pdfxCheck(pdfx), 'PRINT_GATE on the PDF/X file').toBe(0);
        const fonts = parsePdffonts(execFileSync('pdffonts', [pdfx], { encoding: 'utf8', timeout: 15000 }));
        expect(fonts.length, 'PDF/X font count').toBeGreaterThan(0);
        expect(fonts.some((font) => /andika/i.test(font.name)), 'PDF/X keeps Andika.').toBe(true);
        expect(fonts.some((font) => /sarabun/i.test(font.name)), 'PDF/X keeps Sarabun.').toBe(true);
        for (const font of fonts) expect(font.embedded, `${font.name} stays embedded.`).toBe(true);
    }, 230000);

    it('R15: this phase does not change the Primary cover contract', () => {
        const files = [
            'dashboard/lib/covers/catalogue.ts',
            'dashboard/lib/covers/check.ts',
            'dashboard/lib/covers/compose.ts',
            'dashboard/lib/covers/kit.ts',
            'dashboard/lib/covers/back-text.ts',
            'dashboard/lib/qr-generator.ts',
            'dashboard/__tests__/covers-contract.test.ts',
            'dashboard/__tests__/covers-kit.test.ts',
            'dashboard/__tests__/covers-render.test.ts',
            'dashboard/__tests__/covers-back.test.ts',
        ];
        const diff = execFileSync('git', ['diff', '--name-only', 'e5266ce1', '--', ...files], { cwd: repoRoot, encoding: 'utf8' });
        const staged = execFileSync('git', ['diff', '--cached', '--name-only', 'e5266ce1', '--', ...files], { cwd: repoRoot, encoding: 'utf8' });
        expect(diff.trim(), 'Primary cover diff').toBe('');
        expect(staged.trim(), 'Primary cover index diff').toBe('');
        expect(coverBook('quest-6.2').badge).toBe('A1');
        expect(coverBook('adventure-7.1').badge).toBe('A2');
        expect(PAGE_RATIO).toBe(210 / 285);
        expect(composeSide).toBeTypeOf('function');
    });

    it('R16 M1: a dropped contact line fails the Thai check', async () => {
        const mod = await covers('checkStorytimeCoverThai');
        const lines = [...BACK_LINES.contact];
        lines.shift();
        const file = path.join(temporaryFolder(), 'm1.txt');
        fs.writeFileSync(file, lines.join('\n'));
        expect(mod.checkStorytimeCoverThai(fs.readFileSync(file, 'utf8'), 'back').length, 'M1 must fail.').toBeGreaterThan(0);
    });

    it('R16 M2: a changed Thai tone mark fails the Thai check', async () => {
        const mod = await covers('checkStorytimeCoverThai');
        const tones = ['\u0E48', '\u0E49', '\u0E4A', '\u0E4B'];
        const chars = [...BACK_LINES.contact.join('\n')];
        const index = chars.findIndex((char) => tones.includes(char));
        expect(index, 'The approved lines hold a Thai tone mark.').toBeGreaterThanOrEqual(0);
        chars[index] = tones[(tones.indexOf(chars[index]) + 1) % tones.length];
        const file = path.join(temporaryFolder(), 'm2.txt');
        fs.writeFileSync(file, chars.join(''));
        expect(mod.checkStorytimeCoverThai(fs.readFileSync(file, 'utf8'), 'back').length, 'M2 must fail.').toBeGreaterThan(0);
    });

    it('R16 M3: one swapped QR module fails the module check', async () => {
        const svg = generateQRCode(LINE);
        const expected = gridFromSvg(svg!);
        const mod = await covers('storytimeCoverQrGrid', 'checkStorytimeCoverQr');
        const file = path.join(temporaryFolder(), 'm3.svg');
        fs.writeFileSync(file, svg!.replace(/<rect\b[^>]*fill="#000000"[^>]*\/>/, ''));
        const swapped = mod.storytimeCoverQrGrid(fs.readFileSync(file, 'utf8'));
        expect(mod.checkStorytimeCoverQr(swapped.cells, expected.cells), 'M3 QR module difference count').not.toBe(0);
    });

    it('R16 M4: a wrong level colour fails the data check', async () => {
        const mod = await covers('loadStorytimeCoverBooks', 'checkStorytimeCoverData');
        const data = structuredClone(mod.loadStorytimeCoverBooks());
        data.books[0].levelColour = '#000000';
        data.levelColours['1'] = '#000000';
        const file = writeCopy('m4.json', data);
        const errors = mod.checkStorytimeCoverData(mod.loadStorytimeCoverBooks(file));
        expect(errors.length, 'M4 must fail.').toBeGreaterThan(0);
        expect(errors.join('\n').toLowerCase()).toContain('colour');
    });

    it('R16 M5: a year in the summary fails the copy check', async () => {
        const mod = await covers('checkStorytimeCoverCopy');
        const file = path.join(temporaryFolder(), 'm5.txt');
        fs.writeFileSync(file, 'Storytime Advantage 2026');
        expect(mod.checkStorytimeCoverCopy(fs.readFileSync(file, 'utf8')).length, 'M5 must fail.').toBeGreaterThan(0);
    });

    it('R26: six panel mutation copies, each in a temp folder, each fails one panel check (M16 to M20, replaces R16 M6)', async () => {
        const mod = await coverModule();
        const api = panelApi(mod);
        const data = mod.loadStorytimeCoverBooks();
        const ctx = panelCtx(2);
        const book = bookOf(data, 2, 1);
        const values = api.values(book, ctx);

        // Copy 1 (M16): the panel element is dropped from the back HTML.
        const html = mod.renderStorytimeCover(book, { panelValues: values }).backHtml;
        const good = side(parseHtml(html), 'back');
        expect(panelElement(good), 'The good render holds a panel.').not.toBeNull();
        const dropped = htmlCopy(html, (copy) => copy.querySelector('[data-part="panel"]')?.remove());
        expect(dropped.querySelector('[data-part="panel"]'), 'Copy 1: the panel is gone.').toBeNull();
        expect(() => panelElement(side(dropped, 'back')), 'Copy 1 must fail the panel element check (R23).').toThrow();

        // Copy 2 (M16): an all-empty panel on the mock, with no light line.
        const bare = bookOf(data, 1, 1);
        const bareValues = api.values(bare, panelCtx(1));
        const mockBack = side(parseHtml(mod.renderStorytimeCover(bare, { panelValues: bareValues }).backHtml), 'back');
        expect(missingLineTexts(mockBack), 'The mock shows the light line for each of the five empty fields (R23).').toEqual(Array.from({ length: 5 }, () => api.missingLine));
        const noLineHtml = mod.renderStorytimeCover(bare, { panelValues: bareValues, panelMock: false }).backHtml;
        const noLineFile = path.join(temporaryFolder(), 'm16-no-light-line.html');
        fs.writeFileSync(noLineFile, noLineHtml);
        const noLine = side(parseHtml(fs.readFileSync(noLineFile, 'utf8')), 'back');
        expect(panelElement(noLine), 'Copy 2 keeps the panel element.').not.toBeNull();
        expect(missingLineTexts(noLine), 'Copy 2 drops the light line, so the R23 mock contract fails.').not.toEqual(Array.from({ length: 5 }, () => api.missingLine));

        // Copy 3 (M20): the sight words before the decodable words.
        const wrongOrder = structuredClone(data);
        const wrongOrderBook = bookOf(wrongOrder, 2, 1);
        wrongOrderBook.panel = Object.fromEntries(Object.entries(wrongOrderBook.panel).sort(([a], [b]) => a === 'sight' && b === 'decodable' ? -1 : a === 'decodable' && b === 'sight' ? 1 : 0)) as StorytimeCoverBookPanel;
        const orderFile = writeCopy('r26-wrong-order.json', wrongOrder);
        const orderCopy = JSON.parse(fs.readFileSync(orderFile, 'utf8')) as StorytimeCoverData;
        expect(api.checkFields(Object.keys(bookOf(orderCopy, 2, 1).panel)).length, 'Copy 3 must fail the order check (R20.1).').toBeGreaterThan(0);

        // Copy 4 (M17): the word zebra in the story text.
        const zebra = structuredClone(data);
        bookOf(zebra, 2, 1).panel.story.text = `${bookOf(zebra, 2, 1).panel.story.text} zebra`;
        const zebraFile = writeCopy('r26-zebra.json', zebra);
        expect(api.checkRow(bookOf(JSON.parse(fs.readFileSync(zebraFile, 'utf8')) as StorytimeCoverData, 2, 1), ctx).length, 'Copy 4 must fail the story check (R20.2).').toBeGreaterThan(0);

        // Copy 5 (M18): week 8 in the books field week list.
        const week8 = structuredClone(data);
        bookOf(week8, 2, 1).panel.books.weeks = [1, 2, 3, 4, 5, 6, 7, 8];
        const week8File = writeCopy('r26-week8.json', week8);
        expect(api.checkRow(bookOf(JSON.parse(fs.readFileSync(week8File, 'utf8')) as StorytimeCoverData, 2, 1), ctx).length, 'Copy 5 must fail the week-list check (R21).').toBeGreaterThan(0);

        // Copy 6 (M19): the panel size forced to 9 pt.
        expect(api.scale, '9 pt is below the floor of the scale.').not.toContain(9);
        const sizeFile = writeCopy('r26-size-9.json', { values, sizePt: 9, inset: api.inset });
        expect(fs.existsSync(sizeFile), 'Copy 6 is stored in a temporary folder.').toBe(true);
        expect(api.overflows(values, 9, api.inset), 'Copy 6: a 9 pt layout must overflow the inset (R25).').toBe(true);
    });

    it('R17: front level-card text is visible in the PNG and PDF/X raster; back panel text remains visible', async () => {
        const out = buildCover(2, 1, true);
        const { default: sharp } = await import('sharp');
        const countInk = async (file: string, boxMm: { left: number; top: number; width: number; height: number }, tone: 'light' | 'dark') => {
            const image = await sharp(file).raw().toBuffer({ resolveWithObject: true });
            const scale = image.info.width / 210;
            const x1 = Math.floor(boxMm.left * scale);
            const y1 = Math.floor(boxMm.top * scale);
            const x2 = Math.ceil((boxMm.left + boxMm.width) * scale);
            const y2 = Math.ceil((boxMm.top + boxMm.height) * scale);
            let count = 0;
            for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) {
                const i = (y * image.info.width + x) * image.info.channels;
                const r = image.data[i], g = image.data[i + 1], b = image.data[i + 2];
                if (tone === 'light' ? r >= 245 && g >= 245 && b >= 245 : r <= 80 && g <= 80 && b <= 80) count++;
            }
            return count;
        };
        const front = path.join(out, 'front.png');
        const frontBands = [
            { left: 18, top: 224, width: 174, height: 23 },
            { left: 18, top: 251, width: 174, height: 23 },
        ];
        for (const [index, band] of frontBands.entries()) {
            expect(await countInk(front, band, 'light'), `Front PNG near-white card ink band ${index + 1}`).toBeGreaterThan(1000);
        }
        const prefix = path.join(temporaryFolder(), 'print-front');
        requireHeavyWrapper();
        execFileSync('pdftoppm', ['-f', '1', '-l', '1', '-singlefile', '-r', '72', '-png', path.join(out, pdfxName(2, 1)), prefix], { encoding: 'utf8', timeout: 60000 });
        const pdfxRaster = `${prefix}.png`;
        for (const [index, band] of frontBands.entries()) {
            expect(await countInk(pdfxRaster, band, 'light'), `PDF/X raster near-white card ink band ${index + 1}`).toBeGreaterThan(50);
        }
        expect(await countInk(path.join(out, 'back.png'), { left: 28, top: 61, width: 160, height: 110 }, 'dark'), 'Back panel dark text ink').toBeGreaterThan(1000);
    }, 300000);

    it('R18 v2 sides: no figure pixel is in the left or the right 3 mm band of a composed cover picture', async () => {
        const dataModule = await covers('loadStorytimeCoverBooks');
        const mod = await pictures('composeStorytimeCoverPicture');
        const size = { width: mmToPx(186), height: mmToPx(180) };
        const band = mmToPx(SIDE_BAND_MM);
        const data = dataModule.loadStorytimeCoverBooks();
        for (const [level, unit] of [[1, 1], [2, 1], [4, 4]] as const) {
            const { raw, tint } = await composeBookPicture(mod, data, level, unit, size);
            const rows = { top: mmToPx(CORNER_ROWS_MM), height: raw.info.height - 2 * mmToPx(CORNER_ROWS_MM) };
            const left = figurePixels(raw, tint, { left: 0, top: rows.top, width: band, height: rows.height });
            expect(left, `Level ${level} Unit ${unit} left side band holds no figure pixel`).toBe(0);
            const right = figurePixels(raw, tint, { left: raw.info.width - band, top: rows.top, width: band, height: rows.height });
            expect(right, `Level ${level} Unit ${unit} right side band holds no figure pixel`).toBe(0);
        }
    }, 120000);

    it('R18 v2 side band: the picture check names the side for a copied mutant with a figure at the edge', async () => {
        const dataModule = await covers('loadStorytimeCoverBooks');
        const mod = await pictures('composeStorytimeCoverPicture', 'checkStorytimeCoverPicture');
        const { default: sharp } = await import('sharp');
        const size = { width: mmToPx(186), height: mmToPx(180) };
        const data = dataModule.loadStorytimeCoverBooks();
        for (const [level, unit] of [[1, 1], [2, 1], [4, 4]] as const) {
            const { png, raw, tint } = await composeBookPicture(mod, data, level, unit, size);
            expect(mod.checkStorytimeCoverPicture(png, tint, 0.55), `Level ${level} Unit ${unit} picture check`).toEqual([]);
            const copy = Buffer.from(raw.data);
            const blockWidth = 20;
            const blockHeight = 200;
            const blockTop = Math.floor((raw.info.height - blockHeight) / 2);
            for (let y = blockTop; y < blockTop + blockHeight; y++) {
                for (let x = 0; x < blockWidth; x++) {
                    const index = (y * raw.info.width + x) * raw.info.channels;
                    copy[index] = 0;
                    copy[index + 1] = 0;
                    copy[index + 2] = 0;
                }
            }
            const file = path.join(temporaryFolder(), `l${level}u${unit}-left-side-mutant.png`);
            await sharp(copy, { raw: { width: raw.info.width, height: raw.info.height, channels: raw.info.channels } }).png().toFile(file);
            const mutant = fs.readFileSync(file);
            const mutantRaw = await sharp(mutant).raw().toBuffer({ resolveWithObject: true });
            const ground = [0, 1, 2].map((channel) => Number.parseInt(tint.slice(channel * 2 + 1, channel * 2 + 3), 16));
            const inset = mmToPx(8);
            for (const [x, y] of [[inset, inset], [mutantRaw.info.width - 1 - inset, inset], [inset, mutantRaw.info.height - 1 - inset], [mutantRaw.info.width - 1 - inset, mutantRaw.info.height - 1 - inset]]) {
                const index = (y * mutantRaw.info.width + x) * mutantRaw.info.channels;
                expect([0, 1, 2].every((channel) => Math.abs(mutantRaw.data[index + channel] - ground[channel]) <= 6), `Level ${level} Unit ${unit} mutant corner ${x},${y} holds the tint`).toBe(true);
            }
            const errors = mod.checkStorytimeCoverPicture(mutant, tint, 0.55);
            expect(errors.length, `The copied left side mutant of Level ${level} Unit ${unit} fails the picture check`).toBeGreaterThan(0);
            expect(errors.join(' '), `The error of Level ${level} Unit ${unit} names the side or the edge`).toMatch(/left|right|edge/i);
        }
    }, 120000);

    it('R18 v2 layout: the layout check rejects a copied box list with a figure at the left edge', async () => {
        const dataModule = await covers('loadStorytimeCoverBooks');
        const mod = await pictures('storytimeCoverFigureLayout', 'checkStorytimeCoverFigureLayout');
        const size = { width: mmToPx(186), height: mmToPx(180) };
        const headBand = mmToPx(8);
        const sideBand = mmToPx(SIDE_BAND_MM);
        const data = dataModule.loadStorytimeCoverBooks();
        const book = bookOf(data, 2, 1);
        const files = recipeFiles(book).map((file) => path.isAbsolute(file) ? file : path.join(repoRoot, file));
        const boxes = await mod.storytimeCoverFigureLayout(files, size);
        const copy = structuredClone(boxes);
        copy[0].left = 0;
        const file = path.join(temporaryFolder(), 'l2u1-left-edge-boxes.json');
        fs.writeFileSync(file, JSON.stringify(copy));
        const loaded = JSON.parse(fs.readFileSync(file, 'utf8')) as FigureBox[];
        const errors = mod.checkStorytimeCoverFigureLayout(loaded, size, headBand, sideBand);
        expect(errors.length, 'A copied box list with a figure at the left edge fails the layout check').toBeGreaterThan(0);
        expect(errors.join(' '), 'The layout error names the side or the edge').toMatch(/left|right|edge|side/i);
    }, 120000);

    it('R18 v2 top band: no figure pixel is in the top 8 mm band of a composed cover picture', async () => {
        const dataModule = await covers('loadStorytimeCoverBooks');
        const mod = await pictures('composeStorytimeCoverPicture');
        const size = { width: mmToPx(186), height: mmToPx(180) };
        const data = dataModule.loadStorytimeCoverBooks();
        for (const [level, unit] of [[1, 1], [2, 1], [4, 4]] as const) {
            const { raw, tint } = await composeBookPicture(mod, data, level, unit, size);
            const inset = mmToPx(CORNER_ROWS_MM);
            const top = figurePixels(raw, tint, { left: inset, top: 0, width: raw.info.width - 2 * inset, height: mmToPx(8) });
            expect(top, `Level ${level} Unit ${unit} top 8 mm band holds no figure pixel`).toBe(0);
        }
    }, 120000);
});
