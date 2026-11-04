// @vitest-environment node
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOOP_CHECK_STATUS, checkStorytimeWeek, taughtTo } from '../lib/storytime/checks';
import { STORYTIME_ROOT, readLevelWeeks, readPhonemeBank, storytimeWeekFile } from '../lib/storytime/files';
import { phonemeAudioFields, phonemeAudioProblems } from '../lib/storytime/phonemes';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

// Phase 3 Red of track storytime_teaching_loops_20261103 (FR-10, spec D10, test-strategy 6.2): the content of
// the shipped weeks w01 to w08. Each test name holds `w0N`, so `-t "w0N"` selects one week (decision Q12).
//
// Baseline of the additive compare: commit 23ad4cf85a151564da7e2b2ce76344e6143b49ab, the last commit that
// changed a week file before this content (the planned cc7808c5 is older; the print content of 2026-11-03 changed
// the week files after it). The test never skips: a failed `git show` fails the test with a message.
//
// Allow-list of the additive compare (test-strategy 6.2, anti-pattern A7), exactly two keys, owner track
// `storytime_print_r1_20261025`: `print` and `approval.print`. Both sides drop them.

type Raw = any;

const BASELINE_COMMIT = '23ad4cf85a151564da7e2b2ce76344e6143b49ab';
const REPO_ROOT = path.resolve(STORYTIME_ROOT, '..', '..');
const WEEK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];
const LOOP_STEP_IDS = ['A1', 'A2', 'A3', 'A4', 'A6', 'C5', 'D2'];
const SIX_CHECKS = ['loops-blend', 'loops-sound', 'loops-sight', 'loops-questions', 'loops-recall', 'loops-minutes'];
const REVIEW_CHECKS = ['loops-recall', 'loops-minutes'];
/** The spoken sound of each teach week, as the week writes it. The `correct` line of a sound loop models it. */
const WEEK_SOUND: Record<number, string> = { 1: 'nnn', 2: '/a/', 3: '/p/', 4: 'mmm', 5: 'sss', 6: '/t/', 7: '/o/' };
/** English words that name a letter. A new line says a pure sound, never a letter name (spec FR-3). */
const LETTER_NAME_WORDS = ['ay', 'pee', 'em', 'es', 'tee', 'oh'];
const THAI = /[฀-๿]/;

const weekFile = (n: number) => storytimeWeekFile(STORYTIME_ROOT, 2, n);
const shippedRaw = (n: number): Raw => JSON.parse(fs.readFileSync(weekFile(n), 'utf8'));

/**
 * The script edits of track `storytime_print_r1_20261025` (A-48), exact text pairs of the baseline file: the
 * capital letter of the first word of a practice line quote (F2), and the formation words of week 1 (E49).
 * The baseline side takes each edit before the compare, so any other change of a week file still fails. Each pair
 * must match exactly once: a stale pair fails the test.
 */
const A48_SCRIPT_EDITS: Record<number, [string, string][]> = {
    8: [
        ['"sound": "nnn",\n                "pictures": [\n                  "nest"', '"sound": "/n/",\n                "pictures": [\n                  "nest"'],
        ['"sound": "mmm",\n                "pictures": [\n                  "moon"', '"sound": "/m/",\n                "pictures": [\n                  "moon"'],
        ['"sound": "sss",\n                "pictures": [\n                  "sun"', '"sound": "/s/",\n                "pictures": [\n                  "sun"'],
    ],
    1: [
        ['"\\"Start at the top. Down. Up. Over the hill. Down.\\""', '"\\"Start at the dot. Down. Up. Over the hill. Down.\\""'],
        ['"\\"เริ่มที่ด้านบน ลง ขึ้น ข้ามเนิน ลง\\""', '"\\"เริ่มที่จุด ลง ขึ้น ข้ามเนิน ลง\\""'],
        ["start at the top, down, up, over the hill, down.", "start at the dot, down, up, over the hill, down."],
        ['(เริ่มที่ด้านบน ลง ขึ้น ข้ามเนิน ลง)', '(เริ่มที่จุด ลง ขึ้น ข้ามเนิน ลง)'],
    ],
    2: [
        ['with me: an. Nan.', 'with me: An. Nan.'], ['Read the words: an. Nan.', 'Read the words: An. Nan.'],
        ['Then they count the apples in the picture and trace the number word under it: three.', 'Then they count the ducks in the picture: three.'],
        ['"\\"Count the apples. How many? Three! Trace the word three.\\""', '"\\"Count the ducks. How many? Three!\\""'],
        ['Children trace the frame and the number word.', 'Children trace the frame and count the ducks.'],
        ['จากนั้นนับแอปเปิลในภาพ และลากเส้นตามคำศัพท์ตัวเลขใต้ภาพ: three', 'จากนั้นนับเป็ดในภาพ: three'],
        ['"\\"นับแอปเปิล How many? Three! ลากเส้นตามคำ three\\""', '"\\"นับเป็ด How many? Three!\\""'],
        ['เด็ก ๆ ลากเส้นตามกรอบประโยคและคำศัพท์ตัวเลข', 'เด็ก ๆ ลากเส้นตามกรอบประโยคและนับเป็ด'],
    ],
    3: [
        ['with me: pan. Nap.', 'with me: Pan. Nap.'], ['Read the words: pan. Nap.', 'Read the words: Pan. Nap.'],
        ['children color the balloon in the second box red, blue, or yellow.', 'children draw one thing in the second box and color it red, blue, or yellow.'],
        ['"\\"Now color the balloon. What color is it? Find the word and trace it.\\""', '"\\"Now draw something and color it. What color is it? Find the word and trace it.\\""'],
        ['Children color the balloon, then find and trace the color word.', 'Children draw one thing and color it, then find and trace the color word.'],
        ['point to the balloon and ask:', 'point to the picture and ask:'],
        ['Color the balloon with the child; the child traces the word.', 'Draw and color with the child; the child traces the word.'],
        ['ระบายสีลูกโป่งพร้อมกับเด็ก แล้วให้เด็กลากเส้นตามคำ', 'วาดและระบายสีพร้อมกับเด็ก แล้วให้เด็กลากเส้นตามคำ'],
        ['เด็ก ๆ ระบายสีลูกโป่งในช่องที่สองเป็นสีแดง สีน้ำเงิน หรือสีเหลือง แล้วหาคำศัพท์สีใต้ช่องที่ตรงกับสีลูกโป่ง', 'เด็ก ๆ วาดสิ่งของ 1 อย่างในช่องที่สองและระบายสีแดง สีน้ำเงิน หรือสีเหลือง แล้วหาคำศัพท์สีใต้ช่องที่ตรงกับสีที่ระบาย'],
        ['"\\"ทีนี้ระบายสีลูกโป่ง What color is it? (สีอะไร) หาคำนั้นแล้วลากเส้นตาม\\""', '"\\"ทีนี้วาดสิ่งของแล้วระบายสี What color is it? (สีอะไร) หาคำนั้นแล้วลากเส้นตาม\\""'],
        ['เด็ก ๆ ระบายสีลูกโป่ง แล้วหาคำศัพท์สีและลากเส้นตาม', 'เด็ก ๆ วาดสิ่งของ 1 อย่างและระบายสี แล้วหาคำศัพท์สีและลากเส้นตาม'],
        ['ชี้ที่ลูกโป่งแล้วถามว่า', 'ชี้ที่ภาพแล้วถามว่า'],
    ],
    4: [['with me: am. Man.', 'with me: Am. Man.'], ['Read the words: am. Man.', 'Read the words: Am. Man.']],
    6: [['with me: sat. Mat.', 'with me: Sat. Mat.'], ['Read the words: sat. Mat.', 'Read the words: Sat. Mat.']],
    7: [['with me: on. Top.', 'with me: On. Top.'], ['Read the words: on. Top.', 'Read the words: On. Top.']],
};

/** The week file at the baseline commit, with the A-48 script edits. A failed `git show` fails the test. */
function baselineRaw(n: number): Raw {
    const file = `content/storytime/l2/w0${n}.json`;
    try {
        let raw = execFileSync('git', ['show', `${BASELINE_COMMIT}:${file}`], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
        for (const [from, to] of A48_SCRIPT_EDITS[n] ?? []) {
            if (raw.split(from).length !== 2) throw new Error(`the A-48 edit "${from}" does not match once in the baseline of w0${n}`);
            raw = raw.replace(from, () => to);
        }
        return JSON.parse(raw);
    } catch (error) {
        throw new Error(`git show ${BASELINE_COMMIT}:${file} failed: ${(error as Error).message}`);
    }
}

let weeksCache: StorytimeWeek[] | undefined;
/** The eight parsed shipped weeks of Level 2, in week order. */
function shippedWeeks(): StorytimeWeek[] {
    if (!weeksCache) {
        const read = readLevelWeeks(STORYTIME_ROOT, 2);
        const failed = read.filter((w) => !w.week);
        expect(failed.map((w) => `${w.file}: ${w.error}`), 'every shipped week parses').toEqual([]);
        weeksCache = read.map((w) => w.week!);
    }
    return weeksCache;
}
const shippedWeek = (n: number): StorytimeWeek => shippedWeeks().find((w) => w.meta.week === n)!;

/** The six (or two) loop checks of a shipped week, run the way `check-weeks.ts` runs them. */
function loopReport(n: number) {
    const known = shippedWeeks();
    const week = shippedWeek(n);
    const report = checkStorytimeWeek(week, taughtTo(known, week), undefined, known);
    return report.checks.filter((c) => c.id.startsWith('loops-'));
}

/** The words of a line. Punctuation is not a word; "don't" is one word. */
function wordCount(line: string): number {
    return (line.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)?/g) ?? []).length;
}

/** Sorts the keys of every object, recursively. The order of arrays stays. */
function sortKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys((value as Raw)[k])]));
    return value;
}

/**
 * The week without the FR-1 fields, without the two keys of the print track, and without the two media approvals. Both sides of the additive
 * compare go through this function. `dropTh` is a mutant: a deleter that also removes the Thai notes.
 */
function withoutNewFields(week: Raw, dropTh = false): Raw {
    const copy = structuredClone(week);
    for (const script of copy.scripts) {
        delete script.recall;
        for (const step of script.steps) {
            delete step.blendDrill;
            delete step.soundLoop;
            delete step.sightWords;
            delete step.loopMinutes;
            if (dropTh) delete step.th;
        }
    }
    for (const book of copy.books ?? []) delete book.questions;
    if (copy.approval) {
        delete copy.approval.loops;
        delete copy.approval.print;
        // Daniel approved the w01 audio and song on 2026-11-04, after the baseline commit; the media approvals are not loops content.
        delete copy.approval.audio;
        delete copy.approval.song;
    }
    delete copy.print;
    return copy;
}

const normalize = (week: Raw, dropTh = false): string => JSON.stringify(sortKeys(withoutNewFields(week, dropTh)));
const parsed = (raw: Raw): Raw => StorytimeWeekSchema.parse(raw);

/** Every new `BiText` of a week, with its place. */
function newBiTexts(week: StorytimeWeek): { where: string; bi: { en: string; th: string } }[] {
    const out: { where: string; bi: { en: string; th: string } }[] = [];
    for (const script of week.scripts) {
        if (script.recall) out.push({ where: `${script.id} recall.ask`, bi: script.recall.ask });
        for (const step of script.steps) {
            const d = step.blendDrill;
            if (d) for (const k of ['model', 'lead', 'test', 'correction'] as const) out.push({ where: `${step.id} blendDrill.${k}`, bi: d[k] });
            const s = step.soundLoop;
            if (s) for (const k of ['correct', 'practise', 'retest'] as const) out.push({ where: `${step.id} soundLoop.${k}`, bi: s[k] });
            const w = step.sightWords;
            if (w) for (const k of ['slide', 'check'] as const) out.push({ where: `${step.id} sightWords.${k}`, bi: w[k] });
        }
    }
    for (const book of week.books) for (const q of book.questions ?? []) out.push({ where: `${book.title} ${q.kind}.ask`, bi: q.ask });
    return out;
}

const stepsOf = (week: StorytimeWeek) => week.scripts.flatMap((s) => s.steps);

describe('the content test itself', () => {
    it('counts words: "don\'t" is one word, punctuation is not a word, and 13 words are more than 12', () => {
        expect(wordCount("Don't slide, stop!")).toBe(3);
        expect(wordCount('One two three four five six seven eight nine ten eleven twelve')).toBe(12);
        expect(wordCount('One two three four five six seven eight nine ten eleven twelve thirteen')).toBe(13);
    });

    it('compares the baseline with itself and finds a real change (falsifiers on copies)', () => {
        const base = parsed(baselineRaw(1));
        const same = normalize(base);
        const mutate = (change: (w: Raw) => void) => {
            const copy = structuredClone(base);
            change(copy);
            return copy;
        };
        const thaiStep = (w: Raw) => w.scripts[0].steps[0];
        expect(normalize(structuredClone(base))).toBe(same);
        expect(normalize(mutate((w) => (thaiStep(w).th.teacherActions[0] = 'X' + thaiStep(w).th.teacherActions[0].slice(1)))), 'one Thai character').not.toBe(same);
        expect(normalize(mutate((w) => thaiStep(w).en.teacherActions.pop())), 'one deleted line').not.toBe(same);
        expect(normalize(mutate((w) => (thaiStep(w).minutes += 1))), 'one minutes value').not.toBe(same);
        expect(normalize(mutate((w) => w.scripts[0].steps.reverse())), 'two steps reordered').not.toBe(same);
        expect(normalize(mutate((w) => thaiStep(w).th.teacherActions.reverse())), 'a Thai array reordered').not.toBe(same);
        const keysReordered = Object.fromEntries(Object.entries(structuredClone(base)).reverse());
        expect(normalize(keysReordered), 'a key reorder alone').toBe(same);
        // A deleter that also removes `th` cannot see the Thai change: the real deleter must.
        const thaiChanged = mutate((w) => (thaiStep(w).th.teacherActions[0] = 'X' + thaiStep(w).th.teacherActions[0].slice(1)));
        expect(normalize(thaiChanged, true)).toBe(normalize(base, true));
        expect(normalize(thaiChanged)).not.toBe(same);
    });

    it('has the loop checks at the status fail', () => {
        expect(LOOP_CHECK_STATUS).toBe('fail');
    });
});

for (const n of WEEK_NUMBERS) {
    const name = `w0${n}`;
    const teach = n !== 8;

    describe(`${name} content`, () => {
        it(`${name} adds only the FR-1 fields to its baseline file (additive, spec D10)`, () => {
            expect(normalize(parsed(shippedRaw(n)))).toBe(normalize(parsed(baselineRaw(n))));
        });

        it(`${name} passes ${teach ? 'the six loop checks' : 'loops-recall and loops-minutes'} with the status pass`, () => {
            const checks = loopReport(n);
            expect(checks.map((c) => c.id)).toEqual(teach ? SIX_CHECKS : REVIEW_CHECKS);
            expect(checks.filter((c) => c.status !== 'pass').map((c) => `${c.id}: ${c.status} ${c.detail ?? ''}`)).toEqual([]);
        });

        it(`${name} gives every new line English and Thai`, () => {
            const lines = newBiTexts(shippedWeek(n));
            expect(lines.length, 'the week has new lines').toBeGreaterThan(0);
            expect(lines.filter((l) => !l.bi.en.trim() || !l.bi.th.trim() || !THAI.test(l.bi.th)).map((l) => l.where)).toEqual([]);
        });

        it(`${name} fills each day to the period with loopMinutes, and only the seven loop steps change`, () => {
            const week = shippedWeek(n);
            const base = parsed(baselineRaw(n));
            expect(week.meta.periodMinutes).toBe(30);
            const baseMinutes = new Map<string, number>(stepsOf(base).map((s: Raw) => [s.id, s.minutes]));
            for (const script of week.scripts) {
                const sum = script.steps.filter((s) => !s.moved).reduce((total, s) => total + (s.loopMinutes ?? s.minutes), 0);
                expect(week.meta.openingMinutes + sum, `${script.id} day ${script.day}`).toBe(week.meta.periodMinutes);
            }
            for (const step of stepsOf(week)) {
                expect(step.minutes, `${step.id} keeps its minutes`).toBe(baseMinutes.get(step.id));
                const minutes = step.loopMinutes ?? step.minutes;
                if (!LOOP_STEP_IDS.includes(step.id)) expect(minutes, `${step.id} is not a loop step`).toBe(step.minutes);
                else if (!step.moved && teach) expect(minutes, `${step.id} has 2 minutes or more`).toBeGreaterThanOrEqual(2);
            }
            // C5 and D2 are the only loop steps of their days: their minutes stay at the baseline value.
            for (const id of teach ? ['C5', 'D2'] : []) {
                const step = stepsOf(week).find((s) => s.id === id)!;
                expect(step.loopMinutes ?? step.minutes, `${id} stays at the baseline`).toBe(baseMinutes.get(id));
            }
        });

        if (teach) {
            it(`${name} takes the loop minutes from the donors A4 and A6 of day 1 (spec Terms, D8)`, () => {
                const steps = stepsOf(shippedWeek(n));
                for (const id of ['A4', 'A6']) {
                    const step = steps.find((s) => s.id === id)!;
                    expect(step.loopMinutes, `${id} loopMinutes`).toBeDefined();
                    expect(step.loopMinutes!, `${id} gives at least one minute`).toBeLessThan(step.minutes);
                }
            });
        }

        it(`${name} repeats only short lines in class (12 words or less)`, () => {
            const long: string[] = [];
            for (const step of stepsOf(shippedWeek(n))) {
                const lines = [step.blendDrill?.lead, step.blendDrill?.test, step.sightWords?.slide, step.sightWords?.check];
                for (const line of lines) if (line && wordCount(line.en) > 12) long.push(`${step.id}: ${line.en}`);
            }
            expect(long).toEqual([]);
        });

        it(`${name} says a pure sound and never a letter name in the new English lines`, () => {
            const bad = newBiTexts(shippedWeek(n)).filter((l) => LETTER_NAME_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(l.bi.en)));
            expect(bad.map((l) => `${l.where}: ${l.bi.en}`)).toEqual([]);
        });

        it(`${name} keeps approval.loops draft, or approved with the words and the date`, () => {
            const loops = shippedWeek(n).approval.loops;
            expect(loops, 'the part exists').toBeDefined();
            expect(['draft', 'approved']).toContain(loops!.status);
            if (loops!.status === 'approved') {
                expect(loops!.words?.trim()).toBeTruthy();
                expect(loops!.date).toBeTruthy();
            }
        });

        it(`${name} puts the recall cards in every script (day 1 of week 1 has none), copied from existing strip cards`, () => {
            const week = shippedWeek(n);
            const pool = new Set(
                shippedWeeks()
                    .filter((w) => w.meta.week <= n)
                    .flatMap((w) => w.review.flatMap((strip) => strip.cards.map((c) => JSON.stringify([c.kind, c.text, c.week, c.audio ?? null])))),
            );
            // A frame card of the current week may have no strip card on every day; it still equals the focus frame.
            const frames = new Set(shippedWeeks().filter((w) => w.meta.week <= n).map((w) => w.focus.frame));
            for (const script of week.scripts) {
                if (n === 1 && script.day === 1) {
                    expect(script.recall, 'day 1 of week 1 has no recall').toBeUndefined();
                    continue;
                }
                expect(script.recall?.items.length, `${script.id} recall items`).toBe(5);
                const unknown = script.recall!.items.filter((c) => !pool.has(JSON.stringify([c.kind, c.text, c.week, c.audio ?? null])) && !(c.kind === 'frame' && frames.has(c.text)));
                expect(unknown.map((c) => `${script.id}: ${c.kind} ${c.text}`), 'every recall card exists in a strip').toEqual([]);
            }
        });

        if (teach) {
            it(`${name} puts a sound loop on A1, A2, and A3 that models the pure sound again`, () => {
                const week = shippedWeek(n);
                expect(stepsOf(week).filter((s) => s.soundLoop).map((s) => s.id)).toEqual(['A1', 'A2', 'A3']);
                for (const step of stepsOf(week).filter((s) => s.soundLoop)) {
                    expect(step.soundLoop!.correct.en.toLowerCase(), `${step.id} correct line`).toContain(WEEK_SOUND[n]);
                }
            });

            it(`${name} puts the blend drill on A4 only, with 3 repeats and a recording for each sound`, () => {
                const week = shippedWeek(n);
                expect(stepsOf(week).filter((s) => s.blendDrill).map((s) => s.id)).toEqual(['A4']);
                const drill = stepsOf(week).find((s) => s.id === 'A4')!.blendDrill!;
                expect(drill.repeats).toBe(3);
                expect(drill.words.length).toBeGreaterThanOrEqual(3);
                for (const w of drill.words) {
                    expect(w.sounds.every((s) => /^\/[a-z-]+\/$/.test(s)), `${w.word} sounds are written as /x/`).toBe(true);
                    expect(w.audio?.length, `${w.word} has one recording for each sound`).toBe(w.sounds.length);
                }
                const bank = readPhonemeBank();
                expect(bank, 'the phoneme bank exists').toBeDefined();
                expect(phonemeAudioFields(week, bank!).unresolved, 'every drill sound is in the bank').toEqual([]);
                expect(phonemeAudioProblems(week, bank!), 'the drill recordings match the bank').toEqual([]);
            });

            it(`${name} puts the sight words on A6 and D2 only when the week has tricky words, 3 seconds each`, () => {
                const week = shippedWeek(n);
                const holders = stepsOf(week).filter((s) => s.sightWords).map((s) => s.id);
                if (!week.focus.trickyWords.length) {
                    expect(holders).toEqual([]);
                    return;
                }
                expect(holders).toEqual(['A6', 'D2']);
                for (const step of stepsOf(week).filter((s) => s.sightWords)) {
                    const sight = step.sightWords!;
                    expect(sight.words, `${step.id} words`).toEqual(week.focus.trickyWords);
                    expect(sight.seconds).toBe(3);
                    expect(sight.slide.en, `${step.id} slide line`).toMatch(/slide/i);
                    expect(sight.slide.en, `${step.id} slide line`).toMatch(/finger/i);
                    expect(sight.slide.en, `${step.id} slide line`).toMatch(/read it the fast way/i);
                    expect(sight.check.en, `${step.id} check line names the seconds`).toContain(String(sight.seconds));
                }
            });

            it(`${name} asks who, what, and where about the read-along, with an answer on a page`, () => {
                const week = shippedWeek(n);
                const readAlong = week.books.find((b) => b.kind === 'readalong')!;
                expect(readAlong.questions?.map((q) => q.kind)).toEqual(['who', 'what', 'where']);
                for (const q of readAlong.questions!) {
                    expect(q.answer.page, `${q.kind} page`).toBeGreaterThanOrEqual(1);
                    expect(q.answer.page, `${q.kind} page`).toBeLessThanOrEqual(readAlong.pages.length);
                    const text = readAlong.pages[q.answer.page - 1].text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
                    expect(text, `${q.kind} word on its page`).toContain(q.answer.word.toLowerCase());
                }
                for (const book of week.books.filter((b) => b !== readAlong)) expect(book.questions, 'the decodable has no questions').toBeUndefined();
            });
        } else {
            it(`${name} has the recall and nothing else (the review week, spec D11)`, () => {
                const week = shippedWeek(n);
                for (const step of stepsOf(week)) {
                    expect(step.blendDrill, step.id).toBeUndefined();
                    expect(step.soundLoop, step.id).toBeUndefined();
                    expect(step.sightWords, step.id).toBeUndefined();
                    expect(step.loopMinutes ?? step.minutes, `${step.id} minutes`).toBe(step.minutes);
                }
                for (const book of week.books) expect(book.questions).toBeUndefined();
                expect(week.scripts.map((s) => s.recall?.items.length)).toEqual([5, 5, 5, 5, 5]);
            });
        }
    });
}
