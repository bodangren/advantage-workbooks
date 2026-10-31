import { createHash } from 'node:crypto';
import fs from 'node:fs';

/**
 * Stage 1 of the picture stages (spec FR-9, rule 6.6; plan Phase 4): the measurement check of one
 * picture-list row. It compares the color file and the line-art file with the row of the picture
 * list and with the Forge `manifest.json`:
 *
 * - the color file is PNG, 8-bit, sRGB, 3 channels, no alpha channel, at the pixel size of the row;
 * - the line art is PNG, 8-bit, grayscale (equal red, green, and blue values), at the same pixel
 *   size, with an opaque image and at least one ink pixel;
 * - the line art has no gray fill: the share of mid-gray pixels (32 to 223) stays at or under
 *   `DEFAULT_GRAY_PIXEL_THRESHOLD` (FR-9 "no gray fill or shading"; strategy 5.1 sets the
 *   rejection boundary at 2 percent, measured on the known-good line art of the Phase 4 Red
 *   tests, which gives about 0.07 percent);
 * - the manifest holds one entry for each of the two file names, and each entry agrees with the
 *   row and the file: the file name is a list name, the SHA-256 is the file hash, and the pixel
 *   size is the measured size.
 *
 * The 12 px line width and the closed outlines are stage 2 and stage 3 checks, not stage 1
 * (strategy 5.1). This check is never an approval (spec P7).
 */

/** The mid-gray band of the gray-fill check: the pixels that a gray fill puts on the page. */
const GRAY_MIN = 32;
const GRAY_MAX = 223;

/**
 * The gray-fill limit of stage 1: the largest share of mid-gray pixels that a line-art file may
 * hold (FR-9 "no gray fill or shading"; strategy 5.1: 2 percent). The known-good line-art fixture
 * of the Phase 4 Red tests gives about 0.07 percent, and a filled copy gives 100 percent.
 */
export const DEFAULT_GRAY_PIXEL_THRESHOLD = 0.02;

/** One entry of the Forge `manifest.json` of a batch (spec FR-9). */
export interface StorytimePictureManifestEntry {
    /** The file name of the batch file; it must be a file name of the picture list. */
    fileName: string;
    /** The SHA-256 of the file bytes, in lower-case hex. */
    sha256: string;
    /** The pixel size of the file. */
    pixelSize: { width: number; height: number };
}

/** The fields of a picture-list row that stage 1 reads (a subset of `StorytimePictureRow`). */
export interface StorytimePictureCheckRow {
    /** The color file name of the row. */
    fileName: string;
    /** The line-art file name of the row (the color name with `-line` before the version). */
    lineArtFileName: string;
    /** The pixel width of the FR-9 size class. */
    width: number;
    /** The pixel height of the FR-9 size class. */
    height: number;
}

/** What stage 1 measured, for the log of the batch (spec FR-9, rule 6.6). */
export interface StorytimePictureCheckResult {
    /** The color file that the check read. */
    color: { fileName: string; width: number; height: number };
    /** The line-art file that the check read. */
    line: { fileName: string; width: number; height: number };
    /** The share of mid-gray pixels of the line art, from 0 to 1. */
    grayPixelFraction: number;
    /** The gray-fill limit that the check used. */
    grayPixelThreshold: number;
}

/** The metadata facts of one picture file that stage 1 reads. */
interface PictureFacts {
    format: string;
    width: number;
    height: number;
    channels: number;
    depth: string;
    space: string;
    hasAlpha: boolean;
    /** The smallest alpha value of the file, or 255 when the file has no alpha channel. */
    minAlpha: number;
    /** The number of pixels with equal red, green, and blue values. */
    grayValuePixels: number;
    /** The number of pixels in the mid-gray band of the gray-fill check. */
    grayFillPixels: number;
    /** The number of pixels that are not white. */
    inkPixels: number;
}

/** The SHA-256 of one file, in lower-case hex. */
const sha256Of = (file: string): string => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/** A required field of the row; the check names the missing field. */
function requireString(value: unknown, name: string): string {
    if (typeof value !== 'string' || !value) throw new Error(`picture check: the row has no ${name}`);
    return value;
}

/** The pixel size of the row; the check names a missing or wrong field. */
function requireSize(row: Record<string, unknown>): { width: number; height: number } {
    const width = Number(row.width);
    const height = Number(row.height);
    if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
        throw new Error(`picture check: the row pixel size is missing or wrong (${String(row.width)} × ${String(row.height)})`);
    }
    return { width, height };
}

/**
 * Reads the manifest entry for one file name, or throws when the manifest does not hold it.
 * @param manifest The manifest entries as the batch wrote them.
 * @param fileName The file name of the picture-list row.
 * @returns The entry.
 * @throws Error When the manifest is not a list, or holds no entry for the file name.
 */
function entryOf(manifest: unknown, fileName: string): StorytimePictureManifestEntry {
    if (!Array.isArray(manifest)) throw new Error(`picture check: the manifest is not a list of entries (${fileName})`);
    const entry = (manifest as StorytimePictureManifestEntry[]).find((candidate) => candidate && typeof candidate === 'object' && candidate.fileName === fileName);
    if (!entry) throw new Error(`picture check: the manifest holds no entry for the file name ${fileName}`);
    return entry;
}

/**
 * Measures one picture file: the format, the pixel size, the channels, the alpha, the gray-value
 * share, the mid-gray share, and the ink.
 * @param file The file on disk.
 * @returns The measured facts.
 */
async function measure(file: string): Promise<PictureFacts> {
    const sharp = (await import('sharp')).default;
    const meta = await sharp(file).metadata();
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    const channels = info.channels;
    let minAlpha = 255;
    let grayValuePixels = 0;
    let grayFillPixels = 0;
    let inkPixels = 0;
    for (let i = 0; i < data.length; i += channels) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const alpha = channels > 3 ? data[i + 3] : 255;
        if (alpha < minAlpha) minAlpha = alpha;
        if (red === green && green === blue) grayValuePixels++;
        if (red >= GRAY_MIN && red <= GRAY_MAX) grayFillPixels++;
        if (red !== 255 || green !== 255 || blue !== 255) inkPixels++;
    }
    return {
        format: String(meta.format ?? ''),
        width: info.width,
        height: info.height,
        channels,
        depth: String(meta.depth ?? ''),
        space: String(meta.space ?? ''),
        hasAlpha: meta.hasAlpha === true,
        minAlpha,
        grayValuePixels,
        grayFillPixels,
        inkPixels,
    };
}

/** The pixel size of a file against the row (FR-9: the line art keeps the size of its class). */
function checkSize(facts: PictureFacts, size: { width: number; height: number }, what: string): void {
    if (facts.width !== size.width || facts.height !== size.height) {
        throw new Error(`picture check: ${what} pixel size is ${facts.width} × ${facts.height}, the row says ${size.width} × ${size.height}`);
    }
}

/** The 8-bit format of both outputs (FR-9). */
function checkFormat(facts: PictureFacts, what: string): void {
    if (facts.format !== 'png') throw new Error(`picture check: ${what} is not a PNG (format ${facts.format || 'unknown'})`);
    if (facts.depth !== 'uchar') throw new Error(`picture check: ${what} is not 8-bit (depth ${facts.depth || 'unknown'})`);
}

/**
 * The color output of a row (FR-9): PNG, 8-bit, sRGB, 3 channels, no alpha channel, at the pixel
 * size of the row. A CMYK file, an alpha channel, and a wrong size each stop the check.
 * @param facts The measured facts of the color file.
 * @param size The pixel size of the row.
 * @param fileName The color file name, for the messages.
 */
function checkColor(facts: PictureFacts, size: { width: number; height: number }, fileName: string): void {
    checkSize(facts, size, `the color file ${fileName}`);
    if (facts.space === 'cmyk' || facts.channels === 4 && !facts.hasAlpha) {
        throw new Error(`picture check: the color file ${fileName} is CMYK; FR-9 gives an sRGB color file (Workbooks converts to CMYK in make-pdfx.ts)`);
    }
    if (facts.hasAlpha || facts.channels === 4) {
        throw new Error(`picture check: the color file ${fileName} has an alpha channel; FR-9 gives an opaque color file`);
    }
    if (facts.channels !== 3 || (facts.space !== 'srgb' && facts.space !== 'rgb')) {
        throw new Error(`picture check: the color file ${fileName} is not 8-bit sRGB with 3 channels (${facts.space}, ${facts.channels} channels)`);
    }
    checkFormat(facts, `the color file ${fileName}`);
}

/**
 * The line-art output of a row (FR-9): PNG, 8-bit, grayscale, opaque, with ink and no gray fill,
 * at the pixel size of the row. A color file in the line-art place has channels of 3 and no ink
 * in a gray value, so the gray-value and ink rules stop it.
 * @param facts The measured facts of the line-art file.
 * @param size The pixel size of the row.
 * @param fileName The line-art file name, for the messages.
 * @param threshold The gray-fill limit, from 0 to 1.
 * @returns The share of mid-gray pixels.
 */
function checkLine(facts: PictureFacts, size: { width: number; height: number }, fileName: string, threshold: number): number {
    checkSize(facts, size, `the line art ${fileName}`);
    if (facts.space === 'cmyk') throw new Error(`picture check: the line art ${fileName} is CMYK; FR-9 gives a grayscale line-art file`);
    if (facts.minAlpha !== 255) {
        throw new Error(`picture check: the line art ${fileName} has a transparent pixel (alpha ${facts.minAlpha}); FR-9 gives an opaque white background`);
    }
    checkFormat(facts, `the line art ${fileName}`);
    const pixels = facts.width * facts.height;
    if (facts.grayValuePixels !== pixels) {
        throw new Error(`picture check: the line art ${fileName} is not grayscale (${facts.grayValuePixels} of ${pixels} pixels hold equal red, green, and blue values)`);
    }
    if (facts.inkPixels === 0) {
        throw new Error(`picture check: the line art ${fileName} holds no ink (every pixel is white); a color file in the line-art place is not a grayscale line art`);
    }
    const fraction = facts.grayFillPixels / pixels;
    if (fraction > threshold) {
        throw new Error(`picture check: the line art ${fileName} has a gray fill: ${(fraction * 100).toFixed(2)} % of the pixels are in the gray band ${GRAY_MIN} to ${GRAY_MAX}, the limit is ${(threshold * 100).toFixed(2)} %`);
    }
    return fraction;
}

/**
 * Stage 1 of the picture stages (spec FR-9, strategy 5.1): measures the two outputs of one
 * picture-list row and compares them with the row and with the Forge manifest.
 * @param colorFile The color PNG file on disk.
 * @param lineFile The line-art PNG file on disk.
 * @param manifest The batch `manifest.json` entries.
 * @param row The picture-list row (`fileName`, `lineArtFileName`, `width`, `height`).
 * @param options The gray-fill limit; the default is `DEFAULT_GRAY_PIXEL_THRESHOLD`.
 * @returns The measured facts of the two files, for the batch log.
 * @throws Error On a color space, alpha, pixel size, gray fill, manifest name, SHA-256, or pixel size problem.
 */
export async function checkStorytimePicture(
    colorFile: string,
    lineFile: string,
    manifest: unknown,
    row: unknown,
    options: { grayPixelThreshold?: number } = {},
): Promise<StorytimePictureCheckResult> {
    if (!row || typeof row !== 'object') throw new Error('picture check: the row is not an object');
    const fields = row as Record<string, unknown>;
    const fileName = requireString(fields.fileName, 'color file name');
    const lineArtFileName = requireString(fields.lineArtFileName, 'line-art file name');
    const size = requireSize(fields);
    const threshold = options.grayPixelThreshold ?? DEFAULT_GRAY_PIXEL_THRESHOLD;
    if (!(threshold >= 0 && threshold <= 1)) throw new Error(`picture check: the gray-fill limit ${threshold} is not a share from 0 to 1`);
    // The manifest must name the two files of the row; a name outside the list is a batch error.
    const colorEntry = entryOf(manifest, fileName);
    const lineEntry = entryOf(manifest, lineArtFileName);
    for (const entry of manifest as StorytimePictureManifestEntry[]) {
        if (entry.fileName !== fileName && entry.fileName !== lineArtFileName) {
            throw new Error(`picture check: the manifest names ${entry.fileName}, which is not a file name of the picture list row ${fileName} or ${lineArtFileName}`);
        }
    }
    for (const file of [colorFile, lineFile]) {
        if (!fs.existsSync(file)) throw new Error(`picture check: the file does not exist: ${file}`);
    }
    const colorFacts = await measure(colorFile);
    const lineFacts = await measure(lineFile);
    checkColor(colorFacts, size, fileName);
    const grayPixelFraction = checkLine(lineFacts, size, lineArtFileName, threshold);
    // The manifest must agree with the files it describes: the pixel size and the SHA-256.
    for (const [entry, facts, file] of [
        [colorEntry, colorFacts, colorFile],
        [lineEntry, lineFacts, lineFile],
    ] as const) {
        const declared = entry.pixelSize;
        if (!declared || declared.width !== facts.width || declared.height !== facts.height) {
            throw new Error(`picture check: the manifest pixel size of ${entry.fileName} is not the file size ${facts.width} × ${facts.height}`);
        }
        if (String(entry.sha256).toLowerCase() !== sha256Of(file)) {
            throw new Error(`picture check: the manifest SHA-256 of ${entry.fileName} is not the file hash`);
        }
    }
    return {
        color: { fileName, width: colorFacts.width, height: colorFacts.height },
        line: { fileName: lineArtFileName, width: lineFacts.width, height: lineFacts.height },
        grayPixelFraction,
        grayPixelThreshold: threshold,
    };
}
