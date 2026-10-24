import type { Clip, ClipTiming } from '../media/audio';
import type { StorytimeBook } from './schema';

/**
 * The book audio of a Storytime week (scripts/storytime/book-audio.ts): one mmx clip for each
 * sentence of the pages, joined with a short gap in a page and a long gap at a page turn. The
 * sentence times come from the sample counts; the word times come from a speech recognizer on each
 * clip, or from the letter counts when the recognizer hears a different number of words.
 */

/** The silence after a sentence in a page, and after the last sentence of a page (ms). */
export const BOOK_GAPS = { sentenceGapMs: 500, pageGapMs: 1200 } as const;

/** The speeds of the book audio: `file` at 1.0 and `slowFile` at 0.75 (design §6.1). */
export const BOOK_SPEEDS = { normal: 1, slow: 0.75 } as const;

/** The audio timing of one word, in seconds. */
export interface WordTime {
    word: string;
    start: number;
    end: number;
}

/** One sentence of a book with its 1-based page. */
export interface BookSentence {
    text: string;
    page: number;
}

/**
 * Splits the text of a page into sentences: a sentence ends at ".", "!", or "?" and a space.
 * @param text The text of one page.
 * @returns The sentences in order.
 */
export function pageSentences(text: string): string[] {
    return text
        .trim()
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.length > 0);
}

/**
 * The sentences of a book in reading order, with their pages. The cover title is not read.
 * @param book A book of a week package.
 * @returns The sentences.
 */
export function bookSentences(book: Pick<StorytimeBook, 'pages'>): BookSentence[] {
    return book.pages.flatMap((p, i) => pageSentences(p.text).map((text) => ({ text, page: i + 1 })));
}

/**
 * The clips of a book (no samples yet): a page turn has the long gap.
 * @param sentences The sentences of the book.
 * @param gaps The gaps.
 * @returns One clip for each sentence; the gap of the last clip is not added.
 */
export function bookClips(sentences: BookSentence[], gaps: { sentenceGapMs: number; pageGapMs: number } = BOOK_GAPS): Omit<Clip, 'samples'>[] {
    return sentences.map((s, i) => ({
        text: s.text,
        gapAfterMs: i === sentences.length - 1 ? 0 : sentences[i + 1].page === s.page ? gaps.sentenceGapMs : gaps.pageGapMs,
    }));
}

const EDGE = /[\p{L}\p{N}]/u;

/**
 * The words of a sentence as the read-along player shows them: the monorepo `tokenizeWords`
 * (`apps/primary-advantage/lib/read-along/align.ts`). Whitespace and dashes separate; edge punctuation goes.
 * @param sentence A sentence.
 * @returns The words in order.
 */
export function screenWords(sentence: string): string[] {
    const words: string[] = [];
    for (const chunk of sentence.match(/[^\s—–]+/gu) ?? []) {
        const chars = Array.from(chunk);
        const first = chars.findIndex((c) => EDGE.test(c));
        if (first === -1) continue;
        let last = chars.length - 1;
        while (!EDGE.test(chars[last])) last--;
        words.push(chars.slice(first, last + 1).join(''));
    }
    return words;
}

const round = (s: number) => Math.round(s * 1000) / 1000;

/** The number words that the recognizer writes as digits ("Three!" as "3."). */
const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

/** Lower-case letters and digits only, with the number words as digits, for comparison. */
const squash = (text: string) =>
    text
        .toLowerCase()
        .replace(/[\p{L}]+/gu, (w) => (NUMBERS.includes(w) ? String(NUMBERS.indexOf(w)) : w))
        .replace(/[^\p{L}\p{N}]/gu, '');

/**
 * True when the recognizer heard the words of the sentence (case, punctuation, and digits for number
 * words do not count). A clip that it hears as other words ("Nan cannot." for "Nan can nod!") is a bad take.
 * @param sentence The sentence.
 * @param heard The recognized words of its clip.
 * @returns True for a match.
 */
export function heardMatches(sentence: string, heard: WordTime[]): boolean {
    return squash(heard.map((w) => w.word).join(' ')) === squash(sentence);
}

/**
 * The word times of one sentence in the joined audio. When the recognizer heard the same number of
 * words as the sentence has, its times are used (clamped into the clip and kept in order). Else the
 * clip is split by the letter count of each word.
 * @param sentence The sentence.
 * @param heard The recognized words, in seconds from the start of the trimmed clip.
 * @param span The time of the clip in the joined audio.
 * @returns One time for each screen word, with the screen word as `word`.
 */
export function fitWords(sentence: string, heard: WordTime[], span: { startTime: number; endTime: number }): WordTime[] {
    const words = screenWords(sentence);
    const length = span.endTime - span.startTime;
    if (words.length === 0 || length <= 0) return [];
    if (heard.length === words.length) {
        let floor = 0;
        return words.map((word, i) => {
            const start = Math.min(Math.max(heard[i].start, floor), length);
            const end = i === words.length - 1 ? length : Math.min(Math.max(heard[i].end, start), length);
            floor = end;
            return { word, start: round(span.startTime + start), end: round(span.startTime + end) };
        });
    }
    const weights = words.map((w) => Array.from(w).length + 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let at = 0;
    return words.map((word, i) => {
        const start = (at / total) * length;
        at += weights[i];
        return { word, start: round(span.startTime + start), end: round(span.startTime + (at / total) * length) };
    });
}

/**
 * The `sentences` value of the book audio: the read-along player's sentence timepoints with the page.
 * @param sentences The sentences of the book.
 * @param timings The clip times from `joinClips`, in the same order.
 * @param heard The recognized words of each clip, in the same order.
 * @returns The sentence timepoints.
 */
export function bookTimepoints(sentences: BookSentence[], timings: ClipTiming[], heard: WordTime[][]) {
    if (timings.length !== sentences.length || heard.length !== sentences.length) throw new Error('The sentences, the clip times, and the heard words must have the same length');
    return sentences.map((s, i) => ({
        sentence: s.text,
        startTime: timings[i].startTime,
        endTime: timings[i].endTime,
        words: fitWords(s.text, heard[i], timings[i]),
        page: s.page,
    }));
}

/**
 * The file name of a book's audio: its 1-based number and a slug of its title.
 * @param index The 0-based index of the book in the week.
 * @param title The book title.
 * @param slow True for the 0.75 speed file.
 * @returns For example "1-hello.mp3" or "2-nan-can-nod-slow.mp3".
 */
export function bookAudioName(index: number, title: string, slow: boolean): string {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `${index + 1}-${slug}${slow ? '-slow' : ''}.mp3`;
}
