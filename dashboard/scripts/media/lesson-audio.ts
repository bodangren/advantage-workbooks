import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { LessonPackageSchema, type LessonPackage } from '../../lib/lesson-package/schema';
import { checkContextFor } from '../../lib/lesson-package/context';
import { savePackage } from '../../lib/lesson-package/store';
import { DEFAULT_GAPS, audioClips, clipKey, flashcardSentences, joinClips, longestPause, parseWav, speechArgs, trimSilence, writeWav, type Clip } from '../../lib/media/audio';

const DEFAULT_VOICE = 'English_expressive_narrator';
const DEFAULT_SPEED = 0.75;
/** An inner pause longer than this marks a bad take; the clip is made again (two more tries at most). */
const MAX_PAUSE_S = 0.6;
const TRIES = 3;

const USAGE = `Makes the article and word audio for a lesson package with mmx (track lesson_media_20261001).

Usage: npx tsx scripts/media/lesson-audio.ts <package.json> [options]

Options:
  --voice <id>             mmx voice (default: the package's audio.voice, or ${DEFAULT_VOICE})
  --speed <n>              Speed multiplier (default ${DEFAULT_SPEED})
  --dry-run                List the clips and which are cached; make nothing
  --redo <n,...>           Make these article sentences again (1-based; a word: w1, w2, ...)
  --samples <a,b,c>        Make paragraph 1 in each voice into <media>/samples/ for Daniel; the
                           package does not change

Each sentence (from the Thai part) and each glossary word is one WAV clip, cached in
<book>/media/<lesson>/.clips/ by voice, speed, and text. The clips are trimmed and joined with
fixed gaps into article.mp3, words.mp3, and sentences.mp3 (3 to 5 flashcard sentences), and the exact
times go into the package (audio part
back to draft). A clip with an inner pause over ${MAX_PAUSE_S} s is made again (${TRIES} tries; the take
with the shortest pause stays). Jobs run one at a time (mmx gives no output for parallel calls).`;

interface Options {
    file: string;
    voice?: string;
    speed: number;
    dryRun: boolean;
    samples?: string[];
    redo: string[];
}

function parseArgs(argv: string[]): Options | number {
    const opts: Partial<Options> = { speed: DEFAULT_SPEED, dryRun: false, redo: [] };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--voice') opts.voice = argv[++i];
        else if (a === '--speed') opts.speed = Number(argv[++i]);
        else if (a === '--dry-run') opts.dryRun = true;
        else if (a === '--redo') opts.redo = argv[++i].split(',').map((s) => s.trim().toLowerCase());
        else if (a === '--samples') opts.samples = argv[++i].split(',').map((s) => s.trim());
        else if (!a.startsWith('--') && !opts.file) opts.file = path.resolve(a);
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (!opts.file || !Number.isFinite(opts.speed)) {
        console.error(USAGE);
        return 2;
    }
    return opts as Options;
}

/** The Thai part's English sentences must join to each paragraph, or the audio would not match the text. */
function sentenceMismatch(pkg: LessonPackage): number | undefined {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    const bad = pkg.text.paragraphs.findIndex((p, i) => norm((pkg.thai.paragraphs[i] ?? []).map((s) => s.en).join(' ')) !== norm(p));
    return bad >= 0 ? bad + 1 : undefined;
}

/** One take from mmx into `file`. */
function take(text: string, voice: string, speed: number, file: string) {
    const tmp = `${file}.part.wav`;
    const run = spawnSync('mmx', speechArgs(text, voice, speed, tmp), { encoding: 'utf8', timeout: 120_000 });
    if (run.status !== 0 || !fs.existsSync(tmp)) {
        throw new Error(`mmx failed for "${text}": ${(run.stderr || run.stdout || String(run.error)).trim().slice(0, 300)}`);
    }
    fs.renameSync(tmp, file);
}

const readClip = (file: string) => {
    const pcm = parseWav(fs.readFileSync(file));
    const samples = trimSilence(pcm.samples, pcm.rate);
    return { rate: pcm.rate, samples, pause: longestPause(samples, pcm.rate) };
};

/** Makes one clip (with retries for a bad take), or reads it from the cache. */
function clip(text: string, voice: string, speed: number, cache: string, redo: boolean): { rate: number; samples: Int16Array } {
    const file = path.join(cache, `${clipKey(text, voice, speed)}.wav`);
    if (redo) fs.rmSync(file, { force: true });
    if (fs.existsSync(file)) return readClip(file);
    let best: { file: string; pause: number } | undefined;
    for (let t = 1; t <= TRIES; t++) {
        const attempt = `${file}.take${t}.wav`;
        take(text, voice, speed, attempt);
        const { pause } = readClip(attempt);
        if (!best || pause < best.pause) best = { file: attempt, pause };
        if (pause <= MAX_PAUSE_S) break;
        process.stdout.write(`    take ${t}: pause ${pause.toFixed(2)} s${t < TRIES ? ', again' : ''}\n`);
    }
    fs.renameSync(best!.file, file);
    for (let t = 1; t <= TRIES; t++) fs.rmSync(`${file}.take${t}.wav`, { force: true });
    return readClip(file);
}

function render(clips: Omit<Clip, 'samples'>[], voice: string, speed: number, cache: string, out: string, redo: (i: number) => boolean = () => false) {
    let rate = 0;
    const full: Clip[] = clips.map((c, i) => {
        process.stdout.write(`  ${i + 1}/${clips.length} ${c.text}\n`);
        const made = clip(c.text, voice, speed, cache, redo(i));
        if (rate && made.rate !== rate) throw new Error(`Sample rates differ: ${made.rate} and ${rate}`);
        rate = made.rate;
        return { ...c, samples: made.samples };
    });
    const joined = joinClips(full, rate);
    const wav = path.join(os.tmpdir(), `lesson-audio-${process.pid}.wav`);
    fs.writeFileSync(wav, writeWav({ rate, samples: joined.samples }));
    const enc = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '4', out], { encoding: 'utf8' });
    fs.rmSync(wav, { force: true });
    if (enc.status !== 0) throw new Error(`ffmpeg failed: ${enc.stderr.trim()}`);
    return joined.timings;
}

function main(argv: string[]): number {
    const opts = parseArgs(argv);
    if (typeof opts === 'number') return opts;
    const parsed = LessonPackageSchema.safeParse(JSON.parse(fs.readFileSync(opts.file, 'utf8')));
    if (!parsed.success) {
        console.error(`The package does not parse: ${parsed.error.issues[0]?.message}`);
        return 1;
    }
    const pkg = parsed.data;
    const bad = sentenceMismatch(pkg);
    if (bad) {
        console.error(`The Thai part's English sentences do not match paragraph ${bad}. Fix the Thai part first.`);
        return 1;
    }
    const root = path.dirname(path.dirname(opts.file));
    const book = path.basename(path.dirname(opts.file));
    const lesson = path.basename(opts.file, '.json');
    const mediaRel = path.join(book, 'media', lesson);
    const media = path.join(root, mediaRel);
    const cache = path.join(media, '.clips');
    fs.mkdirSync(cache, { recursive: true });
    const voice = opts.voice ?? pkg.audio.voice ?? DEFAULT_VOICE;
    const clips = audioClips(pkg);

    if (opts.dryRun) {
        for (const c of [...clips.article, ...clips.words]) {
            const cached = fs.existsSync(path.join(cache, `${clipKey(c.text, voice, opts.speed)}.wav`));
            console.log(`${cached ? 'cached' : 'new   '}  ${c.text}`);
        }
        return 0;
    }

    if (opts.samples) {
        const dir = path.join(media, 'samples');
        fs.mkdirSync(dir, { recursive: true });
        const first = clips.article.filter((_, i) => pkg.thai.paragraphs[0] && i < pkg.thai.paragraphs[0].length);
        for (const v of opts.samples) {
            console.log(`Sample: ${v}`);
            render(first.map((c, i) => (i === first.length - 1 ? { ...c, gapAfterMs: 0 } : c)), v, opts.speed, cache, path.join(dir, `${v}.mp3`));
        }
        console.log(`Samples in ${path.relative(process.cwd(), dir)}`);
        return 0;
    }

    console.log(`Article (${clips.article.length} sentences, voice ${voice}, speed ${opts.speed})`);
    const sentences = render(clips.article, voice, opts.speed, cache, path.join(media, 'article.mp3'), (i) => opts.redo.includes(String(i + 1)));
    console.log(`Words (${clips.words.length})`);
    const wordTimes = render(clips.words, voice, opts.speed, cache, path.join(media, 'words.mp3'), (i) => opts.redo.includes(`w${i + 1}`));
    // The app's flashcards: 3 to 5 sentences, joined from the article clips (cached, so no new TTS).
    const cards = flashcardSentences(pkg);
    console.log(`Flashcard sentences (${cards.length})`);
    const flashcardTimes = render(
        cards.map((text, i) => ({ text, gapAfterMs: i === cards.length - 1 ? 0 : DEFAULT_GAPS.paragraphGapMs })),
        voice,
        opts.speed,
        cache,
        path.join(media, 'sentences.mp3'),
    );
    pkg.audio = {
        voice,
        article: path.join(mediaRel, 'article.mp3'),
        sentences,
        words: path.join(mediaRel, 'words.mp3'),
        wordTimes,
        flashcard: path.join(mediaRel, 'sentences.mp3'),
        flashcardTimes,
    };
    const result = savePackage(root, book, lesson, pkg, checkContextFor);
    console.log(`Saved ${path.relative(process.cwd(), opts.file)}; audio approval: ${result.pkg?.approval.audio.status}`);
    return 0;
}

try {
    process.exitCode = main(process.argv.slice(2));
} catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
}
