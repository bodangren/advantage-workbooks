import fs from 'fs';
import { spawnSync } from 'child_process';
import { writeWav, type Pcm } from './audio';

/**
 * The clip cache `<book>/media/<lesson>/.clips/` (2026-10-21: Opus, before that WAV). Each clip is
 * stored trimmed, as Ogg Opus, with its sample rate and its exact sample count in the Opus tags. A
 * cached clip is not trimmed again: a lossy codec changes the quiet samples at the edges, so a new
 * trim would move the cut, and the sentence and word times with it. The decoder gives back the
 * stored sample count, so the times from a cached clip are the same as from the original WAV.
 */

export const CLIP_OPUS_BITRATE = '64k';
/** A decode can differ by a sample or two (Opus works at 48 kHz); more means a damaged file. */
const MAX_LENGTH_DRIFT = 64;

/**
 * Reads the comment tags of an Ogg Opus file.
 * @param buf The file.
 * @returns The tags, with upper-case keys. Throws when the file has no OpusTags packet.
 */
export function opusTags(buf: Buffer): Record<string, string> {
    const at = buf.indexOf('OpusTags');
    if (at < 0) throw new Error('No OpusTags packet');
    let p = at + 8;
    p += 4 + buf.readUInt32LE(p); // the vendor string
    const count = buf.readUInt32LE(p);
    p += 4;
    const tags: Record<string, string> = {};
    for (let i = 0; i < count; i++) {
        const len = buf.readUInt32LE(p);
        const tag = buf.toString('utf8', p + 4, p + 4 + len);
        p += 4 + len;
        const eq = tag.indexOf('=');
        if (eq > 0) tags[tag.slice(0, eq).toUpperCase()] = tag.slice(eq + 1);
    }
    return tags;
}

/**
 * Writes one trimmed clip into the cache. A `.part` file is written first and then renamed, so a
 * stopped job leaves no half file.
 * @param pcm The trimmed clip.
 * @param out The `.opus` file.
 */
export function writeClipOpus(pcm: Pcm, out: string): void {
    const part = `${out}.part`;
    const args = ['-y', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0', '-c:a', 'libopus', '-b:a', CLIP_OPUS_BITRATE];
    args.push('-metadata', `PA_RATE=${pcm.rate}`, '-metadata', `PA_SAMPLES=${pcm.samples.length}`, '-f', 'ogg', part);
    const enc = spawnSync('ffmpeg', args, { input: writeWav(pcm), maxBuffer: 1 << 28 });
    if (enc.status !== 0) {
        fs.rmSync(part, { force: true });
        throw new Error(`ffmpeg (opus) failed for ${out}: ${String(enc.stderr ?? enc.error).trim()}`);
    }
    fs.renameSync(part, out);
}

/**
 * Reads one cached clip.
 * @param file The `.opus` file.
 * @returns The sample rate and exactly the stored count of samples. Throws on a damaged file.
 */
export function readClipOpus(file: string): Pcm {
    const tags = opusTags(fs.readFileSync(file));
    const rate = Number(tags.PA_RATE);
    const count = Number(tags.PA_SAMPLES);
    if (!(Number.isInteger(rate) && rate > 0 && Number.isInteger(count) && count >= 0)) throw new Error(`${file}: no PA_RATE or PA_SAMPLES tag`);
    // A clip that was quiet from end to end has no audio packets; ffmpeg cannot open it.
    if (count === 0) return { rate, samples: new Int16Array(0) };
    const dec = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-f', 's16le', '-ac', '1', '-ar', String(rate), 'pipe:1'], { maxBuffer: 1 << 28 });
    if (dec.status !== 0) throw new Error(`ffmpeg (decode) failed for ${file}: ${String(dec.stderr ?? dec.error).trim()}`);
    const raw = dec.stdout;
    const got = raw.length >> 1;
    if (Math.abs(got - count) > MAX_LENGTH_DRIFT) throw new Error(`${file}: ${got} samples, the tag says ${count}`);
    const samples = new Int16Array(count);
    for (let i = 0; i < Math.min(got, count); i++) samples[i] = raw.readInt16LE(i * 2);
    return { rate, samples };
}
