import fs from 'fs';
import path from 'path';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { checkContextFor } from '../lib/lesson-package/context';
import { REPO_ROOT } from '../lib/lesson-package/files';
import { savePackage } from '../lib/lesson-package/store';
import { applySupplement, tagsFor, type Supplement } from '../lib/lesson-package/supplement';

const USAGE = `Merges a supplement into a lesson package (track origins_app_refresh_20261001).

Usage: npx tsx scripts/apply-supplement.ts <package.json> <supplement.json> [--dry-run]

A supplement holds what Claude writes for a printed lesson (lib/lesson-package/supplement.ts): the
summaries, the missing Thai, glossary changes, the new questions, the picture plans, and the
narrator. The locked parts cannot change. When the package has no tags yet, the tags come from
docs/content-plans/data/a0-tagging-2026-09-30.json. The changed parts go back to draft.`;

const TAGGING = path.join(REPO_ROOT, 'docs/content-plans/data/a0-tagging-2026-09-30.json');

function main(argv: string[]): number {
    const files = argv.filter((a) => !a.startsWith('--'));
    if (argv.includes('--help') || files.length !== 2) {
        console.error(USAGE);
        return argv.includes('--help') ? 0 : 2;
    }
    const [pkgFile, supFile] = files.map((f) => path.resolve(f));
    const pkg = LessonPackageSchema.parse(JSON.parse(fs.readFileSync(pkgFile, 'utf8')));
    const sup = JSON.parse(fs.readFileSync(supFile, 'utf8')) as Supplement;
    if (!sup.tags && pkg.tags.targetObjectives.length === 0) {
        sup.tags = tagsFor(JSON.parse(fs.readFileSync(TAGGING, 'utf8')), pkg.meta.book, pkg.meta.number);
    }
    const next = applySupplement(pkg, sup);
    if (argv.includes('--dry-run')) {
        console.log(JSON.stringify(next, null, 2));
        return 0;
    }
    const root = path.dirname(path.dirname(pkgFile));
    const result = savePackage(root, path.basename(path.dirname(pkgFile)), path.basename(pkgFile, '.json'), next, checkContextFor);
    if (!result.saved) {
        console.error(`Does not parse: ${result.report.checks.map((c) => c.detail).join('; ')}`);
        return 1;
    }
    const open = result.report.checks.filter((c) => c.status !== 'pass');
    console.log(`Saved ${path.relative(process.cwd(), pkgFile)} "${next.meta.title}"`);
    for (const c of open) console.log(`  ${c.status.toUpperCase().padEnd(5)} ${c.id}: ${c.detail ?? ''}`);
    if (!open.length) console.log('  every check passes');
    return open.some((c) => c.status === 'fail') ? 1 : 0;
}

try {
    process.exitCode = main(process.argv.slice(2));
} catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
}
