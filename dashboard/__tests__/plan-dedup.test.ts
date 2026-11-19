// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { REPO_ROOT } from '../lib/lesson-package/files';
import type { Article, DedupOptions } from '../scripts/plan-dedup';

type ParseOk = { ok: true; inventory: string; options: DedupOptions };
type ParseFail = { ok: false; message: string; usage: string };
type PlanDedupModule = {
  parseDedupArgs: (argv: string[]) => ParseOk | ParseFail;
  planDedup: (
    inv: { readAt: string; articles: Article[] },
    options: DedupOptions,
  ) => { files: { path: string; content: string }[]; log: string[] };
  displayPath: (absolute: string) => string;
  main: (argv: string[]) => number;
};

let mod: PlanDedupModule;
const tmpDirs: string[] = [];

function makeTmp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-dedup-red-'));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  vi.restoreAllMocks();
});

beforeAll(async () => {
  const savedExit = process.exitCode;
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    mod = (await import('../scripts/plan-dedup')) as unknown as PlanDedupModule;
  } finally {
    process.exitCode = savedExit;
    logSpy.mockRestore();
    errSpy.mockRestore();
  }
});

const COMMITTED_JSON = path.join(REPO_ROOT, 'docs/content-plans/data/duplicates-levels-1-4.json');
const COMMITTED_MD = path.join(REPO_ROOT, 'docs/content-plans/level-plans/duplicates.md');
const LEGACY_META = path.join(REPO_ROOT, 'docs/content-plans/data/legacy-levels-1-4-2026-10-02.json');
const READ_AT_14 = '2026-10-02T02:41:26.855Z';
const DEFAULT_JSON = path.join(REPO_ROOT, 'docs/content-plans/data/duplicates-levels-1-4.json');
const DEFAULT_MD = path.join(REPO_ROOT, 'docs/content-plans/level-plans/duplicates.md');
const KNOWN_PRINTED_ID = 'cmgqw2xjt01tyt79bpr10b65a';

function readCommitted(): { json: string; md: string } {
  return { json: fs.readFileSync(COMMITTED_JSON, 'utf8'), md: fs.readFileSync(COMMITTED_MD, 'utf8') };
}

function legacyPrintedIds(): string[] {
  const legacy = JSON.parse(fs.readFileSync(LEGACY_META, 'utf8')) as {
    articles: { id: string; printed: boolean }[];
  };
  return legacy.articles.filter((a) => a.printed).map((a) => a.id);
}

/** Rebuild the levels 1-4 input. The passage inventory is not in this repository. */
function rebuildLevels14Inventory(): { readAt: string; articles: Article[] } {
  const dupes = JSON.parse(fs.readFileSync(COMMITTED_JSON, 'utf8')) as {
    groups: { level: number; articles: Omit<Article, 'raLevel'>[] }[];
  };
  const legacy = JSON.parse(fs.readFileSync(LEGACY_META, 'utf8')) as { articles: Article[] };
  const online: Article[] = [];
  for (const group of dupes.groups) {
    for (const article of group.articles) online.push({ ...article, raLevel: group.level });
  }
  expect(online).toHaveLength(272);
  const printed: Article[] = legacy.articles
    .filter((a) => (a as { printed?: boolean }).printed)
    .map((a) => ({ ...a, summary: '', passage: '', approved: false }));
  expect(printed).toHaveLength(28);
  const articles = [...online, ...printed].sort(
    (x, y) => x.raLevel - y.raLevel || (x.createdAt < y.createdAt ? -1 : x.createdAt > y.createdAt ? 1 : 0),
  );
  return { readAt: READ_AT_14, articles };
}

function defaultOptions(inventoryPath: string): DedupOptions {
  const parsed = mod.parseDedupArgs(['--inventory', inventoryPath]);
  if (!parsed.ok) throw new Error(`default parse failed: ${(parsed as ParseFail).message}`);
  return (parsed as ParseOk).options;
}

/** Parse labeled integers from a level line. A bare digit match would hit dates. */
function parseLevelLine(line: string): { all: number; printed: number; online: number } {
  const m = line.match(/(\d+) articles: (\d+) printed, (\d+) online\./);
  if (!m) throw new Error(`not a level line: ${line}`);
  return { all: Number(m[1]), printed: Number(m[2]), online: Number(m[3]) };
}

function levelLine(md: string, level: number): string {
  const found = md.split('\n').find((line) => line.startsWith(`## Level ${level}`));
  if (!found) throw new Error(`missing Level ${level} section`);
  const lines = md.split('\n');
  const line = lines[lines.indexOf(found) + 2];
  if (!line) throw new Error(`missing Level ${level} count line`);
  return line;
}

let wordSeq = 0;
const UNIQUE_WORDS = [
  'quokka',
  'xylophone',
  'jaguarundi',
  'kinkajou',
  'axolotl',
  'narwhal',
  'pangolin',
  'okapi',
  'quoll',
  'bandicoot',
  'wombat',
  'echidna',
  'capybara',
  'tapir',
  'aardvark',
  'dugong',
  'gerenuk',
  'markhor',
  'numbat',
  'tarsier',
];

/** Short invented text. No passage comes from a private source. */
function inventArticle(
  id: string,
  raLevel: number,
  word?: string,
  use = 0,
): Article {
  const w = word ?? UNIQUE_WORDS[wordSeq++ % UNIQUE_WORDS.length];
  const day = String(1 + (wordSeq % 27)).padStart(2, '0');
  return {
    id,
    raLevel,
    title: `Tale of the ${w}`,
    type: 'fiction',
    genre: 'Animals',
    approved: false,
    createdAt: `2026-03-${day}T01:02:03.000Z`,
    words: 40,
    summary: `A short tale about a ${w}.`,
    passage: `The ${w} hops. Hops the ${w}.`,
    use: { progress: use, assignments: 0, activityLogs: 0 },
  };
}

function silence(): { log: ReturnType<typeof vi.spyOn>; err: ReturnType<typeof vi.spyOn> } {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const err = vi.spyOn(console, 'error').mockImplementation(() => {});
  return { log, err };
}

describe('new options and defaults', () => {
  it('parses --levels as a comma-separated level list', () => {
    const dir = makeTmp();
    const parsed = mod.parseDedupArgs([
      '--inventory',
      path.join(dir, 'inv.json'),
      '--levels',
      '5,6,7,8,9',
      '--targets',
      '5=50,6=100,7=100,8=150,9=150',
    ]);
    if (!parsed.ok) throw new Error(`parse failed: ${(parsed as ParseFail).message}`);
    expect((parsed as ParseOk).options.levels).toEqual([5, 6, 7, 8, 9]);
  });

  it('parses --targets as one target for each listed level', () => {
    const dir = makeTmp();
    const parsed = mod.parseDedupArgs([
      '--inventory',
      path.join(dir, 'inv.json'),
      '--levels',
      '5,6,7,8,9',
      '--targets',
      '5=50,6=100,7=100,8=150,9=150',
    ]);
    if (!parsed.ok) throw new Error(`parse failed: ${(parsed as ParseFail).message}`);
    expect((parsed as ParseOk).options.targets).toEqual({ 5: 50, 6: 100, 7: 100, 8: 150, 9: 150 });
  });

  it('fills printedIds from a given --printed file', () => {
    const dir = makeTmp();
    const printedPath = path.join(dir, 'printed.json');
    fs.writeFileSync(printedPath, JSON.stringify({ articles: [{ id: 'x1', printed: true }, { id: 'x2', printed: false }] }));
    const parsed = mod.parseDedupArgs([
      '--inventory',
      path.join(dir, 'inv.json'),
      '--levels',
      '5',
      '--targets',
      '5=50',
      '--printed',
      printedPath,
    ]);
    if (!parsed.ok) throw new Error(`parse failed: ${(parsed as ParseFail).message}`);
    expect((parsed as ParseOk).options.printedIds).toEqual(new Set(['x1']));
  });

  it('keeps printedIds empty when --printed is omitted with another level list', () => {
    const dir = makeTmp();
    const parsed = mod.parseDedupArgs([
      '--inventory',
      path.join(dir, 'inv.json'),
      '--levels',
      '5,6,7,8,9',
      '--targets',
      '5=50,6=100,7=100,8=150,9=150',
    ]);
    if (!parsed.ok) throw new Error(`parse failed: ${(parsed as ParseFail).message}`);
    expect((parsed as ParseOk).options.printedIds.size).toBe(0);
  });

  it('resolves given --out-json and --out-md paths against the working directory', () => {
    const parsed = mod.parseDedupArgs([
      '--inventory',
      'inv.json',
      '--levels',
      '5',
      '--targets',
      '5=50',
      '--out-json',
      'tmp-a.json',
      '--out-md',
      'tmp-b.md',
    ]);
    if (!parsed.ok) throw new Error(`parse failed: ${(parsed as ParseFail).message}`);
    const options = (parsed as ParseOk).options;
    expect(options.outJson).toBe(path.resolve('tmp-a.json'));
    expect(options.outMd).toBe(path.resolve('tmp-b.md'));
  });

  it('returns the default levels, targets, printed ids, and output paths', () => {
    const parsed = mod.parseDedupArgs(['--inventory', path.join(makeTmp(), 'inv.json')]);
    if (!parsed.ok) throw new Error(`parse failed: ${(parsed as ParseFail).message}`);
    const ok = parsed as ParseOk;
    expect(ok.options.levels).toEqual([1, 2, 3, 4]);
    expect(ok.options.targets).toEqual({ 1: 50, 2: 50, 3: 100, 4: 50 });
    expect(ok.options.printedIds).toEqual(new Set(legacyPrintedIds()));
    expect(ok.options.printedIds.size).toBe(28);
    expect(ok.options.printedIds.has(KNOWN_PRINTED_ID)).toBe(true);
    expect(ok.options.outJson).toBe(DEFAULT_JSON);
    expect(ok.options.outMd).toBe(DEFAULT_MD);
    expect(path.isAbsolute(ok.options.outJson)).toBe(true);
    expect(path.isAbsolute(ok.options.outMd)).toBe(true);
  });
});

describe('default run, byte-identical', () => {
  it('returns the two committed files byte for byte', () => {
    const dir = makeTmp();
    const committed = readCommitted();
    expect(committed.json.length).toBeGreaterThan(0);
    expect(committed.md.length).toBeGreaterThan(0);
    const jsonCopy = path.join(dir, 'committed.json');
    const mdCopy = path.join(dir, 'committed.md');
    fs.writeFileSync(jsonCopy, committed.json);
    fs.writeFileSync(mdCopy, committed.md);
    const inventory = rebuildLevels14Inventory();
    const files = mod.planDedup(inventory, defaultOptions(path.join(dir, 'inv.json'))).files;
    expect(files).toHaveLength(2);
    const byPath = new Map(files.map((f) => [f.path, f.content]));
    expect(byPath.get(DEFAULT_JSON)).toBe(fs.readFileSync(jsonCopy, 'utf8'));
    expect(byPath.get(DEFAULT_MD)).toBe(fs.readFileSync(mdCopy, 'utf8'));
  });

  it('keeps 179 groups with at least one merged group', () => {
    const dir = makeTmp();
    const inventory = rebuildLevels14Inventory();
    const files = mod.planDedup(inventory, defaultOptions(path.join(dir, 'inv.json'))).files;
    const jsonText = new Map(files.map((f) => [f.path, f.content])).get(DEFAULT_JSON) ?? '';
    const groups = (JSON.parse(jsonText) as { groups: { articles: unknown[] }[] }).groups;
    expect(groups).toHaveLength(179);
    expect(groups.some((g) => g.articles.length > 1)).toBe(true);
  });
});

describe('default write', () => {
  it('writes exactly the two default files with the committed bytes', () => {
    const dir = makeTmp();
    const committed = readCommitted();
    const inventoryPath = path.join(dir, 'inv.json');
    fs.writeFileSync(inventoryPath, JSON.stringify(rebuildLevels14Inventory()));
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    const { log, err } = silence();
    let code = 2;
    try {
      code = mod.main(['--inventory', inventoryPath]);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    expect(code).toBe(0);
    expect(writeSpy).toHaveBeenCalledTimes(2);
    const calls: [string, string][] = writeSpy.mock.calls.map((c) => [String(c[0]), String(c[1])] as [string, string]);
    const byPath = new Map(calls);
    expect([...byPath.keys()].sort()).toEqual([DEFAULT_JSON, DEFAULT_MD].sort());
    expect(byPath.get(DEFAULT_JSON)).toBe(committed.json);
    expect(byPath.get(DEFAULT_MD)).toBe(committed.md);
  });
});

describe('mixed options', () => {
  it('keeps the defaults when only the output paths are given', () => {
    const dir = makeTmp();
    const committed = readCommitted();
    const inventoryPath = path.join(dir, 'inv.json');
    fs.writeFileSync(inventoryPath, JSON.stringify(rebuildLevels14Inventory()));
    const outJson = path.join(dir, 'mix.json');
    const outMd = path.join(dir, 'mix.md');
    const { log, err } = silence();
    let code = 2;
    try {
      code = mod.main(['--inventory', inventoryPath, '--out-json', outJson, '--out-md', outMd]);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    expect(code).toBe(0);
    expect(fs.readFileSync(outJson, 'utf8')).toBe(committed.json);
    expect(fs.readFileSync(outMd, 'utf8')).toBe(committed.md);
  });

  it('keeps the default printed file when the levels 1-4 options are written out', () => {
    const dir = makeTmp();
    const committed = readCommitted();
    const inventoryPath = path.join(dir, 'inv.json');
    fs.writeFileSync(inventoryPath, JSON.stringify(rebuildLevels14Inventory()));
    const outJson = path.join(dir, 'explicit.json');
    const outMd = path.join(dir, 'explicit.md');
    const { log, err } = silence();
    let code = 2;
    try {
      code = mod.main([
        '--inventory',
        inventoryPath,
        '--levels',
        '1,2,3,4',
        '--targets',
        '1=50,2=50,3=100,4=50',
        '--out-json',
        outJson,
        '--out-md',
        outMd,
      ]);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    expect(code).toBe(0);
    expect(fs.readFileSync(outJson, 'utf8')).toBe(committed.json);
    expect(fs.readFileSync(outMd, 'utf8')).toBe(committed.md);
  });
});

function levelSection(md: string, level: number): string {
  const lines = md.split('\n');
  const start = lines.findIndex((line) => line === `## Level ${level}`);
  if (start < 0) throw new Error(`missing Level ${level} section`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('## '));
  return [...lines.slice(start, start + 1), ...rest.slice(0, end < 0 ? rest.length : end)].join('\n');
}

describe('levels 5-9 run on a small fixture', () => {
  function fixture5to9(): { readAt: string; articles: Article[] } {
    // Plan line 43: below target, a level keeps all and merges none.
    // The l5a/l5b pair shares one invented passage; the other four use different words.
    const articles: Article[] = [
      inventArticle('l5a', 5, 'quokka', 5),
      inventArticle('l5b', 5, 'quokka'),
      inventArticle('l5c', 5, 'jaguarundi'),
      inventArticle('l5d', 5, 'kinkajou'),
      inventArticle('l5e', 5, 'axolotl'),
      inventArticle('l5f', 5, 'narwhal'),
      inventArticle('l6a', 6),
      inventArticle('l6b', 6),
      inventArticle('l6c', 6),
      inventArticle('l7a', 7),
      inventArticle('l7b', 7),
      inventArticle('l8a', 8),
      inventArticle('l8b', 8),
      inventArticle('l9a', 9),
      inventArticle('l9b', 9),
    ];
    return { readAt: '2026-11-19T00:00:00.000Z', articles };
  }

  it('exits 0, writes only the given paths, and prints the pure log lines', () => {
    const dir = makeTmp();
    const inventoryPath = path.join(dir, 'inv-5-9.json');
    const fixture = fixture5to9();
    fs.writeFileSync(inventoryPath, JSON.stringify(fixture));
    const outJson = path.join(dir, 'dupes-5-9.json');
    const outMd = path.join(dir, 'dupes-5-9.md');
    const before = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' });
    const argv = [
      '--inventory',
      inventoryPath,
      '--levels',
      '5,6,7,8,9',
      '--targets',
      '5=50,6=100,7=100,8=150,9=150',
      '--out-json',
      outJson,
      '--out-md',
      outMd,
    ];
    const expected = mod.planDedup(fixture, (mod.parseDedupArgs(argv) as ParseOk).options);
    const printed: string[] = [];
    const logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      printed.push(args.map(String).join(' '));
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let code = 2;
    try {
      code = mod.main(argv);
    } finally {
      logSpy.mockRestore();
      errSpy.mockRestore();
    }
    expect(code).toBe(0);
    expect(fs.existsSync(outJson)).toBe(true);
    expect(fs.existsSync(outMd)).toBe(true);
    expect(printed).toEqual(expected.log);
    const after = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' });
    expect(after).toBe(before);
  });

  it('writes the exact heading, intro, table header, and level lines', () => {
    const dir = makeTmp();
    const inventoryPath = path.join(dir, 'inv-5-9.json');
    const fixture = fixture5to9();
    fs.writeFileSync(inventoryPath, JSON.stringify(fixture));
    const outJson = path.join(dir, 'dupes-5-9.json');
    const outMd = path.join(dir, 'dupes-5-9.md');
    const { log, err } = silence();
    try {
      expect(
        mod.main([
          '--inventory',
          inventoryPath,
          '--levels',
          '5,6,7,8,9',
          '--targets',
          '5=50,6=100,7=100,8=150,9=150',
          '--out-json',
          outJson,
          '--out-md',
          outMd,
        ]),
      ).toBe(0);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    const md = fs.readFileSync(outMd, 'utf8');
    const lines = md.split('\n');
    expect(lines[0]).toBe('# Levels 5–9: old online articles, grouped');
    expect(lines[2]).toBe(
      'Generated by `dashboard/scripts/plan-dedup.ts` (track levels_5_9_20261006) from the read-only passages inventory of 2026-11-19T00:00:00.000Z.',
    );
    expect(lines[4]).toBe(
      "Provisional grouping for Daniel's level review. The level targets count the 550 new packages. Daniel decides for each kept old article: rebuild (same id) or delete. Targets: level 5 = 50, level 6 = 100, level 7 = 100, level 8 = 150, level 9 = 150.",
    );
    expect(lines[6]).toBe(
      'In each group, **keep** is the best article (most student use, then approved, then newest). The others are similar to it. Their title, summary, and passage stay in `dupes-5-9.json`.',
    );
    expect(md).not.toContain('| Keep | Similar |');
    expect(md).not.toContain('| Keep | Delete');
    expect(
      levelSection(md, 5)
        .split('\n')
        .filter((line) => line.startsWith('|')),
    ).toHaveLength(0);
    const line5 = levelLine(md, 5);
    expect(line5).toBe('6 articles: 0 printed, 6 online. Keep all 6 online articles; none is similar to another.');
    expect(parseLevelLine(line5)).toEqual({ all: 6, printed: 0, online: 6 });
    const line6 = levelLine(md, 6);
    expect(line6).toBe('3 articles: 0 printed, 3 online. Keep all 3 online articles; none is similar to another.');
    for (const level of [7, 8, 9]) {
      const parsed = parseLevelLine(levelLine(md, level));
      expect(parsed.printed).toBe(0);
      expect(parsed.all).toBe(parsed.online);
    }
  });

  it('keeps every online article below target, with no table for the level', () => {
    const dir = makeTmp();
    const inventoryPath = path.join(dir, 'inv-5-9.json');
    fs.writeFileSync(inventoryPath, JSON.stringify(fixture5to9()));
    const outJson = path.join(dir, 'dupes-5-9.json');
    const outMd = path.join(dir, 'dupes-5-9.md');
    const { log, err } = silence();
    try {
      expect(
        mod.main([
          '--inventory',
          inventoryPath,
          '--levels',
          '5,6,7,8,9',
          '--targets',
          '5=50,6=100,7=100,8=150,9=150',
          '--out-json',
          outJson,
          '--out-md',
          outMd,
        ]),
      ).toBe(0);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    const data = JSON.parse(fs.readFileSync(outJson, 'utf8')) as {
      groups: { level: number; keep: string; articles: { id: string }[] }[];
    };
    const level5 = data.groups.filter((g) => g.level === 5);
    expect(level5).toHaveLength(6);
    expect(level5.every((g) => g.articles.length === 1)).toBe(true);
    const md = fs.readFileSync(outMd, 'utf8');
    expect(md).not.toContain('| Keep | Similar |');
  });

  it('merges down to the keep count above target, with the Keep-Similar table', () => {
    // Above target, the run merges down to the keep count (plan line 41 template).
    // The two identical pairs merge first at similarity 1.00 under any correct cosine.
    const dir = makeTmp();
    const inventoryPath = path.join(dir, 'inv-7.json');
    fs.writeFileSync(
      inventoryPath,
      JSON.stringify({
        readAt: '2026-11-19T00:00:00.000Z',
        articles: [
          inventArticle('t7a', 7, 'quokka', 5),
          inventArticle('t7b', 7, 'quokka'),
          inventArticle('t7c', 7, 'xylophone', 3),
          inventArticle('t7d', 7, 'xylophone'),
        ],
      }),
    );
    const outJson = path.join(dir, 'out-7.json');
    const outMd = path.join(dir, 'out-7.md');
    const { log, err } = silence();
    try {
      expect(
        mod.main([
          '--inventory',
          inventoryPath,
          '--levels',
          '7',
          '--targets',
          '7=2',
          '--out-json',
          outJson,
          '--out-md',
          outMd,
        ]),
      ).toBe(0);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    const data = JSON.parse(fs.readFileSync(outJson, 'utf8')) as {
      groups: { level: number; keep: string; articles: { id: string }[] }[];
    };
    const level7 = data.groups.filter((g) => g.level === 7);
    expect(level7).toHaveLength(2);
    const sizes = level7.map((g) => g.articles.length).sort();
    expect(sizes).toEqual([2, 2]);
    expect(level7.map((g) => g.keep).sort()).toEqual(['t7a', 't7c']);
    const md = fs.readFileSync(outMd, 'utf8');
    expect(levelLine(md, 7)).toBe(
      '4 articles: 0 printed, 4 online. Keep 2 online articles; 2 are similar to a kept one. 2 groups have more than one article; the weakest merge had similarity 1.00.',
    );
    const section = levelSection(md, 7);
    expect(section).toContain('| Keep | Similar |');
    const rows = section.split('\n').filter((line) => line.startsWith('| ') && line.includes('`'));
    expect(rows).toHaveLength(2);
    expect(rows.join('\n')).toContain('t7a');
    expect(rows.join('\n')).toContain('t7c');
  });
});

describe('display form', () => {
  it('returns the repo-relative form inside the repository', () => {
    expect(mod.displayPath(path.join(REPO_ROOT, 'docs/content-plans/data/tmp-dupes.json'))).toBe(
      'docs/content-plans/data/tmp-dupes.json',
    );
  });

  it('returns only the file name outside the repository', () => {
    const outside = path.join(makeTmp(), 'dupes-5-9.json');
    expect(mod.displayPath(outside)).toBe('dupes-5-9.json');
  });

  it('holds no absolute path in either output file', () => {
    const dir = makeTmp();
    const inventoryPath = path.join(dir, 'inv-5-9.json');
    fs.writeFileSync(
      inventoryPath,
      JSON.stringify({ readAt: '2026-11-19T00:00:00.000Z', articles: [inventArticle('d1', 5), inventArticle('d2', 5)] }),
    );
    const outJson = path.join(dir, 'dupes-5-9.json');
    const outMd = path.join(dir, 'dupes-5-9.md');
    const { log, err } = silence();
    try {
      expect(
        mod.main([
          '--inventory',
          inventoryPath,
          '--levels',
          '5',
          '--targets',
          '5=50',
          '--out-json',
          outJson,
          '--out-md',
          outMd,
        ]),
      ).toBe(0);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    for (const file of [outJson, outMd]) {
      const text = fs.readFileSync(file, 'utf8');
      expect(text).not.toContain(REPO_ROOT);
      expect(text).not.toContain(os.tmpdir());
    }
  });
});

describe('a level below its target', () => {
  it('keeps every online article with no merge', () => {
    const dir = makeTmp();
    const inventoryPath = path.join(dir, 'inv.json');
    fs.writeFileSync(
      inventoryPath,
      JSON.stringify({
        readAt: '2026-11-19T00:00:00.000Z',
        articles: [inventArticle('s1', 6), inventArticle('s2', 6), inventArticle('s3', 6)],
      }),
    );
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { log, err } = silence();
    try {
      expect(
        mod.main(['--inventory', inventoryPath, '--levels', '6', '--targets', '6=100', '--out-json', outJson, '--out-md', outMd]),
      ).toBe(0);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    const data = JSON.parse(fs.readFileSync(outJson, 'utf8')) as {
      groups: { level: number; articles: unknown[] }[];
    };
    const groups = data.groups.filter((g) => g.level === 6);
    expect(groups).toHaveLength(3);
    expect(groups.every((g) => g.articles.length === 1)).toBe(true);
    expect(levelLine(fs.readFileSync(outMd, 'utf8'), 6)).toBe(
      '3 articles: 0 printed, 3 online. Keep all 3 online articles; none is similar to another.',
    );
  });
});

describe('a level at or above its target', () => {
  it('keeps 0 online articles and writes no group of it', () => {
    const dir = makeTmp();
    const inventoryPath = path.join(dir, 'inv.json');
    fs.writeFileSync(
      inventoryPath,
      JSON.stringify({
        readAt: '2026-11-19T00:00:00.000Z',
        articles: [inventArticle('p1', 7), inventArticle('p2', 7), inventArticle('o1', 7)],
      }),
    );
    const printedPath = path.join(dir, 'printed.json');
    fs.writeFileSync(printedPath, JSON.stringify({ articles: [{ id: 'p1', printed: true }, { id: 'p2', printed: true }] }));
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { log, err } = silence();
    try {
      expect(
        mod.main([
          '--inventory',
          inventoryPath,
          '--levels',
          '7',
          '--targets',
          '7=2',
          '--printed',
          printedPath,
          '--out-json',
          outJson,
          '--out-md',
          outMd,
        ]),
      ).toBe(0);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    const data = JSON.parse(fs.readFileSync(outJson, 'utf8')) as {
      groups: { level: number }[];
    };
    expect(data.groups.filter((g) => g.level === 7)).toHaveLength(0);
    expect(levelLine(fs.readFileSync(outMd, 'utf8'), 7)).toBe(
      '3 articles: 2 printed, 1 online. Keep 0 online articles; the printed articles already meet the target.',
    );
  });
});

describe('an inventory without readAt', () => {
  it('names the inventory file in the source string and the intro, never undefined', () => {
    const dir = makeTmp();
    const inventoryPath = path.join(dir, 'legacy-levels-5-9-2026-10-08.json');
    fs.writeFileSync(
      inventoryPath,
      JSON.stringify({ articles: [inventArticle('n1', 5), inventArticle('n2', 5)] }),
    );
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { log, err } = silence();
    try {
      expect(
        mod.main(['--inventory', inventoryPath, '--levels', '5', '--targets', '5=50', '--out-json', outJson, '--out-md', outMd]),
      ).toBe(0);
    } finally {
      log.mockRestore();
      err.mockRestore();
    }
    const jsonText = fs.readFileSync(outJson, 'utf8');
    const md = fs.readFileSync(outMd, 'utf8');
    expect(jsonText).toContain('inventory of legacy-levels-5-9-2026-10-08.json');
    expect(md).toContain('inventory of legacy-levels-5-9-2026-10-08.json');
    expect(jsonText).not.toContain('undefined');
    expect(md).not.toContain('undefined');
  });
});

describe('bad option values', () => {
  const cases: { name: string; argv: (dir: string) => string[] }[] = [
    { name: 'unknown option', argv: (dir) => ['--inventory', path.join(dir, 'inv.json'), '--bogus', 'x'] },
    { name: 'missing option value', argv: () => ['--inventory'] },
    {
      name: 'level that is not a number',
      argv: (dir) => ['--inventory', path.join(dir, 'inv.json'), '--levels', '5,x', '--targets', '5=50'],
    },
    {
      name: 'targets without levels',
      argv: (dir) => ['--inventory', path.join(dir, 'inv.json'), '--targets', '5=50'],
    },
    {
      name: 'target for a level outside levels',
      argv: (dir) => ['--inventory', path.join(dir, 'inv.json'), '--levels', '5', '--targets', '5=50,6=100'],
    },
    {
      name: 'listed level without a target',
      argv: (dir) => ['--inventory', path.join(dir, 'inv.json'), '--levels', '5,6', '--targets', '5=50'],
    },
    {
      name: 'levels without targets',
      argv: (dir) => ['--inventory', path.join(dir, 'inv.json'), '--levels', '5'],
    },
  ];

  for (const { name, argv } of cases) {
    it(`returns ok false with a message and usage: ${name}`, () => {
      const parsed = mod.parseDedupArgs(argv(makeTmp()));
      expect((parsed as ParseFail).ok).toBe(false);
      const fail = parsed as ParseFail;
      expect(typeof fail.message).toBe('string');
      expect(fail.message.length).toBeGreaterThan(0);
      expect(typeof fail.usage).toBe('string');
      expect(fail.usage).toContain('Usage');
    });

    it(`prints the message, then the usage, to stderr and exits 2: ${name}`, () => {
      const parsed = mod.parseDedupArgs(argv(makeTmp()));
      const fail = parsed as ParseFail;
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      let code = 0;
      let stderr = '';
      try {
        code = mod.main(argv(makeTmp()));
      } finally {
        stderr = errSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
        errSpy.mockRestore();
        logSpy.mockRestore();
      }
      expect(code).toBe(2);
      expect(stderr).toContain(fail.message);
      expect(stderr).toContain('Usage');
      expect(stderr.indexOf(fail.message)).toBeLessThan(stderr.indexOf('Usage'));
    });
  }

  it('names a missing printed file and exits 2', () => {
    const dir = makeTmp();
    const missing = path.join(dir, 'no-such-printed.json');
    const parsed = mod.parseDedupArgs(['--inventory', path.join(dir, 'inv.json'), '--printed', missing]);
    expect((parsed as ParseFail).ok).toBe(false);
    expect((parsed as ParseFail).message).toBe(`printed file not found: ${missing}`);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    let code = 0;
    let stderr = '';
    try {
      code = mod.main(['--inventory', path.join(dir, 'inv.json'), '--printed', missing]);
    } finally {
      stderr = errSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
      errSpy.mockRestore();
      logSpy.mockRestore();
    }
    expect(code).toBe(2);
    expect(stderr).toContain(`printed file not found: ${missing}`);
    expect(stderr.indexOf(`printed file not found: ${missing}`)).toBeLessThan(stderr.indexOf('Usage'));
  });

  it('returns ok false for a missing --inventory', () => {
    for (const argv of [[], ['--levels', '5', '--targets', '5=50']]) {
      const parsed = mod.parseDedupArgs(argv);
      expect((parsed as ParseFail).ok).toBe(false);
      expect((parsed as ParseFail).message).toBe('missing option: --inventory');
      expect((parsed as ParseFail).usage).toContain('Usage');
    }
  });

  it('prints missing --inventory, then the usage, to stderr and exits 2 with empty stdout', () => {
    for (const argv of [[], ['--levels', '5', '--targets', '5=50']]) {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      let code = 0;
      let stderr = '';
      let stdout = '';
      try {
        code = mod.main(argv);
      } finally {
        stderr = errSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
        stdout = logSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
        errSpy.mockRestore();
        logSpy.mockRestore();
      }
      expect(code).toBe(2);
      expect(stderr).toContain('missing option: --inventory');
      expect(stderr.indexOf('missing option: --inventory')).toBeLessThan(stderr.indexOf('Usage'));
      expect(stdout).toBe('');
    }
  });

  it('rejects a targets item with more than one equals sign', () => {
    const dir = makeTmp();
    const inventoryPath = path.join(dir, 'inv.json');
    fs.writeFileSync(inventoryPath, JSON.stringify({ articles: [inventArticle('q1', 5)] }));
    const argv = ['--inventory', inventoryPath, '--levels', '5', '--targets', '5=50=x'];
    const parsed = mod.parseDedupArgs(argv);
    expect((parsed as ParseFail).ok).toBe(false);
    expect((parsed as ParseFail).message).toContain('5=50=x');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    let code = 0;
    let stderr = '';
    try {
      code = mod.main(argv);
    } finally {
      stderr = errSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
      errSpy.mockRestore();
      logSpy.mockRestore();
    }
    expect(code).toBe(2);
    expect(stderr).toContain('5=50=x');
    expect(stderr.indexOf('5=50=x')).toBeLessThan(stderr.indexOf('Usage'));
  });

  it('names a missing inventory file and exits 2 without a stack trace', () => {
    const dir = makeTmp();
    const missing = path.join(dir, 'no-such-inventory.json');
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    let code = 0;
    let stderr = '';
    try {
      code = mod.main([
        '--inventory',
        missing,
        '--levels',
        '5',
        '--targets',
        '5=50',
        '--out-json',
        outJson,
        '--out-md',
        outMd,
      ]);
    } finally {
      stderr = errSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
      errSpy.mockRestore();
      logSpy.mockRestore();
    }
    expect(code).toBe(2);
    expect(stderr).toContain(`inventory file not found: ${missing}`);
    expect(stderr.indexOf(`inventory file not found: ${missing}`)).toBeLessThan(stderr.indexOf('Usage'));
    expect(stderr.split('\n').filter((line) => line.startsWith('    at '))).toHaveLength(0);
  });
});

describe('clean import', () => {
  it('prints no usage and sets no exit code', async () => {
    vi.resetModules();
    const savedExit = process.exitCode;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await import('../scripts/plan-dedup');
    } finally {
      const calls = [...logSpy.mock.calls, ...errSpy.mock.calls].map((c) => c.map(String).join(' ')).join('\n');
      const exitAfter = process.exitCode;
      process.exitCode = savedExit;
      logSpy.mockRestore();
      errSpy.mockRestore();
      expect(calls).not.toContain('Usage');
      expect(exitAfter).toBe(savedExit);
    }
  });
});
