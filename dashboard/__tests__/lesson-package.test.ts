// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { LessonPackageSchema, type LessonPackageInput } from '../lib/lesson-package/schema';
import { checkPackage, PRIMARY_SHAPE, type PackageCheckContext } from '../lib/lesson-package/checks';
import { buildWorkbookLesson, stableLessonUrl } from '../lib/lesson-package/build';
import { WorkbookLessonSchema } from '../lib/workbook-schema';
import {
    fixturePackage,
    fixtureIndex,
    FIXTURE_PROFILE,
    FIXTURE_SHAPE,
    FIXTURE_OBJECTIVES,
} from './fixtures/lesson-package-fixture';

const ctx: PackageCheckContext = {
    index: fixtureIndex,
    prior: [],
    profile: FIXTURE_PROFILE,
    shape: FIXTURE_SHAPE,
    objectiveIds: FIXTURE_OBJECTIVES,
};

function run(change?: (p: LessonPackageInput) => void) {
    const pkg = fixturePackage();
    change?.(pkg);
    return checkPackage(pkg, ctx);
}

function status(report: ReturnType<typeof run>, id: string) {
    return report.checks.find((c) => c.id === id)?.status;
}

describe('LessonPackageSchema', () => {
    it('parses the fixture and fills the defaults', () => {
        const pkg = LessonPackageSchema.parse(fixturePackage());
        expect(pkg.approval.text.status).toBe('draft');
        expect(pkg.print.mcqOptions).toBe(3);
        expect(pkg.db).toEqual({});
    });

    it.each(['meta', 'text', 'glossary', 'bank', 'print', 'activities', 'thai', 'images', 'tags'] as const)(
        'fails when the "%s" part is missing',
        (part) => {
            const pkg = fixturePackage() as Record<string, unknown>;
            delete pkg[part];
            expect(LessonPackageSchema.safeParse(pkg).success).toBe(false);
        },
    );

    it('accepts a draft with an empty bank, so the text can be approved first', () => {
        const pkg = fixturePackage();
        pkg.bank = { mcq: [], saq: [], laq: [] };
        expect(LessonPackageSchema.safeParse(pkg).success).toBe(true);
    });

    it('rejects a key that is not book/number', () => {
        const pkg = fixturePackage();
        pkg.meta.key = 'Origins 3.2 lesson 5';
        expect(LessonPackageSchema.safeParse(pkg).success).toBe(false);
    });
});

describe('checkPackage', () => {
    it('passes every check on the fixture', () => {
        const r = run();
        expect(r.checks.filter((c) => c.status !== 'pass')).toEqual([]);
    });

    it('fails "schema" and stops when the package does not parse', () => {
        const r = checkPackage({ version: 2 }, ctx);
        expect(r.checks.map((c) => [c.id, c.status])).toEqual([['schema', 'fail']]);
    });

    it('fails "text" when the text check has a FAIL', () => {
        const r = run((p) => {
            p.text.paragraphs = [p.text.paragraphs.join(' ')];
        });
        expect(status(r, 'text')).toBe('fail');
        expect(r.text?.checks.find((c) => c.id === 'paragraphs')?.status).toBe('fail');
    });

    it('fails "bank-size" when a count is wrong', () => {
        expect(status(run((p) => p.bank.laq.push({ id: 'l2', question: 'Why is Pip happy?', objectives: ['R17.2'] })), 'bank-size')).toBe('fail');
    });

    it('fails "mcq-answer" when the answer is not an option, an option repeats, or the count is wrong', () => {
        expect(status(run((p) => (p.bank.mcq[0].answer = 'on the sofa')), 'mcq-answer')).toBe('fail');
        expect(status(run((p) => (p.bank.mcq[1].options = ['red', 'red', 'blue', 'green'])), 'mcq-answer')).toBe('fail');
        expect(status(run((p) => (p.bank.mcq[2].options = ['a cat', 'a puppy', 'a ball'])), 'mcq-answer')).toBe('fail');
    });

    it('fails "mcq-evidence" when the evidence is not in the text', () => {
        expect(status(run((p) => (p.bank.mcq[0].evidence = 'The ball is on the bed.')), 'mcq-evidence')).toBe('fail');
    });

    it('warns on "bank-level" and lists the words above Starters', () => {
        const r = run((p) => (p.bank.saq[1].question = 'Is Pip at the pond?'));
        const c = r.checks.find((x) => x.id === 'bank-level');
        expect(c?.status).toBe('warn');
        expect(c?.detail).toContain('pond');
    });

    it('fails "bank-unique" when two stems of one type match after normalization', () => {
        expect(status(run((p) => (p.bank.mcq[2].question = 'where is the BALL')), 'bank-unique')).toBe('fail');
    });

    it('fails "print-set" on an unknown id, a wrong count, or too few objective questions', () => {
        expect(status(run((p) => (p.print.mcq = ['m1', 'm9'])), 'print-set')).toBe('fail');
        expect(status(run((p) => (p.print.mcq = ['m1'])), 'print-set')).toBe('fail');
        expect(status(run((p) => (p.print.saq = 's9')), 'print-set')).toBe('fail');
        const none = run((p) => {
            p.bank.mcq[0].objectives = [];
            p.bank.mcq[1].objectives = [];
        });
        expect(status(none, 'print-set')).toBe('fail');
    });

    it('fails "glossary" when the words differ from the glossed list or Thai is missing', () => {
        expect(status(run((p) => (p.glossary[0].word = 'chair')), 'glossary')).toBe('fail');
        expect(status(run((p) => (p.glossary[1].thai = '')), 'glossary')).toBe('fail');
    });

    it('fails "thai" when a sentence has no Thai, the Thai is not Thai script, or the English does not match the text', () => {
        expect(status(run((p) => (p.thai.paragraphs[0][1].th = '')), 'thai')).toBe('fail');
        expect(status(run((p) => (p.thai.paragraphs[0][1].th = 'Pip is a puppy')), 'thai')).toBe('fail');
        expect(status(run((p) => (p.thai.paragraphs[1][0].en = 'Where is it?')), 'thai')).toBe('fail');
        expect(status(run((p) => (p.thai.summary = '')), 'thai')).toBe('fail');
    });

    it('fails "activities" when a count is wrong or a fill sentence has no blank', () => {
        expect(status(run((p) => (p.activities.sentenceStarters = [])), 'activities')).toBe('fail');
        expect(status(run((p) => (p.activities.vocabFill[0].sentence = 'Pip is a small brown puppy.')), 'activities')).toBe('fail');
    });

    it('fails "tags" on an unknown objective id and warns on "tags-coverage" for an untagged item', () => {
        expect(status(run((p) => (p.bank.saq[0].objectives = ['X99.9'])), 'tags')).toBe('fail');
        expect(status(run((p) => (p.bank.laq[0].objectives = [])), 'tags-coverage')).toBe('warn');
    });

    it('uses the Primary shape by default', () => {
        expect(PRIMARY_SHAPE).toMatchObject({ glossary: 12, mcq: 10, saq: 5, laq: 5, printMcq: 4, mcqOptions: 4, images: 3 });
    });
});

describe('buildWorkbookLesson', () => {
    const pkg = LessonPackageSchema.parse(fixturePackage());
    const out = buildWorkbookLesson(pkg);

    it('passes the workbook schema', () => {
        expect(WorkbookLessonSchema.safeParse(out).success).toBe(true);
    });

    it('prints the print-set questions in order with the answer and the first two other options', () => {
        expect(out.comprehension_questions).toEqual([
            { number: 1, question: 'Where is the ball?', options: ['under the sofa', 'on the bed', 'in the cat'] },
            { number: 2, question: 'What color is the ball?', options: ['blue', 'red', 'green'] },
        ]);
        expect(out.mc_answers).toEqual([
            { number: 1, letter: 'a', text: 'under the sofa' },
            { number: 2, letter: 'b', text: 'red' },
        ]);
        expect(out.short_answer_question).toBe('Where is the ball?');
    });

    it('builds the vocabulary, the match activity, and its answer string', () => {
        expect(out.vocabulary.map((v) => v.word)).toEqual(['sofa', 'under', 'puppy']);
        expect(out.vocabulary[0].thai_definition).toBe('โซฟา');
        const match = out.vocab_match ?? [];
        expect(match).toHaveLength(3);
        for (const m of match) {
            const entry = pkg.glossary.find((g) => g.word === m.word);
            const letterOfDefinition = match.find((x) => x.definition === entry?.definition)?.letter;
            expect(out.vocab_match_answer_string).toContain(`${m.number}. ${letterOfDefinition}`);
        }
    });

    it('builds the fill activity with a blank, a word bank, and the answer string', () => {
        expect(out.vocab_fill).toEqual([{ number: 1, sentence: 'Pip is a small brown <span class="blank"></span>.' }]);
        expect(out.vocab_word_bank).toContain('puppy');
        expect(out.vocab_fill_answer_string).toBe('1. puppy');
    });

    it('scrambles each order sentence and keeps the answer', () => {
        const q = out.sentence_order_questions?.[0].words ?? [];
        expect([...q].sort()).toEqual(['Pip', 'happy', 'is'].sort());
        expect(q.join(' ')).not.toBe('Pip is happy');
        expect(out.sentence_order_answers).toEqual([{ number: 1, sentence: 'Pip is happy.' }]);
    });

    it('builds the Thai paragraphs and the stable URL', () => {
        expect(out.translation_paragraphs?.[0]).toEqual({
            label: 'Paragraph 1',
            text: 'นี่คือปิ๊ป ปิ๊ปเป็นลูกสุนัขตัวเล็กสีน้ำตาล ปิ๊ปเห็นลูกบอลสีแดง',
        });
        expect(out.article_url).toBe(stableLessonUrl(pkg));
        expect(stableLessonUrl(pkg)).toBe('https://primary.reading-advantage.com/b/tb/1');
    });

    it('never prints a match activity or an order item in the answer order', () => {
        for (let n = 1; n <= 20; n++) {
            const small = LessonPackageSchema.parse(fixturePackage());
            small.meta.key = `tb/${n}`;
            small.glossary = small.glossary.slice(0, 2);
            small.activities.sentenceOrder = ['Pip runs.'];
            const built = buildWorkbookLesson(small);
            expect(built.vocab_match?.[0].definition).not.toBe(small.glossary[0].definition);
            expect(built.sentence_order_questions?.[0].words).toEqual(['runs', 'Pip']);
        }
    });

    it('is deterministic', () => {
        expect(buildWorkbookLesson(pkg)).toEqual(out);
    });
});
