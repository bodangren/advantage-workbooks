import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
    storytimeCardPagePlan,
    storytimeCardPictureMatchLines,
    storytimeCardPictureRow,
    STORYTIME_CARD_KIT_SPEC,
    STORYTIME_CARD_PICTURE_KINDS,
    type StorytimeCard,
    type StorytimeCardKind,
    type StorytimeCardSize,
    type StorytimeKitItem,
} from '../../lib/storytime/print/card-kit';
import { resolveStorytimePictureFiles } from '../../lib/storytime/print/picture-check';
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

const USAGE = `Builds the PDF/X-1a print files of the Storytime Advantage card kit (spec FR-7): the A5
cards, the A6 cards, and the sticker sheet, each through make-pdfx.ts --keep-fonts (color, CMYK).
Run it under the heavy-job lock (plan rule 12).

Usage: npx tsx scripts/storytime/make-card-kit-pdf.ts --level <n> --weeks <list> [--out <folder>] [--version <n>]

  --level   The Storytime level, a whole number from 1 to 4, e.g. 2
  --weeks   The weeks of the kit, each a whole number from 1 to 32, comma separated, e.g. 1,2,3,4,5,6,7,8
  --out     The output folder, an absolute path strictly inside <home>/Desktop/print-ready/storytime/
            (default ~/Desktop/print-ready/storytime/card-kit-v<n>/)
  --version The version in the file names, a whole number of 1 or more (rule 12.2; default 1)

Files: Storytime-Advantage-L<level>-Card-Kit-A5-v<n>_PDFX-1a.pdf,
Storytime-Advantage-L<level>-Card-Kit-A6-v<n>_PDFX-1a.pdf,
Storytime-Advantage-L<level>-Card-Kit-Stickers-v<n>_PDFX-1a.pdf, and card-picture-match.txt
(the kind, the label, and the matched picture-list row id or none, one tab-separated line for each
picture-type card).

Exit code 2 on an argument error; 1 when a week does not parse, a page count misses the plan, or
the PDF/X check fails.`;

/** The smallest and largest accepted level, week, and version (as `check-weeks.ts`). */
const MIN_LEVEL = 1;
const MAX_LEVEL = 4;
const MIN_WEEK = 1;
const MAX_WEEK = 32;

/** The parsed arguments of one card kit build. */
interface CardKitArgs {
    /** The Storytime level. */
    level: number;
    /** The weeks of the kit. */
    weeks: number[];
    /** The output folder. */
    outDir: string;
    /** The version in the file names. */
    version: number;
}

/**
 * Parses a whole-number flag value.
 * @param value The raw flag value.
 * @param name The flag name, for the message.
 * @param min The smallest accepted value.
 * @param max The largest accepted value.
 * @returns The value.
 */
function safeInt(value: string | undefined, name: string, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
        throw new Error(`${name} must be a whole number from ${min} to ${max}, got "${String(value)}"`);
    }
    return parsed;
}

/**
 * Parses and validates the arguments of the build, with no file access.
 * @param argv The CLI arguments, without the node command.
 * @param home The user home folder that resolves the default output folder.
 * @returns The validated arguments.
 */
function parseArgs(argv: string[], home: string): CardKitArgs {
    let level: number | undefined;
    let weeks: number[] | undefined;
    let out: string | undefined;
    let version = 1;
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index];
        if (arg === '--level') level = safeInt(argv[++index], '--level', MIN_LEVEL, MAX_LEVEL);
        else if (arg === '--weeks') {
            weeks = String(argv[++index]).split(',').map((week) => safeInt(week, `--weeks "${week}"`, MIN_WEEK, MAX_WEEK));
        } else if (arg === '--version') version = safeInt(argv[++index], '--version', 1, Number.MAX_SAFE_INTEGER);
        else if (arg === '--out') {
            out = argv[++index];
            if (!out || !path.isAbsolute(out)) throw new Error(`--out must be an absolute folder inside the print-ready Storytime folder, got "${String(out)}"`);
        } else throw new Error(`unknown argument: ${arg}`);
    }
    if (level === undefined) throw new Error('a --level value is required');
    if (!weeks?.length) throw new Error('a --weeks list is required');
    const outDir = path.resolve(out ?? path.join(home, 'Desktop', 'print-ready', 'storytime', `card-kit-v${version}`));
    return { level, weeks, outDir, version };
}

/**
 * The file names of one build.
 * @param level The Storytime level.
 * @param version The version of the build.
 * @returns The three print files and the match report name.
 */
function fileNames(level: number, version: number): {
    a5: string;
    a6: string;
    stickers: string;
    match: string;
} {
    const stem = `Storytime-Advantage-L${level}-Card-Kit`;
    return {
        a5: `${stem}-A5-v${version}_PDFX-1a.pdf`,
        a6: `${stem}-A6-v${version}_PDFX-1a.pdf`,
        stickers: `${stem}-Stickers-v${version}_PDFX-1a.pdf`,
        match: 'card-picture-match.txt',
    };
}

/**
 * Reads the picture list of a level.
 * @param level The Storytime level.
 * @returns The rows of `pictures.json`.
 */
function readPictureRows(level: number): StorytimePictureRow[] {
    const file = path.join(STORYTIME_ROOT, `l${level}`, 'print', 'pictures.json');
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimePictureRow[];
}

/**
 * The delivered rows of the picture list: the rows whose color file and line-art file both resolve
 * through `manifest.json`. The whole list resolves in one call when every file is in place; a
 * missing file falls back to a row-by-row probe, so one missing picture does not hide the rest.
 * @param folder The picture folder of the level.
 * @param rows The rows of the picture list.
 * @returns The delivered row ids, and the color file of each.
 */
function deliveredPictures(folder: string, rows: StorytimePictureRow[]): { delivered: Set<string>; files: Map<string, string> } {
    const files = new Map<string, string>();
    try {
        for (const entry of resolveStorytimePictureFiles(folder, rows, 'color')) files.set(entry.rowId, entry.file);
        resolveStorytimePictureFiles(folder, rows, 'line');
        return { delivered: new Set(files.keys()), files };
    } catch {
        files.clear();
    }
    for (const row of rows) {
        try {
            const [color] = resolveStorytimePictureFiles(folder, [row], 'color');
            resolveStorytimePictureFiles(folder, [row], 'line');
            files.set(row.id, color.file);
        } catch {
            // The row is not delivered; its card prints an empty, labelled picture box.
        }
    }
    return { delivered: new Set(files.keys()), files };
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
    let args: CardKitArgs;
    try {
        args = parseArgs(argv, os.homedir());
    } catch (error) {
        console.error(`${error instanceof Error ? error.message : String(error)}\n\n${USAGE}`);
        return 2;
    }
    const { level, weeks, outDir, version } = args;
    const names = fileNames(level, version);
    for (const name of [names.a5, names.a6, names.stickers, names.match]) {
        checkStorytimeOutputContainment(path.join(outDir, name), os.homedir());
    }

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
    const kit = storytimeCardKit(parsed);
    const pictureFolder = path.join(STORYTIME_ROOT, `l${level}`, 'print', 'pictures');
    const rows = readPictureRows(level);
    const { delivered, files } = deliveredPictures(pictureFolder, rows);

    const a5Plan = storytimeCardPagePlan(kit.cards, 'A5');
    const a6Plan = storytimeCardPagePlan(kit.cards, 'A6');

    fs.mkdirSync(outDir, { recursive: true });
    const matchLines = storytimeCardPictureMatchLines(kit.cards, rows, delivered);
    fs.writeFileSync(path.join(outDir, names.match), `${matchLines.join('\n')}\n`);
    const pictureCards = kit.cards.filter((card) => STORYTIME_CARD_PICTURE_KINDS.includes(card.kind));
    const matched = pictureCards.filter((card) => storytimeCardPictureRow(card, rows, delivered)).length;
    const words = new Map<string, boolean>();
    for (const card of pictureCards) {
        const key = card.label.toLowerCase();
        if (!words.has(key)) words.set(key, storytimeCardPictureRow(card, rows, delivered) !== undefined);
    }
    const wordsMatched = [...words.values()].filter(Boolean).length;
    console.log(`picture cards: ${pictureCards.length}, matched ${matched}, no match ${pictureCards.length - matched}`);
    console.log(`distinct words: ${words.size}, matched ${wordsMatched}, no match ${words.size - wordsMatched}`);
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

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-card-kit-'));
    const pagedSrc = fs.readFileSync(path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js'), 'utf8');
    const browser = await chromium.launch({ channel: 'chrome' });
    const built: { name: string; out: string; sheets: number; pages: number }[] = [];
    try {
        const parts: { name: string; out: string; html: string; sheets: number }[] = [];
        for (const size of ['A5', 'A6'] as StorytimeCardSize[]) {
            const title = `Storytime Advantage, Level ${level}, Unit 1 Card Kit, ${size} cards`;
            const body = compileStorytimeCardSheet(kit.cards, size, { pictureOf: pictureOfCard, title });
            parts.push({
                name: size === 'A5' ? names.a5 : names.a6,
                out: path.join(outDir, size === 'A5' ? names.a5 : names.a6),
                html: cardSheetDocument(body.html, title, size),
                sheets: body.sheets,
            });
        }
        const stickerTitle = `Storytime Advantage, Level ${level}, Unit 1 Card Kit, sticker sheet`;
        const stickers = compileStorytimeStickerSheet(kit.items, { pictureOf: pictureOfSticker, title: stickerTitle });
        parts.push({ name: names.stickers, out: path.join(outDir, names.stickers), html: stickers.html, sheets: stickers.sheets });

        for (const part of parts) {
            const chromeFile = path.join(tmp, `${part.name.replace(/\.pdf$/, '')}-chrome.pdf`);
            const pages = await renderOne(browser, part.html, chromeFile, part.out, pagedSrc);
            built.push({ name: part.name, out: part.out, sheets: part.sheets, pages });
        }
    } finally {
        await browser.close();
        fs.rmSync(tmp, { recursive: true, force: true });
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

main(process.argv.slice(2)).then(
    (code) => {
        process.exitCode = code;
    },
    (error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    },
);
