import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { longestPause, parseWav, trimSilence, VOICES, writeWav } from '../../lib/media/audio';
import { MAX_PAUSE_S } from '../../lib/media/make-clip';
import { BOOK_SPEEDS } from '../../lib/storytime/book-audio';
import { STORYTIME_ROOT } from '../../lib/storytime/files';
import {
    planSentenceClips,
    sentenceHeardPasses,
    sentenceLengthBounds,
    type PlannedSentence,
} from '../../lib/storytime/sentence-clips';

/**
 * The sentence clip maker of the Storytime app (Phase 12, spec FR 5, decisions L7, L8, and L11).
 * A run makes one whole-sentence clip for each sentence of each decodable book of one week: one
 * mmx call for each take, the voice of the book, the speed 1, the heard check, the length check,
 * and the pause check of K7 and L8. A clip is never a cut of a book mp3 and never a read of the
 * clip cache: this script does not open the book audio file. It writes the mp3 clips and the
 * provenance file `sentences/manifest.json` of the week, and no WAV file ships.
 *
 * A run without `--dry-run` makes paid mmx calls. Each run of the script in a track task goes
 * inside one heavy-run job.
 */

/** The usage text of the script. */
const USAGE = `Makes the sentence clips of one Storytime week (Phase 12, spec FR 5).

Usage: npx tsx scripts/storytime/make-sentence-clips.ts --level <n> --week <n> [--max-chars <n>] [--dry-run]

--level      The level of the week.
--week       The week.
--max-chars  The character limit of the run, all takes included (default 2400).
--dry-run    List each sentence, print the characters of one take of each sentence, and write nothing.

One mp3 clip per sentence of each decodable book goes into
content/storytime/l2/media/w<nn>/sentences/, with the provenance file manifest.json of that folder.
A run stops with exit 2 when the faster-whisper venv is absent, before the first mmx call.`;

/** The mmx model of the clips (L8). */
const MODEL = 'speech-2.8-hd';

/** The sample rate, the peak level, and the mp3 bit rate of a clip (K7, L8). */
const RATE = 32000;
const PEAK_DBFS = -3;
const PEAK_SAMPLE = 23197;
const QUIET_THRESHOLD = 103;
const EDGE_PAD_MS = 80;
const MP3_KBIT_S = 128;

/** The speed of a sentence clip (L8). */
const SPEED = BOOK_SPEEDS.normal;

/** The takes of one sentence at most (L8). */
const TAKES = 3;

/** The character limit of a run, all takes included (L11). */
const DEFAULT_MAX_CHARS = 2400;

/** The default faster-whisper interpreter (K9). */
const DEFAULT_PYTHON = '~/.local/share/storytime-word-audio-venv/bin/python';

/** The item of the provenance file (L8). */
export interface SentenceClipItem {
    /** The 0-based index of the book. */
    book: number;
    /** The 1-based index of the sentence in its book. */
    n: number;
    /** The sentence text. */
    text: string;
    /** The clip path, relative to the content root. */
    file: string;
    /** The take that stays. */
    take: number;
    /** The length of the clip, in seconds, to 3 decimals. */
    len_s: number;
    /** The peak level: -3.0. */
    peak_dbfs: number;
    /** The heard words of the take, joined by one space. */
    recognized: string;
    /** The note of the failed check, empty for a clean take. */
    note: string;
    /** The SHA-256 of the mp3 file. */
    sha256: string;
}

/** The options of one run (spec FR 5). */
export interface MakeSentenceClipsOptions {
    /** The level of the week. */
    level: number;
    /** The week. */
    week: number;
    /** The content root that holds the week files. */
    contentRoot: string;
    /** The character limit of the run. The default is 2400. */
    maxChars?: number;
    /** Lists each sentence and writes nothing. */
    dryRun?: boolean;
    /** The voice of one take. The default runs mmx (L8). */
    synthesize?: (text: string, wavFile: string, voice: string, speed: number) => void;
    /** The recognized words of each WAV file. The default runs `word-times.py` (K9). */
    recognize?: (wavFiles: readonly string[]) => string[][];
    /** The faster-whisper interpreter of the default `recognize`. */
    whisperPython?: string;
}

/** The result of one run. */
export interface MakeSentenceClipsResult {
    /** The relative path of each clip, in the order of the plan. */
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
 * Checks the faster-whisper interpreter of a run (K9). The file must exist, and the module must
 * load.
 * @param python The interpreter path.
 * @throws Error When the interpreter or the module is absent.
 */
function checkVenv(python: string): void {
    let ok = false;
    if (fs.existsSync(python)) {
        ok = spawnSync(python, ['-c', 'import faster_whisper'], { encoding: 'utf8' }).status === 0;
    }
    if (!ok) throw new Error(`sentence clips: no faster-whisper venv at ${python}`);
}

/**
 * One take from mmx into a WAV file (L8).
 * @param text The text sent to TTS.
 * @param wavFile The WAV file to write.
 * @param voice The voice of the book.
 * @throws Error When the mmx call fails.
 */
function mmxSynthesize(text: string, wavFile: string, voice: string, speed: number): void {
    const run = spawnSync('mmx', [
        'speech', 'synthesize', '--model', MODEL, '--text', text, '--voice', voice, '--speed', String(speed),
        '--language', 'English', '--format', 'wav', '--sample-rate', String(RATE), '--channels', '1', '--out', wavFile,
    ], { encoding: 'utf8', timeout: 120_000 });
    if (run.status !== 0 || !fs.existsSync(wavFile)) {
        throw new Error(`sentence clips: mmx failed for "${text}": ${(run.stderr || run.stdout || String(run.error)).trim().slice(0, 300)}`);
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
            throw new Error(`sentence clips: word-times.py failed: ${(run.stderr || String(run.error)).trim().slice(0, 300)}`);
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
        '-y', '-loglevel', 'error', '-i', wavFile, '-codec:a', 'libmp3lame', '-b:a', `${MP3_KBIT_S}k`, mp3File,
    ], { encoding: 'utf8', timeout: 120_000 });
    if (run.status !== 0 || !fs.existsSync(mp3File)) {
        throw new Error(`sentence clips: ffmpeg failed: ${(run.stderr || String(run.error)).trim().slice(0, 300)}`);
    }
}

/**
 * Scales one take to the peak sample and trims its edges to 80 ms of quiet (K7 steps 1 and 2).
 * @param samples The samples of the take.
 * @returns The scaled and trimmed samples.
 */
function normalizeClip(samples: Int16Array): Int16Array {
    let peak = 0;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    if (peak === 0) return new Int16Array(0);
    const scaled = new Int16Array(samples.length);
    for (let index = 0; index < samples.length; index += 1) {
        scaled[index] = Math.round((samples[index] * PEAK_SAMPLE) / peak);
    }
    return trimSilence(scaled, RATE, { threshold: QUIET_THRESHOLD, padMs: EDGE_PAD_MS });
}

/** The accepted take of one sentence. */
interface AcceptedSentenceTake {
    /** The take number that stays. */
    take: number;
    /** The recognized words of that take. */
    heard: string[];
    /** The note of the failed check, empty for a clean take. */
    note: string;
    /** The normalized samples of that take. */
    samples: Int16Array;
}

/**
 * Makes the takes of one sentence and keeps the take that passes the heard check, the length
 * check, and the pause check (L8).
 * @param item The planned sentence.
 * @param voice The voice of the book.
 * @param spentBefore The characters that the earlier sentences sent.
 * @param maxChars The character limit of the run.
 * @param folder The folder of the take files.
 * @param synthesize The voice of one take.
 * @param recognize The heard words of one WAV file.
 * @returns The accepted take and the characters that the takes sent.
 * @throws Error When a call would take the run above the character limit.
 */
function makeSentenceTakes(
    item: PlannedSentence,
    voice: string,
    spentBefore: number,
    maxChars: number,
    folder: string,
    synthesize: (text: string, wavFile: string, voice: string, speed: number) => void,
    recognize: (wavFiles: readonly string[]) => string[][],
): { accepted: AcceptedSentenceTake; spent: number } {
    const stem = path.basename(item.file, '.mp3');
    const bounds = sentenceLengthBounds(item.text);
    let spent = 0;
    let last: AcceptedSentenceTake | undefined;
    for (let take = 1; take <= TAKES; take += 1) {
        if (spentBefore + spent + item.text.length > maxChars) {
            throw new Error(`sentence clips: the run would send more than ${maxChars} characters`);
        }
        const wavFile = path.join(folder, `${stem}.take${take}.wav`);
        synthesize(item.text, wavFile, voice, SPEED);
        spent += item.text.length;
        const pcm = parseWav(fs.readFileSync(wavFile));
        const samples = normalizeClip(pcm.samples);
        const lenS = samples.length / RATE;
        const heard = recognize([wavFile])[0] ?? [];
        const pause = longestPause(samples, RATE);
        fs.rmSync(wavFile, { force: true });
        let note = '';
        if (!sentenceHeardPasses(item.text, heard)) note = `heard '${heard.join(' ')}'`;
        else if (lenS < bounds.min || lenS > bounds.max) note = `length ${lenS.toFixed(3)}s outside ${bounds.min}s..${bounds.max}s`;
        else if (pause > MAX_PAUSE_S) note = `pause ${pause.toFixed(3)}s over ${MAX_PAUSE_S}s`;
        last = { take, heard, note, samples };
        if (!note) return { accepted: last, spent };
    }
    if (!last) throw new Error(`sentence clips: no take of ${item.text}`);
    return { accepted: { ...last, note: `${last.note} in 3 takes` }, spent };
}

/**
 * Makes the sentence clips of one week (spec FR 5, L7, L8, and L11).
 * @param options The level, the week, the content root, and the flags.
 * @returns The clip paths, the characters sent, and the printed lines.
 * @throws Error When the week is absent, the character limit is too small, or the venv is absent.
 */
export async function makeSentenceClips(options: MakeSentenceClipsOptions): Promise<MakeSentenceClipsResult> {
    const weekFile = path.join(options.contentRoot, `l${options.level}/w${weekDigits(options.week)}.json`);
    const week = JSON.parse(fs.readFileSync(weekFile, 'utf8')) as {
        books?: { kind?: string; audio?: { voice?: string; sentences?: { sentence?: string }[] } }[];
    };
    const plan = planSentenceClips({ level: options.level, week: options.week, books: week.books ?? [] });
    const oneTake = plan.reduce((sum, item) => sum + item.text.length, 0);
    const lines = plan.map((item) => `${item.file}\t${item.text}`);
    lines.push(`chars: ${oneTake}`);
    if (options.dryRun) return { made: [], chars: oneTake, lines };

    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    if (oneTake > maxChars) throw new Error(`sentence clips: the run would send more than ${maxChars} characters`);
    const python = options.whisperPython ?? process.env.WHISPER_PYTHON ?? DEFAULT_PYTHON;
    const recognize = options.recognize ?? whisperRecognize(
        expandHome(python),
        path.join(path.dirname(fileURLToPath(import.meta.url)), 'word-times.py'),
    );
    if (!options.recognize) checkVenv(expandHome(python));

    const voices = new Map<number, string>();
    (week.books ?? []).forEach((book, index) => {
        if (book?.kind === 'decodable') voices.set(index, book.audio?.voice ?? VOICES.female);
    });
    const folder = path.join(options.contentRoot, `l${options.level}/media/w${weekDigits(options.week)}/sentences`);
    const synthesize = options.synthesize ?? mmxSynthesize;
    const items: SentenceClipItem[] = [];
    const made: string[] = [];
    let chars = 0;
    for (const item of plan) {
        const voice = voices.get(item.book) ?? VOICES.female;
        const { accepted, spent } = makeSentenceTakes(item, voice, chars, maxChars, folder, synthesize, recognize);
        chars += spent;
        fs.mkdirSync(folder, { recursive: true });
        const wavFile = path.join(folder, `${path.basename(item.file, '.mp3')}.wav`);
        const mp3File = path.join(folder, path.basename(item.file));
        fs.writeFileSync(wavFile, writeWav({ rate: RATE, samples: accepted.samples }));
        encodeMp3(wavFile, mp3File);
        fs.rmSync(wavFile, { force: true });
        items.push({
            book: item.book,
            n: item.n,
            text: item.text,
            file: item.file,
            take: accepted.take,
            len_s: Math.round((accepted.samples.length / RATE) * 1000) / 1000,
            peak_dbfs: PEAK_DBFS,
            recognized: accepted.heard.join(' '),
            note: accepted.note,
            sha256: fileHash(mp3File),
        });
        made.push(item.file);
        lines.push(`made ${item.file} take ${accepted.take}${accepted.note ? ` (${accepted.note})` : ''}`);
    }
    if (items.length) {
        const voice = voices.get(items[0].book) ?? VOICES.female;
        const provenance = { voice, speed: SPEED, model: MODEL, items };
        fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(path.join(folder, 'manifest.json'), `${JSON.stringify(provenance, null, 1)}\n`);
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
        const result = await makeSentenceClips({
            level,
            week,
            contentRoot: STORYTIME_ROOT,
            maxChars,
            dryRun,
        });
        for (const line of result.lines) console.log(line);
        if (!dryRun) console.log(`made: ${result.made.length}`);
        return 0;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message);
        return message.startsWith('sentence clips: no faster-whisper venv') ? 2 : 1;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main(process.argv.slice(2)).then((code) => {
        process.exitCode = code;
    });
}
