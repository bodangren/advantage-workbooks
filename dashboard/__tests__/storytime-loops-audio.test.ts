// @vitest-environment node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PHONEME_BANK_DIR, phonemeAudioFields, phonemeAudioProblems, setPhonemeAudio, type PhonemeBank } from '../lib/storytime/phonemes';
import { readPhonemeBank, STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { SAMPLE_DRILLS, TEACH_WEEKS } from './fixtures/storytime-loops-sample';

// Phase 1 Red 3 of track storytime_teaching_loops_20261103 (strategy 5.9, cases D1 to D5 and the G3 guard):
// the drill sounds of step A4 in the phoneme bank. The test loads a shipped week as the base (rule 11.3),
// removes the FR-1 fields, and writes the sample drill of `fixtures/storytime-loops-sample.ts` on A4 only.
// It never edits a shipped week file or the bank. Each data copy goes through a folder from `fs.mkdtemp`.
//
// Red notes: `phonemeAudioFields` does not read `blendDrill` at HEAD. Every test reaches the missing
// behavior through the existing exports, so a missing feature gives a failed assertion and not a type
// error. The audio key `blendDrill.words[].audio` exists in the schema already (Phase 1 Green 1).
//
// Mutants of strategy 5.9 (the Green role runs them in the tree with a backup and `cmp`):
//   A1 the drill is not listed: D1, D4 (field count), G3 (path count).
//   A2 only the first sound of a word: D1 (value), D2 (differs case).
//   A3 the sounds in reverse order: D1 (value and order), D2 (differs case).
//   A4 an unbanked drill sound dropped without `unresolved`: D2 (no recording), D5 (throws).
//   A5 the value is a string and not a list: D1 (value), D2.
//   A6 `setPhonemeAudio` does not write the drill: D4, G3.
//   A7 the script index is used for the step index: D1 (the numeric path; A is script 0, A4 is step 3).

type RawWeek = any;

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sha256 = (data: string | Buffer): string => createHash('sha256').update(data).digest('hex');

/** The temporary folder of the data copies. It is removed after the run. */
let tempDir = '';
let copyCount = 0;

beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-loops-audio-'));
});

afterAll(() => {
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

/** The SHA-256 of each shipped week file and of the bank manifest, at the start of the run. */
const MANIFEST_FILE = path.join(STORYTIME_ROOT, PHONEME_BANK_DIR, 'manifest.json');
const SHIPPED_HASHES = new Map<string, string>([
    ...Array.from({ length: 8 }, (_, i) => [storytimeWeekFile(STORYTIME_ROOT, 2, i + 1), ''] as [string, string]),
    [MANIFEST_FILE, ''],
]);
for (const file of SHIPPED_HASHES.keys()) SHIPPED_HASHES.set(file, sha256(fs.readFileSync(file)));

/** The raw JSON of a shipped Level 2 week. */
function shippedWeek(week: number): RawWeek {
    return JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), 'utf8'));
}

/** The FR-1 fields that Phase 3 adds to the shipped weeks: removed, so the base is the same before and after Phase 3. */
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

/** A shipped week without the FR-1 fields, read back from a copy file in the temporary folder. */
function baseCopy(week: number): RawWeek {
    const file = path.join(tempDir, `base-${++copyCount}.json`);
    fs.writeFileSync(file, JSON.stringify(stripLoops(shippedWeek(week))));
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** A base copy with the sample drill of the week on step A4 (the drill has no `audio` key yet). */
function drillCopy(week: number): RawWeek {
    const raw = baseCopy(week);
    const a4 = raw.scripts[0].steps.find((s: RawWeek) => s.id === 'A4');
    a4.blendDrill = copy(SAMPLE_DRILLS[week]);
    return raw;
}

const parse = (raw: RawWeek): StorytimeWeek => StorytimeWeekSchema.parse(copy(raw));

/** The real bank of the Storytime content folder (the manifest of Daniel's 45 recordings). */
function realBank(): PhonemeBank {
    const bank = readPhonemeBank();
    expect(bank, 'Missing phoneme bank in content/storytime').toBeDefined();
    return bank!;
}

/** The label of a drill sound that the bank lacks (D2, D5). The opening lines of w02 do not use it. */
const UNBANKED = '/zh/';

/** A drill copy of w02 whose second word (hat) holds a first sound that the bank lacks. */
function unbankedCopy(): RawWeek {
    const raw = drillCopy(2);
    raw.scripts[0].steps[3].blendDrill.words[1].sounds[0] = UNBANKED;
    expect(realBank().files.has(UNBANKED), `the bank lacks ${UNBANKED}`).toBe(false);
    return raw;
}

const bankPath = (name: string): string => `${PHONEME_BANK_DIR}/${name}`;

/** The week 2 drill, hand-written against the manifest: cat, hat, and fan (k, a, t; h, a, t; f, a, n). */
const W2_PATH = (i: number) => ['scripts', 0, 'steps', 3, 'blendDrill', 'words', i, 'audio'];
const W2_AUDIO: string[][] = [
    [bankPath('08-c-k.mp3'), bankPath('26-a-short.mp3'), bankPath('02-t.mp3')],
    [bankPath('10-h.mp3'), bankPath('26-a-short.mp3'), bankPath('02-t.mp3')],
    [bankPath('12-f.mp3'), bankPath('26-a-short.mp3'), bankPath('04-n.mp3')],
];

/** The fields of a week that belong to the drill. */
const drillFields = (week: StorytimeWeek, bank: PhonemeBank) =>
    phonemeAudioFields(week, bank).fields.filter((f) => f.path.includes('blendDrill'));

/** The drill audio of a raw week, as a flat list of paths (the words in order, the sounds in order). */
const drillAudioOf = (raw: RawWeek): string[] =>
    raw.scripts.flatMap((s: RawWeek) => s.steps.flatMap((st: RawWeek) => (st.blendDrill?.words ?? []).flatMap((w: RawWeek) => w.audio ?? [])));

describe('storytime loops: the drill sounds in the phoneme bank (D1)', () => {
    it('lists one field for each drill word of the loop-complete w02 copy, with its sounds in order', () => {
        const bank = realBank();
        const { fields, unresolved } = phonemeAudioFields(parse(drillCopy(2)), bank);
        expect(unresolved, 'no drill sound is unresolved').toEqual([]);
        const drill = fields.filter((f) => f.path.includes('blendDrill'));
        expect(drill.length, 'Drill fields: one for each of the 3 words').toBe(3);
        expect(drill.map((f) => f.path)).toEqual([0, 1, 2].map(W2_PATH));
        expect(drill.map((f) => f.value)).toEqual(W2_AUDIO);
        // The 9 fields of the shipped w02 stay, so the drill adds 3 fields (A1).
        expect(fields.length, 'Fields of w02 with the drill').toBe(12);
    });

    it('finds the drill step by its place and not by the script index (A7)', () => {
        const raw = drillCopy(2);
        const scriptIndex = raw.scripts.findIndex((s: RawWeek) => s.steps.some((st: RawWeek) => st.id === 'A4'));
        const stepIndex = raw.scripts[scriptIndex].steps.findIndex((st: RawWeek) => st.id === 'A4');
        expect([scriptIndex, stepIndex], 'A4 is step 3 of script 0').toEqual([0, 3]);
        const paths = drillFields(parse(raw), realBank()).map((f) => f.path);
        expect(paths.length, 'Drill fields of w02').toBe(3);
        expect(paths[0]?.slice(0, 4)).toEqual(['scripts', scriptIndex, 'steps', stepIndex]);
    });

    it('gives each word of w01 to w07 a list of bank paths with one path for each sound', () => {
        const bank = realBank();
        for (const week of TEACH_WEEKS) {
            const drill = SAMPLE_DRILLS[week];
            const fields = drillFields(parse(drillCopy(week)), bank);
            expect(fields.length, `w0${week}: one field for each drill word`).toBe(drill.words.length);
            fields.forEach((field, i) => {
                const value = field.value as string[];
                expect(Array.isArray(value), `w0${week} word ${i}: the value is a list`).toBe(true);
                expect(value.length, `w0${week} ${drill.words[i].word}: one path for each sound`).toBe(drill.words[i].sounds.length);
                expect(new Set(value).size, `w0${week} ${drill.words[i].word}: more than one distinct path`).toBeGreaterThan(1);
                for (const p of value) expect(fs.existsSync(path.join(STORYTIME_ROOT, p)), `w0${week}: ${p} exists in the bank folder`).toBe(true);
            });
        }
    });
});

describe('storytime loops: the problems of the drill sounds (D2)', () => {
    it('names a drill sound that the bank lacks, and lists no field for that word', () => {
        const week = parse(unbankedCopy());
        const bank = realBank();
        const { fields, unresolved } = phonemeAudioFields(week, bank);
        expect(unresolved, 'Unresolved sounds of w02 with the drill').toEqual([`${UNBANKED} (scripts.0.steps.3.blendDrill.words.1.audio)`]);
        expect(fields.filter((f) => f.path.includes('blendDrill')).map((f) => f.path)).toEqual([0, 2].map(W2_PATH));
        expect(phonemeAudioProblems(week, bank)).toContain(`no recording for ${UNBANKED} (scripts.0.steps.3.blendDrill.words.1.audio)`);
    });

    it('reports a drill field that is missing, for each word', () => {
        const problems = phonemeAudioProblems(parse(drillCopy(2)), realBank());
        expect(problems.filter((p) => p.includes('blendDrill')), 'Problems of the drill').toEqual([0, 1, 2].map((i) => `${W2_PATH(i).join('.')}: missing`));
    });

    it('reports a drill field that differs, and no problem when every field holds its recording', () => {
        const bank = realBank();
        const raw = drillCopy(2);
        raw.scripts[0].steps[3].blendDrill.words.forEach((w: RawWeek, i: number) => (w.audio = copy(W2_AUDIO[i])));
        expect(phonemeAudioProblems(parse(raw), bank), 'Problems of w02 with the right drill audio').toEqual([]);
        raw.scripts[0].steps[3].blendDrill.words[1].audio = [...W2_AUDIO[1]].reverse();
        const problems = phonemeAudioProblems(parse(raw), bank);
        expect(problems, 'Problems with one reversed word').toHaveLength(1);
        expect(problems[0]).toMatch(/^scripts\.0\.steps\.3\.blendDrill\.words\.1\.audio: .+, expected .+/);
        expect(problems[0]).toContain(JSON.stringify(W2_AUDIO[1]));
    });
});

describe('storytime loops: a week without blendDrill keeps its fields (D3)', () => {
    // The hash is the SHA-256 of `JSON.stringify` of the `{ fields, unresolved }` result of
    // `phonemeAudioFields` for the eight shipped weeks w01 to w08 (the FR-1 fields removed), computed from
    // the code at a25fe053 (before Green 3). The field counts are 4, 9, 14, 14, 19, 19, 19, 26.
    const BASELINE_FIELD_COUNTS = [4, 9, 14, 14, 19, 19, 19, 26];
    const BASELINE_SHA256 = '8370c711b093a3836cd1274f59d1b0751326532b0ba9266a7b604c6e3e1c2721';

    it('returns the same fields for the eight shipped weeks as the frozen baseline', () => {
        const bank = realBank();
        const results = Array.from({ length: 8 }, (_, i) => phonemeAudioFields(parse(baseCopy(i + 1)), bank));
        expect(results.map((r) => r.fields.length), 'Field counts of w01 to w08').toEqual(BASELINE_FIELD_COUNTS);
        expect(results.map((r) => r.unresolved.length), 'Unresolved counts of w01 to w08').toEqual(Array(8).fill(0));
        expect(sha256(JSON.stringify(results)), 'SHA-256 of the fields of w01 to w08').toBe(BASELINE_SHA256);
    });

    it('keeps every other field of a week when a drill is added', () => {
        const bank = realBank();
        for (const week of [1, 2, 7]) {
            const without = phonemeAudioFields(parse(baseCopy(week)), bank).fields;
            const withDrill = phonemeAudioFields(parse(drillCopy(week)), bank).fields.filter((f) => !f.path.includes('blendDrill'));
            expect(withDrill, `w0${week}: the other fields stay`).toEqual(without);
        }
    });

});

describe('storytime loops: setPhonemeAudio writes the drill (D4)', () => {
    it('sets the drill audio, then the problems are empty, and the other bytes stay equal', () => {
        const bank = realBank();
        const raw = drillCopy(2);
        const before = copy(raw);
        const set = setPhonemeAudio(raw, bank);
        expect(set, 'Fields set on w02 with the drill').toBe(12);
        expect(phonemeAudioProblems(parse(raw), bank), 'Problems after the set').toEqual([]);
        const words = raw.scripts[0].steps[3].blendDrill.words;
        expect(words.map((w: RawWeek) => w.audio)).toEqual(W2_AUDIO);
        // Remove the three drill audio keys: the rest of the copy must equal the copy before the set.
        for (const w of words) delete w.audio;
        expect(JSON.stringify(raw), 'The other bytes of the copy').toBe(JSON.stringify(before));
    });

    it('writes the same values again on a second run (the set is stable)', () => {
        const bank = realBank();
        const raw = drillCopy(2);
        setPhonemeAudio(raw, bank);
        const once = JSON.stringify(raw);
        expect(setPhonemeAudio(raw, bank)).toBe(12);
        expect(JSON.stringify(raw)).toBe(once);
        expect(drillAudioOf(raw), 'Drill audio paths of w02').toHaveLength(9);
    });
});

describe('storytime loops: an unresolved drill sound stops the set (D5)', () => {
    it('makes setPhonemeAudio throw with the sound and its field, and changes nothing', () => {
        const raw = unbankedCopy();
        const before = JSON.stringify(raw);
        expect(() => setPhonemeAudio(raw, realBank())).toThrow(/^no recording for \/zh\/ \(scripts\.0\.steps\.3\.blendDrill\.words\.1\.audio\)$/);
        expect(JSON.stringify(raw), 'The raw copy after the throw').toBe(before);
    });

    it('gives the problem that check-weeks turns into a phoneme-audio fail', () => {
        // `check-weeks.ts` marks `phoneme-audio` as `fail` when `phonemeAudioProblems` is not empty.
        const problems = phonemeAudioProblems(parse(unbankedCopy()), realBank());
        expect(problems.filter((p) => p.startsWith('no recording for')), 'Problems with a drill sound that the bank lacks').toEqual([
            `no recording for ${UNBANKED} (scripts.0.steps.3.blendDrill.words.1.audio)`,
        ]);
    });
});

describe('storytime loops: the drill audio paths for the app (G3 guard)', () => {
    // Promised to the Monorepo app on 2026-11-03: a drill audio path has letters, digits, ".", "_", "-",
    // and "/" only (no space), and it is relative to the content root.
    it('keeps every drill audio path of w01 to w07 safe and relative', () => {
        const bank = realBank();
        for (const week of TEACH_WEEKS) {
            const raw = drillCopy(week);
            setPhonemeAudio(raw, bank);
            const paths = drillAudioOf(raw);
            expect(paths.length, `w0${week}: drill audio paths`).toBe(SAMPLE_DRILLS[week].words.reduce((n, w) => n + w.sounds.length, 0));
            for (const p of paths) {
                expect(p, `w0${week}: ${p} has safe characters`).toMatch(/^[A-Za-z0-9._/-]+$/);
                expect(p.startsWith('/'), `w0${week}: ${p} has no leading slash`).toBe(false);
                expect(p.split('/').includes('..'), `w0${week}: ${p} has no ".." part`).toBe(false);
                expect(p.startsWith(`${PHONEME_BANK_DIR}/`), `w0${week}: ${p} is in the bank folder`).toBe(true);
            }
        }
    });
});

describe('storytime loops: the audio test leaves the shipped files unchanged', () => {
    it('keeps the SHA-256 of the eight shipped week files and of the bank manifest', () => {
        for (const [file, hash] of SHIPPED_HASHES) {
            expect(sha256(fs.readFileSync(file)), `${path.relative(STORYTIME_ROOT, file)} is unchanged`).toBe(hash);
        }
        expect(SHIPPED_HASHES.size, 'Files in the guard: 8 weeks and 1 manifest').toBe(9);
    });
});
