// @vitest-environment node
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkStorytimeWeek } from '../lib/storytime/checks';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import * as storytime from '../lib/storytime/schema';
import { STORYTIME_APPROVAL_PARTS, StorytimeAppApprovalSchema, StorytimeWeekSchema } from '../lib/storytime/schema';

// Phase 1 schema test of the storytime_teaching_loops_20261103 track (FR-1). It loads the shipped
// weeks w01 to w08 and builds edited copies in memory. No shipped file changes.
//
// Red notes: the schema has no blendDrill, soundLoop, sightWords, loopMinutes, questions, recall,
// or approval.loops field yet, and no StorytimeLoopsApprovalSchema export. New fields are reached
// through untyped casts (F11), so tsc --noEmit passes before and after Green. Every assertion of a
// parsed value fails at Red because the new key is stripped (F1, A4).

function loadWeek(week: number): any {
    const file = storytimeWeekFile(STORYTIME_ROOT, 2, week);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function step(week: any, scriptId: string, stepId: string): any {
    const script = week.scripts.find((s: any) => s.id === scriptId);
    return script.steps.find((st: any) => st.id === stepId);
}

function readAlong(week: any): any {
    return week.books.find((b: any) => b.kind === 'readalong');
}

type ZodParser = { parse: (input: unknown) => unknown; safeParse: (input: unknown) => { success: boolean } };

/** The new export, reached through a namespace import so that a missing export is an assertion. */
function loopsApprovalSchema(): ZodParser {
    const mod = storytime as unknown as Record<string, ZodParser>;
    const instance = mod.StorytimeLoopsApprovalSchema;
    expect(instance, 'Missing export: StorytimeLoopsApprovalSchema').toBeDefined();
    return instance;
}

const VALID_BLEND_DRILL = {
    words: [
        { word: 'cat', sounds: ['/k/', '/a/', '/t/'], audio: ['l2/phonemes/daniel/04-k.mp3', 'l2/phonemes/daniel/04-a.mp3', 'l2/phonemes/daniel/04-t.mp3'] },
        { word: 'hat', sounds: ['/h/', '/a/', '/t/'], audio: ['l2/phonemes/daniel/04-h.mp3', 'l2/phonemes/daniel/04-a.mp3', 'l2/phonemes/daniel/04-t.mp3'] },
        { word: 'fan', sounds: ['/f/', '/a/', '/n/'], audio: ['l2/phonemes/daniel/04-f.mp3', 'l2/phonemes/daniel/04-a.mp3', 'l2/phonemes/daniel/04-n.mp3'] },
    ],
    model: { en: 'Say it like me: cat.', th: '' },
    lead: { en: 'Say it with me: cat.', th: '' },
    test: { en: 'Say it yourself: cat.', th: '' },
    repeats: 3,
    correction: { en: 'Hear /k/. Say /k/ first.', th: '' },
};

const VALID_SOUND_LOOP = {
    correct: { en: 'Hear /n/ again.', th: '' },
    practise: { en: 'Say /n/ with me.', th: '' },
    retest: { en: 'Say /n/ yourself.', th: '' },
};

const VALID_SIGHT_WORDS = {
    words: ['a', 'I'],
    slide: { en: 'Slide your finger under the word.', th: '' },
    check: { en: 'Read it the fast way.', th: '' },
    seconds: 3,
};

const VALID_QUESTIONS = [
    { kind: 'who', ask: { en: 'Who naps?', th: '' }, answer: { page: 1, word: 'Nan' } },
    { kind: 'what', ask: { en: 'What does Nan do?', th: '' }, answer: { page: 2, word: 'nap' } },
    { kind: 'where', ask: { en: 'Where is the cat?', th: '' }, answer: { page: 3, word: 'mat' } },
];

const VALID_RECALL = {
    items: [
        { kind: 'sound', text: 'n', week: 1 },
        { kind: 'tricky', text: 'a', week: 1 },
        { kind: 'frame', text: 'I can see a ___.', week: 1 },
        { kind: 'word', text: 'cat', week: 2 },
        { kind: 'word', text: 'hat', week: 2 },
    ],
    ask: { en: 'Read these cards.', th: '' },
};

const APPROVED_WORDS = 'Approved by Daniel.';
const APPROVED_DATE = '2026-11-16';

function validCopy(week = 2): any {
    const w = loadWeek(week);
    step(w, 'A', 'A4').blendDrill = JSON.parse(JSON.stringify(VALID_BLEND_DRILL));
    for (const sid of ['A1', 'A2', 'A3']) step(w, 'A', sid).soundLoop = JSON.parse(JSON.stringify(VALID_SOUND_LOOP));
    step(w, 'A', 'A6').sightWords = JSON.parse(JSON.stringify(VALID_SIGHT_WORDS));
    step(w, 'D', 'D2').sightWords = JSON.parse(JSON.stringify(VALID_SIGHT_WORDS));
    step(w, 'A', 'A4').loopMinutes = 3;
    readAlong(w).questions = JSON.parse(JSON.stringify(VALID_QUESTIONS));
    w.scripts[0].recall = JSON.parse(JSON.stringify(VALID_RECALL));
    w.approval.loops = { status: 'approved', words: APPROVED_WORDS, date: APPROVED_DATE };
    return w;
}

function withBlendDrill(mutate: (drill: any) => void): any {
    const drill = JSON.parse(JSON.stringify(VALID_BLEND_DRILL));
    mutate(drill);
    const w = loadWeek(2);
    step(w, 'A', 'A4').blendDrill = drill;
    return w;
}

function withSightWords(mutate: (sight: any) => void): any {
    const sight = JSON.parse(JSON.stringify(VALID_SIGHT_WORDS));
    mutate(sight);
    const w = loadWeek(2);
    step(w, 'A', 'A6').sightWords = sight;
    return w;
}

describe('shipped weeks and the loops default', () => {
    it('parses the eight shipped weeks', () => {
        for (let n = 1; n <= 8; n++) {
            expect(StorytimeWeekSchema.safeParse(loadWeek(n)).success, `w0${n} parses`).toBe(true);
        }
    });

    it('defaults approval.loops to draft when the key is absent', () => {
        for (let n = 1; n <= 8; n++) {
            const w = loadWeek(n);
            delete w.approval.loops;
            const parsed: any = StorytimeWeekSchema.parse(w);
            expect(parsed.approval.loops, `w0${n} approval.loops defaults`).toEqual({ status: 'draft' });
        }
    });
});

describe('valid fields parse and keep their values', () => {
    it('parses a w02 copy with every new field (L2)', () => {
        const parsed: any = StorytimeWeekSchema.parse(validCopy(2));
        expect(step(parsed, 'A', 'A4').blendDrill).toEqual(VALID_BLEND_DRILL);
        expect(step(parsed, 'A', 'A1').soundLoop).toEqual(VALID_SOUND_LOOP);
        expect(step(parsed, 'A', 'A2').soundLoop).toEqual(VALID_SOUND_LOOP);
        expect(step(parsed, 'A', 'A3').soundLoop).toEqual(VALID_SOUND_LOOP);
        expect(step(parsed, 'A', 'A6').sightWords).toEqual(VALID_SIGHT_WORDS);
        expect(step(parsed, 'D', 'D2').sightWords).toEqual(VALID_SIGHT_WORDS);
        expect(step(parsed, 'A', 'A4').loopMinutes).toBe(3);
        expect(readAlong(parsed).questions).toEqual(VALID_QUESTIONS);
        expect(parsed.scripts[0].recall).toEqual(VALID_RECALL);
        expect(parsed.approval.loops).toEqual({ status: 'approved', words: APPROVED_WORDS, date: APPROVED_DATE });
    });
});

describe('bounds and strictness', () => {
    it('bounds blendDrill.words to 3..5', () => {
        expect(StorytimeWeekSchema.safeParse(withBlendDrill((d) => (d.words = d.words.slice(0, 2)))).success).toBe(false);
        expect(StorytimeWeekSchema.safeParse(withBlendDrill((d) => (d.words = [...d.words, d.words[0], d.words[1], d.words[2]]))).success).toBe(false);
        const three: any = StorytimeWeekSchema.parse(withBlendDrill(() => undefined));
        expect(step(three, 'A', 'A4').blendDrill.words).toHaveLength(3);
        const five: any = StorytimeWeekSchema.parse(withBlendDrill((d) => (d.words = [...d.words, { word: 'mat', sounds: ['/m/', '/a/', '/t/'] }, { word: 'sat', sounds: ['/s/', '/a/', '/t/'] }])));
        expect(step(five, 'A', 'A4').blendDrill.words).toHaveLength(5);
    });

    it('bounds blendDrill.sounds to 2..4 labels', () => {
        expect(StorytimeWeekSchema.safeParse(withBlendDrill((d) => (d.words[0].sounds = ['/k/']))).success).toBe(false);
        expect(StorytimeWeekSchema.safeParse(withBlendDrill((d) => (d.words[0].sounds = ['/k/', '/a/', '/t/', '/s/', '/p/']))).success).toBe(false);
        const two: any = StorytimeWeekSchema.parse(withBlendDrill((d) => (d.words[0].sounds = ['/k/', '/a/'])));
        expect(step(two, 'A', 'A4').blendDrill.words[0].sounds).toEqual(['/k/', '/a/']);
        const four: any = StorytimeWeekSchema.parse(withBlendDrill((d) => (d.words[0].sounds = ['/k/', '/a/', '/t/', '/s/'])));
        expect(step(four, 'A', 'A4').blendDrill.words[0].sounds).toHaveLength(4);
    });

    it('bounds blendDrill.repeats to 2..5', () => {
        expect(StorytimeWeekSchema.safeParse(withBlendDrill((d) => (d.repeats = 1))).success).toBe(false);
        expect(StorytimeWeekSchema.safeParse(withBlendDrill((d) => (d.repeats = 6))).success).toBe(false);
        const two: any = StorytimeWeekSchema.parse(withBlendDrill((d) => (d.repeats = 2)));
        expect(step(two, 'A', 'A4').blendDrill.repeats).toBe(2);
        const five: any = StorytimeWeekSchema.parse(withBlendDrill((d) => (d.repeats = 5)));
        expect(step(five, 'A', 'A4').blendDrill.repeats).toBe(5);
    });

    it('bounds sightWords.words to 1..3', () => {
        expect(StorytimeWeekSchema.safeParse(withSightWords((s) => (s.words = []))).success).toBe(false);
        expect(StorytimeWeekSchema.safeParse(withSightWords((s) => (s.words = ['a', 'I', 'and', 'on']))).success).toBe(false);
        const one: any = StorytimeWeekSchema.parse(withSightWords((s) => (s.words = ['a'])));
        expect(step(one, 'A', 'A6').sightWords.words).toEqual(['a']);
        const three: any = StorytimeWeekSchema.parse(withSightWords((s) => (s.words = ['a', 'I', 'and'])));
        expect(step(three, 'A', 'A6').sightWords.words).toHaveLength(3);
    });

    it('bounds sightWords.seconds to 2..5', () => {
        expect(StorytimeWeekSchema.safeParse(withSightWords((s) => (s.seconds = 1))).success).toBe(false);
        expect(StorytimeWeekSchema.safeParse(withSightWords((s) => (s.seconds = 6))).success).toBe(false);
        const two: any = StorytimeWeekSchema.parse(withSightWords((s) => (s.seconds = 2)));
        expect(step(two, 'A', 'A6').sightWords.seconds).toBe(2);
        const five: any = StorytimeWeekSchema.parse(withSightWords((s) => (s.seconds = 5)));
        expect(step(five, 'A', 'A6').sightWords.seconds).toBe(5);
    });

    it('bounds loopMinutes to 0..20 and fails 21', () => {
        const w = loadWeek(2);
        step(w, 'A', 'A4').loopMinutes = 21;
        expect(StorytimeWeekSchema.safeParse(w).success).toBe(false);
        const zero = loadWeek(2);
        step(zero, 'A', 'A4').loopMinutes = 0;
        expect(step(StorytimeWeekSchema.parse(zero), 'A', 'A4').loopMinutes).toBe(0);
        const twenty = loadWeek(2);
        step(twenty, 'A', 'A4').loopMinutes = 20;
        expect(step(StorytimeWeekSchema.parse(twenty), 'A', 'A4').loopMinutes).toBe(20);
    });

    it('fails a read-along with 2 or 4 questions, and a kind twice', () => {
        const two = loadWeek(2);
        readAlong(two).questions = VALID_QUESTIONS.slice(0, 2);
        expect(StorytimeWeekSchema.safeParse(two).success).toBe(false);
        const four = loadWeek(2);
        readAlong(four).questions = [...VALID_QUESTIONS, VALID_QUESTIONS[0]];
        expect(StorytimeWeekSchema.safeParse(four).success).toBe(false);
        const twice = loadWeek(2);
        readAlong(twice).questions = [VALID_QUESTIONS[0], VALID_QUESTIONS[0], VALID_QUESTIONS[1]];
        expect(StorytimeWeekSchema.safeParse(twice).success).toBe(false);
    });

    it('fails a question kind outside who, what, where', () => {
        const w = loadWeek(2);
        readAlong(w).questions = [{ kind: 'when', ask: { en: 'When?', th: '' }, answer: { page: 1, word: 'Nan' } }, VALID_QUESTIONS[1], VALID_QUESTIONS[2]];
        expect(StorytimeWeekSchema.safeParse(w).success).toBe(false);
    });

    it('parses answer.page 0 (the schema has no bound; Q2)', () => {
        const w = loadWeek(2);
        readAlong(w).questions = [{ ...VALID_QUESTIONS[0], answer: { page: 0, word: 'Nan' } }, VALID_QUESTIONS[1], VALID_QUESTIONS[2]];
        const parsed: any = StorytimeWeekSchema.parse(w);
        expect(readAlong(parsed).questions[0].answer.page).toBe(0);
    });

    it('does not length-check recall.items (4 and 6 parse), and fails a card kind outside the four', () => {
        const four = loadWeek(2);
        w_recall(four, VALID_RECALL.items.slice(0, 4));
        const parsedFour: any = StorytimeWeekSchema.parse(four);
        expect(parsedFour.scripts[0].recall.items).toHaveLength(4);
        const six = loadWeek(2);
        w_recall(six, [...VALID_RECALL.items, { kind: 'word', text: 'mat', week: 2 }]);
        const parsedSix: any = StorytimeWeekSchema.parse(six);
        expect(parsedSix.scripts[0].recall.items).toHaveLength(6);
        const bad = loadWeek(2);
        w_recall(bad, [{ kind: 'letter', text: 'n', week: 1 }, ...VALID_RECALL.items.slice(1)]);
        expect(StorytimeWeekSchema.safeParse(bad).success).toBe(false);
    });

    it('fails an unknown key in a new object and a misspelled key (Q3, strict)', () => {
        const unknown = withBlendDrill((d) => (d.extra = 'x'));
        expect(StorytimeWeekSchema.safeParse(unknown).success).toBe(false);
        const misspelled = loadWeek(2);
        step(misspelled, 'A', 'A4').blendDrill = { ...VALID_BLEND_DRILL, correcton: { en: 'typo', th: '' } };
        expect(StorytimeWeekSchema.safeParse(misspelled).success).toBe(false);
    });
});

function w_recall(w: any, items: unknown[]): void {
    w.scripts[0].recall = { items, ask: VALID_RECALL.ask };
}

describe('approval guards (characterization, pass at Red)', () => {
    it('keeps the six approval parts exactly, without loops', () => {
        expect([...STORYTIME_APPROVAL_PARTS]).toEqual(['text', 'thai', 'images', 'audio', 'song', 'scripts']);
        expect((STORYTIME_APPROVAL_PARTS as readonly string[]).includes('loops')).toBe(false);
    });

    it('parses an approved app part with only status and date to an equal object', () => {
        expect(StorytimeAppApprovalSchema.parse({ status: 'approved', date: '2026-10-23' })).toEqual({ status: 'approved', date: '2026-10-23' });
    });

    it('parses an approved app part with status only (baseline; no refine on the app part)', () => {
        expect(StorytimeAppApprovalSchema.parse({ status: 'approved' })).toEqual({ status: 'approved' });
    });
});

describe('StorytimeLoopsApprovalSchema refine', () => {
    it('fails an approved loops part without words', () => {
        expect(loopsApprovalSchema().safeParse({ status: 'approved', date: APPROVED_DATE }).success).toBe(false);
    });

    it('fails an approved loops part without date', () => {
        expect(loopsApprovalSchema().safeParse({ status: 'approved', words: APPROVED_WORDS }).success).toBe(false);
    });

    it('fails an approved loops part with an empty date or blank words', () => {
        expect(loopsApprovalSchema().safeParse({ status: 'approved', words: APPROVED_WORDS, date: '' }).success).toBe(false);
        expect(loopsApprovalSchema().safeParse({ status: 'approved', words: '   ', date: APPROVED_DATE }).success).toBe(false);
    });

    it('fails an unknown key in the loops part (strict)', () => {
        expect(loopsApprovalSchema().safeParse({ status: 'draft', extra: 'x' }).success).toBe(false);
    });

    it('parses an approved loops part with both, and a draft part without both', () => {
        expect(loopsApprovalSchema().parse({ status: 'approved', words: APPROVED_WORDS, date: APPROVED_DATE })).toEqual({
            status: 'approved',
            words: APPROVED_WORDS,
            date: APPROVED_DATE,
        });
        expect(loopsApprovalSchema().parse({ status: 'draft' })).toEqual({ status: 'draft' });
    });
});

describe('published guard (the shipped st2/1 passes since 2026-11-04)', () => {
    it('passes the shipped st2/1 published check, with no detail (audio and song approved 2026-11-04)', () => {
        const report = checkStorytimeWeek(loadWeek(1));
        const pub = report.checks.find((c) => c.id === 'published');
        expect(pub?.status).toBe('pass');
        expect(pub?.detail).toBeUndefined();
    });

    it('passes published on a w01 copy with six approved parts and a draft loops part', () => {
        const w = loadWeek(1);
        const a = { status: 'approved', date: '2026-10-23' };
        for (const part of ['text', 'thai', 'images', 'audio', 'song', 'scripts']) w.approval[part] = { ...a };
        w.approval.loops = { status: 'draft' };
        const report = checkStorytimeWeek(w);
        expect(report.checks.find((c) => c.id === 'published')?.status).toBe('pass');
    });

    it('keeps the shipped published check passing with an explicit draft loops part', () => {
        const w = loadWeek(1);
        w.approval.loops = { status: 'draft' };
        const report = checkStorytimeWeek(w);
        const pub = report.checks.find((c) => c.id === 'published');
        expect(pub?.status).toBe('pass');
        expect(pub?.detail).toBeUndefined();
    });

    it('still reports images not approved when only images is draft (the exclusion is not over-broad)', () => {
        const w = loadWeek(1);
        const a = { status: 'approved', date: '2026-10-23' };
        for (const part of ['text', 'thai', 'audio', 'song', 'scripts']) w.approval[part] = { ...a };
        w.approval.images = { status: 'draft' };
        const report = checkStorytimeWeek(w);
        expect(report.checks.find((c) => c.id === 'published')?.detail).toBe('images not approved');
    });
});

describe('field-name contract for Hand-off 1 (L10)', () => {
    it('pins the exact key set of each new object', () => {
        const parsed: any = StorytimeWeekSchema.parse(validCopy(2));
        const keys = (obj: unknown) => (obj === undefined || obj === null ? [] : Object.keys(obj as object).sort());
        expect(keys(step(parsed, 'A', 'A4').blendDrill)).toEqual(['correction', 'lead', 'model', 'repeats', 'test', 'words']);
        expect(keys(step(parsed, 'A', 'A4').blendDrill.words[0])).toEqual(['audio', 'sounds', 'word']);
        expect(keys(step(parsed, 'A', 'A1').soundLoop)).toEqual(['correct', 'practise', 'retest']);
        expect(keys(step(parsed, 'A', 'A6').sightWords)).toEqual(['check', 'seconds', 'slide', 'words']);
        expect(keys(readAlong(parsed).questions[0])).toEqual(['answer', 'ask', 'kind']);
        expect(keys(readAlong(parsed).questions[0].answer)).toEqual(['page', 'word']);
        expect(keys(parsed.scripts[0].recall)).toEqual(['ask', 'items']);
    });
});
