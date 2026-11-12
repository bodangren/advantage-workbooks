import sharp from 'sharp';
import { placeArt } from '../../covers/compose';
import { StorytimeMetaSchema } from '../schema';
import { STORYTIME_COVER_TRIM, STORYTIME_SERIES, checkStorytimeCoverCopy, storytimeCoverMmToPx } from './covers';
import { QUEST_BANDS } from './cover-quest';
import { STORYTIME_COVER_PPI, checkStorytimeCoverPicture } from './cover-picture';

/**
 * The cover of the Storytime Advantage teacher book (track storytime_print_r1_20261025, spec
 * FR-6): the data check, the copy checks, and the composer of one cover side. The module reads
 * the cover module of the cover track and the cover compose helper, and it changes neither.
 * Each side is one opaque picture at 300 ppi, so the PDF/X file holds no alpha channel and no
 * soft mask. The page text stays text on top of that picture.
 */

/**
 * The bands of the read-along class sets (decision S15). A teacher-book cover names one band. The
 * list is the band enum of the week schema, so a new band changes one file.
 */
export const TEACHER_BOOK_COVER_BANDS = StorytimeMetaSchema.shape.band.unwrap().options;

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
 * The copy check of a reader cover page (spec FR-6.3; the PM look of 2026-11-11, F5, question Q2 of
 * the round F3 to F6): the forbidden word rule and the year rule of the cover copy check, without
 * the series name rule, because the quest reader cover holds no series line after F2; and every band
 * word of `QUEST_BANDS` fails, in any case and as a whole word. Page 1 of a reader is the quest
 * reader cover, so the band name "Sprout" no longer shows there.
 * @param pageText The text of one reader cover page.
 * @returns The errors (empty when the copy is good).
 */
export function checkStorytimeReaderCoverCopy(pageText: string): string[] {
    const series = `The page does not show "${STORYTIME_SERIES}".`;
    const errors = checkStorytimeCoverCopy(pageText).filter((error) => error !== series);
    const text = pageText.replace(/\u00a0/g, ' ').replace(/\u00ad/g, '');
    for (const band of QUEST_BANDS) {
        if (new RegExp(`\\b${band}\\b`, 'i').test(text)) errors.push(`The page shows the band word "${band}".`);
    }
    return errors;
}

/**
 * Checks the picture of a cover side before the layers go on: the Forge figure on the ground tint.
 * The check is the picture check of the cover track without a fill minimum, so an art file with
 * no visible figure (empty or fully transparent) fails, as the student cover fails it.
 * @param picture The Forge figure on the ground tint, as a PNG.
 * @param groundTint The ground tint of the level.
 * @returns The errors (empty when the picture holds a figure).
 */
export function checkTeacherBookCoverArt(picture: Buffer, groundTint: string): string[] {
    return checkStorytimeCoverPicture(picture, groundTint);
}

/**
 * The size of a trim in pixels at 300 ppi, with the one shared conversion of the cover track.
 * @param trim The trim in millimetres.
 * @returns The width and the height in pixels.
 */
export function teacherBookCoverSizePx(trim: { widthMm: number; heightMm: number }): { width: number; height: number } {
    return { width: storytimeCoverMmToPx(trim.widthMm), height: storytimeCoverMmToPx(trim.heightMm) };
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
