import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { chromium, type Browser } from '@playwright/test';
import sharp from 'sharp';
import { REPO_ROOT } from '../../lib/lesson-package/files';
import { coverBook, type CoverBook } from '../../lib/covers/catalogue';
import { CoverArtSchema, CoverDataSchema, CoverSeriesSchema } from '../../lib/covers/schema';
import { backText } from '../../lib/covers/back-text';
import { composeSide, cutWide, placeArt } from '../../lib/covers/compose';
import { COVER_FONT_FACES, backPage, coverDocument, frontPage } from '../../lib/covers/template';
import { fontFaceCss } from '../../lib/document-wrapper/print-fonts';
import { parsePdffonts, parsePdfinfo } from '../../lib/print/pdfx';
import { run } from '../../lib/print/render';

const USAGE = `Makes the cover of a Primary Advantage book from its data, its art, and the cover kit
(track book_covers_20261007).

Usage: npx tsx scripts/covers/make-cover.ts <book> [--front] [--back] [--print] [--draft] [--out-dir <dir>]

  <book>      A book folder name, for example quest-4 or origins-3.2
  --front     The front PNG: <out-dir>/PA-<Book>-Front Cover.png, 1474 x 2000 RGB
  --back      The back PNG: <out-dir>/PA-<Book>-Back Cover.png (needs content/covers/<book>.json
              and content/covers/series.json; fails on a copy-check error or text that is too long)
  --print     The print file: a 2-page Chrome PDF (front, back; 210 x 285 mm) in
              <dir>/chrome/<book>-cover.pdf, checked, then converted by scripts/print/make-pdfx.ts
              (fonts kept) to <dir>/Primary-Advantage-<Book>-Cover_PDFX-1a.pdf; <dir> is
              ~/Desktop/print-ready, or --out-dir when given
  --draft     Write the back PNG also when the text is too long (a warning, not an error), to see
              where the lines wrap
  --out-dir   Output folder (default: assets/ in the repo for PNGs, ~/Desktop/print-ready for --print)

The art comes from content/covers/<book>.json ("art": {"front", "back", "align"} or {"wide"});
without that file, from assets/PA-<Book>-background.png and assets/PA-<Book>-back-cover-background.png,
centered on the page.`;

/** The web PNG size (the size of the Origins 2 and 3.1 Canva PNGs). */
const PNG_SIZE = { width: 1474, height: 2000 };
/** The page in CSS px (210 x 285 mm). */
const PAGE_PX = { width: 794, height: 1077 };
/** The book page in points (210 x 285 mm), and how far a page may be from it (as `make-book-pdf.ts`). */
const PAGE_PT = { width: 595.28, height: 807.87, slack: 2 };
const PRINT_DIR = path.join(os.homedir(), 'Desktop', 'print-ready');

interface Kit {
    pixels: { width: number; height: number };
    layers: { frontFrame: string; backOverlay: string; badges: Record<string, string> };
}

const KIT_DIR = path.join(REPO_ROOT, 'assets', 'cover-kit');
const COVERS_DIR = path.join(REPO_ROOT, 'content', 'covers');
const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8'));

type Align = 'top' | 'center';

/** The front and back art of a book and their placement, from its cover data or from the default asset names. */
async function bookArt(book: CoverBook): Promise<{ front: Buffer; back: Buffer; align: { front: Align; back: Align } }> {
    const dataFile = path.join(COVERS_DIR, `${book.id}.json`);
    const art = fs.existsSync(dataFile)
        ? CoverArtSchema.parse((readJson(dataFile) as { art?: unknown }).art)
        : { front: `assets/${book.fileStem}-background.png`, back: `assets/${book.fileStem}-back-cover-background.png` };
    const read = (rel: string) => fs.readFileSync(path.join(REPO_ROOT, rel));
    if ('wide' in art) return { ...(await cutWide(read(art.wide))), align: { front: 'center', back: 'center' } };
    return { front: read(art.front), back: read(art.back), align: { front: art.align?.front ?? 'center', back: art.align?.back ?? 'center' } };
}

/** Renders one page of the cover document to a PNG of the web size. Throws when a text box is too long, unless `draft`. */
async function renderPng(browser: Browser, html: string, file: string, draft: boolean): Promise<void> {
    const page = await browser.newPage({ viewport: PAGE_PX, deviceScaleFactor: PNG_SIZE.width / PAGE_PX.width });
    try {
        await page.setContent(html, { waitUntil: 'load' });
        await page.waitForSelector('body[data-ready]');
        const overflow = await page.evaluate(() => document.body.dataset.overflow);
        if (overflow && !draft) throw new Error(`Text too long for its box: ${overflow}`);
        if (overflow) console.warn(`Draft: text too long for its box: ${overflow}`);
        const shot = await page.screenshot({ clip: { x: 0, y: 0, ...PAGE_PX } });
        await sharp(shot).resize(PNG_SIZE.width, PNG_SIZE.height, { fit: 'fill' }).removeAlpha().png().toFile(file);
    } finally {
        await page.close();
    }
}

/**
 * Prints the cover document to a Chrome PDF and checks it: two pages of 210 x 285 mm, no Type 3
 * font, every font embedded. Throws when a text box is too long.
 */
async function renderPdf(browser: Browser, html: string, file: string): Promise<string[]> {
    const page = await browser.newPage();
    try {
        await page.setContent(html, { waitUntil: 'load' });
        await page.waitForSelector('body[data-ready]');
        const overflow = await page.evaluate(() => document.body.dataset.overflow);
        if (overflow) throw new Error(`Text too long for its box: ${overflow}`);
        await page.pdf({ path: file, width: '210mm', height: '285mm', printBackground: true, preferCSSPageSize: true });
    } finally {
        await page.close();
    }
    const problems: string[] = [];
    const info = parsePdfinfo(run('pdfinfo', ['-box', file]));
    if (info.pages !== 2) problems.push(`${info.pages} pages (expected 2: front, back)`);
    if (Math.abs(info.width - PAGE_PT.width) > PAGE_PT.slack || Math.abs(info.height - PAGE_PT.height) > PAGE_PT.slack) problems.push(`page size ${info.width} x ${info.height} pt is not 210 x 285 mm`);
    const fonts = parsePdffonts(run('pdffonts', [file]));
    if (fonts.some((f) => f.type === 'Type 3')) problems.push('Type 3 font');
    if (fonts.some((f) => !f.embedded)) problems.push('a font is not embedded');
    return problems;
}

async function main(argv: string[]): Promise<number> {
    let id: string | undefined;
    let front = false;
    let back = false;
    let draft = false;
    let print = false;
    let outDir: string | undefined;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--front') front = true;
        else if (a === '--back') back = true;
        else if (a === '--draft') draft = true;
        else if (a === '--print') print = true;
        else if (a === '--out-dir') outDir = path.resolve(argv[++i]);
        else if (!a.startsWith('-') && !id) id = a;
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
    }
    if (print) front = back = true;
    if (!id || !(front || back)) {
        console.error(USAGE);
        return 2;
    }
    const book = coverBook(id);
    const kit = readJson(path.join(KIT_DIR, 'kit.json')) as Kit;
    const layer = (file: string) => fs.readFileSync(path.join(KIT_DIR, file));
    const art = await bookArt(book);
    const fontCss = fontFaceCss(COVER_FONT_FACES);
    const jpegUrl = (b: Buffer) => `data:image/jpeg;base64,${b.toString('base64')}`;
    const pages: { side: string; html: string }[] = [];
    if (front) {
        const picture = await composeSide(await placeArt(art.front, kit.pixels, art.align.front), [layer(kit.layers.frontFrame)]);
        pages.push({ side: 'Front', html: frontPage(book, jpegUrl(picture)) });
    }
    if (back) {
        const data = CoverDataSchema.parse(readJson(path.join(COVERS_DIR, `${book.id}.json`)));
        const series = CoverSeriesSchema.parse(readJson(path.join(COVERS_DIR, 'series.json')));
        const text = backText(book, data, series);
        const badge = book.badge ? kit.layers.badges[book.badge] : undefined;
        if (!badge) throw new Error(`${book.name}: no CEFR badge for level ${book.level} in the kit`);
        const picture = await composeSide(await placeArt(art.back, kit.pixels, art.align.back), [layer(kit.layers.backOverlay), layer(badge)]);
        pages.push({ side: 'Back', html: backPage(jpegUrl(picture), text) });
    }

    const browser = await chromium.launch({ channel: 'chrome' });
    let chromePdf: string | undefined;
    try {
        if (print) {
            chromePdf = path.join(outDir ?? PRINT_DIR, 'chrome', `${book.id}-cover.pdf`);
            fs.mkdirSync(path.dirname(chromePdf), { recursive: true });
            const problems = await renderPdf(browser, coverDocument(pages.map((p) => p.html), fontCss), chromePdf);
            if (problems.length) {
                console.error(`FAIL  ${chromePdf}: ${problems.join('; ')}`);
                return 1;
            }
            console.log(`Chrome PDF: ${chromePdf}`);
        } else {
            const pngDir = outDir ?? path.join(REPO_ROOT, 'assets');
            fs.mkdirSync(pngDir, { recursive: true });
            for (const p of pages) {
                const file = path.join(pngDir, `${book.fileStem}-${p.side} Cover.png`);
                await renderPng(browser, coverDocument([p.html], fontCss), file, draft);
                console.log(`${p.side}: ${file}`);
            }
        }
    } finally {
        await browser.close();
    }
    if (!chromePdf) return 0;
    const out = path.join(outDir ?? PRINT_DIR, `Primary-Advantage-${book.name.replace(/ /g, '-')}-Cover_PDFX-1a.pdf`);
    const pdfx = spawnSync('npx', ['tsx', path.join(process.cwd(), 'scripts', 'print', 'make-pdfx.ts'), chromePdf, '--out', out, '--keep-fonts'], { stdio: 'inherit' });
    return pdfx.status ?? 1;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
