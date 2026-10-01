import type { legacyRows } from './legacy';

/** SQL for the injector (track primary_injector_20261001). Pure: it builds text and values only. */

export interface Statement {
    text: string;
    values: unknown[];
}

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

/**
 * An insert that updates the row when the id exists. Every column name is quoted, because Prisma
 * left some camelCase names unmapped (`textualEvidence`, `updatedAt`).
 * @param table The table.
 * @param row Column values keyed by the real column names; `id` is the conflict key.
 * @param opts `updatedAt` is the quoted name of the update-time column (Prisma's `@updatedAt` has no
 * database default); `json` lists the jsonb columns; `sameText` lists the text columns that keep their
 * current value when it differs only in spaces and line breaks.
 * @returns The statement.
 */
export function upsertSql(table: string, row: Record<string, unknown>, opts: { now: Date; updatedAt: string; json?: string[]; sameText?: string[] }): Statement {
    const entries = Object.entries(row);
    const names = [...entries.map(([k]) => quote(k)), opts.updatedAt];
    const json = new Set(opts.json ?? []);
    const sameText = new Set((opts.sameText ?? []).map(quote));
    const values = [...entries.map(([k, v]) => (json.has(k) ? JSON.stringify(v) : v)), opts.now];
    const params = names.map((_, i) => `$${i + 1}${json.has(entries[i]?.[0]) ? '::jsonb' : ''}`);
    const flat = (col: string) => `btrim(regexp_replace(${col}, '\\s+', ' ', 'g'))`;
    const updates = names
        .filter((n) => n !== '"id"')
        .map((n) => {
            if (!sameText.has(n)) return `${n} = EXCLUDED.${n}`;
            const current = `${quote(table)}.${n}`;
            return `${n} = CASE WHEN ${flat(current)} = ${flat(`EXCLUDED.${n}`)} THEN ${current} ELSE EXCLUDED.${n} END`;
        });
    return {
        text: `INSERT INTO ${quote(table)} (${names.join(', ')}) VALUES (${params.join(', ')}) ON CONFLICT ("id") DO UPDATE SET ${updates.join(', ')}`,
        values,
    };
}

/**
 * A delete of the article's rows that the package does not have (the app's old questions, a second
 * flashcard row). Q-ORF-01, Daniel 2026-10-01: the package replaces the old rows.
 * @param table The table.
 * @param articleId The article.
 * @param keep The ids the package writes.
 * @returns The statement.
 */
export function deleteOthersSql(table: string, articleId: string, keep: string[]): Statement {
    return { text: `DELETE FROM ${quote(table)} WHERE "article_id" = $1 AND NOT ("id" = ANY($2::text[]))`, values: [articleId, keep] };
}

/**
 * Every statement for one lesson, in order (the article first, for the foreign keys).
 * @param rows The output of `legacyRows`.
 * @param now The update time.
 * @returns The statements for one transaction.
 */
export function legacyStatements(rows: ReturnType<typeof legacyRows>, now: Date): Statement[] {
    const article = upsertSql('article', rows.article, {
        now,
        updatedAt: '"updated_at"',
        json: ['sentences', 'words', 'translated_passage', 'translated_summary'],
        // The printed text is locked; some app passages break lines inside a paragraph, and the app shows them.
        sameText: ['passage'],
    });
    const question = (table: string) => (row: Record<string, unknown>) => upsertSql(table, row, { now, updatedAt: '"updatedAt"' });
    const id = rows.article.id;
    return [
        article,
        deleteOthersSql('multiple_choice_questions', id, rows.mcq.map((q) => q.id)),
        deleteOthersSql('short_answer_questions', id, rows.saq.map((q) => q.id)),
        deleteOthersSql('long_answer_questions', id, rows.laq.map((q) => q.id)),
        deleteOthersSql('sentencs_and_words_for_flashcard', id, [rows.flashcard.id]),
        ...rows.mcq.map(question('multiple_choice_questions')),
        ...rows.saq.map(question('short_answer_questions')),
        ...rows.laq.map(question('long_answer_questions')),
        upsertSql('sentencs_and_words_for_flashcard', rows.flashcard, { now, updatedAt: '"updatedAt"', json: ['sentence', 'words'] }),
    ];
}
