// @vitest-environment node
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { checkStorytimeWeek, taughtTo } from '../lib/storytime/checks';
import { readLevelWeeks, readUnitCardPictures } from '../lib/storytime/files';
import { compileStorytimeManual } from '../lib/storytime/manual';
import {
    compileStorytimeCardSheet,
    storytimeCardKit,
    storytimeCardKitTitle,
    storytimeCardPictureMatchLines,
    storytimeCardPictureRow,
    type StorytimeCard,
} from '../lib/storytime/print/card-kit';
import { storytimeCardKitFileNames } from '../lib/storytime/print/card-kit-cli';
import { storytimeCardPictureRows, storytimePrintPictures, type StorytimePictureRow } from '../lib/storytime/print/pictures';
import { storytimeStudentBookPages } from '../lib/storytime/print/step-pages';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Track storytime_l2_unit2_20261106, Task 4.1 retry 5 (Red, spec FR-6): the open
 * findings of Review A round 2 as behavior of the production paths.
 *
 * Failing tests name their finding and fail at HEAD for the reason the review
 * gives; they pass after the correct Green round 3 fix. Guards pass at HEAD and
 * pin the contracts Green must keep. Every test runs in-process or through a
 * repository maker script on a temp root: no test writes into the repository
 * content folder, writes a driver file, or opens a git worktree. No test holds
 * a Thai literal: week files are parsed at runtime and only statuses, ids, and
 * counts are asserted.
 */

const dashboardRoot = process.cwd().includes('dashboard')
    ? process.cwd()
    : path.resolve(process.cwd(), 'dashboard');
const repoRoot = path.resolve(dashboardRoot, '..');
const storytimeRoot = path.join(repoRoot, 'content', 'storytime');
const graphFile = path.join(repoRoot, '..', 'mastery-advantage', 'english', 'phonics', 'phonics-knowledge-space.json');

/** One week report: the checks with their problems. */
type WeekReport = { checks: { id: string; status: string; problems?: string[] }[] };

/** The temp roots of this file, removed after the last test. */
const tempRoots: string[] = [];

afterAll(() => {
    while (tempRoots.length) {
        const root = tempRoots.pop() as string;
        fs.rmSync(root, { recursive: true, force: true });
    }
});

/** Reads and parses one JSON file. */
function readJson(file: string): any {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** The published weeks of both units, parsed and cached. */
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

/** The raw JSON of one published week. */
function rawWeek(week: number): any {
    return readJson(path.join(storytimeRoot, 'l2', `w${String(week).padStart(2, '0')}.json`));
}

/** The status of one check of a week report; the row must exist. */
function checkStatus(report: { checks: { id: string; status: string }[] }, id: string): string {
    const row = report.checks.find((c) => c.id === id);
    expect(row, `the check row ${id} is present`).toBeDefined();
    return (row as { status: string }).status;
}

/** The production call form: taught set plus the known weeks of the level. */
function knownReport(raw: unknown, week: number): WeekReport {
    const weeks = allWeeks();
    const target = weeks.find((w) => w.meta.week === week) as StorytimeWeek;
    return checkStorytimeWeek(raw, taughtTo(weeks, target), undefined, weeks) as unknown as WeekReport;
}

/** One review card template of a kind from the published unit 2 weeks. */
function cardTemplate(kind: string): any {
    for (let week = 9; week <= 16; week++) {
        for (const strip of rawWeek(week).review) {
            const found = (strip.cards as any[]).find((c) => c.kind === kind);
            if (found) return found;
        }
    }
    throw new Error(`no review card of kind ${kind} in weeks 9 to 16`);
}

/** A week copy whose review strips hold five days of one crafted card. */
function reviewCopy(week: number, card: object): any {
    const raw = rawWeek(week);
    raw.review = [1, 2, 3, 4, 5].map((day) => ({ day, cards: [{ ...card }] }));
    return raw;
}

/**
 * Mirrors the published storytime tree into a temp root with symlinked files, then
 * replaces every generated output with a real file copied from the repository, so a
 * maker reads the committed inputs and writes only the temp root. The unit 2 card
 * input stays a real file with the given entries, so the maker reads only the temp root.
 * @param cardEntries The unit 2 card entries to keep in the temp root.
 * @returns The temp root (the folder holding `content/`).
 */
function mirrorWithCardInput(cardEntries: unknown): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u2r5-'));
    tempRoots.push(root);
    const mirror = (src: string, out: string): void => {
        fs.mkdirSync(out, { recursive: true });
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
            if (entry.name === 'node_modules') continue;
            const from = path.join(src, entry.name);
            const to = path.join(out, entry.name);
            if (entry.isDirectory()) mirror(from, to);
            else fs.symlinkSync(from, to);
        }
    };
    mirror(storytimeRoot, path.join(root, 'content', 'storytime'));
    const l2 = path.join(root, 'content', 'storytime', 'l2');
    for (const rel of ['print/pictures.json', 'print/pictures.md', 'print/u2/pictures.json', 'print/u2/pictures.md', 'step-map-u1.json', 'step-map-u2.json']) {
        const from = path.join(storytimeRoot, 'l2', rel);
        if (fs.existsSync(from)) {
            fs.rmSync(path.join(l2, rel), { force: true });
            fs.copyFileSync(from, path.join(l2, rel));
        }
    }
    fs.rmSync(path.join(l2, 'print', 'u2', 'card-pictures.json'), { force: true });
    fs.mkdirSync(path.join(l2, 'print', 'u2'), { recursive: true });
    fs.writeFileSync(path.join(l2, 'print', 'u2', 'card-pictures.json'), JSON.stringify(cardEntries));
    return root;
}

/**
 * Runs one maker script in a child process, on a temp root when given, else on the repository.
 * @param script The script file, relative to the dashboard folder.
 * @param args The arguments after the script path.
 * @param root The temp storytime root for WORKBOOKS_ROOT, or undefined for the repository.
 * @returns The exit code, the standard output, and the error output.
 */
function runMaker(script: string, args: string[], root?: string): { status: number | null; stdout: string; stderr: string } {
    const env = { ...process.env, ...(root ? { WORKBOOKS_ROOT: root } : {}), MASTERY_PHONICS_GRAPH: graphFile } as NodeJS.ProcessEnv;
    const run = spawnSync(process.execPath, ['--import', 'tsx', path.join(dashboardRoot, script), ...args], {
        cwd: dashboardRoot, encoding: 'utf8', env, timeout: 300_000,
    });
    return { status: run.status, stdout: run.stdout ?? '', stderr: run.stderr ?? '' };
}

describe('F2: the picture batch check has a strict mode for the full delivery', () => {
    /** The 193 book rows and the 36 card rows of weeks 9 to 16. */
    function unit2Rows(): { bookIds: string[]; cardIds: string[] } {
        const weeks = allWeeks();
        const bookIds = storytimePrintPictures(weeks).filter((row) => row.week >= 9 && row.week <= 16).map((row) => row.id);
        const cardEntries = readUnitCardPictures(storytimeRoot, 2, 2);
        const cardIds = storytimeCardPictureRows(cardEntries, 2).filter((row) => row.week >= 9 && row.week <= 16).map((row) => row.id);
        return { bookIds, cardIds };
    }

    /** A batch folder whose manifest holds one fake job for each listed row id. */
    function batchWithJobs(ids: string[]): string {
        const job = (id: string): object => ({
            id,
            status: 'ready',
            selectedVersion: 1,
            candidates: [{
                version: 1,
                status: 'ready',
                file: `${id}-v1.png`,
                sha256: '0'.repeat(64),
                pixelSize: { width: 1500, height: 1500 },
                lineArt: { status: 'ready', file: `${id}-line-v1.png`, sha256: '0'.repeat(64), pixelSize: { width: 1500, height: 1500 } },
            }],
        });
        const batch = fs.mkdtempSync(path.join(os.tmpdir(), 'u2r5-batch-'));
        tempRoots.push(batch);
        fs.writeFileSync(path.join(batch, 'manifest.json'), JSON.stringify({ jobs: ids.map(job) }));
        return batch;
    }

    it('strict mode with only the 193 book jobs fails and names the 36 missing card rows', () => {
        const { bookIds, cardIds } = unit2Rows();
        expect(bookIds.length, '193 book rows').toBe(193);
        expect(cardIds.length, '36 card rows').toBe(36);
        const run = runMaker(
            'scripts/storytime/check-storytime-pictures.ts',
            ['--batch', batchWithJobs(bookIds), '--level', '2', '--weeks', '9,10,11,12,13,14,15,16', '--all-rows'],
        );
        expect(run.status, 'the strict check exits 1').toBe(1);
        for (const id of cardIds) {
            expect(run.stdout, `the missing unit 2 card row ${id} is named`).toContain(`fail  ${id}`);
        }
    }, 300_000);

    it('the default partial-batch contract stays: book jobs skip the card class', () => {
        const { bookIds, cardIds } = unit2Rows();
        const run = runMaker(
            'scripts/storytime/check-storytime-pictures.ts',
            ['--batch', batchWithJobs(bookIds), '--level', '2', '--weeks', '9,10,11,12,13,14,15,16'],
        );
        for (let week = 9; week <= 15; week++) {
            expect(run.stdout, `week ${week} card rows are skipped`).toContain(`skip  card rows of week ${week}`);
        }
        for (const id of cardIds) {
            expect(run.stdout, `no card fail line for ${id}`).not.toContain(`fail  ${id}`);
        }
    }, 300_000);
});

describe('F3: a review strip card keeps the kind-specific taught facts of its own week', () => {
    it('a word card with a distractor-only word fails: cat is a wrong picture of week 1, not a taught word', () => {
        const raw = reviewCopy(1, { ...cardTemplate('word'), kind: 'word', text: 'cat', week: 1 });
        const report = knownReport(raw, 1);
        expect(checkStatus(report, 'review'), 'a distractor is not a taught word').toBe('fail');
    });

    it('a sound card keeps the taught letters only: and is a tricky word of week 1, not a letter', () => {
        const raw = reviewCopy(1, { ...cardTemplate('sound'), kind: 'sound', text: 'and', week: 1 });
        const report = knownReport(raw, 1);
        expect(checkStatus(report, 'review'), 'a sound card is a letter').toBe('fail');
    });

    it('a tricky card keeps the taught tricky words only: d is a letter of week 9, not a tricky word', () => {
        const raw = reviewCopy(9, { ...cardTemplate('tricky'), kind: 'tricky', text: 'd', week: 9 });
        const report = knownReport(raw, 9);
        expect(checkStatus(report, 'review'), 'a tricky card is a tricky word').toBe('fail');
    });

    it('a frame card keeps the taught frames only: d matches no frame of week 9', () => {
        const raw = reviewCopy(9, { ...cardTemplate('frame'), kind: 'frame', text: 'd', week: 9 });
        const report = knownReport(raw, 9);
        expect(checkStatus(report, 'review'), 'a frame card is a taught frame').toBe('fail');
    });

    it('missing teaching data fails the row: a week 5 card with no week 5 in the known weeks', () => {
        const weeks = allWeeks().filter((w) => w.meta.week !== 5);
        const raw = reviewCopy(9, { ...cardTemplate('word'), kind: 'word', text: 'dog', week: 5 });
        const report = checkStorytimeWeek(raw, undefined, undefined, weeks) as unknown as WeekReport;
        const row = report.checks.find((c) => c.id === 'review');
        expect(row, 'the review row is present').toBeDefined();
        expect(row?.status, 'missing teaching data fails').toBe('fail');
        expect((row?.problems ?? []).join(' '), 'the row names week 5').toContain('week 5');
    });

    it('real weeks 1 to 16 keep the review row at pass through the production call form', () => {
        for (let week = 1; week <= 16; week++) {
            const report = knownReport(rawWeek(week), week);
            expect(checkStatus(report, 'review'), `st2/${week} review`).toBe('pass');
        }
    });

    it('a lone check of a published week stays meaningful: the week 9 strips pass alone', () => {
        const report = checkStorytimeWeek(rawWeek(9)) as unknown as WeekReport;
        expect(checkStatus(report, 'review'), 'st2/9 review').toBe('pass');
    });
});

describe('F4: position-specific sound facts, and no guessing on unknown words', () => {
    /** A week 9 copy whose Friday check holds one crafted item. */
    function checkCopy(item: object): any {
        const raw = rawWeek(9);
        raw.check = { items: [item] };
        return raw;
    }

    it('city does not have first sound /k/: the soft c fails the row', () => {
        const report = checkCopy({ kind: 'circle-picture', sound: '/k/', position: 'first', pictures: ['city', 'dog', 'net'], answer: 'city' });
        expect(checkStatus(checkStorytimeWeek(report) as unknown as WeekReport, 'check-answers')).toBe('fail');
    });

    it('phone has last sound /n/, not /f/: a last-/f/ match on phone fails', () => {
        const report = checkCopy({ kind: 'circle-picture', sound: '/f/', position: 'last', pictures: ['phone', 'cat', 'net'], answer: 'phone' });
        expect(checkStatus(checkStorytimeWeek(report) as unknown as WeekReport, 'check-answers')).toBe('fail');
    });

    it('phone has last sound /n/: the single match passes', () => {
        const report = checkCopy({ kind: 'circle-picture', sound: '/n/', position: 'last', pictures: ['phone', 'cat', 'net'], answer: 'phone' });
        expect(checkStatus(checkStorytimeWeek(report) as unknown as WeekReport, 'check-answers')).toBe('pass');
    });

    it('knight has first sound /n/: the single match passes', () => {
        const report = checkCopy({ kind: 'circle-picture', sound: '/n/', position: 'first', pictures: ['knight', 'cat', 'dog'], answer: 'knight' });
        expect(checkStatus(checkStorytimeWeek(report) as unknown as WeekReport, 'check-answers')).toBe('pass');
    });

    it('an unknown picture word fails the row and names the word: no guessing', () => {
        const report = checkCopy({ kind: 'circle-picture', sound: '/d/', position: 'first', pictures: ['dqwux', 'cat', 'net'], answer: 'dqwux' });
        const typed = checkStorytimeWeek(report) as { checks: { id: string; status: string; problems?: string[] }[] };
        const row = typed.checks.find((c) => c.id === 'check-answers');
        expect(row, 'the check-answers row is present').toBeDefined();
        expect(row?.status, 'an unknown word fails').toBe('fail');
        expect((row?.problems ?? []).join(' '), 'the row names dqwux').toContain('dqwux');
    });

    it('phone has first sound /f/: the single match passes', () => {
        const report = checkCopy({ kind: 'circle-picture', sound: '/f/', position: 'first', pictures: ['phone', 'cat', 'net'], answer: 'phone' });
        expect(checkStatus(checkStorytimeWeek(report) as unknown as WeekReport, 'check-answers')).toBe('pass');
    });

    it('every real circle-picture item of weeks 1 to 16 keeps check-answers at pass', () => {
        for (let week = 1; week <= 16; week++) {
            const raw = rawWeek(week);
            const items = (raw.check?.items ?? []) as { kind: string; sound?: string; position?: string; pictures?: string[]; answer?: string }[];
            items
                .filter((item) => item.kind === 'circle-picture')
                .forEach((item, index) => {
                    const single = rawWeek(week);
                    single.check = { items: [item] };
                    const names = (item.pictures ?? []).join('/');
                    expect(checkStatus(checkStorytimeWeek(single) as unknown as WeekReport, 'check-answers'), `st2/${week} item ${index + 1} (${names})`).toBe('pass');
                });
            const full = knownReport(raw, week);
            const row = full.checks.find((c) => c.id === 'check-answers');
            if (raw.meta.kind === 'review') {
                expect(row === undefined || row.status === 'pass', `st2/${week} check-answers`).toBe(true);
                return;
            }
            expect(checkStatus(full, 'check-answers'), `st2/${week} check-answers`).toBe('pass');
        }
    });
});

describe('F8: the later-unit card match and the teacher-book unit pages through the production seams', () => {
    it('the later-unit card match covers every picture-type row on a temp root', () => {
        const tempContent = path.join(
            mirrorWithCardInput(readJson(path.join(storytimeRoot, 'l2', 'print', 'u2', 'card-pictures.json'))),
            'content',
            'storytime',
        );
        const all = readLevelWeeks(tempContent, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
        const unit2 = all.filter((week) => week.meta.unit === 2);
        const u1rows = readJson(path.join(tempContent, 'l2', 'print', 'pictures.json')) as StorytimePictureRow[];
        const bookRows = storytimePrintPictures(all).filter((row) => row.week >= 9 && row.week <= 16);
        const cardRows = storytimeCardPictureRows(readUnitCardPictures(tempContent, 2, 2), 2).filter(
            (row) => row.week >= 9 && row.week <= 16,
        );
        const rows = [...u1rows, ...bookRows, ...cardRows];
        const kit = storytimeCardKit(unit2);
        const delivered = new Set(rows.map((row) => row.id));
        const lines = storytimeCardPictureMatchLines(kit.cards, rows, delivered, new Map());
        const none = lines.filter((line) => (line.split('\t')[2] ?? '').startsWith('none'));
        const unit2Count = (readJson(path.join(storytimeRoot, 'l2', 'print', 'u2', 'pictures.json')) as unknown[]).length;
        expect(bookRows.length, 'the 193 book rows of weeks 9 to 16').toBe(193);
        expect(cardRows.length, 'the 36 card rows of weeks 9 to 16').toBe(36);
        expect(rows.length, 'the unit 1 rows plus the unit 2 rows').toBe(u1rows.length + unit2Count);
        expect(lines.length, 'the unit 2 picture-type cards are listed').toBeGreaterThan(0);
        expect(none.length, 'every picture-type card matches').toBe(0);
    }, 300_000);

    it('the card kit maker command runs on the unit 2 weeks of a temp root', () => {
        const root = mirrorWithCardInput(readJson(path.join(storytimeRoot, 'l2', 'print', 'u2', 'card-pictures.json')));
        const run = runMaker(
            'scripts/storytime/make-card-kit-pdf.ts',
            ['--level', '2', '--weeks', '9,10,11,12,13,14,15,16', '--dry-run'],
            root,
        );
        expect(run.status, `the maker dry run exits 0: ${run.stderr.slice(-1000)}`).toBe(0);
        const printed = run.stdout.trim().split('\n').filter((line) => line.length > 0);
        expect(printed.length, 'the maker prints its four outputs').toBe(4);
    }, 300_000);
});

describe('F10: the card kit maker reads the card picture lists of units 1 to N in order', () => {
    /** A temp storytime tree with a unit 1 list, an optional unit 2 list, and unit 3 and 4 lists. */
    function cardTree(withMiddle: boolean): string {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u2r5cards-'));
        tempRoots.push(root);
        const print = path.join(root, 'content', 'storytime', 'l2', 'print');
        fs.mkdirSync(path.join(print, 'u3'), { recursive: true });
        fs.mkdirSync(path.join(print, 'u4'), { recursive: true });
        const unit1 = readJson(path.join(storytimeRoot, 'l2', 'print', 'pictures.json')) as { id: string }[];
        fs.writeFileSync(path.join(print, 'pictures.json'), JSON.stringify(unit1));
        if (withMiddle) {
            fs.mkdirSync(path.join(print, 'u2'), { recursive: true });
            fs.writeFileSync(
                path.join(print, 'u2', 'pictures.json'),
                JSON.stringify([{ id: 'l2-w09-card-nod', use: 'card', week: 9 }]),
            );
        }
        fs.writeFileSync(
            path.join(print, 'u3', 'pictures.json'),
            JSON.stringify([{ id: 'l2-w17-card-quokka', use: 'card', week: 17 }]),
        );
        fs.writeFileSync(
            path.join(print, 'u4', 'pictures.json'),
            JSON.stringify([{ id: 'l2-w18-card-zebra', use: 'card', week: 18 }]),
        );
        return root;
    }

    /**
     * Calls the row loader of the card kit maker on the temp tree, in unit order.
     * Fails while the maker keeps its row loader private to the unit 1 plus
     * requested-unit lists; passes once the maker exposes it and reads units 1
     * through N in order with an absent intermediate file as an empty list.
     */
    async function makerRowIds(tempRepoRoot: string, unit: number): Promise<string[]> {
        const saved = process.env.WORKBOOKS_ROOT;
        process.env.WORKBOOKS_ROOT = tempRepoRoot;
        vi.resetModules();
        try {
            const maker = (await import('../scripts/storytime/make-card-kit-pdf')) as unknown as {
                readPictureRows?: (...args: never[]) => { id: string }[];
            };
            const loader = maker.readPictureRows;
            expect(typeof loader, 'the card kit maker exposes its row loader for units 1 to N').toBe('function');
            const files = (await import('../lib/storytime/files')) as unknown as { STORYTIME_ROOT: string };
            const rows = (loader as unknown as (...args: unknown[]) => { id: string }[]).length >= 3
                ? (loader as unknown as (root: string, level: number, unit: number) => { id: string }[])(
                    files.STORYTIME_ROOT,
                    2,
                    unit,
                )
                : (loader as unknown as (level: number, unit: number) => { id: string }[])(2, unit);
            return rows.map((row) => row.id);
        } finally {
            if (saved === undefined) delete process.env.WORKBOOKS_ROOT;
            else process.env.WORKBOOKS_ROOT = saved;
            vi.resetModules();
        }
    }

    it('unit 3 reads units 1 and 3 with an absent middle file as an empty list', async () => {
        const root = cardTree(false);
        const unit1 = (readJson(path.join(storytimeRoot, 'l2', 'print', 'pictures.json')) as { id: string }[]).map(
            (row) => row.id,
        );
        const ids = await makerRowIds(root, 3);
        expect(ids.slice(0, unit1.length), 'unit 1 rows first').toEqual(unit1);
        expect(ids, 'the unit 3 rows follow the unit 1 rows').toEqual([...unit1, 'l2-w17-card-quokka']);
    }, 300_000);

    it('unit 4 reads every earlier unit list in order', async () => {
        const root = cardTree(true);
        const unit1 = (readJson(path.join(storytimeRoot, 'l2', 'print', 'pictures.json')) as { id: string }[]).map(
            (row) => row.id,
        );
        const ids = await makerRowIds(root, 4);
        expect(ids, 'units 1 to 4 in order').toEqual([...unit1, 'l2-w09-card-nod', 'l2-w17-card-quokka', 'l2-w18-card-zebra']);
    }, 300_000);
});

describe('F9: the unit 1 snapshot hashes the maker production inputs', () => {
    /** The enriched unit 1 snapshot: the teacher pages with the student-book pages, the card art with the resolved pictures, and the maker file names. */
    function enrichedSnapshot(): {
        weeks: string;
        teacherBadge: string;
        pagesMatter: string;
        picturesMatter: string;
        teacherPages: string;
        cardA6: string;
        names: string;
    } {
        const all = readLevelWeeks(storytimeRoot, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
        const weeks = all.filter((week) => week.meta.unit === 1);
        const pages = storytimeStudentBookPages(weeks);
        const teacherPages = compileStorytimeManual(weeks, { lang: 'th', paper: 'a4', loops: true, studentBookPages: pages }).html;
        const teacherPlain = compileStorytimeManual(weeks, { lang: 'th', paper: 'a4', loops: true }).html;
        const rows = [
            ...storytimePrintPictures(weeks),
            ...storytimeCardPictureRows(readUnitCardPictures(storytimeRoot, 2, 1), 2),
        ];
        const delivered = new Set(rows.map((row) => row.id));
        const pictureOf = (card: StorytimeCard): string | undefined => {
            const row = storytimeCardPictureRow(card, rows, delivered);
            return row ? `row:${row.id}` : undefined;
        };
        const names = storytimeCardKitFileNames(2, 1, 1);
        const kit = storytimeCardKit(weeks);
        const cardA6 = compileStorytimeCardSheet(kit.cards, 'A6', { pictureOf, title: storytimeCardKitTitle(2, 1, 'A6') }).html;
        const cardA6Plain = compileStorytimeCardSheet(kit.cards, 'A6', { title: storytimeCardKitTitle(2, 1, 'A6') }).html;
        const sha = (value: string): string => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
        return {
            weeks: weeks.map((week) => String(week.meta.week)).join(','),
            teacherBadge: teacherPages.includes('data-part="step-badge"') ? 'yes' : 'no',
            pagesMatter: teacherPages === teacherPlain ? 'no' : 'yes',
            picturesMatter: cardA6 === cardA6Plain ? 'no' : 'yes',
            teacherPages: `ok:${sha(teacherPages)}`,
            cardA6: `ok:${sha(names.a6 + cardA6)}`,
            names: `ok:${sha(JSON.stringify(names))}`,
        };
    }

    it('the teacher hash covers studentBookPages and the card hash covers pictureOf', () => {
        const snap = enrichedSnapshot();
        expect(snap.weeks, 'the snapshot filters to unit 1').toBe('1,2,3,4,5,6,7,8');
        expect(snap.teacherBadge, 'the teacher pages carry the student-book badge').toBe('yes');
        expect(snap.pagesMatter, 'studentBookPages change the teacher hash').toBe('yes');
        expect(snap.picturesMatter, 'pictureOf changes the card hash').toBe('yes');
        expect(enrichedSnapshot(), 'the enriched snapshot is deterministic').toEqual(snap);
    }, 300_000);
});

describe('F13: print-pictures on a stage root never pulls card rows from the live repository', () => {
    it('an empty unit 2 card file writes no card rows', () => {
        const root = mirrorWithCardInput([]);
        const run = runMaker('scripts/storytime/print-pictures.ts', ['--level', '2'], root);
        expect(run.status, `print-pictures exits 0: ${run.stderr.slice(-1000)}`).toBe(0);
        const written = readJson(path.join(root, 'content', 'storytime', 'l2', 'print', 'u2', 'pictures.json')) as { use: string }[];
        expect(written.length, 'only the 193 book rows').toBe(193);
        expect(written.filter((row) => row.use === 'card').length, 'no card rows from the live repository').toBe(0);
    }, 300_000);
});

describe('F14: set-book-pictures of a unit 2 week reads the unit 2 picture list', () => {
    it('week 9 takes its rows from l2/print/u2/pictures.json on a temp root copy', () => {
        const root = mirrorWithCardInput(readJson(path.join(storytimeRoot, 'l2', 'print', 'u2', 'card-pictures.json')));
        const weekFile = path.join(root, 'content', 'storytime', 'l2', 'w09.json');
        fs.rmSync(weekFile, { force: true });
        fs.copyFileSync(path.join(storytimeRoot, 'l2', 'w09.json'), weekFile);
        const run = runMaker('scripts/storytime/set-book-pictures.ts', ['--level', '2', '--week', '9'], root);
        expect(run.status, `set-book-pictures exits 0: ${run.stderr.slice(-2000)}`).toBe(0);
        const updated = fs.readFileSync(weekFile, 'utf8');
        expect(updated, 'the week 9 pictures point at the unit 2 media').toContain('"file": "l2/media/w09/books/');
        const provenance = path.join(root, 'content', 'storytime', 'l2', 'media', 'w09', 'books', 'pictures.sha256');
        expect(fs.existsSync(provenance), 'the provenance file is written').toBe(true);
    }, 300_000);
});
