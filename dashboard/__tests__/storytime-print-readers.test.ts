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
    checkStorytimePicture: (colorFile: string, lineFile: string, manifest: unknown, row: unknown, options?: { grayPixelThreshold?: number; pictureListFileNames?: string[] }) => Promise<unknown>;
    DEFAULT_GRAY_PIXEL_THRESHOLD: number;
    forgeManifestEntriesForRow: (manifest: unknown, row: unknown) => Array<{ fileName: string; rowId: string; sha256: string; pixelSize: { width: number; height: number } }>;
    checkStorytimePictureBatch: (rows: unknown[], batchFolder: string) => Promise<{ results: Array<{ rowId: string; status: string }>; exitCode: number }>;
};
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const readerPath = path.join(dashboardRoot, 'lib/storytime/print/readers.ts');
const picturePath = path.join(dashboardRoot, 'lib/storytime/print/picture-check.ts');
const cliPath = path.join(dashboardRoot, 'scripts/storytime/make-readers-pdf.ts');
const pictureBatchCliPath = path.join(dashboardRoot, 'scripts/storytime/check-storytime-pictures.ts');
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
        const expected = [
            [
                { title: 'Hello!', strip: 1, front: [12, 1], back: [2, 11] },
                { title: 'Hello!', strip: 2, front: [10, 3], back: [4, 9] },
            ],
            [
                { title: 'Hello!', strip: 3, front: [8, 5], back: [6, 7] },
                { title: 'Nan Can Nod', strip: 1, front: [12, 1], back: [2, 11] },
            ],
            [
                { title: 'Nan Can Nod', strip: 2, front: [10, 3], back: [4, 9] },
                { title: 'Nan Can Nod', strip: 3, front: [8, 5], back: [6, 7] },
            ],
        ];
        // Default: the front of each reader leaf is a right page, so its spine is left.
        // The duplex back is a left page, so its spine is right.
        const leaves = Array.from(doc.querySelectorAll('[data-reader-leaf]'));
        expect(leaves).toHaveLength(3);
        for (let i = 0; i < leaves.length; i++) {
            const front = leaves[i].querySelector('[data-leaf-side="front"]');
            const back = leaves[i].querySelector('[data-leaf-side="back"]');
            expect(front?.querySelectorAll('[data-reader-strip]')).toHaveLength(2);
            expect(back?.querySelectorAll('[data-reader-strip]')).toHaveLength(2);
            const frontStrips = Array.from(front!.querySelectorAll('[data-reader-strip]'));
            const backStrips = Array.from(back!.querySelectorAll('[data-reader-strip]'));
            expect(Array.from(frontStrips, (strip) => strip.getAttribute('data-slot'))).toEqual(['top', 'bottom']);
            expect(Array.from(backStrips, (strip) => strip.getAttribute('data-slot'))).toEqual(['top', 'bottom']);
            for (let slot = 0; slot < 2; slot++) {
                const contract = expected[i][slot];
                const frontStrip = frontStrips[slot];
                const backStrip = backStrips[slot];
                const identity = (strip: Element) => {
                    const mark = strip.querySelector('[data-part="strip-mark"]')?.textContent ?? '';
                    return [strip.getAttribute('data-reader-title'), Number(mark.match(/strip (\d+) of 3/)?.[1])];
                };
                expect(identity(frontStrip)).toEqual([contract.title, contract.strip]);
                expect(identity(backStrip)).toEqual(identity(frontStrip));
                const pageNumbers = (strip: Element) => Array.from(strip.querySelectorAll('[data-reader-page]'), (page) => Number(page.getAttribute('data-page-number')));
                expect(pageNumbers(frontStrip)).toEqual(contract.front);
                expect(pageNumbers(backStrip)).toEqual(contract.back);
            }
            for (const side of [front!, back!]) {
                const mark = side.querySelector('[data-part="perforation"]');
                expect(mark?.getAttribute('data-distance-mm')).toBe('12');
                expect(mark?.getAttribute('data-spine-edge')).toBe(side === front ? 'left' : 'right');
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
            const parts = Array.from(doc.querySelectorAll(`[data-reader-title="${book.title}"]`));
            expect(parts.length, `${book.title}: all imposition strips exist`).toBeGreaterThan(0);
            const readerText = parts.map((part) => part.textContent ?? '').join('\n');
            for (const page of book.pages) expect(readerText).toContain(page.text);
            for (const word of book.backWords) expect(readerText).toContain(word);
            expect(readerText).toContain(book.title);
            expect(readerText).toContain('Sprout');
            expect(readerText).toContain('Storytime Advantage');
            expect(readerText).toContain('Week 1');
            if (book.kind === 'decodable') for (const text of ['Sounds in this book', 'n', 'nest', 'net', 'nut', 'a', 'and', 'can']) expect(readerText).toContain(text);
        }
    });

    it('R-P4-4 makes two 12-page color A3 outputs and exposes proof placeholders', async () => {
        const api = await readers();
        const week = shipped();
        const colorDoc = new DOMParser().parseFromString(api.compileStorytimeReaders([week], {
            profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'a3-color',
        }).html, 'text/html');
        const workbookDoc = new DOMParser().parseFromString(api.compileStorytimeReaders([week], {
            profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook',
        }).html, 'text/html');
        for (const book of week.books) {
            const pages = colorDoc.querySelectorAll(`[data-reader-title="${book.title}"] [data-a3-page]`);
            expect(pages).toHaveLength(12);
            for (const page of pages) expect(page.getAttribute('data-page-size')).toBe('841.89 x 1190.55 pts (A3)');
            expect(colorDoc.body.textContent).toContain('PICTURE MISSING');
            expect(colorDoc.documentElement.outerHTML).not.toContain('PDFX');
            const colorPictures = Array.from(colorDoc.querySelectorAll(`[data-reader-title="${book.title}"] [data-picture-id]`));
            const workbookPictures = Array.from(workbookDoc.querySelectorAll(`[data-reader-title="${book.title}"] [data-picture-id]`));
            expect(colorPictures.length).toBeGreaterThan(0);
            expect(workbookPictures.length).toBe(colorPictures.length);
            const colorById = new Map<string, Element[]>();
            const workbookById = new Map<string, Element[]>();
            for (const [pictures, byId] of [[colorPictures, colorById], [workbookPictures, workbookById]] as const) {
                for (const picture of pictures) {
                    const pictureId = picture.getAttribute('data-picture-id');
                    expect(pictureId, 'Each reader picture has an id.').not.toBeNull();
                    const matches = byId.get(pictureId!) ?? [];
                    matches.push(picture);
                    byId.set(pictureId!, matches);
                }
            }
            expect([...colorById.keys()].sort()).toEqual([...workbookById.keys()].sort());
            for (const pictureId of colorById.keys()) {
                for (const picture of colorById.get(pictureId) ?? []) {
                    expect(picture.getAttribute('data-picture-file')).not.toMatch(/-line-v\d+\.png$/);
                    expect(picture.getAttribute('data-picture-file')).toMatch(/-v\d+\.png$/);
                }
                for (const picture of workbookById.get(pictureId) ?? []) expect(picture.getAttribute('data-picture-file')).toMatch(/-line-v\d+\.png$/);
            }
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

    it('R-P4-13 preflights every requested final reader picture before creating outputs or rendering', () => {
        const source = fs.readFileSync(cliPath, 'utf8');
        const preflight = source.indexOf('preflightStorytimeReaderPictures(parsed');
        const folderWrite = source.indexOf('fs.mkdirSync(folder');
        const firstRender = source.indexOf('renderHtml(');
        expect(preflight, 'The final build calls the picture preflight.').toBeGreaterThan(-1);
        expect(preflight, 'The preflight runs before output folder creation.').toBeLessThan(folderWrite);
        expect(preflight, 'The preflight runs before the first render.').toBeLessThan(firstRender);
        expect(source.slice(preflight, folderWrite)).toContain('mode');
    });
});

describe('Storytime two-output picture check', () => {
    async function pngFixtures(dir: string): Promise<{ color: string; line: string; gray: string; row: { fileName: string; lineArtFileName: string; width: number; height: number }; manifest: Array<{ fileName: string; sha256: string; pixelSize: { width: number; height: number } }> }> {
        const sharp = (await import('sharp')).default;
        const color = path.join(dir, 'l2-w01-story-page-good-v1.png');
        const line = path.join(dir, 'l2-w01-story-page-good-line-v1.png');
        const gray = path.join(dir, 'gray-line.png');
        await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#ffffff' } }).png().toFile(color);
        const art = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="3000" viewBox="0 0 4000 3000"><rect width="4000" height="3000" fill="white"/><path d="M500 1500 C1000 800 1800 800 2200 1500 C2600 2200 3300 2200 3500 1500" fill="none" stroke="black" stroke-width="24"/><circle cx="2000" cy="1500" r="340" fill="none" stroke="black" stroke-width="24"/></svg>');
        await sharp(art).greyscale().png().toFile(line);
        await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#808080' } }).greyscale().png().toFile(gray);
        const row = { fileName: path.basename(color), lineArtFileName: path.basename(line), width: 4000, height: 3000 };
        const manifest = [color, line].map((file) => ({ fileName: path.basename(file), sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'), pixelSize: { width: 4000, height: 3000 } }));
        return { color, line, gray, row, manifest };
    }

    it('R-P4-7 accepts known-good color and line-art fixtures and sets its threshold from the good fixture', async () => {
        const sharp = (await import('sharp')).default;
        const dir = temp();
        const fixture = await pngFixtures(dir);
        const raster = await sharp(fixture.line).greyscale().raw().toBuffer();
        const grayFraction = raster.filter((value: number) => value >= 32 && value <= 223).length / raster.length;
        const filledRaster = await sharp(fixture.gray).greyscale().raw().toBuffer();
        const filledFraction = filledRaster.filter((value: number) => value >= 32 && value <= 223).length / filledRaster.length;
        expect(grayFraction).toBeCloseTo(0.00070225, 8);
        const api = await pictureCheck();
        expect(api.DEFAULT_GRAY_PIXEL_THRESHOLD).toBe(0.02);
        expect(grayFraction).toBeLessThan(api.DEFAULT_GRAY_PIXEL_THRESHOLD);
        expect(filledFraction).toBeGreaterThan(api.DEFAULT_GRAY_PIXEL_THRESHOLD);
        await expect(api.checkStorytimePicture(fixture.color, fixture.line, fixture.manifest, fixture.row)).resolves.toBeTruthy();
    }, 30_000);

    it('R-P4-8 rejects bad dimensions, alpha, CMYK, color in line-art place, and wrong names', async () => {
        const api = await pictureCheck();
        const sharp = (await import('sharp')).default;
        const dir = temp();
        const fixture = await pngFixtures(dir);
        const variants = path.join(dir, 'variants');
        const smallDir = path.join(variants, 'small');
        const alphaDir = path.join(variants, 'alpha');
        const cmykDir = path.join(variants, 'cmyk');
        const lineDir = path.join(variants, 'line');
        for (const folder of [smallDir, alphaDir, cmykDir, lineDir]) fs.mkdirSync(folder, { recursive: true });
        const small = path.join(smallDir, fixture.row.fileName);
        const alpha = path.join(alphaDir, fixture.row.fileName);
        const cmyk = path.join(cmykDir, fixture.row.fileName);
        const colorInLinePlace = path.join(lineDir, fixture.row.lineArtFileName);
        await sharp({ create: { width: 3000, height: 2250, channels: 3, background: '#fff' } }).png().toFile(small);
        await sharp({ create: { width: 4000, height: 3000, channels: 4, background: '#fff' } }).png().toFile(alpha);
        await sharp({ create: { width: 4000, height: 3000, channels: 4, background: '#fff' } }).toColourspace('cmyk').tiff().toFile(cmyk);
        await fs.promises.copyFile(fixture.color, colorInLinePlace);
        const hash = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
        const entries = (colorFile: string, lineFile: string, colorWidth = 4000, colorHeight = 3000) => [
            { fileName: fixture.row.fileName, sha256: hash(colorFile), pixelSize: { width: colorWidth, height: colorHeight } },
            { fileName: fixture.row.lineArtFileName, sha256: hash(lineFile), pixelSize: { width: 4000, height: 3000 } },
        ];
        await expect(api.checkStorytimePicture(small, fixture.line, entries(small, fixture.line, 3000, 2250), fixture.row)).rejects.toThrow(/size|dimension|pixel/i);
        await expect(api.checkStorytimePicture(alpha, fixture.line, entries(alpha, fixture.line), fixture.row)).rejects.toThrow(/alpha|channel/i);
        await expect(api.checkStorytimePicture(cmyk, fixture.line, entries(cmyk, fixture.line), fixture.row)).rejects.toThrow(/CMYK|colourspace|color space/i);
        await expect(api.checkStorytimePicture(fixture.color, colorInLinePlace, entries(fixture.color, colorInLinePlace), fixture.row)).rejects.toThrow(/line.art|grayscale|greyscale|channel/i);
        await expect(api.checkStorytimePicture(fixture.color, fixture.line, entries(fixture.color, fixture.line), { ...fixture.row, fileName: 'wrong.png' })).rejects.toThrow(/file name|filename|manifest/i);
        await expect(api.checkStorytimePicture(fixture.color, fixture.line, fixture.manifest, fixture.row)).resolves.toBeTruthy();
    }, 30_000);

    it('R-P4-9 rejects gray-filled line art and checks manifest name, SHA-256, and pixel size', async () => {
        const api = await pictureCheck();
        const dir = temp();
        const fixture = await pngFixtures(dir);
        const goodEntries = fixture.manifest;
        const lineEntry = goodEntries.find((entry) => entry.fileName === path.basename(fixture.line))!;
        await expect(api.checkStorytimePicture(fixture.color, fixture.gray, goodEntries, fixture.row)).rejects.toThrow(/gray|fill|shading|pixels/i);
        const otherRow = { ...goodEntries[0], fileName: 'known-other-row.png' };
        await expect(api.checkStorytimePicture(fixture.color, fixture.line, [...goodEntries, otherRow], fixture.row,
            { pictureListFileNames: [fixture.row.fileName, fixture.row.lineArtFileName, otherRow.fileName] })).resolves.toBeTruthy();
        await expect(api.checkStorytimePicture(fixture.color, fixture.line, [...goodEntries, { ...goodEntries[0], fileName: 'not-in-list.png' }], fixture.row,
            { pictureListFileNames: [fixture.row.fileName, fixture.row.lineArtFileName, otherRow.fileName] })).rejects.toThrow(/manifest|list|file name|filename/i);
        await expect(api.checkStorytimePicture(fixture.color, fixture.line, [{ ...goodEntries[0], sha256: '0'.repeat(64) }, lineEntry], fixture.row)).rejects.toThrow(/SHA.?256|hash|digest/i);
        await expect(api.checkStorytimePicture(fixture.color, fixture.line, [{ ...goodEntries[0], pixelSize: { width: 3000, height: 2250 } }, lineEntry], fixture.row)).rejects.toThrow(/pixel|size|dimension/i);
    }, 30_000);

    it('R-P4-11 adapts selected Forge candidate color and line-art files into per-row manifest facts', async () => {
        const api = await pictureCheck();
        const dir = temp();
        const fixture = await pngFixtures(dir);
        const row = { ...fixture.row, id: 'story-row-17', week: 1, bookKind: 'readalong', page: 3 };
        const manifest = {
            version: 1,
            batchHashAlgorithm: 'sha256',
            jobs: [{
                id: row.id, week: 1, bookKind: 'readalong', page: 3, selectedVersion: 2,
                selectedFile: path.basename(fixture.color), selectedSha256: fixture.manifest[0].sha256, status: 'selected',
                candidates: [{
                    version: 2, file: path.basename(fixture.color), fileSha256: fixture.manifest[0].sha256,
                    structural: { valid: true, width: 4000, height: 3000, sha256: fixture.manifest[0].sha256, errors: [] },
                    lineArt: { file: path.basename(fixture.line), fileSha256: fixture.manifest[1].sha256, colorFile: path.basename(fixture.color), status: 'selected', structural: { width: 4000, height: 3000 } },
                }],
            }],
            batches: [],
        };
        const facts = api.forgeManifestEntriesForRow(manifest, row);
        expect(facts).toEqual([
            { fileName: path.basename(fixture.color), rowId: row.id, sha256: fixture.manifest[0].sha256, pixelSize: { width: 4000, height: 3000 } },
            { fileName: path.basename(fixture.line), rowId: row.id, sha256: fixture.manifest[1].sha256, pixelSize: { width: 4000, height: 3000 } },
        ]);
    }, 30_000);

    it('R-P4-12 checks every week-one row in a batch and returns a failure for each missing file', async () => {
        const api = await pictureCheck();
        const dir = temp();
        const fixture = await pngFixtures(dir);
        const row = { id: 'story-row-17', fileName: path.basename(fixture.color), lineArtFileName: path.basename(fixture.line), width: 4000, height: 3000, week: 1 };
        const missing = { ...row, id: 'missing-row', fileName: 'missing-v1.png', lineArtFileName: 'missing-line-v1.png' };
        const colorHash = createHash('sha256').update(fs.readFileSync(fixture.color)).digest('hex');
        const lineHash = createHash('sha256').update(fs.readFileSync(fixture.line)).digest('hex');
        fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
            version: 1,
            batchHashAlgorithm: 'sha256',
            jobs: [{
                id: row.id, week: 1, bookKind: 'readalong', page: 3, selectedVersion: 1,
                selectedFile: row.fileName, selectedSha256: colorHash, status: 'selected',
                candidates: [{
                    version: 1, file: row.fileName, fileSha256: colorHash,
                    structural: { valid: true, width: 4000, height: 3000, sha256: colorHash, errors: [] },
                    lineArt: { file: row.lineArtFileName, fileSha256: lineHash, colorFile: row.fileName, status: 'selected', structural: { width: 4000, height: 3000 } },
                }],
            }],
            batches: [],
        }));
        const result = await api.checkStorytimePictureBatch([row, missing], dir);
        expect(result.exitCode).toBe(1);
        expect(result.results.map(({ rowId }) => rowId)).toEqual(['story-row-17', 'missing-row']);
        expect(result.results.map(({ status }) => status)).toEqual(['pass', 'fail']);
    }, 30_000);

    it('R-P4-14 exposes the stage-one batch command', async () => {
        expect(fs.existsSync(pictureBatchCliPath), 'Missing script: scripts/storytime/check-storytime-pictures.ts').toBe(true);
        const { execFileSync } = await import('node:child_process');
        expect(execFileSync(process.execPath, ['--import', 'tsx', pictureBatchCliPath, '--help'], { encoding: 'utf8' }))
            .toContain('check-storytime-pictures.ts');
    }, 30_000);
});
