// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { BOOK_GAPS, bookAudioName, bookClips, bookSentences, bookTimepoints, fitWords, heardMatches, pageSentences, screenWords } from '../lib/storytime/book-audio';

const book = { pages: [{ text: 'How many suns? One!' }, { text: 'Hello, I am Pat.' }, { text: 'Nan can nod!' }] };

describe('book sentences and clips', () => {
    it('splits a page at the end of each sentence and keeps the 1-based page', () => {
        expect(pageSentences('How many suns? One!')).toEqual(['How many suns?', 'One!']);
        expect(pageSentences(' A nest. ')).toEqual(['A nest.']);
        expect(bookSentences(book)).toEqual([
            { text: 'How many suns?', page: 1 },
            { text: 'One!', page: 1 },
            { text: 'Hello, I am Pat.', page: 2 },
            { text: 'Nan can nod!', page: 3 },
        ]);
    });

    it('gives the short gap in a page, the long gap at a page turn, and no gap at the end', () => {
        expect(bookClips(bookSentences(book)).map((c) => c.gapAfterMs)).toEqual([BOOK_GAPS.sentenceGapMs, BOOK_GAPS.pageGapMs, BOOK_GAPS.pageGapMs, 0]);
        expect(BOOK_GAPS.pageGapMs).toBeGreaterThan(BOOK_GAPS.sentenceGapMs);
    });
});

describe('word times', () => {
    it('takes the words as the read-along player shows them', () => {
        expect(screenWords('Hello, I am Pat.')).toEqual(['Hello', 'I', 'am', 'Pat']);
        expect(screenWords('"Run, Tom — run!"')).toEqual(['Run', 'Tom', 'run']);
        expect(screenWords("Pip's hat.")).toEqual(["Pip's", 'hat']);
    });

    it('uses the heard times when the word counts agree, in the joined audio and in order', () => {
        const heard = [
            { word: 'Hello,', start: 0.0, end: 0.5 },
            { word: 'I', start: 0.6, end: 0.7 },
            { word: 'am', start: 0.65, end: 0.9 },
            { word: 'Pet.', start: 1.0, end: 1.3 },
        ];
        const words = fitWords('Hello, I am Pat.', heard, { startTime: 10, endTime: 11.5 });
        expect(words.map((w) => w.word)).toEqual(['Hello', 'I', 'am', 'Pat']);
        // The last word lasts to the end of the clip.
        expect(words.map((w) => [w.start, w.end])).toEqual([
            [10, 10.5],
            [10.6, 10.7],
            [10.7, 10.9],
            [11, 11.5],
        ]);
        // Heard times after the end of the clip stay in the clip.
        const late = fitWords('A nest.', [
            { word: 'A', start: 0, end: 5 },
            { word: 'nest', start: 5.5, end: 6 },
        ], { startTime: 2, endTime: 3 });
        expect(late.map((w) => [w.start, w.end])).toEqual([
            [2, 3],
            [3, 3],
        ]);
    });

    it('splits the clip by the letter counts when the recognizer hears another number of words', () => {
        const words = fitWords('A nest.', [{ word: 'Honest.', start: 0, end: 0.8 }], { startTime: 2, endTime: 3 });
        expect(words).toEqual([
            // The weights are the letters plus one: 2 and 5 of 7.
            { word: 'A', start: 2, end: 2.286 },
            { word: 'nest', start: 2.286, end: 3 },
        ]);
        expect(fitWords('One!', [], { startTime: 1, endTime: 1 })).toEqual([]);
    });

    it('finds a take that the recognizer hears as other words', () => {
        const heard = (text: string) => text.split(' ').map((word, i) => ({ word, start: i, end: i + 1 }));
        expect(heardMatches('Hello, I am Nan.', heard('Hello. I am Nan.'))).toBe(true);
        expect(heardMatches('A neck.', heard('A Neck?'))).toBe(true);
        expect(heardMatches('Nan can nod!', heard('Nan cannot.'))).toBe(false);
        expect(heardMatches('How many cakes? Seven!', heard('How many cakes? 7.'))).toBe(true);
        expect(heardMatches('I have one nose.', heard('I have 1 nose.'))).toBe(true);
        expect(heardMatches('Seven!', heard('11.'))).toBe(false);
        expect(heardMatches('A nest.', [])).toBe(false);
    });

    it('gives one timepoint for each sentence, with its page and its words', () => {
        const sentences = bookSentences({ pages: [{ text: 'A net. A nut.' }] });
        const timings = [
            { text: 'A net.', startTime: 0, endTime: 1 },
            { text: 'A nut.', startTime: 1.5, endTime: 2.5 },
        ];
        const points = bookTimepoints(sentences, timings, [[], []]);
        expect(points.map((p) => [p.sentence, p.startTime, p.endTime, p.page, p.words.length])).toEqual([
            ['A net.', 0, 1, 1, 2],
            ['A nut.', 1.5, 2.5, 1, 2],
        ]);
        expect(() => bookTimepoints(sentences, timings.slice(1), [[], []])).toThrow(/same length/);
    });
});

describe('file names', () => {
    it('names the file by the book number and a slug of the title', () => {
        expect(bookAudioName(0, 'Hello!', false)).toBe('1-hello.mp3');
        expect(bookAudioName(1, 'Nan Can Nod', true)).toBe('2-nan-can-nod-slow.mp3');
    });
});
