import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { chromium, type Browser } from '@playwright/test';
import sharp from 'sharp';
import { REPO_ROOT } from '../../lib/lesson-package/files';
import {
    checkStorytimeCoverData,
    loadStorytimeCoverBooks,
    renderStorytimeCover,
    storytimeCoverCornerMode,
    storytimeCoverFileUrl,
    storytimeCoverMmToPx,
    STORYTIME_COVER_BOX,
    STORYTIME_COVER_LOGO_FILE,
    type StorytimeCoverBook,
} from '../../lib/storytime/print/covers';
import {
    composeStorytimeCoverPicture,
    storytimeCoverBlock,
} from '../../lib/storytime/print/cover-picture';

/**
 * The build of one Storytime Advantage student book cover (track storytime_covers_20261027):
 * the front PNG, the back PNG, the 2-page Chrome PDF, and, with `--print`, the PDF/X-1a print
 * file (spec FR-5). Run it under the heavy-job lock (plan rule, advantage-pr 0e091de).
 *
 * The picture of the front is the Forge 3D cast, cut out on white (D4). The corner radius of the
 * level card and of the unit summary panel is flattened into the opaque picture layer, so the
 * page text stays text and the PDF/X file holds no soft mask.
 */

const USAGE = `Builds the cover of one Storytime Advantage student book (spec FR-5):
the front PNG, the back PNG, and the 2-page Chrome PDF (front, back), with --print the
PDF/X-1a print file too. Run it under the heavy-job lock.

Usage: npx tsx scripts/storytime/make-storytime-book-cover.ts --level <n> --unit <m> --out <dir> [--print] [--data <books.json>] [--version <n>]

  --level     The level of the book, 1 to 4
  --unit      The unit of the book, 1 to 4
  --out       The output folder: front.png, back.png, cover.pdf, corner-mode.txt
  --print     Also write the PDF/X-1a print file through scripts/print/make-pdfx.ts --keep-fonts
  --data      The data file of the 16 books (default: content/storytime/covers/books.json)
  --version   The version in the file name of the print file (default 1)

Exit code 1 when the data holds an error, when a picture file is missing, or when the PDF/X
checks fail. The build writes no deliverable in those cases.`;

/** The size of the PNG files: 300 ppi of A4 (spec FR-5.1). */
const PNG_SIZE = { width: 2480, height: 3508 };

/** The viewport of the screenshot, in CSS pixels: A4 at 96 ppi. */
const VIEWPORT = { width: 794, height: 1123 };

/** The dashboard folder, the root of the print scripts. */
const DASHBOARD_ROOT = path.join(REPO_ROOT, 'dashboard');

/**
 * The body of one cover document.
 * @param html The document.
 * @returns The body.
 */
function documentBody(html: string): string {
    return html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? '';
}

/**
 * Puts the front and the back in one document, so that the Chrome PDF holds two pages.
 * @param frontHtml The front document.
 * @param backHtml The back document.
 * @returns The document.
 */
function combineDocuments(frontHtml: string, backHtml: string): string {
    return frontHtml.replace('</body>', `${documentBody(backHtml)}</body>`);
}

/**
 * Renders one cover document to a PNG of the page size.
 * @param browser The browser.
 * @param htmlFile The document.
 * @param file The PNG file.
 */
async function renderPng(browser: Browser, htmlFile: string, file: string): Promise<void> {
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 4 });
    try {
        await page.goto(`file://${htmlFile}`, { waitUntil: 'load', timeout: 120000 });
        await page.evaluate('document.fonts.ready');
        await page.emulateMedia({ media: 'print' });
        const shot = await page.screenshot({ clip: { x: 0, y: 0, ...VIEWPORT } });
        await sharp(shot).resize(PNG_SIZE.width, PNG_SIZE.height, { fit: 'fill' }).removeAlpha().png().toFile(file);
    } finally {
        await page.close();
    }
}

/**
 * Prints one cover document to a Chrome PDF.
 * @param browser The browser.
 * @param htmlFile The document.
 * @param file The PDF file.
 * @returns The page count.
 */
async function renderPdf(browser: Browser, htmlFile: string, file: string): Promise<number> {
    const page = await browser.newPage({ viewport: VIEWPORT });
    try {
        await page.goto(`file://${htmlFile}`, { waitUntil: 'load', timeout: 120000 });
        await page.evaluate('document.fonts.ready');
        await page.emulateMedia({ media: 'print' });
        await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
    } finally {
        await page.close();
    }
    const info = execFileSync('pdfinfo', ['-box', file], { encoding: 'utf8' });
    return Number(info.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0);
}

/**
 * The file name of the print file (rule 12.2).
 * @param level The level of the book.
 * @param unit The unit of the book.
 * @param version The version of the print file.
 * @returns The file name.
 */
function pdfxFileName(level: number, unit: number, version: number): string {
    return `Storytime-Advantage-L${level}-U${unit}-Student-Book-Cover-v${version}_PDFX-1a.pdf`;
}

async function main(argv: string[]): Promise<number> {
    let level: number | undefined;
    let unit: number | undefined;
    let out: string | undefined;
    let dataFile: string | undefined;
    let version = 1;
    let print = false;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--level') level = Number(argv[++i]);
        else if (a === '--unit') unit = Number(argv[++i]);
        else if (a === '--out') out = path.resolve(argv[++i] ?? '');
        else if (a === '--data') dataFile = path.resolve(argv[++i] ?? '');
        else if (a === '--version') version = Number(argv[++i]);
        else if (a === '--print') print = true;
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    if (level === undefined || !Number.isInteger(level) || level < 1 || level > 4) {
        console.error(`--level must be a level of the series (1 to 4).\n\n${USAGE}`);
        return 2;
    }
    if (unit === undefined || !Number.isInteger(unit) || unit < 1 || unit > 4) {
        console.error(`--unit must be a unit of the series (1 to 4).\n\n${USAGE}`);
        return 2;
    }
    if (!out) {
        console.error(`--out is the output folder.\n\n${USAGE}`);
        return 2;
    }
    if (!Number.isInteger(version) || version < 1) {
        console.error(`--version must be 1 or more.\n\n${USAGE}`);
        return 2;
    }

    let book: StorytimeCoverBook | undefined;
    try {
        const data = loadStorytimeCoverBooks(dataFile);
        const errors = checkStorytimeCoverData(data);
        if (errors.length) {
            for (const error of errors) console.error(error);
            return 1;
        }
        book = data.books.find((row) => row.level === level && row.unit === unit);
        if (!book) {
            console.error(`No row for Level ${level} Unit ${unit} in the data file.`);
            return 1;
        }
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-cover-'));
    try {
        const pictureSize = {
            width: storytimeCoverMmToPx(STORYTIME_COVER_BOX.pictureArea.width),
            height: storytimeCoverMmToPx(STORYTIME_COVER_BOX.pictureArea.height),
        };
        const picture = await composeStorytimeCoverPicture(book.pictureRecipe, pictureSize, book.title);
        const pictureFile = path.join(tmp, 'cover-picture.png');
        fs.writeFileSync(pictureFile, picture);

        const cardFile = path.join(tmp, 'level-card.png');
        fs.writeFileSync(
            cardFile,
            await storytimeCoverBlock(
                {
                    width: storytimeCoverMmToPx(STORYTIME_COVER_BOX.levelCard.width),
                    height: storytimeCoverMmToPx(STORYTIME_COVER_BOX.levelCard.height),
                },
                book.levelColour,
                STORYTIME_COVER_BOX.levelCard.radiusMm,
            ),
        );

        let panelFile = '';
        if (book.summary) {
            panelFile = path.join(tmp, 'panel.png');
            fs.writeFileSync(
                panelFile,
                await storytimeCoverBlock(
                    {
                        width: storytimeCoverMmToPx(STORYTIME_COVER_BOX.panel.width),
                        height: storytimeCoverMmToPx(STORYTIME_COVER_BOX.panel.height),
                    },
                    '#F7F5F0',
                    STORYTIME_COVER_BOX.panel.radiusMm,
                    { colour: '#E1DDD3', widthMm: 0.4 },
                ),
            );
        }

        const assets = {
            picture: storytimeCoverFileUrl(pictureFile),
            card: storytimeCoverFileUrl(cardFile),
            panel: panelFile ? storytimeCoverFileUrl(panelFile) : '',
            logo: storytimeCoverFileUrl(STORYTIME_COVER_LOGO_FILE),
        };
        const { frontHtml, backHtml } = renderStorytimeCover(book, assets);
        const frontFile = path.join(tmp, 'front.html');
        const backFile = path.join(tmp, 'back.html');
        const bothFile = path.join(tmp, 'cover.html');
        fs.writeFileSync(frontFile, frontHtml);
        fs.writeFileSync(backFile, backHtml);
        fs.writeFileSync(bothFile, combineDocuments(frontHtml, backHtml));

        fs.mkdirSync(out, { recursive: true });
        const frontPng = path.join(out, 'front.png');
        const backPng = path.join(out, 'back.png');
        const chromePdf = path.join(out, 'cover.pdf');

        const browser = await chromium.launch({ channel: 'chrome' });
        let pages = 0;
        try {
            await renderPng(browser, frontFile, frontPng);
            await renderPng(browser, backFile, backPng);
            pages = await renderPdf(browser, bothFile, chromePdf);
        } finally {
            await browser.close();
        }

        fs.writeFileSync(path.join(out, 'corner-mode.txt'), storytimeCoverCornerMode());
        console.log(`Cover of ${book.title}: ${frontPng}, ${backPng}, ${chromePdf} (${pages} pages), corner mode ${storytimeCoverCornerMode()}`);

        if (print) {
            const pdfx = path.join(out, pdfxFileName(level, unit, version));
            execFileSync(
                process.execPath,
                ['--import', 'tsx', path.join(DASHBOARD_ROOT, 'scripts', 'print', 'make-pdfx.ts'), chromePdf, '--out', pdfx, '--keep-fonts'],
                { cwd: DASHBOARD_ROOT, stdio: 'inherit' },
            );
            console.log(`Print file: ${pdfx}`);
        }
        return 0;
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
}

main(process.argv.slice(2)).then(
    (code) => {
        process.exitCode = code;
    },
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
