// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT } from '../lib/storytime/files';
import { BookAudioSchema, StorytimeWeekSchema } from '../lib/storytime/schema';

/**
 * Phase 13, Red 1: read-along sentence clips and the log of the makers (spec addendum
 * "Addendum 2026-11-14, Phase 13: read-along sentence clips", FR 8, cases N1 to N12,
 * decisions M2 to M7 and M14 to M15).
 *
 * The option `kinds`, the option `log`, the type `SentenceKind`, the flag `--kind`, the provenance
 * merge, the skip rule, the per-clip write, the header guard, the call and `sent:` and `kept` log
 * lines, the `main` overrides seam, `checkReadAlongSentenceClips`, and the schema JSDoc change do not
 * exist yet. Each case that needs one of them fails on the missing option, flag, line, row, or
 * behavior. The guard cases (N12) and the schema case (N10) pass already.
 *
 * Names that the spec leaves open are fixed here, so that Green does not guess. Each is marked PIN:
 *  - PIN `SentenceKind` is `'decodable' | 'readalong'`, exported from `sentence-clips.ts`.
 *  - PIN `kinds?: readonly SentenceKind[]` sits in the input of `planSentenceClips` and in the
 *    options of `makeSentenceClips` and `setSentenceClips`. The default is `['decodable']`. The
 *    flag `--kind <decodable|readalong|all>` maps `all` to both kinds. Another value stops `main`
 *    with exit 2 and the usage text, at parse time, before the dry-run stop.
 *  - PIN `log?: (line: string) => void` sits in the options of both makers. It receives each line
 *    at the time that the line is added, in the order of `result.lines`. A run that throws adds the
 *    line `sent: <s> (run failed)` first, so the tests read the lines of a failed run only through
 *    `log`.
 *  - PIN the call line is `call <k>`, one tab, `<file>` (sentence maker) or `<word key>` (word
 *    maker), one tab, `take <t>`, one tab, `chars <n>`, one tab, `sent <s>`.
 *  - PIN the kept line is exactly the word `kept`, one tab character, the relative file path, and
 *    one newline character (spec review F2). The test compares the exact bytes.
 *  - PIN `main(argv, overrides?)` of `make-sentence-clips.ts` and `make-word-bank.ts` accepts an
 *    optional overrides object merged over the parsed CLI options, so that the tests inject the
 *    fakes. Without the overrides the options come from the flags as before.
 *  - PIN `setSentenceClips` takes `kinds` in its options object; the flag form is `--kind`.
 *
 * Safety rules of this file: no case calls mmx or the recognizer. Every `main` run that could reach
 * a real call holds `--dry-run`, or runs on a temporary tree with the fakes injected, or sets
 * `WHISPER_PYTHON` to a path that does not exist, so that a Red run and a regression can never make
 * a paid call. Every week file that a case touches is a temporary copy. The test reads the shipped
 * week files and the shipped bank as data, and it writes only into temporary copies.
 *
 * The Red 1 grep of spec FR 8 hits the Phase 11 and Phase 12 test files; each hit keeps its old
 * pins, because the default `kinds` is `decodable`, which is the Phase 12 behavior (M3).
 */

/** The dashboard folder, so that the modules are read by path. */
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');

/** The pure module of the sentence clips (FR 1). */
const sentenceClipsModule = path.join(dashboardRoot, 'lib/storytime/sentence-clips.ts');

/** The sentence maker (FR 2). */
const makeSentenceClipsModule = path.join(dashboardRoot, 'scripts/storytime/make-sentence-clips.ts');

/** The word maker (FR 3). */
const makeWordBankModule = path.join(dashboardRoot, 'scripts/storytime/make-word-bank.ts');

/** The sentence mapper (FR 4). */
const setSentenceClipsModule = path.join(dashboardRoot, 'scripts/storytime/set-sentence-clips.ts');

/** The script of the week checks (FR 5). */
const checkWeeksModule = path.join(dashboardRoot, 'scripts/storytime/check-weeks.ts');

/** This file, so that the guard case reads its own text. */
const SELF_FILE = path.join(dashboardRoot, '__tests__/storytime-package-readalong-clips.test.ts');

/** The root of the temporary copies of the tests. */
const TEMP_ROOT = path.join(os.tmpdir(), 'opencode');

/** The sample rate of the clips and of the fake takes. */
const RATE = 32000;

/** The quiet start and the quiet end of a fake take, in samples. */
const TAKE_LEAD = 9600;
const TAKE_TAIL = 12800;

/** An interpreter path that does not exist, for the venv guard of the main runs. */
const MISSING_PYTHON = '/tmp/opencode/storytime-readalong-no-venv/bin/python';

/** The voice of the books of w01 to w07 (the Facts section). */
const VOICE = 'English_captivating_female1';

/** The exact label of the check `sentence-clips` (L9). */
const SENTENCE_CLIPS_LABEL = 'The sentence clips named in the package exist and follow the book sentences';

/** The exact label of the check `readalong-sentence-clips` (M7). */
const READALONG_CLIPS_LABEL = 'The read-along sentence clips named in the package exist and follow the book sentences';

/** The text that no line of this file may hold: the guard of the file. The pieces keep this file clean. */
const FORBIDDEN_PATH = `${['measure', 'tracks'].join('/')}/`;

/** The header keys of the sentence provenance file (L8). */
const HEADER_KEYS = ['voice', 'speed', 'model'];

/** The header of the Phase 12 provenance files (the Facts section). */
const PHASE12_HEADER = { voice: VOICE, speed: 1, model: 'speech-2.8-hd' };

/** The read-along sentence count of each shipped week, written by hand (spec Facts, N1). */
const READALONG_SENTENCES_BY_WEEK: Record<number, number> = { 1: 8, 2: 16, 3: 8, 4: 8, 5: 8, 6: 8, 7: 16 };

/** The characters of one take of each read-along book, written by hand (spec Facts, N1). */
const READALONG_CHARS_BY_WEEK: Record<number, number> = { 1: 137, 2: 166, 3: 93, 4: 142, 5: 130, 6: 132, 7: 127 };

/** The 8 sentences of the decodable book of week 1, in order (the Phase 12 table). */
const W01_DECODABLE = [
    'A nest.', 'A net.', 'A nut.', 'A nose.', 'A neck.', 'A nurse.', 'A nest and a nut.', 'Nan can nod!',
];

// ---------------------------------------------------------------------------------------------
// Module types
// ---------------------------------------------------------------------------------------------

/** One week as the modules read it. */
interface RawWeek {
    meta?: { level: number; week: number };
    books: {
        kind: string;
        audio: {
            voice?: string;
            file?: string;
            sentences: { sentence: string }[];
            wordClips?: Record<string, string>;
            sentenceClips?: { sentence: string; file: string }[];
        };
    }[];
}

/** One planned sentence clip (L7). */
interface PlannedSentence {
    book: number;
    n: number;
    text: string;
    file: string;
}

/** The pure module of the sentence clips (FR 1). */
interface SentenceClipsModule {
    planSentenceClips?: (input: {
        level: number;
        week: number;
        books: readonly { kind?: string; audio?: { sentences?: readonly { sentence?: string }[] } }[];
        kinds?: readonly string[];
    }) => PlannedSentence[];
    looksLikeCut?: (clip: Int16Array, source: Int16Array, rate: number) => boolean;
}

/** One item of the sentence provenance file (L8). */
interface ProvenanceItem {
    book: number;
    n: number;
    text: string;
    file: string;
    take: number;
    len_s: number;
    peak_dbfs: number;
    recognized: string;
    note: string;
    sha256: string;
}

/** The sentence provenance file (L8, M4). */
interface Provenance {
    voice: string;
    speed: number;
    model: string;
    items: ProvenanceItem[];
}

/** The options of the sentence maker (FR 2). */
interface MakeSentenceClipsOptions {
    level: number;
    week: number;
    contentRoot: string;
    kinds?: readonly string[];
    log?: (line: string) => void;
    maxChars?: number;
    dryRun?: boolean;
    synthesize?: (text: string, wavFile: string, voice: string, speed: number) => void;
    recognize?: (wavFiles: readonly string[]) => string[][];
    whisperPython?: string;
}

/** The result of the sentence maker (PIN). */
interface MakeSentenceClipsResult {
    made: string[];
    chars: number;
    lines: string[];
}

/** The sentence maker (FR 2). */
interface MakeSentenceClipsModule {
    makeSentenceClips?: (options: MakeSentenceClipsOptions) => MakeSentenceClipsResult | Promise<MakeSentenceClipsResult>;
    main?: (argv: string[], overrides?: Partial<MakeSentenceClipsOptions>) => number | Promise<number>;
}

/** The options of the bank maker (FR 3). */
interface MakeWordBankOptions {
    level: number;
    week: number;
    contentRoot: string;
    bankFolder: string;
    date: string;
    log?: (line: string) => void;
    maxChars?: number;
    dryRun?: boolean;
    practice?: boolean;
    synthesize?: (text: string, wavFile: string) => void;
    recognize?: (wavFiles: readonly string[]) => string[][];
    whisperPython?: string;
}

/** The result of the bank maker. */
interface MakeWordBankResult {
    made: string[];
    chars: number;
    lines: string[];
}

/** The bank maker (FR 3). */
interface MakeWordBankModule {
    makeWordBank?: (options: MakeWordBankOptions) => MakeWordBankResult | Promise<MakeWordBankResult>;
    main?: (argv: string[], overrides?: Partial<MakeWordBankOptions>) => number | Promise<number>;
}

/** The sentence mapper (FR 4). */
interface SetSentenceClipsModule {
    setSentenceClips?: (options: { weekFile: string; contentRoot: string; kinds?: readonly string[] }) => unknown;
}

/** The row of a check. */
interface CheckRow {
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    detail?: string;
}

/** The script of the week checks (FR 5). */
interface CheckWeeksModule {
    checkSentenceClips?: (week: unknown, contentRoot?: string) => CheckRow | undefined;
    checkReadAlongSentenceClips?: (week: unknown, contentRoot?: string) => CheckRow | undefined;
}

/** The temporary folders of the tests. */
const scratch: string[] = [];

afterAll(() => {
    for (const folder of scratch) fs.rmSync(folder, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

/**
 * The hash of a buffer or of a text.
 * @param data The bytes or the text.
 * @returns The SHA-256 of the data.
 */
function sha256(data: Buffer | string): string {
    return createHash('sha256').update(data).digest('hex');
}

/**
 * The hash of a file.
 * @param file The path of the file.
 * @returns The SHA-256 of the file.
 */
function fileHash(file: string): string {
    return sha256(fs.readFileSync(file));
}

/**
 * A temporary folder under the temporary root of the machine.
 * @param prefix The prefix of the name of the folder.
 * @returns The path of the folder.
 */
function tempFolder(prefix: string): string {
    fs.mkdirSync(TEMP_ROOT, { recursive: true });
    const folder = fs.mkdtempSync(path.join(TEMP_ROOT, prefix));
    scratch.push(folder);
    return folder;
}

/**
 * The two digits of a week.
 * @param week The week.
 * @returns The week with a leading zero when it is below 10.
 */
function weekDigits(week: number): string {
    return String(week).padStart(2, '0');
}

/**
 * The text of a shipped week file.
 * @param week The week.
 * @returns The text.
 */
function shippedText(week: number): string {
    return fs.readFileSync(path.join(STORYTIME_ROOT, 'l2', `w${weekDigits(week)}.json`), 'utf8');
}

/**
 * The week text without the blocks of the named keys, and without the comma that a block added to the
 * line before it. Every case that copies a shipped week file starts here, so that the case stays valid
 * after the Clips task adds the read-along blocks.
 * @param text The text of the shipped week file.
 * @param names The keys whose blocks go.
 * @returns The text of the start file.
 */
function stripBlocks(text: string, names: readonly string[]): string {
    const out: string[] = [];
    const lines = text.split('\n');
    for (let index = 0; index < lines.length; index += 1) {
        const open = lines[index].match(/^(\s*)"([A-Za-z]+)": ([{[])$/);
        if (!open || !names.includes(open[2])) {
            out.push(lines[index]);
            continue;
        }
        const close = open[3] === '{' ? '}' : ']';
        while (index < lines.length && lines[index].trimEnd().replace(/,$/, '') !== `${open[1]}${close}`) index += 1;
        const hadComma = lines[index]?.trimEnd().endsWith(',') ?? false;
        const previous = out[out.length - 1];
        if (!hadComma && previous !== undefined && previous.endsWith(',')) out[out.length - 1] = previous.slice(0, -1);
    }
    return out.join('\n');
}

/** The keys of the clip blocks that Phase 11 and Phase 12 add to a week file. */
const PHASE12_BLOCKS = ['wordClips', 'trickyWordClips', 'sentenceClips'];

/**
 * The text of a shipped week without any clip block of Phase 11 or Phase 12.
 * @param week The week.
 * @returns The text of the start file, which parses as JSON.
 */
function startText(week: number): string {
    const text = stripBlocks(shippedText(week), PHASE12_BLOCKS);
    expect(() => JSON.parse(text), `the start file of week ${week} parses as JSON`).not.toThrow();
    return text;
}

/**
 * The week object of a start file.
 * @param week The week.
 * @returns The parsed week.
 */
function startWeek(week: number): RawWeek {
    return JSON.parse(startText(week)) as RawWeek;
}

/**
 * The week object of a shipped week file, with its clip blocks as they are shipped.
 * @param week The week.
 * @returns The parsed week.
 */
function shippedWeek(week: number): RawWeek {
    return JSON.parse(shippedText(week)) as RawWeek;
}

/**
 * The sentences of a book of a shipped week.
 * @param week The week.
 * @param book The 0-based index of the book.
 * @returns The sentence texts, in order.
 */
function shippedSentences(week: number, book: number): string[] {
    return shippedWeek(week).books[book].audio.sentences.map((line) => line.sentence);
}

/**
 * The read-along sentences of a shipped week (the book with index 0).
 * @param week The week.
 * @returns The sentence texts, in order.
 */
function readAlongSentences(week: number): string[] {
    return shippedSentences(week, 0);
}

/**
 * The voice of a book of a shipped week.
 * @param week The week.
 * @param book The 0-based index of the book.
 * @returns The voice.
 */
function shippedVoice(week: number, book: number): string {
    return shippedWeek(week).books[book].audio.voice ?? VOICE;
}

/**
 * The relative path of a read-along sentence clip of a week (M2).
 * @param week The week.
 * @param n The 1-based index of the sentence.
 * @returns The path `l2/media/w<nn>/sentences/b0-s<jj>.mp3`.
 */
function readAlongPath(week: number, n: number): string {
    return `l2/media/w${weekDigits(week)}/sentences/b0-s${String(n).padStart(2, '0')}.mp3`;
}

/**
 * The relative path of a decodable sentence clip of week 1 (L7).
 * @param n The 1-based index of the sentence.
 * @returns The path `l2/media/w01/sentences/b1-s<jj>.mp3`.
 */
function decodablePath(n: number): string {
    return `l2/media/w01/sentences/b1-s${String(n).padStart(2, '0')}.mp3`;
}

/**
 * Runs an action and keeps its error. The action can be sync or async.
 * @param action The action.
 * @returns The value, or the error that the action threw.
 */
async function attempt<T>(action: () => T | Promise<T>): Promise<{ value?: T; error?: Error }> {
    try {
        return { value: await action() };
    } catch (error) {
        return { error: error instanceof Error ? error : new Error(String(error)) };
    }
}

/**
 * Runs an action and returns what it prints to the console.
 * @param action The action.
 * @returns The printed lines (standard output and standard error), and the value of the action.
 */
async function captureOutput<T>(action: () => T | Promise<T>): Promise<{ out: string[]; err: string[]; value: T }> {
    const out: string[] = [];
    const err: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args: unknown[]): void => {
        out.push(args.map((arg) => String(arg)).join(' '));
    };
    console.error = (...args: unknown[]): void => {
        err.push(args.map((arg) => String(arg)).join(' '));
    };
    try {
        const value = await action();
        return { out, err, value };
    } finally {
        console.log = originalLog;
        console.error = originalError;
    }
}

/**
 * One export of a module.
 * @param file The path of the module.
 * @param name The name of the export.
 * @returns The export.
 * @throws Error When the module or the export is missing. The message names both.
 */
async function exportOf<T extends object, K extends keyof T>(file: string, name: K): Promise<NonNullable<T[K]>> {
    if (!fs.existsSync(file)) throw new Error(`Missing module: ${file}`);
    const mod = await import(file) as T;
    const value = mod[name];
    if (value === undefined || value === null) throw new Error(`Missing export: ${String(name)} of ${file}`);
    return value as NonNullable<T[K]>;
}

/** One export of the sentence module. */
const sentences = <K extends keyof SentenceClipsModule>(name: K): Promise<NonNullable<SentenceClipsModule[K]>> => exportOf<SentenceClipsModule, K>(sentenceClipsModule, name);

/** One export of the sentence maker. */
const sentenceMaker = <K extends keyof MakeSentenceClipsModule>(name: K): Promise<NonNullable<MakeSentenceClipsModule[K]>> => exportOf<MakeSentenceClipsModule, K>(makeSentenceClipsModule, name);

/** One export of the bank maker. */
const wordMaker = <K extends keyof MakeWordBankModule>(name: K): Promise<NonNullable<MakeWordBankModule[K]>> => exportOf<MakeWordBankModule, K>(makeWordBankModule, name);

/** One export of the sentence mapper. */
const sentenceMapper = <K extends keyof SetSentenceClipsModule>(name: K): Promise<NonNullable<SetSentenceClipsModule[K]>> => exportOf<SetSentenceClipsModule, K>(setSentenceClipsModule, name);

/** One export of the week checks. */
const checks = <K extends keyof CheckWeeksModule>(name: K): Promise<NonNullable<CheckWeeksModule[K]>> => exportOf<CheckWeeksModule, K>(checkWeeksModule, name);

/**
 * The hash of every file of a folder, with its path relative to the folder.
 * @param root The folder to read.
 * @returns The hashes, keyed by the relative path. An absent folder gives an empty object.
 */
function treeHashes(root: string): Record<string, string> {
    const out: Record<string, string> = {};
    if (!fs.existsSync(root)) return out;
    const walk = (folder: string): void => {
        const entries = fs.readdirSync(folder, { withFileTypes: true })
            .sort((left, right) => left.name.localeCompare(right.name));
        for (const entry of entries) {
            const full = path.join(folder, entry.name);
            if (entry.isDirectory()) walk(full);
            else out[path.relative(root, full)] = fileHash(full);
        }
    };
    walk(root);
    return out;
}

/**
 * The size and the modification time of every file of a folder.
 * @param root The folder to read.
 * @returns The stamps, keyed by the relative path.
 */
function treeStamps(root: string): Record<string, string> {
    const out: Record<string, string> = {};
    if (!fs.existsSync(root)) return out;
    const walk = (folder: string): void => {
        for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
            const full = path.join(folder, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else {
                const stat = fs.statSync(full);
                out[path.relative(root, full)] = `${stat.size}:${stat.mtimeMs}`;
            }
        }
    };
    walk(root);
    return out;
}

/**
 * Sets the modification time of every file of a folder to an old date, so that a later rewrite shows.
 * @param root The folder.
 */
function ageTree(root: string): void {
    const old = new Date('2020-01-01T00:00:00Z');
    const walk = (folder: string): void => {
        for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
            const full = path.join(folder, entry.name);
            if (entry.isDirectory()) walk(full);
            else fs.utimesSync(full, old, old);
        }
    };
    if (fs.existsSync(root)) walk(root);
}

/**
 * Every file and every folder of a tree, with its path relative to the tree.
 * @param root The folder to list.
 * @returns The sorted relative paths. A folder path ends with a slash.
 */
function entryListing(root: string): string[] {
    const out: string[] = [];
    const walk = (folder: string): void => {
        for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
            const full = path.join(folder, entry.name);
            const relative = path.relative(root, full);
            if (entry.isDirectory()) {
                out.push(`${relative}/`);
                walk(full);
            } else {
                out.push(relative);
            }
        }
    };
    walk(root);
    return out.sort();
}

/**
 * The comparison of two texts that differ only by changed lines and added lines. A changed line gains a
 * comma. An added line is new. The function throws for any other difference, so a check of the diff
 * also proves that every other part of the text is byte-equal.
 * @param before The lines of the first text.
 * @param after The lines of the second text.
 * @returns The changed lines (before and after) and the added lines, in order.
 */
function insertionDiff(before: string[], after: string[]): { changed: [string, string][]; added: string[] } {
    const changed: [string, string][] = [];
    const added: string[] = [];
    let i = 0;
    let j = 0;
    while (i < before.length && j < after.length) {
        if (before[i] === after[j]) {
            i += 1;
            j += 1;
        } else if (after[j] === `${before[i]},`) {
            changed.push([before[i], after[j]]);
            i += 1;
            j += 1;
        } else {
            added.push(after[j]);
            j += 1;
        }
    }
    while (j < after.length) {
        added.push(after[j]);
        j += 1;
    }
    if (i < before.length) throw new Error(`line ${i + 1} of the first text is not in the second text: ${before[i]}`);
    return { changed, added };
}

// ---------------------------------------------------------------------------------------------
// Audio helpers (the test builds its own fixtures; it never calls the code under test for them)
// ---------------------------------------------------------------------------------------------

/**
 * A WAV file of 16-bit mono PCM.
 * @param samples The samples.
 * @returns The bytes of the file.
 */
function wavBuffer(samples: Int16Array): Buffer {
    const data = samples.length * 2;
    const buf = Buffer.alloc(44 + data);
    buf.write('RIFF', 0, 'ascii');
    buf.writeUInt32LE(36 + data, 4);
    buf.write('WAVE', 8, 'ascii');
    buf.write('fmt ', 12, 'ascii');
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(1, 22);
    buf.writeUInt32LE(RATE, 24);
    buf.writeUInt32LE(RATE * 2, 28);
    buf.writeUInt16LE(2, 32);
    buf.writeUInt16LE(16, 34);
    buf.write('data', 36, 'ascii');
    buf.writeUInt32LE(data, 40);
    for (let i = 0; i < samples.length; i += 1) buf.writeInt16LE(samples[i], 44 + i * 2);
    return buf;
}

/** The format fields and the samples of a WAV file. */
interface WavFile {
    channels: number;
    rate: number;
    bits: number;
    samples: Int16Array;
}

/**
 * Reads a WAV file by its chunks.
 * @param file The path of the file.
 * @returns The format fields and the samples.
 */
function readWav(file: string): WavFile {
    const buf = fs.readFileSync(file);
    expect(buf.toString('ascii', 0, 4), `${file} starts with RIFF`).toBe('RIFF');
    let at = 12;
    let channels = 0;
    let rate = 0;
    let bits = 0;
    while (at + 8 <= buf.length) {
        const id = buf.toString('ascii', at, at + 4);
        const size = buf.readUInt32LE(at + 4);
        const body = at + 8;
        if (id === 'fmt ') {
            channels = buf.readUInt16LE(body + 2);
            rate = buf.readUInt32LE(body + 4);
            bits = buf.readUInt16LE(body + 14);
        } else if (id === 'data') {
            const end = Math.min(body + size, buf.length);
            const samples = new Int16Array((end - body) >> 1);
            for (let i = 0; i < samples.length; i += 1) samples[i] = buf.readInt16LE(body + i * 2);
            return { channels, rate, bits, samples };
        }
        at = body + size + (size % 2);
    }
    throw new Error(`${file} has no data chunk`);
}

/**
 * A loud stretch: a cosine of 440 that starts at +10000 and ends at -10000, so that its first and
 * its last sample are loud.
 * @param length The length in samples.
 * @returns The samples.
 */
function loud(length: number): Int16Array {
    const out = new Int16Array(length);
    for (let i = 0; i < length; i += 1) out[i] = Math.round(10000 * Math.cos((2 * Math.PI * 440 * i) / RATE));
    out[0] = 10000;
    out[length - 1] = -10000;
    return out;
}

/**
 * The samples of a fake take: a quiet start, a loud body, and a quiet end.
 * @param span The length of the loud part, in samples.
 * @returns The samples.
 */
function takeSamples(span: number): Int16Array {
    return Int16Array.from([...new Array<number>(TAKE_LEAD).fill(0), ...loud(span), ...new Array<number>(TAKE_TAIL).fill(0)]);
}

/**
 * A fixed noise signal. The same seed gives the same samples, and two seeds give signals with no
 * correlation.
 * @param seed The seed.
 * @param length The length in samples.
 * @returns The samples, between -8192 and 8191.
 */
function noise(seed: number, length: number): Int16Array {
    const out = new Int16Array(length);
    let state = seed >>> 0;
    for (let i = 0; i < length; i += 1) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        out[i] = ((state >>> 16) & 0x3fff) - 8192;
    }
    return out;
}

/**
 * Writes samples as an mp3 file of 32 kHz, mono, 128 kb/s.
 * @param samples The samples.
 * @param file The mp3 file to write.
 */
function writeMp3(samples: Int16Array, file: string): void {
    const wav = path.join(tempFolder('storytime-readalong-encode-'), 'source.wav');
    fs.writeFileSync(wav, wavBuffer(samples));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', file]);
}

/**
 * The samples of an mp3 file, decoded by ffmpeg to 32 kHz mono.
 * @param file The path of the mp3 file.
 * @returns The samples.
 */
function decodeMp3(file: string): Int16Array {
    const wav = path.join(tempFolder('storytime-readalong-decode-'), 'decoded.wav');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file, '-ac', '1', '-ar', String(RATE), wav]);
    return readWav(wav).samples;
}

// ---------------------------------------------------------------------------------------------
// The fake of mmx and of faster-whisper
// ---------------------------------------------------------------------------------------------

/** One call of the fake voice: the text, the take of that text, the loud extent that marks it, and the arguments. */
interface FakeCall {
    text: string;
    take: number;
    extent: number;
    voice?: string;
    speed?: number;
}

/** The fake of mmx and of faster-whisper. */
interface FakeVoice {
    calls: FakeCall[];
    synthesize: (text: string, wavFile: string, voice?: string, speed?: number) => void;
    recognize: (wavFiles: readonly string[]) => string[][];
}

/**
 * The fake voice. Each call to `synthesize` writes a take whose loud extent is unique, so that
 * `recognize` finds the text and the take of any file, whatever its path.
 * @param options `heard` gives the words that the fake hears for a text and a take (default: the
 * words of the text). `throwsWhen` gives the texts and takes that make the call throw, after the
 * call is recorded. `spanOffset` shifts the loud length of every take of this voice, so that two
 * voices make different bytes for the same text.
 * @returns The fake.
 */
function fakeVoice(options: {
    heard?: (text: string, take: number) => string[];
    throwsWhen?: (text: string, take: number) => boolean;
    spanOffset?: number;
} = {}): FakeVoice {
    const calls: FakeCall[] = [];
    const takesOf = new Map<string, number>();
    const heard = options.heard ?? ((text: string): string[] => text.split(' '));
    return {
        calls,
        synthesize: (text, wavFile, voice, speed) => {
            const take = (takesOf.get(text) ?? 0) + 1;
            takesOf.set(text, take);
            // changed 2026-11-14 (Red retry R1, D1)
            const span = 48000 + (options.spanOffset ?? 0) + 16 * calls.length;
            // The maker trims the quiet edges before recognition, so the marked extent is the loud part only.
            calls.push({ text, take, extent: span, voice, speed });
            if (options.throwsWhen?.(text, take)) throw new Error(`fake mmx: the take ${take} of "${text}" fails`);
            fs.mkdirSync(path.dirname(wavFile), { recursive: true });
            fs.writeFileSync(wavFile, wavBuffer(takeSamples(span)));
        },
        recognize: (wavFiles) => wavFiles.map((file) => {
            const { samples } = readWav(file);
            let first = 0;
            while (first < samples.length && samples[first] === 0) first += 1;
            let last = samples.length - 1;
            while (last >= 0 && samples[last] === 0) last -= 1;
            const extent = last - first + 1;
            const call = calls.find((entry) => entry.extent === extent);
            if (!call) throw new Error(`fake recognize: no take with a loud extent of ${extent} samples in ${file}`);
            return heard(call.text, call.take);
        }),
    };
}

// ---------------------------------------------------------------------------------------------
// The temporary trees and the provenance fixtures
// ---------------------------------------------------------------------------------------------

/** The temporary tree of one run of a script. */
interface WordTree {
    folder: string;
    contentRoot: string;
    weekFile: string;
    bankFolder: string;
}

/**
 * A temporary content root with a copy of the start file of each shipped week of level 2.
 * @param prefix The prefix of the name of the folder.
 * @returns The paths of the tree.
 */
function baseTree(prefix: string): WordTree {
    const folder = tempFolder(prefix);
    const contentRoot = path.join(folder, 'content');
    fs.mkdirSync(path.join(contentRoot, 'l2'), { recursive: true });
    for (let week = 1; week <= 8; week += 1) {
        fs.writeFileSync(path.join(contentRoot, 'l2', `w${weekDigits(week)}.json`), startText(week));
    }
    return {
        folder,
        contentRoot,
        weekFile: path.join(contentRoot, 'l2/w01.json'),
        bankFolder: path.join(contentRoot, 'words'),
    };
}

/**
 * The sentences folder of week 1 of a tree.
 * @param tree The tree.
 * @returns The folder.
 */
const sentencesFolder = (tree: WordTree): string => path.join(tree.contentRoot, 'l2/media/w01/sentences');

/**
 * The provenance file of week 1 of a tree.
 * @param tree The tree.
 * @returns The file.
 */
const provenanceFile = (tree: WordTree): string => path.join(sentencesFolder(tree), 'manifest.json');

/**
 * The provenance file of a tree.
 * @param tree The tree.
 * @returns The parsed file.
 */
function provenanceOf(tree: WordTree): Provenance {
    return JSON.parse(fs.readFileSync(provenanceFile(tree), 'utf8')) as Provenance;
}

/**
 * Writes one fake clip mp3 into a tree. The bytes are text, so each seed gives other bytes.
 * @param tree The tree.
 * @param file The relative path of the clip.
 * @param seed The seed of the bytes.
 * @returns The bytes of the file.
 */
function fakeClip(tree: WordTree, file: string, seed: number): Buffer {
    const bytes = Buffer.from(`fake clip ${file} ${seed}\n`);
    fs.mkdirSync(path.dirname(path.join(tree.contentRoot, file)), { recursive: true });
    fs.writeFileSync(path.join(tree.contentRoot, file), bytes);
    return bytes;
}

/**
 * One item of a provenance fixture.
 * @param book The 0-based index of the book.
 * @param n The 1-based index of the sentence.
 * @param text The sentence text.
 * @param file The relative path of the clip.
 * @param bytes The bytes of the clip file.
 * @returns The item, with the keys of L8 in order.
 */
function itemOf(book: number, n: number, text: string, file: string, bytes: Buffer): ProvenanceItem {
    return {
        book,
        n,
        text,
        file,
        take: 1,
        len_s: 1.1,
        peak_dbfs: -3,
        recognized: text,
        note: '',
        sha256: sha256(bytes),
    };
}

/**
 * Writes the provenance fixture of a tree.
 * @param tree The tree.
 * @param header The header keys.
 * @param items The items.
 */
function writeProvenance(tree: WordTree, header: { voice: string; speed: number; model: string }, items: ProvenanceItem[]): void {
    fs.mkdirSync(sentencesFolder(tree), { recursive: true });
    fs.writeFileSync(provenanceFile(tree), `${JSON.stringify({ ...header, items }, null, 1)}\n`);
}

/**
 * The `{ sentence, file }` form of provenance items, as the week field holds them.
 * @param items The items.
 * @returns The items in the field form.
 */
const clipFieldOf = (items: ProvenanceItem[]): { sentence: string; file: string }[] => items.map((item) => ({ sentence: item.text, file: item.file }));

/**
 * The tree of N2: a copy of w01 that holds the 8 decodable clips of Phase 12 (the mp3 files, the
 * provenance file, and the week field), and no read-along clip.
 * @param header The header keys of the provenance file (default: the Phase 12 header).
 * @returns The tree.
 */
function phase12Tree(header: { voice: string; speed: number; model: string } = PHASE12_HEADER): WordTree {
    const tree = baseTree('storytime-readalong-p12-');
    const items = W01_DECODABLE.map((text, index) => itemOf(1, index + 1, text, decodablePath(index + 1), fakeClip(tree, decodablePath(index + 1), 100 + index)));
    writeProvenance(tree, header, items);
    const week = startWeek(1);
    week.books[1].audio.sentenceClips = clipFieldOf(items);
    fs.writeFileSync(tree.weekFile, `${JSON.stringify(week, null, 1)}\n`);
    return tree;
}

/**
 * A fresh tree for a run of the sentence maker: the start files of level 2, no clip, and no
 * provenance file.
 * @returns The tree.
 */
function freshSentenceTree(): WordTree {
    return baseTree('storytime-readalong-maker-');
}

/**
 * The tree of the done sentences: a copy of w01 with the 8 read-along clips, their provenance items,
 * and no clip block in the week file (the maker does not read the week field).
 * @returns The tree.
 */
function doneReadAlongTree(): WordTree {
    const tree = baseTree('storytime-readalong-done-');
    const texts = readAlongSentences(1);
    const items = texts.map((text, index) => itemOf(0, index + 1, text, readAlongPath(1, index + 1), fakeClip(tree, readAlongPath(1, index + 1), 200 + index)));
    writeProvenance(tree, PHASE12_HEADER, items);
    return tree;
}

/**
 * A run of the sentence maker on a tree.
 * @param tree The tree.
 * @param voice The fake voice.
 * @param extra Options that replace the default options of the run.
 * @returns The value or the error of the run, and the lines that `log` received.
 */
async function runSentenceMaker(tree: WordTree, voice: FakeVoice, extra: Partial<MakeSentenceClipsOptions> = {}): Promise<{ value?: MakeSentenceClipsResult; error?: Error; log: string[] }> {
    const makeSentenceClips = await sentenceMaker('makeSentenceClips');
    const log: string[] = [];
    const run = await attempt(() => makeSentenceClips({
        level: 2,
        week: 1,
        contentRoot: tree.contentRoot,
        maxChars: 400,
        synthesize: voice.synthesize,
        recognize: voice.recognize,
        log: (line) => log.push(line),
        ...extra,
    }));
    return { ...run, log };
}

/**
 * The tree of the word maker: the start files of level 2 and a fixture bank of 137 rows in the
 * Python form (the shipped words without the 15 new words of Phase 12).
 * @returns The tree.
 */
function wordMakerTree(): WordTree {
    const tree = baseTree('storytime-readalong-bank-');
    fs.mkdirSync(tree.bankFolder, { recursive: true });
    const rows = JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'words/manifest.json'), 'utf8')) as { items: { word: string }[] };
    const words = rows.items.map((row) => row.word).filter((word) => !['arm', 'cap', 'dress', 'fan', 'from', 'ham', 'hen', 'hop', 'hot', 'jam', 'mop', 'put', 'sad', 'sit', 'up'].includes(word));
    expect(words, 'the fixture bank holds 137 rows').toHaveLength(137);
    const items = words.map((word, index) => ({
        n: index + 1,
        id: `wa-${word}`,
        word,
        file: `wa-${word}.wav`,
        mp3: `wa-${word}.mp3`,
        sources: 'book',
        weeks: '1',
        take: 1,
        len_s: 0.812,
        peak_dbfs: -3,
        recognized: word,
        note: '',
        sha256: sha256(`old row ${index + 1}`),
    }));
    const manifest = {
        bank: 'storytime-words-l2u1-2026-10-27',
        speaker: 'TTS',
        model: 'speech-2.8-hd',
        voice: VOICE,
        speed: 0.9,
        normalisation: 'peak -3 dBFS, edge silence trimmed to 80 ms, 32 kHz mono 16-bit',
        approval: { status: 'approved', by: 'Daniel', date: '2026-10-27', words: 'fixture', source: 'fixture' },
        missing: [],
        items,
    };
    const json = JSON.stringify(manifest).replace(/"peak_dbfs":-3(?![.\d])/g, '"peak_dbfs":-3.0');
    const text = execFileSync('python3', ['-I', '-c', 'import json,sys;print(json.dumps(json.load(sys.stdin),indent=1))'], { input: json, encoding: 'utf8' });
    fs.writeFileSync(path.join(tree.bankFolder, 'manifest.json'), text);
    return tree;
}

/**
 * A run of the word maker on a tree.
 * @param tree The tree.
 * @param voice The fake voice.
 * @param extra Options that replace the default options of the run.
 * @returns The value or the error of the run, and the lines that `log` received.
 */
async function runWordMaker(tree: WordTree, voice: FakeVoice, extra: Partial<MakeWordBankOptions> = {}): Promise<{ value?: MakeWordBankResult; error?: Error; log: string[] }> {
    const makeWordBank = await wordMaker('makeWordBank');
    const log: string[] = [];
    const run = await attempt(() => makeWordBank({
        level: 2,
        week: 1,
        contentRoot: tree.contentRoot,
        bankFolder: tree.bankFolder,
        date: '2026-11-14',
        maxChars: 150,
        practice: true,
        synthesize: voice.synthesize,
        recognize: voice.recognize,
        log: (line) => log.push(line),
        ...extra,
    }));
    return { ...run, log };
}

/**
 * The tree of the sentence mapper: a copy of w01, the 8 read-along clips and the 8 decodable clips,
 * and a provenance file that holds the 16 items. The caller runs the Phase 12 mapper once without
 * `kinds`, so that the week file holds the Phase 12 decodable array in the L17 form.
 * @returns The tree.
 */
function mapperTree(): WordTree {
    const tree = baseTree('storytime-readalong-mapper-');
    const readAlong = readAlongSentences(1).map((text, index) => itemOf(0, index + 1, text, readAlongPath(1, index + 1), fakeClip(tree, readAlongPath(1, index + 1), 300 + index)));
    const decodable = W01_DECODABLE.map((text, index) => itemOf(1, index + 1, text, decodablePath(index + 1), fakeClip(tree, decodablePath(index + 1), 400 + index)));
    writeProvenance(tree, PHASE12_HEADER, [...readAlong, ...decodable]);
    return tree;
}

/**
 * The tree of the read-along check: a week object of w01 with the read-along field and the decodable
 * field, and the 16 clip files.
 * @returns The raw week and the content root.
 */
function checkTree(): { raw: RawWeek; contentRoot: string } {
    const tree = baseTree('storytime-readalong-check-');
    const readAlong = readAlongSentences(1).map((text, index) => itemOf(0, index + 1, text, readAlongPath(1, index + 1), fakeClip(tree, readAlongPath(1, index + 1), 500 + index)));
    const decodable = W01_DECODABLE.map((text, index) => itemOf(1, index + 1, text, decodablePath(index + 1), fakeClip(tree, decodablePath(index + 1), 600 + index)));
    const raw = startWeek(1);
    raw.books[0].audio.sentenceClips = clipFieldOf(readAlong);
    raw.books[1].audio.sentenceClips = clipFieldOf(decodable);
    return { raw, contentRoot: tree.contentRoot };
}

/**
 * The count of the characters of one take of each sentence of a list.
 * @param texts The sentence texts.
 * @returns The sum of the lengths.
 */
const charsOf = (texts: readonly string[]): number => texts.reduce((sum, text) => sum + text.length, 0);

// ---------------------------------------------------------------------------------------------
// N1: planSentenceClips with kinds
// ---------------------------------------------------------------------------------------------

describe('N1 planSentenceClips with kinds (M3, FR 1)', () => {
    it('with no kinds plans the decodable books only, as Phase 12', async () => {
        const planSentenceClips = await sentences('planSentenceClips');
        const plan = planSentenceClips({ level: 2, week: 1, books: shippedWeek(1).books });
        expect(plan, 'the 8 sentences of the decodable book').toHaveLength(8);
        expect(plan.map((item) => item.book), 'the decodable book index').toEqual(new Array<number>(8).fill(1));
        expect(plan.map((item) => item.file), 'the Phase 12 paths').toEqual(W01_DECODABLE.map((_, index) => decodablePath(index + 1)));
        expect(plan.map((item) => item.text), 'the texts').toEqual(W01_DECODABLE);
    });

    it('with kinds ["readalong"] plans the read-along sentences with book 0 and the b0 paths', async () => {
        const planSentenceClips = await sentences('planSentenceClips');
        const texts = readAlongSentences(1);
        const plan = planSentenceClips({ level: 2, week: 1, books: shippedWeek(1).books, kinds: ['readalong'] });
        expect(plan, 'the 8 read-along sentences').toHaveLength(8);
        expect(plan.map((item) => item.book), 'the read-along book index').toEqual(new Array<number>(8).fill(0));
        expect(plan.map((item) => item.text), 'the texts of the read-along book').toEqual(texts);
        expect(plan.map((item) => item.file), 'the b0 paths').toEqual(texts.map((_, index) => readAlongPath(1, index + 1)));
    });

    it('with both kinds plans the books in order', async () => {
        const planSentenceClips = await sentences('planSentenceClips');
        const plan = planSentenceClips({ level: 2, week: 1, books: shippedWeek(1).books, kinds: ['decodable', 'readalong'] });
        expect(plan, 'the 16 sentences of the two books').toHaveLength(16);
        expect(plan.map((item) => item.book), 'book 0 first, then book 1').toEqual([...new Array<number>(8).fill(0), ...new Array<number>(8).fill(1)]);
    });

    it('gives the hand-written counts and characters of the shipped weeks (72 sentences, 927 characters)', async () => {
        const planSentenceClips = await sentences('planSentenceClips');
        let totalSentences = 0;
        let totalChars = 0;
        for (const week of [1, 2, 3, 4, 5, 6, 7]) {
            const plan = planSentenceClips({ level: 2, week, books: shippedWeek(week).books, kinds: ['readalong'] });
            expect(plan, `week ${week}: the sentence count`).toHaveLength(READALONG_SENTENCES_BY_WEEK[week]);
            expect(charsOf(plan.map((item) => item.text)), `week ${week}: the characters of one take`).toBe(READALONG_CHARS_BY_WEEK[week]);
            expect(plan.every((item) => item.book === 0), `week ${week}: the book index`).toBe(true);
            totalSentences += plan.length;
            totalChars += charsOf(plan.map((item) => item.text));
        }
        expect(totalSentences, 'the sentences of the phase').toBe(72);
        expect(totalChars, 'the characters of the phase').toBe(927);
    });

    it('gives nothing for w08, which has no book', async () => {
        const planSentenceClips = await sentences('planSentenceClips');
        const books = shippedWeek(8).books;
        expect(planSentenceClips({ level: 2, week: 8, books, kinds: ['readalong'] })).toEqual([]);
        expect(planSentenceClips({ level: 2, week: 8, books, kinds: ['readalong', 'decodable'] })).toEqual([]);
    });
});

// ---------------------------------------------------------------------------------------------
// N2: the sentence maker with kinds ["readalong"] on a copy of w01 with the Phase 12 clips
// ---------------------------------------------------------------------------------------------

/** The cached run of N2. */
let cachedN2: Promise<{ tree: WordTree; voice: FakeVoice; result: MakeSentenceClipsResult }> | undefined;

/**
 * The run of the sentence maker with `kinds: ['readalong']` on the Phase 12 copy of w01.
 * @returns The tree, the fake voice, and the result.
 */
function n2Run(): Promise<{ tree: WordTree; voice: FakeVoice; result: MakeSentenceClipsResult }> {
    cachedN2 ??= (async () => {
        const tree = phase12Tree();
        const voice = fakeVoice();
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'], whisperPython: MISSING_PYTHON });
        if (run.error) throw new Error(`the N2 run failed: ${run.error.message}`);
        return { tree, voice, result: run.value as MakeSentenceClipsResult };
    })();
    return cachedN2;
}

describe('N2 the sentence maker with kinds ["readalong"] on a copy of w01 with the Phase 12 clips (M3, M4)', () => {
    it('makes one call for each read-along sentence, in order, with the exact text, the voice of the book, and the speed 1', async () => {
        const run = await n2Run();
        const texts = readAlongSentences(1);
        expect(run.voice.calls.map((call) => call.text), 'the 8 read-along sentences, once each, in order').toEqual(texts);
        expect(run.voice.calls.map((call) => call.voice), 'the voice of the read-along book').toEqual(new Array(texts.length).fill(shippedVoice(1, 0)));
        expect(run.voice.calls.map((call) => call.speed), 'the speed 1').toEqual(new Array(texts.length).fill(1));
    }, 120_000);

    it('made holds the 8 paths b0-s01.mp3 to b0-s08.mp3', async () => {
        const run = await n2Run();
        expect(run.result.made, 'the paths of the new clips').toEqual(readAlongSentences(1).map((_, index) => readAlongPath(1, index + 1)));
    }, 120_000);

    it('the provenance file holds 16 items sorted by book and n, the 8 old items equal the fixture, and the header keys equal the fixture keys', async () => {
        const run = await n2Run();
        const provenance = provenanceOf(run.tree);
        expect(provenance.items, 'the items of the two kinds').toHaveLength(16);
        expect(provenance.items.map((item) => [item.book, item.n]), 'sorted by book, then by n')
            .toEqual([...readAlongSentences(1).map((_, index) => [0, index + 1]), ...W01_DECODABLE.map((_, index) => [1, index + 1])]);
        const fixture = W01_DECODABLE.map((text, index) => itemOf(1, index + 1, text, decodablePath(index + 1), Buffer.from(`fake clip ${decodablePath(index + 1)} ${100 + index}\n`)));
        expect(provenance.items.filter((item) => item.book === 1), 'the 8 old items equal the fixture, key by key').toEqual(fixture);
        expect(HEADER_KEYS.map((key) => provenance[key as 'voice' | 'speed' | 'model']), 'the header keys equal the fixture keys')
            .toEqual([PHASE12_HEADER.voice, PHASE12_HEADER.speed, PHASE12_HEADER.model]);
    }, 120_000);

    it('the 8 old mp3 files are byte-equal', async () => {
        const run = await n2Run();
        for (let index = 1; index <= 8; index += 1) {
            const file = path.join(run.tree.contentRoot, decodablePath(index));
            expect(fs.readFileSync(file).toString('utf8'), `${decodablePath(index)} keeps its fixture bytes`).toBe(`fake clip ${decodablePath(index)} ${100 + index - 1}\n`);
        }
    }, 120_000);

    it('with no kinds the same copy gives no read-along call', async () => {
        const tree = phase12Tree();
        const voice = fakeVoice();
        const run = await runSentenceMaker(tree, voice, { whisperPython: MISSING_PYTHON });
        expect(run.error?.message, 'the run ends without an error').toBeUndefined();
        const readAlong = new Set(readAlongSentences(1));
        expect(voice.calls.filter((call) => readAlong.has(call.text)), 'no call for a read-along sentence').toEqual([]);
    }, 120_000);
});

// ---------------------------------------------------------------------------------------------
// N3: the skip rule and the per-clip write
// ---------------------------------------------------------------------------------------------

describe('N3 the skip rule and the per-clip write (M4, M5)', () => {
    it('a second run with no change makes 0 calls, changes no byte, logs the kept lines, and ends with sent: 0', async () => {
        const tree = doneReadAlongTree();
        const before = treeHashes(tree.contentRoot);
        const voice = fakeVoice();
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'] });
        expect(run.error?.message, 'the second run ends without an error').toBeUndefined();
        expect(voice.calls, 'no call is made').toEqual([]);
        expect(treeHashes(tree.contentRoot), 'no byte changes').toEqual(before);
        const kept = readAlongSentences(1).map((_, index) => `kept\t${readAlongPath(1, index + 1)}\n`);
        expect(run.log, 'the log holds one kept line for each sentence, then the sent line').toEqual([...kept, 'sent: 0']);
        expect(run.value?.lines, 'result.lines holds the same lines').toEqual([...kept, 'sent: 0']);
        expect(run.value?.chars, 'no character is sent').toBe(0);
    }, 120_000);

    it('a done sentence whose mp3 hash differs from its item is made again', async () => {
        const tree = doneReadAlongTree();
        fs.appendFileSync(path.join(tree.contentRoot, readAlongPath(1, 3)), 'x');
        const voice = fakeVoice();
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'] });
        expect(run.error?.message, 'the run ends without an error').toBeUndefined();
        expect(voice.calls.map((call) => call.text), 'one call, for the changed sentence').toEqual([readAlongSentences(1)[2]]);
        const provenance = provenanceOf(tree);
        expect(provenance.items, 'the file keeps 8 items').toHaveLength(8);
        expect(provenance.items[2].sha256, 'the item of the changed sentence holds the new hash').toBe(fileHash(path.join(tree.contentRoot, readAlongPath(1, 3))));
        const fixture = readAlongSentences(1).map((text, index) => itemOf(0, index + 1, text, readAlongPath(1, index + 1), Buffer.from(`fake clip ${readAlongPath(1, index + 1)} ${200 + index}\n`)));
        expect(provenance.items.filter((item) => item.n !== 3), 'the other items keep their fixture values').toEqual(fixture.filter((item) => item.n !== 3));
    }, 120_000);

    it('a fake that throws on call 5 leaves 4 finished items in the provenance file', async () => {
        const tree = freshSentenceTree();
        let calls = 0;
        const voice = fakeVoice({ throwsWhen: () => { calls += 1; return calls >= 5; } });
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'] });
        expect(run.error, 'the run throws').toBeInstanceOf(Error);
        expect(provenanceOf(tree).items.map((item) => [item.book, item.n]), 'the items of the finished clips are already written')
            .toEqual([[0, 1], [0, 2], [0, 3], [0, 4]]);
    }, 120_000);

    it('a run again with a working fake makes only the other sentences', async () => {
        const tree = freshSentenceTree();
        let calls = 0;
        const failing = fakeVoice({ throwsWhen: () => { calls += 1; return calls >= 5; } });
        await runSentenceMaker(tree, failing, { kinds: ['readalong'] });
        const voice = fakeVoice();
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'] });
        expect(run.error?.message, 'the run again ends without an error').toBeUndefined();
        expect(voice.calls.map((call) => call.text), 'only the sentences 5 to 8 are made').toEqual(readAlongSentences(1).slice(4));
        expect(provenanceOf(tree).items, 'the file holds the 8 items').toHaveLength(8);
        expect(fs.readdirSync(sentencesFolder(tree)).filter((name) => name.endsWith('.mp3')), 'the 8 clips exist').toHaveLength(8);
    }, 120_000);

    it('the dry run lists only the sentences that are not done, and its chars: counts only them', async () => {
        const tree = doneReadAlongTree();
        const voice = fakeVoice();
        const hashes = treeHashes(tree.contentRoot);
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'], dryRun: true });
        expect(run.error?.message, 'the dry run ends without an error').toBeUndefined();
        expect(voice.calls, 'no call is made').toEqual([]);
        expect(treeHashes(tree.contentRoot), 'nothing is written').toEqual(hashes);
        const kept = readAlongSentences(1).map((_, index) => `kept\t${readAlongPath(1, index + 1)}\n`);
        expect(run.log, 'the log holds one kept line for each sentence, then the chars line').toEqual([...kept, 'chars: 0']);
        expect(run.value?.lines, 'result.lines holds the same lines').toEqual([...kept, 'chars: 0']);
    }, 120_000);
});

// ---------------------------------------------------------------------------------------------
// N4: the header guard
// ---------------------------------------------------------------------------------------------

describe('N4 the header guard (M4)', () => {
    const headers: { name: string; header: { voice: string; speed: number; model: string } }[] = [
        { name: 'another voice', header: { voice: 'English_other_voice', speed: 1, model: 'speech-2.8-hd' } },
        { name: 'another speed', header: { voice: VOICE, speed: 2, model: 'speech-2.8-hd' } },
        { name: 'another model', header: { voice: VOICE, speed: 1, model: 'speech-2.7' } },
    ];

    for (const { name, header } of headers) {
        it(`throws for a header with ${name}, before the first call, and changes no file`, async () => {
            const tree = phase12Tree(header);
            const voice = fakeVoice();
            const hashes = treeHashes(tree.contentRoot);
            const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'] });
            expect(run.error?.message, 'the exact error').toBe('sentence clips: the provenance file has another voice, speed, or model');
            expect(voice.calls, 'no call is made').toEqual([]);
            expect(treeHashes(tree.contentRoot), 'no file changes, and no file appears').toEqual(hashes);
        }, 120_000);
    }
});

// ---------------------------------------------------------------------------------------------
// N5: the log of the sentence maker
// ---------------------------------------------------------------------------------------------

/** The cached run of N5 with one retake. */
let cachedN5: Promise<{ log: string[]; result: MakeSentenceClipsResult }> | undefined;

/**
 * The run of the sentence maker with one retake of the first sentence, and the `log` collector.
 * @returns The lines that `log` received and the result.
 */
function n5Run(): Promise<{ log: string[]; result: MakeSentenceClipsResult }> {
    cachedN5 ??= (async () => {
        const tree = freshSentenceTree();
        const first = readAlongSentences(1)[0];
        const voice = fakeVoice({
            heard: (text, take) => (take === 1 && text === first ? ['no'] : text.split(' ')),
        });
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'] });
        if (run.error) throw new Error(`the N5 run failed: ${run.error.message}`);
        return { log: run.log, result: run.value as MakeSentenceClipsResult };
    })();
    return cachedN5;
}

describe('N5 the log of the sentence maker (M6)', () => {
    it('a run with one retake gives the exact call lines call 1 to call 9, and the last line is sent: <s>', async () => {
        const run = await n5Run();
        const texts = readAlongSentences(1);
        const lens = texts.map((text) => text.length);
        const expected: string[] = [];
        let sent = 0;
        let k = 0;
        texts.forEach((text, index) => {
            const takes = index === 0 ? 2 : 1;
            for (let take = 1; take <= takes; take += 1) {
                k += 1;
                sent += lens[index];
                expected.push(`call ${k}\t${readAlongPath(1, index + 1)}\ttake ${take}\tchars ${lens[index]}\tsent ${sent}`);
            }
        });
        expect(run.result.lines.slice(0, expected.length), 'the 9 call lines').toEqual(expected);
        expect(run.result.lines, 'the sent line is the last line').toEqual([...expected, `sent: ${sent}`]);
        expect(run.result.chars, 'the sent sum equals the chars field').toBe(sent);
    }, 120_000);

    it('log receives the same lines in the same order as result.lines', async () => {
        const run = await n5Run();
        expect(run.log, 'the same lines, in the same order').toEqual(run.result.lines);
    }, 120_000);

    it('a fake that throws on call 3 gives 3 call lines, the failed sent line, and the same error', async () => {
        const tree = freshSentenceTree();
        const lens = readAlongSentences(1).map((text) => text.length);
        const voice = fakeVoice({ throwsWhen: (text) => text === readAlongSentences(1)[2] });
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'] });
        expect(run.error?.message, 'the same error').toBe(`fake mmx: the take 1 of "${readAlongSentences(1)[2]}" fails`);
        const sent = lens[0] + lens[1] + lens[2];
        expect(run.log.filter((line) => line.startsWith('call ')), 'the 3 call lines').toHaveLength(3);
        expect(run.log[run.log.length - 1], 'the failed sent line is the last line').toBe(`sent: ${sent} (run failed)`);
    }, 120_000);

    it('the character limit stops the run before a call, and the failed sent line follows', async () => {
        const tree = freshSentenceTree();
        const lens = readAlongSentences(1).map((text) => text.length);
        // changed 2026-11-14 (Red retry R1, D2)
        const limit = 137;
        const first = readAlongSentences(1)[0];
        const voice = fakeVoice({ heard: (text, take) => (take === 1 && text === first ? ['no'] : text.split(' ')) });
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'], maxChars: limit });
        expect(run.error, 'the maker throws').toBeInstanceOf(Error);
        expect(run.error?.message).toMatch(/char/i);
        // changed 2026-11-14 (Red retry R1, D2)
        expect(voice.calls.map((call) => call.text), 'the calls before the limit').toEqual([first, ...readAlongSentences(1).slice(0, 7)]);
        expect(run.log.filter((line) => line.startsWith('call ')), 'the 8 call lines').toHaveLength(8);
        expect(run.log[run.log.length - 1], 'the failed sent line holds the characters of the earlier calls')
            .toBe(`sent: ${lens[0] * 2 + lens.slice(1, 7).reduce((a, b) => a + b, 0)} (run failed)`);
    }, 120_000);

    it('a dry run gives no call line and no sent: line, and log receives the list lines', async () => {
        const tree = freshSentenceTree();
        const voice = fakeVoice();
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'], dryRun: true });
        expect(run.error?.message, 'the dry run ends without an error').toBeUndefined();
        expect(run.log.filter((line) => line.startsWith('call ') || line.startsWith('sent:')), 'no call line and no sent line').toEqual([]);
        expect(run.log, 'the list lines and the chars line').toEqual(run.value?.lines ?? []);
        expect(run.value?.lines[run.value.lines.length - 1], 'the chars line').toBe(`chars: ${READALONG_CHARS_BY_WEEK[1]}`);
    }, 120_000);

    it('a run with a done sentence gives its kept line with the exact bytes', async () => {
        const tree = doneReadAlongTree();
        fs.appendFileSync(path.join(tree.contentRoot, readAlongPath(1, 3)), 'x');
        const voice = fakeVoice();
        const run = await runSentenceMaker(tree, voice, { kinds: ['readalong'] });
        expect(run.error?.message, 'the run ends without an error').toBeUndefined();
        const kept = readAlongSentences(1).map((_, index) => `kept\t${readAlongPath(1, index + 1)}\n`);
        // changed 2026-11-14 (Red retry R1, D3)
        for (const line of kept.filter((_, index) => index !== 2)) expect(run.log, `the exact bytes of ${JSON.stringify(line)}`).toContain(line);
        expect(run.log, 'no kept line for the remade sentence').not.toContain(kept[2]);
        expect(run.log.filter((line) => line.startsWith('call ')), 'the one call line of the changed sentence').toHaveLength(1);
        expect(run.log[run.log.length - 1], 'the sent line is the last line').toBe(`sent: ${readAlongSentences(1)[2].length}`);
    }, 120_000);
});

// ---------------------------------------------------------------------------------------------
// N6: the log of the word maker
// ---------------------------------------------------------------------------------------------

describe('N6 the log of the word maker (M6)', () => {
    it('gives the exact call lines with the word key, the sent: line, and the Phase 12 list, chars, and made lines', async () => {
        const tree = wordMakerTree();
        const voice = fakeVoice();
        const run = await runWordMaker(tree, voice);
        expect(run.error?.message, 'the run ends without an error').toBeUndefined();
        expect(run.value?.made, 'the practice words of week 1').toEqual(['wa-fan', 'wa-hen']);
        expect(run.value?.lines[0], 'the list line of fan').toBe('fan\tFan');
        expect(run.value?.lines[1], 'the list line of hen').toBe('hen\tHen');
        expect(run.value?.lines[2], 'the chars line').toBe('chars: 6');
        expect(run.value?.lines[3], 'the call line of fan').toBe('call 1\tfan\ttake 1\tchars 3\tsent 3');
        // changed 2026-11-14 (Red retry R1, D4)
        expect(run.value?.lines[5], 'the call line of hen').toBe('call 2\then\ttake 1\tchars 3\tsent 6');
        expect(run.value?.lines[7], 'the sent line').toBe('sent: 6');
        expect(run.value?.chars, 'the sent sum equals the chars field').toBe(6);
        expect(run.value?.lines.some((line) => line.startsWith('made wa-fan take 1')), 'the made line of fan').toBe(true);
        expect(run.value?.lines.some((line) => line.startsWith('made wa-hen take 1')), 'the made line of hen').toBe(true);
        expect(run.log, 'the same lines, in the same order').toEqual(run.value?.lines ?? []);
    }, 120_000);

    it('a fake that throws on call 2 gives 1 call line and the failed sent line', async () => {
        const tree = wordMakerTree();
        const voice = fakeVoice({ throwsWhen: (text) => text === 'Hen' });
        const run = await runWordMaker(tree, voice);
        expect(run.error?.message, 'the same error').toBe('fake mmx: the take 1 of "Hen" fails');
        // changed 2026-11-14 (Red retry R1, D5)
        expect(run.log.filter((line) => line.startsWith('call ')), 'the call lines of fan and hen').toEqual(['call 1\tfan\ttake 1\tchars 3\tsent 3', 'call 2\then\ttake 1\tchars 3\tsent 6']);
        expect(run.log[run.log.length - 1], 'the failed sent line is the last line').toBe('sent: 6 (run failed)');
    }, 120_000);
});

// ---------------------------------------------------------------------------------------------
// N7: main of both makers
// ---------------------------------------------------------------------------------------------

describe('N7 main of both makers (M6, M3)', () => {
    it('the usage of both makers names --kind', async () => {
        const sentenceMain = await sentenceMaker('main');
        const wordMain = await wordMaker('main');
        const sentenceHelp = await captureOutput(() => sentenceMain(['--help']));
        expect(sentenceHelp.value).toBe(0);
        expect(sentenceHelp.out.join('\n'), 'the usage of the sentence maker').toContain('--kind');
        const wordHelp = await captureOutput(() => wordMain(['--help']));
        expect(wordHelp.value).toBe(0);
        expect(wordHelp.out.join('\n'), 'the usage of the word maker').toContain('--kind');
    });

    it('a value of --kind other than decodable, readalong, or all exits 2 for both makers', async () => {
        const sentenceMain = await sentenceMaker('main');
        const wordMain = await wordMaker('main');
        expect(await captureOutput(() => sentenceMain(['--level', '2', '--week', '1', '--kind', 'readaong', '--dry-run'])).then((run) => run.value), 'the sentence maker').toBe(2);
        expect(await captureOutput(() => wordMain(['--level', '2', '--week', '1', '--kind', 'readaong', '--dry-run'])).then((run) => run.value), 'the word maker').toBe(2);
    });

    it('a real run of the sentence maker ends with sent: <s> and then made: <n>, and stdout holds each line once', async () => {
        const tree = phase12Tree();
        const voice = fakeVoice();
        const sentenceMain = await sentenceMaker('main');
        const missing = process.env.WHISPER_PYTHON;
        process.env.WHISPER_PYTHON = MISSING_PYTHON;
        try {
            const run = await captureOutput(() => sentenceMain(['--level', '2', '--week', '1'], {
                contentRoot: tree.contentRoot,
                kinds: ['readalong'],
                synthesize: voice.synthesize,
                recognize: voice.recognize,
            }));
            expect(run.value, 'the exit code').toBe(0);
            expect(run.out[run.out.length - 1], 'the made line is the last line').toBe('made: 8');
            expect(run.out[run.out.length - 2], 'the sent line comes before the made line').toBe(`sent: ${READALONG_CHARS_BY_WEEK[1]}`);
            expect(new Set(run.out).size, 'each line once').toBe(run.out.length);
        } finally {
            if (missing === undefined) delete process.env.WHISPER_PYTHON;
            else process.env.WHISPER_PYTHON = missing;
        }
    }, 120_000);

    it('a failed run of the sentence maker exits 1, with the failed sent line in stdout and the error in stderr', async () => {
        const tree = freshSentenceTree();
        const lens = readAlongSentences(1).map((text) => text.length);
        const voice = fakeVoice({ throwsWhen: (text) => text === readAlongSentences(1)[2] });
        const sentenceMain = await sentenceMaker('main');
        const missing = process.env.WHISPER_PYTHON;
        process.env.WHISPER_PYTHON = MISSING_PYTHON;
        try {
            const run = await captureOutput(() => sentenceMain(['--level', '2', '--week', '1'], {
                contentRoot: tree.contentRoot,
                kinds: ['readalong'],
                synthesize: voice.synthesize,
                recognize: voice.recognize,
            }));
            expect(run.value, 'the exit code').toBe(1);
            expect(run.out, 'the failed sent line is in stdout').toContain(`sent: ${lens[0] + lens[1] + lens[2]} (run failed)`);
            expect(run.err.join('\n'), 'the error is in stderr').toContain('fake mmx');
        } finally {
            if (missing === undefined) delete process.env.WHISPER_PYTHON;
            else process.env.WHISPER_PYTHON = missing;
        }
    }, 120_000);

    it('an absent venv exits 2 with sent: 0 (run failed), for both makers', async () => {
        const sentenceMain = await sentenceMaker('main');
        const wordMain = await wordMaker('main');
        const missing = process.env.WHISPER_PYTHON;
        process.env.WHISPER_PYTHON = MISSING_PYTHON;
        try {
            const sentenceRun = await captureOutput(() => sentenceMain(['--level', '2', '--week', '1']));
            expect(sentenceRun.value, 'the sentence maker exits 2').toBe(2);
            expect(sentenceRun.out, 'the failed sent line with no character').toContain('sent: 0 (run failed)');
            const wordRun = await captureOutput(() => wordMain(['--level', '2', '--week', '1']));
            expect(wordRun.value, 'the word maker exits 2').toBe(2);
            expect(wordRun.out, 'the failed sent line with no character').toContain('sent: 0 (run failed)');
        } finally {
            if (missing === undefined) delete process.env.WHISPER_PYTHON;
            else process.env.WHISPER_PYTHON = missing;
        }
    }, 120_000);

    it('a real run of the word maker ends with sent: <s> and then made: <n>', async () => {
        const tree = wordMakerTree();
        const voice = fakeVoice();
        const wordMain = await wordMaker('main');
        const missing = process.env.WHISPER_PYTHON;
        process.env.WHISPER_PYTHON = MISSING_PYTHON;
        try {
            const run = await captureOutput(() => wordMain(['--level', '2', '--week', '1', '--practice'], {
                contentRoot: tree.contentRoot,
                bankFolder: tree.bankFolder,
                date: '2026-11-14',
                maxChars: 150,
                synthesize: voice.synthesize,
                recognize: voice.recognize,
            }));
            expect(run.value, 'the exit code').toBe(0);
            expect(run.out[run.out.length - 1], 'the made line is the last line').toBe('made: 2');
            expect(run.out[run.out.length - 2], 'the sent line comes before the made line').toBe('sent: 6');
        } finally {
            if (missing === undefined) delete process.env.WHISPER_PYTHON;
            else process.env.WHISPER_PYTHON = missing;
        }
    }, 120_000);
});

// ---------------------------------------------------------------------------------------------
// N8: set-sentence-clips.ts with kinds
// ---------------------------------------------------------------------------------------------

/** The cached tree of N8 with the Phase 12 decodable array. */
let cachedN8: Promise<{ tree: WordTree; before: string }> | undefined;

/**
 * The mapper tree with the Phase 12 decodable array, written by one run of the Phase 12 mapper
 * without `kinds`.
 * @returns The tree and the week text before the read-along run.
 */
function n8Tree(): Promise<{ tree: WordTree; before: string }> {
    cachedN8 ??= (async () => {
        const tree = mapperTree();
        const setSentenceClips = await sentenceMapper('setSentenceClips');
        const setup = await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot }));
        expect(setup.error?.message, 'the Phase 12 setup run writes the decodable array').toBeUndefined();
        const before = fs.readFileSync(tree.weekFile, 'utf8');
        const parsed = StorytimeWeekSchema.parse(JSON.parse(before)) as unknown as RawWeek;
        expect(parsed.books[1].audio.sentenceClips, 'the setup run holds the decodable array').toEqual(clipFieldOf(W01_DECODABLE.map((text, index) => itemOf(1, index + 1, text, decodablePath(index + 1), Buffer.from(`fake clip ${decodablePath(index + 1)} ${400 + index}\n`)))));
        expect(parsed.books[0].audio.sentenceClips, 'the setup run holds no read-along array').toBeUndefined();
        return { tree, before };
    })();
    return cachedN8;
}

describe('N8 set-sentence-clips.ts with kinds (M3, FR 4)', () => {
    it('with kinds ["readalong"] the array form comes after the wordClips object of book 0, and the new text parses with the schema', async () => {
        const setSentenceClips = await sentenceMapper('setSentenceClips');
        const { tree, before } = await n8Tree();
        const run = await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, kinds: ['readalong'] }));
        expect(run.error?.message, 'the run ends without an error').toBeUndefined();
        const after = fs.readFileSync(tree.weekFile, 'utf8');
        const diff = insertionDiff(before.split('\n'), after.split('\n'));
        expect(diff.added[0], 'the block opens after the last key of the audio object of book 0').toContain('"sentenceClips": [');
        const parsed = StorytimeWeekSchema.parse(JSON.parse(after)) as unknown as RawWeek;
        expect(parsed.books[0].audio.sentenceClips, 'the parse output keeps the read-along items')
            .toEqual(clipFieldOf(readAlongSentences(1).map((text, index) => itemOf(0, index + 1, text, readAlongPath(1, index + 1), Buffer.from(`fake clip ${readAlongPath(1, index + 1)} ${300 + index}\n`)))));
    }, 60_000);

    it('the run adds 34 lines (4 for each of 8 items, plus 2), the closing } of wordClips gains a comma, and the decodable block is byte-equal', async () => {
        const setSentenceClips = await sentenceMapper('setSentenceClips');
        const { tree, before } = await n8Tree();
        await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, kinds: ['readalong'] }));
        const after = fs.readFileSync(tree.weekFile, 'utf8');
        const diff = insertionDiff(before.split('\n'), after.split('\n'));
        expect(diff.added, 'the 34 lines of the array').toHaveLength(34);
        expect(diff.added.filter((line) => line.trim() === '{'), 'one open line for each item').toHaveLength(8);
        expect(diff.changed, 'one closing line gains a comma').toHaveLength(1);
        expect(diff.changed[0][1]).toBe(`${diff.changed[0][0]},`);
        const parsed = StorytimeWeekSchema.parse(JSON.parse(after)) as unknown as RawWeek;
        expect(parsed.books[1].audio.sentenceClips, 'the decodable items stay (the diff form proves the byte-equality)').toEqual(clipFieldOf(W01_DECODABLE.map((text, index) => itemOf(1, index + 1, text, decodablePath(index + 1), Buffer.from(`fake clip ${decodablePath(index + 1)} ${400 + index}\n`)))));
    }, 60_000);

    it('a second run changes no byte', async () => {
        const setSentenceClips = await sentenceMapper('setSentenceClips');
        const { tree } = await n8Tree();
        await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, kinds: ['readalong'] }));
        ageTree(tree.contentRoot);
        const hashes = treeHashes(tree.contentRoot);
        const stamps = treeStamps(tree.contentRoot);
        const run = await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, kinds: ['readalong'] }));
        expect(run.error?.message, 'the second run ends without an error').toBeUndefined();
        expect(treeHashes(tree.contentRoot), 'no byte changes').toEqual(hashes);
        expect(treeStamps(tree.contentRoot), 'no modification time changes').toEqual(stamps);
    }, 60_000);

    it('kinds ["readalong", "decodable"] edits both blocks', async () => {
        const setSentenceClips = await sentenceMapper('setSentenceClips');
        const tree = mapperTree();
        const before = fs.readFileSync(tree.weekFile, 'utf8');
        const run = await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, kinds: ['readalong', 'decodable'] }));
        expect(run.error?.message, 'the run ends without an error').toBeUndefined();
        const after = fs.readFileSync(tree.weekFile, 'utf8');
        const diff = insertionDiff(before.split('\n'), after.split('\n'));
        expect(diff.added, 'the 68 lines of the two arrays').toHaveLength(68);
        expect(diff.changed, 'the two closing lines gain a comma').toHaveLength(2);
        const parsed = StorytimeWeekSchema.parse(JSON.parse(after)) as unknown as RawWeek;
        expect(parsed.books[0].audio.sentenceClips, 'the read-along array').toHaveLength(8);
        expect(parsed.books[1].audio.sentenceClips, 'the decodable array').toHaveLength(8);
    }, 60_000);

    it('a missing file or a differing hash in a decodable item does not stop a read-along run', async () => {
        const setSentenceClips = await sentenceMapper('setSentenceClips');
        const { tree } = await n8Tree();
        fs.appendFileSync(path.join(tree.contentRoot, decodablePath(2)), 'x');
        const run = await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, kinds: ['readalong'] }));
        expect(run.error?.message, 'the run ends without an error').toBeUndefined();
        const parsed = StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(tree.weekFile, 'utf8'))) as unknown as RawWeek;
        expect(parsed.books[0].audio.sentenceClips, 'the read-along array is written').toHaveLength(8);
    }, 60_000);

    it('a missing read-along file or a differing hash stops the run before any write', async () => {
        const setSentenceClips = await sentenceMapper('setSentenceClips');
        const { tree, before } = await n8Tree();
        fs.rmSync(path.join(tree.contentRoot, readAlongPath(1, 2)));
        // changed 2026-11-14 (Red retry R1, D6)
        const current = fs.readFileSync(tree.weekFile, 'utf8');
        expect(current, 'the cached tree already holds the array of the earlier cases').not.toBe(before);
        const listing = entryListing(tree.folder);
        const hashes = treeHashes(tree.folder);
        const run = await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, kinds: ['readalong'] }));
        expect(run.error, 'the mapper throws').toBeInstanceOf(Error);
        expect(run.error?.message).toContain('b0-s02');
        expect(entryListing(tree.folder), 'no file appears').toEqual(listing);
        expect(treeHashes(tree.folder), 'no file changes, and the week file is byte-equal').toEqual(hashes);
        // changed 2026-11-14 (Red retry R1, D6)
        expect(fs.readFileSync(tree.weekFile, 'utf8')).toBe(current);
    }, 60_000);
});

// ---------------------------------------------------------------------------------------------
// N9: checkReadAlongSentenceClips and the F7 rule
// ---------------------------------------------------------------------------------------------

/**
 * The read-along row of a week object.
 * @param raw The raw week.
 * @param contentRoot The content root.
 * @returns The row, or undefined.
 */
async function readAlongRowOf(raw: RawWeek, contentRoot: string): Promise<CheckRow | undefined> {
    const checkReadAlongSentenceClips = await checks('checkReadAlongSentenceClips');
    return checkReadAlongSentenceClips(StorytimeWeekSchema.parse(raw), contentRoot);
}

describe('N9 checkReadAlongSentenceClips and the F7 rule (M7, FR 5)', () => {
    it('gives the exact id and label, and pass with no detail on the correct copy', async () => {
        const { raw, contentRoot } = checkTree();
        const row = await readAlongRowOf(raw, contentRoot);
        expect(row).toEqual({ id: 'readalong-sentence-clips', label: READALONG_CLIPS_LABEL, status: 'pass' });
    });

    it('warns "no clips" when the read-along book has no field', async () => {
        const { raw, contentRoot } = checkTree();
        delete raw.books[0].audio.sentenceClips;
        expect(await readAlongRowOf(raw, contentRoot)).toEqual({ id: 'readalong-sentence-clips', label: READALONG_CLIPS_LABEL, status: 'warn', detail: 'no clips' });
    });

    it('fails with "count differs: <book>" when the array length is not the sentence count', async () => {
        const { raw, contentRoot } = checkTree();
        (raw.books[0].audio.sentenceClips as unknown[]).pop();
        const row = await readAlongRowOf(raw, contentRoot);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('count differs: 0');
    });

    it('fails with "text differs: <path>" when an item sentence is not the book sentence', async () => {
        const { raw, contentRoot } = checkTree();
        (raw.books[0].audio.sentenceClips as { sentence: string }[])[2].sentence = 'A changed sentence!';
        const row = await readAlongRowOf(raw, contentRoot);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe(`text differs: ${readAlongPath(1, 3)}`);
    });

    it('fails with "missing: <path>" when a clip file is absent', async () => {
        const { raw, contentRoot } = checkTree();
        fs.rmSync(path.join(contentRoot, readAlongPath(1, 4)));
        const row = await readAlongRowOf(raw, contentRoot);
        expect(row).toEqual({ id: 'readalong-sentence-clips', label: READALONG_CLIPS_LABEL, status: 'fail', detail: `missing: ${readAlongPath(1, 4)}` });
    });

    it('fails with "bad path: <path>" for a value that is not the M2 path of its index', async () => {
        const { raw, contentRoot } = checkTree();
        fs.writeFileSync(path.join(contentRoot, 'l2/media/w01/sentences/b0-s02-copy.mp3'), 'fake mp3 copy\n');
        (raw.books[0].audio.sentenceClips as { file: string }[])[1].file = 'l2/media/w01/sentences/b0-s02-copy.mp3';
        const row = await readAlongRowOf(raw, contentRoot);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('bad path: l2/media/w01/sentences/b0-s02-copy.mp3');
    });

    it('joins the four fail parts in the order of L9 with "; "', async () => {
        const { raw, contentRoot } = checkTree();
        const items = raw.books[0].audio.sentenceClips as { sentence: string; file: string }[];
        items.pop();
        items[0].sentence = 'A changed sentence!';
        fs.rmSync(path.join(contentRoot, readAlongPath(1, 2)));
        fs.writeFileSync(path.join(contentRoot, 'l2/media/w01/sentences/b0-s03-copy.mp3'), 'fake mp3 copy\n');
        items[2].file = 'l2/media/w01/sentences/b0-s03-copy.mp3';
        const row = await readAlongRowOf(raw, contentRoot);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe([
            'count differs: 0',
            `text differs: ${readAlongPath(1, 1)}`,
            `missing: ${readAlongPath(1, 2)}`,
            'bad path: l2/media/w01/sentences/b0-s03-copy.mp3',
        ].join('; '));
    });

    it('lets a fail win over a warn, and the detail of the fail holds no warn part', async () => {
        const { raw, contentRoot } = checkTree();
        raw.books.push(JSON.parse(JSON.stringify(raw.books[0])) as RawWeek['books'][number]);
        delete raw.books[2].audio.sentenceClips;
        fs.rmSync(path.join(contentRoot, readAlongPath(1, 1)));
        const row = await readAlongRowOf(raw, contentRoot);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe(`missing: ${readAlongPath(1, 1)}`);
    });

    it('gives no row for a week with no read-along book, for a week with no meta, and for the shipped w08', async () => {
        const checkReadAlongSentenceClips = await checks('checkReadAlongSentenceClips');
        const { raw, contentRoot } = checkTree();
        const decodableOnly = { ...raw, books: [raw.books[1]] };
        expect(checkReadAlongSentenceClips(StorytimeWeekSchema.parse(decodableOnly), contentRoot), 'a decodable book only').toBeUndefined();
        expect(checkReadAlongSentenceClips({ ...raw, meta: undefined }, contentRoot), 'no meta').toBeUndefined();
        expect(checkReadAlongSentenceClips(StorytimeWeekSchema.parse(shippedWeek(8)), contentRoot), 'the shipped w08').toBeUndefined();
    });

    it('the F7 rule: checkSentenceClips does not flag the field on a read-along book, and the read-along row does not read a decodable book', async () => {
        const checkSentenceClips = await checks('checkSentenceClips');
        const { raw, contentRoot } = checkTree();
        const parsed = StorytimeWeekSchema.parse(raw) as unknown as RawWeek;
        expect(checkSentenceClips(parsed, contentRoot), 'both fields are correct, so the decodable row passes')
            .toEqual({ id: 'sentence-clips', label: SENTENCE_CLIPS_LABEL, status: 'pass' });
        for (let index = 1; index <= 8; index += 1) fs.rmSync(path.join(contentRoot, decodablePath(index)));
        delete (parsed.books[1].audio as { sentenceClips?: unknown }).sentenceClips;
        expect(checkSentenceClips(parsed, contentRoot), 'the decodable row warns on its own book').toEqual({ id: 'sentence-clips', label: SENTENCE_CLIPS_LABEL, status: 'warn', detail: 'no clips' });
        expect(await readAlongRowOf(parsed, contentRoot), 'the read-along row does not read a decodable book').toEqual({ id: 'readalong-sentence-clips', label: READALONG_CLIPS_LABEL, status: 'pass' });
    });
});

// ---------------------------------------------------------------------------------------------
// N10: the schema on a read-along book
// ---------------------------------------------------------------------------------------------

describe('N10 the schema on a read-along book (M2, M14)', () => {
    it('sentenceClips on a read-along book parses and the parse output keeps it', () => {
        const items = clipFieldOf(readAlongSentences(1).map((text, index) => itemOf(0, index + 1, text, readAlongPath(1, index + 1), Buffer.from(`fake clip ${readAlongPath(1, index + 1)} ${500 + index}\n`))));
        const audio = BookAudioSchema.parse({
            voice: shippedVoice(1, 0),
            sentences: shippedWeek(1).books[0].audio.sentences,
            sentenceClips: items,
        }) as unknown as RawWeek['books'][number]['audio'];
        expect(audio.sentenceClips, 'the parse output keeps the field').toEqual(items);
        const { raw } = checkTree();
        const week = StorytimeWeekSchema.parse(raw) as unknown as RawWeek;
        expect(week.books[0].audio.sentenceClips, 'a full week parses with the field').toEqual(items);
    });
});

// ---------------------------------------------------------------------------------------------
// N11: the cut guard
// ---------------------------------------------------------------------------------------------

describe('N11 the cut guard (M10, FR 8)', () => {
    it('gives true for a maker clip that the synthetic book mp3 holds, and false for a maker output of a fresh generation', async () => {
        const looksLikeCut = await sentences('looksLikeCut');
        const firstRun = freshSentenceTree();
        const firstVoice = fakeVoice();
        const first = await runSentenceMaker(firstRun, firstVoice, { kinds: ['readalong'] });
        expect(first.error?.message, 'the first run ends without an error').toBeUndefined();
        const clipSamples = decodeMp3(path.join(firstRun.contentRoot, readAlongPath(1, 1)));
        const bookSamples = noise(7, clipSamples.length + 16000);
        bookSamples.set(clipSamples, 8000);
        const bookFile = path.join(firstRun.folder, 'book.mp3');
        writeMp3(bookSamples, bookFile);
        const sourceSamples = decodeMp3(bookFile);
        expect(looksLikeCut(clipSamples, sourceSamples, RATE), 'the positive control: the book holds the take').toBe(true);
        const secondRun = freshSentenceTree();
        const secondVoice = fakeVoice({ spanOffset: 8000 });
        const second = await runSentenceMaker(secondRun, secondVoice, { kinds: ['readalong'] });
        expect(second.error?.message, 'the second run ends without an error').toBeUndefined();
        const freshSamples = decodeMp3(path.join(secondRun.contentRoot, readAlongPath(1, 1)));
        expect(looksLikeCut(freshSamples, sourceSamples, RATE), 'the negative control: a fresh generation is no cut').toBe(false);
    }, 240_000);
});

// ---------------------------------------------------------------------------------------------
// The guards of this file
// ---------------------------------------------------------------------------------------------

describe('the guards of this file (M15)', () => {
    it('holds no path of the Measure track folders', () => {
        expect(fs.readFileSync(SELF_FILE, 'utf8').includes(FORBIDDEN_PATH)).toBe(false);
    });
});
