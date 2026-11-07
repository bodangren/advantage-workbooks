import { trimSilence } from '../media/audio';

/**
 * The word clips of the Storytime read-along books (Phase 11, spec FR 2, decisions K2 to K9 and K13):
 * the key of a book word, the clip path of a key, the map of one book, the TTS text and the heard
 * check, the normalisation of one take, the manifest text edit, the onsets of a silencedetect log,
 * and the lead-in of one song video.
 *
 * The module is pure: it reads no file, starts no process, and uses no network. The scripts
 * `scripts/storytime/make-word-bank.ts`, `set-word-clips.ts`, and `measure-video-lead-in.ts` read and
 * write the files of the word bank and of the weeks.
 */

/** The peak sample of a bank clip: round(32767 x 10^(-3/20)) rounds to 23197 (K7 step 1). */
const WORD_CLIP_PEAK = 23197;

/** The loudest sample below -50 dBFS: 32767 x 10^(-50/20) is 103.6 (K7 step 2). */
const QUIET_THRESHOLD = 103;

/** The quiet edge of a bank clip, in milliseconds (K7 step 2). */
const EDGE_PAD_MS = 80;

/** The form of a word key: lower-case letters, with straight-apostrophe groups (K2 step 5). */
const WORD_KEY = /^[a-z]+('[a-z]+)*$/;

/** The straight apostrophe that K2 step 1 writes, in the two typographic forms. */
const CURLY_APOSTROPHE = /[\u2018\u2019]/g;

/** The characters that K2 step 3 removes from the start and from the end of a word. */
const NOT_A_KEY_CHAR = /[^a-z']/;

/** The heard text keeps these characters and removes each other one (K9). */
const NOT_A_HEARD_CHAR = /[^a-z0-9']/g;

/** One word of a book as `bookWordKeys` reads it. */
export interface BookWord {
    /** The written form of the word. */
    word: string;
}

/** One sentence of a book as `bookWordKeys` reads it. */
export interface BookSentence {
    /** The words of the sentence, in order. */
    words?: readonly BookWord[];
}

/** The audio of one book as `bookWordKeys` reads it: both speeds, in document order. */
export interface BookWords {
    /** The sentences at 1.0 speed. */
    sentences?: readonly BookSentence[];
    /** The sentences at 0.75 speed. */
    slowSentences?: readonly BookSentence[];
}

/** The row of the word bank (K6). */
export interface WordBankRow {
    /** The row number, from 1 with no gap. */
    n: number;
    /** `wa-<stem>`. */
    id: string;
    /** The word key. */
    word: string;
    /** `wa-<stem>.wav`. */
    file: string;
    /** `wa-<stem>.mp3`. */
    mp3: string;
    /** The source of the clip: `book`. */
    sources: string;
    /** The weeks of the level whose books hold the key, joined by `;`. */
    weeks: string;
    /** The take that stays. */
    take: number;
    /** The length of the clip, in seconds, to 3 decimals. */
    len_s: number;
    /** The peak level: -3.0. */
    peak_dbfs: number;
    /** The text that the recognizer heard. */
    recognized: string;
    /** The note of the heard check. */
    note: string;
    /** The SHA-256 of the WAV file. */
    sha256: string;
    /** The text sent to TTS. It is present only when it differs from the key (K8). */
    text?: string;
    /** The date of the take, `YYYY-MM-DD`. */
    added?: string;
}

/** The keys of a bank row, in the order of K6. */
const ROW_KEYS: readonly (keyof WordBankRow)[] = [
    'n', 'id', 'word', 'file', 'mp3', 'sources', 'weeks', 'take', 'len_s', 'peak_dbfs', 'recognized', 'note', 'sha256',
];

/** The heard forms that K9 accepts in place of the key. */
export const WORD_CLIP_HEARD_VARIANTS: Readonly<Record<string, readonly string[]>> = {
    a: ['uh', 'ah'],
    i: ['eye', 'aye'],
    in: ['inn'],
    no: ['know'],
    oh: ['o', 'owe'],
    see: ['sea'],
    your: ["you're", 'yore'],
};

/** The fixed TTS text of a citation form (K8). */
const FIXED_TEXT: Readonly<Record<string, string>> = { a: 'uh', i: 'I' };

/**
 * The key of one book word (K2). The function normalises the text to NFC, writes the straight
 * apostrophe, changes the text to lower case, and removes each other character from the start and
 * from the end.
 * @param word The written form of the word.
 * @returns The key, or undefined when no character stays.
 * @throws Error When the stripped text is not a word key: a hyphen, a digit, or an accent stays
 * inside the text.
 */
export function bookWordKey(word: string): string | undefined {
    const text = word.normalize('NFC').replace(CURLY_APOSTROPHE, "'").toLowerCase();
    let trimmed = text;
    while (trimmed && NOT_A_KEY_CHAR.test(trimmed[0])) trimmed = trimmed.slice(1);
    while (trimmed && NOT_A_KEY_CHAR.test(trimmed[trimmed.length - 1])) trimmed = trimmed.slice(0, -1);
    if (!trimmed) return undefined;
    if (!WORD_KEY.test(trimmed)) throw new Error(`word clip: ${word}: not a word key`);
    return trimmed;
}

/**
 * The file stem of one key: the key with each apostrophe removed (K3).
 * @param key The word key.
 * @returns The stem.
 */
export function wordClipStem(key: string): string {
    return key.split("'").join('');
}

/**
 * The clip path of one key, relative to the content root (K3).
 * @param level The level of the week.
 * @param week The week, from 1 to 99.
 * @param key The word key.
 * @returns The path `l<level>/media/w<nn>/words/wa-<stem>.mp3`.
 * @throws Error When the key is not a word key, or the week is outside 1 to 99.
 */
export function wordClipPath(level: number, week: number, key: string): string {
    if (!WORD_KEY.test(key)) throw new Error(`word clip: ${key}: not a word key`);
    if (!Number.isInteger(week) || week < 1 || week > 99) {
        throw new Error(`word clip: week outside 1 to 99: ${week}`);
    }
    return `l${level}/media/w${String(week).padStart(2, '0')}/words/wa-${wordClipStem(key)}.mp3`;
}

/**
 * The distinct keys of one book, from both speeds, sorted by code point (K4).
 * @param audio The audio of the book.
 * @returns The keys, sorted.
 * @throws Error When a word of the book is not a word key (K2 step 5).
 */
export function bookWordKeys(audio: BookWords): string[] {
    const keys = new Set<string>();
    for (const sentence of [...(audio.sentences ?? []), ...(audio.slowSentences ?? [])]) {
        for (const item of sentence?.words ?? []) {
            if (typeof item?.word !== 'string') continue;
            const key = bookWordKey(item.word);
            if (key !== undefined) keys.add(key);
        }
    }
    return [...keys].sort();
}

/**
 * The clip map of each book of one week, and the sorted distinct clip files (K3, K4).
 * @param input The level, the week, and the books of the week.
 * @returns One map for each book, sorted by key, and the sorted distinct clip files.
 * @throws Error When two keys of the week give one file (K3).
 */
export function planWordClips(input: {
    level: number;
    week: number;
    books: readonly { audio: BookWords }[];
}): { maps: Record<string, string>[]; files: string[] } {
    const maps = input.books.map((book) => {
        const map: Record<string, string> = {};
        for (const key of bookWordKeys(book.audio)) map[key] = wordClipPath(input.level, input.week, key);
        return map;
    });
    const stems = new Map<string, string>();
    for (const map of maps) {
        for (const key of Object.keys(map)) {
            const stem = wordClipStem(key);
            const other = stems.get(stem);
            if (other !== undefined && other !== key) {
                throw new Error(`word clip: two keys, one file: ${other}, ${key}`);
            }
            stems.set(stem, key);
        }
    }
    const files = [...new Set(maps.flatMap((map) => Object.values(map)))].sort();
    return { maps, files };
}

/**
 * The text that TTS gets for one key (K8).
 * @param key The word key.
 * @param firstForm The first written form of the key in the books of the week.
 * @returns `uh` for `a`, `I` for `i`, and the first form for every other key.
 */
export function wordClipText(key: string, firstForm: string): string {
    return FIXED_TEXT[key] ?? firstForm;
}

/**
 * The heard text of a take: the recognized words joined with no space, in lower case, with each
 * character other than a letter, a digit, and the apostrophe removed (K9).
 * @param words The recognized words.
 * @returns The heard text.
 */
export function heardText(words: readonly string[]): string {
    return words.join('').toLowerCase().replace(NOT_A_HEARD_CHAR, '');
}

/**
 * The verdict of the heard check of one take (K9).
 * @param key The word key.
 * @param heard The heard text.
 * @returns `pass` and the note of the check: the homophone note for a pass by a variant, else empty.
 */
export function heardPasses(key: string, heard: string): { pass: boolean; note: string } {
    if (heard === key) return { pass: true, note: '' };
    const variants = WORD_CLIP_HEARD_VARIANTS[key] ?? [];
    if (variants.includes(heard)) return { pass: true, note: `homophone variant: heard '${heard}'` };
    return { pass: false, note: '' };
}

/**
 * Scales one take to the peak sample and trims its edges to 80 ms of quiet (K7 steps 1 and 2).
 * @param samples The samples of the take.
 * @param rate The sample rate of the take.
 * @returns The scaled and trimmed samples, or an empty array for a silent take.
 */
export function normalizeWordClip(samples: Int16Array, rate: number): Int16Array {
    let peak = 0;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    if (peak === 0) return new Int16Array(0);
    const scaled = new Int16Array(samples.length);
    for (let index = 0; index < samples.length; index += 1) {
        scaled[index] = Math.round((samples[index] * WORD_CLIP_PEAK) / peak);
    }
    return trimSilence(scaled, rate, { threshold: QUIET_THRESHOLD, padMs: EDGE_PAD_MS });
}

/**
 * The Python scalar text of one row value. A string takes the JSON form, and `peak_dbfs` keeps one
 * decimal place, because Python writes -3.0 (K6).
 * @param key The key of the value in the row.
 * @param value The value.
 * @returns The text of the value.
 */
function scalarText(key: keyof WordBankRow, value: unknown): string {
    if (key === 'peak_dbfs') return Number(value).toFixed(1);
    if (typeof value === 'number') return String(value);
    return JSON.stringify(value);
}

/**
 * The pairs of one row, in the order of K6, with `text` and `added` only when the row holds them.
 * @param row The row.
 * @returns The key and value pairs, in order.
 */
function rowPairs(row: WordBankRow): [keyof WordBankRow, unknown][] {
    const pairs: [keyof WordBankRow, unknown][] = ROW_KEYS.map((key) => [key, row[key]]);
    if (row.text !== undefined) pairs.push(['text', row.text]);
    if (row.added !== undefined) pairs.push(['added', row.added]);
    return pairs;
}

/**
 * Adds bank rows to the manifest text by a text edit in the Python form of the file (K6). The
 * closing line of the last old row gains a comma. Each new row is one object of the `items` array.
 * @param manifestText The text of the manifest file.
 * @param rows The rows to add.
 * @returns The new text of the manifest file.
 * @throws Error When the text has no `items` array.
 */
export function appendBankRows(manifestText: string, rows: readonly WordBankRow[]): string {
    if (!rows.length) return manifestText;
    const lines = manifestText.split('\n');
    const end = lines.lastIndexOf(' ]');
    if (end < 1) throw new Error('word clip: the bank manifest has no items array');
    const out = lines.slice(0, end - 1);
    const lastRowClose = lines[end - 1];
    out.push(lastRowClose.endsWith(',') ? lastRowClose : `${lastRowClose},`);
    rows.forEach((row, index) => {
        out.push('  {');
        const pairs = rowPairs(row);
        pairs.forEach(([key, value], at) => {
            out.push(`   ${JSON.stringify(key)}: ${scalarText(key, value)}${at < pairs.length - 1 ? ',' : ''}`);
        });
        out.push(index < rows.length - 1 ? '  },' : '  }');
    });
    out.push(...lines.slice(end));
    return out.join('\n');
}

/**
 * The sound onsets of one silencedetect log, in order (K13). A leading silence gives its end as the
 * first onset. Else the file starts with sound, so the first onset is 0. A silence that ends within
 * 0.001 s of the end of the file is not an onset.
 * @param ffmpegLog The standard error of the ffmpeg run.
 * @param lengthSeconds The length of the file, in seconds.
 * @returns The onsets, in order.
 */
export function parseSilenceOnsets(ffmpegLog: string, lengthSeconds: number): number[] {
    const events: { kind: 'start' | 'end'; value: number }[] = [];
    for (const line of ffmpegLog.split(/\r?\n/)) {
        const start = /silence_start:\s*(-?\d+(?:\.\d+)?)/.exec(line);
        if (start) {
            events.push({ kind: 'start', value: Number(start[1]) });
            continue;
        }
        const end = /silence_end:\s*(-?\d+(?:\.\d+)?)/.exec(line);
        if (end) events.push({ kind: 'end', value: Number(end[1]) });
    }
    const ends = events
        .filter((event) => event.kind === 'end' && lengthSeconds - event.value > 0.001)
        .map((event) => event.value);
    const firstStart = events.find((event) => event.kind === 'start');
    if (firstStart !== undefined && firstStart.value <= 0.001) return ends;
    return [0, ...ends];
}

/**
 * The lead-in of one song video: the first onset of the video minus the first onset of the mp3,
 * rounded to 3 decimals (K13). The two second onsets must agree with the value, because a long
 * quiet part of the mp3 would else give a false value.
 * @param audioOnsets The onsets of the mp3, in order.
 * @param videoOnsets The onsets of the video, in order.
 * @returns The lead-in, in seconds, to 3 decimals.
 * @throws Error When a list has fewer than 2 onsets, or the second onsets differ by more than 0.010 s.
 */
export function videoLeadIn(audioOnsets: readonly number[], videoOnsets: readonly number[]): number {
    if (audioOnsets.length < 2 || videoOnsets.length < 2) {
        throw new Error('lead-in: two onsets are needed in each file');
    }
    const leadIn = videoOnsets[0] - audioOnsets[0];
    const second = videoOnsets[1] - audioOnsets[1];
    if (Math.abs(second - leadIn) > 0.01) {
        throw new Error(`lead-in: the second onsets differ by ${Math.abs(second - leadIn).toFixed(3)} s`);
    }
    return Math.round(leadIn * 1000) / 1000;
}
