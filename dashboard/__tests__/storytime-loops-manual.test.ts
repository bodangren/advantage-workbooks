// @vitest-environment node
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT } from '../lib/storytime/files';
import { compileStorytimeManual, renderStorytimeWeek } from '../lib/storytime/manual';
import { StorytimeWeekSchema, type StorytimeWeekInput } from '../lib/storytime/schema';
import type { StorytimeLabels } from '../lib/storytime/i18n';

const BASELINE_COMMIT = '85fa353534ce4aa8676a70e3e766f9bdaa58a669';
const BASELINE: Record<number, string[]> = {
    1: [
        '1f7eac2980b924fd113ad59a1cb91496619fb7b15d391057d8c5082550b3050e',
        '07ec633988472c21c433ec3f564fcbe5cfb4b780dd2e2942bcf8e86ba1847375',
        'bcd736ca7a63ca4d82e68836ddc7b6fdf15e28a6b5b7d385c6270edf78d46ad8',
        '383aff95e45c39e6672e2f6dfa4aa7e4415d72d718eaad7aee15a6953b07e0d0',
    ],
    2: [
        '4068d96707b41e9f8415ed9314a2f412a37a7ab6c373c778b61675b342fe19c2',
        '59c615d83be83ed68775d4a1901c402c282bc1993f029e1505c744a145142399',
        '63bb5b2a7e039711b9a6e7202501f0e908ae28965cba6a4589d6e129c02161f4',
        '281f1d0c20896a72c58bab09b3c2fd82fb11a23f263736c6e182329d26e3a650',
    ],
};

function shipped(week: number): StorytimeWeekInput {
    const file = path.join(STORYTIME_ROOT, 'l2', `w${String(week).padStart(2, '0')}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimeWeekInput;
}

/** A week file as it was at the baseline commit, so that the renderer guard does not read a moving file. */
function atBaseline(week: number): StorytimeWeekInput {
    const file = `content/storytime/l2/w${String(week).padStart(2, '0')}.json`;
    return JSON.parse(execFileSync('git', ['show', `${BASELINE_COMMIT}:${file}`], { cwd: path.resolve(__dirname, '../..'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })) as StorytimeWeekInput;
}

function loopCopy(week: number): StorytimeWeekInput {
    const w = structuredClone(shipped(week)) as any;
    const bi = (en: string, th: string) => ({ en, th });
    for (const script of w.scripts) {
        script.recall = {
            items: Array.from({ length: 5 }, (_, i) => ({ kind: 'word', text: `recall${i + 1}`, week: 1 })),
            ask: bi('Recall the cards.', 'ทบทวนบัตรคำ'),
        };
        for (const step of script.steps) {
            if (['A1', 'A2', 'A3'].includes(step.id)) step.soundLoop = {
                correct: bi('Say the sound again.', 'ออกเสียงนั้นอีกครั้ง'),
                practise: bi('Say it with me.', 'พูดพร้อมกัน'),
                retest: bi('What sound?', 'เสียงอะไร'),
            };
            if (['A6', 'D2'].includes(step.id)) step.sightWords = {
                words: ['a', 'and'], slide: bi('Slide under each word. Read it the fast way.', 'ลากนิ้วใต้คำแล้วอ่านแบบเร็ว'),
                check: bi('Read each word in three seconds.', 'อ่านแต่ละคำภายในสามวินาที'), seconds: 3,
            };
        }
        const a4 = script.steps.find((step: any) => step.id === 'A4');
        if (a4) {
            a4.loopMinutes = 0;
            a4.blendDrill = {
                words: [{ word: 'net', sounds: ['/n/', '/e/', '/t/'] }, { word: 'nut', sounds: ['/n/', '/u/', '/t/'] }, { word: 'nose', sounds: ['/n/', '/o/', '/z/'] }],
                model: bi('I say each sound.', 'ครูออกเสียงทีละเสียง'), lead: bi('Say the sounds with me.', 'พูดเสียงพร้อมครู'),
                test: bi('Say the word.', 'พูดคำนี้'), repeats: 3, correction: bi('Listen. I will say it again.', 'ฟังนะ ครูจะพูดอีกครั้ง'),
            };
        }
    }
    const readalong = w.books.find((book: any) => book.kind === 'readalong');
    if (readalong) readalong.questions = ['who', 'what', 'where'].map((kind) => ({ kind, ask: bi(`Ask ${kind}.`, `ถาม${kind}`), answer: { page: 1, word: 'Nan' } }));
    return w;
}

function stripLoops(input: StorytimeWeekInput): StorytimeWeekInput {
    const copy = structuredClone(input) as any;
    for (const script of copy.scripts) {
        delete script.recall;
        for (const step of script.steps) {
            delete step.blendDrill;
            delete step.soundLoop;
            delete step.sightWords;
            delete step.loopMinutes;
        }
    }
    for (const book of copy.books) delete book.questions;
    return copy;
}

function digest(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}

describe('Storytime teaching loops in the manual', () => {
    it('renders the baseline-commit w01 and w02 to the recorded HTML hashes, with loops absent or off (renderer guard)', () => {
        for (const n of [1, 2]) {
            const week = StorytimeWeekSchema.parse(atBaseline(n));
            const html = [
                compileStorytimeManual([week], { lang: 'th', paper: 'a4' }).html,
                compileStorytimeManual([week], { lang: 'en' }).html,
                renderStorytimeWeek(week, 'th'), renderStorytimeWeek(week, 'en'),
            ];
            expect(html.map(digest), `baseline commit ${BASELINE_COMMIT}, week ${n}`).toEqual(BASELINE[n]);
            expect(compileStorytimeManual([week], { lang: 'en', loops: false } as any).html).toBe(html[1]);
        }
    });

    it('renders the shipped w01 and w02 to the same HTML with loops absent and with loops false', () => {
        for (const n of [1, 2]) {
            const week = StorytimeWeekSchema.parse(shipped(n));
            expect(compileStorytimeManual([week], { lang: 'en', loops: false } as any).html, `week ${n} compile`).toBe(compileStorytimeManual([week], { lang: 'en' }).html);
            expect(compileStorytimeManual([week], { lang: 'th', paper: 'a4', loops: false } as any).html, `week ${n} th compile`).toBe(compileStorytimeManual([week], { lang: 'th', paper: 'a4' }).html);
            expect(renderStorytimeWeek(week, 'en', { loops: false } as any), `week ${n} en week`).toBe(renderStorytimeWeek(week, 'en'));
            expect(renderStorytimeWeek(week, 'th', { loops: false } as any), `week ${n} th week`).toBe(renderStorytimeWeek(week, 'th'));
        }
    });

    it.each([1, 2])('prints each routine in English and Thai for loop-complete w%02d', (n) => {
        const w = StorytimeWeekSchema.parse(loopCopy(n));
        const en = renderStorytimeWeek(w, 'en', { loops: true } as any);
        const th = renderStorytimeWeek(w, 'th', { loops: true } as any);
        for (const text of ['I say each sound.', 'Say the sounds with me.', 'Say the word.', 'Listen. I will say it again.', 'Read it the fast way.', 'Read each word in three seconds.', 'Ask who.', 'Recall the cards.']) expect(en).toContain(text);
        for (const text of ['ครูออกเสียงทีละเสียง', 'พูดเสียงพร้อมครู', 'พูดคำนี้', 'ครูจะพูดอีกครั้ง', 'อ่านแบบเร็ว', 'ภายในสามวินาที', 'ถามwho', 'ทบทวนบัตรคำ']) expect(th).toContain(text);
        expect(en).toContain('A4 · Blend it <span class="st-min">0 min</span>');
        expect(en.indexOf('Recall the cards.')).toBeGreaterThan(en.indexOf('Opening routine'));
    });

    it('keeps loop-complete HTML unchanged when the option is absent or false', () => {
        const complete = StorytimeWeekSchema.parse(loopCopy(1));
        const stripped = StorytimeWeekSchema.parse(stripLoops(loopCopy(1)));
        expect(renderStorytimeWeek(complete, 'en')).toBe(renderStorytimeWeek(stripped, 'en'));
        expect(compileStorytimeManual([complete], { lang: 'en' }).html).toBe(compileStorytimeManual([stripped], { lang: 'en' }).html);
        expect(compileStorytimeManual([complete], { lang: 'en', loops: false }).html).toBe(compileStorytimeManual([stripped], { lang: 'en' }).html);
    });

    it('puts the routines in step order, and keeps recall in the day opening', () => {
        const html = renderStorytimeWeek(StorytimeWeekSchema.parse(loopCopy(1)), 'en', { loops: true } as any);
        const day = html.split('<section class="st-day"')[1];
        const locations = ['Sound loop', 'Blend drill', 'Read it the fast way.'];
        expect(locations.map((s) => day.indexOf(s)).every((n) => n >= 0)).toBe(true);
        expect(locations.map((s) => day.indexOf(s))).toEqual([...locations].map((s) => day.indexOf(s)).sort((a, b) => a - b));
        expect(day.indexOf('Recall the cards.')).toBeGreaterThan(day.indexOf('<h5>Review strip</h5>'));
        // A-48 decision 6: the read-along questions print in D3 (day 4, the leveled reader), not in C5 (day 3, the decodable).
        const day3 = html.split('<section class="st-day"')[3];
        expect(day3.indexOf('Questions: point to the picture')).toBe(-1);
        const day4 = html.split('<section class="st-day"')[4];
        expect(day4.indexOf('Questions: point to the picture')).toBeGreaterThan(-1);
        expect(day4.indexOf('Ask who.')).toBeGreaterThan(day4.indexOf('Questions: point to the picture'));
    });

    it.each([
        ['en', 'Review strip', 'Daily recall', 'No review cards today.'],
        ['th', 'แถบทบทวน', 'ทบทวนประจำวัน', 'วันนี้ไม่มีบัตรทบทวน'],
    ] as const)('gives the review strip heading its own content before the recall block (%s)', (lang, strip, recall, noCards) => {
        const html = renderStorytimeWeek(StorytimeWeekSchema.parse(loopCopy(1)), lang, { loops: true } as any);
        const days = html.split('<section class="st-day"').slice(1);
        expect(days).toHaveLength(5);
        let withCards = 0;
        let withoutCards = 0;
        days.forEach((day, i) => {
            const stripHeading = `<h5>${strip}</h5>`;
            const from = day.indexOf(stripHeading);
            expect(from, `day ${i + 1} has the strip heading`).toBeGreaterThan(-1);
            const opening = day.slice(from + stripHeading.length, day.indexOf('</div>', from));
            const recallAt = opening.indexOf(`<h5>${recall}</h5>`);
            expect(recallAt, `day ${i + 1} has the recall heading inside the opening`).toBeGreaterThan(0);
            const stripContent = opening.slice(0, recallAt);
            expect(stripContent, `day ${i + 1}: the strip content follows the strip heading`).toMatch(/^\s*<p>/);
            expect(stripContent, `day ${i + 1}: no heading between the strip heading and its content`).not.toContain('<h5>');
            const recallBlock = opening.slice(recallAt);
            expect(recallBlock, `day ${i + 1}: the recall block holds the 5 cards`).toContain('recall5');
            expect(recallBlock, `day ${i + 1}: the strip text is not under the recall heading`).not.toContain('<strong>');
            expect(recallBlock, `day ${i + 1}: the no-cards line is not under the recall heading`).not.toContain(noCards);
            if (stripContent.includes(noCards)) withoutCards += 1;
            else {
                withCards += 1;
                expect(stripContent, `day ${i + 1}: strip cards`).toContain('<strong>');
            }
        });
        expect(withCards).toBeGreaterThan(0);
        expect(withoutCards).toBeGreaterThan(0);
    });

    it('escapes routine text and prints English when a routine has no Thai line', () => {
        const input = loopCopy(1) as any;
        input.scripts[0].steps.find((step: any) => step.id === 'A4').blendDrill.model = { en: '<script>bad</script>' };
        const html = renderStorytimeWeek(StorytimeWeekSchema.parse(input), 'th', { loops: true } as any);
        expect(html).toContain('&lt;script&gt;bad&lt;/script&gt;');
        expect(html).not.toContain('<script>bad</script>');
    });

    it('defines the five routine headings in both label sets', async () => {
        const i18n = await import('../lib/storytime/i18n');
        const labels = i18n.storytimeLabels as (lang: 'en' | 'th') => StorytimeLabels;
        for (const key of ['blendDrill', 'soundLoop', 'sightWords', 'questions', 'recallLoop'] as const) {
            expect(labels('en')[key]).toBeTruthy();
            expect(labels('th')[key]).toMatch(/[ก-๙]/);
        }
    });
});
