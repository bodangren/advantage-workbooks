// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { upsertSql, legacyStatements } from '../lib/inject/sql';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { legacyRows } from '../lib/inject/legacy';
import { fixturePackage } from './fixtures/lesson-package-fixture';

const NOW = new Date('2026-10-02T03:00:00Z');

describe('upsert statement', () => {
    it('inserts or updates by id, quotes every column, casts JSON, and sets the update time', () => {
        const { text, values } = upsertSql('multiple_choice_questions', { id: 'q1', question: 'Who?', options: ['a', 'b'], textualEvidence: 'It is.' }, { now: NOW, updatedAt: '"updatedAt"' });
        expect(text).toBe(
            'INSERT INTO "multiple_choice_questions" ("id", "question", "options", "textualEvidence", "updatedAt") VALUES ($1, $2, $3, $4, $5) ' +
                'ON CONFLICT ("id") DO UPDATE SET "question" = EXCLUDED."question", "options" = EXCLUDED."options", "textualEvidence" = EXCLUDED."textualEvidence", "updatedAt" = EXCLUDED."updatedAt"',
        );
        expect(values).toEqual(['q1', 'Who?', ['a', 'b'], 'It is.', NOW]);
    });

    it('sends JSON columns as text with a jsonb cast', () => {
        const { text, values } = upsertSql('article', { id: 'a1', sentences: [{ sentence: 'Hi.' }] }, { now: NOW, updatedAt: '"updated_at"', json: ['sentences'] });
        expect(text).toContain('VALUES ($1, $2::jsonb, $3)');
        expect(values[1]).toBe('[{"sentence":"Hi."}]');
    });
});

describe('legacy statements', () => {
    it('writes the article first, then the questions and the flashcard row', () => {
        const pkg = LessonPackageSchema.parse(fixturePackage());
        pkg.images[0].file = 'x.jpg';
        pkg.audio = {
            article: 'a.mp3',
            words: 'w.mp3',
            flashcard: 's.mp3',
            sentences: pkg.thai.paragraphs.flat().map((s, i) => ({ text: s.en, startTime: i, endTime: i + 0.9 })),
            wordTimes: pkg.glossary.map((g, i) => ({ text: g.word, startTime: i, endTime: i + 0.5 })),
            flashcardTimes: [{ text: 'Pip is happy.', startTime: 0, endTime: 1 }],
        };
        const rows = legacyRows(pkg, { articleId: 'a1', mcq: {}, saq: {}, laq: {} }, NOW);
        const statements = legacyStatements(rows, NOW);
        expect(statements.map((s) => s.text.split(' ')[2])).toEqual([
            '"article"',
            '"multiple_choice_questions"',
            '"multiple_choice_questions"',
            '"multiple_choice_questions"',
            '"short_answer_questions"',
            '"short_answer_questions"',
            '"long_answer_questions"',
            '"sentencs_and_words_for_flashcard"',
        ]);
        expect(statements[0].text).toContain('"validation_status" = EXCLUDED."validation_status"');
        expect(statements[0].text).toContain('"validated_at", "updated_at") VALUES');
        expect(statements[0].text).not.toMatch(/"created_at"/);
    });
});
