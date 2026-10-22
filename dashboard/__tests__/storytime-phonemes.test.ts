// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { bankSound, phonemeAudioFields, phonemeAudioProblems, phonemeBankFrom, setPhonemeAudio, soundLabels } from '../lib/storytime/phonemes';
import { StorytimeWeekSchema } from '../lib/storytime/schema';
import { fixtureWeek } from './fixtures/storytime-week-fixture';

/** A small bank in the shape of phonemes/daniel/manifest.json. */
const bank = phonemeBankFrom({
    items: [
        { id: 'P01', sound: '/s/', mp3: '01-s.mp3' },
        { id: 'P02', sound: '/t/', mp3: '02-t.mp3' },
        { id: 'P04', sound: '/n/', mp3: '04-n.mp3' },
        { id: 'P08', sound: '/c-k/', mp3: '08-c-k.mp3' },
        { id: 'P26', sound: '/a-short/', mp3: '26-a-short.mp3' },
        { id: 'P27', sound: '/e-short/', mp3: '27-e-short.mp3' },
        { id: 'P23', sound: '/th-voiced/', mp3: '23-th-voiced.mp3' },
        { id: 'P24', sound: '/th-unvoiced/', mp3: '24-th-unvoiced.mp3' },
    ],
});
const n = 'phonemes/daniel/04-n.mp3';
const a = 'phonemes/daniel/26-a-short.mp3';

/** The fixture week with a sound game and a strip card for /a/. */
function week() {
    const w = fixtureWeek();
    w.opening = {
        pa: [
            'Listen: nose. What is the first sound? Nnn! Listen: sun. What is the last sound? Nnn!',
            'Listen: ant. What is the first sound? /a/!',
            'Listen: nnn - /e/ - /t/. What is the word? Net!',
            'Listen: sss - /a/ - nnn. What is the word? Sun!',
            'Listen: /k/ - /a/ - /t/. What is the word? Cat!',
        ].map((en) => ({ en })),
    };
    w.review![2].cards!.push({ kind: 'sound', text: 'a', week: 2 }, { kind: 'tricky', text: 'a', week: 1 });
    return StorytimeWeekSchema.parse(w);
}

describe('storytime phoneme bank (S22)', () => {
    it('reads the bank sounds and their mp3 paths', () => {
        expect(bank.files.get('/n/')).toBe(n);
        expect(bank.files.size).toBe(8);
        expect(() => phonemeBankFrom({ items: [] })).toThrow(/no items/);
    });

    it('maps the package sound labels to the bank sounds', () => {
        expect(['/n/', 'Nnn', 'nnn', 'n'].map(bankSound)).toEqual(['/n/', '/n/', '/n/', '/n/']);
        expect(['/a/', 'a', '/e/'].map(bankSound)).toEqual(['/a-short/', '/a-short/', '/e-short/']);
        expect(['/k/', 'c', 'k', 'ck'].map(bankSound)).toEqual(['/c-k/', '/c-k/', '/c-k/', '/c-k/']);
        expect(bankSound('/th-voiced/')).toBe('/th-voiced/');
    });

    it('finds the sound labels of a line in the order that the teacher says them', () => {
        expect(soundLabels('Listen: nnn - /e/ - /t/. What is the word? Net!')).toEqual(['nnn', '/e/', '/t/']);
        expect(soundLabels('Listen: nose. What is the first sound? Nnn! Listen: sun. Sss!')).toEqual(['Nnn', 'Sss']);
        expect(soundLabels('Listen: apple. Look at the ball!')).toEqual([]);
    });

    it('gives the audio of the week sound, the sound cards, and each day of the sound game', () => {
        const { fields, unresolved } = phonemeAudioFields(week(), bank);
        expect(unresolved).toEqual([]);
        const at = (p: string) => fields.find((f) => f.path.join('.') === p)?.value;
        expect(at('focus.element.audio')).toBe(n);
        expect(at('review.1.cards.0.audio')).toBe(n);
        expect(at('review.2.cards.1.audio')).toBe(a);
        expect(at('review.2.cards.2.audio')).toBeUndefined();
        expect(at('opening.audio')).toEqual([
            [n, n],
            [a],
            [n, 'phonemes/daniel/27-e-short.mp3', 'phonemes/daniel/02-t.mp3'],
            ['phonemes/daniel/01-s.mp3', a, n],
            ['phonemes/daniel/08-c-k.mp3', a, 'phonemes/daniel/02-t.mp3'],
        ]);
    });

    it('names a sound that the bank does not have', () => {
        const w = week();
        w.focus.element = { ...w.focus.element!, sound: '/th/' };
        expect(phonemeAudioFields(w, bank).unresolved).toEqual(['/th/ (focus.element.audio)']);
    });

    it('sets the fields in a raw week, and the check passes only when they match', () => {
        const raw = JSON.parse(JSON.stringify(week()));
        expect(phonemeAudioProblems(StorytimeWeekSchema.parse(raw), bank)).toContain('focus.element.audio: missing');
        const set = setPhonemeAudio(raw, bank);
        expect(set).toBe(7);
        const parsed = StorytimeWeekSchema.parse(raw);
        expect(phonemeAudioProblems(parsed, bank)).toEqual([]);
        parsed.opening!.audio![2] = [n];
        const problems = phonemeAudioProblems(parsed, bank);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toMatch(/^opening\.audio: .+, expected .+/);
        parsed.focus.element!.sound = '/th/';
        expect(phonemeAudioProblems(parsed, bank)).toContain('no recording for /th/ (focus.element.audio)');
    });

    it('gives the benchmark sound cards and blend words their audio', () => {
        const w = week();
        const benchmark = {
            title: { en: 'Benchmark' },
            paper: { rows: [], letters: [], pass: { en: '' } },
            oneToOne: {
                minutes: 3,
                letters: ['n', 'a'],
                letterPass: 1,
                sounds: ['n', 'a'],
                soundPass: 1,
                blend: [{ sounds: 'nnn - /a/ - /t/', word: 'nat' }],
                blendPass: 1,
                en: { teacherActions: [], teacherLanguage: [], studentActions: [], watchFor: [] },
            },
            readingRecord: { books: [] },
        };
        const { fields } = phonemeAudioFields({ ...w, benchmark } as never, bank);
        const at = (p: string) => fields.find((f) => f.path.join('.') === p)?.value;
        expect(at('benchmark.oneToOne.soundAudio')).toEqual([n, a]);
        expect(at('benchmark.oneToOne.blend.0.audio')).toEqual([n, a, 'phonemes/daniel/02-t.mp3']);
    });
});
