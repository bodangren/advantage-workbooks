import type { LessonPackage } from './schema';

/**
 * Pure functions of the coverage report for levels 5-9 (`scripts/level-coverage.ts --levels 5-9`).
 * The script reads the files; this module counts.
 */

/** The exam lists, from the lowest to the highest. A word belongs to the first list that holds it. */
export const EXAM_ORDER = ['pre-a1-starters', 'a1-movers', 'a2-flyers', 'a2-key-for-schools', 'b1-preliminary-for-schools'] as const;

/** The lists that have a goal, with the level at the end of which the goal must be met. */
export const LIST_GOALS: { exam: string; label: string; share: number; byLevel: number }[] = [
    { exam: 'a1-movers', label: 'Movers', share: 1, byLevel: 6 },
    { exam: 'a2-flyers', label: 'Flyers', share: 0.95, byLevel: 8 },
    { exam: 'a2-key-for-schools', label: 'A2 Key', share: 0.9, byLevel: 9 },
];

/** An objective of an objective key file, with the parts that the report needs. */
export interface CoverageObjective {
    id: string;
    gse: number;
    text: string;
}

/** The counts of one objective inside one level. */
export interface ObjectiveRow {
    id: string;
    text: string;
    target: number;
    supporting: number;
    questions: number;
}

/**
 * The counts of every in-scope objective of a level.
 * @param pkgs The packages of the level.
 * @param objectives Every objective of the objective keys.
 * @param gse The first and the last GSE value of the level.
 * @param outOfScope The ids that the level does not teach.
 * @param min The number of packages as target that an objective needs.
 * @returns One row per in-scope objective, in key order, and the rows that are under the minimum.
 */
export function levelCoverage(pkgs: LessonPackage[], objectives: CoverageObjective[], gse: [number, number], outOfScope: Set<string>, min: number): { rows: ObjectiveRow[]; gaps: ObjectiveRow[] } {
    const target = new Map<string, number>();
    const supporting = new Map<string, number>();
    const questions = new Map<string, number>();
    for (const p of pkgs) {
        for (const id of new Set(p.tags.targetObjectives)) target.set(id, (target.get(id) ?? 0) + 1);
        for (const id of new Set(p.tags.supportingObjectives)) supporting.set(id, (supporting.get(id) ?? 0) + 1);
        for (const q of [...p.bank.mcq, ...p.bank.saq, ...p.bank.laq]) for (const id of q.objectives) questions.set(id, (questions.get(id) ?? 0) + 1);
    }
    const rows = objectives
        .filter((o) => o.gse >= gse[0] && o.gse <= gse[1] && !outOfScope.has(o.id))
        .map((o) => ({ id: o.id, text: o.text, target: target.get(o.id) ?? 0, supporting: supporting.get(o.id) ?? 0, questions: questions.get(o.id) ?? 0 }));
    return { rows, gaps: rows.filter((r) => r.target < min) };
}

/**
 * The book rule: each objective that the plan gives a book is a target in its number of the book's lessons.
 * @param pkgs The packages of the book folder.
 * @param lead The objectives that the plan gives the book.
 * @param lessons The minimum number of lessons for each objective (default 1).
 * @returns The count of objectives, the count that meet their number, and the ids that do not.
 */
export function bookCoverage(pkgs: LessonPackage[], lead: string[], lessons: Record<string, number> = {}): { total: number; covered: number; gaps: string[] } {
    const count = new Map<string, number>();
    for (const p of pkgs) for (const id of new Set(p.tags.targetObjectives)) count.set(id, (count.get(id) ?? 0) + 1);
    const gaps = lead.filter((id) => (count.get(id) ?? 0) < (lessons[id] ?? 1));
    return { total: lead.length, covered: lead.length - gaps.length, gaps };
}

/**
 * The lowest exam list of a word.
 * @param examAlignments The `metadata.examAlignments` of a graph node.
 * @returns The first list of `EXAM_ORDER` that the node has, or `undefined` when it has none of them.
 */
export function lowestList(examAlignments: string[] | undefined): string | undefined {
    return EXAM_ORDER.find((e) => examAlignments?.includes(e));
}

/** A vocabulary graph node, with the parts that the list coverage needs. */
export interface ListNode {
    id: string;
    kind: string;
    metadata?: { normalizedForm?: string; examAlignments?: string[] };
}

/**
 * The words of each exam list and the word of each node.
 * @param nodes The nodes of the vocabulary graph.
 * @returns The words whose lowest list is the exam (nodes with one normalized form are one word, and a word has the lowest list of its nodes), and the word of each node id.
 */
export function wordLists(nodes: ListNode[]): { lists: Map<string, Set<string>>; wordOf: Map<string, string> } {
    const wordOf = new Map<string, string>();
    const best = new Map<string, number>();
    for (const n of nodes) {
        const word = n.metadata?.normalizedForm;
        if (n.kind !== 'skill' || !n.id.startsWith('english.vocabulary.skill.') || !word) continue;
        wordOf.set(n.id, word);
        const low = lowestList(n.metadata?.examAlignments);
        const rank = low ? EXAM_ORDER.indexOf(low as (typeof EXAM_ORDER)[number]) : EXAM_ORDER.length;
        best.set(word, Math.min(best.get(word) ?? EXAM_ORDER.length, rank));
    }
    const lists = new Map<string, Set<string>>(EXAM_ORDER.map((e) => [e, new Set<string>()]));
    for (const [word, rank] of best) if (rank < EXAM_ORDER.length) lists.get(EXAM_ORDER[rank])!.add(word);
    return { lists, wordOf };
}

/**
 * How many words of a list the packages gloss.
 * @param pkgs The packages (cumulative over the levels).
 * @param list The words of the list.
 * @param wordOf The word of each node id.
 * @returns The count of list words that at least one package glosses.
 */
export function glossedOnList(pkgs: LessonPackage[], list: Set<string>, wordOf: Map<string, string>): number {
    const glossed = new Set<string>();
    for (const p of pkgs) for (const id of p.tags.glossedNodes) {
        const w = wordOf.get(id);
        if (w && list.has(w)) glossed.add(w);
    }
    return glossed.size;
}

/**
 * Whether a list reaches its goal.
 * @param count The words of the list that are glossed.
 * @param total The words of the list.
 * @param share The share of the list that the goal needs (0 to 1).
 * @returns True when the count is the share of the total or more.
 */
export function goalMet(count: number, total: number, share: number): boolean {
    return count >= Math.ceil(total * share - 1e-9);
}
