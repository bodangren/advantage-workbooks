import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import sharp from 'sharp';
import { Client } from 'pg';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { recordInjection } from '../lib/lesson-package/store';
import { appArticleId, backupPath, bucketObjects, legacyRows, newCuid, rowsHash } from '../lib/inject/legacy';
import { legacyStatements } from '../lib/inject/sql';
import { applyStatements, verifyLegacy } from '../lib/inject/run';
import { voicesFor } from '../lib/media/audio';
import { tutorItems, tutorManifest, tutorUploads } from '../lib/media/tutor-audio';

const USAGE = `Injects approved lesson packages into the legacy Primary database (track primary_injector_20261001).
Field map: docs/content-plans/primary-db-field-map.md.

Usage: npx tsx scripts/inject-lessons.ts <package.json>... [options]

Options:
  --dry-run              Show what would change; no backup, no upload, no database
  --show-sql             With --dry-run: print the SQL (without the values)
  --db-env <NAME>        Env var with the database URL (default LEGACY_DATABASE_URL); never printed
  --bucket <name>        Bucket for the media (default primary-app-storage)
  --tutor-bucket <name>  Bucket for the Tutor Advantage clips and manifest (default tutor_advantage_bucket)
  --no-tutor             Skip the Tutor clips (only for a local test database)
  --backup-instance <i>  Cloud SQL instance to back up first (default cloud-sql, project reading-advantage)
  --no-backup            Skip the backup (only for a local test database)
  --no-upload            Skip the media upload (only for a local test database)
  --force                Write even when the content hash has not changed

Only packages with approval.lesson = approved are written. Before the first write the script makes
a Cloud SQL backup and waits for it. A printed lesson updates its app article (meta.printed.articleId):
the old bucket objects go to backup/<time>/ first, and the article's old question and flashcard rows
are replaced. Media goes up first (the app's files, then the Tutor clips, then
the Tutor manifest), then one transaction per lesson, then the verify step. The ids go back into the package (db.legacy), and a line goes into
content/primary/<book>/inject-log.jsonl.`;

interface Options {
    files: string[];
    dryRun: boolean;
    showSql: boolean;
    dbEnv: string;
    bucket: string;
    tutorBucket: string;
    tutor: boolean;
    backupInstance: string;
    backup: boolean;
    upload: boolean;
    force: boolean;
}

function parseArgs(argv: string[]): Options | number {
    const o: Options = { files: [], dryRun: false, showSql: false, dbEnv: 'LEGACY_DATABASE_URL', bucket: 'primary-app-storage', tutorBucket: 'tutor_advantage_bucket', tutor: true, backupInstance: 'cloud-sql', backup: true, upload: true, force: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--dry-run') o.dryRun = true;
        else if (a === '--show-sql') o.showSql = true;
        else if (a === '--db-env') o.dbEnv = argv[++i];
        else if (a === '--bucket') o.bucket = argv[++i];
        else if (a === '--tutor-bucket') o.tutorBucket = argv[++i];
        else if (a === '--no-tutor') o.tutor = false;
        else if (a === '--backup-instance') o.backupInstance = argv[++i];
        else if (a === '--no-backup') o.backup = false;
        else if (a === '--no-upload') o.upload = false;
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

function gcloud(args: string[]): string {
    const run = spawnSync('gcloud', args, { encoding: 'utf8', timeout: 1_800_000 });
    if (run.status !== 0) throw new Error(`gcloud ${args.slice(0, 3).join(' ')} failed: ${(run.stderr || String(run.error)).trim().slice(0, 400)}`);
    return run.stdout.trim();
}

/** Makes a Cloud SQL backup, waits for it, and returns its id. */
function backup(instance: string, description: string): string {
    gcloud(['sql', 'backups', 'create', '--instance', instance, '--project', 'reading-advantage', '--description', description]);
    return gcloud(['sql', 'backups', 'list', '--instance', instance, '--project', 'reading-advantage', '--limit', '1', '--sort-by', '~windowStartTime', '--format', 'value(id)']);
}

async function upload(root: string, objects: ReturnType<typeof bucketObjects>, bucket: string) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inject-'));
    try {
        for (const o of objects) {
            let file = path.resolve(root, o.from);
            if (o.png) {
                const png = path.join(tmp, path.basename(o.to));
                await sharp(file).png().toFile(png);
                file = png;
            }
            gcloud(['storage', 'cp', file, `gs://${bucket}/${o.to}`, '--cache-control=public, max-age=300']);
            console.log(`  uploaded ${o.to}`);
        }
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
}

/**
 * Copies the objects that the upload replaces to backup/<time>/ in the same bucket. An object that
 * does not exist yet has nothing to keep.
 * @returns The count of objects copied.
 */
function backupObjects(bucket: string, paths: string[], now: Date): number {
    let copied = 0;
    for (const p of paths) {
        const run = spawnSync('gcloud', ['storage', 'cp', `gs://${bucket}/${p}`, `gs://${bucket}/${backupPath(p, now)}`], { encoding: 'utf8', timeout: 300_000 });
        if (run.status === 0) copied++;
        else if (!/matched no objects|No URLs matched|not found/i.test(run.stderr)) throw new Error(`backup of gs://${bucket}/${p} failed: ${run.stderr.trim().slice(0, 300)}`);
    }
    return copied;
}

/** The Tutor clips go up in one copy (a folder in the bucket's layout); the manifest goes last, without a cache. */
function uploadTutor(root: string, uploads: ReturnType<typeof tutorUploads>, manifest: ReturnType<typeof tutorManifest>, bucket: string) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inject-tutor-'));
    try {
        const prefix = `articles/${manifest.articleId}/`;
        for (const u of uploads) {
            const to = path.join(tmp, manifest.articleId, u.to.slice(prefix.length));
            fs.mkdirSync(path.dirname(to), { recursive: true });
            fs.copyFileSync(path.resolve(root, u.from), to);
        }
        gcloud(['storage', 'cp', '-r', path.join(tmp, manifest.articleId), `gs://${bucket}/articles/`, '--cache-control=public, max-age=300']);
        const file = path.join(tmp, 'manifest.json');
        fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
        gcloud(['storage', 'cp', file, `gs://${bucket}/${prefix}manifest.json`, '--cache-control=no-cache,max-age=0,must-revalidate', '--content-type=application/json']);
        console.log(`  uploaded ${uploads.length} Tutor clips and ${prefix}manifest.json`);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
}

async function main(argv: string[]): Promise<number> {
    const opts = parseArgs(argv);
    if (typeof opts === 'number') return opts;
    const now = new Date();
    let client: Client | undefined;
    let backupId: string | undefined;
    let failed = 0;
    try {
        for (const file of opts.files) {
            const root = path.dirname(path.dirname(file));
            const book = path.basename(path.dirname(file));
            const lesson = path.basename(file, '.json');
            const parsed = LessonPackageSchema.safeParse(JSON.parse(fs.readFileSync(file, 'utf8')));
            if (!parsed.success) {
                console.error(`${book}/${lesson}: the package does not parse`);
                failed++;
                continue;
            }
            const pkg = parsed.data;
            const approved = pkg.approval.lesson.status === 'approved';
            const known = pkg.db.legacy;
            // A printed lesson updates its app article; its other rows are replaced (Q-ORF-01).
            const existing = appArticleId(pkg);
            const ids = { articleId: existing ?? newCuid(), mcq: known?.mcq ?? {}, saq: known?.saq ?? {}, laq: known?.laq ?? {}, flashcardId: known?.flashcardId };
            let rows;
            try {
                rows = legacyRows(pkg, ids, now);
            } catch (e) {
                console.error(`${book}/${lesson}: ${(e as Error).message}`);
                failed++;
                continue;
            }
            let tutor: { uploads: ReturnType<typeof tutorUploads>; manifest: ReturnType<typeof tutorManifest> } | undefined;
            if (opts.tutor) {
                const items = tutorItems(pkg);
                const voices = voicesFor(pkg);
                const uploads = pkg.audio.tutor ? tutorUploads(items, pkg.audio.tutor, rows.ids.articleId) : [];
                const missing = uploads.filter((u) => !fs.existsSync(path.resolve(root, u.from))).length;
                if (!pkg.audio.tutor || missing) {
                    console.error(`${book}/${lesson}: Not ready to inject: ${pkg.audio.tutor ? `${missing} Tutor clip(s) missing` : 'no Tutor clips'}; run scripts/media/lesson-audio.ts`);
                    failed++;
                    continue;
                }
                const manifest = tutorManifest(items, { articleId: rows.ids.articleId, bucket: opts.tutorBucket, title: pkg.meta.title, narratorVoice: voices.narrator, teacherVoice: voices.teacher, speed: 0.75, generatedAt: now.toISOString() });
                tutor = { uploads, manifest };
            }
            const hash = rowsHash(rows, tutor && { ...tutor.manifest, generatedAt: undefined });
            const statements = legacyStatements(rows, now);
            const objects = bucketObjects(pkg, rows.ids.articleId);
            const label = `${book}/${lesson} "${pkg.meta.title}" → article ${rows.ids.articleId} (${existing ? 'update' : 'new'})`;
            const tutorManifestPath = `articles/${rows.ids.articleId}/manifest.json`;

            if (opts.dryRun) {
                console.log(`${label}${approved ? '' : '  [NOT APPROVED: a real run refuses it]'}`);
                console.log(`  rows: 1 article, ${rows.mcq.length} MCQ, ${rows.saq.length} SAQ, ${rows.laq.length} LAQ, 1 flashcard row; hash ${hash}${known?.contentHash === hash ? ' (unchanged)' : ''}`);
                if (existing) console.log(`  first: the old objects (when they exist) → gs://${opts.bucket}/${backupPath('', now)}${tutor ? ` and gs://${opts.tutorBucket}/${backupPath(tutorManifestPath, now)}` : ''}`);
                for (const o of objects) console.log(`  ${o.from} → gs://${opts.bucket}/${o.to}${o.png ? ' (as PNG)' : ''}`);
                if (tutor) console.log(`  ${tutor.uploads.length} Tutor clips and manifest.json → gs://${opts.tutorBucket}/articles/${rows.ids.articleId}/`);
                if (opts.showSql) for (const s of statements) console.log(`  ${s.text}`);
                continue;
            }
            if (!approved) {
                console.error(`${book}/${lesson}: not approved (approval.lesson is draft); skipped`);
                failed++;
                continue;
            }
            if (known?.contentHash === hash && !opts.force) {
                console.log(`${label}: unchanged; skipped`);
                continue;
            }
            const url = process.env[opts.dbEnv];
            if (!url) throw new Error(`Set ${opts.dbEnv} to the database URL`);
            if (opts.backup && !backupId) {
                console.log(`Backup of ${opts.backupInstance} (waits until it is done)...`);
                backupId = backup(opts.backupInstance, `inject ${book}/${lesson} ${now.toISOString()}`);
                console.log(`  backup ${backupId}`);
            }
            if (!client) {
                client = new Client({ connectionString: url });
                await client.connect();
            }
            console.log(label);
            let backedUp = 0;
            if (opts.upload && existing) {
                backedUp = backupObjects(opts.bucket, objects.map((o) => o.to), now) + (tutor ? backupObjects(opts.tutorBucket, [tutorManifestPath], now) : 0);
                console.log(`  ${backedUp} old object(s) → backup/${backupPath('', now).split('/')[1]}/`);
            }
            if (opts.upload) await upload(root, objects, opts.bucket);
            if (opts.upload && tutor) uploadTutor(root, tutor.uploads, tutor.manifest, opts.tutorBucket);
            await applyStatements(client, statements);
            const diffs = await verifyLegacy(client, rows);
            recordInjection(root, book, lesson, 'legacy', { ...rows.ids, contentHash: hash, injectedAt: now.toISOString() });
            const log = { time: now.toISOString(), target: 'legacy', lesson: `${book}/${lesson}`, articleId: rows.ids.articleId, backupId, bucketBackup: backedUp ? backupPath('', now) : undefined, hash, objects: opts.upload ? objects.map((o) => o.to) : [], tutorClips: opts.upload && tutor ? tutor.uploads.length : 0, verify: diffs };
            fs.appendFileSync(path.join(root, book, 'inject-log.jsonl'), `${JSON.stringify(log)}\n`);
            if (diffs.length) {
                failed++;
                console.error(`  verify: ${diffs.join('; ')}`);
            } else console.log('  written and verified');
        }
    } finally {
        await client?.end();
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
