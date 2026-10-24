import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { VOICES, clipKey, joinClips, writeWav, type Clip, type Pcm } from '../../lib/media/audio';
import { encodeMp3, makeClip } from '../../lib/media/make-clip';
import { BOOK_SPEEDS, bookAudioName, bookClips, bookSentences, bookTimepoints, heardMatches, type WordTime } from '../../lib/storytime/book-audio';
import { STORYTIME_ROOT, storytimeMediaDir, storytimeWeekFile } from '../../lib/storytime/files';
import { StorytimeWeekSchema } from '../../lib/storytime/schema';

/** The takes of a clip that the recognizer hears as other words ("Nan cannot." for "Nan can nod!"). */
const HEARD_TAKES = 3;

const USAGE = `Makes the book audio of a Storytime week with mmx (S30, Storytime 2026-10-23).

Usage: npx tsx scripts/storytime/book-audio.ts --level <n> --week <n> [options]

Options:
  --voice <id>     The narrator voice (default: the book's audio.voice, or ${VOICES.female})
  --books <i,...>  Only these books (0-based; default: every book of the week)
  --dry-run        List the clips and which are cached; make nothing
  --clips-only     Make the mmx clips into the cache and stop (no word times, no files, no package change)

Each sentence of the pages is one mmx clip at speed ${BOOK_SPEEDS.normal} and one at ${BOOK_SPEEDS.slow}. The clips are cached as
Opus in <media>/.clips/ (lib/media/clip-cache.ts) and joined into <media>/books/<n>-<title>.mp3 and
<n>-<title>-slow.mp3, with a short gap in a page and a long gap at a page turn. The sentence times come
from the sample counts. The word times come from faster-whisper (scripts/storytime/word-times.py, run
with $WHISPER_PYTHON, default python3) and are cached next to the clip; when the recognizer hears
another number of words, the letter counts split the clip. A clip that the recognizer hears as other
words is made again (${HEARD_TAKES} takes at most; a last bad take stays with a warning). The audio goes into books[].audio.`;

interface Options {
    level: number;
    week: number;
    voice?: string;
    books?: number[];
    dryRun: boolean;
    clipsOnly: boolean;
}

function parseArgs(argv: string[]): Options | number {
    const opts: Partial<Options> = { dryRun: false, clipsOnly: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--level') opts.level = Number(argv[++i]);
        else if (a === '--week') opts.week = Number(argv[++i]);
        else if (a === '--voice') opts.voice = argv[++i];
        else if (a === '--books') opts.books = argv[++i].split(',').map(Number);
        else if (a === '--dry-run') opts.dryRun = true;
        else if (a === '--clips-only') opts.clipsOnly = true;
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (!(opts.level! >= 1) || !(opts.week! >= 1)) {
        console.error(USAGE);
        return 2;
    }
    return opts as Options;
}

/**
 * The recognized words of each clip: from the cache, else from one faster-whisper run for all the
 * clips that are not cached.
 */
function heardWords(clips: { key: string; pcm: Pcm }[], cache: string): WordTime[][] {
    const file = (key: string) => path.join(cache, `${key}.words.json`);
    const missing = [...new Map(clips.filter((c) => !fs.existsSync(file(c.key))).map((c) => [c.key, c])).values()];
    if (missing.length) {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'book-audio-'));
        const wavs = missing.map((c) => {
            const wav = path.join(tmp, `${c.key}.wav`);
            fs.writeFileSync(wav, writeWav(c.pcm));
            return wav;
        });
        process.stdout.write(`  word times: ${missing.length} clips\n`);
        const run = spawnSync(process.env.WHISPER_PYTHON ?? 'python3', [path.join(__dirname, 'word-times.py')], {
            input: JSON.stringify(wavs),
            encoding: 'utf8',
            maxBuffer: 1 << 26,
        });
        fs.rmSync(tmp, { recursive: true, force: true });
        if (run.status !== 0) throw new Error(`word-times.py failed: ${(run.stderr || String(run.error)).trim().slice(-500)}`);
        const words: WordTime[][] = JSON.parse(run.stdout);
        missing.forEach((c, i) => fs.writeFileSync(file(c.key), JSON.stringify(words[i]) + '\n'));
    }
    return clips.map((c) => JSON.parse(fs.readFileSync(file(c.key), 'utf8')));
}

function main(argv: string[]): number {
    const opts = parseArgs(argv);
    if (typeof opts === 'number') return opts;
    const weekFile = storytimeWeekFile(STORYTIME_ROOT, opts.level, opts.week);
    const week = StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(weekFile, 'utf8')));
    const media = storytimeMediaDir(STORYTIME_ROOT, opts.level, opts.week);
    const mediaRel = path.relative(STORYTIME_ROOT, media);
    const cache = path.join(media, '.clips');
    const out = path.join(media, 'books');
    const indexes = opts.books ?? week.books.map((_, i) => i);

    if (opts.dryRun) {
        for (const i of indexes) {
            const book = week.books[i];
            const voice = opts.voice ?? book.audio.voice ?? VOICES.female;
            console.log(`Book ${i} "${book.title}" (voice ${voice})`);
            for (const s of bookSentences(book)) {
                const cached = Object.values(BOOK_SPEEDS).map((speed) => (fs.existsSync(path.join(cache, `${clipKey(s.text, voice, speed)}.opus`)) ? 'cached' : 'new   '));
                console.log(`  ${cached.join(' ')}  p${s.page}  ${s.text}`);
            }
        }
        return 0;
    }

    fs.mkdirSync(cache, { recursive: true });
    if (opts.clipsOnly) {
        for (const i of indexes) {
            const book = week.books[i];
            const voice = opts.voice ?? book.audio.voice ?? VOICES.female;
            const texts = [...new Set(bookSentences(book).map((s) => s.text))];
            console.log(`Book ${i} "${book.title}": ${texts.length} clips at each speed (voice ${voice})`);
            for (const speed of Object.values(BOOK_SPEEDS)) for (const text of texts) makeClip(text, voice, speed, cache);
        }
        return 0;
    }
    fs.mkdirSync(out, { recursive: true });
    const audio: Record<number, unknown> = {};
    for (const i of indexes) {
        const book = week.books[i];
        const voice = opts.voice ?? book.audio.voice ?? VOICES.female;
        const sentences = bookSentences(book);
        const clips = bookClips(sentences);
        const value: Record<string, unknown> = { voice };
        for (const [speedName, speed] of Object.entries(BOOK_SPEEDS)) {
            const slow = speedName === 'slow';
            console.log(`Book ${i} "${book.title}" at ${speed} (${clips.length} sentences, voice ${voice})`);
            let rate = 0;
            let made: { key: string; pcm: Pcm }[] = [];
            let heard: WordTime[][] = [];
            for (let take = 1; ; take++) {
                made = clips.map((c, n) => {
                    process.stdout.write(`  ${n + 1}/${clips.length} ${c.text}\n`);
                    const pcm = makeClip(c.text, voice, speed, cache);
                    if (rate && pcm.rate !== rate) throw new Error(`Sample rates differ: ${pcm.rate} and ${rate}`);
                    rate = pcm.rate;
                    return { key: clipKey(c.text, voice, speed), pcm };
                });
                heard = heardWords(made, cache);
                const bad = clips.flatMap((c, n) => (heardMatches(c.text, heard[n]) ? [] : [n]));
                for (const n of bad) {
                    const said = heard[n].map((w) => w.word).join(' ');
                    process.stdout.write(`    take ${take}: "${clips[n].text}" sounds like "${said}"${take < HEARD_TAKES ? ', again' : ' (kept: listen to it)'}\n`);
                }
                if (!bad.length || take === HEARD_TAKES) break;
                for (const n of bad) for (const ext of ['opus', 'words.json']) fs.rmSync(path.join(cache, `${made[n].key}.${ext}`), { force: true });
            }
            const joined = joinClips(
                clips.map((c, n): Clip => ({ ...c, samples: made[n].pcm.samples })),
                rate,
            );
            const name = bookAudioName(i, book.title, slow);
            encodeMp3(rate, joined.samples, path.join(out, name));
            const timepoints = bookTimepoints(sentences, joined.timings, heard);
            value[slow ? 'slowFile' : 'file'] = path.join(mediaRel, 'books', name);
            value[slow ? 'slowSentences' : 'sentences'] = timepoints;
        }
        audio[i] = value;
    }
    const merge = spawnSync('python3', [path.join(__dirname, 'set-book-audio.py'), weekFile], { input: JSON.stringify(audio), encoding: 'utf8' });
    if (merge.status !== 0) throw new Error(`set-book-audio.py failed: ${(merge.stderr || String(merge.error)).trim()}`);
    StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(weekFile, 'utf8')));
    console.log(`Saved the audio of ${indexes.length} books in ${path.relative(process.cwd(), weekFile)}`);
    return 0;
}

try {
    process.exitCode = main(process.argv.slice(2));
} catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
}
