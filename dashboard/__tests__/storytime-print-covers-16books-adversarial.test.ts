// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BACK_LINES } from '../lib/covers/back-text';
import { generateQRCode } from '../lib/qr-generator';
import { STORYTIME_ROOT, readLevelWeeks, readPhonicsGraph, storytimeWeekFile } from '../lib/storytime/files';
import type { StorytimeWeek } from '../lib/storytime/schema';
import {
    checkStorytimeCoverOutDir,
    checkStorytimeCoverQr,
    checkStorytimeCoverThai,
    loadStorytimeCoverBooks,
    renderStorytimeCover,
    storytimeCoverPanelValues,
    storytimeCoverQrGrid,
    storytimeCoverQrSvg,
    STORYTIME_LINE_ADDRESS,
    type StorytimeCoverBook,
    type StorytimeCoverPanelValue,
} from '../lib/storytime/print/covers';

/**
 * Adversarial guards for Phase 1 (track storytime_covers_20261027), on the reviewed HEAD.
 * Each case attacks one target that no R row of storytime-print-covers-16books.test.ts covers.
 * Targets already covered there are named and skipped: A7 and the 4.9 copy bypass rows (R6),
 * the Thai drop/tone/extra rows (R7), the QR swap and quiet-zone rows (R8), the D12 CLI stop
 * and empty-folder rows (R22), the mixed-case display rows (R27), and the `;` throw row (R28).
 * No case starts Chrome: CLI cases exit 2 in argument validation, and every other case is a
 * pure function probe. Mutation copies live in folders from fs.mkdtempSync (rule 11.1).
 */
const temporaryFolders: string[] = [];
const repoRoot = path.resolve(STORYTIME_ROOT, '..', '..');
const dashboardRoot = path.join(repoRoot, 'dashboard');
const scriptFile = path.join(dashboardRoot, 'scripts/storytime/make-storytime-book-cover.ts');

function temporaryFolder(): string {
    fs.mkdirSync('/tmp/opencode', { recursive: true });
    const folder = fs.mkdtempSync('/tmp/opencode/storytime-covers-adv-');
    temporaryFolders.push(folder);
    return folder;
}

function requireScript(): void {
    expect(fs.existsSync(scriptFile), 'Missing script: scripts/storytime/make-storytime-book-cover.ts').toBe(true);
}

function requireHeavyWrapper(): void {
    let pid = process.pid;
    let found = false;
    for (let hop = 0; pid > 1 && hop < 64; hop++) {
        const command = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0');
        if (command.some((arg) => arg.endsWith('/heavy-run.sh'))) found = true;
        const parent = fs.readFileSync(`/proc/${pid}/status`, 'utf8').match(/^PPid:\s+(\d+)/m);
        pid = Number(parent?.[1] ?? 0);
    }
    expect(found, 'Run CLI cases only through heavy-run.sh.').toBe(true);
}

function runScript(args: string[], env?: Record<string, string>): { status: number; output: string } {
    requireScript();
    requireHeavyWrapper();
    const childEnv = env ? { ...process.env, ...env } : process.env;
    try {
        const output = execFileSync(process.execPath, ['--import', 'tsx', scriptFile, ...args], {
            cwd: dashboardRoot, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024, env: childEnv,
        });
        return { status: 0, output };
    } catch (error) {
        const failed = error as { status?: number; stdout?: string | Buffer; stderr?: string | Buffer };
        return { status: failed.status ?? 1, output: `${failed.stdout ?? ''}\n${failed.stderr ?? ''}` };
    }
}

/**
 * Copies the shipped Level 2 weeks 1 to 8 into a temporary folder, so a title mutation never
 * touches content/ (rule 11.1). Mirrors the R28 mutation setup.
 * @returns The temporary root holding l2/w01.json to w08.json.
 */
function copyLevel2Weeks(): string {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-covers-adv-'));
    temporaryFolders.push(tempRoot);
    const levelDir = path.join(tempRoot, 'l2');
    fs.mkdirSync(levelDir, { recursive: true });
    for (let week = 1; week <= 8; week++) {
        const source = storytimeWeekFile(STORYTIME_ROOT, 2, week);
        fs.copyFileSync(source, path.join(levelDir, path.basename(source)));
    }
    return tempRoot;
}

function panelValue(values: StorytimeCoverPanelValue[], field: StorytimeCoverPanelValue['field']): StorytimeCoverPanelValue {
    const found = values.find((entry) => entry.field === field);
    expect(found, `The panel values must hold the field ${field}.`).toBeDefined();
    return found!;
}

afterEach(() => {
    for (const folder of temporaryFolders.splice(0)) fs.rmSync(folder, { recursive: true, force: true });
});

describe('Storytime covers adversarial Phase 1', () => {
    it('ADV-OUT: the output-folder guard stops .., trailing slash, same-folder, mid-path and chained symlinks, and v2 into proof-v3', () => {
        const root = temporaryFolder();
        const storytimeRoot = path.join(root, 'storytime');
        for (const folder of ['proof', 'proof-v2', 'proof-v3']) fs.mkdirSync(path.join(storytimeRoot, folder), { recursive: true });
        const refuse = (out: string, version: number, folder: string, other: number) => {
            const errors = checkStorytimeCoverOutDir(out, version, root);
            expect(errors.length, `A version ${version} build into ${out} must stop.`).toBeGreaterThan(0);
            expect(errors.join(' '), 'The error names the folder of the other version.').toContain(`"${folder}"`);
            expect(errors.join(' '), 'The error names the version of the other folder.').toContain(`version ${other}`);
        };
        refuse(path.join(storytimeRoot, 'proof-v3', '..', 'proof', 'l2u1'), 3, 'proof', 1);
        refuse(path.join(storytimeRoot, 'proof', 'l2u1') + path.sep, 3, 'proof', 1);
        refuse(path.join(storytimeRoot, 'proof'), 3, 'proof', 1);
        refuse(path.join(storytimeRoot, 'proof-v3'), 2, 'proof-v3', 3);
        const linkB = path.join(root, 'link-b');
        fs.symlinkSync(path.join(storytimeRoot, 'proof'), linkB);
        const linkA = path.join(root, 'link-a');
        fs.symlinkSync(linkB, linkA);
        refuse(path.join(linkA, 'l2u1'), 3, 'proof', 1);
        const mid = path.join(root, 'mid');
        fs.symlinkSync(storytimeRoot, mid);
        refuse(path.join(mid, 'proof', 'l2u1'), 3, 'proof', 1);
        expect(checkStorytimeCoverOutDir(path.join(storytimeRoot, 'proof-v3', '..', 'other', 'l2u1'), 3, root), 'A .. path outside every version folder stays allowed.').toEqual([]);
        expect(checkStorytimeCoverOutDir(path.join(storytimeRoot, 'proof-v3', 'l2u1'), 3, root), 'A version 3 build into proof-v3 stays allowed.').toEqual([]);
        fs.mkdirSync(path.join(storytimeRoot, 'proof-v2x'), { recursive: true });
        fs.mkdirSync(path.join(storytimeRoot, 'proof-v03'), { recursive: true });
        expect(checkStorytimeCoverOutDir(path.join(storytimeRoot, 'proof-v2x', 'l2u1'), 2, root), 'proof-v2x is not a version folder, so it holds no guarded files.').toEqual([]);
        expect(checkStorytimeCoverOutDir(path.join(storytimeRoot, 'proof-v03', 'l2u1'), 3, root), 'proof-v03 reads as version 3, the same version, so no other folder is at risk.').toEqual([]);
    });

    it('ADV-D12: approved-only values keep the week 1 story but lose every draft-week title, and the rule sees mixed source case', () => {
        const data = loadStorytimeCoverBooks();
        const book = data.books.find((row) => row.level === 2 && row.unit === 1);
        expect(book, 'Row Level 2 Unit 1.').toBeDefined();
        const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
        const approved = weeks.filter((week) => week.approval.text.status === 'approved');
        expect(approved.length, 'At least one approved week ships.').toBeGreaterThan(0);
        expect(approved.length, 'Draft weeks ship beside the approved week.').toBeLessThan(weeks.length);
        const graph = readPhonicsGraph();
        expect(graph, 'The shipped phonics graph must be readable (rule 11.3).').toBeDefined();
        const full = storytimeCoverPanelValues(book!, { weeks, graph: graph! });
        const print = storytimeCoverPanelValues(book!, { weeks: approved, graph: graph! });
        expect(panelValue(print, 'story').value, 'The story passes both builds (D12 choice 4).').toBe(panelValue(full, 'story').value);
        expect(panelValue(print, 'story').value.trim().length, 'The story is not empty.').toBeGreaterThan(0);
        const fullBooks = panelValue(full, 'books').items;
        const printBooks = panelValue(print, 'books').items;
        for (const title of printBooks) expect(fullBooks, `The approved title "${title}" is in the mock list.`).toContain(title);
        expect(fullBooks.length, 'Draft weeks add reader titles that the print context never sees.').toBeGreaterThan(printBooks.length);
        const fullSounds = panelValue(full, 'sounds').items;
        for (const sound of panelValue(print, 'sounds').items) expect(fullSounds, `The approved sound "${sound}" is in the mock list.`).toContain(sound);
        const occurrences: string[] = [];
        for (const week of weeks.filter((entry) => entry.meta.week >= book!.firstWeek && entry.meta.week <= book!.lastWeek)) {
            for (const entry of week.focus.family.words) occurrences.push(entry.word);
            for (const word of week.home?.words ?? []) occurrences.push(word);
            for (const reader of week.books) for (const word of reader.backWords) occurrences.push(word);
            for (const reader of week.books) for (const page of reader.pages) occurrences.push(...(page.text.match(/[a-z]+/gi) ?? []));
            for (const word of week.focus.trickyWords) occurrences.push(word);
        }
        const byKey = new Map<string, Set<string>>();
        for (const word of occurrences) {
            const key = word.toLowerCase();
            if (!byKey.has(key)) byKey.set(key, new Set());
            byKey.get(key)!.add(/^[A-Z]/.test(word) ? 'upper' : 'lower');
        }
        const mixed = [...byKey.entries()].filter(([, cases]) => cases.has('upper') && cases.has('lower')).map(([key]) => key);
        expect(mixed.length, 'The shipped sources hold at least one word in both cases, so D11.5a is exercised.').toBeGreaterThan(0);
        const shown = [...panelValue(full, 'decodable').items, ...panelValue(full, 'sight').items];
        for (const key of mixed) {
            const display = shown.find((item) => item.toLowerCase() === key);
            if (display !== undefined) expect(display, `Mixed-case source "${key}" shows in lower case.`).toBe(key);
        }
    });

    it('ADV-TITLE: a reader title with an ASCII semicolon, even after a space, stops panel values and names the book and title', () => {
        const data = loadStorytimeCoverBooks();
        const book = data.books.find((row) => row.level === 2 && row.unit === 1);
        expect(book, 'Row Level 2 Unit 1.').toBeDefined();
        const graph = readPhonicsGraph();
        expect(graph, 'The shipped phonics graph must be readable (rule 11.3).').toBeDefined();
        const tempRoot = copyLevel2Weeks();
        const mutatedFile = path.join(tempRoot, 'l2', path.basename(storytimeWeekFile(STORYTIME_ROOT, 2, 1)));
        const mutated = JSON.parse(fs.readFileSync(mutatedFile, 'utf8')) as StorytimeWeek;
        const reader = mutated.books.find((row) => row.kind === 'readalong' || row.kind === 'decodable');
        expect(reader, 'Week 1 has a reader title to mutate.').toBeDefined();
        reader!.title = 'Sam ; Pam Mutant';
        fs.writeFileSync(mutatedFile, JSON.stringify(mutated));
        const copied = readLevelWeeks(tempRoot, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
        expect(() => storytimeCoverPanelValues(book!, { weeks: copied, graph: graph! })).toThrow(/Level 2 Unit 1.*Sam ; Pam Mutant/);
    });

    it('ADV-TITLE: a reader title with a full-width semicolon builds, and the books field still splits into its items', () => {
        const data = loadStorytimeCoverBooks();
        const book = data.books.find((row) => row.level === 2 && row.unit === 1);
        expect(book, 'Row Level 2 Unit 1.').toBeDefined();
        const graph = readPhonicsGraph();
        expect(graph, 'The shipped phonics graph must be readable (rule 11.3).').toBeDefined();
        const tempRoot = copyLevel2Weeks();
        const mutatedFile = path.join(tempRoot, 'l2', path.basename(storytimeWeekFile(STORYTIME_ROOT, 2, 1)));
        const mutated = JSON.parse(fs.readFileSync(mutatedFile, 'utf8')) as StorytimeWeek;
        const reader = mutated.books.find((row) => row.kind === 'readalong' || row.kind === 'decodable');
        expect(reader, 'Week 1 has a reader title to mutate.').toBeDefined();
        reader!.title = 'Sam；Pam Mutant';
        fs.writeFileSync(mutatedFile, JSON.stringify(mutated));
        const copied = readLevelWeeks(tempRoot, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
        const values = storytimeCoverPanelValues(book!, { weeks: copied, graph: graph! });
        const books = panelValue(values, 'books');
        expect(books.items, 'The full-width title joins the books field.').toContain('Sam；Pam Mutant');
        expect(books.value.split('; '), 'The books field still splits on the ASCII separator only.').toHaveLength(books.items.length);
    });

    it('ADV-ESC: a hostile title and panel value escape in the cover HTML and round-trip through the parser', () => {
        const hostileTitle = 'Storytime <Advantage> & "Covers" </style>';
        const hostileValue = '<img src="x" onerror="alert(1)"> & "quoted"';
        const book: StorytimeCoverBook = {
            level: 2, unit: 1, firstWeek: 1, lastWeek: 8, title: hostileTitle, levelColour: '#2A77B8', pictureRecipe: [],
            panel: { story: { text: '', weeks: [] }, sounds: { weeks: [] }, decodable: { weeks: [] }, sight: { weeks: [] }, books: { weeks: [] } },
        };
        const values: StorytimeCoverPanelValue[] = [
            { field: 'story', value: hostileValue, items: [hostileValue] },
            { field: 'sounds', value: '', items: [] },
            { field: 'decodable', value: '', items: [] },
            { field: 'sight', value: '', items: [] },
            { field: 'books', value: '', items: [] },
        ];
        const { frontHtml, backHtml } = renderStorytimeCover(book, { panelValues: values });
        expect(backHtml, 'The hostile value escapes angle brackets.').toContain('&lt;img');
        expect(backHtml, 'The hostile value escapes the ampersand.').toContain('&amp;');
        expect(backHtml, 'The hostile value escapes the quote.').toContain('&quot;');
        expect(backHtml, 'A closing style tag in text cannot close the document style.').toContain('&lt;/style&gt;');
        expect(backHtml, 'No raw injected image tag survives.').not.toContain('<img src="x"');
        const back = new DOMParser().parseFromString(backHtml, 'text/html');
        expect(back.querySelector('[data-side="back"]')?.getAttribute('data-title'), 'The back title round-trips.').toBe(hostileTitle);
        expect(back.querySelector('[data-field="story"] [data-part="panel-value"]')?.textContent, 'The panel value round-trips.').toBe(hostileValue);
        const front = new DOMParser().parseFromString(frontHtml, 'text/html');
        expect(front.querySelector('[data-side="front"]')?.getAttribute('data-title'), 'The front title round-trips.').toBe(hostileTitle);
    });

    it('ADV-THAI: the contact lines in a new order fail the Thai check', () => {
        expect(BACK_LINES.contact, 'Contact line count.').toHaveLength(5);
        const reversed = [...BACK_LINES.contact].reverse().join('\n');
        expect(reversed, 'The reversed lines hold the same multiset of Thai.').not.toBe(BACK_LINES.contact.join('\n'));
        expect(checkStorytimeCoverThai(reversed, 'back').length, 'Reordered contact lines must fail.').toBeGreaterThan(0);
    });

    it('ADV-QR: the rendered code is the encoder output for the LINE address, and a one-character URL gives a different grid', () => {
        const svg = generateQRCode(STORYTIME_LINE_ADDRESS);
        expect(svg, 'The encoder returns the LINE SVG.').toEqual(expect.any(String));
        expect(storytimeCoverQrSvg(), 'The cover draws the encoder output, not a pasted image.').toBe(svg);
        const expected = storytimeCoverQrGrid(svg!);
        expect(expected.modules, 'QR module count.').toBe(29);
        const last = STORYTIME_LINE_ADDRESS.slice(-1);
        const otherUrl = `${STORYTIME_LINE_ADDRESS.slice(0, -1)}${last === 'v' ? 'w' : 'v'}`;
        const other = storytimeCoverQrGrid(generateQRCode(otherUrl)!);
        expect(other.cells, 'A one-character URL change moves the grid.').not.toEqual(expected.cells);
        expect(checkStorytimeCoverQr(other.cells, expected.cells), 'The module check reports the difference.').not.toBe(0);
    });

    it('ADV-CLI: a bad level, a bad unit, and an unknown option exit 2 before any write', () => {
        const home = temporaryFolder();
        const env = { HOME: home };
        for (const args of [['--level', '0', '--unit', '1'], ['--level', '9', '--unit', '1'], ['--level', '../x', '--unit', '1'], ['--level', '2'], ['--bogus']]) {
            const result = runScript(args, env);
            expect(result.status, `CLI ${args.join(' ')} exits 2.`).toBe(2);
            expect(result.output, `CLI ${args.join(' ')} prints usage.`).toMatch(/--level|--unit|Unknown argument/);
        }
        const freshOut = path.join(home, 'fresh-out');
        const denied = runScript(['--level', '0', '--unit', '1', '--out', freshOut], env);
        expect(denied.status, 'A rejected CLI exits 2.').toBe(2);
        expect(fs.existsSync(freshOut), 'A rejected CLI creates no output folder.').toBe(false);
    }, 300000);

    it('ADV-D12: the mock values strictly extend the approved values, so a passing print would render draft-week words', () => {
        const data = loadStorytimeCoverBooks();
        const book = data.books.find((row) => row.level === 2 && row.unit === 1);
        expect(book, 'Row Level 2 Unit 1.').toBeDefined();
        const weeks = readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
        const approved = weeks.filter((week) => week.approval.text.status === 'approved');
        const graph = readPhonicsGraph();
        expect(graph, 'The shipped phonics graph must be readable (rule 11.3).').toBeDefined();
        const full = storytimeCoverPanelValues(book!, { weeks, graph: graph! });
        const print = storytimeCoverPanelValues(book!, { weeks: approved, graph: graph! });
        const missing = print.filter((entry) => !entry.value.trim()).map((entry) => entry.field);
        expect(missing.length, 'The print context still lacks a draft-only field today, so the D12 stop fires first.').toBeGreaterThan(0);
        const extra = panelValue(full, 'sounds').items.filter((sound) => !panelValue(print, 'sounds').items.includes(sound));
        expect(extra.length, 'Draft weeks add sounds beyond the approved week.').toBeGreaterThan(0);
    });
});
