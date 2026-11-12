import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';
import { STORYTIME_ROOT } from '../files';

/** One edge fill row of the table: the geometry of a Forge colour cover art with white edge rows. */
export interface ArtEdgeFill {
    /** The width of the source in pixels. */
    widthPx: number;
    /** The height of the source in pixels. */
    heightPx: number;
    /** The count of the white rows at the top of the source, which the mirror fill replaces. */
    topRows: number;
    /** The count of the white rows at the bottom of the source, which the mirror fill replaces. */
    bottomRows: number;
    /** The SHA-256 of the source bytes; only a file with these bytes gets a filled copy. */
    sha256: string;
}

/** The edge fill table, by file name. */
export interface ArtEdgeFillTable {
    /** One entry per file name. */
    [fileName: string]: ArtEdgeFill;
}

/** The data file of the table (Level 2). */
const EDGE_FILL_FILE = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures-edge-fill.json');

/** The temp folder of the filled copies. */
const FILL_FOLDER_NAME = 'storytime-art-edge-fill';

/** The PNG signature. */
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** The CRC table of the PNG chunks. */
const CRC_TABLE: Uint32Array = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

/**
 * Reads the edge fill table from its data file. A content tree with no data file, such as a
 * scratch repository of a test, has an empty table, so no art gets a filled copy.
 * @returns The table, by file name.
 * @throws Error When the data file is not valid JSON, or a read fails for a reason other than a missing file.
 */
export function readArtEdgeFillTable(): ArtEdgeFillTable {
    let text: string;
    try {
        text = fs.readFileSync(EDGE_FILL_FILE, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
        throw error;
    }
    return JSON.parse(text) as ArtEdgeFillTable;
}

/**
 * Gives the CRC-32 of a PNG chunk.
 * @param bytes The chunk type and the chunk data.
 * @returns The CRC.
 */
function crc32(bytes: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

/**
 * Builds one PNG chunk.
 * @param type The four-letter chunk type.
 * @param data The chunk data.
 * @returns The chunk with its length and its CRC.
 */
function chunk(type: string, data: Buffer): Buffer {
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const head = Buffer.alloc(4);
    head.writeUInt32BE(data.length);
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc32(body));
    return Buffer.concat([head, body, tail]);
}

/**
 * Gives the Paeth predictor of the PNG filter 4.
 * @param a The byte to the left.
 * @param b The byte above.
 * @param c The byte above and to the left.
 * @returns The predictor.
 */
function paeth(a: number, b: number, c: number): number {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    return pb <= pc ? b : c;
}

/**
 * Decodes an 8-bit RGB PNG without interlacing, in the process, so that the fill stays synchronous.
 * @param png The PNG bytes.
 * @param label The file name for the error message.
 * @returns The size and the RGB pixels, row by row.
 * @throws Error When the file is not an 8-bit RGB PNG without interlacing.
 */
function decodeRgbPng(png: Buffer, label: string): { width: number; height: number; data: Buffer } {
    if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error(`edge fill: ${label} is not a PNG file`);
    let width = 0;
    let height = 0;
    let depth = 0;
    let colour = -1;
    let interlace = 0;
    const parts: Buffer[] = [];
    let offset = 8;
    while (offset + 8 <= png.length) {
        const length = png.readUInt32BE(offset);
        const type = png.toString('ascii', offset + 4, offset + 8);
        const start = offset + 8;
        if (type === 'IHDR') {
            width = png.readUInt32BE(start);
            height = png.readUInt32BE(start + 4);
            depth = png[start + 8];
            colour = png[start + 9];
            interlace = png[start + 12];
        } else if (type === 'IDAT') {
            parts.push(png.subarray(start, start + length));
        } else if (type === 'IEND') {
            break;
        }
        offset = start + length + 4;
    }
    if (depth !== 8 || colour !== 2 || interlace !== 0) {
        throw new Error(`edge fill: ${label} is not an 8-bit RGB PNG without interlacing`);
    }
    const channels = 3;
    const stride = width * channels;
    const raw = inflateSync(Buffer.concat(parts));
    if (raw.length < (stride + 1) * height) throw new Error(`edge fill: ${label} holds too few pixel bytes`);
    const out = Buffer.alloc(stride * height);
    const empty = Buffer.alloc(stride);
    let pos = 0;
    for (let y = 0; y < height; y++) {
        const filter = raw[pos++];
        const line = raw.subarray(pos, pos + stride);
        pos += stride;
        const cur = out.subarray(y * stride, (y + 1) * stride);
        const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : empty;
        if (filter === 0) {
            cur.set(line);
        } else if (filter === 1) {
            for (let x = 0; x < channels; x++) cur[x] = line[x];
            for (let x = channels; x < stride; x++) cur[x] = (line[x] + cur[x - channels]) & 0xff;
        } else if (filter === 2) {
            for (let x = 0; x < stride; x++) cur[x] = (line[x] + prev[x]) & 0xff;
        } else if (filter === 3) {
            for (let x = 0; x < channels; x++) cur[x] = (line[x] + (prev[x] >> 1)) & 0xff;
            for (let x = channels; x < stride; x++) cur[x] = (line[x] + ((cur[x - channels] + prev[x]) >> 1)) & 0xff;
        } else if (filter === 4) {
            for (let x = 0; x < channels; x++) cur[x] = (line[x] + prev[x]) & 0xff;
            for (let x = channels; x < stride; x++) cur[x] = (line[x] + paeth(cur[x - channels], prev[x], prev[x - channels])) & 0xff;
        } else {
            throw new Error(`edge fill: ${label} holds the unknown PNG filter ${filter} at row ${y}`);
        }
    }
    return { width, height, data: out };
}

/**
 * Encodes 8-bit RGB pixels as a PNG without interlacing.
 * @param width The width in pixels.
 * @param height The height in pixels.
 * @param data The RGB pixels, row by row.
 * @returns The PNG bytes.
 */
function encodeRgbPng(width: number, height: number, data: Buffer): Buffer {
    const stride = width * 3;
    const raw = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (stride + 1)] = 0;
        data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;
    header[9] = 2;
    return Buffer.concat([PNG_SIGNATURE, chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 3 })), chunk('IEND', Buffer.alloc(0))]);
}

/**
 * Gives the path of the print copy of a Forge colour cover art, with the white edge rows replaced
 * by a mirror of the art next to them, in one synchronous call. The rule: the output row r, for r
 * from 0 to topRows - 1, is the source row 2 * topRows - 1 - r; the output row r, for r from
 * heightPx - bottomRows to heightPx - 1, is the source row 2 * (heightPx - bottomRows) - 1 - r;
 * every other pixel equals the source. The source file is never changed, and nothing is written
 * under `content/`. The copy goes into the temp folder `storytime-art-edge-fill` with the name
 * `<first 16 hex of the source SHA-256>-<fileName>`, by a write to a scratch name and a rename, so
 * two runs at once never leave a half file.
 * @param sourcePath The path of the source file.
 * @param fileName The file name that selects the table entry.
 * @param table The edge fill table; the data file when it is missing.
 * @returns The path of the filled copy, or `sourcePath` when the name has no entry or the SHA-256 of
 *   the source bytes differs from the entry.
 * @throws Error When the SHA-256 matches and the source size differs from the entry, or the source
 *   is not an 8-bit RGB PNG.
 */
export function edgeFilledArtPathSync(sourcePath: string, fileName: string, table: ArtEdgeFillTable = readArtEdgeFillTable()): string {
    const entry = Object.prototype.hasOwnProperty.call(table, fileName) ? table[fileName] : undefined;
    if (!entry) return sourcePath;
    const bytes = fs.readFileSync(sourcePath);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== entry.sha256) return sourcePath;
    const source = decodeRgbPng(bytes, fileName);
    if (source.width !== entry.widthPx || source.height !== entry.heightPx) {
        throw new Error(
            `edge fill: ${fileName} is ${source.width} x ${source.height} px, but the table says ${entry.widthPx} x ${entry.heightPx} px`,
        );
    }
    const stride = source.width * 3;
    const out = Buffer.from(source.data);
    const bottomStart = source.height - entry.bottomRows;
    for (let r = 0; r < entry.topRows; r++) {
        const from = 2 * entry.topRows - 1 - r;
        source.data.copy(out, r * stride, from * stride, (from + 1) * stride);
    }
    for (let r = bottomStart; r < source.height; r++) {
        const from = 2 * bottomStart - 1 - r;
        source.data.copy(out, r * stride, from * stride, (from + 1) * stride);
    }
    const folder = path.join(os.tmpdir(), FILL_FOLDER_NAME);
    fs.mkdirSync(folder, { recursive: true });
    const target = path.join(folder, `${digest.slice(0, 16)}-${fileName}`);
    const scratch = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(scratch, encodeRgbPng(source.width, source.height, out));
    fs.renameSync(scratch, target);
    return target;
}

/**
 * Gives the path of the print copy of a Forge colour cover art (see `edgeFilledArtPathSync` for the
 * rule). This is the call of the quest cover build.
 * @param sourcePath The path of the source file.
 * @param fileName The file name that selects the table entry.
 * @param table The edge fill table; the data file when it is missing.
 * @returns The path of the filled copy, or `sourcePath` when the name has no entry or the SHA-256 of
 *   the source bytes differs from the entry.
 * @throws Error When the SHA-256 matches and the source size differs from the entry.
 */
export async function edgeFilledArtPath(sourcePath: string, fileName: string, table: ArtEdgeFillTable = readArtEdgeFillTable()): Promise<string> {
    return edgeFilledArtPathSync(sourcePath, fileName, table);
}
