// @vitest-environment jsdom
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import zlib from 'node:zlib';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { jobsFor, writePictureFolder, type PictureFolderJob } from './fixtures/storytime-picture-folder';

/** Phase 4 contract. New modules load inside each test so missing modules fail independently. */
type ReaderOptions = { profile: typeof STORYTIME_PRINT_PROFILE; mode: 'proof' | 'final'; output: 'workbook' | 'a3-color'; bookTitle?: string };
type ReaderApi = {
    compileStorytimeReaders: (weeks: StorytimeWeek[], options: ReaderOptions) => { html: string };
    storytimeReaderPictureFiles: (weeks: StorytimeWeek[], options: ReaderOptions) => Array<{ rowId: string; fileName: string; file: string }>;
};
type PictureApi = {
    checkStorytimePicture: (colorFile: string, lineFile: string, manifest: unknown, row: unknown, options?: { grayPixelThreshold?: number; pictureListFileNames?: string[] }) => Promise<unknown>;
    DEFAULT_GRAY_PIXEL_THRESHOLD: number;
    forgeManifestEntriesForRow: (manifest: unknown, row: unknown) => Array<{ fileName: string; rowId: string; sha256: string; pixelSize: { width: number; height: number } }>;
    checkStorytimePictureBatch: (rows: unknown[], batchFolder: string) => Promise<{ results: Array<{ rowId: string; status: string; reason?: string }>; exitCode: number }>;
    resolveStorytimePictureFiles: (folder: string, rows: unknown[], kind: 'color' | 'line') => Array<{ rowId: string; fileName: string; file: string }>;
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

/**
 * Runs `run` with `WORKBOOKS_ROOT` set to a temporary repository and a fresh module registry, so
 * that `STORYTIME_ROOT` (and the picture folder) point into the temporary repository. The
 * environment and the registry return to their state afterwards.
 * @param repo The temporary repository root.
 * @param run The work; it imports the modules itself.
 * @returns What `run` returns.
 */
async function inRoot<T>(repo: string, run: () => Promise<T>): Promise<T> {
    const saved = process.env.WORKBOOKS_ROOT;
    process.env.WORKBOOKS_ROOT = repo;
    vi.resetModules();
    try {
        return await run();
    } finally {
        if (saved === undefined) delete process.env.WORKBOOKS_ROOT;
        else process.env.WORKBOOKS_ROOT = saved;
        vi.resetModules();
    }
}

/** A temporary repository with the shipped week 1 package and an empty level 2 picture folder. */
function finalRepo(): { repo: string; pictures: string } {
    const repo = temp();
    const level = path.join(repo, 'content', 'storytime', 'l2');
    const pictures = path.join(level, 'print', 'pictures');
    fs.mkdirSync(pictures, { recursive: true });
    fs.copyFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), path.join(level, 'w01.json'));
    return { repo, pictures };
}

/** The row ids of the week 1 readers (the cover and 8 story pages of each reader) with their list file names, from the proof output. */
async function readerRows(): Promise<Array<{ id: string; line: string; color: string }>> {
    const api = await readers();
    const filesOf = (output: 'workbook' | 'a3-color'): Map<string, string> => {
        const html = api.compileStorytimeReaders([shipped()], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output }).html;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return new Map(Array.from(doc.querySelectorAll('[data-picture-id]'), (el) => [el.getAttribute('data-picture-id')!, el.getAttribute('data-picture-file')!] as const));
    };
    const line = filesOf('workbook');
    const color = filesOf('a3-color');
    return [...line.keys()].map((id) => ({ id, line: line.get(id)!, color: color.get(id)! }));
}

/**
 * The message of the first stop of a final reader build in a temporary repository: the picture
 * file list first (the CLI preflight), then the compile. An empty text means that the build did not stop.
 * @param repo The temporary repository root.
 * @param output The reader output.
 * @returns The error message, or an empty text.
 */
async function readerBuildError(repo: string, output: 'workbook' | 'a3-color'): Promise<string> {
    return inRoot(repo, async () => {
        const api = await import(readerPath) as ReaderApi;
        const options: ReaderOptions = { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output };
        try {
            api.storytimeReaderPictureFiles([shipped()], options);
            api.compileStorytimeReaders([shipped()], options);
            return '';
        } catch (e) {
            return e instanceof Error ? e.message : String(e);
        }
    });
}

/** The print-ready output a stopped build must not leave: any `readers-*` folder and any PDF file under the temporary HOME. */
function printLeftovers(home: string): string[] {
    const found: string[] = [];
    const walk = (dir: string): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (/^readers-/.test(entry.name)) found.push(full);
                walk(full);
            } else if (entry.name.endsWith('.pdf')) found.push(full);
        }
    };
    const printRoot = path.join(home, 'Desktop', 'print-ready');
    if (fs.existsSync(printRoot)) walk(printRoot);
    return found;
}

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
        // Red 4g fixture change: final mode reads the picture folder through its manifest.json, so
        // the temporary repository holds a manifest that names every requested picture, and the
        // folder holds none of the picture files. The assertion is unchanged.
        const api = await readers();
        const week = shipped();
        const { repo, pictures } = finalRepo();
        writePictureFolder(pictures, jobsFor((await readerRows()).map((row) => row.id)).map((job): PictureFolderJob => ({ ...job, omit: ['color', 'line'] })));
        await inRoot(repo, async () => {
            const finalApi = await import(readerPath) as ReaderApi;
            expect(() => finalApi.compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output: 'workbook' }))
                .toThrow(/picture missing: .*l2-w01/);
        });
        const proof = api.compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook' });
        expect(proof.html).toContain('PICTURE MISSING');
    });

    it('R-P4-6 exposes the readers PDF CLI help', async () => {
        expect(fs.existsSync(cliPath), 'Missing script: scripts/storytime/make-readers-pdf.ts').toBe(true);
        const { execFileSync } = await import('node:child_process');
        expect(execFileSync(process.execPath, ['--import', 'tsx', cliPath, '--help'], { encoding: 'utf8' })).toContain('make-readers-pdf.ts');
    }, 30_000);

    it('R-P4-13 final mode with a missing picture exits nonzero, names the picture, writes no output, and leaves the same version free for a retry', async () => {
        // Behaviour contract (FR-5.6, rule 12.2): the final build stops before it creates the
        // output folder or renders, so a stopped build writes no output file and no new output
        // folder, and a retry with the same --version stops on the same missing picture instead
        // of an "output exists" error. The CLI preflight is the existence check of the requested
        // picture files; the stage-one measurement is the batch driver's job (R-P4-12), not this
        // CLI's. The run stops before Chrome, so this test needs no browser. The temp
        // WORKBOOKS_ROOT gives the script a week copy and 17 of the 18 requested pictures.
        const api = await readers();
        const doc = new DOMParser().parseFromString(api.compileStorytimeReaders([shipped()], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook' }).html, 'text/html');
        const names = [...new Set(Array.from(doc.querySelectorAll('[data-picture-file]'), (el) => el.getAttribute('data-picture-file')!))].sort();
        expect(names.length, 'the week 1 readers request their picture files').toBeGreaterThanOrEqual(2);
        const missingName = names[Math.floor(names.length / 2)];
        const home = temp();
        // Red 4g fixture change: final mode reads the picture folder through its manifest.json.
        // The folder holds the manifest of all 18 requested rows and every file except the missing
        // line-art file, which the manifest still names. The assertions are unchanged.
        const { repo, pictures } = finalRepo();
        const missingId = missingName.replace(/-line-v1\.png$/, '');
        writePictureFolder(pictures, jobsFor(names.map((name) => name.replace(/-line-v1\.png$/, ''))).map((job): PictureFolderJob => (job.rowId === missingId ? { ...job, omit: ['line'] } : job)));
        // The stopped run leaves nothing in the print folder: no `readers-*` output folder and no
        // PDF file. The scan does not hard-code the folder name of one version.
        const printRoot = path.join(home, 'Desktop', 'print-ready');
        const leftovers = (): string[] => {
            const found: string[] = [];
            const walk = (dir: string): void => {
                for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                    const full = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (/^readers-/.test(entry.name)) found.push(full);
                        walk(full);
                    } else if (entry.name.endsWith('.pdf')) found.push(full);
                }
            };
            if (fs.existsSync(printRoot)) walk(printRoot);
            return found;
        };
        const { spawnSync } = await import('node:child_process');
        const args = ['--import', 'tsx', cliPath, '--level', '2', '--weeks', '1', '--final', '--workbook'];
        const env = { ...process.env, HOME: home, WORKBOOKS_ROOT: repo };
        const run1 = spawnSync(process.execPath, args, { encoding: 'utf8', env, timeout: 90_000 });
        const out1 = `${run1.stdout}\n${run1.stderr}`;
        expect(run1.status, 'the run was not killed by the spawn timeout').not.toBeNull();
        expect(run1.status, `the final build exits nonzero: ${out1}`).not.toBe(0);
        expect(out1, 'the run names the missing picture').toContain(missingName);
        expect(leftovers(), 'the stopped run writes no output file and creates no output folder').toEqual([]);
        const run2 = spawnSync(process.execPath, args, { encoding: 'utf8', env, timeout: 90_000 });
        const out2 = `${run2.stdout}\n${run2.stderr}`;
        expect(run2.status, 'the run was not killed by the spawn timeout').not.toBeNull();
        expect(run2.status, `the same-version retry exits nonzero: ${out2}`).not.toBe(0);
        expect(out2, 'the retry stops on the same missing picture').toContain(missingName);
        expect(out2, 'the retry is not blocked by an existing output').not.toMatch(/output exists/i);
        expect(leftovers(), 'the retry also writes no output file and creates no output folder').toEqual([]);
    }, 240_000);
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

    /** The SHA-256 of one file, in lower-case hex (the Forge manifest fact). */
    const hashOf = (file: string): string => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

    /**
     * One Forge manifest job that follows the Forge contract (advantage-forge
     * `src/storytime/book-pictures.ts` at 11a06b9c). The job, the candidate, and `lineArt` each
     * hold a status of only 'ready', 'pending', or 'failed', and a job holds
     * `selectedVersion: number | null`. The defaults give one ready job with one ready candidate
     * and ready line art. The line-art fields name the Forge 1-bit technique (PM fact,
     * 2026-11-01).
     */
    function forgeJobFixture(facts: {
        id: string; week: number; bookKind: 'readalong' | 'decodable'; page: number;
        colorFile: string; colorSha256: string; lineFile: string; lineSha256: string;
        width: number; height: number; version?: number;
        jobStatus?: 'ready' | 'pending' | 'failed';
        candidateStatus?: 'ready' | 'pending' | 'failed';
        lineArtStatus?: 'ready' | 'pending' | 'failed';
        selectedVersion?: number | null;
    }): Record<string, unknown> {
        const version = facts.version ?? 1;
        const selectedVersion = facts.selectedVersion === undefined ? version : facts.selectedVersion;
        const selected = selectedVersion === version;
        return {
            id: facts.id, week: facts.week, bookKind: facts.bookKind, bookTitle: 'Hello!', page: facts.page,
            text: 'Hello!', sourcePrompt: 'fixture prompt', characters: ['Pat'],
            sourcePackage: 'w01.json', sourceSha256: '0'.repeat(64),
            slug: facts.id, directory: `jobs/${facts.id}`, use: facts.bookKind, size: 'story',
            selectedVersion,
            selectedFile: selected ? facts.colorFile : null,
            selectedSha256: selected ? facts.colorSha256 : null,
            status: facts.jobStatus ?? 'ready',
            candidates: [{
                jobId: facts.id, version, file: facts.colorFile, fileSha256: facts.colorSha256,
                status: facts.candidateStatus ?? 'ready',
                structural: { valid: true, width: facts.width, height: facts.height, sha256: facts.colorSha256, errors: [] },
                reviews: {}, failures: [],
                lineArt: {
                    file: facts.lineFile, fileSha256: facts.lineSha256, colorFile: facts.colorFile,
                    renderEvidenceFile: `jobs/${facts.id}/render-evidence-v${version}.json`,
                    status: facts.lineArtStatus ?? 'ready',
                    structural: { valid: true, width: facts.width, height: facts.height, sha256: facts.lineSha256, errors: [] },
                    formatVersion: 'storytime-lineart-provisional-v1',
                    technique: 'song-page-form-edges-viewdepth-1bit-v2',
                    errors: [],
                },
            }],
        };
    }

    /** One Forge `StorytimeManifest` wrapper (version 1) around the fixture jobs. */
    const forgeManifestOf = (jobs: unknown[]): Record<string, unknown> => ({ version: 1, batchHashAlgorithm: 'sha256', jobs, batches: [] });

    /** The PNG IHDR bit depth of one file (byte 24 of the file). */
    const pngBitDepth = (file: string): number => fs.readFileSync(file)[24];

    /**
     * Writes a 1-bit grayscale PNG (colour type 0, bit depth 1): black bars on white, 24 px thick
     * lines. Forge makes the line art 1-bit after the enlargement (PM fact, 2026-11-01), so the
     * picture check must accept a 1-bit file. The writer packs 8 pixels in each byte, MSB first;
     * sample 0 is black and sample 1 is white in a 1-bit grayscale PNG.
     * @param file The file to write.
     * @param width The pixel width.
     * @param height The pixel height.
     */
    function writeGray1LinePng(file: string, width: number, height: number): void {
        const crcTable = new Int32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c;
        }
        const crc32 = (buf: Buffer): number => {
            let c = 0xffffffff;
            for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
            return (c ^ 0xffffffff) >>> 0;
        };
        const chunk = (type: string, data: Buffer): Buffer => {
            const len = Buffer.alloc(4);
            len.writeUInt32BE(data.length);
            const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
            const crc = Buffer.alloc(4);
            crc.writeUInt32BE(crc32(body));
            return Buffer.concat([len, body, crc]);
        };
        const ihdr = Buffer.alloc(13);
        ihdr.writeUInt32BE(width, 0);
        ihdr.writeUInt32BE(height, 4);
        ihdr[8] = 1; // bit depth
        ihdr[9] = 0; // colour type 0: grayscale
        const rowBytes = Math.ceil(width / 8);
        const raw = Buffer.alloc((rowBytes + 1) * height, 0);
        for (let y = 0; y < height; y++) {
            const rowStart = y * (rowBytes + 1);
            raw[rowStart] = 0; // filter: none
            for (let x = 0; x < width; x++) {
                const inBar = (y >= 500 && y < 524 && x >= 500 && x < 3500)
                    || (y >= 2476 && y < 2500 && x >= 500 && x < 3500)
                    || (x >= 500 && x < 524 && y >= 500 && y < 2500)
                    || (x >= 3476 && x < 3500 && y >= 500 && y < 2500)
                    || (y >= 1488 && y < 1512 && x >= 800 && x < 3200);
                if (!inBar) raw[rowStart + 1 + (x >> 3)] |= 0x80 >> (x & 7); // white
            }
        }
        fs.writeFileSync(file, Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            chunk('IHDR', ihdr),
            chunk('IDAT', zlib.deflateSync(raw)),
            chunk('IEND', Buffer.alloc(0)),
        ]));
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
        // The fixture statuses follow the Forge contract at 11a06b9c: only 'ready', 'pending',
        // or 'failed' exist. A usable job, candidate, and line art are each 'ready'.
        const manifest = forgeManifestOf([forgeJobFixture({
            id: row.id, week: 1, bookKind: 'readalong', page: 3,
            colorFile: path.basename(fixture.color), colorSha256: fixture.manifest[0].sha256,
            lineFile: path.basename(fixture.line), lineSha256: fixture.manifest[1].sha256,
            width: 4000, height: 3000, version: 2,
        })]);
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
        // Red 4h fixture change (A-P4-12): the expected name stem is the row id, so the two files
        // carry the row id `story-row-17` (the old fixture named them `l2-w01-story-page-good-*`).
        // The bytes are the same files, so the manifest facts and every assertion stay as they were.
        const row = { id: 'story-row-17', fileName: 'story-row-17-v1.png', lineArtFileName: 'story-row-17-line-v1.png', width: 4000, height: 3000, week: 1 };
        fs.copyFileSync(fixture.color, path.join(dir, row.fileName));
        fs.copyFileSync(fixture.line, path.join(dir, row.lineArtFileName));
        const missing = { ...row, id: 'missing-row', fileName: 'missing-v1.png', lineArtFileName: 'missing-line-v1.png' };
        const colorHash = createHash('sha256').update(fs.readFileSync(fixture.color)).digest('hex');
        const lineHash = createHash('sha256').update(fs.readFileSync(fixture.line)).digest('hex');
        fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
            version: 1,
            batchHashAlgorithm: 'sha256',
            jobs: [{
                id: row.id, week: 1, bookKind: 'readalong', page: 3, selectedVersion: 1,
                selectedFile: row.fileName, selectedSha256: colorHash, status: 'ready',
                candidates: [{
                    version: 1, file: row.fileName, fileSha256: colorHash, status: 'ready',
                    structural: { valid: true, width: 4000, height: 3000, sha256: colorHash, errors: [] },
                    lineArt: { file: row.lineArtFileName, fileSha256: lineHash, colorFile: row.fileName, status: 'ready', structural: { width: 4000, height: 3000 } },
                }],
            }],
            batches: [],
        }));
        const result = await api.checkStorytimePictureBatch([row, missing], dir);
        expect(result.exitCode).toBe(1);
        expect(result.results.map(({ rowId }) => rowId)).toEqual(['story-row-17', 'missing-row']);
        expect(result.results.map(({ status }) => status)).toEqual(['pass', 'fail']);
    }, 30_000);

    it('R-P4-15 rejects a Forge job that is not ready or holds no selected version', async () => {
        const api = await pictureCheck();
        const dir = temp();
        const fixture = await pngFixtures(dir);
        const row = { ...fixture.row, id: 'story-row-17', week: 1, bookKind: 'readalong', page: 3 };
        const facts = {
            id: row.id, week: 1, bookKind: 'readalong' as const, page: 3,
            colorFile: path.basename(fixture.color), colorSha256: fixture.manifest[0].sha256,
            lineFile: path.basename(fixture.line), lineSha256: fixture.manifest[1].sha256,
            width: 4000, height: 3000,
        };
        // The Forge contract (11a06b9c) allows only 'ready', 'pending', and 'failed' for the job
        // status. Only a ready job with a selected version gives the adapter its two files. A
        // 'selected' status does not exist in the contract and must not appear in a fixture.
        expect(() => api.forgeManifestEntriesForRow(forgeManifestOf([forgeJobFixture({ ...facts, jobStatus: 'pending', selectedVersion: null })]), row))
            .toThrow(/ready|pending|status/i);
        expect(() => api.forgeManifestEntriesForRow(forgeManifestOf([forgeJobFixture({ ...facts, jobStatus: 'failed', selectedVersion: null })]), row))
            .toThrow(/ready|failed|status/i);
        expect(() => api.forgeManifestEntriesForRow(forgeManifestOf([forgeJobFixture({ ...facts, jobStatus: 'ready', selectedVersion: null })]), row))
            .toThrow(/selected|version/i);
        // The happy-path anchor: an always-throwing adapter must not pass the three cases above.
        expect(api.forgeManifestEntriesForRow(forgeManifestOf([forgeJobFixture(facts)]), row)).toHaveLength(2);
    }, 30_000);

    it('R-P4-16 reports a row whose Forge job is not ready as fail with a reason', async () => {
        const api = await pictureCheck();
        const dir = temp();
        const fixture = await pngFixtures(dir);
        // Both rows hold their two files in the batch folder, so only the job state can fail them.
        const rows = [
            { id: 'pending-row', fileName: 'pending-row-v1.png', lineArtFileName: 'pending-row-line-v1.png', width: 4000, height: 3000, week: 1 },
            { id: 'no-selection-row', fileName: 'no-selection-row-v1.png', lineArtFileName: 'no-selection-row-line-v1.png', width: 4000, height: 3000, week: 1 },
        ];
        for (const row of rows) {
            fs.copyFileSync(fixture.color, path.join(dir, row.fileName));
            fs.copyFileSync(fixture.line, path.join(dir, row.lineArtFileName));
        }
        const colorSha = hashOf(path.join(dir, rows[0].fileName));
        const lineSha = hashOf(path.join(dir, rows[0].lineArtFileName));
        const jobOf = (row: { id: string; fileName: string; lineArtFileName: string }, jobStatus: 'ready' | 'pending' | 'failed', selectedVersion: number | null) => forgeJobFixture({
            id: row.id, week: 1, bookKind: 'readalong', page: 3,
            colorFile: row.fileName, colorSha256: colorSha, lineFile: row.lineArtFileName, lineSha256: lineSha,
            width: 4000, height: 3000, jobStatus, selectedVersion,
        });
        fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(forgeManifestOf([
            jobOf(rows[0], 'pending', null),
            jobOf(rows[1], 'ready', null),
        ])));
        const result = await api.checkStorytimePictureBatch(rows, dir);
        expect(result.exitCode).toBe(1);
        expect(result.results.map(({ rowId }) => rowId)).toEqual(['pending-row', 'no-selection-row']);
        expect(result.results.map(({ status }) => status)).toEqual(['fail', 'fail']);
        for (const entry of result.results) {
            expect(typeof entry.reason, 'each failed row names a reason').toBe('string');
            expect(entry.reason, 'each failed row names a reason').toBeTruthy();
            expect(entry.reason, 'the reason names the job state').toMatch(/ready|pending|selected|status|version|job/i);
        }
    }, 30_000);

    it('R-P4-17 accepts a 1-bit line-art PNG in both 1-bit encodings', async () => {
        // New fact (PM, 2026-11-01): Forge makes the line art from the Muse color picture: thick,
        // simple, and 1-bit after the enlargement to 4000 x 3000. The check must accept a line-art
        // file whose PNG bit depth is 1, in both encodings: a two-colour palette (colour type 3,
        // what sharp writes) and a grayscale file (colour type 0, hand-made here). The test proves
        // the bit depth of each written file from its IHDR before the check runs.
        const api = await pictureCheck();
        const sharp = (await import('sharp')).default;
        const dir = temp();
        const fixture = await pngFixtures(dir);
        const art = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="3000" viewBox="0 0 4000 3000"><rect width="4000" height="3000" fill="white"/><path d="M500 1500 C1000 800 1800 800 2200 1500 C2600 2200 3300 2200 3500 1500" fill="none" stroke="black" stroke-width="24"/><circle cx="2000" cy="1500" r="340" fill="none" stroke="black" stroke-width="24"/></svg>');
        const paletteLine = path.join(dir, 'line-1bit-palette.png');
        await sharp(art).toColourspace('b-w').png({ palette: true, colors: 2 }).toFile(paletteLine);
        const grayLine = path.join(dir, 'line-1bit-gray.png');
        writeGray1LinePng(grayLine, 4000, 3000); // the bars are drawn for a 4000 x 3000 canvas
        expect(pngBitDepth(paletteLine), 'the palette line art is 1-bit').toBe(1);
        expect(pngBitDepth(grayLine), 'the grayscale line art is 1-bit').toBe(1);
        for (const lineFile of [paletteLine, grayLine]) {
            const row = { fileName: fixture.row.fileName, lineArtFileName: path.basename(lineFile), width: 4000, height: 3000 };
            const manifest = [
                { fileName: fixture.row.fileName, sha256: hashOf(fixture.color), pixelSize: { width: 4000, height: 3000 } },
                { fileName: row.lineArtFileName, sha256: hashOf(lineFile), pixelSize: { width: 4000, height: 3000 } },
            ];
            await expect(api.checkStorytimePicture(fixture.color, lineFile, manifest, row)).resolves.toBeTruthy();
        }
    }, 60_000);

    it('R-P4-14 exposes the stage-one batch command', async () => {
        expect(fs.existsSync(pictureBatchCliPath), 'Missing script: scripts/storytime/check-storytime-pictures.ts').toBe(true);
        const { execFileSync } = await import('node:child_process');
        expect(execFileSync(process.execPath, ['--import', 'tsx', pictureBatchCliPath, '--help'], { encoding: 'utf8' }))
            .toContain('check-storytime-pictures.ts');
    }, 30_000);

    /** One shipped week 1 picture row: the row id, the flat list names, and the pixel size. */
    type Week1Row = { id: string; fileName: string; lineArtFileName: string; width: number; height: number; week: number };

    /**
     * The 30 shipped week 1 rows of `content/storytime/l2/print/pictures.json`. The delivery
     * contract (PM, 2026-11-01) pins the naming: each row id gives the color name
     * `<id>-v1.png` and the line-art name `<id>-line-v1.png`.
     * @returns The week 1 rows in list order.
     */
    function week1Rows(): Week1Row[] {
        const source = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json');
        const rows = JSON.parse(fs.readFileSync(source, 'utf8')) as Week1Row[];
        return rows.filter((row) => row.week === 1);
    }

    /**
     * Writes `manifest.json` for rows whose two files sit at `w01/rows/<name>` under the batch
     * root. The jobs follow the delivery contract (PM, 2026-11-01): `job.id` is the picture-list
     * row id, `candidate.file` is `w01/rows/<row id>-v1.png`, and `lineArt.file` is
     * `w01/rows/<row id>-line-v1.png`. The files must exist under the batch root.
     * @param batchRoot The batch folder; it holds `manifest.json` and `w01/rows/`.
     * @param rows The picture-list rows the manifest holds.
     */
    function writeRowManifest(batchRoot: string, rows: Week1Row[]): void {
        const rowsFolder = path.join(batchRoot, 'w01', 'rows');
        const jobs = rows.map((row) => forgeJobFixture({
            id: row.id, week: 1, bookKind: 'readalong', page: 1,
            colorFile: `w01/rows/${row.fileName}`, colorSha256: hashOf(path.join(rowsFolder, row.fileName)),
            lineFile: `w01/rows/${row.lineArtFileName}`, lineSha256: hashOf(path.join(rowsFolder, row.lineArtFileName)),
            width: row.width, height: row.height,
        }));
        fs.writeFileSync(path.join(batchRoot, 'manifest.json'), JSON.stringify(forgeManifestOf(jobs)));
    }

    /** The one realistic week 1 batch of this test run, built once and shared by the cases. */
    let week1BatchDir: Promise<string> | undefined;

    /**
     * Builds the realistic week 1 batch (finding 3): every shipped row gets a synthetic color PNG
     * (8-bit sRGB) and a synthetic 1-bit line-art PNG at the row size, all under `w01/rows/`, and
     * one `manifest.json` at the batch root holds all 30 rows.
     * @returns The batch folder.
     */
    function week1Batch(): Promise<string> {
        week1BatchDir ??= (async () => {
            const sharp = (await import('sharp')).default;
            const dir = temp();
            const rowsFolder = path.join(dir, 'w01', 'rows');
            fs.mkdirSync(rowsFolder, { recursive: true });
            const rows = week1Rows();
            for (const row of rows) {
                await sharp({ create: { width: row.width, height: row.height, channels: 3, background: '#3b6ea5' } }).png().toFile(path.join(rowsFolder, row.fileName));
                writeGray1LinePng(path.join(rowsFolder, row.lineArtFileName), row.width, row.height);
            }
            writeRowManifest(dir, rows);
            return dir;
        })();
        return week1BatchDir;
    }

    it('R-P4-18 passes every week-one row of a manifest whose file paths carry the w01/rows/ folder prefix', async () => {
        // Delivery contract (PM, 2026-11-01): Forge writes one `manifest.json` at the batch root,
        // `job.id` is the picture-list row id, and `candidate.file` and `lineArt.file` carry a
        // free folder prefix (C-P4-8). The check must match the row by the file name part and
        // read the file at its relative path under the batch root.
        const api = await pictureCheck();
        const rows = week1Rows();
        expect(rows, 'the shipped list holds 30 week 1 rows').toHaveLength(30);
        for (const row of rows) {
            expect(row.fileName, `${row.id} color name follows <id>-v1.png`).toBe(`${row.id}-v1.png`);
            expect(row.lineArtFileName, `${row.id} line name follows <id>-line-v1.png`).toBe(`${row.id}-line-v1.png`);
        }
        const dir = await week1Batch();
        const report = await api.checkStorytimePictureBatch(rows, dir);
        const failed = report.results.filter((entry) => entry.status === 'fail');
        expect(failed.map((entry) => `${entry.rowId}: ${entry.reason ?? ''}`).join('; '), 'every week 1 row passes with the folder prefix').toBe('');
        expect(report.exitCode, 'a fully delivered batch gives exit code 0').toBe(0);
    }, 300_000);

    it('R-P4-19 passes the present rows of a subset manifest and fails each absent row as not in the manifest', async () => {
        // The Forge manifest holds only the clean rows (delivery contract, PM, 2026-11-01). The
        // rows it does not hold must each fail with a reason that says the row is not in the
        // manifest, and the rows it holds must pass (findings 1 and 3).
        const api = await pictureCheck();
        const full = await week1Batch();
        const rows = week1Rows();
        const present = rows.slice(0, 3);
        const dir = temp();
        const rowsFolder = path.join(dir, 'w01', 'rows');
        fs.mkdirSync(rowsFolder, { recursive: true });
        for (const row of present) {
            fs.copyFileSync(path.join(full, 'w01', 'rows', row.fileName), path.join(rowsFolder, row.fileName));
            fs.copyFileSync(path.join(full, 'w01', 'rows', row.lineArtFileName), path.join(rowsFolder, row.lineArtFileName));
        }
        writeRowManifest(dir, present);
        const report = await api.checkStorytimePictureBatch(rows, dir);
        expect(report.results, 'one result for each requested row').toHaveLength(30);
        expect(report.exitCode, 'an incomplete batch gives exit code 1').toBe(1);
        expect(report.results.slice(0, 3).map((entry) => entry.status), 'the present rows pass').toEqual(['pass', 'pass', 'pass']);
        for (const entry of report.results.slice(3)) {
            expect(entry.status, entry.rowId).toBe('fail');
            expect(entry.reason ?? '', `the reason of ${entry.rowId} says the row is not in the manifest`).toMatch(/manifest/i);
            expect(entry.reason ?? '', `the reason of ${entry.rowId} names the row`).toContain(entry.rowId);
        }
    }, 300_000);

    it('R-P4-20 fails a row whose manifest path resolves outside the batch root', async () => {
        // The folder prefix is free only inside the batch root (delivery contract, PM, 2026-11-01):
        // a `../` path and an absolute path each fail their row (finding 2). The reason of the
        // `../` row must name the path problem, so the operator sees the escape.
        const api = await pictureCheck();
        const full = await week1Batch();
        const [escapeRow, absoluteRow] = week1Rows();
        const parent = temp();
        const dir = path.join(parent, 'batch');
        const outside = path.join(parent, 'x');
        const absoluteFolder = temp();
        fs.mkdirSync(dir, { recursive: true });
        fs.mkdirSync(outside, { recursive: true });
        const copies: Array<[Week1Row, string]> = [[escapeRow, outside], [absoluteRow, absoluteFolder]];
        for (const [row, target] of copies) {
            fs.copyFileSync(path.join(full, 'w01', 'rows', row.fileName), path.join(target, row.fileName));
            fs.copyFileSync(path.join(full, 'w01', 'rows', row.lineArtFileName), path.join(target, row.lineArtFileName));
        }
        fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(forgeManifestOf([
            forgeJobFixture({
                id: escapeRow.id, week: 1, bookKind: 'readalong', page: 1,
                colorFile: `../x/${escapeRow.fileName}`, colorSha256: hashOf(path.join(outside, escapeRow.fileName)),
                lineFile: `../x/${escapeRow.lineArtFileName}`, lineSha256: hashOf(path.join(outside, escapeRow.lineArtFileName)),
                width: escapeRow.width, height: escapeRow.height,
            }),
            forgeJobFixture({
                id: absoluteRow.id, week: 1, bookKind: 'readalong', page: 1,
                colorFile: path.join(absoluteFolder, absoluteRow.fileName), colorSha256: hashOf(path.join(absoluteFolder, absoluteRow.fileName)),
                lineFile: path.join(absoluteFolder, absoluteRow.lineArtFileName), lineSha256: hashOf(path.join(absoluteFolder, absoluteRow.lineArtFileName)),
                width: absoluteRow.width, height: absoluteRow.height,
            }),
        ])));
        const report = await api.checkStorytimePictureBatch([escapeRow, absoluteRow], dir);
        expect(report.exitCode, 'an outside path fails the batch').toBe(1);
        expect(report.results.map((entry) => entry.rowId)).toEqual([escapeRow.id, absoluteRow.id]);
        const escaped = report.results[0];
        expect(escaped.status, escaped.reason ?? '').toBe('fail');
        expect(escaped.reason ?? '', 'the reason names the path that resolves outside the batch root').toMatch(/outside|escape|batch|invalid|not allowed/i);
        expect(report.results[1].status, `the absolute path fails its row: ${report.results[1].reason ?? ''}`).toBe('fail');
    }, 300_000);

    it('R-P4-21 reports an unloaded week and a duplicate week like the readers CLI', async () => {
        // C-P4-9: `--weeks 1,30` must not pass silently. The batch CLI mirrors the `--weeks`
        // contract of `make-readers-pdf.ts`: `checkRequestedWeeks` fails a week that the level
        // does not load and a duplicate week, with exit code 1 and one message on stderr.
        const dir = await week1Batch();
        const { spawnSync } = await import('node:child_process');
        const runCli = (weeks: string) => spawnSync(process.execPath, ['--import', 'tsx', pictureBatchCliPath, '--batch', dir, '--level', '2', '--weeks', weeks], { encoding: 'utf8', timeout: 240_000 });
        const unloaded = runCli('1,30');
        const unloadedOut = `${unloaded.stdout}\n${unloaded.stderr}`;
        expect(unloaded.status, 'the run was not killed by the spawn timeout').not.toBeNull();
        expect(unloaded.status, `the run exits 1 for week 30: ${unloadedOut}`).toBe(1);
        expect(unloadedOut, 'the run names the week that the level does not load, like make-readers-pdf.ts').toContain('requested week 30 is not loaded exactly once');
        expect(unloadedOut, 'the run reports no pass for a week it never checked').not.toMatch(/\d+ of \d+ rows pass/);
        const duplicate = runCli('1,1');
        const duplicateOut = `${duplicate.stdout}\n${duplicate.stderr}`;
        expect(duplicate.status, 'the run was not killed by the spawn timeout').not.toBeNull();
        expect(duplicate.status, `the run exits 1 for a duplicate week: ${duplicateOut}`).toBe(1);
        expect(duplicateOut, 'the run rejects the duplicate week').toMatch(/duplicate/i);
    }, 300_000);

    it('R-P4-22 exits 2 on a manifest.json that does not parse and names the case in the usage text', async () => {
        // C-P4-10: a broken `manifest.json` is a batch problem of the same class as a missing one,
        // so the CLI gives exit code 2, and the usage text names that case.
        const dir = temp();
        fs.writeFileSync(path.join(dir, 'manifest.json'), '{ "jobs": [');
        const { spawnSync } = await import('node:child_process');
        const run = spawnSync(process.execPath, ['--import', 'tsx', pictureBatchCliPath, '--batch', dir, '--level', '2', '--weeks', '1'], { encoding: 'utf8', timeout: 120_000 });
        const out = `${run.stdout}\n${run.stderr}`;
        expect(run.status, `the run exits 2 on a manifest that does not parse: ${out}`).toBe(2);
        expect(out, 'the error names the broken manifest').toMatch(/does not parse/i);
        const help = spawnSync(process.execPath, ['--import', 'tsx', pictureBatchCliPath, '--help'], { encoding: 'utf8', timeout: 120_000 });
        expect(`${help.stdout}\n${help.stderr}`, 'the usage text names a manifest.json that does not parse').toContain('does not parse');
    }, 120_000);

    /**
     * One job of a staged batch. The job takes its id and pixel size from `row`. The two source
     * files come from the shared week 1 batch and are copied under the given names, so a case can
     * give a real, passing file any name and only the name rule can fail the row.
     */
    type StagedJob = {
        row: Week1Row;
        colorName: string;
        lineName: string;
        colorFrom: string;
        lineFrom: string;
        /** The candidate version, and the `selectedVersion` of the job unless `selectedVersion` is set. */
        version?: number;
        jobStatus?: 'ready' | 'pending' | 'failed';
        selectedVersion?: number | null;
    };

    /**
     * The job of a row with its own files at the Forge redo version `version` (default 1): the
     * names are `<row id>-v<N>.png` and `<row id>-line-v<N>.png` (PM option A, 2026-11-02).
     * @param row The picture-list row; its files come from the shared week 1 batch.
     * @param overrides Fields of the staged job to replace.
     * @returns The staged job.
     */
    async function ownJob(row: Week1Row, overrides: Partial<StagedJob> = {}): Promise<StagedJob> {
        const shared = await week1Batch();
        const version = overrides.version ?? 1;
        return {
            row,
            colorName: `${row.id}-v${version}.png`,
            lineName: `${row.id}-line-v${version}.png`,
            colorFrom: path.join(shared, 'w01', 'rows', row.fileName),
            lineFrom: path.join(shared, 'w01', 'rows', row.lineArtFileName),
            ...overrides,
        };
    }

    /**
     * Writes a batch folder from staged jobs: the files at `w01/rows/<name>` and one
     * `manifest.json` with one job for each staged job, in the given order. The SHA-256 and the
     * pixel size of each manifest fact agree with the copied file, so a case fails a row only on
     * the rule under test.
     * @param jobs The staged jobs; two jobs may share a row id.
     * @returns The batch folder.
     */
    function stagedBatch(jobs: StagedJob[]): string {
        const dir = temp();
        const rowsFolder = path.join(dir, 'w01', 'rows');
        fs.mkdirSync(rowsFolder, { recursive: true });
        const manifestJobs = jobs.map((job) => {
            fs.copyFileSync(job.colorFrom, path.join(rowsFolder, job.colorName));
            fs.copyFileSync(job.lineFrom, path.join(rowsFolder, job.lineName));
            return forgeJobFixture({
                id: job.row.id, week: 1, bookKind: 'readalong', page: 1,
                colorFile: `w01/rows/${job.colorName}`, colorSha256: hashOf(path.join(rowsFolder, job.colorName)),
                lineFile: `w01/rows/${job.lineName}`, lineSha256: hashOf(path.join(rowsFolder, job.lineName)),
                width: job.row.width, height: job.row.height,
                version: job.version, jobStatus: job.jobStatus, selectedVersion: job.selectedVersion,
            });
        });
        fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(forgeManifestOf(manifestJobs)));
        return dir;
    }

    /** The row of the shipped week 1 list for one row id. */
    function week1Row(id: string): Week1Row {
        const row = week1Rows().find((entry) => entry.id === id);
        expect(row, `the shipped list holds the week 1 row ${id}`).toBeTruthy();
        return row as Week1Row;
    }

    /** The four rows of the real delivery `delivery-muse-v2` that Forge redid at version 2. */
    const REDONE_ROW_IDS = [
        'l2-w01-check-row-net',
        'l2-w01-story-page-a-net',
        'l2-w01-story-page-a-nose',
        'l2-w01-story-page-nan-can-nod',
    ];

    /** The 30 week 1 jobs: the four redone rows at version 2 and the other 26 rows at version 1. */
    async function week1RedoJobs(): Promise<StagedJob[]> {
        return Promise.all(week1Rows().map((row) => ownJob(row, REDONE_ROW_IDS.includes(row.id) ? { version: 2 } : {})));
    }

    /** The realistic week 1 batch with the four redone rows, built once and shared by R-P4-23 and R-P4-28. */
    let week1RedoBatchDir: Promise<string> | undefined;
    function week1RedoBatch(): Promise<string> {
        week1RedoBatchDir ??= week1RedoJobs().then(stagedBatch);
        return week1RedoBatchDir;
    }

    it('R-P4-23 passes the 30 week-one rows when four rows were redone and carry the version 2 file names', async () => {
        // PM option A (2026-11-02): Forge redoes a failed picture under a new version number N.
        // The list keeps the names `-v1`. The batch check matches a manifest job by row id, so a
        // row at v2 passes on its own measurements and manifest facts. The shape follows the real
        // delivery `delivery-muse-v2`: 26 rows at v1 and four rows at v2.
        const api = await pictureCheck();
        const rows = week1Rows();
        expect(rows, 'the shipped list holds 30 week 1 rows').toHaveLength(30);
        for (const id of REDONE_ROW_IDS) {
            const row = week1Row(id);
            expect(row.fileName, `${id}: the list keeps the -v1 name; a redo needs no new list version`).toBe(`${id}-v1.png`);
            expect(row.lineArtFileName, `${id}: the list keeps the -line-v1 name`).toBe(`${id}-line-v1.png`);
        }
        const dir = await week1RedoBatch();
        const names = fs.readdirSync(path.join(dir, 'w01', 'rows'));
        for (const id of REDONE_ROW_IDS) {
            expect(names, `${id}: the batch holds the version 2 files`).toEqual(expect.arrayContaining([`${id}-v2.png`, `${id}-line-v2.png`]));
            expect(names, `${id}: the batch holds no version 1 color file`).not.toContain(`${id}-v1.png`);
        }
        expect(names.filter((name) => /-v2\.png$/.test(name)), 'exactly four rows are at version 2').toHaveLength(8);
        const report = await api.checkStorytimePictureBatch(rows, dir);
        expect(report.results, 'one result for each requested row').toHaveLength(30);
        const failed = report.results.filter((entry) => entry.status === 'fail');
        expect(failed.map((entry) => `${entry.rowId}: ${entry.reason ?? ''}`).join('; '), 'every row passes, redone rows included').toBe('');
        expect(report.exitCode, 'a fully delivered batch gives exit code 0').toBe(0);
    }, 600_000);

    it('R-P4-24 fails a row that has two jobs with the same row id, in any job order, and keeps the other rows', async () => {
        // PM option A: one job for each row id in a manifest (ADV-P4-1). The first-match rule
        // lets list order decide; the check must name the duplicate in every order.
        const api = await pictureCheck();
        const dupRow = week1Row('l2-w01-check-row-net');
        const requested = [dupRow, week1Row('l2-w01-check-row-cat'), week1Row('l2-w01-check-row-dog')];
        const orders: Array<[string, StagedJob[]]> = [
            ['a ready job, then a pending job', [await ownJob(dupRow), await ownJob(dupRow, { jobStatus: 'pending', selectedVersion: null })]],
            ['a pending job, then a ready job', [await ownJob(dupRow, { jobStatus: 'pending', selectedVersion: null }), await ownJob(dupRow)]],
            ['two ready jobs', [await ownJob(dupRow), await ownJob(dupRow, { version: 2 })]],
        ];
        const problems: string[] = [];
        for (const [label, dupJobs] of orders) {
            const dir = stagedBatch([...dupJobs, await ownJob(requested[1]), await ownJob(requested[2])]);
            const report = await api.checkStorytimePictureBatch(requested, dir);
            if (report.results.map((entry) => entry.rowId).join() !== requested.map((row) => row.id).join()) problems.push(`${label}: the results do not follow the request order`);
            const [dup, ...others] = report.results;
            if (dup?.status !== 'fail') problems.push(`${label}: the duplicated row ${dupRow.id} did not fail (status ${dup?.status})`);
            else {
                if (!(dup.reason ?? '').includes(dupRow.id)) problems.push(`${label}: the reason does not name the row id: ${dup.reason}`);
                if (!/duplicate/i.test(dup.reason ?? '')) problems.push(`${label}: the reason does not say duplicate: ${dup.reason}`);
            }
            for (const other of others) if (other.status !== 'pass') problems.push(`${label}: ${other.rowId} did not keep its own result: ${other.reason}`);
            if (report.exitCode !== 1) problems.push(`${label}: the exit code is ${report.exitCode}, not 1`);
        }
        expect(problems, problems.join('\n')).toEqual([]);
    }, 300_000);

    it('R-P4-25 fails a row whose job carries the file of another row id, with the prefix trap in both directions', async () => {
        // PM option A: the name part of each file must be `<row id>-v<N>.png` and
        // `<row id>-line-v<N>.png`. The files are real and pass the measurements, so only the
        // name rule can fail them. `a-nest` is a prefix of `a-nest-and-a-nut`, so a starts-with
        // test would pass the two prefix rows.
        const api = await pictureCheck();
        const [pat, may, sam, mia, nest, nestAndNut, nan] = [
            'l2-w01-story-page-hello-i-am-pat', 'l2-w01-story-page-hello-i-am-may', 'l2-w01-story-page-hello-i-am-sam',
            'l2-w01-story-page-hello-i-am-mia', 'l2-w01-story-page-a-nest', 'l2-w01-story-page-a-nest-and-a-nut',
            'l2-w01-story-page-hello-i-am-nan',
        ].map(week1Row);
        const own = (row: Week1Row) => ownJob(row);
        const jobs: StagedJob[] = [
            // the color file of pat carries the row id of may
            await ownJob(pat, { colorName: `${may.id}-v1.png`, colorFrom: (await own(may)).colorFrom }),
            await own(may),
            // the line art of sam carries the row id of mia
            await ownJob(sam, { lineName: `${mia.id}-line-v1.png`, lineFrom: (await own(mia)).lineFrom }),
            await own(mia),
            // the prefix trap: a-nest carries the files of a-nest-and-a-nut, and the reverse
            await ownJob(nest, {
                colorName: `${nestAndNut.id}-v1.png`, colorFrom: (await own(nestAndNut)).colorFrom,
                lineName: `${nestAndNut.id}-line-v1.png`, lineFrom: (await own(nestAndNut)).lineFrom,
            }),
            await ownJob(nestAndNut, {
                colorName: `${nest.id}-v1.png`, colorFrom: (await own(nest)).colorFrom,
                lineName: `${nest.id}-line-v1.png`, lineFrom: (await own(nest)).lineFrom,
            }),
            await own(nan),
        ];
        const requested = [pat, may, sam, mia, nest, nestAndNut, nan];
        const report = await api.checkStorytimePictureBatch(requested, stagedBatch(jobs));
        // each failing row: the offending file name parts, any of which the reason may name
        const failing = new Map<string, string[]>([
            [pat.id, [`${may.id}-v1.png`]],
            [sam.id, [`${mia.id}-line-v1.png`]],
            [nest.id, [`${nestAndNut.id}-v1.png`, `${nestAndNut.id}-line-v1.png`]],
            [nestAndNut.id, [`${nest.id}-v1.png`, `${nest.id}-line-v1.png`]],
        ]);
        const problems: string[] = [];
        expect(report.results.map((entry) => entry.rowId), 'one result for each requested row, in order').toEqual(requested.map((row) => row.id));
        for (const entry of report.results) {
            const offending = failing.get(entry.rowId);
            if (!offending) {
                if (entry.status !== 'pass') problems.push(`${entry.rowId}: a clean row did not pass: ${entry.reason}`);
                continue;
            }
            if (entry.status !== 'fail') { problems.push(`${entry.rowId}: a job with the file of another row id did not fail`); continue; }
            if (!(entry.reason ?? '').includes(entry.rowId)) problems.push(`${entry.rowId}: the reason does not name the row id: ${entry.reason}`);
            if (!offending.some((name) => (entry.reason ?? '').includes(name))) problems.push(`${entry.rowId}: the reason does not name the file ${offending.join(' or ')}: ${entry.reason}`);
        }
        expect(report.exitCode, 'a batch with a wrong file name gives exit code 1').toBe(1);
        expect(problems, problems.join('\n')).toEqual([]);
    }, 600_000);

    it('R-P4-26 accepts only <row id>-v<N>.png with <row id>-line-v<N>.png, N positive, one N, equal to selectedVersion', async () => {
        // PM option A, rule 3. The control rows prove the check is not a blanket reject: a row at
        // v1 and a row at v2 pass. Every other row holds real files with one fault in the names.
        const api = await pictureCheck();
        const row = (suffix: string) => week1Row(`l2-w01-check-row-${suffix}`);
        const [cup, cat, fish, dog, nose, bus, hat] = ['cup', 'cat', 'fish', 'dog', 'nose', 'bus', 'hat'].map(row);
        const own = (r: Week1Row) => ownJob(r);
        const jobs: StagedJob[] = [
            await ownJob(cup), // control: version 1
            await ownJob(cat, { version: 2 }), // control: a redone row at version 2
            // a swapped pair: the color file carries the line-art name and the reverse
            await ownJob(fish, { colorName: `${fish.id}-line-v1.png`, lineName: `${fish.id}-v1.png`, colorFrom: (await own(fish)).colorFrom, lineFrom: (await own(fish)).lineFrom }),
            // version 0 is not a positive integer
            await ownJob(dog, { version: 0 }),
            // a leading zero
            await ownJob(nose, { colorName: `${nose.id}-v01.png`, lineName: `${nose.id}-line-v01.png` }),
            // the color file at v2 and the line art at v1
            await ownJob(bus, { version: 2, lineName: `${bus.id}-line-v1.png` }),
            // the files at v2 while the job selectedVersion and the candidate version are 1
            await ownJob(hat, { version: 1, colorName: `${hat.id}-v2.png`, lineName: `${hat.id}-line-v2.png` }),
        ];
        const requested = [cup, cat, fish, dog, nose, bus, hat];
        const report = await api.checkStorytimePictureBatch(requested, stagedBatch(jobs));
        const failing = new Map<string, string[]>([
            [fish.id, [`${fish.id}-line-v1.png`, `${fish.id}-v1.png`]],
            [dog.id, [`${dog.id}-v0.png`, `${dog.id}-line-v0.png`]],
            [nose.id, [`${nose.id}-v01.png`, `${nose.id}-line-v01.png`]],
            [bus.id, [`${bus.id}-v2.png`, `${bus.id}-line-v1.png`]],
            [hat.id, [`${hat.id}-v2.png`, `${hat.id}-line-v2.png`]],
        ]);
        const problems: string[] = [];
        expect(report.results.map((entry) => entry.rowId), 'one result for each requested row, in order').toEqual(requested.map((r) => r.id));
        for (const entry of report.results) {
            const offending = failing.get(entry.rowId);
            if (!offending) {
                if (entry.status !== 'pass') problems.push(`${entry.rowId}: a control row with correct names did not pass: ${entry.reason}`);
                continue;
            }
            if (entry.status !== 'fail') { problems.push(`${entry.rowId}: a wrong name form did not fail`); continue; }
            if (!(entry.reason ?? '').includes(entry.rowId)) problems.push(`${entry.rowId}: the reason does not name the row id: ${entry.reason}`);
            if (!offending.some((name) => (entry.reason ?? '').includes(name))) problems.push(`${entry.rowId}: the reason does not name the file ${offending.join(' or ')}: ${entry.reason}`);
        }
        expect(report.exitCode, 'a batch with a wrong name form gives exit code 1').toBe(1);
        expect(problems, problems.join('\n')).toEqual([]);
    }, 300_000);

    it('R-P4-27 rejects an empty request for the batch check', async () => {
        // ADV-P4-3: an empty row list must not give exit code 0 (A4, vacuous pass). The folder
        // holds a valid manifest, so only the empty request can cause the throw. The one-row
        // anchor proves that the function is not a blanket throw.
        const api = await pictureCheck();
        const row = week1Row('l2-w01-check-row-cup');
        const dir = stagedBatch([await ownJob(row)]);
        const anchor = await api.checkStorytimePictureBatch([row], dir);
        expect(anchor.exitCode, 'the one-row anchor passes').toBe(0);
        await expect(api.checkStorytimePictureBatch([], dir)).rejects.toThrow();
    }, 120_000);

    it('R-P4-28 the batch CLI passes the 30 rows with four redone rows and names a duplicate row id', async () => {
        const { spawnSync } = await import('node:child_process');
        const runCli = (dir: string) => spawnSync(process.execPath, ['--import', 'tsx', pictureBatchCliPath, '--batch', dir, '--level', '2', '--weeks', '1'], { encoding: 'utf8', timeout: 300_000 });
        const rows = week1Rows();
        const ok = runCli(await week1RedoBatch());
        const okOut = `${ok.stdout}\n${ok.stderr}`;
        expect(ok.status, 'the run was not killed by the spawn timeout').not.toBeNull();
        expect(ok.status, `the run exits 0 for the batch with four redone rows: ${okOut}`).toBe(0);
        const okLines = ok.stdout.split('\n');
        const missing = rows.filter((row) => !okLines.includes(`pass  ${row.id}`)).map((row) => row.id);
        expect(missing, 'a pass line for each of the 30 rows').toEqual([]);
        // a duplicate: a pending job with the id of the first row sits before its ready job
        const dupRow = rows[0];
        const dupDir = stagedBatch([await ownJob(dupRow, { jobStatus: 'pending', selectedVersion: null }), ...(await week1RedoJobs())]);
        const dup = runCli(dupDir);
        const dupOut = `${dup.stdout}\n${dup.stderr}`;
        expect(dup.status, 'the run was not killed by the spawn timeout').not.toBeNull();
        expect(dup.status, `the run exits 1 for a duplicate row id: ${dupOut}`).toBe(1);
        const dupLine = dup.stdout.split('\n').find((line) => line.startsWith(`fail  ${dupRow.id}:`));
        expect(dupLine, `a fail line for the row ${dupRow.id}: ${dupOut}`).toBeTruthy();
        expect(dupLine ?? '', 'the fail line says duplicate').toMatch(/duplicate/i);
    }, 900_000);

    it('R-P4-35 takes the expected name stem from the row id and not from the list file names (A-P4-12)', async () => {
        // PM option A (2026-11-02): the row id is the only source of the expected stem, so a color
        // file is `<row id>-v<N>.png` and a line art is `<row id>-line-v<N>.png`. Both requested
        // rows carry list names with the stem `legacy-<word>`, which is not the row id. Row (a)
        // delivers the files of its row id and must pass. Row (b) delivers the files of its list
        // stem and must fail. The files are real and pass the measurements, so only the name rule decides.
        const api = await pictureCheck();
        const cup = week1Row('l2-w01-check-row-cup');
        const cat = week1Row('l2-w01-check-row-cat');
        const legacy = (row: Week1Row, word: string): Week1Row => ({ ...row, fileName: `legacy-${word}-v1.png`, lineArtFileName: `legacy-${word}-line-v1.png` });
        const requested = [legacy(cup, 'cup'), legacy(cat, 'cat')];
        const jobs: StagedJob[] = [
            await ownJob(cup), // (a) the files <row id>-v1.png and <row id>-line-v1.png
            await ownJob(cat, { colorName: 'legacy-cat-v1.png', lineName: 'legacy-cat-line-v1.png' }), // (b) the files of the list stem
        ];
        const report = await api.checkStorytimePictureBatch(requested, stagedBatch(jobs));
        const problems: string[] = [];
        expect(report.results.map((entry) => entry.rowId), 'one result for each requested row, in order').toEqual([cup.id, cat.id]);
        const [a, b] = report.results;
        if (a?.status !== 'pass') problems.push(`(a) ${cup.id}: the files of the row id did not pass although the list names differ: ${a?.reason}`);
        if (b?.status !== 'fail') problems.push(`(b) ${cat.id}: the files of the list stem legacy-cat did not fail`);
        else {
            if (!(b.reason ?? '').includes(cat.id)) problems.push(`(b) ${cat.id}: the reason does not name the row id: ${b.reason}`);
            if (!['legacy-cat-v1.png', 'legacy-cat-line-v1.png'].some((name) => (b.reason ?? '').includes(name))) problems.push(`(b) ${cat.id}: the reason does not name a file: ${b.reason}`);
        }
        expect(report.exitCode, 'the batch with a file of the wrong stem gives exit code 1').toBe(1);
        expect(problems, problems.join('\n')).toEqual([]);
    }, 300_000);

    it('R-P4-37 fails a color file or a line art with an extra suffix after the version, and names the row id and the file (A-P4-13)', async () => {
        // A starts-with name test passes `<row id>-v1-extra.png`. Each faulty row holds a real,
        // passing file, and its other file has the correct name, so only the name rule can fail it.
        // The control row proves the check is not a blanket reject.
        const api = await pictureCheck();
        const [fish, cat, dog] = ['fish', 'cat', 'dog'].map((word) => week1Row(`l2-w01-check-row-${word}`));
        const jobs: StagedJob[] = [
            await ownJob(fish), // control: correct names
            await ownJob(cat, { colorName: `${cat.id}-v1-extra.png` }), // the color file has a suffix; the line art is correct
            await ownJob(dog, { lineName: `${dog.id}-line-v1-extra.png` }), // the line art has a suffix; the color file is correct
        ];
        const requested = [fish, cat, dog];
        const report = await api.checkStorytimePictureBatch(requested, stagedBatch(jobs));
        const failing = new Map<string, string>([
            [cat.id, `${cat.id}-v1-extra.png`],
            [dog.id, `${dog.id}-line-v1-extra.png`],
        ]);
        const problems: string[] = [];
        expect(report.results.map((entry) => entry.rowId), 'one result for each requested row, in order').toEqual(requested.map((row) => row.id));
        for (const entry of report.results) {
            const offending = failing.get(entry.rowId);
            if (!offending) {
                if (entry.status !== 'pass') problems.push(`${entry.rowId}: the control row with correct names did not pass: ${entry.reason}`);
                continue;
            }
            if (entry.status !== 'fail') { problems.push(`${entry.rowId}: the file ${offending} with an extra suffix did not fail`); continue; }
            if (!(entry.reason ?? '').includes(entry.rowId)) problems.push(`${entry.rowId}: the reason does not name the row id: ${entry.reason}`);
            if (!(entry.reason ?? '').includes(offending)) problems.push(`${entry.rowId}: the reason does not name the file ${offending}: ${entry.reason}`);
        }
        expect(report.exitCode, 'a batch with an extra suffix gives exit code 1').toBe(1);
        expect(problems, problems.join('\n')).toEqual([]);
    }, 300_000);
});

describe('Storytime readers: final-mode picture folder (Red 4g, orchestrator decision of 2026-11-02)', () => {
    /** The week 1 story page that Forge redid at version 2 in the real delivery. */
    const REDONE = 'l2-w01-story-page-a-net';
    const PAT = 'l2-w01-story-page-hello-i-am-pat';
    const MAY = 'l2-w01-story-page-hello-i-am-may';

    it('R-P4-29 resolves a redone row through the folder manifest: the line art in the workbook output, the color file in the A3 output', async () => {
        // Behavior 1 to 3: the picture folder holds the manifest of the accepted delivery. The list
        // keeps the -v1 names, the manifest holds the -v2 files of the redone row. The file list,
        // `data-picture-file`, and the `img` source all name the resolved file.
        const rows = await readerRows();
        const ids = rows.map((row) => row.id);
        expect(ids, 'the week 1 readers request the redone row').toContain(REDONE);
        expect(ids, 'the cover and 8 story pages of two readers').toHaveLength(18);
        const { repo, pictures } = finalRepo();
        writePictureFolder(pictures, jobsFor(ids, { [REDONE]: 2 }));
        for (const output of ['workbook', 'a3-color'] as const) {
            const wanted = (id: string): string => `${id}${output === 'workbook' ? '-line' : ''}-v${id === REDONE ? 2 : 1}.png`;
            const built = await inRoot(repo, async () => {
                const api = await import(readerPath) as ReaderApi;
                const options: ReaderOptions = { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output };
                const files = api.storytimeReaderPictureFiles([shipped()], options);
                let html = '';
                let failure = '';
                try {
                    html = api.compileStorytimeReaders([shipped()], options).html;
                } catch (e) {
                    failure = e instanceof Error ? e.message : String(e);
                }
                return { files, html, failure };
            });
            expect(built.files.map((entry) => entry.rowId).sort(), `${output}: the file list holds the 18 rows`).toEqual([...ids].sort());
            const wrong = built.files.filter((entry) => entry.fileName !== wanted(entry.rowId) || entry.file !== path.join(pictures, wanted(entry.rowId)));
            expect(wrong.map((entry) => `${entry.rowId}: ${entry.fileName} at ${entry.file}`), `${output}: each row resolves to its manifest file`).toEqual([]);
            expect(built.failure, `${output}: the final compile resolves every row`).toBe('');
            const doc = new DOMParser().parseFromString(built.html, 'text/html');
            const elements = Array.from(doc.querySelectorAll('[data-picture-id]'));
            expect(elements.map((el) => el.getAttribute('data-picture-id')).sort(), `${output}: 18 picture elements`).toEqual([...ids].sort());
            for (const el of elements) {
                const id = el.getAttribute('data-picture-id')!;
                expect(el.getAttribute('data-picture-file'), `${output}: data-picture-file of ${id}`).toBe(wanted(id));
                const src = decodeURIComponent(el.querySelector('img')?.getAttribute('src') ?? '');
                expect(src, `${output}: img source of ${id}`).toBe(`file://${path.join(pictures, wanted(id))}`);
            }
            const otherKind = output === 'workbook' ? `${REDONE}-v2.png` : `${REDONE}-line-v2.png`;
            expect(built.html, `${output}: the redone row never prints the other output's file`).not.toContain(otherKind);
            expect(built.html, `${output}: the list name of the redone row does not print`).not.toContain(`${REDONE}${output === 'workbook' ? '-line' : ''}-v1.png`);
        }
    }, 120_000);

    it('R-P4-31 final mode without manifest.json stops before any write and names manifest.json and the folder; proof mode needs no picture folder', async () => {
        // Behavior 5. The folder holds the PNG files of every requested row but no manifest.json.
        // The checks are soft, so that the in-process checks and the proof guard also run when the CLI check fails.
        const rows = await readerRows();
        const { repo, pictures } = finalRepo();
        writePictureFolder(pictures, jobsFor(rows.map((row) => row.id)));
        fs.rmSync(path.join(pictures, 'manifest.json'));
        const home = temp();
        const { spawnSync } = await import('node:child_process');
        const run = spawnSync(process.execPath, ['--import', 'tsx', cliPath, '--level', '2', '--weeks', '1', '--final', '--a3-color'], { encoding: 'utf8', env: { ...process.env, HOME: home, WORKBOOKS_ROOT: repo }, timeout: 300_000 });
        const out = `${run.stdout}\n${run.stderr}`;
        expect(run.status, 'the run was not killed by the spawn timeout').not.toBeNull();
        expect.soft(run.status, `the final build exits nonzero: ${out}`).not.toBe(0);
        expect.soft(out, 'the message names the missing manifest.json').toContain('manifest.json');
        expect.soft(out, 'the message names the picture folder').toContain(pictures);
        expect.soft(printLeftovers(home), 'the stopped build writes no output file and creates no output folder').toEqual([]);
        for (const output of ['workbook', 'a3-color'] as const) {
            const message = await readerBuildError(repo, output);
            expect.soft(message, `${output}: the compile stops and names manifest.json`).toContain('manifest.json');
        }
        // Guard: proof mode does not change. A repository without any picture folder prints placeholders.
        const bare = temp();
        fs.mkdirSync(path.join(bare, 'content', 'storytime', 'l2'), { recursive: true });
        const proofHtml = await inRoot(bare, async () => {
            const api = await import(readerPath) as ReaderApi;
            return api.compileStorytimeReaders([shipped()], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook' }).html;
        });
        expect(proofHtml, 'proof mode prints the placeholders without a picture folder').toContain('PICTURE MISSING');
    }, 420_000);

    it('R-P4-32 final mode with a file that differs from the manifest SHA-256 stops before any write, names the row id, and leaves no output folder', async () => {
        // Behavior 4. The A3 output requests the color file of the row; its bytes change after the
        // manifest was written, so the file still exists but is not the accepted file.
        const rows = await readerRows();
        const ids = rows.map((row) => row.id);
        const { repo, pictures } = finalRepo();
        writePictureFolder(pictures, jobsFor(ids));
        const changedId = 'l2-w01-story-page-a-nut';
        expect(ids).toContain(changedId);
        fs.appendFileSync(path.join(pictures, `${changedId}-v1.png`), 'changed after the manifest');
        const home = temp();
        const { spawnSync } = await import('node:child_process');
        const run = spawnSync(process.execPath, ['--import', 'tsx', cliPath, '--level', '2', '--weeks', '1', '--final', '--a3-color'], { encoding: 'utf8', env: { ...process.env, HOME: home, WORKBOOKS_ROOT: repo }, timeout: 300_000 });
        const out = `${run.stdout}\n${run.stderr}`;
        expect(run.status, 'the run was not killed by the spawn timeout').not.toBeNull();
        expect(run.status, `the final build exits nonzero: ${out}`).not.toBe(0);
        expect(out, 'the message names the row id').toContain(changedId);
        expect(out, 'the message names the SHA-256 problem').toMatch(/sha-?256/i);
        expect(printLeftovers(home), 'the stopped build writes no output file and creates no output folder').toEqual([]);
    }, 420_000);

    it('R-P4-33 final mode stops and names the row id for a duplicate row id, a name of another row id, a path outside the folder, and a name version that is not selectedVersion', async () => {
        // Behavior 2 with the stage 1 rules. Each case writes the list-name files of the failing row
        // as well (a decoy that the manifest does not name), so a build that ignores the manifest
        // finds its files and does not stop.
        const rows = await readerRows();
        const ids = rows.map((row) => row.id);
        expect(ids, 'the week 1 readers request the two rows of the cases').toEqual(expect.arrayContaining([PAT, MAY]));
        const decoys = (pictures: string, id: string): void => {
            for (const name of [`${id}-v1.png`, `${id}-line-v1.png`]) fs.writeFileSync(path.join(pictures, name), `decoy ${name}`);
        };
        const cases: Array<[string, (jobs: PictureFolderJob[], pictures: string) => PictureFolderJob[], RegExp | null]> = [
            ['a duplicate row id', (jobs) => [{ rowId: PAT }, ...jobs], /duplicate/i],
            ['the files of another row id', (jobs, pictures) => {
                decoys(pictures, PAT);
                return jobs.map((job) => (job.rowId === PAT ? { ...job, colorPath: `${MAY}-v1.png`, linePath: `${MAY}-line-v1.png` } : job));
            }, null],
            ['a path outside the folder', (jobs, pictures) => {
                decoys(pictures, PAT);
                return jobs.map((job) => (job.rowId === PAT ? { ...job, colorPath: `../outside/${PAT}-v1.png`, linePath: `../outside/${PAT}-line-v1.png` } : job));
            }, null],
            ['v2 file names with the version 1 job', (jobs, pictures) => {
                decoys(pictures, PAT);
                return jobs.map((job) => (job.rowId === PAT ? { ...job, version: 1, colorPath: `${PAT}-v2.png`, linePath: `${PAT}-line-v2.png` } : job));
            }, null],
        ];
        const problems: string[] = [];
        for (const [label, change, reasonPattern] of cases) {
            for (const output of ['workbook', 'a3-color'] as const) {
                const { repo, pictures } = finalRepo();
                const jobs = change(jobsFor(ids), pictures);
                writePictureFolder(pictures, jobs);
                const message = await readerBuildError(repo, output);
                if (!message) { problems.push(`${label} (${output}): the build did not stop`); continue; }
                if (!message.includes(PAT)) problems.push(`${label} (${output}): the message does not name the row id ${PAT}: ${message}`);
                if (reasonPattern && !reasonPattern.test(message)) problems.push(`${label} (${output}): the message does not match ${reasonPattern}: ${message}`);
            }
        }
        expect(problems, problems.join('\n')).toEqual([]);
    }, 240_000);

    it('R-P4-34 the root .gitignore ignores the Forge picture folder and keeps pictures.json and pictures.md tracked', async () => {
        // Behavior 6. This repository is public (Daniel, 2026-10-28), so a copied Forge file must
        // not become repository content. `git check-ignore` exits 0 for an ignored path and 1 for a path that is not ignored.
        const { spawnSync } = await import('node:child_process');
        const repoRoot = path.resolve(STORYTIME_ROOT, '..', '..');
        const ignoredCode = (rel: string): number | null => spawnSync('git', ['check-ignore', '-q', '--', rel], { cwd: repoRoot, encoding: 'utf8' }).status;
        for (const rel of [
            'content/storytime/l2/print/pictures/l2-w01-cover-hello-v1.png',
            'content/storytime/l2/print/pictures/l2-w01-cover-hello-line-v2.png',
            'content/storytime/l2/print/pictures/manifest.json',
            'content/storytime/l1/print/pictures/l1-w01-cover-x-v1.png',
        ]) expect(ignoredCode(rel), `${rel} is ignored`).toBe(0);
        for (const rel of [
            'content/storytime/l2/print/pictures.json',
            'content/storytime/l2/print/pictures.md',
            'content/storytime/l2/w01.json',
        ]) expect(ignoredCode(rel), `${rel} stays tracked, not ignored`).toBe(1);
    }, 30_000);

    it('R-P4-36 the final-mode resolver takes the expected name stem from the row id and not from the list file names (A-P4-12)', async () => {
        // The same rule as R-P4-35 at the level of the shared resolver of Green 4g. Both rows carry
        // list names with the stem `legacy-<word>`. Row (a) has the folder files of its row id and
        // must resolve for both kinds. Row (b) has folder files of its list stem, which are real
        // files with the manifest SHA-256, and must fail and name the row id and a file.
        const api = await pictureCheck();
        const cupId = 'l2-w01-check-row-cup';
        const catId = 'l2-w01-check-row-cat';
        const legacyRow = (id: string, word: string) => ({ id, fileName: `legacy-${word}-v1.png`, lineArtFileName: `legacy-${word}-line-v1.png`, width: 4000, height: 3000, week: 1 });
        const folder = path.join(temp(), 'pictures');
        writePictureFolder(folder, [
            { rowId: cupId },
            { rowId: catId, colorPath: 'legacy-cat-v1.png', linePath: 'legacy-cat-line-v1.png' },
        ]);
        const cup = legacyRow(cupId, 'cup');
        const cat = legacyRow(catId, 'cat');
        for (const kind of ['color', 'line'] as const) {
            const wanted = `${cupId}${kind === 'line' ? '-line' : ''}-v1.png`;
            const [resolved] = api.resolveStorytimePictureFiles(folder, [cup], kind);
            expect.soft(resolved, `${kind}: the row (a) resolves although its list names differ`).toEqual({ rowId: cupId, fileName: wanted, file: path.join(folder, wanted) });
            let message = '';
            try {
                api.resolveStorytimePictureFiles(folder, [cat], kind);
            } catch (e) {
                message = e instanceof Error ? e.message : String(e);
            }
            expect.soft(message, `${kind}: the row (b) with the files of its list stem fails`).not.toBe('');
            expect.soft(message, `${kind}: the reason names the row id`).toContain(catId);
            // The name rule reads the color file first, so the reason may name either file of the job.
            expect.soft(message, `${kind}: the reason names a file of the row (b)`).toMatch(/legacy-cat(-line)?-v1\.png/);
        }
    }, 60_000);
});
