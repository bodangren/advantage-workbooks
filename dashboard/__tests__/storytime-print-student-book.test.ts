// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { STORYTIME_QR_HOST, STORYTIME_ROOT, storytimeQrUrl, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { READER_PAGE_MM, leafMarkProblems, leafStyleProblems, measureLeafSidesInBrowser, studentReaderProblems } from './fixtures/storytime-reader-leaf';
import { AWKWARD_PREFIXES, HOSTILE_PREFIXES, jobsFor, pictureSourceProblems, prefixedJobs, writePictureFolder, type PictureFolderJob } from './fixtures/storytime-picture-folder';

/**
 * Phase 2 contract. Imports stay inside test bodies so missing modules preserve collection.
 * student-book.ts exports compileStorytimeStudentBook(weeks, { profile, mode }): { html }.
 * profile.ts exports STORYTIME_PRINT_PROFILE with the fields in R30 below.
 * Each physical side is .student-page[data-page-kind][data-page-number].
 * Stable data-part hooks identify printed elements, not a second content manifest.
 * Reader sides (changed 2026-11-03, Daniel's proof answer): 12 for a teaching week, 2 readers x 3 leaves x 2 faces;
 * each holds 2 landscape reader pages of 198 x 148.5 mm (fronts turned 180 degrees, backs upright), a fold line, and a leaf mark (spec FR-5.1).
 */
interface PrintProfile {
    trim: { widthMm: number; heightMm: number };
    bleedMm: number;
    perforationMm: number;
    readerPage: { widthMm: number; heightMm: number };
}

interface ReaderModule {
    compileStorytimeReaders: (
        weeks: StorytimeWeek[], options: { profile: PrintProfile; mode: 'proof' | 'final'; output: 'workbook' | 'a3-color' },
    ) => { html: string };
}

interface StudentModule {
    compileStorytimeStudentBook: (
        weeks: StorytimeWeek[], options: { profile: PrintProfile; mode: 'proof' | 'final' },
    ) => { html: string } | Promise<{ html: string }>;
}

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const studentModule = path.join(dashboardRoot, 'lib/storytime/print/student-book.ts');
const profileModule = path.join(dashboardRoot, 'lib/storytime/print/profile.ts');
const readerModule = path.join(dashboardRoot, 'lib/storytime/print/readers.ts');
const fontDir = path.join(dashboardRoot, 'assets/print-fonts');
const temporaryFolders: string[] = [];
const builtPdfx = new Map<string, string>();
const pictureIds = ['nest', 'cat', 'fish', 'dog', 'nose', 'bus', 'hat', 'cup', 'net']
    .map((word) => `l2-w01-check-row-${word}`);

// R48: the canonical Storytime QR page path. The route is /[locale]/st/[level]/[week].
// The level is an integer from 1 to 4 and the week is an integer from 1 to 32, with no leading zero.
// The path ends there, or it holds one query: ?part=book, ?part=decodable, or ?part=song.
const QR_ACCEPT_PATHS = [
    '/th/st/2/1',
    '/th/st/2/1?part=song',
    '/th/st/2/1?part=book',
    '/th/st/2/1?part=decodable',
    '/th/st/4/32',
    '/th/st/1/1',
] as const;

const QR_REJECT_PATHS = [
    '/th/st/../evil',
    '/th/st/../../evil',
    '/th/st/2/./1',
    '/th/st/2/1/..',
    '/th/st//2/1',
    '/th/st/',
    '/th/st/2/1/3',
    '/th/st/0/1',
    '/th/st/5/1',
    '/th/st/2/0',
    '/th/st/2/33',
    '/th/st/02/1',
    '/th/st/2/01',
    '/th/st/2/1 ',
    '/th/st/2/1\t',
    '/th/st/2/1\n',
    '/th/st/2/1#x',
    '/th/st/2/1?week=2',
    '/th/st/2/1?part=video',
    '/th/st/2/1?part=song?part=book',
    '/th/st/2/1?part=song&part=book',
    '/th/st/2/1?part=SONG',
] as const;

/** Tells whether an error message names the page path, raw or JSON escaped. */
function namesPath(message: string, input: string): boolean {
    return message.includes(input) || message.includes(JSON.stringify(input));
}

function shipped(): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')));
}

function temporaryFolder(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const folder = fs.mkdtempSync('/tmp/opencode/storytime-student-book-');
    temporaryFolders.push(folder);
    return folder;
}

function savedCopy<T>(value: T, change: (copy: T) => void): T {
    const file = path.join(temporaryFolder(), 'copy.json');
    fs.writeFileSync(file, JSON.stringify(value));
    const copy = JSON.parse(fs.readFileSync(file, 'utf8')) as T;
    change(copy);
    fs.writeFileSync(file, JSON.stringify(copy));
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

async function profile(): Promise<PrintProfile> {
    expect(fs.existsSync(profileModule), 'Missing module: lib/storytime/print/profile.ts').toBe(true);
    const exports = await import(profileModule);
    expect(exports.STORYTIME_PRINT_PROFILE, 'Export STORYTIME_PRINT_PROFILE.').toBeDefined();
    return exports.STORYTIME_PRINT_PROFILE;
}

async function render(week = shipped(), selectedProfile?: PrintProfile, mode: 'proof' | 'final' = 'proof'): Promise<{ html: string; doc: Document }> {
    expect(fs.existsSync(studentModule), 'Missing module: lib/storytime/print/student-book.ts').toBe(true);
    const exports = await import(studentModule) as StudentModule;
    expect(exports.compileStorytimeStudentBook, 'Export compileStorytimeStudentBook.').toBeTypeOf('function');
    const { html } = await exports.compileStorytimeStudentBook([week], {
        profile: selectedProfile ?? await profile(), mode,
    });
    expect(html).toBeTypeOf('string');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelectorAll('.student-page').length, 'Render physical page sides.').toBeGreaterThan(0);
    return { html, doc };
}

/**
 * Builds a final-mode student book in a temporary repository. `WORKBOOKS_ROOT` points at the
 * repository and the module registry is fresh, so that `STORYTIME_ROOT` and the picture folder of
 * the level lie in the temporary repository. The environment and the registry return afterwards.
 * @param repo The temporary repository root.
 * @param week The week to build.
 * @returns The HTML and its document.
 */
async function renderFinalIn(repo: string, week = shipped()): Promise<{ html: string; doc: Document }> {
    const saved = process.env.WORKBOOKS_ROOT;
    process.env.WORKBOOKS_ROOT = repo;
    vi.resetModules();
    try {
        const exports = await import(studentModule) as StudentModule;
        const { STORYTIME_PRINT_PROFILE } = await import(profileModule) as { STORYTIME_PRINT_PROFILE: PrintProfile };
        const { html } = await exports.compileStorytimeStudentBook([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final' });
        return { html, doc: new DOMParser().parseFromString(html, 'text/html') };
    } finally {
        if (saved === undefined) delete process.env.WORKBOOKS_ROOT;
        else process.env.WORKBOOKS_ROOT = saved;
        vi.resetModules();
    }
}

/** The message of a final student-book build that stops; an empty text means that the build did not stop. */
async function finalBuildError(repo: string, week = shipped()): Promise<string> {
    try {
        await renderFinalIn(repo, week);
        return '';
    } catch (e) {
        return e instanceof Error ? e.message : String(e);
    }
}

/** A temporary repository with an empty level 2 picture folder (Red 4g: final mode reads the folder through its manifest.json). */
function finalRepo(): { repo: string; pictures: string } {
    const repo = temporaryFolder();
    const pictures = path.join(repo, 'content', 'storytime', 'l2', 'print', 'pictures');
    fs.mkdirSync(pictures, { recursive: true });
    return { repo, pictures };
}

/** The picture-list row ids that a final student book of the week requests. */
async function weekRowIds(week = shipped()): Promise<string[]> {
    const { storytimePrintPictures } = await import('../lib/storytime/print/pictures');
    return storytimePrintPictures([week]).map((row) => row.id);
}

function pages(doc: Document): Element[] {
    return Array.from(doc.querySelectorAll('.student-page'));
}

function page(doc: Document, kind: string): Element {
    const found = doc.querySelectorAll(`.student-page[data-page-kind="${kind}"]`);
    expect(found.length, `Exactly one ${kind} page must print.`).toBe(1);
    return found[0];
}

function part(root: ParentNode, name: string): Element {
    const found = root.querySelectorAll(`[data-part="${name}"]`);
    expect(found.length, `Exactly one ${name} must print.`).toBe(1);
    return found[0];
}

function text(element: Element): string {
    return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function texts(root: ParentNode, selector: string): string[] {
    return Array.from(root.querySelectorAll(selector), text);
}

// These assertions run on both the shipped render and serialized, broken HTML copies.
function assertHomeLeaf(doc: Document): void {
    const front = page(doc, 'home-front');
    const back = page(doc, 'home-back');
    const sides = pages(doc);
    expect(sides.indexOf(front) % 2, 'The home front starts a separate leaf.').toBe(0);
    expect(sides.indexOf(back)).toBe(sides.indexOf(front) + 1);
    expect(front.querySelectorAll('[data-student-work]').length).toBe(0);
    expect(back.querySelectorAll('[data-student-work]').length).toBe(0);
}

function assertLeftSpread(doc: Document): void {
    const left = page(doc, 'practice');
    const right = page(doc, 'writing');
    const sides = pages(doc);
    expect((sides.indexOf(left) + 1) % 2, 'The practice side must be a left page.').toBe(0);
    expect(sides.indexOf(right)).toBe(sides.indexOf(left) + 1);
}

function assertUnmarkedCheck(doc: Document): void {
    const check = page(doc, 'check');
    expect(check.querySelectorAll('[data-answer], [data-correct], [aria-checked="true"], .answer, .correct, .answer-mark, .selected').length).toBe(0);
    expect(text(check)).not.toMatch(/[✓✔☑●]|\b(?:answer|correct)\b/i);
    const pictures = Array.from(check.querySelectorAll('[data-picture-id]'));
    expect(pictures.map((image) => image.getAttribute('data-picture-id'))).toEqual(pictureIds);
    for (const image of pictures) {
        expect(image.getAttribute('class') ?? '').not.toMatch(/answer|correct|selected|circled/i);
        expect(image.getAttribute('style') ?? '').not.toMatch(/border|outline|background/i);
    }
}

function htmlCopy(doc: Document, change: (copy: Document) => void): Document {
    const file = path.join(temporaryFolder(), 'copy.html');
    fs.writeFileSync(file, doc.documentElement.outerHTML);
    const copy = new DOMParser().parseFromString(fs.readFileSync(file, 'utf8'), 'text/html');
    change(copy);
    fs.writeFileSync(file, copy.documentElement.outerHTML);
    return new DOMParser().parseFromString(fs.readFileSync(file, 'utf8'), 'text/html');
}

// Prove the wrapper through a real ancestor, not a caller-supplied environment flag.
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

function inkRows(output: string): string[][] {
    return Array.from(output.matchAll(/^\s*(\d+\.\d{5})\s+(\d+\.\d{5})\s+(\d+\.\d{5})\s+(\d+\.\d{5})\s+CMYK\b/gm),
        (match) => match.slice(1, 5));
}

interface PrintedQr {
    left: number; top: number; right: number; bottom: number;
    modules: boolean[][];
}

// Find isolated 7-module finder rings in the raster. No HTML coordinates identify the codes.
function printedQrs(data: Buffer, width: number, height: number, sizes: number[]): PrintedQr[] {
    const dark = (x: number, y: number): boolean => data[Math.floor(y) * width + Math.floor(x)] < 128;
    const remaining = Uint8Array.from(data, (value) => value < 128 ? 1 : 0);
    const finders: { x: number; y: number; pitch: number }[] = [];
    for (let start = 0; start < remaining.length; start++) {
        if (!remaining[start]) continue;
        const queue = [start];
        remaining[start] = 0;
        let left = width, right = 0, top = height, bottom = 0;
        for (let index = 0; index < queue.length; index++) {
            const pixel = queue[index], x = pixel % width, y = Math.floor(pixel / width);
            left = Math.min(left, x); right = Math.max(right, x);
            top = Math.min(top, y); bottom = Math.max(bottom, y);
            const neighbors = [x > 0 ? pixel - 1 : -1, x + 1 < width ? pixel + 1 : -1,
                y > 0 ? pixel - width : -1, y + 1 < height ? pixel + width : -1];
            for (const next of neighbors) {
                if (next >= 0 && remaining[next]) { remaining[next] = 0; queue.push(next); }
            }
        }
        const w = right - left + 1, h = bottom - top + 1;
        if (w < 21 || w > 150 || Math.abs(w - h) > 2 || Math.abs(queue.length / (w * h) - 24 / 49) > 0.06) continue;
        let finder = true;
        for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++) {
            const expected = row === 0 || row === 6 || col === 0 || col === 6
                || (row >= 2 && row <= 4 && col >= 2 && col <= 4);
            if (dark(left + (col + 0.5) * w / 7, top + (row + 0.5) * h / 7) !== expected) finder = false;
        }
        if (finder) finders.push({ x: left + w / 2, y: top + h / 2, pitch: (w + h) / 14 });
    }
    const codes: PrintedQr[] = [];
    for (const corner of finders) for (const size of sizes) {
        const distance = (size - 7) * corner.pitch;
        const across = finders.find((f) => Math.abs(f.x - corner.x - distance) < corner.pitch
            && Math.abs(f.y - corner.y) < corner.pitch);
        const below = finders.find((f) => Math.abs(f.y - corner.y - distance) < corner.pitch
            && Math.abs(f.x - corner.x) < corner.pitch);
        if (!across || !below) continue;
        const dx = (across.x - corner.x) / (size - 7), dy = (below.y - corner.y) / (size - 7);
        const left = corner.x - 3.5 * dx, top = corner.y - 3.5 * dy;
        codes.push({ left, top, right: left + size * dx, bottom: top + size * dy,
            modules: Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) =>
                dark(left + (col + 0.5) * dx, top + (row + 0.5) * dy))) });
    }
    return codes;
}

/** Build the rendered HTML, not a prepared PDF. The outer timeout kills the child process group. */
function buildPdfx(html: string): string {
    requireHeavyWrapper();
    const cached = builtPdfx.get(html);
    if (cached) return cached;
    const folder = temporaryFolder();
    const htmlFile = path.join(folder, 'student.html');
    const chromeFile = path.join(folder, 'student.pdf');
    const pdfxFile = path.join(folder, 'student-pdfx.pdf');
    fs.writeFileSync(htmlFile, html.replace(/<script[^>]+src="https?:[^>]+><\/script>/g, ''));
    const script = `
        import fs from 'node:fs';
        import { execFileSync } from 'node:child_process';
        import { chromium } from '@playwright/test';
        import { renderPagedPdf } from ${JSON.stringify(path.join(dashboardRoot, 'lib/print/render.ts'))};
        const browser = await chromium.launch({ channel: 'chrome', timeout: 60000 });
        try {
            await renderPagedPdf(browser, ${JSON.stringify(htmlFile)}, ${JSON.stringify(chromeFile)},
                fs.readFileSync('node_modules/pagedjs/dist/paged.polyfill.js', 'utf8'));
        } finally { await browser.close(); }
        execFileSync(process.execPath, ['--import', 'tsx', 'scripts/print/make-pdfx.ts',
            ${JSON.stringify(chromeFile)}, '--out', ${JSON.stringify(pdfxFile)}, '--keep-fonts', '--k-only'],
            { stdio: 'inherit', timeout: 45000 });
    `;
    execFileSync('timeout', ['--signal=TERM', '--kill-after=3s', '180s', process.execPath,
        '--import', 'tsx', '--input-type=module', '-e', script], {
        cwd: dashboardRoot, encoding: 'utf8', timeout: 185000, maxBuffer: 8 * 1024 * 1024,
    });
    expect(fs.existsSync(pdfxFile), 'The real PDF/X output must exist.').toBe(true);
    builtPdfx.set(html, pdfxFile);
    return pdfxFile;
}

// ---- Phase 2 Red 2c helpers (the Check findings D1 to D4, 2026-10-27) ----

/** Pixels per millimeter at the 300 dpi raster the built PDF/X pages use. */
const MM_PX_300 = 300 / 25.4;

function isolateMeasurementHtml(title: string, style: string, body: string): string {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${style}</style></head><body>${body}</body></html>`;
}

/** Rasterizes one page of a built PDF/X file to a greyscale raw buffer. */
async function rasterPage(file: string, pageNumber: number, dpi = 300): Promise<{ width: number; height: number; data: Buffer }> {
    requireHeavyWrapper();
    const prefix = path.join(temporaryFolder(), `raster-p${pageNumber}-${dpi}`);
    execFileSync('pdftoppm', ['-f', String(pageNumber), '-l', String(pageNumber), '-singlefile',
        '-r', String(dpi), '-png', file, prefix], { encoding: 'utf8', timeout: 60000 });
    const { default: sharp } = await import('sharp');
    const raster = await sharp(`${prefix}.png`).greyscale().raw().toBuffer({ resolveWithObject: true });
    expect(raster.info.channels, 'The raster must be one greyscale channel.').toBe(1);
    return { width: raster.info.width, height: raster.info.height, data: raster.data };
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Contiguous row bands that hold ink (value below 250). */
function inkBands(data: Buffer, width: number, height: number): { top: number; bottom: number }[] {
    const rows = new Uint8Array(height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) if (data[y * width + x] < 250) { rows[y] = 1; break; }
    }
    const bands: { top: number; bottom: number }[] = [];
    let start = -1;
    for (let y = 0; y <= height; y++) {
        const on = y < height && rows[y] === 1;
        if (on && start < 0) start = y;
        if (!on && start >= 0) { bands.push({ top: start, bottom: y - 1 }); start = -1; }
    }
    return bands;
}

/** The median ink tone (0 = black, 255 = white) inside one row band. */
function bandInkMedian(data: Buffer, width: number, band: { top: number; bottom: number }): number {
    const values: number[] = [];
    for (let y = band.top; y <= band.bottom; y++) for (let x = 0; x < width; x++) {
        const v = data[y * width + x];
        if (v < 250) values.push(v);
    }
    return median(values);
}

/** Counts small, near-black, solid disks (a start dot is one such disk). */
function solidBlackDots(data: Buffer, width: number, height: number): number {
    let dots = 0;
    const seen = new Uint8Array(width * height);
    for (let start = 0; start < width * height; start++) {
        if (seen[start] || data[start] >= 25) continue;
        const queue = [start]; seen[start] = 1;
        let minX = width, maxX = -1, minY = height, maxY = -1, area = 0;
        for (let i = 0; i < queue.length; i++) {
            const p = queue[i], x = p % width, y = Math.floor(p / width);
            area++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            if (x > 0 && !seen[p - 1] && data[p - 1] < 25) { seen[p - 1] = 1; queue.push(p - 1); }
            if (x + 1 < width && !seen[p + 1] && data[p + 1] < 25) { seen[p + 1] = 1; queue.push(p + 1); }
            if (y > 0 && !seen[p - width] && data[p - width] < 25) { seen[p - width] = 1; queue.push(p - width); }
            if (y + 1 < height && !seen[p + width] && data[p + width] < 25) { seen[p + width] = 1; queue.push(p + width); }
        }
        const w = maxX - minX + 1, h = maxY - minY + 1;
        const fill = area / (w * h);
        if (w >= 6 && w <= 60 && h >= 6 && h <= 60 && area >= 24 && fill >= 0.55 && w <= h * 2 && h <= w * 2) dots++;
    }
    return dots;
}

// ---- Phase 2 Red 2d helpers (Check finding D5, 2026-10-27) ----

/** K 20% is 204. K 40% is 153. Black guide ink is below this value. */
const GUIDE_GRAY_LO = 153;
const GUIDE_GRAY_HI = 204;

/** The horizontal extent of the reader-leaf fold line (at 148.5 mm, the middle of the leaf), in millimeters from the page left edge. */
function foldLineExtent(data: Buffer, width: number): { minMm: number; maxMm: number } {
    const top = Math.round(146 * MM_PX_300), bottom = Math.round(151 * MM_PX_300);
    let bestRow = -1, bestCount = -1;
    for (let y = top; y <= bottom; y++) {
        let count = 0;
        for (let x = 0; x < width; x++) if (data[y * width + x] < 128) count++;
        if (count > bestCount) { bestCount = count; bestRow = y; }
    }
    let minX = width, maxX = -1;
    for (let y = bestRow - 2; y <= bestRow + 2; y++) {
        for (let x = 0; x < width; x++) if (data[y * width + x] < 128) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    }
    return { minMm: minX / MM_PX_300, maxMm: maxX / MM_PX_300 };
}

afterEach(() => {
    const cachedFolders = new Set(Array.from(builtPdfx.values(), (file) => path.dirname(file)));
    for (const folder of temporaryFolders.splice(0)) {
        if (!cachedFolders.has(folder)) fs.rmSync(folder, { recursive: true, force: true });
    }
});

afterAll(() => {
    for (const file of builtPdfx.values()) fs.rmSync(path.dirname(file), { recursive: true, force: true });
    builtPdfx.clear();
});

describe('Storytime student workbook: the shipped week 1', () => {
    it('R22: prints the page order and a left-page spread', async () => {
        const { doc } = await render();
        const sides = pages(doc);
        const kinds = sides.map((side) => side.getAttribute('data-page-kind'));
        // Blank padding is allowed only to align the spread or a tear-out leaf.
        expect(kinds.filter((kind) => kind !== 'blank')).toEqual([
            'name', 'book-map', 'practice', 'writing', 'check', 'home-front', 'home-back',
            ...Array(12).fill('reader'),
        ]);
        expect(sides.map((side) => Number(side.getAttribute('data-page-number'))))
            .toEqual(sides.map((_side, index) => index + 1));
        assertLeftSpread(doc);
        assertHomeLeaf(doc);
        expect(text(page(doc, 'name'))).toContain('This book belongs to');
    });

    it('R22: prints the week 1 student book as 20 A4 sides: 7 inside pages, 1 aligner, and 12 reader sides (spec FR-3)', async () => {
        const { doc } = await render();
        const kinds = pages(doc).map((side) => side.getAttribute('data-page-kind'));
        expect(kinds.filter((kind) => kind === 'reader'), '6 reader leaves of 2 sides each').toHaveLength(12);
        expect(kinds.filter((kind) => kind === 'blank'), 'one aligner side, as before').toHaveLength(1);
        expect(kinds, 'spec FR-3: 7 + 1 + 12 sides').toHaveLength(20);
        expect(kinds.length % 2, 'whole duplex sheets').toBe(0);
    });

    it('R22: uses the P11 default title and the eight book-map places', async () => {
        const { doc } = await render();
        expect(text(part(page(doc, 'name'), 'title'))).toBe('Storytime Advantage, Level 2, Unit 1 Student Book');
        expect(Array.from(page(doc, 'book-map').querySelectorAll('[data-sticker]'),
            (place) => place.getAttribute('data-sticker'))).toEqual([
            'decodable-1', 'decodable-2', 'decodable-3', 'decodable-4',
            'decodable-5', 'decodable-6', 'decodable-7', 'unit-1',
        ]);
    });

    it('R23: draws n with the top start dot, arrows, three trace copies, and one write space', async () => {
        const week = shipped();
        const { doc } = await render(week);
        const box = part(page(doc, 'practice'), 'letter-box');
        expect(text(part(box, 'letter'))).toBe('n');
        expect(texts(box, '[data-part="trace-letter"]')).toEqual(['n', 'n', 'n']);
        expect(text(part(box, 'write-letter'))).toBe('');
        const dot = part(box, 'start-dot');
        expect(dot.tagName.toLowerCase()).toBe('circle');
        expect(Number(dot.getAttribute('r'))).toBeGreaterThan(0);
        expect(dot.getAttribute('data-start-point')).toBe('dot');
        const arrows = box.querySelectorAll('svg [marker-end], svg [data-part="formation-arrow"]');
        expect(arrows.length).toBeGreaterThan(0);
        expect(text(part(box, 'formation-words'))).toBe(week.print!.letterBox.formationWords);
    });

    it('R24: prints the two practice lines and their picture ids in data order', async () => {
        const { doc } = await render();
        const sheet = part(page(doc, 'practice'), 'practice-sheet');
        // A-48 (E17, E18): the line "and" moved to the tricky-word row, and line 2 shows the nest and the net.
        expect(texts(sheet, '[data-part="practice-text"]')).toEqual(['n n n', 'A nest. A net.']);
        expect(Array.from(sheet.querySelectorAll('[data-picture-id]'), (image) => image.getAttribute('data-picture-id')))
            .toEqual(['l2-w01-practice-line-nose', 'l2-w01-practice-line-nest', 'l2-w01-check-row-net']);
        expect(texts(sheet, '[data-part="practice-text"]')).toEqual(shipped().print!.practice.map((line) => line.text));
    });

    it('R25: prints the dictation, Hello, I am, the name line, and the picture box', async () => {
        const { doc } = await render();
        const right = page(doc, 'writing');
        const dictation = part(right, 'dictation');
        // D3 (Check 2026-10-27): the dictation letter lines are empty write-in lines; the children write "n".
        expect(texts(dictation, '[data-part="dictation-letter"]')).toEqual(['', '', '']);
        // A-48 (E15, C3 row 2): the word "a" has a letter that week 1 does not teach, so row 2 is a trace row
        // (the word in grey with a start dot) and week 1 has no sound box.
        expect(dictation.querySelectorAll('[data-part="dictation-word"]')).toHaveLength(0);
        expect(dictation.querySelectorAll('[data-part="sound-box"]')).toHaveLength(0);
        expect(text(part(dictation, 'dictation-word-trace'))).toBe('a');
        expect(text(part(right, 'writing-trace'))).toBe('Hello, I am');
        expect(text(part(right, 'name-line'))).toBe('');
        expect(part(right, 'name-line').getAttribute('data-line')).toBe('name');
        expect(part(right, 'writing-picture-box')).toBeDefined();
    });

    it('R26: prints three unmarked check rows, nine picture ids, and one empty write-letter box', async () => {
        const { doc } = await render();
        const check = page(doc, 'check');
        const rows = Array.from(check.querySelectorAll('[data-part="check-row"]'));
        expect(rows).toHaveLength(3);
        expect(rows.map((row) => Array.from(row.querySelectorAll('[data-picture-id]'), (image) => image.getAttribute('data-picture-id'))))
            .toEqual([pictureIds.slice(0, 3), pictureIds.slice(3, 6), pictureIds.slice(6, 9)]);
        expect(text(part(check, 'check-write-letter'))).toBe('');
        assertUnmarkedCheck(doc);
    });

    it('R27: prints the Thai home front, the sound, net nut nose, the frame, and the activity', async () => {
        const week = shipped();
        const { doc } = await render(week);
        assertHomeLeaf(doc);
        const front = page(doc, 'home-front');
        expect(text(part(front, 'home-line'))).toBe(week.home!.line.th);
        expect(text(part(front, 'home-sound'))).toBe('/n/');
        expect(texts(front, '[data-part="home-word"]')).toEqual(['net', 'nut', 'nose']);
        expect(text(part(front, 'home-frame'))).toBe('Hello, I am ___.');
        expect(text(part(front, 'home-activity'))).toBe(week.home!.activity.th);
        expect(text(part(front, 'home-frame'))).toBe(week.focus.frame);
    });

    it('R27: gives the two real QR generators the S23 song and read-along inputs (P4)', async () => {
        const week = shipped();
        const { doc } = await render(week);
        const codes = Array.from(page(doc, 'home-front').querySelectorAll('[data-qr-input]'));
        expect(STORYTIME_QR_HOST).toBe('https://storytime.reading-advantage.com');
        expect(codes.map((code) => code.getAttribute('data-qr-input'))).toEqual([
            storytimeQrUrl(week.home!.songUrl!), storytimeQrUrl(week.home!.readAlongUrl!),
        ]);
        expect(codes.map((code) => code.getAttribute('data-qr-input'))).toEqual([
            'https://storytime.reading-advantage.com/th/st/2/1?part=song',
            'https://storytime.reading-advantage.com/th/st/2/1?part=book',
        ]);
        // Compare the printed module matrix, not only an address label next to an unrelated code.
        const { default: qrcode } = await import('qrcode-generator');
        const { default: sharp } = await import('sharp');
        for (const code of codes) {
            const qr = qrcode(0, 'M');
            qr.addData(code.getAttribute('data-qr-input')!);
            qr.make();
            const svg = code.querySelector('svg')?.cloneNode(true) as Element | undefined;
            expect(svg, 'Each QR input must produce a printed SVG code.').toBeDefined();
            const size = qr.getModuleCount() + 8; // The existing QR helper uses a four-module quiet zone.
            svg!.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg!.setAttribute('width', String(size));
            svg!.setAttribute('height', String(size));
            const raster = await sharp(Buffer.from(svg!.outerHTML)).flatten({ background: '#ffffff' })
                .greyscale().threshold(128).raw().toBuffer();
            const expected = Array.from({ length: size * size }, (_value, index) => {
                const row = Math.floor(index / size) - 4;
                const col = index % size - 4;
                return row >= 0 && col >= 0 && row < size - 8 && col < size - 8 && qr.isDark(row, col) ? 0 : 255;
            });
            expect(Array.from(raster)).toEqual(expected);
        }
        expect(text(page(doc, 'home-front'))).toContain('QR target answers after the deploy (monorepo task 7.4)');
    });

    it('R27: prints the English home back and all 15 sung lines, not the lyric sheet', async () => {
        const week = shipped();
        const { doc } = await render(week);
        const back = page(doc, 'home-back');
        expect(text(part(back, 'home-line'))).toBe(week.home!.line.en);
        expect(text(part(back, 'home-activity'))).toBe(week.home!.activity.en);
        expect(texts(back, '[data-part="home-word"]')).toEqual(['net', 'nut', 'nose']);
        expect(text(part(back, 'home-frame'))).toBe(week.focus.frame);
        expect(texts(back, '[data-part="song-line"]')).toHaveLength(15);
        expect(texts(back, '[data-part="song-line"]')).toEqual(week.song!.lines.map((line) => line.text));
        assertHomeLeaf(doc);
    });

    it('R35: keeps the QR deploy mark in proof mode and excludes it from final mode', async () => {
        const week = shipped();
        const mark = 'QR target answers after the deploy (monorepo task 7.4)';
        const proof = await render(week);
        expect(text(page(proof.doc, 'home-front'))).toContain(mark);
        // Red 4g fixture change: final mode reads the picture folder through its manifest.json.
        // Isolate mode behavior from Forge file availability with a temporary repository whose
        // folder holds the manifest and the files of every row. This test builds no final PDF.
        const { repo, pictures } = finalRepo();
        writePictureFolder(pictures, jobsFor(await weekRowIds(week)));
        const final = await renderFinalIn(repo, week);
        assertHomeLeaf(final.doc);
        expect(final.doc.querySelectorAll('[data-picture-id] img').length).toBeGreaterThanOrEqual(12);
        expect(final.html).not.toContain(mark);
        expect(text(final.doc.body)).not.toContain(mark);
    });

    it('R28: excludes the four forbidden labels and every CJK character from the HTML', async () => {
        const { html } = await render();
        expect(html).not.toMatch(/CEFR|Pre[-‑–\s]?A1|Starters|Reading\s+A[-‑–]Z/i);
        expect(html).not.toMatch(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u);
    });

    it('R28: keeps Thai only on the home card, the week header, and the icon key, and keeps each Thai run unbroken', async () => {
        const { doc } = await render();
        for (const side of pages(doc).filter((side) => !side.getAttribute('data-page-kind')!.startsWith('home-'))) {
            // Fix 6 (Daniel 2026-11-04): a reader leaf side carries 2 short Thai and English marks, "พับ / fold" and "ตัดออกจากเล่ม / cut out of the book".
            const copy = side.cloneNode(true) as Element;
            copy.querySelectorAll('[data-part="tear-label"], [data-part="fold-label"]').forEach((mark) => mark.remove());
            // A-48: the week header of a sound, write, or check page and the icon key of page 1 are Thai on purpose.
            copy.querySelectorAll('[data-part="week-label"], [data-part="icon-key"]').forEach((mark) => mark.remove());
            expect(text(copy)).not.toMatch(/\p{Script=Thai}/u);
        }
        const thai = Array.from(page(doc, 'home-front').querySelectorAll('[lang="th"]'));
        expect(thai.length).toBeGreaterThan(0);
        expect(doc.querySelector('style')?.textContent ?? '').toMatch(/white-space:\s*nowrap/);
        expect(thai.map(text).join(' ')).toContain(shipped().home!.line.th.split(' ')[0]);
    });

    it('R28: selects the line-art file for every picture, including a proof placeholder', async () => {
        const week = shipped();
        const { doc } = await render(week);
        const { storytimePrintPictures } = await import('../lib/storytime/print/pictures');
        const rows = storytimePrintPictures([week]);
        const pictures = Array.from(doc.querySelectorAll('[data-picture-id]'));
        expect(pictures.length).toBeGreaterThanOrEqual(12);
        for (const picture of pictures) {
            const row = rows.find((item) => item.id === picture.getAttribute('data-picture-id'));
            expect(row, 'Every picture must use the committed picture contract.').toBeDefined();
            expect(picture.getAttribute('data-picture-file')).toBe(row!.lineArtFileName);
            const image = picture.matches('img') ? picture : picture.querySelector('img');
            if (image) {
                const source = image.getAttribute('src') ?? '';
                expect(decodeURIComponent(source).split('/').pop()).toBe(row!.lineArtFileName);
            }
        }
    });

    it('R29: loads only static Andika and Sarabun font faces with their OFL files', async () => {
        const { doc } = await render();
        const css = Array.from(doc.querySelectorAll('style'), (style) => style.textContent).join('\n');
        const faces = Array.from(css.matchAll(/@font-face\s*\{([^}]+)\}/g), (match) => match[1]);
        expect(faces.length).toBeGreaterThanOrEqual(2);
        const families: string[] = [];
        for (const face of faces) {
            const family = face.match(/font-family:\s*['"]?([^;'"}]+)/)?.[1].trim();
            expect(['Andika', 'Sarabun']).toContain(family);
            families.push(family!);
            expect(face).not.toMatch(/font-weight:\s*\d+\s+\d+|https?:|local\(/i);
            const url = face.match(/url\(['"]?([^)'"\s]+)['"]?\)/)?.[1];
            expect(url, 'Each face needs a local static font file.').toBeDefined();
            const file = url!.startsWith('data:') ? path.join(temporaryFolder(), 'font.woff2')
                : url!.startsWith('file:') ? fileURLToPath(url!) : path.resolve(dashboardRoot, url!);
            if (url!.startsWith('data:')) fs.writeFileSync(file, Buffer.from(url!.split(',')[1], 'base64'));
            expect(fs.existsSync(file), `Missing font: ${file}`).toBe(true);
            const metadata = execFileSync('fc-scan', ['--format', '%{family}|%{variable}', file], { encoding: 'utf8', timeout: 15000 });
            expect(metadata).toBe(`${family}|False`);
            expect(fs.readFileSync(path.join(fontDir, `OFL-${family!.toLowerCase()}.txt`), 'utf8'))
                .toMatch(/SIL OPEN FONT LICENSE Version 1\.1/i);
        }
        expect([...new Set(families)].sort()).toEqual(['Andika', 'Sarabun']);
        for (const match of css.matchAll(/font-family:\s*([^;}]+)/g)) {
            expect(match[1].replace(/['"]/g, '').split(',').map((name) => name.trim()))
                .toEqual(expect.arrayContaining([expect.stringMatching(/^(?:Andika|Sarabun)$/)]));
            expect(match[1]).not.toMatch(/Comic Sans|Arial|Chalkboard|Google/i);
        }
    }, 30000);

    it('R34: uses valid CSS format hints for every font face', async () => {
        const { doc } = await render();
        const css = Array.from(doc.querySelectorAll('style'), (style) => style.textContent).join('\n');
        const faces = Array.from(css.matchAll(/@font-face\s*\{([^}]+)\}/g), (match) => match[1]);
        expect(faces.length).toBeGreaterThanOrEqual(3);
        for (const face of faces) {
            const hints = Array.from(face.matchAll(/format\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g), (match) => match[2]);
            expect(hints.length, 'Each static face must declare its format.').toBeGreaterThan(0);
            for (const hint of hints) expect(['truetype', 'opentype', 'woff', 'woff2']).toContain(hint);
        }
    });

    it('R30: exports the P2 and P15 default profile in millimeters (reader page 198 x 148.5, spec FR-5.1)', async () => {
        expect(await profile()).toMatchObject({
            trim: { widthMm: 210, heightMm: 297 }, bleedMm: 0, perforationMm: 12,
            readerPage: READER_PAGE_MM,
        });
    });

    it.each([297, 285])('R30: renders the same week at 210 x %i mm from one profile constant', async (heightMm) => {
        const selected = savedCopy(await profile(), (copy) => { copy.trim.heightMm = heightMm; });
        const { doc } = await render(shipped(), selected);
        const css = Array.from(doc.querySelectorAll('style'), (style) => style.textContent).join('\n');
        const sizes = Array.from(css.matchAll(/@page[^{}]*\{[^}]*\bsize:\s*([^;}]+)/g), (match) => match[1].trim());
        expect(sizes.length).toBeGreaterThan(0);
        expect([...new Set(sizes)]).toEqual([`210mm ${heightMm}mm`]);
        assertLeftSpread(doc);
        assertHomeLeaf(doc);
    });

    it('R31: preserves the exact default Ghostscript arguments without the K-only option', async () => {
        const { ghostscriptArgs } = await import('../lib/print/pdfx');
        for (const outline of [false, true]) {
            expect(ghostscriptArgs({
                input: '/in/book.pdf', output: '/out/book-pdfx1a.pdf',
                definition: '/tmp/opencode/pdfx_def.ps', profile: '/cache/icc/JC.icc', outline,
            })).toEqual([
                '-dPDFX=1', '--permit-file-read=/cache/icc/', '-sDEVICE=pdfwrite',
                '-sColorConversionStrategy=CMYK', '-sProcessColorModel=DeviceCMYK',
                '-sOutputICCProfile=/cache/icc/JC.icc', '-dPDFSETTINGS=/prepress',
                ...(outline ? ['-dNoOutputFonts'] : []),
                '-o', '/out/book-pdfx1a.pdf', '/tmp/opencode/pdfx_def.ps', '/in/book.pdf',
            ]);
        }
    });

    it('R31: uses the exported K-only flags in the production student-book conversion call', async () => {
        const scriptFile = path.join(dashboardRoot, 'scripts/storytime/make-student-book-pdf.ts');
        expect(fs.existsSync(scriptFile), 'Missing script: scripts/storytime/make-student-book-pdf.ts').toBe(true);
        // Read the wiring without running the CLI, Chrome, or Ghostscript.
        const ts = await import('typescript');
        const source = ts.createSourceFile(scriptFile, fs.readFileSync(scriptFile, 'utf8'), ts.ScriptTarget.Latest, true);
        const flagName = 'STORYTIME_STUDENT_PDFX_FLAGS';
        const statement = source.statements.find((node) => ts.isVariableStatement(node)
            && node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
            && node.declarationList.declarations.some((declaration) => declaration.name.getText(source) === flagName));
        const declaration = statement && ts.isVariableStatement(statement)
            ? statement.declarationList.declarations.find((node) => node.name.getText(source) === flagName) : undefined;
        const value = declaration?.initializer;
        const array = value && ts.isAsExpression(value) ? value.expression : value;
        expect(array && ts.isArrayLiteralExpression(array), `Export ${flagName} as a literal flag list.`).toBe(true);
        if (!array || !ts.isArrayLiteralExpression(array)) throw new Error(`Missing ${flagName} flag list.`);
        expect(array.elements.map((node) => ts.isStringLiteral(node) ? node.text : node.getText(source)))
            .toEqual(['--keep-fonts', '--k-only']);
        let wired = false;
        const visit = (node: import('typescript').Node): void => {
            if (ts.isCallExpression(node) && node.arguments.some((arg) => ts.isArrayLiteralExpression(arg)
                && arg.elements.some((item) => ts.isStringLiteral(item) && item.text === 'scripts/print/make-pdfx.ts')
                && arg.elements.some((item) => ts.isSpreadElement(item) && ts.isIdentifier(item.expression)
                    && item.expression.text === flagName))) wired = true;
            ts.forEachChild(node, visit);
        };
        visit(source);
        expect(wired, `The make-pdfx call must spread ${flagName}.`).toBe(true);
    });

    it('R31: gives every PDF/X inside page zero CMY coverage and preserves the physical page count', async () => {
        const { html, doc } = await render();
        const file = buildPdfx(html);
        const output = execFileSync('gs', ['-q', '-o', '-', '-sDEVICE=inkcov', file], { encoding: 'utf8', timeout: 20000 });
        const rows = inkRows(output);
        expect(rows).toHaveLength(pages(doc).length);
        for (const row of rows) expect(row.slice(0, 3)).toEqual(['0.00000', '0.00000', '0.00000']);
        expect(rows.some((row) => Number(row[3]) > 0), 'A blank PDF is not a K-only workbook.').toBe(true);
        const info = execFileSync('pdfinfo', ['-custom', file], { encoding: 'utf8', timeout: 5000 });
        expect(info).toMatch(/GTS_PDFXVersion:\s+PDF\/X-1/);
    }, 230000);

    it('R34: embeds only Andika regular, Andika bold, and Sarabun in the built PDF/X', async () => {
        const { html } = await render();
        const file = buildPdfx(html);
        const output = execFileSync('pdffonts', [file], { encoding: 'utf8', timeout: 5000 });
        console.info(`R34 pdffonts:\n${output}`);
        const rows = output.trim().split('\n').slice(2).map((line) => line.trim().split(/\s+/));
        const names = rows.map((row) => row[0].replace(/^[A-Z]{6}\+/, ''));
        expect([...new Set(names)].sort(), 'The PDF must contain the three required faces and no fallback family.')
            .toEqual(['Andika', 'Andika-Bold', 'Sarabun-Regular']);
        for (const row of rows) expect(row.at(-5), `The font ${row[0]} must be embedded.`).toBe('yes');
    }, 230000);

    it('R43: rejects unsafe QR paths and keeps the shipped inputs on the checked URL contract', async () => {
        for (const [field, value] of [['songUrl', '@example.invalid/th/st/2/1'], ['readAlongUrl', '/etc/passwd']] as const) {
            const broken = savedCopy(shipped(), (copy) => { copy.home![field] = value; });
            await expect(render(broken)).rejects.toThrow(value);
        }
        const week = shipped();
        const { doc } = await render(week);
        expect(Array.from(page(doc, 'home-front').querySelectorAll('[data-qr-input]'),
            (node) => node.getAttribute('data-qr-input'))).toEqual([
            storytimeQrUrl(week.home!.songUrl!), storytimeQrUrl(week.home!.readAlongUrl!),
        ]);
    });

    it('R44: final mode requires and selects line art, not the color file', async () => {
        const week = shipped();
        const { storytimePrintPictures } = await import('../lib/storytime/print/pictures');
        const rows = storytimePrintPictures([week]);
        // Red 4g fixture change: final mode reads the picture folder through its manifest.json.
        // The temporary folder holds the manifest and the color and line-art files of every row.
        // The second build removes every line-art file and keeps the color files.
        const { repo, pictures } = finalRepo();
        writePictureFolder(pictures, jobsFor(rows.map((row) => row.id)));
        const { doc } = await renderFinalIn(repo, week);
        for (const picture of Array.from(doc.querySelectorAll('[data-picture-id] img'))) {
            const row = rows.find((item) => item.id === picture.parentElement?.getAttribute('data-picture-id'));
            expect(row).toBeDefined();
            expect(decodeURIComponent(picture.getAttribute('src') ?? '').split('/').pop()).toBe(row!.lineArtFileName);
        }
        for (const row of rows) fs.rmSync(path.join(pictures, row.lineArtFileName));
        expect(fs.existsSync(path.join(pictures, rows[0].fileName)), 'the color file of the first row stays').toBe(true);
        await expect(renderFinalIn(repo, week)).rejects.toThrow(rows[0].id);
    });

    it('R45: validates student-book CLI ranges and every requested week without rendering', async () => {
        const modulePath = path.join(dashboardRoot, 'lib/storytime/print/student-book-cli.ts');
        expect(fs.existsSync(modulePath), 'Add pure CLI contract module lib/storytime/print/student-book-cli.ts.').toBe(true);
        if (!fs.existsSync(modulePath)) return;
        const mod = await import(modulePath) as Record<string, unknown>;
        expect(typeof mod.parseStorytimeStudentBookArgs, 'Export parseStorytimeStudentBookArgs(argv, home, unit).').toBe('function');
        expect(typeof mod.checkRequestedWeeks, 'Export checkRequestedWeeks(requested, loaded).').toBe('function');
        if (typeof mod.parseStorytimeStudentBookArgs !== 'function' || typeof mod.checkRequestedWeeks !== 'function') return;
        const parseArgs = mod.parseStorytimeStudentBookArgs as (argv: string[], home: string, unit: number) => { outputPath: string };
        for (const args of [
            ['--level', '9'], ['--level', '2', '--weeks', '1.5'], ['--level', '2', '--weeks', '0'],
            ['--level', '2', '--weeks', '1', '--version', '1.5'], ['--level', '2', '--weeks', '1', '--version', 'Infinity'],
            ['--level', '2', '--weeks', '1', '--version', '0'],
        ]) expect(() => parseArgs(args, '/home/student', 1)).toThrow();
        expect(parseArgs(['--level', '2', '--weeks', '1', '--proof', '--version', '5'], '/home/student', 1).outputPath)
            .toBe('/home/student/Desktop/print-ready/storytime/Storytime-Advantage-L2-U1-Student-Book-v5_PDFX-1a.pdf');
        expect(() => (mod.checkRequestedWeeks as (requested: number[], loaded: number[]) => void)([1, 32], [1]))
            .toThrow(/week 32/i);
    });

    it('R46: limits an explicit output path to the print-ready Storytime folder', async () => {
        const modulePath = path.join(dashboardRoot, 'lib/storytime/print/student-book-cli.ts');
        expect(fs.existsSync(modulePath), 'Add pure CLI contract module lib/storytime/print/student-book-cli.ts.').toBe(true);
        if (!fs.existsSync(modulePath)) return;
        const mod = await import(modulePath) as Record<string, unknown>;
        expect(typeof mod.parseStorytimeStudentBookArgs, 'Export parseStorytimeStudentBookArgs(argv, home, unit).').toBe('function');
        if (typeof mod.parseStorytimeStudentBookArgs !== 'function') return;
        const parseArgs = mod.parseStorytimeStudentBookArgs as (argv: string[], home: string, unit: number) => unknown;
        for (const output of ['/tmp/x.pdf', '~/Desktop/print-ready/storytime/../x.pdf']) {
            expect(() => parseArgs(['--level', '2', '--weeks', '1', '--out', output], '/home/student', 1)).toThrow();
        }
        expect(() => parseArgs(['--level', '2', '--weeks', '1', '--out', '/home/student/Desktop/print-ready/storytime/x.pdf'], '/home/student', 1))
            .not.toThrow();
    });

    it('R47: requires an explicit output file strictly inside the print folder', async () => {
        const modulePath = path.join(dashboardRoot, 'lib/storytime/print/student-book-cli.ts');
        expect(fs.existsSync(modulePath), 'The pure student-book CLI module must exist.').toBe(true);
        if (!fs.existsSync(modulePath)) return;
        const mod = await import(modulePath) as Record<string, unknown>;
        expect(typeof mod.parseStorytimeStudentBookArgs, 'Export parseStorytimeStudentBookArgs(argv, home, unit).').toBe('function');
        if (typeof mod.parseStorytimeStudentBookArgs !== 'function') return;
        const parseArgs = mod.parseStorytimeStudentBookArgs as (argv: string[], home: string, unit: number) => unknown;
        const home = path.join('/tmp/opencode', 'r47-parser-home');
        const folder = path.join(home, 'Desktop', 'print-ready', 'storytime');
        for (const output of [folder, `${folder}${path.sep}`, path.join(folder, 'x.txt')]) {
            expect(() => parseArgs(['--level', '2', '--weeks', '1', '--out', output], home, 1),
                `Reject non-PDF output target ${output}.`).toThrow();
        }
        expect(() => parseArgs(['--level', '2', '--weeks', '1', '--out', path.join(folder, 'x.pdf')], home, 1),
            'Accept a PDF file strictly inside the print folder.').not.toThrow();
    });

    it('R47: rejects output paths that filesystem links redirect outside the print folder', async () => {
        const modulePath = path.join(dashboardRoot, 'lib/storytime/print/student-book-cli.ts');
        expect(fs.existsSync(modulePath), 'The pure student-book CLI module must exist.').toBe(true);
        if (!fs.existsSync(modulePath)) return;
        const mod = await import(modulePath) as Record<string, unknown>;
        expect(typeof mod.checkStorytimeOutputContainment,
            'Export checkStorytimeOutputContainment(outputPath, home).').toBe('function');
        if (typeof mod.checkStorytimeOutputContainment !== 'function') return;
        const check = mod.checkStorytimeOutputContainment as (outputPath: string, home: string) => void;
        const root = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-r47-'));
        try {
            const home = path.join(root, 'home');
            const outside = path.join(root, 'outside');
            const folder = path.join(home, 'Desktop', 'print-ready', 'storytime');
            fs.mkdirSync(folder, { recursive: true });
            fs.mkdirSync(outside, { recursive: true });
            fs.writeFileSync(path.join(outside, 'existing.pdf'), 'outside');
            fs.symlinkSync(outside, path.join(folder, 'link'), 'dir');
            fs.symlinkSync(path.join(outside, 'existing.pdf'), path.join(folder, 'out.pdf'), 'file');
            fs.symlinkSync(path.join(outside, 'not-created.pdf'), path.join(folder, 'dangling.pdf'), 'file');
            fs.symlinkSync(path.join(outside, 'not-created-folder'), path.join(folder, 'dangling'), 'dir');

            expect(() => check(path.join(folder, 'link', 'x.pdf'), home), 'Reject an output below an outside-pointing folder link.')
                .toThrow();
            expect(() => check(path.join(folder, 'out.pdf'), home), 'Reject an existing output link to an outside file.')
                .toThrow();
            expect.soft(() => check(path.join(folder, 'dangling.pdf'), home), 'Reject an output link to a missing outside file.')
                .toThrow();
            expect.soft(() => check(path.join(folder, 'dangling', 'x.pdf'), home), 'Reject an output below a missing outside folder link.')
                .toThrow();
            expect(() => check(path.join(folder, 'x.pdf'), home), 'Accept a plain PDF output inside the real folder.')
                .not.toThrow();

            const newHome = path.join(root, 'new-home');
            fs.mkdirSync(path.join(newHome, 'Desktop', 'print-ready'), { recursive: true });
            expect(() => check(path.join(newHome, 'Desktop', 'print-ready', 'storytime', 'nested', 'x.pdf'), newHome),
                'Accept an inside output when the Storytime folder does not exist yet.').not.toThrow();
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it.each(QR_REJECT_PATHS)('R48: rejects the QR page path %j', (input) => {
        let thrown: unknown;
        try {
            storytimeQrUrl(input);
        } catch (error) {
            thrown = error;
        }
        expect(thrown, `Reject the QR page path ${JSON.stringify(input)}.`).toBeInstanceOf(Error);
        if (!(thrown instanceof Error)) return;
        expect(namesPath(thrown.message, input),
            `The error must name the path ${JSON.stringify(input)}. Message: ${thrown.message}`).toBe(true);
    });

    it('R48: accepts the canonical Storytime QR page paths and keeps the host', () => {
        for (const input of QR_ACCEPT_PATHS) {
            expect(storytimeQrUrl(input), `Accept the QR page path ${JSON.stringify(input)}.`)
                .toBe(STORYTIME_QR_HOST + input);
        }
        // The route prefix is lower case. This case already holds at HEAD.
        expect(() => storytimeQrUrl('/TH/st/2/1'), 'Reject an upper-case route prefix.').toThrow();
    });

    it('R48: accepts the shipped song and read-along page paths of every level 2 week', () => {
        const folder = path.join(STORYTIME_ROOT, 'l2');
        const files = fs.readdirSync(folder).filter((name) => /^w\d{2}\.json$/.test(name)).sort();
        expect(files.length, 'The level 2 week files must load.').toBeGreaterThan(0);
        for (const name of files) {
            const week = StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8')));
            for (const field of ['songUrl', 'readAlongUrl'] as const) {
                const value: string | undefined = week.home?.[field];
                expect(value, `Week ${name} must carry home.${field}.`).toBeTypeOf('string');
                const pagePath = value ?? '';
                expect(storytimeQrUrl(pagePath), `Week ${name} home.${field} must be a canonical QR page path.`)
                    .toBe(STORYTIME_QR_HOST + pagePath);
            }
        }
    });

    it('R36: matches both printed PDF/X QR matrices to their labeled song and book addresses', async () => {
        const week = shipped();
        const { html, doc } = await render(week);
        const file = buildPdfx(html);
        const homePage = String(pages(doc).indexOf(page(doc, 'home-front')) + 1);
        const prefix = path.join(temporaryFolder(), 'home-front');
        requireHeavyWrapper();
        execFileSync('pdftoppm', ['-f', homePage, '-l', homePage, '-singlefile', '-r', '300', '-png', file, prefix],
            { encoding: 'utf8', timeout: 20000 });
        const { default: sharp } = await import('sharp');
        const raster = await sharp(`${prefix}.png`).greyscale().raw().toBuffer({ resolveWithObject: true });
        expect(raster.info.channels).toBe(1);
        const { default: qrcode } = await import('qrcode-generator');
        const expected = [week.home!.songUrl!, week.home!.readAlongUrl!].map((url) => {
            const qr = qrcode(0, 'M');
            qr.addData(storytimeQrUrl(url));
            qr.make();
            return Array.from({ length: qr.getModuleCount() }, (_, row) =>
                Array.from({ length: qr.getModuleCount() }, (_, col) => qr.isDark(row, col)));
        });
        const codes = printedQrs(raster.data, raster.info.width, raster.info.height, [...new Set(expected.map((matrix) => matrix.length))]);
        expect(codes, 'The raster must contain two complete QR codes.').toHaveLength(2);
        const bbox = execFileSync('pdftotext', ['-f', homePage, '-l', homePage, '-bbox', file, '-'],
            { encoding: 'utf8', timeout: 5000 });
        const words = Array.from(new DOMParser().parseFromString(bbox, 'text/xml').querySelectorAll('word'));
        const printed = ['The song of the week', 'The book of the week'].map((label) => {
            const tokens = label.split(' ');
            const starts = words.map((_word, index) => index).filter((index) =>
                tokens.every((token, offset) => words[index + offset]?.textContent === token));
            expect(starts, `The PDF must contain one label: ${label}`).toHaveLength(1);
            const first = words[starts[0]], last = words[starts[0] + tokens.length - 1];
            const centerX = (Number(first.getAttribute('xMin')) + Number(last.getAttribute('xMax'))) / 2 * 300 / 72;
            const top = Number(first.getAttribute('yMin')) * 300 / 72;
            const above = codes.filter((code) => centerX >= code.left && centerX <= code.right
                && top > code.bottom && top - code.bottom < 12 * 300 / 25.4);
            expect(above, `Find the printed code above ${label}.`).toHaveLength(1);
            return above[0];
        });
        expect(printed[0]).not.toBe(printed[1]);
        const assertMatrices = (copy: PrintedQr[]): void => { expect(copy.map((code) => code.modules)).toEqual(expected); };
        assertMatrices(printed);
        const swapped = savedCopy(printed, (copy) => {
            [copy[0].modules, copy[1].modules] = [copy[1].modules, copy[0].modules];
        });
        expect(() => assertMatrices(swapped), 'Swapped printed addresses must fail the same matrix check.').toThrow();
    }, 250000);

    it('R31: detects CMY on a temporary PDF/X copy with an explicit cyan patch', async () => {
        const { html } = await render();
        const file = buildPdfx(html);
        const outputFile = path.join(temporaryFolder(), 'cyan-mutant.pdf');
        // Mutate the generated artifact, not a production file. PDF/X uses DeviceCMYK here.
        requireHeavyWrapper();
        execFileSync('gs', ['-q', '-dBATCH', '-dNOPAUSE', '-sDEVICE=pdfwrite', `-sOutputFile=${outputFile}`,
            '-c', '<</EndPage { 2 eq { pop false } { pop gsave 1 0 0 0 setcmykcolor 20 20 100 100 rectfill grestore true } ifelse }>> setpagedevice',
            '-f', file], { encoding: 'utf8', timeout: 20000 });
        const output = execFileSync('gs', ['-q', '-o', '-', '-sDEVICE=inkcov', outputFile], { encoding: 'utf8', timeout: 20000 });
        const rows = inkRows(output);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.some((row) => Number(row[0]) > 0)).toBe(true);
    }, 250000);

    it('R32: puts each reader and home perforation 12 mm from the parity-dependent spine (P2 default)', async () => {
        const { doc } = await render();
        const sides = pages(doc);
        const tearOut = sides.filter((side) => ['reader', 'home-front', 'home-back'].includes(side.getAttribute('data-page-kind')!));
        expect(tearOut, 'spec FR-3: 12 reader sides (6 leaves) and the 2 home card sides').toHaveLength(14);
        for (const side of tearOut) {
            const mark = part(side, 'perforation');
            const number = sides.indexOf(side) + 1;
            const edge = number % 2 ? 'left' : 'right';
            expect(mark.getAttribute('data-spine-edge')).toBe(edge);
            expect(mark.getAttribute('style')?.replace(/\s+/g, '')).toContain(`${edge}:12mm`);
            expect(mark.getAttribute('style')?.replace(/\s+/g, '')).not.toContain(`${edge === 'left' ? 'right' : 'left'}:12mm`);
        }
    });

    it('R32: registers the 12 reader sides as 6 duplex leaves of 2 landscape 198 x 148.5 mm pages each, in the spec imposition (spec FR-3, FR-5.1)', async () => {
        const week = shipped();
        const selected = await profile();
        const { doc } = await render(week, selected);
        // spec FR-5.1 (2026-11-04): leaf 1 front 1|12, back 2|11; leaf 2 front 3|10, back 4|9; leaf 3 front 5|8, back 6|7; the same for the second reader.
        // The back side keeps the top and the bottom of its front (the fold line is horizontal and the leaf turns on its vertical spine edge).
        expect(studentReaderProblems(pages(doc), week.books)).toEqual([]);
        // spec FR-5.1 and P15: two page heights fill the 297 mm leaf height, one page width fills the 198 mm torn leaf.
        expect(2 * selected.readerPage.heightMm).toBe(selected.trim.heightMm);
        expect(selected.readerPage.widthMm).toBe(198);
        expect(selected.trim.widthMm - selected.perforationMm).toBe(198);
    });

    it('R32: prints 6 reader leaves for each teaching week, 3 for each reader, each with a front and a back, each side perforated 12 mm from the spine (spec FR-3, P2 defaults)', async () => {
        const { doc } = await render();
        const readerSides = pages(doc).filter((side) => side.getAttribute('data-page-kind') === 'reader');
        const leaves = new Map<string, Element[]>();
        for (const side of readerSides) {
            const key = `${side.getAttribute('data-reader-title')}|${side.getAttribute('data-leaf-number')}`;
            leaves.set(key, [...(leaves.get(key) ?? []), side]);
        }
        expect([...leaves.keys()]).toEqual(['Hello!|1', 'Hello!|2', 'Hello!|3', 'Nan Can Nod|1', 'Nan Can Nod|2', 'Nan Can Nod|3']);
        for (const [key, sides] of leaves) {
            expect(sides, `${key}: a front and a back`).toHaveLength(2);
            const numbers = sides.map((side) => pages(doc).indexOf(side) + 1);
            expect(numbers[0] % 2, `${key}: the front is a right page`).toBe(1);
            expect(numbers[1], `${key}: the back follows the front`).toBe(numbers[0] + 1);
            for (const side of sides) {
                const mark = part(side, 'perforation');
                const edge = (pages(doc).indexOf(side) + 1) % 2 ? 'left' : 'right';
                expect(mark.getAttribute('data-spine-edge')).toBe(edge);
                expect(mark.getAttribute('style')?.replace(/\s+/g, '')).toContain(`${edge}:12mm`);
            }
        }
    });

    it('R32: prints a dashed fold line and a small leaf mark on each reader side, and no cut line or strip (spec FR-5.1)', async () => {
        const { doc } = await render();
        const readerSides = pages(doc).filter((side) => side.getAttribute('data-page-kind') === 'reader');
        expect(readerSides).toHaveLength(12);
        for (const side of readerSides) {
            expect(side.querySelectorAll('[data-part="fold-line"]'), 'one fold line').toHaveLength(1);
            expect(side.querySelectorAll('[data-part="leaf-mark"]'), 'one leaf mark').toHaveLength(1);
            expect(side.querySelectorAll('[data-part="cut-line"], .cut-line, [data-part="reader-strip"], .strip-mark'), 'no cut line and no strip').toHaveLength(0);
        }
        const css = Array.from(doc.querySelectorAll('style'), (style) => style.textContent ?? '').join('\n');
        expect(leafStyleProblems(css)).toEqual([]);
    });

    it('R32: each leaf mark of the student book lies inside a page margin, clear of the content, the fold line, and the perforation (spec FR-5.1)', async () => {
        const { html } = await render();
        const { chromium } = await import('@playwright/test');
        const browser = await chromium.launch({ channel: 'chrome' });
        try {
            const page = await browser.newPage();
            const file = path.join(temporaryFolder(), 'student.html');
            fs.writeFileSync(file, html);
            await page.goto(pathToFileURL(file).href);
            await page.evaluate(() => document.fonts.ready);
            expect(await page.evaluate(() => document.fonts.check('16px Andika')), 'the Andika print font loads in the browser').toBe(true);
            const sides = await page.evaluate(measureLeafSidesInBrowser, '.student-page[data-page-kind="reader"]');
            expect(sides).toHaveLength(12);
            expect(leafMarkProblems(sides)).toEqual([]);
        } finally {
            await browser.close();
        }
    }, 60_000);

    it('R32: fails on a wrong imposition, a missing fold line, a wrong mark, a front page not turned, a back page turned, the old 90 degree turn, a portrait page, and a 99 x 140 mm page (mutants on a copy; spec FR-5.1)', async () => {
        const week = shipped();
        const { html } = await render(week);
        const fresh = () => new DOMParser().parseFromString(html, 'text/html');
        const readerSidesOf = (doc: Document) => pages(doc).filter((side) => side.getAttribute('data-page-kind') === 'reader');
        // The unchanged copy is right; without this line a checker that always fails would pass the mutants.
        expect(studentReaderProblems(pages(fresh()), week.books)).toEqual([]);
        const mutants: Array<[string, string, (doc: Document) => void]> = [
            ['imposition 12|1 (v3) in place of 1|12', '[imposition]', (doc) => {
                const found = readerSidesOf(doc)[0].querySelectorAll('[data-reader-page]');
                found[0].setAttribute('data-page-number', '12');
                found[1].setAttribute('data-page-number', '1');
            }],
            ['imposition 10|3 (v3) in place of 3|10', '[imposition]', (doc) => {
                const found = readerSidesOf(doc)[2].querySelectorAll('[data-reader-page]');
                found[0].setAttribute('data-page-number', '10');
                found[1].setAttribute('data-page-number', '3');
            }],
            ['fold line removed', '[fold-line]', (doc) => readerSidesOf(doc)[3].querySelector('[data-part="fold-line"]')!.remove()],
            ['leaf mark removed', '[leaf-mark]', (doc) => readerSidesOf(doc)[0].querySelector('[data-part="leaf-mark"]')!.remove()],
            ['leaf mark with leaf 5', '[leaf-mark]', (doc) => { readerSidesOf(doc)[4].querySelector('[data-part="leaf-mark"]')!.textContent = 'Hello! · leaf 5'; }],
            ['a front page not turned', '[turn]', (doc) => readerSidesOf(doc)[0].querySelector('[data-reader-page]')!.setAttribute('data-turn-deg', '0')],
            ['a back page turned 180', '[turn]', (doc) => readerSidesOf(doc)[1].querySelector('[data-reader-page]')!.setAttribute('data-turn-deg', '180')],
            ['page 12 turned 180 again (fix 5)', '[turn]', (doc) => readerSidesOf(doc)[0].querySelectorAll('[data-reader-page]')[1].setAttribute('data-turn-deg', '180')],
            ['the old 90 degree turn on a front', '[turn]', (doc) => readerSidesOf(doc)[2].querySelector('[data-reader-page]')!.setAttribute('data-turn-deg', '90')],
            ['a portrait page 148.5 x 198 mm', '[page-size]', (doc) => {
                const found = readerSidesOf(doc)[0].querySelector('[data-reader-page]')!;
                found.setAttribute('data-width-mm', '148.5');
                found.setAttribute('data-height-mm', '198');
            }],
            ['page at 99 x 140 mm', '[page-size]', (doc) => {
                const found = readerSidesOf(doc)[0].querySelector('[data-reader-page]')!;
                found.setAttribute('data-width-mm', '99');
                found.setAttribute('data-height-mm', '140');
            }],
            ['a cut line added', '[cut-line]', (doc) => {
                const cut = doc.createElement('div');
                cut.className = 'cut-line';
                readerSidesOf(doc)[0].append(cut);
            }],
            ['a reader side removed', '[reader-sides]', (doc) => readerSidesOf(doc)[11].remove()],
        ];
        for (const [name, tag, mutate] of mutants) {
            const doc = fresh();
            mutate(doc);
            const problems = studentReaderProblems(pages(doc), week.books);
            expect(problems.some((problem) => problem.includes(tag)), `mutant "${name}" must report ${tag}; got ${JSON.stringify(problems)}`).toBe(true);
        }
    }, 30_000);

    it('R-P4-10: fills the twelve student-book reader sides with the R32 leaves and reader pages', async () => {
        const week = shipped();
        const selected = await profile();
        const { html, doc } = await render(week, selected, 'proof');
        const readerApi = await import(readerModule) as ReaderModule;
        const readerDoc = new DOMParser().parseFromString(readerApi.compileStorytimeReaders([week], {
            profile: selected, mode: 'proof', output: 'workbook',
        }).html, 'text/html');
        const readerSides = pages(doc).filter((side) => side.getAttribute('data-page-kind') === 'reader');
        expect(readerSides).toHaveLength(12);
        expect(html).toContain('PICTURE MISSING');

        const leafOrder = [
            ['readalong', 1], ['readalong', 1], ['readalong', 2], ['readalong', 2], ['readalong', 3], ['readalong', 3],
            ['decodable', 1], ['decodable', 1], ['decodable', 2], ['decodable', 2], ['decodable', 3], ['decodable', 3],
        ];
        for (let sideIndex = 0; sideIndex < leafOrder.length; sideIndex++) {
            const side = readerSides[sideIndex];
            expect([side.getAttribute('data-reader'), Number(side.getAttribute('data-leaf-number'))]).toEqual(leafOrder[sideIndex]);
            const readerPages = Array.from(side.querySelectorAll('[data-reader-page]'));
            expect(readerPages).toHaveLength(2);
            for (const page of readerPages) {
                const pageNumber = Number(page.getAttribute('data-page-number'));
                const expectedPictureCount = pageNumber === 1 || (pageNumber >= 3 && pageNumber <= 10) ? 1 : 0;
                const pictureBoxes = Array.from(page.querySelectorAll('[data-picture-id]'));
                expect(pictureBoxes, `Reader page ${pageNumber} picture-box count.`).toHaveLength(expectedPictureCount);
                // changed 2026-11-12 (F5, PM look): the proof page 1 placeholder is the quest reader page that holds the text PICTURE MISSING.
                expect(pictureBoxes.filter((box) => (box.textContent ?? '').trim() === 'PICTURE MISSING' || (box.querySelector('.quest-reader-page') !== null && (box.textContent ?? '').includes('PICTURE MISSING'))),
                    `Reader page ${pageNumber} proof-placeholder count.`).toHaveLength(expectedPictureCount);
            }
        }

        type PageContent = { text: string; pictureIds: string[] };
        const pageContents = (root: Document, output: 'student' | 'readers'): Map<string, PageContent> => {
            const found = Array.from(root.querySelectorAll('[data-reader-page][data-page-number]'));
            const content = new Map<string, PageContent>();
            for (const page of found) {
                const physicalSide = output === 'student'
                    ? (readerSides.indexOf(page.closest('.student-page')!) % 2 === 0 ? 'front' : 'back')
                    : page.closest('[data-leaf-side]')?.getAttribute('data-leaf-side') ?? '';
                const number = Number(page.getAttribute('data-page-number'));
                const reader = output === 'student'
                    ? page.closest('.student-page')?.getAttribute('data-reader') ?? ''
                    : week.books.find((book) => book.title === page.closest('[data-reader-title]')?.getAttribute('data-reader-title'))?.kind ?? '';
                const leafNumber = output === 'student'
                    ? Number(page.closest('.student-page')?.getAttribute('data-leaf-number'))
                    : Number(page.closest('[data-reader-leaf]')?.getAttribute('data-leaf-number'));
                const key = `${physicalSide}|${reader}|${leafNumber}|${number}`;
                content.set(key, {
                    text: (page.textContent ?? '').replace(/\s+/g, ' ').trim(),
                    pictureIds: Array.from(page.querySelectorAll('[data-picture-id]'), (picture) => picture.getAttribute('data-picture-id') ?? '').sort(),
                });
            }
            return content;
        };
        const studentPages = pageContents(doc, 'student');
        const readerPages = pageContents(readerDoc, 'readers');
        expect(studentPages.size, 'the student book holds all 24 reader pages (2 readers x 12 pages)').toBe(24);
        expect(readerPages.size, 'the readers build holds all 24 reader pages').toBe(24);
        expect(studentPages).toEqual(readerPages);
        // spec FR-5.1 (2026-11-04): the page numbers of each side, top half then bottom half, for both readers; the back side keeps the top and the bottom of its front.
        const expectedBySide = [
            [1, 12], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7],
            [1, 12], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7],
        ];
        for (let sideIndex = 0; sideIndex < readerSides.length; sideIndex++) {
            const side = sideIndex % 2 === 0 ? 'front' : 'back';
            const numbers = Array.from(readerSides[sideIndex].querySelectorAll('[data-reader-page]'), (found) => Number(found.getAttribute('data-page-number')));
            expect(numbers, `R-P4-10 ${side} side has its own page set.`).toEqual(expectedBySide[sideIndex]);
        }
        for (const book of week.books) {
            for (const page of book.pages) {
                expect([...studentPages.values()].some((content) => content.text.includes(page.text)), `${book.title}: ${page.text}`)
                    .toBe(true);
            }
        }
    });

    it('R33: rejects a removed home leaf on a temporary HTML copy', async () => {
        const { doc } = await render();
        assertHomeLeaf(doc);
        const broken = htmlCopy(doc, (copy) => {
            page(copy, 'home-front').remove();
            page(copy, 'home-back').remove();
        });
        expect(() => assertHomeLeaf(broken)).toThrow();
    });

    it('R33: rejects an answer mark on a temporary HTML copy', async () => {
        const { doc } = await render();
        assertUnmarkedCheck(doc);
        const broken = htmlCopy(doc, (copy) => {
            const mark = copy.createElement('span');
            mark.className = 'answer-mark';
            mark.textContent = '✓';
            page(copy, 'check').append(mark);
        });
        expect(() => assertUnmarkedCheck(broken)).toThrow();
    });

    it('R33: rejects a right-page spread on a temporary HTML copy', async () => {
        const { doc } = await render();
        assertLeftSpread(doc);
        const broken = htmlCopy(doc, (copy) => {
            const padding = copy.createElement('section');
            padding.className = 'student-page';
            padding.setAttribute('data-page-kind', 'blank');
            page(copy, 'practice').before(padding);
        });
        expect(() => assertLeftSpread(broken)).toThrow();
    });

    it('R38: gives every trace item a start dot (D2)', async () => {
        const { doc } = await render();
        const box = part(page(doc, 'practice'), 'letter-box');
        // A-48: three trace copies, one dot-only cell, and one empty write space (the model cell is not a trace cell).
        const cells = Array.from(box.querySelectorAll('.trace-cell'));
        expect(cells, 'Three copies to trace, one dot-only cell, and one write space.').toHaveLength(5);
        for (let i = 0; i < 3; i++) {
            expect(cells[i].querySelector('[data-part="trace-letter"]'), `Cell ${i + 1} traces a letter.`).not.toBeNull();
            expect(cells[i].querySelector('[data-part="trace-dot"]'), `Trace copy ${i + 1} must hold a start dot.`).not.toBeNull();
        }
        expect(cells[3].querySelector('[data-part="trace-letter"]'), 'The dot-only cell prints no letter.').toBeNull();
        expect(cells[3].querySelector('[data-part="dot-only-dot"]'), 'The dot-only cell holds a start dot.').not.toBeNull();
        expect(cells[4].querySelector('[data-part="trace-letter"], [data-part="trace-dot"], [data-part="dot-only-dot"]'), 'The write space stays empty.').toBeNull();
        const writing = page(doc, 'writing');
        // E14, E15: the trace sentence has a dot on each word; the dictated word has no printed letters.
        expect(writing.querySelector('[data-part="writing-trace"] [data-part="trace-word-dot"]'),
            'The writing trace text must hold a start dot on each word.').not.toBeNull();
    });

    it('R38: prints each trace item in a K 20-40% gray, never solid black (D2)', async () => {
        const week = shipped();
        const { doc } = await render(week);
        const style = doc.querySelector('style')!.textContent ?? '';
        const body = `<div style="font-size:44pt;margin-bottom:40mm">${week.print!.letterBox.letter}</div>` +
            `<div style="font-size:18pt;margin-bottom:40mm">${week.print!.dictation.words[0]}</div>` +
            `<div style="font-size:22pt">${week.print!.writing.traceText}</div>`;
        const file = buildPdfx(isolateMeasurementHtml('d2-gray', style, body));
        const { width, height, data } = await rasterPage(file, 1, 300);
        const bands = inkBands(data, width, height);
        expect(bands, 'One trace item each: the letter copy, the word, the sentence.').toHaveLength(3);
        for (const band of bands) {
            const tone = bandInkMedian(data, width, band);
            expect(tone, 'Each trace item prints in a K 20-40% gray.').toBeGreaterThanOrEqual(153);
            expect(tone).toBeLessThanOrEqual(204);
        }
    }, 230000);

    it('R38: measures the four compiled trace items (three cells and the D4 frame) in page context and catches a removed gray opt-in', async () => {
        const { doc } = await render(shipped());
        const style = doc.querySelector('style')!.textContent ?? '';
        const cells = Array.from(page(doc, 'practice').querySelectorAll('.trace-cell')).slice(0, 3);
        const writing = page(doc, 'writing').querySelector('[data-part="writing-trace"]')!;
        // A-48: a trace item is an SVG (the grey letter or the grey words, with black start dots).
        const fragments = [
            ...cells.map((cell) => cell.querySelector('svg')!.outerHTML),
            // The wrapper without its class, so that the rule line under the words is not measured.
            `<span data-part="writing-trace">${writing.querySelector('svg')!.outerHTML}</span>`,
        ];
        const measure = async (css: string): Promise<number[]> => Promise.all(fragments.map(async (fragment, index) => {
            const html = isolateMeasurementHtml(`r38-real-${index}`, css, `<section class="student-page">${fragment}</section>`);
            const raster = await rasterPage(buildPdfx(html), 1, 300);
            const bands = inkBands(raster.data, raster.width, raster.height);
            expect(bands.length, `Trace item ${index + 1} has raster ink.`).toBeGreaterThan(0);
            return bandInkMedian(raster.data, raster.width, bands.at(-1)!);
        }));
        const medians = await measure(style);
        console.info(`R38 compiled trace medians: ${medians.join(', ')}`);
        expect(medians).toHaveLength(4);
        for (const [index, tone] of medians.entries()) {
            expect(tone, `Compiled trace item ${index + 1} stays in K 20-40% gray.`).toBeGreaterThanOrEqual(GUIDE_GRAY_LO);
            expect(tone, `Compiled trace item ${index + 1} stays in K 20-40% gray.`).toBeLessThanOrEqual(GUIDE_GRAY_HI);
        }
        const noOptIn = style.replace(/\.student-page \[data-part="trace-letter"\],[\s\S]*?\{ fill: #b0b0b0; color: #b0b0b0; \}/, '');
        expect(noOptIn, 'The mutation removes the trace color opt-in rule.').not.toBe(style);
        const mutated = await measure(noOptIn);
        console.info(`R38 removed-gray-rule medians: ${mutated.join(', ')}`);
        expect(() => expect(mutated.every((tone) => tone >= GUIDE_GRAY_LO && tone <= GUIDE_GRAY_HI)).toBe(true))
            .toThrow();
    }, 1200000);

    it('R38: prints a black start dot on each letter copy (D2)', async () => {
        const { doc } = await render();
        const style = doc.querySelector('style')!.textContent ?? '';
        const box = part(page(doc, 'practice'), 'letter-box');
        const traceRow = box.querySelector('.trace-row')!;
        expect(traceRow, 'The trace row prints.').not.toBeNull();
        const file = buildPdfx(isolateMeasurementHtml('d2-dots', style, `<section class="student-page">${traceRow.outerHTML}</section>`));
        const { width, height, data } = await rasterPage(file, 1, 300);
        const dots = solidBlackDots(data, width, height);
        expect(dots, 'Each of the three letter copies holds a black start dot.').toBeGreaterThanOrEqual(3);
    }, 230000);

    it('R39: leaves the dictation letter lines empty write-in lines (D3)', async () => {
        const week = shipped();
        const { doc } = await render(week);
        const dictation = part(page(doc, 'writing'), 'dictation');
        expect(dictation.querySelectorAll('[data-part="dictation-letter"]'), 'The dictation letter lines keep their count.')
            .toHaveLength(week.print!.dictation.letters.length);
        expect(texts(dictation, '[data-part="dictation-letter"]'), 'The children write the letters; the book prints none.').toEqual(['', '', '']);
        const broken = htmlCopy(doc, (copy) => {
            let index = 0;
            for (const span of part(page(copy, 'writing'), 'dictation').querySelectorAll('[data-part="dictation-letter"]')) {
                span.textContent = week.print!.dictation.letters[index++];
            }
        });
        expect(() => expect(texts(part(page(broken, 'writing'), 'dictation'), '[data-part="dictation-letter"]')).toEqual(['', '', ''])).toThrow();
    });

    it('R40: mirrors the horizontal fold line with the leaf parity and prints it across the middle of the leaf (D4, spec FR-5.1)', async () => {
        const { html, doc } = await render();
        const file = buildPdfx(html);
        const readerSides = pages(doc).map((side, index) => ({ side, pageNumber: index + 1 }))
            .filter(({ side }) => side.getAttribute('data-page-kind') === 'reader');
        expect(readerSides, 'Six reader leaves, twelve sides.').toHaveLength(12);
        const front = readerSides[0], back = readerSides[1];
        expect(front.pageNumber % 2, 'The first reader side is a front.').toBe(1);
        expect(back.pageNumber, 'The back follows the front.').toBe(front.pageNumber + 1);
        const frontRaster = await rasterPage(file, front.pageNumber, 300);
        const backRaster = await rasterPage(file, back.pageNumber, 300);
        const frontExtent = foldLineExtent(frontRaster.data, frontRaster.width);
        const backExtent = foldLineExtent(backRaster.data, backRaster.width);
        expect(backExtent.minMm, 'The back fold line starts at the outer edge (x=0).').toBeLessThanOrEqual(3);
        expect(backExtent.maxMm, 'The back fold line reaches the perforation.').toBeGreaterThanOrEqual(195);
        expect(backExtent.maxMm, 'The back fold line never crosses into the bound stub.').toBeLessThanOrEqual(201);
        expect(frontExtent.minMm, 'The front fold line starts at the perforation.').toBeGreaterThanOrEqual(9);
        expect(frontExtent.minMm).toBeLessThanOrEqual(15);
        expect(frontExtent.maxMm, 'The front fold line ends at the outer edge.').toBeGreaterThanOrEqual(207);
    }, 250000);
});

describe('Storytime student workbook: final-mode picture folder (Red 4g, orchestrator decision of 2026-11-02)', () => {
    /** Two week 1 rows that Forge redid at version 2 in the real delivery: a check row and a reader story page. */
    const REDONE_CHECK = 'l2-w01-check-row-net';
    const REDONE_STORY = 'l2-w01-story-page-a-net';
    const CUP = 'l2-w01-check-row-cup';
    const HAT = 'l2-w01-check-row-hat';

    it('R-P4-30 prints the line art of a redone row from the folder manifest and never the color file', async () => {
        // Behavior 2 and 3. The list keeps the -v1 names, the manifest holds -v2 files for two
        // rows. The check row is printed by student-book.ts and the story page by the reader strip.
        const week = shipped();
        const ids = await weekRowIds(week);
        expect(ids, 'the week requests both redone rows').toEqual(expect.arrayContaining([REDONE_CHECK, REDONE_STORY]));
        const { repo, pictures } = finalRepo();
        writePictureFolder(pictures, jobsFor(ids, { [REDONE_CHECK]: 2, [REDONE_STORY]: 2 }));
        const failure = await finalBuildError(repo, week);
        expect(failure, 'the final build resolves the redone rows through the manifest').toBe('');
        const { doc, html } = await renderFinalIn(repo, week);
        for (const id of [REDONE_CHECK, REDONE_STORY]) {
            const elements = Array.from(doc.querySelectorAll(`[data-picture-id="${id}"]`));
            expect(elements.length, `${id} prints at least once`).toBeGreaterThanOrEqual(1);
            for (const el of elements) {
                expect(el.getAttribute('data-picture-file'), `data-picture-file of ${id}`).toBe(`${id}-line-v2.png`);
                const src = el.querySelector('img')?.getAttribute('src') ?? '';
                expect(src, `img source of ${id}`).toBe(pathToFileURL(path.join(pictures, `${id}-line-v2.png`)).href);
            }
            expect(html, `${id}: the color file never prints`).not.toContain(`${id}-v2.png`);
            expect(html, `${id}: the list name never prints`).not.toContain(`${id}-line-v1.png`);
        }
        const files = Array.from(doc.querySelectorAll('[data-picture-file]'), (el) => el.getAttribute('data-picture-file')!);
        expect(files.filter((name) => !/-line-v\d+\.png$/.test(name)), 'every printed file is a line-art file').toEqual([]);
        expect(html, 'a row at version 1 keeps its v1 line art').toContain(`${CUP}-line-v1.png`);
    }, 120_000);

    it('R-P4-31b final mode without manifest.json stops and names manifest.json and the folder', async () => {
        // Behavior 5. The folder holds the PNG files of every row but no manifest.json.
        const week = shipped();
        const { repo, pictures } = finalRepo();
        writePictureFolder(pictures, jobsFor(await weekRowIds(week)));
        fs.rmSync(path.join(pictures, 'manifest.json'));
        const message = await finalBuildError(repo, week);
        expect(message, 'the final build stops').not.toBe('');
        expect(message, 'the message names the missing manifest.json').toContain('manifest.json');
        expect(message, 'the message names the picture folder').toContain(pictures);
    }, 60_000);

    it('R-P4-32b final mode with a line-art file that differs from the manifest SHA-256 stops and names the row id', async () => {
        // Behavior 4. The file exists, but its bytes are not the accepted bytes.
        const week = shipped();
        const { repo, pictures } = finalRepo();
        writePictureFolder(pictures, jobsFor(await weekRowIds(week)));
        fs.appendFileSync(path.join(pictures, `${CUP}-line-v1.png`), 'changed after the manifest');
        const message = await finalBuildError(repo, week);
        expect(message, 'the final build stops').not.toBe('');
        expect(message, 'the message names the row id').toContain(CUP);
        expect(message, 'the message names the SHA-256 problem').toMatch(/sha-?256/i);
    }, 60_000);

    it('R-P4-33b final mode stops and names the row id for a duplicate row id, a name of another row id, a path outside the folder, and a name version that is not selectedVersion', async () => {
        // Behavior 2 with the stage 1 rules. Each case writes the list-name files of the failing
        // row as well (a decoy that the manifest does not name), so a build that ignores the
        // manifest finds its files and does not stop.
        const week = shipped();
        const ids = await weekRowIds(week);
        const decoys = (pictures: string, id: string): void => {
            for (const name of [`${id}-v1.png`, `${id}-line-v1.png`]) fs.writeFileSync(path.join(pictures, name), `decoy ${name}`);
        };
        const cases: Array<[string, (jobs: PictureFolderJob[], pictures: string) => PictureFolderJob[], RegExp | null]> = [
            ['a duplicate row id', (jobs) => [{ rowId: CUP }, ...jobs], /duplicate/i],
            ['the files of another row id', (jobs, pictures) => {
                decoys(pictures, CUP);
                return jobs.map((job) => (job.rowId === CUP ? { ...job, colorPath: `${HAT}-v1.png`, linePath: `${HAT}-line-v1.png` } : job));
            }, null],
            ['a path outside the folder', (jobs, pictures) => {
                decoys(pictures, CUP);
                return jobs.map((job) => (job.rowId === CUP ? { ...job, colorPath: `../outside/${CUP}-v1.png`, linePath: `../outside/${CUP}-line-v1.png` } : job));
            }, null],
            ['v2 file names with the version 1 job', (jobs, pictures) => {
                decoys(pictures, CUP);
                return jobs.map((job) => (job.rowId === CUP ? { ...job, version: 1, colorPath: `${CUP}-v2.png`, linePath: `${CUP}-line-v2.png` } : job));
            }, null],
        ];
        const problems: string[] = [];
        for (const [label, change, reasonPattern] of cases) {
            const { repo, pictures } = finalRepo();
            writePictureFolder(pictures, change(jobsFor(ids), pictures));
            const message = await finalBuildError(repo, week);
            if (!message) { problems.push(`${label}: the build did not stop`); continue; }
            if (!message.includes(CUP)) problems.push(`${label}: the message does not name the row id ${CUP}: ${message}`);
            if (reasonPattern && !reasonPattern.test(message)) problems.push(`${label}: the message does not match ${reasonPattern}: ${message}`);
        }
        expect(problems, problems.join('\n')).toEqual([]);
    }, 120_000);
});

describe('Storytime student workbook: the img source of a final picture is an encoded file URL (Red 4i, finding B-P4-1 of Review B)', () => {
    /**
     * Builds the final student book of the shipped week 1 in a temporary repository whose picture
     * folder holds the given prefixes, and lists the problems of the printed pictures. The images
     * that are not pictures (logo, QR) are counted in the proof build of the same week.
     * @param prefixes The folder prefixes of the manifest paths; the empty text means no prefix.
     * @returns The build failure (empty when none) and the problems of the printed pictures.
     */
    async function sourceProblems(prefixes: string[]): Promise<{ failure: string; problems: string[] }> {
        const week = shipped();
        const ids = await weekRowIds(week);
        const { repo, pictures } = finalRepo();
        const jobs = prefixedJobs(ids, prefixes);
        writePictureFolder(pictures, jobs);
        const failure = await finalBuildError(repo, week);
        if (failure) return { failure, problems: [] };
        const proof = await render(week);
        const strays = proof.doc.querySelectorAll('img').length;
        const { html } = await renderFinalIn(repo, week);
        return { failure: '', problems: pictureSourceProblems(html, pictures, jobs, 'line', strays) };
    }

    it('R-P4-40 a hostile folder prefix adds no attribute and no element, and a prefix with #, ?, %, a quote, or a space decodes to the resolved file', async () => {
        // Behaviors 1 to 3 for the student book. The count of the text "onerror" cannot be 0, because
        // the encoded path holds the folder name as text; the parsed attributes and elements are the contract.
        for (const [label, prefixes] of [['hostile', HOSTILE_PREFIXES], ['awkward', AWKWARD_PREFIXES]] as const) {
            const { failure, problems } = await sourceProblems([...prefixes]);
            expect.soft(failure, `${label}: the build accepts the folder names`).toBe('');
            expect.soft(problems, `${label}:\n${problems.join('\n')}`).toEqual([]);
        }
    }, 240_000);

    it('R-P4-42 guard: a plain prefix and no prefix keep the file URL of the resolved path', async () => {
        // Behavior 4. This case passes at the role base and stays passing.
        for (const prefixes of [['w01/rows/'], ['']]) {
            const { failure, problems } = await sourceProblems(prefixes);
            expect(failure, `prefix "${prefixes[0]}": the build succeeds`).toBe('');
            expect(problems, `prefix "${prefixes[0]}":\n${problems.join('\n')}`).toEqual([]);
        }
    }, 240_000);
});
