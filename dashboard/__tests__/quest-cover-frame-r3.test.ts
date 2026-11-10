// @vitest-environment jsdom
/**
 * Red of the option A front frame, round 3 (track storytime_cover_options_20261106, the
 * Task (Red, no game bar and the dog clear) pair of 2026-11-10).
 *
 * The owner words (Daniel, Google Tasks bFdjbzVmNEFDbXNiaFdiSg, the look check of the v4 covers,
 * relayed by the PM): "On the cover the top XP bar is unnecessary because we don't have a gaming
 * theme and the bottom title bar covers the dog".
 *
 * The PM decisions of 2026-11-10:
 *   (1) The game bar, the part mark "game-bar" with its 5 band icons, goes off the student front
 *       and the teacher front. The reader A3 game bar stays in this run. It goes in Task 2.9 part 2.
 *   (2) The title plaque of both fronts moves down and gets thinner, to about 278 mm to 292 mm
 *       from the top edge. It stands at 239 mm to 279 mm now. The texts stay the same, and the
 *       teacher Sprout tab, the band pill, moves with the plaque.
 *   (3) The crest stays.
 *   (4) The dog of the student front art spans about x 84 mm to 132 mm and y 202 mm to 277 mm.
 *       The orchestrator measured the art.
 *
 * The contract of this file:
 *   F1: QUEST_BOXES holds no key "student-front:game-bar" and no key "teacher-front:game-bar".
 *       The key "reader-a3:game-bar" stays.
 *   F2: The rendered student front and the rendered teacher front hold 0 elements with the part
 *       mark "game-bar". The rendered reader A3 cover holds 1.
 *   F3: The title plaque of the student front and the title plaque of the teacher front stand at
 *       277 mm or more from the top edge, end at 292 mm or less, are 12 mm or more high, are
 *       120 mm or more wide, and their centre sits at 105 mm. The plaque touches no part of the
 *       dog box of the student front art.
 *   F4: The teacher band pill, the Sprout tab, holds its centre at 105 mm, its bottom edge sits
 *       2 mm to 3 mm under the top edge of the teacher plaque, and it moved down with the plaque.
 *   F5: The crest and the series banner of both fronts keep their present boxes.
 *   F6: The student front holds the level line once and the student line once. The teacher front
 *       holds the level line, the teacher line, and the Sprout tab once each. Both fronts show the
 *       series name in the series banner.
 *
 * The expected values below are hand written. The dog box comes from the orchestrator measure of
 * the art. The file makes no network call and launches no browser.
 */
import { describe, expect, it } from 'vitest';
import {
    QUEST_BOXES,
    loadQuestCovers,
    questReaders,
    renderQuestCover,
    type QuestBookRow,
    type QuestReaderRow,
} from '../lib/storytime/print/cover-quest';

/** The art string of the renders. The test reads no art file (pin P8). */
const ART = 'data:image/png;base64,iVBORw0KGgo=';

/** The level line of the fronts, with the middle dot U+00B7 (spec FR-10.1). */
const LEVEL_LINE = 'Level 2 \u00b7 Unit 1';

/** The centre of a front, in millimetres. */
const FRONT_CENTRE_MM = 105;

/** The dog box of the student front art, in millimetres (the orchestrator measure of the art). */
const DOG_BOX = { leftMm: 84, topMm: 202, widthMm: 48, heightMm: 75 };

/** One box in millimetres, with no kind. */
interface Rect {
    leftMm: number;
    topMm: number;
    widthMm: number;
    heightMm: number;
}

/**
 * Parses one rendered document.
 * @param html The rendered HTML.
 * @returns The document.
 */
function parseHtml(html: string): Document {
    expect(html, 'A render returns a string.').toBeTypeOf('string');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('parsererror'), 'The rendered HTML parses.').toBeNull();
    return doc;
}

/**
 * Counts one literal string inside another.
 * @param raw The text.
 * @param needle The literal string.
 * @returns The count of the occurrences.
 */
function countOf(raw: string, needle: string): number {
    return raw.split(needle).length - 1;
}

/**
 * Tells when two boxes share an area. The edges that touch do not share an area.
 * @param first The first box.
 * @param second The second box.
 * @returns True when the boxes share an area.
 */
function intersects(first: Rect, second: Rect): boolean {
    const overlapX = first.leftMm < second.leftMm + second.widthMm && second.leftMm < first.leftMm + first.widthMm;
    const overlapY = first.topMm < second.topMm + second.heightMm && second.topMm < first.topMm + first.heightMm;
    return overlapX && overlapY;
}

/**
 * Renders one front of the shipped Level 2 Unit 1 row.
 * @param kind The front kind.
 * @returns The page document.
 */
async function frontHtml(kind: 'student-front' | 'teacher-front'): Promise<string> {
    const data = loadQuestCovers();
    expect(data.books.length, 'quest.json holds one row.').toBe(1);
    const book: QuestBookRow = data.books[0];
    expect(book.level, 'the row is Level 2.').toBe(2);
    expect(book.unit, 'the row is Unit 1.').toBe(1);
    return renderQuestCover(kind, book, { art: ART }, { bleedMm: 0 });
}

/**
 * Renders the first reader cover of the A3 reader.
 * @returns The page document.
 */
async function readerHtml(): Promise<string> {
    const rows: QuestReaderRow[] = questReaders();
    expect(rows.length, 'questReaders gives 14 rows.').toBe(14);
    return renderQuestCover('reader-a3', rows[0], { art: ART }, { bleedMm: 0 });
}

describe('quest-cover-frame-r3: F1 to F6 (Red, no game bar and the dog clear)', () => {
    it('F1: the box table holds no front game bar and keeps the reader A3 game bar', () => {
        const keys = Object.keys(QUEST_BOXES);
        expect(keys, 'the box table holds no student front game bar').not.toContain('student-front:game-bar');
        expect(keys, 'the box table holds no teacher front game bar').not.toContain('teacher-front:game-bar');
        expect(QUEST_BOXES['reader-a3:game-bar'], 'the box table keeps the reader A3 game bar').toBeDefined();
    });

    it('F2: the fronts render no game bar and the reader A3 cover renders one', async () => {
        for (const kind of ['student-front', 'teacher-front'] as const) {
            const doc = parseHtml(await frontHtml(kind));
            expect(doc.querySelectorAll('[data-part="game-bar"]').length, `${kind} holds no game bar.`).toBe(0);
        }
        const reader = parseHtml(await readerHtml());
        expect(reader.querySelectorAll('[data-part="game-bar"]').length, 'the reader A3 cover holds one game bar.').toBe(1);
    });

    it('F3: the title plaque of both fronts stands below the dog of the student front art', () => {
        for (const kind of ['student-front', 'teacher-front'] as const) {
            const box = QUEST_BOXES[`${kind}:title-plaque`];
            expect(box, `the box table holds ${kind}:title-plaque.`).toBeDefined();
            expect(box.topMm, `${kind} plaque top is 277 mm or more.`).toBeGreaterThanOrEqual(277);
            expect(box.topMm + box.heightMm, `${kind} plaque bottom is 292 mm or less.`).toBeLessThanOrEqual(292);
            expect(box.heightMm, `${kind} plaque height is 12 mm or more.`).toBeGreaterThanOrEqual(12);
            expect(box.widthMm, `${kind} plaque width is 120 mm or more.`).toBeGreaterThanOrEqual(120);
            expect(
                Math.abs(box.leftMm + box.widthMm / 2 - FRONT_CENTRE_MM),
                `${kind} plaque centre is 105 mm.`,
            ).toBeLessThanOrEqual(0.5);
            expect(intersects(box, DOG_BOX), `${kind} plaque leaves the dog of the student front art clear.`).toBe(false);
        }
    });

    it('F4: the teacher Sprout tab sits on the top edge of the teacher plaque and moved down with it', () => {
        const pill = QUEST_BOXES['teacher-front:band-pill'];
        const plaque = QUEST_BOXES['teacher-front:title-plaque'];
        expect(pill, 'the box table holds teacher-front:band-pill.').toBeDefined();
        expect(plaque, 'the box table holds teacher-front:title-plaque.').toBeDefined();
        expect(
            Math.abs(pill.leftMm + pill.widthMm / 2 - FRONT_CENTRE_MM),
            'the tab centre is 105 mm.',
        ).toBeLessThanOrEqual(0.5);
        const gap = pill.topMm + pill.heightMm - plaque.topMm;
        expect(gap, 'the tab bottom sits 2 mm to 3 mm under the plaque top.').toBeGreaterThanOrEqual(2);
        expect(gap, 'the tab bottom sits 2 mm to 3 mm under the plaque top.').toBeLessThanOrEqual(3);
        expect(pill.topMm + pill.heightMm, 'the tab moved down with the plaque.').toBeGreaterThanOrEqual(279);
    });

    it('F5: the crest and the series banner of both fronts keep their present boxes', () => {
        for (const kind of ['student-front', 'teacher-front'] as const) {
            const crest = QUEST_BOXES[`${kind}:crest`];
            expect(crest, `the box table holds ${kind}:crest.`).toBeDefined();
            expect(crest.leftMm, `${kind} crest left.`).toBe(91);
            expect(crest.topMm, `${kind} crest top.`).toBe(28);
            expect(crest.widthMm, `${kind} crest width.`).toBe(28);
            expect(crest.heightMm, `${kind} crest height.`).toBe(28);
            const banner = QUEST_BOXES[`${kind}:series-banner`];
            expect(banner, `the box table holds ${kind}:series-banner.`).toBeDefined();
            expect(banner.leftMm, `${kind} series banner left.`).toBe(22);
            expect(banner.topMm, `${kind} series banner top.`).toBe(48);
            expect(banner.widthMm, `${kind} series banner width.`).toBe(166);
            expect(banner.heightMm, `${kind} series banner height.`).toBe(38);
        }
    });

    it('F6: both fronts hold their approved texts once', async () => {
        const student = await frontHtml('student-front');
        expect(countOf(student, LEVEL_LINE), 'the student front holds the level line once.').toBe(1);
        expect(countOf(student, 'Student Book'), 'the student front holds the student line once.').toBe(1);
        const teacher = await frontHtml('teacher-front');
        expect(countOf(teacher, LEVEL_LINE), 'the teacher front holds the level line once.').toBe(1);
        expect(countOf(teacher, 'Teacher Book'), 'the teacher front holds the teacher line once.').toBe(1);
        expect(countOf(teacher, 'Sprout'), 'the teacher front holds the Sprout tab once.').toBe(1);
        for (const [kind, html] of [
            ['student-front', student],
            ['teacher-front', teacher],
        ] as const) {
            const banner = parseHtml(html).querySelector('[data-part="series-banner"]');
            expect(banner, `${kind} holds a series banner.`).not.toBeNull();
            expect(countOf(banner!.outerHTML, 'Storytime'), `${kind} series banner holds Storytime once.`).toBe(1);
            expect(countOf(banner!.outerHTML, 'Advantage'), `${kind} series banner holds Advantage once.`).toBe(1);
        }
    });
});
