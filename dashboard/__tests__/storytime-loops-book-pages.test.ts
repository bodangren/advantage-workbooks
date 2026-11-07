// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readLevelWeeks, STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { compileStorytimeManual } from '../lib/storytime/manual';
import { storytimeStudentBookPages } from '../lib/storytime/print/step-pages';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

// Phase 3b Red (text-gate baseline) of track storytime_teaching_loops_20261103. The teacher book build v1 exits 1,
// because the text gate compares each week of the book with a draft that has no unit page list. All 316
// differences are page-list rows (the classification proof is `mid-red-p3b-tg-classify.txt`). The draft path
// `scripts/storytime/make-manual-pdf.ts` gets a default-off option `--book-pages`: with it, the draft path builds
// the unit page list as `make-teacher-book-print.ts` does (all weeks of the level of the first week, passed to
// `storytimeStudentBookPages`) and passes it as `studentBookPages` to `compileStorytimeManual`.
//
// The tests:
//   B1  wiring (the TypeScript AST, as T11 of the share book test): the flag, the call argument, the usage text,
//       `--help`, an unknown flag, and the entry guard that lets a test import the script.
//   B2  equality: the helper `manualPdfHtml(weeks, { lang, loops, share, bookPages })`, exported from
//       `make-manual-pdf.ts`, gives byte for byte the HTML of `compileStorytimeManual` with the unit page list.
//   B3  guard: without `bookPages` the helper gives byte for byte the HTML of `compileStorytimeManual` with no page list.
//
// Red notes. `make-manual-pdf.ts` exports no `manualPdfHtml` at HEAD and runs `main` on import. The module is
// therefore loaded only after the AST check proves the export and the entry guard, so a Red run never starts
// `main` inside the vitest worker. The helper is read through an untyped cast (as the option `share` was), so
// `tsc` passes before and after Green.
//
// Thai rule (test-strategy 9.4, item 6). This file holds no Thai literal. The Thai page word (the marker of a
// page reference) is built from code points and is used only as a marker in a search pattern, never
// compared with a shipped string. No `expect` compares a shipped Thai string with a literal.
//
// The CLI tests run with a temporary `HOME`. No test builds a PDF, and no test writes into `content/` or into the
// real home folder.

type Raw = any;

/** The Thai page word, from code points (this file holds no Thai literal). */
const THAI_PAGE = String.fromCharCode(0x0e2b, 0x0e19, 0x0e49, 0x0e32);

/** The weeks that the equality and guard tests build: a teach week and the review week. */
const WEEKS = [1, 8];

const DASHBOARD = path.resolve(__dirname, '..');
const MANUAL_CLI = path.join(DASHBOARD, 'scripts/storytime/make-manual-pdf.ts');

/** The shipped week n of Level 2, parsed. */
const shipped = (n: number): StorytimeWeek => StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, n), 'utf8')) as Raw);

/** The unit page list, built as `make-teacher-book-print.ts` builds it: every week of the level. */
const unitPages = () => storytimeStudentBookPages(readLevelWeeks(STORYTIME_ROOT, 2).flatMap((r) => (r.week ? [r.week] : [])));

/** The HTML of the book path: `compileStorytimeManual` with the options of the print build. */
const bookHtml = (week: StorytimeWeek, pages: ReturnType<typeof unitPages>): string =>
    compileStorytimeManual([week], { lang: 'th', paper: 'a4', loops: true, share: true, studentBookPages: pages }).html;

/** The HTML of the draft path with no page list: the same call as today. */
const plainHtml = (week: StorytimeWeek): string => compileStorytimeManual([week], { lang: 'th', paper: 'a4', loops: true, share: true }).html;

const source = (): ts.SourceFile => ts.createSourceFile(MANUAL_CLI, fs.readFileSync(MANUAL_CLI, 'utf8'), ts.ScriptTarget.Latest, true);

/** The calls of a function by name. */
function callsOf(parsedFile: ts.SourceFile, name: string): ts.CallExpression[] {
    const calls: ts.CallExpression[] = [];
    const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && node.expression.getText(parsedFile) === name) calls.push(node);
        ts.forEachChild(node, visit);
    };
    visit(parsedFile);
    return calls;
}

/** True when the argument is, or is an object literal that holds, a name `studentBookPages`. */
function namesPages(arg: ts.Expression, parsedFile: ts.SourceFile): boolean {
    if (ts.isIdentifier(arg)) return arg.text === 'studentBookPages';
    if (ts.isPropertyAccessExpression(arg)) return arg.name.text === 'studentBookPages';
    if (ts.isObjectLiteralExpression(arg)) {
        return arg.properties.some((property) => (ts.isShorthandPropertyAssignment(property) && property.name.text === 'studentBookPages')
            || (ts.isPropertyAssignment(property) && property.name.getText(parsedFile) === 'studentBookPages'));
    }
    return false;
}

/** True when the file exports a function with this name. */
function exportsFunction(parsedFile: ts.SourceFile, name: string): boolean {
    return parsedFile.statements.some((statement) => ts.isFunctionDeclaration(statement)
        && statement.name?.text === name
        && (ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Export) !== 0);
}

type Helper = (weeks: StorytimeWeek[], options: Record<string, unknown>) => string;

/**
 * The helper of the draft path, loaded after the AST proof of the export and of the entry guard. A missing
 * export is a failed assertion, and `main` never starts inside the worker.
 */
async function loadHelper(): Promise<Helper> {
    const parsedFile = source();
    expect(exportsFunction(parsedFile, 'manualPdfHtml'), 'make-manual-pdf.ts exports the function manualPdfHtml').toBe(true);
    expect(parsedFile.getFullText().includes('process.argv[1]'), 'the call of main sits behind an entry guard on process.argv[1]').toBe(true);
    const mod = (await import('../scripts/storytime/make-manual-pdf')) as unknown as Record<string, unknown>;
    expect(typeof mod.manualPdfHtml, 'the export manualPdfHtml is a function').toBe('function');
    return mod.manualPdfHtml as Helper;
}

describe('B1 wiring: the flag --book-pages reaches the compile call of the draft path', () => {
    let home = '';
    beforeAll(() => {
        home = fs.mkdtempSync(path.join(os.tmpdir(), 'book-pages-'));
    });
    afterAll(() => {
        fs.rmSync(home, { recursive: true, force: true });
    });

    const run = (args: string[]) =>
        spawnSync(process.execPath, ['--import', 'tsx', MANUAL_CLI, ...args], {
            cwd: DASHBOARD, encoding: 'utf8', timeout: 25_000, env: { ...process.env, HOME: home },
        });

    it('B1 wiring: the file reads --book-pages', () => {
        expect(source().getFullText().includes("a === '--book-pages'")).toBe(true);
    });

    it('B1 wiring: every compile call passes studentBookPages', () => {
        const parsedFile = source();
        const compiles = callsOf(parsedFile, 'compileStorytimeManual');
        expect(compiles.length, 'calls of compileStorytimeManual').toBeGreaterThanOrEqual(1);
        for (const call of compiles) expect(call.arguments.some((arg) => namesPages(arg, parsedFile)), 'a compile call passes studentBookPages').toBe(true);
    });

    it('B1 wiring: the page list is the unit page list (storytimeStudentBookPages of the weeks of the level)', () => {
        const text = source().getFullText();
        expect(text.includes('storytimeStudentBookPages('), 'the script calls storytimeStudentBookPages').toBe(true);
        expect(text.includes('readLevelWeeks('), 'the script reads the weeks of the level').toBe(true);
    });

    it('B1 wiring: the usage text names --book-pages', () => {
        const parsedFile = source();
        let usage = '';
        const visit = (node: ts.Node) => {
            if (ts.isVariableDeclaration(node) && node.name.getText(parsedFile) === 'USAGE' && node.initializer) usage = node.initializer.getText(parsedFile);
            ts.forEachChild(node, visit);
        };
        visit(parsedFile);
        expect(usage.length, 'the script has a USAGE text').toBeGreaterThan(0);
        expect(usage.includes('--book-pages')).toBe(true);
    });

    it('B1 wiring: the script exports manualPdfHtml and calls main only at the entry', () => {
        const parsedFile = source();
        expect(exportsFunction(parsedFile, 'manualPdfHtml')).toBe(true);
        expect(parsedFile.getFullText().includes('process.argv[1]')).toBe(true);
    });

    it('B1 wiring: --help exits 0 and names --book-pages', () => {
        const result = run(['--help']);
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('--book-pages');
    }, 30_000);

    it('B1 wiring: the flag --book-pages is accepted, and an unknown flag still exits 2', () => {
        const accepted = run(['--book-pages']);
        expect(accepted.status, 'a missing source or level is a usage error').toBe(2);
        expect(accepted.stderr.toLowerCase()).not.toContain('unknown argument');
        const unknown = run(['--book-pages', '--unknown-flag']);
        expect(unknown.status).toBe(2);
        expect(unknown.stderr).toContain('--unknown-flag');
    }, 60_000);
});

describe('B2 equality: the draft path with --book-pages builds the HTML of the print path', () => {
    it.each(WEEKS)('B2 equality w0%i: manualPdfHtml with bookPages equals compileStorytimeManual with the unit page list', async (n) => {
        const helper = await loadHelper();
        const week = shipped(n);
        const expected = bookHtml(week, unitPages());
        const actual = helper([week], { lang: 'th', loops: true, share: true, bookPages: true });
        // Not vacuous: the page-list form has the step badge and at least one page reference.
        expect(expected.includes('data-part="step-badge"'), 'the page-list HTML has the step badge').toBe(true);
        expect(new RegExp(`${THAI_PAGE} \\d+(?:\\u2013\\d+)? \\(`).test(expected), 'the page-list HTML has a page reference').toBe(true);
        expect(actual === expected, 'the helper HTML equals the print path HTML byte for byte').toBe(true);
    }, 180_000);
});

describe('B3 guard: without --book-pages the draft path output does not change', () => {
    it.each(WEEKS)('B3 guard w0%i: manualPdfHtml without bookPages equals compileStorytimeManual with no page list', async (n) => {
        const helper = await loadHelper();
        const week = shipped(n);
        const expected = plainHtml(week);
        // Not vacuous: the draft form prints "A1 · title" in the step title and has no step badge.
        expect(expected.includes('data-part="step-badge"'), 'the draft HTML has no step badge').toBe(false);
        expect(/st-step-title">[A-E]\d · /.test(expected), 'the draft HTML has the A-48 form of the step title').toBe(true);
        expect(helper([week], { lang: 'th', loops: true, share: true }) === expected, 'the default output equals the old output').toBe(true);
        expect(helper([week], { lang: 'th', loops: true, share: true, bookPages: false }) === expected, 'bookPages false equals the old output').toBe(true);
    }, 180_000);
});
