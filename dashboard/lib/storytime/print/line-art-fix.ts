import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { STORYTIME_ROOT } from '../files';
import type { StorytimePictureFile } from './picture-check';

/**
 * The line-art fix table (spec P9-A3, decisions D1 and D7 of the print audit): a print-only
 * replacement of one line-art file. The Forge files, `manifest.json`, and the batch hashes stay
 * byte equal, because the replacement is applied after the manifest SHA-256 check of
 * `resolveStorytimePictureFiles`. The week package does not change.
 */

/** The flood fill of one hair region (D7): the measured seed, area, and box of the closed region. */
export interface StorytimeLineArtFix {
    /** The seed pixel `[x, y]`; it must be an open pixel (gray value 128 or more). */
    seed: [number, number];
    /** The exact count of pixels in the region. */
    areaPx: number;
    /** The exact box of the region `[minX, minY, maxX, maxY]`, both ends included. */
    bbox: [number, number, number, number];
}

/** One entry of the fix table. */
export interface StorytimeLineArtFixEntry {
    /** The line-art file name that the Forge manifest gives. */
    sourceFile: string;
    /** The SHA-256 of the source bytes; only a file with these bytes gets the swap. */
    sourceSha256: string;
    /** The replacement file, as a path relative to `content/storytime/`. */
    replacement: string;
    /** The SHA-256 of the replacement bytes. */
    replacementSha256: string;
    /** `D1` for a replacement picture, `D7` for a hair fill. */
    reason: 'D1' | 'D7';
    /** The fill of a `D7` entry; a `D1` entry has none. */
    fill?: StorytimeLineArtFix;
}

/** The fix table, by picture row id. */
export type StorytimeLineArtFixTable = Record<string, StorytimeLineArtFixEntry>;

/** The data file of the table (Level 2). */
const FIX_TABLE_FILE = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures-line-fix.json');

/** The white threshold: a pixel with this gray value or more is open, a lower value is ink. */
const OPEN_MIN = 128;

/** The SHA-256 of one file, in lower-case hex. */
const sha256Of = (file: string): string => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/**
 * Reads the fix table from its data file. A content tree with no data file, such as a scratch
 * repository of a test, has an empty table, so no picture gets a swap.
 * @returns The table, by picture row id.
 * @throws Error When the data file is not valid JSON, or a read fails for a reason other than a missing file.
 */
export function readStorytimeLineArtFixTable(): StorytimeLineArtFixTable {
    let text: string;
    try {
        text = fs.readFileSync(FIX_TABLE_FILE, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
        throw error;
    }
    return JSON.parse(text) as StorytimeLineArtFixTable;
}

/**
 * Swaps the file of each `line` result that has a table entry (spec P9-A3). A result changes only
 * when the SHA-256 of its file equals `sourceSha256`, so a scratch copy with other bytes gets no
 * swap. The swap sets `file` to the replacement and keeps `fileName`. A `color` result and an
 * unlisted row never change.
 * @param files The resolved picture files, after the manifest SHA-256 check.
 * @param kind `color` or `line`, as the caller asked.
 * @param table The fix table; the data file when absent.
 * @returns A new array in the same order.
 * @throws Error When a replacement file is missing or its SHA-256 is not `replacementSha256`. The message starts with `line-art fix:`.
 */
export function applyStorytimeLineArtFixes(
    files: StorytimePictureFile[],
    kind: 'color' | 'line',
    table: StorytimeLineArtFixTable = readStorytimeLineArtFixTable(),
): StorytimePictureFile[] {
    return files.map((entry) => {
        if (kind !== 'line' || !Object.prototype.hasOwnProperty.call(table, entry.rowId)) return entry;
        const fix = table[entry.rowId];
        if (sha256Of(entry.file) !== fix.sourceSha256) return entry;
        const replacement = path.join(STORYTIME_ROOT, fix.replacement);
        if (!fs.existsSync(replacement)) {
            throw new Error(`line-art fix: the replacement ${fix.replacement} of the row ${entry.rowId} is missing`);
        }
        if (sha256Of(replacement) !== fix.replacementSha256) {
            throw new Error(`line-art fix: the SHA-256 of the replacement ${fix.replacement} of the row ${entry.rowId} is not the table SHA-256`);
        }
        return { ...entry, file: replacement };
    });
}

/**
 * Fills one closed open region of a line-art image with black (spec P9-A5, D7). The region is the
 * 4-connected set of open pixels that holds the seed. The function refuses a seed on ink, a region
 * that touches the image border, a region with another area, and a region with another box. It
 * sets each pixel of the region to 0 and changes no other pixel.
 * @param gray The image as 8-bit gray: the pixel data, the width, and the height.
 * @param fill The measured seed, area, and box of the region.
 * @returns A new buffer of the same length. The source buffer stays as it was.
 * @throws Error When a rule above fails. The message starts with `line-art fill:`.
 */
export function fillStorytimeLineArtHair(gray: { data: Uint8Array; width: number; height: number }, fill: StorytimeLineArtFix): Uint8Array {
    const { data, width, height } = gray;
    const [seedX, seedY] = fill.seed;
    if (!Number.isInteger(seedX) || !Number.isInteger(seedY) || seedX < 0 || seedY < 0 || seedX >= width || seedY >= height) {
        throw new Error(`line-art fill: the seed ${seedX},${seedY} lies outside the ${width} x ${height} image`);
    }
    if (data[seedY * width + seedX] < OPEN_MIN) {
        throw new Error(`line-art fill: the seed ${seedX},${seedY} lies on an ink pixel`);
    }
    const out = Uint8Array.from(data);
    const region = new Uint8Array(width * height);
    const stack = new Int32Array(width * height);
    let top = 0;
    stack[top++] = seedY * width + seedX;
    region[seedY * width + seedX] = 1;
    let area = 0;
    let minX = seedX;
    let minY = seedY;
    let maxX = seedX;
    let maxY = seedY;
    const visit = (index: number): void => {
        if (region[index] || data[index] < OPEN_MIN) return;
        region[index] = 1;
        stack[top++] = index;
    };
    while (top > 0) {
        const index = stack[--top];
        const x = index % width;
        const y = (index - x) / width;
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
            throw new Error('line-art fill: the region touches the image border');
        }
        area += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        out[index] = 0;
        visit(index - 1);
        visit(index + 1);
        visit(index - width);
        visit(index + width);
    }
    if (area !== fill.areaPx) {
        throw new Error(`line-art fill: the region has ${area} pixels, not ${fill.areaPx}`);
    }
    const [boxMinX, boxMinY, boxMaxX, boxMaxY] = fill.bbox;
    if (minX !== boxMinX || minY !== boxMinY || maxX !== boxMaxX || maxY !== boxMaxY) {
        throw new Error(`line-art fill: the box is ${minX},${minY},${maxX},${maxY}, not ${fill.bbox.join(',')}`);
    }
    return out;
}
