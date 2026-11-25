import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium, type Browser } from '@playwright/test';
import { renderPagedPdf } from '../../lib/print/render';
import { readLevelWeeks, STORYTIME_ROOT } from '../../lib/storytime/files';
import type { StorytimeWeek } from '../../lib/storytime/schema';
import {
    cardSheetDocument,
    compileStorytimeCardSheet,
    compileStorytimeStickerSheet,
    storytimeCardKit,
    storytimeCardMatchCounts,
    storytimeCardMatchSource,
    storytimeCardPagePlan,
    storytimeCardPictureMatchLines,
    storytimeCardPictureRow,
    storytimeCardKitTitle,
    storytimeDeliveredPictures,
    STORYTIME_CARD_KIT_SPEC,
    STORYTIME_CARD_PICTURE_KINDS,
    type StorytimeCard,
    type StorytimeCardKind,
    type StorytimeCardSize,
    type StorytimeKitItem,
} from '../../lib/storytime/print/card-kit';
import {
    parseStorytimeCardKitArgs,
    storytimeCardKitFileNames,
    type StorytimeCardKitArgs,
    type StorytimeCardKitFileNames,
} from '../../lib/storytime/print/card-kit-cli';
import type { StorytimePictureRow } from '../../lib/storytime/print/pictures';
import { checkRequestedWeeks, checkStorytimeOutputContainment } from '../../lib/storytime/print/student-book-cli';

/**
 * Builds the print files of the Storytime Advantage unit 1 card kit (spec FR-7, plan Phase 8):
 * one PDF/X-1a file for the A5 cards, one for the A6 cards, and one for the sticker sheet, plus
 * the picture match report of every picture-type card. The cards are n-up on A4 sheets with a cut
 * line on each internal boundary; the stickers are round 40 mm on an A4 portrait sheet. The build
 * reads the shipped week files and the delivered pictures only: it makes no picture and starts no
 * paid run.
 */

/**
 * The unit of the kit. Release 1 is unit 1 only (spec P11), and the unit marker of the file stem
 * comes from here (Review C, C-P8-1).
 */
const CARD_KIT_UNIT = 1;

const USAGE = `Builds the PDF/X-1a print files of the Storytime Advantage card kit (spec FR-7): the A5
cards, the A6 cards, and the sticker sheet, each through make-pdfx.ts --keep-fonts (color, CMYK).
Run it under the heavy-job lock (plan rule 12).

Usage: npx tsx scripts/storytime/make-card-kit-pdf.ts --level <n> --weeks <list> [--out <folder>] [--version <n>]

  --level   The Storytime level, a whole number from 1 to 4, e.g. 2
  --weeks   The weeks of the kit, each a whole number from 1 to 32, comma separated, e.g. 1,2,3,4,5,6,7,8
  --out     The output folder, an absolute path strictly inside <home>/Desktop/print-ready/storytime/
            (default ~/Desktop/print-ready/storytime/card-kit-v<n>/)
  --version The version in the file names, a whole number of 1 or more (rule 12.2; default 1)

Files: Storytime-Advantage-L<level>-U1-Card-Kit-A5-v<n>_PDFX-1a.pdf,
Storytime-Advantage-L<level>-U1-Card-Kit-A6-v<n>_PDFX-1a.pdf,
Storytime-Advantage-L<level>-U1-Card-Kit-Stickers-v<n>_PDFX-1a.pdf, and card-picture-match.txt
(the kind, the label, the matched picture-list row id or none, and the match case or the reason of
a missing picture, one tab-separated line for each picture-type card). The third and the fourth
column hold patch or dots for a color patch card and a number dot card. The build prints two count
lines: 'picture cards: ...' and 'distinct words: ...'.

Exit code 2 on an argument error or an output folder outside the print folder; 1 when a week does
not parse, a page count misses the plan, or the PDF/X check fails.`;

/**
 * Reads the picture list of a level.
 * @param level The Storytime level.
 * @returns The rows of `pictures.json`.
 */
/**
 * The picture rows of the level: unit 1 from `print/pictures.json`, and later units from their
 * own list under `print/u<unit>/`.
 * @param level The Storytime level.
 * @param unit The unit of the kit, from `meta.unit`.
 * @returns The rows of the level, unit 1 first.
 */
function readPictureRows(level: number, unit: number): StorytimePictureRow[] {
    const folder = path.join(STORYTIME_ROOT, `l${level}`, 'print');
    const files = [path.join(folder, 'pictures.json')];
    if (unit !== 1) files.push(path.join(folder, `u${unit}`, 'pictures.json'));
    return files.flatMap((file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimePictureRow[] : []));
}

/**
 * Renders one HTML document to a PDF/X-1a print file and checks it.
 * @param browser The Chrome browser of the build.
 * @param html The document.
 * @param chromeFile The intermediate Chrome PDF.
 * @param outFile The print file.
 * @param pagedSrc The Paged.js polyfill source.
 * @returns The page count of the document.
 */
async function renderOne(
    browser: Browser,
    html: string,
    chromeFile: string,
    outFile: string,
    pagedSrc: string,
): Promise<number> {
    const htmlFile = `${chromeFile}.html`;
    fs.writeFileSync(htmlFile, html);
    const pages = await renderPagedPdf(browser, htmlFile, chromeFile, pagedSrc);
    // The color path of the covers: the faces stay embedded, and the Ghostscript profile gives the
    // CMYK ink of the track profile (spec P2). No --k-only: the card kit is a 4/0 color job.
    execFileSync(process.execPath, ['--import', 'tsx', 'scripts/print/make-pdfx.ts', chromeFile, '--out', outFile, '--keep-fonts'], { stdio: 'inherit' });
    fs.rmSync(htmlFile, { force: true });
    fs.rmSync(chromeFile, { force: true });
    return pages;
}

/**
 * The build.
 * @param argv The CLI arguments, without the node command.
 * @returns The exit code.
 */
async function main(argv: string[]): Promise<number> {
    if (argv.length === 0 || argv.some((arg) => arg === '--help' || arg === '-h')) {
        console.log(USAGE);
        return argv.length === 0 ? 2 : 0;
    }
    let args: StorytimeCardKitArgs;
    let names: StorytimeCardKitFileNames;
    try {
        args = parseStorytimeCardKitArgs(argv, os.homedir());
        names = storytimeCardKitFileNames(args.level, CARD_KIT_UNIT, args.version);
        // The output folder must stay inside the print folder through its filesystem links too;
        // an output error is an argument error, so it exits 2 with the usage text (Review B, B-P8-2).
        for (const name of [names.a5, names.a6, names.stickers, names.match]) {
            checkStorytimeOutputContainment(path.join(args.outDir, name), os.homedir());
        }
    } catch (error) {
        console.error(`${error instanceof Error ? error.message : String(error)}\n\n${USAGE}`);
        return 2;
    }
    const { level, weeks, outDir } = args;

    const read = readLevelWeeks(STORYTIME_ROOT, level).filter((entry) => {
        const meta = (entry.raw as { meta?: { week?: number } }).meta;
        return weeks.includes(meta?.week ?? -1);
    });
    checkRequestedWeeks(weeks, read.map((entry) => (entry.raw as { meta?: { week?: number } }).meta?.week ?? -1));
    const broken = read.filter((entry) => !entry.week);
    if (broken.length) {
        console.error(`Not parsed: ${broken.map((entry) => `${entry.file} (${entry.error})`).join('; ')}`);
        return 1;
    }
    const parsed = read.map((entry) => entry.week as StorytimeWeek);
    const unit = parsed[0].meta.unit;
    const kit = storytimeCardKit(parsed);
    const pictureFolder = path.join(STORYTIME_ROOT, `l${level}`, 'print', 'pictures');
    const rows = readPictureRows(level, unit);
    const { delivered, files, reasons } = storytimeDeliveredPictures(pictureFolder, rows);

    const a5Plan = storytimeCardPagePlan(kit.cards, 'A5');
    const a6Plan = storytimeCardPagePlan(kit.cards, 'A6');

    fs.mkdirSync(outDir, { recursive: true });
    const matchLines = storytimeCardPictureMatchLines(kit.cards, rows, delivered, reasons);
    fs.writeFileSync(path.join(outDir, names.match), `${matchLines.join('\n')}\n`);
    const pictureCards = kit.cards.filter((card) => STORYTIME_CARD_PICTURE_KINDS.includes(card.kind));
    // The counts come from the match report, so the patch and the dot cards are not counted as
    // "no match" (A-P8-9).
    const matchCounts = storytimeCardMatchCounts(matchLines);
    console.log(`picture cards: ${pictureCards.length}, picture ${matchCounts.picture}, patch ${matchCounts.patch}, dots ${matchCounts.dots}, none ${matchCounts.none}`);
    // One word can name two cards, so the first line of the word gives the source of the word.
    const wordSources = new Map<string, 'picture' | 'patch' | 'dots' | 'none'>();
    for (const line of matchLines) {
        const label = (line.split('\t')[1] ?? '').toLowerCase();
        if (!wordSources.has(label)) wordSources.set(label, storytimeCardMatchSource(line));
    }
    const wordCounts = { picture: 0, patch: 0, dots: 0, none: 0 };
    for (const source of wordSources.values()) wordCounts[source] += 1;
    console.log(`distinct words: ${wordSources.size}, picture ${wordCounts.picture}, patch or dots ${wordCounts.patch + wordCounts.dots}, none ${wordCounts.none}`);
    console.log(`match report: ${path.join(outDir, names.match)}`);

    const pictureOfCard = (card: StorytimeCard): string | undefined => {
        const row = storytimeCardPictureRow(card, rows, delivered);
        return row ? files.get(row.id) : undefined;
    };
    const coverRowOf = (label: string): StorytimePictureRow | undefined =>
        rows.find((row) => row.use === 'cover' && row.text.toLowerCase() === label.toLowerCase());
    const pictureOfSticker = (item: StorytimeKitItem): string | undefined => {
        const row = coverRowOf(item.label);
        return row && delivered.has(row.id) ? files.get(row.id) : undefined;
    };

    const built: { name: string; out: string; sheets: number; pages: number }[] = [];
    // The temp folder, the Paged.js read, and the browser launch sit inside the try block, so a
    // failed read or launch removes the temp folder (Review B, B-P8-4).
    let tmp: string | undefined;
    let browser: Browser | undefined;
    try {
        const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-card-kit-'));
        tmp = scratch;
        const pagedSrc = fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'), 'utf8');
        browser = await chromium.launch({ channel: 'chrome' });
        const parts: { name: string; out: string; html: string; sheets: number }[] = [];
        for (const size of ['A5', 'A6'] as StorytimeCardSize[]) {
            const title = storytimeCardKitTitle(level, unit, size);
            const body = compileStorytimeCardSheet(kit.cards, size, { pictureOf: pictureOfCard, title });
            parts.push({
                name: size === 'A5' ? names.a5 : names.a6,
                out: path.join(outDir, size === 'A5' ? names.a5 : names.a6),
                html: cardSheetDocument(body.html, title, size),
                sheets: body.sheets,
            });
        }
        const stickerTitle = storytimeCardKitTitle(level, unit, 'sticker sheet');
        const stickers = compileStorytimeStickerSheet(kit.items, { pictureOf: pictureOfSticker, title: stickerTitle });
        parts.push({ name: names.stickers, out: path.join(outDir, names.stickers), html: stickers.html, sheets: stickers.sheets });

        for (const part of parts) {
            const chromeFile = path.join(scratch, `${part.name.replace(/\.pdf$/, '')}-chrome.pdf`);
            const pages = await renderOne(browser, part.html, chromeFile, part.out, pagedSrc);
            built.push({ name: part.name, out: part.out, sheets: part.sheets, pages });
        }
    } finally {
        // A close error must not skip the temp folder removal (Review B, B-P8-7): the close has
        // its own try, so the removal below always runs.
        try {
            await browser?.close();
        } catch (error) {
            console.error(`browser close: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
    }

    let failed = false;
    const expected: Record<string, number> = { [names.a5]: a5Plan.sheets, [names.a6]: a6Plan.sheets, [names.stickers]: 1 };
    for (const entry of built) {
        const want = expected[entry.name];
        const ok = entry.pages === want;
        if (!ok) failed = true;
        const size = fs.statSync(entry.out).size;
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${entry.out}: ${entry.pages} pages (plan ${want}), ${(size / 1024).toFixed(0)} kB`);
    }
    if (failed) return 1;
    const kindCounts = new Map<StorytimeCardKind, number>();
    for (const card of kit.cards) kindCounts.set(card.kind, (kindCounts.get(card.kind) ?? 0) + 1);
    const counts = [...kindCounts.entries()].map(([kind, count]) => `${kind} ${count}`).join(', ');
    console.log(`cards: ${kit.cards.length} (${counts}); A5 ${a5Plan.cards} on ${a5Plan.sheets} sheets, A6 ${a6Plan.cards} on ${a6Plan.sheets} sheets`);
    console.log(`items: ${kit.items.length}; letter strip: ${kit.letterStrip.length} letters; paper: ${STORYTIME_CARD_KIT_SPEC.gsm} gsm, stickers ${STORYTIME_CARD_KIT_SPEC.stickerDiameterMm} mm`);
    return 0;
}

// The build runs only when this file is the entry point, so a test can import the module without
// a render (Review B, B-P8-1).
const isEntryPoint = Boolean(process.argv[1])
    && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isEntryPoint) {
    main(process.argv.slice(2)).then(
        (code) => {
            process.exitCode = code;
        },
        (error) => {
            console.error(error instanceof Error ? error.message : error);
            process.exitCode = 1;
        },
    );
}
