import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { inflateSync } from 'zlib';
import { REPO_ROOT } from '../../lesson-package/files';

/**
 * The cover picture of a Storytime student book (track storytime_covers_20261027): the Forge 3D
 * cast, cut out and placed on a white ground (D4: one picture style for all 16 books). The
 * composer writes one opaque picture for the picture area of the front cover, at 300 ppi for the
 * trim, so that the PDF/X file holds no alpha channel and no soft mask.
 *
 * The layout follows the mock build (`compose_pictures.py`, 2026-10-26): a back row of the taller
 * characters, a front row of the first and the last character, and the small one (the dog Pip) in
 * the middle of the front row. The rows overlap, the front row stands lower, and the whole group
 * is scaled to the frame.
 */

/** The picture area of the front cover: 186 x 180 mm (spec FR-2.3). */
export const STORYTIME_COVER_PICTURE_MM = { width: 186, height: 180 };

/** The resolution of every cover picture: 300 ppi (spec FR-5.1). */
export const STORYTIME_COVER_PPI = 300;

/** The height of the back row, in units of the tallest character. */
const BACK_HEIGHT = 1;

/** The height of the front row, in units of the tallest character (the mock: 1120 of 1000). */
const FRONT_HEIGHT = 1.12;

/** The height of the small one (the dog), in units of the tallest character. */
const SMALL_HEIGHT = 0.62;

/** How much the back row overlaps: the step of a row is its width times this share. */
const BACK_OVERLAP = 0.5;

/** How much the front row overlaps. */
const FRONT_OVERLAP = 0.06;

/** How much lower the feet of the front row stand, in units of the tallest character. */
const FRONT_DROP = 0.54;

/** A sprite whose height is below this share of the tallest one is a small one (the dog). */
const SMALL_SHARE = 0.75;

/** The white ground of the picture area. */
const GROUND = '#ffffff';

/** One cut-out character, trimmed to its alpha box. */
interface Sprite {
    file: string;
    width: number;
    height: number;
    buffer: Buffer;
}

/** One sprite of a row, in the units of the group. */
interface Placed {
    left: number;
    top: number;
    width: number;
    height: number;
    buffer: Buffer;
}

/** A row of sprites. */
interface Row {
    width: number;
    feet: number;
    height: number;
    items: Placed[];
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
 * Builds one row of sprites: every sprite at the given height, the row from left to right with
 * an overlap. The row is placed on the baseline of its feet.
 * @param sprites The sprites of the row, in order.
 * @param height The height of every sprite of the row, in pixels.
 * @param overlap The share of a sprite that the next one covers.
 * @param feet The baseline of the row, in pixels.
 * @returns The row.
 */
async function buildRow(sprites: Sprite[], height: number, overlap: number, feet: number): Promise<Row> {
    const items: Placed[] = [];
    let x = 0;
    for (const sprite of sprites) {
        const width = Math.max(1, Math.round((sprite.width / sprite.height) * height));
        items.push({ left: x, top: feet - height, width, height, buffer: await resizeSprite(sprite.buffer, sprite, width, height) });
        x += width * (1 - overlap);
    }
    const last = items[items.length - 1];
    return { width: last ? last.left + last.width : 0, feet, height, items };
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
 * Composes the cover picture of one book: the cut-out characters on a white ground, at the size
 * of the picture area of the front cover.
 *
 * The group is scaled so that it fills the frame, and never below the size of its own pictures:
 * a picture that already fills the frame keeps its size, so its corners stay its own colour
 * (D4: a room scene in a box fails the white-corner rule).
 * @param files The cut-out files of the recipe.
 * @param sizePx The size of the picture area, in pixels.
 * @param bookTitle The book of the cover, named in the error.
 * @returns The opaque picture, as a PNG without an alpha channel.
 */
export async function composeStorytimeCoverPicture(
    files: string[],
    sizePx: { width: number; height: number },
    bookTitle = 'Storytime Advantage',
): Promise<Buffer> {
    if (!files.length) throw new Error(`${bookTitle}: the picture recipe is empty.`);
    const sprites: Sprite[] = [];
    for (const file of files) sprites.push(await loadSprite(file, bookTitle));

    const tallest = Math.max(...sprites.map((s) => s.height));
    const small = sprites.filter((s) => s.height < tallest * SMALL_SHARE);
    const tall = sprites.filter((s) => s.height >= tallest * SMALL_SHARE);

    // The back row holds the tall characters between the first and the last one; the front row
    // holds the first and the last character, and the small one.
    const backSprites = tall.length >= 4 ? tall.slice(1, tall.length - 1) : [];
    const frontSprites = tall.length >= 4 ? [tall[0], tall[tall.length - 1]] : [...tall];

    // The group, in the pixels of the cut-outs: the tallest character is the unit.
    const backHeight = Math.round(BACK_HEIGHT * tallest);
    // The front row stands a little taller, but never taller than the picture area.
    const frontHeight = Math.min(Math.round(FRONT_HEIGHT * tallest), sizePx.height);
    const smallHeight = Math.round(SMALL_HEIGHT * tallest);
    const drop = Math.round(FRONT_DROP * tallest);
    const back = await buildRow(backSprites, backHeight, BACK_OVERLAP, backHeight);
    const front = await buildRow(frontSprites, frontHeight, FRONT_OVERLAP, backHeight + drop);

    // The small one stands in the middle of the group, its feet at the feet of the front row.
    const smallItems: Placed[] = [];
    for (const sprite of small) {
        const width = Math.max(1, Math.round((sprite.width / sprite.height) * smallHeight));
        smallItems.push({
            left: 0,
            top: backHeight + drop - smallHeight,
            width,
            height: smallHeight,
            buffer: await resizeSprite(sprite.buffer, sprite, width, smallHeight),
        });
    }

    // The box of the group.
    const groupWidth = Math.max(back.width, front.width, ...smallItems.map((item) => item.width));
    const groupTop = Math.min(
        ...back.items.map((item) => item.top),
        ...front.items.map((item) => item.top),
        ...smallItems.map((item) => item.top),
    );
    const groupBottom = Math.max(back.feet, front.feet);
    const groupHeight = groupBottom - groupTop;

    // The scale of the group: it fills the frame, and it never shrinks below the size of the
    // cut-outs, so that a picture that fills the frame keeps its own corners.
    const pad = Math.round(Math.min(sizePx.width, sizePx.height) * 0.03);
    const scale = Math.max(
        Math.min((sizePx.width - 2 * pad) / groupWidth, (sizePx.height - 2 * pad) / groupHeight),
        1,
    );

    // The group, drawn on its own ground, then scaled once.
    const layers: sharp.OverlayOptions[] = [];
    const place = (item: Placed, x: number, y: number) => {
        layers.push({
            input: item.buffer,
            raw: { width: item.width, height: item.height, channels: 4 },
            left: Math.round(x),
            top: Math.round(y),
        });
    };
    const backShift = (groupWidth - back.width) / 2;
    for (const item of back.items) place(item, backShift + item.left, item.top - groupTop);
    const frontShift = (groupWidth - front.width) / 2;
    for (const item of front.items) place(item, frontShift + item.left, item.top - groupTop);
    for (const item of smallItems) place(item, (groupWidth - item.width) / 2, item.top - groupTop);

    const group = await sharp({
        create: { width: Math.round(groupWidth), height: Math.round(groupHeight), channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite(layers)
        .raw()
        .toBuffer({ resolveWithObject: true });

    const finalWidth = Math.max(1, Math.round(groupWidth * scale));
    const finalHeight = Math.max(1, Math.round(groupHeight * scale));
    const scaled = await sharp(group.data, { raw: { width: group.info.width, height: group.info.height, channels: group.info.channels } })
        .resize(finalWidth, finalHeight, { fit: 'fill', kernel: 'lanczos3' })
        .raw()
        .toBuffer({ resolveWithObject: true });

    // The group sits in the middle of the picture area; a group that is bigger than the picture
    // area is cut off at its edges.
    const offsetX = Math.round((sizePx.width - finalWidth) / 2);
    const offsetY = Math.round((sizePx.height - finalHeight) / 2);
    const cutLeft = Math.max(0, -offsetX);
    const cutTop = Math.max(0, -offsetY);
    const cutWidth = Math.min(finalWidth - cutLeft, sizePx.width);
    const cutHeight = Math.min(finalHeight - cutTop, sizePx.height);
    const picture = await sharp(scaled.data, { raw: { width: finalWidth, height: finalHeight, channels: scaled.info.channels } })
        .extract({ left: cutLeft, top: cutTop, width: cutWidth, height: cutHeight })
        .raw()
        .toBuffer();

    return sharp({
        create: { width: sizePx.width, height: sizePx.height, channels: 3, background: GROUND },
    })
        .composite([
            {
                input: picture,
                raw: { width: cutWidth, height: cutHeight, channels: scaled.info.channels },
                left: cutLeft + offsetX,
                top: cutTop + offsetY,
            },
        ])
        .flatten({ background: GROUND })
        .removeAlpha()
        .png()
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

/** A decoded PNG: the pixels of every channel. */
interface PngImage {
    width: number;
    height: number;
    channels: number;
    data: Buffer;
}

/**
 * Decodes a PNG of 8 bits per channel without interlacing, in the process, so that a check of a
 * composed picture stays a plain function (the Red contract of the cover module).
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
 * Checks a composed cover picture: the four corners of the picture area are white, and the middle
 * of the picture is not (D4: cut-out characters on white, not a room scene in a box).
 * @param png The composed picture.
 * @returns The errors (empty when the picture is good).
 */
export function checkStorytimeCoverPicture(png: Buffer): string[] {
    const errors: string[] = [];
    const image = decodePng(png);
    if (!image) return ['The picture is not a PNG of 8 bits per channel.'];
    const pixel = (x: number, y: number): number[] => {
        const index = (y * image.width + x) * image.channels;
        const first = image.data[index];
        const second = image.channels >= 3 ? image.data[index + 1] : first;
        const third = image.channels >= 3 ? image.data[index + 2] : first;
        return [first, second, third];
    };
    const white = (x: number, y: number) => {
        const [r, g, b] = pixel(x, y);
        return r === 255 && g === 255 && b === 255;
    };
    const corners: [number, number][] = [
        [2, 2],
        [image.width - 3, 2],
        [2, image.height - 3],
        [image.width - 3, image.height - 3],
    ];
    for (const [x, y] of corners) {
        if (!white(x, y)) errors.push(`The corner ${x},${y} is not white (a room scene in a box fails the cut-out rule).`);
    }
    const cx = Math.floor(image.width / 2) - 20;
    const cy = Math.floor(image.height / 2) - 20;
    let ink = false;
    for (let y = cy; y < cy + 40 && y < image.height; y++) {
        for (let x = cx; x < cx + 40 && x < image.width; x++) {
            if (pixel(x, y).some((channel) => channel !== 255)) ink = true;
        }
    }
    if (!ink) errors.push('The middle of the picture is empty.');
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
