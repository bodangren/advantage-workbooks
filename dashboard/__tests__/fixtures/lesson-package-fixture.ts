import { buildVocabularyIndex, type GraphNode } from '../../lib/text-profile/vocabulary';
import type { TextProfile } from '../../lib/text-profile/check';
import type { LessonPackageInput } from '../../lib/lesson-package/schema';
import type { LessonShape } from '../../lib/lesson-package/checks';

function node(form: string, exams: string[]): GraphNode {
    return {
        id: `english.vocabulary.skill.${form.replace(/\W+/g, '-')}`,
        kind: 'skill',
        metadata: { normalizedForm: form, matchForms: [form], examAlignments: exams },
    };
}

const STARTERS_WORDS = [
    'a', 'the', 'this', 'be', 'is', 'small', 'brown', 'dog', 'where', 'say', 'it', 'under', 'sofa', 'can', 'see',
    'ball', 'red', 'play', 'with', 'in', 'he', 'happy', 'yes', 'no', 'look', 'at', 'cat', 'have', 'i', 'like',
    'do', 'not', 'what', 'who', 'you', 'on', 'color', 'his', 'find', 'bed', 'blue', 'green', 'table', 'tell',
    'about', 'why', 'your', 'draw', 'picture', 'of', 'word', 'two', 'three', 'one', 'there', 'are',
];

export const fixtureIndex = buildVocabularyIndex({
    nodes: [...STARTERS_WORDS.map((w) => node(w, ['pre-a1-starters'])), node('puppy', ['a1-movers']), node('pond', ['a2-key-for-schools'])],
});

export const FIXTURE_PROFILE: TextProfile = {
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
    recycledMin: 0,
    questionMarksMin: 1,
    spelling: 'american',
};

export const FIXTURE_SHAPE: LessonShape = {
    glossary: 3,
    mcq: 3,
    saq: 2,
    laq: 1,
    printMcq: 2,
    printObjectiveMcqMin: 1,
    mcqOptions: 4,
    sentenceStarters: 1,
    vocabFill: 1,
    sentenceOrder: 1,
    sentenceCompletion: 1,
    images: 1,
};

export const FIXTURE_OBJECTIVES = new Set(['R10.2', 'L19.2', 'R17.2']);

const P1 = 'This is Pip. Pip is a small brown puppy. Pip can see a red ball.';
const P2 = '"Where is the ball?" says Tom. It is under the sofa! Pip is happy.';

/**
 * A small, complete package that passes every check with the fixture vocabulary, profile, and shape.
 * @returns A fresh copy, safe to change in a test.
 */
export function fixturePackage(): LessonPackageInput {
    return {
        version: 1,
        meta: {
            book: 'test-book',
            lesson: 'T01',
            number: 1,
            key: 'tb/1',
            title: 'Where Is the Ball?',
            raLevel: 3,
            cefrLevel: 'A0+',
            textType: 'story',
            genre: 'Pip stories',
            profile: 'test',
        },
        text: {
            paragraphs: [P1, P2],
            summary: 'Pip looks for his red ball. It is under the sofa.',
            glossed: ['sofa', 'under', 'puppy'],
        },
        glossary: [
            { word: 'sofa', pos: 'noun', definition: 'A long soft seat.', thai: 'โซฟา', example: 'It is under the sofa!' },
            { word: 'under', pos: 'preposition', definition: 'Below something.', thai: 'ใต้', example: 'It is under the sofa!' },
            { word: 'puppy', pos: 'noun', definition: 'A young dog.', thai: 'ลูกสุนัข', example: 'Pip is a small brown puppy.' },
        ],
        bank: {
            mcq: [
                { id: 'm1', question: 'Where is the ball?', options: ['under the sofa', 'on the bed', 'in the cat', 'at the table'], answer: 'under the sofa', evidence: 'It is under the sofa!', objectives: ['L19.2'] },
                { id: 'm2', question: 'What color is the ball?', options: ['blue', 'red', 'green', 'brown'], answer: 'red', evidence: 'Pip can see a red ball.', objectives: ['R17.2'] },
                { id: 'm3', question: 'Who is Pip?', options: ['a cat', 'a puppy', 'a ball', 'a sofa'], answer: 'a puppy', evidence: 'Pip is a small brown puppy.', objectives: ['R17.2'] },
            ],
            saq: [
                { id: 's1', question: 'Where is the ball?', answer: 'It is under the sofa.', objectives: ['L19.2'] },
                { id: 's2', question: 'What color is Pip?', answer: 'Pip is brown.', objectives: ['R17.2'] },
            ],
            laq: [{ id: 'l1', question: 'Draw a picture of your dog. Tell about it.', objectives: ['R17.2'] }],
        },
        print: { mcq: ['m1', 'm2'], saq: 's1' },
        activities: {
            sentenceStarters: ['The ball is ...'],
            vocabFill: [{ sentence: 'Pip is a small brown ___.', answer: 'puppy' }],
            sentenceOrder: ['Pip is happy.'],
            sentenceCompletion: ['Pip can see ...'],
            writingPrompt: 'Write about a dog.',
        },
        thai: {
            paragraphs: [
                [
                    { en: 'This is Pip.', th: 'นี่คือปิ๊ป' },
                    { en: 'Pip is a small brown puppy.', th: 'ปิ๊ปเป็นลูกสุนัขตัวเล็กสีน้ำตาล' },
                    { en: 'Pip can see a red ball.', th: 'ปิ๊ปเห็นลูกบอลสีแดง' },
                ],
                [
                    { en: '"Where is the ball?" says Tom.', th: '"ลูกบอลอยู่ที่ไหน" ทอมพูด' },
                    { en: 'It is under the sofa!', th: 'มันอยู่ใต้โซฟา!' },
                    { en: 'Pip is happy.', th: 'ปิ๊ปมีความสุข' },
                ],
            ],
            summary: 'ปิ๊ปหาลูกบอลสีแดงของมัน มันอยู่ใต้โซฟา',
        },
        images: [{ position: 'hero', prompt: 'Pip looks under a sofa for a red ball.', characters: ['Pip'], caption: 'Pip and the red ball' }],
        tags: { targetObjectives: ['L19.2', 'R17.2'], supportingObjectives: ['R10.2'] },
    };
}
