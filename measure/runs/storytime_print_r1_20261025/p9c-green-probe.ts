// The P9-C Green probe: the sentence-dot distance and the dot gap of every match row of the four
// review-more pages, read from the rendered page in mm (as the Red case P9C-dot and P9C-gap).
// It prints numbers only, so it prints no Thai string.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { STORYTIME_ROOT, storytimeWeekFile } from '../../../dashboard/lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../../../dashboard/lib/storytime/schema';
import { STORYTIME_PRINT_PROFILE } from '../../../dashboard/lib/storytime/print/profile';
import { compileStorytimeStudentBook } from '../../../dashboard/lib/storytime/print/student-book';

const PAGES = [134, 136, 138, 140];

function week(n: number): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, n), 'utf8')));
}

async function main(): Promise<void> {
    const html = compileStorytimeStudentBook([1, 2, 3, 4, 5, 6, 7, 8].map(week), { profile: STORYTIME_PRINT_PROFILE, mode: 'final' }).html;
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-p9c-probe-'));
    const file = path.join(folder, 'student.html');
    fs.writeFileSync(file, html);
    const repoRoot = path.resolve(STORYTIME_ROOT, '..', '..');
    const nodeRequire = createRequire(path.join(repoRoot, 'dashboard', 'package.json'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { chromium } = nodeRequire('@playwright/test') as any;
    const browser = await chromium.launch({ channel: 'chrome', timeout: 60_000 });
    try {
        const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
        await page.goto(pathToFileURL(file).href);
        await page.evaluate(() => document.fonts.ready);
        const rows = await page.evaluate((pageNumbers) => {
            const MM = 25.4 / 96;
            const found: { page: number; row: number; dot: number; gap: number; boxGap: number }[] = [];
            for (const number of pageNumbers) {
                const section = document.querySelector(`[data-page-number="${number}"]`);
                if (!section) continue;
                Array.from(section.querySelectorAll('[data-part="more-row"]')).forEach((row, index) => {
                    const text = row.querySelector('[data-part="more-text"]');
                    const sentenceDot = row.querySelector(':scope > [data-part="more-dot"]');
                    const picture = row.querySelector('[data-part="more-pic"]');
                    const pictureDot = picture?.querySelector(':scope > [data-part="more-dot"]');
                    const box = picture?.querySelector('.picture-box');
                    if (!text || !sentenceDot || !pictureDot || !box) return;
                    const range = document.createRange();
                    range.selectNodeContents(text);
                    found.push({
                        page: number,
                        row: index + 1,
                        dot: (sentenceDot.getBoundingClientRect().left - range.getBoundingClientRect().right) * MM,
                        gap: (pictureDot.getBoundingClientRect().left - sentenceDot.getBoundingClientRect().right) * MM,
                        boxGap: (box.getBoundingClientRect().left - pictureDot.getBoundingClientRect().right) * MM,
                    });
                });
            }
            return found;
        }, PAGES);
        for (const row of rows) {
            console.log(`page ${row.page}, row ${row.row}: dot ${row.dot.toFixed(2)} mm, gap ${row.gap.toFixed(2)} mm, box gap ${row.boxGap.toFixed(2)} mm`);
        }
        for (const number of PAGES) {
            const page = rows.filter((row) => row.page === number);
            const dots = page.map((row) => row.dot);
            const gaps = page.map((row) => row.gap);
            console.log(`page ${number}: dot min ${Math.min(...dots).toFixed(2)} max ${Math.max(...dots).toFixed(2)} mm; gap min ${Math.min(...gaps).toFixed(2)} max ${Math.max(...gaps).toFixed(2)} mm`);
        }
        const allDots = rows.map((row) => row.dot);
        const allGaps = rows.map((row) => row.gap);
        const allBox = rows.map((row) => row.boxGap);
        console.log(`all 16 rows: dot min ${Math.min(...allDots).toFixed(2)} max ${Math.max(...allDots).toFixed(2)} mm; gap min ${Math.min(...allGaps).toFixed(2)} max ${Math.max(...allGaps).toFixed(2)} mm; box gap min ${Math.min(...allBox).toFixed(2)} max ${Math.max(...allBox).toFixed(2)} mm`);
    } finally {
        await browser.close();
        fs.rmSync(folder, { recursive: true, force: true });
    }
}

void main();
