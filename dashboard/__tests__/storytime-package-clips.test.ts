// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT } from '../lib/storytime/files';
import { BookAudioSchema, SongSchema, StorytimeWeekSchema } from '../lib/storytime/schema';

/**
 * Phase 11, Red 1: the word clips of the read-along books and the lead-in of the song videos
 * (spec FR 1 to FR 6, decisions K2 to K15).
 *
 * The file holds the cases C1 to C16 of the test strategy. The module `word-clips.ts`, the three
 * scripts (bank maker, mapper, lead-in measure), the two checks, and the two schema fields do not
 * exist yet, so each case that needs one of them fails inside its body with a label that names it.
 *
 * Every table below is written by hand. The test never reads an expected value from the code under
 * test. The test reads the shipped week files and the shipped word bank. It writes only into
 * temporary copies under a temporary folder, and it removes them at the end. Mmx and faster-whisper
 * are replaced by fakes, so no case makes a paid call or loads a model. The ffmpeg cases use short
 * files that the test makes in a temporary folder.
 */

/** The dashboard folder, so that the new modules are read by path. */
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');

/** The pure module of the word clips (FR 2). */
const wordClipsModule = path.join(dashboardRoot, 'lib/storytime/word-clips.ts');

/** The bank maker (FR 3). */
const makeWordBankModule = path.join(dashboardRoot, 'scripts/storytime/make-word-bank.ts');

/** The mapper (FR 4). */
const setWordClipsModule = path.join(dashboardRoot, 'scripts/storytime/set-word-clips.ts');

/** The lead-in script (FR 5). */
const measureLeadInModule = path.join(dashboardRoot, 'scripts/storytime/measure-video-lead-in.ts');

/** The script of the week checks (FR 6). */
const checkWeeksModule = path.join(dashboardRoot, 'scripts/storytime/check-weeks.ts');

/** This file, so that the guard case reads its own text. */
const SELF_FILE = path.join(dashboardRoot, '__tests__/storytime-package-clips.test.ts');

/** The root of the temporary copies of the tests. */
const TEMP_ROOT = '/tmp/opencode';

/** The sample rate of the word bank and of the fake takes. */
const RATE = 32000;

/** The peak sample of a bank clip: round(32767 x 10^(-3/20)) (K7 step 1). */
const PEAK = 23197;

/** The quiet edge of a bank clip: 80 ms at 32 kHz (K7 step 2). */
const EDGE = 2560;

/** The quiet start and the quiet end of a fake take, in samples. Both are long against the edge. */
const TAKE_LEAD = 9600;
const TAKE_TAIL = 12800;

/** The quiet gap inside a fake take with a bad pause: 0.8 s, above the limit of 0.6 s (K9). */
const PAUSE_SAMPLES = 25600;

/** The date that the maker writes into the `added` key of a new row. */
const DATE = '2026-11-08';

/** An interpreter path that does not exist, for the venv check of K9. */
const MISSING_PYTHON = '/tmp/opencode/storytime-clips-no-venv/bin/python';

/** The exact label of the check `word-clips` (K12). */
const WORD_CLIPS_LABEL = 'The book word clips named in the package exist and match the word bank';

/** The exact label of the check `song-lead-in` (K14). */
const SONG_LEAD_IN_LABEL = 'The song video lead-in is set for each song video';

/** The text that no line of this file may hold: the guard of C16. The pieces keep this file clean. */
const FORBIDDEN_PATH = `${['measure', 'tracks'].join('/')}/`;

/** The keys of the book 0 of week 1, sorted by code point, written by hand from the addendum table. */
const W01_BOOK0 = ['am', 'ben', 'hello', 'i', 'may', 'mia', 'nan', 'pat', 'pip', 'sam', 'teacher', 'your'];

/** The keys of the book 1 of week 1, sorted by code point, written by hand from the addendum table. */
const W01_BOOK1 = ['a', 'and', 'can', 'nan', 'neck', 'nest', 'net', 'nod', 'nose', 'nurse', 'nut'];

/** The keys of week 1 in the order of their first word in the document (books, then speeds, then sentences). */
const W01_DOCUMENT_ORDER = [
    'hello', 'i', 'am', 'pat', 'may', 'sam', 'mia', 'nan', 'ben', 'your', 'teacher', 'pip',
    'a', 'nest', 'net', 'nut', 'nose', 'neck', 'nurse', 'and', 'can', 'nod',
];

/** The key slots of each book and the distinct clip files of each week (addendum table, written by hand). */
const KEYS_PER_BOOK: Record<number, number[]> = {
    1: [12, 11],
    2: [19, 4],
    3: [10, 10],
    4: [12, 14],
    5: [12, 16],
    6: [12, 14],
    7: [13, 14],
};
const FILES_PER_WEEK: Record<number, number> = { 1: 22, 2: 23, 3: 20, 4: 24, 5: 28, 6: 22, 7: 24 };

/** The keys of the three practice lists of week 1, sorted by code point (Phase 12, spec L3, hand-written from the Facts section). */
const W01_OPENING = ['fan', 'goodbye', 'hello', 'hen', 'nest', 'net', 'nose', 'nut', 'pen', 'sun'];
const W01_FAMILY = ['boy', 'friend', 'girl', 'goodbye', 'hello', 'teacher'];
const W01_TRICKY = ['a', 'and', 'can'];

/** The 30 distinct keys of week 1: the two books and the three practice lists, sorted (Phase 12, spec L5). */
const W01_UNION = [...new Set([...W01_BOOK0, ...W01_BOOK1, ...W01_OPENING, ...W01_FAMILY, ...W01_TRICKY])].sort();

/** The 12 keys of week 1 that have no bank row, sorted. */
const W01_MISSING = ['a', 'and', 'ben', 'can', 'i', 'may', 'mia', 'neck', 'nod', 'nurse', 'pip', 'your'];

/** The 10 keys of week 1 that have a bank row. */
const W01_PRESENT = ['am', 'hello', 'nan', 'nest', 'net', 'nose', 'nut', 'pat', 'sam', 'teacher'];

/** The TTS text of each missing key of week 1 (K8): the first written form, `uh` for a, `I` for i. */
const W01_TEXT: Record<string, string> = {
    a: 'uh',
    and: 'and',
    ben: 'Ben',
    can: 'can',
    i: 'I',
    may: 'May',
    mia: 'Mia',
    neck: 'neck',
    nod: 'nod',
    nurse: 'nurse',
    pip: 'Pip',
    your: 'your',
};

/** The `weeks` value of each missing key of week 1 (K6): the weeks of level 2 whose books hold the key. */
const W01_WEEKS: Record<string, string> = {
    a: '1;3;4;5;6;7',
    and: '1;2;4;5',
    ben: '1',
    can: '1;2;3;4;5;6;7',
    i: '1;2;3;5;6',
    may: '1',
    mia: '1',
    neck: '1',
    nod: '1',
    nurse: '1',
    pip: '1;2;3;4;6;7',
    your: '1',
};

/** The variant list of the heard check (K9), written by hand. */
const HEARD_VARIANTS: Record<string, string[]> = {
    a: ['uh', 'ah'],
    i: ['eye', 'aye'],
    in: ['inn'],
    no: ['know'],
    oh: ['o', 'owe'],
    't-shirt': ['t shirt', 'tshirt'],
    see: ['sea'],
    your: ["you're", 'yore'],
};

/** The keys of a bank row, in the order of K6. */
const ROW_KEYS = [
    'n', 'id', 'word', 'file', 'mp3', 'sources', 'weeks', 'take', 'len_s', 'peak_dbfs', 'recognized', 'note', 'sha256',
];

/** The row of the word bank (K6). */
interface WordBankRow {
    n: number;
    id: string;
    word: string;
    file: string;
    mp3: string;
    sources: string;
    weeks: string;
    take: number;
    len_s: number;
    peak_dbfs: number;
    recognized: string;
    note: string;
    sha256: string;
    text?: string;
    added?: string;
}

/** The words of one book, as `bookWordKeys` reads them. */
interface BookWords {
    sentences?: readonly { words?: readonly { word: string }[] }[];
    slowSentences?: readonly { words?: readonly { word: string }[] }[];
}

/** The pure module of the word clips (FR 2). */
interface WordClipsModule {
    bookWordKey?: (word: string) => string | undefined;
    wordClipStem?: (key: string) => string;
    wordClipPath?: (level: number, week: number, key: string) => string;
    bookWordKeys?: (audio: BookWords) => string[];
    planWordClips?: (input: { level: number; week: number; books: readonly { audio: BookWords }[] }) => {
        maps: Record<string, string>[];
        files: string[];
    };
    wordClipText?: (key: string, firstForm: string) => string;
    WORD_CLIP_HEARD_VARIANTS?: Readonly<Record<string, readonly string[]>>;
    heardText?: (words: readonly string[]) => string;
    heardPasses?: (key: string, heard: string) => { pass: boolean; note: string };
    normalizeWordClip?: (samples: Int16Array, rate: number) => Int16Array;
    appendBankRows?: (manifestText: string, rows: readonly WordBankRow[]) => string;
    parseSilenceOnsets?: (ffmpegLog: string, lengthSeconds: number) => number[];
    videoLeadIn?: (audioOnsets: readonly number[], videoOnsets: readonly number[]) => number;
}

/** The options of the bank maker (FR 3). */
interface MakeWordBankOptions {
    level: number;
    week: number;
    contentRoot: string;
    bankFolder: string;
    date: string;
    maxChars?: number;
    dryRun?: boolean;
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
    main?: (argv: string[]) => number | Promise<number>;
}

/** The options of the mapper (FR 4). */
interface SetWordClipsOptions {
    weekFile: string;
    contentRoot: string;
    bankFolder: string;
    check?: boolean;
}

/** The result of the mapper. */
interface SetWordClipsResult {
    keys: number;
    files: number;
    removed: string[];
    lines: string[];
}

/** The mapper (FR 4). */
interface SetWordClipsModule {
    setWordClips?: (options: SetWordClipsOptions) => SetWordClipsResult | Promise<SetWordClipsResult>;
    main?: (argv: string[]) => number | Promise<number>;
}

/** The lead-in script (FR 5). */
interface MeasureLeadInModule {
    measureVideoLeadIn?: (options: { weekFile: string; contentRoot: string; write?: boolean }) => {
        leadIn: number | undefined;
        lines: string[];
    } | Promise<{ leadIn: number | undefined; lines: string[] }>;
    main?: (argv: string[]) => number | Promise<number>;
}

/** The row of a check. */
interface CheckRow {
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    detail?: string;
}

/** The script of the week checks (FR 6). */
interface CheckWeeksModule {
    checkWordClips?: (week: unknown, contentRoot?: string) => CheckRow | undefined;
    checkSongLeadIn?: (week: unknown) => CheckRow | undefined;
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
 * The week text without its clip blocks (`wordClips`, `trickyWordClips`, and `sentenceClips`), and
 * without the comma that a block added to the line before it. Every case that copies a shipped week
 * file starts here, so that the case stays valid after the Clips tasks add those blocks (Phase 11 and
 * Phase 12, spec L3, L7, and L17).
 * @param text The text of the shipped week file.
 * @returns The text of the start file.
 */
function withoutWordClips(text: string): string {
    const out: string[] = [];
    const lines = text.split('\n');
    for (let index = 0; index < lines.length; index += 1) {
        const open = lines[index].match(/^(\s*)"(wordClips|trickyWordClips|sentenceClips)": ([{[])$/);
        if (!open) {
            out.push(lines[index]);
            continue;
        }
        const close = `${open[1]}${open[3] === '{' ? '}' : ']'}`;
        while (index < lines.length && lines[index].trimEnd().replace(/,$/, '') !== close) index += 1;
        const hadComma = lines[index]?.trimEnd().endsWith(',') ?? false;
        const previous = out[out.length - 1];
        if (!hadComma && previous !== undefined && previous.endsWith(',')) out[out.length - 1] = previous.slice(0, -1);
    }
    return out.join('\n');
}

/**
 * The week text without its `videoLeadInSeconds` line.
 * @param text The text of the week file.
 * @returns The text without that line.
 */
function withoutLeadIn(text: string): string {
    const out: string[] = [];
    for (const line of text.split('\n')) {
        if (/^\s*"videoLeadInSeconds": /.test(line)) {
            const previous = out[out.length - 1];
            if (!line.endsWith(',') && previous !== undefined && previous.endsWith(',')) {
                out[out.length - 1] = previous.slice(0, -1);
            }
            continue;
        }
        out.push(line);
    }
    return out.join('\n');
}

/**
 * The text of a shipped week without the two new fields of the phase.
 * @param week The week.
 * @returns The text of the start file, which parses as JSON.
 */
function plainWeek(week: number): string {
    const text = withoutLeadIn(withoutWordClips(shippedText(week)));
    expect(() => JSON.parse(text), `the start file of week ${week} parses as JSON`).not.toThrow();
    return text;
}

/**
 * The books of a week text, with the words of their audio.
 * @param text The text of the week file.
 * @returns The `audio` object of each book.
 */
function bookAudios(text: string): BookWords[] {
    const week = JSON.parse(text) as { books?: { audio: BookWords }[] };
    return (week.books ?? []).map((book) => book.audio);
}

/**
 * The map of the clip paths of a list of keys in week 1.
 * @param keys The keys.
 * @returns The map from each key to its K3 path.
 */
function w01Map(keys: string[]): Record<string, string> {
    return Object.fromEntries(keys.map((key) => [key, `l2/media/w01/words/wa-${key.replace(/'/g, '')}.mp3`]));
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
 * The error of a sync action.
 * @param action The action.
 * @returns The error, or undefined when the action did not throw.
 */
function thrownBy(action: () => unknown): Error | undefined {
    try {
        action();
    } catch (error) {
        return error instanceof Error ? error : new Error(String(error));
    }
    return undefined;
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
 * The module at a path.
 * @param file The path of the module.
 * @returns The module.
 * @throws Error When the module file is missing. The message names the path.
 */
async function loadModule<T>(file: string): Promise<T> {
    if (!fs.existsSync(file)) throw new Error(`Missing module: ${file}`);
    return await import(file) as T;
}

/**
 * One export of a module.
 * @param file The path of the module.
 * @param name The name of the export.
 * @returns The export.
 * @throws Error When the module or the export is missing. The message names both.
 */
async function exportOf<T extends object, K extends keyof T>(file: string, name: K): Promise<NonNullable<T[K]>> {
    const mod = await loadModule<T>(file);
    const value = mod[name];
    if (value === undefined || value === null) throw new Error(`Missing export: ${String(name)} of ${file}`);
    return value as NonNullable<T[K]>;
}

/** One export of the pure module. */
const clips = <K extends keyof WordClipsModule>(name: K): Promise<NonNullable<WordClipsModule[K]>> => exportOf<WordClipsModule, K>(wordClipsModule, name);

/** One export of the bank maker. */
const maker = <K extends keyof MakeWordBankModule>(name: K): Promise<NonNullable<MakeWordBankModule[K]>> => exportOf<MakeWordBankModule, K>(makeWordBankModule, name);

/** One export of the mapper. */
const mapper = <K extends keyof SetWordClipsModule>(name: K): Promise<NonNullable<SetWordClipsModule[K]>> => exportOf<SetWordClipsModule, K>(setWordClipsModule, name);

/** One export of the lead-in script. */
const leadInScript = <K extends keyof MeasureLeadInModule>(name: K): Promise<NonNullable<MeasureLeadInModule[K]>> => exportOf<MeasureLeadInModule, K>(measureLeadInModule, name);

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
 * The comparison of two texts that differ only by changed lines and added lines. A changed line gains a
 * comma. An added line is new. The function throws for any other difference.
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

/**
 * The indexes of the lines that differ between two texts of the same line count.
 * @param before The lines of the first text.
 * @param after The lines of the second text.
 * @returns The indexes.
 */
function changedIndexes(before: string[], after: string[]): number[] {
    expect(after.length, 'the two texts have the same line count').toBe(before.length);
    return before.flatMap((line, index) => (line === after[index] ? [] : [index]));
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
 * The largest absolute sample.
 * @param samples The samples.
 * @returns The peak.
 */
function peakOf(samples: Int16Array): number {
    let peak = 0;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    return peak;
}

/**
 * A loud stretch: a cosine of 10000 that starts at +10000 and ends at -10000, so that its first and
 * its last sample are loud and its peak is exactly 10000.
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
 * The samples of a fake take: a long quiet start, a loud body, and a long quiet end.
 * @param span The length of the loud part, in samples.
 * @param gap Whether the loud part holds a quiet gap of 0.8 s.
 * @returns The samples.
 */
function takeSamples(span: number, gap: boolean): Int16Array {
    const first = Math.floor(span / 2);
    const body = gap
        ? [...loud(first), ...new Array<number>(PAUSE_SAMPLES).fill(0), ...loud(span - first)]
        : [...loud(span)];
    return Int16Array.from([...new Array<number>(TAKE_LEAD).fill(0), ...body, ...new Array<number>(TAKE_TAIL).fill(0)]);
}

/** One call of the fake voice: the text, the take of that text, and the loud extent that marks it. */
interface FakeCall {
    text: string;
    take: number;
    extent: number;
}

/** The fake of mmx and of faster-whisper. */
interface FakeVoice {
    calls: FakeCall[];
    synthesize: (text: string, wavFile: string) => void;
    recognize: (wavFiles: readonly string[]) => string[][];
}

/**
 * The fake voice. Each call to `synthesize` writes a take whose loud extent is unique, so that
 * `recognize` finds the text and the take of any file, whatever its path.
 * @param options `heard` gives the words that the fake hears for a text and a take (default: the text).
 * `pause` says that a take holds a quiet gap above the limit.
 * @returns The fake.
 */
function fakeVoice(options: {
    heard?: (text: string, take: number) => string[];
    pause?: (text: string, take: number) => boolean;
} = {}): FakeVoice {
    const calls: FakeCall[] = [];
    const takesOf = new Map<string, number>();
    const heard = options.heard ?? ((text: string): string[] => [text]);
    return {
        calls,
        synthesize: (text, wavFile) => {
            const take = (takesOf.get(text) ?? 0) + 1;
            takesOf.set(text, take);
            const gap = options.pause?.(text, take) ?? false;
            const span = 4000 + 16 * calls.length;
            calls.push({ text, take, extent: span + (gap ? PAUSE_SAMPLES : 0) });
            fs.mkdirSync(path.dirname(wavFile), { recursive: true });
            fs.writeFileSync(wavFile, wavBuffer(takeSamples(span, gap)));
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

/**
 * The stream facts of an audio file, read with ffprobe.
 * @param file The path of the file.
 * @returns The sample rate, the channel count, and the bit rate of the first audio stream.
 */
function probeAudio(file: string): { sampleRate: number; channels: number; bitRate: number } {
    const json = execFileSync('ffprobe', [
        '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate,channels,bit_rate', '-of', 'json', file,
    ], { encoding: 'utf8' });
    const stream = (JSON.parse(json) as { streams: { sample_rate: string; channels: number; bit_rate: string }[] }).streams[0];
    return { sampleRate: Number(stream.sample_rate), channels: stream.channels, bitRate: Number(stream.bit_rate) };
}

// ---------------------------------------------------------------------------------------------
// The temporary trees
// ---------------------------------------------------------------------------------------------

/** The temporary tree of one run of a script. */
interface WordTree {
    folder: string;
    contentRoot: string;
    weekFile: string;
    bankFolder: string;
    manifestFile: string;
}

/**
 * A temporary content root with a copy of the start file of each shipped week of level 2.
 * @param prefix The prefix of the folder name.
 * @returns The paths of the tree. The bank folder does not exist yet.
 */
function baseTree(prefix: string): WordTree {
    const folder = tempFolder(prefix);
    const contentRoot = path.join(folder, 'content');
    fs.mkdirSync(path.join(contentRoot, 'l2'), { recursive: true });
    for (let week = 1; week <= 8; week += 1) {
        fs.writeFileSync(path.join(contentRoot, 'l2', `w${weekDigits(week)}.json`), plainWeek(week));
    }
    const bankFolder = path.join(contentRoot, 'words');
    return {
        folder,
        contentRoot,
        weekFile: path.join(contentRoot, 'l2/w01.json'),
        bankFolder,
        manifestFile: path.join(bankFolder, 'manifest.json'),
    };
}

/**
 * The top-level fields of the fixture manifest, in the order of the shipped bank.
 * @param items The rows.
 * @returns The manifest object.
 */
function manifestObject(items: WordBankRow[]): Record<string, unknown> {
    return {
        bank: 'storytime-words-l2u1-2026-10-27',
        speaker: 'TTS',
        model: 'speech-2.8-hd',
        voice: 'English_captivating_female1',
        speed: 0.9,
        normalisation: 'peak -3 dBFS, edge silence trimmed to 80 ms, 32 kHz mono 16-bit',
        approval: { status: 'approved', by: 'Daniel', date: '2026-10-27', words: 'fixture', source: 'fixture' },
        missing: [],
        items,
    };
}

/**
 * The manifest text in the Python form `json.dumps(manifest, indent=1)` with one final newline (K6).
 * The floats `peak_dbfs` keep the text `-3.0`.
 * @param items The rows.
 * @returns The text.
 */
function pythonManifest(items: WordBankRow[]): string {
    const json = JSON.stringify(manifestObject(items)).replace(/"peak_dbfs":-3(?![.\d])/g, '"peak_dbfs":-3.0');
    return execFileSync('python3', ['-I', '-c', 'import json,sys;print(json.dumps(json.load(sys.stdin),indent=1))'], {
        input: json,
        encoding: 'utf8',
    });
}

/**
 * The Python form test of K6, run on a file.
 * @param file The path of the manifest.
 * @returns True when `json.dumps(json.loads(text), indent=1) + "\n"` equals the text.
 */
function pythonFormHolds(file: string): boolean {
    const code = 'import json,sys;t=open(sys.argv[1]).read();print(json.dumps(json.loads(t),indent=1)+"\\n"==t)';
    return execFileSync('python3', ['-I', '-c', code, file], { encoding: 'utf8' }).trim() === 'True';
}

/**
 * A row of the fixture bank.
 * @param n The number of the row.
 * @param word The word.
 * @param sha The WAV hash.
 * @returns The row.
 */
function bankRow(n: number, word: string, sha: string): WordBankRow {
    return {
        n,
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
        sha256: sha,
    };
}

/**
 * The tree of the mapper: the start file of week 1, and a bank of 30 rows (the two books and the three
 * practice lists, Phase 12 spec L5) with a WAV file and an mp3 file of each. The mp3 bytes are fake and
 * differ by word, because the mapper never makes audio.
 * @returns The tree.
 */
function mapperTree(): WordTree {
    const tree = baseTree('storytime-clips-map-');
    fs.mkdirSync(tree.bankFolder, { recursive: true });
    const keys = W01_UNION;
    const items = keys.map((key, index) => {
        const wav = wavBuffer(takeSamples(1000 + index, false));
        fs.writeFileSync(path.join(tree.bankFolder, `wa-${key}.wav`), wav);
        fs.writeFileSync(path.join(tree.bankFolder, `wa-${key}.mp3`), `fake mp3 of ${key}\n`);
        return bankRow(index + 1, key, sha256(wav));
    });
    fs.writeFileSync(tree.manifestFile, `${JSON.stringify(manifestObject(items), null, 1)}\n`);
    return tree;
}

/**
 * The rows of a manifest file.
 * @param file The path of the manifest.
 * @returns The rows, parsed.
 */
function manifestItems(file: string): Record<string, unknown>[] {
    return (JSON.parse(fs.readFileSync(file, 'utf8')) as { items: Record<string, unknown>[] }).items;
}

/**
 * Removes the row of a word from a manifest file of the mapper tree.
 * @param tree The tree.
 * @param word The word.
 */
function removeBankRow(tree: WordTree, word: string): void {
    const manifest = JSON.parse(fs.readFileSync(tree.manifestFile, 'utf8')) as { items: { word: string }[] };
    manifest.items = manifest.items.filter((row) => row.word !== word);
    fs.writeFileSync(tree.manifestFile, `${JSON.stringify(manifest, null, 1)}\n`);
}

/**
 * The tree of the maker: all start files of level 2, and a fixture bank of 98 rows in the Python form.
 * The rows 1 to 10 are the 10 words of week 1 that have a bank row, and the rows 11 to 98 are fillers.
 * The old rows have no audio file, because the maker never reads them.
 * @returns The tree.
 */
function makerTree(): WordTree {
    const tree = baseTree('storytime-clips-bank-');
    fs.mkdirSync(tree.bankFolder, { recursive: true });
    const items: WordBankRow[] = [];
    for (let n = 1; n <= 98; n += 1) {
        const word = n <= W01_PRESENT.length ? W01_PRESENT[n - 1] : `filler${String(n).padStart(2, '0')}`;
        items.push(bankRow(n, word, sha256(`old row ${n}`)));
    }
    fs.writeFileSync(tree.manifestFile, pythonManifest(items));
    expect(pythonFormHolds(tree.manifestFile), 'the fixture manifest has the Python form').toBe(true);
    return tree;
}

/**
 * A run of the bank maker on a tree.
 * @param tree The tree.
 * @param voice The fake voice.
 * @param extra Options that replace the default options of the run.
 * @returns The value or the error of the run.
 */
async function runMaker(tree: WordTree, voice: FakeVoice, extra: Partial<MakeWordBankOptions> = {}): Promise<{ value?: MakeWordBankResult; error?: Error }> {
    const makeWordBank = await maker('makeWordBank');
    return await attempt(() => makeWordBank({
        level: 2,
        week: 1,
        contentRoot: tree.contentRoot,
        bankFolder: tree.bankFolder,
        date: DATE,
        maxChars: 120,
        synthesize: voice.synthesize,
        recognize: voice.recognize,
        ...extra,
    }));
}

/** The result of a run of the maker that several cases read. */
interface MakerRun {
    tree: WordTree;
    voice: FakeVoice;
    before: string;
    result: MakeWordBankResult;
}

/**
 * The text that the fake sent for a call.
 * @param voice The fake voice.
 * @param text The text.
 * @param take The take of that text.
 * @returns The call.
 */
function callOf(voice: FakeVoice, text: string, take: number): FakeCall {
    const call = voice.calls.find((entry) => entry.text === text && entry.take === take);
    if (!call) throw new Error(`the fake voice has no take ${take} of the text "${text}"`);
    return call;
}

/** The run of the maker where every take is heard as its text. It also has a missing venv path (K9). */
let baseMakerRun: Promise<MakerRun> | undefined;

/**
 * The first run of the maker: week 1, 12 keys, one take each, and a missing venv path, because the
 * maker does no venv check when `recognize` is given.
 * @returns The run.
 */
function baseRun(): Promise<MakerRun> {
    baseMakerRun ??= (async () => {
        const tree = makerTree();
        const voice = fakeVoice();
        const before = fs.readFileSync(tree.manifestFile, 'utf8');
        const run = await runMaker(tree, voice, { whisperPython: MISSING_PYTHON });
        if (run.error) throw new Error(`the base run of the maker failed: ${run.error.message}`);
        return { tree, voice, before, result: run.value as MakeWordBankResult };
    })();
    return baseMakerRun;
}

/** The scenario of C14: a retake, a variant, three failed takes, a bad pause, and the `i` rule. */
const SCENARIO = {
    heard: (text: string, take: number): string[] => {
        if (text === 'Ben' && take === 1) return ['been'];
        if (text === 'can') return ['khan'];
        if (text === 'I') return ['one'];
        return [text];
    },
    pause: (text: string, take: number): boolean => text === 'neck' && take === 1,
};

/** The run of the maker for the scenario. */
let scenarioMakerRun: Promise<MakerRun> | undefined;

/**
 * The run of the maker for the scenario of C14.
 * @returns The run.
 */
function scenarioRun(): Promise<MakerRun> {
    scenarioMakerRun ??= (async () => {
        const tree = makerTree();
        const voice = fakeVoice(SCENARIO);
        const before = fs.readFileSync(tree.manifestFile, 'utf8');
        const run = await runMaker(tree, voice);
        if (run.error) throw new Error(`the scenario run of the maker failed: ${run.error.message}`);
        return { tree, voice, before, result: run.value as MakerRun['result'] };
    })();
    return scenarioMakerRun;
}

/**
 * The new rows of a maker run, by word.
 * @param run The run.
 * @returns The rows added by the run.
 */
function newRows(run: MakerRun): Record<string, Record<string, unknown>> {
    const rows = manifestItems(run.tree.manifestFile).slice(98);
    return Object.fromEntries(rows.map((row) => [String(row.word), row]));
}

/**
 * The structure of an append to a bank manifest (K6): the lines before the last row stay, the closing
 * line of the last old row gains a comma, the new rows follow, and the tail stays.
 * @param before The old text.
 * @param after The new text.
 * @param newRowCount The count of the new rows.
 */
function expectAppendOnly(before: string, after: string, newRowCount: number): void {
    const oldLines = before.split('\n');
    const newLines = after.split('\n');
    expect(oldLines.slice(-4), 'the old text ends with the last row and the tail').toEqual(['  }', ' ]', '}', '']);
    const head = oldLines.slice(0, -4);
    expect(newLines.slice(0, head.length), 'each old line before the last closing line stays').toEqual(head);
    expect(newLines[head.length], 'the closing line of the last old row gains a comma').toBe('  },');
    expect(newLines.slice(-3), 'the tail of the file stays').toEqual([' ]', '}', '']);
    const added = newLines.slice(head.length + 1, -3);
    expect(added[0]).toBe('  {');
    expect(added[added.length - 1]).toBe('  }');
    expect(added.filter((line) => line === '  {'), 'the count of the new rows').toHaveLength(newRowCount);
}

// ---------------------------------------------------------------------------------------------
// Lead-in fixtures (C12)
// ---------------------------------------------------------------------------------------------

/** The folder of the made media of the lead-in cases. */
let leadInMediaFolder: string | undefined;

/**
 * A tone with a fade-in of 10 ms, so that an AAC encoder does not smear its first onset.
 * @param length The length in samples.
 * @returns The samples.
 */
function fadedTone(length: number): number[] {
    return Array.from({ length }, (_, i) => Math.round(
        10000 * Math.min(1, (i + 1) / 320) * Math.sin((2 * Math.PI * 440 * i) / RATE + 1.0),
    ));
}

/**
 * The media of the lead-in cases: an mp3 with 85 ms of quiet and two tones, and two mp4 files with
 * the same audio 1.5 s later, and one mp4 file with the audio 1.6 s later.
 * @returns The folder.
 */
function leadInMedia(): string {
    if (leadInMediaFolder) return leadInMediaFolder;
    const folder = tempFolder('storytime-clips-media-');
    const quiet = (length: number): number[] => new Array<number>(length).fill(0);
    const base = [...quiet(2720), ...fadedTone(12800), ...quiet(9600), ...fadedTone(12800), ...quiet(6400)];
    const writeSource = (name: string, delaySeconds: number): string => {
        const file = path.join(folder, name);
        fs.writeFileSync(file, wavBuffer(Int16Array.from([...quiet(Math.round(delaySeconds * RATE)), ...base])));
        return file;
    };
    const run = (args: string[]): void => {
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
    };
    run(['-i', writeSource('plain.wav', 0), '-codec:a', 'libmp3lame', '-b:a', '128k', path.join(folder, 'song.mp3')]);
    const video = (source: string, out: string): void => {
        run([
            '-f', 'lavfi', '-i', 'color=c=black:s=64x64:r=10:d=3', '-i', source,
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', path.join(folder, out),
        ]);
    };
    video(writeSource('late15.wav', 1.5), 'song.mp4');
    fs.copyFileSync(path.join(folder, 'song.mp4'), path.join(folder, 'song-phone.mp4'));
    video(writeSource('late16.wav', 1.6), 'song-phone-late.mp4');
    leadInMediaFolder = folder;
    return folder;
}

/** A tree for the lead-in script. */
interface LeadInTree {
    contentRoot: string;
    weekFile: string;
}

/**
 * A temporary content root with the start file of a week and the made media.
 * @param week The week.
 * @param media The media files to copy, from the made media to the song folder of the week.
 * @param edit A text edit of the week file.
 * @returns The tree.
 */
function leadInTree(week: number, media: Record<string, string>, edit: (text: string) => string = (text) => text): LeadInTree {
    const folder = tempFolder('storytime-clips-leadin-');
    const contentRoot = path.join(folder, 'content');
    const songFolder = path.join(contentRoot, `l2/media/w${weekDigits(week)}`);
    fs.mkdirSync(songFolder, { recursive: true });
    for (const [from, to] of Object.entries(media)) fs.copyFileSync(path.join(leadInMedia(), from), path.join(songFolder, to));
    const weekFile = path.join(contentRoot, `l2/w${weekDigits(week)}.json`);
    fs.writeFileSync(weekFile, edit(plainWeek(week)));
    return { contentRoot, weekFile };
}

/** The media of the song of week 1: the mp3, the classroom video, and the phone video. */
const W01_MEDIA = { 'song.mp3': 'song.mp3', 'song.mp4': 'song.mp4', 'song-phone.mp4': 'song-phone.mp4' };

// ---------------------------------------------------------------------------------------------
// The snapshot for the guard of C16
// ---------------------------------------------------------------------------------------------

/**
 * The size and the modification time of the content files that the phase changes.
 * @returns The stamps, keyed by the path relative to the content folder.
 */
function contentSnapshot(): Record<string, string> {
    const out: Record<string, string> = {};
    const add = (file: string): void => {
        const stat = fs.statSync(file);
        out[path.relative(STORYTIME_ROOT, file)] = `${stat.size}:${stat.mtimeMs}`;
    };
    const addFolder = (folder: string, accept: (name: string) => boolean): void => {
        if (!fs.existsSync(folder)) return;
        for (const name of fs.readdirSync(folder)) if (accept(name)) add(path.join(folder, name));
    };
    addFolder(path.join(STORYTIME_ROOT, 'words'), () => true);
    addFolder(path.join(STORYTIME_ROOT, 'l2'), (name) => /^w\d\d\.json$/.test(name));
    for (let week = 1; week <= 8; week += 1) {
        addFolder(path.join(STORYTIME_ROOT, `l2/media/w${weekDigits(week)}/words`), () => true);
    }
    return out;
}

/** The stamps of the content files when this file loads. */
const SNAPSHOT_AT_LOAD = contentSnapshot();

// ---------------------------------------------------------------------------------------------
// C1 to C4: the pure module
// ---------------------------------------------------------------------------------------------

describe('C1 bookWordKey (K2)', () => {
    it('gives the key of the hand-written table', async () => {
        const bookWordKey = await clips('bookWordKey');
        const table: [string, string | undefined][] = [
            ['Hello', 'hello'],
            ['I', 'i'],
            ['A', 'a'],
            ['Pip!', 'pip'],
            ['"Yes,"', 'yes'],
            ['don’t', "don't"],
            ['don‘t', "don't"],
            ["don't", "don't"],
            ['...', undefined],
            ['', undefined],
        ];
        for (const [word, key] of table) expect(bookWordKey(word), `the key of ${JSON.stringify(word)}`).toBe(key);
    });

    it('keeps an inner hyphen, and throws for a digit or an accent inside', async () => {
        const bookWordKey = await clips('bookWordKey');
        expect(bookWordKey('teddy-bear'), 'the key keeps the hyphen').toBe('teddy-bear');
        expect(bookWordKey('T-shirt'), 'the key of a written hyphen word').toBe('t-shirt');
        // The addendum row also lists "a1" and "café". Under D-U2-K2 / D-U2-K10 a digit or an
        // accent anywhere refuses the key, so those two forms are invalid. The forms below also fail.
        for (const word of ['a1b', 'cafés']) {
            const error = thrownBy(() => bookWordKey(word));
            expect(error, `${word} throws`).toBeInstanceOf(Error);
            expect(error?.message).toMatch(/^word clip:/);
            expect(error?.message).toContain(word);
            expect(error?.message).toContain('not a word key');
        }
    });

    it('gives one key for a word in each letter case', async () => {
        const bookWordKey = await clips('bookWordKey');
        expect(['Pip', 'pip', 'PIP'].map((word) => bookWordKey(word))).toEqual(['pip', 'pip', 'pip']);
    });
});

describe('C2 wordClipStem, wordClipPath, planWordClips (K3)', () => {
    it('removes each apostrophe from the stem', async () => {
        const wordClipStem = await clips('wordClipStem');
        expect(wordClipStem("don't")).toBe('dont');
        expect(wordClipStem('hello')).toBe('hello');
    });

    it('gives the K3 path of a key, a level, and a week', async () => {
        const wordClipPath = await clips('wordClipPath');
        expect(wordClipPath(2, 1, "don't")).toBe('l2/media/w01/words/wa-dont.mp3');
        expect(wordClipPath(2, 1, 'i')).toBe('l2/media/w01/words/wa-i.mp3');
        expect(wordClipPath(2, 12, 'hello')).toBe('l2/media/w12/words/wa-hello.mp3');
    });

    it('throws for a bad key, for week 0, and for week 100', async () => {
        const wordClipPath = await clips('wordClipPath');
        expect(thrownBy(() => wordClipPath(2, 1, 'Hello')), 'an upper-case key').toBeInstanceOf(Error);
        expect(wordClipPath(2, 1, 'teddy-bear'), 'a key with a hyphen').toBe('l2/media/w01/words/wa-teddy-bear.mp3');
        expect(thrownBy(() => wordClipPath(2, 0, 'hello')), 'week 0').toBeInstanceOf(Error);
        expect(thrownBy(() => wordClipPath(2, 100, 'hello')), 'week 100').toBeInstanceOf(Error);
    });

    it('plans one map for each book and the sorted distinct files', async () => {
        const planWordClips = await clips('planWordClips');
        const plan = planWordClips({
            level: 2,
            week: 1,
            books: [
                {
                    audio: {
                        sentences: [{ words: [{ word: 'Hello' }, { word: 'I' }] }],
                        slowSentences: [{ words: [{ word: 'am' }, { word: 'hello' }] }],
                    },
                },
                { audio: {} },
            ],
        });
        expect(plan.maps).toEqual([{ am: 'l2/media/w01/words/wa-am.mp3', hello: 'l2/media/w01/words/wa-hello.mp3', i: 'l2/media/w01/words/wa-i.mp3' }, {}]);
        expect(Object.keys(plan.maps[0]), 'the keys are sorted by code point').toEqual(['am', 'hello', 'i']);
        expect(plan.files).toEqual(['l2/media/w01/words/wa-am.mp3', 'l2/media/w01/words/wa-hello.mp3', 'l2/media/w01/words/wa-i.mp3']);
    });

    it('plans the two maps of the shipped week 1 and 22 files', async () => {
        const planWordClips = await clips('planWordClips');
        const plan = planWordClips({ level: 2, week: 1, books: bookAudios(plainWeek(1)).map((audio) => ({ audio })) });
        expect(plan.maps).toEqual([w01Map(W01_BOOK0), w01Map(W01_BOOK1)]);
        expect(Object.keys(plan.maps[0])).toEqual(W01_BOOK0);
        expect(Object.keys(plan.maps[1])).toEqual(W01_BOOK1);
        expect(plan.files).toHaveLength(22);
        expect(plan.files).toEqual([...new Set(plan.files)].sort());
        expect(new Set(plan.files)).toEqual(new Set([...W01_BOOK0, ...W01_BOOK1].map((key) => `l2/media/w01/words/wa-${key}.mp3`)));
    });

    it('throws "two keys, one file" for the keys its and it\'s in one week', async () => {
        const planWordClips = await clips('planWordClips');
        const error = thrownBy(() => planWordClips({
            level: 2,
            week: 1,
            books: [{ audio: { sentences: [{ words: [{ word: 'its' }, { word: "it's" }] }] } }],
        }));
        expect(error, 'planWordClips throws').toBeInstanceOf(Error);
        expect(error?.message).toContain('two keys, one file');
        expect(error?.message).toContain('its');
        expect(error?.message).toContain("it's");
    });
});

describe('C3 bookWordKeys (K2, K4)', () => {
    it('gives the 12 keys of book 0 and the 11 keys of book 1 of the shipped w01, sorted', async () => {
        const bookWordKeys = await clips('bookWordKeys');
        const [book0, book1] = bookAudios(plainWeek(1));
        expect(bookWordKeys(book0)).toEqual(W01_BOOK0);
        expect(bookWordKeys(book1)).toEqual(W01_BOOK1);
    });

    it('sorts by code point, gives each key once, and reads both speeds', async () => {
        const bookWordKeys = await clips('bookWordKeys');
        expect(bookWordKeys({
            sentences: [{ words: [{ word: 'its' }, { word: 'It' }, { word: 'Pip' }] }],
            slowSentences: [{ words: [{ word: "it's" }, { word: 'pip' }] }],
        })).toEqual(['it', "it's", 'its', 'pip']);
        expect(bookWordKeys({})).toEqual([]);
        expect(bookWordKeys({ sentences: [{}] })).toEqual([]);
    });
});

describe('C4 the counts of the addendum table', () => {
    it('gives the key slots of each book and the files of each week for w01 to w07, and nothing for w08', async () => {
        const bookWordKeys = await clips('bookWordKeys');
        const planWordClips = await clips('planWordClips');
        let keys = 0;
        let files = 0;
        for (let week = 1; week <= 7; week += 1) {
            const audios = bookAudios(plainWeek(week));
            expect(audios, `week ${week} has 2 books`).toHaveLength(2);
            const perBook = audios.map((audio) => bookWordKeys(audio).length);
            expect(perBook, `the keys of the books of week ${week}`).toEqual(KEYS_PER_BOOK[week]);
            const plan = planWordClips({ level: 2, week, books: audios.map((audio) => ({ audio })) });
            expect(plan.files, `the files of week ${week}`).toHaveLength(FILES_PER_WEEK[week]);
            keys += perBook.reduce((sum, count) => sum + count, 0);
            files += plan.files.length;
        }
        expect(keys).toBe(173);
        expect(files).toBe(163);
        const w08 = bookAudios(plainWeek(8));
        expect(w08, 'week 8 has no book').toEqual([]);
        expect(planWordClips({ level: 2, week: 8, books: [] })).toEqual({ maps: [], files: [] });
    });
});

// ---------------------------------------------------------------------------------------------
// C5: the schema
// ---------------------------------------------------------------------------------------------

describe('C5 the two optional schema fields (K15)', () => {
    const map = { hello: 'l2/media/w01/words/wa-hello.mp3', "don't": 'l2/media/w01/words/wa-dont.mp3' };

    it('keeps a wordClips map in the parse output of the book audio', () => {
        const parsed = BookAudioSchema.parse({ sentences: [], wordClips: map });
        expect((parsed as { wordClips?: unknown }).wordClips, 'BookAudioSchema keeps wordClips').toEqual(map);
        expect((BookAudioSchema.parse({ sentences: [] }) as { wordClips?: unknown }).wordClips, 'the field is optional').toBeUndefined();
    });

    it('rejects an upper-case key and an empty value, and accepts a hyphen key', () => {
        expect(BookAudioSchema.safeParse({ sentences: [], wordClips: { Hello: 'l2/media/w01/words/wa-hello.mp3' } }).success, 'an upper-case key').toBe(false);
        expect(BookAudioSchema.safeParse({ sentences: [], wordClips: { 'teddy-bear': 'l2/media/w01/words/wa-teddy-bear.mp3' } }).success, 'a key with a hyphen').toBe(true);
        expect(BookAudioSchema.safeParse({ sentences: [], wordClips: { hello: '' } }).success, 'an empty value').toBe(false);
    });

    it('keeps the map in the parse output of a whole week', () => {
        const raw = JSON.parse(plainWeek(1)) as { books: { audio: { wordClips?: Record<string, string> } }[] };
        raw.books[0].audio.wordClips = w01Map(W01_BOOK0);
        raw.books[1].audio.wordClips = w01Map(W01_BOOK1);
        const parsed = StorytimeWeekSchema.parse(raw);
        const audios = parsed.books.map((book) => book.audio as { wordClips?: Record<string, string> });
        expect(audios.map((audio) => audio.wordClips)).toEqual([w01Map(W01_BOOK0), w01Map(W01_BOOK1)]);
        const plain = StorytimeWeekSchema.parse(JSON.parse(plainWeek(1)));
        expect((plain.books[0].audio as { wordClips?: unknown }).wordClips, 'a week without the field parses as before').toBeUndefined();
    });

    it('parses videoLeadInSeconds 3 and 0, and keeps the value; it rejects -0.001 and a non-finite value', () => {
        const song = (JSON.parse(plainWeek(1)) as { song: Record<string, unknown> }).song;
        const parsed = SongSchema.parse({ ...song, videoLeadInSeconds: 3 });
        expect((parsed as { videoLeadInSeconds?: unknown }).videoLeadInSeconds, 'SongSchema keeps videoLeadInSeconds').toBe(3);
        expect(SongSchema.safeParse({ ...song, videoLeadInSeconds: 0 }).success, 'the value 0').toBe(true);
        expect(SongSchema.safeParse({ ...song, videoLeadInSeconds: -0.001 }).success, 'the value -0.001').toBe(false);
        expect(SongSchema.safeParse({ ...song, videoLeadInSeconds: Number.POSITIVE_INFINITY }).success, 'an infinite value').toBe(false);
        expect(SongSchema.safeParse(song).success, 'a song without the field').toBe(true);
        expect((SongSchema.parse(song) as { videoLeadInSeconds?: unknown }).videoLeadInSeconds).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------------------------
// C6 to C8: the mapper
// ---------------------------------------------------------------------------------------------

/**
 * The expected lines of one `wordClips` block of week 1, as the mapper writes them (K4).
 * @param keys The sorted keys of the book.
 * @returns The lines from `"wordClips": {` to the closing brace.
 */
function blockLines(keys: string[]): string[] {
    const map = w01Map(keys);
    return [
        '        "wordClips": {',
        ...keys.map((key, index) => `          ${JSON.stringify(key)}: ${JSON.stringify(map[key])}${index < keys.length - 1 ? ',' : ''}`),
        '        }',
    ];
}

/**
 * The expected lines of one map block of week 1 at any indent, as the mapper writes them (Phase 12, L17).
 * @param indent The indent of the key of the block.
 * @param name The key of the block.
 * @param keys The sorted keys of the map.
 * @returns The lines from the opening line to the closing brace.
 */
function mapBlockLines(indent: string, name: string, keys: string[]): string[] {
    const map = w01Map(keys);
    return [
        `${indent}"${name}": {`,
        ...keys.map((key, index) => `${indent}  ${JSON.stringify(key)}: ${JSON.stringify(map[key])}${index < keys.length - 1 ? ',' : ''}`),
        `${indent}}`,
    ];
}

describe('C6 the mapper on a copy of w01 (K3, K4, K5, Phase 12 L3 to L5)', () => {
    it('writes the five maps, copies 30 clips, removes a stale clip, and changes only the closing lines (52 added, 5 changed)', async () => {
        const setWordClips = await mapper('setWordClips');
        const tree = mapperTree();
        const wordsFolder = path.join(tree.contentRoot, 'l2/media/w01/words');
        fs.mkdirSync(wordsFolder, { recursive: true });
        fs.writeFileSync(path.join(wordsFolder, 'wa-zebra.mp3'), 'stale clip\n');
        fs.writeFileSync(path.join(wordsFolder, 'notes.txt'), 'not a clip\n');
        const before = fs.readFileSync(tree.weekFile, 'utf8');

        const run = await attempt(() => setWordClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder }));
        expect(run.error?.message, 'the mapper runs').toBeUndefined();
        const result = run.value as SetWordClipsResult;
        expect(result.files, 'the distinct clip files: the union of the books and the three practice lists').toBe(30);
        expect(result.removed).toHaveLength(1);
        expect(result.removed[0].endsWith('wa-zebra.mp3')).toBe(true);
        expect(result.lines.some((line) => line.startsWith('removed ') && line.includes('wa-zebra.mp3')), 'a line "removed <path>"').toBe(true);

        const expectedFiles = W01_UNION.map((key) => `wa-${key}.mp3`).sort();
        expect(fs.readdirSync(wordsFolder).filter((name) => /^wa-.*\.mp3$/.test(name)).sort(), 'the 30 clips of the week, and no stale clip').toEqual(expectedFiles);
        expect(fs.existsSync(path.join(wordsFolder, 'notes.txt')), 'a file that is not a clip stays').toBe(true);
        for (const name of expectedFiles) {
            expect(fileHash(path.join(wordsFolder, name)), `${name} equals its bank mp3`).toBe(fileHash(path.join(tree.bankFolder, name)));
        }

        const after = fs.readFileSync(tree.weekFile, 'utf8');
        const week = JSON.parse(after) as { books: { audio: { wordClips?: Record<string, string> } }[] };
        expect(week.books.map((book) => book.audio.wordClips)).toEqual([w01Map(W01_BOOK0), w01Map(W01_BOOK1)]);
        expect(Object.keys(week.books[0].audio.wordClips ?? {})).toEqual(W01_BOOK0);
        expect(() => StorytimeWeekSchema.parse(week), 'the new week parses').not.toThrow();

        const diff = insertionDiff(before.split('\n'), after.split('\n'));
        expect(diff.changed, 'the closing line before each block gains a comma: family words, wordWall, opening audio, and the two slowSentences').toEqual([
            ['      ]', '      ],'],
            ['    "wordWall": []', '    "wordWall": [],'],
            ['    ]', '    ],'],
            ['        ]', '        ],'],
            ['        ]', '        ],'],
        ]);
        expect(diff.added).toHaveLength(52);
        expect(diff.added, 'the blocks in document order: family, tricky, opening, book 0, book 1').toEqual([
            ...mapBlockLines('      ', 'wordClips', W01_FAMILY),
            ...mapBlockLines('    ', 'trickyWordClips', W01_TRICKY),
            ...mapBlockLines('    ', 'wordClips', W01_OPENING),
            ...blockLines(W01_BOOK0),
            ...blockLines(W01_BOOK1),
        ]);
    }, 60_000);

    it('changes no byte and no modification time on a second run', async () => {
        const setWordClips = await mapper('setWordClips');
        const tree = mapperTree();
        const options = { weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder };
        const first = await attempt(() => setWordClips(options));
        expect(first.error?.message, 'the first run').toBeUndefined();
        ageTree(tree.contentRoot);
        const hashes = treeHashes(tree.contentRoot);
        const stamps = treeStamps(tree.contentRoot);
        const second = await attempt(() => setWordClips(options));
        expect(second.error?.message, 'the second run').toBeUndefined();
        expect(second.value?.removed).toEqual([]);
        expect(second.value?.files).toBe(30);
        expect(treeHashes(tree.contentRoot), 'no byte changes').toEqual(hashes);
        expect(treeStamps(tree.contentRoot), 'no modification time changes').toEqual(stamps);
    }, 60_000);

    it('replaces only the wordClips block when the books change, and removes the clip that no key names', async () => {
        const setWordClips = await mapper('setWordClips');
        const tree = mapperTree();
        const options = { weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder };
        expect((await attempt(() => setWordClips(options))).error?.message, 'the first run').toBeUndefined();
        const changed = fs.readFileSync(tree.weekFile, 'utf8').replace(/"word": "Pat"/g, '"word": "Sam"');
        expect(changed, 'the edit changes the week').not.toBe(fs.readFileSync(tree.weekFile, 'utf8'));
        fs.writeFileSync(tree.weekFile, changed);
        const second = await attempt(() => setWordClips(options));
        expect(second.error?.message, 'the second run').toBeUndefined();
        const after = fs.readFileSync(tree.weekFile, 'utf8');
        expect(withoutWordClips(after), 'every line outside the wordClips blocks stays').toBe(withoutWordClips(changed));
        const week = JSON.parse(after) as { books: { audio: { wordClips: Record<string, string> } }[] };
        expect(Object.keys(week.books[0].audio.wordClips)).toEqual(W01_BOOK0.filter((key) => key !== 'pat'));
        expect(week.books[1].audio.wordClips).toEqual(w01Map(W01_BOOK1));
        expect(second.value?.removed.map((file) => path.basename(file))).toEqual(['wa-pat.mp3']);
        expect(second.value?.files).toBe(29);
    }, 60_000);
});

describe('C7 the mapper stops before any write (K5)', () => {
    const faults: { name: string; token: string; fault: (tree: WordTree) => void }[] = [
        {
            name: 'a key with no bank row',
            token: 'no bank row',
            fault: (tree) => removeBankRow(tree, 'nod'),
        },
        {
            name: 'a bank row with no mp3 file',
            token: 'no bank file',
            fault: (tree) => fs.rmSync(path.join(tree.bankFolder, 'wa-nod.mp3')),
        },
        {
            name: 'a WAV file whose SHA-256 differs from its row',
            token: 'bank SHA-256 differs',
            fault: (tree) => fs.appendFileSync(path.join(tree.bankFolder, 'wa-nod.wav'), 'x'),
        },
    ];

    for (const { name, token, fault } of faults) {
        it(`stops for ${name} with "${token}" and changes no file`, async () => {
            const setWordClips = await mapper('setWordClips');
            const tree = mapperTree();
            fault(tree);
            const hashes = treeHashes(tree.folder);
            const run = await attempt(() => setWordClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder }));
            expect(run.error, 'the mapper throws').toBeInstanceOf(Error);
            expect(run.error?.message).toContain(token);
            expect(run.error?.message).toContain('nod');
            expect(treeHashes(tree.folder), 'no file changes, and no file appears').toEqual(hashes);
        }, 60_000);
    }
});

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

describe('C7b the mapper checks the week structure before any write (K4, K5, FR 4, review A F1)', () => {
    /** The week file of the tree, edited as an object and written back in the 2-space form. */
    function editWeek(tree: WordTree, edit: (week: { books: { audio?: unknown }[]; song?: unknown }) => void): string {
        const week = JSON.parse(fs.readFileSync(tree.weekFile, 'utf8')) as { books: { audio?: unknown }[]; song?: unknown };
        edit(week);
        const text = JSON.stringify(week, null, 2);
        fs.writeFileSync(tree.weekFile, text);
        return text;
    }

    const faults: { name: string; fault: (tree: WordTree) => string }[] = [
        {
            name: 'a week with 2 books and 1 audio object',
            fault: (tree) => editWeek(tree, (week) => {
                delete week.books[1].audio;
            }),
        },
        {
            name: 'a week whose second book has an empty audio object',
            fault: (tree) => {
                const text = editWeek(tree, (week) => {
                    week.books[1].audio = {};
                });
                const opened = text.replace(/^( {6})"audio": \{\}(,?)$/m, '$1"audio": {\n$1}$2');
                expect(opened, 'the fixture holds an audio object on two lines').not.toBe(text);
                fs.writeFileSync(tree.weekFile, opened);
                return opened;
            },
        },
        {
            name: 'a week that the schema refuses',
            fault: (tree) => {
                const text = editWeek(tree, (week) => {
                    week.song = 'not an object';
                });
                expect(StorytimeWeekSchema.safeParse(JSON.parse(text)).success, 'the fixture week fails the schema').toBe(false);
                return text;
            },
        },
    ];

    for (const { name, fault } of faults) {
        it(`stops for ${name} and leaves the media folder and the week file as they were`, async () => {
            const setWordClips = await mapper('setWordClips');
            const tree = mapperTree();
            const wordsFolder = path.join(tree.contentRoot, 'l2/media/w01/words');
            fs.mkdirSync(wordsFolder, { recursive: true });
            fs.writeFileSync(path.join(wordsFolder, 'wa-zebra.mp3'), 'stale clip\n');
            const weekText = fault(tree);
            const listing = entryListing(tree.folder);
            const hashes = treeHashes(tree.folder);

            const run = await attempt(() => setWordClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder }));
            expect(run.error, 'the mapper throws').toBeInstanceOf(Error);
            expect(entryListing(tree.folder), 'no clip is copied, and no folder appears').toEqual(listing);
            expect(fs.existsSync(path.join(wordsFolder, 'wa-zebra.mp3')), 'the stale clip stays').toBe(true);
            expect(fs.readFileSync(tree.weekFile, 'utf8'), 'the week file is byte equal').toBe(weekText);
            expect(treeHashes(tree.folder), 'no file changes, and no file appears').toEqual(hashes);
        }, 60_000);
    }
});

describe('C8 the mapper --check (FR 4, Phase 12 L3 to L5)', () => {
    it('prints 42 tab lines for the copy of w01 (23 book keys and 19 practice keys) and writes nothing', async () => {
        const setWordClips = await mapper('setWordClips');
        const tree = mapperTree();
        const hashes = treeHashes(tree.folder);
        const run = await attempt(() => setWordClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder, check: true }));
        expect(run.error?.message, 'the check runs').toBeUndefined();
        const lines = (run.value as SetWordClipsResult).lines;
        expect(lines).toHaveLength(42);
        const fields = lines.map((line) => line.split('\t'));
        for (const row of fields) expect(row, row.join(' | ')).toHaveLength(4);
        const bookRows = fields.filter((row) => row[0] === '0' || row[0] === '1');
        expect(bookRows.map((row) => row[0]), 'the lines of the two books keep the book index').toEqual([...W01_BOOK0.map(() => '0'), ...W01_BOOK1.map(() => '1')]);
        expect(bookRows.map((row) => row[1])).toEqual([...W01_BOOK0, ...W01_BOOK1]);
        expect(bookRows.map((row) => row[2])).toEqual([...W01_BOOK0, ...W01_BOOK1].map((key) => `wa-${key}`));
        expect(fields.map((row) => row[1]).sort(), 'one line for each key of each map').toEqual([...W01_BOOK0, ...W01_BOOK1, ...W01_OPENING, ...W01_FAMILY, ...W01_TRICKY].sort());
        expect(fields.every((row) => row[3] === 'ok')).toBe(true);
        expect(treeHashes(tree.folder), 'the check writes nothing').toEqual(hashes);
    }, 60_000);

    it('prints 15 "no bank row" lines when 12 bank rows are absent (a, and, and can also sit in the tricky map), and writes nothing', async () => {
        const setWordClips = await mapper('setWordClips');
        const tree = mapperTree();
        for (const key of W01_MISSING) removeBankRow(tree, key);
        const hashes = treeHashes(tree.folder);
        const run = await attempt(() => setWordClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder, check: true }));
        expect(run.error?.message, 'the check runs').toBeUndefined();
        const fields = (run.value as SetWordClipsResult).lines.map((line) => line.split('\t'));
        expect(fields).toHaveLength(42);
        expect(fields.filter((row) => row[3].includes('no bank row')), 'the 12 book lines and the 3 tricky lines of the absent rows').toHaveLength(15);
        expect(fields.filter((row) => row[3] === 'ok'), 'the other lines').toHaveLength(27);
        expect(treeHashes(tree.folder), 'the check writes nothing').toEqual(hashes);
    }, 60_000);

    it('exits with 1 when a line is not ok and with 0 when every line is ok (the shipped w01, read only)', async () => {
        const main = await mapper('main');
        const week = path.join(STORYTIME_ROOT, 'l2/w01.json');
        const bank = path.join(STORYTIME_ROOT, 'words');
        const stamps = { week: treeStamps(path.dirname(week)), bank: treeStamps(bank) };
        const run = await captureOutput(() => main(['--level', '2', '--week', '1', '--check']));
        const rows = run.out.map((line) => line.split('\t')).filter((row) => row.length === 4);
        expect(rows, 'one line for each key slot: 23 book keys and 19 practice keys').toHaveLength(42);
        expect(run.value).toBe(rows.every((row) => row[3] === 'ok') ? 0 : 1);
        expect({ week: treeStamps(path.dirname(week)), bank: treeStamps(bank) }, 'the check writes nothing').toEqual(stamps);
    }, 60_000);

    it('prints the usage and exits 0 for --help, and exits 2 for a missing option', async () => {
        const main = await mapper('main');
        const help = await captureOutput(() => main(['--help']));
        expect(help.value).toBe(0);
        expect(help.out.join('\n')).toContain('--week');
        expect((await captureOutput(() => main([]))).value, 'no option').toBe(2);
        expect((await captureOutput(() => main(['--level', '2']))).value, 'no week').toBe(2);
    });
});

// ---------------------------------------------------------------------------------------------
// C9, C10: the checks
// ---------------------------------------------------------------------------------------------

/** The tree of the check cases: week 1 with the two maps and the 22 clips, written by the test. */
interface MappedTree extends WordTree {
    raw: { meta?: unknown; books: { audio: { wordClips?: Record<string, string> } }[] };
}

/**
 * A mapped copy of w01, built by the test and not by the mapper: the maps are in the week object, the
 * 22 clips are byte copies of the bank mp3 files, and the bank rows hold the WAV hash.
 * @returns The tree.
 */
function mappedTree(): MappedTree {
    const tree = mapperTree();
    const wordsFolder = path.join(tree.contentRoot, 'l2/media/w01/words');
    fs.mkdirSync(wordsFolder, { recursive: true });
    for (const key of new Set([...W01_BOOK0, ...W01_BOOK1])) {
        fs.copyFileSync(path.join(tree.bankFolder, `wa-${key}.mp3`), path.join(wordsFolder, `wa-${key}.mp3`));
    }
    const raw = JSON.parse(fs.readFileSync(tree.weekFile, 'utf8')) as MappedTree['raw'];
    raw.books[0].audio.wordClips = w01Map(W01_BOOK0);
    raw.books[1].audio.wordClips = w01Map(W01_BOOK1);
    fs.writeFileSync(tree.weekFile, JSON.stringify(raw, null, 2));
    return { ...tree, raw };
}

/**
 * The check row for a mapped tree after a fault.
 * @param tree The tree.
 * @returns The row, which the check parses from the raw week as the CLI does.
 */
async function checkRowOf(tree: MappedTree): Promise<CheckRow | undefined> {
    const checkWordClips = await checks('checkWordClips');
    return checkWordClips(StorytimeWeekSchema.parse(tree.raw), tree.contentRoot);
}

/**
 * The keys of the detail "no clip: ...".
 * @param detail The detail of a row.
 * @returns The keys, in the order of the detail.
 */
function noClipKeys(detail: string | undefined): string[] {
    expect(detail, 'the detail starts with "no clip: "').toMatch(/^no clip: /);
    return (detail ?? '').slice('no clip: '.length).split(/[,\s]+/).filter(Boolean);
}

describe('C9 checkWordClips (K12)', () => {
    it('gives the exact id and label, and pass with no detail on the mapped copy', async () => {
        const tree = mappedTree();
        const row = await checkRowOf(tree);
        expect(row).toEqual({ id: 'word-clips', label: WORD_CLIPS_LABEL, status: 'pass' });
        expect(row?.detail).toBeUndefined();
    });

    it('passes a clip that equals its bank mp3 although the row sha256 is the WAV hash (review F2)', async () => {
        const tree = mappedTree();
        const rows = manifestItems(tree.manifestFile);
        const row = rows.find((entry) => entry.word === 'pat') as { sha256: string; mp3: string };
        expect(row.sha256, 'the row holds the WAV hash, not the mp3 hash').not.toBe(fileHash(path.join(tree.bankFolder, row.mp3)));
        expect((await checkRowOf(tree))?.status).toBe('pass');
    });

    it('warns "no clip: <keys>" with each key once, in document order, when the books have no map', async () => {
        const tree = mappedTree();
        delete tree.raw.books[0].audio.wordClips;
        delete tree.raw.books[1].audio.wordClips;
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('warn');
        expect(row?.id).toBe('word-clips');
        expect(row?.label).toBe(WORD_CLIPS_LABEL);
        expect(noClipKeys(row?.detail)).toEqual(W01_DOCUMENT_ORDER);
    });

    it('warns for the keys that a map lacks, in document order', async () => {
        const tree = mappedTree();
        delete tree.raw.books[0].audio.wordClips?.teacher;
        delete tree.raw.books[0].audio.wordClips?.ben;
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('warn');
        expect(noClipKeys(row?.detail)).toEqual(['ben', 'teacher']);
    });

    it('warns for a word that has no key in the map of its own book, although the other book maps it', async () => {
        const tree = mappedTree();
        delete tree.raw.books[1].audio.wordClips?.nan;
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('warn');
        expect(noClipKeys(row?.detail)).toEqual(['nan']);
    });

    it('warns for every key of a book that has no map', async () => {
        const tree = mappedTree();
        delete tree.raw.books[1].audio.wordClips;
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('warn');
        expect([...noClipKeys(row?.detail)].sort()).toEqual(W01_BOOK1);
    });

    it('fails with "missing: <path>" when a clip file is absent', async () => {
        const tree = mappedTree();
        fs.rmSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-nod.mp3'));
        const row = await checkRowOf(tree);
        expect(row).toEqual({ id: 'word-clips', label: WORD_CLIPS_LABEL, status: 'fail', detail: 'missing: l2/media/w01/words/wa-nod.mp3' });
    });

    it('fails with "differs from bank: <path>" when a clip differs from the bank mp3', async () => {
        const tree = mappedTree();
        fs.appendFileSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-pat.mp3'), 'x');
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('differs from bank: l2/media/w01/words/wa-pat.mp3');
    });

    it('fails with "no bank row: <key>" when a key has no bank row', async () => {
        const tree = mappedTree();
        removeBankRow(tree, 'sam');
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('no bank row: sam');
    });

    /**
     * Adds a key to book 0 that no word of the book gives, with a clip and a bank row that are right.
     * @param tree The tree.
     */
    function addNonWord(tree: MappedTree): void {
        const wav = wavBuffer(takeSamples(1500, false));
        fs.writeFileSync(path.join(tree.bankFolder, 'wa-zebra.wav'), wav);
        fs.writeFileSync(path.join(tree.bankFolder, 'wa-zebra.mp3'), 'fake mp3 of zebra\n');
        const manifest = JSON.parse(fs.readFileSync(tree.manifestFile, 'utf8')) as { items: WordBankRow[] };
        manifest.items.push(bankRow(23, 'zebra', sha256(wav)));
        fs.writeFileSync(tree.manifestFile, `${JSON.stringify(manifest, null, 1)}\n`);
        fs.copyFileSync(path.join(tree.bankFolder, 'wa-zebra.mp3'), path.join(tree.contentRoot, 'l2/media/w01/words/wa-zebra.mp3'));
        (tree.raw.books[0].audio.wordClips as Record<string, string>).zebra = 'l2/media/w01/words/wa-zebra.mp3';
    }

    /**
     * Gives the key `am` a value that is not its K3 path, with a clip that is right otherwise.
     * @param tree The tree.
     */
    function addBadPath(tree: MappedTree): void {
        fs.copyFileSync(path.join(tree.bankFolder, 'wa-am.mp3'), path.join(tree.contentRoot, 'l2/media/w01/words/wa-am-copy.mp3'));
        (tree.raw.books[0].audio.wordClips as Record<string, string>).am = 'l2/media/w01/words/wa-am-copy.mp3';
    }

    it('fails with "not a book word: <key>" for a key that no word of its book gives', async () => {
        const tree = mappedTree();
        addNonWord(tree);
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('not a book word: zebra');
    });

    it('fails with "bad path: <path>" for a value that is not the K3 path of its key', async () => {
        const tree = mappedTree();
        addBadPath(tree);
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('bad path: l2/media/w01/words/wa-am-copy.mp3');
    });

    it('joins the five fail parts in the order of K12 with "; "', async () => {
        const tree = mappedTree();
        fs.rmSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-nod.mp3'));
        fs.appendFileSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-pat.mp3'), 'x');
        removeBankRow(tree, 'sam');
        addNonWord(tree);
        addBadPath(tree);
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe([
            'missing: l2/media/w01/words/wa-nod.mp3',
            'differs from bank: l2/media/w01/words/wa-pat.mp3',
            'no bank row: sam',
            'not a book word: zebra',
            'bad path: l2/media/w01/words/wa-am-copy.mp3',
        ].join('; '));
    });

    it('lets a fail win over a warn, and the detail of the fail holds no warn part', async () => {
        const tree = mappedTree();
        delete tree.raw.books[0].audio.wordClips?.ben;
        fs.rmSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-nod.mp3'));
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('missing: l2/media/w01/words/wa-nod.mp3');
    });

    it('gives no row for a week with no book and for a week with no meta (review F1)', async () => {
        const checkWordClips = await checks('checkWordClips');
        const tree = mappedTree();
        const parsed = StorytimeWeekSchema.parse(tree.raw);
        expect(checkWordClips({ ...parsed, books: [] }, tree.contentRoot), 'no book').toBeUndefined();
        expect(checkWordClips({ ...parsed, meta: undefined }, tree.contentRoot), 'no meta').toBeUndefined();
        expect(checkWordClips(StorytimeWeekSchema.parse(JSON.parse(plainWeek(8))), tree.contentRoot), 'the shipped w08').toBeUndefined();
    });

    it('gives pass or warn and never fail for the shipped w01 to w07, and no row for w08', async () => {
        const checkWordClips = await checks('checkWordClips');
        for (let week = 1; week <= 7; week += 1) {
            const row = checkWordClips(StorytimeWeekSchema.parse(JSON.parse(shippedText(week))));
            expect(row, `week ${week} has a row`).toBeDefined();
            expect(['pass', 'warn'], `week ${week}: ${row?.status} ${row?.detail ?? ''}`).toContain(row?.status);
            if (row?.status === 'warn') expect(row.detail).toMatch(/^no clip: /);
        }
        expect(checkWordClips(StorytimeWeekSchema.parse(JSON.parse(shippedText(8))))).toBeUndefined();
    });
});

describe('C9b checkWordClips with a bank mp3 that the bank folder does not hold (K12, review A F3)', () => {
    it('fails and names the key when the week clip exists and the row names an absent bank mp3', async () => {
        const tree = mappedTree();
        fs.rmSync(path.join(tree.bankFolder, 'wa-nod.mp3'));
        expect(fs.existsSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-nod.mp3')), 'the week clip exists').toBe(true);
        const row = await checkRowOf(tree);
        expect(row?.id).toBe('word-clips');
        expect(row?.status, 'a clip with no bank mp3 to compare is not a pass').toBe('fail');
        expect(row?.detail).toMatch(/\bnod\b/);
        expect(row?.detail).not.toMatch(/\b(pat|sam|nan)\b/);
    });

    it('names each key whose bank mp3 is absent', async () => {
        const tree = mappedTree();
        fs.rmSync(path.join(tree.bankFolder, 'wa-nod.mp3'));
        fs.rmSync(path.join(tree.bankFolder, 'wa-pat.mp3'));
        const row = await checkRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toMatch(/\bnod\b/);
        expect(row?.detail).toMatch(/\bpat\b/);
        expect(row?.detail).not.toMatch(/\b(sam|nan)\b/);
    });
});

describe('C10 checkSongLeadIn (K14)', () => {
    it('gives pass when the song names a video and has the field, with the exact id and label', async () => {
        const checkSongLeadIn = await checks('checkSongLeadIn');
        expect(checkSongLeadIn({ song: { video: 'l2/media/w01/song.mp4', videoLeadInSeconds: 3 } }))
            .toEqual({ id: 'song-lead-in', label: SONG_LEAD_IN_LABEL, status: 'pass' });
        expect(checkSongLeadIn({ song: { videoPhone: 'l2/media/w01/song-phone.mp4', videoLeadInSeconds: 0 } })?.status, 'a phone video and the value 0').toBe('pass');
        expect(checkSongLeadIn({ song: { karaoke: 'l2/media/w01/song-karaoke.mp4', videoLeadInSeconds: 1.5 } })?.status, 'a karaoke video').toBe('pass');
    });

    it('gives warn "no lead-in" when the song names a video and has no field', async () => {
        const checkSongLeadIn = await checks('checkSongLeadIn');
        expect(checkSongLeadIn({ song: { video: 'l2/media/w01/song.mp4' } }))
            .toEqual({ id: 'song-lead-in', label: SONG_LEAD_IN_LABEL, status: 'warn', detail: 'no lead-in' });
    });

    it('gives fail "lead-in without video" when the song has the field and names no video', async () => {
        const checkSongLeadIn = await checks('checkSongLeadIn');
        expect(checkSongLeadIn({ song: { audio: 'l2/media/w02/song.mp3', videoLeadInSeconds: 3 } }))
            .toEqual({ id: 'song-lead-in', label: SONG_LEAD_IN_LABEL, status: 'fail', detail: 'lead-in without video' });
    });

    it('gives no row for a song with audio only, and for a week with no song', async () => {
        const checkSongLeadIn = await checks('checkSongLeadIn');
        expect(checkSongLeadIn({ song: { audio: 'l2/media/w02/song.mp3' } })).toBeUndefined();
        expect(checkSongLeadIn({})).toBeUndefined();
        for (let week = 2; week <= 8; week += 1) {
            expect(checkSongLeadIn(JSON.parse(shippedText(week))), `week ${week}`).toBeUndefined();
        }
        const w01 = checkSongLeadIn(StorytimeWeekSchema.parse(JSON.parse(shippedText(1))));
        expect(['pass', 'warn'], `week 1: ${w01?.status}`).toContain(w01?.status);
    });
});

// ---------------------------------------------------------------------------------------------
// C11, C12: the lead-in
// ---------------------------------------------------------------------------------------------

/**
 * A silencedetect log in the form that ffmpeg prints, with the progress lines around it.
 * @param events The silence starts and ends, as text lines without the prefix.
 * @returns The log.
 */
function ffmpegLog(events: string[]): string {
    return [
        'Input #0, mp3, from \'song.mp3\':',
        '  Duration: 00:01:18.37, start: 0.025057, bitrate: 128 kb/s',
        ...events.map((event) => `[silencedetect @ 0x55d0c0a3b2c0] ${event}`),
        'size=N/A time=00:01:18.36 bitrate=N/A speed= 560x',
        '[out#0/null @ 0x55d0c0a3c140] video:0KiB audio:30594KiB subtitle:0KiB other streams:0KiB',
    ].join('\n');
}

/** The mp3 log of the w01 lead-in measure: the onsets 0.0854649 and 0.654717, length 78.367. */
const MP3_LOG = ffmpegLog([
    'silence_start: -0.00104167',
    'silence_end: 0.0854649 | silence_duration: 0.0865065',
    'silence_start: 0.60625',
    'silence_end: 0.654717 | silence_duration: 0.048467',
    'silence_start: 77.72',
    'silence_end: 78.367 | silence_duration: 0.647',
]);

/** The classroom video log of the w01 lead-in measure: the onsets 3.085458 and 3.655167, length 85.376. */
const MP4_LOG = ffmpegLog([
    'silence_start: 0',
    'silence_end: 3.085458 | silence_duration: 3.085458',
    'silence_start: 3.60625',
    'silence_end: 3.655167 | silence_duration: 0.048917',
    'silence_start: 84.73',
    'silence_end: 85.376 | silence_duration: 0.646',
]);

/** The phone video log of the w01 lead-in measure: the onsets 3.085458 and 3.654812. */
const PHONE_LOG = ffmpegLog([
    'silence_start: 0',
    'silence_end: 3.085458 | silence_duration: 3.085458',
    'silence_start: 3.60625',
    'silence_end: 3.654812 | silence_duration: 0.048562',
    'silence_start: 84.73',
    'silence_end: 85.376 | silence_duration: 0.646',
]);

describe('C11 the onset math on fixed ffmpeg logs (K13)', () => {
    it('reads the onsets of the w01 logs and drops the silence that ends at the end of the file', async () => {
        const parseSilenceOnsets = await clips('parseSilenceOnsets');
        expect(parseSilenceOnsets(MP3_LOG, 78.367)).toEqual([0.0854649, 0.654717]);
        expect(parseSilenceOnsets(MP4_LOG, 85.376)).toEqual([3.085458, 3.655167]);
        expect(parseSilenceOnsets(PHONE_LOG, 85.376)).toEqual([3.085458, 3.654812]);
    });

    it('gives the first onset 0 for a file that starts with sound', async () => {
        const parseSilenceOnsets = await clips('parseSilenceOnsets');
        const log = ffmpegLog(['silence_start: 5.2', 'silence_end: 5.9 | silence_duration: 0.7', 'silence_start: 70', 'silence_end: 78.367 | silence_duration: 8.367']);
        expect(parseSilenceOnsets(log, 78.367)).toEqual([0, 5.9]);
    });

    it('treats a first silence that starts at 0.001 s or less as a leading silence, and a later one as not', async () => {
        const parseSilenceOnsets = await clips('parseSilenceOnsets');
        const lead = (start: string): string => ffmpegLog([`silence_start: ${start}`, 'silence_end: 0.5 | silence_duration: 0.4', 'silence_start: 2', 'silence_end: 2.4 | silence_duration: 0.4']);
        expect(parseSilenceOnsets(lead('0.001'), 10)).toEqual([0.5, 2.4]);
        expect(parseSilenceOnsets(lead('0.002'), 10)).toEqual([0, 0.5, 2.4]);
    });

    it('keeps a silence_end that is 0.002 s from the end of the file and drops one that is 0.0005 s from it', async () => {
        const parseSilenceOnsets = await clips('parseSilenceOnsets');
        const log = (end: string): string => ffmpegLog(['silence_start: 0', 'silence_end: 0.1 | silence_duration: 0.1', 'silence_start: 5', `silence_end: ${end} | silence_duration: 1`]);
        expect(parseSilenceOnsets(log('9.998'), 10)).toEqual([0.1, 9.998]);
        expect(parseSilenceOnsets(log('9.9995'), 10)).toEqual([0.1]);
    });

    it('gives the lead-in 3 for the w01 onsets of the classroom and the phone video', async () => {
        const videoLeadIn = await clips('videoLeadIn');
        const audio = [0.0854649, 0.654717];
        expect(videoLeadIn(audio, [3.085458, 3.655167])).toBe(3);
        expect(videoLeadIn(audio, [3.085458, 3.654812])).toBe(3);
    });

    it('rounds the lead-in to 3 decimals', async () => {
        const videoLeadIn = await clips('videoLeadIn');
        expect(videoLeadIn([0.1, 0.6], [3.1234, 3.6234])).toBe(3.023);
    });

    it('throws when the second onsets differ from the first lead-in by more than 0.010 s, and accepts 0.009 s', async () => {
        const videoLeadIn = await clips('videoLeadIn');
        const error = thrownBy(() => videoLeadIn([0.1, 0.6], [3.1, 3.611]));
        expect(error, 'a difference of 0.011 s throws').toBeInstanceOf(Error);
        expect(error?.message).toMatch(/^lead-in:/);
        expect(videoLeadIn([0.1, 0.6], [3.1, 3.609]), 'a difference of 0.009 s').toBe(3);
    });

    it('throws "lead-in:" when a list has fewer than 2 onsets', async () => {
        const videoLeadIn = await clips('videoLeadIn');
        for (const [audio, video] of [[[0.1], [3.1, 3.6]], [[0.1, 0.6], [3.1]], [[], []]] as [number[], number[]][]) {
            const error = thrownBy(() => videoLeadIn(audio, video));
            expect(error?.message, JSON.stringify([audio, video])).toMatch(/^lead-in:/);
        }
    });

    it('gives the lead-in of a file that starts with sound against its first onset 0', async () => {
        const videoLeadIn = await clips('videoLeadIn');
        expect(videoLeadIn([0, 5.9], [1.5, 7.4])).toBe(1.5);
    });
});

describe('C12 the lead-in script on short files that ffmpeg makes (K13, FR 5)', () => {
    it('measures 1.5 s within 0.002, prints one tab line for each video and "lead-in: <value>", and writes nothing', async () => {
        const measureVideoLeadIn = await leadInScript('measureVideoLeadIn');
        const tree = leadInTree(1, W01_MEDIA);
        const before = fs.readFileSync(tree.weekFile, 'utf8');
        const run = await attempt(() => measureVideoLeadIn({ weekFile: tree.weekFile, contentRoot: tree.contentRoot }));
        expect(run.error?.message, 'the script runs').toBeUndefined();
        const result = run.value as { leadIn: number | undefined; lines: string[] };
        expect(Math.abs((result.leadIn ?? 0) - 1.5)).toBeLessThanOrEqual(0.002);
        expect(result.lines).toHaveLength(3);
        const videoLines = result.lines.slice(0, 2).map((line) => line.split('\t'));
        expect(videoLines.map((fields) => fields.length)).toEqual([4, 4]);
        expect(videoLines.map((fields) => path.basename(fields[0])).sort()).toEqual(['song-phone.mp4', 'song.mp4']);
        for (const fields of videoLines) expect(fields[3]).toMatch(/^\d+\.\d{3}$/);
        expect(result.lines[2]).toBe(`lead-in: ${(result.leadIn as number).toFixed(3)}`);
        expect(fs.readFileSync(tree.weekFile, 'utf8'), 'no write without --write').toBe(before);
    }, 60_000);

    it('adds the line videoLeadInSeconds after the videoPhone line with --write, and a second run changes no byte', async () => {
        const measureVideoLeadIn = await leadInScript('measureVideoLeadIn');
        const tree = leadInTree(1, W01_MEDIA);
        const before = fs.readFileSync(tree.weekFile, 'utf8').split('\n');
        const first = await attempt(() => measureVideoLeadIn({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, write: true }));
        expect(first.error?.message, 'the first run').toBeUndefined();
        const after = fs.readFileSync(tree.weekFile, 'utf8').split('\n');
        const at = before.findIndex((line) => line.trim().startsWith('"videoPhone":'));
        expect(at).toBeGreaterThan(0);
        expect(after).toHaveLength(before.length + 1);
        expect(after.slice(0, at + 1), 'the lines before the new line stay').toEqual(before.slice(0, at + 1));
        expect(after.slice(at + 2), 'the lines after the new line stay').toEqual(before.slice(at + 1));
        const added = after[at + 1].match(/^ {4}"videoLeadInSeconds": (\d+(?:\.\d+)?),$/);
        expect(added, `the new line: ${after[at + 1]}`).not.toBeNull();
        expect(Number(added?.[1])).toBe(first.value?.leadIn);
        expect(Math.abs(Number(added?.[1]) - 1.5)).toBeLessThanOrEqual(0.002);
        expect(() => StorytimeWeekSchema.parse(JSON.parse(after.join('\n'))), 'the new week parses').not.toThrow();

        ageTree(tree.contentRoot);
        const hashes = treeHashes(tree.contentRoot);
        const stamps = treeStamps(tree.contentRoot);
        const second = await attempt(() => measureVideoLeadIn({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, write: true }));
        expect(second.error?.message, 'the second run').toBeUndefined();
        expect(treeHashes(tree.contentRoot), 'no byte changes').toEqual(hashes);
        expect(treeStamps(tree.contentRoot), 'no modification time changes').toEqual(stamps);
    }, 60_000);

    it('changes only the line videoLeadInSeconds when the field holds another value', async () => {
        const measureVideoLeadIn = await leadInScript('measureVideoLeadIn');
        const tree = leadInTree(1, W01_MEDIA, (text) => text.replace(
            /^( *)("videoPhone": "[^"]*",)$/m,
            '$1$2\n$1"videoLeadInSeconds": 99,',
        ));
        const before = fs.readFileSync(tree.weekFile, 'utf8').split('\n');
        const index = before.findIndex((line) => line.includes('"videoLeadInSeconds": 99,'));
        expect(index, 'the start file holds the old value').toBeGreaterThan(0);
        const run = await attempt(() => measureVideoLeadIn({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, write: true }));
        expect(run.error?.message, 'the run').toBeUndefined();
        const after = fs.readFileSync(tree.weekFile, 'utf8').split('\n');
        expect(changedIndexes(before, after)).toEqual([index]);
        expect(after[index]).toMatch(/^ {4}"videoLeadInSeconds": \d+(?:\.\d+)?,$/);
        expect(after[index]).not.toContain('99');
    }, 60_000);

    it('prints "no video", exits 0 without a value, and writes nothing for a song with audio only', async () => {
        const measureVideoLeadIn = await leadInScript('measureVideoLeadIn');
        const tree = leadInTree(2, { 'song.mp3': 'song.mp3' });
        const before = fs.readFileSync(tree.weekFile, 'utf8');
        const run = await attempt(() => measureVideoLeadIn({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, write: true }));
        expect(run.error?.message, 'the script runs').toBeUndefined();
        expect(run.value?.leadIn).toBeUndefined();
        expect(run.value?.lines.some((line) => line.includes('no video'))).toBe(true);
        expect(fs.readFileSync(tree.weekFile, 'utf8'), 'nothing is written').toBe(before);
    }, 60_000);

    it('stops for a song that has no audio', async () => {
        const measureVideoLeadIn = await leadInScript('measureVideoLeadIn');
        const tree = leadInTree(1, W01_MEDIA, (text) => text.split('\n').filter((line) => line.trim() !== '"audio": "l2/media/w01/song.mp3",').join('\n'));
        const before = fs.readFileSync(tree.weekFile, 'utf8');
        expect(before, 'the edit removed the audio line').not.toContain('"audio": "l2/media/w01/song.mp3"');
        const run = await attempt(() => measureVideoLeadIn({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, write: true }));
        expect(run.error, 'the script throws').toBeInstanceOf(Error);
        expect(fs.readFileSync(tree.weekFile, 'utf8'), 'nothing is written').toBe(before);
    }, 60_000);

    it('stops when the two videos of one song give lead-ins that differ by more than 0.010 s', async () => {
        const measureVideoLeadIn = await leadInScript('measureVideoLeadIn');
        const tree = leadInTree(1, { 'song.mp3': 'song.mp3', 'song.mp4': 'song.mp4', 'song-phone-late.mp4': 'song-phone.mp4' });
        const before = fs.readFileSync(tree.weekFile, 'utf8');
        const run = await attempt(() => measureVideoLeadIn({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, write: true }));
        expect(run.error, 'the script throws').toBeInstanceOf(Error);
        expect(run.error?.message).toMatch(/lead-in/i);
        expect(fs.readFileSync(tree.weekFile, 'utf8'), 'nothing is written').toBe(before);
    }, 60_000);

    it('prints the usage and exits 0 for --help, and exits 2 for a missing option', async () => {
        const main = await leadInScript('main');
        const help = await captureOutput(() => main(['--help']));
        expect(help.value).toBe(0);
        expect(help.out.join('\n')).toContain('--week');
        expect((await captureOutput(() => main([]))).value, 'no option').toBe(2);
        expect((await captureOutput(() => main(['--level', '2']))).value, 'no week').toBe(2);
    });
});

// ---------------------------------------------------------------------------------------------
// C13, C14: the bank maker
// ---------------------------------------------------------------------------------------------

describe('C13 the bank maker writes the clip files (K5, K7)', () => {
    it('lists 12 made words for week 1 and prints "chars" for one take of each key', async () => {
        const run = await baseRun();
        expect(run.result.made.map((entry) => entry.replace(/^wa-/, ''))).toEqual(W01_MISSING);
        expect(run.result.chars).toBe(37);
        expect(run.voice.calls).toHaveLength(12);
    }, 120_000);

    it('writes a WAV of 32 kHz, mono, 16 bits with the peak 23197 and 80 ms of quiet at each edge', async () => {
        const run = await baseRun();
        for (const key of W01_MISSING) {
            const file = path.join(run.tree.bankFolder, `wa-${key}.wav`);
            expect(fs.existsSync(file), `${key}: wa-${key}.wav exists`).toBe(true);
            const wav = readWav(file);
            expect([wav.rate, wav.channels, wav.bits], `${key}: rate, channels, bits`).toEqual([RATE, 1, 16]);
            expect(peakOf(wav.samples), `${key}: peak`).toBe(PEAK);
            const call = callOf(run.voice, W01_TEXT[key], 1);
            expect(wav.samples.length, `${key}: the loud part plus 2 x 2560 samples`).toBe(call.extent + 2 * EDGE);
            expect(peakOf(wav.samples.subarray(0, EDGE)), `${key}: the start edge is quiet`).toBeLessThanOrEqual(103);
            expect(Math.abs(wav.samples[EDGE]), `${key}: the loud part starts after 2560 samples`).toBe(PEAK);
            expect(peakOf(wav.samples.subarray(wav.samples.length - EDGE)), `${key}: the end edge is quiet`).toBeLessThanOrEqual(103);
            expect(Math.abs(wav.samples[wav.samples.length - EDGE - 1]), `${key}: the loud part ends 2560 samples before the end`).toBe(PEAK);
        }
    }, 120_000);

    it('writes an mp3 of 32 kHz, mono, 128 kb/s for each new word', async () => {
        const run = await baseRun();
        for (const key of W01_MISSING) {
            const file = path.join(run.tree.bankFolder, `wa-${key}.mp3`);
            expect(fs.existsSync(file), `${key}: wa-${key}.mp3 exists`).toBe(true);
            expect(probeAudio(file), `${key}: the mp3 stream`).toEqual({ sampleRate: RATE, channels: 1, bitRate: 128000 });
        }
    }, 120_000);

    it('adds a row of the K6 form for each new word and leaves the 98 old rows as they are', async () => {
        const run = await baseRun();
        const rows = newRows(run);
        expect(Object.keys(rows).sort()).toEqual(W01_MISSING);
        const all = manifestItems(run.tree.manifestFile);
        expect(all).toHaveLength(110);
        expect(all.map((row) => row.n), 'n continues from 99, with no gap').toEqual(Array.from({ length: 110 }, (_, index) => index + 1));
        expect(all.slice(0, 98), 'the 98 old rows are as they were').toEqual((JSON.parse(run.before) as { items: unknown[] }).items);
        W01_MISSING.forEach((key, index) => {
            const row = rows[key];
            const call = callOf(run.voice, W01_TEXT[key], 1);
            const sentWav = path.join(run.tree.bankFolder, `wa-${key}.wav`);
            const hasText = W01_TEXT[key] !== key;
            expect(Object.keys(row), `${key}: the keys of the row, in the order of K6`).toEqual([...ROW_KEYS, ...(hasText ? ['text'] : []), 'added']);
            expect(row.n).toBe(99 + index);
            expect(row.id).toBe(`wa-${key}`);
            expect(row.word).toBe(key);
            expect(row.file).toBe(`wa-${key}.wav`);
            expect(row.mp3).toBe(`wa-${key}.mp3`);
            expect(row.sources).toBe('book');
            expect(row.weeks, `${key}: the weeks`).toBe(W01_WEEKS[key]);
            expect(row.take).toBe(1);
            expect(row.len_s).toBe(Math.round(((call.extent + 2 * EDGE) / RATE) * 1000) / 1000);
            expect(row.peak_dbfs).toBe(-3);
            expect(row.sha256, `${key}: the WAV hash`).toBe(fileHash(sentWav));
            expect(row.added).toBe(DATE);
            if (hasText) expect(row.text, `${key}: the text sent`).toBe(W01_TEXT[key]);
        });
    }, 120_000);

    it('adds the rows by a text edit in the Python form: one comma line changes, -3.0 stays, the top fields stay', async () => {
        const run = await baseRun();
        const after = fs.readFileSync(run.tree.manifestFile, 'utf8');
        expectAppendOnly(run.before, after, 12);
        expect(pythonFormHolds(run.tree.manifestFile), 'the Python form test of K6').toBe(true);
        expect((after.match(/"peak_dbfs": -3\.0,/g) ?? []).length, 'each row keeps the text -3.0').toBe(110);
        const { items: oldItems, ...oldTop } = JSON.parse(run.before) as Record<string, unknown>;
        const { items: newItems, ...newTop } = JSON.parse(after) as Record<string, unknown>;
        expect(newTop, 'the top-level fields do not change').toEqual(oldTop);
        expect((newItems as unknown[]).length - (oldItems as unknown[]).length).toBe(12);
    }, 120_000);

    it('makes the words in sorted order and writes no file for a word that has a row', async () => {
        const run = await baseRun();
        expect(run.voice.calls.map((call) => call.text)).toEqual(W01_MISSING.map((key) => W01_TEXT[key]));
        const files = fs.readdirSync(run.tree.bankFolder);
        for (const key of W01_MISSING) expect(files, `${key}: both files`).toEqual(expect.arrayContaining([`wa-${key}.mp3`, `wa-${key}.wav`]));
        const old = files.filter((name) => W01_PRESENT.some((word) => name.startsWith(`wa-${word}.`)));
        expect(old, 'no file for a word that has a row').toEqual([]);
    }, 120_000);

    it('exports main, which prints the usage for --help and exits 2 for a missing option', async () => {
        const main = await maker('main');
        const help = await captureOutput(() => main(['--help']));
        expect(help.value).toBe(0);
        expect(help.out.join('\n')).toContain('--week');
        expect((await captureOutput(() => main([]))).value, 'no option').toBe(2);
        expect((await captureOutput(() => main(['--level', '2']))).value, 'no week').toBe(2);
    });
});

describe('C13 normalizeWordClip (K7 steps 1 and 2)', () => {
    it('scales so that the largest sample is 23197 with Math.round(x * 23197 / peak)', async () => {
        const normalizeWordClip = await clips('normalizeWordClip');
        const out = normalizeWordClip(Int16Array.from([0, 0, 4000, -10000, 2500, -3000, 0, 0]), RATE);
        expect(Array.from(out)).toEqual([0, 0, 9279, -23197, 5799, -6959, 0, 0]);
    });

    it('keeps 80 ms (2560 samples) at each edge, or fewer when the take has fewer', async () => {
        const normalizeWordClip = await clips('normalizeWordClip');
        const quiet = (length: number): number[] => new Array<number>(length).fill(0);
        const span = Array.from(loud(500));
        const long = normalizeWordClip(Int16Array.from([...quiet(9000), ...span, ...quiet(11000)]), RATE);
        expect(long).toHaveLength(500 + 2 * EDGE);
        expect(peakOf(long)).toBe(PEAK);
        const short = normalizeWordClip(Int16Array.from([...quiet(1000), ...span, ...quiet(3000)]), RATE);
        expect(short, '1000 samples before, 2560 samples after').toHaveLength(1000 + 500 + EDGE);
    });
});

describe('C14 the bank maker heard rule and the limits (K8, K9, K11)', () => {
    it('applies wordClipText: uh for a, I for i, else the first written form', async () => {
        const wordClipText = await clips('wordClipText');
        expect(wordClipText('a', 'A')).toBe('uh');
        expect(wordClipText('a', 'a')).toBe('uh');
        expect(wordClipText('i', 'I')).toBe('I');
        expect(wordClipText('i', 'i')).toBe('I');
        expect(wordClipText('ben', 'Ben')).toBe('Ben');
        expect(wordClipText('nurse', 'nurse')).toBe('nurse');
    });

    it('holds the variant list of K9', async () => {
        const variants = await clips('WORD_CLIP_HEARD_VARIANTS');
        const sorted = Object.fromEntries(Object.entries(variants).map(([key, list]) => [key, [...list].sort()]));
        const expected = Object.fromEntries(Object.entries(HEARD_VARIANTS).map(([key, list]) => [key, [...list].sort()]));
        expect(sorted).toEqual(expected);
    });

    it('joins the recognized words with no space, in lower case, and removes each other character', async () => {
        const heardText = await clips('heardText');
        expect(heardText(['Hel', 'lo'])).toBe('hello');
        expect(heardText(['Ben.'])).toBe('ben');
        expect(heardText(["You're", '!'])).toBe("you're");
        expect(heardText(['2'])).toBe('2');
        expect(heardText([])).toBe('');
    });

    it('passes the key and the variants of the key only, with the note of the K9 form', async () => {
        const heardPasses = await clips('heardPasses');
        expect(heardPasses('ben', 'ben')).toEqual({ pass: true, note: '' });
        expect(heardPasses('a', 'uh')).toEqual({ pass: true, note: "homophone variant: heard 'uh'" });
        expect(heardPasses('i', 'eye')).toEqual({ pass: true, note: "homophone variant: heard 'eye'" });
        expect(heardPasses('your', "you're")).toEqual({ pass: true, note: "homophone variant: heard 'you're'" });
        expect(heardPasses('ben', 'been').pass).toBe(false);
        expect(heardPasses('ben', 'uh').pass, 'a variant of another key').toBe(false);
        expect(heardPasses('a', 'eye').pass).toBe(false);
    });

    it('appends rows by a text edit: one comma line changes, the rows are in the K6 order, and -3.0 stays', async () => {
        const appendBankRows = await clips('appendBankRows');
        const old = [bankRow(1, 'am', sha256('am')), bankRow(2, 'hello', sha256('hello')), bankRow(3, 'sam', sha256('sam'))];
        const base = pythonManifest(old);
        const withText: WordBankRow = { ...bankRow(4, 'ben', sha256('ben')), weeks: '1', text: 'Ben', added: DATE };
        const plain: WordBankRow = { ...bankRow(5, 'nod', sha256('nod')), added: DATE };
        const out = appendBankRows(base, [withText, plain]);
        expectAppendOnly(base, out, 2);
        const file = path.join(tempFolder('storytime-clips-append-'), 'manifest.json');
        fs.writeFileSync(file, out);
        expect(pythonFormHolds(file), 'the Python form test of K6').toBe(true);
        expect(out).toContain('"peak_dbfs": -3.0');
        const rows = manifestItems(file);
        expect(rows).toHaveLength(5);
        expect(Object.keys(rows[3])).toEqual([...ROW_KEYS, 'text', 'added']);
        expect(Object.keys(rows[4])).toEqual([...ROW_KEYS, 'added']);
        expect(rows[3]).toEqual(withText);
        expect(rows[4]).toEqual(plain);
    });

    it('makes a take again when it is heard as another word, and keeps the take number', async () => {
        const run = await scenarioRun();
        const rows = newRows(run);
        expect(rows.ben.take, 'ben: take 1 was heard as "been"').toBe(2);
        expect(rows.ben.recognized).toBe('ben');
        expect(rows.ben.note).toBe('');
        expect(callOf(run.voice, 'Ben', 2).text).toBe('Ben');
        for (const key of ['and', 'mia', 'nod', 'nurse']) expect(rows[key].take, `${key}: one take`).toBe(1);
    }, 120_000);

    it('keeps the third take with the note "heard \'<x>\' in 3 takes" when 3 takes fail', async () => {
        const run = await scenarioRun();
        const row = newRows(run).can;
        expect(row.take).toBe(3);
        expect(row.recognized).toBe('khan');
        expect(row.note).toBe("heard 'khan' in 3 takes");
        expect(run.voice.calls.filter((call) => call.text === 'can')).toHaveLength(3);
    }, 120_000);

    it('passes a variant with its note: a sends the text uh and the row holds text uh', async () => {
        const run = await scenarioRun();
        const row = newRows(run).a;
        expect(row.take).toBe(1);
        expect(row.text).toBe('uh');
        expect(row.recognized).toBe('uh');
        expect(row.note).toBe("homophone variant: heard 'uh'");
        expect(run.voice.calls[0].text, 'the first call sends uh').toBe('uh');
    }, 120_000);

    it('sends the text eye for the next take of i when the heard text is a number (K8)', async () => {
        const run = await scenarioRun();
        const row = newRows(run).i;
        expect(callOf(run.voice, 'I', 1).take).toBe(1);
        expect(run.voice.calls.find((call) => call.text === 'eye'), 'the second take sends eye').toBeDefined();
        expect(row.take).toBe(2);
        expect(row.text).toBe('eye');
        expect(row.recognized).toBe('eye');
        expect(row.note).toBe("homophone variant: heard 'eye'");
    }, 120_000);

    it('makes a take again when its longest inner pause is above 0.6 s', async () => {
        const run = await scenarioRun();
        const row = newRows(run).neck;
        expect(row.take, 'neck: take 1 holds a pause of 0.8 s').toBe(2);
        expect(row.note).toBe('');
        expect(run.voice.calls.filter((call) => call.text === 'neck')).toHaveLength(2);
    }, 120_000);

    it('makes the words in sorted order with the takes in a row, and counts every character sent', async () => {
        const run = await scenarioRun();
        expect(run.voice.calls.map((call) => call.text)).toEqual([
            'uh', 'and', 'Ben', 'Ben', 'can', 'can', 'can', 'I', 'eye', 'May', 'Mia', 'neck', 'neck', 'nod', 'nurse', 'Pip', 'your',
        ]);
        expect(run.result.chars, 'one take each is 37, and the extra takes are 16').toBe(53);
        expect(run.result.chars).toBe(run.voice.calls.reduce((sum, call) => sum + call.text.length, 0));
        expect(manifestItems(run.tree.manifestFile)).toHaveLength(110);
        expect(pythonFormHolds(run.tree.manifestFile)).toBe(true);
    }, 120_000);

    it('stops before the first call when one take of each key needs more than maxChars, and changes no row', async () => {
        const tree = makerTree();
        const voice = fakeVoice();
        const hashes = treeHashes(tree.bankFolder);
        const run = await runMaker(tree, voice, { maxChars: 20 });
        expect(run.error, 'the maker throws').toBeInstanceOf(Error);
        expect(run.error?.message).toMatch(/char/i);
        expect(voice.calls, 'no call is made').toHaveLength(0);
        expect(treeHashes(tree.bankFolder), 'no row and no file changes').toEqual(hashes);
    }, 120_000);

    it('stops before the call that would take the run above maxChars, and keeps the rows of the finished words', async () => {
        const tree = makerTree();
        // One retake of Ben: 36 characters are sent after "pip", and the take of "your" (4) would make 40.
        const voice = fakeVoice({ heard: (text, take) => (text === 'Ben' && take === 1 ? ['been'] : [text]) });
        const run = await runMaker(tree, voice, { maxChars: 38 });
        expect(run.error, 'the maker throws before the call for "your"').toBeInstanceOf(Error);
        expect(run.error?.message).toMatch(/char/i);
        expect(voice.calls.map((call) => call.text).includes('your'), 'no take of your').toBe(false);
        expect(voice.calls.reduce((sum, call) => sum + call.text.length, 0)).toBeLessThanOrEqual(38);
        const words = manifestItems(tree.manifestFile).slice(98).map((row) => String(row.word));
        expect(words, 'the 11 finished words have a row, and your has none').toEqual(W01_MISSING.filter((key) => key !== 'your'));
        expect(pythonFormHolds(tree.manifestFile)).toBe(true);
        expect(fs.existsSync(path.join(tree.bankFolder, 'wa-your.wav'))).toBe(false);
        expect(fs.existsSync(path.join(tree.bankFolder, 'wa-nurse.mp3'))).toBe(true);
    }, 120_000);

    it('lists the keys with their K8 texts and prints "chars: 37" for --dry-run, and writes nothing', async () => {
        const tree = makerTree();
        const voice = fakeVoice();
        const hashes = treeHashes(tree.bankFolder);
        const run = await runMaker(tree, voice, { dryRun: true });
        expect(run.error?.message, 'the dry run').toBeUndefined();
        const result = run.value as MakeWordBankResult;
        expect(result.made).toEqual([]);
        expect(result.lines, 'a line "chars: 37"').toContain('chars: 37');
        for (const key of W01_MISSING) {
            expect(result.lines.some((line) => line.includes(key) && line.includes(W01_TEXT[key])), `a line with ${key} and ${W01_TEXT[key]}`).toBe(true);
        }
        expect(result.lines.some((line) => line.includes('Hello')), 'no line for a word that has a row').toBe(false);
        expect(voice.calls, 'no call is made').toHaveLength(0);
        expect(treeHashes(tree.bankFolder), 'nothing is written').toEqual(hashes);
    }, 120_000);

    it('throws "word bank: no faster-whisper venv at <path>" before the first call when recognize is absent', async () => {
        const tree = makerTree();
        const voice = fakeVoice();
        const hashes = treeHashes(tree.bankFolder);
        const makeWordBank = await maker('makeWordBank');
        const run = await attempt(() => makeWordBank({
            level: 2,
            week: 1,
            contentRoot: tree.contentRoot,
            bankFolder: tree.bankFolder,
            date: DATE,
            maxChars: 120,
            synthesize: voice.synthesize,
            whisperPython: MISSING_PYTHON,
        }));
        expect(run.error, 'the maker throws').toBeInstanceOf(Error);
        expect(run.error?.message).toBe(`word bank: no faster-whisper venv at ${MISSING_PYTHON}`);
        expect(voice.calls, 'no synthesize call').toHaveLength(0);
        expect(treeHashes(tree.bankFolder), 'nothing is written').toEqual(hashes);
    }, 120_000);
});

// ---------------------------------------------------------------------------------------------
// C15, C16: characterization and guards
// ---------------------------------------------------------------------------------------------

describe('C15 the shipped bank (characterization)', () => {
    it('has 98 rows or more, and each sha256 equals the SHA-256 of its WAV file', () => {
        const bank = path.join(STORYTIME_ROOT, 'words');
        const rows = manifestItems(path.join(bank, 'manifest.json')) as unknown as WordBankRow[];
        expect(rows.length).toBeGreaterThanOrEqual(98);
        const wrong = rows.filter((row) => fileHash(path.join(bank, row.file)) !== row.sha256).map((row) => row.id);
        expect(wrong, 'rows whose sha256 differs from their WAV').toEqual([]);
    });
});

describe('C16 the guards of this file', () => {
    it('holds no path of the Measure track folders', () => {
        expect(fs.readFileSync(SELF_FILE, 'utf8').includes(FORBIDDEN_PATH)).toBe(false);
    });

    it('writes nothing under content/storytime (this case runs last)', () => {
        expect(contentSnapshot()).toEqual(SNAPSHOT_AT_LOAD);
    });
});
