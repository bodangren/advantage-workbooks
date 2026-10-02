import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { isReadOnlySql } from '../lib/inject/legacy-sample';

const USAGE = `Lists the legacy Primary articles at some levels, for the level-bank plan (track level_banks_20261002).

Usage: npx tsx scripts/inventory-legacy.ts [--levels 1,2,3,4] [--out <file.json>] [--db-env LEGACY_DATABASE_URL]

Reads only: one READ ONLY transaction, rolled back. Writes one row per article: the level values,
title, type, genre, word count, and the counts of the rows that hang on it (questions, progress,
assignments, activity logs). No student data, and never the database URL. --out also keeps the
passage text, for the topic plan.`;

const QUERIES = {
    levels: `select ra_level, cefr_level, count(*) as n,
        count(*) filter (where is_published) as published
        from article group by 1, 2 order by 1, 2`,
    articles: `select a.id, a.title, a.type, a.genre, a.sub_genre, a.cefr_level, a.ra_level,
        a.is_published, a.is_approved, a.is_draft, a.created_at, a.updated_at, a.passage, a.summary,
        (select count(*) from multiple_choice_questions m where m.article_id = a.id) as mcq,
        (select count(*) from short_answer_questions s where s.article_id = a.id) as saq,
        (select count(*) from long_answer_questions l where l.article_id = a.id) as laq,
        (select count(*) from user_lesson_progress p where p.article_id = a.id) as progress_rows,
        (select count(*) from assignments g where g.article_id = a.id) as assignments,
        (select count(*) from article_activity_logs l where l.article_id = a.id) as activity_logs
        from article a where a.ra_level = any($1) order by a.ra_level, a.created_at`,
} as const;

function main(argv: string[]): Promise<number> | number {
    let levels = [1, 2, 3, 4];
    let out: string | undefined;
    let dbEnv = 'LEGACY_DATABASE_URL';
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--levels') levels = argv[++i].split(',').map(Number);
        else if (a === '--out') out = path.resolve(argv[++i]);
        else if (a === '--db-env') dbEnv = argv[++i];
        else {
            console.error(USAGE);
            return 2;
        }
    }
    const url = process.env[dbEnv];
    if (!url) {
        console.error(`Set ${dbEnv} to the database URL`);
        return 2;
    }
    return run(levels, url, out);
}

async function run(levels: number[], url: string, out?: string): Promise<number> {
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
        await client.query('SET default_transaction_read_only = on');
        await client.query('BEGIN READ ONLY');
        for (const sql of Object.values(QUERIES)) if (!isReadOnlySql(sql)) throw new Error('query is not read-only');

        console.log('== Articles by level (all levels)');
        for (const r of (await client.query(QUERIES.levels)).rows) {
            console.log(`  ra ${r.ra_level}  cefr ${r.cefr_level}  ${r.n} articles, ${r.published} published`);
        }
        const rows = (await client.query(QUERIES.articles, [levels])).rows;
        const words = (s: string) => (s.match(/[A-Za-z']+/g) ?? []).length;
        console.log(`\n== Articles at levels ${levels.join(', ')}: ${rows.length}`);
        for (const r of rows) {
            console.log(
                `  ${r.ra_level} ${r.cefr_level} ${r.id}  ${r.type}/${r.genre}  pub ${r.is_published} appr ${r.is_approved}  ` +
                    `${words(r.passage)} w  q ${r.mcq}/${r.saq}/${r.laq}  use ${r.progress_rows}/${r.assignments}/${r.activity_logs}  "${r.title}"`,
            );
        }
        if (out) {
            const data = rows.map((r) => ({
                id: r.id,
                raLevel: r.ra_level,
                cefrLevel: r.cefr_level,
                title: r.title,
                type: r.type,
                genre: r.genre,
                subGenre: r.sub_genre,
                published: r.is_published,
                approved: r.is_approved,
                draft: r.is_draft,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                words: words(r.passage),
                summary: r.summary,
                passage: r.passage,
                questions: { mcq: Number(r.mcq), saq: Number(r.saq), laq: Number(r.laq) },
                use: { progress: Number(r.progress_rows), assignments: Number(r.assignments), activityLogs: Number(r.activity_logs) },
            }));
            fs.writeFileSync(out, JSON.stringify({ readAt: new Date().toISOString(), levels, articles: data }, null, 2) + '\n');
            console.log(`\nWrote ${out}`);
        }
        await client.query('ROLLBACK');
        return 0;
    } finally {
        await client.end();
    }
}

Promise.resolve(main(process.argv.slice(2))).then(
    (code) => process.exit(code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
    },
);
