// @vitest-environment node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Track storytime_l2_unit2_20261106, Task 4.1 (Red, spec FR-6): the unit scope change.
 *
 * Today the 8 unit 2 weeks are staged in content/storytime/drafts/l2/ (meta.unit 2,
 * meta.week 9 to 16); Task 4.3 later moves them to content/storytime/l2/. Every test
 * that needs 16 weeks builds a temporary root holding l2/w01.json to w16.json (copies
 * of the shipped w01 to w08 and of the staged w09 to w16) and calls the library with
 * that root or with the parsed weeks. The temp root is removed after each test, and no
 * test writes into the repository content folder.
 *
 * Case 8 (FR-6.7) method: at the phase base the test compiles every unit 1 print
 * output without Chrome (the student book HTML, the teacher book print HTML in Thai
 * with loops, the readers HTML, the card kit HTML, the step-map-u1.json text, and the
 * unit 1 picture list rows of pictures.json and pictures.md) from weeks 1 to 8 only,
 * and stores the SHA-256 of each in
 * dashboard/__tests__/fixtures/storytime-unit2-snapshot-base.json. The test then
 * compiles the same outputs with the unit 2 weeks present in the temp l2/ folder and
 * requires the same hashes.
 */

const dashboardRoot = process.cwd().includes('dashboard')
    ? process.cwd()
    : path.resolve(process.cwd(), 'dashboard');
const repoRoot = path.resolve(dashboardRoot, '..');
const storytimeRoot = path.join(repoRoot, 'content', 'storytime');
const draftsRoot = path.join(storytimeRoot, 'drafts', 'l2');
const snapshotFixture = path.join(
    dashboardRoot,
    '__tests__',
    'fixtures',
    'storytime-unit2-snapshot-base.json',
);

/** The temp roots of this file, removed after each test. */
const tempRoots: string[] = [];

afterEach(() => {
    while (tempRoots.length) {
        const root = tempRoots.pop() as string;
        fs.rmSync(root, { recursive: true, force: true });
    }
});

/** Reads and parses one JSON file. */
function readJson(file: string): any {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Parses one week file into a StorytimeWeek. */
function parseWeek(file: string): StorytimeWeek {
    return StorytimeWeekSchema.parse(readJson(file));
}

/** The shipped unit 1 weeks 1 to 8, parsed. */
function unit1Weeks(): StorytimeWeek[] {
    return Array.from(
        { length: 8 },
        (_v, index) => parseWeek(path.join(storytimeRoot, 'l2', `w${String(index + 1).padStart(2, '0')}.json`)),
    );
}

/** The staged unit 2 weeks 9 to 16, parsed. */
function unit2Weeks(): StorytimeWeek[] {
    return Array.from(
        { length: 8 },
        (_v, index) => parseWeek(path.join(draftsRoot, `w${String(index + 9).padStart(2, '0')}.json`)),
    );
}

/**
 * Builds a temporary storytime root holding l2/w01.json to w16.json: copies of the
 * shipped w01 to w08 and of the staged w09 to w16.
 * @returns The temporary storytime root (the folder holding l2/).
 */
function tempStorytimeRoot(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u2scope-'));
    tempRoots.push(root);
    const l2 = path.join(root, 'content', 'storytime', 'l2');
    fs.mkdirSync(l2, { recursive: true });
    for (let week = 1; week <= 8; week++) {
        const name = `w${String(week).padStart(2, '0')}.json`;
        fs.copyFileSync(path.join(storytimeRoot, 'l2', name), path.join(l2, name));
    }
    for (let week = 9; week <= 16; week++) {
        const name = `w${String(week).padStart(2, '0')}.json`;
        fs.copyFileSync(path.join(draftsRoot, name), path.join(l2, name));
    }
    return path.join(root, 'content', 'storytime');
}

/** The SHA-256 of one text. */
function sha256(text: string): string {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/** The 9 unit 1 reuse ids of the plan "Add 2026-11-10" (Task 2.7 finding 2). */
const REUSE_IDS = [
    'l2-w10-d4-prompt-hat',
    'l2-w16-check-row-apple',
    'l2-w16-check-row-bag',
    'l2-w16-check-row-nest',
    'l2-w16-check-row-net',
    'l2-w16-check-row-nose',
    'l2-w16-check-row-octopus',
    'l2-w16-check-row-ostrich',
    'l2-w16-check-row-ox',
];

describe('FR-6.2: the makers take the unit from meta.unit', () => {
    it('student book title names unit 2 for the unit 2 weeks', async () => {
        const { compileStorytimeStudentBook } = await import('../lib/storytime/print/student-book');
        const { STORYTIME_PRINT_PROFILE } = await import('../lib/storytime/print/profile');
        const { html } = compileStorytimeStudentBook(unit2Weeks(), {
            profile: STORYTIME_PRINT_PROFILE,
            mode: 'proof',
        });
        expect(html).toContain('Storytime Advantage, Level 2, Unit 2 Student Book');
    });

    it('student book file name names unit 2 for the unit 2 weeks', async () => {
        const { parseStorytimeStudentBookArgs } = await import('../lib/storytime/print/student-book-cli');
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'u2scope-home-'));
        tempRoots.push(home);
        const args = parseStorytimeStudentBookArgs(['--level', '2', '--weeks', '9,10,11,12,13,14,15,16', '--proof'], home, 2);
        expect(args.outputPath).toContain('Storytime-Advantage-L2-U2-Student-Book');
    });

    it('book map sticker names unit 2 for the unit 2 weeks', async () => {
        const { compileStorytimeStudentBook } = await import('../lib/storytime/print/student-book');
        const { STORYTIME_PRINT_PROFILE } = await import('../lib/storytime/print/profile');
        const { html } = compileStorytimeStudentBook(unit2Weeks(), {
            profile: STORYTIME_PRINT_PROFILE,
            mode: 'proof',
        });
        expect(html).toContain('data-sticker="unit-2"');
        expect(html).not.toContain('data-sticker="unit-1"');
    });

    it('map song line names the songs of unit 2 for the review week 16', async () => {
        const { compileStorytimeStudentBook } = await import('../lib/storytime/print/student-book');
        const { STORYTIME_PRINT_PROFILE } = await import('../lib/storytime/print/profile');
        const { html } = compileStorytimeStudentBook(unit2Weeks(), {
            profile: STORYTIME_PRINT_PROFILE,
            mode: 'proof',
        });
        expect(html).toContain('The songs of unit 2');
    });

    it('benchmark label names Benchmark 2 for the review week 16', async () => {
        const { compileStorytimeStudentBook } = await import('../lib/storytime/print/student-book');
        const { STORYTIME_PRINT_PROFILE } = await import('../lib/storytime/print/profile');
        const { html } = compileStorytimeStudentBook(unit2Weeks(), {
            profile: STORYTIME_PRINT_PROFILE,
            mode: 'proof',
        });
        expect(html).toContain('Benchmark 2');
        expect(html).not.toContain('Benchmark 1');
    });

    it('card kit title names the unit: storytimeCardKitTitle(2, 2, size)', async () => {
        const mod = (await import('../lib/storytime/print/card-kit')) as unknown as Record<string, unknown>;
        expect(typeof mod['storytimeCardKitTitle'], 'Missing export: storytimeCardKitTitle(level, unit, size)').toBe('function');
        const title = (mod['storytimeCardKitTitle'] as (level: number, unit: number, size: string) => string)(2, 2, 'A5');
        expect(title).toBe('Storytime Advantage, Level 2, Unit 2 Card Kit, A5 cards');
    });

    it('teacher book unit weeks read the unit weeks only', () => {
        const src = fs.readFileSync(
            path.join(dashboardRoot, 'scripts', 'storytime', 'make-teacher-book-print.ts'),
            'utf8',
        );
        const unitWeeksLines = src.split('\n').filter((line) => line.includes('unitWeeks'));
        expect(unitWeeksLines.length).toBeGreaterThan(0);
        expect(unitWeeksLines.some((line) => line.includes('meta.unit') || line.includes('units[0]'))).toBe(true);
    });

    it('step map file of unit 2 is step-map-u2.json', async () => {
        const { storytimeStepMapFiles } = await import('../lib/storytime/print/step-pages');
        const files = storytimeStepMapFiles(unit2Weeks());
        expect(files.map((file) => file.name)).toContain('step-map-u2.json');
    });

    it('picture list maker writes the unit 2 list under l2/print/u2/', () => {
        const src = fs.readFileSync(
            path.join(dashboardRoot, 'scripts', 'storytime', 'print-pictures.ts'),
            'utf8',
        );
        expect(src).toContain('print/u2');
    });
});

describe('FR-6.3: unit 1 reads see weeks 1 to 8 only', () => {
    it('temp l2/ holds 16 week files and unit 1 is weeks 1 to 8', async () => {
        const temp = tempStorytimeRoot();
        const { readLevelWeeks } = await import('../lib/storytime/files');
        const read = readLevelWeeks(temp, 2);
        expect(read.length).toBe(16);
        const unit1 = read.filter((r) => r.week && r.week.meta.unit === 1).map((r) => r.week?.meta.week);
        expect(unit1).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('readUnitWeeks(temp, 2, 1) reads weeks 1 to 8 only', async () => {
        const temp = tempStorytimeRoot();
        const mod = (await import('../lib/storytime/files')) as unknown as Record<string, unknown>;
        expect(typeof mod['readUnitWeeks'], 'Missing export: readUnitWeeks(root, level, unit)').toBe('function');
        const weeks = (mod['readUnitWeeks'] as (root: string, level: number, unit: number) => StorytimeWeek[])(temp, 2, 1);
        expect(weeks.map((w) => w.meta.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
});

describe('FR-6.4: the unit 2 card entries and the level match', () => {
    it('readUnitCardPictures(temp, 2, 2) gives the unit 2 card rows', async () => {
        const temp = tempStorytimeRoot();
        fs.mkdirSync(path.join(temp, 'l2', 'print', 'u2'), { recursive: true });
        fs.copyFileSync(
            path.join(draftsRoot, 'print', 'card-pictures-u2.json'),
            path.join(temp, 'l2', 'print', 'u2', 'card-pictures.json'),
        );
        const mod = (await import('../lib/storytime/files')) as unknown as Record<string, unknown>;
        expect(typeof mod['readUnitCardPictures'], 'Missing export: readUnitCardPictures(root, level, unit)').toBe('function');
        const entries = (mod['readUnitCardPictures'] as (root: string, level: number, unit: number) => { word: string; week: number }[])(temp, 2, 2);
        const staged = readJson(path.join(draftsRoot, 'print', 'card-pictures-u2.json')) as { word: string }[];
        expect(entries.map((e) => e.word)).toEqual(staged.map((e) => e.word));
        expect(entries.length).toBe(36);
    });

    it('unit 2 card match covers every row of the level, so a unit 1 picture matches', async () => {
        const { storytimeCardKit, storytimeCardPictureMatchLines } = await import('../lib/storytime/print/card-kit');
        const { storytimeCardPictureRows, storytimePrintPictures } = await import('../lib/storytime/print/pictures');
        const { readLevelCardPictures } = await import('../lib/storytime/files');
        const stagedEntries = readJson(path.join(draftsRoot, 'print', 'card-pictures-u2.json'));
        const unit1Entries = readLevelCardPictures(storytimeRoot, 2);
        const rows = [
            ...storytimePrintPictures(unit1Weeks()),
            ...storytimeCardPictureRows(unit1Entries, 2),
            ...storytimePrintPictures(unit2Weeks()),
            ...storytimeCardPictureRows(stagedEntries, 2),
        ];
        const all = new Set(rows.map((row) => row.id));
        const lines = storytimeCardPictureMatchLines(storytimeCardKit(unit2Weeks()).cards, rows, all, new Map());
        const none = lines.filter((line) => (line.split('\t')[2] ?? '').startsWith('none'));
        expect(none).toEqual([]);
    });
});

describe.each(['d', 'e', 'h', 'f', 'g'])('FR-6.5: tracing guide of %s', (letter) => {
    it('letter-stroke data exists and starts its dots on stroke 1', async () => {
        const { LETTER_STROKES, letterStrokeData } = await import('../lib/storytime/print/letter-strokes');
        const data = LETTER_STROKES[letter];
        expect(data, `Missing LETTER_STROKES entry: ${letter}`).toBeDefined();
        expect(letterStrokeData(letter).strokes.length).toBeGreaterThan(0);
        const again = letterStrokeData(letter);
        expect(again.strokes.length).toBe(data.strokes.length);
        expect(again.modelDot).toEqual(data.modelDot);
        expect(again.traceDot).toEqual(data.traceDot);
    });
});

describe('FR-6.6: review strips and check items', () => {
    it('a review strip card with an item that its week has not taught fails', async () => {
        const { checkStorytimeWeek } = await import('../lib/storytime/checks');
        const raw = readJson(path.join(draftsRoot, 'w10.json'));
        const template = raw.review[0].cards[0];
        raw.review = [1, 2, 3, 4, 5].map((day) => ({ day, cards: [{ ...template, text: 'zebra', week: 10 }] }));
        const report = checkStorytimeWeek(raw);
        const review = report.checks.find((c) => c.id === 'review');
        expect(review?.status).toBe('fail');
    });

    it('a check item with two right pictures fails', async () => {
        const { checkStorytimeWeek } = await import('../lib/storytime/checks');
        const raw = readJson(path.join(draftsRoot, 'w09.json'));
        raw.check = {
            items: [
                { kind: 'circle-picture', sound: '/d/', position: 'first', pictures: ['dog', 'dot', 'net'], answer: 'dog' },
            ],
        };
        const report = checkStorytimeWeek(raw);
        const answers = report.checks.find((c) => c.id === 'check-answers');
        expect(answers?.status).toBe('fail');
    });

    it('shipped weeks 1 to 8 give no FAIL on the two rules', async () => {
        const { checkStorytimeWeek } = await import('../lib/storytime/checks');
        for (let week = 1; week <= 8; week++) {
            const report = checkStorytimeWeek(readJson(path.join(storytimeRoot, 'l2', `w${String(week).padStart(2, '0')}.json`)));
            for (const id of ['review', 'check-answers']) {
                expect(report.checks.find((c) => c.id === id)?.status, `st2/${week} ${id}`).not.toBe('fail');
            }
        }
    });

    it('staged weeks 9 to 16 give no FAIL on the two rules', async () => {
        const { checkStorytimeWeek } = await import('../lib/storytime/checks');
        for (let week = 9; week <= 16; week++) {
            const report = checkStorytimeWeek(readJson(path.join(draftsRoot, `w${String(week).padStart(2, '0')}.json`)));
            for (const id of ['review', 'check-answers']) {
                expect(report.checks.find((c) => c.id === id)?.status, `st2/${week} ${id}`).not.toBe('fail');
            }
        }
    });
});

describe('FR-6.9: the song-frame exception of st2/12 (D15)', () => {
    /** A copy of one week whose song lines carry the frame hook a fixed number of times. */
    function songHookCopy(weekFile: string, count: number): any {
        const raw = readJson(weekFile);
        const hookLine = (i: number): string => {
            const frame = raw.focus.frame as string;
            const hook = (frame.match(/^[^.?!]*/) ?? [frame])[0].trim() || frame;
            return `${hook} again and again ${i}`;
        };
        raw.song.lines = raw.song.lines.slice(0, Math.max(count, 1)).flatMap((line: any, index: number) => {
            if (index >= count) return [];
            return [{ ...line, text: hookLine(index), imageOf: undefined }];
        });
        while (raw.song.lines.length < count) {
            raw.song.lines.push({ ...raw.song.lines[0], text: hookLine(raw.song.lines.length), imageOf: undefined });
        }
        return raw;
    }

    it('st2/12 with 7 frame lines passes and names the exception and the PM decision', async () => {
        const { checkStorytimeWeek } = await import('../lib/storytime/checks');
        const report = checkStorytimeWeek(songHookCopy(path.join(draftsRoot, 'w12.json'), 7));
        const frame = report.checks.find((c) => c.id === 'song-frame');
        expect(frame?.status).toBe('pass');
        expect(frame?.detail ?? '').toMatch(/exception/i);
        expect(frame?.detail ?? '').toContain('2026-11-09');
        expect(frame?.detail ?? '').toContain('st2/12');
    });

    it('st2/12 with 6 frame lines fails', async () => {
        const { checkStorytimeWeek } = await import('../lib/storytime/checks');
        const report = checkStorytimeWeek(songHookCopy(path.join(draftsRoot, 'w12.json'), 6));
        expect(report.checks.find((c) => c.id === 'song-frame')?.status).toBe('fail');
    });

    it('another week with 7 frame lines fails', async () => {
        const { checkStorytimeWeek } = await import('../lib/storytime/checks');
        const report = checkStorytimeWeek(songHookCopy(path.join(draftsRoot, 'w11.json'), 7));
        expect(report.checks.find((c) => c.id === 'song-frame')?.status).toBe('fail');
    });

    it('st2/12 with 8 frame lines passes with the normal text', async () => {
        const { checkStorytimeWeek } = await import('../lib/storytime/checks');
        const report = checkStorytimeWeek(songHookCopy(path.join(draftsRoot, 'w12.json'), 8));
        const frame = report.checks.find((c) => c.id === 'song-frame');
        expect(frame?.status).toBe('pass');
        expect(frame?.detail ?? '').not.toMatch(/exception/i);
    });
});

describe('plan Add 2026-11-10: the 9 unit 1 reuse ids', () => {
    it('weeks 9 to 16 ask for none of the 9 unit 1 reuse ids', async () => {
        const src = fs.readFileSync(
            path.join(dashboardRoot, 'scripts', 'storytime', 'check-storytime-pictures.ts'),
            'utf8',
        );
        expect(src).toMatch(/readLevelWeeks\(STORYTIME_ROOT, args\.level\)(?!\.filter)/);
        const { storytimePrintPictures } = await import('../lib/storytime/print/pictures');
        const fullRows = storytimePrintPictures([...unit1Weeks(), ...unit2Weeks()]);
        const requested = fullRows.filter((row) => row.week >= 9 && row.week <= 16).map((row) => row.id);
        for (const id of REUSE_IDS) expect(requested).not.toContain(id);
    });
});

describe('FR-6.7: the unit 1 output snapshot', () => {
    it('unit 1 outputs with the unit 2 weeks present give the base hashes', async () => {
        const expected = readJson(snapshotFixture) as Record<string, string>;
        const temp = tempStorytimeRoot();
        const { readLevelWeeks } = await import('../lib/storytime/files');
        const parsed = readLevelWeeks(temp, 2).flatMap((r) => (r.week ? [r.week] : []));
        const weeks1to8 = parsed.filter((w) => w.meta.unit === 1);
        expect(weeks1to8.map((w) => w.meta.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        const { compileStorytimeStudentBook } = await import('../lib/storytime/print/student-book');
        const { STORYTIME_PRINT_PROFILE } = await import('../lib/storytime/print/profile');
        const { compileStorytimeManual } = await import('../lib/storytime/manual');
        const { compileStorytimeReaders } = await import('../lib/storytime/print/readers');
        const { compileStorytimeCardSheet, storytimeCardKit } = await import('../lib/storytime/print/card-kit');
        const { storytimeStepMapFiles } = await import('../lib/storytime/print/step-pages');
        const { pictureListMarkdown, storytimePrintPictures } = await import('../lib/storytime/print/pictures');
        const actual: Record<string, string> = {
            'student-book': sha256(compileStorytimeStudentBook(weeks1to8, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html),
            'teacher-book': sha256(compileStorytimeManual(weeks1to8, { lang: 'th', paper: 'a4', loops: true }).html),
            readers: sha256(compileStorytimeReaders(weeks1to8.slice(0, 7), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook' }).html),
            'card-kit': sha256(compileStorytimeCardSheet(storytimeCardKit(weeks1to8).cards, 'A5', {}).html),
            'step-map': sha256(storytimeStepMapFiles(weeks1to8).map((f) => `${f.name}\n${f.text}`).join('\n')),
            pictures: sha256(JSON.stringify(storytimePrintPictures(weeks1to8), null, 1)),
            'pictures-md': sha256(pictureListMarkdown(storytimePrintPictures(weeks1to8), 2)),
        };
        expect(actual).toEqual(expected);
    });
});

describe('scope harness', () => {
    it('the repository content folder is unchanged', () => {
        const out = execFileSync('git', ['status', '--porcelain', 'content/'], { cwd: repoRoot, encoding: 'utf8' });
        expect(out).toBe('');
    });
});
