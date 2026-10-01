// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseWav, writeWav, trimSilence, longestPause, joinClips, articleSentences, audioClips, clipKey, speechArgs } from '../lib/media/audio';
import { fixturePackage } from './fixtures/lesson-package-fixture';
import { LessonPackageSchema } from '../lib/lesson-package/schema';

const RATE = 1000; // 1 sample = 1 ms keeps the numbers readable
const tone = (ms: number, level = 4000) => Int16Array.from({ length: ms }, (_, i) => (i % 2 ? level : -level));
const silence = (ms: number) => new Int16Array(ms);
const cat = (...parts: Int16Array[]) => {
    const out = new Int16Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0;
    for (const p of parts) {
        out.set(p, at);
        at += p.length;
    }
    return out;
};

describe('wav files', () => {
    it('writes and reads 16-bit mono PCM', () => {
        const samples = cat(silence(5), tone(10));
        const back = parseWav(writeWav({ rate: 32000, samples }));
        expect(back.rate).toBe(32000);
        expect(Array.from(back.samples)).toEqual(Array.from(samples));
    });

    it('skips chunks before the data chunk and refuses other formats', () => {
        const wav = writeWav({ rate: 16000, samples: tone(4) });
        const list = Buffer.concat([Buffer.from('LIST'), Buffer.from([4, 0, 0, 0]), Buffer.from('abcd')]);
        const withList = Buffer.concat([wav.subarray(0, 36), list, wav.subarray(36)]);
        withList.writeUInt32LE(withList.length - 8, 4);
        expect(parseWav(withList).samples.length).toBe(4);
        const stereo = Buffer.from(wav);
        stereo.writeUInt16LE(2, 22);
        expect(() => parseWav(stereo)).toThrow(/mono/);
    });
});

describe('silence trim', () => {
    it('cuts the quiet edges and keeps a short pad', () => {
        const trimmed = trimSilence(cat(silence(200), tone(300), silence(250)), RATE, { padMs: 50 });
        expect(trimmed.length).toBe(400);
    });

    it('keeps a clip that has no quiet edge, and empties a silent clip', () => {
        expect(trimSilence(tone(100), RATE, { padMs: 50 }).length).toBe(100);
        expect(trimSilence(silence(100), RATE).length).toBe(0);
    });
});

describe('inner pause', () => {
    it('finds the longest quiet stretch inside a clip, to catch a bad take', () => {
        expect(longestPause(cat(tone(300), silence(700), tone(200), silence(100), tone(100)), RATE)).toBeCloseTo(0.7, 1);
        expect(longestPause(tone(500), RATE)).toBe(0);
    });
});

describe('joined clips', () => {
    it('puts the gap after each clip and times each clip from its first to its last sample', () => {
        const joined = joinClips(
            [
                { text: 'One.', samples: tone(1000), gapAfterMs: 500 },
                { text: 'Two.', samples: tone(1500), gapAfterMs: 1000 },
                { text: 'Three.', samples: tone(250), gapAfterMs: 500 },
            ],
            RATE,
        );
        expect(joined.timings).toEqual([
            { text: 'One.', startTime: 0, endTime: 1 },
            { text: 'Two.', startTime: 1.5, endTime: 3 },
            { text: 'Three.', startTime: 4, endTime: 4.25 },
        ]);
        expect(joined.samples.length).toBe(4250);
    });
});

describe('lesson clips', () => {
    const pkg = LessonPackageSchema.parse(fixturePackage());

    it('reads the sentences from the Thai part, with a longer gap after each paragraph', () => {
        expect(articleSentences(pkg)).toEqual([
            { text: 'This is Pip.', paragraph: 0 },
            { text: 'Pip is a small brown puppy.', paragraph: 0 },
            { text: 'Pip can see a red ball.', paragraph: 0 },
            { text: '"Where is the ball?" says Tom.', paragraph: 1 },
            { text: 'It is under the sofa!', paragraph: 1 },
            { text: 'Pip is happy.', paragraph: 1 },
        ]);
        const clips = audioClips(pkg, { sentenceGapMs: 500, paragraphGapMs: 1000, wordGapMs: 700 });
        expect(clips.article.map((c) => c.gapAfterMs)).toEqual([500, 500, 1000, 500, 500, 0]);
        expect(clips.words.map((c) => c.text)).toEqual(['sofa', 'under', 'puppy']);
        expect(clips.words.map((c) => c.gapAfterMs)).toEqual([700, 700, 0]);
    });

    it('keys a clip by voice, speed, and text, so a changed sentence is the only one made again', () => {
        const a = clipKey('Pip is happy.', 'English_expressive_narrator', 0.85);
        expect(a).toMatch(/^[0-9a-f]{16}$/);
        expect(clipKey('Pip is happy.', 'English_expressive_narrator', 0.85)).toBe(a);
        expect(clipKey('Pip is sad.', 'English_expressive_narrator', 0.85)).not.toBe(a);
        expect(clipKey('Pip is happy.', 'English_Graceful_Lady', 0.85)).not.toBe(a);
        expect(clipKey('Pip is happy.', 'English_expressive_narrator', 0.9)).not.toBe(a);
    });

    it('asks mmx for one WAV clip', () => {
        expect(speechArgs('Pip is happy.', 'English_expressive_narrator', 0.85, '/tmp/a.wav')).toEqual([
            'speech',
            'synthesize',
            '--text',
            'Pip is happy.',
            '--voice',
            'English_expressive_narrator',
            '--speed',
            '0.85',
            '--language',
            'English',
            '--format',
            'wav',
            '--out',
            '/tmp/a.wav',
        ]);
    });
});
