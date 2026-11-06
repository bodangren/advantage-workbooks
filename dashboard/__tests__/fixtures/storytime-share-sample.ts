/**
 * Test constants for the parent-share sample of track storytime_teaching_loops_20261103 (Phase 3b, Red 1).
 *
 * The moment table is typed by hand from the spec FR-14 table. It never comes from a week file and never
 * from the check, so the test does not copy the code it tests (anti-pattern A3). The test applies the table
 * to a copy of a shipped week. The sample is test data, not the week content: the content task of Phase 3b
 * writes the real captions of the eight weeks, and the independent review reads them.
 *
 * The Thai of the sample is one placeholder. It is test input. No test compares a Thai text with a literal
 * (test-strategy 9.4, item 6; the rule of the plan, "Thai").
 */

/** One shot of a share moment: the step of the shot and its media (FR-14). */
export interface SampleShot {
    /** The step id, in the form `A1` (the form of `StepSchema.id`). */
    step: string;
    /** The media of the shot: a photo or a video. */
    media: 'photo' | 'video';
}

/** The share moment of one day: its shots and its caption (FR-14). */
export interface SampleShare {
    /** One or two shots of the day. */
    shots: SampleShot[];
    /** The caption of the post, in English and in Thai. */
    caption: { en: string; th: string };
}

/** The teach weeks of Level 2 (w01 to w07). */
export const TEACH_WEEKS = [1, 2, 3, 4, 5, 6, 7] as const;

/** The review week of Level 2 (w08). */
export const REVIEW_WEEK = 8;

/**
 * The Thai placeholder of every sample caption. It is test input, never an expectation. The Thai of the
 * real captions goes to Daniel on 2026-11-16 (spec D26).
 */
export const SAMPLE_THAI = 'ภาพวิดีโอของเด็กที่ใช้ภาษาอังกฤษในชั้นเรียน';

/** The English caption of each teach-week day. Every caption holds 12 words. */
const TEACH_CAPTIONS: Record<string, string> = {
    A: 'The child says the new sound, says one word, writes the letter.',
    B: 'The child acts the story and says the frame sentence aloud today.',
    C: 'One child reads one page of the book aloud for the class.',
    D: 'A photo shows the written sentence. A video shows the child reading.',
    E: 'The class sings the song of the week with the song gestures.',
};

/** The English caption of each review-week day. Every caption holds 12 words. */
const REVIEW_CAPTIONS: Record<string, string> = {
    A: 'A child reads a page of a unit book aloud at centers.',
    B: 'One child reads one page of a unit book aloud at centers.',
    C: 'One child reads one page of another unit book aloud for us.',
    D: 'The child reads one page of a third unit book aloud today.',
    E: 'The class sings the song of the unit with the song gestures.',
};

/**
 * The moment table of the teach weeks w01 to w07 (spec FR-14): the day 1 shot is A3, the day 2 shot is B5,
 * the day 3 shot is C4, the day 4 moment has the photo at D4 and the video at D5, and the day 5 shot is D6.
 */
export const TEACH_MOMENTS: Record<string, SampleShare> = {
    A: { shots: [{ step: 'A3', media: 'video' }], caption: { en: TEACH_CAPTIONS.A, th: SAMPLE_THAI } },
    B: { shots: [{ step: 'B5', media: 'video' }], caption: { en: TEACH_CAPTIONS.B, th: SAMPLE_THAI } },
    C: { shots: [{ step: 'C4', media: 'video' }], caption: { en: TEACH_CAPTIONS.C, th: SAMPLE_THAI } },
    D: {
        shots: [
            { step: 'D4', media: 'photo' },
            { step: 'D5', media: 'video' },
        ],
        caption: { en: TEACH_CAPTIONS.D, th: SAMPLE_THAI },
    },
    E: { shots: [{ step: 'D6', media: 'video' }], caption: { en: TEACH_CAPTIONS.E, th: SAMPLE_THAI } },
};

/**
 * The moment table of the review week w08 (spec FR-14, D17): the day 1 shot is A2, the day 2 to 4 shots are
 * B1, C1, and D1, and the day 5 shot is E3.
 */
export const REVIEW_MOMENTS: Record<string, SampleShare> = {
    A: { shots: [{ step: 'A2', media: 'video' }], caption: { en: REVIEW_CAPTIONS.A, th: SAMPLE_THAI } },
    B: { shots: [{ step: 'B1', media: 'video' }], caption: { en: REVIEW_CAPTIONS.B, th: SAMPLE_THAI } },
    C: { shots: [{ step: 'C1', media: 'video' }], caption: { en: REVIEW_CAPTIONS.C, th: SAMPLE_THAI } },
    D: { shots: [{ step: 'D1', media: 'video' }], caption: { en: REVIEW_CAPTIONS.D, th: SAMPLE_THAI } },
    E: { shots: [{ step: 'E3', media: 'video' }], caption: { en: REVIEW_CAPTIONS.E, th: SAMPLE_THAI } },
};

/**
 * The sample share moment of one day of one week.
 * @param week The week of the level.
 * @param scriptId The script id of the day (A to E).
 * @returns The sample moment, with its own shots and its own caption.
 */
export function sampleShare(week: number, scriptId: string): SampleShare {
    const table = week === REVIEW_WEEK ? REVIEW_MOMENTS : TEACH_MOMENTS;
    const moment = table[scriptId];
    if (!moment) throw new Error(`no sample share moment for script ${scriptId} of week ${week}`);
    return { shots: moment.shots.map((shot) => ({ ...shot })), caption: { ...moment.caption } };
}
