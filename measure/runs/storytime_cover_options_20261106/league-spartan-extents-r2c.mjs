// The League Spartan 700 ink extent table of the readers r2c round (2026-11-11).
//
// The script loads the committed print face `dashboard/assets/print-fonts/league-spartan-latin-700-
// normal.woff2` with an `@font-face` rule in a Chrome page, and it reads the ink extents of each of
// the 95 ASCII characters 32 to 126 at a 1000 px size with `fontKerning = 'none'`. The ascent is
// `actualBoundingBoxAscent`, the ink above the baseline; the descent is
// `actualBoundingBoxDescent`, the ink below the baseline. The extent is the em value: the measured
// pixels divided by 1000. The largest ascent of the characters of one title, and the largest
// descent, then give the ink box of the title (`titleInkEm` of
// `lib/storytime/print/cover-quest.ts`).
//
// The script also reads the cap height (`measureText('H').actualBoundingBoxAscent`) and the 2 font
// values of the face (`measureText('H').fontBoundingBoxAscent` and `fontBoundingBoxDescent`), which
// place the baseline inside a line box of `line-height: 1`.
//
// Usage: node league-spartan-extents-r2c.mjs [output file]
// It prints the 95 ascents, the 95 descents, the cap, the font ascent, the font descent, and the
// count.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/home/daniebo/Desktop/Workbooks/dashboard/package.json');
const { chromium } = require('playwright');

const REPO = '/home/daniebo/Desktop/Workbooks';
const FONT = path.join(REPO, 'dashboard', 'assets', 'print-fonts', 'league-spartan-latin-700-normal.woff2');
const OUT = process.argv[2] ?? '';

const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'league-extents-'));
const page_file = path.join(folder, 'extents.html');
fs.writeFileSync(
    page_file,
    '<!doctype html><html><head><meta charset="utf-8"><style>' +
        `@font-face { font-family: 'LS700'; font-weight: 700; font-style: normal; ` +
        `src: url('${pathToFileURL(FONT).href}') format('woff2'); }` +
        "</style></head><body><p style=\"font-family:'LS700';font-weight:700;font-size:1000px\">A</p></body></html>",
);

let text = '';
try {
    const browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
    try {
        const page = await browser.newPage();
        await page.goto(pathToFileURL(page_file).href);
        await page.evaluate(() => document.fonts.ready);

        const result = await page.evaluate(() => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            context.font = "700 1000px 'LS700'";
            context.fontKerning = 'none';
            const ascents = [];
            const descents = [];
            for (let code = 32; code <= 126; code += 1) {
                const metrics = context.measureText(String.fromCharCode(code));
                ascents.push(Number((metrics.actualBoundingBoxAscent / 1000).toFixed(4)));
                descents.push(Number((metrics.actualBoundingBoxDescent / 1000).toFixed(4)));
            }
            const cap = context.measureText('H');
            return {
                ascents,
                descents,
                cap: Number((cap.actualBoundingBoxAscent / 1000).toFixed(4)),
                fontAscent: Number((cap.fontBoundingBoxAscent / 1000).toFixed(4)),
                fontDescent: Number((cap.fontBoundingBoxDescent / 1000).toFixed(4)),
            };
        });

        text =
            `LEAGUE_SPARTAN_700_ASCENT = ${JSON.stringify(result.ascents)}\n` +
            `LEAGUE_SPARTAN_700_DESCENT = ${JSON.stringify(result.descents)}\n` +
            `LEAGUE_SPARTAN_700_CAP = ${String(result.cap)}\n` +
            `LEAGUE_SPARTAN_700_FONT_ASCENT = ${String(result.fontAscent)}\n` +
            `LEAGUE_SPARTAN_700_FONT_DESCENT = ${String(result.fontDescent)}\n` +
            `COUNT = ${String(result.ascents.length)}\n`;
    } finally {
        await browser.close();
    }
} finally {
    fs.rmSync(folder, { recursive: true, force: true });
}

if (OUT) fs.writeFileSync(OUT, text);
process.stdout.write(text);
