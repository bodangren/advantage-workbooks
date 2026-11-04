import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { compileStorytimeReaders } from '../lib/storytime/print/readers';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';

/**
 * Fix 6 (Daniel 2026-11-04): "The dotted lines on the side of each page imply that these need to be cut and stapled
 * together at the side, but they are just folded and stapled at the top."
 * On a reader leaf side the fold line is the only dashed line, the picture frames are solid 0.3 mm lines, the tear-out
 * place is two short solid ticks with a scissors mark and a label in the 12 mm strip, and the fold line says "fold" at
 * both ends. The home cards keep their dashed cut line (a home card is cut out at the side).
 */

const scratch: string[] = [];
afterAll(() => {
    for (const dir of scratch) fs.rmSync(dir, { recursive: true, force: true });
});

function week1(): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, 1), 'utf8')));
}

type Kind = 'student' | 'workbook' | 'a3';

interface InkReport {
    problems: string[];
    sides: number;
    frames: number;
    homeSides: number;
}

/**
 * Inspects the reader sides of a document in the browser (run inside the page, so it uses no outer name).
 * @param kind `student`: the reader and home sides of the student book; `workbook` and `a3`: the readers build.
 * @returns The problems and the counts of what it inspected.
 */
function inspectReaderInk(kind: Kind): InkReport {
    const problems: string[] = [];
    const pxPerMm = 96 / 25.4;
    const EDGES = ['top', 'right', 'bottom', 'left'];
    const inkEdges = (element: Element): Array<{ edge: string; style: string; width: number }> => {
        const cs = getComputedStyle(element);
        return EDGES.map((edge) => ({ edge, style: cs.getPropertyValue(`border-${edge}-style`), width: parseFloat(cs.getPropertyValue(`border-${edge}-width`)) || 0 }))
            .filter((entry) => entry.width > 0 && entry.style !== 'none' && entry.style !== 'hidden');
    };
    const named = (element: Element): string => `<${element.tagName.toLowerCase()} class="${element.getAttribute('class') ?? ''}" data-part="${element.getAttribute('data-part') ?? ''}">`;
    const selector = kind === 'student' ? '.student-page[data-page-kind="reader"]' : kind === 'workbook' ? '[data-leaf-side]' : '[data-a3-page]';
    const sides = Array.from(document.querySelectorAll<HTMLElement>(selector));
    let frames = 0;
    sides.forEach((side, index) => {
        const tag = `side ${index + 1}`;
        const origin = side.getBoundingClientRect();
        const box = (element: Element): { left: number; top: number; right: number; bottom: number } => {
            const r = element.getBoundingClientRect();
            return { left: (r.left - origin.left) / pxPerMm, top: (r.top - origin.top) / pxPerMm, right: (r.right - origin.left) / pxPerMm, bottom: (r.bottom - origin.top) / pxPerMm };
        };
        const everything = [side, ...Array.from(side.querySelectorAll('*'))];
        // 1. The fold line is the only dashed or dotted line of a reader side.
        for (const element of everything) {
            const lines = inkEdges(element).filter((entry) => entry.style === 'dashed' || entry.style === 'dotted');
            const outline = getComputedStyle(element);
            if (parseFloat(outline.outlineWidth) > 0 && (outline.outlineStyle === 'dashed' || outline.outlineStyle === 'dotted')) lines.push({ edge: 'outline', style: outline.outlineStyle, width: parseFloat(outline.outlineWidth) });
            if (lines.length && element.getAttribute('data-part') !== 'fold-line') problems.push(`[dashed] ${tag}: ${named(element)} has a ${lines[0].style} ${lines[0].edge} line`);
        }
        // 2. Every picture frame is a solid line.
        for (const picture of Array.from(side.querySelectorAll('.reader-picture'))) {
            frames += 1;
            const lines = inkEdges(picture);
            if (lines.length !== 4 || lines.some((entry) => entry.style !== 'solid')) problems.push(`[frame] ${tag}: a picture frame is not a solid line on all 4 edges (${lines.map((entry) => `${entry.edge} ${entry.style}`).join(', ') || 'none'})`);
        }
        if (kind === 'a3') return;
        const fold = side.querySelectorAll('[data-part="fold-line"]');
        if (fold.length !== 1) problems.push(`[fold-line] ${tag}: ${fold.length} fold lines, want 1`);
        else if (!inkEdges(fold[0]).some((entry) => entry.edge === 'top' && entry.style === 'dashed')) problems.push(`[fold-line] ${tag}: the fold line is not dashed`);
        const foldBox = fold.length ? box(fold[0]) : { top: 148.5, bottom: 148.5, left: 0, right: 0 };
        const foldY = foldBox.top;
        const sideBox = box(side);
        const front = index % 2 === 0;
        // 3. The tear-out place: the perforation element stays at 12 mm, but only 2 short solid ticks print.
        const perforations = side.querySelectorAll('[data-part="perforation"]');
        if (perforations.length !== 1) { problems.push(`[perforation] ${tag}: ${perforations.length} perforation elements, want 1`); return; }
        const perforation = perforations[0];
        const perfBox = box(perforation);
        const perfX = perfBox.left;
        if (Math.abs((front ? perfX : sideBox.right - perfX) - 12) > 0.3) problems.push(`[perforation] ${tag}: the perforation is ${(front ? perfX : sideBox.right - perfX).toFixed(2)} mm from the bound edge, want 12`);
        if (inkEdges(perforation).length) problems.push(`[perforation] ${tag}: the perforation element prints a line itself`);
        const ticks = Array.from(side.querySelectorAll('[data-part="tear-tick"]'));
        if (ticks.length !== 2) problems.push(`[ticks] ${tag}: ${ticks.length} tear-out ticks, want 2`);
        const tickBoxes = ticks.map(box);
        if (ticks.length === 2) {
            const sorted = [...tickBoxes].sort((a, b) => a.top - b.top);
            if (sorted[0].top > 0.3) problems.push(`[ticks] ${tag}: the first tick starts ${sorted[0].top.toFixed(2)} mm from the top edge, want 0`);
            if (sorted[1].bottom < sideBox.bottom - 0.3) problems.push(`[ticks] ${tag}: the second tick ends ${(sideBox.bottom - sorted[1].bottom).toFixed(2)} mm above the bottom edge, want 0`);
            for (const tick of sorted) {
                if (Math.abs(tick.bottom - tick.top - 5) > 0.3) problems.push(`[ticks] ${tag}: a tick is ${(tick.bottom - tick.top).toFixed(2)} mm long, want 5`);
                if (Math.abs((tick.left + tick.right) / 2 - perfX) > 0.8) problems.push(`[ticks] ${tag}: a tick is not on the perforation line`);
            }
        }
        for (const tick of ticks) {
            const lines = inkEdges(tick);
            if (!lines.length || lines.some((entry) => entry.style !== 'solid')) problems.push(`[ticks] ${tag}: a tick is not a solid line`);
        }
        // No printed line runs along the side: no border of any element is a long thin vertical line.
        for (const element of everything) {
            if (element.closest('[data-reader-page]') || element === side) continue;
            const r = box(element);
            if (inkEdges(element).length && r.bottom - r.top >= 100 && r.right - r.left <= 3) problems.push(`[full-height-line] ${tag}: ${named(element)} prints a line of ${(r.bottom - r.top).toFixed(0)} mm along the side`);
        }
        // 4. The scissors mark and its label lie inside the 12 mm strip, clear of the reader pages.
        const label = side.querySelectorAll('[data-part="tear-label"]');
        if (label.length !== 1) problems.push(`[tear-label] ${tag}: ${label.length} tear-out labels, want 1`);
        else {
            const lb = box(label[0]);
            const stripLeft = front ? 0 : perfX;
            const stripRight = front ? perfX : sideBox.right;
            if (lb.left < stripLeft - 0.05 || lb.right > stripRight + 0.05) problems.push(`[tear-label] ${tag}: the label (${lb.left.toFixed(1)} to ${lb.right.toFixed(1)} mm) is not inside the strip (${stripLeft.toFixed(1)} to ${stripRight.toFixed(1)} mm)`);
            const scissors = label[0].querySelector('svg[data-part="scissors"]');
            if (!scissors) problems.push(`[tear-label] ${tag}: no scissors mark`);
            else {
                const sb = box(scissors);
                if (sb.left < stripLeft - 0.05 || sb.right > stripRight + 0.05 || sb.right - sb.left < 2) problems.push(`[tear-label] ${tag}: the scissors mark is not inside the strip or is smaller than 2 mm`);
            }
            const text = (label[0].textContent ?? '').replace(/\s+/g, ' ').trim();
            if (text !== 'ตัดออกจากเล่ม / cut out of the book') problems.push(`[tear-label] ${tag}: the text is "${text}"`);
            const thai = label[0].querySelector('[lang="th"]');
            if (!thai || !getComputedStyle(thai).fontFamily.includes('Sarabun')) problems.push(`[tear-label] ${tag}: the Thai text does not use Sarabun`);
            for (const page of Array.from(side.querySelectorAll('[data-reader-page]'))) {
                const pb = box(page);
                if (lb.left < pb.right - 0.01 && pb.left < lb.right - 0.01 && lb.top < pb.bottom - 0.01 && pb.top < lb.bottom - 0.01) problems.push(`[tear-label] ${tag}: the label reaches a reader page`);
            }
        }
        // 5. The fold line says "fold" at both ends, inside the leaf, clear of the pictures and the text.
        const labels = Array.from(side.querySelectorAll('[data-part="fold-label"]'));
        if (labels.length !== 2) problems.push(`[fold-label] ${tag}: ${labels.length} fold labels, want 2`);
        const leafLeft = front ? perfX : 0;
        const leafRight = front ? sideBox.right : perfX;
        const content = Array.from(side.querySelectorAll('[data-reader-page] *'))
            .filter((element) => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0)
            .map(box);
        const centers: number[] = [];
        for (const found of labels) {
            const fb = box(found);
            centers.push((fb.left + fb.right) / 2);
            const text = (found.textContent ?? '').replace(/\s+/g, ' ').trim();
            if (text !== 'พับ / fold') problems.push(`[fold-label] ${tag}: the text is "${text}"`);
            if (fb.left < leafLeft - 0.05 || fb.right > leafRight + 0.05) problems.push(`[fold-label] ${tag}: a label is outside the leaf`);
            if (fb.top < foldY - 3 || fb.bottom > foldY + 3) problems.push(`[fold-label] ${tag}: a label is more than 3 mm from the fold line`);
            for (const other of content) if (fb.left < other.right - 0.01 && other.left < fb.right - 0.01 && fb.top < other.bottom - 0.01 && other.top < fb.bottom - 0.01) problems.push(`[fold-label] ${tag}: a label overlaps the page content`);
        }
        if (centers.length === 2 && !(Math.min(...centers) < (leafLeft + leafRight) / 2 && Math.max(...centers) > (leafLeft + leafRight) / 2)) problems.push(`[fold-label] ${tag}: the 2 labels are not at the two ends of the fold line`);
    });
    // 6. The home cards keep their dashed cut line.
    const homeSides = Array.from(document.querySelectorAll('.student-page[data-page-kind="home-front"], .student-page[data-page-kind="home-back"]'));
    if (kind === 'student') {
        for (const [index, home] of homeSides.entries()) {
            const cut = home.querySelector('[data-part="perforation"]');
            if (!cut || !inkEdges(cut).some((entry) => entry.edge === 'left' && entry.style === 'dashed')) problems.push(`[home-card] home side ${index + 1}: the dashed cut line is gone`);
        }
    }
    return { problems, sides: sides.length, frames, homeSides: homeSides.length };
}

async function inspect(html: string, kind: Kind): Promise<InkReport> {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
    try {
        const folder = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-reader-ink-'));
        scratch.push(folder);
        const file = path.join(folder, 'page.html');
        fs.writeFileSync(file, html);
        const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
        await page.goto(pathToFileURL(file).href);
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.fonts.check('16px Andika')), 'the Andika print font loads in the browser').toBe(true);
        return await page.evaluate(inspectReaderInk, kind);
    } finally {
        await browser.close();
    }
}

const studentHtml = (): string => compileStorytimeStudentBook([week1()], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html;
const readersHtml = (output: 'workbook' | 'a3-color'): string => compileStorytimeReaders([week1()], { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output, ...(output === 'a3-color' ? { bookTitle: 'Hello!' } : {}) }).html;
const styleOf = (html: string): string => Array.from(html.matchAll(/<style>([\s\S]*?)<\/style>/g), (match) => match[1]).join('\n');

describe('Storytime print reader leaves: only the fold line is dashed (fix 6)', () => {
    it('R-P6-F6a: the 12 reader sides of the student book have a dashed fold line only, solid frames, tick-only tear-outs with the scissors label, and fold labels; the 2 home sides keep the dashed cut line', async () => {
        const report = await inspect(studentHtml(), 'student');
        expect(report.sides, 'reader sides of week 1').toBe(12);
        expect(report.homeSides, 'home card sides of week 1').toBe(2);
        expect(report.frames, 'picture frames inspected').toBeGreaterThan(10);
        expect(report.problems).toEqual([]);
    }, 120_000);

    it('R-P6-F6b: the 12 reader sides of the readers workbook build keep the same rules', async () => {
        const report = await inspect(readersHtml('workbook'), 'workbook');
        expect(report.sides, 'reader sides of week 1').toBe(12);
        expect(report.frames, 'picture frames inspected').toBeGreaterThan(10);
        expect(report.problems).toEqual([]);
    }, 120_000);

    it('R-P6-F6c: the picture frames are solid 0.3 mm lines in the student book and the workbook, and print 0.3 mm in the A3 reader (CSS 0.15 mm at scale 2.0)', async () => {
        for (const html of [studentHtml(), readersHtml('workbook')]) {
            expect(styleOf(html)).toMatch(/\.reader-picture\s*\{[^}]*border:\s*0\.3mm solid #000/);
            expect(styleOf(html)).not.toMatch(/\.reader-picture\s*\{[^}]*(dashed|dotted)/);
        }
        const a3 = readersHtml('a3-color');
        const css = styleOf(a3);
        const frame = css.match(/\.a3-scale \.reader-picture\s*\{([^}]*)\}/)?.[1] ?? '';
        const scale = Number(css.match(/\.a3-scale\s*\{[^}]*scale\(([\d.]+)\)/)?.[1]);
        const width = Number(frame.match(/border:\s*([\d.]+)mm solid #000/)?.[1]);
        expect(scale, 'the A3 scale').toBe(2);
        expect(width * scale, 'the printed A3 frame width in mm').toBeCloseTo(0.3, 5);
        expect(frame).not.toMatch(/dashed|dotted/);
        const report = await inspect(a3, 'a3');
        expect(report.sides, 'A3 pages of one reader').toBe(12);
        expect(report.problems).toEqual([]);
    }, 120_000);

    it('R-P6-F6d: a dashed picture frame and a full-height perforation line are each caught (mutants on a copy)', async () => {
        const html = studentHtml();
        expect((await inspect(html, 'student')).problems, 'the unchanged copy is right').toEqual([]);
        const dashedFrame = html.replace(/(\.reader-picture\s*\{[^}]*border:\s*0\.3mm )solid/, '$1dashed');
        expect(dashedFrame).not.toBe(html);
        expect((await inspect(dashedFrame, 'student')).problems.some((problem) => problem.includes('[dashed]') || problem.includes('[frame]')), 'a dashed picture frame').toBe(true);
        const fullLine = html.replace('</style>', '.perforation.reader-tear, .reader-tear.perforation { width: 0.4mm !important; border-left: 0.4mm solid #000 !important; }\n</style>');
        expect((await inspect(fullLine, 'student')).problems.some((problem) => problem.includes('[full-height-line]') || problem.includes('[perforation]')), 'a full-height perforation line').toBe(true);
    }, 180_000);
});
