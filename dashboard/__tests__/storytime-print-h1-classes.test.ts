import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readLevelWeeks, STORYTIME_ROOT } from '../lib/storytime/files';
import type { StorytimeWeek } from '../lib/storytime/schema';

/**
 * A-48 H1 (print audit checklist H1: "Diff against Daniel's approved drafts; list each difference
 * with its reason"): the classified difference list of the teacher book. Each line of the text gate
 * report gets one reason class. The cases below are real lines of the part 2 report (v14) and run
 * on the shipped week files.
 */

const dashboardRoot = path.resolve(__dirname, '..');
const modulePath = path.join(dashboardRoot, 'lib/storytime/print/text-diff-classes.ts');
const classifyScript = path.join(dashboardRoot, 'scripts/storytime/classify-text-gate.ts');
const buildScript = path.join(dashboardRoot, 'scripts/storytime/make-teacher-book-print.ts');

interface Row { week: number; line: number; expected: string; actual: string }
interface Classified extends Row { cls: string; reason: string }
interface Report { headers: { week: number; count: number; draft: string }[]; rows: Row[] }
interface Mod {
    TEXT_DIFF_CLASSES: readonly string[];
    formatReportHeader: (week: number, count: number, draft: string) => string;
    formatReportRow: (week: number, d: { line: number; expected: string; actual: string }) => string;
    parseTextGateReport: (text: string) => Report;
    classifyDifference: (row: Row, week: StorytimeWeek, weekText: string) => { cls: string; reason: string };
    classifyReport: (report: Report, weeks: StorytimeWeek[], weekTextOf: (week: number) => string, draftTextOf?: (week: number) => string) => Classified[];
    classCountProblems: (classified: Classified[], report: Report) => string[];
    weekSection: (bookText: string, week: number) => string;
    classifiedMarkdown: (input: { sourcePath: string; sourceSha256: string; report: Report; classified: Classified[] }) => string;
}

const load = async (): Promise<Mod> => {
    expect(fs.existsSync(modulePath), 'Missing module: lib/storytime/print/text-diff-classes.ts').toBe(true);
    return await import(modulePath) as Mod;
};

let cachedWeeks: StorytimeWeek[] | undefined;
const weeks = (): StorytimeWeek[] => {
    cachedWeeks ??= readLevelWeeks(STORYTIME_ROOT, 2).flatMap((entry) => (entry.week ? [entry.week] : []));
    expect(cachedWeeks).toHaveLength(8);
    return cachedWeeks;
};
const week = (n: number): StorytimeWeek => weeks()[n - 1];

const row = (weekNumber: number, line: number, expected: string, actual: string): Row => ({ week: weekNumber, line, expected, actual });
/** The class and reason of one real line; the week text is empty unless the case needs it. */
const classify = async (r: Row, weekText = ''): Promise<{ cls: string; reason: string }> => (await load()).classifyDifference(r, week(r.week), weekText);

describe('A-48 H1: the six classes', () => {
    it('H1-classes: the class names are the six exact strings, in the order of the summary table', async () => {
        expect((await load()).TEXT_DIFF_CLASSES).toEqual(['A-42 routine', 'A-48 badge', 'page reference', 'D3 question', 'word change', 'other']);
    });

    it('H1-minutes: the A1 badge and minutes line is an A-42 routine; the reason names the badge and the minutes', async () => {
        const result = await classify(row(1, 58, 'A1 · ฟังเสียง (Hear it) 4 นาที', 'A1 ฟังเสียง (Hear it) 5 นาที'));
        expect(result.cls).toBe('A-42 routine');
        expect(result.reason).toBe('badge; minutes 4 to 5 (loopMinutes)');
    });

    it('H1-minutes-down: the A4 line, where the loop minutes are fewer, is an A-42 routine too', async () => {
        const result = await classify(row(1, 148, 'A4 · ผสมเสียง (Blend it) 5 นาที', 'A4 ผสมเสียง (Blend it) 4 นาที'));
        expect(result).toEqual({ cls: 'A-42 routine', reason: 'badge; minutes 5 to 4 (loopMinutes)' });
    });

    it('H1-badge: the A3 line, where only the badge changes, is an A-48 badge', async () => {
        const result = await classify(row(1, 118, 'A3 · เขียนตัวอักษร (Form it) 5 นาที', 'A3 เขียนตัวอักษร (Form it) 5 นาที'));
        expect(result).toEqual({ cls: 'A-48 badge', reason: 'badge' });
    });

    it('H1-badge-tricky: the D2 line, where the badge is the code of the step map, is an A-48 badge', async () => {
        const result = await classify(row(1, 729, 'D2 · คำที่ต้องจำ (Tricky words) 3 นาที', 'A6·D2 คำที่ต้องจำ (Tricky words) 3 นาที'));
        expect(result).toEqual({ cls: 'A-48 badge', reason: 'badge' });
    });

    it('H1-page: the A3 materials line with a page reference is a page reference', async () => {
        const result = await classify(row(1, 119, 'สื่อการสอน: board, student book: letter box n', 'สื่อการสอน: board, หนังสือนักเรียน หน้า 4 (letter box n)'));
        expect(result.cls).toBe('page reference');
        expect(result.reason).toBe('page reference (page 4)');
    });

    it('H1-page-wrong: a page reference line with another word is a word change', async () => {
        const result = await classify(row(1, 119, 'สื่อการสอน: board, student book: letter box n', 'สื่อการสอน: board, หนังสือนักเรียน หน้า 4 (letter box m)'));
        expect(result.cls).toBe('word change');
    });

    it('H1-loop: a soundLoop line of week 1 is an A-42 routine, with and without its outer quotes', async () => {
        for (const text of ['"Listen again: nnn. Nnnest starts with nnn."', '"ฟังอีกครั้ง: nnn คำว่า Nnnest ขึ้นต้นด้วย nnn"']) {
            const result = await classify(row(1, 84, '', text));
            expect(result.cls, text).toBe('A-42 routine');
        }
        expect((await classify(row(1, 84, '', '"Listen again: nnn. Nnnest starts with nnn.!"'))).cls, 'a changed character is not a soundLoop text').toBe('other');
    });

    it('H1-loop-labels: the fixed loop labels and the seconds line are A-42 routines', async () => {
        for (const text of ['ฝึกเสียงซ้ำ', 'ฝึกผสมเสียง', 'อ่านคำแบบเร็ว', 'ทบทวนประจำวัน', '3 วินาทีต่อคำ']) {
            expect((await classify(row(1, 84, '', text))).cls, text).toBe('A-42 routine');
        }
    });

    it('H1-d3: the question lines of the read-along of week 1 and the D3 label are D3 questions', async () => {
        const lines = [
            'คำถาม: ชี้ภาพคำตอบ',
            'Who is the teacher? Point to the picture. — คำตอบ: teacher (หน้า 9)',
            'ใครคือครู? ให้ชี้ที่ภาพ',
            'Where is Pip? Point to the picture. — คำตอบ: Pip (หน้า 10)',
            'Pip อยู่ที่ไหน? ให้ชี้ที่ภาพ',
        ];
        for (const text of lines) {
            const result = await classify(row(1, 765, '', text));
            expect(result.cls, text).toBe('D3 question');
        }
        expect((await classify(row(1, 765, '', 'Who is the teacher? Point to the picture. — คำตอบ: teacher (หน้า 19)'))).cls, 'a wrong page is not a D3 line').toBe('other');
    });

    it('H1-word: the Start at the top line is a word change', async () => {
        const result = await classify(row(1, 123, '"Start at the top. Down. Up. Over the hill. Down."', '"Start at the dot. Down. Up. Over the hill. Down."'));
        expect(result.cls).toBe('word change');
        expect(result.reason).toBe('the lines differ');
    });

    it('H1-other: an added line that no rule knows is other, with the reason "added line"', async () => {
        expect(await classify(row(1, 456, '', 'ง่ายขึ้น: ร้องเฉพาะท่อนฮุก (chorus)'))).toEqual({ cls: 'other', reason: 'added line' });
    });

    it('H1-reflow: a removed line whose text stands in the new week text is other, with the reflow reason', async () => {
        const newText = 'บรรทัดอื่น\n   ในช่วงเปิดคาบ เปิดวิดีโอคาราโอเกะเป็นเพลงประจำสัปดาห์\n  สิ่งที่ครูทำ    ภาษาที่ครูใช้ \nจบ';
        expect(await classify(row(1, 500, 'สิ่งที่ครูทำ ภาษาที่ครูใช้', ''), newText))
            .toEqual({ cls: 'other', reason: 'reflow: the text stands in the new week text' });
    });

    it('H1-removed: a removed line that is not in the new week text is other, with the reason "removed line"', async () => {
        expect(await classify(row(1, 850, 'กิจวัตรเปิดคาบ) เป็นการแสดงร้องเพลง ทั้งชั้นร้องพร้อม', ''), 'ข้อความอื่นทั้งหมด'))
            .toEqual({ cls: 'other', reason: 'removed line' });
    });
});

describe('A-48 H1: the report', () => {
    it('H1-format: the report lines are byte-equal to the lines of the text gate before H1', async () => {
        const mod = await load();
        const d = { line: 58, expected: 'A1 · ฟังเสียง (Hear it) 4 นาที', actual: 'A1 ฟังเสียง (Hear it) 5 นาที' };
        expect(mod.formatReportRow(1, d)).toBe(`  week 1 line 58: expected "${d.expected}" actual "${d.actual}"`);
        expect(mod.formatReportHeader(1, 176, '/d/W01.pdf')).toBe('week 1: 176 difference(s) against /d/W01.pdf');
    });

    it('H1-roundtrip: a report with a quote inside a line parses back to the same differences', async () => {
        const mod = await load();
        const rows = [
            { line: 4, expected: '', actual: '"Listen again: nnn. Nnnest starts with nnn."' },
            { line: 9, expected: 'say "hi" now', actual: 'say "hi" then "bye"' },
            { line: 12, expected: 'สื่อการสอน: karaoke videos: "Hello, I Am Pip"', actual: '' },
        ];
        const text = [mod.formatReportHeader(3, rows.length, '/d/W03.pdf'), ...rows.map((d) => mod.formatReportRow(3, d))].join('\n') + '\n';
        const parsed = mod.parseTextGateReport(text);
        expect(parsed.headers).toEqual([{ week: 3, count: 3, draft: '/d/W03.pdf' }]);
        expect(parsed.rows).toEqual(rows.map((d) => ({ week: 3, ...d })));
    });

    it('H1-parse: a line that does not parse stops the parser and names the line', async () => {
        const mod = await load();
        const good = [mod.formatReportHeader(1, 1, '/d/W01.pdf'), mod.formatReportRow(1, { line: 1, expected: 'a', actual: 'b' })];
        expect(() => mod.parseTextGateReport([...good, 'week 1 line x: broken'].join('\n'))).toThrow(/line 3/);
        expect(() => mod.parseTextGateReport(['  week 1 line 1: expected "a" actual "b"'].join('\n'))).toThrow(/header/);
    });

    it('H1-sum: the class counts add up to the count of the report, and a lost or added row is a problem', async () => {
        const mod = await load();
        const rows: Row[] = [
            row(1, 58, 'A1 · ฟังเสียง (Hear it) 4 นาที', 'A1 ฟังเสียง (Hear it) 5 นาที'),
            row(1, 123, '"Start at the top."', '"Start at the dot."'),
            row(1, 456, '', 'ง่ายขึ้น: ร้องเฉพาะท่อนฮุก (chorus)'),
            row(2, 7, 'ข้อความเก่า', ''),
        ];
        const report: Report = {
            headers: [{ week: 1, count: 3, draft: '/d/W01.pdf' }, { week: 2, count: 1, draft: '/d/W02.pdf' }],
            rows,
        };
        const classified = mod.classifyReport(report, weeks(), () => '');
        expect(classified).toHaveLength(4);
        expect(mod.classCountProblems(classified, report)).toEqual([]);
        expect(mod.classCountProblems(classified.slice(1), report).join(' ')).toMatch(/3 .*4/);
        expect(mod.classCountProblems([...classified, classified[0]], report), 'an extra row').not.toEqual([]);
        const moved = classified.map((c, i) => (i === 0 ? { ...c, week: 2 } : c));
        expect(mod.classCountProblems(moved, report).join(' '), 'a row in the wrong week').toMatch(/week 1/);
        const unknown = classified.map((c, i) => (i === 0 ? { ...c, cls: 'new class' } : c));
        expect(mod.classCountProblems(unknown, report), 'a row with a class outside the six').not.toEqual([]);
    });

    it('H1-section: the text of a week is the text between its heading and the heading of the next week', async () => {
        const mod = await load();
        const book = 'ปก\nสัปดาห์ที่ 1: Hello!\nข้อความของสัปดาห์หนึ่ง\n\f  สัปดาห์ที่ 2: How Many?\nข้อความของสัปดาห์สอง\n';
        expect(mod.weekSection(book, 1)).toContain('ข้อความของสัปดาห์หนึ่ง');
        expect(mod.weekSection(book, 1)).not.toContain('ข้อความของสัปดาห์สอง');
        expect(mod.weekSection(book, 2)).toContain('ข้อความของสัปดาห์สอง');
        expect(mod.weekSection(book, 2)).not.toContain('ข้อความของสัปดาห์หนึ่ง');
        expect(mod.weekSection(book, 9), 'a week with no heading has no text').toBe('');
    });

    it('H1-markdown: the list has the source report, its SHA-256, a summary whose total equals the count, and one row for each difference', async () => {
        const mod = await load();
        const rows: Row[] = [
            row(1, 58, 'A1 · ฟังเสียง (Hear it) 4 นาที', 'A1 ฟังเสียง (Hear it) 5 นาที'),
            row(1, 123, '"Start at the | top."', '"Start at the dot."'),
            row(2, 7, 'ข้อความเก่า', ''),
        ];
        const report: Report = {
            headers: [{ week: 1, count: 2, draft: '/d/W01.pdf' }, { week: 2, count: 1, draft: '/d/W02.pdf' }],
            rows,
        };
        const classified = mod.classifyReport(report, weeks(), () => '');
        const md = mod.classifiedMarkdown({ sourcePath: '/p/text-gate-v14.txt', sourceSha256: 'ab'.repeat(32), report, classified });
        const lines = md.split('\n');
        expect(lines[0]).toMatch(/^# /);
        expect(md).toContain('/p/text-gate-v14.txt');
        expect(md).toContain('ab'.repeat(32));
        const cells = (line: string): string[] => line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
        const head = lines.findIndex((l) => /^\| Class \| Week 1 \| Week 2 \| Total \|$/.test(l));
        expect(head, 'the summary header: Class, one column for each week, Total').toBeGreaterThan(0);
        const body = lines.slice(head + 2, head + 2 + 7).map(cells);
        expect(body.map((c) => c[0])).toEqual([...mod.TEXT_DIFF_CLASSES, 'Total']);
        expect(body[6]).toEqual(['Total', '2', '1', '3']);
        expect(body[0]).toEqual(['A-42 routine', '1', '0', '1']);
        const detail = lines.findIndex((l) => /^\| Week \| Line \| Class \| Reason \| Expected \| Actual \|$/.test(l));
        expect(detail, 'the detail header').toBeGreaterThan(head);
        const items = lines.slice(detail + 2).filter((l) => l.startsWith('|')).map(cells);
        expect(items).toHaveLength(3);
        expect(items[1][4], 'the pipe inside a cell is escaped').toBe('"Start at the \\| top."');
        expect(items[0].slice(0, 4)).toEqual(['1', '58', 'A-42 routine', 'badge; minutes 4 to 5 (loopMinutes)']);
    });
});

/** Classifies rows of one week through the report path (the block context needs the texts of the week). */
async function runRows(rows: Row[], newText = '', draftText = ''): Promise<Classified[]> {
    const mod = await load();
    const report: Report = { headers: [{ week: rows[0].week, count: rows.length, draft: '/d/W01.pdf' }], rows };
    return mod.classifyReport(report, weeks(), () => newText, () => draftText);
}

const SONG_REASON = 'LP-26 class B: the song step in the day opening (06e866e1)';
const OLD_PLACE = 'LP-26 class B: the old place of the song step';

describe('A-48 H1 r2: block context, recall, wrapped parts, position pairs', () => {
    it('H1r2-block-added: an added line under the heading B7 is an A-42 routine of LP-26 class B; under another heading it stays other', async () => {
        const newText = [
            'A8 บัตรกิจกรรมที่บ้าน (Home card) 1 นาที',
            'B7 ร้องเพลงประจำสัปดาห์พร้อมท่าทาง',
            'สิ่งที่ครูทำ ภาษาที่ครูใช้',
            'ง่ายขึ้น: ร้องเฉพาะท่อนฮุก (chorus)',
            'C1 ทบทวนเสียง (Sound review) 2 นาที',
            'สิ่งที่ครูทำ ภาษาที่ครูใช้',
        ].join('\n');
        const out = await runRows([
            row(1, 456, '', 'B7 ร้องเพลงประจำสัปดาห์พร้อมท่าทาง'),
            row(1, 456, '', 'สิ่งที่ครูทำ ภาษาที่ครูใช้'),
            row(1, 456, '', 'ง่ายขึ้น: ร้องเฉพาะท่อนฮุก (chorus)'),
            row(1, 700, '', 'สิ่งที่ครูทำ ภาษาที่ครูใช้'),
        ], newText);
        expect(out.slice(0, 3).map((r) => [r.cls, r.reason])).toEqual([['A-42 routine', SONG_REASON], ['A-42 routine', SONG_REASON], ['A-42 routine', SONG_REASON]]);
        expect([out[3].cls, out[3].reason]).toEqual(['other', 'added line']);
    });

    it('H1r2-block-d6: the heading D6 gives the same class as B7', async () => {
        const newText = ['D6 ร้องเพลง: การแสดงร้องเพลง', 'คู่หรือกลุ่ม: ทั้งชั้นร้องพร้อมกัน'].join('\n');
        const out = await runRows([row(1, 900, '', 'คู่หรือกลุ่ม: ทั้งชั้นร้องพร้อมกัน')], newText);
        expect([out[0].cls, out[0].reason]).toEqual(['A-42 routine', SONG_REASON]);
    });

    it('H1r2-block-removed: a removed line under B7 in the draft is an A-42 routine, the old place of the song step, also when its text stands in the new text', async () => {
        const draft = [
            'A8 · บัตรกิจกรรมที่บ้าน (Home card) 1 นาที',
            'B7 · ร้องเพลง (Sing it) 0 นาที',
            'สื่อการสอน: karaoke videos: "Hello, I Am Pip"',
            'สิ่งที่ครูทำ ภาษาที่ครูใช้',
            'C1 · ทบทวนเสียง (Sound review) 2 นาที',
            'สิ่งที่ครูทำ ภาษาที่ครูใช้',
        ].join('\n');
        const out = await runRows([
            row(1, 3, 'สื่อการสอน: karaoke videos: "Hello, I Am Pip"', ''),
            row(1, 4, 'สิ่งที่ครูทำ ภาษาที่ครูใช้', ''),
            row(1, 6, 'สิ่งที่ครูทำ ภาษาที่ครูใช้', ''),
        ], 'สิ่งที่ครูทำ ภาษาที่ครูใช้', draft);
        expect(out.slice(0, 2).map((r) => [r.cls, r.reason])).toEqual([['A-42 routine', OLD_PLACE], ['A-42 routine', OLD_PLACE]]);
        expect([out[2].cls, out[2].reason]).toEqual(['other', 'reflow: the text stands in the new week text']);
    });

    it('H1r2-recall: the recall label, its ask lines, and its cards line are A-42 routines with the recall reason', async () => {
        const out = await runRows([
            row(1, 258, '', 'ทบทวนประจำวัน'),
            row(1, 258, '', 'Show the five cards. The class says each sound or word.'),
            row(1, 258, '', 'ชูบัตร 5 ใบ ให้ทั้งชั้นพูดเสียงหรืออ่านคำทีละใบ'),
            row(1, 258, '', 'n a and can Hello, I am ___.'),
        ]);
        for (const r of out) expect([r.cls, r.reason], r.actual).toEqual(['A-42 routine', 'recall (loops FR-6)']);
    });

    it('H1r2-recall-first: a recall line under the heading B7 is a recall line, not a song line', async () => {
        const newText = ['B7 ร้องเพลงประจำสัปดาห์พร้อมท่าทาง', 'ทบทวนประจำวัน'].join('\n');
        const out = await runRows([row(1, 258, '', 'ทบทวนประจำวัน')], newText);
        expect(out[0].reason).toBe('recall (loops FR-6)');
    });

    it('H1r2-wrapped: a part of a printed loop line takes the class of the whole line; a short part does not', async () => {
        const out = await runRows([
            row(4, 167, '', 'Watch my hand again: down, up over the hill, down, up over the hill, down. It says'),
            row(4, 168, '', 'words!"'),
        ]);
        expect(out[0].cls).toBe('A-42 routine');
        expect(out[0].reason).toMatch(/^wrapped part of /);
        expect([out[1].cls, out[1].reason]).toEqual(['other', 'added line']);
    });

    it('H1r2-pair-recall: the A1 title paired with the recall label is a position pair with the class of the recall', async () => {
        const out = await runRows([row(4, 73, 'A1 · ฟังเสียง (Hear it) 4 นาที', 'ทบทวนประจำวัน')]);
        expect(out[0].cls).toBe('A-42 routine');
        expect(out[0].reason).toBe('position pair: recall (loops FR-6)');
    });

    it('H1r2-pair-song: the B7 title paired with the C1 title is a position pair; the expected side is the old place of the song step', async () => {
        const out = await runRows([row(2, 540, 'B7 · ร้องเพลง (Sing it) 0 นาที', 'C1 ทบทวนเสียง (Sound review) 2 นาที')], 'C1 ทบทวนเสียง (Sound review) 2 นาที', `${'\n'.repeat(539)}B7 · ร้องเพลง (Sing it) 0 นาที`);
        expect([out[0].cls, out[0].reason]).toEqual(['A-42 routine', `position pair: ${OLD_PLACE}`]);
    });

    it('H1r2-pair-wrapped: a materials line whose expected text stands in the new text is a position pair of the class other', async () => {
        const actual = 'sheet, letter strip, sound cards: n, a, p, m, s, t, o, reading record forms';
        const out = await runRows([row(8, 123, 'strip, sound cards: n, a, p, m, s, t, o, reading record forms', actual)], `สื่อการสอน: review page 3, record\n${actual}\n`);
        expect(out[0].cls).toBe('other');
        expect(out[0].reason).toMatch(/^position pair: /);
    });

    it('H1r2-edit: a real edit stays a word change, with the same step code or no code and an expected text that is not in the new text', async () => {
        const out = await runRows([
            row(2, 1116, '"Row 5. Find the word in. Circle it."', '"Row 5: on, I, in. Find the word in. Circle it."'),
            row(2, 1110, '"Row 3: pig, bed, alligator. Which one starts with /a/?', '"Row 3: pig, bed, axe. Which one starts with /a/?'),
        ], 'ข้อความอื่นทั้งหมด');
        expect(out.map((r) => r.cls)).toEqual(['word change', 'word change']);
    });
});

/** Runs a script with a home folder in a temp folder; returns the exit status and the text it printed. */
function runScript(script: string, args: string[], home: string): { status: number | null; output: string } {
    try {
        const stdout = execFileSync(process.execPath, ['--import', 'tsx', script, ...args], {
            cwd: dashboardRoot, env: { ...process.env, HOME: home }, encoding: 'utf8', timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'],
        });
        return { status: 0, output: stdout };
    } catch (error) {
        const e = error as NodeJS.ErrnoException & { status?: number | null; stdout?: string; stderr?: string };
        return { status: e.status ?? null, output: `${e.stdout ?? ''}${e.stderr ?? ''}${e.message}` };
    }
}

describe('A-48 H1: the scripts', () => {
    it('H1-script: classify-text-gate exits 1 on a report line that does not parse, and 2 on an output that exists or is outside the print-ready folder', () => {
        expect(fs.existsSync(classifyScript), 'Missing script: scripts/storytime/classify-text-gate.ts').toBe(true);
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-h1-'));
        try {
            const folder = path.join(home, 'Desktop', 'print-ready', 'storytime', 'h1');
            fs.mkdirSync(folder, { recursive: true });
            const report = path.join(folder, 'text-gate-v1.txt');
            fs.writeFileSync(report, 'week 1: 1 difference(s) against /d/W01.pdf\n  week 1 line x: broken\n');
            const book = path.join(folder, 'book.pdf');
            fs.writeFileSync(book, '');
            const base = ['--report', report, '--book', book, '--level', '2'];
            const bad = runScript(classifyScript, [...base, '--out', path.join(folder, 'out.md')], home);
            expect(bad.status, bad.output).toBe(1);
            expect(bad.output).toContain('line 2');
            const existing = path.join(folder, 'existing.md');
            fs.writeFileSync(existing, 'x');
            const refused = runScript(classifyScript, [...base, '--out', existing], home);
            expect(refused.status, refused.output).toBe(2);
            expect(refused.output).toContain(existing);
            expect(fs.readFileSync(existing, 'utf8')).toBe('x');
            const outside = path.join(home, 'outside.md');
            const outsideRun = runScript(classifyScript, [...base, '--out', outside], home);
            expect(outsideRun.status, outsideRun.output).toBe(2);
            expect(fs.existsSync(outside)).toBe(false);
            const noReport = runScript(classifyScript, ['--book', book, '--level', '2', '--out', path.join(folder, 'o2.md')], home);
            expect(noReport.status, noReport.output).toBe(2);
        } finally {
            fs.rmSync(home, { recursive: true, force: true });
        }
    }, 120_000);

    it('H1-build: the teacher-book build has the h1 list in its output list, and a link at that path stops the build before it writes outside', () => {
        const source = fs.readFileSync(buildScript, 'utf8');
        expect(source).toMatch(/text-gate-v\$\{version\}-h1\.md/);
        expect(source).toMatch(/const outputs = \[[^\]]*h1File[^\]]*\]/);
        const home = fs.mkdtempSync(path.join(os.tmpdir(), 'storytime-h1-build-'));
        try {
            const folder = path.join(home, 'Desktop', 'print-ready', 'storytime', 'tb');
            const drafts = path.join(home, 'drafts');
            const outside = path.join(home, 'outside', 'h1.md');
            fs.mkdirSync(folder, { recursive: true });
            fs.mkdirSync(drafts, { recursive: true });
            fs.mkdirSync(path.dirname(outside), { recursive: true });
            fs.writeFileSync(path.join(drafts, 'Storytime-L2-W01-Teachers-Book-TH-draft.pdf'), '');
            const h1Path = path.join(folder, 'text-gate-v1-h1.md');
            fs.symlinkSync(outside, h1Path, 'file');
            const result = runScript(buildScript, ['--level', '2', '--weeks', '1', '--lang', 'th', '--out', folder, '--version', '1', '--drafts', drafts], home);
            expect(result.status, result.output).toBe(2);
            expect(result.output).toContain(h1Path);
            expect(fs.existsSync(outside)).toBe(false);
            fs.rmSync(h1Path);
            fs.writeFileSync(h1Path, 'x');
            const existing = runScript(buildScript, ['--level', '2', '--weeks', '1', '--lang', 'th', '--out', folder, '--version', '1', '--drafts', drafts], home);
            expect(existing.status, existing.output).toBe(2);
            expect(existing.output).toContain(h1Path);
        } finally {
            fs.rmSync(home, { recursive: true, force: true });
        }
    }, 120_000);
});
