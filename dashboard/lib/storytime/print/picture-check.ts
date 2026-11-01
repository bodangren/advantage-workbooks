import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

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

/**
 * The two facts of one picture-list row that the Forge manifest gives (spec FR-9): the color file
 * and the line-art file of the selected candidate, each with the row id that Forge keys on.
 */
export interface StorytimeForgePictureEntry {
    /** The file name of the candidate color file or of its line art. */
    fileName: string;
    /** The picture-list row id of the job. */
    rowId: string;
    /** The SHA-256 of the file bytes, in lower-case hex. */
    sha256: string;
    /** The pixel size of the file. */
    pixelSize: { width: number; height: number };
}

/** One row of a batch check: the row id, the state, and the reason of a fail (spec FR-9, rule 6.6). */
export interface StorytimePictureBatchResult {
    /** The picture-list row id of the check. */
    rowId: string;
    /** `pass` when the two files meet stage 1, else `fail`. */
    status: 'pass' | 'fail';
    /** Why the row failed; absent on a pass. */
    reason?: string;
}

/** The stage-1 report of a whole batch: one result for each row, and the exit code of the command. */
export interface StorytimePictureBatchReport {
    /** One result for each requested row, in the order of the request. */
    results: StorytimePictureBatchResult[];
    /** 0 when every row passes, 1 when a row fails. */
    exitCode: number;
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

/**
 * The file name part of a manifest path. The delivery contract (PM, 2026-11-01) gives each
 * manifest path a free folder prefix, so the check matches a row by this part.
 * @param file A file name or a relative path.
 * @returns The last part of the path.
 */
const filePart = (file: string): string => path.basename(file);

/** A required field of the row; the check names the missing field. */
function requireString(value: unknown, name: string): string {
    if (typeof value !== 'string' || !value) throw new Error(`picture check: the row has no ${name}`);
    return value;
}

/** A required text; the caller gives the full message, so that the Forge facts read well. */
function requireText(value: unknown, message: string): string {
    if (typeof value !== 'string' || !value) throw new Error(message);
    return value;
}

/** A required object; the caller gives the full message. */
function requireObject(value: unknown, message: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
    return value as Record<string, unknown>;
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
 * Reads the manifest entry for one file name, or throws when the manifest does not hold it. The
 * delivery contract (PM, 2026-11-01) gives each manifest path a free folder prefix, so the entry
 * matches the row by the file name part of its path.
 * @param manifest The manifest entries as the batch wrote them.
 * @param fileName The file name of the picture-list row.
 * @returns The entry.
 * @throws Error When the manifest is not a list, or holds no entry for the file name.
 */
function entryOf(manifest: unknown, fileName: string): StorytimePictureManifestEntry {
    if (!Array.isArray(manifest)) throw new Error(`picture check: the manifest is not a list of entries (${fileName})`);
    const wanted = filePart(fileName);
    const entry = (manifest as StorytimePictureManifestEntry[]).find((candidate) => candidate && typeof candidate === 'object' && typeof candidate.fileName === 'string' && filePart(candidate.fileName) === wanted);
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
 * @param manifest The `manifest.json` entries of the batch; an entry matches a row by the file
 *   name part of its path.
 * @param row The picture-list row (`fileName`, `lineArtFileName`, `width`, `height`).
 * @param options The gray-fill limit; the default is `DEFAULT_GRAY_PIXEL_THRESHOLD`. When the
 *   caller gives `pictureListFileNames`, the manifest may also hold the entries of other known
 *   picture-list rows; without it, only the two entries of this row may appear (FR-9).
 * @returns The measured facts of the two files, for the batch log.
 * @throws Error On a color space, alpha, pixel size, gray fill, manifest name, SHA-256, or pixel size problem.
 */
export async function checkStorytimePicture(
    colorFile: string,
    lineFile: string,
    manifest: unknown,
    row: unknown,
    options: { grayPixelThreshold?: number; pictureListFileNames?: string[] } = {},
): Promise<StorytimePictureCheckResult> {
    if (!row || typeof row !== 'object') throw new Error('picture check: the row is not an object');
    const fields = row as Record<string, unknown>;
    const fileName = requireString(fields.fileName, 'color file name');
    const lineArtFileName = requireString(fields.lineArtFileName, 'line-art file name');
    const size = requireSize(fields);
    const threshold = options.grayPixelThreshold ?? DEFAULT_GRAY_PIXEL_THRESHOLD;
    if (!(threshold >= 0 && threshold <= 1)) throw new Error(`picture check: the gray-fill limit ${threshold} is not a share from 0 to 1`);
    // The manifest must name the two files of the row; the entries of other known picture-list
    // rows are allowed when the caller gives the list, and a name outside the list is a batch
    // error. The delivery contract (PM, 2026-11-01) matches a name by its file name part, because
    // the manifest path carries a free folder prefix.
    const colorEntry = entryOf(manifest, fileName);
    const lineEntry = entryOf(manifest, lineArtFileName);
    const listNames = options.pictureListFileNames;
    for (const entry of manifest as StorytimePictureManifestEntry[]) {
        if (filePart(entry.fileName) === filePart(fileName) || filePart(entry.fileName) === filePart(lineArtFileName)) continue;
        if (listNames?.some((name) => filePart(name) === filePart(entry.fileName))) continue;
        throw new Error(`picture check: the manifest names ${entry.fileName}, which is not a file name of the picture list row ${fileName} or ${lineArtFileName}`);
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

/** The SHA-256 of a Forge job file: the structural check first, then the job file hash. */
function forgeSha256(node: Record<string, unknown>, message: string): string {
    const structural = node.structural;
    const checked = structural && typeof structural === 'object' ? (structural as Record<string, unknown>).sha256 : undefined;
    const value = typeof checked === 'string' && checked ? checked : node.fileSha256;
    if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) throw new Error(message);
    return value.toLowerCase();
}

/** The pixel size of a Forge job file, from its structural check (FR-9). */
function forgePixelSize(node: Record<string, unknown>, message: string): { width: number; height: number } {
    const structural = node.structural;
    const check = structural && typeof structural === 'object' ? (structural as Record<string, unknown>) : {};
    const width = Number(check.width);
    const height = Number(check.height);
    if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) throw new Error(message);
    return { width, height };
}

/**
 * Adapts one job of the Forge `manifest.json` to the two entries that stage 1 reads (spec FR-9,
 * C-P4-1): the color file and the line-art file of the selected candidate, each with the row id
 * that Forge keys the job on. Forge writes `manifest.json` as one object with `jobs` and
 * `batches` (advantage-forge `src/storytime/book-pictures.ts` at 11a06b9c), so the check cannot
 * read the file directly.
 *
 * Only a ready job with a selected version and a ready candidate and line art give the two
 * files. A `pending` or `failed` job throws, because its files are not the final output.
 * @param manifest The Forge manifest object.
 * @param row The picture-list row; its `id` selects the job.
 * @returns The color entry, then the line-art entry.
 * @throws Error When the manifest holds no job for the row, the job or its candidate is not
 *   ready, the job holds no selected version, or a file fact is missing.
 */
export function forgeManifestEntriesForRow(manifest: unknown, row: unknown): StorytimeForgePictureEntry[] {
    const rowId = requireString(requireObject(row, 'picture check: the row is not an object').id, 'row id');
    const jobs = requireObject(manifest, `forge manifest: the manifest is not an object (row ${rowId})`).jobs;
    if (!Array.isArray(jobs)) throw new Error(`forge manifest: the manifest holds no jobs list (row ${rowId})`);
    const job = (jobs as unknown[])
        .map((entry) => requireObject(entry, `forge manifest: a job is not an object (row ${rowId})`))
        .find((entry) => entry.id === rowId);
    if (!job) throw new Error(`forge manifest: the manifest holds no job for the row ${rowId}`);
    const status = String(job.status ?? '');
    if (status !== 'ready') {
        throw new Error(`forge manifest: the job ${rowId} has status "${status || 'unknown'}"; only a ready job gives a picture`);
    }
    const selectedVersion = job.selectedVersion;
    if (selectedVersion === null || selectedVersion === undefined) {
        throw new Error(`forge manifest: the job ${rowId} has no selected version`);
    }
    const candidates = Array.isArray(job.candidates) ? (job.candidates as unknown[]) : [];
    const candidate = candidates
        .map((entry) => requireObject(entry, `forge manifest: a candidate is not an object (row ${rowId})`))
        .find((entry) => entry.version === selectedVersion);
    if (!candidate) throw new Error(`forge manifest: the job ${rowId} holds no candidate for the selected version ${String(selectedVersion)}`);
    const candidateStatus = String(candidate.status ?? '');
    if (candidateStatus !== 'ready') {
        throw new Error(`forge manifest: the candidate version ${String(selectedVersion)} of the job ${rowId} has status "${candidateStatus || 'unknown'}"; only a ready candidate gives a picture`);
    }
    const lineArt = requireObject(candidate.lineArt, `forge manifest: the candidate version ${String(selectedVersion)} of the job ${rowId} has no line art`);
    const lineStatus = String(lineArt.status ?? '');
    if (lineStatus !== 'ready') {
        throw new Error(`forge manifest: the line art of the job ${rowId} has status "${lineStatus || 'unknown'}"; only ready line art gives a picture`);
    }
    return [
        {
            fileName: requireText(candidate.file, `forge manifest: the candidate version ${String(selectedVersion)} of the job ${rowId} has no color file name`),
            rowId,
            sha256: forgeSha256(candidate, `forge manifest: the candidate version ${String(selectedVersion)} of the job ${rowId} has no SHA-256`),
            pixelSize: forgePixelSize(candidate, `forge manifest: the candidate version ${String(selectedVersion)} of the job ${rowId} has no pixel size`),
        },
        {
            fileName: requireText(lineArt.file, `forge manifest: the line art of the job ${rowId} has no file name`),
            rowId,
            sha256: forgeSha256(lineArt, `forge manifest: the line art of the job ${rowId} has no SHA-256`),
            pixelSize: forgePixelSize(lineArt, `forge manifest: the line art of the job ${rowId} has no pixel size`),
        },
    ];
}

/**
 * Reads `<batchFolder>/manifest.json`, the Forge batch manifest (spec FR-9).
 * @param batchFolder The folder that holds `manifest.json`.
 * @returns The parsed manifest.
 * @throws Error When the folder holds no `manifest.json`, or the file does not parse.
 */
export function readStorytimePictureManifest(batchFolder: string): unknown {
    const manifestFile = path.join(batchFolder, 'manifest.json');
    if (!fs.existsSync(manifestFile)) throw new Error(`picture batch: the batch folder holds no manifest.json: ${batchFolder}`);
    try {
        return JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    } catch (e) {
        throw new Error(`picture batch: the manifest.json does not parse: ${e instanceof Error ? e.message : String(e)}`);
    }
}

/**
 * The real path of the deepest entry that exists at or above `start`. A symbolic link is
 * followed here on purpose: the caller compares the result with the batch root, so a link that
 * leaves the root shows.
 * @param start The path to resolve.
 * @returns The real path of the deepest existing entry at or above `start`.
 * @throws Error When that entry is a symbolic link that does not resolve.
 */
function realPathOfDeepest(start: string): string {
    let probe = path.resolve(start);
    for (;;) {
        if (fs.lstatSync(probe, { throwIfNoEntry: false })) return fs.realpathSync(probe);
        const parent = path.dirname(probe);
        if (parent === probe) return probe;
        probe = parent;
    }
}

/**
 * The absolute path of one batch file, or a throw when the path leaves the batch root. The
 * delivery contract (PM, 2026-11-01) allows a free folder prefix inside the batch root only: a
 * `../` path, an absolute path, and a symbolic link out of the root each fail their row. The
 * first test is a `path.resolve` comparison with the batch root; the second test follows the
 * real path of the deepest existing entry, so a link out of the root shows.
 * @param batchFolder The batch root.
 * @param relative The manifest path of one file.
 * @param rowId The picture-list row id, for the message.
 * @returns The absolute path of the file under the batch root.
 * @throws Error When the path resolves outside the batch root, in the text or on the filesystem.
 */
function batchFileOf(batchFolder: string, relative: string, rowId: string): string {
    const root = path.resolve(batchFolder);
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(root + path.sep)) {
        throw new Error(`picture batch: the manifest path "${relative}" of the row ${rowId} resolves outside the batch root ${root}`);
    }
    const rootReal = realPathOfDeepest(root);
    let targetReal: string;
    try {
        targetReal = realPathOfDeepest(target);
    } catch (e) {
        throw new Error(`picture batch: the manifest path "${relative}" of the row ${rowId} is a symbolic link that does not resolve (${e instanceof Error ? e.message : String(e)})`);
    }
    if (targetReal !== rootReal && !targetReal.startsWith(rootReal + path.sep)) {
        throw new Error(`picture batch: the manifest path "${relative}" of the row ${rowId} follows a symbolic link outside the batch root ${root}`);
    }
    return target;
}

/**
 * Stage 1 of the picture stages for a whole Forge batch (spec FR-9, strategy 5.1, C-P4-1): reads
 * `<batchFolder>/manifest.json`, adapts each row of the request, and measures the two files of
 * each row. One result comes back for every requested row, in the request order, so that a failed
 * row never stops the rows after it. A manifest path may carry a free folder prefix inside the
 * batch root (delivery contract, PM, 2026-11-01); a path that resolves outside the root fails its
 * row with a reason that names the path.
 * @param rows The picture-list rows to check; each row id selects its Forge job.
 * @param batchFolder The folder that holds `manifest.json` and the picture files.
 * @returns One result for each row, and 0 or 1 as the exit code of a command.
 * @throws Error When the batch folder holds no `manifest.json`, or the file does not parse.
 */
export async function checkStorytimePictureBatch(rows: unknown[], batchFolder: string): Promise<StorytimePictureBatchReport> {
    const manifest = readStorytimePictureManifest(batchFolder);
    const results: StorytimePictureBatchResult[] = [];
    for (const row of rows) {
        const rowId = typeof (row as { id?: unknown } | null)?.id === 'string' ? String((row as { id: string }).id) : '';
        try {
            const entries = forgeManifestEntriesForRow(manifest, row);
            const colorFile = batchFileOf(batchFolder, entries[0].fileName, rowId);
            const lineFile = batchFileOf(batchFolder, entries[1].fileName, rowId);
            await checkStorytimePicture(colorFile, lineFile, entries, row);
            results.push({ rowId, status: 'pass' });
        } catch (e) {
            results.push({ rowId, status: 'fail', reason: e instanceof Error ? e.message : String(e) });
        }
    }
    return { results, exitCode: results.some((result) => result.status === 'fail') ? 1 : 0 };
}
