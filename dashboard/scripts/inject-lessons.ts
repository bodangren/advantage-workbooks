import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import sharp from 'sharp';
import { Client } from 'pg';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { recordInjection } from '../lib/lesson-package/store';
import { appArticleId, appUploadArgs, backupPath, bucketObjects, legacyRows, newCuid, rowsHash } from '../lib/inject/legacy';
import { matchLocales } from '../lib/inject/legacy-locales';
import { legacyStatements } from '../lib/inject/sql';
import { newRows, newRowsHash, newStatements, planIds, readLegacyMap, verifyNew } from '../lib/inject/new-db';
import { applyStatements, verifyLegacy } from '../lib/inject/run';
import { runWithRetry } from '../lib/inject/gcloud';
import { voicesFor } from '../lib/media/audio';
import { tutorItems, tutorManifest, tutorUploads } from '../lib/media/tutor-audio';

const USAGE = `Injects approved lesson packages into the Primary database: the legacy one (default), or the new one after the cutover (--target new).
Field map: docs/content-plans/primary-db-field-map.md.

Usage: npx tsx scripts/inject-lessons.ts <package.json>... [options]

Options:
  --dry-run              Show what would change; no backup, no upload, no database
  --show-sql             With --dry-run: print the SQL (without the values)
  --target <legacy|new>  Which database (default legacy). The new target writes the monorepo schema (uuid ids)
  --db-env <NAME>        Env var with the database URL (default LEGACY_DATABASE_URL, or NEW_DATABASE_URL for --target new); never printed
  --backup-project <p>   GCP project of the Cloud SQL instance (default reading-advantage)
  --bucket <name>        Bucket for the media (default primary-app-storage)
  --tutor-bucket <name>  Bucket for the Tutor Advantage clips and manifest (default tutor_advantage_bucket)
  --no-tutor             Skip the Tutor clips (only for a local test database)
  --backup-instance <i>  Cloud SQL instance to back up first (default cloud-sql, project reading-advantage)
  --no-backup            Skip the backup (only for a local test database)
  --no-upload            Skip the media upload (only for a local test database)
  --force                Write even when the content hash has not changed

Only packages with approval.lesson = approved are written. Before the first write the script makes
a Cloud SQL backup and waits for it. A printed lesson updates its app article (meta.printed.articleId), and so does a package with
meta.replaces (a rebuilt online article). A bank package (meta.role = bank) has no Tutor clips:
the old bucket objects go to backup/<time>/ first, and the article's old question and flashcard rows
are replaced. A printed lesson needs its copy of the old cn, tw, and vi first
(scripts/fetch-legacy-locales.ts); English fills each gap. Media goes up first (the app's files, then the Tutor clips, then
the Tutor manifest), then one transaction per lesson, then the verify step. The ids go back into the package (db.legacy), and a line goes into
content/primary/<book>/inject-log.jsonl.

New target: a package with db.legacy ids (or a printed or replaced article) went into the legacy database before the
cutover, so the cutover ETL moved it. The script finds its uuids in primary_legacy_id_map and updates those rows; the other rows
are inserted. The bucket key is the legacy cuid when the article has one, else the uuid. The ids go into db.new.`;

interface Options {
    files: string[];
    target: 'legacy' | 'new';
    backupProject: string;
    dryRun: boolean;
    showSql: boolean;
    dbEnv: string | undefined;
    bucket: string;
    tutorBucket: string;
    tutor: boolean;
    backupInstance: string;
    backup: boolean;
    upload: boolean;
    force: boolean;
}

function parseArgs(argv: string[]): Options | number {
    const o: Options = { files: [], target: 'legacy', backupProject: 'reading-advantage', dryRun: false, showSql: false, dbEnv: undefined, bucket: 'primary-app-storage', tutorBucket: 'tutor_advantage_bucket', tutor: true, backupInstance: 'cloud-sql', backup: true, upload: true, force: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--dry-run') o.dryRun = true;
        else if (a === '--show-sql') o.showSql = true;
        else if (a === '--target') {
            const t = argv[++i];
            if (t !== 'legacy' && t !== 'new') {
                console.error(USAGE);
                return 2;
            }
            o.target = t;
        } else if (a === '--backup-project') o.backupProject = argv[++i];
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
    o.dbEnv ??= o.target === 'new' ? 'NEW_DATABASE_URL' : 'LEGACY_DATABASE_URL';
    return o;
}

function gcloud(args: string[]): string {
    const run = spawnSync('gcloud', args, { encoding: 'utf8', timeout: 1_800_000 });
    if (run.status !== 0) throw new Error(`gcloud ${args.slice(0, 3).join(' ')} failed: ${(run.stderr || String(run.error)).trim().slice(-400)}`);
    return run.stdout.trim();
}

/** A bucket copy or upload with a short timeout and new tries (a request can hang behind the proxy). */
function gcloudStorage(args: string[], timeoutMs: number, tries: number, giveUp?: RegExp): string | undefined {
    return runWithRetry((a, timeout) => spawnSync('gcloud', a, { encoding: 'utf8', timeout }), args, {
        timeoutMs,
        tries,
        giveUp,
        onRetry: (attempt, why) => console.log(`  gcloud ${args.slice(0, 2).join(' ')}: try ${attempt} failed (${why}); trying again`),
    });
}

/** Makes a Cloud SQL backup, waits for it, and returns its id. */
function backup(instance: string, description: string, project = 'reading-advantage'): string {
    gcloud(['sql', 'backups', 'create', '--instance', instance, '--project', project, '--description', description]);
    return gcloud(['sql', 'backups', 'list', '--instance', instance, '--project', project, '--limit', '1', '--sort-by', '~windowStartTime', '--format', 'value(id)']);
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
            gcloudStorage(appUploadArgs(file, bucket, o.to), 120_000, 4);
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
        // A server-side copy takes about 8 s; behind the proxy one request in 20 hangs (2026-10-06), so a
        // short timeout and a new try cost less than one long wait. A missing object has nothing to keep.
        const out = gcloudStorage(['storage', 'cp', `gs://${bucket}/${p}`, `gs://${bucket}/${backupPath(p, now)}`], 60_000, 5, /matched no objects|No URLs matched|not found/i);
        if (out !== undefined) copied++;
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
        gcloudStorage(['storage', 'cp', '-r', path.join(tmp, manifest.articleId), `gs://${bucket}/articles/`, '--cache-control=public, max-age=300'], 600_000, 3);
        const file = path.join(tmp, 'manifest.json');
        fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
        gcloudStorage(['storage', 'cp', file, `gs://${bucket}/${prefix}manifest.json`, '--cache-control=no-cache,max-age=0,must-revalidate', '--content-type=application/json'], 60_000, 5);
        console.log(`  uploaded ${uploads.length} Tutor clips and ${prefix}manifest.json`);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
}

/** The connection and the backup of one run; the new target shares them across packages. */
interface RunState {
    client?: Client;
    backupId?: string;
}

/**
 * Injects one package into the new database (monorepo schema).
 * @returns 0 when the lesson is written and verified (or skipped as unchanged), 1 otherwise.
 */
async function injectNew(opts: Options, state: RunState, file: string, now: Date): Promise<number> {
    const root = path.dirname(path.dirname(file));
    const book = path.basename(path.dirname(file));
    const lesson = path.basename(file, '.json');
    const parsed = LessonPackageSchema.safeParse(JSON.parse(fs.readFileSync(file, 'utf8')));
    if (!parsed.success) {
        console.error(`${book}/${lesson}: the package does not parse`);
        return 1;
    }
    const pkg = parsed.data;
    const approved = pkg.approval.lesson.status === 'approved';
    const known = pkg.db.new;
    // A package with legacy ids was moved by the cutover ETL; its rows are updated through the id map.
    const legacyArticleId = appArticleId(pkg);
    const bank = { mcq: pkg.bank.mcq.map((q) => q.id), saq: pkg.bank.saq.map((q) => q.id), laq: pkg.bank.laq.map((q) => q.id) };
    const input = { legacyArticleId, legacy: pkg.db.legacy, current: known, bank };

    // The checks and the dry run need no database: legacy ids count as mapped.
    let plan = planIds(input, new Map(), { dryRun: true });
    let rows: ReturnType<typeof newRows>;
    try {
        rows = newRows(pkg, plan, now);
    } catch (e) {
        console.error(`${book}/${lesson}: ${(e as Error).message}`);
        return 1;
    }
    const tutorFor = (key: string) => {
        // Bank articles are online only: Tutor Advantage sells the printed books, so they have no Tutor clips.
        if (!opts.tutor || pkg.meta.role === 'bank') return { tutor: undefined as undefined | { uploads: ReturnType<typeof tutorUploads>; manifest: ReturnType<typeof tutorManifest> } };
        const items = tutorItems(pkg);
        const voices = voicesFor(pkg);
        const uploads = pkg.audio.tutor ? tutorUploads(items, pkg.audio.tutor, key) : [];
        const missing = uploads.filter((u) => !fs.existsSync(path.resolve(root, u.from))).length;
        if (!pkg.audio.tutor || missing) throw new Error(`Not ready to inject: ${pkg.audio.tutor ? `${missing} Tutor clip(s) missing` : 'no Tutor clips'}; run scripts/media/lesson-audio.ts`);
        const manifest = tutorManifest(items, { articleId: key, bucket: opts.tutorBucket, title: pkg.meta.title, narratorVoice: voices.narrator, teacherVoice: voices.teacher, speed: 0.75, generatedAt: now.toISOString() });
        return { tutor: { uploads, manifest } };
    };
    let tutor;
    try {
        tutor = tutorFor(plan.key).tutor;
    } catch (e) {
        console.error(`${book}/${lesson}: ${(e as Error).message}`);
        return 1;
    }
    const objects = bucketObjects(pkg, plan.key);
    const hashOf = (r: ReturnType<typeof newRows>) => newRowsHash(r, tutor && { ...tutor.manifest, generatedAt: undefined });
    const describe = (p: typeof plan) => {
        const all = [p.article, ...Object.values(p.mcq), ...Object.values(p.saq), ...Object.values(p.laq), p.flashcard];
        return `${all.filter((x) => x.action === 'update').length} update, ${all.filter((x) => x.action === 'insert').length} insert`;
    };

    if (opts.dryRun) {
        console.log(`${book}/${lesson} "${pkg.meta.title}" → articles ${rows.article.id} (target new; ${plan.article.action}, bucket key ${plan.key})${approved ? '' : '  [NOT APPROVED: a real run refuses it]'}`);
        console.log(`  rows: 1 article, ${rows.mcq.length} MCQ, ${rows.saq.length} SAQ, ${rows.laq.length} LAQ, 1 flashcard row (${describe(plan)}); hash ${hashOf(rows)}${known?.contentHash === hashOf(rows) ? ' (unchanged)' : ''}`);
        if (legacyArticleId && !known) console.log(`  ids of legacy rows: read from primary_legacy_id_map in a real run (shown as <uuid of ...>); a missing article stops the run`);
        const a = rows.article;
        console.log(`  article: level ${a.level}/${a.cefr_level}, type ${a.type}, genre ${a.genre}, image (picture key) ${a.image}, audio ${a.audio_url}`);
        rows.mcq.forEach((q, i) => console.log(`  MCQ ${i + 1} [${plan.mcq[rows.order.mcq[i]].action}] ${q.id}: correct_answer ${q.correct_answer} (${q.options[q.correct_answer]}), order ${q.order}`));
        rows.saq.forEach((q, i) => console.log(`  SAQ ${i + 1} [${plan.saq[rows.order.saq[i]].action}] ${q.id}: order ${q.order}, sample_answer "${q.sample_answer}"`));
        rows.laq.forEach((q, i) => console.log(`  LAQ ${i + 1} [${plan.laq[rows.order.laq[i]].action}] ${q.id}`));
        console.log(`  flashcard [${plan.flashcard.action}] ${rows.flashcard.id}: ${rows.flashcard.sentence.length} sentences, ${rows.flashcard.words.length} words`);
        if (legacyArticleId) console.log(`  first: the old objects (when they exist) → gs://${opts.bucket}/${backupPath('', now)}`);
        for (const o of objects) console.log(`  ${o.from} → gs://${opts.bucket}/${o.to}${o.png ? ' (as PNG)' : ''}`);
        if (tutor) console.log(`  ${tutor.uploads.length} Tutor clips and manifest.json → gs://${opts.tutorBucket}/articles/${plan.key}/`);
        if (opts.showSql) for (const s of newStatements(rows, plan, now)) console.log(`  ${s.text}`);
        return 0;
    }
    if (!approved) {
        console.error(`${book}/${lesson}: not approved (approval.lesson is draft); skipped`);
        return 1;
    }
    const url = process.env[opts.dbEnv!];
    if (!url) throw new Error(`Set ${opts.dbEnv} to the database URL`);
    if (!state.client) {
        state.client = new Client({ connectionString: url });
        await state.client.connect();
    }
    // Read the id map, then plan again with the real uuids of the rows that the cutover moved.
    plan = planIds(input, await readLegacyMap(state.client, pkg.db.legacy, legacyArticleId));
    rows = newRows(pkg, plan, now);
    const hash = hashOf(rows);
    const label = `${book}/${lesson} "${pkg.meta.title}" → articles ${rows.article.id} (${plan.article.action}; ${describe(plan)})`;
    if (known?.contentHash === hash && !opts.force) {
        console.log(`${label}: unchanged; skipped`);
        return 0;
    }
    if (opts.backup && !state.backupId) {
        console.log(`Backup of ${opts.backupInstance} (waits until it is done)...`);
        state.backupId = backup(opts.backupInstance, `inject new ${book}/${lesson} ${now.toISOString()}`, opts.backupProject);
        console.log(`  backup ${state.backupId}`);
    }
    console.log(label);
    const tutorManifestPath = `articles/${plan.key}/manifest.json`;
    let backedUp = 0;
    if (opts.upload && legacyArticleId) {
        backedUp = backupObjects(opts.bucket, objects.map((o) => o.to), now) + (tutor ? backupObjects(opts.tutorBucket, [tutorManifestPath], now) : 0);
        console.log(`  ${backedUp} old object(s) → backup/${backupPath('', now).split('/')[1]}/`);
    }
    if (opts.upload) await upload(root, objects, opts.bucket);
    if (opts.upload && tutor) uploadTutor(root, tutor.uploads, tutor.manifest, opts.tutorBucket);
    await applyStatements(state.client, newStatements(rows, plan, now));
    const diffs = await verifyNew(state.client, rows);
    recordInjection(root, book, lesson, 'new', { ...rows.ids, contentHash: hash, injectedAt: now.toISOString() });
    const log = { time: now.toISOString(), target: 'new', lesson: `${book}/${lesson}`, articleId: rows.ids.articleId, key: plan.key, backupId: state.backupId, bucketBackup: backedUp ? backupPath('', now) : undefined, hash, objects: opts.upload ? objects.map((o) => o.to) : [], tutorClips: opts.upload && tutor ? tutor.uploads.length : 0, verify: diffs };
    fs.appendFileSync(path.join(root, book, 'inject-log.jsonl'), `${JSON.stringify(log)}\n`);
    if (diffs.length) {
        console.error(`  verify: ${diffs.join('; ')}`);
        return 1;
    }
    console.log('  written and verified');
    return 0;
}

async function main(argv: string[]): Promise<number> {
    const opts = parseArgs(argv);
    if (typeof opts === 'number') return opts;
    const now = new Date();
    let client: Client | undefined;
    let backupId: string | undefined;
    let failed = 0;
    const state: RunState = {};
    try {
        for (const file of opts.files) {
            if (opts.target === 'new') {
                failed += await injectNew(opts, state, file, now);
                continue;
            }
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
            // Bank articles are online only: Tutor Advantage sells the printed books, so they have no Tutor clips.
            if (opts.tutor && pkg.meta.role !== 'bank') {
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
                const m = matchLocales(pkg).matched;
                console.log(`  cn/tw/vi: old values for ${m.sentences} of ${m.of} sentences, ${m.words} of ${m.ofWords} words, summary ${m.summary ? 'old' : 'English'}; English fills the rest`);
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
            const url = process.env[opts.dbEnv!];
            if (!url) throw new Error(`Set ${opts.dbEnv} to the database URL`);
            if (opts.backup && !backupId) {
                console.log(`Backup of ${opts.backupInstance} (waits until it is done)...`);
                backupId = backup(opts.backupInstance, `inject ${book}/${lesson} ${now.toISOString()}`, opts.backupProject);
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
        await state.client?.end();
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
