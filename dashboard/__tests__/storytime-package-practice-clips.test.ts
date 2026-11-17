// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT } from '../lib/storytime/files';
import { BookAudioSchema, FocusSchema, StorytimeWeekSchema } from '../lib/storytime/schema';

/**
 * Phase 12, Red 1: own clips for the practice words and for the sentences of the decodable books
 * (spec FR 1 to FR 8, decisions L3 to L10 and L17). The file holds the cases D1 to D13.
 *
 * The module `sentence-clips.ts`, the two new scripts (`make-sentence-clips.ts`, `set-sentence-clips.ts`),
 * the new exports of `word-clips.ts`, the flag `--practice`, the three new maps of the mapper, the two
 * new checks, and the four schema fields do not exist yet. Each case that needs one of them fails inside
 * its body with a label that names it.
 *
 * Names that the spec leaves open are fixed here, so that Green does not guess. Each is marked PIN:
 *  - PIN `openingWordKeys(pa)` gives the distinct keys of the 5 lines. The test compares them as a set.
 *    The index `<i>` of the error `opening: no word form in line <i>` starts at 0.
 *  - PIN `practiceWordKeys(week)` takes the week object and gives `{ opening, family, tricky }`: three
 *    arrays of the distinct keys of each list, sorted by code point.
 *  - PIN `planPracticeClips({ level, week, opening, focus })` gives `{ opening, family, tricky, files }`:
 *    three maps (an absent or empty list gives `{}`), and the sorted distinct files of the three maps.
 *  - PIN `planSentenceClips({ level, week, books })` gives a flat array of `{ book, n, text, file }`
 *    (`book` from 0, `n` from 1) for the books with `kind` `decodable`, in the order of the books.
 *  - PIN `sentenceHeardPasses(sentence, heardWords)` takes the recognized words as strings and gives a
 *    boolean (the rule of `heardMatches`). `sentenceLengthBounds(sentence)` gives `{ min, max }` in seconds.
 *  - PIN `looksLikeCut(clip, source, rate)` takes `Int16Array` samples and gives a boolean.
 *  - PIN the option of the bank maker is `practice: true` (the flag `--practice`).
 *  - PIN `makeSentenceClips({ level, week, contentRoot, maxChars, dryRun, synthesize, recognize,
 *    whisperPython })` gives `{ made, chars, lines }`. `made` holds the relative path of each clip.
 *    `synthesize(text, wavFile, voice, speed)` is called once for each take. `recognize` is the one of
 *    the bank maker. `recognized` of the provenance file is the heard words joined by one space.
 *  - PIN `setSentenceClips({ weekFile, contentRoot, check })` writes the field. The CLI `main(argv)` of
 *    each script gives 0 for `--help`, and 2 for a missing option.
 *  - PIN `checkSentenceClips`: `count differs: <book indexes>` and `text differs: <paths>`; the
 *    lists use `, ` and the parts use `; `. `checkPracticeClips` gives no row for a week with no book
 *    (the review week st2/8 gets no row, AC12-6).
 *
 * Every table is written by hand. The test never reads an expected value from the code under test. It
 * reads the shipped week files and the shipped bank as data, and it writes only into temporary copies.
 * Mmx and faster-whisper are fakes, so no case makes a paid call or loads a model.
 */

/** The dashboard folder, so that the new modules are read by path. */
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');

/** The pure module of the word clips (FR 2). */
const wordClipsModule = path.join(dashboardRoot, 'lib/storytime/word-clips.ts');

/** The pure module of the sentence clips (FR 2). */
const sentenceClipsModule = path.join(dashboardRoot, 'lib/storytime/sentence-clips.ts');

/** The bank maker (FR 3). */
const makeWordBankModule = path.join(dashboardRoot, 'scripts/storytime/make-word-bank.ts');

/** The word mapper (FR 4). */
const setWordClipsModule = path.join(dashboardRoot, 'scripts/storytime/set-word-clips.ts');

/** The sentence maker (FR 5). */
const makeSentenceClipsModule = path.join(dashboardRoot, 'scripts/storytime/make-sentence-clips.ts');

/** The sentence mapper (FR 6). */
const setSentenceClipsModule = path.join(dashboardRoot, 'scripts/storytime/set-sentence-clips.ts');

/** The script of the week checks (FR 7). */
const checkWeeksModule = path.join(dashboardRoot, 'scripts/storytime/check-weeks.ts');

/** This file, so that the guard case reads its own text. */
const SELF_FILE = path.join(dashboardRoot, '__tests__/storytime-package-practice-clips.test.ts');

/** The root of the temporary copies of the tests. */
const TEMP_ROOT = '/tmp/opencode';

/** The sample rate of the clips and of the fake takes. */
const RATE = 32000;

/** The peak sample of a bank clip: round(32767 x 10^(-3/20)) (K7 step 1). */
const PEAK = 23197;

/** The quiet edge of a clip: 80 ms at 32 kHz (K7 step 2). */
const EDGE = 2560;

/** The quiet start and the quiet end of a fake take, in samples. */
const TAKE_LEAD = 9600;
const TAKE_TAIL = 12800;

/** The quiet gap inside a fake take with a bad pause: 0.8 s, above the limit of 0.6 s. */
const PAUSE_SAMPLES = 25600;

/** The date that the bank maker writes into the `added` key of a new row. */
const DATE = '2026-11-13';

/** An interpreter path that does not exist, for the venv check of K9. */
const MISSING_PYTHON = '/tmp/opencode/storytime-practice-no-venv/bin/python';

/** The voice of the decodable books of w01 to w07. */
const VOICE = 'English_captivating_female1';

/** The exact label of the check `practice-clips` (L9). */
const PRACTICE_CLIPS_LABEL = 'The practice word clips named in the package exist and match the word bank';

/** The exact label of the check `sentence-clips` (L9). */
const SENTENCE_CLIPS_LABEL = 'The sentence clips named in the package exist and follow the book sentences';

/** The text that no line of this file may hold: the guard of the file. The pieces keep this file clean. */
const FORBIDDEN_PATH = `${['measure', 'tracks'].join('/')}/`;

/** The keys of a bank row, in the order of K6. */
const ROW_KEYS = [
    'n', 'id', 'word', 'file', 'mp3', 'sources', 'weeks', 'take', 'len_s', 'peak_dbfs', 'recognized', 'note', 'sha256',
];

/** The keys of an item of the sentence provenance file, in the order of L8. */
const ITEM_KEYS = ['book', 'n', 'text', 'file', 'take', 'len_s', 'peak_dbfs', 'recognized', 'note', 'sha256'];

// ---------------------------------------------------------------------------------------------
// Hand-written tables (spec Facts, measured 2026-11-13)
// ---------------------------------------------------------------------------------------------

/** The distinct opening words of each week, sorted by code point (the Facts section). */
const OPENING_KEYS: Record<number, string[]> = {
    1: ['fan', 'goodbye', 'hello', 'hen', 'nest', 'net', 'nose', 'nut', 'pen', 'sun'],
    2: ['ant', 'apple', 'bag', 'cat', 'fan', 'hat', 'man', 'nap', 'net', 'nose'],
    3: ['ant', 'cap', 'nap', 'net', 'pan', 'pear', 'pen', 'pig', 'top'],
    4: ['apple', 'ham', 'jam', 'man', 'mango', 'map', 'milk', 'mop', 'pam', 'pan'],
    5: ['bus', 'map', 'pan', 'sad', 'sam', 'sit', 'sock', 'sun'],
    6: ['hat', 'map', 'mat', 'sat', 'see', 'tap', 'ten', 'tiger', 'top'],
    7: ['hop', 'hot', 'mop', 'nod', 'octopus', 'ox', 'pot', 'see', 'teddy', 'top'],
};

/** The distinct family words of each week, sorted by code point. */
const FAMILY_KEYS: Record<number, string[]> = {
    1: ['boy', 'friend', 'girl', 'goodbye', 'hello', 'teacher'],
    2: ['eight', 'five', 'four', 'nine', 'one', 'seven', 'six', 'ten', 'three', 'two'],
    3: ['blue', 'green', 'orange', 'pink', 'purple', 'red', 'yellow'],
    4: ['brother', 'dad', 'family', 'grandma', 'grandpa', 'mom', 'sister'],
    5: ['arms', 'ears', 'eyes', 'feet', 'hands', 'legs', 'nose'],
    6: ['bird', 'cat', 'dog', 'duck', 'fish', 'frog', 'horse'],
    7: ['ball', 'car', 'doll', 'drum', 'kite', 'teddy', 'train'],
};

/** The distinct tricky words of each week, sorted by code point. */
const TRICKY_KEYS: Record<number, string[]> = {
    1: ['a', 'and', 'can'],
    2: ['i', 'in', 'on'],
    3: ['get', 'the'],
    4: ['is', 'this'],
    5: ['off', 'saw', 'with'],
    6: ['he', 'put', 'see'],
    7: ['from', 'run', 'up'],
};

/** The distinct files of the union of the book clips and the practice clips, for each week. */
const UNION_FILES: Record<number, number> = { 1: 30, 2: 38, 3: 27, 4: 31, 5: 33, 6: 27, 7: 32 };

/** The 32 gap words that already have a bank clip (spec Facts). */
/** The words that join the gap list with the Phase 14 change list, and the words that leave it (R1). */
const P14_GAP_IN = ['net', 'nose'];
const P14_GAP_OUT = ['arm', 'cup', 'dress', 'map'];

const GAP_WITH_ROW = [
    'ant', 'apple', 'bag', 'boy', 'bus', 'cat', 'cup', 'eight', 'friend', 'girl', 'goodbye', 'hat', 'in', 'man', 'mango', 'map',
    'milk', 'nap', 'nine', 'nod', 'octopus', 'on', 'ox', 'pear', 'pen', 'pig', 'sister', 'sock', 'sun', 'ten', 'tiger', 'top',
];

/** The 15 new words, sorted by code point (spec Facts). */
const NEW_WORDS = ['arm', 'cap', 'dress', 'fan', 'from', 'ham', 'hen', 'hop', 'hot', 'jam', 'mop', 'put', 'sad', 'sit', 'up'];

/** What the bank maker makes in each week, in the order of the runs w01 to w07: the key and the TTS text (K8, L6). */
const MADE_BY_WEEK: Record<number, [string, string][]> = {
    1: [['fan', 'Fan'], ['hen', 'Hen']],
    2: [],
    3: [['cap', 'Cap']],
    4: [['arm', 'arm'], ['ham', 'Ham'], ['jam', 'jam'], ['mop', 'Mop']],
    5: [['dress', 'dress'], ['sad', 'Sad'], ['sit', 'Sit']],
    6: [['put', 'put']],
    7: [['from', 'from'], ['hop', 'Hop'], ['hot', 'Hot'], ['up', 'up']],
};

/** What a dry run lists in each week when the bank holds the 137 rows (the weeks w02 and w07 list a word that an earlier week makes). */
const DRY_BY_WEEK: Record<number, [string, string][]> = {
    1: [['fan', 'Fan'], ['hen', 'Hen']],
    2: [['fan', 'Fan']],
    3: [['cap', 'Cap']],
    4: [['arm', 'arm'], ['ham', 'Ham'], ['jam', 'jam'], ['mop', 'Mop']],
    5: [['dress', 'dress'], ['sad', 'Sad'], ['sit', 'Sit']],
    6: [['put', 'put']],
    7: [['from', 'from'], ['hop', 'Hop'], ['hot', 'Hot'], ['mop', 'Mop'], ['up', 'up']],
};

/** The characters of one take of each week run (the sum of the TTS texts above). */
const DRY_CHARS = [6, 3, 3, 12, 11, 3, 15];
const MADE_CHARS = [6, 0, 3, 12, 11, 3, 12];

/** The row facts of each new word (K6, L6): the sources, the weeks of the level, and the `text` key. */
const ROW_FACTS: Record<string, { sources: string; weeks: string; text?: string }> = {
    fan: { sources: 'opening', weeks: '1;2', text: 'Fan' },
    hen: { sources: 'opening', weeks: '1', text: 'Hen' },
    cap: { sources: 'opening', weeks: '3', text: 'Cap' },
    arm: { sources: 'opening', weeks: '4' },
    ham: { sources: 'opening', weeks: '4', text: 'Ham' },
    jam: { sources: 'opening', weeks: '4' },
    mop: { sources: 'opening', weeks: '4;7', text: 'Mop' },
    dress: { sources: 'opening', weeks: '5' },
    sad: { sources: 'opening', weeks: '5', text: 'Sad' },
    sit: { sources: 'opening', weeks: '5', text: 'Sit' },
    put: { sources: 'tricky', weeks: '6' },
    from: { sources: 'tricky', weeks: '7' },
    hop: { sources: 'opening', weeks: '7', text: 'Hop' },
    hot: { sources: 'opening', weeks: '7', text: 'Hot' },
    up: { sources: 'tricky', weeks: '7' },
};

/** The keys of the book 0 and the book 1 of week 1, sorted by code point (the Phase 11 table). */
const W01_BOOK0 = ['am', 'ben', 'hello', 'i', 'may', 'mia', 'nan', 'pat', 'pip', 'sam', 'teacher', 'your'];
const W01_BOOK1 = ['a', 'and', 'can', 'nan', 'neck', 'nest', 'net', 'nod', 'nose', 'nurse', 'nut'];

/** The keys of the three practice lists of week 1. */
const W01_OPENING = OPENING_KEYS[1];
const W01_FAMILY = FAMILY_KEYS[1];
const W01_TRICKY = TRICKY_KEYS[1];

/** The 30 distinct keys of week 1: the books and the practice lists, sorted. */
const W01_UNION = [...new Set([...W01_BOOK0, ...W01_BOOK1, ...W01_OPENING, ...W01_FAMILY, ...W01_TRICKY])].sort();

/** The 8 sentences of the decodable book of week 1, in order. */
const W01_SENTENCES = [
    'A nest.', 'A net.', 'A nut.', 'A nose.', 'A neck.', 'A nurse.', 'A nest and a nut.', 'Nan can nod!',
];

/** The relative path of each sentence clip of week 1 (L7). */
const W01_SENTENCE_PATHS = W01_SENTENCES.map((_, index) => `l2/media/w01/sentences/b1-s${String(index + 1).padStart(2, '0')}.mp3`);

/** The characters of the 8 decodable sentences of each week (spec Facts): 779 in all. */
const SENTENCE_CHARS: Record<number, number> = { 1: 70, 2: 62, 3: 130, 4: 116, 5: 127, 6: 132, 7: 142 };

// ---------------------------------------------------------------------------------------------
// Module types
// ---------------------------------------------------------------------------------------------

/** One list word of a week as the pure module reads it. */
interface RawWeek {
    meta?: { level: number; week: number };
    opening?: { pa: { en: string; th?: string }[]; audio?: unknown; wordClips?: Record<string, string> };
    focus: {
        trickyWords: string[];
        trickyWordClips?: Record<string, string>;
        family: { words: { word: string }[]; wordClips?: Record<string, string> };
    };
    books: {
        kind: string;
        audio: {
            voice?: string;
            file?: string;
            sentences: { sentence: string; words?: { word: string }[] }[];
            slowSentences?: { words?: { word: string }[] }[];
            wordClips?: Record<string, string>;
            sentenceClips?: { sentence: string; file: string }[];
        };
    }[];
}

/** The input of the practice plan (PIN). */
interface PracticeInput {
    level: number;
    week: number;
    opening?: RawWeek['opening'];
    focus?: RawWeek['focus'];
}

/** The result of the practice plan (PIN). */
interface PracticePlan {
    opening: Record<string, string>;
    family: Record<string, string>;
    tricky: Record<string, string>;
    files: string[];
}

/** The pure module of the word clips (FR 2). */
interface WordClipsModule {
    openingWordKeys?: (pa: readonly { en: string; th?: string }[]) => string[];
    practiceWordKeys?: (week: Partial<RawWeek>) => { opening: string[]; family: string[]; tricky: string[]; bad: string[] };
    planPracticeClips?: (input: PracticeInput) => PracticePlan;
    bookWordKeys?: (audio: unknown) => string[];
    planWordClips?: (input: { level: number; week: number; books: readonly { audio: unknown }[] }) => { maps: Record<string, string>[]; files: string[] };
}

/** One planned sentence clip (PIN). */
interface PlannedSentence {
    book: number;
    n: number;
    text: string;
    file: string;
}

/** The pure module of the sentence clips (FR 2). */
interface SentenceClipsModule {
    sentenceClipPath?: (level: number, week: number, book: number, n: number) => string;
    planSentenceClips?: (input: { level: number; week: number; books: readonly { kind: string; audio: { sentences?: readonly { sentence: string }[] } }[] }) => PlannedSentence[];
    sentenceHeardPasses?: (sentence: string, heard: readonly string[]) => boolean;
    sentenceLengthBounds?: (sentence: string) => { min: number; max: number };
    looksLikeCut?: (clip: Int16Array, source: Int16Array, rate: number) => boolean;
}

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

/** The options of the bank maker (FR 3). */
interface MakeWordBankOptions {
    level: number;
    week: number;
    contentRoot: string;
    bankFolder: string;
    date: string;
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
    main?: (argv: string[]) => number | Promise<number>;
}

/** The options of the word mapper. */
interface SetWordClipsOptions {
    weekFile: string;
    contentRoot: string;
    bankFolder: string;
    check?: boolean;
}

/** The result of the word mapper. */
interface SetWordClipsResult {
    keys: number;
    files: number;
    removed: string[];
    lines: string[];
}

/** The word mapper (FR 4). */
interface SetWordClipsModule {
    setWordClips?: (options: SetWordClipsOptions) => SetWordClipsResult | Promise<SetWordClipsResult>;
}

/** The options of the sentence maker (PIN). */
interface MakeSentenceClipsOptions {
    level: number;
    week: number;
    contentRoot: string;
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

/** The sentence maker (FR 5). */
interface MakeSentenceClipsModule {
    makeSentenceClips?: (options: MakeSentenceClipsOptions) => MakeSentenceClipsResult | Promise<MakeSentenceClipsResult>;
    main?: (argv: string[]) => number | Promise<number>;
}

/** The sentence mapper (FR 6). */
interface SetSentenceClipsModule {
    setSentenceClips?: (options: { weekFile: string; contentRoot: string; check?: boolean }) => unknown;
    main?: (argv: string[]) => number | Promise<number>;
}

/** The row of a check. */
interface CheckRow {
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    detail?: string;
}

/** The script of the week checks (FR 7). */
interface CheckWeeksModule {
    checkPracticeClips?: (week: unknown, contentRoot?: string) => CheckRow | CheckRow[] | undefined;
    checkSentenceClips?: (week: unknown, contentRoot?: string) => CheckRow | undefined;
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
 * after the Clips tasks add those blocks.
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

/** The keys of the blocks that Phase 12 adds to a week file. */
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
 * The map of the clip paths of a list of keys in week 1.
 * @param keys The keys.
 * @returns The map from each key to its K3 path.
 */
function w01Map(keys: string[]): Record<string, string> {
    return Object.fromEntries(keys.map((key) => [key, `l2/media/w01/words/wa-${key}.mp3`]));
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

/** One export of the word module. */
const clips = <K extends keyof WordClipsModule>(name: K): Promise<NonNullable<WordClipsModule[K]>> => exportOf<WordClipsModule, K>(wordClipsModule, name);

/** One export of the sentence module. */
const sentences = <K extends keyof SentenceClipsModule>(name: K): Promise<NonNullable<SentenceClipsModule[K]>> => exportOf<SentenceClipsModule, K>(sentenceClipsModule, name);

/** One export of the bank maker. */
const maker = <K extends keyof MakeWordBankModule>(name: K): Promise<NonNullable<MakeWordBankModule[K]>> => exportOf<MakeWordBankModule, K>(makeWordBankModule, name);

/** One export of the word mapper. */
const mapper = <K extends keyof SetWordClipsModule>(name: K): Promise<NonNullable<SetWordClipsModule[K]>> => exportOf<SetWordClipsModule, K>(setWordClipsModule, name);

/** One export of the sentence maker. */
const sentenceMaker = <K extends keyof MakeSentenceClipsModule>(name: K): Promise<NonNullable<MakeSentenceClipsModule[K]>> => exportOf<MakeSentenceClipsModule, K>(makeSentenceClipsModule, name);

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
 * The lines of one map block as the mapper writes them (L17): the opening line, one line for each
 * key, and the closing line, with no comma after the closing line.
 * @param indent The indent of the key of the block.
 * @param name The key of the block.
 * @param keys The sorted keys of the map.
 * @returns The lines.
 */
function mapBlock(indent: string, name: string, keys: string[]): string[] {
    const map = w01Map(keys);
    return [
        `${indent}"${name}": {`,
        ...keys.map((key, index) => `${indent}  ${JSON.stringify(key)}: ${JSON.stringify(map[key])}${index < keys.length - 1 ? ',' : ''}`),
        `${indent}}`,
    ];
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

/**
 * The samples of an mp3 file, decoded by ffmpeg to 32 kHz mono.
 * @param file The path of the mp3 file.
 * @returns The samples.
 */
function decodeMp3(file: string): Int16Array {
    const wav = path.join(tempFolder('storytime-practice-decode-'), 'decoded.wav');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file, '-ac', '1', '-ar', String(RATE), wav]);
    return readWav(wav).samples;
}

/**
 * Writes samples as an mp3 file of 32 kHz, mono, 128 kb/s.
 * @param samples The samples.
 * @param file The mp3 file to write.
 */
function writeMp3(samples: Int16Array, file: string): void {
    const wav = path.join(tempFolder('storytime-practice-encode-'), 'source.wav');
    fs.writeFileSync(wav, wavBuffer(samples));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', file]);
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
 * @param options `heard` gives the words that the fake hears for a text and a take (default: the words
 * of the text). `pause` says that a take holds a quiet gap above the limit. `span` gives the loud length
 * of a take in samples (default 4000).
 * @returns The fake.
 */
function fakeVoice(options: {
    heard?: (text: string, take: number) => string[];
    pause?: (text: string, take: number) => boolean;
    span?: (text: string, take: number) => number;
} = {}): FakeVoice {
    const calls: FakeCall[] = [];
    const takesOf = new Map<string, number>();
    const heard = options.heard ?? ((text: string): string[] => text.split(' '));
    return {
        calls,
        synthesize: (text, wavFile, voice, speed) => {
            const take = (takesOf.get(text) ?? 0) + 1;
            takesOf.set(text, take);
            const gap = options.pause?.(text, take) ?? false;
            const span = (options.span?.(text, take) ?? 4000) + 16 * calls.length;
            calls.push({ text, take, extent: span + (gap ? PAUSE_SAMPLES : 0), voice, speed });
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
 * The call of the fake voice for a text and a take.
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

/**
 * The number of words in a text.
 * @param text The text.
 * @returns The count of the parts that the spaces split.
 */
function wordCount(text: string): number {
    return text.split(' ').filter(Boolean).length;
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

/** The commit of the Phase 12 facts that the D4 history cases replay (P14 Red retry R1, D-R1-1 option A). */
const PHASE12_COMMIT = 'ddc70618';

/**
 * The start file text of a week at the Phase 12 commit. The D4 cases replay the Phase 12 bank run, which is
 * history: their Phase 12 pins stay, and their week files come from `git show` at that commit, as the loops
 * compares read their baselines.
 * @param week The week number.
 * @returns The text of the week file at that commit.
 */
function phase12Text(week: number): string {
    try {
        return execFileSync('git', ['show', `${PHASE12_COMMIT}:content/storytime/l2/w${weekDigits(week)}.json`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (error) {
        throw new Error(`git show ${PHASE12_COMMIT} of the week ${week} failed: ${(error as Error).message}`);
    }
}

/**
 * A temporary content root with a copy of the start file of each shipped week of level 2.
 * @param prefix The prefix of the folder name.
 * @returns The paths of the tree. The bank folder does not exist yet.
 */
function baseTree(prefix: string, weekText: (week: number) => string = startText): WordTree {
    const folder = tempFolder(prefix);
    const contentRoot = path.join(folder, 'content');
    fs.mkdirSync(path.join(contentRoot, 'l2'), { recursive: true });
    for (let week = 1; week <= 8; week += 1) {
        fs.writeFileSync(path.join(contentRoot, 'l2', `w${weekDigits(week)}.json`), weekText(week));
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
 * The manifest object of the fixture bank, in the order of the shipped bank.
 * @param items The rows.
 * @returns The manifest object.
 */
function manifestObject(items: WordBankRow[]): Record<string, unknown> {
    return {
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
 * The rows of a manifest file.
 * @param file The path of the manifest.
 * @returns The rows, parsed.
 */
function manifestItems(file: string): Record<string, unknown>[] {
    return (JSON.parse(fs.readFileSync(file, 'utf8')) as { items: Record<string, unknown>[] }).items;
}

/**
 * The words of the shipped bank that are not one of the 15 new words, in the order of the shipped bank.
 * The shipped bank has 137 rows before the Clips task and 152 rows after it. Both give 137 words here.
 * @returns The words.
 */
function oldBankWords(): string[] {
    const rows = manifestItems(path.join(STORYTIME_ROOT, 'words/manifest.json')) as unknown as WordBankRow[];
    return rows.map((row) => row.word).filter((word) => !NEW_WORDS.includes(word));
}

/**
 * The tree of the practice maker: all start files of level 2, and a fixture bank of 137 rows in the
 * Python form (the shipped words without the 15 new words). The old rows have no audio file, because
 * the maker never reads them.
 * @returns The tree.
 */
function makerTree(): WordTree {
    const tree = baseTree('storytime-practice-bank-', phase12Text);
    fs.mkdirSync(tree.bankFolder, { recursive: true });
    const words = oldBankWords();
    expect(words, 'the fixture bank holds 137 rows').toHaveLength(137);
    const items = words.map((word, index) => bankRow(index + 1, word, sha256(`old row ${index + 1}`)));
    fs.writeFileSync(tree.manifestFile, pythonManifest(items));
    expect(pythonFormHolds(tree.manifestFile), 'the fixture manifest has the Python form').toBe(true);
    return tree;
}

/**
 * The tree of the word mapper: the start file of week 1, and a bank that holds each of the 30 keys of
 * the week with a WAV file and an mp3 file. The mp3 bytes are fake and differ by word, because the
 * mapper never makes audio.
 * @returns The tree.
 */
function mapperTree(): WordTree {
    const tree = baseTree('storytime-practice-map-');
    fs.mkdirSync(tree.bankFolder, { recursive: true });
    const items = W01_UNION.map((key, index) => {
        const wav = wavBuffer(takeSamples(1000 + index, false));
        fs.writeFileSync(path.join(tree.bankFolder, `wa-${key}.wav`), wav);
        fs.writeFileSync(path.join(tree.bankFolder, `wa-${key}.mp3`), `fake mp3 of ${key}\n`);
        return bankRow(index + 1, key, sha256(wav));
    });
    fs.writeFileSync(tree.manifestFile, `${JSON.stringify(manifestObject(items), null, 1)}\n`);
    return tree;
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

/**
 * A run of the bank maker with the flag `--practice` on a tree.
 * @param tree The tree.
 * @param voice The fake voice.
 * @param week The week.
 * @param extra Options that replace the default options of the run.
 * @returns The value or the error of the run.
 */
async function runMaker(tree: WordTree, voice: FakeVoice, week: number, extra: Partial<MakeWordBankOptions> = {}): Promise<{ value?: MakeWordBankResult; error?: Error }> {
    const makeWordBank = await maker('makeWordBank');
    return await attempt(() => makeWordBank({
        level: 2,
        week,
        contentRoot: tree.contentRoot,
        bankFolder: tree.bankFolder,
        date: DATE,
        maxChars: 150,
        practice: true,
        synthesize: voice.synthesize,
        recognize: voice.recognize,
        ...extra,
    }));
}

/** The seven runs of the bank maker in the order w01 to w07, on one tree and one bank. */
interface SequenceRun {
    tree: WordTree;
    voice: FakeVoice;
    before: string;
    steps: { week: number; before: string; after: string; result: MakeWordBankResult }[];
}

/** The cached sequence. */
let cachedSequence: Promise<SequenceRun> | undefined;

/**
 * The seven runs of the bank maker with `--practice`, with the heard rule always met. Each run gets the
 * rest of the budget of 150 characters (L11).
 * @returns The sequence.
 */
function sequenceRun(): Promise<SequenceRun> {
    cachedSequence ??= (async () => {
        const tree = makerTree();
        const voice = fakeVoice();
        const before = fs.readFileSync(tree.manifestFile, 'utf8');
        const steps: SequenceRun['steps'] = [];
        let spent = 0;
        for (let week = 1; week <= 7; week += 1) {
            const stepBefore = fs.readFileSync(tree.manifestFile, 'utf8');
            const run = await runMaker(tree, voice, week, { maxChars: 150 - spent });
            if (run.error) throw new Error(`the run of week ${week} failed: ${run.error.message}`);
            const result = run.value as MakeWordBankResult;
            spent += result.chars;
            steps.push({ week, before: stepBefore, after: fs.readFileSync(tree.manifestFile, 'utf8'), result });
        }
        return { tree, voice, before, steps };
    })();
    return cachedSequence;
}

/**
 * The new rows of a tree, by word.
 * @param tree The tree.
 * @returns The rows after row 137.
 */
function newRows(tree: WordTree): Record<string, Record<string, unknown>> {
    const rows = manifestItems(tree.manifestFile).slice(137);
    return Object.fromEntries(rows.map((row) => [String(row.word), row]));
}

/**
 * The tree of the sentence maker: all start files of level 2. The tree has no book audio file.
 * @returns The tree.
 */
function sentenceTree(): WordTree {
    return baseTree('storytime-practice-sentences-');
}

/**
 * A run of the sentence maker on week 1.
 * @param tree The tree.
 * @param voice The fake voice.
 * @param extra Options that replace the default options of the run.
 * @returns The value or the error of the run.
 */
async function runSentenceMaker(tree: WordTree, voice: FakeVoice, extra: Partial<MakeSentenceClipsOptions> = {}): Promise<{ value?: MakeSentenceClipsResult; error?: Error }> {
    const makeSentenceClips = await sentenceMaker('makeSentenceClips');
    return await attempt(() => makeSentenceClips({
        level: 2,
        week: 1,
        contentRoot: tree.contentRoot,
        maxChars: 210,
        synthesize: voice.synthesize,
        recognize: voice.recognize,
        ...extra,
    }));
}

/** The span of a fake sentence take: 0.5 s for each word. */
const SENTENCE_SPAN = (text: string): number => 16000 * wordCount(text);

/** The folder of the sentence clips of week 1 in a tree. */
const sentencesFolder = (tree: WordTree): string => path.join(tree.contentRoot, 'l2/media/w01/sentences');

/** The provenance file of the sentence clips of week 1 in a tree. */
const provenanceFile = (tree: WordTree): string => path.join(sentencesFolder(tree), 'manifest.json');

/** The provenance file of the sentence maker (L8). */
interface Provenance {
    voice: string;
    speed: number;
    model: string;
    items: Record<string, unknown>[];
}

/**
 * The provenance file of a tree.
 * @param tree The tree.
 * @returns The parsed file.
 */
function provenanceOf(tree: WordTree): Provenance {
    return JSON.parse(fs.readFileSync(provenanceFile(tree), 'utf8')) as Provenance;
}

/** The run of the sentence maker where every take passes. */
interface SentenceRun {
    tree: WordTree;
    voice: FakeVoice;
    result: MakeSentenceClipsResult;
}

/** The cached base run. */
let cachedSentenceRun: Promise<SentenceRun> | undefined;

/**
 * The base run of the sentence maker: week 1, 8 sentences, one take each, no book mp3, and a missing venv
 * path (the maker does no venv check when `recognize` is given).
 * @returns The run.
 */
function baseSentenceRun(): Promise<SentenceRun> {
    cachedSentenceRun ??= (async () => {
        const tree = sentenceTree();
        const voice = fakeVoice({ span: SENTENCE_SPAN });
        expect(fs.existsSync(path.join(tree.contentRoot, 'l2/media')), 'the tree holds no media folder, so no book mp3').toBe(false);
        const run = await runSentenceMaker(tree, voice, { whisperPython: MISSING_PYTHON });
        if (run.error) throw new Error(`the base run of the sentence maker failed: ${run.error.message}`);
        return { tree, voice, result: run.value as MakeSentenceClipsResult };
    })();
    return cachedSentenceRun;
}

/** The scenario of D10: a retake, three failed takes, a take too short, a take too long, and a bad pause. */
const SENTENCE_SCENARIO = {
    span: (text: string, take: number): number => {
        if (text === 'A nest and a nut.' && take === 1) return 3200;
        if (text === 'A neck.' && take === 1) return 147200;
        return SENTENCE_SPAN(text);
    },
    heard: (text: string, take: number): string[] => {
        if (text === 'A net.' && take === 1) return ['A', 'nut'];
        if (text === 'A nut.') return ['A', 'nut', 'nut'];
        return text.split(' ');
    },
    pause: (text: string, take: number): boolean => text === 'A nurse.' && take === 1,
};

/** The cached scenario run. */
let cachedScenarioRun: Promise<SentenceRun> | undefined;

/**
 * The run of the sentence maker for the scenario of D10.
 * @returns The run.
 */
function scenarioSentenceRun(): Promise<SentenceRun> {
    cachedScenarioRun ??= (async () => {
        const tree = sentenceTree();
        const voice = fakeVoice(SENTENCE_SCENARIO);
        const run = await runSentenceMaker(tree, voice);
        if (run.error) throw new Error(`the scenario run of the sentence maker failed: ${run.error.message}`);
        return { tree, voice, result: run.value as MakeSentenceClipsResult };
    })();
    return cachedScenarioRun;
}

// ---------------------------------------------------------------------------------------------
// The snapshot for the guard of the file
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
        addFolder(path.join(STORYTIME_ROOT, `l2/media/w${weekDigits(week)}/sentences`), () => true);
    }
    return out;
}

/** The stamps of the content files when this file loads. */
const SNAPSHOT_AT_LOAD = contentSnapshot();

// ---------------------------------------------------------------------------------------------
// D1: the schema
// ---------------------------------------------------------------------------------------------

/** The items of the sentence clips of week 1, as the mapper writes them. */
const W01_ITEMS = W01_SENTENCES.map((sentence, index) => ({ sentence, file: W01_SENTENCE_PATHS[index] }));

/**
 * The start week of week 1 with the four new fields.
 * @returns The week object.
 */
function weekWithFields(): RawWeek {
    const raw = startWeek(1);
    (raw.opening as NonNullable<RawWeek['opening']>).wordClips = w01Map(W01_OPENING);
    raw.focus.family.wordClips = w01Map(W01_FAMILY);
    raw.focus.trickyWordClips = w01Map(W01_TRICKY);
    raw.books[1].audio.sentenceClips = W01_ITEMS;
    return raw;
}

describe('D1 the four optional schema fields (L10)', () => {
    it('keeps opening.wordClips, focus.family.wordClips, focus.trickyWordClips, and sentenceClips in the parse output', () => {
        const parsed = StorytimeWeekSchema.parse(weekWithFields()) as unknown as RawWeek;
        expect(parsed.opening?.wordClips, 'opening.wordClips').toEqual(w01Map(W01_OPENING));
        expect(parsed.focus.family.wordClips, 'focus.family.wordClips').toEqual(w01Map(W01_FAMILY));
        expect(parsed.focus.trickyWordClips, 'focus.trickyWordClips').toEqual(w01Map(W01_TRICKY));
        expect(parsed.books[1].audio.sentenceClips, 'books[1].audio.sentenceClips').toEqual(W01_ITEMS);
    });

    it('keeps the fields in the parse output of FocusSchema and BookAudioSchema', () => {
        const raw = weekWithFields();
        const focus = FocusSchema.parse(raw.focus) as unknown as RawWeek['focus'];
        expect(focus.trickyWordClips).toEqual(w01Map(W01_TRICKY));
        expect(focus.family.wordClips).toEqual(w01Map(W01_FAMILY));
        const audio = BookAudioSchema.parse({ sentences: [], sentenceClips: W01_ITEMS }) as unknown as RawWeek['books'][number]['audio'];
        expect(audio.sentenceClips).toEqual(W01_ITEMS);
    });

    it('parses a week without the fields as before, and leaves each field undefined', () => {
        const parsed = StorytimeWeekSchema.parse(startWeek(1)) as unknown as RawWeek;
        expect(parsed.opening?.wordClips).toBeUndefined();
        expect(parsed.focus.family.wordClips).toBeUndefined();
        expect(parsed.focus.trickyWordClips).toBeUndefined();
        expect(parsed.books[1].audio.sentenceClips).toBeUndefined();
    });

    it('refuses an upper-case key and an empty value in each of the three maps', () => {
        expect(StorytimeWeekSchema.safeParse(weekWithFields()).success, 'the start week parses').toBe(true);
        const edits: [string, (raw: RawWeek) => void][] = [
            ['an upper-case key in opening.wordClips', (raw) => { (raw.opening as NonNullable<RawWeek['opening']>).wordClips = { Fan: 'l2/media/w01/words/wa-fan.mp3' }; }],
            ['an empty value in opening.wordClips', (raw) => { (raw.opening as NonNullable<RawWeek['opening']>).wordClips = { fan: '' }; }],
            ['an upper-case key in focus.family.wordClips', (raw) => { raw.focus.family.wordClips = { Boy: 'l2/media/w01/words/wa-boy.mp3' }; }],
            ['an empty value in focus.family.wordClips', (raw) => { raw.focus.family.wordClips = { boy: '' }; }],
            ['an upper-case key in focus.trickyWordClips', (raw) => { raw.focus.trickyWordClips = { A: 'l2/media/w01/words/wa-a.mp3' }; }],
            ['an empty value in focus.trickyWordClips', (raw) => { raw.focus.trickyWordClips = { a: '' }; }],
        ];
        for (const [name, edit] of edits) {
            const raw = weekWithFields();
            edit(raw);
            expect(StorytimeWeekSchema.safeParse(raw).success, name).toBe(false);
        }
    });

    it('refuses a sentence clip item with no file, and an item with an empty file', () => {
        expect(BookAudioSchema.safeParse({ sentences: [], sentenceClips: [{ sentence: 'A nest.', file: 'l2/media/w01/sentences/b1-s01.mp3' }] }).success, 'a good item').toBe(true);
        expect(BookAudioSchema.safeParse({ sentences: [], sentenceClips: [{ sentence: 'A nest.' }] }).success, 'an item with no file').toBe(false);
        expect(BookAudioSchema.safeParse({ sentences: [], sentenceClips: [{ sentence: 'A nest.', file: '' }] }).success, 'an item with an empty file').toBe(false);
    });
});

// ---------------------------------------------------------------------------------------------
// D2: the opening words
// ---------------------------------------------------------------------------------------------

describe('D2 openingWordKeys (L4)', () => {
    /** The expression of L4, written here to count the forms of the shipped data. */
    const FORM = /(?:Listen: |What is the word\? )([A-Za-z]+)[.!]/g;

    it('gives the 10 words of the hand-written table of the shipped w01', async () => {
        const openingWordKeys = await clips('openingWordKeys');
        const keys = openingWordKeys(startWeek(1).opening?.pa ?? []);
        expect([...keys].sort(), 'nose, net, nest, nut, hen, fan, hello, goodbye, pen, sun').toEqual(['fan', 'goodbye', 'hello', 'hen', 'nest', 'net', 'nose', 'nut', 'pen', 'sun']);
        expect(new Set(keys).size, 'each key once').toBe(keys.length);
    });

    it('gives the distinct counts 10, 10, 9, 10, 8, 9, 10 and the hand-written words for w01 to w07', async () => {
        const openingWordKeys = await clips('openingWordKeys');
        const counts: number[] = [];
        for (let week = 1; week <= 7; week += 1) {
            const keys = openingWordKeys(startWeek(week).opening?.pa ?? []);
            expect([...keys].sort(), `the opening words of week ${week}`).toEqual(OPENING_KEYS[week]);
            expect(new Set(keys).size, `week ${week}: each key once`).toBe(keys.length);
            counts.push(keys.length);
        }
        expect(counts).toEqual([10, 10, 9, 10, 8, 9, 10]);
    });

    it('finds 10 word forms in the 5 lines of each shipped week (the data, counted with the expression of L4)', () => {
        for (let week = 1; week <= 7; week += 1) {
            const forms = (startWeek(week).opening?.pa ?? []).flatMap((line) => [...line.en.matchAll(FORM)]);
            expect(forms, `the forms of week ${week}`).toHaveLength(10);
        }
    });

    it('reads both forms and ignores a sound line, a first-sound question, and the case of the word', async () => {
        const openingWordKeys = await clips('openingWordKeys');
        const keys = openingWordKeys([
            { en: '"Listen: nose. What is the first sound? Nnn! Listen: Sun. What is the last sound? Nnn!"' },
            { en: '"Listen: nnn - /e/ - /t/. What is the word? Net! Listen: /p/ - /e/ - nnn. What is the word? PEN!"' },
        ]);
        expect([...keys].sort()).toEqual(['net', 'nose', 'pen', 'sun']);
    });

    it('throws "opening: no word form in line <i>" with i from 0 for a line with no form', async () => {
        const openingWordKeys = await clips('openingWordKeys');
        const lines = [
            { en: '"Listen: nose. What is the first sound? Nnn!"', th: 'x' },
            { en: '"Listen: sun. What is the last sound? Nnn!"', th: 'x' },
            { en: '"Listen: nnn - /e/ - /t/. Say the sounds."', th: 'x' },
            { en: '"Listen: net. What is the word? Net!"', th: 'x' },
            { en: '"Listen: pen. What is the word? Pen!"', th: 'x' },
        ];
        const error = thrownBy(() => openingWordKeys(lines));
        expect(error, 'the call throws').toBeInstanceOf(Error);
        expect(error?.message).toBe('opening: no word form in line 2');
    });

    it('never reads the th text: a change of th, and a th that throws when it is read, give the same keys', async () => {
        const openingWordKeys = await clips('openingWordKeys');
        const pa = startWeek(1).opening?.pa ?? [];
        const expected = openingWordKeys(pa);
        const thai = pa.map((line) => ({ en: line.en, th: 'ภาษาไทย ฟัง: sun. What is the word? Pen!' }));
        expect(openingWordKeys(thai), 'a changed th').toEqual(expected);
        const guarded = pa.map((line) => new Proxy({ en: line.en }, {
            get: (target, property) => {
                if (property === 'th') throw new Error('the th text was read');
                return Reflect.get(target, property);
            },
        }));
        expect(openingWordKeys(guarded), 'a th that throws').toEqual(expected);
    });
});

// ---------------------------------------------------------------------------------------------
// D3: the practice keys and the counts
// ---------------------------------------------------------------------------------------------

describe('D3 practiceWordKeys, planPracticeClips, and the counts of the Facts section (L2, L3, L5)', () => {
    it('gives the three lists of each shipped week, sorted by code point, with the hand-written words', async () => {
        const practiceWordKeys = await clips('practiceWordKeys');
        for (let week = 1; week <= 7; week += 1) {
            const keys = practiceWordKeys(startWeek(week));
            expect(keys.opening, `the opening words of week ${week}`).toEqual(OPENING_KEYS[week]);
            expect(keys.family, `the family words of week ${week}`).toEqual(FAMILY_KEYS[week]);
            expect(keys.tricky, `the tricky words of week ${week}`).toEqual(TRICKY_KEYS[week]);
        }
    });

    it('counts 66 opening words, 51 family words, and 19 tricky words: 136 word slots', async () => {
        const practiceWordKeys = await clips('practiceWordKeys');
        let opening = 0;
        let family = 0;
        let tricky = 0;
        for (let week = 1; week <= 7; week += 1) {
            const keys = practiceWordKeys(startWeek(week));
            opening += keys.opening.length;
            family += keys.family.length;
            tricky += keys.tricky.length;
        }
        expect([opening, family, tricky]).toEqual([66, 51, 19]);
        expect(opening + family + tricky).toBe(136);
    });

    it('finds 56 gap slots (43, 8, and 5) and 45 gap words: the 32 with a bank row and the 15 new words', async () => {
        const practiceWordKeys = await clips('practiceWordKeys');
        const bookWordKeys = await clips('bookWordKeys');
        const slots = { opening: 0, family: 0, tricky: 0 };
        const gap = new Set<string>();
        for (let week = 1; week <= 7; week += 1) {
            const raw = startWeek(week);
            const book = new Set(raw.books.flatMap((entry) => bookWordKeys(entry.audio)));
            const keys = practiceWordKeys(raw);
            for (const list of ['opening', 'family', 'tricky'] as const) {
                for (const key of keys[list]) {
                    if (book.has(key)) continue;
                    slots[list] += 1;
                    gap.add(key);
                }
            }
        }
        expect(slots).toEqual({ opening: 43, family: 8, tricky: 5 });
        expect([...gap].sort(), 'the 45 gap words').toEqual([...GAP_WITH_ROW, ...NEW_WORDS, ...P14_GAP_IN].filter((word) => !P14_GAP_OUT.includes(word)).sort());
        expect(gap.size).toBe(45);
        const rows = new Set((manifestItems(path.join(STORYTIME_ROOT, 'words/manifest.json')) as unknown as WordBankRow[]).map((row) => row.word));
        expect(GAP_WITH_ROW.filter((word) => !rows.has(word)), 'each of the 32 words has a bank row').toEqual([]);
    });

    it('plans the three maps and the sorted distinct files of the shipped w01', async () => {
        const planPracticeClips = await clips('planPracticeClips');
        const raw = startWeek(1);
        const plan = planPracticeClips({ level: 2, week: 1, opening: raw.opening, focus: raw.focus });
        expect(plan.opening).toEqual(w01Map(W01_OPENING));
        expect(plan.family).toEqual(w01Map(W01_FAMILY));
        expect(plan.tricky).toEqual(w01Map(W01_TRICKY));
        expect(Object.keys(plan.opening), 'the keys are sorted by code point').toEqual(W01_OPENING);
        const expected = [...new Set([...W01_OPENING, ...W01_FAMILY, ...W01_TRICKY])].map((key) => `l2/media/w01/words/wa-${key}.mp3`).sort();
        expect(plan.files).toEqual(expected);
        expect(plan.files).toHaveLength(17);
    });

    it('serves two maps with one file, and plans an empty map for an absent list', async () => {
        const planPracticeClips = await clips('planPracticeClips');
        const plan = planPracticeClips({
            level: 2,
            week: 1,
            opening: { pa: [{ en: '"Listen: sun. What is the word? Net!"' }] },
            focus: { trickyWords: ['a', 'and'], family: { words: [{ word: 'Sun' }, { word: 'hello' }] } },
        });
        expect(plan.opening).toEqual(w01Map(['net', 'sun']));
        expect(plan.family).toEqual(w01Map(['hello', 'sun']));
        expect(plan.tricky).toEqual(w01Map(['a', 'and']));
        expect(plan.files, 'sun has one file').toEqual(['a', 'and', 'hello', 'net', 'sun'].map((key) => `l2/media/w01/words/wa-${key}.mp3`));
        const none = planPracticeClips({ level: 2, week: 1, focus: { trickyWords: [], family: { words: [] } } });
        expect([none.opening, none.family, none.tricky, none.files]).toEqual([{}, {}, {}, []]);
    });

    it('throws "two keys, one file" for the keys its and it\'s in one week', async () => {
        const planPracticeClips = await clips('planPracticeClips');
        const error = thrownBy(() => planPracticeClips({
            level: 2,
            week: 1,
            focus: { trickyWords: ['its'], family: { words: [{ word: "it's" }] } },
        }));
        expect(error, 'planPracticeClips throws').toBeInstanceOf(Error);
        expect(error?.message).toContain('two keys, one file');
        expect(error?.message).toContain('its');
        expect(error?.message).toContain("it's");
    });

    it('gives the union of the book files and the practice files: 30, 38, 27, 31, 33, 27, and 32 (218)', async () => {
        const planPracticeClips = await clips('planPracticeClips');
        const planWordClips = await clips('planWordClips');
        let total = 0;
        for (let week = 1; week <= 7; week += 1) {
            const raw = startWeek(week);
            const books = planWordClips({ level: 2, week, books: raw.books.map((book) => ({ audio: book.audio })) });
            const practice = planPracticeClips({ level: 2, week, opening: raw.opening, focus: raw.focus });
            const union = new Set([...books.files, ...practice.files]);
            expect(union.size, `the files of week ${week}`).toBe(UNION_FILES[week]);
            total += union.size;
        }
        expect(total).toBe(218);
        expect(W01_UNION, 'the hand-written keys of week 1').toHaveLength(30);
    });
});

// ---------------------------------------------------------------------------------------------
// D4: the word maker with --practice
// ---------------------------------------------------------------------------------------------

describe('D4 the word maker with --practice (L6)', () => {
    it('lists the new words of each week in a dry run, prints "chars: <n>" for one take, and writes nothing', async () => {
        const tree = makerTree();
        const voice = fakeVoice();
        const hashes = treeHashes(tree.bankFolder);
        const order: string[] = [];
        let chars = 0;
        for (let week = 1; week <= 7; week += 1) {
            const run = await runMaker(tree, voice, week, { dryRun: true });
            expect(run.error?.message, `the dry run of week ${week}`).toBeUndefined();
            const result = run.value as MakeWordBankResult;
            expect(result.made, `week ${week}: a dry run makes nothing`).toEqual([]);
            const listed = result.lines.filter((line) => line.includes('\t'));
            expect(listed, `week ${week}: the listed words and their texts`).toEqual(DRY_BY_WEEK[week].map(([key, text]) => `${key}\t${text}`));
            expect(result.lines, `week ${week}: the line with the characters of one take`).toContain(`chars: ${DRY_CHARS[week - 1]}`);
            expect(result.chars).toBe(DRY_CHARS[week - 1]);
            for (const [key] of DRY_BY_WEEK[week]) if (!order.includes(key)) order.push(key);
            chars += MADE_CHARS[week - 1];
        }
        expect(order, 'the 15 words in the order of the runs').toEqual(['fan', 'hen', 'cap', 'arm', 'ham', 'jam', 'mop', 'dress', 'sad', 'sit', 'put', 'from', 'hop', 'hot', 'up']);
        expect(chars, 'the characters of one take of the 15 words').toBe(47);
        expect(voice.calls, 'no call is made').toHaveLength(0);
        expect(treeHashes(tree.bankFolder), 'nothing is written').toEqual(hashes);
    }, 120_000);

    it('makes only the book words without the flag, and the 15 words with it (week 3: cap)', async () => {
        const tree = makerTree();
        const voice = fakeVoice();
        const plain = await runMaker(tree, voice, 3, { practice: undefined });
        expect(plain.error?.message, 'the run without the flag').toBeUndefined();
        expect(plain.value?.made, 'every book word of week 3 has a row').toEqual([]);
        expect(voice.calls).toHaveLength(0);
        const practice = await runMaker(tree, voice, 3);
        expect(practice.error?.message, 'the run with the flag').toBeUndefined();
        expect(practice.value?.made).toEqual(['wa-cap']);
        expect(voice.calls.map((call) => call.text)).toEqual(['Cap']);
    }, 120_000);

    it('makes the 15 words in the order of the runs and sends no text for a word that has a row', async () => {
        const run = await sequenceRun();
        for (const step of run.steps) {
            expect(step.result.made, `week ${step.week}: the made words`).toEqual(MADE_BY_WEEK[step.week].map(([key]) => `wa-${key}`));
            expect(step.result.chars, `week ${step.week}: the characters`).toBe(MADE_CHARS[step.week - 1]);
        }
        const texts = run.voice.calls.map((call) => call.text);
        expect(texts, 'one take of each word: its K8 text, in the order of the runs').toEqual(Object.values(MADE_BY_WEEK).flat().map(([, text]) => text));
        expect(texts).toHaveLength(15);
        expect(run.steps.reduce((sum, step) => sum + step.result.chars, 0), 'the characters of the 7 runs: 47 in all').toBe(47);
        expect(run.voice.calls.reduce((sum, call) => sum + call.text.length, 0)).toBe(47);
    }, 120_000);

    it('adds 15 rows from n 138 to 152 in the K6 and L6 form and leaves the 137 old rows as they are', async () => {
        const run = await sequenceRun();
        const all = manifestItems(run.tree.manifestFile);
        expect(all).toHaveLength(152);
        expect(all.map((row) => row.n), 'n continues from 138, with no gap').toEqual(Array.from({ length: 152 }, (_, index) => index + 1));
        expect(all.slice(0, 137), 'the 137 old rows are as they were').toEqual((JSON.parse(run.before) as { items: unknown[] }).items);
        const rows = newRows(run.tree);
        const order = Object.values(MADE_BY_WEEK).flat().map(([key]) => key);
        expect(Object.keys(rows)).toEqual(order);
        order.forEach((key, index) => {
            const row = rows[key];
            const facts = ROW_FACTS[key];
            const text = Object.values(MADE_BY_WEEK).flat().find(([word]) => word === key)?.[1] as string;
            const call = callOf(run.voice, text, 1);
            const wav = path.join(run.tree.bankFolder, `wa-${key}.wav`);
            expect(Object.keys(row), `${key}: the keys of the row, in the order of K6`).toEqual([...ROW_KEYS, ...(facts.text ? ['text'] : []), 'added']);
            expect(row.n).toBe(138 + index);
            expect(row.id).toBe(`wa-${key}`);
            expect(row.word).toBe(key);
            expect(row.file).toBe(`wa-${key}.wav`);
            expect(row.mp3).toBe(`wa-${key}.mp3`);
            expect(row.sources, `${key}: the sources`).toBe(facts.sources);
            expect(row.weeks, `${key}: the weeks`).toBe(facts.weeks);
            expect(row.take).toBe(1);
            expect(row.len_s).toBe(Math.round(((call.extent + 2 * EDGE) / RATE) * 1000) / 1000);
            expect(row.peak_dbfs).toBe(-3);
            expect(row.recognized).toBe(key);
            expect(row.note).toBe('');
            expect(row.sha256, `${key}: the WAV hash`).toBe(fileHash(wav));
            expect(row.added).toBe(DATE);
            if (facts.text) expect(row.text, `${key}: the text sent`).toBe(facts.text);
        });
    }, 120_000);

    it('writes a WAV of 32 kHz, mono, 16 bits with the peak 23197 and an mp3 of 32 kHz, mono, 128 kb/s for each new word', async () => {
        const run = await sequenceRun();
        for (const [key, text] of Object.values(MADE_BY_WEEK).flat()) {
            const wav = readWav(path.join(run.tree.bankFolder, `wa-${key}.wav`));
            const call = callOf(run.voice, text, 1);
            expect([wav.rate, wav.channels, wav.bits], `${key}: rate, channels, bits`).toEqual([RATE, 1, 16]);
            expect(peakOf(wav.samples), `${key}: peak`).toBe(PEAK);
            expect(wav.samples.length, `${key}: the loud part plus 2 x 2560 samples`).toBe(call.extent + 2 * EDGE);
            expect(peakOf(wav.samples.subarray(0, EDGE)), `${key}: the start edge is quiet`).toBeLessThanOrEqual(103);
            expect(peakOf(wav.samples.subarray(wav.samples.length - EDGE)), `${key}: the end edge is quiet`).toBeLessThanOrEqual(103);
            expect(probeAudio(path.join(run.tree.bankFolder, `wa-${key}.mp3`)), `${key}: the mp3 stream`).toEqual({ sampleRate: RATE, channels: 1, bitRate: 128000 });
        }
        const files = fs.readdirSync(run.tree.bankFolder).sort();
        expect(files, 'the manifest and 2 files for each new word, and no take file').toEqual(['manifest.json', ...NEW_WORDS.flatMap((key) => [`wa-${key}.mp3`, `wa-${key}.wav`])].sort());
    }, 120_000);

    it('adds the rows by text edits in the Python form: one comma line changes in each run, the top fields stay', async () => {
        const run = await sequenceRun();
        for (const step of run.steps) {
            if (!step.result.made.length) expect(step.after, `week ${step.week}: no row, no change`).toBe(step.before);
            else expectAppendOnly(step.before, step.after, step.result.made.length);
        }
        const last = run.steps[run.steps.length - 1].after;
        expect(pythonFormHolds(run.tree.manifestFile), 'the Python form test of K6').toBe(true);
        expect((last.match(/"peak_dbfs": -3\.0,/g) ?? []).length, 'each row keeps the text -3.0').toBe(152);
        const { items: oldItems, ...oldTop } = JSON.parse(run.before) as Record<string, unknown>;
        const { items: newItems, ...newTop } = JSON.parse(last) as Record<string, unknown>;
        expect(newTop, 'the top-level fields do not change').toEqual(oldTop);
        expect((newItems as unknown[]).length - (oldItems as unknown[]).length).toBe(15);
    }, 120_000);

    it('applies the heard rule, the retake, and the 3-take note to a practice word, and counts every character', async () => {
        const tree = makerTree();
        const voice = fakeVoice({
            heard: (text, take) => {
                if (text === 'Sad' && take === 1) return ['sat'];
                if (text === 'dress') return ['dresses'];
                return [text];
            },
        });
        const run = await runMaker(tree, voice, 5);
        expect(run.error?.message, 'the run').toBeUndefined();
        const rows = newRows(tree);
        expect(rows.sad.take, 'sad: take 1 was heard as "sat"').toBe(2);
        expect(rows.sad.note).toBe('');
        expect(rows.dress.take).toBe(3);
        expect(rows.dress.recognized).toBe('dresses');
        expect(rows.dress.note).toBe("heard 'dresses' in 3 takes");
        expect(rows.sit.take).toBe(1);
        expect(voice.calls.map((call) => call.text)).toEqual(['dress', 'dress', 'dress', 'Sad', 'Sad', 'Sit']);
        expect(run.value?.chars, 'the characters of all takes').toBe(24);
    }, 120_000);

    it('stops before the first call when one take of each word needs more than maxChars, and changes no row', async () => {
        const tree = makerTree();
        const voice = fakeVoice();
        const hashes = treeHashes(tree.bankFolder);
        const run = await runMaker(tree, voice, 5, { maxChars: 10 });
        expect(run.error, 'the maker throws').toBeInstanceOf(Error);
        expect(run.error?.message).toMatch(/char/i);
        expect(voice.calls, 'no call is made').toHaveLength(0);
        expect(treeHashes(tree.bankFolder), 'no row and no file changes').toEqual(hashes);
    }, 120_000);

    it('stops before the call that would take the run above maxChars, and keeps the rows of the finished words', async () => {
        const tree = makerTree();
        // The 3 takes of "dress" send 15 characters. The take of "Sad" (3) would make 18.
        const voice = fakeVoice({ heard: (text) => (text === 'dress' ? ['dresses'] : [text]) });
        const run = await runMaker(tree, voice, 5, { maxChars: 15 });
        expect(run.error, 'the maker throws before the call for "Sad"').toBeInstanceOf(Error);
        expect(run.error?.message).toMatch(/char/i);
        expect(voice.calls.map((call) => call.text)).toEqual(['dress', 'dress', 'dress']);
        expect(Object.keys(newRows(tree)), 'dress has a row, and sad and sit have none').toEqual(['dress']);
        expect(pythonFormHolds(tree.manifestFile)).toBe(true);
    }, 120_000);

    it('throws "no faster-whisper venv at <path>" before the first call when recognize is absent', async () => {
        const tree = makerTree();
        const voice = fakeVoice();
        const hashes = treeHashes(tree.bankFolder);
        const dry = await runMaker(tree, voice, 5, { dryRun: true });
        expect((dry.value?.lines ?? []).filter((line) => line.includes('\t')), 'week 5 has 3 words to make with the flag').toEqual(['dress\tdress', 'sad\tSad', 'sit\tSit']);
        const run = await runMaker(tree, voice, 5, { recognize: undefined, whisperPython: MISSING_PYTHON });
        expect(run.error, 'the maker throws').toBeInstanceOf(Error);
        expect(run.error?.message).toBe(`word bank: no faster-whisper venv at ${MISSING_PYTHON}`);
        expect(voice.calls, 'no synthesize call').toHaveLength(0);
        expect(treeHashes(tree.bankFolder), 'nothing is written').toEqual(hashes);
    }, 120_000);

    it('names the flag --practice in its usage', async () => {
        const main = await maker('main');
        const help = await captureOutput(() => main(['--help']));
        expect(help.value).toBe(0);
        expect(help.out.join('\n')).toContain('--practice');
        expect(help.out.join('\n')).toContain('--max-chars');
    });
});

// ---------------------------------------------------------------------------------------------
// D5, D6: the word mapper
// ---------------------------------------------------------------------------------------------

describe('D5 the word mapper with the three new maps on a copy of w01 (L5, L17)', () => {
    it('writes the three new maps and the book maps in the L17 form, copies 30 clips, and changes only closing lines', async () => {
        const setWordClips = await mapper('setWordClips');
        const tree = mapperTree();
        const wordsFolder = path.join(tree.contentRoot, 'l2/media/w01/words');
        const before = fs.readFileSync(tree.weekFile, 'utf8');

        const run = await attempt(() => setWordClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder }));
        expect(run.error?.message, 'the mapper runs').toBeUndefined();
        const result = run.value as SetWordClipsResult;
        expect(result.files, 'the distinct clip files of the week').toBe(30);
        expect(result.removed).toEqual([]);

        const expectedFiles = W01_UNION.map((key) => `wa-${key}.mp3`).sort();
        expect(fs.readdirSync(wordsFolder).filter((name) => /^wa-.*\.mp3$/.test(name)).sort(), 'the 30 clips of the week').toEqual(expectedFiles);
        for (const name of expectedFiles) {
            expect(fileHash(path.join(wordsFolder, name)), `${name} equals its bank mp3`).toBe(fileHash(path.join(tree.bankFolder, name)));
        }

        const after = fs.readFileSync(tree.weekFile, 'utf8');
        const week = JSON.parse(after) as RawWeek;
        expect(week.opening?.wordClips).toEqual(w01Map(W01_OPENING));
        expect(week.focus.family.wordClips).toEqual(w01Map(W01_FAMILY));
        expect(week.focus.trickyWordClips).toEqual(w01Map(W01_TRICKY));
        expect(week.books.map((book) => book.audio.wordClips)).toEqual([w01Map(W01_BOOK0), w01Map(W01_BOOK1)]);
        expect(() => StorytimeWeekSchema.parse(week), 'the new week parses').not.toThrow();

        const diff = insertionDiff(before.split('\n'), after.split('\n'));
        expect(diff.changed, 'the closing line before each new block gains a comma').toEqual([
            ['      ]', '      ],'],
            ['    "wordWall": []', '    "wordWall": [],'],
            ['    ]', '    ],'],
            ['        ]', '        ],'],
            ['        ]', '        ],'],
        ]);
        expect(diff.added).toHaveLength(52);
        expect(diff.added, 'the blocks in document order: family, tricky, opening, book 0, book 1').toEqual([
            ...mapBlock('      ', 'wordClips', W01_FAMILY),
            ...mapBlock('    ', 'trickyWordClips', W01_TRICKY),
            ...mapBlock('    ', 'wordClips', W01_OPENING),
            ...mapBlock('        ', 'wordClips', W01_BOOK0),
            ...mapBlock('        ', 'wordClips', W01_BOOK1),
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

    it('removes a stale clip and a file that is not a clip stays, and keeps each practice clip that no book names', async () => {
        const setWordClips = await mapper('setWordClips');
        const tree = mapperTree();
        const options = { weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder };
        const wordsFolder = path.join(tree.contentRoot, 'l2/media/w01/words');
        fs.mkdirSync(wordsFolder, { recursive: true });
        fs.writeFileSync(path.join(wordsFolder, 'wa-zebra.mp3'), 'stale clip\n');
        fs.writeFileSync(path.join(wordsFolder, 'notes.txt'), 'not a clip\n');
        const run = await attempt(() => setWordClips(options));
        expect(run.error?.message, 'the run').toBeUndefined();
        expect(run.value?.removed.map((file) => path.basename(file)), 'only the stale clip goes').toEqual(['wa-zebra.mp3']);
        expect(fs.existsSync(path.join(wordsFolder, 'notes.txt')), 'a file that is not a clip stays').toBe(true);
        for (const key of ['fan', 'hen', 'sun', 'boy', 'girl', 'friend', 'goodbye']) {
            const clip = path.join(wordsFolder, `wa-${key}.mp3`);
            expect(fs.existsSync(clip), `the practice clip of ${key} stays`).toBe(true);
            expect(fileHash(clip)).toBe(fileHash(path.join(tree.bankFolder, `wa-${key}.mp3`)));
        }
        const second = await attempt(() => setWordClips(options));
        expect(second.error?.message, 'a second run').toBeUndefined();
        expect(second.value?.removed, 'a practice clip is not stale').toEqual([]);
        expect(second.value?.files).toBe(30);
    }, 60_000);

    it('prints one tab line for each key of each map with --check and writes nothing', async () => {
        const setWordClips = await mapper('setWordClips');
        const tree = mapperTree();
        const hashes = treeHashes(tree.folder);
        const run = await attempt(() => setWordClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder, check: true }));
        expect(run.error?.message, 'the check runs').toBeUndefined();
        const rows = (run.value as SetWordClipsResult).lines.map((line) => line.split('\t'));
        expect(rows, 'one line for each key: 12 + 11 book keys, 10 opening, 6 family, and 3 tricky').toHaveLength(42);
        for (const row of rows) {
            expect(row, row.join(' | ')).toHaveLength(4);
            expect(row[3], row.join(' | ')).toBe('ok');
        }
        expect(rows.map((row) => row[1]).sort(), 'each key of each map').toEqual([...W01_BOOK0, ...W01_BOOK1, ...W01_OPENING, ...W01_FAMILY, ...W01_TRICKY].sort());
        expect(treeHashes(tree.folder), 'the check writes nothing').toEqual(hashes);
    }, 60_000);
});

describe('D6 the word mapper stops before any write for a practice word (L5, K5)', () => {
    const faults: { name: string; key: string; token: string; fault: (tree: WordTree) => void }[] = [
        {
            name: 'a practice word with no bank row',
            key: 'fan',
            token: 'no bank row',
            fault: (tree) => removeBankRow(tree, 'fan'),
        },
        {
            name: 'a practice word with no bank mp3 file',
            key: 'hen',
            token: 'no bank file',
            fault: (tree) => fs.rmSync(path.join(tree.bankFolder, 'wa-hen.mp3')),
        },
        {
            name: 'a practice word whose WAV SHA-256 differs from its row',
            key: 'sun',
            token: 'bank SHA-256 differs',
            fault: (tree) => fs.appendFileSync(path.join(tree.bankFolder, 'wa-sun.wav'), 'x'),
        },
    ];

    for (const { name, key, token, fault } of faults) {
        it(`stops for ${name} with "${token}" and changes no file`, async () => {
            const setWordClips = await mapper('setWordClips');
            const tree = mapperTree();
            fault(tree);
            const listing = entryListing(tree.folder);
            const hashes = treeHashes(tree.folder);
            const run = await attempt(() => setWordClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot, bankFolder: tree.bankFolder }));
            expect(run.error, 'the mapper throws').toBeInstanceOf(Error);
            expect(run.error?.message).toContain(token);
            expect(run.error?.message).toContain(key);
            expect(entryListing(tree.folder), 'no clip is copied, and no folder appears').toEqual(listing);
            expect(treeHashes(tree.folder), 'no file changes, and no file appears').toEqual(hashes);
        }, 60_000);
    }
});

// ---------------------------------------------------------------------------------------------
// D7: checkPracticeClips
// ---------------------------------------------------------------------------------------------

/** The tree of the practice check cases: week 1 with the five maps and the 30 clips, written by the test. */
interface MappedTree extends WordTree {
    raw: RawWeek;
}

/**
 * A mapped copy of w01, built by the test and not by the mapper: the five maps are in the week object,
 * the 30 clips are byte copies of the bank mp3 files, and the bank rows hold the WAV hash.
 * @returns The tree.
 */
function mappedTree(): MappedTree {
    const tree = mapperTree();
    const wordsFolder = path.join(tree.contentRoot, 'l2/media/w01/words');
    fs.mkdirSync(wordsFolder, { recursive: true });
    for (const key of W01_UNION) fs.copyFileSync(path.join(tree.bankFolder, `wa-${key}.mp3`), path.join(wordsFolder, `wa-${key}.mp3`));
    const raw = startWeek(1);
    raw.books[0].audio.wordClips = w01Map(W01_BOOK0);
    raw.books[1].audio.wordClips = w01Map(W01_BOOK1);
    (raw.opening as NonNullable<RawWeek['opening']>).wordClips = w01Map(W01_OPENING);
    raw.focus.family.wordClips = w01Map(W01_FAMILY);
    raw.focus.trickyWordClips = w01Map(W01_TRICKY);
    fs.writeFileSync(tree.weekFile, JSON.stringify(raw, null, 2));
    return { ...tree, raw };
}

/**
 * The row of the practice check for a mapped tree.
 * @param tree The tree.
 * @returns The row, which the check reads from the parsed week as the CLI does.
 */
async function practiceRowOf(tree: MappedTree): Promise<CheckRow | undefined> {
    const checkPracticeClips = await checks('checkPracticeClips');
    const row = checkPracticeClips(StorytimeWeekSchema.parse(tree.raw), tree.contentRoot);
    return Array.isArray(row) ? row[0] : row;
}

/**
 * The keys of the detail "no clip: ...".
 * @param detail The detail of a row.
 * @returns The keys, sorted.
 */
function noClipKeys(detail: string | undefined): string[] {
    expect(detail, 'the detail starts with "no clip: "').toMatch(/^no clip: /);
    return (detail ?? '').slice('no clip: '.length).split(/[,\s]+/).filter(Boolean).sort();
}

/**
 * Adds a key to the opening map that no opening word gives, with a clip and a bank row that are right.
 * @param tree The tree.
 */
function addNonPracticeWord(tree: MappedTree): void {
    const wav = wavBuffer(takeSamples(1500, false));
    fs.writeFileSync(path.join(tree.bankFolder, 'wa-zebra.wav'), wav);
    fs.writeFileSync(path.join(tree.bankFolder, 'wa-zebra.mp3'), 'fake mp3 of zebra\n');
    const manifest = JSON.parse(fs.readFileSync(tree.manifestFile, 'utf8')) as { items: WordBankRow[] };
    manifest.items.push(bankRow(31, 'zebra', sha256(wav)));
    fs.writeFileSync(tree.manifestFile, `${JSON.stringify(manifest, null, 1)}\n`);
    fs.copyFileSync(path.join(tree.bankFolder, 'wa-zebra.mp3'), path.join(tree.contentRoot, 'l2/media/w01/words/wa-zebra.mp3'));
    (tree.raw.opening?.wordClips as Record<string, string>).zebra = 'l2/media/w01/words/wa-zebra.mp3';
}

/**
 * Gives the family key `boy` a value that is not its K3 path, with a clip that is right otherwise.
 * @param tree The tree.
 */
function addBadPractisePath(tree: MappedTree): void {
    fs.copyFileSync(path.join(tree.bankFolder, 'wa-boy.mp3'), path.join(tree.contentRoot, 'l2/media/w01/words/wa-boy-copy.mp3'));
    (tree.raw.focus.family.wordClips as Record<string, string>).boy = 'l2/media/w01/words/wa-boy-copy.mp3';
}

describe('D7 checkPracticeClips (L9)', () => {
    it('gives the exact id and label, and pass with no detail on the mapped copy', async () => {
        const row = await practiceRowOf(mappedTree());
        expect(row).toEqual({ id: 'practice-clips', label: PRACTICE_CLIPS_LABEL, status: 'pass' });
        expect(row?.detail).toBeUndefined();
    });

    it('warns "no clip: <keys>" for a key that its map lacks, and for a list that has no map', async () => {
        const one = mappedTree();
        delete one.raw.opening?.wordClips?.nose;
        const oneRow = await practiceRowOf(one);
        expect(oneRow?.status).toBe('warn');
        expect(oneRow?.id).toBe('practice-clips');
        expect(oneRow?.label).toBe(PRACTICE_CLIPS_LABEL);
        expect(noClipKeys(oneRow?.detail)).toEqual(['nose']);

        const three = mappedTree();
        delete three.raw.opening?.wordClips?.fan;
        delete three.raw.focus.family.wordClips?.girl;
        delete three.raw.focus.trickyWordClips?.can;
        expect(noClipKeys((await practiceRowOf(three))?.detail)).toEqual(['can', 'fan', 'girl']);

        const noMap = mappedTree();
        delete noMap.raw.opening?.wordClips;
        const noMapRow = await practiceRowOf(noMap);
        expect(noMapRow?.status).toBe('warn');
        expect(noClipKeys(noMapRow?.detail), 'each of the 8 opening words').toEqual(W01_OPENING);
    });

    it('warns for a practice word that only a book map names', async () => {
        const tree = mappedTree();
        delete tree.raw.focus.family.wordClips?.hello;
        expect(tree.raw.books[0].audio.wordClips?.hello, 'the book map names hello').toBeDefined();
        const row = await practiceRowOf(tree);
        expect(row?.status).toBe('warn');
        expect(noClipKeys(row?.detail)).toEqual(['hello']);
    });

    it('fails with "missing: <path>" when a clip file is absent', async () => {
        const tree = mappedTree();
        fs.rmSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-fan.mp3'));
        expect(await practiceRowOf(tree)).toEqual({ id: 'practice-clips', label: PRACTICE_CLIPS_LABEL, status: 'fail', detail: 'missing: l2/media/w01/words/wa-fan.mp3' });
    });

    it('fails with "differs from bank: <path>" when a clip differs from the bank mp3', async () => {
        const tree = mappedTree();
        fs.appendFileSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-hen.mp3'), 'x');
        const row = await practiceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('differs from bank: l2/media/w01/words/wa-hen.mp3');
    });

    it('fails with "no bank file: <key>" when the bank mp3 is absent and the week clip exists', async () => {
        const tree = mappedTree();
        fs.rmSync(path.join(tree.bankFolder, 'wa-pen.mp3'));
        const row = await practiceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('no bank file: pen');
    });

    it('fails with "no bank row: <key>" when a key has no bank row', async () => {
        const tree = mappedTree();
        removeBankRow(tree, 'sun');
        const row = await practiceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('no bank row: sun');
    });

    it('fails with "not a practice word: <key>" for a key that no word of its list gives', async () => {
        const tree = mappedTree();
        addNonPracticeWord(tree);
        const row = await practiceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('not a practice word: zebra');
    });

    it('fails with "bad path: <path>" for a value that is not the K3 path of its key', async () => {
        const tree = mappedTree();
        addBadPractisePath(tree);
        const row = await practiceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('bad path: l2/media/w01/words/wa-boy-copy.mp3');
    });

    it('joins the six fail parts in the order of L9 with "; "', async () => {
        const tree = mappedTree();
        fs.rmSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-fan.mp3'));
        fs.appendFileSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-hen.mp3'), 'x');
        fs.rmSync(path.join(tree.bankFolder, 'wa-pen.mp3'));
        removeBankRow(tree, 'sun');
        addNonPracticeWord(tree);
        addBadPractisePath(tree);
        const row = await practiceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe([
            'missing: l2/media/w01/words/wa-fan.mp3',
            'differs from bank: l2/media/w01/words/wa-hen.mp3',
            'no bank file: pen',
            'no bank row: sun',
            'not a practice word: zebra',
            'bad path: l2/media/w01/words/wa-boy-copy.mp3',
        ].join('; '));
    });

    it('lets a fail win over a warn, and the detail of the fail holds no warn part', async () => {
        const tree = mappedTree();
        delete tree.raw.focus.trickyWordClips?.can;
        fs.rmSync(path.join(tree.contentRoot, 'l2/media/w01/words/wa-fan.mp3'));
        const row = await practiceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('missing: l2/media/w01/words/wa-fan.mp3');
    });

    it('gives no row for a week with no meta and for a week with no book (the review week w08)', async () => {
        const checkPracticeClips = await checks('checkPracticeClips');
        const tree = mappedTree();
        const parsed = StorytimeWeekSchema.parse(tree.raw);
        expect(checkPracticeClips({ ...parsed, meta: undefined }, tree.contentRoot), 'no meta').toBeUndefined();
        expect(checkPracticeClips({ ...parsed, books: [] }, tree.contentRoot), 'no book').toBeUndefined();
        expect(checkPracticeClips(StorytimeWeekSchema.parse(startWeek(8)), tree.contentRoot), 'the shipped w08').toBeUndefined();
    });

    it('gives pass or warn and never fail for the shipped w01 to w07, and no row for w08', async () => {
        const checkPracticeClips = await checks('checkPracticeClips');
        for (let week = 1; week <= 7; week += 1) {
            const found = checkPracticeClips(StorytimeWeekSchema.parse(JSON.parse(shippedText(week))));
            const row = Array.isArray(found) ? found[0] : found;
            expect(row, `week ${week} has a row`).toBeDefined();
            expect(['pass', 'warn'], `week ${week}: ${row?.status} ${row?.detail ?? ''}`).toContain(row?.status);
            if (row?.status === 'warn') expect(row.detail).toMatch(/^no clip: /);
        }
        expect(checkPracticeClips(StorytimeWeekSchema.parse(JSON.parse(shippedText(8))))).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------------------------
// D8: the sentence paths and the plan
// ---------------------------------------------------------------------------------------------

describe('D8 sentenceClipPath and planSentenceClips (L7)', () => {
    it('gives the path l2/media/w<nn>/sentences/b<i>-s<jj>.mp3', async () => {
        const sentenceClipPath = await sentences('sentenceClipPath');
        expect(sentenceClipPath(2, 1, 1, 1)).toBe('l2/media/w01/sentences/b1-s01.mp3');
        expect(sentenceClipPath(2, 7, 1, 8)).toBe('l2/media/w07/sentences/b1-s08.mp3');
        expect(sentenceClipPath(2, 12, 0, 10)).toBe('l2/media/w12/sentences/b0-s10.mp3');
    });

    it('plans the decodable books only, in the order of the books, and gives nothing for a read-along book', async () => {
        const planSentenceClips = await sentences('planSentenceClips');
        const plan = planSentenceClips({
            level: 2,
            week: 1,
            books: [
                { kind: 'readalong', audio: { sentences: [{ sentence: 'Hello, I am Pat.' }, { sentence: 'I am Sam.' }] } },
                { kind: 'decodable', audio: { sentences: [{ sentence: 'A nest.' }, { sentence: 'A net.' }] } },
                { kind: 'decodable', audio: { sentences: [{ sentence: 'A nut.' }] } },
            ],
        });
        expect(plan).toEqual([
            { book: 1, n: 1, text: 'A nest.', file: 'l2/media/w01/sentences/b1-s01.mp3' },
            { book: 1, n: 2, text: 'A net.', file: 'l2/media/w01/sentences/b1-s02.mp3' },
            { book: 2, n: 1, text: 'A nut.', file: 'l2/media/w01/sentences/b2-s01.mp3' },
        ]);
        expect(planSentenceClips({ level: 2, week: 1, books: [{ kind: 'readalong', audio: { sentences: [{ sentence: 'Hi.' }] } }] })).toEqual([]);
        expect(planSentenceClips({ level: 2, week: 8, books: [] })).toEqual([]);
    });

    it('plans 8 sentences for each shipped week (56 in all, 779 characters), none for the read-along books, and none for w08', async () => {
        const planSentenceClips = await sentences('planSentenceClips');
        let total = 0;
        let chars = 0;
        for (let week = 1; week <= 7; week += 1) {
            const raw = startWeek(week);
            const plan = planSentenceClips({ level: 2, week, books: raw.books });
            const decodable = raw.books.findIndex((book) => book.kind === 'decodable');
            const book = raw.books[decodable];
            expect(plan, `the 8 sentences of week ${week}`).toHaveLength(8);
            expect(plan.map((item) => item.book), `week ${week}: the decodable book only`).toEqual(new Array<number>(8).fill(decodable));
            expect(plan.map((item) => item.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
            expect(plan.map((item) => item.text), `week ${week}: the book sentences in order`).toEqual(book.audio.sentences.map((entry) => entry.sentence));
            expect(plan.map((item) => item.file)).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((n) => `l2/media/w${weekDigits(week)}/sentences/b${decodable}-s0${n}.mp3`));
            expect(plan.reduce((sum, item) => sum + item.text.length, 0), `week ${week}: the characters`).toBe(SENTENCE_CHARS[week]);
            total += plan.length;
            chars += SENTENCE_CHARS[week];
        }
        expect(total).toBe(56);
        expect(chars).toBe(779);
        expect(planSentenceClips({ level: 2, week: 8, books: startWeek(8).books }), 'the shipped w08 has no book').toEqual([]);
    });
});

// ---------------------------------------------------------------------------------------------
// D9: the sentence maker with fakes
// ---------------------------------------------------------------------------------------------

describe('D9 the sentence maker on a copy of w01 that has no book mp3 (L8, FR 5)', () => {
    it('makes one call for each sentence, in order, with the exact text, the voice of the book, and the speed 1', async () => {
        const run = await baseSentenceRun();
        expect(run.voice.calls.map((call) => call.text), 'the 8 sentences, once each, in order').toEqual(W01_SENTENCES);
        expect(run.voice.calls.map((call) => call.voice), 'the voice of the book').toEqual(new Array<string>(8).fill(VOICE));
        expect(run.voice.calls.map((call) => call.speed), 'the speed 1').toEqual(new Array<number>(8).fill(1));
        expect(run.result.made, 'the relative path of each clip').toEqual(W01_SENTENCE_PATHS);
        expect(run.result.chars, 'the characters of one take of each sentence').toBe(70);
    }, 120_000);

    it('succeeds although the tree has no book audio file, so the maker does not read the book audio', async () => {
        const run = await baseSentenceRun();
        const week = JSON.parse(fs.readFileSync(run.tree.weekFile, 'utf8')) as RawWeek;
        const bookFile = week.books[1].audio.file as string;
        expect(bookFile, 'the week names a book audio file').toMatch(/^l2\/media\/w01\/books\//);
        expect(fs.existsSync(path.join(run.tree.contentRoot, bookFile)), 'the file is absent').toBe(false);
        expect(fs.existsSync(path.join(sentencesFolder(run.tree), 'b1-s08.mp3'))).toBe(true);
    }, 120_000);

    it('creates the sentences folder before the first synthesize call (R1)', async () => {
        const tree = sentenceTree();
        const folder = sentencesFolder(tree);
        expect(fs.existsSync(folder), 'the tree has no sentences folder').toBe(false);
        const voice = fakeVoice({ span: SENTENCE_SPAN });
        const folderAtCall: boolean[] = [];
        const synthesize = (text: string, wavFile: string, voiceName?: string, speed?: number): void => {
            // The real mmx cannot write its output file into a folder that does not exist.
            folderAtCall.push(fs.existsSync(path.dirname(wavFile)));
            voice.synthesize(text, wavFile, voiceName, speed);
        };
        const run = await runSentenceMaker(tree, voice, { synthesize });
        expect(run.error?.message, 'the run ends without an error').toBeUndefined();
        expect(folderAtCall.length, 'one call for each sentence').toBe(8);
        expect(folderAtCall, 'the folder of each take file exists at call time').toEqual(new Array<boolean>(8).fill(true));
        expect(run.value?.made, 'the clips are written').toEqual(W01_SENTENCE_PATHS);
        for (const file of W01_SENTENCE_PATHS) expect(fs.existsSync(path.join(tree.contentRoot, file)), file).toBe(true);
    }, 120_000);

    it('exports main, which prints the usage for --help and exits 2 for a missing option', async () => {
        const main = await sentenceMaker('main');
        const help = await captureOutput(() => main(['--help']));
        expect(help.value).toBe(0);
        const usage = help.out.join('\n');
        for (const flag of ['--level', '--week', '--max-chars', '--dry-run']) expect(usage, flag).toContain(flag);
        expect((await captureOutput(() => main([]))).value, 'no option').toBe(2);
        expect((await captureOutput(() => main(['--level', '2']))).value, 'no week').toBe(2);
    });
});

// ---------------------------------------------------------------------------------------------
// D10: the heard rule, the length rule, and the files
// ---------------------------------------------------------------------------------------------

describe('D10 the sentence heard rule, the length rule, and the files (L8)', () => {
    it('passes a take only when the recognizer heard each word in order (sentenceHeardPasses)', async () => {
        const sentenceHeardPasses = await sentences('sentenceHeardPasses');
        expect(sentenceHeardPasses('A nest.', ['A', 'nest'])).toBe(true);
        expect(sentenceHeardPasses('Nan can nod!', ['nan', 'can', 'nod'])).toBe(true);
        expect(sentenceHeardPasses('A nest.', ['A', 'net'])).toBe(false);
        expect(sentenceHeardPasses('Nan can nod!', ['Nan', 'cannot'])).toBe(false);
        expect(sentenceHeardPasses('Nan can nod!', ['Nan', 'can'])).toBe(false);
        expect(sentenceHeardPasses('A nest.', [])).toBe(false);
    });

    it('gives the bounds of a sentence: 0.2 s for each word at least, and 1.2 s for each word plus 1 s at most', async () => {
        const sentenceLengthBounds = await sentences('sentenceLengthBounds');
        const table: [string, number][] = [['A nest.', 2], ['Nan can nod!', 3], ['A nest and a nut.', 5]];
        for (const [sentence, words] of table) {
            const bounds = sentenceLengthBounds(sentence);
            expect(bounds.min, `${sentence}: the minimum`).toBeCloseTo(0.2 * words, 9);
            expect(bounds.max, `${sentence}: the maximum`).toBeCloseTo(1.2 * words + 1, 9);
        }
    });

    it('writes only the mp3 clips and the provenance file: no WAV file and no take file stays', async () => {
        const run = await baseSentenceRun();
        const files = fs.readdirSync(sentencesFolder(run.tree)).sort();
        expect(files).toEqual(['manifest.json', ...W01_SENTENCE_PATHS.map((file) => path.basename(file))].sort());
    }, 120_000);

    it('writes an mp3 of 32 kHz, mono, 128 kb/s with the peak near -3 dBFS and 80 ms of quiet at each edge', async () => {
        const run = await baseSentenceRun();
        W01_SENTENCE_PATHS.forEach((file, index) => {
            const full = path.join(run.tree.contentRoot, file);
            const call = callOf(run.voice, W01_SENTENCES[index], 1);
            expect(probeAudio(full), `${file}: the mp3 stream`).toEqual({ sampleRate: RATE, channels: 1, bitRate: 128000 });
            const samples = decodeMp3(full);
            // The mp3 encoder keeps the peak within 0.5 dB of the 23197 of the WAV (a peak of 32767 fails here).
            expect(peakOf(samples), `${file}: the peak`).toBeGreaterThanOrEqual(21900);
            expect(peakOf(samples), `${file}: the peak`).toBeLessThanOrEqual(24560);
            expect(Math.abs(samples.length - (call.extent + 2 * EDGE)), `${file}: the length is the loud part plus 2 x 2560 samples`).toBeLessThanOrEqual(600);
            const half = PEAK / 2;
            const first = samples.findIndex((sample) => Math.abs(sample) >= half);
            let last = samples.length - 1;
            while (last >= 0 && Math.abs(samples[last]) < half) last -= 1;
            expect(Math.abs(first - EDGE), `${file}: the loud part starts after 80 ms`).toBeLessThanOrEqual(300);
            expect(Math.abs(samples.length - 1 - last - EDGE), `${file}: the loud part ends 80 ms before the end`).toBeLessThanOrEqual(300);
        });
    }, 120_000);

    it('writes the provenance file with the L8 keys, the JSON.stringify form, and the SHA-256 of each mp3', async () => {
        const run = await baseSentenceRun();
        const text = fs.readFileSync(provenanceFile(run.tree), 'utf8');
        const parsed = JSON.parse(text) as Provenance;
        expect(Object.keys(parsed), 'the keys of the file').toEqual(['voice', 'speed', 'model', 'items']);
        expect([parsed.voice, parsed.speed, parsed.model]).toEqual([VOICE, 1, 'speech-2.8-hd']);
        expect(text, 'the form JSON.stringify(value, null, 1) and one final newline').toBe(`${JSON.stringify(parsed, null, 1)}\n`);
        expect(parsed.items).toHaveLength(8);
        parsed.items.forEach((item, index) => {
            const call = callOf(run.voice, W01_SENTENCES[index], 1);
            expect(Object.keys(item), `item ${index + 1}: the keys, in order`).toEqual(ITEM_KEYS);
            expect(item.book).toBe(1);
            expect(item.n).toBe(index + 1);
            expect(item.text).toBe(W01_SENTENCES[index]);
            expect(item.file).toBe(W01_SENTENCE_PATHS[index]);
            expect(item.take).toBe(1);
            expect(item.len_s).toBe(Math.round(((call.extent + 2 * EDGE) / RATE) * 1000) / 1000);
            expect(item.peak_dbfs).toBe(-3);
            expect(item.recognized, 'the heard words joined by one space').toBe(W01_SENTENCES[index]);
            expect(item.note).toBe('');
            expect(item.sha256, `item ${index + 1}: the SHA-256 of the mp3`).toBe(fileHash(path.join(run.tree.contentRoot, W01_SENTENCE_PATHS[index])));
        });
    }, 120_000);

    it('makes a take again when it is heard as other words, and keeps the take number', async () => {
        const run = await scenarioSentenceRun();
        const items = provenanceOf(run.tree).items;
        expect(items[1].text).toBe('A net.');
        expect(items[1].take, 'A net.: take 1 was heard as "A nut"').toBe(2);
        expect(items[1].note).toBe('');
        expect(run.voice.calls.filter((call) => call.text === 'A net.')).toHaveLength(2);
    }, 120_000);

    it('keeps the third take with the note "heard \'<x>\' in 3 takes" when 3 takes fail', async () => {
        const run = await scenarioSentenceRun();
        const item = provenanceOf(run.tree).items[2];
        expect(item.text).toBe('A nut.');
        expect(item.take).toBe(3);
        expect(item.recognized).toBe('A nut nut');
        expect(item.note).toBe("heard 'A nut nut' in 3 takes");
        expect(run.voice.calls.filter((call) => call.text === 'A nut.')).toHaveLength(3);
        expect(fs.existsSync(path.join(run.tree.contentRoot, W01_SENTENCE_PATHS[2])), 'the clip of the third take stays').toBe(true);
    }, 120_000);

    it('makes a take again when it is too long or too short, and when its longest inner pause is above 0.6 s', async () => {
        const run = await scenarioSentenceRun();
        const items = provenanceOf(run.tree).items;
        expect(items[4].text).toBe('A neck.');
        expect(items[4].take, 'A neck.: take 1 is 4.6 s, above 3.4 s').toBe(2);
        expect(items[5].text).toBe('A nurse.');
        expect(items[5].take, 'A nurse.: take 1 holds a pause of 0.8 s').toBe(2);
        expect(items[6].text).toBe('A nest and a nut.');
        expect(items[6].take, 'A nest and a nut.: take 1 is 0.1 s, below 1 s').toBe(2);
        for (const index of [0, 3, 7]) expect(items[index].take, `${items[index].text}: one take`).toBe(1);
        for (const index of [1, 4, 5, 6]) expect(items[index].note, `${items[index].text}: a passed retake has no note`).toBe('');
    }, 120_000);

    it('sends the sentences in order with the takes in a row, and counts every character', async () => {
        const run = await scenarioSentenceRun();
        expect(run.voice.calls.map((call) => call.text)).toEqual([
            'A nest.', 'A net.', 'A net.', 'A nut.', 'A nut.', 'A nut.', 'A nose.', 'A neck.', 'A neck.',
            'A nurse.', 'A nurse.', 'A nest and a nut.', 'A nest and a nut.', 'Nan can nod!',
        ]);
        expect(run.result.chars, 'one take each is 70, and the extra takes are 50').toBe(120);
        expect(run.result.chars).toBe(run.voice.calls.reduce((sum, call) => sum + call.text.length, 0));
        expect(run.result.made).toEqual(W01_SENTENCE_PATHS);
    }, 120_000);

    it('stops before the first call when one take of each sentence needs more than maxChars, and writes nothing', async () => {
        const tree = sentenceTree();
        const voice = fakeVoice({ span: SENTENCE_SPAN });
        const hashes = treeHashes(tree.folder);
        const run = await runSentenceMaker(tree, voice, { maxChars: 69 });
        expect(run.error, 'the maker throws').toBeInstanceOf(Error);
        expect(run.error?.message).toMatch(/char/i);
        expect(voice.calls, 'no call is made').toHaveLength(0);
        expect(treeHashes(tree.folder), 'no file changes, and no file appears').toEqual(hashes);
    }, 120_000);

    it('stops before the call that would take the run above maxChars', async () => {
        const tree = sentenceTree();
        // One retake of "A nest." (7): 65 characters are sent through "A nest and a nut.", and "Nan can nod!" (12) would make 77.
        const voice = fakeVoice({
            span: SENTENCE_SPAN,
            heard: (text, take) => (text === 'A nest.' && take === 1 ? ['A', 'net'] : text.split(' ')),
        });
        const run = await runSentenceMaker(tree, voice, { maxChars: 72 });
        expect(run.error, 'the maker throws before the call for "Nan can nod!"').toBeInstanceOf(Error);
        expect(run.error?.message).toMatch(/char/i);
        expect(voice.calls.map((call) => call.text).includes('Nan can nod!'), 'no take of the last sentence').toBe(false);
        expect(voice.calls.reduce((sum, call) => sum + call.text.length, 0)).toBeLessThanOrEqual(72);
    }, 120_000);

    it('lists the 8 sentences and prints "chars: 70" for --dry-run, and writes nothing', async () => {
        const tree = sentenceTree();
        const voice = fakeVoice({ span: SENTENCE_SPAN });
        const hashes = treeHashes(tree.folder);
        const run = await runSentenceMaker(tree, voice, { dryRun: true });
        expect(run.error?.message, 'the dry run').toBeUndefined();
        const result = run.value as MakeSentenceClipsResult;
        expect(result.made).toEqual([]);
        expect(result.lines, 'a line "chars: 70"').toContain('chars: 70');
        for (const sentence of W01_SENTENCES) expect(result.lines.some((line) => line.includes(sentence)), `a line with ${sentence}`).toBe(true);
        expect(voice.calls, 'no call is made').toHaveLength(0);
        expect(treeHashes(tree.folder), 'nothing is written').toEqual(hashes);
        expect(fs.existsSync(path.join(tree.contentRoot, 'l2/media')), 'no media folder appears').toBe(false);
    }, 120_000);

    it('throws "no faster-whisper venv at <path>" before the first call when recognize is absent', async () => {
        const tree = sentenceTree();
        const voice = fakeVoice({ span: SENTENCE_SPAN });
        const hashes = treeHashes(tree.folder);
        const run = await runSentenceMaker(tree, voice, { recognize: undefined, whisperPython: MISSING_PYTHON });
        expect(run.error, 'the maker throws').toBeInstanceOf(Error);
        expect(run.error?.message).toMatch(new RegExp(`no faster-whisper venv at ${MISSING_PYTHON.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$`));
        expect(voice.calls, 'no synthesize call').toHaveLength(0);
        expect(treeHashes(tree.folder), 'nothing is written').toEqual(hashes);
    }, 120_000);
});

// ---------------------------------------------------------------------------------------------
// D11: looksLikeCut
// ---------------------------------------------------------------------------------------------

describe('D11 looksLikeCut (L8)', () => {
    it('gives true for a window cut from a synthetic source, also after a change of the gain (the positive control)', async () => {
        const looksLikeCut = await sentences('looksLikeCut');
        const source = noise(1, 24000);
        const window = source.slice(5000, 11000);
        expect(looksLikeCut(window, source, RATE), 'a copy of a window').toBe(true);
        const scaled = Int16Array.from(window, (sample) => Math.round((sample * PEAK) / 8191));
        expect(looksLikeCut(scaled, source, RATE), 'a window scaled to the clip peak').toBe(true);
    });

    it('gives false for an unrelated synthetic signal of the same length (the negative control)', async () => {
        const looksLikeCut = await sentences('looksLikeCut');
        const source = noise(1, 24000);
        expect(looksLikeCut(noise(2, 6000), source, RATE)).toBe(false);
    });

    it('gives false for each clip that the maker makes, against a synthetic book mp3 that sits at the book audio path', async () => {
        const looksLikeCut = await sentences('looksLikeCut');
        const tree = sentenceTree();
        const week = JSON.parse(fs.readFileSync(tree.weekFile, 'utf8')) as RawWeek;
        const book = noise(3, 64000);
        const bookFiles = [week.books[1].audio.file as string];
        for (const file of bookFiles) writeMp3(book, path.join(tree.contentRoot, file));
        const voice = fakeVoice({ span: (text) => 8000 * wordCount(text) });
        const run = await runSentenceMaker(tree, voice);
        expect(run.error?.message, 'the maker runs').toBeUndefined();
        const decodedBook = decodeMp3(path.join(tree.contentRoot, bookFiles[0]));
        expect(decodedBook.length, 'the book mp3 holds the synthetic signal').toBeGreaterThan(60000);
        // The first and the last clip: the clips differ in length, and the check runs on a long source.
        for (const index of [0, 7]) {
            const clip = decodeMp3(path.join(tree.contentRoot, W01_SENTENCE_PATHS[index]));
            expect(looksLikeCut(clip, decodedBook, RATE), `${W01_SENTENCE_PATHS[index]} is not a cut of the book mp3`).toBe(false);
        }
        // The control: a window of the decoded book mp3 is a cut, so the guard sees a maker that cuts.
        expect(looksLikeCut(decodedBook.slice(10000, 30000), decodedBook, RATE), 'a window of the book mp3 is a cut').toBe(true);
    }, 120_000);
});

// ---------------------------------------------------------------------------------------------
// D12: checkSentenceClips
// ---------------------------------------------------------------------------------------------

/** The tree of the sentence check cases: week 1 with the sentence clips and 8 fake mp3 files. */
interface SentenceCheckTree {
    contentRoot: string;
    raw: RawWeek;
}

/**
 * A copy of w01 with the field `sentenceClips` that the test writes, and 8 fake mp3 files.
 * @returns The tree.
 */
function sentenceCheckTree(): SentenceCheckTree {
    const folder = tempFolder('storytime-practice-check-');
    const contentRoot = path.join(folder, 'content');
    fs.mkdirSync(path.join(contentRoot, 'l2/media/w01/sentences'), { recursive: true });
    for (const file of W01_SENTENCE_PATHS) fs.writeFileSync(path.join(contentRoot, file), `fake mp3 ${file}\n`);
    const raw = startWeek(1);
    raw.books[1].audio.sentenceClips = W01_ITEMS.map((item) => ({ ...item }));
    return { contentRoot, raw };
}

/**
 * The row of the sentence check for a tree.
 * @param tree The tree.
 * @returns The row, which the check reads from the parsed week as the CLI does.
 */
async function sentenceRowOf(tree: SentenceCheckTree): Promise<CheckRow | undefined> {
    const checkSentenceClips = await checks('checkSentenceClips');
    return checkSentenceClips(StorytimeWeekSchema.parse(tree.raw), tree.contentRoot);
}

describe('D12 checkSentenceClips (L9)', () => {
    it('gives the exact id and label, and pass with no detail', async () => {
        const row = await sentenceRowOf(sentenceCheckTree());
        expect(row).toEqual({ id: 'sentence-clips', label: SENTENCE_CLIPS_LABEL, status: 'pass' });
        expect(row?.detail).toBeUndefined();
    });

    it('warns "no clips" when the decodable book has no field', async () => {
        const tree = sentenceCheckTree();
        delete tree.raw.books[1].audio.sentenceClips;
        expect(await sentenceRowOf(tree)).toEqual({ id: 'sentence-clips', label: SENTENCE_CLIPS_LABEL, status: 'warn', detail: 'no clips' });
    });

    it('fails with "count differs: <book>" when the array length is not the sentence count', async () => {
        const tree = sentenceCheckTree();
        (tree.raw.books[1].audio.sentenceClips as unknown[]).pop();
        const row = await sentenceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('count differs: 1');
    });

    it('fails with "text differs: <path>" when an item sentence is not the book sentence', async () => {
        const tree = sentenceCheckTree();
        (tree.raw.books[1].audio.sentenceClips as { sentence: string }[])[2].sentence = 'A nut!';
        const row = await sentenceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('text differs: l2/media/w01/sentences/b1-s03.mp3');
    });

    it('fails with "missing: <path>" when a clip file is absent', async () => {
        const tree = sentenceCheckTree();
        fs.rmSync(path.join(tree.contentRoot, W01_SENTENCE_PATHS[3]));
        const row = await sentenceRowOf(tree);
        expect(row).toEqual({ id: 'sentence-clips', label: SENTENCE_CLIPS_LABEL, status: 'fail', detail: 'missing: l2/media/w01/sentences/b1-s04.mp3' });
    });

    it('fails with "bad path: <path>" for a value that is not the L7 path of its index', async () => {
        const tree = sentenceCheckTree();
        fs.writeFileSync(path.join(tree.contentRoot, 'l2/media/w01/sentences/b1-s02-copy.mp3'), 'fake mp3 copy\n');
        (tree.raw.books[1].audio.sentenceClips as { file: string }[])[1].file = 'l2/media/w01/sentences/b1-s02-copy.mp3';
        const row = await sentenceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('bad path: l2/media/w01/sentences/b1-s02-copy.mp3');
    });

    it('joins the four fail parts in the order of L9 with "; "', async () => {
        const tree = sentenceCheckTree();
        const items = tree.raw.books[1].audio.sentenceClips as { sentence: string; file: string }[];
        items.pop();
        items[0].sentence = 'A nest!';
        fs.rmSync(path.join(tree.contentRoot, W01_SENTENCE_PATHS[1]));
        fs.writeFileSync(path.join(tree.contentRoot, 'l2/media/w01/sentences/b1-s03-copy.mp3'), 'fake mp3 copy\n');
        items[2].file = 'l2/media/w01/sentences/b1-s03-copy.mp3';
        const row = await sentenceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe([
            'count differs: 1',
            'text differs: l2/media/w01/sentences/b1-s01.mp3',
            'missing: l2/media/w01/sentences/b1-s02.mp3',
            'bad path: l2/media/w01/sentences/b1-s03-copy.mp3',
        ].join('; '));
    });

    it('lets a fail win over a warn, and the detail of the fail holds no warn part', async () => {
        const tree = sentenceCheckTree();
        tree.raw.books.push(JSON.parse(JSON.stringify(tree.raw.books[1])) as RawWeek['books'][number]);
        delete tree.raw.books[2].audio.sentenceClips;
        fs.rmSync(path.join(tree.contentRoot, W01_SENTENCE_PATHS[0]));
        const row = await sentenceRowOf(tree);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('missing: l2/media/w01/sentences/b1-s01.mp3');
    });

    it('gives no row for a week with no decodable book', async () => {
        const checkSentenceClips = await checks('checkSentenceClips');
        const tree = sentenceCheckTree();
        const readAlongOnly = { ...tree.raw, books: [tree.raw.books[0]] };
        expect(checkSentenceClips(StorytimeWeekSchema.parse(readAlongOnly), tree.contentRoot), 'a read-along book only').toBeUndefined();
        expect(checkSentenceClips(StorytimeWeekSchema.parse({ ...tree.raw, books: [] }), tree.contentRoot), 'no book').toBeUndefined();
        expect(checkSentenceClips(StorytimeWeekSchema.parse(startWeek(8)), tree.contentRoot), 'the shipped w08').toBeUndefined();
    });

    it('gives pass or warn and never fail for the shipped w01 to w07', async () => {
        const checkSentenceClips = await checks('checkSentenceClips');
        for (let week = 1; week <= 7; week += 1) {
            const row = checkSentenceClips(StorytimeWeekSchema.parse(JSON.parse(shippedText(week))));
            expect(row, `week ${week} has a row`).toBeDefined();
            expect(['pass', 'warn'], `week ${week}: ${row?.status} ${row?.detail ?? ''}`).toContain(row?.status);
            if (row?.status === 'warn') expect(row.detail).toBe('no clips');
        }
    });
});

// ---------------------------------------------------------------------------------------------
// D13: set-sentence-clips.ts
// ---------------------------------------------------------------------------------------------

/**
 * The lines of the field `sentenceClips` as the sentence mapper writes them (L17), at the indent of the
 * key of the audio object of a book.
 * @returns The lines.
 */
function sentenceBlock(): string[] {
    const indent = '        ';
    const out = [`${indent}"sentenceClips": [`];
    W01_ITEMS.forEach((item, index) => {
        out.push(`${indent}  {`, `${indent}    "sentence": ${JSON.stringify(item.sentence)},`, `${indent}    "file": ${JSON.stringify(item.file)}`);
        out.push(index < W01_ITEMS.length - 1 ? `${indent}  },` : `${indent}  }`);
    });
    out.push(`${indent}]`);
    return out;
}

/**
 * The tree of the sentence mapper: the start file of week 1 with no sentence block, 8 fake mp3 files,
 * and the provenance file that the test writes with the SHA-256 of each file.
 * @returns The tree.
 */
function sentenceMapperTree(): WordTree {
    const folder = tempFolder('storytime-practice-setsent-');
    const contentRoot = path.join(folder, 'content');
    const weekFile = path.join(contentRoot, 'l2/w01.json');
    fs.mkdirSync(path.join(contentRoot, 'l2/media/w01/sentences'), { recursive: true });
    fs.writeFileSync(weekFile, stripBlocks(shippedText(1), ['sentenceClips']));
    const items = W01_SENTENCE_PATHS.map((file, index) => {
        const bytes = Buffer.from(`fake sentence mp3 ${index + 1}\n`);
        fs.writeFileSync(path.join(contentRoot, file), bytes);
        return { book: 1, n: index + 1, text: W01_SENTENCES[index], file, take: 1, len_s: 1.1, peak_dbfs: -3, recognized: W01_SENTENCES[index], note: '', sha256: sha256(bytes) };
    });
    const provenance = { voice: VOICE, speed: 1, model: 'speech-2.8-hd', items };
    fs.writeFileSync(path.join(contentRoot, 'l2/media/w01/sentences/manifest.json'), `${JSON.stringify(provenance, null, 1)}\n`);
    return { folder, contentRoot, weekFile, bankFolder: path.join(contentRoot, 'words'), manifestFile: path.join(contentRoot, 'l2/media/w01/sentences/manifest.json') };
}

describe('D13 set-sentence-clips.ts (FR 6, L17)', () => {
    it('writes the array form after the last key of the decodable audio object, and the new text parses with the schema', async () => {
        const setSentenceClips = await sentenceMapper('setSentenceClips');
        const tree = sentenceMapperTree();
        const before = fs.readFileSync(tree.weekFile, 'utf8');
        const run = await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot }));
        expect(run.error?.message, 'the mapper runs').toBeUndefined();
        const after = fs.readFileSync(tree.weekFile, 'utf8');
        const diff = insertionDiff(before.split('\n'), after.split('\n'));
        expect(diff.changed, 'the closing line of the last key gains a comma').toHaveLength(1);
        expect(diff.changed[0][1]).toBe(`${diff.changed[0][0]},`);
        expect(diff.added, 'the 34 lines of the array').toEqual(sentenceBlock());
        expect(diff.added).toHaveLength(34);
        const parsed = StorytimeWeekSchema.parse(JSON.parse(after)) as unknown as RawWeek;
        expect(parsed.books[1].audio.sentenceClips, 'the parse output keeps the items').toEqual(W01_ITEMS);
        expect(parsed.books[0].audio.sentenceClips, 'the read-along book gets no field').toBeUndefined();
    }, 60_000);

    it('changes no byte and no modification time on a second run', async () => {
        const setSentenceClips = await sentenceMapper('setSentenceClips');
        const tree = sentenceMapperTree();
        const options = { weekFile: tree.weekFile, contentRoot: tree.contentRoot };
        expect((await attempt(() => setSentenceClips(options))).error?.message, 'the first run').toBeUndefined();
        ageTree(tree.contentRoot);
        const hashes = treeHashes(tree.contentRoot);
        const stamps = treeStamps(tree.contentRoot);
        expect((await attempt(() => setSentenceClips(options))).error?.message, 'the second run').toBeUndefined();
        expect(treeHashes(tree.contentRoot), 'no byte changes').toEqual(hashes);
        expect(treeStamps(tree.contentRoot), 'no modification time changes').toEqual(stamps);
    }, 60_000);

    const faults: { name: string; fault: (tree: WordTree) => void }[] = [
        {
            name: 'a clip file that is absent',
            fault: (tree) => fs.rmSync(path.join(tree.contentRoot, W01_SENTENCE_PATHS[2])),
        },
        {
            name: 'a clip whose SHA-256 differs from the provenance row',
            fault: (tree) => fs.appendFileSync(path.join(tree.contentRoot, W01_SENTENCE_PATHS[2]), 'x'),
        },
    ];

    for (const { name, fault } of faults) {
        it(`stops for ${name} and writes nothing`, async () => {
            const setSentenceClips = await sentenceMapper('setSentenceClips');
            const tree = sentenceMapperTree();
            fault(tree);
            const listing = entryListing(tree.folder);
            const hashes = treeHashes(tree.folder);
            const run = await attempt(() => setSentenceClips({ weekFile: tree.weekFile, contentRoot: tree.contentRoot }));
            expect(run.error, 'the mapper throws').toBeInstanceOf(Error);
            expect(run.error?.message).toContain('b1-s03');
            expect(entryListing(tree.folder), 'no file appears').toEqual(listing);
            expect(treeHashes(tree.folder), 'no file changes, and the week file is byte equal').toEqual(hashes);
        }, 60_000);
    }

    it('names the flags in its usage and exits 2 for a missing option', async () => {
        const main = await sentenceMapper('main');
        const help = await captureOutput(() => main(['--help']));
        expect(help.value).toBe(0);
        const usage = help.out.join('\n');
        for (const flag of ['--level', '--week', '--check']) expect(usage, flag).toContain(flag);
        expect((await captureOutput(() => main([]))).value, 'no option').toBe(2);
        expect((await captureOutput(() => main(['--level', '2']))).value, 'no week').toBe(2);
    });
});

// ---------------------------------------------------------------------------------------------
// The guards of this file
// ---------------------------------------------------------------------------------------------

describe('the guards of this file', () => {
    it('holds no path of the Measure track folders', () => {
        expect(fs.readFileSync(SELF_FILE, 'utf8').includes(FORBIDDEN_PATH)).toBe(false);
    });

    it('writes nothing under content/storytime (this case runs last)', () => {
        expect(contentSnapshot()).toEqual(SNAPSHOT_AT_LOAD);
    });
});
