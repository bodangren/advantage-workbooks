// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema } from '../lib/storytime/schema';
import { checkStorytimeCoverCopy } from '../lib/storytime/print/covers';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { compileStorytimeReaders, storytimeReaderLeafSides, type StorytimeReaderLeafSide } from '../lib/storytime/print/readers';
import { LEAF_IMPOSITION, LEAF_TURN_DEG, READER_PAGE_MM, pageTurnDeg, simulateTopFold } from './fixtures/storytime-reader-leaf';

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
        for (const page of pages) {
            const want_turn = pageTurnDeg(face, num(page, 'data-page-number'));
            if (num(page, 'data-turn-deg') !== want_turn) problems.push(`[turn] ${face} page ${page.getAttribute('data-page-number')}: turn ${page.getAttribute('data-turn-deg')}, want ${want_turn}`);
        }
    }
    const closed = doc.querySelectorAll('[data-diagram="closed"] [data-page]');
    if (closed.length !== 1 || num(closed[0], 'data-page-number') !== LEAF_IMPOSITION[0].front[0] || num(closed[0], 'data-view-turn-deg') !== 0) problems.push('[closed] the closed reader must show page 1 upright');
    const backCover = doc.querySelectorAll('[data-diagram="back"] [data-page]');
    if (backCover.length !== 1 || num(backCover[0], 'data-page-number') !== LEAF_IMPOSITION[0].front[1] || num(backCover[0], 'data-view-turn-deg') !== 0) problems.push('[back-cover] the turned-over reader must show page 12 upright');
    const middle = Array.from(doc.querySelectorAll('[data-diagram="middle"] [data-page]'));
    if (middle.map((page) => num(page, 'data-page-number')).join('|') !== LEAF_IMPOSITION[2].back.join('|')) problems.push('[middle] the open middle must show pages 6|7');
    for (const page of middle) if (num(page, 'data-view-turn-deg') !== 0) problems.push('[middle] the middle pages must read upright');
    return problems;
}

/** The sides with one change: a back page turned, the pages of a front swapped, or page 12 turned upside down again. */
function mutated(sides: StorytimeReaderLeafSide[], kind: 'back-turned' | 'front-swapped' | 'page12-turned' | 'page1-frameless' | 'page12-framed'): StorytimeReaderLeafSide[] {
    return sides.map((side) => {
        if (kind === 'page1-frameless' && side.leaf === 1 && side.side === 'front') return { ...side, html: side.html.replace(/class="reader-picture"/g, 'class="reader-none"') };
        if (kind === 'page12-framed' && side.leaf === 1 && side.side === 'front') return { ...side, html: side.html.replace(/(data-half="bottom"[^>]*>)/, '$1<div class="reader-picture"></div>') };
        if (kind === 'page12-turned' && side.leaf === 1 && side.side === 'front') return { ...side, html: side.html.replace(/data-turn-deg="0"/g, 'data-turn-deg="180"') };
        if (kind === 'back-turned' && side.leaf === 1 && side.side === 'back') return { ...side, html: side.html.replace(/data-turn-deg="0"/g, 'data-turn-deg="180"') };
        if (kind === 'front-swapped' && side.leaf === 1 && side.side === 'front') return { ...side, pages: [side.pages[1], side.pages[0]] };
        return side;
    });
}

/** The shipped week 1 (L2): the readers build and its style text, the source of the leaf mark rule. */
function readersCss(): string {
    const week = StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')));
    return compileStorytimeReaders([week], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook' }).html;
}

/** The pages that print a picture frame (the leaf contract: the cover and the story pages 3 to 10). Pages 2, 11, and 12 print none. */
const hasFrame = (pageNumber: number): boolean => pageNumber === 1 || (pageNumber >= 3 && pageNumber <= 10);

/** The page areas and the absolute box of a rect, in millimeters of the leaf drawing (the origin of the page group plus the local box). */
function absBox(rect: Element): { left: number; top: number; right: number; bottom: number } {
    const group = rect.closest('[data-page]');
    const ox = group ? num(group, 'data-origin-x') : 0;
    const oy = group ? num(group, 'data-origin-y') : 0;
    const x = num(rect, 'x') + ox;
    const y = num(rect, 'y') + oy;
    return { left: x, top: y, right: x + num(rect, 'width'), bottom: y + num(rect, 'height') };
}

/** Lists the ways in which the frames of the leaf drawings differ from the v13 leaf: a frame only on a page that prints one, and no rectangle around two pages. */
function frameProblems(doc: Document): string[] {
    const problems: string[] = [];
    for (const svg of Array.from(doc.querySelectorAll('svg[data-diagram]'))) {
        const diagram = svg.getAttribute('data-diagram');
        const pages = Array.from(svg.querySelectorAll('[data-page]'));
        for (const page of pages) {
            const number = num(page, 'data-page-number');
            const frames = page.querySelectorAll('[data-part="frame"]').length;
            if (hasFrame(number) && frames !== 1) problems.push(`[frame] ${diagram} page ${number}: ${frames} frames, want 1`);
            if (!hasFrame(number) && frames !== 0) problems.push(`[frame] ${diagram} page ${number}: ${frames} frames, want none`);
        }
        const areas = pages.map((page) => ({ left: num(page, 'data-origin-x'), top: num(page, 'data-origin-y'), right: num(page, 'data-origin-x') + READER_PAGE_MM.widthMm, bottom: num(page, 'data-origin-y') + READER_PAGE_MM.heightMm }));
        for (const rect of Array.from(svg.querySelectorAll('rect'))) {
            if (['leaf', 'student-page', 'left-page'].includes(rect.getAttribute('data-part') ?? '')) continue;
            const box = absBox(rect);
            const enclosed = areas.filter((area) => box.left <= area.left + 0.01 && box.top <= area.top + 0.01 && box.right >= area.right - 0.01 && box.bottom >= area.bottom - 0.01);
            if (enclosed.length > 1) problems.push(`[frame-both] ${diagram}: one rectangle (${rect.getAttribute('data-part') ?? 'no part'}) encloses ${enclosed.length} pages`);
        }
    }
    const cut = doc.querySelector('svg[data-diagram="cut"]');
    const front = Array.from(doc.querySelectorAll('svg[data-diagram="cut"] [data-page], svg[data-diagram="fold-leaf"][data-face="front"] [data-page]'));
    for (const page of front) {
        if (num(page, 'data-page-number') !== 1) continue;
        const frame = page.querySelector('[data-part="frame"]');
        const area = page.querySelector('rect[data-part="page"]');
        if (!frame || !area) { problems.push('[frame-own] page 1 has no frame of its own'); continue; }
        const box = absBox(frame);
        const origin = { left: num(page, 'data-origin-x'), top: num(page, 'data-origin-y') };
        if (box.left < origin.left || box.top < origin.top || box.right > origin.left + READER_PAGE_MM.widthMm || box.bottom > origin.top + READER_PAGE_MM.heightMm) problems.push('[frame-own] the frame of page 1 leaves the page 1 half');
    }
    if (!cut) problems.push('[frame] no cut diagram');
    return problems;
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
        const ticks = Array.from(cut.querySelectorAll('[data-part="tick"]'));
        expect(ticks.map((tick) => tick.getAttribute('data-edge'))).toEqual(['top', 'bottom']);
        for (const tick of ticks) {
            expect(num(tick, 'data-distance-mm')).toBe(12);
            expect(num(tick, 'x1')).toBe(num(rect(cut, 'student-page'), 'x') + 12);
            expect(num(tick, 'x2')).toBe(num(tick, 'x1'));
        }
        expect(Math.abs(num(cut.querySelector('[data-part="cut-slit"]'), 'x') + num(cut.querySelector('[data-part="cut-slit"]'), 'width') / 2 - (num(rect(cut, 'student-page'), 'x') + 12))).toBeLessThan(0.01);
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

    it('R-A47-6 mutants: a back page turned, the pages of a front swapped, or page 12 turned again, fail the imposition check', async () => {
        const { compileReaderHowto } = await howto();
        for (const kind of ['back-turned', 'front-swapped', 'page12-turned', 'page1-frameless', 'page12-framed'] as const) {
            const changed = docOf(compileReaderHowto(mutated(readerSides(), kind)).html);
            const problems = [...impositionProblems(changed), ...frameProblems(changed)];
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

    it('R-A47-12 the fold line is the only dashed line, and each fold line says "fold" at both ends', async () => {
        const { compileReaderHowto } = await howto();
        const doc = docOf(compileReaderHowto(readerSides()).html);
        const dashed = Array.from(doc.querySelectorAll('[stroke-dasharray]'));
        expect(dashed.length).toBeGreaterThan(0);
        for (const element of dashed) expect(element.getAttribute('data-part'), 'a dashed line that is not a fold line').toBe('fold-line');
        expect(doc.querySelector('[data-part="perforation"]'), 'no dashed line at the side of a leaf').toBeNull();
        for (const svg of Array.from(doc.querySelectorAll('svg[data-diagram="fold-leaf"], svg[data-diagram="cut"]'))) {
            const thai = Array.from(svg.querySelectorAll('[data-label] .th')).filter((text) => text.textContent === 'พับ');
            const english = Array.from(svg.querySelectorAll('[data-label] .en')).filter((text) => text.textContent === 'fold');
            expect(thai.length, 'Thai fold label at each end').toBeGreaterThanOrEqual(2);
            expect(english.length, 'English fold label at each end').toBeGreaterThanOrEqual(2);
        }
        expect(Array.from(doc.querySelectorAll('svg[data-diagram="staple"] [stroke-dasharray]'))).toHaveLength(0);
    });

    it('R-A47-13 page 12 is the back cover: it prints upright, and the fold model reads it when the reader is turned over', async () => {
        const { compileReaderHowto } = await howto();
        const doc = docOf(compileReaderHowto(readerSides()).html);
        expect(pageTurnDeg('front', 12)).toBe(0);
        const slot = simulateTopFold().find((entry) => entry.position === 12);
        expect(slot?.place).toBe('back');
        expect(slot?.uprightTurnDeg).toBe(pageTurnDeg('front', 12));
        const printed = Array.from(doc.querySelectorAll('svg[data-diagram="fold-leaf"][data-face="front"] [data-page]')).map((page) => [num(page, 'data-page-number'), num(page, 'data-turn-deg')]);
        expect(printed).toEqual([[1, 180], [12, 0]]);
        expect(doc.querySelector('svg[data-diagram="back"] [data-part="fold-edge"]')?.getAttribute('data-side')).toBe('top');
        expect(doc.querySelector('[data-turn-arrow="over"]')).not.toBeNull();
    });

    it('R-A47-14 each tick of step 1 is large and thick: at least 10 mm long and 1 mm thick on the sheet', async () => {
        const { compileReaderHowto } = await howto();
        const cut = docOf(compileReaderHowto(readerSides()).html).querySelector('svg[data-diagram="cut"]')!;
        const scale = parseFloat(cut.getAttribute('width')!) / Number(cut.getAttribute('viewBox')!.split(' ')[2]);
        const ticks = Array.from(cut.querySelectorAll('[data-part="tick"]'));
        expect(ticks).toHaveLength(2);
        for (const tick of ticks) {
            const length = Math.abs(num(tick, 'y2') - num(tick, 'y1')) * scale;
            const thick = num(tick, 'stroke-width') * scale;
            expect(length, `${tick.getAttribute('data-edge')} tick length in mm on the sheet`).toBeGreaterThanOrEqual(10);
            expect(thick, `${tick.getAttribute('data-edge')} tick thickness in mm on the sheet`).toBeGreaterThanOrEqual(1);
        }
    });

    it('R-A47-15 two labels "ขีดสั้น ๆ / tick", each with a leader line that ends at a tick', async () => {
        const { compileReaderHowto } = await howto();
        const cut = docOf(compileReaderHowto(readerSides()).html).querySelector('svg[data-diagram="cut"]')!;
        for (const edge of ['top', 'bottom']) {
            const label = cut.querySelector(`[data-label][data-for="tick-${edge}"]`);
            expect(label?.querySelector('.th')?.textContent, `Thai tick label (${edge})`).toBe('ขีดสั้น ๆ');
            expect(label?.querySelector('.en')?.textContent, `English tick label (${edge})`).toBe('tick');
            const leader = cut.querySelector(`[data-part="tick-leader"][data-for="tick-${edge}"]`);
            const tick = cut.querySelector(`[data-part="tick"][data-edge="${edge}"]`)!;
            expect(leader, `leader line (${edge})`).not.toBeNull();
            const half = num(tick, 'stroke-width') / 2;
            const end = { x: num(leader, 'x2'), y: num(leader, 'y2') };
            expect(Math.abs(end.x - (num(tick, 'x1') - half)), `the leader ends at the edge of the ${edge} tick`).toBeLessThan(1);
            expect(end.y).toBeGreaterThanOrEqual(Math.min(num(tick, 'y1'), num(tick, 'y2')));
            expect(end.y).toBeLessThanOrEqual(Math.max(num(tick, 'y1'), num(tick, 'y2')));
        }
    });

    it('R-A47-16 the frames follow the v13 leaf: page 1 has its own frame, pages 2, 11, and 12 have none, and no rectangle runs around two pages', async () => {
        const { compileReaderHowto } = await howto();
        const doc = docOf(compileReaderHowto(readerSides()).html);
        expect(frameProblems(doc)).toEqual([]);
        for (const svg of Array.from(doc.querySelectorAll('svg[data-diagram="cut"], svg[data-diagram="fold-leaf"]'))) {
            for (const number of [2, 11, 12]) {
                for (const page of Array.from(svg.querySelectorAll(`[data-page][data-page-number="${number}"]`))) expect(page.querySelector('[data-part="frame"]'), `${svg.getAttribute('data-diagram')} page ${number}`).toBeNull();
            }
        }
        expect(doc.querySelectorAll('svg[data-diagram="fold-leaf"][data-face="front"] [data-part="frame"]')).toHaveLength(1);
        expect(doc.querySelectorAll('svg[data-diagram="fold-leaf"][data-face="back"] [data-part="frame"]')).toHaveLength(0);
        expect(doc.querySelectorAll('svg[data-diagram="back"] [data-part="frame"]'), 'the back cover has no frame').toHaveLength(0);
        expect(doc.querySelectorAll('svg[data-diagram="closed"] [data-part="frame"]'), 'the cover has a frame').toHaveLength(1);
        expect(doc.querySelectorAll('svg[data-diagram="middle"] [data-part="frame"]'), 'story pages 6 and 7 have frames').toHaveLength(2);
    });

    it('R-A47-17 the leaf mark has the place and the orientation of the v13 leaf: 2 mm from the top, centered over the leaf, upright, not turned with a page', async () => {
        const { compileReaderHowto } = await howto();
        const css = readersCss();
        const rule = /\.leaf-mark \{([^}]*)\}/.exec(css)![1];
        const frontRule = /\.reader-side\[data-leaf-side="front"\] \.leaf-mark \{([^}]*)\}/.exec(css)![1];
        const topMm = Number(/top: ([\d.]+)mm/.exec(rule)![1]);
        const backCenter = Number(/left: ([\d.]+)mm/.exec(rule)![1]);
        const frontCenter = Number(/left: ([\d.]+)mm/.exec(frontRule)![1]) - STORYTIME_PRINT_PROFILE.perforationMm;
        expect(rule).toContain('transform: translateX(-50%)');
        expect(rule).not.toMatch(/rotate/);
        const studentBook = fs.readFileSync(path.resolve(__dirname, '../lib/storytime/print/student-book.ts'), 'utf8');
        const studentRule = /^\.leaf-mark \{.*$/m.exec(studentBook)![0];
        expect(studentRule).toContain(`top: ${topMm}mm`);
        expect(studentRule).toContain('transform: translateX(-50%)');
        expect(studentRule).not.toMatch(/rotate/);
        const doc = docOf(compileReaderHowto(readerSides()).html);
        const marks = [
            { svg: doc.querySelector('svg[data-diagram="cut"]')!, want: frontCenter, side: 'front' },
            ...(['front', 'back'] as const).map((face) => ({ svg: doc.querySelector(`svg[data-diagram="fold-leaf"][data-face="${face}"]`)!, want: face === 'front' ? frontCenter : backCenter, side: face })),
        ];
        for (const { svg, want, side } of marks) {
            const mark = svg.querySelector('[data-part="leaf-mark"]')!;
            expect(mark, `${svg.getAttribute('data-diagram')} ${side}: a leaf mark`).not.toBeNull();
            expect(num(mark, 'data-top-mm')).toBe(topMm);
            expect(num(mark, 'data-center-mm')).toBe(want);
            expect(num(mark, 'data-turn-deg'), 'the mark is upright').toBe(0);
            expect(mark.getAttribute('text-anchor')).toBe('middle');
            expect(mark.closest('[data-page]'), 'the mark is not inside a turned page').toBeNull();
            expect(mark.getAttribute('transform')).toBeNull();
        }
    });

    it('R-A47-11 the leaf mark in the cut diagram is the mark of the real leaf', async () => {
        const { compileReaderHowto } = await howto();
        const sides = readerSides();
        const doc = docOf(compileReaderHowto(sides).html);
        const mark = doc.querySelector('svg[data-diagram="cut"] [data-part="leaf-mark"]')!;
        // changed 2026-11-12 (D-A, orchestrator decision): the diagram copies the sheet text of the real mark.
        expect(mark.textContent?.replace(/\s+/g, ' ').trim()).toBe(`${sides[0].title} \u00b7 sheet 1 of 3`);
    });
});
