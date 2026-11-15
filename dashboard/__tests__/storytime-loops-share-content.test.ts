// @vitest-environment node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as checksModule from '../lib/storytime/checks';
import { checkStorytimeWeek } from '../lib/storytime/checks';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { SAMPLE_THAI, sampleShare } from './fixtures/storytime-share-sample';
import { fixtureReviewWeek, fixtureWeek } from './fixtures/storytime-week-fixture';

// Phase 3b Red 2 of track storytime_teaching_loops_20261103 (FR-14, AC-14.5 to AC-14.7, test-strategy 9.8): the
// content of the shipped weeks w01 to w08, and the share on each script of the two fixture weeks.
//
// Naming rule (plan, Red content). Each week test name holds `w0N`, so `-t "w0"` selects the week tests and
// `-t "w03"` selects one week. A test that is not about one week has no `w0` in its name or in its describe
// name. The switch test is one of them.
//
// Red notes. The shipped weeks hold no `share` yet, so the content tests fail until the content task. The
// tests that pass at Red are characterization tests, and each has a falsifier:
//   - the additive compare of each week (N5): falsified by the compare tests below, and by the mutants MN1 to MN3;
//   - the student book (N7): falsified by the marker captions and by a changed reader page;
//   - the fixtures (N9): the fixture upgrade is in the same commit, and a copy without a share fails the check;
//   - the guard (N10): falsified by a test that writes a week file.
//
// Mutants of this file (MN1 to MN3, data mutants on the deleter `withoutAllowList`): MN1 keeps the share, MN2 also
// drops the Thai notes, MN3 also drops the recall. The Red author runs them on copies of this file with the mutant
// site marker below replaced. Each mutant makes one compare test fail.
//
// Thai rule (test-strategy 9.4, item 6). This file holds no Thai literal. The Thai placeholder comes from the
// sample file. A test asserts only that a Thai caption exists and holds a Thai-script character.

type Raw = any;

/** The eight Level 2 weeks. */
const WEEK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

/** The script ids of the five days of a week. */
const SCRIPT_IDS = ['A', 'B', 'C', 'D', 'E'];

/** The check id of the share moment (FR-14). */
const SHARE_ID = 'share-moment';

/**
 * The baseline commit of the additive compare (Q21): the last commit that changed a week file at the start of
 * this Red task (`git log -1 --format=%H -- content/storytime/l2`). If a week file changes before the content
 * commit, a test-only commit moves this constant first.
 */
const SHARE_BASELINE_COMMIT = '10d5fcfce4b35c30ed4c6c4cf3c901fe23ac918d';

/** The repository root: the content folder sits in it. */
const REPO_ROOT = path.resolve(STORYTIME_ROOT, '..', '..');

/** A Thai-script character. The range is written as escapes, so this file holds no Thai literal. */
const THAI_SCRIPT = /[฀-๿]/;

/** The marker of a student book caption. It must never reach the student book. */
const MARKER = 'ZQXSHARE';

/**
 * The words of a caption, counted as rule 6 of FR-14 counts them: trim, split on runs of white space, and
 * count the non-empty parts (decision Q13). This file types its own counter and never imports the check's.
 * @param line The text of the caption.
 * @returns The number of words.
 */
function words(line: string): number {
    return line.trim().split(/\s+/).filter(Boolean).length;
}

const weekFile = (n: number) => storytimeWeekFile(STORYTIME_ROOT, 2, n);
const shippedRaw = (n: number): Raw => JSON.parse(fs.readFileSync(weekFile(n), 'utf8'));
const parsed = (raw: Raw): StorytimeWeek => StorytimeWeekSchema.parse(raw);

/** The share of a script, read through an untyped helper so a missing field is an assertion failure (F11). */
const shareOf = (script: Raw): Raw => (script as Raw).share;

/** The SHA-256 of each shipped week file, taken when the file loads (the guard, N10). */
const sha256 = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const HASHES_AT_LOAD = WEEK_NUMBERS.map((n) => sha256(weekFile(n)));

let weeksCache: StorytimeWeek[] | undefined;
/** The eight parsed shipped weeks of Level 2, in week order. */
function shippedWeeks(): StorytimeWeek[] {
    weeksCache ??= WEEK_NUMBERS.map((n) => parsed(shippedRaw(n)));
    return weeksCache;
}
const shippedWeek = (n: number): StorytimeWeek => shippedWeeks()[n - 1];

/** The `share-moment` row of the check of a week. */
function shareRow(week: unknown) {
    return checkStorytimeWeek(week).checks.find((c) => c.id === SHARE_ID);
}

/** The week file at the baseline commit. A failed `git show` fails the test with a message, never a skip (A4). */
const baselineText = new Map<number, string>();
function baselineRaw(n: number): Raw {
    const file = `content/storytime/l2/w0${n}.json`;
    try {
        if (!baselineText.has(n)) {
            baselineText.set(n, execFileSync('git', ['show', `${SHARE_BASELINE_COMMIT}:${file}`], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
        }
        return JSON.parse(baselineText.get(n)!);
    } catch (error) {
        throw new Error(`git show ${SHARE_BASELINE_COMMIT}:${file} failed: ${(error as Error).message}`);
    }
}

/** Sorts the keys of every object, recursively. The order of arrays stays. */
function sortKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys((value as Raw)[k])]));
    return value;
}

/**
 * The week without its allow-list (Q21, anti-pattern A7): exactly the keys of the earlier additive compare
 * (`print`, `approval.loops`, `approval.print`, `approval.audio`, `approval.song`, `approval.images`,
 * `books[].cover.file`, and `books[].pages[].image.file`) and `scripts[].share`. It also removes the two
 * Phase 11 fields, `books[].audio.wordClips` and `song.videoLeadInSeconds` (spec K15), as `withoutNewFields`
 * of `storytime-loops-content.test.ts` does: a clips commit adds them after the baseline commit, so the
 * additive compare must ignore them. It also removes the four Phase 12 fields, `opening.wordClips`,
 * `focus.family.wordClips`, `focus.trickyWordClips`, and `books[].audio.sentenceClips` (spec L3 and L7).
 * Both sides of the compare go through this function.
 * The allow-list has no other key.
 */
function withoutAllowList(week: Raw): Raw {
    const copy = structuredClone(week);
    for (const script of copy.scripts) {
        delete script.share;
        // @@MUTANT-SITE
    }
    for (const book of copy.books ?? []) {
        delete book.cover?.file;
        delete book.audio?.wordClips;
        // The sentence clips of the decodable books are Phase 12 media (Phase 12, L7).
        delete book.audio?.sentenceClips;
        for (const page of book.pages ?? []) delete page.image?.file;
    }
    // The word clips of the opening words, the family words, and the tricky words are Phase 12 media (Phase 12, L3).
    delete copy.opening?.wordClips;
    delete copy.focus?.family?.wordClips;
    delete copy.focus?.trickyWordClips;
    delete copy.song?.videoLeadInSeconds;
    if (copy.approval) {
        delete copy.approval.loops;
        delete copy.approval.print;
        delete copy.approval.audio;
        delete copy.approval.song;
        delete copy.approval.images;
    }
    delete copy.print;
    return copy;
}

const P14_PATHS: Record<number, string[]> = {
    1: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.harder', 'scripts.2.steps.1.harder', 'tags.taught', 'opening.wordClips'],
    2: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'tags.taught', 'opening.wordClips'],
    3: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'scripts.0.steps.3.en.teacherActions', 'scripts.0.steps.3.th.teacherActions', 'scripts.0.steps.4.harder', 'tags.reviewed', 'opening.wordClips'],
    4: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'tags.reviewed', 'opening.wordClips'],
    5: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'scripts.0.steps.4.harder', 'scripts.0.steps.0.en.watchFor', 'scripts.0.steps.0.th.watchFor', 'scripts.4.steps.0.en.teacherActions', 'scripts.4.steps.0.th.teacherActions', 'scripts.4.steps.0.materials', 'scripts.4.steps.1.en.teacherActions', 'scripts.4.steps.1.th.teacherActions', 'scripts.4.steps.1.materials', 'tags.reviewed', 'opening.wordClips'],
    6: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'scripts.0.steps.4.harder', 'scripts.0.steps.0.en.watchFor', 'scripts.0.steps.0.th.watchFor', 'scripts.0.steps.3.en.teacherActions', 'scripts.0.steps.3.th.teacherActions', 'scripts.0.steps.3.en.watchFor', 'scripts.0.steps.3.th.watchFor', 'scripts.4.steps.0.en.teacherActions', 'scripts.4.steps.0.th.teacherActions', 'scripts.4.steps.0.materials', 'scripts.4.steps.1.en.teacherActions', 'scripts.4.steps.1.th.teacherActions', 'scripts.4.steps.1.materials', 'tags.reviewed', 'opening.wordClips'],
    7: ['focus.paSkill', 'focus.paStage', 'opening.pa.0', 'opening.pa.1', 'opening.audio', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'scripts.0.steps.0.materials', 'scripts.0.steps.0.harder', 'scripts.0.steps.4.harder', 'scripts.4.steps.0.en.teacherActions', 'scripts.4.steps.0.th.teacherActions', 'scripts.4.steps.0.materials', 'scripts.4.steps.1.en.teacherActions', 'scripts.4.steps.1.th.teacherActions', 'scripts.4.steps.1.materials', 'tags.reviewed', 'opening.wordClips'],
    8: ['focus.paSkill', 'focus.paStage', 'opening.pa.2', 'opening.pa.4', 'scripts.0.steps.0.en.teacherActions', 'scripts.0.steps.0.th.teacherActions', 'scripts.0.steps.0.en.teacherLanguage', 'scripts.0.steps.0.th.teacherLanguage', 'benchmark.paper.items.4', 'benchmark.paper.items.5', 'benchmark.paper.items.6', 'benchmark.paper.items.7', 'tags.reviewed'],
};

/**
 * The P9-B allow list of the additive compare (spec P9-B6, pin edit of P9-B12): the D4 keys of weeks
 * 2 to 7 and the week 8 paths of P9-B9 and P9-B12. A path that the shipped week does not hold yet is
 * skipped, so a new field does not fail the compare before the content commit adds it.
 */
const P9B_PATHS: Record<number, string[]> = {
    2: ['scripts.3.steps.3.en.teacherActions', 'scripts.3.steps.3.th.teacherActions', 'scripts.3.steps.3.en.teacherLanguage', 'scripts.3.steps.3.th.teacherLanguage', 'scripts.3.steps.3.en.studentActions', 'scripts.3.steps.3.th.studentActions'],
    3: ['scripts.3.steps.3.en.teacherActions', 'scripts.3.steps.3.th.teacherActions', 'scripts.3.steps.3.en.teacherLanguage', 'scripts.3.steps.3.th.teacherLanguage', 'scripts.3.steps.3.en.studentActions', 'scripts.3.steps.3.th.studentActions'],
    4: ['scripts.3.steps.3.en.teacherActions', 'scripts.3.steps.3.th.teacherActions', 'scripts.3.steps.3.en.teacherLanguage', 'scripts.3.steps.3.th.teacherLanguage', 'scripts.3.steps.3.en.studentActions', 'scripts.3.steps.3.th.studentActions'],
    5: ['scripts.3.steps.3.en.teacherActions', 'scripts.3.steps.3.th.teacherActions', 'scripts.3.steps.3.en.teacherLanguage', 'scripts.3.steps.3.th.teacherLanguage', 'scripts.3.steps.3.en.studentActions', 'scripts.3.steps.3.th.studentActions'],
    6: ['scripts.3.steps.3.en.teacherActions', 'scripts.3.steps.3.th.teacherActions', 'scripts.3.steps.3.en.teacherLanguage', 'scripts.3.steps.3.th.teacherLanguage', 'scripts.3.steps.3.en.studentActions', 'scripts.3.steps.3.th.studentActions'],
    7: ['scripts.3.steps.3.en.teacherActions', 'scripts.3.steps.3.th.teacherActions', 'scripts.3.steps.3.en.teacherLanguage', 'scripts.3.steps.3.th.teacherLanguage', 'scripts.3.steps.3.en.studentActions', 'scripts.3.steps.3.th.studentActions'],
    8: ['block.days.1.paperMore', 'block.days.2.paperMore', 'block.days.3.paperMore', 'block.days.4.paperMore',
        'scripts.1.steps.0.en.teacherActions', 'scripts.1.steps.0.th.teacherActions',
        'scripts.2.steps.0.en.teacherActions', 'scripts.2.steps.0.th.teacherActions',
        'scripts.3.steps.0.en.teacherActions', 'scripts.3.steps.0.th.teacherActions',
        'scripts.4.steps.0.en.teacherActions', 'scripts.4.steps.0.th.teacherActions'],
};

/**
 * The LP allow list of the additive compare (loops Phase 3, LP-08 group and LP-20, Daniel's "Approved" of
 * 2026-11-15): the recall cards of days 4 and 5 in weeks 2 to 7, and the `what` question of the read-along
 * of week 7. A path that the shipped week does not hold is skipped, as for `P9B_PATHS`.
 */
const LP_PATHS: Record<number, string[]> = {
    2: ['scripts.3.recall.items', 'scripts.4.recall.items'],
    3: ['scripts.3.recall.items', 'scripts.4.recall.items'],
    4: ['scripts.3.recall.items', 'scripts.4.recall.items'],
    5: ['scripts.3.recall.items', 'scripts.4.recall.items'],
    6: ['scripts.3.recall.items', 'scripts.4.recall.items'],
    7: ['scripts.3.recall.items', 'scripts.4.recall.items', 'books.0.questions.1.ask'],
};


/**
 * The Phase 14 alignment of the additive compare (Red retry R1, D-R1-2): at each changed path of the change
 * list, both sides take the shipped value, so the compare allows the P14 edits and any other change still
 * fails. A path that the shipped week does not hold fails the test.
 */
function p14Align(week: Raw, shipped: Raw, n: number): Raw {
    const copy = structuredClone(week);
    for (const path of P14_PATHS[n]) {
        const shippedValue = path.split('.').reduce<unknown>((node, key) => (node == null ? undefined : (node as Record<string, unknown>)[key]), shipped);
        if (shippedValue === undefined) throw new Error(`the Phase 14 path ${path} is missing in the shipped w0${n}`);
        const parts = path.split('.');
        const parent = parts.slice(0, -1).reduce<Record<string, unknown>>((node, key) => node[key] as Record<string, unknown>, copy);
        parent[parts[parts.length - 1]] = structuredClone(shippedValue);
    }
    for (const path of [...(P9B_PATHS[n] ?? []), ...(LP_PATHS[n] ?? [])]) {
        const shippedValue = path.split('.').reduce<unknown>((node, key) => (node == null ? undefined : (node as Record<string, unknown>)[key]), shipped);
        if (shippedValue === undefined) continue;
        const parts = path.split('.');
        const parent = parts.slice(0, -1).reduce<Record<string, unknown>>((node, key) => node[key] as Record<string, unknown>, copy);
        parent[parts[parts.length - 1]] = structuredClone(shippedValue);
    }
    return copy;
}


const normalize = (week: Raw): string => JSON.stringify(sortKeys(withoutAllowList(week)));

/** The English captions of the shipped weeks, in week order and day order. Missing shares give no entry. */
function shippedCaptions(weekNumber: number): string[] {
    return shippedWeek(weekNumber).scripts.flatMap((s) => (shareOf(s) ? [shareOf(s).caption.en as string] : []));
}

describe('the share compare itself', () => {
    const base = () => parsed(baselineRaw(1));
    const same = () => normalize(base());
    const mutate = (change: (w: Raw) => void): Raw => {
        const copy = structuredClone(base()) as Raw;
        change(copy);
        return copy;
    };
    const firstStep = (w: Raw) => w.scripts[0].steps[0];
    const sampleOfFirstDay = () => ({ ...sampleShare(1, 'A'), caption: { en: 'A caption of the test.', th: SAMPLE_THAI } });

    it('compare falsifier: one changed character in an existing Thai line fails the compare', () => {
        const changed = mutate((w) => (firstStep(w).th.teacherActions[0] = 'X' + firstStep(w).th.teacherActions[0].slice(1)));
        expect(normalize(changed)).not.toBe(same());
    });

    it('compare falsifier: one deleted existing line fails the compare', () => {
        expect(normalize(mutate((w) => firstStep(w).en.teacherActions.pop()))).not.toBe(same());
    });

    it('compare falsifier: one changed minutes value fails the compare', () => {
        expect(normalize(mutate((w) => (firstStep(w).minutes += 1)))).not.toBe(same());
    });

    it('compare falsifier: two steps reordered fail the compare', () => {
        expect(normalize(mutate((w) => w.scripts[0].steps.reverse()))).not.toBe(same());
    });

    it('compare falsifier: a Thai array reordered fails the compare', () => {
        const base1 = base() as Raw;
        expect(base1.scripts[0].steps[0].th.teacherActions.length, 'the Thai array has two lines or more').toBeGreaterThanOrEqual(2);
        expect(normalize(mutate((w) => firstStep(w).th.teacherActions.reverse()))).not.toBe(same());
    });

    it('compare falsifier: one changed recall item fails the compare', () => {
        const withRecall = (w: Raw) => w.scripts.find((s: Raw) => s.recall);
        expect(withRecall(base() as Raw), 'the baseline has a recall').toBeDefined();
        expect(normalize(mutate((w) => (withRecall(w).recall.items[0].text = 'X' + withRecall(w).recall.items[0].text)))).not.toBe(same());
    });

    it('compare falsifier: one changed loopMinutes value fails the compare', () => {
        const withLoop = (w: Raw) => w.scripts.flatMap((s: Raw) => s.steps).find((st: Raw) => typeof st.loopMinutes === 'number');
        expect(withLoop(base() as Raw), 'the baseline has a loopMinutes').toBeDefined();
        expect(normalize(mutate((w) => (withLoop(w).loopMinutes += 1)))).not.toBe(same());
    });

    it('compare tolerance: a key reorder alone passes the compare', () => {
        const reordered = Object.fromEntries(Object.entries(structuredClone(base())).reverse());
        expect(normalize(reordered)).toBe(same());
    });

    it('compare tolerance: a copy with only an added or a changed share passes the compare', () => {
        const added = mutate((w) => (w.scripts[0].share = sampleOfFirstDay()));
        expect(normalize(added), 'an added share').toBe(same());
        const changed = mutate((w) => (w.scripts[0].share = sampleOfFirstDay()));
        changed.scripts[0].share.caption.en = 'Another caption of the test.';
        changed.scripts[0].share.shots = [{ step: 'A1', media: 'photo' }];
        expect(normalize(changed), 'a changed share').toBe(same());
    });

    it('compare falsifier: a changed existing line next to a share fails the compare', () => {
        const changed = mutate((w) => (w.scripts[0].share = sampleOfFirstDay()));
        firstStep(changed).en.teacherActions[0] = 'X' + firstStep(changed).en.teacherActions[0].slice(1);
        expect(normalize(changed)).not.toBe(same());
    });
});

for (const n of WEEK_NUMBERS) {
    const name = `w0${n}`;

    describe(`${name} share content`, () => {
        it(`${name} has a share on each of its 5 scripts`, () => {
            const week = shippedWeek(n);
            expect(week.scripts.map((s) => s.id)).toEqual(SCRIPT_IDS);
            const withShare = week.scripts.filter((s) => shareOf(s) !== undefined).length;
            expect(`${name} scripts with share: ${withShare}`).toBe(`${name} scripts with share: 5`);
        });

        it(`${name} shots equal the moment table of FR-14, step and media, in order`, () => {
            const week = shippedWeek(n);
            const actual = week.scripts.map((s) => ({ id: s.id, day: s.day, shots: shareOf(s)?.shots ?? null }));
            const expected = week.scripts.map((s) => ({ id: s.id, day: s.day, shots: sampleShare(n, s.id).shots }));
            expect(actual).toEqual(expected);
        });

        it(`${name} passes share-moment with the status pass`, () => {
            const row = shareRow(shippedRaw(n));
            expect(row, `${name} has a ${SHARE_ID} row`).toBeDefined();
            expect(row!.status, `${name}: ${row!.detail ?? ''}`).toBe('pass');
        });

        it(`${name} captions in English have 1 to 40 words and no pipe, angle bracket, or line break`, () => {
            const week = shippedWeek(n);
            const captions = week.scripts.map((s) => shareOf(s)?.caption?.en as string | undefined);
            expect(captions.filter((c) => typeof c === 'string').length, `${name} English captions`).toBe(5);
            for (const [index, caption] of captions.entries()) {
                const where = `${name} day ${index + 1}`;
                expect(words(caption!), `${where} word count`).toBeGreaterThanOrEqual(1);
                expect(words(caption!), `${where} word count`).toBeLessThanOrEqual(40);
                expect(caption, `${where} has no pipe, angle bracket, or line break`).not.toMatch(/[|<>\r\n]/);
            }
        });

        it(`${name} captions in Thai are present and hold a Thai-script character`, () => {
            const week = shippedWeek(n);
            const captions = week.scripts.map((s) => shareOf(s)?.caption?.th as string | undefined);
            expect(captions.filter((c) => typeof c === 'string').length, `${name} Thai captions`).toBe(5);
            for (const [index, caption] of captions.entries()) {
                expect(THAI_SCRIPT.test(caption!), `${name} day ${index + 1} caption.th holds a Thai-script character`).toBe(true);
            }
        });

        it(`${name} English captions differ from each other and from the captions of the other weeks`, () => {
            const own = shippedCaptions(n);
            expect(own.length, `${name} English captions`).toBe(5);
            expect(new Set(own).size, `${name} different captions`).toBe(5);
            const others = new Set(WEEK_NUMBERS.filter((m) => m !== n).flatMap((m) => shippedCaptions(m)));
            expect(own.filter((c) => others.has(c)), `${name} captions that another week repeats`).toEqual([]);
        });

        it(`${name} adds only share moments to its baseline file (additive, AC-14.5)`, () => {
            const shipped = shippedRaw(n);
            expect(normalize(p14Align(parsed(shipped), shipped, n))).toBe(normalize(p14Align(parsed(baselineRaw(n)), shipped, n)));
        });
    });
}

describe('the share moments of the eight weeks together', () => {
    it('hold 40 shares and 40 different English captions', () => {
        const scripts = shippedWeeks().flatMap((w) => w.scripts);
        const captions = scripts.flatMap((s) => (shareOf(s) ? [shareOf(s).caption.en as string] : []));
        expect(`scripts with share: ${captions.length}`).toBe('scripts with share: 40');
        expect(`set size: ${new Set(captions).size}`).toBe('set size: 40');
    });

    it('the status of share-moment is fail after the switch (AC-14.6)', () => {
        expect((checksModule as Raw).SHARE_CHECK_STATUS).toBe('fail');
    });
});

describe('the student book and the guard', () => {
    const studentModule = path.join(REPO_ROOT, 'dashboard', 'lib/storytime/print/student-book.ts');
    type Compile = (w: StorytimeWeek[], o: { profile: typeof STORYTIME_PRINT_PROFILE; mode: 'proof' }) => { html: string };
    const htmlCache = new Map<string, string>();

    /** Compiles the student book of the eight weeks in proof mode. The result stays in a cache by its key. */
    async function studentHtml(key: string, weeks: () => StorytimeWeek[]): Promise<string> {
        const cached = htmlCache.get(key);
        if (cached !== undefined) return cached;
        const { compileStorytimeStudentBook } = (await import(studentModule)) as { compileStorytimeStudentBook: Compile };
        const { html } = compileStorytimeStudentBook(weeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' });
        htmlCache.set(key, html);
        return html;
    }

    /** The eight weeks as raw copies, each edited by `change`, then parsed. */
    const editedWeeks = (change: (raw: Raw, n: number) => void) => (): StorytimeWeek[] =>
        WEEK_NUMBERS.map((n) => {
            const raw = shippedRaw(n);
            change(raw, n);
            return parsed(raw);
        });
    const withoutShares = editedWeeks((raw) => {
        for (const script of raw.scripts) delete script.share;
    });
    const withMarkers = editedWeeks((raw, n) => {
        for (const script of raw.scripts) {
            const moment = sampleShare(n, script.id);
            script.share = { shots: moment.shots, caption: { en: `${MARKER}${n}${script.id} caption`, th: SAMPLE_THAI } };
        }
    });

    it('is byte-equal with and without the share fields, and holds no caption marker (AC-14.7)', async () => {
        const without = await studentHtml('without', withoutShares);
        expect(await studentHtml('shipped', () => shippedWeeks()), 'the shipped weeks').toBe(without);
        const marked = await studentHtml('marked', withMarkers);
        expect(marked, 'the weeks with marker captions').toBe(without);
        expect(marked.includes(MARKER), 'the marker reaches the student book').toBe(false);
    }, 240_000);

    it('compares different student books as different (non-vacuity of the student book test)', async () => {
        const without = await studentHtml('without', withoutShares);
        const changed = await studentHtml('changed', editedWeeks((raw, n) => {
            if (n === 1) raw.books.find((b: Raw) => b.pages?.length).pages[0].text += ' ZQXCHANGED';
        }));
        expect(changed).not.toBe(without);
    }, 240_000);

    it('keeps the eight week files byte for byte over the run (guard)', () => {
        expect(WEEK_NUMBERS.map((n) => sha256(weekFile(n)))).toEqual(HASHES_AT_LOAD);
    });
});

describe('the fixture weeks hold a share on each script', () => {
    const fixtures: [string, () => Raw, Record<string, string[]>][] = [
        ['fixtureWeek', fixtureWeek, { A: ['A3'], B: ['B5'], C: ['C4'], D: ['D4', 'D5'], E: ['D6'] }],
        ['fixtureReviewWeek', fixtureReviewWeek, { A: ['A2'], B: ['B1'], C: ['C1'], D: ['D1'], E: ['E3'] }],
    ];

    for (const [label, build, steps] of fixtures) {
        it(`${label} has a share on each of its 5 scripts and passes share-moment`, () => {
            const week = build();
            expect(week.scripts.map((s: Raw) => s.id)).toEqual(SCRIPT_IDS);
            const withShare = week.scripts.filter((s: Raw) => shareOf(s) !== undefined).length;
            expect(`${label} scripts with share: ${withShare}`).toBe(`${label} scripts with share: 5`);
            expect(week.scripts.map((s: Raw) => shareOf(s).shots.map((shot: Raw) => shot.step))).toEqual(SCRIPT_IDS.map((id) => steps[id]));
            const row = shareRow(week);
            expect(row, `${label} has a ${SHARE_ID} row`).toBeDefined();
            expect(row!.status, `${label}: ${row!.detail ?? ''}`).toBe('pass');
        });

        it(`${label} without the share of one day fails share-moment (non-vacuity of the fixture test)`, () => {
            const week = build();
            delete week.scripts[1].share;
            expect(shareRow(week)!.status).not.toBe('pass');
        });
    }
});
