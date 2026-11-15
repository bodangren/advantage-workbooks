/**
 * Phase 13 (spec M10): the cut proof of the read-along sentence clips. This script is a copy of
 * `p12-review-a-cutprobe.ts`, extended to the read-along books (book index 0). It is a script under
 * `measure/runs/`, not repository code.
 *
 * Run from `dashboard/` inside one heavy-run wrapper:
 *     npx tsx ../measure/runs/storytime_week_package_20261022/p13-cutprobe.ts [--week <n>]
 *
 * For each read-along book of w01 to w07 (or of one week with `--week <n>`): (1) the library
 * decision `looksLikeCut` for each shipped read-along clip against the decoded book mp3
 * (`books[0].audio.file`); (2) the positive control: a window of 1.5 s of the decoded book mp3,
 * encoded at 128 kb/s and decoded again, must give true; (3) the maximum normalised
 * cross-correlation of each clip, so the margin to 0.98 is on record. The probe prints no week
 * text.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { looksLikeCut } from '../../../dashboard/lib/storytime/sentence-clips';

const RATE = 32000;
const ROOT = path.resolve(process.cwd(), '../content/storytime');

/** The week argument, or 0 for every week. */
const weekArgument = (() => {
    const at = process.argv.indexOf('--week');
    const value = at >= 0 ? Number(process.argv[at + 1]) : 0;
    return Number.isInteger(value) && value >= 1 && value <= 7 ? value : 0;
})();

function decode(file: string): Int16Array {
    const run = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-f', 's16le', '-ac', '1', '-ar', String(RATE), '-'], { maxBuffer: 1 << 28 });
    if (run.status !== 0) throw new Error(`decode failed: ${file}`);
    const out = new Int16Array(Math.floor(run.stdout.length / 2));
    for (let i = 0; i < out.length; i += 1) out[i] = run.stdout.readInt16LE(2 * i);
    return out;
}

function reencode(samples: Int16Array, folder: string): Int16Array {
    const raw = path.join(folder, 'window.raw');
    const mp3 = path.join(folder, 'window.mp3');
    fs.writeFileSync(raw, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
    const run = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', String(RATE), '-ac', '1', '-i', raw, '-codec:a', 'libmp3lame', '-b:a', '128k', mp3]);
    if (run.status !== 0) throw new Error('encode failed');
    return decode(mp3);
}

/** An in-place radix-2 FFT (an independent copy, not the library code). */
function fft(re: Float64Array, im: Float64Array, inverse: boolean): void {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i += 1) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            [re[i], re[j]] = [re[j], re[i]];
            [im[i], im[j]] = [im[j], im[i]];
        }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = (2 * Math.PI / len) * (inverse ? 1 : -1);
        for (let i = 0; i < n; i += len) {
            for (let k = 0; k < len / 2; k += 1) {
                const wr = Math.cos(ang * k);
                const wi = Math.sin(ang * k);
                const a = i + k;
                const b = a + len / 2;
                const vr = re[b] * wr - im[b] * wi;
                const vi = re[b] * wi + im[b] * wr;
                re[b] = re[a] - vr;
                im[b] = im[a] - vi;
                re[a] += vr;
                im[a] += vi;
            }
        }
    }
    if (inverse) for (let i = 0; i < n; i += 1) { re[i] /= n; im[i] /= n; }
}

/**
 * The maximum normalised cross-correlation over all full-overlap lags.
 * The correlation is conj(FFT(clip)) * FFT(source), so the peak sits at the lag where the clip
 * starts in the source and the value is 1 for an exact copy.
 */
function maxNcc(clip: Int16Array, source: Int16Array): number {
    const m = clip.length;
    const s = source.length;
    if (m === 0 || m > s) return 0;
    let size = 1;
    while (size < m + s) size <<= 1;
    const ar = new Float64Array(size);
    const ai = new Float64Array(size);
    const br = new Float64Array(size);
    const bi = new Float64Array(size);
    for (let i = 0; i < m; i += 1) ar[i] = clip[i];
    for (let i = 0; i < s; i += 1) br[i] = source[i];
    fft(ar, ai, false);
    fft(br, bi, false);
    // conj(A) * B: the real part is ar*br + ai*bi, the imaginary part is ar*bi - ai*br.
    // The inverse gives corr[lag] = sum clip[i] * source[lag + i], so the peak sits at the lag
    // where the clip starts in the source and the value is 1 for an exact copy.
    for (let k = 0; k < size; k += 1) {
        const r = ar[k] * br[k] + ai[k] * bi[k];
        const i = ar[k] * bi[k] - ai[k] * br[k];
        ar[k] = r;
        ai[k] = i;
    }
    fft(ar, ai, true);
    let ce = 0;
    for (let i = 0; i < m; i += 1) ce += clip[i] * clip[i];
    const prefix = new Float64Array(s + 1);
    for (let i = 0; i < s; i += 1) prefix[i + 1] = prefix[i] + source[i] * source[i];
    let best = -1;
    for (let lag = 0; lag + m <= s; lag += 1) {
        const we = prefix[lag + m] - prefix[lag];
        if (we === 0) continue;
        const ncc = ar[lag] / Math.sqrt(ce * we);
        if (ncc > best) best = ncc;
    }
    return best;
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'p13-cut-'));
let cuts = 0;
let controls = 0;
let controlsTrue = 0;
let clips = 0;
let worst = -1;
const first = weekArgument || 1;
const last = weekArgument || 7;
for (let n = first; n <= last; n += 1) {
    const week = JSON.parse(fs.readFileSync(path.join(ROOT, `l2/w0${n}.json`), 'utf8')) as {
        books: { kind?: string; audio: { file: string; sentenceClips?: { file: string }[] } }[];
    };
    week.books.forEach((book, index) => {
        if (book.kind !== 'readalong') return;
        const source = decode(path.join(ROOT, book.audio.file));
        const window = source.slice(RATE * 2, RATE * 2 + Math.floor(RATE * 1.5));
        const reencoded = reencode(window, scratch);
        const control = looksLikeCut(reencoded, source, RATE);
        controls += 1;
        controlsTrue += control ? 1 : 0;
        console.log(`w0${n} b${index} control: a re-encoded 1.5 s window of ${book.audio.file} looksLikeCut ${control} max-ncc ${maxNcc(reencoded, source).toFixed(3)}`);
        for (const item of book.audio.sentenceClips ?? []) {
            const clip = decode(path.join(ROOT, item.file));
            const cut = looksLikeCut(clip, source, RATE);
            const ncc = maxNcc(clip, source);
            worst = Math.max(worst, ncc);
            clips += 1;
            cuts += cut ? 1 : 0;
            console.log(`w0${n} ${path.basename(item.file)} looksLikeCut ${cut} max-ncc ${ncc.toFixed(3)}`);
        }
    });
}
fs.rmSync(scratch, { recursive: true, force: true });
console.log(`clips: ${clips}, cuts: ${cuts}, highest max-ncc: ${worst.toFixed(3)}`);
console.log(`positive controls: ${controls}, true: ${controlsTrue}`);
console.log(`scratch removed: ${!fs.existsSync(scratch)}`);
process.exitCode = cuts === 0 && controlsTrue === controls && clips > 0 ? 0 : 1;
