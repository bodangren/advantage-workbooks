import { z } from 'zod';

/**
 * Lesson package: one file per lesson that holds every asset (track lesson_packages_20261001).
 * The workbook JSON, the database rows, and the tag file are all built from it.
 * Counts (12 glossed words, 10/5/5 questions) are checked by `checks.ts`, not here, so that a
 * package in draft (text first, bank later) still parses.
 */

/** The parts of a package that Daniel approves on the review page. */
export const APPROVAL_PARTS = ['text', 'thai', 'bank', 'images', 'audio', 'lesson'] as const;
export const ApprovalPartSchema = z.enum(APPROVAL_PARTS);
export type ApprovalPart = z.infer<typeof ApprovalPartSchema>;

const ObjectiveIdsSchema = z.array(z.string().min(1));

export const ApprovalSchema = z.object({
    status: z.enum(['draft', 'approved']),
    date: z.string().optional(),
});

/** A lesson from a printed book (Origins 2 and 3.1): its source file, its app article, and the lock. */
export const PrintedSourceSchema = z.object({
    /** The printed workbook JSON, relative to the repo root. */
    file: z.string().min(1),
    /** The app article (legacy cuid) that the package updates. */
    articleId: z.string().min(1),
    /** The printed Thai, one string per paragraph. */
    thaiParagraphs: z.array(z.string()).default([]),
    /** The app's pictures before the refresh. */
    imageUrls: z.array(z.string()).default([]),
    /** Hashes of the locked parts at import (`lockHashes`). */
    lock: z.record(z.string(), z.string()),
});

export const PackageMetaSchema = z.object({
    book: z.string().min(1),
    lesson: z.string().min(1),
    number: z.number().int().min(1),
    /** The stable book-and-lesson URL key (Origins 3.2 plan, decision D1), e.g. `o3-2/5`. */
    key: z.string().regex(/^[a-z0-9-]+\/\d+$/),
    title: z.string().min(1),
    raLevel: z.number().int().min(1).max(15),
    cefrLevel: z.string().min(1),
    textType: z.string().min(1),
    genre: z.string().min(1),
    /** A text-check profile id from `lib/text-profile/check.ts`. */
    profile: z.string().min(1),
    brief: z.string().optional(),
    /** The app's `article.type`; default `fiction`. */
    appType: z.enum(['fiction', 'nonfiction']).optional(),
    /** Set for a printed lesson: the article, the vocabulary, and the printed questions are locked. */
    printed: PrintedSourceSchema.optional(),
    /**
     * `workbook` (default): a lesson of a printed book. `bank`: an online-only article of a level
     * bank (track level_banks_20261002): no print set, no workbook activities, no Tutor clips.
     */
    role: z.enum(['workbook', 'bank']).default('workbook'),
    /** The old app article (legacy cuid) that this new text replaces in place (same id, new content). */
    replaces: z.string().min(1).optional(),
});

export const PackageTextSchema = z.object({
    paragraphs: z.array(z.string().min(1)).min(1),
    summary: z.string(),
    glossed: z.array(z.string().min(1)),
    recycle: z.array(z.string().min(1)).default([]),
    allow: z.array(z.string().min(1)).default([]),
    names: z.array(z.string().min(1)).default([]),
});

export const GlossaryEntrySchema = z.object({
    word: z.string().min(1),
    pos: z.string().min(1),
    definition: z.string().min(1),
    thai: z.string(),
    /** A sentence from the article that uses the word. */
    example: z.string().min(1),
});

export const McqSchema = z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    /** Four options, as the app stores them. Print shows the answer and the first two others. */
    options: z.array(z.string().min(1)),
    answer: z.string().min(1),
    /** A sentence from the article that proves the answer (the app's `textual_evidence`). */
    evidence: z.string().min(1),
    objectives: ObjectiveIdsSchema,
});

export const SaqSchema = z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    answer: z.string().min(1),
    objectives: ObjectiveIdsSchema,
});

export const LaqSchema = z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    objectives: ObjectiveIdsSchema,
});

export const BankSchema = z.object({
    mcq: z.array(McqSchema),
    saq: z.array(SaqSchema),
    laq: z.array(LaqSchema),
});

export const PrintSchema = z.object({
    mcq: z.array(z.string().min(1)).default([]),
    saq: z.string().default(''),
    saqHint: z.string().optional(),
    /** Options per printed multiple-choice question. The printed Origins books use 3. */
    mcqOptions: z.number().int().min(3).max(4).default(3),
});

export const VocabFillSchema = z.object({
    /** The sentence with `___` where the word goes. */
    sentence: z.string().min(1),
    answer: z.string().min(1),
});

export const ActivitiesSchema = z.object({
    sentenceStarters: z.array(z.string().min(1)).default([]),
    vocabFill: z.array(VocabFillSchema).default([]),
    /** Full sentences; the builder scrambles the words. */
    sentenceOrder: z.array(z.string().min(1)).default([]),
    sentenceCompletion: z.array(z.string().min(1)).default([]),
    writingPrompt: z.string().default(''),
    writingFrames: z.array(z.string().min(1)).default([]),
});

export const SentencePairSchema = z.object({
    en: z.string().min(1),
    th: z.string(),
});

export const ThaiSchema = z.object({
    /** One array per article paragraph, one pair per sentence. */
    paragraphs: z.array(z.array(SentencePairSchema)),
    summary: z.string(),
});

export const OverlaySchema = z.object({
    /** The exact text to draw on the image (mmx cannot draw text). */
    text: z.string().min(1),
    /** x, y, width, height as fractions of the image size. */
    box: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
});

export const ImagePositionSchema = z.enum([
    'hero',
    'vocabulary',
    'inline-para-1',
    'inline-para-2',
    'inline-para-3',
    'writing-prompt',
]);

export const PackageImageSchema = z.object({
    position: ImagePositionSchema,
    prompt: z.string().min(1),
    /** Series-bible names; the first one's character sheet is the subject reference. */
    characters: z.array(z.string().min(1)),
    caption: z.string(),
    /** The final picture (with its overlays), relative to the content root. */
    file: z.string().optional(),
    overlay: z.array(OverlaySchema).default([]),
    /** mmx candidates, relative to the content root; Daniel picks one on the review page. */
    candidates: z.array(z.string()).default([]),
    /** The candidate behind `file`. */
    chosenFrom: z.string().optional(),
    /** Daniel asks for new candidates; the next `lesson-images.ts --redo-marked` run makes them. */
    redo: z.boolean().optional(),
});

export const TimingSchema = z.object({
    text: z.string(),
    startTime: z.number().min(0),
    endTime: z.number().min(0),
});

export const AudioSchema = z.object({
    /** The narrator's mmx voice: the story (article, sentence clips, flashcards). */
    voice: z.string().optional(),
    /** The teacher's mmx voice: words, questions, and options. */
    teacherVoice: z.string().optional(),
    article: z.string().optional(),
    sentences: z.array(TimingSchema).default([]),
    words: z.string().optional(),
    wordTimes: z.array(TimingSchema).default([]),
    /** 3 to 5 sentences for the app's flashcards (`audios/sentences/<id>.mp3`), joined from the article clips. */
    flashcard: z.string().optional(),
    flashcardTimes: z.array(TimingSchema).default([]),
    /** Folder with one mp3 per sentence, word, question, and option for Tutor Advantage (`<id>.mp3`, Tutor's ids). */
    tutor: z.string().optional(),
});

export const TagsSchema = z.object({
    targetObjectives: ObjectiveIdsSchema,
    supportingObjectives: ObjectiveIdsSchema.default([]),
    glossedNodes: z.array(z.string().min(1)).default([]),
    recycledNodes: z.array(z.string().min(1)).default([]),
});

const DRAFT = { status: 'draft' as const };

export const ApprovalsSchema = z.object({
    text: ApprovalSchema.default(DRAFT),
    thai: ApprovalSchema.default(DRAFT),
    bank: ApprovalSchema.default(DRAFT),
    images: ApprovalSchema.default(DRAFT),
    audio: ApprovalSchema.default(DRAFT),
    lesson: ApprovalSchema.default(DRAFT),
});

/** Database IDs for one target. The injector writes these; question maps are package id → row id. */
export const TargetIdsSchema = z.object({
    articleId: z.string().min(1),
    mcq: z.record(z.string(), z.string()).default({}),
    saq: z.record(z.string(), z.string()).default({}),
    laq: z.record(z.string(), z.string()).default({}),
    /** The legacy `sentencs_and_words_for_flashcard` row (one per article). */
    flashcardId: z.string().optional(),
    contentHash: z.string().optional(),
    injectedAt: z.string().optional(),
});

export const DbSchema = z.object({
    legacy: TargetIdsSchema.optional(),
    new: TargetIdsSchema.optional(),
});

/** The app's other interface languages (Thai comes from the `thai` part). */
export const LocaleTextSchema = z.object({ cn: z.string(), tw: z.string(), vi: z.string() });

/**
 * A printed lesson's old app translations, read before the first injection by
 * `scripts/fetch-legacy-locales.ts`. Daniel (2026-10-01): keep them, matched by sentence. The
 * injector matches them (`lib/inject/legacy-locales.ts`); English fills a gap.
 */
export const LegacyLocalesSchema = z.object({
    /** The app article that the values came from. */
    articleId: z.string().min(1),
    /** When the script read them (ISO time). */
    fetchedAt: z.string().min(1),
    /** The old summary (a translation of the old English summary). */
    summary: LocaleTextSchema,
    /** Each old English sentence with its translations: the passage, then the flashcard sentences. */
    sentences: z.array(LocaleTextSchema.extend({ en: z.string().min(1) })),
    /** Each old vocabulary word with its translated definitions. */
    words: z.array(LocaleTextSchema.extend({ word: z.string().min(1) })),
});

export const LessonPackageSchema = z.object({
    version: z.literal(1),
    meta: PackageMetaSchema,
    text: PackageTextSchema,
    glossary: z.array(GlossaryEntrySchema),
    bank: BankSchema,
    /** Workbook lessons only; a bank package leaves both out. */
    print: PrintSchema.default({ mcq: [], saq: '', mcqOptions: 3 }),
    activities: ActivitiesSchema.default({ sentenceStarters: [], vocabFill: [], sentenceOrder: [], sentenceCompletion: [], writingPrompt: '', writingFrames: [] }),
    thai: ThaiSchema,
    images: z.array(PackageImageSchema),
    audio: AudioSchema.default({ sentences: [], wordTimes: [], flashcardTimes: [] }),
    tags: TagsSchema,
    /** Printed lessons only; the fetch script writes it, never the review page. */
    locales: LegacyLocalesSchema.optional(),
    approval: ApprovalsSchema.default({
        text: DRAFT,
        thai: DRAFT,
        bank: DRAFT,
        images: DRAFT,
        audio: DRAFT,
        lesson: DRAFT,
    }),
    db: DbSchema.default({}),
});

export type LessonPackage = z.infer<typeof LessonPackageSchema>;
export type LessonPackageInput = z.input<typeof LessonPackageSchema>;
export type Mcq = z.infer<typeof McqSchema>;
export type PackageImage = z.infer<typeof PackageImageSchema>;
export type LegacyLocales = z.infer<typeof LegacyLocalesSchema>;
