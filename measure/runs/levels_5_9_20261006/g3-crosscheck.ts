/**
 * Task 1.G3 part 1 (track levels_5_9_20261006): the read-only cross-check of the levels 5-9
 * articles between the legacy Primary database and the monorepo Primary database.
 *
 * This file is a run tool of the track, not production code.
 *
 * Monorepo schema, read only (this tool never writes to that database):
 * - Table `articles`: `packages/db/src/schema/content.ts`, line 8
 *   (`export const articles = pgTable("articles", {`).
 *   Columns used here: `title` (line 10), `summary` (line 12), `level` (line 13),
 *   `passage` (line 22). `ra_level` (line 26) holds the same legacy value: the ETL writes the
 *   legacy `ra_level` into both `level` and `ra_level`
 *   (`packages/db/src/migrations-data/primary-legacy-import.ts`, lines 289 and 301).
 * - Table `primary_legacy_id_map`: `packages/db/src/schema/primary.ts`, line 249
 *   (`"primary_legacy_id_map",`). Columns used here: `table_name` (line 251),
 *   `legacy_id` (line 252), `new_id` (line 253). The `article` rows hold the legacy cuid in
 *   `legacy_id` and the monorepo `articles.id` in `new_id`.
 *
 * Usage, from `dashboard/`:
 *   npx tsx ../measure/runs/levels_5_9_20261006/g3-crosscheck.ts \
 *     --inventory <passages inventory json> --out <crosscheck json> --report <crosscheck txt>
 *
 * The database URL comes from `MONOREPO_DATABASE_URL`. The tool never prints it.
 * Reads only: `SET default_transaction_read_only = on`, `BEGIN READ ONLY`, `ROLLBACK`
 * (`scripts/inventory-legacy.ts` follows the same form). Every query passes `isReadOnlySql`.
 *
 * Outputs:
 * - the crosscheck JSON: the counts on both sides, the ids that exist on one side only, and the
 *   monorepo text of every id whose text differs;
 * - a merged passages inventory next to the crosscheck JSON, named `<out without .json>-merged.json`:
 *   a differing id takes the monorepo `title`, `summary`, and `passage`, and its `words` count is
 *   recomputed from the new passage (the PM rule of 2026-11-19: a differing id uses the monorepo text);
 * - the report: counts and ids only, with the differing field names. No passage text, no URL.
 *
 * A trimmed string compare decides a difference: `null` and `""` count as equal.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { isReadOnlySql } from '../../../dashboard/lib/inject/legacy-sample.js';

const USAGE = `Cross-checks the levels 5-9 articles of a passages inventory against the monorepo Primary database.

Usage: npx tsx ../measure/runs/levels_5_9_20261006/g3-crosscheck.ts \\
  --inventory <passages inventory json> --out <crosscheck json> --report <crosscheck txt>

Reads only: one READ ONLY transaction, rolled back. The monorepo URL comes from
MONOREPO_DATABASE_URL and is never printed. Writes the crosscheck JSON, the merged passages
inventory, and the report.`;

/** The levels of this track's grouping run. */
const LEVELS = [5, 6, 7, 8, 9];

/** The monorepo table and the map table, named as the schema files name them. */
const ARTICLES_TABLE = 'articles';
const MAP_TABLE = 'primary_legacy_id_map';

/** One article of the passages inventory (the subset this tool reads and rewrites). */
interface InventoryArticle {
    id: string;
    raLevel: number;
    title: string;
    summary?: string | null;
    passage?: string | null;
    words?: number;
    [key: string]: unknown;
}

/** The passages inventory file of `scripts/inventory-legacy.ts`. */
interface Inventory {
    readAt?: string;
    levels?: number[];
    articles: InventoryArticle[];
    [key: string]: unknown;
}

/** One monorepo article as the cross-check reads it. */
interface MonorepoRow {
    legacy_id: string;
    title: string | null;
    summary: string | null;
    passage: string | null;
    level: number | null;
}

/** The part of the `pg` client that this tool uses. */
interface PgClient {
    connect(): Promise<void>;
    query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
    end(): Promise<void>;
}

/**
 * Loads `pg` from the dashboard `node_modules`. A bare `pg` import cannot resolve from
 * `measure/`, because `dashboard/node_modules` is not a parent folder of this file.
 * @returns The client class of `pg`.
 */
function loadPgClient(): new (config: { connectionString: string }) => PgClient {
    const dashboard = path.join(path.dirname(path.resolve(process.argv[1] ?? '.')), '../../../dashboard');
    const require = createRequire(path.join(dashboard, 'package.json'));
    return (require('pg') as { Client: new (config: { connectionString: string }) => PgClient }).Client;
}

/** The three text fields the cross-check compares. */
const TEXT_FIELDS = ['title', 'summary', 'passage'] as const;
type TextField = (typeof TEXT_FIELDS)[number];

/** One id whose text differs, with the monorepo text and the names of the differing fields. */
interface Differing {
    id: string;
    fields: TextField[];
    monorepo: { title: string; summary: string; passage: string; level: number | null };
}

/**
 * Normalizes a text value for the compare: `null` and `""` are equal, and both sides are trimmed.
 * @param value The column value, which may be null.
 * @returns The trimmed text, or an empty string.
 */
function norm(value: string | null | undefined): string {
    return (value ?? '').trim();
}

/**
 * Counts the words of a passage with the rule of `scripts/inventory-legacy.ts`.
 * @param passage The passage text.
 * @returns The word count.
 */
function wordCount(passage: string | null | undefined): number {
    return (norm(passage).match(/[A-Za-z']+/g) ?? []).length;
}

/**
 * Parses the options of the run.
 * @param argv The command line without the script name.
 * @returns The three paths, or null after printing the reason and the usage.
 */
function parseArgs(argv: string[]): { inventory: string; out: string; report: string } | null {
    const values: Record<string, string> = {};
    for (let i = 0; i < argv.length; i++) {
        const flag = argv[i];
        if (!['--inventory', '--out', '--report'].includes(flag)) {
            console.error(`unknown option: ${flag}`);
            console.error(USAGE);
            return null;
        }
        const value = argv[i + 1];
        if (value === undefined || value === '') {
            console.error(`missing value for ${flag}`);
            console.error(USAGE);
            return null;
        }
        values[flag] = value;
        i++;
    }
    for (const flag of ['--inventory', '--out', '--report']) {
        if (values[flag] === undefined) {
            console.error(`missing option: ${flag}`);
            console.error(USAGE);
            return null;
        }
    }
    return {
        inventory: path.resolve(values['--inventory']),
        out: path.resolve(values['--out']),
        report: path.resolve(values['--report']),
    };
}

/**
 * Runs the cross-check.
 * @param inv The passages inventory.
 * @param rows The monorepo rows of the inventory ids, through `primary_legacy_id_map`.
 * @param monorepoIds The level 5-9 legacy ids that the monorepo holds.
 * @param names The basenames of the inventory file and the merged file (no absolute path is written).
 * @returns The report, the crosscheck JSON, and the merged inventory content.
 */
function crossCheck(
    inv: Inventory,
    rows: MonorepoRow[],
    monorepoIds: string[],
    names: { inventory: string; merged: string },
): { report: string; json: string; merged: string; counts: Record<string, number> } {
    const articles = inv.articles.filter((a) => LEVELS.includes(Number(a.raLevel)));
    const byId = new Map<string, InventoryArticle>();
    for (const a of articles) if (!byId.has(a.id)) byId.set(a.id, a);
    const mapped = new Map<string, MonorepoRow>();
    for (const r of rows) mapped.set(r.legacy_id, r);

    const legacyOnly = [...byId.keys()].filter((id) => !mapped.has(id)).sort();
    const monorepoOnly = monorepoIds.filter((id) => !byId.has(id)).sort();

    const differing: Differing[] = [];
    for (const [id, a] of byId) {
        const r = mapped.get(id);
        if (!r) continue;
        const fields = TEXT_FIELDS.filter((f) => norm(a[f]) !== norm(r[f]));
        if (!fields.length) continue;
        differing.push({
            id,
            fields,
            monorepo: { title: r.title ?? '', summary: r.summary ?? '', passage: r.passage ?? '', level: r.level },
        });
    }
    differing.sort((a, b) => a.id.localeCompare(b.id));

    const counts = {
        inventory: byId.size,
        monorepo: monorepoIds.length,
        matched: byId.size - legacyOnly.length,
        legacyOnly: legacyOnly.length,
        monorepoOnly: monorepoOnly.length,
        differing: differing.length,
    };

    const differingById = new Map(differing.map((d) => [d.id, d]));
    const merged: Inventory = {
        ...inv,
        articles: inv.articles.map((a) => {
            const d = differingById.get(a.id);
            if (!d) return a;
            return { ...a, title: d.monorepo.title, summary: d.monorepo.summary, passage: d.monorepo.passage, words: wordCount(d.monorepo.passage) };
        }),
    };

    const json = `${JSON.stringify(
        {
            generatedAt: new Date().toISOString(),
            levels: LEVELS,
            source: { inventory: path.basename(names.inventory), monorepoTable: ARTICLES_TABLE, monorepoMap: MAP_TABLE },
            counts,
            legacyOnly,
            monorepoOnly,
            differing,
            mergedInventory: path.basename(names.merged),
        },
        null,
        2,
    )}\n`;

    const lines = [
        'G3 cross-check: levels 5-9, read only, rolled back',
        `inventory: ${counts.inventory} articles at levels ${LEVELS.join(', ')}`,
        `monorepo: ${counts.monorepo} articles at levels ${LEVELS.join(', ')} through ${MAP_TABLE} (table_name 'article')`,
        `in both: ${counts.matched}`,
        '',
        `legacy only (${counts.legacyOnly}):`,
        ...legacyOnly.map((id) => `  ${id}`),
        '',
        `monorepo only (${counts.monorepoOnly}):`,
        ...monorepoOnly.map((id) => `  ${id}`),
        '',
        `differing text (${counts.differing}):`,
        ...differing.map((d) => `  ${d.id}  ${d.fields.join(', ')}`),
        '',
    ];
    return { report: `${lines.join('\n')}`, json, merged: `${JSON.stringify(merged, null, 2)}\n`, counts };
}

/**
 * The merged inventory path of a crosscheck output path.
 * @param out The `--out` path.
 * @returns The path without `.json`, then `-merged.json`.
 */
function mergedPathFor(out: string): string {
    const base = out.toLowerCase().endsWith('.json') ? out.slice(0, -5) : out;
    return `${base}-merged.json`;
}

/**
 * Runs the queries and writes the files.
 * @param inventoryPath The `--inventory` path.
 * @param outPath The `--out` path.
 * @param reportPath The `--report` path.
 * @param url The monorepo database URL.
 * @returns 0 on success, 1 on a query or connection error.
 */
async function run(inventoryPath: string, outPath: string, reportPath: string, url: string): Promise<number> {
    const inv = JSON.parse(fs.readFileSync(inventoryPath, 'utf8')) as Inventory;
    if (!Array.isArray(inv.articles)) throw new Error('the inventory holds no articles array');
    const ids = [...new Set(inv.articles.filter((a) => LEVELS.includes(Number(a.raLevel))).map((a) => a.id))];

    const rowsSql = `select m.legacy_id, a.title, a.summary, a.passage, a.level
        from ${MAP_TABLE} m join ${ARTICLES_TABLE} a on a.id = m.new_id
        where m.table_name = 'article' and m.legacy_id = any($1::text[])`;
    const idsSql = `select m.legacy_id
        from ${MAP_TABLE} m join ${ARTICLES_TABLE} a on a.id = m.new_id
        where m.table_name = 'article' and a.level between $1 and $2`;
    for (const sql of [rowsSql, idsSql]) if (!isReadOnlySql(sql)) throw new Error('query is not read-only');

    const client = new (loadPgClient())({ connectionString: url });
    await client.connect();
    let result: ReturnType<typeof crossCheck>;
    const mergedPath = mergedPathFor(outPath);
    try {
        await client.query('SET default_transaction_read_only = on');
        await client.query('BEGIN READ ONLY');
        const rows = (ids.length ? (await client.query(rowsSql, [ids])).rows : []) as unknown as MonorepoRow[];
        const monorepoIds = ((await client.query(idsSql, [LEVELS[0], LEVELS[LEVELS.length - 1]])).rows as unknown as {
            legacy_id: string;
        }[]).map((r) => r.legacy_id);
        result = crossCheck(inv, rows, monorepoIds, {
            inventory: path.basename(inventoryPath),
            merged: path.basename(mergedPath),
        });
        await client.query('ROLLBACK');
    } finally {
        await client.end();
    }

    for (const file of [outPath, reportPath, mergedPath]) fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(outPath, result.json);
    fs.writeFileSync(reportPath, result.report);
    fs.writeFileSync(mergedPath, result.merged);

    console.log(`inventory articles at levels ${LEVELS.join(', ')}: ${result.counts.inventory}`);
    console.log(`monorepo articles at levels ${LEVELS.join(', ')}: ${result.counts.monorepo}`);
    console.log(`in both: ${result.counts.matched}`);
    console.log(`legacy only: ${result.counts.legacyOnly}`);
    console.log(`monorepo only: ${result.counts.monorepoOnly}`);
    console.log(`differing text: ${result.counts.differing}`);
    console.log(`Wrote ${outPath}`);
    console.log(`Wrote ${reportPath}`);
    console.log(`Wrote ${mergedPath}`);
    return 0;
}

const parsed = parseArgs(process.argv.slice(2));
if (!parsed) {
    process.exit(2);
} else {
    const url = process.env.MONOREPO_DATABASE_URL;
    if (!url) {
        console.error('Set MONOREPO_DATABASE_URL to the database URL');
        process.exit(2);
    } else {
        run(parsed.inventory, parsed.out, parsed.report, url).then(
            (code) => process.exit(code),
            (e) => {
                console.error(e instanceof Error ? e.message : e);
                process.exit(1);
            },
        );
    }
}
