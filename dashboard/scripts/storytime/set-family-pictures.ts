import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { familyCardPageHtml, type StorytimeFamilyCardSource } from '../../lib/storytime/family-pictures';

/**
 * The family-word pictures of the Storytime app (Phase 10, spec FR 2, decisions H5 and H6): the
 * raster export of one color patch or one number card. The script builds the page of the module,
 * screenshots it in Chrome at twice the page size, and encodes the JPEG at quality 82, or lower at
 * 75 or more when 82 gives more than 150 KB. The full script of the phase follows this export.
 *
 * The script runs only inside a heavy-run job, because it starts Chrome.
 */

/** The usage text of the script. */
const USAGE = `Sets the family-word pictures of the Storytime app.

Usage: npx tsx scripts/storytime/set-family-pictures.ts --level <n> --week <n> --cards <folder> [--forge <folder>] [--partial] [--check]`;

/** The size of the page and of the screenshot, in CSS pixels (decision H5). */
const PAGE_SIZE = 400;

/** The scale factor of the screenshot, so that the JPEG is 800 x 800 pixels (decisions H5, H6). */
const DEVICE_SCALE = 2;

/** The largest byte length of one JPEG: 150 KB (decision H6). */
const MAX_JPEG_BYTES = 150 * 1024;

/** The quality of the first encode (decision H6). */
const JPEG_QUALITY = 82;

/** The lowest quality of a second encode (decision H6). */
const JPEG_QUALITY_MIN = 75;

/** The background of the page, and the colour that an alpha channel blends with (decision H5). */
const PAGE_BACKGROUND = '#FFFFFF';

/** The timeout of one page load, in milliseconds. */
const PAGE_TIMEOUT_MS = 120_000;

/** The part of a picture source that the page and the render take: a color patch or a number card. */
type PatchOrDotsSource = StorytimeFamilyCardSource;

/** The JPEG of one card, and the quality of its encode. */
export interface RenderedFamilyCard {
    /** The progressive sRGB JPEG, 800 x 800 pixels, 150 KB or less. */
    jpeg: Buffer;
    /** The quality of the encode, from 75 to 82. */
    quality: number;
}

/**
 * Encodes one screenshot as a progressive sRGB JPEG of 150 KB or less (decision H6). The sharp
 * defaults apply: no mozjpeg, 4:2:0 chroma subsampling, and no metadata.
 * @param png The screenshot.
 * @returns The JPEG and the quality of the encode.
 * @throws Error When the lowest quality gives more than 150 KB.
 */
async function encodeJpeg(png: Buffer): Promise<RenderedFamilyCard> {
    for (let quality = JPEG_QUALITY; quality >= JPEG_QUALITY_MIN; quality -= 1) {
        const jpeg = await sharp(png)
            .flatten({ background: PAGE_BACKGROUND })
            .jpeg({ quality, progressive: true, chromaSubsampling: '4:2:0' })
            .toBuffer();
        if (jpeg.length <= MAX_JPEG_BYTES) return { jpeg, quality };
    }
    throw new Error(`family picture: the JPEG is above 150 KB at quality ${JPEG_QUALITY_MIN}`);
}

/**
 * Renders one color patch or one number card as a JPEG (decisions H5 and H6). The page is 400 x 400
 * CSS pixels and the screenshot has 2x device pixels, so the JPEG is 800 x 800 pixels. Two renders
 * of the same source give the same bytes.
 * @param source The color patch or the number card.
 * @returns The JPEG and the quality of the encode.
 */
export async function renderFamilyCardJpeg(source: PatchOrDotsSource): Promise<RenderedFamilyCard> {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-family-picture-'));
    const htmlFile = path.join(folder, 'picture.html');
    fs.writeFileSync(htmlFile, familyCardPageHtml(source));
    let png: Buffer = Buffer.alloc(0);
    try {
        const browser = await chromium.launch({ channel: 'chrome' });
        try {
            const page = await browser.newPage({
                viewport: { width: PAGE_SIZE, height: PAGE_SIZE },
                deviceScaleFactor: DEVICE_SCALE,
            });
            try {
                await page.goto(`file://${htmlFile}`, { waitUntil: 'load', timeout: PAGE_TIMEOUT_MS });
                await page.evaluate('document.fonts.ready');
                png = await page.screenshot({
                    clip: { x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE },
                    type: 'png',
                });
            } finally {
                await page.close();
            }
        } finally {
            await browser.close();
        }
    } finally {
        fs.rmSync(folder, { recursive: true, force: true });
    }
    if (png.length === 0) throw new Error('family picture: the screenshot is empty');
    return await encodeJpeg(png);
}

/**
 * Runs the script with the arguments of the command line. This task holds the usage error and
 * `--help`; the option set of the script arrives with its full body (spec FR 2).
 * @param argv The arguments after the file name.
 * @returns The exit code: 0 for `--help`, 2 for a usage error.
 */
export function main(argv: string[]): number {
    if (argv.length === 1 && (argv[0] === '--help' || argv[0] === '-h')) {
        console.log(USAGE);
        return 0;
    }
    console.error(USAGE);
    return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main(process.argv.slice(2));
}
