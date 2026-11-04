// @vitest-environment jsdom
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema } from '../lib/storytime/schema';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';

function shippedWeeks() {
    return Array.from({ length: 8 }, (_value, index) => StorytimeWeekSchema.parse(JSON.parse(
        fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8'),
    )));
}

function documentOf(weeks: ReturnType<typeof shippedWeeks>): Document {
    const { html } = compileStorytimeStudentBook(weeks, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' });
    return new DOMParser().parseFromString(html, 'text/html');
}

describe('Storytime print binding pad and practice rules', () => {
    it('uses a four-page perfect-binding multiple', () => {
        expect(STORYTIME_PRINT_PROFILE).toHaveProperty('bindingPageMultiple', 4);
    });

    it('pads the 8-week book after Benchmark 1 to 136 pages', () => {
        const pages = Array.from(documentOf(shippedWeeks()).querySelectorAll('.student-page'));

        expect(pages).toHaveLength(136);
        expect(pages[134]?.getAttribute('data-page-kind')).toBe('benchmark');
        expect(pages[134]?.getAttribute('data-page-number')).toBe('135');
        expect(pages[135]?.getAttribute('data-page-kind')).toBe('blank');
        expect(pages[135]?.getAttribute('data-page-number')).toBe('136');
    });

    it('keeps the week 1 book at 20 pages without an end pad', () => {
        const pages = Array.from(documentOf(shippedWeeks().slice(0, 1)).querySelectorAll('.student-page'));

        expect(pages).toHaveLength(20);
        expect(pages.at(-1)?.getAttribute('data-page-kind')).toBe('reader');
    });

    it('draws a full-width rule for each practice-text line without one bottom border', () => {
        const css = documentOf(shippedWeeks().slice(0, 1)).querySelector('style')?.textContent ?? '';
        const rule = css.match(/\.practice-text\s*\{([^}]+)\}/)?.[1] ?? '';

        expect(rule).not.toMatch(/border-bottom/);
        expect(rule).toMatch(/line-height:\s*12mm/);
        const lineRule = css.match(/\.practice-text-rule\s*\{([^}]+)\}/)?.[1] ?? '';
        // The rule is a block that repeats at the 12 mm line height: it spans the box, not the text (fix 4).
        expect(lineRule).toMatch(/display:\s*block/);
        expect(lineRule).toMatch(/repeating-linear-gradient\([^)]*12mm/);
        expect(lineRule).not.toMatch(/border-bottom/);
        expect(lineRule).not.toMatch(/box-decoration-break/);
    });
});
