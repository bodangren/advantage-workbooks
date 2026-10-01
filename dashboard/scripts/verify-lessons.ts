import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { Client } from 'pg';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { bucketObjects, legacyRows } from '../lib/inject/legacy';
import { verifyLegacy } from '../lib/inject/run';

const USAGE = `Compares injected lesson packages with the legacy Primary database and bucket (track primary_injector_20261001).

Usage: npx tsx scripts/verify-lessons.ts <package.json>... [--db-env LEGACY_DATABASE_URL] [--bucket primary-app-storage] [--no-bucket]

Reads only. Reports changed or missing rows, question rows that the package does not have, and
missing bucket objects. Run it after each injection, after each rehearsal, and after the cutover.
Exit code: 0 when everything matches, 1 when something differs.`;

function main(argv: string[]): Promise<number> | number {
    const files: string[] = [];
    let dbEnv = 'LEGACY_DATABASE_URL';
    let bucket = 'primary-app-storage';
    let checkBucket = true;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--db-env') dbEnv = argv[++i];
        else if (a === '--bucket') bucket = argv[++i];
        else if (a === '--no-bucket') checkBucket = false;
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
    return run(files, url, checkBucket ? bucket : undefined);
}

async function run(files: string[], url: string, bucket?: string): Promise<number> {
    const client = new Client({ connectionString: url });
    await client.connect();
    let differs = 0;
    try {
        await client.query('SET default_transaction_read_only = on');
        for (const file of files) {
            const pkg = LessonPackageSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
            const label = `${path.basename(path.dirname(file))}/${path.basename(file, '.json')}`;
            const known = pkg.db.legacy;
            if (!known) {
                console.log(`${label}: not injected`);
                continue;
            }
            const diffs = await verifyLegacy(client, legacyRows(pkg, known, new Date()));
            if (bucket) {
                for (const o of bucketObjects(pkg, known.articleId)) {
                    const ls = spawnSync('gcloud', ['storage', 'ls', `gs://${bucket}/${o.to}`], { encoding: 'utf8' });
                    if (ls.status !== 0) diffs.push(`bucket: ${o.to} missing`);
                }
            }
            if (diffs.length) differs++;
            console.log(diffs.length ? `${label}: ${diffs.length} difference(s)\n  ${diffs.join('\n  ')}` : `${label}: matches (article ${known.articleId})`);
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
