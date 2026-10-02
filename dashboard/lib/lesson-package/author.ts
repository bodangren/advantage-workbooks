import { createHash } from 'crypto';
import type { LessonPackage, LessonPackageInput } from './schema';
import type { VocabularyIndex } from '../text-profile/vocabulary';
import { tokenize } from '../text-profile/text';

/**
 * The authoring format (track level_banks_20261002): one short text file per lesson that a writer
 * (Claude or a subagent) fills, and that `scripts/author-package.ts` turns into a lesson package.
 * English and Thai stand on one line per sentence, so the Thai part always matches the text. The
 * converter finds the glossary examples, maps evidence references to sentences, and shuffles the MCQ
 * options. Format: `content/primary/AUTHORING.md`.
 */

/** The app's level table (index + 1 = `ra_level`). */
export const CEFR_BY_LEVEL = ['A0-', 'A0', 'A0+', 'A1-', 'A1', 'A1+', 'A2-', 'A2', 'A2+'];

/** The URL-key prefix of each book folder (Origins 3.2 plan, decision D1). */
export const BOOK_KEYS: Record<string, string> = {
    'origins-1': 'o1',
    'origins-3.1': 'o3-1',
    'origins-3.2': 'o3-2',
    'quest-4': 'q4',
};

/** The default text profile of each book folder. */
export const BOOK_PROFILES: Record<string, string> = {
    'origins-1': 'origins-1',
    'origins-3.2': 'origins-3.2',
    'quest-4': 'quest-4',
};

/** mmx voices (content/primary/README.md). */
export const NARRATOR = { female: 'English_captivating_female1', male: 'English_magnetic_voiced_man' } as const;

const IMAGE_POSITIONS = ['hero', 'vocabulary', 'inline-para-1', 'inline-para-2', 'inline-para-3', 'writing-prompt'];

export interface AuthorSource {
    book: string;
    lesson: string;
}

export interface AuthorResult {
    pkg?: LessonPackageInput;
    errors: string[];
}

const split = (line: string) => line.split('|').map((s) => s.trim());
const list = (value: string | undefined, sep = ',') => (value ?? '').split(sep).map((s) => s.trim()).filter(Boolean);

/** Splits the file into front matter (key: value) and `## Section` bodies (lines). */
function sections(source: string): { front: Record<string, string>; parts: Record<string, string[]>; errors: string[] } {
    const errors: string[] = [];
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const front: Record<string, string> = {};
    let i = 0;
    if (lines[0]?.trim() === '---') {
        i = 1;
        for (; i < lines.length && lines[i].trim() !== '---'; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            const m = line.match(/^([a-z_]+):\s*(.*)$/);
            // A note after three spaces, in brackets, is not part of the value (AUTHORING.md shows notes so).
            if (m) front[m[1]] = m[2].replace(/\s{3,}\(.*\)\s*$/, '').trim();
            else errors.push(`front matter: cannot read "${line.trim()}"`);
        }
        i++;
    } else errors.push('no front matter (the file must start with ---)');
    const parts: Record<string, string[]> = {};
    let current: string | undefined;
    for (; i < lines.length; i++) {
        const m = lines[i].match(/^##\s+(.+?)\s*$/);
        if (m) {
            current = m[1].toLowerCase();
            parts[current] = [];
        } else if (current) parts[current].push(lines[i]);
    }
    return { front, parts, errors };
}

/** A small stable number from a string, for the option shuffle. */
function seed(s: string): number {
    return parseInt(createHash('sha256').update(s).digest('hex').slice(0, 8), 16);
}

/**
 * The four options in a stable shuffled order, so the answer is not always first.
 * @param options The options as written.
 * @param key A stable key (book, lesson, question id).
 * @returns The options in the new order.
 */
export function shuffleOptions(options: string[], key: string): string[] {
    const out = [...options];
    let s = seed(key);
    for (let i = out.length - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) % 2 ** 31;
        const j = s % (i + 1);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/**
 * The first sentence that holds the word or phrase in some form ("runs" for "run", "feet" for "foot").
 * @param word The glossed word.
 * @param sentences The text sentences.
 * @param index The vocabulary index (lemmas and sibling forms).
 * @returns The sentence, or undefined.
 */
export function findExample(word: string, sentences: string[], index: VocabularyIndex): string | undefined {
    const parts = tokenize(word.toLowerCase());
    if (!parts.length) return undefined;
    const formsOf = (w: string) => new Set([w, ...index.siblingsOf(w), ...index.siblingsOf(index.lemmaOf(w))]);
    const partForms = parts.map(formsOf);
    for (const s of sentences) {
        const keys = tokenize(s).map((t) => new Set([t.toLowerCase(), index.lemmaOf(t)]));
        for (let i = 0; i + parts.length <= keys.length; i++) {
            if (partForms.every((forms, j) => [...keys[i + j]].some((k) => forms.has(k)))) return s;
        }
    }
    return undefined;
}

/**
 * The graph nodes of a glossed word, narrowed to its part of speech when a node has it
 * (`kite.noun`); all of the word's nodes when none matches.
 * @param word The glossed word.
 * @param pos The glossary part of speech, for example `noun`.
 * @param nodesOf All graph node ids of a word.
 * @returns Node ids.
 */
export function nodesForSense(word: string, pos: string | undefined, nodesOf: (word: string) => string[]): string[] {
    const all = nodesOf(word);
    if (!pos) return all;
    const exact = all.filter((id) => id.endsWith(`.${pos.toLowerCase()}`));
    return exact.length ? exact : all;
}

/**
 * Turns one authoring file into a package input. Media, approvals, and database ids are not in the
 * source; the script carries them over from the saved package.
 * @param source The file text.
 * @param where The book folder and lesson file name.
 * @param index The vocabulary index.
 * @param nodesOf Graph node ids of a glossed word (for `tags.glossedNodes`).
 * @returns The package input, or the errors.
 */
export function parseAuthorSource(
    source: string,
    where: AuthorSource,
    index: VocabularyIndex,
    nodesOf: (word: string) => string[],
): AuthorResult {
    const { front, parts, errors } = sections(source);
    const need = (k: string) => {
        if (!front[k]) errors.push(`front matter: "${k}" is missing`);
        return front[k] ?? '';
    };
    const bank = where.book.startsWith('bank-');
    const levelText = front.level ?? (bank ? where.book.slice(5) : '');
    const level = Number(levelText);
    if (!(level >= 1 && level <= CEFR_BY_LEVEL.length)) errors.push(`front matter: "level" must be 1 to ${CEFR_BY_LEVEL.length}`);
    const number = Number(front.number ?? where.lesson.replace(/\D/g, ''));
    if (!(number >= 1)) errors.push('front matter: "number" is missing');
    const profile = front.profile ?? BOOK_PROFILES[where.book] ?? (bank ? where.book : '');
    if (!profile) errors.push('front matter: "profile" is missing');
    const type = front.type ?? 'fiction';
    if (type !== 'fiction' && type !== 'nonfiction') errors.push('front matter: "type" must be fiction or nonfiction');
    const voice = front.voice ?? 'female';
    if (voice !== 'female' && voice !== 'male') errors.push('front matter: "voice" must be female or male');

    // Text and Thai: one "English | Thai" line per sentence; a blank line ends a paragraph.
    const paragraphs: { en: string; th: string }[][] = [];
    let para: { en: string; th: string }[] = [];
    for (const line of parts.text ?? []) {
        if (!line.trim()) {
            if (para.length) paragraphs.push(para);
            para = [];
            continue;
        }
        const [en, th, ...rest] = split(line);
        if (!en || th === undefined || rest.length) errors.push(`text: "${line.trim()}" must be "English | Thai"`);
        else para.push({ en, th });
    }
    if (para.length) paragraphs.push(para);
    if (!paragraphs.length) errors.push('text: no sentences');
    const sentences = paragraphs.flat().map((p) => p.en);
    const sentenceAt = (ref: string): string | undefined => {
        const m = ref.match(/^@(\d+)(?:\.(\d+))?$/);
        if (!m) return undefined;
        if (m[2]) return paragraphs[Number(m[1]) - 1]?.[Number(m[2]) - 1]?.en;
        return sentences[Number(m[1]) - 1];
    };

    const glossed = list(front.glossed);
    const glossary = (parts.glossary ?? [])
        .filter((l) => l.trim())
        .map((line) => {
            const [word, pos, definition, thai, example] = split(line);
            if (!word || !pos || !definition || !thai) errors.push(`glossary: "${line.trim()}" must be "word | part of speech | definition | Thai"`);
            const found = example ? (sentenceAt(example) ?? example) : findExample(word ?? '', sentences, index);
            if (!found) errors.push(`glossary: no sentence holds "${word}"; add the sentence as a fifth field`);
            return { word: word ?? '', pos: pos ?? '', definition: definition ?? '', thai: thai ?? '', example: found ?? '' };
        });

    const objectives = (s: string | undefined) => list(s);
    const mcq = (parts.mcq ?? [])
        .filter((l) => l.trim())
        .map((line) => {
            const f = split(line);
            if (f.length !== 8) errors.push(`mcq: "${line.trim()}" must have 8 fields: id | question | 4 options | evidence | objectives`);
            const [id, question, a, b, c, d, evidence, objs] = f;
            const raw = [a, b, c, d].filter((o) => o !== undefined);
            const marked = raw.filter((o) => o.startsWith('*'));
            if (marked.length !== 1) errors.push(`mcq ${id}: mark exactly one option with *`);
            const options = raw.map((o) => o.replace(/^\*\s*/, ''));
            const answer = (marked[0] ?? '').replace(/^\*\s*/, '');
            const ev = sentenceAt(evidence ?? '') ?? evidence ?? '';
            return {
                id: id ?? '',
                question: question ?? '',
                options: shuffleOptions(options, `${where.book}/${where.lesson}/${id}`),
                answer,
                evidence: ev,
                objectives: objectives(objs),
            };
        });
    const saq = (parts.saq ?? [])
        .filter((l) => l.trim())
        .map((line) => {
            const [id, question, answer, objs, ...rest] = split(line);
            if (!id || !question || !answer || rest.length) errors.push(`saq: "${line.trim()}" must be "id | question | answer | objectives"`);
            return { id: id ?? '', question: question ?? '', answer: answer ?? '', objectives: objectives(objs) };
        });
    const laq = (parts.laq ?? [])
        .filter((l) => l.trim())
        .map((line) => {
            const [id, question, objs, ...rest] = split(line);
            if (!id || !question || rest.length) errors.push(`laq: "${line.trim()}" must be "id | question | objectives"`);
            return { id: id ?? '', question: question ?? '', objectives: objectives(objs) };
        });

    const images = (parts.images ?? [])
        .filter((l) => l.trim())
        .map((line) => {
            const [position, chars, prompt, caption, overlay] = split(line);
            if (!IMAGE_POSITIONS.includes(position)) errors.push(`images: unknown position "${position}" (use ${IMAGE_POSITIONS.join(', ')})`);
            if (!prompt) errors.push(`images: "${line.trim()}" must be "position | characters | prompt | caption"`);
            return {
                position: position as LessonPackage['images'][number]['position'],
                characters: chars === '-' ? [] : list(chars),
                prompt: prompt ?? '',
                caption: caption ?? '',
                overlay: list(overlay, ';').map((text) => ({ text })),
                candidates: [],
            };
        });

    // Workbook parts.
    const kv = (lines: string[] | undefined) => {
        const out: Record<string, string> = {};
        for (const l of lines ?? []) {
            const m = l.match(/^([a-z]+):\s*(.*)$/);
            if (m) out[m[1]] = m[2].trim();
            else if (l.trim()) errors.push(`cannot read "${l.trim()}" (use "name: value")`);
        }
        return out;
    };
    const p = kv(parts.print);
    const a = kv(parts.activities);
    const fill = list(a.fill, ';').map((item) => {
        const [sentence, answer] = item.split('=').map((s) => s.trim());
        if (!sentence || !answer) errors.push(`activities: fill item "${item}" must be "sentence with ___ = answer"`);
        return { sentence: sentence ?? '', answer: answer ?? '' };
    });

    const meta = {
        book: where.book,
        lesson: where.lesson.toUpperCase(),
        number,
        key: front.key ?? `${BOOK_KEYS[where.book] ?? where.book}/${number}`,
        title: need('title'),
        raLevel: level,
        cefrLevel: CEFR_BY_LEVEL[level - 1] ?? '',
        textType: need('text_type'),
        genre: need('genre'),
        profile,
        ...(front.brief ? { brief: front.brief } : {}),
        appType: type as 'fiction' | 'nonfiction',
        role: (bank ? 'bank' : 'workbook') as 'bank' | 'workbook',
        ...(front.replaces ? { replaces: front.replaces } : {}),
    };
    const recycle = list(front.recycle);
    const pkg: LessonPackageInput = {
        version: 1,
        meta,
        text: {
            paragraphs: paragraphs.map((ps) => ps.map((s) => s.en).join(' ')),
            summary: need('summary'),
            glossed,
            recycle,
            allow: list(front.allow),
            names: list(front.names),
        },
        glossary,
        bank: { mcq, saq, laq },
        thai: { paragraphs: paragraphs, summary: need('summary_th') },
        images,
        audio: { voice: NARRATOR[voice as 'female' | 'male'] ?? NARRATOR.female, teacherVoice: NARRATOR.female, sentences: [], wordTimes: [], flashcardTimes: [] },
        tags: {
            targetObjectives: objectives(front.objectives),
            supportingObjectives: objectives(front.supporting),
            glossedNodes: [...new Set(glossed.flatMap((w) => nodesForSense(w, glossary.find((g) => g.word.toLowerCase() === w.toLowerCase())?.pos, nodesOf)))],
            recycledNodes: [...new Set(recycle.flatMap(nodesOf))],
        },
    };
    if (!bank) {
        pkg.print = {
            mcq: list(p.mcq),
            saq: p.saq ?? '',
            ...(p.hint ? { saqHint: p.hint } : {}),
            mcqOptions: p.options ? Number(p.options) : 3,
        };
        pkg.activities = {
            sentenceStarters: list(a.starters, ';'),
            vocabFill: fill,
            sentenceOrder: list(a.order, ';'),
            sentenceCompletion: list(a.completion, ';'),
            writingPrompt: a.writing ?? '',
            writingFrames: list(a.frames, ';'),
        };
    } else if (parts.print || parts.activities) errors.push('a bank article has no Print or Activities section');
    return errors.length ? { errors } : { pkg, errors };
}

/**
 * Carries the made media over from the saved package: a picture when its position, prompt, and
 * characters did not change, and the audio when the sentences and the glossed words did not change.
 * @param next The new package input (changed in place).
 * @param old The saved package, if any.
 */
export function carryMedia(next: LessonPackageInput, old: LessonPackage | undefined): void {
    if (!old) return;
    next.images = (next.images ?? []).map((img) => {
        const before = old.images.find((o) => o.position === img.position);
        const same = before && before.prompt === img.prompt && JSON.stringify(before.characters) === JSON.stringify(img.characters);
        if (!same) return img;
        return { ...img, file: before.file, candidates: before.candidates, chosenFrom: before.chosenFrom, redo: before.redo };
    });
    const sentences = (p: { thai: { paragraphs: { en: string }[][] } }) => JSON.stringify(p.thai.paragraphs.map((ps) => ps.map((s) => s.en)));
    const words = (g: { word: string }[]) => JSON.stringify(g.map((x) => x.word));
    const nextThai = next.thai as { paragraphs: { en: string }[][] };
    if (old.audio.article && sentences(old) === sentences({ thai: nextThai }) && words(old.glossary) === words(next.glossary ?? [])) {
        next.audio = { ...old.audio, voice: next.audio?.voice ?? old.audio.voice, teacherVoice: next.audio?.teacherVoice ?? old.audio.teacherVoice };
    }
    next.approval = old.approval;
}
