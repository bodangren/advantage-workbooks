// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { checkStorytimeWeek } from '../lib/storytime/checks';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { pictureObjectCounts, storytimePrintPictures } from '../lib/storytime/print/pictures';
import { checkStorytimePrintText } from '../lib/storytime/print/text-check';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import type { PackageCheck } from '../lib/lesson-package/checks';

/**
 * Phase 1 adversarial guards (test strategy 4.8) on the reviewed HEAD. Every guard passes on the
 * reviewed implementation: the probes attack the print contract and assert that the attack fails
 * closed. Bad inputs live on temporary copies in `/tmp/opencode` (rule 11.1); no shipped file
 * changes. The accepted limits NR1 to NR3 (the plural non-object check, a number word as a key,
 * and the count rule across a sentence end) and the N7 text-check gaps are tech-debt rows, so no
 * guard here pins them.
 */
const dashboardRoot = fileURLToPath(new URL('../', import.meta.url));
const pictureScript = path.join(dashboardRoot, 'scripts', 'storytime', 'print-pictures.ts');
const temporaryFolders: string[] = [];
const checkById = (checks: PackageCheck[], id: string) => checks.find((check) => check.id === id);

function shipped(week: number): StorytimeWeek {
    return JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), 'utf8')) as StorytimeWeek;
}

function parsed(week: unknown): StorytimeWeek {
    return StorytimeWeekSchema.parse(week);
}

// Persist each changed copy in its own folder. Never write to STORYTIME_ROOT.
function copyWeek(week: number, change: (copy: StorytimeWeek) => void): StorytimeWeek {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const folder = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-print-adversarial-'));
    temporaryFolders.push(folder);
    const file = path.join(folder, 'week.json');
    fs.writeFileSync(file, JSON.stringify(shipped(week)));
    const copy = JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimeWeek;
    change(copy);
    fs.writeFileSync(file, JSON.stringify(copy));
    return JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimeWeek;
}

function printCheck(week: unknown, id: string): PackageCheck | undefined {
    return checkById(checkStorytimePrintText(parsed(week)), id);
}

afterEach(() => {
    for (const folder of temporaryFolders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
});

describe('Adversarial: the text check normalization never masks a word change', () => {
    it.each(['Nest', 'NEST', 'nEsT'])('fails print-picture-word when the case variant "%s" names another line', (pictureWord) => {
        const week = copyWeek(1, (copy) => {
            copy.print!.practice[2].pictureWord = pictureWord;
        });
        const found = printCheck(week, 'print-picture-word');
        expect(found, 'A case change must not hide a repeated picture word.').toMatchObject({ status: 'fail' });
        expect(found?.detail, 'The detail names the line that holds the word.').toContain('A nest. A net.');
    });

    it('fails print-practice when a plural ending hides behind punctuation ("A nest. A nets.")', () => {
        const week = copyWeek(1, (copy) => {
            copy.print!.practice[1].text = 'A nest. A nets.';
        });
        const found = printCheck(week, 'print-practice');
        expect(found, 'A changed word must fail even with the same sentence shape.').toMatchObject({ status: 'fail' });
        expect(found?.detail, 'The detail names the extra word nets.').toMatch(/\bnets\b/);
    });

    it('passes print-practice when only the punctuation case and quote style differ', () => {
        const week = copyWeek(1, (copy) => {
            copy.print!.practice[1].text = '“a nest a net”';
        });
        // The word list is unchanged, so the check passes by design; the next test pins the limit.
        expect(printCheck(week, 'print-practice'), 'Identical words with curly quotes pass by design.').toMatchObject({ status: 'pass' });
    });

    it('fails print-practice when a curly-quoted line changes one word', () => {
        const week = copyWeek(1, (copy) => {
            copy.print!.practice[1].text = '“A nest. A nets.”';
        });
        expect(printCheck(week, 'print-practice'), 'Curly quotes must not mask a changed word.').toMatchObject({ status: 'fail' });
    });

    it.each([
        ['alone', 'the harder note of step A7'],
        ['only', 'the easier note of step A7'],
    ])('fails print-practice when "%s" from %s reaches the practice sheet', (word) => {
        const week = copyWeek(1, (copy) => {
            copy.print!.practice.push({ text: word, pictureWord: 'nose' });
        });
        const found = printCheck(week, 'print-practice');
        expect(found, 'A word that step A7 never reads must fail.').toMatchObject({ status: 'fail' });
        expect(found?.detail, `The detail names the extra word ${word}.`).toMatch(new RegExp(`\\b${word}\\b`));
        expect(printCheck(week, 'print-picture-word'), 'The picture-word check stays pass: only the practice check fires.').toMatchObject({ status: 'pass' });
    });

    it('fails print-writing when the trace text comes from the harder note of step D4', () => {
        const week = copyWeek(1, (copy) => {
            copy.print!.writing.traceText = 'I am a boy';
        });
        expect(printCheck(week, 'print-writing'), 'The trace text of the harder note is not the D4 trace text.').toMatchObject({ status: 'fail' });
    });

    it('fails print-practice when a line holds only its picture word', () => {
        const week = copyWeek(1, (copy) => {
            copy.print!.practice[1] = { text: 'nest', pictureWord: 'nest' };
        });
        const found = printCheck(week, 'print-practice');
        expect(found, 'The dropped read words must fail.').toMatchObject({ status: 'fail' });
        expect(found?.detail, 'The detail names the missing word net.').toMatch(/\bnet\b/);
    });

    it.each([
        ['an empty practice sheet', (copy: StorytimeWeek) => { copy.print!.practice = []; }],
        ['a line with an empty text', (copy: StorytimeWeek) => { copy.print!.practice[1].text = ''; }],
        ['a line with an empty picture word', (copy: StorytimeWeek) => { copy.print!.practice[1].pictureWord = ''; }],
    ])('rejects %s at the schema boundary', (_label, change) => {
        const week = copyWeek(1, change);
        expect(StorytimeWeekSchema.safeParse(week).success, 'The schema refuses an empty print part.').toBe(false);
    });
});

describe('Adversarial: repeated picture names never collide silently', () => {
    it('suffixes every row of a second identical week with -b and keeps all names unique', () => {
        const rows = storytimePrintPictures([parsed(shipped(1)), parsed(shipped(1))]);
        expect(rows.length, 'Two copies of week 1 give 60 rows.').toBe(60);
        expect(new Set(rows.map((row) => row.id)).size, 'Every id stays unique.').toBe(60);
        expect(new Set(rows.map((row) => row.fileName)).size, 'Every color file name stays unique.').toBe(60);
        expect(new Set(rows.map((row) => row.lineArtFileName)).size, 'Every line-art file name stays unique.').toBe(60);
        expect(rows.slice(0, 30).every((row) => !row.id.endsWith('-b')), 'The first copy keeps the base ids.').toBe(true);
        expect(rows.slice(30).every((row) => row.id.endsWith('-b')), 'The second copy takes the -b suffix.').toBe(true);
    });

    it('suffixes two different repeated slugs of one week independently', () => {
        const week = copyWeek(1, (copy) => {
            const book = copy.books[0];
            book.pages.push(structuredClone(book.pages[0]), structuredClone(book.pages[1]));
        });
        const rows = storytimePrintPictures([parsed(week)]);
        const ids = rows.map((row) => row.id);
        expect(new Set(ids).size, 'Every id stays unique.').toBe(ids.length);
        expect(ids, 'The first repeated slug takes -b.').toContain('l2-w01-story-page-hello-i-am-pat-b');
        expect(ids, 'The second repeated slug takes its own -b.').toContain('l2-w01-story-page-hello-i-am-may-b');
    });

    it('throws a named repeat-limit error on the 27th identical page', () => {
        const week = copyWeek(1, (copy) => {
            const book = copy.books[0];
            book.pages = Array.from({ length: 27 }, () => structuredClone(book.pages[0]));
            copy.books = [book];
        });
        expect(() => storytimePrintPictures([parsed(week)])).toThrowError(/^picture id repeat limit: "l2-w01-story-page-hello-i-am-pat"/);
    });
});

describe('Adversarial: week 8 and an empty book list', () => {
    it('gives zero picture rows for the shipped review week', () => {
        expect(shipped(8).books, 'Week 8 ships with no books.').toEqual([]);
        expect(storytimePrintPictures([parsed(shipped(8))]), 'No books, no check items, and no print block give no rows.').toEqual([]);
    });

    it('keeps the check and practice rows and the print checks when a teaching week loses its books', () => {
        const week = copyWeek(1, (copy) => {
            copy.books = [];
        });
        const rows = storytimePrintPictures([parsed(week)]);
        const byUse = (use: string) => rows.filter((row) => row.use === use).length;
        expect(byUse('story-page'), 'No books give no story pages.').toBe(0);
        expect(byUse('cover'), 'No books give no covers.').toBe(0);
        expect(byUse('check-row'), 'The check rows do not depend on the books.').toBe(9);
        expect(byUse('practice-line'), 'The practice rows do not depend on the books.').toBe(3);
        const failures = checkStorytimePrintText(parsed(week)).filter((check) => check.status === 'fail');
        expect(failures, 'The week words come from the check items and the home card too.').toEqual([]);
    });
});

describe('Adversarial: the picture script refuses a hostile level', () => {
    const cases: [string, string[]][] = [
        ['a missing --level', []],
        ['--level without a value', ['--level']],
        ['--level 9 (outside 1 to 4)', ['--level', '9']],
        ['--level 0', ['--level', '0']],
        ['--level -1', ['--level', '-1']],
        ['--level ../x (path traversal)', ['--level', '../x']],
        ['--level=2 (the equals form is not accepted)', ['--level=2']],
        ['a level with more digits than a safe integer', ['--level', '99999999999999999999']],
    ];
    it.each(cases)('exits 2 with the usage text for %s', (_label, args) => {
        const run = spawnSync(process.execPath, ['--import', 'tsx', pictureScript, ...args], {
            cwd: dashboardRoot,
            encoding: 'utf8',
            timeout: 30000,
        });
        expect(run.status, 'A bad level exits 2 before any week file is read or written.').toBe(2);
        expect(run.stdout, 'The usage text explains the accepted level.').toContain('Usage:');
    }, 60000);

    it('exits 1 for a valid level with no week files and writes nothing', () => {
        const run = spawnSync(process.execPath, ['--import', 'tsx', pictureScript, '--level', '1'], {
            cwd: dashboardRoot,
            encoding: 'utf8',
            timeout: 30000,
        });
        expect(run.status, 'A level without week files exits 1.').toBe(1);
        expect(run.stderr, 'The error names the empty level.').toContain('no week files for level 1');
    }, 60000);
});

describe('Adversarial: the strict approval parts fail closed', () => {
    it('rejects an approved print part with whitespace-only words', () => {
        const week = copyWeek(1, (copy) => {
            copy.approval.print = { status: 'approved', date: '2026-10-26', words: '   ' };
        });
        expect(StorytimeWeekSchema.safeParse(week).success, 'Whitespace is not an approval (rule 12.1).').toBe(false);
    });

    it('rejects an approved print part that carries an unknown key', () => {
        const week = copyWeek(1, (copy) => {
            copy.approval.print = { status: 'approved', date: '2026-10-26', words: 'Synthetic test words; not an owner decision.' };
            Object.assign(copy.approval.print, { note: 'Synthetic test key.' });
        });
        expect(StorytimeWeekSchema.safeParse(week).success, 'The strict part refuses an extra key.').toBe(false);
    });

    it('never turns a misspelled approval part into an approved print gate', () => {
        const week = copyWeek(1, (copy) => {
            const approval = copy.approval as unknown as Record<string, unknown>;
            approval.prnt = { status: 'approved', date: '2026-10-26', words: 'Synthetic test words; not an owner decision.' };
            delete approval.print;
        });
        const result = StorytimeWeekSchema.safeParse(week);
        const approved = result.success ? result.data.approval.print.status === 'approved' : false;
        expect(approved, 'A misspelled key is stripped or rejected; the print gate stays closed.').toBe(false);
        if (result.success) expect(result.data.approval.print, 'The stripped key leaves the draft default.').toEqual({ status: 'draft' });
    });

    it('keeps the shipped week 1 published detail limited to the three media parts', () => {
        const published = checkById(checkStorytimeWeek(shipped(1)).checks, 'published');
        expect(published?.detail, 'No adversarial copy changed the shipped gate.').toBe('images not approved; audio not approved; song not approved');
    });
});

describe('Adversarial: the count rule boundaries', () => {
    it.each([
        ['How many eggs? Three!', { egg: 3 }],
        ['HOW MANY EGGS? THREE!', { egg: 3 }],
        ['How many eggs? No!', {}],
        ['Is it a ball? No!', {}],
        ['Is it a ball? Yes!', { ball: 1 }],
        ['A bus.', { bus: 1 }],
        ['I see a cat and a dog.', { cat: 1, dog: 1 }],
    ])('counts "%s" as %j', (text, expected) => {
        expect(pictureObjectCounts(text)).toEqual(expected);
    });
});
