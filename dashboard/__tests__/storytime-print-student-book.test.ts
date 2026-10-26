// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
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

async function render(week = shipped(), selectedProfile?: PrintProfile): Promise<{ html: string; doc: Document }> {
    expect(fs.existsSync(studentModule), 'Missing module: lib/storytime/print/student-book.ts').toBe(true);
    const exports = await import(studentModule) as StudentModule;
    expect(exports.compileStorytimeStudentBook, 'Export compileStorytimeStudentBook.').toBeTypeOf('function');
    const { html } = await exports.compileStorytimeStudentBook([week], {
        profile: selectedProfile ?? await profile(), mode: 'proof',
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

/** Build the rendered HTML, not a prepared PDF. The outer timeout kills the child process group. */
function buildPdfx(html: string): string {
    requireHeavyWrapper();
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
            ${JSON.stringify(chromeFile)}, '--out', ${JSON.stringify(pdfxFile)}, '--keep-fonts'],
            { stdio: 'inherit', timeout: 45000 });
    `;
    execFileSync('timeout', ['--signal=TERM', '--kill-after=3s', '180s', process.execPath,
        '--import', 'tsx', '--input-type=module', '-e', script], {
        cwd: dashboardRoot, encoding: 'utf8', timeout: 185000, maxBuffer: 8 * 1024 * 1024,
    });
    expect(fs.existsSync(pdfxFile), 'The real PDF/X output must exist.').toBe(true);
    return pdfxFile;
}

afterEach(() => {
    for (const folder of temporaryFolders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
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
        expect(texts(dictation, '[data-part="dictation-letter"]')).toEqual(['n', 'n', 'n']);
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
        expect(text(part(front, 'home-line'))).toBe(week.home.line.th);
        expect(text(part(front, 'home-sound'))).toBe('/n/');
        expect(texts(front, '[data-part="home-word"]')).toEqual(['net', 'nut', 'nose']);
        expect(text(part(front, 'home-frame'))).toBe('Hello, I am ___.');
        expect(text(part(front, 'home-activity'))).toBe(week.home.activity.th);
        expect(text(part(front, 'home-frame'))).toBe(week.focus.frame);
    });

    it('R27: gives the two real QR generators the S23 song and read-along inputs (P4)', async () => {
        const week = shipped();
        const { doc } = await render(week);
        const codes = Array.from(page(doc, 'home-front').querySelectorAll('[data-qr-input]'));
        expect(STORYTIME_QR_HOST).toBe('https://storytime.reading-advantage.com');
        expect(codes.map((code) => code.getAttribute('data-qr-input'))).toEqual([
            storytimeQrUrl(week.home.songUrl), storytimeQrUrl(week.home.readAlongUrl),
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
        expect(text(part(back, 'home-line'))).toBe(week.home.line.en);
        expect(text(part(back, 'home-activity'))).toBe(week.home.activity.en);
        expect(texts(back, '[data-part="home-word"]')).toEqual(['net', 'nut', 'nose']);
        expect(text(part(back, 'home-frame'))).toBe(week.focus.frame);
        expect(texts(back, '[data-part="song-line"]')).toHaveLength(15);
        expect(texts(back, '[data-part="song-line"]')).toEqual(week.song!.lines.map((line) => line.text));
        assertHomeLeaf(doc);
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
        expect(thai.map(text).join(' ')).toContain(shipped().home.line.th.split(' ')[0]);
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
});
