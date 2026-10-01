import { createHash, randomBytes } from 'crypto';
import type { LessonPackage } from '../lesson-package/schema';

/**
 * Lesson package → legacy Primary rows (track primary_injector_20261001).
 * Field map: docs/content-plans/primary-db-field-map.md. Pure: no database, no files.
 */

/** The app's level table (`convertCefrLevel` in primary-advantage/lib/utils.ts). */
const LEVELS = ['A0-', 'A0', 'A0+', 'A1-', 'A1', 'A1+', 'A2-', 'A2', 'A2+', 'B1-', 'B1', 'B1+', 'B2-', 'B2', 'B2+'];

/** Languages in the app's translation objects. Only Thai is written; the app falls back to English. */
const EMPTY_LOCALES = { cn: '', tw: '', vi: '' };

/**
 * A level problem, if the CEFR level and the app level do not agree.
 * @param cefr For example `A0+`.
 * @param ra For example 3.
 * @returns A message, or undefined.
 */
export function levelProblem(cefr: string, ra: number): string | undefined {
    const index = LEVELS.indexOf(cefr);
    if (index < 0) return `CEFR level ${cefr} is unknown to the app`;
    if (index + 1 !== ra) return `${cefr} is level ${index + 1} in the app, not ${ra}`;
    return undefined;
}

let counter = 0;

/**
 * A new id in the shape of Prisma's cuid(): `c` and 24 base-36 characters (time, counter, random).
 * @returns The id.
 */
export function newCuid(): string {
    const time = Date.now().toString(36).padStart(9, '0').slice(-9);
    counter = (counter + 1) % 36 ** 4;
    const count = counter.toString(36).padStart(4, '0');
    const random = BigInt(`0x${randomBytes(8).toString('hex')}`).toString(36).padStart(11, '0').slice(-11);
    return `c${time}${count}${random}`;
}

export interface WordTime {
    word: string;
    start: number;
    end: number;
}

/**
 * Word times inside one sentence, spread by word length. mmx gives no word times; the app's
 * reading tasks use them to mark the word under the play head.
 * @param sentence The sentence text.
 * @param start Sentence start (seconds).
 * @param end Sentence end (seconds).
 * @param pad The quiet pad at each edge of the clip (seconds).
 * @returns One entry per word, back to back.
 */
export function estimateWordTimes(sentence: string, start: number, end: number, pad = 0.06): WordTime[] {
    const words = sentence.split(/\s+/).filter(Boolean);
    const from = end - start > 2 * pad ? start + pad : start;
    const to = end - start > 2 * pad ? end - pad : end;
    const weights = words.map((w) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, '').length) + 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let at = from;
    return words.map((word, i) => {
        const next = i === words.length - 1 ? to : at + ((to - from) * weights[i]) / total;
        const w = { word, start: round(at), end: round(next) };
        at = next;
        return w;
    });
}

const round = (n: number) => Math.round(n * 1000) / 1000;

export interface LegacyIds {
    articleId: string;
    mcq: Record<string, string>;
    saq: Record<string, string>;
    laq: Record<string, string>;
    flashcardId?: string;
}

const idsFor = (items: { id: string }[], known: Record<string, string>) => Object.fromEntries(items.map((q) => [q.id, known[q.id] ?? newCuid()]));

/**
 * The legacy rows for one package. Throws when the package is not ready to inject.
 * @param pkg A parsed, approved package with its media.
 * @param known Ids from `db.legacy` (new ones are made for the rest).
 * @param now The time for `validated_at`.
 * @returns Column objects keyed by the real column names, and the full id set to write back.
 */
export function legacyRows(pkg: LessonPackage, known: LegacyIds, now: Date) {
    const problems: string[] = [];
    const level = levelProblem(pkg.meta.cefrLevel, pkg.meta.raLevel);
    if (level) problems.push(level);
    if (!pkg.audio.article || !pkg.audio.words || pkg.audio.sentences.length === 0) problems.push('no article audio with sentence times');
    if (!pkg.audio.flashcard || pkg.audio.flashcardTimes.length === 0) problems.push('no flashcard sentence audio');
    const noPicture = pkg.images.filter((i) => !i.file).map((i) => i.position);
    if (noPicture.length) problems.push(`no picture for ${noPicture.join(', ')}`);
    const thai = pkg.thai.paragraphs.flat();
    if (thai.length !== pkg.audio.sentences.length || thai.some((s, i) => s.en.trim() !== pkg.audio.sentences[i]?.text)) {
        problems.push('the audio sentences do not match the Thai part; make the audio again');
    }
    if (pkg.glossary.some((g, i) => pkg.audio.wordTimes[i]?.text !== g.word)) problems.push('the word audio does not match the glossary; make the audio again');
    if (problems.length) throw new Error(`Not ready to inject: ${problems.join('; ')}`);

    const id = known.articleId;
    const thaiOf = new Map(thai.map((s) => [s.en.trim(), s.th]));
    const words = pkg.glossary.map((g, i) => ({
        vocabulary: g.word,
        definition: { en: g.definition, th: g.thai, ...EMPTY_LOCALES },
        timeSeconds: pkg.audio.wordTimes[i].startTime,
    }));
    const ids = {
        articleId: id,
        mcq: idsFor(pkg.bank.mcq, known.mcq),
        saq: idsFor(pkg.bank.saq, known.saq),
        laq: idsFor(pkg.bank.laq, known.laq),
        flashcardId: known.flashcardId ?? newCuid(),
    };

    const article = {
        id,
        title: pkg.meta.title,
        summary: pkg.text.summary,
        passage: pkg.text.paragraphs.join('\n\n'),
        type: pkg.meta.appType ?? 'fiction',
        genre: pkg.meta.genre,
        sub_genre: null,
        image_description: pkg.images[0]?.prompt ?? '',
        cefr_level: pkg.meta.cefrLevel,
        ra_level: pkg.meta.raLevel,
        rating: 5,
        audio_url: `/audios/articles/${id}.mp3`,
        audio_word_url: `/audios/words/${id}.mp3`,
        sentences: pkg.audio.sentences.map((s) => ({ sentence: s.text, startTime: s.startTime, endTime: s.endTime, words: estimateWordTimes(s.text, s.startTime, s.endTime) })),
        words,
        translated_passage: { th: thai.map((s) => s.th), cn: [], tw: [], vi: [] },
        translated_summary: { th: pkg.thai.summary, ...EMPTY_LOCALES },
        author_id: '',
        is_published: true,
        is_approved: true,
        is_draft: false,
        validation_status: 'OK',
        validated_at: now,
    };
    const mcq = pkg.bank.mcq.map((q) => ({ id: ids.mcq[q.id], question: q.question, options: q.options, answer: q.answer, textualEvidence: q.evidence, article_id: id }));
    const saq = pkg.bank.saq.map((q) => ({ id: ids.saq[q.id], question: q.question, answer: q.answer, article_id: id }));
    const laq = pkg.bank.laq.map((q) => ({ id: ids.laq[q.id], question: q.question, article_id: id }));
    const flashcard = {
        id: ids.flashcardId,
        article_id: id,
        sentence: pkg.audio.flashcardTimes.map((s) => ({ sentence: s.text, translation: { th: thaiOf.get(s.text) ?? '', ...EMPTY_LOCALES }, timeSeconds: s.startTime })),
        audio_sentences_url: `audios/sentences/${id}.mp3`,
        words,
        words_url: `audios/words/${id}.mp3`,
    };
    return { article, mcq, saq, laq, flashcard, ids };
}

/**
 * The bucket objects for one package, in the app's paths.
 * @param pkg A parsed package with its media.
 * @param articleId The legacy article id.
 * @returns Local file (relative to the content root), bucket path, and whether to convert to PNG.
 */
export function bucketObjects(pkg: LessonPackage, articleId: string): { from: string; to: string; png: boolean }[] {
    const pictures = pkg.images.flatMap((img, i) => (img.file ? [{ from: img.file, to: `images/${articleId}_${i + 1}.png`, png: true }] : []));
    const audio = [
        [pkg.audio.article, `audios/articles/${articleId}.mp3`],
        [pkg.audio.words, `audios/words/${articleId}.mp3`],
        [pkg.audio.flashcard, `audios/sentences/${articleId}.mp3`],
    ].flatMap(([from, to]) => (from ? [{ from, to: to!, png: false }] : []));
    return [...pictures, ...audio];
}

/**
 * A hash of the rows' content, so a second run can tell whether anything changed. The validation
 * time does not count.
 * @param rows The output of `legacyRows`.
 * @param extra Other content that goes up with the rows (the Tutor manifest without its time).
 * @returns 16 hex characters.
 */
export function rowsHash(rows: ReturnType<typeof legacyRows>, extra?: unknown): string {
    const { validated_at: _time, ...article } = rows.article;
    void _time;
    const content = extra === undefined ? { ...rows, article } : { ...rows, article, extra };
    return createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);
}
