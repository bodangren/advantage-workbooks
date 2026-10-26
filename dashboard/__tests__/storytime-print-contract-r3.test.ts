// @vitest-environment node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import type { StorytimePictureRow } from '../lib/storytime/print/pictures';

/** Red 3 tests use shipped weeks and temporary copies. They change no production file. */
const weekNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
const picturesModule = fileURLToPath(new URL('../lib/storytime/print/pictures.ts', import.meta.url));
const dashboardRoot = fileURLToPath(new URL('../', import.meta.url));
const printDir = path.join(STORYTIME_ROOT, 'l2', 'print');
const temporaryFolders: string[] = [];
const APP_PARTS = ['text', 'thai', 'images', 'audio', 'song', 'scripts'] as const;

function shipped(week: number): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), 'utf8')));
}

function shippedWeeks(): StorytimeWeek[] {
    return weekNumbers.map(shipped);
}

function copyWeek(week: StorytimeWeek, change: (copy: StorytimeWeek) => void): { week: StorytimeWeek; file: string } {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const folder = fs.mkdtempSync('/tmp/opencode/storytime-print-contract-r3-');
    temporaryFolders.push(folder);
    const file = path.join(folder, 'week.json');
    fs.writeFileSync(file, JSON.stringify(week));
    const copy = JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimeWeek;
    change(copy);
    fs.writeFileSync(file, JSON.stringify(copy));
    return { week: JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimeWeek, file };
}

async function pictures(weeks: StorytimeWeek[]): Promise<StorytimePictureRow[]> {
    const exports = await import(picturesModule);
    return exports.storytimePrintPictures(weeks);
}

async function pageCounts(week: number, text: string): Promise<Record<string, number>[]> {
    const rows = await pictures([shipped(week)]);
    return rows.filter((row) => row.use === 'story-page' && row.text === text).map((row) => row.objectCounts);
}

function repeatPages(count: number): { week: StorytimeWeek; file: string } {
    return copyWeek(shipped(1), (copy) => {
        const book = copy.books[0];
        book.pages = Array.from({ length: count }, () => structuredClone(book.pages[0]));
        copy.books = [book];
    });
}

afterEach(() => {
    for (const folder of temporaryFolders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
});

describe('Storytime print Red 3: exact counts (R15, R16)', () => {
    it.each([
        ['How many suns? One!', { sun: 1 }],
        ['How many kites? Two!', { kite: 2 }],
        ['How many ducks? Three!', { duck: 3 }],
        ['How many birds? Four!', { bird: 4 }],
        ['How many balls? Five!', { ball: 5 }],
        ['How many friends? Six!', { friend: 6 }],
        ['How many cakes? Seven!', { cake: 7 }],
    ] as const)('R15: counts the shipped week 2 answer in "%s"', async (text, expected) => {
        expect(await pageCounts(2, text)).toEqual([expected]);
    });

    it('R15: gives no cake count for "Oh no, Pip!" because the text gives no number (FR-2.2)', async () => {
        expect(await pageCounts(2, 'How many cakes? Oh no, Pip!')).toEqual([{}]);
    });

    it.each(['ball', 'doll', 'car', 'kite', 'drum', 'train', 'teddy'])(
        'R16: gives no %s count for the shipped negated question',
        async (noun) => {
            expect(await pageCounts(7, `Is it a ${noun}? No!`)).toEqual([{}]);
        },
    );

    it('R16: counts the pan but excludes the non-object noun in "A nap in the pan!"', async () => {
        expect(await pageCounts(3, 'A nap in the pan!')).toEqual([{ pan: 1 }]);
    });

    it('R16: gives the singular key foot for "I have two feet."', async () => {
        expect(await pageCounts(5, 'I have two feet.')).toEqual([{ foot: 2 }]);
    });

    it('R16: uses only the exact singular key inventory across the shipped list', async () => {
        const rows = await pictures(shippedWeeks());
        const keys = [...new Set(rows.flatMap((row) => Object.keys(row.objectCounts)))].sort();
        // Foot replaces feet. Bus, fish, octopus, mouse, and ox retain their singular forms.
        expect(keys).toEqual([
            'alligator', 'ant', 'apple', 'arm', 'bag', 'ball', 'bed', 'bird', 'bus', 'cake', 'car', 'cat',
            'cup', 'dog', 'doll', 'drum', 'duck', 'ear', 'eye', 'fish', 'foot', 'friend', 'frog', 'hand',
            'hat', 'horse', 'kite', 'leg', 'man', 'map', 'mat', 'milk', 'monkey', 'mouse', 'neck', 'nest',
            'net', 'nose', 'nurse', 'nut', 'octopus', 'olive', 'ox', 'pan', 'pear', 'pen', 'pencil', 'pig',
            'pot', 'sock', 'sofa', 'sun', 'table', 'teddy', 'ten', 'tiger', 'top', 'train',
        ]);
    });
});

describe('Storytime print Red 3: strict approvals (R18, R19)', () => {
    it.each(APP_PARTS)('R18: rejects the unknown key wrods on the %s app approval part', (part) => {
        const { week } = copyWeek(shipped(1), (copy) => {
            Object.assign(copy.approval[part], { wrods: 'Synthetic test value; not an owner decision.' });
        });
        const result = StorytimeWeekSchema.safeParse(week);
        expect(result.success).toEqual(false);
        if (!result.success) {
            expect(result.error.issues.map(({ code, path }) => ({ code, path }))).toEqual([
                { code: 'unrecognized_keys', path: ['approval', part] },
            ]);
        }
    });

    it('R19: rejects the unknown key wrods on a draft print approval part', () => {
        const { week } = copyWeek(shipped(1), (copy) => {
            copy.approval.print = { status: 'draft' };
            Object.assign(copy.approval.print, { wrods: 'Synthetic test value; not an owner decision.' });
        });
        const result = StorytimeWeekSchema.safeParse(week);
        expect(result.success).toEqual(false);
        if (!result.success) {
            expect(result.error.issues.map(({ code, path }) => ({ code, path }))).toEqual([
                { code: 'unrecognized_keys', path: ['approval', 'print'] },
            ]);
        }
    });
});

describe('Storytime print Red 3: bounded suffixes (R20)', () => {
    it.each([
        [2, 'Nan can.', 'l2-w02-story-page-nan-can-b'],
        [2, 'Can I?', 'l2-w02-story-page-can-i-b'],
        [2, 'I can!', 'l2-w02-story-page-i-can-b'],
        [6, 'Tap, tap, tap!', 'l2-w06-story-page-tap-tap-tap-b'],
    ] as const)('R20: uses -b for the second week %i page "%s"', async (week, text, secondId) => {
        const rows = (await pictures([shipped(week)])).filter((row) => row.use === 'story-page' && row.text === text);
        expect(rows.map((row) => row.id)).toEqual([secondId.slice(0, -2), secondId]);
    });

    it('R20: keeps all 30 week 1 ids equal to the committed v2 ids', async () => {
        const committed = JSON.parse(fs.readFileSync(path.join(printDir, 'pictures.json'), 'utf8')) as StorytimePictureRow[];
        const expected = [
            'l2-w01-story-page-hello-i-am-pat', 'l2-w01-story-page-hello-i-am-may',
            'l2-w01-story-page-hello-i-am-sam', 'l2-w01-story-page-hello-i-am-mia',
            'l2-w01-story-page-hello-i-am-nan', 'l2-w01-story-page-hello-i-am-ben',
            'l2-w01-story-page-hello-i-am-your-teacher', 'l2-w01-story-page-hello-i-am-pip',
            'l2-w01-cover-hello', 'l2-w01-story-page-a-nest', 'l2-w01-story-page-a-net',
            'l2-w01-story-page-a-nut', 'l2-w01-story-page-a-nose', 'l2-w01-story-page-a-neck',
            'l2-w01-story-page-a-nurse', 'l2-w01-story-page-a-nest-and-a-nut',
            'l2-w01-story-page-nan-can-nod', 'l2-w01-cover-nan-can-nod',
            'l2-w01-check-row-nest', 'l2-w01-check-row-cat', 'l2-w01-check-row-fish',
            'l2-w01-check-row-dog', 'l2-w01-check-row-nose', 'l2-w01-check-row-bus',
            'l2-w01-check-row-hat', 'l2-w01-check-row-cup', 'l2-w01-check-row-net',
            'l2-w01-practice-line-nose', 'l2-w01-practice-line-nest', 'l2-w01-practice-line-nut',
        ];
        expect(committed.filter((row) => row.week === 1).map((row) => row.id)).toEqual(expected);
        expect((await pictures([shipped(1)])).map((row) => row.id)).toEqual(expected);
    });

    it('R20: assigns base then -b through -z to the first 26 occurrences', async () => {
        const { week } = repeatPages(26);
        const ids = (await pictures([week])).filter((row) => row.use === 'story-page').map((row) => row.id);
        const base = 'l2-w01-story-page-hello-i-am-pat';
        expect(ids).toEqual([base, ...'bcdefghijklmnopqrstuvwxyz'.split('').map((suffix) => `${base}-${suffix}`)]);
    });

    it('R20: throws on the 27th occurrence instead of cycling suffixes', () => {
        const { file } = repeatPages(27);
        // Isolate synchronous loops. A five-second timeout fails this assertion without blocking Vitest.
        const script = `
            import fs from 'node:fs';
            import { storytimePrintPictures } from ${JSON.stringify(picturesModule)};
            const week = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
            let result = { threw: false, name: null };
            try { storytimePrintPictures([week]); }
            catch (error) { result = { threw: true, name: error.name }; }
            console.log(JSON.stringify(result));
        `;
        const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script, file], {
            cwd: dashboardRoot,
            encoding: 'utf8',
            timeout: 5000,
        });
        expect(JSON.parse(output)).toEqual({ threw: true, name: 'Error' });
    }, 10000);
});

describe('Storytime print Red 3: list version 3 (R21)', () => {
    it('R21: exports one list version constant with the value 3', async () => {
        const exports = await import(picturesModule);
        expect(exports.STORYTIME_PICTURE_LIST_VERSION).toEqual(3);
    });

    it.each([2, 3])('R21: uses level %i as the level and the exported constant as Version 3', async (level) => {
        const exports = await import(picturesModule);
        const rows = await pictures(shippedWeeks());
        const header = exports.pictureListMarkdown(rows, level).split('\n').slice(0, 3);
        expect(header).toEqual([
            `# Storytime Advantage — print picture list (Level ${level})`,
            '',
            'Version 3 (FR-2, FR-9). `pictures.json` is the machine list; this page is the readable copy.',
        ]);
        expect(header[2]).toEqual(
            `Version ${exports.STORYTIME_PICTURE_LIST_VERSION} (FR-2, FR-9). \`pictures.json\` is the machine list; this page is the readable copy.`,
        );
    });

    it('R21: commits the Version 3 header in pictures.md', () => {
        expect(fs.readFileSync(path.join(printDir, 'pictures.md'), 'utf8').split('\n').slice(0, 3)).toEqual([
            '# Storytime Advantage — print picture list (Level 2)',
            '',
            'Version 3 (FR-2, FR-9). `pictures.json` is the machine list; this page is the readable copy.',
        ]);
    });

    it('R21: keeps pictures.json as a top-level array without a version field', () => {
        const committed = JSON.parse(fs.readFileSync(path.join(printDir, 'pictures.json'), 'utf8'));
        expect(Array.isArray(committed)).toEqual(true);
        expect(committed.length).toEqual(192);
        expect(Object.hasOwn(committed, 'version')).toEqual(false);
    });
});
