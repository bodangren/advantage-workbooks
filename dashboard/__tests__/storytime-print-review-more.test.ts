// @vitest-environment node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';
import { decodability, taughtTo } from '../lib/storytime/checks';
import { resolveStorytimePictureFiles } from '../lib/storytime/print/picture-check';
import { storytimePrintPictures } from '../lib/storytime/print/pictures';
import { STORYTIME_PRINT_PROFILE } from '../lib/storytime/print/profile';
import { compileStorytimeStudentBook } from '../lib/storytime/print/student-book';
import { storytimeStepMapRows, storytimeStudentBookPages } from '../lib/storytime/print/step-pages';

/**
 * Phase 9, P9-B Red run 3: the week 8 review pages (spec addendum "Addendum 2026-11-14 (2): C2, F3,
 * the week 8 review pages, and the cast sheet", decisions P9-B8 to P9-B13 and P9-B20; plan task
 * "Red, C2, F3, and the review pages").
 *
 * The book has 136 pages today, the page kind `review-more` does not exist, the field `paperMore` is
 * absent from the week 8 days, and the step map has no `pageEnd` for B1, C1, D1, and E1. Each case
 * fails now inside its body with a label that names the missing page kind, field, or row.
 *
 * Names, texts, and values that the spec leaves open are fixed here, so that Green does not guess.
 * Each is marked PIN:
 *  - PIN the ten case names: RM-count, RM-order, RM-stable, RM-data, RM-pictures, RM-decodable,
 *    RM-no-position, RM-steps, RM-no-picture, RM-fit.
 *  - PIN the book has 140 pages (35 x 4), and the pages 132 to 140 are, in order: review, review,
 *    review-more, review, review-more, review, review-more, review, review-more (P9-B8).
 *  - PIN the 84 reader sides stand on the pages 9-20, 27-38, 45-56, 63-74, 81-92, 99-110, and
 *    117-128, and the pages 1 to 131 keep the kind and the number that the Red baseline has.
 *  - PIN the field `paperMore` holds `pairs` (4 entries of `text` and `picture`), `pictureOrder` (a
 *    permutation of 0 to 3 with no fixed point), and `read` (one `text` and `picture`). The picture
 *    row id is `l2-w<week>-story-page-<slug>`. A `text` equals the text of its picture row.
 *  - PIN the 4 pages, their week 8 day, and their 20 picture rows are the table of P9-B10, pinned
 *    below in `DAY_PINS`. Each day has 4 pairs and 1 read text; day 5 has no week 1 and no week 6
 *    item (P9-B10, the answer of spec review F2).
 *  - PIN the decodable check: each of the 5 texts has 0 untaught words at the week of its reader,
 *    with the names of that week's reader (P9-B13, the answer of spec review F4). The case asserts
 *    no ratio for a text.
 *  - PIN the box size of a match picture is 38 x 28.5 mm, and the content height of a page is
 *    220 mm of the 250 mm of space (P9-B9).
 *  - PIN the step map rows of week 8 are A1 130 to 131, A2 132, B1 133 to 134, C1 135 to 136,
 *    D1 137 to 138, and E1 139 to 140 (P9-B8, P9-B12), and the shipped `step-map-u1.json` equals
 *    the rows that the code makes.
 *  - PIN the baseline of the stable compare is `df7feb8de1479e9adeaadfa6056a85c91db0167c`, the
 *    commit of Red run 3a. A failed `git show` fails the test.
 *  - PIN the mutants of P9-B13 are Green's list: RM1 a pair text with an untaught word
 *    (RM-decodable); RM2 a picture row of a week outside the day (RM-pictures); RM3 `pictureOrder`
 *    as the identity (RM-data); RM4 a `position-mark` on the page (RM-no-position); RM5
 *    `extraBlock` removed from one step-map entry (RM-steps); RM6 the four pages appended after
 *    page 136 (RM-order); RM7 a blank page added at the end (RM-count); RM8 the sentence equal to
 *    a pair (RM-data); RM9 `paperMore` on day 1 (RM-data); RM10 a changed byte in one line file
 *    (the SHA-256 check of RM-pictures).
 *  - PIN the decision D-P9B-G2 (orchestrator, Red retry R1, 2026-11-14): a review-more page holds
 *    one score strip, a div with `data-part="score-strip"` whose `score-blank` span is followed by
 *    the visible text ` / 4`; a `data-score` attribute does not stand for the visible text, and a
 *    page with a second strip, or a strip of ` / 5`, fails RM-fit.
 *
 * The file reads English keys and writes no file. It holds no Thai string and prints no Thai string.
 */

interface PairPin {
    /** The week of the source reader. */
    week: number;
    text: string;
    slug: string;
}

interface DayPin {
    day: number;
    weeks: readonly number[];
    pairs: readonly PairPin[];
    read: PairPin;
    order: readonly number[];
}

const REPO_ROOT = path.resolve(STORYTIME_ROOT, '..', '..');
const RED_BASELINE_COMMIT = 'df7feb8de1479e9adeaadfa6056a85c91db0167c';
const PICTURE_FOLDER = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures');
const PICTURE_LIST_FILE = path.join(STORYTIME_ROOT, 'l2', 'print', 'pictures.json');
const STEP_MAP_FILE = path.join(STORYTIME_ROOT, 'l2', 'step-map-u1.json');

const PAGE_COUNT = 140;
const PAGE_MULTIPLE = 4;

/** PIN the page kinds of pages 132 to 140 (P9-B8). */
const REVIEW_ORDER = ['review', 'review', 'review-more', 'review', 'review-more', 'review', 'review-more', 'review', 'review-more'];

/** PIN the 84 reader sides (P9-A9). */
const READER_PAGES = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
    45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
    63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74,
    81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92,
    99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
    117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128];

/** PIN the 4 review pages and their 20 picture rows (P9-B10). */
const DAY_PINS: readonly DayPin[] = [
    {
        day: 2, weeks: [3, 4],
        pairs: [
            { week: 3, text: 'Nan can get a pan.', slug: 'nan-can-get-a-pan' },
            { week: 3, text: 'A nap in the pan!', slug: 'a-nap-in-the-pan' },
            { week: 4, text: 'Pam is on a map.', slug: 'pam-is-on-a-map' },
            { week: 4, text: 'This is the man!', slug: 'this-is-the-man' },
        ],
        read: { week: 3, text: 'Can I get the pan?', slug: 'can-i-get-the-pan' },
        order: [2, 0, 3, 1],
    },
    {
        day: 3, weeks: [5, 6],
        pairs: [
            { week: 5, text: 'Sam saw Pam.', slug: 'sam-saw-pam' },
            { week: 5, text: 'Pam is off Sam!', slug: 'pam-is-off-sam' },
            { week: 6, text: 'Pat can see a map.', slug: 'pat-can-see-a-map' },
            { week: 6, text: 'Pip sat on the mat!', slug: 'pip-sat-on-the-mat' },
        ],
        read: { week: 6, text: 'Sam can see a pan.', slug: 'sam-can-see-a-pan' },
        order: [1, 3, 0, 2],
    },
    {
        day: 4, weeks: [7],
        pairs: [
            { week: 7, text: 'Tom can see a top.', slug: 'tom-can-see-a-top' },
            { week: 7, text: 'The top on a mat.', slug: 'the-top-on-a-mat' },
            { week: 7, text: 'The top is on Mom!', slug: 'the-top-is-on-mom' },
            { week: 7, text: 'Run, Tom, run!', slug: 'run-tom-run' },
        ],
        read: { week: 7, text: 'The top on a pot!', slug: 'the-top-on-a-pot' },
        order: [3, 2, 1, 0],
    },
    {
        day: 5, weeks: [2, 3, 4, 5, 7],
        pairs: [
            { week: 2, text: 'Nan and I can!', slug: 'nan-and-i-can' },
            { week: 3, text: 'A pan on Nan!', slug: 'a-pan-on-nan' },
            { week: 5, text: 'Sam can get Pam.', slug: 'sam-can-get-pam' },
            { week: 7, text: 'Tom can get the top.', slug: 'tom-can-get-the-top' },
        ],
        read: { week: 4, text: 'Pam can nap.', slug: 'pam-can-nap' },
        order: [1, 0, 3, 2],
    },
];

/** PIN the step map rows of week 8 (P9-B8, P9-B12). */
const WEEK_8_ROWS: Readonly<Record<string, readonly [number, number]>> = {
    A1: [130, 131],
    A2: [132, 132],
    B1: [133, 134],
    C1: [135, 136],
    D1: [137, 138],
    E1: [139, 140],
};

/** PIN the day of each review page and the page of its first pair. */
const PAGE_OF_DAY: Readonly<Record<number, number>> = { 2: 134, 3: 136, 4: 138, 5: 140 };

const BOX_MM = { width: 38, height: 28.5 } as const;
const CONTENT_MM = 220;

// ---------------------------------------------------------------------------------------------
// The data
// ---------------------------------------------------------------------------------------------

function week(n: number): StorytimeWeek {
    return StorytimeWeekSchema.parse(JSON.parse(fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, n), 'utf8')));
}

function weeks(): StorytimeWeek[] {
    return [1, 2, 3, 4, 5, 6, 7, 8].map((n) => week(n));
}

/** The week file at the baseline commit of the Red start. A failed `git show` fails the test. */
function baselineWeek(n: number): StorytimeWeek {
    const file = path.relative(REPO_ROOT, storytimeWeekFile(STORYTIME_ROOT, 2, n));
    try {
        const raw = execFileSync('git', ['show', `${RED_BASELINE_COMMIT}:${file}`], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
        return StorytimeWeekSchema.parse(JSON.parse(raw));
    } catch (error) {
        throw new Error(`git show ${RED_BASELINE_COMMIT}:${file} failed: ${(error as Error).message}`);
    }
}

let cachedPages: ReturnType<typeof storytimeStudentBookPages> | undefined;

function bookPages(): ReturnType<typeof storytimeStudentBookPages> {
    if (!cachedPages) cachedPages = storytimeStudentBookPages(weeks());
    return cachedPages;
}

let cachedHtml: string | undefined;

function bookHtml(): string {
    if (cachedHtml === undefined) cachedHtml = compileStorytimeStudentBook(weeks(), { profile: STORYTIME_PRINT_PROFILE, mode: 'final' }).html;
    return cachedHtml;
}

/** The section of a page number. */
function pageSection(pageNumber: number): string | undefined {
    for (const page of bookHtml().split(/(?=<section class="student-page")/)) {
        if (page.includes(`data-page-number="${pageNumber}"`)) return page;
    }
    return undefined;
}

/** The row id of a pinned picture. */
function rowIdOf(pin: PairPin): string {
    return `l2-w${String(pin.week).padStart(2, '0')}-story-page-${pin.slug}`;
}

interface PictureRowView {
    id: string;
    week: number;
    text: string;
    lineArtFileName: string;
}

let cachedPictures: PictureRowView[] | undefined;

function pictureRows(): PictureRowView[] {
    if (!cachedPictures) cachedPictures = JSON.parse(fs.readFileSync(PICTURE_LIST_FILE, 'utf8')) as PictureRowView[];
    return cachedPictures;
}

interface PaperMorePair {
    text: string;
    picture: string;
}

interface PaperMore {
    pairs: PaperMorePair[];
    pictureOrder: number[];
    read: PaperMorePair;
}

/** The `paperMore` field of a week 8 day, or undefined. */
function paperMore(day: number): PaperMore | undefined {
    const block = (week(8) as unknown as { block?: { days?: { day: number; paperMore?: PaperMore }[] } }).block;
    return (block?.days ?? []).find((entry) => entry.day === day)?.paperMore;
}

/** The reader names of a week: the names that its books teach as whole words. */
function readerNames(weekNumber: number): string[] {
    return (week(weekNumber).books ?? []).flatMap((book) => book.names ?? []);
}

/** The English line 5 of a week 8 step, by step id. */
function paperLine(stepId: string): string | undefined {
    const all = week(8).scripts.flatMap((script) => script.steps);
    const step = all.find((entry) => entry.id === stepId);
    return step?.en.teacherActions[4];
}

// ---------------------------------------------------------------------------------------------
// RM-count
// ---------------------------------------------------------------------------------------------

describe('RM: the four review pages of week 8 (P9-B8 to P9-B13)', () => {
    it('RM-count: the compiled student book has 140 pages, a multiple of 4, and no end padding', () => {
        const pages = bookPages();
        expect(pages.length, 'the pages of the compiled student book').toBe(PAGE_COUNT);
        expect(pages.length % PAGE_MULTIPLE, '140 is a multiple of 4').toBe(0);
        const last = pages[pages.length - 1];
        expect(last?.kind, 'the last page is a review-more page, not a blank').toBe('review-more');
        expect(pages.filter((page) => page.kind === 'review-more').length, 'the book has 4 review-more pages').toBe(4);
    });

    // -----------------------------------------------------------------------------------------
    // RM-order
    // -----------------------------------------------------------------------------------------

    it('RM-order: after page 131 the week 8 page kinds are review, review, review-more, review, review-more, review, review-more, review, review-more', () => {
        const pages = bookPages();
        expect(pages.length, 'the pages of the compiled student book').toBeGreaterThanOrEqual(140);
        const tail = pages.slice(131, 140).map((page) => page.kind);
        expect(tail.join(','), 'the page kinds of pages 132 to 140').toBe(REVIEW_ORDER.join(','));
        expect(pages.slice(131, 140).map((page) => page.page).join(','), 'the page numbers of pages 132 to 140').toBe('132,133,134,135,136,137,138,139,140');
    });

    // -----------------------------------------------------------------------------------------
    // RM-stable
    // -----------------------------------------------------------------------------------------

    it('RM-stable: the reader sides keep the pages of P9-A9 and the pages 1 to 131 keep their kind and number', () => {
        const problems: string[] = [];
        const pages = bookPages();
        const readers = pages.filter((page) => page.kind === 'reader').map((page) => page.page);
        if (readers.length !== 84) problems.push(`the book has ${readers.length} reader sides; the batch has 84`);
        if (readers.join(',') !== READER_PAGES.join(',')) problems.push('the reader sides do not stand on the pages 9 to 128 of P9-A9');
        const baseline = storytimeStudentBookPages([1, 2, 3, 4, 5, 6, 7, 8].map((n) => baselineWeek(n)));
        const keep = Math.min(131, baseline.length);
        for (let index = 0; index < keep; index++) {
            const before = baseline[index];
            const after = pages[index];
            if (!after || before.kind !== after.kind || before.page !== after.page) {
                problems.push(`page ${before.page} was ${before.kind} and is now ${after ? `${after.kind} ${after.page}` : 'missing'}`);
            }
        }
        expect(problems.length, problems.join('\n') || 'the pages 1 to 131 are stable').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // RM-data
    // -----------------------------------------------------------------------------------------

    it('RM-data: days 2 to 5 hold paperMore with 4 pairs, a pictureOrder with no fixed point, and a read entry', () => {
        const problems: string[] = [];
        if (paperMore(1) !== undefined) problems.push('day 1 holds paperMore; the spec puts it on days 2 to 5 only');
        for (const pin of DAY_PINS) {
            const data = paperMore(pin.day);
            if (!data) {
                problems.push(`day ${pin.day} has no paperMore field`);
                continue;
            }
            if (!Array.isArray(data.pairs) || data.pairs.length !== 4) problems.push(`day ${pin.day} has ${data.pairs?.length ?? 0} pairs; the spec has 4`);
            const order = data.pictureOrder ?? [];
            const sorted = [...order].sort().join(',');
            if (sorted !== '0,1,2,3') problems.push(`day ${pin.day} has the pictureOrder ${JSON.stringify(order)}; it is not a permutation of 0 to 3`);
            order.forEach((value, index) => {
                if (value === index) problems.push(`day ${pin.day} has the fixed point ${index} in its pictureOrder`);
            });
            if (!data.read || typeof data.read.text !== 'string') problems.push(`day ${pin.day} has no read entry`);
            for (const pair of data.pairs ?? []) {
                if (pair.text === data.read?.text) problems.push(`day ${pin.day} reads the sentence "${pair.text}", which is also a pair`);
            }
            for (const entry of [...(data.pairs ?? []), ...(data.read ? [data.read] : [])]) {
                const row = pictureRows().find((candidate) => candidate.id === entry.picture);
                if (!row) problems.push(`day ${pin.day}: the picture row "${entry.picture}" is not in the picture list`);
                else if (row.text !== entry.text) problems.push(`day ${pin.day}: the text "${entry.text}" differs from the text of its picture row: "${row.text}"`);
            }
        }
        expect(problems.length, problems.join('\n') || 'the paperMore data of days 2 to 5').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // RM-pictures
    // -----------------------------------------------------------------------------------------

    it('RM-pictures: each picture row of a page is in the list, comes from a week of its day, and passes the SHA-256 check', () => {
        const problems: string[] = [];
        for (const pin of DAY_PINS) {
            const data = paperMore(pin.day);
            const entries = data ? [...data.pairs, ...(data.read ? [data.read] : [])] : [];
            if (!entries.length) {
                problems.push(`day ${pin.day} has no picture rows to check`);
                continue;
            }
            const usedWeeks = new Set<number>();
            for (const entry of entries) {
                const row = pictureRows().find((candidate) => candidate.id === entry.picture);
                if (!row) {
                    problems.push(`day ${pin.day}: the picture row "${entry.picture}" is not in the picture list`);
                    continue;
                }
                usedWeeks.add(row.week);
                if (!pin.weeks.includes(row.week)) problems.push(`day ${pin.day} uses the row "${row.id}" of week ${row.week}, which is not a week of the day`);
                try {
                    const files = resolveStorytimePictureFiles(PICTURE_FOLDER, [row], 'line');
                    if (files.length !== 1 || files[0].fileName !== row.lineArtFileName) {
                        problems.push(`day ${pin.day}: the line file of "${row.id}" is not the manifest file`);
                    }
                } catch (error) {
                    problems.push(`day ${pin.day}: the line file of "${row.id}" fails the manifest check: ${(error as Error).message}`);
                }
            }
            if (pin.day === 5 && usedWeeks.size < 4) problems.push(`day 5 uses pictures of ${usedWeeks.size} weeks; the spec has at least 4`);
        }
        expect(problems.length, problems.join('\n') || 'the picture rows of the 4 pages').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // RM-decodable
    // -----------------------------------------------------------------------------------------

    it('RM-decodable: each of the 5 texts of a page has 0 untaught words at the week of its reader', () => {
        const problems: string[] = [];
        const known = weeks();
        for (const pin of DAY_PINS) {
            const pins = [...pin.pairs, pin.read];
            pins.forEach((entry, index) => {
                const row = pictureRows().find((candidate) => candidate.id === rowIdOf(entry));
                const text = row?.text ?? entry.text;
                const reader = known[entry.week - 1];
                const result = decodability(text, taughtTo(known, reader), readerNames(entry.week));
                if (result.untaught.length) {
                    problems.push(`day ${pin.day} text ${index + 1} "${text}" has the untaught words ${JSON.stringify(result.untaught)} at week ${entry.week}`);
                }
            });
        }
        expect(problems.length, problems.join('\n') || 'the 20 texts of the 4 pages are decodable at their reader').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // RM-no-position
    // -----------------------------------------------------------------------------------------

    it('RM-no-position: a review-more page asks no position mark and no sound label', () => {
        const problems: string[] = [];
        for (const pin of DAY_PINS) {
            const section = pageSection(PAGE_OF_DAY[pin.day]);
            if (!section) {
                problems.push(`the book has no page ${PAGE_OF_DAY[pin.day]} for day ${pin.day}`);
                continue;
            }
            if (!section.includes('data-page-kind="review-more"')) problems.push(`page ${PAGE_OF_DAY[pin.day]} is not a review-more page`);
            for (const needle of ['position-mark', 'sound-label', 'data-position']) {
                if (section.includes(needle)) problems.push(`page ${PAGE_OF_DAY[pin.day]} holds "${needle}"`);
            }
        }
        expect(problems.length, problems.join('\n') || 'the 4 pages ask no position').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // RM-steps
    // -----------------------------------------------------------------------------------------

    it('RM-steps: line 5 of B1, C1, D1, and E1 names the page after it, and the step map rows carry pageEnd', () => {
        const problems: string[] = [];
        for (const code of ['B1', 'C1', 'D1', 'E1']) {
            const line = paperLine(code) ?? '';
            if (!/Paper: review page \d and the page after it/.test(line)) problems.push(`line 5 of ${code} does not name the page after the review page: ${JSON.stringify(line)}`);
        }
        const rows = storytimeStepMapRows(weeks()).filter((row) => row.week === 8);
        for (const [code, [first, last]] of Object.entries(WEEK_8_ROWS)) {
            const row = rows.find((candidate) => candidate.code === code);
            if (!row) {
                problems.push(`the step map has no row ${code} of week 8`);
                continue;
            }
            if (row.page !== first) problems.push(`the step map row ${code} starts on page ${row.page}; the spec says ${first}`);
            if (last !== first && row.pageEnd !== last) problems.push(`the step map row ${code} ends on page ${row.pageEnd ?? 'none'}; the spec says ${last}`);
            if (last === first && row.pageEnd !== undefined) problems.push(`the step map row ${code} holds a pageEnd; the spec has one page`);
        }
        const shipped = JSON.parse(fs.readFileSync(STEP_MAP_FILE, 'utf8')) as unknown[];
        if (JSON.stringify(shipped) !== JSON.stringify(storytimeStepMapRows(weeks()))) problems.push('the shipped step-map-u1.json differs from the rows that the code makes');
        expect(problems.length, problems.join('\n') || 'the scripts and the step map rows of week 8').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // RM-no-picture
    // -----------------------------------------------------------------------------------------

    it('RM-no-picture: the print list keeps the rows it has, and no review page adds a row', () => {
        const problems: string[] = [];
        const computed = storytimePrintPictures(weeks());
        const shipped = new Map(pictureRows().map((row) => [row.id, row]));
        for (const row of computed) {
            const listed = shipped.get(row.id);
            if (!listed) problems.push(`the computed picture row "${row.id}" is not in the picture list`);
            else if (listed.text !== row.text) problems.push(`the picture list holds the text "${listed.text}" for "${row.id}"; the code makes "${row.text}"`);
        }
        const baseline = storytimePrintPictures([1, 2, 3, 4, 5, 6, 7, 8].map((n) => baselineWeek(n)));
        if (computed.length !== baseline.length) problems.push(`the code makes ${computed.length} picture rows; the Red baseline makes ${baseline.length}`);
        else if (computed.map((row) => row.id).join('\n') !== baseline.map((row) => row.id).join('\n')) problems.push('the row ids of the print picture list differ from the Red baseline');
        expect(problems.length, problems.join('\n') || 'the print picture list keeps its rows').toBe(0);
    });

    // -----------------------------------------------------------------------------------------
    // RM-fit
    // -----------------------------------------------------------------------------------------

    it('RM-fit: a review-more page holds 4 match rows, 1 read row, and a score strip of __ / 4, and they fit the page', () => {
        const problems: string[] = [];
        for (const pin of DAY_PINS) {
            const section = pageSection(PAGE_OF_DAY[pin.day]);
            if (!section) {
                problems.push(`the book has no page ${PAGE_OF_DAY[pin.day]} for day ${pin.day}`);
                continue;
            }
            const boxes = (section.match(/data-part="more-pic"/g) ?? []).length;
            const rows = (section.match(/data-part="more-row"/g) ?? []).length;
            if (boxes !== 5) problems.push(`page ${PAGE_OF_DAY[pin.day]} has ${boxes} picture boxes; the spec has 5`);
            if (rows !== 5) problems.push(`page ${PAGE_OF_DAY[pin.day]} has ${rows} rows; the spec has 4 match rows and 1 read row`);
            const strips = Array.from(section.matchAll(/<div class="score-strip" data-part="score-strip">([\s\S]*?)<\/div>/g));
            if (strips.length !== 1) {
                problems.push(`page ${PAGE_OF_DAY[pin.day]} holds ${strips.length} score strips; the spec has one`);
            } else {
                const strip = strips[0][1];
                if (!strip.startsWith('<span class="score-blank"></span> / 4')) {
                    problems.push(`page ${PAGE_OF_DAY[pin.day]} holds a score strip that is not a score-blank span followed by the visible text " / 4"`);
                }
                if (strip.includes('data-score')) problems.push(`page ${PAGE_OF_DAY[pin.day]} holds a data-score attribute in place of the visible text`);
            }
        }
        const used = 5 * BOX_MM.height + 20;
        if (used > CONTENT_MM) problems.push(`the 5 rows use ${used} mm of the ${CONTENT_MM} mm of a page`);
        expect(problems.length, problems.join('\n') || 'the 4 pages fit their page box').toBe(0);
    });
});
