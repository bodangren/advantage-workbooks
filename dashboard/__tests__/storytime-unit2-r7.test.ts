// @vitest-environment node
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkStorytimeWeek, taughtTo } from '../lib/storytime/checks';
import { readLevelWeeks, readUnitCardPictures } from '../lib/storytime/files';
import { compileStorytimeManual } from '../lib/storytime/manual';
import {
    compileStorytimeCardSheet,
    storytimeCardKit,
    storytimeCardKitTitle,
    storytimeCardPictureRow,
    type StorytimeCard,
} from '../lib/storytime/print/card-kit';
import { storytimeCardKitFileNames } from '../lib/storytime/print/card-kit-cli';
import { storytimeCardPictureRows, storytimePrintPictures } from '../lib/storytime/print/pictures';
import { storytimeStudentBookPages } from '../lib/storytime/print/step-pages';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Track storytime_l2_unit2_20261106, Task 4.1 retry 7 (Red, spec FR-6): the open
 * findings of Review A round 3 (review-a-p134-r3-f33a4911.json) as behavior of
 * the production paths, plus orchestrator finding F16 of the same round.
 * F3, F4, F8, F9, F16.
 *
 * Failing tests name their finding and fail at HEAD for the reason the review
 * gives; they pass after the correct Green fix. Guards pass at HEAD and pin the
 * contracts Green must keep. No test writes into the repository content folder.
 * No test holds a Thai literal: week files are parsed at runtime and only
 * statuses, ids, and counts are asserted. Page numbers are read from the
 * English (`en`) manual HTML, so no Thai reaches the output.
 */

const dashboardRoot = process.cwd().includes('dashboard')
    ? process.cwd()
    : path.resolve(process.cwd(), 'dashboard');
const repoRoot = path.resolve(dashboardRoot, '..');
const storytimeRoot = path.join(repoRoot, 'content', 'storytime');
const graphFile = path.join(repoRoot, '..', 'mastery-advantage', 'english', 'phonics', 'phonics-knowledge-space.json');

type WeekReport = { checks: { id: string; status: string; problems?: string[] }[] };

const tempRoots: string[] = [];
const worktrees: string[] = [];

afterAll(() => {
    for (const root of worktrees) {
        spawnSync('git', ['worktree', 'remove', '--force', root], { cwd: repoRoot, encoding: 'utf8' });
        fs.rmSync(root, { recursive: true, force: true });
    }
    while (tempRoots.length) {
        const root = tempRoots.pop() as string;
        fs.rmSync(root, { recursive: true, force: true });
    }
});

function readJson(file: string): any {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let cachedAll: StorytimeWeek[] | undefined;
function allWeeks(): StorytimeWeek[] {
    if (!cachedAll) {
        cachedAll = [];
        for (let week = 1; week <= 16; week++) {
            cachedAll.push(StorytimeWeekSchema.parse(readJson(path.join(storytimeRoot, 'l2', `w${String(week).padStart(2, '0')}.json`))));
        }
    }
    return cachedAll;
}

function rawWeek(week: number): any {
    return readJson(path.join(storytimeRoot, 'l2', `w${String(week).padStart(2, '0')}.json`));
}

function checkStatus(report: { checks: { id: string; status: string }[] }, id: string): string {
    const row = report.checks.find((c) => c.id === id);
    expect(row, `the check row ${id} is present`).toBeDefined();
    return (row as { status: string }).status;
}

function knownReport(raw: unknown, week: number): WeekReport {
    const weeks = allWeeks();
    const target = weeks.find((w) => w.meta.week === week) as StorytimeWeek;
    return checkStorytimeWeek(raw, taughtTo(weeks, target), undefined, weeks) as unknown as WeekReport;
}

function cardTemplate(kind: string): any {
    for (let week = 9; week <= 16; week++) {
        for (const strip of rawWeek(week).review) {
            const found = (strip.cards as any[]).find((c) => c.kind === kind);
            if (found) return found;
        }
    }
    throw new Error(`no review card of kind ${kind} in weeks 9 to 16`);
}

function reviewCopy(week: number, card: object): any {
    const raw = rawWeek(week);
    raw.review = [1, 2, 3, 4, 5].map((day) => ({ day, cards: [{ ...card }] }));
    return raw;
}

function runMaker(script: string, args: string[], root?: string): { status: number | null; stdout: string; stderr: string } {
    const env = { ...process.env, ...(root ? { WORKBOOKS_ROOT: root } : {}), MASTERY_PHONICS_GRAPH: graphFile } as NodeJS.ProcessEnv;
    const run = spawnSync(process.execPath, ['--import', 'tsx', path.join(dashboardRoot, script), ...args], {
        cwd: dashboardRoot, encoding: 'utf8', env, timeout: 300_000,
    });
    return { status: run.status, stdout: run.stdout ?? '', stderr: run.stderr ?? '' };
}

describe('F3: the standalone review check never passes a card it cannot verify', () => {
    it('a sound card g labeled week 1 in a week 15 package fails without the earlier weeks', () => {
        const weeks = allWeeks();
        const target = weeks.find((w) => w.meta.week === 15) as StorytimeWeek;
        const taught = taughtTo(weeks, target);
        const raw = reviewCopy(15, { ...cardTemplate('sound'), kind: 'sound', text: 'g', week: 1 });
        const report = checkStorytimeWeek(raw, taught, undefined, undefined) as unknown as WeekReport;
        const row = report.checks.find((c) => c.id === 'review');
        expect(row, 'the review row is present').toBeDefined();
        expect(row?.status, 'a card from a missing teaching week fails, never passes').toBe('fail');
        expect((row?.problems ?? []).join(' '), 'the row names week 1').toContain('week 1');
    });

    it('the complete-level call keeps its result for the same unverifiable card', () => {
        const weeks = allWeeks();
        const target = weeks.find((w) => w.meta.week === 15) as StorytimeWeek;
        const taught = taughtTo(weeks, target);
        const raw = reviewCopy(15, { ...cardTemplate('sound'), kind: 'sound', text: 'g', week: 1 });
        const report = checkStorytimeWeek(raw, taught, undefined, weeks) as unknown as WeekReport;
        const row = report.checks.find((c) => c.id === 'review');
        expect(row, 'the review row is present').toBeDefined();
        expect(row?.status, 'week 1 never taught g, so the row fails').toBe('fail');
        expect((row?.problems ?? []).join(' '), 'the row names week 1').toContain('week 1');
    });

    it('real weeks 1 to 16 keep the review row at pass through the production call form', () => {
        for (let week = 1; week <= 16; week++) {
            const report = knownReport(rawWeek(week), week);
            expect(checkStatus(report, 'review'), `st2/${week} review`).toBe('pass');
        }
    });
});

describe('F4: the sound table answers from its own entries only', () => {
    function checkCopy(item: object): any {
        const raw = rawWeek(9);
        raw.check = { items: [item] };
        return raw;
    }

    function answersOf(raw: unknown): { status: string; problems: string[] } {
        const typed = checkStorytimeWeek(raw) as { checks: { id: string; status: string; problems?: string[] }[] };
        const row = typed.checks.find((c) => c.id === 'check-answers');
        expect(row, 'the check-answers row is present').toBeDefined();
        return { status: row?.status ?? '', problems: row?.problems ?? [] };
    }

    it('constructor is an unknown picture word: /d/ first with dog, cat, constructor and answer dog fails and names the word', () => {
        const raw = checkCopy({ kind: 'circle-picture', sound: '/d/', position: 'first', pictures: ['dog', 'cat', 'constructor'], answer: 'dog' });
        const { status, problems } = answersOf(raw);
        expect(status, 'an inherited object key is not a fact').toBe('fail');
        expect(problems.join(' '), 'the row names constructor').toContain('constructor');
    });

    it('toString and __proto__ are unknown picture words', () => {
        const raw = checkCopy({ kind: 'circle-picture', sound: '/d/', position: 'first', pictures: ['dog', 'toString', '__proto__'], answer: 'dog' });
        const { status, problems } = answersOf(raw);
        expect(status, 'inherited keys are not facts').toBe('fail');
        expect(problems.join(' '), 'the row names toString').toContain('toString');
    });

    it('moon is a real week 8 picture-sort word with first sound /m/', () => {
        const raw = checkCopy({ kind: 'circle-picture', sound: '/m/', position: 'first', pictures: ['moon', 'cat', 'net'], answer: 'moon' });
        const { status } = answersOf(raw);
        expect(status, 'moon has first sound /m/').toBe('pass');
    });

    it('the week 16 picture-sort words have the middle facts the sort asks', () => {
        const raw = checkCopy({ kind: 'circle-picture', sound: '/a/', position: 'middle', pictures: ['cat', 'dog', 'net'], answer: 'cat' });
        const { status } = answersOf(raw);
        expect(status, 'cat has middle sound /a/').toBe('pass');
    });

    it('an unmatched distractor outside the table fails', () => {
        const raw = checkCopy({ kind: 'circle-picture', sound: '/d/', position: 'first', pictures: ['dog', 'cat', 'zqxjk'], answer: 'dog' });
        const { status, problems } = answersOf(raw);
        expect(status, 'an unknown distractor fails').toBe('fail');
        expect(problems.join(' '), 'the row names zqxjk').toContain('zqxjk');
    });
});

describe('F8: the card match report and the teacher-book page map come from the makers', () => {
    it('the card kit dry run returns the wired match report, not only file names', () => {
        const run = runMaker('scripts/storytime/make-card-kit-pdf.ts', ['--level', '2', '--weeks', '9,10,11,12,13,14,15,16', '--dry-run']);
        expect(run.status, 'the card kit dry run exits 0').toBe(0);
        expect(run.stdout, 'the dry run returns the wired match counts').toContain('picture cards:');
    }, 300_000);

    it('the teacher-book maker returns its wired unit page map through a dry run', () => {
        const run = runMaker('scripts/storytime/make-teacher-book-print.ts', ['--level', '2', '--weeks', '9,10,11,12,13,14,15,16', '--lang', 'th', '--dry-run']);
        expect(run.status, 'the teacher-book dry run exits 0').toBe(0);
        expect(run.stdout, 'the dry run returns the wired student-book page map').toContain('student-book pages:');
    }, 300_000);
});

describe('F9: the enriched unit 1 inputs at the phase base equal HEAD', () => {
    function enrichedHash(root: string): Record<string, string> {
        const all = readLevelWeeks(root, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
        const weeks = all.filter((week) => week.meta.unit === 1);
        const pages = storytimeStudentBookPages(weeks);
        const teacherPages = compileStorytimeManual(weeks, { lang: 'th', paper: 'a4', loops: true, studentBookPages: pages }).html;
        const rows = [
            ...storytimePrintPictures(weeks),
            ...storytimeCardPictureRows(readUnitCardPictures(root, 2, 1), 2),
        ];
        const delivered = new Set(rows.map((row) => row.id));
        const pictureOf = (card: StorytimeCard): string | undefined => {
            const row = storytimeCardPictureRow(card, rows, delivered);
            return row ? `row:${row.id}` : undefined;
        };
        const names = storytimeCardKitFileNames(2, 1, 1);
        const kit = storytimeCardKit(weeks);
        const cardA6 = compileStorytimeCardSheet(kit.cards, 'A6', { pictureOf: pictureOf as never, title: storytimeCardKitTitle(2, 1, 'A6') }).html;
        const sha = (value: string): string => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
        return {
            weeks: weeks.map((week) => String(week.meta.week)).join(','),
            teacherPages: `ok:${sha(teacherPages)}`,
            cardA6: `ok:${sha(names.a6 + cardA6)}`,
            names: `ok:${sha(JSON.stringify(names))}`,
            title: storytimeCardKitTitle(2, 1, 'A6'),
        };
    }

    it('the phase-base worktree and HEAD give the same enriched unit 1 hash', () => {
        const phaseBase = '35729287dc615dd9688cb7ddb6179786c23b3f01';
        const baseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'u2r7base-'));
        worktrees.push(baseRoot);
        const add = spawnSync('git', ['worktree', 'add', '--detach', baseRoot, phaseBase], { cwd: repoRoot, encoding: 'utf8' });
        expect(add.status, `git worktree add exits 0: ${(add.stderr ?? '').slice(-1000)}`).toBe(0);
        const baseNodeModules = path.join(baseRoot, 'dashboard', 'node_modules');
        if (!fs.existsSync(baseNodeModules)) {
            fs.symlinkSync(path.join(dashboardRoot, 'node_modules'), baseNodeModules);
        }
        const head = enrichedHash(storytimeRoot);
        expect(head.weeks, 'the snapshot filters to unit 1').toBe('1,2,3,4,5,6,7,8');
        const baseStorytime = path.join(baseRoot, 'content', 'storytime');
        expect(fs.existsSync(path.join(baseStorytime, 'l2', 'w01.json')), 'the phase-base worktree holds unit 1 weeks').toBe(true);
        const base = enrichedHash(baseStorytime);
        expect(base, 'the enriched unit 1 inputs at the phase base equal HEAD').toEqual(head);
    }, 300_000);
});

describe('F16: the manual maker uses the page list of the unit of the requested weeks', () => {
    it('week 9 uses the unit 2 page list, and week 1 keeps the unit 1 page list', async () => {
        const all = allWeeks();
        const unit1 = all.filter((week) => week.meta.unit === 1);
        const unit2 = all.filter((week) => week.meta.unit === 2);
        const w01 = unit1.find((week) => week.meta.week === 1) as StorytimeWeek;
        const w09 = unit2.find((week) => week.meta.week === 9) as StorytimeWeek;
        const { manualPdfHtml } = await import('../scripts/storytime/make-manual-pdf');
        const pagesOf = (html: string): string[] =>
            Array.from(html.matchAll(/student book, page ([\d\u2013-]+):/g)).map((match) => match[1]);
        const makerU2 = manualPdfHtml([w09], { lang: 'en', loops: true, bookPages: true });
        const makerU2Pages = pagesOf(makerU2);
        expect(makerU2Pages.length, 'week 9 names student-book pages').toBeGreaterThan(0);
        const expectedU2 = compileStorytimeManual([w09], {
            lang: 'en', paper: 'a4', loops: true, studentBookPages: storytimeStudentBookPages(unit2),
        }).html;
        expect(pagesOf(expectedU2).length, 'the unit 2 expectation names pages').toBe(makerU2Pages.length);
        expect(makerU2Pages, 'week 9 uses the unit 2 page list').toEqual(pagesOf(expectedU2));
        const makerU1 = manualPdfHtml([w01], { lang: 'en', loops: true, bookPages: true });
        const makerU1Pages = pagesOf(makerU1);
        expect(makerU1Pages.length, 'week 1 names student-book pages').toBeGreaterThan(0);
        const expectedU1 = compileStorytimeManual([w01], {
            lang: 'en', paper: 'a4', loops: true, studentBookPages: storytimeStudentBookPages(unit1),
        }).html;
        expect(makerU1Pages, 'week 1 keeps the unit 1 page list').toEqual(pagesOf(expectedU1));
    }, 300_000);
});
