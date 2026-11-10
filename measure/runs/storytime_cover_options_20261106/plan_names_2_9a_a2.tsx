/**
 * Prints the picture file names of the Level 2 Unit 1 build (Task 2.9 part 1 A2, track
 * storytime_cover_options_20261106).
 *
 * The names come from `planQuestBuild` of `dashboard/scripts/storytime/make-storytime-quest-covers.ts`,
 * called with the level 2, the unit 1, the version 1, the picture folder of the repository, and a
 * print-ready root in the scratch folder. It writes nothing and creates no folder.
 *
 * Usage: cd dashboard && npx tsx ../measure/runs/storytime_cover_options_20261106/plan_names_2_9a_a2.tsx
 *
 * It prints one line per planned picture and one line per planned art file, with the counts only.
 * It prints no Thai text and it opens no image.
 */

import { planQuestBuild } from '../../../dashboard/scripts/storytime/make-storytime-quest-covers';

const REPO = '/home/daniebo/Desktop/Workbooks';
const PICTURES_DIR = `${REPO}/content/storytime/l2/print/pictures`;
const PRINT_READY_ROOT = '/tmp/opencode/c29a2/pr';
const OUT_DIR = '/tmp/opencode/c29a2/pr/storytime/covers-quest-v1';

async function main(): Promise<number> {
    const plan = await planQuestBuild({
        level: 2,
        unit: 1,
        version: 1,
        outDir: OUT_DIR,
        printReadyRoot: PRINT_READY_ROOT,
        picturesDir: PICTURES_DIR,
    });
    console.log(`PLAN_ERRORS ${plan.errors.length}`);
    for (const error of plan.errors) console.log(`PLAN_ERROR ${error}`);
    console.log(`PLAN_FILES ${plan.files.length}`);
    console.log(`PLAN_ART_ROWS ${plan.art.length}`);
    for (const row of plan.art) console.log(`ART ${row.kind} ${row.file}`);
    console.log(`PLAN_PICTURE_ROWS ${plan.pictures.length}`);
    for (const row of plan.pictures) console.log(`PICTURE ${row.kind} ${row.file}`);
    return 0;
}

main()
    .then((code) => {
        process.exit(code);
    })
    .catch((error) => {
        console.log(`PROBE_ERROR ${error instanceof Error ? error.name : 'unknown'}`);
        process.exit(1);
    });
