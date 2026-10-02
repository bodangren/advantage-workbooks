import fs from 'fs';
import path from 'path';
import { CONTENT_ROOT, REPO_ROOT, loadPackageFolder } from '../lib/lesson-package/files';
import { checkContextFor } from '../lib/lesson-package/context';
import { articleBag, cosine } from '../lib/lesson-package/similarity';
import type { LessonPackage } from '../lib/lesson-package/schema';

const USAGE = `Checks across the packages of levels 1–4 (track level_banks_20261002) that the one-package
check cannot do.

Usage: npx tsx scripts/qa-packages.ts [--min <similarity>] [--top <n>]

  ERROR  two packages with the same title at one level
  ERROR  two packages that replace the same old article, or a package that replaces an article
         on the delete list (data/duplicates-levels-1-4.json)
  ERROR  an MCQ whose answer is not exactly one of its options, or with two equal options
  ERROR  an MCQ option with stray punctuation (an odd count of quotation marks, or an end comma,
         colon, or semicolon)
  ERROR  a workbook "recycle" word that no earlier lesson glosses
  WARN   two packages of one level with a text similarity of --min or more (default 0.45);
         at least one of them is new (not printed)
  WARN   an MCQ answer that is much longer than the other options (a giveaway)

It prints the --top (default 8) most similar pairs of each level, and the package count per level.
Exit code 1 when there is an ERROR.`;

const FOLDERS = ['origins-1', 'origins-2', 'origins-3.1', 'origins-3.2', 'quest-4', 'bank-1', 'bank-2', 'bank-3', 'bank-4'];
const PRINTED = new Set(['origins-2', 'origins-3.1']);

interface Item {
    pkg: LessonPackage;
    label: string;
    isNew: boolean;
}

/** An end comma, colon, or semicolon (also inside a closing quotation mark), or a start mark. */
const STRAY = /[,;:]["”]?$|^[,;:.]/;
const QUOTES = /["“”]/g;

function mcqProblems(p: LessonPackage): { errors: string[]; warns: string[] } {
    const errors: string[] = [];
    const warns: string[] = [];
    for (const q of p.bank.mcq) {
        const matches = q.options.filter((o) => o === q.answer).length;
        if (matches !== 1) errors.push(`${q.id}: the answer is ${matches} times in the options`);
        const lower = q.options.map((o) => o.trim().toLowerCase());
        if (new Set(lower).size !== lower.length) errors.push(`${q.id}: two options are equal`);
        // Quoted speech ("Try again.") is a good option; an odd count of quotation marks is not.
        for (const o of q.options) if (STRAY.test(o.trim()) || o !== o.trim() || (o.match(QUOTES) ?? []).length % 2) errors.push(`${q.id}: option ${JSON.stringify(o)} has stray punctuation or space`);
        const others = q.options.filter((o) => o !== q.answer);
        const longest = Math.max(...others.map((o) => o.length));
        if (others.length && q.answer.length > 1.6 * longest && q.answer.length - longest > 8) warns.push(`${q.id}: the answer (${q.answer.length} chars) is much longer than the other options (${longest} max)`);
    }
    return { errors, warns };
}

function main(argv: string[]): number {
    if (argv.includes('--help')) {
        console.log(USAGE);
        return 0;
    }
    const minAt = argv.indexOf('--min');
    const min = minAt >= 0 ? Number(argv[minAt + 1]) : 0.45;
    const topAt = argv.indexOf('--top');
    const top = topAt >= 0 ? Number(argv[topAt + 1]) : 8;
    const errors: string[] = [];
    const warns: string[] = [];
    const items: Item[] = [];
    for (const folder of FOLDERS) {
        for (const f of loadPackageFolder(path.join(CONTENT_ROOT, folder))) {
            if (!f.pkg) {
                errors.push(`${folder}/${path.basename(f.file)}: does not parse (${f.error})`);
                continue;
            }
            items.push({ pkg: f.pkg, label: `${folder}/${path.basename(f.file, '.json')}`, isNew: !PRINTED.has(folder) });
        }
    }

    // Old articles: one package per id, and never an id that the delete script deletes.
    const dup = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs/content-plans/data/duplicates-levels-1-4.json'), 'utf8')) as { groups: { keep: string; articles: { id: string }[] }[] };
    const toDelete = new Set(dup.groups.flatMap((g) => g.articles.map((a) => a.id).filter((id) => id !== g.keep)));
    const byOld = new Map<string, string[]>();
    for (const it of items) {
        const old = it.pkg.meta.replaces ?? it.pkg.meta.printed?.articleId ?? it.pkg.db.legacy?.articleId;
        if (!old) continue;
        byOld.set(old, [...(byOld.get(old) ?? []), it.label]);
        if (toDelete.has(old)) errors.push(`${it.label}: replaces ${old}, which is on the delete list`);
    }
    for (const [old, labels] of byOld) if (labels.length > 1) errors.push(`${labels.join(', ')}: all use the old article ${old}`);

    // MCQ options and recycled words.
    for (const it of items.filter((i) => i.isNew)) {
        const m = mcqProblems(it.pkg);
        errors.push(...m.errors.map((e) => `${it.label} ${e}`));
        warns.push(...m.warns.map((w) => `${it.label} ${w}`));
        if (it.pkg.meta.role === 'workbook' && it.pkg.text.recycle.length) {
            const prior = new Set(checkContextFor(it.pkg).prior.flatMap((l) => l.glossed.map((g) => g.toLowerCase())));
            const missing = it.pkg.text.recycle.filter((w) => !prior.has(w.toLowerCase()));
            if (missing.length) errors.push(`${it.label}: recycle word(s) that no earlier lesson glosses: ${missing.join(', ')}`);
        }
    }

    // Per level: titles, similarity, counts.
    const counts: string[] = [];
    for (const level of [1, 2, 3, 4]) {
        const lv = items.filter((i) => i.pkg.meta.raLevel === level);
        counts.push(`level ${level}: ${lv.length} packages (${lv.filter((i) => i.isNew).length} new)`);
        const titles = new Map<string, string[]>();
        for (const it of lv) {
            const t = it.pkg.meta.title.trim().toLowerCase();
            titles.set(t, [...(titles.get(t) ?? []), it.label]);
        }
        for (const [t, labels] of titles) if (labels.length > 1) errors.push(`level ${level}: title "${t}" in ${labels.join(', ')}`);
        // "says" becomes "say" after the plural rule and escapes the stop list. similarity.ts stays
        // as it is, so that plan-dedup.ts gives the same groups again; this check drops "say" here.
        const bags = lv.map((it) => {
            const b = articleBag({ title: it.pkg.meta.title, summary: it.pkg.text.summary, passage: it.pkg.text.paragraphs.join('\n') });
            b.delete('say');
            return b;
        });
        const pairs: { a: Item; b: Item; s: number }[] = [];
        for (let i = 0; i < lv.length; i++) {
            for (let j = i + 1; j < lv.length; j++) {
                if (!lv[i].isNew && !lv[j].isNew) continue;
                pairs.push({ a: lv[i], b: lv[j], s: cosine(bags[i], bags[j]) });
            }
        }
        pairs.sort((x, y) => y.s - x.s);
        for (const p of pairs.filter((p) => p.s >= min)) warns.push(`level ${level}: similarity ${p.s.toFixed(2)} ${p.a.label} "${p.a.pkg.meta.title}" ~ ${p.b.label} "${p.b.pkg.meta.title}"`);
        if (pairs.length) {
            console.log(`\n== Level ${level}: most similar pairs`);
            for (const p of pairs.slice(0, top)) console.log(`  ${p.s.toFixed(2)}  ${p.a.label} "${p.a.pkg.meta.title}" ~ ${p.b.label} "${p.b.pkg.meta.title}"`);
        }
    }

    console.log(`\n== Counts\n${counts.map((c) => `  ${c}`).join('\n')}`);
    console.log(`\n== ${errors.length} error(s)`);
    for (const e of errors) console.log(`  ERROR ${e}`);
    console.log(`\n== ${warns.length} warning(s)`);
    for (const w of warns) console.log(`  WARN  ${w}`);
    return errors.length ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
