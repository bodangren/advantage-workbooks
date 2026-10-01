import type { LessonPackage } from '../lesson-package/schema';

/**
 * The read-only production sample (track origins_app_refresh_20261001): the field-map check, Q-ORF-01
 * (the old question rows), and Q-ORF-02 (the levels). Pure: the SQL and the output helpers; the
 * script `scripts/sample-legacy.ts` runs the queries. Every query takes `$1` = the article ids (text[]).
 */

/** The named queries. They read counts, values, and JSON; the script prints only shapes and counts. */
export const SAMPLE_QUERIES = {
    /** One row per article: the values to check and the JSON columns (the script prints their shapes). */
    articles: `select id, title, type, genre, sub_genre, cefr_level, ra_level, is_published, is_approved, is_draft,
        validation_status, audio_url, audio_word_url, length(passage) as passage_len,
        (length(passage) - length(replace(passage, E'\\n\\n', ''))) / 2 as blank_lines,
        length(passage) - length(replace(passage, E'\\n', '')) as newlines,
        sentences, words, translated_passage, translated_summary
        from article where id = any($1)`,
    /** The rows that hang on each article: questions, flashcards, progress, and assignments. */
    rows: `select a.id,
        (select count(*) from multiple_choice_questions m where m.article_id = a.id) as mcq,
        (select count(*) from short_answer_questions s where s.article_id = a.id) as saq,
        (select count(*) from long_answer_questions l where l.article_id = a.id) as laq,
        (select count(*) from sentencs_and_words_for_flashcard f where f.article_id = a.id) as flashcard_rows,
        (select count(*) from flashcard_cards c where c.article_id = a.id) as flashcard_cards,
        (select count(*) from user_lesson_progress p where p.article_id = a.id) as progress_rows,
        (select count(*) from assignments g where g.article_id = a.id) as assignments,
        (select count(*) from article_activity_logs l where l.article_id = a.id) as activity_logs
        from article a where a.id = any($1)`,
    /** Student activity on the articles, by type (counts only). */
    activities: `select "targetId" as article_id, "activityType" as activity_type, count(*) as n, count(distinct user_id) as users
        from user_activities where "targetId" = any($1) group by 1, 2 order by 1, 2`,
    /** Activities whose details name an old MCQ or SAQ id (Q-ORF-01: does anything point at the old rows?). */
    questionRefs: `select q.article_id, q.kind, count(distinct ua.id) as activities
        from (select id, article_id, 'mcq' as kind from multiple_choice_questions where article_id = any($1)
              union all select id, article_id, 'saq' from short_answer_questions where article_id = any($1)) q
        join user_activities ua on ua."targetId" = q.article_id and strpos(ua.details::text, q.id) > 0
        group by 1, 2 order by 1, 2`,
    /** The level pairs on all articles (Q-ORF-02: the app's own ra_level and cefr_level values). */
    levels: `select ra_level, cefr_level, count(*) as n, count(*) filter (where id = any($1)) as ours
        from article group by 1, 2 order by 1, 2`,
    /** The type and genre values at the Primary levels (ra_level 1 to 3). */
    kinds: `select type, genre, count(*) as n from article where ra_level <= 3 group by 1, 2 order by 3 desc`,
} as const;

const WRITE_WORDS = /\b(insert|update|delete|merge|truncate|drop|alter|create|grant|revoke|copy|call|lock|vacuum|reindex|cluster|comment|set|reset|do)\b/i;

/**
 * True when `sql` is one SELECT (or WITH … SELECT) with no write keyword.
 * @param sql The statement.
 * @returns Whether the script may run it.
 */
export function isReadOnlySql(sql: string): boolean {
    const s = sql.trim();
    return /^(select|with)\b/i.test(s) && !s.includes(';') && !WRITE_WORDS.test(s);
}

/**
 * The shape of a JSON value: keys and types, with array lengths, and no text.
 * @param value The value.
 * @param depth How many object levels to open.
 * @returns For example `[{sentence:string,startTime:number}] (12)`.
 */
export function jsonShape(value: unknown, depth = 3): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `[${value.length ? jsonShape(value[0], depth) : ''}] (${value.length})`;
    if (typeof value === 'object') {
        if (depth <= 0) return '{…}';
        return `{${Object.entries(value as Record<string, unknown>).map(([k, v]) => `${k}:${jsonShape(v, depth - 1)}`).join(',')}}`;
    }
    return typeof value;
}

/**
 * The app article of a package: the injected id, else the printed source's id.
 * @param pkg A parsed package.
 * @returns The legacy cuid, or undefined for a new lesson that is not injected.
 */
export function sampleArticleId(pkg: LessonPackage): string | undefined {
    return pkg.db.legacy?.articleId ?? pkg.meta.printed?.articleId;
}
