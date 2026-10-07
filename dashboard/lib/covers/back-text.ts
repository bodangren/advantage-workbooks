import type { CoverBook } from './catalogue';
import { checkCoverText, expandCoverText } from './check';
import type { CoverData, CoverSeries } from './schema';

/**
 * The back text of a cover (track book_covers_20261007): the fixed lines of the Canva back, the
 * series paragraphs, and the book's own text, checked and with the placeholders filled. Text uses
 * `**bold**` and `\n` for a line break that the author wants.
 */

/**
 * The fixed lines (from the Canva back, 2026-10-07). Daniel (2026-10-07): the phone number in the
 * Thai form, without +66 (the Canva line "+66 099-005-8038" mixed two forms), and "TikTok".
 */
export const BACK_LINES = {
    seriesHeading: 'เกี่ยวกับซีรีส์ **{series}**',
    bookHeading: 'เกี่ยวกับเล่มนี้',
    canDoIntro: 'เมื่อเรียนจบเล่มนี้ คุณจะสามารถ:',
    nextPoint: 'พร้อมก้าวสู่ **{next}** เพื่อเดินทางต่อไป',
    contact: ['ติดต่อเรา', 'อีเมล: **support@reading-advantage.com**', 'โทรศัพท์: **099-005-8038**', 'ขอนแก่น ประเทศไทย', '**TikTok @reading.advantage**'],
};

/** The back text with the names filled in. */
export interface BackText {
    seriesHeading: string;
    seriesParagraphs: string[];
    bookHeading: string;
    bookParagraph: string;
    canDoIntro: string;
    canDo: string[];
    contact: string[];
}

/**
 * Builds and checks the back text of one book.
 * @param book The book.
 * @param data Its cover data.
 * @param series The series paragraphs.
 * @returns The text. Throws with every copy-check error, or when the series has no paragraphs.
 */
export function backText(book: CoverBook, data: Pick<CoverData, 'back'>, series: CoverSeries): BackText {
    const seriesParagraphs = series[book.series];
    if (!seriesParagraphs?.length) throw new Error(`content/covers/series.json has no ${book.series} paragraphs`);
    const canDo = [...data.back.canDo, ...(book.next ? [BACK_LINES.nextPoint] : [])];
    const fields = [
        ...seriesParagraphs.map((text, i) => ({ field: `series.${book.series}[${i}]`, text })),
        { field: 'back.book', text: data.back.book },
        ...canDo.map((text, i) => ({ field: `back.canDo[${i}]`, text })),
    ];
    const errors = checkCoverText(book, fields);
    if (errors.length) throw new Error(`${book.name} cover text:\n  ${errors.join('\n  ')}`);
    const x = (t: string) => expandCoverText(t, book);
    return {
        seriesHeading: x(BACK_LINES.seriesHeading),
        seriesParagraphs: seriesParagraphs.map(x),
        bookHeading: x(BACK_LINES.bookHeading),
        bookParagraph: x(data.back.book),
        canDoIntro: x(BACK_LINES.canDoIntro),
        canDo: canDo.map(x),
        contact: BACK_LINES.contact,
    };
}

const escapeHtml = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * One text as HTML: escaped, `**bold**` as `<b>`, and `\n` as `<br>`. With `phrases`, each run
 * between two spaces is one no-wrap `<span class="ph">`, so a line breaks only at a space (as in
 * the Canva covers); Chrome alone breaks Thai inside compound words ("งาน / อดิเรก"). A `|` in a
 * long run marks one more place where the line may break (it is not printed).
 * @param text The text.
 * @param phrases Keep each run between two spaces on one line.
 * @returns The HTML.
 */
export function richHtml(text: string, phrases = false): string {
    let bold = false;
    const run = (chunk: string) => {
        let html = bold ? '<b>' : '';
        for (const [i, part] of chunk.split('**').entries()) {
            if (i > 0) {
                html += bold ? '</b>' : '<b>';
                bold = !bold;
            }
            html += escapeHtml(part);
        }
        return html + (bold ? '</b>' : '');
    };
    return text
        .split('\n')
        .map((line) =>
            phrases
                ? line
                      .split(' ')
                      .map((c) => c.split('|').map((p) => `<span class="ph">${run(p)}</span>`).join('<wbr>'))
                      .join(' ')
                : run(line.replace(/\|/g, '')),
        )
        .join('<br>');
}
