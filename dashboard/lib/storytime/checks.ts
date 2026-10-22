import { schemaFailure, type PackageCheck, type PackageReport } from '../lesson-package/checks';
import type { CheckStatus } from '../text-profile/check';
import { programWeek, wordNeed, type PhonicsGraph } from './phonics';
import { GESTURES, NoteSchema, StorytimeWeekSchema, scriptIdsOf, storytimeKey, type StorytimeNote, type StorytimeWeek } from './schema';

/** The headings of a step note, in print order. */
const HEADINGS = Object.keys(NoteSchema.shape) as (keyof StorytimeNote)[];
const GESTURE_SET = new Set<string>(GESTURES);
const THAI = /[฀-๿]/;

const check = (id: string, label: string, problems: string[], failStatus: CheckStatus = 'fail'): PackageCheck => ({
    id,
    label,
    status: problems.length ? failStatus : 'pass',
    detail: problems.length ? problems.join('; ') : undefined,
});

/** Lower case, letters and digits only: "Hello, I am Nat!" and "hello i am nat" match. */
const stem = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Counts the song lines that carry the frame. The hook is the frame's first sentence ("Is it a ___?"
 * of "Is it a ___? Yes/No."); `___` matches one to three words. Case and punctuation do not count.
 * @param frame The frame of the week.
 * @param lines The song lines as sung.
 * @returns The number of lines with the hook.
 */
export function frameCount(frame: string, lines: string[]): number {
    const hook = frame.match(/^[^.?!]*/)?.[0] ?? frame;
    const parts = hook.split('___').map(stem);
    const pattern = parts.map((p) => escapeRe(p)).join(' ?[a-z0-9]+(?: [a-z0-9]+){0,2} ?');
    const re = new RegExp(`(^| )${pattern}( |$)`);
    return lines.filter((l) => re.test(stem(l))).length;
}

/** The letters and the tricky words that the books of a week can use. */
export interface TaughtSet {
    /** The graphemes of the elements taught to date (the letter spelling, when no phonics graph is given). */
    graphemes: string[];
    tricky: string[];
    /** The program week of the book (Level 2 week 1 = 33): with a phonics graph, the week that the parse must be taught by. */
    programWeek?: number;
}

/**
 * The graphemes and tricky words taught from Level 2 week 1 to a week, the week included (design §6.1,
 * cumulative rule). Level 1 teaches the letters by ear and has no decodable, so it does not count.
 * @param weeks The known weeks (the weeks after the week, and Level 1, are ignored).
 * @param week The week.
 * @returns The taught graphemes and tricky words.
 */
export function taughtTo(weeks: StorytimeWeek[], week: StorytimeWeek): TaughtSet {
    const { level } = week.meta;
    const earlier = weeks.filter((w) => w.meta.level >= 2 && (w.meta.level < level || (w.meta.level === level && w.meta.week < week.meta.week)));
    const before = [...earlier, week];
    return {
        graphemes: [...new Set(before.flatMap((w) => w.focus.element?.graphemes ?? []))],
        tricky: [...new Set(before.flatMap((w) => w.focus.trickyWords))],
        programWeek: programWeek(level, week.meta.week),
    };
}

export interface Decodability {
    running: number;
    decodable: number;
    tricky: number;
    /** The names in the text (excepted from the untaught words, counted against the ratio). */
    names: string[];
    /** The words that are not decodable, not taught tricky words, and not names; with a graph, "word (first untaught grapheme or cluster)". */
    untaught: string[];
    /** (decodable + tricky) / running. */
    ratio: number;
}

/**
 * The decodability of a text (design §5.6). With the phonics graph and a program week, a word is
 * decodable when the graph parse is taught by that week (`wordNeed`: the GPCs and the cluster rule);
 * without them, when the taught graphemes spell all of it. Case does not count.
 * @param text The text.
 * @param taught The taught graphemes, tricky words, and program week.
 * @param names The names that the book lists.
 * @param graph The phonics graph facts (`phonicsGraphFrom`).
 * @returns The counts, the names, the untaught words, and the ratio.
 */
export function decodability(text: string, taught: TaughtSet, names: string[] = [], graph?: PhonicsGraph): Decodability {
    const words = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
    const graphemes = taught.graphemes.map((g) => g.toLowerCase());
    const tricky = new Set(taught.tricky.map((t) => t.toLowerCase()));
    const nameSet = new Set(names);
    const spells = (word: string, i = 0): boolean => i === word.length || graphemes.some((g) => word.startsWith(g, i) && spells(word, i + g.length));
    const week = taught.programWeek;
    const need = (word: string) => (graph && week ? wordNeed(word, graph, week) : undefined);
    const isDecodable = (word: string) => {
        const n = need(word);
        return n ? n.week !== null && n.week <= week! : spells(word.toLowerCase());
    };
    const result: Decodability = { running: words.length, decodable: 0, tricky: 0, names: [], untaught: [], ratio: 1 };
    for (const word of words) {
        if (isDecodable(word)) result.decodable++;
        else if (tricky.has(word.toLowerCase())) result.tricky++;
        else if (nameSet.has(word)) result.names.push(word);
        else result.untaught.push(need(word) ? `${word} (${need(word)!.missing || 'not in the graph'})` : word);
    }
    if (words.length) result.ratio = (result.decodable + result.tricky) / words.length;
    return result;
}

/**
 * Checks one Storytime week against the design rules (design §3, §4, §6). A FAIL blocks approval;
 * a WARN marks a part that is not yet done (Thai, pictures) or a rule that the Storytime session
 * can waive.
 * @param input The week as read from disk (not yet parsed).
 * @param taught The graphemes and tricky words taught to this week (`taughtTo`); without it, the decodability check warns.
 * @param graph The phonics graph facts; without them, the decodability check spells letter by letter and says so.
 * @returns The report in the Primary package report format (`lesson` is the URL key).
 */
export function checkStorytimeWeek(input: unknown, taught?: TaughtSet, graph?: PhonicsGraph): PackageReport {
    const parsed = StorytimeWeekSchema.safeParse(input);
    if (!parsed.success) return schemaFailure(parsed.error.issues);
    const w = parsed.data;
    const { level, week, periodMinutes, openingMinutes } = w.meta;
    const teach = w.meta.kind === 'teach';
    const checks: PackageCheck[] = [check('schema', 'Package schema', [])];

    const key = storytimeKey(level, week);
    checks.push(check('key', 'URL key', w.meta.key === key ? [] : [`${w.meta.key}, not ${key}`]));

    // Scripts: one a day, in the order of the level.
    const ids = scriptIdsOf(level);
    const scriptProblems: string[] = [];
    if (w.scripts.length !== 5) scriptProblems.push(`${w.scripts.length} scripts, not 5`);
    const byDay = [...w.scripts].sort((a, b) => a.day - b.day);
    byDay.forEach((s, i) => {
        if (s.day !== i + 1) scriptProblems.push(`script ${s.id} on day ${s.day}: the days are not 1 to ${w.scripts.length}`);
        else if (s.id !== ids[i]) scriptProblems.push(`day ${s.day} is script ${s.id}, not ${ids[i]} (Level ${level})`);
    });
    checks.push(check('scripts', 'Five scripts, one a day', scriptProblems));

    const steps = w.scripts.flatMap((s) => s.steps.map((st) => ({ script: s.id, step: st })));
    checks.push(
        check(
            'minutes',
            'Opening and steps fill the period',
            w.scripts.flatMap((s) => {
                const main = s.steps.filter((st) => !st.moved).reduce((n, st) => n + st.minutes, 0);
                return openingMinutes + main === periodMinutes ? [] : [`${s.id}: ${openingMinutes} + ${main} = ${openingMinutes + main}, not ${periodMinutes}`];
            }),
        ),
    );
    checks.push(
        check(
            'step-ids',
            'Step ids',
            w.scripts.flatMap((s) => {
                const seen = new Set<string>();
                return s.steps.flatMap((st) => {
                    const p: string[] = [];
                    if (!st.id.startsWith(s.id)) p.push(`${st.id} is in script ${s.id}`);
                    if (seen.has(st.id)) p.push(`${st.id} twice`);
                    seen.add(st.id);
                    return p;
                });
            }),
        ),
    );
    checks.push(check('step-minutes', 'Every step in the period has minutes', steps.filter(({ step }) => !step.moved && step.minutes === 0).map(({ step }) => `${step.id} 0 min`)));
    if (level === 1) {
        // Four-year-olds move every 5 to 7 minutes; no step is longer than 8 (design §3.4).
        checks.push(check('step-length', 'Level 1 steps of 8 minutes or less', steps.filter(({ step }) => step.minutes > 8).map(({ step }) => `${step.id} ${step.minutes} min`)));
    }
    checks.push(
        check(
            'moved',
            'Steps moved to the next opening only in a 30-minute period',
            periodMinutes > 30 ? steps.filter(({ step }) => step.moved).map(({ step }) => step.id) : [],
            'warn',
        ),
    );

    // Focus.
    const family = w.focus.family.words.length;
    checks.push(check('family', 'Family of 6 to 8 picture words', teach && (family < 6 || family > 8) ? [`${family} words`] : []));
    const tricky = w.focus.trickyWords.length;
    checks.push(check('tricky', '3 or fewer new tricky words (design §3.2, A6)', tricky > 3 ? [`${tricky} words: ${w.focus.trickyWords.join(', ')}`] : [], 'warn'));

    // Books.
    const bookProblems: string[] = [];
    for (const kind of ['readalong', 'decodable'] as const) {
        const n = w.books.filter((b) => b.kind === kind).length;
        if (n > 1) bookProblems.push(`${n} ${kind} books`);
    }
    const readAlong = w.books.find((b) => b.kind === 'readalong');
    const decodable = w.books.find((b) => b.kind === 'decodable');
    if (level === 1 && decodable) bookProblems.push('Level 1 has no decodable');
    if (teach) {
        if (!readAlong) bookProblems.push('no read-along book');
        else if (level <= 3 ? readAlong.pages.length !== 8 : readAlong.pages.length < 8 || readAlong.pages.length > 12) {
            bookProblems.push(`read-along: ${readAlong.pages.length} pages, not ${level <= 3 ? '8' : '8 to 12'}`);
        }
        if (level >= 2 && !decodable) bookProblems.push('no decodable book');
        if (readAlong?.soundBook) bookProblems.push('a read-along is not a sound book');
        else if (decodable && decodable.pages.length !== 8) bookProblems.push(`decodable: ${decodable.pages.length} pages, not 8`);
    }
    checks.push(check('books', 'Books', bookProblems));
    if (decodable && !decodable.soundBook && level >= 2) {
        // Design §6.1: 90 percent or more of the running words decodable, no untaught word except names.
        if (!taught) checks.push(check('decodable', 'Decodable: 90 percent or more of the words, no untaught word', ['the earlier weeks are not given (check the level)'], 'warn'));
        else {
            const d = decodability([decodable.title, ...decodable.pages.map((p) => p.text)].join(' '), taught, decodable.names, graph);
            const how = graph && taught.programWeek ? `phonics graph, program week ${taught.programWeek}` : 'letter spelling: no phonics graph';
            const names = d.names.length ? `; names: ${[...new Set(d.names)].join(', ')}` : '';
            const problems = [
                ...(d.ratio < 0.9 ? [`${Math.floor(d.ratio * 100)} percent of ${d.running} words`] : []),
                ...(d.untaught.length ? [`untaught: ${[...new Set(d.untaught)].join(', ')}`] : []),
            ];
            checks.push(check('decodable', `Decodable: 90 percent or more of the words, no untaught word (${how}${names})`, problems));
        }
    }

    // Song.
    if (teach) {
        const lines = w.song?.lines.map((l) => l.text) ?? [];
        const n = frameCount(w.focus.frame, lines);
        checks.push(check('song-frame', 'The frame 8 or more times in the song', !w.song ? ['no song'] : n < 8 ? [`${n} times`] : []));
    }
    if (w.song) {
        // A part in parentheses is how the line is sung (claps, an echo), so it can differ from the sheet.
        const base = (x: string) => x.replace(/\s*\([^)]*\)/g, '').trim();
        const sheet = w.song.lyricSheet.split('\n').map((x) => x.trim()).filter((x) => x && !/^\[[a-z -]+\]$/i.test(x)).map(base);
        const sung = w.song.lines.map((x) => base(x.text));
        const differ = sheet.findIndex((x, i) => x !== sung[i]);
        checks.push(
            check(
                'song-sheet',
                'The sung lines follow the lyric sheet (a generated song can differ: then the lines follow the audio)',
                !w.song.lyricSheet ? [] : differ >= 0 ? [`line ${differ + 1}: "${sheet[differ]}" in the sheet, "${sung[differ] ?? '(none)'}" in the lines`] : sheet.length !== sung.length ? [`${sheet.length} sheet lines, ${sung.length} song lines`] : [],
                'warn',
            ),
        );
        checks.push(check('song-gestures', 'A gesture of the 24 on every song line', w.song.lines.filter((l) => !GESTURE_SET.has(l.gesture)).map((l) => `"${l.text}": ${l.gesture}`)));
        const lines = w.song.lines;
        const badRefs = lines.flatMap((l, i) =>
            l.imageOf === undefined ? [] : l.imageOf >= i || !lines[l.imageOf].image ? [`line ${i + 1} imageOf ${l.imageOf}: not an earlier line with a picture`] : [],
        );
        checks.push(check('song-picture-refs', 'imageOf names an earlier line with a picture', badRefs));
        const missing = lines.flatMap((l, i) => (l.image || l.imageOf !== undefined ? [] : [`line ${i + 1} "${l.text}"`]));
        checks.push(check('song-pictures', 'A picture for every song line (S9)', missing, 'warn'));
    }

    // Thai.
    const lineProblems: string[] = [];
    let thaiMissing = 0;
    for (const { step } of steps) {
        if (!step.th) {
            thaiMissing++;
            continue;
        }
        for (const h of HEADINGS) {
            if (step.th[h].length !== step.en[h].length) lineProblems.push(`${step.id} ${h}: ${step.th[h].length} Thai, ${step.en[h].length} English`);
        }
        if (!HEADINGS.some((h) => step.th![h].some((l) => THAI.test(l)))) lineProblems.push(`${step.id}: no Thai character`);
    }
    checks.push(check('thai-lines', 'Thai notes have the English line counts', lineProblems));
    const { element, paSkill, family: focusFamily } = w.focus;
    const songNotes = w.song ? [...w.song.lines.flatMap((x) => (x.note ? [x.note] : [])), ...[w.song.choreography.intro, w.song.choreography.outro].filter((x) => x !== undefined)] : [];
    const bi = [
        ...(element ? [element.action] : []),
        paSkill,
        focusFamily.name,
        ...steps.flatMap(({ step }) => [step.title, step.easier, step.harder, step.group]),
        ...w.scripts.flatMap((s) => [s.title, ...s.prep]),
        ...songNotes,
        ...(w.home ? [w.home.line, w.home.activity] : []),
    ];
    const noThai = bi.filter((t) => !t.th).length;
    checks.push(check('thai', 'Thai written (Daniel checks it)', thaiMissing || noThai ? [`${thaiMissing} of ${steps.length} step notes and ${noThai} of ${bi.length} lines have no Thai`] : [], 'warn'));

    // Review strips: one a day, 18 cards or fewer, only items already taught (design §4).
    const reviewProblems: string[] = [];
    const days = new Set(w.review.map((s) => s.day));
    if (days.size !== w.review.length) reviewProblems.push('a day has two strips');
    for (let d = 1; d <= 5; d++) if (!days.has(d)) reviewProblems.push(`no strip for day ${d}`);
    for (const s of w.review) {
        if (s.cards.length > 18) reviewProblems.push(`day ${s.day}: ${s.cards.length} cards`);
        for (const c of s.cards) if (c.week > week) reviewProblems.push(`day ${s.day}: "${c.text}" is from week ${c.week}`);
    }
    checks.push(check('review', 'Review strips', reviewProblems));

    if (teach) {
        checks.push(check('check', 'Friday check (E5)', w.check.items.length ? [] : ['no items'], 'warn'));
        if (!w.home) checks.push(check('home', 'Home card', ['no home card']));
        else checks.push(check('home', 'Home card with 3 words', w.home.words.length === 3 ? [] : [`${w.home.words.length} words`], 'warn'));
    }

    // A published week is on the public page: every part approved, no failed check.
    if (w.meta.status === 'published') {
        const draft = Object.entries(w.approval).filter(([, a]) => a.status !== 'approved').map(([part]) => `${part} not approved`);
        const failed = checks.filter((c) => c.status === 'fail').map((c) => `${c.id} fails`);
        checks.push(check('published', 'Published only when approved and clean', [...draft, ...failed]));
    }

    return { lesson: w.meta.key, title: w.meta.title, checks };
}
