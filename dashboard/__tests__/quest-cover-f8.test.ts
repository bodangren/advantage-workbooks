// @vitest-environment jsdom
/**
 * Red of the round F8 of the PM look of 2026-11-13 (track storytime_cover_options_20261106,
 * Phase 2, the Task (Red, F7b and F8) of 2026-11-13).
 *
 * The defect F8 (the orchestrator measurement of 2026-11-13, the part 11 rebuild): page 1 of each
 * A3 colour reader (`make-readers-pdf.ts --final --a3-color`, the quest reader cover of F5) shows
 * only the top-left 198 x 148.5 mm of the A3 cover. The title plaque and the logo are not visible,
 * and the rest of the 420 x 297 mm sheet is white (the whole page 1 at 100 ppi holds 583 white
 * rows at the bottom and 873 white columns at the right). Pages 2 and 12 fill the sheet. The
 * cause: in `readers.ts` the rule `.reader-page > .quest-cover-picture` holds the leaf size
 * (`profile.readerPage`), while the `a3-color` cover page renders the quest cover at the A3 trim
 * (420 x 297 mm). The K-only `workbook` output is correct and stays as it is.
 *
 * The orchestrator decisions D-F8-1 and D-F8-2 of 2026-11-13 (the contract of this round):
 *   D-F8-1: in the `a3-color` output, page 1 shows the whole A3 quest reader cover. It fills the
 *       420 x 297 mm sheet, with every chrome part of the A3 reader cover inside the sheet. The
 *       `workbook` output keeps its page 1 as it is.
 *   D-F8-2: Green changes only `dashboard/lib/storytime/print/readers.ts` for F8, and only
 *       `content/storytime/l2/print/pictures-edge-fill.json` for F7b.
 *
 * The pins of this file:
 *   F8-1: page 1 of the final a3-color reader of week 1 "Hello!" and of "Nan can nod", rendered
 *       as Chrome prints it, at 420 x 297 mm and 96 ppi, holds 0 white edge rows and 0 white edge
 *       columns. The rule counts the white rows and columns inside the outermost pixel of each
 *       side, because Chrome paints the art to a whole pixel and the last 0.4 px of the page can
 *       show the white page background (the seam rule of F7-6). A white row or a white column
 *       holds pixels with R, G, and B at 250 or more, and every pixel is read, not every n-th
 *       one. The test reports the count of each side.
 *   F8-2: page 1 of each of the 2 books, rendered in this way, is close to the A3 reader cover of
 *       the same row rendered at trim size through the functions of the quest cover build (as F7-6
 *       does). The mean absolute difference per channel is 4 or less on a scale of 0 to 255. The
 *       test reports the value.
 *   F8-3: the `workbook` output keeps its page 1. The rendered box of `.quest-cover-picture` on
 *       page 1 has the leaf size of `profile.readerPage` (within 0.5 mm), and its page 1 art keeps
 *       the line art source.
 *
 * The method notes:
 *   - The render follows the print pipeline of `dashboard/lib/print/render.ts`: Chrome prints with
 *     the print media, so the print CSS applies. The page box of the sheet is 420 x 297 mm, and
 *     the screenshot of the page box at the device scale 1 gives 96 ppi.
 *   - The code under test is `readers.ts`. Each test loads it with a dynamic import, so the type
 *     check stays green before and after the Green change.
 *   - The render helper follows the F4 pixel test of `quest-cover-f3f6.test.ts`: a scratch HTML
 *     file, Chrome, and the screenshot of one element.
 *   - The file prints ids, millimetres, counts, and values only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { questReaders, renderQuestCover, type QuestReaderRow, type QuestRenderOptions } from '../lib/storytime/print/cover-quest';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { STORYTIME_ROOT, readLevelWeeks } from '../lib/storytime/files';
import type { StorytimeWeek } from '../lib/storytime/schema';

/** The specifier of the module under test. It is a runtime string, so the type check stays green. */
const READERS_MODULE = '../lib/storytime/print/readers';

/** The render options of the shipped style. */
const HLOGO_OPTIONS: QuestRenderOptions = { bleedMm: 0, top: 'hlogo' };

/** The picture folder of Level 2. */
const PICTURES_DIR = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');

/** The A3 trim of the colour reader page, in millimetres (D-F8-1). */
const A3_TRIM_MM = { widthMm: 420, heightMm: 297 };

/** The pixels of one millimetre at 96 ppi. */
const PX_PER_MM = 96 / 25.4;

/** The lowest channel value of a white pixel. */
const WHITE_LEVEL = 250;

/** The line art of the week 1 reader "Hello!". */
const HELLO_LINE_FILE = 'l2-w01-cover-hello-line-v1.png';

/** The options of one reader build. */
interface ReaderOptions {
    /** The print profile: the leaf trim, the perforation, and the reader page size. */
    profile: typeof STORYTIME_PRINT_PROFILE;
    /** `proof` prints the picture placeholders; `final` needs the picture files. */
    mode: 'proof' | 'final';
    /** The output: the workbook leaves, or the colour A3 pages. */
    output: 'workbook' | 'a3-color';
    /** One reader only, by title. */
    bookTitle?: string;
}

/** The module under test. */
interface ReadersModule {
    /** Compiles the reader pages of the given weeks to one print HTML document. */
    compileStorytimeReaders: (weeks: StorytimeWeek[], o: ReaderOptions) => { html: string };
}

/** One raw RGB image. */
interface RawImage {
    /** The width in pixels. */
    width: number;
    /** The height in pixels. */
    height: number;
    /** The count of the channels. */
    channels: number;
    /** The pixels, row by row. */
    data: Buffer;
}

/** The temporary folders of the renders. */
const scratch: string[] = [];

/** The browser of this file. */
let browser: Browser | undefined;

/** The browser context of this file. */
let context: BrowserContext | undefined;

/**
 * Loads the module under test.
 * @returns The module.
 * @throws Error When the module does not load, which is the Red state of this round.
 */
async function loadReaders(): Promise<ReadersModule> {
    const specifier = READERS_MODULE;
    const loaded = (await import(specifier)) as unknown as ReadersModule;
    return loaded;
}

/**
 * Reads a PNG buffer as raw RGB.
 * @param png The PNG buffer.
 * @returns The raw image.
 */
async function readRawBuffer(png: Buffer): Promise<RawImage> {
    const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return { width: info.width, height: info.height, channels: info.channels, data };
}

/**
 * Finds the rows of a raw image in which every pixel has R, G, and B at 250 or more.
 * @param image The raw image.
 * @returns The row indices.
 */
function whiteRows(image: RawImage): number[] {
    const rows: number[] = [];
    for (let y = 0; y < image.height; y++) {
        let white = true;
        for (let x = 0; x < image.width; x++) {
            const at = (y * image.width + x) * image.channels;
            if (image.data[at] < WHITE_LEVEL || image.data[at + 1] < WHITE_LEVEL || image.data[at + 2] < WHITE_LEVEL) {
                white = false;
                break;
            }
        }
        if (white) rows.push(y);
    }
    return rows;
}

/**
 * Finds the columns of a raw image in which every pixel has R, G, and B at 250 or more.
 * @param image The raw image.
 * @returns The column indices.
 */
function whiteColumns(image: RawImage): number[] {
    const columns: number[] = [];
    for (let x = 0; x < image.width; x++) {
        let white = true;
        for (let y = 0; y < image.height; y++) {
            const at = (y * image.width + x) * image.channels;
            if (image.data[at] < WHITE_LEVEL || image.data[at + 1] < WHITE_LEVEL || image.data[at + 2] < WHITE_LEVEL) {
                white = false;
                break;
            }
        }
        if (white) columns.push(x);
    }
    return columns;
}

/**
 * Gives the mean absolute difference of 2 raw images, per channel, over the common part.
 * @param a The first image.
 * @param b The second image.
 * @returns One mean per channel, on a scale of 0 to 255.
 */
function meanAbsDifference(a: RawImage, b: RawImage): number[] {
    const width = Math.min(a.width, b.width);
    const height = Math.min(a.height, b.height);
    const totals = [0, 0, 0];
    let count = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const at = (y * a.width + x) * a.channels;
            const other = (y * b.width + x) * b.channels;
            for (let c = 0; c < 3; c++) totals[c] += Math.abs(a.data[at + c] - b.data[other + c]);
            count++;
        }
    }
    return totals.map((total) => (count ? total / count : 0));
}

/**
 * Reads the week 1 package of Level 2.
 * @returns The week.
 */
function weekOne(): StorytimeWeek {
    const weeks = readLevelWeeks(STORYTIME_ROOT, 2)
        .flatMap((entry) => (entry.week ? [entry.week] : []))
        .filter((week) => week.meta.week === 1);
    expect(weeks.length, 'the Level 2 week 1 package exists.').toBe(1);
    return weeks[0];
}

/**
 * Reads the 2 reader rows of week 1.
 * @returns The rows of "Hello!" and of "Nan can nod".
 */
function weekOneRows(): QuestReaderRow[] {
    const rows = questReaders().filter((row) => row.week === 1);
    expect(rows.length, 'the week 1 holds 2 reader rows.').toBe(2);
    expect(
        rows.map((row) => row.slug).sort(),
        'the week 1 holds the readers "Hello!" and "Nan can nod".',
    ).toEqual(['hello', 'nan-can-nod']);
    return rows;
}

/**
 * Reads the art source of page 1 of a reader document.
 * @param html The document.
 * @returns The `file:` URL of the art.
 * @throws Error When the document holds no quest cover page.
 */
function pageOneArtSrc(html: string): string {
    // The style block holds a `.quest-cover-picture` rule, so the search takes the div of the class.
    const start = html.indexOf('class="quest-cover-picture"');
    expect(start, 'the document holds a quest cover page.').toBeGreaterThan(-1);
    const part = html.slice(start, start + 8000);
    const img = part.match(/<img[^>]*data-part="art"[^>]*>/);
    expect(img, 'the quest cover page holds an art image.').not.toBeNull();
    const src = img?.[0].match(/src="([^"]*)"/);
    expect(src, 'the art image holds a source.').not.toBeNull();
    return (src?.[1] ?? '').replace(/&amp;/g, '&');
}

/**
 * Opens one HTML text in Chrome from a scratch file and takes the screenshot of one element.
 * @param page The browser page.
 * @param html The HTML.
 * @param selector The selector of the element to capture.
 * @returns The PNG of the element.
 */
async function renderElement(page: Page, html: string, selector: string): Promise<Buffer> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-f8-'));
    scratch.push(folder);
    const file = path.join(folder, 'page.html');
    fs.writeFileSync(file, html);
    // The print media applies the print CSS, as the print dialog of Chrome does.
    await page.emulateMedia({ media: 'print' });
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined))));
    return page.locator(selector).first().screenshot({ type: 'png' });
}

/**
 * Counts the white rows and the white columns of a rendered page, per side. A side count is the
 * run of white rows or columns that touches that edge. The outermost pixel of each side is
 * ignored, because Chrome paints the art to a whole pixel and the last 0.4 px of the page can show
 * the white page background (the seam rule of F7-6).
 * @param image The rendered page.
 * @returns The counts of the top, the bottom, the left, and the right side.
 */
function whiteEdgeCounts(image: RawImage): { top: number; bottom: number; left: number; right: number } {
    const rowSet = new Set(whiteRows(image));
    const columnSet = new Set(whiteColumns(image));
    const run = (length: number, white: Set<number>, fromEnd: boolean): number => {
        let count = 0;
        if (fromEnd) {
            for (let index = length - 2; index >= 0; index--) {
                if (!white.has(index)) break;
                count++;
            }
            return count;
        }
        for (let index = 1; index < length - 1; index++) {
            if (!white.has(index)) break;
            count++;
        }
        return count;
    };
    return {
        top: run(image.height, rowSet, false),
        bottom: run(image.height, rowSet, true),
        left: run(image.width, columnSet, false),
        right: run(image.width, columnSet, true),
    };
}

beforeAll(async () => {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
    // The viewport holds the whole A3 sheet, so the screenshot of the page box is the whole page.
    context = await browser.newContext({ viewport: { width: 1700, height: 1300 } });
}, 120_000);

afterAll(async () => {
    try {
        if (context) await context.close();
        if (browser) await browser.close();
    } finally {
        for (const folder of scratch) fs.rmSync(folder, { recursive: true, force: true });
    }
});

describe('quest-cover-f8: the page 1 of the A3 colour reader (Red, F8 of the PM look of 2026-11-13)', () => {
    it('F8-1: the page 1 of the a3-color reader fills the A3 sheet, with no white edge row and no white edge column', async () => {
        const readers = await loadReaders();
        const week = weekOne();
        const rows = weekOneRows();
        const page = await context!.newPage();
        const failures: string[] = [];
        try {
            for (const row of rows) {
                const html = readers.compileStorytimeReaders([week], {
                    profile: STORYTIME_PRINT_PROFILE,
                    mode: 'final',
                    output: 'a3-color',
                    bookTitle: row.title,
                }).html;
                const png = await renderElement(page, html, '.a3-page');
                const image = await readRawBuffer(png);
                console.log(
                    `F8-1 ${row.title}: the page 1 holds ${image.width} x ${image.height} px, the A3 sheet at 96 ppi holds ` +
                        `${Math.round(A3_TRIM_MM.widthMm * PX_PER_MM)} x ${Math.round(A3_TRIM_MM.heightMm * PX_PER_MM)} px`,
                );
                expect(
                    Math.abs(image.width - A3_TRIM_MM.widthMm * PX_PER_MM),
                    `the page 1 of "${row.title}" is 420 mm wide.`,
                ).toBeLessThanOrEqual(2);
                expect(
                    Math.abs(image.height - A3_TRIM_MM.heightMm * PX_PER_MM),
                    `the page 1 of "${row.title}" is 297 mm high.`,
                ).toBeLessThanOrEqual(2);
                const counts = whiteEdgeCounts(image);
                console.log(
                    `F8-1 ${row.title}: white edge rows top ${counts.top}, bottom ${counts.bottom}, white edge columns left ${counts.left}, right ${counts.right}`,
                );
                if (counts.top || counts.bottom || counts.left || counts.right) {
                    failures.push(
                        `"${row.title}": ${counts.top} white edge row(s) at the top, ${counts.bottom} at the bottom, ` +
                            `${counts.left} white edge column(s) at the left, ${counts.right} at the right.`,
                    );
                }
            }
        } finally {
            await page.close();
        }
        console.log(`F8-1 pages checked ${rows.length}, failures ${failures.length}`);
        expect(failures, failures.join('\n')).toEqual([]);
    }, 900_000);

    it('F8-2: the page 1 of the a3-color reader is close to the A3 reader cover at trim size', async () => {
        const readers = await loadReaders();
        const week = weekOne();
        const rows = weekOneRows();
        const page = await context!.newPage();
        const failures: string[] = [];
        try {
            for (const row of rows) {
                const html = readers.compileStorytimeReaders([week], {
                    profile: STORYTIME_PRINT_PROFILE,
                    mode: 'final',
                    output: 'a3-color',
                    bookTitle: row.title,
                }).html;
                const built = await readRawBuffer(await renderElement(page, html, '.a3-page'));
                const art = fileURLToPath(pageOneArtSrc(html));
                const cover = await readRawBuffer(
                    await renderElement(page, renderQuestCover('reader-a3', row, { art: pathToFileURL(art).href }, HLOGO_OPTIONS), '.quest-page'),
                );
                const difference = meanAbsDifference(built, cover);
                const worst = Math.max(difference[0], difference[1], difference[2]);
                console.log(
                    `F8-2 ${row.title}: the mean absolute difference is R ${difference[0].toFixed(2)}, G ${difference[1].toFixed(2)}, ` +
                        `B ${difference[2].toFixed(2)}; the built page holds ${built.width} x ${built.height} px, the cover holds ${cover.width} x ${cover.height} px`,
                );
                if (worst > 4) {
                    failures.push(`"${row.title}": the mean absolute difference is ${worst.toFixed(2)}; it must be 4 or less.`);
                }
            }
        } finally {
            await page.close();
        }
        console.log(`F8-2 covers checked ${rows.length}, failures ${failures.length}`);
        expect(failures, failures.join('\n')).toEqual([]);
    }, 900_000);

    it('F8-3: the workbook page 1 keeps the leaf size and the line art source', async () => {
        const readers = await loadReaders();
        const week = weekOne();
        const row = weekOneRows().find((entry) => entry.slug === 'hello');
        expect(row, 'the week 1 holds the reader "Hello!".').toBeDefined();
        const html = readers.compileStorytimeReaders([week], {
            profile: STORYTIME_PRINT_PROFILE,
            mode: 'final',
            output: 'workbook',
            bookTitle: row!.title,
        }).html;
        const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-f8-'));
        scratch.push(folder);
        const file = path.join(folder, 'page.html');
        fs.writeFileSync(file, html);
        const page = await context!.newPage();
        let box: { widthMm: number; heightMm: number; src: string };
        try {
            await page.emulateMedia({ media: 'print' });
            await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() => Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined))));
            const measured = await page.evaluate(() => {
                const element = document.querySelector('.quest-cover-picture');
                if (!element) return null;
                const rect = element.getBoundingClientRect();
                const image = element.querySelector('img[data-part="art"]');
                return {
                    widthMm: (rect.width * 25.4) / 96,
                    heightMm: (rect.height * 25.4) / 96,
                    src: image ? (image as HTMLImageElement).src : '',
                };
            });
            expect(measured, 'the workbook page 1 holds a quest cover picture.').not.toBeNull();
            box = measured!;
        } finally {
            await page.close();
        }
        console.log(
            `F8-3 the workbook page 1 of "${row!.title}": the quest cover picture holds ${box.widthMm.toFixed(2)} x ${box.heightMm.toFixed(2)} mm`,
        );
        expect(
            Math.abs(box.widthMm - STORYTIME_PRINT_PROFILE.readerPage.widthMm),
            'the quest cover picture of the workbook page 1 keeps the leaf width.',
        ).toBeLessThanOrEqual(0.5);
        expect(
            Math.abs(box.heightMm - STORYTIME_PRINT_PROFILE.readerPage.heightMm),
            'the quest cover picture of the workbook page 1 keeps the leaf height.',
        ).toBeLessThanOrEqual(0.5);
        expect(
            fileURLToPath(box.src),
            'the workbook page 1 keeps the line art source.',
        ).toBe(path.join(PICTURES_DIR, HELLO_LINE_FILE));
    }, 600_000);
});
