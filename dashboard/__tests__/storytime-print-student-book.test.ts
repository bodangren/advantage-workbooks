// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { STORYTIME_QR_HOST, STORYTIME_ROOT, storytimeQrUrl, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Phase 2 contract. Imports stay inside test bodies so missing modules preserve collection.
 * student-book.ts exports compileStorytimeStudentBook(weeks, { profile, mode }): { html }.
 * profile.ts exports STORYTIME_PRINT_PROFILE with the fields in R30 below.
 * Each physical side is .student-page[data-page-kind][data-page-number].
 * Stable data-part hooks identify printed elements, not a second content manifest.
 * Reader sides can contain empty strip boxes until Phase 4 adds the reader content.
 */
interface PrintProfile {
    trim: { widthMm: number; heightMm: number };
    bleedMm: number;
    perforationMm: number;
    readerPage: { widthMm: number; heightMm: number };
}

interface StudentModule {
    compileStorytimeStudentBook: (
        weeks: StorytimeWeek[], options: { profile: PrintProfile; mode: 'proof' | 'final' },
    ) => { html: string } | Promise<{ html: string }>;
}

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const studentModule = path.join(dashboardRoot, 'lib/storytime/print/student-book.ts');
const profileModule = path.join(dashboardRoot, 'lib/storytime/print/profile.ts');
const fontDir = path.join(dashboardRoot, 'assets/print-fonts');
const temporaryFolders: string[] = [];
const builtPdfx = new Map<string, string>();
const pictureIds = ['nest', 'cat', 'fish', 'dog', 'nose', 'bus', 'hat', 'cup', 'net']
    .map((word) => `l2-w01-check-row-${word}`);

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
        const browser = await chromium.launch({ channel: 'chrome', timeout: 15000 });
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
const GUIDE_BLACK = 40;
/** The raster tolerance for guide ink outside the letter. At most 0.5 mm. */
const GUIDE_TOLERANCE_MM = 0.5;

interface GuideRead {
    letterMedian: number;
    downFraction: number;
    archFraction: number;
    arrowWings: number;
    outsidePx: number;
    dotBlack: boolean;
    dotTopGapMm: number;
    downTopGapMm: number;
    downBottomGapMm: number;
    archBottomGapMm: number;
}

function pathPoints(d: string): { x: number; y: number }[] {
    const tokens = d.match(/[MLC]|-?\d*\.?\d+/g) ?? [];
    const points: { x: number; y: number }[] = [];
    let i = 0;
    let cx = 0;
    let cy = 0;
    const pushLine = (x: number, y: number): void => {
        const steps = Math.max(2, Math.ceil(Math.hypot(x - cx, y - cy) * 2));
        for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            points.push({ x: cx + (x - cx) * t, y: cy + (y - cy) * t });
        }
        cx = x;
        cy = y;
    };
    while (i < tokens.length) {
        const op = tokens[i];
        if (op === 'M') {
            cx = Number(tokens[i + 1]);
            cy = Number(tokens[i + 2]);
            i += 3;
        } else if (op === 'L') {
            pushLine(Number(tokens[i + 1]), Number(tokens[i + 2]));
            i += 3;
        } else if (op === 'C') {
            const x1 = Number(tokens[i + 1]);
            const y1 = Number(tokens[i + 2]);
            const x2 = Number(tokens[i + 3]);
            const y2 = Number(tokens[i + 4]);
            const x = Number(tokens[i + 5]);
            const y = Number(tokens[i + 6]);
            for (let s = 1; s <= 24; s++) {
                const t = s / 24;
                const u = 1 - t;
                points.push({
                    x: u * u * u * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
                    y: u * u * u * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y,
                });
            }
            cx = x;
            cy = y;
            i += 7;
        } else {
            i += 1;
        }
    }
    return points;
}

function guideContract(read: GuideRead): {
    letterInBand: boolean; downCovered: boolean; archCovered: boolean; arrowsShown: boolean; guideInside: boolean;
    dotAtTop: boolean; downSpansStem: boolean; archAtBottom: boolean;
} {
    return {
        letterInBand: read.letterMedian >= GUIDE_GRAY_LO && read.letterMedian <= GUIDE_GRAY_HI,
        downCovered: read.downFraction >= 0.75,
        archCovered: read.archFraction >= 0.75,
        arrowsShown: read.arrowWings >= 2,
        guideInside: read.outsidePx === 0,
        dotAtTop: read.dotBlack && read.dotTopGapMm >= -0.1 && read.dotTopGapMm <= 2.5,
        downSpansStem: read.downTopGapMm >= -0.5 && read.downTopGapMm <= 2.5
            && read.downBottomGapMm >= 0 && read.downBottomGapMm <= 2.5,
        archAtBottom: read.archBottomGapMm >= 0 && read.archBottomGapMm <= 2.5,
    };
}

/** A gray model letter and a guide that stays inside the Andika stems. Proves R41 can pass. */
function guideInsideSvg(model: Element): string {
    const copy = model.cloneNode(true) as Element;
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const letter = copy.querySelector('text');
    expect(letter, 'The copy needs the model letter.').not.toBeNull();
    letter!.setAttribute('fill', '#b0b0b0');
    const marker = copy.querySelector('marker');
    expect(marker, 'The copy needs the arrow marker.').not.toBeNull();
    marker!.setAttribute('markerWidth', '4');
    marker!.setAttribute('markerHeight', '4');
    const dot = copy.querySelector('[data-part="start-dot"]');
    expect(dot, 'The copy needs the start dot.').not.toBeNull();
    dot!.setAttribute('cx', '40.5');
    dot!.setAttribute('cy', '64');
    dot!.setAttribute('r', '1.3');
    const paths = copy.querySelectorAll('path[data-part="formation-arrow"]');
    expect(paths, 'The copy needs the two guide strokes.').toHaveLength(2);
    paths[0].setAttribute('d', 'M40.5 64 L40.5 103');
    paths[1].setAttribute('d', 'M40.5 66 L44 74.5 L48 71.2 L52 67.8 L56 65.9 L60 65.2 L64 65.8 L68 70.2 L72.2 74 L72.2 103');
    return copy.outerHTML;
}

function letterOnlySvg(modelHtml: string): string {
    const svg = new DOMParser().parseFromString(modelHtml, 'text/html').querySelector('svg');
    expect(svg, 'The letter model must be an SVG.').not.toBeNull();
    const copy = svg!.cloneNode(true) as Element;
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copy.querySelector('defs')?.remove();
    for (const node of Array.from(copy.querySelectorAll('circle, path'))) node.remove();
    return copy.outerHTML;
}

function cropRaster(
    data: Buffer, width: number, y0: number, y1: number,
): { width: number; height: number; data: Buffer } {
    const height = y1 - y0;
    const out = Buffer.alloc(width * height);
    for (let y = 0; y < height; y++) data.copy(out, y * width, (y0 + y) * width, (y0 + y) * width + width);
    return { width, height, data: out };
}

function guideGeometry(data: Buffer, width: number, height: number): {
    ox: number; oy: number; leftStemX: number; rightStemX: number;
} {
    const unitX = 46 * MM_PX_300 / 100;
    const unitY = 55 * MM_PX_300 / 120;
    let minX = width;
    let maxX = -1;
    let maxY = -1;
    let minY = height;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[y * width + x] < 230) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }
    expect(maxX, 'The model letter must render ink.').toBeGreaterThanOrEqual(0);
    const bandTop = maxY - Math.round((maxY - minY) * 0.25);
    const bandHeight = maxY - bandTop + 1;
    const counts = new Int32Array(width);
    for (let y = bandTop; y <= maxY; y++) for (let x = minX; x <= maxX; x++) if (data[y * width + x] < 230) counts[x]++;
    const threshold = Math.max(1, Math.round(bandHeight * 0.5));
    const runs: { left: number; right: number }[] = [];
    let runStart = -1;
    for (let x = minX; x <= maxX; x++) {
        if (counts[x] >= threshold) {
            if (runStart < 0) runStart = x;
        } else if (runStart >= 0) {
            runs.push({ left: runStart, right: x - 1 });
            runStart = -1;
        }
    }
    if (runStart >= 0) runs.push({ left: runStart, right: maxX });
    expect(runs.length, 'The model letter must expose two stems.').toBeGreaterThanOrEqual(2);
    const left = (runs[0].left + runs[0].right) / 2;
    const right = (runs[1].left + runs[1].right) / 2;
    return { ox: left - 40.5 * unitX, oy: maxY - 108 * unitY, leftStemX: left, rightStemX: right };
}

/** The top or bottom ink row of the letter in a window around a stem center. */
function stemEdge(data: Buffer, width: number, height: number, centerX: number, bottom: boolean): number {
    const windowHalf = Math.round(2 * (46 * MM_PX_300 / 100));
    const x0 = Math.max(0, Math.round(centerX) - windowHalf);
    const x1 = Math.min(width - 1, Math.round(centerX) + windowHalf);
    if (bottom) {
        for (let y = height - 1; y >= 0; y--) for (let x = x0; x <= x1; x++) if (data[y * width + x] < 230) return y;
        return -1;
    }
    for (let y = 0; y < height; y++) for (let x = x0; x <= x1; x++) if (data[y * width + x] < 230) return y;
    return height;
}

function blackOnGray(full: Buffer, letter: Buffer, width: number, height: number, x: number, y: number): boolean {
    if (x < 1 || y < 1 || x + 1 >= width || y + 1 >= height) return false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const i = (y + dy) * width + (x + dx);
        if (full[i] < GUIDE_BLACK && letter[i] >= GUIDE_GRAY_LO && letter[i] <= GUIDE_GRAY_HI) return true;
    }
    return false;
}

function readGuide(
    full: Buffer, letter: Buffer, width: number, height: number, paths: string[], dot: { x: number; y: number },
): GuideRead {
    const unitX = 46 * MM_PX_300 / 100;
    const unitY = 55 * MM_PX_300 / 120;
    const geometry = guideGeometry(letter, width, height);
    console.info(`R41 origin ox=${geometry.ox.toFixed(1)} oy=${geometry.oy.toFixed(1)}`);
    const toPx = (ux: number, uy: number): { x: number; y: number } => ({
        x: Math.round(geometry.ox + ux * unitX),
        y: Math.round(geometry.oy + uy * unitY),
    });
    const cover = (d: string): number => {
        const points = pathPoints(d);
        expect(points.length, 'A guide stroke must have a path.').toBeGreaterThan(4);
        let hit = 0;
        for (const point of points) {
            const px = toPx(point.x, point.y);
            if (blackOnGray(full, letter, width, height, px.x, px.y)) hit++;
        }
        return hit / points.length;
    };
    let arrowWings = 0;
    for (const d of paths) {
        const points = pathPoints(d);
        const end = points[points.length - 1];
        const prev = points[Math.max(0, points.length - 6)];
        let dx = end.x - prev.x;
        let dy = end.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        let wings = 0;
        for (let along = -2.8; along <= 0.8; along += 0.4) {
            for (const side of [-1.8, -1.3, -1.0, 1.0, 1.3, 1.8]) {
                const px = toPx(end.x + dx * along - dy * side, end.y + dy * along + dx * side);
                if (blackOnGray(full, letter, width, height, px.x, px.y)) wings++;
            }
        }
        if (wings >= 4) arrowWings++;
    }
    const tol = Math.round(GUIDE_TOLERANCE_MM * MM_PX_300);
    let outsidePx = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (full[i] >= GUIDE_BLACK || letter[i] <= 235) continue;
        let near = false;
        for (let dy = -tol; dy <= tol && !near; dy++) for (let dx = -tol; dx <= tol && !near; dx++) {
            const yy = y + dy;
            const xx = x + dx;
            if (yy < 0 || xx < 0 || yy >= height || xx >= width) continue;
            if (dx * dx + dy * dy > tol * tol) continue;
            if (letter[yy * width + xx] < 230) near = true;
        }
        if (!near) outsidePx++;
    }
    const leftTopY = stemEdge(letter, width, height, geometry.leftStemX, false);
    const leftBottomY = stemEdge(letter, width, height, geometry.leftStemX, true);
    const rightBottomY = stemEdge(letter, width, height, geometry.rightStemX, true);
    const downPoints = pathPoints(paths[0]);
    const archPoints = pathPoints(paths[1]);
    const downStart = downPoints[0];
    const downEnd = downPoints[downPoints.length - 1];
    const archEnd = archPoints[archPoints.length - 1];
    const dotPx = toPx(dot.x, dot.y);
    const dotBlack = full[dotPx.y * width + dotPx.x] < GUIDE_BLACK;
    const gapMm = (py: number, refY: number): number => (py - refY) / MM_PX_300;
    const ink: number[] = [];
    for (let i = 0; i < letter.length; i++) if (letter[i] < 240) ink.push(letter[i]);
    return {
        letterMedian: median(ink),
        downFraction: cover(paths[0]),
        archFraction: cover(paths[1]),
        arrowWings,
        outsidePx,
        dotBlack,
        dotTopGapMm: gapMm(toPx(dot.x, dot.y).y, leftTopY),
        downTopGapMm: gapMm(toPx(downStart.x, downStart.y).y, leftTopY),
        downBottomGapMm: gapMm(leftBottomY, toPx(downEnd.x, downEnd.y).y),
        archBottomGapMm: gapMm(rightBottomY, toPx(archEnd.x, archEnd.y).y),
    };
}

/** The horizontal extent of the reader-leaf cut line, in millimeters from the page left edge. */
function cutLineExtent(data: Buffer, width: number): { minMm: number; maxMm: number } {
    const top = Math.round(138 * MM_PX_300), bottom = Math.round(148 * MM_PX_300);
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
            'reader', 'reader', 'reader', 'reader', 'reader', 'reader',
        ]);
        expect(sides.map((side) => Number(side.getAttribute('data-page-number'))))
            .toEqual(sides.map((_side, index) => index + 1));
        assertLeftSpread(doc);
        assertHomeLeaf(doc);
        expect(text(page(doc, 'name'))).toContain('This book belongs to');
    });

    it('R22: uses the P11 default title and the eight book-map places', async () => {
        const { doc } = await render();
        expect(text(part(page(doc, 'name'), 'title'))).toBe('Storytime Advantage, Level 2, Unit 1, Student Book');
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
        expect(dot.getAttribute('data-start-point')).toBe('top');
        const arrows = box.querySelectorAll('svg [marker-end], svg [data-part="formation-arrow"]');
        expect(arrows.length).toBeGreaterThan(0);
        expect(text(part(box, 'formation-words'))).toBe(week.print!.letterBox.formationWords);
    });

    it('R24: prints the three practice lines and their picture ids in data order', async () => {
        const { doc } = await render();
        const sheet = part(page(doc, 'practice'), 'practice-sheet');
        expect(texts(sheet, '[data-part="practice-text"]')).toEqual(['n n n', 'A nest. A net.', 'and']);
        expect(Array.from(sheet.querySelectorAll('[data-picture-id]'), (image) => image.getAttribute('data-picture-id')))
            .toEqual(['l2-w01-practice-line-nose', 'l2-w01-practice-line-nest', 'l2-w01-practice-line-nut']);
        expect(texts(sheet, '[data-part="practice-text"]')).toEqual(shipped().print!.practice.map((line) => line.text));
    });

    it('R25: prints the dictation, Hello, I am, the name line, and the picture box', async () => {
        const { doc } = await render();
        const right = page(doc, 'writing');
        const dictation = part(right, 'dictation');
        // D3 (Check 2026-10-27): the dictation letter lines are empty write-in lines; the children write "n".
        expect(texts(dictation, '[data-part="dictation-letter"]')).toEqual(['', '', '']);
        expect(texts(dictation, '[data-part="dictation-word"]')).toEqual(['a']);
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
        const { storytimePrintPictures } = await import('../lib/storytime/print/pictures');
        const pictureFiles = new Set(storytimePrintPictures([week]).flatMap((row) =>
            [row.fileName, row.lineArtFileName].map((name) => path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures', name))));
        // Isolate mode behavior from Forge file availability. This test builds no final PDF.
        const existsSync = fs.existsSync;
        const pictureExists = vi.spyOn(fs, 'existsSync').mockImplementation((file) =>
            typeof file === 'string' && pictureFiles.has(file) ? true : existsSync(file));
        try {
            const final = await render(week, undefined, 'final');
            assertHomeLeaf(final.doc);
            expect(final.doc.querySelectorAll('[data-picture-id] img').length).toBeGreaterThanOrEqual(12);
            expect(final.html).not.toContain(mark);
            expect(text(final.doc.body)).not.toContain(mark);
        } finally {
            pictureExists.mockRestore();
        }
    });

    it('R28: excludes the four forbidden labels and every CJK character from the HTML', async () => {
        const { html } = await render();
        expect(html).not.toMatch(/CEFR|Pre[-‑–\s]?A1|Starters|Reading\s+A[-‑–]Z/i);
        expect(html).not.toMatch(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u);
    });

    it('R28: keeps Thai only on the home card and keeps each Thai run unbroken', async () => {
        const { doc } = await render();
        for (const side of pages(doc).filter((side) => !side.getAttribute('data-page-kind')!.startsWith('home-'))) {
            expect(text(side)).not.toMatch(/\p{Script=Thai}/u);
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
            const metadata = execFileSync('fc-scan', ['--format', '%{family}|%{variable}', file], { encoding: 'utf8', timeout: 3000 });
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

    it('R30: exports the P2 and P15 default profile in millimeters', async () => {
        expect(await profile()).toMatchObject({
            trim: { widthMm: 210, heightMm: 297 }, bleedMm: 0, perforationMm: 12,
            readerPage: { widthMm: 99, heightMm: 140 },
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
        expect(tearOut).toHaveLength(8);
        for (const side of tearOut) {
            const mark = part(side, 'perforation');
            const number = sides.indexOf(side) + 1;
            const edge = number % 2 ? 'left' : 'right';
            expect(mark.getAttribute('data-spine-edge')).toBe(edge);
            expect(mark.getAttribute('style')?.replace(/\s+/g, '')).toContain(`${edge}:12mm`);
            expect(mark.getAttribute('style')?.replace(/\s+/g, '')).not.toContain(`${edge === 'left' ? 'right' : 'left'}:12mm`);
        }
    });

    it('R32: registers the duplex strips and fits two 99 x 140 mm pages in the 198 mm torn leaf (P15 default)', async () => {
        const selected = await profile();
        const { doc } = await render(shipped(), selected);
        const readerSides = pages(doc).filter((side) => side.getAttribute('data-page-kind') === 'reader');
        expect(readerSides).toHaveLength(6);
        const expected = [['readalong', 1], ['readalong', 2], ['readalong', 3], ['decodable', 1], ['decodable', 2], ['decodable', 3]];
        const fronts: (string | number)[][] = [];
        for (let leaf = 0; leaf < 3; leaf++) {
            const front = Array.from(readerSides[leaf * 2].querySelectorAll('[data-part="reader-strip"]'));
            const back = Array.from(readerSides[leaf * 2 + 1].querySelectorAll('[data-part="reader-strip"]'));
            expect(front).toHaveLength(2);
            expect(back).toHaveLength(2);
            for (let slot = 0; slot < 2; slot++) {
                const identity = (strip: Element) => [strip.getAttribute('data-reader'), Number(strip.getAttribute('data-strip'))];
                expect(identity(back[slot]), 'The long-edge flip preserves the strip slot.').toEqual(identity(front[slot]));
                expect(front[slot].getAttribute('data-slot')).toBe(slot === 0 ? 'top' : 'bottom');
                expect(back[slot].getAttribute('data-slot')).toBe(front[slot].getAttribute('data-slot'));
                for (const strip of [front[slot], back[slot]]) {
                    const style = strip.getAttribute('style')?.replace(/\s+/g, '');
                    expect(style).toContain('width:198mm');
                    expect(style).toContain('height:140mm');
                    expect(style).toContain(`top:${slot * selected.trim.heightMm / 2}mm`);
                }
                // The long-edge flip mirrors x. Both sides retain the same physical strip.
                const frontNumber = pages(doc).indexOf(readerSides[leaf * 2]) + 1;
                const backNumber = pages(doc).indexOf(readerSides[leaf * 2 + 1]) + 1;
                expect(frontNumber % 2).toBe(1);
                expect(backNumber).toBe(frontNumber + 1);
                expect(front[slot].getAttribute('style')?.replace(/\s+/g, '')).toContain('left:12mm');
                expect(back[slot].getAttribute('style')?.replace(/\s+/g, '')).toContain('left:0mm');
                fronts.push(identity(front[slot]) as (string | number)[]);
            }
        }
        expect(fronts).toEqual(expected);
        expect(2 * selected.readerPage.widthMm).toBe(198);
        expect(selected.trim.widthMm - selected.perforationMm).toBe(198);
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

    it('R37: sits the n stroke guide on the rendered stems within 1 mm (D1)', async () => {
        const { doc } = await render();
        const model = page(doc, 'practice').querySelector('svg.letter-model');
        expect(model, 'The letter model must print.').not.toBeNull();
        const dot = model!.querySelector('[data-part="start-dot"]');
        const arrows = Array.from(model!.querySelectorAll('path[data-part="formation-arrow"]'));
        expect(dot, 'The letter model must keep its start dot.').not.toBeNull();
        expect(arrows, 'The letter model must keep its two formation arrows.').toHaveLength(2);
        const dotX = Number(dot!.getAttribute('cx'));
        const downX = Number(arrows[0].getAttribute('d')!.match(/^M\s*([\d.]+)/)![1]);
        const archEndX = Number(arrows[1].getAttribute('d')!.trim().slice(arrows[1].getAttribute('d')!.lastIndexOf('L') + 1).trim().split(/[\s,]+/)[0]);
        // Isolate the letter glyph (the text) so the raster holds no guide stroke.
        const style = doc.querySelector('style')!.textContent ?? '';
        const letter = model!.querySelector('text[data-part="letter"]')!;
        expect(letter, 'The model letter must print as an SVG text.').not.toBeNull();
        const isolatedSvg = `<svg class="letter-model" viewBox="${model!.getAttribute('viewBox')}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><text class="model-letter" x="${letter.getAttribute('x')}" y="${letter.getAttribute('y')}" text-anchor="middle" fill="#000">${text(letter)}</text></svg>`;
        const file = buildPdfx(isolateMeasurementHtml('d1', style, isolatedSvg));
        const { width, height, data } = await rasterPage(file, 1, 300);
        const unitPx = 46 * MM_PX_300 / 100; // .letter-model is 46 mm wide for a 100-unit viewBox
        let minX = width, maxX = -1, minY = height, maxY = -1;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[y * width + x] < 128) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        expect(maxX, 'The isolated n must render ink.').toBeGreaterThanOrEqual(0);
        const bandTop = maxY - Math.round((maxY - minY) * 0.25);
        const bandHeight = maxY - bandTop + 1;
        const counts = new Int32Array(width);
        for (let y = bandTop; y <= maxY; y++) for (let x = minX; x <= maxX; x++) if (data[y * width + x] < 128) counts[x]++;
        const threshold = Math.max(1, Math.round(bandHeight * 0.5));
        const runs: { left: number; right: number }[] = [];
        let runStart = -1;
        for (let x = minX; x <= maxX; x++) {
            if (counts[x] >= threshold) { if (runStart < 0) runStart = x; }
            else if (runStart >= 0) { runs.push({ left: runStart, right: x - 1 }); runStart = -1; }
        }
        if (runStart >= 0) runs.push({ left: runStart, right: maxX });
        expect(runs, 'The isolated n must expose exactly two vertical stems.').toHaveLength(2);
        const leftStem = (runs[0].left + runs[0].right) / 2;
        const rightStem = (runs[1].left + runs[1].right) / 2;
        expect(Math.abs(downX * unitPx - leftStem), 'The down line must sit on the left stem within 1 mm.').toBeLessThanOrEqual(MM_PX_300);
        expect(Math.abs(dotX * unitPx - leftStem), 'The start dot must sit on the left stem within 1 mm.').toBeLessThanOrEqual(MM_PX_300);
        expect(Math.abs(archEndX * unitPx - rightStem), 'The arch must meet the right stem within 1 mm.').toBeLessThanOrEqual(MM_PX_300);
    }, 230000);

    it('R38: gives every trace item a start dot (D2)', async () => {
        const { doc } = await render();
        const box = part(page(doc, 'practice'), 'letter-box');
        const cells = Array.from(box.querySelectorAll('.trace-cell'));
        expect(cells, 'Three copies to trace and one write space.').toHaveLength(4);
        for (let i = 0; i < 3; i++) {
            expect(cells[i].querySelector('[data-part="trace-letter"]'), `Cell ${i + 1} traces a letter.`).not.toBeNull();
            expect(cells[i].querySelector('[data-part="start-dot"], [data-part="trace-dot"]'),
                `Trace copy ${i + 1} must hold a start dot.`).not.toBeNull();
        }
        expect(cells[3].querySelector('[data-part="trace-letter"]'), 'The fourth cell stays empty for writing.').toBeNull();
        expect(cells[3].querySelector('[data-part="start-dot"], [data-part="trace-dot"]'), 'The write space has no dot.').toBeNull();
        const writing = page(doc, 'writing');
        const dictWord = writing.querySelector('[data-part="dictation-word"]');
        expect(dictWord, 'The dictation trace word prints.').not.toBeNull();
        expect(dictWord!.parentElement!.querySelector('[data-part="start-dot"], [data-part="trace-dot"]') ?? dictWord!.querySelector('[data-part="start-dot"], [data-part="trace-dot"]'),
            'The dictation trace word must hold a start dot.').not.toBeNull();
        expect(writing.querySelector('[data-part="writing-trace"] [data-part="start-dot"], [data-part="writing-trace"] [data-part="trace-dot"]'),
            'The writing trace text must hold a start dot.').not.toBeNull();
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

    it('R38: prints a black start dot on each letter copy (D2)', async () => {
        const { doc } = await render();
        const style = doc.querySelector('style')!.textContent ?? '';
        const box = part(page(doc, 'practice'), 'letter-box');
        const traceRow = box.querySelector('.trace-row')!;
        expect(traceRow, 'The trace row prints.').not.toBeNull();
        const file = buildPdfx(isolateMeasurementHtml('d2-dots', style, traceRow.outerHTML));
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

    it('R40: mirrors the horizontal cut line with the strip parity (D4)', async () => {
        const { html, doc } = await render();
        const file = buildPdfx(html);
        const readerSides = pages(doc).map((side, index) => ({ side, pageNumber: index + 1 }))
            .filter(({ side }) => side.getAttribute('data-page-kind') === 'reader');
        expect(readerSides, 'Three reader leaves.').toHaveLength(6);
        const front = readerSides[0], back = readerSides[1];
        expect(front.pageNumber % 2, 'The first reader side is a front.').toBe(1);
        expect(back.pageNumber, 'The back follows the front.').toBe(front.pageNumber + 1);
        const frontRaster = await rasterPage(file, front.pageNumber, 300);
        const backRaster = await rasterPage(file, back.pageNumber, 300);
        const frontExtent = cutLineExtent(frontRaster.data, frontRaster.width);
        const backExtent = cutLineExtent(backRaster.data, backRaster.width);
        expect(backExtent.minMm, 'The back cut line starts at the outer edge (x=0).').toBeLessThanOrEqual(3);
        expect(backExtent.maxMm, 'The back cut line reaches the perforation.').toBeGreaterThanOrEqual(195);
        expect(backExtent.maxMm, 'The back cut line never crosses into the bound stub.').toBeLessThanOrEqual(201);
        expect(frontExtent.minMm, 'The front cut line starts at the perforation.').toBeGreaterThanOrEqual(9);
        expect(frontExtent.minMm).toBeLessThanOrEqual(15);
        expect(frontExtent.maxMm, 'The front cut line ends at the outer edge.').toBeGreaterThanOrEqual(207);
    }, 250000);

    it('R41: shows the stroke guide in black on a gray model letter, inside the outline (D5)', async () => {
        const { doc } = await render();
        const style = doc.querySelector('style')!.textContent ?? '';
        const model = page(doc, 'practice').querySelector('svg.letter-model');
        expect(model, 'The letter box must print the model SVG.').not.toBeNull();
        const paths = Array.from(model!.querySelectorAll('path[data-part="formation-arrow"]'), (node) => node.getAttribute('d') ?? '');
        expect(paths, 'The shipped week keeps the down line and the arch.').toHaveLength(2);
        const headDot = model!.querySelector('[data-part="start-dot"]');
        const headDotXy = { x: Number(headDot!.getAttribute('cx')), y: Number(headDot!.getAttribute('cy')) };
        const gapMm = 20;
        const splitMm = 55 + gapMm / 2;
        const secondMm = 55 + gapMm;
        const measurePair = async (top: string, bottom: string, pathList: string[], dotXy: { x: number; y: number }): Promise<GuideRead> => {
            const file = buildPdfx(isolateMeasurementHtml('r41', style, `${top}<div style="height:${gapMm}mm"></div>${bottom}`));
            const raster = await rasterPage(file, 1, 300);
            const split = Math.round(splitMm * MM_PX_300);
            const second = Math.round(secondMm * MM_PX_300);
            expect(raster.height, 'The probe page must hold both letter rasters.').toBeGreaterThan(second + split);
            const full = cropRaster(raster.data, raster.width, 0, split);
            const letter = cropRaster(raster.data, raster.width, second, second + split);
            return readGuide(full.data, letter.data, full.width, letter.height, pathList, dotXy);
        };
        const head = await measurePair(model!.outerHTML, letterOnlySvg(model!.outerHTML), paths, headDotXy);
        const copySvg = guideInsideSvg(model!);
        const copyDoc = new DOMParser().parseFromString(copySvg, 'text/html');
        const copyPaths = Array.from(
            copyDoc.querySelectorAll('path[data-part="formation-arrow"]'),
            (node) => node.getAttribute('d') ?? '',
        );
        const copyDot = copyDoc.querySelector('[data-part="start-dot"]');
        const copyDotXy = { x: Number(copyDot!.getAttribute('cx')), y: Number(copyDot!.getAttribute('cy')) };
        const copyFile = path.join(temporaryFolder(), 'r41-guide-inside.html');
        const copyHtml = isolateMeasurementHtml('r41-copy', style, `${copySvg}<div style="height:${gapMm}mm"></div>${letterOnlySvg(copySvg)}`);
        fs.writeFileSync(copyFile, copyHtml);
        const copy = await measurePair(copySvg, letterOnlySvg(copySvg), copyPaths, copyDotXy);
        const wanted = {
            letterInBand: true, downCovered: true, archCovered: true, arrowsShown: true, guideInside: true,
            dotAtTop: true, downSpansStem: true, archAtBottom: true,
        };
        const gapLog = (read: GuideRead): string => `dotTopGap=${read.dotTopGapMm.toFixed(2)}mm downTopGap=${read.downTopGapMm.toFixed(2)}mm downBottomGap=${read.downBottomGapMm.toFixed(2)}mm archBottomGap=${read.archBottomGapMm.toFixed(2)}mm dotBlack=${read.dotBlack}`;
        console.info(`R41 HEAD letterMedian=${head.letterMedian} downFraction=${head.downFraction.toFixed(2)} archFraction=${head.archFraction.toFixed(2)} arrowWings=${head.arrowWings} outsidePx=${head.outsidePx} ${gapLog(head)}`);
        console.info(`R41 COPY letterMedian=${copy.letterMedian} downFraction=${copy.downFraction.toFixed(2)} archFraction=${copy.archFraction.toFixed(2)} arrowWings=${copy.arrowWings} outsidePx=${copy.outsidePx} ${gapLog(copy)} file=${copyFile}`);
        expect(guideContract(copy), 'A gray letter with the guide at the stem top and inside the outline can pass R41.').toEqual(wanted);
        expect(guideContract(head), 'D5: the guide is black on the black model letter. The down line and the arrowheads do not show.').toEqual(wanted);
    }, 500000);
});
