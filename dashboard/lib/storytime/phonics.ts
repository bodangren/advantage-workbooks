/**
 * The decodability facts of the Storytime phonics graph v1 (mastery-advantage
 * `english/phonics/phonics-knowledge-space.json`, built by `build-phonics-graph.py`). This is a port of
 * the graph build's word parser (greedy longest match, split digraphs, and the manual parses of
 * irregular words), so that a week check and the graph agree on what a word needs.
 */

/** The 24 consonant phonemes of the graph (the other 20 are vowels). */
const CONSONANTS = new Set([
    'p', 'b', 't', 'd', 'k', 'g', 'm', 'n', 'ng', 'f', 'v', 'th-voiceless', 'th-voiced', 's', 'z', 'sh', 'zh', 'h',
    'ch', 'j', 'l', 'r', 'w', 'y',
]);
const VOWELS = new Set([
    'short-a', 'short-e', 'short-i', 'short-o', 'short-u', 'short-oo', 'schwa', 'long-a', 'long-e', 'long-i', 'long-o',
    'long-oo', 'ow', 'oi', 'ear', 'air', 'ure', 'ar', 'or', 'er',
]);
const SPLIT_LONG: Record<string, string> = { a: 'long-a', i: 'long-i', o: 'long-o', u: 'long-oo' };
/** The graph patterns that teach extra grapheme-phoneme pairs (build-phonics-graph.py). */
const PATTERN_PAIRS: Record<string, [string, string][]> = {
    'open-vowel': [['e', 'long-e'], ['o', 'long-o'], ['y', 'long-i']],
    'plural-s': [['s', 'z']],
};
const INITIAL_CLUSTERS = ['s-blend', 'r-blend', 'l-blend', 'three-letter-blend', 'thai-initial-clusters'];
const FINAL_CLUSTERS = ['final-n-blend', 'final-blend', 'thai-final-clusters-s'];

/**
 * Manual parses of irregular words, copied from `MANUAL_PARSE` in build-phonics-graph.py (graph v1):
 * grapheme or grapheme:phoneme tokens. A pair that is not a GPC of the graph means the word cannot be decoded.
 */
const MANUAL_PARSE: Record<string, string> = {
    a: 'a:schwa', i: 'i:long-i', the: 'th:th-voiced e:schwa', is: 'i s:z', his: 'h i s:z', has: 'h a s:z',
    as: 'a s:z', this: 'th:th-voiced i s', that: 'th:th-voiced a t', them: 'th:th-voiced e m',
    then: 'th:th-voiced e n', they: 'th:th-voiced ey', he: 'h e:long-e', me: 'm e:long-e', we: 'w e:long-e',
    she: 'sh e:long-e', be: 'b e:long-e', my: 'm y:long-i', by: 'b y:long-i', why: 'wh y:long-i',
    go: 'g o:long-o', no: 'n o:long-o', so: 's o:long-o', put: 'p u:short-oo t', look: 'l oo:short-oo k',
    looks: 'l oo:short-oo k s', good: 'g oo:short-oo d', are: 'a:ar r e:silent', were: 'w ere:er',
    of: 'o:short-o f:v', goes: 'g oe:long-o s:z', said: 's ai:short-e d', you: 'y ou:long-oo',
    over: 'o:long-o v er', want: 'w a:short-o n t', does: 'd oe:short-u s:z', have: 'h a:short-a ve:v',
    more: 'm ore:or', some: 's o:short-u m e:silent', come: 'c o:short-u m e:silent',
    loves: 'l o:short-u ve:v s', who: 'wh o:long-oo', how: 'h ow:ow', there: 'th:th-voiced ere:air',
    where: 'wh ere:air', give: 'g i:short-i ve:v', live: 'l i:short-i ve:v', dont: 'd o:long-o-closed n t',
    every: 'e v e:schwa r y:long-e', our: 'ou:ow r', always: 'a:or l w ay:long-a s:z', about: 'a:schwa b ou:ow t',
    what: 'wh a:short-o t', says: 's ay:short-e s:z', comes: 'c o:short-u m e:silent s:z', to: 't o:long-oo',
    do: 'd o:long-oo', old: 'o:long-o-closed l d', color: 'c o:short-u l or:er', children: 'ch i:short-i l d r e:schwa n',
    school: 's ch:k oo:long-oo l', write: 'wr:r i-e:long-i t', into: 'i n t o:long-oo', one: 'o:w n e:silent',
    people: 'p e:long-e o:schwa p l e:silent', find: 'f i:long-i n d', with: 'w i th:th-voiced',
};

/** The facts of the graph that the decodability rule needs. */
export interface PhonicsGraph {
    /** `grapheme|phonemes` (phoneme slugs joined by "-") to the first program week that teaches the pair. */
    pairWeek: Map<string, number>;
    /** The graph graphemes without split digraphs, longest first. */
    graphemes: string[];
    /** A grapheme to the phonemes of its earliest-taught GPC (its default sound). */
    defaultPhonemes: Map<string, string>;
    /** The first program week of an initial and of a final consonant cluster (the blend patterns). */
    clusterWeek: { initial: number; final: number };
}

/** One grapheme of a word with its phonemes. */
export type Pair = [grapheme: string, phonemes: string];

interface GraphNode {
    id: string;
    metadata?: { grapheme?: string; phonemes?: string[]; program_week?: number | null; teaching_order?: number };
}

/**
 * Reads the decodability facts from the graph JSON.
 * @param json The parsed phonics-knowledge-space.json.
 * @returns The facts; throws when the file has no GPC nodes.
 */
export function phonicsGraphFrom(json: unknown): PhonicsGraph {
    const nodes = ((json as { nodes?: GraphNode[] }).nodes ?? []).filter((n) => n.id.startsWith('english.phonics.'));
    const gpcs = nodes.filter((n) => n.id.startsWith('english.phonics.gpc.') && n.metadata?.grapheme && n.metadata.program_week);
    if (!gpcs.length) throw new Error('The phonics graph has no GPC nodes with a grapheme and a program week');
    const pairWeek = new Map<string, number>();
    const setWeek = (key: string, week: number) => pairWeek.set(key, Math.min(week, pairWeek.get(key) ?? Infinity));
    for (const n of gpcs) setWeek(`${n.metadata!.grapheme}|${(n.metadata!.phonemes ?? []).join('-')}`, n.metadata!.program_week!);
    const patternWeek = (slug: string) => nodes.find((n) => n.id === `english.phonics.pattern.${slug}`)?.metadata?.program_week ?? undefined;
    for (const [slug, pairs] of Object.entries(PATTERN_PAIRS)) {
        const week = patternWeek(slug);
        if (week) for (const [g, ph] of pairs) pairWeek.set(`${g}|${ph}`, week);
    }
    const graphemes = [...new Set([...pairWeek.keys()].map((k) => k.split('|')[0]).filter((g) => !g.includes('-')))].sort(
        (a, b) => b.length - a.length || (a < b ? -1 : a > b ? 1 : 0),
    );
    const defaultPhonemes = new Map<string, string>();
    for (const n of [...gpcs].sort((a, b) => (a.metadata!.teaching_order ?? 0) - (b.metadata!.teaching_order ?? 0))) {
        if (!defaultPhonemes.has(n.metadata!.grapheme!)) defaultPhonemes.set(n.metadata!.grapheme!, (n.metadata!.phonemes ?? []).join('-'));
    }
    const first = (slugs: string[]) => Math.min(...slugs.map((s) => patternWeek(s) ?? Infinity));
    return { pairWeek, graphemes, defaultPhonemes, clusterWeek: { initial: first(INITIAL_CLUSTERS), final: first(FINAL_CLUSTERS) } };
}

/**
 * Parses a word into graphemes with their phonemes: the manual table for irregular words, else a
 * split digraph at the end (make: a-e) and the greedy longest match with the default sounds.
 * @param word The word (case and apostrophes do not count).
 * @param graph The graph facts.
 * @returns The pairs; an unknown letter gives the phonemes "?".
 */
export function parseWord(word: string, graph: PhonicsGraph): Pair[] {
    let w = word.toLowerCase().replace(/'/g, '');
    const def = (g: string) => graph.defaultPhonemes.get(g) ?? '?';
    const manual = MANUAL_PARSE[w];
    if (manual) return manual.split(' ').map((t) => (t.includes(':') ? (t.split(':') as Pair) : [t, def(t)]));
    let tail: Pair[] = [];
    const m = /([aiou])([^aeiou])e$/.exec(w);
    if (m && w.length > 3) {
        tail = [[`${m[1]}-e`, SPLIT_LONG[m[1]]], [m[2], def(m[2])]];
        w = w.slice(0, m.index);
    }
    const out: Pair[] = [];
    for (let i = 0; i < w.length; ) {
        const g = graph.graphemes.find((x) => w.startsWith(x, i));
        if (!g) return [[w[i], '?']];
        out.push([g, def(g)]);
        i += g.length;
    }
    return [...out, ...tail];
}

/**
 * A vowel ("v"), a consonant ("c"), or neither ("": a silent e, an unknown letter). "k-s" (x) and
 * "k-w" (qu) are one consonant grapheme; "long-o-closed" (old, don't) is a vowel.
 */
function soundKind(phonemes: string): 'v' | 'c' | '' {
    if (VOWELS.has(phonemes) || /^(short|long)-/.test(phonemes)) return 'v';
    if (CONSONANTS.has(phonemes)) return 'c';
    const parts = phonemes.split('-');
    return parts.length > 1 && parts.every((p) => CONSONANTS.has(p)) ? 'c' : '';
}

/** Why a word is not decodable yet: the first untaught grapheme, or a consonant cluster. */
export interface WordNeed {
    /** The first program week at which the word is decodable, or null when the graph cannot decode it. */
    week: number | null;
    /** The first untaught grapheme at the given week, "cluster", or "" when the word is decodable. */
    missing: string;
}

/**
 * The first program week at which the taught GPCs decode a word. Storytime (2026-10-22): Level 2 has
 * CVC words only, so a word with two or more consonant graphemes before its first vowel needs the first
 * initial-blend pattern week, and two or more after its last vowel need the first final-cluster week.
 * @param word The word.
 * @param graph The graph facts.
 * @param atWeek The program week of the book, for the `missing` grapheme.
 * @returns The week (null when a pair is not in the graph) and what is missing at `atWeek`.
 */
export function wordNeed(word: string, graph: PhonicsGraph, atWeek: number): WordNeed {
    const pairs = parseWord(word, graph);
    const weeks = pairs.map(([g, ph]) => graph.pairWeek.get(`${g}|${ph}`));
    const kinds = pairs.map(([, ph]) => soundKind(ph));
    const firstVowel = kinds.indexOf('v');
    const lastVowel = kinds.lastIndexOf('v');
    const onset = firstVowel < 0 ? 0 : kinds.slice(0, firstVowel).filter((k) => k === 'c').length;
    const coda = lastVowel < 0 ? 0 : kinds.slice(lastVowel + 1).filter((k) => k === 'c').length;
    const needs = [...weeks, onset > 1 ? graph.clusterWeek.initial : 0, coda > 1 ? graph.clusterWeek.final : 0];
    const week = needs.some((x) => x === undefined || x === Infinity) ? null : Math.max(...(needs as number[]));
    const untaught = pairs.findIndex((_, i) => weeks[i] === undefined || weeks[i]! > atWeek);
    const missing =
        untaught >= 0 ? pairs[untaught][0] : (onset > 1 && graph.clusterWeek.initial > atWeek) || (coda > 1 && graph.clusterWeek.final > atWeek) ? 'cluster' : '';
    return { week, missing };
}

/**
 * The program week of a Storytime week: Level 1 week 1 is 1, Level 2 week 1 is 33.
 * @param level The level.
 * @param week The week of the level.
 * @returns The program week.
 */
export function programWeek(level: number, week: number): number {
    return (level - 1) * 32 + week;
}
