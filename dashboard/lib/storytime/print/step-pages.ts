import type { StorytimeWeek } from '../schema';
import { STORYTIME_PRINT_PROFILE, type StorytimePrintProfile } from './profile';
import { compileStorytimeStudentBook } from './student-book';
import { iconSvgFile } from './icons';
import { STORYTIME_ICONS, STORYTIME_STEP_MAP, storytimeStepEntry, type StorytimeIcon, type StorytimeStepEntry } from './step-map';

/**
 * The page of each script step in the student book (A-48 U8 and U9): the teacher book prints "student
 * book, page N" from it, and the app reads the same rows from `step-map-u1.json`. The page numbers
 * come from the compiled book, so a change of the page order changes the rows and the teacher book.
 */

/** One page of the built book: its printed number, its `data-page-kind`, and its week (the book map and the blank pages have none). */
export interface StorytimeBookPage {
    page: number;
    kind: string;
    week?: number;
}

/** The pages of the first and the last page that a step uses (the same page when the step uses one page). */
export interface StorytimeStepPage {
    first: number;
    last: number;
}

/** One row of the step map file: a part of a student book page that a script step of a week uses. */
export interface StorytimeStepMapRow {
    week: number;
    /** The badge code of the part (the code of the script step, or two codes joined by a dot). */
    code: string;
    /** The script steps of the week that use the part. */
    steps: string[];
    pageKind: string;
    block: string;
    icons: StorytimeIcon[];
    /** The printed page number of the first page of the part. */
    page: number;
    /** The last page, only when the part has more than one page (the benchmark). */
    pageEnd?: number;
}

/**
 * The page list of the student book of a unit, from the compiled book in proof mode.
 * @param weeks The weeks of the unit, all of them: the page numbers depend on every week before.
 * @param profile The print profile.
 * @returns One entry for each page, in page order.
 */
export function storytimeStudentBookPages(weeks: StorytimeWeek[], profile: StorytimePrintProfile = STORYTIME_PRINT_PROFILE): StorytimeBookPage[] {
    const { html } = compileStorytimeStudentBook(weeks, { profile, mode: 'proof' });
    const pages: StorytimeBookPage[] = [];
    for (const match of html.matchAll(/<section class="student-page" data-page-kind="([^"]+)" data-page-number="(\d+)"(?: data-week="(\d+)")?/g)) {
        pages.push({ kind: match[1], page: Number(match[2]), ...(match[3] ? { week: Number(match[3]) } : {}) });
    }
    return pages;
}

/** The order of the review pages of week 8: the code of the paper center step of each. */
const REVIEW_BLOCKS = ['review-1', 'review-2', 'review-3', 'review-4', 'review-5'];

/** The pages of one entry of the step map in one week, or undefined when the book has no such page. */
function entryPage(pages: StorytimeBookPage[], week: number, entry: StorytimeStepEntry): StorytimeStepPage | undefined {
    if (entry.pageKind === 'book-map') {
        const map = pages.find((page) => page.kind === 'book-map');
        return map && { first: map.page, last: map.page };
    }
    const ofWeek = pages.filter((page) => page.kind === entry.pageKind && page.week === week);
    if (entry.pageKind === 'review') {
        const page = ofWeek[REVIEW_BLOCKS.indexOf(entry.block)];
        return page && { first: page.page, last: page.page };
    }
    if (!ofWeek.length) return undefined;
    return { first: ofWeek[0].page, last: ofWeek[ofWeek.length - 1].page };
}

/**
 * The page or pages of a script step in the student book.
 * @param pages The page list of the unit book.
 * @param week The week number.
 * @param stepId The script step id, for example A3 or E5.
 * @returns The first and the last page, or undefined when the step uses no page of the book.
 */
export function storytimeStepPage(pages: StorytimeBookPage[], week: number, stepId: string): StorytimeStepPage | undefined {
    const entry = storytimeStepEntry(stepId);
    return entry ? entryPage(pages, week, entry) : undefined;
}

/**
 * The rows of the step map file of a unit: one row for each part of a page that the scripts of a week use, in script order.
 * @param weeks The weeks of the unit.
 * @param pages The page list of the unit book (built from the weeks when omitted).
 * @returns The rows.
 */
export function storytimeStepMapRows(weeks: StorytimeWeek[], pages: StorytimeBookPage[] = storytimeStudentBookPages(weeks)): StorytimeStepMapRow[] {
    const rows: StorytimeStepMapRow[] = [];
    for (const week of [...weeks].sort((a, b) => a.meta.week - b.meta.week)) {
        const done = new Map<string, StorytimeStepMapRow>();
        for (const script of [...week.scripts].sort((a, b) => a.day - b.day)) {
            for (const step of script.steps) {
                const entry = storytimeStepEntry(step.id);
                if (!entry) continue;
                // An extra step (A8, D5, E3) uses a page only when its materials name the student book: E3 of weeks 1 to 7 is a center.
                if (!STORYTIME_STEP_MAP.includes(entry) && !step.materials.some((item) => item.startsWith('student book:'))) continue;
                const existing = done.get(entry.code);
                if (existing) {
                    if (!existing.steps.includes(step.id)) existing.steps.push(step.id);
                    continue;
                }
                const found = entryPage(pages, week.meta.week, entry);
                if (!found) continue;
                const row: StorytimeStepMapRow = { week: week.meta.week, code: entry.code, steps: [step.id], pageKind: entry.pageKind, block: entry.block, icons: [...entry.icons], page: found.first };
                if (found.last !== found.first) row.pageEnd = found.last;
                done.set(entry.code, row);
                rows.push(row);
            }
        }
    }
    return rows;
}

/**
 * The files of the step map folder of a unit: the JSON of the rows and one SVG file for each icon.
 * @param weeks The weeks of the unit.
 * @returns The file names (relative to the unit folder) with their text.
 */
export function storytimeStepMapFiles(weeks: StorytimeWeek[]): { name: string; text: string }[] {
    const files = [{ name: 'step-map-u1.json', text: `${JSON.stringify(storytimeStepMapRows(weeks), null, 1)}\n` }];
    for (const icon of STORYTIME_ICONS) files.push({ name: `step-icon-${icon}.svg`, text: iconSvgFile(icon) });
    return files;
}
