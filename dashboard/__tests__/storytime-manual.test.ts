// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { StorytimeWeekSchema, type StorytimeWeek, type StorytimeWeekInput } from '../lib/storytime/schema';
import { compileStorytimeManual, renderStorytimeWeek } from '../lib/storytime/manual';
import { getTranslations } from '../lib/teacher-manual/i18n';
import { fixtureWeek } from './fixtures/storytime-week-fixture';

const CJK = /[぀-ヿ㐀-鿿豈-﫿]/;

function week(change?: (w: StorytimeWeekInput) => void): StorytimeWeek {
    const w = fixtureWeek();
    change?.(w);
    return StorytimeWeekSchema.parse(w);
}

/** The HTML of one day section: from its heading to the next day section. */
function daySection(html: string, day: number): string {
    const parts = html.split('<section class="st-day"');
    return parts[day] ?? '';
}

describe('Storytime manual template', () => {
    it('gives a week header and five day sections, each with its script, period, and steps', () => {
        const html = renderStorytimeWeek(week(), 'en');
        expect(html.split('<section class="st-day"').length - 1).toBe(5);
        expect(html).toContain('Week 1: Hello, I am Nat');
        expect(daySection(html, 1)).toContain('Day 1');
        expect(daySection(html, 1)).toContain('Script A: Sound Lesson');
        expect(daySection(html, 1)).toContain('30 min');
        expect(daySection(html, 1)).toMatch(/A1 · Hear it[\s\S]*5 min/);
        expect(daySection(html, 5)).toContain('Script E: Play and Check');
    });

    it('shows the four headings and the Easier, Harder, and Group lines for every step', () => {
        const html = renderStorytimeWeek(week(), 'en');
        const h = getTranslations('en').teachingNotes;
        const steps = week().scripts.reduce((n, s) => n + s.steps.length, 0);
        for (const label of [h.teacherActions, h.teacherLanguage, h.studentActions, h.watchFor]) {
            expect(html.split(`>${label}<`).length - 1).toBe(steps);
        }
        expect(html.split('>Easier:<').length - 1).toBe(steps);
        expect(html).toContain('Harder A1.');
        expect(html).toContain('Pairs A1.');
    });

    it('puts the opening routine and the strip of the day at the start of each day', () => {
        const html = renderStorytimeWeek(week(), 'en');
        expect(daySection(html, 1)).toContain('Opening routine (6 min)');
        expect(daySection(html, 1)).toContain('No review cards today.');
        expect(daySection(html, 2)).toMatch(/Sounds[\s\S]*>n</);
    });

    it('moves the moved steps to the next day, and the day 5 ones to the next opening', () => {
        const html = renderStorytimeWeek(week(), 'en');
        const day1 = daySection(html, 1);
        const day2 = daySection(html, 2);
        expect(day1).not.toContain('A7 · Read it');
        expect(day2).toMatch(/Recall from the last lesson[\s\S]*A7 · Read it[\s\S]*A8 · Home card[\s\S]*B1 · Family words/);
        expect(daySection(html, 5)).toMatch(/At the next opening[\s\S]*E5 · Check/);
    });

    it('shows the facts of the week in the header', () => {
        const html = renderStorytimeWeek(week(), 'en');
        const header = html.split('<section class="st-day"')[0];
        for (const s of ['/n/', 'Hello, I am ___.', 'goodbye', 'a, and, can', 'Hello!', 'Nan', 'Hello, I Am ___']) expect(header).toContain(s);
    });

    it('prints the Thai notes, with the teacher English kept and the Thai gloss under it', () => {
        const html = renderStorytimeWeek(
            week((w) => {
                const s = w.scripts[0].steps[0];
                s.title.th = 'ฟังเสียง';
                s.th = { teacherActions: ['ครูพูดคำ'], teacherLanguage: ['ฟังเสียงนะ'], studentActions: ['เด็กชูนิ้วโป้ง'], watchFor: ['เด็กที่ไม่ร่วม'] };
                s.easier.th = 'ใช้สามคำ';
            }),
            'th',
        );
        const h = getTranslations('th').teachingNotes;
        expect(html).toContain(`>${h.teacherActions}<`);
        expect(html).toContain('A1 · ฟังเสียง');
        expect(html).toMatch(/&quot;Hear it\. Your turn\.&quot;[\s\S]{0,80}ฟังเสียงนะ/);
        expect(html).toContain('ครูพูดคำ');
        expect(html).toContain('ใช้สามคำ');
        // A step without Thai prints its English, so a draft book is complete.
        expect(html).toContain('Run A2.');
        expect(html).toContain('วันที่ 1');
    });

    it('compiles a level into one A4 document with the product name and no CJK or CEFR', () => {
        const { html, weekCount } = compileStorytimeManual([week()], { lang: 'th', paper: 'a4' });
        expect(weekCount).toBe(1);
        expect(html).toContain('<html lang="th">');
        expect(html).toContain('Storytime Advantage');
        expect(html).toContain('ระดับ 2 (อนุบาล 3)');
        expect(html).toContain('size: A4');
        // The Storytime CSS is in the head, where Paged.js reads the page breaks.
        expect(html.indexOf('.st-week, .st-day { break-before: page; }')).toBeLessThan(html.indexOf('</head>'));
        expect(html).not.toMatch(CJK);
        expect(html).not.toMatch(/CEFR/);
    });

    it('sorts the weeks and refuses weeks of two levels', () => {
        const w2 = week((w) => {
            w.meta.week = 2;
            w.meta.key = 'st2/2';
            w.meta.title = 'Second';
        });
        const { html } = compileStorytimeManual([w2, week()], { lang: 'en' });
        expect(html.indexOf('Week 1:')).toBeLessThan(html.indexOf('Week 2:'));
        expect(() => compileStorytimeManual([week(), week((w) => (w.meta.level = 3))], { lang: 'en' })).toThrow(/one level/);
    });

    it('escapes the package text', () => {
        const html = renderStorytimeWeek(week((w) => (w.meta.title = 'Cats <b> & dogs')), 'en');
        expect(html).toContain('Cats &lt;b&gt; &amp; dogs');
    });
});
