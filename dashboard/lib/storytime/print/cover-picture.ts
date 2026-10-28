import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { inflateSync } from 'zlib';
import { REPO_ROOT } from '../../lesson-package/files';
import { STORYTIME_COVER_HEAD_BAND_MM, STORYTIME_COVER_SIDE_BAND_MM, storytimeCoverMmToPx } from './covers';

/**
 * The cover picture of a Storytime student book (track storytime_covers_20261027): the Forge 3D
 * cast, cut out on the ground tint of the level (D5, D6). The composer writes one opaque picture
 * for the picture area of the front cover, at 300 ppi for the trim, so that the PDF/X file holds
 * no alpha channel and no soft mask (R13).
 *
 * The layout follows the v1 Level 1 Unit 1 cover, the model of D5: the children stand in one row
 * and fill the picture area, and at most one animal stands in front of their feet. The figures
 * fill the area (D8), and a crop at the bottom edge is allowed (P10). The top band of 8 mm and the
 * side bands of 3 mm hold only the ground tint, so no head is cut (FR-2.7, orchestrator decision
 * 2026-10-28, Check v2 finding C2).
 */

/** The picture area of the front cover: 186 x 180 mm (spec FR-2.3). */
export const STORYTIME_COVER_PICTURE_MM = { width: 186, height: 180 };

/** The resolution of every cover picture: 300 ppi (spec FR-5.1). */
export const STORYTIME_COVER_PPI = 300;

/** The corner radius of the picture layer, in millimetres (spec FR-2.4, P9). */
const PICTURE_RADIUS_MM = 5;

/** The rows of the picture that the rounded corners do not reach, in millimetres (R18 v2 sides). */
const SIDE_BAND_ROWS_MM = 6;

/** The share of the children's height that the animal occupies (the model of D5: 0.42). */
const ANIMAL_HEIGHT_SHARE = 0.42;

/** A sprite whose trimmed height is below this share of the tallest one is the animal. */
const ANIMAL_SHARE = 0.75;

/** The white outside the rounded corners of the picture layer: the colour of the page. */
const GROUND = '#ffffff';

/** The tolerance of a ground tint sample, per RGB channel (spec FR-2.4, AC-3). */
const TINT_TOLERANCE = 6;

/** The tolerance of a figure pixel against the ground tint (the Red contract of FR-2.7). */
const FIGURE_TOLERANCE = 24;

/** One cut-out character, trimmed to its alpha box. */
interface Sprite {
    file: string;
    width: number;
    height: number;
    buffer: Buffer;
}

/** One figure of the picture, in the pixels of the picture area. */
interface PlacedFigure {
    name: string;
    index: number;
    left: number;
    top: number;
    width: number;
    height: number;
    sprite: Sprite;
}

/** The box of one figure of the picture area, in pixels (the layout contract of D5). */
export interface StorytimeCoverFigureBox {
    /** The name of the figure, from its cut-out folder. */
    name: string;
    /** The left edge of the figure, in pixels. */
    left: number;
    /** The top edge of the figure, in pixels. */
    top: number;
    /** The width of the figure, in pixels. */
    width: number;
    /** The height of the figure, in pixels. */
    height: number;
}

/**
 * Resolves a picture path of a recipe: an absolute path, or a path from the repo root.
 * @param file The path of the recipe.
 * @returns The absolute path.
 */
export function storytimeCoverPicturePath(file: string): string {
    return path.isAbsolute(file) ? file : path.join(REPO_ROOT, file);
}

/**
 * The box of the visible pixels of a picture.
 * @param data The raw pixels.
 * @param width The width of the picture.
 * @param height The height of the picture.
 * @param channels The number of channels of the pixels.
 * @returns The box, or null when the picture is empty.
 */
function alphaBox(data: Buffer, width: number, height: number, channels: number): { left: number; top: number; width: number; height: number } | null {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * channels + channels - 1] > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < 0) return null;
    return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Loads one cut-out and trims it to its alpha box.
 * @param file The picture file.
 * @param bookTitle The book of the cover, named in the error.
 * @returns The sprite.
 */
async function loadSprite(file: string, bookTitle: string): Promise<Sprite> {
    const abs = storytimeCoverPicturePath(file);
    if (!fs.existsSync(abs)) throw new Error(`${bookTitle}: the picture file is missing: ${file}`);
    const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const box = alphaBox(data, info.width, info.height, info.channels);
    if (!box) throw new Error(`${bookTitle}: the picture file is empty: ${file}`);
    const trimmed = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
        .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
        .raw()
        .toBuffer();
    return { file, width: box.width, height: box.height, buffer: trimmed };
}

/**
 * The name of a figure, from its cut-out path: the folder name after "sprout-", or the file name.
 * @param file The path of the cut-out.
 * @returns The name of the figure.
 */
function figureName(file: string): string {
    const match = file.match(/sprout-([^/\\]+)/i);
    if (match) return match[1];
    return path.basename(file).replace(/\.[^.]+$/, '');
}

/**
 * The height of the clear band at the top of the picture, in pixels. A small picture keeps a
 * smaller band, so that the layout stays possible for a test picture.
 * @param sizePx The size of the picture area, in pixels.
 * @returns The height of the band.
 */
function headBandPx(sizePx: { width: number; height: number }): number {
    const band = storytimeCoverMmToPx(STORYTIME_COVER_HEAD_BAND_MM);
    return Math.max(1, Math.min(band, Math.round(sizePx.height / 10)));
}

/**
 * The width of the clear band at the left edge and at the right edge of the picture, in pixels.
 * The band rounds up and keeps one more pixel: the rasteriser places the picture area on a whole
 * pixel, so the clear distance from the edge stays at 3 mm or more. A small picture keeps a
 * smaller band, so that the layout stays possible for a test picture.
 * @param sizePx The size of the picture area, in pixels.
 * @returns The width of one side band.
 */
function sideBandPx(sizePx: { width: number; height: number }): number {
    const band = Math.ceil((STORYTIME_COVER_SIDE_BAND_MM / 25.4) * STORYTIME_COVER_PPI) + 1;
    return Math.max(1, Math.min(band, Math.round(sizePx.width / 10)));
}

/**
 * Plans the figures of one cover picture: the children in one row at the shape of their cut-outs,
 * large enough to fill the picture area, and the small figure (the animal) centred in front of
 * their feet. The row stays inside the side bands, so no head or arm is cut at a side edge
 * (FR-2.7, C2). The order of the figures is the order of the recipe, so the animal draws on top
 * of the children.
 * @param files The cut-out files of the recipe, the children first and the animal last.
 * @param sizePx The size of the picture area, in pixels.
 * @param bookTitle The book of the cover, named in the error.
 * @returns The placed figures.
 */
async function planFigureLayout(
    files: string[],
    sizePx: { width: number; height: number },
    bookTitle: string,
): Promise<PlacedFigure[]> {
    if (!files.length) throw new Error(`${bookTitle}: the picture recipe is empty.`);
    const sprites: Sprite[] = await Promise.all(files.map((file) => loadSprite(file, bookTitle)));
    const tallest = Math.max(...sprites.map((sprite) => sprite.height));
    const small = sprites.map((sprite) => sprite.height < tallest * ANIMAL_SHARE);
    const row = sprites.map((_, index) => index).filter((index) => !small[index]);
    const rowIndexes = row.length ? row : sprites.map((_, index) => index);
    const band = headBandPx(sizePx);
    const side = sideBandPx(sizePx);
    const usableWidth = Math.max(1, sizePx.width - 2 * side);
    const totalAspect = rowIndexes.reduce((sum, index) => sum + sprites[index].width / sprites[index].height, 0);
    // The row keeps the shape of the cut-outs: the height follows from the usable width and the
    // summed ratios of the row, so no figure is stretched (FR-2.7, C3).
    const rowHeight = Math.min(sizePx.height - band, usableWidth / totalAspect);
    const widths = rowIndexes.map((index) => (sprites[index].width / sprites[index].height) * rowHeight);
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    const left0 = side + (usableWidth - totalWidth) / 2;
    const edges: number[] = [Math.round(left0)];
    let cumulative = 0;
    for (const width of widths) {
        cumulative += width;
        edges.push(Math.round(left0 + cumulative));
    }
    // The row stands on the head band, or in the middle of a picture area that it does not fill, so
    // the figures of a picture with many cut-outs still reach the middle (R12).
    const top = Math.max(Math.round(band), Math.round((sizePx.height - rowHeight) / 2));
    const placed: PlacedFigure[] = rowIndexes.map((index, position) => ({
        name: figureName(files[index]),
        index,
        left: edges[position],
        top,
        width: edges[position + 1] - edges[position],
        height: Math.round(rowHeight),
        sprite: sprites[index],
    }));
    const feet = top + rowHeight;
    const animalHeight = rowHeight * ANIMAL_HEIGHT_SHARE;
    for (let index = 0; index < sprites.length; index++) {
        if (!small[index] && row.length) continue;
        if (small[index] && !row.length) continue;
        const sprite = sprites[index];
        const width = (sprite.width / sprite.height) * animalHeight;
        placed.push({
            name: figureName(files[index]),
            index,
            left: Math.round((sizePx.width - width) / 2),
            top: Math.round(feet - animalHeight),
            width: Math.round(width),
            height: Math.round(animalHeight),
            sprite,
        });
    }
    // Keep the order of the recipe, so the figures draw in that order, the animal on top.
    placed.sort((a, b) => a.index - b.index);
    return placed;
}

/**
 * The layout of the figures of one cover picture, in the order of the recipe (spec FR-2.7).
 * @param files The cut-out files of the recipe, the children first and the animal last.
 * @param sizePx The size of the picture area, in pixels.
 * @returns The box of each figure, in pixels.
 */
export async function storytimeCoverFigureLayout(
    files: string[],
    sizePx: { width: number; height: number },
): Promise<StorytimeCoverFigureBox[]> {
    const figures = await planFigureLayout(files, sizePx, 'Storytime Advantage');
    return figures.map(({ name, left, top, width, height }) => ({ name, left, top, width, height }));
}

/**
 * Checks the layout of the figures of one cover picture (orchestrator decision 2026-10-28, the
 * model of D5):
 *
 * 1. No figure box starts inside the head band at the top, so every head is whole.
 * 2. No figure box enters the side band at the left edge or at the right edge, so no head or arm
 *    is cut at a side edge (spec FR-2.7, Check v2 finding C2).
 * 3. Two boxes may overlap in x only when the top of one box is lower than the vertical middle of
 *    the other box. A short figure may stand in front of the lower half of a tall figure, and the
 *    children never overlap.
 * 4. A box may reach or pass the bottom edge of the picture area: the bottom crop is allowed.
 * @param boxes The boxes of the figures.
 * @param sizePx The size of the picture area, in pixels.
 * @param headBandHeightPx The height of the clear band at the top, in pixels.
 * @param sideBandWidthPx The width of one clear side band, in pixels. The default is 3 mm.
 * @returns The errors (empty when the layout is good).
 */
export function checkStorytimeCoverFigureLayout(
    boxes: StorytimeCoverFigureBox[],
    sizePx: { width: number; height: number },
    headBandHeightPx: number,
    sideBandWidthPx: number = storytimeCoverMmToPx(STORYTIME_COVER_SIDE_BAND_MM),
): string[] {
    const errors: string[] = [];
    for (const box of boxes) {
        if (box.top < headBandHeightPx) {
            errors.push(`The head of ${box.name} is inside the ${headBandHeightPx} px band at the top (top ${box.top} px).`);
        }
        if (box.width <= 0 || box.height <= 0) errors.push(`The figure ${box.name} has no box.`);
        if (box.left < sideBandWidthPx) {
            errors.push(`The figure ${box.name} enters the ${sideBandWidthPx} px band at the left edge of the picture area (left ${box.left} px), so the left side is cut.`);
        }
        if (box.left + box.width > sizePx.width - sideBandWidthPx) {
            errors.push(`The figure ${box.name} enters the ${sideBandWidthPx} px band at the right edge of the picture area (right ${box.left + box.width} px), so the right side is cut.`);
        }
    }
    for (let first = 0; first < boxes.length; first++) {
        for (let second = first + 1; second < boxes.length; second++) {
            const a = boxes[first];
            const b = boxes[second];
            const overlapX = a.left < b.left + b.width && b.left < a.left + a.width;
            if (!overlapX) continue;
            const inFront = a.top > b.top + b.height / 2 || b.top > a.top + a.height / 2;
            if (!inFront) {
                errors.push(`The figures ${a.name} and ${b.name} overlap in x in one row; only a short figure in front of the lower half of a tall figure may overlap.`);
            }
        }
    }
    return errors;
}

/** The default tolerance of a figure box ratio against the ratio of its cut-out (R19 v2). */
const FIGURE_ASPECT_TOLERANCE = 0.02;

/** The cache of the cut-out boxes of the aspect check, by absolute file path. */
const cutOutBoxCache = new Map<string, { width: number; height: number } | null>();

/**
 * The box of the visible pixels of a cut-out, read in the process, so that the aspect check stays
 * a plain function. A cut-out without an alpha channel has the box of the whole picture.
 * @param file The picture file of the recipe.
 * @returns The trimmed box, or null when the file is missing or is not an 8-bit PNG.
 */
function cutOutBox(file: string): { width: number; height: number } | null {
    const abs = storytimeCoverPicturePath(file);
    const cached = cutOutBoxCache.get(abs);
    if (cached !== undefined) return cached;
    let box: { width: number; height: number } | null = null;
    if (fs.existsSync(abs)) {
        const image = decodePng(fs.readFileSync(abs));
        if (image) {
            if (image.channels < 4) {
                box = { width: image.width, height: image.height };
            } else {
                let minX = image.width;
                let minY = image.height;
                let maxX = -1;
                let maxY = -1;
                for (let y = 0; y < image.height; y++) {
                    for (let x = 0; x < image.width; x++) {
                        if (image.data[(y * image.width + x) * image.channels + 3] <= 0) continue;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
                if (maxX >= 0) box = { width: maxX - minX + 1, height: maxY - minY + 1 };
            }
        }
    }
    cutOutBoxCache.set(abs, box);
    return box;
}

/**
 * Checks that each figure box keeps the width-to-height ratio of its cut-out, so no figure is
 * stretched (spec FR-2.7, Check v2 finding C3, R19 v2).
 * @param boxes The boxes of the figures, in the order of the recipe.
 * @param files The cut-out files of the recipe, in the order of the recipe.
 * @param tolerance The largest allowed difference of the two ratios. The default is 0.02.
 * @returns The errors (empty when every box keeps the ratio of its cut-out).
 */
export function checkStorytimeCoverFigureAspect(
    boxes: StorytimeCoverFigureBox[],
    files: string[],
    tolerance: number = FIGURE_ASPECT_TOLERANCE,
): string[] {
    const errors: string[] = [];
    for (let index = 0; index < boxes.length; index++) {
        const box = boxes[index];
        const file = files[index];
        if (!(box.width > 0) || !(box.height > 0)) {
            errors.push(`The figure ${box.name} has no box.`);
            continue;
        }
        const source = file ? cutOutBox(file) : null;
        if (!source) {
            errors.push(`The figure ${box.name} has no readable cut-out; the aspect check cannot read ${file ?? 'the file'}.`);
            continue;
        }
        const boxRatio = box.width / box.height;
        const cutOutRatio = source.width / source.height;
        if (Math.abs(boxRatio - cutOutRatio) > tolerance) {
            errors.push(`The figure ${box.name} is stretched: its box ratio is ${boxRatio.toFixed(3)}, the cut-out ratio is ${cutOutRatio.toFixed(3)}, and the tolerance is ${tolerance}.`);
        }
    }
    return errors;
}

/**
 * Resizes one cut-out to the size of its place in the group.
 * @param buffer The raw pixels of the cut-out.
 * @param source The size of the cut-out.
 * @param width The width of the place.
 * @param height The height of the place.
 * @returns The resized cut-out, as raw pixels with an alpha channel.
 */
async function resizeSprite(buffer: Buffer, source: { width: number; height: number }, width: number, height: number): Promise<Buffer> {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    if (w === source.width && h === source.height) return buffer;
    const { data, info } = await sharp(buffer, { raw: { width: source.width, height: source.height, channels: 4 } })
        .resize(w, h, { fit: 'fill', kernel: 'lanczos3' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    return data.subarray(0, info.width * info.height * info.channels);
}

/**
 * Composes the cover picture of one book: the cut-out figures on the ground tint of the level, to
 * the four edges of the picture area, with the 5 mm rounded corners in the picture layer. The
 * children stand in one row and fill the area, and the animal stands in front of their feet (D5,
 * D6, D8). The picture is opaque: no alpha channel and no soft mask (R13).
 * @param files The cut-out files of the recipe, the children first and the animal last.
 * @param sizePx The size of the picture area, in pixels.
 * @param groundTint The ground tint of the level.
 * @param bookTitle The book of the cover, named in the error.
 * @returns The opaque picture, as a PNG without an alpha channel.
 */
export async function composeStorytimeCoverPicture(
    files: string[],
    sizePx: { width: number; height: number },
    groundTint: string,
    bookTitle = 'Storytime Advantage',
): Promise<Buffer> {
    const figures = await planFigureLayout(files, sizePx, bookTitle);
    const radius = Math.min(storytimeCoverMmToPx(PICTURE_RADIUS_MM), Math.floor(Math.min(sizePx.width, sizePx.height) / 2));
    const ground = `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx.width}" height="${sizePx.height}"><rect x="0" y="0" width="${sizePx.width}" height="${sizePx.height}" rx="${radius}" ry="${radius}" fill="${groundTint}"/></svg>`;
    const layers: sharp.OverlayOptions[] = [];
    for (const figure of figures) {
        layers.push({
            input: await resizeSprite(figure.sprite.buffer, figure.sprite, figure.width, figure.height),
            raw: { width: Math.max(1, figure.width), height: Math.max(1, figure.height), channels: 4 },
            left: figure.left,
            top: figure.top,
        });
    }
    return sharp({ create: { width: sizePx.width, height: sizePx.height, channels: 3, background: GROUND } })
        .composite([{ input: Buffer.from(ground), left: 0, top: 0 }, ...layers])
        .flatten({ background: GROUND })
        .removeAlpha()
        .png({ compressionLevel: 3 })
        .toBuffer();
}

/**
 * The Paeth predictor of a PNG scanline (the PNG specification, section 9).
 * @param a The pixel to the left.
 * @param b The pixel above.
 * @param c The pixel above and to the left.
 * @returns The predicted value.
 */
function paeth(a: number, b: number, c: number): number {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    return pb <= pc ? b : c;
}

/** A decoded PNG: the pixels of the picture. */
interface PngImage {
    width: number;
    height: number;
    channels: number;
    data: Buffer;
}

/**
 * Decodes a PNG of 8 bits per channel without interlacing, in the process, so that a check of a
 * composed picture stays a plain function (the Red contract of the picture module).
 * @param png The PNG file.
 * @returns The pixels, or null when the file is not a PNG of that kind.
 */
function decodePng(png: Buffer): PngImage | null {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < signature.length; i++) if (png[i] !== signature[i]) return null;
    let width = 0;
    let height = 0;
    let depth = 0;
    let colour = 0;
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
    if (depth !== 8 || interlace !== 0 || width <= 0 || height <= 0) return null;
    const channels = colour === 0 ? 1 : colour === 2 ? 3 : colour === 3 ? 1 : colour === 4 ? 2 : colour === 6 ? 4 : 0;
    if (!channels) return null;
    const raw = inflateSync(Buffer.concat(parts));
    const stride = width * channels;
    if (raw.length < (stride + 1) * height) return null;
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
        } else {
            for (let x = 0; x < channels; x++) cur[x] = (line[x] + prev[x]) & 0xff;
            for (let x = channels; x < stride; x++) {
                const a = cur[x - channels];
                const b = prev[x];
                const c = prev[x - channels];
                cur[x] = (line[x] + paeth(a, b, c)) & 0xff;
            }
        }
    }
    return { width, height, channels, data: out };
}

/**
 * Parses a colour of the data file or of the spec, as #rrggbb.
 * @param value The colour.
 * @returns The red, green, and blue values.
 */
function parseColour(value: string): [number, number, number] {
    const hex = (value ?? '').trim().replace(/^#/, '');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return [255, 255, 255];
    return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
}

/**
 * Checks a composed cover picture (spec FR-2.4, FR-2.7, AC-3, AC-9): the picture is opaque, each
 * of the four corner samples 8 mm inside the corner holds the ground tint, the picture holds
 * figure pixels, the figures cover the minimum share of the picture area, and the side bands of
 * 3 mm at the left edge and at the right edge hold only the ground tint (C2).
 * @param png The composed picture.
 * @param groundTint The ground tint of the level.
 * @param minimumFillShare The share of figure pixels that the picture area needs. The shape check
 *   of R12 calls without it; the fill checks and the build give `STORYTIME_COVER_FILL_SHARE`.
 * @returns The errors (empty when the picture is good).
 */
export function checkStorytimeCoverPicture(png: Buffer, groundTint: string, minimumFillShare = 0): string[] {
    const errors: string[] = [];
    const image = decodePng(png);
    if (!image) return ['The picture is not a PNG of 8 bits per channel.'];
    if (image.channels === 4) errors.push('The picture holds an alpha channel.');
    const ground = parseColour(groundTint);
    const pixel = (x: number, y: number): number[] => {
        const index = (y * image.width + x) * image.channels;
        const first = image.data[index];
        const second = image.channels >= 3 ? image.data[index + 1] : first;
        const third = image.channels >= 3 ? image.data[index + 2] : first;
        return [first, second, third];
    };
    const near = (x: number, y: number) => pixel(x, y).every((channel, index) => Math.abs(channel - ground[index]) <= TINT_TOLERANCE);
    const inset = Math.min(storytimeCoverMmToPx(STORYTIME_COVER_HEAD_BAND_MM), Math.floor(Math.min(image.width, image.height) / 4));
    const corners: [number, number][] = [
        [inset, inset],
        [image.width - 1 - inset, inset],
        [inset, image.height - 1 - inset],
        [image.width - 1 - inset, image.height - 1 - inset],
    ];
    for (const [x, y] of corners) {
        if (!near(x, y)) errors.push(`The corner sample ${x},${y} does not hold the ground tint ${groundTint} within ${TINT_TOLERANCE} per channel.`);
    }
    let figurePixels = 0;
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (pixel(x, y).some((channel, index) => Math.abs(channel - ground[index]) > FIGURE_TOLERANCE)) figurePixels++;
        }
    }
    const share = figurePixels / (image.width * image.height);
    if (!figurePixels) errors.push('The picture holds no figure pixels.');
    else if (minimumFillShare > 0 && share < minimumFillShare) {
        errors.push(`The figures cover ${(share * 100).toFixed(1)} percent of the picture area; the fill is below the ${(minimumFillShare * 100).toFixed(0)} percent minimum.`);
    }
    // The side bands hold only the ground tint, so no head or arm is cut at a side edge (C2).
    const sideBand = sideBandPx({ width: image.width, height: image.height });
    const rowInset = Math.min(storytimeCoverMmToPx(SIDE_BAND_ROWS_MM), Math.floor(image.height / 4));
    const sideRows = { top: rowInset, height: Math.max(1, image.height - 2 * rowInset) };
    for (const [side, left] of [['left', 0], ['right', image.width - sideBand]] as const) {
        let sidePixels = 0;
        for (let y = sideRows.top; y < sideRows.top + sideRows.height; y++) {
            for (let x = Math.max(0, left); x < Math.min(image.width, left + sideBand); x++) {
                if (pixel(x, y).some((channel, index) => Math.abs(channel - ground[index]) > FIGURE_TOLERANCE)) sidePixels++;
            }
        }
        if (sidePixels) {
            errors.push(`The ${sideBand} px band at the ${side} edge of the picture area holds ${sidePixels} figure pixels; the ${side} side cuts a figure.`);
        }
    }
    return errors;
}

/**
 * Draws one coloured block of a cover side with its corner radius, as an opaque picture: the
 * radius is flattened into the picture layer, so the page text stays text and the PDF/X file
 * holds no soft mask (the corner mode of the cover build).
 * @param sizePx The size of the block, in pixels.
 * @param fill The fill colour of the block.
 * @param radiusMm The corner radius, in millimetres.
 * @param border The border of the block: the colour and the width in millimetres.
 * @returns The opaque picture, as a PNG without an alpha channel.
 */
export async function storytimeCoverBlock(
    sizePx: { width: number; height: number },
    fill: string,
    radiusMm: number,
    border?: { colour: string; widthMm: number },
): Promise<Buffer> {
    const px = (mm: number) => Math.round((mm / 25.4) * STORYTIME_COVER_PPI);
    const stroke = border ? px(border.widthMm) : 0;
    const inset = stroke / 2;
    const radius = px(radiusMm);
    const rect = `<rect x="${inset}" y="${inset}" width="${sizePx.width - stroke}" height="${sizePx.height - stroke}" rx="${radius}" ry="${radius}" fill="${fill}"${
        border ? ` stroke="${border.colour}" stroke-width="${stroke}"` : ''
    } />`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx.width}" height="${sizePx.height}">${rect}</svg>`;
    return sharp({
        create: { width: sizePx.width, height: sizePx.height, channels: 3, background: GROUND },
    })
        .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
        .flatten({ background: GROUND })
        .removeAlpha()
        .png()
        .toBuffer();
}
