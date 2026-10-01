import fs from 'fs';
import path from 'path';
import { checkPackage, schemaFailure } from '../lib/lesson-package/checks';
import { REPO_ROOT, loadPackageFolder } from '../lib/lesson-package/files';
import { checkContextFor, DEFAULT_GRAPH } from '../lib/lesson-package/context';
import { formatPackageReports } from '../lib/lesson-package/report';

const USAGE = `Checks lesson packages (measure/tracks/lesson_packages_20261001/spec.md).

Usage: npx tsx scripts/check-lesson-package.ts <book-folder-or-package.json>... [options]

Options:
  --graph <file>   Vocabulary graph (default: ../mastery-advantage/.../cefr-vocabulary-knowledge-space.json,
                   or MASTERY_VOCAB_GRAPH)
  --json           Print JSON instead of text

Earlier lessons for the new-word count: the printed Origins 2 and 3.1 lessons, the packages of
earlier books (BOOK_ORDER), and the earlier lessons of the same book.
Exit code: 0 when no check fails, 1 when a check fails, 2 on a usage or file error.`;

function main(argv: string[]): number {
    const targets: string[] = [];
    let graph = process.env.MASTERY_VOCAB_GRAPH || DEFAULT_GRAPH;
    let json = false;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--graph') graph = path.resolve(argv[++i]);
        else if (a === '--json') json = true;
        else targets.push(path.resolve(a));
    }
    if (targets.length === 0) {
        console.error(USAGE);
        return 2;
    }
    if (!fs.existsSync(graph)) {
        console.error(`Vocabulary graph not found: ${graph}`);
        return 2;
    }
    const reports = [];
    for (const target of targets) {
        if (!fs.existsSync(target)) {
            console.error(`Not found: ${target}`);
            return 2;
        }
        const isFile = fs.statSync(target).isFile();
        const files = loadPackageFolder(isFile ? path.dirname(target) : target).filter((f) => !isFile || f.file === target);
        for (const f of files) {
            const report = f.pkg ? checkPackage(f.raw, checkContextFor(f.pkg, graph)) : schemaFailure([{ path: [], message: f.error ?? 'invalid package' }]);
            reports.push({ file: path.relative(REPO_ROOT, f.file), ...report });
        }
    }
    console.log(json ? JSON.stringify(reports, null, 2) : formatPackageReports(reports));
    return reports.some((r) => r.checks.some((c) => c.status === 'fail')) ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
