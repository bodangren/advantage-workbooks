import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

/**
 * Folder prefixes that break out of an HTML attribute value (track storytime_print_r1_20261025,
 * Phase 4, Red 4i, finding B-P4-1). The delivery contract allows a free folder prefix inside the
 * picture folder, and a prefix can hold any character that a file name can hold. A prefix ends
 * with `/`; the `/` inside the third prefix makes the folder tree deeper.
 */
export const HOSTILE_PREFIXES = [
    'p" onerror="window.__pwn=1" x="<b>/',
    'q"><img src=x onerror=window.__pwn=2><i a="/',
    'r"></div><img src=x onerror=window.__pwn=3>/',
];

/** Folder prefixes with the characters that break a `file://` URL when the URL is not encoded: `#`, `?`, `%`, `'`, and a space. */
export const AWKWARD_PREFIXES = [
    'a#b/',
    'a?b/',
    'p%41%/',
    "it's/",
    'sp ace/',
    "all#?%' mix/",
];

/**
 * Version 1 jobs whose manifest paths carry a folder prefix. The prefixes repeat in turn, so each
 * prefix is used for several rows.
 * @param rowIds The picture-list row ids.
 * @param prefixes The folder prefixes; each ends with `/`, or the text is empty for no prefix.
 * @returns One job for each row id, in the given order.
 */
export function prefixedJobs(rowIds: string[], prefixes: string[]): PictureFolderJob[] {
    return rowIds.map((rowId, index) => {
        const prefix = prefixes[index % prefixes.length];
        return { rowId, version: 1, colorPath: `${prefix}${rowId}-v1.png`, linePath: `${prefix}${rowId}-line-v1.png` };
    });
}

/**
 * Reads the final HTML as a browser would read it and lists what is wrong with the printed pictures.
 * The check does not trust the raw string: it parses the HTML and counts attributes and elements.
 * 1. No element holds an event attribute (a name that starts with `on`).
 * 2. The raw `<img` count equals the picture count plus `strayImages`, and no picture element holds
 *    an element other than its one `img` with exactly the attributes `alt` and `src`.
 * 3. The `img` outside the picture elements are the `strayImages` of the build only.
 * 4. Each `img` source is a `file:` URL without a fragment or a query, and `fileURLToPath` gives
 *    the resolved path of the manifest file, which exists.
 * 5. `data-picture-file` holds the file name part of the manifest path.
 * @param html The compiled final HTML.
 * @param pictures The picture folder.
 * @param jobs The folder jobs; their paths carry the prefixes.
 * @param kind `line` for the line art, `color` for the color file.
 * @param strayImages The number of `img` elements that are not pictures (logo, QR); 0 for a reader.
 * @returns One text for each problem; an empty list means that the HTML is sound.
 */
export function pictureSourceProblems(html: string, pictures: string, jobs: PictureFolderJob[], kind: 'color' | 'line', strayImages = 0): string[] {
    const problems: string[] = [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const events = Array.from(doc.querySelectorAll('*')).flatMap((el) =>
        el.getAttributeNames().filter((name) => name.toLowerCase().startsWith('on')).map((name) => `${el.tagName.toLowerCase()}[${name}]`));
    if (events.length > 0) problems.push(`${events.length} event attribute(s) in the parsed HTML: ${events.slice(0, 4).join(', ')}`);
    const elements = Array.from(doc.querySelectorAll('[data-picture-id]'));
    if (elements.length === 0) problems.push('the build prints no picture element');
    const rawImages = (html.match(/<img\b/g) ?? []).length;
    if (rawImages !== elements.length + strayImages) problems.push(`the raw HTML holds ${rawImages} "<img", expected ${elements.length + strayImages} (${elements.length} pictures + ${strayImages} other)`);
    const allImages = doc.querySelectorAll('img').length;
    const pictureImages = doc.querySelectorAll('[data-picture-id] img').length;
    if (allImages - pictureImages !== strayImages) problems.push(`${allImages - pictureImages} img element(s) outside the picture elements, expected ${strayImages}`);
    const byId = new Map(jobs.map((job) => [job.rowId, job] as const));
    for (const el of elements) {
        const id = el.getAttribute('data-picture-id') ?? '';
        const job = byId.get(id);
        if (!job) { problems.push(`${id}: no folder job for this picture element`); continue; }
        const relative = (kind === 'line' ? job.linePath : job.colorPath) ?? '';
        const expected = path.resolve(pictures, relative);
        const inside = el.querySelectorAll('*');
        if (inside.length !== 1 || inside[0].tagName !== 'IMG') { problems.push(`${id}: the picture element holds ${inside.length} child element(s), expected one img`); continue; }
        const names = inside[0].getAttributeNames().sort();
        if (names.join(',') !== 'alt,src') problems.push(`${id}: the img attributes are [${names.join(', ')}], expected [alt, src]`);
        if (el.getAttribute('data-picture-file') !== path.basename(expected)) problems.push(`${id}: data-picture-file is ${el.getAttribute('data-picture-file')}, expected ${path.basename(expected)}`);
        const src = inside[0].getAttribute('src') ?? '';
        let decoded = '';
        try {
            const url = new URL(src);
            if (url.protocol !== 'file:') problems.push(`${id}: the img source is not a file: URL: ${src}`);
            if (url.hash !== '' || url.search !== '') problems.push(`${id}: the img source holds a fragment or a query: ${src}`);
            decoded = fileURLToPath(url);
        } catch (e) {
            problems.push(`${id}: the img source does not parse as a file URL (${e instanceof Error ? e.message : String(e)}): ${src}`);
            continue;
        }
        if (decoded !== expected) problems.push(`${id}: the img source decodes to ${decoded}, expected ${expected}`);
        else if (!fs.existsSync(decoded)) problems.push(`${id}: the decoded img source is not an existing file: ${decoded}`);
    }
    return problems;
}
