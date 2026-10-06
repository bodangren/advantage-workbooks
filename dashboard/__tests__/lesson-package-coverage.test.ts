// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { fixturePackage } from './fixtures/lesson-package-fixture';
import { bookCoverage, glossedOnList, goalMet, levelCoverage, lowestList, wordLists } from '../lib/lesson-package/coverage';

function pkg(target: string[], supporting: string[] = [], glossed: string[] = []): LessonPackage {
    const p = LessonPackageSchema.parse(fixturePackage());
    p.tags.targetObjectives = target;
    p.tags.supportingObjectives = supporting;
    p.tags.glossedNodes = glossed;
    for (const q of [...p.bank.mcq, ...p.bank.saq, ...p.bank.laq]) q.objectives = [];
    p.bank.mcq[0].objectives = ['R24.2'];
    return p;
}

const OBJ = [
    { id: 'R24.2', gse: 24, text: 'a' },
    { id: 'R24.3', gse: 25, text: 'b' },
    { id: 'R24.1', gse: 24, text: 'out' },
    { id: 'R30.1', gse: 30, text: 'other level' },
];

describe('level rule', () => {
    it('lists the in-scope objectives of the range and flags those under the minimum', () => {
        const pkgs = [pkg(['R24.2']), pkg(['R24.2']), pkg(['R24.2', 'R24.3'], ['R24.3'])];
        const { rows, gaps } = levelCoverage(pkgs, OBJ, [24, 26], new Set(['R24.1']), 3);
        expect(rows.map((r) => r.id)).toEqual(['R24.2', 'R24.3']);
        expect(rows[0]).toMatchObject({ target: 3, questions: 3 });
        expect(rows[1]).toMatchObject({ target: 1, supporting: 1, questions: 0 });
        expect(gaps.map((g) => g.id)).toEqual(['R24.3']);
    });
    it('counts a package one time for one objective', () => {
        const { rows } = levelCoverage([pkg(['R24.2', 'R24.2'])], OBJ, [24, 26], new Set(), 1);
        expect(rows.find((r) => r.id === 'R24.2')!.target).toBe(1);
    });
});

describe('book rule', () => {
    it('reports the lead objectives that no lesson targets', () => {
        expect(bookCoverage([pkg(['R24.2']), pkg(['R24.3'])], ['R24.2', 'R24.3', 'L24.1'])).toEqual({ total: 3, covered: 2, gaps: ['L24.1'] });
    });
    it('reports every objective as a gap for a book with no package', () => {
        expect(bookCoverage([], ['R24.2'])).toEqual({ total: 1, covered: 0, gaps: ['R24.2'] });
    });

    it('asks for the given number of lessons for an objective (the last book of a band)', () => {
        const lessons = { 'R29.2': 2 };
        expect(bookCoverage([pkg(['R29.2'])], ['R29.2'], lessons)).toEqual({ total: 1, covered: 0, gaps: ['R29.2'] });
        expect(bookCoverage([pkg(['R29.2']), pkg(['R29.2', 'L29.1'])], ['R29.2', 'L29.1'], lessons)).toEqual({ total: 2, covered: 2, gaps: [] });
    });
});

const node = (id: string, form: string, exams: string[]) => ({ id: `english.vocabulary.skill.${id}`, kind: 'skill', metadata: { normalizedForm: form, examAlignments: exams } });

describe('list coverage', () => {
    it('takes the first list of the order as the lowest list', () => {
        expect(lowestList(['a2-flyers', 'a1-movers'])).toBe('a1-movers');
        expect(lowestList(['other'])).toBeUndefined();
        expect(lowestList(undefined)).toBeUndefined();
    });
    const nodes = [
        node('run.verb', 'run', ['a2-flyers', 'a1-movers']),
        node('run.noun', 'run', ['a2-flyers']),
        node('bag.noun', 'bag', ['a1-movers']),
        node('cat.noun', 'cat', ['pre-a1-starters']),
        node('word.noun', 'word', ['a2-key-for-schools']),
        { id: 'english.gse.skill.x', kind: 'skill', metadata: { normalizedForm: 'x', examAlignments: ['a1-movers'] } },
    ];
    it('groups the nodes by normalized form and uses the lowest list', () => {
        const { lists, wordOf } = wordLists(nodes);
        expect([...lists.get('a1-movers')!].sort()).toEqual(['bag', 'run']);
        expect(lists.get('a2-flyers')!.size).toBe(0);
        expect([...lists.get('a2-key-for-schools')!]).toEqual(['word']);
        expect(wordOf.get('english.vocabulary.skill.run.noun')).toBe('run');
        expect(wordOf.has('english.gse.skill.x')).toBe(false);
    });
    it('counts the list words that the packages gloss, each one time', () => {
        const { lists, wordOf } = wordLists(nodes);
        const pkgs = [pkg([], [], ['english.vocabulary.skill.run.noun', 'english.vocabulary.skill.cat.noun']), pkg([], [], ['english.vocabulary.skill.run.verb'])];
        expect(glossedOnList(pkgs, lists.get('a1-movers')!, wordOf)).toBe(1);
    });
    it('compares a count with a goal share', () => {
        expect(goalMet(95, 100, 0.95)).toBe(true);
        expect(goalMet(94, 100, 0.95)).toBe(false);
        expect(goalMet(10, 10, 1)).toBe(true);
    });
});
