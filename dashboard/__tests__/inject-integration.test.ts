// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { legacyRows, newCuid } from '../lib/inject/legacy';
import { legacyStatements } from '../lib/inject/sql';
import { applyStatements, verifyLegacy } from '../lib/inject/run';
import { LOCALE_QUERIES, legacyLocalesFrom } from '../lib/inject/legacy-locales';
import { fixturePackage } from './fixtures/lesson-package-fixture';

/**
 * Runs the injector against real Postgres (PGlite, in this process) with the legacy schema from
 * ../primary-advantage/prisma/migrations. Skipped when that repo is not next to this one.
 */
const MIGRATIONS = path.resolve(process.cwd(), '../../primary-advantage/prisma/migrations');

function ready(): LessonPackage {
    const pkg = LessonPackageSchema.parse(fixturePackage());
    pkg.images[0].file = 'tb/media/1/hero.jpg';
    pkg.audio = {
        article: 'a.mp3',
        words: 'w.mp3',
        flashcard: 's.mp3',
        sentences: pkg.thai.paragraphs.flat().map((s, i) => ({ text: s.en, startTime: i * 2, endTime: i * 2 + 1.5 })),
        wordTimes: pkg.glossary.map((g, i) => ({ text: g.word, startTime: i, endTime: i + 0.6 })),
        flashcardTimes: [{ text: 'It is under the sofa!', startTime: 0, endTime: 1.4 }],
    };
    return pkg;
}

describe.skipIf(!fs.existsSync(MIGRATIONS))('legacy injection (Postgres with the legacy schema)', () => {
    const db = new PGlite();
    beforeAll(async () => {
        for (const dir of fs.readdirSync(MIGRATIONS).filter((d) => fs.existsSync(path.join(MIGRATIONS, d, 'migration.sql'))).sort()) {
            await db.exec(fs.readFileSync(path.join(MIGRATIONS, dir, 'migration.sql'), 'utf8'));
        }
    }, 120_000);
    beforeEach(async () => {
        await db.query('DELETE FROM article WHERE title = $1', ['Where Is the Ball?']);
    });

    const count = async (table: string, id: string) => Number((await db.query<{ count: number }>(`SELECT count(*)::int AS count FROM "${table}" WHERE article_id = $1`, [id])).rows[0].count);

    it('inserts a lesson, and a second run adds no rows', async () => {
        const id = newCuid();
        const rows = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        await applyStatements(db, legacyStatements(rows, new Date()));
        expect(await verifyLegacy(db, rows)).toEqual([]);
        const again = legacyRows(ready(), rows.ids, new Date());
        await applyStatements(db, legacyStatements(again, new Date()));
        expect(await count('multiple_choice_questions', id)).toBe(3);
        expect(await count('short_answer_questions', id)).toBe(2);
        expect(await count('long_answer_questions', id)).toBe(1);
        expect(await count('sentencs_and_words_for_flashcard', id)).toBe(1);
        expect(await verifyLegacy(db, again)).toEqual([]);
    });

    it('updates in place: the question rows keep their ids, and verify sees a change made by hand', async () => {
        const id = newCuid();
        const first = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        await applyStatements(db, legacyStatements(first, new Date()));
        const edited = ready();
        edited.bank.mcq[0].question = 'Where is the red ball?';
        const second = legacyRows(edited, first.ids, new Date());
        await applyStatements(db, legacyStatements(second, new Date()));
        const row = (await db.query<{ question: string }>('SELECT question FROM multiple_choice_questions WHERE id = $1', [first.ids.mcq.m1])).rows[0];
        expect(row.question).toBe('Where is the red ball?');
        await db.query('UPDATE article SET summary = $1 WHERE id = $2', ['changed by hand', id]);
        expect(await verifyLegacy(db, second)).toEqual(['article.summary differs']);
    });

    it("replaces an app article's old rows, and keeps its passage when only the line breaks differ", async () => {
        const id = newCuid();
        const old = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        await applyStatements(db, legacyStatements(old, new Date()));
        // The app's own rows: one more MCQ, a second flashcard row, and a passage with a line break in a paragraph.
        await db.query('INSERT INTO multiple_choice_questions (id, question, options, answer, article_id, "updatedAt") VALUES ($1, $2, $3, $4, $5, now())', [newCuid(), 'Old?', ['a', 'b', 'c', 'd'], 'a', id]);
        await db.query('INSERT INTO sentencs_and_words_for_flashcard (id, article_id, "updatedAt") VALUES ($1, $2, now())', [newCuid(), id]);
        const appPassage = old.article.passage.replace('. ', '.\n');
        await db.query('UPDATE article SET passage = $1 WHERE id = $2', [appPassage, id]);

        // The printed lesson knows only the article id: every other row is new.
        const rows = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        await applyStatements(db, legacyStatements(rows, new Date()));
        expect(await count('multiple_choice_questions', id)).toBe(3);
        expect(await count('short_answer_questions', id)).toBe(2);
        expect(await count('long_answer_questions', id)).toBe(1);
        expect(await count('sentencs_and_words_for_flashcard', id)).toBe(1);
        expect((await db.query<{ passage: string }>('SELECT passage FROM article WHERE id = $1', [id])).rows[0].passage).toBe(appPassage);
        expect(await verifyLegacy(db, rows)).toEqual([]);

        await db.query('UPDATE article SET passage = $1 WHERE id = $2', ['Other words.', id]);
        expect(await verifyLegacy(db, rows)).toEqual(['article.passage differs']);
        await applyStatements(db, legacyStatements(rows, new Date()));
        expect((await db.query<{ passage: string }>('SELECT passage FROM article WHERE id = $1', [id])).rows[0].passage).toBe(rows.article.passage);
    });

    it("reads an article's old cn, tw, and vi with the fetch queries", async () => {
        const id = newCuid();
        const rows = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        await applyStatements(db, legacyStatements(rows, new Date()));
        const old = { ...rows.article.translated_passage, cn: rows.article.translated_passage.cn.map((_, i) => `句子${i}`) };
        await db.query('UPDATE article SET translated_passage = $1, translated_summary = $2 WHERE id = $3', [JSON.stringify(old), JSON.stringify({ th: 'ท', cn: '摘要', tw: '摘要', vi: 'Tóm tắt' }), id]);
        const article = (await db.query<Record<string, unknown>>(LOCALE_QUERIES.article, [id])).rows[0];
        const flashcards = (await db.query<Record<string, unknown>>(LOCALE_QUERIES.flashcards, [id])).rows;
        const loc = legacyLocalesFrom(id, article, flashcards, new Date());
        expect(loc.summary).toEqual({ cn: '摘要', tw: '摘要', vi: 'Tóm tắt' });
        expect(loc.sentences[1]).toMatchObject({ en: 'Pip is a small brown puppy.', cn: '句子1' });
        expect(loc.words.map((w) => w.word)).toEqual(['sofa', 'under', 'puppy']);
    });

    it('rolls back the whole lesson when one statement fails', async () => {
        const id = newCuid();
        const rows = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        const statements = legacyStatements(rows, new Date());
        statements.push({ text: 'INSERT INTO no_such_table VALUES (1)', values: [] });
        await expect(applyStatements(db, statements)).rejects.toThrow();
        expect(await count('multiple_choice_questions', id)).toBe(0);
        expect((await db.query('SELECT id FROM article WHERE id = $1', [id])).rows).toHaveLength(0);
    });

    it('stores what Tutor and the app read: text[] options, jsonb sentences, the enum status', async () => {
        const id = newCuid();
        const rows = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        await applyStatements(db, legacyStatements(rows, new Date()));
        const a = (await db.query<Record<string, unknown>>('SELECT words, sentences, translated_passage, validation_status::text AS status, is_published FROM article WHERE id = $1', [id])).rows[0];
        expect(a.status).toBe('OK');
        expect(a.is_published).toBe(true);
        expect((a.sentences as { words: unknown[] }[])[1].words).toHaveLength(6);
        const q = (await db.query<{ options: string[] }>('SELECT options FROM multiple_choice_questions WHERE article_id = $1 LIMIT 1', [id])).rows[0];
        expect(q.options).toHaveLength(4);
    });
});
