import { VOICES } from '../media/audio';
import type { GlossaryEntrySchema, LessonPackage } from './schema';
import type { z } from 'zod';

/**
 * Supplements (track origins_app_refresh_20261001): what Claude writes for a printed lesson, in one
 * small JSON file. `applySupplement` merges it into the package and refuses to touch the locked parts
 * (the article, the vocabulary words, and the printed questions). Pure: no files.
 */

type Glossary = z.infer<typeof GlossaryEntrySchema>;

export interface Supplement {
    summary?: string;
    thaiSummary?: string;
    /** The narrator: `male` when a boy or a man tells the story. */
    voice?: 'male' | 'female';
    /** Thai for an English sentence of the text, keyed by the sentence. */
    thai?: Record<string, string>;
    /** Changes to a vocabulary word's entry, keyed by the word (the word itself is locked). */
    glossary?: Record<string, Partial<Omit<Glossary, 'word'>>>;
    /** A printed MCQ takes `add` (a fourth option), `evidence`, and `objectives`; a new one takes all fields. */
    mcq?: Record<string, { add?: string; question?: string; options?: string[]; answer?: string; evidence?: string; objectives?: string[] }>;
    /** The printed SAQ takes `answer` and `objectives`; a new one takes all fields. */
    saq?: Record<string, { question?: string; answer?: string; objectives?: string[] }>;
    /** The LAQs, in order (ids l1, l2, ...). */
    laq?: { question: string; objectives: string[] }[];
    images?: Record<string, { prompt?: string; characters?: string[]; caption?: string }>;
    tags?: { targetObjectives: string[]; supportingObjectives: string[] };
}

const PRINTED_MCQ_KEYS = new Set(['add', 'evidence', 'objectives']);
const PRINTED_SAQ_KEYS = new Set(['answer', 'objectives']);

/**
 * Merges a supplement into a package.
 * @param input A parsed package.
 * @param sup The supplement.
 * @returns A new package. Throws when the supplement changes a locked part or names something unknown.
 */
export function applySupplement(input: LessonPackage, sup: Supplement): LessonPackage {
    const pkg = structuredClone(input);
    const printed = !!pkg.meta.printed;
    const printedMcq = new Set(printed ? pkg.print.mcq : []);
    const printedSaq = printed ? pkg.print.saq : undefined;

    if (sup.summary !== undefined) pkg.text.summary = sup.summary;
    if (sup.thaiSummary !== undefined) pkg.thai.summary = sup.thaiSummary;
    if (sup.voice) pkg.audio.voice = VOICES[sup.voice];

    for (const [en, th] of Object.entries(sup.thai ?? {})) {
        const pair = pkg.thai.paragraphs.flat().find((p) => p.en === en.trim());
        if (!pair) throw new Error(`"${en}" is not a sentence of the text`);
        pair.th = th;
    }

    for (const [word, change] of Object.entries(sup.glossary ?? {})) {
        const entry = pkg.glossary.find((g) => g.word === word);
        if (!entry) throw new Error(`${word} is not a vocabulary word`);
        Object.assign(entry, change);
    }

    for (const [id, change] of Object.entries(sup.mcq ?? {})) {
        const q = pkg.bank.mcq.find((x) => x.id === id);
        if (printedMcq.has(id)) {
            const bad = Object.keys(change).filter((k) => !PRINTED_MCQ_KEYS.has(k));
            if (bad.length) throw new Error(`${id} is printed: only add, evidence, and objectives (not ${bad.join(', ')})`);
            if (change.add !== undefined) {
                if (q!.options.length >= 4) throw new Error(`${id} has ${q!.options.length} options`);
                q!.options.push(change.add);
            }
            if (change.evidence !== undefined) q!.evidence = change.evidence;
            if (change.objectives) q!.objectives = change.objectives;
        } else if (q) {
            const { add, ...rest } = change;
            if (add !== undefined) q.options.push(add);
            Object.assign(q, rest);
        } else {
            const { question, options, answer, evidence, objectives } = change;
            if (!question || !options || !answer || !evidence || !objectives) throw new Error(`new MCQ ${id} needs question, options, answer, evidence, and objectives`);
            pkg.bank.mcq.push({ id, question, options, answer, evidence, objectives });
        }
    }

    for (const [id, change] of Object.entries(sup.saq ?? {})) {
        const q = pkg.bank.saq.find((x) => x.id === id);
        if (id === printedSaq) {
            const bad = Object.keys(change).filter((k) => !PRINTED_SAQ_KEYS.has(k));
            if (bad.length) throw new Error(`${id} is printed: only answer and objectives (not ${bad.join(', ')})`);
        }
        if (q) Object.assign(q, change);
        else {
            const { question, answer, objectives } = change;
            if (!question || !answer || !objectives) throw new Error(`new SAQ ${id} needs question, answer, and objectives`);
            pkg.bank.saq.push({ id, question, answer, objectives });
        }
    }

    if (sup.laq) pkg.bank.laq = sup.laq.map((q, i) => ({ id: `l${i + 1}`, question: q.question, objectives: q.objectives }));

    for (const [position, change] of Object.entries(sup.images ?? {})) {
        const img = pkg.images.find((i) => i.position === position);
        if (!img) throw new Error(`no image at ${position}`);
        Object.assign(img, change);
    }

    if (sup.tags) pkg.tags = { ...pkg.tags, ...sup.tags };
    return pkg;
}

/** Book folder → lesson id prefix in docs/content-plans/data/a0-tagging-2026-09-30.json. */
const TAGGING_PREFIX: Record<string, string> = { 'origins-2': 'O2', 'origins-3.1': 'O3.1' };

/**
 * The target and supporting objectives of a printed lesson, from the tagging file.
 * @param tagging The parsed tagging file.
 * @param book The book folder.
 * @param number The lesson number.
 * @returns The tags, or undefined when the file has no such lesson.
 */
export function tagsFor(tagging: { lessons: { id: string; primary_tags: { id: string }[]; extra_tags: { id: string }[] }[] }, book: string, number: number) {
    const id = `${TAGGING_PREFIX[book] ?? '?'}-${String(number).padStart(2, '0')}`;
    const lesson = tagging.lessons.find((l) => l.id === id);
    return lesson && { targetObjectives: lesson.primary_tags.map((t) => t.id), supportingObjectives: lesson.extra_tags.map((t) => t.id) };
}
