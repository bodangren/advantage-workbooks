// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
import { checkPackage, PRIMARY_SHAPE, type PackageCheckContext } from '../lib/lesson-package/checks';
import { oldPictureUrl, printedArticleId, printedToPackage, TODO } from '../lib/lesson-package/import-printed';
import { fixtureIndex, FIXTURE_OBJECTIVES } from './fixtures/lesson-package-fixture';

/** A printed lesson in the shape of primary/origins-2-a0/*_workbook.json (trimmed). */
function printed() {
    return {
        lesson_number: 'Lesson 5',
        lesson_title: 'A New Ball Game',
        level_name: 'Level 2',
        cefr_level: 'CEFR A0',
        article_type: 'fiction',
        genre: 'Family & Friends',
        vocabulary: [
            { word: 'Aunt', phonetic: '', definition: 'The sister of your father or mother.', thai_definition: 'ป้า/น้า' },
            { word: 'cousin', phonetic: '', definition: 'The child of your aunt or uncle.', thai_definition: 'ลูกพี่ลูกน้อง' },
            { word: 'park', phonetic: '', definition: 'A big green place.', thai_definition: 'สวนสาธารณะ' },
        ],
        article_image_url: ['https://storage.googleapis.com/primary-app-storage/images/cabc_1.png'],
        article_caption: 'Lisa plays a new game with Pip.',
        article_url: 'https://primary.reading-advantage.com/student/read/cmgqx3ase02kmt79bokadq5kq',
        article_paragraphs: [
            { number: 1, text: 'This is Lisa. Her Aunt comes. Ben is her cousin.' },
            { number: 2, text: 'They play in the park. "Where is the ball?" says Ben. The ball is red!' },
        ],
        comprehension_questions: [
            { number: 1, question: 'Who is Ben?', options: ["Lisa's brother", "Lisa's cousin", "Lisa's friend"] },
            { number: 2, question: 'What color is the ball?', options: ['Blue', 'Yellow', 'red'] },
        ],
        mc_answers: [
            { number: 1, letter: 'b', text: "Lisa's cousin" },
            { number: 2, letter: 'c', text: 'red' },
        ],
        short_answer_question: 'Who comes to Lisa?',
        sentence_starters: ['I think...', 'The article says...'],
        vocab_fill: [
            { number: 1, sentence: 'Her <span class="blank"></span> comes.' },
            { number: 2, sentence: 'Ben is her <span class="blank"></span>.' },
        ],
        vocab_fill_answer_string: '1. Aunt, 2. cousin',
        sentence_order_questions: [{ words: ['Lisa', 'is', 'This'] }],
        sentence_order_answers: [{ number: 1, sentence: 'This is Lisa.' }],
        sentence_completion_prompts: [{ number: 1, prompt: 'This is Lisa' }],
        writing_prompt: "Tell about Lisa's family.",
        translation_paragraphs: [
            { label: 'Paragraph 1', text: 'นี่คือลิซ่า ป้าของเธอมา เบ็นเป็นลูกพี่ลูกน้องของเธอ' },
            { label: 'Paragraph 2', text: 'พวกเขาเล่นในสวนสาธารณะ ลูกบอลเป็นสีแดง' },
        ],
    };
}

const OPTS = { book: 'origins-2', lesson: 'L05', number: 5, key: 'o2/5', file: 'primary/origins-2-a0/05-A New Ball Game _workbook.json' };
const ctx: PackageCheckContext = { index: fixtureIndex, prior: [], objectiveIds: FIXTURE_OBJECTIVES };
const make = () => LessonPackageSchema.parse(printedToPackage(printed(), OPTS));
const find = (pkg: unknown, id: string) => checkPackage(pkg, ctx).checks.find((c) => c.id === id);

describe('printed lesson → package', () => {
    it('reads the app article id from the article URL', () => {
        expect(printedArticleId('https://primary.reading-advantage.com/student/read/cmgqx3ase02kmt79bokadq5kq')).toBe('cmgqx3ase02kmt79bokadq5kq');
        expect(printedArticleId('')).toBeUndefined();
    });

    it('copies the meta, the level, and the printed source', () => {
        const pkg = make();
        expect(pkg.meta).toMatchObject({ book: 'origins-2', lesson: 'L05', number: 5, key: 'o2/5', title: 'A New Ball Game', raLevel: 2, cefrLevel: 'A0', appType: 'fiction', genre: 'Family & Friends' });
        expect(pkg.meta.printed).toMatchObject({ file: OPTS.file, articleId: 'cmgqx3ase02kmt79bokadq5kq', imageUrls: ['https://storage.googleapis.com/primary-app-storage/images/cabc_1.png'] });
        expect(pkg.meta.printed?.thaiParagraphs).toHaveLength(2);
        expect(pkg.db).toEqual({});
    });

    it('keeps the paragraphs and the vocabulary words, and finds an example sentence for each word', () => {
        const pkg = make();
        expect(pkg.text.paragraphs).toEqual(['This is Lisa. Her Aunt comes. Ben is her cousin.', 'They play in the park. "Where is the ball?" says Ben. The ball is red!']);
        expect(pkg.text.glossed).toEqual(['Aunt', 'cousin', 'park']);
        expect(pkg.glossary.map((g) => [g.word, g.pos, g.example])).toEqual([
            ['Aunt', TODO, 'Her Aunt comes.'],
            ['cousin', TODO, 'Ben is her cousin.'],
            ['park', TODO, 'They play in the park.'],
        ]);
        expect(pkg.glossary[0]).toMatchObject({ definition: 'The sister of your father or mother.', thai: 'ป้า/น้า' });
    });

    it('pairs the printed Thai with the sentences when the counts match, and leaves it empty when not', () => {
        const pkg = make();
        expect(pkg.thai.paragraphs[0]).toEqual([
            { en: 'This is Lisa.', th: 'นี่คือลิซ่า' },
            { en: 'Her Aunt comes.', th: 'ป้าของเธอมา' },
            { en: 'Ben is her cousin.', th: 'เบ็นเป็นลูกพี่ลูกน้องของเธอ' },
        ]);
        expect(pkg.thai.paragraphs[1].map((p) => p.en)).toEqual(['They play in the park.', '"Where is the ball?" says Ben.', 'The ball is red!']);
        expect(pkg.thai.paragraphs[1].every((p) => p.th === '')).toBe(true);
    });

    it('makes the printed questions the print set, with the answer from the letter', () => {
        const pkg = make();
        expect(pkg.bank.mcq.map((q) => [q.id, q.answer, q.options.length])).toEqual([
            ['p1', "Lisa's cousin", 3],
            ['p2', 'red', 3],
        ]);
        expect(pkg.bank.mcq[1].evidence).toBe('The ball is red!');
        expect(pkg.bank.mcq[0].evidence).toBe(TODO);
        expect(pkg.bank.saq).toEqual([{ id: 's1', question: 'Who comes to Lisa?', answer: TODO, objectives: [] }]);
        expect(pkg.print).toMatchObject({ mcq: ['p1', 'p2'], saq: 's1', mcqOptions: 3 });
    });

    it('copies the activities, with ___ for the blank and the answers from the answer string', () => {
        const a = make().activities;
        expect(a.vocabFill).toEqual([
            { sentence: 'Her ___ comes.', answer: 'Aunt' },
            { sentence: 'Ben is her ___.', answer: 'cousin' },
        ]);
        expect(a.sentenceOrder).toEqual(['This is Lisa.']);
        expect(a.sentenceCompletion).toEqual(['This is Lisa']);
        expect(a.sentenceStarters).toEqual(['I think...', 'The article says...']);
        expect(a.writingPrompt).toBe("Tell about Lisa's family.");
    });

    it("gives the app's picture of today for each position (the bucket path when the file lists none)", () => {
        const printedSource = make().meta.printed!;
        expect(oldPictureUrl(printedSource, 0)).toBe('https://storage.googleapis.com/primary-app-storage/images/cabc_1.png');
        expect(oldPictureUrl(printedSource, 2)).toBe('https://storage.googleapis.com/primary-app-storage/images/cmgqx3ase02kmt79bokadq5kq_3.png');
    });

    it('plans 3 pictures with prompts to write', () => {
        const pkg = make();
        expect(pkg.images.map((i) => [i.position, i.prompt])).toEqual([
            ['hero', TODO],
            ['inline-para-2', TODO],
            ['inline-para-3', TODO],
        ]);
        expect(pkg.images[0].caption).toBe('Lisa plays a new game with Pip.');
    });
});

describe('checks for printed lessons', () => {
    it('lists what is left to write', () => {
        const todo = find(make(), 'todo');
        expect(todo?.status).toBe('fail');
        expect(todo?.detail).toMatch(/glossary part of speech \(3\)/);
        expect(todo?.detail).toMatch(/MCQ evidence \(1\)/);
        expect(todo?.detail).toMatch(/SAQ answer \(1\)/);
        expect(todo?.detail).toMatch(/picture prompt \(3\)/);
    });

    it('passes the lock, and fails it when a locked part changes', () => {
        expect(find(make(), 'locked')?.status).toBe('pass');
        const fourth = make();
        fourth.bank.mcq[0].options.push("Lisa's teacher");
        expect(find(fourth, 'locked')?.status).toBe('pass');
        const edited = make();
        edited.text.paragraphs[0] = 'This is Lisa. Her Aunt comes today. Ben is her cousin.';
        edited.glossary[2].word = 'parks';
        edited.bank.mcq[1].answer = 'Blue';
        const locked = find(edited, 'locked');
        expect(locked?.status).toBe('fail');
        expect(locked?.detail).toMatch(/paragraphs[\s\S]*vocabulary[\s\S]*printed questions/);
    });

    it('does not run the text profile on the locked text, and counts the glossary against the printed words', () => {
        const pkg = make();
        expect(find(pkg, 'text')).toMatchObject({ status: 'pass', label: 'Text check (printed text, locked)' });
        expect(find(pkg, 'glossary')?.detail ?? '').not.toMatch(/entries \(need/);
        expect(PRIMARY_SHAPE.glossary).not.toBe(pkg.glossary.length);
    });

    it('only warns about a printed activity defect, because the activity is on paper', () => {
        const raw = printed();
        raw.vocab_fill[1].sentence = 'Ben is her cousin.';
        const activities = find(LessonPackageSchema.parse(printedToPackage(raw, OPTS)), 'activities');
        expect(activities).toMatchObject({ status: 'warn', label: 'Workbook activities (printed, locked)' });
        expect(activities?.detail).toMatch(/fill 2: no ___ blank/);
    });

    it('only warns when too few printed MCQs test a target objective, because the questions are on paper', () => {
        const pkg = make();
        pkg.tags.targetObjectives = ['R21.2'];
        const printSet = find(pkg, 'print-set');
        expect(printSet).toMatchObject({ status: 'warn', label: 'Print set (printed, locked)' });
        expect(printSet?.detail).toMatch(/0 printed MCQ test a target objective/);
        pkg.print.saq = 's9';
        expect(find(pkg, 'print-set')?.status).toBe('fail');
    });

    it('has no lock or todo check for a new lesson', async () => {
        const { fixturePackage } = await import('./fixtures/lesson-package-fixture');
        const ids = checkPackage(fixturePackage(), ctx).checks.map((c) => c.id);
        expect(ids).not.toContain('locked');
        expect(ids).not.toContain('todo');
    });
});
