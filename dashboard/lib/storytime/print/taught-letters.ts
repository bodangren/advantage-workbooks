/**
 * The letters that Storytime Level 2 unit 1 teaches, one letter for each teaching week, and the
 * rule for a dictated word of step C3 (A-48): a word whose letters are all taught by its week gets
 * sound boxes ("Say. Write."); a word with a letter that is not taught yet is a trace row
 * ("Trace."), because the child cannot write a letter that the book has not shown.
 */

/** The letter of teaching weeks 1 to 7, in order (the `print.letterBox.letter` of each week file). */
export const STORYTIME_LETTER_ORDER: readonly string[] = ['n', 'a', 'p', 'm', 's', 't', 'o'];

/** How a dictated word prints on the write page. */
export type DictationRowKind = 'sound-boxes' | 'trace';

/**
 * The letters taught in a week and before it.
 * @param week The teaching week number; a week after the last letter week has every letter.
 * @returns The taught letters, in teaching order.
 */
export function taughtLetters(week: number): string[] {
    return STORYTIME_LETTER_ORDER.slice(0, Math.max(0, week));
}

/**
 * The row kind of a dictated word in a week. Capital letters count as their small letter; marks
 * and digits do not count as letters.
 * @param word The dictated word.
 * @param week The teaching week number.
 * @returns `sound-boxes` when every letter of the word is taught by the week, else `trace`.
 */
export function dictationRowKind(word: string, week: number): DictationRowKind {
    const taught = new Set(taughtLetters(week));
    const letters = Array.from(word.toLowerCase()).filter((ch) => /\p{L}/u.test(ch));
    return letters.every((ch) => taught.has(ch)) ? 'sound-boxes' : 'trace';
}
