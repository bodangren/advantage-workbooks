import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, readLevelWeeks, readUnitWeeks } from '../lib/storytime/files';
import { compileStorytimeManual } from '../lib/storytime/manual';
import { storytimeStudentBookPages } from '../lib/storytime/print/step-pages';

/**
 * Task 5.0 (keep-with-next): in the unit 2 teacher book print build, a day
 * heading and the lesson-start box keep with the next box, so no page holds
 * only those 2. The trial build of 2026-11-26 holds 4 such pages: 85, 116,
 * 176, and 207 (the day 5 headings of weeks 11, 12, 14, and 15).
 *
 * The build below follows the production path of
 * `scripts/storytime/make-teacher-book-print.ts`: `compileStorytimeManual`
 * with loops, share, and the unit `studentBookPages`, rendered in system
 * Chrome with Paged.js. An orphan page holds an `h3.st-day-title` and a
 * `div.st-prep` but no `div.st-opening` and no `div.st-step` (DOM classes,
 * not text). Failure messages name pages by number and section id only.
 */

interface OrphanPage {
    page: number;
    sections: string[];
}

interface RenderedUnit {
    totalPages: number;
    orphans: OrphanPage[];
}

const temporaryFolders: string[] = [];

function requireHeavyWrapper(): void {
    let pid = process.pid;
    let found = false;
    for (let hop = 0; pid > 1 && hop < 64; hop++) {
        const command = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0');
        if (command.some((arg) => arg.endsWith('/heavy-run.sh'))) found = true;
        const parent = fs.readFileSync(`/proc/${pid}/status`, 'utf8').match(/^PPid:\s+(\d+)/m);
        pid = Number(parent?.[1] ?? 0);
    }
    expect(found, 'Run Chrome only through heavy-run.sh.').toBe(true);
}

function temporaryFolder(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const folder = fs.mkdtempSync('/tmp/opencode/storytime-keep-with-next-');
    temporaryFolders.push(folder);
    return folder;
}

afterAll(() => {
    for (const folder of temporaryFolders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
});

const renderedUnits = new Map<number, Promise<RenderedUnit>>();

function renderUnit(unit: number, weeks: number[]): Promise<RenderedUnit> {
    const cached = renderedUnits.get(unit);
    if (cached) return cached;
    const job = renderUnitOnce(unit, weeks);
    renderedUnits.set(unit, job);
    return job;
}

/** Renders the Thai teacher book of one unit through the maker production path. */
async function renderUnitOnce(unit: number, weeks: number[]): Promise<RenderedUnit> {
    requireHeavyWrapper();
    const parsed = readLevelWeeks(STORYTIME_ROOT, 2)
        .map((entry) => entry.week)
        .filter((week): week is NonNullable<typeof week> => !!week && week.meta.unit === unit && weeks.includes(week.meta.week))
        .sort((a, b) => a.meta.week - b.meta.week);
    expect(parsed.map((week) => week.meta.week), `unit ${unit} weeks read`).toEqual(weeks);
    const studentBookPages = storytimeStudentBookPages(readUnitWeeks(STORYTIME_ROOT, 2, unit));
    expect(studentBookPages.length, `unit ${unit} student-book pages`).toBeGreaterThan(0);
    const { html } = compileStorytimeManual(parsed, { lang: 'th', paper: 'a4', loops: true, share: true, studentBookPages });
    const folder = temporaryFolder();
    const htmlFile = path.join(folder, `teacher-u${unit}.html`);
    fs.writeFileSync(htmlFile, html.replace(/<script[^>]+src="https?:[^>]+><\/script>/g, ''));
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ channel: 'chrome', timeout: 120_000 });
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(900_000);
        await page.goto(`file://${htmlFile}`, { waitUntil: 'load', timeout: 300_000 });
        await page.addScriptTag({ content: 'window.PagedConfig = { auto: false };' });
        await page.addScriptTag({ content: fs.readFileSync('node_modules/pagedjs/dist/paged.polyfill.js', 'utf8') });
        await page.evaluate('(async () => { await document.fonts.ready; await window.PagedPolyfill.preview(); await document.fonts.ready; })()');
        return await page.evaluate(() => {
            const pages = Array.from(document.querySelectorAll('.pagedjs_page'));
            const orphans: OrphanPage[] = [];
            pages.forEach((paged, index) => {
                const content = paged.querySelector('.pagedjs_page_content') ?? paged;
                const hasTitle = content.querySelectorAll('h3.st-day-title').length;
                const hasPrep = content.querySelectorAll('div.st-prep').length;
                const hasOpening = content.querySelectorAll('div.st-opening').length;
                const hasStep = content.querySelectorAll('div.st-step').length;
                if (hasTitle > 0 && hasPrep > 0 && hasOpening === 0 && hasStep === 0) {
                    const sections = Array.from(content.querySelectorAll('h3.st-day-title')).map((title) => {
                        const section = (title as Element).closest('section');
                        return section && section.id ? section.id : 'unknown';
                    });
                    orphans.push({ page: index + 1, sections });
                }
            });
            return { totalPages: pages.length, orphans };
        });
    } finally {
        await browser.close();
    }
}

function orphanNames(orphans: OrphanPage[]): string[] {
    return orphans.map((orphan) => `page ${orphan.page} (${orphan.sections.join(', ')})`);
}

describe('Storytime teacher book keep-with-next (Task 5.0)', () => {
    it('uses the maker production path: loops, share, and the unit student-book pages', () => {
        const maker = fs.readFileSync(path.resolve(__dirname, '../scripts/storytime/make-teacher-book-print.ts'), 'utf8');
        expect(maker, 'the maker compiles the manual').toContain('compileStorytimeManual');
        expect(maker, 'the maker passes the draft loops').toContain('loops');
        expect(maker, 'the maker passes the parent-share moments').toContain('share');
        expect(maker, 'the maker passes the unit student-book pages').toContain('studentBookPages');
    });

    it('unit 2 (weeks 9 to 16): no page holds only a day heading and the lesson-start box', async () => {
        const rendered = await renderUnit(2, [9, 10, 11, 12, 13, 14, 15, 16]);
        expect(rendered.totalPages, 'unit 2 teacher book page count').toBeGreaterThan(200);
        const names = orphanNames(rendered.orphans);
        expect(names, `day-opening pages without a following box: ${names.join('; ')}`).toEqual([]);
    }, 600_000);

    it('unit 1 guard (weeks 1 to 8): no such page today', async () => {
        const rendered = await renderUnit(1, [1, 2, 3, 4, 5, 6, 7, 8]);
        expect(rendered.totalPages, 'unit 1 teacher book page count').toBeGreaterThan(200);
        const names = orphanNames(rendered.orphans);
        expect(names, `unit 1 day-opening pages without a following box: ${names.join('; ')}`).toEqual([]);
    }, 600_000);
});
