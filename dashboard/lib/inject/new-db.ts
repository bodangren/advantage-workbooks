import { createHash, randomUUID } from 'crypto';
import type { LessonPackage } from '../lesson-package/schema';
import { appArticleId, legacyRows } from './legacy';
import type { Queryable } from './run';
import type { Statement } from './sql';

/**
 * Lesson package → rows of the new database (the monorepo schema, after the Primary cutover).
 * Field map: docs/content-plans/primary-db-field-map.md, section "New schema". The row builders,
 * the update-or-insert rule, and the SQL are pure. The two database steps at the end only read.
 */

/** The legacy table names, as `primary_legacy_id_map.table_name` holds them. */
const MAP_TABLES = {
    article: 'article',
    mcq: 'multiple_choice_questions',
    saq: 'short_answer_questions',
    laq: 'long_answer_questions',
    flashcard: 'sentencs_and_words_for_flashcard',
} as const;

/** Legacy ids to new uuids, keyed `<legacy table>:<legacy id>`. */
export type IdMap = Map<string, string>;

/** The ids that a package records for one target (the same shape as `db.legacy` and `db.new`). */
export interface KnownIds {
    articleId: string;
    mcq: Record<string, string>;
    saq: Record<string, string>;
    laq: Record<string, string>;
    flashcardId?: string;
}

/** What to do with one row, and where its id came from. */
export interface RowPlan {
    id: string;
    action: 'update' | 'insert';
    source: 'new' | 'legacy-map' | 'fresh';
}

/** The plan of one lesson: one entry per row. Question maps are keyed by the package id of the question. */
export interface IdPlan {
    article: RowPlan;
    mcq: Record<string, RowPlan>;
    saq: Record<string, RowPlan>;
    laq: Record<string, RowPlan>;
    flashcard: RowPlan;
    /** The bucket key of the article: its legacy cuid when it has one, else its uuid. */
    key: string;
}

/**
 * Decides, for each row of a lesson, whether to update an existing row or insert a new one.
 * A row that an earlier new-database run wrote (`current`) is updated. A row that the cutover
 * moved from the legacy database is updated too: its uuid comes from the id map. Every other row
 * is inserted with a new uuid. A legacy article that the map does not know stops the run: an
 * insert would give the printed QR code a second article.
 * @param input The article's legacy id (a printed or replaced article, or `legacy.articleId`), the ids of
 * `db.legacy` and `db.new`, and the package ids of the question bank.
 * @param map The rows of `primary_legacy_id_map` for these legacy ids (see `readLegacyMap`).
 * @param opts `newId` makes a uuid (tests replace it). With `dryRun`, a legacy id counts as mapped
 * and gets a placeholder id, because a dry run reads no database.
 * @returns One plan for each row, and the bucket key.
 */
export function planIds(
    input: { legacyArticleId?: string; legacy?: KnownIds; current?: KnownIds; bank: { mcq: string[]; saq: string[]; laq: string[] } },
    map: IdMap,
    opts: { newId?: () => string; dryRun?: boolean } = {},
): IdPlan {
    const newId = opts.newId ?? randomUUID;
    const { legacy, current } = input;
    const mapped = (table: string, legacyId: string | undefined): string | undefined => {
        if (!legacyId) return undefined;
        return map.get(`${table}:${legacyId}`) ?? (opts.dryRun ? `<uuid of ${table} ${legacyId}>` : undefined);
    };
    const decide = (own: string | undefined, table: string, legacyId: string | undefined): RowPlan => {
        if (own) return { id: own, action: 'update', source: 'new' };
        const found = mapped(table, legacyId);
        if (found) return { id: found, action: 'update', source: 'legacy-map' };
        return { id: newId(), action: 'insert', source: 'fresh' };
    };

    const legacyArticle = input.legacyArticleId ?? legacy?.articleId;
    let article: RowPlan;
    if (current?.articleId) article = { id: current.articleId, action: 'update', source: 'new' };
    else if (legacyArticle) {
        const found = mapped(MAP_TABLES.article, legacyArticle);
        if (!found) throw new Error(`Article ${legacyArticle} is not in the legacy id map; the cutover ETL has not moved it`);
        article = { id: found, action: 'update', source: 'legacy-map' };
    } else article = { id: newId(), action: 'insert', source: 'fresh' };

    const questions = (ids: string[], table: string, own: Record<string, string> | undefined, old: Record<string, string> | undefined) =>
        Object.fromEntries(ids.map((id) => [id, decide(own?.[id], table, old?.[id])]));
    return {
        article,
        mcq: questions(input.bank.mcq, MAP_TABLES.mcq, current?.mcq, legacy?.mcq),
        saq: questions(input.bank.saq, MAP_TABLES.saq, current?.saq, legacy?.saq),
        laq: questions(input.bank.laq, MAP_TABLES.laq, current?.laq, legacy?.laq),
        flashcard: decide(current?.flashcardId, MAP_TABLES.flashcard, legacy?.flashcardId),
        key: legacyArticle ?? article.id,
    };
}

/**
 * The new-database rows for one package. Throws when the package is not ready to inject. The text
 * rules (passage, translations, word times, flashcard sentences) come from `legacyRows`; this
 * function renames the columns and adds the ones that only the new schema has.
 * @param pkg A parsed, approved package with its media.
 * @param plan The output of `planIds`.
 * @param now The time for the legacy checks.
 * @returns Column objects keyed by the real column names, the package ids in bank order, the bucket key, and the ids to write back.
 */
export function newRows(pkg: LessonPackage, plan: IdPlan, now: Date) {
    const base = legacyRows(pkg, { articleId: plan.key, mcq: {}, saq: {}, laq: {} }, now);
    const a = base.article;
    const order = { mcq: pkg.bank.mcq.map((q) => q.id), saq: pkg.bank.saq.map((q) => q.id), laq: pkg.bank.laq.map((q) => q.id) };
    const articleId = plan.article.id;

    const article = {
        id: articleId,
        title: a.title,
        content: a.passage,
        summary: a.summary,
        level: a.ra_level,
        cefr_level: a.cefr_level,
        // The picture key (open item): the bucket key of images/<key>_<n>.png.
        image: plan.key,
        published: true,
        type: a.type,
        genre: a.genre,
        sub_genre: null,
        passage: a.passage,
        translated_summary: a.translated_summary,
        translated_passage: a.translated_passage,
        image_description: a.image_description,
        ra_level: a.ra_level,
        rating: a.rating,
        audio_url: a.audio_url,
        audio_word_url: a.audio_word_url,
        sentences: a.sentences,
        words: null,
        is_approved: true,
        is_draft: false,
        is_published: true,
    };
    const mcq = pkg.bank.mcq.map((q, i) => {
        const correct = q.options.indexOf(q.answer);
        if (correct < 0) throw new Error(`MCQ ${q.id}: the answer is not one of the options`);
        return {
            id: plan.mcq[q.id].id,
            article_id: articleId,
            question: q.question,
            options: q.options,
            correct_answer: correct,
            answer: q.answer,
            textual_evidence: q.evidence ?? null,
            order: i,
        };
    });
    const saq = pkg.bank.saq.map((q, i) => ({ id: plan.saq[q.id].id, article_id: articleId, question: q.question, sample_answer: q.answer, answer: q.answer, order: i }));
    const laq = pkg.bank.laq.map((q) => ({ id: plan.laq[q.id].id, article_id: articleId, question: q.question }));
    const flashcard = {
        id: plan.flashcard.id,
        article_id: articleId,
        sentence: base.flashcard.sentence,
        audio_sentences_url: base.flashcard.audio_sentences_url,
        words: base.flashcard.words,
        words_url: base.flashcard.words_url,
    };
    const ids: KnownIds = {
        articleId,
        mcq: Object.fromEntries(order.mcq.map((id) => [id, plan.mcq[id].id])),
        saq: Object.fromEntries(order.saq.map((id) => [id, plan.saq[id].id])),
        laq: Object.fromEntries(order.laq.map((id) => [id, plan.laq[id].id])),
        flashcardId: plan.flashcard.id,
    };
    return { article, mcq, saq, laq, flashcard, order, key: plan.key, ids };
}

export type NewRows = ReturnType<typeof newRows>;

/**
 * A hash of the rows' content, so a second run can tell whether anything changed.
 * @param rows The output of `newRows`.
 * @param extra Other content that goes up with the rows (the Tutor manifest without its time).
 * @returns 16 hex characters.
 */
export function newRowsHash(rows: NewRows, extra?: unknown): string {
    const { article, mcq, saq, laq, flashcard, key } = rows;
    const content = extra === undefined ? { article, mcq, saq, laq, flashcard, key } : { article, mcq, saq, laq, flashcard, key, extra };
    return createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);
}

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

/** A JSON value goes up as text with a jsonb cast; a null stays a SQL null. */
const toValue = (key: string, value: unknown, json: Set<string>) => (json.has(key) && value !== null && value !== undefined ? JSON.stringify(value) : value);

/**
 * An insert for a new row. The update time is written with the row; the creation time has a database default.
 * @param table The table.
 * @param row Column values keyed by the real column names.
 * @param opts `now` is the update time; `json` lists the jsonb columns.
 * @returns The statement.
 */
export function insertSql(table: string, row: Record<string, unknown>, opts: { now: Date; json?: string[] }): Statement {
    const json = new Set(opts.json ?? []);
    const entries = Object.entries(row);
    const names = [...entries.map(([k]) => quote(k)), quote('updated_at')];
    const params = names.map((_, i) => `$${i + 1}${i < entries.length && json.has(entries[i][0]) ? '::jsonb' : ''}`);
    return {
        text: `INSERT INTO ${quote(table)} (${names.join(', ')}) VALUES (${params.join(', ')})`,
        values: [...entries.map(([k, v]) => toValue(k, v, json)), opts.now],
    };
}

/**
 * An update of an existing row by its id.
 * @param table The table.
 * @param row Column values keyed by the real column names; `id` selects the row and is the first value.
 * @param opts `now` is the update time; `json` lists the jsonb columns; `sameText` lists the text columns
 * that keep their current value when it differs only in spaces and line breaks (the app passage).
 * @returns The statement.
 */
export function updateSql(table: string, row: Record<string, unknown>, opts: { now: Date; json?: string[]; sameText?: string[] }): Statement {
    const json = new Set(opts.json ?? []);
    const sameText = new Set(opts.sameText ?? []);
    const { id, ...rest } = row;
    const entries = Object.entries(rest);
    const flat = (col: string) => `btrim(regexp_replace(${col}, '\\s+', ' ', 'g'))`;
    const sets = entries.map(([k], i) => {
        const param = `$${i + 2}${json.has(k) ? '::jsonb' : ''}`;
        if (!sameText.has(k)) return `${quote(k)} = ${param}`;
        const current = `${quote(table)}.${quote(k)}`;
        return `${quote(k)} = CASE WHEN ${flat(current)} = ${flat(param)} THEN ${current} ELSE ${param} END`;
    });
    sets.push(`${quote('updated_at')} = $${entries.length + 2}`);
    return {
        text: `UPDATE ${quote(table)} SET ${sets.join(', ')} WHERE "id" = $1`,
        values: [id, ...entries.map(([k, v]) => toValue(k, v, json)), opts.now],
    };
}

/**
 * A delete of the article's rows that the package does not have (Q-ORF-01: the package replaces the old rows).
 * @param table The table.
 * @param articleId The article uuid.
 * @param keep The uuids the package writes.
 * @returns The statement.
 */
export function deleteOthersNewSql(table: string, articleId: string, keep: string[]): Statement {
    return { text: `DELETE FROM ${quote(table)} WHERE "article_id" = $1 AND NOT ("id" = ANY($2::uuid[]))`, values: [articleId, keep] };
}

/**
 * Every statement for one lesson, in order: the article, the deletes, then the other rows.
 * @param rows The output of `newRows`.
 * @param plan The output of `planIds` (it says update or insert for each row).
 * @param now The update time.
 * @returns The statements for one transaction.
 */
export function newStatements(rows: NewRows, plan: IdPlan, now: Date): Statement[] {
    const write = (table: string, row: Record<string, unknown>, action: RowPlan['action'], json: string[] = [], sameText: string[] = []) =>
        action === 'update' ? updateSql(table, row, { now, json, sameText }) : insertSql(table, row, { now, json });
    const id = rows.article.id;
    return [
        // The printed text is locked; some app passages break lines inside a paragraph, and the app shows them.
        write('articles', rows.article, plan.article.action, ['sentences', 'words', 'translated_passage', 'translated_summary'], ['passage', 'content']),
        deleteOthersNewSql('multiple_choice_questions', id, rows.mcq.map((q) => q.id)),
        deleteOthersNewSql('short_answer_questions', id, rows.saq.map((q) => q.id)),
        deleteOthersNewSql('long_answer_questions', id, rows.laq.map((q) => q.id)),
        deleteOthersNewSql('sentencs_and_words_for_flashcard', id, [rows.flashcard.id]),
        ...rows.mcq.map((q, i) => write('multiple_choice_questions', q, plan.mcq[rows.order.mcq[i]].action, ['options'])),
        ...rows.saq.map((q, i) => write('short_answer_questions', q, plan.saq[rows.order.saq[i]].action)),
        ...rows.laq.map((q, i) => write('long_answer_questions', q, plan.laq[rows.order.laq[i]].action)),
        write('sentencs_and_words_for_flashcard', rows.flashcard, plan.flashcard.action, ['sentence', 'words']),
    ];
}

// ─── Database steps (read only) ────────────────────────────────────────────

/**
 * Reads the id map for the legacy ids of a package.
 * @param client A connected client of the new database.
 * @param legacy The ids of `db.legacy`, if the package has them.
 * @param legacyArticleId The legacy article of a printed or replaced lesson that was never injected into the legacy database.
 * @returns The map; empty when the package has no legacy id.
 */
export async function readLegacyMap(client: Queryable, legacy: KnownIds | undefined, legacyArticleId?: string): Promise<IdMap> {
    const wanted: [string, string][] = [];
    const article = legacyArticleId ?? legacy?.articleId;
    if (article) wanted.push([MAP_TABLES.article, article]);
    for (const key of ['mcq', 'saq', 'laq'] as const) for (const id of Object.values(legacy?.[key] ?? {})) wanted.push([MAP_TABLES[key], id]);
    if (legacy?.flashcardId) wanted.push([MAP_TABLES.flashcard, legacy.flashcardId]);
    if (wanted.length === 0) return new Map();
    const tables = [...new Set(wanted.map(([t]) => t))];
    const ids = wanted.map(([, id]) => id);
    const { rows } = await client.query(
        'SELECT table_name, legacy_id, new_id FROM "primary_legacy_id_map" WHERE table_name = ANY($1::text[]) AND legacy_id = ANY($2::text[])',
        [tables, ids],
    );
    return new Map(rows.map((r: { table_name: string; legacy_id: string; new_id: string }) => [`${r.table_name}:${r.legacy_id}`, r.new_id]));
}

/** Canonical JSON: jsonb keeps its own key order, so keys are sorted before the compare. */
const canon = (v: unknown): unknown =>
    v instanceof Date
        ? v.toISOString()
        : Array.isArray(v)
          ? v.map(canon)
          : v && typeof v === 'object'
            ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])]))
            : v;
const norm = (v: unknown) => JSON.stringify(canon(v ?? null));
const flat = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim();

function compare(label: string, expected: Record<string, unknown>, actual: Record<string, unknown> | undefined, sameText: string[] = []): string[] {
    if (!actual) return [`${label}: missing`];
    return Object.entries(expected)
        .filter(([k, v]) => (sameText.includes(k) ? flat(actual[k]) !== flat(v) : norm(actual[k]) !== norm(v)))
        .map(([k]) => `${label}.${k} differs`);
}

/**
 * Compares the new database with the rows the package makes.
 * @param client A connected client of the new database.
 * @param rows The output of `newRows`.
 * @returns The differences; empty when the database matches.
 */
export async function verifyNew(client: Queryable, rows: NewRows): Promise<string[]> {
    const id = rows.article.id;
    const one = async (table: string, rowId: string) => (await client.query(`SELECT * FROM "${table}" WHERE id = $1`, [rowId])).rows[0];
    const diffs = compare('articles', rows.article, await one('articles', id), ['passage', 'content']);
    for (const [table, list] of [
        ['multiple_choice_questions', rows.mcq],
        ['short_answer_questions', rows.saq],
        ['long_answer_questions', rows.laq],
        ['sentencs_and_words_for_flashcard', [rows.flashcard]],
    ] as const) {
        for (const row of list) diffs.push(...compare(`${table}[${row.id}]`, row, await one(table, row.id)));
        const extra = (await client.query(`SELECT id FROM "${table}" WHERE article_id = $1`, [id])).rows
            .map((r: { id: string }) => r.id)
            .filter((x: string) => !list.some((q) => q.id === x));
        if (extra.length) diffs.push(`${table}: rows not in the package: ${extra.join(', ')}`);
    }
    return diffs;
}

/**
 * Verifies one package in the new database (after a rehearsal or the cutover). The ids come from
 * `db.new` (an earlier new-database run) or from `primary_legacy_id_map` (the rows that the cutover
 * moved). A row with neither id is reported once as not in the map, and it is not compared.
 * @param client A connected client of the new database; the function only reads.
 * @param pkg A parsed package.
 * @param now The time for the legacy checks.
 * @returns The bucket key, the new article id, and the differences (empty when the database matches);
 * undefined when the package has no article in either database.
 */
export async function verifyPackageNew(client: Queryable, pkg: LessonPackage, now: Date): Promise<{ key: string; articleId: string; diffs: string[] } | undefined> {
    const legacyArticleId = appArticleId(pkg);
    if (!legacyArticleId && !pkg.db.new) return undefined;
    const bank = { mcq: pkg.bank.mcq.map((q) => q.id), saq: pkg.bank.saq.map((q) => q.id), laq: pkg.bank.laq.map((q) => q.id) };
    const input = { legacyArticleId, legacy: pkg.db.legacy, current: pkg.db.new, bank };
    let plan: IdPlan;
    let rows: NewRows;
    try {
        plan = planIds(input, await readLegacyMap(client, pkg.db.legacy, legacyArticleId));
        rows = newRows(pkg, plan, now);
    } catch (e) {
        return { key: legacyArticleId ?? pkg.db.new?.articleId ?? '', articleId: '', diffs: [(e as Error).message] };
    }
    // The rows that would be inserted have no id in the database to compare.
    const unmapped = new Map<string, string>();
    for (const key of ['mcq', 'saq', 'laq'] as const) {
        for (const [id, row] of Object.entries(plan[key])) if (row.source === 'fresh') unmapped.set(row.id, `${MAP_TABLES[key]} ${id}`);
    }
    if (plan.flashcard.source === 'fresh') unmapped.set(plan.flashcard.id, MAP_TABLES.flashcard);
    const diffs = (await verifyNew(client, rows)).filter((d) => ![...unmapped.keys()].some((id) => d.includes(`[${id}]`)));
    return { key: plan.key, articleId: rows.article.id, diffs: [...[...unmapped.values()].map((l) => `${l}: not in primary_legacy_id_map`), ...diffs] };
}
