// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { loadVocabularyIndex } from '../lib/text-profile/vocabulary';
import { parseDraft } from '../lib/text-profile/sources';
import { checkLesson, PROFILES } from '../lib/text-profile/check';

const GRAPH =
    process.env.MASTERY_VOCAB_GRAPH ||
    path.resolve(__dirname, '../../../mastery-advantage/english/cefr-vocabulary/cefr-vocabulary-knowledge-space.json');

const INSERT_V0 = `---
lesson: E12
title: Hello! I Am Tom
profile: origins-3.1-insert
glossed: name, old, nine, ten, brother, sister, live, house, mother, father, favorite, football
---
Hello! What is your name? My name is Tom. How old are you? I am nine. I live in a house with my family. Our house is next to the park. I can see the park from my bedroom. It has a small garden too. Who lives in my house? Come and see!

This is my mom. She is my mother. This is my dad. He is my father. This is my sister, Lily. She is seven. She likes books and drawing. I am her big brother. Lily and I go to school. I like football. It is my favorite game. Dad and I play football in the park.

And this is Pip. Pip is our puppy. He is small and brown. He is one year old. His favorite toy is a red ball. Pip sleeps in the living room. Grandma and Grandpa live in a big house. They have ten fish! Is your family big or small? I love my family, and my family loves Pip.
`;

describe.skipIf(!fs.existsSync(GRAPH))('text profile with the real vocabulary graph', () => {
    const index = loadVocabularyIndex(GRAPH);

    it('matches the 2026-09-30 check of the insert v0 text', () => {
        const r = checkLesson(parseDraft(INSERT_V0, 'e12.md'), { index, prior: [], profile: PROFILES['origins-3.1-insert'] });
        expect(r.stats.words).toBe(167);
        expect(r.stats.sentences).toBe(33);
        expect(r.stats.questionMarks).toBe(4);
        expect(r.nonStarters.map((w) => w.word)).toContain('puppy');
        expect(r.stats.startersShare).toBeGreaterThan(0.95);
        expect(r.checks.find((c) => c.id === 'gloss-in-text')?.status).toBe('pass');
        expect(r.checks.find((c) => c.id === 'gloss-starters')?.value).toBe('12');
    });

    it('reads Starters phrases and number words', () => {
        expect(index.levelOf('in front of')).toBe('Starters');
        expect(index.levelOf('fifteen')).toBe('Starters');
        expect(index.levelOf("o'clock")).toBe('Movers');
        expect(index.lemmaOf('feet')).toBe('foot');
    });
});
