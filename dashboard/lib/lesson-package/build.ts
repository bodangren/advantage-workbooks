import type { LessonPackage, Mcq } from './schema';
import type { WorkbookLesson } from '../workbook-schema';

/** Base of the stable book-and-lesson URL (Origins 3.2 plan, decision D1 = B). */
export const STABLE_URL_BASE = 'https://primary.reading-advantage.com/b/';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * The stable URL that the printed QR code opens.
 * @param pkg A parsed package.
 * @returns For example `https://primary.reading-advantage.com/b/o3-2/5`.
 */
export function stableLessonUrl(pkg: LessonPackage): string {
    return `${STABLE_URL_BASE}${pkg.meta.key}`;
}

/** A small seeded generator (mulberry32), so a rebuild gives the same order. */
function random(seed: string): () => number {
    let h = 1779033703;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
    return () => {
        h = (h + 0x6d2b79f5) | 0;
        let t = Math.imul(h ^ (h >>> 15), 1 | h);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Shuffles with a seed; when the result keeps the original order, it rotates by one. */
function shuffle<T>(items: T[], seed: string): T[] {
    const next = random(seed);
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.length > 1 && out.every((x, i) => x === items[i])) out.push(out.shift() as T);
    return out;
}

/** Books printed before 2026-10-06. Their lessons (the E12 insert too) keep the options in bank order. */
const BANK_ORDER_BOOKS = new Set(['origins-2', 'origins-3.1']);

/**
 * The answer and the first other options. A printed lesson keeps them in bank order, the same as
 * the printed book. Other lessons take a seeded order, because bank order put the answer in the
 * last printed place half the time (2026-10-06).
 * @param q The question.
 * @param n The number of printed options.
 * @param seed A stable seed, or undefined for bank order.
 * @returns The printed options.
 */
function printOptions(q: Mcq, n: number, seed?: string): string[] {
    const others = q.options.filter((o) => o !== q.answer).slice(0, n - 1);
    const kept = q.options.filter((o) => o === q.answer || others.includes(o));
    if (seed === undefined) return kept;
    const next = random(seed);
    const out = kept.sort();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/**
 * Builds the workbook lesson JSON from a package. No AI call; the same package always gives the
 * same output. Run the package checks first: this function throws on an unknown print-set id.
 * @param pkg A parsed package.
 * @param opts `mediaBase` is prefixed to image file names (for example a bucket URL).
 * @returns A lesson that passes `WorkbookLessonSchema`.
 */
export function buildWorkbookLesson(pkg: LessonPackage, opts: { mediaBase?: string } = {}): WorkbookLesson {
    const seed = pkg.meta.key;
    const find = <T extends { id: string }>(items: T[], id: string, kind: string): T => {
        const item = items.find((q) => q.id === id);
        if (!item) throw new Error(`${pkg.meta.lesson}: unknown ${kind} "${id}" in the print set`);
        return item;
    };

    const printed = pkg.print.mcq.map((id) => find(pkg.bank.mcq, id, 'MCQ'));
    const questions = printed.map((q, i) => ({ number: i + 1, question: q.question, options: printOptions(q, pkg.print.mcqOptions, pkg.meta.printed || BANK_ORDER_BOOKS.has(pkg.meta.book) ? undefined : `${seed}:mcq:${q.id}`) }));
    const saq = find(pkg.bank.saq, pkg.print.saq, 'SAQ');

    const definitions = shuffle(pkg.glossary, `${seed}:match`);
    const match = pkg.glossary.map((g, i) => ({
        number: i + 1,
        word: g.word,
        letter: LETTERS[i],
        definition: definitions[i].definition,
        thai_definition: definitions[i].thai,
    }));
    const matchAnswers = pkg.glossary.map((g, i) => `${i + 1}. ${LETTERS[definitions.indexOf(g)]}`).join(', ');

    const fill = pkg.activities.vocabFill;
    const wordBank = [...new Set([...pkg.glossary.map((g) => g.word), ...fill.map((f) => f.answer)])].sort((x, y) => x.localeCompare(y));

    const order = pkg.activities.sentenceOrder;
    const images = pkg.images
        .filter((img) => img.file)
        .map((img) => ({ url: `${opts.mediaBase ?? ''}${img.file}`, caption: img.caption, image_prompt: img.prompt, position: img.position }));
    const url = stableLessonUrl(pkg);

    return {
        lesson_number: String(pkg.meta.number),
        lesson_title: pkg.meta.title,
        // The printed books label the badges "Level 2" and "CEFR A0".
        level_name: `Level ${pkg.meta.raLevel}`,
        cefr_level: `CEFR ${pkg.meta.cefrLevel}`,
        article_type: pkg.meta.textType,
        genre: pkg.meta.genre,
        vocabulary: pkg.glossary.map((g) => ({ word: g.word, definition: g.definition, thai_definition: g.thai })),
        article_url: url,
        article_images: images,
        article_paragraphs: pkg.text.paragraphs.map((text, i) => ({ number: i + 1, text })),
        comprehension_questions: questions,
        mc_answers: printed.map((q, i) => ({ number: i + 1, letter: LETTERS[questions[i].options.indexOf(q.answer)], text: q.answer })),
        short_answer_question: saq.question,
        short_answer_hint: pkg.print.saqHint,
        sentence_starters: pkg.activities.sentenceStarters,
        vocab_match: match,
        vocab_match_answer_string: matchAnswers,
        vocab_fill: fill.map((f, i) => ({ number: i + 1, sentence: f.sentence.replace('___', '<span class="blank"></span>') })),
        vocab_word_bank: wordBank,
        vocab_fill_answer_string: fill.map((f, i) => `${i + 1}. ${f.answer}`).join(', '),
        sentence_order_questions: order.map((s, i) => ({ words: shuffle(s.replace(/[.!?]+$/, '').split(/\s+/), `${seed}:order:${i}`) })),
        sentence_order_answers: order.map((sentence, i) => ({ number: i + 1, sentence })),
        sentence_completion_prompts: pkg.activities.sentenceCompletion.map((prompt, i) => ({ number: i + 1, prompt })),
        writing_prompt: pkg.activities.writingPrompt,
        writing_sentence_frames: pkg.activities.writingFrames,
        writing_practice_url: `${url}/writing`,
        translation_paragraphs: pkg.thai.paragraphs.map((pairs, i) => ({ label: `Paragraph ${i + 1}`, text: pairs.map((p) => p.th).join(' ') })),
    };
}
