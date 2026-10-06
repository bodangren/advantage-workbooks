import type { LessonPackage } from './schema';

/**
 * The tag file (lesson-package spec: "the workbook JSON, the database rows, and the tag file are all
 * built from it"). The injector writes no tags, and neither database has a place for them, so this
 * file carries them to the Mastery Advantage import in the monorepo. Shape agreed with the Mastery
 * graph planning session on 2026-10-06: the short-id key and the graph releases once in the header,
 * short ids in the entries, and the package question ids as the stable question keys.
 */

/** One objective of a `*-objective-key.json` file. */
export interface KeyObjective {
    id: string;
    node: string;
    gse: number;
    skill: string;
    text: string;
}

/** A vocabulary graph node, with the parts that the export needs. */
export interface VocabNode {
    id: string;
    word: string;
    pos: string;
}

/** The graph file that the tags were made against. */
export interface GraphRelease {
    /** Path relative to the sibling repos' parent folder, e.g. `mastery-advantage/english/gse-knowledge-space.json`. */
    file: string;
    /** The last commit that changed the file (short hash), or `uncommitted`. */
    commit: string;
    commitDate: string;
    /** The first 16 hex characters of the file's SHA-256. */
    sha256: string;
    schemaVersion?: string;
}

export type QuestionType = 'mcq' | 'saq' | 'laq';

export interface TagExportEntry {
    key: string;
    book: string;
    lesson: string;
    title: string;
    role: 'workbook' | 'bank';
    level: number;
    /** The legacy rows after the injection; `null` before it. Re-export after each injection. */
    legacy: { articleId: string; questions: Record<string, string> } | null;
    articleObjectives: { shortId: string; role: 'target' | 'supporting' }[];
    vocabulary: { word: string; pos: string; nodeId: string; role: 'glossed' | 'recycled' }[];
    questions: { id: string; type: QuestionType; objectives: string[] }[];
}

export interface TagExport {
    version: 1;
    generatedAt: string;
    source: string;
    graphs: { gse: GraphRelease; vocabulary: GraphRelease };
    objectiveKey: Record<string, { nodeId: string; gse: number; skill: string; text: string }>;
    packages: TagExportEntry[];
}

/**
 * Reads one vocabulary graph node.
 * @param node A node of `cefr-vocabulary-knowledge-space.json`.
 * @returns The word (the normalized form) and the part of speech (the last part of the node id), or `undefined` for a node that is not a vocabulary skill.
 */
export function vocabNodeFromGraph(node: { id: string; kind: string; title?: string; metadata?: { normalizedForm?: string } }): VocabNode | undefined {
    if (node.kind !== 'skill' || !node.id.startsWith('english.vocabulary.skill.')) return undefined;
    return { id: node.id, word: node.metadata?.normalizedForm ?? node.title ?? '', pos: node.id.slice(node.id.lastIndexOf('.') + 1) };
}

/**
 * The tag entry for one package.
 * @param pkg A parsed package.
 * @param keyIds The short ids of the objective key.
 * @param vocab The vocabulary graph nodes by id.
 * @returns The entry and the problems (unknown short ids and nodes; an unknown node is left out).
 */
export function tagExportEntry(pkg: LessonPackage, keyIds: Set<string>, vocab: Map<string, VocabNode>): { entry: TagExportEntry; problems: string[] } {
    const where = pkg.meta.key;
    const problems: string[] = [];
    const known = (ids: string[], at: string) => {
        for (const id of ids) if (!keyIds.has(id)) problems.push(`${where}: ${at}objective ${id} is not in the objective key`);
        return ids;
    };
    const articleObjectives = [
        ...known(pkg.tags.targetObjectives, '').map((shortId) => ({ shortId, role: 'target' as const })),
        ...known(pkg.tags.supportingObjectives, '').map((shortId) => ({ shortId, role: 'supporting' as const })),
    ];
    const questions = (['mcq', 'saq', 'laq'] as const).flatMap((type) => pkg.bank[type].map((q) => ({ id: q.id, type, objectives: known(q.objectives, `question ${q.id}: `) })));
    const vocabulary = (
        [
            ['glossed', pkg.tags.glossedNodes],
            ['recycled', pkg.tags.recycledNodes],
        ] as const
    ).flatMap(([role, ids]) =>
        ids.flatMap((nodeId) => {
            const node = vocab.get(nodeId);
            if (!node) {
                problems.push(`${where}: vocabulary node ${nodeId} is not in the vocabulary graph`);
                return [];
            }
            return [{ word: node.word, pos: node.pos, nodeId, role }];
        }),
    );
    const ids = pkg.db.legacy;
    const legacy = ids ? { articleId: ids.articleId, questions: { ...ids.mcq, ...ids.saq, ...ids.laq } } : null;
    const m = pkg.meta;
    return { entry: { key: m.key, book: m.book, lesson: m.lesson, title: m.title, role: m.role, level: m.raLevel, legacy, articleObjectives, vocabulary, questions }, problems };
}

/**
 * The whole tag file.
 * @param pkgs The parsed packages, in the order of the file.
 * @param objectives The objectives of every objective key file.
 * @param vocab The vocabulary graph nodes by id.
 * @param graphs The graph files that the tags were made against.
 * @param generatedAt The run time (ISO).
 * @returns The file content and the problems; a problem means the file is not complete.
 */
export function buildTagExport(
    pkgs: LessonPackage[],
    objectives: KeyObjective[],
    vocab: Map<string, VocabNode>,
    graphs: TagExport['graphs'],
    generatedAt: string,
): { data: TagExport; problems: string[] } {
    const problems: string[] = [];
    const objectiveKey: TagExport['objectiveKey'] = {};
    for (const o of objectives) {
        if (objectiveKey[o.id]) problems.push(`objective ${o.id} is in the objective key two times`);
        objectiveKey[o.id] = { nodeId: o.node, gse: o.gse, skill: o.skill, text: o.text };
    }
    const keyIds = new Set(Object.keys(objectiveKey));
    const packages = pkgs.map((p) => {
        const { entry, problems: more } = tagExportEntry(p, keyIds, vocab);
        problems.push(...more);
        return entry;
    });
    const source = 'Workbooks content/primary packages (dashboard/scripts/export-tags.ts). Short ids: docs/content-plans/data/*-objective-key.json.';
    return { data: { version: 1, generatedAt, source, graphs, objectiveKey, packages }, problems };
}
