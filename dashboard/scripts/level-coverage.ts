import fs from 'fs';
import path from 'path';
import { CONTENT_ROOT, OBJECTIVE_KEY_DIR, REPO_ROOT, loadPackageFolder } from '../lib/lesson-package/files';
import { DEFAULT_GRAPH } from '../lib/lesson-package/context';
import { LIST_GOALS, bookCoverage, curriculumOrder, glossedOnList, goalMet, levelCoverage, needsPractice, nextBookLists, recyclingRows, recyclingSummary, toCurriculumEntry, wordLists, MIN_PRACTICE_AFTER, type ListNode } from '../lib/lesson-package/coverage';
import type { LessonPackage } from '../lib/lesson-package/schema';

const USAGE = `Coverage of the Mastery Advantage graph per level (track level_banks_20261002).

Usage: npx tsx scripts/level-coverage.ts [--levels 5-9] [--next <book>] [--out <file.md>]

For each of the levels 1–4: the packages of the level (workbook books and the bank), each objective
of the level's own GSE range with the count of packages that target it (tags.targetObjectives) and
of questions that test it, and the share of the level's word list that the packages gloss. The
letter and sound objectives are out of scope (Daniel, 2026-10-02: schools and Storytime Advantage).
Default output: docs/content-plans/level-plans/coverage.md.

--levels 5-9 reports levels 5–9 instead (track levels_5_9_20261006): per level, every in-scope objective
with the packages that target it (goal: 3 or more); per book, the lead objectives of
docs/content-plans/level-plans/levels-5-9-objectives.json (goal: each is a target in its number of the book's lessons);
and the Movers, Flyers, and A2 Key words that the packages gloss, against the goals of the plan.
A level whose book folders do not exist is "not started". Exit code 1 when a goal of a started level is
not met. Default output: docs/content-plans/level-plans/coverage-5-9.md. Env: MASTERY_VOCAB_GRAPH.
The 5-9 report ends with a "Recycling" section for each band (A1, A2): per in-scope objective, the first teaching
(the first package in curriculum order that targets it) and the packages after it where the objective is available
(target or supporting). A warning shows when the count is under 3 and the last book folder of the band exists.

--next <book> (for example quest-5) prints, as markdown on stdout, the lists for the lesson map of the book: the
objectives that the plan gives the book to teach first, and the band objectives taught before the book, lowest
practice-after first. Only the packages before the book in curriculum order count.`;

/** Book folders per level. Origins 3.1 lessons 1–11, 13, 14 are stored at level 2 in the app. */
const LEVEL_BOOKS: Record<number, string[]> = { 1: ['origins-1', 'bank-1'], 2: ['origins-2', 'origins-3.1', 'bank-2'], 3: ['origins-3.1', 'origins-3.2', 'bank-3'], 4: ['quest-4', 'bank-4'] };
const GSE: Record<number, [number, number]> = { 1: [10, 13], 2: [14, 17], 3: [18, 21], 4: [22, 23] };
const OUT_OF_SCOPE = new Set(['R10.1', 'R10.3', 'R14.2', 'R18.1', 'R21.3', 'L10.1', 'L10.3', 'L10.5', 'L16.3']);
const MIN_TARGETS = 2;
const LEVEL_MIN_TARGETS = 3;
/** Reading direction: every text practices it, so the plans list it as supporting. Supporting tags count for it. */
const EVERY_TEXT = new Set(['R14.1']);

interface Objective {
    id: string;
    gse: number;
    text: string;
}

function readObjectives(): Objective[] {
    return fs
        .readdirSync(OBJECTIVE_KEY_DIR)
        .filter((f) => f.endsWith('-objective-key.json'))
        .flatMap((f) => (JSON.parse(fs.readFileSync(path.join(OBJECTIVE_KEY_DIR, f), 'utf8')) as { objectives: Objective[] }).objectives);
}

function readWords(file: string): Set<string> {
    const out = new Set<string>();
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        if (line.startsWith('#') || !line.trim()) continue;
        for (const w of line.split(',')) if (/^[a-z' -]+$/.test(w.trim())) out.add(w.trim());
    }
    return out;
}

/** Book folders per level for levels 5–9, and the GSE range of each level. */
const LEVEL_BOOKS_59: Record<number, string[]> = {
    5: ['quest-5', 'bank-5'],
    6: ['quest-6.1', 'quest-6.2', 'bank-6'],
    7: ['adventure-7.1', 'adventure-7.2', 'bank-7'],
    8: ['adventure-8.1', 'adventure-8.2', 'adventure-8.3', 'bank-8'],
    9: ['adventure-9.1', 'adventure-9.2', 'adventure-9.3', 'bank-9'],
};
const GSE_59: Record<number, [number, number]> = { 5: [24, 26], 6: [27, 29], 7: [30, 33], 8: [34, 38], 9: [39, 42] };
/** The folders of levels 1–4, for the word-list count that is cumulative over the levels. */
const FOLDERS_1_4 = ['origins-1', 'origins-2', 'origins-3.1', 'origins-3.2', 'quest-4', 'bank-1', 'bank-2', 'bank-3', 'bank-4'];

/** The bands of levels 1–9: the GSE range, the book folders, and the last book folder. */
const BANDS = [
    { name: 'A1', gse: [22, 29] as [number, number], books: ['quest-4', 'quest-5', 'quest-6.1', 'quest-6.2'], last: 'quest-6.2' },
    { name: 'A2', gse: [30, 42] as [number, number], books: ['adventure-7.1', 'adventure-7.2', 'adventure-8.1', 'adventure-8.2', 'adventure-8.3', 'adventure-9.1', 'adventure-9.2', 'adventure-9.3'], last: 'adventure-9.3' },
];

/** The text of a first teaching for the report. */
function firstText(first: { book: string; lesson: string } | null): string {
    return first ? `${first.book} ${first.lesson}` : 'not yet';
}

function loadBook(book: string): LessonPackage[] {
    const dir = path.join(CONTENT_ROOT, book);
    return fs.existsSync(dir) ? loadPackageFolder(dir).flatMap((f) => (f.pkg ? [f.pkg] : [])) : [];
}

function main59(argv: string[]): number {
    const outAt = argv.indexOf('--out');
    const out = outAt >= 0 ? path.resolve(argv[outAt + 1]) : path.join(REPO_ROOT, 'docs/content-plans/level-plans/coverage-5-9.md');
    const objectives = readObjectives();
    const plan = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs/content-plans/level-plans/levels-5-9-objectives.json'), 'utf8')) as { outOfScope: Record<string, string>; books: Record<string, { objectives: string[]; lessons?: Record<string, number> }> };
    const outOfScope = new Set(Object.keys(plan.outOfScope));
    const graph = JSON.parse(fs.readFileSync(process.env.MASTERY_VOCAB_GRAPH || DEFAULT_GRAPH, 'utf8')) as { nodes: ListNode[] };
    const { lists, wordOf } = wordLists(graph.nodes);
    const books = new Map<string, LessonPackage[]>();
    for (const b of [...FOLDERS_1_4, ...Object.values(LEVEL_BOOKS_59).flat()]) books.set(b, loadBook(b));
    const md = [
        '# Levels 5–9: coverage of the Mastery Advantage graph',
        '',
        `Generated by \`dashboard/scripts/level-coverage.ts --levels 5-9\` on ${new Date().toISOString().slice(0, 10)} (track levels_5_9_20261006). Level rule: each in-scope objective of the level's GSE range is a target in ${LEVEL_MIN_TARGETS} or more packages of the level. Book rule: each objective that the plan gives a book is a target in its number of the book's lessons (1, or 2 for some objectives of the last book of a band); the books of a band share its objectives (Daniel, 2026-09-30). The out-of-scope objectives are those of levels-5-9-objectives.json. A level whose book folders do not exist is "not started".`,
        '',
        '## Word lists',
        '',
        'A word belongs to the lowest list that holds it in the vocabulary graph (Starters, Movers, Flyers, A2 Key, Preliminary). The nodes with one normalized form are one word. The count is cumulative: it takes the glossed words (tags.glossedNodes) of the levels 1 to N.',
        '',
        '| List | Words | Goal | ' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => `End of level ${l}`).join(' | ') + ' |',
        '|---|---|---|' + '---|'.repeat(9),
    ];
    const cumulative = (level: number) => {
        const folders = [...FOLDERS_1_4, ...[5, 6, 7, 8, 9].filter((l) => l <= level).flatMap((l) => LEVEL_BOOKS_59[l])];
        return folders.flatMap((f) => books.get(f) ?? []);
    };
    const listCounts = LIST_GOALS.map((g) => {
        const list = lists.get(g.exam)!;
        return { ...g, total: list.size, counts: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => glossedOnList(cumulative(l <= 4 ? 4 : l), list, wordOf)) };
    });
    for (const g of listCounts) md.push(`| ${g.label} | ${g.total} | ${Math.round(g.share * 100)}% by level ${g.byLevel} | ${g.counts.map((c, i) => (i + 1 <= 4 ? (i + 1 === 4 ? `${c}` : '–') : `${c}${i + 1 === g.byLevel ? (goalMet(c, g.total, g.share) ? ' ✔' : ' ⚠') : ''}`)).join(' | ')} |`);
    md.push('', 'The levels 1–3 columns show "–" because the books of levels 1–4 form one block; the level 4 column holds their total.', '');
    let failed = 0;
    for (const level of [5, 6, 7, 8, 9]) {
        const folders = LEVEL_BOOKS_59[level];
        const started = folders.every((b) => fs.existsSync(path.join(CONTENT_ROOT, b)));
        const pkgs = folders.flatMap((b) => books.get(b) ?? []);
        const [lo, hi] = GSE_59[level];
        const { rows, gaps } = levelCoverage(pkgs, objectives, [lo, hi], outOfScope, LEVEL_MIN_TARGETS);
        md.push(`## Level ${level} (GSE ${lo}–${hi})`, '', `${started ? 'Started' : 'Not started'}: ${pkgs.length} packages (${folders.map((b) => `${b}${fs.existsSync(path.join(CONTENT_ROOT, b)) ? '' : ' missing'}`).join(', ')}). ${rows.length - gaps.length} of ${rows.length} objectives are a target in ${LEVEL_MIN_TARGETS}+ packages.`, '', '| Objective | Packages (target) | Packages (supporting) | Questions | Text |', '|---|---|---|---|---|');
        for (const r of rows) md.push(`| ${r.id} | ${r.target}${r.target < LEVEL_MIN_TARGETS ? ' ⚠' : ''} | ${r.supporting} | ${r.questions} | ${r.text} |`);
        md.push('', gaps.length ? `Gaps: ${gaps.map((g) => g.id).join(', ')}.` : 'Gaps: none.', '', '| Book | Objectives covered | Gaps |', '|---|---|---|');
        let bookGaps = 0;
        for (const b of folders) {
            const lead = plan.books[b]?.objectives;
            const lessons = plan.books[b]?.lessons;
            if (!lead) {
                md.push(`| ${b} | no lead objectives in the plan | – |`);
                continue;
            }
            const c = bookCoverage(books.get(b) ?? [], lead, lessons);
            bookGaps += c.gaps.length;
            md.push(`| ${b} | ${c.covered} of ${c.total} | ${c.gaps.join(', ') || 'none'} |`);
        }
        md.push('');
        const goalsMissed = listCounts.filter((g) => g.byLevel === level && !goalMet(g.counts[level - 1], g.total, g.share));
        for (const g of goalsMissed) md.push(`List goal not met: ${g.label} ${g.counts[level - 1]} of ${g.total} (goal ${Math.round(g.share * 100)}%).`, '');
        const bad = gaps.length + bookGaps + goalsMissed.length;
        if (started) failed += bad;
        console.log(`level ${level}: ${started ? 'started' : 'not started'}; ${pkgs.length} packages; ${rows.length - gaps.length} of ${rows.length} objectives at ${LEVEL_MIN_TARGETS}+; ${bookGaps} book gap(s); ${goalsMissed.length} list goal(s) missed`);
    }
    const ordered = curriculumOrder([...books.values()].flat().map(toCurriculumEntry));
    md.push('## Recycling', '', `An objective is available in a package when it is a target or a supporting objective. The first teaching is the first package in curriculum order (level, then workbook books, then the bank of the level) that targets the objective. Practice after counts the packages after it where the objective is available. A ⚠ shows when the count is under ${MIN_PRACTICE_AFTER} and the last book folder of the band exists.`, '');
    for (const band of BANDS) {
        const bandObjectives = objectives.filter((o) => o.gse >= band.gse[0] && o.gse <= band.gse[1] && !outOfScope.has(o.id) && !OUT_OF_SCOPE.has(o.id));
        const rows = recyclingRows(ordered, bandObjectives);
        const done = fs.existsSync(path.join(CONTENT_ROOT, band.last));
        const sum = recyclingSummary(rows);
        md.push(`### Recycling ${band.name} (GSE ${band.gse[0]}–${band.gse[1]})`, '', `${band.name}: ${sum.taught} of ${sum.total} objectives taught; ${sum.practiced} with ${MIN_PRACTICE_AFTER}+ practice after. ${done ? '' : `The last book folder (${band.last}) does not exist, so no warning shows.`}`, '', '| Objective | First teaching | Practice after | Text |', '|---|---|---|---|');
        for (const r of rows) md.push(`| ${r.id} | ${firstText(r.first)} | ${r.practiceAfter}${needsPractice(r, done) ? ' ⚠' : ''} | ${r.text} |`);
        md.push('');
        console.log(`recycling ${band.name}: ${sum.taught} of ${sum.total} taught; ${sum.practiced} with ${MIN_PRACTICE_AFTER}+ practice after`);
    }
    for (const g of listCounts) console.log(`${g.label}: ${g.counts[3]} of ${g.total} glossed at the end of level 4`);
    fs.writeFileSync(out, `${md.join('\n')}\n`);
    console.log(`Wrote ${path.relative(process.cwd(), out)}`);
    return failed ? 1 : 0;
}

function mainNext(book: string | undefined): number {
    const band = BANDS.find((b) => book !== undefined && b.books.includes(book));
    if (!book || !band) {
        console.error(`--next needs a book of the A1 or A2 band (${BANDS.flatMap((b) => b.books).join(', ')})`);
        return 1;
    }
    const objectives = readObjectives();
    const plan = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs/content-plans/level-plans/levels-5-9-objectives.json'), 'utf8')) as { outOfScope: Record<string, string>; books: Record<string, { level: number; objectives: string[] }> };
    const outOfScope = new Set(Object.keys(plan.outOfScope));
    const level = plan.books[book]?.level;
    if (!level) {
        console.error(`The plan has no level for ${book}`);
        return 1;
    }
    const bandObjectives = objectives.filter((o) => o.gse >= band.gse[0] && o.gse <= band.gse[1] && !outOfScope.has(o.id) && !OUT_OF_SCOPE.has(o.id));
    const entries = [...FOLDERS_1_4, ...Object.values(LEVEL_BOOKS_59).flat()].flatMap((b) => loadBook(b).map(toCurriculumEntry));
    const { teach, candidates } = nextBookLists(entries, book, level, plan.books[book].objectives, bandObjectives);
    const text = new Map(objectives.map((o) => [o.id, o.text]));
    const out = [`# Lesson map lists for ${book} (band ${band.name})`, '', 'Only the packages before the book in curriculum order count.', '', `## The plan gives ${book} these objectives to teach first (${teach.length})`, '', '| Objective | GSE | Text |', '|---|---|---|'];
    for (const o of teach) out.push(`| ${o.id} | ${o.gse || '–'} | ${text.get(o.id) ?? o.text} |`);
    out.push('', `## Band objectives taught before ${book}, lowest practice after first (${candidates.length})`, '', '| Objective | First teaching | Practice after | Text |', '|---|---|---|---|');
    for (const r of candidates) out.push(`| ${r.id} | ${firstText(r.first)} | ${r.practiceAfter} | ${r.text} |`);
    console.log(out.join('\n'));
    return 0;
}

function main(argv: string[]): number {
    if (argv.includes('--help')) {
        console.log(USAGE);
        return 0;
    }
    const nextAt = argv.indexOf('--next');
    if (nextAt >= 0) return mainNext(argv[nextAt + 1]);
    const levelsAt = argv.indexOf('--levels');
    if (levelsAt >= 0) {
        if (argv[levelsAt + 1] !== '5-9') {
            console.error('--levels accepts only 5-9');
            return 1;
        }
        return main59(argv);
    }
    const outAt = argv.indexOf('--out');
    const out = outAt >= 0 ? path.resolve(argv[outAt + 1]) : path.join(REPO_ROOT, 'docs/content-plans/level-plans/coverage.md');
    const objectives = readObjectives();
    const data = path.join(REPO_ROOT, 'docs/content-plans/data');
    const starters = readWords(path.join(data, 'yle-starters-words.md'));
    const movers = readWords(path.join(data, 'yle-movers-words.md'));
    const md = ['# Levels 1–4: coverage of the Mastery Advantage graph', '', `Generated by \`dashboard/scripts/level-coverage.ts\` on ${new Date().toISOString().slice(0, 10)} (track level_banks_20261002). A package counts for an objective when the objective is in its targets. The letter and sound objectives are out of scope (schools and Storytime Advantage). Goal: every in-scope objective of a level's own range is a target in ${MIN_TARGETS} or more packages. Reading direction (R14.1) is practiced by every text, so its supporting tags count.`, ''];
    let gaps = 0;
    for (const level of [1, 2, 3, 4]) {
        const pkgs: LessonPackage[] = LEVEL_BOOKS[level].flatMap((b) => loadPackageFolder(path.join(CONTENT_ROOT, b)).flatMap((f) => (f.pkg && f.pkg.meta.raLevel === level ? [f.pkg] : [])));
        const [lo, hi] = GSE[level];
        const own = objectives.filter((o) => o.gse >= lo && o.gse <= hi && !OUT_OF_SCOPE.has(o.id));
        const targetCount = new Map<string, number>();
        const supportCount = new Map<string, number>();
        const questionCount = new Map<string, number>();
        for (const p of pkgs) {
            for (const id of new Set(p.tags.targetObjectives)) targetCount.set(id, (targetCount.get(id) ?? 0) + 1);
            for (const id of new Set(p.tags.supportingObjectives)) supportCount.set(id, (supportCount.get(id) ?? 0) + 1);
            for (const q of [...p.bank.mcq, ...p.bank.saq, ...p.bank.laq]) for (const id of q.objectives) questionCount.set(id, (questionCount.get(id) ?? 0) + 1);
        }
        const list = level === 4 ? movers : starters;
        const glossed = new Set(pkgs.flatMap((p) => p.text.glossed.map((g) => g.toLowerCase())));
        const onList = [...list].filter((w) => glossed.has(w)).length;
        const count = (id: string) => (targetCount.get(id) ?? 0) + (EVERY_TEXT.has(id) ? (supportCount.get(id) ?? 0) : 0);
        const low = own.filter((o) => count(o.id) < MIN_TARGETS);
        gaps += low.length;
        md.push(`## Level ${level} (GSE ${lo}–${hi})`, '', `${pkgs.length} packages (${LEVEL_BOOKS[level].join(', ')}). Glossed: ${glossed.size} different words; ${onList} of the ${list.size} ${level === 4 ? 'Movers' : 'Starters'} words. ${low.length ? `${low.length} objective(s) under ${MIN_TARGETS} packages.` : 'Every in-scope objective has enough packages.'}`, '', '| Objective | Packages (target) | Packages (supporting) | Questions | Text |', '|---|---|---|---|---|');
        for (const o of own) md.push(`| ${o.id} | ${targetCount.get(o.id) ?? 0}${count(o.id) < MIN_TARGETS ? ' ⚠' : ''} | ${supportCount.get(o.id) ?? 0}${EVERY_TEXT.has(o.id) ? ' (counts)' : ''} | ${questionCount.get(o.id) ?? 0} | ${o.text} |`);
        md.push('');
        console.log(`level ${level}: ${pkgs.length} packages; ${own.length - low.length} of ${own.length} objectives at ${MIN_TARGETS}+; glossed ${onList} of ${list.size} list words`);
    }
    fs.writeFileSync(out, `${md.join('\n')}\n`);
    console.log(`Wrote ${path.relative(process.cwd(), out)}`);
    return gaps ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
