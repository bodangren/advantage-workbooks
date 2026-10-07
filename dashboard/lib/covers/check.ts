import { COVER_BOOKS, type CoverBook } from './catalogue';

/**
 * The copy check (track book_covers_20261007, R5). The Canva back covers of levels 1–4 had errors
 * from copied text: "Origins 2" as the next book on the Origins 2, 3.1, and 3.2 backs, "the first
 * step of your adventure" on every Origins book, and "Origins3.2" on the level 4 back. So the cover
 * data writes no book name: `{book}`, `{series}`, and `{next}` come from the catalogue.
 */

export const PLACEHOLDERS = ['book', 'series', 'next', 'lessons'] as const;

/** Phrases that are true only for the first book of the order. */
export const FIRST_BOOK_PHRASES = ['ก้าวแรก', 'first step'];

const SERIES_WORDS = 'Origins|Quest|Adventure';
const capital = (s: string) => s[0].toUpperCase() + s.slice(1).toLowerCase();

/**
 * The book names in a text, also without the space ("Origins3.2") or in capitals ("QUEST 4.1").
 * @param text The text.
 * @returns The names in the catalogue form, for example `Origins 3.2`.
 */
export function bookNames(text: string): string[] {
    return [...text.matchAll(new RegExp(`\\b(${SERIES_WORDS})\\s*(\\d+(?:\\.\\d+)?)`, 'gi'))].map((m) => `${capital(m[1])} ${m[2]}`);
}

/**
 * Fills the placeholders of one text.
 * @param text The text.
 * @param book The cover's book.
 * @returns The text with the names from the catalogue. Throws on an unknown placeholder, or on
 * `{next}` for the last book.
 */
export function expandCoverText(text: string, book: CoverBook): string {
    return text.replace(/\{(\w+)\}/g, (_, key: string) => {
        if (key === 'book') return book.name;
        if (key === 'series') return book.series;
        if (key === 'lessons') return String(book.lessons);
        if (key === 'next') {
            if (!book.next) throw new Error(`{next}: ${book.name} is the last book`);
            return book.next.name;
        }
        throw new Error(`unknown placeholder {${key}}`);
    });
}

/**
 * Checks the cover text of one book.
 * @param book The cover's book.
 * @param fields The texts with a name for the report, for example `back.canDo[2]`.
 * @returns The errors (empty when the text is good).
 */
export function checkCoverText(book: CoverBook, fields: { field: string; text: string }[]): string[] {
    const errors: string[] = [];
    const ownSeries = new Set([book.series, book.next?.series].filter(Boolean));
    for (const { field, text } of fields) {
        for (const name of bookNames(text)) errors.push(`${field}: names "${name}"; write {book} or {next}`);
        for (const m of text.matchAll(new RegExp(`\\b(${SERIES_WORDS})\\b(?!\\s*\\d)`, 'gi'))) {
            if (!ownSeries.has(capital(m[1]) as CoverBook['series'])) errors.push(`${field}: names the ${capital(m[1])} series; the book is ${book.name}`);
        }
        for (const [, key] of text.matchAll(/\{(\w+)\}/g)) {
            if (!(PLACEHOLDERS as readonly string[]).includes(key)) errors.push(`${field}: unknown placeholder {${key}}`);
            else if (key === 'next' && !book.next) errors.push(`${field}: {next}, but ${book.name} is the last book`);
        }
        if (book.id !== COVER_BOOKS[0]) {
            for (const phrase of FIRST_BOOK_PHRASES) if (text.toLowerCase().includes(phrase)) errors.push(`${field}: "${phrase}" is true only for the first book`);
        }
    }
    return errors;
}
