// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { fixturePackage } from './fixtures/lesson-package-fixture';
import { appArticleId, appUploadArgs, backupPath, estimateWordTimes, levelProblem, legacyRows, newCuid, bucketObjects, rowsHash } from '../lib/inject/legacy';
import { flashcardSentences } from '../lib/media/audio';

const NOW = new Date('2026-10-02T03:00:00Z');

function withMedia(): LessonPackage {
    const pkg = LessonPackageSchema.parse(fixturePackage());
    pkg.images[0].file = 'tb/media/1/hero.jpg';
    pkg.audio = {
        voice: 'English_expressive_narrator',
        article: 'tb/media/1/article.mp3',
        words: 'tb/media/1/words.mp3',
        flashcard: 'tb/media/1/sentences.mp3',
        sentences: pkg.thai.paragraphs.flat().map((s, i) => ({ text: s.en, startTime: i * 2, endTime: i * 2 + 1.5 })),
        wordTimes: pkg.glossary.map((g, i) => ({ text: g.word, startTime: i, endTime: i + 0.6 })),
        flashcardTimes: [{ text: 'It is under the sofa!', startTime: 0, endTime: 1.4 }],
    };
    return pkg;
}

const IDS = { articleId: 'cart1', mcq: {}, saq: {}, laq: {}, flashcardId: 'cfl1' };

describe('word times', () => {
    it('spreads the words over the sentence by length, without the edge pads', () => {
        const words = estimateWordTimes('Pip is a small dog.', 10, 12, 0.06);
        expect(words.map((w) => w.word)).toEqual(['Pip', 'is', 'a', 'small', 'dog.']);
        expect(words[0].start).toBeCloseTo(10.06, 2);
        expect(words.at(-1)!.end).toBeCloseTo(11.94, 2);
        for (let i = 1; i < words.length; i++) expect(words[i].start).toBeCloseTo(words[i - 1].end, 5);
        expect(words[3].end - words[3].start).toBeGreaterThan(words[2].end - words[2].start);
    });
});

describe('levels', () => {
    it('accepts the app pairs and refuses a mismatch', () => {
        expect(levelProblem('A0+', 3)).toBeUndefined();
        expect(levelProblem('A1', 5)).toBeUndefined();
        expect(levelProblem('A0+', 2)).toMatch(/A0\+ is level 3/);
        expect(levelProblem('A3', 3)).toMatch(/unknown/);
    });
});

describe('flashcard sentences', () => {
    it('picks 3 to 5 sentences with the most glossed words, in text order', () => {
        const pkg = LessonPackageSchema.parse(fixturePackage());
        const picked = flashcardSentences(pkg);
        expect(picked.length).toBeGreaterThanOrEqual(3);
        expect(picked.length).toBeLessThanOrEqual(5);
        expect(picked).toContain('It is under the sofa!');
        expect(picked).toContain('Pip is a small brown puppy.');
        const order = pkg.thai.paragraphs.flat().map((s) => s.en);
        expect([...picked].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(picked);
    });
});

describe('legacy rows', () => {
    it('maps the article columns', () => {
        const rows = legacyRows(withMedia(), IDS, NOW);
        const a = rows.article;
        expect(a).toMatchObject({
            id: 'cart1',
            title: 'Where Is the Ball?',
            type: 'fiction',
            audio_url: '/audios/articles/cart1.mp3',
            audio_word_url: '/audios/words/cart1.mp3',
            is_published: true,
            is_approved: true,
            is_draft: false,
            validation_status: 'OK',
            author_id: '',
            rating: 5,
        });
        expect(a.passage.split('\n\n')).toHaveLength(2);
        expect(a.translated_passage.th).toHaveLength(6);
        expect(a.translated_passage.th[0]).toBe('นี่คือปิ๊ป');
        expect(a.translated_passage.cn).toEqual([]);
        expect(a.translated_summary.th).toBeTruthy();
        expect(a.sentences[1]).toMatchObject({ sentence: 'Pip is a small brown puppy.', startTime: 2, endTime: 3.5 });
        expect(a.sentences[1].words.map((w: { word: string }) => w.word)).toEqual(['Pip', 'is', 'a', 'small', 'brown', 'puppy.']);
        // The app reads the vocabulary from the flashcard row; no production article has `words` (sample 2026-10-01).
        expect(a.words).toBeNull();
    });

    it('keeps the question ids it has and makes new ones for the rest', () => {
        const pkg = withMedia();
        const rows = legacyRows(pkg, { ...IDS, mcq: { m1: 'cq-old' } }, NOW);
        expect(rows.mcq[0]).toMatchObject({ id: 'cq-old', question: 'Where is the ball?', answer: 'under the sofa', textualEvidence: 'It is under the sofa!', article_id: 'cart1' });
        expect(rows.mcq[0].options).toHaveLength(4);
        expect(rows.mcq[1].id).toMatch(/^c[0-9a-z]{24}$/);
        expect(rows.saq.map((q) => q.answer)).toEqual(['It is under the sofa.', 'Pip is brown.']);
        expect(rows.laq).toHaveLength(1);
        expect(rows.ids.mcq).toMatchObject({ m1: 'cq-old', m2: rows.mcq[1].id });
    });

    it('builds the flashcard row from the flashcard audio and the glossary', () => {
        const rows = legacyRows(withMedia(), IDS, NOW);
        expect(rows.flashcard).toMatchObject({
            id: 'cfl1',
            article_id: 'cart1',
            audio_sentences_url: 'audios/sentences/cart1.mp3',
            words_url: 'audios/words/cart1.mp3',
        });
        expect(rows.flashcard.sentence[0]).toEqual({
            sentence: 'It is under the sofa!',
            translation: { th: 'มันอยู่ใต้โซฟา!', cn: '', tw: '', vi: '' },
            timeSeconds: 0,
        });
        expect(rows.flashcard.words[0]).toEqual({ vocabulary: 'sofa', definition: { en: 'A long soft seat.', th: 'โซฟา', cn: '', tw: '', vi: '' }, timeSeconds: 0 });
    });

    it('updates the app article of a printed lesson, and keeps an injected id first', () => {
        const pkg = withMedia();
        expect(appArticleId(pkg)).toBeUndefined();
        pkg.meta.printed = { file: 'p.json', articleId: 'cprinted', thaiParagraphs: [], imageUrls: [] } as unknown as typeof pkg.meta.printed;
        expect(appArticleId(pkg)).toBe('cprinted');
        pkg.db.legacy = { ...IDS, articleId: 'cinjected' } as unknown as typeof pkg.db.legacy;
        expect(appArticleId(pkg)).toBe('cinjected');
    });

    it('refuses a package that is not ready', () => {
        const pkg = withMedia();
        pkg.audio.article = undefined;
        expect(() => legacyRows(pkg, IDS, NOW)).toThrow(/audio/);
        const bad = withMedia();
        bad.meta.cefrLevel = 'A1';
        expect(() => legacyRows(bad, IDS, NOW)).toThrow(/A1 is level 5/);
    });
});

describe('bucket objects', () => {
    it('puts the pictures in paragraph order as PNG and the audio at the app paths', () => {
        const pkg = withMedia();
        expect(bucketObjects(pkg, 'cart1')).toEqual([
            { from: 'tb/media/1/hero.jpg', to: 'images/cart1_1.png', png: true },
            { from: 'tb/media/1/article.mp3', to: 'audios/articles/cart1.mp3', png: false },
            { from: 'tb/media/1/words.mp3', to: 'audios/words/cart1.mp3', png: false },
            { from: 'tb/media/1/sentences.mp3', to: 'audios/sentences/cart1.mp3', png: false },
        ]);
    });
});

describe('app upload', () => {
    it('makes each object public like the app files (the bucket has per-object access lists)', () => {
        expect(appUploadArgs('/tmp/x.png', 'primary-app-storage', 'images/cart1_1.png')).toEqual([
            'storage',
            'cp',
            '/tmp/x.png',
            'gs://primary-app-storage/images/cart1_1.png',
            '--cache-control=public, max-age=300',
            '--predefined-acl=publicRead',
        ]);
    });
});

describe('bucket backup', () => {
    it('copies an old object under backup/<time>/ with its own path', () => {
        expect(backupPath('images/cart1_1.png', NOW)).toBe('backup/20261002-030000/images/cart1_1.png');
        expect(backupPath('articles/cart1/manifest.json', NOW)).toBe('backup/20261002-030000/articles/cart1/manifest.json');
    });
});

describe('ids', () => {
    it('makes cuid-shaped ids that do not repeat', () => {
        const ids = new Set(Array.from({ length: 2000 }, () => newCuid()));
        expect(ids.size).toBe(2000);
        for (const id of ids) expect(id).toMatch(/^c[0-9a-z]{24}$/);
    });
});

describe('content hash', () => {
    it('changes with the content and not with the run time', () => {
        const ids = { articleId: 'cart1', mcq: { m1: 'a', m2: 'b', m3: 'c' }, saq: { s1: 'd', s2: 'e' }, laq: { l1: 'f' }, flashcardId: 'g' };
        const a = rowsHash(legacyRows(withMedia(), ids, NOW));
        expect(rowsHash(legacyRows(withMedia(), ids, new Date('2027-01-01')))).toBe(a);
        const changed = withMedia();
        changed.text.summary = 'Another summary.';
        expect(rowsHash(legacyRows(changed, ids, NOW))).not.toBe(a);
    });

    it('counts the Tutor clips too, so a new voice uploads again', () => {
        const rows = legacyRows(withMedia(), { articleId: 'cart1', mcq: {}, saq: {}, laq: {}, flashcardId: 'g' }, NOW);
        expect(rowsHash(rows, undefined)).toBe(rowsHash(rows));
        const female = rowsHash(rows, { voice: 'English_captivating_female1' });
        expect(female).not.toBe(rowsHash(rows));
        expect(rowsHash(rows, { voice: 'English_magnetic_voiced_man' })).not.toBe(female);
    });
});
