import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { APP_SCREEN_DIR, APP_SECTION, STEP_MAP, generateAppSection } from '../lib/teacher-manual/app-section';
import { generateFrontMatter } from '../lib/teacher-manual/front-matter';

// Track teacher_manual_app_20261020: the manual section "The Primary Advantage app" agrees with the
// PR teacher picture guide (K1) and prints on a black-and-white office printer.
describe('teacher manual app section', () => {
    it('maps the 13 book steps to the 14 app steps, with no app step for Guided Writing', () => {
        expect(STEP_MAP.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
        expect(STEP_MAP.flatMap((s) => s.appSteps)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        expect(STEP_MAP.find((s) => s.title === 'Guided Writing')?.appSteps).toEqual([]);
        for (const lang of ['en', 'th'] as const) expect(APP_SECTION[lang].appSteps).toHaveLength(14);
    });

    it('has the parts of the picture guide in its order, the same in both languages', () => {
        const heads = APP_SECTION.th.parts.map((p) => p.heading.split(' ')[0]);
        expect(heads).toEqual(['1.', '2.', '3.', '4.1', '4.2', '4.3', '5.', '6.']);
        APP_SECTION.th.parts.forEach((p, i) => {
            const e = APP_SECTION.en.parts[i];
            expect(e.heading.split(' ')[0]).toBe(heads[i]);
            expect([e.steps.length, e.screens.length, e.notes.length], p.heading).toEqual([p.steps.length, p.screens.length, p.notes.length]);
            expect(e.screens.map((s) => s.id)).toEqual(p.screens.map((s) => s.id));
        });
    });

    it('uses the Thai labels of the app and no Chinese characters', () => {
        const text = JSON.stringify(APP_SECTION.th);
        expect(text).not.toMatch(/[一-鿿]/);
        for (const label of ['เริ่มชั้นเรียน', 'รหัสชั้นเรียน', 'รหัสห้องเรียน', 'จบชั้นเรียน', 'ครูนำ (ทำแบบฝึกหัดก่อน)', 'ทำเครื่องหมายว่าทำขั้นนี้แล้ว', 'ทำเครื่องหมายว่าสอนแล้ว', 'งานที่กำหนด', 'ทำใบรายชื่อชั้นเรียน', 'บัตรใหม่']) {
            expect(text, label).toContain(`“${label}”`);
        }
        expect(text).toContain('Hello! I Am Tom');
        // The printed QR codes open the article (Monorepo, 2026-10-20); AI feedback is not promised.
        expect(APP_SECTION.th.bookNote).toContain('คิวอาร์โค้ด');
        expect(generateAppSection('th')).toContain(APP_SECTION.th.bookNoteTitle);
        expect(text).toContain('ผู้ดูแลระบบของโรงเรียน');
    });

    it('has a marked screenshot file for each screen, and a placeholder only for the sign-in page', () => {
        const screens = APP_SECTION.th.parts.flatMap((p) => p.screens);
        expect(screens.filter((s) => s.id === null)).toHaveLength(1);
        expect(APP_SECTION.th.parts[0].screens[0].id).toBeNull();
        for (const s of screens.filter((x) => x.id)) expect(fs.existsSync(path.join(APP_SCREEN_DIR, `${s.id}.jpg`)), String(s.id)).toBe(true);
        const html = generateAppSection('th');
        expect(html.match(/<img src="data:image\/jpeg;base64,/g)).toHaveLength(screens.length - 1);
        expect(html.match(/class="tm-app-part"/g)).toHaveLength(8);
    });

    it('comes in the front matter after the preface and before the lesson plan structure', () => {
        for (const lang of ['en', 'th'] as const) {
            const html = generateFrontMatter({ seriesName: 'Origins', seriesLevel: '3.1', cefrLevel: 'A1' }, undefined, lang);
            const [preface, app] = [html.indexOf('tm-preface'), html.indexOf('tm-app-section')];
            expect(preface, lang).toBeGreaterThan(-1);
            expect(app, lang).toBeGreaterThan(preface);
            expect(html.indexOf(APP_SECTION[lang].heading), lang).toBeGreaterThan(app);
            expect(html.match(/class="tm-section tm-app-section"/g), lang).toHaveLength(1);
        }
    });

    it('prints in black, white, and gray only, with no emoji, gradient, rgba, or shadow', () => {
        for (const lang of ['en', 'th'] as const) {
            const html = generateAppSection(lang).replace(/data:image\/jpeg;base64,[A-Za-z0-9+/=]+/g, '');
            expect(html).not.toMatch(/gradient|rgba\(|box-shadow|text-shadow|opacity/);
            expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
            for (const hex of html.match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
                const [r, g, b] = [1, 3, 5].map((i) => hex.slice(i, i + 2));
                expect(r === g && g === b, hex).toBe(true);
            }
        }
    });
});
