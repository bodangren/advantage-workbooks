// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { BACK_LINES } from '../lib/covers/back-text';
import { PAGE_RATIO, composeSide } from '../lib/covers/compose';
import { coverBook } from '../lib/covers/catalogue';
import { pageImages, parsePdffonts, parsePdfimages, parsePdfinfo } from '../lib/print/pdfx';
import { generateQRCode } from '../lib/qr-generator';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Phase 1 contract. New modules load inside each test, so a missing file stays an assertion.
 * covers.ts exports the names below. cover-picture.ts exports composeStorytimeCoverPicture
 * and checkStorytimeCoverPicture. The script is make-storytime-book-cover.ts.
 *
 * Data file content/storytime/covers/books.json:
 * series, trim { widthMm, heightMm }, levelColours, lineAddress, books[].
 * A book row has level, unit, firstWeek, lastWeek, title, levelColour, pictureRecipe, summary.
 * pictureRecipe is an array. An empty recipe is []. summary is null or { text, week }.
 *
 * HTML hooks: [data-side="front"|"back"][data-title], [data-part] for series-name, picture-area,
 * level-card, logo, panel, contact, qr, line-label. Geometry is CSS millimetres on those parts.
 * The QR SVG from generateQRCode fills the 44 mm box, quiet zone included.
 *
 * Script: --level <n> --unit <m> --out <dir> [--print] [--data <books.json>]
 * --out receives front.png, back.png, cover.pdf, and, with --print, the PDF/X file
 * Storytime-Advantage-L<n>-U<m>-Student-Book-Cover-v1_PDFX-1a.pdf plus corner-mode.txt.
 */
interface StorytimeCoverBook {
    level: number;
    unit: number;
    firstWeek: number;
    lastWeek: number;
    title: string;
    levelColour: string;
    pictureRecipe: Array<{ kind: 'child' | 'animal'; name: string; file: string }>;
    summary: null | { text: string; week: number };
}

interface StorytimeCoverData {
    series: string;
    trim: { widthMm: number; heightMm: number };
    levelColours: Record<string, string>;
    lineAddress: string;
    books: StorytimeCoverBook[];
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
    checkStorytimeCoverSummary: (summary: string, week: StorytimeWeek) => string[];
    renderStorytimeCover: (book: StorytimeCoverBook) => { frontHtml: string; backHtml: string };
    checkStorytimeCoverCopy: (pageText: string) => string[];
    checkStorytimeCoverThai: (pageText: string, side: 'front' | 'back') => string[];
    storytimeCoverQrGrid: (svg: string) => QrGrid;
    checkStorytimeCoverQr: (printed: boolean[][], expected: boolean[][]) => number;
    storytimeCoverCornerMode: () => string;
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
    checkStorytimeCoverFigureLayout: (boxes: FigureBox[], sizePx: { width: number; height: number }, headBandHeightPx: number) => string[];
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
    expect(fs.existsSync(coversModule), `Missing module: lib/storytime/print/covers.ts. Required export: ${names.join(', ')}.`).toBe(true);
    const loaded = await import(coversModule) as CoverModule;
    for (const name of names) expect(loaded[name], `Export ${name}.`).toBeTypeOf('function');
    return loaded;
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

function assertPanel(doc: ParentNode, summary: StorytimeCoverBook['summary']): void {
    const panel = doc.querySelector('[data-part="panel"]');
    if (summary === null) expect(panel, 'A null summary must not print a panel element.').toBeNull();
    else {
        expect(panel, 'A summary must print the panel element.').not.toBeNull();
        expectBox(panel!, { left: 12, top: 48, width: 186, height: 138 });
        expect(text(panel!)).toContain(summary.text);
    }
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

    it('R3: one approved summary uses student words, and zebra or a draft week fails', async () => {
        expect(fs.existsSync(booksFile), 'Missing unit summaries in content/storytime/covers/books.json').toBe(true);
        const mod = await covers('loadStorytimeCoverBooks', 'checkStorytimeCoverSummary', 'storytimeCoverStudentWords');
        const data = mod.loadStorytimeCoverBooks();
        const rows = data.books.filter((book) => book.summary !== null);
        expect(rows, 'Summary row count').toHaveLength(1);
        expect(rows[0].level).toBe(2);
        expect(rows[0].unit).toBe(1);
        expect(rows[0].summary!.week).toBe(1);
        expect(data.books.filter((book) => book.summary === null), 'Null summary count').toHaveLength(15);
        for (const book of data.books) {
            expect(book.summary === null || typeof book.summary === 'object', 'A summary is null or an object.').toBe(true);
        }
        const week = weekFile(2, 1);
        expect(week.approval.text.status).toBe('approved');
        const summary = rows[0].summary!.text;
        const words = summary.trim().split(/\s+/);
        expect(words.length, 'Summary word count').toBeGreaterThan(0);
        expect(words.length, 'Summary word count').toBeLessThanOrEqual(25);
        const allowed = studentWords(week);
        const fromModule = mod.storytimeCoverStudentWords(week);
        expect(fromModule.has('publish'), 'An approval-only word is not student text.').toBe(false);
        for (const word of words) {
            const token = word.toLowerCase().replace(/[^a-z]/g, '');
            if (!token) continue;
            expect(allowed.has(token), `Summary word "${token}" is in the week text.`).toBe(true);
            expect(fromModule.has(token), `Module word set holds "${token}".`).toBe(true);
        }
        expect(mod.checkStorytimeCoverSummary(summary, week), 'Shipped summary errors').toEqual([]);
        expect(mod.checkStorytimeCoverSummary('zebra', week).length, 'The word zebra must fail.').toBeGreaterThan(0);
        expect(mod.checkStorytimeCoverSummary('publish', week).length, 'An approval-only word must fail.').toBeGreaterThan(0);
        expect(mod.checkStorytimeCoverSummary(Array.from({ length: 26 }, () => 'hello').join(' '), week).length, 'A 26-word summary must fail.').toBeGreaterThan(0);
        const draft = weekFile(2, 2);
        expect(draft.approval.text.status).toBe('draft');
        expect(mod.checkStorytimeCoverSummary('hello', draft).length, 'A draft week must not supply a summary.').toBeGreaterThan(0);
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

    it('R5: the back holds the logo, the panel only with a summary, the contact block, the QR, and LINE', async () => {
        const mod = await covers('loadStorytimeCoverBooks', 'renderStorytimeCover');
        const data = mod.loadStorytimeCoverBooks();
        const level2 = bookOf(data, 2, 1);
        const empty = data.books.find((book) => book.summary === null);
        expect(empty, 'A row with a null summary').toBeDefined();
        const back = side(parseHtml(mod.renderStorytimeCover(level2).backHtml), 'back');
        expect(back.getAttribute('data-title')).toBe(level2.title);
        expect(text(part(back, 'series-name'))).toBe('Storytime Advantage');
        expectColour(part(back, 'series-name'), level2.levelColour);
        expectBox(part(back, 'logo'), { left: 12, top: 12, width: 30, height: 30 });
        assertPanel(back, level2.summary);
        expectBox(part(back, 'contact'), { left: 15, top: 200 });
        expectBox(part(back, 'qr'), { width: 44, height: 44, right: 14, top: 200 });
        const label = part(back, 'line-label');
        expect(text(label)).toBe('LINE');
        expect(label.textContent ?? '').not.toMatch(/[\u0E00-\u0E7F]/);
        const bare = side(parseHtml(mod.renderStorytimeCover(empty!).backHtml), 'back');
        assertPanel(bare, null);
    });

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
    });

    it('R12 v2: all three shipped compositions meet the fill threshold on their tinted ground', async () => {
        const dataModule = await covers('loadStorytimeCoverBooks');
        const mod = await pictures('composeStorytimeCoverPicture', 'checkStorytimeCoverPicture');
        const { default: sharp } = await import('sharp');
        const threshold = 0.58;
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
        const errors = mod.checkStorytimeCoverPicture(fs.readFileSync(copied), tint, 0.58);
        expect(errors.some((error) => /fill/i.test(error)), 'The copied mutant fails by fill, not by corner tint.').toBe(true);
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

    it('R16 M6: a Level 2 Unit 1 back without the panel fails', async () => {
        const mod = await covers('loadStorytimeCoverBooks', 'renderStorytimeCover');
        const book = bookOf(mod.loadStorytimeCoverBooks(), 2, 1);
        expect(book.summary, 'Level 2 Unit 1 has a summary.').not.toBeNull();
        const html = mod.renderStorytimeCover(book).backHtml;
        const good = side(parseHtml(html), 'back');
        expect(good.querySelector('[data-part="panel"]'), 'The good render has a panel.').not.toBeNull();
        const broken = htmlCopy(html, (copy) => copy.querySelector('[data-part="panel"]')?.remove());
        expect(() => assertPanel(side(broken, 'back'), book.summary)).toThrow();
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
});
