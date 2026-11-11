/**
 * Makes the 4 print-check mutants of Task 2.9 part 8 and runs the matching check on each one
 * (track storytime_cover_options_20261106, test strategy section 4.10).
 *
 * The mutants run on copies in `/tmp/opencode/c29h/` only. The script never writes the hand-off
 * folder. It makes each mutant file, prints it with Chrome, makes its PDF/X with
 * `scripts/print/make-pdfx.ts`, and calls `print_gate_final.py --single` for the check.
 *
 *   M1  check 5: the student front with the option round art (Q-front-a2.jpg) as its art; the art
 *       is 1448 x 2048 px, so the A4 page holds it under 299 ppi. Expect FAIL.
 *   M2  check 6: the teacher back with the first Thai tone mark (U+0E48 to U+0E4B) removed from
 *       the HTML in memory. Expect FAIL.
 *   M3  check 7: a PDF/X of the leaf Chrome PDF made without `--k-only`. Expect FAIL (rich black).
 *   M4  check 4 and PRINT_GATE: one A3 reader page with `opacity:0.99` on the page body. The
 *       Chromium PDF flattens the page to one image. The make-pdfx conversion check, with the
 *       source PDF, passes the page (F12: a page that already is one page-size image is excused).
 *       Check 4 fails, because the title text is gone.
 *
 * The check rule lives in one place: `print_gate_final.py --single <check> <file> [extra]`. The
 * script prints one `MUTANT_<n>` line per mutant and the line `MUTANTS_CAUGHT=<n>`, and it writes
 * the same lines to `measure/runs/storytime_cover_options_20261106/print-mutants-2-9h.txt`.
 *
 * Usage (from the dashboard folder): npx tsx ../measure/runs/storytime_cover_options_20261106/print-mutants-2-9h.ts
 *
 * It launches Chrome with a 30 s launch timeout and closes it in a `finally` block. It prints
 * counts, sizes, exit codes, and SHA-256 values only; it prints no Thai text and no page text.
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

import { loadQuestCovers, questReaders, renderQuestCover } from '../../../dashboard/lib/storytime/print/cover-quest';

const RUNS = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(RUNS, '..', '..', '..');
const DASHBOARD = path.join(REPO, 'dashboard');
const SCRIPT = path.join(RUNS, 'print_gate_final.py');
const OUT_TXT = path.join(RUNS, 'print-mutants-2-9h.txt');
const SCRATCH = '/tmp/opencode/c29h';
const ART_DIR = path.join(osHome(), 'Desktop/print-ready/storytime/covers-quest-art-v1');
const HANDOFF = path.join(osHome(), 'Desktop/print-ready/storytime/covers-quest-v1');
const PICTURES = path.join(REPO, 'content/storytime/l2/print/pictures');
const MAKE_PDFX = path.join(DASHBOARD, 'scripts/print/make-pdfx.ts');
const CHROME_TIMEOUT_MS = 30000;
const THAI_TONE = /[\u0E48-\u0E4B]/;

// The script sits outside the dashboard folder, so Node reads `@playwright/test` from the
// dashboard package folder.
const dashboardRequire = createRequire(path.join(DASHBOARD, 'package.json'));
const { chromium } = dashboardRequire('@playwright/test') as typeof import('@playwright/test');
type Browser = Awaited<ReturnType<typeof chromium.launch>>;

/** The home folder of the user. */
function osHome(): string {
    return process.env.HOME ?? '/home/daniebo';
}

/** The absolute path of one scratch file. */
function scratch(...parts: string[]): string {
    return path.join(SCRATCH, ...parts);
}

/** Writes one text file in the scratch folder. */
function writeText(file: string, text: string): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
}

/** Writes one HTML file and returns its file URL. */
function writeDoc(file: string, html: string): string {
    writeText(file, html);
    return pathToFileURL(file).href;
}

/** Prints one HTML file to a Chrome PDF. */
async function printPdf(browser: Browser, url: string, file: string): Promise<void> {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'load', timeout: 120000 });
        await page.evaluate('document.fonts.ready');
        await page.emulateMedia({ media: 'print' });
        await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
    } finally {
        await page.close();
    }
}

/** Runs the PDF/X step and returns the exit code and the output. */
function makePdfx(input: string, output: string): { code: number; output: string } {
    const done = spawnSync(
        process.execPath,
        ['--import', 'tsx', MAKE_PDFX, input, '--out', output, '--keep-fonts'],
        { cwd: DASHBOARD, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    return { code: done.status ?? 1, output: `${done.stdout ?? ''}${done.stderr ?? ''}` };
}

/** Runs one single check and returns the exit code and the printed line. */
function singleCheck(args: string[]): { code: number; line: string; verdict: 'PASS' | 'FAIL' } {
    const done = spawnSync('python3', ['-I', '-B', SCRIPT, '--single', ...args],
        { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const line = (done.stdout ?? '').split('\n').find((item) => item.startsWith('SINGLE_')) ?? 'SINGLE_ERROR no_line';
    return { code: done.status ?? 1, line, verdict: done.status === 0 ? 'PASS' : 'FAIL' };
}

/** Returns the pages, the PDF version, and the PDF/X marker of one make-pdfx report line. */
function pdfxValues(output: string): { pages: number; version: string; marker: string; allPass: number } {
    const found = output.match(/:\s+(\d+) pages,\s+([\d.]+) MB,\s+PDF ([\d.]+),\s+(PDF\/X-1a:\d+|no PDF\/X marker)/);
    return {
        pages: found ? Number(found[1]) : 0,
        version: found ? found[3] : 'none',
        marker: found ? found[4] : 'none',
        allPass: (output.match(/All checks pass\./g) ?? []).length,
    };
}

/** Returns a short value text from one single-check line: the part after the first colon. */
function values(line: string): string {
    const index = line.indexOf(': ');
    return index === -1 ? line : line.slice(index + 2);
}

async function main(): Promise<number> {
    fs.rmSync(SCRATCH, { recursive: true, force: true });
    fs.mkdirSync(SCRATCH, { recursive: true });
    const lines: string[] = [
        'PRINT CHECK MUTANTS - Task 2.9 part 8 (track storytime_cover_options_20261106)',
        'DATE 2026-11-11',
        'ROLE jr-green, model deepseek/deepseek-flash#high, role base e907d44d',
        'D-4: the mutants ran by one committed script with Chrome in one heavy-run with a 900 s limit (orchestrator decision 2026-11-11).',
        'SCOPE copies in /tmp/opencode/c29h only; the hand-off folder is read only.',
        '',
    ];
    const caught: boolean[] = [false, false, false, false];
    const book = loadQuestCovers().books.find((row) => row.level === 2 && row.unit === 1);
    if (!book) {
        lines.push('MUTANT_ERROR no book row of Level 2 Unit 1');
        fs.writeFileSync(OUT_TXT, `${lines.join('\n')}\n`);
        console.log(lines.join('\n'));
        return 1;
    }
    const readers = questReaders();
    const browser = await chromium.launch({ channel: 'chrome', timeout: CHROME_TIMEOUT_MS });
    try {
        // M1: the student front with the option round art. Check 5 must fail (under 299 ppi).
        const m1Html = renderQuestCover(
            'student-front',
            book,
            { art: pathToFileURL(path.join(ART_DIR, 'Q-front-a2.jpg')).href },
            { bleedMm: 0, top: 'hlogo' },
        );
        const m1Pdf = scratch('m1', 'student-front.pdf');
        await printPdf(browser, writeDoc(scratch('m1', 'student-front.html'), m1Html), m1Pdf);
        const m1Pdfx = scratch('m1', 'student-front_PDFX-1a.pdf');
        const m1Convert = makePdfx(m1Pdf, m1Pdfx);
        const m1Check = singleCheck(['5', m1Pdfx]);
        caught[0] = m1Check.verdict === 'FAIL';
        lines.push(
            `MUTANT_1: check 5 ${m1Check.verdict} (expected FAIL), ${values(m1Check.line)}; `
            + `pdfx_exit=${m1Convert.code} pdfx=${pdfxValues(m1Convert.output).marker}`,
        );

        // M2: the teacher back with the first Thai tone mark removed. Check 6 must fail.
        const m2Html = renderQuestCover(
            'teacher-back',
            book,
            { art: pathToFileURL(path.join(PICTURES, book.art.back)).href },
            { bleedMm: 0, top: 'hlogo' },
        );
        const m2Stripped = m2Html.replace(THAI_TONE, '');
        const m2Changed = m2Stripped.length === m2Html.length - 1;
        const m2Pdf = scratch('m2', 'teacher-back.pdf');
        await printPdf(browser, writeDoc(scratch('m2', 'teacher-back.html'), m2Stripped), m2Pdf);
        const m2Check = singleCheck(['6', m2Pdf, 'back']);
        caught[1] = m2Changed && m2Check.verdict === 'FAIL';
        lines.push(
            `MUTANT_2: check 6 ${m2Check.verdict} (expected FAIL), ${values(m2Check.line)}; `
            + `html_tone_removed=${m2Changed}`,
        );

        // M3: a leaf PDF/X made without --k-only. Check 7 must fail (rich black).
        const m3Input = scratch('m3', 'reader-leaf-covers.pdf');
        fs.mkdirSync(path.dirname(m3Input), { recursive: true });
        fs.copyFileSync(path.join(HANDOFF, 'readers-leaf', 'reader-leaf-covers.pdf'), m3Input);
        const m3Pdfx = scratch('m3', 'reader-leaf-covers_PDFX-1a.pdf');
        const m3Convert = spawnSync(
            process.execPath,
            ['--import', 'tsx', MAKE_PDFX, m3Input, '--out', m3Pdfx, '--keep-fonts'],
            { cwd: DASHBOARD, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
        );
        const m3Check = singleCheck(['7', m3Pdfx]);
        caught[2] = (m3Convert.status ?? 1) === 0 && m3Check.verdict === 'FAIL';
        lines.push(
            `MUTANT_3: check 7 ${m3Check.verdict} (expected FAIL), ${values(m3Check.line)}; `
            + `pdfx_exit=${m3Convert.status ?? 1} k_only=no`,
        );

        // M4: one A3 reader page with opacity 0.99. Check 4 must fail, and PRINT_GATE (the
        // make-pdfx conversion check, with the source PDF) must pass: the F12 proof.
        const reader = readers[0];
        const readerTitle = reader.title.replace(/[\u0E00-\u0E7F]/g, '');
        const m4Html = renderQuestCover(
            'reader-a3',
            reader,
            { art: pathToFileURL(path.join(PICTURES, reader.picture.fileName)).href },
            { bleedMm: 0, top: 'hlogo' },
        );
        const m4Opaque = m4Html.replace('class="quest-page"', 'class="quest-page" style="opacity:0.99"');
        const m4Injected = m4Opaque !== m4Html;
        const m4Pdf = scratch('m4', 'reader-a3.pdf');
        await printPdf(browser, writeDoc(scratch('m4', 'reader-a3.html'), m4Opaque), m4Pdf);
        const m4Pdfx = scratch('m4', 'reader-a3_PDFX-1a.pdf');
        const m4Convert = makePdfx(m4Pdf, m4Pdfx);
        const m4Values = pdfxValues(m4Convert.output);
        const m4GatePass = m4Convert.code === 0 && m4Values.allPass >= 1;
        const m4Check = singleCheck(['4', m4Pdfx, readerTitle]);
        const m4Standalone = singleCheck(['gate', m4Pdfx]);
        caught[3] = m4Injected && m4GatePass && m4Check.verdict === 'FAIL';
        lines.push(
            `MUTANT_4: check 4 ${m4Check.verdict} (expected FAIL), ${values(m4Check.line)}; `
            + `PRINT_GATE ${m4GatePass ? 'PASS' : 'FAIL'} `
            + `(the make-pdfx conversion check with the source PDF: exit=${m4Convert.code}, `
            + `"All checks pass." count=${m4Values.allPass}, pages=${m4Values.pages}, `
            + `pdf=${m4Values.version}, pdfx=${m4Values.marker}); `
            + `PRINT_GATE_STANDALONE ${m4Standalone.verdict} (information: the stand-alone --check `
            + `has no source PDF, so F12 needs the conversion check); opacity_injected=${m4Injected}`,
        );
    } finally {
        await browser.close();
    }
    const caughtCount = caught.filter(Boolean).length;
    lines.push('');
    lines.push(`MUTANTS_CAUGHT=${caughtCount}`);
    const text = `${lines.join('\n')}\n`;
    fs.writeFileSync(OUT_TXT, text);
    console.log(text.trimEnd());
    return caughtCount === 4 ? 0 : 1;
}

main().then(
    (code) => {
        process.exitCode = code;
    },
    (error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    },
);
