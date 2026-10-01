import { createHash } from 'crypto';
import type { LessonPackage } from '../lesson-package/schema';
import { articleSentences } from './audio';

/**
 * Tutor Advantage audio (track lesson_media_20261001). Tutor plays one mp3 per sentence, word,
 * question, and option. It finds them through `articles/<articleId>/manifest.json` in its bucket.
 * The ids and paths copy tutor-advantage's scripts/generate-article-tts.mjs, so the same text gives
 * the same file name in both tools.
 */

export type TutorKind = 'sentence' | 'word' | 'question';

export interface TutorItem {
    id: string;
    order: number;
    text: string;
}

export interface TutorQuestion extends TutorItem {
    type: 'mcq' | 'saq';
    options: { key: string; id: string; text: string }[];
}

export interface TutorItems {
    sentences: TutorItem[];
    /** The glossary words (Tutor's vocabulary step). */
    words: TutorItem[];
    /** Every other word in the story, for Tutor's sentence games. */
    sentenceWords: TutorItem[];
    questions: TutorQuestion[];
}

export interface TutorClip {
    kind: TutorKind;
    id: string;
    text: string;
    role: 'narrator' | 'teacher';
}

const sha1 = (s: string) => createHash('sha1').update(s).digest('hex');
const pad3 = (order: number) => String(order + 1).padStart(3, '0');

/**
 * Tutor's id for a sentence or word clip.
 * @param kind `sentence` or `word`.
 * @param order The 0-based position in its list.
 * @param text The clip text.
 * @returns For example `word-001-1813d29a26`.
 */
export function stableAudioId(kind: 'sentence' | 'word', order: number, text: string): string {
    return `${kind}-${pad3(order)}-${sha1(`${kind}\0${order}\0${text}`).slice(0, 10)}`;
}

/** Tutor's list of the other story words: each word once, lower case, in text order. */
function storyWords(sentences: string[]): string[] {
    const seen = new Set<string>();
    return sentences
        .flatMap((s) => s.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? [])
        .map((w) => w.replace(/’/g, "'").toLowerCase())
        .filter((w) => !seen.has(w) && (seen.add(w), true));
}

/**
 * The Tutor items of a lesson, in the order Tutor reads them from the database: the article
 * sentences, the glossary words, the other story words, then the MCQs and SAQs in bank order.
 * @param pkg A parsed package.
 * @returns The items with Tutor's ids.
 */
export function tutorItems(pkg: LessonPackage): TutorItems {
    const sentenceTexts = articleSentences(pkg).map((s) => s.text);
    const wordTexts = pkg.glossary.map((g) => g.word.trim());
    const curated = new Set(wordTexts.map((w) => w.toLowerCase()));
    const item = (kind: 'sentence' | 'word', order: number, text: string) => ({ id: stableAudioId(kind, order, text), order, text });
    const questions = [...pkg.bank.mcq.map((q) => ({ type: 'mcq' as const, text: q.question.trim(), options: q.options })), ...pkg.bank.saq.map((q) => ({ type: 'saq' as const, text: q.question.trim(), options: [] as string[] }))];
    return {
        sentences: sentenceTexts.map((t, i) => item('sentence', i, t)),
        words: wordTexts.map((t, i) => item('word', i, t)),
        sentenceWords: storyWords(sentenceTexts)
            .filter((w) => !curated.has(w))
            .map((t, i) => item('word', wordTexts.length + i, t)),
        questions: questions.map((q, order) => {
            const id = `${q.type}-${pad3(order)}-${sha1(`question\0${order}\0${q.text}`).slice(0, 10)}`;
            return {
                id,
                order,
                text: q.text,
                type: q.type,
                options: q.options.map((text, i) => {
                    const key = `option${i + 1}`;
                    return { key, id: `${id}-${key}-${sha1(`option\0${order}\0${key}\0${text}`).slice(0, 8)}`, text };
                }),
            };
        }),
    };
}

/**
 * Every clip to make, once each. The story sentences take the narrator's voice; the rest take the teacher's.
 * @param items The output of `tutorItems`.
 * @returns The clips in item order.
 */
export function tutorClips(items: TutorItems): TutorClip[] {
    return [
        ...items.sentences.map((s) => ({ kind: 'sentence' as const, id: s.id, text: s.text, role: 'narrator' as const })),
        ...[...items.words, ...items.sentenceWords].map((w) => ({ kind: 'word' as const, id: w.id, text: w.text, role: 'teacher' as const })),
        ...items.questions.flatMap((q) => [
            { kind: 'question' as const, id: q.id, text: q.text, role: 'teacher' as const },
            ...q.options.map((o) => ({ kind: 'question' as const, id: o.id, text: o.text, role: 'teacher' as const })),
        ]),
    ];
}

const FOLDER: Record<TutorKind, string> = { sentence: 'sentences', word: 'words', question: 'questions' };
const objectPath = (articleId: string, kind: TutorKind, id: string) => `articles/${articleId}/${FOLDER[kind]}/${id}.mp3`;

/**
 * The local clip files and their bucket paths.
 * @param items The output of `tutorItems`.
 * @param folder The package's `audio.tutor` folder (relative to the content root).
 * @param articleId The legacy article id.
 * @returns One entry per clip.
 */
export function tutorUploads(items: TutorItems, folder: string, articleId: string): { from: string; to: string }[] {
    return tutorClips(items).map((c) => ({ from: `${folder}/${c.id}.mp3`, to: objectPath(articleId, c.kind, c.id) }));
}

export interface ManifestOptions {
    articleId: string;
    bucket: string;
    title: string;
    narratorVoice: string;
    teacherVoice: string;
    speed: number;
    generatedAt: string;
}

/**
 * The manifest Tutor reads (`articles/<articleId>/manifest.json`, version 1). Tutor reads
 * `voice.voiceId` only for its own records; `narratorVoiceId` is extra.
 * @param items The output of `tutorItems`.
 * @param o The article, the bucket, and the voices.
 * @returns The manifest object; every clip has status `ready`.
 */
export function tutorManifest(items: TutorItems, o: ManifestOptions) {
    const url = (path: string) => `https://storage.googleapis.com/${o.bucket}/${path}`;
    const entry = (kind: 'sentence' | 'word') => (it: TutorItem) => {
        const path = objectPath(o.articleId, kind, it.id);
        return { id: it.id, order: it.order, text: it.text, objectPath: path, audioUrl: url(path), status: 'ready' as const };
    };
    return {
        version: 1 as const,
        articleId: o.articleId,
        source: 'PRIMARY_ADVANTAGE' as const,
        title: o.title,
        voice: { provider: 'minimax-mmx', voiceId: o.teacherVoice, narratorVoiceId: o.narratorVoice, languageCode: 'en-US', speakingRate: o.speed },
        sentences: items.sentences.map(entry('sentence')),
        words: items.words.map(entry('word')),
        sentenceWords: items.sentenceWords.map(entry('word')),
        questions: items.questions.map((q) => {
            const questionObjectPath = objectPath(o.articleId, 'question', q.id);
            const optionFiles = q.options.map((op) => ({ id: op.id, text: op.text, objectPath: objectPath(o.articleId, 'question', op.id), status: 'ready' as const }));
            return {
                id: q.id,
                type: q.type,
                order: q.order,
                text: q.text,
                questionAudioUrl: url(questionObjectPath),
                questionObjectPath,
                optionAudioUrls: Object.fromEntries(q.options.map((op, i) => [op.key, url(optionFiles[i].objectPath)])),
                optionFiles,
            };
        }),
        generatedAt: o.generatedAt,
    };
}
