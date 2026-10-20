import { describe, it, expect } from 'vitest';
import { compileTeacherManual } from '@/lib/teacher-manual/compiler';
import { renderStepInsert } from '@/lib/teacher-manual/step-insert';
import { en } from '@/lib/teacher-manual/i18n/en';
import { th } from '@/lib/teacher-manual/i18n/th';
import type { SupportedLanguage } from '@/lib/teacher-manual/i18n';
import type { WorkbookLesson } from '@/lib/workbook-schema';

// Track teacher_manual_app_20261020. The Origins 3.1 Teacher's Manual is printed in Thai, on A4,
// on a school office printer in black and white (Phase 1), and it describes the new Primary
// Advantage app (Phase 2; facts: advantage-pr boonyathat_start_kit_20261020/facts.md).

/** A lesson with every field that a step insert shows. */
const LESSON = {
    lesson_number: 'Lesson 1',
    lesson_title: 'My New City Plane Trip',
    genre: 'Transportation',
    article_type: 'fiction',
    vocabulary: [
        { word: 'city', phonetic: '/ˈsɪti/', definition: 'A large town.', thai_definition: 'เมือง' },
        { word: 'plane', phonetic: '/pleɪn/', definition: 'A machine that flies.', thai_definition: 'เครื่องบิน' },
    ],
    article_url: 'https://primary.reading-advantage.com/student/read/fixture',
    article_paragraphs: [1, 2, 3, 4, 5, 6].map((n) => ({ number: n, text: `This is paragraph ${n}. Lily is happy. She sees the sky. The sky is blue.` })),
    article_images: [{ url: 'https://storage.googleapis.com/primary-app-storage/images/fixture_1.png', caption: 'Lily and the plane.', position: 'hero' }],
    comprehension_questions: [
        { number: 1, question: 'Who is the girl?', options: ['Mom', 'Lily', 'Dad', 'The plane'] },
        { number: 2, question: "What color is Lily's bag?", options: ['Blue', 'Green', 'Red', 'White'] },
    ],
    short_answer_question: "What is the girl's name?",
    short_answer_hint: 'Look at paragraph 1.',
    sentence_starters: ['I think...', 'The article says...'],
    vocab_match: [{ number: 1, word: 'city', letter: 'a', definition: 'A large town.' }],
    vocab_fill: [{ number: 1, sentence: 'This place is a new ____.' }],
    vocab_word_bank: ['city', 'plane'],
    sentence_order_questions: [{ words: ['This', 'Lily', 'is'] }],
    sentence_completion_prompts: [{ number: 1, prompt: 'The plane is' }],
    writing_prompt: "Tell me about Lily's family.",
    writing_plan_prompts: ['Who is in the family?'],
    writing_sentence_frames: ['This is ___.'],
    reflection_focus: 'What did you learn about planes?',
} as unknown as WorkbookLesson;

type Paper = 'book' | 'a4';
const LANGS: SupportedLanguage[] = ['en', 'th'];
const PAPERS: Paper[] = ['book', 'a4'];

const cache = new Map<string, string>();
function manual(lang: SupportedLanguage, paper?: Paper): string {
    const key = `${lang}-${paper ?? 'default'}`;
    if (!cache.has(key)) {
        const args: Parameters<typeof compileTeacherManual> = [[LESSON, LESSON], 'Origins 3.1', '3.1', 'A0+', 'primary', lang];
        const html = paper ? (compileTeacherManual as (...a: unknown[]) => { html: string })(...args, paper).html : compileTeacherManual(...args).html;
        cache.set(key, html);
    }
    return cache.get(key)!;
}

/** Every string of a translation object; functions are called with sample arguments. */
function strings(value: unknown, at = ''): { at: string; text: string }[] {
    if (typeof value === 'string') return [{ at, text: value }];
    if (typeof value === 'function') return [{ at, text: String((value as (...a: unknown[]) => unknown)('Origins', '3.1')) }];
    if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${at}[${i}]`));
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => strings(v, at ? `${at}.${k}` : k));
    return [];
}

/** The top-level declarations of each `@page` rule (margin boxes such as `@bottom-center` left out). */
function pageRules(html: string): { selector: string; body: string }[] {
    const rules: { selector: string; body: string }[] = [];
    const re = /@page\b([^{]*)\{/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
        let depth = 1;
        let i = re.lastIndex;
        let body = '';
        for (; i < html.length && depth > 0; i++) {
            const c = html[i];
            if (c === '{') depth++;
            else if (c === '}') depth--;
            else if (depth === 1) body += c;
        }
        rules.push({ selector: m[1].trim(), body });
        re.lastIndex = i;
    }
    return rules;
}

/** A CSS length in millimeters (0 for a bare 0). */
function mm(length: string): number {
    const m = /^(-?[\d.]+)(mm|cm|in|pt|px)?$/.exec(length.trim());
    if (!m) throw new Error(`not a length: ${length}`);
    const n = Number(m[1]);
    const factors: Record<string, number> = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72, px: 25.4 / 96 };
    return n * factors[m[2] ?? 'mm'];
}

/** Pictographs and emoji: Misc Symbols, Dingbats, Misc Symbols and Arrows (2B00+), VS-16, and the emoji planes. */
const EMOJI = /[\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F000}-\u{1FAFF}]/u;

describe('teacher manual: office print (Phase 1)', () => {
    it('has no CJK ideograph in the Thai manual or in the Thai strings', () => {
        for (const paper of [undefined, ...PAPERS]) expect(manual('th', paper)).not.toMatch(/[一-鿿]/);
        const bad = strings(th).filter((s) => /[一-鿿]/.test(s.text));
        expect(bad.map((s) => s.at)).toEqual([]);
    });

    it('prints each step 13 reflection label with one colon', () => {
        for (const lang of ['en', 'th'] as const) {
            const html = renderStepInsert(13, LESSON, lang);
            expect(html, lang).toContain(lang === 'en' ? 'I understood:' : 'ฉันเข้าใจ:');
            expect(html, lang).not.toMatch(/[^:\s]::/);
        }
    });

    it('has no English word glued to a Thai word in the Thai strings', () => {
        const bad = strings(th).filter((s) => /[฀-๿][A-Za-z]{3,}|\b(practice|Individual|word-for-word)\b/.test(s.text.replace(/<[^>]+>/g, ' ')));
        expect(bad.map((s) => `${s.at}: ${s.text}`)).toEqual([]);
    });

    for (const lang of LANGS) {
        for (const paper of [undefined, ...PAPERS]) {
            const label = `${lang}, ${paper ?? 'default'} paper`;

            it(`has no emoji (${label})`, () => {
                const html = manual(lang, paper);
                const hit = EMOJI.exec(html);
                expect(hit ? `${hit[0]} U+${hit[0].codePointAt(0)!.toString(16)} near: ${html.slice(Math.max(0, hit.index - 80), hit.index + 20)}` : null).toBeNull();
            });

            it(`has no gradient, rgba, or shadow (${label})`, () => {
                const html = manual(lang, paper);
                expect(html).not.toMatch(/linear-gradient|radial-gradient/);
                expect(html).not.toContain('rgba(');
                expect(html).not.toMatch(/box-shadow|text-shadow/);
            });

            it(`uses the static print fonts, not Google Fonts (${label})`, () => {
                const html = manual(lang, paper);
                expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
                expect(html).toMatch(/@font-face \{ font-family: 'Open Sans'; font-weight: 400; font-style: normal; src: url\(data:font\/woff2;base64,/);
                if (lang === 'th') expect(html).toMatch(/@font-face \{ font-family: 'Sarabun'; font-weight: 400; font-style: normal; src: url\(data:font\/woff2;base64,/);
            });
        }
    }

    it('gives an A4 page with margins of 15 mm or more in the A4 mode', () => {
        for (const lang of LANGS) {
            const rules = pageRules(manual(lang, 'a4'));
            const main = rules.find((r) => r.selector === '' && /size\s*:/.test(r.body));
            expect(main?.body).toMatch(/size\s*:\s*(A4|210mm\s+297mm)\s*;/);
            const margins = rules.flatMap((r) => [...r.body.matchAll(/margin(?:-(?:top|right|bottom|left))?\s*:\s*([^;]+);/g)].flatMap((m) => m[1].trim().split(/\s+/).map((v) => ({ rule: r.selector || '@page', v }))));
            expect(margins.length).toBeGreaterThan(0);
            for (const { rule, v } of margins) expect(mm(v), `${rule}: margin ${v}`).toBeGreaterThanOrEqual(15);
        }
    });

    it('has no blank sheet after the title page in the A4 mode (print resets the screen padding)', () => {
        expect(manual('th', 'a4')).toMatch(/@media print \{\s*\.pagedjs_pages \{ padding: 0 !important; \}/);
    });

    it('keeps Thai marks with their consonants on the A4 title page (no letter spacing)', () => {
        expect(manual('th', 'a4')).toMatch(/:lang\(th\) \.tm-title-badge \{ letter-spacing: 0; \}/);
    });

    it('fits the A4 title page in the A4 page box', () => {
        const html = manual('th', 'a4');
        const rule = /\.tm-title-page \{([^}]*)\}/g;
        const heights = [...html.matchAll(rule)].map((m) => /height:\s*([\d.]+mm)/.exec(m[1])?.[1]).filter(Boolean) as string[];
        expect(heights.length).toBeGreaterThan(0);
        // A4 297 mm less two 18 mm margins = 261 mm; the last rule wins.
        expect(mm(heights[heights.length - 1])).toBeLessThanOrEqual(261);
    });

    it('keeps the default mode: the 210 x 285 mm book page, 18 mm margins, a full-bleed title page', () => {
        for (const lang of LANGS) {
            for (const html of [manual(lang), manual(lang, 'book')]) {
                const rules = pageRules(html);
                const main = rules.find((r) => r.selector === '' && /size\s*:/.test(r.body));
                expect(main?.body).toMatch(/size:\s*210mm 285mm;/);
                expect(main?.body).toMatch(/margin:\s*18mm;/);
                expect(rules.find((r) => r.selector === ':first')?.body).toMatch(/margin:\s*0;/);
                expect(html).toMatch(/\.tm-title-page \{[^}]*height: 285mm;/);
                expect(html).toMatch(/paged\.polyfill\.js/);
            }
        }
        expect(manual('en')).toBe(manual('en', 'book'));
    });

    it('draws the period icons as inline SVG in the text color', () => {
        for (const lang of LANGS) {
            const html = manual(lang, 'a4');
            for (const cls of ['tm-br-title', 'tm-spelling-title', 'tm-online-title']) {
                expect(html).toMatch(new RegExp(`class="${cls}"[^>]*>\\s*<svg class="icon icon-[a-z]+"[^>]*stroke="currentColor"`));
            }
        }
    });
});

/**
 * App labels that facts.md (advantage-pr boonyathat_start_kit_20261020, v0.3) confirms, word for word
 * from monorepo apps/primary-advantage/messages/{en,th}.json at master beb904102.
 */
const APP = {
    en: {
        markDone: 'Mark step done', // TeacherUi.classBook.guide.markDone (facts 9)
        projector: 'Projector', // TeacherUi.classBook.lesson.projector (facts 9)
        markTaught: 'Mark taught', // TeacherUi.classBook.markTaught (facts 9)
        classProgress: 'Class progress', // TeacherUi.classBook.progress.open (facts 9)
        assignments: 'Assignments', // Components.assignments (facts 10)
    },
    th: {
        markDone: 'ทำเครื่องหมายว่าทำขั้นนี้แล้ว',
        projector: 'โปรเจกเตอร์',
        markTaught: 'ทำเครื่องหมายว่าสอนแล้ว',
        classProgress: 'ความก้าวหน้าของชั้นเรียน',
        assignments: 'งานที่กำหนด',
    },
} as const;

/** Features that facts.md does not confirm (or that the old app had). */
const UNCONFIRMED = /\bAI\b|chat ?bot|แชทบอท|progress tracker|ตัวติดตามผล|reading journey|badge|ป้ายความก้าวหน้า/i;

describe('teacher manual: the new Primary Advantage app (Phase 2)', () => {
    const LOCALES = { en, th };

    it('never names the app "Reading Advantage"', () => {
        for (const lang of LANGS) {
            const bad = strings(LOCALES[lang]).filter((s) => /Reading Advantage/i.test(s.text));
            expect(bad.map((s) => `${lang} ${s.at}`)).toEqual([]);
            expect(manual(lang, 'a4')).not.toMatch(/Reading Advantage/i);
        }
    });

    it('promises no chatbot, no AI feature, and no progress tracker', () => {
        for (const lang of LANGS) {
            const bad = strings(LOCALES[lang]).filter((s) => UNCONFIRMED.test(s.text));
            expect(bad.map((s) => `${lang} ${s.at}: ${s.text}`)).toEqual([]);
        }
    });

    it('names a confirmed app action in the "In the App" box of every period', () => {
        for (const lang of LANGS) {
            const boxes = [...manual(lang, 'a4').matchAll(/<div class="tm-online">([\s\S]*?)<\/ul>/g)].map((m) => m[1]);
            expect(boxes).toHaveLength(2 * 4);
            boxes.forEach((box, i) => {
                const period = (i % 4) + 1;
                expect(box, `${lang} period ${period}`).toContain(APP[lang].markDone);
                expect(box, `${lang} period ${period}`).not.toMatch(UNCONFIRMED);
            });
            // Period 4 closes the lesson: mark it taught, check the progress, give homework.
            for (const box of boxes.filter((_, i) => i % 4 === 3)) {
                for (const label of [APP[lang].markTaught, APP[lang].classProgress, APP[lang].assignments]) expect(box).toContain(label);
            }
            // Period 1 shows the article on the projector (step 3).
            for (const box of boxes.filter((_, i) => i % 4 === 0)) expect(box).toContain(APP[lang].projector);
        }
    });

    it('keeps the bold step label of each lesson-plan line (the monorepo guide importer reads the title from it)', () => {
        const periods: Record<number, number[]> = { 1: [1, 2, 3, 4], 2: [5, 6, 7], 3: [8, 9, 10], 4: [11, 12, 13] };
        for (const [lang, prefix] of [['en', 'Step'], ['th', 'ขั้นตอนที่']] as const) {
            const lps = LOCALES[lang].lessonPlanStructure as unknown as Record<string, string>;
            for (const [p, steps] of Object.entries(periods)) {
                for (const n of steps) expect(lps[`period${p}Step${n}`], `${lang} period${p}Step${n}`).toMatch(new RegExp(`^<strong>${prefix} ${n}: [^<]+</strong> — `));
            }
        }
    });

    it('gives four non-empty note lists for each of the 13 steps in both languages (the in-app lesson guide imports them)', () => {
        for (const lang of LANGS) {
            for (let step = 1; step <= 13; step++) {
                const notes = LOCALES[lang].teachingNotesContent[step as keyof typeof en.teachingNotesContent];
                for (const list of [notes.teacherActions, notes.teacherLanguage, notes.studentActions, notes.watchFor]) {
                    expect(list.length, `${lang} step ${step}`).toBeGreaterThan(0);
                    for (const line of list) expect(line.trim().length).toBeGreaterThan(0);
                }
            }
        }
    });

    it('tells the teacher that step 11 has no app step, in the notes that the app imports', () => {
        expect(en.teachingNotesContent[11].teacherActions.join(' ')).toMatch(/no app step/);
        expect(th.teachingNotesContent[11].teacherActions.join(' ')).toContain('ไม่มีขั้นในแอป');
    });
});
