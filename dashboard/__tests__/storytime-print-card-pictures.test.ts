// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PICTURE_LIST_VERSION, storytimePrintPictures } from '../lib/storytime/print/pictures';

/**
 * Phase 8 card picture rows (Red, owner approval 2026-11-06, "Go"): the 31 card words of the card
 * kit that have no picture yet become 31 rows of the Level 2 picture list. The list version goes
 * from 6 to 7. The 196 book rows stay byte for byte and in order; the 31 card rows follow them.
 *
 * The contract of this file:
 *
 * 1. The list version is 7. The committed `pictures.json` holds the 196 book rows and then the 31
 *    card rows, and the committed `pictures.md` says "Version 7".
 * 2. The content file `content/storytime/l2/print/card-pictures.json` holds one entry per card
 *    word, in card kit order: the word, the first week whose materials name that card, and the
 *    Forge prompt. The list builder appends one row per entry.
 * 3. Every prompt holds the sentence "One clear picture, the main thing large in the middle, a
 *    plain light background." and ends with "No letters, words, or numbers anywhere."
 * 4. The prompts of the cast cards name the known people.
 * 5. No card row names one of the 8 color words or one of the 9 number words one to nine.
 * 6. The card kit matches a delivered card row before the case (a) row and before the case (b)
 *    story page. No card file is delivered yet, so the shipped counts stay 106 cards, 57 matched,
 *    49 with no match, and 94 words, 46 matched, 48 with no match.
 *
 * The words, their weeks, and their row ids below are written by hand from the `materials` lines of
 * the 8 shipped week files. No code copies the builder to make them.
 */

const dashboardRoot = fileURLToPath(new URL('../', import.meta.url));
const repoRoot = path.resolve(dashboardRoot, '..');
const filesModule = path.join(dashboardRoot, 'lib', 'storytime', 'files.ts');
const picturesModule = path.join(dashboardRoot, 'lib', 'storytime', 'print', 'pictures.ts');
const cardKitModule = path.join(dashboardRoot, 'lib', 'storytime', 'print', 'card-kit.ts');
const printDir = path.join(STORYTIME_ROOT, 'l2', 'print');
const cardFile = path.join(printDir, 'card-pictures.json');

/** The baseline commit of this phase: its committed list holds the 196 book rows. */
const BASELINE_SHA = '709dd19ce412597f5c92cdc3edb5272878a8ec65';

/** The style sentence of the approved first-sound book pages, for example `l2-w01-story-page-a-nut`. */
const STYLE_SENTENCE = 'One clear picture, the main thing large in the middle, a plain light background.';

/** The last sentence of every card prompt. */
const NO_LETTERS_SENTENCE = 'No letters, words, or numbers anywhere.';

/**
 * The 31 card words, the first week whose `materials` name that card, and the row id of that card
 * row. The order is the card kit order: the picture cards, then the sound picture cards, then the
 * family picture cards. The card kit lists the kinds in that order, and inside a kind the order of
 * the week that first names the card.
 */
const EXPECTED_CARD_ROWS: { word: string; week: number; id: string }[] = [
    { word: 'fan', week: 2, id: 'l2-w02-card-fan' },
    { word: 'sheep', week: 3, id: 'l2-w03-card-sheep' },
    { word: 'cap', week: 3, id: 'l2-w03-card-cap' },
    { word: 'jam', week: 4, id: 'l2-w04-card-jam' },
    { word: 'ham', week: 4, id: 'l2-w04-card-ham' },
    { word: 'dress', week: 5, id: 'l2-w05-card-dress' },
    { word: 'sad', week: 5, id: 'l2-w05-card-sad' },
    { word: 'boat', week: 6, id: 'l2-w06-card-boat' },
    { word: 'pot', week: 7, id: 'l2-w07-card-pot' },
    { word: 'mop', week: 7, id: 'l2-w07-card-mop' },
    { word: 'astronaut', week: 2, id: 'l2-w02-card-astronaut' },
    { word: 'pineapple', week: 3, id: 'l2-w03-card-pineapple' },
    { word: 'sandwich', week: 5, id: 'l2-w05-card-sandwich' },
    { word: 'tomato', week: 6, id: 'l2-w06-card-tomato' },
    { word: 'otter', week: 7, id: 'l2-w07-card-otter' },
    { word: 'hello', week: 1, id: 'l2-w01-card-hello' },
    { word: 'goodbye', week: 1, id: 'l2-w01-card-goodbye' },
    { word: 'boy', week: 1, id: 'l2-w01-card-boy' },
    { word: 'girl', week: 1, id: 'l2-w01-card-girl' },
    { word: 'teacher', week: 1, id: 'l2-w01-card-teacher' },
    { word: 'mom', week: 4, id: 'l2-w04-card-mom' },
    { word: 'dad', week: 4, id: 'l2-w04-card-dad' },
    { word: 'brother', week: 4, id: 'l2-w04-card-brother' },
    { word: 'sister', week: 4, id: 'l2-w04-card-sister' },
    { word: 'grandma', week: 4, id: 'l2-w04-card-grandma' },
    { word: 'grandpa', week: 4, id: 'l2-w04-card-grandpa' },
    { word: 'family', week: 4, id: 'l2-w04-card-family' },
    { word: 'doll', week: 7, id: 'l2-w07-card-doll' },
    { word: 'car', week: 7, id: 'l2-w07-card-car' },
    { word: 'train', week: 7, id: 'l2-w07-card-train' },
    { word: 'teddy', week: 7, id: 'l2-w07-card-teddy' },
];

/** The 8 color words. They print as a color patch, so they get no card row. */
const COLOR_WORDS = ['red', 'blue', 'yellow', 'green', 'orange', 'pink', 'purple', 'brown'];

/** The 9 number words one to nine. They print as the number with dots, so they get no card row. */
const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** The people of the known cast, and the names their card prompt holds. */
const CAST_PROMPTS: Record<string, string[]> = {
    mom: ['Mom'],
    dad: ['Dad'],
    grandma: ['Grandma'],
    grandpa: ['Grandpa'],
    sister: ['Lily (drawn young, about five years old)'],
    brother: ['Tom (drawn young, about eight years old)'],
    teacher: ['Teacher Kim'],
    family: ['Mom', 'Dad', 'Grandma', 'Grandpa', 'Tom (drawn young, about eight years old)', 'Lily (drawn young, about five years old)'],
};

/** The parsed weeks of the shipped Level 2 folder, in week order. */
function weeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_value, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8')),
    ));
}

/**
 * The card entries of the shipped Level 2 card file, in file order.
 * @returns The entries of `content/storytime/l2/print/card-pictures.json`.
 */
async function cardEntries(): Promise<{ word: string; week: number; prompt: string }[]> {
    const files = await import(filesModule);
    expect(files.readLevelCardPictures, 'Export readLevelCardPictures from lib/storytime/files.ts.').toBeTypeOf('function');
    return files.readLevelCardPictures(STORYTIME_ROOT, 2);
}

/**
 * The picture list of the shipped Level 2 weeks: the 196 book rows and then the 31 card rows.
 * @returns The rows of the generated list.
 */
async function pictureList(): Promise<any[]> {
    const pictures = await import(picturesModule);
    expect(pictures.storytimeCardPictureRows, 'Export storytimeCardPictureRows from lib/storytime/print/pictures.ts.').toBeTypeOf('function');
    const entries = await cardEntries();
    return [...storytimePrintPictures(weeks()), ...pictures.storytimeCardPictureRows(entries, 2)];
}

/**
 * One picture-list row, with the fields that the card rows hold.
 * @param row The fields of the row.
 * @returns The row.
 */
function pictureRow(row: { id: string; week: number; use: string; text: string; objectCounts?: Record<string, number> }): any {
    return {
        id: row.id,
        week: row.week,
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

describe('Phase 8 card picture rows: the card file and the picture list', () => {
    it('CP-1: the picture list version is 7', () => {
        expect(STORYTIME_PICTURE_LIST_VERSION).toBe(7);
    });

    it('CP-2: the card file holds the 31 words with their weeks, in card kit order', async () => {
        expect(fs.existsSync(cardFile), `the card file is missing: ${cardFile}`).toBe(true);
        const entries = await cardEntries();
        expect(entries.map((entry) => [entry.word, entry.week])).toEqual(
            EXPECTED_CARD_ROWS.map((entry) => [entry.word, entry.week]),
        );
    });

    it('CP-3: the card file is tracked, not ignored', () => {
        const check = spawnSync('git', ['check-ignore', '-q', '--', 'content/storytime/l2/print/card-pictures.json'], { cwd: repoRoot, encoding: 'utf8' });
        expect(check.status, 'the card file stays tracked, not ignored').toBe(1);
    });

    it('CP-4: every card prompt holds the style sentence and ends with the no-letters sentence', async () => {
        const entries = await cardEntries();
        expect(entries).toHaveLength(31);
        for (const entry of entries) {
            expect(entry.prompt, `the prompt of ${entry.word} holds the style sentence`).toContain(STYLE_SENTENCE);
            expect(entry.prompt.trimEnd().endsWith(NO_LETTERS_SENTENCE), `the prompt of ${entry.word} ends with the no-letters sentence`).toBe(true);
        }
    });

    it('CP-5: the prompts of the cast cards name the known people', async () => {
        const entries = await cardEntries();
        for (const [word, names] of Object.entries(CAST_PROMPTS)) {
            const prompt = entries.find((entry) => entry.word === word)?.prompt ?? '';
            expect(prompt, `the card file holds the prompt of ${word}`).not.toBe('');
            for (const name of names) expect(prompt, `the prompt of ${word} names ${name}`).toContain(name);
        }
    });

    it('CP-6: no card row names a color word or a number word', async () => {
        const rows = (await pictureList()).filter((row: any) => row.use === 'card');
        const texts = rows.map((row: any) => row.text);
        expect(texts).toHaveLength(31);
        for (const word of [...COLOR_WORDS, ...NUMBER_WORDS]) {
            expect(texts, `the card rows hold no ${word} row`).not.toContain(word);
        }
        expect([...texts].sort()).toEqual(EXPECTED_CARD_ROWS.map((entry) => entry.word).sort());
    });

    it('CP-7: each card row carries the fields of a card picture row', async () => {
        const rows = (await pictureList()).filter((row: any) => row.use === 'card');
        const entries = await cardEntries();
        expect(rows).toHaveLength(31);
        for (const [index, expected] of EXPECTED_CARD_ROWS.entries()) {
            const row = rows[index];
            const entry = entries[index];
            expect(row.id, `the id of ${expected.word}`).toBe(expected.id);
            expect(row.week, `the week of ${expected.word}`).toBe(expected.week);
            expect(row.use, `the use of ${expected.word}`).toBe('card');
            expect(row.text, `the text of ${expected.word}`).toBe(expected.word);
            expect(row.prompt, `the prompt of ${expected.word}`).toBe(entry.prompt);
            expect(row.caption, `the caption of ${expected.word}`).toBe('');
            expect(row.objectCounts, `the object counts of ${expected.word}`).toEqual({ [expected.word]: 1 });
            expect(row.sizeClass, `the size class of ${expected.word}`).toBe('C');
            expect([row.width, row.height], `the pixel size of ${expected.word}`).toEqual([1500, 1500]);
            expect(row.fileName, `the color file name of ${expected.word}`).toBe(`${expected.id}-v1.png`);
            expect(row.lineArtFileName, `the line-art file name of ${expected.word}`).toBe(`${expected.id}-line-v1.png`);
        }
    });

    it('CP-8: the committed list is the 196 book rows and then the 31 card rows', async () => {
        const list = await pictureList();
        const committed = JSON.parse(fs.readFileSync(path.join(printDir, 'pictures.json'), 'utf8'));
        expect(committed).toHaveLength(227);
        expect(committed).toEqual(list);
        const baseline = JSON.parse(execFileSync('git', ['show', `${BASELINE_SHA}:content/storytime/l2/print/pictures.json`], {
            cwd: repoRoot,
            encoding: 'utf8',
        }));
        expect(baseline).toHaveLength(196);
        expect(JSON.stringify(committed.slice(0, 196)), 'the 196 book rows stay byte for byte and in order').toBe(JSON.stringify(baseline));
    });

    it('CP-9: the committed pictures.md says Version 7 and holds the card rows', async () => {
        const md = fs.readFileSync(path.join(printDir, 'pictures.md'), 'utf8');
        expect(md.split('\n').slice(0, 3).join('\n'), 'the readable list says Version 7').toContain('Version 7 (FR-2, FR-9).');
        for (const row of (await pictureList()).filter((row: any) => row.use === 'card')) {
            expect(md, `the readable list holds ${row.fileName}`).toContain(row.fileName);
        }
    });

    it('CP-10: a card file without a week and a prompt is a data error', async () => {
        const files = await import(filesModule);
        expect(files.readLevelCardPictures, 'Export readLevelCardPictures from lib/storytime/files.ts.').toBeTypeOf('function');
        const root = '/tmp/opencode/storytime-card-pictures-test';
        fs.rmSync(root, { recursive: true, force: true });
        fs.mkdirSync(path.join(root, 'l2', 'print'), { recursive: true });
        try {
            fs.writeFileSync(path.join(root, 'l2', 'print', 'card-pictures.json'), JSON.stringify([{ word: 'fan' }]));
            expect(() => files.readLevelCardPictures(root, 2), 'a card file without a week and a prompt is rejected').toThrow();
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

describe('Phase 8 card picture rows: the card kit match', () => {
    it('rejects duplicate card words across weeks without case sensitivity', async () => {
        const pictures = await import(picturesModule);
        const build = pictures.storytimeCardPictureRows as (entries: { word: string; week: number; prompt: string }[], level: number) => unknown;
        expect(() => build([
            { word: 'fan', week: 2, prompt: 'one fan' },
            { word: 'fan', week: 2, prompt: 'another fan' },
        ], 2), 'duplicate entries in one week name the word').toThrow(/fan/i);
        expect(() => build([
            { word: 'Fan', week: 2, prompt: 'one fan' },
            { word: 'fan', week: 3, prompt: 'another fan' },
        ], 2), 'case variants in different weeks name the word').toThrow(/fan/i);
    });

    it('CP-11: a delivered card row wins over the case (a) row and over the case (b) story page', async () => {
        const cardKit = await import(cardKitModule);
        expect(cardKit.storytimeCardPictureRow, 'Export storytimeCardPictureRow from lib/storytime/print/card-kit.ts.').toBeTypeOf('function');
        const cardRow = pictureRow({ id: 'l2-w02-card-fan', week: 2, use: 'card', text: 'fan' });
        const checkRow = pictureRow({ id: 'l2-w02-check-row-fan', week: 2, use: 'check-row', text: 'fan' });
        const pageRow = pictureRow({ id: 'l2-w02-story-page-a-fan', week: 2, use: 'story-page', text: 'A fan.', objectCounts: { fan: 1 } });
        const card = { kind: 'picture', label: 'fan', size: 'A6', classSet: false };
        const delivered = new Set([cardRow.id, checkRow.id, pageRow.id]);
        expect(cardKit.storytimeCardPictureRow(card, [cardRow, checkRow, pageRow], delivered)?.id, 'the card row wins').toBe('l2-w02-card-fan');
        expect(cardKit.storytimeCardPictureRow(card, [checkRow, pageRow], delivered)?.id, 'without the card row the case (a) row wins').toBe('l2-w02-check-row-fan');
        expect(cardKit.storytimeCardPictureRow(card, [pageRow], new Set([pageRow.id]))?.id, 'without the card row and the case (a) row the case (b) page wins').toBe('l2-w02-story-page-a-fan');
        const lines = cardKit.storytimeCardPictureMatchLines([card], [cardRow, checkRow, pageRow], delivered);
        expect(lines, 'the match report names the card row and the text case').toEqual(['picture\tfan\tl2-w02-card-fan\ttext']);
    });

    it('CP-11 strengthening: the delivered check row wins over an undelivered card row', async () => {
        const cardKit = await import(cardKitModule);
        const cardRow = pictureRow({ id: 'l2-w02-card-fan', week: 2, use: 'card', text: 'fan' });
        const checkRow = pictureRow({ id: 'l2-w02-check-row-fan', week: 2, use: 'check-row', text: 'fan' });
        const card = { kind: 'picture', label: 'fan', size: 'A6', classSet: false };
        const line = cardKit.storytimeCardPictureMatchLines([card], [cardRow, checkRow], new Set([checkRow.id]));
        expect(line, 'the report chooses the delivered check row').toEqual([
            'picture\tfan\tl2-w02-check-row-fan\ttext',
        ]);
    });
});
