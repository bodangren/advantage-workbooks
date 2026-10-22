// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { checkStorytimeWeek, decodability } from '../lib/storytime/checks';
import { parseWord, phonicsGraphFrom, programWeek, wordNeed } from '../lib/storytime/phonics';
import { fixtureWeek } from './fixtures/storytime-week-fixture';

/** A small graph in the shape of phonics-knowledge-space.json: GPC nodes and pattern nodes. */
function miniGraph() {
    const gpc = (grapheme: string, phonemes: string[], week: number, order: number) => ({
        id: `english.phonics.gpc.${grapheme}-${phonemes.join('-')}`,
        metadata: { grapheme, phonemes, program_week: week, teaching_order: order },
    });
    const pattern = (slug: string, week: number) => ({ id: `english.phonics.pattern.${slug}`, metadata: { program_week: week } });
    return {
        nodes: [
            gpc('n', ['n'], 33, 1),
            gpc('a', ['short-a'], 34, 2),
            gpc('p', ['p'], 35, 3),
            gpc('m', ['m'], 36, 4),
            gpc('s', ['s'], 37, 5),
            gpc('i', ['short-i'], 38, 6),
            gpc('sh', ['sh'], 40, 7),
            gpc('th', ['th-voiced'], 50, 8),
            gpc('a-e', ['long-a'], 60, 9),
            gpc('a', ['schwa'], 61, 10),
            pattern('plural-s', 45),
            pattern('s-blend', 74),
            pattern('final-blend', 77),
            { id: 'english.other.node', metadata: { grapheme: 'x', phonemes: ['k-s'], program_week: 1 } },
        ],
    };
}

describe('storytime phonics graph', () => {
    const graph = phonicsGraphFrom(miniGraph());

    it('reads the pair weeks, the default sounds, the pattern pairs, and the cluster weeks', () => {
        expect(graph.pairWeek.get('a|short-a')).toBe(34);
        expect(graph.pairWeek.get('s|z')).toBe(45);
        expect(graph.defaultPhonemes.get('a')).toBe('short-a');
        expect(graph.graphemes[0]).toBe('sh');
        expect(graph.graphemes).not.toContain('a-e');
        expect(graph.graphemes).not.toContain('x');
        expect(graph.clusterWeek).toEqual({ initial: 74, final: 77 });
        expect(() => phonicsGraphFrom({ nodes: [] })).toThrow(/no GPC nodes/);
    });

    it('parses by the longest match, a split digraph at the end, and the manual table', () => {
        expect(parseWord('Ship', graph)).toEqual([['sh', 'sh'], ['i', 'short-i'], ['p', 'p']]);
        expect(parseWord('nape', graph)).toEqual([['n', 'n'], ['a-e', 'long-a'], ['p', 'p']]);
        expect(parseWord('is', graph)).toEqual([['i', 'short-i'], ['s', 'z']]);
        expect(parseWord('a', graph)).toEqual([['a', 'schwa']]);
        expect(parseWord('nab', graph)).toEqual([['b', '?']]);
    });

    it('gives the first week that decodes a word, and what is missing at the book week', () => {
        expect(wordNeed('nap', graph, 35)).toEqual({ week: 35, missing: '' });
        expect(wordNeed('nap', graph, 34)).toEqual({ week: 35, missing: 'p' });
        expect(wordNeed('Sam', graph, 40)).toEqual({ week: 37, missing: '' });
        expect(wordNeed('is', graph, 40)).toEqual({ week: 45, missing: 's' });
        expect(wordNeed('nab', graph, 40)).toEqual({ week: null, missing: 'b' });
    });

    it('needs the blend weeks for two consonants before the first vowel or after the last vowel', () => {
        expect(wordNeed('snap', graph, 40)).toEqual({ week: 74, missing: 'cluster' });
        expect(wordNeed('naps', graph, 40)).toEqual({ week: 77, missing: 'cluster' });
        expect(wordNeed('snap', graph, 74)).toEqual({ week: 74, missing: '' });
        expect(wordNeed('ship', graph, 40)).toEqual({ week: 40, missing: '' });
    });

    it('numbers the program weeks from Level 1 week 1', () => {
        expect(programWeek(1, 1)).toBe(1);
        expect(programWeek(2, 1)).toBe(33);
        expect(programWeek(3, 2)).toBe(66);
    });

    it('checks a decodable with the graph and names the missing grapheme or cluster', () => {
        const taught = { graphemes: [], tricky: ['can', 'I'], programWeek: 37 };
        const d = decodability('Sam can nap. Snap! I am Pam.', taught, ['Sam'], graph);
        expect(d).toMatchObject({ running: 7, decodable: 4, tricky: 2, names: [], untaught: ['Snap (cluster)'] });
        // A week earlier, s is not taught: the name is listed, and the word names its first untaught grapheme.
        expect(decodability('Sam sap.', { ...taught, programWeek: 36 }, ['Sam'], graph)).toMatchObject({ names: ['Sam'], untaught: ['sap (s)'] });
        // Without a program week, the letter spelling counts.
        expect(decodability('nap', { graphemes: ['n', 'a'], tricky: [] }, [], graph).untaught).toEqual(['nap']);

        const week = fixtureWeek();
        week.books![1] = { kind: 'decodable', title: 'Pam', pages: ['Pam can nap.', 'Can I nap?', 'I can nap!'].map((text) => ({ text })) };
        const report = checkStorytimeWeek(week, taught, graph);
        expect(report.checks.find((c) => c.id === 'decodable')).toMatchObject({
            status: 'pass',
            label: expect.stringContaining('phonics graph, program week 37'),
        });
        const letters = checkStorytimeWeek(week, { graphemes: ['n', 'a', 'p', 'm'], tricky: ['can', 'I'] });
        expect(letters.checks.find((c) => c.id === 'decodable')?.label).toContain('letter spelling: no phonics graph');
    });
});
