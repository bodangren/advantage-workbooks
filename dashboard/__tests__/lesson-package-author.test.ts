import { describe, it, expect } from 'vitest';
import { carryMedia, findExample, graphNodeLookup, nodesForSense, parseAuthorSource, shuffleOptions } from '../lib/lesson-package/author';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { buildVocabularyIndex, type GraphNode } from '../lib/text-profile/vocabulary';

const node = (form: string, forms: string[] = [form]): GraphNode => ({
    id: `english.vocabulary.skill.${form.replace(/\W+/g, '-')}.noun`,
    kind: 'skill',
    metadata: { normalizedForm: form, matchForms: forms, examAlignments: ['pre-a1-starters'] },
});
const index = buildVocabularyIndex({ nodes: ['kite', 'run', 'tail', 'tree', 'pip', 'is', 'a'].map((w) => node(w)).concat([node('foot/feet', ['foot', 'feet'])]) });
const nodesOf = (w: string) => [`english.vocabulary.skill.${w}.noun`, `english.vocabulary.skill.${w}.verb`];

const SOURCE = `---
title: The Kite
level: 3
replaces: cold
type: fiction
text_type: story
genre: Toys
names: Tom, Pip
glossed: kite, tail
objectives: R17.2
voice: male
summary: Tom has a kite.
summary_th: ทอมมีว่าว
---

## Text
Tom has a kite. | ทอมมีว่าว
It has a tail. | มันมีหาง

Pip runs. | ปิ๊ปวิ่ง

## Glossary
kite | noun | A toy that flies. | ว่าว
tail | noun | The end part. | หาง

## MCQ
m1 | What does Tom have? | *a kite | a ball | a cat | a car | @1 | R17.2
m2 | Who runs? | *Pip | Tom | Lily | Mom | @2.1 | R21.2

## SAQ
s1 | What does Tom have? | Tom has a kite. | R17.2

## LAQ
l1 | Do you like kites? | L12.1

## Images
hero | Tom, Pip | Tom holds a kite. | Tom has a kite.
inline-para-2 | - | A sign by a park gate. | A sign. | NO DOGS ; OPEN
`;

describe('parseAuthorSource (track level_banks_20261002)', () => {
    const where = { book: 'bank-3', lesson: 'b001' };

    it('builds a bank package: paragraphs and Thai from one line per sentence, evidence from references, examples found', () => {
        const { pkg, errors } = parseAuthorSource(SOURCE, where, index, nodesOf);
        expect(errors).toEqual([]);
        const p = LessonPackageSchema.parse(pkg);
        expect(p.text.paragraphs).toEqual(['Tom has a kite. It has a tail.', 'Pip runs.']);
        expect(p.thai.paragraphs[0][1]).toEqual({ en: 'It has a tail.', th: 'มันมีหาง' });
        expect(p.meta).toMatchObject({ key: 'bank-3/1', raLevel: 3, cefrLevel: 'A0+', role: 'bank', replaces: 'cold', profile: 'bank-3', lesson: 'B001' });
        expect(p.bank.mcq[0].evidence).toBe('Tom has a kite.');
        expect(p.bank.mcq[1].evidence).toBe('Pip runs.');
        expect(p.bank.mcq[0].answer).toBe('a kite');
        expect(p.bank.mcq[0].options).toContain('a kite');
        expect(p.glossary[1].example).toBe('It has a tail.');
        expect(p.audio.voice).toBe('English_magnetic_voiced_man');
        expect(p.images[1].characters).toEqual([]);
        expect(p.images[1].overlay).toEqual([{ text: 'NO DOGS' }, { text: 'OPEN' }]);
        expect(p.tags.glossedNodes).toEqual(['english.vocabulary.skill.kite.noun', 'english.vocabulary.skill.tail.noun']);
        expect(p.print.mcq).toEqual([]);
    });

    it('reads the print set and activities of a workbook lesson', () => {
        const src = `${SOURCE}\n## Print\nmcq: m1, m2\nsaq: s1\nhint: Tom has ___.\n\n## Activities\nstarters: I have ... ; It is ...\nfill: Tom has a ___. = kite\norder: Tom has a kite.\ncompletion: I like ...\nwriting: Write about a toy.\nframes: My toy is ___.\n`;
        const { pkg, errors } = parseAuthorSource(src, { book: 'quest-4', lesson: 'l01' }, index, nodesOf);
        expect(errors).toEqual([]);
        const p = LessonPackageSchema.parse(pkg);
        expect(p.meta).toMatchObject({ key: 'q4/1', role: 'workbook', profile: 'quest-4' });
        expect(p.print).toMatchObject({ mcq: ['m1', 'm2'], saq: 's1', saqHint: 'Tom has ___.', mcqOptions: 3 });
        expect(p.activities.vocabFill).toEqual([{ sentence: 'Tom has a ___.', answer: 'kite' }]);
        expect(p.activities.sentenceStarters).toEqual(['I have ...', 'It is ...']);
    });

    it('reports format errors: no answer mark, a Thai part missing, a bank print set', () => {
        const bad = SOURCE.replace('*a kite', 'a kite').replace('Pip runs. | ปิ๊ปวิ่ง', 'Pip runs.') + '\n## Print\nmcq: m1\n';
        const { pkg, errors } = parseAuthorSource(bad, where, index, nodesOf);
        expect(pkg).toBeUndefined();
        expect(errors.join('\n')).toMatch(/mark exactly one option/);
        expect(errors.join('\n')).toMatch(/must be "English \| Thai"/);
        expect(errors.join('\n')).toMatch(/bank article has no Print/);
    });

    it('reads a place for an overlay text (track editorial_prereview_20261003)', () => {
        const placed = SOURCE.replace('NO DOGS ; OPEN', 'NO DOGS @ 0.1, 0.05, 0.4, 0.15 ; OPEN');
        const { pkg, errors } = parseAuthorSource(placed, where, index, nodesOf);
        expect(errors).toEqual([]);
        expect(LessonPackageSchema.parse(pkg).images[1].overlay).toEqual([{ text: 'NO DOGS', box: [0.1, 0.05, 0.4, 0.15] }, { text: 'OPEN' }]);
    });

    it('rejects a place outside the picture and a caption that holds a text list', () => {
        const outside = SOURCE.replace('NO DOGS ; OPEN', 'NO DOGS @ 0.7, 0.1, 0.5, 0.1 ; OPEN @ 0.1, 0.1, 0.2');
        const r1 = parseAuthorSource(outside, where, index, nodesOf);
        expect(r1.pkg).toBeUndefined();
        expect(r1.errors.join('\n')).toMatch(/"NO DOGS": the place must be inside the picture/);
        expect(r1.errors.join('\n')).toMatch(/"OPEN @ 0.1, 0.1, 0.2": a place is "@ x, y, w, h"/);
        const listInCaption = SOURCE.replace('| A sign. | NO DOGS ; OPEN', '| NO DOGS ; OPEN');
        const r2 = parseAuthorSource(listInCaption, where, index, nodesOf);
        expect(r2.pkg).toBeUndefined();
        expect(r2.errors.join('\n')).toMatch(/inline-para-2: the caption has " ; "/);
    });
});

describe('author helpers', () => {
    it('shuffles options in a stable order', () => {
        const o = ['a', 'b', 'c', 'd'];
        expect(shuffleOptions(o, 'x/y/m1')).toEqual(shuffleOptions(o, 'x/y/m1'));
        expect([...shuffleOptions(o, 'x/y/m1')].sort()).toEqual(o);
    });

    it('puts the first option in each place about equally often', () => {
        const count = [0, 0, 0, 0];
        for (let n = 0; n < 2000; n++) count[shuffleOptions(['answer', 'b', 'c', 'd'], `bank-1/b${n}/m${n % 10}`).indexOf('answer')]++;
        for (const c of count) expect(c).toBeGreaterThan(400);
    });

    it('gives the same order whatever the written order', () => {
        const key = 'quest-4/l01/m3';
        const order = shuffleOptions(['a', 'b', 'c', 'd'], key);
        expect(shuffleOptions(['d', 'c', 'b', 'a'], key)).toEqual(order);
        expect(shuffleOptions(order, key)).toEqual(order);
    });

    it('finds an example sentence through sibling forms', () => {
        expect(findExample('foot', ['Hi.', 'My feet are big.'], index)).toBe('My feet are big.');
        expect(findExample('kite', ['Hi.'], index)).toBeUndefined();
    });

    it('narrows graph nodes to the part of speech', () => {
        expect(nodesForSense('run', 'verb', nodesOf)).toEqual(['english.vocabulary.skill.run.verb']);
        expect(nodesForSense('run', 'adverb', nodesOf)).toHaveLength(2);
    });

    it('finds every node of a form, without the false match forms of the graph', () => {
        const n = (id: string, head: string, forms: string[]) => ({ id: `english.vocabulary.skill.${id}`, kind: 'skill', metadata: { normalizedForm: head, matchForms: forms } });
        const lookup = graphNodeLookup({
            nodes: [
                n('businessman-woman.noun', 'businessman', ['businessman', 'businessman/woman', 'woman']),
                n('woman.noun', 'woman', ['woman']),
                n('foot.noun', 'foot', ['foot']),
                n('foot-feet.noun', 'feet', ['feet', 'foot', 'foot/feet']),
                n('run.noun', 'run', ['run']),
                n('run.verb', 'run', ['run']),
                { id: 'english.vocabulary.domain', kind: 'domain' },
            ],
        });
        expect(lookup('Woman')).toEqual(['english.vocabulary.skill.woman.noun']);
        expect(lookup('businessman')).toEqual(['english.vocabulary.skill.businessman-woman.noun']);
        expect(lookup('foot')).toEqual(['english.vocabulary.skill.foot.noun', 'english.vocabulary.skill.foot-feet.noun']);
        expect(lookup('feet')).toEqual(['english.vocabulary.skill.foot-feet.noun']);
        expect(lookup('run')).toEqual(['english.vocabulary.skill.run.noun', 'english.vocabulary.skill.run.verb']);
        expect(lookup('zzz')).toEqual([]);
    });

    it('finds the node of an American spelling through its British headword', () => {
        const graph: Record<string, string[]> = {
            practice: ['english.vocabulary.skill.practice.noun'],
            practise: ['english.vocabulary.skill.practise.verb'],
            moustache: ['english.vocabulary.skill.moustache.noun'],
        };
        const lookup = (w: string) => graph[w] ?? [];
        expect(nodesForSense('mustache', 'noun', lookup)).toEqual(['english.vocabulary.skill.moustache.noun']);
        expect(nodesForSense('mustache', undefined, lookup)).toEqual(['english.vocabulary.skill.moustache.noun']);
        expect(nodesForSense('practice', 'verb', lookup)).toEqual(['english.vocabulary.skill.practise.verb']);
        expect(nodesForSense('practice', 'noun', lookup)).toEqual(['english.vocabulary.skill.practice.noun']);
    });

    it('carries a picture with the same prompt, and the audio when the sentences did not change', () => {
        const first = LessonPackageSchema.parse(parseAuthorSource(SOURCE, { book: 'bank-3', lesson: 'b001' }, index, nodesOf).pkg);
        first.images[0].file = 'bank-3/media/b001/hero.jpg';
        first.audio.article = 'bank-3/media/b001/article.mp3';
        const same = parseAuthorSource(SOURCE, { book: 'bank-3', lesson: 'b001' }, index, nodesOf).pkg!;
        carryMedia(same, first);
        expect(same.images![0].file).toBe('bank-3/media/b001/hero.jpg');
        expect(same.audio!.article).toBe('bank-3/media/b001/article.mp3');
        const changed = parseAuthorSource(SOURCE.replace('Pip runs. | ปิ๊ปวิ่ง', 'Pip runs fast. | ปิ๊ปวิ่งเร็ว').replace('Tom holds a kite.', 'Tom flies a kite.'), { book: 'bank-3', lesson: 'b001' }, index, nodesOf).pkg!;
        carryMedia(changed, first);
        expect(changed.images![0].file).toBeUndefined();
        expect(changed.audio!.article).toBeUndefined();
    });
});
