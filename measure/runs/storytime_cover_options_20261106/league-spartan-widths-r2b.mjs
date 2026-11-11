// The League Spartan 700 advance width table of the readers r2b round (2026-11-11).
//
// The script loads the committed print face `dashboard/assets/print-fonts/league-spartan-latin-700-
// normal.woff2` with an `@font-face` rule in a Chrome page, and it reads `measureText` of each of
// the 95 ASCII characters 32 to 126 at a 1000 px size with `fontKerning = 'none'`. The width is the
// em advance: the measured pixels divided by 1000. The sum of the table widths then equals the
// rendered width of a title whose CSS holds `font-kerning: none` (the reader title of
// `lib/storytime/print/cover-quest.ts`).
//
// Usage: node league-spartan-widths-r2b.mjs [output file]
// It prints the 95 widths as a JSON array and the fallback width of a character outside the table.

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

const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'league-widths-'));
const page_file = path.join(folder, 'widths.html');
fs.writeFileSync(
    page_file,
    '<!doctype html><html><head><meta charset="utf-8"><style>' +
        `@font-face { font-family: 'LS700'; font-weight: 700; font-style: normal; ` +
        `src: url('${pathToFileURL(FONT).href}') format('woff2'); }` +
        "</style></head><body><p style=\"font-family:'LS700';font-weight:700;font-size:1000px\">A</p></body></html>",
);

const browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
const page = await browser.newPage();
await page.goto(pathToFileURL(page_file).href);
await page.evaluate(() => document.fonts.ready);

const result = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = "700 1000px 'LS700'";
    context.fontKerning = 'none';
    const widths = [];
    for (let code = 32; code <= 126; code += 1) {
        widths.push(Number((context.measureText(String.fromCharCode(code)).width / 1000).toFixed(4)));
    }
    const fallback = Number((context.measureText('\u2019').width / 1000).toFixed(4));
    const average = Number((widths.reduce((sum, value) => sum + value, 0) / widths.length).toFixed(4));
    const missing = Number((context.measureText('\uE000').width / 1000).toFixed(4));
    return { widths, fallback, average, missing };
});

await browser.close();
fs.rmSync(folder, { recursive: true, force: true });

const text =
    `LEAGUE_SPARTAN_700_ADVANCE = ${JSON.stringify(result.widths)}\n` +
    `LEAGUE_SPARTAN_700_FALLBACK = ${String(result.average)}\n` +
    `QUOTE_2019 = ${String(result.fallback)}\n` +
    `PRIVATE_USE = ${String(result.missing)}\n` +
    `COUNT = ${String(result.widths.length)}\n`;
if (OUT) fs.writeFileSync(OUT, text);
process.stdout.write(text);
