import fs from 'fs';
import { lemmaCandidates, tokenize } from './text';

/** Cambridge YLE level of a word. "Key/PET" means the word is above Flyers. */
export type YleLevel = 'Starters' | 'Movers' | 'Flyers' | 'Key/PET';

/** Lower rank means an easier level. */
export const LEVEL_RANK: Record<YleLevel, number> = { Starters: 0, Movers: 1, Flyers: 2, 'Key/PET': 3 };

/** The fields the lint reads from a node of the Mastery Advantage vocabulary graph. */
export interface GraphNode {
    id: string;
    kind: string;
    metadata: { normalizedForm?: string; matchForms?: string[]; examAlignments?: string[] };
}

/** Word lookups against the vocabulary graph. */
export interface VocabularyIndex {
    /** The lowest YLE level of any node with this form (a word or a phrase), or undefined. */
    levelOf(form: string): YleLevel | undefined;
    /** Every form that shares a node with this form ("foot" → foot, feet), including the form. */
    siblingsOf(form: string): Set<string>;
    /** The first lemma candidate of a token that the graph holds, else the lower-case token. */
    lemmaOf(token: string): string;
    /** Multiword forms as token lists, for example ["in", "front", "of"]. */
    phrases: string[][];
}

/**
 * Number words one to twenty. They are on the Cambridge Starters list, but the graph holds
 * only "one" (Origins 3.2 plan, task M1), so the index adds them.
 */
export const NUMBER_WORDS = [
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

/**
 * Maps a node's exam alignments to its lowest YLE level.
 * @param exams Values such as "pre-a1-starters" or "a2-key-for-schools".
 * @returns The level; "Key/PET" when no YLE exam is listed.
 */
export function levelFromExams(exams: string[]): YleLevel {
    if (exams.includes('pre-a1-starters')) return 'Starters';
    if (exams.includes('a1-movers')) return 'Movers';
    if (exams.includes('a2-flyers')) return 'Flyers';
    return 'Key/PET';
}

/**
 * Expands one raw graph form into plain lower-case forms: removes brackets and "!", splits
 * " / " alternatives, and expands slashed words ("foot/feet" → foot, feet;
 * "take a photo/picture" → take a photo, take a picture).
 * @param raw A normalizedForm or matchForms value.
 * @returns Zero or more clean forms.
 */
export function expandForm(raw: string): string[] {
    const cleaned = raw.toLowerCase().replace(/[()!?]/g, '').replace(/\s+/g, ' ').trim();
    if (!cleaned || cleaned.includes('...')) return [];
    const out: string[] = [];
    for (const alt of cleaned.split(' / ')) {
        let variants = [''];
        for (const word of alt.trim().split(' ')) {
            const options = word.split('/').filter(Boolean);
            variants = variants.flatMap((v) => options.map((o) => (v ? `${v} ${o}` : o)));
        }
        out.push(...variants.map((v) => v.trim()).filter(Boolean));
    }
    return out;
}

/**
 * Builds the lookup index from the vocabulary graph JSON.
 * @param graph The parsed graph with its nodes; only nodes of kind "skill" are used.
 * @returns The index.
 */
export function buildVocabularyIndex(graph: { nodes: GraphNode[] }): VocabularyIndex {
    const levels = new Map<string, YleLevel>();
    const siblings = new Map<string, Set<string>>();
    const setLevel = (form: string, level: YleLevel) => {
        const old = levels.get(form);
        if (!old || LEVEL_RANK[level] < LEVEL_RANK[old]) levels.set(form, level);
    };

    for (const node of graph.nodes) {
        if (node.kind !== 'skill') continue;
        const md = node.metadata ?? {};
        const forms = new Set(
            [md.normalizedForm ?? '', ...(md.matchForms ?? [])].flatMap(expandForm),
        );
        const level = levelFromExams(md.examAlignments ?? []);
        for (const f of forms) {
            setLevel(f, level);
            const s = siblings.get(f) ?? new Set<string>();
            forms.forEach((x) => s.add(x));
            siblings.set(f, s);
        }
    }
    for (const n of NUMBER_WORDS) setLevel(n, 'Starters');

    const phrases = [...levels.keys()].filter((f) => f.includes(' ')).map((f) => tokenize(f).map((t) => t.toLowerCase()));

    return {
        levelOf: (form) => levels.get(form.toLowerCase().trim()),
        siblingsOf: (form) => {
            const f = form.toLowerCase().trim();
            return new Set([f, ...(siblings.get(f) ?? [])]);
        },
        lemmaOf: (token) => lemmaCandidates(token).find((c) => levels.has(c)) ?? token.toLowerCase(),
        phrases,
    };
}

/**
 * Reads the graph file and builds the index.
 * @param file Path to cefr-vocabulary-knowledge-space.json.
 * @returns The index.
 */
export function loadVocabularyIndex(file: string): VocabularyIndex {
    return buildVocabularyIndex(JSON.parse(fs.readFileSync(file, 'utf-8')));
}
