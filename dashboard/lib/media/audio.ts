import { createHash } from 'crypto';
import type { LessonPackage } from '../lesson-package/schema';

/**
 * Lesson audio (track lesson_media_20261001). `mmx speech` gives one subtitle segment for the whole
 * text, so each sentence is made as its own WAV clip. The clips are trimmed and joined with fixed
 * gaps, and the sentence times come from the sample counts, so they are exact.
 */

export interface Pcm {
    rate: number;
    samples: Int16Array;
}

export interface Clip {
    text: string;
    samples: Int16Array;
    /** Silence after the clip; the last clip's gap is not added. */
    gapAfterMs: number;
}

export interface ClipTiming {
    text: string;
    startTime: number;
    endTime: number;
}

export interface GapOptions {
    sentenceGapMs: number;
    paragraphGapMs: number;
    wordGapMs: number;
}

export const DEFAULT_GAPS: GapOptions = { sentenceGapMs: 450, paragraphGapMs: 900, wordGapMs: 700 };

/** The American mmx voices Daniel chose (2026-10-01). */
export const VOICES = { female: 'English_captivating_female1', male: 'English_magnetic_voiced_man' } as const;

/**
 * The voices of a lesson. The story uses the narrator's voice (`audio.voice`: the male voice when a
 * boy or a man tells the story). Words, questions, and options use the teacher's voice.
 * @param pkg A parsed package.
 * @returns The narrator and teacher voice ids.
 */
export function voicesFor(pkg: LessonPackage): { narrator: string; teacher: string } {
    return { narrator: pkg.audio.voice ?? VOICES.female, teacher: pkg.audio.teacherVoice ?? VOICES.female };
}

/**
 * Reads a 16-bit mono PCM WAV file.
 * @param buf The file.
 * @returns The sample rate and the samples. Throws on another format.
 */
export function parseWav(buf: Buffer): Pcm {
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Not a WAV file');
    let at = 12;
    let rate = 0;
    while (at + 8 <= buf.length) {
        const id = buf.toString('ascii', at, at + 4);
        const size = buf.readUInt32LE(at + 4);
        const body = at + 8;
        if (id === 'fmt ') {
            const format = buf.readUInt16LE(body);
            const channels = buf.readUInt16LE(body + 2);
            const bits = buf.readUInt16LE(body + 14);
            if (format !== 1 || bits !== 16) throw new Error(`WAV must be 16-bit PCM (format ${format}, ${bits} bits)`);
            if (channels !== 1) throw new Error(`WAV must be mono (${channels} channels)`);
            rate = buf.readUInt32LE(body + 4);
        } else if (id === 'data') {
            if (!rate) throw new Error('WAV data before the fmt chunk');
            const end = Math.min(body + size, buf.length);
            const samples = new Int16Array((end - body) >> 1);
            for (let i = 0; i < samples.length; i++) samples[i] = buf.readInt16LE(body + i * 2);
            return { rate, samples };
        }
        at = body + size + (size % 2);
    }
    throw new Error('WAV has no data chunk');
}

/**
 * Writes a 16-bit mono PCM WAV file.
 * @param pcm The sample rate and the samples.
 * @returns The file.
 */
export function writeWav(pcm: Pcm): Buffer {
    const data = pcm.samples.length * 2;
    const buf = Buffer.alloc(44 + data);
    buf.write('RIFF', 0, 'ascii');
    buf.writeUInt32LE(36 + data, 4);
    buf.write('WAVE', 8, 'ascii');
    buf.write('fmt ', 12, 'ascii');
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(1, 22);
    buf.writeUInt32LE(pcm.rate, 24);
    buf.writeUInt32LE(pcm.rate * 2, 28);
    buf.writeUInt16LE(2, 32);
    buf.writeUInt16LE(16, 34);
    buf.write('data', 36, 'ascii');
    buf.writeUInt32LE(data, 40);
    for (let i = 0; i < pcm.samples.length; i++) buf.writeInt16LE(pcm.samples[i], 44 + i * 2);
    return buf;
}

/**
 * Cuts the quiet start and end of a clip.
 * @param samples The clip.
 * @param rate Samples per second.
 * @param opts `threshold` is the loudest sample that counts as quiet; `padMs` is the silence kept at each edge.
 * @returns The trimmed clip (empty when the whole clip is quiet).
 */
export function trimSilence(samples: Int16Array, rate: number, opts: { threshold?: number; padMs?: number } = {}): Int16Array {
    const threshold = opts.threshold ?? 500;
    const pad = Math.round(((opts.padMs ?? 60) * rate) / 1000);
    let first = 0;
    while (first < samples.length && Math.abs(samples[first]) <= threshold) first++;
    if (first === samples.length) return new Int16Array(0);
    let last = samples.length - 1;
    while (Math.abs(samples[last]) <= threshold) last--;
    return samples.slice(Math.max(0, first - pad), Math.min(samples.length, last + 1 + pad));
}

/**
 * The longest quiet stretch inside a clip, in 20 ms windows. A long one marks a bad take (a pause
 * in the middle of a short sentence).
 * @param samples A trimmed clip.
 * @param rate Samples per second.
 * @param threshold The loudest sample that counts as quiet.
 * @returns Seconds.
 */
export function longestPause(samples: Int16Array, rate: number, threshold = 600): number {
    const w = Math.max(1, Math.round(rate * 0.02));
    let run = 0;
    let best = 0;
    for (let i = 0; i + w <= samples.length; i += w) {
        let peak = 0;
        for (let j = i; j < i + w; j++) peak = Math.max(peak, Math.abs(samples[j]));
        run = peak <= threshold ? run + w : 0;
        best = Math.max(best, run);
    }
    return best / rate;
}

const seconds = (n: number, rate: number) => Math.round((n / rate) * 1000) / 1000;

/**
 * Joins clips with their gaps.
 * @param clips The clips in order.
 * @param rate Samples per second.
 * @returns The joined samples and each clip's start and end time in seconds.
 */
export function joinClips(clips: Clip[], rate: number): { samples: Int16Array; timings: ClipTiming[] } {
    const gaps = clips.map((c, i) => (i === clips.length - 1 ? 0 : Math.round((c.gapAfterMs * rate) / 1000)));
    const samples = new Int16Array(clips.reduce((n, c, i) => n + c.samples.length + gaps[i], 0));
    const timings: ClipTiming[] = [];
    let at = 0;
    clips.forEach((c, i) => {
        samples.set(c.samples, at);
        timings.push({ text: c.text, startTime: seconds(at, rate), endTime: seconds(at + c.samples.length, rate) });
        at += c.samples.length + gaps[i];
    });
    return { samples, timings };
}

/**
 * The article sentences, from the Thai part (its check proves they join to each paragraph).
 * @param pkg A parsed package.
 * @returns Each sentence with its paragraph index.
 */
export function articleSentences(pkg: LessonPackage): { text: string; paragraph: number }[] {
    return pkg.thai.paragraphs.flatMap((para, paragraph) => para.map((s) => ({ text: s.en.trim(), paragraph })));
}

/**
 * The clip texts and gaps for the article and the glossary words (no samples yet).
 * @param pkg A parsed package.
 * @param gaps The gap lengths.
 * @returns Article clips and word clips, without samples.
 */
export function audioClips(pkg: LessonPackage, gaps: GapOptions = DEFAULT_GAPS): { article: Omit<Clip, 'samples'>[]; words: Omit<Clip, 'samples'>[] } {
    const sentences = articleSentences(pkg);
    const article = sentences.map((s, i) => ({
        text: s.text,
        gapAfterMs: i === sentences.length - 1 ? 0 : sentences[i + 1].paragraph !== s.paragraph ? gaps.paragraphGapMs : gaps.sentenceGapMs,
    }));
    const words = pkg.glossary.map((g, i) => ({ text: g.word, gapAfterMs: i === pkg.glossary.length - 1 ? 0 : gaps.wordGapMs }));
    return { article, words };
}

/**
 * A cache key for one clip.
 * @param text The clip text.
 * @param voice The mmx voice id.
 * @param speed The speed multiplier.
 * @returns 16 hex characters.
 */
export function clipKey(text: string, voice: string, speed: number): string {
    return createHash('sha256').update(JSON.stringify([text, voice, speed])).digest('hex').slice(0, 16);
}

/**
 * Arguments for `mmx` to make one WAV clip.
 * @param text The clip text.
 * @param voice The mmx voice id.
 * @param speed The speed multiplier.
 * @param out The WAV file to write.
 * @returns The argument list (without the `mmx` command).
 */
export function speechArgs(text: string, voice: string, speed: number, out: string): string[] {
    return ['speech', 'synthesize', '--text', text, '--voice', voice, '--speed', String(speed), '--language', 'English', '--format', 'wav', '--out', out];
}

/**
 * The sentences for the app's flashcards: the ones with the most glossed words (3 to 5), in text
 * order. Ties go to the longer sentence, then the earlier one.
 * @param pkg A parsed package.
 * @returns Sentence texts.
 */
export function flashcardSentences(pkg: LessonPackage, min = 3, max = 5): string[] {
    const sentences = articleSentences(pkg).map((s) => s.text);
    const glossed = pkg.glossary.map((g) => g.word.toLowerCase());
    const score = (t: string) => {
        const words: string[] = t.toLowerCase().match(/[a-z']+/g) ?? [];
        return glossed.filter((g) => words.includes(g)).length;
    };
    const ranked = sentences
        .map((text, index) => ({ text, index, score: score(text) }))
        .sort((a, b) => b.score - a.score || b.text.length - a.text.length || a.index - b.index);
    const count = Math.min(sentences.length, Math.max(min, Math.min(max, ranked.filter((r) => r.score > 0).length)));
    return ranked
        .slice(0, count)
        .sort((a, b) => a.index - b.index)
        .map((r) => r.text);
}
