/**
 * Test constants for the loop-complete sample of track storytime_teaching_loops_20261103 (Phase 1, Red 2).
 * The test applies these routines to a copy of a shipped week. The sample obeys the decisions Q1 (the
 * drill sounds), FR-6 (the recall cards), and FR-7 (the day minutes). The sample is test data, not the
 * week content. Week 1 and week 2 hold a hand-written answer. Weeks 3 to 7 use the same words in a
 * fixed table, so the test does not copy the checker.
 */

/** One drill word: the word and its sound labels in the form of `bankSound`. */
export interface SampleWord {
    word: string;
    sounds: string[];
}

/** English text with its Thai. */
export interface SampleBiText {
    en: string;
    th: string;
}

/** The oral blend drill of step A4 (FR-2). */
export interface SampleBlendDrill {
    words: SampleWord[];
    model: SampleBiText;
    lead: SampleBiText;
    test: SampleBiText;
    repeats: number;
    correction: SampleBiText;
}

/** The correct, practise, retest loop of a sound step (FR-3). */
export interface SampleSoundLoop {
    correct: SampleBiText;
    practise: SampleBiText;
    retest: SampleBiText;
}

/** The fast-way sight-word step of A6 and D2 (FR-4). */
export interface SampleSightWords {
    words: string[];
    slide: SampleBiText;
    check: SampleBiText;
    seconds: number;
}

/** One read-along question (FR-5): the 1-based page and the picture word on it. */
export interface SampleQuestion {
    kind: 'who' | 'what' | 'where';
    ask: SampleBiText;
    answer: { page: number; word: string };
}

/** One recall card (FR-6): a strip card of the given kind. */
export interface SampleRecallItem {
    kind: 'sound' | 'tricky' | 'frame' | 'word';
    text: string;
    week: number;
}

/** The daily recall of the opening (FR-6). */
export interface SampleRecall {
    items: SampleRecallItem[];
    ask: SampleBiText;
}

/** The steps that hold a routine (spec Terms: "loop step"). */
export const LOOP_STEP_IDS = ['A1', 'A2', 'A3', 'A4', 'A6', 'C5', 'D2'] as const;

/** The teach weeks of Level 2 (spec Terms). */
export const TEACH_WEEKS = [1, 2, 3, 4, 5, 6, 7] as const;

/** The review week of Level 2 (spec D11). */
export const REVIEW_WEEK = 8;

const DRILL_LINES = {
    model: { en: 'Say it like me: cat.', th: 'พูดตามครู: cat' },
    lead: { en: 'Say it with me: cat.', th: 'พูดพร้อมครู: cat' },
    test: { en: 'Say it yourself: cat.', th: 'พูดคนเดียว: cat' },
    correction: { en: 'Hear /k/. Say /k/ first.', th: 'ฟังเสียง /k/ แล้วพูดเสียง /k/ ก่อน' },
};

/**
 * The hand-written drill of each teach week. Each sound is a grapheme of `taughtTo` or a sound label
 * of the same week's `opening.pa` lines (Q1). Week 1 blends by ear only (spec D3).
 */
export const SAMPLE_DRILLS: Record<number, SampleBlendDrill> = {
    1: {
        words: [
            { word: 'net', sounds: ['/n/', '/e/', '/t/'] },
            { word: 'nut', sounds: ['/n/', '/u/', '/t/'] },
            { word: 'pen', sounds: ['/p/', '/e/', '/n/'] },
        ],
        ...DRILL_LINES,
        repeats: 3,
    },
    2: {
        words: [
            { word: 'cat', sounds: ['/k/', '/a/', '/t/'] },
            { word: 'hat', sounds: ['/h/', '/a/', '/t/'] },
            { word: 'fan', sounds: ['/f/', '/a/', '/n/'] },
        ],
        ...DRILL_LINES,
        repeats: 3,
    },
    3: {
        words: [
            { word: 'pan', sounds: ['/p/', '/a/', '/n/'] },
            { word: 'pig', sounds: ['/p/', '/i/', '/g/'] },
            { word: 'top', sounds: ['/t/', '/o/', '/p/'] },
        ],
        ...DRILL_LINES,
        repeats: 3,
    },
    4: {
        words: [
            { word: 'map', sounds: ['/m/', '/a/', '/p/'] },
            { word: 'hop', sounds: ['/h/', '/o/', '/p/'] },
            { word: 'jam', sounds: ['/j/', '/a/', '/m/'] },
        ],
        ...DRILL_LINES,
        repeats: 3,
    },
    5: {
        words: [
            { word: 'sun', sounds: ['/s/', '/u/', '/n/'] },
            { word: 'dip', sounds: ['/d/', '/i/', '/p/'] },
            { word: 'pot', sounds: ['/p/', '/o/', '/t/'] },
        ],
        ...DRILL_LINES,
        repeats: 3,
    },
    6: {
        words: [
            { word: 'tap', sounds: ['/t/', '/a/', '/p/'] },
            { word: 'set', sounds: ['/s/', '/e/', '/t/'] },
            { word: 'hat', sounds: ['/h/', '/a/', '/t/'] },
        ],
        ...DRILL_LINES,
        repeats: 3,
    },
    7: {
        words: [
            { word: 'hot', sounds: ['/h/', '/o/', '/t/'] },
            { word: 'mop', sounds: ['/m/', '/o/', '/p/'] },
            { word: 'nod', sounds: ['/n/', '/o/', '/d/'] },
        ],
        ...DRILL_LINES,
        repeats: 3,
    },
};

/** The correct, practise, retest loop of A1 to A3 (FR-3). */
export const SAMPLE_SOUND_LOOP: SampleSoundLoop = {
    correct: { en: 'Hear the sound again: watch my mouth and listen.', th: 'ฟังเสียงอีกครั้ง ดูปากครูแล้วฟังให้ดี' },
    practise: { en: 'Say the sound with me three times.', th: 'พูดเสียงพร้อมครู 3 ครั้ง' },
    retest: { en: 'Say the sound yourself.', th: 'พูดเสียงด้วยตัวเอง' },
};

/**
 * The sight-word step of A6 and D2. The words are the tricky words of the week, in order (FR-4).
 * @param words The tricky words of the week.
 * @returns The sample step.
 */
export function sampleSightWords(words: string[]): SampleSightWords {
    return {
        words: [...words],
        slide: { en: 'Slide your finger under the word and blend the sounds.', th: 'ลากนิ้วใต้คำแล้วผสมเสียง' },
        check: { en: 'Read it the fast way before the timer stops.', th: 'อ่านให้เร็วที่สุดก่อนหมดเวลา' },
        seconds: 3,
    };
}

const ASK: Record<'who' | 'what' | 'where', SampleBiText> = {
    who: { en: 'Who is in the picture?', th: 'ใครอยู่ในภาพ' },
    what: { en: 'What do you see?', th: 'เห็นอะไร' },
    where: { en: 'Where is it?', th: 'อยู่ที่ไหน' },
};

const QUESTION_KINDS = ['who', 'what', 'where'] as const;

/** The hand-written question sets of week 1 and week 2, checked against the shipped reader pages. */
export const HAND_WRITTEN_QUESTIONS: Record<number, SampleQuestion[]> = {
    1: [
        { kind: 'who', ask: ASK.who, answer: { page: 1, word: 'Pat' } },
        { kind: 'what', ask: ASK.what, answer: { page: 3, word: 'Sam' } },
        { kind: 'where', ask: ASK.where, answer: { page: 5, word: 'Nan' } },
    ],
    2: [
        { kind: 'who', ask: ASK.who, answer: { page: 1, word: 'suns' } },
        { kind: 'what', ask: ASK.what, answer: { page: 2, word: 'kites' } },
        { kind: 'where', ask: ASK.where, answer: { page: 6, word: 'friends' } },
    ],
};

/**
 * The last word that has letters in a text.
 * @param text The text.
 * @returns The last whole word, without punctuation.
 */
export function lastWord(text: string): string {
    const words = text.match(/[A-Za-z]+/g) ?? [];
    return words.length ? words[words.length - 1] : '';
}

/**
 * The three questions of a read-along of a teach week (FR-5). Week 1 and week 2 are hand-written.
 * Weeks 3 to 7 answer on pages 1 to 3 with the last word of each page.
 * @param week The week of the level.
 * @param pages The page texts of the read-along.
 * @returns The three questions in the order who, what, where.
 */
export function questionsFor(week: number, pages: string[]): SampleQuestion[] {
    const written = HAND_WRITTEN_QUESTIONS[week];
    if (written) return written.map((q) => ({ kind: q.kind, ask: { ...q.ask }, answer: { ...q.answer } }));
    return QUESTION_KINDS.map((kind, i) => ({ kind, ask: { ...ASK[kind] }, answer: { page: i + 1, word: lastWord(pages[i] ?? '') } }));
}

const RECALL_ASK: SampleBiText = { en: 'Read the cards from the pocket chart.', th: 'อ่านบัตรคำจากตาราง' };

/**
 * The 5 recall cards of each week (FR-6). One list serves every day of the week, because a card may
 * repeat on two days (Q6). Week 1 has no recall on day 1 (spec D6). Week 8 has no new sound or tricky
 * word, so its cards come from the earlier weeks (spec D11).
 */
export const SAMPLE_RECALL: Record<number, SampleRecall> = {
    1: {
        items: [
            { kind: 'sound', text: 'n', week: 1 },
            { kind: 'tricky', text: 'a', week: 1 },
            { kind: 'tricky', text: 'and', week: 1 },
            { kind: 'tricky', text: 'can', week: 1 },
            { kind: 'frame', text: 'Hello, I am ___.', week: 1 },
        ],
        ask: RECALL_ASK,
    },
    2: {
        items: [
            { kind: 'sound', text: 'n', week: 1 },
            { kind: 'sound', text: 'a', week: 2 },
            { kind: 'tricky', text: 'I', week: 2 },
            { kind: 'tricky', text: 'on', week: 2 },
            { kind: 'frame', text: 'How many? One, two...', week: 2 },
        ],
        ask: RECALL_ASK,
    },
    3: {
        items: [
            { kind: 'sound', text: 'n', week: 1 },
            { kind: 'sound', text: 'a', week: 2 },
            { kind: 'tricky', text: 'the', week: 3 },
            { kind: 'tricky', text: 'get', week: 3 },
            { kind: 'frame', text: 'It is ___.', week: 3 },
        ],
        ask: RECALL_ASK,
    },
    4: {
        items: [
            { kind: 'sound', text: 'n', week: 1 },
            { kind: 'sound', text: 'a', week: 2 },
            { kind: 'tricky', text: 'is', week: 4 },
            { kind: 'tricky', text: 'this', week: 4 },
            { kind: 'frame', text: 'This is my ___.', week: 4 },
        ],
        ask: RECALL_ASK,
    },
    5: {
        items: [
            { kind: 'sound', text: 'n', week: 1 },
            { kind: 'sound', text: 'a', week: 2 },
            { kind: 'tricky', text: 'off', week: 5 },
            { kind: 'tricky', text: 'saw', week: 5 },
            { kind: 'frame', text: 'I have two ___.', week: 5 },
        ],
        ask: RECALL_ASK,
    },
    6: {
        items: [
            { kind: 'sound', text: 'n', week: 1 },
            { kind: 'sound', text: 'a', week: 2 },
            { kind: 'tricky', text: 'he', week: 6 },
            { kind: 'tricky', text: 'put', week: 6 },
            { kind: 'frame', text: 'I can see a ___.', week: 6 },
        ],
        ask: RECALL_ASK,
    },
    7: {
        items: [
            { kind: 'sound', text: 'n', week: 1 },
            { kind: 'sound', text: 'a', week: 2 },
            { kind: 'tricky', text: 'from', week: 7 },
            { kind: 'tricky', text: 'run', week: 7 },
            { kind: 'frame', text: 'Is it a ___? Yes/No.', week: 7 },
        ],
        ask: RECALL_ASK,
    },
    8: {
        items: [
            { kind: 'sound', text: 'n', week: 1 },
            { kind: 'sound', text: 'a', week: 2 },
            { kind: 'tricky', text: 'a', week: 1 },
            { kind: 'frame', text: 'Hello, I am ___.', week: 1 },
            { kind: 'word', text: 'cat', week: 2 },
        ],
        ask: RECALL_ASK,
    },
};

/**
 * The sample `loopMinutes` of a step (FR-7). The loops take two minutes from A3 and give them to A4,
 * so the day sum stays `periodMinutes`. Every other loop step keeps its minutes.
 * @param stepId The step id.
 * @param minutes The minutes of the step at the baseline.
 * @returns The sample step minutes.
 */
export function sampleLoopMinutes(stepId: string, minutes: number): number {
    if (stepId === 'A3') return minutes - 1;
    if (stepId === 'A4') return minutes + 1;
    return minutes;
}
