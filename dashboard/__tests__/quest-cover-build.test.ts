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
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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
