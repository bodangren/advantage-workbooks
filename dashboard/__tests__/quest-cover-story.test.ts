// @vitest-environment node
/**
 * Red of the option A student back story text (track storytime_cover_options_20261106, the
 * Task (Red, story line) pair of 2026-11-10).
 *
 * The fault: the Task 2.9 part 1 build printed the option A student back with the heading
 * "Story" and no text under it. The script builds its own book row, and that row holds an
 * empty story, so the five panel values of the student back hold no story text. The guard of
 * the build refuses only a fully empty panel, so the build printed a passing empty story.
 *
 * The contract of this file:
 *   questPanelValues(level, unit) returns { errors, values }. The values are the five panel
 *   values of the student back, in the panel order: story, sounds, decodable, sight, books.
 *   The story value is the story text of the level and unit row of
 *   content/storytime/covers/books.json (spec FR-4.1 and FR-10.1: every text on a cover is an
 *   approved text, word for word). No panel value is empty.
 *
 * The expected values below are hand written. The story text is also read from the shipped
 * data file, so the test holds the file and the build in step.
 *
 * The file makes no network call and launches no browser.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadQuestCovers, renderQuestCover, type QuestPanelValue } from '../lib/storytime/print/cover-quest';
import { questPanelValues } from '../scripts/storytime/make-storytime-quest-covers';

/** The approved story text of the Level 2 Unit 1 student back (spec FR-4.1). */
const APPROVED_STORY = 'Hello, I am Nan. Nan can nod. A nest, a net, a nut, a nose.';

/** The panel field order of the student back (D11). */
const PANEL_FIELDS = ['story', 'sounds', 'decodable', 'sight', 'books'] as const;

/** The data file of the book rows, with the story text of each row. */
const BOOKS_FILE = path.resolve(__dirname, '..', '..', 'content', 'storytime', 'covers', 'books.json');

/** One book row of the data file. */
interface BooksRow {
    level: number;
    unit: number;
    panel?: { story?: { text?: string } };
}

/**
 * Reads the story text of the Level 2 Unit 1 row of the data file.
 * @returns The story text of the row.
 */
function approvedStoryOfBooksFile(): string {
    expect(fs.existsSync(BOOKS_FILE), 'The data file of the book rows exists: ' + BOOKS_FILE).toBe(true);
    const data = JSON.parse(fs.readFileSync(BOOKS_FILE, 'utf8')) as { books?: BooksRow[] };
    const row = (data.books ?? []).find((entry) => entry.level === 2 && entry.unit === 1);
    expect(row, 'The data file holds the Level 2 Unit 1 row.').toBeTruthy();
    const text = row?.panel?.story?.text ?? '';
    expect(text, 'The Level 2 Unit 1 row holds a story text.').not.toBe('');
    return text;
}

/**
 * Renders the student back page with the given panel values, in the call that the build makes.
 * @param values The five panel values.
 * @returns The page document.
 */
function studentBackHtml(values: QuestPanelValue[]): string {
    const assets = {
        art: 'file:///tmp/back-art.png',
        logo: 'file:///tmp/logo.png',
        panelValues: values,
    };
    return renderQuestCover('student-back', loadQuestCovers().books[0], assets, { bleedMm: 0 });
}

/**
 * Counts the times a text sits in a text.
 * @param haystack The text to search.
 * @param needle The text to count.
 * @returns The count of the occurrences.
 */
function countOf(haystack: string, needle: string): number {
    return haystack.split(needle).length - 1;
}

describe('S1 the panel of Level 2 Unit 1 holds the approved story text', () => {
    it('gives no error and holds the approved story text', () => {
        const result = questPanelValues(2, 1);
        expect(result.errors, 'The panel of Level 2 Unit 1 has no error.').toEqual([]);
        const story = result.values.find((value) => value.field === 'story');
        expect(story, 'The panel holds a story value.').toBeTruthy();
        expect(story?.value, 'The story value is the approved story text.').toBe(APPROVED_STORY);
    });
});

describe('S2 the story value is the story text of the data file row', () => {
    it('equals the story text of the Level 2 Unit 1 row of books.json', () => {
        const approved = approvedStoryOfBooksFile();
        const result = questPanelValues(2, 1);
        const story = result.values.find((value) => value.field === 'story');
        expect(story?.value, 'The story value is the story text of the data file row.').toBe(approved);
    });
});

describe('S3 the panel gives five values in the panel order and no empty value', () => {
    it('gives the five fields in order and every value is a non-empty text', () => {
        const result = questPanelValues(2, 1);
        expect(result.values.length, 'The panel holds five values.').toBe(PANEL_FIELDS.length);
        expect(
            result.values.map((value) => value.field),
            'The values sit in the panel order.',
        ).toEqual([...PANEL_FIELDS]);
        for (const value of result.values) {
            expect(typeof value.value, 'The value of ' + value.field + ' is a text.').toBe('string');
            expect(value.value.trim().length, 'The value of ' + value.field + ' is not empty.').toBeGreaterThan(0);
        }
    });
});

describe('S4 the student back page holds the story text once', () => {
    it('holds the story text in the story field of the panel and once in the page', () => {
        const result = questPanelValues(2, 1);
        const html = studentBackHtml(result.values);
        const field = html.slice(html.indexOf('data-field="story"'));
        const value = field.match(/<p[^>]*data-part="panel-value"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';
        expect(value, 'The story field of the panel holds the approved story text.').toBe(APPROVED_STORY);
        expect(countOf(html, APPROVED_STORY), 'The page holds the story text once.').toBe(1);
    });
});
