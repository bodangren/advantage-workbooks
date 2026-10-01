import { lemmaCandidates, splitSentences, tokenize } from './text';
import { LEVEL_RANK, type VocabularyIndex, type YleLevel } from './vocabulary';
import type { LessonText } from './sources';

/** "warn" marks a lesson value that a book rule decides; "pending" marks a book rule before the book is complete. */
export type CheckStatus = 'pass' | 'fail' | 'warn' | 'pending';

/** The result of one check. */
export interface CheckResult {
    id: string;
    label: string;
    status: CheckStatus;
    value: string;
    target: string;
    detail?: string;
}

/** Targets for one kind of text. */
export interface TextProfile {
    id: string;
    label: string;
    words: [number, number];
    paragraphs: number;
    meanSentenceLength: [number, number];
    longestSentence: number;
    /** Share of running words on the Starters list, names not counted (0–1). */
    startersShare: number;
    glossedCount: number;
    glossedStartersMin: number;
    glossedMoversMax: number;
    /** Glossed Starters words that no earlier text uses. */
    newStartersMin: number;
    /** Glossed words of earlier lessons that occur again in the text. */
    recycledMin: number;
    questionMarksMin: number;
    spelling: 'american' | 'british';
    /** Book rules. When present, the lesson question check only warns. */
    book?: { lessons: number; questionLessonsMin: number; dialogueLessonsMin: number };
}

const LEVEL_3: TextProfile = {
    id: 'origins-3.2',
    label: 'Primary level 3 (Origins 3.2 plan §4)',
    words: [150, 200],
    paragraphs: 3,
    meanSentenceLength: [5.0, 5.5],
    longestSentence: 10,
    startersShare: 0.95,
    glossedCount: 12,
    glossedStartersMin: 10,
    glossedMoversMax: 2,
    newStartersMin: 6,
    recycledMin: 4,
    questionMarksMin: 2,
    spelling: 'american',
    book: { lessons: 14, questionLessonsMin: 10, dialogueLessonsMin: 6 },
};

/** Built-in profiles. */
export const PROFILES: Record<string, TextProfile> = {
    'origins-3.2': LEVEL_3,
    'origins-3.1-insert': {
        ...LEVEL_3,
        id: 'origins-3.1-insert',
        label: 'Origins 3.1 lesson-12 insert (errata brief §2)',
        words: [150, 190],
        meanSentenceLength: [4.5, 5.2],
        questionMarksMin: 3,
        book: undefined,
    },
};

/** The Origins cast (series bible §2). These count as proper names. */
export const CAST_NAMES = ['Pip', 'Tom', 'Lily', 'Mia', 'Ben', 'Leo', 'Sam', 'May', 'Pat', 'Kim', 'Squeaky'];

/** Series words that every text may use (Pip says "Woof!"). They count like allowed words. */
export const SERIES_WORDS = ['woof'];

const BRITISH_TO_AMERICAN: Record<string, string> = {
    colour: 'color', colours: 'colors', coloured: 'colored', colourful: 'colorful', colouring: 'coloring',
    favourite: 'favorite', favourites: 'favorites', grey: 'gray', neighbour: 'neighbor', neighbours: 'neighbors',
    mum: 'mom', mums: 'moms', mummy: 'mommy', centre: 'center', theatre: 'theater', metre: 'meter', metres: 'meters',
    pyjamas: 'pajamas', practise: 'practice', travelling: 'traveling', travelled: 'traveled', organise: 'organize',
    realise: 'realize', favour: 'favor', honour: 'honor', jewellery: 'jewelry', aeroplane: 'airplane', programme: 'program',
};
const AMERICAN_TO_BRITISH = Object.fromEntries(Object.entries(BRITISH_TO_AMERICAN).map(([b, a]) => [a, b]));

/** Report for one lesson. */
export interface LessonReport {
    id: string;
    title: string;
    source: string;
    profile: string;
    stats: {
        words: number;
        sentences: number;
        paragraphs: number;
        meanSentenceLength: number;
        longestSentence: number;
        longestSentenceText: string;
        /** Starters words, names, and allowed words, as a share of all running words. */
        startersShare: number;
        /** Starters words as a share of running words that are not names or allowed words. */
        startersShareWithoutNames: number;
        nameTokens: number;
        questionMarks: number;
        hasDialogue: boolean;
    };
    checks: CheckResult[];
    nonStarters: { word: string; level: YleLevel | 'not in graph'; count: number }[];
    /** Words on the draft's allow list that occur in the text. */
    allowed: { word: string; count: number }[];
    names: string[];
    guessedNames: string[];
    newWords: string[];
    recycled: string[];
}

/** Report for a folder of lessons. */
export interface BookReport {
    lessons: LessonReport[];
    checks: CheckResult[];
}

interface Analysed {
    sentences: { text: string; tokens: string[] }[];
    tokens: string[];
    /** Per token: the lower-case token and its lemma. Only these match a word, so "his" is not "hi". */
    keys: string[][];
}

function analyse(paragraphs: string[], index: VocabularyIndex): Analysed {
    const sentences = paragraphs.flatMap(splitSentences).map((text) => ({ text, tokens: tokenize(text) }));
    const tokens = sentences.flatMap((s) => s.tokens);
    return { sentences, tokens, keys: tokens.map((t) => [...new Set([t.toLowerCase(), index.lemmaOf(t)])]) };
}

function formsOf(word: string, index: VocabularyIndex): Set<string> {
    return new Set([...index.siblingsOf(word), ...index.siblingsOf(index.lemmaOf(word))]);
}

/** Token positions where the word or phrase starts, in any inflected or sibling form. */
function occurrences(text: Analysed, word: string, index: VocabularyIndex): { start: number; length: number }[] {
    const parts = tokenize(word.toLowerCase());
    if (parts.length === 0) return [];
    const partForms = parts.length === 1 ? [formsOf(word, index)] : parts.map((p) => formsOf(p, index));
    const found: { start: number; length: number }[] = [];
    for (let i = 0; i + parts.length <= text.keys.length; i++) {
        if (partForms.every((forms, j) => text.keys[i + j].some((c) => forms.has(c)))) found.push({ start: i, length: parts.length });
    }
    return found;
}

/** True when the word or phrase occurs in the text, in any inflected or sibling form. */
function occurs(text: Analysed, word: string, index: VocabularyIndex): boolean {
    return occurrences(text, word, index).length > 0;
}

const phraseCache = new WeakMap<VocabularyIndex, Map<string, string[][]>>();
function phrasesByFirstWord(index: VocabularyIndex): Map<string, string[][]> {
    let map = phraseCache.get(index);
    if (!map) {
        map = new Map();
        for (const p of index.phrases) {
            const list = map.get(p[0]) ?? [];
            list.push(p);
            map.set(p[0], list);
        }
        phraseCache.set(index, map);
    }
    return map;
}

function tokenLevels(text: Analysed, index: VocabularyIndex): (YleLevel | undefined)[] {
    const levels = text.tokens.map((t) => index.levelOf(index.lemmaOf(t)));
    const byFirst = phrasesByFirstWord(index);
    const better = (a: YleLevel | undefined, b: YleLevel | undefined) =>
        a === undefined ? b : b === undefined ? a : LEVEL_RANK[a] <= LEVEL_RANK[b] ? a : b;
    text.keys.forEach((keys, i) => {
        for (const c of keys) {
            for (const phrase of byFirst.get(c) ?? []) {
                if (i + phrase.length > text.keys.length) continue;
                if (!phrase.every((w, j) => text.keys[i + j].includes(w))) continue;
                const level = index.levelOf(phrase.join(' '));
                for (let j = 0; j < phrase.length; j++) levels[i + j] = better(levels[i + j], level);
            }
        }
    });
    return levels;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const stripPossessive = (t: string) => t.replace(/'s$/i, '');

function rangeCheck(id: string, label: string, value: number, [lo, hi]: [number, number], shown = String(value)): CheckResult {
    return { id, label, status: value >= lo && value <= hi ? 'pass' : 'fail', value: shown, target: `${lo}–${hi}` };
}

/**
 * Checks one lesson text against a profile.
 * @param lesson The lesson text and its glossed words.
 * @param ctx The vocabulary index, the earlier lessons (in order), the profile, and optional extra cast names.
 * @returns The lesson report.
 */
export function checkLesson(
    lesson: LessonText,
    ctx: { index: VocabularyIndex; prior: LessonText[]; profile: TextProfile; castNames?: string[] },
): LessonReport {
    const { index, profile } = ctx;
    const text = analyse(lesson.paragraphs, index);
    const cast = new Set([...(ctx.castNames ?? CAST_NAMES), ...(lesson.names ?? [])]);
    const known = (t: string) => lemmaCandidates(t).some((c) => index.levelOf(c) !== undefined);

    // Proper names: the cast, plus capitalized unknown words in mid-sentence.
    const guessed = new Set<string>();
    for (const s of text.sentences) {
        s.tokens.forEach((t, i) => {
            const base = stripPossessive(t);
            if (i > 0 && /^[A-Z]/.test(base) && base !== 'I' && !cast.has(base) && !known(base)) guessed.add(base);
        });
    }
    const isName = (t: string) => /^[A-Z]/.test(t) && (cast.has(stripPossessive(t)) || guessed.has(stripPossessive(t)));

    const levels = tokenLevels(text, index);
    // Allowed words: the brief's allow list, the glossed words (the page teaches them), and series words.
    // Like names, they count neither for nor against the Starters share.
    const allowAt: ({ word: string; start: number } | undefined)[] = new Array(text.tokens.length);
    for (const word of [...lesson.glossed, ...(lesson.allow ?? []), ...SERIES_WORDS]) {
        for (const { start, length } of occurrences(text, word, index)) {
            for (let j = start; j < start + length; j++) allowAt[j] ??= { word, start };
        }
    }
    const allowed = new Map<string, Set<number>>();
    const usedNames = new Set<string>();
    let starterTokens = 0;
    let nameTokens = 0;
    let allowedTokens = 0;
    const nonStarters = new Map<string, { word: string; level: YleLevel | 'not in graph'; count: number }>();
    text.tokens.forEach((t, i) => {
        if (isName(t)) {
            usedNames.add(stripPossessive(t));
            nameTokens++;
            return;
        }
        if (levels[i] === 'Starters') {
            starterTokens++;
            return;
        }
        const at = allowAt[i];
        if (at) {
            // A set of start positions, so a phrase counts once.
            allowed.set(at.word, (allowed.get(at.word) ?? new Set()).add(at.start));
            allowedTokens++;
            return;
        }
        const word = index.lemmaOf(t);
        const entry = nonStarters.get(word) ?? { word, level: levels[i] ?? 'not in graph', count: 0 };
        entry.count++;
        nonStarters.set(word, entry);
    });

    const words = text.tokens.length;
    const sentenceLengths = text.sentences.map((s) => s.tokens.length);
    const longest = Math.max(0, ...sentenceLengths);
    const longestText = text.sentences[sentenceLengths.indexOf(longest)]?.text ?? '';
    const msl = text.sentences.length ? round2(words / text.sentences.length) : 0;
    const share = words ? (starterTokens + nameTokens + allowedTokens) / words : 0;
    const counted = words - nameTokens - allowedTokens;
    const shareWithoutNames = counted > 0 ? starterTokens / counted : 0;
    const joined = lesson.paragraphs.join('\n');
    const questionMarks = (joined.match(/\?/g) ?? []).length;
    const hasDialogue = /["“][^"”]+["”]/.test(joined);

    // Glossed words.
    const glossLevel = (g: string) => index.levelOf(g) ?? index.levelOf(index.lemmaOf(g));
    const glossed = lesson.glossed;
    const gStarters = glossed.filter((g) => glossLevel(g) === 'Starters');
    const gMovers = glossed.filter((g) => glossLevel(g) === 'Movers');
    const gAbove = glossed.filter((g) => {
        const l = glossLevel(g);
        return l === undefined || l === 'Flyers' || l === 'Key/PET';
    });
    const missing = glossed.filter((g) => !occurs(text, g, index));

    // New and recycled words against earlier lessons.
    // Earlier glossed lists hold inflected forms ("likes"), so compare lemmas.
    const lemmaOfWord = (w: string) => (w.includes(' ') ? w : index.lemmaOf(w));
    const priorTexts = ctx.prior.map((p) => analyse(p.paragraphs, index));
    const priorGlossed = [...new Set(ctx.prior.flatMap((p) => p.glossed.map(lemmaOfWord)))];
    const priorGlossedSet = new Set(priorGlossed);
    const seenBefore = (g: string) =>
        [...formsOf(g, index)].some((f) => priorGlossedSet.has(f)) || priorTexts.some((a) => occurs(a, g, index));
    const newWords = gStarters.filter((g) => !seenBefore(g));
    const ownForms = new Set(glossed.flatMap((g) => [...formsOf(g, index)]));
    const recycled = priorGlossed.filter((w) => !ownForms.has(w) && occurs(text, w, index)).sort();

    // Spelling and digits.
    const spellMap = profile.spelling === 'american' ? BRITISH_TO_AMERICAN : AMERICAN_TO_BRITISH;
    const wrongSpelling = [...new Set(text.tokens.map((t) => t.toLowerCase()).filter((t) => spellMap[t]))];
    const digits = [...new Set(joined.match(/\d+/g) ?? [])];

    const checks: CheckResult[] = [
        rangeCheck('words', 'Running words', words, profile.words),
        {
            id: 'paragraphs',
            label: 'Paragraphs',
            status: lesson.paragraphs.length === profile.paragraphs ? 'pass' : 'fail',
            value: String(lesson.paragraphs.length),
            target: String(profile.paragraphs),
        },
        rangeCheck('msl', 'Mean sentence length', msl, profile.meanSentenceLength, msl.toFixed(2)),
        {
            id: 'longest',
            label: 'Longest sentence',
            status: longest <= profile.longestSentence ? 'pass' : 'fail',
            value: String(longest),
            target: `${profile.longestSentence} or less`,
        },
        {
            id: 'starters',
            label: 'Starters words (names not counted)',
            status: shareWithoutNames >= profile.startersShare ? 'pass' : 'fail',
            value: `${(shareWithoutNames * 100).toFixed(1)}%`,
            target: `${Math.round(profile.startersShare * 100)}% or more`,
        },
        {
            id: 'gloss-count',
            label: 'Glossed words',
            status: glossed.length === profile.glossedCount ? 'pass' : 'fail',
            value: String(glossed.length),
            target: String(profile.glossedCount),
        },
        {
            id: 'gloss-starters',
            label: 'Glossed on Starters',
            status: gStarters.length >= profile.glossedStartersMin ? 'pass' : 'fail',
            value: String(gStarters.length),
            target: `${profile.glossedStartersMin} or more`,
        },
        {
            id: 'gloss-movers',
            label: 'Glossed on Movers',
            status: gMovers.length <= profile.glossedMoversMax ? 'pass' : 'fail',
            value: String(gMovers.length),
            target: `${profile.glossedMoversMax} or less`,
            detail: gMovers.length ? gMovers.join(', ') : undefined,
        },
        {
            id: 'gloss-above',
            label: 'Glossed above Movers',
            status: gAbove.length === 0 ? 'pass' : 'fail',
            value: String(gAbove.length),
            target: '0',
            detail: gAbove.length ? gAbove.map((g) => `${g} (${glossLevel(g) ?? 'not in graph'})`).join(', ') : undefined,
        },
        {
            id: 'gloss-in-text',
            label: 'Glossed words in the text',
            status: missing.length === 0 ? 'pass' : 'fail',
            value: `${glossed.length - missing.length} of ${glossed.length}`,
            target: 'all',
            detail: missing.length ? `missing: ${missing.join(', ')}` : undefined,
        },
        {
            id: 'new',
            label: 'New Starters words',
            // A target, not a gate: a good story comes before exact word order (Daniel, 2026-10-01).
            status: newWords.length >= profile.newStartersMin ? 'pass' : 'warn',
            value: String(newWords.length),
            target: `${profile.newStartersMin} or more`,
        },
        {
            id: 'recycled',
            label: 'Recycled words',
            status: recycled.length >= profile.recycledMin ? 'pass' : 'fail',
            value: String(recycled.length),
            target: `${profile.recycledMin} or more`,
        },
    ];
    if (lesson.recycle) {
        const notUsed = lesson.recycle.filter((w) => !occurs(text, w, index));
        checks.push({
            id: 'recycle-list',
            label: 'Brief recycle list',
            status: notUsed.length === 0 ? 'pass' : 'fail',
            value: `${lesson.recycle.length - notUsed.length} of ${lesson.recycle.length}`,
            target: 'all',
            detail: notUsed.length ? `missing: ${notUsed.join(', ')}` : undefined,
        });
    }
    checks.push(
        {
            id: 'questions',
            label: 'Question marks',
            status: questionMarks >= profile.questionMarksMin ? 'pass' : profile.book ? 'warn' : 'fail',
            value: String(questionMarks),
            target: `${profile.questionMarksMin} or more${profile.book ? ' (book rule)' : ''}`,
        },
        {
            id: 'digits',
            label: 'Numbers as digits',
            status: digits.length === 0 ? 'pass' : 'fail',
            value: String(digits.length),
            target: '0',
            detail: digits.length ? digits.join(', ') : undefined,
        },
        {
            id: 'spelling',
            label: `${profile.spelling === 'american' ? 'British' : 'American'} spellings`,
            status: wrongSpelling.length === 0 ? 'pass' : 'fail',
            value: String(wrongSpelling.length),
            target: '0',
            detail: wrongSpelling.length ? wrongSpelling.map((w) => `${w} → ${spellMap[w]}`).join(', ') : undefined,
        },
    );

    return {
        id: lesson.id,
        title: lesson.title,
        source: lesson.source,
        profile: profile.id,
        stats: {
            words,
            sentences: text.sentences.length,
            paragraphs: lesson.paragraphs.length,
            meanSentenceLength: msl,
            longestSentence: longest,
            longestSentenceText: longestText,
            startersShare: round2(share * 100) / 100,
            startersShareWithoutNames: round2(shareWithoutNames * 100) / 100,
            nameTokens,
            questionMarks,
            hasDialogue,
        },
        checks,
        nonStarters: [...nonStarters.values()].sort(
            (a, b) =>
                (a.level === 'not in graph' ? 9 : LEVEL_RANK[a.level]) - (b.level === 'not in graph' ? 9 : LEVEL_RANK[b.level]) ||
                a.word.localeCompare(b.word),
        ),
        allowed: [...allowed.entries()].map(([word, starts]) => ({ word, count: starts.size })).sort((a, b) => a.word.localeCompare(b.word)),
        names: [...usedNames].sort(),
        guessedNames: [...guessed].sort(),
        newWords,
        recycled,
    };
}

/**
 * Checks every lesson of a book in order. Each lesson's earlier lessons are `prior` plus the
 * lessons before it in the list. Then applies the book rules of the first profile that has them.
 * @param lessons The lessons in book order.
 * @param opts The index, earlier books, the profiles (default: PROFILES), and the default profile id.
 * @returns The book report.
 */
export function checkBook(
    lessons: LessonText[],
    opts: { index: VocabularyIndex; prior: LessonText[]; profiles?: Record<string, TextProfile>; defaultProfile?: string },
): BookReport {
    const profiles = opts.profiles ?? PROFILES;
    const reports = lessons.map((lesson, i) => {
        const id = lesson.profile ?? opts.defaultProfile ?? 'origins-3.2';
        const profile = profiles[id];
        if (!profile) throw new Error(`Unknown profile "${id}" in ${lesson.source}`);
        return checkLesson(lesson, { index: opts.index, prior: [...opts.prior, ...lessons.slice(0, i)], profile });
    });

    const bookProfile = reports.map((r) => profiles[r.profile]).find((p) => p.book);
    const checks: CheckResult[] = [];
    if (bookProfile?.book) {
        const rule = bookProfile.book;
        const inBook = reports.filter((r) => r.profile === bookProfile.id);
        const complete = inBook.length >= rule.lessons;
        const bookCheck = (id: string, label: string, n: number, min: number): CheckResult => ({
            id,
            label,
            status: !complete ? 'pending' : n >= min ? 'pass' : 'fail',
            value: complete ? `${n} of ${inBook.length} lessons` : `${n} of ${inBook.length} lessons so far`,
            target: `${min} of ${rule.lessons}`,
        });
        checks.push(
            bookCheck(
                'book-questions',
                `Lessons with ${bookProfile.questionMarksMin}+ question marks`,
                inBook.filter((r) => r.stats.questionMarks >= bookProfile.questionMarksMin).length,
                rule.questionLessonsMin,
            ),
            bookCheck('book-dialogue', 'Lessons with dialogue', inBook.filter((r) => r.stats.hasDialogue).length, rule.dialogueLessonsMin),
        );
    }
    return { lessons: reports, checks };
}
