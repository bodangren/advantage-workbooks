/**
 * Counts the top chrome parts of the 4 quest sides with the top style 'hlogo' (Task 2.9 part 1 A2,
 * track storytime_cover_options_20261106).
 *
 * The alternate A2 of 2026-11-10 puts the horizontal logo on its amber tile as the only top chrome.
 * This script renders the 2 fronts and the 2 backs with `renderQuestCover` of
 * `dashboard/lib/storytime/print/cover-quest.ts` and the option `top: 'hlogo'`, and it counts the
 * parts `game-bar`, `series-banner`, `series-logo`, `logo-box`, and `logo-tile` of each side.
 *
 * Usage: cd dashboard && npx tsx ../measure/runs/storytime_cover_options_20261106/hlogo_parts_count_2_9a_a2.tsx [pictures dir]
 *
 * It prints one line per side with the counts, and one line with the verdict. It prints no Thai
 * text and it opens no image.
 */

import { pathToFileURL } from 'node:url';
import path from 'node:path';

import { loadQuestCovers, renderQuestCover } from '../../../dashboard/lib/storytime/print/cover-quest';

const LEVEL = 2;
const UNIT = 1;
const PARTS = ['game-bar', 'series-banner', 'series-logo', 'logo-box', 'logo-tile'];

function countPart(html: string, part: string): number {
    const pattern = new RegExp(`data-part="${part}"`, 'g');
    return (html.match(pattern) ?? []).length;
}

function main(argv: string[]): number {
    const picturesDir = argv[0] ?? '/tmp/opencode/c29a2/pictures';
    const book = loadQuestCovers().books.find((row) => row.level === LEVEL && row.unit === UNIT);
    if (!book) {
        console.log('HLOGO_PARTS error=no_book_row');
        return 1;
    }
    const kinds = [
        { kind: 'student-front' as const, art: book.art.studentFront },
        { kind: 'student-back' as const, art: book.art.back },
        { kind: 'teacher-front' as const, art: book.art.teacherFront },
        { kind: 'teacher-back' as const, art: book.art.back },
    ];
    let ok = true;
    for (const entry of kinds) {
        const assets = { art: pathToFileURL(path.join(picturesDir, entry.art)).href };
        const html = renderQuestCover(entry.kind, book, assets, { bleedMm: 0, top: 'hlogo' });
        const counts = PARTS.map((part) => `${part}=${countPart(html, part)}`);
        const values = PARTS.map((part) => countPart(html, part));
        const sideOk = values[0] === 0 && values[1] === 0 && values[2] === 0 && values[3] === 0 && values[4] === 1;
        if (!sideOk) ok = false;
        console.log(`HLOGO_PARTS kind=${entry.kind} ${counts.join(' ')}`);
    }
    console.log(`HLOGO_PARTS_ALL_OK=${ok ? 1 : 0}`);
    return ok ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
