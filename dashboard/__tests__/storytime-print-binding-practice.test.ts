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

    it('fills the 8-week book to 140 pages with the benchmark before Review 1 and no pad at the end (A-48 U4)', () => {
        const pages = Array.from(documentOf(shippedWeeks()).querySelectorAll('.student-page'));

        expect(pages).toHaveLength(140);
        expect(pages.slice(128).map((page) => page.getAttribute('data-page-kind'))).toEqual(['blank', 'benchmark', 'benchmark', 'review', 'review', 'review-more', 'review', 'review-more', 'review', 'review-more', 'review', 'review-more']);
        expect(pages[129]?.getAttribute('data-page-number')).toBe('130');
        expect(pages[139]?.getAttribute('data-page-kind')).toBe('review-more');
        expect(pages[139]?.getAttribute('data-page-number')).toBe('140');
    }, 120_000);

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
        // The text is a clipped block, so its rules span the box and not the text (fix 4); the rules are
        // vector borders, because a gradient or tiled background prints as an image in the PDF.
        expect(lineRule).toMatch(/display:\s*block/);
        expect(lineRule).toMatch(/overflow:\s*hidden/);
        expect(lineRule).not.toMatch(/border-bottom|gradient|box-decoration-break/);
        const mark = css.match(/\.practice-rule-line\s*\{([^}]+)\}/)?.[1] ?? '';
        expect(mark).toMatch(/border-top:\s*0\.4mm solid #000/);
        expect(mark).toMatch(/left:\s*0[^}]*right:\s*0|right:\s*0[^}]*left:\s*0/);
        expect(css).not.toMatch(/gradient/);
    });
});
