// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { checkPackage, type PackageCheckContext } from '../lib/lesson-package/checks';
import { printedToPackage, TODO } from '../lib/lesson-package/import-printed';
import { applySupplement, tagsFor, type Supplement } from '../lib/lesson-package/supplement';
import { VOICES } from '../lib/media/audio';
import { fixtureIndex, FIXTURE_OBJECTIVES } from './fixtures/lesson-package-fixture';

const RAW = {
    lesson_title: 'A New Ball Game',
    level_name: 'Level 2',
    cefr_level: 'CEFR A0',
    article_type: 'fiction',
    genre: 'Family',
    vocabulary: [
        { word: 'Aunt', definition: 'The sister of your father or mother.', thai_definition: 'ป้า/น้า' },
        { word: 'red', definition: 'A color.', thai_definition: 'สีแดง' },
    ],
    article_url: 'https://primary.reading-advantage.com/student/read/cabc',
    article_paragraphs: [{ text: 'This is Lisa. Her Aunt comes.' }, { text: 'The ball is red!' }],
    comprehension_questions: [{ number: 1, question: 'Who comes?', options: ['Her Aunt', 'Her dog', 'Her cat'] }],
    mc_answers: [{ number: 1, letter: 'a' }],
    short_answer_question: 'Who comes to Lisa?',
    translation_paragraphs: [{ text: 'นี่คือลิซ่า ป้าของเธอมา' }, { text: '' }],
};

const base = (): LessonPackage => LessonPackageSchema.parse(printedToPackage(RAW, { book: 'origins-2', lesson: 'L05', number: 5, key: 'o2/5', file: 'p.json' }));
const ctx: PackageCheckContext = { index: fixtureIndex, prior: [], objectiveIds: FIXTURE_OBJECTIVES };

const SUP: Supplement = {
    summary: 'Lisa plays with a red ball.',
    thaiSummary: 'ลิซ่าเล่นลูกบอลสีแดง',
    voice: 'female',
    thai: { 'The ball is red!': 'ลูกบอลเป็นสีแดง!' },
    glossary: { Aunt: { pos: 'noun' }, red: { pos: 'adjective', definition: 'The color of a tomato.' } },
    mcq: {
        p1: { add: 'Her teacher', evidence: 'Her Aunt comes.', objectives: ['R17.2'] },
        m2: { question: 'What color is the ball?', options: ['red', 'blue', 'green', 'brown'], answer: 'red', evidence: 'The ball is red!', objectives: ['R17.2'] },
    },
    saq: { s1: { answer: 'Her Aunt comes.', objectives: ['L19.2'] }, s2: { question: 'What color is the ball?', answer: 'It is red.', objectives: ['R17.2'] } },
    laq: [{ question: 'Draw your family. Tell about it.', objectives: ['R17.2'] }],
    images: { hero: { prompt: 'Lisa waves at her Aunt.', characters: ['Lisa'], caption: 'Lisa and her Aunt' } },
};

describe('applySupplement', () => {
    it('fills the fields to write and adds the new questions after the printed ones', () => {
        const pkg = applySupplement(base(), SUP);
        expect(pkg.text.summary).toBe('Lisa plays with a red ball.');
        expect(pkg.thai.summary).toBe('ลิซ่าเล่นลูกบอลสีแดง');
        expect(pkg.thai.paragraphs[1]).toEqual([{ en: 'The ball is red!', th: 'ลูกบอลเป็นสีแดง!' }]);
        expect(pkg.glossary.map((g) => [g.word, g.pos, g.definition])).toEqual([
            ['Aunt', 'noun', 'The sister of your father or mother.'],
            ['red', 'adjective', 'The color of a tomato.'],
        ]);
        expect(pkg.bank.mcq.map((q) => q.id)).toEqual(['p1', 'm2']);
        expect(pkg.bank.mcq[0]).toMatchObject({ options: ['Her Aunt', 'Her dog', 'Her cat', 'Her teacher'], answer: 'Her Aunt', evidence: 'Her Aunt comes.', objectives: ['R17.2'] });
        expect(pkg.bank.saq.map((q) => [q.id, q.answer])).toEqual([
            ['s1', 'Her Aunt comes.'],
            ['s2', 'It is red.'],
        ]);
        expect(pkg.bank.laq).toEqual([{ id: 'l1', question: 'Draw your family. Tell about it.', objectives: ['R17.2'] }]);
        expect(pkg.images[0]).toMatchObject({ prompt: 'Lisa waves at her Aunt.', characters: ['Lisa'], caption: 'Lisa and her Aunt' });
        expect(pkg.audio.voice).toBe(VOICES.female);
    });

    it('keeps the locked parts locked', () => {
        const pkg = applySupplement(base(), SUP);
        expect(checkPackage(pkg, ctx).checks.find((c) => c.id === 'locked')?.status).toBe('pass');
        expect(() => applySupplement(base(), { mcq: { p1: { question: 'Who visits?' } } } as Supplement)).toThrow(/p1 is printed/);
        expect(() => applySupplement(base(), { glossary: { Uncle: { pos: 'noun' } } })).toThrow(/Uncle is not a vocabulary word/);
        expect(() => applySupplement(base(), { thai: { 'Not in the text.': 'x' } })).toThrow(/not a sentence of the text/);
    });

    it('adds a fourth option only to a printed MCQ with three', () => {
        const pkg = applySupplement(base(), SUP);
        expect(() => applySupplement(pkg, { mcq: { p1: { add: 'Her friend' } } })).toThrow(/p1 has 4 options/);
    });

    it('gives the same Thai to every copy of a sentence', () => {
        const pkg = base();
        pkg.thai.paragraphs[1].push({ en: 'This is Lisa.', th: '' });
        const next = applySupplement(pkg, { thai: { 'This is Lisa.': 'นี่คือลิซ่า' } });
        expect(next.thai.paragraphs.flat().filter((p) => p.en === 'This is Lisa.').map((p) => p.th)).toEqual(['นี่คือลิซ่า', 'นี่คือลิซ่า']);
    });

    it('fills an empty sentence with the Thai of the same sentence elsewhere in the lesson', () => {
        const pkg = base();
        pkg.thai.paragraphs[1].push({ en: 'Her Aunt comes.', th: '' });
        const next = applySupplement(pkg, {});
        expect(next.thai.paragraphs[1][1]).toEqual({ en: 'Her Aunt comes.', th: 'ป้าของเธอมา' });
    });

    it('leaves a field alone when the supplement does not give it', () => {
        const pkg = applySupplement(base(), { voice: 'male' });
        expect(pkg.audio.voice).toBe(VOICES.male);
        expect(pkg.glossary[0].pos).toBe(TODO);
        expect(pkg.text.summary).toBe('');
    });
});

describe('tagsFor', () => {
    it('takes the target and supporting objectives from the tagging file', () => {
        const tagging = { lessons: [{ id: 'O2-05', primary_tags: [{ id: 'R17.2' }, { id: 'L19.2' }], extra_tags: [{ id: 'R21.1' }] }] };
        expect(tagsFor(tagging, 'origins-2', 5)).toEqual({ targetObjectives: ['R17.2', 'L19.2'], supportingObjectives: ['R21.1'] });
        expect(tagsFor(tagging, 'origins-3.1', 5)).toBeUndefined();
    });
});
