// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Client } from 'pg';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { legacyRows, newCuid } from '../lib/inject/legacy';
import { legacyStatements } from '../lib/inject/sql';
import { applyStatements, verifyLegacy } from '../lib/inject/run';
import { fixturePackage } from './fixtures/lesson-package-fixture';

/**
 * Runs against a local database with the legacy schema (scripts/inject/test-db.sh). Skipped when
 * INJECT_TEST_DATABASE_URL is not set. Never point it at production: it deletes rows.
 */
const URL = process.env.INJECT_TEST_DATABASE_URL;

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

describe.skipIf(!URL)('legacy injection (local database)', () => {
    const client = new Client({ connectionString: URL });
    beforeAll(async () => {
        if (URL && !/127\.0\.0\.1|localhost/.test(URL)) throw new Error('INJECT_TEST_DATABASE_URL must be a local database');
        await client.connect();
    });
    afterAll(async () => {
        await client.end();
    });
    beforeEach(async () => {
        await client.query('DELETE FROM article WHERE title = $1', ['Where Is the Ball?']);
    });

    const count = async (table: string, id: string) => Number((await client.query(`SELECT count(*) FROM "${table}" WHERE article_id = $1`, [id])).rows[0].count);

    it('inserts a lesson, and a second run adds no rows', async () => {
        const id = newCuid();
        const rows = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        await applyStatements(client, legacyStatements(rows, new Date()));
        expect(await verifyLegacy(client, rows)).toEqual([]);
        const again = legacyRows(ready(), rows.ids, new Date());
        await applyStatements(client, legacyStatements(again, new Date()));
        expect(await count('multiple_choice_questions', id)).toBe(3);
        expect(await count('short_answer_questions', id)).toBe(2);
        expect(await count('sentencs_and_words_for_flashcard', id)).toBe(1);
        expect(await verifyLegacy(client, again)).toEqual([]);
    });

    it('updates in place: the question rows keep their ids, and verify sees a change made by hand', async () => {
        const id = newCuid();
        const first = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        await applyStatements(client, legacyStatements(first, new Date()));
        const edited = ready();
        edited.bank.mcq[0].question = 'Where is the red ball?';
        const second = legacyRows(edited, first.ids, new Date());
        await applyStatements(client, legacyStatements(second, new Date()));
        const row = (await client.query('SELECT id, question FROM multiple_choice_questions WHERE id = $1', [first.ids.mcq.m1])).rows[0];
        expect(row.question).toBe('Where is the red ball?');
        await client.query('UPDATE article SET summary = $1 WHERE id = $2', ['changed by hand', id]);
        expect(await verifyLegacy(client, second)).toEqual(['article.summary differs']);
    });

    it('rolls back the whole lesson when one statement fails', async () => {
        const id = newCuid();
        const rows = legacyRows(ready(), { articleId: id, mcq: {}, saq: {}, laq: {} }, new Date());
        const statements = legacyStatements(rows, new Date());
        statements.push({ text: 'INSERT INTO no_such_table VALUES (1)', values: [] });
        await expect(applyStatements(client, statements)).rejects.toThrow();
        expect((await client.query('SELECT count(*) FROM article WHERE id = $1', [id])).rows[0].count).toBe('0');
    });
});
