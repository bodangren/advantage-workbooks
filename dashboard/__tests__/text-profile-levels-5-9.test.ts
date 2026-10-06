// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildVocabularyIndex, levelFromExams, LEVEL_RANK, type GraphNode } from '../lib/text-profile/vocabulary';
import { checkLesson, PROFILES, type TextProfile } from '../lib/text-profile/check';
import type { LessonText } from '../lib/text-profile/sources';
import { BOOK_ORDER } from '../lib/lesson-package/files';
import { BOOK_KEYS, BOOK_PROFILES } from '../lib/lesson-package/author';
import { PackageMetaSchema } from '../lib/lesson-package/schema';

const EXAM = {
    S: ['pre-a1-starters'],
    M: ['a1-movers'],
    F: ['a2-flyers'],
    K: ['a2-key-for-schools'],
    P: ['b1-preliminary-for-schools'],
    KP: ['a2-key-for-schools', 'b1-preliminary-for-schools'],
    NONE: [] as string[],
};

function node(form: string, exams: string[]): GraphNode {
    return { id: `skill.${form}`, kind: 'skill', metadata: { normalizedForm: form, matchForms: [form], examAlignments: exams } };
}

const words = (level: string[], list: string[]) => list.map((w) => node(w, level));
const graph = {
    nodes: [
        ...words(EXAM.S, ['a', 'the', 'is', 'big', 'dog', 'and', 'see', 'it', 'we', 'go', 'to', 'by', 'on']),
        ...words(EXAM.M, ['puppy', 'lamp', 'kite']),
        ...words(EXAM.F, ['planet', 'tunnel', 'storm']),
        ...words(EXAM.K, ['pond', 'bridge', 'candle', 'valley', 'basket', 'ladder']),
        ...words(EXAM.P, ['ancient', 'harvest', 'bargain']),
        node('wobble', EXAM.NONE),
    ],
};
const index = buildVocabularyIndex(graph);

const BASE: TextProfile = {
    id: 'test',
    label: 'Test',
    words: [1, 200],
    paragraphs: [1, 3],
    meanSentenceLength: [1, 20],
    longestSentence: 30,
    startersShare: 0.5,
    glossedCount: 3,
    glossedStartersMin: 1,
    glossedMoversMax: 1,
    newStartersMin: 1,
    recycledMin: 0,
    questionMarksMin: 0,
    spelling: 'american',
};

function lesson(paragraphs: string[], glossed: string[], extra: Partial<LessonText> = {}): LessonText {
    return { id: 'x', title: 'x', source: 'x.md', paragraphs, glossed, ...extra };
}
const check = (l: LessonText, profile: TextProfile, prior: LessonText[] = []) => {
    const r = checkLesson(l, { index, prior, profile });
    return (id: string) => r.checks.find((c) => c.id === id)!;
};

describe('YLE level split', () => {
    it('maps exams to Key, PET, or Above', () => {
        expect(levelFromExams(EXAM.K)).toBe('Key');
        expect(levelFromExams(EXAM.P)).toBe('PET');
        expect(levelFromExams(EXAM.KP)).toBe('Key');
        expect(levelFromExams(EXAM.NONE)).toBe('Above');
        expect(index.levelOf('pond')).toBe('Key');
        expect(index.levelOf('ancient')).toBe('PET');
        expect(index.levelOf('wobble')).toBe('Above');
    });

    it('ranks the levels', () => {
        expect(LEVEL_RANK).toEqual({ Starters: 0, Movers: 1, Flyers: 2, Key: 3, PET: 4, Above: 5 });
    });
});

describe('glossedFrom at a Flyers list level', () => {
    const flyers: TextProfile = { ...BASE, listLevel: 'Flyers', glossedStartersMin: 2, glossedMoversMax: 1 };
    const l = lesson(['We see a puppy and a planet by the pond.'], ['puppy', 'planet', 'pond']);

    it('counts only Flyers words without glossedFrom', () => {
        const c = check(l, flyers);
        expect(c('gloss-starters')).toMatchObject({ status: 'fail', value: '1', label: 'Glossed on Flyers' });
        expect(c('gloss-movers')).toMatchObject({ status: 'pass', value: '1', label: 'Glossed on Key' });
        expect(c('gloss-above')).toMatchObject({ status: 'pass', value: '0' });
    });

    it('counts Movers and Flyers words with glossedFrom Movers', () => {
        const c = check(l, { ...flyers, glossedFrom: 'Movers' });
        expect(c('gloss-starters')).toMatchObject({ status: 'pass', value: '2' });
        expect(c('gloss-starters').label).toBe('Glossed on Movers to Flyers');
    });

    it('counts new words from glossedFrom that no earlier lesson glosses', () => {
        const profile = { ...flyers, glossedFrom: 'Movers' as const, newStartersMin: 2 };
        const earlier = lesson(['A puppy.'], ['puppy']);
        expect(check(l, profile)('new').status).toBe('pass');
        expect(check(l, profile, [earlier])('new')).toMatchObject({ status: 'warn', value: '1' });
    });

    it('fails a PET word and a word outside the graph above the Key maximum', () => {
        const c = check(lesson(['We see a puppy and a planet by the ancient wobble.'], ['puppy', 'planet', 'ancient']), { ...flyers, glossedFrom: 'Movers' });
        expect(c('gloss-above')).toMatchObject({ status: 'fail', value: '1' });
        expect(c('gloss-above').detail).toContain('ancient (PET)');
    });
});

describe('a Key list level', () => {
    const key: TextProfile = { ...BASE, listLevel: 'Key', glossedCount: 5, glossedStartersMin: 5, glossedMoversMax: 1 };
    const text = ['We see a pond and a bridge. The candle is by the valley.', 'A basket is on the ladder, and a puppy is on it.'];

    it('passes a text whose glossed words are on the Key list', () => {
        const r = checkLesson(lesson(text, ['pond', 'bridge', 'candle', 'valley', 'basket']), { index, prior: [], profile: key });
        expect(r.checks.filter((c) => c.status === 'fail')).toEqual([]);
        expect(r.nonStarters).toEqual([]);
        expect(r.checks.find((c) => c.id === 'gloss-movers')?.label).toBe('Glossed on PET');
    });

    it('fails PET glossed words over the maximum', () => {
        const c = check(lesson(text, ['pond', 'bridge', 'candle', 'ancient', 'harvest']), { ...key, glossedStartersMin: 3 });
        expect(c('gloss-movers')).toMatchObject({ status: 'fail', value: '2', target: '1 or less' });
        expect(c('gloss-above').label).toBe('Glossed above PET');
    });

    it('fails a glossed word that is above PET', () => {
        const c = check(lesson(text, ['pond', 'bridge', 'candle', 'valley', 'wobble']), key);
        expect(c('gloss-above')).toMatchObject({ status: 'fail', value: '1' });
    });

    it('counts Key words as on the list and PET words as off the list', () => {
        const r = checkLesson(lesson(['We see a pond and an ancient bridge.'], []), { index, prior: [], profile: key });
        expect(r.nonStarters).toEqual([{ word: 'ancient', level: 'PET', count: 1 }]);
    });
});

describe('a paragraphs range', () => {
    const p = (n: number) => lesson(Array.from({ length: n }, () => 'We see a dog.'), []);

    it('accepts a count inside the range and fails one outside', () => {
        const profile = { ...BASE, paragraphs: [3, 4] as [number, number] };
        expect(check(p(3), profile)('paragraphs')).toMatchObject({ status: 'pass', target: '3–4' });
        expect(check(p(4), profile)('paragraphs').status).toBe('pass');
        expect(check(p(2), profile)('paragraphs').status).toBe('fail');
        expect(check(p(5), profile)('paragraphs').status).toBe('fail');
    });

    it('keeps a single number working', () => {
        const profile = { ...BASE, paragraphs: 2 };
        expect(check(p(2), profile)('paragraphs')).toMatchObject({ status: 'pass', target: '2' });
        expect(check(p(3), profile)('paragraphs').status).toBe('fail');
    });
});

describe('the level 5-9 profiles', () => {
    const book = { lessons: 14, questionLessonsMin: 10, dialogueLessonsMin: 6 };
    const common = { startersShare: 0.95, glossedCount: 12, recycledMin: 4, newStartersMin: 6, questionMarksMin: 2, spelling: 'american', book };

    it('ships the five workbook profiles', () => {
        expect(PROFILES['quest-5']).toMatchObject({
            ...common, label: 'Primary level 5 (Quest 5)', words: [230, 300], paragraphs: [3, 4], meanSentenceLength: [6.5, 8.0],
            longestSentence: 14, listLevel: 'Movers', glossedStartersMin: 8, glossedMoversMax: 2,
        });
        expect(PROFILES['quest-6']).toMatchObject({
            ...common, label: 'Primary level 6 (Quest 6.1, 6.2)', words: [270, 340], paragraphs: 4, meanSentenceLength: [7.0, 8.5],
            longestSentence: 15, listLevel: 'Flyers', glossedFrom: 'Movers', glossedStartersMin: 6, glossedMoversMax: 1,
        });
        expect(PROFILES['adventure-7']).toMatchObject({
            ...common, label: 'Primary level 7 (Adventure 7.1, 7.2)', words: [300, 380], paragraphs: [4, 5], meanSentenceLength: [7.5, 9.0],
            longestSentence: 16, listLevel: 'Flyers', glossedStartersMin: 8, glossedMoversMax: 2,
        });
        expect(PROFILES['adventure-8']).toMatchObject({
            ...common, label: 'Primary level 8 (Adventure 8.1–8.3)', words: [340, 430], paragraphs: 5, meanSentenceLength: [8.0, 9.5],
            longestSentence: 18, listLevel: 'Key', glossedStartersMin: 5, glossedMoversMax: 1,
        });
        expect(PROFILES['adventure-9']).toMatchObject({
            ...common, label: 'Primary level 9 (Adventure 9.1–9.3)', words: [380, 480], paragraphs: [5, 6], meanSentenceLength: [8.5, 10.5],
            longestSentence: 20, listLevel: 'Key', glossedStartersMin: 8, glossedMoversMax: 2,
        });
        expect(PROFILES['adventure-7'].glossedFrom).toBeUndefined();
    });

    it('ships the five banks with wider sentences and no book rules', () => {
        const msl: Record<number, [number, number]> = { 5: [6.3, 8.2], 6: [6.8, 8.7], 7: [7.3, 9.2], 8: [7.8, 9.7], 9: [8.3, 10.7] };
        const from: Record<number, string> = { 5: 'quest-5', 6: 'quest-6', 7: 'adventure-7', 8: 'adventure-8', 9: 'adventure-9' };
        for (const n of [5, 6, 7, 8, 9]) {
            const b = PROFILES[`bank-${n}`];
            const base = PROFILES[from[n]];
            expect(b.id).toBe(`bank-${n}`);
            expect(b.label).toBe(`Primary level ${n} bank (online only)`);
            expect(b.book).toBeUndefined();
            expect(b.newStartersMin).toBe(0);
            expect(b.recycledMin).toBe(0);
            expect(b.questionMarksMin).toBe(1);
            expect(b.words).toEqual(base.words);
            expect(b.paragraphs).toEqual(base.paragraphs);
            expect(b.listLevel).toBe(base.listLevel);
            expect(b.glossedFrom).toBe(base.glossedFrom);
            expect(b.meanSentenceLength[0]).toBeCloseTo(msl[n][0], 5);
            expect(b.meanSentenceLength[1]).toBeCloseTo(msl[n][1], 5);
        }
    });
});

describe('book folders for levels 5-9', () => {
    it('orders the books after quest-4', () => {
        expect(BOOK_ORDER.slice(BOOK_ORDER.indexOf('quest-4'))).toEqual([
            'quest-4', 'quest-5', 'quest-6.1', 'quest-6.2', 'adventure-7.1', 'adventure-7.2',
            'adventure-8.1', 'adventure-8.2', 'adventure-8.3', 'adventure-9.1', 'adventure-9.2', 'adventure-9.3',
        ]);
    });

    it('gives each book a key prefix that the schema accepts', () => {
        const keys = { 'quest-5': 'q5', 'quest-6.1': 'q6-1', 'quest-6.2': 'q6-2', 'adventure-7.1': 'a7-1', 'adventure-7.2': 'a7-2',
            'adventure-8.1': 'a8-1', 'adventure-8.2': 'a8-2', 'adventure-8.3': 'a8-3', 'adventure-9.1': 'a9-1', 'adventure-9.2': 'a9-2', 'adventure-9.3': 'a9-3' };
        const meta = PackageMetaSchema.shape.key;
        for (const [book, key] of Object.entries(keys)) {
            expect(BOOK_KEYS[book]).toBe(key);
            expect(meta.safeParse(`${key}/3`).success).toBe(true);
        }
    });

    it('maps each book to its profile', () => {
        expect(BOOK_PROFILES).toMatchObject({
            'quest-5': 'quest-5', 'quest-6.1': 'quest-6', 'quest-6.2': 'quest-6', 'adventure-7.1': 'adventure-7', 'adventure-7.2': 'adventure-7',
            'adventure-8.1': 'adventure-8', 'adventure-8.2': 'adventure-8', 'adventure-8.3': 'adventure-8',
            'adventure-9.1': 'adventure-9', 'adventure-9.2': 'adventure-9', 'adventure-9.3': 'adventure-9',
        });
    });
});
