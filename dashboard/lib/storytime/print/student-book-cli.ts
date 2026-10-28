import path from 'path';

/**
 * The pure CLI contract of the student workbook build (spec FR-3; Review B findings B-P2-03
 * and B-P2-04): argument validation and the requested-week check with no file access, so the
 * tests run them without rendering. `make-student-book-pdf.ts` passes its own arguments here
 * before it touches the week files.
 */

/** The validated arguments of one student book build. */
export interface StorytimeStudentBookArgs {
    /** The Storytime level. */
    level: number;
    /** The requested teaching weeks, each a safe integer in range. */
    weeks: number[];
    /** The build mode: `proof` prints the picture placeholders (default), `final` needs them. */
    mode: 'proof' | 'final';
    /** The version in the output file name. */
    version: number;
    /** The resolved output file, or undefined when the default path is used. */
    out?: string;
    /** The resolved output file: the explicit `--out`, else the default path for the unit. */
    outputPath: string;
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

/** The print-ready Storytime folder that holds every student book file (spec P2). */
const printReadyDir = (home: string): string => path.join(home, 'Desktop', 'print-ready', 'storytime');

/**
 * Parses and validates the one `number` value of a flag line.
 * @param value The raw flag value.
 * @param name The flag name for the error.
 * @param min The same lower end as the accepted whole values.
 * @param max The accepted upper end.
 * @returns The value as a safe integer in range.
 */
function safeInt(value: string, name: string, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${name} must be a whole number from ${min} to ${max}, got "${value}"`);
    }
    return parsed;
}

/**
 * Builds the default output file name of a student book (P11: release 1 is unit 1 only).
 * @param home The user home folder.
 * @param level The validated level.
 * @param unit The unit from the loaded week data (release 1: pass 1).
 * @param version The validated version.
 * @returns The absolute path of the default PDF/X file.
 */
function defaultOutputPath(home: string, level: number, unit: number, version: number): string {
    return path.join(printReadyDir(home),
        `Storytime-Advantage-L${level}-U${unit}-Student-Book-v${version}_PDFX-1a.pdf`);
}

/**
 * Parses the arguments of `make-student-book-pdf.ts` with no file access (B-P2-03). Each level,
 * week, and version value must parse to a safe integer in range, `--proof` and `--final` are
 * exclusive, and an explicit `--out` must resolve inside the print-ready Storytime folder of
 * `home` (B-P2-04); a `~` form or a `..` escape stops the build.
 * @param argv The CLI arguments, without the node command.
 * @param home The user home folder that resolves the default output path.
 * @param unit The unit from the loaded week data; release 1 knows unit 1 (spec P11).
 * @returns The validated arguments.
 */
export function parseStorytimeStudentBookArgs(argv: string[], home: string, unit: number): StorytimeStudentBookArgs {
    let level: number | undefined;
    let weeks: number[] | undefined;
    let proof = false;
    let final = false;
    let version = 1;
    let out: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--level') level = safeInt(argv[++i], '--level', MIN_LEVEL, MAX_LEVEL);
        else if (arg === '--weeks') {
            weeks = String(argv[++i]).split(',').map((week) => safeInt(week, `--weeks "${week}"`, MIN_WEEK, MAX_WEEK));
        } else if (arg === '--proof') proof = true;
        else if (arg === '--final') final = true;
        else if (arg === '--version') version = safeInt(argv[++i], '--version', MIN_VERSION, MAX_VERSION);
        else if (arg === '--out') {
            out = argv[++i];
            if (!path.isAbsolute(out)) throw new Error(`--out must be an absolute path inside ${printReadyDir(home)}, got "${out}"`);
        } else throw new Error(`unknown argument: ${arg}`);
    }
    if (level === undefined) throw new Error('a --level value is required');
    if (!weeks?.length) throw new Error('a --weeks list is required');
    if (proof && final) throw new Error('use --proof or --final, not both');
    const folder = printReadyDir(home);
    let outputPath: string;
    if (out) {
        const resolved = path.resolve(out);
        if (resolved !== folder && !resolved.startsWith(folder + path.sep)) {
            throw new Error(`--out must stay inside ${folder}, got "${out}"`);
        }
        outputPath = resolved;
    } else {
        outputPath = defaultOutputPath(home, level, unit, version);
    }
    const mode: 'proof' | 'final' = final ? 'final' : 'proof';
    return { level, weeks, mode, version, out, outputPath };
}

/**
 * Checks that every requested week is in the loaded week list exactly once (B-P2-03).
 * @param requested The requested week numbers, as the parser returned them.
 * @param loaded The week numbers that the level folder loaded with the shape the build needs.
 */
export function checkRequestedWeeks(requested: number[], loaded: number[]): void {
    for (const week of new Set(requested)) {
        if (!Number.isSafeInteger(week) || week < MIN_WEEK || week > MAX_WEEK) {
            throw new Error(`requested week ${week} is not a whole number from ${MIN_WEEK} to ${MAX_WEEK}`);
        }
    }
    if (new Set(requested).size !== requested.length) throw new Error('the requested weeks contain a duplicate');
    for (const week of requested) {
        const found = loaded.filter((loadedWeek) => loadedWeek === week).length;
        if (found !== 1) {
            throw new Error(`requested week ${week} is not loaded exactly once (loaded ${found} of the level)`);
        }
    }
}
