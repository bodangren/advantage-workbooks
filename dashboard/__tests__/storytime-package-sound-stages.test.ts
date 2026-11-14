// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { FocusSchema, StorytimeWeekSchema } from '../lib/storytime/schema';

/**
 * Phase 14, Red: the sound skill stages (spec FR14-1 to FR14-5, decisions P14-D1 to P14-D16,
 * check rows R14-1 to R14-3, cases S1 to S10).
 *
 * The module `lib/storytime/sound-stages.ts` does not exist yet, so every case that needs it fails
 * inside its body with a label that names the missing module or the missing export. The cases of
 * the shipped data (S8, S9) fail on the old values of the change list. The guard cases (S10) pass.
 *
 * Names that the spec leaves open are fixed here, so that Green does not guess. Each is marked PIN:
 *  - PIN `soundUnits(week)` gives an array of units. A unit is an object `{ where, text, positions }`.
 *    `where` names the place of the unit in the week: `focus.paSkill`, `opening.pa.<i>`,
 *    `scripts.<s>.steps.<t>`, `check.items`, `benchmark.paper.items`, or `home`. `text` is the
 *    English text of the unit; the two item units (`check.items` and `benchmark.paper.items`) have
 *    the empty text. `positions` holds the sound positions the unit asks, in the order `first`,
 *    `last`, `middle`. The two item units take their positions from the `position` field of the
 *    items of kind `circle-picture` and `picture-sort` (an absent `position` is `first`), and the
 *    positions of one item unit are the distinct positions of its items.
 *  - PIN `soundPositionsAsked(text)` gives an array of the positions the text asks, in the order
 *    `first`, `last`, `middle`. It gives an empty array for a text that asks no position.
 *  - PIN the three row functions of R14 give a row object `{ id, label, status, detail }`. The
 *    status is `pass` or `fail`, and a `pass` row has no detail. A row function gives `undefined`
 *    when the week has no `meta`, or when the level and the week have no plan entry.
 *  - PIN `SOUND_STAGE_PLAN` is an array of the three plan entries, in the order of the stages.
 *  - PIN `plannedSoundStage(level, week)` gives `{ stage, positions }`, where `positions` holds the
 *    positions of the entries of that stage and below, in the order `first`, `last`, `middle`.
 *  - PIN the week argument of the three row functions and of `soundUnits` is a parsed week object
 *    (the shape of `StorytimeWeekSchema.parse`). The fixtures below hold every field the module
 *    reads.
 *  - PIN the second argument of `checkSoundStageDayOne` is the array of the `focus.element.sound`
 *    values of the weeks of the same level with a smaller week number.
 *
 * Every table below is written by hand. The test never reads an expected value from the code under
 * the test. The file holds no Thai string, names no track folder, and writes no file.
 */

/** The dashboard folder, so that the new module is read by path. */
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');

/** The pure module of the sound stages (FR14-1). */
const soundStagesModule = path.join(dashboardRoot, 'lib/storytime/sound-stages.ts');

/** This file, so that the guard cases read their own text. */
const SELF_FILE = path.join(dashboardRoot, '__tests__/storytime-package-sound-stages.test.ts');

/** The text that no line of this file may hold: the guard of the file. The pieces keep this file clean. */
const FORBIDDEN_PATH = `${['measure', 'tracks'].join('/')}/`;

/**
 * The write calls that no line of this file may hold, so that the file writes nothing under the
 * content folder. The pieces keep this file clean: the list never spells one name in full.
 */
const WRITE_CALLS = [
    ['write', 'File'].join(''),
    ['write', 'FileSync'].join(''),
    ['append', 'FileSync'].join(''),
    ['mk', 'dirSync'].join(''),
    ['rm', 'Sync'].join(''),
    ['un', 'linkSync'].join(''),
    ['copy', 'FileSync'].join(''),
    ['trunc', 'ateSync'].join(''),
];

/** A sound position of the stage plan. */
type SoundPosition = 'first' | 'last' | 'middle';

/** One entry of the stage plan (FR14-1). */
interface SoundStagePlanEntry {
    level: number;
    stage: number;
    position: SoundPosition;
    fromWeek: number;
    tag: string;
}

/** The stage of a week: the number of the stage and the positions it holds. */
interface PlannedSoundStage {
    stage: number;
    positions: SoundPosition[];
}

/** One unit of a week. */
interface SoundUnit {
    where: string;
    text: string;
    positions: SoundPosition[];
}

/** One row of the check. */
interface SoundStageRow {
    id: string;
    label: string;
    status: 'pass' | 'fail';
    detail?: string;
}

/** The exports of the sound stage module (FR14-1). */
interface SoundStagesModule {
    SOUND_POSITIONS: readonly SoundPosition[];
    SOUND_STAGE_PLAN: readonly SoundStagePlanEntry[];
    plannedSoundStage: (level: number, week: number) => PlannedSoundStage | undefined;
    soundPositionsAsked: (text: string) => SoundPosition[];
    soundUnits: (week: unknown) => SoundUnit[];
    checkSoundStageMix: (week: unknown) => SoundStageRow | undefined;
    checkSoundStageDayOne: (week: unknown, earlierSounds: string[]) => SoundStageRow | undefined;
    checkSoundStagePlan: (week: unknown) => SoundStageRow | undefined;
}

/** A fixture week: the fields the module reads, and nothing else. */
type WeekFixture = Record<string, unknown>;

/**
 * One export of the sound stage module.
 * @param name The name of the export.
 * @returns The export.
 * @throws Error When the module or the export is missing. The message names both.
 */
async function exportOf<K extends keyof SoundStagesModule>(name: K): Promise<NonNullable<SoundStagesModule[K]>> {
    if (!fs.existsSync(soundStagesModule)) throw new Error(`Missing module: ${soundStagesModule}`);
    const mod = (await import(soundStagesModule)) as SoundStagesModule;
    const value = mod[name];
    if (value === undefined || value === null) throw new Error(`Missing export: ${String(name)} of ${soundStagesModule}`);
    return value as NonNullable<SoundStagesModule[K]>;
}

/**
 * The raw JSON of a shipped week file.
 * @param week The week number.
 * @returns The parsed raw file.
 */
function rawWeek(week: number): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, week), 'utf8')) as Record<string, unknown>;
}

/**
 * The parsed week of a shipped file.
 * @param week The week number.
 * @returns The parsed week.
 */
function shippedWeek(week: number) {
    return StorytimeWeekSchema.parse(rawWeek(week));
}

/**
 * The `focus.element.sound` of each shipped week of Level 2, in week order.
 * @returns The sound of each week; a review week without an element gives `undefined`.
 */
function elementSounds(): (string | undefined)[] {
    return [1, 2, 3, 4, 5, 6, 7, 8].map((week) => {
        const focus = rawWeek(week).focus as { element?: { sound?: string } };
        return focus.element?.sound;
    });
}

/**
 * The fixture week of the unit and row cases: Level 2, week 3, one script of two steps, one check
 * item, one benchmark item, and a home card. The `watchFor`, the `materials`, and the Thai note of
 * the first step hold the words "last sound", so that a reader of them shows itself.
 * @returns The fixture week.
 */
function fixtureWeek(): WeekFixture {
    return {
        meta: {
            program: 'storytime',
            shape: 'storytime-week',
            level: 2,
            week: 3,
            unit: 1,
            key: 'st2/3',
            kind: 'teach',
            periodMinutes: 30,
            openingMinutes: 6,
            title: 'Fixture week',
            status: 'published',
        },
        focus: {
            element: { id: 'english.phonics.gpc.p.p', graphemes: ['p'], sound: '/p/', action: { en: 'Say p.' } },
            paSkill: { en: 'the first sound /p/; blend three sounds by ear' },
            trickyWords: [],
            frame: 'Hello, I am ___.',
            family: { name: { en: 'Pets' }, words: [], max: 8 },
            wordWall: [],
        },
        opening: {
            pa: [
                { en: 'Listen: nose. What is the first sound? Nnn!' },
                { en: 'Listen: net. What is the first sound? Nnn!' },
                { en: 'Listen: nut. What is the first sound? Nnn!' },
                { en: 'Listen: sun. What is the first sound? Nnn!' },
                { en: 'Listen: hen. What is the first sound? Nnn!' },
            ],
            audio: [],
            wordClips: {},
        },
        scripts: [
            {
                id: 'A',
                day: 1,
                steps: [
                    {
                        id: 'A1',
                        title: { en: 'Hear it' },
                        minutes: 5,
                        en: {
                            teacherActions: ['Hold up one picture card.'],
                            teacherLanguage: ['Listen. Pet.'],
                            studentActions: ['Children say the first sound.'],
                            // M4: the schema and the week files hold watchFor under `en.watchFor`.
                            watchFor: ['Ask about the last sound.'],
                        },
                        easier: { en: 'One child says the first sound.' },
                        harder: { en: 'A child reads one word on the wall alone, then says its first sound.' },
                        group: { en: 'Two children say the first sound together.' },
                        materials: ['picture cards: pet, pen, pan'],
                        soundLoop: {
                            correct: { en: 'Now listen to /p/.' },
                            practise: { en: 'Now you say /p/.' },
                            retest: { en: 'Now you read /p/.' },
                        },
                        watchFor: { teacherActions: ['Ask about the last sound.'], teacherLanguage: [], studentActions: [] },
                        th: { teacherActions: ['the last sound'], teacherLanguage: [], studentActions: [] },
                    },
                    {
                        id: 'A2',
                        title: { en: 'Say it' },
                        minutes: 5,
                        en: {
                            teacherActions: ['Say the word.'],
                            teacherLanguage: ['Say the first sound.'],
                            studentActions: ['Children say the word.'],
                        },
                        easier: { en: 'One child says the word.' },
                        harder: { en: 'A child reads the word.' },
                        group: { en: 'Two children say the word.' },
                        materials: [],
                    },
                ],
            },
        ],
        check: {
            items: [
                { kind: 'circle-picture', sound: '/p/', position: 'first', pictures: ['pet', 'pen', 'pan'], answer: 'pet' },
                { kind: 'write-letter', letter: 'p' },
            ],
        },
        benchmark: {
            title: { en: 'Benchmark' },
            paper: {
                minutes: 10,
                items: [{ kind: 'circle-picture', sound: '/p/', position: 'first', pictures: ['pet', 'pen', 'pan'], answer: 'pet' }],
                pass: { en: '2 of 3' },
            },
        },
        home: {
            words: ['pet'],
            line: { en: 'This week, your child learns the first sound /p/.' },
            activity: { en: 'Say the first sound with your child.' },
        },
        tags: { graphVersion: '1', taught: ['english.phonics.pa.initial-sound.identify'], reviewed: [] },
    };
}

/**
 * The fixture week of the day-1 cases: one opening line, no step, no item, no home card.
 * @param week The week number of the fixture.
 * @param day1 The English text of the day-1 opening line.
 * @param sound The `focus.element.sound` of the fixture; `undefined` gives a week without an element.
 * @returns The fixture week.
 */
function day1Week(week: number, day1: string, sound?: string): WeekFixture {
    const focus: Record<string, unknown> = { paSkill: { en: 'the first sound /p/; blend three sounds by ear' } };
    if (sound) focus.element = { id: 'english.phonics.gpc.p.p', graphemes: ['p'], sound, action: { en: 'Say p.' } };
    return {
        meta: { program: 'storytime', shape: 'storytime-week', level: 2, week, unit: 1, key: `st2/${week}`, kind: 'teach', periodMinutes: 30, openingMinutes: 6, title: 'Fixture week', status: 'published' },
        focus,
        opening: {
            pa: [
                { en: day1 },
                { en: 'Listen: pet. What is the first sound? /p/!' },
                { en: 'Listen: pen. What is the first sound? /p/!' },
                { en: 'Listen: pig. What is the first sound? /p/!' },
                { en: 'Listen: pot. What is the first sound? /p/!' },
            ],
            audio: [],
            wordClips: {},
        },
        scripts: [],
        check: { items: [] },
        benchmark: { title: { en: 'Benchmark' }, paper: { minutes: 10, items: [], pass: { en: '0 of 0' } } },
        tags: { graphVersion: '1', taught: [], reviewed: [] },
    };
}

/**
 * The fixture week of the plan cases: one opening line, one check item, and the given tags.
 * @param week The week number of the fixture.
 * @param paStage The `focus.paStage` of the fixture; `undefined` gives a week without the field.
 * @param taught The `tags.taught` of the fixture.
 * @param itemPosition The `position` of the one check item of the fixture.
 * @returns The fixture week.
 */
function planWeek(week: number, paStage: { stage: number; positions: SoundPosition[] } | undefined, taught: string[], itemPosition: SoundPosition): WeekFixture {
    const focus: Record<string, unknown> = { paSkill: { en: 'the first sound /p/; blend three sounds by ear' } };
    if (paStage) focus.paStage = paStage;
    return {
        meta: { program: 'storytime', shape: 'storytime-week', level: 2, week, unit: 1, key: `st2/${week}`, kind: 'teach', periodMinutes: 30, openingMinutes: 6, title: 'Fixture week', status: 'published' },
        focus,
        opening: {
            pa: [
                { en: 'Listen: pet. What is the first sound? /p/!' },
                { en: 'Listen: pen. What is the first sound? /p/!' },
                { en: 'Listen: pig. What is the first sound? /p/!' },
                { en: 'Listen: pot. What is the first sound? /p/!' },
                { en: 'Listen: pup. What is the first sound? /p/!' },
            ],
            audio: [],
            wordClips: {},
        },
        scripts: [],
        check: {
            items: [
                { kind: 'circle-picture', sound: '/p/', position: itemPosition, pictures: ['pet', 'pen', 'pan'], answer: 'pet' },
            ],
        },
        benchmark: { title: { en: 'Benchmark' }, paper: { minutes: 10, items: [], pass: { en: '0 of 0' } } },
        tags: { graphVersion: '1', taught, reviewed: [] },
    };
}

// ---------------------------------------------------------------------------------------------
// S1: the plan of the stages
// ---------------------------------------------------------------------------------------------

describe('S1 the plan of the stages (FR14-1)', () => {
    it('holds the three plan entries of Level 2', async () => {
        const plan = await exportOf('SOUND_STAGE_PLAN');
        expect(plan).toEqual([
            { level: 2, stage: 1, position: 'first', fromWeek: 1, tag: 'english.phonics.pa.initial-sound.identify' },
            { level: 2, stage: 2, position: 'last', fromWeek: 9, tag: 'english.phonics.pa.final-sound.identify' },
            { level: 2, stage: 3, position: 'middle', fromWeek: 17, tag: 'english.phonics.pa.medial-vowel.identify' },
        ]);
    });

    it('gives the stage and the positions of a week, and no stage for a week below the plan', async () => {
        const planned = await exportOf('plannedSoundStage');
        for (let week = 1; week <= 8; week += 1) {
            expect(planned(2, week), `week ${week}`).toEqual({ stage: 1, positions: ['first'] });
        }
        for (let week = 9; week <= 16; week += 1) {
            expect(planned(2, week), `week ${week}`).toEqual({ stage: 2, positions: ['first', 'last'] });
        }
        expect(planned(2, 17), 'week 17').toEqual({ stage: 3, positions: ['first', 'last', 'middle'] });
        expect(planned(2, 0), 'week 0 is below the plan').toBeUndefined();
        expect(planned(1, 5), 'Level 1 has no plan').toBeUndefined();
        expect(planned(3, 1), 'Level 3 has no plan').toBeUndefined();
    });

    it('holds the three positions of the plan', async () => {
        const positions = await exportOf('SOUND_POSITIONS');
        expect(positions).toEqual(['first', 'last', 'middle']);
    });
});

// ---------------------------------------------------------------------------------------------
// S2: the positions a text asks
// ---------------------------------------------------------------------------------------------

describe('S2 the positions a text asks (FR14-1)', () => {
    const table: { text: string; positions: SoundPosition[] }[] = [
        { text: '"Listen: nose. What is the first sound? Nnn! Listen: sun. What is the last sound? Nnn!"', positions: ['first', 'last'] },
        { text: 'Ask about the last sound too: "Sun. Does sun end with nnn?"', positions: ['last'] },
        { text: '"Now listen to the middle. /k/ - /a/ - /t/. Is /a/ in the middle? Yes!"', positions: ['middle'] },
        { text: '"Now listen to the end. Cup. Cup. Is /p/ at the end? Yes!"', positions: ['last'] },
        { text: 'Add a word with n at the end (sun): children push the card into the last box.', positions: ['last'] },
        { text: 'sort the picture cards into "sss at the start or the end" and "no sss"', positions: ['first', 'last'] },
        { text: 'sort the picture cards into "/o/ at the start or in the middle" and "no /o/"', positions: ['first', 'middle'] },
        { text: 'Show the word card "nap". Hold nnn, and say /p/ at the end as a short puff.', positions: ['last'] },
        { text: '"Row 5: cat, sun, bed. Which one ends with /t/? Circle it."', positions: ['last'] },
        { text: 'A big letter at the start. A full stop at the end.', positions: ['first'] },
        { text: 'the voice goes up at the end of a question', positions: [] },
        { text: 'Children who say "nuh": the sound is n, with no "uh" at the end.', positions: [] },
        { text: 'Children who read "top" as "tap": point to the middle letter and ask for its sound.', positions: [] },
        { text: '"Listen: hello. Say it with me: hello! Listen: goodbye. Say it with me: goodbye!"', positions: [] },
        // M1: the "starts with" form alone, with no "first sound" and no "at the start".
        { text: '"Listen. Ant. Does ant start with /a/? Yes!"', positions: ['first'] },
        // M3: "listen to the middle" alone, with no sound token before "in the middle".
        { text: '"Now listen to the middle."', positions: ['middle'] },
    ];

    table.forEach((row, index) => {
        it(`gives the positions of the hand-written row ${index + 1}`, async () => {
            const asked = await exportOf('soundPositionsAsked');
            expect(asked(row.text), `row ${index + 1}: ${row.text}`).toEqual(row.positions);
        });
    });
});

// ---------------------------------------------------------------------------------------------
// S3: the units of a week
// ---------------------------------------------------------------------------------------------

describe('S3 the units of a week (FR14-1)', () => {
    it('gives the units of a fixture week in the order of the spec', async () => {
        const units = await exportOf('soundUnits');
        const list = units(fixtureWeek());
        expect(list.map((unit) => unit.where)).toEqual([
            'focus.paSkill',
            'opening.pa.0',
            'opening.pa.1',
            'opening.pa.2',
            'opening.pa.3',
            'opening.pa.4',
            'scripts.0.steps.0',
            'scripts.0.steps.1',
            'check.items',
            'benchmark.paper.items',
            'home',
        ]);
    });

    it('joins the lines of a step, and reads no watchFor, no materials, and no Thai line', async () => {
        const units = await exportOf('soundUnits');
        const list = units(fixtureWeek());
        const step = list.find((unit) => unit.where === 'scripts.0.steps.0');
        expect(step?.text).toBe(
            [
                'Hold up one picture card.',
                'Listen. Pet.',
                'Children say the first sound.',
                'One child says the first sound.',
                'A child reads one word on the wall alone, then says its first sound.',
                'Two children say the first sound together.',
                'Now listen to /p/.',
                'Now you say /p/.',
                'Now you read /p/.',
            ].join('\n'),
        );
        expect(list.map((unit) => unit.text).join('\n'), 'no unit reads the last sound').not.toContain('last sound');
        expect(list.every((unit) => !unit.positions.includes('last')), 'no unit asks the last sound').toBe(true);
    });

    it('gives no unit for a week without an item, without a benchmark item, and without a home card', async () => {
        const units = await exportOf('soundUnits');
        const bare = day1Week(3, 'Listen: pet. What is the first sound? /p/!', '/p/');
        const list = units(bare);
        expect(list.map((unit) => unit.where)).toEqual([
            'focus.paSkill',
            'opening.pa.0',
            'opening.pa.1',
            'opening.pa.2',
            'opening.pa.3',
            'opening.pa.4',
        ]);
    });

    it('gives the first position for a check item with no position (M12)', async () => {
        const units = await exportOf('soundUnits');
        const week = day1Week(3, 'Listen: pet. What is the first sound? /p/!', '/p/');
        week.check = { items: [{ kind: 'circle-picture', sound: '/p/', pictures: ['pet', 'pen', 'pan'], answer: 'pet' }] };
        const list = units(week);
        const item = list.find((unit) => unit.where === 'check.items');
        expect(item, 'the item unit').toEqual({ where: 'check.items', text: '', positions: ['first'] });
    });
});

// ---------------------------------------------------------------------------------------------
// S4: R14-1, the row of the mixed positions
// ---------------------------------------------------------------------------------------------

describe('S4 R14-1 the row of the mixed positions (FR14-1)', () => {
    it('gives the id and the label of the row', async () => {
        const mix = await exportOf('checkSoundStageMix');
        const row = mix(fixtureWeek());
        expect(row?.id).toBe('sound-stage-mix');
        expect(row?.label).toBe('No activity asks two sound positions (first, last, middle)');
    });

    it('gives a pass for a week that asks one position in each activity', async () => {
        const mix = await exportOf('checkSoundStageMix');
        const row = mix(fixtureWeek());
        expect(row?.status).toBe('pass');
        expect(row?.detail).toBeUndefined();
    });

    it('gives the exact detail for two mixed activities', async () => {
        const mix = await exportOf('checkSoundStageMix');
        const week = fixtureWeek();
        const opening = week.opening as { pa: { en: string }[] };
        opening.pa[0] = { en: 'Listen: nose. What is the first sound? Nnn! Listen: sun. What is the last sound? Nnn!' };
        const steps = (week.scripts as { steps: { harder: { en: string } }[] }[])[0].steps;
        steps[0].harder = { en: 'A child reads one word on the wall alone, then says its last sound.' };
        const row = mix(week);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('mixed: opening.pa.0 (first+last); scripts.0.steps.0 (first+last)');
    });

    it('gives no row for a week without a meta and for a week of a level with no plan', async () => {
        const mix = await exportOf('checkSoundStageMix');
        expect(mix({}), 'a week without a meta').toBeUndefined();
        const levelOne = fixtureWeek();
        (levelOne.meta as { level: number }).level = 1;
        expect(mix(levelOne), 'a week of Level 1').toBeUndefined();
    });
});

// ---------------------------------------------------------------------------------------------
// S5: R14-2, the row of the day-1 opening
// ---------------------------------------------------------------------------------------------

describe('S5 R14-2 the row of the day-1 opening (FR14-1)', () => {
    it('gives the id and the label of the row', async () => {
        const day1 = await exportOf('checkSoundStageDayOne');
        const row = day1(day1Week(1, 'Listen: nose. What is the first sound? Nnn!', '/n/'), []);
        expect(row?.id).toBe('sound-stage-day1');
        expect(row?.label).toBe('The day-1 sound game holds no new sound and asks only a skill of an earlier stage');
    });

    it('gives the new sound and the position of a week-1 fixture', async () => {
        const day1 = await exportOf('checkSoundStageDayOne');
        const row = day1(day1Week(1, 'Listen: nose. What is the first sound? Nnn!', '/n/'), []);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('new sound: Nnn; position: first (stage of week 0 allows none)');
    });

    it('gives the untaught sound of a week-3 fixture', async () => {
        const day1 = await exportOf('checkSoundStageDayOne');
        const row = day1(day1Week(3, 'Listen: map. What is the first sound? Mmm!', '/p/'), ['/n/', '/a/']);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('untaught sound: Mmm');
    });

    it('gives a pass for a week-3 fixture with an earlier sound and the first position', async () => {
        const day1 = await exportOf('checkSoundStageDayOne');
        const row = day1(day1Week(3, 'Listen: nose. What is the first sound? Nnn!', '/p/'), ['/n/', '/a/']);
        expect(row?.status).toBe('pass');
        expect(row?.detail).toBeUndefined();
    });

    it('gives no new-sound part for a week without an element, and does not throw', async () => {
        const day1 = await exportOf('checkSoundStageDayOne');
        const row = day1(day1Week(3, 'Listen: nose. What is the first sound? Nnn!'), ['/n/', '/a/']);
        expect(row?.status).toBe('pass');
        expect(row?.detail ?? '').not.toContain('new sound');
    });

    it('gives the no-opening part for a week without an opening game', async () => {
        const day1 = await exportOf('checkSoundStageDayOne');
        const week = day1Week(3, 'Listen: pet. What is the first sound? /p/!', '/p/');
        delete week.opening;
        const row = day1(week, ['/n/', '/a/']);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('no opening');
    });
});

// ---------------------------------------------------------------------------------------------
// S6: R14-3, the row of the stage plan
// ---------------------------------------------------------------------------------------------

describe('S6 R14-3 the row of the stage plan (FR14-1)', () => {
    it('gives the id and the label of the row', async () => {
        const plan = await exportOf('checkSoundStagePlan');
        const row = plan(planWeek(1, { stage: 1, positions: ['first'] }, ['english.phonics.pa.initial-sound.identify'], 'first'));
        expect(row?.id).toBe('sound-stage-plan');
        expect(row?.label).toBe('The week follows the sound stage plan (focus.paStage, positions, tags)');
    });

    it('gives every fail part in the order of the spec', async () => {
        const plan = await exportOf('checkSoundStagePlan');
        const week = planWeek(1, undefined, ['english.phonics.pa.final-sound.identify'], 'last');
        const row = plan(week);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe(
            'no paStage; outside stage: check.items (last); tag outside stage: english.phonics.pa.final-sound.identify; stage start not taught: english.phonics.pa.initial-sound.identify',
        );
    });

    it('gives the outside-stage part for a week-1 fixture with a last-position check item', async () => {
        const plan = await exportOf('checkSoundStagePlan');
        const week = planWeek(1, { stage: 1, positions: ['first'] }, ['english.phonics.pa.initial-sound.identify'], 'last');
        const row = plan(week);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('outside stage: check.items (last)');
    });

    it('gives a pass for a week-9 fixture with the stage-2 plan and the final-sound tag in taught', async () => {
        const plan = await exportOf('checkSoundStagePlan');
        const week = planWeek(9, { stage: 2, positions: ['first', 'last'] }, ['english.phonics.pa.final-sound.identify'], 'first');
        const row = plan(week);
        expect(row?.status).toBe('pass');
        expect(row?.detail).toBeUndefined();
    });

    it('gives the stage-start part for a week-9 fixture without the final-sound tag in taught', async () => {
        const plan = await exportOf('checkSoundStagePlan');
        const week = planWeek(9, { stage: 2, positions: ['first', 'last'] }, [], 'first');
        const row = plan(week);
        expect(row?.status).toBe('fail');
        expect(row?.detail).toBe('stage start not taught: english.phonics.pa.final-sound.identify');
    });
});

// ---------------------------------------------------------------------------------------------
// S7: the schema field of the stage
// ---------------------------------------------------------------------------------------------

describe('S7 the schema field of the stage (FR14-2)', () => {
    /** The focus of the schema cases: the fields that FocusSchema needs. */
    const focus = {
        paSkill: { en: 'the first sound /p/; blend three sounds by ear' },
        frame: 'Hello, I am ___.',
        family: { name: { en: 'Pets' }, words: [] },
    };

    it('parses the paStage field and keeps it', () => {
        const parsed = FocusSchema.parse({ ...focus, paStage: { stage: 1, positions: ['first'] } }) as {
            paStage?: { stage: number; positions: string[] };
        };
        expect(parsed.paStage).toEqual({ stage: 1, positions: ['first'] });
    });

    it('refuses a paStage field with an extra key', () => {
        const parsed = FocusSchema.safeParse({ ...focus, paStage: { stage: 1, positions: ['first'], extra: true } });
        expect(parsed.success).toBe(false);
    });

    it('refuses a paStage field with stage 4', () => {
        const parsed = FocusSchema.safeParse({ ...focus, paStage: { stage: 4, positions: ['first'] } });
        expect(parsed.success).toBe(false);
    });

    it('refuses a paStage field with no position', () => {
        const parsed = FocusSchema.safeParse({ ...focus, paStage: { stage: 1, positions: [] } });
        expect(parsed.success).toBe(false);
    });

    it('parses a focus without a paStage field', () => {
        const parsed = FocusSchema.safeParse(focus);
        expect(parsed.success).toBe(true);
    });

    it('takes the positions of the plan and no other position', async () => {
        const positions = await exportOf('SOUND_POSITIONS');
        for (const position of positions) {
            const parsed = FocusSchema.safeParse({ ...focus, paStage: { stage: 1, positions: [position] } });
            expect(parsed.success, `the position ${position}`).toBe(true);
        }
        const refused = FocusSchema.safeParse({ ...focus, paStage: { stage: 1, positions: ['sound'] } });
        expect(refused.success, 'a position outside the plan').toBe(false);
    });
});

// ---------------------------------------------------------------------------------------------
// S8: the shipped weeks
// ---------------------------------------------------------------------------------------------

describe('S8 the shipped weeks (FR14-5)', () => {
    it('gives a pass for the three rows of every shipped week of Level 2', async () => {
        const mix = await exportOf('checkSoundStageMix');
        const day1 = await exportOf('checkSoundStageDayOne');
        const plan = await exportOf('checkSoundStagePlan');
        const sounds = elementSounds();
        for (let week = 1; week <= 8; week += 1) {
            const parsed = shippedWeek(week);
            const earlier = sounds.slice(0, week - 1).filter((sound): sound is string => !!sound);
            expect(mix(parsed)?.status, `week ${week} R14-1`).toBe('pass');
            expect(day1(parsed, earlier)?.status, `week ${week} R14-2`).toBe('pass');
            expect(plan(parsed)?.status, `week ${week} R14-3`).toBe('pass');
        }
    });

    it('gives the stage-1 plan in the focus of every shipped week of Level 2', async () => {
        for (let week = 1; week <= 8; week += 1) {
            const focus = shippedWeek(week).focus as { paStage?: { stage: number; positions: string[] } };
            expect(focus.paStage, `week ${week}`).toEqual({ stage: 1, positions: ['first'] });
        }
    });

    it('gives no new-sound part for w08, the week without a focus.element.sound', async () => {
        const day1 = await exportOf('checkSoundStageDayOne');
        const earlier = elementSounds().slice(0, 7).filter((sound): sound is string => !!sound);
        const row = day1(shippedWeek(8), earlier);
        expect(row?.status, 'w08 R14-2').toBe('pass');
        expect(row?.detail ?? '').not.toContain('new sound');
    });
});

// ---------------------------------------------------------------------------------------------
// S9: the shipped values of the change list
// ---------------------------------------------------------------------------------------------

describe('S9 the shipped values of the change list (FR14-5)', () => {
    /** The new day-1 opening line of each week (the rows C01-03 to C07-03). */
    const day1: Record<number, string> = {
        1: '"Listen: hello. Say it with me: hello! Listen: goodbye. Say it with me: goodbye!"',
        2: '"Listen: nose. What is the first sound? Nnn! Listen: net. What is the first sound? Nnn!"',
        3: '"Listen: ant. What is the first sound? /a/! Listen: net. What is the first sound? Nnn!"',
        4: '"Listen: pan. What is the first sound? /p/! Listen: apple. What is the first sound? /a/!"',
        5: '"Listen: map. What is the first sound? Mmm! Listen: pan. What is the first sound? /p/!"',
        6: '"Listen: see. What is the first sound? Sss! Listen: map. What is the first sound? Mmm!"',
        7: '"Listen: teddy. What is the first sound? /t/! Listen: see. What is the first sound? Sss!"',
    };

    /** The new day-1 audio list of each week (the rows C01-05 to C07-05). */
    const audio: Record<number, string[]> = {
        1: [],
        2: ['phonemes/daniel/04-n.mp3', 'phonemes/daniel/04-n.mp3'],
        3: ['phonemes/daniel/26-a-short.mp3', 'phonemes/daniel/04-n.mp3'],
        4: ['phonemes/daniel/03-p.mp3', 'phonemes/daniel/26-a-short.mp3'],
        5: ['phonemes/daniel/05-m.mp3', 'phonemes/daniel/03-p.mp3'],
        6: ['phonemes/daniel/01-s.mp3', 'phonemes/daniel/05-m.mp3'],
        7: ['phonemes/daniel/02-t.mp3', 'phonemes/daniel/01-s.mp3'],
    };

    it('gives the new day-1 opening line of w01 to w07', () => {
        for (let week = 1; week <= 7; week += 1) {
            const opening = rawWeek(week).opening as { pa: { en: string }[] };
            expect(opening.pa[0].en, `week ${week}`).toBe(day1[week]);
        }
    });

    it('gives the new day-1 audio list of w01 to w07', () => {
        for (let week = 1; week <= 7; week += 1) {
            const opening = rawWeek(week).opening as { audio: string[][] };
            expect(opening.audio[0], `week ${week}`).toEqual(audio[week]);
        }
    });

    it('gives the new benchmark rows 5 to 8 of w08, with no position', () => {
        const rows = [
            { sound: '/t/', pictures: ['drum', 'ten', 'fish'], answer: 'ten' },
            { sound: '/m/', pictures: ['dog', 'bus', 'milk'], answer: 'milk' },
            { sound: '/a/', pictures: ['fish', 'ant', 'dog'], answer: 'ant' },
            { sound: '/n/', pictures: ['hat', 'net', 'cup'], answer: 'net' },
        ];
        const benchmark = rawWeek(8).benchmark as { paper: { items: Record<string, unknown>[] } };
        const items = benchmark.paper.items;
        rows.forEach((row, index) => {
            const item = items[index + 4];
            expect(item.kind, `row ${index + 5}`).toBe('circle-picture');
            expect(item.sound, `row ${index + 5}`).toBe(row.sound);
            expect(item.pictures, `row ${index + 5}`).toEqual(row.pictures);
            expect(item.answer, `row ${index + 5}`).toBe(row.answer);
            expect(Object.keys(item), `row ${index + 5} has no position`).not.toContain('position');
        });
    });
});

// ---------------------------------------------------------------------------------------------
// S10: the guards of the file
// ---------------------------------------------------------------------------------------------

describe('S10 the guards of the file (FR14-5)', () => {
    it('names no track folder', () => {
        expect(fs.readFileSync(SELF_FILE, 'utf8').includes(FORBIDDEN_PATH)).toBe(false);
    });

    it('writes no file, so it writes nothing under the content folder', () => {
        const source = fs.readFileSync(SELF_FILE, 'utf8');
        expect(WRITE_CALLS.filter((name) => source.includes(name))).toEqual([]);
    });
});
