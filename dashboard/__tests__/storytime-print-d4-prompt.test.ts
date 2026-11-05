// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { storytimePrintPictures, storytimePrintPromptPicture, STORYTIME_PICTURE_LIST_VERSION } from '../lib/storytime/print/pictures';
import { checkStorytimePrintText } from '../lib/storytime/print/text-check';

/**
 * A-48 D4 prompt pictures (Forge items 23 and 24): the D4 scripts of weeks 5 and 7 say "draw their two eyes in
 * the face above it" and "color the ball". Each prompt has its own picture-list row of the use `d4-prompt`
 * (version 7, 196 book rows and 31 card rows). An older picture covers a prompt only when it shows the thing: the ducks of week 2,
 * the apple of week 3, and the cat of week 6 keep their rows.
 */

function weeks(): StorytimeWeek[] {
    return Array.from({ length: 8 }, (_v, index) => StorytimeWeekSchema.parse(
        JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8')),
    ));
}

const text = (element: Element): string => (element.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('A-48 D4 prompt pictures: the picture list', () => {
    it('D4P-rows: the list has 196 rows and exactly the 2 d4-prompt rows face (week 5) and ball (week 7), size class C, 1500 x 1500', () => {
        const rows = storytimePrintPictures(weeks());
        expect(STORYTIME_PICTURE_LIST_VERSION).toBe(7);
        expect(rows).toHaveLength(196);
        const prompts = rows.filter((row) => row.use === 'd4-prompt');
        expect(prompts.map((row) => row.id)).toEqual(['l2-w05-d4-prompt-face', 'l2-w07-d4-prompt-ball']);
        for (const row of prompts) {
            expect(row.sizeClass).toBe('C');
            expect([row.width, row.height]).toEqual([1500, 1500]);
            expect(row.fileName).toBe(`${row.id}-v1.png`);
            expect(row.lineArtFileName).toBe(`${row.id}-line-v1.png`);
        }
        expect(prompts.map((row) => [row.week, row.text])).toEqual([[5, 'face'], [7, 'ball']]);
    });

    it('D4P-json: the committed pictures.json holds the generated book list', () => {
        const committed = JSON.parse(fs.readFileSync(path.join(STORYTIME_ROOT, 'l2/print/pictures.json'), 'utf8')) as { use: string }[];
        expect(committed.filter((row) => row.use !== 'card')).toEqual(JSON.parse(JSON.stringify(storytimePrintPictures(weeks()))));
    });

    it('D4P-resolve: the prompt of week 5 and of week 7 resolves to its d4-prompt row, not to a story page; weeks 2, 3, and 6 keep their rows', () => {
        const all = weeks();
        const rows = storytimePrintPictures(all);
        const resolve = (week: number, word: string) => storytimePrintPromptPicture(all[week - 1], word, rows)?.id;
        expect(resolve(5, 'face')).toBe('l2-w05-d4-prompt-face');
        expect(resolve(7, 'ball')).toBe('l2-w07-d4-prompt-ball');
        expect(resolve(2, 'ducks')).toBe('l2-w02-story-page-how-many-ducks-three');
        expect(resolve(3, 'apple')).toBe('l2-w02-check-row-apple');
        expect(resolve(6, 'cat')).toBe('l2-w06-story-page-i-can-see-a-cat');
    });

    it('D4P-data: week 5 draws the face, week 7 colors the ball, and both print checks pass', () => {
        const all = weeks();
        expect([all[4].print!.writing.promptPicture, all[4].print!.writing.promptAction]).toEqual(['face', 'draw']);
        expect([all[6].print!.writing.promptPicture, all[6].print!.writing.promptAction]).toEqual(['ball', 'color']);
        for (const week of [all[4], all[6]]) {
            const failed = checkStorytimePrintText(week).filter((item) => item.status === 'fail');
            expect(failed.map((item) => `${item.id}: ${item.detail}`), `Week ${week.meta.week}`).toEqual([]);
        }
    });
});

describe('A-48 D4 prompt pictures: the write pages', () => {
    const d4Of = (week: number) => new DOMParser().parseFromString(compileStorytimeStudentBook(weeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html, 'text/html').querySelectorAll('.student-page[data-page-kind="writing"]')[week - 1].querySelector('[data-part="step-block"][data-step="D4"]')!;

    it.each([[5, 'l2-w05-d4-prompt-face', 'Draw.'], [7, 'l2-w07-d4-prompt-ball', 'Color.']])('D4P-page: week %i prints %s above the trace row with the label %s and one draw box', (week, id, label) => {
        const d4 = d4Of(week);
        const prompt = d4.querySelector('[data-part="prompt-row"]')!;
        expect(prompt.querySelector('.picture-box')!.getAttribute('data-picture-id')).toBe(id);
        const rowsInOrder = Array.from(d4.querySelectorAll('[data-part="prompt-row"], .work-row'));
        const frame = Array.from(d4.querySelectorAll('.work-row')).find((row) => row.querySelector('[data-part="writing-trace"]'))!;
        expect(rowsInOrder.indexOf(prompt), 'the picture row stands above the trace row').toBeLessThan(rowsInOrder.indexOf(frame));
        expect(Array.from(d4.querySelectorAll('.row-label'), text)).toContain(label);
        expect(d4.querySelectorAll('[data-part="writing-picture-box"]'), 'one draw box beside the prompt picture').toHaveLength(1);
    });
});
