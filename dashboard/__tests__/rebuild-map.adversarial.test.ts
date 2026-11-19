// @vitest-environment node
// Adversarial round for Phase 7R (rebuild map), audited head b5cab6da,
// 2026-11-19. Reviews A and B passed at that head
// (measure/runs/levels_5_9_20261006/review-a-7r-b5cab6da.json,
// review-b-7r-b5cab6da.json). This file closes their findings as tests:
//
//   A-F1: a default-input run through the script's own folder reader must
//         write the committed map byte for byte. The Red file enumerates the
//         package folders itself, so a reversed reader order (Green mutant d)
//         survived gate 1; this test reads the reader, not a test-side list.
//   A-F2: a level with more kept ids than packages must fail the run before
//         any write.
//   B-F1 [DEFECT at b5cab6da, routed to Green]: a --duplicates file with no
//         groups key, or with an empty groups array, must be rejected:
//         exit non-zero and the existing out file stays byte-identical.
//         test-strategy 7R.5 rows 'A missing kept id' and 'Count mismatch'
//         cover this: an empty map is a missing kept id per level and a count
//         mismatch against the keep counts 50, 88, 4, 38, 49.
//   B-F2 [DEFECT at b5cab6da, routed to Green]: a --out-json whose parent
//         folder does not exist must exit 2 with no stack trace and write
//         nothing.
//
// Risk edges: an unknown level must leave an existing out file untouched; the
// same keep id in two groups of different levels must fail; a duplicates file
// that is not valid JSON must fail. A group with no keep key is uncontracted:
// the test pins the current behavior as evidence, and the plan and the
// strategy state no rule for it.
//
// Thai rule: this file never opens a lesson package JSON under content/. The
// default-input run reads the committed duplicates JSON (ids and counts) and
// lists package file names only.
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { REPO_ROOT } from '../lib/lesson-package/files';

type KeepGroup = { level: number; keep: string };
type PackageRef = { level: number; id: string };
type MapRow = { level: number; keepId: string; package: string };
type NewIdRow = { level: number; package: string };
type LevelsRow = { level: number; kept: number; packages: number; mapped: number };
type RebuildMapJson = { source: string; levels: LevelsRow[]; map: MapRow[]; newIds: NewIdRow[] };
type RebuildMapModule = {
  buildRebuildMap: (groups: KeepGroup[], packages: PackageRef[]) => { content: string; log: string[] };
  main: (argv: string[]) => number;
};

let mod: RebuildMapModule;
const tmpDirs: string[] = [];

function makeTmp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rebuild-map-adv-'));
  tmpDirs.push(dir);
  return dir;
}

/** Makes a fixture content root: book folders that hold empty lesson files. */
function makeContentRoot(books: { book: string; lessons: string[] }[]): string {
  const root = makeTmp();
  for (const { book, lessons } of books) {
    fs.mkdirSync(path.join(root, book), { recursive: true });
    for (const lesson of lessons) fs.writeFileSync(path.join(root, book, `${lesson}.json`), '{"fixture":true}');
  }
  return root;
}

/**
 * Runs main with console spies. Reads the spy calls before the restore, so the
 * captured text survives (the Phase 1G Red lesson).
 * @param argv The command line without the script name.
 * @returns The exit code, stdout, and stderr of the run.
 */
function runMain(argv: string[]): { code: number; stdout: string; stderr: string } {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const code = mod.main(argv);
    return {
      code,
      stdout: logSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n'),
      stderr: errSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n'),
    };
  } finally {
    logSpy.mockRestore();
    errSpy.mockRestore();
  }
}

/** The stack-trace lines of a stderr capture; a clean failure holds none. */
function stackLines(stderr: string): string[] {
  return stderr.split('\n').filter((line) => line.startsWith('    at '));
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

const COMMITTED_MAP = path.join(REPO_ROOT, 'docs/content-plans/data/rebuild-map-levels-5-9.json');
const CONTENT_ROOT = path.join(REPO_ROOT, 'content/primary');

describe('A-F1: a default-input run through the script reader', () => {
  it('a default-input run writes the committed map byte for byte', () => {
    const out = path.join(makeTmp(), 'map.json');
    // Only --out-json is given, so the run reads the default duplicates JSON
    // and enumerates the default content root with the script's own reader.
    const { code } = runMain(['--out-json', out]);
    expect(code).toBe(0);
    expect(fs.readFileSync(out, 'utf8')).toBe(fs.readFileSync(COMMITTED_MAP, 'utf8'));
  });
});

describe('A-F2: a level with more kept ids than packages', () => {
  it('throws from buildRebuildMap when a level has more kept ids than packages', () => {
    const groups: KeepGroup[] = [
      { level: 5, keep: 'keep-5-a' },
      { level: 5, keep: 'keep-5-b' },
    ];
    const packages: PackageRef[] = [{ level: 5, id: 'quest-5/l01' }];
    expect(() => mod.buildRebuildMap(groups, packages)).toThrow(/level 5/);
  });

  it('exits 2 from main and writes no file when a level has more kept ids than packages', () => {
    const dir = makeTmp();
    const dupes = path.join(dir, 'dupes.json');
    fs.writeFileSync(
      dupes,
      JSON.stringify({ groups: [{ level: 5, keep: 'keep-5-a' }, { level: 5, keep: 'keep-5-b' }] }),
    );
    const root = makeContentRoot([{ book: 'quest-5', lessons: ['l01'] }]);
    const out = path.join(dir, 'map.json');
    const { code, stderr } = runMain(['--duplicates', dupes, '--content-root', root, '--out-json', out]);
    expect(code).toBe(2);
    expect(stderr).toContain('Usage');
    expect(stackLines(stderr)).toHaveLength(0);
    expect(fs.existsSync(out)).toBe(false);
  });
});

describe('B-F1: a wrong duplicates shape must not replace the out file', () => {
  it('rejects a duplicates file with no groups key: exit 2, out file byte-identical', () => {
    const dir = makeTmp();
    const dupes = path.join(dir, 'no-groups.json');
    fs.writeFileSync(dupes, JSON.stringify({ source: 'fixture without groups' }));
    const out = path.join(dir, 'out.json');
    const sentinel = 'sentinel: the injector input file must stay unchanged';
    fs.writeFileSync(out, sentinel);
    const { code } = runMain(['--duplicates', dupes, '--content-root', CONTENT_ROOT, '--out-json', out]);
    expect(code).toBe(2);
    expect(fs.readFileSync(out, 'utf8')).toBe(sentinel);
  });

  it('rejects a duplicates file with an empty groups array: exit 2, out file byte-identical', () => {
    const dir = makeTmp();
    const dupes = path.join(dir, 'empty-groups.json');
    fs.writeFileSync(dupes, JSON.stringify({ groups: [] }));
    const out = path.join(dir, 'out.json');
    const sentinel = 'sentinel: the injector input file must stay unchanged';
    fs.writeFileSync(out, sentinel);
    const { code } = runMain(['--duplicates', dupes, '--content-root', CONTENT_ROOT, '--out-json', out]);
    expect(code).toBe(2);
    expect(fs.readFileSync(out, 'utf8')).toBe(sentinel);
  });
});

describe('B-F2: a failed write', () => {
  it('exits 2 when the out folder does not exist, with no stack trace, and writes nothing', () => {
    const dir = makeTmp();
    const dupes = path.join(dir, 'dupes.json');
    fs.writeFileSync(dupes, JSON.stringify({ groups: [{ level: 5, keep: 'keep-5-a' }] }));
    const root = makeContentRoot([{ book: 'quest-5', lessons: ['l01'] }]);
    const out = path.join(dir, 'no-such-folder', 'map.json');
    const { code, stderr } = runMain(['--duplicates', dupes, '--content-root', root, '--out-json', out]);
    expect(code).toBe(2);
    expect(stderr).toContain('Usage');
    expect(stackLines(stderr)).toHaveLength(0);
    expect(fs.existsSync(path.join(dir, 'no-such-folder'))).toBe(false);
  });
});

describe('risk edges', () => {
  it('exits 2 on an unknown level and leaves an existing out file untouched', () => {
    const dir = makeTmp();
    const dupes = path.join(dir, 'dupes.json');
    fs.writeFileSync(
      dupes,
      JSON.stringify({ groups: [{ level: 5, keep: 'keep-5-a' }, { level: 4, keep: 'keep-4-a' }] }),
    );
    const root = makeContentRoot([{ book: 'quest-5', lessons: ['l01'] }]);
    const out = path.join(dir, 'out.json');
    const sentinel = 'sentinel: a failed run must not touch the out file';
    fs.writeFileSync(out, sentinel);
    const { code, stderr } = runMain(['--duplicates', dupes, '--content-root', root, '--out-json', out]);
    expect(code).toBe(2);
    expect(stderr).toContain('Usage');
    expect(stackLines(stderr)).toHaveLength(0);
    expect(fs.readFileSync(out, 'utf8')).toBe(sentinel);
  });

  it('rejects the same keep id in two groups of different levels', () => {
    expect(() =>
      mod.buildRebuildMap(
        [
          { level: 5, keep: 'same-keep' },
          { level: 6, keep: 'same-keep' },
        ],
        [],
      ),
    ).toThrow();
    const dir = makeTmp();
    const dupes = path.join(dir, 'dupes.json');
    fs.writeFileSync(
      dupes,
      JSON.stringify({ groups: [{ level: 5, keep: 'same-keep' }, { level: 6, keep: 'same-keep' }] }),
    );
    const root = makeContentRoot([
      { book: 'quest-5', lessons: ['l01'] },
      { book: 'quest-6.1', lessons: ['l01'] },
    ]);
    const out = path.join(dir, 'map.json');
    const { code, stderr } = runMain(['--duplicates', dupes, '--content-root', root, '--out-json', out]);
    expect(code).toBe(2);
    expect(stderr).toContain('Usage');
    expect(stackLines(stderr)).toHaveLength(0);
    expect(fs.existsSync(out)).toBe(false);
  });

  it('maps a group with no keep key to the keep id "undefined" (current behavior; uncontracted)', () => {
    const dir = makeTmp();
    const dupes = path.join(dir, 'dupes.json');
    fs.writeFileSync(dupes, JSON.stringify({ groups: [{ level: 5 }] }));
    const root = makeContentRoot([{ book: 'quest-5', lessons: ['l01'] }]);
    const out = path.join(dir, 'map.json');
    const { code } = runMain(['--duplicates', dupes, '--content-root', root, '--out-json', out]);
    expect(code).toBe(0);
    const parsed = JSON.parse(fs.readFileSync(out, 'utf8')) as RebuildMapJson;
    expect(parsed.map).toHaveLength(1);
    expect(parsed.map[0]).toMatchObject({ level: 5, keepId: 'undefined', package: 'quest-5/l01' });
    expect(parsed.newIds).toHaveLength(0);
  });

  it('exits 2 on a duplicates file that is not valid JSON and leaves an existing out file untouched', () => {
    const dir = makeTmp();
    const dupes = path.join(dir, 'broken.json');
    fs.writeFileSync(dupes, '{"groups": [{"level": 5, "keep"');
    const root = makeContentRoot([{ book: 'quest-5', lessons: ['l01'] }]);
    const out = path.join(dir, 'out.json');
    const sentinel = 'sentinel: a failed run must not touch the out file';
    fs.writeFileSync(out, sentinel);
    const { code, stderr } = runMain(['--duplicates', dupes, '--content-root', root, '--out-json', out]);
    expect(code).toBe(2);
    expect(stderr).toContain('Usage');
    expect(stackLines(stderr)).toHaveLength(0);
    expect(fs.readFileSync(out, 'utf8')).toBe(sentinel);
  });
});