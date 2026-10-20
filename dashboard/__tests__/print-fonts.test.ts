import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { CHIBI_QUEST_FONT_FACES, PRINT_FONT_FACES, THAI, chibiQuestFontFaceCss, printFontFaceCss } from '../lib/document-wrapper/print-fonts';
import { getChibiQuestStyles } from '../lib/document-wrapper/chibi-quest-styles';
import { wrapWorkbookDocument } from '../lib/workbook-document-wrapper';
import { renderLessonTemplate } from '../lib/template-renderer';

// Track print_ready_pdf_20261002: Chrome writes variable web fonts as Type 3 fonts, which the
// printer cannot use. The print document embeds static faces only, with no request to Google Fonts.
describe('print fonts', () => {
    it('has one static woff2 file for each face', () => {
        expect(PRINT_FONT_FACES.length).toBe(17);
        for (const f of PRINT_FONT_FACES) expect(fs.existsSync(path.join(process.cwd(), 'assets', 'print-fonts', f.file)), f.file).toBe(true);
    });

    it('covers every weight and style that the print CSS uses, also in Thai', () => {
        const has = (family: string, weight: number, style: string) => PRINT_FONT_FACES.some((f) => f.family === family && f.weight === weight && f.style === style);
        for (const [w, s] of [[300, 'normal'], [400, 'normal'], [400, 'italic'], [600, 'normal'], [700, 'normal'], [700, 'italic']] as const) expect(has('Merriweather', w, s), `Merriweather ${w} ${s}`).toBe(true);
        for (const [w, s] of [[400, 'normal'], [400, 'italic'], [600, 'normal'], [700, 'normal'], [700, 'italic'], [800, 'normal']] as const) expect(has('Open Sans', w, s), `Open Sans ${w} ${s}`).toBe(true);
        for (const [w, s] of [[400, 'normal'], [400, 'italic'], [600, 'normal'], [700, 'normal'], [700, 'italic']] as const) expect(has('Sarabun', w, s), `Sarabun ${w} ${s}`).toBe(true);
    });

    it('writes @font-face rules with data URLs; Sarabun only for Thai', () => {
        const css = printFontFaceCss();
        expect(css.match(/@font-face/g)).toHaveLength(PRINT_FONT_FACES.length);
        expect(css.match(/src: url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\) format\('woff2'\)/g)).toHaveLength(PRINT_FONT_FACES.length);
        expect(css).toMatch(/font-family: 'Sarabun'; font-weight: 400; font-style: normal; src: url\(data:font\/woff2;base64,[^)]+\) format\('woff2'\); unicode-range: U\+0E01-0E5B/);
    });

    it('puts the faces in the document head, and no Google Fonts request in the Primary document', async () => {
        const lesson = await renderLessonTemplate({ lesson_title: 'T', vocabulary: [], article_paragraphs: [], comprehension_questions: [], short_answer_question: '', writing_prompt: '' }, { type: 'primary' });
        const html = wrapWorkbookDocument(lesson, [], { seriesName: 'Origins', seriesLevel: 'A0', seriesTagline: '', type: 'primary', lessonsOnly: true });
        expect(html.indexOf('@font-face')).toBeLessThan(html.indexOf('</head>'));
        expect(html).not.toContain('fonts.googleapis.com');
    });

    it('names only the print families, with Sarabun for Thai, in every Primary font stack', () => {
        const css = fs.readFileSync(path.join(process.cwd(), 'templates', 'primary_template.html'), 'utf8') + fs.readFileSync(path.join(process.cwd(), 'lib', 'document-wrapper', 'styles.ts'), 'utf8');
        const stacks = [...css.matchAll(/font-family:\s*([^;]+);/g)].map((m) => m[1].trim());
        expect(stacks.length).toBeGreaterThan(10);
        for (const s of stacks) expect(s, s).toMatch(/^'(Merriweather|Open Sans)', 'Sarabun', (serif|sans-serif)$/);
    });
});

// Track primary_v2_look_20261020, story S2: the Chibi Quest look prints with the app fonts (Fredoka
// and Mitr for signs, titles, and labels; Quicksand for text), as static faces, for that look only.
describe('chibi-quest print fonts', () => {
    const dir = path.join(process.cwd(), 'assets', 'print-fonts');
    const doc = (look?: 'classic' | 'chibi-quest') =>
        wrapWorkbookDocument('<p>x</p>', [], { seriesName: 'Quest 5', seriesLevel: 'A1', seriesTagline: '', type: 'primary', lessonsOnly: true, look });

    it('has a static woff2 file and an OFL file for each new face', () => {
        const list = CHIBI_QUEST_FONT_FACES.map((f) => `${f.family} ${f.weight} ${f.style}`);
        expect(list).toEqual([
            'Fredoka 500 normal', 'Fredoka 600 normal', 'Fredoka 700 normal',
            'Mitr 400 normal', 'Mitr 500 normal', 'Mitr 700 normal',
            'Quicksand 400 normal', 'Quicksand 500 normal', 'Quicksand 700 normal',
        ]);
        for (const f of CHIBI_QUEST_FONT_FACES) {
            expect(fs.existsSync(path.join(dir, f.file)), f.file).toBe(true);
            expect(f.file).not.toMatch(/wght|variable/);
        }
        for (const slug of ['fredoka', 'mitr', 'quicksand']) {
            expect(fs.readFileSync(path.join(dir, `OFL-${slug}.txt`), 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
        }
    });

    it('gives Mitr the Thai glyphs only, and Fredoka and Quicksand the Latin glyphs', () => {
        for (const f of CHIBI_QUEST_FONT_FACES) {
            if (f.family === 'Mitr') expect(f.unicodeRange).toBe(THAI);
            else expect(f.unicodeRange).toBeUndefined();
        }
        const css = chibiQuestFontFaceCss();
        expect(css.match(/@font-face/g)).toHaveLength(CHIBI_QUEST_FONT_FACES.length);
        expect(css).toMatch(/font-family: 'Mitr'; font-weight: 700; font-style: normal; src: url\(data:font\/woff2;base64,[^)]+\) format\('woff2'\); unicode-range: U\+0E01-0E5B/);
    });

    it('adds the faces to the chibi-quest document only', () => {
        const chibi = doc('chibi-quest');
        for (const family of ['Fredoka', 'Mitr', 'Quicksand']) {
            expect(chibi).toContain(`font-family: '${family}';`);
            expect(doc()).not.toContain(`font-family: '${family}';`);
            expect(doc('classic')).not.toContain(`font-family: '${family}';`);
        }
        // The classic faces stay in both documents.
        expect(chibi).toContain(printFontFaceCss());
        expect(chibi.indexOf("font-family: 'Fredoka';")).toBeLessThan(chibi.indexOf('</head>'));
    });

    it('turns off synthetic bold and italic in the look, so a missing face never becomes a Type 3 font', () => {
        expect(getChibiQuestStyles()).toMatch(/\.look-chibi-quest \{[^}]*font-synthesis: none;/);
    });
});
