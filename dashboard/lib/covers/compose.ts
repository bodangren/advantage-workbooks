import sharp from 'sharp';

/**
 * The picture part of a cover side (track book_covers_20261007): the book art under the kit layers,
 * combined into one opaque picture. The HTML template draws only text on it, so the print PDF has
 * no transparency (PDF/X-1a) and the text stays vector.
 */

/** The page proportion: 210 x 285 mm. */
export const PAGE_RATIO = 210 / 285;

/**
 * Cuts a wide picture into the back (left) and the front (right): the middle part with the
 * proportion of two pages, then its two halves.
 * @param wide The wide picture.
 * @returns The back and the front as PNG buffers. Throws when the picture is narrower than two pages.
 */
export async function cutWide(wide: Buffer): Promise<{ back: Buffer; front: Buffer }> {
    const { width = 0, height = 0 } = await sharp(wide).metadata();
    const half = Math.floor((height * PAGE_RATIO * 2) / 2);
    if (half * 2 > width) throw new Error(`The wide picture (${width} x ${height}) is narrower than two pages (${half * 2} px)`);
    const left = Math.floor((width - half * 2) / 2);
    const crop = (x: number) => sharp(wide).extract({ left: x, top: 0, width: half, height }).png().toBuffer();
    return { back: await crop(left), front: await crop(left + half) };
}

/**
 * The art on the page: scaled to cover the page, centered across, and at the top or in the middle
 * (as Canva placed it: the front art at the top, the back art in the middle).
 * @param art The art picture.
 * @param size The page size in pixels.
 * @param align Where the art sits when it is taller than the page.
 * @returns An RGBA PNG of the page size.
 */
export async function placeArt(art: Buffer, size: { width: number; height: number }, align: 'top' | 'center'): Promise<Buffer> {
    return sharp(art)
        .resize(size.width, size.height, { fit: 'cover', position: align === 'top' ? 'north' : 'centre', kernel: 'lanczos3' })
        .ensureAlpha()
        .png()
        .toBuffer();
}

/**
 * One cover side: the art, then the kit layers in order, flattened on white.
 * @param art The placed art (from `placeArt`).
 * @param layers The kit layers (RGBA PNGs of the page size), bottom first.
 * @returns A JPEG (quality 95) of the page size.
 */
export async function composeSide(art: Buffer, layers: Buffer[]): Promise<Buffer> {
    // sharp runs flatten before composite in one pipeline, so the flatten is a second step.
    const stacked = await sharp(art).composite(layers.map((input) => ({ input }))).png().toBuffer();
    return sharp(stacked).flatten({ background: '#ffffff' }).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
}
