import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { chromium, type Browser } from '@playwright/test';
import sharp from 'sharp';
import { readLevelWeeks, readPhonicsGraph, PHONICS_GRAPH_FILE, STORYTIME_ROOT } from '../../lib/storytime/files';
import {
    loadStorytimeCoverBooks,
    STORYTIME_COVER_BOOKS_FILE,
    STORYTIME_COVER_LOGO_FILE,
    storytimeCoverFileUrl,
    storytimeCoverPanelValues,
    storytimeCoverQrGrid,
    storytimeCoverQrSvg,
    type StorytimeCoverBook,
    type StorytimeCoverBookPanel,
} from '../../lib/storytime/print/covers';
import {
    checkQuestArt,
    checkQuestCopy,
    checkQuestLitBand,
    checkQuestPageSize,
    checkQuestQr,
    checkQuestThai,
    loadQuestCovers,
    questPageSize,
    questReaders,
    renderQuestCover,
    QUEST_BOXES,
    type QuestBookRow,
    type QuestCoverKind,
    type QuestPanelValue,
    type QuestReaderRow,
    type QuestTopStyle,
} from '../../lib/storytime/print/cover-quest';

/**
 * The build of the option A Level 2 Unit 1 covers (track storytime_cover_options_20261106, task
 * 2.7, spec FR-11.1, FR-11.2, D-A9): the student front and back, the teacher front and back, the
 * 14 A3 reader covers, and the 14 leaf reader covers. The form follows
 * `make-storytime-book-cover.ts`: a Playwright PNG at 300 ppi, a Chrome PDF, and, with `--print`,
 * the PDF/X-1a file through `scripts/print/make-pdfx.ts --keep-fonts` (the leaf adds `--k-only`).
 *
 * The script exports its pure functions (pin P4) and runs `main` only when it runs directly. An
 * import changes no `process.exitCode`. The tests of `dashboard/__tests__/quest-cover-build.test.ts`
 * are the contract. The script makes no network call and launches no paid tool.
 *
 * The folder of one set is `<root>/storytime/covers-quest-v<n>` (pins P5 and P6). `--version <n>`
 * is the set number: set 1 gives student v4, teacher v2, and readers v1.
 *
 * The alternate A2 of 2026-11-10 (Daniel's look note of Tasks NXlkaVBtUW9hZWRuU1J6UA: "I want an
 * alternate where we just use the horizontal logo as the entire top Chrome here") adds the flag
 * `--top banner|hlogo`. The default is `banner`, the r5 style, and it renders byte for byte as
 * before. `hlogo` sets the horizontal Storytime Advantage logo on its amber tile as the only top
 * chrome of the 2 fronts and the 2 backs. The 2 readers ignore the flag.
 */

const USAGE = `Builds the option A covers of one Storytime Advantage unit (spec FR-11.1, FR-11.2):
the student cover, the teacher cover, the 14 A3 reader covers, and the 14 leaf reader covers.
Run it under the heavy-job lock.

Usage: npx tsx scripts/storytime/make-storytime-quest-covers.ts --level <n> --unit <m> [--version <n>] [--out <dir>] [--print-ready-root <dir>] [--pictures-dir <dir>] [--top <style>] [--print]

  --level              The level of the unit, 1 to 4
  --unit               The unit of the unit, 1 to 4
  --version            The set number, an integer from 1 (default 1). Set 1 gives student v4,
                       teacher v2, and readers v1.
  --out                The output folder (default <root>/storytime/covers-quest-v<version>)
  --print-ready-root   The print-ready root (default ~/Desktop/print-ready)
  --pictures-dir       The folder of the art files (default the shipped picture folder)
  --top                The top chrome style of the 2 fronts and the 2 backs: banner (default,
                       the r5 style) or hlogo (the alternate A2, the horizontal logo)
  --print              Also write the PDF/X-1a print files through scripts/print/make-pdfx.ts
  --help               Print this text and exit 0

Exit code 2 when an argument is not valid or the out folder is not allowed. Exit code 1 when a
check of the plan, the pages, or the build report fails. The build writes no deliverable when a
check fails, and it never overwrites a file.`;

/** The four groups of the build (pin P4). */
export type QuestGroup = 'student' | 'teacher' | 'readers-a3' | 'readers-leaf';

/** The parsed arguments of the build (pin P4). */
export interface QuestArgs {
    /** The level, 1 to 4. */
    level: number;
    /** The unit, 1 to 4. */
    unit: number;
    /** The set number (pin P5). */
    version: number;
    /** The out folder: the text of `--out`, or the default folder. */
    out: string;
    /** The print-ready root (pin P6). */
    printReadyRoot: string;
    /** True for a PDF/X build. */
    print: boolean;
    /** The folder of the art files. */
    picturesDir?: string;
    /**
     * The top chrome style of the 2 fronts and the 2 backs (the alternate A2 of 2026-11-10):
     * `banner` (the default, the r5 style) or `hlogo` (the horizontal logo).
     */
    top: QuestTopStyle;
}

/** The result of `parseQuestArgs`. */
export interface QuestParseResult {
    /** True for `--help`. */
    help: boolean;
    /** The errors. */
    errors: string[];
    /** The usage text. */
    usage: string;
    /** The arguments, or null when an error is present or help is true. */
    args: QuestArgs | null;
}

/** The input of `planQuestBuild`. */
export interface QuestPlanInput {
    /** The level, 1 to 4. */
    level: number;
    /** The unit, 1 to 4. */
    unit: number;
    /** The set number. */
    version: number;
    /** The out folder. */
    outDir: string;
    /** The print-ready root. */
    printReadyRoot: string;
    /** The folder of the art files. */
    picturesDir: string;
}

/** One art row of the plan. */
export interface QuestPlanRow {
    /** The file name. */
    file: string;
    /** The kind: `student-front`, `student-back`, `teacher-front`, `reader-a3`, or `reader-leaf`. */
    kind: string;
    /** The width in pixels. */
    widthPx: number;
    /** The height in pixels. */
    heightPx: number;
    /** The effective ppi of the art at the page width. */
    ppi: number;
}

/** The result of `planQuestBuild`. */
export interface QuestPlan {
    /** The errors. */
    errors: string[];
    /** The 44 paths that the build writes, relative to the out folder. */
    files: string[];
    /** The 3 book art rows. */
    art: QuestPlanRow[];
    /** The 28 reader picture rows. */
    pictures: QuestPlanRow[];
}

/** One page row of the build report. */
export interface QuestReportRow {
    /** The page file, relative to the out folder. */
    file: string;
    /** The cover kind. */
    kind: string;
    /** The page width in millimetres. */
    widthMm: number;
    /** The page height in millimetres. */
    heightMm: number;
    /** The effective ppi of the art. */
    artPpi: number;
    /** The seven checks, each `pass` or `fail`. */
    checks: Record<string, unknown>;
}

/** The result of `questBuildReport`. */
export interface QuestReport {
    /** True when every row holds the seven checks and every check passes. */
    ok: boolean;
    /** 0 when ok, else 1. */
    exitCode: number;
    /** The errors. */
    errors: string[];
    /** The rows, in their order. */
    pages: QuestReportRow[];
}

/** The result of `parseQuestPdfInfo`. */
export interface QuestPdfInfo {
    /** The page count. */
    pages: number;
    /** The page width in points. */
    widthPt: number;
    /** The page height in points. */
    heightPt: number;
}

/** The result of `questQrFromPng`. */
export interface QuestQrResult {
    /** The module count. */
    modules: number;
    /** The dark module count. */
    dark: number;
    /** The modules that differ from the LINE encoder grid. */
    different: number;
}

/** The 7 check keys of a report row, in order. */
const CHECK_KEYS = ['copy', 'thai', 'qr', 'pageSize', 'ppi', 'band', 'forbidden'] as const;

/** The page count of each group. */
const GROUP_PAGES: Record<QuestGroup, number> = {
    student: 2,
    teacher: 2,
    'readers-a3': 14,
    'readers-leaf': 14,
};

/** The cover kind of each group. */
const GROUP_KIND: Record<QuestGroup, QuestCoverKind> = {
    student: 'student-front',
    teacher: 'teacher-front',
    'readers-a3': 'reader-a3',
    'readers-leaf': 'reader-leaf',
};

/** The page tolerance of the PDF check, in points. */
const PDF_TOLERANCE_PT = 1.5;

/** The pixels per inch of the build. */
const PPI = 300;

/** The points per millimetre. */
const PT_PER_MM = 72 / 25.4;

/** The size cap of one art file: 64 MB (test strategy 4.15). */
const ART_SIZE_CAP_BYTES = 64 * 1024 * 1024;

/** The pattern of a full commit id. */
const GIT_HEAD_PATTERN = /^[0-9a-f]{40}$/;

/** The dashboard folder, the root of the print scripts. */
const DASHBOARD_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The repository root. */
const REPO_ROOT = path.resolve(DASHBOARD_ROOT, '..');

/** The shipped picture folder. */
const PICTURES_DIR = path.join(REPO_ROOT, 'content', 'storytime', 'l2', 'print', 'pictures');

/** The three book art sides of `quest.json`, in the order of the art rows. */
const BOOK_ART_SIDES: Array<{ side: 'studentFront' | 'back' | 'teacherFront'; kind: string }> = [
    { side: 'studentFront', kind: 'student-front' },
    { side: 'back', kind: 'student-back' },
    { side: 'teacherFront', kind: 'teacher-front' },
];

/**
 * The usage text.
 * @returns The usage text.
 */
function usageText(): string {
    return USAGE;
}

/**
 * Reads one numeric flag in a range.
 * @param text The text of the value, or undefined.
 * @param min The minimum.
 * @param max The maximum.
 * @param flag The flag name, for the error.
 * @param errors The error list to fill.
 * @returns The number, or undefined.
 */
function numberFlag(text: string | undefined, min: number, max: number, flag: string, errors: string[]): number | undefined {
    if (text === undefined) {
        errors.push(`The flag ${flag} is missing.`);
        return undefined;
    }
    if (!/^\d+$/.test(text)) {
        errors.push(`The flag ${flag} needs a whole number, not "${text}".`);
        return undefined;
    }
    const value = Number(text);
    if (!Number.isSafeInteger(value) || value < min || value > max) {
        errors.push(`The flag ${flag} must be from ${min} to ${max}, not "${text}".`);
        return undefined;
    }
    return value;
}

/**
 * Parses the argv of the build (pin P4). It reads no file, ends no process, and returns the
 * arguments or the errors. The alternate A2 of 2026-11-10 adds the flag `--top` with the values
 * `banner` (the default) and `hlogo`; any other value is an error.
 * @param argv The arguments after the script name.
 * @returns The parsed result.
 */
export function parseQuestArgs(argv: string[]): QuestParseResult {
    const errors: string[] = [];
    const values = new Map<string, string>();
    const valueFlags = new Set([
        '--level',
        '--unit',
        '--version',
        '--out',
        '--print-ready-root',
        '--pictures-dir',
        '--top',
    ]);
    let help = false;
    let print = false;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help') {
            help = true;
            continue;
        }
        if (arg === '--print') {
            if (values.has('--print')) errors.push('The flag --print is given twice.');
            values.set('--print', 'true');
            continue;
        }
        if (!valueFlags.has(arg)) {
            errors.push(`The flag "${arg}" is not a flag of the build.`);
            continue;
        }
        if (values.has(arg)) {
            errors.push(`The flag ${arg} is given twice.`);
        }
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('-')) {
            errors.push(`The flag ${arg} needs a value.`);
            continue;
        }
        values.set(arg, next);
        i++;
    }
    if (help) return { help: true, errors: [], usage: usageText(), args: null };
    const level = numberFlag(values.get('--level'), 1, 4, '--level', errors);
    const unit = numberFlag(values.get('--unit'), 1, 4, '--unit', errors);
    const version = values.has('--version') ? numberFlag(values.get('--version'), 1, 4294967295, '--version', errors) : 1;
    const topText = values.get('--top') ?? 'banner';
    const top: QuestTopStyle | undefined = topText === 'banner' || topText === 'hlogo' ? topText : undefined;
    if (top === undefined) errors.push(`The flag --top must be banner or hlogo, not "${topText}".`);
    if (errors.length || level === undefined || unit === undefined || version === undefined || top === undefined) {
        return { help: false, errors, usage: usageText(), args: null };
    }
    const printReadyRoot = values.get('--print-ready-root') ?? path.join(os.homedir(), 'Desktop', 'print-ready');
    const out = values.get('--out') ?? path.join(printReadyRoot, 'storytime', `covers-quest-v${version}`);
    const args: QuestArgs = {
        level,
        unit,
        version,
        out,
        printReadyRoot,
        print,
        top,
    };
    if (values.has('--pictures-dir')) args.picturesDir = values.get('--pictures-dir');
    print = values.has('--print');
    args.print = print;
    return { help: false, errors: [], usage: usageText(), args };
}

/**
 * Resolves the symlinks of a path that may not exist: it resolves the nearest existing parent and
 * appends the rest.
 * @param target The path.
 * @returns The path with its symlinks resolved as far as it exists.
 */
function realish(target: string): string {
    const absolute = path.resolve(target);
    let head = absolute;
    const tail: string[] = [];
    while (!fs.existsSync(head)) {
        const parent = path.dirname(head);
        if (parent === head) break;
        tail.unshift(path.basename(head));
        head = parent;
    }
    return path.join(fs.realpathSync(head), ...tail);
}

/**
 * Reads the commit id of the working repository without a child process: the `.git/HEAD` file, the
 * ref file, or the packed refs (test strategy 4.15, review case ADV-8). The build report records
 * this value, so a check can compare a print file with the last change.
 * @param repoRoot The repository root.
 * @returns The 40 character commit id.
 * @throws Error When the repository, the ref, or the commit id is not readable.
 */
function readGitHead(repoRoot: string): string {
    const dotGit = path.join(repoRoot, '.git');
    let gitDir = dotGit;
    if (!fs.existsSync(dotGit)) throw new Error(`the repository ${repoRoot} holds no .git`);
    if (fs.statSync(dotGit).isFile()) {
        const pointer = fs.readFileSync(dotGit, 'utf8').trim().match(/^gitdir:\s*(.+)$/)?.[1];
        if (!pointer) throw new Error(`the file ${dotGit} holds no git folder`);
        gitDir = path.resolve(repoRoot, pointer.trim());
    }
    const headFile = path.join(gitDir, 'HEAD');
    const head = fs.readFileSync(headFile, 'utf8').trim();
    if (GIT_HEAD_PATTERN.test(head)) return head;
    const ref = head.match(/^ref:\s+(\S+)$/)?.[1];
    if (!ref) throw new Error(`the file ${headFile} holds neither a commit id nor a ref`);
    const refFile = path.join(gitDir, ref);
    if (fs.existsSync(refFile)) {
        const id = fs.readFileSync(refFile, 'utf8').trim();
        if (GIT_HEAD_PATTERN.test(id)) return id;
        throw new Error(`the ref file ${refFile} holds no commit id`);
    }
    const packed = path.join(gitDir, 'packed-refs');
    if (fs.existsSync(packed)) {
        for (const line of fs.readFileSync(packed, 'utf8').split('\n')) {
            const row = line.match(/^([0-9a-f]{40})\s+(\S+)$/);
            if (row && row[2] === ref) return row[1];
        }
    }
    throw new Error(`the ref ${ref} of ${gitDir} is not readable`);
}

/**
 * Checks the out folder against the policy of pin P6. The out folder must be
 * `<root>/storytime/covers-quest-v<version>` after the symlinks resolve. It refuses a `..`
 * segment, a leading `-`, a folder of another version, and an existing file.
 * @param out The out folder, as written.
 * @param version The set number.
 * @param printReadyRoot The print-ready root.
 * @returns The errors (empty when the folder is allowed).
 */
export function checkQuestOutDir(out: string, version: number, printReadyRoot: string): string[] {
    const errors: string[] = [];
    if (typeof out !== 'string' || !out) return ['The out folder is empty.'];
    if (out.startsWith('-')) return [`The out folder "${out}" starts with a dash.`];
    if (out.split(/[\\/]+/).some((segment) => segment === '..')) {
        return [`The out folder "${out}" holds a ".." segment.`];
    }
    const folder = `covers-quest-v${version}`;
    const wanted = path.join(realish(printReadyRoot), 'storytime', folder);
    const base = realish(path.join(printReadyRoot, 'storytime', folder));
    if (base !== wanted) {
        errors.push(`The folder ${path.join(printReadyRoot, 'storytime', folder)} resolves to ${base}, not to ${wanted}.`);
    }
    const resolved = realish(out);
    if (resolved !== base) {
        errors.push(`The out folder "${out}" resolves to ${resolved}, not to ${base}.`);
    }
    if (fs.existsSync(out) && !fs.statSync(out).isDirectory()) {
        errors.push(`The out folder "${out}" is a file.`);
    }
    return errors;
}

/**
 * The print file names of one set (pin P5, spec FR-11.2). Set n gives student 3+n, teacher 1+n,
 * and readers n.
 * @param level The level.
 * @param unit The unit.
 * @param version The set number.
 * @returns The four print names and the 14 PNG names of each reader kind.
 */
export function questFileNames(
    level: number,
    unit: number,
    version: number,
): { student: string; teacher: string; readersA3: string; readersLeaf: string; readerPngsA3: string[]; readerPngsLeaf: string[] } {
    const stem = `Storytime-Advantage-L${level}-U${unit}`;
    const readers = questReaders();
    return {
        student: `${stem}-Student-Book-Cover-v${3 + version}_PDFX-1a.pdf`,
        teacher: `${stem}-Teachers-Book-TH-Cover-v${1 + version}_PDFX-1a.pdf`,
        readersA3: `${stem}-Reader-Covers-A3-v${version}_PDFX-1a.pdf`,
        readersLeaf: `${stem}-Reader-Leaf-Covers-v${version}_PDFX-1a.pdf`,
        readerPngsA3: readers.map((row) => `${readerStem(row)}-a3-cover.png`),
        readerPngsLeaf: readers.map((row) => `${readerStem(row)}-leaf-cover.png`),
    };
}

/**
 * The stem of one reader cover file: `l2-w<week>-<slug>`.
 * @param row The reader row.
 * @returns The stem.
 */
function readerStem(row: QuestReaderRow): string {
    return `l2-w${String(row.week).padStart(2, '0')}-${row.slug}`;
}

/**
 * The 44 files and the 4 subfolders that the build writes, relative to the out folder, with `/`
 * separators (spec FR-11.2).
 * @param level The level.
 * @param unit The unit.
 * @param version The set number.
 * @returns The folders and the files.
 */
export function questLayout(level: number, unit: number, version: number): { folders: string[]; files: string[] } {
    const names = questFileNames(level, unit, version);
    const folders = ['student', 'teacher', 'readers-a3', 'readers-leaf'];
    const files = [
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
    return { folders, files };
}

/**
 * The argument list of the PDF/X step for one group (pin P7).
 * @param group The group.
 * @param input The Chrome PDF.
 * @param output The PDF/X-1a file.
 * @returns The argument list for `process.execPath`.
 */
export function questPdfxArgs(group: QuestGroup, input: string, output: string): string[] {
    const args = [
        '--import',
        'tsx',
        path.join(DASHBOARD_ROOT, 'scripts', 'print', 'make-pdfx.ts'),
        input,
        '--out',
        output,
        '--keep-fonts',
    ];
    if (group === 'readers-leaf') args.push('--k-only');
    return args;
}

/**
 * The effective ppi of an art file at the width of a page kind.
 * @param kind The cover kind.
 * @param widthPx The width in pixels.
 * @returns The ppi.
 */
function artPpi(kind: QuestCoverKind, widthPx: number): number {
    return widthPx / (questPageSize(kind, 0).widthMm / 25.4);
}

/**
 * Reads the size and the format of one art file.
 * @param file The file.
 * @returns The metadata, or an error text.
 */
async function artMetadata(file: string): Promise<{ widthPx: number; heightPx: number; format: string; hasAlpha: boolean; channels: number } | string> {
    try {
        const meta = await sharp(file).metadata();
        if (!meta.width || !meta.height) return `the file ${file} holds no pixel size`;
        return {
            widthPx: meta.width,
            heightPx: meta.height,
            format: meta.format ?? '',
            hasAlpha: meta.hasAlpha === true,
            channels: meta.channels ?? 0,
        };
    } catch {
        return `the file ${file} is missing or not readable as a picture`;
    }
}

/**
 * Tells whether a line art picture holds no pixel with unequal red, green, and blue values. A
 * greyscale PNG passes without a decode; an RGB file is decoded and scanned.
 * @param file The file.
 * @param channels The channel count from the metadata.
 * @returns True for pure grey and black art.
 */
async function isGreyArt(file: string, channels: number): Promise<boolean> {
    if (channels === 1) return true;
    const { data, info } = await sharp(file).toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
    const step = info.channels;
    for (let i = 0; i + 2 < data.length; i += step) {
        if (data[i] !== data[i + 1] || data[i] !== data[i + 2]) return false;
    }
    return true;
}

/**
 * The error of one art file that the build must refuse: a symlink that resolves outside the
 * pictures folder, or a file above the size cap. The lstat check reads the link, not its target
 * (review cases B-F6 and B-F7, test strategy 4.15).
 * @param picturesDir The pictures folder.
 * @param name The art file name, relative to the pictures folder.
 * @returns The error, or undefined.
 */
function artFileBoundaryError(picturesDir: string, name: string): string | undefined {
    const file = path.join(picturesDir, name);
    let stat: fs.Stats;
    try {
        stat = fs.lstatSync(file);
    } catch {
        return undefined; // The metadata check names a missing file.
    }
    if (stat.isSymbolicLink()) {
        let realFile: string;
        let realDir: string;
        try {
            realFile = fs.realpathSync(file);
            realDir = fs.realpathSync(picturesDir);
        } catch {
            return `the file ${name} is a symlink that does not resolve`;
        }
        if (realFile !== path.resolve(realDir, name) && !realFile.startsWith(realDir + path.sep)) {
            return `the file ${name} is a symlink to ${realFile}, outside the pictures folder ${realDir}`;
        }
        return undefined;
    }
    if (stat.size > ART_SIZE_CAP_BYTES) {
        return `the file ${name} is ${stat.size} bytes, above the size cap of ${ART_SIZE_CAP_BYTES} bytes`;
    }
    return undefined;
}

/**
 * Plans the build before it writes a file (pins P4 and P6, spec FR-11.2). It writes nothing and
 * creates no folder. Every error names the file or the folder that it concerns.
 * @param input The level, the unit, the set, the out folder, the root, and the picture folder.
 * @returns The errors, the 44 file paths, the 3 art rows, and the 28 picture rows.
 */
export async function planQuestBuild(input: QuestPlanInput): Promise<QuestPlan> {
    const errors: string[] = [];
    let layout: { folders: string[]; files: string[] } = { folders: [], files: [] };
    try {
        layout = questLayout(input.level, input.unit, input.version);
    } catch (error) {
        errors.push(`the reader rows are not readable: ${error instanceof Error ? error.message : String(error)}`);
    }
    const art: QuestPlanRow[] = [];
    const pictures: QuestPlanRow[] = [];
    for (const error of checkQuestOutDir(input.outDir, input.version, input.printReadyRoot)) errors.push(error);

    let book: QuestBookRow | undefined;
    try {
        book = loadQuestCovers().books.find((row) => row.level === input.level && row.unit === input.unit);
    } catch (error) {
        errors.push(`quest.json is not readable: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!book) errors.push(`quest.json holds no row for Level ${input.level} Unit ${input.unit}.`);

    if (book) {
        for (const { side, kind } of BOOK_ART_SIDES) {
            const name = book.art[side];
            const boundary = artFileBoundaryError(input.picturesDir, name);
            if (boundary) {
                errors.push(`The art of the ${kind} side: ${boundary}`);
                continue;
            }
            const file = path.join(input.picturesDir, name);
            const meta = await artMetadata(file);
            if (typeof meta === 'string') {
                errors.push(`The art of the ${kind} side: ${meta}`);
                continue;
            }
            if (meta.format !== 'png') errors.push(`the art file ${name} is a ${meta.format} file, not a PNG`);
            if (meta.hasAlpha) errors.push(`the art file ${name} holds an alpha channel`);
            if (meta.widthPx !== 2480 || meta.heightPx !== 3508) {
                errors.push(`the art file ${name} is ${meta.widthPx} x ${meta.heightPx} px, not 2480 x 3508 px`);
            }
            art.push({
                file: name,
                kind,
                widthPx: meta.widthPx,
                heightPx: meta.heightPx,
                ppi: artPpi(kind === 'student-back' ? 'student-back' : (kind as QuestCoverKind), meta.widthPx),
            });
        }
    }

    let readers: QuestReaderRow[] = [];
    try {
        readers = questReaders();
    } catch (error) {
        errors.push(`the reader rows are not readable: ${error instanceof Error ? error.message : String(error)}`);
    }
    for (const row of readers) {
        for (const { file: name, kind, grey } of [
            { file: row.picture.fileName, kind: 'reader-a3', grey: false },
            { file: row.picture.lineArtFileName, kind: 'reader-leaf', grey: true },
        ]) {
            const boundary = artFileBoundaryError(input.picturesDir, name);
            if (boundary) {
                errors.push(`The picture of ${kind}: ${boundary}`);
                continue;
            }
            const file = path.join(input.picturesDir, name);
            const meta = await artMetadata(file);
            if (typeof meta === 'string') {
                errors.push(`The picture of ${kind}: ${meta}`);
                continue;
            }
            if (meta.format !== 'png') errors.push(`the picture ${name} is a ${meta.format} file, not a PNG`);
            if (meta.widthPx !== 4000 || meta.heightPx !== 3000) {
                errors.push(`the picture ${name} is ${meta.widthPx} x ${meta.heightPx} px, not 4000 x 3000 px`);
            }
            if (grey && !(await isGreyArt(file, meta.channels))) {
                errors.push(`the line art picture ${name} holds a pixel with unequal red, green, and blue values`);
            }
            pictures.push({
                file: name,
                kind,
                widthPx: meta.widthPx,
                heightPx: meta.heightPx,
                ppi: artPpi(kind === 'reader-a3' ? 'reader-a3' : 'reader-leaf', meta.widthPx),
            });
        }
    }

    const wanted = new Set(layout.files);
    for (const folder of layout.folders) {
        const dir = path.join(input.outDir, folder);
        if (!fs.existsSync(dir)) continue;
        const stat = fs.lstatSync(dir);
        if (stat.isSymbolicLink()) {
            errors.push(`the out folder holds a symlink at the sub folder ${folder}; the build refuses to write through it`);
            continue;
        }
        if (!stat.isDirectory()) {
            errors.push(`the out folder holds the file ${folder}, not a folder`);
            continue;
        }
        for (const entry of fs.readdirSync(dir)) {
            const relative = `${folder}/${entry}`;
            if (wanted.has(relative)) errors.push(`the target file ${relative} exists; the build never overwrites a file`);
            else errors.push(`the out folder holds the file ${relative}, which this build does not write; the build never overwrites a file`);
        }
    }

    return { errors, files: layout.files, art, pictures };
}

/**
 * Builds the report of one set of page rows. A fail, a missing check, an extra key, or another
 * value gives `ok` false and exit code 1.
 * @param rows The page rows.
 * @returns The report.
 */
export function questBuildReport(rows: QuestReportRow[]): QuestReport {
    const errors: string[] = [];
    for (const row of rows) {
        const checks = row.checks ?? {};
        for (const key of CHECK_KEYS) {
            if (!(key in checks)) {
                errors.push(`${row.file}: the check "${key}" did not run`);
                continue;
            }
            const value = checks[key];
            if (value === 'fail') errors.push(`${row.file}: the check "${key}" failed`);
            else if (value !== 'pass') errors.push(`${row.file}: the check "${key}" holds ${JSON.stringify(value)}, not pass or fail`);
        }
        for (const key of Object.keys(checks)) {
            if (!(CHECK_KEYS as readonly string[]).includes(key)) errors.push(`${row.file}: the check "${key}" is not a check name`);
        }
    }
    return { ok: errors.length === 0, exitCode: errors.length === 0 ? 0 : 1, errors, pages: rows };
}

/**
 * Reads the output of `pdfinfo -box` (spec FR-11.2). It never throws.
 * @param text The text.
 * @returns The page count and the page size in points; 0 for each value that the text lacks.
 */
export function parseQuestPdfInfo(text: string): QuestPdfInfo {
    const pages = typeof text === 'string' ? text.match(/^Pages:\s+(\d+)/m) : null;
    const size = typeof text === 'string' ? text.match(/^Page size:\s+([0-9.]+)\s+x\s+([0-9.]+)/m) : null;
    return {
        pages: pages ? Number(pages[1]) : 0,
        widthPt: size ? Number(size[1]) : 0,
        heightPt: size ? Number(size[2]) : 0,
    };
}

/**
 * Checks the page count and the page size of one Chrome PDF (spec FR-11.2). The page counts are
 * 2, 2, 14, and 14; the tolerance is 1.5 pt.
 * @param info The page count and the size.
 * @param group The group.
 * @param bleedMm The bleed of the build.
 * @returns The errors.
 */
export function checkQuestPdfPages(info: QuestPdfInfo, group: QuestGroup, bleedMm: number): string[] {
    const errors: string[] = [];
    const expectedPages = GROUP_PAGES[group];
    if (info.pages !== expectedPages) errors.push(`the ${group} PDF holds ${info.pages} pages, not ${expectedPages}`);
    const page = questPageSize(GROUP_KIND[group], bleedMm);
    const widthPt = page.widthMm * PT_PER_MM;
    const heightPt = page.heightMm * PT_PER_MM;
    if (Math.abs(info.widthPt - widthPt) > PDF_TOLERANCE_PT) {
        errors.push(`the ${group} page is ${info.widthPt.toFixed(2)} pt wide, not ${widthPt.toFixed(2)} pt`);
    }
    if (Math.abs(info.heightPt - heightPt) > PDF_TOLERANCE_PT) {
        errors.push(`the ${group} page is ${info.heightPt.toFixed(2)} pt high, not ${heightPt.toFixed(2)} pt`);
    }
    return errors;
}

/**
 * Compares the QR grid of one page PNG with the LINE encoder grid (spec FR-11.2). The QR box of
 * `QUEST_BOXES` is read at 300 ppi, and the 4-module quiet zone of the box is skipped.
 * @param png The page PNG.
 * @param kind The back kind, for example `student-back`.
 * @param bleedMm The bleed of the page.
 * @returns The module count, the dark count, and the count of different modules.
 */
export async function questQrFromPng(png: Buffer, kind: string, bleedMm = 0): Promise<QuestQrResult> {
    const box = QUEST_BOXES[`${kind}:qr`];
    const grid = storytimeCoverQrGrid(storytimeCoverQrSvg());
    if (!box || grid.modules < 1) return { modules: 0, dark: 0, different: 0 };
    const units = grid.modules + 8;
    const ppm = PPI / 25.4;
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const width = info.width;
    const channels = info.channels;
    const left = (box.leftMm + bleedMm) * ppm;
    const top = (box.topMm + bleedMm) * ppm;
    const unit = (box.widthMm * ppm) / units;
    let dark = 0;
    let different = 0;
    for (let row = 0; row < grid.modules; row++) {
        for (let col = 0; col < grid.modules; col++) {
            const x = Math.round(left + (col + 4.5) * unit);
            const y = Math.round(top + (row + 4.5) * unit);
            const index = (y * width + x) * channels;
            const on = (data[index] ?? 255) < 128;
            if (on) dark++;
            if (on !== grid.cells[row][col]) different++;
        }
    }
    return { modules: grid.modules, dark, different };
}

/**
 * Extracts the body of one document.
 * @param html The document.
 * @returns The body content.
 */
function documentBody(html: string): string {
    return html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? html;
}

/**
 * Puts several page documents in one document, so that the Chrome PDF holds one page per input.
 * @param docs The documents.
 * @returns The combined document.
 */
function combineDocuments(docs: string[]): string {
    const first = docs[0] ?? '';
    const bodies = docs.map(documentBody).join('\n');
    const withBreak = first.replace('</head>', '<style>.quest-page { break-after: page; }</style>\n</head>');
    return withBreak.replace(/<body>[\s\S]*<\/body>/, `<body>\n${bodies}\n</body>`);
}

/**
 * The text of a page, without tags and with the entities decoded.
 * @param html The page.
 * @returns The text.
 */
function pageText(html: string): string {
    return html
        .replace(/<style[\s\S]*?<\/style>/g, ' ')
        .replace(/<script[\s\S]*?<\/script>/g, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * The QR check of one page: the backs hold the LINE code in the box of `QUEST_BOXES`, and every
 * other page has no QR. A box of another size or position fails, so a scaled printed code cannot
 * pass (review case ADV-4, test strategy 4.15).
 * @param html The page.
 * @param kind The cover kind.
 * @returns `pass` or `fail`.
 */
function qrCheck(html: string, kind: QuestCoverKind): string {
    if (kind !== 'student-back' && kind !== 'teacher-back') return 'pass';
    const boxStart = html.indexOf('data-part="qr"');
    if (boxStart === -1) return 'fail';
    const box = QUEST_BOXES[`${kind}:qr`];
    const tag = html.slice(boxStart).match(/^[^>]*>/)?.[0] ?? '';
    const style = tag.match(/style="([^"]*)"/)?.[1] ?? '';
    const width = Number(style.match(/width:\s*([0-9.]+)mm/)?.[1]);
    const height = Number(style.match(/height:\s*([0-9.]+)mm/)?.[1]);
    if (!box || !(width > 0) || !(height > 0)) return 'fail';
    if (Math.abs(width - box.widthMm) > 0.5 || Math.abs(height - box.heightMm) > 0.5) return 'fail';
    const svg = html.slice(boxStart).match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';
    return checkQuestQr(svg).errors.length === 0 ? 'pass' : 'fail';
}

/** The export of `qrCheck` for the Red test of the build report (Task 2.6c). */
export const questQrCheck = qrCheck;

/**
 * The lit band check of one page. The fronts and the A3 readers hold the band icons; the leaf
 * shows the band word; a back holds the same book and no band icon.
 * @param html The page.
 * @param kind The cover kind.
 * @param band The lit band of the book.
 * @returns `pass` or `fail`.
 */
function bandCheck(html: string, kind: QuestCoverKind, band: string): string {
    if (kind === 'student-back' || kind === 'teacher-back') return 'pass';
    if (kind === 'reader-leaf') {
        return html.includes('data-part="band-word"') && html.includes(band.toUpperCase()) ? 'pass' : 'fail';
    }
    return checkQuestLitBand(html, band).length === 0 ? 'pass' : 'fail';
}

/**
 * The seven checks of one page.
 * @param html The page.
 * @param kind The cover kind.
 * @param band The lit band of the book.
 * @param art The art row of the kind.
 * @param bleedMm The bleed of the build.
 * @returns The checks, in the order of `CHECK_KEYS`.
 */
function pageChecks(html: string, kind: QuestCoverKind, band: string, art: QuestPlanRow, bleedMm: number): Record<string, unknown> {
    const text = pageText(html);
    const copyErrors = checkQuestCopy(text);
    return {
        copy: copyErrors.length === 0 ? 'pass' : 'fail',
        thai: checkQuestThai(text, kind).length === 0 ? 'pass' : 'fail',
        qr: qrCheck(html, kind),
        pageSize: checkQuestPageSize(html, kind, bleedMm).length === 0 ? 'pass' : 'fail',
        ppi: checkQuestArt({ kind, widthPx: art.widthPx, heightPx: art.heightPx, bleedMm }).errors.length === 0 ? 'pass' : 'fail',
        band: bandCheck(html, kind, band),
        forbidden: copyErrors.some((error) => /forbidden word/i.test(error)) ? 'fail' : 'pass',
    };
}

/**
 * Writes one new file and refuses an existing file (the flag `wx`).
 * @param file The file.
 * @param data The bytes or the text.
 */
function writeNew(file: string, data: string | Buffer): void {
    fs.writeFileSync(file, data, { flag: 'wx' });
}

/**
 * Renders one page to a PNG of 300 ppi.
 * @param browser The browser.
 * @param htmlFile The page document.
 * @param file The PNG file.
 * @param widthMm The page width.
 * @param heightMm The page height.
 */
async function renderPagePng(browser: Browser, htmlFile: string, file: string, widthMm: number, heightMm: number): Promise<void> {
    const cssWidth = Math.ceil((widthMm / 25.4) * 96);
    const cssHeight = Math.ceil((heightMm / 25.4) * 96);
    const page = await browser.newPage({ viewport: { width: cssWidth, height: cssHeight }, deviceScaleFactor: 4 });
    try {
        await page.goto(storytimeCoverFileUrl(htmlFile), { waitUntil: 'load', timeout: 120000 });
        await page.evaluate('document.fonts.ready');
        await page.emulateMedia({ media: 'print' });
        const shot = await page.screenshot({ clip: { x: 0, y: 0, width: cssWidth, height: cssHeight } });
        const png = await sharp(shot)
            .resize(Math.round((widthMm / 25.4) * PPI), Math.round((heightMm / 25.4) * PPI), { fit: 'fill' })
            .removeAlpha()
            .png()
            .toBuffer();
        writeNew(file, png);
    } finally {
        await page.close();
    }
}

/**
 * Prints one combined document to a Chrome PDF.
 * @param browser The browser.
 * @param htmlFile The combined document.
 * @param file The PDF file.
 * @returns The page count and the page size.
 */
async function renderPagePdf(browser: Browser, htmlFile: string, file: string): Promise<QuestPdfInfo> {
    const page = await browser.newPage();
    try {
        await page.goto(storytimeCoverFileUrl(htmlFile), { waitUntil: 'load', timeout: 120000 });
        await page.evaluate('document.fonts.ready');
        await page.emulateMedia({ media: 'print' });
        await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
    } finally {
        await page.close();
    }
    return parseQuestPdfInfo(execFileSync('pdfinfo', ['-box', file], { encoding: 'utf8' }));
}

/**
 * Reads one book art row and one reader picture row from the plan.
 * @param plan The plan.
 * @param kind The kind.
 * @returns The row.
 */
function rowOf(plan: QuestPlan, kind: string): QuestPlanRow {
    const lookup = kind === 'teacher-back' ? 'student-back' : kind;
    const row = [...plan.art, ...plan.pictures].find((entry) => entry.kind === lookup);
    if (row) return row;
    return { file: '', kind, widthPx: 0, heightPx: 0, ppi: 0 };
}

/**
 * The five panel values of the student back, from the book row of the level and unit in the data
 * file, and from the shipped week files of the unit. The story text and its source weeks, and the
 * four week lists, come from that row (spec FR-4.1, FR-10.1: every text on a cover is an approved
 * text, word for word). A missing row, a missing or corrupt phonics graph or week file, a unit
 * without weeks, an empty panel, and an empty panel field each give an error, so the build fails
 * instead of printing a passing empty student panel (review case A-F1).
 * @param level The level.
 * @param unit The unit.
 * @returns The errors and the five panel values; the values are empty when an error exists.
 */
export function questPanelValues(level: number, unit: number): { errors: string[]; values: QuestPanelValue[] } {
    let entries: ReturnType<typeof readLevelWeeks>;
    try {
        entries = readLevelWeeks(STORYTIME_ROOT, level);
    } catch (error) {
        return { errors: [`the week files of Level ${level} are not readable: ${error instanceof Error ? error.message : String(error)}`], values: [] };
    }
    const errors: string[] = [];
    if (!entries.length) errors.push(`the week folder of Level ${level} holds no week file`);
    for (const entry of entries) {
        if (entry.error) errors.push(`the week file ${entry.file} is not readable: ${entry.error}`);
    }
    const weeks = entries.flatMap((entry) => (entry.week ? [entry.week] : []));
    const unitWeeks = weeks.filter((week) => week.meta.unit === unit).map((week) => week.meta.week).sort((a, b) => a - b);
    if (!unitWeeks.length) errors.push(`the week files of Level ${level} hold no week of Unit ${unit}`);
    let graph: ReturnType<typeof readPhonicsGraph>;
    try {
        graph = readPhonicsGraph();
    } catch (error) {
        errors.push(`the phonics graph ${PHONICS_GRAPH_FILE} is not readable: ${error instanceof Error ? error.message : String(error)}`);
        return { errors, values: [] };
    }
    if (!graph) {
        errors.push(`the phonics graph ${PHONICS_GRAPH_FILE} is missing; the student back panel needs it`);
        return { errors, values: [] };
    }
    if (errors.length) return { errors, values: [] };
    let data: ReturnType<typeof loadStorytimeCoverBooks>;
    try {
        data = loadStorytimeCoverBooks();
    } catch (error) {
        errors.push(
            `the book rows file ${STORYTIME_COVER_BOOKS_FILE} is not readable: ${error instanceof Error ? error.message : String(error)}`,
        );
        return { errors, values: [] };
    }
    const row = (data.books ?? []).find((entry) => entry.level === level && entry.unit === unit);
    if (!row) {
        errors.push(`the book rows file ${STORYTIME_COVER_BOOKS_FILE} holds no row of Level ${level} Unit ${unit}`);
        return { errors, values: [] };
    }
    const panel: StorytimeCoverBookPanel = row.panel;
    const book: StorytimeCoverBook = {
        level,
        unit,
        firstWeek: unitWeeks[0],
        lastWeek: unitWeeks[unitWeeks.length - 1],
        title: `Level ${level} Unit ${unit}`,
        levelColour: '#22345A',
        pictureRecipe: [],
        panel,
    };
    let values: QuestPanelValue[];
    try {
        values = storytimeCoverPanelValues(book, { weeks, graph });
    } catch (error) {
        return { errors: [`the student back panel is not computable: ${error instanceof Error ? error.message : String(error)}`], values: [] };
    }
    if (!values.length) {
        errors.push('the student back panel is empty; the build refuses an empty panel');
        return { errors, values: [] };
    }
    for (const value of values) {
        if (!value.value.trim()) errors.push(`the student back panel field ${value.field} is empty; the build refuses an empty field`);
    }
    if (errors.length) return { errors, values: [] };
    return { errors, values };
}

/** The exit codes of the two stop signals: 128 plus the signal number (F16). */
const SIGNAL_EXIT: Record<'SIGINT' | 'SIGTERM', number> = { SIGINT: 130, SIGTERM: 143 };

/**
 * Registers the stop-signal handlers of one build run (F16): a SIGINT or a SIGTERM removes the temp
 * folder of the build with a synchronous remove, then exits with 130 or 143. Call it after the temp
 * folder exists. The returned release removes both handlers, so a finished build leaves none, and an
 * import of this module adds no handler.
 * @param temp The temp folder of the build.
 * @returns The release of the two handlers.
 */
function cleanTempOnSignals(temp: string): () => void {
    const installed = (['SIGINT', 'SIGTERM'] as const).map((signal) => {
        const handler = (): void => {
            fs.rmSync(temp, { recursive: true, force: true });
            process.exit(SIGNAL_EXIT[signal]);
        };
        process.on(signal, handler);
        return { signal, handler };
    });
    return () => {
        for (const entry of installed) process.off(entry.signal, entry.handler);
    };
}

/**
 * Checks that every target folder of the print files takes a new file (F17). The build calls it
 * before the first copy, so a closed folder stops the build before a print file gets a final name.
 * @param outDir The out folder of the build.
 * @param folders The target folders, relative to the out folder.
 */
function checkPrintFolders(outDir: string, folders: readonly string[]): void {
    for (const folder of folders) {
        const dir = path.join(outDir, folder);
        try {
            fs.accessSync(dir, fs.constants.W_OK);
        } catch (error) {
            throw new Error(`the print folder ${dir} is not writable: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * The build of one unit (spec FR-11.1, FR-11.2, D-A9). Run it under the heavy-job lock.
 * @param argv The arguments after the script name.
 * @returns The exit code.
 */
async function main(argv: string[]): Promise<number> {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-quest-'));
    const releaseSignals = cleanTempOnSignals(temp);
    try {
        const parsed = parseQuestArgs(argv);
        if (parsed.help) {
            console.log(parsed.usage);
            return 0;
        }
        if (parsed.errors.length || !parsed.args) {
            for (const error of parsed.errors) console.error(error);
            return 2;
        }
        const args = parsed.args;
        const outDir = path.resolve(args.out);
        const outErrors = checkQuestOutDir(outDir, args.version, args.printReadyRoot);
        if (outErrors.length) {
            for (const error of outErrors) console.error(error);
            return 2;
        }
        const picturesDir = args.picturesDir ? path.resolve(args.picturesDir) : PICTURES_DIR;
        const plan = await planQuestBuild({
            level: args.level,
            unit: args.unit,
            version: args.version,
            outDir,
            printReadyRoot: args.printReadyRoot,
            picturesDir,
        });
        if (plan.errors.length) {
            for (const error of plan.errors) console.error(error);
            return 1;
        }
        const book = loadQuestCovers().books.find((row) => row.level === args.level && row.unit === args.unit);
        if (!book) {
            console.error(`quest.json holds no row for Level ${args.level} Unit ${args.unit}.`);
            return 1;
        }
        const readers = questReaders();
        const names = questFileNames(args.level, args.unit, args.version);
        const layout = questLayout(args.level, args.unit, args.version);
        const panel = questPanelValues(args.level, args.unit);
        if (panel.errors.length) {
            for (const error of panel.errors) console.error(error);
            return 1;
        }
        const gitHead = readGitHead(REPO_ROOT);
        for (const folder of layout.folders) fs.mkdirSync(path.join(outDir, folder), { recursive: true });
        const bleedMm = 0;
        const panelValues = panel.values;
        const logo = storytimeCoverFileUrl(STORYTIME_COVER_LOGO_FILE);

        const pages: Array<{ group: QuestGroup; kind: QuestCoverKind; html: string; file: string; widthMm: number; heightMm: number; art: QuestPlanRow }> = [];
        const docs: Record<QuestGroup, string[]> = { student: [], teacher: [], 'readers-a3': [], 'readers-leaf': [] };

        const bookPages: Array<{ kind: QuestCoverKind; group: QuestGroup; file: string; assets: Parameters<typeof renderQuestCover>[2] }> = [
            { kind: 'student-front', group: 'student', file: 'student/front.png', assets: { art: storytimeCoverFileUrl(path.join(picturesDir, book.art.studentFront)) } },
            { kind: 'student-back', group: 'student', file: 'student/back.png', assets: { art: storytimeCoverFileUrl(path.join(picturesDir, book.art.back)), logo, panelValues } },
            { kind: 'teacher-front', group: 'teacher', file: 'teacher/teacher-front.png', assets: { art: storytimeCoverFileUrl(path.join(picturesDir, book.art.teacherFront)) } },
            { kind: 'teacher-back', group: 'teacher', file: 'teacher/teacher-back.png', assets: { art: storytimeCoverFileUrl(path.join(picturesDir, book.art.back)), logo } },
        ];
        for (const entry of bookPages) {
            const html = renderQuestCover(entry.kind, book, entry.assets, { bleedMm, top: args.top });
            const page = questPageSize(entry.kind, bleedMm);
            docs[entry.group].push(html);
            pages.push({ group: entry.group, kind: entry.kind, html, file: entry.file, widthMm: page.widthMm, heightMm: page.heightMm, art: rowOf(plan, entry.kind) });
        }
        for (const entry of [
            { kind: 'reader-a3' as QuestCoverKind, group: 'readers-a3' as QuestGroup, names: names.readerPngsA3, side: 'fileName' as const },
            { kind: 'reader-leaf' as QuestCoverKind, group: 'readers-leaf' as QuestGroup, names: names.readerPngsLeaf, side: 'lineArtFileName' as const },
        ]) {
            for (const [index, reader] of readers.entries()) {
                const html = renderQuestCover(entry.kind, reader, { art: storytimeCoverFileUrl(path.join(picturesDir, reader.picture[entry.side])) }, { bleedMm });
                const page = questPageSize(entry.kind, bleedMm);
                docs[entry.group].push(html);
                pages.push({ group: entry.group, kind: entry.kind, html, file: `${entry.group}/${entry.names[index]}`, widthMm: page.widthMm, heightMm: page.heightMm, art: rowOf(plan, entry.kind) });
            }
        }

        const pdfNames: Record<QuestGroup, string> = {
            student: 'student/cover.pdf',
            teacher: 'teacher/teacher-cover.pdf',
            'readers-a3': 'readers-a3/reader-covers-a3.pdf',
            'readers-leaf': 'readers-leaf/reader-leaf-covers.pdf',
        };
        const htmlFiles: string[] = [];
        for (const [index, page] of pages.entries()) {
            const htmlFile = path.join(temp, `page-${index}.html`);
            writeNew(htmlFile, page.html);
            htmlFiles.push(htmlFile);
        }
        const combined: Record<QuestGroup, string> = { student: '', teacher: '', 'readers-a3': '', 'readers-leaf': '' };
        for (const group of Object.keys(docs) as QuestGroup[]) {
            combined[group] = path.join(temp, `${group}.html`);
            writeNew(combined[group], combineDocuments(docs[group]));
        }

        const reportRows: Record<QuestGroup, QuestReportRow[]> = { student: [], teacher: [], 'readers-a3': [], 'readers-leaf': [] };
        for (const page of pages) {
            reportRows[page.group].push({
                file: page.file,
                kind: page.kind,
                widthMm: page.widthMm,
                heightMm: page.heightMm,
                artPpi: page.art.ppi,
                checks: pageChecks(page.html, page.kind, book.litBand, page.art, bleedMm),
            });
        }
        for (const group of Object.keys(reportRows) as QuestGroup[]) {
            const report = questBuildReport(reportRows[group]);
            const reportFile = path.join(outDir, group, 'build-report.json');
            writeNew(reportFile, `${JSON.stringify({ ...report, gitHead }, null, 2)}\n`);
            if (!report.ok) {
                for (const error of report.errors) console.error(error);
                return 1;
            }
        }

        const browser = await chromium.launch({ channel: 'chrome' });
        try {
            for (const [index, page] of pages.entries()) {
                await renderPagePng(browser, htmlFiles[index], path.join(outDir, page.file), page.widthMm, page.heightMm);
            }
            for (const group of Object.keys(combined) as QuestGroup[]) {
                const info = await renderPagePdf(browser, combined[group], path.join(outDir, pdfNames[group]));
                const pdfErrors = checkQuestPdfPages(info, group, bleedMm);
                if (pdfErrors.length) {
                    for (const error of pdfErrors) console.error(error);
                    return 1;
                }
            }
        } finally {
            await browser.close();
        }

        if (args.print) {
            const printFiles: Record<QuestGroup, string> = {
                student: `student/${names.student}`,
                teacher: `teacher/${names.teacher}`,
                'readers-a3': `readers-a3/${names.readersA3}`,
                'readers-leaf': `readers-leaf/${names.readersLeaf}`,
            };
            const printDir = path.join(temp, 'print');
            fs.mkdirSync(printDir);
            const copies: Array<{ from: string; to: string }> = [];
            for (const group of Object.keys(printFiles) as QuestGroup[]) {
                const input = path.join(outDir, pdfNames[group]);
                const staged = path.join(printDir, `${group}.pdf`);
                execFileSync(process.execPath, questPdfxArgs(group, input, staged), { cwd: DASHBOARD_ROOT, stdio: 'inherit' });
                copies.push({ from: staged, to: path.join(outDir, printFiles[group]) });
            }
            checkPrintFolders(outDir, Object.keys(printFiles));
            const copied: string[] = [];
            try {
                for (const copy of copies) {
                    fs.copyFileSync(copy.from, copy.to, fs.constants.COPYFILE_EXCL);
                    copied.push(copy.to);
                }
            } catch (error) {
                // A failed copy removes the print files that this build already named, so no print
                // file stays with a final name (F17).
                for (const file of copied) fs.rmSync(file, { force: true });
                throw error;
            }
        }
        console.log(
            `Covers of Level ${args.level} Unit ${args.unit} set ${args.version}: ${pages.length} pages, ${layout.files.length} files, out ${outDir}`,
        );
        return 0;
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    } finally {
        releaseSignals();
        fs.rmSync(temp, { recursive: true, force: true });
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    main(process.argv.slice(2)).then(
        (code) => {
            process.exitCode = code;
        },
        (error) => {
            console.error(error instanceof Error ? error.message : error);
            process.exitCode = 1;
        },
    );
}
