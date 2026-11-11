// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { afterAll, describe, expect, it } from 'vitest';
import {
    checkStorytimeReaderCoverCopy,
    checkTeacherBookCoverData,
    type TeacherBookCoverData,
} from '../lib/storytime/print/teacher-book-cover';

/**
 * Phase 5 adversarial guards (track storytime_print_r1_20261025) on the reviewed HEAD 659200e3.
 * Each case attacks one claim of the phase 5 fix (commit 1c3683b3) and asserts that the attack
 * fails closed. The targets are the two claim gaps of review A (A-P5-4, mutants M9 and M10), the
 * output folder gates and the argument rules of review B and C (B-P5-1, B-P5-2, B-P5-3, C-P5-1),
 * and the art check of C-P5-3.
 *
 * Bad inputs live in temporary folders under /tmp/opencode (rule 11.1). Every build runs with a
 * fake HOME that holds its own Desktop/print-ready/, so no case touches the real print-ready
 * folder. Chrome and Ghostscript run only under heavy-run.sh.
 */
const dashboardRoot = fileURLToPath(new URL('../', import.meta.url));
const coverScript = path.join(dashboardRoot, 'scripts', 'storytime', 'make-storytime-teacher-cover.ts');
const readersScript = path.join(dashboardRoot, 'scripts', 'storytime', 'make-readers-pdf.ts');
const temporaryFolders: string[] = [];

/** One run of a build script: the exit code and both streams. */
interface Run {
    status: number | null;
    stdout: string;
    stderr: string;
}

function temporaryFolder(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const folder = fs.mkdtempSync(path.join('/tmp/opencode', 'storytime-covers-adv-'));
    temporaryFolders.push(folder);
    return folder;
}

/** The Storytime print-ready folder of a home. */
function printReady(home: string): string {
    return path.join(home, 'Desktop', 'print-ready', 'storytime');
}

/**
 * A fake home with its own Desktop/print-ready/ folder. The PDF/X profile cache is copied from
 * the real home, so a build never downloads the profile from Adobe.
 */
function fakeHome(): string {
    const home = temporaryFolder();
    fs.mkdirSync(printReady(home), { recursive: true });
    const source = path.join(os.homedir(), '.cache', 'workbooks-print');
    if (fs.existsSync(source)) fs.cpSync(source, path.join(home, '.cache', 'workbooks-print'), { recursive: true });
    return home;
}

/**
 * Runs one build script with the fake home. The exit code, not an exception, names the verdict.
 */
function runScript(script: string, args: string[], home: string, extraEnv: Record<string, string> = {}, timeout = 300_000): Run {
    const run = spawnSync(process.execPath, ['--import', 'tsx', script, ...args], {
        cwd: dashboardRoot,
        encoding: 'utf8',
        timeout,
        env: { ...process.env, HOME: home, ...extraEnv },
    });
    expect(run.error, 'The build must start and finish inside the timeout.').toBeUndefined();
    return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

const runCover = (args: string[], home: string, extraEnv: Record<string, string> = {}, timeout?: number): Run =>
    runScript(coverScript, args, home, extraEnv, timeout);

/** The entries of a folder, or an empty list when the build made no folder. */
function entriesOf(folder: string): string[] {
    return fs.existsSync(folder) ? fs.readdirSync(folder).sort() : [];
}

/** Proves that a Chrome or Ghostscript case runs through the heavy-job wrapper. */
function requireHeavyWrapper(): void {
    let pid = process.pid;
    let found = false;
    for (let hop = 0; pid > 1 && hop < 64; hop++) {
        const command = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0');
        if (command.some((arg) => arg.endsWith('/heavy-run.sh'))) found = true;
        const parent = fs.readFileSync(`/proc/${pid}/status`, 'utf8').match(/^PPid:\s+(\d+)/m);
        pid = Number(parent?.[1] ?? 0);
    }
    expect(found, 'Run Chrome and Ghostscript only through heavy-run.sh.').toBe(true);
}

afterAll(() => {
    for (const folder of temporaryFolders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
});

/** A reader cover page as the print CSS shows it: the band in capitals. */
const printedReaderCover = (band: string): string => `Storytime Advantage\nLevel 2 · Unit 1\n${band}\nWeek 1\nHello!`;

// changed 2026-11-11 (F5, PM look): the quest reader cover is page 1. No band word may show on it, and
// the series name is not required, because the A3 quest cover holds no series line after F2 (Q2 of the
// Red log of F3 to F6). The forbidden word rule and the year rule stay.
describe('Adversarial: the reader cover check keeps the forbidden word and year rules and forbids every band word (M9)', () => {
    /** The 5 band names of QUEST_BANDS. */
    const BANDS = ['seed', 'sprout', 'leaf', 'bud', 'flower'];

    it('passes the printed quest reader cover with no band word, with or without the series name', () => {
        expect(checkStorytimeReaderCoverCopy('Week 1\nHello!\nListen and read.'), 'The A3 quest cover passes.').toEqual([]);
        expect(checkStorytimeReaderCoverCopy('Hello!\nStorytime Advantage · Week 1 · Listen and read.'), 'The leaf quest cover passes.').toEqual([]);
    });

    it('fails a reader cover text that shows "SPROUT" and the banned word "CEFR"', () => {
        const errors = checkStorytimeReaderCoverCopy('Storytime Advantage\nSPROUT\nLevel 2 · Unit 1\nCEFR\nWeek 1');
        const text = errors.join('\n');
        expect(text, 'The base cover copy check still reports the banned word.').toContain('The page shows the forbidden word "cefr"');
        expect(errors.filter((error) => /band word/i.test(error)).length, 'The band word rule reports the band.').toBeGreaterThan(0);
    });

    it('fails each band name of QUEST_BANDS in any case', () => {
        for (const band of BANDS) {
            for (const shown of [band, band.toUpperCase(), band[0].toUpperCase() + band.slice(1)]) {
                const errors = checkStorytimeReaderCoverCopy(`Week 1\nHello!\n${shown}`);
                expect(errors.filter((error) => /band word/i.test(error)).length, `"${shown}" is a band word.`).toBeGreaterThan(0);
            }
        }
    });

    it('fails a reader cover that shows a year, and does not read a longer word as a band word', () => {
        expect(checkStorytimeReaderCoverCopy(printedReaderCover('Hello') + ' 2026').join('\n'), 'A year fails the base check.').toContain('The page shows a year.');
        expect(checkStorytimeReaderCoverCopy('Week 1\nSprouts\nLeafy\nBuddy\nSeeds'), 'A longer word is not a band word.').toEqual([]);
    });
});

describe('Adversarial: the teacher cover data check keeps the title copy check (M10)', () => {
    const goodData: TeacherBookCoverData = {
        title: 'Storytime Advantage, Level 2, Unit 1, Teacher Book',
        band: 'Sprout',
        frontArt: '/tmp/opencode/does-not-matter-front.png',
        backArt: '/tmp/opencode/does-not-matter-back.png',
    };

    it('passes the title that the script builds and a supported band', () => {
        expect(checkTeacherBookCoverData(goodData), 'The built title and the default band pass.').toEqual([]);
    });

    it('fails a title that holds a forbidden word', () => {
        const text = checkTeacherBookCoverData({ ...goodData, title: 'Storytime Advantage, Level 2, Unit 1, Teacher Book (CEFR A1)' }).join('\n');
        expect(text, 'The title goes through the cover copy check.').toContain('Title: The page shows the forbidden word "cefr"');
        expect(text, 'A second forbidden token is reported too.').toContain('Title: The page shows the forbidden word "a1"');
    });

    it('fails a title that shows a year and a title that is empty', () => {
        expect(checkTeacherBookCoverData({ ...goodData, title: 'Storytime Advantage, Level 2, Teacher Book 2026' }).join('\n'), 'A year in the title fails.').toContain('Title: The page shows a year.');
        expect(checkTeacherBookCoverData({ ...goodData, title: '   ' }).join('\n'), 'A blank title is an error of its own.').toContain('The teacher-book cover has no title.');
    });

    it('reports the band and the side files in the same pass as a bad title', () => {
        const errors = checkTeacherBookCoverData({ ...goodData, title: 'Storytime Advantage, Level 2 (GSE 20)', band: 'Nest', backArt: '' });
        expect(errors, 'Every data rule runs; a bad title hides no other fault.').toHaveLength(3);
    });
});

describe('Adversarial: the output folder gates of the teacher cover build', () => {
    it('refuses a symbolic link --out into an occupied print-ready folder and writes no file', () => {
        const home = fakeHome();
        const occupied = path.join(printReady(home), 'readers-final');
        fs.mkdirSync(occupied);
        const approved = path.join(occupied, 'teacher-front.png');
        fs.writeFileSync(approved, 'the approved file');
        const out = path.join(temporaryFolder(), 'link-out');
        fs.symlinkSync(occupied, out);
        const run = runCover(['--out', out], home);
        expect(run.status, 'A refused output folder exits 2.').toBe(2);
        expect(run.stderr, 'The refusal names the file that exists in the print-ready folder.').toContain('exists in the print-ready folder');
        expect(fs.readFileSync(approved, 'utf8'), 'The build never overwrites a file in print-ready.').toBe('the approved file');
        expect(entriesOf(occupied), 'The build adds no file to the print-ready folder.').toEqual(['teacher-front.png']);
    }, 120_000);

    it('refuses a print-ready folder that holds any file', () => {
        const home = fakeHome();
        const folder = path.join(printReady(home), 'approved-folder');
        fs.mkdirSync(folder);
        fs.writeFileSync(path.join(folder, 'other.txt'), 'keep');
        const run = runCover(['--out', folder], home);
        expect(run.status, 'A folder that holds a file exits 2.').toBe(2);
        expect(run.stderr, 'The refusal counts the entries of the folder.').toContain('holds 1 entries already');
        expect(entriesOf(folder), 'The existing file stays, and no new file appears.').toEqual(['other.txt']);
    }, 120_000);

    it('passes the gates for a new folder and for an empty folder in print-ready', () => {
        const home = fakeHome();
        const empty = path.join(printReady(home), 'empty-folder');
        fs.mkdirSync(empty);
        for (const folder of [empty, path.join(printReady(home), 'new-folder')]) {
            // The missing art stops the build after the gates, so exit 1 names the gate verdict:
            // the gates passed, and the data check stopped the build.
            const run = runCover(['--out', folder, '--front', path.join(temporaryFolder(), 'none.png')], home);
            expect(run.status, 'A new or an empty print-ready folder passes the gates.').toBe(1);
            expect(run.stderr, 'The build reports the missing art.').toContain('The art file is missing');
            expect(run.stderr, 'No print-ready refusal for a new or an empty folder.').not.toContain('print-ready folder');
            expect(entriesOf(folder), 'A data error writes no file there.').toEqual([]);
        }
    }, 180_000);

    it('leaves a folder outside print-ready with its own rules', () => {
        const home = fakeHome();
        const outside = temporaryFolder();
        fs.writeFileSync(path.join(outside, 'keep.txt'), 'keep');
        const run = runCover(['--out', outside, '--front', path.join(temporaryFolder(), 'none.png')], home);
        expect(run.status, 'The print-ready refusal does not reach a folder outside it.').toBe(1);
        expect(run.stderr, 'The data error is the reason, not a folder refusal.').toContain('The art file is missing');
        expect(entriesOf(outside), 'The build leaves the outside folder untouched.').toEqual(['keep.txt']);
    }, 120_000);
});

describe('Adversarial: a flag that needs a value and has none exits 2', () => {
    const cases: Array<[string, (out: string) => string[]]> = [
        ['--out at the end', () => ['--out']],
        ['--band at the end after a full --out', (out) => ['--out', out, '--band']],
        ['--out followed by another flag', () => ['--out', '--print']],
        ['--version followed by --print', (out) => ['--out', out, '--version', '--print']],
        ['--front followed by another flag', (out) => ['--out', out, '--front', '--back']],
    ];

    it.each(cases)('exits 2 for %s and writes no folder', (_name, argsOf) => {
        const home = fakeHome();
        const out = path.join(printReady(home), 'never-built');
        const run = runCover(argsOf(out), home);
        expect(run.status, 'A missing flag value is an argument error.').toBe(2);
        expect(run.stderr, 'The message names the flag that has no value.').toContain('needs a value');
        expect(entriesOf(out), 'An argument error makes no folder and no file.').toEqual([]);
    }, 120_000);
});

describe('Adversarial: the art check stops a side with no visible figure', () => {
    it('exits 1 for a fully transparent front art file and writes nothing', async () => {
        const home = fakeHome();
        const folder = temporaryFolder();
        const art = path.join(folder, 'transparent.png');
        await sharp({ create: { width: 1200, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
            .png()
            .toFile(art);
        const out = path.join(folder, 'art-out');
        const run = runCover(['--out', out, '--front', art], home);
        expect(run.status, 'Art with no figure exits 1.').toBe(1);
        expect(run.stderr, 'The art check of the cover track reports the empty picture.').toContain('front art: The picture holds no figure pixels.');
        expect(entriesOf(out), 'The failed build writes no deliverable in --out.').toEqual([]);
    }, 180_000);
});

describe('Adversarial: a failed print step leaves no deliverable in --out', () => {
    it('exits 1 and writes no file in --out when Ghostscript fails', () => {
        requireHeavyWrapper();
        const home = fakeHome();
        const folder = temporaryFolder();
        const fakeBin = path.join(folder, 'bin');
        fs.mkdirSync(fakeBin);
        // The real command path resolves gs through PATH, so a stub there fails the print step.
        fs.writeFileSync(path.join(fakeBin, 'gs'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
        const out = path.join(folder, 'out');
        const run = runCover(['--out', out, '--print'], home, { PATH: `${fakeBin}${path.delimiter}${process.env.PATH ?? ''}` }, 240_000);
        expect(run.status, 'A failed build step exits 1.').toBe(1);
        expect(run.stderr, 'The failed step is named.').toMatch(/Ghostscript failed|Command failed/);
        expect(entriesOf(out), 'The print file and the PNG files stay out of --out.').toEqual([]);
    }, 300_000);
});

describe('Adversarial: the reader build runs the cover check on the printed text', () => {
    it('passes the reader cover check for the real covers and writes the print file', () => {
        requireHeavyWrapper();
        const home = fakeHome();
        const out = path.join(printReady(home), 'readers-cover-check');
        const run = runScript(
            readersScript,
            ['--level', '2', '--weeks', '1', '--proof', '--workbook', '--out', out],
            home,
            {},
            300_000,
        );
        expect(run.status, 'The real reader covers pass the cover check.').toBe(0);
        expect(run.stdout, 'The build reads the printed text of the two cover pages.').toContain('reader cover check: 2 cover pages passed (FR-6.3)');
        expect(run.stdout, 'The printed band shows as SPROUT, and the check ignores case.').not.toContain('does not show the band name');
        const files = entriesOf(out);
        expect(files.filter((name) => name.endsWith('_PDFX-1a.pdf')), 'The build writes the print file after the check passes.').toHaveLength(1);
    }, 120_000);
});
