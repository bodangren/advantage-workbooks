import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import type { StorytimePictureRow, StorytimePictureUse } from '../lib/storytime/print/pictures';
import {
    compileStorytimeStickerSheet,
    storytimeCardKit,
    storytimeCardPagePlan,
    storytimeCardPictureMatchLines,
    storytimeCardPictureRow,
    type StorytimeCard,
    type StorytimeCardKind,
    type StorytimeKitItem,
} from '../lib/storytime/print/card-kit';
import { parseStorytimeCardKitArgs } from '../lib/storytime/print/card-kit-cli';

/**
 * Phase 8 adversarial tests for the card kit (spec FR-7).
 * Each test attacks the shipped implementation with hostile or edge input.
 * Tests that expose a defect stay in this file and route to Green.
 * No test in this file changes production code or an existing test.
 */

const HOSTILE = '<img src=x onerror=1>"&';
const ESCAPED = '&lt;img src=x onerror=1&gt;&quot;&amp;';

/** One picture-list row for match-rule fixtures. */
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

/** One card for page-plan and match fixtures. */
function card(label: string, kind: StorytimeCardKind = 'picture'): StorytimeCard {
    return { kind, label, size: 'A6', classSet: false };
}

/** One A5 sound card for page-plan fixtures. */
function a5card(label: string): StorytimeCard {
    return { kind: 'sound', label, size: 'A5', classSet: false };
}

/** A temp copy of the week files under /tmp/opencode. */
function tempWeekRoot(): string {
    const root = fs.mkdtempSync('/tmp/opencode/storytime-p8-adv-');
    const folder = path.join(root, 'l2');
    fs.mkdirSync(folder, { recursive: true });
    for (let week = 1; week <= 8; week++) {
        fs.copyFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), path.join(folder, `w0${week}.json`));
    }
    return root;
}

/** The parsed weeks of a temp copy. */
function weeksFrom(root: string, count = 8): StorytimeWeek[] {
    return Array.from({ length: count }, (_value, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(path.join(root, 'l2', `w0${index + 1}.json`), 'utf8')),
    ));
}

/** The raw JSON of one temp week copy for mutation. */
function rawWeek(root: string, week: number): { scripts: { steps: { materials: string[] }[] }[] } {
    return JSON.parse(fs.readFileSync(path.join(root, 'l2', `w0${week}.json`), 'utf8')) as {
        scripts: { steps: { materials: string[] }[] }[];
    };
}

/** Writes the raw JSON back to one temp week copy. */
function writeWeek(root: string, week: number, raw: unknown): void {
    fs.writeFileSync(path.join(root, 'l2', `w0${week}.json`), JSON.stringify(raw, null, 2));
}

/** Appends a materials line to the first step of the first script of a temp week. */
function appendMaterial(root: string, week: number, line: string): void {
    const raw = rawWeek(root, week);
    raw.scripts[0].steps[0].materials.push(line);
    writeWeek(root, week, raw);
}

describe('the materials parser on hostile and edge input', () => {
    it('X-P8-1 extra spaces, a trailing comma, and an upper-case kind word parse without a crash', () => {
        const root = tempWeekRoot();
        try {
            appendMaterial(root, 1, '  sound picture cards  :  zebra ,  ');
            appendMaterial(root, 1, 'picture cards: quokka,');
            appendMaterial(root, 1, 'PICTURE CARDS: Quoll');
            const kit = storytimeCardKit(weeksFrom(root));
            const soundPicture = kit.cards
                .filter((entry) => entry.kind === 'sound-picture').map((entry) => entry.label);
            expect(soundPicture, 'the spaced line with a trailing comma').toContain('zebra');
            expect(soundPicture, 'no empty label from the trailing comma')
                .not.toContain('');
            const picture = kit.cards
                .filter((entry) => entry.kind === 'picture').map((entry) => entry.label);
            expect(picture, 'the trailing-comma line').toContain('quokka');
            expect(picture, 'the upper-case kind line').toContain('Quoll');
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('X-P8-2 a duplicate label inside one line and across weeks gives one card', () => {
        const root = tempWeekRoot();
        try {
            appendMaterial(root, 2, 'picture cards: nose, nose, cat');
            const kit = storytimeCardKit(weeksFrom(root));
            const picture = kit.cards
                .filter((entry) => entry.kind === 'picture').map((entry) => entry.label);
            const noseCount = picture.filter((label) => label.toLowerCase() === 'nose').length;
            expect(noseCount, 'one nose card despite the repeat').toBe(1);
            // The appended repeat keeps the first-seen order: nose stays before cat.
            expect(picture.indexOf('nose') < picture.indexOf('cat'), 'the order rule kept').toBe(true);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('X-P8-3 an empty item list, an unknown kind, small books, and crayons add no card', () => {
        const root = tempWeekRoot();
        try {
            appendMaterial(root, 1, 'picture cards:');
            appendMaterial(root, 1, 'picture cards:   ');
            appendMaterial(root, 1, 'magic cards: wand');
            appendMaterial(root, 1, 'small books (each child\'s own): "Zebra Book"');
            appendMaterial(root, 1, 'crayons');
            const kit = storytimeCardKit(weeksFrom(root));
            const labels = kit.cards.map((entry) => entry.label);
            expect(labels, 'no empty label').not.toContain('');
            expect(labels, 'no unknown-kind card').not.toContain('wand');
            expect(labels, 'no small-book card').not.toContain('Zebra Book');
            expect(kit.items.map((item) => item.label), 'no crayon item').not.toContain('crayons');
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('X-P8-4 a missing week file does not crash the kit', () => {
        const root = fs.mkdtempSync('/tmp/opencode/storytime-p8-adv-');
        try {
            const folder = path.join(root, 'l2');
            fs.mkdirSync(folder, { recursive: true });
            for (let week = 1; week <= 7; week++) {
                fs.copyFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), path.join(folder, `w0${week}.json`));
            }
            const kit = storytimeCardKit(weeksFrom(root, 7));
            expect(kit.cards.length, 'cards from the seven weeks').toBeGreaterThan(0);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

describe('the letter repeat rule', () => {
    it('X-P8-5 a class-set line with three n in another week gives three n cards', () => {
        const root = tempWeekRoot();
        try {
            appendMaterial(root, 4, 'letter cards (class set): n, n, n');
            const kit = storytimeCardKit(weeksFrom(root));
            const letters = kit.cards
                .filter((entry) => entry.kind === 'letter').map((entry) => entry.label);
            expect(letters, 'the count follows the highest count in one line')
                .toEqual(['n', 'n', 'n', 'a', 'p', 'm', 's', 't', 'o']);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

describe('the page plan on edge counts', () => {
    it('X-P8-6 zero cards give zero sheets, one card gives one sheet, a partial sheet rounds up', () => {
        const empty = storytimeCardPagePlan([], 'A5');
        expect(empty.cards, 'no cards').toBe(0);
        expect(empty.sheets, 'no sheets').toBe(0);
        const one = storytimeCardPagePlan([a5card('n')], 'A5');
        expect(one.cards, 'one card').toBe(1);
        expect(one.sheets, 'one sheet').toBe(1);
        const three = storytimeCardPagePlan([a5card('n'), a5card('a'), a5card('p')], 'A5');
        expect(three.cards, 'three A5 cards').toBe(3);
        expect(three.sheets, 'the last sheet is partial').toBe(2);
        const five = storytimeCardPagePlan(
            [card('a'), card('b'), card('c'), card('d'), card('e')], 'A6');
        expect(five.sheets, 'five A6 cards on sheets of four').toBe(2);
    });
});

describe('the picture match rule on fixtures', () => {
    it('X-P8-7 a case (b) row wins when the case (a) row is not delivered', () => {
        const check = pictureRow({ id: 'check-nose', use: 'check-row', week: 1, text: 'nose' });
        const page = pictureRow({
            id: 'page-nose', use: 'story-page', week: 1, text: 'A nose.', objectCounts: { nose: 1 },
        });
        const delivered = new Set([page.id]);
        expect(storytimeCardPictureRow(card('nose'), [check, page], delivered)?.id, 'the delivered page row')
            .toBe('page-nose');
    });

    it('X-P8-8 a story-page row with a zero count for a second key counts as one key', () => {
        const page = pictureRow({
            id: 'page-cat', use: 'story-page', week: 1, text: 'A cat.', objectCounts: { cat: 1, dog: 0 },
        });
        expect(storytimeCardPictureRow(card('cat'), [page], new Set([page.id]))?.id, 'one key above zero')
            .toBe('page-cat');
        const two = pictureRow({
            id: 'page-two', use: 'story-page', week: 1, text: 'A cat and a dog.', objectCounts: { cat: 1, dog: 1 },
        });
        expect(storytimeCardPictureRow(card('cat'), [two], new Set([two.id])), 'two keys above zero')
            .toBeUndefined();
    });

    it('X-P8-9 a plural outside the singular rule finds no row, while bus still matches', () => {
        const bus = pictureRow({
            id: 'page-bus', use: 'story-page', week: 1, text: 'A bus.', objectCounts: { bus: 1 },
        });
        const delivered = new Set([bus.id]);
        expect(storytimeCardPictureRow(card('buses'), [bus], delivered), 'buses is not bus').toBeUndefined();
        expect(storytimeCardPictureRow(card('bus'), [bus], delivered)?.id, 'bus matches bus').toBe('page-bus');
        const child = pictureRow({
            id: 'page-child', use: 'story-page', week: 1, text: 'A child.', objectCounts: { child: 1 },
        });
        expect(storytimeCardPictureRow(card('children'), [child], new Set([child.id])), 'children is not child')
            .toBeUndefined();
    });
});

describe('the match report hygiene (Review B, B-P8-6)', () => {
    it('X-P8-10 a multi-line reason keeps one line per card', () => {
        const check = pictureRow({ id: 'check-cat', use: 'check-row', text: 'cat' });
        const reason = 'Unexpected token \'x\', "obs": [\n  x\n ]\n}" is not valid JSON';
        const lines = storytimeCardPictureMatchLines(
            [card('cat')], [check], new Set(), new Map([[check.id, reason]]));
        expect(lines, 'one line for one card').toHaveLength(1);
        expect(lines[0], 'no raw newline in the line').not.toContain('\n');
    });

    it('X-P8-11 a file system reason names no absolute path outside the repo', () => {
        const check = pictureRow({ id: 'check-cat', use: 'check-row', text: 'cat' });
        const reason = `symlink ${path.join(os.tmpdir(), 'evil-manifest.json')} does not resolve`;
        const lines = storytimeCardPictureMatchLines(
            [card('cat')], [check], new Set(), new Map([[check.id, reason]]));
        expect(lines[0], 'no absolute temp path in the report').not.toContain(os.tmpdir());
    });
});

describe('the CLI wiring and the sticker title (Review B, B-P8-7)', () => {
    it('X-P8-12 an --out outside the print folder is an argument error', () => {
        const home = '/home/card-kit-adv-test';
        expect(() => parseStorytimeCardKitArgs(['--level', '2', '--weeks', '1', '--out', '/'], home),
            'the root folder').toThrow(/--out/);
        expect(() => parseStorytimeCardKitArgs(
            ['--level', '2', '--weeks', '1', '--out', '/tmp/opencode/card-kit'], home),
        'a temp folder').toThrow(/--out/);
        const inside = path.join(home, 'Desktop', 'print-ready', 'storytime', 'card-kit-v9');
        expect(parseStorytimeCardKitArgs(['--level', '2', '--weeks', '1', '--out', inside], home).outDir,
            'an inside folder').toBe(inside);
    });

    it('X-P8-13 a hostile sticker sheet title is escaped', () => {
        const sticker: StorytimeKitItem = { kind: 'sticker', label: 'unit 1', week: 1, classSet: false };
        const { html } = compileStorytimeStickerSheet([sticker], { title: HOSTILE });
        expect(html, 'the escaped title sits in the head').toContain(`<title>${ESCAPED}</title>`);
        expect(html, 'the raw tag is not in the document').not.toContain('<img src=x');
    });
});
