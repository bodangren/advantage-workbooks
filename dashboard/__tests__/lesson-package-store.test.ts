// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { packagePath, listBooks, readPackageFile, savePackage, approvePart, StoreError } from '../lib/lesson-package/store';
import type { PackageCheckContext } from '../lib/lesson-package/checks';
import { fixturePackage, fixtureIndex, FIXTURE_PROFILE, FIXTURE_SHAPE, FIXTURE_OBJECTIVES } from './fixtures/lesson-package-fixture';

let root: string;
const ctx = (): PackageCheckContext => ({ index: fixtureIndex, prior: [], profile: FIXTURE_PROFILE, shape: FIXTURE_SHAPE, objectiveIds: FIXTURE_OBJECTIVES });

function put(book: string, lesson: string, change?: (p: ReturnType<typeof fixturePackage>) => void) {
    const pkg = fixturePackage();
    change?.(pkg);
    fs.mkdirSync(path.join(root, book), { recursive: true });
    fs.writeFileSync(path.join(root, book, `${lesson}.json`), JSON.stringify(pkg));
    return pkg;
}

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'store-'));
});

afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
});

describe('lesson package store', () => {
    it('refuses ids that could leave the content folder', () => {
        expect(() => packagePath(root, '..', 'e12')).toThrow(StoreError);
        expect(() => packagePath(root, 'origins-3.1', '../../x')).toThrow(StoreError);
        expect(() => packagePath(root, 'Origins 3.1', 'e12')).toThrow(StoreError);
        expect(packagePath(root, 'origins-3.1', 'e12')).toBe(path.join(root, 'origins-3.1', 'e12.json'));
    });

    it('lists the books and their lessons with the approval state', () => {
        put('origins-3.2', 'p01');
        put('origins-3.1', 'e12');
        const books = listBooks(root);
        expect(books.map((b) => b.book)).toEqual(['origins-3.1', 'origins-3.2']);
        expect(books[0].lessons[0]).toMatchObject({ lesson: 'e12', title: 'Where Is the Ball?', approval: { text: { status: 'draft' } } });
    });

    it('saves a valid package, returns the report, and keeps the database ids from disk', () => {
        put('b', 't01', (p) => {
            p.db = { legacy: { articleId: 'cm123', mcq: {}, saq: {}, laq: {} } };
        });
        const edited = fixturePackage();
        edited.text.summary = 'Pip finds his red ball.';
        edited.db = {};
        const result = savePackage(root, 'b', 't01', edited, ctx());
        expect(result.saved).toBe(true);
        expect(result.report.checks.every((c) => c.status !== 'fail')).toBe(true);
        const onDisk = readPackageFile(root, 'b', 't01') as ReturnType<typeof fixturePackage>;
        expect(onDisk.text.summary).toBe('Pip finds his red ball.');
        expect(onDisk.db?.legacy?.articleId).toBe('cm123');
    });

    it('does not save a package that fails the schema', () => {
        put('b', 't01');
        const result = savePackage(root, 'b', 't01', { version: 1 }, ctx());
        expect(result.saved).toBe(false);
        expect(result.report.checks[0]).toMatchObject({ id: 'schema', status: 'fail' });
        expect((readPackageFile(root, 'b', 't01') as { meta: unknown }).meta).toBeTruthy();
    });

    it('resets the approval of a part that changes, and of the lesson', () => {
        put('b', 't01', (p) => {
            p.approval = { text: { status: 'approved', date: '2026-10-01' }, thai: { status: 'approved', date: '2026-10-01' }, lesson: { status: 'approved', date: '2026-10-01' } };
        });
        const edited = fixturePackage();
        edited.approval = { text: { status: 'approved', date: '2026-10-01' }, thai: { status: 'approved', date: '2026-10-01' }, lesson: { status: 'approved', date: '2026-10-01' } };
        edited.thai.summary = 'ปิ๊ปหาลูกบอล';
        savePackage(root, 'b', 't01', edited, ctx());
        const onDisk = readPackageFile(root, 'b', 't01') as { approval: Record<string, { status: string }> };
        expect(onDisk.approval.thai.status).toBe('draft');
        expect(onDisk.approval.lesson.status).toBe('draft');
        expect(onDisk.approval.text.status).toBe('approved');
    });

    it('approves a part with the date, and approves the lesson only when every part is approved and nothing fails', () => {
        put('b', 't01');
        const pkg = approvePart(root, 'b', 't01', 'text', ctx(), '2026-10-02');
        expect(pkg.approval.text).toEqual({ status: 'approved', date: '2026-10-02' });
        expect(() => approvePart(root, 'b', 't01', 'lesson', ctx(), '2026-10-02')).toThrow(/not approved: thai, bank, images, audio/);
        for (const part of ['thai', 'bank', 'images', 'audio'] as const) approvePart(root, 'b', 't01', part, ctx(), '2026-10-02');
        expect(approvePart(root, 'b', 't01', 'lesson', ctx(), '2026-10-02').approval.lesson.status).toBe('approved');
    });

    it('refuses to approve a part while a check fails for it', () => {
        put('b', 't01', (p) => {
            p.thai.summary = '';
        });
        expect(() => approvePart(root, 'b', 't01', 'thai', ctx(), '2026-10-02')).toThrow(/thai/);
    });

    it('gives 404 for a missing package', () => {
        expect(() => readPackageFile(root, 'b', 'nope')).toThrow(expect.objectContaining({ status: 404 }));
    });
});
