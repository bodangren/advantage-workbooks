// @vitest-environment node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as checksModule from '../lib/storytime/checks';
import { checkStorytimeWeek, taughtTo } from '../lib/storytime/checks';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import {
    LOOP_STEP_IDS,
    REVIEW_WEEK,
    SAMPLE_DRILLS,
    SAMPLE_RECALL,
    SAMPLE_SOUND_LOOP,
    TEACH_WEEKS,
    questionsFor,
    sampleLoopMinutes,
    sampleSightWords,
    type SampleBlendDrill,
    type SampleQuestion,
} from './fixtures/storytime-loops-sample';

// Phase 1 Red 2 of track storytime_teaching_loops_20261103 (FR-2 to FR-8): the six loop checks of
// `checkStorytimeWeek`. The test loads a shipped week as the base (rule 11.3), removes the FR-1 fields,
// and writes the sample routines of `fixtures/storytime-loops-sample.ts`. It never edits a shipped file.
//
// Red notes: `LOOP_CHECK_STATUS` and the six checks do not exist at HEAD. The constant is reached
// through a namespace import with a cast, so a missing export is a failed assertion and not a type
// error (F11). The six ids do not exist, so each `Missing check:` assertion fails.
//
// The checks own no shipped file write: every data mutant runs on a copy of a week file. The test
// writes each copy into a folder from `fs.mkdtemp` (plan line 84), reads it back, and removes the
// folder after the run. A guard test proves that every shipped week file stays unchanged.

type PackageReport = ReturnType<typeof checkStorytimeWeek>;
type RawWeek = any;

/** The six loop check ids (FR-8). */
const LOOP_IDS = ['loops-blend', 'loops-sound', 'loops-sight', 'loops-questions', 'loops-recall', 'loops-minutes'];

/** The five checks whose routine is missing on a shipped week. */
const ROUTINE_IDS = ['loops-blend', 'loops-sound', 'loops-sight', 'loops-questions', 'loops-recall'];

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** The raw JSON of a shipped Level 2 week. */
function shippedWeek(week: number): RawWeek {
    return JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), 'utf8'));
}

/** The FR-1 fields that Phase 3 adds to the shipped weeks: removed, so the base is stable. */
function stripLoops(raw: RawWeek): RawWeek {
    for (const script of raw.scripts) {
        delete script.recall;
        for (const step of script.steps) {
            delete step.blendDrill;
            delete step.soundLoop;
            delete step.sightWords;
            delete step.loopMinutes;
        }
    }
    for (const book of raw.books ?? []) delete book.questions;
    if (raw.approval) delete raw.approval.loops;
    return raw;
}

function stepById(raw: RawWeek, scriptId: string, stepId: string): RawWeek {
    return raw.scripts.find((s: RawWeek) => s.id === scriptId).steps.find((st: RawWeek) => st.id === stepId);
}

function readAlongOf(raw: RawWeek): RawWeek | undefined {
    return (raw.books ?? []).find((b: RawWeek) => b.kind === 'readalong');
}

function scriptOfDay(raw: RawWeek, day: number): RawWeek {
    return raw.scripts.find((s: RawWeek) => s.day === day);
}

function applyRecall(raw: RawWeek, week: number): void {
    for (const script of raw.scripts) {
        // Day 1 of week 1 has no card to recall (spec D6).
        if (week === 1 && script.day === 1) continue;
        script.recall = copy(SAMPLE_RECALL[week]);
    }
}

/** The routines of a teach week: the drill, the loops, the sight words, the questions, the minutes. */
function applyRoutines(raw: RawWeek, week: number): void {
    for (const id of ['A1', 'A2', 'A3']) stepById(raw, 'A', id).soundLoop = copy(SAMPLE_SOUND_LOOP);
    stepById(raw, 'A', 'A4').blendDrill = copy(SAMPLE_DRILLS[week]);
    const tricky: string[] = raw.focus.trickyWords ?? [];
    stepById(raw, 'A', 'A6').sightWords = sampleSightWords(tricky);
    stepById(raw, 'D', 'D2').sightWords = sampleSightWords(tricky);
    const book = readAlongOf(raw);
    if (book) book.questions = questionsFor(week, book.pages.map((p: RawWeek) => p.text));
    for (const script of raw.scripts) {
        for (const step of script.steps) {
            if ((LOOP_STEP_IDS as readonly string[]).includes(step.id)) step.loopMinutes = sampleLoopMinutes(step.id, step.minutes);
        }
    }
    applyRecall(raw, week);
}

/** A loop-complete copy of a shipped week: the FR-1 fields removed, then the sample written. */
function loopComplete(week: number): RawWeek {
    const raw = stripLoops(shippedWeek(week));
    if (week === REVIEW_WEEK) applyRecall(raw, week);
    else applyRoutines(raw, week);
    return raw;
}

/** The sample weeks, parsed: the `taught` set and the `others` argument of the recall check. */
let knownCache: StorytimeWeek[] | undefined;
function known(): StorytimeWeek[] {
    knownCache ??= Array.from({ length: 8 }, (_, i) => StorytimeWeekSchema.parse(loopComplete(i + 1)));
    return knownCache;
}

/** The temporary folder of the copy files (plan line 84). It is removed after the run. */
let tempDir = '';
let copyCount = 0;

beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-loops-'));
});

afterAll(() => {
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

/** The SHA-256 of each shipped week file, at the start of the run. */
const SHIPPED_HASHES = new Map<number, string>(
    Array.from({ length: 8 }, (_, i) => {
        const week = i + 1;
        const hash = createHash('sha256').update(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week))).digest('hex');
        return [week, hash] as [number, string];
    }),
);

/** The report of a raw week, from its copy file in the temporary folder. */
function reportFor(raw: RawWeek): PackageReport {
    const file = path.join(tempDir, `copy-${++copyCount}.json`);
    fs.writeFileSync(file, JSON.stringify(raw));
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    const parsed = StorytimeWeekSchema.parse(stored);
    return checkStorytimeWeek(stored, taughtTo(known(), parsed), undefined, known());
}

/** `LOOP_CHECK_STATUS`, reached through a namespace import so a missing export is an assertion. */
function loopStatus(): string {
    const mod = checksModule as unknown as Record<string, unknown>;
    const value = mod.LOOP_CHECK_STATUS;
    expect(value, 'Missing export: LOOP_CHECK_STATUS').toBeDefined();
    return value as string;
}

function check(report: PackageReport, id: string, where = ''): RawWeek {
    const found = report.checks.find((c) => c.id === id);
    expect(found, `Missing check: ${id}${where ? ` (${where})` : ''}`).toBeDefined();
    return found!;
}

/** The check passes. */
function expectPass(report: PackageReport, id: string, where = ''): void {
    expect(check(report, id, where).status, `${id} passes${where ? ` on ${where}` : ''}`).toBe('pass');
}

/** The check reports a problem with the status of `LOOP_CHECK_STATUS` and a detail (Q10). */
function expectProblem(report: PackageReport, id: string, where = ''): void {
    const found = check(report, id, where);
    expect(found.status, `${id} reports${where ? ` on ${where}` : ''}`).toBe(loopStatus());
    expect(found.status, `${id} does not pass`).not.toBe('pass');
    expect(typeof found.detail, `${id} names the problem`).toBe('string');
    expect((found.detail ?? '').length, `${id} names the problem`).toBeGreaterThan(0);
}

/** The sorted loop ids of a report. */
function loopIds(report: PackageReport): string[] {
    return report.checks.map((c) => c.id).filter((id) => id.startsWith('loops-')).sort();
}

function setRecall(raw: RawWeek, day: number, items: unknown[] | null): void {
    const script = scriptOfDay(raw, day);
    if (items === null) {
        delete script.recall;
        return;
    }
    script.recall = { items: copy(items), ask: copy(SAMPLE_RECALL[1].ask) };
}

function recallItems(raw: RawWeek, day: number): RawWeek[] {
    return copy(scriptOfDay(raw, day).recall.items);
}

function setDrill(raw: RawWeek, scriptId: string, stepId: string, drill: SampleBlendDrill | null): void {
    const step = stepById(raw, scriptId, stepId);
    if (drill === null) delete step.blendDrill;
    else step.blendDrill = copy(drill);
}

function setSight(raw: RawWeek, scriptId: string, stepId: string, sight: unknown | null): void {
    const step = stepById(raw, scriptId, stepId);
    if (sight === null) delete step.sightWords;
    else step.sightWords = copy(sight);
}

function setQuestions(raw: RawWeek, questions: SampleQuestion[] | null): void {
    const book = readAlongOf(raw);
    if (!book) throw new Error('the week has no read-along');
    if (questions === null) delete book.questions;
    else book.questions = copy(questions);
}

/** A Level 1 copy of week 1: the script ids L to P, and no decodable (design §3.4). */
function levelOneCopy(): RawWeek {
    const raw = loopComplete(1);
    raw.meta.level = 1;
    raw.meta.key = 'st1/1';
    raw.books = raw.books.filter((b: RawWeek) => b.kind !== 'decodable');
    const ids = ['L', 'M', 'S', 'V', 'P'];
    raw.scripts.forEach((script: RawWeek, i: number) => {
        script.id = ids[i];
        for (const step of script.steps) step.id = step.id.replace(/^[A-Z]/, ids[i]);
    });
    return raw;
}

/**
 * Adds minutes to the steps of a day that are not moved and not loop steps, until the day sums to the period
 * (FR-7). A step takes 20 minutes at most.
 * @param script The day to pad, changed in place.
 * @param period The `periodMinutes` of the level.
 * @param opening The `openingMinutes` of the level.
 */
function padLevelThreeDay(script: RawWeek, period: number, opening: number): void {
    const total = (): number =>
        opening + script.steps.filter((st: RawWeek) => !st.moved).reduce((n: number, st: RawWeek) => n + (st.loopMinutes ?? st.minutes), 0);
    for (const step of script.steps) {
        if (step.moved || (LOOP_STEP_IDS as readonly string[]).includes(step.id)) continue;
        const missing = period - total();
        if (missing <= 0) break;
        step.minutes = Math.min(20, step.minutes + missing);
    }
}

/** A Level 3 copy of a teach week with the period of 49 minutes and the given loop minutes. */
function levelThreeCopy(week: number, loopMinutes: Record<string, number>): RawWeek {
    const raw = loopComplete(week);
    raw.meta.level = 3;
    raw.meta.key = `st3/${week}`;
    raw.meta.periodMinutes = 49;
    raw.meta.openingMinutes = 8;
    // Days B to E take the extra minutes, so each day sums to 49 (FR-7). Day A keeps the cases apart.
    for (const script of raw.scripts) if (script.id !== 'A') padLevelThreeDay(script, 49, 8);
    const scriptOf = (id: string) => (id.startsWith('C') ? 'C' : id.startsWith('D') ? 'D' : 'A');
    for (const [id, value] of Object.entries(loopMinutes)) stepById(raw, scriptOf(id), id).loopMinutes = value;
    return raw;
}

describe('the loop-complete copy of the teach weeks', () => {
    it('parses, and passes the six loop checks on w01 to w07', () => {
        for (const week of TEACH_WEEKS) {
            const raw = loopComplete(week);
            expect(StorytimeWeekSchema.safeParse(raw).success, `w0${week} copy parses`).toBe(true);
            const report = reportFor(raw);
            for (const id of LOOP_IDS) expectPass(report, id, `w0${week}`);
        }
    });

    it('passes loops-recall and loops-minutes on the review week w08, and runs no other loop check', () => {
        const report = reportFor(loopComplete(REVIEW_WEEK));
        expect(loopIds(report)).toEqual(['loops-minutes', 'loops-recall']);
        expectPass(report, 'loops-recall', 'w08');
        expectPass(report, 'loops-minutes', 'w08');
    });

    it('runs no loop check on a Level 1 week', () => {
        const report = reportFor(levelOneCopy());
        expect(loopIds(report)).toEqual([]);
    });
});

describe('loops-blend', () => {
    it('reports a teach week without blendDrill on A4, and a drill on A3 does not count', () => {
        const missing = loopComplete(1);
        setDrill(missing, 'A', 'A4', null);
        expectProblem(reportFor(missing), 'loops-blend', 'A4 without the drill');

        const moved = loopComplete(1);
        const drill = SAMPLE_DRILLS[1];
        setDrill(moved, 'A', 'A4', null);
        setDrill(moved, 'A', 'A3', drill);
        expectProblem(reportFor(moved), 'loops-blend', 'a drill on A3');
    });

    it('reports a drill word with a sound that the week did not teach and the opening does not name', () => {
        const raw = loopComplete(1);
        const drill = copy(SAMPLE_DRILLS[1]);
        drill.words[0] = { word: 'zip', sounds: ['/z/', '/i/', '/p/'] };
        setDrill(raw, 'A', 'A4', drill);
        expectProblem(reportFor(raw), 'loops-blend', 'an untaught /z/');
    });

    it('passes oral-base sounds of the opening in w01 (Q1)', () => {
        // net, nut, and pen use /e/, /u/, /t/, and /p/ from `opening.pa`; only /n/ is taught.
        expectPass(reportFor(loopComplete(1)), 'loops-blend', 'the w01 oral drill');
    });

    it('passes a taught sound that the opening does not name, and the bank alias of a label', () => {
        const taughtOnly = loopComplete(5);
        const drill = copy(SAMPLE_DRILLS[5]);
        drill.words = [
            { word: 'pot', sounds: ['/p/', '/o/', '/t/'] },
            { word: 'pin', sounds: ['/p/', '/i/', '/n/'] },
            { word: 'mop', sounds: ['/m/', '/o/', '/p/'] },
        ];
        setDrill(taughtOnly, 'A', 'A4', drill);
        expectPass(reportFor(taughtOnly), 'loops-blend', 'taught /p/ in w05');

        const alias = loopComplete(1);
        const aliasDrill = copy(SAMPLE_DRILLS[1]);
        aliasDrill.words[0] = { word: 'net', sounds: ['Nnn', '/e/', '/t/'] };
        setDrill(alias, 'A', 'A4', aliasDrill);
        expectPass(reportFor(alias), 'loops-blend', 'the held sound Nnn');
    });
});

describe('loops-sound', () => {
    it('reports a missing soundLoop on A1, on A2, and on A3', () => {
        for (const id of ['A1', 'A2', 'A3']) {
            const raw = loopComplete(2);
            delete stepById(raw, 'A', id).soundLoop;
            expectProblem(reportFor(raw), 'loops-sound', `A without ${id}`);
        }
    });
});

describe('loops-sight', () => {
    it('reports a missing sightWords on A6 and on D2', () => {
        const noA6 = loopComplete(2);
        setSight(noA6, 'A', 'A6', null);
        expectProblem(reportFor(noA6), 'loops-sight', 'A6 without the step');

        const noD2 = loopComplete(2);
        setSight(noD2, 'D', 'D2', null);
        expectProblem(reportFor(noD2), 'loops-sight', 'D2 without the step');
    });

    it('reports words in another order than focus.trickyWords', () => {
        const raw = loopComplete(2);
        const sight = sampleSightWords(['in', 'on', 'I']);
        setSight(raw, 'A', 'A6', sight);
        setSight(raw, 'D', 'D2', sight);
        expectProblem(reportFor(raw), 'loops-sight', 'the reversed order');
    });

    it('reports sightWords on a week without tricky words, and passes when both are absent', () => {
        const withSight = loopComplete(2);
        withSight.focus.trickyWords = [];
        expectProblem(reportFor(withSight), 'loops-sight', 'no tricky words but sightWords');

        const without = loopComplete(2);
        without.focus.trickyWords = [];
        setSight(without, 'A', 'A6', null);
        setSight(without, 'D', 'D2', null);
        expectPass(reportFor(without), 'loops-sight', 'no tricky words and no sightWords');
    });
});

describe('loops-questions', () => {
    it('reports a read-along without questions and the order what, who, where', () => {
        const missing = loopComplete(2);
        setQuestions(missing, null);
        expectProblem(reportFor(missing), 'loops-questions', 'no questions');

        const wrongOrder = loopComplete(2);
        const questions = questionsFor(2, []);
        const swapped = [questions[0], questions[1], questions[2]];
        swapped[0].kind = 'what';
        swapped[1].kind = 'who';
        setQuestions(wrongOrder, swapped);
        expectProblem(reportFor(wrongOrder), 'loops-questions', 'the order what, who, where');
    });

    it('reports page 0 and a page past the last page, and passes page 1 and the last page', () => {
        const zero = loopComplete(2);
        const q0 = questionsFor(2, []);
        q0[1].answer = { page: 0, word: 'kites' };
        setQuestions(zero, q0);
        expectProblem(reportFor(zero), 'loops-questions', 'page 0');

        const past = loopComplete(2);
        const qPast = questionsFor(2, []);
        qPast[1].answer = { page: 9, word: 'kites' };
        setQuestions(past, qPast);
        expectProblem(reportFor(past), 'loops-questions', 'page 9 of 8');

        const edges = loopComplete(2);
        const qEdge = questionsFor(2, []);
        qEdge[1].answer = { page: 1, word: 'suns' };
        qEdge[2].answer = { page: 8, word: 'Pip' };
        setQuestions(edges, qEdge);
        expectPass(reportFor(edges), 'loops-questions', 'page 1 and page 8');
    });

    it('reads the answer page as pages[answer.page - 1] (G4: page 2 passes, page 3 fails)', () => {
        // "kites" is only on reader page 2. A 0-based reader (pages[answer.page]) reads page 3.
        const onPageTwo = loopComplete(2);
        const pass = questionsFor(2, []);
        pass[0].answer = { page: 2, word: 'kites' };
        setQuestions(onPageTwo, pass);
        expectPass(reportFor(onPageTwo), 'loops-questions', 'kites on page 2');

        const onPageThree = loopComplete(2);
        const fail = questionsFor(2, []);
        fail[0].answer = { page: 3, word: 'kites' };
        setQuestions(onPageThree, fail);
        expectProblem(reportFor(onPageThree), 'loops-questions', 'kites with page 3');
    });

    it('reports a word that the page does not hold, and a substring of a word on the page', () => {
        const absent = loopComplete(2);
        const qAbsent = questionsFor(2, []);
        qAbsent[1].answer = { page: 2, word: 'bicycle' };
        setQuestions(absent, qAbsent);
        expectProblem(reportFor(absent), 'loops-questions', 'a word that is not on the page');

        const substring = loopComplete(2);
        readAlongOf(substring)!.pages[1].text = 'A catch.';
        const qSub = questionsFor(2, []);
        qSub[1].answer = { page: 2, word: 'cat' };
        setQuestions(substring, qSub);
        expectProblem(reportFor(substring), 'loops-questions', 'cat against catch');
    });
});

describe('loops-recall', () => {
    it('reports 4 and 6 items, and passes 5', () => {
        const four = loopComplete(1);
        setRecall(four, 2, recallItems(four, 2).slice(0, 4));
        expectProblem(reportFor(four), 'loops-recall', '4 items');

        const six = loopComplete(1);
        setRecall(six, 2, [...recallItems(six, 2), { kind: 'word', text: 'cat', week: 1 }]);
        expectProblem(reportFor(six), 'loops-recall', '6 items');

        expectPass(reportFor(loopComplete(1)), 'loops-recall', '5 items');
    });

    it('keeps the count rule when the taught set and the other weeks are not given (Q4)', () => {
        const four = loopComplete(1);
        setRecall(four, 2, recallItems(four, 2).slice(0, 4));
        expectProblem(checkStorytimeWeek(four), 'loops-recall', '4 items without taught');
    });

    it('reports a repeated item in one day, and passes the same item on two days', () => {
        const repeated = loopComplete(1);
        const items = recallItems(repeated, 2);
        items[1] = copy(items[0]);
        setRecall(repeated, 2, items);
        expectProblem(reportFor(repeated), 'loops-recall', 'a repeated item on day 2');

        const twoDays = loopComplete(1);
        setRecall(twoDays, 3, recallItems(twoDays, 2));
        expectPass(reportFor(twoDays), 'loops-recall', 'the same items on days 2 and 3');
    });

    it('reports an item of a later week, and passes an item of the file week', () => {
        const later = loopComplete(1);
        const items = recallItems(later, 2);
        items[0].week = 3;
        setRecall(later, 2, items);
        expectProblem(reportFor(later), 'loops-recall', 'a week 3 item in w01');

        const ownWeek = loopComplete(2);
        const own = recallItems(ownWeek, 2);
        own[0].week = 2;
        setRecall(ownWeek, 2, own);
        expectPass(reportFor(ownWeek), 'loops-recall', 'an item of the file week');
    });

    it('checks a sound and a tricky card against the taught set', () => {
        const soundOut = loopComplete(1);
        const soundItems = recallItems(soundOut, 2);
        soundItems[0] = { kind: 'sound', text: 'z', week: 1 };
        setRecall(soundOut, 2, soundItems);
        expectProblem(reportFor(soundOut), 'loops-recall', 'the untaught sound z');

        const soundIn = loopComplete(2);
        const soundOk = recallItems(soundIn, 2);
        soundOk[0] = { kind: 'sound', text: 'n', week: 1 };
        setRecall(soundIn, 2, soundOk);
        expectPass(reportFor(soundIn), 'loops-recall', 'the taught sound n in w02');

        const trickyOut = loopComplete(1);
        const trickyItems = recallItems(trickyOut, 2);
        trickyItems[1] = { kind: 'tricky', text: 'was', week: 1 };
        setRecall(trickyOut, 2, trickyItems);
        expectProblem(reportFor(trickyOut), 'loops-recall', 'the untaught tricky word was');

        const trickyIn = loopComplete(1);
        const trickyOk = recallItems(trickyIn, 2);
        trickyOk[1] = { kind: 'tricky', text: 'can', week: 1 };
        trickyOk[3] = { kind: 'tricky', text: 'a', week: 1 };
        setRecall(trickyIn, 2, trickyOk);
        expectPass(reportFor(trickyIn), 'loops-recall', 'the taught tricky word can');
    });

    it('checks a frame card against the frame of this week and of an earlier week', () => {
        const laterFrame = loopComplete(1);
        const items = recallItems(laterFrame, 2);
        items[4] = { kind: 'frame', text: 'It is ___.', week: 3 };
        setRecall(laterFrame, 2, items);
        expectProblem(reportFor(laterFrame), 'loops-recall', 'the frame of w03 in w01');

        expectPass(reportFor(loopComplete(1)), 'loops-recall', 'the frame of this week');

        const earlierFrame = loopComplete(2);
        const earlier = recallItems(earlierFrame, 2);
        earlier[4] = { kind: 'frame', text: 'Hello, I am ___.', week: 1 };
        setRecall(earlierFrame, 2, earlier);
        expectPass(reportFor(earlierFrame), 'loops-recall', 'the frame of w01 in w02');
    });

    it('checks a word card against the text of earlier days and earlier weeks', () => {
        const earlierDay = loopComplete(1);
        const earlierItems = recallItems(earlierDay, 2);
        earlierItems[4] = { kind: 'word', text: 'cat', week: 1 };
        setRecall(earlierDay, 2, earlierItems);
        expectPass(reportFor(earlierDay), 'loops-recall', 'cat from day 1');

        const laterDay = loopComplete(1);
        const laterItems = recallItems(laterDay, 2);
        laterItems[4] = { kind: 'word', text: 'bird', week: 1 };
        setRecall(laterDay, 2, laterItems);
        expectProblem(reportFor(laterDay), 'loops-recall', 'bird from a later day');

        const pageOnly = loopComplete(1);
        const pageItems = recallItems(pageOnly, 2);
        pageItems[4] = { kind: 'word', text: 'neck', week: 1 };
        setRecall(pageOnly, 2, pageItems);
        expectProblem(reportFor(pageOnly), 'loops-recall', 'neck from a reader page only');

        const sameDay = loopComplete(1);
        const sameItems = recallItems(sameDay, 2);
        sameItems[4] = { kind: 'word', text: 'puppy', week: 1 };
        setRecall(sameDay, 2, sameItems);
        expectProblem(reportFor(sameDay), 'loops-recall', 'puppy from the same day');

        const earlierWeek = loopComplete(2);
        const weekItems = recallItems(earlierWeek, 1);
        weekItems[4] = { kind: 'word', text: 'hello', week: 1 };
        setRecall(earlierWeek, 1, weekItems);
        expectPass(reportFor(earlierWeek), 'loops-recall', 'hello from w01');
    });

    it('applies the day 1 exception of week 1 and checks a recall that is present on that day', () => {
        expectPass(reportFor(loopComplete(1)), 'loops-recall', 'w01 day 1 without a recall');

        const dayTwo = loopComplete(1);
        setRecall(dayTwo, 2, null);
        expectProblem(reportFor(dayTwo), 'loops-recall', 'w01 day 2 without a recall');

        const weekTwo = loopComplete(2);
        setRecall(weekTwo, 1, null);
        expectProblem(reportFor(weekTwo), 'loops-recall', 'w02 day 1 without a recall');

        const dayOnePresent = loopComplete(1);
        setRecall(dayOnePresent, 1, SAMPLE_RECALL[1].items);
        expectPass(reportFor(dayOnePresent), 'loops-recall', 'w01 day 1 with 5 items');

        const dayOneShort = loopComplete(1);
        setRecall(dayOneShort, 1, SAMPLE_RECALL[1].items.slice(0, 4));
        expectProblem(reportFor(dayOneShort), 'loops-recall', 'w01 day 1 with 4 items');
    });
});

describe('loops-minutes', () => {
    it('passes a Level 2 week whose day sums to 30, and reports 29 and 31', () => {
        expectPass(reportFor(loopComplete(2)), 'loops-minutes', 'the sample of w02');

        const low = loopComplete(2);
        stepById(low, 'A', 'A1').loopMinutes = 3;
        expectProblem(reportFor(low), 'loops-minutes', 'a day sum of 29');

        const high = loopComplete(2);
        stepById(high, 'A', 'A1').loopMinutes = 5;
        expectProblem(reportFor(high), 'loops-minutes', 'a day sum of 31');
    });

    it('passes a Level 3 week with periodMinutes 49 and a sum of 49, and reports 30 and 48', () => {
        const pass = levelThreeCopy(2, { A1: 8, A2: 8, A3: 8, A4: 8, A6: 7 });
        expectPass(reportFor(pass), 'loops-minutes', 'a Level 3 sum of 49');

        const thirty = levelThreeCopy(2, { A1: 6, A2: 4, A3: 4, A4: 4, A6: 2 });
        expectProblem(reportFor(thirty), 'loops-minutes', 'a Level 3 sum of 30');

        const fortyEight = levelThreeCopy(2, { A1: 8, A2: 8, A3: 8, A4: 8, A6: 6 });
        expectProblem(reportFor(fortyEight), 'loops-minutes', 'a Level 3 sum of 48');
    });

    it('does not count a moved step', () => {
        const raw = loopComplete(2);
        stepById(raw, 'A', 'A7').minutes = 5;
        expectPass(reportFor(raw), 'loops-minutes', 'a moved step with 5 minutes');
    });

    it('reports loopMinutes that differs from minutes on a step that is not a loop step, and passes an equal one', () => {
        const differ = loopComplete(2);
        stepById(differ, 'B', 'B2').loopMinutes = 3;
        expectProblem(reportFor(differ), 'loops-minutes', 'B2 with 3 of 4 minutes');

        const equal = loopComplete(2);
        stepById(equal, 'B', 'B2').loopMinutes = 4;
        expectPass(reportFor(equal), 'loops-minutes', 'B2 with 4 of 4 minutes');
    });

    it('reports a loop step with 1 minute and passes one with 2', () => {
        const one = loopComplete(2);
        stepById(one, 'A', 'A3').loopMinutes = 1;
        stepById(one, 'A', 'A4').loopMinutes = 9;
        expectProblem(reportFor(one), 'loops-minutes', 'A3 with 1 minute');

        const two = loopComplete(2);
        stepById(two, 'A', 'A3').loopMinutes = 2;
        stepById(two, 'A', 'A4').loopMinutes = 8;
        expectPass(reportFor(two), 'loops-minutes', 'A3 with 2 minutes');
    });
});

describe('the status of the loop checks (Q10)', () => {
    it('exports LOOP_CHECK_STATUS with the status of a problem, and not a pass', () => {
        const status = loopStatus();
        expect(['warn', 'fail']).toContain(status);
        expect(status).not.toBe('pass');
    });

    it('gives each problem of a shipped teach week the status LOOP_CHECK_STATUS', () => {
        const status = loopStatus();
        for (const week of TEACH_WEEKS) {
            const report = reportFor(stripLoops(shippedWeek(week)));
            for (const id of ROUTINE_IDS) expectProblem(report, id, `the shipped w0${week}`);
            // A shipped week sums to periodMinutes with `minutes`, so this check passes or reports the
            // missing minute budget. It never passes with a hard-coded status (Q10).
            const minutes = check(report, 'loops-minutes', `the shipped w0${week}`).status;
            expect(['pass', status], `loops-minutes on the shipped w0${week}`).toContain(minutes);
        }
    });

    it('reports the missing recall of the shipped review week w08', () => {
        const report = reportFor(stripLoops(shippedWeek(REVIEW_WEEK)));
        expect(loopIds(report)).toEqual(['loops-minutes', 'loops-recall']);
        expectProblem(report, 'loops-recall', 'the shipped w08');
    });
});

// Phase 3 Red 4 (orchestrator decision, 2026-11-04): a loop part that could not be tested (no taught set, no other
// weeks) reports `warn` at any `LOOP_CHECK_STATUS`, as the `decodable` check does without a level. It never passes.
// A real problem keeps the status `LOOP_CHECK_STATUS`. The helper `loopCheck` is exported with an optional status
// argument, so that the test can set the status `fail` without an edit of the source file.
type LoopCheckFn = (id: string, label: string, problems: string[], skipped?: string[], status?: string) => { id: string; label: string; status: string; detail?: string };

/** `loopCheck`, reached through a namespace import so that a missing export is a failed assertion. */
function loopCheckFn(): LoopCheckFn {
    const fn = (checksModule as unknown as Record<string, unknown>).loopCheck;
    expect(typeof fn, 'Missing export: loopCheck').toBe('function');
    return fn as LoopCheckFn;
}

describe('an unchecked loop part warns', () => {
    it('gives a part that could not be tested the status warn at the status fail, with the "not checked" label', () => {
        const result = loopCheckFn()('loops-blend', 'A4 has a blend drill', [], ['the drill sounds, because the taught set is not given'], 'fail');
        expect(result.status).toBe('warn');
        expect(result.label).toContain('not checked');
        expect(result.detail ?? '').toContain('not checked');
    });

    it('gives a real problem the given status, even when a part was also not checked', () => {
        const result = loopCheckFn()('loops-blend', 'A4 has a blend drill', ['A4 has no blendDrill'], ['the drill sounds'], 'fail');
        expect(result.status).toBe('fail');
        expect(result.detail).toContain('A4 has no blendDrill');
        expect(loopCheckFn()('loops-sound', 'x', ['A1 has no soundLoop'], [], 'fail').status).toBe('fail');
        expect(loopCheckFn()('loops-sound', 'x', ['A1 has no soundLoop'], [], 'warn').status).toBe('warn');
    });

    it('passes a part with no problem and nothing skipped, at any status', () => {
        expect(loopCheckFn()('loops-sound', 'x', [], [], 'fail').status).toBe('pass');
        expect(loopCheckFn()('loops-sound', 'x', [], [], 'warn').status).toBe('pass');
    });

    it('gives a shipped week checked without the taught set the status warn for loops-blend and loops-recall, never pass', () => {
        for (const week of TEACH_WEEKS) {
            const report = checkStorytimeWeek(shippedWeek(week));
            for (const id of ['loops-blend', 'loops-recall']) {
                const found = check(report, id, `the shipped w0${week} without the taught set`);
                expect(found.status, `${id} on w0${week}`).toBe('warn');
                expect(found.label, `${id} on w0${week}`).toContain('not checked');
            }
        }
    });

    it('keeps the published detail of st2/1 free of loops-blend and loops-recall when the taught set is not given', () => {
        const parts = ['text', 'thai', 'images', 'audio', 'song', 'scripts'] as const;
        const approval = StorytimeWeekSchema.parse(shippedWeek(1)).approval;
        const expected = parts.filter((p) => approval[p].status !== 'approved').map((p) => `${p} not approved`).join('; ');
        const published = check(checkStorytimeWeek(shippedWeek(1)), 'published');
        expect(published.status).toBe('fail');
        expect(published.detail).toBe(expected);
    });

    it('still gives a drill sound outside the allowed set the status LOOP_CHECK_STATUS, with the sound named', () => {
        const raw = loopComplete(2);
        setDrill(raw, 'A', 'A4', { ...SAMPLE_DRILLS[2], words: [{ word: 'zip', sounds: ['/z/', '/i/', '/p/'] }, ...SAMPLE_DRILLS[2].words.slice(1)] });
        const found = check(reportFor(raw), 'loops-blend');
        expect(found.status).toBe(loopStatus());
        expect(found.detail).toContain('/z/');
        expect(found.detail).not.toContain('not checked');
    });
});

describe('the copies stay out of the content folder', () => {
    it('writes the copies only into the temporary folder and leaves the shipped weeks unchanged', () => {
        expect(path.resolve(tempDir).startsWith(path.resolve(os.tmpdir())), 'the copies live in a temporary folder').toBe(true);
        const guard = path.join(tempDir, 'guard.json');
        fs.writeFileSync(guard, JSON.stringify(loopComplete(1)));
        expect(fs.existsSync(guard), 'the copy file exists').toBe(true);
        for (const [week, hash] of SHIPPED_HASHES) {
            const now = createHash('sha256').update(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week))).digest('hex');
            expect(now, `the shipped w0${week} is unchanged`).toBe(hash);
        }
    });
});
