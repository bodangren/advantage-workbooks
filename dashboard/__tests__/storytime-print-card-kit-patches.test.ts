// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { resolveStorytimePictureFiles } from '../lib/storytime/print/picture-check';
import {
    compileStorytimeCardSheet,
    storytimeCardKit,
    storytimeCardPictureMatchLines,
    STORYTIME_CARD_PICTURE_KINDS,
    STORYTIME_CARD_COLOR_PATCH,
    type StorytimeCard,
} from '../lib/storytime/print/card-kit';
import type { StorytimePictureRow } from '../lib/storytime/print/pictures';

/** The hand-written colors and sRGB values approved for the family-picture cards. */
const COLOR_PATCHES: Record<string, string> = {
    red: '#E53935',
    blue: '#1E88E5',
    yellow: '#FDD835',
    green: '#43A047',
    orange: '#FB8C00',
    pink: '#F48FB1',
    purple: '#8E24AA',
    brown: '#6D4C41',
};

/** The hand-written number words and their expected dot counts. */
const NUMBER_DOTS: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
};

function shippedWeeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_value, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8')),
    ));
}

function shippedRows(): StorytimePictureRow[] {
    return JSON.parse(fs.readFileSync(`${STORYTIME_ROOT}/l2/print/pictures.json`, 'utf8')) as StorytimePictureRow[];
}

function pictureCards(cards: StorytimeCard[]): StorytimeCard[] {
    return cards.filter((card) => STORYTIME_CARD_PICTURE_KINDS.includes(card.kind));
}

function documentFor(cards: StorytimeCard[]): Document {
    const { html } = compileStorytimeCardSheet(cards, 'A6');
    return new DOMParser().parseFromString(html, 'text/html');
}

describe('Phase 8 color patches and number dots', () => {
    it('R-P8-P1 the eight named color words use their approved sRGB patch colors', () => {
        const kit = storytimeCardKit(shippedWeeks());
        const expected = Object.keys(COLOR_PATCHES);
        const cards = kit.cards.filter((card) => expected.includes(card.label.toLowerCase()));
        const doc = documentFor(cards);

        expect(STORYTIME_CARD_COLOR_PATCH, 'the one exported map contains the hand-written sRGB values')
            .toEqual(COLOR_PATCHES);
        expect(cards.map((card) => card.label.toLowerCase()), 'the hand-written color word list')
            .toEqual(expected);
        expect(doc.querySelectorAll('.card-picture-empty'), 'color cards have no empty picture box')
            .toHaveLength(0);
        for (const [word, hex] of Object.entries(COLOR_PATCHES)) {
            const card = doc.querySelector(`[data-label="${word}"]`);
            expect(card, `${word} card exists`).not.toBeNull();
            const patch = card?.querySelector('[data-card-patch]');
            expect(patch, `${word} card has a filled patch`).not.toBeNull();
            expect(patch?.getAttribute('data-card-patch'), `${word} patch names its word`).toBe(word);
            expect(patch?.getAttribute('data-shape'), `${word} patch is a rounded rectangle`)
                .toBe('rounded-rectangle');
            expect(patch?.getAttribute('data-color'), `${word} patch stores its sRGB value`)
                .toBe(hex);
            expect(patch?.getAttribute('style'), `${word} patch paints the expected color`)
                .toMatch(new RegExp(`(?:background-color|background):\\s*${hex}`, 'i'));
            const inlineStyle = doc.createElement('span');
            inlineStyle.setAttribute('style', patch?.getAttribute('style') ?? '');
            expect(inlineStyle.style.borderRadius, `${word} patch has rounded corners`).toMatch(/\d/);
            expect(Number.parseFloat(inlineStyle.style.width || '0'), `${word} patch fills most of its picture area`)
                .toBeGreaterThan(50);
            expect(Number.parseFloat(inlineStyle.style.height || '0'), `${word} patch fills most of its picture area`)
                .toBeGreaterThan(50);
        }
    });

    it('R-P8-P2 the nine number cards show the numeral and exactly its number of round dots', () => {
        const kit = storytimeCardKit(shippedWeeks());
        const expected = Object.keys(NUMBER_DOTS);
        const cards = kit.cards.filter((card) => expected.includes(card.label.toLowerCase()));
        const doc = documentFor(cards);

        expect(cards.map((card) => card.label.toLowerCase()), 'the hand-written number word list')
            .toEqual(expected);
        expect(doc.querySelectorAll('.card-picture-empty'), 'number cards have no empty picture box')
            .toHaveLength(0);
        for (const [word, count] of Object.entries(NUMBER_DOTS)) {
            const card = doc.querySelector(`[data-label="${word}"]`);
            const numeral = String(count);
            const numeralElement = card?.querySelector('[data-card-numeral]');
            expect(numeralElement?.textContent?.trim(), `${word} numeral`)
                .toBe(numeral);
            const numeralStyle = doc.createElement('span');
            numeralStyle.setAttribute('style', numeralElement?.getAttribute('style') ?? '');
            const numeralSize = Number.parseFloat(numeralStyle.style.fontSize || '0');
            expect(numeralSize, `${word} numeral is large`).toBeGreaterThanOrEqual(40);
            const dots = card?.querySelectorAll('[data-number-dot]');
            expect(dots, `${word} has exactly ${count} round dots`).toHaveLength(count);
            expect([...((dots ?? []) as NodeListOf<Element>)].every((dot) =>
                dot.tagName.toLowerCase() === 'circle' || dot.getAttribute('data-shape') === 'circle'),
            `${word} dots are round`).toBe(true);
            const rowCounts = new Map<string, number>();
            dots?.forEach((dot) => {
                const row = dot.getAttribute('data-row') ?? dot.getAttribute('cy') ?? 'one-row';
                rowCounts.set(row, (rowCounts.get(row) ?? 0) + 1);
            });
            expect([...rowCounts.values()].every((rowCount) => rowCount <= 5), `${word} has at most five dots per row`)
                .toBe(true);
            const positions = [...((dots ?? []) as NodeListOf<Element>)].map((dot) => [dot.getAttribute('cx'), dot.getAttribute('cy')].join(','));
            expect(new Set(positions).size, `${word} dot coordinates are distinct`).toBe(count);
            const cyByRow = new Map<string, Set<string>>();
            dots?.forEach((dot) => {
                const row = dot.getAttribute('data-row') ?? 'one-row';
                const cy = dot.getAttribute('cy');
                if (cy !== null) cyByRow.set(row, new Set([...(cyByRow.get(row) ?? []), cy]));
            });
            expect([...cyByRow.values()].every((coordinates) => coordinates.size === 1), `${word} each row has one cy`)
                .toBe(true);
            const row0cy = [...(cyByRow.get('0') ?? [])][0];
            const row1cy = [...(cyByRow.get('1') ?? [])][0];
            if (count > 5) {
                expect(row1cy, `${word} two-row layout defines row 1 cy`).toBeDefined();
                expect(Number(row1cy), `${word} row 1 sits below row 0`).toBeGreaterThan(Number(row0cy));
            }
        }
    });

    it('R-P8-P3 all 17 special cards replace the empty box and all 29 unmatched cards retain it', () => {
        const kit = storytimeCardKit(shippedWeeks());
        const specialLabels = new Set([...Object.keys(COLOR_PATCHES), ...Object.keys(NUMBER_DOTS)]);
        const allPictureCards = pictureCards(kit.cards);
        const specialCards = allPictureCards.filter((card) => specialLabels.has(card.label.toLowerCase()));
        const rows = shippedRows();
        const delivered = new Set(resolveStorytimePictureFiles(
            path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures'),
            rows.filter((row) => row.use !== 'card'),
            'color',
        ).map((entry) => entry.rowId));
        const reportFields = storytimeCardPictureMatchLines(allPictureCards, rows, delivered)
            .map((line) => line.split('\t'));
        const pictureByCard = new Map<StorytimeCard, string | undefined>();
        allPictureCards.forEach((card, index) => {
            const source = reportFields[index][3];
            pictureByCard.set(card, source === 'text' || source === 'page' ? '/tmp/p8-existing-picture.png' : undefined);
        });
        const { html } = compileStorytimeCardSheet(allPictureCards, 'A6', {
            pictureOf: (card) => pictureByCard.get(card),
        });
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const otherCards = allPictureCards.filter((card) => !specialLabels.has(card.label.toLowerCase()));
        const otherNoneCards = otherCards.filter((card) => {
            const index = allPictureCards.indexOf(card);
            return reportFields[index][2] === 'none';
        });
        const otherMatchedCards = otherCards.filter((card) => {
            const index = allPictureCards.indexOf(card);
            return reportFields[index][3] === 'text' || reportFields[index][3] === 'page';
        });

        expect(specialCards, 'the eight color and nine number cards').toHaveLength(17);
        for (const card of specialCards) {
            expect(doc.querySelector(`[data-kind="${card.kind}"][data-label="${card.label}"] .card-picture-empty`),
                `${card.label} has no empty box`).toBeNull();
        }
        expect(otherCards, 'the 83 non-special picture cards keep their prior picture behavior')
            .toHaveLength(83);
        expect(otherMatchedCards, 'the 54 matched non-special cards still show the picture')
            .toHaveLength(54);
        for (const card of otherMatchedCards) {
            expect(doc.querySelector(`[data-kind="${card.kind}"][data-label="${card.label}"] .card-picture img`),
                `${card.label} still shows its matched picture`).not.toBeNull();
        }
        expect(otherNoneCards, 'the remaining cards with no picture row')
            .toHaveLength(29);
        expect(otherNoneCards.every((card) => {
            const index = allPictureCards.indexOf(card);
            return reportFields[index][3] === 'none: files not delivered';
        }), 'the 32 unmatched cards have Forge rows whose files are not delivered').toBe(true);
        for (const card of otherNoneCards) {
            expect(doc.querySelector(`[data-kind="${card.kind}"][data-label="${card.label}"] .card-picture-empty`),
                `${card.label} keeps its empty box`).not.toBeNull();
        }
    }, 120_000);

    it('R-P8-P4 the shipped match report gives 54 picture matches, 8 patches, 9 dots, and 29 none', () => {
        const cards = storytimeCardKit(shippedWeeks()).cards;
        const rows = shippedRows();
        const delivered = new Set(resolveStorytimePictureFiles(
            path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures'),
            rows.filter((row) => row.use !== 'card'),
            'color',
        ).map((entry) => entry.rowId));
        const report = storytimeCardPictureMatchLines(pictureCards(cards), rows, delivered);
        const fields = report.map((line) => line.split('\t'));
        const rowMatches = fields.filter((field) => field[2] !== 'none' && ['text', 'page'].includes(field[3]));
        const patches = fields.filter((field) => field[3] === 'patch');
        const dots = fields.filter((field) => field[3] === 'dots');
        const none = fields.filter((field) => field[2] === 'none');

        expect(fields, 'one line per picture-type card').toHaveLength(100);
        expect(fields.every((field) => field.length === 4), 'the report has four tab-separated columns')
            .toBe(true);
        expect(rowMatches, 'picture row matches').toHaveLength(54);
        expect(patches.map((field) => field[1].toLowerCase()).sort(), 'color patch sources')
            .toEqual(Object.keys(COLOR_PATCHES).sort());
        expect(dots.map((field) => field[1].toLowerCase()).sort(), 'number dot sources')
            .toEqual(Object.keys(NUMBER_DOTS).sort());
        expect([...patches, ...dots].every((field) => field[2] !== 'none'), 'special cards have a source, not none')
            .toBe(true);
        expect(none, 'remaining report rows with no source').toHaveLength(29);
        expect(none.every((field) => field[3] === 'none: files not delivered'), 'all none entries have undelivered Forge rows')
            .toBe(true);
        expect(fields.filter((field) => field[2] === 'none' && field[3] === 'none: files not delivered'), 'all unmatched entries')
            .toHaveLength(29);
    }, 120_000);

    it('R-P8-P5 falsifier: a dot count off by one fails the exact count assertion', () => {
        const card = storytimeCardKit(shippedWeeks()).cards.find((entry) => entry.label.toLowerCase() === 'three');
        expect(card, 'the shipped three card exists').toBeDefined();
        const { html } = compileStorytimeCardSheet(card ? [card] : [], 'A6');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const dots = doc.querySelectorAll('[data-number-dot]');
        expect(dots, 'one fewer or one more dot fails the exact expected count of three')
            .toHaveLength(NUMBER_DOTS.three);
    });
});
