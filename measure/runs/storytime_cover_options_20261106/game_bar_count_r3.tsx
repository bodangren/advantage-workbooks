/**
 * Counts the game bar elements of the two quest fronts (Task 2.9 part 1 r3, track
 * storytime_cover_options_20261106).
 *
 * The build writes its HTML into a temp folder that it deletes, so the count comes from a fresh
 * render of the two fronts with `renderQuestCover` of `dashboard/lib/storytime/print/cover-quest.ts`.
 *
 * Usage: npx tsx measure/runs/storytime_cover_options_20261106/game_bar_count_r3.tsx <pictures dir>
 *
 * It prints one line per front with the count of the elements `data-part="game-bar"`, and one line
 * with the count of the title plaque elements. It prints no Thai text.
 */

import { pathToFileURL } from 'node:url';
import path from 'node:path';

import { loadQuestCovers, renderQuestCover } from '../../../dashboard/lib/storytime/print/cover-quest';

const LEVEL = 2;
const UNIT = 1;

function main(argv: string[]): number {
    const picturesDir = argv[0] ?? '/tmp/opencode/c29r2/pictures';
    const book = loadQuestCovers().books.find((row) => row.level === LEVEL && row.unit === UNIT);
    if (!book) {
        console.log('GAME_BAR_COUNT error=no_book_row');
        return 1;
    }
    const kinds = [
        { kind: 'student-front' as const, art: book.art.studentFront },
        { kind: 'teacher-front' as const, art: book.art.teacherFront },
    ];
    let ok = true;
    for (const entry of kinds) {
        const assets = { art: pathToFileURL(path.join(picturesDir, entry.art)).href };
        const html = renderQuestCover(entry.kind, book, assets, { bleedMm: 0 });
        const bars = html.match(/data-part="game-bar"/g) ?? [];
        const plaques = html.match(/data-part="title-plaque"/g) ?? [];
        const bands = html.match(/data-part="band-icon"/g) ?? [];
        if (bars.length !== 0) ok = false;
        console.log(
            `GAME_BAR_COUNT kind=${entry.kind} game_bar_elements=${bars.length} title_plaque_elements=${plaques.length} band_icon_elements=${bands.length}`,
        );
    }
    console.log(`GAME_BAR_COUNT_ALL_ZERO=${ok ? 1 : 0}`);
    return ok ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
