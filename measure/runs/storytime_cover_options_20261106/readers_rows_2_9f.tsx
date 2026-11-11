/**
 * Prints the 14 reader rows of `questReaders()` (Task 2.9 part 5, the C4 text proof).
 *
 * Track storytime_cover_options_20261106. The C4 check needs the page order and the title and the
 * band word of each of the 14 reader pages. This probe prints only 4 fields of each row: `week`,
 * `slug`, `title`, and `litBand`.
 *
 * Thai rule: this role is a non-Claude model and must not see Thai text (PM rule, 2026-11-09). The
 * probe drops every Thai character from each printed value, and it prints the count of the rows
 * that held one.
 *
 * Usage: cd dashboard && npx tsx ../measure/runs/storytime_cover_options_20261106/readers_rows_2_9f.tsx
 *
 * It prints one `READER_ROW` line per row, in the page order of the build, and one `READER_ROW`
 * count line. It opens no PDF and no picture.
 */

import { questReaders } from '../../../dashboard/lib/storytime/print/cover-quest';

const THAI = /[\u0e00-\u0e7f]/g;

function clean(value: string): { text: string; held: boolean } {
    const held = THAI.test(value);
    THAI.lastIndex = 0;
    return { text: value.replace(THAI, ''), held };
}

function main(): number {
    const rows = questReaders();
    let thaiRows = 0;
    rows.forEach((row, index) => {
        const week = clean(String(row.week));
        const slug = clean(row.slug);
        const title = clean(row.title);
        const band = clean(row.litBand);
        if (week.held || slug.held || title.held || band.held) thaiRows += 1;
        console.log(
            `READER_ROW ${index + 1} week=${week.text} slug=${slug.text} title=${title.text} litBand=${band.text}`,
        );
    });
    console.log(`READER_ROW_COUNT ${rows.length}`);
    console.log(`READER_ROW_THAI_ROWS ${thaiRows}`);
    return 0;
}

process.exit(main());
