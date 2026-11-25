import path from 'node:path';

/**
 * The pure CLI contract of the card kit build (spec FR-7; Review B finding B-P8-1): argument
 * validation with no file access, and the file names of one build. `make-card-kit-pdf.ts` passes
 * its own arguments here before it reads a week file, and the tests run the parser without a
 * render. The filesystem containment check of the output folder stays in
 * `checkStorytimeOutputContainment` of the student book build; this parser checks the lexical form
 * only, and the build runs the containment check before it writes.
 */

/** The validated arguments of one card kit build. */
export interface StorytimeCardKitArgs {
    /** The Storytime level. */
    level: number;
    /** The requested weeks, each a safe integer in range, without a duplicate. */
    weeks: number[];
    /** The resolved output folder, inside the print-ready Storytime folder. */
    outDir: string;
    /** The version in the file names. */
    version: number;
    /** Print the resolved names and stop before any file is written. */
    dryRun: boolean;
}

/** The file names of one build. */
export interface StorytimeCardKitFileNames {
    /** The PDF/X-1a file of the A5 cards. */
    a5: string;
    /** The PDF/X-1a file of the A6 cards. */
    a6: string;
    /** The PDF/X-1a file of the sticker sheet. */
    stickers: string;
    /** The picture match report. */
    match: string;
}

/** The safe `--level` range, as `check-weeks.ts` accepts levels 1 to 4. */
const MIN_LEVEL = 1;
const MAX_LEVEL = 4;
/** The safe `--weeks` range for one week pack. */
const MIN_WEEK = 1;
const MAX_WEEK = 32;
/** The safe `--version` range: it labels the print file (rule 12.2), so it needs no upper end. */
const MIN_VERSION = 1;
const MAX_VERSION = Number.MAX_SAFE_INTEGER;

/** The print-ready Storytime folder that holds every card kit file (spec P2). */
export const storytimePrintReadyDir = (home: string): string =>
    path.join(home, 'Desktop', 'print-ready', 'storytime');

/**
 * Parses a whole-number flag value.
 * @param value The raw flag value.
 * @param name The flag name, for the message.
 * @param min The smallest accepted value.
 * @param max The largest accepted value.
 * @returns The value as a safe integer in range.
 */
function safeInt(value: string | undefined, name: string, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${name} must be a whole number from ${min} to ${max}, got "${String(value)}"`);
    }
    return parsed;
}

/**
 * The default output folder of one build: `<home>/Desktop/print-ready/storytime/card-kit-v<n>/`.
 * @param home The user home folder.
 * @param version The validated version.
 * @returns The absolute folder.
 */
function defaultOutDir(home: string, version: number): string {
    return path.join(storytimePrintReadyDir(home), `card-kit-v${version}`);
}

/**
 * Parses and validates the arguments of the build, with no file access (Review B, B-P8-1).
 * Each level, week, and version value must parse to a safe integer in range, the week list holds
 * no duplicate, and an explicit `--out` must resolve inside the print-ready Storytime folder of
 * `home`, never the folder itself.
 * @param argv The CLI arguments, without the node command.
 * @param home The user home folder that resolves the default output folder.
 * @returns The validated arguments.
 * @throws Error When an argument is missing, out of range, repeated, or outside the print folder.
 */
export function parseStorytimeCardKitArgs(argv: string[], home: string): StorytimeCardKitArgs {
    let level: number | undefined;
    let weeks: number[] | undefined;
    let out: string | undefined;
    let version = 1;
    let dryRun = false;
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index];
        if (arg === '--level') level = safeInt(argv[++index], '--level', MIN_LEVEL, MAX_LEVEL);
        else if (arg === '--weeks') {
            weeks = String(argv[++index]).split(',').map((week) => safeInt(week, `--weeks "${week}"`, MIN_WEEK, MAX_WEEK));
        } else if (arg === '--version') version = safeInt(argv[++index], '--version', MIN_VERSION, MAX_VERSION);
        else if (arg === '--dry-run') dryRun = true;
        else if (arg === '--out') {
            out = argv[++index];
            if (!out || !path.isAbsolute(out)) throw new Error(`--out must be an absolute folder inside the print-ready Storytime folder, got "${String(out)}"`);
        } else throw new Error(`unknown argument: ${arg}`);
    }
    if (level === undefined) throw new Error('a --level value is required');
    if (!weeks?.length) throw new Error('a --weeks list is required');
    if (new Set(weeks).size !== weeks.length) throw new Error('the requested weeks contain a duplicate');
    const folder = storytimePrintReadyDir(home);
    let outDir: string;
    if (out) {
        const resolved = path.resolve(out);
        if (!resolved.startsWith(folder + path.sep)) {
            throw new Error(`--out must name a folder strictly inside ${folder}, got "${out}"`);
        }
        outDir = resolved;
    } else {
        outDir = defaultOutDir(home, version);
    }
    return { level, weeks, outDir, version, dryRun };
}

/**
 * The file names of one build (rule 12.2; Review C, C-P8-1). The stem carries the unit marker of
 * the student book and the teacher book, so a later unit kit cannot collide with this one.
 * @param level The Storytime level.
 * @param unit The unit of the kit; release 1 is unit 1 (spec P11).
 * @param version The version of the build.
 * @returns The three print files and the match report name.
 */
export function storytimeCardKitFileNames(level: number, unit: number, version: number): StorytimeCardKitFileNames {
    const stem = `Storytime-Advantage-L${level}-U${unit}-Card-Kit`;
    return {
        a5: `${stem}-A5-v${version}_PDFX-1a.pdf`,
        a6: `${stem}-A6-v${version}_PDFX-1a.pdf`,
        stickers: `${stem}-Stickers-v${version}_PDFX-1a.pdf`,
        match: 'card-picture-match.txt',
    };
}
