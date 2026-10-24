import fs from 'fs';
import path from 'path';
import { LessonPackageSchema, type LessonPackage } from '../../lib/lesson-package/schema';
import { checkContextFor } from '../../lib/lesson-package/context';
import { savePackage } from '../../lib/lesson-package/store';
import { DEFAULT_GAPS, VOICES, audioClips, clipKey, flashcardSentences, joinClips, voicesFor, type Clip } from '../../lib/media/audio';
import { MAX_PAUSE_S, TRIES, encodeMp3, makeClip } from '../../lib/media/make-clip';
import { tutorClips, tutorItems } from '../../lib/media/tutor-audio';

const DEFAULT_SPEED = 0.75;

const USAGE = `Makes the audio for a lesson package with mmx (track lesson_media_20261001).

Usage: npx tsx scripts/media/lesson-audio.ts <package.json> [options]

Options:
  --voice <id>             Narrator voice for the story (default: audio.voice, or ${VOICES.female}).
                           Use ${VOICES.male} when a boy or a man tells the story.
  --teacher-voice <id>     Voice for words, questions, and options (default: audio.teacherVoice, or ${VOICES.female})
  --speed <n>              Speed multiplier (default ${DEFAULT_SPEED})
  --dry-run                List the clips and which are cached; make nothing
  --redo <n,...>           Make these clips again: article sentence n (1-based), word wN, or a Tutor clip id
  --samples <a,b,c>        Make paragraph 1 in each voice into <media>/samples/ for Daniel; the
                           package does not change

Each sentence (from the Thai part), word, question, and option is one clip (a WAV from mmx). The clip
is trimmed and cached as Opus (64 kbps, with its exact sample count) in <book>/media/<lesson>/.clips/
by voice, speed, and text; an old WAV in the cache becomes Opus when it is used. The clips are joined
with fixed gaps into article.mp3 (narrator), words.mp3 (teacher), and sentences.mp3 (3 to 5 flashcard sentences,
narrator). Each clip is also one mp3 in tutor/ with Tutor Advantage's id (lib/media/tutor-audio.ts).
The exact times go into the package (audio part back to draft). A clip with an inner pause over
${MAX_PAUSE_S} s is made again (${TRIES} tries; the take with the shortest pause stays). Jobs run one at a
time (mmx gives no output for parallel calls).`;

interface Options {
    file: string;
    voice?: string;
    teacherVoice?: string;
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
        else if (a === '--teacher-voice') opts.teacherVoice = argv[++i];
        else if (a === '--speed') opts.speed = Number(argv[++i]);
        else if (a === '--dry-run') opts.dryRun = true;
        else if (a === '--redo') opts.redo = argv[++i].split(',').map((s) => s.trim());
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

function render(clips: Omit<Clip, 'samples'>[], voice: string, speed: number, cache: string, out: string, redo: (i: number) => boolean = () => false) {
    let rate = 0;
    const full: Clip[] = clips.map((c, i) => {
        process.stdout.write(`  ${i + 1}/${clips.length} ${c.text}\n`);
        const made = makeClip(c.text, voice, speed, cache, redo(i));
        if (rate && made.rate !== rate) throw new Error(`Sample rates differ: ${made.rate} and ${rate}`);
        rate = made.rate;
        return { ...c, samples: made.samples };
    });
    const joined = joinClips(full, rate);
    encodeMp3(rate, joined.samples, out);
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
    const voices = voicesFor(pkg);
    const voice = opts.voice ?? voices.narrator;
    const teacher = opts.teacherVoice ?? voices.teacher;
    const clips = audioClips(pkg);
    // Bank articles are online only: no Tutor Advantage clips (track level_banks_20261002).
    const tutor = pkg.meta.role === 'bank' ? [] : tutorClips(tutorItems(pkg));
    const voiceOf = (role: 'narrator' | 'teacher') => (role === 'narrator' ? voice : teacher);

    if (opts.dryRun) {
        const all = [...clips.article.map((c) => ({ text: c.text, v: voice })), ...tutor.map((c) => ({ text: c.text, v: voiceOf(c.role) }))];
        const seen = new Set<string>();
        for (const c of all) {
            const key = clipKey(c.text, c.v, opts.speed);
            if (seen.has(key)) continue;
            seen.add(key);
            const cached = ['opus', 'wav'].some((ext) => fs.existsSync(path.join(cache, `${key}.${ext}`)));
            console.log(`${cached ? 'cached' : 'new   '}  ${c.v === voice ? 'N' : 'T'}  ${c.text}`);
        }
        console.log(`${seen.size} clips (N narrator ${voice}, T teacher ${teacher})`);
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
    console.log(`Words (${clips.words.length}, voice ${teacher})`);
    const wordTimes = render(clips.words, teacher, opts.speed, cache, path.join(media, 'words.mp3'), (i) => opts.redo.includes(`w${i + 1}`));
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
    // Tutor Advantage: one mp3 per clip, named with Tutor's id. Old files (changed text) go.
    const tutorDir = path.join(media, 'tutor');
    const bank = pkg.meta.role === 'bank';
    if (!bank) {
        fs.mkdirSync(tutorDir, { recursive: true });
        console.log(`Tutor clips (${tutor.length})`);
        tutor.forEach((c, i) => {
            process.stdout.write(`  ${i + 1}/${tutor.length} ${c.text}\n`);
            const made = makeClip(c.text, voiceOf(c.role), opts.speed, cache, opts.redo.includes(c.id));
            encodeMp3(made.rate, made.samples, path.join(tutorDir, `${c.id}.mp3`));
        });
        const keep = new Set(tutor.map((c) => `${c.id}.mp3`));
        for (const f of fs.readdirSync(tutorDir)) if (!keep.has(f)) fs.rmSync(path.join(tutorDir, f));
    }
    // A writer can rebuild the package while the audio is made: save the audio into the package as
    // it is on disk now. If the text changed, make-media.ts sees the mismatch and makes it again.
    const fresh = LessonPackageSchema.parse(JSON.parse(fs.readFileSync(opts.file, 'utf8')));
    fresh.audio = {
        voice,
        teacherVoice: teacher,
        article: path.join(mediaRel, 'article.mp3'),
        sentences,
        words: path.join(mediaRel, 'words.mp3'),
        wordTimes,
        flashcard: path.join(mediaRel, 'sentences.mp3'),
        flashcardTimes,
        tutor: bank ? undefined : path.join(mediaRel, 'tutor'),
    };
    const result = savePackage(root, book, lesson, fresh, checkContextFor);
    console.log(`Saved ${path.relative(process.cwd(), opts.file)}; audio approval: ${result.pkg?.approval.audio.status}`);
    return 0;
}

try {
    process.exitCode = main(process.argv.slice(2));
} catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
}
