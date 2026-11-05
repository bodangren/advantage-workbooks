import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STORYTIME_ROOT, storytimeWeekFile } from '../lib/storytime/files';
import { StorytimeWeekSchema, type StorytimeWeek } from '../lib/storytime/schema';

/**
 * Audit item E4: "Each word list matches the book it describes." The back cover of a read-along lists the
 * words of the book (`backWords`). The list holds every story word that is a family word of the week of the
 * book or of an earlier week, because a child meets those words in the vocabulary of the unit.
 */

const WEEKS: StorytimeWeek[] = Array.from({ length: 8 }, (_value, index) => StorytimeWeekSchema.parse(JSON.parse(
    fs.readFileSync(storytimeWeekFile(STORYTIME_ROOT, 2, index + 1), 'utf8'),
)));

/** The words of a text in lower case, without punctuation. */
const wordsOf = (text: string): string[] => (text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []);

describe('Storytime print back list of a read-along (audit item E4)', () => {
    for (const week of WEEKS) {
        for (const book of week.books.filter((candidate) => candidate.kind === 'readalong')) {
            it(`E4: the back list of "${book.title}" (week ${week.meta.week}) holds every story word that is a family word of week ${week.meta.week} or an earlier week`, () => {
                const family = new Set(WEEKS.filter((candidate) => candidate.meta.week <= week.meta.week)
                    .flatMap((candidate) => candidate.focus.family.words.map((entry) => entry.word.toLowerCase())));
                const story = new Set(book.pages.flatMap((page) => wordsOf(page.text)));
                const back = new Set(book.backWords.map((word) => word.toLowerCase()));
                const missing = Array.from(story).filter((word) => family.has(word) && !back.has(word));
                expect(missing, `story words missing from the back list of "${book.title}"`).toEqual([]);
            });
        }
    }
});
