import type { StorytimeCardPictureEntry } from '../files';
import type { StorytimeCheckItem, StorytimeWeek } from '../schema';

/** What a print picture is for; the size class follows the use (FR-9). */
export type StorytimePictureUse = 'story-page' | 'cover' | 'check-row' | 'practice-line' | 'd4-prompt' | 'card' | 'sticker';

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
    'd4-prompt': 'C',
    card: 'C',
    sticker: 'C',
};

/**
 * The list version of the picture list (FR-2, strategy 4.14 rule 12.2). Version 3 adds the
 * object counts of the counting book, the negation and non-object rules, the singular keys,
 * and the `-b` duplicate suffixes. Version 4 adds the picture words of the week 8 review pages
 * and of the Benchmark 1 paper, and reuses the row of a word that weeks 1 to 7 already hold.
 * Version 5 (A-48): the row `l2-w01-practice-line-nut` left the list, because the practice line "and"
 * moved to the tricky-word row; the other row changes of the A-48 batch are in its change list.
 * Version 6 (A-48): the two rows `l2-w05-d4-prompt-face` and `l2-w07-d4-prompt-ball` of the new use `d4-prompt`, the prompt
 * pictures of step D4 in weeks 5 and 7 (the ids are the ids of the Forge files); 196 rows.
 * Version 7 (Phase 8): the 31 card rows of the card kit follow the 196 book rows, so the list holds
 * 227 rows. `storytimeCardPictureRows` builds the card rows from `card-pictures.json`.
 * A change of the names or of the counts needs a new version.
 */
export const STORYTIME_PICTURE_LIST_VERSION = 7;

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
 * plurals of the early-decoder words map to their singular key (`feet` to `foot`). The card kit
 * reads it too, so that a card word matches the object key of a story page (FR-7).
 * @param word The word, in lower case.
 * @returns The singular of the word.
 */
export const singularOf = (word: string) => {
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

/** Matches an exact picture word, or a word within a story-page caption. */
const rowMatchesPictureWord = (row: StorytimePictureRow, pictureWord: string): boolean => {
    const target = pictureWord.toLowerCase();
    if (row.use !== 'story-page') return row.text.toLowerCase() === target;
    const words: string[] = row.text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    return words.includes(target);
};

/** The line-art name of FR-9: the color name with `-line` before the version. */
const lineArtNameOf = (fileName: string) => fileName.replace(/-v(\d+)\.png$/, '-line-v$1.png');

/**
 * The row of an older picture that already covers the prompt picture of step D4, or undefined when the prompt needs its own
 * `d4-prompt` row. A picture covers a prompt only when it shows the thing: a check row or a practice line of this or an
 * earlier week with exactly that picture word (the apple of week 3), or a story page of this week whose text names the word
 * and whose object counts hold it (the ducks of week 2, the cat of week 6). The story page "Is it a ball? No!" names the
 * word and shows no ball, so the ball of week 7 needs its own row.
 * @param week The week of the prompt.
 * @param pictureWord The prompt picture word of the week.
 * @param rows The rows of the list so far, or the whole list.
 * @returns The covering row, with the rows of this week first.
 */
function promptCoveringRow(week: StorytimeWeek, pictureWord: string, rows: StorytimePictureRow[]): StorytimePictureRow | undefined {
    const target = pictureWord.toLowerCase();
    const covers = rows.filter((row) => row.week <= week.meta.week && (
        (['check-row', 'practice-line'].includes(row.use) && row.text.toLowerCase() === target) ||
        (row.use === 'story-page' && row.week === week.meta.week && rowMatchesPictureWord(row, target) && (row.objectCounts[singularOf(target)] ?? 0) > 0)
    ));
    return covers.find((row) => row.week === week.meta.week) ?? covers[0];
}

/**
 * The picture list of the given weeks (FR-2): the story pages and covers of the books, the
 * picture words of the Friday check rows, the practice-line picture words of the weeks with
 * a `print` block, and the picture words of the review pages and of the benchmark paper of a
 * review week (version 4). A word that an earlier week already has as a check-row row keeps
 * that row: the review page of week 8 reuses the row of weeks 1 to 7 instead of a second file.
 * From week 2, a practice word also reuses a matching story-page, check-row, or practice
 * row from the same or an earlier week. Week 1 keeps its practice-line rows (two since A-48:
 * the practice line "and" moved to the tricky-word row).
 * The function returns the book rows only. The card rows of version 7 come from
 * `storytimeCardPictureRows`, and the writer puts them after these rows. Ids and file
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
    /** The check-row words that the list already holds, so that a review week reuses the row. */
    const checkWords = new Set<string>();
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
        if (use === 'check-row') checkWords.add(text.toLowerCase());
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
    /** The picture words of a review page or of the benchmark paper; a held word keeps its row. */
    const addReused = (week: StorytimeWeek, text: string) => {
        if (checkWords.has(text.toLowerCase())) return;
        add(week, 'check-row', text, '', '', { [text]: 1 });
    };
    for (const week of weeks) {
        for (const book of week.books) {
            for (const page of book.pages) add(week, 'story-page', page.text, page.image?.prompt ?? '', page.image?.caption ?? '', pictureObjectCounts(page.text));
            add(week, 'cover', book.title, book.cover?.prompt ?? '', book.cover?.caption ?? '', {});
        }
        for (const item of week.check.items) for (const pic of itemPictures(item)) add(week, 'check-row', pic, '', '', { [pic]: 1 });
        for (const line of week.print?.practice ?? []) {
            const pictureWord = line.pictureWord.toLowerCase();
            const deliveredRowExists = week.meta.week > 1 && rows.some((row) =>
                row.week <= week.meta.week &&
                ['story-page', 'check-row', 'practice-line'].includes(row.use) &&
                rowMatchesPictureWord(row, pictureWord),
            );
            if (!deliveredRowExists) add(week, 'practice-line', line.pictureWord, '', '', { [line.pictureWord]: 1 });
        }
        // Version 6: a prompt picture of step D4 that no older picture covers gets its own row.
        const prompt = week.print?.writing.promptPicture;
        if (prompt && !promptCoveringRow(week, prompt, rows)) add(week, 'd4-prompt', prompt, '', '', { [singularOf(prompt.toLowerCase())]: 1 });
        // Version 4: the review pages of week 8 and the Benchmark 1 paper need the same picture
        // words; a word that weeks 1 to 7 already hold reuses that row (R4b-3).
        for (const day of week.block?.days ?? []) for (const item of day.paper) for (const pic of itemPictures(item)) addReused(week, pic);
        for (const item of week.benchmark?.paper.items ?? []) for (const pic of itemPictures(item)) addReused(week, pic);
    }
    return rows;
}

/**
 * The card rows of the picture list (Phase 8, version 7): one row for each entry of
 * `card-pictures.json`, in file order. A card row repeats the week of its entry, uses the size
 * class C of the picture words, and holds `{ <word>: 1 }` as its objects. The id is
 * `<level>-w<NN>-card-<word>`, so a card word always has its own file. The card kit matches
 * these rows before the book rows (see `storytimeCardPictureRow` in `card-kit.ts`).
 * A word that two entries hold gives two rows with one id and one file name, so the function
 * throws on the second entry. The compare ignores the case, and it holds in every week, because
 * one card word has one file in the whole level (A-P8-12).
 * @param entries The entries of `readLevelCardPictures`.
 * @param level The Storytime level.
 * @returns The card rows, in file order, to put after the book rows.
 * @throws Error When two entries hold the same word.
 */
export function storytimeCardPictureRows(entries: StorytimeCardPictureEntry[], level: number): StorytimePictureRow[] {
    const size = STORYTIME_PICTURE_SPEC[STORYTIME_SIZE_CLASS.card];
    const words = new Set<string>();
    return entries.map((entry) => {
        const word = entry.word.trim();
        const key = word.toLowerCase();
        if (words.has(key)) throw new Error(`card picture word repeat: "${word}" is in the card picture list twice; each card word has one row`);
        words.add(key);
        const id = `l${level}-w${String(entry.week).padStart(2, '0')}-card-${slugOf(word)}`;
        const fileName = `${id}-v1.png`;
        return {
            id,
            week: entry.week,
            use: 'card',
            text: word,
            prompt: entry.prompt,
            caption: '',
            objectCounts: { [word]: 1 },
            sizeClass: STORYTIME_SIZE_CLASS.card,
            fileName,
            lineArtFileName: lineArtNameOf(fileName),
            width: size.width,
            height: size.height,
        };
    });
}

/** Resolves a practice word to its delivered row without creating a new picture. */
export function storytimePrintPracticePicture(
    week: StorytimeWeek,
    pictureWord: string,
    rows: StorytimePictureRow[],
): StorytimePictureRow | undefined {
    const target = pictureWord.toLowerCase();
    const candidates = rows.filter((row) =>
        row.week <= week.meta.week &&
        ['story-page', 'check-row', 'practice-line'].includes(row.use) &&
        rowMatchesPictureWord(row, target),
    );
    // Week 1 prefers its own practice-line row; a picture word with no such row (an extra picture of
    // a line, A-48) reuses the delivered check-row picture, then a story page.
    if (week.meta.week === 1) {
        return candidates.find((row) => row.use === 'practice-line')
            ?? candidates.find((row) => row.use === 'check-row')
            ?? candidates.find((row) => row.use === 'story-page');
    }
    return candidates.find((row) => row.week === week.meta.week) ?? candidates[0];
}

/**
 * Resolves the prompt picture of step D4 to its row: the `d4-prompt` row of the week when the list has one, else the older
 * picture that covers the prompt (see `promptCoveringRow`).
 * @param week The week of the prompt.
 * @param pictureWord The prompt picture word.
 * @param rows The whole picture list.
 * @returns The row, or undefined when no row serves the prompt.
 */
export function storytimePrintPromptPicture(week: StorytimeWeek, pictureWord: string, rows: StorytimePictureRow[]): StorytimePictureRow | undefined {
    const target = pictureWord.toLowerCase();
    return rows.find((row) => row.use === 'd4-prompt' && row.week === week.meta.week && row.text.toLowerCase() === target)
        ?? promptCoveringRow(week, pictureWord, rows);
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
