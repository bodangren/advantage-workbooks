import { heardMatches, type WordTime } from './book-audio';

/**
 * The sentence clips of the Storytime books (Phase 12, spec FR 2, decisions L7 and L8; Phase 13
 * adds the read-along books by opt-in, decisions M2 and M3): the clip path of one sentence, the clip
 * plan of the books of the selected kinds of one week, the heard rule and the length rule of one
 * take, and the cut guard that proves a clip is no slice of a longer audio.
 *
 * The module is pure: it reads no file, starts no process, and uses no network. The scripts
 * `scripts/storytime/make-sentence-clips.ts` and `set-sentence-clips.ts` read and write the clip
 * files and the week files.
 */

/** The normalised cross-correlation that marks a cut: 0.98 or more (L8). */
const CUT_CORRELATION = 0.98;

/** The kind of a book that can hold sentence clips (Phase 13 decision M3). */
export type SentenceKind = 'decodable' | 'readalong';

/** The kinds of a plan with no `kinds` field: the Phase 12 behavior (M3). */
const DEFAULT_KINDS: readonly SentenceKind[] = ['decodable'];

/** One sentence of a book as `planSentenceClips` reads it. */
export interface SentenceLine {
    /** The sentence text. */
    sentence?: string;
}

/** One book as `planSentenceClips` reads it. */
export interface SentenceBook {
    /**
     * The book kind. A plan holds the books whose kind is in its `kinds`: `decodable` by default
     * (L7), and `readalong` only by opt-in (Phase 13 decision M3).
     */
    kind?: string;
    audio?: {
        /** The sentences of the book, in order. */
        sentences?: readonly SentenceLine[];
    };
}

/** One planned sentence clip (L7). */
export interface PlannedSentence {
    /** The 0-based index of the book in `books`. */
    book: number;
    /** The 1-based index of the sentence in its book. */
    n: number;
    /** The sentence text. */
    text: string;
    /** The clip path, relative to the content root. */
    file: string;
}

/**
 * The clip path of one sentence, relative to the content root (L7).
 * @param level The level of the week.
 * @param week The week, from 1 to 99.
 * @param book The 0-based index of the book.
 * @param n The 1-based index of the sentence in its book.
 * @returns The path `l<level>/media/w<nn>/sentences/b<book>-s<jj>.mp3`.
 * @throws Error When the week is outside 1 to 99, or the book or the sentence index is negative.
 */
export function sentenceClipPath(level: number, week: number, book: number, n: number): string {
    if (!Number.isInteger(week) || week < 1 || week > 99) {
        throw new Error(`sentence clip: week outside 1 to 99: ${week}`);
    }
    if (!Number.isInteger(book) || book < 0) throw new Error(`sentence clip: bad book index: ${book}`);
    if (!Number.isInteger(n) || n < 1) throw new Error(`sentence clip: bad sentence index: ${n}`);
    return `l${level}/media/w${String(week).padStart(2, '0')}/sentences/b${book}-s${String(n).padStart(2, '0')}.mp3`;
}

/**
 * The clip plan of the books of the selected kinds of one week, in the order of the books (L7, M3).
 * With no `kinds`, the plan holds the decodable books only, as in Phase 12. The read-along books
 * join the plan only by the opt-in `kinds: ['readalong']` or by both kinds.
 * @param input The level, the week, the books of the week, and the optional book kinds.
 * @returns One entry for each sentence of each book of a selected kind.
 */
export function planSentenceClips(input: {
    level: number;
    week: number;
    books: readonly SentenceBook[];
    kinds?: readonly SentenceKind[];
}): PlannedSentence[] {
    const kinds: readonly string[] = input.kinds ?? DEFAULT_KINDS;
    const plan: PlannedSentence[] = [];
    input.books.forEach((book, index) => {
        if (typeof book?.kind !== 'string' || !kinds.includes(book.kind)) return;
        const sentences = book.audio?.sentences ?? [];
        sentences.forEach((line, at) => {
            const text = typeof line?.sentence === 'string' ? line.sentence : '';
            plan.push({ book: index, n: at + 1, text, file: sentenceClipPath(input.level, input.week, index, at + 1) });
        });
    });
    return plan;
}

/** The words of a sentence, in order: the parts that the spaces split. */
function sentenceWords(sentence: string): string[] {
    return sentence.split(/\s+/).filter(Boolean);
}

/**
 * The verdict of the heard check of one sentence take (L8): the recognizer must find each word of
 * the sentence, in order.
 * @param sentence The sentence text.
 * @param heard The recognized words of the take.
 * @returns True for a match.
 */
export function sentenceHeardPasses(sentence: string, heard: readonly string[]): boolean {
    const words: WordTime[] = heard.map((word) => ({ word, start: 0, end: 0 }));
    return heardMatches(sentence, words);
}

/**
 * The length bounds of one sentence take, in seconds (L8): at least 0.2 s for each word, and at
 * most 1.2 s for each word plus 1 s.
 * @param sentence The sentence text.
 * @returns The minimum and the maximum length, in seconds.
 */
export function sentenceLengthBounds(sentence: string): { min: number; max: number } {
    const words = sentenceWords(sentence).length;
    return { min: 0.2 * words, max: 1.2 * words + 1 };
}

/** An in-place iterative FFT of one channel, on the next power of two at or above `size`. */
class Fft {
    /** The transform size, a power of two. */
    readonly size: number;
    /** The real parts. */
    readonly re: Float64Array;
    /** The imaginary parts. */
    readonly im: Float64Array;

    /**
     * The buffers of one size.
     * @param size The transform size, a power of two.
     */
    constructor(size: number) {
        this.size = size;
        this.re = new Float64Array(size);
        this.im = new Float64Array(size);
    }

    /**
     * Fills the buffers with one signal and runs the forward transform.
     * @param signal The samples.
     */
    forward(signal: Int16Array | Float64Array): void {
        this.re.fill(0);
        this.im.fill(0);
        for (let i = 0; i < signal.length; i += 1) this.re[i] = signal[i];
        this.transform(false);
    }

    /**
     * Runs the inverse transform on the current buffer contents, with the 1/N scale.
     */
    inverse(): void {
        this.transform(true);
    }

    /**
     * The butterfly network of one direction, on the current buffer contents.
     * @param inverse False for the forward transform, true for the inverse.
     */
    private transform(inverse: boolean): void {
        const n = this.size;
        const re = this.re;
        const im = this.im;
        // Bit-reversal permutation.
        for (let i = 1, j = 0; i < n; i += 1) {
            let bit = n >> 1;
            for (; j & bit; bit >>= 1) j ^= bit;
            j ^= bit;
            if (i < j) {
                const tr = re[i];
                re[i] = re[j];
                re[j] = tr;
                const ti = im[i];
                im[i] = im[j];
                im[j] = ti;
            }
        }
        for (let len = 2; len <= n; len <<= 1) {
            const angle = ((2 * Math.PI) / len) * (inverse ? 1 : -1);
            const wr = Math.cos(angle);
            const wi = Math.sin(angle);
            for (let i = 0; i < n; i += len) {
                let cwr = 1;
                let cwi = 0;
                for (let j = 0; j < len / 2; j += 1) {
                    const ur = re[i + j];
                    const ui = im[i + j];
                    const vr = re[i + j + len / 2] * cwr - im[i + j + len / 2] * cwi;
                    const vi = re[i + j + len / 2] * cwi + im[i + j + len / 2] * cwr;
                    re[i + j] = ur + vr;
                    im[i + j] = ui + vi;
                    re[i + j + len / 2] = ur - vr;
                    im[i + j + len / 2] = ui - vi;
                    const nwr = cwr * wr - cwi * wi;
                    cwi = cwr * wi + cwi * wr;
                    cwr = nwr;
                }
            }
        }
        if (inverse) {
            for (let i = 0; i < n; i += 1) {
                re[i] /= n;
                im[i] /= n;
            }
        }
    }
}

/**
 * The cut guard of one clip (L8): true when the clip equals a window of the source audio, up to a
 * gain change. The normalised cross-correlation of the clip with a window of the source is 0.98 or
 * more at one lag. A fresh generation, a retake, and an unrelated signal of the same length give
 * false.
 * @param clip The samples of the clip.
 * @param source The samples of the source audio.
 * @param rate The sample rate of both signals, in samples per second.
 * @returns True when the clip is a cut of the source.
 */
export function looksLikeCut(clip: Int16Array, source: Int16Array, rate: number): boolean {
    if (rate <= 0) throw new Error(`sentence clip: bad sample rate: ${rate}`);
    const m = clip.length;
    const n = source.length;
    if (m === 0 || m > n) return false;
    let clipEnergy = 0;
    for (let i = 0; i < m; i += 1) clipEnergy += clip[i] * clip[i];
    if (clipEnergy === 0) return false;
    // The cross-correlation at each lag, by FFT, and the window energies by prefix sums.
    let size = 1;
    while (size < m + n) size <<= 1;
    const fft = new Fft(size);
    fft.forward(clip);
    const clipRe = Float64Array.from(fft.re);
    const clipIm = Float64Array.from(fft.im);
    fft.forward(source);
    for (let k = 0; k < size; k += 1) {
        const sr = fft.re[k];
        const si = fft.im[k];
        fft.re[k] = clipRe[k] * sr + clipIm[k] * si;
        fft.im[k] = clipRe[k] * si - clipIm[k] * sr;
    }
    fft.inverse();
    const corr = fft.re;
    const prefix = new Float64Array(n + 1);
    for (let i = 0; i < n; i += 1) prefix[i + 1] = prefix[i] + source[i] * source[i];
    for (let lag = 0; lag + m <= n; lag += 1) {
        const windowEnergy = prefix[lag + m] - prefix[lag];
        if (windowEnergy === 0) continue;
        const ncc = corr[lag] / Math.sqrt(clipEnergy * windowEnergy);
        if (ncc >= CUT_CORRELATION) return true;
    }
    return false;
}
