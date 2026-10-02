import fs from 'fs';
import path from 'path';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { carryMedia, parseAuthorSource } from '../lib/lesson-package/author';
import { checkContextFor, DEFAULT_GRAPH } from '../lib/lesson-package/context';
import { savePackage } from '../lib/lesson-package/store';
import { loadVocabularyIndex } from '../lib/text-profile/vocabulary';

const USAGE = `Turns authoring files into lesson packages and checks them (track level_banks_20261002).
Format: content/primary/AUTHORING.md.

Usage: npx tsx scripts/author-package.ts <file.md | src folder>... [--quiet]

Each file is content/primary/<book>/src/<lesson>.md; the package goes to
content/primary/<book>/<lesson>.json. Pictures, audio, approvals, and database ids carry over from
the saved package when their part did not change (a changed part goes back to draft).

Prints one block per lesson: FAIL lines (they block approval), WARN lines, and the text numbers.
--quiet prints only the lessons with a FAIL. Exit code 1 when a file has an error or a FAIL.`;

interface GraphFile {
    nodes: { id: string; kind: string; metadata?: { normalizedForm?: string; matchForms?: string[] } }[];
}

function nodeLookup(graphFile: string): (word: string) => string[] {
    const graph = JSON.parse(fs.readFileSync(graphFile, 'utf8')) as GraphFile;
    const byForm = new Map<string, string[]>();
    for (const n of graph.nodes) {
        if (n.kind !== 'skill' || !n.id.startsWith('english.vocabulary.skill.')) continue;
        for (const f of [n.metadata?.normalizedForm, ...(n.metadata?.matchForms ?? [])]) {
            if (!f) continue;
            const key = f.toLowerCase().trim();
            byForm.set(key, [...new Set([...(byForm.get(key) ?? []), n.id])]);
        }
    }
    return (word: string) => byForm.get(word.toLowerCase().trim()) ?? [];
}

function sourceFiles(args: string[]): string[] {
    return args.flatMap((a) => {
        const p = path.resolve(a);
        if (fs.statSync(p).isDirectory()) return fs.readdirSync(p).filter((f) => f.endsWith('.md')).sort().map((f) => path.join(p, f));
        return [p];
    });
}

function main(argv: string[]): number {
    const quiet = argv.includes('--quiet');
    const args = argv.filter((a) => a !== '--quiet');
    if (!args.length || args.includes('--help') || args.includes('-h')) {
        console.log(USAGE);
        return args.length ? 0 : 2;
    }
    const graph = process.env.MASTERY_VOCAB_GRAPH || DEFAULT_GRAPH;
    const index = loadVocabularyIndex(graph);
    const nodesOf = nodeLookup(graph);
    let bad = 0;
    for (const file of sourceFiles(args)) {
        const srcDir = path.dirname(file);
        const bookDir = path.dirname(srcDir);
        const root = path.dirname(bookDir);
        const book = path.basename(bookDir);
        const lesson = path.basename(file, '.md');
        const label = `${book}/${lesson}`;
        if (path.basename(srcDir) !== 'src') {
            console.log(`${label}: the file must be in <book>/src/`);
            bad++;
            continue;
        }
        const { pkg, errors } = parseAuthorSource(fs.readFileSync(file, 'utf8'), { book, lesson }, index, nodesOf);
        if (!pkg) {
            console.log(`${label}: ERROR\n${errors.map((e) => `  ${e}`).join('\n')}`);
            bad++;
            continue;
        }
        const target = path.join(bookDir, `${lesson}.json`);
        const old = fs.existsSync(target) ? LessonPackageSchema.safeParse(JSON.parse(fs.readFileSync(target, 'utf8'))) : undefined;
        carryMedia(pkg, old?.success ? old.data : undefined);
        const result = savePackage(root, book, lesson, pkg, checkContextFor);
        const checks = result.report.checks;
        const fails = checks.filter((c) => c.status === 'fail');
        const textFails = result.report.text?.checks.filter((c) => c.status === 'fail') ?? [];
        const warns = [
            ...checks.filter((c) => c.status === 'warn' && c.id !== 'media').map((c) => `${c.id}: ${c.detail ?? c.label}`),
            ...(result.report.text?.checks.filter((c) => c.status === 'warn') ?? []).map((c) => `${c.id}: ${c.value} (target ${c.target})`),
        ];
        if (fails.length) bad++;
        if (quiet && !fails.length) continue;
        const s = result.report.text?.stats;
        const numbers = s ? `${s.words} words, mean sentence ${s.meanSentenceLength}, longest ${s.longestSentence}, list share ${(s.startersShareWithoutNames * 100).toFixed(1)}%, ${s.questionMarks} "?"` : '';
        console.log(`${label} "${result.report.title}": ${fails.length ? 'FAIL' : 'PASS'}  ${numbers}`);
        for (const c of fails) {
            if (c.id === 'text') for (const t of textFails) console.log(`  FAIL text ${t.id}: ${t.value} (target ${t.target})${t.detail ? ` ${t.detail}` : ''}`);
            else console.log(`  FAIL ${c.id}: ${c.detail ?? c.label}`);
        }
        for (const w of warns) console.log(`  WARN ${w}`);
        const off = result.report.text?.nonStarters ?? [];
        if (off.length && fails.some((c) => c.id === 'text')) console.log(`  words off the list: ${off.map((w) => `${w.word} (${w.level})`).join(', ')}`);
    }
    return bad ? 1 : 0;
}

try {
    process.exitCode = main(process.argv.slice(2));
} catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
}
