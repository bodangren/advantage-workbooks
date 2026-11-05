// @vitest-environment jsdom
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { resolveStorytimePictureFiles } from '../lib/storytime/print/picture-check';
import type { StorytimePictureRow, StorytimePictureUse } from '../lib/storytime/print/pictures';
import {
    compileStorytimeCardSheet,
    compileStorytimeStickerSheet,
    cardSheetDocument,
    storytimeCardKit,
    storytimeCardPictureMatchLines,
    storytimeCardPictureRow,
    type StorytimeCard,
    type StorytimeCardKind,
    type StorytimeKitItem,
} from '../lib/storytime/print/card-kit';

/**
 * Phase 8 Green r3: the guards that Reviews A, B, and C asked for (A-P8-1, B-P8-5, C-P8-2).
 *
 * 1. The PM picture match rule of 2026-11-05: the case (a) text match, the case (b) story-page
 *    match, the singular rule, the delivered-file rule, and the counts of the shipped weeks.
 * 2. The HTML escape of a hostile label in a card, a sticker, and the document title.
 * 3. The sticker line that mixes a quoted name and an unquoted name.
 *
 * Every count below is written by hand. The shipped counts come from the Green build log of
 * 2026-11-06: 106 picture-type cards, 57 matched, 49 with no match; 94 distinct words, 46
 * matched, 48 with no match.
 */

const HOSTILE = '<img src=x onerror=1>"&';
const ESCAPED = '&lt;img src=x onerror=1&gt;&quot;&amp;';

/** One picture-list row, with the fields that the match rule does not read filled in. */
function pictureRow(row: {
    id: string;
    text: string;
    use: StorytimePictureUse;
    week?: number;
    objectCounts?: Record<string, number>;
}): StorytimePictureRow {
    return {
        id: row.id,
        week: row.week ?? 1,
        use: row.use,
        text: row.text,
        prompt: '',
        caption: '',
        objectCounts: row.objectCounts ?? {},
        sizeClass: 'C',
        fileName: `${row.id}-v1.png`,
        lineArtFileName: `${row.id}-line-v1.png`,
        width: 1500,
        height: 1500,
    };
}

/** One card of the kit, with a picture label by default. */
function card(label: string, kind: StorytimeCardKind = 'picture'): StorytimeCard {
    return { kind, label, size: 'A6', classSet: false };
}

/** The parsed weeks of the shipped Level 2 folder. */
function weeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_value, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8')),
    ));
}

/**
 * The shipped facts of one test run: the cards, the picture rows, and the delivered row ids of the
 * shipped picture folder. The resolution reads and hashes every picture file, so one test run
 * resolves it once.
 */
let shippedFacts: { cards: StorytimeCard[]; rows: StorytimePictureRow[]; delivered: Set<string> } | undefined;

function shipped(): { cards: StorytimeCard[]; rows: StorytimePictureRow[]; delivered: Set<string> } {
    if (shippedFacts) return shippedFacts;
    const folder = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');
    const rows = JSON.parse(
        fs.readFileSync(path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json'), 'utf8'),
    ) as StorytimePictureRow[];
    const color = resolveStorytimePictureFiles(folder, rows, 'color');
    resolveStorytimePictureFiles(folder, rows, 'line');
    shippedFacts = {
        cards: storytimeCardKit(weeks()).cards,
        rows,
        delivered: new Set(color.map((entry) => entry.rowId)),
    };
    return shippedFacts;
}

describe('the PM picture match rule of 2026-11-05', () => {
    it('G-P8-M1 a case (a) row wins over an earlier case (b) story-page row of the same word', () => {
        const page = pictureRow({
            id: 'page-cat', use: 'story-page', week: 1, text: 'A cat.', objectCounts: { cat: 1 },
        });
        const check = pictureRow({ id: 'check-cat', use: 'check-row', week: 3, text: 'cat' });
        const delivered = new Set([page.id, check.id]);
        expect(storytimeCardPictureRow(card('cat'), [page, check], delivered)?.id, 'the case (a) row wins')
            .toBe('check-cat');
        // Negative control: without the case (a) row the page row is the match, so the order alone decides.
        expect(storytimeCardPictureRow(card('cat'), [page], delivered)?.id, 'the page row alone is a match')
            .toBe('page-cat');
    });

    it('G-P8-M2 a story-page row with two object counts does not match a card', () => {
        const page = pictureRow({
            id: 'page-cat-dog', use: 'story-page', text: 'A cat and a dog.', objectCounts: { cat: 1, dog: 1 },
        });
        expect(storytimeCardPictureRow(card('cat'), [page], new Set([page.id])), 'a two-object page shows no one thing')
            .toBeUndefined();
        // Negative control: the same row with one count is a match.
        const single = pictureRow({ id: 'page-cat', use: 'story-page', text: 'A cat.', objectCounts: { cat: 1 } });
        expect(storytimeCardPictureRow(card('cat'), [single], new Set([single.id]))?.id, 'one count is a match')
            .toBe('page-cat');
    });

    it('G-P8-M3 a plural card word matches the singular object count of a story-page row', () => {
        const arms = pictureRow({ id: 'page-arms', use: 'story-page', text: 'Two arms.', objectCounts: { arm: 2 } });
        const feet = pictureRow({ id: 'page-feet', use: 'story-page', text: 'Two feet.', objectCounts: { foot: 2 } });
        const delivered = new Set([arms.id, feet.id]);
        expect(storytimeCardPictureRow(card('arms'), [arms], delivered)?.id, 'the singular key arm').toBe('page-arms');
        expect(storytimeCardPictureRow(card('feet'), [feet], delivered)?.id, 'the irregular singular foot').toBe('page-feet');
        // Negative control: a different noun does not match.
        expect(storytimeCardPictureRow(card('hands'), [arms], delivered), 'another noun finds no row').toBeUndefined();
    });

    it('G-P8-M4 a row without both delivered files does not match', () => {
        const check = pictureRow({ id: 'check-cat', use: 'check-row', text: 'cat' });
        expect(storytimeCardPictureRow(card('cat'), [check], new Set()), 'no delivered file means no picture')
            .toBeUndefined();
        expect(storytimeCardPictureRow(card('cat'), [check], new Set(['check-cat']))?.id, 'both files delivered')
            .toBe('check-cat');
    });

    it('G-P8-M5 the shipped weeks give 106 picture-type cards: 57 matched and 49 with no match', () => {
        const { cards, rows, delivered } = shipped();
        const lines = storytimeCardPictureMatchLines(cards, rows, delivered);
        expect(lines, 'one report line for each picture-type card').toHaveLength(106);
        const fields = lines.map((line) => line.split('\t'));
        expect(fields.every((field) => field.length === 4), 'each line holds kind, label, row id or none, and reason')
            .toBe(true);
        const matched = fields.filter((field) => field[2] !== 'none');
        const none = fields.filter((field) => field[2] === 'none');
        expect(matched, 'the matched picture cards').toHaveLength(57);
        expect(none, 'the picture cards with no match').toHaveLength(49);
        expect(matched.every((field) => field[3] === 'text' || field[3] === 'page'), 'a matched line names its case')
            .toBe(true);
        expect(none.every((field) => field[3].startsWith('none: ')), 'a none line carries its reason').toBe(true);
    }, 120_000);

    it('G-P8-M6 the shipped picture cards hold 94 distinct words: 46 matched and 48 with no match', () => {
        const { cards, rows, delivered } = shipped();
        const fields = storytimeCardPictureMatchLines(cards, rows, delivered)
            .map((line) => line.split('\t'));
        const words = new Map<string, boolean>();
        for (const field of fields) {
            const key = field[1].toLowerCase();
            if (!words.has(key)) words.set(key, field[2] !== 'none');
        }
        expect(words.size, 'the distinct picture words').toBe(94);
        expect([...words.values()].filter(Boolean).length, 'the words with a picture').toBe(46);
        expect([...words.values()].filter((matched) => !matched).length, 'the words with no picture').toBe(48);
    }, 120_000);

    it('G-P8-M7 a none line says why the card has no picture', () => {
        const check = pictureRow({ id: 'check-cat', use: 'check-row', text: 'cat' });
        const noRow = storytimeCardPictureMatchLines([card('yacht')], [check], new Set([check.id]));
        expect(noRow, 'no row at all').toEqual(['picture\tyacht\tnone\tnone: no row']);
        const notDelivered = storytimeCardPictureMatchLines([card('cat')], [check], new Set());
        expect(notDelivered, 'a row without both files').toEqual(['picture\tcat\tnone\tnone: files not delivered']);
        const broken = storytimeCardPictureMatchLines(
            [card('cat')], [check], new Set(), new Map([['check-cat', 'picture missing: check-cat (check-cat-v1.png)']]),
        );
        expect(broken, 'a file error keeps its message')
            .toEqual(['picture\tcat\tnone\tnone: picture missing: check-cat (check-cat-v1.png)']);
        const matched = storytimeCardPictureMatchLines([card('cat')], [check], new Set(['check-cat']));
        expect(matched, 'a matched line names the case').toEqual(['picture\tcat\tcheck-cat\ttext']);
    });
});

describe('the HTML escape of a hostile label (Review B, B-P8-5)', () => {
    it('G-P8-X1 a hostile picture-card label is escaped in the card sheet', () => {
        const compiled = compileStorytimeCardSheet([card(HOSTILE)], 'A6');
        const { html } = compiled;
        expect(html, 'the escaped label sits in the card').toContain(ESCAPED);
        expect(html, 'the raw tag is not in the document').not.toContain('<img src=x');
        expect(html, 'the attribute carries the escaped text').toContain(`data-label="${ESCAPED}"`);
        expect(compiled.sheets, 'one sheet').toBe(1);
    });

    it('G-P8-X2 a hostile sticker label is escaped on the sticker sheet', () => {
        const sticker: StorytimeKitItem = { kind: 'sticker', label: HOSTILE, week: 1, classSet: false };
        const { html } = compileStorytimeStickerSheet([sticker]);
        expect(html, 'the escaped label sits in the sticker').toContain(ESCAPED);
        expect(html, 'the raw tag is not in the document').not.toContain('<img src=x');
        expect(html, 'the attribute carries the escaped text').toContain(`data-label="${ESCAPED}"`);
    });

    it('G-P8-X3 a hostile document title is escaped in the head', () => {
        const doc = cardSheetDocument('<div class="card">x</div>', HOSTILE, 'A6');
        expect(doc, 'the escaped title sits in the head').toContain(`<title>${ESCAPED}</title>`);
        expect(doc, 'the raw title tag is not in the document').not.toContain('<title><img');
    });
});

describe('the sticker materials line (Review C, C-P8-2)', () => {
    it('G-P8-S1 a line with one quoted name and one unquoted name keeps both stickers', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-p8-r3-'));
        try {
            const copy = path.join(root, 'w01.json');
            const raw = JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')) as {
                scripts: { steps: { materials: string[] }[] }[];
            };
            let replaced = 0;
            for (const script of raw.scripts) {
                for (const step of script.steps) {
                    step.materials = step.materials.map((line) => {
                        if (line !== 'stickers: "Nan Can Nod"') return line;
                        replaced++;
                        return 'stickers: "Nan Can Nod", unit 2';
                    });
                }
            }
            expect(replaced, 'the replaced sticker line of the copy of week 1').toBe(1);
            fs.writeFileSync(copy, JSON.stringify(raw, null, 2));
            const week = StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(copy, 'utf8')));
            const kit = storytimeCardKit([week]);
            const stickers = kit.items.filter((item) => item.kind === 'sticker').map((item) => item.label);
            expect(stickers, 'the quoted sticker keeps its comma and the unquoted one is kept too')
                .toContain('Nan Can Nod');
            expect(stickers, 'the unquoted sticker of the mixed line').toContain('unit 2');
            expect(stickers, 'both stickers of the mixed line').toHaveLength(2);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});
