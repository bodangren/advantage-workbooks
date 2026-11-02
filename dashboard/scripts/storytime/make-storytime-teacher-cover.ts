import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { chromium, type Browser } from '@playwright/test';
import sharp from 'sharp';
import { BACK_LINES, richHtml } from '../../lib/covers/back-text';
import { REPO_ROOT } from '../../lib/lesson-package/files';
import {
    checkStorytimeCoverOutDir,
    checkStorytimeCoverThai,
    storytimeCoverFontCss,
    storytimeCoverMmToPx,
    storytimeCoverQrSvg,
    STORYTIME_COVER_BOX,
    STORYTIME_COVER_GROUND_TINTS,
    STORYTIME_LEVEL_COLOURS,
    STORYTIME_SERIES,
} from '../../lib/storytime/print/covers';
import {
    checkTeacherBookCoverArt,
    checkTeacherBookCoverCopy,
    checkTeacherBookCoverData,
    composeTeacherBookCoverSide,
    teacherBookCoverSizePx,
    TEACHER_BOOK_COVER_TRIM,
    type TeacherBookCoverData,
} from '../../lib/storytime/print/teacher-book-cover';

/**
 * The build of one Storytime Advantage teacher-book cover (track storytime_print_r1_20261025,
 * spec FR-6): the front PNG and the back PNG for Daniel, and, with `--print`, the 2-page Chrome
 * PDF and the PDF/X-1a print file. Run it under the heavy-job lock (plan rule, advantage-pr
 * 0e091de).
 *
 * Each side is one opaque picture (the Forge art on the ground tint of the level, and the cards
 * with their rounded corners), so the PDF/X file holds no soft mask. The text stays text.
 */

const USAGE = `Builds the cover of one Storytime Advantage teacher book (spec FR-6): the front PNG
and the back PNG. With --print it also writes the 2-page Chrome PDF and the PDF/X-1a print
file. Run it under the heavy-job lock.

Usage: npx tsx scripts/storytime/make-storytime-teacher-cover.ts --out <dir> [--level <n>] [--unit <m>] [--band <name>] [--front <png>] [--back <png>] [--print] [--version <n>]

  --out       The output folder: teacher-front.png, teacher-back.png, teacher-build-report.json,
              and with --print teacher-cover.pdf and the PDF/X-1a file. Required. The build
              resolves symbolic links first. A folder inside <home>/Desktop/print-ready/ must be
              new or empty: the build refuses a folder that holds any file, and it never
              overwrites a file there.
  --level     The level of the book, 1 to 4 (default 2)
  --unit      The unit of the book, 1 to 4 (default 1)
  --band      The band name: Seed, Sprout, Leaf, Bud, or Flower (default Sprout)
  --front     The Forge art of the front (default: the week 1 cast file of sprout-nan)
  --back      The Forge art of the back (default: the week 1 cast file of sprout-sam)
  --print     Also write the PDF/X-1a print file through scripts/print/make-pdfx.ts --keep-fonts:
              Storytime-Advantage-L<level>-U<unit>-Teachers-Book-TH-Cover-v<version>_PDFX-1a.pdf
  --version   The version in the file name of the print file (default 1)

Exit code 2 for a wrong argument (also a flag that needs a value and has none) or an output
folder that the rules refuse. Exit code 1 when the cover data or the cover text holds an error,
when an art file is missing or shows no figure, or when a build step fails. The build writes no
deliverable in the cases of exit code 1: it builds every file, the print file included, in a
staging folder, and it copies them to <dir> only after every step passes.`;

/** The size of the PNG files: 300 ppi of A4. */
const PNG_SIZE = teacherBookCoverSizePx(TEACHER_BOOK_COVER_TRIM);

/** The viewport of the screenshot, in CSS pixels: A4 at 96 ppi. */
const VIEWPORT = { width: 794, height: 1123 };

/** The dashboard folder, the root of the print scripts. */
const DASHBOARD_ROOT = path.join(REPO_ROOT, 'dashboard');

/** The cast file of the week 1 Forge art, from the repo root. */
const castFile = (name: string) => path.join(REPO_ROOT, 'content', 'storytime', 'l2', 'media', 'w01', 'forge', 'cast', name, 'front.png');

/** The panel of the back side, in millimetres: it holds the contact lines and the QR code. */
const BACK_PANEL = { left: 12, top: 194, width: 186, height: 62, radiusMm: 3 };

/** The places of the Forge art on each side, in millimetres. */
const ART_REGION = {
    front: { left: 20, top: 36, width: 170, height: 176 },
    back: { left: 20, top: 40, width: 170, height: 146 },
};

/** The CSS of the two sides. */
const SIDE_CSS = `
@page { size: 210mm 297mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body { font-family: 'Andika', 'Sarabun', sans-serif; font-synthesis: none; color: #1a1a1a; }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #ffffff; }
.page + .page { break-before: page; }
.page > img { position: absolute; left: 0; width: 210mm; display: block; }
.wordmark { position: absolute; top: 13mm; left: 0; width: 210mm; text-align: center; font-weight: 700; font-size: 30pt; white-space: nowrap; }
.card-text { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3.5mm; color: #ffffff; }
.level-line { font-weight: 700; font-size: 32pt; line-height: 1; }
.book-line { font-weight: 400; font-size: 20pt; line-height: 1; }
.band-line { font-weight: 700; font-size: 15pt; line-height: 1; }
.contact { position: absolute; font-size: 11.5pt; line-height: 1.62; color: #1a1a1a; }
.contact p { margin: 0; }
.contact .head { font-weight: 700; }
.ph { white-space: nowrap; }
.qr-box { position: absolute; }
.qr-box svg { display: block; width: 100%; height: 100%; }
.line-label { position: absolute; text-align: center; font-weight: 700; font-size: 11.5pt; }
`;

/**
 * Builds one picture of a cover side: the Forge cut-out on the ground tint, at the size of the
 * trim, with the figure kept in its own proportions inside the region.
 * @param file The cut-out file.
 * @param tint The ground tint of the level.
 * @param region The region of the figure, in millimetres.
 * @returns The opaque picture, as a PNG.
 */
async function groundWithFigure(
    file: string,
    tint: string,
    region: { left: number; top: number; width: number; height: number },
): Promise<Buffer> {
    const regionPx = {
        left: storytimeCoverMmToPx(region.left),
        top: storytimeCoverMmToPx(region.top),
        width: storytimeCoverMmToPx(region.width),
        height: storytimeCoverMmToPx(region.height),
    };
    const trimmed = await sharp(file).ensureAlpha().trim({ threshold: 1 }).toBuffer();
    const figure = await sharp(trimmed)
        .resize(regionPx.width, regionPx.height, { fit: 'inside', kernel: 'lanczos3' })
        .toBuffer({ resolveWithObject: true });
    const left = regionPx.left + Math.round((regionPx.width - figure.info.width) / 2);
    const top = regionPx.top + (regionPx.height - figure.info.height);
    return sharp({ create: { width: PNG_SIZE.width, height: PNG_SIZE.height, channels: 3, background: tint } })
        .composite([{ input: figure.data, left, top }])
        .removeAlpha()
        .png()
        .toBuffer();
}

/**
 * Draws one layer of rounded blocks at the size of the trim. The layer holds the corner radius,
 * so the composed side stays one opaque picture.
 * @param blocks The blocks, in millimetres.
 * @returns The layer, as a PNG with an alpha channel (the composer flattens it).
 */
async function blockLayer(
    blocks: Array<{ left: number; top: number; width: number; height: number; radiusMm: number; fill: string; stroke?: string }>,
): Promise<Buffer> {
    const rects = blocks
        .map((block) => {
            const stroke = block.stroke ? ` stroke="${block.stroke}" stroke-width="${storytimeCoverMmToPx(0.4)}"` : '';
            return `<rect x="${storytimeCoverMmToPx(block.left)}" y="${storytimeCoverMmToPx(block.top)}" width="${storytimeCoverMmToPx(block.width)}" height="${storytimeCoverMmToPx(block.height)}" rx="${storytimeCoverMmToPx(block.radiusMm)}" ry="${storytimeCoverMmToPx(block.radiusMm)}" fill="${block.fill}"${stroke}/>`;
        })
        .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PNG_SIZE.width}" height="${PNG_SIZE.height}">${rects}</svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
}

/** The rows that the top slice shares with the bottom slice, in pixels: they hide a seam. */
const SLICE_OVERLAP_PX = 4;

/**
 * Cuts a composed side into a top slice and a bottom slice. Chrome writes each slice as one image
 * that is half a page high, so no image has the size of the page. The pre-press check
 * (`make-pdfx.ts --check`) reads a page-size image as a page that Ghostscript flattened from
 * transparency, and it would fail a whole-side picture. The slices share a few rows, so the
 * join shows no seam.
 * @param side The composed side.
 * @param dir The folder of the slice files.
 * @param name The start of the slice file names.
 * @returns The two slice files, each with its top and its height in millimetres.
 */
async function sliceSide(side: Buffer, dir: string, name: string): Promise<Array<{ file: string; topMm: number; heightMm: number }>> {
    const half = Math.floor(PNG_SIZE.height / 2);
    const mm = (px: number) => (px / 300) * 25.4;
    const parts = [
        { top: 0, height: half + SLICE_OVERLAP_PX },
        { top: half, height: PNG_SIZE.height - half },
    ];
    const slices: Array<{ file: string; topMm: number; heightMm: number }> = [];
    for (const [index, part] of parts.entries()) {
        const file = path.join(dir, `${name}-${index + 1}.png`);
        await sharp(side).extract({ left: 0, top: part.top, width: PNG_SIZE.width, height: part.height }).withMetadata({ density: 300 }).png().toFile(file);
        slices.push({ file, topMm: mm(part.top), heightMm: mm(part.height) });
    }
    return slices;
}

/**
 * The image elements of the slices of a side.
 * @param slices The slices, from `sliceSide`.
 * @returns The HTML.
 */
function sliceImages(slices: Array<{ file: string; topMm: number; heightMm: number }>): string {
    return slices
        .map((slice) => `<img src="file://${slice.file}" alt="" style="top: ${slice.topMm.toFixed(4)}mm; height: ${slice.heightMm.toFixed(4)}mm;">`)
        .join('\n');
}

/**
 * Escapes the text of a cover.
 * @param text The text.
 * @returns The escaped text.
 */
function escapeText(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The HTML of one side of the cover.
 * @param body The body of the side.
 * @returns The HTML document.
 */
function sideDocument(body: string): string {
    return `<!doctype html><html><head><meta charset="utf-8"><style>${storytimeCoverFontCss()}${SIDE_CSS}</style></head>
<body>${body}</body></html>`;
}

/**
 * The page of the front side.
 * @param images The image elements of the composed picture.
 * @param colour The level colour.
 * @param level The level of the book.
 * @param unit The unit of the book.
 * @param band The band name.
 * @returns The page element.
 */
function frontPage(images: string, colour: string, level: number, unit: number, band: string): string {
    const card = STORYTIME_COVER_BOX.levelCard;
    return `<div class="page" data-side="front">${images}
<div class="wordmark" data-part="series-name" style="color:${colour}">${STORYTIME_SERIES}</div>
<div class="card-text" data-part="level-card" style="left: ${card.left}mm; top: ${card.top}mm; width: ${card.width}mm; height: ${card.height}mm;">
<div class="level-line">Level ${level} &middot; Unit ${unit}</div>
<div class="book-line">Teacher Book</div>
<div class="band-line">${escapeText(band)}</div>
</div></div>`;
}

/**
 * The page of the back side.
 * @param images The image elements of the composed picture.
 * @param colour The level colour.
 * @returns The page element.
 */
function backPage(images: string, colour: string): string {
    const box = STORYTIME_COVER_BOX;
    const contact = BACK_LINES.contact
        .map((line, index) => `<p${index === 0 ? ' class="head"' : ''}>${richHtml(line, true)}</p>`)
        .join('\n');
    return `<div class="page" data-side="back">${images}
<div class="wordmark" data-part="series-name" style="color:${colour}">${STORYTIME_SERIES}</div>
<div class="contact" data-part="contact" style="left: ${box.contact.left}mm; top: ${box.contact.top}mm; width: ${box.contact.width}mm;">
${contact}
</div>
<div class="qr-box" data-part="qr" style="right: ${box.qr.right}mm; top: ${box.qr.top}mm; width: ${box.qr.width}mm; height: ${box.qr.height}mm;">${storytimeCoverQrSvg()}</div>
<div class="line-label" data-part="line-label" style="right: ${box.lineLabel.right}mm; top: ${box.lineLabel.top}mm; width: ${box.lineLabel.width}mm; color:${colour}">LINE</div></div>`;
}

/**
 * Renders one document to a PNG of the page size.
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
        await sharp(shot)
            .resize(PNG_SIZE.width, PNG_SIZE.height, { fit: 'fill' })
            .removeAlpha()
            .withMetadata({ density: 300 })
            .png()
            .toFile(file);
    } finally {
        await page.close();
    }
}

/**
 * Prints the two-page document to a Chrome PDF.
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
    const info = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
    return Number(info.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0);
}

/**
 * The text of one page of a PDF.
 * @param file The PDF file.
 * @param page The page number, from 1.
 * @returns The text.
 */
function pdfPageText(file: string, page: number): string {
    return execFileSync('pdftotext', ['-f', String(page), '-l', String(page), file, '-'], { encoding: 'utf8' });
}

/**
 * The file name of the print file (rule 12.2): the stem of the teacher book print file, then
 * `-Cover`, so that a person pairs the two files by name.
 * @param level The level of the book.
 * @param unit The unit of the book.
 * @param version The version of the print file.
 * @returns The file name.
 */
function pdfxFileName(level: number, unit: number, version: number): string {
    return `Storytime-Advantage-L${level}-U${unit}-Teachers-Book-TH-Cover-v${version}_PDFX-1a.pdf`;
}

/**
 * Resolves a path through the symbolic links of its deepest existing ancestor, so that a path
 * that does not exist yet still compares equal to the real path of its folder. The cover module
 * of the cover track holds the same helper, but it does not export it.
 * @param target The path to resolve.
 * @returns The resolved path.
 */
function realPathOf(target: string): string {
    const missing: string[] = [];
    let probe = path.resolve(target);
    for (let hop = 0; hop < 64; hop++) {
        try {
            return path.join(fs.realpathSync(probe), ...missing);
        } catch {
            const parent = path.dirname(probe);
            if (parent === probe) return path.resolve(target);
            missing.unshift(path.basename(probe));
            probe = parent;
        }
    }
    return path.resolve(target);
}

/**
 * Checks an output folder inside the print-ready folder. The build never overwrites a file
 * there (FR-5.7 of the cover track, applied to this script), and it refuses a folder that holds
 * any file, so that an approved folder gains no file that nobody checked. A new or empty folder
 * passes. A folder outside the print-ready folder keeps its own rules. The check resolves
 * symbolic links first, so a link into the print-ready folder does not pass.
 * @param out The output folder.
 * @param files The names of the files that the build writes.
 * @param printReadyRoot The print-ready root.
 * @returns The errors (empty when the build may write).
 */
function checkNoOverwrite(out: string, files: string[], printReadyRoot: string): string[] {
    const root = realPathOf(printReadyRoot);
    const target = realPathOf(out);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) return [];
    const errors: string[] = [];
    for (const name of files) {
        const file = path.join(target, name);
        try {
            fs.lstatSync(file);
            errors.push(`The file "${file}" exists in the print-ready folder, and the build never overwrites it. Use a new folder or a new version.`);
        } catch {
            // No such file, so the build writes a new one.
        }
    }
    let entries: string[] = [];
    try {
        entries = fs.readdirSync(target);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOTDIR') errors.push(`The output path "${target}" is a file, not a folder.`);
    }
    if (entries.length) {
        errors.push(`The folder "${target}" in the print-ready folder holds ${entries.length} entries already. Use a new or an empty folder.`);
    }
    return errors;
}

async function main(argv: string[]): Promise<number> {
    let level = 2;
    let unit = 1;
    let band = 'Sprout';
    let out: string | undefined;
    let front = castFile('sprout-nan');
    let back = castFile('sprout-sam');
    let version = 1;
    let print = false;
    // A flag that needs a value takes the next argument. A missing value, an empty value, or
    // another flag in its place is an argument error (exit code 2).
    let missing: string | undefined;
    const valueOf = (flag: string, index: number): string => {
        const next = argv[index + 1];
        if (next === undefined || next === '' || next.startsWith('--')) {
            missing ??= flag;
            return '';
        }
        return next;
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--level') level = Number(valueOf(a, i++));
        else if (a === '--unit') unit = Number(valueOf(a, i++));
        else if (a === '--band') band = valueOf(a, i++);
        else if (a === '--out') out = path.resolve(valueOf(a, i++));
        else if (a === '--front') front = path.resolve(valueOf(a, i++));
        else if (a === '--back') back = path.resolve(valueOf(a, i++));
        else if (a === '--version') version = Number(valueOf(a, i++));
        else if (a === '--print') print = true;
        else {
            console.error(`Unknown argument: ${a}\n\n${USAGE}`);
            return 2;
        }
        if (missing) {
            console.error(`${missing} needs a value.\n\n${USAGE}`);
            return 2;
        }
    }
    if (!Number.isInteger(level) || level < 1 || level > 4) {
        console.error(`--level must be a level of the series (1 to 4).\n\n${USAGE}`);
        return 2;
    }
    if (!Number.isInteger(unit) || unit < 1 || unit > 4) {
        console.error(`--unit must be a unit of the series (1 to 4).\n\n${USAGE}`);
        return 2;
    }
    if (!Number.isInteger(version) || version < 1) {
        console.error(`--version must be 1 or more.\n\n${USAGE}`);
        return 2;
    }
    if (!out) {
        console.error(`--out is the output folder.\n\n${USAGE}`);
        return 2;
    }
    const printReadyRoot = path.join(os.homedir(), 'Desktop', 'print-ready');
    const outDirErrors = [
        ...checkStorytimeCoverOutDir(out, version, printReadyRoot),
        ...checkNoOverwrite(
            out,
            ['teacher-front.png', 'teacher-back.png', 'teacher-build-report.json', ...(print ? ['teacher-cover.pdf', pdfxFileName(level, unit, version)] : [])],
            printReadyRoot,
        ),
    ];
    if (outDirErrors.length) {
        for (const error of outDirErrors) console.error(error);
        return 2;
    }

    const data: TeacherBookCoverData = {
        title: `${STORYTIME_SERIES}, Level ${level}, Unit ${unit}, Teacher Book`,
        band,
        frontArt: front,
        backArt: back,
    };
    const dataErrors = checkTeacherBookCoverData(data);
    for (const file of [front, back]) {
        if (!fs.existsSync(file)) dataErrors.push(`The art file is missing: ${file}`);
    }
    if (dataErrors.length) {
        for (const error of dataErrors) console.error(error);
        return 1;
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-teacher-cover-'));
    try {
        const tint = STORYTIME_COVER_GROUND_TINTS[level];
        const colour = STORYTIME_LEVEL_COLOURS[level];
        const card = STORYTIME_COVER_BOX.levelCard;
        const frontLayer = await blockLayer([{ ...card, fill: colour }]);
        const backLayer = await blockLayer([{ ...BACK_PANEL, fill: '#F7F5F0', stroke: '#E1DDD3' }]);
        const frontGround = await groundWithFigure(front, tint, ART_REGION.front);
        const backGround = await groundWithFigure(back, tint, ART_REGION.back);
        // An art file with no visible figure (empty or fully transparent) gives a side with only
        // the ground tint, so the build stops here, as the student cover build does.
        const artErrors = [
            ...checkTeacherBookCoverArt(frontGround, tint).map((error) => `front art: ${error}`),
            ...checkTeacherBookCoverArt(backGround, tint).map((error) => `back art: ${error}`),
        ];
        if (artErrors.length) {
            for (const error of artErrors) console.error(error);
            return 1;
        }
        const frontSide = await composeTeacherBookCoverSide(frontGround, [frontLayer], TEACHER_BOOK_COVER_TRIM);
        const backSide = await composeTeacherBookCoverSide(backGround, [backLayer], TEACHER_BOOK_COVER_TRIM);
        for (const side of [frontSide, backSide]) {
            const meta = await sharp(side).metadata();
            if (meta.channels !== 3 || meta.width !== PNG_SIZE.width || meta.height !== PNG_SIZE.height) {
                console.error(`A composed side is ${meta.width} x ${meta.height} with ${meta.channels} channels; it must be ${PNG_SIZE.width} x ${PNG_SIZE.height} with 3 channels.`);
                return 1;
            }
        }
        const frontBody = frontPage(sliceImages(await sliceSide(frontSide, tmp, 'front-side')), colour, level, unit, band);
        const backBody = backPage(sliceImages(await sliceSide(backSide, tmp, 'back-side')), colour);
        const frontFile = path.join(tmp, 'front.html');
        const backFile = path.join(tmp, 'back.html');
        const bothFile = path.join(tmp, 'cover.html');
        fs.writeFileSync(frontFile, sideDocument(frontBody));
        fs.writeFileSync(backFile, sideDocument(backBody));
        fs.writeFileSync(bothFile, sideDocument(`${frontBody}\n${backBody}`));

        // The build renders into a staging folder and copies the files to the output folder only
        // after every check passes, so an error leaves no deliverable (and no half file).
        const stage = path.join(tmp, 'stage');
        fs.mkdirSync(stage);
        const frontPng = path.join(stage, 'teacher-front.png');
        const backPng = path.join(stage, 'teacher-back.png');
        const chromePdf = path.join(stage, 'teacher-cover.pdf');

        const browser = await chromium.launch({ channel: 'chrome' });
        let pages = 0;
        try {
            await renderPng(browser, frontFile, frontPng);
            await renderPng(browser, backFile, backPng);
            pages = await renderPdf(browser, bothFile, chromePdf);
        } finally {
            await browser.close();
        }

        const textErrors: string[] = [];
        if (pages !== 2) textErrors.push(`The cover PDF has ${pages} pages; it must have 2.`);
        for (const [index, side] of (['front', 'back'] as const).entries()) {
            const text = pdfPageText(chromePdf, index + 1);
            textErrors.push(...checkTeacherBookCoverCopy(text).map((error) => `${side}: ${error}`));
            textErrors.push(...checkStorytimeCoverThai(text, side).map((error) => `${side}: ${error}`));
            if (side === 'front' && !text.includes(band)) textErrors.push(`front: the page does not show the band name "${band}".`);
        }
        if (textErrors.length) {
            for (const error of textErrors) console.error(error);
            return 1;
        }

        const report = { title: data.title, level, unit, band, version, print, pages, frontArt: front, backArt: back };
        fs.writeFileSync(path.join(stage, 'teacher-build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
        // The print file is built in the staging folder too. A failed step throws here, and the
        // output folder is still untouched.
        if (print) {
            execFileSync(
                process.execPath,
                ['--import', 'tsx', path.join(DASHBOARD_ROOT, 'scripts', 'print', 'make-pdfx.ts'), chromePdf, '--out', path.join(stage, pdfxFileName(level, unit, version)), '--keep-fonts'],
                { cwd: DASHBOARD_ROOT, stdio: 'inherit' },
            );
        }
        fs.mkdirSync(out, { recursive: true });
        const written = ['teacher-front.png', 'teacher-back.png', ...(print ? ['teacher-cover.pdf'] : []), 'teacher-build-report.json'];
        if (print) written.push(pdfxFileName(level, unit, version));
        for (const name of written) fs.copyFileSync(path.join(stage, name), path.join(out, name));
        console.log(`Teacher-book cover of ${data.title}: ${written.map((name) => path.join(out, name)).join(', ')}${print ? ` (${pages} pages)` : ''}`);
        if (print) console.log(`Print file: ${path.join(out, pdfxFileName(level, unit, version))}`);
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
