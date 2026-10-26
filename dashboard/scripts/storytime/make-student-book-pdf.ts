import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { chromium } from '@playwright/test';
import { renderPagedPdf } from '../../lib/print/render';
import { STORYTIME_PRINT_PROFILE } from '../../lib/storytime/print/profile';
import { compileStorytimeStudentBook } from '../../lib/storytime/print/student-book';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import type { StorytimeWeek } from '../../lib/storytime/schema';

/**
 * The make-pdfx.ts flags of the student workbook build: the fonts stay, and the K-only
 * opt-in turns the document gray before the PDF/X-1a conversion, so that the black ink of
 * the inside pages prints on the K plate only (spec P2 "inside black only"; inkcov gives
 * C=M=Y=0.00000). The Primary print files do not pass this flag.
 */
export const STORYTIME_STUDENT_PDFX_FLAGS = ['--keep-fonts', '--k-only'] as const;

const USAGE = `Builds the PDF/X-1a print file of the Storytime Advantage student workbook (spec FR-3):
the HTML template in system Chrome with Paged.js (from node_modules), then make-pdfx.ts
(--keep-fonts) to PDF/X-1a. Run it under the heavy-job lock (plan rule, advantage-pr 0e091de).

Usage: npx tsx scripts/storytime/make-student-book-pdf.ts --level <n> --weeks <list> [--proof|--final] [--version <n>] [--out <file.pdf>]

  --level     The Storytime level, e.g. 2
  --weeks     The teaching weeks to include, comma separated, e.g. 1
  --proof     Proof mode: picture boxes print the placeholder (default)
  --final     Final mode: the build stops when a picture file is missing and names the picture id (FR-5.6)
  --version   The version in the file name (rule 12.2; default 1)
  --out       Output file (default ~/Desktop/print-ready/storytime/Storytime-Advantage-L<n>-U<u>-Student-Book-v<n>_PDFX-1a.pdf)

Exit code 1 when a week does not parse, a review week is included, or the PDF/X checks fail.`;

async function main(argv: string[]): Promise<number> {
    let level: number | undefined;
    let weeks: number[] | undefined;
    let mode: 'proof' | 'final' = 'proof';
    let version = 1;
    let out: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--level') level = Number(argv[++i]);
        else if (a === '--weeks') weeks = String(argv[++i]).split(',').map(Number);
        else if (a === '--proof') mode = 'proof';
        else if (a === '--final') mode = 'final';
        else if (a === '--version') version = Number(argv[++i]);
        else if (a === '--out') out = path.resolve(argv[++i]);
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    if (level === undefined || !weeks?.length || weeks.some((w) => !(w >= 1 && w <= 32)) || !(version >= 1)) {
        console.error(USAGE);
        return 2;
    }
    const read = readLevelWeeks(STORYTIME_ROOT, level).filter((r) => {
        const meta = (r.raw as { meta?: { week?: number } }).meta;
        return weeks!.includes(meta?.week ?? -1);
    });
    const broken = read.filter((r) => !r.week);
    if (broken.length) {
        console.error(`Not parsed: ${broken.map((r) => `${r.file} (${r.error})`).join('; ')}`);
        return 1;
    }
    const parsed = read.map((r) => r.week!) as StorytimeWeek[];
    const review = parsed.filter((w) => w.meta.kind === 'review');
    if (review.length) {
        console.error(`Review weeks are not student-book pages yet: ${review.map((w) => w.meta.week).join(', ')}`);
        return 1;
    }
    const result = compileStorytimeStudentBook(parsed, { profile: STORYTIME_PRINT_PROFILE, mode });
    const unit = parsed[0].meta.unit;
    out ??= path.join(os.homedir(), 'Desktop', 'print-ready', 'storytime', `Storytime-Advantage-L${level}-U${unit}-Student-Book-v${version}_PDFX-1a.pdf`);

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-student-'));
    const htmlFile = path.join(tmp, 'student-book.html');
    const chromeFile = path.join(tmp, 'student-book-chrome.pdf');
    fs.writeFileSync(htmlFile, result.html);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const pagedSrc = fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'), 'utf8');
    const browser = await chromium.launch({ channel: 'chrome' });
    let pages: number;
    try {
        pages = await renderPagedPdf(browser, htmlFile, chromeFile, pagedSrc);
    } finally {
        await browser.close();
    }
    execFileSync(process.execPath, ['--import', 'tsx', 'scripts/print/make-pdfx.ts', chromeFile, '--out', out, ...STORYTIME_STUDENT_PDFX_FLAGS], { stdio: 'inherit' });
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`done  Level ${level} unit ${unit} (${mode}, weeks ${weeks.join(', ')}): ${out} (${pages} pages)`);
    return 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
