import { z } from 'zod';
import { ApprovalSchema, PackageImageSchema } from '../lesson-package/schema';

/**
 * Storytime Advantage week package (track storytime_week_package_20261022): one file per week of
 * the kindergarten to P2 phonics program, with the books, the song, the five daily scripts, the
 * review strips, the Friday check, and the home card. The design is the Storytime track in the
 * monorepo (`measure/tracks/storytime_advantage_program_20261021/design.md`, §3, §4, §6, §8).
 *
 * It is not a Primary `LessonPackage`: a week has no article, glossary, or question bank. The
 * design rules (step minutes, page counts, the frame in the song) are checked by `checks.ts`, not
 * here, so that a week in draft still parses.
 */

/** Level 1 = Anuban 2, Level 2 = Anuban 3, Level 3 = P1, Level 4 = P2 (design §1). */
export const LEVEL_GRADE: Record<number, string> = { 1: 'Anuban 2', 2: 'Anuban 3', 3: 'P1', 4: 'P2' };

/** The scripts of Levels 2 to 4, day 1 to 5 (design §3.2). */
export const SCRIPT_IDS_MAIN = ['A', 'B', 'C', 'D', 'E'] as const;
/** The scripts of Level 1, day 1 to 5 (design §3.4). */
export const SCRIPT_IDS_LEVEL1 = ['L', 'M', 'S', 'V', 'P'] as const;
export const ScriptIdSchema = z.enum([...SCRIPT_IDS_MAIN, ...SCRIPT_IDS_LEVEL1]);
export type ScriptId = z.infer<typeof ScriptIdSchema>;

/**
 * The script ids of a level, in day order.
 * @param level The Storytime level (1 to 4).
 * @returns Five ids: Level 1 L, M, S, V, P; the other levels A to E.
 */
export function scriptIdsOf(level: number): readonly ScriptId[] {
    return level === 1 ? SCRIPT_IDS_LEVEL1 : SCRIPT_IDS_MAIN;
}

/**
 * The stable URL key of a week, e.g. `st2/1` for Level 2 week 1.
 * @param level The Storytime level.
 * @param week The week of the level.
 * @returns The key.
 */
export function storytimeKey(level: number, week: number): string {
    return `st${level}/${week}`;
}

/**
 * The 24 named gestures of the songs (design §6.3; the names are in the Storytime track's
 * `forge-brief.md` §3, monorepo commit d70d52718). The video shows a Sprout doing each one.
 */
export const GESTURES = [
    'clap', 'stamp', 'point up', 'point to self', 'wave', 'reach', 'hop', 'turn', 'sway', 'hands on head',
    'stretch up', 'crouch', 'nod', 'shake head', 'count fingers', 'point forward', 'hands out', 'hug self',
    'march', 'sleep', 'eat', 'look', 'listen', 'bow',
] as const;

/** English text with its Thai. Daniel adds or checks the Thai; an empty string is "not yet". */
export const BiTextSchema = z.object({
    en: z.string().min(1),
    th: z.string().default(''),
});

/** A picture: the Primary picture fields without the Primary page positions. */
export const StorytimeImageSchema = PackageImageSchema.omit({ position: true });

export const StorytimeMetaSchema = z.object({
    program: z.literal('storytime'),
    shape: z.literal('storytime-week'),
    level: z.number().int().min(1).max(4),
    week: z.number().int().min(1).max(32),
    unit: z.number().int().min(1),
    /** `st<level>/<week>`, see `storytimeKey`. */
    key: z.string().regex(/^st[1-4]\/\d+$/),
    /** A review week: Script A is the benchmark, Scripts B to D re-read the block's books (design §3.2). */
    kind: z.enum(['teach', 'review']).default('teach'),
    /** 30 minutes in Anuban (Levels 1 and 2), 49 in primary (Levels 3 and 4). */
    periodMinutes: z.number().int().min(20).max(60),
    /** The opening routine: 6 minutes in Anuban, 8 in primary (design §3.1). */
    openingMinutes: z.number().int().min(1).max(15),
    title: z.string().min(1),
    /** The read-along class-set band (decision S15): Seed, Sprout, Leaf, Bud, or Flower. */
    band: z.enum(['Seed', 'Sprout', 'Leaf', 'Bud', 'Flower']).optional(),
    /** Only a published week is on the public QR page (`/st/<level>/<week>`). */
    status: z.enum(['draft', 'published']).default('draft'),
});

export const ElementSchema = z.object({
    /** The phonics graph node (`english.phonics.*`, decision S3). */
    id: z.string().min(1),
    /** The letters, e.g. `["s"]` or `["sh"]`. */
    graphemes: z.array(z.string().min(1)).min(1),
    /** The pure sound, e.g. `/s/`. */
    sound: z.string().min(1),
    /** The action that the class does with the sound (design §3.2, A2). */
    action: BiTextSchema,
});

export const FamilyWordSchema = z.object({
    word: z.string().min(1),
    image: StorytimeImageSchema.optional(),
});

export const FocusSchema = z.object({
    /** Absent in the Level 1 listening weeks and in review weeks. */
    element: ElementSchema.optional(),
    /** The phonemic awareness skill of the week (design §5.2), e.g. "the first sound n". */
    paSkill: BiTextSchema,
    /** The new tricky words of the week (design §6.1: 3 or fewer). */
    trickyWords: z.array(z.string().min(1)).default([]),
    /** The sentence frame with `___` for the family word, e.g. `I can see a ___.` */
    frame: z.string().min(1),
    /** The vocabulary family of the week: its name and its 6 to 8 picture words. */
    family: z.object({
        name: BiTextSchema,
        words: z.array(FamilyWordSchema).default([]),
    }),
    /** The decodable words taught to date (design §5.6), for the word wall card. */
    wordWall: z.array(z.string().min(1)).default([]),
});

export const BookPageSchema = z.object({
    text: z.string().min(1),
    image: StorytimeImageSchema.optional(),
});

/** The audio timing of one word: the app's `WordTimingSchema` (monorepo `lib/read-along/align.ts`). */
export const WordTimingSchema = z.object({
    word: z.string(),
    start: z.number().min(0),
    end: z.number().min(0),
});

/**
 * The audio timing of one sentence: the app's `SentenceTimepointSchema`, so that the public page
 * uses the Primary read-along player with no adapter. `page` (book audio only) is the 1-based page
 * of the sentence; the app schema ignores it.
 */
export const SentenceTimepointSchema = z.object({
    sentence: z.string(),
    startTime: z.number().min(0),
    endTime: z.number().min(0),
    words: z.array(WordTimingSchema).default([]),
    page: z.number().int().min(1).optional(),
});

export const BookAudioSchema = z.object({
    voice: z.string().optional(),
    /** The whole book at 1.0 speed, relative to the content root. */
    file: z.string().optional(),
    sentences: z.array(SentenceTimepointSchema).default([]),
    /** The whole book at 0.75 speed (design §6.1). */
    slowFile: z.string().optional(),
    slowSentences: z.array(SentenceTimepointSchema).default([]),
});

export const BookSchema = z.object({
    kind: z.enum(['readalong', 'decodable']),
    /**
     * A decodable of a week before the first vowel (Storytime, 2026-10-22: only Level 2 week 1, n):
     * one picture word on each page, so the decodability rule does not apply.
     */
    soundBook: z.boolean().optional(),
    title: z.string().min(1),
    cover: StorytimeImageSchema.optional(),
    pages: z.array(BookPageSchema).min(1),
    /** The decodable's "Sounds in this book" page (design §6.1). */
    soundsPage: z
        .object({
            element: z.string().min(1),
            words: z.array(z.string().min(1)).default([]),
            tricky: z.array(z.string().min(1)).default([]),
        })
        .optional(),
    /** The back-cover word list. */
    backWords: z.array(z.string().min(1)).default([]),
    audio: BookAudioSchema.default({ sentences: [], slowSentences: [] }),
});

export const SongLineSchema = z.object({
    text: z.string().min(1),
    part: z.enum(['verse', 'chorus']),
    /** One of the 24 named gestures (design §6.3). */
    gesture: z.string().min(1),
    image: StorytimeImageSchema.optional(),
    /** A repeated line shows the picture of an earlier line: its 0-based index in `lines`. */
    imageOf: z.number().int().min(0).optional(),
    /** A note for the teacher on the choreography sheet. */
    note: BiTextSchema.optional(),
});

export const SongSchema = z.object({
    title: z.string().min(1),
    /** Ukulele, hand claps, glockenspiel; the tempo and key (design §6.3). */
    styleBrief: z.string().default(''),
    bpm: z.number().int().min(60).max(160).optional(),
    /**
     * The lyric exactly as the music model gets it: `[intro]`, `[verse]`, `[chorus]`, `[outro]` tags
     * on their own lines. Its other lines are `lines`, in order; a part in parentheses can differ,
     * because `lines` hold the words as sung (an echo where the sheet says "(clap clap)").
     */
    lyricSheet: z.string().default(''),
    /** Every line as it is sung, the repeated chorus lines too. */
    lines: z.array(SongLineSchema).min(1),
    /** The choreography sheet: what the class does before the first line and after the last. */
    choreography: z.object({ intro: BiTextSchema.optional(), outro: BiTextSchema.optional() }).default({}),
    audio: z.string().optional(),
    video: z.string().optional(),
    /** The video with the lyric line highlighted word by word. */
    karaoke: z.string().optional(),
    /** One entry per sung line, with its word times (the karaoke cut). */
    times: z.array(SentenceTimepointSchema).default([]),
});

/** The four headings of the Primary manual (`TeachingNote`), as lines. */
export const NoteSchema = z.object({
    teacherActions: z.array(z.string().min(1)).default([]),
    /** The English that the teacher says, in full. In the Thai note: the gloss of each line. */
    teacherLanguage: z.array(z.string().min(1)).default([]),
    studentActions: z.array(z.string().min(1)).default([]),
    watchFor: z.array(z.string().min(1)).default([]),
});

export const StepSchema = z.object({
    /** The script letter and the step number, e.g. `A1`. */
    id: z.string().regex(/^[A-Z]\d{1,2}$/),
    title: BiTextSchema,
    /** 0 only for a moved step that takes no class time (a song in the opening, a home-time task). */
    minutes: z.number().int().min(0).max(20),
    en: NoteSchema,
    /** Daniel's Thai, with the same number of lines under each heading as `en`. */
    th: NoteSchema.optional(),
    /** A confidence builder. */
    easier: BiTextSchema,
    /** An extension. */
    harder: BiTextSchema,
    /** The pair or small-group form. */
    group: BiTextSchema,
    /** The cards, books, and sheets that the step uses. */
    materials: z.array(z.string().min(1)).default([]),
    /** In a 30-minute period, the step moves to the next day's opening as a one-minute recall (design §3.3). */
    moved: z.literal('next-opening').optional(),
});

export const ScriptSchema = z.object({
    id: ScriptIdSchema,
    day: z.number().int().min(1).max(5),
    title: BiTextSchema,
    /** What the teacher prepares before this lesson, printed at the top of the day. */
    prep: z.array(BiTextSchema).default([]),
    steps: z.array(StepSchema).min(1),
});

export const StripCardSchema = z.object({
    kind: z.enum(['sound', 'tricky', 'frame', 'word']),
    text: z.string().min(1),
    /** The week that taught the item. */
    week: z.number().int().min(1),
});

/** The printed review deck of one day (design §4). */
export const StripSchema = z.object({
    day: z.number().int().min(1).max(5),
    cards: z.array(StripCardSchema).default([]),
});

export const CheckItemSchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('circle-picture'),
        /** The sound, e.g. `/s/`. */
        sound: z.string().min(1),
        /** The picture words; one starts with the sound. */
        pictures: z.array(z.string().min(1)).min(2),
        answer: z.string().min(1),
    }),
    z.object({
        kind: z.literal('write-word'),
        word: z.string().min(1),
    }),
    z.object({
        kind: z.literal('write-letter'),
        letter: z.string().min(1),
    }),
]);

export const HomeCardSchema = z.object({
    /** The three words of the week. */
    words: z.array(z.string().min(1)).default([]),
    /** The one line that the teacher says in Thai (design §3.2, A8). */
    line: BiTextSchema,
    /** One 5-minute activity at home. */
    activity: BiTextSchema,
    /** The public song and read-along pages (QR codes, decision S4). */
    songUrl: z.string().optional(),
    readAlongUrl: z.string().optional(),
});

export const StorytimeTagsSchema = z.object({
    /** The phonics graph version that the node ids come from. */
    graphVersion: z.string().default(''),
    taught: z.array(z.string().min(1)).default([]),
    reviewed: z.array(z.string().min(1)).default([]),
});

/** The parts of a week that Daniel approves. */
export const STORYTIME_APPROVAL_PARTS = ['text', 'thai', 'images', 'audio', 'song', 'scripts'] as const;

const DRAFT = { status: 'draft' as const };

export const StorytimeApprovalsSchema = z.object({
    text: ApprovalSchema.default(DRAFT),
    thai: ApprovalSchema.default(DRAFT),
    images: ApprovalSchema.default(DRAFT),
    audio: ApprovalSchema.default(DRAFT),
    song: ApprovalSchema.default(DRAFT),
    scripts: ApprovalSchema.default(DRAFT),
});

export const StorytimeWeekSchema = z.object({
    version: z.literal(1),
    meta: StorytimeMetaSchema,
    focus: FocusSchema,
    /**
     * The read-along book and, from Level 2, the decodable (design §6.7): one of each kind. A review
     * week can leave them out: it re-reads the books of its block.
     */
    books: z.array(BookSchema).default([]),
    song: SongSchema.optional(),
    /** Five scripts, one a day. */
    scripts: z.array(ScriptSchema),
    review: z.array(StripSchema).default([]),
    check: z.object({ items: z.array(CheckItemSchema).default([]) }).default({ items: [] }),
    home: HomeCardSchema.optional(),
    tags: StorytimeTagsSchema.default({ graphVersion: '', taught: [], reviewed: [] }),
    approval: StorytimeApprovalsSchema.default({
        text: DRAFT,
        thai: DRAFT,
        images: DRAFT,
        audio: DRAFT,
        song: DRAFT,
        scripts: DRAFT,
    }),
    /** The injector writes these (key: program, level, week). */
    db: z
        .object({
            contentHash: z.string().optional(),
            injectedAt: z.string().optional(),
        })
        .default({}),
});

export type StorytimeWeek = z.infer<typeof StorytimeWeekSchema>;
export type StorytimeWeekInput = z.input<typeof StorytimeWeekSchema>;
export type StorytimeStep = z.infer<typeof StepSchema>;
export type StorytimeScript = z.infer<typeof ScriptSchema>;
export type StorytimeNote = z.infer<typeof NoteSchema>;
export type BiText = z.infer<typeof BiTextSchema>;
export type StorytimeBook = z.infer<typeof BookSchema>;
