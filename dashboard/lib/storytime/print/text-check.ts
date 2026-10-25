import type { PackageCheck } from '../../lesson-package/checks';
import type { CheckStatus } from '../../text-profile/check';
import type { StorytimeCheckItem, StorytimePrintBlock, StorytimeWeek } from '../schema';

/**
 * The exact print-text checks of one week (spec FR-1.2): the `print` block against the script
 * steps A3, A7, C3, D4, and E5. Every comparison compares exact word lists, so there is no word
 * filter (anti-pattern A7): a missing read word and a teacher-only word are both errors. A week
 * without a block gets the fixed `print-missing` WARN, not a FAIL (weeks 2 to 8 ship without a
 * block until Phase 7).
 * @param week The parsed week.
 * @returns The checks: `print-missing` (WARN) without a block, else one check per print part.
 */
export function checkStorytimePrintText(week: StorytimeWeek): PackageCheck[] {
    const print = week.print;
    if (!print) return [check('print-missing', 'The print block of the week', ['no print block'], 'warn')];
    const steps = new Map(week.scripts.flatMap((s) => s.steps.map((step) => [step.id, step] as const)));
    const say = (id: string) => (steps.get(id)?.en.teacherLanguage ?? []).map(unquote);
    return [
        formationCheck(print, say('A3'), week),
        practiceCheck(print, say('A7')),
        pictureWordCheck(print, week),
        dictationCheck(print, say('C3'), week),
        writingCheck(print, say('D4')),
        fridayCheckCheck(print, say('E5'), week.check.items),
    ];
}

const check = (id: string, label: string, problems: string[], failStatus: CheckStatus = 'fail'): PackageCheck => ({
    id,
    label,
    status: problems.length ? failStatus : 'pass',
    detail: problems.length ? problems.join('; ') : undefined,
});

/** Lower case, letters and digits only: "A nest." and "a nest" compare equal. */
const stem = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const wordsOf = (s: string): string[] => stem(s).split(' ').filter(Boolean);

/** Removes the wrapping quote marks that the script data puts around one teacher line. */
const unquote = (s: string) => s.replace(/^"+|"+$/g, '');

/** The first sentence of a line, without its end mark: the trace and dictation lines carry instructions after it. */
const firstSentence = (s: string) => (s.match(/^[^.!?]*/)?.[0] ?? s).trim();

/** A dictated sound, not a word: a letter repeated ("nnn") — the phoneme marks ("/a/") never survive `wordsOf`. */
const isSoundToken = (t: string) => /^(.)\1+$/.test(t);

/**
 * The words that step A7 tells the children to read: the "Read the words/sentences" lists, the
 * tricky word of a "Find the word x" line, and any other line that is not teacher instruction
 * (week 1 gives the reading as its own quoted line). The teacher's other words ("Look at the
 * page.") are instructions, not reading, so they must not appear on the practice sheet.
 * @param a7 The unquoted teacher lines of step A7.
 * @returns The read words, in script order, with repeats.
 */
function readWordsOf(a7: string[]): string[] {
    const out: string[] = [];
    for (const line of a7) {
        const find = line.match(/find the word\s+([a-z']+)/i);
        if (find) {
            out.push(...wordsOf(find[1]));
            continue;
        }
        const reads = line.match(/read the (?:words|sentences):\s*(.+)$/i);
        if (reads) {
            out.push(...wordsOf(reads[1]));
            continue;
        }
        if (/^(look at|read the sounds|point|when i say|ready|listen|now\b|write\b|trace\b|children\b|stand up)/i.test(line)) continue;
        out.push(...wordsOf(line));
    }
    return out;
}

/**
 * The letter box against step A3: the week's letter, the formation words, and the start point.
 * @param print The print block.
 * @param a3 The unquoted teacher lines of step A3.
 * @param week The parsed week.
 * @returns The check.
 */
function formationCheck(print: StorytimePrintBlock, a3: string[], week: StorytimeWeek): PackageCheck {
    const problems: string[] = [];
    const letter = week.focus.element?.graphemes.join('') ?? '';
    if (letter && print.letterBox.letter !== letter) problems.push(`the letter box shows "${print.letterBox.letter}", not the week letter "${letter}"`);
    const words = a3[0] ?? '';
    if (!words) problems.push('the scripts have no step A3 formation words');
    else if (stem(words) !== stem(print.letterBox.formationWords)) problems.push(`the formation words are not the words of A3 ("${words}")`);
    else if (!wordsOf(words).includes(stem(print.letterBox.startPoint))) problems.push(`the start point "${print.letterBox.startPoint}" is not in the formation words`);
    return check('print-formation', 'Letter box: the letter and the formation words of step A3', problems);
}

/**
 * The practice sheet against step A7: the sheet carries exactly the read words (plus the letter
 * line of the sounds), with no missing word and no teacher-only word.
 * @param print The print block.
 * @param a7 The unquoted teacher lines of step A7.
 * @returns The check `print-practice`.
 */
function practiceCheck(print: StorytimePrintBlock, a7: string[]): PackageCheck {
    const problems: string[] = [];
    if (!a7.length) problems.push('the scripts have no step A7');
    const sheet = print.practice.flatMap((line) => wordsOf(line.text));
    const expected = readWordsOf(a7);
    const letter = stem(print.letterBox.letter);
    const missing = [...new Set(expected)].filter((wd) => wd !== letter && !sheet.includes(wd));
    const allowed = new Set([...expected, letter]);
    const extra = [...new Set(sheet)].filter((wd) => !allowed.has(wd));
    if (missing.length) problems.push(`the sheet misses the A7 words: ${missing.join(', ')}`);
    if (extra.length) problems.push(`the sheet has words that A7 does not read: ${extra.join(', ')}`);
    return check('print-practice', 'Practice sheet: the exact words that step A7 reads', problems);
}

/**
 * The dictation lines against step C3: the letters, the dictated word of the "Listen:" line, and
 * the trace word or sentence of the "Now trace" line.
 * @param print The print block.
 * @param c3 The unquoted teacher lines of step C3.
 * @param week The parsed week.
 * @returns The check.
 */
function dictationCheck(print: StorytimePrintBlock, c3: string[], week: StorytimeWeek): PackageCheck {
    const problems: string[] = [];
    if (!c3.length) problems.push('the scripts have no step C3');
    const letter = week.focus.element?.graphemes.join('') ?? '';
    if (letter && !print.dictation.letters.includes(letter)) problems.push(`the dictation letters do not include the week letter "${letter}"`);
    for (const l of print.dictation.letters) if (!/^[a-z]$/.test(l)) problems.push(`"${l}" is not one lower-case letter`);
    const expected = new Set<string>();
    for (const line of c3) {
        const listen = line.match(/listen:\s*(.+)$/i);
        if (listen) for (const wd of wordsOf(firstSentence(listen[1]))) if (!isSoundToken(wd)) expected.add(wd);
        const trace = line.match(/now trace\b(.+)$/i);
        if (trace) {
            const item = firstSentence(trace[1]).replace(/^(?:the words?|:)\s*/i, '');
            for (const wd of wordsOf(item)) expected.add(wd);
        }
    }
    expected.delete('');
    const given = [...print.dictation.words, ...wordsOf(print.dictation.traceSentence ?? '')];
    const missing = [...expected].filter((wd) => !given.includes(wd));
    const extra = given.filter((wd) => !expected.has(wd));
    if (missing.length) problems.push(`the dictation misses the C3 words: ${missing.join(', ')}`);
    if (extra.length) problems.push(`the dictation has words that C3 does not say: ${extra.join(', ')}`);
    return check('print-dictation', 'Dictation lines: the letters, the words, and the trace of step C3', problems);
}

/**
 * The writing page against step D4: the trace text, the name or word line, and the picture box.
 * @param print The print block.
 * @param d4 The unquoted teacher lines of step D4.
 * @returns The check.
 */
function writingCheck(print: StorytimePrintBlock, d4: string[]): PackageCheck {
    const problems: string[] = [];
    if (!d4.length) problems.push('the scripts have no step D4');
    const said = stem(d4.join(' '));
    const trace = stem(print.writing.traceText);
    if (trace && !said.includes(trace)) problems.push(`the trace text "${print.writing.traceText}" is not the text of step D4`);
    if (print.writing.line === 'name' && !said.includes(' name ')) problems.push('step D4 does not write a name');
    if (print.writing.line === 'word' && !said.includes(' word ')) problems.push('step D4 does not trace a word on the line');
    if (print.writing.pictureBox && !said.includes(' draw ')) problems.push('step D4 does not draw a picture');
    if (!print.writing.pictureBox && said.includes(' draw ')) problems.push('step D4 draws a picture, so the writing page needs the picture box');
    return check('print-writing', 'Writing page: the trace text, the line, and the picture box of step D4', problems);
}

/** The picture words of a check item, in data order; the write items name no picture. */
const itemPictures = (item: StorytimeCheckItem): string[] =>
    item.kind === 'circle-picture' ? item.pictures : item.kind === 'picture-sort' ? item.groups.flatMap((g) => g.pictures) : [];

/**
 * The words of the week that a picture may name (review finding F1): a word of a reader page
 * text, a picture word of `check.items`, or a word of the home card.
 * @param week The parsed week.
 * @returns The lower-case stems of the week words.
 */
function weekWordsOf(week: StorytimeWeek): Set<string> {
    const words = new Set<string>();
    for (const book of week.books) for (const page of book.pages) for (const wd of wordsOf(page.text)) words.add(wd);
    for (const item of week.check.items) for (const pic of itemPictures(item)) words.add(stem(pic));
    for (const wd of week.home?.words ?? []) words.add(stem(wd));
    return words;
}

/**
 * The picture word of each practice line names its own line and nothing else (F1, review of
 * 1c4b47a): it is not a word of another practice line of the block, and it is a week word. The
 * compare is lower case with punctuation removed (`stem`), so "Net" fails like "net". A word on
 * its own line is allowed (A7): the rule is not over-broad.
 * @param print The print block.
 * @param week The parsed week.
 * @returns The check `print-picture-word`.
 */
function pictureWordCheck(print: StorytimePrintBlock, week: StorytimeWeek): PackageCheck {
    const problems: string[] = [];
    const lines = print.practice;
    const weekWords = weekWordsOf(week);
    lines.forEach((line, i) => {
        const pictureWord = stem(line.pictureWord);
        if (!pictureWord) return;
        const repeated = lines.find((other, j) => j !== i && wordsOf(other.text).includes(pictureWord));
        const reasons: string[] = [];
        if (repeated) reasons.push(`it is a word of the other practice line "${repeated.text}"`);
        if (!weekWords.has(pictureWord)) reasons.push('it is not a week word');
        if (!reasons.length) return;
        const list = lines.map((l) => `"${l.text}"`).join(', ');
        problems.push(`the picture word "${line.pictureWord}" of the line "${line.text}" ${reasons.join(' and ')} (the practice lines are ${list})`);
    });
    return check('print-picture-word', 'Practice sheet: each picture word names its own line and is a week word', problems);
}

/**
 * The Friday check against step E5: each circle row of `check.items` is the picture list of the
 * matching "Row n" line of E5, and the write items are the letters and words that E5 says. The
 * print page shows no answer mark; the answers stay in the teacher book (FR-3).
 * @param print The print block (unused today; the check data is `check.items`).
 * @param e5 The unquoted teacher lines of step E5.
 * @param items The check items of the week.
 * @returns The check.
 */
function fridayCheckCheck(print: StorytimePrintBlock, e5: string[], items: StorytimeCheckItem[]): PackageCheck {
    void print;
    const problems: string[] = [];
    if (!e5.length) problems.push('the scripts have no step E5');
    const rows = e5.flatMap((line) => {
        const m = line.match(/row\s+(\d+):\s*([^.!?]+)/i);
        return m ? [{ n: Number(m[1]), words: wordsOf(m[2]) }] : [];
    });
    const said = ` ${stem(e5.join(' '))} `;
    let row = 0;
    items.forEach((item, i) => {
        if (item.kind === 'circle-picture') {
            row++;
            const read = rows.find((r) => r.n === row);
            if (!read) problems.push(`item ${i + 1}: step E5 has no "Row ${row}" line`);
            else if (stem(read.words.join(' ')) !== stem(item.pictures.join(' ')))
                problems.push(`item ${i + 1}: the check page shows ${item.pictures.join(', ')}, step E5 reads ${read.words.join(', ')}`);
        } else if (item.kind === 'write-letter') {
            if (!said.includes(` write the letter ${stem(item.letter)} `)) problems.push(`item ${i + 1}: step E5 does not say "write the letter ${item.letter}"`);
        } else if (item.kind === 'write-word') {
            if (!said.includes(` ${stem(item.word)} `)) problems.push(`item ${i + 1}: step E5 does not say "${item.word}"`);
        } else if (item.kind === 'circle-word') {
            for (const wd of item.words) if (!said.includes(` ${stem(wd)} `)) problems.push(`item ${i + 1}: the choice "${wd}" is not in step E5`);
        } else {
            for (const pic of itemPictures(item)) if (!said.includes(` ${stem(pic)} `)) problems.push(`item ${i + 1}: the picture "${pic}" is not in step E5`);
        }
    });
    return check('print-check', 'Friday check: the rows and the written letters of step E5', problems);
}
