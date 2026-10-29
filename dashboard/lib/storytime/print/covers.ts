import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { BACK_LINES, richHtml } from '../../covers/back-text';
import { THAI } from '../../document-wrapper/print-fonts';
import { REPO_ROOT } from '../../lesson-package/files';
import { generateQRCode } from '../../qr-generator';
import { programWeek, wordNeed, type PhonicsGraph } from '../phonics';
import type { StorytimeWeek } from '../schema';

/**
 * The cover module of the Storytime Advantage student books (track storytime_covers_20261027):
 * the data of the 16 books, the HTML of the front and the back, and the checks of the built
 * files (spec FR-1 to FR-6).
 *
 * The copy of a cover follows the assignment A-18 (a): the Storytime look, the full product
 * name, no CEFR text, no level badge, no date, and the five approved Thai contact lines on the
 * back. The picture of every book is the Forge 3D cast, cut out on the ground tint of the level
 * (D5, D6).
 */

/** The name of the series, on every cover (assignment A-18 (a), rule 2). */
export const STORYTIME_SERIES = 'Storytime Advantage';

/** The LINE Official address of the back cover (assignment A-18 (a), rule 7). */
export const STORYTIME_LINE_ADDRESS = 'https://line.me/ti/p/Pf7_EF98Pv';

/** The level colours of the covers (assignment A-18 (a), rule 9; spec FR-1.5). */
export const STORYTIME_LEVEL_COLOURS: Record<number, string> = {
    1: '#E06A1F',
    2: '#2A77B8',
    3: '#3C9B57',
    4: '#8151B8',
};

/** The ground tint of the cover picture: 20 % of the level colour on white (spec FR-2.4, P7). */
export const STORYTIME_COVER_GROUND_TINTS: Record<number, string> = {
    1: '#F9E1D2',
    2: '#D4E4F1',
    3: '#D8EBDD',
    4: '#E6DCF1',
};

/** The share of figure pixels that the picture area needs (spec FR-2.7, AC-9; C3 decision, 0.55). */
export const STORYTIME_COVER_FILL_SHARE = 0.55;

/** The figures of a recipe: at most 2 children and at most 1 animal (spec FR-1.6, D5, D7). */
export const STORYTIME_COVER_FIGURE_LIMITS = { children: 2, animals: 1 };

/** The height of the clear band at the top of the picture area, in millimetres (spec FR-2.7). */
export const STORYTIME_COVER_HEAD_BAND_MM = 8;

/**
 * The width of the clear band at the left edge and at the right edge of the picture area, in
 * millimetres (spec FR-2.7, Check v2 finding C2, 2026-10-28). The band holds only the ground
 * tint, so no head or arm is cut at a side edge.
 */
export const STORYTIME_COVER_SIDE_BAND_MM = 3;

/** The weeks of a unit: unit 1 holds weeks 1 to 8, unit 4 holds weeks 25 to 32 (spec FR-1.3). */
export const STORYTIME_UNIT_WEEKS: Record<number, [number, number]> = {
    1: [1, 8],
    2: [9, 16],
    3: [17, 24],
    4: [25, 32],
};

/** The trim of a cover: A4 portrait, no bleed, no spine (spec FR-2.1). */
export const STORYTIME_COVER_TRIM = { widthMm: 210, heightMm: 297 };

/** The geometry of the cover sides, in millimetres (spec FR-2 and FR-3). */
export const STORYTIME_COVER_BOX = {
    seriesName: { top: 14 },
    pictureArea: { left: 12, top: 31, width: 186, height: 180 },
    levelCard: { left: 12, top: 217, width: 186, height: 65, radiusMm: 5 },
    logo: { left: 12, top: 12, width: 30, height: 30 },
    panel: { left: 12, top: 48, width: 186, height: 138, radiusMm: 3 },
    contact: { left: 15, top: 200, width: 118 },
    qr: { right: 14, top: 200, width: 44, height: 44 },
    lineLabel: { right: 14, top: 246, width: 44 },
};

/** The data file of the 16 books (spec FR-1). */
export const STORYTIME_COVER_BOOKS_FILE = path.join(REPO_ROOT, 'content', 'storytime', 'covers', 'books.json');

/** The company logo of the back cover (assignment A-18 (a), rule 7). */
export const STORYTIME_COVER_LOGO_FILE = path.join(REPO_ROOT, 'Teacher guide', 'reading-advantage logo.png');

/** The corner radius of the level card and of the unit summary panel, in millimetres. */
export const STORYTIME_COVER_RADIUS_MM = { levelCard: 5, panel: 3 };

/** The corner mode of the build: the radius is flattened into the opaque picture layer. */
export const STORYTIME_COVER_CORNER_MODE = 'radius in the picture layer';

/** One figure of a picture recipe: a child or an animal, its name, and its cut-out file. */
export interface StorytimeCoverFigure {
    kind: 'child' | 'animal';
    name: string;
    file: string;
}

/**
 * The five panel fields of the back cover, in their order (D11.1): the story, the sounds, the
 * decodable words, the sight words, and the books of the unit.
 */
export const STORYTIME_COVER_PANEL_FIELDS = ['story', 'sounds', 'decodable', 'sight', 'books'] as const;

/** One field of the back panel (D11.1). */
export type StorytimeCoverPanelField = (typeof STORYTIME_COVER_PANEL_FIELDS)[number];

/** The fixed font scale of the panel text, in points, largest first (D11.3). 10 pt is the floor. */
export const STORYTIME_COVER_PANEL_SCALE_PT = [14, 13, 12, 11, 10] as const;

/** The text box inside the back panel: 12 mm at each side of the 186 x 138 mm panel (D11.3). */
export const STORYTIME_COVER_PANEL_INSET_MM = { widthMm: 162, heightMm: 114 } as const;

/** The light line that a missing field shows on the Drive mock, never in a print build (D11.4). */
export const STORYTIME_COVER_PANEL_MISSING_LINE = 'comes with the week text';

/** The heading text of each panel field, in the panel order. */
const STORYTIME_COVER_PANEL_HEADINGS: Record<StorytimeCoverPanelField, string> = {
    story: 'Story',
    sounds: 'Sounds',
    decodable: 'Decodable words',
    sight: 'Sight words',
    books: 'Books',
};

/**
 * The estimated average advance width of the Andika text of the panel, in em. The estimate is
 * wider than the measured average of the face (about 0.56 em), so the fit check overestimates
 * the line count and the chosen size never overflows the real layout.
 */
const STORYTIME_COVER_PANEL_CHAR_EM = 0.62;

/** The line height of the panel text, in em (the CSS line-height of the panel inset). */
const STORYTIME_COVER_PANEL_LINE_HEIGHT = 1.5;

/** One entry of the panel of a book row: the source weeks of one field (FR-1.7). */
export interface StorytimeCoverPanelEntry {
    weeks: number[];
}

/** The panel of a book row (D11, FR-1.7): the story text with its source weeks, and the four derived week lists. */
export interface StorytimeCoverBookPanel {
    story: { text: string; weeks: number[] };
    sounds: StorytimeCoverPanelEntry;
    decodable: StorytimeCoverPanelEntry;
    sight: StorytimeCoverPanelEntry;
    books: StorytimeCoverPanelEntry;
}

/** One row of the data file: one student book. */
export interface StorytimeCoverBook {
    level: number;
    unit: number;
    firstWeek: number;
    lastWeek: number;
    title: string;
    levelColour: string;
    pictureRecipe: StorytimeCoverFigure[];
    panel: StorytimeCoverBookPanel;
}

/** The data file of the 16 books. */
export interface StorytimeCoverData {
    series: string;
    trim: { widthMm: number; heightMm: number };
    levelColours: Record<string, string>;
    lineAddress: string;
    books: StorytimeCoverBook[];
}

/** The QR module grid of a code. */
export interface StorytimeCoverQrGrid {
    modules: number;
    dark: number;
    cells: boolean[][];
}

/** The files of one build: the composed cover picture, the blocks of the cover, and the panel data. */
export interface StorytimeCoverAssets {
    /** The URL of the composed cover picture. */
    picture: string;
    /** The URL of the level card block, with its corner radius. */
    card: string;
    /** The URL of the back panel block, with its corner radius. */
    panel: string;
    /** The URL of the company logo. */
    logo: string;
    /** The five panel field values, in the panel order. Empty means the panel shows missing fields. */
    panelValues?: StorytimeCoverPanelValue[];
    /** True for a Drive mock: a missing field shows the light line (D11.4). A print build omits it. */
    panelMock?: boolean;
}

/** The week files and the phonics graph that supply the panel data of one level (FR-1a.2). */
export interface StorytimeCoverPanelCtx {
    /** The shipped week files of the level, parsed. The build restricts them for the print source rule (D12). */
    weeks: StorytimeWeek[];
    /** The decodability facts of the phonics graph. An approved source for every build (D12). */
    graph: PhonicsGraph;
}

/** One value of the back panel: the field, the rendered text, and the items behind it (FR-1a). */
export interface StorytimeCoverPanelValue {
    field: StorytimeCoverPanelField;
    value: string;
    items: string[];
}

/** The forbidden words of a cover (spec FR-4.2 and FR-4.3). */
const FORBIDDEN_TOKENS = [
    'cefr',
    'starters',
    'primary advantage',
    'gse',
    'yle',
    'reading a-z',
    'raz',
    'chibi',
    'mitr',
    'pre-a1',
    'pre a1',
    'a1',
    'a2',
    'b1',
    'b2',
    'c1',
    'c2',
];

/** The font folder of the print faces (Andika for English, Sarabun for Thai). */
const PRINT_FONT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'assets', 'print-fonts');

/**
 * Converts millimetres to pixels of the 300 ppi cover (the one shared conversion, test strategy
 * 4.3).
 * @param mm The size in millimetres.
 * @returns The size in pixels.
 */
export function storytimeCoverMmToPx(mm: number): number {
    return Math.round((mm / 25.4) * 300);
}

/**
 * Reads the data file of the 16 books.
 * @param file The data file (the shipped one by default).
 * @returns The data.
 */
export function loadStorytimeCoverBooks(file: string = STORYTIME_COVER_BOOKS_FILE): StorytimeCoverData {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as StorytimeCoverData;
}

/**
 * Tells a picture recipe from an empty one: an empty recipe is no picture (spec FR-1.6).
 * @param recipe The recipe of a book.
 * @returns True when the book has a picture.
 */
export function storytimeCoverHasPicture(recipe: readonly StorytimeCoverFigure[]): boolean {
    return recipe.length > 0;
}

/**
 * The title of a book (spec FR-1.4).
 * @param level The level of the book.
 * @param unit The unit of the book.
 * @returns The title.
 */
export function storytimeCoverTitle(level: number, unit: number): string {
    return `${STORYTIME_SERIES}, Level ${level}, Unit ${unit}, Student Book`;
}

/**
 * Checks the data of the 16 books: the series, the trim, the colours, the LINE address, the
 * rows, the titles, the weeks, the picture files, and the panel structure (D11, FR-1).
 * @param data The data.
 * @returns The errors (empty when the data is good).
 */
export function checkStorytimeCoverData(data: StorytimeCoverData): string[] {
    const errors: string[] = [];
    if (data.series !== STORYTIME_SERIES) errors.push(`The series is "${data.series}", not "${STORYTIME_SERIES}".`);
    if (data.trim?.widthMm !== 210 || data.trim?.heightMm !== 297) {
        errors.push(`The trim is ${data.trim?.widthMm} x ${data.trim?.heightMm} mm, not 210 x 297 mm.`);
    }
    if (data.lineAddress !== STORYTIME_LINE_ADDRESS) errors.push(`The LINE address is not ${STORYTIME_LINE_ADDRESS}.`);
    for (const [level, colour] of Object.entries(STORYTIME_LEVEL_COLOURS)) {
        if (data.levelColours?.[level] !== colour) {
            errors.push(`The level colour of Level ${level} is ${data.levelColours?.[level]}, not ${colour}.`);
        }
    }
    const books = Array.isArray(data.books) ? data.books : [];
    if (books.length !== 16) errors.push(`The data holds ${books.length} books, not 16.`);
    const seen = new Set<string>();
    const figureGroups = new Map<string, string>();
    for (const book of books) {
        const title = book.title ?? `${STORYTIME_SERIES}, Level ${book.level}, Unit ${book.unit}, Student Book`;
        const key = `${book.level}-${book.unit}`;
        if (seen.has(key)) errors.push(`${title}: the row ${key} is in the data twice.`);
        seen.add(key);
        if (book.title !== storytimeCoverTitle(book.level, book.unit)) {
            errors.push(`${title}: the title is not "${storytimeCoverTitle(book.level, book.unit)}".`);
        }
        const colour = STORYTIME_LEVEL_COLOURS[book.level];
        if (!colour) errors.push(`${title}: the level ${book.level} is not a level of the series.`);
        else if (book.levelColour !== colour) errors.push(`${title}: the level colour is ${book.levelColour}, not ${colour}.`);
        const weeks = STORYTIME_UNIT_WEEKS[book.unit];
        if (!weeks) errors.push(`${title}: the unit ${book.unit} is not a unit of the series.`);
        else if (book.firstWeek !== weeks[0] || book.lastWeek !== weeks[1]) {
            errors.push(`${title}: the weeks are ${book.firstWeek} to ${book.lastWeek}, not ${weeks[0]} to ${weeks[1]}.`);
        }
        if (!Array.isArray(book.pictureRecipe)) {
            errors.push(`${title}: the picture recipe is not a list.`);
        } else {
            let animals = 0;
            let animalSeen = false;
            for (const figure of book.pictureRecipe as StorytimeCoverFigure[]) {
                if (!figure || typeof figure !== 'object' || (figure.kind !== 'child' && figure.kind !== 'animal') || typeof figure.name !== 'string' || !figure.name.trim() || typeof figure.file !== 'string' || !figure.file.trim()) {
                    errors.push(`${title}: a figure of the recipe does not state a kind (child or animal), a name, and a file.`);
                    continue;
                }
                if (figure.kind === 'animal') {
                    animals++;
                    animalSeen = true;
                } else if (animalSeen) {
                    errors.push(`${title}: the child "${figure.name}" comes after the animal; the children come first and the animal last.`);
                }
                const abs = path.isAbsolute(figure.file) ? figure.file : path.join(REPO_ROOT, figure.file);
                if (!fs.existsSync(abs)) errors.push(`${title}: the picture file is missing: ${figure.file}`);
            }
            const children = book.pictureRecipe.filter((figure) => figure && figure.kind === 'child').length;
            if (children > STORYTIME_COVER_FIGURE_LIMITS.children) {
                errors.push(`${title}: the recipe holds ${children} children; ${STORYTIME_COVER_FIGURE_LIMITS.children} is the maximum.`);
            }
            if (animals > STORYTIME_COVER_FIGURE_LIMITS.animals) {
                errors.push(`${title}: the recipe holds ${animals} animals; ${STORYTIME_COVER_FIGURE_LIMITS.animals} is the maximum.`);
            }
        }
        if (Array.isArray(book.pictureRecipe) && book.pictureRecipe.length) {
            const group = book.pictureRecipe
                .map((figure) => (figure ? figure.name : ''))
                .filter(Boolean)
                .sort()
                .join(', ');
            const first = figureGroups.get(group);
            if (first) errors.push(`${title}: the figure group (${group}) repeats the group of ${first}.`);
            else figureGroups.set(group, title);
        }
        const panel = book.panel as StorytimeCoverBookPanel | undefined;
        if (!panel || typeof panel !== 'object') {
            errors.push(`${title}: the row holds no panel with the five fields (D11).`);
        } else {
            errors.push(...checkStorytimeCoverPanelFields(Object.keys(panel)));
            const story = panel.story;
            if (!story || typeof story.text !== 'string' || !Array.isArray(story.weeks)) {
                errors.push(`${title}: the story entry holds no text and no week list.`);
            } else {
                for (const week of story.weeks) {
                    if (!Number.isInteger(week) || week < book.firstWeek || week > book.lastWeek) {
                        errors.push(`${title}: the story week ${week} is outside the unit.`);
                    }
                }
            }
            for (const field of ['sounds', 'decodable', 'sight', 'books'] as const) {
                const entry = panel[field] as StorytimeCoverPanelEntry | undefined;
                if (!entry || !Array.isArray(entry.weeks)) {
                    errors.push(`${title}: the ${field} entry holds no week list.`);
                    continue;
                }
                for (const week of entry.weeks) {
                    if (!Number.isInteger(week) || week < book.firstWeek || week > book.lastWeek) {
                        errors.push(`${title}: the ${field} week ${week} is outside the unit.`);
                    }
                }
            }
        }
    }
    return errors;
}

/**
 * The words of the student text of a week: the book titles, the page texts, the back words, the
 * check items, and the words of the home card. The approval words are not student text.
 * @param week The week.
 * @returns The words, in lower case.
 */
export function storytimeCoverStudentWords(week: StorytimeWeek): Set<string> {
    const words = new Set<string>();
    const add = (value: string) => {
        for (const word of value.toLowerCase().match(/[a-z]+/g) ?? []) words.add(word);
    };
    for (const book of week.books) {
        add(book.title);
        for (const page of book.pages) add(page.text);
        for (const word of book.backWords) add(word);
    }
    for (const item of week.check.items) {
        if ('pictures' in item) for (const picture of item.pictures) add(picture);
        if ('answer' in item) add(item.answer);
        if ('word' in item) add(item.word);
        if ('letter' in item) add(item.letter);
        if ('words' in item) for (const word of item.words) add(word);
        if ('groups' in item) for (const group of item.groups) for (const picture of group.pictures) add(picture);
    }
    for (const word of week.home?.words ?? []) add(word);
    return words;
}

/**
 * The words of the student text of a week that a panel field may use: the family words, the home
 * words, the back words of the student books, and the page text of the student books (FR-1a.3).
 * @param week The week.
 * @returns The words, in lower case, with repeats.
 */
function storytimeCoverPanelCandidateWords(week: StorytimeWeek): string[] {
    const out: string[] = [];
    for (const entry of week.focus.family.words) out.push(entry.word);
    for (const word of week.home?.words ?? []) out.push(word);
    for (const book of week.books) for (const word of book.backWords) out.push(word);
    for (const book of week.books) for (const page of book.pages) for (const word of page.text.match(/[a-z]+/gi) ?? []) out.push(word);
    return out.map((word) => word.toLowerCase());
}

/**
 * The weeks of the unit of a book that the context can read, in week order (FR-1.8).
 * @param book The book row.
 * @param ctx The panel context.
 * @returns The readable weeks of the unit.
 */
function storytimeCoverPanelUnitWeeks(book: StorytimeCoverBook, ctx: StorytimeCoverPanelCtx): StorytimeWeek[] {
    return ctx.weeks
        .filter((week) => week.meta.week >= book.firstWeek && week.meta.week <= book.lastWeek)
        .sort((a, b) => a.meta.week - b.meta.week);
}

/**
 * The five values of the back panel of a book, in the panel order (D11, FR-1a). The story comes
 * from the data file when every named source week is in the context. The four derived fields come
 * from the weeks of the context: the sounds from `focus.element` and the graph, the decodable
 * words from `wordNeed` at the program week, the sight words from `focus.trickyWords` that the
 * graph cannot decode yet, and the books from the reader titles. No value repeats.
 * @param book The book row.
 * @param ctx The panel context. A print build passes only the approved weeks (D12).
 * @returns The values, in the order of `STORYTIME_COVER_PANEL_FIELDS`.
 */
export function storytimeCoverPanelValues(book: StorytimeCoverBook, ctx: StorytimeCoverPanelCtx): StorytimeCoverPanelValue[] {
    const unitWeeks = storytimeCoverPanelUnitWeeks(book, ctx);
    const inCtx = new Set(unitWeeks.map((week) => week.meta.week));
    const storyWeeks = book.panel?.story?.weeks ?? [];
    const story = storyWeeks.every((week) => inCtx.has(week)) ? (book.panel?.story?.text ?? '').trim() : '';
    const sounds: string[] = [];
    const decodable: string[] = [];
    const sight: string[] = [];
    const books: string[] = [];
    for (const week of unitWeeks) {
        const program = programWeek(book.level, week.meta.week);
        const element = week.focus.element;
        if (element && element.id.startsWith('english.phonics.')) {
            const sound = `${element.graphemes.join('')} ${element.sound}`;
            if (!sounds.includes(sound)) sounds.push(sound);
        }
        for (const word of storytimeCoverPanelCandidateWords(week)) {
            const need = wordNeed(word, ctx.graph, program);
            if (need.week !== null && need.week <= program && !decodable.includes(word)) decodable.push(word);
        }
        for (const tricky of week.focus.trickyWords) {
            const word = tricky.toLowerCase();
            const need = wordNeed(word, ctx.graph, program);
            if ((need.week === null || need.week > program) && !sight.includes(word)) sight.push(word);
        }
        for (const reader of week.books.filter((row) => row.kind === 'readalong' || row.kind === 'decodable')) {
            if (!books.includes(reader.title)) books.push(reader.title);
        }
    }
    return [
        { field: 'story', value: story, items: story ? [story] : [] },
        { field: 'sounds', value: sounds.join(', '), items: sounds },
        { field: 'decodable', value: decodable.join(', '), items: decodable },
        { field: 'sight', value: sight.join(', '), items: sight },
        { field: 'books', value: books.join(', '), items: books },
    ];
}

/**
 * The weeks of each panel field that the context can read (FR-1.8, D11.2). A week is readable
 * when the module can read its sources: the week file parses (the week is in the context) and
 * the phonics graph holds at least one GPC node at the program week of that week. A review week
 * with no graph node at its program week, and a level with no graph data, reads no field.
 * @param book The book row.
 * @param ctx The panel context.
 * @returns The readable weeks of each field, in the panel order.
 */
export function storytimeCoverPanelReadableWeeks(
    book: StorytimeCoverBook,
    ctx: StorytimeCoverPanelCtx,
): Record<StorytimeCoverPanelField, number[]> {
    const unitWeeks = storytimeCoverPanelUnitWeeks(book, ctx);
    const inCtx = new Set(unitWeeks.map((week) => week.meta.week));
    const readable: Record<StorytimeCoverPanelField, number[]> = { story: [], sounds: [], decodable: [], sight: [], books: [] };
    readable.story = (book.panel?.story?.weeks ?? []).filter((week) => inCtx.has(week));
    const graphWeeks = new Set<number>();
    for (const week of ctx.graph.pairWeek.values()) graphWeeks.add(week);
    for (const week of unitWeeks) {
        if (!graphWeeks.has(programWeek(book.level, week.meta.week))) continue;
        readable.sounds.push(week.meta.week);
        readable.decodable.push(week.meta.week);
        readable.sight.push(week.meta.week);
        readable.books.push(week.meta.week);
    }
    return readable;
}

/**
 * Checks the order of the panel field names against the D11 order (D11.1).
 * @param fields The field names, in their given order.
 * @returns The errors (empty when the order is the panel order).
 */
export function checkStorytimeCoverPanelFields(fields: readonly string[]): string[] {
    const errors: string[] = [];
    const expected = STORYTIME_COVER_PANEL_FIELDS as readonly string[];
    const present = fields.filter((field) => expected.includes(field));
    if (present.length !== expected.length) {
        errors.push(`The panel holds the fields ${present.join(', ')}, not the five fields of D11.`);
        return errors;
    }
    for (const [index, field] of present.entries()) {
        if (field !== expected[index]) {
            errors.push(`The panel field order is ${present.join(', ')}, not ${expected.join(', ')}.`);
            break;
        }
    }
    return errors;
}

/**
 * Checks the panel row of a book against the context: the field order, the story source weeks,
 * the story words against the student text of the source weeks, and the week lists of the four
 * derived fields against the readable weeks (D11.2, FR-1.8, FR-1.9).
 * @param book The book row.
 * @param ctx The panel context.
 * @returns The errors (empty when the row is good).
 */
export function checkStorytimeCoverPanelRow(book: StorytimeCoverBook, ctx: StorytimeCoverPanelCtx): string[] {
    const errors: string[] = [];
    const title = book.title;
    const panel = book.panel;
    if (!panel || typeof panel !== 'object') {
        errors.push(`${title}: the row holds no panel with the five fields (D11).`);
        return errors;
    }
    errors.push(...checkStorytimeCoverPanelFields(Object.keys(panel)));
    const unitWeeks = storytimeCoverPanelUnitWeeks(book, ctx);
    const inUnit = new Set(unitWeeks.map((week) => week.meta.week));
    const story = panel.story;
    if (!story || typeof story.text !== 'string' || !Array.isArray(story.weeks)) {
        errors.push(`${title}: the story entry holds no text and no week list.`);
    } else {
        const sources = unitWeeks.filter((week) => story.weeks.includes(week.meta.week));
        for (const week of story.weeks) {
            if (!inUnit.has(week)) errors.push(`${title}: the story week ${week} is outside the unit.`);
            else if (!sources.some((entry) => entry.meta.week === week)) errors.push(`${title}: the story week ${week} is not readable.`);
        }
        if (story.text.trim()) {
            if (!sources.length) errors.push(`${title}: the story names no readable source week.`);
            const allowed = new Set<string>();
            for (const week of sources) for (const word of storytimeCoverStudentWords(week)) allowed.add(word);
            for (const word of story.text.toLowerCase().match(/[a-z]+/g) ?? []) {
                if (!allowed.has(word)) errors.push(`The story word "${word}" is not in the student text of the source weeks of ${title}.`);
            }
            if (/\b(19|20)\d{2}\b/.test(story.text)) errors.push(`${title}: the story holds a year.`);
        } else if (story.weeks.length) {
            errors.push(`${title}: the story names source weeks but holds no text.`);
        }
    }
    const readable = storytimeCoverPanelReadableWeeks(book, ctx);
    for (const field of ['sounds', 'decodable', 'sight', 'books'] as const) {
        const entry = panel[field] as StorytimeCoverPanelEntry | undefined;
        if (!entry || !Array.isArray(entry.weeks)) {
            errors.push(`${title}: the ${field} entry holds no week list.`);
            continue;
        }
        for (const week of entry.weeks) {
            if (!inUnit.has(week)) errors.push(`${title}: the ${field} week ${week} is outside the unit.`);
            else if (!readable[field].includes(week)) errors.push(`${title}: the ${field} week ${week} is not readable for the field.`);
        }
        for (const week of readable[field]) {
            if (!entry.weeks.includes(week)) errors.push(`${title}: the readable ${field} week ${week} is not in the week list.`);
        }
    }
    return errors;
}

/**
 * The height of the panel text block at one size, in millimetres: one heading line per field plus
 * the wrapped value lines or the missing-field line (D11.3). The estimate uses the average
 * character width of `STORYTIME_COVER_PANEL_CHAR_EM`, which is wider than the real face, so the
 * estimate overestimates the line count.
 * @param values The panel values, in the panel order.
 * @param pt The font size in points.
 * @param inset The panel inset box, in millimetres.
 * @returns The estimated height of the text block.
 */
export function storytimeCoverPanelLayoutMm(
    values: readonly StorytimeCoverPanelValue[],
    pt: number,
    inset: { widthMm: number; heightMm: number },
): number {
    const charMm = (pt * STORYTIME_COVER_PANEL_CHAR_EM * 25.4) / 72;
    const charsPerLine = Math.max(8, Math.floor(inset.widthMm / charMm));
    const lineMm = (pt * STORYTIME_COVER_PANEL_LINE_HEIGHT * 25.4) / 72;
    let lines = 0;
    for (const entry of values) {
        lines += 1;
        const words = entry.value.trim().split(/\s+/).filter(Boolean);
        if (!words.length) {
            lines += 1;
            continue;
        }
        let wrapped = 1;
        let current = 0;
        for (const word of words) {
            const add = word.length + (current ? 1 : 0);
            if (current + add > charsPerLine && current) {
                wrapped++;
                current = word.length;
            } else {
                current += add;
            }
        }
        lines += wrapped;
    }
    return lines * lineMm;
}

/**
 * Tells when a panel layout does not fit: a size outside the scale never fits, and a size of the
 * scale does not fit when the estimated text block is higher than the inset (D11.3, M19).
 * @param values The panel values, in the panel order.
 * @param pt The font size in points.
 * @param inset The panel inset box, in millimetres.
 * @returns True when the layout overflows the inset.
 */
export function storytimeCoverPanelOverflows(
    values: readonly StorytimeCoverPanelValue[],
    pt: number,
    inset: { widthMm: number; heightMm: number },
): boolean {
    if (!(STORYTIME_COVER_PANEL_SCALE_PT as readonly number[]).includes(pt)) return true;
    return storytimeCoverPanelLayoutMm(values, pt, inset) > inset.heightMm;
}

/**
 * The chosen panel size: the largest size of the fixed scale that fits the inset (D11.3). The
 * floor is the smallest size of the scale, 10 pt.
 * @param values The panel values, in the panel order.
 * @param inset The panel inset box, in millimetres.
 * @returns The chosen size in points.
 */
export function storytimeCoverPanelChosenPt(
    values: readonly StorytimeCoverPanelValue[],
    inset: { widthMm: number; heightMm: number },
): number {
    for (const pt of STORYTIME_COVER_PANEL_SCALE_PT) {
        if (!storytimeCoverPanelOverflows(values, pt, inset)) return pt;
    }
    return STORYTIME_COVER_PANEL_SCALE_PT[STORYTIME_COVER_PANEL_SCALE_PT.length - 1];
}

/**
 * The default output folder of one version, under the print-ready root (FR-5.6, FR-5.7). Version 1
 * keeps the original `proof` folder; a later version gets its own `proof-v<n>` folder.
 * @param version The version of the build.
 * @param printReadyRoot The print-ready root, for example `~/Desktop/print-ready`.
 * @returns The output folder.
 */
export function storytimeCoverDefaultOutDir(version: number, printReadyRoot: string): string {
    return path.join(printReadyRoot, 'storytime', version <= 1 ? 'proof' : `proof-v${version}`);
}

/**
 * Normalises the text of a page before the copy check: one case, one space, one dash.
 * @param text The text of a page.
 * @returns The normalised text.
 */
function normaliseCoverText(text: string): string {
    return text
        .replace(/\u00a0/g, ' ')
        .replace(/[\u2010\u2011\u2013]/g, '-')
        .replace(/[\u00ad\u200b]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

/**
 * The copy check of a cover side (spec FR-4): the series name, no forbidden word, no year. The
 * check reads the text of the built page, never the source.
 * @param pageText The text of one side of the built PDF.
 * @returns The errors (empty when the copy is good).
 */
export function checkStorytimeCoverCopy(pageText: string): string[] {
    const errors: string[] = [];
    const text = normaliseCoverText(pageText);
    if (!text.includes(STORYTIME_SERIES.toLowerCase())) errors.push(`The page does not show "${STORYTIME_SERIES}".`);
    const patterns = new Set<string>();
    for (const token of FORBIDDEN_TOKENS) {
        patterns.add(token);
        if (token.includes('-')) patterns.add(token.replace(/-/g, ''));
    }
    for (const token of patterns) {
        const body = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        if (new RegExp(`\\b${body}\\b`).test(text)) errors.push(`The page shows the forbidden word "${token}".`);
    }
    if (/\b(19|20)\d{2}\b/.test(text)) errors.push('The page shows a year.');
    return errors;
}

/**
 * The Thai characters of a text, in order.
 * @param text The text.
 * @returns The Thai characters.
 */
function thaiChars(text: string): string {
    return [...text].filter((char) => /[\u0E00-\u0E7F]/.test(char)).join('');
}

/**
 * The Thai check of a cover side (spec FR-6.1): the Thai of the back page is the Thai of the
 * five approved contact lines, and the front page holds no Thai at all.
 * @param pageText The text of one side of the built PDF.
 * @param side The side of the cover.
 * @returns The errors (empty when the Thai is good).
 */
export function checkStorytimeCoverThai(pageText: string, side: 'front' | 'back'): string[] {
    const thai = thaiChars(pageText);
    if (side === 'front') {
        return thai ? [`The front page holds ${thai.length} Thai characters.`] : [];
    }
    const expected = thaiChars(BACK_LINES.contact.join('\n'));
    if (thai === expected) return [];
    return [`The Thai of the back page is not the Thai of the five approved contact lines (${thai.length} characters, ${expected.length} at most).`];
}

/**
 * The module grid of a QR code, read from the SVG of the encoder (the quiet zone is not data).
 * @param svg The SVG of `generateQRCode`.
 * @returns The grid: the number of modules, the number of dark cells, and the cells.
 */
export function storytimeCoverQrGrid(svg: string): StorytimeCoverQrGrid {
    const viewBox = Number(svg.match(/viewBox="0 0 (\d+) \1"/)?.[1]);
    const modules = Number.isFinite(viewBox) ? viewBox / 10 - 8 : 0;
    const cells: boolean[][] = Array.from({ length: modules }, () => Array.from({ length: modules }, () => false));
    let dark = 0;
    for (const match of svg.matchAll(/<rect\b([^>]*)\/?>/g)) {
        const attrs = match[1];
        if (!/fill="#000000"/i.test(attrs)) continue;
        if (Number(attrs.match(/\bwidth="(\d+)"/)?.[1]) !== 10) continue;
        const col = Number(attrs.match(/\bx="(\d+)"/)?.[1]) / 10;
        const row = Number(attrs.match(/\by="(\d+)"/)?.[1]) / 10;
        if (!Number.isInteger(col) || !Number.isInteger(row)) continue;
        cells[row][col] = true;
        dark++;
    }
    return { modules, dark, cells };
}

/**
 * Counts the modules of a printed QR code that differ from the encoder output.
 * @param printed The printed grid.
 * @param expected The grid of the encoder.
 * @returns The number of different modules.
 */
export function checkStorytimeCoverQr(printed: boolean[][], expected: boolean[][]): number {
    let different = 0;
    for (let row = 0; row < expected.length; row++) {
        for (let col = 0; col < expected[row].length; col++) {
            if (Boolean(printed[row]?.[col]) !== Boolean(expected[row][col])) different++;
        }
    }
    return different;
}

/**
 * The corner mode of the build: the corner radius of the level card and of the unit summary
 * panel is flattened into the opaque picture layer, so the page text stays text.
 * @returns The corner mode.
 */
export function storytimeCoverCornerMode(): string {
    return STORYTIME_COVER_CORNER_MODE;
}

/**
 * The `@font-face` rules of the cover: Andika for English, Sarabun for Thai, one static face
 * for each weight, so that Chrome embeds no synthesised face (lessons-learned, 2026-10-02).
 * @returns The CSS.
 */
export function storytimeCoverFontCss(): string {
    const faces = [
        { family: 'Andika', weight: 400, file: 'andika-regular.ttf', format: 'truetype' },
        { family: 'Andika', weight: 700, file: 'andika-bold.ttf', format: 'truetype' },
        { family: 'Sarabun', weight: 400, file: 'sarabun-thai-400-normal.woff2', format: 'woff2', range: THAI },
        { family: 'Sarabun', weight: 700, file: 'sarabun-thai-700-normal.woff2', format: 'woff2', range: THAI },
    ];
    return faces
        .map((face) => {
            const range = face.range ? ` unicode-range: ${face.range};` : '';
            return `@font-face { font-family: '${face.family}'; font-weight: ${face.weight}; font-style: normal; src: url('file://${PRINT_FONT_DIR}/${face.file}') format('${face.format}');${range} }`;
        })
        .join('\n');
}

/**
 * The QR code of the back cover, as the SVG of the encoder.
 * @returns The SVG.
 */
export function storytimeCoverQrSvg(): string {
    return generateQRCode(STORYTIME_LINE_ADDRESS) ?? '';
}

/**
 * The URL of a picture file of the repo.
 * @param file The absolute path of the file.
 * @returns The URL.
 */
export function storytimeCoverFileUrl(file: string): string {
    return pathToFileURL(file).href;
}

/** The document CSS of a cover side. */
const COVER_CSS = `
@page { size: 210mm 297mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body { font-family: 'Andika', 'Sarabun', sans-serif; font-synthesis: none; color: #1a1a1a; }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #ffffff; }
.page + .page { break-before: page; }
.wordmark { position: absolute; top: 13mm; left: 0; width: 210mm; text-align: center; font-weight: 700; font-size: 30pt; white-space: nowrap; }
.back-wordmark { position: absolute; top: 14.5mm; left: 0; width: 210mm; padding-left: 46mm; text-align: center; font-weight: 700; font-size: 22pt; white-space: nowrap; }
.picture-area { position: absolute; }
.picture-area img { display: block; width: 100%; height: 100%; }
.level-card { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3.5mm; }
.level-card img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.level-line { position: relative; font-weight: 700; font-size: 32pt; line-height: 1; color: #ffffff; }
.book-line { position: relative; font-weight: 400; font-size: 17pt; line-height: 1; color: #ffffff; }
.logo { position: absolute; }
.logo img { display: block; width: 100%; height: 100%; }
.panel { position: absolute; }
.panel img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.panel-inset { position: absolute; overflow: hidden; }
.panel-field { position: relative; line-height: 1.5; }
.panel-heading { font-weight: 700; }
.panel-value { color: #1a1a1a; }
.panel-missing { color: #8a857a; }
.contact { position: absolute; font-size: 11.5pt; line-height: 1.62; color: #1a1a1a; }
.contact p { margin: 0; }
.contact .head { font-weight: 700; }
.ph { white-space: nowrap; }
.qr-box { position: absolute; }
.qr-box svg { display: block; width: 100%; height: 100%; }
.line-label { position: absolute; text-align: center; font-weight: 700; font-size: 11.5pt; }
`;

/**
 * The HTML of one cover side.
 * @param side The side of the cover.
 * @param title The title of the book.
 * @param body The body of the side.
 * @returns The HTML document.
 */
function coverDocument(side: 'front' | 'back', title: string, body: string): string {
    return `<!doctype html><html><head><meta charset="utf-8"><style>${storytimeCoverFontCss()}${COVER_CSS}</style></head>
<body><div class="page" data-side="${side}" data-title="${escapeCoverText(title)}">
${body}
</div></body></html>`;
}

/**
 * Escapes the text of a cover (the titles, the unit summary).
 * @param text The text.
 * @returns The escaped text.
 */
function escapeCoverText(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The HTML of the front and the back of one cover.
 * @param book The book of the cover.
 * @param assets The files of the build: the composed cover picture, the blocks, and the logo.
 * @returns The front HTML and the back HTML.
 */
export function renderStorytimeCover(
    book: StorytimeCoverBook,
    assets: Partial<StorytimeCoverAssets> = {},
): { frontHtml: string; backHtml: string } {
    const box = STORYTIME_COVER_BOX;
    const picture = assets.picture ?? '';
    const card = assets.card ?? '';
    const panelImage = assets.panel ?? '';
    const logo = assets.logo ?? storytimeCoverFileUrl(STORYTIME_COVER_LOGO_FILE);
    const panelValues = assets.panelValues ?? [];
    const panelMock = assets.panelMock ?? true;
    const panelPt = storytimeCoverPanelChosenPt(panelValues, STORYTIME_COVER_PANEL_INSET_MM);
    const fields = (STORYTIME_COVER_PANEL_FIELDS as readonly StorytimeCoverPanelField[])
        .map((field) => {
            const entry = panelValues.find((value) => value.field === field);
            const value = entry?.value.trim() ?? '';
            const body = value
                ? `<div class="panel-value" data-part="panel-value">${escapeCoverText(value)}</div>`
                : panelMock
                    ? `<div class="panel-missing" data-part="panel-missing">${STORYTIME_COVER_PANEL_MISSING_LINE}</div>`
                    : '';
            return `<div class="panel-field" data-part="panel-field" data-field="${field}" style="font-size: ${panelPt}pt;">` +
                `<div class="panel-heading" data-part="panel-heading">${STORYTIME_COVER_PANEL_HEADINGS[field]}</div>${body}</div>`;
        })
        .join('\n');
    const front = `<div class="wordmark" data-part="series-name" style="color:${book.levelColour}">${STORYTIME_SERIES}</div>
<div class="picture-area" data-part="picture-area" style="left: ${box.pictureArea.left}mm; top: ${box.pictureArea.top}mm; width: ${box.pictureArea.width}mm; height: ${box.pictureArea.height}mm;"><img src="${picture}" alt=""></div>
<div class="level-card" data-part="level-card" style="left: ${box.levelCard.left}mm; top: ${box.levelCard.top}mm; width: ${box.levelCard.width}mm; height: ${box.levelCard.height}mm;"><img src="${card}" alt="">
<div class="level-line">Level ${book.level} &middot; Unit ${book.unit}</div>
<div class="book-line">Student Book</div>
</div>`;
    const panel = `<div class="panel" data-part="panel" style="left: ${box.panel.left}mm; top: ${box.panel.top}mm; width: ${box.panel.width}mm; height: ${box.panel.height}mm; background: #F7F5F0; border: 0.4mm solid #E1DDD3; border-radius: 3mm;"><img src="${panelImage}" alt="">
<div class="panel-inset" data-part="panel-inset" style="left: 12mm; top: 12mm; width: ${STORYTIME_COVER_PANEL_INSET_MM.widthMm}mm; height: ${STORYTIME_COVER_PANEL_INSET_MM.heightMm}mm;">
${fields}
</div>
</div>`;
    const contact = BACK_LINES.contact
        .map((line, index) => `<p${index === 0 ? ' class="head"' : ''}>${richHtml(line, true)}</p>`)
        .join('\n');
    const back = `<div class="back-wordmark" data-part="series-name" style="color:${book.levelColour}">${STORYTIME_SERIES}</div>
<div class="logo" data-part="logo" style="left: ${box.logo.left}mm; top: ${box.logo.top}mm; width: ${box.logo.width}mm; height: ${box.logo.height}mm;"><img src="${logo}" alt=""></div>
${panel}
<div class="contact" data-part="contact" style="left: ${box.contact.left}mm; top: ${box.contact.top}mm; width: ${box.contact.width}mm;">
${contact}
</div>
<div class="qr-box" data-part="qr" style="right: ${box.qr.right}mm; top: ${box.qr.top}mm; width: ${box.qr.width}mm; height: ${box.qr.height}mm;">${storytimeCoverQrSvg()}</div>
<div class="line-label" data-part="line-label" style="right: ${box.lineLabel.right}mm; top: ${box.lineLabel.top}mm; width: ${box.lineLabel.width}mm; color:${book.levelColour}">LINE</div>`;
    return {
        frontHtml: coverDocument('front', book.title, front),
        backHtml: coverDocument('back', book.title, back),
    };
}
