import { schemaFailure, type PackageCheck, type PackageReport } from '../lesson-package/checks';
import type { CheckStatus } from '../text-profile/check';
import { bankSound, soundLabels } from './phonemes';
import { programWeek, wordNeed, type PhonicsGraph } from './phonics';
import { checkStorytimePrintText } from './print/text-check';
import { GESTURES, NoteSchema, STORYTIME_LOOPS_PART, STORYTIME_PRINT_PART, StorytimeWeekSchema, scriptIdsOf, storytimeKey, type StorytimeCheckItem, type StorytimeNote, type StorytimeStep, type StorytimeWeek } from './schema';

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
    const tokenPattern = (part: string) =>
        part.split(' ').filter(Boolean).map((word) => (word === 'a' ? '(?:a|an)' : escapeRe(word))).join(' ');
    const pattern = parts.map(tokenPattern).join(' [a-z0-9]+(?: [a-z0-9]+){0,2} ').trim();
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
 * @param others The other weeks of the level: a review week checks its medley and its reading-record books against them.
 * @returns The report in the Primary package report format (`lesson` is the URL key).
 */
export function checkStorytimeWeek(input: unknown, taught?: TaughtSet, graph?: PhonicsGraph, others?: StorytimeWeek[]): PackageReport {
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
    const familyMax = w.focus.family.max;
    checks.push(check('family', `Family of 6 to ${familyMax} picture words`, teach && (family < 6 || family > familyMax) ? [`${family} words`] : []));
    if (teach) checks.push(check('opening-pa', 'Sound game in the opening, one line a day (opening.pa)', w.opening ? [] : ['no opening.pa lines'], 'warn'));
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
    for (const book of w.books) {
        if (book.soundBook && !(book.kind === 'decodable' && level === 2 && week === 1)) {
            bookProblems.push(`${book.kind} sound book is allowed only on the Level 2 week 1 decodable`);
        }
    }
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
    if (decodable && level >= 2 && !(decodable.soundBook && level === 2 && week === 1)) {
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
    const sitting = w.benchmark?.oneToOne;
    if (sitting?.th) {
        for (const h of HEADINGS) if (sitting.th[h].length !== sitting.en[h].length) lineProblems.push(`benchmark ${h}: ${sitting.th[h].length} Thai, ${sitting.en[h].length} English`);
    }
    checks.push(check('thai-lines', 'Thai notes have the English line counts', lineProblems));
    const { element, paSkill, family: focusFamily } = w.focus;
    const songNotes = w.song ? [...w.song.lines.flatMap((x) => (x.note ? [x.note] : [])), ...[w.song.choreography.intro, w.song.choreography.outro].filter((x) => x !== undefined)] : [];
    const bi = [
        ...(element ? [element.action] : []),
        paSkill,
        focusFamily.name,
        ...(w.opening?.pa ?? []),
        ...steps.flatMap(({ step }) => [step.title, step.easier, step.harder, step.group]),
        ...w.scripts.flatMap((s) => [s.title, ...s.prep]),
        ...songNotes,
        ...(w.home ? [w.home.line, w.home.activity] : []),
        ...(w.block?.days.flatMap((d) => (d.note ? [d.note] : [])) ?? []),
        ...(w.benchmark ? [w.benchmark.title, w.benchmark.paper.pass] : []),
    ];
    const noThai = bi.filter((t) => !t.th).length;
    // The benchmark sitting is a note with the four headings, as a step is.
    const notes = steps.length + (sitting ? 1 : 0);
    const notesMissing = thaiMissing + (sitting && !sitting.th ? 1 : 0);
    checks.push(check('thai', 'Thai written (Daniel checks it)', notesMissing || noThai ? [`${notesMissing} of ${notes} step notes and ${noThai} of ${bi.length} lines have no Thai`] : [], 'warn'));

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
        checks.push(check('check-answers', 'Friday check: each answer is one of the choices', wrongAnswers(w.check.items)));
        if (!w.home) checks.push(check('home', 'Home card', ['no home card']));
        else checks.push(check('home', 'Home card with 3 words', w.home.words.length === 3 ? [] : [`${w.home.words.length} words`], 'warn'));
    }

    if (w.meta.kind === 'review') checks.push(...reviewChecks(w, taught, others));

    // The print text of the week (FR-1.2): the print block against the script steps. A week
    // without a block gets the print-missing WARN, so weeks 2 to 8 do not fail while they wait
    // for their blocks (Phase 7).
    checks.push(...checkStorytimePrintText(w));

    // The teaching loops (loops FR-8): Levels 2 to 4 only. They come before the published block, so that
    // a loop check with the status `fail` (the Phase 3 switch) also blocks a published week.
    if (level >= 2) checks.push(...loopChecks(w, taught, others));

    // The parent-share moment of each day (share FR-14): Levels 2 to 4 only, teach weeks and review
    // weeks. It comes before the published block, so that a `fail` after the switch also blocks a week.
    if (level >= 2) checks.push(shareCheck(w));

    // A published week is on the public page: every app part approved, no failed check. The
    // print part stays out (rule G5): the print approval is its own later gate. The loops part
    // stays out too: it gates the routines in the app, not the publication of the week.
    if (w.meta.status === 'published') {
        const draft = Object.entries(w.approval)
            .filter(([part, a]) => part !== STORYTIME_PRINT_PART && part !== STORYTIME_LOOPS_PART && a.status !== 'approved')
            .map(([part]) => `${part} not approved`);
        const failed = checks.filter((c) => c.status === 'fail').map((c) => `${c.id} fails`);
        checks.push(check('published', 'Published only when approved and clean', [...draft, ...failed]));
    }

    return { lesson: w.meta.key, title: w.meta.title, checks };
}

/**
 * The status of a loop check that finds a problem (loops FR-8, D12): `warn` from Phase 1 to Phase 3, so
 * that the shipped weeks did not fail the gate before their content existed. The Phase 3 switch task set it to
 * `fail`. A part that a check could not test still has the status `warn` (see `loopCheck`).
 */
export const LOOP_CHECK_STATUS: CheckStatus = 'fail';

/** The steps that hold a routine (loops spec Terms: "loop step"). Only these may change their minutes. */
const LOOP_STEP_IDS = ['A1', 'A2', 'A3', 'A4', 'A6', 'C5', 'D2'];
/** The fewest minutes of a loop step (loops FR-7). */
const LOOP_STEP_MIN = 2;
/** The recall items of one day (loops FR-6). */
const RECALL_COUNT = 5;

/**
 * A loop check. A part that the check could not test (a missing argument) is named in the label. Such a
 * part never passes: when nothing else is wrong, the check reports "not checked" with the status `warn`, at
 * any `LOOP_CHECK_STATUS`, as the `decodable` check does when the earlier weeks are not given. A real
 * problem keeps the status of the loop checks.
 * @param id The check id.
 * @param label The check label.
 * @param problems The problems that the check found.
 * @param skipped The parts that the check could not test.
 * @param status The status of a real problem; the default is `LOOP_CHECK_STATUS`.
 * @returns The check: `pass` with no problem and nothing skipped, `warn` with only skipped parts, else `status`.
 */
export function loopCheck(id: string, label: string, problems: string[], skipped: string[] = [], status: CheckStatus = LOOP_CHECK_STATUS): PackageCheck {
    const note = skipped.length ? `not checked: ${skipped.join('; ')}` : '';
    return check(id, note ? `${label} (${note})` : label, problems.length || !note ? problems : [note], problems.length ? status : 'warn');
}

/** The English text of a step, as the loops spec defines "the text of a day". */
const stepText = (st: StorytimeStep): string[] => [st.title.en, ...HEADINGS.flatMap((h) => st.en[h]), st.easier.en, st.harder.en, st.group.en];

/** The stemmed text of a list of lines, with a space at each end, so that ` word ` matches a whole word. */
const padded = (lines: string[]): string => ` ${stem(lines.join(' '))} `;

/**
 * The six loop checks of a week (loops FR-2 to FR-7). A teach week runs all six. A review week runs
 * `loops-recall` and `loops-minutes` only (loops D11).
 * @param w The parsed week of Level 2 to 4.
 * @param taught The graphemes and tricky words taught to the week; without it, the sound rules are not tested.
 * @param others The other weeks of the level and of earlier levels; without them, the frames and words of earlier weeks are not tested.
 * @returns The checks, in the order of the loops spec.
 */
function loopChecks(w: StorytimeWeek, taught?: TaughtSet, others?: StorytimeWeek[]): PackageCheck[] {
    const steps = w.scripts.flatMap((s) => s.steps);
    const stepOf = (id: string) => steps.find((st) => st.id === id);
    const out: PackageCheck[] = [];

    if (w.meta.kind === 'teach') {
        // FR-2: the drill sits on A4; each drill sound is a taught grapheme or a sound of the opening game (Q1).
        const drill = stepOf('A4')?.blendDrill;
        const blendProblems: string[] = [];
        const blendSkipped: string[] = [];
        if (!drill) blendProblems.push('A4 has no blendDrill');
        else if (!taught) blendSkipped.push('the drill sounds, because the taught set is not given');
        else {
            const allowed = new Set([...taught.graphemes, ...(w.opening?.pa.flatMap((line) => soundLabels(line.en)) ?? [])].map(bankSound));
            for (const { word, sounds } of drill.words) {
                const untaught = sounds.filter((s) => !allowed.has(bankSound(s)));
                if (untaught.length) blendProblems.push(`"${word}": ${untaught.join(', ')} not taught and not in the opening game`);
            }
        }
        out.push(loopCheck('loops-blend', 'A4 has a blend drill; each drill sound is taught or in the opening game', blendProblems, blendSkipped));

        // FR-3: a soundLoop on each sound step.
        out.push(loopCheck('loops-sound', 'A1, A2, and A3 have a sound loop', ['A1', 'A2', 'A3'].filter((id) => !stepOf(id)?.soundLoop).map((id) => `${id} has no soundLoop`)));

        // FR-4: sightWords on A6 and D2 equal the tricky words, in order; no tricky word, no sightWords.
        const tricky = w.focus.trickyWords;
        const sightProblems = ['A6', 'D2'].flatMap((id) => {
            const sight = stepOf(id)?.sightWords;
            if (!tricky.length) return sight ? [`${id} has sightWords, and the week has no tricky words`] : [];
            if (!sight) return [`${id} has no sightWords`];
            return sight.words.join(',') === tricky.join(',') ? [] : [`${id}: sight words (${sight.words.join(', ')}) are not the tricky words (${tricky.join(', ')}) in order`];
        });
        out.push(loopCheck('loops-sight', 'A6 and D2 have the sight words of the week, in order', sightProblems));

        // FR-5: three questions in the order who, what, where; the answer is a whole word of the 1-based page.
        const readAlong = w.books.find((b) => b.kind === 'readalong');
        const questionProblems: string[] = [];
        if (!readAlong) questionProblems.push('no read-along book');
        else if (!readAlong.questions) questionProblems.push('the read-along has no questions');
        else {
            const kinds = readAlong.questions.map((q) => q.kind);
            if (kinds.join(',') !== 'who,what,where') questionProblems.push(`the questions are ${kinds.join(', ')}, not who, what, where`);
            for (const q of readAlong.questions) {
                const { page, word } = q.answer;
                if (page < 1 || page > readAlong.pages.length) questionProblems.push(`${q.kind}: page ${page} of ${readAlong.pages.length}`);
                else if (!padded([readAlong.pages[page - 1].text]).includes(` ${stem(word)} `)) questionProblems.push(`${q.kind}: "${word}" is not a word of page ${page}`);
            }
        }
        out.push(loopCheck('loops-questions', 'The read-along has who, what, and where questions with an answer on a page', questionProblems));
    }

    out.push(recallCheck(w, taught, others));
    out.push(minutesCheck(w, steps));
    return out;
}

/**
 * The check `loops-recall` (loops FR-6): 5 items a day, no repeat in a day, no item from a later week, and each
 * item in the taught set of its kind. Day 1 of Level 2 week 1 needs no recall (D6), but a recall there is tested.
 */
function recallCheck(w: StorytimeWeek, taught?: TaughtSet, others?: StorytimeWeek[]): PackageCheck {
    const { level, week } = w.meta;
    const earlier = (others ?? []).filter((o) => o.meta.level >= 2 && (o.meta.level < level || (o.meta.level === level && o.meta.week < week)));
    const graphemes = new Set((taught?.graphemes ?? []).map((g) => g.toLowerCase()));
    const trickyWords = new Set((taught?.tricky ?? []).map((t) => t.toLowerCase()));
    const frames = new Set([w.focus.frame, ...earlier.map((o) => o.focus.frame)].map(stem));
    const earlierWeeks = padded(earlier.flatMap((o) => o.scripts.flatMap((s) => s.steps.flatMap(stepText))));
    const problems: string[] = [];
    const skipped = new Set<string>();

    for (const script of w.scripts) {
        const day = `day ${script.day}`;
        if (!script.recall) {
            if (!(level === 2 && week === 1 && script.day === 1)) problems.push(`${day}: no recall`);
            continue;
        }
        const { items } = script.recall;
        if (items.length !== RECALL_COUNT) problems.push(`${day}: ${items.length} recall items, not ${RECALL_COUNT}`);
        const earlierDays = padded(w.scripts.filter((s) => s.day < script.day).flatMap((s) => s.steps.flatMap(stepText)));
        const seen = new Set<string>();
        for (const item of items) {
            const name = `${day}: "${item.text}" (${item.kind})`;
            const key = `${item.kind}|${stem(item.text)}`;
            if (seen.has(key)) problems.push(`${name} repeats`);
            seen.add(key);
            if (item.week > week) problems.push(`${name} is from week ${item.week}, after week ${week}`);
            if (item.kind === 'sound' || item.kind === 'tricky') {
                if (!taught) skipped.add('the sound and tricky cards, because the taught set is not given');
                else if (!(item.kind === 'sound' ? graphemes : trickyWords).has(item.text.toLowerCase())) problems.push(`${name} is not taught to date`);
            } else if (item.kind === 'frame') {
                if (frames.has(stem(item.text))) continue;
                if (others) problems.push(`${name} is not the frame of this week or an earlier week`);
                else skipped.add('the frame cards of earlier weeks, because the other weeks are not given');
            } else {
                const needle = ` ${stem(item.text)} `;
                if (earlierDays.includes(needle)) continue;
                if (others && !earlierWeeks.includes(needle)) problems.push(`${name} is not in the text of an earlier day or week`);
                else if (!others) skipped.add('the word cards of earlier weeks, because the other weeks are not given');
            }
        }
    }
    return loopCheck('loops-recall', `Each day has ${RECALL_COUNT} recall items, all taught to date`, problems, [...skipped]);
}

/**
 * The check `loops-minutes` (loops FR-7). Only a loop step may carry a `loopMinutes` that differs from its
 * minutes, and a loop step has 2 minutes or more. Every day must fill the period: the opening plus the steps
 * that are not moved, at `loopMinutes ?? minutes`, equal `periodMinutes`.
 */
function minutesCheck(w: StorytimeWeek, steps: StorytimeStep[]): PackageCheck {
    const { periodMinutes, openingMinutes } = w.meta;
    const problems: string[] = [];
    for (const st of steps) {
        if (st.loopMinutes !== undefined && st.loopMinutes !== st.minutes && !LOOP_STEP_IDS.includes(st.id)) problems.push(`${st.id}: loopMinutes ${st.loopMinutes}, minutes ${st.minutes}; only a loop step may differ`);
        const minutes = st.loopMinutes ?? st.minutes;
        if (LOOP_STEP_IDS.includes(st.id) && !st.moved && minutes < LOOP_STEP_MIN) problems.push(`${st.id}: ${minutes} min, a loop step has ${LOOP_STEP_MIN} or more`);
    }
    for (const s of w.scripts) {
        const main = s.steps.filter((st) => !st.moved).reduce((n, st) => n + (st.loopMinutes ?? st.minutes), 0);
        if (openingMinutes + main !== periodMinutes) problems.push(`${s.id}: ${openingMinutes} + ${main} = ${openingMinutes + main} with loopMinutes, not ${periodMinutes}`);
    }
    return loopCheck('loops-minutes', 'The loop minutes fill the period; only loop steps change', problems);
}

/**
 * The status of the share-moment check (share FR-14): `warn` from the Green task to the switch task, and
 * `fail` after the switch task, as `LOOP_CHECK_STATUS` was (FR-8, D12). A problem carries this status.
 */
export const SHARE_CHECK_STATUS: CheckStatus = 'fail';

/** The 17 media file extensions of the Monorepo `MEDIA_EXTENSION` (share FR-14, rule 7). */
const SHARE_MEDIA_EXTENSION = /\.(mp3|wav|m4a|aac|ogg|opus|mp4|m4v|webm|mov|jpg|jpeg|png|webp|gif|svg|pdf)$/i;

/** The assessment step of a teach week and of a review week (share FR-14, rule 5). */
const ASSESSMENT_STEPS: Record<'teach' | 'review', string> = { teach: 'E5', review: 'A1' };

/**
 * The words of a caption, as share FR-14 rule 6 counts them: trim it, split it on runs of white space,
 * and count the non-empty parts.
 * @param text The caption text.
 * @returns The number of words, and 0 for a text of spaces only.
 */
const captionWords = (text: string): number => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
};

/**
 * The check `share-moment` (share FR-14): each day of a Level 2 to 4 week has a parent-share moment, and
 * each moment follows rules 1 to 7 of the spec. The check needs no taught set and no other week, so it
 * skips no part. A problem carries the status `SHARE_CHECK_STATUS`.
 * @param w The parsed week of Level 2 to 4.
 * @returns The check row.
 */
function shareCheck(w: StorytimeWeek): PackageCheck {
    const problems: string[] = [];
    const assessment = ASSESSMENT_STEPS[w.meta.kind];
    for (const script of w.scripts) {
        const day = `day ${script.day}`;
        const { share } = script;
        if (!share) {
            problems.push(`${day}: no share moment`);
            continue;
        }
        // Rule 2: the step of the own script, or a moved step of the script of the day before.
        const own = new Set(script.steps.map((st) => st.id));
        const before = w.scripts.find((s) => s.day === script.day - 1);
        const movedBefore = new Set((before?.steps ?? []).filter((st) => st.moved === 'next-opening').map((st) => st.id));
        // The period of the day: the own steps without `moved`, and the moved steps of the day before.
        const period = new Set([...script.steps.filter((st) => !st.moved).map((st) => st.id), ...movedBefore]);
        for (const shot of share.shots) {
            if (!own.has(shot.step) && !movedBefore.has(shot.step)) problems.push(`${day}: ${shot.step} is not a step of the script or a moved step of the day before`);
            // Rule 5: no shot of a check shows the check items and a child under test.
            if (shot.step === assessment) problems.push(`${day}: ${shot.step} is an assessment step`);
        }
        // Rule 3: at least one shot in the period of the day.
        if (!share.shots.some((shot) => period.has(shot.step))) problems.push(`${day}: no shot in the period of the day`);
        // Rule 4: the two shots name two different steps.
        if (new Set(share.shots.map((shot) => shot.step)).size !== share.shots.length) problems.push(`${day}: two shots name the same step`);
        // Rule 6: 1 to 40 English words, and a Thai caption that is not empty.
        const words = captionWords(share.caption.en);
        if (words < 1 || words > 40) problems.push(`${day}: the English caption has ${words} words, not 1 to 40`);
        if (!share.caption.th.trim()) problems.push(`${day}: the Thai caption is empty`);
        // Rule 7: no caption string ends in a media file extension.
        for (const [lang, text] of [['English', share.caption.en], ['Thai', share.caption.th]] as const) {
            if (SHARE_MEDIA_EXTENSION.test(text)) problems.push(`${day}: the ${lang} caption ends in a media file extension`);
        }
    }
    return check('share-moment', 'Each day has a parent-share moment of 1 or 2 shots with a caption', problems, SHARE_CHECK_STATUS);
}

/** The circle items whose answer is not one of their choices, and the sorts with a picture in two columns, as "item n: ..." lines. */
function wrongAnswers(items: StorytimeCheckItem[]): string[] {
    return items.flatMap((item, i) => {
        if (item.kind === 'picture-sort') {
            const all = item.groups.flatMap((g) => g.pictures);
            const twice = [...new Set(all.filter((x, j) => all.indexOf(x) !== j))];
            return twice.length ? [`item ${i + 1}: ${twice.join(', ')} in two columns`] : [];
        }
        if (item.kind !== 'circle-picture' && item.kind !== 'circle-word') return [];
        const choices = item.kind === 'circle-picture' ? item.pictures : item.words;
        return choices.includes(item.answer) ? [] : [`item ${i + 1}: "${item.answer}" is not one of ${choices.join(', ')}`];
    });
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/**
 * The checks of a review week (design §3.5): the block and its day plan, and the benchmark.
 * @param w The parsed review week.
 * @param taught The letters taught to the week; without them, the letter lists are not compared.
 * @param others The other weeks of the level; without them, the medley and the books are not compared.
 * @returns The checks.
 */
function reviewChecks(w: StorytimeWeek, taught?: TaughtSet, others?: StorytimeWeek[]): PackageCheck[] {
    const out: PackageCheck[] = [];
    const block = w.block;
    const blockProblems: string[] = [];
    const blockWeeks = (others ?? []).filter((o) => o.meta.level === w.meta.level && block?.weeks.includes(o.meta.week));
    if (!block) blockProblems.push('no block');
    else {
        const days = new Set(block.days.map((d) => d.day));
        for (let d = 1; d <= 5; d++) if (!days.has(d)) blockProblems.push(`no day ${d}`);
        for (const n of block.weeks) if (n >= w.meta.week) blockProblems.push(`week ${n} is not before the review week`);
        for (const d of block.days) for (const n of d.weeks) if (!block.weeks.includes(n)) blockProblems.push(`day ${d.day}: week ${n} is not in the block`);
        for (const d of block.days) {
            if (!d.paper.length) blockProblems.push(`day ${d.day}: no review page`);
            blockProblems.push(...wrongAnswers(d.paper).map((x) => `day ${d.day} review page ${x}`));
        }
        const covered = new Set(block.days.filter((d) => d.day <= 4).flatMap((d) => d.weeks));
        const missing = block.weeks.filter((n) => !covered.has(n));
        if (missing.length) blockProblems.push(`days 1 to 4 do not cover week ${missing.join(', ')}`);
        if (others) {
            const songs = new Set(blockWeeks.flatMap((o) => (o.song ? [o.song.title] : [])));
            for (const d of block.days) for (const t of d.medley) if (!songs.has(t)) blockProblems.push(`day ${d.day}: "${t}" is not a song of the block`);
        }
    }
    out.push(check('block', 'Review block: five days with a review page each, every block week on days 1 to 4, the medley from the block songs (design §3.5)', blockProblems));

    const b = w.benchmark;
    const benchProblems: string[] = [];
    if (!b) benchProblems.push('no benchmark');
    else {
        const { oneToOne: o, paper, readingRecord: r } = b;
        const strip = [...o.letters].sort().join('');
        if (strip !== ALPHABET) benchProblems.push(`the letter strip is not the 26 letters once each (${o.letters.join('')})`);
        if (o.letterPass > o.letters.length) benchProblems.push(`letter pass ${o.letterPass} of ${o.letters.length}`);
        if (o.soundPass > o.sounds.length) benchProblems.push(`sound pass ${o.soundPass} of ${o.sounds.length}`);
        if (o.blendPass > o.blend.length) benchProblems.push(`blend pass ${o.blendPass} of ${o.blend.length}`);
        const same = (a: string[], c: string[]) => [...new Set(a)].sort().join(',') === [...new Set(c)].sort().join(',');
        const written = paper.items.flatMap((i) => (i.kind === 'write-letter' ? [i.letter] : []));
        if (taught) {
            if (!same(o.sounds, taught.graphemes)) benchProblems.push(`the sound cards (${o.sounds.join(', ')}) are not the taught letters (${taught.graphemes.join(', ')})`);
            if (!same(written, taught.graphemes)) benchProblems.push(`the written letters (${written.join(', ')}) are not the taught letters`);
        }
        benchProblems.push(...wrongAnswers(paper.items).map((x) => `paper ${x}`));
        if (others) {
            for (const rb of r.books) {
                const src = blockWeeks.find((o2) => o2.meta.week === rb.week)?.books.find((bk) => bk.kind === 'decodable');
                if (!src || src.title !== rb.title) benchProblems.push(`reading record: "${rb.title}" is not the decodable of week ${rb.week}`);
                else if (src.pages.map((p) => p.text).join(' ') !== rb.pages.join(' ')) benchProblems.push(`reading record: the text of "${rb.title}" differs from week ${rb.week}`);
            }
        }
    }
    out.push(check('benchmark', 'Benchmark: the 26-letter strip, the taught letters, the answers, the block decodables (design §3.5)', benchProblems));
    return out;
}
