// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { packagePath, listBooks, readPackageFile, savePackage, approvePart, chooseImage, renderPictures, recordInjection, recordLocales, StoreError } from '../lib/lesson-package/store';
import { LessonPackageSchema } from '../lib/lesson-package/schema';
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

/** Gives the fixture a picture and audio, with the files on disk. */
function withMedia(p: ReturnType<typeof fixturePackage>) {
    p.images[0].file = 'b/media/t01/hero.jpg';
    p.audio = { article: 'b/media/t01/article.mp3', sentences: [{ text: 'This is Pip.', startTime: 0, endTime: 1 }], wordTimes: [] };
    fs.mkdirSync(path.join(root, 'b/media/t01'), { recursive: true });
    fs.writeFileSync(path.join(root, 'b/media/t01/hero.jpg'), 'jpg');
    fs.writeFileSync(path.join(root, 'b/media/t01/article.mp3'), 'mp3');
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
        put('b', 't01', withMedia);
        const pkg = approvePart(root, 'b', 't01', 'text', ctx(), '2026-10-02');
        expect(pkg.approval.text).toEqual({ status: 'approved', date: '2026-10-02' });
        expect(() => approvePart(root, 'b', 't01', 'lesson', ctx(), '2026-10-02')).toThrow(/not approved: thai, bank, images, audio/);
        for (const part of ['thai', 'bank', 'images', 'audio'] as const) approvePart(root, 'b', 't01', part, ctx(), '2026-10-02');
        expect(approvePart(root, 'b', 't01', 'lesson', ctx(), '2026-10-02').approval.lesson.status).toBe('approved');
    });

    it('refuses to approve images or audio before the files exist', () => {
        put('b', 't01');
        expect(() => approvePart(root, 'b', 't01', 'images', ctx(), '2026-10-02')).toThrow(/images: no picture for hero/);
        expect(() => approvePart(root, 'b', 't01', 'audio', ctx(), '2026-10-02')).toThrow(/audio: no article audio/);
        put('b', 't01', withMedia);
        fs.rmSync(path.join(root, 'b/media/t01/hero.jpg'));
        expect(() => approvePart(root, 'b', 't01', 'images', ctx(), '2026-10-02')).toThrow(/images: no picture for hero/);
    });

    it('copies a chosen candidate to the picture file, keeps the raw picture, and sends images back to draft', async () => {
        put('b', 't01', (p) => {
            p.images[0].candidates = ['b/media/t01/candidates/hero_001.jpg', 'b/media/t01/candidates/hero_002.jpg'];
            p.approval = { images: { status: 'approved', date: '2026-10-01' } };
        });
        fs.mkdirSync(path.join(root, 'b/media/t01/candidates'), { recursive: true });
        const sharp = (await import('sharp')).default;
        await sharp({ create: { width: 64, height: 64, channels: 3, background: '#808080' } }).jpeg().toFile(path.join(root, 'b/media/t01/candidates/hero_002.jpg'));
        await expect(chooseImage(root, 'b', 't01', 'hero', 'b/media/t01/candidates/other.jpg', ctx())).rejects.toThrow(/not a candidate/);
        await expect(chooseImage(root, 'b', 't01', 'inline-para-3', 'x.jpg', ctx())).rejects.toThrow(/No image/);
        const { pkg } = await chooseImage(root, 'b', 't01', 'hero', 'b/media/t01/candidates/hero_002.jpg', ctx());
        expect(pkg?.images[0]).toMatchObject({ file: 'b/media/t01/hero.jpg', chosenFrom: 'b/media/t01/candidates/hero_002.jpg' });
        expect(pkg?.approval.images.status).toBe('draft');
        expect(fs.existsSync(path.join(root, 'b/media/t01/hero.jpg'))).toBe(true);
        // No signs, so no raw copy: a picture without a raw copy has nothing drawn on it.
        expect(fs.existsSync(path.join(root, 'b/media/t01/hero.raw.jpg'))).toBe(false);
    });

    it('keeps a raw copy while a picture has signs, and puts the raw picture back when the signs go', async () => {
        const sharp = (await import('sharp')).default;
        put('b', 't01', (p) => {
            p.images[0].file = 'b/media/t01/hero.jpg';
        });
        fs.mkdirSync(path.join(root, 'b/media/t01'), { recursive: true });
        const hero = path.join(root, 'b/media/t01/hero.jpg');
        await sharp({ create: { width: 100, height: 100, channels: 3, background: '#2060c0' } }).jpeg().toFile(hero);
        const plain = fs.readFileSync(hero);
        const pkg = LessonPackageSchema.parse(readPackageFile(root, 'b', 't01'));
        pkg.images[0].overlay = [{ text: 'PARK', box: [0.1, 0.1, 0.8, 0.3] }];
        await renderPictures(root, pkg);
        expect(fs.readFileSync(path.join(root, 'b/media/t01/hero.raw.jpg')).equals(plain)).toBe(true);
        expect(fs.readFileSync(hero).equals(plain)).toBe(false);
        pkg.images[0].overlay = [{ text: 'ZOO', box: [0.1, 0.1, 0.8, 0.3] }];
        await renderPictures(root, pkg);
        expect(fs.readFileSync(path.join(root, 'b/media/t01/hero.raw.jpg')).equals(plain)).toBe(true);
        pkg.images[0].overlay = [];
        await renderPictures(root, pkg);
        expect(fs.readFileSync(hero).equals(plain)).toBe(true);
        expect(fs.existsSync(path.join(root, 'b/media/t01/hero.raw.jpg'))).toBe(false);
    });

    it('refuses to approve a part while a check fails for it', () => {
        put('b', 't01', (p) => {
            p.thai.summary = '';
        });
        expect(() => approvePart(root, 'b', 't01', 'thai', ctx(), '2026-10-02')).toThrow(/thai/);
    });

    it('records the database ids of an injection and keeps the approvals', () => {
        put('b', 't01', (p) => {
            p.approval = { text: { status: 'approved', date: '2026-10-01' } };
        });
        const ids = { articleId: 'cart1', mcq: { m1: 'cq1' }, saq: { s1: 'cs1' }, laq: { l1: 'cl1' }, flashcardId: 'cf1', contentHash: 'abc', injectedAt: '2026-10-02T03:00:00.000Z' };
        recordInjection(root, 'b', 't01', 'legacy', ids);
        const onDisk = readPackageFile(root, 'b', 't01') as { db: { legacy: unknown }; approval: { text: { status: string } } };
        expect(onDisk.db.legacy).toEqual(ids);
        expect(onDisk.approval.text.status).toBe('approved');
        // A later edit on the review page keeps the ids.
        const edited = fixturePackage();
        edited.text.summary = 'Changed.';
        savePackage(root, 'b', 't01', edited, ctx());
        expect((readPackageFile(root, 'b', 't01') as { db: { legacy: unknown } }).db.legacy).toEqual(ids);
    });

    it('records the old translations, keeps the approvals, and a review-page save cannot change them', () => {
        put('b', 't01', (p) => {
            p.approval = { bank: { status: 'approved', date: '2026-10-01' } };
        });
        const locales = { articleId: 'cart1', fetchedAt: '2026-10-02T03:00:00.000Z', summary: { cn: '摘要', tw: '摘要', vi: 'Tóm tắt' }, sentences: [{ en: 'This is Pip.', cn: '这是皮普。', tw: '這是皮普。', vi: 'Đây là Pip.' }], words: [] };
        recordLocales(root, 'b', 't01', locales);
        const onDisk = readPackageFile(root, 'b', 't01') as { locales: unknown; approval: { bank: { status: string } } };
        expect(onDisk.locales).toEqual(locales);
        expect(onDisk.approval.bank.status).toBe('approved');
        const edited = fixturePackage();
        edited.locales = { ...locales, summary: { cn: 'x', tw: 'x', vi: 'x' } };
        savePackage(root, 'b', 't01', edited, ctx());
        expect((readPackageFile(root, 'b', 't01') as { locales: unknown }).locales).toEqual(locales);
        expect(() => recordLocales(root, 'b', 't01', { ...locales, articleId: '' })).toThrow();
    });

    it('gives 404 for a missing package', () => {
        expect(() => readPackageFile(root, 'b', 'nope')).toThrow(expect.objectContaining({ status: 404 }));
    });
});
