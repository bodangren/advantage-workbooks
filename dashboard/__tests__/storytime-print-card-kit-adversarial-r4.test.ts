import { describe, expect, it } from 'vitest';
import {
    storytimeCardMatchCounts,
    storytimeCardPictureMatchLines,
    type StorytimeCard,
} from '../lib/storytime/print/card-kit';

/**
 * Phase 8 adversarial tests, run 4 (spec FR-7, FR-9): the label of a card in the match report
 * (fix F54 of commit ba3acddc, review item A-P8-28). The test of run 3 counted lines and columns
 * only. These tests assert the label text of each match line, so each rule of `matchLabel` has a
 * guard: one space for each run, a bare carriage return, the escape character (U+001B), the next
 * line character (U+0085), the rest of the C0, DEL, and C1 ranges, the no-break space, and the
 * padding that stays. A test here passes on the code of ba3acddc. No test changes production code.
 */

/** One card for the match fixtures. */
function card(label: string, kind: StorytimeCard['kind'] = 'picture'): StorytimeCard {
    return { kind, label, size: 'A6', classSet: false };
}

/** The match lines of cards that no row serves. */
const linesOf = (cards: StorytimeCard[]): string[] =>
    storytimeCardPictureMatchLines(cards, [], new Set<string>(), new Map());

/** The label column (column 2) of each match line. */
const labelsOf = (lines: string[]): string[] => lines.map((line) => line.split('\t')[1]);

describe('the label text of a match line', () => {
    it('X-P8-17 turns a tab, a line feed, and a carriage return and line feed pair into one space', () => {
        const lines = linesOf([card('a\tb'), card('c\nd'), card('e\r\nf')]);
        expect(labelsOf(lines), 'one space between the two words, as A-P8-28 asks').toEqual(['a b', 'c d', 'e f']);
        expect(lines, 'the whole line keeps its shape').toEqual([
            'picture\ta b\tnone\tnone: no row',
            'picture\tc d\tnone\tnone: no row',
            'picture\te f\tnone\tnone: no row',
        ]);
    });

    it('X-P8-18 turns a bare carriage return into one space', () => {
        const lines = linesOf([card('g\rh'), card('i\r\rj')]);
        expect(labelsOf(lines)).toEqual(['g h', 'i j']);
        expect(lines.join('\n'), 'no carriage return stays in the report').not.toContain('\r');
    });

    it('X-P8-19 turns the escape character and the other control characters into one space', () => {
        const lines = linesOf([
            card('k\u001bl'),
            card('m\u0085n'),
            card('o\u0000p'),
            card('q\u007fr'),
            card('s\u0090t'),
            card('u\u009fv'),
            card('w\u000bx'),
            card('y\u000cz'),
        ]);
        expect(labelsOf(lines)).toEqual(['k l', 'm n', 'o p', 'q r', 's t', 'u v', 'w x', 'y z']);
        expect(lines.join('\n'), 'no escape character stays in the report').not.toContain('\u001b');
        expect(lines.join('\n'), 'no U+0085 stays in the report').not.toContain('\u0085');
        for (const line of lines) {
            expect(line, `${JSON.stringify(line)} holds no control character but the tab separators`).not.toMatch(/[\u0000-\u0008\u000a-\u001f\u007f-\u009f]/);
            expect(line.split('\t'), `${JSON.stringify(line)} holds four columns`).toHaveLength(4);
        }
    });

    it('X-P8-20 turns each run of mixed characters into one space, not one space for each character', () => {
        const lines = linesOf([
            card('a \t \n b'),
            card('c\u001b\u0085\r d'),
            card('e  　f'),
            card('g h i'),
        ]);
        expect(labelsOf(lines)).toEqual(['a b', 'c d', 'e f', 'g h i']);
    });

    it('X-P8-21 keeps a run of padding as one space and does not trim the label', () => {
        const lines = linesOf([card('\tx'), card('x\n'), card('  y  z  '), card('\u001bq')]);
        expect(labelsOf(lines), 'a padding run becomes one space; the label keeps it').toEqual([' x', 'x ', ' y z ', ' q']);
    });

    it('X-P8-22 keeps the label of a clean card as it stands', () => {
        const lines = linesOf([card('red apple'), card('Sam and Pam'), card("Can I?"), card('go-go')]);
        expect(labelsOf(lines)).toEqual(['red apple', 'Sam and Pam', "Can I?", 'go-go']);
    });

    it('X-P8-23 counts every card with a control character in the label as none, one line each', () => {
        const cards = [card('a\tb'), card('c\nd'), card('e\r\nf'), card('g\rh'), card('i\u001bj'), card('k\u0085l')];
        const fileLines = `${linesOf(cards).join('\n')}\n`.split('\n').slice(0, -1);
        expect(fileLines, 'the report file holds one line for each card').toHaveLength(cards.length);
        expect(storytimeCardMatchCounts(fileLines)).toEqual({ picture: 0, patch: 0, dots: 0, none: cards.length });
    });
});
