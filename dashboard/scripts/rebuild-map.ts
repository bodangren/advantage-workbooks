import fs from 'fs';
import path from 'path';
import { REPO_ROOT } from '../lib/lesson-package/files';
import { LEVEL_BOOKS } from '../lib/lesson-package/bank-plan';

/** One kept old article id, with its level. */
export interface KeepGroup {
    level: number;
    keep: string;
}

/** One new package that can take an old id. The id form is `book/lesson`. */
export interface PackageRef {
    level: number;
    id: string;
}

/** The options of one run of the script. */
export interface RebuildMapOptions {
    duplicates: string;
    contentRoot: string;
    outJson: string;
}

/** The result of the option parsing. */
export type RebuildMapParse =
    | { ok: true; options: RebuildMapOptions }
    | { ok: false; message: string; usage: string };

/** The levels of the map. */
export const MAP_LEVELS = [5, 6, 7, 8, 9];

/** One row of `levels`: the counts of a level. */
export interface LevelsRow {
    level: number;
    kept: number;
    packages: number;
    mapped: number;
}

/** One row of `map`: a kept id and the package that takes it. */
export interface MapRow {
    level: number;
    keepId: string;
    package: string;
}

/** One row of `newIds`: a package that gets a new id. */
export interface NewIdRow {
    level: number;
    package: string;
}

/** The map JSON. */
export interface RebuildMapJson {
    source: string;
    levels: LevelsRow[];
    map: MapRow[];
    newIds: NewIdRow[];
}

/** The keep groups of the levels 5 to 9, the default of `--duplicates`. */
const DEFAULT_DUPLICATES = path.join(REPO_ROOT, 'docs/content-plans/data/duplicates-levels-5-9.json');

/** The package folders, the default of `--content-root`. */
const DEFAULT_CONTENT_ROOT = path.join(REPO_ROOT, 'content', 'primary');

/** The JSON output, the default of `--out-json`. */
const DEFAULT_OUT_JSON = path.join(REPO_ROOT, 'docs/content-plans/data/rebuild-map-levels-5-9.json');

/** The `source` string of the map. It holds no absolute path. */
const MAP_SOURCE = 'scripts/rebuild-map.ts (track levels_5_9_20261006), keep ids of docs/content-plans/data/duplicates-levels-5-9.json';

const USAGE = `Builds the rebuild map: the kept old article ids of the levels 5 to 9, each with the new
package that takes its id at the load (track levels_5_9_20261006).

Usage: npx tsx scripts/rebuild-map.ts [options]

  --duplicates <path>    the keep groups (default docs/content-plans/data/duplicates-levels-5-9.json)
  --content-root <path>  the package folders (default content/primary)
  --out-json <path>      the JSON output (default docs/content-plans/data/rebuild-map-levels-5-9.json)

The i-th kept id of a level pairs with the i-th package of that level: the books of
LEVEL_BOOKS[level] in array order, then bank-<level>, and the file-name order inside a
folder. The other packages get new ids.`;

/**
 * Reads the keep groups of a duplicates JSON.
 * @param file The absolute path of the file.
 * @returns The groups in file order; ids and counts only.
 */
function readKeepGroups(file: string): KeepGroup[] {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { groups?: { level?: unknown; keep?: unknown }[] };
    return (raw.groups ?? []).map((group) => ({ level: Number(group.level), keep: String(group.keep) }));
}

/**
 * Lists the packages of the levels 5 to 9 in source order.
 * @param contentRoot The folder that holds the book folders.
 * @returns The packages: workbook books in `LEVEL_BOOKS` order, then the bank, each in file-name order.
 */
function listPackages(contentRoot: string): PackageRef[] {
    const out: PackageRef[] = [];
    for (const level of MAP_LEVELS) {
        for (const book of [...(LEVEL_BOOKS[level] ?? []), `bank-${level}`]) {
            const dir = path.join(contentRoot, book);
            if (!fs.existsSync(dir)) continue;
            const files = fs
                .readdirSync(dir)
                .filter((file) => file.endsWith('.json'))
                .sort();
            for (const file of files) out.push({ level, id: `${book}/${file.replace(/\.json$/, '')}` });
        }
    }
    return out;
}

/**
 * Parses the options of the run.
 * @param argv The command line without the script name.
 * @returns The options, or a message and the usage text.
 */
export function parseRebuildMapArgs(argv: string[]): RebuildMapParse {
    const fail = (message: string): RebuildMapParse => ({ ok: false, message, usage: USAGE });
    const values: Record<string, string> = {};
    const flags = ['--duplicates', '--content-root', '--out-json'];
    for (let i = 0; i < argv.length; i++) {
        const flag = argv[i];
        if (!flags.includes(flag)) return fail(`unknown option: ${flag}`);
        const value = argv[i + 1];
        if (value === undefined || value === '' || value.startsWith('--')) return fail(`missing value for ${flag}`);
        values[flag] = value;
        i++;
    }
    return {
        ok: true,
        options: {
            duplicates: values['--duplicates'] !== undefined ? path.resolve(values['--duplicates']) : DEFAULT_DUPLICATES,
            contentRoot: values['--content-root'] !== undefined ? path.resolve(values['--content-root']) : DEFAULT_CONTENT_ROOT,
            outJson: values['--out-json'] !== undefined ? path.resolve(values['--out-json']) : DEFAULT_OUT_JSON,
        },
    };
}

/**
 * Builds the map from the keep groups and the packages. The function writes nothing.
 * @param groups The kept ids, in the file order of the duplicates JSON.
 * @param packages The packages, in source order per level.
 * @returns The map JSON text and the log lines.
 * @throws When a keep id or a package repeats, a level is unknown, or a level has more keeps than packages.
 */
export function buildRebuildMap(groups: KeepGroup[], packages: PackageRef[]): { content: string; log: string[] } {
    const keepsByLevel = new Map<number, string[]>();
    const seenKeep = new Set<string>();
    for (const group of groups) {
        if (!MAP_LEVELS.includes(group.level)) throw new Error(`unknown level: ${group.level}`);
        if (seenKeep.has(group.keep)) throw new Error(`repeated keep id: ${group.keep}`);
        seenKeep.add(group.keep);
        const list = keepsByLevel.get(group.level) ?? [];
        list.push(group.keep);
        keepsByLevel.set(group.level, list);
    }

    const packagesByLevel = new Map<number, string[]>();
    const seenPackage = new Set<string>();
    for (const ref of packages) {
        if (!MAP_LEVELS.includes(ref.level)) throw new Error(`unknown level: ${ref.level}`);
        if (seenPackage.has(ref.id)) throw new Error(`repeated package: ${ref.id}`);
        seenPackage.add(ref.id);
        const list = packagesByLevel.get(ref.level) ?? [];
        list.push(ref.id);
        packagesByLevel.set(ref.level, list);
    }

    const levels: LevelsRow[] = [];
    const map: MapRow[] = [];
    const newIds: NewIdRow[] = [];
    const log: string[] = [];
    const allLevels = [...new Set([...keepsByLevel.keys(), ...packagesByLevel.keys()])].sort((a, b) => a - b);
    for (const level of allLevels) {
        const keeps = keepsByLevel.get(level) ?? [];
        const levelPackages = packagesByLevel.get(level) ?? [];
        if (levelPackages.length < keeps.length) {
            throw new Error(`level ${level}: ${keeps.length} kept ids, ${levelPackages.length} packages`);
        }
        keeps.forEach((keep, index) => map.push({ level, keepId: keep, package: levelPackages[index] }));
        for (const id of levelPackages.slice(keeps.length)) newIds.push({ level, package: id });
        levels.push({
            level,
            kept: keeps.length,
            packages: levelPackages.length,
            mapped: keeps.length,
        });
        log.push(
            `level ${level}: ${keeps.length} kept ids, ${levelPackages.length} packages, ` +
                `${keeps.length} mapped, ${levelPackages.length - keeps.length} new ids`,
        );
    }
    log.push(`total: ${map.length} kept ids mapped, ${newIds.length} new ids`);

    const body: RebuildMapJson = { source: MAP_SOURCE, levels, map, newIds };
    return { content: `${JSON.stringify(body, null, 1)}\n`, log };
}

/**
 * Runs the script.
 * @param argv The command line without the script name.
 * @returns 0 when the run ends, 2 when the options or the input fail.
 */
export function main(argv: string[]): number {
    const parsed = parseRebuildMapArgs(argv);
    if (!parsed.ok) {
        console.error(parsed.message);
        console.error(parsed.usage);
        return 2;
    }
    const { options } = parsed;
    if (!fs.existsSync(options.duplicates)) {
        console.error(`duplicates file not found: ${options.duplicates}`);
        console.error(USAGE);
        return 2;
    }
    let result: { content: string; log: string[] };
    try {
        result = buildRebuildMap(readKeepGroups(options.duplicates), listPackages(options.contentRoot));
    } catch (e) {
        console.error((e as Error).message);
        console.error(USAGE);
        return 2;
    }
    fs.writeFileSync(options.outJson, result.content);
    for (const line of result.log) console.log(line);
    return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
    process.exitCode = main(process.argv.slice(2));
}
