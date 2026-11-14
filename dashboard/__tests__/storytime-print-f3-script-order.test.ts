// @vitest-environment node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';

/**
 * Phase 9, P9-B Red run 2: the F3 teacher script order (spec addendum "Addendum 2026-11-14 (2): C2,
 * F3, the week 8 review pages, and the cast sheet", decisions P9-B6 and P9-B7; plan task "Red, C2,
 * F3, and the review pages").
 *
 * The D4 step of weeks 2 to 7 names the trace of the frame before the prompt action that the page
 * prints above the frame. The four cases read shipped data, so they fail now for the 6 measured
 * weeks and pass for week 1, which has no order difference (Q9-8). Week 8 has no D4 step.
 *
 * Names, texts, and the baseline that the spec leaves open are fixed here, so that Green does not
 * guess. Each is marked PIN:
 *  - PIN the four case names: F3-order, F3-th-shape, F3-scope, F3-mutants.
 *  - PIN the D4 step is `scripts[3].steps[3]` of a week file. The keys of the fix are
 *    `en.teacherActions[1]`, `en.teacherLanguage[1]`, `en.teacherLanguage[2]`, and
 *    `en.studentActions[0]`, with their `th` twins.
 *  - PIN the page order of the D4 block, from the compiled student book: week 1 is trace, line,
 *    draw; week 4 is trace, draw, choice, line; weeks 2, 3, 5, 6, and 7 are prompt, trace, draw,
 *    choice, line.
 *  - PIN the action probes of each week, from the page order of P9-B6: week 2 counts, weeks 3, 6,
 *    and 7 color, and week 5 draws the eyes; week 4 draws the person in the first box before it
 *    finds the word. Each action must stand before the item that the page prints below it.
 *  - PIN the exact English lines of P9-B6 are pinned below in `NEW_LINES`. The Green content role
 *    may change a word only with a recorded reason.
 *  - PIN the baseline of F3-scope is the commit of the Red start, `d0660317373a374a798cacd20453a0c10ef0f67`
 *    (recorded in the header of the run capture). A step compares with the baseline after the four
 *    allowed keys of the D4 step take a sentinel, so only those four keys may change.
 *  - PIN F3-th-shape asserts the length of each `th` array only, and compares no Thai text (the run
 *    brief, 2026-11-14). The byte-equal swap of `th.teacherLanguage[1]` and `[2]` in weeks 2, 3, 5,
 *    6, and 7 is not asserted here: it needs a Thai text compare, and Daniel's check covers it.
 *    The Green content role records the 24 moved and changed Thai lines for that check.
 *
 * The file reads English lines and the shape of the `th` arrays. It holds no Thai string, prints no
 * Thai string, names no track folder, and writes no file.
 */

/** The four English and Thai line groups of the D4 step. */
interface StepLines {
    teacherActions: string[];
    teacherLanguage: string[];
    studentActions: string[];
}

interface D4Step {
    id: string;
    en: StepLines;
    th: StepLines;
}

type WeekJson = Record<string, unknown>;

const REPO_ROOT = path.resolve(STORYTIME_ROOT, '..', '..');
const RED_BASELINE_COMMIT = 'd0660317373a374a798cacd20453a0c10ef0f067';

/** The weeks with a D4 step, in order. Week 8 has no D4 step. */
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** PIN the page order of the D4 block of the compiled student book. */
const PAGE_ORDER: Readonly<Record<number, readonly string[]>> = {
    1: ['trace', 'line', 'draw'],
    2: ['prompt', 'trace', 'draw', 'choice', 'line'],
    3: ['prompt', 'trace', 'draw', 'choice', 'line'],
    4: ['trace', 'draw', 'choice', 'line'],
    5: ['prompt', 'trace', 'draw', 'choice', 'line'],
    6: ['prompt', 'trace', 'draw', 'choice', 'line'],
    7: ['prompt', 'trace', 'draw', 'choice', 'line'],
};

/** PIN the action probes of each week: the name of the action and its text probe, in page order. */
const PROBES: Readonly<Record<number, readonly (readonly [string, RegExp])[]>> = {
    1: [['trace', /trace/i], ['name', /copy their name|write your name/i]],
    2: [['count', /count/i], ['trace', /trace/i]],
    3: [['color', /colou?r/i], ['trace', /trace/i]],
    4: [['trace', /trace/i], ['draw', /draw/i], ['find the word', /find|choose/i]],
    5: [['draw the eyes', /draw (your|their) two eyes/i], ['trace', /trace/i]],
    6: [['color', /colou?r/i], ['trace', /trace/i]],
    7: [['color', /colou?r/i], ['trace', /trace/i]],
};

/** The pinned new English lines of P9-B6, by key and index. */
const NEW_LINES: Readonly<Record<number, readonly (readonly [keyof StepLines, number, string])[]>> = {
    2: [
        ['teacherActions', 1, 'Children count the ducks in the picture: three. Then they trace "How many?" in the book.'],
        ['teacherLanguage', 1, 'Count the ducks. How many? Three!'],
        ['teacherLanguage', 2, 'Trace the words: How many?'],
        ['studentActions', 0, 'Children count the ducks and trace the frame.'],
    ],
    3: [
        ['teacherActions', 1, 'Children color the apple red in the book. Then they trace "It is red." below it.'],
        ['teacherLanguage', 1, 'Color the apple red.'],
        ['teacherLanguage', 2, 'Trace the words: It is red.'],
        ['studentActions', 0, 'Children color the apple and trace the frame.'],
    ],
    4: [
        ['teacherActions', 1, 'Children trace "This is my" in the book. Then they draw one person in the first box, find that word under the boxes (mom, dad, brother, sister, grandma, grandpa, family), and trace it.'],
        ['teacherLanguage', 1, 'Trace the words: This is my ...'],
        ['teacherLanguage', 2, 'Draw the person in the box. Now find your word and trace it.'],
        ['studentActions', 0, 'Children trace the frame, draw a person, and find and trace that family word.'],
    ],
    5: [
        ['teacherActions', 1, 'Children draw their two eyes in the face. Then they trace "I have two eyes." below it.'],
        ['teacherLanguage', 1, 'Draw your eyes in the face.'],
        ['teacherLanguage', 2, 'Trace the words: I have two eyes.'],
        ['studentActions', 0, 'Children draw the eyes and trace the frame.'],
    ],
    6: [
        ['teacherActions', 1, 'Children color the cat. Then they trace "I can see a cat." below it.'],
        ['teacherLanguage', 1, 'Color the cat.'],
        ['teacherLanguage', 2, 'Trace the words: I can see a cat.'],
        ['studentActions', 0, 'Children color the cat and trace the frame.'],
    ],
    7: [
        ['teacherActions', 1, 'Children color the ball. Then they trace "Is it a ball?" below it.'],
        ['teacherLanguage', 1, 'Color the ball.'],
        ['teacherLanguage', 2, 'Trace the words: Is it a ball?'],
        ['studentActions', 0, 'Children color the ball and trace the frame.'],
    ],
};

/** PIN the indices of the four keys that the fix may change, by line group. */
const ALLOWED_INDICES: Readonly<Record<keyof StepLines, readonly number[]>> = {
    teacherActions: [1],
    teacherLanguage: [1, 2],
    studentActions: [0],
};

// ---------------------------------------------------------------------------------------------
// The data
// ---------------------------------------------------------------------------------------------

function week(n: number): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, n), 'utf8')));
}

/** The week file at the baseline commit of the Red start. A failed `git show` fails the test. */
function baselineWeek(n: number): StorytimeWeek {
    const file = path.relative(REPO_ROOT, storytimeWeekFile(STORYTIME_ROOT, 2, n));
    try {
        const raw = execFileSync('git', ['show', `${RED_BASELINE_COMMIT}:${file}`], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
        return StorytimeWeekSchema.parse(JSON.parse(raw));
    } catch (error) {
        throw new Error(`git show ${RED_BASELINE_COMMIT}:${file} failed: ${(error as Error).message}`);
    }
}

/** The D4 step of a week, or undefined when the week has no such step. */
function d4Step(weekData: StorytimeWeek): D4Step | undefined {
    const scripts = weekData.scripts as unknown as { steps?: unknown[] }[];
    const step = scripts[3]?.steps?.[3] as unknown as D4Step | undefined;
    if (!step) return undefined;
    return step.id === 'D4' ? step : undefined;
}

let cachedHtml: string | undefined;

/** The compiled student book of weeks 1 to 8. */
function bookHtml(): string {
    if (cachedHtml === undefined) {
        cachedHtml = compileStorytimeStudentBook(WEEKS.map((n) => week(n)), { profile: STORYTIME_PRINT_PROFILE, mode: 'final' }).html;
    }
    return cachedHtml;
}

/** The page of a week, or undefined. */
function pageOf(weekNumber: number, kind: string): string | undefined {
    for (const page of bookHtml().split(/(?=<section class="student-page")/)) {
        if (!page.includes(`data-page-kind="${kind}"`)) continue;
        if (page.includes(`data-week="${weekNumber}"`)) return page;
    }
    return undefined;
}

/** The items of the D4 block of a writing page, in document order. */
function d4Items(weekNumber: number): string[] {
    const page = pageOf(weekNumber, 'writing');
    if (!page) return [];
    const start = page.indexOf('data-step="D4"');
    if (start < 0) return [];
    const block = page.slice(start);
    const markers: readonly (readonly [string, string])[] = [
        ['prompt', 'data-part="prompt-row"'],
        ['trace', 'data-part="writing-trace"'],
        ['draw', 'data-part="writing-picture-box"'],
        ['choice', 'data-part="choice-words"'],
        ['line', 'data-part="name-line"'],
        ['line', 'data-part="word-line"'],
    ];
    return markers
        .map(([name, needle]) => [name, block.indexOf(needle)] as [string, number])
        .filter(([, at]) => at >= 0)
        .sort((a, b) => a[1] - b[1])
        .map(([name]) => name);
}

// ---------------------------------------------------------------------------------------------
// The checks, as functions, so that a mutant can run the same check
// ---------------------------------------------------------------------------------------------

/** The English lines of the D4 step that the fix may change, in the order of the page. */
function scriptStream(en: StepLines, weekNumber: number): string[] {
    const picks: (readonly [keyof StepLines, number])[] = weekNumber === 1
        ? [['teacherActions', 0], ['teacherActions', 1], ['teacherLanguage', 0], ['studentActions', 0]]
        : [['teacherActions', 1], ['teacherLanguage', 1], ['teacherLanguage', 2], ['studentActions', 0]];
    return picks.map(([key, index]) => en[key]?.[index] ?? '');
}

/** A set of English lines with only the pinned lines of P9-B6 in place. */
function enFromPins(weekNumber: number): StepLines {
    const en: StepLines = { teacherActions: [], teacherLanguage: [], studentActions: [] };
    for (const [key, index, line] of NEW_LINES[weekNumber] ?? []) {
        const lines = en[key];
        while (lines.length <= index) lines.push('');
        lines[index] = line;
    }
    return en;
}

/** The problems of the action order: an action that the page prints first but the script names later. */
function orderProblems(weekNumber: number, en: StepLines): string[] {
    const problems: string[] = [];
    const probes = PROBES[weekNumber] ?? [];
    const text = scriptStream(en, weekNumber).join('\n');
    let last = -1;
    for (const [name, probe] of probes) {
        const at = text.search(probe);
        if (at < 0) {
            problems.push(`the D4 script of week ${weekNumber} never names the action "${name}" that the page prints`);
            continue;
        }
        if (at <= last) {
            problems.push(`the D4 script of week ${weekNumber} names "${name}" later than the item above it; the page order is ${(PAGE_ORDER[weekNumber] ?? []).join(', ')}`);
        }
        last = at;
    }
    return problems;
}

/** The problems of the English text: a line that differs from the pinned line of P9-B6. */
function textProblems(weekNumber: number, en: StepLines): string[] {
    const problems: string[] = [];
    for (const [key, index, expected] of NEW_LINES[weekNumber] ?? []) {
        const actual = en[key]?.[index];
        if (actual !== expected) {
            problems.push(`en.${key}[${index}] of week ${weekNumber} is ${JSON.stringify(actual ?? null)}; the line of P9-B6 is ${JSON.stringify(expected)}`);
        }
    }
    return problems;
}

/** The problems of the Thai shape: a `th` array whose length differs from its `en` array. It compares no Thai text. */
function shapeProblems(step: { en?: Partial<StepLines>; th?: Partial<StepLines> }): string[] {
    const problems: string[] = [];
    if (!step.th) return ['the D4 step has no th lines'];
    for (const key of Object.keys(ALLOWED_INDICES) as (keyof StepLines)[]) {
        const enLength = step.en?.[key]?.length ?? 0;
        const thLength = step.th[key]?.length ?? 0;
        if (thLength !== enLength) problems.push(`th.${key} has ${thLength} lines and en.${key} has ${enLength}`);
    }
    return problems;
}

/** A copy of a value with every `th` key dropped; no Thai string is compared. */
function stripThai(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(stripThai);
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
            if (key === 'th') continue;
            out[key] = stripThai(inner);
        }
        return out;
    }
    return value;
}

/** A copy of a D4 step with the four allowed English lines replaced by a sentinel. */
function allowedStep(step: unknown): unknown {
    const copy = stripThai(step) as { en?: Partial<Record<keyof StepLines, string[]>> };
    if (!copy.en) return copy;
    for (const [key, indices] of Object.entries(ALLOWED_INDICES) as [keyof StepLines, readonly number[]][]) {
        const lines = copy.en[key];
        if (!Array.isArray(lines)) continue;
        for (const index of indices) if (index < lines.length) lines[index] = '@allowed';
    }
    return copy;
}

/**
 * The problems of a week file against the baseline: a change outside the four allowed keys of the
 * D4 step, or a change of the `print` block or of the `approval` block.
 */
function scopeProblems(baseline: unknown, current: unknown, weekNumber: number): string[] {
    const problems: string[] = [];
    const before = stripThai(baseline) as WeekJson;
    const after = stripThai(current) as WeekJson;
    for (const key of ['approval', 'print']) {
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) problems.push(`the ${key} block of week ${weekNumber} changed`);
    }
    const beforeScripts = (before.scripts ?? []) as { steps?: unknown[] }[];
    const afterScripts = (after.scripts ?? []) as { steps?: unknown[] }[];
    if (beforeScripts.length !== afterScripts.length) {
        problems.push(`the week file has ${afterScripts.length} scripts and the baseline has ${beforeScripts.length}`);
        return problems;
    }
    beforeScripts.forEach((script, scriptIndex) => {
        const beforeSteps = script.steps ?? [];
        const afterSteps = afterScripts[scriptIndex]?.steps ?? [];
        if (beforeSteps.length !== afterSteps.length) {
            problems.push(`script ${scriptIndex} has ${afterSteps.length} steps and the baseline has ${beforeSteps.length}`);
            return;
        }
        beforeSteps.forEach((step, stepIndex) => {
            const allowed = weekNumber !== 1 && scriptIndex === 3 && stepIndex === 3;
            const canon = allowed ? allowedStep : stripThai;
            if (JSON.stringify(canon(step)) !== JSON.stringify(canon(afterSteps[stepIndex]))) {
                problems.push(`the step ${scriptIndex}.${stepIndex} of week ${weekNumber} changed outside the four allowed keys`);
            }
        });
    });
    return problems;
}

// ---------------------------------------------------------------------------------------------
// F3-order
// ---------------------------------------------------------------------------------------------

describe('F3: the D4 teacher script follows the page (P9-B6)', () => {
    it.each([1, 2, 3, 4, 5, 6, 7])('F3-order week %i: the D4 rows and the D4 script name the same items in one order', (weekNumber) => {
        const items = d4Items(weekNumber);
        expect(items.length, `the compiled D4 block of week ${weekNumber} has items`).toBeGreaterThan(0);
        expect(items.join(','), `the page order of the D4 block of week ${weekNumber}`).toBe((PAGE_ORDER[weekNumber] ?? []).join(','));

        const step = d4Step(week(weekNumber));
        expect(step, `the D4 step of week ${weekNumber}`).toBeDefined();
        if (!step) return;
        const problems = [...orderProblems(weekNumber, step.en), ...textProblems(weekNumber, step.en)];
        expect(problems.length, problems.join('\n') || `the D4 script of week ${weekNumber} follows the page`).toBe(0);
    });

    it('F3-order week 8: the week has no D4 step and the book has no writing page for it', () => {
        expect(d4Step(week(8)), 'the D4 step of week 8').toBeUndefined();
        expect(pageOf(8, 'writing'), 'a writing page of week 8').toBeUndefined();
        expect((bookHtml().match(/data-page-kind="writing"/g) ?? []).length, 'the writing pages of weeks 1 to 8').toBe(7);
    });

    // -----------------------------------------------------------------------------------------
    // F3-th-shape
    // -----------------------------------------------------------------------------------------

    it('F3-th-shape: each th array of the D4 step has the length of its en array', () => {
        const problems: string[] = [];
        for (const weekNumber of [1, 2, 3, 4, 5, 6, 7]) {
            const step = d4Step(week(weekNumber));
            if (!step) {
                problems.push(`week ${weekNumber} has no D4 step`);
                continue;
            }
            for (const problem of shapeProblems(step)) problems.push(`week ${weekNumber}: ${problem}`);
        }
        expect(problems.length, problems.join('\n') || 'each th array has the length of its en array').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // F3-scope
    // -----------------------------------------------------------------------------------------

    it('F3-scope: only the four English keys of the D4 step and their th twins differ from the Red baseline', () => {
        const problems: string[] = [];
        for (const weekNumber of [1, 2, 3, 4, 5, 6, 7]) {
            for (const problem of scopeProblems(baselineWeek(weekNumber), week(weekNumber), weekNumber)) problems.push(problem);
        }
        expect(problems.length, problems.join('\n') || 'the week files change only the four keys of the D4 step').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // F3-mutants
    // -----------------------------------------------------------------------------------------

    it('F3-mutants: the old order, a Thai line moved alone, and a change outside the keys each fail', () => {
        // (a) one week with the old order fails F3-order
        const oldStep = d4Step(baselineWeek(2));
        expect(oldStep, 'the D4 step of the baseline week 2').toBeDefined();
        if (oldStep) {
            expect(orderProblems(2, oldStep.en).length, 'Mutant a: the old order of week 2 fails F3-order.').toBeGreaterThan(0);
            const pinned = enFromPins(2);
            expect(orderProblems(2, pinned).length, 'Guard: the pinned lines of P9-B6 follow the page.').toBe(0);
            expect(textProblems(2, pinned).length, 'Guard: the pinned lines of P9-B6 pass the text check.').toBe(0);
        }

        // (b) a Thai line moved without its English twin fails F3-th-shape
        const shapeMutant = {
            en: { teacherActions: ['a', 'b', 'c'], teacherLanguage: ['d'], studentActions: ['e'] } as StepLines,
            th: { teacherActions: ['x', 'y', 'z', 'w'], teacherLanguage: ['v'], studentActions: ['u'] } as StepLines,
        };
        expect(shapeProblems(shapeMutant).length, 'Mutant b: an extra th line fails F3-th-shape.').toBeGreaterThan(0);

        // (c) a change in en.teacherActions[3] fails F3-scope
        const baseline = baselineWeek(2);
        const changed = JSON.parse(JSON.stringify(baseline)) as WeekJson;
        const steps = ((changed.scripts ?? []) as { steps?: { en?: StepLines }[] }[])[3]?.steps;
        const d4 = steps?.[3];
        expect(d4?.en?.teacherActions?.[3], 'the baseline has en.teacherActions[3] of week 2').toBeDefined();
        if (d4?.en?.teacherActions) d4.en.teacherActions[3] = 'A changed line.';
        expect(scopeProblems(baseline, changed, 2).length, 'Mutant c: a change in en.teacherActions[3] fails F3-scope.').toBeGreaterThan(0);
        expect(scopeProblems(baseline, week(2), 2), 'Guard: the current week file equals its baseline.').toEqual([]);
    });
});
