// @vitest-environment node
// Red test for Task 7.0 (Phase 7R: Rebuild map). The module
// `dashboard/scripts/rebuild-map.ts` does not exist yet, so every test below
// fails until Green implements it.
//
// Assumed contract (test-strategy.md Phase 7R.2; the orchestrator changes a name
// only by amending the plan):
//   export interface KeepGroup { level: number; keep: string }
//   export interface PackageRef { level: number; id: string } // id is `book/lesson`
//   export interface RebuildMapOptions { duplicates: string; contentRoot: string; outJson: string }
//   export function parseRebuildMapArgs(argv: string[]):
//     { ok: true; options: RebuildMapOptions } | { ok: false; message: string; usage: string }
//   export function buildRebuildMap(
//     groups: KeepGroup[], packages: PackageRef[],
//   ): { content: string; log: string[] } // pure; writes nothing
//   export function main(argv: string[]): number // 0 on success, 2 on a parse or input error
// Flags: `--duplicates` (default `<REPO_ROOT>/docs/content-plans/data/duplicates-levels-5-9.json`),
// `--content-root` (default `<REPO_ROOT>/content/primary`),
// `--out-json` (default `<REPO_ROOT>/docs/content-plans/data/rebuild-map-levels-5-9.json`).
// Every given path resolves against the working directory with `path.resolve`.
// The map JSON holds `source`, `levels`, `map`, and `newIds`. Each `levels` row
// carries numeric `level`, `kept`, `packages`, and `mapped`. Each `map` row carries
// numeric `level`, string `keepId`, and string `package`. Each `newIds` row carries
// numeric `level` and string `package`. Pairing rule: the i-th kept id of a level
// (in `groups` order of the committed duplicates JSON) pairs with the i-th package
// of that level in source order (the books of `LEVEL_BOOKS[level]` in array order,
// then `bank-<level>`; inside a folder, `loadPackageFolder` order, which matches
// the zero-padded filename sort used here). Leftover packages go to `newIds`.
// Assumed messages (same convention as `plan-dedup.ts`): usage text contains
// `Usage`; a missing duplicates file gives `duplicates file not found: <path>`;
// `main` prints `message` then usage to stderr and returns 2; a duplicate keep id
// or a duplicate package makes `buildRebuildMap` throw; an unknown level makes
// `main` return 2 and write nothing.
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { REPO_ROOT } from '../lib/lesson-package/files';
import { LEVEL_BOOKS, WORKBOOK_LESSONS, BANK_COUNTS } from '../lib/lesson-package/bank-plan';

type KeepGroup = { level: number; keep: string };
type PackageRef = { level: number; id: string };
type RebuildMapOptions = { duplicates: string; contentRoot: string; outJson: string };
type ParseOk = { ok: true; options: RebuildMapOptions };
type ParseFail = { ok: false; message: string; usage: string };
type RebuildMapModule = {
  parseRebuildMapArgs: (argv: string[]) => ParseOk | ParseFail;
  buildRebuildMap: (groups: KeepGroup[], packages: PackageRef[]) => { content: string; log: string[] };
  main: (argv: string[]) => number;
};

type MapRow = { level: number; keepId: string; package: string };
type LevelsRow = { level: number; kept: number; packages: number; mapped: number };
type NewIdRow = { level: number; package: string };
type RebuildMapJson = { source: string; levels: LevelsRow[]; map: MapRow[]; newIds: NewIdRow[] };

let mod: RebuildMapModule;
const tmpDirs: string[] = [];

function makeTmp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rebuild-map-red-'));
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
    mod = (await import('../scripts/rebuild-map')) as unknown as RebuildMapModule;
  } finally {
    process.exitCode = savedExit;
    logSpy.mockRestore();
    errSpy.mockRestore();
  }
});

const COMMITTED_DUPES = path.join(
  REPO_ROOT,
  'docs/content-plans/data/duplicates-levels-5-9.json',
);
const COMMITTED_MAP = path.join(REPO_ROOT, 'docs/content-plans/data/rebuild-map-levels-5-9.json');
const CONTENT_ROOT = path.join(REPO_ROOT, 'content/primary');
const SCRIPT_PATH = path.join(REPO_ROOT, 'dashboard/scripts/rebuild-map.ts');

const LEVELS = [5, 6, 7, 8, 9];
const EXPECTED_KEPT: Record<number, number> = { 5: 50, 6: 88, 7: 4, 8: 38, 9: 49 };
const EXPECTED_PACKAGES: Record<number, number> = { 5: 50, 6: 100, 7: 100, 8: 150, 9: 150 };

function fixtureGroups(): KeepGroup[] {
  return [
    { level: 5, keep: 'keep-5-a' },
    { level: 5, keep: 'keep-5-b' },
    { level: 6, keep: 'keep-6-a' },
  ];
}

function fixturePackages(): PackageRef[] {
  return [
    { level: 5, id: 'quest-5/l01' },
    { level: 5, id: 'quest-5/l02' },
    { level: 6, id: 'quest-6.1/l01' },
  ];
}

function parseContent(content: string): RebuildMapJson {
  return JSON.parse(content) as RebuildMapJson;
}

/** Keep ids from the committed duplicates JSON. Reads ids and counts only. */
function readKeepGroups(): KeepGroup[] {
  const raw = JSON.parse(fs.readFileSync(COMMITTED_DUPES, 'utf8')) as {
    groups: { level: number; keep: string }[];
  };
  return raw.groups.map((g) => ({ level: g.level, keep: g.keep }));
}

/**
 * Package ids from the real package folders. Lists top-level `*.json` file names
 * only; never reads package text.
 */
function enumeratePackages(contentRoot: string): PackageRef[] {
  const out: PackageRef[] = [];
  for (const level of LEVELS) {
    for (const book of [...LEVEL_BOOKS[level], `bank-${level}`]) {
      const files = fs
        .readdirSync(path.join(contentRoot, book))
        .filter((f) => f.endsWith('.json'))
        .sort();
      for (const f of files) out.push({ level, id: `${book}/${f.replace(/\.json$/, '')}` });
    }
  }
  return out;
}

function levelsByLevel(parsed: RebuildMapJson): Map<number, LevelsRow> {
  return new Map(parsed.levels.map((row) => [row.level, row]));
}

describe('parse defaults and path resolution', () => {
  it('defaults to the three committed paths as absolute paths', () => {
    const parsed = mod.parseRebuildMapArgs([]);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('default parse failed');
    expect(path.isAbsolute(parsed.options.duplicates)).toBe(true);
    expect(path.isAbsolute(parsed.options.contentRoot)).toBe(true);
    expect(path.isAbsolute(parsed.options.outJson)).toBe(true);
    expect(parsed.options.duplicates.endsWith('duplicates-levels-5-9.json')).toBe(true);
    expect(parsed.options.contentRoot.endsWith(path.join('content', 'primary'))).toBe(true);
    expect(parsed.options.outJson.endsWith('rebuild-map-levels-5-9.json')).toBe(true);
  });

  it('resolves a given relative path against the working directory', () => {
    const parsed = mod.parseRebuildMapArgs(['--out-json', 'tmp/map.json']);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('parse failed');
    expect(parsed.options.outJson).toBe(path.resolve('tmp/map.json'));
  });
});

describe('same-level pairing', () => {
  it('pairs each kept id with a package of its own level', () => {
    const groups = fixtureGroups();
    const packages = fixturePackages();
    const { content } = mod.buildRebuildMap(groups, packages);
    const parsed = parseContent(content);
    expect(parsed.map).toHaveLength(3);
    const groupLevel = new Map(groups.map((g) => [g.keep, g.level]));
    const packageLevel = new Map(packages.map((p) => [p.id, p.level]));
    for (const row of parsed.map) {
      expect(groupLevel.get(row.keepId)).toBe(row.level);
      expect(packageLevel.get(row.package)).toBe(row.level);
    }
  });
});

describe('one-to-one ids and packages', () => {
  it('maps each keep id exactly once', () => {
    const groups = fixtureGroups();
    const { content } = mod.buildRebuildMap(groups, fixturePackages());
    const keepIds = parseContent(content).map.map((row) => row.keepId);
    expect([...keepIds].sort()).toEqual(['keep-5-a', 'keep-5-b', 'keep-6-a']);
    expect(new Set(keepIds).size).toBe(keepIds.length);
  });

  it('uses each package exactly once across map and newIds', () => {
    const groups: KeepGroup[] = [{ level: 5, keep: 'keep-5-a' }];
    const packages: PackageRef[] = [
      { level: 5, id: 'quest-5/l01' },
      { level: 5, id: 'quest-5/l02' },
    ];
    const parsed = parseContent(mod.buildRebuildMap(groups, packages).content);
    expect(parsed.map).toHaveLength(1);
    expect(parsed.newIds).toHaveLength(1);
    const used = [...parsed.map.map((row) => row.package), ...parsed.newIds.map((row) => row.package)];
    expect([...used].sort()).toEqual(['quest-5/l01', 'quest-5/l02']);
    expect(new Set(used).size).toBe(used.length);
    expect(parsed.newIds[0].level).toBe(5);
  });

  it('rejects a repeated keep id', () => {
    const groups: KeepGroup[] = [
      { level: 5, keep: 'keep-5-a' },
      { level: 5, keep: 'keep-5-a' },
    ];
    expect(() => mod.buildRebuildMap(groups, fixturePackages())).toThrow();
  });

  it('rejects a repeated package', () => {
    const packages: PackageRef[] = [
      { level: 5, id: 'quest-5/l01' },
      { level: 5, id: 'quest-5/l01' },
    ];
    expect(() => mod.buildRebuildMap(fixtureGroups(), packages)).toThrow();
  });
});

describe('labeled level counts', () => {
  it('reports labeled kept, packages, and mapped counts per level', () => {
    const parsed = parseContent(mod.buildRebuildMap(fixtureGroups(), fixturePackages()).content);
    const byLevel = levelsByLevel(parsed);
    expect(byLevel.get(5)).toMatchObject({ level: 5, kept: 2, packages: 2, mapped: 2 });
    expect(byLevel.get(6)).toMatchObject({ level: 6, kept: 1, packages: 1, mapped: 1 });
  });
});

describe('determinism', () => {
  it('returns byte-identical content for two calls on the same inputs', () => {
    const groups = fixtureGroups();
    const packages = fixturePackages();
    const first = mod.buildRebuildMap(groups, packages).content;
    const second = mod.buildRebuildMap(groups, packages).content;
    expect(second).toBe(first);
  });
});

describe('an unknown level', () => {
  it('exits 2 with usage and no output file', () => {
    const dir = makeTmp();
    const dupes = path.join(dir, 'dupes.json');
    fs.writeFileSync(
      dupes,
      JSON.stringify({ source: 'fixture', groups: [{ level: 4, keep: 'k4' }, { level: 10, keep: 'k10' }] }),
    );
    const out = path.join(dir, 'map.json');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    let stderr = '';
    let code = 0;
    try {
      code = mod.main(['--duplicates', dupes, '--content-root', CONTENT_ROOT, '--out-json', out]);
    } finally {
      stderr = errSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
      errSpy.mockRestore();
      logSpy.mockRestore();
    }
    expect(code).toBe(2);
    expect(stderr).toContain('Usage');
    expect(fs.existsSync(out)).toBe(false);
  });
});

describe('no database or network access', () => {
  const FORBIDDEN = [
    /@reading-advantage\/db/,
    /\bfrom\s+['"]pg['"]/,
    /\brequire\s*\(\s*['"]pg['"]\s*\)/,
    /\bmysql\b/,
    /\baxios\b/,
    /\bchild_process\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bfrom\s+['"]https?['"]/,
  ];

  it('imports no database client and opens no socket', () => {
    const source = fs.readFileSync(SCRIPT_PATH, 'utf8');
    for (const re of FORBIDDEN) expect(source).not.toMatch(re);
  });

  it('calls fetch never and writes exactly once at the given out path', () => {
    const dir = makeTmp();
    const out = path.join(dir, 'map.json');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new Error('no network')));
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let code = 0;
    try {
      code = mod.main(['--duplicates', COMMITTED_DUPES, '--content-root', CONTENT_ROOT, '--out-json', out]);
    } finally {
      logSpy.mockRestore();
      errSpy.mockRestore();
    }
    expect(code).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writeSpy.mock.calls[0][0]).toBe(out);
  });

  it('changes no repository file outside the given output', () => {
    const before = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' });
    const dir = makeTmp();
    const out = path.join(dir, 'map.json');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(mod.main(['--duplicates', COMMITTED_DUPES, '--content-root', CONTENT_ROOT, '--out-json', out])).toBe(0);
    } finally {
      logSpy.mockRestore();
      errSpy.mockRestore();
    }
    const after = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' });
    expect(after).toBe(before);
  });
});

describe('path display', () => {
  it('holds no absolute path in the map content', () => {
    const { content } = mod.buildRebuildMap(fixtureGroups(), fixturePackages());
    expect(content).not.toContain('REPO_ROOT');
    expect(content).not.toContain('os.tmpdir()');
    expect(content).not.toContain('/home/');
  });
});

describe('bad options', () => {
  function runMain(argv: string[]): { code: number; stdout: string; stderr: string } {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    let code = 0;
    try {
      code = mod.main(argv);
    } finally {
      const stdout = logSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
      const stderr = errSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
      logSpy.mockRestore();
      errSpy.mockRestore();
      expect(writeSpy).not.toHaveBeenCalled();
      writeSpy.mockRestore();
      return { code, stdout, stderr };
    }
  }

  it('rejects an unknown flag', () => {
    const dir = makeTmp();
    const out = path.join(dir, 'map.json');
    const { code, stdout, stderr } = runMain(['--nope', 'x', '--out-json', out]);
    expect(code).toBe(2);
    expect(stdout).toBe('');
    expect(stderr).toContain('Usage');
    expect(fs.existsSync(out)).toBe(false);
  });

  it('rejects a flag with a missing value', () => {
    const { code, stdout, stderr } = runMain(['--duplicates']);
    expect(code).toBe(2);
    expect(stdout).toBe('');
    expect(stderr).toContain('Usage');
  });

  it('names a missing duplicates file and exits 2', () => {
    const dir = makeTmp();
    const missing = path.join(dir, 'no-such-dupes.json');
    const out = path.join(dir, 'map.json');
    const { code, stdout, stderr } = runMain([
      '--duplicates',
      missing,
      '--content-root',
      CONTENT_ROOT,
      '--out-json',
      out,
    ]);
    expect(code).toBe(2);
    expect(stdout).toBe('');
    expect(stderr).toContain(`duplicates file not found: ${missing}`);
    expect(stderr.indexOf(`duplicates file not found: ${missing}`)).toBeLessThan(stderr.indexOf('Usage'));
    expect(stderr.split('\n').filter((line) => line.startsWith('    at '))).toHaveLength(0);
    expect(fs.existsSync(out)).toBe(false);
  });
});

describe('clean import', () => {
  it('prints no usage and sets no exit code', async () => {
    vi.resetModules();
    const savedExit = process.exitCode;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await import('../scripts/rebuild-map');
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

describe('real committed inputs', () => {
  it('keeps 50, 88, 4, 38, 49 ids across 229 groups', () => {
    const groups = readKeepGroups();
    expect(groups).toHaveLength(229);
    for (const level of LEVELS) {
      expect(groups.filter((g) => g.level === level)).toHaveLength(EXPECTED_KEPT[level]);
    }
    expect(new Set(groups.map((g) => g.keep)).size).toBe(229);
  });

  it('enumerates 50, 100, 100, 150, 150 packages across 550 files', () => {
    const packages = enumeratePackages(CONTENT_ROOT);
    expect(packages).toHaveLength(550);
    for (const level of LEVELS) {
      const count = packages.filter((p) => p.level === level).length;
      expect(count).toBe(EXPECTED_PACKAGES[level]);
      expect(count).toBe(WORKBOOK_LESSONS[level] + BANK_COUNTS[level]);
    }
    expect(new Set(packages.map((p) => p.id)).size).toBe(550);
  });

  it('maps every kept id once, uses no package twice, and stays in-level', () => {
    const groups = readKeepGroups();
    const packages = enumeratePackages(CONTENT_ROOT);
    const first = mod.buildRebuildMap(groups, packages).content;
    const second = mod.buildRebuildMap(groups, packages).content;
    expect(second).toBe(first);
    const parsed = parseContent(first);
    expect(parsed.map).toHaveLength(229);
    expect(parsed.source).not.toHaveLength(0);
    const byLevel = levelsByLevel(parsed);
    for (const level of LEVELS) {
      expect(byLevel.get(level)).toMatchObject({
        level,
        kept: EXPECTED_KEPT[level],
        packages: EXPECTED_PACKAGES[level],
        mapped: EXPECTED_KEPT[level],
      });
    }
    expect(new Set(parsed.map.map((row) => row.keepId)).size).toBe(229);
    expect([...parsed.map.map((row) => row.keepId)].sort()).toEqual([...groups.map((g) => g.keep)].sort());
    const used = [...parsed.map.map((row) => row.package), ...parsed.newIds.map((row) => row.package)];
    expect(new Set(used).size).toBe(550);
    expect([...used].sort()).toEqual([...packages.map((p) => p.id)].sort());
    const groupLevel = new Map(groups.map((g) => [g.keep, g.level]));
    const packageLevel = new Map(packages.map((p) => [p.id, p.level]));
    for (const row of parsed.map) {
      expect(groupLevel.get(row.keepId)).toBe(row.level);
      expect(packageLevel.get(row.package)).toBe(row.level);
    }
    const newPerLevel: Record<number, number> = { 5: 0, 6: 12, 7: 96, 8: 112, 9: 101 };
    for (const level of LEVELS) {
      expect(parsed.newIds.filter((row) => row.level === level)).toHaveLength(newPerLevel[level]);
    }
    expect(first).not.toContain('REPO_ROOT');
    expect(first).not.toContain('os.tmpdir()');
    expect(first).not.toContain('/home/');
  });

  it('writes byte-identical files on two runs', () => {
    const dir = makeTmp();
    const out1 = path.join(dir, 'map-1.json');
    const out2 = path.join(dir, 'map-2.json');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(
        mod.main(['--duplicates', COMMITTED_DUPES, '--content-root', CONTENT_ROOT, '--out-json', out1]),
      ).toBe(0);
      expect(
        mod.main(['--duplicates', COMMITTED_DUPES, '--content-root', CONTENT_ROOT, '--out-json', out2]),
      ).toBe(0);
    } finally {
      logSpy.mockRestore();
      errSpy.mockRestore();
    }
    expect(fs.readFileSync(out1, 'utf8')).toBe(fs.readFileSync(out2, 'utf8'));
  });

  it('matches the committed map file with a fresh run', () => {
    const fresh = mod.buildRebuildMap(readKeepGroups(), enumeratePackages(CONTENT_ROOT)).content;
    expect(fs.readFileSync(COMMITTED_MAP, 'utf8')).toBe(fresh);
  });
});
