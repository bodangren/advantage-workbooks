import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { renderPagedPdf } from '../../lib/print/render';
import { STORYTIME_PRINT_PROFILE } from '../../lib/storytime/print/profile';
import { compileStorytimeReaders, storytimeReaderPictureFiles, type StorytimeReaderOptions } from '../../lib/storytime/print/readers';
import { checkRequestedWeeks, checkStorytimeOutputContainment } from '../../lib/storytime/print/student-book-cli';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import type { StorytimeWeek } from '../../lib/storytime/schema';

/**
 * The build of the Storytime readers (track storytime_print_r1_20261025, spec FR-5):
 *
 * - `--workbook`: the reader pages of the week imposed on A4 leaves for the student workbook, cut
 *   from the line art (FR-5.1, FR-9), as one PDF/X-1a print file;
 * - `--a3-color`: one reader page on each A3 portrait page (297 × 420 mm, the reader page scaled
 *   3.0), as an sRGB PDF for the office printer of the teacher. This file is not PDF/X and is not
 *   on the print order (FR-5.8).
 *
 * The reader page render is the same in both outputs. Run it under the heavy-job lock
 * (plan rule, advantage-pr 0e091de).
 */

/**
 * The make-pdfx.ts flags of the workbook reader file: the fonts stay, and the K-only opt-in
 * turns the document gray before the PDF/X-1a conversion, so that the black ink of the workbook
 * leaves prints on the K plate only (spec P2 "inside black only"). The color A3 PDF takes no
 * make-pdfx.ts step at all.
 */
export const STORYTIME_READERS_PDFX_FLAGS = ['--keep-fonts', '--k-only'] as const;

const USAGE = `Builds the Storytime Advantage readers of a week (spec FR-5): the reader pages in
system Chrome with Paged.js (from node_modules).

Usage: npx tsx scripts/storytime/make-readers-pdf.ts --level <n> --weeks <list> [--proof|--final] [--workbook|--a3-color] [--version <n>] [--out <folder>]

  --level      The Storytime level, a whole number from 1 to 4, e.g. 2
  --weeks      The weeks to include, each a whole number from 1 to 32, comma separated, e.g. 1;
               every requested week must load exactly once (checkRequestedWeeks)
  --proof      Proof mode: picture boxes print the placeholder (default)
  --final      Final mode: the build stops when a picture file is missing and names the picture id (FR-5.6)
  --workbook   The workbook leaves as one PDF/X-1a print file (default)
  --a3-color   The color A3 pages, one sRGB PDF for each reader (FR-5.8); no PDF/X conversion
  --version    The version in the file names, a whole number of 1 or more (rule 12.2; default 1)
  --out        The output folder, an absolute folder inside <home>/Desktop/print-ready/storytime/
               (default ~/Desktop/print-ready/storytime/readers-l<n>-w<weeks>-v<version>/)

Output files in the folder:
  workbook:  Storytime-Advantage-L<n>-Readers-W<weeks>-v<n>_PDFX-1a.pdf
  a3-color:  Storytime-Advantage-L<n>-W<ww>-<reader>-A3-v<n>.pdf  (one file for each reader)

Exit code 2 on an argument error, on --a3-color with --workbook, on an output folder that lies
outside the print folder, on an output path that is a symbolic link or resolves outside the print
folder on the filesystem, and on an output file that exists already (use a new --version).
Exit code 1 when a week does not parse, does not load exactly once, has no readers, a render
fails, or (final mode) a picture file of the requested readers is missing. The final build
checks every picture file before it makes the output folder and before Chrome.`;

interface Args {
    level: number;
    weeks: number[];
    mode: 'proof' | 'final';
    output: StorytimeReaderOptions['output'];
    version: number;
    folder: string;
}

/** Parses one whole-number flag value; throws on a value that is not a safe integer in range. */
function wholeNumber(value: string | undefined, name: string, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error(`${name} must be a whole number from ${min} to ${max}, got "${value}"`);
    return parsed;
}

/** The print-ready Storytime folder that holds the print files (spec P2). */
const printReadyDir = (home: string): string => path.join(home, 'Desktop', 'print-ready', 'storytime');

/** The default output folder of one build: one folder for each version and week list. */
function defaultFolder(home: string, level: number, weeks: number[], version: number): string {
    return path.join(printReadyDir(home), `readers-l${level}-w${weeks.join('-')}-v${version}`);
}

/** Parses the arguments; throws an argument error (exit code 2). */
function parseArgs(argv: string[], home: string): Args {
    let level: number | undefined;
    let weeks: number[] | undefined;
    let proof = false;
    let final = false;
    let workbook = false;
    let a3 = false;
    let version = 1;
    let out: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--level') level = wholeNumber(argv[++i], '--level', 1, 4);
        else if (arg === '--weeks') weeks = String(argv[++i] ?? '').split(',').map((week) => wholeNumber(week, `--weeks "${week}"`, 1, 32));
        else if (arg === '--proof') proof = true;
        else if (arg === '--final') final = true;
        else if (arg === '--workbook') workbook = true;
        else if (arg === '--a3-color') a3 = true;
        else if (arg === '--version') version = wholeNumber(argv[++i], '--version', 1, Number.MAX_SAFE_INTEGER);
        else if (arg === '--out') out = argv[++i];
        else throw new Error(`unknown argument: ${arg}`);
    }
    if (level === undefined) throw new Error('a --level value is required');
    if (!weeks?.length) throw new Error('a --weeks list is required');
    if (proof && final) throw new Error('use --proof or --final, not both');
    if (workbook && a3) throw new Error('use --workbook or --a3-color, not both');
    const folder = out === undefined ? defaultFolder(home, level, weeks, version) : path.resolve(out);
    const printReady = printReadyDir(home);
    if (folder !== printReady && !folder.startsWith(printReady + path.sep)) {
        throw new Error(`--out must be a folder inside ${printReady}, got "${folder}"`);
    }
    return { level, weeks, mode: final ? 'final' : 'proof', output: a3 ? 'a3-color' : 'workbook', version, folder };
}

/** The slug of a reader title for a file name (`Hello!` gives `hello`). */
const slugOf = (title: string): string => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'reader';

/** The workbook file name of a build (the version and the week list are in the name, rule 12.2). */
const workbookFileName = (level: number, weeks: number[], version: number): string =>
    `Storytime-Advantage-L${level}-Readers-W${weeks.map((week) => String(week).padStart(2, '0')).join('-')}-v${version}_PDFX-1a.pdf`;

/** The color A3 file name of one reader. */
const a3FileName = (level: number, week: number, title: string, version: number): string =>
    `Storytime-Advantage-L${level}-W${String(week).padStart(2, '0')}-${slugOf(title)}-A3-v${version}.pdf`;

/** Renders one reader HTML document to a Chrome PDF and returns the page count. */
async function renderHtml(html: string, pdf: string, tmp: string, pagedSrc: string): Promise<number> {
    const { chromium } = await import('@playwright/test');
    const htmlFile = path.join(tmp, `${path.basename(pdf, '.pdf')}.html`);
    fs.writeFileSync(htmlFile, html);
    const browser = await chromium.launch({ channel: 'chrome' });
    try {
        return await renderPagedPdf(browser, htmlFile, pdf, pagedSrc);
    } finally {
        await browser.close();
    }
}

async function main(argv: string[]): Promise<number> {
    if (argv.length === 0 || argv.some((a) => a === '--help' || a === '-h')) {
        console.log(USAGE);
        return argv.length === 0 ? 2 : 0;
    }
    let args: Args;
    try {
        args = parseArgs(argv, os.homedir());
    } catch (e) {
        console.error(`${e instanceof Error ? e.message : String(e)}\n\n${USAGE}`);
        return 2;
    }
    const { level, weeks, mode, output, version, folder } = args;
    const read = readLevelWeeks(STORYTIME_ROOT, level).filter((r) => weeks.includes((r.raw as { meta?: { week?: number } }).meta?.week ?? -1));
    checkRequestedWeeks(weeks, read.map((r) => (r.raw as { meta?: { week?: number } }).meta?.week ?? -1));
    const broken = read.filter((r) => !r.week);
    if (broken.length) {
        console.error(`Not parsed: ${broken.map((r) => `${r.file} (${r.error})`).join('; ')}`);
        return 1;
    }
    const parsed = (read.map((r) => r.week) as StorytimeWeek[]).sort((a, b) => a.meta.week - b.meta.week);
    const empty = parsed.filter((week) => !week.books.length);
    if (empty.length) {
        console.error(`No readers in weeks ${empty.map((week) => week.meta.week).join(', ')} (week 8 is the review week)`);
        return 1;
    }
    const outputs = output === 'workbook'
        ? [path.join(folder, workbookFileName(level, weeks, version))]
        : parsed.flatMap((week) => week.books.map((book) => path.join(folder, a3FileName(level, week.meta.week, book.title, version))));
    // The output files go through the shared containment check before any write or render: a
    // link, a dangling link, or a path outside the print folder stops the build with exit 2. An
    // existing file stops the build too, so that a build never replaces a print file (rule 12.2).
    try {
        for (const file of outputs) checkStorytimeOutputContainment(file, os.homedir());
    } catch (e) {
        console.error(`${e instanceof Error ? e.message : String(e)}`);
        return 2;
    }
    const existing = outputs.filter((file) => fs.lstatSync(file, { throwIfNoEntry: false }) !== undefined);
    if (existing.length) {
        console.error(`The output exists already; use a new --version (rule 12.2): ${existing.join('; ')}`);
        return 2;
    }
    // The final build checks every picture file of the requested readers before it writes anything
    // (FR-5.6, C-P4-2): a missing picture stops the build before Chrome, with no output folder and
    // no half-written file, so that a retry with the same --version stops on the same picture and
    // not on an "output exists" error (rule 12.2).
    if (mode === 'final') {
        const missing = storytimeReaderPictureFiles(parsed, { profile: STORYTIME_PRINT_PROFILE, mode, output })
            .filter((entry) => !fs.existsSync(entry.file));
        if (missing.length) {
            for (const entry of missing) console.error(`picture missing: ${entry.rowId} (${entry.fileName})`);
            return 1;
        }
    }
    fs.mkdirSync(folder, { recursive: true });
    const pagedSrc = fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'), 'utf8');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-readers-'));
    const written: string[] = [];
    try {
        if (output === 'workbook') {
            let index = 0;
            for (const pdf of outputs) {
                const html = compileStorytimeReaders(parsed, { profile: STORYTIME_PRINT_PROFILE, mode, output }).html;
                const pages = await renderHtml(html, path.join(tmp, `readers-workbook-${index++}-chrome.pdf`), tmp, pagedSrc);
                execFileSync(process.execPath, ['--import', 'tsx', 'scripts/print/make-pdfx.ts', path.join(tmp, `readers-workbook-${index - 1}-chrome.pdf`), '--out', pdf, ...STORYTIME_READERS_PDFX_FLAGS], { stdio: 'inherit' });
                written.push(`${pdf} (${pages} pages)`);
            }
        } else {
            let index = 0;
            for (const week of parsed) {
                for (const book of week.books) {
                    const pdf = outputs[index++];
                    const html = compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode, output, bookTitle: book.title }).html;
                    const pages = await renderHtml(html, pdf, tmp, pagedSrc);
                    written.push(`${pdf} (${pages} pages)`);
                }
            }
        }
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
    console.log(`done  Level ${level} (${mode}, ${output}, weeks ${weeks.join(', ')}): ${written.join('; ')}`);
    return 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
