import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { longestPause, parseWav, writeWav } from '../../lib/media/audio';
import { MAX_PAUSE_S } from '../../lib/media/make-clip';
import { STORYTIME_ROOT } from '../../lib/storytime/files';
import {
    appendBankRows,
    bookWordKey,
    bookWordKeys,
    heardPasses,
    heardText,
    normalizeWordClip,
    wordClipStem,
    wordClipText,
    type BookWords,
    type WordBankRow,
} from '../../lib/storytime/word-clips';

/**
 * The word bank maker of the Storytime app (Phase 11, spec FR 3, decisions K5 to K11). A run lists
 * each key of the books of one week that has no bank row. For each such key it makes the takes with
 * mmx, keeps the take that the heard check passes, writes the WAV and the mp3 into the bank, and adds
 * the row to the manifest. The manifest is the single source of every clip: this script never writes
 * a week file and never copies a clip into a week.
 *
 * A run without `--dry-run` starts Chrome no, but it makes paid mmx calls. Each run of the script in
 * a track task goes inside one heavy-run job.
 */

/** The usage text of the script. */
const USAGE = `Makes the word bank clips of one Storytime week (Phase 11, spec FR 3).

Usage: npx tsx scripts/storytime/make-word-bank.ts --level <n> --week <n> [--max-chars <n>] [--dry-run]

--level      The level of the week.
--week       The week.
--max-chars  The character limit of the run, all takes included (default 300).
--dry-run    List each key and its TTS text, print the characters of one take of each key, and write nothing.

The WAV and the mp3 of a key go into content/storytime/words/. The row goes into the manifest of that
folder. A key that has a row is never made again. A run stops with exit 2 when the faster-whisper venv
is absent, before the first mmx call.`;

/** The mmx model, the voice, and the speed of the bank (K7). */
const MODEL = 'speech-2.8-hd';
const VOICE = 'English_captivating_female1';
const SPEED = 0.9;

/** The sample rate and the peak level of a bank clip (K7). */
const RATE = 32000;
const PEAK_DBFS = -3;

/** The takes of one word at most (K9). */
const TAKES = 3;

/** The character limit of a run, all takes included (K11). */
const DEFAULT_MAX_CHARS = 300;

/** The default faster-whisper interpreter (K9). */
const DEFAULT_PYTHON = '~/.local/share/storytime-word-audio-venv/bin/python';

/** The number words that a take of `i` can be heard as (K8). */
const NUMBER_WORDS: ReadonlySet<string> = new Set([
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
]);

/** The options of one run (spec FR 3). */
export interface MakeWordBankOptions {
    /** The level of the week. */
    level: number;
    /** The week. */
    week: number;
    /** The content root that holds the week files and the bank folder. */
    contentRoot: string;
    /** The bank folder, `content/storytime/words`. */
    bankFolder: string;
    /** The date of the takes, `YYYY-MM-DD`. */
    date: string;
    /** The character limit of the run. The default is 300. */
    maxChars?: number;
    /** Lists each key and its text, and writes nothing. */
    dryRun?: boolean;
    /** The voice of one take. The default runs mmx (K7). */
    synthesize?: (text: string, wavFile: string) => void;
    /** The recognized words of each WAV file. The default runs `word-times.py` (K9). */
    recognize?: (wavFiles: readonly string[]) => string[][];
    /** The faster-whisper interpreter of the default `recognize`. */
    whisperPython?: string;
}

/** The result of one run. */
export interface MakeWordBankResult {
    /** The `id` of each new row, in the order of the run. */
    made: string[];
    /** The characters sent to TTS, all takes included. */
    chars: number;
    /** The printed lines of the run. */
    lines: string[];
}

/**
 * The home form of a path that starts with `~`.
 * @param file The path.
 * @returns The path with the home folder in place of `~`.
 */
function expandHome(file: string): string {
    return file.startsWith('~/') ? path.join(process.env.HOME ?? '', file.slice(2)) : file;
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
 * The SHA-256 of a file.
 * @param file The path of the file.
 * @returns The hash, in lower-case hex.
 */
function fileHash(file: string): string {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/**
 * The first written form of a key in the books of a week (K8). The order is book, speed, sentence,
 * and word. The K2 step 3 characters are removed.
 * @param week The week data.
 * @param key The word key.
 * @returns The first written form, or undefined when no book word of the week gives the key.
 */
function firstFormOf(week: { books?: { audio?: BookWords }[] }, key: string): string | undefined {
    for (const book of week.books ?? []) {
        const audio = book.audio ?? {};
        for (const sentence of [...(audio.sentences ?? []), ...(audio.slowSentences ?? [])]) {
            for (const item of sentence?.words ?? []) {
                if (typeof item?.word !== 'string') continue;
                if (bookWordKey(item.word) !== key) continue;
                return item.word.replace(/^[^A-Za-z']+/, '').replace(/[^A-Za-z']+$/, '');
            }
        }
    }
    return undefined;
}

/**
 * The weeks of one level that hold a key in a book (K6).
 * @param contentRoot The content root.
 * @param level The level.
 * @param keys The new keys of the run.
 * @returns The `weeks` value of each key, joined by `;`.
 */
function weeksOfKeys(contentRoot: string, level: number, keys: readonly string[]): Map<string, string> {
    const weeks = new Map<string, string[]>(keys.map((key) => [key, []]));
    for (let week = 1; week <= 99; week += 1) {
        const file = path.join(contentRoot, `l${level}/w${weekDigits(week)}.json`);
        if (!fs.existsSync(file)) break;
        const data = JSON.parse(fs.readFileSync(file, 'utf8')) as { books?: { audio?: BookWords }[] };
        const held = new Set((data.books ?? []).flatMap((book) => bookWordKeys(book.audio ?? {})));
        for (const key of keys) if (held.has(key)) weeks.get(key)?.push(String(week));
    }
    return new Map([...weeks].map(([key, list]) => [key, list.join(';')]));
}

/**
 * Checks the faster-whisper interpreter of a run (K9, review F4). The file must exist, and the
 * module must load.
 * @param python The interpreter path.
 * @throws Error When the interpreter or the module is absent.
 */
function checkVenv(python: string): void {
    let ok = false;
    if (fs.existsSync(python)) {
        ok = spawnSync(python, ['-c', 'import faster_whisper'], { encoding: 'utf8' }).status === 0;
    }
    if (!ok) throw new Error(`word bank: no faster-whisper venv at ${python}`);
}

/**
 * One take from mmx into a WAV file (K7).
 * @param text The text sent to TTS.
 * @param wavFile The WAV file to write.
 * @throws Error When the mmx call fails.
 */
function mmxSynthesize(text: string, wavFile: string): void {
    const run = spawnSync('mmx', [
        'speech', 'synthesize', '--model', MODEL, '--text', text, '--voice', VOICE, '--speed', String(SPEED),
        '--language', 'English', '--format', 'wav', '--sample-rate', String(RATE), '--channels', '1', '--out', wavFile,
    ], { encoding: 'utf8', timeout: 120_000 });
    if (run.status !== 0 || !fs.existsSync(wavFile)) {
        throw new Error(`word bank: mmx failed for "${text}": ${(run.stderr || run.stdout || String(run.error)).trim().slice(0, 300)}`);
    }
}

/**
 * The default recognizer: `scripts/storytime/word-times.py` with the faster-whisper interpreter (K9).
 * @param python The interpreter path.
 * @param script The script path.
 * @returns The recognized words of each WAV file.
 */
function whisperRecognize(python: string, script: string): (wavFiles: readonly string[]) => string[][] {
    return (wavFiles) => {
        const run = spawnSync(python, [script], { input: JSON.stringify(wavFiles), encoding: 'utf8' });
        if (run.status !== 0) {
            throw new Error(`word bank: word-times.py failed: ${(run.stderr || String(run.error)).trim().slice(0, 300)}`);
        }
        const parsed = JSON.parse(run.stdout) as { word: string }[][];
        return parsed.map((words) => words.map((entry) => String(entry.word)));
    };
}

/**
 * Encodes one WAV file as an mp3 of 32 kHz, mono, 128 kb/s (K7 step 4).
 * @param wavFile The WAV file.
 * @param mp3File The mp3 file to write.
 * @throws Error When ffmpeg fails.
 */
function encodeMp3(wavFile: string, mp3File: string): void {
    const run = spawnSync('ffmpeg', [
        '-y', '-loglevel', 'error', '-i', wavFile, '-codec:a', 'libmp3lame', '-b:a', '128k', mp3File,
    ], { encoding: 'utf8', timeout: 120_000 });
    if (run.status !== 0 || !fs.existsSync(mp3File)) {
        throw new Error(`word bank: ffmpeg failed: ${(run.stderr || String(run.error)).trim().slice(0, 300)}`);
    }
}

/** The accepted take of one word. */
interface AcceptedTake {
    /** The take number that stays. */
    take: number;
    /** The text of that take. */
    text: string;
    /** The heard text of that take. */
    heard: string;
    /** The note of the heard check. */
    note: string;
    /** The samples of that take. */
    samples: Int16Array;
    /** The sample rate of that take. */
    rate: number;
}

/**
 * Makes the takes of one key and keeps the take that the heard check passes (K8, K9).
 * @param key The word key.
 * @param text The first text of the key.
 * @param spentBefore The characters that the earlier keys sent.
 * @param options The options of the run.
 * @param synthesize The voice of one take.
 * @param recognize The heard words of one WAV file.
 * @param bankFolder The bank folder, for the take files.
 * @returns The accepted take, and the characters that the takes sent.
 * @throws Error When a call would take the run above the character limit.
 */
function makeTakes(
    key: string,
    text: string,
    spentBefore: number,
    options: MakeWordBankOptions,
    synthesize: (text: string, wavFile: string) => void,
    recognize: (wavFiles: readonly string[]) => string[][],
    bankFolder: string,
): { accepted: AcceptedTake; spent: number } {
    const stem = wordClipStem(key);
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    let spent = 0;
    let takeText = text;
    let last: AcceptedTake | undefined;
    for (let take = 1; take <= TAKES; take += 1) {
        if (spentBefore + spent + takeText.length > maxChars) {
            throw new Error(`word bank: the run would send more than ${maxChars} characters`);
        }
        const wavFile = path.join(bankFolder, `wa-${stem}.take${take}.wav`);
        synthesize(takeText, wavFile);
        spent += takeText.length;
        const pcm = parseWav(fs.readFileSync(wavFile));
        const words = recognize([wavFile])[0] ?? [];
        const heard = heardText(words);
        const verdict = heardPasses(key, heard);
        const pause = longestPause(pcm.samples, pcm.rate);
        last = {
            take,
            text: takeText,
            heard,
            note: verdict.pass && pause <= MAX_PAUSE_S ? verdict.note : '',
            samples: pcm.samples,
            rate: pcm.rate,
        };
        fs.rmSync(wavFile, { force: true });
        if (verdict.pass && pause <= MAX_PAUSE_S) return { accepted: last, spent };
        if (key === 'i' && NUMBER_WORDS.has(heard)) takeText = 'eye';
    }
    if (!last) throw new Error(`word bank: no take of ${key}`);
    return { accepted: { ...last, note: `heard '${last.heard}' in 3 takes` }, spent };
}

/**
 * Makes the missing word bank clips of one week (spec FR 3, K5 to K11).
 * @param options The level, the week, the bank folder, the date, and the flags.
 * @returns The new row ids, the characters sent, and the printed lines.
 * @throws Error When the week is absent, the character limit is too small, or the venv is absent.
 */
export async function makeWordBank(options: MakeWordBankOptions): Promise<MakeWordBankResult> {
    const weekFile = path.join(options.contentRoot, `l${options.level}/w${weekDigits(options.week)}.json`);
    const week = JSON.parse(fs.readFileSync(weekFile, 'utf8')) as { books?: { audio?: BookWords }[] };
    const audios = (week.books ?? []).map((book) => book.audio ?? {});
    const keys = [...new Set(audios.flatMap((audio) => bookWordKeys(audio)))].sort();
    const manifestFile = path.join(options.bankFolder, 'manifest.json');
    let manifestText = fs.readFileSync(manifestFile, 'utf8');
    const manifest = JSON.parse(manifestText) as { items: { n: number; word: string }[] };
    const present = new Set(manifest.items.map((row) => row.word));
    const missing = keys.filter((key) => !present.has(key));
    const texts = new Map(missing.map((key) => [
        key,
        wordClipText(key, firstFormOf(week, key) ?? key),
    ]));
    const oneTake = missing.reduce((sum, key) => sum + (texts.get(key)?.length ?? 0), 0);
    const lines = missing.map((key) => `${key}\t${texts.get(key) ?? ''}`);
    lines.push(`chars: ${oneTake}`);
    if (options.dryRun) return { made: [], chars: oneTake, lines };

    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    if (oneTake > maxChars) throw new Error(`word bank: the run would send more than ${maxChars} characters`);
    const python = options.whisperPython ?? process.env.WHISPER_PYTHON ?? DEFAULT_PYTHON;
    const recognize = options.recognize ?? whisperRecognize(
        expandHome(python),
        path.join(path.dirname(fileURLToPath(import.meta.url)), 'word-times.py'),
    );
    if (!options.recognize) checkVenv(expandHome(python));

    const weeks = weeksOfKeys(options.contentRoot, options.level, missing);
    const synthesize = options.synthesize ?? mmxSynthesize;
    const made: string[] = [];
    let chars = 0;
    let nextN = manifest.items.reduce((top, row) => Math.max(top, row.n), 0) + 1;
    for (const key of missing) {
        const text = texts.get(key) ?? key;
        const { accepted, spent } = makeTakes(key, text, chars, options, synthesize, recognize, options.bankFolder);
        chars += spent;
        const stem = wordClipStem(key);
        const wavFile = path.join(options.bankFolder, `wa-${stem}.wav`);
        const mp3File = path.join(options.bankFolder, `wa-${stem}.mp3`);
        const samples = normalizeWordClip(accepted.samples, accepted.rate);
        fs.writeFileSync(wavFile, writeWav({ rate: accepted.rate, samples }));
        encodeMp3(wavFile, mp3File);
        const row: WordBankRow = {
            n: nextN,
            id: `wa-${stem}`,
            word: key,
            file: `wa-${stem}.wav`,
            mp3: `wa-${stem}.mp3`,
            sources: 'book',
            weeks: weeks.get(key) ?? '',
            take: accepted.take,
            len_s: Math.round((samples.length / accepted.rate) * 1000) / 1000,
            peak_dbfs: PEAK_DBFS,
            recognized: accepted.heard,
            note: accepted.note,
            sha256: fileHash(wavFile),
        };
        if (accepted.text !== key) row.text = accepted.text;
        row.added = options.date;
        nextN += 1;
        manifestText = appendBankRows(manifestText, [row]);
        fs.writeFileSync(manifestFile, manifestText);
        made.push(row.id);
        lines.push(`made ${row.id} take ${row.take}${row.note ? ` (${row.note})` : ''}${row.text ? ` text "${row.text}"` : ''}`);
    }
    return { made, chars, lines };
}

/**
 * Runs the script with the arguments of the command line.
 * @param argv The arguments after the file name.
 * @returns The exit code: 0 for success, 1 for a data error, 2 for a usage error or an absent venv.
 */
export async function main(argv: string[]): Promise<number> {
    if (argv.includes('--help') || argv.includes('-h')) {
        console.log(USAGE);
        return 0;
    }
    const value = (flag: string): string | undefined => {
        const at = argv.indexOf(flag);
        return at >= 0 ? argv[at + 1] : undefined;
    };
    const level = Number(value('--level'));
    const week = Number(value('--week'));
    const maxCharsText = value('--max-chars');
    const maxChars = maxCharsText === undefined ? DEFAULT_MAX_CHARS : Number(maxCharsText);
    if (
        !Number.isInteger(level) || level < 1 || level > 4
        || !Number.isInteger(week) || week < 1 || week > 99
        || !Number.isInteger(maxChars) || maxChars < 1
    ) {
        console.error(USAGE);
        return 2;
    }
    const dryRun = argv.includes('--dry-run');
    try {
        const result = await makeWordBank({
            level,
            week,
            contentRoot: STORYTIME_ROOT,
            bankFolder: path.join(STORYTIME_ROOT, 'words'),
            date: new Date().toISOString().slice(0, 10),
            maxChars,
            dryRun,
        });
        for (const line of result.lines) console.log(line);
        if (!dryRun) console.log(`made: ${result.made.length}`);
        return 0;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message);
        return message.startsWith('word bank: no faster-whisper venv') ? 2 : 1;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).then((code) => {
        process.exitCode = code;
    });
}
