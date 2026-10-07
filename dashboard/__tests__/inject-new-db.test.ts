// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { fixturePackage } from './fixtures/lesson-package-fixture';
import {
    deleteOthersNewSql,
    insertSql,
    newRows,
    newRowsHash,
    newStatements,
    planIds,
    readLegacyMap,
    updateSql,
    verifyNew,
    verifyPackageNew,
    type IdMap,
} from '../lib/inject/new-db';

const NOW = new Date('2026-10-14T03:00:00Z');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

/** The ids of a counter: a1, a2, ... in the shape of a uuid is not needed in a plan test. */
const counter = () => {
    let n = 0;
    return () => `uuid-${++n}`;
};

const mapOf = (entries: Record<string, string>): IdMap => new Map(Object.entries(entries));
const bank = (pkg: LessonPackage) => ({ mcq: pkg.bank.mcq.map((q) => q.id), saq: pkg.bank.saq.map((q) => q.id), laq: pkg.bank.laq.map((q) => q.id) });

describe('update or insert rule', () => {
    it('inserts every row of a new lesson with a new uuid, and the picture key is the uuid', () => {
        const pkg = withMedia();
        const plan = planIds({ bank: bank(pkg) }, mapOf({}), { newId: counter() });
        expect(plan.article).toEqual({ id: 'uuid-1', action: 'insert', source: 'fresh' });
        expect(plan.key).toBe('uuid-1');
        expect(Object.values(plan.mcq).every((p) => p.action === 'insert')).toBe(true);
        expect(plan.flashcard.action).toBe('insert');
        expect(planIds({ bank: bank(pkg) }, mapOf({})).article.id).toMatch(UUID);
    });

    it('updates the rows that the cutover moved, found through the id map, and the picture key is the cuid', () => {
        const pkg = withMedia();
        const map = mapOf({ 'article:cart1': 'u-art', 'multiple_choice_questions:cq1': 'u-q1', 'short_answer_questions:cs1': 'u-s1', 'sentencs_and_words_for_flashcard:cfl1': 'u-fl' });
        const plan = planIds(
            { legacyArticleId: 'cart1', legacy: { articleId: 'cart1', mcq: { m1: 'cq1' }, saq: { s1: 'cs1' }, laq: {}, flashcardId: 'cfl1' }, bank: bank(pkg) },
            map,
            { newId: counter() },
        );
        expect(plan.article).toEqual({ id: 'u-art', action: 'update', source: 'legacy-map' });
        expect(plan.key).toBe('cart1');
        expect(plan.mcq.m1).toEqual({ id: 'u-q1', action: 'update', source: 'legacy-map' });
        expect(plan.saq.s1).toEqual({ id: 'u-s1', action: 'update', source: 'legacy-map' });
        expect(plan.flashcard).toEqual({ id: 'u-fl', action: 'update', source: 'legacy-map' });
        // A question that the legacy database never had gets a new row.
        expect(plan.mcq.m2).toEqual({ id: 'uuid-1', action: 'insert', source: 'fresh' });
    });

    it('refuses a legacy article that the map does not know (the cutover has not moved it)', () => {
        const pkg = withMedia();
        expect(() => planIds({ legacyArticleId: 'cart9', bank: bank(pkg) }, mapOf({}))).toThrow(/cart9.*legacy id map/);
    });

    it('inserts a legacy question that the map does not know', () => {
        const pkg = withMedia();
        const plan = planIds(
            { legacyArticleId: 'cart1', legacy: { articleId: 'cart1', mcq: { m1: 'cq-gone' }, saq: {}, laq: {} }, bank: bank(pkg) },
            mapOf({ 'article:cart1': 'u-art' }),
            { newId: counter() },
        );
        expect(plan.mcq.m1.action).toBe('insert');
    });

    it('keeps the ids of an earlier new-database run before the map', () => {
        const pkg = withMedia();
        const plan = planIds(
            {
                legacyArticleId: 'cart1',
                legacy: { articleId: 'cart1', mcq: { m1: 'cq1' }, saq: {}, laq: {} },
                current: { articleId: 'u-art', mcq: { m1: 'u-mine' }, saq: {}, laq: {}, flashcardId: 'u-fl' },
                bank: bank(pkg),
            },
            mapOf({ 'article:cart1': 'u-other', 'multiple_choice_questions:cq1': 'u-q1' }),
        );
        expect(plan.article).toEqual({ id: 'u-art', action: 'update', source: 'new' });
        expect(plan.mcq.m1).toEqual({ id: 'u-mine', action: 'update', source: 'new' });
        expect(plan.flashcard).toEqual({ id: 'u-fl', action: 'update', source: 'new' });
        expect(plan.key).toBe('cart1');
    });

    it('in a dry run, treats a legacy id as mapped without a lookup', () => {
        const pkg = withMedia();
        const plan = planIds({ legacyArticleId: 'cart1', legacy: { articleId: 'cart1', mcq: { m1: 'cq1' }, saq: {}, laq: {} }, bank: bank(pkg) }, mapOf({}), { dryRun: true });
        expect(plan.article).toMatchObject({ action: 'update', source: 'legacy-map', id: '<uuid of article cart1>' });
        expect(plan.mcq.m1).toMatchObject({ action: 'update', id: '<uuid of multiple_choice_questions cq1>' });
    });
});

describe('new rows', () => {
    const plan = () => planIds({ bank: bank(withMedia()) }, mapOf({}), { newId: counter() });

    it('maps the article columns of the new schema', () => {
        const pkg = withMedia();
        const rows = newRows(pkg, planIds({ bank: bank(pkg) }, mapOf({}), { newId: counter() }), NOW);
        const a = rows.article;
        expect(a).toMatchObject({
            id: 'uuid-1',
            title: 'Where Is the Ball?',
            type: 'fiction',
            level: pkg.meta.raLevel,
            ra_level: pkg.meta.raLevel,
            cefr_level: pkg.meta.cefrLevel,
            image: 'uuid-1',
            audio_url: '/audios/articles/uuid-1.mp3',
            audio_word_url: '/audios/words/uuid-1.mp3',
            published: true,
            is_published: true,
            is_approved: true,
            is_draft: false,
            rating: 5,
        });
        expect(a.content).toBe(a.passage);
        expect(a.passage.split('\n\n')).toHaveLength(2);
        expect(a.translated_passage.th).toHaveLength(6);
        expect(a.sentences[1]).toMatchObject({ sentence: 'Pip is a small brown puppy.', startTime: 2, endTime: 3.5 });
        // No such column in the new schema, or a foreign key to users.
        expect(a).not.toHaveProperty('validation_status');
        expect(a).not.toHaveProperty('validated_at');
        expect(a).not.toHaveProperty('author_id');
    });

    it('names the picture and audio objects with the legacy cuid when the article has one', () => {
        const pkg = withMedia();
        const p = planIds({ legacyArticleId: 'cart1', bank: bank(pkg) }, mapOf({ 'article:cart1': 'u-art' }));
        const rows = newRows(pkg, p, NOW);
        expect(rows.article.id).toBe('u-art');
        expect(rows.article.image).toBe('cart1');
        expect(rows.article.audio_url).toBe('/audios/articles/cart1.mp3');
        expect(rows.flashcard.audio_sentences_url).toBe('audios/sentences/cart1.mp3');
        expect(rows.flashcard.words_url).toBe('audios/words/cart1.mp3');
        expect(rows.key).toBe('cart1');
    });

    it('writes the correct answer as an index into the options, and the order of the bank', () => {
        const pkg = withMedia();
        const rows = newRows(pkg, plan(), NOW);
        rows.mcq.forEach((q, i) => {
            expect(q.options[q.correct_answer]).toBe(q.answer);
            expect(q.order).toBe(i);
            expect(q.article_id).toBe('uuid-1');
        });
        expect(rows.mcq[0]).toMatchObject({ question: 'Where is the ball?', answer: 'under the sofa', textual_evidence: 'It is under the sofa!' });
        expect(rows.mcq[0].options).toHaveLength(4);
    });

    it('writes the sample answer of a short question and keeps its order', () => {
        const rows = newRows(withMedia(), plan(), NOW);
        expect(rows.saq.map((q) => q.sample_answer)).toEqual(['It is under the sofa.', 'Pip is brown.']);
        expect(rows.saq.map((q) => q.answer)).toEqual(['It is under the sofa.', 'Pip is brown.']);
        expect(rows.saq.map((q) => q.order)).toEqual([0, 1]);
        expect(rows.laq).toHaveLength(1);
        expect(rows.laq[0]).not.toHaveProperty('order');
    });

    it('builds the flashcard row and the sentence timing like the legacy target', () => {
        const rows = newRows(withMedia(), plan(), NOW);
        expect(rows.flashcard.sentence[0]).toEqual({
            sentence: 'It is under the sofa!',
            translation: { th: 'มันอยู่ใต้โซฟา!', cn: 'It is under the sofa!', tw: 'It is under the sofa!', vi: 'It is under the sofa!' },
            timeSeconds: 0,
        });
        expect(rows.flashcard.words[0]).toMatchObject({ vocabulary: 'sofa', timeSeconds: 0 });
        expect(rows.article.sentences[0].words[0]).toHaveProperty('start');
    });

    it('refuses a correct answer that is not one of the options', () => {
        const pkg = withMedia();
        pkg.bank.mcq[0].answer = 'nowhere';
        expect(() => newRows(pkg, plan(), NOW)).toThrow(/m1.*not one of the options/);
    });

    it('refuses a package that is not ready, like the legacy target', () => {
        const pkg = withMedia();
        pkg.audio.article = undefined;
        expect(() => newRows(pkg, plan(), NOW)).toThrow(/Not ready to inject/);
    });

    it('hashes the content, not the time', () => {
        const pkg = withMedia();
        const a = newRows(pkg, plan(), NOW);
        const b = newRows(pkg, plan(), new Date('2027-01-01T00:00:00Z'));
        expect(newRowsHash(a)).toBe(newRowsHash(b));
        expect(newRowsHash(a)).toMatch(/^[0-9a-f]{16}$/);
        pkg.text.summary = 'Changed.';
        expect(newRowsHash(newRows(pkg, plan(), NOW))).not.toBe(newRowsHash(a));
        expect(newRowsHash(a, { x: 1 })).not.toBe(newRowsHash(a));
    });
});

describe('new statements', () => {
    it('builds an insert and an update with quoted columns and jsonb casts', () => {
        const ins = insertSql('multiple_choice_questions', { id: 'q1', question: 'Who?', options: ['a', 'b'], order: 0 }, { now: NOW, json: ['options'] });
        expect(ins.text).toBe('INSERT INTO "multiple_choice_questions" ("id", "question", "options", "order", "updated_at") VALUES ($1, $2, $3::jsonb, $4, $5)');
        expect(ins.values).toEqual(['q1', 'Who?', '["a","b"]', 0, NOW]);
        const upd = updateSql('multiple_choice_questions', { id: 'q1', question: 'Who?', options: ['a', 'b'], order: 0 }, { now: NOW, json: ['options'] });
        expect(upd.text).toBe('UPDATE "multiple_choice_questions" SET "question" = $2, "options" = $3::jsonb, "order" = $4, "updated_at" = $5 WHERE "id" = $1');
        expect(upd.values).toEqual(['q1', 'Who?', '["a","b"]', 0, NOW]);
    });

    it('keeps the passage when it differs only in spaces and line breaks', () => {
        const { text } = updateSql('articles', { id: 'a1', passage: 'A. B.' }, { now: NOW, sameText: ['passage'] });
        expect(text).toContain(`"passage" = CASE WHEN btrim(regexp_replace("articles"."passage", '\\s+', ' ', 'g')) = btrim(regexp_replace($2, '\\s+', ' ', 'g')) THEN "articles"."passage" ELSE $2 END`);
    });

    it('deletes the rows of the article that the package does not have, with uuid types', () => {
        expect(deleteOthersNewSql('short_answer_questions', 'a1', ['x', 'y'])).toEqual({
            text: 'DELETE FROM "short_answer_questions" WHERE "article_id" = $1 AND NOT ("id" = ANY($2::uuid[]))',
            values: ['a1', ['x', 'y']],
        });
    });

    it('writes the article first, deletes the old rows, then writes the other rows', () => {
        const pkg = withMedia();
        const map = mapOf({ 'article:cart1': 'u-art', 'multiple_choice_questions:cq1': 'u-q1' });
        const p = planIds({ legacyArticleId: 'cart1', legacy: { articleId: 'cart1', mcq: { m1: 'cq1' }, saq: {}, laq: {} }, bank: bank(pkg) }, map, { newId: counter() });
        const statements = newStatements(newRows(pkg, p, NOW), p, NOW);
        const head = statements.map((s) => s.text.split(' ').slice(0, 3).join(' '));
        expect(head).toEqual([
            'UPDATE "articles" SET',
            'DELETE FROM "multiple_choice_questions"',
            'DELETE FROM "short_answer_questions"',
            'DELETE FROM "long_answer_questions"',
            'DELETE FROM "sentencs_and_words_for_flashcard"',
            'UPDATE "multiple_choice_questions" SET', // m1: mapped
            'INSERT INTO "multiple_choice_questions"', // m2: new
            'INSERT INTO "multiple_choice_questions"',
            'INSERT INTO "short_answer_questions"',
            'INSERT INTO "short_answer_questions"',
            'INSERT INTO "long_answer_questions"',
            'INSERT INTO "sentencs_and_words_for_flashcard"',
        ]);
        expect(statements[0].text).toContain('"image" = $');
        expect(statements[0].text).not.toContain('"id" = $2');
        expect(statements[5].values[0]).toBe('u-q1');
    });

    it('inserts the article of a new lesson', () => {
        const pkg = withMedia();
        const p = planIds({ bank: bank(pkg) }, mapOf({}), { newId: counter() });
        const [article] = newStatements(newRows(pkg, p, NOW), p, NOW);
        expect(article.text.startsWith('INSERT INTO "articles" ("id", "title"')).toBe(true);
        expect(article.text).toContain('"updated_at") VALUES');
        expect(article.text).toContain('::jsonb');
    });
});

describe('database steps', () => {
    it('reads the id map for the legacy ids of a package', async () => {
        const calls: { text: string; values?: unknown[] }[] = [];
        const client = {
            async query(text: string, values?: unknown[]) {
                calls.push({ text, values });
                return { rows: [{ table_name: 'article', legacy_id: 'cart1', new_id: 'u-art' }] };
            },
        };
        const map = await readLegacyMap(client, { articleId: 'cart1', mcq: { m1: 'cq1' }, saq: {}, laq: {}, flashcardId: 'cfl1' });
        expect(map.get('article:cart1')).toBe('u-art');
        expect(calls).toHaveLength(1);
        expect(calls[0].text).toContain('FROM "primary_legacy_id_map"');
        expect(calls[0].values).toEqual([['article', 'multiple_choice_questions', 'sentencs_and_words_for_flashcard'], ['cart1', 'cq1', 'cfl1']]);
    });

    it('reads nothing when the package has no legacy ids', async () => {
        const client = { query: async () => Promise.reject(new Error('no query expected')) };
        expect((await readLegacyMap(client, undefined)).size).toBe(0);
    });

    it('verifies the rows against the database and reports differences, missing rows, and extra rows', async () => {
        const pkg = withMedia();
        const p = planIds({ bank: bank(pkg) }, mapOf({}), { newId: counter() });
        const rows = newRows(pkg, p, NOW);
        const stored: Record<string, Record<string, unknown>[]> = {
            articles: [{ ...rows.article, updated_at: NOW }],
            multiple_choice_questions: rows.mcq.map((q) => ({ ...q })),
            short_answer_questions: rows.saq.map((q) => ({ ...q })),
            long_answer_questions: rows.laq.map((q) => ({ ...q })),
            sentencs_and_words_for_flashcard: [{ ...rows.flashcard }],
        };
        const client = {
            async query(text: string, values?: unknown[]) {
                const table = /FROM "(\w+)"/.exec(text)![1];
                const list = stored[table] ?? [];
                if (text.includes('WHERE id = $1')) return { rows: list.filter((r) => r.id === values![0]) };
                return { rows: list.filter((r) => r.article_id === values![0]).map((r) => ({ id: r.id })) };
            },
        };
        expect(await verifyNew(client, rows)).toEqual([]);
        stored.articles[0].title = 'Other';
        stored.multiple_choice_questions.pop();
        stored.short_answer_questions.push({ id: 'old', article_id: rows.article.id });
        const diffs = await verifyNew(client, rows);
        expect(diffs).toContain('articles.title differs');
        expect(diffs.some((d) => d.includes('multiple_choice_questions[uuid') && d.endsWith('missing'))).toBe(true);
        expect(diffs).toContain('short_answer_questions: rows not in the package: old');
    });
});

describe('verify one package in the new database', () => {
    const LEGACY = { articleId: 'cart1', mcq: { m1: 'cq1', m2: 'cq2', m3: 'cq3' }, saq: { s1: 'cs1', s2: 'cs2' }, laq: { l1: 'cl1' }, flashcardId: 'cfl1' };
    const MAP: [string, string, string][] = [
        ['article', 'cart1', 'u-art'],
        ['multiple_choice_questions', 'cq1', 'u-q1'],
        ['multiple_choice_questions', 'cq2', 'u-q2'],
        ['multiple_choice_questions', 'cq3', 'u-q3'],
        ['short_answer_questions', 'cs1', 'u-s1'],
        ['short_answer_questions', 'cs2', 'u-s2'],
        ['long_answer_questions', 'cl1', 'u-l1'],
        ['sentencs_and_words_for_flashcard', 'cfl1', 'u-fl'],
    ];

    /** A database after the cutover: the id map and the rows that the package makes. */
    function database(pkg: LessonPackage, map: [string, string, string][]) {
        const plan = planIds({ legacyArticleId: 'cart1', legacy: LEGACY, bank: bank(pkg) }, new Map(MAP.map(([t, l, n]) => [`${t}:${l}`, n])));
        const rows = newRows(pkg, plan, NOW);
        const stored: Record<string, Record<string, unknown>[]> = {
            articles: [{ ...rows.article }],
            multiple_choice_questions: rows.mcq.map((q) => ({ ...q })),
            short_answer_questions: rows.saq.map((q) => ({ ...q })),
            long_answer_questions: rows.laq.map((q) => ({ ...q })),
            sentencs_and_words_for_flashcard: [{ ...rows.flashcard }],
        };
        const client = {
            async query(text: string, values?: unknown[]) {
                if (text.includes('"primary_legacy_id_map"')) {
                    const [tables, ids] = values as [string[], string[]];
                    return { rows: map.filter(([t, l]) => tables.includes(t) && ids.includes(l)).map(([table_name, legacy_id, new_id]) => ({ table_name, legacy_id, new_id })) };
                }
                if (/^\s*(INSERT|UPDATE|DELETE)/i.test(text)) throw new Error(`write: ${text}`);
                const table = /FROM "(\w+)"/.exec(text)![1];
                const list = stored[table] ?? [];
                if (text.includes('WHERE id = $1')) return { rows: list.filter((r) => r.id === values![0]) };
                return { rows: list.filter((r) => r.article_id === values![0]).map((r) => ({ id: r.id })) };
            },
        };
        return { client, stored };
    }

    const injected = () => {
        const pkg = withMedia();
        pkg.db.legacy = LEGACY;
        return pkg;
    };

    it('finds the rows through the id map, uses the cuid as the bucket key, and reports no difference', async () => {
        const pkg = injected();
        const { client } = database(pkg, MAP);
        expect(await verifyPackageNew(client, pkg, NOW)).toEqual({ key: 'cart1', articleId: 'u-art', diffs: [] });
    });

    it('reports a changed text and an extra row', async () => {
        const pkg = injected();
        const { client, stored } = database(pkg, MAP);
        stored.multiple_choice_questions[0].question = 'Other';
        stored.long_answer_questions.push({ id: 'u-old', article_id: 'u-art' });
        const r = await verifyPackageNew(client, pkg, NOW);
        expect(r!.diffs).toEqual(['multiple_choice_questions[u-q1].question differs', 'long_answer_questions: rows not in the package: u-old']);
    });

    it('reports a legacy row that the id map does not hold once, and does not compare it', async () => {
        const pkg = injected();
        const { client } = database(pkg, MAP.filter(([, l]) => l !== 'cq2' && l !== 'cfl1'));
        const r = await verifyPackageNew(client, pkg, NOW);
        expect(r!.diffs).toEqual([
            'multiple_choice_questions m2: not in primary_legacy_id_map',
            'sentencs_and_words_for_flashcard: not in primary_legacy_id_map',
            'multiple_choice_questions: rows not in the package: u-q2',
            'sentencs_and_words_for_flashcard: rows not in the package: u-fl',
        ]);
    });

    it('reports an article that the id map does not hold', async () => {
        const pkg = injected();
        const { client } = database(pkg, MAP.filter(([t]) => t !== 'article'));
        const r = await verifyPackageNew(client, pkg, NOW);
        expect(r).toEqual({ key: 'cart1', articleId: '', diffs: ['Article cart1 is not in the legacy id map; the cutover ETL has not moved it'] });
    });

    it('returns nothing for a package that no target has', async () => {
        const client = { query: async () => Promise.reject(new Error('no query expected')) };
        expect(await verifyPackageNew(client, withMedia(), NOW)).toBeUndefined();
    });
});
