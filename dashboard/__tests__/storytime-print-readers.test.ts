// @vitest-environment jsdom
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';

/** Phase 4 contract. New modules load inside each test so missing modules fail independently. */
type ReaderApi = {
    compileStorytimeReaders: (weeks: StorytimeWeek[], options: { profile: typeof STORYTIME_PRINT_PROFILE; mode: 'proof' | 'final'; output: 'workbook' | 'a3-color' }) => { html: string };
};
type PictureApi = {
    checkStorytimePicture: (colorFile: string, lineFile: string, manifest: unknown, row: unknown, options?: { grayPixelThreshold?: number }) => Promise<unknown>;
    DEFAULT_GRAY_PIXEL_THRESHOLD: number;
};
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const readerPath = path.join(dashboardRoot, 'lib/storytime/print/readers.ts');
const picturePath = path.join(dashboardRoot, 'lib/storytime/print/picture-check.ts');
const cliPath = path.join(dashboardRoot, 'scripts/storytime/make-readers-pdf.ts');
const scratch: string[] = [];
function shipped(): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')));
}
function temp(): string {
    const dir = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-readers-'));
    scratch.push(dir);
    return dir;
}
async function readers(): Promise<ReaderApi> {
    expect(fs.existsSync(readerPath), 'Missing module: lib/storytime/print/readers.ts').toBe(true);
    return await import(readerPath) as ReaderApi;
}
async function pictureCheck(): Promise<PictureApi> {
    expect(fs.existsSync(picturePath), 'Missing module: lib/storytime/print/picture-check.ts').toBe(true);
    return await import(picturePath) as PictureApi;
}
afterAll(() => scratch.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

describe('Storytime readers: shipped week 1, P15 default', () => {
    it('exports the reader compiler without a collection-time import', async () => {
        const api = await readers();
        expect(api.compileStorytimeReaders).toBeTypeOf('function');
    });

    it('R-P4-1 lays out each shipped reader as 12 pages at the P15 99 × 140 mm trim', async () => {
        const api = await readers();
        const result = api.compileStorytimeReaders([shipped()], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook' });
        const doc = new DOMParser().parseFromString(result.html, 'text/html');
        for (const title of ['Hello!', 'Nan Can Nod']) {
            const pages = Array.from(doc.querySelectorAll(`[data-reader-title="${title}"] [data-reader-page]`));
            expect(pages, `${title}: 12 pages`).toHaveLength(12);
            for (const page of pages) {
                expect(Number(page.getAttribute('data-width-mm'))).toBe(99);
                expect(Number(page.getAttribute('data-height-mm'))).toBe(140);
            }
        }
        expect(STORYTIME_PRINT_PROFILE.readerPage).toEqual({ widthMm: 99, heightMm: 140 });
    });

    it('R-P4-2 imposes page pairs, strip marks, parity perforations, cut line, and duplex registration', async () => {
        const api = await readers();
        const doc = new DOMParser().parseFromString(api.compileStorytimeReaders([shipped()], {
            profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook',
        }).html, 'text/html');
        const strips = Array.from(doc.querySelectorAll('[data-reader-strip]'));
        expect(strips).toHaveLength(12);
        const expected = [['12/1', '2/11'], ['10/3', '4/9'], ['8/5', '6/7']];
        const leaves = Array.from(doc.querySelectorAll('[data-reader-leaf]'));
        expect(leaves).toHaveLength(3);
        for (let i = 0; i < leaves.length; i++) {
            const front = leaves[i].querySelector('[data-leaf-side="front"]');
            const back = leaves[i].querySelector('[data-leaf-side="back"]');
            expect(front?.querySelectorAll('[data-reader-strip]')).toHaveLength(2);
            expect(back?.querySelectorAll('[data-reader-strip]')).toHaveLength(2);
            expect(front?.getAttribute('data-page-pairs')).toBe(expected[i][0]);
            expect(back?.getAttribute('data-page-pairs')).toBe(expected[i][1]);
            const frontSlots = Array.from(front!.querySelectorAll('[data-reader-strip]'), (s) => s.getAttribute('data-slot'));
            const backSlots = Array.from(back!.querySelectorAll('[data-reader-strip]'), (s) => s.getAttribute('data-slot'));
            expect(backSlots).toEqual(frontSlots); // long-edge duplex flip
            for (const side of [front!, back!]) {
                expect(side.querySelector('[data-part="perforation"]')?.getAttribute('data-distance-mm')).toBe('12');
                expect(side.querySelector('[data-part="cut-line"]')?.getAttribute('data-position-mm')).toBe('148.5');
                expect(Array.from(side.querySelectorAll('[data-reader-strip]')).every((s) => s.querySelector('[data-part="strip-mark"]'))).toBe(true);
            }
        }
        // P15 geometry: two 99 mm pages use the 198 mm leaf after the 12 mm spine tear.
        for (const strip of strips) expect(Number(strip.getAttribute('data-width-mm'))).toBe(2 * STORYTIME_PRINT_PROFILE.readerPage.widthMm);
        expect(2 * STORYTIME_PRINT_PROFILE.readerPage.widthMm).toBe(210 - STORYTIME_PRINT_PROFILE.perforationMm);
    });

    it('R-P4-3 preserves story text, decodable sounds, back words, and reader cover copy', async () => {
        const api = await readers();
        const week = shipped();
        const doc = new DOMParser().parseFromString(api.compileStorytimeReaders([week], {
            profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook',
        }).html, 'text/html');
        for (const book of week.books) {
            const root = doc.querySelector(`[data-reader-title="${book.title}"]`)!;
            expect(root).not.toBeNull();
            for (const page of book.pages) expect(root.textContent).toContain(page.text);
            for (const word of book.backWords) expect(root.textContent).toContain(word);
            expect(root.textContent).toContain(book.title);
            expect(root.textContent).toContain('Sprout');
            expect(root.textContent).toContain('Storytime Advantage');
            expect(root.textContent).toContain('Week 1');
            if (book.kind === 'decodable') for (const text of ['Sounds in this book', 'n', 'nest', 'net', 'nut', 'a', 'and', 'can']) expect(root.textContent).toContain(text);
        }
    });

    it('R-P4-4 makes two 12-page color A3 outputs and exposes proof placeholders', async () => {
        const api = await readers();
        for (const book of shipped().books) {
            const doc = new DOMParser().parseFromString(api.compileStorytimeReaders([shipped()], {
                profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'a3-color',
            }).html, 'text/html');
            const pages = doc.querySelectorAll(`[data-reader-title="${book.title}"] [data-a3-page]`);
            expect(pages).toHaveLength(12);
            for (const page of pages) expect(page.getAttribute('data-page-size')).toBe('841.89 x 1190.55 pts (A3)');
            expect(doc.body.textContent).toContain('PICTURE MISSING');
            expect(doc.documentElement.outerHTML).not.toContain('PDFX');
        }
    });

    it('R-P4-5 final mode rejects a missing image by picture id and proof mode keeps a placeholder', async () => {
        const api = await readers();
        const week = shipped();
        expect(() => api.compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output: 'workbook' }))
            .toThrow(/picture missing: .*l2-w01/);
        const proof = api.compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook' });
        expect(proof.html).toContain('PICTURE MISSING');
    });

    it('R-P4-6 exposes the readers PDF CLI help', async () => {
        expect(fs.existsSync(cliPath), 'Missing script: scripts/storytime/make-readers-pdf.ts').toBe(true);
        const { execFileSync } = await import('node:child_process');
        expect(execFileSync(process.execPath, ['--import', 'tsx', cliPath, '--help'], { encoding: 'utf8' })).toContain('make-readers-pdf.ts');
    }, 30_000);
});

describe('Storytime two-output picture check', () => {
    it('R-P4-7 accepts known-good color and line-art fixtures and sets its threshold from the good fixture', async () => {
        const sharp = (await import('sharp')).default;
        const dir = temp();
        const color = path.join(dir, 'l2-w01-story-page-good-v1.png');
        const line = path.join(dir, 'l2-w01-story-page-good-line-v1.png');
        await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#ffffff' } }).png().toFile(color);
        await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#ffffff' } }).greyscale().png().toFile(line);
        const api = await pictureCheck();
        expect(api.DEFAULT_GRAY_PIXEL_THRESHOLD).toBeGreaterThan(0);
        expect(api.DEFAULT_GRAY_PIXEL_THRESHOLD).toBeLessThanOrEqual(0.02);
        const row = { fileName: path.basename(color), lineArtFileName: path.basename(line), width: 4000, height: 3000 };
        const manifest = [{ fileName: path.basename(color), sha256: createHash('sha256').update(fs.readFileSync(color)).digest('hex'), pixelSize: { width: 4000, height: 3000 } }];
        expect(await api.checkStorytimePicture(color, line, manifest, row)).toBeDefined();
    }, 30_000);

    it('R-P4-8 rejects bad dimensions, alpha, CMYK, color in line-art place, and wrong names', async () => {
        const api = await pictureCheck();
        const sharp = (await import('sharp')).default;
        const dir = temp();
        const expected = path.join(dir, 'l2-w01-story-page-x-v1.png');
        const line = path.join(dir, 'l2-w01-story-page-x-line-v1.png');
        const small = path.join(dir, 'small.png');
        const alpha = path.join(dir, 'alpha.png');
        const cmyk = path.join(dir, 'cmyk.tif');
        await sharp({ create: { width: 3000, height: 2250, channels: 3, background: '#fff' } }).png().toFile(small);
        await sharp({ create: { width: 4000, height: 3000, channels: 4, background: '#fff' } }).png().toFile(alpha);
        await sharp({ create: { width: 4000, height: 3000, channels: 4, background: '#fff' } }).toColourspace('cmyk').tiff().toFile(cmyk);
        await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#fff' } }).png().toFile(expected);
        await fs.promises.copyFile(expected, line);
        const row = { fileName: path.basename(expected), lineArtFileName: path.basename(line), width: 4000, height: 3000 };
        for (const candidate of [small, alpha, cmyk]) await expect(api.checkStorytimePicture(candidate, line, [], row)).rejects.toThrow();
        await expect(api.checkStorytimePicture(expected, expected, [], row)).rejects.toThrow();
        await expect(api.checkStorytimePicture(expected, line, [], { ...row, fileName: 'wrong.png' })).rejects.toThrow();
    }, 30_000);

    it('R-P4-9 rejects gray-filled line art and checks manifest name, SHA-256, and pixel size', async () => {
        const api = await pictureCheck();
        const sharp = (await import('sharp')).default;
        const dir = temp();
        const color = path.join(dir, 'l2-w01-story-page-x-v1.png');
        const good = path.join(dir, 'l2-w01-story-page-x-line-v1.png');
        const bad = path.join(dir, 'bad-line.png');
        await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#ffffff' } }).png().toFile(color);
        await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#ffffff' } }).greyscale().png().toFile(good);
        await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#808080' } }).greyscale().png().toFile(bad);
        const row = { fileName: path.basename(color), lineArtFileName: path.basename(good), width: 4000, height: 3000 };
        const entry = { fileName: path.basename(color), sha256: createHash('sha256').update(fs.readFileSync(color)).digest('hex'), pixelSize: { width: 4000, height: 3000 } };
        await expect(api.checkStorytimePicture(color, bad, [entry], row)).rejects.toThrow();
        for (const manifest of [[], [{ ...entry, fileName: 'not-in-list.png' }], [{ ...entry, pixelSize: { width: 3000, height: 2250 } }]]) {
            await expect(api.checkStorytimePicture(color, good, manifest, row)).rejects.toThrow();
        }
    }, 30_000);
});
