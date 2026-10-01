// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { loadPackageFolder, priorPackageTexts, loadObjectiveIds, findRepoRoot, BOOK_ORDER } from '../lib/lesson-package/files';
import { fixturePackage } from './fixtures/lesson-package-fixture';

let root: string;

function write(book: string, file: string, change: (p: ReturnType<typeof fixturePackage>) => void) {
    const pkg = fixturePackage();
    pkg.meta.book = book;
    change(pkg);
    fs.mkdirSync(path.join(root, book), { recursive: true });
    fs.writeFileSync(path.join(root, book, file), JSON.stringify(pkg));
}

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'packages-'));
});

afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
});

describe('lesson package files', () => {
    it('loads a book folder in lesson-number order and keeps unparsable files with their error', () => {
        write('origins-3.2', 'p10.json', (p) => {
            p.meta.number = 10;
            p.meta.lesson = 'P10';
        });
        write('origins-3.2', 'p02.json', (p) => {
            p.meta.number = 2;
            p.meta.lesson = 'P02';
        });
        fs.writeFileSync(path.join(root, 'origins-3.2', 'broken.json'), '{"version": 1}');
        fs.writeFileSync(path.join(root, 'origins-3.2', 'inject-log.jsonl'), '');
        const files = loadPackageFolder(path.join(root, 'origins-3.2'));
        expect(files.map((f) => f.pkg?.meta.lesson ?? 'error')).toEqual(['P02', 'P10', 'error']);
        expect(files[2].error).toBeTruthy();
    });

    it('gives the earlier books and the earlier lessons of the same book as prior texts', () => {
        expect(BOOK_ORDER.indexOf('origins-3.1')).toBeLessThan(BOOK_ORDER.indexOf('origins-3.2'));
        write('origins-3.1', 'e12.json', (p) => {
            p.meta.lesson = 'E12';
            p.meta.number = 12;
        });
        write('origins-3.2', 'p01.json', (p) => {
            p.meta.lesson = 'P01';
            p.meta.number = 1;
        });
        write('origins-3.2', 'p02.json', (p) => {
            p.meta.lesson = 'P02';
            p.meta.number = 2;
        });
        const prior = priorPackageTexts(root, 'origins-3.2', 2);
        expect(prior.map((t) => t.id)).toEqual(['E12', 'P01']);
        expect(priorPackageTexts(root, 'origins-3.1', 12).map((t) => t.id)).toEqual([]);
    });

    it('reads the objective IDs from every objective key file', () => {
        fs.writeFileSync(path.join(root, 'a0-objective-key.json'), JSON.stringify({ objectives: [{ id: 'R10.2' }, { id: 'L19.1' }] }));
        fs.writeFileSync(path.join(root, 'a1-objective-key.json'), JSON.stringify({ objectives: [{ id: 'R30.1' }] }));
        expect([...loadObjectiveIds(root)].sort()).toEqual(['L19.1', 'R10.2', 'R30.1']);
    });

    it('finds the repo root from the repo root, from dashboard/, and from WORKBOOKS_ROOT', () => {
        const repo = path.resolve(process.cwd(), '..');
        expect(findRepoRoot(repo)).toBe(repo);
        expect(findRepoRoot(path.join(repo, 'dashboard'))).toBe(repo);
        expect(findRepoRoot('/anywhere', '/some/root')).toBe('/some/root');
    });
});
