import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { Client } from 'pg';
import { CONTENT_ROOT, REPO_ROOT, loadPackageFolder } from '../lib/lesson-package/files';

const USAGE = `Deletes the similar old online articles of levels 1–4 from the legacy Primary database
(track level_banks_20261002). Daniel (2026-10-02): "Keep information about all duplicates, but
delete all but the best and rebuild that."

Usage: npx tsx scripts/delete-legacy-articles.ts --levels 1,2,3 [--apply] [options]

Reads docs/content-plans/data/duplicates-levels-1-4.json: in each group, every article that is not
the kept one. Without --apply it only reads (one READ ONLY transaction) and prints the plan: each
article, its rows (questions, flashcards, progress, assignments, activity logs), and the database's
delete rule for each table that points at the article.

With --apply: a Cloud SQL backup first (waits until it is done), then a copy of the content rows
(article, questions, flashcard rows; no student rows) to content/primary/deleted/<time>.json, then
one transaction that deletes the articles (the rows that point at them go with them). A line goes
into content/primary/deleted/delete-log.jsonl. Bucket files stay.

It refuses an id that a lesson package uses (db.legacy, meta.replaces, meta.printed), an id at
another level, and a level whose bank still has unapproved packages (--force skips only this rule).

Options:
  --db-env <NAME>        Env var with the database URL (default LEGACY_DATABASE_URL); never printed
  --backup-instance <i>  Cloud SQL instance (default cloud-sql, project reading-advantage)
  --no-backup            Only for a local test database
  --force                Delete even when the level bank is not approved yet`;

interface Group {
    level: number;
    keep: string;
    articles: { id: string; title: string }[];
}

const READS = {
    fks: `select tc.table_name, kcu.column_name, rc.delete_rule
        from information_schema.table_constraints tc
        join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
        join information_schema.referential_constraints rc on tc.constraint_name = rc.constraint_name
        join information_schema.constraint_column_usage ccu on rc.unique_constraint_name = ccu.constraint_name
        where tc.constraint_type = 'FOREIGN KEY' and ccu.table_name = 'article' order by 1`,
    rows: `select a.id, a.ra_level, a.title,
        (select count(*) from multiple_choice_questions m where m.article_id = a.id) as mcq,
        (select count(*) from short_answer_questions s where s.article_id = a.id) as saq,
        (select count(*) from long_answer_questions l where l.article_id = a.id) as laq,
        (select count(*) from sentencs_and_words_for_flashcard f where f.article_id = a.id) as flashcards,
        (select count(*) from user_lesson_progress p where p.article_id = a.id) as progress,
        (select count(*) from assignments g where g.article_id = a.id) as assignments,
        (select count(*) from article_activity_logs l where l.article_id = a.id) as activity_logs
        from article a where a.id = any($1) order by a.ra_level, a.title`,
};

const COPY = {
    article: `select * from article where id = any($1)`,
    multiple_choice_questions: `select * from multiple_choice_questions where article_id = any($1)`,
    short_answer_questions: `select * from short_answer_questions where article_id = any($1)`,
    long_answer_questions: `select * from long_answer_questions where article_id = any($1)`,
    sentencs_and_words_for_flashcard: `select * from sentencs_and_words_for_flashcard where article_id = any($1)`,
};

function gcloud(args: string[]): string {
    const run = spawnSync('gcloud', args, { encoding: 'utf8', timeout: 1_800_000 });
    if (run.status !== 0) throw new Error(`gcloud ${args.slice(0, 3).join(' ')} failed: ${(run.stderr || String(run.error)).trim().slice(-400)}`);
    return run.stdout.trim();
}

/** Every article id that a lesson package uses. */
function packageIds(): Set<string> {
    const ids = new Set<string>();
    for (const d of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
        if (!d.isDirectory()) continue;
        for (const f of loadPackageFolder(path.join(CONTENT_ROOT, d.name))) {
            const p = f.pkg;
            for (const id of [p?.db.legacy?.articleId, p?.meta.replaces, p?.meta.printed?.articleId]) if (id) ids.add(id);
        }
    }
    return ids;
}

/** Levels whose bank folder has a package that is not approved (or no bank folder yet). */
function unapprovedLevels(levels: number[]): number[] {
    return levels.filter((l) => {
        const files = loadPackageFolder(path.join(CONTENT_ROOT, `bank-${l}`));
        return files.length === 0 || files.some((f) => f.pkg?.approval.lesson.status !== 'approved');
    });
}

async function main(argv: string[]): Promise<number> {
    let levels: number[] = [];
    let apply = false;
    let force = false;
    let backupOn = true;
    let dbEnv = 'LEGACY_DATABASE_URL';
    let instance = 'cloud-sql';
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--levels') levels = argv[++i].split(',').map(Number);
        else if (a === '--apply') apply = true;
        else if (a === '--force') force = true;
        else if (a === '--no-backup') backupOn = false;
        else if (a === '--db-env') dbEnv = argv[++i];
        else if (a === '--backup-instance') instance = argv[++i];
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (!levels.length || levels.some((l) => !(l >= 1 && l <= 4))) {
        console.error(USAGE);
        return 2;
    }
    const url = process.env[dbEnv];
    if (!url) {
        console.error(`Set ${dbEnv} to the database URL`);
        return 2;
    }
    const data = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs/content-plans/data/duplicates-levels-1-4.json'), 'utf8')) as { groups: Group[] };
    const targets = data.groups.filter((g) => levels.includes(g.level)).flatMap((g) => g.articles.filter((a) => a.id !== g.keep).map((a) => ({ ...a, level: g.level })));
    const used = packageIds();
    const clash = targets.filter((t) => used.has(t.id));
    if (clash.length) {
        console.error(`Refused: a lesson package uses ${clash.map((c) => c.id).join(', ')}`);
        return 1;
    }
    const open = unapprovedLevels(levels);
    if (apply && open.length && !force) {
        console.error(`Refused: the bank of level ${open.join(', ')} is not approved yet (or has no packages). Delete after the new articles are approved, or use --force.`);
        return 1;
    }
    const ids = targets.map((t) => t.id);
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
        await client.query('BEGIN READ ONLY');
        const fks = (await client.query(READS.fks)).rows;
        console.log('== Tables that point at article (delete rule)');
        for (const f of fks) console.log(`  ${f.table_name}.${f.column_name}: ${f.delete_rule}`);
        const rows = (await client.query(READS.rows, [ids])).rows;
        const wrong = rows.filter((r) => r.ra_level !== targets.find((t) => t.id === r.id)?.level);
        console.log(`\n== ${rows.length} of ${ids.length} articles found (mcq/saq/laq | flashcards | progress, assignments, activity logs)`);
        for (const r of rows) console.log(`  ${r.ra_level} ${r.id} ${r.mcq}/${r.saq}/${r.laq} | ${r.flashcards} | ${r.progress} ${r.assignments} ${r.activity_logs}  "${r.title}"`);
        const copy: Record<string, unknown[]> = {};
        if (apply) for (const [table, sql] of Object.entries(COPY)) copy[table] = (await client.query(sql, [ids])).rows;
        await client.query('ROLLBACK');
        if (wrong.length) {
            console.error(`Refused: ${wrong.map((w) => `${w.id} is at level ${w.ra_level}`).join('; ')}`);
            return 1;
        }
        const notCascade = fks.filter((f) => f.delete_rule !== 'CASCADE');
        if (notCascade.length) {
            console.error(`Refused: these tables do not cascade: ${notCascade.map((f) => f.table_name).join(', ')}`);
            return 1;
        }
        if (!apply) {
            console.log(`\nDry run: nothing deleted. Add --apply to delete ${rows.length} article(s)${open.length ? ` (level ${open.join(', ')} not approved yet)` : ''}.`);
            return 0;
        }
        const now = new Date();
        let backupId: string | undefined;
        if (backupOn) {
            console.log(`\nBackup of ${instance} (waits until it is done)...`);
            gcloud(['sql', 'backups', 'create', '--instance', instance, '--project', 'reading-advantage', '--description', `delete similar articles levels ${levels.join(',')} ${now.toISOString()}`]);
            backupId = gcloud(['sql', 'backups', 'list', '--instance', instance, '--project', 'reading-advantage', '--limit', '1', '--sort-by', '~windowStartTime', '--format', 'value(id)']);
            console.log(`  backup ${backupId}`);
        }
        const dir = path.join(CONTENT_ROOT, 'deleted');
        fs.mkdirSync(dir, { recursive: true });
        const stamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
        const copyFile = path.join(dir, `${stamp}.json`);
        fs.writeFileSync(copyFile, `${JSON.stringify({ deletedAt: now.toISOString(), backupId, levels, rows: copy }, null, 1)}\n`);
        await client.query('BEGIN');
        try {
            const res = await client.query('delete from article where id = any($1)', [ids]);
            await client.query('COMMIT');
            console.log(`\nDeleted ${res.rowCount} article(s); content copy ${path.relative(REPO_ROOT, copyFile)}`);
            fs.appendFileSync(path.join(dir, 'delete-log.jsonl'), `${JSON.stringify({ time: now.toISOString(), levels, backupId, deleted: ids, count: res.rowCount, copy: path.relative(REPO_ROOT, copyFile) })}\n`);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        return 0;
    } finally {
        await client.end();
    }
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
