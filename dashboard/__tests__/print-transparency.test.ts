import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { ICON_NAMES, icon } from '../lib/document-wrapper/icons';
import { renderLessonTemplate } from '../lib/template-renderer';
import { generateSelfAssessmentSection } from '../lib/document-wrapper/sections/self-assessment';
import { getThemeColors } from '../lib/document-wrapper/utils';

// Track print_ready_pdf_20261002: PDF/X-1a has no transparency, and Ghostscript renders a whole
// page as one image when the page has any. Chrome makes transparency from emoji (bitmap with a
// soft mask), rgba(), opacity, shadows, and a dashed or dotted border + border-radius + background.
const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), 'utf8');
const SECTIONS = fs.readdirSync(path.join(process.cwd(), 'lib/document-wrapper/sections')).map((f) => ['lib/document-wrapper/sections', f]);
const SOURCES = [['templates', 'primary_template.html'], ['lib/document-wrapper', 'styles.ts'], ['lib', 'workbook-document-wrapper.ts'], ...SECTIONS];
const SYMBOLS = /[←-⯿️\u{1F000}-\u{1FAFF}]/u;

/** CSS without the @media screen blocks (screen preview only). */
function printCss(css: string): string {
    let out = css;
    for (;;) {
        const at = out.search(/@media\s+screen\s*\{/);
        if (at < 0) return out;
        let depth = 0;
        let i = out.indexOf('{', at);
        for (; i < out.length; i++) {
            if (out[i] === '{') depth++;
            else if (out[i] === '}' && --depth === 0) break;
        }
        out = out.slice(0, at) + out.slice(i + 1);
    }
}

describe('print transparency', () => {
    it('draws each icon as lines in the text color, with no opacity', () => {
        for (const name of ICON_NAMES) {
            const svg = icon(name);
            expect(svg).toMatch(/^<svg class="icon icon-[a-z]+"/);
            expect(svg).toContain('fill="none" stroke="currentColor"');
            expect(svg).not.toMatch(/opacity|rgba|filter|mask/);
        }
        expect(icon('star', { filled: true })).toContain('fill="currentColor"');
    });

    it.each(SOURCES.map((p) => [p.join('/'), p] as const))('has no emoji or symbol characters: %s', (_, p) => {
        const lines = read(...p).split('\n');
        const bad = lines.map((l, i) => (SYMBOLS.test(l) ? `${i + 1}: ${l.trim().slice(0, 60)}` : '')).filter(Boolean);
        expect(bad).toEqual([]);
    });

    it('renders icons in a Primary lesson, and in the self-assessment', async () => {
        const html = await renderLessonTemplate({ lesson_title: 'T', vocabulary: [], article_paragraphs: [{ number: 1, text: 'Hi.' }], comprehension_questions: [], short_answer_question: '', writing_prompt: 'Write.' }, { type: 'primary' });
        expect(html).toContain('<svg class="icon icon-timer"');
        expect(html).toMatch(/<svg class="icon icon-star"[^>]*fill="currentColor"/);
        expect(SYMBOLS.test(html)).toBe(false);
        const sa = generateSelfAssessmentSection(getThemeColors('Origins', 'primary'));
        expect(sa).toContain('icon-sprout');
        expect(SYMBOLS.test(sa)).toBe(false);
    });

    it.each([['templates', 'primary_template.html'], ['lib/document-wrapper', 'styles.ts']])('has no rgba, opacity, shadows, or filters in print CSS: %s/%s', (dir, file) => {
        const css = printCss(read(dir, file));
        expect(css.match(/rgba\([^)]*\)/g) ?? []).toEqual([]);
        expect(css.match(/opacity:(?!\s*1\s*;)[^;]+;/g) ?? []).toEqual([]);
        expect(css.match(/(box|text)-shadow:(?!\s*none)[^;]+;/g) ?? []).toEqual([]);
        expect(css.match(/(^|[\s;{])filter:\s*[^;]+;/g) ?? []).toEqual([]);
    });

    // Ghostscript turns a gradient into an image whose size fits its 256 KB default (90 ppi for a
    // tip box, 22 ppi for a full page): solid colors only.
    it.each([['templates', 'primary_template.html'], ['lib/document-wrapper', 'styles.ts'], ['lib/document-wrapper/sections', 'title-page.ts']])('has no gradients: %s/%s', (dir, file) => {
        expect(read(dir, file).match(/(linear|radial|conic)-gradient\([^;]*/g) ?? []).toEqual([]);
        expect(read(dir, file)).not.toContain('theme.gradient');
    });

    it.each([['templates', 'primary_template.html'], ['lib/document-wrapper', 'styles.ts']])('has no dashed or dotted rounded box with a background: %s/%s', (dir, file) => {
        const bad: string[] = [];
        for (const m of read(dir, file).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
            const body = m[2];
            if (!/border[a-z-]*:[^;]*(dashed|dotted)/.test(body) || !/border-radius:\s*(?!0[;\s])/.test(body)) continue;
            const bg = body.match(/background(-color)?:\s*([^;]+)/)?.[2].trim();
            if (bg && !/^(none|transparent)$/.test(bg)) bad.push(`${m[1].trim().split('\n').pop()}: ${bg}`);
        }
        expect(bad).toEqual([]);
    });
});
