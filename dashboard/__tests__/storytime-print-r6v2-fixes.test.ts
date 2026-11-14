// @vitest-environment node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { readerLeafMarkCss } from '../lib/storytime/print/readers';
import {
    forgeManifestEntriesForRow,
    readStorytimePictureManifest,
    resolveStorytimePictureFiles,
    type StorytimePictureFile,
} from '../lib/storytime/print/picture-check';

/**
 * Phase 9, P9 Red: the r6-v2 fix batch (spec addendum "Addendum 2026-11-14: print audit gate,
 * code tests, and the r6-v2 fix batch", decisions P9-A3 to P9-A8; plan task "Red, r6-v2 fix
 * batch"; cases X1 to X7).
 *
 * The module `lib/storytime/print/line-art-fix.ts` and the table `l2/print/pictures-line-fix.json`
 * do not exist yet, and the four filled files of `l2/print/pictures-fix/` do not exist yet, so
 * every case that needs them fails inside its body with a label that names the missing module,
 * export, or file. The cases of the shipped rules (X2, X5, X6, and the clip part of X7) fail on
 * the old values of the files. The guard of X7 passes.
 *
 * Names that the spec leaves open are fixed here, so that Green does not guess. Each is marked
 * PIN:
 *  - PIN the new module `lib/storytime/print/line-art-fix.ts` exports the type
 *    `StorytimeLineArtFixEntry`, the type `StorytimeLineArtFixTable` (a record by picture row
 *    id), and the three functions below.
 *  - PIN `StorytimeLineArtFixEntry` holds `sourceFile`, `sourceSha256`, `replacement` (a path
 *    relative to `content/storytime/`), `replacementSha256`, `reason` (`'D1'` or `'D7'`), and,
 *    for `D7` only, `fill` with `seed` (`[x, y]` in pixels), `areaPx`, and `bbox`
 *    (`[minX, minY, maxX, maxY]`, both ends included).
 *  - PIN `readStorytimeLineArtFixTable()` reads `l2/print/pictures-line-fix.json` and gives an
 *    empty table when the file is missing, as `readArtEdgeFillTable` does.
 *  - PIN `applyStorytimeLineArtFixes(files, kind, table?)` takes the resolved files, the kind
 *    `'color'` or `'line'`, and an optional table (the data file when absent). It gives a new
 *    array in the same order. A `line` file whose table entry `sourceSha256` equals the
 *    SHA-256 of its bytes gets `file` set to the absolute path of the replacement and keeps
 *    `fileName`. An unlisted row, a `color` file, and a file whose bytes differ stay equal. A
 *    missing replacement, or a replacement whose SHA-256 is not `replacementSha256`, throws an
 *    error whose message starts with `line-art fix:`.
 *  - PIN `fillStorytimeLineArtHair(gray, fill)` takes `{ data (8-bit gray), width, height }` and
 *    `{ seed, areaPx, bbox }`, and gives a new buffer of the same length. It throws an error whose
 *    message starts with `line-art fill:` when the seed pixel is below 128, when the region
 *    touches the image border, when its area is not `areaPx`, or when its box is not `bbox`.
 *    Otherwise it sets every pixel of the region to 0 and changes no other pixel.
 *  - PIN the four filled files take the source name with `-line-v1.png` replaced by
 *    `-hair-v1.png`, in `l2/print/pictures-fix/`.
 *  - PIN `.match-choices` keeps its dotted match line, so the dashed selectors of the compiled
 *    book are exactly the three that P9-A6 names.
 *  - PIN `pictureElement` writes `data-edge-ink="clip"` on the picture box of the two rows
 *    `l2-w01-check-row-nose` and `l2-w01-practice-line-nose` only, and the page CSS holds one
 *    rule `.picture-box[data-edge-ink] img { clip-path: inset(1.5mm); }`.
 *  - PIN the printed border width of the tick uses the whole-CSS-pixel rule:
 *    `max(1, floor(cssMm * 96 / 25.4)) * 25.4 / 96` mm.
 *
 * Every expected value below is a value of the spec, written by hand. The test never reads an
 * expected value from the code under the test. The file holds no Thai string, names no track
 * folder, and writes no file outside `/tmp/opencode`.
 */

const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');
const lineArtFixModule = path.join(dashboardRoot, 'lib/storytime/print/line-art-fix.ts');
const pictureFolder = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');
const pictureListFile = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json');
const fixTableFile = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures-line-fix.json');

const TEN_ROW = 'l2-w06-check-row-ten';
const TEN_SOURCE = 'l2-w06-check-row-ten-line-v2.png';
const TEN_SOURCE_SHA = 'b9647ab86cf41e1839877290f668e9f984c830307944fa8440433111d4b07e1e';
const TEN_REPLACEMENT = 'l2/media/w02/family/ten.jpg';
const TEN_REPLACEMENT_SHA = '45548b692934a9ff1d9a39da120c214d77c8eeffc08bd582ff90a1bdc7285431';

const MAP_ROW = 'l2-w06-story-page-pat-can-see-a-map';

interface D7Pin {
    id: string;
    source: string;
    sourceSha: string;
    seed: [number, number];
    areaPx: number;
    bbox: [number, number, number, number];
}

const D7_ROWS: D7Pin[] = [
    {
        id: 'l2-w06-story-page-pat-sat-on-a-mat',
        source: 'l2-w06-story-page-pat-sat-on-a-mat-line-v1.png',
        sourceSha: '78ece6ba9bbc269abb6aa726da348b4c2edb9474e29ccabd4671cc07b2d27bb2',
        seed: [1550, 1420],
        areaPx: 157420,
        bbox: [1195, 1297, 1896, 1733],
    },
    {
        id: 'l2-w06-story-page-sam-sat-on-a-mat',
        source: 'l2-w06-story-page-sam-sat-on-a-mat-line-v1.png',
        sourceSha: '8f930c72a36408f2042ac587b534866f7fe5e87ef3eb0ad6232b00993490b20f',
        seed: [1500, 1360],
        areaPx: 187021,
        bbox: [1143, 1229, 1874, 1741],
    },
    {
        id: 'l2-w06-story-page-pip-sat-on-the-mat',
        source: 'l2-w06-story-page-pip-sat-on-the-mat-line-v1.png',
        sourceSha: 'f990e6ab90ad467954a1fbcecf0eb360245698c0ede720d1b18ba24c5e99058a',
        seed: [1270, 1360],
        areaPx: 186107,
        bbox: [820, 1236, 1543, 1773],
    },
    {
        id: 'l2-w06-cover-tap-tap',
        source: 'l2-w06-cover-tap-tap-line-v1.png',
        sourceSha: '48efe50b69efd80f5a712073efd6c4cca602e1347649941336a0149b782f42d0',
        seed: [1485, 1422],
        areaPx: 214243,
        bbox: [1115, 1283, 1834, 1820],
    },
];

interface LineArtFixFill {
    seed: [number, number];
    areaPx: number;
    bbox: [number, number, number, number];
}

interface LineArtFixEntryView {
    sourceFile: string;
    sourceSha256: string;
    replacement: string;
    replacementSha256: string;
    reason: 'D1' | 'D7';
    fill?: LineArtFixFill;
}

interface LineArtFixModule {
    readStorytimeLineArtFixTable: () => Record<string, LineArtFixEntryView>;
    applyStorytimeLineArtFixes: (
        files: StorytimePictureFile[],
        kind: 'color' | 'line',
        table?: Record<string, LineArtFixEntryView>,
    ) => StorytimePictureFile[];
    fillStorytimeLineArtHair: (
        gray: { data: Uint8Array; width: number; height: number },
        fill: LineArtFixFill,
    ) => Uint8Array;
}

interface SharpOutput {
    data: Buffer;
    info: { width: number; height: number; channels: number };
}

type SharpFactory = (input: string | Buffer) => {
    greyscale: () => { raw: () => { toBuffer: (options: { resolveWithObject: true }) => Promise<SharpOutput> } };
    metadata: () => Promise<{ width?: number; height?: number; channels?: number; depth?: string }>;
};

interface PictureRowView {
    id: string;
    week: number;
    use: string;
    text: string;
    sizeClass: string;
    fileName: string;
    lineArtFileName: string;
    width: number;
    height: number;
}

const temporaryFolders: string[] = [];
afterAll(() => {
    for (const folder of temporaryFolders) fs.rmSync(folder, { recursive: true, force: true });
});

function week(n: number): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, n), 'utf8')));
}

function allWeeks(): StorytimeWeek[] {
    return [1, 2, 3, 4, 5, 6, 7, 8].map((n) => week(n));
}

function pictureRows(): PictureRowView[] {
    return JSON.parse(fs.readFileSync(pictureListFile, 'utf8')) as PictureRowView[];
}

function sha256(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function styleOf(html: string): string {
    return Array.from(html.matchAll(/<style>([\s\S]*?)<\/style>/g), (match) => match[1]).join('\n');
}

/** The selector of every CSS rule whose body holds the word. */
function ruleSelectors(css: string, word: RegExp): string[] {
    const selectors: string[] = [];
    for (const match of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        if (word.test(match[2])) selectors.push(match[1].trim().replace(/\s+/g, ' '));
    }
    return selectors;
}

/** The printed millimetres of a CSS border width, by the whole-CSS-pixel rule of P9-A7. */
function printedBorderMm(cssValue: string): number {
    const px = cssValue.endsWith('px')
        ? Number.parseFloat(cssValue)
        : Math.max(1, Math.floor((Number.parseFloat(cssValue) * 96) / 25.4));
    return (px * 25.4) / 96;
}

async function fixModule(): Promise<LineArtFixModule> {
    expect(fs.existsSync(lineArtFixModule), 'Missing module: lib/storytime/print/line-art-fix.ts').toBe(true);
    const mod = (await import(lineArtFixModule)) as unknown as LineArtFixModule;
    expect(mod.readStorytimeLineArtFixTable, 'Export readStorytimeLineArtFixTable.').toBeTypeOf('function');
    expect(mod.applyStorytimeLineArtFixes, 'Export applyStorytimeLineArtFixes.').toBeTypeOf('function');
    expect(mod.fillStorytimeLineArtHair, 'Export fillStorytimeLineArtHair.').toBeTypeOf('function');
    return mod;
}

async function sharp(): Promise<SharpFactory> {
    const { default: factory } = (await import('sharp')) as unknown as { default: SharpFactory };
    return factory;
}

function temporaryFolder(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const folder = fs.mkdtempSync('/tmp/opencode/storytime-r6v2-');
    temporaryFolders.push(folder);
    return folder;
}

function errorOf(fn: () => unknown): string {
    try {
        fn();
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
    throw new Error('expected the call to throw');
}

function rowById(id: string): PictureRowView {
    const row = pictureRows().find((candidate) => candidate.id === id);
    if (!row) throw new Error(`the picture list holds no row ${id}`);
    return row;
}

/** The selected line-art file name of a row, from the manifest. */
function selectedLineArt(row: PictureRowView): string {
    const manifest = readStorytimePictureManifest(pictureFolder);
    const entries = forgeManifestEntriesForRow(manifest, row);
    return entries[1].fileName;
}

// ---------------------------------------------------------------------------------------------
// X1: the fix table and the resolver (P9-A3, AC9-A2)
// ---------------------------------------------------------------------------------------------

describe('X1: the line-art fix table and the resolver (P9-A3)', () => {
    it('X1a: the table holds exactly the five entries, with the source and replacement SHA-256 pins', async () => {
        expect(fs.existsSync(fixTableFile), 'Missing file: content/storytime/l2/print/pictures-line-fix.json').toBe(true);
        const mod = await fixModule();
        const table = mod.readStorytimeLineArtFixTable();
        expect(Object.keys(table).sort()).toEqual([TEN_ROW, ...D7_ROWS.map((pin) => pin.id)].sort());

        const ten = table[TEN_ROW];
        expect(ten, `the table entry ${TEN_ROW}`).toBeDefined();
        if (!ten) return;
        expect(ten.reason, 'the reason of the ten entry').toBe('D1');
        expect(ten.sourceFile, 'the source file of the ten entry').toBe(TEN_SOURCE);
        expect(ten.sourceSha256, 'the source SHA-256 of the ten entry').toBe(TEN_SOURCE_SHA);
        expect(ten.replacement, 'the replacement of the ten entry').toBe(TEN_REPLACEMENT);
        expect(ten.replacementSha256, 'the replacement SHA-256 of the ten entry').toBe(TEN_REPLACEMENT_SHA);
        expect(ten.fill, 'the ten entry has no fill').toBeUndefined();
        expect(sha256(path.join(pictureFolder, TEN_SOURCE)), 'the SHA-256 of the shipped ten line art').toBe(TEN_SOURCE_SHA);
        expect(sha256(path.join(STORYTIME_ROOT, TEN_REPLACEMENT)), 'the SHA-256 of the shipped ten picture').toBe(TEN_REPLACEMENT_SHA);

        for (const pin of D7_ROWS) {
            const entry = table[pin.id];
            expect(entry, `the table entry ${pin.id}`).toBeDefined();
            if (!entry) continue;
            expect(entry.reason, `the reason of ${pin.id}`).toBe('D7');
            expect(entry.sourceFile, `the source file of ${pin.id}`).toBe(pin.source);
            expect(entry.sourceSha256, `the source SHA-256 of ${pin.id}`).toBe(pin.sourceSha);
            expect(entry.replacement, `the replacement path of ${pin.id}`).toBe(
                path.join('l2', 'print', 'pictures-fix', `${pin.source.replace(/-line-v1\.png$/, '')}-hair-v1.png`),
            );
            expect(entry.fill, `the fill of ${pin.id}`).toBeDefined();
            expect(entry.fill?.seed, `the seed of ${pin.id}`).toEqual(pin.seed);
            expect(entry.fill?.areaPx, `the area of ${pin.id}`).toBe(pin.areaPx);
            expect(entry.fill?.bbox, `the box of ${pin.id}`).toEqual(pin.bbox);
            expect(sha256(path.join(pictureFolder, pin.source)), `the SHA-256 of the shipped source of ${pin.id}`).toBe(pin.sourceSha);
            expect(fs.existsSync(path.join(STORYTIME_ROOT, entry.replacement)), `Missing file: ${entry.replacement}`).toBe(true);
            expect(sha256(path.join(STORYTIME_ROOT, entry.replacement)), `the SHA-256 of the replacement of ${pin.id}`)
                .toBe(entry.replacementSha256);
        }
    });

    it('X1b: a line result swaps file and keeps fileName through the shipped resolver', async () => {
        await fixModule();
        const ten = resolveStorytimePictureFiles(pictureFolder, [rowById(TEN_ROW)], 'line');
        expect(ten, 'one file for one row').toHaveLength(1);
        expect(ten[0].fileName, 'the ten row keeps its line-art file name').toBe(TEN_SOURCE);
        expect(ten[0].file, 'the ten row swaps to the picture').toBe(path.join(STORYTIME_ROOT, TEN_REPLACEMENT));

        for (const pin of D7_ROWS) {
            const filled = resolveStorytimePictureFiles(pictureFolder, [rowById(pin.id)], 'line');
            expect(filled, `one file for ${pin.id}`).toHaveLength(1);
            expect(filled[0].fileName, `the file name of ${pin.id} stays`).toBe(selectedLineArt(rowById(pin.id)));
            expect(filled[0].file, `the file of ${pin.id} swaps to the filled copy`).toBe(
                path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures-fix', `${pin.source.replace(/-line-v1\.png$/, '')}-hair-v1.png`),
            );
        }
    });

    it('X1c: a color result and an unlisted row do not change, and a scratch folder with other bytes gets no swap', async () => {
        const mod = await fixModule();
        const tenSource = { rowId: TEN_ROW, fileName: TEN_SOURCE, file: path.join(pictureFolder, TEN_SOURCE) };
        const asColor = mod.applyStorytimeLineArtFixes([tenSource], 'color');
        expect(asColor, 'one result').toHaveLength(1);
        expect(asColor[0].file, 'a color result keeps its file').toBe(tenSource.file);
        expect(asColor[0].fileName, 'a color result keeps its file name').toBe(TEN_SOURCE);

        const nest = rowById('l2-w01-check-row-nest');
        const nestFile = path.join(pictureFolder, selectedLineArt(nest));
        const unlisted = mod.applyStorytimeLineArtFixes([{ rowId: nest.id, fileName: selectedLineArt(nest), file: nestFile }], 'line');
        expect(unlisted[0].file, 'an unlisted row keeps its file').toBe(nestFile);

        const scratch = path.join(temporaryFolder(), TEN_SOURCE);
        fs.copyFileSync(path.join(pictureFolder, TEN_SOURCE), scratch);
        fs.appendFileSync(scratch, Buffer.from([0]));
        expect(sha256(scratch), 'the scratch copy holds other bytes').not.toBe(TEN_SOURCE_SHA);
        const unchanged = mod.applyStorytimeLineArtFixes([{ rowId: TEN_ROW, fileName: TEN_SOURCE, file: scratch }], 'line');
        expect(unchanged[0].file, 'a scratch copy with other bytes gets no swap').toBe(scratch);
        expect(unchanged[0].fileName, 'a scratch copy keeps its file name').toBe(TEN_SOURCE);
    });

    it('X1d: a wrong replacement SHA-256 and a missing replacement each throw an error that starts with line-art fix:', async () => {
        const mod = await fixModule();
        const table = mod.readStorytimeLineArtFixTable();
        const source = path.join(pictureFolder, TEN_SOURCE);
        const file = { rowId: TEN_ROW, fileName: TEN_SOURCE, file: source };

        const wrong = { ...table[TEN_ROW], replacementSha256: '0'.repeat(64) };
        const wrongMessage = errorOf(() => mod.applyStorytimeLineArtFixes([file], 'line', { [TEN_ROW]: wrong }));
        expect(wrongMessage, 'the message of a wrong replacement SHA-256').toMatch(/^line-art fix:/);

        const missing = { ...table[TEN_ROW], replacement: 'l2/media/w02/family/not-a-file.jpg' };
        const missingMessage = errorOf(() => mod.applyStorytimeLineArtFixes([file], 'line', { [TEN_ROW]: missing }));
        expect(missingMessage, 'the message of a missing replacement').toMatch(/^line-art fix:/);
    });
});

// ---------------------------------------------------------------------------------------------
// X2: the "ten" picture in the compiled student book (P9-A4, AC9-A2)
// ---------------------------------------------------------------------------------------------

describe('X2: the ten picture in the compiled student book (P9-A4)', () => {
    it('X2: every box of the row l2-w06-check-row-ten in weeks 6 and 8 loads ten.jpg and no box loads the line art', async () => {
        const html = compileStorytimeStudentBook(allWeeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'final' }).html;
        const boxes = Array.from(
            html.matchAll(/<div class="picture-box[^"]*" data-picture-id="l2-w06-check-row-ten"[^>]*>(<img[^>]*>)?/g),
            (match) => match[0],
        );
        expect(boxes.length, 'the boxes of the ten row, weeks 6 and 8').toBeGreaterThanOrEqual(2);
        const sources = boxes.map((box) => box.match(/<img src="([^"]*)"/)?.[1] ?? '');
        expect(sources, 'each box of the ten row prints an image').toHaveLength(boxes.length);
        for (const [index, src] of sources.entries()) {
            expect(src, `the image of the ten box ${index + 1}`).toContain('/l2/media/w02/family/ten.jpg');
            expect(src, `the image of the ten box ${index + 1} is not the line art`).not.toContain(TEN_SOURCE);
        }
    });
});

// ---------------------------------------------------------------------------------------------
// X3: the hair fill on the shipped files (P9-A5, checks (a) to (g))
// ---------------------------------------------------------------------------------------------

describe('X3: the hair fill on the shipped files (P9-A5)', () => {
    for (const pin of D7_ROWS) {
        it(`X3: ${pin.id} passes checks (a) to (g)`, async () => {
            const mod = await fixModule();
            const entry = mod.readStorytimeLineArtFixTable()[pin.id];
            expect(entry, `the table entry ${pin.id}`).toBeDefined();
            if (!entry || !entry.fill) return;
            const sourceFile = path.join(pictureFolder, pin.source);
            const replacementFile = path.join(STORYTIME_ROOT, entry.replacement);
            expect(fs.existsSync(replacementFile), `Missing file: ${entry.replacement}`).toBe(true);
            const sharpFactory = await sharp();
            const sourceMeta = await sharpFactory(sourceFile).metadata();
            const replacementMeta = await sharpFactory(replacementFile).metadata();
            expect([replacementMeta.width, replacementMeta.height], `(f) the size of the replacement of ${pin.id}`).toEqual([4000, 3000]);
            expect(replacementMeta.depth, `(f) the bit depth of the replacement of ${pin.id}`).toBe('uchar');
            expect(replacementMeta.channels, `(f) the channel count of the replacement of ${pin.id}`).toBe(1);
            expect([sourceMeta.width, sourceMeta.height], `the size of the source of ${pin.id}`).toEqual([4000, 3000]);

            const source = (await sharpFactory(sourceFile).greyscale().raw().toBuffer({ resolveWithObject: true })).data;
            const replacement = (await sharpFactory(replacementFile).greyscale().raw().toBuffer({ resolveWithObject: true })).data;
            expect(replacement.length, `(f) the pixel count of the replacement of ${pin.id}`).toBe(source.length);

            const [minX, minY, maxX, maxY] = pin.bbox;
            let darkChanged = 0;
            let changed = 0;
            let notBlack = 0;
            let outsideBox = 0;
            let sourceGray = 0;
            let replacementGray = 0;
            for (let y = 0; y < 3000; y++) {
                for (let x = 0; x < 4000; x++) {
                    const index = y * 4000 + x;
                    const s = source[index];
                    const d = replacement[index];
                    if (s < 128 && d !== s) darkChanged += 1;
                    if (s >= 128 && d !== s) {
                        changed += 1;
                        if (d !== 0) notBlack += 1;
                        if (x < minX || x > maxX || y < minY || y > maxY) outsideBox += 1;
                    }
                    if (s > 0 && s < 255) sourceGray += 1;
                    if (d > 0 && d < 255) replacementGray += 1;
                }
            }
            expect(darkChanged, `(a) an ink pixel of ${pin.id} changed`).toBe(0);
            expect(outsideBox, `(b) a changed pixel of ${pin.id} lies outside the box`).toBe(0);
            expect(changed, `(c) the count of changed pixels of ${pin.id}`).toBe(pin.areaPx);
            expect(notBlack, `(d) the mean of the replacement over the changed pixels of ${pin.id} is not 0`).toBe(0);
            expect(replacementGray, `(e) the count of gray pixels of ${pin.id}`).toBe(sourceGray);
        }, 300_000);
    }

    it('X3g: the table holds no entry for the row that already has black hair', async () => {
        const mod = await fixModule();
        expect(Object.prototype.hasOwnProperty.call(mod.readStorytimeLineArtFixTable(), MAP_ROW), `(g) an entry for ${MAP_ROW}`).toBe(false);
    });
});

// ---------------------------------------------------------------------------------------------
// X4: the fill function on small synthetic images
// ---------------------------------------------------------------------------------------------

describe('X4: the fill function on small synthetic images', () => {
    it('X4a: a seed on an ink pixel fails', async () => {
        const mod = await fixModule();
        const data = new Uint8Array(64).fill(255);
        for (let x = 0; x < 8; x++) data[3 * 8 + x] = 0;
        const message = errorOf(() => mod.fillStorytimeLineArtHair({ data, width: 8, height: 8 }, { seed: [4, 3], areaPx: 1, bbox: [0, 0, 7, 7] }));
        expect(message, 'a seed on a line').toMatch(/^line-art fill:/);
    });

    it('X4b: a region that touches the border fails', async () => {
        const mod = await fixModule();
        const data = new Uint8Array(36).fill(255);
        const message = errorOf(() => mod.fillStorytimeLineArtHair({ data, width: 6, height: 6 }, { seed: [0, 0], areaPx: 36, bbox: [0, 0, 5, 5] }));
        expect(message, 'a leak to the border').toMatch(/^line-art fill:/);
    });

    it('X4c: a region with another area fails', async () => {
        const mod = await fixModule();
        const data = new Uint8Array(25);
        for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) data[y * 5 + x] = 255;
        const message = errorOf(() => mod.fillStorytimeLineArtHair({ data, width: 5, height: 5 }, { seed: [2, 2], areaPx: 10, bbox: [1, 1, 3, 3] }));
        expect(message, 'a wrong area').toMatch(/^line-art fill:/);
    });

    it('X4d: a region with another box fails', async () => {
        const mod = await fixModule();
        const data = new Uint8Array(25);
        for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) data[y * 5 + x] = 255;
        const message = errorOf(() => mod.fillStorytimeLineArtHair({ data, width: 5, height: 5 }, { seed: [2, 2], areaPx: 9, bbox: [1, 1, 4, 4] }));
        expect(message, 'a wrong box').toMatch(/^line-art fill:/);
    });

    it('X4e: a right region becomes black, changes no other pixel, and leaves the source alone', async () => {
        const mod = await fixModule();
        const data = new Uint8Array(25);
        for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) data[y * 5 + x] = 255;
        const copy = Uint8Array.from(data);
        const out = mod.fillStorytimeLineArtHair({ data, width: 5, height: 5 }, { seed: [2, 2], areaPx: 9, bbox: [1, 1, 3, 3] });
        expect(Array.from(out), 'the filled pixels').toEqual(Array.from(new Uint8Array(25)));
        expect(Array.from(data), 'the source buffer').toEqual(Array.from(copy));
    });
});

// ---------------------------------------------------------------------------------------------
// X5: the dashed rules of the student book CSS (P9-A6, AC9-A3)
// ---------------------------------------------------------------------------------------------

describe('X5: the dashed rules of the student book CSS (P9-A6)', () => {
    it('X5: .picture-box is solid and the dashed rules are exactly .map-place, .perforation, and .fold-line', () => {
        const css = styleOf(compileStorytimeStudentBook(allWeeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html);
        const boxRule = css.match(/\.picture-box\s*\{([^}]*)\}/)?.[1] ?? '';
        expect(boxRule, 'the .picture-box rule exists and holds a solid 0.6 mm border').toMatch(/border:\s*0\.6mm solid #000/);
        expect(boxRule, 'the .picture-box rule is not dashed').not.toMatch(/dashed|dotted/);
        expect(ruleSelectors(css, /dashed/).sort(), 'the dashed rules of the compiled book').toEqual([
            '.fold-line',
            '.map-place',
            '.perforation',
        ]);
        expect(ruleSelectors(css, /dotted/).sort(), 'the dotted rules of the compiled book').toEqual(['.match-choices']);
    });
});

// ---------------------------------------------------------------------------------------------
// X6: the printed tick width (P9-A7, AC9-A3)
// ---------------------------------------------------------------------------------------------

describe('X6: the printed tick width (P9-A7)', () => {
    it('X6: the tick is 2px solid, 5 mm long, offset -0.25mm, and prints at least 0.45 mm by the whole-pixel rule', () => {
        const rule = readerLeafMarkCss(STORYTIME_PRINT_PROFILE).match(/\.tear-tick\s*\{([^}]*)\}/)?.[1] ?? '';
        expect(rule, 'the .tear-tick rule exists').not.toBe('');
        const border = rule.match(/border-left:\s*([\d.]+(?:px|mm))\s+(\w+)/);
        expect(border, 'the .tear-tick rule holds a border-left width and style').not.toBeNull();
        if (!border) return;
        expect(border[2], 'the tick border is solid').toBe('solid');
        expect(rule, 'the tick offset').toMatch(/left:\s*-0\.25mm/);
        expect(rule, 'the tick length').toMatch(/height:\s*5mm/);
        expect(rule, 'the tick has no width of its own').toMatch(/width:\s*0\b/);
        expect(rule, 'the tick border is not 0.4mm').not.toMatch(/0\.4mm/);
        expect(rule, 'the tick border is not 0.5mm').not.toMatch(/0\.5mm/);
        expect(printedBorderMm(border[1]), 'the printed tick width').toBeGreaterThanOrEqual(0.45);
        expect(printedBorderMm('0.4mm'), 'the printed width of 0.4mm').toBeLessThan(0.45);
        expect(printedBorderMm('0.5mm'), 'the printed width of 0.5mm').toBeLessThan(0.45);
        const studentCss = styleOf(compileStorytimeStudentBook([week(1)], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html);
        expect(studentCss.match(/\.tear-tick\s*\{([^}]*)\}/)?.[1] ?? '', 'the student book holds the same tick rule').toBe(rule);
    });
});

// ---------------------------------------------------------------------------------------------
// X7: the nose clip (P9-A8, AC9-A3)
// ---------------------------------------------------------------------------------------------

describe('X7: the nose clip (P9-A8)', () => {
    it('X7a: exactly the two nose picture boxes carry data-edge-ink=clip', () => {
        const html = compileStorytimeStudentBook([week(1)], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html;
        const clipped = Array.from(
            html.matchAll(/<div class="picture-box[^"]*" data-picture-id="([^"]*)"[^>]*data-edge-ink="clip"/g),
            (match) => match[1],
        ).sort();
        expect(clipped, 'the boxes with the clip mark').toEqual(['l2-w01-check-row-nose', 'l2-w01-practice-line-nose']);
        const boxes = Array.from(html.matchAll(/<div class="picture-box[^"]*" data-picture-id="([^"]*)"/g), (match) => match[1]);
        expect(boxes.length, 'the picture boxes of week 1').toBeGreaterThan(4);
        expect((html.match(/data-edge-ink="clip"/g) ?? []).length, 'the clip marks in the book').toBe(2);
    });

    it('X7b: the page CSS holds the one clip rule', () => {
        const css = styleOf(compileStorytimeStudentBook([week(1)], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html);
        const clip = css.match(/\.picture-box\[data-edge-ink\]\s+img\s*\{[^}]*\}/)?.[0] ?? '';
        expect(clip, 'the clip rule').toBe('.picture-box[data-edge-ink] img { clip-path: inset(1.5mm); }');
        expect((css.match(/clip-path:\s*inset\(1\.5mm\)/g) ?? []).length, 'the count of clip rules').toBe(1);
    });

    it('X7c: the class C line pictures with ink in the outer pixel ring are exactly the two nose files', async () => {
        const sharpFactory = await sharp();
        const manifest = readStorytimePictureManifest(pictureFolder);
        const files = new Set<string>();
        for (const row of pictureRows().filter((candidate) => candidate.sizeClass === 'C')) {
            const entries = forgeManifestEntriesForRow(manifest, row);
            files.add(entries[1].fileName);
        }
        const present = [...files].filter((name) => fs.existsSync(path.join(pictureFolder, name))).sort();
        expect(present.length, 'the class C line pictures on disk').toBeGreaterThanOrEqual(100);
        const inked: string[] = [];
        for (const name of present) {
            const { data, info } = await sharpFactory(path.join(pictureFolder, name)).greyscale().raw().toBuffer({ resolveWithObject: true });
            const { width, height } = info;
            let count = 0;
            for (let x = 0; x < width; x++) {
                if (data[x] < 128) count += 1;
                if (data[(height - 1) * width + x] < 128) count += 1;
            }
            for (let y = 0; y < height; y++) {
                if (data[y * width] < 128) count += 1;
                if (data[y * width + width - 1] < 128) count += 1;
            }
            if (count > 0) inked.push(name);
        }
        expect(inked.sort(), 'the class C files with edge ink').toEqual([
            'l2-w01-check-row-nose-line-v2.png',
            'l2-w01-practice-line-nose-line-v2.png',
        ]);
    }, 300_000);
});
