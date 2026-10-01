import { LessonPackageSchema, type LessonPackage } from './schema';
import { checkLesson, PROFILES, type CheckStatus, type LessonReport, type TextProfile } from '../text-profile/check';
import type { LessonText } from '../text-profile/sources';
import type { VocabularyIndex } from '../text-profile/vocabulary';
import { promptProblems } from '../media/images';
import { LOCK_LABELS, TODO, lockHashes } from './import-printed';

/** Counts for one lesson (Origins 3.2 plan §2 and §6). */
export interface LessonShape {
    glossary: number;
    mcq: number;
    saq: number;
    laq: number;
    printMcq: number;
    /** Printed MCQs that must test a target objective. */
    printObjectiveMcqMin: number;
    /** Options per MCQ in the bank (the app stores 4). */
    mcqOptions: number;
    sentenceStarters: number;
    vocabFill: number;
    sentenceOrder: number;
    sentenceCompletion: number;
    images: number;
}

export const PRIMARY_SHAPE: LessonShape = {
    glossary: 12,
    mcq: 10,
    saq: 5,
    laq: 5,
    printMcq: 4,
    printObjectiveMcqMin: 2,
    mcqOptions: 4,
    sentenceStarters: 3,
    vocabFill: 4,
    sentenceOrder: 2,
    sentenceCompletion: 3,
    images: 3,
};

export interface PackageCheck {
    id: string;
    label: string;
    status: CheckStatus;
    detail?: string;
}

export interface PackageReport {
    lesson: string;
    title: string;
    checks: PackageCheck[];
    /** The text-check report, when the package parses. */
    text?: LessonReport;
}

export interface PackageCheckContext {
    index: VocabularyIndex;
    /** Earlier lessons, in order (for new and recycled words). */
    prior: LessonText[];
    /** Overrides the profile named in the package. */
    profile?: TextProfile;
    shape?: LessonShape;
    /** Known objective IDs (the objective key). Without it, the tags check warns. */
    objectiveIds?: Set<string>;
}

const THAI = /[฀-๿]/;

/** Collapses white space and straightens quotes, so text from two sources compares equal. */
const flat = (s: string) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

/** Lower case, letters and digits only: "Where is the BALL" and "where is the ball?" match. */
const stem = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const check = (id: string, label: string, problems: string[], failStatus: CheckStatus = 'fail'): PackageCheck => ({
    id,
    label,
    status: problems.length ? failStatus : 'pass',
    detail: problems.length ? problems.join('; ') : undefined,
});

/**
 * Turns a package into the text-check input.
 * @param pkg A parsed package.
 * @param source File path, for the report.
 * @returns The lesson text.
 */
export function packageToLessonText(pkg: LessonPackage, source = ''): LessonText {
    const lower = (xs: string[]) => xs.map((x) => x.toLowerCase());
    return {
        id: pkg.meta.lesson,
        title: pkg.meta.title,
        source,
        paragraphs: pkg.text.paragraphs,
        glossed: lower(pkg.text.glossed),
        recycle: lower(pkg.text.recycle),
        allow: lower(pkg.text.allow),
        names: pkg.text.names,
        profile: pkg.meta.profile,
    };
}

/**
 * The report for a package that does not parse: only the schema check, with up to 5 issues.
 * @param issues The Zod issues.
 * @returns The report.
 */
export function schemaFailure(issues: { path: PropertyKey[]; message: string }[]): PackageReport {
    const shown = issues.slice(0, 5).map((i) => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`);
    return { lesson: '?', title: '?', checks: [check('schema', 'Package schema', shown)] };
}

/**
 * Checks one lesson package (track lesson_packages_20261001). A FAIL blocks approval; a WARN does not.
 * @param input The package as read from disk (not yet parsed).
 * @param ctx The vocabulary index, earlier lessons, and optional profile, shape, and objective key.
 * @returns The report. When the package does not parse, it holds only the schema check.
 */
export function checkPackage(input: unknown, ctx: PackageCheckContext): PackageReport {
    const parsed = LessonPackageSchema.safeParse(input);
    if (!parsed.success) return schemaFailure(parsed.error.issues);
    const pkg = parsed.data;
    const shape = ctx.shape ?? PRIMARY_SHAPE;
    const checks: PackageCheck[] = [check('schema', 'Package schema', [])];
    const lessonText = packageToLessonText(pkg);
    const fullText = flat(pkg.text.paragraphs.join(' '));
    const { mcq, saq, laq } = pkg.bank;

    // Text. A printed lesson's text is locked, so the profile does not apply to it.
    const profile = ctx.profile ?? PROFILES[pkg.meta.profile];
    const printedSource = pkg.meta.printed;
    let text: LessonReport | undefined;
    if (printedSource) {
        checks.push(check('text', 'Text check (printed text, locked)', []));
    } else if (!profile) {
        checks.push(check('text', 'Text check', [`unknown profile "${pkg.meta.profile}"`]));
    } else {
        text = checkLesson(lessonText, { index: ctx.index, prior: ctx.prior, profile });
        const failed = text.checks.filter((c) => c.status === 'fail').map((c) => `${c.id} ${c.value} (target ${c.target})`);
        checks.push(check('text', 'Text check', failed));
    }

    // Bank.
    const counts: string[] = [];
    if (mcq.length !== shape.mcq) counts.push(`${mcq.length} MCQ (need ${shape.mcq})`);
    if (saq.length !== shape.saq) counts.push(`${saq.length} SAQ (need ${shape.saq})`);
    if (laq.length !== shape.laq) counts.push(`${laq.length} LAQ (need ${shape.laq})`);
    checks.push(check('bank-size', 'Question bank size', counts));

    const answerProblems: string[] = [];
    for (const q of mcq) {
        if (q.options.length !== shape.mcqOptions) answerProblems.push(`${q.id}: ${q.options.length} options`);
        if (new Set(q.options.map(stem)).size !== q.options.length) answerProblems.push(`${q.id}: an option repeats`);
        if (q.options.filter((o) => o === q.answer).length !== 1) answerProblems.push(`${q.id}: the answer is not exactly one option`);
    }
    checks.push(check('mcq-answer', 'MCQ options and answer', answerProblems));

    const evidenceProblems = mcq.filter((q) => !fullText.includes(flat(q.evidence))).map((q) => `${q.id}: "${q.evidence}"`);
    checks.push(check('mcq-evidence', 'MCQ evidence in the text', evidenceProblems));

    const bankText: LessonText = {
        ...lessonText,
        id: `${lessonText.id}-bank`,
        paragraphs: [[...mcq.flatMap((q) => [q.question, ...q.options.map((o) => `${o}.`)]), ...saq.map((q) => q.question), ...laq.map((q) => q.question)].join(' ') || 'Empty.'],
    };
    const levelReport = profile ? checkLesson(bankText, { index: ctx.index, prior: [], profile }) : undefined;
    const aboveStarters = (levelReport?.nonStarters ?? []).map((w) => `${w.word} (${w.level})`);
    checks.push(check('bank-level', 'Question words at level', aboveStarters, 'warn'));

    const duplicates: string[] = [];
    for (const [type, items] of [['MCQ', mcq], ['SAQ', saq], ['LAQ', laq]] as const) {
        const seen = new Map<string, string>();
        for (const q of items) {
            const s = stem(q.question);
            if (seen.has(s)) duplicates.push(`${type} ${seen.get(s)} and ${q.id}`);
            else seen.set(s, q.id);
        }
    }
    checks.push(check('bank-unique', 'No repeated questions', duplicates));

    // Print set.
    const targets = new Set(pkg.tags.targetObjectives);
    const printProblems: string[] = [];
    const printed = pkg.print.mcq.map((id) => mcq.find((q) => q.id === id));
    if (pkg.print.mcq.length !== shape.printMcq) printProblems.push(`${pkg.print.mcq.length} MCQ (need ${shape.printMcq})`);
    if (new Set(pkg.print.mcq).size !== pkg.print.mcq.length) printProblems.push('an MCQ repeats');
    pkg.print.mcq.forEach((id, i) => {
        if (!printed[i]) printProblems.push(`unknown MCQ ${id}`);
    });
    if (!saq.some((q) => q.id === pkg.print.saq)) printProblems.push(`unknown SAQ "${pkg.print.saq}"`);
    const onTarget = printed.filter((q) => q?.objectives.some((o) => targets.has(o))).length;
    if (onTarget < shape.printObjectiveMcqMin) printProblems.push(`${onTarget} printed MCQ test a target objective (need ${shape.printObjectiveMcqMin})`);
    checks.push(check('print-set', 'Print set', printProblems));

    // Glossary.
    const glossaryProblems: string[] = [];
    const glossed = new Set(lessonText.glossed);
    const entries = new Set(pkg.glossary.map((g) => g.word.toLowerCase()));
    if (!printedSource && pkg.glossary.length !== shape.glossary) glossaryProblems.push(`${pkg.glossary.length} entries (need ${shape.glossary})`);
    const missing = [...glossed].filter((w) => !entries.has(w));
    const extra = [...entries].filter((w) => !glossed.has(w));
    if (missing.length) glossaryProblems.push(`not in the glossary: ${missing.join(', ')}`);
    if (extra.length) glossaryProblems.push(`not glossed: ${extra.join(', ')}`);
    for (const g of pkg.glossary) {
        if (!THAI.test(g.thai)) glossaryProblems.push(`${g.word}: no Thai definition`);
        if (!fullText.includes(flat(g.example))) glossaryProblems.push(`${g.word}: the example is not in the text`);
    }
    checks.push(check('glossary', 'Glossary', glossaryProblems));

    // Thai.
    const thaiProblems: string[] = [];
    if (pkg.thai.paragraphs.length !== pkg.text.paragraphs.length) {
        thaiProblems.push(`${pkg.thai.paragraphs.length} Thai paragraphs for ${pkg.text.paragraphs.length} paragraphs`);
    }
    pkg.thai.paragraphs.forEach((pairs, i) => {
        const english = flat(pairs.map((p) => p.en).join(' '));
        if (pkg.text.paragraphs[i] !== undefined && english !== flat(pkg.text.paragraphs[i])) {
            thaiProblems.push(`paragraph ${i + 1}: the English sentences do not match the text`);
        }
        pairs.forEach((p, j) => {
            if (!THAI.test(p.th)) thaiProblems.push(`paragraph ${i + 1} sentence ${j + 1}: no Thai`);
        });
    });
    if (!THAI.test(pkg.thai.summary)) thaiProblems.push('summary: no Thai');
    checks.push(check('thai', 'Thai translation', thaiProblems));

    // Activities and images.
    const a = pkg.activities;
    const activityProblems: string[] = [];
    const need = (name: string, n: number, want: number) => {
        if (n !== want) activityProblems.push(`${n} ${name} (need ${want})`);
    };
    need('sentence starters', a.sentenceStarters.length, shape.sentenceStarters);
    need('fill items', a.vocabFill.length, shape.vocabFill);
    need('order sentences', a.sentenceOrder.length, shape.sentenceOrder);
    need('completion prompts', a.sentenceCompletion.length, shape.sentenceCompletion);
    a.vocabFill.forEach((f, i) => {
        if (!f.sentence.includes('___')) activityProblems.push(`fill ${i + 1}: no ___ blank`);
    });
    if (!a.writingPrompt.trim()) activityProblems.push('no writing prompt');
    // A printed lesson's activities are on paper: a defect there is a note, not a block.
    checks.push(printedSource ? check('activities', 'Workbook activities (printed, locked)', activityProblems, 'warn') : check('activities', 'Workbook activities', activityProblems));

    const imageProblems = pkg.images.length !== shape.images ? [`${pkg.images.length} images (need ${shape.images})`] : [];
    for (const img of pkg.images) {
        const words = promptProblems(img.prompt);
        if (words.length) imageProblems.push(`${img.position}: ${words.join(', ')} (describe hair and clothes only)`);
    }
    checks.push(check('images', 'Image plan', imageProblems));
    const notMade = [...pkg.images.filter((img) => !img.file).map((img) => img.position), ...(pkg.audio.article ? [] : ['audio']), ...(pkg.audio.tutor ? [] : ['Tutor clips'])];
    checks.push(check('media', 'Pictures and audio made', notMade.length ? [`not made yet: ${notMade.join(', ')}`] : [], 'warn'));

    // Tags.
    const items = [...mcq, ...saq, ...laq];
    if (ctx.objectiveIds) {
        const known = ctx.objectiveIds;
        const used = [...pkg.tags.targetObjectives, ...pkg.tags.supportingObjectives, ...items.flatMap((q) => q.objectives)];
        const unknown = [...new Set(used.filter((id) => !known.has(id)))];
        checks.push(check('tags', 'Objective IDs', unknown.length ? [`unknown: ${unknown.join(', ')}`] : []));
    } else {
        checks.push(check('tags', 'Objective IDs', ['no objective key given'], 'warn'));
    }
    const untagged = items.filter((q) => q.objectives.length === 0).map((q) => q.id);
    checks.push(check('tags-coverage', 'Every question tagged', untagged.length ? [`no objective: ${untagged.join(', ')}`] : [], 'warn'));

    // Printed lessons: the lock, and the fields still to write.
    if (printedSource) {
        const now = lockHashes(pkg);
        const changed = Object.keys(LOCK_LABELS).filter((k) => printedSource.lock[k] !== now[k]).map((k) => LOCK_LABELS[k]);
        checks.push(check('locked', 'Printed parts unchanged', changed.length ? [`changed: ${changed.join(', ')} (the printed book has them)`] : []));
        const todo: [string, number][] = [
            ['summary', pkg.text.summary.trim() ? 0 : 1],
            ['glossary part of speech', pkg.glossary.filter((g) => g.pos === TODO).length],
            ['glossary definition', pkg.glossary.filter((g) => g.definition === TODO).length],
            ['glossary example', pkg.glossary.filter((g) => g.example === TODO).length],
            ['MCQ evidence', mcq.filter((q) => q.evidence === TODO).length],
            ['SAQ answer', saq.filter((q) => q.answer === TODO).length],
            ['fill answer', pkg.activities.vocabFill.filter((f) => f.answer === TODO).length],
            ['picture prompt', pkg.images.filter((i) => i.prompt === TODO).length],
        ];
        const left = todo.filter(([, n]) => n > 0).map(([name, n]) => `${name} (${n})`);
        checks.push(check('todo', 'Nothing left to write', left.length ? [`to write: ${left.join(', ')}`] : []));
    }

    return { lesson: pkg.meta.lesson, title: pkg.meta.title, checks, text };
}
