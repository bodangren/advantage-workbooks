import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { STORYTIME_ROOT, storytimeWeekFile } from '../../lib/storytime/files';
import { StorytimeWeekSchema } from '../../lib/storytime/schema';
import { checkStorytimeCoverCopy } from '../../lib/storytime/print/covers';
import { STORYTIME_PRINT_PROFILE } from '../../lib/storytime/print/profile';
import { compileReaderHowto } from '../../lib/storytime/print/reader-howto';
import { storytimeReaderLeafSides } from '../../lib/storytime/print/readers';

/**
 * The build of the teacher how-to "How to make a student book" (A-47): two A4 portrait sheets,
 * black and white, as a plain office-print PDF made by Chrome (not PDF/X). The diagrams read the
 * leaf sides of the first reader of the given week. Run it under the heavy-job lock.
 */

const USAGE = `Makes the PDF of the how-to "How to make a student book" (Storytime Advantage, A-47).

Usage: npx tsx scripts/storytime/make-reader-howto-pdf.ts --out <file.pdf> [--level <n>] [--week <n>]

  --out     The output file, an absolute path inside <home>/Desktop/handoff/ or /tmp/opencode/
  --level   The Storytime level that holds the example reader (default 2)
  --week    The week of the example reader (default 1)

Exit code 2 on an argument error or an output file that exists already. Exit code 1 when the copy
check fails, a sheet overflows, a print face does not load, or the page count is not 2.`;

/** The folders that may hold the output. */
const outputRoots = (home: string): string[] => [path.join(home, 'Desktop', 'handoff') + path.sep, '/tmp/opencode/'];

/** Parses the arguments; throws an argument error (exit code 2). */
function parseArgs(argv: string[], home: string): { out: string; level: number; week: number } {
    let out: string | undefined;
    let level = 2;
    let week = 1;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--out') out = argv[++i];
        else if (arg === '--level') level = Number(argv[++i]);
        else if (arg === '--week') week = Number(argv[++i]);
        else throw new Error(`unknown argument: ${arg}`);
    }
    if (!out || !path.isAbsolute(out)) throw new Error('--out must be an absolute file path');
    if (!outputRoots(home).some((root) => out.startsWith(root))) throw new Error(`--out must be inside ${outputRoots(home).join(' or ')}`);
    if (!Number.isSafeInteger(level) || level < 1 || level > 4) throw new Error('--level must be a whole number from 1 to 4');
    if (!Number.isSafeInteger(week) || week < 1 || week > 32) throw new Error('--week must be a whole number from 1 to 32');
    if (fs.existsSync(out)) throw new Error(`the output exists already: ${out}`);
    return { out, level, week };
}

async function main(argv: string[]): Promise<number> {
    if (argv.length === 0 || argv.some((a) => a === '--help' || a === '-h')) {
        console.log(USAGE);
        return argv.length === 0 ? 2 : 0;
    }
    let args: { out: string; level: number; week: number };
    try {
        args = parseArgs(argv, os.homedir());
    } catch (e) {
        console.error(`${e instanceof Error ? e.message : String(e)}\n\n${USAGE}`);
        return 2;
    }
    const week = StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, args.level, args.week), 'utf8')));
    if (!week.books.length) {
        console.error(`week ${args.week} has no readers`);
        return 1;
    }
    const sides = storytimeReaderLeafSides(week, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook', bookTitle: week.books[0].title });
    const { html } = compileReaderHowto(sides, STORYTIME_PRINT_PROFILE);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-howto-'));
    try {
        const htmlFile = path.join(tmp, 'howto.html');
        fs.writeFileSync(htmlFile, html);
        const { chromium } = await import('@playwright/test');
        const browser = await chromium.launch({ channel: 'chrome' });
        try {
            const page = await browser.newPage();
            await page.goto(`file://${htmlFile}`, { waitUntil: 'load', timeout: 300_000 });
            await page.evaluate(() => document.fonts.ready);
            const faces = (await page.evaluate(`({ andika: document.fonts.check('12px Andika', 'Aa'), sarabun: document.fonts.check('12px Sarabun', 'ก') })`)) as { andika: boolean; sarabun: boolean };
            if (!faces.andika || !faces.sarabun) {
                console.error(`a print face did not load: Andika ${faces.andika}, Sarabun ${faces.sarabun}`);
                return 1;
            }
            await page.emulateMedia({ media: 'print' });
            const text = (await page.evaluate('document.body.innerText')) as string;
            const copyErrors = checkStorytimeCoverCopy(text);
            if (copyErrors.length) {
                for (const error of copyErrors) console.error(error);
                return 1;
            }
            // A sheet must hold its content: no scroll overflow, and no element below the footer line.
            const overflow = (await page.evaluate(`Array.from(document.querySelectorAll('.sheet'), (sheet, index) => {
                const box = sheet.getBoundingClientRect();
                const limit = box.bottom - 8 * 96 / 25.4;
                const low = Array.from(sheet.querySelectorAll('figure, p:not(.series), h2')).filter((el) => el.getBoundingClientRect().bottom > limit);
                return { sheet: index + 1, scroll: sheet.scrollHeight - sheet.clientHeight, low: low.length };
            })`)) as Array<{ sheet: number; scroll: number; low: number }>;
            const broken = overflow.filter((entry) => entry.scroll > 1 || entry.low > 0);
            if (broken.length) {
                console.error(`a sheet overflows: ${JSON.stringify(broken)}`);
                return 1;
            }
            fs.mkdirSync(path.dirname(args.out), { recursive: true });
            await page.pdf({ path: args.out, preferCSSPageSize: true, printBackground: true });
        } finally {
            await browser.close();
        }
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
    const info = execFileSync('pdfinfo', [args.out], { encoding: 'utf8' });
    const pages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1]);
    if (pages !== 2) {
        console.error(`the PDF holds ${pages} pages; the how-to has 2`);
        return 1;
    }
    console.log(`done  ${args.out} (${pages} pages)`);
    return 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
