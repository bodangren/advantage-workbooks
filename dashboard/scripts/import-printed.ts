import fs from 'fs';
import path from 'path';
import { checkContextFor } from '../lib/lesson-package/context';
import { CONTENT_ROOT, REPO_ROOT } from '../lib/lesson-package/files';
import { packagePath, savePackage } from '../lib/lesson-package/store';
import { printedArticleId, printedToPackage } from '../lib/lesson-package/import-printed';

const USAGE = `Makes lesson packages from a printed book (track origins_app_refresh_20261001).

Usage: npx tsx scripts/import-printed.ts --from <printed folder> --book <book> --key <key> [--dry-run]

Example: npx tsx scripts/import-printed.ts --from ../primary/origins-2-a0 --book origins-2 --key o2

Each "NN-<title> _workbook.json" becomes content/primary/<book>/lNN.json (meta.lesson LNN, key
<key>/<n>). The article, the vocabulary words, and the printed questions and activities are locked;
the fields to write hold "?" (the todo check lists them). A package that exists is never written
again: it holds Claude's work. A lesson with the same app article as an earlier one is skipped
(Origins 3.1 lesson 12 repeats lesson 9; E12 replaces it).`;

function main(argv: string[]): number {
    let from: string | undefined;
    let book: string | undefined;
    let key: string | undefined;
    let dryRun = false;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--from') from = path.resolve(argv[++i]);
        else if (a === '--book') book = argv[++i];
        else if (a === '--key') key = argv[++i];
        else if (a === '--dry-run') dryRun = true;
        else {
            console.error(USAGE);
            return 2;
        }
    }
    if (!from || !book || !key) {
        console.error(USAGE);
        return 2;
    }
    const files = fs
        .readdirSync(from)
        .filter((f) => /^\d{2}-.*_workbook\.json$/.test(f))
        .sort();
    const seen = new Map<string, string>();
    let made = 0;
    if (!dryRun) fs.mkdirSync(path.join(CONTENT_ROOT, book), { recursive: true });
    for (const f of files) {
        const number = Number(f.slice(0, 2));
        const lesson = `l${f.slice(0, 2)}`;
        const raw = JSON.parse(fs.readFileSync(path.join(from, f), 'utf8'));
        const id = printedArticleId(String(raw.article_url ?? ''));
        if (id && seen.has(id)) {
            console.log(`${lesson}: skipped (same app article as ${seen.get(id)})`);
            continue;
        }
        if (id) seen.set(id, lesson);
        if (fs.existsSync(packagePath(CONTENT_ROOT, book, lesson))) {
            console.log(`${lesson}: exists; not written`);
            continue;
        }
        const pkg = printedToPackage(raw, { book, lesson: lesson.toUpperCase(), number, key: `${key}/${number}`, file: path.relative(REPO_ROOT, path.join(from, f)) });
        if (dryRun) {
            console.log(`${lesson}: "${pkg.meta.title}" → article ${pkg.meta.printed?.articleId} (dry run)`);
            continue;
        }
        const result = savePackage(CONTENT_ROOT, book, lesson, pkg, checkContextFor);
        if (!result.saved) {
            console.error(`${lesson}: does not parse: ${result.report.checks.map((c) => c.detail).join('; ')}`);
            return 1;
        }
        const fails = result.report.checks.filter((c) => c.status === 'fail').map((c) => c.id);
        console.log(`${lesson}: "${pkg.meta.title}" → article ${pkg.meta.printed?.articleId}; FAIL: ${fails.join(', ') || 'none'}`);
        made++;
    }
    console.log(dryRun ? 'Dry run: nothing written.' : `${made} package(s) written to ${path.relative(process.cwd(), path.join(CONTENT_ROOT, book))}`);
    return 0;
}

try {
    process.exitCode = main(process.argv.slice(2));
} catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
}
