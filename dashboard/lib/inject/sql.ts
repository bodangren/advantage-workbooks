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
 * database default); `json` lists the jsonb columns.
 * @returns The statement.
 */
export function upsertSql(table: string, row: Record<string, unknown>, opts: { now: Date; updatedAt: string; json?: string[] }): Statement {
    const entries = Object.entries(row);
    const names = [...entries.map(([k]) => quote(k)), opts.updatedAt];
    const json = new Set(opts.json ?? []);
    const values = [...entries.map(([k, v]) => (json.has(k) ? JSON.stringify(v) : v)), opts.now];
    const params = names.map((_, i) => `$${i + 1}${json.has(entries[i]?.[0]) ? '::jsonb' : ''}`);
    const updates = names.filter((n) => n !== '"id"').map((n) => `${n} = EXCLUDED.${n}`);
    return {
        text: `INSERT INTO ${quote(table)} (${names.join(', ')}) VALUES (${params.join(', ')}) ON CONFLICT ("id") DO UPDATE SET ${updates.join(', ')}`,
        values,
    };
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
    });
    const question = (table: string) => (row: Record<string, unknown>) => upsertSql(table, row, { now, updatedAt: '"updatedAt"' });
    return [
        article,
        ...rows.mcq.map(question('multiple_choice_questions')),
        ...rows.saq.map(question('short_answer_questions')),
        ...rows.laq.map(question('long_answer_questions')),
        upsertSql('sentencs_and_words_for_flashcard', rows.flashcard, { now, updatedAt: '"updatedAt"', json: ['sentence', 'words'] }),
    ];
}
