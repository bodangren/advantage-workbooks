import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { CHIBI_QUEST_THEME, CHIBI_QUEST_TOKENS, getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { bookTheme, getThemeColors } from '../lib/document-wrapper/utils';
import { generateTitlePage } from '../lib/document-wrapper/sections/title-page';
import { renderMultipleLessons } from '../lib/template-renderer';
import { buildWorkbookLesson } from '../lib/lesson-package/build';
import { LessonPackageSchema } from '../lib/lesson-package/schema';

// Track primary_v2_look_20261020, story S3: the Chibi Quest print kit. Flat token fills only, so the
// PDF/X-1a file has no transparency and no image-rendered page.
describe('chibi-quest print kit', () => {
    const css = getChibiQuestStyles();

    it('has no gradient, transparency, shadow, dashed line, or emoji', () => {
        expect(css).not.toMatch(/gradient|rgba\(|hsla\(|opacity|box-shadow|text-shadow|dashed|dotted|transparent\b(?!\s*!important)/);
        expect(css).not.toMatch(/\p{Extended_Pictographic}/u);
    });

    it('uses only token colors and white', () => {
        const allowed = new Set([...Object.values(CHIBI_QUEST_TOKENS).map((c) => c.toLowerCase()), '#ffffff']);
        const used = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
        expect(used.length).toBeGreaterThan(20);
        for (const c of used) expect(allowed.has(c.toLowerCase()), c).toBe(true);
    });

    it('styles every part of the kit', () => {
        const parts = [
            'div.section-header .section-icon', // the gold step medal
            'div.section-header .section-title', // the wood step sign
            'div.section-header .section-title::before', // a rivet
            'div.section-header .section-time', // the time chip
            '.lesson-header',
            '.para-number',
            '.vocab-table td',
            '.tip-box',
            '.short-answer-box',
            '.writing-section',
            '.score-box',
            '.score-circle',
            '.perf-option:nth-child(1)', // right
            '.perf-option:nth-child(3)', // wrong
            '.reflection-box',
            '.homework-box',
            '.translation-section',
            'h2.section-header', // back matter: glossary, answer key, contents
            '.ak-lesson-title',
        ];
        for (const p of parts) expect(css, p).toContain(`.look-chibi-quest ${p}`);
        // The app fonts: Fredoka and Mitr for signs and labels, Quicksand and Sarabun for text.
        expect(css).toContain(`font-family: 'Quicksand', 'Sarabun', sans-serif !important`);
        expect(css).toContain(`font-family: 'Fredoka', 'Mitr', sans-serif !important`);
    });

    it('gives right and wrong the app colors, always with their word', async () => {
        expect(css).toMatch(/\.perf-option:nth-child\(1\) \{[^}]*var\(--cq-right-fill\)/);
        expect(css).toMatch(/\.perf-option:nth-child\(3\) \{[^}]*var\(--cq-wrong-fill\)/);
        const tpl = fs.readFileSync(path.join(process.cwd(), 'templates', 'primary_template.html'), 'utf8');
        expect(tpl).toContain('</span> Excellent (5/5)</div>');
        expect(tpl).toContain('</span> Review needed (3 or less)</div>');
    });

    it('gives the back matter flat wood and gold colors, and keeps the classic series colors', () => {
        const tokens = new Set(Object.values(CHIBI_QUEST_TOKENS).map((c) => c.toLowerCase()));
        for (const c of Object.values(CHIBI_QUEST_THEME)) expect(tokens.has(c.toLowerCase()), c).toBe(true);
        const options = { seriesName: 'Quest', seriesLevel: '5', seriesTagline: 'x', type: 'primary' as const };
        expect(bookTheme(options)).toEqual(getThemeColors('Quest', 'primary'));
        expect(bookTheme({ ...options, look: 'chibi-quest' })).toEqual(CHIBI_QUEST_THEME);
        expect(generateTitlePage({ ...options, look: 'chibi-quest' })).toContain('class="cover-page" style="background: #5c391a;"');
        // The template prints every section header on white with !important: the wood sign needs it too.
        expect(css).toMatch(/h2\.section-header \{[^}]*background: var\(--cq-wood\) !important/);
    });

    it('renders 13 step headers, each with a medal, a sign, and a time chip', async () => {
        const file = path.join(process.cwd(), '..', 'content', 'primary', 'quest-5', 'l01.json');
        const pkg = LessonPackageSchema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
        const html = await renderMultipleLessons([buildWorkbookLesson(pkg, {})], { type: 'primary', look: 'chibi-quest' });
        const headers = html.match(/<div class="section-header">[\s\S]*?<\/div>\s*<h2 class="section-title">[\s\S]*?<span class="section-time">/g) ?? [];
        expect(headers).toHaveLength(13);
    });
});
