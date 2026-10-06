// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { REPO_ROOT } from '../lib/lesson-package/files';
import { AMERICAN_SPELLING, BANK_COUNTS, BANK_TEMPLATES, LEVEL_BOOKS, americanSpelling, americanTopic, assignWords, bankTemplates, britishHeadword, buildBankRows, normalizePools, pickTopics, restrictPool, targetCounts, topicGroup, wordSegments, type WordPools } from '../lib/lesson-package/bank-plan';

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

describe('rotation and topic match of the required words', () => {
    it('requires no word twice before every word of the list is required once', () => {
        // Level 5: 36 articles x 6 places = 216 places for 100 Movers words.
        const pools = syntheticPools();
        const used = new Map<string, number>();
        const { rows } = buildBankRows(5, pools, used);
        const counts = Object.values(pools.movers).flat().map((w) => used.get(w) ?? 0);
        expect(Math.min(...counts)).toBeGreaterThanOrEqual(1);
        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
        expect(rows.flatMap((r) => r.requiredGlossed)).toHaveLength(216);
    });
    it('repeats only as many words as there are places beyond the list size', () => {
        const pools = syntheticPools();
        const used = new Map<string, number>();
        // Level 7: 72 x 6 = 432 places for 400 Flyers words: 32 words are required twice.
        buildBankRows(7, pools, used);
        const counts = Object.values(pools.flyers).flat().map((w) => used.get(w) ?? 0);
        expect(counts.filter((c) => c === 2)).toHaveLength(32);
        expect(counts.filter((c) => c === 1)).toHaveLength(368);
    });
    it('puts topic words in articles that have the topic when the topic has words left', () => {
        const pools = syntheticPools();
        const topics: [string, string][] = [['animals', 'school'], ['school', 'food-and-drink'], ['food-and-drink', 'animals'], ['animals', 'school']];
        const { words } = assignWords(5, topics, pools, new Map());
        const topicOf = (w: string) => Object.entries(pools.movers).find(([, ws]) => ws.includes(w))![0];
        words.forEach((ws, i) => {
            const own = new Set(topics[i]);
            const bound = ws.filter((w) => topicOf(w) !== 'other');
            expect(bound.filter((w) => own.has(topicOf(w))).length / Math.max(1, bound.length)).toBeGreaterThanOrEqual(0.8);
        });
    });
    it('spreads words with no topic evenly over the articles', () => {
        const pools = syntheticPools();
        const topics: [string, string][] = Array.from({ length: 12 }, () => ['animals', 'school']);
        const { words } = assignWords(5, topics, pools, new Map());
        const other = words.map((ws) => ws.filter((w) => pools.movers.other.includes(w)).length);
        // Words in 'food-and-drink' and 'other' have no topic here: each article gets about the same share.
        expect(Math.max(...other) - Math.min(...other)).toBeLessThanOrEqual(2);
    });
});

describe('American spelling of the required words', () => {
    it('maps the British headwords of the Cambridge lists', () => {
        for (const [uk, us] of Object.entries({ practise: 'practice', moustache: 'mustache', colour: 'color', colours: 'colors', favourite: 'favorite', grey: 'gray', centre: 'center', theatre: 'theater', mum: 'mom', neighbour: 'neighbor', programme: 'program' })) {
            expect(americanSpelling(uk)).toBe(us);
        }
        expect(americanSpelling('banana')).toBe('banana');
        expect(americanTopic('colours')).toBe('colors');
        expect(topicGroup('colors')).toBe(topicGroup('colours'));
    });
    it('keeps the map one way: no American form is a key', () => {
        for (const us of Object.values(AMERICAN_SPELLING)) expect(AMERICAN_SPELLING[us], us).toBeUndefined();
    });
    it('finds the British headword of an American form', () => {
        expect(britishHeadword('practice')).toBe('practise');
        expect(britishHeadword('mustache')).toBe('moustache');
        expect(britishHeadword('banana')).toBeUndefined();
    });
    it('writes the pools and the rows in American spelling and removes doubles', () => {
        const raw: WordPools = { movers: { other: ['practise', 'moustache', 'program', 'programme'], colours: ['colour'] }, flyers: {}, a2key: {} };
        const pools = normalizePools(raw);
        expect(pools.movers.other).toEqual(['practice', 'mustache', 'program']);
        expect(pools.movers.colors).toEqual(['color']);
    });
    it('writes no British word in the rows', () => {
        const raw: WordPools = { movers: { other: ['practise', 'moustache', ...Array.from({ length: 200 }, (_, i) => `w${i}`)] }, flyers: { other: ['colour', 'favourite', ...Array.from({ length: 300 }, (_, i) => `f${i}`)] }, a2key: { other: ['neighbour', ...Array.from({ length: 300 }, (_, i) => `k${i}`)] } };
        const words = [5, 6, 7].flatMap((level) => buildBankRows(level, raw, new Map()).rows.flatMap((r) => r.requiredGlossed));
        for (const uk of ['practise', 'moustache', 'colour', 'favourite']) expect(words).not.toContain(uk);
        expect(words).toContain('practice');
    });
    it('writes American topic names in the rows', () => {
        for (const level of [5, 6]) {
            const topics = buildBankRows(level, syntheticPools(), new Map()).rows.flatMap((r) => r.topics);
            expect(topics).not.toContain('colours');
        }
        expect(buildBankRows(5, syntheticPools(), new Map()).rows.flatMap((r) => r.topics)).toContain('colors');
    });
});

describe('levels 1-4 stay as they are', () => {
    const file = (level: number) => path.join(REPO_ROOT, 'docs', 'content-plans', 'level-plans', `bank-${level}.json`);
    it('writes the same bank-4 plan as before', () => {
        const before = fs.readFileSync(file(4), 'utf8');
        execFileSync('npx', ['tsx', 'scripts/plan-level-bank.ts', '4'], { cwd: path.join(REPO_ROOT, 'dashboard'), stdio: 'pipe' });
        expect(fs.readFileSync(file(4), 'utf8')).toBe(before);
    }, 60000);
    it('keeps the pinned row b001 of bank-4', () => {
        const plan = JSON.parse(fs.readFileSync(file(4), 'utf8')) as { articles: { lesson: string; topics: string[]; requiredGlossed: string[] }[] };
        expect(plan.articles[0].lesson).toBe('b001');
        expect(plan.articles[0].requiredGlossed).toHaveLength(6);
        expect(plan.articles[0].topics).toEqual(['family-and-friends', 'sports-and-leisure']);
    });
});

describe('restrictPool (word pacing, levels plan v0.5)', () => {
    it('keeps only the allowed words of one list, in their topics, and leaves the other lists alone', () => {
        const pools = syntheticPools();
        const allowed = new Set(['k0x1', 'k2x5', 'k3x7', 'not-a-list-word']);
        const out = restrictPool(pools, 'a2key', allowed);
        expect(Object.values(out.a2key).flat().sort()).toEqual(['k0x1', 'k2x5', 'k3x7']);
        expect(out.a2key.education).toEqual(['k0x1']);
        expect(out.flyers).toEqual(pools.flyers);
        expect(out.movers).toEqual(pools.movers);
        expect(Object.values(pools.a2key).flat()).toHaveLength(600);
    });

    it('makes a level-8 bank require only allowed A2 Key words', () => {
        const pools = syntheticPools();
        const allowed = new Set(Object.values(pools.a2key).flat().filter((_, i) => i % 3 === 0));
        const { rows } = buildBankRows(8, restrictPool(pools, 'a2key', allowed), new Map());
        const keyWords = rows.flatMap((r) => r.requiredGlossed).filter((w) => w.startsWith('k'));
        expect(keyWords.length).toBeGreaterThan(0);
        expect(keyWords.every((w) => allowed.has(w))).toBe(true);
    });
});
