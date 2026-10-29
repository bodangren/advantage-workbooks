import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { parsePdffonts, parsePdfinfo } from '../../lib/print/pdfx';
import { renderPagedPdf, run } from '../../lib/print/render';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import { checkRequestedWeeks, checkStorytimeOutputContainment } from '../../lib/storytime/print/student-book-cli';
import { diffPrintText, teacherBookPrintFileName, type PrintTextDifference } from '../../lib/storytime/print/text-diff';
import type { StorytimeWeek } from '../../lib/storytime/schema';

/**
 * The build of the Thai teacher-book print file (track storytime_print_r1_20261025, spec FR-4):
 * the existing template (`compileStorytimeManual`, A4) in system Chrome with Paged.js, the text
 * gate of each week against its approved draft, and `make-pdfx.ts --keep-fonts` to PDF/X-1a.
 * Run it under the heavy-job lock (plan rule, advantage-pr 0e091de).
 *
 * The text gate reads the Chrome PDF, never the PDF/X file, because `pdftotext` drops Thai tone
 * marks in a PDF/X file (lessons-learned, 2026-10-02). A text difference does not stop the
 * build: the build writes every file and the report, lists each difference with its week and
 * line for Daniel (spec FR-4.2, AC-3), and exits 1, so that no unapproved file passes as clean.
 */

const USAGE = `Builds the PDF/X-1a print file of the Thai Storytime Advantage teacher book (spec FR-4):
compileStorytimeManual (A4) in system Chrome with Paged.js (from node_modules), the text gate
of each week against its approved draft, then make-pdfx.ts --keep-fonts. Run it under the
heavy-job lock.

Usage: npx tsx scripts/storytime/make-teacher-book-print.ts --level <n> --weeks <list> --lang th [--out <folder>] [--version <n>]

  --level     The Storytime level, a whole number from 1 to 4, e.g. 2
  --weeks     The weeks of the book, each a whole number from 1 to 32, comma separated, e.g. 1
  --lang      The book language: th only (spec P6; en exits 2)
  --out       The output folder, an absolute path inside <home>/Desktop/print-ready/storytime/
              (default: that folder)
  --version   The version in the file name, a whole number of 1 or more (rule 12.2; default 1)
  --drafts    The folder of the approved drafts (default ~/Desktop/primary-parity-progress/storytime/)

Output files in the folder:
  Storytime-Advantage-L<n>-U<u>-Teachers-Book-TH-v<n>_PDFX-1a.pdf   the print file
  Storytime-Advantage-L<n>-U<u>-Teachers-Book-TH-v<n>-chrome.pdf    the Chrome PDF (text gate source)
  text-gate-v<n>.txt                                                the text gate report

The text gate: for each week, the pdftotext -layout text of the Chrome PDF of that week (the
build Chrome PDF when the book has one week) against Storytime-L<n>-W<NN>-Teachers-Book-TH-draft.pdf.
Page-number lines ("หน้า 2") are not compared. Each difference is listed with the week and the
draft line. A difference does not stop the build; the files and the report are written.

Exit code 0 when every file is written, the text gate gives 0 differences, and the PDF/X
checks pass. Exit code 1 when a week does not parse, a draft is missing, a page is not A4, a
font is not embedded or is Type 3, the copy rule fails (CEFR, Pre-A1, Starters, Reading A-Z),
the PDF/X checks fail, or the text gate gives a difference. Exit code 2 on an argument error,
on --lang en, or when the print file exists already (use a new --version).`;

/** A4 in PDF points, with the slack of make-manual-pdf.ts. */
const A4 = { width: 595.28, height: 841.89, slack: 2 };

/** The copy rule of spec AC-6; the step ids A1 to E6 are not CEFR levels, so a bare "A1" is allowed. */
const COPY_RULE = /\bCEFR\b|\bPre[\s\-‐‑]?A1\b|\bStarters\b|\bReading\s+A[\s\-‐‑]?Z\b/i;

interface Args {
    level: number;
    weeks: number[];
    version: number;
    folder: string;
    drafts: string;
}

/** Parses one whole-number flag value; throws on a value that is not a safe integer in range. */
function wholeNumber(value: string | undefined, name: string, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error(`${name} must be a whole number from ${min} to ${max}, got "${value}"`);
    return parsed;
}

/** Parses the arguments; throws an argument error (exit code 2). */
function parseArgs(argv: string[], home: string): Args {
    const printReady = path.join(home, 'Desktop', 'print-ready', 'storytime');
    let level: number | undefined;
    let weeks: number[] | undefined;
    let lang: string | undefined;
    let version = 1;
    let folder = printReady;
    let drafts = path.join(home, 'Desktop', 'primary-parity-progress', 'storytime');
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--level') level = wholeNumber(argv[++i], '--level', 1, 4);
        else if (a === '--weeks') weeks = String(argv[++i]).split(',').map((w) => wholeNumber(w, '--weeks', 1, 32));
        else if (a === '--lang') lang = argv[++i];
        else if (a === '--version') version = wholeNumber(argv[++i], '--version', 1, Number.MAX_SAFE_INTEGER);
        else if (a === '--out') folder = path.resolve(argv[++i] ?? '');
        else if (a === '--drafts') drafts = path.resolve(argv[++i] ?? '');
        else throw new Error(`unknown argument: ${a}`);
    }
    if (level === undefined) throw new Error('a --level value is required');
    if (!weeks?.length) throw new Error('a --weeks list is required');
    if (lang !== 'th') throw new Error(`the teacher book is Thai only (spec P6): --lang must be th, got "${lang ?? ''}"`);
    if (folder !== printReady && !folder.startsWith(printReady + path.sep)) throw new Error(`--out must be a folder inside ${printReady}, got "${folder}"`);
    return { level, weeks, version, folder, drafts };
}

/** The `pdftotext -layout` text of a PDF file. */
function layoutText(pdf: string): string {
    return run('pdftotext', ['-layout', pdf, '-']);
}

/**
 * Renders one teacher-book HTML document to a Chrome PDF and returns the page count. The
 * template and the browser load here, not at the top, so that `--help` answers fast.
 */
async function renderChromePdf(weeks: StorytimeWeek[], pdf: string, tmp: string, pagedSrc: string): Promise<number> {
    const { chromium } = await import('@playwright/test');
    const { compileStorytimeManual } = await import('../../lib/storytime/manual');
    const htmlFile = path.join(tmp, `${path.basename(pdf, '.pdf')}.html`);
    const html = compileStorytimeManual(weeks, { lang: 'th', paper: 'a4' }).html;
    fs.writeFileSync(htmlFile, html.replace(/<script src="https:\/\/unpkg[^>]*><\/script>/, ''));
    const browser = await chromium.launch({ channel: 'chrome' });
    try {
        return await renderPagedPdf(browser, htmlFile, pdf, pagedSrc);
    } finally {
        await browser.close();
    }
}

/** The page, font, and copy-rule problems of the Chrome PDF. */
function chromeProblems(pdf: string, text: string): string[] {
    const problems: string[] = [];
    const info = parsePdfinfo(run('pdfinfo', [pdf]));
    const sizes = [...run('pdfinfo', ['-f', '1', '-l', String(info.pages), pdf]).matchAll(/^Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+)/gm)];
    const notA4 = sizes.filter((m) => Math.abs(Number(m[2]) - A4.width) > A4.slack || Math.abs(Number(m[3]) - A4.height) > A4.slack);
    if (notA4.length) problems.push(`${notA4.length} pages are not A4`);
    const fonts = parsePdffonts(run('pdffonts', [pdf]));
    if (fonts.some((f) => f.type === 'Type 3')) problems.push('Type 3 font');
    if (fonts.some((f) => !f.embedded)) problems.push('a font is not embedded');
    const copy = text.split('\n').filter((line) => COPY_RULE.test(line));
    if (copy.length) problems.push(`copy rule (AC-6): ${copy.map((line) => `"${line.trim()}"`).join('; ')}`);
    return problems;
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
    const { level, weeks, version, folder, drafts } = args;
    const read = readLevelWeeks(STORYTIME_ROOT, level).filter((r) => weeks.includes((r.raw as { meta?: { week?: number } }).meta?.week ?? -1));
    checkRequestedWeeks(weeks, read.map((r) => (r.raw as { meta?: { week?: number } }).meta?.week ?? -1));
    const broken = read.filter((r) => !r.week);
    if (broken.length) {
        console.error(`Not parsed: ${broken.map((r) => `${r.file} (${r.error})`).join('; ')}`);
        return 1;
    }
    const parsed = (read.map((r) => r.week) as StorytimeWeek[]).sort((a, b) => a.meta.week - b.meta.week);
    const units = [...new Set(parsed.map((w) => w.meta.unit))];
    if (units.length !== 1) {
        console.error(`A teacher-book print file holds one unit; these weeks are of units ${units.join(', ')}`);
        return 1;
    }
    const draftOf = (week: number) => path.join(drafts, `Storytime-L${level}-W${String(week).padStart(2, '0')}-Teachers-Book-TH-draft.pdf`);
    const missing = weeks.map(draftOf).filter((file) => !fs.existsSync(file));
    if (missing.length) {
        console.error(`No approved draft: ${missing.join('; ')}`);
        return 1;
    }

    const printFile = path.join(folder, teacherBookPrintFileName(level, units[0], 'th', version));
    const chromeFile = printFile.replace(/_PDFX-1a\.pdf$/, '-chrome.pdf');
    const reportFile = path.join(folder, `text-gate-v${version}.txt`);
    const existing = [printFile, chromeFile, reportFile].filter((file) => fs.existsSync(file));
    if (existing.length) {
        console.error(`The output exists already; use a new --version (rule 12.2): ${existing.join('; ')}`);
        return 2;
    }
    checkStorytimeOutputContainment(printFile, os.homedir());
    fs.mkdirSync(folder, { recursive: true });

    const pagedSrc = fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'), 'utf8');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-teacher-'));
    const report: string[] = [];
    let differenceCount = 0;
    let problems: string[];
    let pages: number;
    try {
        pages = await renderChromePdf(parsed, chromeFile, tmp, pagedSrc);
        problems = chromeProblems(chromeFile, layoutText(chromeFile));
        // The text gate of each week reads a Chrome PDF of that week only, as the draft holds one week.
        for (const week of parsed) {
            const n = week.meta.week;
            const weekPdf = parsed.length === 1 ? chromeFile : path.join(tmp, `week-${n}.pdf`);
            if (parsed.length > 1) await renderChromePdf([week], weekPdf, tmp, pagedSrc);
            const differences: PrintTextDifference[] = diffPrintText(layoutText(draftOf(n)), layoutText(weekPdf));
            differenceCount += differences.length;
            report.push(`week ${n}: ${differences.length} difference(s) against ${draftOf(n)}`);
            for (const d of differences) report.push(`  week ${n} line ${d.line}: expected "${d.expected}" actual "${d.actual}"`);
        }
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
    fs.writeFileSync(reportFile, `${report.join('\n')}\n`);
    console.log(report.join('\n'));

    try {
        execFileSync(process.execPath, ['--import', 'tsx', 'scripts/print/make-pdfx.ts', chromeFile, '--out', printFile, '--keep-fonts'], { stdio: 'inherit' });
    } catch {
        problems.push('the PDF/X conversion or its checks failed');
    }
    if (differenceCount) problems.push(`the text gate gives ${differenceCount} difference(s); each needs Daniel's approval (AC-3): ${reportFile}`);
    console.log(`${problems.length ? 'FAIL' : 'done'}  Level ${level} unit ${units[0]} (th, weeks ${weeks.join(', ')}): ${printFile} (${pages} pages)${problems.length ? `; ${problems.join('; ')}` : ''}`);
    return problems.length ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
