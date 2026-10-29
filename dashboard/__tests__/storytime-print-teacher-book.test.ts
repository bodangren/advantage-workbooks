// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getTranslations } from '../lib/teacher-manual/i18n';
import { compileStorytimeManual } from '../lib/storytime/manual';
import { STORYTIME_ROOT, readLevelWeeks } from '../lib/storytime/files';

/**
 * Phase 3 contract.
 * `lib/storytime/print/text-diff.ts` exports
 * `diffPrintText(reference: string, actual: string): Array<{ line: number; expected: string; actual: string }>`,
 * which compares `pdftotext -layout` output and ignores page-number-only differences.
 * It also exports `teacherBookPrintFileName(level: number, unit: number, lang: 'th', version: number): string`.
 * The build CLI is `scripts/storytime/make-teacher-book-print.ts`.
 */

const textDiffPath = '../lib/storytime/print/text-diff';
const loadTextDiff = async () => await import(textDiffPath) as unknown as {
    diffPrintText?: (reference: string, actual: string) => Array<{ line: number; expected: string; actual: string }>;
    teacherBookPrintFileName?: (level: number, unit: number, lang: 'th', version: number) => string;
};

function pick<K extends keyof Awaited<ReturnType<typeof loadTextDiff>>>(module: Awaited<ReturnType<typeof loadTextDiff>>, name: K): NonNullable<Awaited<ReturnType<typeof loadTextDiff>>[K]> {
    expect(module[name], `Export ${String(name)}.`).toBeDefined();
    return module[name]!;
}

describe('Storytime teacher-book print: Thai week 1', () => {
    it('reports no text difference for identical layout text', async () => {
        const api = await loadTextDiff();
        expect(pick(api, 'diffPrintText')('หน้า 1\nสวัสดี\n', 'หน้า 1\nสวัสดี\n')).toEqual([]);
    });

    it('reports exactly the changed Thai line and word', async () => {
        const api = await loadTextDiff();
        const differences = pick(api, 'diffPrintText')('หน้า 1\nแมวนอน\nจบ\n', 'หน้า 1\nแมววิ่ง\nจบ\n');
        expect(differences).toEqual([{ line: 2, expected: 'แมวนอน', actual: 'แมววิ่ง' }]);
    });

    it('ignores a change that affects only page numbers', async () => {
        const api = await loadTextDiff();
        expect(pick(api, 'diffPrintText')('หน้า 1\nสวัสดี\nหน้า 2\n', 'หน้า 9\nสวัสดี\nหน้า 10\n')).toEqual([]);
    });

    it('detects a missing Thai tone mark in PDF/X-extracted text', async () => {
        const api = await loadTextDiff();
        expect(pick(api, 'diffPrintText')('หน้า 1\nน้ำ\n', 'หน้า 1\nนา\n')).toEqual([
            { line: 2, expected: 'น้ำ', actual: 'นา' },
        ]);
    });

    it('returns the versioned Thai teacher-book PDF/X file name', async () => {
        const api = await loadTextDiff();
        expect(pick(api, 'teacherBookPrintFileName')(2, 1, 'th', 1)).toBe('Storytime-Advantage-L2-U1-Teachers-Book-TH-v1_PDFX-1a.pdf');
    });

    it('renders each shipped week 1 step id and all four Thai teaching-note headings', () => {
        const entry = readLevelWeeks(STORYTIME_ROOT, 2).find((item) => item.week?.meta.week === 1);
        expect(entry?.week, 'shipped level 2 week 1 exists').toBeDefined();
        const week = entry!.week!;
        const result = compileStorytimeManual([week], { lang: 'th', paper: 'a4' });
        const headings = getTranslations('th').teachingNotes;
        const visibleText = result.html.replace(/<[^>]+>/g, ' ');
        for (const step of week.scripts.flatMap((script) => script.steps)) {
            expect(visibleText).toContain(step.id);
        }
        for (const heading of Object.values(headings)) {
            expect(visibleText).toContain(heading);
        }
    });

    it('provides the teacher-book print CLI and a successful help response', () => {
        const script = path.resolve(__dirname, '../scripts/storytime/make-teacher-book-print.ts');
        expect(fs.existsSync(script), 'teacher-book print CLI exists').toBe(true);
        const output = execFileSync(process.execPath, ['--import', 'tsx', script, '--help'], { encoding: 'utf8' });
        expect(output).toContain('make-teacher-book-print.ts');
    });
});
