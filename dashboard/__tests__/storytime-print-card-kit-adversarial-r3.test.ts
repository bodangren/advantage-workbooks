import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readLevelWeeks, STORYTIME_ROOT } from '../lib/storytime/files';
import {
    compileStorytimeStickerSheet,
    STORYTIME_STICKER_CENTER_OVERRIDES,
    storytimeCardKit,
    storytimeCardMatchCounts,
    storytimeCardMatchSource,
    storytimeCardPictureMatchLines,
    storytimeDeliveredPictures,
    type StorytimeCard,
    type StorytimeKitItem,
} from '../lib/storytime/print/card-kit';
import type { StorytimePictureRow } from '../lib/storytime/print/pictures';

/**
 * Phase 8 adversarial tests, run 3 (spec FR-7, FR-9): the fix of run 2 (commit 9ef650dd) for the
 * malformed match lines and the sticker centre map, attacked at its edges. The tests cover a third
 * column of white space, a tab with an empty fourth column, a label with a tab or a line break, a
 * centre map with a null prototype, a centre value with a separator that CSS does not accept, labels
 * with padding, and the shipped match report counts. A test that exposes a defect is marked
 * `it.fails` and stays here for Green. No test changes production code.
 */

/** One card for the match fixtures. */
function card(label: string, kind: StorytimeCard['kind'] = 'picture'): StorytimeCard {
    return { kind, label, size: 'A6', classSet: false };
}

/** The match lines of cards that no row serves. */
const linesOf = (cards: StorytimeCard[]): string[] =>
    storytimeCardPictureMatchLines(cards, [], new Set<string>(), new Map());

describe('the match source of a malformed or short line', () => {
    /**
     * A row id is never white space, so a third column of white space names no source. It must not
     * count as a picture (the same class as X-P8-12, which fixed the empty third column).
     */
    it.fails('X-P8-14 does not count a match line with only white space in the third column as a picture', () => {
        for (const third of [' ', '  ', ' ', ' ']) {
            const line = `picture\tfan\t${third}\tnone: no row`;
            expect(storytimeCardMatchSource(line), `a third column of ${JSON.stringify(third)} names no source`).toBe('none');
        }
        const counts = storytimeCardMatchCounts(['picture\tfan\t \tnone: no row', 'picture\tbus\t\t']);
        expect(counts.picture, 'no white-space line is a picture').toBe(0);
    });

    it('R3-1 reads a tab with an empty fourth column from the third column and keeps the four counts adding up', () => {
        expect(storytimeCardMatchSource('picture\tfan\tl2-w01-card-fan\t'), 'a row id and an empty fourth column is a picture').toBe('picture');
        expect(storytimeCardMatchSource('picture\tfan\tnone\t'), 'none and an empty fourth column is none').toBe('none');
        expect(storytimeCardMatchSource('picture\tfan\tnone\tpatch'), 'the fourth column names the patch source').toBe('patch');
        expect(storytimeCardMatchSource('picture\tred\tpatch\t'), 'the third column names the patch source').toBe('patch');
        expect(storytimeCardMatchSource('picture\tnine\tdots\t'), 'the third column names the dots source').toBe('dots');
        const malformed = ['picture\tfan', 'picture', '', '\t', '\t\t', '\t\t\t', 'picture\tfan\t\t', 'picture\tfan\t\tpatch'];
        for (const line of malformed) {
            expect(storytimeCardMatchSource(line), `${JSON.stringify(line)} names no source`).toBe('none');
        }
        const lines = ['picture\tfan\tl2-w01-card-fan\t', 'picture\tfan\tnone\t', 'picture\tred\tpatch\t', 'picture\tnine\tdots\t', ...malformed];
        const counts = storytimeCardMatchCounts(lines);
        expect(counts.picture + counts.patch + counts.dots + counts.none, 'the four counts add up to the lines').toBe(lines.length);
        expect(counts).toEqual({ picture: 1, patch: 1, dots: 1, none: 1 + malformed.length });
        expect(storytimeCardMatchCounts([]), 'an empty report counts nothing').toEqual({ picture: 0, patch: 0, dots: 0, none: 0 });
        // A card label with padding stays as written: it is not a patch, a dot card, or a picture card.
        const padded = linesOf([card(' red'), card('red '), card(' nine'), card('nine ')]);
        expect(padded, 'a padded label is a plain card with no row').toEqual([
            'picture\t red\tnone\tnone: no row',
            'picture\tred \tnone\tnone: no row',
            'picture\t nine\tnone\tnone: no row',
            'picture\tnine \tnone\tnone: no row',
        ]);
    });

    /**
     * The report holds one line for each card and four tab columns on each line, so a count of the
     * lines is the count of the cards. A label with a tab adds a column; a label with a line break
     * adds a line. A materials line `picture cards: a<TAB>b` reaches the label through the kit,
     * because the kit trims the item and keeps its inner characters.
     */
    it.fails('X-P8-15 keeps one line and four columns for a card whose label holds a tab or a line break', () => {
        const cards = [card('a\tb'), card('c\nd'), card('e\r\nf')];
        const lines = linesOf(cards);
        const file = `${lines.join('\n')}\n`;
        const fileLines = file.split('\n').slice(0, -1);
        expect(fileLines, 'the report file holds one line for each card').toHaveLength(cards.length);
        for (const line of fileLines) expect(line.split('\t'), `${JSON.stringify(line)} holds four columns`).toHaveLength(4);
        const counts = storytimeCardMatchCounts(fileLines);
        expect(counts, 'no card has a row, so each card counts as none').toEqual({ picture: 0, patch: 0, dots: 0, none: cards.length });
    });
});

describe('the sticker centre map', () => {
    /** One sticker item. */
    const sticker = (label: string): StorytimeKitItem => ({ kind: 'sticker', label, week: 1, classSet: false });
    /** The `object-position` value of each sticker of a sheet, by label. */
    function positions(items: StorytimeKitItem[], centers?: Record<string, string>): Map<string, string> {
        const html = compileStorytimeStickerSheet(items, { pictureOf: () => '/tmp/opencode/x.png', centers }).html;
        const map = new Map<string, string>();
        for (const match of html.matchAll(/data-label="([^"]*)"[\s\S]*?object-position:([^"]*)"/g)) map.set(match[1], match[2]);
        return map;
    }

    it('R3-2 reads a centre map with a null prototype and an own __proto__ key, and leaves Object.prototype alone', () => {
        const items = [sticker('Hello'), sticker('Can I?'), sticker('__proto__'), sticker('constructor'), sticker('toString')];
        const bare = Object.create(null) as Record<string, string>;
        bare.Hello = '20% 80%';
        bare['__proto__'] = '10% 10%';
        const ownName: string = 'constructor';
        bare[ownName] = '15% 15%';
        let got = new Map<string, string>();
        expect(() => { got = positions(items, bare); }, 'a null-prototype map does not crash the sheet').not.toThrow();
        expect(got.get('Hello'), 'an own key of a null-prototype map applies').toBe('20% 80%');
        expect(got.get('__proto__'), 'an own __proto__ key applies to the sticker of that name').toBe('10% 10%');
        expect(got.get('constructor'), 'an own constructor key applies').toBe('15% 15%');
        expect(got.get('toString'), 'a name that the map does not hold keeps the default').toBe('50% 50%');
        expect(got.get('Can I?'), 'the module override stays under a map that names other labels').toBe(STORYTIME_STICKER_CENTER_OVERRIDES['Can I?']);
        // A map from JSON.parse holds __proto__ as an own key; it must reach neither the prototype nor the module map.
        const parsed = JSON.parse('{"__proto__":"10% 10%","Hello":"40% 60%"}') as Record<string, string>;
        const fromJson = positions(items, parsed);
        expect(fromJson.get('__proto__')).toBe('10% 10%');
        expect(fromJson.get('Hello')).toBe('40% 60%');
        expect(fromJson.get('constructor'), 'a JSON map does not give another label the value of __proto__').toBe('50% 50%');
        expect(({} as Record<string, unknown>).Hello, 'Object.prototype gained no key').toBeUndefined();
        expect(Object.getPrototypeOf(STORYTIME_STICKER_CENTER_OVERRIDES), 'the module map keeps its prototype').toBe(Object.prototype);
        expect(Object.keys(STORYTIME_STICKER_CENTER_OVERRIDES).sort(), 'the call changed no module entry').toEqual(['Can I?', 'Sam and Pam']);
        // The label match is exact: padding changes the label, and the override does not follow it.
        const padded = positions([sticker(' Hello'), sticker('Hello '), sticker('Can I? ')], { Hello: '20% 80%', ' Hello': '1% 2%' });
        expect(padded.get(' Hello'), 'a padded key applies to the padded label only').toBe('1% 2%');
        expect(padded.get('Hello '), 'a label with a trailing space has no override').toBe('50% 50%');
        expect(padded.get('Can I? '), 'the module override does not follow a padded label').toBe('50% 50%');
    });

    /**
     * Chrome ignores `object-position:20% 80%`: the no-break space is not CSS white space, so
     * the sticker prints at the default centre and the override does nothing (probe in
     * `measure/runs/storytime_print_r1_20261025/adversarial-p8-3f638d98-probe2.mjs`: the computed
     * value is `50% 50%`). The pattern must accept only the white space of CSS: a space, a tab, a
     * line feed, a form feed, and a carriage return. The validator then rejects the value, and
     * the sheet states the default centre on purpose.
     */
    it.fails('X-P8-16 rejects a centre value whose separator is not CSS white space', () => {
        for (const separator of [' ', ' ', ' ', '　']) {
            const got = positions([sticker('Hello')], { Hello: `20%${separator}80%` });
            expect(got.get('Hello'), `a separator of ${JSON.stringify(separator)} is not a valid CSS pair`).toBe('50% 50%');
        }
    });
});

describe('the shipped match report', () => {
    it('R3-3 counts the 106 cards of weeks 1 to 8 as picture 57, patch 8, dots 9, and none 32', () => {
        const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []))
            .filter((week) => week.meta.week <= 8);
        expect(weeks.length, 'the shipped weeks 1 to 8 parse').toBe(8);
        const kit = storytimeCardKit(weeks);
        const rows = JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json'), 'utf8')) as StorytimePictureRow[];
        const { delivered, reasons } = storytimeDeliveredPictures(path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures'), rows);
        const lines = storytimeCardPictureMatchLines(kit.cards, rows, delivered, reasons);
        expect(lines, 'one line for each picture-type card').toHaveLength(106);
        expect(lines.every((line) => line.split('\t').length === 4), 'each line holds four columns').toBe(true);
        const counts = storytimeCardMatchCounts(lines);
        expect(counts, 'the counts of the build of the plan (card-picture-match.txt)').toEqual({ picture: 57, patch: 8, dots: 9, none: 32 });
        expect(counts.picture + counts.patch + counts.dots + counts.none, 'the four counts add up to the lines').toBe(lines.length);
        expect(lines.filter((line) => line.split('\t')[2] === 'none').length, 'a none line has the source none').toBe(counts.none);
    }, 120_000);
});
