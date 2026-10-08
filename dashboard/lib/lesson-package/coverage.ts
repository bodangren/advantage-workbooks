import type { LessonPackage } from './schema';
import { BOOK_ORDER } from './files';

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
    title?: string;
    metadata?: { normalizedForm?: string; examAlignments?: string[] };
}

const YLE_LISTS = new Set(['pre-a1-starters', 'a1-movers', 'a2-flyers']);
/** Capitalized YLE headwords that are not people's names. */
const NOT_NAMES = new Set(['english', 'london', 'ok', 'tv/television']);
/**
 * Words that the program does not teach (Daniel, 2026-10-06: "no CD/DVD (not used anymore)"). Daniel,
 * 2026-10-08 (option 1 of docs/content-plans/level-plans/a2-key-gap.md): the series uses US English
 * in Thailand, so the British-only forms and the UK money, titles, and symbols of A2 Key are out too.
 */
const NOT_TAUGHT = new Set([
    'cd',
    'dvd',
    'cd player',
    'dvd player',
    // British-only forms (group C)
    'aeroplane',
    'cheque',
    'city centre',
    'guest-house',
    'harbour',
    'have got to',
    'headteacher',
    'neighbour',
    'penfriend',
    'petrol',
    'petrol station',
    'roundabout',
    'shopping centre',
    'sports centre',
    'till',
    'tights',
    'tourist information centre',
    'trainer',
    'underground',
    'washing-up',
    // UK money, titles, and symbols (group D)
    'at / @',
    'dr',
    'euro',
    'mr',
    'mrs',
    'ms',
    'pc',
    'pence',
    'penny',
    'pound',
    'v',
]);

/**
 * Whether a node is out of the list goals: a person's name (a capitalized headword on the YLE lists
 * only; Daniel, 2026-10-06: names are not in the Movers goal) or a word that the program does not teach.
 * @param n A graph node.
 * @returns True when the list coverage leaves the node out.
 */
export function outOfGoal(n: ListNode): boolean {
    const word = (n.metadata?.normalizedForm ?? '').toLowerCase();
    if (NOT_TAUGHT.has(word)) return true;
    const exams = n.metadata?.examAlignments ?? [];
    return /^[A-Z]/.test(n.title ?? '') && exams.length > 0 && exams.every((e) => YLE_LISTS.has(e)) && !NOT_NAMES.has(word);
}

/**
 * The words of each exam list and the word of each node.
 * @param nodes The nodes of the vocabulary graph.
 * @returns The words whose lowest list is the exam (nodes with one normalized form are one word, and a word has the lowest list of its nodes; names and words out of the goal are left out), and the word of each node id.
 */
export function wordLists(nodes: ListNode[]): { lists: Map<string, Set<string>>; wordOf: Map<string, string> } {
    const wordOf = new Map<string, string>();
    const best = new Map<string, number>();
    for (const n of nodes) {
        const word = n.metadata?.normalizedForm;
        if (n.kind !== 'skill' || !n.id.startsWith('english.vocabulary.skill.') || !word) continue;
        wordOf.set(n.id, word);
        if (outOfGoal(n)) continue;
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

/** A package, reduced to the parts that the recycling count needs. */
export interface CurriculumEntry {
    book: string;
    lesson: string;
    number: number;
    level: number;
    /** The objectives that the package teaches (tags.targetObjectives). */
    targets: string[];
    /** The objectives that the package practices (tags.supportingObjectives). */
    supporting: string[];
}

/** The place of an objective in the curriculum: the package that teaches it first. */
export interface FirstTeaching {
    book: string;
    lesson: string;
    level: number;
}

/** The recycling of one objective. */
export interface RecyclingRow {
    id: string;
    text: string;
    first: FirstTeaching | null;
    /** The count of packages after the first teaching where the objective is available. */
    practiceAfter: number;
    /** The count of packages where the objective is available, per level. */
    perLevel: Record<number, number>;
}

/** The workbook books in curriculum order. Origins 2 has no entry in `BOOK_ORDER`, so it goes after Origins 1. */
const WORKBOOK_ORDER = ['origins-1', 'origins-2', ...BOOK_ORDER.filter((b) => b !== 'origins-1')];

/** The sort key of a book inside its level: the workbook books first, then the bank. */
function bookRank(book: string): number {
    if (book.startsWith('bank-')) return WORKBOOK_ORDER.length;
    const at = WORKBOOK_ORDER.indexOf(book);
    return at < 0 ? WORKBOOK_ORDER.length - 1 : at;
}

/**
 * The entry of a package.
 * @param pkg The lesson package.
 * @returns The book, the lesson, the level (meta.raLevel), and the target and supporting objectives.
 */
export function toCurriculumEntry(pkg: LessonPackage): CurriculumEntry {
    return { book: pkg.meta.book, lesson: pkg.meta.lesson, number: pkg.meta.number, level: pkg.meta.raLevel, targets: pkg.tags.targetObjectives, supporting: pkg.tags.supportingObjectives };
}

/**
 * Sort the packages into curriculum order.
 * @param entries The packages, in any order.
 * @returns A new array: by level, then the workbook books in book order, then the bank of the level; each book in lesson-number order.
 */
export function curriculumOrder(entries: CurriculumEntry[]): CurriculumEntry[] {
    return [...entries].sort((a, b) => a.level - b.level || bookRank(a.book) - bookRank(b.book) || a.book.localeCompare(b.book) || a.number - b.number);
}

/**
 * Whether an objective is available in a package.
 * @param entry The package.
 * @param id The objective id.
 * @returns True when the objective is a target or a supporting objective of the package.
 */
export function isAvailable(entry: CurriculumEntry, id: string): boolean {
    return entry.targets.includes(id) || entry.supporting.includes(id);
}

/**
 * The first teaching, the practice after it, and the availability per level of each objective.
 * @param ordered The packages in curriculum order (see `curriculumOrder`).
 * @returns One row per objective that at least one package lists. The text is empty: the caller adds it.
 */
export function recycling(ordered: CurriculumEntry[]): Map<string, RecyclingRow> {
    const rows = new Map<string, RecyclingRow>();
    const row = (id: string): RecyclingRow => {
        let r = rows.get(id);
        if (!r) rows.set(id, (r = { id, text: '', first: null, practiceAfter: 0, perLevel: {} }));
        return r;
    };
    for (const e of ordered) {
        for (const id of new Set([...e.targets, ...e.supporting])) {
            const r = row(id);
            r.perLevel[e.level] = (r.perLevel[e.level] ?? 0) + 1;
            if (r.first) r.practiceAfter += 1;
            else if (e.targets.includes(id)) r.first = { book: e.book, lesson: e.lesson, level: e.level };
        }
    }
    return rows;
}

/** The minimum practice after the first teaching. */
export const MIN_PRACTICE_AFTER = 3;

/**
 * The recycling rows of a list of objectives.
 * @param ordered The packages in curriculum order.
 * @param objectives The objectives to report, in report order.
 * @returns One row for each objective, with the text. An objective that no package teaches has no first teaching and 0 practice after.
 */
export function recyclingRows(ordered: CurriculumEntry[], objectives: CoverageObjective[]): RecyclingRow[] {
    const all = recycling(ordered);
    return objectives.map((o) => {
        const r = all.get(o.id);
        return { id: o.id, text: o.text, first: r?.first ?? null, practiceAfter: r?.first ? r.practiceAfter : 0, perLevel: r?.perLevel ?? {} };
    });
}

/**
 * Whether a row needs a warning.
 * @param row The recycling row.
 * @param bandComplete True when the last book folder of the band exists.
 * @returns True when the practice after is below the minimum and the band is complete.
 */
export function needsPractice(row: RecyclingRow, bandComplete: boolean): boolean {
    return bandComplete && row.practiceAfter < MIN_PRACTICE_AFTER;
}

/**
 * The summary of the rows of a band.
 * @param rows The recycling rows of the band.
 * @returns The count of objectives that a package teaches, and the count with the minimum practice after.
 */
export function recyclingSummary(rows: RecyclingRow[]): { taught: number; practiced: number; total: number } {
    return { taught: rows.filter((r) => r.first).length, practiced: rows.filter((r) => r.first && r.practiceAfter >= MIN_PRACTICE_AFTER).length, total: rows.length };
}

/**
 * The lists for the lesson map of a book.
 * @param entries The packages, in any order.
 * @param book The book folder.
 * @param level The level of the book.
 * @param lead The objectives that the plan gives the book to teach first.
 * @param band The in-scope objectives of the band of the book.
 * @returns `teach`: the lead objectives with their text. `candidates`: the band objectives that the packages before the book teach, without the lead, with the lowest practice after first. Only the packages before the book count.
 */
export function nextBookLists(entries: CurriculumEntry[], book: string, level: number, lead: string[], band: CoverageObjective[]): { teach: CoverageObjective[]; candidates: RecyclingRow[] } {
    const key = (e: { level: number; book: string }) => [e.level, bookRank(e.book)];
    const [bl, br] = key({ level, book });
    const before = curriculumOrder(entries).filter((e) => e.book !== book && (e.level < bl || (e.level === bl && bookRank(e.book) < br)));
    const text = new Map(band.map((o) => [o.id, o.text]));
    const teach = lead.map((id) => ({ id, gse: band.find((o) => o.id === id)?.gse ?? 0, text: text.get(id) ?? '' }));
    const inLead = new Set(lead);
    const candidates = recyclingRows(before, band.filter((o) => !inLead.has(o.id)))
        .filter((r) => r.first)
        .sort((a, b) => a.practiceAfter - b.practiceAfter);
    return { teach, candidates };
}
