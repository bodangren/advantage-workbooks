// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkStorytimeWeek, taughtTo } from '../lib/storytime/checks';
import {
    readLevelWeeks,
    readUnitWeeks,
} from '../lib/storytime/files';
import { storytimeCardKitFileNames } from '../lib/storytime/print/card-kit-cli';
import { storytimeStudentBookPages } from '../lib/storytime/print/step-pages';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import {
    storytimeCardPictureRows,
    storytimePrintPictures,
} from '../lib/storytime/print/pictures';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Track storytime_l2_unit2_20261106, Task 4.1 retry 2 (Red, spec FR-6): the Review A
 * findings of `review-a-p134-7b0ab12c.json` as behavior of the real code.
 *
 * Every test below exercises a maker, a script, or a check through its real entry
 * point on the published week files of `content/storytime/l2/` (16 weeks after the
 * Task 4.3 move). No test reads a staged path, and no test holds a Thai literal:
 * week files are parsed at runtime and only statuses, ids, and counts are asserted.
 * A test that passes at HEAD is a guard; a test named with its finding fails at
 * HEAD and passes after the Green round 2 fix.
 */

const dashboardRoot = process.cwd().includes('dashboard')
    ? process.cwd()
    : path.resolve(process.cwd(), 'dashboard');
const repoRoot = path.resolve(dashboardRoot, '..');
const storytimeRoot = path.join(repoRoot, 'content', 'storytime');

/** The 9 unit 1 reuse ids of the plan Add 2026-11-10 (Review A F1). */
const REUSE_IDS = [
    'l2-w10-d4-prompt-hat',
    'l2-w16-check-row-apple',
    'l2-w16-check-row-bag',
    'l2-w16-check-row-nest',
    'l2-w16-check-row-net',
    'l2-w16-check-row-nose',
    'l2-w16-check-row-octopus',
    'l2-w16-check-row-ostrich',
    'l2-w16-check-row-ox',
];

/** The Phase 2 contract of the unit 2 picture list (229 rows). */
const contractU2 = path.join(storytimeRoot, 'drafts', 'l2', 'print', 'pictures-u2.json');

/** The committed unit 1 picture list. */
const committedU1 = path.join(storytimeRoot, 'l2', 'print', 'pictures.json');

/** The published unit 2 card entries. */
const unit2CardEntries = path.join(storytimeRoot, 'l2', 'print', 'u2', 'card-pictures.json');

/** The temp roots of this file, removed after the last test. */
const tempRoots: string[] = [];

afterAll(() => {
    while (tempRoots.length) {
        const root = tempRoots.pop() as string;
        fs.rmSync(root, { recursive: true, force: true });
    }
});

/** Reads and parses one JSON file. */
function readJson(file: string): any {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** The published weeks of unit 1 (1 to 8) and unit 2 (9 to 16), parsed. */
function publishedWeeks(first: number, last: number): StorytimeWeek[] {
    const weeks: StorytimeWeek[] = [];
    for (let week = first; week <= last; week++) {
        weeks.push(StorytimeWeekSchema.parse(readJson(path.join(storytimeRoot, 'l2', `w${String(week).padStart(2, '0')}.json`))));
    }
    return weeks;
}

/** The status of one check of a week report; the row must exist (plan F11). */
function checkStatus(report: { checks: { id: string; status: string }[] }, id: string): string {
    const row = report.checks.find((c) => c.id === id);
    expect(row, `the check row ${id} is present`).toBeDefined();
    return (row as { status: string }).status;
}

/**
 * Mirrors the published storytime tree into a temp root with symlinked files, so a
 * maker that writes picture lists or step maps writes real files in the temp root
 * and never through a link into the repository.
 * @returns The temp root (the folder holding `content/`).
 */
function mirrorStorytimeToTemp(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u2p4-'));
    tempRoots.push(root);
    const mirror = (src: string, out: string): void => {
        fs.mkdirSync(out, { recursive: true });
        for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
            if (entry.name === 'node_modules') continue;
            const from = path.join(src, entry.name);
            const to = path.join(out, entry.name);
            if (entry.isDirectory()) mirror(from, to);
            else fs.symlinkSync(from, to);
        }
    };
    mirror(storytimeRoot, path.join(root, 'content', 'storytime'));
    fs.rmSync(path.join(root, 'content', 'storytime', 'l2', 'print', 'pictures.json'), { force: true });
    fs.rmSync(path.join(root, 'content', 'storytime', 'l2', 'print', 'pictures.md'), { force: true });
    fs.rmSync(path.join(root, 'content', 'storytime', 'l2', 'print', 'u2'), { recursive: true, force: true });
    fs.rmSync(path.join(root, 'content', 'storytime', 'l2', 'step-map-u1.json'), { force: true });
    fs.rmSync(path.join(root, 'content', 'storytime', 'l2', 'step-map-u2.json'), { force: true });
    return root;
}

/**
 * Runs a command synchronously and returns its standard output.
 * @param cmd The command.
 * @param args The arguments.
 * @param cwd The working folder.
 * @returns The standard output.
 */
function execSync0(cmd: string, args: string[], cwd?: string): string {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', timeout: 300_000 });
}

/**
 * The snapshot eval: it compiles the unit 1 print outputs with the unit 1 weeks
 * and prints one SHA-256 per output. It runs at the phase base (mode base, 8 weeks
 * on disk) and at HEAD (mode head, unit 1 filtered from both units).
 */
const SNAP_EVAL = `import crypto from 'node:crypto';
import { readLevelWeeks, STORYTIME_ROOT } from './lib/storytime/files';
import { compileStorytimeStudentBook } from './lib/storytime/print/student-book';
import { compileStorytimeManual } from './lib/storytime/manual';
import { compileStorytimeReaders } from './lib/storytime/print/readers';
import { compileStorytimeCardSheet, compileStorytimeStickerSheet, storytimeCardKit } from './lib/storytime/print/card-kit';
import { storytimeStepMapFiles } from './lib/storytime/print/step-pages';
import { pictureListMarkdown, storytimePrintPictures } from './lib/storytime/print/pictures';
import { STORYTIME_PRINT_PROFILE } from './lib/storytime/print/profile';
const norm = (s: string): string => s.replace(/file:\\/\\/\\/[^'"()\\s]*?(dashboard\\/assets|content\\/storytime)/g, 'file://ROOT/$1');
const sha = (s: string): string => crypto.createHash('sha256').update(norm(s), 'utf8').digest('hex');
const mode = process.env.U2_SNAP_MODE ?? 'base';
const all = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((r) => (r.week ? [r.week] : []));
const weeks = mode === 'base' ? all : all.filter((w) => w.meta.unit === 1);
const out: Record<string, string> = {};
const take = (name: string, fn: () => string): void => {
    try { out[name] = 'ok:' + sha(fn()); } catch (e) { out[name] = 'ERROR:' + (e instanceof Error ? e.message : String(e)); }
};
take('student-book', () => compileStorytimeStudentBook(weeks, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' }).html);
take('teacher-book', () => compileStorytimeManual(weeks, { lang: 'th', paper: 'a4', loops: true }).html);
take('readers', () => compileStorytimeReaders(weeks.slice(0, 7), { profile: STORYTIME_PRINT_PROFILE, mode: 'proof', output: 'workbook' }).html);
take('card-a5', () => compileStorytimeCardSheet(storytimeCardKit(weeks).cards, 'A5', { title: 'Storytime Advantage, Level 2, Unit 1 Card Kit, A5 cards' }).html);
take('card-a6', () => compileStorytimeCardSheet(storytimeCardKit(weeks).cards, 'A6', { title: 'Storytime Advantage, Level 2, Unit 1 Card Kit, A6 cards' }).html);
take('card-stickers', () => compileStorytimeStickerSheet(storytimeCardKit(weeks).items, { title: 'Storytime Advantage, Level 2, Unit 1 Card Kit, sticker sheet' }).html);
take('step-map', () => storytimeStepMapFiles(weeks).map((f) => f.name + '\\n' + f.text).join('\\n'));
take('pictures', () => JSON.stringify(storytimePrintPictures(weeks), null, 1));
take('pictures-md', () => pictureListMarkdown(storytimePrintPictures(weeks), 2));
out.weeks = weeks.map((w) => String(w.meta.week)).join(',');
console.log(JSON.stringify(out));
`;

/**
 * Adds the phase base worktree, retrying once after a prune: a concurrent
 * session can hold files of the track while the checkout runs.
 * @param base The worktree folder.
 */
function addWorktree(base: string): void {
    try {
        execSync0('git', ['worktree', 'add', '--detach', base, '35729287dc615dd9688cb7ddb6179786c23b3f01'], repoRoot);
    } catch (error) {
        execSync0('git', ['worktree', 'prune'], repoRoot);
        execFileSync('sleep', ['5']);
        execSync0('git', ['worktree', 'add', '--detach', base, '35729287dc615dd9688cb7ddb6179786c23b3f01'], repoRoot);
        void error;
    }
    if (!fs.existsSync(path.join(base, 'dashboard', 'package.json'))) {
        throw new Error(`the phase base worktree has no dashboard: ${base}`);
    }
}

/**
 * Removes the phase base worktree, never failing the test on cleanup: a leftover
 * folder is removed by bytes and pruned from the worktree list.
 * @param base The worktree folder.
 */
function removeWorktree(base: string): void {
    try {
        execSync0('git', ['worktree', 'remove', '--force', base], repoRoot);
    } catch {
        fs.rmSync(base, { recursive: true, force: true });
        try {
            execSync0('git', ['worktree', 'prune'], repoRoot);
        } catch {
            // The prune is best effort; the folder is gone.
        }
    }
}
/**
 * Runs the snapshot eval in one dashboard tree and returns its printed map.
 * @param dashboardDir The dashboard folder holding the code to measure.
 * @param mode The eval mode: base or head.
 * @returns The printed name-to-hash map.
 */
function runSnapshot(dashboardDir: string, mode: 'base' | 'head'): Record<string, string> {
    const file = path.join(dashboardDir, 'u2snap-eval-run.ts');
    fs.writeFileSync(file, SNAP_EVAL);
    try {
        const out = execFileSync(process.execPath, ['--import', 'tsx', file], {
            cwd: dashboardDir,
            encoding: 'utf8',
            timeout: 300_000,
            env: { ...process.env, U2_SNAP_MODE: mode },
        });
        return JSON.parse(out) as Record<string, string>;
    } finally {
        fs.rmSync(file, { force: true });
    }
}
/**
 * Runs one maker or checker script in a child process.
 * @param script The script file, relative to the dashboard folder.
 * @param args The arguments after the script path.
 * @param root The temp storytime root for WORKBOOKS_ROOT, or undefined for the repository.
 * @returns The exit code, the standard output, and the error output.
 */
function runMaker(script: string, args: string[], root?: string): { status: number | null; stdout: string; stderr: string } {
    const graph = path.join(repoRoot, '..', 'mastery-advantage', 'english', 'phonics', 'phonics-knowledge-space.json');
    const env = { ...process.env, ...(root ? { WORKBOOKS_ROOT: root } : {}), MASTERY_PHONICS_GRAPH: graph } as NodeJS.ProcessEnv;
    const run = spawnSync(process.execPath, ['--import', 'tsx', path.join(dashboardRoot, script), ...args], {
        cwd: dashboardRoot, encoding: 'utf8', env, timeout: 300_000,
    });
    return { status: run.status, stdout: run.stdout ?? '', stderr: run.stderr ?? '' };
}

describe('F1: the unit 2 picture list and the student book use the full-level reuse', () => {
    it('print-pictures on a temp root writes the Phase 2 contract list (229 rows, the 9 reuse ids absent)', () => {
        const root = mirrorStorytimeToTemp();
        const run = runMaker('scripts/storytime/print-pictures.ts', ['--level', '2'], root);
        expect(run.status, `print-pictures exits 0: ${run.stderr}`).toBe(0);
        const written = readJson(path.join(root, 'content', 'storytime', 'l2', 'print', 'u2', 'pictures.json'));
        expect(written.length, '229 rows').toBe(229);
        const ids = (written as { id: string }[]).map((row) => row.id);
        expect(ids.length).toBe(new Set(ids).size);
        for (const id of REUSE_IDS) expect(ids, `no reuse id ${id}`).not.toContain(id);
        expect((written as { use: string }[]).filter((row) => row.use === 'card').length).toBe(36);
        expect(written).toEqual(readJson(contractU2));
        expect(fs.readFileSync(path.join(root, 'content', 'storytime', 'l2', 'print', 'pictures.json'), 'utf8')).toBe(
            fs.readFileSync(committedU1, 'utf8'),
        );
    }, 300_000);

    it('the unit 2 student book resolves the 9 reuse words to the unit 1 rows', () => {
        const { html } = compileStorytimeStudentBook(publishedWeeks(9, 16), {
            profile: STORYTIME_PRINT_PROFILE,
            mode: 'proof',
        });
        const boxed = new Set([...html.matchAll(/data-picture-id="([^"]+)"/g)].map((m) => m[1]));
        expect(boxed.size).toBeGreaterThan(0);
        for (const id of REUSE_IDS) expect([...boxed], `no unit-only row ${id}`).not.toContain(id);
    }, 120_000);
});

describe('F2: the picture batch check asks for the unit 2 card rows', () => {
    it('a manifest that lacks one unit 2 card row reports that row', () => {
        const all = [...publishedWeeks(1, 8), ...publishedWeeks(9, 16)];
        const bookIds = storytimePrintPictures(all).filter((row) => row.week >= 9 && row.week <= 16).map((row) => row.id);
        const cardIds = (storytimeCardPictureRows(readJson(unit2CardEntries), 2) as { id: string; week: number }[])
            .filter((row) => row.week >= 9 && row.week <= 16)
            .map((row) => row.id);
        expect(cardIds.length).toBe(36);
        const omitted = cardIds[0];
        const job = (id: string): object => ({
            id,
            status: 'ready',
            selectedVersion: 1,
            candidates: [{
                version: 1,
                status: 'ready',
                file: `${id}-v1.png`,
                sha256: '0'.repeat(64),
                pixelSize: { width: 1500, height: 1500 },
                lineArt: { status: 'ready', file: `${id}-line-v1.png`, sha256: '0'.repeat(64), pixelSize: { width: 1500, height: 1500 } },
            }],
        });
        const batch = fs.mkdtempSync(path.join(os.tmpdir(), 'u2p4-batch-'));
        tempRoots.push(batch);
        fs.writeFileSync(path.join(batch, 'manifest.json'), JSON.stringify({ jobs: [...bookIds, ...cardIds.filter((id) => id !== omitted)].map(job) }));
        const run = runMaker('scripts/storytime/check-storytime-pictures.ts', ['--batch', batch, '--level', '2', '--weeks', '9,10,11,12,13,14,15,16']);
        expect(run.status, 'the check exits 1').toBe(1);
        expect(run.stdout, `the missing unit 2 card row ${omitted} is reported`).toContain(`fail  ${omitted}`);
    }, 300_000);
});

describe('F3: a review strip card keeps the teaching week of its item', () => {
    it('a week 1 card with a letter taught only in a later week fails', () => {
        const weeks = [...publishedWeeks(1, 8), ...publishedWeeks(9, 16)];
        const raw = readJson(path.join(storytimeRoot, 'l2', 'w01.json'));
        const template = raw.review.find((s: { cards: unknown[] }) => s.cards.length)?.cards[0];
        expect(template, 'a review card template exists').toBeDefined();
        raw.review = [1, 2, 3, 4, 5].map((day) => ({ day, cards: [{ ...template, text: 'g', week: 1 }] }));
        const report = checkStorytimeWeek(raw, taughtTo(weeks, weeks[0]));
        expect(checkStatus(report as never, 'review')).toBe('fail');
    });

    it("a card text with ___ that matches no taught frame fails", () => {
        const weeks = [...publishedWeeks(1, 8), ...publishedWeeks(9, 16)];
        const raw = readJson(path.join(storytimeRoot, 'l2', 'w01.json'));
        const template = raw.review.find((s: { cards: unknown[] }) => s.cards.length)?.cards[0];
        expect(template, 'a review card template exists').toBeDefined();
        raw.review = [1, 2, 3, 4, 5].map((day) => ({ day, cards: [{ ...template, text: 'The ___ ran away', week: 1 }] }));
        const report = checkStorytimeWeek(raw, taughtTo(weeks, weeks[0]));
        expect(checkStatus(report as never, 'review')).toBe('fail');
    });

    it('a valid earlier card passes', () => {
        const weeks = [...publishedWeeks(1, 8), ...publishedWeeks(9, 16)];
        const raw = readJson(path.join(storytimeRoot, 'l2', 'w09.json'));
        const template = raw.review[0].cards[0];
        raw.review = [1, 2, 3, 4, 5].map((day) => ({ day, cards: [{ ...template, text: 'd', week: 9 }] }));
        const report = checkStorytimeWeek(raw, taughtTo(weeks, weeks[8]));
        expect(checkStatus(report as never, 'review')).toBe('pass');
    });
});

describe('F4: a check item has exactly one right picture, and it is the answer', () => {
    /** A copy of the published week 9 whose check holds one crafted item. */
    function checkCopy(item: object): any {
        const raw = readJson(path.join(storytimeRoot, 'l2', 'w09.json'));
        raw.check = { items: [item] };
        return raw;
    }

    it('one match that is not the answer fails', () => {
        const report = checkStorytimeWeek(checkCopy({
            kind: 'circle-picture', sound: '/d/', position: 'first', pictures: ['dog', 'cat', 'net'], answer: 'cat',
        }));
        expect(checkStatus(report as never, 'check-answers')).toBe('fail');
    });

    it('phone has first sound /f/ and passes as the single match', () => {
        const report = checkStorytimeWeek(checkCopy({
            kind: 'circle-picture', sound: '/f/', position: 'first', pictures: ['phone', 'cat', 'net'], answer: 'phone',
        }));
        expect(checkStatus(report as never, 'check-answers')).toBe('pass');
    });

    it('knight does not start with /k/ and fails as the answer', () => {
        const report = checkStorytimeWeek(checkCopy({
            kind: 'circle-picture', sound: '/k/', position: 'first', pictures: ['knight', 'cat', 'net'], answer: 'knight',
        }));
        expect(checkStatus(report as never, 'check-answers')).toBe('fail');
    });

    it('zero matches fail', () => {
        const report = checkStorytimeWeek(checkCopy({
            kind: 'circle-picture', sound: '/z/', position: 'first', pictures: ['dog', 'cat', 'net'], answer: 'dog',
        }));
        expect(checkStatus(report as never, 'check-answers')).toBe('fail');
    });

    it('two matches fail', () => {
        const report = checkStorytimeWeek(checkCopy({
            kind: 'circle-picture', sound: '/d/', position: 'first', pictures: ['dog', 'dot', 'net'], answer: 'dog',
        }));
        expect(checkStatus(report as never, 'check-answers')).toBe('fail');
    });

    it('all 16 real weeks give the row with status pass on every teaching week', () => {
        for (let week = 1; week <= 16; week++) {
            const raw = readJson(path.join(storytimeRoot, 'l2', `w${String(week).padStart(2, '0')}.json`));
            const report = checkStorytimeWeek(raw);
            const row = (report as { checks: { id: string; status: string }[] }).checks.find((c) => c.id === 'check-answers');
            if (raw.meta.kind === 'review') {
                expect(row === undefined || row.status === 'pass', `st2/${week} check-answers`).toBe(true);
                continue;
            }
            expect(checkStatus(report as never, 'check-answers'), `st2/${week}`).toBe('pass');
        }
    });
});

describe('F5: the unit 2 book map prints the pages of weeks 9 to 16', () => {
    /** The printed page numbers of the map places of one compiled book. */
    function mapPages(weeks: StorytimeWeek[]): number[] {
        const { html } = compileStorytimeStudentBook(weeks, { profile: STORYTIME_PRINT_PROFILE, mode: 'proof' });
        return [...html.matchAll(/data-part="map-page">page (\d+)</g)].map((m) => Number(m[1]));
    }

    it('the 7 decodable places print the pages of weeks 9 to 15, and the unit place the page of week 16', () => {
        const pages = mapPages(publishedWeeks(9, 16));
        expect(pages.length, '7 decodable places and the unit place').toBe(8);
        expect(new Set(pages).size, 'distinct pages').toBe(8);
        expect([...pages].sort((a, b) => a - b)).toEqual(pages);
    }, 120_000);

    it('unit 1 places stay as now', () => {
        const pages = mapPages(publishedWeeks(1, 8));
        expect(pages.length).toBe(8);
        expect(new Set(pages).size).toBe(8);
    }, 120_000);
});

describe('F6: the card kit file names carry the unit', () => {
    it('unit 2 names differ from unit 1 names', () => {
        const unit1 = storytimeCardKitFileNames(2, 1, 1);
        const unit2 = storytimeCardKitFileNames(2, 2, 1);
        expect(unit1.a5).not.toBe(unit2.a5);
        expect(unit2.a5).toContain('-U2-');
        expect(unit1.a5).toContain('-U1-');
    });

    it('a unit 2 request names the unit 2 files', () => {
        const run = runMaker('scripts/storytime/make-card-kit-pdf.ts', ['--level', '2', '--weeks', '9,10,11,12,13,14,15,16', '--dry-run']);
        expect(run.status, `the dry run exits 0: ${run.stderr}`).toBe(0);
        expect(run.stdout).toContain('L2-U2-Card-Kit-A5');
        expect(run.stdout).not.toContain('L2-U1-Card-Kit-A5');
    }, 180_000);

    it('a mixed-unit week request is refused', () => {
        const run = runMaker('scripts/storytime/make-card-kit-pdf.ts', ['--level', '2', '--weeks', '8,9', '--dry-run']);
        expect([1, 2], `exit 1 or 2, got ${run.status}: ${run.stdout} ${run.stderr}`).toContain(run.status);
        expect(`${run.stdout}\n${run.stderr}`, 'the refusal names the units').toMatch(/one unit|mixed-unit|units 1 and 2/i);
    }, 180_000);
});

describe('F8: the makers run on temp roots, and the step map follows the unit 2 book', () => {
    it('make-step-map writes step-map-u2.json whose page numbers follow the unit 2 book', () => {
        const root = mirrorStorytimeToTemp();
        const run = runMaker('scripts/storytime/make-step-map.ts', ['--level', '2'], root);
        expect(run.status, `make-step-map exits 0: ${run.stderr}`).toBe(0);
        const u2file = path.join(root, 'content', 'storytime', 'l2', 'step-map-u2.json');
        expect(fs.existsSync(u2file), 'step-map-u2.json exists').toBe(true);
        const rows = readJson(u2file) as { week: number; page: number }[];
        expect(rows.length).toBeGreaterThan(0);
        const pages = storytimeStudentBookPages(publishedWeeks(9, 16));
        for (const row of rows) {
            expect(row.week, 'a week of unit 2').toBeGreaterThanOrEqual(9);
            expect(row.page, 'a page of the unit 2 book').toBeGreaterThanOrEqual(1);
            expect(row.page, 'a page of the unit 2 book').toBeLessThanOrEqual(pages.length);
        }
        expect(fs.readFileSync(path.join(root, 'content', 'storytime', 'l2', 'step-map-u1.json'), 'utf8')).toBe(
            fs.readFileSync(path.join(storytimeRoot, 'l2', 'step-map-u1.json'), 'utf8'),
        );
    }, 300_000);
});

describe('F9: the unit 1 snapshot hashes maker outputs at the phase base and at HEAD', () => {
    it('HEAD code with both units present gives the phase base hashes', () => {
        const base = fs.mkdtempSync(path.join(os.tmpdir(), 'u2base-'));
        try {
            addWorktree(base);
            fs.symlinkSync(path.join(dashboardRoot, 'node_modules'), path.join(base, 'dashboard', 'node_modules'));
            const baseOut = runSnapshot(path.join(base, 'dashboard'), 'base');
            const headOut = runSnapshot(dashboardRoot, 'head');
            // The teacher-book maker has no HTML hook: it writes only the print PDF, so the
            // snapshot hashes the teacher HTML of compileStorytimeManual, the HTML the maker
            // passes to Chrome, and the non-PDF outputs of the other makers only.
            const names = ['student-book', 'teacher-book', 'readers', 'card-a5', 'card-a6', 'card-stickers', 'step-map', 'pictures', 'pictures-md'];
            for (const name of names) {
                expect(baseOut[name].startsWith('ok:'), `${name} computes at the phase base`).toBe(true);
                expect(headOut[name].startsWith('ok:'), `${name} computes at HEAD`).toBe(true);
                expect(headOut[name], `the unit 1 ${name} output`).toBe(baseOut[name]);
            }
            expect(headOut.weeks).toBe('1,2,3,4,5,6,7,8');
        } finally {
            removeWorktree(base);
        }
    }, 600_000);
});

describe('F10: a unit 3 card match reads the card lists of units 1, 2, and 3', () => {
    it('reads units 1 and 3 with a missing middle file as an empty list, not an error', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u2p4-cards-'));
        tempRoots.push(root);
        fs.mkdirSync(path.join(root, 'l2', 'print', 'u2'), { recursive: true });
        fs.mkdirSync(path.join(root, 'l2', 'print', 'u3'), { recursive: true });
        fs.copyFileSync(path.join(storytimeRoot, 'l2', 'print', 'card-pictures.json'), path.join(root, 'l2', 'print', 'card-pictures.json'));
        const u3 = [{ word: 'quokka', week: 17, prompt: 'A quokka smiles. No letters, words, or numbers anywhere.' }];
        fs.writeFileSync(path.join(root, 'l2', 'print', 'u3', 'card-pictures.json'), JSON.stringify(u3));
        const mod = (await import('../lib/storytime/files')) as unknown as Record<string, unknown>;
        expect(typeof mod['readCardPicturesThrough'], 'Missing export: readCardPicturesThrough(root, level, unit)').toBe('function');
        const entries = (mod['readCardPicturesThrough'] as (r: string, l: number, u: number) => { word: string }[])(root, 2, 3);
        const unit1 = readJson(path.join(storytimeRoot, 'l2', 'print', 'card-pictures.json')) as { word: string }[];
        expect([...entries.map((e) => e.word)].sort()).toEqual([...unit1.map((e) => e.word), 'quokka'].sort());
    });

    it('units 3 and 4 include every earlier unit list in order', async () => {
        const mod = (await import('../lib/storytime/files')) as unknown as Record<string, unknown>;
        expect(typeof mod['readCardPicturesThrough'], 'Missing export: readCardPicturesThrough(root, level, unit)').toBe('function');
        const read = mod['readCardPicturesThrough'] as (r: string, l: number, u: number) => { word: string; week: number }[];
        const root = tempRoots[tempRoots.length - 1] as string;
        fs.writeFileSync(
            path.join(root, 'l2', 'print', 'u2', 'card-pictures.json'),
            JSON.stringify([{ word: 'nod', week: 9, prompt: 'A nod. No letters, words, or numbers anywhere.' }]),
        );
        const words = read(root, 2, 4).map((e) => e.word);
        const unit1 = readJson(path.join(storytimeRoot, 'l2', 'print', 'card-pictures.json')) as { word: string }[];
        expect(words.slice(0, unit1.length)).toEqual(unit1.map((e) => e.word));
        expect(words).toContain('nod');
        expect(words).toContain('quokka');
    });
});

describe('F12: the teacher-book maker uses the unit weeks only', () => {
    it('a unit 2 request gives the unit 2 student-book pages', async () => {
        const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'u2p4-teach-'));
        tempRoots.push(temp);
        const l2 = path.join(temp, 'content', 'storytime', 'l2');
        fs.mkdirSync(l2, { recursive: true });
        for (let week = 1; week <= 16; week++) {
            const name = `w${String(week).padStart(2, '0')}.json`;
            fs.copyFileSync(path.join(storytimeRoot, 'l2', name), path.join(l2, name));
        }
        const unit2 = readUnitWeeks(path.join(temp, 'content', 'storytime'), 2, 2);
        expect(unit2.map((w) => w.meta.week)).toEqual([9, 10, 11, 12, 13, 14, 15, 16]);
        const pages = storytimeStudentBookPages(unit2);
        expect(pages.length).toBeGreaterThan(0);
        for (const page of pages) {
            if (page.week !== undefined) expect(page.week, 'a week of unit 2').toBeGreaterThanOrEqual(9);
        }
        expect(readLevelWeeks(path.join(temp, 'content', 'storytime'), 2).length).toBe(16);
    });
});
