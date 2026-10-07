import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { Client } from 'pg';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { bucketObjects, legacyRows } from '../lib/inject/legacy';
import { verifyPackageNew } from '../lib/inject/new-db';
import { verifyLegacy } from '../lib/inject/run';
import { tutorItems, tutorUploads } from '../lib/media/tutor-audio';

const USAGE = `Compares injected lesson packages with a Primary database and bucket (track primary_injector_20261001).

Usage: npx tsx scripts/verify-lessons.ts <package.json>... [--target legacy|new] [--db-env LEGACY_DATABASE_URL]
       [--bucket primary-app-storage] [--tutor-bucket tutor_advantage_bucket] [--no-bucket]

Reads only. Reports changed or missing rows, question rows that the package does not have, and
missing bucket objects (the app's files, the Tutor clips, and the Tutor manifest). Run it after each injection, after each rehearsal, and after the cutover.
--target new reads the monorepo schema (default env NEW_DATABASE_URL): the ids come from db.new or from
primary_legacy_id_map, and a row with neither is reported as not in the map. The bucket key is the legacy cuid.
Exit code: 0 when everything matches, 1 when something differs.`;

function main(argv: string[]): Promise<number> | number {
    const files: string[] = [];
    let target: 'legacy' | 'new' = 'legacy';
    let dbEnv: string | undefined;
    let bucket = 'primary-app-storage';
    let tutorBucket = 'tutor_advantage_bucket';
    let checkBucket = true;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--db-env') dbEnv = argv[++i];
        else if (a === '--target') {
            const t = argv[++i];
            if (t !== 'legacy' && t !== 'new') {
                console.error(USAGE);
                return 2;
            }
            target = t;
        }
        else if (a === '--bucket') bucket = argv[++i];
        else if (a === '--tutor-bucket') tutorBucket = argv[++i];
        else if (a === '--no-bucket') checkBucket = false;
        else if (!a.startsWith('--')) files.push(path.resolve(a));
        else {
            console.error(USAGE);
            return 2;
        }
    }
    dbEnv ??= target === 'new' ? 'NEW_DATABASE_URL' : 'LEGACY_DATABASE_URL';
    const url = process.env[dbEnv];
    if (files.length === 0 || !url) {
        console.error(url ? USAGE : `Set ${dbEnv} to the database URL`);
        return 2;
    }
    return run(files, url, target, checkBucket ? { app: bucket, tutor: tutorBucket } : undefined);
}

/** Every object under a prefix, in one listing. */
function listed(prefix: string): Set<string> {
    const ls = spawnSync('gcloud', ['storage', 'ls', `${prefix}**`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    return new Set(ls.status === 0 ? ls.stdout.split('\n').map((l) => l.trim()).filter(Boolean) : []);
}

async function run(files: string[], url: string, target: 'legacy' | 'new', buckets?: { app: string; tutor: string }): Promise<number> {
    const client = new Client({ connectionString: url });
    await client.connect();
    let differs = 0;
    try {
        await client.query('SET default_transaction_read_only = on');
        for (const file of files) {
            const pkg = LessonPackageSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
            const label = `${path.basename(path.dirname(file))}/${path.basename(file, '.json')}`;
            let found: { key: string; articleId: string; diffs: string[] } | undefined;
            if (target === 'new') found = await verifyPackageNew(client, pkg, new Date());
            else if (pkg.db.legacy) {
                const known = pkg.db.legacy;
                found = { key: known.articleId, articleId: known.articleId, diffs: await verifyLegacy(client, legacyRows(pkg, known, new Date())) };
            }
            if (!found) {
                console.log(`${label}: not injected`);
                continue;
            }
            const { key, diffs } = found;
            if (buckets) {
                for (const o of bucketObjects(pkg, key)) {
                    const ls = spawnSync('gcloud', ['storage', 'ls', `gs://${buckets.app}/${o.to}`], { encoding: 'utf8' });
                    if (ls.status !== 0) diffs.push(`bucket: ${o.to} missing`);
                    // The app reads the public URL; an object without the public access list gives 403.
                    else {
                        const head = await fetch(`https://storage.googleapis.com/${buckets.app}/${o.to}`, { method: 'HEAD' });
                        if (!head.ok) diffs.push(`bucket: ${o.to} not public (HTTP ${head.status})`);
                    }
                }
                if (pkg.audio.tutor) {
                    const prefix = `gs://${buckets.tutor}/articles/${key}/`;
                    const have = listed(prefix);
                    const want = [...tutorUploads(tutorItems(pkg), pkg.audio.tutor, key).map((u) => `gs://${buckets.tutor}/${u.to}`), `${prefix}manifest.json`];
                    const gone = want.filter((w) => !have.has(w));
                    if (gone.length) diffs.push(`tutor bucket: ${gone.length} of ${want.length} objects missing (first: ${gone[0].slice(prefix.length)})`);
                }
            }
            if (diffs.length) differs++;
            console.log(diffs.length ? `${label}: ${diffs.length} difference(s)\n  ${diffs.join('\n  ')}` : `${label}: matches (article ${found.articleId})`);
        }
    } finally {
        await client.end();
    }
    return differs ? 1 : 0;
}

Promise.resolve(main(process.argv.slice(2))).then(
    (code) => (process.exitCode = code),
    (e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exitCode = 1;
    },
);
