// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { tokenize, splitSentences, splitParagraphs, lemmaCandidates } from '../lib/text-profile/text';
import { buildVocabularyIndex, type GraphNode } from '../lib/text-profile/vocabulary';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseDraft, parseLessonJson, loadLessonFolder, type LessonText } from '../lib/text-profile/sources';
import { checkLesson, checkBook, PROFILES, type TextProfile } from '../lib/text-profile/check';
import { formatReport } from '../lib/text-profile/report';

function node(form: string, exams: string[], extraForms: string[] = []): GraphNode {
    return {
        id: `english.vocabulary.skill.${form.replace(/\W+/g, '-')}`,
        kind: 'skill',
        metadata: { normalizedForm: form, matchForms: [form, ...extraForms], examAlignments: exams },
    };
}

const S = ['pre-a1-starters'];
const M = ['a1-movers'];
const KET = ['a2-key-for-schools'];

const STARTERS_WORDS = [
    'a', 'the', 'this', 'be', 'is', 'small', 'brown', 'dog', 'where', 'say', 'it', 'under', 'sofa', 'can', 'see',
    'ball', 'red', 'play', 'with', 'in', 'kitchen', 'he', 'happy', 'yes', 'look', 'at', 'cat', 'have', 'i', 'mango',
    'like', 'do', 'not', 'run', 'my', 'and', 'what', 'you', 'on', 'eat', 'lunch', 'clock', 'color', 'colour',
    'his', 'hi',
];

const graph = {
    nodes: [
        ...STARTERS_WORDS.map((w) => node(w, S)),
        node('foot/feet', S, ['foot', 'feet']),
        node('foot', KET),
        node('may', KET),
        node('may', S),
        node('in front of', S),
        node('get up', M),
        node("o'clock", M),
        node('puppy', M),
        node('pond', KET),
        node('one', S),
        { id: 'english.vocabulary.topic.x', kind: 'content_group', metadata: {} } as unknown as GraphNode,
    ],
};

const index = buildVocabularyIndex(graph);

const TEST_PROFILE: TextProfile = {
    id: 'test',
    label: 'Test profile',
    words: [10, 60],
    paragraphs: 2,
    meanSentenceLength: [2, 8],
    longestSentence: 10,
    startersShare: 0.85,
    glossedCount: 3,
    glossedStartersMin: 2,
    glossedMoversMax: 1,
    newStartersMin: 1,
    recycledMin: 1,
    questionMarksMin: 1,
    spelling: 'american',
    book: { lessons: 3, questionLessonsMin: 2, dialogueLessonsMin: 1 },
};

function lesson(id: string, paragraphs: string[], glossed: string[], extra: Partial<LessonText> = {}): LessonText {
    return { id, title: id, source: `${id}.md`, paragraphs, glossed, ...extra };
}

describe('text helpers', () => {
    it('tokenizes words with apostrophes and splits hyphens', () => {
        expect(tokenize("Tom's dog can't run. T-shirt!")).toEqual(["Tom's", 'dog', "can't", 'run', 'T', 'shirt']);
    });

    it('removes accents, so an accented word stays one token', () => {
        expect(tokenize('We go to the café.')).toEqual(['We', 'go', 'to', 'the', 'cafe']);
    });

    it('keeps a quotation and its speech tag in one sentence', () => {
        expect(splitSentences('"Where is Pip?" says Tom. Pip is in the kitchen! Is he happy? Yes.')).toEqual([
            '"Where is Pip?" says Tom.',
            'Pip is in the kitchen!',
            'Is he happy?',
            'Yes.',
        ]);
    });

    it('starts a new sentence at an opening quotation mark', () => {
        expect(splitSentences('Mia says, "Look!" "Where?" asks Tom.')).toEqual(['Mia says, "Look!"', '"Where?" asks Tom.']);
    });

    it('splits paragraphs on blank lines', () => {
        expect(splitParagraphs('One.\nStill one.\n\n\nTwo.')).toEqual(['One. Still one.', 'Two.']);
    });

    it('gives lemma candidates for plurals, contractions, irregulars, and possessives', () => {
        expect(lemmaCandidates('mangoes')).toContain('mango');
        // "-s" comes before "-es", so the first candidate in the graph is the right word.
        expect(lemmaCandidates('planes').indexOf('plane')).toBeLessThan(lemmaCandidates('planes').indexOf('plan'));
        expect(lemmaCandidates('toes').indexOf('toe')).toBeLessThan(lemmaCandidates('toes').indexOf('to'));
        expect(lemmaCandidates("don't")).toContain('do');
        expect(lemmaCandidates('feet')).toContain('foot');
        expect(lemmaCandidates("Tom's")[0]).toBe("tom's");
        expect(lemmaCandidates("Tom's")).toContain('tom');
        expect(lemmaCandidates('stopped')).toContain('stop');
        expect(lemmaCandidates('babies')).toContain('baby');
        expect(lemmaCandidates('mom')).toContain('mum');
    });
});

describe('vocabulary index', () => {
    it('uses the lowest YLE level of all nodes for a form', () => {
        expect(index.levelOf('may')).toBe('Starters');
        expect(index.levelOf('foot')).toBe('Starters');
        expect(index.levelOf('pond')).toBe('Key');
        expect(index.levelOf('zzz')).toBeUndefined();
    });

    it('adds the number words to twenty as Starters', () => {
        expect(index.levelOf('twelve')).toBe('Starters');
        expect(index.levelOf('twenty')).toBe('Starters');
    });

    it('links sibling forms of one node', () => {
        expect(index.siblingsOf('foot')).toContain('feet');
    });

    it('lists multiword forms as phrases', () => {
        expect(index.phrases).toContainEqual(['in', 'front', 'of']);
        expect(index.levelOf('get up')).toBe('Movers');
    });

    it('resolves a token to its first known lemma', () => {
        expect(index.lemmaOf('mangoes')).toBe('mango');
        expect(index.lemmaOf('is')).toBe('be');
        expect(index.lemmaOf('flibber')).toBe('flibber');
    });
});

describe('sources', () => {
    it('parses a draft with front matter and paragraphs', () => {
        const md = [
            '---',
            'lesson: P01',
            'title: Hello! I Am May',
            'profile: origins-3.2',
            'glossed: hi, living room, next to',
            'recycle: name, old',
            'names: Nong',
            'allow: Monday, sign',
            '---',
            '# Heading is ignored',
            '',
            'Hello! I am May.',
            'I am seven.',
            '',
            '<!-- note -->',
            'Goodbye!',
        ].join('\n');
        const l = parseDraft(md, 'p01.md');
        expect(l.id).toBe('P01');
        expect(l.title).toBe('Hello! I Am May');
        expect(l.profile).toBe('origins-3.2');
        expect(l.glossed).toEqual(['hi', 'living room', 'next to']);
        expect(l.recycle).toEqual(['name', 'old']);
        expect(l.names).toEqual(['Nong']);
        expect(l.allow).toEqual(['monday', 'sign']);
        expect(l.paragraphs).toEqual(['Hello! I am May. I am seven.', 'Goodbye!']);
    });

    it('uses the file name when the draft has no lesson id', () => {
        expect(parseDraft('Text.', 'drafts/p05-market.md').id).toBe('p05-market');
    });

    it('loads drafts (front matter required) and lesson JSON in file-name order, without README.md', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'text-profile-'));
        fs.writeFileSync(path.join(dir, 'p02-b.md'), '---\nglossed: dog\n---\nSecond.');
        fs.writeFileSync(path.join(dir, 'README.md'), '---\nglossed: dog\n---\nNot a lesson.');
        fs.writeFileSync(path.join(dir, 'semester-test.md'), '# A teacher document, not a lesson draft');
        fs.writeFileSync(
            path.join(dir, '01-First _workbook.json'),
            JSON.stringify({ lesson_title: 'First', article_paragraphs: [{ number: 1, text: 'First.' }], vocabulary: [] }),
        );
        fs.writeFileSync(path.join(dir, 'notes.txt'), 'ignored');
        expect(loadLessonFolder(dir).map((l) => l.id)).toEqual(['01', 'p02-b']);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('parses a workbook lesson JSON', () => {
        const l = parseLessonJson(
            {
                lesson_title: 'Tom and Pip',
                article_paragraphs: [{ number: 1, text: 'This is Tom.' }, { number: 2, text: 'This is Pip.' }],
                vocabulary: [{ word: 'puppy' }, { word: 'Toy' }],
            },
            'primary/origins-3.1-a0/10-Tom and Pip Sort Toys _workbook.json',
        );
        expect(l.id).toBe('10');
        expect(l.title).toBe('Tom and Pip');
        expect(l.paragraphs).toEqual(['This is Tom.', 'This is Pip.']);
        expect(l.glossed).toEqual(['puppy', 'toy']);
    });
});

describe('checkLesson', () => {
    const prior = [lesson('old', ['This is a dog. The dog is brown.'], ['dog', 'brown', 'ball'])];
    const good = lesson(
        'good',
        [
            'This is Pip. Pip is a small brown puppy. Pip can see a red ball.',
            '"Where is the ball?" says Tom. It is under the sofa! Pip is happy.',
        ],
        ['sofa', 'under', 'puppy'],
    );

    it('passes a text that meets the profile', () => {
        const r = checkLesson(good, { index, prior, profile: TEST_PROFILE });
        const failed = r.checks.filter((c) => c.status === 'fail').map((c) => c.id);
        expect(failed).toEqual([]);
        expect(r.stats.words).toBe(29);
        expect(r.stats.sentences).toBe(6);
        expect(r.stats.questionMarks).toBe(1);
        expect(r.stats.hasDialogue).toBe(true);
        expect(r.stats.nameTokens).toBe(5);
        expect(r.stats.startersShareWithoutNames).toBe(1);
        expect(r.allowed).toEqual([{ word: 'puppy', count: 1 }]);
    });

    it('counts Movers words as on the list for a Movers profile and moves the glossed rules up one list', () => {
        const movers: TextProfile = { ...TEST_PROFILE, listLevel: 'Movers', glossedStartersMin: 1, glossedMoversMax: 0 };
        const r = checkLesson({ ...good, glossed: ['sofa', 'under', 'puppy'] }, { index, prior, profile: movers });
        expect(r.nonStarters).toEqual([]);
        const c = (id: string) => r.checks.find((x) => x.id === id);
        expect(c('gloss-starters')).toMatchObject({ status: 'pass', value: '1', label: 'Glossed on Movers' });
        expect(c('gloss-movers')?.label).toBe('Glossed on Flyers');
        const above = checkLesson({ ...good, paragraphs: [...good.paragraphs.slice(0, 1), 'The pond is big. Pip is happy.'], glossed: ['sofa', 'pond', 'puppy'] }, { index, prior, profile: movers });
        expect(above.checks.find((x) => x.id === 'gloss-above')).toMatchObject({ status: 'fail' });
    });

    it('passes the recycled-word check for the first lesson of a series (nothing to recycle)', () => {
        const r = checkLesson(good, { index, prior: [], profile: TEST_PROFILE });
        expect(r.checks.find((x) => x.id === 'recycled')?.status).toBe('pass');
    });

    it('lists non-Starters words with their level and treats cast names as names', () => {
        const r = checkLesson({ ...good, glossed: ['sofa', 'under', 'ball'] }, { index, prior, profile: TEST_PROFILE });
        expect(r.nonStarters).toEqual([{ word: 'puppy', level: 'Movers', count: 1 }]);
        expect(r.names).toEqual(expect.arrayContaining(['Pip', 'Tom']));
    });

    it('counts new Starters glossed words and recycled words against earlier lessons', () => {
        const r = checkLesson(good, { index, prior, profile: TEST_PROFILE });
        expect(r.newWords).toEqual(['sofa', 'under']);
        expect(r.recycled).toEqual(['ball', 'brown']);
    });

    it('reduces recycled words to their lemma and skips inflected forms of own glossed words', () => {
        const r = checkLesson(good, {
            index,
            prior: [lesson('infl', ['A dog.'], ['balls', 'sofas', 'likes', 'sees'])],
            profile: TEST_PROFILE,
        });
        expect(r.recycled).toEqual(['ball', 'see']);
    });

    it('does not count a word as new when an earlier text uses it', () => {
        const r = checkLesson(good, {
            index,
            prior: [...prior, lesson('older', ['The cat is under the table.'], ['cat'])],
            profile: TEST_PROFILE,
        });
        expect(r.newWords).toEqual(['sofa']);
    });

    it('warns, and does not fail, when a lesson has fewer new words than the target', () => {
        const r = checkLesson(good, {
            index,
            prior: [...prior, lesson('older', ['The cat is under the sofa.'], ['cat'])],
            profile: TEST_PROFILE,
        });
        expect(r.newWords).toEqual([]);
        expect(r.checks.find((c) => c.id === 'new')?.status).toBe('warn');
    });

    it('matches a token by its lemma only, so "his" is not "hi"', () => {
        const l = lesson('his', ['This is Pip. His ball is red.', 'Where is his ball? It is under the sofa.'], ['hi', 'ball', 'sofa']);
        const r = checkLesson(l, { index, prior, profile: TEST_PROFILE });
        expect(r.checks.find((x) => x.id === 'gloss-in-text')?.detail).toBe('missing: hi');
    });

    it('fails when a glossed word is missing from the text', () => {
        const r = checkLesson({ ...good, glossed: ['sofa', 'kitchen', 'puppy'] }, { index, prior, profile: TEST_PROFILE });
        const c = r.checks.find((x) => x.id === 'gloss-in-text');
        expect(c?.status).toBe('fail');
        expect(c?.detail).toContain('kitchen');
    });

    it('matches glossed phrases and inflected forms', () => {
        const l = lesson(
            'phrase',
            ['Pip is in front of the sofa. Look at his feet! Can you see?', 'Pip likes mangoes. Is he happy? Yes.'],
            ['in front of', 'foot', 'mango'],
        );
        const r = checkLesson(l, { index, prior, profile: TEST_PROFILE });
        expect(r.checks.find((x) => x.id === 'gloss-in-text')?.status).toBe('pass');
        expect(r.nonStarters.map((w) => w.word)).not.toContain('front');
    });

    it('fails glossed words above Movers and too many Movers words', () => {
        const r = checkLesson({ ...good, glossed: ['pond', 'puppy', 'get up'] }, { index, prior, profile: TEST_PROFILE });
        expect(r.checks.find((x) => x.id === 'gloss-above')?.status).toBe('fail');
        expect(r.checks.find((x) => x.id === 'gloss-movers')?.status).toBe('fail');
    });

    it('flags digits and British spellings', () => {
        const l = lesson('uk', ['Pip has 3 balls. His colour is brown. Where is Mum?', 'Is Pip happy? Yes.'], ['ball', 'brown', 'happy']);
        const r = checkLesson(l, { index, prior, profile: TEST_PROFILE });
        expect(r.checks.find((x) => x.id === 'digits')?.status).toBe('fail');
        const sp = r.checks.find((x) => x.id === 'spelling');
        expect(sp?.status).toBe('fail');
        expect(sp?.detail).toContain('colour → color');
        expect(sp?.detail).toContain('mum → mom');
    });

    it('checks the recycle list from the draft front matter', () => {
        const r = checkLesson({ ...good, recycle: ['ball', 'dog'] }, { index, prior, profile: TEST_PROFILE });
        const c = r.checks.find((x) => x.id === 'recycle-list');
        expect(c?.status).toBe('fail');
        expect(c?.detail).toBe('missing: dog');
    });

    it('does not count words on the allow list against the Starters share, and lists them', () => {
        const text = ['This is Pip. Pip is a small brown puppy. Pip can see a red ball.', 'Where is the ball? It is under the sofa. Pip is a happy puppy.'];
        const plain = checkLesson(lesson('x', text, ['ball', 'sofa', 'under']), { index, prior, profile: TEST_PROFILE });
        const allowed = checkLesson(lesson('x', text, ['ball', 'sofa', 'under'], { allow: ['puppy'] }), { index, prior, profile: TEST_PROFILE });
        expect(plain.nonStarters.map((w) => w.word)).toEqual(['puppy']);
        expect(allowed.nonStarters).toEqual([]);
        expect(allowed.allowed).toEqual([{ word: 'puppy', count: 2 }]);
        expect(allowed.stats.startersShareWithoutNames).toBe(1);
    });

    it('counts glossed words and "Woof" like allowed words, not against the Starters share', () => {
        const l = lesson(
            'gl',
            ['This is Pip. "Woof!" says Pip. It is one o\'clock.', "Where is the ball? At two o'clock it is under the sofa."],
            ["o'clock", 'ball', 'sofa'],
        );
        const r = checkLesson(l, { index, prior, profile: TEST_PROFILE });
        expect(r.nonStarters).toEqual([]);
        expect(r.allowed).toEqual([{ word: "o'clock", count: 2 }, { word: 'woof', count: 1 }]);
        expect(r.stats.startersShareWithoutNames).toBe(1);
    });

    it('guesses capitalized unknown words in mid-sentence as names', () => {
        const l = lesson('names', ['This is Pip. Pip and Nong play with a ball. Where is Nong?', 'Nong is happy.'], ['ball', 'play', 'happy']);
        const r = checkLesson(l, { index, prior, profile: TEST_PROFILE });
        expect(r.guessedNames).toEqual(['Nong']);
        expect(r.nonStarters).toEqual([]);
    });

    it('fails paragraphs and sentence length outside the profile', () => {
        const l = lesson('short', ['Pip is a small brown dog and Pip can see a red ball in the kitchen with the cat.'], ['dog', 'cat', 'ball']);
        const r = checkLesson(l, { index, prior, profile: TEST_PROFILE });
        const failed = r.checks.filter((c) => c.status === 'fail').map((c) => c.id);
        expect(failed).toEqual(expect.arrayContaining(['paragraphs', 'msl', 'longest']));
    });

    it('warns (not fails) on few question marks when the book rule decides', () => {
        const l = lesson('noq', ['This is Pip. Pip is a small dog.', 'The ball is under the sofa.'], ['dog', 'ball', 'sofa']);
        expect(checkLesson(l, { index, prior, profile: TEST_PROFILE }).checks.find((c) => c.id === 'questions')?.status).toBe('warn');
        const strict = { ...TEST_PROFILE, book: undefined };
        expect(checkLesson(l, { index, prior, profile: strict }).checks.find((c) => c.id === 'questions')?.status).toBe('fail');
    });
});

describe('checkBook', () => {
    const p = (id: string, q: boolean, dialogue: boolean) =>
        lesson(
            id,
            [
                `This is Pip. Pip is a small brown dog.${dialogue ? ' "Look!" says Tom.' : ''}`,
                q ? 'Where is the ball? It is under the sofa.' : 'The ball is under the sofa.',
            ],
            ['dog', 'ball', 'sofa'],
            { profile: 'test' },
        );

    it('reports book checks as pending until the book has all lessons', () => {
        const book = checkBook([p('a', true, false)], { index, prior: [], profiles: { test: TEST_PROFILE } });
        expect(book.checks.every((c) => c.status === 'pending')).toBe(true);
    });

    it('fails the book when too few lessons have questions or dialogue', () => {
        const book = checkBook([p('a', true, false), p('b', false, false), p('c', false, false)], {
            index,
            prior: [],
            profiles: { test: TEST_PROFILE },
        });
        expect(book.checks.find((c) => c.id === 'book-questions')?.status).toBe('fail');
        expect(book.checks.find((c) => c.id === 'book-dialogue')?.status).toBe('fail');
    });

    it('treats earlier lessons in the same book as prior lessons', () => {
        const book = checkBook([p('a', true, true), p('b', true, false)], { index, prior: [], profiles: { test: TEST_PROFILE } });
        expect(book.lessons[0].newWords).toContain('sofa');
        expect(book.lessons[1].newWords).not.toContain('sofa');
    });

    it('rejects an unknown profile', () => {
        expect(() =>
            checkBook([lesson('x', ['Text.'], [], { profile: 'nope' })], { index, prior: [], profiles: { test: TEST_PROFILE } }),
        ).toThrow(/Unknown profile "nope"/);
    });

    it('ships the level 1, level 4, and bank profiles (track level_banks_20261002)', () => {
        expect(PROFILES['origins-1'].words).toEqual([80, 120]);
        expect(PROFILES['quest-4'].listLevel).toBe('Movers');
        for (const id of ['bank-1', 'bank-2', 'bank-3', 'bank-4']) {
            expect(PROFILES[id].book).toBeUndefined();
            expect(PROFILES[id].newStartersMin).toBe(0);
            expect(PROFILES[id].recycledMin).toBe(0);
        }
        expect(PROFILES['bank-4'].listLevel).toBe('Movers');
    });

    it('ships the level-3 and insert profiles from the Origins 3.2 plan', () => {
        expect(PROFILES['origins-3.2'].words).toEqual([150, 200]);
        expect(PROFILES['origins-3.2'].meanSentenceLength).toEqual([5.0, 5.5]);
        expect(PROFILES['origins-3.2'].startersShare).toBe(0.95);
        expect(PROFILES['origins-3.2'].glossedStartersMin).toBe(10);
        expect(PROFILES['origins-3.1-insert'].questionMarksMin).toBe(3);
    });
});

describe('formatReport', () => {
    it('prints each check with PASS or FAIL and the book summary', () => {
        const book = checkBook(
            [lesson('a', ['This is Pip. Where is the ball?', 'It is under the sofa.'], ['ball', 'sofa', 'dog'], { profile: 'test' })],
            { index, prior: [], profiles: { test: TEST_PROFILE } },
        );
        const text = formatReport(book);
        expect(text).toContain('a — a');
        expect(text).toMatch(/FAIL\s+gloss-in-text/);
        expect(text).toMatch(/PASS\s+questions/);
        expect(text).toContain('Book');
        expect(text).toMatch(/PENDING\s+book-questions/);
    });
});
