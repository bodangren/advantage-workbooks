import jsQR from 'jsqr';
import sharp from 'sharp';
import { storytimeQrUrl } from '../files';
import type { StorytimeWeek } from '../schema';

/** A QR code that the decoder found on an image. */
export interface DecodedQr {
    /** The text that the code encodes. */
    data: string;
    /** The left edge of the code on the image, in pixels. */
    x: number;
    /** The top edge of the code on the image, in pixels. */
    y: number;
    /** The larger side of the box of the code, in pixels. */
    size: number;
}

/** A QR code that a book must print: its page and the address that it must encode. */
export interface ExpectedQr {
    page: number;
    week: number;
    address: string;
}

/** One line of the QR report. */
export interface QrRow {
    page: number;
    /** The decoded address, or `-` when no code was decoded for this line. */
    address: string;
    /** The expected address, or `-` when the page has no such code. */
    expected: string;
    status: 'pass' | 'fail';
    /** The reason of a failure; empty on a pass. */
    note: string;
}

/** The most codes that one image can hold: a guard against a loop that never ends. */
const MAX_CODES_PER_IMAGE = 24;

/**
 * Turns the SVG of a QR code into a PNG on a white ground.
 * @param svg The SVG text of `generateQRCode`.
 * @param pixels The side of the PNG in pixels.
 * @returns The PNG bytes.
 */
export async function qrSvgToPng(svg: string, pixels = 400): Promise<Buffer> {
    return sharp(Buffer.from(svg)).resize(pixels, pixels, { kernel: 'nearest' }).flatten({ background: '#ffffff' }).png().toBuffer();
}

/** The start positions of windows of `size` along a side of `length`: half a window apart, the last one at the end. */
function windowStarts(length: number, size: number): number[] {
    const starts = [0];
    while (starts[starts.length - 1] + size < length) starts.push(Math.min(starts[starts.length - 1] + Math.ceil(size / 2), length - size));
    return starts;
}

/** Finds every code of a pixel buffer, one at a time; each code found is painted white. The buffer changes. */
function decodeAll(pixels: Uint8ClampedArray, width: number, height: number): DecodedQr[] {
    const found: DecodedQr[] = [];
    while (found.length < MAX_CODES_PER_IMAGE) {
        const code = jsQR(pixels, width, height, { inversionAttempts: 'dontInvert' });
        if (!code) break;
        const corners = [code.location.topLeftCorner, code.location.topRightCorner, code.location.bottomLeftCorner, code.location.bottomRightCorner];
        const left = Math.min(...corners.map((c) => c.x)), right = Math.max(...corners.map((c) => c.x));
        const top = Math.min(...corners.map((c) => c.y)), bottom = Math.max(...corners.map((c) => c.y));
        const margin = Math.ceil(Math.max(right - left, bottom - top) * 0.08);
        // An empty text is a false hit of the decoder on a part of a page: it is painted over and not listed.
        if (code.data !== '') found.push({ data: code.data, x: Math.round(left), y: Math.round(top), size: Math.round(Math.max(right - left, bottom - top)) });
        for (let y = Math.max(0, Math.floor(top) - margin); y <= Math.min(height - 1, Math.ceil(bottom) + margin); y++) {
            pixels.fill(255, (y * width + Math.max(0, Math.floor(left) - margin)) * 4, (y * width + Math.min(width - 1, Math.ceil(right) + margin) + 1) * 4);
        }
    }
    return found;
}

/**
 * Decodes every QR code of an image. The decoder finds one code at a time, so each code that it finds
 * is painted white and the search runs again. The decoder can fail when two codes sit side by side, so
 * when the search finds fewer codes than `minimum`, the image is searched again in overlapping windows
 * (a square with the side of 28 percent of the shorter side of the image, at least 600 pixels, half a window apart).
 * @param png The image bytes (PNG or any format that sharp reads).
 * @param minimum The number of codes that the image must hold; 0 skips the window search.
 * @returns The codes in the order found; an empty list when the image has no code.
 */
export async function decodeQrCodes(png: Buffer, minimum = 0): Promise<DecodedQr[]> {
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
    const original = minimum > 0 ? Uint8ClampedArray.from(pixels) : undefined;
    const found = decodeAll(pixels, info.width, info.height);
    if (!original || found.length >= minimum) return found;
    const side = Math.max(600, Math.round(Math.min(info.width, info.height) * 0.28));
    const windowWidth = Math.min(side, info.width), windowHeight = Math.min(side, info.height);
    for (const top of windowStarts(info.height, windowHeight)) {
        for (const left of windowStarts(info.width, windowWidth)) {
            const tile = new Uint8ClampedArray(windowWidth * windowHeight * 4);
            for (let y = 0; y < windowHeight; y++) tile.set(original.subarray(((top + y) * info.width + left) * 4, ((top + y) * info.width + left + windowWidth) * 4), y * windowWidth * 4);
            for (const code of decodeAll(tile, windowWidth, windowHeight)) {
                const at = { ...code, x: code.x + left, y: code.y + top };
                if (!found.some((f) => f.data === at.data && Math.abs(f.x - at.x) < 40 && Math.abs(f.y - at.y) < 40)) found.push(at);
            }
        }
    }
    return found;
}

/**
 * The QR codes that the student book must print: the song code and the book code of each home card, on
 * the Thai side of the card (the page of kind `home-front`), in the order of the card; and the code of
 * each reader of a week (the read-along or the decodable part), on the pages that hold a reader code.
 * The reader codes of a week pair with the books of the week in order.
 * @param weeks The weeks of the unit.
 * @param pages The page list of the book (`storytimeStudentBookPages`).
 * @returns The expected codes in page order. The address is `storytimeQrUrl` of the path in the week file.
 * @throws Error When the reader code slots of a week and the books of the week differ in number.
 */
export function expectedStudentBookQrs(weeks: StorytimeWeek[], pages: { page: number; kind: string; week?: number; readerQrs?: number }[]): ExpectedQr[] {
    const expected: ExpectedQr[] = [];
    for (const page of pages) {
        if (page.week === undefined) continue;
        const week = weeks.find((candidate) => candidate.meta.week === page.week);
        if (page.kind === 'home-front') {
            for (const url of [week?.home?.songUrl, week?.home?.readAlongUrl]) {
                if (url) expected.push({ page: page.page, week: page.week, address: storytimeQrUrl(url) });
            }
        }
    }
    for (const week of weeks) {
        const slots = pages.filter((page) => page.week === week.meta.week).flatMap((page) => Array.from({ length: page.readerQrs ?? 0 }, () => page.page));
        if (slots.length !== week.books.length) throw new Error(`week ${week.meta.week}: ${slots.length} reader QR codes in the book, ${week.books.length} readers in the week file`);
        week.books.forEach((book, index) => {
            const part = book.kind === 'decodable' ? 'decodable' : 'book';
            expected.push({ page: slots[index], week: week.meta.week, address: storytimeQrUrl(`/th/st/${week.meta.level}/${week.meta.week}?part=${part}`) });
        });
    }
    return expected.sort((x, y) => x.page - y.page);
}

/**
 * Compares the decoded codes with the expected codes, page by page.
 * @param expected The codes that the book must print.
 * @param found The codes that were decoded, with their page.
 * @returns One row for each expected code (pass, wrong address, or missing) and one row for each code that nobody expected.
 */
export function compareQrs(expected: { page: number; address: string }[], found: { page: number; data: string }[]): QrRow[] {
    const rows: QrRow[] = [];
    const pages = Array.from(new Set([...expected.map((e) => e.page), ...found.map((f) => f.page)])).sort((a, b) => a - b);
    for (const page of pages) {
        const want = expected.filter((e) => e.page === page);
        const left = found.filter((f) => f.page === page).map((f) => f.data);
        const result: (QrRow | undefined)[] = want.map((e) => {
            const at = left.indexOf(e.address);
            if (at < 0) return undefined;
            left.splice(at, 1);
            return { page, address: e.address, expected: e.address, status: 'pass', note: '' };
        });
        want.forEach((e, i) => {
            if (result[i]) return;
            const data = left.shift();
            result[i] = data === undefined
                ? { page, address: '-', expected: e.address, status: 'fail', note: 'missing: no code decoded' }
                : { page, address: data, expected: e.address, status: 'fail', note: 'wrong address' };
        });
        rows.push(...(result as QrRow[]));
        for (const data of left) rows.push({ page, address: data, expected: '-', status: 'fail', note: 'unexpected code' });
    }
    return rows;
}

/**
 * The text of the QR report: one tab-separated line for each code, and a summary line.
 * @param rows The rows of `compareQrs`.
 * @returns The report text.
 */
export function qrReportText(rows: QrRow[]): string {
    const lines = ['page\taddress\texpected\tstatus\tnote', ...rows.map((r) => `${r.page}\t${r.address}\t${r.expected}\t${r.status.toUpperCase()}\t${r.note}`)];
    const decoded = rows.filter((r) => r.address !== '-').length;
    const expected = rows.filter((r) => r.expected !== '-').length;
    const pass = rows.filter((r) => r.status === 'pass').length;
    lines.push(`summary\tcodes found ${decoded}\tcodes expected ${expected}\tpass ${pass}\tfail ${rows.length - pass}`);
    return `${lines.join('\n')}\n`;
}
