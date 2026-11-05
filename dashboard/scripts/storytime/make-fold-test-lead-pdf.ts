import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { compileFoldTestLead } from '../../lib/storytime/print/fold-test';
import { STORYTIME_PRINT_PROFILE } from '../../lib/storytime/print/profile';

/**
 * The build of the reader fold-test lead sheets (A-48 part F, B1): two A4 portrait sheets, black
 * and white, as a plain office-print PDF made by Chrome (not PDF/X). Sheet 1 carries the print
 * instruction; sheet 2 is its blank back. Run it under the heavy-job lock.
 */

const USAGE = `Makes the PDF of the reader fold-test lead sheets (Storytime Advantage, A-48 part F B1).

Usage: npx tsx scripts/storytime/make-fold-test-lead-pdf.ts --out <file.pdf>

  --out     The output file, an absolute path inside <home>/Desktop/print-ready/storytime/ or /tmp/opencode/

Exit code 2 on an argument error or an output file that exists already. Exit code 1 when a print
face does not load or the page count is not 2.`;

/** The folders that may hold the output. */
const outputRoots = (home: string): string[] => [path.join(home, 'Desktop', 'print-ready', 'storytime') + path.sep, '/tmp/opencode/'];

/** Parses the arguments; throws an argument error (exit code 2). */
function parseArgs(argv: string[], home: string): { out: string } {
    let out: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--out') out = argv[++i];
        else throw new Error(`unknown argument: ${arg}`);
    }
    if (!out || !path.isAbsolute(out)) throw new Error('--out must be an absolute file path');
    if (!outputRoots(home).some((root) => out.startsWith(root))) throw new Error(`--out must be inside ${outputRoots(home).join(' or ')}`);
    if (fs.existsSync(out)) throw new Error(`the output exists already: ${out}`);
    return { out };
}

async function main(argv: string[]): Promise<number> {
    if (argv.length === 0 || argv.some((a) => a === '--help' || a === '-h')) {
        console.log(USAGE);
        return argv.length === 0 ? 2 : 0;
    }
    let args: { out: string };
    try {
        args = parseArgs(argv, os.homedir());
    } catch (e) {
        console.error(`${e instanceof Error ? e.message : String(e)}\n\n${USAGE}`);
        return 2;
    }
    const { html } = compileFoldTestLead(STORYTIME_PRINT_PROFILE);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-fold-test-'));
    try {
        const htmlFile = path.join(tmp, 'fold-test-lead.html');
        fs.writeFileSync(htmlFile, html);
        const { chromium } = await import('@playwright/test');
        const browser = await chromium.launch({ channel: 'chrome' });
        try {
            const page = await browser.newPage();
            await page.goto(`file://${htmlFile}`, { waitUntil: 'load', timeout: 300_000 });
            await page.evaluate(() => document.fonts.ready);
            const faces = (await page.evaluate(`({ andika: document.fonts.check('12px Andika', 'Aa') })`)) as { andika: boolean };
            if (!faces.andika) {
                console.error('the print face did not load: Andika');
                return 1;
            }
            await page.emulateMedia({ media: 'print' });
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
        console.error(`the PDF holds ${pages} pages; the fold-test lead has 2`);
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
