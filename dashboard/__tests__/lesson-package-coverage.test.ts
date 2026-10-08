// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { fixturePackage } from './fixtures/lesson-package-fixture';
import { bookCoverage, curriculumOrder, glossedOnList, goalMet, levelCoverage, lowestList, needsPractice, nextBookLists, recycling, recyclingRows, recyclingSummary, wordLists, type CurriculumEntry } from '../lib/lesson-package/coverage';

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
    it('leaves people\'s names and the words that the program does not teach out of the lists', () => {
        const t = (id: string, title: string, form: string, exams: string[]) => ({ id: `english.vocabulary.skill.${id}`, kind: 'skill', title, metadata: { normalizedForm: form, examAlignments: exams } });
        const { lists, wordOf } = wordLists([
            t('charlie.noun', 'Charlie', 'charlie', ['a1-movers']),
            t('monday.noun', 'Monday', 'monday', ['a1-movers', 'a2-key-for-schools']),
            t('english.noun', 'English', 'english', ['pre-a1-starters']),
            t('bill.noun', 'Bill', 'bill', ['pre-a1-starters', 'a2-key-for-schools']),
            t('cd.noun', 'CD', 'cd', ['a1-movers', 'a2-key-for-schools']),
            t('dvd-player.noun', 'DVD player', 'dvd player', ['a1-movers']),
        ]);
        expect([...lists.get('a1-movers')!].sort()).toEqual(['monday']);
        expect([...lists.get('pre-a1-starters')!].sort()).toEqual(['bill', 'english']);
        expect(wordOf.get('english.vocabulary.skill.charlie.noun')).toBe('charlie');
    });

    it('leaves the British-only forms and the UK money, titles, and symbols out of the A2 Key goal', () => {
        const t = (id: string, form: string) => ({ id: `english.vocabulary.skill.${id}`, kind: 'skill', title: form, metadata: { normalizedForm: form, examAlignments: ['a2-key-for-schools'] } });
        const { lists, wordOf } = wordLists([
            t('petrol.noun', 'petrol'),
            t('city-centre.noun', 'city centre'),
            t('washing-up.noun', 'washing-up'),
            t('mr.noun', 'mr'),
            t('pence.noun', 'pence'),
            t('at.symbol', 'at / @'),
            t('colour.noun', 'colour'),
            t('passport.noun', 'passport'),
        ]);
        // British spellings of a US word stay in the list (option 2 of a2-key-gap.md was not chosen).
        expect([...lists.get('a2-key-for-schools')!].sort()).toEqual(['colour', 'passport']);
        expect(wordOf.get('english.vocabulary.skill.petrol.noun')).toBe('petrol');
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

function entry(book: string, number: number, level: number, targets: string[], supporting: string[] = []): CurriculumEntry {
    return { book, lesson: `L${number}`, number, level, targets, supporting };
}

describe('curriculum order', () => {
    it('sorts by level, then the workbook books, then the bank, then the lesson number', () => {
        const list = [entry('bank-3', 1, 3, []), entry('origins-3.2', 2, 3, []), entry('origins-3.1', 9, 2, []), entry('origins-2', 1, 2, []), entry('bank-2', 1, 2, []), entry('origins-3.1', 2, 2, []), entry('quest-4', 1, 4, []), entry('origins-3.2', 1, 3, [])];
        expect(curriculumOrder(list).map((e) => `${e.book}#${e.number}`)).toEqual(['origins-2#1', 'origins-3.1#2', 'origins-3.1#9', 'bank-2#1', 'origins-3.2#1', 'origins-3.2#2', 'bank-3#1', 'quest-4#1']);
    });
});

describe('recycling', () => {
    const ordered = [
        entry('quest-4', 1, 4, [], ['A1']),
        entry('quest-4', 2, 4, ['A1', 'B1']),
        entry('quest-4', 3, 4, ['C1'], ['A1']),
        entry('bank-4', 1, 4, ['A1'], ['B1', 'A1']),
        entry('quest-5', 1, 5, [], ['A1']),
    ];
    it('takes the first package that targets the objective as the first teaching', () => {
        const r = recycling(ordered);
        expect(r.get('A1')!.first).toEqual({ book: 'quest-4', lesson: 'L2', level: 4 });
        expect(r.get('C1')!.first).toEqual({ book: 'quest-4', lesson: 'L3', level: 4 });
    });
    it('counts the packages after the first teaching, for target and supporting, and not those before', () => {
        const r = recycling(ordered);
        expect(r.get('A1')!.practiceAfter).toBe(3);
        expect(r.get('B1')!.practiceAfter).toBe(1);
        expect(r.get('C1')!.practiceAfter).toBe(0);
    });
    it('counts the packages where the objective is available, per level', () => {
        expect(recycling(ordered).get('A1')!.perLevel).toEqual({ 4: 4, 5: 1 });
    });
    it('gives "no first teaching" and 0 for an objective that only supports', () => {
        const rows = recyclingRows([entry('quest-4', 1, 4, [], ['S1'])], [{ id: 'S1', gse: 22, text: 's' }, { id: 'X1', gse: 22, text: 'x' }]);
        expect(rows.map((r) => [r.first, r.practiceAfter])).toEqual([[null, 0], [null, 0]]);
    });
    it('warns when the practice after is under 3 and the band is complete', () => {
        const rows = recyclingRows(ordered, [{ id: 'A1', gse: 22, text: '' }, { id: 'B1', gse: 22, text: '' }]);
        expect(rows.map((r) => needsPractice(r, true))).toEqual([false, true]);
        expect(rows.map((r) => needsPractice(r, false))).toEqual([false, false]);
    });
    it('summarizes the taught objectives and those with 3+ practice after', () => {
        const rows = recyclingRows(ordered, [{ id: 'A1', gse: 22, text: '' }, { id: 'B1', gse: 22, text: '' }, { id: 'Z1', gse: 22, text: '' }]);
        expect(recyclingSummary(rows)).toEqual({ taught: 2, practiced: 1, total: 3 });
    });
});

describe('next book lists', () => {
    const band = [
        { id: 'A1', gse: 22, text: 'a' },
        { id: 'B1', gse: 23, text: 'b' },
        { id: 'C1', gse: 24, text: 'c' },
        { id: 'D1', gse: 25, text: 'd' },
    ];
    const entries = [
        entry('quest-4', 1, 4, ['A1', 'B1']),
        entry('quest-4', 2, 4, ['C1'], ['A1']),
        entry('bank-4', 1, 4, [], ['A1', 'B1']),
        entry('quest-5', 1, 5, ['D1'], ['A1', 'A1']),
        entry('quest-5', 2, 5, [], ['C1']),
    ];
    it('lists the lead objectives and the earlier objectives, lowest practice first, from the earlier packages only', () => {
        const { teach, candidates } = nextBookLists(entries, 'quest-5', 5, ['D1'], band);
        expect(teach).toEqual([{ id: 'D1', gse: 25, text: 'd' }]);
        expect(candidates.map((c) => [c.id, c.practiceAfter])).toEqual([['C1', 0], ['B1', 1], ['A1', 2]]);
    });
    it('puts a lead objective only in the teach list', () => {
        const { candidates } = nextBookLists(entries, 'quest-5', 5, ['A1'], band);
        expect(candidates.map((c) => c.id)).toEqual(['C1', 'B1']);
    });
    it('uses a book that has no package yet', () => {
        const { candidates } = nextBookLists(entries.filter((e) => e.book !== 'quest-5'), 'quest-5', 5, [], band);
        expect(candidates.map((c) => c.id)).toEqual(['C1', 'B1', 'A1']);
    });
});
