// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { STORYTIME_ROOT } from '../lib/storytime/files';
import {
    WORD_CLIP_HEARD_VARIANTS,
    bookWordKey,
    heardPasses,
    heardText,
    wordClipPath,
    wordClipStem,
    wordClipText,
} from '../lib/storytime/word-clips';

/**
 * Phase 1 amendment, Task 1.13a (spec D-U2-K2, D-U2-K3, D-U2-K8 to D-U2-K12): the hyphen word
 * keys and the check that reports a bad word instead of throwing.
 *
 * The pure-function cases fail at the role base, because the key rule rejects an inner hyphen.
 * The check cases build a STAGE_CHECKS root: the shipped content is linked, and one copy of the
 * staged week 10 is written into `l2/`. The check runs in a child process with `WORKBOOKS_ROOT`.
 * No case writes into the repository, and no case makes a paid call or loads a model.
 */

/** The dashboard folder. */
const dashboardRoot = path.resolve(STORYTIME_ROOT, '..', '..', 'dashboard');

/** The repository root. */
const repoRoot = path.resolve(dashboardRoot, '..');

/** The week check script. */
const checkWeeksScript = path.join(dashboardRoot, 'scripts/storytime/check-weeks.ts');

/** The published week 10 file. */
const stagedW10 = path.join(STORYTIME_ROOT, 'l2/w10.json');

/** The baseline of the unit 1 rows at 0dcb45d4. */
const baselineFile = path.join(repoRoot, 'measure/runs/storytime_l2_unit2_20261106/p1-baseline-rows-0dcb45d4.txt');

/** The phonics graph of the sibling repo. */
const graph = path.join(repoRoot, '..', 'mastery-advantage', 'english', 'phonics', 'phonics-knowledge-space.json');

/** The stage roots of this file, removed after the last case. */
const stages: string[] = [];

/** The copies written by this file, removed after the last case. */
const copies: string[] = [];

/** The printed report and the exit code of one check run. */
interface CheckRun {
    stdout: string;
    stderr: string;
    status: number | null;
}

/**
 * Writes a modified copy of the staged week 10 into a temporary folder.
 * @param mutate Changes the parsed week in place.
 * @returns The path of the copy.
 */
function week10Copy(mutate: (week: any) => void): string {
    const week = JSON.parse(fs.readFileSync(stagedW10, 'utf8'));
    mutate(week);
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'u2wk-copy-'));
    copies.push(folder);
    const file = path.join(folder, 'w10.json');
    fs.writeFileSync(file, JSON.stringify(week));
    return file;
}

/**
 * Builds a STAGE_CHECKS root. The shipped content is linked. A copy of week 10 replaces its link
 * when one is given.
 * @param week10 The path of a week 10 copy, or undefined for the shipped unit 1 weeks only.
 * @returns The stage root.
 */
function stageRoot(week10?: string): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'u2wk-stage-'));
    stages.push(root);
    fs.mkdirSync(path.join(root, 'content'));
    execFileSync('cp', ['-rs', STORYTIME_ROOT, path.join(root, 'content')]);
    if (week10) {
        const destination = path.join(root, 'content/storytime/l2/w10.json');
        fs.rmSync(destination, { force: true });
        fs.copyFileSync(week10, destination);
    }
    return root;
}

/**
 * Runs the week check on a stage root in a child process.
 * @param root The stage root.
 * @returns The printed report, the error stream, and the exit code.
 */
function runCheck(root: string): CheckRun {
    const env = { ...process.env, WORKBOOKS_ROOT: root, MASTERY_PHONICS_GRAPH: graph } as NodeJS.ProcessEnv;
    const run = spawnSync(process.execPath, ['--import', 'tsx', checkWeeksScript, '--level', '2'], {
        cwd: dashboardRoot, encoding: 'utf8', env, timeout: 180_000,
    });
    return { stdout: run.stdout ?? '', stderr: run.stderr ?? '', status: run.status };
}

/**
 * Removes the file path from each package header, so two different stage roots compare equal.
 * @param text A check report.
 * @returns The report with empty brackets in each header.
 */
function normalize(text: string): string {
    return text.replace(/\[[^\]]*\]/g, '[]').trimEnd();
}

/**
 * Keeps the package sections of the unit 1 weeks (st2/1 to st2/8) of a check
 * report and drops the Summary line. The stage root now holds 16 weeks, so the
 * unit 2 sections and the 16-week totals are dropped; the `published` rows are
 * dropped on both sides because that check came after the baseline capture.
 * The unit 1 rows still compare exactly.
 * @param text A check report.
 * @returns The unit 1 sections without the Summary line.
 */
function unit1Sections(text: string): string {
    const kept: string[] = [];
    let keep = true;
    for (const line of text.split('\n')) {
        const head = /^st2\/(\d+)\b/.exec(line);
        if (head) keep = Number(head[1]) <= 8;
        if (line.startsWith('Summary:')) continue;
        if (/^\s+PASS\s+published\b/.test(line)) continue;
        if (keep) kept.push(line);
    }
    return kept.join('\n').trimEnd();
}

/**
 * Says whether a check report holds a stack frame. Node prints four spaces before `at`.
 * @param lines The lines of a report or an error stream.
 * @returns True when a frame is present.
 */
function hasStackFrame(lines: string[]): boolean {
    return lines.some((line) => line.startsWith('at ') || /^\s+at\s/.test(line));
}

afterAll(() => {
    for (const root of stages) fs.rmSync(root, { recursive: true, force: true });
    for (const folder of copies) fs.rmSync(folder, { recursive: true, force: true });
});

describe('the hyphen word key (D-U2-K2, D-U2-K10)', () => {
    it('gives the lower-case key with each inner hyphen', () => {
        expect(bookWordKey('T-shirt')).toBe('t-shirt');
        expect(bookWordKey('teddy-bear')).toBe('teddy-bear');
        expect(bookWordKey('T-SHIRT')).toBe('t-shirt');
    });

    it('keeps the hyphen in the stem, the written TTS text, and the clip path', () => {
        expect(wordClipStem('t-shirt')).toBe('t-shirt');
        expect(wordClipText('t-shirt', 'T-shirt')).toBe('T-shirt');
        expect(wordClipPath(2, 10, 't-shirt')).toBe('l2/media/w10/words/wa-t-shirt.mp3');
    });

    it('refuses a run of two hyphens and keeps a hyphen next to an apostrophe group', () => {
        expect(() => bookWordKey('t--shirt')).toThrow(/not a word key/);
        expect(bookWordKey("t-shirt's")).toBe("t-shirt's");
    });

    it('still throws for a digit or an accent inside the text', () => {
        for (const word of ['n1ne', 'a1b', 'cafés']) {
            expect(() => bookWordKey(word)).toThrow(/not a word key/);
        }
    });
});

describe('the heard check of a hyphen key (D-U2-K2, D-U2-K11)', () => {
    it('holds the two raw forms of t-shirt in the variant bank', () => {
        expect(WORD_CLIP_HEARD_VARIANTS['t-shirt']).toEqual(['t shirt', 'tshirt']);
    });

    it('passes each of the three raw heard forms', () => {
        for (const heard of ['t shirt', 'tshirt', 't-shirt']) {
            expect(heardPasses('t-shirt', heard).pass, `the raw form ${heard}`).toBe(true);
        }
    });

    it('passes the heard text, which removes the space and the hyphen', () => {
        expect(heardText(['T', 'shirt'])).toBe('tshirt');
        expect(heardText(['T-shirt'])).toBe('tshirt');
        expect(heardPasses('t-shirt', heardText(['T-shirt'])).pass).toBe(true);
    });
});

describe('the check that reports a bad word (D-U2-K3, D-U2-K8, D-U2-K9, D-U2-K12)', () => {
    it('gives one practice-clips FAIL row, a Summary, exit 1, and no stack frame', () => {
        const copy = week10Copy((week) => { week.focus.family.words[0].word = 'nine4'; });
        const run = runCheck(stageRoot(copy));
        const lines = run.stdout.split('\n');
        expect(run.status, 'the exit code').toBe(1);
        expect(lines.some((line) => line.startsWith('  FAIL ') && line.includes('not a word key: nine4')), 'one FAIL row names nine4').toBe(true);
        expect(lines.some((line) => line.startsWith('Summary:')), 'the Summary still prints').toBe(true);
        expect(hasStackFrame([...lines, ...run.stderr.split('\n')]), 'no stack frame').toBe(false);
    });

    it('gives one practice-clips FAIL row for an opening line with no word form', () => {
        const copy = week10Copy((week) => { week.opening.pa[0].en = 'Look at this.'; });
        const run = runCheck(stageRoot(copy));
        const lines = run.stdout.split('\n');
        expect(run.status, 'the exit code').toBe(1);
        const keyErrorRows = lines.filter((line) => line.startsWith('  FAIL ') && line.includes('not a word key:'));
        expect(keyErrorRows, 'one key-error FAIL row').toHaveLength(1);
        expect(lines.some((line) => line.startsWith('  FAIL ') && line.includes('not a word key:')), 'the D-U2-K12 detail form').toBe(true);
        expect(lines.some((line) => line.startsWith('Summary:')), 'the Summary still prints').toBe(true);
        expect(hasStackFrame([...lines, ...run.stderr.split('\n')]), 'no stack frame').toBe(false);
    });

    it('gives one FAIL row for each of two bad family words, and counts both', () => {
        const copy = week10Copy((week) => {
            week.focus.family.words[0].word = 'nine4';
            week.focus.family.words[1].word = 'seven8';
        });
        const run = runCheck(stageRoot(copy));
        const lines = run.stdout.split('\n');
        expect(run.status, 'the exit code').toBe(1);
        expect(lines.some((line) => line.startsWith('  FAIL ') && line.includes('not a word key: nine4')), 'a FAIL row names nine4').toBe(true);
        expect(lines.some((line) => line.startsWith('  FAIL ') && line.includes('not a word key: seven8')), 'a FAIL row names seven8').toBe(true);
        const keyErrorRows = lines.filter((line) => line.startsWith('  FAIL ') && line.includes('not a word key:'));
        expect(keyErrorRows, 'exactly two key-error FAIL rows').toHaveLength(2);
        expect(keyErrorRows.some((line) => line.includes('not a word key: nine4')), 'a key-error row names nine4').toBe(true);
        expect(keyErrorRows.some((line) => line.includes('not a word key: seven8')), 'a key-error row names seven8').toBe(true);
        expect(hasStackFrame([...lines, ...run.stderr.split('\n')]), 'no stack frame').toBe(false);
    });
});

describe('the unit 1 rows do not change (D-U2-K4, plan F11)', () => {
    it('equals the baseline capture at 0dcb45d4', () => {
        const expected = normalize(fs.readFileSync(baselineFile, 'utf8'));
        const run = runCheck(stageRoot());
        expect(run.status, 'the exit code').toBe(0);
        // changed 2026-11-18 (publish of weeks 2 to 7, PM order): Daniel approved audio, song, and scripts of weeks 2 to 7 ("1. Ok", Google Tasks 2026-11-18 05:36 ICT); owner approval records and meta.status are not content.
        // changed 2026-11-25 (unit 2 move): the stage root holds 16 weeks, so only the st2/1 to st2/8 sections compare.
        expect(unit1Sections(normalize(run.stdout)), 'the st2/1 to st2/8 rows').toBe(unit1Sections(expected));
    });
});
