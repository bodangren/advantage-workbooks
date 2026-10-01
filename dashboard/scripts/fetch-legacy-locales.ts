import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { recordLocales } from '../lib/lesson-package/store';
import { isReadOnlySql } from '../lib/inject/legacy-sample';
import { LOCALE_QUERIES, legacyLocalesFrom, matchLocales } from '../lib/inject/legacy-locales';

const USAGE = `Copies the old cn, tw, and vi translations of printed lessons from the legacy Primary database
into their packages (part "locales"; track origins_app_refresh_20261001). Run it before the first
injection: the injection replaces the old values.

Usage: npx tsx scripts/fetch-legacy-locales.ts <package.json>... [options]

Options:
  --db-env <NAME>  Env var with the database URL (default LEGACY_DATABASE_URL); never printed
  --dry-run        Read and report; write no package
  --force          Read again for a package that has a copy already

Reads only: one READ ONLY transaction, rolled back. Skips a lesson that is not printed, and a lesson
that is injected already (its article holds the new values). The approvals do not change.`;

interface Options {
    files: string[];
    dbEnv: string;
    dryRun: boolean;
    force: boolean;
}

function parseArgs(argv: string[]): Options | number {
    const o: Options = { files: [], dbEnv: 'LEGACY_DATABASE_URL', dryRun: false, force: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--db-env') o.dbEnv = argv[++i];
        else if (a === '--dry-run') o.dryRun = true;
        else if (a === '--force') o.force = true;
        else if (!a.startsWith('--')) o.files.push(path.resolve(a));
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (o.files.length === 0) {
        console.error(USAGE);
        return 2;
    }
    return o;
}

async function main(argv: string[]): Promise<number> {
    const opts = parseArgs(argv);
    if (typeof opts === 'number') return opts;
    const url = process.env[opts.dbEnv];
    if (!url) {
        console.error(`Set ${opts.dbEnv} to the database URL`);
        return 2;
    }
    for (const sql of Object.values(LOCALE_QUERIES)) if (!isReadOnlySql(sql)) throw new Error(`not read-only: ${sql}`);
    const now = new Date();
    const client = new Client({ connectionString: url });
    await client.connect();
    let failed = 0;
    try {
        await client.query('SET default_transaction_read_only = on');
        await client.query('BEGIN READ ONLY');
        for (const file of opts.files) {
            const root = path.dirname(path.dirname(file));
            const book = path.basename(path.dirname(file));
            const lesson = path.basename(file, '.json');
            const label = `${book}/${lesson}`;
            const parsed = LessonPackageSchema.safeParse(JSON.parse(fs.readFileSync(file, 'utf8')));
            if (!parsed.success) {
                console.error(`${label}: the package does not parse`);
                failed++;
                continue;
            }
            const pkg = parsed.data;
            const articleId = pkg.meta.printed?.articleId;
            if (!articleId) {
                console.log(`${label}: not a printed lesson; skipped (English fills cn, tw, and vi)`);
                continue;
            }
            if (pkg.db.legacy?.injectedAt) {
                console.log(`${label}: injected already (${pkg.db.legacy.injectedAt}); the article holds the new values; skipped`);
                continue;
            }
            if (pkg.locales && !opts.force) {
                console.log(`${label}: has a copy from ${pkg.locales.fetchedAt}; skipped (--force reads again)`);
                continue;
            }
            const article = (await client.query(LOCALE_QUERIES.article, [articleId])).rows[0];
            if (!article) {
                console.error(`${label}: article ${articleId} is not in the database`);
                failed++;
                continue;
            }
            const flashcards = (await client.query(LOCALE_QUERIES.flashcards, [articleId])).rows;
            const locales = legacyLocalesFrom(articleId, article, flashcards, now);
            const m = matchLocales({ ...pkg, locales }).matched;
            console.log(`${label}: ${locales.sentences.length} old sentences, ${locales.words.length} old words; matched ${m.sentences} of ${m.of} sentences, ${m.words} of ${m.ofWords} words, summary ${m.summary ? 'yes' : 'no'}`);
            if (!opts.dryRun) recordLocales(root, book, lesson, locales);
        }
        await client.query('ROLLBACK');
    } finally {
        await client.end();
    }
    return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
