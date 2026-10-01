import type { legacyRows } from './legacy';
import type { Statement } from './sql';

/** Database steps of the injector (track primary_injector_20261001). Server only. */

type Rows = ReturnType<typeof legacyRows>;

/** The part of a database client the injector uses (a `pg` Client, or PGlite in the tests). */
export interface Queryable {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query(text: string, values?: unknown[]): Promise<{ rows: any[] }>;
}

/**
 * Runs the statements of one lesson in one transaction.
 * @param client A connected client.
 * @param statements The statements, in order.
 */
export async function applyStatements(client: Queryable, statements: Statement[]): Promise<void> {
    await client.query('BEGIN');
    try {
        for (const s of statements) await client.query(s.text, s.values);
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
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
const norm = (v: unknown) => JSON.stringify(canon(v));

/** Differences between the expected columns and a database row. */
function compare(label: string, expected: Record<string, unknown>, actual: Record<string, unknown> | undefined, skip: string[] = []): string[] {
    if (!actual) return [`${label}: missing`];
    return Object.entries(expected)
        .filter(([k]) => !skip.includes(k))
        .filter(([k, v]) => norm(actual[k]) !== norm(v))
        .map(([k]) => `${label}.${k} differs`);
}

/**
 * Compares the database with the rows the package makes.
 * @param client A connected client.
 * @param rows The output of `legacyRows` for the package (with its recorded ids).
 * @returns The differences; empty when the database matches.
 */
export async function verifyLegacy(client: Queryable, rows: Rows): Promise<string[]> {
    const id = rows.article.id;
    const one = async (table: string, rowId: string) => (await client.query(`SELECT * FROM "${table}" WHERE id = $1`, [rowId])).rows[0];
    const diffs = compare('article', rows.article, await one('article', id), ['validated_at']);
    for (const [table, list] of [
        ['multiple_choice_questions', rows.mcq],
        ['short_answer_questions', rows.saq],
        ['long_answer_questions', rows.laq],
    ] as const) {
        for (const row of list) diffs.push(...compare(`${table}[${row.id}]`, row, await one(table, row.id)));
        const extra = (await client.query(`SELECT id FROM "${table}" WHERE article_id = $1`, [id])).rows
            .map((r: { id: string }) => r.id)
            .filter((x: string) => !list.some((q) => q.id === x));
        if (extra.length) diffs.push(`${table}: rows not in the package: ${extra.join(', ')}`);
    }
    diffs.push(...compare('sentencs_and_words_for_flashcard', rows.flashcard, await one('sentencs_and_words_for_flashcard', rows.flashcard.id)));
    return diffs;
}
