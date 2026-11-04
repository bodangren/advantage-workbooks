import type { PrintTextDifference } from './text-diff';
import { STORYTIME_READER_PAGE_OFFSET, storytimeStepEntry } from './step-map';
import { storytimeLabels } from '../i18n';
import type { StorytimeWeek } from '../schema';

/**
 * The classified difference list of the Thai teacher book (A-48 H1, print audit checklist H1:
 * "Diff against Daniel's approved drafts; list each difference with its reason"). The text gate
 * of `diffPrintText` gives every line that differs from the approved draft. This module gives each
 * line one reason class, so that Daniel reads a short list of classes and not every line.
 */

/** The reason classes, in the order of the summary table. */
export const TEXT_DIFF_CLASSES = ['A-42 routine', 'A-48 badge', 'page reference', 'D3 question', 'word change', 'other'] as const;

/** One reason class of a difference. */
export type TextDiffClass = typeof TEXT_DIFF_CLASSES[number];

/** The header line of one week in the text gate report. */
export interface ReportHeader {
    week: number;
    /** The number of differences that the report lists for the week. */
    count: number;
    /** The path of the approved draft that the week was compared with. */
    draft: string;
}

/** One difference line of the text gate report, with its week. */
export interface ReportRow extends PrintTextDifference {
    week: number;
}

/** The text gate report in structured form. */
export interface ParsedReport {
    headers: ReportHeader[];
    rows: ReportRow[];
}

/** A difference with its reason class and a short reason text. */
export interface ClassifiedDifference extends ReportRow {
    cls: TextDiffClass;
    reason: string;
}

/**
 * The header line of one week in the text gate report. The build and the parser use this one
 * function, so that the report stays byte-equal to the report of the build before H1.
 * @param week The week number.
 * @param count The number of differences of the week.
 * @param draft The path of the approved draft.
 * @returns The report line.
 */
export function formatReportHeader(week: number, count: number, draft: string): string {
    return `week ${week}: ${count} difference(s) against ${draft}`;
}

/**
 * The line of one difference in the text gate report.
 * @param week The week number.
 * @param difference The difference from `diffPrintText`.
 * @returns The report line, with two leading spaces.
 */
export function formatReportRow(week: number, difference: PrintTextDifference): string {
    return `  week ${week} line ${difference.line}: expected "${difference.expected}" actual "${difference.actual}"`;
}

const HEADER_LINE = /^week (\d+): (\d+) difference\(s\) against (.*)$/;
// The expected text ends at the first `" actual "`: a text that holds that string itself cannot be told apart.
const ROW_LINE = /^ {2}week (\d+) line (\d+): expected "(.*?)" actual "(.*)"$/;

/**
 * Reads a text gate report. Blank lines are skipped.
 * @param text The content of the report file.
 * @returns The headers and the difference rows, in the order of the file.
 * @throws Error When a line is neither a header nor a difference line, or a row has no header of its week. The message names the line.
 */
export function parseTextGateReport(text: string): ParsedReport {
    const headers: ReportHeader[] = [];
    const rows: ReportRow[] = [];
    text.split('\n').forEach((raw, index) => {
        const line = raw.replace(/\r$/, '');
        if (!line.trim()) return;
        const header = HEADER_LINE.exec(line);
        if (header) {
            headers.push({ week: Number(header[1]), count: Number(header[2]), draft: header[3] });
            return;
        }
        const row = ROW_LINE.exec(line);
        if (!row) throw new Error(`report line ${index + 1} does not parse: ${line.slice(0, 120)}`);
        const week = Number(row[1]);
        if (!headers.some((h) => h.week === week)) throw new Error(`report line ${index + 1}: week ${week} has no header line before it`);
        rows.push({ week, line: Number(row[2]), expected: row[3], actual: row[4] });
    });
    return { headers, rows };
}

/** The text with every space run as one space, trimmed. */
const norm = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** The text without one pair of outer quotes. */
const unquote = (text: string): string => /^"([\s\S]*)"$/.exec(text)?.[1] ?? text;

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface TextSets {
    d3: Set<string>;
    routine: Set<string>;
    recall: Set<string>;
}

const setsOfWeek = new WeakMap<StorytimeWeek, TextSets>();

/** The texts of a week that the teacher book prints for the D3 questions and for the A-42 loops. */
function textSets(week: StorytimeWeek): TextSets {
    const known = setsOfWeek.get(week);
    if (known) return known;
    const d3 = new Set<string>();
    const routine = new Set<string>();
    const recall = new Set<string>();
    const add = (set: Set<string>, text: string | undefined): void => {
        // The week files hold some lines with their outer quotes, and the printed line has the quotes in both forms.
        if (text) set.add(norm(unquote(norm(text))));
    };
    for (const lang of ['th', 'en'] as const) {
        const l = storytimeLabels(lang);
        add(d3, l.questions);
        for (const label of [l.blendDrill, l.soundLoop, l.sightWords]) add(routine, label);
        add(recall, l.recallLoop);
        for (const book of week.books) {
            for (const question of book.questions ?? []) {
                add(d3, `${question.ask.en} — ${l.answer}: ${question.answer.word} (${l.page} ${question.answer.page + STORYTIME_READER_PAGE_OFFSET})`);
            }
        }
        for (const script of week.scripts) {
            for (const step of script.steps) {
                if (step.sightWords) add(routine, `${step.sightWords.seconds} ${l.secondsPerWord}`);
            }
        }
    }
    for (const book of week.books) {
        for (const question of book.questions ?? []) {
            add(d3, question.ask.en);
            add(d3, question.ask.th);
        }
    }
    const bi = (text: { en: string; th?: string } | undefined): void => {
        add(routine, text?.en);
        add(routine, text?.th);
    };
    for (const script of week.scripts) {
        for (const step of script.steps) {
            const drill = step.blendDrill;
            if (drill) {
                [drill.model, drill.lead, drill.test, drill.correction].forEach(bi);
                add(routine, `${drill.words.map((word) => word.word).join(', ')} — ${drill.repeats}×`);
            }
            const loop = step.soundLoop;
            if (loop) [loop.correct, loop.practise, loop.retest].forEach(bi);
            const sight = step.sightWords;
            if (sight) {
                add(routine, sight.words.join(', '));
                bi(sight.slide);
                bi(sight.check);
            }
        }
        // The recall block of the day opening (loops FR-6): the label, the ask line in both languages, and the cards line.
        if (script.recall) {
            add(recall, script.recall.ask.en);
            add(recall, script.recall.ask.th);
            add(recall, script.recall.items.map((card) => card.text).join(' '));
        }
    }
    const sets = { d3, routine, recall };
    setsOfWeek.set(week, sets);
    return sets;
}

/** The reason of an added or removed line in the song step of the day opening (LP-26 class B, commit 06e866e1). */
const SONG_ADDED = 'LP-26 class B: the song step in the day opening (06e866e1)';
const SONG_REMOVED = 'LP-26 class B: the old place of the song step';

/** A step heading of a teacher-book text: the step code at the start of a title line ("B7 ...", "A6·D2 ...", or "B7 · ..." in the draft). */
const STEP_HEADING = /^([A-E]\d+(?:·[A-E]\d+)?) /;

/** A line that holds only a page number; the text gate drops it (the same rule as `text-diff.ts`). */
const PAGE_NUMBER_LINE = /^(?:หน้า|page)\s*\d+(?:\s*(?:\/|of|จาก)\s*\d+)?$/i;

/** The place of a row in the texts of its week; every field is optional. */
export interface BlockContext {
    /** The compared lines of the new week text (`newTextLines`). */
    newLines?: string[];
    /** The index in `newLines` of the actual line of the row, when the line was found. */
    newIndex?: number;
    /** The raw lines of the text of the approved draft of the week; the `line` of a row counts them from 1. */
    draftLines?: string[];
    /** The new week text with its space runs as one space. */
    normText?: string;
}

/**
 * The compared lines of a `pdftotext -layout` text: each line trimmed with its space runs as one
 * space, without blank lines and page-number lines (as the text gate compares them).
 * @param text The `pdftotext -layout` text.
 * @returns The lines in text order.
 */
export function newTextLines(text: string): string[] {
    return text.split(/\r?\n/).map((raw) => norm(raw.replace(/\f/g, ''))).filter((line) => line && !PAGE_NUMBER_LINE.test(line));
}

/** The code of the nearest step heading at or above a line; undefined when no heading stands above. */
function stepAbove(lines: string[] | undefined, index: number | undefined): string | undefined {
    if (!lines || index === undefined) return undefined;
    for (let i = Math.min(index, lines.length - 1); i >= 0; i--) {
        const found = STEP_HEADING.exec(norm(lines[i]));
        if (found) return found[1];
    }
    return undefined;
}

const isSongStep = (code: string | undefined): boolean => code === 'B7' || code === 'D6';

/** The rules for the text of an added line, or for the actual side of a position pair; undefined when no rule knows the text. */
function classifyText(actual: string, week: StorytimeWeek, context: BlockContext): { cls: TextDiffClass; reason: string } | undefined {
    const text = norm(unquote(actual));
    const sets = textSets(week);
    if (sets.d3.has(text)) return { cls: 'D3 question', reason: 'the text is a question of the read-along or the D3 label' };
    if (sets.recall.has(text)) return { cls: 'A-42 routine', reason: 'recall (loops FR-6)' };
    if (sets.routine.has(text)) return { cls: 'A-42 routine', reason: 'the text is a line of a loop (blend drill, sound loop, sight words) or a loop label' };
    // A wrapped part: the printed line is long and the layout broke it, so the line is a contiguous part of a known line.
    const part = text.replace(/^"|"$/g, '');
    if (part.length >= 8 || part.split(' ').length >= 2) {
        const wholes: [Set<string>, TextDiffClass, string][] = [
            [sets.d3, 'D3 question', 'a D3 question line'],
            [sets.recall, 'A-42 routine', 'a recall line (loops FR-6)'],
            [sets.routine, 'A-42 routine', 'a loop line'],
        ];
        for (const [set, cls, label] of wholes) {
            for (const whole of set) if (whole !== part && whole.includes(part)) return { cls, reason: `wrapped part of ${label}` };
        }
    }
    if (isSongStep(stepAbove(context.newLines, context.newIndex))) return { cls: 'A-42 routine', reason: SONG_ADDED };
    return undefined;
}

/** The place rule for the expected side of a row: the line stands in the draft under the heading B7 or D6. */
function oldSongPlace(row: ReportRow, context: BlockContext): boolean {
    return isSongStep(stepAbove(context.draftLines, row.line - 1));
}

/** The leading step code of a title line, or undefined. */
const leadCode = (text: string): string | undefined => STEP_HEADING.exec(text)?.[1];

/** The result of the known rewrites on the expected line of a two-sided difference. */
function classifyBothSides(row: ReportRow, week: StorytimeWeek, weekText: string, context: BlockContext): { cls: TextDiffClass; reason: string } {
    let expected = row.expected;
    const applied: string[] = [];
    const kinds = new Set<TextDiffClass>();
    // The badge (U8): "A1 · title" prints as "A1 title"; the badge of the step map can differ from the step id ("A6·D2").
    const title = /^([A-Z]\d{1,2}) · (.+)$/.exec(expected);
    const step = title ? week.scripts.flatMap((script) => script.steps).find((candidate) => candidate.id === title[1]) : undefined;
    if (title) {
        expected = `${storytimeStepEntry(title[1])?.code ?? title[1]} ${title[2]}`;
        applied.push('badge');
        kinds.add('A-48 badge');
        // The minutes (A-42): a step with `loopMinutes` prints the loop minutes.
        const minutes = /(\d+) นาที$/.exec(expected);
        if (step?.loopMinutes !== undefined && minutes && Number(minutes[1]) !== step.loopMinutes) {
            expected = `${expected.slice(0, minutes.index)}${step.loopMinutes} นาที`;
            applied.push(`minutes ${minutes[1]} to ${step.loopMinutes} (loopMinutes)`);
            kinds.add('A-42 routine');
        }
    }
    // The page reference (U8): "student book: x" prints as "หนังสือนักเรียน หน้า N (x)".
    const parts = expected.split(/student book: ([^,]+)/);
    if (parts.length > 1) {
        const pattern = new RegExp(`^${parts.map((part, index) => (index % 2 === 0 ? escapeRegExp(part) : `หนังสือนักเรียน หน้า (\\d+(?:–\\d+)?) \\(${escapeRegExp(part)}\\)`)).join('')}$`);
        const found = pattern.exec(row.actual);
        if (found) {
            expected = row.actual;
            applied.push(`page reference (page ${found.slice(1).join(', ')})`);
            kinds.add('page reference');
        }
    }
    if (expected === row.actual) {
        const cls = (['A-42 routine', 'page reference', 'A-48 badge'] as const).find((kind) => kinds.has(kind)) ?? 'word change';
        return { cls, reason: applied.join('; ') };
    }
    // A position pair: the diff paired two lines by position. The expected text stands elsewhere in the new text, or the lines start with different step codes.
    const hay = context.normText ?? norm(weekText);
    const codes = [leadCode(expected), leadCode(row.actual)];
    const pair = (hay !== '' && hay.includes(norm(expected))) || (codes[0] !== codes[1] && (codes[0] !== undefined || codes[1] !== undefined));
    if (pair) {
        const inner = classifyText(row.actual, week, context)
            ?? (oldSongPlace(row, context) ? { cls: 'A-42 routine' as const, reason: SONG_REMOVED } : undefined);
        return { cls: inner?.cls ?? 'other', reason: `position pair: ${inner?.reason ?? 'the line moved or wrapped'}` };
    }
    return { cls: 'word change', reason: applied.length ? `${applied.join('; ')}; the lines still differ` : 'the lines differ' };
}

/**
 * Gives one difference of the text gate its reason class. The rules, in this order:
 * a two-sided line gets the known rewrites (badge, page reference, loop minutes) and is the class
 * of the first rewrite if the lines then agree; if they still differ, the pair is a position pair
 * (the diff paired two lines by position) when the expected text stands in the new week text or the
 * step codes differ, and it takes the class of its actual text; else it is a `word change`.
 * An added line is a `D3 question` or an `A-42 routine` when it equals, or is a wrapped part of, a
 * text that the week prints for it (the D3 questions, the loops, the recall), or when it stands in
 * the song step of the day opening (the block of the heading B7 or D6); else it is `other`.
 * A removed line is an `A-42 routine` when it stood in the draft under the heading B7 or D6; else
 * it is `other`, with the reflow reason when its text stands in the new week text.
 * @param row The difference with its week.
 * @param week The parsed week of the difference.
 * @param weekText The `pdftotext -layout` text of the new week.
 * @param context The place of the row in the texts of the week; without it, the block rules do not apply.
 * @returns The class and the reason text.
 */
export function classifyDifference(row: ReportRow, week: StorytimeWeek, weekText: string, context: BlockContext = {}): { cls: TextDiffClass; reason: string } {
    if (row.expected && row.actual) return classifyBothSides(row, week, weekText, context);
    if (!row.expected) return classifyText(row.actual, week, context) ?? { cls: 'other', reason: 'added line' };
    if (oldSongPlace(row, context)) return { cls: 'A-42 routine', reason: SONG_REMOVED };
    return (context.normText ?? norm(weekText)).includes(norm(row.expected))
        ? { cls: 'other', reason: 'reflow: the text stands in the new week text' }
        : { cls: 'other', reason: 'removed line' };
}

/**
 * Classifies every row of a report. The rows of a week come in text order, so a cursor through the
 * new week text finds the place of each added or two-sided line (the first copy of the line after the
 * place of the row before it).
 * @param report The parsed report.
 * @param weeks The parsed weeks of the level.
 * @param weekTextOf The new text of a week, by week number.
 * @param draftTextOf The text of the approved draft of a week, by week number; without it, a removed line has no block context.
 * @returns One classified difference for each row, in report order.
 * @throws Error When a row names a week that is not in `weeks`.
 */
export function classifyReport(report: ParsedReport, weeks: StorytimeWeek[], weekTextOf: (week: number) => string, draftTextOf: (week: number) => string = () => ''): ClassifiedDifference[] {
    const states = new Map<number, { raw: string; context: BlockContext; cursor: number }>();
    return report.rows.map((row) => {
        const week = weeks.find((candidate) => candidate.meta.week === row.week);
        if (!week) throw new Error(`the report names week ${row.week}, and the week files have no such week`);
        let state = states.get(row.week);
        if (!state) {
            const raw = weekTextOf(row.week);
            state = { raw, cursor: 0, context: { newLines: newTextLines(raw), normText: norm(raw), draftLines: draftTextOf(row.week).split('\n') } };
            states.set(row.week, state);
        }
        const context: BlockContext = { ...state.context };
        if (row.actual) {
            const found = state.context.newLines!.indexOf(row.actual, state.cursor);
            if (found >= 0) {
                context.newIndex = found;
                state.cursor = found + 1;
            }
        }
        return { ...row, ...classifyDifference(row, week, state.raw, context) };
    });
}

/**
 * Checks that the class counts add up to the count of the report.
 * @param classified The classified differences.
 * @param report The parsed report that they come from.
 * @returns The problems; an empty list when the class counts add up to the count of the report, in total and for each week.
 */
export function classCountProblems(classified: ClassifiedDifference[], report: ParsedReport): string[] {
    const problems: string[] = [];
    const reportTotal = report.headers.reduce((sum, header) => sum + header.count, 0);
    const classTotal = TEXT_DIFF_CLASSES.reduce((sum, cls) => sum + classified.filter((item) => item.cls === cls).length, 0);
    if (classTotal !== classified.length) problems.push(`${classified.length - classTotal} rows have a class outside the six`);
    if (classTotal !== reportTotal) problems.push(`${classTotal} rows are classified, and the report counts ${reportTotal}`);
    if (report.rows.length !== reportTotal) problems.push(`the report lists ${report.rows.length} rows, and its headers count ${reportTotal}`);
    for (const header of report.headers) {
        const n = classified.filter((item) => item.week === header.week).length;
        if (n !== header.count) problems.push(`week ${header.week}: ${n} rows are classified, and the report counts ${header.count}`);
    }
    return problems;
}

/**
 * The new text of one week inside the text of a book of several weeks: from the heading of the
 * week ("สัปดาห์ที่ N: ...", which can follow a form feed of a page break) to the heading of the next week.
 * @param bookText The `pdftotext -layout` text of the whole book.
 * @param week The week number.
 * @returns The text of the week; an empty text when the book has no heading of the week.
 */
export function weekSection(bookText: string, week: number): string {
    const headings = [...bookText.matchAll(/^[ \t\f]*สัปดาห์ที่ (\d+): /gm)].map((match) => ({ week: Number(match[1]), at: match.index }));
    const start = headings.find((heading) => heading.week === week);
    if (!start) return '';
    const next = headings.find((heading) => heading.at > start.at && heading.week !== week);
    return bookText.slice(start.at, next?.at ?? bookText.length);
}

const cell = (text: string | number): string => String(text).replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');

/**
 * The markdown list of the classified differences: a title, the source report and its SHA-256,
 * a summary table (one row for each class, one column for each week, a total column, and a total
 * row), and one row for each difference. A `|` in a cell is escaped.
 * @param input.sourcePath The path of the text gate report.
 * @param input.sourceSha256 The SHA-256 of the report file.
 * @param input.report The parsed report.
 * @param input.classified The classified differences.
 * @returns The markdown text, with a final newline.
 */
export function classifiedMarkdown(input: { sourcePath: string; sourceSha256: string; report: ParsedReport; classified: ClassifiedDifference[] }): string {
    const { report, classified } = input;
    const weeks = report.headers.map((header) => header.week);
    const count = (cls: TextDiffClass | undefined, week: number | undefined): number =>
        classified.filter((item) => (cls === undefined || item.cls === cls) && (week === undefined || item.week === week)).length;
    const lines = [
        '# H1: classified differences of the teacher book',
        '',
        `Source report: \`${input.sourcePath}\``,
        `Source report SHA-256: \`${input.sourceSha256}\``,
        `Differences: ${classified.length}`,
        '',
        '## Summary',
        '',
        `| Class | ${weeks.map((week) => `Week ${week}`).join(' | ')} | Total |`,
        `|---|${weeks.map(() => '---:|').join('')}---:|`,
        ...TEXT_DIFF_CLASSES.map((cls) => `| ${cell(cls)} | ${weeks.map((week) => count(cls, week)).join(' | ')} | ${count(cls, undefined)} |`),
        `| Total | ${weeks.map((week) => count(undefined, week)).join(' | ')} | ${classified.length} |`,
        '',
        '## Differences',
        '',
        '| Week | Line | Class | Reason | Expected | Actual |',
        '|---|---:|---|---|---|---|',
        ...classified.map((item) => `| ${item.week} | ${item.line} | ${cell(item.cls)} | ${cell(item.reason)} | ${cell(item.expected)} | ${cell(item.actual)} |`),
    ];
    return `${lines.join('\n')}\n`;
}
