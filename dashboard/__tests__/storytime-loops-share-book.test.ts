// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { storytimeLabels } from '../lib/storytime/i18n';
import { compileStorytimeManual } from '../lib/storytime/manual';
import { storytimeStudentBookPages } from '../lib/storytime/print/step-pages';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { sampleShare } from './fixtures/storytime-share-sample';

// Phase 3b Red 3 of track storytime_teaching_loops_20261103 (FR-14, AC-14.7, AC-14.8, test-strategy 9.11): the
// teacher book prints the share moments of the shipped weeks w01 and w08 when the option `share` is on.
// The caption cross-check tests X1 to X12 (9.10) are in `storytime-loops-share-captions.test.ts` (plan_updates P14).
//
// Red notes. `StorytimeManualOptions` has no `share` option and `StorytimeLabels` has no share label at HEAD.
// The option is passed through a cast, and the labels are read through an untyped helper, so `tsc` passes
// before and after Green 3 and a missing field is an assertion failure (F11). The only tests that pass at Red
// are the T1 guard tests: they are characterization tests (the manual ignores the unknown option). Their
// falsifiers are the mutants MB1 and MB2 (a default-on option, and an option that is ignored) and the
// sensitivity test, which proves that the compare sees a changed step title.
//
// The block of a step is found by the matching `</div>` of its `<div class="st-step`, and by the id in its
// title (`<id> · `). The block of D5 sits in the recall group of day 5 and the block of D6 sits in the
// opening of day 5. Both hold the caption of day 4 (D5) or of day 5 (D6), not the caption of the day in which
// they print. The moment table is typed by hand in `fixtures/storytime-share-sample.ts` (spec FR-14).
//
// The CLI tests run with a temporary `HOME` and a temporary folder. No test builds a PDF and no test writes
// into `content/` or into the real home folder.
//
// Thai rule (test-strategy 9.4, item 6). This file holds no Thai literal. The shipped Thai text and the Thai
// labels are read into variables, and no `expect` compares them with a literal. The test asserts only that
// a Thai text is present, is not empty, and holds a Thai-script character.

type Raw = any;
type Lang = 'th' | 'en';

const LANGS: Lang[] = ['th', 'en'];

/** The eight Level 2 weeks. */
const WEEK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

/** The four new labels of `StorytimeLabels`, in the order of the caption list (Q22). */
const LABEL_KEYS = ['sharePhoto', 'shareVideo', 'shareConsent', 'shareLength'] as const;

/** A Thai-script character. The range is written as escapes, so this file holds no Thai literal. */
const THAI_SCRIPT = new RegExp(`[${String.fromCharCode(0x0e00)}-${String.fromCharCode(0x0e7f)}]`);

/** The icons of a teach week (w01 to w07) and of the review week w08 (spec FR-14, AC-14.8). */
const ICONS = { teach: 6, review: 5 };

const DASHBOARD = path.resolve(__dirname, '..');
const MANUAL_CLI = path.join(DASHBOARD, 'scripts/storytime/make-manual-pdf.ts');
const PRINT_CLI = path.join(DASHBOARD, 'scripts/storytime/make-teacher-book-print.ts');

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const norm = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** The raw JSON of a shipped Level 2 week. */
const rawWeek = (n: number): Raw => JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, n), 'utf8'));
const parsed = (raw: Raw): StorytimeWeek => StorytimeWeekSchema.parse(raw);

const weekCache = new Map<number, StorytimeWeek>();
/** A shipped week with its share fields. */
function shipped(n: number): StorytimeWeek {
    if (!weekCache.has(n)) weekCache.set(n, parsed(rawWeek(n)));
    return weekCache.get(n)!;
}

/** The raw week without any share field. */
function withoutShare(raw: Raw): Raw {
    const clone = copy(raw);
    for (const script of clone.scripts) delete script.share;
    return clone;
}

/** The share of a script, read through an untyped helper (F11). */
const shareOf = (script: unknown): Raw => (script as Raw).share;

/**
 * The HTML of the teacher manual. The option object is cast, because the option `share` is not in the type
 * until Green 3.
 */
function manual(weeks: StorytimeWeek[], options: Record<string, unknown>): string {
    return compileStorytimeManual(weeks, options as never).html;
}

/** One new label, read through an untyped helper. A missing label is a failed assertion. */
function label(lang: Lang, key: string): string {
    const value = (storytimeLabels(lang) as unknown as Record<string, unknown>)[key];
    expect(typeof value, `the label ${key} of the ${lang} book`).toBe('string');
    return value as string;
}

function decode(text: string): string {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

/** The visible text of a piece of HTML: no style, no script, no svg, no tag; entities decoded; white space collapsed. */
function visible(html: string): string {
    return norm(decode(html
        .replace(/<style\b[\s\S]*?<\/style>/g, ' ')
        .replace(/<script\b[\s\S]*?<\/script>/g, ' ')
        .replace(/<svg\b[\s\S]*?<\/svg>/g, ' ')
        .replace(/<[^>]+>/g, ' ')));
}

function occurrences(text: string, needle: string): number {
    expect(needle.length, 'the needle of an occurrence count').toBeGreaterThan(0);
    return text.split(needle).length - 1;
}

/** The index after the `</div>` that closes the `<div` at `start`. */
function closeOf(html: string, start: number): number {
    const tags = /<div\b|<\/div>/g;
    tags.lastIndex = start;
    let depth = 0;
    for (let m = tags.exec(html); m; m = tags.exec(html)) {
        depth += m[0] === '</div>' ? -1 : 1;
        if (depth === 0) return m.index + m[0].length;
    }
    throw new Error('the HTML has an unbalanced div');
}

/** Every step block of the HTML, in document order. */
function stepBlocks(html: string): string[] {
    return [...html.matchAll(/<div class="st-step(?: st-moved)?">/g)].map((m) => html.slice(m.index, closeOf(html, m.index)));
}

/** The step id in the title of a step block (`<id> · `), without the student book page badge. */
function titleId(block: string): string | undefined {
    return /<h4 class="st-step-title">([A-Z]\d{1,2}) · /.exec(block)?.[1];
}

/** The part of the HTML that holds one week. */
function weekPart(html: string, n: number): string {
    const start = html.indexOf(`<section class="st-week" id="week-${n}"`);
    if (start < 0) throw new Error(`the HTML has no part for week ${n}`);
    const next = html.indexOf('<section class="st-week"', start + 1);
    return html.slice(start, next < 0 ? undefined : next);
}

/** The one block of a step in a week part. */
function stepBlock(html: string, n: number, id: string): string {
    const found = stepBlocks(weekPart(html, n)).filter((block) => titleId(block) === id);
    expect(found.length, `the blocks of step ${id} in week ${n}`).toBe(1);
    return found[0];
}

/** The media value of every element that has the attribute `data-share-media`. */
function iconMedia(html: string): string[] {
    return [...html.matchAll(/<[a-zA-Z][^>]*\sdata-share-media=["']([^"']*)["'][^>]*>/g)].map((m) => m[1]);
}

/** The HTML of every icon element: from its tag to its closing tag. */
function iconChunks(html: string): string[] {
    return [...html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*\sdata-share-media=["'][^"']*["'][^>]*>/g)].map((m) => {
        const tag = m[1];
        const tags = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
        tags.lastIndex = m.index;
        let depth = 0;
        for (let t = tags.exec(html); t; t = tags.exec(html)) {
            depth += t[0].startsWith('</') ? -1 : 1;
            if (depth === 0) return html.slice(m.index, t.index + t[0].length);
        }
        return html.slice(m.index);
    });
}

interface Shot {
    day: number;
    id: string;
    step: string;
    media: string;
    caption: { en: string; th: string };
}

/** The shots of a shipped week: the steps and the media come from the hand-typed table, the captions from the data. */
function shotsOf(n: number): Shot[] {
    return shipped(n).scripts.flatMap((script) =>
        sampleShare(n, script.id).shots.map((shot) => ({
            day: script.day,
            id: script.id,
            step: shot.step,
            media: shot.media,
            caption: { en: norm(shareOf(script).caption.en), th: norm(shareOf(script).caption.th) },
        })),
    );
}

const expectedIcons = (n: number) => (n === 8 ? ICONS.review : ICONS.teach);

/** The share texts that a share-on book adds: the captions of the week, the consent line, and the length line. */
function shareTexts(n: number, lang: Lang): string[] {
    return [
        ...shipped(n).scripts.flatMap((script) => [norm(shareOf(script).caption.en), norm(shareOf(script).caption.th)]),
        norm(label(lang, 'shareConsent')),
        norm(label(lang, 'shareLength')),
    ];
}

function removeAll(text: string, parts: string[]): string {
    return norm(parts.reduce((rest, part) => rest.split(part).join(' '), text));
}

describe('T1 guard: the share fields change no byte with the option off or absent (AC-14.8)', () => {
    describe.each(WEEK_NUMBERS)('w0%i', (n) => {
        it.each(LANGS)('T1 guard w0' + n + ' %s: with share absent or false, with loops off and on, the HTML equals the HTML without share fields', (lang) => {
            const raw = rawWeek(n);
            const withShare = parsed(raw);
            const bare = parsed(withoutShare(raw));
            for (const loops of [false, true]) {
                const base = manual([bare], { lang, loops });
                expect(manual([withShare], { lang, loops }) === base, `share absent, loops ${loops}`).toBe(true);
                expect(manual([withShare], { lang, loops, share: false }) === base, `share false, loops ${loops}`).toBe(true);
            }
        });
    });

    it('T1 non-vacuity: each shipped week holds 5 shares, the bare copy holds none, and the compare sees a changed step title', () => {
        for (const n of WEEK_NUMBERS) {
            const raw = rawWeek(n);
            expect(raw.scripts.filter((script: Raw) => script.share).length, `the shares of w0${n}`).toBe(5);
            expect(withoutShare(raw).scripts.filter((script: Raw) => script.share).length).toBe(0);
        }
        const raw = withoutShare(rawWeek(1));
        const changed = copy(raw);
        changed.scripts[0].steps[0].title.en += ' changed';
        expect(manual([parsed(changed)], { lang: 'en' }) === manual([parsed(raw)], { lang: 'en' })).toBe(false);
    });
});

describe('T2 icons: one icon element for each shot (AC-14.8)', () => {
    it.each([1, 8].flatMap((n) => LANGS.flatMap((lang) => [false, true].map((loops) => ({ n, lang, loops })))))(
        'T2 icons w0$n $lang loops $loops: the week holds the icons of its shots, one in the block of each shot step',
        ({ n, lang, loops }) => {
            const html = manual([shipped(n)], { lang, loops, share: true });
            const media = iconMedia(html);
            expect(media.length, `the icons of w0${n}`).toBe(expectedIcons(n));
            const shots = shotsOf(n);
            expect(shots.length).toBe(expectedIcons(n));
            for (const shot of shots) {
                const block = stepBlock(html, n, shot.step);
                expect(iconMedia(block), `the icon in the block of ${shot.step}`).toEqual([shot.media]);
            }
            const withIcon = stepBlocks(weekPart(html, n)).filter((block) => iconMedia(block).length > 0).map(titleId).sort();
            expect(withIcon).toEqual(shots.map((shot) => shot.step).sort());
        },
    );

    it('T2 icons w01: day 4 holds a photo at D4 and a video at D5, and the song show D6 holds a video (paths 2 and 3)', () => {
        const html = manual([shipped(1)], { lang: 'th', share: true });
        expect(iconMedia(stepBlock(html, 1, 'D4'))).toEqual(['photo']);
        expect(iconMedia(stepBlock(html, 1, 'D5'))).toEqual(['video']);
        expect(iconMedia(stepBlock(html, 1, 'D6'))).toEqual(['video']);
        expect(iconMedia(stepBlock(html, 1, 'C7')), 'the sticker step is not a share moment').toEqual([]);
    });
});

describe('T3 caption: the block of a shot step holds the caption of its day (AC-14.8)', () => {
    it.each([1, 8])('T3 caption w0%i th: the Thai book holds caption.th and then caption.en in each shot block', (n) => {
        const html = manual([shipped(n)], { lang: 'th', share: true });
        for (const shot of shotsOf(n)) {
            expect(THAI_SCRIPT.test(shot.caption.th), `caption.th of day ${shot.day} holds a Thai-script character`).toBe(true);
            const text = visible(stepBlock(html, n, shot.step));
            const th = text.indexOf(shot.caption.th);
            const en = text.indexOf(shot.caption.en);
            expect(th, `caption.th in the block of ${shot.step}`).toBeGreaterThanOrEqual(0);
            expect(en, `caption.en in the block of ${shot.step}`).toBeGreaterThanOrEqual(0);
            expect(th).toBeLessThan(en);
        }
    });

    it.each([1, 8])('T3 caption w0%i en: the English manual holds caption.en and not caption.th in each shot block', (n) => {
        const html = manual([shipped(n)], { lang: 'en', share: true });
        for (const shot of shotsOf(n)) {
            const text = visible(stepBlock(html, n, shot.step));
            expect(text.includes(shot.caption.en), `caption.en in the block of ${shot.step}`).toBe(true);
            expect(text.includes(shot.caption.th), `caption.th in the block of ${shot.step}`).toBe(false);
        }
    });
});

describe('T4 label: the label of the media prints at each shot', () => {
    it.each(LANGS.flatMap((lang) => [1, 8].map((n) => ({ lang, n }))))('T4 label w0$n $lang: a photo block holds sharePhoto and a video block holds shareVideo', ({ lang, n }) => {
        const on = manual([shipped(n)], { lang, share: true });
        const off = manual([shipped(n)], { lang, share: false });
        const photo = label(lang, 'sharePhoto');
        const video = label(lang, 'shareVideo');
        expect(photo).not.toBe(video);
        const texts = shareTexts(n, lang);
        for (const shot of shotsOf(n)) {
            const onText = removeAll(visible(stepBlock(on, n, shot.step)), texts);
            const offText = visible(stepBlock(off, n, shot.step));
            const added = (needle: string) => occurrences(onText, needle) - occurrences(offText, needle);
            expect(added(photo), `sharePhoto in the block of ${shot.step}`).toBe(shot.media === 'photo' ? 1 : 0);
            expect(added(video), `shareVideo in the block of ${shot.step}`).toBe(shot.media === 'video' ? 1 : 0);
        }
    });
});

describe('T5 consent: the consent line and the length line print once in each week part (D20, Q17, Q18)', () => {
    it.each(LANGS)('T5 consent %s: share off prints 0, one week prints 1, two weeks print 2', (lang) => {
        const consent = norm(label(lang, 'shareConsent'));
        const length = norm(label(lang, 'shareLength'));
        const count = (html: string, text: string) => occurrences(visible(html), text);
        const off = manual([shipped(1)], { lang, share: false });
        expect(count(off, consent)).toBe(0);
        expect(count(off, length)).toBe(0);
        const one = manual([shipped(1)], { lang, share: true });
        expect(count(one, consent), 'consent lines of one week').toBe(1);
        expect(count(one, length), 'length lines of one week').toBe(1);
        const two = manual([shipped(1), shipped(2)], { lang, share: true });
        expect(count(two, consent), 'consent lines of two weeks').toBe(2);
        expect(count(two, length), 'length lines of two weeks').toBe(2);
    });

    it.each(LANGS.flatMap((lang) => [{ lang, n: 1, first: 'A3' }, { lang, n: 2, first: 'A3' }, { lang, n: 8, first: 'A2' }]))(
        'T5 consent w0$n $lang: the lines sit in the block of the first shot of day 1 ($first)',
        ({ lang, n, first }) => {
            const html = manual([shipped(1), shipped(2), shipped(8)], { lang, share: true });
            const block = visible(stepBlock(html, n, first));
            expect(occurrences(block, norm(label(lang, 'shareConsent')))).toBe(1);
            expect(occurrences(block, norm(label(lang, 'shareLength')))).toBe(1);
            const others = stepBlocks(weekPart(html, n)).filter((candidate) => titleId(candidate) !== first);
            for (const other of others) {
                expect(occurrences(visible(other), norm(label(lang, 'shareConsent')))).toBe(0);
            }
        },
    );
});

describe('T6 labels: the four labels have English and Thai (D20, Q17)', () => {
    it.each(LABEL_KEYS)('T6 labels %s: English has no Thai-script character, Thai has one, and the two differ', (key) => {
        const en = label('en', key);
        const th = label('th', key);
        expect(en.trim().length, `${key} (en) is not empty`).toBeGreaterThan(0);
        expect(THAI_SCRIPT.test(en), `${key} (en) holds no Thai-script character`).toBe(false);
        expect(th.trim().length, `${key} (th) is not empty`).toBeGreaterThan(0);
        expect(THAI_SCRIPT.test(th), `${key} (th) holds a Thai-script character`).toBe(true);
        expect(en).not.toBe(th);
    });

    it('T6 labels: the consent line names the consent and the closed group, and the length line names seconds (Q17)', () => {
        expect(label('en', 'shareConsent')).toMatch(/consent/i);
        expect(label('en', 'shareConsent')).toMatch(/group/i);
        expect(label('en', 'shareLength')).toMatch(/second/i);
    });
});

describe('T7 escape: a caption prints escaped (AC-14.8)', () => {
    const INJECTED = 'Tom & Jerry say "hi" <script>alert(1)</script> now';

    it.each(['en', 'th'] as Lang[])('T7 escape %s: the caption of this language prints escaped in the book of this language', (lang) => {
        const raw = rawWeek(1);
        raw.scripts[0].share.caption[lang] = lang === 'th' ? `${shareOf(raw.scripts[0]).caption.th} ${INJECTED}` : INJECTED;
        const week = parsed(raw);
        const html = manual([week], { lang, share: true });
        expect(html.includes('<script>alert(1)'), 'a raw script tag in the caption').toBe(false);
        expect(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'the escaped script tag').toBe(true);
        expect(html.includes('Tom &amp; Jerry'), 'the escaped ampersand').toBe(true);
        const text = visible(stepBlock(html, 1, 'A3'));
        expect(text.includes(norm(shareOf(week.scripts[0]).caption[lang])), 'the caption text reads back whole').toBe(true);
    });
});

describe('T8 icon colour: the icon is an inline SVG in black only (D22)', () => {
    it.each(LANGS)('T8 icon colour %s: each icon of w01 holds only black, none, or currentColor', (lang) => {
        const chunks = iconChunks(manual([shipped(1)], { lang, share: true }));
        expect(chunks.length, 'the icons of w01').toBe(ICONS.teach);
        const allowed = ['#000', '#000000', 'black', 'none', 'currentcolor'];
        for (const chunk of chunks) {
            expect(chunk.includes('<svg'), 'the icon is an inline svg').toBe(true);
            expect(/<img\b/i.test(chunk), 'no img element').toBe(false);
            expect(/rgb\(|hsl\(/i.test(chunk), 'no rgb or hsl colour').toBe(false);
            const values = [
                ...[...chunk.matchAll(/\b(?:fill|stroke|stop-color|flood-color|color)\s*=\s*["']([^"']*)["']/gi)].map((m) => m[1]),
                ...[...chunk.matchAll(/\b(?:fill|stroke|color)\s*:\s*([^;"']+)/gi)].map((m) => m[1]),
            ].map((value) => value.trim().toLowerCase());
            for (const value of values) expect(allowed, `the colour ${value}`).toContain(value);
            for (const hex of chunk.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) expect(['#000', '#000000'], `the hex ${hex}`).toContain(hex.toLowerCase());
        }
    });
});

describe('T9 edge: a week without share (Q18)', () => {
    it('T9 edge: a week without share and the option on prints no icon and no consent line, and does not throw', () => {
        const complete = manual([shipped(1)], { lang: 'th', share: true });
        expect(iconMedia(complete).length, 'non-vacuity: the complete week holds its icons').toBe(ICONS.teach);
        const bare = parsed(withoutShare(rawWeek(1)));
        let html = '';
        expect(() => {
            html = manual([bare], { lang: 'th', share: true });
        }).not.toThrow();
        expect(iconMedia(html).length).toBe(0);
        expect(occurrences(visible(html), norm(label('th', 'shareConsent')))).toBe(0);
        expect(occurrences(visible(html), norm(label('th', 'shareLength')))).toBe(0);
    });

    it('T9 edge: a week without a day 1 share prints the consent line once, at its first shot (Q18)', () => {
        const raw = rawWeek(1);
        delete raw.scripts[0].share;
        const week = parsed(raw);
        for (const lang of LANGS) {
            const html = manual([week], { lang, share: true });
            expect(iconMedia(html).length, 'the icons of the week without day 1').toBe(ICONS.teach - 1);
            const consent = norm(label(lang, 'shareConsent'));
            expect(occurrences(visible(html), consent), 'consent lines').toBe(1);
            expect(occurrences(visible(stepBlock(html, 1, 'B5')), consent), 'consent line in the block of B5').toBe(1);
        }
    });
});

describe('T10 differential: the share option adds only the share texts and the icons', () => {
    it.each(LANGS.flatMap((lang) => [false, true].map((loops) => ({ lang, loops }))))(
        'T10 differential $lang loops $loops: after the removal of the share texts the visible text equals the share-off text',
        ({ lang, loops }) => {
            const on = manual([shipped(1)], { lang, loops, share: true });
            const off = manual([shipped(1)], { lang, loops, share: false });
            expect(iconMedia(on).length, 'non-vacuity: the share-on book holds its icons').toBe(ICONS.teach);
            const parts = [...shareTexts(1, lang), ...LABEL_KEYS.slice(0, 2).map((key) => norm(label(lang, key)))];
            expect(removeAll(visible(on), parts)).toBe(removeAll(visible(off), parts));
        },
    );
});

/** The calls of a function by name. */
function callsOf(parsedFile: ts.SourceFile, name: string): ts.CallExpression[] {
    const calls: ts.CallExpression[] = [];
    const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && node.expression.getText(parsedFile) === name) calls.push(node);
        ts.forEachChild(node, visit);
    };
    visit(parsedFile);
    return calls;
}

/** True when an argument names `share`: an identifier, a property, or an object literal with a `share` key. */
function namesShare(arg: ts.Expression, parsedFile: ts.SourceFile): boolean {
    if (ts.isIdentifier(arg)) return arg.text === 'share';
    if (ts.isPropertyAccessExpression(arg)) return arg.name.text === 'share';
    if (ts.isObjectLiteralExpression(arg)) {
        return arg.properties.some((property) => (ts.isShorthandPropertyAssignment(property) && property.name.text === 'share')
            || (ts.isPropertyAssignment(property) && property.name.getText(parsedFile) === 'share'));
    }
    return false;
}

describe('T11 wiring: the flag --share reaches the compile call in both scripts', () => {
    let home = '';
    beforeAll(() => {
        home = fs.mkdtempSync(path.join(os.tmpdir(), 'share-book-'));
    });
    afterAll(() => {
        fs.rmSync(home, { recursive: true, force: true });
    });

    const run = (cli: string, args: string[]) =>
        spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], {
            cwd: DASHBOARD, encoding: 'utf8', timeout: 25_000, env: { ...process.env, HOME: home },
        });

    it.each([MANUAL_CLI, PRINT_CLI])('T11 wiring %s: the file reads --share and passes share to the compile call', (file) => {
        const parsedFile = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
        expect(parsedFile.getFullText().includes("a === '--share'")).toBe(true);
        const compiles = callsOf(parsedFile, 'compileStorytimeManual');
        expect(compiles.length, 'calls of compileStorytimeManual').toBeGreaterThanOrEqual(1);
        for (const call of compiles) expect(call.arguments.some((arg) => namesShare(arg, parsedFile)), 'a compile call passes share').toBe(true);
    });

    it('T11 wiring: every call of renderChromePdf in the print script passes share', () => {
        const parsedFile = ts.createSourceFile(PRINT_CLI, fs.readFileSync(PRINT_CLI, 'utf8'), ts.ScriptTarget.Latest, true);
        const renders = callsOf(parsedFile, 'renderChromePdf');
        expect(renders.length, 'calls of renderChromePdf').toBeGreaterThanOrEqual(2);
        for (const call of renders) expect(call.arguments.some((arg) => namesShare(arg, parsedFile)), 'a render call passes share').toBe(true);
    });

    it('T11 wiring: the manual PDF help names --share', () => {
        const result = run(MANUAL_CLI, ['--help']);
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('--share');
    }, 30_000);

    it('T11 wiring: the print script with an unknown flag exits 2 and its usage names --share and --loops', () => {
        const result = run(PRINT_CLI, ['--level', '2', '--weeks', '1', '--lang', 'th', '--unknown']);
        expect(result.status).toBe(2);
        expect(result.stderr).toContain('--loops');
        expect(result.stderr).toContain('--share');
    }, 30_000);

    it.each([MANUAL_CLI, PRINT_CLI])('T11 wiring %s: the flag --share is accepted, and an unknown flag still exits 2', (file) => {
        const accepted = run(file, ['--share']);
        expect(accepted.status, 'a missing source or level is a usage error').toBe(2);
        expect(accepted.stderr.toLowerCase()).not.toContain('unknown argument');
        const unknown = run(file, ['--share', '--unknown-flag']);
        expect(unknown.status).toBe(2);
        expect(unknown.stderr).toContain('--unknown-flag');
    }, 60_000);
});

describe('T12 print path: the page list of the student book keeps the icons', () => {
    it('T12 print path: compileStorytimeManual of w01 with share and studentBookPages holds the icons of w01', () => {
        const pages = storytimeStudentBookPages(WEEK_NUMBERS.map(shipped));
        const html = manual([shipped(1)], { lang: 'th', share: true, studentBookPages: pages });
        expect(iconMedia(html).length, 'the icons of w01 with the page list').toBe(ICONS.teach);
        expect(iconMedia(manual([shipped(1)], { lang: 'th', share: false, studentBookPages: pages })).length).toBe(0);
    }, 60_000);
});
