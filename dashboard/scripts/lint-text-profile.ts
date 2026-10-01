import fs from 'fs';
import path from 'path';
import { loadVocabularyIndex } from '../lib/text-profile/vocabulary';
import { loadLessonFolder, type LessonText } from '../lib/text-profile/sources';
import { checkBook } from '../lib/text-profile/check';
import { formatReport } from '../lib/text-profile/report';

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_GRAPH = path.resolve(ROOT, '..', 'mastery-advantage/english/cefr-vocabulary/cefr-vocabulary-knowledge-space.json');
const DEFAULT_PRIOR = ['primary/origins-2-a0', 'primary/origins-3.1-a0'].map((p) => path.join(ROOT, p));

const USAGE = `Checks lesson texts against the level profile in docs/content-plans/primary-origins-3.2-plan.md §4.

Usage: npx tsx scripts/lint-text-profile.ts <folder-or-file>... [options]

  <folder>   Draft .md files and/or *_workbook.json files, checked in file-name order.
  <file>     One lesson; the files before it in its folder count as earlier lessons.

Options:
  --prior a,b      Folders of earlier books (default: primary/origins-2-a0, primary/origins-3.1-a0)
  --graph <file>   Vocabulary graph (default: ../mastery-advantage/.../cefr-vocabulary-knowledge-space.json,
                   or MASTERY_VOCAB_GRAPH)
  --profile <id>   Default profile for lessons without one (origins-3.2 or origins-3.1-insert)
  --json           Print JSON instead of text

Exit code: 0 when no check fails, 1 when a check fails, 2 on a usage or file error.`;

function main(argv: string[]): number {
    const targets: string[] = [];
    let prior = DEFAULT_PRIOR;
    let graph = process.env.MASTERY_VOCAB_GRAPH || DEFAULT_GRAPH;
    let profile: string | undefined;
    let json = false;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log(USAGE);
            return 0;
        } else if (a === '--prior') prior = argv[++i].split(',').map((p) => path.resolve(p.trim()));
        else if (a === '--graph') graph = path.resolve(argv[++i]);
        else if (a === '--profile') profile = argv[++i];
        else if (a === '--json') json = true;
        else targets.push(path.resolve(a));
    }
    if (targets.length === 0) {
        console.error(USAGE);
        return 2;
    }
    if (!fs.existsSync(graph)) {
        console.error(`Vocabulary graph not found: ${graph}\nUse --graph or MASTERY_VOCAB_GRAPH.`);
        return 2;
    }

    const index = loadVocabularyIndex(graph);
    let failed = false;
    const outputs: unknown[] = [];
    for (const target of targets) {
        if (!fs.existsSync(target)) {
            console.error(`Not found: ${target}`);
            return 2;
        }
        const isFile = fs.statSync(target).isFile();
        const dir = isFile ? path.dirname(target) : target;
        let lessons: LessonText[] = loadLessonFolder(dir);
        if (isFile) {
            const at = lessons.findIndex((l) => path.resolve(l.source) === target);
            if (at < 0) {
                console.error(`Not a lesson file (.md draft or *_workbook.json): ${target}`);
                return 2;
            }
            lessons = lessons.slice(0, at + 1);
        }
        const priorLessons = prior.filter((p) => path.resolve(p) !== path.resolve(dir)).flatMap((p) => loadLessonFolder(p));
        const book = checkBook(lessons, { index, prior: priorLessons, defaultProfile: profile });
        const shown = isFile ? { lessons: book.lessons.slice(-1), checks: [] } : book;
        const all = [...shown.lessons.flatMap((r) => r.checks), ...shown.checks];
        if (all.some((c) => c.status === 'fail')) failed = true;
        if (json) outputs.push({ target, ...shown });
        else console.log(formatReport(shown));
    }
    if (json) console.log(JSON.stringify(outputs.length === 1 ? outputs[0] : outputs, null, 2));
    return failed ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
