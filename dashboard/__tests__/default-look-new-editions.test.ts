import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { CHIBI_QUEST_BOOKS, bookLook, parseLook, projectLook } from '@/lib/look';
import { lessonDocument, type PrintExport } from '@/lib/print/print-export';
import type { ProjectMetadata } from '@/lib/filesystem';

// Track primary_v2_look_20261020, story S8: a new or rewritten Primary
// Advantage edition builds with chibi-quest when it has no look value.
// The 5 shipped editions keep classic. No product code changes in Red.

const REPO = path.resolve(process.cwd(), '..');
const CONTENT = path.join(REPO, 'content', 'primary');
const PRIMARY = path.join(REPO, 'primary');

const SHIPPED_IDS = [
    'origins-2-a0',
    'adventures-1.0-a1',
    'origins-3.1-a0',
    'origins-3.2-a0',
    'quest-4-a1',
];

const NEW_EDITIONS: ProjectMetadata[] = [
    { seriesName: 'Origins', levelNumber: '1', cefrLevel: 'A0' },
    { seriesName: 'Origins', levelNumber: '2', cefrLevel: 'A0' },
    { seriesName: 'Origins', levelNumber: '3.2', cefrLevel: 'A0+' },
    { seriesName: 'Quest', levelNumber: '4', cefrLevel: 'A1' },
    { seriesName: 'Quest', levelNumber: '5', cefrLevel: 'A1' },
    { seriesName: 'Adventure', levelNumber: '9.3', cefrLevel: 'A2' },
];

function readShippedMeta(id: string): ProjectMetadata {
    const raw = fs.readFileSync(path.join(PRIMARY, id, 'project.json'), 'utf8');
    const data = JSON.parse(raw) as ProjectMetadata;
    return { seriesName: data.seriesName, levelNumber: data.levelNumber, cefrLevel: data.cefrLevel, look: data.look };
}

describe('S8 default look for new editions', () => {
    it('gives chibi-quest to a new edition with no look, at every series', () => {
        expect(NEW_EDITIONS.length).toBe(6);
        expect(NEW_EDITIONS.every((m) => m.look === undefined)).toBe(true);
        for (const meta of NEW_EDITIONS) {
            expect(projectLook(meta)).toBe('chibi-quest');
        }
    });

    it('gives chibi-quest to a rewritten Origins 3.2 edition with no look', () => {
        const rewritten: ProjectMetadata = { seriesName: 'Origins', levelNumber: '3.2', cefrLevel: 'A0+' };
        expect(rewritten.look).toBe(undefined);
        expect(projectLook(rewritten)).toBe('chibi-quest');
    });

    it('keeps each of the 5 shipped editions at classic', () => {
        expect(SHIPPED_IDS.length).toBe(5);
        expect([...SHIPPED_IDS].sort()).toEqual([
            'adventures-1.0-a1',
            'origins-2-a0',
            'origins-3.1-a0',
            'origins-3.2-a0',
            'quest-4-a1',
        ]);
        for (const id of SHIPPED_IDS) {
            const meta = readShippedMeta(id);
            expect(projectLook(meta)).toBe('classic');
        }
    });

    it('marks each shipped project.json with an explicit classic look', () => {
        expect(SHIPPED_IDS.length).toBe(5);
        for (const id of SHIPPED_IDS) {
            const meta = readShippedMeta(id);
            expect(meta.look).toBe('classic');
        }
    });

    it('keeps an explicit look in project.json, and refuses an unknown look', () => {
        expect(projectLook({ seriesName: 'Quest', levelNumber: '5', cefrLevel: 'A1', look: 'classic' })).toBe('classic');
        expect(projectLook({ seriesName: 'Origins', levelNumber: '1', cefrLevel: 'A0', look: 'chibi-quest' })).toBe('chibi-quest');
        expect(() => projectLook({ seriesName: 'Quest', levelNumber: '5', cefrLevel: 'A1', look: 'riven-lands' as never })).toThrow(/quest-5/);
        expect(() => parseLook('riven-lands', 'quest-5-a1')).toThrow(/quest-5-a1.*riven-lands/);
        expect(parseLook(undefined, 'x')).toBe('classic');
        expect(projectLook(null)).toBe('classic');
    });

    it('keeps the book-folder path at classic for Origins 1 to Quest 4', () => {
        const books = ['origins-1', 'origins-2', 'origins-3.1', 'origins-3.2', 'quest-4'];
        expect(books.length).toBe(5);
        for (const book of books) {
            expect(bookLook(book)).toBe('classic');
        }
        expect(CHIBI_QUEST_BOOKS.includes('quest-5')).toBe(true);
        expect(CHIBI_QUEST_BOOKS.includes('adventure-9.3')).toBe(true);
        expect(CHIBI_QUEST_BOOKS.includes('origins-2')).toBe(false);
        expect(CHIBI_QUEST_BOOKS.includes('quest-4')).toBe(false);
    });

    it('keeps the classic golden byte-identical with no look and with classic', async () => {
        const golden = path.join(CONTENT, 'origins-3.2', 'print', 'golden');
        const record = JSON.parse(fs.readFileSync(path.join(CONTENT, 'origins-3.2', 'print', 'p05.json'), 'utf8')) as PrintExport;
        const withKey = fs.readFileSync(path.join(golden, 'lesson-05.html'), 'utf8');
        const noKey = fs.readFileSync(path.join(golden, 'lesson-05-no-key.html'), 'utf8');
        expect(await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel)).toBe(withKey);
        expect(await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, { look: 'classic' })).toBe(withKey);
        expect(await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, { answerKey: false })).toBe(noKey);
        expect(await lessonDocument(record.lesson, record.lessonNumber, record.seriesName, record.seriesLevel, { answerKey: false, look: 'classic' })).toBe(noKey);
    });

    it('rebuilds no shipped or on-order print file', () => {
        const out = execSync('git status --porcelain -- content/primary', { cwd: REPO, encoding: 'utf8' });
        const lines = out.split('\n').filter((l) => l.trim().length > 0);
        const printLines = lines.filter((l) => l.includes('/print/'));
        expect(printLines).toEqual([]);
    });
});
