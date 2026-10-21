// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { afterAll, describe, it, expect } from 'vitest';
import { opusTags, readClipOpus, writeClipOpus } from '../lib/media/clip-cache';

const RATE = 32000;
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clip-cache-'));
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

/** A spoken-like clip: a 220 Hz tone that fades out into a quiet tail, as the end of a word does. */
const voiceLike = (n: number) => Int16Array.from({ length: n }, (_, i) => Math.round(Math.sin((2 * Math.PI * 220 * i) / RATE) * 8000 * Math.max(0.02, 1 - i / n)));
const rms = (a: Int16Array) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / Math.max(1, a.length));

describe.skipIf(!hasFfmpeg)('opus clip cache', () => {
    it('gives back exactly the stored sample count and rate, so the times do not move', () => {
        for (const n of [RATE / 10 + 7, RATE * 2 + 1, RATE * 5 - 3]) {
            const file = path.join(dir, `c${n}.opus`);
            writeClipOpus({ rate: RATE, samples: voiceLike(n) }, file);
            const back = readClipOpus(file);
            expect(back.rate).toBe(RATE);
            expect(back.samples.length).toBe(n);
        }
    });

    it('keeps the sound (a lossy copy, not silence or noise)', () => {
        const samples = voiceLike(RATE);
        const file = path.join(dir, 'level.opus');
        writeClipOpus({ rate: RATE, samples }, file);
        const ratio = rms(readClipOpus(file).samples) / rms(samples);
        expect(ratio).toBeGreaterThan(0.8);
        expect(ratio).toBeLessThan(1.25);
    });

    it('stores the rate and the sample count as Opus tags and leaves no .part file', () => {
        const file = path.join(dir, 'tags.opus');
        writeClipOpus({ rate: 24000, samples: voiceLike(2400) }, file);
        expect(opusTags(fs.readFileSync(file))).toMatchObject({ PA_RATE: '24000', PA_SAMPLES: '2400' });
        expect(readClipOpus(file).rate).toBe(24000);
        expect(fs.existsSync(`${file}.part`)).toBe(false);
    });

    it('reads a clip that was quiet from end to end as no samples', () => {
        const file = path.join(dir, 'empty.opus');
        writeClipOpus({ rate: RATE, samples: new Int16Array(0) }, file);
        expect(readClipOpus(file).samples.length).toBe(0);
    });

    it('refuses an Opus file without the sample tags', () => {
        const file = path.join(dir, 'plain.opus');
        spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=220:duration=0.2', '-c:a', 'libopus', '-f', 'ogg', file]);
        expect(() => readClipOpus(file)).toThrow(/PA_RATE or PA_SAMPLES/);
    });
});

describe('opusTags', () => {
    it('refuses a file with no OpusTags packet', () => {
        expect(() => opusTags(Buffer.from('OggS not an opus file'))).toThrow(/OpusTags/);
    });
});
