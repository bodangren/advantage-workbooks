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
    /** Daniel's recording of the sound (S22), a path under content/storytime (`phonemes/daniel/04-n.mp3`). */
    audio: z.string().min(1).optional(),
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
    /** The vocabulary family of the week: its name and its 6 to `max` picture words. */
    family: z.object({
        name: BiTextSchema,
        words: z.array(FamilyWordSchema).default([]),
        /** The most picture words (Storytime, 2026-10-22: 8, or up to 10 for a family such as the numbers to ten). */
        max: z.number().int().min(8).max(10).default(8),
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
    /** Names that the reader learns as whole words: the decodability rule lists them and does not count them as untaught (design §6.1). */
    names: z.array(z.string().min(1)).default([]),
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
    /**
     * Video cue: a bubble over the child of the picture. A "thought" bubble shows the render of a prop: the guess
     * of a question line ("Is it a ball?"; Daniel's week 7 note, 2026-10-22). The prop name is a Forge prop.
     */
    bubble: z.object({ kind: z.literal('thought'), prop: z.string().min(1) }).optional(),
    /** Video cue: the prop (a Forge prop name) that pops out at the start of the line, the answer of a guessing song. */
    pop: z.string().min(1).optional(),
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
    /**
     * The song (vocals), as `l<level>/media/w<nn>/song.mp3` under the Storytime content folder. Every
     * media path below is in the same form. Optional until the song of the week is chosen.
     */
    audio: z.string().optional(),
    /**
     * The classroom video (1920x1080, H.264, the song with vocals), with the line text highlighted word
     * by word. When it is absent, the QR page plays `audio` with the read-along player.
     */
    video: z.string().optional(),
    /**
     * The phone cut that the QR page plays: portrait, 720x1280, H.264 CRF about 28, AAC 96k (Daniel, 2026-10-23).
     * The same song and screens as `video`; the scene is at the top, the line text in the middle, and a large
     * gesture figure at the bottom.
     */
    videoPhone: z.string().optional(),
    /** The title card of `video` (JPG, 1280x720), shown before the tap when the page plays `video`. */
    poster: z.string().optional(),
    /** The title card of `videoPhone` (JPG, 720x1280), shown on the QR page before the tap. */
    posterPhone: z.string().optional(),
    /** The karaoke cut: the same picture as `video` over the instrumental (vocal separation). */
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
    /** A sound card: Daniel's recording of the sound (S22), a path under content/storytime. */
    audio: z.string().min(1).optional(),
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
        /** Where the answer word has the sound: at the start (the default), in the middle, or at the end. */
        position: z.enum(['first', 'middle', 'last']).default('first'),
        /** The picture words; one has the sound at the position. */
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
        /** The sound that the teacher says ("Write the letter for sss"); without it, the teacher says the letter name. */
        sound: z.string().min(1).optional(),
    }),
    z.object({
        kind: z.literal('picture-sort'),
        /** The columns of the sort: a sound and the pictures that have it at the position (the answer key). */
        groups: z.array(z.object({ sound: z.string().min(1), pictures: z.array(z.string().min(1)).min(1) })).min(2),
        /** Where the sound is in each picture word: at the start (the default), in the middle, or at the end. */
        position: z.enum(['first', 'middle', 'last']).default('first'),
    }),
    z.object({
        kind: z.literal('circle-word'),
        /** The printed words; the teacher says the answer, and the child circles it (a decodable or tricky word read on paper). */
        words: z.array(z.string().min(1)).min(2),
        answer: z.string().min(1),
    }),
]);

/** One day of a review week (design §3.5): the weeks that its centers and strips use, and the opening medley. */
export const BlockDaySchema = z.object({
    day: z.number().int().min(1).max(5),
    /** The teaching weeks of the day; empty on the day of the child's choice. */
    weeks: z.array(z.number().int().min(1)).default([]),
    /** What the teacher adds to the day, e.g. the weakest week from the Friday checks. */
    note: BiTextSchema.optional(),
    /** The two karaoke videos of the opening medley: song titles of the block. */
    medley: z.array(z.string().min(1)).length(2),
    /** The review page of the day in the student book, for the paper center (circle-word rows and a picture sort). */
    paper: z.array(CheckItemSchema).default([]),
});

/** The teaching weeks that a review week covers, and its day plan (design §3.5). */
export const BlockSchema = z.object({
    weeks: z.array(z.number().int().min(1)).min(1),
    days: z.array(BlockDaySchema).length(5),
});

/** The one-to-one sitting of a benchmark (design §3.5 (b)): the letter strip, the sound cards, and the blend words. */
export const OneToOneSchema = z.object({
    minutes: z.number().int().min(1).max(10),
    /** The lower-case letters of the strip, in the printed order. */
    letters: z.array(z.string().regex(/^[a-z]$/)).min(1),
    letterPass: z.number().int().min(1),
    /** The taught letters on the sound cards, in the order shown. */
    sounds: z.array(z.string().min(1)).min(1),
    /** Daniel's recording (S22) of the sound of each card, in the order of `sounds`. */
    soundAudio: z.array(z.string().min(1)).optional(),
    soundPass: z.number().int().min(1),
    /** Words blended by ear: the sounds that the teacher says, and the word. */
    blend: z
        .array(
            z.object({
                sounds: z.string().min(1),
                word: z.string().min(1),
                /** Daniel's recordings (S22) of the sounds, in the order of `sounds`. */
                audio: z.array(z.string().min(1)).optional(),
            }),
        )
        .min(1),
    blendPass: z.number().int().min(1),
    /** The script of the sitting, with the four headings. */
    en: NoteSchema,
    /** Daniel's Thai, with the line counts of `en`. */
    th: NoteSchema.optional(),
});

/** A decodable that the reading record can use, with its text for the printed form. */
export const RecordBookSchema = z.object({
    title: z.string().min(1),
    week: z.number().int().min(1),
    pages: z.array(z.string().min(1)).min(1),
});

/** A benchmark of a review week (design §3.5 and §7): a whole-class paper part, a one-to-one sitting, and a reading record. */
export const BenchmarkSchema = z.object({
    title: BiTextSchema,
    paper: z.object({
        minutes: z.number().int().min(1).max(20),
        items: z.array(CheckItemSchema).min(1),
        /** The pass marks, e.g. 6 of 8 pictures and 5 of 7 letters. */
        pass: BiTextSchema,
    }),
    oneToOne: OneToOneSchema,
    readingRecord: z.object({
        minutes: z.number().int().min(1).max(5),
        /** Words correct over words read, in percent. */
        pass: z.number().int().min(50).max(100),
        books: z.array(RecordBookSchema).min(1),
    }),
});

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

/** The parts of a week that Daniel approves. The print part is a seventh, separate part: it gates the print files, not the app publication (rule G5 of the test strategy). */
export const STORYTIME_APPROVAL_PARTS = ['text', 'thai', 'images', 'audio', 'song', 'scripts'] as const;

/** The name of the print approval part in `approval` (FR-1.3). */
export const STORYTIME_PRINT_PART = 'print' as const;

const DRAFT = { status: 'draft' as const };

/**
 * Daniel's approval of the print of a week (FR-1.3): a draft default, and an approved part that
 * holds his exact words and the date (generation rules 12.1 and 12.3). An approved part without
 * the date or the words does not parse (anti-pattern A2: no approval without consent words).
 */
export const StorytimePrintApprovalSchema = z
    .object({
        status: z.enum(['draft', 'approved']),
        date: z.string().optional(),
        words: z.string().optional(),
    })
    .superRefine((part, ctx) => {
        if (part.status !== 'approved') return;
        if (!part.date) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'an approved print part needs the date of the approval' });
        if (part.words === undefined || !part.words.trim())
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['words'], message: 'an approved print part needs the exact words of the approval' });
    });

/**
 * One app approval part with its record (FR-1.3, P14): `ApprovalSchema` plus the optional
 * `source` that cites where the approval is recorded, and the optional `words` of the approval.
 * The extension is strict, so a misspelled key fails the parse instead of being stripped.
 * `ApprovalSchema` in `lib/lesson-package/schema.ts` stays unchanged; Primary packages use it.
 */
export const StorytimeAppApprovalSchema = ApprovalSchema.extend({
    source: z.string().min(1).optional(),
    words: z.string().min(1).optional(),
}).strict();

/**
 * The student-book print text of a week (FR-1.1): the parts that the daily scripts name but that
 * the app package does not store. Unknown keys fail the parse, so a print file cannot silently
 * drop a renamed part.
 */
export const StorytimePrintBlockSchema = z
    .object({
        /** The letter formation box: the letter, the formation words of step A3, and the start point. */
        letterBox: z
            .object({
                letter: z.string().min(1),
                formationWords: z.string().min(1),
                startPoint: z.string().min(1),
            })
            .strict(),
        /** The practice sheet: one entry per line of print text, with the picture word at its start (step A7). */
        practice: z.array(z.object({ text: z.string().min(1), pictureWord: z.string().min(1) }).strict()).min(1),
        /** The dictation lines: the dictated letters, the dictated and traced words, and the sentence to trace (step C3). */
        dictation: z
            .object({
                letters: z.array(z.string().min(1)).min(1),
                words: z.array(z.string().min(1)).default([]),
                traceSentence: z.string().optional(),
            })
            .strict(),
        /** The writing page: the trace text, the name or word line, and the picture box (step D4). */
        writing: z
            .object({
                traceText: z.string().min(1),
                line: z.enum(['name', 'word']),
                pictureBox: z.boolean(),
            })
            .strict(),
    })
    .strict();

export type StorytimePrintBlock = z.infer<typeof StorytimePrintBlockSchema>;

export const StorytimeApprovalsSchema = z.object({
    text: StorytimeAppApprovalSchema.default(DRAFT),
    thai: StorytimeAppApprovalSchema.default(DRAFT),
    images: StorytimeAppApprovalSchema.default(DRAFT),
    audio: StorytimeAppApprovalSchema.default(DRAFT),
    song: StorytimeAppApprovalSchema.default(DRAFT),
    scripts: StorytimeAppApprovalSchema.default(DRAFT),
    print: StorytimePrintApprovalSchema.default(DRAFT),
});

export const StorytimeWeekSchema = z.object({
    version: z.literal(1),
    meta: StorytimeMetaSchema,
    focus: FocusSchema,
    /**
     * The daily 1-minute sound game, opening item 2 (Storytime, 2026-10-22): one teacher line for each day.
     * Days 1 and 2 find the first and the last sound of the week; days 3 to 5 blend three sounds by ear.
     */
    opening: z
        .object({
            pa: z.array(BiTextSchema).length(5),
            /** For each day, Daniel's recordings (S22) of the sounds that the teacher says, in the order of the line. */
            audio: z.array(z.array(z.string().min(1))).length(5).optional(),
        })
        .optional(),
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
    /** A review week: the block weeks and the day plan (design §3.5). */
    block: BlockSchema.optional(),
    /** A review week: the benchmark of the block (design §3.5). */
    benchmark: BenchmarkSchema.optional(),
    home: HomeCardSchema.optional(),
    /** The student-book print text (FR-1.1); the print files of Phases 2 to 5 read it, and the print check (FR-1.2) compares it with the scripts. */
    print: StorytimePrintBlockSchema.optional(),
    tags: StorytimeTagsSchema.default({ graphVersion: '', taught: [], reviewed: [] }),
    approval: StorytimeApprovalsSchema.default({
        text: DRAFT,
        thai: DRAFT,
        images: DRAFT,
        audio: DRAFT,
        song: DRAFT,
        scripts: DRAFT,
        print: DRAFT,
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
export type StorytimePrintApproval = z.infer<typeof StorytimePrintApprovalSchema>;
export type StorytimeStep = z.infer<typeof StepSchema>;
export type StorytimeScript = z.infer<typeof ScriptSchema>;
export type StorytimeNote = z.infer<typeof NoteSchema>;
export type BiText = z.infer<typeof BiTextSchema>;
export type StorytimeBenchmark = z.infer<typeof BenchmarkSchema>;
export type StorytimeCheckItem = z.infer<typeof CheckItemSchema>;
export type StorytimeBook = z.infer<typeof BookSchema>;
