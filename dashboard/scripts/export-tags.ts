import crypto from 'crypto';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CONTENT_ROOT, OBJECTIVE_KEY_DIR, REPO_ROOT, loadPackageFolder } from '../lib/lesson-package/files';
import { DEFAULT_GRAPH } from '../lib/lesson-package/context';
import type { LessonPackage } from '../lib/lesson-package/schema';
import { buildTagExport, vocabNodeFromGraph, type GraphRelease, type KeyObjective, type VocabNode } from '../lib/lesson-package/tag-export';

const USAGE = `The tag file: the objective and vocabulary tags of every lesson package, for the Mastery Advantage import.

Usage: npx tsx scripts/export-tags.ts [--out <file.json>]

The injector writes no tags, so the monorepo imports them from this file. One entry per package
(every book folder in content/primary): the short ids with their role, the vocabulary nodes, the
objectives of each question, and the legacy article and question ids after the injection (null
before it). The header holds the short-id key and the graph releases. Run it again after each
injection. Default output: content/primary/tags.json. A problem (an unknown short id or node, or a
package that does not parse) writes no file and exits 1.
Env: MASTERY_VOCAB_GRAPH (vocabulary graph), MASTERY_GSE_GRAPH (GSE graph).`;

const DEFAULT_GSE_GRAPH = path.resolve(REPO_ROOT, '..', 'mastery-advantage/english/gse-knowledge-space.json');

interface GraphFile {
    nodes: { id: string; kind: string; title?: string; metadata?: { normalizedForm?: string; matchForms?: string[]; schemaVersion?: string; version?: string } }[];
}

function release(file: string, graph: GraphFile): GraphRelease {
    const dir = path.dirname(file);
    const git = (args: string[]) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();
    const [commit, commitDate] = git(['log', '-1', '--format=%h %cs', '--', path.basename(file)]).split(' ');
    const dirty = git(['status', '--porcelain', '--', path.basename(file)]) !== '';
    const domain = graph.nodes.find((n) => n.kind === 'domain')?.metadata;
    return {
        file: path.relative(path.resolve(REPO_ROOT, '..'), file),
        commit: dirty || !commit ? 'uncommitted' : commit,
        commitDate: commitDate ?? '',
        sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16),
        schemaVersion: domain?.schemaVersion ?? domain?.version,
    };
}

function main(argv: string[]): number {
    if (argv.includes('--help')) {
        console.log(USAGE);
        return 0;
    }
    const outAt = argv.indexOf('--out');
    const out = outAt >= 0 ? path.resolve(argv[outAt + 1]) : path.join(CONTENT_ROOT, 'tags.json');
    const vocabFile = process.env.MASTERY_VOCAB_GRAPH || DEFAULT_GRAPH;
    const gseFile = process.env.MASTERY_GSE_GRAPH || DEFAULT_GSE_GRAPH;
    const vocabGraph = JSON.parse(fs.readFileSync(vocabFile, 'utf8')) as GraphFile;
    const gseGraph = JSON.parse(fs.readFileSync(gseFile, 'utf8')) as GraphFile;
    const vocab = new Map<string, VocabNode>(vocabGraph.nodes.flatMap((n) => {
        const v = vocabNodeFromGraph(n);
        return v ? [[v.id, v] as [string, VocabNode]] : [];
    }));
    const objectives = fs
        .readdirSync(OBJECTIVE_KEY_DIR)
        .filter((f) => f.endsWith('-objective-key.json'))
        .sort()
        .flatMap((f) => (JSON.parse(fs.readFileSync(path.join(OBJECTIVE_KEY_DIR, f), 'utf8')) as { objectives: KeyObjective[] }).objectives);

    const problems: string[] = [];
    const pkgs: LessonPackage[] = [];
    for (const d of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_')).sort((a, b) => a.name.localeCompare(b.name))) {
        for (const f of loadPackageFolder(path.join(CONTENT_ROOT, d.name))) {
            if (f.pkg) pkgs.push(f.pkg);
            else problems.push(`${path.relative(REPO_ROOT, f.file)}: ${f.error}`);
        }
    }
    const { data, problems: more } = buildTagExport(pkgs, objectives, vocab, { gse: release(gseFile, gseGraph), vocabulary: release(vocabFile, vocabGraph) }, new Date().toISOString());
    problems.push(...more);
    if (problems.length) {
        for (const p of problems) console.error(p);
        console.error(`${problems.length} problem(s); ${path.relative(REPO_ROOT, out)} not written`);
        return 1;
    }
    fs.writeFileSync(out, JSON.stringify(data, null, 1) + '\n');
    const injected = data.packages.filter((p) => p.legacy).length;
    console.log(`${path.relative(REPO_ROOT, out)}: ${data.packages.length} packages (${injected} injected), ${Object.keys(data.objectiveKey).length} objectives in the key`);
    return 0;
}

process.exit(main(process.argv.slice(2)));
