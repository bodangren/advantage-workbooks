/**
 * The step map of the student book (A-48, B section 5.3): one table from the step code of the
 * daily scripts to the page kind, the block on the page, the icons, and the short English label.
 * The code on the page is the code of the script (A3, C3, D4, E5; the letter is the day), so that
 * the teacher book and the app point at the same part of the page. The print code and the later
 * teacher book read this one constant.
 */

/** The icons of the student book: ear (Listen.), mouth (Say.), eye and finger (Read.), pencil (Write.), circle (Circle.), book (Book.), and the star of the book map. */
export const STORYTIME_ICONS = ['ear', 'mouth', 'read', 'pencil', 'circle', 'book', 'star'] as const;

/** One icon name. */
export type StorytimeIcon = (typeof STORYTIME_ICONS)[number];

/** One page part that a script step uses. */
export interface StorytimeStepEntry {
    /** The badge text; the code of the script step, or two codes for a part that two steps share. */
    code: string;
    /** The script steps that use the part. */
    steps: string[];
    /** The `data-page-kind` of the page. */
    pageKind: string;
    /** The block name (`data-block`). */
    block: string;
    /** The icons of the block head, in print order. */
    icons: StorytimeIcon[];
    /** The short English title of the block. */
    label: string;
    /** The block of the `review-more` page that follows the page of the part, when the part owns two pages (week 8, days 2 to 5). */
    extraBlock?: string;
}

/** The page parts that script steps use. The week check (E5), the book map (C7), and the week 8 pages hold the whole page. */
export const STORYTIME_STEP_MAP: readonly StorytimeStepEntry[] = [
    { code: 'A3', steps: ['A3'], pageKind: 'practice', block: 'form-it', icons: ['pencil'], label: 'Form it' },
    { code: 'A7', steps: ['A7'], pageKind: 'practice', block: 'read-it', icons: ['read'], label: 'Read it' },
    { code: 'A6·D2', steps: ['A6', 'D2'], pageKind: 'practice', block: 'tricky-words', icons: ['read'], label: 'Tricky words' },
    { code: 'C3', steps: ['C3'], pageKind: 'writing', block: 'dictation', icons: ['ear', 'pencil'], label: 'Dictation · day 3' },
    { code: 'D4', steps: ['D4'], pageKind: 'writing', block: 'write-it', icons: ['pencil'], label: 'Write it · day 4' },
    { code: 'E5', steps: ['E5'], pageKind: 'check', block: 'week-check', icons: ['ear', 'circle', 'pencil'], label: 'Check' },
    { code: 'C7', steps: ['C7'], pageKind: 'book-map', block: 'book-map', icons: ['star'], label: 'Book map' },
    // Week 8 (A-48 U4): the benchmark is step A1, and the five review pages are the paper centers of A2, B1, C1, D1, and E1.
    { code: 'A1', steps: ['A1'], pageKind: 'benchmark', block: 'benchmark', icons: ['ear', 'circle', 'pencil'], label: 'Benchmark 1' },
    { code: 'A2', steps: ['A2'], pageKind: 'review', block: 'review-1', icons: ['read', 'circle'], label: 'Review 1' },
    { code: 'B1', steps: ['B1'], pageKind: 'review', block: 'review-2', icons: ['read', 'circle'], label: 'Review 2', extraBlock: 'review-more-2' },
    { code: 'C1', steps: ['C1'], pageKind: 'review', block: 'review-3', icons: ['read', 'circle'], label: 'Review 3', extraBlock: 'review-more-3' },
    { code: 'D1', steps: ['D1'], pageKind: 'review', block: 'review-4', icons: ['read', 'circle'], label: 'Review 4', extraBlock: 'review-more-4' },
    { code: 'E1', steps: ['E1'], pageKind: 'review', block: 'review-5', icons: ['read', 'circle'], label: 'Review 5', extraBlock: 'review-more-5' },
];

/**
 * Steps that use a page of the student book but have no block with a badge on it: the home card (A8),
 * the share of the writing page (D5), and the sticker of week 8 on the book map (E3).
 */
export const STORYTIME_EXTRA_STEPS: readonly StorytimeStepEntry[] = [
    { code: 'A8', steps: ['A8'], pageKind: 'home-front', block: 'home-card', icons: [], label: 'Home card' },
    { code: 'D5', steps: ['D5'], pageKind: 'writing', block: 'write-it', icons: ['pencil'], label: 'Share' },
    { code: 'E3', steps: ['E3'], pageKind: 'book-map', block: 'book-map', icons: ['star'], label: 'Book map' },
];

/** A story page of a reader prints 2 pages later than its number in the week data: the title page and the sounds page come first (A-48 E37). */
export const STORYTIME_READER_PAGE_OFFSET = 2;

/** The step entry of a script step id, from the step map or from the extra steps; undefined when the step uses no page. */
export function storytimeStepEntry(stepId: string): StorytimeStepEntry | undefined {
    return STORYTIME_STEP_MAP.find((item) => item.steps.includes(stepId)) ?? STORYTIME_EXTRA_STEPS.find((item) => item.steps.includes(stepId));
}

/** The step entry of a code. */
export function storytimeStep(code: string): StorytimeStepEntry {
    const entry = STORYTIME_STEP_MAP.find((item) => item.code === code);
    if (!entry) throw new Error(`no step map entry for "${code}"`);
    return entry;
}

/** The icons and the one short line of each kind of check row (page template 8.3). */
export const STORYTIME_CHECK_ROW_TYPES: Readonly<Record<string, { icons: StorytimeIcon[]; label: string }>> = {
    'circle-picture': { icons: ['ear', 'circle'], label: 'Listen. Circle the picture.' },
    'circle-word': { icons: ['read', 'circle'], label: 'Circle the word.' },
    'write-letter': { icons: ['ear', 'pencil'], label: 'Listen. Write.' },
    'write-word': { icons: ['ear', 'pencil'], label: 'Listen. Write.' },
    // The 2 teacher-marked rows after the check items (A-48 part F G6/B14): the tricky word to read, and the blend word the child says.
    'read-word': { icons: ['read', 'mouth'], label: 'Read the word.' },
    'oral-blend': { icons: ['ear', 'mouth'], label: 'Listen. Say the word.' },
};

/** The icon key of page 1: each icon with its short English line and its Thai word (the teacher key; Daniel checks the Thai). */
export const STORYTIME_ICON_KEY: readonly { icon: StorytimeIcon; english: string; thai: string }[] = [
    { icon: 'ear', english: 'Listen.', thai: 'ฟัง' },
    { icon: 'mouth', english: 'Say.', thai: 'พูด' },
    { icon: 'read', english: 'Read.', thai: 'อ่าน' },
    { icon: 'pencil', english: 'Write.', thai: 'เขียน' },
    { icon: 'circle', english: 'Circle.', thai: 'วงกลม' },
    { icon: 'book', english: 'Book.', thai: 'หนังสือเล่มเล็ก' },
];

/** The day letters of the step codes: A is day 1 and E is day 5. */
export const STORYTIME_DAY_KEY: readonly { letter: string; thai: string }[] = ['A', 'B', 'C', 'D', 'E']
    .map((letter, index) => ({ letter, thai: `วันที่ ${index + 1}` }));
