import fs from 'node:fs';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { REPO_ROOT } from '../../lesson-package/files';
import { singularOf, type StorytimePictureRow } from './pictures';
import { resolveStorytimePictureFiles } from './picture-check';
import { fontFaceCss } from './print-fonts';
import type { StorytimeWeek } from '../schema';

/**
 * The unit 1 card kit (spec FR-7, plan Phase 8): the cards, the workmats, the sorting mats, the
 * word wall cards, the sticker sheet, and the letter strip of one unit. Every list comes from the
 * `materials` lines of the week packages, from `focus.frame`, and from the benchmark letter strip;
 * the module reads the parsed weeks only, so the same weeks give the same kit.
 *
 * The plan fixes the sizes, the n-up plan, the class-set flag, and the order of a kind (lines 950
 * to 965). The card counts of unit 1 are the Red contract of `__tests__/storytime-print-card-kit.test.ts`.
 * The picture match of a card is the PM rule of 2026-11-05 (see `storytimeCardPictureRow`).
 */

/** The kinds of a card (plan line 954). */
export type StorytimeCardKind =
    | 'sound'
    | 'symbol'
    | 'picture'
    | 'sound-picture'
    | 'family-picture'
    | 'tricky-word'
    | 'word'
    | 'frame'
    | 'letter';

/** The kinds of a kit item that is not a card (plan line 953). */
export type StorytimeKitItemKind = 'workmat' | 'sorting-mat' | 'word-wall' | 'sticker';

/** The two card sizes of the kit (plan line 963). */
export type StorytimeCardSize = 'A5' | 'A6';

/** One card of the kit (plan line 952). */
export interface StorytimeCard {
    /** The kind of the card. */
    kind: StorytimeCardKind;
    /** The text on the card: the letter, the picture word, the tricky word, or the frame. */
    label: string;
    /** The card size, from `storytimeCardSize`. */
    size: StorytimeCardSize;
    /** True when the item prints once for each child (plan line 962). */
    classSet: boolean;
}

/** One kit item that is not a card: a workmat, a sorting mat, a word wall card, or a sticker. */
export interface StorytimeKitItem {
    /** The kind of the item. */
    kind: StorytimeKitItemKind;
    /** The text of the item. */
    label: string;
    /** The week that names the item. */
    week: number;
    /** True when the item prints once for each child: only the workmats are class-set items. */
    classSet: boolean;
}

/** The whole kit of one unit (plan line 951). */
export interface StorytimeCardKit {
    /** The cards, in print order: the A5 kinds first, then the A6 kinds. */
    cards: StorytimeCard[];
    /** The kit items, in print order: the workmats, the word wall cards, the sorting mats, the stickers. */
    items: StorytimeKitItem[];
    /** The letters of the level benchmark strip, in the printed order. */
    letterStrip: string[];
}

/** The n-up plan of one card size (plan line 964). */
export interface StorytimeCardPagePlan {
    /** The card size of the plan. */
    size: StorytimeCardSize;
    /** The cards of one sheet. */
    perSheet: number;
    /** The cards of this size. */
    cards: number;
    /** The sheets of this size. */
    sheets: number;
    /** The sheet, in millimeters. */
    sheet: { widthMm: number; heightMm: number };
}

/**
 * The paper facts of the kit (plan line 964, spec FR-7): 300 gsm cards, round 40 mm stickers on an
 * A4 sheet. Daniel checks the paper on the proof.
 */
export const STORYTIME_CARD_KIT_SPEC = {
    /** The paper weight of the cards, in grams per square meter. */
    gsm: 300,
    /** The diameter of one sticker, in millimeters. */
    stickerDiameterMm: 40,
    /** The sticker sheet, in millimeters: A4 portrait. */
    sheetMm: { widthMm: 210, heightMm: 297 },
} as const;

/** The size of each kind (plan line 963). */
const CARD_SIZES: Record<StorytimeCardKind, StorytimeCardSize> = {
    sound: 'A5',
    symbol: 'A5',
    frame: 'A5',
    picture: 'A6',
    'sound-picture': 'A6',
    'family-picture': 'A6',
    'tricky-word': 'A6',
    word: 'A6',
    letter: 'A6',
};

/** The print order of the kinds: the A5 kinds first, so that a sheet holds one size. */
const CARD_KIND_ORDER: StorytimeCardKind[] = [
    'sound', 'symbol', 'frame',
    'picture', 'sound-picture', 'family-picture', 'tricky-word', 'word', 'letter',
];

/** The kinds that print a picture (the PM match rule of 2026-11-05). */
export const STORYTIME_CARD_PICTURE_KINDS: StorytimeCardKind[] = ['picture', 'sound-picture', 'family-picture'];

/**
 * The approved sRGB value of each color word card (owner decision, Daniel, PM relay, 2026-11-06:
 * "The 8 color words print as a color patch"). The card prints a rounded rectangle of this color in
 * its picture area. It prints no picture and no empty box. The keys are the card words in lower
 * case.
 */
export const STORYTIME_CARD_COLOR_PATCH: Record<string, string> = {
    red: '#E53935',
    blue: '#1E88E5',
    yellow: '#FDD835',
    green: '#43A047',
    orange: '#FB8C00',
    pink: '#F48FB1',
    purple: '#8E24AA',
    brown: '#6D4C41',
};

/**
 * The dot count of each number word card (owner decision, Daniel, PM relay, 2026-11-06: "the 9
 * number words print as the number with dots"). The card prints the numeral and exactly this many
 * round dots. It prints no picture and no empty box.
 */
export const STORYTIME_CARD_NUMBER_DOTS: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
};

/** The most dots of one row of a number card (the Red contract: at most five dots per row). */
const CARD_NUMBER_DOT_ROW_MAX = 5;

/** The special picture source of a card: a color patch or a number dot group. */
type CardSpecialSource = 'patch' | 'dots';

/**
 * The special picture source of one card.
 * @param card The card.
 * @returns `patch` for a color word, `dots` for a number word, or undefined for any other card.
 */
function cardSpecialSource(card: StorytimeCard): CardSpecialSource | undefined {
    const word = card.label.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(STORYTIME_CARD_COLOR_PATCH, word)) return 'patch';
    if (Object.prototype.hasOwnProperty.call(STORYTIME_CARD_NUMBER_DOTS, word)) return 'dots';
    return undefined;
}

/** The n-up plan of each size (plan line 964). */
const CARD_SHEETS: Record<StorytimeCardSize, { perSheet: number; sheet: { widthMm: number; heightMm: number } }> = {
    A5: { perSheet: 2, sheet: { widthMm: 297, heightMm: 210 } },
    A6: { perSheet: 4, sheet: { widthMm: 210, heightMm: 297 } },
};

/** The uses of a picture row that match a card word by its text (the PM rule, case a). */
const CARD_PICTURE_TEXT_USES = ['check-row', 'practice-line', 'd4-prompt'];

/** One `materials` line of a step, split into its name, its parenthetical qualifier, and its items. */
interface MaterialsLine {
    /** The name before the qualifier and the colon, in lower case, e.g. `sound picture cards`. */
    name: string;
    /** The text between the parentheses, in lower case; empty when the line has no qualifier. */
    qualifier: string;
    /** The items after the colon; empty for a line without a colon. */
    items: string[];
}

/**
 * The shape of a `materials` line: a lower-case name, an optional parenthetical qualifier, and an
 * optional colon with the items. A line with any other shape (a comma in the name, an apostrophe,
 * a quoted book name with no card name) does not match, so an unknown materials line is ignored
 * instead of being read as a card (plan line 967: the books line changes soon).
 */
const MATERIALS_LINE = /^([a-z][a-z ]*?)\s*(?:\(([^)]*)\))?\s*(?::\s*(.*))?$/i;

/**
 * Splits the body of a sticker line on the commas that sit outside a pair of double quotes. A name
 * in quotes keeps its comma (`"Tap, Tap!"`), and a name without quotes stays one item, so a line
 * that mixes the two forms keeps every name (Review C, C-P8-2). The quotes are dropped.
 * @param body The text after the colon.
 * @returns The items, trimmed, in the order of the line.
 */
function splitOutsideQuotes(body: string): string[] {
    const items: string[] = [];
    let current = '';
    let quoted = false;
    for (const char of body) {
        if (char === '"') {
            quoted = !quoted;
            continue;
        }
        if (char === ',' && !quoted) {
            items.push(current);
            current = '';
            continue;
        }
        current += char;
    }
    items.push(current);
    return items.map((item) => item.trim()).filter(Boolean);
}

/**
 * Splits the items of a line. A sticker line keeps a comma inside its name (`"Tap, Tap!"`), so a
 * sticker line splits on the commas outside its quotes; any other line splits on the commas.
 * @param name The lower-case name of the line.
 * @param body The text after the colon.
 * @returns The items, trimmed, in the order of the line.
 */
function itemsOf(name: string, body: string): string[] {
    if (!body) return [];
    if (name === 'sticker' || name === 'stickers') return splitOutsideQuotes(body);
    return body.split(',').map((item) => item.trim()).filter(Boolean);
}

/**
 * Reads one `materials` line of a step.
 * @param line The line, e.g. `letter cards (class set): n, a, n`.
 * @returns The parts of the line, or undefined when the line is not a materials line of the shape above.
 */
function materialsLineOf(line: string): MaterialsLine | undefined {
    const match = MATERIALS_LINE.exec(line.trim());
    if (!match) return undefined;
    const name = match[1].trim().toLowerCase();
    const qualifier = (match[2] ?? '').trim().toLowerCase();
    return { name, qualifier, items: itemsOf(name, match[3] ?? '') };
}

/**
 * The card size of one kind (plan line 963): the sound, symbol, and frame cards are A5; the
 * picture, sound-picture, family-picture, tricky-word, word, and letter cards are A6.
 * @param kind The kind of the card.
 * @returns The size, `A5` or `A6`.
 */
export function storytimeCardSize(kind: StorytimeCardKind): StorytimeCardSize {
    return CARD_SIZES[kind];
}

/**
 * The n-up plan of one card size (plan line 964): the A5 sheet is A4 landscape and holds 2 cards,
 * the A6 sheet is A4 portrait and holds 4. A sheet holds a whole number of cards, so the last
 * sheet of a size can hold empty places.
 * @param cards The cards of the kit; the plan counts the cards of `size` only.
 * @param size The card size of the plan.
 * @returns The plan: the cards of the size, the sheets, and the sheet in millimeters.
 */
export function storytimeCardPagePlan(cards: StorytimeCard[], size: StorytimeCardSize): StorytimeCardPagePlan {
    const plan = CARD_SHEETS[size];
    const count = cards.filter((card) => card.size === size).length;
    return {
        size,
        perSheet: plan.perSheet,
        cards: count,
        sheets: Math.ceil(count / plan.perSheet),
        sheet: { ...plan.sheet },
    };
}

/** A list of labels with a seen set, so that a repeated label of one kind adds one card. */
interface LabelList {
    labels: string[];
    seen: Set<string>;
}

/**
 * Adds a label to one kind of the kit, once. A label that the kind already holds is skipped, so a
 * week that repeats a card of an earlier week adds no second card.
 * @param lists The lists of the kit, by kind.
 * @param kind The kind of the card.
 * @param label The label of the card.
 */
function addLabel(lists: Map<StorytimeCardKind, LabelList>, kind: StorytimeCardKind, label: string): void {
    const list = lists.get(kind) ?? { labels: [], seen: new Set<string>() };
    const key = label.toLowerCase();
    if (list.seen.has(key)) return;
    list.seen.add(key);
    list.labels.push(label);
    lists.set(kind, list);
}

/**
 * The unit teaching order of the letters (plan line 955): the graphemes of the teaching weeks, in
 * week order. Unit 1 gives `n, a, p, m, s, t, o`.
 * @param teaching The teaching weeks, in week order.
 * @returns The letters, each once, in the order that the weeks teach them.
 */
function teachingOrderOf(teaching: StorytimeWeek[]): string[] {
    const order: string[] = [];
    for (const week of teaching) {
        for (const grapheme of week.focus.element?.graphemes ?? []) {
            if (!order.includes(grapheme)) order.push(grapheme);
        }
    }
    return order;
}

/**
 * The kit of one unit (plan lines 950 to 965). The function is pure: it reads the parsed weeks and
 * no file.
 * @param weeks The parsed weeks of one unit, in week order; the review week supplies the letter
 *   strip. A week file with a `materials` line that this module does not know is ignored.
 * @returns The cards, the kit items, and the letter strip.
 */
export function storytimeCardKit(weeks: StorytimeWeek[]): StorytimeCardKit {
    const ordered = [...weeks].sort((a, b) => a.meta.week - b.meta.week);
    const teaching = ordered.filter((week) => week.meta.kind === 'teach');
    const lists = new Map<StorytimeCardKind, LabelList>();
    /** The letters of the `sound cards` lines. */
    const soundLetters = new Set<string>();
    /** The highest count of each letter in one `letter cards (class set)` line. */
    const letterCounts = new Map<string, number>();
    /** The sorting mats and the stickers, with the week that names them. */
    const mats: { label: string; week: number }[] = [];
    const stickers: { label: string; week: number }[] = [];

    for (const week of ordered) {
        for (const script of week.scripts) {
            for (const step of script.steps) {
                for (const line of step.materials) {
                    const parsed = materialsLineOf(line);
                    if (!parsed) continue;
                    const weekNumber = week.meta.week;
                    switch (parsed.name) {
                        case 'picture cards':
                            for (const item of parsed.items) addLabel(lists, 'picture', item);
                            break;
                        case 'sound picture cards':
                            for (const item of parsed.items) addLabel(lists, 'sound-picture', item);
                            break;
                        case 'family picture cards':
                            for (const item of parsed.items) addLabel(lists, 'family-picture', item);
                            break;
                        case 'sound card':
                        case 'sound cards':
                            for (const item of parsed.items) soundLetters.add(item);
                            break;
                        case 'tricky word card':
                        case 'tricky word cards':
                            for (const item of parsed.items) addLabel(lists, 'tricky-word', item);
                            break;
                        case 'word card':
                        case 'word cards':
                            for (const item of parsed.items) addLabel(lists, 'word', item);
                            break;
                        case 'letter card':
                        case 'letter cards':
                            // A class-set line is the child set; a line without the qualifier names the
                            // letters that the sound cards already carry (plan line 957).
                            if (parsed.qualifier.includes('class set')) {
                                for (const letter of parsed.items) {
                                    const count = parsed.items.filter((item) => item === letter).length;
                                    letterCounts.set(letter, Math.max(letterCounts.get(letter) ?? 0, count));
                                }
                            }
                            break;
                        case 'sorting mat':
                        case 'sorting mats':
                            for (const item of parsed.items) mats.push({ label: item, week: weekNumber });
                            break;
                        case 'sticker':
                        case 'stickers':
                            for (const item of parsed.items) stickers.push({ label: item, week: weekNumber });
                            break;
                        default:
                            // A materials line that names no card: books, crayons, the board, a tablet.
                            break;
                    }
                }
            }
        }
    }

    // The sound cards and the letter cards stand in the teaching order (plan line 955). A letter
    // that the teaching order does not hold keeps its first-seen place after the taught letters.
    const order = teachingOrderOf(teaching);
    const extra = [...soundLetters].filter((letter) => !order.includes(letter));
    const soundCards = [...order.filter((letter) => soundLetters.has(letter)), ...extra];
    for (const letter of soundCards) addLabel(lists, 'sound', letter);
    for (const letter of [...letterCounts.keys()].filter((key) => !order.includes(key))) order.push(letter);
    const letterCards = order.flatMap((letter) => Array.from({ length: letterCounts.get(letter) ?? 0 }, () => letter));
    lists.set('letter', { labels: letterCards, seen: new Set(letterCards.map((label) => label.toLowerCase())) });

    for (const week of teaching) addLabel(lists, 'frame', week.focus.frame);

    const cards: StorytimeCard[] = [];
    for (const kind of CARD_KIND_ORDER) {
        for (const label of lists.get(kind)?.labels ?? []) {
            cards.push({ kind, label, size: storytimeCardSize(kind), classSet: kind === 'letter' });
        }
    }

    const items: StorytimeKitItem[] = [];
    for (const week of teaching) {
        items.push({ kind: 'workmat', label: 'workmat', week: week.meta.week, classSet: true });
    }
    for (const week of teaching) {
        items.push({ kind: 'word-wall', label: 'word wall', week: week.meta.week, classSet: false });
    }
    const matSeen = new Set<string>();
    for (const mat of mats) {
        const key = mat.label.toLowerCase();
        if (matSeen.has(key)) continue;
        matSeen.add(key);
        items.push({ kind: 'sorting-mat', label: mat.label, week: mat.week, classSet: false });
    }
    const stickerSeen = new Set<string>();
    for (const sticker of stickers) {
        const key = sticker.label.toLowerCase();
        if (stickerSeen.has(key)) continue;
        stickerSeen.add(key);
        items.push({ kind: 'sticker', label: sticker.label, week: sticker.week, classSet: false });
    }

    let letterStrip: string[] = [];
    for (const week of ordered) {
        const letters = week.benchmark?.oneToOne.letters;
        if (letters?.length) letterStrip = [...letters];
    }

    return { cards, items, letterStrip };
}

/** A picture match: the row, and the case of the rule that found it (the PM rule of 2026-11-05). */
interface CardPictureMatch {
    /** The matched row, or undefined when the card has no picture. */
    row?: StorytimePictureRow;
    /** `text` for a card row or case a, `page` for case b, `none` when no row matches. */
    how: 'text' | 'page' | 'none';
}

/**
 * The picture match of one card (the PM match rule of 2026-11-05, extended by Phase 8): the card
 * row first, then case a, then case b, then the earliest week, then the list order. See
 * `storytimeCardPictureRow`.
 * @param card The card.
 * @param rows The rows of the picture list of the level.
 * @param delivered The row ids whose color and line-art files are both delivered.
 * @returns The matched row and the case, or `none`.
 */
function cardPictureMatch(
    card: StorytimeCard,
    rows: StorytimePictureRow[],
    delivered: ReadonlySet<string>,
): CardPictureMatch {
    const word = card.label.toLowerCase();
    const earliest = (list: StorytimePictureRow[]) => [...list].sort((a, b) => a.week - b.week)[0];
    // Version 7 of the picture list: a delivered card row of this word wins. The card row carries
    // the prompt of the card file, so the picture shows the card word and not a book scene. An
    // undelivered card row is skipped, so a missing card picture never stops the kit.
    const cardRows = rows.filter((row) =>
        delivered.has(row.id)
        && row.use === 'card'
        && row.text.toLowerCase() === word);
    if (cardRows.length) return { row: earliest(cardRows), how: 'text' };
    const direct = rows.filter((row) =>
        delivered.has(row.id)
        && CARD_PICTURE_TEXT_USES.includes(row.use)
        && row.text.toLowerCase() === word);
    if (direct.length) return { row: earliest(direct), how: 'text' };
    const singular = singularOf(word);
    const pages = rows.filter((row) => {
        if (!delivered.has(row.id) || row.use !== 'story-page') return false;
        const keys = Object.keys(row.objectCounts).filter((key) => (row.objectCounts[key] ?? 0) > 0);
        return keys.length === 1 && (keys[0] === word || keys[0] === singular);
    });
    if (pages.length) return { row: earliest(pages), how: 'page' };
    return { how: 'none' };
}

/**
 * The picture of one card (the PM match rule of 2026-11-05, extended by Phase 8). A card word
 * matches a row of the picture list in three ways:
 *
 * - a `card` row whose text is the card word, in lower case (version 7 of the list);
 * - case a: a `check-row`, `practice-line`, or `d4-prompt` row whose text is the card word, in
 *   lower case;
 * - case b: a `story-page` row whose object counts hold exactly one key above 0, and that key is
 *   the card word or its singular (`arms` to `arm`, `feet` to `foot`).
 *
 * A row counts only when both its color and its line-art file are delivered, so the caller passes
 * the delivered row ids. The card row wins over case a and case b; case a wins over case b. Then
 * the earliest week wins, then the list order. An undelivered card row is skipped and never an
 * error, so a level before the Forge delivery prints the book picture.
 * The 8 color words and the numbers one to nine follow the same rule until Daniel answers the ink
 * question.
 * @param card The card.
 * @param rows The rows of the picture list of the level.
 * @param delivered The row ids whose color and line-art files are both delivered.
 * @returns The matched row, or undefined when the card has no picture.
 */
export function storytimeCardPictureRow(
    card: StorytimeCard,
    rows: StorytimePictureRow[],
    delivered: ReadonlySet<string>,
): StorytimePictureRow | undefined {
    return cardPictureMatch(card, rows, delivered).row;
}

/**
 * The match result of every picture-type card, one line for each card: the kind, the label, the
 * matched row id or `none`, and the fourth column. A color word card names the source `patch`, and
 * a number word card names the source `dots`, in the third and the fourth column, because neither
 * card prints a picture row (owner decision, Daniel, PM relay, 2026-11-06). A matched line names
 * its case (`text` or `page`); an unmatched line names its reason (`none: no row`, `none: files not
 * delivered`, or the message of the failed file check, Review B, B-P8-3). The file
 * `<out>/card-picture-match.txt` holds exactly these lines, so a count of the lines is the count of
 * the picture-type cards. The label of a card holds one line and four columns, because each run of
 * white space and of the control characters becomes one space (X-P8-15).
 * @param cards The cards of the kit.
 * @param rows The rows of the picture list of the level.
 * @param delivered The row ids whose color and line-art files are both delivered.
 * @param reasons The bare message of each row whose file check failed, by row id.
 * @returns One line for each picture-type card, in kit order.
 */
export function storytimeCardPictureMatchLines(
    cards: StorytimeCard[],
    rows: StorytimePictureRow[],
    delivered: ReadonlySet<string>,
    reasons: ReadonlyMap<string, string> = new Map(),
): string[] {
    const all = new Set(rows.map((row) => row.id));
    return cards
        .filter((card) => STORYTIME_CARD_PICTURE_KINDS.includes(card.kind))
        .map((card) => {
            const label = matchLabel(card.label);
            const special = cardSpecialSource(card);
            if (special) return `${card.kind}\t${label}\t${special}\t${special}`;
            const match = cardPictureMatch(card, rows, delivered);
            if (match.row) return `${card.kind}\t${label}\t${match.row.id}\t${match.how}`;
            // The row the card would match when every file were in place tells the two reasons
            // apart: a missing row, or a row whose files are not delivered.
            const candidate = cardPictureMatch(card, rows, all).row;
            const reason = candidate
                ? `none: ${matchReason(reasons.get(candidate.id) ?? 'files not delivered')}`
                : 'none: no row';
            return `${card.kind}\t${label}\tnone\t${reason}`;
        });
}

/** The row ids of the delivered pictures, the color file of each, and the message of each failed row. */
export interface DeliveredPictures {
    /** The row ids whose color and line-art files both resolve. */
    delivered: Set<string>;
    /** The color file of each delivered row. */
    files: Map<string, string>;
    /** The message of the failed file check of a row, by row id. */
    reasons: Map<string, string>;
}

/**
 * The delivered rows of the picture list: the rows whose color file and line-art file both resolve
 * through `manifest.json`. The whole list resolves in one call when every file is in place; a
 * missing file falls back to a row-by-row probe, so one missing picture does not hide the rest. A
 * row whose check fails keeps its message, so that the match report can say why (Review B, B-P8-3).
 * @param folder The picture folder of the level.
 * @param rows The rows of the picture list.
 * @returns The delivered row ids, the color file of each, and the reason of each failed row.
 */
export function storytimeDeliveredPictures(folder: string, rows: StorytimePictureRow[]): DeliveredPictures {
    const files = new Map<string, string>();
    const reasons = new Map<string, string>();
    try {
        for (const entry of resolveStorytimePictureFiles(folder, rows, 'color')) files.set(entry.rowId, entry.file);
        resolveStorytimePictureFiles(folder, rows, 'line');
        return { delivered: new Set(files.keys()), files, reasons };
    } catch {
        files.clear();
    }
    for (const row of rows) {
        try {
            const [color] = resolveStorytimePictureFiles(folder, [row], 'color');
            resolveStorytimePictureFiles(folder, [row], 'line');
            files.set(row.id, color.file);
        } catch (error) {
            // The row is not delivered; its card prints an empty, labelled picture box, and the
            // match report names the reason of the failed check.
            reasons.set(row.id, error instanceof Error ? error.message : String(error));
        }
    }
    return { delivered: new Set(files.keys()), files, reasons };
}

/**
 * The source of one line of the match report: the picture of a card row, a color patch, a number
 * dot group, or no picture. The third column names the source. When that column says `none`, the
 * fourth column names the source or the reason of the missing picture. A line with fewer than
 * three columns names no source, so the source of that line is `none`. A third column of white
 * space names no row either, because a row id holds no white space (X-P8-14).
 * @param line One line of the match report.
 * @returns The source of the line.
 */
export function storytimeCardMatchSource(line: string): 'picture' | 'patch' | 'dots' | 'none' {
    const fields = line.split('\t');
    const third = fields[2] ?? '';
    const fourth = fields[3] ?? '';
    if (third.trim() === '') return 'none';
    if (third === 'patch' || fourth === 'patch') return 'patch';
    if (third === 'dots' || fourth === 'dots') return 'dots';
    return third === 'none' ? 'none' : 'picture';
}

/**
 * The counts of the match report by source: the picture matches, the color patches, the number dot
 * groups, and the cards with no picture. The count of a line comes from its source, so the four
 * numbers add up to the number of lines. A line with fewer than three columns counts as `none`.
 * @param lines The lines of the match report.
 * @returns The count of each source.
 */
export function storytimeCardMatchCounts(lines: readonly string[]): { picture: number; patch: number; dots: number; none: number } {
    const counts = { picture: 0, patch: 0, dots: 0, none: 0 };
    for (const line of lines) counts[storytimeCardMatchSource(line)] += 1;
    return counts;
}

/** The longest reason clause of the match report, in characters (Review B, B-P8-6). */
const MATCH_REASON_MAX = 160;

/**
 * The path masks of the reason column, longest path first, so that a nested path keeps the
 * shortest name (Review B, B-P8-6). The repo root becomes `<repo>`, the home folder `~`, and the
 * OS temp folder `<tmp>`. Each root also stands as its resolved path when a symbolic link gives a
 * different one, so a reason that names the resolved path is masked too (Review B, B-P8-8). A root
 * whose resolved path equals the plain path, or does not resolve, adds no mask.
 * @returns The source and the replacement of each mask, longest source first.
 */
function reasonMasks(): [string, string][] {
    const roots: [string, string][] = [
        [REPO_ROOT, '<repo>'],
        [os.homedir(), '~'],
        [os.tmpdir(), '<tmp>'],
    ];
    const masks = roots.map(([from, to]): [string, string] => [from.replace(/[\\/]+$/, ''), to]);
    for (const [from, to] of [...masks]) {
        let resolved: string;
        try {
            resolved = fs.realpathSync(from).replace(/[\\/]+$/, '');
        } catch {
            continue; // A root that does not resolve keeps its plain mask only.
        }
        if (resolved.length > 0 && !masks.some(([known]) => known === resolved)) masks.push([resolved, to]);
    }
    return masks
        .filter(([from]) => from.length > 0)
        .sort((a, b) => b[0].length - a[0].length);
}

/**
 * The label of one card in the match report. The report holds one line for each card and four tab
 * columns on each line, so each run of white space and of the control characters (C0, DEL, C1) in
 * the label becomes one space: a label with a tab or a line break never adds a column or a line to
 * the report (X-P8-15). The label keeps its padding, so a card of a padded label still names no
 * row.
 * @param label The label of the card.
 * @returns The one-line label of the match report.
 */
function matchLabel(label: string): string {
    return label.replace(/[\s\u0000-\u001f\u007f-\u009f]+/g, ' ');
}

/**
 * The reason text of one unmatched card. The report holds one line for each card, so each run of
 * white space and of the control characters (C0, DEL, C1) becomes one space: a line break, a tab,
 * or a terminal escape of a file name never reaches the reader (Review B, B-P8-6, B-P8-8). A mask
 * of `reasonMasks` then replaces each of the three roots and their resolved paths. A path outside
 * those roots stays in the reason, because the report is a local file that holds no secret. A text
 * longer than `MATCH_REASON_MAX` keeps its first characters and ends with `...`.
 * @param text The bare message of the failed file check.
 * @returns The one-line, masked, capped reason.
 */
function matchReason(text: string): string {
    let reason = text.replace(/[\s\u0000-\u001f\u007f-\u009f]+/g, ' ').trim();
    for (const [from, to] of reasonMasks()) reason = reason.split(from).join(to);
    if (reason.length > MATCH_REASON_MAX) reason = `${reason.slice(0, MATCH_REASON_MAX - 3)}...`;
    return reason;
}

/** The HTML escape of the card text. */
const esc = (text: string): string =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The millimeters of an HTML style value, with at most three decimals. */
const mm = (value: number): string => String(Number(value.toFixed(3)));

/** The safe margin of a card, in millimeters, so that the cut line never touches the text. */
const CARD_SAFE_MM = 4;

/** The point size of one millimeter at 72 points per inch. */
const PT_PER_MM = 72 / 25.4;

/**
 * The type size of a card label: the largest size that fits the label on one line inside the safe
 * area of the card, with a cap that keeps a short label inside the card height.
 * @param text The label.
 * @param cellWidthMm The width of the card cell, in millimeters.
 * @param bold True for a bold label, which needs more room for each character.
 * @param capPt The largest type size of the card size.
 * @returns The type size, in points, from 12 to the cap.
 */
function labelPt(text: string, cellWidthMm: number, bold: boolean, capPt: number): number {
    const available = (cellWidthMm - 2 * CARD_SAFE_MM) * PT_PER_MM;
    const widthPerCharacter = bold ? 0.7 : 0.6;
    const fit = available / Math.max(1, text.length * widthPerCharacter);
    return Math.max(12, Math.min(capPt, Math.floor(fit)));
}

/** The largest label type of each card size, in points. */
const LABEL_CAP_PT: Record<StorytimeCardSize, number> = { A5: 220, A6: 130 };

/** The options of one card sheet document. */
export interface StorytimeCardSheetOptions {
    /** The absolute picture file of a card, or undefined for an empty, labelled picture box. */
    pictureOf?: (card: StorytimeCard) => string | undefined;
    /** The document title; the default names the size. */
    title?: string;
}

/** The corner radius of a color patch, in millimeters. */
const CARD_PATCH_RADIUS_MM = 6;

/**
 * The picture area of a color word card: a rounded rectangle of the approved sRGB value that fills
 * the area. The `data-card-patch` value is the card word, so the report and the check can find it.
 * The `data-shape` value is `rounded-rectangle`, because the patch fills the picture area, which is
 * taller than it is wide (A-P8-11).
 * @param word The card word in lower case.
 * @returns The HTML of the picture area.
 */
function colorPatchBox(word: string): string {
    const hex = STORYTIME_CARD_COLOR_PATCH[word];
    return `<div class="card-picture card-patch-picture"><div class="card-color-patch" data-card-patch="${esc(word)}" data-shape="rounded-rectangle" data-color="${hex}" style="background-color:${hex};width:100%;height:100%;align-self:stretch;border-radius:${CARD_PATCH_RADIUS_MM}mm"></div></div>`;
}

/**
 * The picture area of a number word card: the numeral and exactly its number of round dots. The
 * dots sit in one or two rows, with at most five dots in a row. A dot is an SVG circle, so it stays
 * round at any printed size.
 * @param word The card word in lower case.
 * @returns The HTML of the picture area.
 */
function numberDotsBox(word: string): string {
    const count = STORYTIME_CARD_NUMBER_DOTS[word];
    const rows = Math.ceil(count / CARD_NUMBER_DOT_ROW_MAX);
    const radius = 7;
    const gap = 4;
    const rowHeight = 22;
    const width = 100;
    const dots: string[] = [];
    for (let row = 0; row < rows; row++) {
        const inRow = Math.min(CARD_NUMBER_DOT_ROW_MAX, count - row * CARD_NUMBER_DOT_ROW_MAX);
        const rowWidth = inRow * 2 * radius + (inRow - 1) * gap;
        for (let index = 0; index < inRow; index++) {
            const cx = (width - rowWidth) / 2 + radius + index * (2 * radius + gap);
            const cy = radius + 4 + row * rowHeight;
            dots.push(`<circle data-number-dot="1" data-row="${row}" cx="${mm(cx)}" cy="${mm(cy)}" r="${radius}"/>`);
        }
    }
    return `<div class="card-picture card-number-picture"><div class="card-number" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3mm"><div class="card-numeral" data-card-numeral style="font-size:60pt;line-height:1;font-weight:700">${count}</div><svg class="card-number-dots" viewBox="0 0 ${width} ${rows * rowHeight}" style="width:100%;height:auto;max-height:50%" aria-hidden="true">${dots.join('')}</svg></div></div>`;
}

/**
 * The body of one card: the label alone, the label and a color patch, the label and the numeral
 * with dots, or the label and its picture box.
 * @param card The card.
 * @param cellWidthMm The width of the card cell, in millimeters.
 * @param size The card size of the sheet.
 * @param picture The absolute picture file of the card, when the card prints a picture.
 * @returns The HTML of the card body.
 */
function cardBody(card: StorytimeCard, cellWidthMm: number, size: StorytimeCardSize, picture?: string): string {
    const cap = LABEL_CAP_PT[size];
    if (!STORYTIME_CARD_PICTURE_KINDS.includes(card.kind)) {
        const bold = card.kind !== 'frame';
        return `<div class="card-letter"${bold ? ' data-bold="1"' : ''} style="font-size:${labelPt(card.label, cellWidthMm, bold, cap)}pt">${esc(card.label)}</div>`;
    }
    const label = `<div class="card-label" style="font-size:${labelPt(card.label, cellWidthMm, true, 40)}pt">${esc(card.label)}</div>`;
    const special = cardSpecialSource(card);
    if (special === 'patch') return label + colorPatchBox(card.label.toLowerCase());
    if (special === 'dots') return label + numberDotsBox(card.label.toLowerCase());
    const box = picture
        ? `<div class="card-picture"><img src="${esc(pathToFileURL(picture).href)}" alt=""></div>`
        : `<div class="card-picture card-picture-empty"><span>${esc(card.label)}</span></div>`;
    return label + box;
}

/** The CSS of one card sheet document. */
function cardSheetCss(size: StorytimeCardSize): string {
    const { widthMm, heightMm } = CARD_SHEETS[size].sheet;
    return `${fontFaceCss()}
@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Andika', sans-serif; font-weight: 400; color: #000; background: #fff; }
.sheet { width: ${widthMm}mm; height: ${heightMm - 0.5}mm; position: relative; overflow: hidden; break-after: page; page-break-after: always; }
.sheet:last-of-type { break-after: auto; page-break-after: auto; }
.cut { position: absolute; background: #000; }
.card { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: ${CARD_SAFE_MM}mm; overflow: hidden; }
.card-letter { text-align: center; white-space: nowrap; line-height: 1; }
.card-letter[data-bold] { font-weight: 700; }
.card-label { flex: none; text-align: center; white-space: nowrap; line-height: 1; font-weight: 700; }
.card-picture { flex: 1; width: 100%; min-height: 0; margin-top: 3mm; display: flex; align-items: center; justify-content: center; }
.card-picture img { max-width: 100%; max-height: 100%; width: auto; height: auto; }
.card-picture-empty { border: 0.4mm dashed #000; }
.card-picture-empty span { font-size: 9pt; }
`;
}

/**
 * The HTML document of one card size: the cards n-up on A4 sheets, with a cut line on each
 * internal sheet boundary. The card fills its cell, so the cut line gives the true card size; the
 * card keeps a 4 mm safe margin, so the cut line lands in blank paper.
 * @param cards The cards of the kit; the document holds the cards of `size` only.
 * @param size The card size of the document.
 * @param options The picture of a card and the document title.
 * @returns The HTML, and the number of sheets (one page each).
 */
export function compileStorytimeCardSheet(
    cards: StorytimeCard[],
    size: StorytimeCardSize,
    options: StorytimeCardSheetOptions = {},
): { html: string; sheets: number } {
    const plan = CARD_SHEETS[size];
    const { widthMm, heightMm } = plan.sheet;
    const columns = 2;
    const rows = size === 'A5' ? 1 : 2;
    const cellWidthMm = widthMm / columns;
    const cellHeightMm = heightMm / rows;
    const ofSize = cards.filter((card) => card.size === size);
    const chunks: StorytimeCard[][] = [];
    for (let index = 0; index < ofSize.length; index += plan.perSheet) {
        chunks.push(ofSize.slice(index, index + plan.perSheet));
    }
    const sheets = chunks.map((chunk, sheetIndex) => {
        const cuts: string[] = [];
        for (let column = 1; column < columns; column++) {
            cuts.push(`<div class="cut" data-cut="vertical" style="left:${mm(column * cellWidthMm)}mm;top:0;width:0.25mm;height:${mm(heightMm - 0.5)}mm"></div>`);
        }
        for (let row = 1; row < rows; row++) {
            cuts.push(`<div class="cut" data-cut="horizontal" style="top:${mm(row * cellHeightMm)}mm;left:0;height:0.25mm;width:${mm(widthMm)}mm"></div>`);
        }
        const cells = chunk.map((card, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const picture = options.pictureOf?.(card);
            return `<div class="card" data-kind="${card.kind}" data-label="${esc(card.label)}" data-class-set="${card.classSet ? '1' : '0'}" style="left:${mm(column * cellWidthMm)}mm;top:${mm(row * cellHeightMm)}mm;width:${mm(cellWidthMm)}mm;height:${mm(cellHeightMm)}mm">${cardBody(card, cellWidthMm, size, picture)}</div>`;
        });
        return `<section class="sheet" data-size="${size}" data-sheet="${sheetIndex + 1}">${cuts.join('')}${cells.join('')}</section>`;
    });
    return {
        html: `<div class="card-kit card-kit-${size}">${sheets.join('\n')}</div>`,
        sheets: sheets.length,
    };
}

/**
 * The HTML document of the card size, with the head of the page: the `@page` rule of the sheet and
 * the faces of the workbook. `compileStorytimeCardSheet` gives the body for this wrapper.
 * @param body The body of `compileStorytimeCardSheet`.
 * @param title The document title.
 * @param size The card size of the body.
 * @returns The whole HTML document.
 */
export function cardSheetDocument(body: string, title: string, size: StorytimeCardSize): string {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
${cardSheetCss(size)}</style></head>
<body>${body}</body></html>`;
}

/** The centre of a sticker picture that no override names. */
export const STORYTIME_STICKER_DEFAULT_CENTRE = '50% 50%';

/**
 * The centre of a sticker picture, by the sticker label (plan line 1088, owner request
 * 2026-11-06). Two entries move a picture, because the cover fit
 * cuts a face: the girl at the left edge of "Can I?" and the doll Pam at the right edge of
 * "Sam and Pam" (orchestrator check of the 300 dpi contact image, 2026-11-06). Every other
 * picture sits at its centre. Add one entry only when the cover fit cuts a title or a face. The
 * value is an `object-position` pair of two percentages, for example `50% 30%`.
 */
export const STORYTIME_STICKER_CENTER_OVERRIDES: Record<string, string> = {
    'Can I?': '30% 50%',
    'Sam and Pam': '70% 50%',
};

/** The shape of a valid centre: two percentages, separated by the white space of CSS. */
const STICKER_CENTRE_PATTERN = /^\d+(\.\d+)?%[ \t\n\f\r]+\d+(\.\d+)?%$/;

/**
 * The centre of the picture of one sticker. The centre map holds the centres by label. A label that
 * the map does not hold as its own key has no centre, so the sticker prints at the default centre.
 * A value whose separator is not the white space of CSS has no centre either, because Chrome
 * ignores such a pair and prints the sticker at the default centre (X-P8-16).
 * @param centres The centre map of the call: the module map, then the caller map.
 * @param label The sticker label.
 * @returns The `object-position` value; the default centre when the map has no valid entry.
 */
function stickerCentre(centres: Record<string, string>, label: string): string {
    if (!Object.hasOwn(centres, label)) return STORYTIME_STICKER_DEFAULT_CENTRE;
    const raw = centres[label];
    if (raw === undefined) return STORYTIME_STICKER_DEFAULT_CENTRE;
    const value = raw.trim();
    return STICKER_CENTRE_PATTERN.test(value) ? value : STORYTIME_STICKER_DEFAULT_CENTRE;
}

/** The options of the sticker sheet document. */
export interface StorytimeStickerSheetOptions {
    /** The absolute picture file of a sticker, or undefined for a sticker of its text only. */
    pictureOf?: (item: StorytimeKitItem) => string | undefined;
    /**
     * The centre of the picture of each sticker, by the sticker label. An entry of this map wins
     * over `STORYTIME_STICKER_CENTER_OVERRIDES`.
     */
    centers?: Record<string, string>;
    /** The document title; the default names the sheet. */
    title?: string;
}

/** The printed text of a sticker: the label with the first letter in upper case (`unit 1` to `Unit 1`). */
export function stickerDisplayLabel(label: string): string {
    return label.charAt(0).toUpperCase() + label.slice(1);
}

/** The CSS of the sticker sheet document. */
function stickerSheetCss(): string {
    const { widthMm, heightMm } = STORYTIME_CARD_KIT_SPEC.sheetMm;
    const diameter = STORYTIME_CARD_KIT_SPEC.stickerDiameterMm;
    return `${fontFaceCss()}
@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Andika', sans-serif; font-weight: 400; color: #000; background: #fff; }
.sheet { width: ${widthMm}mm; height: ${heightMm - 0.5}mm; position: relative; overflow: hidden; break-after: page; page-break-after: auto; }
.sticker { position: absolute; width: ${diameter}mm; height: ${diameter}mm; }
.sticker-art { position: absolute; left: 0; top: 0; width: ${diameter}mm; height: ${diameter}mm; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 1; }
.sticker-art img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sticker-cut { position: absolute; left: 0; top: 0; width: ${diameter}mm; height: ${diameter}mm; z-index: 2; pointer-events: none; }
.sticker-text { font-size: 14pt; font-weight: 700; text-align: center; line-height: 1.1; }
`;
}

/**
 * The HTML document of the sticker sheet (plan line 951, spec FR-7): the round 40 mm stickers on
 * an A4 portrait sheet, four to a row, each with a cut circle. A picture sticker prints its picture
 * over the whole circle: a cover fit, a clip to the circle, and the cut line above the picture
 * (owner request 2026-11-06). A sticker without a picture prints its text (`Unit 1`).
 * @param items The kit items; the document holds the stickers only.
 * @param options The picture of a sticker, the centre of a sticker picture, and the document title.
 * @returns The HTML, and the number of sheets (one page each).
 */
export function compileStorytimeStickerSheet(
    items: StorytimeKitItem[],
    options: StorytimeStickerSheetOptions = {},
): { html: string; sheets: number } {
    const { widthMm, heightMm } = STORYTIME_CARD_KIT_SPEC.sheetMm;
    const diameter = STORYTIME_CARD_KIT_SPEC.stickerDiameterMm;
    const stickers = items.filter((item) => item.kind === 'sticker');
    const centres: Record<string, string> = { ...STORYTIME_STICKER_CENTER_OVERRIDES, ...(options.centers ?? {}) };
    const columns = 4;
    const gutterMm = 6;
    const rows = Math.max(1, Math.ceil(stickers.length / columns));
    const gridWidth = columns * diameter + (columns - 1) * gutterMm;
    const gridHeight = rows * diameter + (rows - 1) * gutterMm;
    const leftMm = (widthMm - gridWidth) / 2;
    const topMm = (heightMm - gridHeight) / 2;
    const cells = stickers.map((item, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const picture = options.pictureOf?.(item);
        const art = picture
            ? `<img src="${esc(pathToFileURL(picture).href)}" alt="" style="object-position:${esc(stickerCentre(centres, item.label))}">`
            : `<span class="sticker-text">${esc(stickerDisplayLabel(item.label))}</span>`;
        const cut = '<svg class="sticker-cut" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="99" fill="none" stroke="#000" stroke-width="1"/></svg>';
        return `<div class="sticker" data-label="${esc(item.label)}" style="left:${mm(leftMm + column * (diameter + gutterMm))}mm;top:${mm(topMm + row * (diameter + gutterMm))}mm">${cut}<div class="sticker-art">${art}</div></div>`;
    });
    const body = `<section class="sheet" data-sheet="1">${cells.join('')}</section>`;
    const title = options.title ?? 'Storytime Advantage Card Kit, sticker sheet';
    return {
        html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
${stickerSheetCss()}</style></head>
<body><div class="sticker-kit">${body}</div></body></html>`,
        sheets: 1,
    };
}
