import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Adversarial guards for Phase 3 (track storytime_print_r1_20261025).
 * Each test pins a boundary of `diffPrintText`, `teacherBookPrintFileName`,
 * or the teacher-book CLI. No test writes outside a temporary folder.
 * The CLI tests run the real script with a temporary HOME and a bounded
 * timeout, so a regression that starts Chrome fails by timeout.
 */

const textDiffPath = '../lib/storytime/print/text-diff';
const loadTextDiff = async () => await import(textDiffPath) as unknown as {
    diffPrintText: (reference: string, actual: string) => Array<{ line: number; expected: string; actual: string }>;
    teacherBookPrintFileName: (level: number, unit: number, lang: 'th', version: number) => string;
};

const cliScript = () => path.resolve(__dirname, '../scripts/storytime/make-teacher-book-print.ts');

interface CliResult {
    status: number | null;
    output: string;
}

/** Runs the real CLI with a temporary HOME and a bounded timeout. */
function runCli(home: string, args: string[]): CliResult {
    try {
        execFileSync(process.execPath, ['--import', 'tsx', cliScript(), ...args], {
            cwd: path.resolve(__dirname, '..'),
            env: { ...process.env, HOME: home },
            encoding: 'utf8',
            timeout: 25_000,
        });
        return { status: 0, output: '' };
    } catch (error) {
        const childError = error as NodeJS.ErrnoException & { status?: number | null; stdout?: string; stderr?: string };
        return {
            status: childError.status ?? null,
            output: `${childError.stdout ?? ''}${childError.stderr ?? ''}${childError.message}`,
        };
    }
}

/** Makes a temporary HOME with an output folder and a drafts folder. */
function makeHome(): { root: string; folder: string; drafts: string } {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-adv-p3-'));
    const folder = path.join(root, 'Desktop', 'print-ready', 'storytime', 'tb');
    const drafts = path.join(root, 'drafts');
    fs.mkdirSync(folder, { recursive: true });
    fs.mkdirSync(drafts, { recursive: true });
    return { root, folder, drafts };
}

describe('Storytime teacher-book adversarial: the text gate reports real changes', () => {
    it('detects a dropped Thai vowel mark', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('หน้า 1\nไม้\n', 'หน้า 1\nไม\n')).toEqual([
            { line: 2, expected: 'ไม้', actual: 'ไม' },
        ]);
    });

    it('detects a dropped Thai tone mark on a second word', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('หน้า 1\nเก่า\n', 'หน้า 1\nเกา\n')).toEqual([
            { line: 2, expected: 'เก่า', actual: 'เกา' },
        ]);
    });

    it('detects a changed number in a content line', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('หน้า 1\nนักเรียน 3 คน\n', 'หน้า 1\nนักเรียน 4 คน\n')).toEqual([
            { line: 2, expected: 'นักเรียน 3 คน', actual: 'นักเรียน 4 คน' },
        ]);
    });

    it('reports a swapped pair of lines as two differences, never as clean', async () => {
        const { diffPrintText } = await loadTextDiff();
        const differences = diffPrintText('a\nb\nc\n', 'a\nc\nb\n');
        expect(differences).toEqual([
            { line: 2, expected: '', actual: 'c' },
            { line: 3, expected: 'c', actual: '' },
        ]);
    });

    it('detects a zero-width character that the eye cannot see', async () => {
        const { diffPrintText } = await loadTextDiff();
        const differences = diffPrintText('แมวนอน\n', 'แมว​นอน\n');
        expect(differences).toHaveLength(1);
        expect(differences[0].line).toBe(1);
    });

    it('detects a curly quote changed to a straight quote', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('เขาพูดว่า ‘สวัสดี’\n', "เขาพูดว่า 'สวัสดี'\n")).toEqual([
            { line: 1, expected: 'เขาพูดว่า ‘สวัสดี’', actual: "เขาพูดว่า 'สวัสดี'" },
        ]);
    });

    it('detects a change on the first line with line number 1', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('แมวนอน\nจบ\n', 'แมววิ่ง\nจบ\n')).toEqual([
            { line: 1, expected: 'แมวนอน', actual: 'แมววิ่ง' },
        ]);
    });

    it('detects a change on the last line with the last line number', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('เริ่ม\nจบแล้ว\n', 'เริ่ม\nจบเลย\n')).toEqual([
            { line: 2, expected: 'จบแล้ว', actual: 'จบเลย' },
        ]);
    });

    it('numbers two added lines at the end with the same next line (A-P3-1)', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('a\nb\n', 'a\nb\nc\nd\n')).toEqual([
            { line: 3, expected: '', actual: 'c' },
            { line: 3, expected: '', actual: 'd' },
        ]);
    });
});

describe('Storytime teacher-book adversarial: page-number lines and content lines', () => {
    it('ignores a changed Thai page-number line (A-P3-2)', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('หน้า 1\nสวัสดี\nหน้า 2\n', 'หน้า 3\nสวัสดี\nหน้า 4\n')).toEqual([]);
    });

    it('ignores a changed English page-number line (A-P3-2)', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('Page 1\nHello\n', 'Page 2\nHello\n')).toEqual([]);
    });

    it('compares a bare number because it can be content (A-P3-2)', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('3\nสวัสดี\n', '4\nสวัสดี\n')).toEqual([
            { line: 1, expected: '3', actual: '4' },
        ]);
    });

    it('compares a content line that starts with a page number (A7)', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('หน้า 3 แมวนอน\n', 'หน้า 3 แมววิ่ง\n')).toEqual([
            { line: 1, expected: 'หน้า 3 แมวนอน', actual: 'หน้า 3 แมววิ่ง' },
        ]);
    });

    it('keeps the difference when the line holds a filter word such as never (A7)', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('Page 3 never ends\n', 'Page 3 never starts\n')).toEqual([
            { line: 1, expected: 'Page 3 never ends', actual: 'Page 3 never starts' },
        ]);
    });

    it('treats space runs as layout columns, not as content', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('a   b\n', 'a b\n')).toEqual([]);
    });

    it('treats a non-breaking space as a layout space, not as content', async () => {
        const { diffPrintText } = await loadTextDiff();
        expect(diffPrintText('a b\n', 'a b\n')).toEqual([]);
    });
});

describe('Storytime teacher-book adversarial: the file-name formatter has no guard', () => {
    it('prints version 0 into the name; the CLI rejects it before the build', async () => {
        const { teacherBookPrintFileName } = await loadTextDiff();
        expect(teacherBookPrintFileName(2, 1, 'th', 0)).toBe(
            'Storytime-Advantage-L2-U1-Teachers-Book-TH-v0_PDFX-1a.pdf',
        );
    });

    it('prints a negative version into the name; the CLI rejects it before the build', async () => {
        const { teacherBookPrintFileName } = await loadTextDiff();
        expect(teacherBookPrintFileName(2, 1, 'th', -1)).toBe(
            'Storytime-Advantage-L2-U1-Teachers-Book-TH-v-1_PDFX-1a.pdf',
        );
    });

    it('prints a non-integer level into the name; the CLI rejects it before the build', async () => {
        const { teacherBookPrintFileName } = await loadTextDiff();
        expect(teacherBookPrintFileName(2.5, 1, 'th', 1)).toBe(
            'Storytime-Advantage-L2.5-U1-Teachers-Book-TH-v1_PDFX-1a.pdf',
        );
    });

    it('prints a non-Thai language into the name; the CLI rejects it before the build', async () => {
        const { teacherBookPrintFileName } = await loadTextDiff();
        expect(teacherBookPrintFileName(2, 1, 'en' as unknown as 'th', 1)).toBe(
            'Storytime-Advantage-L2-U1-Teachers-Book-EN-v1_PDFX-1a.pdf',
        );
    });
});

describe('Storytime teacher-book adversarial: the CLI stops bad input before Chrome', () => {
    it('rejects a duplicate week with exit 1 and writes nothing', () => {
        const { root, folder, drafts } = makeHome();
        try {
            const result = runCli(root, ['--level', '2', '--weeks', '1,1', '--lang', 'th', '--out', folder, '--version', '1', '--drafts', drafts]);
            expect(result.status, `exit 1 expected, got ${result.status}: ${result.output}`).toBe(1);
            expect(result.output).toContain('duplicate');
            expect(fs.readdirSync(folder)).toEqual([]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 30_000);

    it('passes a week gap through week validation and stops at the missing drafts', () => {
        const { root, folder, drafts } = makeHome();
        try {
            const result = runCli(root, ['--level', '2', '--weeks', '1,3', '--lang', 'th', '--out', folder, '--version', '1', '--drafts', drafts]);
            expect(result.status, `exit 1 expected, got ${result.status}: ${result.output}`).toBe(1);
            expect(result.output).toContain('No approved draft');
            expect(fs.readdirSync(folder)).toEqual([]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 30_000);

    it('rejects a week the level does not load with exit 1 and writes nothing', () => {
        const { root, folder, drafts } = makeHome();
        try {
            const result = runCli(root, ['--level', '2', '--weeks', '30', '--lang', 'th', '--out', folder, '--version', '1', '--drafts', drafts]);
            expect(result.status, `exit 1 expected, got ${result.status}: ${result.output}`).toBe(1);
            expect(result.output).toContain('not loaded exactly once');
            expect(fs.readdirSync(folder)).toEqual([]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 30_000);

    it('rejects a path-like week value with exit 2 and writes nothing', () => {
        const { root, folder, drafts } = makeHome();
        try {
            const result = runCli(root, ['--level', '2', '--weeks', '../x', '--lang', 'th', '--out', folder, '--version', '1', '--drafts', drafts]);
            expect(result.status, `exit 2 expected, got ${result.status}: ${result.output}`).toBe(2);
            expect(result.output).toContain('--weeks must be a whole number');
            expect(fs.readdirSync(folder)).toEqual([]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 30_000);

    it('rejects --version 0 with exit 2 and writes nothing', () => {
        const { root, folder, drafts } = makeHome();
        try {
            const result = runCli(root, ['--level', '2', '--weeks', '1', '--lang', 'th', '--out', folder, '--version', '0', '--drafts', drafts]);
            expect(result.status, `exit 2 expected, got ${result.status}: ${result.output}`).toBe(2);
            expect(result.output).toContain('--version must be a whole number');
            expect(fs.readdirSync(folder)).toEqual([]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 30_000);

    it('rejects --lang en with exit 2 and writes nothing', () => {
        const { root, folder, drafts } = makeHome();
        try {
            const result = runCli(root, ['--level', '2', '--weeks', '1', '--lang', 'en', '--out', folder, '--version', '1', '--drafts', drafts]);
            expect(result.status, `exit 2 expected, got ${result.status}: ${result.output}`).toBe(2);
            expect(result.output).toContain('Thai only');
            expect(fs.readdirSync(folder)).toEqual([]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 30_000);

    it('rejects an --out folder outside the print folder with exit 2', () => {
        const { root, drafts } = makeHome();
        const outside = path.join(root, 'elsewhere');
        try {
            const result = runCli(root, ['--level', '2', '--weeks', '1', '--lang', 'th', '--out', outside, '--version', '1', '--drafts', drafts]);
            expect(result.status, `exit 2 expected, got ${result.status}: ${result.output}`).toBe(2);
            expect(result.output).toContain('--out must be a folder inside');
            expect(fs.existsSync(outside)).toBe(false);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 30_000);

    it('stops at a missing draft with exit 1 before the folder is made', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-adv-p3-'));
        try {
            const drafts = path.join(root, 'drafts');
            fs.mkdirSync(drafts, { recursive: true });
            const result = runCli(root, ['--level', '2', '--weeks', '1', '--lang', 'th', '--version', '1', '--drafts', drafts]);
            expect(result.status, `exit 1 expected, got ${result.status}: ${result.output}`).toBe(1);
            expect(result.output).toContain('No approved draft');
            expect(fs.existsSync(path.join(root, 'Desktop', 'print-ready', 'storytime'))).toBe(false);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    }, 30_000);
});
