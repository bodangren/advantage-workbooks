import fs from 'fs';
import path from 'path';
import { REPO_ROOT } from '../lib/lesson-package/files';
import { articleBag as bag, cosine } from '../lib/lesson-package/similarity';

/** One old article of the passages inventory. */
export interface Article {
    id: string;
    raLevel: number;
    title: string;
    type: string;
    genre: string;
    approved: boolean;
    createdAt: string;
    words: number;
    summary: string;
    passage: string;
    use: { progress: number; assignments: number; activityLogs: number };
}

/** The options of one run of the script. */
export interface DedupOptions {
    levels: number[];
    targets: Record<number, number>;
    printedIds: ReadonlySet<string>;
    outJson: string;
    outMd: string;
}

/** The result of the option parsing. */
export type DedupParse =
    | { ok: true; inventory: string; options: DedupOptions }
    | { ok: false; message: string; usage: string };

/** Articles a level should have in total (printed + workbook + bank). */
export const LEVEL_TARGETS: Record<number, number> = { 1: 50, 2: 50, 3: 100, 4: 50 };

/** The level list whose output keeps today's text word for word. */
const LEVELS_ONE_TO_FOUR = [1, 2, 3, 4];

/** The printed articles of the levels 1 to 4, the default of `--printed`. */
const DEFAULT_PRINTED_FILE = path.join(REPO_ROOT, 'docs/content-plans/data/legacy-levels-1-4-2026-10-02.json');

/** The JSON output of the levels 1 to 4 run, the default of `--out-json`. */
const DEFAULT_OUT_JSON = path.join(REPO_ROOT, 'docs/content-plans/data/duplicates-levels-1-4.json');

/** The Markdown output of the levels 1 to 4 run, the default of `--out-md`. */
const DEFAULT_OUT_MD = path.join(REPO_ROOT, 'docs/content-plans/level-plans/duplicates.md');

/** The cosine at which two articles are duplicates of each other. The levels 1 to 4 run merged at 0.50. */
const DUPLICATE_SIMILARITY = 0.5;

const USAGE = `Groups similar old online articles per level and keeps the best one of each group
(track level_banks_20261002; the levels 5-9 run is track levels_5_9_20261006).

Usage: npx tsx scripts/plan-dedup.ts --inventory <inventory.json> [options]

  --inventory <path>  the passages inventory of scripts/inventory-legacy.ts (required)
  --levels <list>     the levels of the run, a comma-separated list (default 1,2,3,4)
  --targets <l=n,..>  one target for each level of --levels (default 1=50,2=50,3=100,4=50)
  --printed <path>    the printed articles of the levels (default: the levels 1-4 file)
  --out-json <path>   the JSON output (default docs/content-plans/data/duplicates-levels-1-4.json)
  --out-md <path>     the Markdown output (default docs/content-plans/level-plans/duplicates.md)

<inventory.json> is the output of scripts/inventory-legacy.ts --out (with the passages).
Daniel (2026-10-02): "Keep information about all duplicates, but delete all but the best and
rebuild that. ... The levels with two books need about 100 and the levels with one book need
about 50." Level 3 has two books (Origins 3.1 and 3.2); levels 1, 2, and 4 have one.

Every given path resolves against the working directory. The defaults are absolute paths of the
repository root. The levels 1-4 run writes the same 2 files as today.`;

/** Use first (student history), then approved, then the newest. */
function better(a: Article, b: Article): number {
    const studentUse = (x: Article) => x.use.progress + x.use.assignments + x.use.activityLogs;
    return studentUse(b) - studentUse(a) || Number(b.approved) - Number(a.approved) || b.createdAt.localeCompare(a.createdAt);
}

/**
 * Average-link clustering until `k` groups are left.
 * @param items The articles.
 * @param sim The similarity of two articles (0–1).
 * @param k The number of groups to keep.
 * @returns Groups of indexes, and the similarity at which each merge happened.
 */
function cluster(n: number, sim: (i: number, j: number) => number, k: number): { groups: number[][]; mergedAt: number[] } {
    let groups = Array.from({ length: n }, (_, i) => [i]);
    const mergedAt: number[] = [];
    const s = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : sim(i, j))));
    const link = (g: number[], h: number[]) => g.reduce((t, i) => t + h.reduce((u, j) => u + s[i][j], 0), 0) / (g.length * h.length);
    while (groups.length > k) {
        let best = -1;
        let bi = 0;
        let bj = 1;
        for (let i = 0; i < groups.length; i++) {
            for (let j = i + 1; j < groups.length; j++) {
                const l = link(groups[i], groups[j]);
                if (l > best) [best, bi, bj] = [l, i, j];
            }
        }
        mergedAt.push(best);
        groups = [...groups.filter((_, i) => i !== bi && i !== bj), [...groups[bi], ...groups[bj]]];
    }
    return { groups, mergedAt };
}

/** True when the level list is the levels 1 to 4. */
function isLevelsOneToFour(levels: number[]): boolean {
    return levels.length === LEVELS_ONE_TO_FOUR.length && levels.every((level, i) => level === LEVELS_ONE_TO_FOUR[i]);
}

/** The display form of an absolute path: the repository-relative form inside the repository, else the file name. */
export function displayPath(absolute: string): string {
    const relative = path.relative(REPO_ROOT, absolute);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) return relative.split(path.sep).join('/');
    return path.basename(absolute);
}

/** The level names of the heading: a range for consecutive levels, else the list. */
function levelRange(levels: number[]): string {
    const consecutive = levels.every((level, i) => i === 0 || level === levels[i - 1] + 1);
    return consecutive ? `${levels[0]}–${levels[levels.length - 1]}` : levels.join(', ');
}

/** The ids of the printed articles of a printed file. */
function readPrintedIds(file: string): Set<string> {
    const meta = JSON.parse(fs.readFileSync(file, 'utf8')) as { articles: { id: string; printed: boolean }[] };
    return new Set(meta.articles.filter((a) => a.printed).map((a) => a.id));
}

/** The levels of a `--levels` value, or null when a level is not a number. */
function parseLevels(value: string): number[] | null {
    const parts = value.split(',').map((part) => part.trim());
    if (!parts.length || parts.some((part) => !/^\d+$/.test(part) || Number(part) < 1)) return null;
    return parts.map((part) => Number(part));
}

/** The targets of a `--targets` value, or null when a target is not a number. */
function parseTargets(value: string): Record<number, number> | null {
    const targets: Record<number, number> = {};
    for (const part of value.split(',')) {
        const [level, count] = part.split('=');
        if (!/^\d+$/.test(level ?? '') || !/^\d+$/.test(count ?? '')) return null;
        targets[Number(level)] = Number(count);
    }
    return targets;
}

/**
 * Parses the options of the run.
 * @param argv The command line without the script name.
 * @returns The inventory path and the options, or a message and the usage text.
 */
export function parseDedupArgs(argv: string[]): DedupParse {
    const fail = (message: string): DedupParse => ({ ok: false, message, usage: USAGE });
    const values: Record<string, string> = {};
    const flags = ['--inventory', '--levels', '--targets', '--printed', '--out-json', '--out-md'];
    for (let i = 0; i < argv.length; i++) {
        const flag = argv[i];
        if (!flags.includes(flag)) return fail(`unknown option: ${flag}`);
        const value = argv[i + 1];
        if (value === undefined || value === '' || value.startsWith('--')) return fail(`missing value for ${flag}`);
        values[flag] = value;
        i++;
    }

    const levelsGiven = values['--levels'] !== undefined;
    const targetsGiven = values['--targets'] !== undefined;
    if (levelsGiven && !targetsGiven) return fail('--targets is required with --levels');
    if (targetsGiven && !levelsGiven) return fail('--levels is required with --targets');

    const levels = levelsGiven ? parseLevels(values['--levels']) : [...LEVELS_ONE_TO_FOUR];
    if (!levels) return fail(`--levels needs a comma-separated list of level numbers: ${values['--levels']}`);
    const targets = targetsGiven ? parseTargets(values['--targets']) : { ...LEVEL_TARGETS };
    if (!targets) return fail(`--targets needs a comma-separated list of level=target pairs: ${values['--targets']}`);
    for (const level of Object.keys(targets)) {
        if (!levels.includes(Number(level))) return fail(`target for a level outside --levels: ${level}`);
    }
    for (const level of levels) {
        if (targets[level] === undefined) return fail(`no target for level ${level}`);
    }

    let printedIds = new Set<string>();
    if (values['--printed'] !== undefined) {
        const printed = path.resolve(values['--printed']);
        if (!fs.existsSync(printed)) return fail(`printed file not found: ${values['--printed']}`);
        printedIds = readPrintedIds(printed);
    } else if (isLevelsOneToFour(levels)) {
        printedIds = readPrintedIds(DEFAULT_PRINTED_FILE);
    }

    const options: DedupOptions = {
        levels,
        targets,
        printedIds,
        outJson: values['--out-json'] !== undefined ? path.resolve(values['--out-json']) : DEFAULT_OUT_JSON,
        outMd: values['--out-md'] !== undefined ? path.resolve(values['--out-md']) : DEFAULT_OUT_MD,
    };
    return { ok: true, inventory: path.resolve(values['--inventory']), options };
}

/**
 * The groups of the online articles of one level. The duplicate pairs come first; the rest merge
 * down to the keep count the levels 1 to 4 way.
 * @param items The online articles of the level.
 * @param keepCount The number of groups to keep.
 * @returns The groups of indexes, and the similarity at which each merge happened.
 */
function planLevelGroups(items: Article[], keepCount: number): { groups: number[][]; mergedAt: number[] } {
    const n = items.length;
    if (keepCount <= 0) return { groups: [], mergedAt: [] };
    const bags = items.map(bag);
    const sim: number[][] = items.map((_, i) => items.map((__, j) => (i === j ? 0 : cosine(bags[i], bags[j]))));

    const candidates: { i: number; j: number; s: number }[] = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) candidates.push({ i, j, s: sim[i][j] });
    }
    candidates.sort((a, b) => b.s - a.s || a.i - b.i || a.j - b.j);

    const groups: number[][] = items.map((_, i) => [i]);
    const groupOf = new Map<number, number>();
    for (let i = 0; i < n; i++) groupOf.set(i, i);
    const taken = new Set<number>();
    const mergedAt: number[] = [];
    for (const candidate of candidates) {
        if (candidate.s < DUPLICATE_SIMILARITY) break;
        if (taken.has(candidate.i) || taken.has(candidate.j)) continue;
        taken.add(candidate.i);
        taken.add(candidate.j);
        const gi = groupOf.get(candidate.i) as number;
        const gj = groupOf.get(candidate.j) as number;
        groups[gi] = groups[gi].concat(groups[gj]);
        groups[gj] = [];
        for (const member of groups[gi]) groupOf.set(member, gi);
        mergedAt.push(candidate.s);
    }

    let kept = groups.filter((group) => group.length > 0);
    if (kept.length > keepCount) {
        const groupSim = (a: number[], b: number[]): number => {
            let sum = 0;
            for (const x of a) for (const y of b) sum += sim[x][y];
            return sum / (a.length * b.length);
        };
        const merged = cluster(kept.length, (i, j) => groupSim(kept[i], kept[j]), keepCount);
        kept = merged.groups.map((group) => group.flatMap((index) => kept[index]));
        mergedAt.push(...merged.mergedAt);
    }
    return { groups: kept, mergedAt };
}

/**
 * Plans the two output files of the run. The function writes nothing.
 * @param inv The inventory of the run.
 * @param options The options of the run.
 * @returns The two files and the log lines of the run.
 */
export function planDedup(
    inv: { readAt: string; articles: Article[] },
    options: DedupOptions,
): { files: { path: string; content: string }[]; log: string[] } {
    const oneToFour = isLevelsOneToFour(options.levels);
    const out: Record<string, unknown>[] = [];
    const log: string[] = [];
    const md: string[] = oneToFour
        ? [
            '# Levels 1–4: old online articles, grouped',
            '',
            'Generated by `dashboard/scripts/plan-dedup.ts` (track level_banks_20261002) from the read-only production inventory of ' + inv.readAt + '. Daniel (2026-10-02): keep the information on every duplicate, delete all but the best, and rebuild the best. Targets: about 100 articles at level 3 (two books), about 50 at levels 1, 2, and 4.',
            '',
            'In each group, **keep** is the best article (most student use, then approved, then newest). It gets new text from the level plan. The others are deleted after Daniel approves the level bank (backup first). Their title, summary, and passage stay in `data/duplicates-levels-1-4.json`.',
            '',
        ]
        : [
            `# Levels ${levelRange(options.levels)}: old online articles, grouped`,
            '',
            `Generated by \`dashboard/scripts/plan-dedup.ts\` (track levels_5_9_20261006) from the read-only passages inventory of ${inv.readAt}.`,
            '',
            `Provisional grouping for Daniel's level review. The level targets count the ${options.levels.reduce((total, level) => total + (options.targets[level] ?? 0), 0)} new packages. Daniel decides for each kept old article: rebuild (same id) or delete. Targets: ${options.levels.map((level) => `level ${level} = ${options.targets[level] ?? 0}`).join(', ')}.`,
            '',
            `In each group, **keep** is the best article (most student use, then approved, then newest). The others are similar to it. Their title, summary, and passage stay in \`${displayPath(options.outJson)}\`.`,
            '',
        ];

    for (const level of options.levels) {
        const all = inv.articles.filter((a) => a.raLevel === level);
        const online = all.filter((a) => !options.printedIds.has(a.id));
        const printedCount = all.length - online.length;
        const target = options.targets[level] ?? 0;
        const keepCount = Math.max(0, Math.min(online.length, target - printedCount));
        const bags = online.map(bag);
        const planned = keepCount === 0
            ? { groups: [], mergedAt: [] }
            : oneToFour
                ? cluster(online.length, (i, j) => cosine(bags[i], bags[j]), keepCount)
                : planLevelGroups(online, keepCount);
        const sorted = planned.groups
            .map((g) => g.map((i) => online[i]).sort(better))
            .sort((a, b) => b.length - a.length || a[0].title.localeCompare(b[0].title));
        const merged = sorted.filter((g) => g.length > 1);
        const similar = sorted.reduce((total, g) => total + g.length - 1, 0);
        const lowest = planned.mergedAt.length ? Math.min(...planned.mergedAt) : 1;
        let line: string;
        if (oneToFour) {
            line = `${all.length} articles: ${printedCount} printed, ${online.length} online. Keep ${keepCount} online articles (target ${target} in total with the printed ones); delete ${online.length - keepCount}. ${merged.length} groups have more than one article; the weakest merge had similarity ${lowest.toFixed(2)}.`;
        } else if (printedCount >= target) {
            line = `${all.length} articles: ${printedCount} printed, ${online.length} online. Keep 0 online articles; the printed articles already meet the target.`;
        } else if (!merged.length) {
            line = `${all.length} articles: ${printedCount} printed, ${online.length} online. Keep all ${online.length} online articles; none is similar to another.`;
        } else {
            line = `${all.length} articles: ${printedCount} printed, ${online.length} online. Keep ${sorted.length} online articles; ${similar} are similar to a kept one. ${merged.length} groups have more than one article; the weakest merge had similarity ${lowest.toFixed(2)}.`;
        }
        md.push(`## Level ${level}`, '', line, '');
        if (merged.length) {
            md.push(oneToFour ? '| Keep | Delete (similar) |' : '| Keep | Similar |', '|---|---|');
            for (const g of merged) md.push(`| ${g[0].title} (\`${g[0].id}\`) | ${g.slice(1).map((a) => `${a.title} (\`${a.id}\`)`).join('; ')} |`);
            md.push('');
        }
        for (const g of sorted) {
            out.push({
                level,
                keep: g[0].id,
                articles: g.map((a) => ({ id: a.id, title: a.title, type: a.type, genre: a.genre, approved: a.approved, createdAt: a.createdAt, words: a.words, use: a.use, summary: a.summary, passage: a.passage })),
            });
        }
        if (oneToFour) {
            log.push(`level ${level}: ${online.length} online → keep ${keepCount}, delete ${online.length - keepCount} (${merged.length} groups of 2+; weakest merge ${lowest.toFixed(2)})`);
        } else {
            log.push(`level ${level}: ${online.length} online → keep ${sorted.length}, ${similar} similar (${merged.length} groups of 2+; weakest merge ${lowest.toFixed(2)})`);
        }
    }

    const json = `${JSON.stringify({ source: `scripts/plan-dedup.ts, inventory of ${inv.readAt}`, targets: options.targets, groups: out }, null, 1)}\n`;
    return {
        files: [
            { path: options.outJson, content: json },
            { path: options.outMd, content: `${md.join('\n')}\n` },
        ],
        log,
    };
}

/**
 * Runs the script.
 * @param argv The command line without the script name.
 * @returns 0 when the run ends, 2 when the options fail.
 */
export function main(argv: string[]): number {
    const parsed = parseDedupArgs(argv);
    if (!parsed.ok) {
        console.error(parsed.message);
        console.error(parsed.usage);
        return 2;
    }
    const raw = JSON.parse(fs.readFileSync(parsed.inventory, 'utf8')) as { readAt?: string; articles?: Article[] };
    const inv = { readAt: raw.readAt || displayPath(parsed.inventory), articles: raw.articles ?? [] };
    const { files, log } = planDedup(inv, parsed.options);
    for (const file of files) fs.writeFileSync(file.path, file.content);
    for (const line of log) console.log(line);
    return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
    process.exitCode = main(process.argv.slice(2));
}
