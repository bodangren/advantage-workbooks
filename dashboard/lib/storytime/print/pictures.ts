import type { StorytimeCheckItem, StorytimeWeek } from '../schema';

/** What a print picture is for; the size class follows the use (FR-9). */
export type StorytimePictureUse = 'story-page' | 'cover' | 'check-row' | 'practice-line' | 'card' | 'sticker';

/** One row of the picture list that Forge renders from (FR-2.2). */
export interface StorytimePictureRow {
    /** The unique row id; Forge's `manifest.json` uses it as the key (FR-9). */
    id: string;
    /** The week that needs the picture. */
    week: number;
    use: StorytimePictureUse;
    /** The text that the picture must show: the page text, or the picture word. */
    text: string;
    /** The picture prompt of the source page, or an empty string. */
    prompt: string;
    /** The picture caption of the source page, or an empty string. */
    caption: string;
    /** The objects that the text names, with their counts (rule 9.2). */
    objectCounts: Record<string, number>;
    /** The FR-9 class: A story pages, B covers, C picture words. */
    sizeClass: 'A' | 'B' | 'C';
    /** The file name with the version (`l2-w01-story-page-a-nest-v1.png`, rule 12.2). */
    fileName: string;
    /** The line-art file name of FR-9: the color name with `-line` before the version. */
    lineArtFileName: string;
    /** The pixel width of the FR-9 size class; the line art shares it. */
    width: number;
    /** The pixel height of the FR-9 size class; the line art shares it. */
    height: number;
}

/**
 * The picture spec for Forge, version 1 (FR-9, 2026-10-25): the pixel size of each size class.
 * Class A is a story page, class B a cover, class C a picture word. Each class gives one color
 * output and one line-art output at the same pixel size.
 */
export const STORYTIME_PICTURE_SPEC: Record<'A' | 'B' | 'C', { width: number; height: number }> = {
    A: { width: 4000, height: 3000 },
    B: { width: 4000, height: 3000 },
    C: { width: 1500, height: 1500 },
};

/** The FR-9 size class of each use. */
export const STORYTIME_SIZE_CLASS: Record<StorytimePictureUse, 'A' | 'B' | 'C'> = {
    'story-page': 'A',
    cover: 'B',
    'check-row': 'C',
    'practice-line': 'C',
    card: 'C',
    sticker: 'C',
};

/**
 * The list version of the picture list (FR-2, strategy 4.14 rule 12.2). Version 3 adds the
 * object counts of the counting book, the negation and non-object rules, the singular keys,
 * and the `-b` duplicate suffixes. A change of the names or of the counts needs a new version.
 */
export const STORYTIME_PICTURE_LIST_VERSION = 3;

/** Lower case, letters and digits only; the base of a file name slug. */
const stem = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** The words of a text, lower case. */
const wordsOf = (s: string): string[] => stem(s).split(' ').filter(Boolean);

/** The file name says what the picture shows: the words of the text, hyphen joined. */
const slugOf = (text: string) => wordsOf(text).join('-') || 'picture';

/** The number words that a page text can use for an object count. */
const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

/** Nouns that name an action or a state, not a thing that a picture can show; they get no count. */
const NON_OBJECT_NOUNS = new Set(['nap']);

/**
 * The singular of a count noun: a simple final-s rule, enough for the early-decoder words.
 * Words that end in `us` or `ss` keep their form (`bus`, `octopus`), and the irregular
 * plurals of the early-decoder words map to their singular key (`feet` to `foot`).
 */
const singularOf = (word: string) => {
    const irregular: Record<string, string> = { feet: 'foot' };
    if (irregular[word]) return irregular[word];
    if (!word.endsWith('s') || word.endsWith('ss') || word.endsWith('us')) return word;
    return word.slice(0, -1);
};

/**
 * The objects that a page text names, with their counts (rule 9.2): a noun after an article is
 * one object, a noun after a number word is that many, and a plural noun after `how many` takes
 * the number word of the answer (`How many suns? One!` means one sun). A negated question
 * (`Is it a ball? No!`) names no object, and a non-object noun (`nap`) gets no count. The
 * picture prompt is not a source — "A nest." means one nest, not the three eggs of the prompt.
 * @param text The page text.
 * @returns The counts, with only keys of 1 or more.
 */
export function pictureObjectCounts(text: string): Record<string, number> {
    const counts: Record<string, number> = {};
    const words = wordsOf(text);
    words.forEach((word, i) => {
        const before = i > 0 ? words[i - 1] : '';
        const after = i + 1 < words.length ? words[i + 1] : '';
        const askMany = before === 'many' && i > 1 && words[i - 2] === 'how';
        const articleCount = /^(a|an|the)$/.test(before) && after !== 'no';
        const numberCount = NUMBER_WORDS[before];
        if (askMany) {
            const answer = words.slice(i + 1).find((w) => NUMBER_WORDS[w] !== undefined);
            if (answer === undefined || NON_OBJECT_NOUNS.has(word)) return;
            const noun = singularOf(word);
            counts[noun] = (counts[noun] ?? 0) + NUMBER_WORDS[answer];
        } else if ((articleCount || numberCount) && !NON_OBJECT_NOUNS.has(word)) {
            const noun = singularOf(word);
            counts[noun] = (counts[noun] ?? 0) + (numberCount || 1);
        }
    });
    return counts;
}

/** The picture words of a check item, in data order; the write items name no picture. */
const itemPictures = (item: StorytimeCheckItem): string[] =>
    item.kind === 'circle-picture' ? item.pictures : item.kind === 'picture-sort' ? item.groups.flatMap((g) => g.pictures) : [];

/** The line-art name of FR-9: the color name with `-line` before the version. */
const lineArtNameOf = (fileName: string) => fileName.replace(/-v(\d+)\.png$/, '-line-v$1.png');

/**
 * The picture list of the given weeks (FR-2): the story pages and covers of the books, the
 * picture words of the Friday check rows, and the practice-line picture words of the weeks with
 * a `print` block. The card and sticker rows come with the card kit (Phase 8). Ids and file
 * names are unique across the level; a repeated slug gets a letter suffix from `-b` through
 * `-z`, and a 27th occurrence throws, because the file name carries no digits between the week
 * and the version (FR-2.3). A color or line-art
 * name that another row already holds throws with both row ids (F13): a silent duplicate would
 * make Forge render two pictures into one file.
 * @param weeks The parsed weeks of one level, in week order.
 * @returns The rows in week and data order.
 */
export function storytimePrintPictures(weeks: StorytimeWeek[]): StorytimePictureRow[] {
    const rows: StorytimePictureRow[] = [];
    const used = new Set<string>();
    const names = new Map<string, string>();
    const add = (week: StorytimeWeek, use: StorytimePictureUse, text: string, prompt: string, caption: string, objectCounts: Record<string, number>) => {
        const base = `l${week.meta.level}-w${String(week.meta.week).padStart(2, '0')}-${use}-${slugOf(text)}`;
        let id = base;
        if (used.has(id)) {
            for (let code = 98; code <= 122; code++) {
                const candidate = `${base}-${String.fromCharCode(code)}`;
                if (!used.has(candidate)) {
                    id = candidate;
                    break;
                }
            }
            if (id === base) throw new Error(`picture id repeat limit: "${base}" occurs more than 26 times and no suffix from -b to -z is free`);
        }
        used.add(id);
        const size = STORYTIME_PICTURE_SPEC[STORYTIME_SIZE_CLASS[use]];
        const fileName = `${id}-v1.png`;
        const lineArtFileName = lineArtNameOf(fileName);
        for (const name of [fileName, lineArtFileName]) {
            const other = names.get(name);
            if (other && other !== id) throw new Error(`picture file name collision: "${name}" belongs to both ${other} and ${id}`);
            names.set(name, id);
        }
        rows.push({ id, week: week.meta.week, use, text, prompt, caption, objectCounts, sizeClass: STORYTIME_SIZE_CLASS[use], fileName, lineArtFileName, width: size.width, height: size.height });
    };
    for (const week of weeks) {
        for (const book of week.books) {
            for (const page of book.pages) add(week, 'story-page', page.text, page.image?.prompt ?? '', page.image?.caption ?? '', pictureObjectCounts(page.text));
            add(week, 'cover', book.title, book.cover?.prompt ?? '', book.cover?.caption ?? '', {});
        }
        for (const item of week.check.items) for (const pic of itemPictures(item)) add(week, 'check-row', pic, '', '', { [pic]: 1 });
        for (const line of week.print?.practice ?? []) add(week, 'practice-line', line.pictureWord, '', '', { [line.pictureWord]: 1 });
    }
    return rows;
}

/**
 * The readable copy of the picture list (`pictures.md`, FR-2.1): one table per week, with the
 * file name, the line-art file name, the pixel size, the use, the text, and the object counts.
 * The header carries `STORYTIME_PICTURE_LIST_VERSION` and the `level` argument as the level; a
 * version change comes from the constant, not from a new literal here. The picture
 * prompt stays in `pictures.json`.
 * @param rows The rows of `storytimePrintPictures`.
 * @param level The level of the list.
 * @returns The markdown page.
 */
export function pictureListMarkdown(rows: StorytimePictureRow[], level: number): string {
    const out: string[] = [`# Storytime Advantage — print picture list (Level ${level})`, '', `Version ${STORYTIME_PICTURE_LIST_VERSION} (FR-2, FR-9). \`pictures.json\` is the machine list; this page is the readable copy.`, ''];
    const byWeek = new Map<number, StorytimePictureRow[]>();
    for (const row of rows) {
        const list = byWeek.get(row.week) ?? [];
        list.push(row);
        byWeek.set(row.week, list);
    }
    for (const [week, list] of [...byWeek.entries()].sort((a, b) => a[0] - b[0])) {
        out.push(`## Week ${week}`, '', '| File | Line art | Pixels | Use | Text | Class | Objects |', '|---|---|---|---|---|---|---|');
        for (const row of list) {
            const objects = Object.entries(row.objectCounts).map(([k, v]) => `${k} ${v}`).join(', ') || '—';
            out.push(`| ${row.fileName} | ${row.lineArtFileName} | ${row.width} × ${row.height} | ${row.use} | ${row.text} | ${row.sizeClass} | ${objects} |`);
        }
        out.push('');
    }
    return out.join('\n');
}
