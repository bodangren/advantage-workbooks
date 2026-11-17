import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
    checkSoundStageDayOne,
    checkSoundStageMix,
    checkSoundStagePlan,
    soundUnits,
} from '../lib/storytime/sound-stages';

// Track storytime_l2_unit2_20261106, Task 3.5 (Red, PA-P3-1 revision r3, D-U2-S1 to D-U2-S5).
// The 8 unit 2 drafts hold focus.paStage. These rows pin the three R14 checks through the pure module,
// and they pin the shape of the sound game: one position for each unit, 5 lines and 5 audio lists,
// and 8 different day-1 lines. The mutation rows pin each rule on a synthetic week.

const ROOT = fs.existsSync(path.join(process.cwd(), 'content/storytime'))
    ? process.cwd()
    : path.resolve(process.cwd(), '..');
const WEEKS = [9, 10, 11, 12, 13, 14, 15, 16];

const LABEL_PLAN = 'The week follows the sound stage plan (focus.paStage, positions, tags)';
const LABEL_MIX = 'No activity asks two sound positions (first, last, middle)';
const LABEL_DAY1 = 'The day-1 sound game holds no new sound and asks only a skill of an earlier stage';
const MEDIAL_VOWEL_TAG = 'english.phonics.pa.medial-vowel.identify';

const draftPath = (n: number) => path.join(ROOT, `content/storytime/drafts/l2/w${String(n).padStart(2, '0')}.json`);
const publishedPath = (n: number) => path.join(ROOT, `content/storytime/l2/w${String(n).padStart(2, '0')}.json`);
const load = (p: string) => JSON.parse(fs.readFileSync(p, 'utf-8')) as any;

/** The focus.element.sound of the earlier weeks of level 2, in week order. */
function earlierSounds(n: number): string[] {
    const sounds: string[] = [];
    for (let w = 1; w <= 8; w++) {
        const s = load(publishedPath(w))?.focus?.element?.sound;
        if (typeof s === 'string') sounds.push(s);
    }
    for (let w = 9; w < n; w++) {
        const s = load(draftPath(w))?.focus?.element?.sound;
        if (typeof s === 'string') sounds.push(s);
    }
    return sounds;
}

describe.each(WEEKS)('unit 2 week %i sound stages', (n) => {
    const week = load(draftPath(n));

    it('R14-3 plan row passes', () => {
        expect(checkSoundStagePlan(week)).toEqual({ id: 'sound-stage-plan', label: LABEL_PLAN, status: 'pass' });
    });

    it('R14-1 mix row passes', () => {
        expect(checkSoundStageMix(week)).toEqual({ id: 'sound-stage-mix', label: LABEL_MIX, status: 'pass' });
    });

    it('R14-2 day-1 row passes', () => {
        expect(checkSoundStageDayOne(week, earlierSounds(n))).toEqual({ id: 'sound-stage-day1', label: LABEL_DAY1, status: 'pass' });
    });

    it('focus.paStage is stage 2 with the first and last positions', () => {
        expect(week.focus.paStage).toEqual({ stage: 2, positions: ['first', 'last'] });
    });

    it('each unit asks at most one position', () => {
        for (const unit of soundUnits(week)) expect(unit.positions.length).toBeLessThanOrEqual(1);
    });

    it('the week asks the first and the last position across its units', () => {
        const asked = new Set<string>();
        for (const unit of soundUnits(week)) for (const position of unit.positions) asked.add(position);
        expect([...asked].sort()).toEqual(['first', 'last']);
    });

    it('opening.pa holds exactly 5 entries', () => {
        expect(week.opening.pa).toHaveLength(5);
    });

    it('opening.audio holds exactly 5 lists', () => {
        expect(week.opening.audio).toHaveLength(5);
        for (const list of week.opening.audio) expect(Array.isArray(list)).toBe(true);
    });

    if (n === 9) {
        it('week 9 teaches the final-sound tag', () => {
            expect(week.tags.taught).toContain('english.phonics.pa.final-sound.identify');
        });
    }

    if (n === 11) {
        it('w11 holds no medial-vowel tag', () => {
            expect(week.tags.taught).not.toContain(MEDIAL_VOWEL_TAG);
            expect(week.tags.reviewed).not.toContain(MEDIAL_VOWEL_TAG);
        });
    }
});

describe('unit 2 day-1 lines of w09 to w16', () => {
    it('the day-1 English lines of w09 to w16 are 8 different strings', () => {
        const lines = WEEKS.map((n) => load(draftPath(n))?.opening?.pa?.[0]?.en);
        expect(new Set(lines).size).toBe(8);
    });
});

/** A synthetic level 2 week 9 that passes all three rows. */
function passingWeek(): any {
    return {
        meta: { level: 2, week: 9 },
        focus: {
            element: { sound: '/d/' },
            paSkill: { en: '' },
            paStage: { stage: 2, positions: ['first', 'last'] },
        },
        opening: { pa: [{ en: 'Listen: nose. What is the first sound? Nnn! Listen: net. What is the first sound? Nnn!' }] },
        tags: { taught: ['english.phonics.pa.final-sound.identify', 'english.phonics.pa.initial-sound.identify'], reviewed: [] },
    };
}

const EARLIER_NINE = ['/n/', '/a/', '/p/', '/m/', '/s/', '/t/', '/o/'];

describe('sound stage mutations on a synthetic week 9', () => {
    it('a: the base week passes all three rows', () => {
        const w = passingWeek();
        expect(checkSoundStagePlan(w)).toEqual({ id: 'sound-stage-plan', label: LABEL_PLAN, status: 'pass' });
        expect(checkSoundStageMix(w)).toEqual({ id: 'sound-stage-mix', label: LABEL_MIX, status: 'pass' });
        expect(checkSoundStageDayOne(w, EARLIER_NINE)).toEqual({ id: 'sound-stage-day1', label: LABEL_DAY1, status: 'pass' });
    });

    it('b: no paStage fails the plan row with a no paStage detail', () => {
        const w = passingWeek();
        delete w.focus.paStage;
        expect(checkSoundStagePlan(w)).toEqual({ id: 'sound-stage-plan', label: LABEL_PLAN, status: 'fail', detail: 'no paStage' });
    });

    it('c: a first-and-last line fails the mix row and names the unit', () => {
        const w = passingWeek();
        w.opening.pa[0].en = 'Listen: dog. What is the first sound? /d/! Listen: bed. What is the last sound? /d/!';
        const row = checkSoundStageMix(w);
        expect(row).toEqual({ id: 'sound-stage-mix', label: LABEL_MIX, status: 'fail', detail: 'mixed: opening.pa.0 (first+last)' });
        expect(row!.detail).toContain('opening.pa.0');
    });

    it('d: a day-1 line that names the new sound fails the day-1 row', () => {
        const w = passingWeek();
        w.opening.pa[0].en = 'Listen: dog. What is the first sound? /d/!';
        const row = checkSoundStageDayOne(w, EARLIER_NINE);
        expect(row).toEqual({ id: 'sound-stage-day1', label: LABEL_DAY1, status: 'fail', detail: 'new sound: /d/' });
        expect(row!.detail).toContain('new sound');
    });

    it('e: a day-1 line that asks the last sound fails with a position detail', () => {
        const w = passingWeek();
        w.opening.pa[0].en = 'Listen: bed. What is the last sound? Nnn!';
        const row = checkSoundStageDayOne(w, EARLIER_NINE);
        expect(row).toEqual({ id: 'sound-stage-day1', label: LABEL_DAY1, status: 'fail', detail: 'position: last (stage of week 8 allows first)' });
        expect(row!.detail).toContain('position:');
    });
});
