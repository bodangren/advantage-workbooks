// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema } from '../lib/storytime/schema';
import { checkStorytimeCoverCopy } from '../lib/storytime/print/covers';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { storytimeReaderLeafSides, type StorytimeReaderLeafSide } from '../lib/storytime/print/readers';
import { LEAF_IMPOSITION, LEAF_TURN_DEG, READER_PAGE_MM, simulateTopFold } from './fixtures/storytime-reader-leaf';

/**
 * A-47: the teacher how-to "How to make a student book" (Daniel 2026-11-04): cut, fold, staple, one
 * numbered diagram for each step and one picture of the finished reader. The diagrams read their
 * numbers from the leaf sides of `readers.ts`, and these tests compare them with the leaf fixture.
 */
type HowtoApi = typeof import('../lib/storytime/print/reader-howto');

const howtoPath = path.resolve(__dirname, '../lib/storytime/print/reader-howto.ts');

async function howto(): Promise<HowtoApi> {
    expect(fs.existsSync(howtoPath), 'Missing module: lib/storytime/print/reader-howto.ts').toBe(true);
    return import(/* @vite-ignore */ howtoPath) as Promise<HowtoApi>;
}

/** The 6 leaf sides of the first reader of the shipped week 1, as the readers build makes them. */
function readerSides(): StorytimeReaderLeafSide[] {
    const week = StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')));
    return storytimeReaderLeafSides(week, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook', bookTitle: week.books[0].title });
}

const docOf = (html: string): Document => new DOMParser().parseFromString(html, 'text/html');
const num = (element: Element | null, name: string): number => Number(element?.getAttribute(name));

/** Lists the ways in which the page numbers and turns of the diagrams differ from the leaf fixture. */
function impositionProblems(doc: Document): string[] {
    const problems: string[] = [];
    const leaf = LEAF_IMPOSITION[0];
    const fold = Array.from(doc.querySelectorAll('[data-diagram="fold-leaf"]'));
    for (const face of ['front', 'back'] as const) {
        const svg = fold.find((entry) => entry.getAttribute('data-face') === face);
        if (!svg) { problems.push(`[fold-diagram] no fold diagram for the ${face}`); continue; }
        const pages = Array.from(svg.querySelectorAll('[data-page]'));
        const want = leaf[face];
        if (pages.map((page) => num(page, 'data-page-number')).join('|') !== want.join('|')) problems.push(`[imposition] ${face}: pages ${pages.map((page) => page.getAttribute('data-page-number')).join('|')}, want ${want.join('|')}`);
        if (pages.map((page) => page.getAttribute('data-half')).join('|') !== 'top|bottom') problems.push(`[halves] ${face}: halves do not read top|bottom`);
        for (const page of pages) if (num(page, 'data-turn-deg') !== LEAF_TURN_DEG[face]) problems.push(`[turn] ${face} page ${page.getAttribute('data-page-number')}: turn ${page.getAttribute('data-turn-deg')}, want ${LEAF_TURN_DEG[face]}`);
    }
    const closed = doc.querySelectorAll('[data-diagram="closed"] [data-page]');
    if (closed.length !== 1 || num(closed[0], 'data-page-number') !== LEAF_IMPOSITION[0].front[0] || num(closed[0], 'data-view-turn-deg') !== 0) problems.push('[closed] the closed reader must show page 1 upright');
    const middle = Array.from(doc.querySelectorAll('[data-diagram="middle"] [data-page]'));
    if (middle.map((page) => num(page, 'data-page-number')).join('|') !== LEAF_IMPOSITION[2].back.join('|')) problems.push('[middle] the open middle must show pages 6|7');
    for (const page of middle) if (num(page, 'data-view-turn-deg') !== 0) problems.push('[middle] the middle pages must read upright');
    return problems;
}

/** The sides with one change: the turn of the back of leaf 1 (a back page turned) or the pages of the front of leaf 1 swapped. */
function mutated(sides: StorytimeReaderLeafSide[], kind: 'back-turned' | 'front-swapped'): StorytimeReaderLeafSide[] {
    return sides.map((side) => {
        if (kind === 'back-turned' && side.leaf === 1 && side.side === 'back') return { ...side, html: side.html.replace(/data-turn-deg="0"/g, 'data-turn-deg="180"') };
        if (kind === 'front-swapped' && side.leaf === 1 && side.side === 'front') return { ...side, pages: [side.pages[1], side.pages[0]] };
        return side;
    });
}

describe('A-47 the how-to "How to make a student book"', () => {
    it('R-A47-1 the fixture agrees with the real sides of readers.ts (the data the diagrams read)', () => {
        const sides = readerSides();
        expect(sides.map((side) => [side.leaf, side.side, ...side.pages])).toEqual(
            LEAF_IMPOSITION.flatMap(({ leaf, front, back }) => [[leaf, 'front', ...front], [leaf, 'back', ...back]]),
        );
        const cover = simulateTopFold().find((slot) => slot.position === 1);
        expect(cover?.place).toBe('cover');
        expect(cover?.uprightTurnDeg).toBe(LEAF_TURN_DEG.front);
    });

    it('R-A47-2 the steps are cut, fold, staple, in that order, and each has a diagram', async () => {
        const { compileReaderHowto } = await howto();
        const doc = docOf(compileReaderHowto(readerSides()).html);
        const steps = Array.from(doc.querySelectorAll('[data-step]'));
        expect(steps.map((step) => step.getAttribute('data-step'))).toEqual(['cut', 'fold', 'staple']);
        expect(steps.map((step) => step.getAttribute('data-step-number'))).toEqual(['1', '2', '3']);
        for (const step of steps) expect(step.querySelectorAll('svg[data-diagram]').length, `${step.getAttribute('data-step')} has a diagram`).toBeGreaterThanOrEqual(1);
        expect(steps[0].querySelector('svg[data-diagram="cut"]')).not.toBeNull();
        expect(steps[1].querySelector('svg[data-diagram="fold-leaf"]')).not.toBeNull();
        expect(steps[1].querySelector('svg[data-diagram="nest"]')).not.toBeNull();
        expect(steps[2].querySelector('svg[data-diagram="staple"]')).not.toBeNull();
        expect(doc.querySelectorAll('svg[data-diagram="closed"]').length, 'one picture of the finished reader').toBe(1);
        expect(doc.querySelector('[data-turn-arrow="up"]'), 'an arrow that shows a page turning UP').not.toBeNull();
    });

    it('R-A47-3 the cut diagram and the fold diagram use the profile size: 198 x 297 after the cut, the fold at 148.5, the 12 mm strip', async () => {
        const { compileReaderHowto } = await howto();
        const doc = docOf(compileReaderHowto(readerSides()).html);
        const cut = doc.querySelector('svg[data-diagram="cut"]')!;
        const rect = (root: Element, part: string): Element => root.querySelector(`rect[data-part="${part}"]`)!;
        expect([num(rect(cut, 'student-page'), 'width'), num(rect(cut, 'student-page'), 'height')]).toEqual([STORYTIME_PRINT_PROFILE.trim.widthMm, STORYTIME_PRINT_PROFILE.trim.heightMm]);
        expect([num(rect(cut, 'leaf'), 'width'), num(rect(cut, 'leaf'), 'height')]).toEqual([198, 297]);
        expect(num(rect(cut, 'strip'), 'width')).toBe(12);
        expect(num(cut.querySelector('[data-part="perforation"]'), 'data-distance-mm')).toBe(12);
        expect(num(cut.querySelector('[data-part="fold-line"]'), 'data-position-mm')).toBe(148.5);
        const folds = Array.from(doc.querySelectorAll('svg[data-diagram="fold-leaf"]'));
        expect(folds.map((svg) => svg.getAttribute('data-face'))).toEqual(['front', 'back']);
        for (const svg of folds) {
            expect([num(rect(svg, 'leaf'), 'width'), num(rect(svg, 'leaf'), 'height')]).toEqual([198, 297]);
            expect(num(svg.querySelector('[data-part="fold-line"]'), 'data-position-mm')).toBe(148.5);
            expect(num(svg.querySelector('[data-part="fold-line"]'), 'y1')).toBe(148.5);
            for (const page of Array.from(svg.querySelectorAll('[data-page] rect[data-part="page"]'))) {
                expect([num(page, 'width'), num(page, 'height')]).toEqual([READER_PAGE_MM.widthMm, READER_PAGE_MM.heightMm]);
            }
        }
    });

    it('R-A47-4 the page numbers and their turns in the diagrams equal the imposition of readers.ts', async () => {
        const { compileReaderHowto } = await howto();
        const doc = docOf(compileReaderHowto(readerSides()).html);
        expect(impositionProblems(doc)).toEqual([]);
        const middle = simulateTopFold().filter((slot) => slot.position === 6 || slot.position === 7);
        expect(middle.map((slot) => [slot.leaf, slot.face, slot.half, slot.place])).toEqual([[3, 'back', 'top', 'above'], [3, 'back', 'bottom', 'below']]);
    });

    it('R-A47-5 the diagrams follow the profile, not a retyped size', async () => {
        const { compileReaderHowto } = await howto();
        const profile = { ...STORYTIME_PRINT_PROFILE, perforationMm: 15 };
        const doc = docOf(compileReaderHowto(readerSides(), profile).html);
        const cut = doc.querySelector('svg[data-diagram="cut"]')!;
        expect(num(cut.querySelector('rect[data-part="strip"]'), 'width')).toBe(15);
        expect(num(cut.querySelector('rect[data-part="leaf"]'), 'width')).toBe(195);
        expect(doc.body.textContent).toContain('15 mm');
        expect(doc.body.textContent).not.toContain('12 mm');
    });

    it('R-A47-6 mutants: a back page turned, or the pages of a front swapped, fail the imposition check', async () => {
        const { compileReaderHowto } = await howto();
        for (const kind of ['back-turned', 'front-swapped'] as const) {
            const problems = impositionProblems(docOf(compileReaderHowto(mutated(readerSides(), kind)).html));
            expect(problems.length, `mutant ${kind} must be caught`).toBeGreaterThan(0);
        }
    });

    it('R-A47-7 there are 2 staples, both on the fold at the top of the closed reader', async () => {
        const { compileReaderHowto } = await howto();
        const doc = docOf(compileReaderHowto(readerSides()).html);
        const svg = doc.querySelector('svg[data-diagram="staple"]')!;
        const staples = Array.from(svg.querySelectorAll('[data-staple]'));
        expect(staples).toHaveLength(2);
        expect(doc.querySelectorAll('[data-staple]')).toHaveLength(2);
        const foldY = num(svg.querySelector('[data-part="fold-edge"]'), 'y1');
        const width = num(svg.querySelector('rect[data-part="closed-reader"]'), 'width');
        expect(width).toBe(READER_PAGE_MM.widthMm);
        for (const staple of staples) {
            expect(staple.getAttribute('data-on-fold')).toBe('true');
            expect(Math.abs(num(staple, 'data-y') - foldY)).toBeLessThan(0.01);
            expect(num(staple, 'data-x')).toBeGreaterThan(0);
            expect(num(staple, 'data-x')).toBeLessThan(width);
        }
        expect(svg.querySelector('[data-part="fold-edge"]')!.getAttribute('data-side')).toBe('top');
    });

    it('R-A47-8 every English line has a Thai line before it, and every Thai line holds Thai', async () => {
        const { compileReaderHowto } = await howto();
        const doc = docOf(compileReaderHowto(readerSides()).html);
        const english = Array.from(doc.querySelectorAll('.en'));
        expect(english.length).toBeGreaterThan(20);
        for (const element of english) {
            const before = element.previousElementSibling;
            expect(before?.getAttribute('class')?.split(/\s+/), `Thai before "${element.textContent}"`).toContain('th');
            expect(before?.textContent ?? '').toMatch(/[฀-๿]/);
        }
        expect(doc.querySelectorAll('.th').length).toBe(english.length);
    });

    it('R-A47-9 the copy names "Storytime Advantage" only: no CEFR level, no other brand, no year', async () => {
        const { compileReaderHowto } = await howto();
        const doc = docOf(compileReaderHowto(readerSides()).html);
        const text = doc.body.textContent ?? '';
        expect(checkStorytimeCoverCopy(text)).toEqual([]);
        expect(text).toContain('Storytime Advantage');
        expect(text).not.toMatch(/Primary|Reading Advantage|Level|CEFR|Sprout/i);
        expect(text).toContain('วิธีทำหนังสือเล่มเล็กจากสมุดนักเรียน');
        expect(text).toContain('How to make a student book');
    });

    it('R-A47-10 two A4 portrait sheets, black and white, with the Sarabun and Andika print faces', async () => {
        const { compileReaderHowto } = await howto();
        const { html } = compileReaderHowto(readerSides());
        const doc = docOf(html);
        expect(doc.querySelectorAll('.sheet')).toHaveLength(2);
        expect(html).toContain('@page { size: 210mm 297mm; margin: 0; }');
        expect(html).toContain("font-family: 'Sarabun'");
        expect(html).toContain("font-family: 'Andika'");
        expect(html).toContain('andika-regular.ttf');
        expect(html).toContain('sarabun-thai-400-normal.woff2');
        const colors = new Set((html.match(/#[0-9a-fA-F]{3,6}\b/g) ?? []).map((color) => color.toLowerCase()));
        expect([...colors].filter((color) => !['#000', '#fff', '#000000', '#ffffff'].includes(color))).toEqual([]);
        expect(doc.querySelectorAll('img, image')).toHaveLength(0);
    });

    it('R-A47-11 the leaf mark in the cut diagram is the mark of the real leaf', async () => {
        const { compileReaderHowto } = await howto();
        const sides = readerSides();
        const doc = docOf(compileReaderHowto(sides).html);
        const mark = doc.querySelector('svg[data-diagram="cut"] [data-part="leaf-mark"]')!;
        expect(mark.textContent?.replace(/\s+/g, ' ').trim()).toBe(`${sides[0].title} · leaf 1 of 3`);
    });
});
