// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { REPO_ROOT } from '../lib/lesson-package/files';
import { BANK_COUNTS, BANK_TEMPLATES, LEVEL_BOOKS, assignWords, bankTemplates, buildBankRows, pickTopics, targetCounts, topicGroup, wordSegments, type WordPools } from '../lib/lesson-package/bank-plan';

const objectivesFile = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'content-plans', 'level-plans', 'levels-5-9-objectives.json'), 'utf8')) as { outOfScope: Record<string, string>; levels: Record<string, string[]> };
const LEVELS = [5, 6, 7, 8, 9];
const levelObjectives = (level: number) => objectivesFile.levels[String(level)].filter((id) => !(id in objectivesFile.outOfScope));

/** Word pools with many words in a few topics, as the real lists have. */
function syntheticPools(): WordPools {
    const make = (prefix: string, topics: string[], per: number) => Object.fromEntries(topics.map((t, i) => [t, Array.from({ length: per }, (_, k) => `${prefix}${i}x${k}`)]));
    return {
        movers: make('m', ['animals', 'school', 'food-and-drink', 'other'], 25),
        flyers: make('f', ['animals', 'school', 'sports-and-leisure', 'other'], 100),
        a2key: make('k', ['education', 'sport', 'food-and-drink', 'other'], 150),
    };
}

describe('bank text types, levels 5-9', () => {
    for (const level of LEVELS) {
        describe(`level ${level}`, () => {
            const templates = bankTemplates(level);
            const rows = templates.flatMap((t) => Array.from({ length: t.count }, () => t));
            it('has the planned article count', () => {
                expect(rows).toHaveLength(BANK_COUNTS[level]);
            });
            it('gives each article 1-3 targets and 0-2 supporting objectives', () => {
                for (const t of templates) {
                    expect(t.objectives.length).toBeGreaterThanOrEqual(1);
                    expect(t.objectives.length).toBeLessThanOrEqual(3);
                    expect(t.supporting?.length ?? 0).toBeLessThanOrEqual(2);
                    expect(t.topics.length).toBeGreaterThanOrEqual(2);
                }
            });
            it('targets every in-scope objective of the level in 2 or more articles', () => {
                const counts = targetCounts(rows);
                const low = levelObjectives(level).filter((id) => (counts.get(id) ?? 0) < 2);
                expect(low).toEqual([]);
            });
            it('targets only objectives of the level and no out-of-scope objective', () => {
                const allowed = new Set(levelObjectives(level));
                for (const t of templates) {
                    for (const id of [...t.objectives, ...(t.supporting ?? [])]) expect(id in objectivesFile.outOfScope, `${t.type}: ${id}`).toBe(false);
                    for (const id of t.objectives) expect(allowed.has(id), `${t.type}: ${id}`).toBe(true);
                }
            });
            it('keeps the story share of the plan', () => {
                const share = rows.filter((t) => t.app === 'fiction').length / rows.length;
                if (level <= 6) expect(share).toBeGreaterThanOrEqual(0.47);
                else expect(share).toBeGreaterThanOrEqual(0.42);
                expect(share).toBeLessThanOrEqual(0.53);
            });
            it('puts the cast in each note', () => {
                for (const t of templates) expect(t.note).toContain('Cast:');
            });
        });
    }
    it('has no spec for other levels', () => {
        expect(Object.keys(BANK_TEMPLATES).map(Number)).toEqual(LEVELS);
    });
});

describe('required glossed words', () => {
    it('gives 6 words to each article of each level and never the same set twice', () => {
        const pools = syntheticPools();
        const used = new Map<string, number>();
        for (const level of LEVELS) {
            const { rows } = buildBankRows(level, pools, used);
            const sets = new Set<string>();
            for (const r of rows) {
                expect(r.requiredGlossed).toHaveLength(6);
                expect(new Set(r.requiredGlossed).size).toBe(6);
                sets.add([...r.requiredGlossed].sort().join(','));
            }
            expect(sets.size).toBe(rows.length);
        }
    });
    it('requires each Movers word at level 5, each Flyers word by level 7, and each A2 Key word by level 9', () => {
        const pools = syntheticPools();
        const used = new Map<string, number>();
        const all = (l: keyof WordPools) => Object.values(pools[l]).flat();
        buildBankRows(5, pools, used);
        expect(all('movers').filter((w) => !used.get(w))).toEqual([]);
        buildBankRows(6, pools, used);
        buildBankRows(7, pools, used);
        expect(all('flyers').filter((w) => !used.get(w))).toEqual([]);
        buildBankRows(8, pools, used);
        const { uncovered } = buildBankRows(9, pools, used);
        expect(uncovered).toEqual([]);
        expect(all('a2key').filter((w) => !used.get(w))).toEqual([]);
    });
    it('takes words of the article topics first', () => {
        const pools = syntheticPools();
        const { words } = assignWords(5, [['animals', 'school']], pools, new Map());
        expect(words[0].filter((w) => pools.movers.animals.includes(w)).length).toBeGreaterThanOrEqual(3);
    });
    it('uses the Movers and Flyers split of level 6 and the A2 Key share of level 8', () => {
        expect(wordSegments(6, 0)).toEqual([{ list: 'movers', count: 3 }, { list: 'flyers', count: 3 }]);
        expect(wordSegments(6, 40)).toEqual([{ list: 'movers', count: 1 }, { list: 'flyers', count: 5 }]);
        expect(wordSegments(8, 0).map((s) => s.count)).toEqual([2, 4]);
    });
});

describe('topic helpers', () => {
    it('joins YLE and A2 Key topics of the same area', () => {
        expect(topicGroup('sport')).toBe(topicGroup('sports-and-leisure'));
        expect(topicGroup('education')).toBe(topicGroup('school'));
        expect(topicGroup('unknown-topic')).toBe('unknown-topic');
    });
    it('picks two different topics', () => {
        const t = BANK_TEMPLATES[5][0];
        for (let i = 0; i < 6; i++) {
            const [a, b] = pickTopics(t, i);
            expect(a).not.toBe(b);
        }
    });
});
