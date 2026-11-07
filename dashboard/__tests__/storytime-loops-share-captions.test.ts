// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { storytimeLabels } from '../lib/storytime/i18n';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { SAMPLE_THAI } from './fixtures/storytime-share-sample';

// Phase 3b Red 3 of track storytime_teaching_loops_20261103 (FR-14 "The caption cross-check", AC-14.10,
// test-strategy 9.10, X1 to X12 and the decisions Q22 to Q24): the script `check-share-captions.ts` and its
// exported function `shareCaptionProblems`. The file is split from `storytime-loops-share-book.test.ts` (P14).
//
// Red notes. The script does not exist at HEAD. The command line runs only the exit-code cases (G5: X1 to X4).
// Every other case calls the function, which loads with `await import()` inside the test body from a path
// variable, so `tsc` passes before and after Green 3. The function gets synthetic labels as arguments (Q23), so
// the function cases do not depend on the Green label text. The list writer below is typed from the grammar of
// Q22 and never imports code of the script (A3). All tests fail at Red: the script is missing, so the command
// line exits 1 (not 0 or 2) and the function import fails.
//
// Pins that the spec does not state, and that the Red author took as defaults (see the Red log):
//   - the summary line is the last non-empty line of stdout; a problem line may go to stdout or to stderr;
//   - a week that does not parse is passed to the function as an object that is not a week; the function
//     reports one problem line that starts with the week id `w<NN>: `, and does not throw (Q24).
//
// Thai rule (test-strategy 9.4, item 6). This file holds no Thai literal. The Thai of a mutant is the shipped
// text plus one ASCII character, or the placeholder of the sample file. No `expect` compares a Thai text
// with a literal.

type Raw = any;

const DASHBOARD = path.resolve(__dirname, '..');
const SCRIPT = path.join(DASHBOARD, 'scripts/storytime/check-share-captions.ts');
const WEEK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];
const LABEL_KEYS = ['sharePhoto', 'shareVideo', 'shareConsent', 'shareLength'] as const;

/** The synthetic labels of the function cases. The Thai is the placeholder of the sample file. */
const TEST_LABELS = {
    en: {
        sharePhoto: 'Photo',
        shareVideo: 'Video',
        shareConsent: 'Post only in the closed class parent group.',
        shareLength: 'A video is 10 to 20 seconds.',
    },
    th: {
        sharePhoto: `${SAMPLE_THAI} 1`,
        shareVideo: `${SAMPLE_THAI} 2`,
        shareConsent: `${SAMPLE_THAI} 3`,
        shareLength: `${SAMPLE_THAI} 4`,
    },
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const shareOf = (script: unknown): Raw => (script as Raw).share;

let weeksCache: StorytimeWeek[] | undefined;
/** The eight shipped weeks, parsed. Each call returns a fresh copy. */
function weeks(): StorytimeWeek[] {
    weeksCache ??= WEEK_NUMBERS.map((n) => StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, n), 'utf8'))));
    return copy(weeksCache);
}

/** The two label sets that the function gets: the real labels with the share labels replaced by the synthetic ones. */
function testLabels(): { en: Raw; th: Raw } {
    return { en: { ...storytimeLabels('en'), ...TEST_LABELS.en }, th: { ...storytimeLabels('th'), ...TEST_LABELS.th } };
}

/** The real label sets, as the command line reads them. A missing label reads as an empty text. */
function realLabels(): { en: Record<string, string>; th: Record<string, string> } {
    const pick = (lang: 'en' | 'th') => Object.fromEntries(LABEL_KEYS.map((key) => [key, String((storytimeLabels(lang) as unknown as Raw)[key] ?? '')]));
    return { en: pick('en'), th: pick('th') };
}

interface Row {
    id: string;
    cells: string[];
    /** A line that replaces the written row, for a row with a wrong cell count or an unescaped pipe. */
    raw?: string;
}

/** The 40 `SC-` rows of Q22: one for each day of the given weeks. */
function scRows(list: StorytimeWeek[]): Row[] {
    return list.flatMap((week) => [...week.scripts].sort((a, b) => a.day - b.day).map((script) => {
        const share = shareOf(script);
        const id = `SC-w${pad2(week.meta.week)}-d${script.day}`;
        const shots = share.shots.map((shot: Raw) => `${shot.step} ${shot.media}`).join('; ');
        return { id, cells: [id, String(week.meta.week), String(script.day), shots, share.caption.en, share.caption.th] };
    }));
}

/** The 4 `SL-` rows of Q22, in the order sharePhoto, shareVideo, shareConsent, shareLength. */
function slRows(labels: { en: Record<string, string>; th: Record<string, string> }): Row[] {
    return LABEL_KEYS.map((key, i) => ({ id: `SL-${i + 1}`, cells: [`SL-${i + 1}`, key, labels.en[key], labels.th[key]] }));
}

const escapeCell = (text: string) => text.replace(/\|/g, '\\|');
const line = (row: Row) => row.raw ?? `| ${row.cells.map(escapeCell).join(' | ')} |`;

/** The text of a caption list: a header, table 1 (the `SC-` rows), table 2 (the `SL-` rows), and the answer line. */
function listText(rows: Row[]): string {
    return [
        '# Share captions (test list)',
        '',
        'Source commit: test.',
        'Answer OK for all rows, or name a row by its id and the change.',
        '',
        '| Id | Week | Day | Shots (step, media) | English caption | Thai caption (draft) |',
        '|---|---|---|---|---|---|',
        ...rows.filter((row) => !row.id.startsWith('SL-')).map(line),
        '',
        '| Id | Key | English | Thai (draft) |',
        '|---|---|---|---|',
        ...rows.filter((row) => row.id.startsWith('SL-')).map(line),
        '',
        "Daniel's answer: ____ (date ____)",
        '',
    ].join('\n');
}

const baseRows = (): Row[] => [...scRows(weeks()), ...slRows(testLabels() as never)];

/** A copy of the rows with one cell changed. */
function change(rows: Row[], id: string, index: number, value: (old: string) => string): Row[] {
    return rows.map((row) => (row.id === id ? { ...row, cells: row.cells.map((cell, i) => (i === index ? value(cell) : cell)) } : row));
}

type CaptionResult = { rows: number; problems: string[] };
type CaptionFn = (list: Raw[], labels: Raw, text: string) => CaptionResult;

/** Loads the function inside a test body: a missing script or a missing export is a failed assertion. */
async function load(): Promise<CaptionFn> {
    const mod = (await import(SCRIPT)) as { shareCaptionProblems?: CaptionFn };
    expect(typeof mod.shareCaptionProblems, 'the export shareCaptionProblems').toBe('function');
    return mod.shareCaptionProblems!;
}

/** Runs the function on a list of rows, with the shipped weeks and the synthetic labels unless given. */
async function check(rows: Row[], options: { list?: Raw[]; labels?: Raw; text?: string } = {}): Promise<CaptionResult> {
    const fn = await load();
    return fn(options.list ?? weeks(), options.labels ?? testLabels(), options.text ?? listText(rows));
}

function expectOneProblem(result: CaptionResult, id: string, rows = 44) {
    expect(result.problems.length, `the problems: ${JSON.stringify(result.problems)}`).toBe(1);
    expect(result.problems[0].startsWith(`${id}: `), `the problem ${result.problems[0]} starts with ${id}`).toBe(true);
    expect(result.rows, 'rows read').toBe(rows);
}

describe('X5 function: one changed cell is one problem of its row id', () => {
    it('X5 baseline: the unchanged list gives 44 rows and 0 problems', async () => {
        const result = await check(baseRows());
        expect({ rows: result.rows, problems: result.problems }).toEqual({ rows: 44, problems: [] });
    });

    it.each([
        ['the English caption', 'SC-w03-d2', 4],
        ['the shots', 'SC-w02-d2', 3],
        ['the Thai caption', 'SC-w05-d4', 5],
        ['the Week cell', 'SC-w04-d1', 1],
        ['the Day cell', 'SC-w04-d1', 2],
        ['the SL English', 'SL-3', 2],
        ['the SL Thai', 'SL-4', 3],
        ['the SL key', 'SL-2', 1],
    ] as [string, string, number][])('X5 function: %s of %s (cell %i) changed gives one problem that starts with the row id', async (_name, id, index) => {
        const result = await check(change(baseRows(), id, index, (old) => (index === 1 && id.startsWith('SC-') ? '8' : index === 2 && id.startsWith('SC-') ? '5' : `${old}x`)));
        expectOneProblem(result, id);
    });
});

describe('X6 function: rows that are extra, repeated, malformed, or missing', () => {
    it('X6 function: one extra row SC-w09-d1 gives 45 rows and one problem of its id', async () => {
        const extra: Row = { id: 'SC-w09-d1', cells: ['SC-w09-d1', '9', '1', 'A3 video', 'An extra caption.', SAMPLE_THAI] };
        expectOneProblem(await check([...baseRows(), extra]), 'SC-w09-d1', 45);
    });

    it('X6 function: one repeated row id gives 45 rows and one problem of that id', async () => {
        const rows = baseRows();
        expectOneProblem(await check([...rows, rows.find((row) => row.id === 'SC-w02-d3')!]), 'SC-w02-d3', 45);
    });

    it.each([
        ['SC-w04-d1', 5],
        ['SL-2', 3],
    ] as [string, number][])('X6 function: the row %s with %i cells gives one problem of its id', async (id, count) => {
        const rows = baseRows().map((row) => (row.id === id ? { ...row, raw: `| ${row.cells.slice(0, count).join(' | ')} |` } : row));
        expectOneProblem(await check(rows), id);
    });

    it('X6 function: one missing row gives 43 rows and one problem of the expected id', async () => {
        expectOneProblem(await check(baseRows().filter((row) => row.id !== 'SC-w06-d5')), 'SC-w06-d5', 43);
    });

    it('X6 function: a list with no rows gives 0 rows and one problem for each of the 44 expected ids', async () => {
        const result = await check([]);
        expect(result.rows).toBe(0);
        expect(result.problems.length).toBe(44);
        const expected = baseRows().map((row) => row.id).sort();
        expect(result.problems.map((problem) => problem.split(': ')[0]).sort()).toEqual(expected);
    });
});

describe('X7 to X9 function: the source side', () => {
    it('X7 function: a source day without a share gives "<id>: the week file has no share" and does not throw', async () => {
        const list = weeks();
        delete list[1].scripts.find((script) => script.id === 'C')!.share;
        const result = await check(baseRows(), { list });
        expect(result.problems).toEqual(['SC-w02-d3: the week file has no share']);
        expect(result.rows).toBe(44);
    });

    it('X8 function: a week that does not parse gives one problem line that starts with its week id, and is never skipped', async () => {
        const list: Raw[] = weeks();
        list[4] = { meta: { level: 2, week: 5 } };
        const result = await check(baseRows(), { list });
        expect(result.problems.length, `the problems: ${JSON.stringify(result.problems)}`).toBe(1);
        expect(result.problems[0].startsWith('w05: ')).toBe(true);
        expect(result.rows).toBe(44);
    });

    it.each([
        ['en', 'sharePhoto', 'SL-1'],
        ['th', 'shareLength', 'SL-4'],
    ] as ['en' | 'th', string, string][])('X9 function: a source label that differs (%s %s) gives one problem of %s', async (lang, key, id) => {
        const labels = testLabels();
        labels[lang][key] = `${labels[lang][key]} changed`;
        expectOneProblem(await check(baseRows(), { labels }), id);
    });
});

describe('X10 to X12 function: the cell grammar', () => {
    const withPipe = () => {
        const list = weeks();
        shareOf(list[0].scripts.find((script) => script.id === 'A')).caption.en = 'Say a | b aloud now.';
        return list;
    };

    it('X10 function: a pipe in a caption is written as a backslash and a pipe, and reads back as a pipe', async () => {
        const list = withPipe();
        const result = await check([...scRows(list), ...slRows(testLabels() as never)], { list });
        expect({ rows: result.rows, problems: result.problems }).toEqual({ rows: 44, problems: [] });
    });

    it('X10 function: the same caption written without the backslash gives one problem of its row', async () => {
        const list = withPipe();
        const rows = [...scRows(list), ...slRows(testLabels() as never)].map((row) => (row.id === 'SC-w01-d1' ? { ...row, raw: `| ${row.cells.join(' | ')} |` } : row));
        expectOneProblem(await check(rows, { list }), 'SC-w01-d1');
    });

    it('X10 function: a header line, a separator line, and prose are not rows', async () => {
        const text = `${listText(baseRows())}\n| Id | Week | Day |\n|---|---|---|\nSC-w01-d1 is only a note, not a row.\n`;
        const result = await check([], { text });
        expect({ rows: result.rows, problems: result.problems }).toEqual({ rows: 44, problems: [] });
    });

    it('X11 function: the two-shot cell "D4 photo; D5 video" equals day 4, and the other order gives one problem', async () => {
        const rows = baseRows();
        expect(rows.find((row) => row.id === 'SC-w01-d4')!.cells[3]).toBe('D4 photo; D5 video');
        expect((await check(rows)).problems).toEqual([]);
        expectOneProblem(await check(change(rows, 'SC-w01-d4', 3, () => 'D5 video; D4 photo')), 'SC-w01-d4');
    });

    it('X12 function: a cell with outer spaces equals its source, and a cell with a changed inner space gives a problem', async () => {
        // The row still starts with "| SC-" (Q22); the cells after the id carry extra outer spaces.
        const padded = baseRows().map((row) => (row.id === 'SC-w03-d1' ? { ...row, raw: `| ${row.cells[0]} |${row.cells.slice(1).map((cell) => `   ${escapeCell(cell)}   `).join('|')}|` } : row));
        const clean = await check(padded);
        expect({ rows: clean.rows, problems: clean.problems }).toEqual({ rows: 44, problems: [] });
        expectOneProblem(await check(change(baseRows(), 'SC-w03-d1', 4, (old) => old.replace(' ', '  '))), 'SC-w03-d1');
    });
});

describe('X1 to X4 command line: the exit codes (G5)', () => {
    let tmp = '';
    beforeAll(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'share-captions-'));
    });
    afterAll(() => {
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    const list = (rows: Row[]) => {
        const file = path.join(tmp, `list-${fs.readdirSync(tmp).length}.md`);
        fs.writeFileSync(file, listText(rows));
        return file;
    };
    const realRows = () => [...scRows(weeks()), ...slRows(realLabels())];

    const run = (args: string[]) => {
        const result = spawnSync(process.execPath, ['--import', 'tsx', SCRIPT, ...args], {
            cwd: DASHBOARD, encoding: 'utf8', timeout: 60_000, env: { ...process.env, HOME: tmp },
        });
        const stdout = result.stdout ?? '';
        const stderr = result.stderr ?? '';
        const last = stdout.split('\n').filter((l) => l.trim().length > 0).pop() ?? '';
        const counts = /^share captions: (\d+) rows, (\d+) problems$/.exec(last);
        return {
            status: result.status,
            last,
            rows: counts ? Number(counts[1]) : -1,
            problems: counts ? Number(counts[2]) : -1,
            problemLines: `${stdout}\n${stderr}`.split('\n').filter((l) => /^S[CL]-/.test(l)),
        };
    };

    it('X1 command line: a list written from the shipped w01 to w08 and the 4 labels exits 0 with 44 rows and 0 problems', () => {
        const result = run(['--level', '2', '--list', list(realRows())]);
        expect(result.status).toBe(0);
        expect(result.last).toBe('share captions: 44 rows, 0 problems');
        expect({ rows: result.rows, problems: result.problems }).toEqual({ rows: 44, problems: 0 });
        expect(result.problemLines).toEqual([]);
    }, 90_000);

    it('X2 command line: one Thai caption plus one ASCII character exits 1 with one problem line that starts with the row id', () => {
        const result = run(['--level', '2', '--list', list(change(realRows(), 'SC-w05-d3', 5, (old) => `${old}x`))]);
        expect(result.status).toBe(1);
        expect(result.problemLines.length).toBe(1);
        expect(result.problemLines[0].startsWith('SC-w05-d3: ')).toBe(true);
        expect(result.last).toBe('share captions: 44 rows, 1 problems');
    }, 90_000);

    it('X4 command line: a list with one missing SC row exits 1 with 43 rows and one problem line of that id', () => {
        const result = run(['--level', '2', '--list', list(realRows().filter((row) => row.id !== 'SC-w02-d4'))]);
        expect(result.status).toBe(1);
        expect(result.problemLines.length).toBe(1);
        expect(result.problemLines[0].startsWith('SC-w02-d4: ')).toBe(true);
        expect(result.last).toBe('share captions: 43 rows, 1 problems');
    }, 90_000);

    it.each([
        ['an unknown flag', (file: string) => ['--level', '2', '--list', file, '--unknown']],
        ['a missing --list', () => ['--level', '2']],
        ['a missing --level', (file: string) => ['--list', file]],
        ['--level without a value', (file: string) => ['--list', file, '--level']],
        ['--level 9', (file: string) => ['--level', '9', '--list', file]],
        ['both arguments missing', () => []],
        ['a list file that does not exist', () => ['--level', '2', '--list', path.join(os.tmpdir(), 'share-captions-no-such-file.md')]],
    ] as [string, (file: string) => string[]][])('X3 command line: %s exits 2', (_name, args) => {
        const result = run(args(list(realRows())));
        expect(result.status).toBe(2);
    }, 90_000);
});
