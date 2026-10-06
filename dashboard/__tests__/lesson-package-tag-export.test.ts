// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema, type LessonPackage } from '../lib/lesson-package/schema';
import { fixturePackage } from './fixtures/lesson-package-fixture';
import { buildTagExport, tagExportEntry, vocabNodeFromGraph, type KeyObjective, type VocabNode } from '../lib/lesson-package/tag-export';

const OBJECTIVES: KeyObjective[] = [
    { id: 'L19.2', node: 'english.gse.skill.young.listening.19.can-identify', gse: 19, skill: 'Listening', text: 'Can identify everyday objects.' },
    { id: 'R17.2', node: 'english.gse.skill.young.reading.17.can-recognise', gse: 17, skill: 'Reading', text: 'Can recognise basic nouns.' },
    { id: 'R10.2', node: 'english.gse.skill.young.reading.10.question-mark', gse: 10, skill: 'Reading', text: 'Can recognise a question mark.' },
];

const VOCAB = new Map<string, VocabNode>([
    ['english.vocabulary.skill.ball.noun', { id: 'english.vocabulary.skill.ball.noun', word: 'ball', pos: 'noun' }],
    ['english.vocabulary.skill.sorry.adjective-interrogative', { id: 'english.vocabulary.skill.sorry.adjective-interrogative', word: 'sorry', pos: 'adjective-interrogative' }],
]);

const GRAPHS = {
    gse: { file: 'gse.json', commit: 'aaa1111', commitDate: '2026-05-20', sha256: 'f0', schemaVersion: 'v1' },
    vocabulary: { file: 'vocab.json', commit: 'bbb2222', commitDate: '2026-08-11', sha256: 'e1', schemaVersion: 'english-vocabulary.v1' },
};

function pkg(): LessonPackage {
    const p = LessonPackageSchema.parse(fixturePackage());
    p.tags.glossedNodes = ['english.vocabulary.skill.ball.noun'];
    p.tags.recycledNodes = ['english.vocabulary.skill.sorry.adjective-interrogative'];
    return p;
}

describe('tag export entry', () => {
    it('keeps the short ids with their roles, the vocabulary nodes, and the question objectives', () => {
        const { entry, problems } = tagExportEntry(pkg(), new Set(OBJECTIVES.map((o) => o.id)), VOCAB);
        expect(problems).toEqual([]);
        expect(entry).toMatchObject({ key: 'tb/1', book: 'test-book', legacy: null });
        expect(entry.articleObjectives).toEqual([
            { shortId: 'L19.2', role: 'target' },
            { shortId: 'R17.2', role: 'target' },
            { shortId: 'R10.2', role: 'supporting' },
        ]);
        expect(entry.vocabulary).toEqual([
            { word: 'ball', pos: 'noun', nodeId: 'english.vocabulary.skill.ball.noun', role: 'glossed' },
            { word: 'sorry', pos: 'adjective-interrogative', nodeId: 'english.vocabulary.skill.sorry.adjective-interrogative', role: 'recycled' },
        ]);
        expect(entry.questions.map((q) => `${q.type}:${q.id}:${q.objectives.join('+')}`)).toEqual(['mcq:m1:L19.2', 'mcq:m2:R17.2', 'mcq:m3:R17.2', 'saq:s1:L19.2', 'saq:s2:R17.2', 'laq:l1:R17.2']);
    });

    it('gives the exact glossary form of a glossed node (an inflected form too), and none for a recycled node', () => {
        const p = pkg();
        p.glossary[2].word = 'puppies';
        p.tags.glossedNodes = ['english.vocabulary.skill.puppy.noun', 'english.vocabulary.skill.ball.noun'];
        p.tags.recycledNodes = ['english.vocabulary.skill.sorry.adjective-interrogative'];
        const vocab = new Map(VOCAB).set('english.vocabulary.skill.puppy.noun', { id: 'english.vocabulary.skill.puppy.noun', word: 'puppy', pos: 'noun', forms: ['puppy', 'puppies'] });
        const { entry } = tagExportEntry(p, new Set(OBJECTIVES.map((o) => o.id)), vocab);
        expect(entry.vocabulary.map((v) => [v.word, v.glossaryWord])).toEqual([
            ['puppy', 'puppies'],
            ['ball', undefined],
            ['sorry', undefined],
        ]);
        expect(Object.keys(entry.vocabulary[0])).toEqual(['word', 'glossaryWord', 'pos', 'nodeId', 'role']);
    });

    it('gives the legacy article and question ids of an injected package, keyed by the package question id', () => {
        const p = pkg();
        p.db.legacy = { articleId: 'cart1', mcq: { m1: 'cq1', m2: 'cq2', m3: 'cq3' }, saq: { s1: 'cs1', s2: 'cs2' }, laq: { l1: 'cl1' }, flashcardId: 'cfl1' };
        const { entry } = tagExportEntry(p, new Set(OBJECTIVES.map((o) => o.id)), VOCAB);
        expect(entry.legacy).toEqual({ articleId: 'cart1', questions: { m1: 'cq1', m2: 'cq2', m3: 'cq3', s1: 'cs1', s2: 'cs2', l1: 'cl1' } });
    });

    it('gives no legacy ids before the injection, also for a package that replaces an old article', () => {
        const p = pkg();
        p.meta.replaces = 'cold1';
        expect(tagExportEntry(p, new Set(OBJECTIVES.map((o) => o.id)), VOCAB).entry.legacy).toBeNull();
    });

    it('reports a short id that is not in the key and a node that is not in the vocabulary graph', () => {
        const p = pkg();
        p.tags.supportingObjectives = ['R99.9'];
        p.bank.saq[0].objectives = ['X1.1'];
        p.tags.glossedNodes = ['english.vocabulary.skill.nothing.noun'];
        const { entry, problems } = tagExportEntry(p, new Set(OBJECTIVES.map((o) => o.id)), VOCAB);
        expect(problems).toEqual([
            'tb/1: objective R99.9 is not in the objective key',
            'tb/1: question s1: objective X1.1 is not in the objective key',
            'tb/1: vocabulary node english.vocabulary.skill.nothing.noun is not in the vocabulary graph',
        ]);
        expect(entry.vocabulary.map((v) => v.nodeId)).not.toContain('english.vocabulary.skill.nothing.noun');
    });
});

describe('tag export', () => {
    it('writes the objective key and the graph releases once, in the header', () => {
        const { data, problems } = buildTagExport([pkg()], OBJECTIVES, VOCAB, GRAPHS, '2026-10-06T06:00:00.000Z');
        expect(problems).toEqual([]);
        expect(data.generatedAt).toBe('2026-10-06T06:00:00.000Z');
        expect(data.graphs).toEqual(GRAPHS);
        expect(data.objectiveKey['R17.2']).toEqual({ nodeId: 'english.gse.skill.young.reading.17.can-recognise', gse: 17, skill: 'Reading', text: 'Can recognise basic nouns.' });
        expect(data.packages).toHaveLength(1);
    });

    it('reports a short id that two key files define', () => {
        const { problems } = buildTagExport([pkg()], [...OBJECTIVES, OBJECTIVES[0]], VOCAB, GRAPHS, '2026-10-06T06:00:00.000Z');
        expect(problems).toEqual(['objective L19.2 is in the objective key two times']);
    });
});

describe('vocabulary graph node', () => {
    it('takes the word from the normalized form and the part of speech from the node id', () => {
        const node = { id: 'english.vocabulary.skill.bat-as-sports-equipment.noun', kind: 'skill', title: 'bat (as sports equipment)', metadata: { normalizedForm: 'bat' } };
        expect(vocabNodeFromGraph(node)).toEqual({ id: node.id, word: 'bat', pos: 'noun', forms: ['bat'] });
        const bats = { ...node, metadata: { normalizedForm: 'bat', matchForms: ['bats', 'Bat'] } };
        expect(vocabNodeFromGraph(bats)?.forms).toEqual(['bat', 'bats']);
        expect(vocabNodeFromGraph({ id: 'english.vocabulary.domain', kind: 'domain', title: 'English CEFR Vocabulary' })).toBeUndefined();
    });
});
