import type { LegacyLocales, LessonPackage } from '../lesson-package/schema';

/**
 * The old cn, tw, and vi translations of a printed lesson's app article. Daniel (2026-10-01): keep
 * them, matched by sentence. The app shows an empty string as empty (the summary uses `??`, the
 * reading view `|| ""`), so English fills every gap. Pure: no database, no files;
 * `scripts/fetch-legacy-locales.ts` runs the queries.
 */

export const LOCALES = ['cn', 'tw', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];
export type LocaleText = Record<Locale, string>;

/** Read-only queries; `$1` = the article id. */
export const LOCALE_QUERIES = {
    article: `select sentences, translated_passage, translated_summary from article where id = $1`,
    flashcards: `select sentence, words from sentencs_and_words_for_flashcard where article_id = $1 order by id`,
} as const;

/**
 * The key that two sentences (or words) match on: lower case, letters and digits only, one space
 * between words. A curly quote, an end mark, or a line break does not stop a match.
 * @param text The English text.
 * @returns The key.
 */
export function matchKey(text: string): string {
    return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const json = (v: unknown): unknown => {
    if (typeof v !== 'string') return v;
    try {
        return JSON.parse(v);
    } catch {
        return undefined;
    }
};
const list = (v: unknown): Record<string, unknown>[] => {
    const parsed = json(v);
    return Array.isArray(parsed) ? parsed.filter((x) => x && typeof x === 'object') : [];
};
const pick = (v: unknown): LocaleText => {
    const o = (json(v) ?? {}) as Record<string, unknown>;
    return { cn: str(o.cn), tw: str(o.tw), vi: str(o.vi) };
};
const filled = (t: LocaleText) => LOCALES.some((l) => t[l] !== '');
const complete = (t?: LocaleText) => !!t && LOCALES.every((l) => t[l] !== '');

/**
 * The stored form of one article's old translations.
 * @param articleId The app article.
 * @param article Its `article` row: `sentences`, `translated_passage`, `translated_summary`.
 * @param flashcards Its `sentencs_and_words_for_flashcard` rows: `sentence`, `words`.
 * @param now The read time.
 * @returns Each old sentence and word that has a translation (the first one wins), and the summary.
 */
export function legacyLocalesFrom(
    articleId: string,
    article: { sentences?: unknown; translated_passage?: unknown; translated_summary?: unknown },
    flashcards: { sentence?: unknown; words?: unknown }[],
    now: Date,
): LegacyLocales {
    const passage = (json(article.translated_passage) ?? {}) as Record<string, unknown>;
    const at = (l: Locale, i: number) => (Array.isArray(passage[l]) ? str((passage[l] as unknown[])[i]) : '');
    const sentences = new Map<string, LegacyLocales['sentences'][number]>();
    const words = new Map<string, LegacyLocales['words'][number]>();
    const keep = <T>(into: Map<string, T>, text: string, t: LocaleText, entry: T) => {
        const key = matchKey(text);
        if (key && !into.has(key) && filled(t)) into.set(key, entry);
    };
    list(article.sentences).forEach((s, i) => {
        const t = { cn: at('cn', i), tw: at('tw', i), vi: at('vi', i) };
        keep(sentences, str(s.sentence), t, { en: str(s.sentence), ...t });
    });
    for (const row of flashcards) {
        for (const s of list(row.sentence)) keep(sentences, str(s.sentence), pick(s.translation), { en: str(s.sentence), ...pick(s.translation) });
    }
    for (const row of flashcards) {
        // An English-only definition (a string) has nothing to keep.
        for (const w of list(row.words)) {
            const t = typeof w.definition === 'object' ? pick(w.definition) : pick({});
            keep(words, str(w.vocabulary), t, { word: str(w.vocabulary), ...t });
        }
    }
    return { articleId, fetchedAt: now.toISOString(), summary: pick(article.translated_summary), sentences: [...sentences.values()], words: [...words.values()] };
}

export interface LocaleMatch {
    /** One string per package sentence (`thai.paragraphs` order), for each locale. */
    passage: Record<Locale, string[]>;
    /** The old summary; the English summary where it has none. */
    summary: LocaleText;
    /** The translations of one sentence; the English sentence where there is no old one. */
    sentence: (en: string) => LocaleText;
    /** The translated definitions of one word; the English definition where there is no old one. */
    word: (word: string, definition: string) => LocaleText;
    /** For the report: package sentences and glossary words with an old translation in every locale. */
    matched: { sentences: number; of: number; words: number; ofWords: number; summary: boolean };
}

/**
 * Matches a package's text to its stored old translations (`pkg.locales`). A lesson with none (a
 * new lesson such as E12) gets English everywhere.
 * @param pkg A parsed package.
 * @returns The values for the app's `cn`, `tw`, and `vi` fields, and the match counts.
 */
export function matchLocales(pkg: LessonPackage): LocaleMatch {
    const old = pkg.locales;
    const bySentence = new Map((old?.sentences ?? []).map((s) => [matchKey(s.en), s]));
    const byWord = new Map((old?.words ?? []).map((w) => [matchKey(w.word), w]));
    const fill = (found: LocaleText | undefined, english: string): LocaleText => ({ cn: found?.cn || english, tw: found?.tw || english, vi: found?.vi || english });
    const sentence = (en: string) => fill(bySentence.get(matchKey(en)), en.trim());
    const word = (w: string, definition: string) => fill(byWord.get(matchKey(w)), definition);
    const english = pkg.thai.paragraphs.flat().map((s) => s.en);
    const texts = english.map(sentence);
    return {
        passage: { cn: texts.map((t) => t.cn), tw: texts.map((t) => t.tw), vi: texts.map((t) => t.vi) },
        summary: fill(old?.summary, pkg.text.summary),
        sentence,
        word,
        matched: {
            sentences: english.filter((s) => complete(bySentence.get(matchKey(s)))).length,
            of: english.length,
            words: pkg.glossary.filter((g) => complete(byWord.get(matchKey(g.word)))).length,
            ofWords: pkg.glossary.length,
            summary: complete(old?.summary),
        },
    };
}
