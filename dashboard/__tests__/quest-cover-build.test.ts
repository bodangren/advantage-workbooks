// @vitest-environment node
/**
 * Red 2 of the option A cover build (track storytime_cover_options_20261106, Task 2.6).
 * Test list B01 to B14 of test-strategy.md section 4.7. Pins P4, P5, and P6 of section 4.3.
 *
 * The module under test is dashboard/scripts/storytime/make-storytime-quest-covers.ts. It does not
 * exist at Red 2, so every test fails on the missing module. Expected values below are hand
 * written. No expected value comes from the code under test, except the reader rows and the book
 * row of the shipped Green 1 module (cover-quest.ts), which the tests use as input data.
 *
 * API (pin P4). The script exports these pure functions and runs main only when it is run
 * directly. An import changes no process.exitCode.
 *   type QuestGroup = 'student' | 'teacher' | 'readers-a3' | 'readers-leaf'
 *   parseQuestArgs(argv) returns { help, errors, usage, args }. It reads no file and ends no
 *     process. args is null when errors is not empty or help is true. Otherwise args is
 *     { level, unit, version, out, printReadyRoot, print }. version is the set number (pin P5)
 *     and is 1 when absent. printReadyRoot is '<home>/Desktop/print-ready' when absent (pin P6).
 *     out is the text of --out unchanged (a path with '..' stays as written). When --out is
 *     absent, out is '<printReadyRoot>/storytime/covers-quest-v<version>'. The flags are --level,
 *     --unit, --version, --out, --print-ready-root, --print, and --help. A flag that needs a value
 *     takes the next argument. A next argument that starts with '-' is not a value.
 *   checkQuestOutDir(out, version, printReadyRoot) returns the errors (pin P6). It refuses an out
 *     folder that is not inside '<root>/storytime/covers-quest-v<version>' after the symlinks
 *     resolve, and it refuses '..' segments, a leading '-', and an existing file.
 *   questLayout(level, unit, version) returns { folders, files }. files holds the 44 paths that
 *     the script writes, relative to the out folder, with '/' separators.
 *   questFileNames(level, unit, version) returns { student, teacher, readersA3, readersLeaf,
 *     readerPngsA3, readerPngsLeaf }. The first four are the print file names. The last two are
 *     the 14 PNG names of each reader kind. Set n gives student 3+n, teacher 1+n, readers n.
 *   questPdfxArgs(group, input, output) returns the argument list for process.execPath:
 *     ['--import', 'tsx', '<dashboard>/scripts/print/make-pdfx.ts', input, '--out', output,
 *      '--keep-fonts', ...(group === 'readers-leaf' ? ['--k-only'] : [])].
 *   planQuestBuild({ level, unit, version, outDir, printReadyRoot, picturesDir }) returns a
 *     Promise of { errors, files, art, pictures }. It writes nothing and creates no folder. Each
 *     error names the file or the folder that it concerns. art holds one row for each of the 3
 *     book art files. pictures holds 28 rows: the 14 colour reader pictures (kind 'reader-a3')
 *     and the 14 line art pictures (kind 'reader-leaf'). A row is
 *     { file, kind, widthPx, heightPx, ppi }. The book art is a PNG of 2480 x 3508 px with no
 *     alpha. A reader picture is a PNG of exactly 4000 x 3000 px. A line art picture has no
 *     pixel with unequal red, green, and blue values.
 *   questBuildReport(rows) takes one row for each page: { file, kind, widthMm, heightMm, artPpi,
 *     checks }. checks has exactly the keys copy, thai, qr, pageSize, ppi, band, forbidden, and
 *     each value is 'pass' or 'fail'. It returns { ok, exitCode, errors, pages }. The pages
 *     keep the rows. A fail, a missing check, an extra key, or another value gives ok false and
 *     exitCode 1.
 *   parseQuestPdfInfo(text) reads the output of 'pdfinfo -box' and returns
 *     { pages, widthPt, heightPt }. It never throws.
 *   checkQuestPdfPages(info, group, bleedMm) returns the errors. This export is an addition of
 *     Red 2 to the list of P4 (default taken). The page counts are 2, 2, 14, and 14, and the
 *     tolerance is 1.5 pt.
 *   questQrFromPng(png, kind, bleedMm = 0) returns a Promise of { modules, dark, different }. It
 *     crops the QR box of QUEST_BOXES at 300 ppi and compares the grid with the LINE encoder.
 *
 * Fixtures are small sharp images in a temporary print-ready root (pins P6 and P8). The tests
 * make no network call and launch no Chrome.
 */
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { generateQRCode } from '../lib/qr-generator';
import { QUEST_BOXES, checkQuestQr, loadQuestCovers, questReaders, renderQuestCover } from '../lib/storytime/print/cover-quest';
import { storytimeCoverQrGrid, storytimeCoverQrSvg } from '../lib/storytime/print/covers';

/** The four groups of the build (pin P4). */
type QuestGroup = 'student' | 'teacher' | 'readers-a3' | 'readers-leaf';

/** The parsed arguments of the build. */
interface QuestArgs {
    level: number;
    unit: number;
    version: number;
    out: string;
    printReadyRoot: string;
    print: boolean;
}

/** The result of parseQuestArgs. */
interface ParseResult {
    help: boolean;
    errors: string[];
    usage: string;
    args: QuestArgs | null;
}

/** The input of planQuestBuild. */
interface PlanInput {
    level: number;
    unit: number;
    version: number;
    outDir: string;
    printReadyRoot: string;
    picturesDir: string;
}

/** One picture row of the plan. */
interface PlanRow {
    file: string;
    kind: string;
    widthPx: number;
    heightPx: number;
    ppi: number;
}

/** The result of planQuestBuild. */
interface Plan {
    errors: string[];
    files: string[];
    art: PlanRow[];
    pictures: PlanRow[];
}

/** The check names of one report row, in order. */
const CHECK_KEYS = ['copy', 'thai', 'qr', 'pageSize', 'ppi', 'band', 'forbidden'] as const;

/** One report row. */
interface ReportRow {
    file: string;
    kind: string;
    widthMm: number;
    heightMm: number;
    artPpi: number;
    checks: Record<string, unknown>;
}

/** The result of questBuildReport. */
interface Report {
    ok: boolean;
    exitCode: number;
    errors: string[];
    pages: ReportRow[];
}

/** The result of parseQuestPdfInfo. */
interface PdfInfo {
    pages: number;
    widthPt: number;
    heightPt: number;
}

/** The API of the script under test (pin P4). */
interface BuildApi {
    parseQuestArgs: (argv: string[]) => ParseResult;
    checkQuestOutDir: (out: string, version: number, printReadyRoot: string) => string[];
    questLayout: (level: number, unit: number, version: number) => { folders: string[]; files: string[] };
    questFileNames: (
        level: number,
        unit: number,
        version: number,
    ) => {
        student: string;
        teacher: string;
        readersA3: string;
        readersLeaf: string;
        readerPngsA3: string[];
        readerPngsLeaf: string[];
    };
    questPdfxArgs: (group: QuestGroup, input: string, output: string) => string[];
    planQuestBuild: (input: PlanInput) => Promise<Plan> | Plan;
    questBuildReport: (rows: ReportRow[]) => Report;
    parseQuestPdfInfo: (text: string) => PdfInfo;
    checkQuestPdfPages: (info: PdfInfo, group: QuestGroup, bleedMm: number) => string[];
    questQrFromPng: (png: Buffer, kind: string, bleedMm?: number) => Promise<{ modules: number; dark: number; different: number }>;
}

/** The dashboard folder. */
const DASHBOARD = path.resolve(__dirname, '..');

/** The script under test. */
const SCRIPT_FILE = path.join(DASHBOARD, 'scripts', 'storytime', 'make-storytime-quest-covers.ts');

/** The label of every Red failure. */
const MISSING = 'Missing module: dashboard/scripts/storytime/make-storytime-quest-covers.ts (Red 2).';

/** The export names of pin P4, and the Red 2 addition. */
const EXPORT_NAMES = [
    'parseQuestArgs',
    'checkQuestOutDir',
    'questLayout',
    'questFileNames',
    'questPdfxArgs',
    'planQuestBuild',
    'questBuildReport',
    'parseQuestPdfInfo',
    'checkQuestPdfPages',
    'questQrFromPng',
];

/**
 * Loads the script under test inside one test. A missing file stays an assertion, so the Red log
 * names the module instead of a transform error.
 * @returns The module API.
 */
async function api(): Promise<BuildApi> {
    expect(fs.existsSync(SCRIPT_FILE), MISSING).toBe(true);
    return (await import(SCRIPT_FILE)) as unknown as BuildApi;
}

/**
 * Reads the source text of the script under test.
 * @returns The source.
 */
function scriptSource(): string {
    expect(fs.existsSync(SCRIPT_FILE), MISSING).toBe(true);
    return fs.readFileSync(SCRIPT_FILE, 'utf8');
}

/**
 * Removes the comments of a source text, so a word in a comment is not code.
 * @param source The source text.
 * @returns The source without comments.
 */
function stripComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\w])\/\/.*$/gm, '$1');
}

/**
 * The sha256 of a file.
 * @param file The file.
 * @returns The hex digest.
 */
function sha256(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * The names of the entries of a folder tree, relative and sorted.
 * @param dir The folder.
 * @returns The relative paths of every file and folder.
 */
function tree(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return (fs.readdirSync(dir, { recursive: true }) as string[]).map(String).sort();
}

/**
 * The temporary folders of the build that sit in the temporary folder of the system.
 * @returns The sorted names.
 */
function questTempFolders(): string[] {
    return fs
        .readdirSync(os.tmpdir())
        .filter((name) => name.startsWith('storytime-quest-'))
        .sort();
}

/** The temporary base folder of every fixture. Its name is not a build temp name (B14). */
const TMP_BASE = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'quest-build-test-'));

/** The pictures folder with valid fixtures. */
const BASE_PICTURES = path.join(TMP_BASE, 'pictures-base');

/** The data of the first book row of quest.json (Green 1 module, used as input). */
const BOOK = loadQuestCovers().books[0];

/** The 14 reader rows (Green 1 module, used as input). */
const READERS = questReaders();

/**
 * One flat PNG buffer.
 * @param width The width in pixels.
 * @param height The height in pixels.
 * @param channels The channel count: 1 grey, 3 RGB, 4 RGBA.
 * @returns The PNG bytes.
 */
async function flatPng(width: number, height: number, channels: 1 | 3 | 4): Promise<Buffer> {
    if (channels === 1) {
        return sharp({ create: { width, height, channels: 3, background: '#ffffff' } }).greyscale().png().toBuffer();
    }
    return sharp({ create: { width, height, channels, background: channels === 4 ? '#d0d8e0cc' : '#d0d8e0' } }).png().toBuffer();
}

/**
 * Makes one pictures folder with the valid fixtures: the 3 book art files and the 28 reader
 * pictures.
 * @param dir The folder to create.
 */
async function writeValidPictures(dir: string): Promise<void> {
    fs.mkdirSync(dir, { recursive: true });
    const art = await flatPng(2480, 3508, 3);
    for (const name of [BOOK.art.studentFront, BOOK.art.back, BOOK.art.teacherFront]) fs.writeFileSync(path.join(dir, name), art);
    const colour = await flatPng(4000, 3000, 3);
    const line = await flatPng(4000, 3000, 1);
    for (const row of READERS) {
        fs.writeFileSync(path.join(dir, row.picture.fileName), colour);
        fs.writeFileSync(path.join(dir, row.picture.lineArtFileName), line);
    }
}

/**
 * Copies the valid pictures folder and edits the copy.
 * @param label The folder name.
 * @param edit The edit of the copy.
 * @returns The new folder.
 */
async function fixturePictures(label: string, edit?: (dir: string) => Promise<void> | void): Promise<string> {
    const dir = path.join(TMP_BASE, `pictures-${label}`);
    fs.cpSync(BASE_PICTURES, dir, { recursive: true });
    if (edit) await edit(dir);
    return dir;
}

/** The folders of the print-ready root that the build must never write into. */
const APPROVED_FOLDERS = ['print-v3', 'proof', 'proof-w01', 'proof-unit1-v14', 'teacher-cover-l2u1', 'unit1-check-v1', 'covers-quest-v1', 'covers-quest-v2'];

/**
 * Makes a print-ready root fixture with the approved folders.
 * @param label The folder name.
 * @param folders The folders under storytime/.
 * @returns The root.
 */
function makeRoot(label: string, folders: string[] = APPROVED_FOLDERS): string {
    const root = path.join(TMP_BASE, label);
    fs.mkdirSync(path.join(root, 'storytime'), { recursive: true });
    for (const name of folders) fs.mkdirSync(path.join(root, 'storytime', name), { recursive: true });
    return root;
}

/**
 * The plan input of the first book.
 * @param root The print-ready root.
 * @param picturesDir The pictures folder.
 * @param over The values to change.
 * @returns The plan input.
 */
function planInput(root: string, picturesDir: string, over: Partial<PlanInput> = {}): PlanInput {
    const version = over.version ?? 1;
    return {
        level: 2,
        unit: 1,
        version,
        outDir: path.join(root, 'storytime', `covers-quest-v${version}`),
        printReadyRoot: root,
        picturesDir,
        ...over,
    };
}

/**
 * A text of the form of the pdfinfo -box output, with the page count and the page size.
 * @param pages The page count.
 * @param widthPt The page width in pt.
 * @param heightPt The page height in pt.
 * @returns The text.
 */
function pdfinfoText(pages: number, widthPt: number, heightPt: number): string {
    const box = (name: string) => `${name}:`.padEnd(17) + `    0.00     0.00   ${widthPt.toFixed(2)}   ${heightPt.toFixed(2)}`;
    return [
        'Title:           cover.html',
        'Creator:         Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36',
        'Producer:        GPL Ghostscript 10.06.0',
        'Tagged:          no',
        `Pages:           ${pages}`,
        'Encrypted:       no',
        `Page size:       ${widthPt.toFixed(2)} x ${heightPt.toFixed(2)} pts`,
        'Page rot:        0',
        box('MediaBox'),
        box('CropBox'),
        box('BleedBox'),
        box('TrimBox'),
        box('ArtBox'),
        'File size:       2135766 bytes',
    ].join('\n');
}

/** A real pdfinfo -box output: the teacher cover v1 print file (Ghostscript, 2 pages, A4). */
const PDFINFO_REAL_A4 = `Title:           cover.html
Creator:         Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36
Producer:        GPL Ghostscript 10.06.0
CreationDate:    Tue Nov  3 09:43:07 2026 +07
ModDate:         Tue Nov  3 09:43:07 2026 +07
Custom Metadata: yes
Metadata Stream: no
Tagged:          no
UserProperties:  no
Suspects:        no
Form:            none
JavaScript:      no
Pages:           2
Encrypted:       no
Page size:       594.96 x 841.92 pts (A4)
Page rot:        0
MediaBox:            0.00     0.00   594.96   841.92
CropBox:             0.00     0.00   594.96   841.92
BleedBox:            0.00     0.00   594.96   841.92
TrimBox:             0.00     0.00   594.96   841.92
ArtBox:              0.00     0.00   594.96   841.92
File size:       2135766 bytes
Optimized:       no
PDF version:     1.3
PDF subtype:    PDF/X-1a:2001`;

/** A real pdfinfo -box output of a Ghostscript PDF at the leaf size (2 pages). */
const PDFINFO_REAL_LEAF = `Producer:        GPL Ghostscript 10.06.0
Pages:           2
Encrypted:       no
Page size:       561.26 x 420.94 pts
Page rot:        0
MediaBox:            0.00     0.00   561.26   420.94
CropBox:             0.00     0.00   561.26   420.94
BleedBox:            0.00     0.00   561.26   420.94
TrimBox:             0.00     0.00   561.26   420.94
ArtBox:              0.00     0.00   561.26   420.94`;

/**
 * Draws a page PNG with the LINE QR code in the QR box of a back, at 300 ppi.
 * @param kind The back kind.
 * @param bleedMm The bleed value.
 * @param flip The module to flip, or null.
 * @param blank True for an all-white page.
 * @returns The PNG bytes.
 */
async function qrPagePng(kind: 'student-back' | 'teacher-back', bleedMm: number, flip: [number, number] | null, blank = false): Promise<Buffer> {
    const ppm = 300 / 25.4;
    const pageW = Math.round((210 + 2 * bleedMm) * ppm);
    const pageH = Math.round((297 + 2 * bleedMm) * ppm);
    const buf = Buffer.alloc(pageW * pageH, 255);
    const grid = storytimeCoverQrGrid(storytimeCoverQrSvg());
    const box = QUEST_BOXES[`${kind}:qr`];
    const units = grid.modules + 8;
    const left = (box.leftMm + bleedMm) * ppm;
    const top = (box.topMm + bleedMm) * ppm;
    const unitPx = (box.widthMm * ppm) / units;
    if (!blank) {
        for (let row = 0; row < grid.modules; row++) {
            for (let col = 0; col < grid.modules; col++) {
                let dark = grid.cells[row][col];
                if (flip && flip[0] === row && flip[1] === col) dark = !dark;
                if (!dark) continue;
                const x0 = Math.round(left + (col + 4) * unitPx);
                const x1 = Math.round(left + (col + 5) * unitPx);
                const y0 = Math.round(top + (row + 4) * unitPx);
                const y1 = Math.round(top + (row + 5) * unitPx);
                for (let y = y0; y < y1; y++) buf.fill(0, y * pageW + x0, y * pageW + x1);
            }
        }
    }
    return sharp(buf, { raw: { width: pageW, height: pageH, channels: 1 } }).png().toBuffer();
}

beforeAll(async () => {
    await writeValidPictures(BASE_PICTURES);
}, 120000);

afterAll(() => {
    fs.rmSync(TMP_BASE, { recursive: true, force: true });
});

describe('B01 import of the script', () => {
    it('exports the names of P4 and leaves process.exitCode unchanged', async () => {
        const before = process.exitCode;
        const mod = (await api()) as unknown as Record<string, unknown>;
        expect(EXPORT_NAMES.length, 'The table of export names holds 10 names.').toBe(10);
        for (const name of EXPORT_NAMES) expect(typeof mod[name], `The script exports ${name}.`).toBe('function');
        expect(process.exitCode, 'An import changes no process.exitCode.').toBe(before);
        expect(scriptSource(), 'The script decides by import.meta.url whether it runs main.').toMatch(/import\.meta\.url/);
    });
});

describe('B02 argv bounds (parseQuestArgs)', () => {
    const BAD_NUMBERS = ['0', '5', '1.5', 'abc', '', '1e0', '0x2', ' 2'];
    const GOOD_NUMBERS = ['1', '2', '3', '4'];
    const BAD_VERSIONS = ['0', '-1', '1.5', 'x', '4294967296'];

    it('refuses a level outside 1 to 4 and accepts 1 to 4', async () => {
        const { parseQuestArgs } = await api();
        expect(BAD_NUMBERS.length).toBe(8);
        expect(GOOD_NUMBERS.length).toBe(4);
        for (const value of BAD_NUMBERS) {
            const result = parseQuestArgs(['--level', value, '--unit', '1']);
            expect(result.errors.length, `--level "${value}" gives an error`).toBeGreaterThan(0);
            expect(result.args, `--level "${value}" gives no args`).toBeNull();
        }
        for (const value of GOOD_NUMBERS) {
            const result = parseQuestArgs(['--level', value, '--unit', '1']);
            expect(result.errors, `--level ${value} is valid`).toEqual([]);
            expect(result.args?.level).toBe(Number(value));
        }
    });

    it('refuses a unit outside 1 to 4 and accepts 1 to 4', async () => {
        const { parseQuestArgs } = await api();
        for (const value of BAD_NUMBERS) {
            const result = parseQuestArgs(['--level', '2', '--unit', value]);
            expect(result.errors.length, `--unit "${value}" gives an error`).toBeGreaterThan(0);
            expect(result.args, `--unit "${value}" gives no args`).toBeNull();
        }
        for (const value of GOOD_NUMBERS) {
            const result = parseQuestArgs(['--level', '2', '--unit', value]);
            expect(result.errors, `--unit ${value} is valid`).toEqual([]);
            expect(result.args?.unit).toBe(Number(value));
        }
    });

    it('refuses a version that is not an integer from 1', async () => {
        const { parseQuestArgs } = await api();
        expect(BAD_VERSIONS.length).toBe(5);
        for (const value of BAD_VERSIONS) {
            const result = parseQuestArgs(['--level', '2', '--unit', '1', '--version', value]);
            expect(result.errors.length, `--version "${value}" gives an error`).toBeGreaterThan(0);
            expect(result.args, `--version "${value}" gives no args`).toBeNull();
        }
        for (const value of ['1', '2', '9']) {
            const result = parseQuestArgs(['--level', '2', '--unit', '1', '--version', value]);
            expect(result.errors, `--version ${value} is valid`).toEqual([]);
            expect(result.args?.version).toBe(Number(value));
        }
    });

    it('refuses an unknown flag, a flag with no value, a repeated flag, and a missing flag', async () => {
        const { parseQuestArgs } = await api();
        const bad: Array<[string, string[]]> = [
            ['unknown flag', ['--level', '2', '--unit', '1', '--bogus']],
            ['unknown flag first', ['--bogus', '1', '--level', '2', '--unit', '1']],
            ['--level with no value', ['--unit', '1', '--level']],
            ['--unit with no value', ['--level', '2', '--unit']],
            ['--level followed by a flag', ['--level', '--unit', '1']],
            ['--out followed by a dash value', ['--level', '2', '--unit', '1', '--out', '-rf']],
            ['repeated --level', ['--level', '2', '--level', '3', '--unit', '1']],
            ['repeated --unit', ['--level', '2', '--unit', '1', '--unit', '2']],
            ['repeated --version', ['--level', '2', '--unit', '1', '--version', '1', '--version', '2']],
            ['missing --level', ['--unit', '1']],
            ['missing --unit', ['--level', '2']],
            ['no argument', []],
        ];
        expect(bad.length).toBe(12);
        for (const [label, argv] of bad) {
            const result = parseQuestArgs(argv);
            expect(result.errors.length, `${label} gives an error`).toBeGreaterThan(0);
            expect(result.args, `${label} gives no args`).toBeNull();
            expect(result.help, `${label} is not a help request`).toBe(false);
        }
    });

    it('returns the usage for --help, and the defaults of P5 and P6 for a plain call', async () => {
        const { parseQuestArgs } = await api();
        const help = parseQuestArgs(['--help']);
        expect(help.help).toBe(true);
        expect(help.errors).toEqual([]);
        expect(help.args).toBeNull();
        expect(help.usage.split('Usage:').length - 1, 'The usage holds "Usage:" once.').toBe(1);
        const plain = parseQuestArgs(['--level', '2', '--unit', '1']);
        const root = path.join(os.homedir(), 'Desktop', 'print-ready');
        expect(plain.errors).toEqual([]);
        expect(plain.args).toMatchObject({
            level: 2,
            unit: 1,
            version: 1,
            print: false,
            printReadyRoot: root,
            out: path.join(root, 'storytime', 'covers-quest-v1'),
        });
        const set3 = parseQuestArgs(['--level', '2', '--unit', '1', '--version', '3', '--print-ready-root', '/tmp/q', '--print']);
        expect(set3.args).toMatchObject({ version: 3, print: true, printReadyRoot: '/tmp/q', out: '/tmp/q/storytime/covers-quest-v3' });
        const raw = parseQuestArgs(['--level', '2', '--unit', '1', '--out', '/tmp/q/x/../y']);
        expect(raw.args?.out, 'The out text stays as written.').toBe('/tmp/q/x/../y');
    });

    it('reads no file and ends no process', async () => {
        const { parseQuestArgs } = await api();
        const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit was called');
        }) as never);
        const spies = (['readFileSync', 'readdirSync', 'statSync', 'lstatSync', 'existsSync', 'realpathSync', 'openSync'] as const).map((name) => vi.spyOn(fs, name));
        try {
            parseQuestArgs(['--level', '9', '--unit', '1']);
            parseQuestArgs(['--help']);
            parseQuestArgs(['--level', '2', '--unit', '1', '--version', '2']);
            expect(exit).not.toHaveBeenCalled();
            for (const spy of spies) expect(spy).not.toHaveBeenCalled();
        } finally {
            exit.mockRestore();
            for (const spy of spies) spy.mockRestore();
        }
    });
});

describe('B03 out folder policy (checkQuestOutDir, pin P6)', () => {
    it('accepts the default folder and refuses every other target', async () => {
        const { checkQuestOutDir } = await api();
        const root = makeRoot('b03-root');
        const S = path.join(root, 'storytime');
        const elsewhere = path.join(TMP_BASE, 'b03-elsewhere');
        fs.mkdirSync(path.join(elsewhere, 'covers-quest-v1'), { recursive: true });
        // A symlink inside the target folder that points into an approved folder.
        fs.symlinkSync(path.join(S, 'print-v3'), path.join(S, 'covers-quest-v1', 'link-print'));
        // A root where the target folder itself is a symlink to a folder outside the root.
        const rootLink = makeRoot('b03-root-link', []);
        fs.symlinkSync(path.join(elsewhere, 'covers-quest-v1'), path.join(rootLink, 'storytime', 'covers-quest-v1'));
        // A root where the target folder is a file.
        const rootFile = makeRoot('b03-root-file', []);
        fs.writeFileSync(path.join(rootFile, 'storytime', 'covers-quest-v1'), 'a file');
        const rootFresh = makeRoot('b03-root-fresh', []);

        const accept: Array<[string, string, number, string]> = [
            ['the default folder, existing and empty', path.join(S, 'covers-quest-v2'), 2, root],
            ['the default folder, not made yet', path.join(rootFresh, 'storytime', 'covers-quest-v1'), 1, rootFresh],
        ];
        const refuse: Array<[string, string, number, string]> = [
            ['the root itself', root, 1, root],
            ['the storytime folder, the parent of the approved folders', S, 1, root],
            ['a folder outside the root', path.join(elsewhere, 'covers-quest-v1'), 1, root],
            ['a folder in the root but not in storytime', path.join(root, 'covers-quest-v1'), 1, root],
            ['inside print-v3', path.join(S, 'print-v3', 'l2u1'), 1, root],
            ['proof', path.join(S, 'proof'), 1, root],
            ['inside proof-w01', path.join(S, 'proof-w01', 'x'), 1, root],
            ['proof-unit1-v14', path.join(S, 'proof-unit1-v14'), 1, root],
            ['teacher-cover-l2u1', path.join(S, 'teacher-cover-l2u1'), 1, root],
            ['unit1-check-v1', path.join(S, 'unit1-check-v1'), 1, root],
            ['covers-quest-v2 for a set 1 build', path.join(S, 'covers-quest-v2'), 1, root],
            ['covers-quest-v1 for a set 2 build', path.join(S, 'covers-quest-v1'), 2, root],
            ['a .. path that ends in the right folder', `${S}/covers-quest-v1/../covers-quest-v1`, 1, root],
            ['a .. path that ends in print-v3', `${S}/covers-quest-v1/../print-v3`, 1, root],
            ['a symlink inside the folder that points into print-v3', path.join(S, 'covers-quest-v1', 'link-print'), 1, root],
            ['a target folder that is a symlink out of the root', path.join(rootLink, 'storytime', 'covers-quest-v1'), 1, rootLink],
            ['a target that is a file', path.join(rootFile, 'storytime', 'covers-quest-v1'), 1, rootFile],
            ['a path that starts with a dash', '-rf', 1, root],
            ['a path that is a flag', '--out', 1, root],
        ];
        expect(accept.length).toBe(2);
        expect(refuse.length).toBe(19);
        for (const [label, out, version, base] of accept) {
            expect(checkQuestOutDir(out, version, base), `${label} is allowed`).toEqual([]);
        }
        for (const [label, out, version, base] of refuse) {
            const errors = checkQuestOutDir(out, version, base);
            expect(errors.length, `${label} is refused`).toBeGreaterThan(0);
            for (const error of errors) expect(typeof error).toBe('string');
        }
    });
});

describe('B04 never overwrite (planQuestBuild)', () => {
    it('refuses an existing target file and leaves its bytes unchanged', async () => {
        const { planQuestBuild } = await api();
        const root = makeRoot('b04-target');
        const outDir = path.join(root, 'storytime', 'covers-quest-v1');
        fs.mkdirSync(path.join(outDir, 'student'), { recursive: true });
        const file = path.join(outDir, 'student', 'front.png');
        fs.writeFileSync(file, Buffer.from('keep-me-bytes'));
        const hash = sha256(file);
        const listing = tree(outDir);
        const plan = await planQuestBuild(planInput(root, BASE_PICTURES));
        expect(plan.errors.some((error) => error.includes('front.png')), 'An error names the existing front.png.').toBe(true);
        expect(sha256(file), 'The existing file keeps its bytes.').toBe(hash);
        expect(tree(outDir), 'The plan adds no file.').toEqual(listing);
    }, 120000);

    it('refuses a folder with a print file of another version', async () => {
        const { planQuestBuild } = await api();
        const root = makeRoot('b04-version');
        const outDir = path.join(root, 'storytime', 'covers-quest-v2');
        fs.mkdirSync(path.join(outDir, 'student'), { recursive: true });
        const other = path.join(outDir, 'student', 'Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf');
        fs.writeFileSync(other, Buffer.from('an older file'));
        const plan = await planQuestBuild(planInput(root, BASE_PICTURES, { version: 2 }));
        expect(plan.errors.some((error) => error.includes('Student-Book-Cover-v4_PDFX-1a.pdf')), 'An error names the v4 file of the other version.').toBe(true);
        expect(fs.readFileSync(other).toString()).toBe('an older file');
        const root2 = makeRoot('b04-version-readers');
        const outDir2 = path.join(root2, 'storytime', 'covers-quest-v2');
        fs.mkdirSync(path.join(outDir2, 'readers-a3'), { recursive: true });
        fs.writeFileSync(path.join(outDir2, 'readers-a3', 'Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf'), 'x');
        const plan2 = await planQuestBuild(planInput(root2, BASE_PICTURES, { version: 2 }));
        expect(plan2.errors.some((error) => error.includes('Reader-Covers-A3-v1_PDFX-1a.pdf')), 'An error names the reader file of another version.').toBe(true);
    }, 120000);

    it('passes an empty folder, a folder that does not exist, and a folder with spend-log.md', async () => {
        const { planQuestBuild } = await api();
        const rootA = makeRoot('b04-empty', []);
        fs.mkdirSync(path.join(rootA, 'storytime', 'covers-quest-v3'));
        const planA = await planQuestBuild(planInput(rootA, BASE_PICTURES, { version: 3 }));
        expect(planA.errors, 'An empty folder passes.').toEqual([]);
        const rootB = makeRoot('b04-new', []);
        const planB = await planQuestBuild(planInput(rootB, BASE_PICTURES));
        expect(planB.errors, 'A folder that does not exist passes.').toEqual([]);
        expect(fs.existsSync(path.join(rootB, 'storytime', 'covers-quest-v1')), 'The plan makes no folder.').toBe(false);
        const rootC = makeRoot('b04-spend', []);
        fs.mkdirSync(path.join(rootC, 'storytime', 'covers-quest-v1'));
        fs.writeFileSync(path.join(rootC, 'storytime', 'covers-quest-v1', 'spend-log.md'), 'a log');
        const planC = await planQuestBuild(planInput(rootC, BASE_PICTURES));
        expect(planC.errors, 'The spend log of Task 2.8 is no conflict.').toEqual([]);
    }, 120000);

    it('writes files in create-only mode', async () => {
        const source = stripComments(scriptSource());
        expect(/['"]wx['"]/.test(source) || /COPYFILE_EXCL/.test(source), 'The script writes with the flag wx or with COPYFILE_EXCL.').toBe(true);
        expect(source, 'The script does not write with the flag w.').not.toMatch(/flags?\s*:\s*['"]w['"]/);
    });
});

describe('B05 file names and layout', () => {
    it('gives the four print names of set 1 and set 2', async () => {
        const { questFileNames } = await api();
        const set1 = questFileNames(2, 1, 1);
        expect(set1.student).toBe('Storytime-Advantage-L2-U1-Student-Book-Cover-v4_PDFX-1a.pdf');
        expect(set1.teacher).toBe('Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v2_PDFX-1a.pdf');
        expect(set1.readersA3).toBe('Storytime-Advantage-L2-U1-Reader-Covers-A3-v1_PDFX-1a.pdf');
        expect(set1.readersLeaf).toBe('Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v1_PDFX-1a.pdf');
        const set2 = questFileNames(2, 1, 2);
        expect(set2.student).toBe('Storytime-Advantage-L2-U1-Student-Book-Cover-v5_PDFX-1a.pdf');
        expect(set2.teacher).toBe('Storytime-Advantage-L2-U1-Teachers-Book-TH-Cover-v3_PDFX-1a.pdf');
        expect(set2.readersA3).toBe('Storytime-Advantage-L2-U1-Reader-Covers-A3-v2_PDFX-1a.pdf');
        expect(set2.readersLeaf).toBe('Storytime-Advantage-L2-U1-Reader-Leaf-Covers-v2_PDFX-1a.pdf');
    });

    it('gives 14 unique PNG names of each reader kind', async () => {
        const { questFileNames } = await api();
        const names = questFileNames(2, 1, 1);
        expect(READERS.length).toBe(14);
        expect(names.readerPngsA3.length).toBe(14);
        expect(names.readerPngsLeaf.length).toBe(14);
        const expectA3 = READERS.map((row) => `l2-w${String(row.week).padStart(2, '0')}-${row.slug}-a3-cover.png`).sort();
        const expectLeaf = READERS.map((row) => `l2-w${String(row.week).padStart(2, '0')}-${row.slug}-leaf-cover.png`).sort();
        expect([...names.readerPngsA3].sort()).toEqual(expectA3);
        expect([...names.readerPngsLeaf].sort()).toEqual(expectLeaf);
        expect(new Set(names.readerPngsA3).size).toBe(14);
        expect(new Set(names.readerPngsLeaf).size).toBe(14);
        for (const name of names.readerPngsA3) expect(name).toMatch(/^l2-w0[1-7]-[a-z0-9-]+-a3-cover\.png$/);
        for (const name of names.readerPngsLeaf) expect(name).toMatch(/^l2-w0[1-7]-[a-z0-9-]+-leaf-cover\.png$/);
    });

    it('lists the 44 paths and the four subfolders', async () => {
        const { questLayout, questFileNames } = await api();
        const layout = questLayout(2, 1, 1);
        const names = questFileNames(2, 1, 1);
        expect(layout.folders).toEqual(['student', 'teacher', 'readers-a3', 'readers-leaf']);
        expect(layout.files.length).toBe(44);
        expect(new Set(layout.files).size, 'Every path is unique.').toBe(44);
        const expected = [
            'student/front.png',
            'student/back.png',
            'student/cover.pdf',
            `student/${names.student}`,
            'student/build-report.json',
            'teacher/teacher-front.png',
            'teacher/teacher-back.png',
            'teacher/teacher-cover.pdf',
            `teacher/${names.teacher}`,
            'teacher/build-report.json',
            'readers-a3/reader-covers-a3.pdf',
            `readers-a3/${names.readersA3}`,
            'readers-a3/build-report.json',
            ...names.readerPngsA3.map((name) => `readers-a3/${name}`),
            'readers-leaf/reader-leaf-covers.pdf',
            `readers-leaf/${names.readersLeaf}`,
            'readers-leaf/build-report.json',
            ...names.readerPngsLeaf.map((name) => `readers-leaf/${name}`),
        ];
        expect(expected.length).toBe(44);
        expect([...layout.files].sort()).toEqual([...expected].sort());
        expect(layout.files.filter((file) => file.startsWith('student/')).length).toBe(5);
        expect(layout.files.filter((file) => file.startsWith('teacher/')).length).toBe(5);
        expect(layout.files.filter((file) => file.startsWith('readers-a3/')).length).toBe(17);
        expect(layout.files.filter((file) => file.startsWith('readers-leaf/')).length).toBe(17);
        expect(questLayout(2, 1, 2).files.some((file) => file.includes('Reader-Leaf-Covers-v2_PDFX-1a.pdf')), 'Set 2 names the leaf file v2.').toBe(true);
    });
});

describe('B06 PDF page checks (parseQuestPdfInfo, checkQuestPdfPages)', () => {
    it('reads the pages and the size from two real pdfinfo samples', async () => {
        const { parseQuestPdfInfo } = await api();
        const a4 = parseQuestPdfInfo(PDFINFO_REAL_A4);
        expect(a4.pages).toBe(2);
        expect(a4.widthPt).toBeCloseTo(594.96, 2);
        expect(a4.heightPt).toBeCloseTo(841.92, 2);
        const leaf = parseQuestPdfInfo(PDFINFO_REAL_LEAF);
        expect(leaf.pages).toBe(2);
        expect(leaf.widthPt).toBeCloseTo(561.26, 2);
        expect(leaf.heightPt).toBeCloseTo(420.94, 2);
    });

    it('accepts the right pages and sizes of the four groups', async () => {
        const { parseQuestPdfInfo, checkQuestPdfPages } = await api();
        expect(checkQuestPdfPages(parseQuestPdfInfo(PDFINFO_REAL_A4), 'student', 0), 'The real A4 sample is 0.32 pt off.').toEqual([]);
        expect(checkQuestPdfPages(parseQuestPdfInfo(pdfinfoText(2, 595.28, 841.89)), 'student', 0)).toEqual([]);
        expect(checkQuestPdfPages(parseQuestPdfInfo(pdfinfoText(2, 595.28, 841.89)), 'teacher', 0)).toEqual([]);
        expect(checkQuestPdfPages(parseQuestPdfInfo(pdfinfoText(14, 1190.55, 841.89)), 'readers-a3', 0)).toEqual([]);
        expect(checkQuestPdfPages(parseQuestPdfInfo(pdfinfoText(14, 561.26, 420.94)), 'readers-leaf', 0)).toEqual([]);
        expect(checkQuestPdfPages(parseQuestPdfInfo(pdfinfoText(14, 595.28, 841.89)), 'readers-leaf', 0).length, 'An A4 page is not a leaf page.').toBeGreaterThan(0);
    });

    it('refuses a wrong page count, a wrong size, and an error above 1.5 pt', async () => {
        const { parseQuestPdfInfo, checkQuestPdfPages } = await api();
        const cases: Array<[string, string, QuestGroup, boolean]> = [
            ['13 pages for the A3 readers', pdfinfoText(13, 1190.55, 841.89), 'readers-a3', false],
            ['15 pages for the A3 readers', pdfinfoText(15, 1190.55, 841.89), 'readers-a3', false],
            ['1 page for the student cover', pdfinfoText(1, 595.28, 841.89), 'student', false],
            ['3 pages for the teacher cover', pdfinfoText(3, 595.28, 841.89), 'teacher', false],
            ['A4 for the A3 readers', pdfinfoText(14, 595.28, 841.89), 'readers-a3', false],
            ['A3 for the student cover', pdfinfoText(2, 1190.55, 841.89), 'student', false],
            ['width 1.6 pt off', pdfinfoText(2, 595.28 + 1.6, 841.89), 'student', false],
            ['height 1.6 pt off', pdfinfoText(2, 595.28, 841.89 - 1.6), 'student', false],
            ['width 1.4 pt off', pdfinfoText(2, 595.28 + 1.4, 841.89), 'student', true],
            ['height 1.4 pt off', pdfinfoText(2, 595.28, 841.89 - 1.4), 'student', true],
        ];
        expect(cases.length).toBe(10);
        for (const [label, text, group, passes] of cases) {
            const errors = checkQuestPdfPages(parseQuestPdfInfo(text), group, 0);
            if (passes) expect(errors, `${label} passes`).toEqual([]);
            else expect(errors.length, `${label} fails`).toBeGreaterThan(0);
        }
    });

    it('grows each dimension by 17.01 pt at a bleed of 3 mm', async () => {
        const { parseQuestPdfInfo, checkQuestPdfPages } = await api();
        expect(checkQuestPdfPages(parseQuestPdfInfo(pdfinfoText(2, 612.29, 858.9)), 'student', 3)).toEqual([]);
        expect(checkQuestPdfPages(parseQuestPdfInfo(pdfinfoText(2, 595.28, 841.89)), 'student', 3).length, 'No bleed in the PDF fails a bleed 3 build.').toBeGreaterThan(0);
        expect(checkQuestPdfPages(parseQuestPdfInfo(pdfinfoText(2, 612.29, 858.9)), 'student', 0).length, 'A bleed page fails a bleed 0 build.').toBeGreaterThan(0);
    });

    it('does not throw on a text that is not a pdfinfo output', async () => {
        const { parseQuestPdfInfo, checkQuestPdfPages } = await api();
        const info = parseQuestPdfInfo('not a pdfinfo output');
        expect(checkQuestPdfPages(info, 'student', 0).length).toBeGreaterThan(0);
    });
});

describe('B07 build report (questBuildReport)', () => {
    /**
     * Builds the 32 rows of the full set.
     * @returns The rows.
     */
    function fullRows(): ReportRow[] {
        const rows: ReportRow[] = [];
        const add = (kind: string, count: number, widthMm: number, heightMm: number, artPpi: number) => {
            for (let i = 1; i <= count; i++) {
                rows.push({
                    file: `${kind}/page-${i}.png`,
                    kind,
                    widthMm,
                    heightMm,
                    artPpi,
                    checks: Object.fromEntries(CHECK_KEYS.map((key) => [key, 'pass'])),
                });
            }
        };
        add('student', 2, 210, 297, 299.96);
        add('teacher', 2, 210, 297, 299.96);
        add('readers-a3', 14, 420, 297, 241.9);
        add('readers-leaf', 14, 198, 148.5, 513.1);
        return rows;
    }

    it('passes 32 clean rows with the exact check keys', async () => {
        const { questBuildReport } = await api();
        const rows = fullRows();
        expect(rows.length).toBe(32);
        const report = questBuildReport(rows);
        expect(report.ok).toBe(true);
        expect(report.exitCode).toBe(0);
        expect(report.errors).toEqual([]);
        expect(report.pages.length).toBe(32);
        for (const [index, page] of report.pages.entries()) {
            expect(Object.keys(page.checks), `row ${index + 1} holds the 7 check keys in order`).toEqual([...CHECK_KEYS]);
            expect(page.file).toBe(rows[index].file);
            expect(page.kind).toBe(rows[index].kind);
            expect(page.widthMm).toBe(rows[index].widthMm);
            expect(page.heightMm).toBe(rows[index].heightMm);
            expect(page.artPpi).toBe(rows[index].artPpi);
        }
    });

    it('fails the report on one fail and keeps the fail in its row', async () => {
        const { questBuildReport } = await api();
        const rows = fullRows();
        rows[17].checks.band = 'fail';
        const report = questBuildReport(rows);
        expect(report.ok).toBe(false);
        expect(report.exitCode).toBe(1);
        expect(report.pages[17].checks.band, 'The fail stays visible in the row.').toBe('fail');
        expect(report.pages.filter((page) => Object.values(page.checks).includes('fail')).length).toBe(1);
    });

    it('treats a check that did not run, an extra key, and another value as an error', async () => {
        const { questBuildReport } = await api();
        const missing = fullRows();
        delete missing[3].checks.qr;
        const rMissing = questBuildReport(missing);
        expect(rMissing.ok, 'A missing check is not a pass.').toBe(false);
        expect(rMissing.exitCode).toBe(1);
        expect(rMissing.errors.some((error) => error.includes('qr'))).toBe(true);
        const extra = fullRows();
        extra[0].checks.extra = 'pass';
        const rExtra = questBuildReport(extra);
        expect(rExtra.ok, 'The key set is exact.').toBe(false);
        expect(rExtra.exitCode).toBe(1);
        for (const value of ['skipped', true, null, 'PASS']) {
            const odd = fullRows();
            odd[5].checks.copy = value;
            const result = questBuildReport(odd);
            expect(result.ok, `The value ${JSON.stringify(value)} is not pass or fail.`).toBe(false);
            expect(result.exitCode).toBe(1);
        }
    });
});

describe('B07b the QR check of a real back page (questQrCheck; FR-11 build report, AC-9, QR module check)', () => {
    /** The export that Green adds (default taken): questQrCheck(html, kind) returns 'pass' or 'fail'. */
    const NEEDS_EXPORT = 'Missing export: questQrCheck(html, kind) of make-storytime-quest-covers.ts (Red retry 2.6c).';

    /**
     * Renders a real back page with the template call that the build makes.
     * @param kind The back kind.
     * @param bleedMm The bleed value.
     * @returns The page document.
     */
    function realBack(kind: 'student-back' | 'teacher-back', bleedMm = 0): string {
        const assets = kind === 'student-back'
            ? { art: 'file:///tmp/back-art.png', logo: 'file:///tmp/logo.png', panelValues: [] }
            : { art: 'file:///tmp/back-art.png', logo: 'file:///tmp/logo.png' };
        return renderQuestCover(kind, BOOK, assets, { bleedMm });
    }

    /**
     * Flips one dark module of the QR inside the box with data-part="qr" (the module turns white).
     * @param html The page document.
     * @returns The page with one flipped module.
     */
    function flipQrModule(html: string): string {
        const start = html.indexOf('data-part="qr"');
        expect(start, 'The page holds the box with data-part="qr".').toBeGreaterThan(-1);
        const rest = html.slice(start);
        const rect = rest.match(/<rect\b[^>]*fill="#000000"[^>]*width="10"[^>]*>|<rect\b[^>]*width="10"[^>]*fill="#000000"[^>]*>/i)?.[0];
        expect(rect, 'The QR box holds a dark module rect.').toBeTruthy();
        const white = (rect as string).replace('fill="#000000"', 'fill="#ffffff"');
        return html.slice(0, start) + rest.replace(rect as string, white);
    }

    /**
     * Loads the export under test.
     * @returns The check function.
     */
    async function qrCheckFn(): Promise<(html: string, kind: string) => string> {
        const mod = (await api()) as unknown as { questQrCheck?: (html: string, kind: string) => string };
        expect(typeof mod.questQrCheck, NEEDS_EXPORT).toBe('function');
        return mod.questQrCheck as (html: string, kind: string) => string;
    }

    it('the real student back holds the banner, the sign, and the QR, and the QR is not the first SVG', () => {
        const html = realBack('student-back');
        const svgs = html.match(/<svg\b[\s\S]*?<\/svg>/g) ?? [];
        expect(svgs.length, 'banner, contact sign, and QR').toBeGreaterThanOrEqual(3);
        expect(html.indexOf('<svg'), 'an SVG comes before the QR box').toBeLessThan(html.indexOf('data-part="qr"'));
        const first = checkQuestQr(svgs[0] ?? '');
        expect(first.errors.length, 'the first SVG is not a QR grid (the banner)').toBeGreaterThan(0);
        const box = html.slice(html.indexOf('data-part="qr"'));
        const inBox = box.match(/<svg\b[\s\S]*?<\/svg>/)?.[0] ?? '';
        expect(checkQuestQr(inBox).errors, 'the SVG inside the QR box is the LINE code').toEqual([]);
    });

    it('(a) the real student back and the real teacher back give pass', async () => {
        const qrCheck = await qrCheckFn();
        expect(qrCheck(realBack('student-back'), 'student-back'), 'student back, no bleed').toBe('pass');
        expect(qrCheck(realBack('teacher-back'), 'teacher-back'), 'teacher back, no bleed').toBe('pass');
        expect(qrCheck(realBack('student-back', 3), 'student-back'), 'student back, 3 mm bleed').toBe('pass');
        expect(qrCheck(realBack('teacher-back', 3), 'teacher-back'), 'teacher back, 3 mm bleed').toBe('pass');
    });

    it('(b) the same real backs with one flipped QR module give fail', async () => {
        const qrCheck = await qrCheckFn();
        expect(qrCheck(flipQrModule(realBack('student-back')), 'student-back'), 'student back, one module flipped').toBe('fail');
        expect(qrCheck(flipQrModule(realBack('teacher-back')), 'teacher-back'), 'teacher back, one module flipped').toBe('fail');
    });

    it('(c) the teacher back holds the QR box with the LINE code, and the other kinds need no QR', async () => {
        const qrCheck = await qrCheckFn();
        const teacher = realBack('teacher-back');
        expect(teacher, 'the teacher back holds the QR box').toContain('data-part="qr"');
        expect(qrCheck(teacher.replace('data-part="qr"', 'data-part="qr-gone"').replace(/<svg\b[^>]*viewBox="0 0 \d+ \d+"[\s\S]*?<\/svg>/g, ''), 'teacher-back'), 'a back without any QR fails').toBe('fail');
        for (const kind of ['student-front', 'teacher-front'] as const) {
            expect(qrCheck(renderQuestCover(kind, BOOK, { art: 'file:///tmp/front-art.png' }, { bleedMm: 0 }), kind), kind + ' needs no QR').toBe('pass');
        }
    });
});

describe('B08 plan before write (planQuestBuild)', () => {
    it('passes the valid fixtures and reports the art ppi', async () => {
        const { planQuestBuild } = await api();
        const root = makeRoot('b08-valid', []);
        const plan = await planQuestBuild(planInput(root, BASE_PICTURES));
        expect(plan.errors).toEqual([]);
        expect(plan.files.length, 'The plan lists the 44 paths.').toBe(44);
        expect(plan.art.length).toBe(3);
        expect(plan.art.map((row) => row.file).sort()).toEqual([BOOK.art.back, BOOK.art.studentFront, BOOK.art.teacherFront].sort());
        for (const row of plan.art) {
            expect(row.widthPx).toBe(2480);
            expect(row.heightPx).toBe(3508);
            expect(row.ppi).toBeCloseTo(299.96, 1);
        }
        expect(fs.existsSync(path.join(root, 'storytime', 'covers-quest-v1')), 'The plan makes no folder.').toBe(false);
    }, 120000);

    it('refuses a missing art file, art of the wrong size, art with alpha, and a JPEG named .png', async () => {
        const { planQuestBuild } = await api();
        const cases: Array<[string, string, (dir: string) => Promise<void> | void]> = [
            ['missing back art', BOOK.art.back, (dir) => fs.rmSync(path.join(dir, BOOK.art.back))],
            ['1448 x 2048 front art', BOOK.art.studentFront, async (dir) => fs.writeFileSync(path.join(dir, BOOK.art.studentFront), await flatPng(1448, 2048, 3))],
            ['front art with an alpha channel', BOOK.art.studentFront, async (dir) => fs.writeFileSync(path.join(dir, BOOK.art.studentFront), await flatPng(2480, 3508, 4))],
            [
                'a JPEG under the .png name',
                BOOK.art.teacherFront,
                async (dir) => fs.writeFileSync(path.join(dir, BOOK.art.teacherFront), await sharp({ create: { width: 2480, height: 3508, channels: 3, background: '#d0d8e0' } }).jpeg().toBuffer()),
            ],
        ];
        expect(cases.length).toBe(4);
        for (const [index, [label, name, edit]] of cases.entries()) {
            const dir = await fixturePictures(`b08-${index}`, edit);
            const root = makeRoot(`b08-root-${index}`, []);
            const plan = await planQuestBuild(planInput(root, dir));
            expect(plan.errors.some((error) => error.includes(name)), `${label}: an error names ${name}`).toBe(true);
            expect(fs.existsSync(path.join(root, 'storytime', 'covers-quest-v1')), `${label}: the out folder is not created`).toBe(false);
        }
    }, 120000);

    it('refuses a level and unit that have no row in quest.json', async () => {
        const { planQuestBuild } = await api();
        const root = makeRoot('b08-norow', []);
        const plan = await planQuestBuild(planInput(root, BASE_PICTURES, { level: 3, unit: 2 }));
        expect(plan.errors.length).toBeGreaterThan(0);
        expect(fs.existsSync(path.join(root, 'storytime', 'covers-quest-v1'))).toBe(false);
    }, 120000);
});

describe('B09 reader pictures (planQuestBuild)', () => {
    it('passes 14 pictures of 4000 x 3000 px and reports the effective ppi', async () => {
        const { planQuestBuild } = await api();
        const root = makeRoot('b09-valid', []);
        const plan = await planQuestBuild(planInput(root, BASE_PICTURES));
        expect(plan.errors).toEqual([]);
        expect(plan.pictures.length).toBe(28);
        const a3 = plan.pictures.filter((row) => row.kind === 'reader-a3');
        const leaf = plan.pictures.filter((row) => row.kind === 'reader-leaf');
        expect(a3.length).toBe(14);
        expect(leaf.length).toBe(14);
        expect(a3.map((row) => row.file).sort()).toEqual(READERS.map((row) => row.picture.fileName).sort());
        expect(leaf.map((row) => row.file).sort()).toEqual(READERS.map((row) => row.picture.lineArtFileName).sort());
        for (const row of a3) {
            expect(row.widthPx).toBe(4000);
            expect(row.heightPx).toBe(3000);
            expect(row.ppi).toBeCloseTo(241.9, 1);
        }
        for (const row of leaf) expect(row.ppi).toBeCloseTo(513.1, 1);
    }, 120000);

    it('refuses a missing picture, a width of 3999 px, and a line art file with a coloured pixel', async () => {
        const { planQuestBuild } = await api();
        const missingName = READERS[0].picture.fileName;
        const narrowName = READERS[3].picture.fileName;
        const colouredName = READERS[5].picture.lineArtFileName;
        const cases: Array<[string, string, (dir: string) => Promise<void> | void]> = [
            ['a missing picture', missingName, (dir) => fs.rmSync(path.join(dir, missingName))],
            ['a picture of 3999 px width', narrowName, async (dir) => fs.writeFileSync(path.join(dir, narrowName), await flatPng(3999, 3000, 3))],
            [
                'a line art file with one coloured pixel',
                colouredName,
                async (dir) => {
                    const png = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#ffffff' } })
                        .composite([{ input: { create: { width: 1, height: 1, channels: 3, background: '#ff0000' } }, left: 1234, top: 2345 }])
                        .png()
                        .toBuffer();
                    fs.writeFileSync(path.join(dir, colouredName), png);
                },
            ],
        ];
        expect(cases.length).toBe(3);
        for (const [index, [label, name, edit]] of cases.entries()) {
            const dir = await fixturePictures(`b09-${index}`, edit);
            const root = makeRoot(`b09-root-${index}`, []);
            const plan = await planQuestBuild(planInput(root, dir));
            expect(plan.errors.some((error) => error.includes(name)), `${label}: an error names ${name}`).toBe(true);
            expect(fs.existsSync(path.join(root, 'storytime', 'covers-quest-v1')), `${label}: the out folder is not created`).toBe(false);
        }
    }, 120000);
});

describe('B10 PDF/X arguments (questPdfxArgs)', () => {
    it('keeps the fonts for every group and adds --k-only for the leaf only', async () => {
        const { questPdfxArgs } = await api();
        const groups: QuestGroup[] = ['student', 'teacher', 'readers-a3', 'readers-leaf'];
        expect(groups.length).toBe(4);
        for (const group of groups) {
            const args = questPdfxArgs(group, '/tmp/in.pdf', '/tmp/out_PDFX-1a.pdf');
            expect(args.slice(0, 2), `${group}: node loads tsx`).toEqual(['--import', 'tsx']);
            const script = args[2];
            expect(script.endsWith(path.join('scripts', 'print', 'make-pdfx.ts')), `${group}: the shared make-pdfx.ts runs`).toBe(true);
            expect(fs.existsSync(script), `${group}: the make-pdfx.ts file exists`).toBe(true);
            expect(args[3]).toBe('/tmp/in.pdf');
            expect(args.indexOf('--out')).toBeGreaterThan(3);
            expect(args[args.indexOf('--out') + 1]).toBe('/tmp/out_PDFX-1a.pdf');
            expect(args.filter((arg) => arg === '--keep-fonts').length, `${group}: --keep-fonts once`).toBe(1);
            expect(args, `${group}: never --outline`).not.toContain('--outline');
            if (group === 'readers-leaf') expect(args.filter((arg) => arg === '--k-only').length, 'The leaf adds --k-only.').toBe(1);
            else expect(args, `${group}: no --k-only`).not.toContain('--k-only');
        }
    });

    it('spawns with an argv array and with no shell', () => {
        const source = stripComments(scriptSource());
        expect(source).not.toMatch(/shell\s*:\s*true/);
        expect(source).not.toMatch(/\b(?:execSync|exec|spawn|fork)\s*\(/);
        for (const match of source.matchAll(/\b(?:execFileSync|spawnSync|execFile)\s*\(\s*[^,]+,\s*([^\s,])/g)) {
            expect(match[1], 'The second argument of each spawn call is an argument list.').toMatch(/[[A-Za-z_]/);
        }
    });
});

describe('B11 QR from the page PNG (questQrFromPng)', () => {
    it('gives 0 different modules for a PNG drawn from the encoder grid', async () => {
        const { questQrFromPng } = await api();
        const grid = storytimeCoverQrGrid(storytimeCoverQrSvg());
        expect(grid.modules).toBeGreaterThanOrEqual(21);
        const student = await questQrFromPng(await qrPagePng('student-back', 0, null), 'student-back');
        expect(student.modules).toBe(grid.modules);
        expect(student.dark).toBe(grid.dark);
        expect(student.different).toBe(0);
        const teacher = await questQrFromPng(await qrPagePng('teacher-back', 0, null), 'teacher-back');
        expect(teacher.different).toBe(0);
        const bleed = await questQrFromPng(await qrPagePng('student-back', 3, null), 'student-back', 3);
        expect(bleed.different, 'A page with 3 mm bleed shifts the box by 3 mm.').toBe(0);
    }, 120000);

    it('counts one flipped module as 1 and an all-white PNG as the dark count', async () => {
        const { questQrFromPng } = await api();
        const grid = storytimeCoverQrGrid(storytimeCoverQrSvg());
        const one = await questQrFromPng(await qrPagePng('student-back', 0, [10, 12]), 'student-back');
        expect(one.different).toBe(1);
        const corner = await questQrFromPng(await qrPagePng('student-back', 0, [0, 0]), 'student-back');
        expect(corner.different, 'A flip at the first module counts too.').toBe(1);
        const white = await questQrFromPng(await qrPagePng('student-back', 0, null, true), 'student-back');
        expect(grid.dark).toBeGreaterThan(0);
        expect(white.different).toBe(grid.dark);
        expect(white.dark).toBe(0);
    }, 120000);
});

describe('B12 no network and no paid tool', () => {
    it('makes no network call while it plans a build', async () => {
        const { planQuestBuild } = await api();
        const fetchStub = vi.fn(() => {
            throw new Error('network call: fetch');
        });
        vi.stubGlobal('fetch', fetchStub);
        const spies = [
            vi.spyOn(http, 'request').mockImplementation((() => {
                throw new Error('network call: http.request');
            }) as never),
            vi.spyOn(http, 'get').mockImplementation((() => {
                throw new Error('network call: http.get');
            }) as never),
            vi.spyOn(https, 'request').mockImplementation((() => {
                throw new Error('network call: https.request');
            }) as never),
            vi.spyOn(https, 'get').mockImplementation((() => {
                throw new Error('network call: https.get');
            }) as never),
        ];
        try {
            const root = makeRoot('b12-root', []);
            const plan = await planQuestBuild(planInput(root, BASE_PICTURES));
            expect(plan.errors).toEqual([]);
            expect(fetchStub).not.toHaveBeenCalled();
            for (const spy of spies) expect(spy).not.toHaveBeenCalled();
        } finally {
            vi.unstubAllGlobals();
            for (const spy of spies) spy.mockRestore();
        }
    }, 120000);

    it('holds no network or paid tool in its source and spawns only the allowed commands', () => {
        const source = stripComments(scriptSource());
        expect(source).not.toMatch(/\bmmx\b/);
        expect(source).not.toMatch(/\bfetch\s*\(/);
        expect(source).not.toMatch(/https?:/);
        expect(source).not.toMatch(/XMLHttpRequest/);
        expect(source).not.toMatch(/from\s+['"](?:node:)?https?['"]/);
        const allowed = new Set(['process.execPath', "'node'", "'pdfinfo'", "'pdftotext'", "'pdfimages'", "'pdftoppm'", '"node"', '"pdfinfo"', '"pdftotext"', '"pdfimages"', '"pdftoppm"']);
        for (const match of source.matchAll(/\b(?:execFileSync|spawnSync|execFile)\s*\(\s*([^,]+?)\s*,/g)) {
            expect(allowed.has(match[1]), `The command ${match[1]} is allowed.`).toBe(true);
        }
    });
});

describe('B13 command line smoke', () => {
    /**
     * Runs the script in a child process with a private temporary folder.
     * @param argv The arguments.
     * @param tmp The private temporary folder.
     * @returns The result of the child.
     */
    function run(argv: string[], tmp: string) {
        return spawnSync(process.execPath, ['--import', 'tsx', SCRIPT_FILE, ...argv], {
            cwd: DASHBOARD,
            encoding: 'utf8',
            timeout: 120000,
            // The tsx loader cache would write into the private TMPDIR, so the test turns it off; the assertion checks the files of the script only.
            env: { ...process.env, TMPDIR: tmp, TSX_DISABLE_CACHE: '1' },
        });
    }

    it('prints the usage once and exits 0 for --help', () => {
        expect(fs.existsSync(SCRIPT_FILE), MISSING).toBe(true);
        const tmp = fs.mkdtempSync(path.join(TMP_BASE, 'b13-help-'));
        const result = run(['--help'], tmp);
        expect(result.status).toBe(0);
        expect(result.stdout.split('Usage:').length - 1, 'The usage holds "Usage:" once.').toBe(1);
    }, 120000);

    it('exits 2 and creates no file for a bad level and for an unknown flag', () => {
        expect(fs.existsSync(SCRIPT_FILE), MISSING).toBe(true);
        const cases: Array<[string, string[]]> = [
            ['--level 9', ['--level', '9', '--unit', '1']],
            ['--bogus', ['--level', '2', '--unit', '1', '--bogus']],
        ];
        expect(cases.length).toBe(2);
        for (const [label, argv] of cases) {
            const tmp = fs.mkdtempSync(path.join(TMP_BASE, 'b13-bad-'));
            const root = fs.mkdtempSync(path.join(TMP_BASE, 'b13-root-'));
            const result = run([...argv, '--print-ready-root', root], tmp);
            expect(result.status, `${label} exits 2`).toBe(2);
            expect(tree(root), `${label} creates no file in the root`).toEqual([]);
            expect(tree(tmp), `${label} leaves no temp file`).toEqual([]);
        }
    }, 120000);
});

describe('B14 temp cleanup', () => {
    it('leaves the storytime-quest- temp folders unchanged after a success and after a failure', async () => {
        const { planQuestBuild } = await api();
        const before = questTempFolders();
        const root = makeRoot('b14-root', []);
        const ok = await planQuestBuild(planInput(root, BASE_PICTURES));
        expect(ok.errors, 'The success case passes.').toEqual([]);
        expect(questTempFolders(), 'No temp folder stays after a success.').toEqual(before);
        const dir = await fixturePictures('b14-bad', (d) => fs.rmSync(path.join(d, BOOK.art.back)));
        const bad = await planQuestBuild(planInput(makeRoot('b14-root-bad', []), dir));
        expect(bad.errors.length, 'The failure case fails.').toBeGreaterThan(0);
        expect(questTempFolders(), 'No temp folder stays after a failure.').toEqual(before);
    }, 120000);

    it('leaves the private temp folder of a child process empty after --help and after a bad argument', () => {
        expect(fs.existsSync(SCRIPT_FILE), MISSING).toBe(true);
        for (const argv of [['--help'], ['--level', '9', '--unit', '1']]) {
            const tmp = fs.mkdtempSync(path.join(TMP_BASE, 'b14-child-'));
            const result = spawnSync(process.execPath, ['--import', 'tsx', SCRIPT_FILE, ...argv], {
                cwd: DASHBOARD,
                encoding: 'utf8',
                timeout: 120000,
                // The tsx loader cache would write into the private TMPDIR, so the test turns it off; the assertion checks the files of the script only.
                env: { ...process.env, TMPDIR: tmp, TSX_DISABLE_CACHE: '1' },
            });
            expect([0, 2], `${argv.join(' ')} ends with a clean exit code`).toContain(result.status);
            expect(tree(tmp), `${argv.join(' ')} leaves the temp folder empty`).toEqual([]);
        }
    }, 120000);
});

// ---------------------------------------------------------------------------------------------
// Adversarial round of Phase 2 (storytime_cover_options_20261106). Groups ADV-1 to ADV-9 of
// test-strategy.md section 4.15, plus the review cases A-F1, B-F1, B-F2, B-F3, and B-F7.
// Pins: P8 (fixtures are small sharp buffers in a temporary folder, no gitignored art),
// P9 (no read of measure/tracks), P12 (a test that spawns a process has an explicit timeout).
// A live build test uses the longer timeout LIVE_MS, because one real build of 32 pages renders
// 32 PNG files and 4 PDF files in Chrome.
// ---------------------------------------------------------------------------------------------

/** The result of one child build. */
interface ChildResult {
    status: number | null;
    stdout: string;
    stderr: string;
}

/** The timeout of a test that runs one or two real builds, in milliseconds. */
const LIVE_MS = 900000;

/**
 * Runs the build script in a child process and waits for it. It never throws.
 * @param argv The arguments of the script.
 * @param env Extra environment values.
 * @returns The exit code and the text output of the child.
 */
function runBuild(argv: string[], env: Record<string, string> = {}): Promise<ChildResult> {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, ['--import', 'tsx', SCRIPT_FILE, ...argv], {
            cwd: DASHBOARD,
            env: { ...process.env, ...env },
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => {
            stdout += String(chunk);
        });
        child.stderr.on('data', (chunk) => {
            stderr += String(chunk);
        });
        const timer = setTimeout(() => child.kill('SIGKILL'), LIVE_MS - 60000);
        child.on('close', (status) => {
            clearTimeout(timer);
            resolve({ status, stdout, stderr });
        });
    });
}

/** The fixtures of one live build: a print-ready root, the default out folder, and pictures. */
interface LiveFixture {
    root: string;
    out: string;
    pictures: string;
}

/**
 * Makes the fixtures of one live build in the temporary base folder.
 * @param label The folder label.
 * @returns The root, the out folder, and the pictures folder.
 */
async function liveFixture(label: string): Promise<LiveFixture> {
    const root = makeRoot(label, []);
    const pictures = await fixturePictures(label);
    return { root, pictures, out: path.join(root, 'storytime', 'covers-quest-v1') };
}

/**
 * The argument list of a live build of Level 2 Unit 1, set 1.
 * @param fixture The fixtures.
 * @param extra Extra arguments.
 * @returns The arguments.
 */
function liveArgv(fixture: LiveFixture, extra: string[] = []): string[] {
    return ['--level', '2', '--unit', '1', '--version', '1', '--print-ready-root', fixture.root, '--pictures-dir', fixture.pictures, ...extra];
}

/**
 * The print files (final deliverable names of the PDF/X step) in a folder tree.
 * @param dir The folder.
 * @returns The relative paths.
 */
function printFilesIn(dir: string): string[] {
    return tree(dir).filter((entry) => entry.endsWith('_PDFX-1a.pdf'));
}

describe('ADV-1 argv and out folder (target group 1; review case B-F2)', () => {
    it('refuses each hostile argument list at the parser', async () => {
        const { parseQuestArgs } = await api();
        const base = ['--level', '2', '--unit', '1'];
        const cases: Array<[string, string[]]> = [
            ['--level 1e0', ['--level', '1e0', '--unit', '1']],
            ['--level 0x2', ['--level', '0x2', '--unit', '1']],
            ['--level 2.0', ['--level', '2.0', '--unit', '1']],
            ['--level with a trailing newline', ['--level', '2\n', '--unit', '1']],
            ['--level with a zero-width space', ['--level', '2​', '--unit', '1']],
            ['--unit 1e0', ['--level', '2', '--unit', '1e0']],
            ['--unit 0x2', ['--level', '2', '--unit', '0x2']],
            ['--unit 2.0', ['--level', '2', '--unit', '2.0']],
            ['--version 4294967296', [...base, '--version', '4294967296']],
            ['--version +1', [...base, '--version', '+1']],
            ['--version 1e3', [...base, '--version', '1e3']],
            ['a repeated --level', ['--level', '2', '--level', '3', '--unit', '1']],
            ['a repeated --out', [...base, '--out', 'a', '--out', 'b']],
            ['--print twice', [...base, '--print', '--print']],
            ['--out followed by a name with a leading dash', [...base, '--out', '-covers']],
            ['--out followed by a flag', [...base, '--out', '--print']],
            ['--print-ready-root followed by a name with a leading dash', [...base, '--print-ready-root', '-x']],
            ['a flag name with a newline', [...base, '--print\n']],
        ];
        expect(cases.length).toBe(18);
        for (const [label, argv] of cases) {
            const result = parseQuestArgs(argv);
            expect(result.errors.length, `${label} gives an error`).toBeGreaterThan(0);
            expect(result.args, `${label} gives no args`).toBeNull();
        }
    });

    it('refuses each hostile out folder', async () => {
        const { checkQuestOutDir } = await api();
        const root = makeRoot('adv1-root', APPROVED_FOLDERS.filter((name) => !name.startsWith('covers-quest-')));
        const S = path.join(root, 'storytime');
        const rootLink = makeRoot('adv1-root-link', ['print-v3', 'teacher-cover-l2u1']);
        fs.symlinkSync(path.join(rootLink, 'storytime', 'print-v3'), path.join(rootLink, 'storytime', 'covers-quest-v1'));
        const linkToApproved = path.join(TMP_BASE, 'adv1-link-to-approved');
        fs.symlinkSync(path.join(S, 'print-v3'), linkToApproved);
        const approvedExceptTarget = APPROVED_FOLDERS.filter((name) => name !== 'covers-quest-v1');
        const refuse: Array<[string, string, string]> = [
            ['--out ../../..', '../../..', root],
            ['a .. path above the root', `${S}/covers-quest-v1/../../..`, root],
            ...approvedExceptTarget.map((name): [string, string, string] => [`the approved folder ${name}`, path.join(S, name), root]),
            ['a symlink outside the root that points to print-v3', linkToApproved, root],
            ['a target folder that is a symlink to print-v3', path.join(rootLink, 'storytime', 'covers-quest-v1'), rootLink],
            ['a name with a newline', path.join(S, 'covers-quest-v1\nx'), root],
            ['a name with a leading dash', '-covers-quest-v1', root],
            ['a sub folder of the right folder', path.join(S, 'covers-quest-v1', 'sub'), root],
            ['the empty text', '', root],
        ];
        expect(refuse.length, 'the table holds 2 + 7 + 6 rows').toBe(15);
        for (const [label, out, base] of refuse) {
            expect(checkQuestOutDir(out, 1, base).length, `${label} is refused`).toBeGreaterThan(0);
        }
    });

    it('refuses a symlink at a sub folder of the out folder (review B F2)', async () => {
        const { planQuestBuild, questLayout } = await api();
        const folders = questLayout(2, 1, 1).folders;
        expect(folders.length, 'the build writes 4 sub folders').toBe(4);
        const accepted: string[] = [];
        for (const folder of folders) {
            const root = makeRoot(`adv1-sub-${folder}`, []);
            const outDir = path.join(root, 'storytime', 'covers-quest-v1');
            const target = path.join(TMP_BASE, `adv1-sub-target-${folder}`);
            fs.mkdirSync(outDir, { recursive: true });
            fs.mkdirSync(target, { recursive: true });
            fs.symlinkSync(target, path.join(outDir, folder));
            const plan = await planQuestBuild(planInput(root, BASE_PICTURES));
            if (!plan.errors.join('\n').includes(folder)) accepted.push(folder);
            expect(fs.readdirSync(target), `the plan writes nothing through the link at ${folder}`).toEqual([]);
        }
        expect(accepted, 'the sub folders whose symlink the plan does not refuse (an error that names the folder)').toEqual([]);
    }, 120000);
});

describe('ADV-2 hostile pictures and art files (target group 2; review cases B-F1 and B-F7)', () => {
    it('refuses a reader slug that holds a path (review B F1)', async () => {
        const { planQuestBuild, questLayout } = await api();
        const real = fs.readFileSync.bind(fs) as unknown as (...args: unknown[]) => unknown;
        const picturesSuffix = path.join('l2', 'print', 'pictures.json');
        const SLUG = 'x/../../../../esc-slug';
        const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(((file: unknown, ...rest: unknown[]) => {
            const raw = real(file, ...rest);
            if (typeof file === 'string' && file.endsWith(picturesSuffix) && typeof raw === 'string') {
                const rows = JSON.parse(raw) as Array<Record<string, unknown>>;
                const first = rows.find((row) => row.use === 'cover');
                if (first) {
                    first.fileName = `l2-w01-cover-${SLUG}-v1.png`;
                    first.lineArtFileName = `l2-w01-cover-${SLUG}-line-v1.png`;
                }
                return JSON.stringify(rows);
            }
            return raw;
        }) as unknown as typeof fs.readFileSync);
        try {
            const outDir = path.join(TMP_BASE, 'adv2-slug-out');
            let layoutFiles: string[] = [];
            try {
                layoutFiles = questLayout(2, 1, 1).files;
            } catch {
                // A throw is a safe refusal of the slug.
            }
            const escaped = layoutFiles.filter((file) => !path.resolve(outDir, file).startsWith(outDir + path.sep));
            expect(escaped, 'no layout path leaves the out folder').toEqual([]);

            // The pictures sit where the slug path reads them, so only a name check can refuse.
            const deep = path.join(TMP_BASE, 'adv2-deep', 'a', 'b', 'c', 'pics');
            fs.mkdirSync(path.dirname(deep), { recursive: true });
            fs.cpSync(BASE_PICTURES, deep, { recursive: true });
            fs.writeFileSync(path.join(TMP_BASE, 'adv2-deep', 'a', 'esc-slug-v1.png'), await flatPng(4000, 3000, 3));
            fs.writeFileSync(path.join(TMP_BASE, 'adv2-deep', 'a', 'esc-slug-line-v1.png'), await flatPng(4000, 3000, 1));
            const root = makeRoot('adv2-slug-root', []);
            const plan = await planQuestBuild(planInput(root, deep));
            expect(plan.errors.length, 'the plan refuses a slug with a path').toBeGreaterThan(0);
        } finally {
            spy.mockRestore();
        }
    }, 120000);

    it('refuses a symlink art file that points outside the pictures folder (review B F7)', async () => {
        const { planQuestBuild } = await api();
        const outside = path.join(TMP_BASE, 'adv2-outside');
        fs.mkdirSync(outside, { recursive: true });
        const outsideBook = path.join(outside, 'real-book.png');
        const outsidePicture = path.join(outside, 'real-picture.png');
        fs.writeFileSync(outsideBook, await flatPng(2480, 3508, 3));
        fs.writeFileSync(outsidePicture, await flatPng(4000, 3000, 3));
        const cases = [
            { label: 'book', file: BOOK.art.studentFront, target: outsideBook },
            { label: 'reader', file: READERS[0].picture.fileName, target: outsidePicture },
        ];
        expect(cases.length).toBe(2);
        const accepted: string[] = [];
        for (const entry of cases) {
            const pictures = await fixturePictures(`adv2-link-${entry.label}`, (dir) => {
                fs.rmSync(path.join(dir, entry.file));
                fs.symlinkSync(entry.target, path.join(dir, entry.file));
            });
            const root = makeRoot(`adv2-link-root-${entry.label}`, []);
            const plan = await planQuestBuild(planInput(root, pictures));
            if (!plan.errors.join('\n').includes(entry.file)) accepted.push(`${entry.label}: ${entry.file}`);
        }
        expect(accepted, 'the symlink files outside the pictures folder that the plan does not refuse (an error that names the file)').toEqual([]);
    }, 120000);

    it('refuses a 100 MB art file (size cap)', async () => {
        const { planQuestBuild } = await api();
        const pictures = await fixturePictures('adv2-big', (dir) => {
            fs.truncateSync(path.join(dir, BOOK.art.studentFront), 100 * 1024 * 1024);
        });
        expect(fs.statSync(path.join(pictures, BOOK.art.studentFront)).size, 'the fixture file is 100 MB').toBe(100 * 1024 * 1024);
        const root = makeRoot('adv2-big-root', []);
        const plan = await planQuestBuild(planInput(root, pictures));
        expect(plan.errors.length, 'the plan refuses a 100 MB art file').toBeGreaterThan(0);
        expect(plan.errors.join('\n'), 'the error names the file').toContain(BOOK.art.studentFront);
    }, 120000);
});

describe('ADV-4 QR (target group 4)', () => {
    /**
     * Renders a real back page.
     * @param kind The back kind.
     * @returns The page document.
     */
    function realBack(kind: 'student-back' | 'teacher-back'): string {
        const assets = kind === 'student-back'
            ? { art: 'file:///tmp/back-art.png', logo: 'file:///tmp/logo.png', panelValues: [] }
            : { art: 'file:///tmp/back-art.png', logo: 'file:///tmp/logo.png' };
        return renderQuestCover(kind, BOOK, assets, { bleedMm: 0 });
    }

    /**
     * The check function of the script.
     * @returns The function.
     */
    async function qrCheckFn(): Promise<(html: string, kind: string) => string> {
        const mod = (await api()) as unknown as { questQrCheck?: (html: string, kind: string) => string };
        expect(typeof mod.questQrCheck, 'The script exports questQrCheck.').toBe('function');
        return mod.questQrCheck as (html: string, kind: string) => string;
    }

    /** Addresses that look like the LINE address; the test keeps those with the same module count. */
    const LOOKALIKES = [
        'https://line.me/ti/p/Pf7_EF98Pw',
        'https://line.me/ti/p/Pf7_EF98Pv2',
        'https://line.me/ti/p/Qf7_EF98Pv',
        'https://line.me/ti/p/pf7_ef98pv',
        'https://line.me/ti/p/Pf7_EF98Pu',
        'https://line.me/ti/p/Pf7_EF98Pv#',
    ];

    /**
     * The look-alike QR SVGs with the module count of the LINE code.
     * @returns The address and the SVG of each look-alike.
     */
    function sameCountLookalikes(): Array<{ url: string; svg: string }> {
        const lineModules = storytimeCoverQrGrid(storytimeCoverQrSvg()).modules;
        return LOOKALIKES.map((url) => ({ url, svg: generateQRCode(url) ?? '' })).filter((entry) => storytimeCoverQrGrid(entry.svg).modules === lineModules);
    }

    /**
     * Draws a page PNG with one QR grid in a box of a given width, at 300 ppi, from the box origin.
     * @param kind The back kind.
     * @param grid The grid to draw.
     * @param boxWidthMm The width of the drawn box.
     * @returns The PNG bytes.
     */
    async function qrPageCustom(kind: 'student-back' | 'teacher-back', grid: { modules: number; cells: boolean[][] }, boxWidthMm: number): Promise<Buffer> {
        const ppm = 300 / 25.4;
        const pageW = Math.round(210 * ppm);
        const pageH = Math.round(297 * ppm);
        const buf = Buffer.alloc(pageW * pageH, 255);
        const box = QUEST_BOXES[`${kind}:qr`];
        const unitPx = (boxWidthMm * ppm) / (grid.modules + 8);
        for (let row = 0; row < grid.modules; row++) {
            for (let col = 0; col < grid.modules; col++) {
                if (!grid.cells[row][col]) continue;
                const x0 = Math.round(box.leftMm * ppm + (col + 4) * unitPx);
                const x1 = Math.round(box.leftMm * ppm + (col + 5) * unitPx);
                const y0 = Math.round(box.topMm * ppm + (row + 4) * unitPx);
                const y1 = Math.round(box.topMm * ppm + (row + 5) * unitPx);
                for (let y = y0; y < y1; y++) buf.fill(0, y * pageW + x0, y * pageW + x1);
            }
        }
        return sharp(buf, { raw: { width: pageW, height: pageH, channels: 1 } }).png().toBuffer();
    }

    it('fails the QR check for a printed code of another address with the same module count', async () => {
        const qrCheck = await qrCheckFn();
        const same = sameCountLookalikes();
        expect(same.length, 'at least 2 look-alike addresses share the module count of the LINE code').toBeGreaterThanOrEqual(2);
        for (const kind of ['student-back', 'teacher-back'] as const) {
            const html = realBack(kind);
            const start = html.indexOf('data-part="qr"');
            expect(start, 'the back holds the QR box').toBeGreaterThan(-1);
            for (const { url, svg } of same) {
                const rest = html.slice(start);
                const original = rest.match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';
                expect(original.length, 'the box holds an SVG').toBeGreaterThan(0);
                const swapped = html.slice(0, start) + rest.replace(original, svg);
                expect(qrCheck(swapped, kind), `${kind} with the code of ${url} fails`).toBe('fail');
            }
        }
    });

    it('reads a page PNG that holds the code of another address as different modules', async () => {
        const { questQrFromPng } = await api();
        const same = sameCountLookalikes();
        expect(same.length).toBeGreaterThanOrEqual(2);
        for (const { url, svg } of same) {
            const result = await questQrFromPng(await qrPageCustom('student-back', storytimeCoverQrGrid(svg), 50), 'student-back');
            expect(result.modules, 'the grid has modules').toBeGreaterThan(0);
            expect(result.different, `the PNG of ${url} differs from the LINE code`).toBeGreaterThan(0);
        }
    }, 120000);

    it('reads a QR box scaled to 20 mm as different modules', async () => {
        const { questQrFromPng } = await api();
        const grid = storytimeCoverQrGrid(storytimeCoverQrSvg());
        const exact = await questQrFromPng(await qrPageCustom('student-back', grid, 50), 'student-back');
        expect(exact.modules).toBeGreaterThan(0);
        expect(exact.different, 'the 50 mm control PNG has 0 different modules').toBe(0);
        const small = await questQrFromPng(await qrPageCustom('student-back', grid, 20), 'student-back');
        expect(small.different, 'the 20 mm PNG differs from the LINE code').toBeGreaterThan(0);
    }, 120000);

    it('fails the QR check when the printed QR box is scaled to 20 mm in the page markup', async () => {
        const qrCheck = await qrCheckFn();
        for (const kind of ['student-back', 'teacher-back'] as const) {
            const html = realBack(kind);
            const start = html.indexOf('data-part="qr"');
            const head = html.slice(0, start);
            const rest = html.slice(start);
            expect(rest, 'the QR box is 50 mm wide').toContain('width:50mm');
            const small = head + rest.replace('width:50mm', 'width:20mm').replace('height:50mm', 'height:20mm');
            expect(small, 'the edit changed the page').not.toBe(html);
            expect(qrCheck(small, kind), `${kind} with a 20 mm QR box fails`).toBe('fail');
        }
    });
});

describe('ADV-6 output and ADV-8 stale file (target groups 6 and 8; review case B-F3)', () => {
    /** The result of the two concurrent live builds, kept for the stale file test. */
    let live: { out: string } | undefined;

    it('two builds into one folder at once: one completes, the other fails and overwrites nothing', async () => {
        const { questLayout, questFileNames } = await api();
        // Round 2: a Chrome render error (Page.captureScreenshot Protocol error) is machine load, not a
        // result of the build code. Only that error, seen in the build that won the lock, repeats the
        // attempt (3 at most). Every assertion below is unchanged and runs on the last attempt.
        const hook = launchHook();
        const chromeLoad = /Protocol error|Target (page, context or browser )?has been closed|browser has been closed|Target closed/i;
        let fixture: LiveFixture | undefined;
        let first: ChildResult | undefined;
        let second: ChildResult | undefined;
        let launches: string[] = [];
        const tries: string[] = [];
        for (let attempt = 1; attempt <= 3; attempt++) {
            fixture = await liveFixture(`adv6-live-${attempt}`);
            const argv = liveArgv(fixture);
            const log = path.join(TMP_BASE, `adv6-launch-${attempt}.log`);
            const env = { NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import ${hook}`.trim(), QUEST_LAUNCH_LOG: log };
            [first, second] = await Promise.all([runBuild(argv, env), runBuild(argv, env)]);
            launches = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : [];
            const winnerLoad = [first, second].filter((run) => run.status === 1 && !/EEXIST|exist/i.test(run.stderr) && chromeLoad.test(run.stderr));
            if (first.status === 1 && second.status === 1 && winnerLoad.length === 1 && attempt < 3) {
                tries.push(`attempt ${attempt} stopped on a Chrome load error: ${winnerLoad[0].stderr.slice(-300)}`);
                continue;
            }
            break;
        }
        const done = { fixture: fixture as LiveFixture, first: first as ChildResult, second: second as ChildResult };
        live = { out: done.fixture.out };
        const detail = `${tries.join(' | ')} first ${done.first.status}: ${done.first.stderr.slice(-400)} | second ${done.second.status}: ${done.second.stderr.slice(-400)}`;
        expect([done.first.status, done.second.status].sort(), detail).toEqual([0, 1]);
        expect(launches.length, `only the build that won the lock starts Chrome (launches: ${launches.join(',')})`).toBe(1);
        const [firstRun, secondRun] = [done.first, done.second];
        const loser = firstRun.status === 1 ? firstRun : secondRun;
        expect(loser.stderr, 'the failed build says why').toMatch(/EEXIST|exist/i);
        const names = questFileNames(2, 1, 1);
        const printNames = [names.student, names.teacher, names.readersA3, names.readersLeaf];
        const written = questLayout(2, 1, 1)
            .files.filter((file) => !printNames.some((name) => file.endsWith(`/${name}`)))
            .sort();
        expect(written.length, 'a build without --print writes 40 of the 44 files').toBe(40);
        const present = tree(done.fixture.out).filter((entry) => fs.statSync(path.join(done.fixture.out, entry)).isFile());
        expect(present, 'the folder holds exactly the files of one complete build').toEqual(written);
        for (const file of present) expect(fs.statSync(path.join(done.fixture.out, file)).size, `${file} is not empty`).toBeGreaterThan(0);
        for (const group of questLayout(2, 1, 1).folders) {
            const report = JSON.parse(fs.readFileSync(path.join(done.fixture.out, group, 'build-report.json'), 'utf8')) as { ok: boolean };
            expect(report.ok, `${group} report is ok`).toBe(true);
        }
    }, LIVE_MS * 3);

    it('the build report records the git head of the build (the stale file check needs it)', async () => {
        expect(live, 'the live build test ran first').toBeDefined();
        const out = (live as { out: string }).out;
        for (const group of ['student', 'teacher', 'readers-a3', 'readers-leaf']) {
            const report = JSON.parse(fs.readFileSync(path.join(out, group, 'build-report.json'), 'utf8')) as Record<string, unknown>;
            expect(String(report.gitHead), `${group} report holds gitHead (a 40 character commit id)`).toMatch(/^[0-9a-f]{40}$/);
            const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', String(report.gitHead), 'HEAD'], { cwd: DASHBOARD });
            expect(ancestor.status, `${group} gitHead is a commit of this repository that HEAD contains`).toBe(0);
        }
    });

    it('a read-only out folder fails the build with an error and no print file', async () => {
        const fixture = await liveFixture('adv6-ro');
        fs.mkdirSync(fixture.out, { recursive: true });
        fs.chmodSync(fixture.out, 0o555);
        let result: ChildResult;
        try {
            result = await runBuild(liveArgv(fixture, ['--print']));
        } finally {
            fs.chmodSync(fixture.out, 0o755);
        }
        expect(result.status, `exit code 1; stderr ${result.stderr.slice(-300)}`).toBe(1);
        expect(result.stderr.length, 'the build prints an error').toBeGreaterThan(0);
        expect(printFilesIn(fixture.out), 'no print file').toEqual([]);
    }, LIVE_MS);

    it('a forced write error inside a sub folder fails the build and leaves no print file (stands in for a full disk)', async () => {
        const fixture = await liveFixture('adv6-write');
        const blocked = path.join(fixture.out, 'readers-leaf');
        fs.mkdirSync(blocked, { recursive: true });
        fs.chmodSync(blocked, 0o555);
        let result: ChildResult;
        try {
            result = await runBuild(liveArgv(fixture, ['--print']));
        } finally {
            fs.chmodSync(blocked, 0o755);
        }
        expect(result.status, `exit code 1; stderr ${result.stderr.slice(-300)}`).toBe(1);
        expect(result.stderr.length, 'the build prints an error').toBeGreaterThan(0);
        expect(printFilesIn(fixture.out), 'no print file').toEqual([]);
    }, LIVE_MS);

    it('a failed PDF/X step leaves no print file with a final name (review B F3)', async () => {
        const fixture = await liveFixture('adv6-gs');
        const shimDir = path.join(TMP_BASE, 'adv6-shim');
        fs.mkdirSync(shimDir, { recursive: true });
        const shim = [
            '#!/bin/bash',
            'case "$*" in',
            '  *teacher*)',
            '    prev=""',
            '    for arg in "$@"; do',
            '      if [ "$prev" = "-o" ]; then printf partial > "$arg"; fi',
            '      prev="$arg"',
            '    done',
            '    echo "gs shim: forced failure" >&2',
            '    exit 1 ;;',
            'esac',
            'exec /usr/bin/gs "$@"',
            '',
        ].join('\n');
        fs.writeFileSync(path.join(shimDir, 'gs'), shim, { mode: 0o755 });
        const result = await runBuild(liveArgv(fixture, ['--print']), { PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ''}` });
        expect(result.status, `the build fails; stderr ${result.stderr.slice(-300)}`).not.toBe(0);
        expect(result.stdout + result.stderr, 'the PDF/X step of the teacher group failed').toContain('Ghostscript failed');
        expect(printFilesIn(fixture.out), 'a failed build leaves no print file with a final name').toEqual([]);
    }, LIVE_MS);
});

describe('ADV-9 an unreadable phonics graph (review case A-F1)', () => {
    it('a missing graph fails the build or a check, never a passing empty student panel', async () => {
        const fixture = await liveFixture('adv9-missing');
        const result = await runBuild(liveArgv(fixture), { MASTERY_PHONICS_GRAPH: path.join(TMP_BASE, 'adv9-no-such-folder', 'graph.json') });
        expect(result.status, `exit code is not 0; stdout ${result.stdout.slice(-200)}`).not.toBe(0);
        expect(result.stderr, 'the error names the graph or the panel, not another fault').toMatch(/graph|panel|phonics/i);
    }, LIVE_MS);

    it('a corrupt graph file fails the build or a check, never a passing empty student panel', async () => {
        const fixture = await liveFixture('adv9-corrupt');
        const graph = path.join(TMP_BASE, 'adv9-corrupt-graph.json');
        fs.writeFileSync(graph, '{ this is not json');
        const result = await runBuild(liveArgv(fixture), { MASTERY_PHONICS_GRAPH: graph });
        expect(result.status, `exit code is not 0; stdout ${result.stdout.slice(-200)}`).not.toBe(0);
        expect(result.stderr, 'the error names the graph or the panel, not another fault').toMatch(/graph|panel|phonics/i);
    }, LIVE_MS);
});

// ---------------------------------------------------------------------------------------------
// Adversarial round 2 of Phase 2 (storytime_cover_options_20261106): the risks of the Green 3 code.
// readGitHead, the staged print files, the size cap, the out folder links, and the temp folder.
// ---------------------------------------------------------------------------------------------

/**
 * Writes the preload module that logs each Chrome launch of a build process. The loser of a lock
 * race must never launch Chrome, so the log shows which process rendered.
 * @returns The path of the module.
 */
function launchHook(): string {
    const file = path.join(TMP_BASE, 'launch-hook.mjs');
    if (!fs.existsSync(file)) {
        const source = [
            "import fs from 'node:fs';",
            "import { createRequire } from 'node:module';",
            `const require = createRequire(${JSON.stringify(path.join(DASHBOARD, 'package.json'))});`,
            "const { chromium } = require('@playwright/test');",
            'const launch = chromium.launch.bind(chromium);',
            'chromium.launch = (...args) => {',
            "    fs.appendFileSync(process.env.QUEST_LAUNCH_LOG, process.pid + '\\n');",
            '    return launch(...args);',
            '};',
            '',
        ].join('\n');
        fs.writeFileSync(file, source);
    }
    return file;
}

/** A private TMPDIR for a child build, and the build temp folders that it left. */
function privateTmp(label: string): { dir: string; env: Record<string, string>; left: () => string[] } {
    const dir = fs.mkdtempSync(path.join(TMP_BASE, `${label}-tmp-`));
    return {
        dir,
        // The tsx loader cache would write into the private TMPDIR, so the test turns it off.
        env: { TMPDIR: dir, TSX_DISABLE_CACHE: '1' },
        left: () => fs.readdirSync(dir).filter((name) => name.startsWith('storytime-quest-')),
    };
}

/**
 * Loads `readGitHead` of the script. The function is not exported (pin P4), so the test cuts its
 * text from the script source and runs that text with fs and path. The real bytes run.
 * @returns The function.
 */
function loadReadGitHead(): (repoRoot: string) => string {
    const source = scriptSource();
    const body = source.match(/function readGitHead\(repoRoot: string\): string \{[\s\S]*?\n\}\n/)?.[0];
    expect(body, 'readGitHead is in the script').toBeDefined();
    const pattern = source.match(/const GIT_HEAD_PATTERN = (\/.*\/);/)?.[1];
    expect(pattern, 'GIT_HEAD_PATTERN is in the script').toBeDefined();
    const plain = (body as string).replace('(repoRoot: string): string', '(repoRoot)');
    const factory = new Function('fs', 'path', 'GIT_HEAD_PATTERN', `${plain}\nreturn readGitHead;`);
    return factory(fs, path, new Function(`return ${pattern}`)()) as (repoRoot: string) => string;
}

const ID_A = 'a'.repeat(40);
const ID_B = 'b'.repeat(40);
const ID_C = 'c'.repeat(40);
const ID_D = 'd'.repeat(40);
const ID_F = 'f'.repeat(40);

/**
 * Writes files into a fixture folder.
 * @param label The folder label.
 * @param files The relative paths and their text.
 * @returns The folder.
 */
function gitFixture(label: string, files: Record<string, string>): string {
    const dir = path.join(TMP_BASE, `git-${label}`);
    for (const [name, text] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
        fs.writeFileSync(path.join(dir, name), text);
    }
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

describe('ADV2-8 readGitHead (adversarial round 2, risk of the Green 3 code)', () => {
    it('reads a detached HEAD, a loose ref, a ref only in packed-refs, and prefers the loose ref', () => {
        const read = loadReadGitHead();
        expect(read(gitFixture('detached', { '.git/HEAD': `${ID_A}\n` })), 'detached HEAD').toBe(ID_A);
        expect(read(gitFixture('loose', { '.git/HEAD': 'ref: refs/heads/main\n', '.git/refs/heads/main': `${ID_B}\n` })), 'loose ref').toBe(ID_B);
        const packed = [
            '# pack-refs with: peeled fully-peeled sorted ',
            `${ID_D} refs/heads/main2`,
            `${ID_F} refs/heads/main-old`,
            `${ID_C} refs/heads/main`,
            `^${ID_A}`,
            '',
        ].join('\n');
        expect(read(gitFixture('packed', { '.git/HEAD': 'ref: refs/heads/main\n', '.git/packed-refs': packed })), 'ref only in packed-refs').toBe(ID_C);
        expect(
            read(gitFixture('both', { '.git/HEAD': 'ref: refs/heads/main\n', '.git/refs/heads/main': `${ID_B}\n`, '.git/packed-refs': packed })),
            'the loose ref wins over packed-refs',
        ).toBe(ID_B);
    });

    it('reads a .git FILE with a relative or an absolute gitdir pointer', () => {
        const read = loadReadGitHead();
        const relative = gitFixture('file-rel', { '.git': 'gitdir: ../git-file-rel-store/real\n' });
        gitFixture('file-rel-store', { 'real/HEAD': `${ID_A}\n` });
        expect(read(relative), 'relative pointer').toBe(ID_A);
        const store = gitFixture('file-abs-store', { 'real/HEAD': 'ref: refs/heads/topic\n', 'real/refs/heads/topic': `${ID_B}\n` });
        const absolute = gitFixture('file-abs', { '.git': `gitdir: ${path.join(store, 'real')}\n` });
        expect(read(absolute), 'absolute pointer to a gitdir with a loose ref').toBe(ID_B);
    });

    it('a linked worktree layout (HEAD in the worktree folder, refs in the common folder) fails or reads the right id', () => {
        const read = loadReadGitHead();
        const common = gitFixture('wt-common', { '.git/refs/heads/feat': `${ID_F}\n`, '.git/HEAD': `${ID_A}\n` });
        gitFixture('wt-common', { '.git/worktrees/wt/HEAD': 'ref: refs/heads/feat\n', '.git/worktrees/wt/commondir': '../..\n' });
        const tree = gitFixture('wt-tree', { '.git': `gitdir: ${path.join(common, '.git', 'worktrees', 'wt')}\n` });
        let result: string | undefined;
        try {
            result = read(tree);
        } catch {
            result = undefined; // A refusal is a safe result.
        }
        if (result !== undefined) expect(result, 'a value, if any, is the id of the worktree branch').toBe(ID_F);
    });

    it('fails on a missing, empty, or corrupt HEAD and never returns a wrong id', () => {
        const read = loadReadGitHead();
        const cases: Array<[string, Record<string, string>]> = [
            ['no .git at all', {}],
            ['no HEAD file', { '.git/config': 'x' }],
            ['an empty HEAD', { '.git/HEAD': '' }],
            ['a garbage HEAD', { '.git/HEAD': 'not a head\n' }],
            ['a 39 character id', { '.git/HEAD': `${ID_A.slice(1)}\n` }],
            ['a 41 character id', { '.git/HEAD': `${ID_A}a\n` }],
            ['an upper case id', { '.git/HEAD': `${'A'.repeat(40)}\n` }],
            ['a 64 character id', { '.git/HEAD': `${ID_A}${ID_B.slice(0, 24)}\n` }],
            ['a ref with no name', { '.git/HEAD': 'ref: \n' }],
            ['a ref with trailing words', { '.git/HEAD': 'ref: refs/heads/main extra\n', '.git/refs/heads/main': `${ID_B}\n` }],
            ['a ref that does not exist', { '.git/HEAD': 'ref: refs/heads/nope\n' }],
            ['a ref file that holds garbage', { '.git/HEAD': 'ref: refs/heads/main\n', '.git/refs/heads/main': 'garbage\n' }],
            [
                'a corrupt loose ref and a good packed ref',
                { '.git/HEAD': 'ref: refs/heads/main\n', '.git/refs/heads/main': 'garbage\n', '.git/packed-refs': `${ID_C} refs/heads/main\n` },
            ],
            ['packed-refs that holds only other branches', { '.git/HEAD': 'ref: refs/heads/main\n', '.git/packed-refs': `${ID_C} refs/heads/main2\n${ID_D} refs/heads/xmain\n` }],
            ['a .git file with no gitdir line', { '.git': 'hello\n' }],
            ['a .git file that points to a missing folder', { '.git': 'gitdir: ./does-not-exist\n' }],
        ];
        expect(cases.length, 'the table holds 16 cases').toBe(16);
        const wrong: string[] = [];
        for (const [index, [label, files]] of cases.entries()) {
            const dir = gitFixture(`corrupt-${index}`, files);
            let value: string | undefined;
            try {
                value = read(dir);
            } catch {
                value = undefined;
            }
            if (value !== undefined) wrong.push(`${label}: returned ${value}`);
        }
        expect(wrong, 'the corrupt layouts that give a value instead of an error').toEqual([]);
    });

    it('a HEAD ref that climbs out of the git folder never gives the id of a file outside it', () => {
        const read = loadReadGitHead();
        const dir = gitFixture('climb', { '.git/HEAD': 'ref: ../../outside-ref\n', 'outside-ref': `${ID_D}\n` });
        let value: string | undefined;
        try {
            value = read(dir);
        } catch {
            value = undefined;
        }
        expect(value, 'a ref outside the git folder is refused').toBeUndefined();
    });

    it('reads the id of this repository (the same id as git rev-parse HEAD)', () => {
        const read = loadReadGitHead();
        const repo = path.resolve(DASHBOARD, '..');
        const expected = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout.trim();
        expect(expected, 'git gives a 40 character id').toMatch(/^[0-9a-f]{40}$/);
        expect(read(repo)).toBe(expected);
    });
});

describe('ADV2-2 size cap of the art files (adversarial round 2, risk of the Green 3 code)', () => {
    const CAP = 64 * 1024 * 1024;

    /** Extends a valid PNG with trailing zero bytes to an exact size (a sparse file). */
    function growTo(file: string, size: number): void {
        fs.truncateSync(file, size);
    }

    it('accepts a file at the cap, refuses one byte above, and refuses a sparse file far above it', async () => {
        const { planQuestBuild } = await api();
        const cases: Array<[string, number, boolean]> = [
            ['exactly at the cap', CAP, false],
            ['one byte below the cap', CAP - 1, false],
            ['one byte above the cap', CAP + 1, true],
            ['a sparse file of 4 GiB', 4 * 1024 * 1024 * 1024, true],
        ];
        expect(cases.length, 'the table holds 4 sizes').toBe(4);
        for (const [label, size, refused] of cases) {
            const pictures = await fixturePictures(`adv2-cap-${size}`, (dir) => growTo(path.join(dir, BOOK.art.studentFront), size));
            const stat = fs.statSync(path.join(pictures, BOOK.art.studentFront));
            expect(stat.size, `${label}: the fixture has the size`).toBe(size);
            const root = makeRoot(`adv2-cap-root-${size}`, []);
            const plan = await planQuestBuild(planInput(root, pictures));
            if (refused) {
                expect(plan.errors.join('\n'), `${label}: an error names the file`).toContain(BOOK.art.studentFront);
            } else {
                expect(plan.errors, `${label}: no error`).toEqual([]);
            }
            fs.rmSync(path.join(pictures, BOOK.art.studentFront));
        }
    }, 120000);

    it('applies the cap to a reader picture and to a line art picture too', async () => {
        const { planQuestBuild } = await api();
        for (const [label, name] of [
            ['reader colour picture', READERS[0].picture.fileName],
            ['reader line art picture', READERS[1].picture.lineArtFileName],
        ] as const) {
            const pictures = await fixturePictures(`adv2-cap-reader-${label.replace(/\s+/g, '-')}`, (dir) => growTo(path.join(dir, name), CAP + 1));
            const root = makeRoot(`adv2-cap-reader-root-${label.replace(/\s+/g, '-')}`, []);
            const plan = await planQuestBuild(planInput(root, pictures));
            expect(plan.errors.join('\n'), `${label}: an error names the file`).toContain(name);
            fs.rmSync(path.join(pictures, name));
        }
    }, 120000);
});

describe('ADV2-1 links above and at the out folder (adversarial round 2, risk of the Green 3 code)', () => {
    it('refuses an out folder that is a symlink, and a symlink one level higher, and writes nothing through them', async () => {
        const { planQuestBuild } = await api();
        // (a) the default out folder is a symlink to a folder outside the root.
        const rootA = makeRoot('adv2-link-a', []);
        const targetA = path.join(TMP_BASE, 'adv2-link-a-target');
        fs.mkdirSync(targetA, { recursive: true });
        fs.symlinkSync(targetA, path.join(rootA, 'storytime', 'covers-quest-v1'));
        const planA = await planQuestBuild(planInput(rootA, BASE_PICTURES));
        expect(planA.errors.length, 'the out folder as a symlink to an outside folder is refused').toBeGreaterThan(0);
        expect(fs.readdirSync(targetA), 'the plan writes nothing through the out folder link').toEqual([]);
        // (b) the storytime folder, one level higher, is a symlink to a folder outside the root.
        const rootB = path.join(TMP_BASE, 'adv2-link-b');
        const targetB = path.join(TMP_BASE, 'adv2-link-b-target');
        fs.mkdirSync(rootB, { recursive: true });
        fs.mkdirSync(targetB, { recursive: true });
        fs.symlinkSync(targetB, path.join(rootB, 'storytime'));
        const planB = await planQuestBuild(planInput(rootB, BASE_PICTURES));
        expect(planB.errors.length, 'a storytime folder that is a symlink to an outside folder is refused').toBeGreaterThan(0);
        expect(fs.readdirSync(targetB), 'the plan writes nothing through the storytime link').toEqual([]);
    }, 120000);

    it('a dangling symlink at a sub folder or at the out folder fails the build, writes nothing through it, and leaves no temp folder', async () => {
        for (const where of ['sub folder', 'out folder'] as const) {
            const fixture = await liveFixture(`adv2-dangling-${where.replace(' ', '-')}`);
            const nowhere = path.join(TMP_BASE, `adv2-dangling-nowhere-${where.replace(' ', '-')}`, 'target');
            fs.mkdirSync(path.dirname(nowhere), { recursive: true });
            if (where === 'sub folder') {
                fs.mkdirSync(fixture.out, { recursive: true });
                fs.symlinkSync(nowhere, path.join(fixture.out, 'readers-leaf'));
            } else {
                fs.symlinkSync(nowhere, fixture.out);
            }
            const tmp = privateTmp(`adv2-dangling-${where.replace(' ', '-')}`);
            const result = await runBuild(liveArgv(fixture, ['--print']), tmp.env);
            expect(result.status, `${where}: the build fails; stderr ${result.stderr.slice(-300)}`).not.toBe(0);
            expect(result.stderr.length, `${where}: the build prints an error`).toBeGreaterThan(0);
            expect(fs.readdirSync(path.dirname(nowhere)), `${where}: nothing is created at the link target`).toEqual([]);
            expect(printFilesIn(fixture.out), `${where}: no print file`).toEqual([]);
            expect(tmp.left(), `${where}: no storytime-quest- temp folder is left`).toEqual([]);
        }
    }, LIVE_MS);
});

describe('ADV2-6 failure paths and the temp folder (adversarial round 2, risk of the Green 3 code)', () => {
    it('a read-only out folder leaves no storytime-quest- temp folder', async () => {
        const fixture = await liveFixture('adv2-ro');
        fs.mkdirSync(fixture.out, { recursive: true });
        fs.chmodSync(fixture.out, 0o555);
        const tmp = privateTmp('adv2-ro');
        try {
            const result = await runBuild(liveArgv(fixture, ['--print']), tmp.env);
            expect(result.status, `the build fails; stderr ${result.stderr.slice(-300)}`).toBe(1);
        } finally {
            fs.chmodSync(fixture.out, 0o755);
        }
        expect(tmp.left(), 'no storytime-quest- temp folder is left').toEqual([]);
    }, LIVE_MS);

    it('a missing phonics graph leaves no storytime-quest- temp folder', async () => {
        const fixture = await liveFixture('adv2-graph');
        const tmp = privateTmp('adv2-graph');
        const result = await runBuild(liveArgv(fixture), { ...tmp.env, MASTERY_PHONICS_GRAPH: path.join(TMP_BASE, 'adv2-no-graph', 'graph.json') });
        expect(result.status, `the build fails; stderr ${result.stderr.slice(-300)}`).not.toBe(0);
        expect(tmp.left(), 'no storytime-quest- temp folder is left').toEqual([]);
    }, LIVE_MS);

    it.each(['SIGINT', 'SIGTERM'] as const)('a %s while the build runs leaves no storytime-quest- temp folder', async (signal) => {
        const fixture = await liveFixture(`adv2-${signal}`);
        const tmp = privateTmp(`adv2-${signal}`);
        const child = spawn(process.execPath, ['--import', 'tsx', SCRIPT_FILE, ...liveArgv(fixture)], {
            cwd: DASHBOARD,
            env: { ...process.env, ...tmp.env },
            stdio: ['ignore', 'ignore', 'ignore'],
        });
        const closed = new Promise<void>((resolve) => child.on('close', () => resolve()));
        const started = Date.now();
        // Wait for the page documents of the build in its temp folder, then stop it.
        for (;;) {
            const folder = tmp.left()[0];
            if (folder && fs.existsSync(path.join(tmp.dir, folder, 'page-0.html'))) break;
            if (Date.now() - started > 240000) break;
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        const seen = tmp.left().length;
        child.kill(signal);
        const killer = setTimeout(() => child.kill('SIGKILL'), 60000);
        await closed;
        clearTimeout(killer);
        expect(seen, 'the build made its temp folder before the signal').toBe(1);
        expect(tmp.left(), `no storytime-quest- temp folder is left after ${signal}`).toEqual([]);
    }, LIVE_MS);

    it('a failure in the move step of the print files leaves no print file at a final name and no temp folder', async () => {
        const fixture = await liveFixture('adv2-move');
        const shimDir = path.join(TMP_BASE, 'adv2-move-shim');
        fs.mkdirSync(shimDir, { recursive: true });
        // The shim closes the readers-leaf folder when the PDF/X step reaches the leaf group, which is
        // the last group. The staged files are complete, so only the move into the out folder fails.
        const shim = [
            '#!/bin/bash',
            'case "$*" in',
            '  *readers-leaf*) chmod 555 "$QUEST_SHIM_OUT/readers-leaf" ;;',
            'esac',
            'exec /usr/bin/gs "$@"',
            '',
        ].join('\n');
        fs.writeFileSync(path.join(shimDir, 'gs'), shim, { mode: 0o755 });
        const tmp = privateTmp('adv2-move');
        let result: ChildResult;
        try {
            result = await runBuild(liveArgv(fixture, ['--print']), {
                ...tmp.env,
                QUEST_SHIM_OUT: fixture.out,
                PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ''}`,
            });
        } finally {
            const leaf = path.join(fixture.out, 'readers-leaf');
            if (fs.existsSync(leaf)) fs.chmodSync(leaf, 0o755);
        }
        const text = result.stdout + result.stderr;
        expect(result.status, `the build fails; output ${text.slice(-400)}`).not.toBe(0);
        expect(text, 'the failure is the move into the closed folder').toMatch(/EACCES|permission denied/i);
        const printed = printFilesIn(fixture.out);
        expect(printed.length === 0 || printed.length === 4, `a failed build leaves none or all of the 4 print files, not a part (found: ${printed.join(', ')})`).toBe(true);
        expect(printed, 'a failed build leaves no print file with a final name').toEqual([]);
        expect(tmp.left(), 'no storytime-quest- temp folder is left').toEqual([]);
    }, LIVE_MS);
});
