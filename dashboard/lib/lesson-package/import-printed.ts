import { createHash } from 'crypto';
import { splitSentences } from '../text-profile/text';
import type { LessonPackageInput } from './schema';

/**
 * Printed lesson → lesson package (track origins_app_refresh_20261001). The printed books of
 * Origins 2 and 3.1 are on paper, so the article, the vocabulary words, and the printed questions
 * and activities are locked. Claude writes the rest (marked `TODO`) for the app. Pure: no files.
 */

/** A field that a person must write. The `todo` check lists them. */
export const TODO = '?';

/* eslint-disable @typescript-eslint/no-explicit-any -- the printed files have no schema (they fail WorkbookLessonSchema) */
type Printed = Record<string, any>;

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The app article id in a printed lesson's `article_url`.
 * @param url For example `https://primary.reading-advantage.com/student/read/cmgqx…`.
 * @returns The id, or undefined.
 */
export function printedArticleId(url: string): string | undefined {
    return /\/read\/([a-z0-9]+)/.exec(url)?.[1];
}

/** The first sentence with the word (or a simple ending: s, es, ed, ing, 's), any case. */
function sentenceWith(sentences: string[], word: string): string | undefined {
    const w = word.trim();
    if (w.length < 2) return undefined;
    const re = new RegExp(`(^|[^A-Za-z])${escape(w)}(s|es|ed|ing|'s)?([^A-Za-z]|$)`, 'i');
    return sentences.find((s) => re.test(s));
}

type Lockable = Pick<LessonPackageInput, 'text' | 'glossary' | 'bank' | 'print' | 'activities'>;

const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 16);

/** The names of the locked parts, as the `locked` check reports them. */
export const LOCK_LABELS: Record<string, string> = {
    paragraphs: 'paragraphs',
    vocabulary: 'vocabulary',
    questions: 'printed questions',
    activities: 'printed activities',
};

/**
 * Hashes of the locked parts. A printed MCQ is locked in its question, its printed options (the
 * first `print.mcqOptions`; the app may add one), and its answer.
 * @param pkg A package (parsed or input).
 * @returns One hash per part in `LOCK_LABELS`.
 */
export function lockHashes(pkg: Lockable): Record<string, string> {
    const shown = pkg.print.mcqOptions ?? 3;
    const mcq = pkg.print.mcq.map((id) => pkg.bank.mcq.find((q) => q.id === id)).map((q) => q && { q: q.question, o: q.options.slice(0, shown), a: q.answer });
    const saq = pkg.bank.saq.find((q) => q.id === pkg.print.saq)?.question;
    const a = pkg.activities;
    return {
        paragraphs: hash(pkg.text.paragraphs),
        vocabulary: hash(pkg.glossary.map((g) => g.word)),
        questions: hash({ mcq, saq }),
        activities: hash([a.sentenceStarters, a.vocabFill, a.sentenceOrder, a.sentenceCompletion, a.writingPrompt]),
    };
}

/**
 * A package from a printed lesson file.
 * @param raw The parsed `*_workbook.json`.
 * @param opts Where the package goes, and the printed file's path (relative to the repo root).
 * @returns A package input; the fields to write hold `TODO`.
 */
export function printedToPackage(raw: unknown, opts: { book: string; lesson: string; number: number; key: string; file: string }): LessonPackageInput {
    const p = (raw ?? {}) as Printed;
    const articleId = printedArticleId(text(p.article_url));
    if (!articleId) throw new Error(`${opts.file}: no app article id in article_url`);
    const paragraphs = list(p.article_paragraphs).map((x) => text(x?.text)).filter(Boolean);
    const sentences = paragraphs.map((para) => splitSentences(para));
    const all = sentences.flat();
    const thaiParagraphs = list(p.translation_paragraphs).map((x) => text(x?.text));
    const words = list(p.vocabulary).map((v) => ({ word: text(v?.word), definition: text(v?.definition), thai: text(v?.thai_definition) })).filter((v) => v.word);

    const mcq = list(p.comprehension_questions).map((q, i) => {
        const options = list(q?.options).map(text);
        const key = list(p.mc_answers).find((a) => a?.number === q?.number) ?? list(p.mc_answers)[i];
        const answer = options['abcd'.indexOf(text(key?.letter).toLowerCase())] ?? text(key?.text);
        return { id: `p${i + 1}`, question: text(q?.question), options, answer, evidence: sentenceWith(all, answer) ?? TODO, objectives: [] as string[] };
    });
    const fillAnswers = new Map([...text(p.vocab_fill_answer_string).matchAll(/(\d+)\.\s*([^,]+)/g)].map((m) => [Number(m[1]), m[2].trim()]));
    const activities = {
        sentenceStarters: list(p.sentence_starters).map(text).filter(Boolean),
        vocabFill: list(p.vocab_fill).map((f, i) => ({
            sentence: text(f?.sentence).replace(/<span class="blank"><\/span>/g, '___'),
            answer: fillAnswers.get(Number(f?.number ?? i + 1)) ?? TODO,
        })),
        sentenceOrder: list(p.sentence_order_answers).map((x) => text(x?.sentence)).filter(Boolean),
        sentenceCompletion: list(p.sentence_completion_prompts).map((x) => text(x?.prompt)).filter(Boolean),
        writingPrompt: text(p.writing_prompt),
    };

    const pkg: LessonPackageInput = {
        version: 1,
        meta: {
            book: opts.book,
            lesson: opts.lesson,
            number: opts.number,
            key: opts.key,
            title: text(p.lesson_title),
            raLevel: Number(/Level\s+(\d+)/.exec(text(p.level_name))?.[1] ?? 0),
            cefrLevel: /CEFR\s+(\S+)/.exec(text(p.cefr_level))?.[1] ?? TODO,
            textType: text(p.article_type) === 'nonfiction' ? 'information' : 'story',
            genre: text(p.genre) || TODO,
            // Bank questions are checked against this profile; the locked text is not.
            profile: 'origins-3.2',
            appType: text(p.article_type) === 'nonfiction' ? 'nonfiction' : 'fiction',
        },
        text: { paragraphs, summary: '', glossed: words.map((w) => w.word) },
        glossary: words.map((w) => ({ word: w.word, pos: TODO, definition: w.definition || TODO, thai: w.thai, example: sentenceWith(all, w.word) ?? TODO })),
        bank: { mcq, saq: p.short_answer_question ? [{ id: 's1', question: text(p.short_answer_question), answer: TODO, objectives: [] }] : [], laq: [] },
        print: { mcq: mcq.map((q) => q.id), saq: p.short_answer_question ? 's1' : '', mcqOptions: Math.min(4, Math.max(3, mcq[0]?.options.length ?? 3)) },
        activities,
        thai: {
            paragraphs: sentences.map((en, i) => {
                const th = (thaiParagraphs[i] ?? '').split(/\s+/).filter(Boolean);
                return en.map((s, j) => ({ en: s, th: th.length === en.length ? th[j] : '' }));
            }),
            summary: '',
        },
        images: (['hero', 'inline-para-2', 'inline-para-3'] as const).map((position, i) => ({ position, prompt: TODO, characters: [], caption: i === 0 ? text(p.article_caption) : '' })),
        tags: { targetObjectives: [], supportingObjectives: [] },
    };
    pkg.meta.printed = { file: opts.file, articleId, thaiParagraphs, imageUrls: list(p.article_image_url).map(text).filter(Boolean), lock: lockHashes(pkg) };
    return pkg;
}
