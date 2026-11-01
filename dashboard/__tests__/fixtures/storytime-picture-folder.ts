import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * A fixture for the final-mode picture folder `content/storytime/l<level>/print/pictures/` (track
 * storytime_print_r1_20261025, Phase 4, Red 4g). In final mode the folder holds the Forge
 * `manifest.json` of the accepted delivery and its PNG files. This fixture writes such a folder in
 * a temporary repository. The files are small, and each file has its own bytes, so a swap of two
 * files changes the SHA-256.
 */

/** A one-pixel PNG; the fixture appends the file path after the PNG end chunk. */
const ONE_PIXEL_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

/**
 * The bytes of one fixture picture file.
 * @param relative The manifest path of the file; it makes the bytes unique.
 * @returns The bytes.
 */
export const fixtureBytes = (relative: string): Buffer => Buffer.concat([ONE_PIXEL_PNG, Buffer.from(`\n${relative}`)]);

/** The SHA-256 of some bytes, in lower-case hex. */
export const sha256OfBytes = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

/** One Forge job of the folder manifest. */
export interface PictureFolderJob {
    /** The picture-list row id; it is the Forge job `id`. */
    rowId: string;
    /** The candidate version N and the `selectedVersion` of the job. The default is 1. */
    version?: number;
    /** The manifest path of the color file. The default is `<row id>-v<version>.png`. */
    colorPath?: string;
    /** The manifest path of the line art. The default is `<row id>-line-v<version>.png`. */
    linePath?: string;
    /** The files that the folder does not hold, although the manifest names them. */
    omit?: Array<'color' | 'line'>;
}

/**
 * The jobs for some row ids: version 1 for each row, or the version in `versions`.
 * @param rowIds The picture-list row ids.
 * @param versions The redo version N of the rows that Forge redid.
 * @returns One job for each row id, in the given order.
 */
export function jobsFor(rowIds: string[], versions: Record<string, number> = {}): PictureFolderJob[] {
    return rowIds.map((rowId) => ({ rowId, version: versions[rowId] ?? 1 }));
}

/**
 * Writes the folder: the PNG files at their manifest paths under `folder`, and `manifest.json`
 * with one Forge job for each given job, in the given order. Each manifest SHA-256 is the hash of
 * the bytes that the fixture wrote. The manifest follows the shape of the Forge
 * `StorytimeManifest` that `picture-check.ts` reads (`jobs`, `candidates`, `lineArt`).
 * @param folder The picture folder; the fixture makes it.
 * @param jobs The jobs; two jobs may share a row id.
 */
export function writePictureFolder(folder: string, jobs: PictureFolderJob[]): void {
    fs.mkdirSync(folder, { recursive: true });
    const manifestJobs = jobs.map((job) => {
        const version = job.version ?? 1;
        const colorPath = job.colorPath ?? `${job.rowId}-v${version}.png`;
        const linePath = job.linePath ?? `${job.rowId}-line-v${version}.png`;
        const hashes = [colorPath, linePath].map((relative, index) => {
            const bytes = fixtureBytes(relative);
            if (!job.omit?.includes(index === 0 ? 'color' : 'line')) {
                const file = path.resolve(folder, relative);
                fs.mkdirSync(path.dirname(file), { recursive: true });
                fs.writeFileSync(file, bytes);
            }
            return sha256OfBytes(bytes);
        });
        const size = { width: 1, height: 1 };
        return {
            id: job.rowId, week: 1, bookKind: 'readalong', bookTitle: 'Hello!', page: 1,
            selectedVersion: version, selectedFile: colorPath, selectedSha256: hashes[0], status: 'ready',
            candidates: [{
                jobId: job.rowId, version, file: colorPath, fileSha256: hashes[0], status: 'ready',
                structural: { valid: true, ...size, sha256: hashes[0], errors: [] },
                lineArt: {
                    file: linePath, fileSha256: hashes[1], colorFile: colorPath, status: 'ready',
                    structural: { valid: true, ...size, sha256: hashes[1], errors: [] }, errors: [],
                },
            }],
        };
    });
    fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify({ version: 1, batchHashAlgorithm: 'sha256', jobs: manifestJobs, batches: [] }));
}
