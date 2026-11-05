import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema } from '../lib/storytime/schema';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';

/**
 * Audit item C6: "Each trace word sits on its line within 0.5 mm." The test renders the shipped
 * student book in Chrome with Andika loaded. For every text that sits on a printed rule it reads the
 * baseline of each text line from the browser (a zero-size probe on the baseline for HTML text, the
 * start position of the first character for SVG text), and the top edge of the rule. It compares the two.
 * The rule test `storytime-print-practice-rule.test.ts` checks only the count and the width of the rules.
 */

const SCALE = 3;
/** The largest distance between the top edge of a rule and the baseline of its text, in mm (audit item C6). */
const TOLERANCE_MM = 0.5;
/** The least depth in mm that the descender of a "p" must reach below the rule. */
const MIN_DESCENDER_MM = 1;
/** A pixel counts as ink when its red channel is below this value. */
const DARK = 140;
const PX_PER_MM = 96 / 25.4;

const scratch: string[] = [];
afterAll(() => {
    for (const dir of scratch) fs.rmSync(dir, { recursive: true, force: true });
});

/** One text line with a rule, as the browser lays it out. */
interface Measured {
    kind: string;
    text: string;
    /** The distance in mm from the baseline to the top edge of the nearest rule; positive when the rule lies under the baseline. */
    offsetMm: number;
}

function shippedHtml(): string {
    const weeks = Array.from({ length: 8 }, (_value, index) => StorytimeWeekSchema.parse(JSON.parse(
        fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8'),
    )));
    return compileStorytimeStudentBook(weeks, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html;
}

describe('Storytime print text on rules sits on the baseline (audit item C6)', () => {
    it('C6: every printed rule lies on the baseline of its text within 0.5 mm, and the p of "p p p" goes below the rule (Chrome, Andika loaded)', async () => {
        const { chromium } = await import('@playwright/test');
        const browser = await chromium.launch({ channel: 'chrome', timeout: 30_000 });
        try {
            const folder = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-c6-baseline-'));
            scratch.push(folder);
            const file = path.join(folder, 'student.html');
            fs.writeFileSync(file, shippedHtml());
            const context = await browser.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: SCALE });
            const page = await context.newPage();
            await page.goto(pathToFileURL(file).href);
            await page.evaluate(() => document.fonts.ready);
            expect(await page.evaluate(() => document.fonts.check('16px Andika')), 'the Andika print font loads in the browser').toBe(true);

            // Step 1: the ink of the "p p p" practice lines, with the rules hidden. The rule position is read first.
            const pLines = await page.evaluate(() => {
                const found: { text: string; x: number; y: number; width: number; height: number; ruleTops: number[] }[] = [];
                document.querySelectorAll('[data-part="practice-text"] .practice-text-rule').forEach((el) => {
                    const text = (el.textContent ?? '').trim();
                    if (!/^p p p/.test(text)) return;
                    const box = el.getBoundingClientRect();
                    found.push({
                        text,
                        x: box.left + window.scrollX,
                        y: box.top + window.scrollY,
                        width: box.width,
                        height: box.height,
                        ruleTops: Array.from(el.querySelectorAll('.practice-rule-line')).map((rule) => rule.getBoundingClientRect().top + window.scrollY),
                    });
                });
                return found;
            });
            expect(pLines.length, 'the practice lines that start with "p p p" (week 3)').toBeGreaterThanOrEqual(1);
            await page.addStyleTag({ content: '.practice-rule-line { display: none !important; }' });
            const descenderProblems: string[] = [];
            for (const line of pLines) {
                const png = await page.screenshot({ clip: { x: line.x, y: line.y, width: line.width, height: line.height }, fullPage: true });
                const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
                let lowest = -1;
                for (let y = 0; y < info.height; y += 1) {
                    for (let x = 0; x < info.width; x += 1) {
                        if (data[(y * info.width + x) * info.channels] < DARK) { lowest = y; break; }
                    }
                }
                const inkBottom = line.y + (lowest + 1) / SCALE;
                const firstRuleTop = line.ruleTops[0];
                const depthMm = (inkBottom - firstRuleTop) / PX_PER_MM;
                if (!(depthMm >= MIN_DESCENDER_MM)) descenderProblems.push(`"${line.text}": the descender reaches ${depthMm.toFixed(2)} mm below the first rule (least ${MIN_DESCENDER_MM} mm)`);
            }
            await page.addStyleTag({ content: '.practice-rule-line { display: block !important; }' });

            // Step 2: baselines and rule tops. This step changes the DOM (probes), so it runs last.
            const measured: Measured[] = await page.evaluate(() => {
                const out: { kind: string; text: string; offsetMm: number }[] = [];
                const MM = 25.4 / 96;
                const probe = (): HTMLSpanElement => {
                    const span = document.createElement('span');
                    span.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
                    return span;
                };
                // A7 practice texts: HTML text, up to 6 rules
                document.querySelectorAll('[data-part="practice-text"] .practice-text-rule').forEach((el) => {
                    const text = (el.textContent ?? '').trim();
                    const probes: HTMLSpanElement[] = [];
                    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                    const nodes: Text[] = [];
                    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
                    for (const node of nodes) {
                        const frag = document.createDocumentFragment();
                        for (const token of (node.nodeValue ?? '').split(/(\s+)/)) {
                            if (token === '') continue;
                            frag.append(document.createTextNode(token));
                            if (!/^\s+$/.test(token)) { const p = probe(); probes.push(p); frag.append(p); }
                        }
                        node.replaceWith(frag);
                    }
                    const baselines = Array.from(new Set(probes.map((p) => Math.round(p.getBoundingClientRect().bottom * 100) / 100))).sort((a, b) => a - b);
                    const rules = Array.from(el.querySelectorAll('.practice-rule-line')).map((r) => r.getBoundingClientRect().top);
                    for (const baseline of baselines) {
                        const nearest = rules.reduce((best, top) => (Math.abs(top - baseline) < Math.abs(best - baseline) ? top : best), Infinity);
                        out.push({ kind: 'practice line (A7)', text, offsetMm: (nearest - baseline) * MM });
                    }
                });
                // Trace rows (A3 trace words, C3 dictation, D4 writing trace and choice words): SVG text over a bottom border
                document.querySelectorAll('.writing-trace').forEach((el) => {
                    const svg = el.querySelector('svg');
                    const texts = Array.from(el.querySelectorAll('text'));
                    if (!svg || texts.length === 0) return;
                    const border = parseFloat(getComputedStyle(el).borderBottomWidth);
                    const ruleTop = el.getBoundingClientRect().bottom - border;
                    const ctm = svg.getScreenCTM();
                    const kind = `trace row (${el.getAttribute('data-part')})`;
                    for (const text of texts) {
                        const start = (text as unknown as SVGTextContentElement).getStartPositionOfChar(0);
                        const point = new DOMPoint(start.x, start.y).matrixTransform(ctm!);
                        out.push({ kind, text: (text.textContent ?? '').trim(), offsetMm: (ruleTop - point.y) * MM });
                    }
                });
                return out;
            });

            const kinds = new Map<string, Measured[]>();
            for (const item of measured) kinds.set(item.kind, [...(kinds.get(item.kind) ?? []), item]);
            const summary = Array.from(kinds.entries()).map(([kind, items]) => {
                const offsets = items.map((i) => i.offsetMm);
                return `${kind}: ${items.length} line(s), offset ${Math.min(...offsets).toFixed(2)} to ${Math.max(...offsets).toFixed(2)} mm (rule top minus baseline)`;
            });
            console.log(`C6 offsets\n${summary.join('\n')}`);
            expect(kinds.get('practice line (A7)')?.length ?? 0, 'practice lines in the 8-week book').toBeGreaterThanOrEqual(12);
            expect(Array.from(kinds.keys()).filter((kind) => kind.startsWith('trace row')).length, 'kinds of trace rows').toBeGreaterThanOrEqual(2);
            const problems = measured.filter((item) => Math.abs(item.offsetMm) > TOLERANCE_MM)
                .map((item) => `${item.kind} "${item.text}": the rule top lies ${item.offsetMm.toFixed(2)} mm from the baseline`);
            expect([...problems, ...descenderProblems]).toEqual([]);
        } finally {
            await browser.close();
        }
    }, 240_000);
});
