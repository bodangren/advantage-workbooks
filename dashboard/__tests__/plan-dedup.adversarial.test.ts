// @vitest-environment node
// Adversarial round for Phase 1G (track levels_5_9_20261006), Task 1.G4.
// Surfaces: path resolution (F1), displayPath (F11), keepCount (F7), the
// missing file (F13), no-readAt (F10), level and target edges, determinism.
// Every test writes only under os.tmpdir(). No repository file changes.
// A test that pins behavior the plan does not state says so in a comment.
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-dedup-adv-'));
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

let wordSeq = 0;
const UNIQUE_WORDS = ['loris', 'serval', 'fossa', 'potto', 'bongo', 'kudu', 'ibex', 'gerbil'];

/** Short invented text. No passage comes from a private source. */
function art(id: string, raLevel: number, word?: string, use = 0): Article {
  const w = word ?? UNIQUE_WORDS[wordSeq++ % UNIQUE_WORDS.length];
  const day = String(1 + (wordSeq % 27)).padStart(2, '0');
  return {
    id,
    raLevel,
    title: `Tale of the ${w}`,
    type: 'fiction',
    genre: 'Animals',
    approved: false,
    createdAt: `2026-04-${day}T04:05:06.000Z`,
    words: 40,
    summary: `A short tale about a ${w}.`,
    passage: `The ${w} runs. Runs the ${w}.`,
    use: { progress: use, assignments: 0, activityLogs: 0 },
  };
}

/** Run main with both consoles silenced. Read the calls before the restore. */
function run(argv: string[]): { code: number; err: string; out: string } {
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  let code = 0;
  let err = '';
  let out = '';
  try {
    code = mod.main(argv);
  } finally {
    err = errSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
    out = logSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n');
    errSpy.mockRestore();
    logSpy.mockRestore();
  }
  return { code, err, out };
}

function writeInv(dir: string, name: string, inv: unknown): string {
  const file = path.join(dir, name);
  fs.writeFileSync(file, JSON.stringify(inv));
  return file;
}

/** The count line under a `## Level <n>` heading. */
function levelLine(md: string, level: number): string {
  const lines = md.split('\n');
  const start = lines.findIndex((line) => line === `## Level ${level}`);
  if (start < 0) throw new Error(`missing Level ${level} section`);
  return lines[start + 2];
}

describe('displayPath edge cases', () => {
  it('treats a sibling folder whose name starts with the repository name as outside', () => {
    // Plan line 51: inside REPO_ROOT shows the repo-relative form, else the basename.
    // A plain string-prefix check would wrongly treat REPO_ROOT + '-other' as inside.
    expect(mod.displayPath(path.join(REPO_ROOT + '-other', 'x.json'))).toBe('x.json');
    expect(mod.displayPath(path.join(REPO_ROOT + '2026', 'y.json'))).toBe('y.json');
  });

  it('resolves dot-dot segments before the inside check', () => {
    const inside = path.resolve(REPO_ROOT, 'docs/content-plans/data/../data/dupes.json');
    expect(mod.displayPath(inside)).toBe('docs/content-plans/data/dupes.json');
    const outside = path.resolve(REPO_ROOT, '../dupes.json');
    expect(mod.displayPath(outside)).toBe('dupes.json');
  });
});

describe('a symlinked output folder', () => {
  it('runs through the symlink and leaks no machine path', () => {
    // displayPath works on the given string, not on a resolved real path (plan line 51).
    const real = makeTmp();
    const link = path.join(makeTmp(), 'linked-out');
    fs.symlinkSync(real, link);
    const inv = writeInv(real, 'inv.json', {
      readAt: '2026-11-19T00:00:00.000Z',
      articles: [art('sy1', 5), art('sy2', 5)],
    });
    const outJson = path.join(link, 'out.json');
    const outMd = path.join(link, 'out.md');
    const { code } = run([
      '--inventory', inv,
      '--levels', '5',
      '--targets', '5=50',
      '--out-json', outJson,
      '--out-md', outMd,
    ]);
    expect(code).toBe(0);
    expect(fs.existsSync(path.join(real, 'out.json'))).toBe(true);
    const md = fs.readFileSync(outMd, 'utf8');
    const json = fs.readFileSync(outJson, 'utf8');
    expect(md).toContain('stay in `out.json`');
    for (const text of [md, json]) {
      expect(text).not.toContain(REPO_ROOT);
      expect(text).not.toContain(os.tmpdir());
    }
  });
});

describe('level list edges', () => {
  it('trims spaces around level entries but rejects spaces inside targets', () => {
    // The plan names no space rule (plan line 52). This test pins the current asymmetry.
    const dir = makeTmp();
    const parsedLevels = mod.parseDedupArgs([
      '--inventory', path.join(dir, 'inv.json'),
      '--levels', '5, 6',
      '--targets', '5=50,6=100',
    ]);
    expect((parsedLevels as ParseOk).ok).toBe(true);
    expect((parsedLevels as ParseOk).options.levels).toEqual([5, 6]);
    const parsedTargets = mod.parseDedupArgs([
      '--inventory', path.join(dir, 'inv.json'),
      '--levels', '5,6',
      '--targets', '5=50, 6=100',
    ]);
    expect((parsedTargets as ParseFail).ok).toBe(false);
  });

  it('accepts a duplicated level entry and keeps both occurrences', () => {
    // The plan names no duplicate rule (plan line 52 lists the list shape only).
    // This test pins the current parse so a silent change surfaces.
    const dir = makeTmp();
    const parsed = mod.parseDedupArgs([
      '--inventory', path.join(dir, 'inv.json'),
      '--levels', '5,5',
      '--targets', '5=50',
    ]);
    expect((parsed as ParseOk).ok).toBe(true);
    expect((parsed as ParseOk).options.levels).toEqual([5, 5]);
  });
});

describe('target value edges', () => {
  it('treats a target of 0 as already met', () => {
    // Plan line 61 (F7): a printed count at or above the target keeps 0 online articles.
    // Zero printed meets a target of 0, so the run keeps nothing.
    const dir = makeTmp();
    const inv = writeInv(dir, 'inv.json', {
      readAt: '2026-11-19T00:00:00.000Z',
      articles: [art('z1', 5), art('z2', 5)],
    });
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { code } = run([
      '--inventory', inv,
      '--levels', '5',
      '--targets', '5=0',
      '--out-json', outJson,
      '--out-md', outMd,
    ]);
    expect(code).toBe(0);
    const data = JSON.parse(fs.readFileSync(outJson, 'utf8')) as { groups: unknown[] };
    expect(data.groups).toHaveLength(0);
    expect(levelLine(fs.readFileSync(outMd, 'utf8'), 5)).toBe(
      '2 articles: 0 printed, 2 online. Keep 0 online articles; the printed articles already meet the target.',
    );
  });

  it('rejects a negative, fractional, or empty target', () => {
    const dir = makeTmp();
    for (const targets of ['5=-1', '5=1.5', '5=']) {
      const argv = ['--inventory', path.join(dir, 'inv.json'), '--levels', '5', '--targets', targets];
      const parsed = mod.parseDedupArgs(argv);
      expect((parsed as ParseFail).ok).toBe(false);
      const { code, err, out } = run(argv);
      expect(code).toBe(2);
      expect(out).toBe('');
      expect(err).toContain((parsed as ParseFail).message);
      expect(err.indexOf((parsed as ParseFail).message)).toBeLessThan(err.indexOf('Usage'));
    }
  });
});

describe('a level with no article', () => {
  it('writes the empty level line and no group', () => {
    // The plan states no rule for a listed level without articles. Pin the current line.
    const dir = makeTmp();
    const inv = writeInv(dir, 'inv.json', {
      readAt: '2026-11-19T00:00:00.000Z',
      articles: [art('e1', 5), art('e2', 5)],
    });
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { code } = run([
      '--inventory', inv,
      '--levels', '5,6',
      '--targets', '5=50,6=50',
      '--out-json', outJson,
      '--out-md', outMd,
    ]);
    expect(code).toBe(0);
    const data = JSON.parse(fs.readFileSync(outJson, 'utf8')) as { groups: { level: number }[] };
    expect(data.groups.filter((g) => g.level === 5)).toHaveLength(2);
    expect(data.groups.filter((g) => g.level === 6)).toHaveLength(0);
    expect(levelLine(fs.readFileSync(outMd, 'utf8'), 6)).toBe(
      '0 articles: 0 printed, 0 online. Keep all 0 online articles; none is similar to another.',
    );
  });
});

describe('a printed count above the target', () => {
  it('keeps 0 online articles and never a negative keep count', () => {
    // Plan line 70 (F7): keepCount is never negative. Here the target minus the
    // printed count is -1, so a dropped guard would hang or crash the cluster.
    const dir = makeTmp();
    const inv = writeInv(dir, 'inv.json', {
      readAt: '2026-11-19T00:00:00.000Z',
      articles: [art('q1', 7), art('q2', 7), art('q3', 7), art('o1', 7), art('o2', 7)],
    });
    const printedPath = writeInv(dir, 'printed.json', {
      articles: [
        { id: 'q1', printed: true },
        { id: 'q2', printed: true },
        { id: 'q3', printed: true },
      ],
    });
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { code } = run([
      '--inventory', inv,
      '--levels', '7',
      '--targets', '7=2',
      '--printed', printedPath,
      '--out-json', outJson,
      '--out-md', outMd,
    ]);
    expect(code).toBe(0);
    const data = JSON.parse(fs.readFileSync(outJson, 'utf8')) as { groups: { level: number }[] };
    expect(data.groups.filter((g) => g.level === 7)).toHaveLength(0);
    expect(levelLine(fs.readFileSync(outMd, 'utf8'), 7)).toBe(
      '5 articles: 3 printed, 2 online. Keep 0 online articles; the printed articles already meet the target.',
    );
  });
});

describe('inventory levels outside --levels', () => {
  it('ignores an article whose level is not listed', () => {
    const dir = makeTmp();
    const inv = writeInv(dir, 'inv.json', {
      readAt: '2026-11-19T00:00:00.000Z',
      articles: [art('i5a', 5), art('i5b', 5), art('i6a', 6), art('i6b', 6)],
    });
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { code } = run([
      '--inventory', inv,
      '--levels', '5',
      '--targets', '5=50',
      '--out-json', outJson,
      '--out-md', outMd,
    ]);
    expect(code).toBe(0);
    const json = fs.readFileSync(outJson, 'utf8');
    const md = fs.readFileSync(outMd, 'utf8');
    const data = JSON.parse(json) as { groups: { level: number }[] };
    expect(data.groups).toHaveLength(2);
    expect(data.groups.every((g) => g.level === 5)).toBe(true);
    expect(json).not.toContain('i6a');
    expect(json).not.toContain('i6b');
    expect(md).not.toContain('## Level 6');
  });
});

describe('an empty inventory', () => {
  it('exits 0 and writes no group', () => {
    const dir = makeTmp();
    const inv = writeInv(dir, 'inv-empty.json', {
      readAt: '2026-11-19T00:00:00.000Z',
      articles: [],
    });
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { code } = run([
      '--inventory', inv,
      '--levels', '5',
      '--targets', '5=50',
      '--out-json', outJson,
      '--out-md', outMd,
    ]);
    expect(code).toBe(0);
    const data = JSON.parse(fs.readFileSync(outJson, 'utf8')) as { groups: unknown[] };
    expect(data.groups).toHaveLength(0);
    expect(levelLine(fs.readFileSync(outMd, 'utf8'), 5)).toBe(
      '0 articles: 0 printed, 0 online. Keep all 0 online articles; none is similar to another.',
    );
  });

  it('accepts an inventory without an articles key', () => {
    const dir = makeTmp();
    const inv = writeInv(dir, 'inv-bare.json', {});
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { code } = run([
      '--inventory', inv,
      '--levels', '5',
      '--targets', '5=50',
      '--out-json', outJson,
      '--out-md', outMd,
    ]);
    expect(code).toBe(0);
    const json = fs.readFileSync(outJson, 'utf8');
    const md = fs.readFileSync(outMd, 'utf8');
    expect(json).toContain('inventory of inv-bare.json');
    expect(md).toContain('inventory of inv-bare.json');
    expect(json).not.toContain('undefined');
    expect(md).not.toContain('undefined');
  });
});

describe('an inventory with an empty readAt', () => {
  it('falls back to the inventory file name', () => {
    // Plan line 62 (F10) covers a missing readAt. An empty string is no usable readAt.
    const dir = makeTmp();
    const inv = writeInv(dir, 'inv-no-readat.json', {
      readAt: '',
      articles: [art('r1', 5), art('r2', 5)],
    });
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const { code } = run([
      '--inventory', inv,
      '--levels', '5',
      '--targets', '5=50',
      '--out-json', outJson,
      '--out-md', outMd,
    ]);
    expect(code).toBe(0);
    const json = fs.readFileSync(outJson, 'utf8');
    const md = fs.readFileSync(outMd, 'utf8');
    expect(json).toContain('inventory of inv-no-readat.json');
    expect(md).toContain('inventory of inv-no-readat.json');
    expect(md).not.toContain('inventory of .');
  });
});

describe('determinism and identical keep titles', () => {
  it('gives the same bytes on two runs of the same input', () => {
    // The plan claims no input-order independence (plan line 54 fixes the input order).
    // Two runs of the same input must agree byte for byte.
    const dir = makeTmp();
    const same = (id: string, use: number, body: string): Article => ({
      id,
      raLevel: 7,
      title: 'Same Title Story',
      type: 'fiction',
      genre: 'Animals',
      approved: false,
      createdAt: '2026-04-01T00:00:00.000Z',
      words: 40,
      summary: 'A same title story.',
      passage: body,
      use: { progress: use, assignments: 0, activityLogs: 0 },
    });
    const inv = writeInv(dir, 'inv.json', {
      readAt: '2026-11-19T00:00:00.000Z',
      articles: [
        same('x1', 5, 'alpha alpha alpha'),
        same('x2', 0, 'alpha alpha alpha'),
        same('y1', 3, 'bravo bravo bravo'),
        same('y2', 0, 'bravo bravo bravo'),
      ],
    });
    const outJson = path.join(dir, 'out.json');
    const outMd = path.join(dir, 'out.md');
    const argv = [
      '--inventory', inv,
      '--levels', '7',
      '--targets', '7=2',
      '--out-json', outJson,
      '--out-md', outMd,
    ];
    expect(run(argv).code).toBe(0);
    const json1 = fs.readFileSync(outJson, 'utf8');
    const md1 = fs.readFileSync(outMd, 'utf8');
    expect(run(argv).code).toBe(0);
    expect(fs.readFileSync(outJson, 'utf8')).toBe(json1);
    expect(fs.readFileSync(outMd, 'utf8')).toBe(md1);
    // The two groups hold one identical keep title each (plan line 58 template).
    const data = JSON.parse(json1) as { groups: { keep: string; level: number }[] };
    expect(data.groups.filter((g) => g.level === 7)).toHaveLength(2);
    expect(data.groups.map((g) => g.keep).sort()).toEqual(['x1', 'y1']);
    const rows = md1.split('\n').filter((line) => line.startsWith('| Same Title Story'));
    expect(rows).toHaveLength(2);
    expect(rows.join('\n')).toContain('`x1`');
    expect(rows.join('\n')).toContain('`y1`');
    expect(levelLine(md1, 7)).toBe(
      '4 articles: 0 printed, 4 online. Keep 2 online articles; 2 are similar to a kept one. 2 groups have more than one article; the weakest merge had similarity 1.00.',
    );
  });
});

describe('the levels 5-9 output and the levels 1-4 run', () => {
  it('names no levels 1-4 string in a levels 5-9 output', () => {
    // Exact 1-4 strings, not bare words, so a real hit cannot drop through a word filter (A7).
    const dir = makeTmp();
    const inv = writeInv(dir, 'inv.json', {
      readAt: '2026-11-19T00:00:00.000Z',
      articles: [art('k1', 5), art('k2', 5)],
    });
    const outJson = path.join(dir, 'dupes-5-9.json');
    const outMd = path.join(dir, 'dupes-5-9.md');
    const { code } = run([
      '--inventory', inv,
      '--levels', '5,6,7,8,9',
      '--targets', '5=50,6=100,7=100,8=150,9=150',
      '--out-json', outJson,
      '--out-md', outMd,
    ]);
    expect(code).toBe(0);
    for (const file of [outJson, outMd]) {
      const text = fs.readFileSync(file, 'utf8');
      expect(text).not.toContain('Levels 1\u20134');
      expect(text).not.toContain('level_banks_20261002');
      expect(text).not.toContain('duplicates-levels-1-4');
      expect(text).not.toContain('| Keep | Delete (similar) |');
      expect(text).not.toContain('in total with the printed ones');
      expect(text).not.toContain('delete all but the best');
    }
  });
});

describe('a missing inventory given as a relative path', () => {
  it('names the resolved path, then the usage, and exits 2', () => {
    // Review C F3 (DECLINE): the message prints the resolved absolute path.
    // This test pins that accepted behavior.
    const dir = makeTmp();
    const argv = [
      '--inventory', 'no-such-inventory.json',
      '--levels', '5',
      '--targets', '5=50',
      '--out-json', path.join(dir, 'out.json'),
      '--out-md', path.join(dir, 'out.md'),
    ];
    const { code, err, out } = run(argv);
    expect(code).toBe(2);
    expect(out).toBe('');
    const resolved = path.resolve('no-such-inventory.json');
    expect(err).toContain(`inventory file not found: ${resolved}`);
    expect(err.indexOf(`inventory file not found: ${resolved}`)).toBeLessThan(err.indexOf('Usage'));
    expect(err.split('\n').filter((line) => line.startsWith('    at '))).toHaveLength(0);
  });
});
