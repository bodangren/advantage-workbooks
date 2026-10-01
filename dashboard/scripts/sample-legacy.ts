import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { appArticleId } from '../lib/inject/legacy';
import { isReadOnlySql, jsonShape, SAMPLE_QUERIES } from '../lib/inject/legacy-sample';

const USAGE = `Reads a sample of the legacy Primary database for the lessons' app articles (track origins_app_refresh_20261001).

Usage: npx tsx scripts/sample-legacy.ts <package.json>... [--db-env LEGACY_DATABASE_URL]

Reads only: one READ ONLY transaction, rolled back. Prints the field-map values and JSON shapes,
the rows that hang on each article (Q-ORF-01), and the level pairs (Q-ORF-02). Prints counts,
not student data, and never the database URL.`;

type Row = Record<string, unknown>;

function main(argv: string[]): Promise<number> | number {
    const files: string[] = [];
    let dbEnv = 'LEGACY_DATABASE_URL';
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--db-env') dbEnv = argv[++i];
        else if (!a.startsWith('--')) files.push(path.resolve(a));
        else {
            console.error(USAGE);
            return 2;
        }
    }
    const url = process.env[dbEnv];
    if (files.length === 0 || !url) {
        console.error(url ? USAGE : `Set ${dbEnv} to the database URL`);
        return 2;
    }
    return run(files, url);
}

/** Counts each distinct value, most common first. */
function tally(values: string[]): string[] {
    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).map(([v, n]) => `  ${n} × ${v}`);
}

async function run(files: string[], url: string): Promise<number> {
    const labels = new Map<string, string>();
    const packages = new Map<string, LessonPackage>();
    for (const file of files) {
        const pkg = LessonPackageSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
        const id = appArticleId(pkg);
        const label = `${path.basename(path.dirname(file))}/${path.basename(file, '.json')}`;
        if (id) {
            labels.set(id, label);
            packages.set(id, pkg);
        } else console.log(`${label}: no app article`);
    }
    const ids = [...labels.keys()];
    const name = (id: unknown) => labels.get(String(id)) ?? String(id);

    const client = new Client({ connectionString: url });
    await client.connect();
    const q = async (key: keyof typeof SAMPLE_QUERIES): Promise<Row[]> => {
        const sql = SAMPLE_QUERIES[key];
        if (!isReadOnlySql(sql)) throw new Error(`${key} is not read-only`);
        return (await client.query(sql, [ids])).rows;
    };
    try {
        await client.query('SET default_transaction_read_only = on');
        await client.query('BEGIN READ ONLY');

        const articles = await q('articles');
        const found = new Set(articles.map((a) => String(a.id)));
        console.log(`\n== Articles: ${found.size} of ${ids.length} found`);
        for (const id of ids.filter((i) => !found.has(i))) console.log(`  MISSING ${name(id)} (${id})`);
        for (const a of [...articles].sort((x, y) => name(x.id).localeCompare(name(y.id)))) {
            const audio = [a.audio_url, a.audio_word_url].map((u) => (u ? String(u).replace(String(a.id), '<id>') : '-')).join(' ');
            console.log(
                `  ${name(a.id)}  ra ${a.ra_level} cefr ${a.cefr_level}  ${a.type}/${a.genre}${a.sub_genre ? `/${a.sub_genre}` : ''}  ` +
                    `pub ${a.is_published} appr ${a.is_approved} draft ${a.is_draft} ${a.validation_status}  ` +
                    `passage ${a.passage_len} ch, ${a.newlines} \\n, ${a.blank_lines} blank lines  audio ${audio}  "${a.title}"`,
            );
        }
        // The app's sentence list against the package's (the per-sentence translations follow this list).
        const norm = (t: unknown) => String(t).replace(/\s+/g, ' ').trim();
        const split = articles.map((a) => {
            const app = Array.isArray(a.sentences) ? (a.sentences as Row[]).map((x) => norm(x.sentence)) : [];
            const ours = packages.get(String(a.id))!.thai.paragraphs.flat().map((p) => norm(p.en));
            const same = app.length === ours.length && app.every((t, i) => t === ours[i]);
            return same ? 'same sentences' : `differs (app ${app.length}, package ${ours.length}, first at ${app.findIndex((t, i) => t !== ours[i]) + 1})`;
        });
        console.log('\n== App sentences against the package sentences');
        for (const line of tally(split.map((x) => x.replace(/ \(.*/, '')))) console.log(line);
        articles.forEach((a, i) => split[i] !== 'same sentences' && console.log(`  ${name(a.id)}: ${split[i]}`));

        for (const col of ['sentences', 'words', 'translated_passage', 'translated_summary'] as const) {
            console.log(`\n== Shape of ${col}`);
            for (const line of tally(articles.map((a) => jsonShape(a[col])))) console.log(line);
        }

        console.log('\n== Rows on each article (mcq saq laq | flashcard rows, cards | progress, assignments, activity logs)');
        for (const r of (await q('rows')).sort((x, y) => name(x.id).localeCompare(name(y.id)))) {
            console.log(`  ${name(r.id)}  ${r.mcq} ${r.saq} ${r.laq} | ${r.flashcard_rows} ${r.flashcard_cards} | ${r.progress_rows} ${r.assignments} ${r.activity_logs}`);
        }

        console.log('\n== Student activity on the articles (rows, students)');
        const byType = new Map<string, { n: number; users: number }>();
        for (const r of await q('activities')) {
            const t = byType.get(String(r.activity_type)) ?? { n: 0, users: 0 };
            byType.set(String(r.activity_type), { n: t.n + Number(r.n), users: t.users + Number(r.users) });
        }
        for (const [t, v] of byType) console.log(`  ${t}: ${v.n} rows, ${v.users} student-articles`);

        console.log('\n== Activities whose details name an old question id (Q-ORF-01)');
        const refs = await q('questionRefs');
        if (!refs.length) console.log('  none');
        for (const r of refs) console.log(`  ${name(r.article_id)} ${r.kind}: ${r.activities}`);

        console.log('\n== Level pairs on all articles (ours = the lessons given)');
        for (const r of await q('levels')) console.log(`  ra ${r.ra_level}  cefr ${r.cefr_level}  ${r.n} articles${Number(r.ours) ? `, ours ${r.ours}` : ''}`);

        console.log('\n== Type and genre at ra_level 1 to 3');
        for (const r of (await q('kinds')).slice(0, 25)) console.log(`  ${r.n} × ${r.type} / ${r.genre}${Number(r.ours) ? `, ours ${r.ours}` : ''}`);

        console.log('\n== Filled sentences per locale (th cn tw vi | summary cn vi)');
        for (const line of tally((await q('locales')).map((r) => `${r.th} ${r.cn} ${r.tw} ${r.vi} | ${r.cn_summary} ${r.vi_summary}`))) console.log(line);

        const flashcards = await q('flashcards');
        console.log(`\n== Flashcard rows: ${flashcards.length}`);
        for (const col of ['sentence', 'words'] as const) {
            console.log(`  shape of ${col}:`);
            for (const line of tally(flashcards.map((f) => jsonShape(f[col]).replace(/\(\d+\)$/, '(n)')))) console.log(`  ${line}`);
        }
        const urls = flashcards.map((f) => [f.audio_sentences_url, f.words_url].map((u) => (u ? String(u).replace(String(f.article_id), '<id>') : '-')).join(' '));
        for (const line of tally(urls)) console.log(`  urls:${line}`);

        const [w] = await q('wordsColumn');
        console.log(`\n== words column: ${w.with_words} of ${w.n} articles have it (ours ${w.ours})`);

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
