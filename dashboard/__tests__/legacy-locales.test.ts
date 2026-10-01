// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { fixturePackage } from './fixtures/lesson-package-fixture';
import { LOCALE_QUERIES, legacyLocalesFrom, matchKey, matchLocales } from '../lib/inject/legacy-locales';
import { isReadOnlySql } from '../lib/inject/legacy-sample';

const NOW = new Date('2026-10-02T03:00:00Z');

/** The app's old rows for the fixture lesson: its own sentence split, curly quotes, and a gap. */
const OLD_ARTICLE = {
    sentences: [
        { sentence: 'This is Pip.', startTime: 0, endTime: 1 },
        { sentence: 'Pip is a small brown puppy.', startTime: 1, endTime: 2 },
        { sentence: 'An old sentence that the refresh split.', startTime: 2, endTime: 3 },
        { sentence: '\u201cWhere is the ball?\u201d says Tom.', startTime: 3, endTime: 4 },
    ],
    translated_passage: {
        th: ['ท1', 'ท2', 'ท3', 'ท4'],
        cn: ['这是皮普。', '皮普是一只棕色小狗。', '旧句子。', '“球在哪里？”汤姆说。'],
        tw: ['這是皮普。', '皮普是一隻棕色小狗。', '舊句子。', '「球在哪裡？」湯姆說。'],
        vi: ['Đây là Pip.', 'Pip là một chú cún nhỏ màu nâu.', 'Câu cũ.', ''],
    },
    translated_summary: { th: 'สรุป', cn: '旧摘要', tw: '舊摘要', vi: 'Tóm tắt cũ' },
};

const OLD_FLASHCARDS = [
    {
        sentence: [{ sentence: 'It is under the sofa!', translation: { th: 'ท', cn: '它在沙发下面！', tw: '它在沙發下面！', vi: 'Nó ở dưới ghế sofa!' }, timeSeconds: 0 }],
        words: [
            { vocabulary: 'Sofa', definition: { en: 'A seat.', th: 'โซฟา', cn: '沙发', tw: '沙發', vi: 'ghế sofa' }, timeSeconds: 0 },
            { vocabulary: 'ball', definition: 'A round toy.', timeSeconds: 1 },
        ],
    },
];

function printed(): LessonPackage {
    const pkg = LessonPackageSchema.parse(fixturePackage());
    pkg.locales = legacyLocalesFrom('cart1', OLD_ARTICLE, OLD_FLASHCARDS, NOW);
    return pkg;
}

describe('match key', () => {
    it('ignores case, curly quotes, end marks, and line breaks', () => {
        expect(matchKey('Pip’s ball is red!')).toBe(matchKey("pip's ball\nis red."));
        expect(matchKey('  Where is the ball? ')).toBe('where is the ball');
        expect(matchKey('Pip is small.')).not.toBe(matchKey('Pip is big.'));
    });
});

describe('legacy locales from the old rows', () => {
    it('keeps each old sentence with its cn, tw, and vi, then the flashcard sentences and words', () => {
        const loc = legacyLocalesFrom('cart1', OLD_ARTICLE, OLD_FLASHCARDS, NOW);
        expect(loc).toMatchObject({ articleId: 'cart1', fetchedAt: '2026-10-02T03:00:00.000Z', summary: { cn: '旧摘要', tw: '舊摘要', vi: 'Tóm tắt cũ' } });
        expect(loc.sentences.map((s) => s.en)).toEqual(['This is Pip.', 'Pip is a small brown puppy.', 'An old sentence that the refresh split.', '\u201cWhere is the ball?\u201d says Tom.', 'It is under the sofa!']);
        expect(loc.sentences[3]).toEqual({ en: '\u201cWhere is the ball?\u201d says Tom.', cn: '“球在哪里？”汤姆说。', tw: '「球在哪裡？」湯姆說。', vi: '' });
        // A word with an English-only definition (a string) has nothing to keep.
        expect(loc.words).toEqual([{ word: 'Sofa', cn: '沙发', tw: '沙發', vi: 'ghế sofa' }]);
    });

    it('reads JSON that comes back as text, and an article with no translations', () => {
        const loc = legacyLocalesFrom('cart1', { sentences: JSON.stringify(OLD_ARTICLE.sentences), translated_passage: JSON.stringify(OLD_ARTICLE.translated_passage), translated_summary: null }, [], NOW);
        expect(loc.sentences).toHaveLength(4);
        expect(loc.summary).toEqual({ cn: '', tw: '', vi: '' });
        expect(legacyLocalesFrom('cart1', {}, [], NOW)).toMatchObject({ sentences: [], words: [] });
    });

    it('reads with SELECT only', () => {
        for (const sql of Object.values(LOCALE_QUERIES)) expect(isReadOnlySql(sql)).toBe(true);
    });
});

describe('locale match', () => {
    it('matches the old translations by sentence, and fills a gap with the English sentence', () => {
        const pkg = printed();
        const m = matchLocales(pkg);
        const english = pkg.thai.paragraphs.flat().map((s) => s.en);
        expect(m.passage.cn).toHaveLength(english.length);
        expect(m.passage.cn[0]).toBe('这是皮普。');
        expect(m.passage.tw[english.indexOf('Pip is a small brown puppy.')]).toBe('皮普是一隻棕色小狗。');
        // The old row has curly quotes. Only its vi is empty: vi gets the English, cn keeps its translation.
        const where = english.indexOf('"Where is the ball?" says Tom.');
        expect(m.passage.cn[where]).toBe('“球在哪里？”汤姆说。');
        expect(m.passage.vi[where]).toBe('"Where is the ball?" says Tom.');
        // The flashcard sentences of the old row count too.
        expect(m.sentence('It is under the sofa!')).toEqual({ cn: '它在沙发下面！', tw: '它在沙發下面！', vi: 'Nó ở dưới ghế sofa!' });
        const unknown = english.find((s) => ![...OLD_ARTICLE.sentences.map((o) => o.sentence), 'It is under the sofa!'].some((o) => matchKey(o) === matchKey(s)))!;
        expect(unknown).toBe('Pip can see a red ball.');
        expect(m.passage.cn[english.indexOf(unknown)]).toBe(unknown);
    });

    it('keeps the old summary and the old word definitions; English fills the rest', () => {
        const m = matchLocales(printed());
        expect(m.summary).toEqual({ cn: '旧摘要', tw: '舊摘要', vi: 'Tóm tắt cũ' });
        expect(m.word('sofa', 'A long soft seat.')).toEqual({ cn: '沙发', tw: '沙發', vi: 'ghế sofa' });
        expect(m.word('ball', 'A round toy.')).toEqual({ cn: 'A round toy.', tw: 'A round toy.', vi: 'A round toy.' });
    });

    it('gives English everywhere for a lesson with no old article (a new lesson such as E12)', () => {
        const pkg = LessonPackageSchema.parse(fixturePackage());
        const m = matchLocales(pkg);
        expect(m.summary).toEqual({ cn: pkg.text.summary, tw: pkg.text.summary, vi: pkg.text.summary });
        expect(m.passage.vi).toEqual(pkg.thai.paragraphs.flat().map((s) => s.en));
        expect(m.matched).toMatchObject({ sentences: 0, words: 0, summary: false });
    });

    it('counts the sentences and words that have an old translation in every locale', () => {
        const pkg = printed();
        const m = matchLocales(pkg);
        // This is Pip. / Pip is a small brown puppy. / It is under the sofa! — the "Where is the ball?" sentence has no vi.
        expect(m.matched).toMatchObject({ sentences: 3, of: pkg.thai.paragraphs.flat().length, words: 1, ofWords: pkg.glossary.length, summary: true });
    });
});
