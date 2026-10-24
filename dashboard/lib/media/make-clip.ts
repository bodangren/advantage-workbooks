import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { clipKey, longestPause, parseWav, speechArgs, trimSilence, withRetries, writeWav, type Pcm } from './audio';
import { readClipOpus, writeClipOpus } from './clip-cache';

/**
 * One mmx speech clip with the clip cache (lib/media/clip-cache.ts): the lesson audio
 * (scripts/media/lesson-audio.ts) and the Storytime book audio (scripts/storytime/book-audio.ts).
 */

/** An inner pause longer than this marks a bad take; the clip is made again (two more tries at most). */
export const MAX_PAUSE_S = 0.6;
/** The takes of one clip at most. */
export const TRIES = 3;
/**
 * The waits before each new try of a failed mmx call. The long waits are for the per-minute limit
 * ("rate limit exceeded(RPM)"), which parallel runs reach (2026-10-02: four runs).
 */
const CALL_WAITS_MS = [5_000, 15_000, 30_000, 60_000, 120_000, 180_000];

const sleep = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** One take from mmx into `file`, tried again after a failed call. */
function take(text: string, voice: string, speed: number, file: string) {
    const tmp = `${file}.part.wav`;
    withRetries(
        () => {
            const run = spawnSync('mmx', speechArgs(text, voice, speed, tmp), { encoding: 'utf8', timeout: 120_000 });
            if (run.status !== 0 || !fs.existsSync(tmp)) {
                throw new Error(`mmx failed for "${text}": ${(run.stderr || run.stdout || String(run.error)).trim().slice(0, 300)}`);
            }
        },
        CALL_WAITS_MS,
        sleep,
        (_, attempt) => process.stdout.write(`    call ${attempt} failed for "${text}", again in ${CALL_WAITS_MS[attempt - 1] / 1000} s\n`),
    );
    fs.renameSync(tmp, file);
}

const readClip = (file: string) => {
    const pcm = parseWav(fs.readFileSync(file));
    const samples = trimSilence(pcm.samples, pcm.rate);
    return { rate: pcm.rate, samples, pause: longestPause(samples, pcm.rate) };
};

/**
 * Stores a trimmed clip as Opus, deletes its WAV files, and reads the clip back, so that the first
 * build and every later build use the same samples.
 */
function cacheClip(trimmed: Pcm, file: string, wavs: string[]): Pcm {
    writeClipOpus(trimmed, file);
    for (const w of wavs) fs.rmSync(w, { force: true });
    return readClipOpus(file);
}

/**
 * Makes one clip with mmx (with retries for a bad take), or reads it from the cache.
 * @param text The text of the clip.
 * @param voice The mmx voice id.
 * @param speed The speed multiplier.
 * @param cache The `.clips` directory.
 * @param redo True to make the clip again when it is in the cache.
 * @returns The trimmed clip.
 */
export function makeClip(text: string, voice: string, speed: number, cache: string, redo = false): Pcm {
    const base = path.join(cache, clipKey(text, voice, speed));
    const file = `${base}.opus`;
    const wav = `${base}.wav`; // the cache before 2026-10-21
    if (redo) for (const f of [file, wav]) fs.rmSync(f, { force: true });
    if (fs.existsSync(file)) return readClipOpus(file);
    if (fs.existsSync(wav)) return cacheClip(readClip(wav), file, [wav]);
    const takes = Array.from({ length: TRIES }, (_, t) => `${base}.take${t + 1}.wav`);
    let best: { file: string; pause: number } | undefined;
    for (const [t, attempt] of takes.entries()) {
        take(text, voice, speed, attempt);
        const { pause } = readClip(attempt);
        if (!best || pause < best.pause) best = { file: attempt, pause };
        if (pause <= MAX_PAUSE_S) break;
        process.stdout.write(`    take ${t + 1}: pause ${pause.toFixed(2)} s${t + 1 < TRIES ? ', again' : ''}\n`);
    }
    return cacheClip(readClip(best!.file), file, takes);
}

/**
 * Writes one mp3 from 16-bit samples.
 * @param rate Samples per second.
 * @param samples The audio.
 * @param out The mp3 file.
 */
export function encodeMp3(rate: number, samples: Int16Array, out: string): void {
    const wav = path.join(os.tmpdir(), `make-clip-${process.pid}.wav`);
    fs.writeFileSync(wav, writeWav({ rate, samples }));
    const enc = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '4', out], { encoding: 'utf8' });
    fs.rmSync(wav, { force: true });
    if (enc.status !== 0) throw new Error(`ffmpeg failed: ${enc.stderr.trim()}`);
}
