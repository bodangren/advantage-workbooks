// @vitest-environment jsdom
/**
 * Red of the round F7 of the PM look of 2026-11-11 (track storytime_cover_options_20261106,
 * Phase 2, the Task (Red, F7) pair of 2026-11-13).
 *
 * The defect (the orchestrator measurement of 2026-11-13): the A3 reader cover
 * `l2-w01-hello-a3-cover.png` of the hand-off folder shows a white band of 8.30 mm at the top and
 * of 6.94 mm at the bottom, inside the trim. The other 13 A3 reader covers show 0 white edge rows.
 * The cause: the Forge picture `content/storytime/l2/print/pictures/l2-w01-cover-hello-v1.png`
 * (4000 x 3000 px, RGB, SHA-256 99ee1b8d1fe0e9ad632e951c089ab7a4b1dce35de73bcd7dfce0bba63a8ed90f)
 * holds pure white rows 0 to 165 and 2835 to 2999. Row 166 has a lowest channel of 236 and row
 * 2834 has 233, so both are near white. Rows 167 and 2833 hold dark pixels (lowest 59 and 72).
 * The PM order: the 12:00 look must not see the band, and there is no paid generation.
 *
 * The orchestrator decisions D-F7-1 to D-F7-6 of 2026-11-13 (the contract of this round):
 *   D-F7-1: the Forge file stays unchanged, with the same bytes, name, and manifest SHA-256. A crop
 *       is wrong: a 4000 x 2667 crop has the aspect 1.50, so the cover fill must match the A3
 *       height, and then the 6 child head boxes (x 90 to 3950 px) span 429.9 mm on a 420 mm page.
 *       The fix is a mirror fill in a print copy, in the form of the back art edge fill.
 *   D-F7-2 (amended 2026-11-13, the orchestrator answer to the Red fault): a new tracked data file
 *       `content/storytime/l2/print/pictures-edge-fill.json` holds exactly this one entry:
 *       `{"l2-w01-cover-hello-v1.png": {"widthPx": 4000, "heightPx": 3000, "topRows": 167,
 *       "bottomRows": 166, "sha256": "99ee1b8d1fe0e9ad632e951c089ab7a4b1dce35de73bcd7dfce0bba63a8ed90f"}}`.
 *   D-F7-3: the mirror rule. In the filled copy, the output row r for 0 <= r < topRows equals the
 *       source row (2 * topRows - 1 - r), which is 333 - r. The output row r for
 *       heightPx - bottomRows <= r < heightPx equals the source row
 *       (2 * (heightPx - bottomRows) - 1 - r), which is 5667 - r. Every other pixel equals the
 *       source pixel. The size, the mode (8-bit RGB), and the format (PNG) stay the same.
 *   D-F7-4 (amended 2026-11-13, the orchestrator answer to the Red fault): a new module
 *       `dashboard/lib/storytime/print/art-edge-fill.ts` with the exports `ArtEdgeFill`,
 *       `ArtEdgeFillTable`, `readArtEdgeFillTable`, and `edgeFilledArtPath`. The type
 *       `ArtEdgeFill` holds `widthPx`, `heightPx`, `topRows`, `bottomRows`, and `sha256`.
 *       `edgeFilledArtPath` gives back `sourcePath` unchanged, and writes nothing, when the file
 *       name has no entry, or when the SHA-256 of the source bytes differs from the entry
 *       `sha256`. Only when the SHA-256 matches does it check the size (a mismatch throws an
 *       Error whose message names the file and both sizes) and write the filled copy. The filled
 *       copy goes into `path.join(os.tmpdir(), 'storytime-art-edge-fill')` with the name
 *       `<first 16 hex of the source SHA-256>-<fileName>`. It never writes under `content/`.
 *       Reason for the SHA rule: the readers tests put a small fixture with the same name into a
 *       temp folder, and the quest cover build reads hard links in `/tmp/opencode/.../pictures`,
 *       so a path rule fails and a SHA rule works.
 *   D-F7-5: two render paths use the filled copy for the colour cover art only, after their source
 *       checks (boundary, SHA) ran on the source file: the quest cover build (the A3 reader cover
 *       art) and page 1 of the A3 colour reader in `readers.ts`. The leaf covers and the K-only
 *       workbook reader keep their line art source unchanged.
 *   D-F7-6: `pictures-heads.json`, `pictures.json`, `pictures.md`, and `pictures/manifest.json` stay
 *       unchanged, because the geometry is the same.
 *
 * The pins of this file:
 *   F7-1: `edgeFilledArtPath` on the real hello v1 file gives a path under the temp folder of
 *       D-F7-4, with the name of D-F7-4. The output is 4000 x 3000 px, 8-bit RGB, PNG. Its rows
 *       167 to 2833 equal the source rows, and its rows 0 to 166 and 2834 to 2999 follow D-F7-3.
 *       The output holds 0 white edge rows and 0 white edge columns.
 *   F7-2: a file with no entry (`l2-w01-cover-nan-can-nod-v1.png`) gives back the source path
 *       unchanged, and no file is written for it.
 *   F7-2b: a temp file named `l2-w01-cover-hello-v1.png` with other bytes gives back its own path
 *       unchanged, and no file is written for it (the SHA rule of D-F7-4).
 *   F7-3: a table whose entry has the real SHA-256 and a wrong size throws an Error that names the
 *       file and both sizes.
 *   F7-4: `readArtEdgeFillTable()` gives exactly the one entry of D-F7-2 (the 5 fields), and the
 *       data file of D-F7-2 is a tracked file of the repository.
 *   F7-5: after the helper runs, the source file keeps its SHA-256, and no file under `content/`
 *       changed.
 *   F7-6: the 14 A3 reader cover pages and the 4 book sides (the student front and back, the
 *       teacher front and back, top style hlogo), rendered at trim size through the same functions
 *       that the build uses for the page HTML and the art path, hold 0 white edge rows and 0 white
 *       edge columns. The rule counts the white rows and columns inside the outermost pixel of
 *       each side, because Chrome paints the art to a whole pixel and the last 0.4 px of the page
 *       can show the white page background. The leaf covers are out of this rule, because their
 *       line art stands on white paper by design.
 *   F7-7: page 1 of the A3 colour reader of week 1 "Hello!" uses an art file with 0 white edge rows
 *       that follows D-F7-3, and the K-only workbook reader page 1 keeps the line art source path.
 *
 * The white rule: a row or a column is white when every pixel of it has R, G, and B at 250 or more.
 * Every pixel is read, not every n-th one.
 *
 * The method notes:
 *   - The module under test does not exist yet, so each test loads it with a dynamic import and
 *     fails for its own reason. The specifier is a runtime string, so the TypeScript check stays
 *     green before and after the Green change.
 *   - F7-6 renders with the source art while the module does not exist, because then the source art
 *     is what the build uses. After the Green change it renders with the filled art, which is the
 *     same function the build calls.
 *   - The F7-6 render helper follows the F4 pixel test of `quest-cover-f3f6.test.ts`: a scratch
 *     HTML file, Chrome, and the screenshot of the `.quest-page` element.
 *   - The file prints ids, millimetres, counts, and hashes only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from '@playwright/test';
import {
    loadQuestCovers,
    questReaders,
    renderQuestCover,
    type QuestBookRow,
    type QuestCoverKind,
    type QuestRenderOptions,
} from '../lib/storytime/print/cover-quest';
import { compileStorytimeReaders } from '../lib/storytime/print/readers';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { STORYTIME_ROOT, readLevelWeeks } from '../lib/storytime/files';
import type { StorytimeWeek } from '../lib/storytime/schema';

/** The specifier of the module under test. It is a runtime string, so the type check stays green. */
const ART_EDGE_FILL_MODULE = '../lib/storytime/print/art-edge-fill';

/** The render options of the shipped style. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

/** The picture folder of Level 2. */
const PICTURES_DIR = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');

/** The content folder of the repository. */
const CONTENT_DIR = path.join(STORYTIME_ROOT, '..');

/** The repository root. */
const REPO_ROOT = path.resolve(STORYTIME_ROOT, '..', '..');

/** The data file of D-F7-2. */
const EDGE_FILL_FILE = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures-edge-fill.json');

/** The colour cover art of the week 1 reader "Hello!". */
const HELLO_FILE = 'l2-w01-cover-hello-v1.png';

/** The line art of the week 1 reader "Hello!". */
const HELLO_LINE_FILE = 'l2-w01-cover-hello-line-v1.png';

/** A colour cover art with no entry in the table of D-F7-2. */
const NAN_FILE = 'l2-w01-cover-nan-can-nod-v1.png';

/** The SHA-256 of the Forge colour cover art of the week 1 reader "Hello!". */
const HELLO_SHA256 = '99ee1b8d1fe0e9ad632e951c089ab7a4b1dce35de73bcd7dfce0bba63a8ed90f';

/** The first 16 hex of the SHA-256 of the same file: the name prefix of D-F7-4. */
const HELLO_SHA16 = '99ee1b8d1fe0e9ad';

/** The white rows of the table of D-F7-2 at the top of the source. */
const TOP_ROWS = 167;

/** The white rows of the table of D-F7-2 at the bottom of the source. */
const BOTTOM_ROWS = 166;

/** The temp folder of D-F7-4. */
const FILL_DIR = path.join(os.tmpdir(), 'storytime-art-edge-fill');

/** The lowest channel value of a white pixel. */
const WHITE_LEVEL = 250;

/** The Forge teacher front of the PM hand-off TC1. The repo pictures folder holds no copy of it. */
const FORGE_TEACHER_FRONT =
    '/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/l2-u1-cover-quest-teacher-front-forge-v1.png';

/** The edge fill entry of D-F7-2, with the 5 fields of the amended decision. */
const EDGE_FILL_ENTRY = {
    widthPx: 4000,
    heightPx: 3000,
    topRows: TOP_ROWS,
    bottomRows: BOTTOM_ROWS,
    sha256: HELLO_SHA256,
};

/** One edge fill row of the table of D-F7-4. */
interface ArtEdgeFill {
    /** The width of the source in pixels. */
    widthPx: number;
    /** The height of the source in pixels. */
    heightPx: number;
    /** The count of the mirrored rows at the top. */
    topRows: number;
    /** The count of the mirrored rows at the bottom. */
    bottomRows: number;
    /** The SHA-256 of the source bytes. */
    sha256: string;
}

/** The table of D-F7-4, by file name. */
interface ArtEdgeFillTable {
    /** One entry per file name. */
    [fileName: string]: ArtEdgeFill;
}

/** The module of D-F7-4. */
interface ArtEdgeFillModule {
    /** Reads the table of D-F7-2. */
    readArtEdgeFillTable: () => ArtEdgeFillTable;
    /** Gives the path of the filled copy of a source file. */
    edgeFilledArtPath: (sourcePath: string, fileName: string, table?: ArtEdgeFillTable) => Promise<string>;
}

/** One raw RGB image. */
interface RawImage {
    /** The width in pixels. */
    width: number;
    /** The height in pixels. */
    height: number;
    /** The count of the channels. */
    channels: number;
    /** The pixels, row by row. */
    data: Buffer;
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of this file. */
let browser: Browser | undefined;

/**
 * Loads the module under test.
 * @returns The module.
 * @throws Error When the module does not exist, which is the Red state of this round.
 */
async function loadArtEdgeFill(): Promise<ArtEdgeFillModule> {
    const specifier = ART_EDGE_FILL_MODULE;
    const loaded = (await import(specifier)) as ArtEdgeFillModule;
    return loaded;
}

/**
 * Reads a PNG file as raw RGB.
 * @param file The file.
 * @returns The raw image.
 */
async function readRaw(file: string): Promise<RawImage> {
    const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return { width: info.width, height: info.height, channels: info.channels, data };
}

/**
 * Reads a PNG buffer as raw RGB.
 * @param png The PNG buffer.
 * @returns The raw image.
 */
async function readRawBuffer(png: Buffer): Promise<RawImage> {
    const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return { width: info.width, height: info.height, channels: info.channels, data };
}

/**
 * Finds the rows of a raw image in which every pixel has R, G, and B at 250 or more.
 * @param image The raw image.
 * @returns The row indices.
 */
function whiteRows(image: RawImage): number[] {
    const rows: number[] = [];
    for (let y = 0; y < image.height; y++) {
        let white = true;
        for (let x = 0; x < image.width; x++) {
            const at = (y * image.width + x) * image.channels;
            if (image.data[at] < WHITE_LEVEL || image.data[at + 1] < WHITE_LEVEL || image.data[at + 2] < WHITE_LEVEL) {
                white = false;
                break;
            }
        }
        if (white) rows.push(y);
    }
    return rows;
}

/**
 * Finds the columns of a raw image in which every pixel has R, G, and B at 250 or more.
 * @param image The raw image.
 * @returns The column indices.
 */
function whiteColumns(image: RawImage): number[] {
    const columns: number[] = [];
    for (let x = 0; x < image.width; x++) {
        let white = true;
        for (let y = 0; y < image.height; y++) {
            const at = (y * image.width + x) * image.channels;
            if (image.data[at] < WHITE_LEVEL || image.data[at + 1] < WHITE_LEVEL || image.data[at + 2] < WHITE_LEVEL) {
                white = false;
                break;
            }
        }
        if (white) columns.push(x);
    }
    return columns;
}

/**
 * Finds the first row of a filled copy that breaks the mirror rule of D-F7-3.
 * @param filled The filled copy.
 * @param source The source image.
 * @param topRows The count of the mirrored rows at the top.
 * @param bottomRows The count of the mirrored rows at the bottom.
 * @returns The row number, or -1 when every row follows the rule.
 */
function firstBrokenRow(filled: RawImage, source: RawImage, topRows: number, bottomRows: number): number {
    const rowBytes = filled.width * filled.channels;
    for (let r = 0; r < filled.height; r++) {
        let s = r;
        if (r < topRows) s = 2 * topRows - 1 - r;
        else if (r >= filled.height - bottomRows) s = 2 * (filled.height - bottomRows) - 1 - r;
        const out = filled.data.subarray(r * rowBytes, (r + 1) * rowBytes);
        const from = source.data.subarray(s * rowBytes, (s + 1) * rowBytes);
        if (!out.equals(from)) return r;
    }
    return -1;
}

/**
 * Reads the SHA-256 of a file.
 * @param file The file.
 * @returns The hash.
 */
function sha256(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * Lists the files of a folder tree with their size and their change time.
 * @param root The folder.
 * @returns One line per file, sorted.
 */
function snapshotTree(root: string): string[] {
    const lines: string[] = [];
    const walk = (folder: string): void => {
        for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
            const full = path.join(folder, entry.name);
            if (entry.isDirectory()) {
                walk(full);
                continue;
            }
            const stat = fs.statSync(full);
            lines.push(`${path.relative(root, full)}|${stat.size}|${stat.mtimeMs}`);
        }
    };
    walk(root);
    return lines.sort();
}

/**
 * Finds the first difference of two folder snapshots.
 * @param before The snapshot before the run.
 * @param after The snapshot after the run.
 * @returns One text for the first difference, or an empty text when the trees are equal.
 */
function firstTreeDifference(before: string[], after: string[]): string {
    const count = Math.max(before.length, after.length);
    for (let index = 0; index < count; index++) {
        if (before[index] !== after[index]) {
            return `the file "${before[index] ?? '(missing)'}" became "${after[index] ?? '(missing)'}"`;
        }
    }
    return '';
}

/**
 * Gives the path of the art file of a book side.
 * @param book The book row.
 * @param kind The cover kind.
 * @returns The path of the art file.
 * @throws Error When the art file is nowhere.
 */
function bookArtPath(book: QuestBookRow, kind: QuestCoverKind): string {
    const name =
        kind === 'student-front'
            ? book.art.studentFront
            : kind === 'teacher-front'
              ? book.art.teacherFront
              : book.art.back;
    const inRepo = path.join(PICTURES_DIR, name);
    if (fs.existsSync(inRepo)) return inRepo;
    if (name === 'l2-u1-cover-quest-teacher-front-v1-300ppi.png' && fs.existsSync(FORGE_TEACHER_FRONT)) {
        return FORGE_TEACHER_FRONT;
    }
    throw new Error(`the art file of the ${kind} is missing: ${name}`);
}

/**
 * Reads the week 1 package of Level 2.
 * @returns The week.
 */
function weekOne(): StorytimeWeek {
    const weeks = readLevelWeeks(STORYTIME_ROOT, 2)
        .flatMap((entry) => (entry.week ? [entry.week] : []))
        .filter((week) => week.meta.week === 1);
    expect(weeks.length, 'the Level 2 week 1 package exists.').toBe(1);
    return weeks[0];
}

/**
 * Reads the art source of page 1 of a reader document.
 * @param html The document.
 * @returns The `file:` URL of the art.
 * @throws Error When the document holds no quest cover page.
 */
function pageOneArtSrc(html: string): string {
    // The style block holds a `.quest-cover-picture` rule, so the search takes the div of the class.
    const start = html.indexOf('class="quest-cover-picture"');
    expect(start, 'the document holds a quest cover page.').toBeGreaterThan(-1);
    const part = html.slice(start, start + 8000);
    const img = part.match(/<img[^>]*data-part="art"[^>]*>/);
    expect(img, 'the quest cover page holds an art image.').not.toBeNull();
    const src = img?.[0].match(/src="([^"]*)"/);
    expect(src, 'the art image holds a source.').not.toBeNull();
    return (src?.[1] ?? '').replace(/&amp;/g, '&');
}

/**
 * Opens one HTML text in Chrome from a scratch file and takes the screenshot of the page.
 * @param page The browser page.
 * @param html The HTML.
 * @returns The PNG of the trim box.
 */
async function renderPage(page: Page, html: string): Promise<Buffer> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-f7-'));
    scratch.push(folder);
    const file = path.join(folder, 'page.html');
    fs.writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined))));
    return page.locator('.quest-page').screenshot({ type: 'png' });
}

beforeAll(async () => {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
}, 120_000);

afterAll(async () => {
    try {
        if (browser) await browser.close();
    } finally {
        for (const folder of scratch) fs.rmSync(folder, { recursive: true, force: true });
    }
});

describe('quest-cover-f7: the edge fill of the week 1 colour cover art (Red, F7 of the PM look of 2026-11-13)', () => {
    it('F7-1: the filled copy of the hello v1 art follows D-F7-3 and holds no white edge row', async () => {
        const edgeFill = await loadArtEdgeFill();
        const source = path.join(PICTURES_DIR, HELLO_FILE);
        expect(fs.existsSync(source), 'the Forge colour cover art exists.').toBe(true);
        const filled = await edgeFill.edgeFilledArtPath(source, HELLO_FILE);
        expect(filled, 'the helper gives a new path.').not.toBe(source);
        expect(path.dirname(filled), 'the filled copy sits in the temp folder of D-F7-4.').toBe(FILL_DIR);
        expect(path.basename(filled), 'the name of the filled copy follows D-F7-4.').toBe(`${HELLO_SHA16}-${HELLO_FILE}`);
        const meta = await sharp(filled).metadata();
        expect(meta.format, 'the filled copy is a PNG.').toBe('png');
        expect(meta.depth, 'the filled copy is 8-bit.').toBe('uchar');
        const out = await readRaw(filled);
        const from = await readRaw(source);
        expect(out.width, 'the width stays 4000 px.').toBe(4000);
        expect(out.height, 'the height stays 3000 px.').toBe(3000);
        expect(out.channels, 'the mode stays 3-channel RGB.').toBe(3);
        expect(from.width, 'the source is 4000 px wide.').toBe(4000);
        expect(from.height, 'the source is 3000 px high.').toBe(3000);
        const rowBytes = out.width * out.channels;
        const middle = out.data
            .subarray(TOP_ROWS * rowBytes, (out.height - BOTTOM_ROWS) * rowBytes)
            .equals(from.data.subarray(TOP_ROWS * rowBytes, (out.height - BOTTOM_ROWS) * rowBytes));
        expect(middle, 'the rows 167 to 2833 are the source rows.').toBe(true);
        expect(
            firstBrokenRow(out, from, TOP_ROWS, BOTTOM_ROWS),
            'every row of the filled copy follows the mirror rule of D-F7-3.',
        ).toBe(-1);
        expect(whiteRows(out).length, 'the filled copy holds no white row.').toBe(0);
        expect(whiteColumns(out).length, 'the filled copy holds no white column.').toBe(0);
    }, 300_000);

    it('F7-2: a file with no entry gives the source path back and writes no file', async () => {
        const edgeFill = await loadArtEdgeFill();
        const source = path.join(PICTURES_DIR, NAN_FILE);
        expect(fs.existsSync(source), 'the second colour cover art exists.').toBe(true);
        const result = await edgeFill.edgeFilledArtPath(source, NAN_FILE);
        expect(result, 'the source path comes back unchanged.').toBe(source);
        const names = fs.existsSync(FILL_DIR) ? fs.readdirSync(FILL_DIR) : [];
        expect(names.filter((name) => name.includes(NAN_FILE)), 'no file is written for the file.').toEqual([]);
    }, 300_000);

    it('F7-2b: a temp file with the same name and other bytes gives its own path back and writes nothing', async () => {
        const edgeFill = await loadArtEdgeFill();
        const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-f7b-'));
        scratch.push(folder);
        const file = path.join(folder, HELLO_FILE);
        await sharp({ create: { width: 8, height: 8, channels: 3, background: { r: 10, g: 20, b: 30 } } })
            .png()
            .toFile(file);
        const before = fs.existsSync(FILL_DIR) ? fs.readdirSync(FILL_DIR).sort() : [];
        const result = await edgeFill.edgeFilledArtPath(file, HELLO_FILE);
        expect(result, 'the path of the temp file comes back unchanged.').toBe(file);
        const after = fs.existsSync(FILL_DIR) ? fs.readdirSync(FILL_DIR).sort() : [];
        expect(after, 'no file is written for the temp file.').toEqual(before);
    }, 300_000);

    it('F7-3: a table entry with a wrong size throws an error that names the file and both sizes', async () => {
        const edgeFill = await loadArtEdgeFill();
        const source = path.join(PICTURES_DIR, HELLO_FILE);
        const table: ArtEdgeFillTable = {
            [HELLO_FILE]: { widthPx: 1234, heightPx: 567, topRows: TOP_ROWS, bottomRows: BOTTOM_ROWS, sha256: HELLO_SHA256 },
        };
        let message = '';
        let thrown = false;
        try {
            await edgeFill.edgeFilledArtPath(source, HELLO_FILE, table);
        } catch (error) {
            thrown = true;
            message = error instanceof Error ? error.message : String(error);
        }
        expect(thrown, 'the wrong size throws.').toBe(true);
        expect(message, 'the message names the file.').toContain(HELLO_FILE);
        expect(message, 'the message names the size of the table.').toContain('1234');
        expect(message, 'the message names the height of the table.').toContain('567');
        expect(message, 'the message names the width of the source.').toContain('4000');
        expect(message, 'the message names the height of the source.').toContain('3000');
    }, 300_000);

    it('F7-4: the table of D-F7-2 holds exactly one entry, and its data file is tracked', async () => {
        const edgeFill = await loadArtEdgeFill();
        const table = edgeFill.readArtEdgeFillTable();
        expect(Object.keys(table), 'the table holds exactly one entry.').toEqual([HELLO_FILE]);
        expect(table[HELLO_FILE], 'the entry holds the geometry of D-F7-2.').toEqual(EDGE_FILL_ENTRY);
        expect(fs.existsSync(EDGE_FILL_FILE), 'the data file of D-F7-2 exists.').toBe(true);
        const data = JSON.parse(fs.readFileSync(EDGE_FILL_FILE, 'utf8')) as unknown;
        expect(data, 'the data file holds exactly the entry of D-F7-2.').toEqual({ [HELLO_FILE]: EDGE_FILL_ENTRY });
        const relative = path.relative(REPO_ROOT, EDGE_FILL_FILE);
        const ignored = spawnSync('git', ['check-ignore', '-q', '--', relative], { cwd: REPO_ROOT }).status;
        expect(ignored, 'the data file is tracked, not ignored.').toBe(1);
    }, 300_000);

    it('F7-5: the helper leaves the source file and the content folder unchanged', async () => {
        const edgeFill = await loadArtEdgeFill();
        const source = path.join(PICTURES_DIR, HELLO_FILE);
        const before = snapshotTree(CONTENT_DIR);
        await edgeFill.edgeFilledArtPath(source, HELLO_FILE);
        const after = snapshotTree(CONTENT_DIR);
        const difference = firstTreeDifference(before, after);
        expect(difference, 'no file under content/ changed.').toBe('');
        expect(sha256(source), 'the source file keeps its bytes.').toBe(HELLO_SHA256);
    }, 600_000);

    it('F7-6: the 14 A3 reader covers and the 4 book sides hold no white edge row and no white edge column', async () => {
        const rows = questReaders();
        expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
        const book = loadQuestCovers().books[0];
        const edgeFill = await loadArtEdgeFill().catch(() => null);
        const specs: { id: string; html: string }[] = [];
        for (const [index, row] of rows.entries()) {
            const name = row.picture.fileName;
            const source = path.join(PICTURES_DIR, name);
            expect(fs.existsSync(source), `the colour cover art ${name} exists.`).toBe(true);
            // Before the Green change the module does not exist, and the build uses the source art.
            const art = edgeFill ? await edgeFill.edgeFilledArtPath(source, name) : source;
            specs.push({
                id: `w${String(row.week).padStart(2, '0')}-${(index % 2) + 1} reader-a3 (${name})`,
                html: renderQuestCover('reader-a3', row, { art: pathToFileURL(art).href }, HLOGO_OPTIONS),
            });
        }
        for (const kind of ['student-front', 'student-back', 'teacher-front', 'teacher-back'] as QuestCoverKind[]) {
            const art = bookArtPath(book, kind);
            specs.push({
                id: `${kind} (${path.basename(art)})`,
                html: renderQuestCover(kind, book, { art: pathToFileURL(art).href, panelValues: [] }, HLOGO_OPTIONS),
            });
        }
        expect(specs.length, 'the check reads 14 A3 reader covers and 4 book sides.').toBe(18);
        const context = await browser!.newContext({ viewport: { width: 1700, height: 1300 } });
        const page = await context.newPage();
        const failures: string[] = [];
        try {
            for (const spec of specs) {
                const png = await renderPage(page, spec.html);
                const image = await readRawBuffer(png);
                const rows = whiteRows(image);
                const columns = whiteColumns(image);
                // Chrome paints the art to a whole pixel, so the outermost pixel of each side can
                // hold a sub-pixel seam of the white page background (0.26 mm at 96 ppi). The rule
                // counts the white rows and columns inside that seam. The defect of this round is
                // 8.30 mm and 6.94 mm high, which is 31 and 26 rows at 96 ppi.
                const innerRows = rows.filter((row) => row > 0 && row < image.height - 1);
                const innerColumns = columns.filter((column) => column > 0 && column < image.width - 1);
                const seam = `the seam rows [${rows.filter((row) => row === 0 || row === image.height - 1).join(',')}] and the seam columns [${columns.filter((column) => column === 0 || column === image.width - 1).join(',')}]`;
                console.log(
                    `F7-6 page ${spec.id}: ${image.width} x ${image.height} px, white rows [${rows.slice(0, 6).join(',')}${rows.length > 6 ? ',...' : ''}], white columns [${columns.slice(0, 6).join(',')}${columns.length > 6 ? ',...' : ''}], ${seam}`,
                );
                if (innerRows.length > 0 || innerColumns.length > 0) {
                    failures.push(
                        `${spec.id}: ${innerRows.length} white edge row(s) at [${innerRows.slice(0, 6).join(',')}] and ${innerColumns.length} white edge column(s) at [${innerColumns.slice(0, 6).join(',')}] on a ${image.width} x ${image.height} px page; ${seam}.`,
                    );
                }
            }
        } finally {
            await context.close();
        }
        console.log(`F7-6 pages checked ${specs.length}, failures ${failures.length}`);
        expect(failures, failures.join('\n')).toEqual([]);
    }, 900_000);

    it('F7-7: the a3-color page 1 of week 1 uses the filled art, and the workbook page 1 keeps the line art', async () => {
        const week = weekOne();
        const colour = compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output: 'a3-color' }).html;
        const source = path.join(PICTURES_DIR, HELLO_FILE);
        const colourFile = fileURLToPath(pageOneArtSrc(colour));
        expect(colourFile, 'the a3-color page 1 uses no source art.').not.toBe(source);
        expect(fs.existsSync(colourFile), 'the art file of the a3-color page 1 exists.').toBe(true);
        const out = await readRaw(colourFile);
        const from = await readRaw(source);
        expect(out.width, 'the art of the a3-color page 1 is 4000 px wide.').toBe(4000);
        expect(out.height, 'the art of the a3-color page 1 is 3000 px high.').toBe(3000);
        expect(whiteRows(out).length, 'the art of the a3-color page 1 holds no white row.').toBe(0);
        expect(whiteColumns(out).length, 'the art of the a3-color page 1 holds no white column.').toBe(0);
        expect(
            firstBrokenRow(out, from, TOP_ROWS, BOTTOM_ROWS),
            'the art of the a3-color page 1 follows the mirror rule of D-F7-3.',
        ).toBe(-1);
        const workbook = compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'final', output: 'workbook' }).html;
        const workbookFile = fileURLToPath(pageOneArtSrc(workbook));
        expect(workbookFile, 'the workbook page 1 keeps the line art source path.').toBe(path.join(PICTURES_DIR, HELLO_LINE_FILE));
    }, 600_000);
});
