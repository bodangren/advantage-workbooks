import { z } from 'zod';
import { COVER_BOOKS } from './catalogue';

/**
 * Cover data (track book_covers_20261007). One file per book in `content/covers/<book>.json`, and
 * the series text in `content/covers/series.json`. Text uses `**bold**` and the placeholders
 * `{book}`, `{series}`, `{next}`, and `{lessons}`; the script fills them from the catalogue, so the
 * data never names a book itself (`lib/covers/check.ts`).
 */

/** One text: Thai or English, with `**bold**` and placeholders. */
export const CoverTextSchema = z.string().trim().min(1);

/**
 * Where a picture sits when it is taller than the page. Canva centered the art on every page
 * except the Origins 3.2 front (top), so `center` is the default.
 */
const AlignSchema = z.object({ front: z.enum(['top', 'center']).optional(), back: z.enum(['top', 'center']).optional() }).strict();

/** The art: two pictures, or one wide picture that the script cuts (back left, front right). Paths are relative to the repo root. */
export const CoverArtSchema = z.union([
    z.object({ front: z.string().min(1), back: z.string().min(1), align: AlignSchema.optional() }).strict(),
    z.object({ wide: z.string().min(1) }).strict(),
]);

export const CoverDataSchema = z
    .object({
        book: z.string().refine((b) => COVER_BOOKS.includes(b), { message: 'not a Primary Advantage book' }),
        art: CoverArtSchema,
        back: z
            .object({
                /** The paragraph under "About this book". */
                book: CoverTextSchema,
                /** The can-do points; the script adds the "next book" point. */
                canDo: z.array(CoverTextSchema).min(2).max(4),
            })
            .strict(),
    })
    .strict();

/** The paragraphs under "About the series", for each series. */
export const CoverSeriesSchema = z
    .object({
        Origins: z.array(CoverTextSchema).min(1).max(3),
        Quest: z.array(CoverTextSchema).min(1).max(3),
        Adventure: z.array(CoverTextSchema).min(1).max(3),
    })
    .partial()
    .strict();

export type CoverData = z.infer<typeof CoverDataSchema>;
export type CoverSeries = z.infer<typeof CoverSeriesSchema>;
