import sharp from 'sharp';
import { placeArt } from '../../covers/compose';
import { STORYTIME_COVER_TRIM, checkStorytimeCoverCopy } from './covers';
import { STORYTIME_COVER_PPI } from './cover-picture';

/**
 * The cover of the Storytime Advantage teacher book (track storytime_print_r1_20261025, spec
 * FR-6): the data check, the copy checks, and the composer of one cover side. The module reads
 * the cover module of the cover track and the cover compose helper, and it changes neither.
 * Each side is one opaque picture at 300 ppi, so the PDF/X file holds no alpha channel and no
 * soft mask. The page text stays text on top of that picture.
 */

/** The bands of the read-along class sets (decision S15). A teacher-book cover names one band. */
export const TEACHER_BOOK_COVER_BANDS = ['Seed', 'Sprout', 'Leaf', 'Bud', 'Flower'] as const;

/** The trim of the teacher-book cover: A4 portrait, the trim of the student-book cover. */
export const TEACHER_BOOK_COVER_TRIM = STORYTIME_COVER_TRIM;

/** The data of one teacher-book cover: the title, the band, and the Forge art of each side. */
export interface TeacherBookCoverData {
    /** The title of the book, for example "Storytime Advantage, Level 2, Unit 1, Teacher Book". */
    title: string;
    /** The band name of the cover. It is one of `TEACHER_BOOK_COVER_BANDS`. */
    band: string;
    /** The path of the Forge art of the front side. */
    frontArt: string;
    /** The path of the Forge art of the back side. */
    backArt: string;
}

/**
 * Checks the data of a teacher-book cover: the title passes the cover copy check, the band is a
 * supported band, and each side has an art file.
 * @param data The cover data.
 * @returns The errors (empty when the data is good).
 */
export function checkTeacherBookCoverData(data: TeacherBookCoverData): string[] {
    const errors: string[] = [];
    if (typeof data.title !== 'string' || !data.title.trim()) {
        errors.push('The teacher-book cover has no title.');
    } else {
        errors.push(...checkStorytimeCoverCopy(data.title).map((error) => `Title: ${error}`));
    }
    if (!(TEACHER_BOOK_COVER_BANDS as readonly string[]).includes(data.band)) {
        errors.push(`The band "${data.band}" is not a supported band (${TEACHER_BOOK_COVER_BANDS.join(', ')}).`);
    }
    for (const side of ['frontArt', 'backArt'] as const) {
        if (typeof data[side] !== 'string' || !data[side].trim()) errors.push(`The teacher-book cover has no ${side} file.`);
    }
    return errors;
}

/**
 * The copy check of a teacher-book cover side: it is the copy check of the cover track (the
 * series name, no forbidden word, no year).
 * @param pageText The text of one side of the built page.
 * @returns The errors (empty when the copy is good).
 */
export function checkTeacherBookCoverCopy(pageText: string): string[] {
    return checkStorytimeCoverCopy(pageText);
}

/**
 * The copy check of a reader cover page (spec FR-6.3): the cover copy check, and the band name
 * "Sprout" must show. A longer word such as "Sprouts" does not count as the band name.
 * @param pageText The text of one reader cover page.
 * @returns The errors (empty when the copy is good).
 */
export function checkStorytimeReaderCoverCopy(pageText: string): string[] {
    const errors = checkStorytimeCoverCopy(pageText);
    const text = pageText.replace(/ /g, ' ').replace(/[­​]/g, '');
    if (!/\bSprout\b/.test(text)) errors.push('The reader cover does not show the band name "Sprout".');
    return errors;
}

/**
 * The size of a trim in pixels at 300 ppi.
 * @param trim The trim in millimetres.
 * @returns The width and the height in pixels.
 */
export function teacherBookCoverSizePx(trim: { widthMm: number; heightMm: number }): { width: number; height: number } {
    return {
        width: Math.round((trim.widthMm / 25.4) * STORYTIME_COVER_PPI),
        height: Math.round((trim.heightMm / 25.4) * STORYTIME_COVER_PPI),
    };
}

/**
 * Composes one side of the teacher-book cover: the art scaled to cover the trim, the kit layers
 * in order, flattened on white. The result has three channels, no alpha, and records 300 ppi.
 * @param art The art picture. It may hold an alpha channel.
 * @param layers The layers (PNGs of the trim size, bottom first).
 * @param trim The trim in millimetres.
 * @returns The side as a PNG without an alpha channel.
 */
export async function composeTeacherBookCoverSide(
    art: Buffer,
    layers: Buffer[],
    trim: { widthMm: number; heightMm: number },
): Promise<Buffer> {
    const size = teacherBookCoverSizePx(trim);
    const placed = await placeArt(art, size, 'top');
    const stacked = await sharp(placed)
        .composite(layers.map((input) => ({ input, left: 0, top: 0 })))
        .png()
        .toBuffer();
    return sharp(stacked)
        .flatten({ background: '#ffffff' })
        .removeAlpha()
        .withMetadata({ density: STORYTIME_COVER_PPI })
        .png({ compressionLevel: 3 })
        .toBuffer();
}
