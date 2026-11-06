// @vitest-environment node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as checksModule from '../lib/storytime/checks';
import { checkStorytimeWeek, taughtTo } from '../lib/storytime/checks';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { REVIEW_WEEK, SAMPLE_THAI, sampleShare } from './fixtures/storytime-share-sample';

// Phase 3b Red 1 of track storytime_teaching_loops_20261103 (FR-14): the `share` field of a script, the
// check `share-moment`, and the rules 1 to 7 of the spec. The test loads the shipped weeks w01 to w08 as
// the base (rule 11.3) and writes the moment table of the sample file on copies. It never edits a shipped
// week file, and it never writes into `content/`.
//
// Red notes. The schema has no `share` field and the check has no `share-moment` row at HEAD, so most of
// the tests fail. The constant `SHARE_CHECK_STATUS` is reached through a namespace import with a cast, so
// a missing export is a failed assertion and not a type error (F11). The `share` field is reached through
// an untyped helper, so `tsc` passes before and after the Green task.
//
// Every data mutant runs on a copy of a week file. The copy goes into a folder from `fs.mkdtemp` under
// `/tmp/opencode`, and the folder is removed after the run. A guard test proves that the shipped week
// files keep their hash and that `content/storytime` stays clean.
//
// Thai rule (test-strategy 9.4, item 6). This file holds no Thai literal. The Thai text of a mutant comes
// from the placeholder of the sample file, and a test asserts only that the check reports a problem, never
// what the Thai says.

type PackageReport = ReturnType<typeof checkStorytimeWeek>;
type RawWeek = any;

/** One shot of a copy: the step and the media, both of them any text, because the mutants use a bad media. */
interface RawShot {
    step: string;
    media: string;
}

/** The eight Level 2 weeks. */
const WEEK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

/** The check id of the share moment (FR-14). */
const SHARE_ID = 'share-moment';

/** The 17 media file extensions of the Monorepo `MEDIA_EXTENSION` (FR-14, rule 7). */
const MEDIA_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'opus', 'mp4', 'm4v', 'webm', 'mov', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf'];

/** The unknown keys that the strict share objects must refuse (FR-14, AC-14.1). */
const EXTRA_KEYS = ['minutes', 'file', 'path', 'image', 'audio', 'child', 'name', 'note'];

/** The repository root: the content folder sits in it. */
const REPO_ROOT = path.resolve(STORYTIME_ROOT, '..', '..');

/** The English caption of a caption mutant that only changes the Thai. */
const PLAIN_CAPTION = 'A caption for the test.';

/**
 * The words of a caption, counted as the rule 6 of FR-14 counts them: trim, split on runs of white space,
 * and count the non-empty parts (decision Q13). The test types its own counter and never imports the
 * counter of the check (anti-pattern A3).
 * @param line The text of the caption.
 * @returns The number of words.
 */
function words(line: string): number {
    return line.trim().split(/\s+/).filter(Boolean).length;
}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** The raw JSON of a shipped Level 2 week. */
function shippedWeek(week: number): RawWeek {
    return JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), 'utf8'));
}

/** The eight shipped weeks, parsed. They are the `others` argument of the check. */
let knownCache: StorytimeWeek[] | undefined;
function known(): StorytimeWeek[] {
    knownCache ??= WEEK_NUMBERS.map((n) => StorytimeWeekSchema.parse(shippedWeek(n)));
    return knownCache;
}

/** The base folder of the temporary copies: the agent workspace of the run. */
const TEMP_BASE = fs.existsSync('/tmp/opencode') ? '/tmp/opencode' : os.tmpdir();

let tempDir = '';
let copyCount = 0;

beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(TEMP_BASE, 'storytime-share-'));
});

afterAll(() => {
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

/**
 * Writes a copy of a week into the temporary folder and reads it back.
 * @param raw The copy of the week.
 * @returns The copy as it comes back from the disk.
 */
function store(raw: RawWeek): RawWeek {
    const file = path.join(tempDir, `copy-${++copyCount}.json`);
    fs.writeFileSync(file, JSON.stringify(raw));
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** A copy of a shipped week with the sample moment of the sample file on every script. */
function shareComplete(week: number): RawWeek {
    const raw = copy(shippedWeek(week));
    for (const script of raw.scripts) script.share = sampleShare(week, script.id);
    return raw;
}

/** The script of a day of a copy. */
function scriptOfDay(raw: RawWeek, day: number): RawWeek {
    return raw.scripts.find((s: RawWeek) => s.day === day);
}

/** The moment of a day of a copy: it is removed when the value is null. */
function setShare(raw: RawWeek, day: number, share: unknown | null): void {
    const script = scriptOfDay(raw, day);
    if (share === null) delete script.share;
    else script.share = copy(share);
}

/** The shots of the moment of a day of a copy. */
function setShots(raw: RawWeek, day: number, shots: RawShot[]): void {
    scriptOfDay(raw, day).share.shots = copy(shots);
}

/** A copy of a week whose every moment holds the given shots. */
function withShots(week: number, shots: RawShot[]): RawWeek {
    const raw = shareComplete(week);
    for (const script of raw.scripts) script.share.shots = copy(shots);
    return raw;
}

/** A copy of a week whose every moment holds the given shot. */
function withShot(week: number, shot: RawShot): RawWeek {
    return withShots(week, [shot]);
}

/** A copy of a week whose every shot names the given step. */
function withShotStep(week: number, step: string): RawWeek {
    return withShot(week, { step, media: 'video' });
}

/** A copy of a week whose every shot holds the given media. */
function withShotMedia(week: number, media: string): RawWeek {
    return withShot(week, { step: 'A3', media });
}

/** A copy of a week whose every moment holds the given caption. */
function withCaption(week: number, caption: unknown): RawWeek {
    const raw = shareComplete(week);
    for (const script of raw.scripts) script.share.caption = copy(caption);
    return raw;
}

/** A copy of a week whose every caption holds the given English text. */
function withCaptionEn(week: number, en: string): RawWeek {
    return withCaption(week, { en, th: SAMPLE_THAI });
}

/** A copy of a week whose every caption holds the given Thai text. */
function withCaptionTh(week: number, th: string): RawWeek {
    return withCaption(week, { en: PLAIN_CAPTION, th });
}

/** A copy of a week whose every moment holds the given extra key. */
function withShareKey(week: number, key: string): RawWeek {
    const raw = shareComplete(week);
    for (const script of raw.scripts) script.share[key] = 'x';
    return raw;
}

/** A copy of a week whose every shot holds the given extra key. */
function withShotKey(week: number, key: string): RawWeek {
    const raw = shareComplete(week);
    for (const script of raw.scripts) script.share.shots[0][key] = 'x';
    return raw;
}

/** A Level 1 copy of week 1: the script ids L to P, and no decodable (design §3.4). */
function levelOneCopy(): RawWeek {
    const raw = shareComplete(1);
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

/** A Level 3 copy of a week: the period of 49 minutes, and the script ids A to E (D27). */
function levelThreeCopy(week: number): RawWeek {
    const raw = shareComplete(week);
    raw.meta.level = 3;
    raw.meta.key = `st3/${week}`;
    raw.meta.periodMinutes = 49;
    raw.meta.openingMinutes = 8;
    return raw;
}

/** The parse of a copy of a week: the copy goes through the temporary folder. */
function parses(raw: RawWeek): boolean {
    return StorytimeWeekSchema.safeParse(store(raw)).success;
}

/** The report of a copy of a week, with the taught set and the other weeks. */
function reportOf(raw: RawWeek): PackageReport {
    const stored = store(raw);
    const parsed = StorytimeWeekSchema.parse(stored);
    return checkStorytimeWeek(stored, taughtTo(known(), parsed), undefined, known());
}

/** The check with the given id. */
function check(report: PackageReport, id: string, where = ''): RawWeek {
    const found = report.checks.find((c) => c.id === id);
    expect(found, `Missing check: ${id}${where ? ` (${where})` : ''}`).toBeDefined();
    return found!;
}

/** The check passes. */
function expectPass(report: PackageReport, id: string, where = ''): void {
    expect(check(report, id, where).status, `${id} passes${where ? ` on ${where}` : ''}`).toBe('pass');
}

/**
 * The check reports a problem with the status of `SHARE_CHECK_STATUS` and a detail that names it.
 * @param report The report of the copy.
 * @param id The check id.
 * @param where The name of the case, in the message.
 */
function expectProblem(report: PackageReport, id: string, where = ''): void {
    const found = check(report, id, where);
    expect(found.status, `${id} reports${where ? ` on ${where}` : ''}`).toBe(shareStatus());
    expect(found.status, `${id} does not pass${where ? ` on ${where}` : ''}`).not.toBe('pass');
    expect(typeof found.detail, `${id} names the problem${where ? ` on ${where}` : ''}`).toBe('string');
    expect((found.detail ?? '').length, `${id} names the problem${where ? ` on ${where}` : ''}`).toBeGreaterThan(0);
}

/** The days that the detail of the check names (decision Q14: every problem starts with `day <d>: `). */
function namedDays(detail: string | undefined): number[] {
    return [...(detail ?? '').matchAll(/day (\d+):/g)].map((m) => Number(m[1]));
}

/** The check names no problem of the given day. */
function expectNoProblemForDay(report: PackageReport, day: number, where: string): void {
    const found = check(report, SHARE_ID, where);
    if (found.status === 'pass') return;
    expect(namedDays(found.detail ?? ''), `share-moment names no problem of day ${day} (${where})`).not.toContain(day);
}

/** `SHARE_CHECK_STATUS`, reached through a namespace import so a missing export is an assertion. */
function shareStatus(): string {
    const mod = checksModule as unknown as Record<string, unknown>;
    const value = mod.SHARE_CHECK_STATUS;
    expect(value, 'Missing export: SHARE_CHECK_STATUS').toBeDefined();
    return value as string;
}

/** The SHA-256 of each shipped week file, at the start of the run. */
const SHIPPED_HASHES = new Map<number, string>(
    WEEK_NUMBERS.map((week) => [week, createHash('sha256').update(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week))).digest('hex')] as [number, string]),
);

/** The git status of the content folder. It must stay empty. */
function contentStatus(): string {
    return execFileSync('git', ['status', '--porcelain', 'content/storytime'], { cwd: REPO_ROOT, encoding: 'utf8' });
}

/** A caption of the given number of words. */
function captionOfWords(count: number): string {
    return Array.from({ length: count }, (_, i) => `w${i + 1}`).join(' ');
}

describe('the share field of a script', () => {
    it('J1: the eight shipped weeks parse, and no script of them has a share', () => {
        for (const week of WEEK_NUMBERS) {
            const raw = shippedWeek(week);
            expect(StorytimeWeekSchema.safeParse(raw).success, `w0${week} parses`).toBe(true);
            const withoutShare = copy(raw);
            for (const script of withoutShare.scripts) delete script.share;
            const parsed = StorytimeWeekSchema.parse(store(withoutShare)) as RawWeek;
            for (const script of parsed.scripts) expect(script.share, `w0${week} ${script.id} share`).toBeUndefined();
        }
    });

    it('J2: a share-complete copy of each week parses, and the parsed share equals the sample', () => {
        for (const week of WEEK_NUMBERS) {
            const stored = store(shareComplete(week));
            expect(StorytimeWeekSchema.safeParse(stored).success, `the w0${week} copy parses`).toBe(true);
            const parsed = StorytimeWeekSchema.parse(stored) as RawWeek;
            expect(
                parsed.scripts.map((s: RawWeek) => s.share),
                `the shares of w0${week}`,
            ).toEqual(parsed.scripts.map((s: RawWeek) => sampleShare(week, s.id)));
        }
    });

    it('J3: a moment holds one or two shots, and refuses zero and three', () => {
        expect(parses(withShots(1, [{ step: 'A3', media: 'video' }])), 'one shot').toBe(true);
        expect(
            parses(
                withShots(1, [
                    { step: 'A3', media: 'video' },
                    { step: 'A4', media: 'photo' },
                ]),
            ),
            'two shots',
        ).toBe(true);
        expect(parses(withShots(1, [])), 'zero shots').toBe(false);
        expect(
            parses(
                withShots(1, [
                    { step: 'A3', media: 'video' },
                    { step: 'A4', media: 'photo' },
                    { step: 'A5', media: 'video' },
                ]),
            ),
            'three shots',
        ).toBe(false);
    });

    it('J3: a shot holds the media photo or video, and refuses audio, Photo, and the empty string', () => {
        expect(parses(withShotMedia(1, 'photo')), 'photo').toBe(true);
        expect(parses(withShotMedia(1, 'video')), 'video').toBe(true);
        expect(parses(withShotMedia(1, 'audio')), 'audio').toBe(false);
        expect(parses(withShotMedia(1, 'Photo')), 'Photo').toBe(false);
        expect(parses(withShotMedia(1, '')), 'the empty media').toBe(false);
    });

    it('J3: a step id holds the form A1, and refuses the other forms', () => {
        for (const step of ['A1', 'A12', 'Z9']) expect(parses(withShotStep(1, step)), step).toBe(true);
        for (const step of ['a3', 'A', '1A', 'A123', 'AA1', 'A1 ', ' A3', '']) expect(parses(withShotStep(1, step)), `the step ${JSON.stringify(step)}`).toBe(false);
    });

    it('J4: a share and a shot refuse an unknown key, and hold only their own keys', () => {
        for (const key of EXTRA_KEYS) {
            expect(parses(withShareKey(1, key)), `the share key ${key}`).toBe(false);
            expect(parses(withShotKey(1, key)), `the shot key ${key}`).toBe(false);
        }
        const parsed = StorytimeWeekSchema.parse(store(shareComplete(1))) as RawWeek;
        expect(Object.keys(parsed.scripts[0].share).sort(), 'the keys of a share').toEqual(['caption', 'shots']);
        expect(Object.keys(parsed.scripts[0].share.shots[0]).sort(), 'the keys of a shot').toEqual(['media', 'step']);
    });

    it('J5: a caption holds English and Thai, and the English needs one character', () => {
        expect(parses(withCaption(1, { en: '' })), 'an empty English caption').toBe(false);
        expect(parses(withCaption(1, { en: '   ', th: 'x' })), 'a caption of spaces').toBe(true);
        expect(parses(withCaption(1, { en: 'x' })), 'a caption without Thai').toBe(true);
        expect(parses(withCaption(1, 'a plain string')), 'a plain string').toBe(false);
        const parsed = StorytimeWeekSchema.parse(store(withCaption(1, { en: 'x' }))) as RawWeek;
        expect(parsed.scripts[0].share.caption.th, 'the Thai of a caption without Thai').toBe('');
    });
});

describe('the check share-moment', () => {
    it('J6: a share-complete copy of each week passes the check', () => {
        for (const week of WEEK_NUMBERS) expectPass(reportOf(shareComplete(week)), SHARE_ID, `w0${week}`);
    });

    it('J7: a day without a moment reports, and the detail names that day only', () => {
        for (const day of [1, 2, 3, 4, 5]) {
            const raw = shareComplete(1);
            setShare(raw, day, null);
            const report = reportOf(raw);
            expectProblem(report, SHARE_ID, `w01 day ${day} without a moment`);
            const detail = check(report, SHARE_ID).detail ?? '';
            expect(detail.startsWith(`day ${day}: `), `the detail starts with "day ${day}: "`).toBe(true);
            expect(namedDays(detail), `the detail names day ${day} only`).toEqual([day]);
        }
    });

    it('J8: a shot names a step of its own script, or a moved step of the day before', () => {
        const unknown = shareComplete(1);
        setShots(unknown, 1, [{ step: 'A9', media: 'video' }]);
        expectProblem(reportOf(unknown), SHARE_ID, 'a step of no script');

        const later = shareComplete(1);
        setShots(later, 1, [{ step: 'B1', media: 'video' }]);
        expectProblem(reportOf(later), SHARE_ID, 'a step of a later script');

        const notMoved = shareComplete(1);
        setShots(notMoved, 3, [{ step: 'B5', media: 'video' }]);
        expectProblem(reportOf(notMoved), SHARE_ID, 'a step of the day before that is not moved');

        const moved = shareComplete(1);
        setShots(moved, 5, [{ step: 'D6', media: 'video' }]);
        expectNoProblemForDay(reportOf(moved), 5, 'the moved step D6 of the day before');

        const ownMoved = shareComplete(1);
        expectNoProblemForDay(reportOf(ownMoved), 4, 'the steps D4 and D5');
    });

    it('J9: a day needs one shot in the period of the day', () => {
        const onlyMoved = shareComplete(1);
        setShots(onlyMoved, 2, [{ step: 'B6', media: 'video' }]);
        expectProblem(reportOf(onlyMoved), SHARE_ID, 'day 2 with the moved step B6 only');

        const withPeriod = shareComplete(1);
        setShots(withPeriod, 2, [
            { step: 'B6', media: 'video' },
            { step: 'B5', media: 'video' },
        ]);
        expectNoProblemForDay(reportOf(withPeriod), 2, 'the steps B6 and B5');

        const nextDay = shareComplete(1);
        setShots(nextDay, 5, [{ step: 'D6', media: 'video' }]);
        expectNoProblemForDay(reportOf(nextDay), 5, 'the moved step D6 of the day before');
    });

    it('J10: two shots of a day name two different steps', () => {
        const same = shareComplete(1);
        setShots(same, 4, [
            { step: 'D4', media: 'photo' },
            { step: 'D4', media: 'video' },
        ]);
        expectProblem(reportOf(same), SHARE_ID, 'two shots with the same step');

        const different = shareComplete(1);
        setShots(different, 1, [
            { step: 'A3', media: 'video' },
            { step: 'A6', media: 'video' },
        ]);
        expectNoProblemForDay(reportOf(different), 1, 'two steps with the same media');
    });

    it('J11: a shot names no assessment step', () => {
        const teachCheck = shareComplete(1);
        setShots(teachCheck, 5, [{ step: 'E5', media: 'video' }]);
        expectProblem(reportOf(teachCheck), SHARE_ID, 'the Friday check of a teach week');

        const teachSound = shareComplete(1);
        setShots(teachSound, 1, [{ step: 'A1', media: 'video' }]);
        expectNoProblemForDay(reportOf(teachSound), 1, 'the step A1 of a teach week');

        const reviewPaper = shareComplete(REVIEW_WEEK);
        setShots(reviewPaper, 1, [{ step: 'A1', media: 'video' }]);
        expectProblem(reportOf(reviewPaper), SHARE_ID, 'the benchmark paper of a review week');

        const reviewSong = shareComplete(REVIEW_WEEK);
        setShots(reviewSong, 5, [{ step: 'E3', media: 'video' }]);
        expectNoProblemForDay(reportOf(reviewSong), 5, 'the step E3 of a review week');
    });

    it('J12: the caption of the sample holds 12 English words', () => {
        for (const week of WEEK_NUMBERS) {
            for (const script of shareComplete(week).scripts) {
                expect(words(script.share.caption.en), `w0${week} ${script.id} caption words`).toBe(12);
            }
        }
    });

    it('J12: a caption holds 1 to 40 English words and a Thai text', () => {
        expect(words('one'), 'the counter counts one word').toBe(1);
        expect(words('   '), 'the counter counts no word in spaces').toBe(0);
        expect(words("don't"), 'the counter counts a contraction as one word').toBe(1);
        expect(words(captionOfWords(40)), 'the counter counts 40 words').toBe(40);

        expectNoProblemForDay(reportOf(withCaptionEn(1, 'Word')), 1, 'a caption of one word');
        expectNoProblemForDay(reportOf(withCaptionEn(1, captionOfWords(40))), 1, 'a caption of 40 words');
        expectProblem(reportOf(withCaptionEn(1, captionOfWords(41))), SHARE_ID, 'a caption of 41 words');
        expectProblem(reportOf(withCaptionEn(1, '     ')), SHARE_ID, 'a caption of spaces only');
        expectNoProblemForDay(reportOf(withCaptionEn(1, captionOfWords(40).replace(' ', '  '))), 1, 'a caption of 40 words with a double space');
        expectNoProblemForDay(reportOf(withCaptionEn(1, ` ${captionOfWords(40)}\n`)), 1, 'a caption of 40 words with a leading space and a newline');

        expectProblem(reportOf(withCaptionTh(1, '')), SHARE_ID, 'a caption with no Thai');
        expectProblem(reportOf(withCaptionTh(1, '   ')), SHARE_ID, 'a caption with Thai of spaces');
        expectNoProblemForDay(reportOf(withCaptionTh(1, 'x')), 1, 'a caption with a Thai text');
    });

    it('J13: no caption string ends in a media file extension', () => {
        for (const extension of MEDIA_EXTENSIONS) {
            expectProblem(reportOf(withCaptionEn(1, `Look at the clip x.${extension}`)), SHARE_ID, `an English caption that ends in .${extension}`);
            expectProblem(reportOf(withCaptionTh(1, `${SAMPLE_THAI} x.${extension}`)), SHARE_ID, `a Thai caption that ends in .${extension}`);
        }
        expectProblem(reportOf(withCaptionEn(1, 'Look at the clip x.MP4')), SHARE_ID, 'an English caption that ends in .MP4');
        expectNoProblemForDay(reportOf(withCaptionEn(1, 'The file x mp4 is a word')), 1, 'a caption with x mp4');
        expectNoProblemForDay(reportOf(withCaptionEn(1, 'The file x.mp4 y is a sentence')), 1, 'a caption with x.mp4 y');
    });

    it('J14: every problem of the check has the status SHARE_CHECK_STATUS', () => {
        const status = shareStatus();
        expect(['warn', 'fail'], 'the constant is warn or fail').toContain(status);
        const missing = shareComplete(1);
        setShare(missing, 2, null);
        const unknownStep = shareComplete(1);
        setShots(unknownStep, 1, [{ step: 'A9', media: 'video' }]);
        const noPeriod = shareComplete(1);
        setShots(noPeriod, 2, [{ step: 'B6', media: 'video' }]);
        const sameStep = shareComplete(1);
        setShots(sameStep, 4, [
            { step: 'D4', media: 'photo' },
            { step: 'D4', media: 'video' },
        ]);
        const assessment = shareComplete(1);
        setShots(assessment, 5, [{ step: 'E5', media: 'video' }]);
        const longCaption = withCaptionEn(1, captionOfWords(41));
        const mediaCaption = withCaptionEn(1, 'Look at the clip x.mp4');
        const cases: [string, RawWeek][] = [
            ['a day without a moment', missing],
            ['a step of no script', unknownStep],
            ['a day without a shot in the period', noPeriod],
            ['two shots with the same step', sameStep],
            ['an assessment step', assessment],
            ['a caption of 41 words', longCaption],
            ['a caption that ends in a media file', mediaCaption],
        ];
        for (const [where, raw] of cases) {
            expect(check(reportOf(raw), SHARE_ID, where).status, `the status of ${where}`).toBe(status);
        }
    });

    it('J15: a Level 1 week has no share-moment row, and a Level 3 week has one', () => {
        const levelOne = reportOf(levelOneCopy());
        expect(levelOne.checks.map((c) => c.id), 'the check ids of a Level 1 week').not.toContain(SHARE_ID);
        const levelThree = reportOf(levelThreeCopy(1));
        expect(levelThree.checks.map((c) => c.id), 'the check ids of a Level 3 week').toContain(SHARE_ID);
    });

    it('J16: the share-moment row comes before the published row', () => {
        for (const week of WEEK_NUMBERS) {
            const ids = reportOf(shippedWeek(week)).checks.map((c) => c.id);
            const shareIndex = ids.indexOf(SHARE_ID);
            expect(shareIndex, `w0${week} has a share-moment row`).toBeGreaterThanOrEqual(0);
            const publishedIndex = ids.indexOf('published');
            if (publishedIndex >= 0) expect(shareIndex, `w0${week}: share-moment comes before published`).toBeLessThan(publishedIndex);
        }
    });

    it('J16: a published week with a broken moment blocks the publication at the status fail', () => {
        const status = shareStatus();
        const raw = shareComplete(1);
        setShare(raw, 3, null);
        const published = check(reportOf(raw), 'published', 'w01 with a broken moment');
        if (status === 'warn') {
            expect(published.status, 'published passes while the share check warns').toBe('pass');
        } else {
            expect(published.status, 'published fails when the share check fails').toBe('fail');
            expect(published.detail ?? '', 'the detail of published names the share check').toContain(`${SHARE_ID} fails`);
        }
    });
});

describe('the share moment and the lesson minutes', () => {
    it('J17: the share field adds no minutes to any week', () => {
        for (const week of WEEK_NUMBERS) {
            const without = reportOf(shippedWeek(week));
            const withShare = reportOf(shareComplete(week));
            for (const id of ['minutes', 'loops-minutes']) {
                const before = check(without, id, `w0${week}`);
                const after = check(withShare, id, `w0${week}`);
                expect(after.status, `the status of ${id} on w0${week}`).toBe(before.status);
                expect(after.detail ?? '', `the detail of ${id} on w0${week}`).toBe(before.detail ?? '');
            }
        }
    });

    it('J17: the compare of the minute rows can fail', () => {
        const raw = shareComplete(1);
        const step = raw.scripts[0].steps.find((s: RawWeek) => s.id === 'A4');
        step.loopMinutes = (step.loopMinutes ?? step.minutes) + 1;
        const before = check(reportOf(shippedWeek(1)), 'loops-minutes', 'w01');
        const after = check(reportOf(raw), 'loops-minutes', 'w01 with a changed minute');
        expect(after.detail ?? '', 'the changed minute shows in the detail').not.toBe(before.detail ?? '');
    });
});

describe('the shipped week files', () => {
    it('J18: the week files keep their hash, and the test writes nothing into the content folder', () => {
        for (const week of WEEK_NUMBERS) {
            const hash = createHash('sha256').update(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week))).digest('hex');
            expect(hash, `the hash of w0${week}`).toBe(SHIPPED_HASHES.get(week));
        }
        expect(contentStatus(), 'the content folder is clean').toBe('');
    });
});
