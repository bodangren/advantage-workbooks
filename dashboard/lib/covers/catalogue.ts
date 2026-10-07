import { BOOK_ORDER } from '../lesson-package/files';

/**
 * The Primary Advantage books that get a cover, in teaching order (track book_covers_20261007).
 * `BOOK_ORDER` has no Origins 2 (it has no lesson packages), so it goes after Origins 1.
 */
export const COVER_BOOKS: string[] = ['origins-1', 'origins-2', ...BOOK_ORDER.filter((b) => b !== 'origins-1')];

/** Lessons in each workbook (Daniel's rule: 14 workbook articles per book). */
export const WORKBOOK_LESSONS = 14;

/** One book as the cover shows it. */
export interface CoverBook {
    id: string;
    /** The title on the cover, for example `Origins 3.2`. */
    name: string;
    series: 'Origins' | 'Quest' | 'Adventure';
    level: number;
    /** The next book in the order; undefined for the last book. */
    next?: CoverBook;
    lessons: number;
    /** The CEFR badge on the back (Daniel, 2026-10-07: A1 for levels 1–6); undefined when not decided. */
    badge?: 'A1';
    /** The asset file name stem, for example `PA-Origins-3.2` (`PA-Origins-3.2-Front Cover.png`). */
    fileStem: string;
}

const SERIES = { origins: 'Origins', quest: 'Quest', adventure: 'Adventure' } as const;

/**
 * A book of the cover order.
 * @param id The book folder name, for example `quest-4`.
 * @returns The book with its next book. Throws for a book that is not in the order.
 */
export function coverBook(id: string): CoverBook {
    const at = COVER_BOOKS.indexOf(id);
    const m = id.match(/^(origins|quest|adventure)-(\d+)(?:\.(\d+))?$/);
    if (at < 0 || !m) throw new Error(`${id} is not a Primary Advantage book (${COVER_BOOKS.join(', ')})`);
    const series = SERIES[m[1] as keyof typeof SERIES];
    const number = m[3] ? `${m[2]}.${m[3]}` : m[2];
    const level = Number(m[2]);
    const name = `${series} ${number}`;
    const nextId = COVER_BOOKS[at + 1];
    return {
        id,
        name,
        series,
        level,
        next: nextId ? coverBook(nextId) : undefined,
        lessons: WORKBOOK_LESSONS,
        badge: level <= 6 ? 'A1' : undefined,
        fileStem: `PA-${name.replace(/ /g, '-')}`,
    };
}
